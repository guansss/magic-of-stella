// check if running in Wallpaper Engine
export const inWallpaperEngine = !!window.wallpaperRequestRandomFileForProperty;

// when this page is redirected from "bridge.html", a `redirect` will be set in URL's search parameters
export const redirectedFromBridge = !!new URLSearchParams(location.search.slice(1)).get('redirect');

export function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function clamp(num: number, lower: number, upper: number) {
    return num < lower ? lower : num > upper ? upper : num;
}

export function randomColor() {
    // https://stackoverflow.com/a/7638362
    return +('0x' + Math.random().toString(16).substr(-6));
}
