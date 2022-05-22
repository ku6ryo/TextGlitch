precision mediump float;

uniform sampler2D uNoise;
uniform sampler2D uText;
uniform float uRandom;
uniform vec2 uResolution;
uniform float uTime;

varying vec2 vUv;

const vec3 baseColor = vec3(0.4941, 0.0, 0.7804);
const vec3 subColor = vec3(1.0) - baseColor;

void main() {
  float noise = 0.;
  if (uRandom > 0.9) {
    noise = texture2D(uNoise, fract(vUv + vec2(uRandom, uRandom))).r - 0.5;
  }

  float text0 = texture2D(uText, vUv + vec2(noise * 0.15, noise * 0.05)).a;
  float text1 = texture2D(uText, vUv + vec2(- noise * 0.15, -noise * 0.05)).a;
  vec3 col0 = baseColor * text0;
  vec3 col1 = subColor * text1;
  vec3 col = col0 + col1;
  gl_FragColor = vec4(col.rgb, 1.0);
}