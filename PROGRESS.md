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
  - `/components` — Lights, Table, Paddle, CameraRig, Effects, Loader
  - `/game` — GameManager (phase state machine BOOT→MENU→READY→PLAYING)
  - `/physics` — PhysicsManager (typed stub for custom ball+table physics)
  - `/ai` — AIManager (stub with per-difficulty tuning table)
  - `/ui` — Overlay, LandingScreen, MenuScreen, HUD
  - `/audio` — AudioManager (WebAudio synthesis: hit/bounce/net/score/hover/click)
  - `/shaders` — edgeGlow.ts (ready for richer glow)
  - `/store` — useGameStore (zustand)
  - `/utils` — constants.ts, easing.ts, input.ts
  - `/scenes` — MainScene, Environment
- **Visuals:**
  - Warm beige/cream/pink/blue/gold palette, soft studio HDRI, warm fog
  - Table at **real dimensions** (2.74 × 1.525 × 0.76 m, net 0.1525 m), emissive gold edge, procedural net mesh, line markings
  - Procedural decorative props (cylinders, frosted spheres, stacked blocks, torus arch, floating orbs)
  - Paddle (visual only) follows mouse with inertia + velocity tracking
  - Camera FOV 55 with breathing + mouse parallax, all damped (never 1:1)
  - Postprocessing: Bloom + Vignette + DOF + Chromatic Aberration + SMAA, ACES tone mapping
- **UX:** Landing screen (GSAP enter animation), menu for paddle (4) + difficulty (5) selection, HUD score rail 0:0
- **Audio:** WebAudio-synthesized warm voices, master volume from settings, init on first user gesture

### Known issues (to address later — user asked not to fix now)
- ⚠️ **Paddle looks "weird"** — proportions/orientation need polish (blade faces camera, handle pointing down). Parked per user request.
- ⚠️ **Table looks "weird" in background** — camera at player edge makes table recede; framing/scale may need tuning once gameplay lands.
- ⚠️ Build chunk > 500 kB (Three.js bundle) — add `manualChunks` code-splitting later.

---

## 🚧 Phase 2 — Ball Physics + Gameplay (NEXT)

**Goal:** a real, playable rally. Physics quality is the #1 non-negotiable.

### 2.1 Ball entity + custom physics (`/physics`)
- Ball mesh (procedural sphere, ~40mm diameter, matte cream)
- Integrate in `PhysicsManager.step(dt)`:
  - Linear velocity + gravity (9.81 m/s²)
  - Air drag (quadratic, realistic coefficient)
  - **Magnus effect** — spin vector × velocity → lateral acceleration
    - Topspin: accelerates downward → dips + accelerates after bounce
    - Backspin: lifts → floats + slows after bounce
    - Sidespin: curves sideways
- Collision: ball vs table top (bounce with restitution + friction → spin conversion)
- Collision: ball vs net (muted thud, point loss)
- Collision: ball vs paddle (impulse transfer using paddle factors)
- Out-of-bounds / double-bounce → point

### 2.2 Serve system
- Left click = serve (from `InputManager`)
- Ball spawns near player paddle, gentle toss + forward velocity over net
- Serve must bounce once on player side then clear net (standard rules)

### 2.3 Paddle hit detection + impulse
- Wire `PADDLES[id]` factors: `powerFactor`, `spinFactor`, `controlFactor`
- Hit strength from paddle movement speed (tracked velocity in Paddle.tsx already)
- Spin from swipe angle (curved swipe → spin axis)
- Sweet-spot: controlFactor enlarges effective hit area
- Shot types: topspin / backspin / sidespin / smash / soft touch

### 2.4 AI opponent (`/ai`)
- Implement `AIManager.step(dt, t)`:
  - Track incoming ball with **reaction-time delay** (per difficulty)
  - Move paddle toward predicted bounce point
  - Choose shot type by context + difficulty's `aggression` / `spinUse`
  - Add precision noise (per difficulty) — must feel human, make mistakes
  - Higher tiers read incoming spin and adapt
- AI paddle rendered across the table (negative Z)
- Tier tuning already in `TUNING` table (rookie → impossible)

### 2.5 Scoring + match loop (`/game`)
- Standard table tennis: 11 points, win by 2, alternate serves every 2 points
- `GameManager.scorePoint(toPlayer)` increments store, plays score chime
- Rally → point → reset serve → next rally
- Match end at 11 (win by 2) → ENDED phase → result screen

### 2.6 Controls refinement
- Mouse X/Y → paddle position (already done)
- Fast swipe → power (already tracked velocity)
- Curved swipe → spin (new)
- Left click = serve (wire up)
- Optional keyboard modifiers (Shift = power, Space = spin) — hooks ready in InputManager

### 2.7 Juice (game feel)
- Ball trail (soft, additive)
- Impact glow flash on paddle/table contact
- Subtle camera tilt on impact, tiny shake on smash
- Particle puff on bounce
- Audio: hit power-scaled, bounce, net, score already synthesized

---

## 🔮 Phase 3 — Polish + Modes

- Slow-motion replay on smash
- Practice mode (no AI, ball return trainer)
- Physics Sandbox (Leva debug panel for live tuning)
- Settings screen (volume / bloom / sensitivity sliders wired to store)
- Replay camera angles
- Visual polish pass: paddle redesign, table framing, environment refinement

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
- [ ] Phase 2 — Ball physics + gameplay
- [ ] Phase 3 — Polish + modes
- [ ] Phase 4 — Multiplayer
