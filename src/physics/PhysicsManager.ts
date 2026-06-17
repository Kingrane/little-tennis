import * as THREE from 'three'

/**
 * Premium Table Tennis — PhysicsManager (STUB for v1).
 *
 * In the next phase this will own the custom ball+table physics:
 *  - linear + angular velocity integration
 *  - air drag
 *  - Magnus effect (spin → curve) for topspin / backspin / sidespin
 *  - bounce response with friction
 *  - paddle impulse transfer (powerFactor / spinFactor / controlFactor)
 *  - smash vs soft-touch detection
 *
 * For v1 it's a typed placeholder so GameManager / components can import
 * the public surface without churn later.
 */

export interface BallState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  spin: THREE.Vector3 // angular velocity, rad/s
  radius: number
  active: boolean
}

export class PhysicsManager {
  private static _instance: PhysicsManager | null = null
  static get instance(): PhysicsManager {
    if (!PhysicsManager._instance) PhysicsManager._instance = new PhysicsManager()
    return PhysicsManager._instance
  }

  readonly ball: BallState = {
    position: new THREE.Vector3(0, 1.0, 0.5),
    velocity: new THREE.Vector3(),
    spin: new THREE.Vector3(),
    radius: 0.02,
    active: false,
  }

  /** Fixed gravity (m/s^2). Realistic ~9.81. */
  readonly gravity = 9.81

  /** Advance physics by dt seconds. v1 = no-op (ball parked). */
  step(_dt: number): void {
    // TODO(phys): integrate velocity, drag, Magnus, collisions.
  }

  /** Stub — paddle strike. */
  applyPaddleImpulse(
    _normal: THREE.Vector3,
    _power: number,
    _spin: THREE.Vector3,
  ): void {
    // TODO(phys): apply impulse + spin transfer.
  }

  reset(): void {
    this.ball.position.set(0, 1.0, 0.5)
    this.ball.velocity.set(0, 0, 0)
    this.ball.spin.set(0, 0, 0)
    this.ball.active = false
  }
}

export const physics = PhysicsManager.instance
