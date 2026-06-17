import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/useGameStore'
import { game } from '@/game/GameManager'
import { audio } from '@/audio/AudioManager'
import {
  PADDLES,
  DIFFICULTIES,
  type PaddleId,
  type DifficultyId,
} from '@/utils/constants'
import { LandingScreen } from './LandingScreen'
import { MenuScreen } from './MenuScreen'
import { HUD } from './HUD'

/**
 * Top-level UI overlay.
 * Switches screens by `phase`. Subscribes to store for reactivity.
 */
export default function Overlay() {
  const phase = useGameStore((s) => s.phase)

  // Local mount flag so the landing screen can animate in.
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
      {(phase === 'READY' || phase === 'PLAYING' || phase === 'POINT' || phase === 'ENDED') && (
        <MenuScreen />
      )}
      {phase !== 'BOOT' && <HUD />}
    </div>
  )
}

/* Re-export selections for the menu so it can wire store actions. */
export function useSelections() {
  const paddle = useGameStore((s) => s.paddle)
  const difficulty = useGameStore((s) => s.difficulty)
  return { paddle, difficulty }
}

export { game, audio, PADDLES, DIFFICULTIES }
export type { PaddleId, DifficultyId }
