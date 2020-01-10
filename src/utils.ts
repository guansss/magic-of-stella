export function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function randomColor() {
    // https://stackoverflow.com/a/7638362
    return '#' + Math.random().toString(16).substr(-6);
}
