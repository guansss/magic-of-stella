const MAX_FPS = 300;
const FILTER_STRENGTH = 20;

namespace Ticker {
    const start = performance.now();

    export let now = start;
    export let elapsed = now - start;

    let before = start;
    export let delta = now - before;

    // see https://stackoverflow.com/a/19772220
    let then = start;
    let adjustedDelta = now - then;

    // see https://stackoverflow.com/a/5111475
    let maxFps = MAX_FPS;
    let frameInterval = 1000 / maxFps;
    let actualFrameInterval = frameInterval;

    export function getMaxFPS() {
        return maxFps;
    }

    export function setMaxFPS(fps: number) {
        maxFps = fps;
        frameInterval = 1000 / fps;
    }

    export function getFPS() {
        return ~~(1000 / actualFrameInterval);
    }

    export function pause() {
    }

    export function resume() {
        before = then = now = performance.now();
    }

    /**
     * @returns True if this tick is available for animation.
     */
    export function tick(time: DOMHighResTimeStamp): boolean {
        now = time;
        elapsed = time - start;

        delta = time - before;

        before = time;

        return true;
    }
}

export default Ticker;
