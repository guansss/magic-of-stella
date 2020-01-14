import { VIEW_RADIUS } from '@/constants';
import Player from '@/mka/Player';
import Ticker from '@/mka/Ticker';
import { clamp, rand } from '@/utils/misc';
import { Camera, Vector3 } from 'three';

const tempDirection = new Vector3();
const ROTATION_DURATION = 5000;
const ROTATION_MAX_INTERVAL = 8000;
const ROTATION_MIN_INTERVAL = 2000;
const ROTATION_MAX_ANGLE = Math.PI / 6;
const ROTATION_MAX_OFFSET_RATIO = 0.5;
const MAX_SPEED = 0.1;

const enum State {Idle, Forward, Backward}

export default class CameraPlayer extends Player {
    speed = 0.01;

    rotationEnabled = false;

    targetAngleX = 0;
    targetAngleY = 0;

    rotationState = State.Idle;
    nextTime = 0;
    startTime = 0;

    attach() {
        this.mka!.on('we:cameraSpeed', this.speedUpdate, this)
            .on('we:cameraRotation', this.rotationUpdate, this);
    }

    detach() {
        this.rotationState = State.Idle;
        this.mka!.off('we:cameraSpeed', this.speedUpdate)
            .off('we:cameraRotation', this.rotationUpdate);
    }

    speedUpdate(speed: number) {
        this.speed = MAX_SPEED * clamp(speed / 100, 0, 1);

        if (this.rotationState === State.Forward) {
            // turn back immediately so it won't go beyond the range when increasing the speed
            this.rotationState = State.Backward;
            this.targetAngleX = this.mka!.camera.rotation.x;
            this.targetAngleY = this.mka!.camera.rotation.y;
            this.startTime = Ticker.now;
        }
    }

    rotationUpdate(enabled: boolean) {
        this.rotationEnabled = enabled;

        if (!enabled) {
            this.rotationState = State.Idle;

            if (this.mka) {
                this.mka.camera.position.x = 0;
                this.mka.camera.position.y = 0;
                this.mka.camera.rotation.x = 0;
                this.mka.camera.rotation.y = 0;
            }
        } else if (this.mka) {
            this.calculateAngle(this.mka.camera);
        }
    }

    calculateAngle(camera: Camera) {
        // generate a random point in view circle
        // https://programming.guide/random-point-within-circle.html
        const a = Math.PI * 2 * Math.random();
        const r = VIEW_RADIUS * ROTATION_MAX_OFFSET_RATIO * Math.sqrt(Math.random());

        const directionX = Math.sign(camera.position.x || rand(-1, 1));
        const directionY = Math.sign(camera.position.y || rand(-1, 1));

        const targetX = -directionX * r * Math.abs(Math.cos(a));
        const targetY = -directionY * r * Math.abs(Math.sin(a));

        const angleX = Math.atan((targetY - camera.position.y) / (this.speed * ROTATION_DURATION));
        const angleY = -Math.atan((targetX - camera.position.x) / (this.speed * ROTATION_DURATION));

        this.targetAngleX = clamp(angleX, -ROTATION_MAX_ANGLE, ROTATION_MAX_ANGLE);
        this.targetAngleY = clamp(angleY, -ROTATION_MAX_ANGLE, ROTATION_MAX_ANGLE);
    }

    updateAngle(camera: Camera) {
        if (this.rotationState === State.Idle) {
            if (this.rotationEnabled && Ticker.now > this.nextTime) {
                this.rotationState = State.Forward;
                this.startTime = performance.now();
            }
        } else {
            const t = clamp((Ticker.now - this.startTime) / ROTATION_DURATION, 0, 1);
            const sqt = t ** 2;
            const blend = sqt / (2 * (sqt - t) + 1);

            if (this.rotationState === State.Forward) {
                camera.rotation.x = this.targetAngleX * blend;
                camera.rotation.y = this.targetAngleY * blend;

                if (t >= 1) {
                    this.rotationState = State.Backward;
                    this.startTime = Ticker.now;
                }
            } else {
                camera.rotation.x = this.targetAngleX * (1 - blend);
                camera.rotation.y = this.targetAngleY * (1 - blend);

                if (t >= 1) {
                    this.rotationState = State.Idle;
                    this.nextTime = Ticker.now + rand(ROTATION_MIN_INTERVAL, ROTATION_MAX_INTERVAL);

                    this.calculateAngle(camera);
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
