import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment as DreiEnv, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTE } from '@/utils/constants'

/**
 * Premium minimal environment.
 * - Soft warm studio HDRI for reflections & fill
 * - Large round matte floor
 * - Procedural abstract props (cylinders, spheres, cubes, arches) for aesthetic balance
 * - Subtle fog for depth
 * - Soft contact shadows
 *
 * Pure aesthetic balance — "feels expensive even when doing nothing."
 */

/* One procedural decorative prop cluster, arranged for balance. */
function Props() {
  const bobRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!bobRef.current) return
    // gentle floating motion for premium calm
    const t = state.clock.elapsedTime
    bobRef.current.position.y = 0.0 + Math.sin(t * 0.4) * 0.03
    bobRef.current.rotation.y = Math.sin(t * 0.12) * 0.04
  })

  return (
    <group>
      {/* Tall matte cylinder — left anchor */}
      <mesh position={[-3.2, 0.9, -1.4]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 1.8, 64]} />
        <meshStandardMaterial color={PALETTE.beige} roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Frosted sphere — right anchor */}
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh position={[3.1, 1.1, -1.7]} castShadow>
          <sphereGeometry args={[0.42, 64, 64]} />
          <meshPhysicalMaterial
            color={PALETTE.pink}
            roughness={0.15}
            transmission={0.6}
            thickness={0.6}
            ior={1.3}
            clearcoat={0.4}
            clearcoatRoughness={0.3}
          />
        </mesh>
      </Float>

      {/* Stacked blocks — back-right */}
      <group position={[2.3, 0, -3.1]}>
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.36, 0.7]} />
          <meshStandardMaterial color={PALETTE.beigeDark} roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.52, -0.04]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.32, 0.5]} />
          <meshStandardMaterial color={PALETTE.cream} roughness={0.85} />
        </mesh>
      </group>

      {/* Pale-pink torus arch — back-left */}
      <mesh position={[-2.4, 0.95, -3.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.7, 0.07, 32, 96]} />
        <meshStandardMaterial color={PALETTE.pink} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Small frosted orbs scattered (premium calm) */}
      <group ref={bobRef}>
        <Float speed={0.8} floatIntensity={0.5} rotationIntensity={0.3}>
          <mesh position={[-1.5, 1.6, -2.2]} castShadow>
            <sphereGeometry args={[0.12, 48, 48]} />
            <meshPhysicalMaterial
              color={PALETTE.gold}
              roughness={0.25}
              metalness={0.6}
              clearcoat={0.5}
            />
          </mesh>
        </Float>
        <Float speed={0.65} floatIntensity={0.6} rotationIntensity={0.25}>
          <mesh position={[1.7, 1.85, -2.6]} castShadow>
            <sphereGeometry args={[0.09, 48, 48]} />
            <meshPhysicalMaterial
              color={PALETTE.blueSoft}
              roughness={0.2}
              transmission={0.5}
              thickness={0.4}
              ior={1.25}
            />
          </mesh>
        </Float>
      </group>
    </group>
  )
}

export default function Environment() {
  const floorGeo = useMemo(() => new THREE.CircleGeometry(14, 96), [])

  return (
    <>
      {/* Soft warm studio HDRI */}
      <DreiEnv preset="studio" environmentIntensity={0.45} />

      {/* Light warm exponential fog for depth */}
      <fog attach="fog" args={['#2a2420', 6, 16]} />

      {/* Matte warm-beige floor */}
      <mesh
        geometry={floorGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial color={'#C9B89A'} roughness={0.95} metalness={0} />
      </mesh>

      {/* Decorative cluster */}
      <Props />

      {/* Soft contact shadow plane beneath the table */}
      <ContactShadows
        position={[0, 0.01, 0]}
        scale={10}
        far={5}
        blur={3.2}
        opacity={0.55}
        color={'#1a1612'}
        resolution={1024}
      />
    </>
  )
}
