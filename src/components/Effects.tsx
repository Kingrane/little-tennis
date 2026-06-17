import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  ChromaticAberration,
  SMAA,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useGameStore } from '@/store/useGameStore'

/**
 * Premium postprocessing stack.
 * - Soft bloom on emissive gold edges & UI glow
 * - Subtle vignette
 * - Gentle DOF for depth
 * - Micro chromatic aberration
 * - SMAA for crisp anti-aliasing
 *
 * Everything subtle — premium, never arcade-y.
 */
export default function Effects() {
  const bloom = useGameStore((s) => s.settings.bloom)

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <DepthOfField
        focusDistance={0.015}
        focalLength={0.05}
        bokehScale={2.2}
        height={480}
      />

      <Bloom
        intensity={bloom * 0.55}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />

      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.0006, 0.0009)}
        radialModulation={false}
        modulationOffset={0}
      />

      <Vignette eskil={false} offset={0.28} darkness={0.62} />

      <SMAA />
    </EffectComposer>
  )
}
