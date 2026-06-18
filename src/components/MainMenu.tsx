import React, { useState } from "react";
import { GameMode, Difficulty, PaddleType } from "../types";
import { PADDLE_CONFIGS, DIFFICULTY_CONFIGS } from "../utils/configs";
import { audioManager } from "../audio/AudioManager";
import { Play, Volume2, VolumeX, Lock, Sun, Moon } from "lucide-react";

interface MainMenuProps {
  onStartGame: (mode: GameMode, difficulty: Difficulty, paddle: PaddleType) => void;
  defaultDifficulty: Difficulty;
  defaultPaddle: PaddleType;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  defaultDifficulty,
  defaultPaddle,
  soundEnabled,
  onToggleSound,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [selectedPaddle, setSelectedPaddle] = useState<PaddleType>(defaultPaddle);
  const [unlockedImpossible, setUnlockedImpossible] = useState(false);
  const [isDark, setIsDark] = useState(false); // Light theme as the default

  const handleHover = () => {
    audioManager.playMenuHover();
  };

  const handleSelectPaddle = (type: PaddleType) => {
    setSelectedPaddle(type);
    audioManager.playMenuSelect();
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    if (diff === Difficulty.IMPOSSIBLE && !unlockedImpossible) {
      setUnlockedImpossible(true);
      audioManager.playScorePoint(true);
    }
    setSelectedDifficulty(diff);
    audioManager.playMenuSelect();
  };

  const handleStartMatch = () => {
    audioManager.playMenuSelect();
    onStartGame(GameMode.MATCH, selectedDifficulty, selectedPaddle);
  };

  const handleStartPractice = () => {
    audioManager.playMenuSelect();
    onStartGame(GameMode.PRACTICE, selectedDifficulty, selectedPaddle);
  };

  const difficulties = Object.values(DIFFICULTY_CONFIGS);
  const paddles = Object.values(PADDLE_CONFIGS);

  const getSpecs = (type: PaddleType) => {
    switch (type) {
      case PaddleType.BALANCED:
        return { lvl: "LVL 1", rebound: 65, friction: 68 };
      case PaddleType.SPIN_MASTER:
        return { lvl: "LVL 3", rebound: 55, friction: 92 };
      case PaddleType.POWER:
        return { lvl: "LVL 4", rebound: 85, friction: 50 };
      case PaddleType.CONTROL:
        return { lvl: "LVL 2", rebound: 48, friction: 70 };
      default:
        return { lvl: "LVL 1", rebound: 65, friction: 68 };
    }
  };

  const specs = getSpecs(selectedPaddle);

