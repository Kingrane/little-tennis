import { useGameStore, type GamePhase } from '@/store/useGameStore'
import { audio } from '@/audio/AudioManager'
import type { PaddleId, DifficultyId } from '@/utils/constants'

/**
 * Premium Table Tennis — GameManager.
 * Owns the high-level phase machine. In v1 it only orchestrates phase
 * transitions + UI cues. Gameplay (serve / rally / score) lands next phase.
 *
 * Phase graph (v1):
 *   BOOT ──enter()──> MENU ──startMatch()──> READY ──serve()──> PLAYING
 *                                                  └── (stub) ───┘
 */

class GameManager {
  private static _instance: GameManager | null = null
  static get instance(): GameManager {
    if (!GameManager._instance) GameManager._instance = new GameManager()
    return GameManager._instance
  }

  get phase(): GamePhase {
    return useGameStore.getState().phase
  }

  /** Called on first user gesture (Enter / landing click). */
  async enter(): Promise<void> {
    await audio.init()
    audio.click()
    this.setPhase('MENU')
  }

  setPhase(p: GamePhase): void {
    useGameStore.getState().setPhase(p)
  }

  setPaddle(p: PaddleId): void {
    useGameStore.getState().setPaddle(p)
    audio.hover()
  }

  setDifficulty(d: DifficultyId): void {
    useGameStore.getState().setDifficulty(d)
    audio.hover()
  }

  /** Start a match — v1 just transitions to READY and plays a score chime. */
  startMatch(): void {
    audio.click()
    this.setPhase('READY')
  }

  /** Stub for next phase — actual serve + rally + scoring. */
  serve(): void {
    // TODO(phys): spawn ball, init velocity, switch to PLAYING
    this.setPhase('PLAYING')
  }

  /** Stub — point awarded. */
  scorePoint(_toPlayer: boolean): void {
    audio.score()
    this.setPhase('POINT')
  }

  reset(): void {
    useGameStore.getState().reset()
  }
}

export const game = GameManager.instance
