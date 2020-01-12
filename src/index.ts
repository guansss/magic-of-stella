import Mka from '@/mka/Mka';
import StatsPlayer from '@/StatsPlayer';
import MotionPlayer from '@/MotionPlayer';
import TilesPlayer from '@/TilesPlayer';

const mka = new Mka(document.getElementById('canvas') as HTMLCanvasElement);

mka.addPlayer('tiles', new TilesPlayer());
mka.addPlayer('motion', new MotionPlayer());
mka.addPlayer('stats', new StatsPlayer());

window.addEventListener('wheel', e => {
    mka.camera.position.z += e.deltaY * 1;

    console.log('camera', mka.camera.position.z);
});

