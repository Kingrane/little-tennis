import * as THREE from 'three'
import { clamp } from './easing'

/**
 * Premium Table Tennis — InputManager.
 * Singleton tracking normalized pointer (-1..1) + smoothed velocity,
 * plus keyboard modifier hooks (Shift = power, Space = spin) ready for v2.
 *
 * The R3F `pointer` is also used directly in some components; this manager
 * gives us the velocity / modifier signals that `pointer` alone can't.
 */

type Mod = { power: boolean; spin: boolean }

class InputManager {
  readonly pointer = new THREE.Vector2(0, 0) // smoothed
  readonly rawPointer = new THREE.Vector2(0, 0)
  readonly velocity = new THREE.Vector2(0, 0) // per-frame
  readonly speed = 0 // px/sec-equivalent scalar

  private prev = new THREE.Vector2(0, 0)
  private listeners: Array<() => void> = []
  private mod: Mod = { power: false, spin: false }

  attach(target: Window = window): void {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = -((e.clientY / window.innerHeight) * 2 - 1)
      this.rawPointer.set(x, y)
    }
    const onDown = (_e: PointerEvent) => {
      /* future: serve / hit trigger */
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') this.mod.power = true
      if (e.key === ' ') this.mod.spin = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') this.mod.power = false
      if (e.key === ' ') this.mod.spin = false
    }

    target.addEventListener('pointermove', onMove)
    target.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    this.listeners.push(() => {
      target.removeEventListener('pointermove', onMove)
      target.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    })
  }

  /** Called every frame from the scene with dt for smoothing. */
  update(dt: number): void {
    // Smooth pointer toward raw pointer
    const smooth = 12 // higher = snappier
    const a = 1 - Math.exp(-smooth * Math.max(dt, 1e-4))
    this.prev.copy(this.pointer)
    this.pointer.x += (this.rawPointer.x - this.pointer.x) * a
    this.pointer.y += (this.rawPointer.y - this.pointer.y) * a

    // Velocity in normalized units / sec
    const idt = 1 / Math.max(dt, 1e-4)
    this.velocity.set(
      (this.pointer.x - this.prev.x) * idt,
      (this.pointer.y - this.prev.y) * idt,
    )
    ;(this.speed as number) = this.velocity.length()
  }

  get modifiers(): Readonly<Mod> {
    return this.mod
  }

  dispose(): void {
    this.listeners.forEach((fn) => fn())
    this.listeners = []
  }
}

export const input = new InputManager()
export { clamp }
