import { Howl } from 'howler'
import { useGameStore } from '@/store/useGameStore'

/**
 * Premium Table Tennis — AudioManager.
 * Synthesized warm sounds via WebAudio (no external audio assets).
 *
 * Voices:
 *  - hit       : paddle strike (sine body + short noise transient)
 *  - bounce    : table bounce (lighter click)
 *  - net       : muted thud
 *  - score     : soft major chord swell
 *  - hover     : UI tick (very short)
 *  - click     : UI confirm
 *
 * All envelopes shaped with exponential ramps for warmth.
 */

type VoiceName = 'hit' | 'bounce' | 'net' | 'score' | 'hover' | 'click'

class AudioManager {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noiseBuffer: AudioBuffer | null = null
  private started = false

  /** Must be called from a user gesture (Enter / click). */
  async init(): Promise<void> {
    if (this.started) return
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!Ctx) return

    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = useGameStore.getState().settings.masterVolume
    this.master.connect(this.ctx.destination)

    // Pre-render a short white-noise buffer for transients.
    const len = this.ctx.sampleRate * 0.4
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    this.noiseBuffer = buf

    // Keep master gain in sync with settings.
    useGameStore.subscribe((s) => {
      if (this.master) this.master.gain.value = s.settings.masterVolume
    })

    this.started = true
    useGameStore.getState().setAudioReady(true)

    // Warm-up: resume if suspended.
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  get ready(): boolean {
    return this.started && this.ctx?.state === 'running'
  }

  /* ---------------- synthesis primitives ---------------- */

  private now(): number {
    return this.ctx ? this.ctx.currentTime : 0
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    attack = 0.004,
    detune = 0,
    dest?: AudioNode,
  ): void {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    const t0 = this.now()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g)
    g.connect(dest ?? this.master)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  private noise(
    dur: number,
    gain: number,
    filterFreq: number,
    q = 1,
    attack = 0.002,
    dest?: AudioNode,
  ): void {
    if (!this.ctx || !this.master || !this.noiseBuffer) return
    const ctx = this.ctx
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    src.loop = true
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = filterFreq
    filter.Q.value = q
    const g = ctx.createGain()
    const t0 = this.now()
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    src.connect(filter)
    filter.connect(g)
    g.connect(dest ?? this.master)
    src.start(t0)
    src.stop(t0 + dur + 0.02)
  }

  /* ---------------- public voices ---------------- */

  /** Paddle strike. */
  hit(power = 1): void {
    // Warm body — sine sweep down a touch
    const base = 320 + power * 80
    this.tone(base, 0.12, 'sine', 0.32 * power, 0.004, 0)
    this.tone(base * 1.5, 0.09, 'triangle', 0.12 * power, 0.004, 0)
    // Crisp transient — band-passed noise
    this.noise(0.04, 0.25 * power, 2200, 1.2)
  }

  /** Table bounce — lighter, higher click. */
  bounce(): void {
    this.tone(880, 0.06, 'sine', 0.22, 0.002, 0)
    this.tone(1320, 0.05, 'triangle', 0.1, 0.002, 0)
    this.noise(0.025, 0.12, 3000, 1.6)
  }

  /** Net touch — muted thud. */
  net(): void {
    this.tone(160, 0.18, 'sine', 0.28, 0.006, 0)
    this.noise(0.08, 0.1, 600, 0.8)
  }

  /** Score — soft major chord swell. */
  score(): void {
    // C major: C4 E4 G4
    this.tone(261.63, 0.9, 'sine', 0.16, 0.02, 0)
    this.tone(329.63, 0.9, 'sine', 0.14, 0.02, 0)
    this.tone(392.0, 0.9, 'sine', 0.12, 0.02, 0)
    this.tone(523.25, 1.1, 'sine', 0.08, 0.06, 0)
  }

  /** UI hover — tiny tick. */
  hover(): void {
    this.tone(1400, 0.05, 'sine', 0.06, 0.002, 0)
  }

  /** UI confirm click. */
  click(): void {
    this.tone(720, 0.08, 'sine', 0.14, 0.003, 0)
    this.tone(1080, 0.06, 'triangle', 0.08, 0.003, 0)
  }
}

export const audio = new AudioManager()
export type { VoiceName }

/* Howler placeholder kept for any future streamed UI samples. */
export function makeHowl(src: string): Howl {
  return new Howl({ src: [src], volume: 0.7 })
}
