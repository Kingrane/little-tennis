import * as THREE from 'three'
import { TABLE, BALL, PADDLES } from '@/utils/constants'
import { useGameStore } from '@/store/useGameStore'

/**
 * Premium Table Tennis — PhysicsManager.
 *
 * Custom ball physics with:
 *  - Gravity (9.81 m/s²)
 *  - Air drag (quadratic)
 *  - Magnus effect (spin → curve)
 *  - Table bounce (restitution + friction + spin conversion)
 *  - Paddle impulse (power/spin/control factors)
 *  - Net collision
 *  - Out-of-bounds detection
 *
 * Coordinate system:
 *  - X: across table (side-to-side)
 *  - Y: up (height)
 *  - Z: along table (player +Z, AI -Z, net at Z=0)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BallState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  spin: THREE.Vector3
  radius: number
  active: boolean
}

export type CollisionType = 'table' | 'paddle' | 'net' | 'out'

export interface CollisionEvent {
  type: CollisionType
  side?: 'player' | 'ai'
  position: THREE.Vector3
  speed?: number
}

/* ------------------------------------------------------------------ */
/*  Singleton                                                          */
/* ------------------------------------------------------------------ */

class PhysicsManager {
  private static _instance: PhysicsManager | null = null
  static get instance(): PhysicsManager {
    if (!PhysicsManager._instance) PhysicsManager._instance = new PhysicsManager()
    return PhysicsManager._instance
  }

  /* ---- ball state ---- */
  readonly ball: BallState = {
    position: new THREE.Vector3(0, 1.0, 0.8),
    velocity: new THREE.Vector3(),
    spin: new THREE.Vector3(),
    radius: BALL.radius,
    active: false,
  }

  /* ---- paddle tracking ---- */
  private readonly paddlePos = {
    player: new THREE.Vector3(0, 0.92, 1.1),
    ai: new THREE.Vector3(0, 0.92, -1.15),
  }
  private readonly paddleVel = {
    player: new THREE.Vector3(),
    ai: new THREE.Vector3(),
  }

  /* ---- constants ---- */
  private readonly gravity = 9.81
  private readonly airDensity = 1.225
  private readonly dragCoeff = 0.55
  private readonly crossSection = Math.PI * BALL.radius * BALL.radius
  private readonly mass = 0.0027
  private readonly magnusCoeff = 0.00018

  /* ---- collision feedback ---- */
  private _events: CollisionEvent[] = []
  get events(): ReadonlyArray<CollisionEvent> {
    return this._events
  }

  /** Camera shake intensity. */
  cameraShake = 0

  /* ================================================================ */
  /*  PADDLE INPUT                                                     */
  /* ================================================================ */

  updatePaddle(
    side: 'player' | 'ai',
    position: THREE.Vector3,
    velocity: THREE.Vector3,
  ): void {
    this.paddlePos[side].copy(position)
    this.paddleVel[side].copy(velocity)
  }

  /* ================================================================ */
  /*  STEP                                                             */
  /* ================================================================ */

  step(dt: number): CollisionEvent[] {
    this._events = []
    if (!this.ball.active) return this._events

    const steps = 4
    const subDt = dt / steps
    for (let i = 0; i < steps; i++) {
      this.integrate(subDt)
      this.checkTableBounce()
      this.checkNetCollision()
      this.checkPaddleHit('player')
      this.checkPaddleHit('ai')
      this.checkOutOfBounds()
    }

    this.cameraShake *= 0.92
    return this._events
  }

  /* ================================================================ */
  /*  INTEGRATION                                                      */
  /* ================================================================ */

  private integrate(dt: number): void {
    const b = this.ball

    // Gravity
    b.velocity.y -= this.gravity * dt

    // Air drag
    const speed = b.velocity.length()
    if (speed > 0.01) {
      const dragMag = 0.5 * this.airDensity * this.dragCoeff * this.crossSection * speed * speed
      const dragAccel = dragMag / this.mass
      const dragVec = b.velocity.clone().normalize().multiplyScalar(-dragAccel * dt)
      b.velocity.add(dragVec)
    }

    // Magnus effect
    const magnusForce = new THREE.Vector3().crossVectors(b.spin, b.velocity)
    magnusForce.multiplyScalar((this.magnusCoeff / this.mass) * dt)
    b.velocity.add(magnusForce)

    // Integrate position
    b.position.addScaledVector(b.velocity, dt)

    // Spin decay
    b.spin.multiplyScalar(1 - 0.005 * dt)
  }

  /* ================================================================ */
  /*  COLLISIONS                                                       */
  /* ================================================================ */

