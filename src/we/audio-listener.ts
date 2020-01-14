import { clamp } from '@/utils/misc';

function audioListener(audioSamples: number[]) {
    listeners.forEach(l => l.listener.call(l.ctx, audioSamples));
}

if (window.wallpaperRegisterAudioListener) {
    window.wallpaperRegisterAudioListener(audioListener);
}

type AudioListener = typeof audioListener

const listeners: { listener: AudioListener, ctx?: any }[] = [];

const FILTER_STRENGTH = 200;
const LOWER_VOLUME = 0.1;
const UPPER_VOLUME = 1.3;
let maxVolume = LOWER_VOLUME;

export function add(listener: AudioListener, context?: any) {
    listeners.push({ listener, ctx: context });
}

export function remove(listener: AudioListener) {
    const index = listeners.findIndex(l => l.listener === listener);

    if (index !== -1) {
        listeners.splice(index, 1);
    }
}

export function volumeOf(audioSamples: number[]): number {
    const max = Math.max(...audioSamples);

    maxVolume = clamp(maxVolume + (max - maxVolume) / FILTER_STRENGTH, LOWER_VOLUME, UPPER_VOLUME);

    return clamp(max / maxVolume, 0, UPPER_VOLUME);
}
