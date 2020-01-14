import Player from '@/mka/Player';
import Ticker from '@/mka/Ticker';
import { clamp, rand } from '@/utils/misc';
import { Camera, Vector3 } from 'three';

const tempDirection = new Vector3();
const ROTATION_DURATION = 5000;
const ROTATION_MAX_INTERVAL = 3000;
const ROTATION_MIN_INTERVAL = 1000;
const ROTATION_MAX_ANGLE = Math.PI / 6;
const MAX_SPEED = 0.5;

const enum State {Idle, Forward, Backward}

export default class CameraPlayer extends Player {
    speed = 0.01;

    rotationEnabled = false;

    targetAngleX = 0;
    targetAngleY = 0;

    state = State.Idle;
    nextTime = 0;
    startTime = 0;

    attach() {
        this.mka!.on('we:cameraSpeed', this.speedUpdate, this)
            .on('we:cameraRotation', this.rotationUpdate, this);
    }

    detach() {
        this.mka!.off('we:cameraSpeed', this.speedUpdate)
            .off('we:cameraRotation', this.rotationUpdate);
    }

    speedUpdate(speed: number) {
        this.speed = MAX_SPEED * clamp(speed / 100, 0, 1);
    }

    rotationUpdate(enabled: boolean) {
        this.rotationEnabled = enabled;
    }

    updateAngle(camera: Camera) {
        if (this.state === State.Idle) {
            if (this.rotationEnabled && Ticker.now > this.nextTime) {
                this.state = State.Forward;
                this.startTime = performance.now();
            }
        } else {
            const t = clamp((Ticker.now - this.startTime) / ROTATION_DURATION, 0, 1);
            const sqt = t ** 2;
            const blend = sqt / (2 * (sqt - t) + 1);

            if (this.state === State.Forward) {
                camera.rotation.x = this.targetAngleX * blend;
                camera.rotation.y = this.targetAngleY * blend;

                if (t >= 1) {
                    this.state = State.Backward;
                    this.startTime = Ticker.now;
                }
            } else {
                camera.rotation.x = this.targetAngleX * (1 - blend);
                camera.rotation.y = this.targetAngleY * (1 - blend);

                if (t >= 1) {
                    this.state = State.Idle;
                    this.nextTime = Ticker.now + rand(ROTATION_MIN_INTERVAL, ROTATION_MAX_INTERVAL);

                    this.targetAngleX = Math.sign(-camera.position.y || 1) * Math.random() * ROTATION_MAX_ANGLE;
                    this.targetAngleY = Math.sign(camera.position.x || 1) * Math.random() * ROTATION_MAX_ANGLE;
                }
            }
        }
    }

    update(): boolean {
        this.mka!.camera.getWorldDirection(tempDirection);
        tempDirection.multiplyScalar(this.speed * Ticker.delta);
        this.mka!.camera.position.add(tempDirection);

        this.updateAngle(this.mka!.camera);

        return true;
    }
}
