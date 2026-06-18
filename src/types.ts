export enum GameMode {
  MENU = "MENU",
  PRACTICE = "PRACTICE",
  MATCH = "MATCH",
  MULTIPLAYER = "MULTIPLAYER",
}

export enum Difficulty {
  ROOKIE = "ROOKIE",
  CASUAL = "CASUAL",
  SKILLED = "SKILLED",
  PRO = "PRO",
  IMPOSSIBLE = "IMPOSSIBLE",
}

export enum PaddleType {
  BALANCED = "BALANCED",
  SPIN_MASTER = "SPIN_MASTER",
  POWER = "POWER",
  CONTROL = "CONTROL",
}

export interface PaddleConfig {
  id: PaddleType;
  name: string;
  description: string;
  spinFactor: number;
  powerFactor: number;
  controlFactor: number; // bigger Sweet Spot or path correction
  weight: number;
  color: string;
  borderColor: string;
}

export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  reactionTime: number; // lag in seconds
  speedLimit: number; // max units per second
  errorRate: number; // 0 (perfect) to 1 (clumsy)
  spinAggression: number; // how much spin AI tries to put
  placeAggression: number; // how wide AI places shots
}

export interface ScoreState {
  player: number;
  opponent: number;
}

export enum ServiceStatus {
  NONE = "NONE",
  PLAYER_SERVE = "PLAYER_SERVE",
  OPPONENT_SERVE = "OPPONENT_SERVE",
}

export interface GameSettings {
  difficulty: Difficulty;
  paddleType: PaddleType;
  audioVolume: number;
  soundEnabled: boolean;
}
