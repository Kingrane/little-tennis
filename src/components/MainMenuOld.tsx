import React, { useState } from "react";
import { GameMode, Difficulty, PaddleType } from "../types";
import { PADDLE_CONFIGS, DIFFICULTY_CONFIGS } from "../utils/configs";
import { audioManager } from "../audio/AudioManager";
import { Play, Flame, HelpCircle, Shield, Award, Sparkles, Volume2, VolumeX } from "lucide-react";

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
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.MATCH);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(defaultDifficulty);
  const [selectedPaddle, setSelectedPaddle] = useState<PaddleType>(defaultPaddle);

  const handleHover = () => {
    audioManager.playMenuHover();
  };

  const handleSelectPaddle = (type: PaddleType) => {
    setSelectedPaddle(type);
    audioManager.playMenuSelect();
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    audioManager.playMenuSelect();
  };

  const handleSelectMode = (mode: GameMode) => {
    setSelectedMode(mode);
    audioManager.playMenuSelect();
  };

  const handlePlayClick = () => {
    audioManager.playMenuSelect();
    onStartGame(selectedMode, selectedDifficulty, selectedPaddle);
  };

  const paddle = PADDLE_CONFIGS[selectedPaddle];

  // Helper arrays for difficulty and paddles
  const difficulties = Object.values(DIFFICULTY_CONFIGS);
  const paddles = Object.values(PADDLE_CONFIGS);

  return (
    <div className="w-full min-h-screen bg-[#F5F2ED] text-[#4A433F] flex flex-col justify-between p-6 sm:p-12 relative overflow-y-auto selection:bg-[#E8D8C3] selection:text-[#4A433F]">
      {/* Ambient Lighting Overlays */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-white rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#E8D8C3] rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

      {/* Top Banner & Sound Indicator */}
      <header className="w-full max-w-6xl mx-auto flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#4A433F]"></div>
          </div>
          <span className="text-xs uppercase tracking-[0.3em] font-medium text-[#4A433F]">Solace Table Tennis</span>
        </div>

        <button
          onClick={onToggleSound}
          onMouseEnter={handleHover}
          className="p-3 rounded-full border border-white/50 bg-white/60 backdrop-blur-md text-[#4A433F] hover:bg-white hover:text-[#4A433F] transition duration-300 shadow-sm"
          title={soundEnabled ? "Mute Game" : "Unmute Game"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </header>

      {/* Main Form Fields Grid */}
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 items-center my-auto py-10 z-10">
        {/* Left Bento: Settings & Difficulty Selector (5 cols) */}
        <div className="lg:col-span-5 w-full flex flex-col gap-6">
          <div className="flex flex-col">
            <h2 className="text-4xl font-light tracking-tight mb-2 text-[#4A433F]">Select Your Tool</h2>
            <p className="text-sm text-[#8C847E] leading-relaxed max-w-md">
              The elegant connection between your active physical intent and the table's absolute physics.
            </p>
          </div>

          {/* Selector 1: Game Mode */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] tracking-widest font-semibold text-[#8C847E] uppercase">
              Select Game Mode
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: GameMode.MATCH, label: "AI MATCH", desc: "11 pts formal rulebook" },
                { id: GameMode.PRACTICE, label: "SANDBOX PRACTICE", desc: "Infinite tennis hit loop" },
              ].map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMode(m.id)}
                    onMouseEnter={handleHover}
                    className={`p-5 rounded-3xl text-left border transition-all duration-300 ${
                      isSelected
                        ? "bg-white border-2 border-[#D6C7B3] shadow-lg text-[#4A433F] ring-4 ring-[#D6C7B3]/10 transform translate-y-[-2px]"
                        : "bg-white/60 backdrop-blur-md border border-white/40 text-[#4A433F] hover:bg-white/80"
                    }`}
                  >
                    <span className="block text-xs font-bold tracking-wider">{m.label}</span>
                    <span className="block text-[10px] tracking-wide mt-1 text-[#8C847E] font-light">{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector 2: Difficulty Bot Selector */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] tracking-widest font-semibold text-[#8C847E] uppercase">
              Select Bot Skill Level
            </span>
            <div className="flex flex-col gap-2">
              {difficulties.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    onClick={() => handleSelectDifficulty(diff.id)}
                    onMouseEnter={handleHover}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-white border-2 border-[#D6C7B3] shadow-lg text-[#4A433F] ring-4 ring-[#D6C7B3]/10"
                        : "bg-white/60 backdrop-blur-md border border-white/40 text-[#4A433F] hover:bg-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          diff.id === Difficulty.ROOKIE
                            ? "bg-emerald-500"
                            : diff.id === Difficulty.CASUAL
                            ? "bg-blue-400"
                            : diff.id === Difficulty.SKILLED
                            ? "bg-[#9d7d47]"
                            : diff.id === Difficulty.PRO
                            ? "bg-amber-600 animate-pulse"
                            : "bg-purple-600 animate-ping"
                        }`}
                      />
                      <div>
                        <span className="block text-xs font-bold tracking-wider uppercase text-[#4A433F]">
                          {diff.name}
                        </span>
                        <span className="block text-[10px] tracking-wide text-[#8C847E] font-light mt-0.5">
                          Reaction delay: {Math.round(diff.reactionTime * 1000)}ms • Error index: {Math.round(diff.errorRate * 100)}%
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[9px] font-bold tracking-widest text-[#4A433F] uppercase bg-[#E8E1D9] px-2.5 py-1 rounded-md">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Bento: Paddle Selector with Realtime visual bars (7 cols) */}
        <div className="lg:col-span-7 w-full flex flex-col gap-6 bg-white/40 backdrop-blur-md border border-white/60 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[11px] tracking-widest font-bold text-[#4A433F] uppercase">
                Blade Arsenal
              </span>
              <span className="text-xs text-[#8C847E] mt-0.5 font-light">
                Select rubber. Properties modify friction, sweet-spot, and rebound force.
              </span>
            </div>
            <Sparkles size={16} className="text-[#8C847E]" />
          </div>

          {/* Paddle buttons block */}
          <div className="flex flex-col gap-3">
            {paddles.map((pad) => {
              const isSelected = selectedPaddle === pad.id;
              return (
                <button
                  key={pad.id}
                  onClick={() => handleSelectPaddle(pad.id)}
                  onMouseEnter={handleHover}
                  className={`p-5 bg-white/60 backdrop-blur-md rounded-3xl border shadow-sm flex items-center gap-4 cursor-pointer text-left w-full transition-all duration-300 ${
                    isSelected
                      ? "bg-white border-2 border-[#D6C7B3] shadow-lg ring-4 ring-[#D6C7B3]/10"
                      : "border-white/45 text-[#4A433F] hover:bg-white/80"
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#E8E1D9] flex items-center justify-center relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: pad.color }} />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest font-bold text-[#4A433F]">{pad.name}</div>
                    <div className="text-[10px] text-[#A39992] line-clamp-1">{pad.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dynamic Paddle Description Details Card */}
          <div className="bg-white/50 border border-white/60 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full border shadow-md flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: paddle.color, borderColor: paddle.borderColor }}
              >
                <div className="w-4 h-4 rounded-full bg-[#222222]" />
              </div>
              <div>
                <span className="block text-xs font-bold tracking-widest text-[#4A433F] uppercase">
                  {paddle.name} Rubber Specs
                </span>
                <span className="block text-[10px] text-[#8C847E] font-light mt-0.5">
                  Weight: {Math.round(paddle.weight * 1000)}g • Grip friction coeff: {paddle.spinFactor.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Performance Stats progress bars */}
            <div className="flex flex-col gap-3 py-1 border-t border-white/50 mt-1 text-[10px]">
              {/* Spin Stat */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center tracking-wider text-[#4A433F]">
                  <span className="font-semibold">SPIN VELOCITY</span>
                  <span className="font-mono">{Math.round(paddle.spinFactor * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E8E1D9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A433F] rounded-full transition-all duration-750 ease-out"
                    style={{ width: `${Math.min(100, paddle.spinFactor * 62.5)}%` }}
                  />
                </div>
              </div>

              {/* Power Stat */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center tracking-wider text-[#4A433F]">
                  <span className="font-semibold">COLLISION REPLAY FORCE</span>
                  <span className="font-mono">{Math.round(paddle.powerFactor * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E8E1D9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A433F] rounded-full transition-all duration-750 ease-out"
                    style={{ width: `${Math.min(100, paddle.powerFactor * 68.9)}%` }}
                  />
                </div>
              </div>

              {/* Control Stat */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center tracking-wider text-[#4A433F]">
                  <span className="font-semibold">SWEET SPOT TOLERANCE (CONTROL)</span>
                  <span className="font-mono">{Math.round(paddle.controlFactor * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E8E1D9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A433F] rounded-full transition-all duration-750 ease-out"
                    style={{ width: `${Math.min(100, paddle.controlFactor * 66.6)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Button footer elements */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-[#D6C7B3]/30 pt-6 z-10 text-[10px] tracking-[0.2em] text-[#8C847E] uppercase">
        <div className="flex items-center gap-4">
          <span>Version 1.0.4 - Alpha</span>
          <span>Physics Engine: Rapier V2</span>
        </div>

        <button
          id="enter-arena-btn"
          onClick={handlePlayClick}
          onMouseEnter={handleHover}
          className="w-full sm:w-auto py-4 px-12 bg-[#4A433F] text-white rounded-2xl text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#5C534F] active:translate-y-[1px] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 border border-transparent"
        >
          <Play size={13} fill="currentColor" />
          Start Match
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>System Stable</span>
        </div>
      </footer>
    </div>
  );
};
