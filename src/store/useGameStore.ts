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

  /* score */
  scorePlayer: number
  scoreAI: number

  /* serve */
  servingPlayer: boolean // true = player serves, false = AI serves
  serveCount: number // how many serves have been made total

  /* match */
  rallyActive: boolean
  matchWinner: 'player' | 'ai' | null

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
  scorePoint: (toPlayer: boolean) => void
  setServing: (player: boolean) => void
  setRallyActive: (v: boolean) => void
  reset: () => void
  resetMatch: () => void
}

const defaultSettings: Settings = {
  masterVolume: 0.7,
  bloom: 0.9,
  mouseSensitivity: 1.0,
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'BOOT',
  paddle: 'balanced',
  difficulty: 'skilled',
  scorePlayer: 0,
  scoreAI: 0,
  servingPlayer: true,
  serveCount: 0,
  rallyActive: false,
  matchWinner: null,
  settings: defaultSettings,
  audioReady: false,

  setPhase: (phase) => set({ phase }),
  setPaddle: (paddle) => set({ paddle }),
  setDifficulty: (difficulty) => set({ difficulty }),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setAudioReady: (audioReady) => set({ audioReady }),

  scorePoint: (toPlayer: boolean) => {
    const s = get()
    const newPlayer = s.scorePlayer + (toPlayer ? 1 : 0)
    const newAI = s.scoreAI + (toPlayer ? 0 : 1)

    // Check win: 11 points, win by 2
    const maxScore = Math.max(newPlayer, newAI)
    let winner: 'player' | 'ai' | null = null
    if (maxScore >= 11) {
      if (newPlayer >= 11 && newPlayer - newAI >= 2) winner = 'player'
      if (newAI >= 11 && newAI - newPlayer >= 2) winner = 'ai'
    }

    set({
      scorePlayer: newPlayer,
      scoreAI: newAI,
      serveCount: s.serveCount + 1,
      // Alternate serve every 2 points
      servingPlayer: Math.floor((s.serveCount + 1) / 2) % 2 === 0,
      matchWinner: winner,
    })
  },

  setServing: (player) => set({ servingPlayer: player }),
  setRallyActive: (rallyActive) => set({ rallyActive }),

  reset: () =>
    set({
      phase: 'MENU',
      scorePlayer: 0,
      scoreAI: 0,
      serveCount: 0,
      servingPlayer: true,
      rallyActive: false,
      matchWinner: null,
    }),

  resetMatch: () =>
    set({
      scorePlayer: 0,
      scoreAI: 0,
      serveCount: 0,
      servingPlayer: true,
      rallyActive: false,
      matchWinner: null,
      phase: 'READY',
    }),
}))
