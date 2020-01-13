import Player from '@/mka/Player';
import Ticker from '@/mka/Ticker';

export default class CameraPlayer extends Player {

    constructor() {
        super();
    }

    update(): boolean {
        this.mka!.camera.position.z -= 0.01 * Ticker.delta;

        return true;
    }
}
