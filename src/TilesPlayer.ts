import { VIEW_DISTANCE, VIEW_SIZE } from '@/constants';
import Player from '@/mka/Player';
import { rand } from '@/utils';
import frag from 'raw-loader!./shaders/tile.frag';
import vert from 'raw-loader!./shaders/tile.vert';
import {
    BufferAttribute,
    BufferGeometry,
    Float32BufferAttribute,
    Matrix4,
    Mesh,
    ShaderMaterial,
    Uint8BufferAttribute,
} from 'three';

const AMOUNT = 5000;
const SIZE = 2;
const MAX_ROTATION = 0.5;

const COLORS = Array(10).fill(0).map(() => {
    const rgb = [rand(0, 255), rand(0, 255), rand(0, 255)];
    return [].concat(...Array(4).fill(rgb));
});

export default class TilesPlayer extends Player {

    tiles?: Mesh;

    constructor() {
        super();
    }

    attach() {
        this.setup();
    }

    setup() {
        this.createTiles();

        if (this.mka) {
            this.mka.scene.add(this.tiles!);
        }
    }

    createTiles() {
        const indices: number[] = [];
        const vertices: number[] = [];
        const transforms: number[] = [];
        const colors: number[] = [];

        let x: number;
        let y: number;
        let z: number;
        let transform: Matrix4;
        let offset: number;

        for (let i = 0; i < AMOUNT; i++) {
            offset = i * 4;

            x = rand(-VIEW_SIZE, VIEW_SIZE);
            y = rand(-VIEW_SIZE, VIEW_SIZE);
            z = rand(-VIEW_DISTANCE, 0);

            vertices.push(
                x, y, z,
                x + SIZE, y, z,
                x, y + SIZE, z,
                x + SIZE, y + SIZE, z,
            );

            indices.push(
                offset, offset + 1, offset + 2,
                offset + 2, offset + 1, offset + 3,
            );

            transform = new Matrix4();
            transforms.push(...transform.elements);

            colors.push(...COLORS[~~rand(0, COLORS.length)]);
        }

        const geometry = new BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('transform', new Float32BufferAttribute(transforms, 16));
        geometry.setAttribute('color', new Uint8BufferAttribute(colors, 3, true));

        const material = new ShaderMaterial({
            uniforms: {
                size: { value: 1 },
            },
            vertexShader: vert,
            fragmentShader: frag,
        });

        this.tiles = new Mesh(geometry, material);
    }

    update(): boolean {
        if (this.tiles) {
            const positions = (this.tiles.geometry as BufferGeometry).attributes.position as BufferAttribute;
            const positionsArray = positions.array as number[];
            const cameraZ = this.mka!.camera.position.z;

            for (let i = positionsArray.length - 1; i >= 0; i -= 3) {
                if (positionsArray[i] > cameraZ) {
                    positionsArray[i] -= VIEW_DISTANCE;
                    positions.needsUpdate = true;
                }
            }

            this.tiles.geometry.computeBoundingSphere();
        }

        return true;
    }
}
