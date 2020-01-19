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
