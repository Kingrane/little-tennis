import { useEffect } from 'react'
import MainScene from './scenes/MainScene'
import Overlay from './ui/Overlay'
import { input } from './utils/input'

/**
 * App root.
 * - Mounts the R3F canvas (3D scene)
 * - Mounts the HTML UI overlay on top
 * - Attaches the input manager
 */
export default function App() {
  useEffect(() => {
    input.attach()
    return () => input.dispose()
  }, [])

  return (
    <>
      <MainScene />
      <Overlay />
    </>
  )
}
