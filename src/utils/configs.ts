import { Difficulty, DifficultyConfig, PaddleConfig, PaddleType } from "../types";

export const TABLE_DIMENSIONS = {
  length: 2.74, // in meters (Z)
  width: 1.525, // in meters (X)
  height: 0.76, // table height from ground (Y)
  netHeight: 0.1525, // net height (Y from table surface)
  netWidth: 1.525 * 1, // Net extends slightly over the sides
};

export const PADDLE_CONFIGS: Record<PaddleType, PaddleConfig> = {
  [PaddleType.BALANCED]: {
    id: PaddleType.BALANCED,
    name: "Balanced",
    description: "Evenly balanced rubber. Excellent for players finding their tempo.",
    spinFactor: 1.0,
    powerFactor: 1.0,
    controlFactor: 1.0,
    weight: 0.185, // kg
    color: "#d45b53", // Deep satin crimson rubber
    borderColor: "#eae5dc",
  },
  [PaddleType.SPIN_MASTER]: {
    id: PaddleType.SPIN_MASTER,
    name: "Spin Master",
    description: "Highly tacky friction-heavy surface. Lets you carve curves in mid-air.",
    spinFactor: 1.6,
    powerFactor: 0.85,
    controlFactor: 0.95,
    weight: 0.170,
    color: "#5f4b8b", // Matte violet rubber
    borderColor: "#f2ece4",
  },
  [PaddleType.POWER]: {
    id: PaddleType.POWER,
    name: "Tectonic Power",
    description: "Carbon-reinforced blade. Speeds up bounces to smash past opponents.",
    spinFactor: 0.75,
    powerFactor: 1.45,
    controlFactor: 0.85,
    weight: 0.205,
    color: "#1e3a8a", // Carbon slate blue
    borderColor: "#e5e7eb",
  },
  [PaddleType.CONTROL]: {
    id: PaddleType.CONTROL,
    name: "Zen Control",
    description: "Vibration-absorbing soft sponge. Larger sweet spot for precise placements.",
    spinFactor: 1.0,
    powerFactor: 0.8,
    controlFactor: 1.5, // Larger hitbox size
    weight: 0.180,
    color: "#1e3d2f", // Sage green matte
    borderColor: "#dedad2",
  },
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  [Difficulty.ROOKIE]: {
    id: Difficulty.ROOKIE,
    name: "Rookie Bot",
    reactionTime: 0.35, // slow reaction delay (350ms code lag)
    speedLimit: 1.5, // very slow tracking speed (m/s)
    errorRate: 0.35, // frequently misses or hits suboptimally
    spinAggression: 0.1,
    placeAggression: 0.2,
  },
  [Difficulty.CASUAL]: {
    id: Difficulty.CASUAL,
    name: "Casual Bot",
    reactionTime: 0.22, // 220ms lag
    speedLimit: 2.2,
    errorRate: 0.18,
    spinAggression: 0.3,
    placeAggression: 0.4,
  },
  [Difficulty.SKILLED]: {
    id: Difficulty.SKILLED,
    name: "Skilled Bot",
    reactionTime: 0.14, // 140ms
    speedLimit: 3.5,
    errorRate: 0.08,
    spinAggression: 0.5,
    placeAggression: 0.6,
  },
  [Difficulty.PRO]: {
    id: Difficulty.PRO,
    name: "Pro Master",
    reactionTime: 0.07, // 70ms response time
    speedLimit: 5.5,
    errorRate: 0.02,
    spinAggression: 0.8,
    placeAggression: 0.85,
  },
  [Difficulty.IMPOSSIBLE]: {
    id: Difficulty.IMPOSSIBLE,
    name: "DeepSpin AI",
    reactionTime: 0.01, // 10ms - almost instantaneous reading
    speedLimit: 9.0, // track highly hyperactive shots
    errorRate: 0.0, // flawless positioning
    spinAggression: 1.0,
    placeAggression: 0.95,
  },
};
