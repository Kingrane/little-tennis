import { useGameStore } from '@/store/useGameStore'

/**
 * Minimal HUD.
 * Shows: score rail, serve indicator, match state.
 * Glow text, large thin numerals, center divider.
 */
export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const player = useGameStore((s) => s.scorePlayer)
  const aiScore = useGameStore((s) => s.scoreAI)
  const servingPlayer = useGameStore((s) => s.servingPlayer)
  const matchWinner = useGameStore((s) => s.matchWinner)

  if (phase === 'MENU' || phase === 'BOOT') return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'none',
      }}
    >
      {/* Score rail */}
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
        <ScoreSide label="You" value={player} align="right" serving={servingPlayer} />
        <div
          style={{
            width: 1,
            height: 26,
            background:
              'linear-gradient(to bottom, transparent, rgba(201,169,97,0.6), transparent)',
          }}
        />
        <ScoreSide label="AI" value={aiScore} align="left" serving={!servingPlayer} />
      </div>

      {/* Serve indicator */}
      {phase === 'READY' && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'var(--gold-bright)',
            textShadow: '0 0 12px rgba(201,169,97,0.5)',
            opacity: 0.85,
          }}
        >
          {servingPlayer ? 'Click to serve' : 'AI serving...'}
        </div>
      )}

      {/* Point flash */}
      {phase === 'POINT' && (
        <div
          style={{
            fontSize: 13,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: 'var(--cream)',
            textShadow: '0 0 18px rgba(201,169,97,0.6)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          Point
        </div>
      )}

      {/* Match end */}
      {phase === 'ENDED' && matchWinner && (
        <div
          style={{
            marginTop: 60,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 14,
              letterSpacing: '0.5em',
              textTransform: 'uppercase',
              color: 'var(--gold-bright)',
              textShadow: '0 0 20px rgba(201,169,97,0.6)',
              marginBottom: 8,
            }}
          >
            {matchWinner === 'player' ? 'You win' : 'AI wins'}
          </div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.3em',
              color: 'var(--ink-faint)',
            }}
          >
            {player} — {aiScore}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreSide({
  label,
  value,
  align,
  serving,
}: {
  label: string
  value: number
  align: 'left' | 'right'
  serving: boolean
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
          color: serving ? 'var(--gold)' : 'var(--ink-faint)',
          transition: 'color 0.4s ease',
        }}
      >
        {label}
        {serving && (
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--gold)',
              marginLeft: 5,
              verticalAlign: 'middle',
              boxShadow: '0 0 8px rgba(201,169,97,0.6)',
            }}
          />
        )}
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
