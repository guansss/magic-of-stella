precision highp float;
precision highp int;

attribute vec3 rotation;
attribute float size;
attribute vec3 color;

uniform float time;

varying vec3 vColor;

void main() {
    vColor = color;

    gl_Position = projectionMatrix * vec4(position, 1.0);
}
