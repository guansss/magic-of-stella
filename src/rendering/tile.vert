#define BASE_ALPHA 0.8

precision highp float;

attribute vec3 direction;
attribute vec3 color;

uniform float grow;
uniform float near;
uniform float far;

varying vec4 vColor;

void main() {
    mat4 projectionModelView = projectionMatrix * modelViewMatrix;

    gl_Position = projectionModelView * vec4(position, 1.0);

    float depth = (gl_Position.z + near) / (near - far);

    // reduce grow effect for farther tiles or they will cause unpleasant background twinkling
    gl_Position += (projectionModelView * vec4(direction * grow * clamp(1.0 + 8.0 * (depth + 0.1), 0.0, 1.0), 0.0));

    vColor = vec4(color, (1.0 + 0.8 * depth) * BASE_ALPHA);
}
