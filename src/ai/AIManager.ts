import * as THREE from 'three'
import type { DifficultyId } from '@/utils/constants'

/**
 * Premium Table Tennis — AIManager (STUB for v1).
 *
 * Next phase: a human-feeling opponent that:
 *  - tracks the incoming ball with a reaction-time delay
 *  - aims returns with difficulty-scaled precision + noise
 *  - chooses shot type (topspin / push / smash / soft touch) by context
 *  - reads incoming spin at higher tiers and adapts
 *
 * Each difficulty scales: reaction time, precision, shot variation,
 * spin usage, and aggression.
 */

export interface AIDecision {
  paddleTarget: THREE.Vector3
  power: number // 0..1
  spin: THREE.Vector3
  shotType: 'push' | 'topspin' | 'smash' | 'soft' | 'block'
}

const TUNING: Record<
  DifficultyId,
  { reaction: number; precision: number; aggression: number; spinUse: number }
> = {
  rookie: { reaction: 0.45, precision: 0.4, aggression: 0.2, spinUse: 0.1 },
  casual: { reaction: 0.32, precision: 0.6, aggression: 0.35, spinUse: 0.25 },
  skilled: { reaction: 0.22, precision: 0.78, aggression: 0.55, spinUse: 0.55 },
  pro: { reaction: 0.14, precision: 0.9, aggression: 0.75, spinUse: 0.8 },
  impossible: { reaction: 0.06, precision: 0.99, aggression: 0.95, spinUse: 1.0 },
}

export class AIManager {
  private static _instance: AIManager | null = null
  static get instance(): AIManager {
    if (!AIManager._instance) AIManager._instance = new AIManager()
    return AIManager._instance
  }

  difficulty: DifficultyId = 'skilled'
  private paddlePos = new THREE.Vector3(0, 0.9, -1.2)

  setDifficulty(d: DifficultyId): void {
    this.difficulty = d
  }

  get paddlePosition(): THREE.Vector3 {
    return this.paddlePos
  }

  /** Advance AI by dt. v1 = idle paddle sway only. */
  step(_dt: number, _t: number): void {
    // TODO(ai): react to incoming ball, position paddle, return shot.
  }

  /** Stub decide — returns a safe push toward center. */
  decide(): AIDecision {
    const t = TUNING[this.difficulty]
    return {
      paddleTarget: new THREE.Vector3(0, 0.9, -1.2),
      power: 0.4 * t.aggression + 0.3,
      spin: new THREE.Vector3(),
      shotType: 'push',
    }
  }

  reset(): void {
    this.paddlePos.set(0, 0.9, -1.2)
  }
}

export const ai = AIManager.instance
