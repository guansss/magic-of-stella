import { DoubleSide, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import { SSAARenderPass } from 'three/examples/jsm/postprocessing/SSAARenderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

type FXAAPass = ShaderPass
type SSAAPass = SSAARenderPass

interface PassOptions {
    enabled?: boolean,
    level?: number
}

export default class Postprocessing {
    composer = new EffectComposer(this.renderer);

    fxaaPass = new ShaderPass(FXAAShader);
    smaaPass = new SMAAPass(
        window.innerWidth * this.renderer.getPixelRatio(),
        window.innerHeight * this.renderer.getPixelRatio(),
    );
    ssaaPass = new SSAARenderPass(this.scene, this.camera, 0x000000, 0);

    antiAliasingPass?: FXAAPass | SMAAPass | SSAAPass; // current anti-aliasing pass

    bokehPass = new BokehPass(this.scene, this.camera, {
        focus: 1400,
        aperture: 0.00002,
        maxblur: 1,
    });

    constructor(readonly renderer: WebGLRenderer, readonly scene: Scene, readonly camera: PerspectiveCamera) {
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.fxaaPass);
        this.composer.addPass(this.smaaPass);
        this.composer.addPass(this.ssaaPass);

        // don't know why but BokehPass must not be added before any of anti-aliasing passes
        this.composer.addPass(this.bokehPass);

        // disable all passes
        this.fxaaPass.enabled = false;
        this.smaaPass.enabled = false;
        this.ssaaPass.enabled = false;
        this.bokehPass.enabled = false;

        this.bokehPass.materialDepth.side = DoubleSide;
        this.bokehPass.materialBokeh.onBeforeCompile = shader => {
            // a hack to force the value of nearClip
            shader.fragmentShader = shader.fragmentShader.replace(
                'return perspectiveDepthToViewZ( depth, nearClip, farClip );',
                'return perspectiveDepthToViewZ( depth, 10.0, farClip );',
            );
        };

        this.ssaaPass.sampleLevel = 2;

        this.resize();
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        // from official example webgl_postprocessing_fxaa
        const pixelRatio = this.renderer.getPixelRatio();
        (this.fxaaPass.material as ShaderMaterial).uniforms['resolution'].value.x = 1 / (width * pixelRatio);
        (this.fxaaPass.material as ShaderMaterial).uniforms['resolution'].value.y = 1 / (height * pixelRatio);
    }

    configurePass(pass: Pass, options: PassOptions) {
        if (options.enabled !== undefined) {
            pass.enabled = options.enabled;
        }

        if (pass === this.ssaaPass && options.level !== undefined && options.level >= 0 && options.level <= 5) {
            this.ssaaPass.sampleLevel = options.level;
        }
    }

    setBokeh(enabled: boolean) {
        this.bokehPass.enabled = enabled;

        // disable anti-aliasing when bokeh is disabled
        if (this.antiAliasingPass) {
            this.antiAliasingPass.enabled = enabled;
        }
    }

    setAntiAliasing(pass?: FXAAPass | SMAAPass | SSAAPass, level?: number) {
        if (this.antiAliasingPass) {
            this.antiAliasingPass.enabled = false;
        }

        if (pass) {
            pass.enabled = true;
        }

        this.antiAliasingPass = pass;

        if (level !== undefined && level >= 0 && level <= 5) {
            this.ssaaPass.sampleLevel = level;
        }
    }

    render(dt: DOMHighResTimeStamp) {
        this.composer.render(dt);
    }
}
