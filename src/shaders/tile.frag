precision highp float;

varying vec3 vColor;
varying float depth;

void main() {
    gl_FragColor = vec4(vColor, depth * 0.8);
}
