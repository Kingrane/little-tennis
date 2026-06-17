import { create } from 'zustand'
import type { PaddleId, DifficultyId } from '@/utils/constants'

/**
 * Premium Table Tennis — central game state.
 * UI overlay + 3D scene both subscribe here.
 */

export type GamePhase = 'BOOT' | 'MENU' | 'READY' | 'PLAYING' | 'POINT' | 'ENDED'

export interface Settings {
  masterVolume: number // 0..1
  bloom: number // 0..2
  mouseSensitivity: number // 0.5..2
}

interface GameState {
  /* lifecycle */
  phase: GamePhase

  /* selection */
  paddle: PaddleId
  difficulty: DifficultyId

  /* score (wired in a later phase) */
  scorePlayer: number
  scoreAI: number

  /* settings */
  settings: Settings

  /* flags */
  audioReady: boolean

  /* actions */
  setPhase: (p: GamePhase) => void
  setPaddle: (p: PaddleId) => void
  setDifficulty: (d: DifficultyId) => void
  updateSettings: (partial: Partial<Settings>) => void
  setAudioReady: (v: boolean) => void
  reset: () => void
}

const defaultSettings: Settings = {
  masterVolume: 0.7,
  bloom: 0.9,
  mouseSensitivity: 1.0,
}

export const useGameStore = create<GameState>((set) => ({
  phase: 'BOOT',
  paddle: 'balanced',
  difficulty: 'skilled',
  scorePlayer: 0,
  scoreAI: 0,
  settings: defaultSettings,
  audioReady: false,

  setPhase: (phase) => set({ phase }),
  setPaddle: (paddle) => set({ paddle }),
  setDifficulty: (difficulty) => set({ difficulty }),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setAudioReady: (audioReady) => set({ audioReady }),
  reset: () =>
    set({
      phase: 'MENU',
      scorePlayer: 0,
      scoreAI: 0,
    }),
}))
