# Project: Premium Minimal Table Tennis (Web)

## Vision

Build a highly polished premium-feeling 3D table tennis game for the browser.

This is NOT an arcade game.

It should feel like:

- tactile
- soft
- minimal
- luxurious
- smooth
- responsive
- satisfying

Main inspiration:

Minimalistic warm-beige environment, soft bloom, glowing UI, rounded geometry, ambient lighting, almost toy-like but premium.

Think:

- Apple-like product visualization
- calm zen atmosphere
- smooth interactions
- realistic ping pong physics
- elegant sound design

The emotional goal:

"Feels expensive."

---

# Core Stack

Use:

- Three.js (rendering)
- React + Vite
- React Three Fiber
- Drei
- Rapier (physics)
- Zustand (state management)
- GSAP (animations)
- Postprocessing (bloom, vignette, DOF)
- Howler.js (audio)
- Socket.io (future multiplayer)

Optional:

- Leva (debug tuning)
- Theatre.js (camera choreography)

---

# Main Gameplay

Create a first-person / over-table table tennis simulator.

Game loop:

1. Ball spawns.
2. Serve starts.
3. Ball follows realistic physics.
4. Player controls paddle.
5. AI opponent returns shots.
6. Score updates.
7. Repeat.

Modes:

- Practice
- AI Match
- Multiplayer (future)
- Physics Sandbox

Version 1:

Focus ONLY on:

- Practice
- AI Match

---

# Game Feel Requirements

Everything must feel premium.

Rules:

- no harsh motion
- no sudden camera snaps
- no stiff movement
- no cheap game-like effects
- everything interpolated
- everything smooth

Must have:

- smooth easing
- subtle camera sway
- slight paddle inertia
- soft ball trails
- impact glow
- responsive collisions

---

# Art Direction

## Environment

Style:

Soft monochrome minimalism.

Palette:

- warm beige
- cream white
- pale pink
- light blue table
- soft gold UI accents

Materials:

- matte plastic
- satin
- soft rubber
- frosted surfaces

Scene elements:

- abstract cylinders
- spheres
- cubes
- arches
- stacked blocks

Purpose:

Pure aesthetic balance.

---

# Lighting

Use:

- HDRI soft studio lighting
- area lights
- ambient fill
- contact shadows

Must feel:

- warm
- diffused
- soft
- cozy

No harsh shadows.

---

# Camera

Perspective:

Over-table forward-facing.

Requirements:

- subtle floating motion
- mouse-based micro movement
- cinematic easing
- FOV 50–60

Camera effects:

- small breathing movement
- slight tilt on impact
- tiny shake on smash

Never aggressive.

---

# Table

Accurate dimensions.

Real table tennis proportions:

Length: 2.74m
Width: 1.525m
Height: 0.76m
Net height: 0.1525m

Visual style:

Rounded corners.
Soft emissive edge glow.

---

# Paddle System

Before match starts:

Player selects paddle.

Paddle types:

## Balanced
Normal everything.

## Spin Master
Higher spin multiplier.

## Power
Higher hit force.

## Control
Larger sweet spot.

Paddle properties:

- spinFactor
- powerFactor
- controlFactor
- weight

Visual differences:

Subtle only.

Premium materials.

---

# Ball Physics (VERY IMPORTANT)

This is the most important system.

Must simulate:

- forward velocity
- bounce angle
- spin
- friction
- air drag
- impact force
- paddle angle influence

Required:

## Topspin

Ball accelerates after bounce.

## Backspin

Ball slows down after bounce.

## Sidespin

Ball curves sideways.

## Smash

Fast direct shot.

## Soft touch

Low speed placement.

Physics formula priorities:

Use:

- angular velocity
- linear velocity
- collision normals
- impulse transfer

Ball must feel:

real,
alive,
dynamic.

Not robotic.

---

# Player Controls

Mouse controls paddle.

Movement:

- X = horizontal
- Y = vertical

Features:

- smooth interpolation
- velocity tracking
- hit strength from movement speed
- spin from swipe angle

Controls:

Left click = serve
Fast swipe = power
Curved swipe = spin

Important:

Paddle movement must never feel 1:1 robotic.
Use smoothing.

---

# AI Opponent

Difficulty selector before match:

- Rookie
- Casual
- Skilled
- Pro
- Impossible

Each difficulty changes:

- reaction time
- precision
- shot variation
- spin usage
- aggression

AI behavior:

Must feel human.

Not perfect.

Should make mistakes.

Should have personality.

Examples:

Rookie:
slow, inaccurate.

Pro:
reads spin, adapts.

Impossible:
near perfect.

---

# Scoring

Standard ping pong scoring.

Rules:

- 11 points
- win by 2

Display:

Large floating UI.

Layout:

Player score left.
AI score right.

Center divider.

Minimal typography.

Glowing text.

---

# UI/UX

Must feel futuristic.

Menu:

- Start
- Select paddle
- Select difficulty
- Practice
- Settings

Transitions:

Smooth fades.
Soft zooms.
Motion blur.

Buttons:

Rounded.
Glowing.
Hover animations.

Typography:

Thin.
Elegant.
Spaced out.

---

# Sound Design

Soft satisfying sounds.

Need:

- paddle hit
- table bounce
- net touch
- score point
- menu hover

Sound style:

- warm
- crisp
- subtle

No loud arcade sounds.

---

# Visual Effects

Required:

- bloom
- subtle chromatic aberration
- soft vignette
- ball trail
- impact particles
- contact glow

Optional:

- slow motion on smash
- replay camera

---

# Procedural Asset Creation

Do NOT use external models first.

Generate everything procedurally.

Use primitive geometry:

- boxes
- cylinders
- spheres
- capsules
- torus

Create:

- paddles
- environment props
- table
- net
- UI anchors

Keep style consistent.

Only use custom models if absolutely necessary.

---

# Code Architecture

Structure:

/src
/components
/game
/physics
/ai
/ui
/audio
/shaders
/store
/utils
/scenes

Important systems:

GameManager
PhysicsManager
AIManager
InputManager
AudioManager

Keep everything modular.

---

# Performance

Target:

144 FPS desktop.

Requirements:

- optimized shadows
- instancing
- minimal draw calls
- lightweight postprocessing

Must feel ultra smooth.

---

# Future Roadmap

Phase 2:

- online multiplayer
- ranked matches
- paddle customization
- replays
- tournaments
- room codes
- spectator mode

Phase 3:

- advanced trick shots
- spin training
- challenges

---

# Non-Negotiables

Absolute priorities:

1. Physics quality > everything
2. Smoothness > everything
3. Premium visuals > complexity
4. Feel > features
5. Atmosphere > realism

If something feels cheap:

redo it.

If physics feel fake:

redo them.

If movement feels stiff:

redo them.

The game should feel beautiful even when doing nothing.