import Mka from '@/mka/Mka';
import MotionPlayer from '@/players/MotionPlayer';
import StatsPlayer from '@/players/StatsPlayer';
import TilesPlayer from '@/players/TilesPlayer';
import { init as initWallpaper } from '@/we/WallpaperHelper';

const mka = new Mka(document.getElementById('canvas') as HTMLCanvasElement);

mka.addPlayer('tiles', new TilesPlayer());
mka.addPlayer('motion', new MotionPlayer());
mka.addPlayer('stats', new StatsPlayer());
mka.camera.position.z = 5;

initWallpaper(mka).then();

window.addEventListener('wheel', e => {
    mka.camera.position.z += e.deltaY * 1;

    console.log('camera', mka.camera.position.z);
});

