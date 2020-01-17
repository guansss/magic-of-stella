import { DoubleSide, PerspectiveCamera, Scene, ShaderMaterial, WebGLRenderer } from 'three';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { Pass } from 'three/examples/jsm/postprocessing/Pass';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';

export default class Postprocessing {
    composer = new EffectComposer(this.renderer);

    fxaaPass = new ShaderPass(FXAAShader);
    bokehPass = new BokehPass(this.scene, this.camera, {
        focus: 1400,
        aperture: 0.00002,
        maxblur: 1,
    });

    constructor(readonly renderer: WebGLRenderer, readonly scene: Scene, readonly camera: PerspectiveCamera) {
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.composer.addPass(this.fxaaPass);
        this.composer.addPass(this.bokehPass);

        this.bokehPass.materialDepth.side = DoubleSide;
        this.bokehPass.materialBokeh.onBeforeCompile = shader => {
            // a hack to force the value of nearClip
            shader.fragmentShader = shader.fragmentShader.replace(
                'return perspectiveDepthToViewZ( depth, nearClip, farClip );',
                'return perspectiveDepthToViewZ( depth, 10.0, farClip );',
            );
        };

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

    enablePass(pass: Pass) {
        pass.enabled = true;
    }

    disablePass(pass: Pass) {
        pass.enabled = false;
    }

    render(dt: DOMHighResTimeStamp) {
        this.composer.render(dt);
    }
}
