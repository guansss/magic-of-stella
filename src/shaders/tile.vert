precision highp float;

attribute vec3 direction;
attribute vec3 color;

uniform float grow;
uniform float near;
uniform float far;

varying vec4 vColor;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + direction * grow, 1.0);

    vColor = vec4(color, (1.0 - 0.8 * gl_Position.z / far) * 0.8);
}
