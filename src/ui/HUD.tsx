import { useGameStore } from '@/store/useGameStore'

/**
 * Minimal HUD.
 * v1 shows only the score rail (0 : 0). Glow text, large thin numerals.
 * Center divider. Player left, AI right.
 */
export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const player = useGameStore((s) => s.scorePlayer)
  const aiScore = useGameStore((s) => s.scoreAI)

  if (phase === 'MENU' || phase === 'BOOT') return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          padding: '10px 28px',
          background: 'rgba(20, 16, 12, 0.35)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(247,241,232,0.08)',
          borderRadius: 999,
        }}
      >
        <ScoreSide label="You" value={player} align="right" />
        <div
          style={{
            width: 1,
            height: 26,
            background:
              'linear-gradient(to bottom, transparent, rgba(201,169,97,0.6), transparent)',
          }}
        />
        <ScoreSide label="AI" value={aiScore} align="left" />
      </div>
    </div>
  )
}

function ScoreSide({
  label,
  value,
  align,
}: {
  label: string
  value: number
  align: 'left' | 'right'
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : 'flex-start',
        minWidth: 56,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.32em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontWeight: 200,
          fontSize: 34,
          lineHeight: 1,
          color: 'var(--cream)',
          textShadow: '0 0 22px rgba(201,169,97,0.35)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  )
}
