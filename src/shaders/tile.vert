precision highp float;

attribute vec3 direction;
attribute vec3 color;

uniform float size;

varying vec3 vColor;

void main() {
    vColor = color;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + direction * size, 1.0);
}
