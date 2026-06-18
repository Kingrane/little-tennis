# Premium Minimal Table Tennis — Developers & Agents Guide

Welcome! This system-level documentation details the full architectural layout, physics engine, and design paradigms for the **Premium Minimal Table Tennis** 3D simulation.

---

## 1. Project Overview & Aesthetic Focus

This application is a highly polished, offline-first 3D table tennis game built on **Three.js** with **React**, **Vite**, and **Tailwind CSS**. It rejects generic, colorful gradients and overused dark modes in favor of a modern, editorial, **warm-cream Scandinavian minimalist layout** (Color palette: warm off-whites, neutral deep charcoal gray, satin matte veneers, and soft warm gold accents).

### Architectural Stack
- **Graphics Engine**: Three.js (WebGLRenderer with shadows, custom geometries, soft exponential distance/fog blending).
- **Frontend & State Layer**: React (functional components, synchronized state boundaries, custom HUD overlays, responsive overlays).
- **Physics Engine**: Custom 144Hz-ready analytical kinematic solvers with gravity, aerodynamic drag, and lateral **Magnus Spin-Force Drift**.
- **Audio Synths**: Custom multi-voice tone generators producing realistic wooden paddle impacts, glass/metallic score celebrations, and table-surface bounces.

---

## 2. File Directory Architecture

- **`/src/types.ts`**: Holds primary type declarations: `Difficulty`, enums for `ServiceStatus`, `GameMode`, and option objects.
- **`/src/audio/AudioManager.ts`**: Web Audio API synthesizer synthesizing high-quality, zero-latency physical collision alerts without any assets dependencies.
- **`/src/utils/configs.ts`**: Dimension settings of the table (`TABLE_DIMENSIONS`), paddle types configuration factors, and five levels of bot configurations (reaction delay, error percentage, placement boundaries).
- **`/src/components/GameCanvas.tsx`**: The main powerhouse. Handles Three.js initializations, player cursor inputs, real-time physics tick, collision solvers (table bounce, net, paddle, boundaries), particle triggers, trail updates, and adaptive camera sways.
- **`/src/components/GameHUD.tsx`**: Displays minimal status prompts, pause options, audio toggle, and the central retro scoring cards.
- **`/src/components/MainMenu.tsx`**: Clean start-up menu featuring selecting bots, paddles and options.
- **`/metadata.json`**: Framework deployment descriptors and client/server-side platform configuration flags.

---

## 3. High-Fidelity Physics Implementation Detail

Future developers and agent coders must preserve the physical behaviors modeled below whenever editing the rendering loops:

### 3.1 Kinematics & Drag
In the frame tick, when `ballPhysics.current.isTossed` is active, the delta-time `dt` modifies position tracking while capping frame-time at `0.05` to prevent lag-induced visual breakouts:
$$\vec{v}_{next} = \vec{v} - (g \cdot \hat{y} \cdot dt)$$
- Standard gravity ($g = 9.81\text{ ms}^{-2}$) pulls the ball down.
- Aerodynamic drag decreases speed dynamically ($C_d = 0.18$):
$$\vec{F}_{drag} = -0.18 \cdot ||\vec{v}|| \cdot \vec{v}$$

### 3.2 Simplified Magnus Spin-Drift (Aeroydynamic Drift)
To maintain stable, predictable corner shots while still displaying beautiful, visual flight curves, the **Z-momentum cross-coupling term has been set to 0**. The Magnus effect operates as follows:
- **Horizontal Sidespin (`spin.y`)**: Creates a purely lateral horizontal sweep:
$$a_x = 0.035 \cdot \text{spin}_y \cdot |v_z|$$
- **Vertical Topspin / Backspin (`spin.x`)**: Pulls the ball downward (topspeed) or lifts it upward (backspin):
$$a_y = -0.035 \cdot \text{spin}_x \cdot v_z$$
- **Z-Momentum Recovery**: Force-capped to $0$ on the Z axis to bypass unexpected slowdowns when aiming into extreme corners.

### 3.3 Paddle Collision Hit solvers
A manual swipe strike triggers when player paddle coordinates overlap radial proximity metrics (Hit limit $r=0.22\text{m}$) within the sweet spot boundary ($Z \in [-1.6\text{m}, -1.1\text{m}]$):
- **Contact Lift**: Base lift vectors clear the net with additional up/down velocity proportional to mouse swipe velocity.
- **Automatic Serve Assistance**: For seamless accessibility, double-clicking or clicking *while* the ball is tossed executes a high-precision default serve directly toward the opponent's side, eliminating frustrating serve misses.

---

## 4. Key Security & Operational Mandates for Future Agents

1. **Keep API Keys Server-Side**: The app operates inside sandboxed secure platforms. Never declare or pass raw credential strings client-side.
2. **Prevent double scoring loops**: Ensure any point scoring triggers set `rallyState.current.isScorePending = true` immediately, blocking further frame executions from scheduling redundant `resetBall` timeouts. Reset the flag to `false` in `resetBall`.
3. **Typography and Controls**: Standard text is styled using Inter and Space Grotesk. Do not override current CSS alignments which provide gorgeous anti-tech-larp breathing spaces.
4. **Practice/Sandbox Mode Scoreboard**: Practice mode displays infinite playing counters without shifting servers or ending rounds at 11, allowing for long endurance training rallies. Keep both score displays active in the HUD.
