import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LIGHT, PALETTE } from '@/utils/constants'

/**
 * Premium soft studio lighting.
 * Warm ambient fill + soft key + cool rim. No harsh shadows.
 * Subtle flicker-free, with a barely perceptible breathing on the key.
 */
export default function Lights() {
  const keyRef = useRef<THREE.DirectionalLight>(null)

  useFrame((state) => {
    if (!keyRef.current) return
    // imperceptible 1% breathing — premium, never obvious
    const t = state.clock.elapsedTime
    const pulse = 1 + Math.sin(t * 0.7) * 0.015
    keyRef.current.intensity = LIGHT.key * pulse
  })

  return (
    <>
      <ambientLight intensity={LIGHT.ambient} color={PALETTE.cream} />

      {/* Key — warm, soft, from upper-front-left */}
      <directionalLight
        ref={keyRef}
        position={[2.5, 4.5, 3.0]}
        intensity={LIGHT.key}
        color={'#FFE8C8'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-3, 3, 3, -3, 0.1, 12]}
        />
      </directionalLight>

      {/* Fill — soft cool fill from the right */}
      <directionalLight
        position={[-3, 2.5, 1.5]}
        intensity={LIGHT.fill}
        color={'#D6E4EC'}
      />

      {/* Rim — pale blue rim from behind for separation */}
      <directionalLight
        position={[0, 2.0, -4]}
        intensity={LIGHT.rim}
        color={'#AECBE0'}
      />

      {/* Soft warm point near table for premium glow */}
      <pointLight
        position={[0, 1.6, 0.6]}
        intensity={0.35}
        distance={4}
        decay={2}
        color={'#F2DDD4'}
      />
    </>
  )
}
