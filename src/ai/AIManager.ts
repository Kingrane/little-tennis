import * as THREE from 'three'
import type { DifficultyId } from '@/utils/constants'
import { TABLE } from '@/utils/constants'

/**
 * Premium Table Tennis — AIManager.
 *
 * Human-feeling opponent that:
 *  - tracks incoming ball with reaction-time delay
 *  - moves paddle toward predicted position
 *  - returns shots with difficulty-scaled precision + noise
 *  - higher tiers read spin and adapt
 *
 * AI paddle sits at Z ≈ -1.15 (far side).
 */

/* ------------------------------------------------------------------ */
/*  Difficulty tuning                                                  */
/* ------------------------------------------------------------------ */

const TUNING: Record<
  DifficultyId,
  {
    reaction: number // seconds delay before reacting
    precision: number // 0..1 accuracy
    aggression: number // 0..1 power multiplier
    spinUse: number // 0..1 tendency to add spin
    maxSpeed: number // m/s paddle movement cap
  }
> = {
  rookie: { reaction: 0.45, precision: 0.35, aggression: 0.2, spinUse: 0.1, maxSpeed: 3.5 },
  casual: { reaction: 0.32, precision: 0.55, aggression: 0.35, spinUse: 0.25, maxSpeed: 4.5 },
  skilled: { reaction: 0.22, precision: 0.75, aggression: 0.55, spinUse: 0.5, maxSpeed: 5.5 },
  pro: { reaction: 0.14, precision: 0.88, aggression: 0.75, spinUse: 0.75, maxSpeed: 6.5 },
  impossible: { reaction: 0.06, precision: 0.97, aggression: 0.92, spinUse: 0.95, maxSpeed: 8 },
}

/* ------------------------------------------------------------------ */
/*  Singleton                                                          */
/* ------------------------------------------------------------------ */

class AIManager {
  private static _instance: AIManager | null = null
  static get instance(): AIManager {
    if (!AIManager._instance) AIManager._instance = new AIManager()
    return AIManager._instance
  }

  difficulty: DifficultyId = 'skilled'

  /** Current AI paddle position (updated each frame). */
  readonly paddlePos = new THREE.Vector3(0, 0.92, -1.15)
  readonly paddleVel = new THREE.Vector3()

  private prevPos = new THREE.Vector3(0, 0.92, -1.15)
  private targetPos = new THREE.Vector3(0, 0.92, -1.15)
  private reactionTimer = 0
  private reacting = false


  setDifficulty(d: DifficultyId): void {
    this.difficulty = d
  }

  /** Called each frame. dt = frame delta, ballPos = current ball state. */
  step(dt: number, ballPos: THREE.Vector3, ballVel: THREE.Vector3, ballActive: boolean): void {
    const t = TUNING[this.difficulty]

    // Idle sway when no active ball
    if (!ballActive) {
      const time = performance.now() * 0.001
      this.targetPos.set(
        Math.sin(time * 0.4) * 0.15,
        0.92 + Math.sin(time * 0.3) * 0.02,
        -1.15,
      )
      this.movePaddle(dt, t.maxSpeed)
      return
    }

    // Only react if ball is coming toward AI (negative Z velocity, or on AI side)
    const ballComing = ballVel.z < -0.3 || ballPos.z < 0

    if (ballComing) {
      // Reaction delay
      if (!this.reacting) {
        this.reacting = true
        this.reactionTimer = t.reaction
      }

      this.reactionTimer -= dt

      if (this.reactionTimer <= 0) {
        // Predict where ball will be at AI's Z line
        const predicted = this.predictBounce(ballPos, ballVel)

        // Add noise based on precision (lower = more noise)
        const noise = (1 - t.precision) * 0.5
        predicted.x += (Math.random() - 0.5) * noise
        predicted.y = 0.92 + (Math.random() - 0.5) * noise * 0.3

        this.targetPos.copy(predicted)
        this.targetPos.z = -1.15 // clamp to AI paddle Z
      }
    } else {
      this.reacting = false
      // Return to center-ish when ball is on player's side
      this.targetPos.set(0, 0.92, -1.15)
    }

    // Clamp to playable area
    this.targetPos.x = THREE.MathUtils.clamp(
      this.targetPos.x,
      -TABLE.length / 2 + 0.2,
      TABLE.length / 2 - 0.2,
    )
    this.targetPos.y = THREE.MathUtils.clamp(this.targetPos.y, 0.75, 1.35)

    this.movePaddle(dt, t.maxSpeed)
  }

  private movePaddle(dt: number, maxSpeed: number): void {
    const dir = new THREE.Vector3().subVectors(this.targetPos, this.paddlePos)
    const dist = dir.length()

    if (dist < 0.005) return

    dir.normalize()
    const move = Math.min(dist, maxSpeed * dt)
    this.prevPos.copy(this.paddlePos)
    this.paddlePos.addScaledVector(dir, move)

    // Velocity for physics
    this.paddleVel
      .copy(this.paddlePos)
      .sub(this.prevPos)
      .divideScalar(Math.max(dt, 1e-4))
  }

  /**
   * Rough prediction of where ball will cross AI's Z line.
   * Traces forward a few steps to account for gravity + bounce.
   */
  private predictBounce(pos: THREE.Vector3, vel: THREE.Vector3): THREE.Vector3 {
    const predicted = pos.clone()
    const v = vel.clone()
    const targetZ = -1.1
    const dt = 0.016
    const maxSteps = 60

    for (let i = 0; i < maxSteps; i++) {
      // Gravity
      v.y -= 9.81 * dt

      // Advance
      predicted.addScaledVector(v, dt)

      // Table bounce
      if (predicted.y <= TABLE.height + 0.02 && v.y < 0) {
        predicted.y = TABLE.height + 0.02
        v.y *= -0.8
        v.x *= 0.7
        v.z *= 0.7
      }

      // Reached AI side?
      if (predicted.z <= targetZ) break
    }

    return predicted
  }

  /** Whether the AI should attempt a hit (ball in range). */
  shouldHit(ballPos: THREE.Vector3): boolean {
    const dx = Math.abs(ballPos.x - this.paddlePos.x)
    const dy = Math.abs(ballPos.y - this.paddlePos.y)
    const dz = Math.abs(ballPos.z - this.paddlePos.z)
    return dx < 0.14 && dy < 0.18 && dz < 0.06 && ballPos.z < -0.5
  }

  reset(): void {
    this.paddlePos.set(0, 0.92, -1.15)
    this.prevPos.set(0, 0.92, -1.15)
    this.targetPos.set(0, 0.92, -1.15)
    this.paddleVel.set(0, 0, 0)
    this.reacting = false
    this.reactionTimer = 0
  }
}

export const ai = AIManager.instance
