import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '@/utils/constants'
import { dampVector3, dampEuler } from '@/utils/easing'
import { useGameStore } from '@/store/useGameStore'
import { physics } from '@/physics/PhysicsManager'

/**
 * Cinematic camera rig.
 * - Over player's near edge, looking down the table
 * - Subtle breathing (sin-based position + tilt)
 * - Mouse parallax micro-tilt (heavily damped)
 * - Camera shake on impact (from PhysicsManager.cameraShake)
 */

const BASE_POS = CAMERA.position.clone()
const BASE_TARGET = CAMERA.target.clone()
const DESIRED_POS = new THREE.Vector3()
const DESIRED_EULER = new THREE.Euler()

export default function CameraRig() {
  const { camera, pointer, clock } = useThree()
  const lookTarget = useRef(new THREE.Vector3())
  const sensitivity = useGameStore((s) => s.settings.mouseSensitivity)

  useRef<THREE.PerspectiveCamera>(camera as THREE.PerspectiveCamera)

  useFrame((_state, dt) => {
    const t = clock.elapsedTime
    const cam = camera as THREE.PerspectiveCamera

    // Breathing
    const breath = Math.sin((t * Math.PI * 2) / CAMERA.breathPeriod)
    const breathX = breath * CAMERA.breathAmp * 0.6
    const breathY = breath * CAMERA.breathAmp
    const breathRotZ = breath * CAMERA.breathAmp * 0.3

    // Mouse parallax
    const px = THREE.MathUtils.clamp(pointer.x, -1, 1) * sensitivity
    const py = THREE.MathUtils.clamp(pointer.y, -1, 1) * sensitivity

    DESIRED_POS.set(
      BASE_POS.x + breathX + px * CAMERA.parallaxPos,
      BASE_POS.y + breathY + py * CAMERA.parallaxPos * 0.5,
      BASE_POS.z,
    )

    // Camera shake from physics
    const shake = physics.cameraShake
    if (shake > 0.001) {
      DESIRED_POS.x += (Math.random() - 0.5) * shake
      DESIRED_POS.y += (Math.random() - 0.5) * shake * 0.6
    }

    dampVector3(cam.position, DESIRED_POS, CAMERA.damp, dt)

    DESIRED_EULER.set(
      py * CAMERA.parallaxRot * 0.4 + (Math.random() - 0.5) * shake * 0.5,
      -px * CAMERA.parallaxRot,
      breathRotZ + (Math.random() - 0.5) * shake * 0.3,
    )

    lookTarget.current.set(
      BASE_TARGET.x + px * 0.15,
      BASE_TARGET.y + py * 0.08,
      BASE_TARGET.z,
    )

    cam.lookAt(lookTarget.current)
    cam.rotation.z = 0
    dampEuler(cam.rotation, DESIRED_EULER, 4, dt)
  })

  return null
}
