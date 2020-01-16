import { VIEW_DISTANCE } from '@/constants';
import EventEmitter from '@/utils/EventEmitter';
import autobind from 'autobind-decorator';
import { DoubleSide, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import Player, { InternalPlayer } from './Player';
import Ticker from './Ticker';

const TAG = '[Mka]';

export default class Mka extends EventEmitter {
    private _paused = false;

    get paused() {
        return this._paused;
    }

    private readonly players: { [name: string]: InternalPlayer } = {};

    renderer = new WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        logarithmicDepthBuffer: true,
    });
    scene = new Scene();
    camera = new PerspectiveCamera(50, 1, 0.01, VIEW_DISTANCE);

    composer = new EffectComposer(this.renderer);
    fxaaPass = new ShaderPass(FXAAShader);

    /**
     * ID returned by `requestAnimationFrame()`
     */
    private rafId = 0;

    constructor(readonly canvas: HTMLCanvasElement) {
        super();

        window.addEventListener('resize', this.resize, { passive: true });
        this.resize();

        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.fxaaPass);

        const bokehPass = new BokehPass(this.scene, this.camera, {
            focus: 1400,
            aperture: 0.00002,
            maxblur: 1,
        });
        bokehPass.materialDepth.side = DoubleSide;
        bokehPass.materialBokeh.onBeforeCompile = shader => {
            // a hack to force the value of nearClip
            shader.fragmentShader = shader.fragmentShader.replace(
                'return perspectiveDepthToViewZ( depth, nearClip, farClip );',
                'return perspectiveDepthToViewZ( depth, 10.0, farClip );',
            );
        };
        this.composer.addPass(bokehPass);

        this.camera.position.z = 5;

        this.on('pause', this.pause, this).on('resume', this.resume, this);

        this.rafId = requestAnimationFrame(this.tick);
    }

    @autobind
    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.composer.setSize(width, height);

        // from official example webgl_postprocessing_fxaa
        const pixelRatio = this.renderer.getPixelRatio();
        (this.fxaaPass.material as ShaderMaterial).uniforms['resolution'].value.x = 1 / (width * pixelRatio);
        (this.fxaaPass.material as ShaderMaterial).uniforms['resolution'].value.y = 1 / (height * pixelRatio);
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

                this.composer.render();
            }
            this.rafId = requestAnimationFrame(this.tick);
        }
    }

    pause() {
        this._paused = true;
        cancelAnimationFrame(this.rafId);

        Ticker.pause();

        this.forEachPlayer(player => {
            if (player.enabled) {
                player.paused = true;
                player.pause();
            }
        });
    }

    resume() {
        this._paused = false;

        Ticker.resume();

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
