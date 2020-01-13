import { VIEW_DISTANCE, VIEW_SIZE } from '@/constants';
import Player from '@/mka/Player';
import { rand } from '@/utils';
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
const HALF_SIZE = 1.2;
const MAX_ANGLE = 1.5;

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

        const indices: number[] = [];
        const vertices: number[] = [];
        const colors: number[] = [];

        let x: number;
        let y: number;
        let z: number;
        let angle: number;
        let vertex = new Vector3();
        let offset: number;

        function addVertex(x: number, y: number, z: number, offsetX: number, offsetY: number, offsetZ: number, angle: number) {
            vertex.set(offsetX, offsetY, offsetZ);
            vertex.applyAxisAngle(rotationAxis, angle);
            vertices.push(vertex.x + x, vertex.y + y, vertex.z + z);
        }

        for (let i = 0; i < AMOUNT; i++) {
            offset = i * 4;

            do {
                x = rand(-VIEW_SIZE, VIEW_SIZE);
                y = rand(-VIEW_SIZE, VIEW_SIZE);
            } while (x ** 2 + y ** 2 > viewRadiusSquare);

            z = rand(-VIEW_DISTANCE, 0);
            angle = rand(0, MAX_ANGLE);

            addVertex(x, y, z, -HALF_SIZE, -HALF_SIZE, 0, angle);
            addVertex(x, y, z, HALF_SIZE, -HALF_SIZE, 0, angle);
            addVertex(x, y, z, -HALF_SIZE, HALF_SIZE, 0, angle);
            addVertex(x, y, z, HALF_SIZE, HALF_SIZE, 0, angle);

            indices.push(
                offset, offset + 1, offset + 2,
                offset + 2, offset + 1, offset + 3,
            );

            colors.push(...COLORS[~~rand(0, COLORS.length)]);
        }

        const geometry = new BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
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
        }

        return true;
    }
}