  return (
    <div className={`w-full min-h-screen flex flex-col justify-between p-6 md:p-10 relative overflow-x-hidden select-none font-sans antialiased transition-colors duration-500 ${isDark ? "bg-[#0E0907] text-[#EAE3DC]" : "bg-[#F7F4EE] text-[#1C1613]"
      }`}>
      {/* 1. Ambient Scandinavian Sunset Mesh Lighting */}
      <div className="absolute inset-x-0 top-0 h-full w-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full blur-[120px] mix-blend-screen transition-all duration-700 ${isDark ? "bg-[#cb6239]/15" : "bg-[#DF5F43]/10"
          }`} />
        <div className={`absolute top-10 right-10 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full blur-[100px] transition-all duration-700 ${isDark ? "bg-[#fcdab5]/6" : "bg-[#fcdab5]/14"
          }`} />
        <div className={`absolute bottom-10 left-10 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full blur-[110px] transition-all duration-700 ${isDark ? "bg-[#4a6375]/8" : "bg-[#4a6375]/12"
          }`} />
      </div>

      {/* 2. Top Banner / Header Header */}
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#DF5F43] animate-pulse relative">
            <span className="absolute inset-0 rounded-full bg-[#DF5F43] animate-ping opacity-60" />
          </div>
          <span className={`text-[10px] tracking-[0.4em] font-medium uppercase transition-all duration-300 ${isDark ? "text-white/50" : "text-[#1C1613]/65"
            }`}>
            SOLACE TABLE TENNIS
          </span>
        </div>

        {/* Action Controls Toggle Buttons */}
        <div className="flex items-center gap-2">
          {/* Theme Selection Toggle */}
          <button
            onClick={() => {
              setIsDark(!isDark);
              audioManager.playMenuSelect();
            }}
            onMouseEnter={handleHover}
            className={`p-3 rounded-full border transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${isDark
                ? "border-white/5 bg-white/5 text-[#EAE3DC] hover:bg-white/10 hover:text-white"
                : "border-[#1C1613]/10 bg-white/70 text-[#1C1613] hover:bg-white hover:border-[#1C1613]/20"
              }`}
            title={isDark ? "Activate Clean Light Theme" : "Activate Cinematic Dark Theme"}
          >
            {isDark ? (
              <Sun className="w-[15px] h-[15px]" style={{ strokeWidth: 1.8 }} />
            ) : (
              <Moon className="w-[15px] h-[15px]" style={{ strokeWidth: 1.8 }} />
            )}
          </button>

          {/* Minimal Audio Control */}
          <button
            onClick={onToggleSound}
            onMouseEnter={handleHover}
            className={`p-3 rounded-full border transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.15)] ${isDark
                ? "border-white/5 bg-white/5 text-[#EAE3DC] hover:bg-white/10 hover:text-white"
                : "border-[#1C1613]/10 bg-white/70 text-[#1C1613] hover:bg-white hover:border-[#1C1613]/20"
              }`}
            title={soundEnabled ? "Mute Sound Engines" : "Enable Sound Engines"}
          >
            {soundEnabled ? (
              <Volume2 className="w-[15px] h-[15px]" style={{ strokeWidth: 1.8 }} />
            ) : (
              <VolumeX className="w-[15px] h-[15px]" style={{ strokeWidth: 1.8 }} />
            )}
          </button>
        </div>
      </header>

      {/* 3. Core 3-Column Studio Grid Layout */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 z-10 relative">

        {/* COLUMN A: SELECTED BOT ENGINE (4 Columns) */}
        <section className="lg:col-span-4 w-full h-full flex flex-col justify-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.3em] font-medium text-[#cb6239] uppercase">
              SELECTION
            </span>
            <h2 className={`text-xl tracking-wider uppercase font-light transition-colors duration-300 ${isDark ? "text-[#eae1d9]" : "text-[#1C1613]"
              }`}>
              BOT ENGINE
            </h2>
          </div>

          {/* Bot Card List */}
          <div className="flex flex-col gap-3">
            {difficulties.map((diff) => {
              const isSelected = selectedDifficulty === diff.id;
              const isImpossible = diff.id === Difficulty.IMPOSSIBLE;
              const isLocked = isImpossible && !unlockedImpossible;

              const getBotDotColor = (id: Difficulty) => {
                switch (id) {
                  case Difficulty.ROOKIE:
                    return "#10B981"; // Emerald Green
                  case Difficulty.CASUAL:
                    return "#3B82F6"; // Ice Blue
                  case Difficulty.SKILLED:
                    return "#F59E0B"; // Warm Gold
                  case Difficulty.PRO:
                    return "#EF4444"; // Fiery Crimson
                  case Difficulty.IMPOSSIBLE:
                    return "#EC4899"; // Hot Pink
                  default:
                    return "#CBD5E1";
                }
              };

              const botColor = getBotDotColor(diff.id);

              return (
                <button
                  key={diff.id}
                  onClick={() => handleSelectDifficulty(diff.id)}
                  onMouseEnter={handleHover}
                  className={`relative p-4 rounded-[18px] text-left border flex items-center justify-between transition-all duration-300 overflow-hidden pl-5 ${isSelected
                      ? isDark
                        ? "bg-[#cb6239]/10 border-[#DF5F43] shadow-[0_8px_32px_rgba(223,95,67,0.18)] -translate-y-[1px] border-l-4"
                        : "bg-white border-[#DF5F43] shadow-[0_8px_32px_rgba(223,95,67,0.12)] -translate-y-[1px] border-l-4"
                      : isLocked
                        ? isDark
                          ? "bg-white/[0.01] border-white/5 opacity-40 hover:opacity-70 hover:bg-white/[0.03]"
                          : "bg-black/[0.01] border-black/5 opacity-40 hover:opacity-70 hover:bg-black/[0.02]"
                        : isDark
                          ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                          : "bg-[#EFECE6] border-[#1C1613]/12 hover:bg-[#E5E1D7] hover:border-[#1C1613]/25"
                    }`}
                  style={{
                    borderLeftColor: isSelected ? botColor : undefined
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs tracking-wider uppercase font-semibold transition-colors duration-300 ${isSelected
                            ? isDark ? "text-white" : "text-[#1C1613]"
                            : isDark ? "text-[#EAE3DC]" : "text-[#1C1613]"
                          }`}>
                          {diff.name}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DF5F43]/15 text-[#DF5F43] font-bold tracking-widest uppercase">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] tracking-wide font-light transition-colors duration-300 ${isSelected
                          ? isDark ? "text-white/60" : "text-[#1C1613]/70"
                          : isDark ? "text-white/40" : "text-[#1C1613]/55"
                        }`}>
                        {isImpossible && isLocked ? (
                          "Requires 100 Wins"
                        ) : (
                          <>
                            Delay: {Math.round(diff.reactionTime * 1000)}ms • Error: {Math.round(diff.errorRate * 100)}%
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Indicator Dot or Lock Icon */}
                  {isImpossible && isLocked ? (
                    <div className={`p-1 rounded-md border ${isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                      }`}>
                      <Lock className={`w-[12px] h-[12px] ${isDark ? "text-white/30" : "text-black/30"
                        }`} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-all duration-300"
                        style={{
                          backgroundColor: botColor,
                          color: isSelected ? botColor + "aa" : "transparent",
                          transform: isSelected ? "scale(1.2)" : "scale(1)"
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* COLUMN B: THE CENTRAL GRAPHICAL COMMAND MODULE (4 Columns) */}
        <section className="lg:col-span-4 w-full flex flex-col items-center text-center justify-center py-6">
          {/* Logo Brand Header */}
          <div className="flex flex-col gap-2 mb-10 select-none pointer-events-none">
            <h1 className={`text-5xl tracking-[0.25em] font-light uppercase transition-colors duration-300 ${isDark ? "text-[#EAE3DC]" : "text-[#1C1613]"
              }`}>
              SOLACE
            </h1>
            <h1 className={`text-4xl tracking-[0.18em] font-extralight uppercase transition-colors duration-300 ${isDark ? "text-white/60" : "text-[#1C1613]/60"
              }`}>
              TABLE TENNIS
            </h1>
            {/* Elegant Accent horizontal separator */}
            <div className="w-10 h-[2px] bg-[#DF5F43] mx-auto mt-4 rounded-full" />
          </div>

          {/* Centered Actions List Stack */}
          <div className="w-full max-w-[280px] flex flex-col gap-4">
            {/* Action 1: MATCH AI MODE */}
            <button
              onClick={handleStartMatch}
              onMouseEnter={handleHover}
              className={`py-4 px-8 w-full rounded-full text-xs font-bold tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 relative transform hover:-translate-y-[2px] active:translate-y-[1px] ${isDark
                  ? "bg-[#201917]/95 text-white/90 border border-white/10 hover:border-[#DF5F43]/40 hover:bg-[#201917] hover:text-white shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)]"
                  : "bg-[#1C1613] text-[#F7F4EE] border border-[#1C1613]/5 hover:bg-[#2D231E] hover:text-white hover:border-[#DF5F43]/30 shadow-[0_12px_32px_-6px_rgba(28,22,19,0.35)]"
                }`}
            >
              <Play className="w-[11px] h-[11px] fill-[#DF5F43] stroke-[#DF5F43]" />
              AI MATCH
            </button>

            {/* Action 2: PRACTICE ACCESSIBLE MODE */}
            <button
              onClick={handleStartPractice}
              onMouseEnter={handleHover}
              className={`py-4 px-8 w-full rounded-full text-xs font-semibold tracking-[0.18em] transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-[1px] ${isDark
                  ? "border-white/15 hover:border-white/25 bg-white/5 hover:bg-white/10 text-white shadow-md font-bold"
                  : "border-[#1C1613]/20 hover:border-[#1C1613]/40 bg-white hover:bg-[#EFECE6] text-[#1C1613] font-bold shadow-md"
                }`}
            >
              SANDBOX PRACTICE
            </button>

            {/* Action 3: MULTIPLAYER UNDER CONSTRUCTION */}
            <button
              disabled
              className={`py-4 px-8 w-full border rounded-full text-xs font-semibold tracking-[0.15em] cursor-not-allowed flex items-center justify-center gap-3 transition-colors duration-300 ${isDark
                  ? "border-white/10 bg-white/[0.012] text-white/35"
                  : "border-[#1C1613]/12 bg-[#EFECE6]/40 text-[#1C1613]/45"
                }`}
            >
              MULTIPLAYER (COMING SOON)
            </button>
          </div>
        </section>

        {/* COLUMN C: EQUIPMENT BLADE ARSENAL (4 Columns) */}
        <section className="lg:col-span-4 w-full h-full flex flex-col justify-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-[0.3em] font-medium text-[#cb6239] uppercase">
              EQUIPMENT
            </span>
            <h2 className={`text-xl tracking-wider uppercase font-light transition-colors duration-300 ${isDark ? "text-[#eae1d9]" : "text-[#1C1613]"
              }`}>
              BLADE ARSENAL
            </h2>
          </div>

          {/* Blade Paddles Cards list */}
          <div className="flex flex-col gap-3">
            {paddles.map((pad) => {
              const isSelected = selectedPaddle === pad.id;

              const getNiceSub = (id: PaddleType) => {
                switch (id) {
                  case PaddleType.BALANCED:
                    return "STANDARD HIGH-FRICTION RUBBER";
                  case PaddleType.SPIN_MASTER:
                    return "MAXIMUM CURVE POTENTIAL";
                  case PaddleType.POWER:
                    return "CARBON-REINFORCED BLADE";
                  case PaddleType.CONTROL:
                    return "SOFT SPONGE FOR PRECISION";
                  default:
                    return "";
                }
              };

              return (
                <button
                  key={pad.id}
                  onClick={() => handleSelectPaddle(pad.id)}
                  onMouseEnter={handleHover}
                  className={`p-3 rounded-[18px] text-left border flex items-center gap-4 transition-all duration-300 w-full pl-5 ${isSelected
                      ? isDark
                        ? "bg-[#cb6239]/10 border-[#DF5F43] shadow-[0_8px_32px_rgba(223,95,67,0.18)] -translate-y-[1px] border-l-4"
                        : "bg-white border-[#DF5F43] shadow-[0_8px_32px_rgba(223,95,67,0.12)] -translate-y-[1px] border-l-4"
                      : isDark
                        ? "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                        : "bg-[#EFECE6] border-[#1C1613]/12 hover:bg-[#E5E1D7] hover:border-[#1C1613]/25"
                    }`}
                  style={{
                    borderLeftColor: isSelected ? pad.color : undefined
                  }}
                >
                  {/* Circle Colored paddle visual dot */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center relative flex-shrink-0 shadow-inner border transition-all duration-300 ${isSelected
                      ? isDark ? "bg-white/10 border-white/20" : "bg-black/5 border-black/10"
                      : isDark ? "bg-white/[0.04] border-white/5" : "bg-[#1C1613]/5 border-[#1C1613]/5"
                    }`}>
                    <div
                      className="w-5.5 h-5.5 rounded-full transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      style={{
                        backgroundColor: pad.color,
                        transform: isSelected ? "scale(1.2)" : "scale(1)"
                      }}
                    />
                    {isSelected && (
                      <div className={`absolute inset-x-0 inset-y-0 border rounded-full animate-ping opacity-30 ${isDark ? "border-white" : "border-[#DF5F43]"
                        }`} />
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs uppercase tracking-wider font-semibold transition-colors duration-300 ${isSelected
                          ? isDark ? "text-white" : "text-[#1C1613]"
                          : isDark ? "text-[#EAE3DC]" : "text-[#1C1613]"
                        }`}>
                        {pad.name}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#DF5F43]/15 text-[#DF5F43] font-bold tracking-widest uppercase">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] tracking-wide font-light transition-colors duration-300 ${isSelected
                        ? isDark ? "text-white/60" : "text-[#1C1613]/70"
                        : isDark ? "text-white/40" : "text-[#1C1613]/55"
                      }`}>
                      {getNiceSub(pad.id)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC PERFORMANCE SPECS HUD CARD */}
          <div className={`p-5 rounded-[22px] flex flex-col gap-4 mt-1 border transition-all duration-300 ${isDark ? "bg-[#1C1613]/25 border-white/[0.04]" : "bg-[#EFECE6] border-[#1C1613]/12"
            }`}>
            <div className="flex justify-between items-center tracking-widest text-[10px]">
              <span className={`font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${isDark ? "text-white/50" : "text-[#1C1613]/50"
                }`}>BLADE SPECS</span>
              <span className="text-[#cb6239] font-mono tracking-normal">{specs.lvl}</span>
            </div>

            {/* Performance Stats progress bars */}
            <div className="flex flex-col gap-3">
              {/* Rebound progress bar */}
              <div className="flex flex-col gap-1.5">
                <div className={`flex justify-between items-center text-[10px] tracking-widest transition-colors duration-300 ${isDark ? "text-white/40" : "text-[#1C1613]/55"
                  }`}>
                  <span>REBOUND RECOVERY</span>
                  <span className="font-mono">{specs.rebound}%</span>
                </div>
                <div className={`h-[3px] w-full rounded-full overflow-hidden transition-all duration-300 ${isDark ? "bg-white/[0.05]" : "bg-black/[0.12]"
                  }`}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${specs.rebound}%`,
                      backgroundColor: "#cb6239" // Terracotta orange
                    }}
                  />
                </div>
              </div>

              {/* Friction progress bar */}
              <div className="flex flex-col gap-1.5">
                <div className={`flex justify-between items-center text-[10px] tracking-widest transition-colors duration-300 ${isDark ? "text-white/40" : "text-[#1C1613]/55"
                  }`}>
                  <span>FRICTION GRIP</span>
                  <span className="font-mono">{specs.friction}%</span>
                </div>
                <div className={`h-[3px] w-full rounded-full overflow-hidden transition-all duration-300 ${isDark ? "bg-white/[0.05]" : "bg-black/[0.12]"
                  }`}>
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${specs.friction}%`,
                      backgroundColor: "#4a7a96" // Slate cyan blue
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 4. Elegant Minimal Footer */}
      <footer className={`w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 border-t pt-6 z-10 text-[9px] tracking-[0.25em] uppercase mt-8 transition-colors duration-300 ${isDark ? "border-white/[0.04] text-white/30" : "border-[#1C1613]/10 text-[#1C1613]/55"
        }`}>
        <div className="flex items-center gap-4">
          <span>STABLE PHYSICS SOLVER V2.4</span>
          <span className={`hidden sm:inline transition-colors duration-300 ${isDark ? "text-white/10" : "text-black/10"
            }`}>•</span>
          <span>144HZ ANALYTICAL KINEMATICS</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className={`tracking-[0.2em] font-medium transition-colors duration-300 ${isDark ? "text-white/45" : "text-[#1C1613]/60"
            }`}>ARENA CONNECTED</span>
        </div>
      </footer>
    </div>
  );
};
