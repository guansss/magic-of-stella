import Player from '@/mka/Player';
import { rand, randomColor } from '@/utils';
import { Mesh, MeshBasicMaterial, Shape, ShapeBufferGeometry } from 'three';

const AMOUNT = 100;
const MAX_SIZE = 8;
const MIN_SIZE = 4;
const MAX_ROTATION = 0.5;

export default class TilesPlayer extends Player {

    tiles: Mesh[] = [];

    constructor() {
        super();

    }

    attach() {
        this.setup();
    }

    setup() {
        for (let i = 0; i < AMOUNT; i++) {
            const tile = this.createTile();

            this.tiles.push(tile);
        }

        if (this.mka) {
            this.mka.scene.add(...this.tiles);
        }
    }

    createTile(): Mesh {
        const size = rand(MIN_SIZE, MAX_SIZE);

        const shape = new Shape()
            .moveTo(0, 0)
            .lineTo(0, size)
            .lineTo(size, size)
            .lineTo(size, 0)
            .lineTo(0, 0);

        const geometry = new ShapeBufferGeometry(shape);
        const material = new MeshBasicMaterial({ color: randomColor() });
        const mesh = new Mesh(geometry, material);

        mesh.position.set(rand(-50, 50), rand(-50, 50), rand(-100, 0));
        mesh.rotation.set(rand(-MAX_ROTATION, MAX_ROTATION), rand(-MAX_ROTATION, MAX_ROTATION), 0);

        return mesh;
    }

    update(): boolean {
        return true;
    }
}
