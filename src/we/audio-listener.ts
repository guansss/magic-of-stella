import { clamp } from '@/utils/misc';
import { createAudioEmulator } from '@/we/audio-emulator';
import { WEInterface } from '@/we/WEInterface';

const FILTER_STRENGTH = 20;
const LOWER_VOLUME = 0.1;
const UPPER_VOLUME = 1.3;
let volumeBaseline = LOWER_VOLUME;

export type AudioListener = typeof audioListener

const listeners: { listener: AudioListener, ctx?: any }[] = [];

if (window.wallpaperRegisterAudioListener) {
    window.wallpaperRegisterAudioListener(audioListener);
} else if (!WEInterface.runningInWE) {
    createAudioEmulator(audioListener);
}

function audioListener(audioSamples: number[]) {
    listeners.forEach(l => l.listener.call(l.ctx, audioSamples));
}

export function add(listener: AudioListener, context?: any) {
    if (!listeners.find(l => l.listener === listener)) {
        listeners.push({ listener, ctx: context });
    }
}

export function remove(listener: AudioListener) {
    const index = listeners.findIndex(l => l.listener === listener);

    if (index !== -1) {
        listeners.splice(index, 1);
    }
}

export function volumeOf(audioSamples: number[]): number {
    // take average volume of samples
    let volume = audioSamples.reduce((a, b) => a + b, 0) / audioSamples.length;

    // the value of audio samples will be in 0-255 in browser, instead of 0-1 in WE,
    // so some changes should be made
    if (!WEInterface.runningInWE) {
        volume /= 256;
    }

    volumeBaseline = clamp(volumeBaseline + (volume - volumeBaseline) / FILTER_STRENGTH, LOWER_VOLUME, UPPER_VOLUME);

    return clamp(volume / volumeBaseline, 0, UPPER_VOLUME);
}
