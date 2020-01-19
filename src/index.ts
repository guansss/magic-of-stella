import { VIEW_DISTANCE } from '@/constants';
import Mka from '@/mka/Mka';
import Ticker from '@/mka/Ticker';
import MotionPlayer from '@/players/MotionPlayer';
import TilesPlayer from '@/players/TilesPlayer';
import Postprocessing from '@/rendering/Postprocessing';
import { init as initWallpaper } from '@/we/WallpaperHelper';
import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';

const renderer = new WebGLRenderer({
    canvas: document.getElementById('canvas') as HTMLCanvasElement,
    antialias: true,
    logarithmicDepthBuffer: true,
});
const scene = new Scene();
const camera = new PerspectiveCamera(50, 1, 0.01, VIEW_DISTANCE);

camera.position.z = 5;

const postprocessing = new Postprocessing(renderer, scene, camera);

const mka = new Mka();

function initMka() {
    mka.addPlayer('tiles', new TilesPlayer(scene, camera));
    mka.addPlayer('motion', new MotionPlayer(camera));
}

let initialized = false;

mka.on('afterUpdate', () => postprocessing.render(Ticker.delta))
    .on('we:error', (enabled: boolean) => messageDOM && (messageDOM.style.display = enabled ? 'block' : 'none'))
    .on('we:dof', (enabled: boolean) => postprocessing.setBokeh(enabled))
    .on('we:aa', (value: string) => {
        switch (value) {
            case 'fxaa':
                postprocessing.setAntiAliasing(postprocessing.fxaaPass);
                break;

            case 'smaa':
                postprocessing.setAntiAliasing(postprocessing.smaaPass);
                break;

            default:
                if (value.startsWith('ssaa')) {
                    postprocessing.setAntiAliasing(postprocessing.ssaaPass,
                        ({
                            'ssaa_2x': 1,
                            'ssaa_4x': 2,
                            'ssaa_8x': 3,
                            'ssaa_16x': 4,
                            'ssaa_32x': 5,
                        } as any)[value],
                    );
                } else {
                    postprocessing.setAntiAliasing(undefined);
                }
        }
    })
    .on('we:*', (name: string, value: any, initial?: boolean) => {
        if (!initialized && initial) {
            initialized = true;
            initMka();
        }
    });

initWallpaper(mka).then();

let messageDOM = document.getElementById('message');

window.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
    if (!messageDOM) {
        messageDOM = document.createElement('pre');
        messageDOM.id = 'message';
        document.body.appendChild(messageDOM);
    }

    messageDOM.innerHTML = `${error && error.toString()}
Msg: ${event}
Src: ${source}
Ln: ${lineno}
Col ${colno}`;
};

window.addEventListener('resize', () => {
    mka.emit('resize');
    postprocessing.resize();
}, { passive: true });
