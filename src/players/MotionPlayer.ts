import { VIEW_RADIUS } from '@/constants';
import Player from '@/mka/Player';
import Ticker from '@/mka/Ticker';
import { clamp, rand } from '@/utils/misc';
import { Camera, Vector3 } from 'three';

const tempDirection = new Vector3();
const ROTATION_DURATION = 10000;
const ROTATION_MAX_INTERVAL = 30000;
const ROTATION_MIN_INTERVAL = 5000;
const ROTATION_MAX_ANGLE = Math.PI / 12;
const ROTATION_MAX_OFFSET_RATIO = 0.5;
const MAX_SPEED = 0.1;

const enum State {Idle, Forward, Backward}

export default class CameraPlayer extends Player {
    speed = 0.01;

    rotationEnabled = false;

    targetAngleX = 0;
    targetAngleY = 0;

    rotationState = State.Idle;
    rotationNextTime = 0;
    rotationStartTime = 0;

    constructor(readonly camera: Camera) {
        super();
    }

    attach() {
        this.mka!.on('we:cameraSpeed', this.speedUpdate, this)
            .on('we:cameraRotation', this.setRotation, this);
    }

    detach() {
        this.rotationState = State.Idle;
        this.mka!.off('we:cameraSpeed', this.speedUpdate)
            .off('we:cameraRotation', this.setRotation);
    }

    resume() {
        this.rotationStartTime += Ticker.elapsedSincePause;
        this.rotationNextTime += Ticker.elapsedSincePause;
    }

    speedUpdate(speed: number) {
        this.speed = MAX_SPEED * clamp(speed / 100, 0, 1);

        if (this.rotationState === State.Forward) {
            // turn back immediately so it won't go beyond the range when increasing the speed
            this.rotationState = State.Backward;
            this.targetAngleX = this.camera.rotation.x;
            this.targetAngleY = this.camera.rotation.y;
            this.rotationStartTime = Ticker.now;
        }
    }

    setRotation(enabled: boolean) {
        this.rotationEnabled = enabled;

        if (enabled) {
            // postpone rotation if this is the first time
            if (this.rotationNextTime === 0) {
                this.rotationNextTime = Ticker.now + rand(ROTATION_MIN_INTERVAL, ROTATION_MAX_INTERVAL);
            } else {
                this.rotationNextTime = Ticker.now;
            }
        } else {
            this.rotationState = State.Idle;

            this.camera.position.x = 0;
            this.camera.position.y = 0;
            this.camera.rotation.x = 0;
            this.camera.rotation.y = 0;
        }
    }

    calculateAngle() {
        // generate a random point in view circle
        // https://programming.guide/random-point-within-circle.html
        const a = Math.PI * 2 * Math.random();
        const r = VIEW_RADIUS * ROTATION_MAX_OFFSET_RATIO * Math.sqrt(Math.random());

        const targetX = r * Math.cos(a);
        const targetY = r * Math.sin(a);

        const angleX = Math.atan((targetY - this.camera.position.y) / (this.speed * ROTATION_DURATION));
        const angleY = -Math.atan((targetX - this.camera.position.x) / (this.speed * ROTATION_DURATION));

        this.targetAngleX = clamp(angleX, -ROTATION_MAX_ANGLE, ROTATION_MAX_ANGLE);
        this.targetAngleY = clamp(angleY, -ROTATION_MAX_ANGLE, ROTATION_MAX_ANGLE);
    }

    updateAngle() {
        if (this.rotationState === State.Idle) {
            if (this.rotationEnabled && Ticker.now > this.rotationNextTime) {
                this.rotationState = State.Forward;
                this.rotationStartTime = Ticker.now;

                this.calculateAngle();
            }
        } else {
            const t = clamp((Ticker.now - this.rotationStartTime) / ROTATION_DURATION, 0, 1);
            const sqt = t ** 2;
            const blend = sqt / (2 * (sqt - t) + 1);

            if (this.rotationState === State.Forward) {
                this.camera.rotation.x = this.targetAngleX * blend;
                this.camera.rotation.y = this.targetAngleY * blend;

                if (t >= 1) {
                    this.rotationState = State.Backward;
                    this.rotationStartTime = Ticker.now;
                }
            } else {
                this.camera.rotation.x = this.targetAngleX * (1 - blend);
                this.camera.rotation.y = this.targetAngleY * (1 - blend);

                if (t >= 1) {
                    this.rotationState = State.Idle;
                    this.rotationNextTime = Ticker.now + rand(ROTATION_MIN_INTERVAL, ROTATION_MAX_INTERVAL);
                }
            }
        }
    }

    update(): boolean {
        this.camera.getWorldDirection(tempDirection);
        tempDirection.multiplyScalar(this.speed * Ticker.delta);
        this.camera.position.add(tempDirection);

        this.updateAngle();

        return true;
    }
}
