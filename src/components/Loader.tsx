import { Html, useProgress } from '@react-three/drei'

/**
 * In-canvas loader shown while assets/HDRI stream in.
 * Minimal beige dots — matches the boot loader aesthetic.
 */
export function Loader() {
  const { progress, active } = useProgress()
  if (!active && progress >= 100) return null

  return (
    <Html center>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          color: '#f7f1e8',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#c9a961',
                animation: `bob 1.4s ${i * 0.2}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: 9,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          Preparing the table
        </div>
      </div>
    </Html>
  )
}
