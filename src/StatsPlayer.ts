import Player from '@/mka/Player';
// @ts-ignore
import Stats from 'stats.js';

export default class CameraPlayer extends Player {
    stats = new Stats();

    constructor() {
        super();

        this.stats.showPanel(0);
        document.body.appendChild(this.stats.dom);
    }

    update(): boolean {
        this.stats.update();
        return false;
    }
}
