import { useGameStore, type GamePhase } from '@/store/useGameStore'
import { audio } from '@/audio/AudioManager'
import { physics, type CollisionEvent } from '@/physics/PhysicsManager'
import type { PaddleId, DifficultyId } from '@/utils/constants'

/**
 * Premium Table Tennis — GameManager.
 * Owns the high-level phase machine + gameplay orchestration.
 *
 * Phase graph:
 *   BOOT ──enter()──> MENU ──startMatch()──> READY
 *     ──serve()──> PLAYING ──(rally ends)──> POINT ──(1.5s)──> READY or ENDED
 */

class GameManager {
  private static _instance: GameManager | null = null
  static get instance(): GameManager {
    if (!GameManager._instance) GameManager._instance = new GameManager()
    return GameManager._instance
  }

  private pointTimer = 0
  private readonly POINT_DELAY = 1.5 // seconds to show POINT before next serve

  get phase(): GamePhase {
    return useGameStore.getState().phase
  }

  /* ---- lifecycle ---- */

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

  /* ---- match flow ---- */

  startMatch(): void {
    audio.click()
    const store = useGameStore.getState()
    store.setServing(true)
    store.setPhase('READY')
  }

  /** Called when user clicks during READY → start first serve. */
  serve(): void {
    const store = useGameStore.getState()
    if (store.phase !== 'READY') return

    const towardPlayer = !store.servingPlayer
    physics.serve(towardPlayer)
    store.setRallyActive(true)
    store.setPhase('PLAYING')
  }

  /** Called every frame from the scene during PLAYING or POINT. */
  onRallyFrame(dt: number): void {
    const store = useGameStore.getState()

    if (store.phase === 'PLAYING') {
      // Process physics collision events
      for (const ev of physics.events) {
        this.handleCollision(ev)
      }
    }

    if (store.phase === 'POINT') {
      this.pointTimer -= dt
      if (this.pointTimer <= 0) {
        this.afterPoint()
      }
    }
  }

  private handleCollision(ev: CollisionEvent): void {
    switch (ev.type) {
      case 'table':
        audio.bounce()
        break

      case 'paddle':
        audio.hit(Math.min((ev.speed ?? 5) / 10, 1))
        break

      case 'net':
        audio.net()
        break

      case 'out': {
        // Ball went out → point for the opponent
        // Determine who hit it last (rough heuristic: who's side was it on?)
        const ballZ = ev.position.z
        const lastHitByPlayer = ballZ > 0
        // Point goes to the one who DIDN'T hit it out
        this.awardPoint(!lastHitByPlayer)
        break
      }
    }
  }

  private awardPoint(toPlayer: boolean): void {
    const store = useGameStore.getState()
    if (store.phase !== 'PLAYING') return

    store.setRallyActive(false)
    physics.reset()
    audio.score()

    store.scorePoint(toPlayer)

    // Check if match ended
    const newState = useGameStore.getState()
    if (newState.matchWinner) {
      this.setPhase('ENDED')
      return
    }

    this.setPhase('POINT')
    this.pointTimer = this.POINT_DELAY
  }

  private afterPoint(): void {
    const store = useGameStore.getState()
    if (store.phase !== 'POINT') return
    this.setPhase('READY')
  }

  /** Handle click/tap during PLAYING — could be used for smashes etc. */
  onPlayClick(): void {
    // future: charged shot / special move
  }

  reset(): void {
    useGameStore.getState().reset()
    physics.reset()
  }

  quitToMenu(): void {
    physics.reset()
    this.reset()
  }
}

export const game = GameManager.instance
