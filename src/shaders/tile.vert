precision highp float;

attribute vec3 direction;
attribute vec3 color;

uniform float size;
uniform float far;

varying vec3 vColor;
varying float depth;

void main() {
    vColor = color;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + direction * size, 1.0);

    depth = 1.0 - 0.8 * gl_Position.z / far;
}
