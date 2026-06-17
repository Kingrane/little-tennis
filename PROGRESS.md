# Premium Table Tennis — Progress & Roadmap

> Living document. Tracks what's done, what's not, and what comes next.
> The vision/spec lives in `AGENTS.md`; this file tracks execution.

---

## ✅ Phase 1 — Foundation (DONE)

**Goal:** premium-feeling 3D scene with table, paddle, camera, post-FX. No gameplay.

**Status:** Complete. `npm run build` and `tsc --noEmit` pass clean.

### Built
- **Skeleton:** Vite 5 + React 18 + TypeScript (strict) + path alias `@/` → `src/`
- **Stack:** three, @react-three/fiber, @react-three/drei, @react-three/postprocessing, zustand, gsap, howler, leva, maath
- **Architecture** (matches AGENTS.md):
  - `/components` — Lights, Table, Paddle, CameraRig, Effects, Loader, Ball, GameLoop
  - `/game` — GameManager (phase state machine + serve/scoring/match loop)
  - `/physics` — PhysicsManager (custom ball physics: gravity, drag, Magnus, collisions)
  - `/ai` — AIManager (difficulty-tuned opponent with prediction + reaction delay)
  - `/ui` — Overlay, LandingScreen, MenuScreen, HUD
  - `/audio` — AudioManager (WebAudio synthesis: hit/bounce/net/score/hover/click)
  - `/shaders` — edgeGlow.ts
  - `/store` — useGameStore (zustand)
  - `/utils` — constants.ts, easing.ts, input.ts
  - `/scenes` — MainScene, Environment
- **Visuals:**
  - Warm beige/cream/pink/blue/gold palette, soft studio HDRI, warm fog
  - Table at **real dimensions** (2.74 × 1.525 × 0.76 m, net 0.1525 m), emissive gold edge, procedural net mesh, line markings
  - Procedural decorative props (cylinders, frosted spheres, stacked blocks, torus arch, floating orbs)
  - Camera FOV 55 with breathing + mouse parallax, all damped (never 1:1)
  - Postprocessing: Bloom + Vignette + DOF + Chromatic Aberration + SMAA, ACES tone mapping
- **UX:** Landing screen (GSAP enter animation), menu for paddle (4) + difficulty (5) selection, HUD score rail
- **Audio:** WebAudio-synthesized warm voices, master volume from settings, init on first user gesture

---

## ✅ Phase 2 — Ball Physics + Gameplay (DONE)

**Goal:** a real, playable rally. Physics quality is the #1 non-negotiable.

**Status:** Complete. `npm run build` and `tsc --noEmit` pass clean.

### Built
- **Ball Physics (PhysicsManager):**
  - Gravity (9.81 m/s²)
  - Air drag (quadratic, realistic coefficient ρ=1.225, Cd=0.55)
  - **Magnus effect** — spin vector × velocity → lateral acceleration
    - Topspin: dips faster, accelerates after bounce
    - Backspin: floats, slows after bounce
    - Sidespin: curves sideways
  - Table bounce: restitution (0.82), friction (0.35), spin→linear conversion
  - Paddle collision: AABB check, approach direction gate, impulse transfer
  - Power/spin/control factors from paddle preset
  - Net collision: dampened thud, ball pushed away
  - Out-of-bounds detection
  - 4 substeps per frame for numerical stability
- **Ball Component (Ball.tsx):**
  - 40mm procedural sphere, cream-white, emissive glow
  - Speed-scaled glow sphere (additive)
  - Motion trail (16 fading sphere particles)
  - Impact flash light on paddle hit
- **Serve System:**
  - Left click to serve during READY phase
  - Ball spawns with gentle arc over net
  - Random slight jitter for variety
  - Serve alternates every 2 points (standard rules)
- **AI Opponent (AIManager):**
  - 5 difficulty tiers: Rookie → Impossible
  - Per-difficulty: reaction time, precision, aggression, spin use, max speed
  - Ball trajectory prediction (forward trace with gravity + bounce)
  - Reaction delay before moving
  - Precision noise (human-like mistakes)
  - Idle sway when ball inactive
- **Scoring + Match Loop:**
  - 11 points, win by 2
  - Serve alternates every 2 points
  - Phase flow: READY → serve → PLAYING → rally → OUT → POINT → (1.5s) → READY
  - Match end → ENDED screen with result
  - Play Again / Menu buttons
- **Paddle System:**
  - Player paddle: mouse tracking with smoothing, velocity tracking for physics
  - AI paddle: position driven by AIManager, synced to physics
  - Both feed position/velocity to PhysicsManager
  - Paddle presets (Balanced/Spin/Power/Control) affect power/spin factors
- **Camera:**
  - Impact shake from PhysicsManager.cameraShake
  - Decay factor for smooth recovery
- **HUD:**
  - Score rail with glow numerals
  - Serve indicator (dot + text)
  - Point flash
  - Match end result display

### Known issues (to address later)
- ⚠️ Build chunk > 500 kB (Three.js bundle) — add `manualChunks` code-splitting later.
- ⚠️ Paddle visual proportions could use polish.
- ⚠️ Table framing in camera may need tuning.

---

## 🔮 Phase 3 — Polish + Modes

- Slow-motion replay on smash
- Practice mode (no AI, ball return trainer)
- Physics Sandbox (Leva debug panel for live tuning)
- Settings screen (volume / bloom / sensitivity sliders wired to store)
- Replay camera angles
- Visual polish pass: paddle redesign, table framing, environment refinement
- Ball trail as smooth line instead of particle dots
- Better serve validation (bounce on server side first)

---

## 🌐 Phase 4+ — Multiplayer & Beyond (future)

- Socket.io server + client
- Ranked matches, room codes, spectator mode
- Paddle customization editor
- Tournaments
- Spin training challenges, trick shots

---

## Run commands

```cmd
npm run dev        → dev server http://localhost:5173
npm run build      → production build (verified)
npm run typecheck  → tsc --noEmit (verified clean)
npm run preview    → preview built dist
```

## Phase checkpoints
- [x] Phase 1 — Foundation (DONE, build clean)
- [x] Phase 2 — Ball physics + gameplay (DONE, build clean)
- [ ] Phase 3 — Polish + modes
- [ ] Phase 4 — Multiplayer
