import * as THREE from 'three'

/**
 * Premium Table Tennis — easing helpers.
 * Frame-rate independent smoothing built on top of maath's damp.
 * Everything in the game interpolates through these — never 1:1.
 */
import { damp as maathDamp, damp3, dampE } from 'maath/easing'

export const damp = maathDamp
export { damp3, dampE }

/** Smoothly damp a Vector3 in-place toward a target. */
export function dampVector3(
  current: THREE.Vector3,
  target: THREE.Vector3,
  smooth: number,
  dt: number,
): void {
  damp3(current, target.toArray() as [number, number, number], smooth, dt)
}

/** Smoothly damp a Euler in-place toward a target Euler. */
export function dampEuler(
  current: THREE.Euler,
  target: THREE.Euler,
  smooth: number,
  dt: number,
): void {
  dampE(current, [target.x, target.y, target.z], smooth, dt)
}

/** Clamp a value. */
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v))

/** Map a value from one range to another. */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin)

/** Smoothstep for 0..1. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Lerp helper. */
export const lerp = THREE.MathUtils.lerp

/** Frame-rate independent decay factor (alternative to damp, value-based). */
export function approach(current: number, target: number, halfLife: number, dt: number): number {
  // Exponential approach: after `halfLife` seconds, halfway to target.
  const omega = Math.LN2 / Math.max(halfLife, 1e-5)
  return target + (current - target) * Math.exp(-omega * dt)
}
