import { VIEW_DISTANCE, VIEW_RADIUS } from '@/constants';
import Player from '@/mka/Player';
import { clamp, rand } from '@/utils/misc';
import { add as addAudioListener, remove as removeAudioListener, volumeOf } from '@/we/audio-listener';
import debounce from 'lodash/debounce';
import frag from 'raw-loader!@/shaders/tile.frag';
import vert from 'raw-loader!@/shaders/tile.vert';
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Material,
    Mesh,
    ShaderMaterial,
    Uint8BufferAttribute,
    Vector3,
} from 'three';

const MAX_AMOUNT = 100000;
const SIZE = 2.4;
const PULSE_GROW = 0.22;
const GROW_FILTER_STRENGTH = 1.5;
const MAX_ANGLE = 1.5;
const MIN_BRIGHTNESS = 0.5 * 255;
const MAX_BRIGHTNESS = 0.9 * 255;
const CAMERA_CLIP_DISTANCE = SIZE * 2;

const COLORS = Array(10).fill(0).map(() => {
    let r = 0, g = 0, b = 0, brightness = 0;

    do {
        r = rand(0, 255);
        g = rand(0, 255);
        b = rand(0, 255);
        brightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
    } while (brightness < MIN_BRIGHTNESS || brightness > MAX_BRIGHTNESS);

    return [
        // repeat 4 times for vertices
        r, g, b,
        r, g, b,
        r, g, b,
        r, g, b,
    ];
});

export default class TilesPlayer extends Player {
    tiles?: Mesh;

    size = SIZE;
    grow = 0;
    number = 0; // don't create until the number is set

    attach() {
        this.setup();

        this.mka!.on('we:tilesNumber', this.setNumber, this)
            .on('we:audio', this.setAudioResponsive, this);
    }

    detach() {
        this.mka!.off('we:tilesNumber', this.setNumber)
            .off('we:audio', this.setAudioResponsive);
    }

    setNumber = debounce((number: number) => {
        number = clamp(number, 0, MAX_AMOUNT);

        if (number !== this.number) {
            this.number = number;

            this.destroyTiles();
            this.setup();
        }
    }, 500);

    setAudioResponsive(enabled: boolean) {
        if (enabled) {
            addAudioListener(this.audioUpdate, this);
        } else {
            removeAudioListener(this.audioUpdate);
        }
    }

    setup() {
        if (this.number <= 0 || this.tiles) {
            return;
        }

        console.time('createTiles');
        this.createTiles();
        console.timeEnd('createTiles');

        if (this.mka) {
            this.mka.scene.add(this.tiles!);
        }
    }

    createTiles() {
        const size = this.size;
        const viewRadiusSquare = VIEW_RADIUS ** 2;
        const rotationAxis = new Vector3(1, 0, 0);
        const tempVertex = new Vector3();

        const indices: number[] = [];
        const vertices: number[] = [];
        const directions: number[] = [];
        const colors: number[] = [];

        let x: number;
        let y: number;
        let z: number;
        let angle: number;
        let offset: number;

        function addDirection(x: number, y: number, z: number, offsetX: number, offsetY: number, angle: number) {
            tempVertex.set(offsetX, offsetY, 0);
            tempVertex.applyAxisAngle(rotationAxis, angle);
            directions.push(tempVertex.x, tempVertex.y, tempVertex.z);
            vertices.push(tempVertex.x * size + x, tempVertex.y * size + y, tempVertex.z * size + z);
        }

        const zPositions: number[] = [];

        for (let i = 0; i < this.number; i++) {
            zPositions[i] = rand(-VIEW_DISTANCE, 0);
        }

        // sort vertices by z position
        zPositions.sort((a, b) => a - b);

        for (let i = 0; i < this.number; i++) {
            offset = i * 4;

            indices.push(
                offset, offset + 1, offset + 2,
                offset + 2, offset + 1, offset + 3,
            );

            do {
                x = rand(-VIEW_RADIUS, VIEW_RADIUS);
                y = rand(-VIEW_RADIUS, VIEW_RADIUS);
            } while (x ** 2 + y ** 2 > viewRadiusSquare);

            z = zPositions[i];

            angle = rand(0, MAX_ANGLE);

            addDirection(x, y, z, -0.5, -0.5, angle);
            addDirection(x, y, z, 0.5, -0.5, angle);
            addDirection(x, y, z, -0.5, 0.5, angle);
            addDirection(x, y, z, 0.5, 0.5, angle);

            colors.push(...COLORS[~~rand(0, COLORS.length)]);
        }

        const geometry = new BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('direction', new Float32BufferAttribute(directions, 3));
        geometry.setAttribute('color', new Uint8BufferAttribute(colors, 3, true));

        const material = new ShaderMaterial({
            uniforms: {
                grow: { value: this.grow },
                far: { value: VIEW_DISTANCE },
            },
            vertexShader: vert,
            fragmentShader: frag,
            side: DoubleSide,
            transparent: true,
        });

        this.tiles = new Mesh(geometry, material);
    }

    destroyTiles() {
        if (this.tiles) {
            this.tiles.geometry.dispose();
            (this.tiles.material as Material).dispose();

            if (this.mka) {
                this.mka.scene.remove(this.tiles);
            }

            this.tiles = undefined;
        }
    }

    audioUpdate(audioSamples: number[]) {
        this.grow += (volumeOf(audioSamples) * PULSE_GROW - this.grow) / GROW_FILTER_STRENGTH;
    }

    update(): boolean {
        if (this.tiles) {
            const positions = (this.tiles.geometry as BufferGeometry).attributes.position as BufferAttribute;
            const positionsArray = positions.array as number[];
            const clippingZ = this.mka!.camera.position.z + CAMERA_CLIP_DISTANCE;

            for (let i = positionsArray.length - 1; i >= 0; i -= 3 * 4) {
                if (positionsArray[i] > clippingZ) {
                    positionsArray[i] -= VIEW_DISTANCE;
                    positionsArray[i - 3] -= VIEW_DISTANCE;
                    positionsArray[i - 6] -= VIEW_DISTANCE;
                    positionsArray[i - 9] -= VIEW_DISTANCE;
                    positions.needsUpdate = true;
                }
            }

            this.tiles.geometry.computeBoundingSphere();

            (this.tiles.material as ShaderMaterial).uniforms.grow.value = this.grow;
        }

        return true;
    }

    destroy() {
        this.destroyTiles();
        this.setAudioResponsive(false);
    }
}
