import Mka from '@/mka/Mka';
import StatsPlayer from '@/StatsPlayer';
import TilesPlayer from '@/TilesPlayer';

const mka = new Mka(document.getElementById('canvas') as HTMLCanvasElement);

mka.addPlayer('tiles', new TilesPlayer());
mka.addPlayer('stats', new StatsPlayer());
