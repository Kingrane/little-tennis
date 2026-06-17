import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/store/useGameStore'
import { physics } from '@/physics/PhysicsManager'
import { ai } from '@/ai/AIManager'
import { game } from '@/game/GameManager'
import { input } from '@/utils/input'

/**
 * GameLoop — invisible component inside Canvas.
 * Runs physics, AI, input, and game logic every frame.
 */

export default function GameLoop() {
  const serveUsed = useRef(false)

  useFrame((_state, dt) => {
    const clampedDt = Math.min(dt, 0.05)
    input.update(clampedDt)

    const phase = useGameStore.getState().phase

    if (phase === 'PLAYING') {
      physics.step(clampedDt)
      const ball = physics.ball
      ai.step(clampedDt, ball.position, ball.velocity, ball.active)
      game.onRallyFrame(clampedDt)
    } else if (phase === 'READY') {
      ai.step(clampedDt, physics.ball.position, physics.ball.velocity, false)

      if (!serveUsed.current && _pointerDown) {
        serveUsed.current = true
        game.serve()
      }
      if (!_pointerDown) {
        serveUsed.current = false
      }
    } else if (phase === 'POINT') {
      game.onRallyFrame(clampedDt)
      ai.step(clampedDt, physics.ball.position, physics.ball.velocity, false)
    } else {
      ai.step(clampedDt, physics.ball.position, physics.ball.velocity, false)
    }
  })

  return null
}

let _pointerDown = false
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => {
    _pointerDown = true
  })
  window.addEventListener('pointerup', () => {
    _pointerDown = false
  })
}
