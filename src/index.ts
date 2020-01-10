import Mka from '@/mka/Mka';
import TilesPlayer from '@/TilesPlayer';

const mka = new Mka(document.getElementById('canvas') as HTMLCanvasElement);

mka.camera.position.z = 50;

mka.addPlayer('tiles', new TilesPlayer());
