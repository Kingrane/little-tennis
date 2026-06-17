import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { PADDLES } from '@/utils/constants'
import { useGameStore } from '@/store/useGameStore'
import { dampVector3, dampEuler, clamp } from '@/utils/easing'

/**
 * Player paddle — VISUAL ONLY in v1.
 * Floats in the lower-foreground, follows mouse X/Y with heavy smoothing.
 * Subtle sway. No collisions yet (physics comes next phase).
 *
 * Orientation: blade faces the camera (negative Z), handle points down.
 */

const TARGET_POS = new THREE.Vector3()
const TARGET_ROT = new THREE.Euler()
const VEL = new THREE.Vector3()
const PREV = new THREE.Vector3()

export default function Paddle() {
  const paddleId = useGameStore((s) => s.paddle)
  const preset = PADDLES[paddleId]

  const groupRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  // Cache rubber color object
  const rubber = useMemo(() => new THREE.Color(preset.rubberColor), [preset.rubberColor])
  const accent = useMemo(() => new THREE.Color(preset.accentColor), [preset.accentColor])

  useEffect(() => {
    rubber.set(preset.rubberColor)
    accent.set(preset.accentColor)
  }, [preset, rubber, accent])

  // Init position
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(0, 0.55, 1.15)
    }
  }, [])

  useFrame((state, dt) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime

    // Map normalized pointer (-1..1) to a target position in front of the camera.
    // Constrain to a comfortable play box.
    const halfW = 0.62
    const halfH = 0.36
    const px = clamp(pointer.x, -1, 1)
    const py = clamp(pointer.y, -1, 1)

    // Map X across table width-ish, Y between table and shoulder height.
    const baseY = 0.95
    const baseZ = 1.1

    TARGET_POS.set(px * halfW, baseY + py * halfH, baseZ)

    // Idle sway — slow, premium
    const swayX = Math.sin(t * 0.6) * 0.012
    const swayY = Math.cos(t * 0.43) * 0.012
    TARGET_POS.x += swayX
    TARGET_POS.y += swayY

    // Track velocity (for future hit strength)
    PREV.copy(g.position)
    dampVector3(g.position, TARGET_POS, 6, dt)
    VEL.copy(g.position).sub(PREV).divideScalar(Math.max(dt, 1e-4))

    // Tilt toward movement + slight idle rotation
    const velTilt = clamp(VEL.x * 0.6, -0.4, 0.4)
    const idleTilt = Math.sin(t * 0.5) * 0.03
    TARGET_ROT.set(
      -0.12 + clamp(-VEL.y * 0.4, -0.3, 0.3) + idleTilt,
      velTilt * 0.6,
      -velTilt,
    )
    dampEuler(g.rotation, TARGET_ROT, 6, dt)
  })

  return (
    <group ref={groupRef}>
      {/* Blade */}
      <RoundedBox args={[0.18, 0.27, 0.012]} radius={0.07} smoothness={5} castShadow>
        <meshPhysicalMaterial
          color={rubber}
          roughness={0.55}
          clearcoat={0.35}
          clearcoatRoughness={0.5}
          sheen={0.5}
          sheenColor={accent}
        />
      </RoundedBox>

      {/* Thin accent rim */}
      <RoundedBox args={[0.186, 0.276, 0.006]} radius={0.073} smoothness={5} position={[0, 0, -0.004]}>
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.25}
          roughness={0.4}
          metalness={0.4}
        />
      </RoundedBox>

      {/* Handle */}
      <mesh position={[0, -0.23, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.18, 24]} />
        <meshStandardMaterial color={PALETTE_HACK.wood} roughness={0.7} />
      </mesh>

      {/* Handle grip bands */}
      {[0.0, 0.04, 0.08].map((y, i) => (
        <mesh key={i} position={[0, -0.17 + y, 0]}>
          <torusGeometry args={[0.024, 0.004, 12, 32]} />
          <meshStandardMaterial color={accent} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// Local palette hack to avoid a circular import churn — kept tiny.
const PALETTE_HACK = {
  wood: '#5A3E2B',
}
