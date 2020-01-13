import { VIEW_DISTANCE, VIEW_SIZE } from '@/constants';
import Player from '@/mka/Player';
import { rand } from '@/utils';
import { add as addAudioListener, remove as removeAudioListener, volumeOf } from '@/we/audio-listener';
import frag from 'raw-loader!@/shaders/tile.frag';
import vert from 'raw-loader!@/shaders/tile.vert';
import {
    BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    Mesh,
    ShaderMaterial,
    Uint8BufferAttribute,
    Vector3,
} from 'three';

const AMOUNT = 5000;
const SIZE = 2.4;
const PULSE_SCALE = 0.22;
const SIZE_FILTER_STRENGTH = 1.5;
const MAX_ANGLE = 1.5;

const COLORS = Array(10).fill(0).map(() => {
    const rgb = [rand(0, 255), rand(0, 255), rand(0, 255)];
    return [].concat(...Array(4).fill(rgb));
});

export default class TilesPlayer extends Player {

    tiles?: Mesh;

    size = SIZE;

    constructor() {
        super();

        addAudioListener(this.audioUpdate, this);
    }

    attach() {
        this.setup();
    }

    setup() {
        console.time('createTiles');
        this.createTiles();
        console.timeEnd('createTiles');

        if (this.mka) {
            this.mka.scene.add(this.tiles!);
        }
    }

    createTiles() {
        const viewRadiusSquare = VIEW_SIZE ** 2;
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

        function addDirection(offsetX: number, offsetY: number, offsetZ: number, angle: number) {
            tempVertex.set(offsetX, offsetY, offsetZ);
            tempVertex.applyAxisAngle(rotationAxis, angle);
            directions.push(tempVertex.x, tempVertex.y, tempVertex.z);
        }

        for (let i = 0; i < AMOUNT; i++) {
            offset = i * 4;

            indices.push(
                offset, offset + 1, offset + 2,
                offset + 2, offset + 1, offset + 3,
            );

            do {
                x = rand(-VIEW_SIZE, VIEW_SIZE);
                y = rand(-VIEW_SIZE, VIEW_SIZE);
            } while (x ** 2 + y ** 2 > viewRadiusSquare);

            z = rand(-VIEW_DISTANCE, 0);

            vertices.push(
                x, y, z,
                x, y, z,
                x, y, z,
                x, y, z,
            );

            angle = rand(0, MAX_ANGLE);

            addDirection(-0.5, -0.5, 0, angle);
            addDirection(0.5, -0.5, 0, angle);
            addDirection(-0.5, 0.5, 0, angle);
            addDirection(0.5, 0.5, 0, angle);

            colors.push(...COLORS[~~rand(0, COLORS.length)]);
        }

        const geometry = new BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('direction', new Float32BufferAttribute(directions, 3));
        geometry.setAttribute('color', new Uint8BufferAttribute(colors, 3, true));

        const material = new ShaderMaterial({
            uniforms: {
                size: { value: this.size },
            },
            vertexShader: vert,
            fragmentShader: frag,
        });

        this.tiles = new Mesh(geometry, material);
    }

    audioUpdate(audioSamples: number[]) {
        this.size += ((volumeOf(audioSamples) * PULSE_SCALE + 1) * SIZE - this.size) / SIZE_FILTER_STRENGTH;
    }

    update(): boolean {
        if (this.tiles) {
            const positions = (this.tiles.geometry as BufferGeometry).attributes.position as BufferAttribute;
            const positionsArray = positions.array as number[];
            const cameraZ = this.mka!.camera.position.z;

            for (let i = positionsArray.length - 1; i >= 0; i -= 3 * 4) {
                if (positionsArray[i] > cameraZ) {
                    positionsArray[i] -= VIEW_DISTANCE;
                    positionsArray[i - 3] -= VIEW_DISTANCE;
                    positionsArray[i - 6] -= VIEW_DISTANCE;
                    positionsArray[i - 9] -= VIEW_DISTANCE;
                    positions.needsUpdate = true;
                }
            }

            this.tiles.geometry.computeBoundingSphere();

            (this.tiles.material as ShaderMaterial).uniforms.size.value = this.size;
        }

        return true;
    }

    destroy() {
        removeAudioListener(this.audioUpdate);
    }
}
