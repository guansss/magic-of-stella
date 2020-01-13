import Player from '@/mka/Player';
import Ticker from '@/mka/Ticker';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls';

export default class CameraPlayer extends Player {

    controls?: FirstPersonControls;

    constructor() {
        super();
    }

    attach() {
        this.setup();
    }

    setup() {
        if (this.mka) {
            this.controls = new FirstPersonControls(this.mka.camera, document.body);

            this.controls.movementSpeed = 0.01;
            this.controls.lookSpeed = 0.0001;
            this.controls.lookVertical = true;
        }
    }

    update(): boolean {
        this.controls?.update(Ticker.delta);

        return true;
    }
}
