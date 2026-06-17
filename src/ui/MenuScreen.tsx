import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGameStore } from '@/store/useGameStore'
import { game } from '@/game/GameManager'
import {
  PADDLES,
  DIFFICULTIES,
  type PaddleId,
  type DifficultyId,
} from '@/utils/constants'

/**
 * Pre-match menu: choose paddle + difficulty + mode.
 * v1: Practice / AI Match buttons transition to READY (no gameplay yet).
 *
 * Minimal thin typography, rounded glow pills, GSAP enter transitions.
 */
export function MenuScreen() {
  const rootRef = useRef<HTMLDivElement>(null)
  const phase = useGameStore((s) => s.phase)
  const paddle = useGameStore((s) => s.paddle)
  const difficulty = useGameStore((s) => s.difficulty)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.menu-item', {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.07,
        delay: 0.1,
      })
    }, rootRef)
    return () => ctx.revert()
  }, [phase])

  if (phase === 'BOOT') return null

  const paddleList = Object.values(PADDLES)
  const diffList = Object.values(DIFFICULTIES)

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 'min(680px, 92vw)',
          padding: '48px 56px',
          background: 'rgba(20, 16, 12, 0.5)',
          backdropFilter: 'blur(18px)',
          border: '1px solid rgba(201,169,97,0.18)',
          borderRadius: 28,
          boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
          pointerEvents: 'auto',
        }}
      >
        <div className="t-eyebrow menu-item" style={{ marginBottom: 8 }}>
          Configure Match
        </div>

        {/* Paddle selection */}
        <div className="menu-item" style={{ marginTop: 24 }}>
          <div className="t-label" style={{ marginBottom: 14 }}>
            Paddle
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {paddleList.map((p) => (
              <button
                key={p.id}
                className={`btn-pill ${paddle === p.id ? 'is-active' : ''}`}
                onClick={() => game.setPaddle(p.id as PaddleId)}
                title={p.blurb}
              >
                {p.name}
              </button>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              letterSpacing: '0.12em',
              color: 'var(--ink-faint)',
              minHeight: 16,
            }}
          >
            {PADDLES[paddle].blurb}
          </div>
        </div>

        {/* Difficulty */}
        <div className="menu-item" style={{ marginTop: 24 }}>
          <div className="t-label" style={{ marginBottom: 14 }}>
            Difficulty
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {diffList.map((d) => (
              <button
                key={d.id}
                className={`btn-pill ${difficulty === d.id ? 'is-active' : ''}`}
                onClick={() => game.setDifficulty(d.id as DifficultyId)}
                title={d.blurb}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        {/* Modes */}
        <div
          className="menu-item"
          style={{ marginTop: 36, display: 'flex', gap: 16, justifyContent: 'center' }}
        >
          <button className="btn-glow" onClick={() => game.startMatch()}>
            Practice
          </button>
          <button className="btn-glow" onClick={() => game.startMatch()}>
            AI Match
          </button>
        </div>

        <div
          className="menu-item"
          style={{
            marginTop: 22,
            textAlign: 'center',
            fontSize: 10,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Gameplay arrives next phase
        </div>
      </div>
    </div>
  )
}
