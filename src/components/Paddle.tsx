import { useMemo, useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { PADDLES } from '@/utils/constants'
import { useGameStore } from '@/store/useGameStore'
import { dampVector3, dampEuler, clamp } from '@/utils/easing'
import { physics } from '@/physics/PhysicsManager'
import { ai } from '@/ai/AIManager'

/**
 * Player + AI paddles.
 *
 * Player: follows mouse with heavy smoothing, feeds position/velocity to physics.
 * AI: position driven by AIManager, synced to physics.
 */

/* ------------------------------------------------------------------ */
/*  Shared blade                                                       */
/* ------------------------------------------------------------------ */

function PaddleBlade({
  rubberColor,
  accentColor,
}: {
  rubberColor: THREE.Color
  accentColor: THREE.Color
}) {
  return (
    <group>
      <RoundedBox args={[0.18, 0.27, 0.012]} radius={0.07} smoothness={5} castShadow>
        <meshPhysicalMaterial
          color={rubberColor}
          roughness={0.55}
          clearcoat={0.35}
          clearcoatRoughness={0.5}
          sheen={0.5}
          sheenColor={accentColor}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.186, 0.276, 0.006]}
        radius={0.073}
        smoothness={5}
        position={[0, 0, -0.004]}
      >
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.25}
          roughness={0.4}
          metalness={0.4}
        />
      </RoundedBox>

      <mesh position={[0, -0.23, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.026, 0.18, 24]} />
        <meshStandardMaterial color="#5A3E2B" roughness={0.7} />
      </mesh>

      {[0.0, 0.04, 0.08].map((y, i) => (
        <mesh key={i} position={[0, -0.17 + y, 0]}>
          <torusGeometry args={[0.024, 0.004, 12, 32]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  Player Paddle                                                      */
/* ------------------------------------------------------------------ */

const _tgt = new THREE.Vector3()
const _rot = new THREE.Euler()
const _prev = new THREE.Vector3()
const _vel = new THREE.Vector3()

export function PlayerPaddle() {
  const paddleId = useGameStore((s) => s.paddle)
  const preset = PADDLES[paddleId]
  const groupRef = useRef<THREE.Group>(null)
  const { pointer } = useThree()

  const rubber = useMemo(() => new THREE.Color(preset.rubberColor), [preset.rubberColor])
  const accent = useMemo(() => new THREE.Color(preset.accentColor), [preset.accentColor])

  useEffect(() => {
    rubber.set(preset.rubberColor)
    accent.set(preset.accentColor)
  }, [preset, rubber, accent])

  useEffect(() => {
    groupRef.current?.position.set(0, 0.92, 1.1)
  }, [])

  useFrame((state, dt) => {
    const g = groupRef.current
    if (!g) return
    const t = state.clock.elapsedTime

    const px = clamp(pointer.x, -1, 1)
    const py = clamp(pointer.y, -1, 1)

    _tgt.set(px * 0.62, 0.92 + py * 0.36, 1.1)
    _tgt.x += Math.sin(t * 0.6) * 0.012
    _tgt.y += Math.cos(t * 0.43) * 0.012

    _prev.copy(g.position)
    dampVector3(g.position, _tgt, 6, dt)
    _vel.copy(g.position).sub(_prev).divideScalar(Math.max(dt, 1e-4))

    const velTilt = clamp(_vel.x * 0.6, -0.4, 0.4)
    _rot.set(
      -0.12 + clamp(-_vel.y * 0.4, -0.3, 0.3) + Math.sin(t * 0.5) * 0.03,
      velTilt * 0.6,
      -velTilt,
    )
    dampEuler(g.rotation, _rot, 6, dt)

    physics.updatePaddle('player', g.position, _vel)
  })

  return (
    <group ref={groupRef}>
      <PaddleBlade rubberColor={rubber} accentColor={accent} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/*  AI Paddle                                                          */
/* ------------------------------------------------------------------ */

export function AIPaddle() {
  const groupRef = useRef<THREE.Group>(null)

  const rubber = useMemo(() => new THREE.Color('#3A4A5A'), [])
  const accent = useMemo(() => new THREE.Color('#9CC3D8'), [])

  useFrame((_s, _dt) => {
    const g = groupRef.current
    if (!g) return
    g.position.copy(ai.paddlePos)
    physics.updatePaddle('ai', ai.paddlePos, ai.paddleVel)
  })

  return (
    <group ref={groupRef}>
      <PaddleBlade rubberColor={rubber} accentColor={accent} />
    </group>
  )
}
