import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '@/utils/constants'
import { dampVector3, dampEuler } from '@/utils/easing'
import { useGameStore } from '@/store/useGameStore'

/**
 * Cinematic camera rig.
 * - Sits over the player's near edge of the table, looking down its length
 * - Subtle breathing (sin-based position + tilt)
 * - Mouse parallax micro-tilt (heavily damped)
 * - Never 1:1, always cinematic easing
 *
 * FOV 55, tone mapping handled at the renderer level.
 */

const BASE_POS = CAMERA.position.clone()
const BASE_TARGET = CAMERA.target.clone()
const DESIRED_POS = new THREE.Vector3()
const DESIRED_EULER = new THREE.Euler()

export default function CameraRig() {
  const { camera, pointer, clock } = useThree()
  const lookTarget = useRef(new THREE.Vector3())
  const sensitivity = useGameStore((s) => s.settings.mouseSensitivity)

  // Position camera once
  useRef<THREE.PerspectiveCamera>(camera as THREE.PerspectiveCamera)

  useFrame((_state, dt) => {
    const t = clock.elapsedTime
    const cam = camera as THREE.PerspectiveCamera

    // Breathing — sine waves
    const breath = Math.sin(t * (Math.PI * 2) / CAMERA.breathPeriod)
    const breathX = breath * CAMERA.breathAmp * 0.6
    const breathY = breath * CAMERA.breathAmp
    const breathRotZ = breath * CAMERA.breathAmp * 0.3

    // Mouse parallax — clamp pointer
    const px = THREE.MathUtils.clamp(pointer.x, -1, 1) * sensitivity
    const py = THREE.MathUtils.clamp(pointer.y, -1, 1) * sensitivity

    DESIRED_POS.set(
      BASE_POS.x + breathX + px * CAMERA.parallaxPos,
      BASE_POS.y + breathY + py * CAMERA.parallaxPos * 0.5,
      BASE_POS.z,
    )

    // Damp position
    dampVector3(cam.position, DESIRED_POS, CAMERA.damp, dt)

    // Look at base target with slight parallax-driven yaw/pitch
    DESIRED_EULER.set(
      py * CAMERA.parallaxRot * 0.4,
      -px * CAMERA.parallaxRot,
      breathRotZ,
    )

    // We construct a target offset from BASE_TARGET by rotating slightly
    lookTarget.current.set(
      BASE_TARGET.x + px * 0.15,
      BASE_TARGET.y + py * 0.08,
      BASE_TARGET.z,
    )

    cam.lookAt(lookTarget.current)

    // Apply extra roll via rotation.z (after lookAt set yaw/pitch)
    cam.rotation.z = 0
    dampEuler(cam.rotation, DESIRED_EULER, 4, dt)
  })

  return null
}
