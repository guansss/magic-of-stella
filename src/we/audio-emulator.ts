import { AudioListener } from '@/we/audio-listener';

let audioElement: HTMLAudioElement;
let audioListener: AudioListener;
let analyser: AnalyserNode;
let freqData: Uint8Array;

export function createAudioEmulator(listener: AudioListener) {
    audioListener = listener;

    if (audioElement) {
        return;
    }

    createAudio();
}

function createAudio() {
    const container = document.createElement('div');
    container.id = 'audio-container';

    audioElement = new Audio();
    audioElement.id = 'audio';
    audioElement.controls = true;
    audioElement.loop = true;
    audioElement.volume = 0.1;
    container.appendChild(audioElement);

    const source = document.createElement('source');
    source.src = 'Atch - Traveller.mp3';
    source.type = 'audio/mpeg';
    audioElement.appendChild(source);

    const link = document.createElement('a');
    link.id = 'audio-link';
    link.href = 'https://soundcloud.com/atch-music/traveller';
    link.target = '_blank';
    link.innerText = '🎵 Atch - Traveller';
    container.appendChild(link);

    document.body.appendChild(container);

    // audio context can only be created after user interacts with the page,
    // which is, in this case, clicking the play button
    audioElement.addEventListener('play', startEmulation);
}

function startEmulation() {
    setupAnalyzer();

    requestAnimationFrame(tick);
}

function setupAnalyzer() {
    const audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaElementSource(audioElement);

    source.connect(analyser);
    source.connect(audioCtx.destination);

    analyser.fftSize = 64;
    freqData = new Uint8Array(analyser.frequencyBinCount);
}

function tick() {
    analyser.getByteFrequencyData(freqData);

    audioListener(freqData as any as number[]);

    requestAnimationFrame(tick);
}