  private checkTableBounce(): void {
    const b = this.ball
    const surfaceY = TABLE.height + b.radius

    if (b.position.y > surfaceY || b.velocity.y > 0) return

    const inBounds =
      Math.abs(b.position.x) <= TABLE.length / 2 + 0.02 &&
      Math.abs(b.position.z) <= TABLE.width / 2 + 0.02

    if (!inBounds) return

    b.position.y = surfaceY
    b.velocity.y = Math.abs(b.velocity.y) * 0.82

    const friction = 0.35
    b.velocity.x *= 1 - friction
    b.velocity.z *= 1 - friction

    // Spin → linear
    b.velocity.x += b.spin.z * 0.005
    b.velocity.z -= b.spin.x * 0.005

    b.spin.multiplyScalar(0.6)

    const side: 'player' | 'ai' = b.position.z > 0 ? 'player' : 'ai'
    this._events.push({
      type: 'table',
      side,
      position: b.position.clone(),
      speed: Math.abs(b.velocity.y),
    })
  }

  private checkNetCollision(): void {
    const b = this.ball
    const netBottom = TABLE.height
    const netTop = TABLE.height + TABLE.netHeight

    if (Math.abs(b.position.z) > b.radius + 0.02) return
    if (b.position.y < netBottom || b.position.y > netTop) return

    b.velocity.z *= -0.2
    b.velocity.y *= 0.35
    b.spin.multiplyScalar(0.15)
    b.position.z = b.position.z > 0 ? b.radius + 0.03 : -(b.radius + 0.03)

    this._events.push({ type: 'net', position: b.position.clone() })
  }

  private checkPaddleHit(side: 'player' | 'ai'): void {
    const b = this.ball
    const pos = this.paddlePos[side]
    const vel = this.paddleVel[side]

    // Paddle bounding box
    const pw = 0.09
    const ph = 0.135
    const pd = 0.015

    const dx = Math.abs(b.position.x - pos.x)
    const dy = Math.abs(b.position.y - pos.y)
    const dz = Math.abs(b.position.z - pos.z)

    if (dx > pw + b.radius || dy > ph + b.radius || dz > pd + b.radius) return

    // Only count if moving toward paddle
    const toBall = new THREE.Vector3().subVectors(b.position, pos)
    if (toBall.dot(b.velocity) >= 0) return

    // Get paddle preset for physics factors
    const store = useGameStore.getState()
    const preset = PADDLES[store.paddle]

    const normal = side === 'player'
      ? new THREE.Vector3(0, 0, -1)
      : new THREE.Vector3(0, 0, 1)

    const paddleSpeed = vel.length()
    const rawPower = Math.min(paddleSpeed * 1.8, 15)
    const power = rawPower * (side === 'player' ? preset.powerFactor : 1.0)

    b.velocity.copy(normal).multiplyScalar(power)
    b.velocity.y = Math.max(Math.abs(vel.y) * 0.4 + 1.5, 2.0)

    const spinFactor = side === 'player' ? preset.spinFactor : 1.0
    const spinAmt = paddleSpeed * spinFactor * 0.3
    b.spin.set(
      vel.y * spinAmt,
      vel.x * spinAmt * 0.3,
      -vel.x * spinAmt,
    )

    const push = side === 'player' ? -(pd + b.radius + 0.01) : pd + b.radius + 0.01
    b.position.z = pos.z + push

    this.cameraShake = Math.min(power * 0.015, 0.08)

    this._events.push({
      type: 'paddle',
      side,
      position: b.position.clone(),
      speed: power,
    })
  }

  private checkOutOfBounds(): void {
    const b = this.ball
    const margin = 0.4

    const out =
      b.position.y < -0.2 ||
      Math.abs(b.position.x) > TABLE.length / 2 + margin ||
      b.position.z < -TABLE.width / 2 - margin ||
      b.position.z > TABLE.width / 2 + margin

    if (out) {
      this._events.push({ type: 'out', position: b.position.clone() })
    }
  }

  /* ================================================================ */
  /*  PUBLIC API                                                       */
  /* ================================================================ */

  serve(towardPlayer: boolean): void {
    const b = this.ball
    b.position.set(
      (Math.random() - 0.5) * 0.25,
      1.05,
      towardPlayer ? 0.75 : -0.75,
    )
    b.velocity.set(
      (Math.random() - 0.5) * 0.4,
      2.8,
      towardPlayer ? 3.8 : -3.8,
    )
    b.spin.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 10,
    )
    b.active = true
  }

  reset(): void {
    const b = this.ball
    b.position.set(0, 1.0, 0.8)
    b.velocity.set(0, 0, 0)
    b.spin.set(0, 0, 0)
    b.active = false
    this.cameraShake = 0
  }
}

export const physics = PhysicsManager.instance
