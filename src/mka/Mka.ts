import { VIEW_DISTANCE } from '@/constants';
import autobind from 'autobind-decorator';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import Player, { InternalPlayer } from './Player';
import Ticker from './Ticker';

const TAG = '[Mka]';

export default class Mka {
    private _paused = false;

    get paused() {
        return this._paused;
    }

    private readonly players: { [name: string]: InternalPlayer } = {};

    renderer = new WebGLRenderer({ canvas: this.canvas, antialias: true });
    scene = new Scene();
    camera = new PerspectiveCamera(75, 1, 0.1, VIEW_DISTANCE);

    /**
     * ID returned by `requestAnimationFrame()`
     */
    private rafId = 0;

    constructor(readonly canvas: HTMLCanvasElement) {
        window.addEventListener('resize', this.resize, { passive: true });
        this.resize();

        this.rafId = requestAnimationFrame(this.tick);
    }

    @autobind
    resize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    addPlayer(name: string, player: Player, enabled = true) {
        if (this.players[name]) {
            console.log(TAG, `Player "${name}" already exists, ignored.`);
            return;
        }

        this.players[name] = player;
        this.players[name].mka = this;
        player.attach();

        if (enabled) {
            this.enablePlayer(name);
        }
    }

    getPlayer(name: string) {
        return this.players[name] as Player;
    }

    enablePlayer(name: string) {
        const player = this.players[name];

        if (player && !player.enabled) {
            player.enabled = true;
            player.enable();
        }
    }

    disablePlayer(name: string) {
        const player = this.players[name];

        if (player && player.enabled) {
            player.enabled = false;
            player.disable();
        }
    }

    @autobind
    private tick(now: DOMHighResTimeStamp) {
        if (!this._paused) {
            if (Ticker.tick(now)) {
                this.forEachPlayer(player => {
                    if (player.enabled && !player.paused) {
                        player.update();
                    }
                });

                this.renderer.render(this.scene, this.camera);
            }
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    pause() {
        this._paused = true;
        cancelAnimationFrame(this.rafId);

        this.forEachPlayer(player => {
            if (player.enabled) {
                player.paused = true;
                player.pause();
            }
        });
    }

    resume() {
        this._paused = false;

        this.forEachPlayer(player => {
            if (player.enabled) {
                player.paused = false;
                player.resume();
            }
        });

        requestAnimationFrame(this.tick);
    }

    forEachPlayer(fn: (player: InternalPlayer, name: string) => void) {
        for (const [name, player] of Object.entries(this.players)) {
            try {
                fn(player, name);
            } catch (e) {
                console.error(TAG, `(${name})`, e);
            }
        }
    }

    destroy() {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }

        Object.entries(this.players).forEach(([name, player]) => {
            // don't break the loop when error occurs
            try {
                player.destroy();
            } catch (e) {
                console.error(TAG, e.message, e.stack);
            }
        });
    }
}
