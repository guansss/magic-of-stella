import { VIEW_DISTANCE, VIEW_RADIUS } from '@/constants';
import Player from '@/mka/Player';
import frag from '@/rendering/tile.frag';
import vert from '@/rendering/tile.vert';
import { clamp, inWallpaperEngine, rand } from '@/utils/misc';
import { add as addAudioListener, remove as removeAudioListener, volumeOf } from '@/we/audio-listener';
import debounce from 'lodash/debounce';
import {
    BufferAttribute,
    BufferGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Material,
    Mesh,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    TypedArray,
    Uint8BufferAttribute,
    Vector3,
} from 'three';

const MAX_AMOUNT = 100000;
const SIZE = 2.4;
const PULSE_GROW = 0.28;
const GROW_FILTER_STRENGTH = 1.1;
const MAX_ANGLE = Math.PI / 3;
const MIN_BRIGHTNESS = 0.6 * 255;
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
    material = new ShaderMaterial({
        uniforms: {
            grow: { value: 0 },
            near: { value: this.camera.near },
            far: { value: this.camera.far },
        },
        vertexShader: vert,
        fragmentShader: frag,
        side: DoubleSide,
        transparent: true,
        flatShading: true,
        depthTest: false,
        depthWrite: false,
    });
    tiles?: Mesh;

    size = SIZE;
    grow = 0;
    number = 0; // don't create until the number is set

    vertexFront = 0; // the front index of vertices circular queue, representing the tile which is nearest to camera

    constructor(readonly scene: Scene, readonly camera: PerspectiveCamera) {
        super();

        addAudioListener(this.audioUpdate, this);
    }

    attach() {
        this.setup();

        this.mka!.on('we:tilesNumber', this.setNumber, this);
    }

    detach() {
        this.mka!.off('we:tilesNumber', this.setNumber);
    }

    setNumber = debounce((number: number) => {
        number = clamp(number, 0, MAX_AMOUNT);

        if (number !== this.number) {
            this.number = number;

            this.destroyTiles();
            this.setup();
        }
    }, 500);

    setup() {
        if (this.number <= 0 || this.tiles) {
            return;
        }

        if (inWallpaperEngine) {
            this.createTiles();
        } else {
            console.time('createTiles');
            this.createTiles();
            console.timeEnd('createTiles');
        }
    }

    createTiles() {
        const size = this.size;
        const viewRadiusSquare = VIEW_RADIUS ** 2;
        const rotationAxes = [new Vector3(1, 0, 0), new Vector3(0, 1, 0)];
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
        let axis: Vector3;

        function addDirection(x: number, y: number, z: number, offsetX: number, offsetY: number, axis: Vector3, angle: number) {
            tempVertex.set(offsetX, offsetY, 0);
            tempVertex.applyAxisAngle(axis, angle);
            directions.push(tempVertex.x, tempVertex.y, tempVertex.z);
            vertices.push(tempVertex.x * size + x, tempVertex.y * size + y, tempVertex.z * size + z);
        }

        const zPositions: number[] = [];

        for (let i = 0; i < this.number; i++) {
            zPositions[i] = rand(-VIEW_DISTANCE, 0);
        }

        // sort vertices by depth (Z position) in order of [far ... near] to let tiles be correctly blended
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

            // there's a small chance to rotate by Y axis
            axis = rotationAxes[Math.random() < 0.9 ? 0 : 1];
            angle = rand(-1, 1) * MAX_ANGLE;

            addDirection(x, y, z, -0.5, -0.5, axis, angle);
            addDirection(x, y, z, 0.5, -0.5, axis, angle);
            addDirection(x, y, z, -0.5, 0.5, axis, angle);
            addDirection(x, y, z, 0.5, 0.5, axis, angle);

            colors.push(...COLORS[~~rand(0, COLORS.length)]);
        }

        this.vertexFront = vertices.length - 1;

        const geometry = new BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('direction', new Float32BufferAttribute(directions, 3));
        geometry.setAttribute('color', new Uint8BufferAttribute(colors, 3, true));

        this.tiles = new Mesh(geometry, this.material);
        this.scene.add(this.tiles);
    }

    destroyTiles() {
        if (this.tiles) {
            this.tiles.geometry.dispose();
            (this.tiles.material as Material).dispose();

            this.scene.remove(this.tiles);
            this.tiles = undefined;
        }
    }

    audioUpdate(audioSamples: number[]) {
        this.grow += (volumeOf(audioSamples) * PULSE_GROW - this.grow) / GROW_FILTER_STRENGTH;
    }

    update(): boolean {
        if (this.tiles) {
            const indices = (this.tiles.geometry as BufferGeometry).index!;
            const vertices = (this.tiles.geometry as BufferGeometry).attributes.position as BufferAttribute;
            const indicesArray = indices.array as TypedArray;
            const verticesArray = vertices.array as TypedArray;
            const clippingZ = this.camera.position.z + CAMERA_CLIP_DISTANCE;
            const indicesPerTile = 3 * 2;
            const verticesPerTile = 3 * 4;

            let clippedTilesCount = 0;

            // start checking from the front index of vertices array, which is a circular queue
            let i = this.vertexFront;

            while (true) {
                if (verticesArray[i] > clippingZ) {
                    clippedTilesCount++;

                    // change Z position to the farthest
                    verticesArray[i] -= VIEW_DISTANCE;
                    verticesArray[i - 3] -= VIEW_DISTANCE;
                    verticesArray[i - 3 * 2] -= VIEW_DISTANCE;
                    verticesArray[i - 3 * 3] -= VIEW_DISTANCE;

                    vertices.needsUpdate = true;
                } else {
                    this.vertexFront = i;
                    break;
                }

                i -= verticesPerTile;

                if (i < 0) {
                    // return to array's end
                    i = verticesArray.length - 1;
                }
            }

            if (clippedTilesCount > 0) {
                const clipped = indicesArray.slice(indicesArray.length - clippedTilesCount * indicesPerTile);

                // move indices of the clipped tiles to array's beginning, for keeping the depth order in indices array
                indicesArray.copyWithin(clipped.length, 0);
                indicesArray.set(clipped, 0);

                indices.needsUpdate = true;
            }

            this.tiles.geometry.computeBoundingSphere();

            (this.tiles.material as ShaderMaterial).uniforms.grow.value = this.grow;
        }

        return true;
    }

    destroy() {
        this.destroyTiles();
        removeAudioListener(this.audioUpdate);
    }
}
