import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { game } from '@/game/GameManager'
import { useGameStore } from '@/store/useGameStore'

/**
 * Landing / title screen.
 * Big thin-spaced title, gold ENTER button with glow hover.
 * Fade-in staggered via GSAP. Clicking ENTER initializes audio + enters menu.
 */
export function LandingScreen({ visible }: { visible: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const phase = useGameStore((s) => s.phase)
  const [leaving, setLeaving] = useState(false)

  // Animate in
  useEffect(() => {
    if (!visible || !rootRef.current) return
    const ctx = gsap.context(() => {
      gsap.from('.landing-eyebrow', {
        y: 14,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: 0.1,
      })
      gsap.from('.landing-title-line', {
        y: 60,
        opacity: 0,
        duration: 1.4,
        ease: 'power4.out',
        stagger: 0.12,
        delay: 0.25,
      })
      gsap.from('.landing-sub', {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
        delay: 1.0,
      })
      gsap.from('.landing-enter', {
        y: 24,
        opacity: 0,
        duration: 1.0,
        ease: 'power3.out',
        delay: 1.3,
      })
    }, rootRef)
    return () => ctx.revert()
  }, [visible])

  // Animate out when leaving BOOT
  useEffect(() => {
    if (phase !== 'BOOT' && !leaving) {
      setLeaving(true)
      if (rootRef.current) {
        gsap.to(rootRef.current, {
          opacity: 0,
          y: -16,
          duration: 0.9,
          ease: 'power3.inOut',
        })
      }
    }
  }, [phase, leaving])

  const onEnter = async () => {
    await game.enter()
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        background:
          'radial-gradient(ellipse at center, rgba(20,16,12,0.55) 0%, rgba(14,12,10,0.85) 70%)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div className="t-eyebrow landing-eyebrow">A Premium Experience</div>

      <h1
        className="t-title"
        style={{
          margin: '26px 0 8px',
          fontSize: 'clamp(44px, 8vw, 96px)',
          fontWeight: 200,
          letterSpacing: '0.06em',
          lineHeight: 1.0,
          color: 'var(--cream)',
          textShadow: '0 0 40px rgba(201,169,97,0.25)',
        }}
      >
        <span className="landing-title-line" style={{ display: 'block' }}>
          Table Tennis
        </span>
      </h1>

      <div
        className="landing-sub t-label"
        style={{
          marginTop: 14,
          marginBottom: 48,
          maxWidth: 480,
          color: 'var(--ink-soft)',
          letterSpacing: '0.28em',
          lineHeight: 1.7,
        }}
      >
        Soft · Tactile · Minimal
      </div>

      <button className="btn-glow landing-enter" onClick={onEnter}>
        Enter
      </button>

      <div
        style={{
          position: 'absolute',
          bottom: 32,
          opacity: 0.5,
          fontSize: 10,
          letterSpacing: '0.4em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        v0.1 · Foundation
      </div>
    </div>
  )
}
