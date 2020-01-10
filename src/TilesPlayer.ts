import { VIEW_DISTANCE, VIEW_SIZE } from '@/constants';
import Player from '@/mka/Player';
import { rand } from '@/utils';
import frag from 'raw-loader!./shaders/tile.frag';
import vert from 'raw-loader!./shaders/tile.vert';
import { BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, Uint8BufferAttribute } from 'three';

const AMOUNT = 4000;
const SIZE = 100;
const MAX_ROTATION = 0.5;

const COLORS = Array(10).fill(0).map(() => {
    const rgb = [rand(0, 255), rand(0, 255), rand(0, 255)];
    return [].concat(...Array(6).fill(rgb));
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
        const vertices: number[] = [];
        const colors: number[] = [];

        let x: number;
        let y: number;
        let z: number;
        let color: number[];

        for (let i = 0; i < AMOUNT; i++) {
            x = rand(-VIEW_SIZE, VIEW_SIZE);
            y = rand(-VIEW_SIZE, VIEW_SIZE);
            z = rand(-VIEW_DISTANCE, 0);
            color = COLORS[~~rand(0, COLORS.length)];

            vertices.push(
                x, y, z,
                x + SIZE, y, z,
                x, y + SIZE, z,

                x, y + SIZE, z,
                x + SIZE, y, z,
                x + SIZE, y + SIZE, z,
            );

            colors.push(...color);
        }

        const geometry = new BufferGeometry();

        const positionAttr = new Float32BufferAttribute(vertices, 3);
        const colorAttr = new Uint8BufferAttribute(colors, 3);
        colorAttr.normalized = true;

        geometry.setAttribute('position', positionAttr);
        geometry.setAttribute('color', colorAttr);

        const material = new ShaderMaterial({
            uniforms: {
                alpha: { value: 0.8 },
            },
            vertexShader: vert,
            fragmentShader: frag,
        });

        this.tiles = new Mesh(geometry, material);
    }

    update(): boolean {
        return true;
    }
}
