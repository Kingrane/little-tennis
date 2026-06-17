/**
 * Edge-glow shader — soft emissive band around the table's top perimeter.
 * Uses the rounded-box UV-less approach: distance-from-edge falloff via
 * local-space position of the slightly-larger glow mesh.
 *
 * Replaced by a simpler Drei <Edges> in the table for v1; kept here for
 * future richer custom glow.
 */
import * as THREE from 'three'

export const edgeGlowVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const edgeGlowFragment = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uWidth;

  void main() {
    // Falloff based on how perpendicular the normal is to view (rim-ish).
    // We approximate "edge" by the dot of normal and a fixed up vector.
    float edge = 1.0 - abs(dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)));
    edge = smoothstep(0.55, 1.0, edge);
    vec3 col = uColor * uIntensity * edge;
    gl_FragColor = vec4(col, edge);
  }
`

export interface EdgeGlowUniforms {
  uColor: THREE.IUniform
  uIntensity: THREE.IUniform
  uWidth: THREE.IUniform
}

export function makeEdgeGlowMaterial(color: THREE.Color, intensity = 2.2): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uColor: { value: color },
      uIntensity: { value: intensity },
      uWidth: { value: 0.05 },
    },
    vertexShader: edgeGlowVertex,
    fragmentShader: edgeGlowFragment,
  })
}
