const MAX_FPS = 300;
const FILTER_STRENGTH = 20;

namespace Ticker {
    const start = performance.now();

    export let now = start;
    export let elapsed = now - start;

    let before = start;
    export let delta = now - before;

    export let paused = false;
    let pauseTime = now;
    export let elapsedSincePause = now - pauseTime;

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
        const time = performance.now();

        // pause can be triggered multiple times in WE, probably when interacting with multiple monitors
        if (paused) {
            elapsedSincePause += time - pauseTime;
        }

        paused = true;
        pauseTime = time;
    }

    export function resume(time: DOMHighResTimeStamp) {
        paused = false;
        before = then = now = time;
        elapsedSincePause = now - pauseTime;
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
