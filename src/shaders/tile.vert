precision highp float;

attribute vec3 color;

uniform float size;

varying vec3 vColor;

void main() {
    vColor = color;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
