import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { physics } from '@/physics/PhysicsManager'
import { BALL, PALETTE } from '@/utils/constants'

/**
 * Premium Table Tennis — Ball.
 *
 * 40mm procedural sphere, cream-white, soft emissive glow.
 * Position synced from PhysicsManager each frame.
 * Includes a soft motion trail and impact flash.
 */

const TRAIL_LENGTH = 16

export default function Ball() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const flashRef = useRef<THREE.PointLight>(null)

  // Trail: array of small spheres fading out
  const trailRefs = useRef<THREE.Mesh[]>([])
  const trailPositions = useMemo(() => {
    return Array.from({ length: TRAIL_LENGTH }, () => new THREE.Vector3(0, -10, 0))
  }, [])

  let trailTimer = 0
  let trailIdx = 0

  useFrame((_state, dt) => {
    const b = physics.ball
    const mesh = meshRef.current
    const glow = glowRef.current
    if (!mesh || !glow) return

    if (b.active) {
      mesh.position.copy(b.position)
      glow.position.copy(b.position)

      // Visual spin
      mesh.rotation.x += b.spin.x * dt * 0.02
      mesh.rotation.z += b.spin.z * dt * 0.02

      // Glow by speed
      const speed = b.velocity.length()
      const glowScale = THREE.MathUtils.clamp(speed * 0.12, 0.8, 2.5)
      glow.scale.setScalar(glowScale)
      const glowMat = glow.material as THREE.MeshBasicMaterial
      if (glowMat.opacity !== undefined) {
        glowMat.opacity = THREE.MathUtils.clamp(speed * 0.03, 0.08, 0.45)
      }

      // Trail
      trailTimer += dt
      if (trailTimer >= 0.015) {
        trailTimer = 0
        trailPositions[trailIdx % TRAIL_LENGTH].copy(b.position)
        trailIdx++
      }

      // Update trail meshes
      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const t = trailRefs.current[i]
        if (!t) continue
        const age = ((trailIdx - i + TRAIL_LENGTH) % TRAIL_LENGTH) * 0.015
        const alpha = Math.max(0, 1 - age * 6)
        t.position.copy(trailPositions[i])
        t.scale.setScalar(alpha * 0.6)
        const mat = t.material as THREE.MeshBasicMaterial
        if (mat.opacity !== undefined) {
          mat.opacity = alpha * 0.35
        }
      }

      // Impact flash
      if (flashRef.current) {
        const target = physics.cameraShake > 0.02 ? 4 : 0
        flashRef.current.intensity += (target - flashRef.current.intensity) * 8 * dt
        flashRef.current.position.copy(b.position)
      }
    } else {
      mesh.position.set(0, -10, 0)
      glow.position.set(0, -10, 0)
      for (const t of trailRefs.current) {
        if (t) t.position.set(0, -10, 0)
      }
    }
  })

  return (
    <group>
      {/* Ball body */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[BALL.radius, 32, 32]} />
        <meshStandardMaterial
          color={BALL.color}
          roughness={0.25}
          metalness={0.05}
          emissive={PALETTE.cream}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[BALL.radius * 2.2, 16, 16]} />
        <meshBasicMaterial
          color={PALETTE.goldBright}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Impact flash */}
      <pointLight
        ref={flashRef}
        color={PALETTE.goldBright}
        intensity={0}
        distance={2.5}
        decay={2}
      />

      {/* Trail particles */}
      {Array.from({ length: TRAIL_LENGTH }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) trailRefs.current[i] = el
          }}
        >
          <sphereGeometry args={[BALL.radius * 0.7, 8, 8]} />
          <meshBasicMaterial
            color={PALETTE.cream}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
