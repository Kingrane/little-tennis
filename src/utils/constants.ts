import * as THREE from 'three'

/**
 * Premium Table Tennis — global constants.
 * Single source of truth for palette, table dimensions, tuning.
 */

/* ------------------------------------------------------------------ *
 * Palette — warm monochrome minimalism
 * ------------------------------------------------------------------ */
export const PALETTE = {
  beige: '#E3D5BC',
  beigeDark: '#C9B89A',
  cream: '#F7F1E8',
  pink: '#F2DDD4',
  pinkSoft: '#F7E6DF',
  blue: '#BBD3E0', // table surface
  blueSoft: '#D4E3EC',
  gold: '#C9A961',
  goldBright: '#E6C987',
  ink: '#1A1612',
  // three-style colors
  beige3: new THREE.Color('#E3D5BC'),
  cream3: new THREE.Color('#F7F1E8'),
  pink3: new THREE.Color('#F2DDD4'),
  blue3: new THREE.Color('#BBD3E0'),
  gold3: new THREE.Color('#C9A961'),
  goldBright3: new THREE.Color('#E6C987'),
} as const

/* ------------------------------------------------------------------ *
 * Table tennis — real regulation dimensions (meters)
 * Length 2.74, Width 1.525, Height 0.76, Net 0.1525
 * ------------------------------------------------------------------ */
export const TABLE = {
  length: 2.74,
  width: 1.525,
  height: 0.76,
  netHeight: 0.1525,
  thickness: 0.04,
  cornerRadius: 0.05,
} as const

/* Net density (squares per side) for the procedural mesh */
export const NET = {
  cellsX: 60,
  cellsY: 12,
  postRadius: 0.012,
} as const

/* ------------------------------------------------------------------ *
 * Paddle presets — visual + (future) physics
 * ------------------------------------------------------------------ */
export type PaddleId = 'balanced' | 'spin' | 'power' | 'control'

export interface PaddlePreset {
  id: PaddleId
  name: string
  blurb: string
  // future physics factors (unused in v1)
  spinFactor: number
  powerFactor: number
  controlFactor: number
  weight: number
  // visual
  rubberColor: string
  accentColor: string
}

export const PADDLES: Record<PaddleId, PaddlePreset> = {
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    blurb: 'A reliable all-rounder.',
    spinFactor: 1.0,
    powerFactor: 1.0,
    controlFactor: 1.0,
    weight: 1.0,
    rubberColor: '#8C2F39',
    accentColor: '#C9A961',
  },
  spin: {
    id: 'spin',
    name: 'Spin Master',
    blurb: 'Enhanced spin multiplier.',
    spinFactor: 1.35,
    powerFactor: 0.9,
    controlFactor: 1.05,
    weight: 0.95,
    rubberColor: '#3A4A5A',
    accentColor: '#9CC3D8',
  },
  power: {
    id: 'power',
    name: 'Power',
    blurb: 'Heavier, devastating smashes.',
    spinFactor: 0.9,
    powerFactor: 1.4,
    controlFactor: 0.85,
    weight: 1.2,
    rubberColor: '#2B2B2B',
    accentColor: '#E0A656',
  },
  control: {
    id: 'control',
    name: 'Control',
    blurb: 'Generous sweet spot.',
    spinFactor: 1.05,
    powerFactor: 0.85,
    controlFactor: 1.5,
    weight: 0.9,
    rubberColor: '#6B4E3D',
    accentColor: '#D8B98C',
  },
}

/* ------------------------------------------------------------------ *
 * AI difficulty presets (unused logic in v1, stored only)
 * ------------------------------------------------------------------ */
export type DifficultyId = 'rookie' | 'casual' | 'skilled' | 'pro' | 'impossible'

export const DIFFICULTIES: Record<
  DifficultyId,
  { id: DifficultyId; name: string; blurb: string }
> = {
  rookie: { id: 'rookie', name: 'Rookie', blurb: 'Slow, forgiving.' },
  casual: { id: 'casual', name: 'Casual', blurb: 'Relaxed rally partner.' },
  skilled: { id: 'skilled', name: 'Skilled', blurb: 'Reads simple spin.' },
  pro: { id: 'pro', name: 'Pro', blurb: 'Adapts and attacks.' },
  impossible: {
    id: 'impossible',
    name: 'Impossible',
    blurb: 'Near-perfect returns.',
  },
}

/* ------------------------------------------------------------------ *
 * Camera & feel tuning
 * ------------------------------------------------------------------ */
export const CAMERA = {
  fov: 55,
  // first-person-ish over-table view, player's near edge
  position: new THREE.Vector3(0, 1.18, 1.55),
  target: new THREE.Vector3(0, 0.78, -0.4),
  // breathing
  breathAmp: 0.018,
  breathPeriod: 6.2,
  // mouse parallax
  parallaxRot: 0.05, // radians max tilt
  parallaxPos: 0.06, // meters max shift
  damp: 3.2,
} as const

/* Ball */
export const BALL = {
  radius: 0.02,
  color: '#FBF6EC',
} as const

/* Lighting intensities */
export const LIGHT = {
  ambient: 0.45,
  key: 1.1,
  fill: 0.4,
  rim: 0.55,
} as const
