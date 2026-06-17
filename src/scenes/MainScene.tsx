import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Environment from './Environment'
import Lights from '@/components/Lights'
import Table from '@/components/Table'
import Paddle from '@/components/Paddle'
import CameraRig from '@/components/CameraRig'
import Effects from '@/components/Effects'
import { CAMERA } from '@/utils/constants'
import { Loader } from '@/components/Loader'

/**
 * The full 3D scene inside a Canvas.
 * Premium renderer settings: ACES tone mapping, soft shadows, sRGB.
 */
export default function MainScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        outputColorSpace: THREE.SRGBColorSpace,
        powerPreference: 'high-performance',
      }}
      camera={{
        fov: CAMERA.fov,
        near: 0.05,
        far: 60,
        position: [CAMERA.position.x, CAMERA.position.y, CAMERA.position.z],
      }}
    >
      <color attach="background" args={['#1a1410']} />

      <Suspense fallback={null}>
        <Lights />
        <Environment />
        <Table />
        <Paddle />
        <CameraRig />
        <Effects />
      </Suspense>

      <Loader />
    </Canvas>
  )
}
