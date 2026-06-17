import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { game } from '@/game/GameManager'
import { audio } from '@/audio/AudioManager'
import { LandingScreen } from './LandingScreen'
import { MenuScreen } from './MenuScreen'
import { HUD } from './HUD'

/**
 * Top-level UI overlay.
 * Switches screens by phase.
 */
export default function Overlay() {
  const phase = useGameStore((s) => s.phase)

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="ui-layer">
      {(phase === 'BOOT' || phase === 'MENU') && (
        <LandingScreen visible={mounted} />
      )}
      {phase !== 'BOOT' && phase !== 'MENU' && <MenuScreen />}
      {phase !== 'BOOT' && <HUD />}
    </div>
  )
}

export function useSelections() {
  const paddle = useGameStore((s) => s.paddle)
  const difficulty = useGameStore((s) => s.difficulty)
  return { paddle, difficulty }
}

export { game, audio }
