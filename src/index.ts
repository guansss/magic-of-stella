import { VIEW_DISTANCE } from '@/constants';
import Mka from '@/mka/Mka';
import Ticker from '@/mka/Ticker';
import MotionPlayer from '@/players/MotionPlayer';
import StatsPlayer from '@/players/StatsPlayer';
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

let initialized = false;

mka.on('afterUpdate', () => {
        postprocessing.render(Ticker.delta);
    })
    .on('we:*', (name: string, value: any, initial?: boolean) => {
        if (!initialized && initial) {
            initialized = true;

            mka.addPlayer('tiles', new TilesPlayer(scene, camera));
            mka.addPlayer('motion', new MotionPlayer(camera));
            mka.addPlayer('stats', new StatsPlayer());
        }
    });

initWallpaper(mka).then();

window.addEventListener('resize', () => {
    mka.emit('resize');
    postprocessing.resize();
}, { passive: true });
