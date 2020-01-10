precision highp float;
precision highp int;

uniform float time;
uniform float alpha;

varying vec3 vColor;

void main() {
    vec4 color = vec4(vColor, alpha);

    gl_FragColor = color;
}
