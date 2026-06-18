import React from "react";
import { GameMode, Difficulty, ServiceStatus } from "../types";
import { DIFFICULTY_CONFIGS } from "../utils/configs";
import { audioManager } from "../audio/AudioManager";
import { CornerUpLeft, RotateCcw, Volume2, VolumeX, Pause, Play } from "lucide-react";

interface GameHUDProps {
  score: { player: number; opponent: number };
  difficulty: Difficulty;
  gameMode: GameMode;
  statusText: string;
  serviceStatus: ServiceStatus;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetMatch: () => void;
  onExitToMenu: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score,
  difficulty,
  gameMode,
  statusText,
  serviceStatus,
  isPaused,
  onTogglePause,
  onResetMatch,
  onExitToMenu,
  soundEnabled,
  onToggleSound,
}) => {
  const padZero = (n: number) => n.toString().padStart(2, "0");

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  const handleHover = () => {
    audioManager.playMenuHover();
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 sm:p-10 font-sans z-15 select-none">
      {/* 1. Header with floating Minimalist Score */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        {/* Left Side: Navigation Quick Buttons */}
        <div className="flex gap-3">
          <button
            id="back-btn"
            onClick={onExitToMenu}
            onMouseEnter={handleHover}
            className="flex items-center gap-2 px-5 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full bg-white/80 border border-white/60 backdrop-blur-md text-[#4A433F] shadow-sm hover:bg-white hover:text-black transition duration-300"
          >
            <CornerUpLeft size={13} />
            Exit
          </button>
          <button
            id="reset-btn"
            onClick={onResetMatch}
            onMouseEnter={handleHover}
            className="flex items-center gap-2 px-5 py-2 text-[10px] uppercase tracking-widest font-bold rounded-full bg-white/80 border border-white/60 backdrop-blur-md text-[#4A433F] shadow-sm hover:bg-white hover:text-black transition duration-300"
            title="Reset Game Score"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>

        {/* Center: Glowing Floating Scoreboard from Sleek Design */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-12 z-20">
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-[#8C847E] mb-1">Player</span>
            <span className="text-4xl sm:text-5xl font-light text-[#4A433F] tracking-normal font-sans">
              {padZero(score.player)}
            </span>
          </div>
          <div className="w-[1px] h-10 bg-[#D6C7B3]"></div>
          <div className="flex flex-col items-center">
            <span className="text-[9px] uppercase tracking-widest text-[#8C847E] mb-1">
              {gameMode === GameMode.PRACTICE ? "Practice Bot" : "AI Bot"}
            </span>
            <span className="text-4xl sm:text-5xl font-light text-[#4A433F] tracking-normal font-sans">
              {padZero(score.opponent)}
            </span>
          </div>
        </div>

        {/* Right Side: Preference Controls (Mute / Pause) */}
        <div className="flex gap-3">
          <button
            id="mute-btn"
            onClick={onToggleSound}
            onMouseEnter={handleHover}
            className="p-3 rounded-full bg-white/80 border border-white/60 backdrop-blur-md text-[#4A433F] shadow-sm hover:bg-white transition duration-300"
            title={soundEnabled ? "Mute Sounds" : "Unmute Sounds"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button
            id="pause-btn"
            onClick={onTogglePause}
            onMouseEnter={handleHover}
            className="p-3 rounded-full bg-white/80 border border-white/60 backdrop-blur-md text-[#4A433F] shadow-sm hover:bg-white transition duration-300"
          >
            {isPaused ? <Play size={15} /> : <Pause size={15} />}
          </button>
        </div>
      </div>

      {/* 2. Status text area: beautifully placed near the top, just below the scoreboard and out of the way of the high-speed ball! */}
      <div className="absolute top-[124px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 scale-90 sm:scale-100 z-10 w-[90%] max-w-md">
        <div className="px-5 py-2 bg-white/80 backdrop-blur-md border border-white/60 rounded-full text-[10px] uppercase tracking-widest shadow-xs font-semibold text-[#4A433F] text-center w-max">
          {statusText}
        </div>

        {serviceStatus !== ServiceStatus.NONE && !isPaused && (
          <div className="text-[9px] tracking-[0.25em] font-semibold text-[#8C847E] bg-white/20 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-xs animate-pulse text-center w-max">
            {serviceStatus === ServiceStatus.PLAYER_SERVE
              ? "TOSS HIGH: CLICK TO THROW, CLICK AGAIN TO STRIKE"
              : "WATCH THE BOT'S ANGLE CLOSELY"}
          </div>
        )}
      </div>

      {/* 3. Bottom controls: Help Overlay text / Controls tutorial */}
      <div className="w-full flex justify-between items-end text-[10px] tracking-widest text-[#8C847E] uppercase font-light">
        <div className="flex flex-col gap-1.5 bg-white/40 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/60 shadow-xs max-w-sm pointer-events-auto">
          <span className="font-bold text-[#4A433F] tracking-[0.2em] mb-0.5">PLAYER CONTROLS</span>
          <span>MOUSE X/Y = Paddle Slide (smoothed)</span>
          <span>LEFT CLICK = Toss serve & Strike ball</span>
          <span>Press ALT = Toggle Cursor Lock/Unlock</span>
        </div>

        <div className="flex flex-col gap-1 align-right text-right bg-white/40 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/60 shadow-xs max-w-sm pointer-events-auto">
          <span className="font-bold text-[#4A433F] tracking-[0.2em] mb-0.5">PHYSICS ENGINE</span>
          <span>MAGNUS MAGNITUDE SENSITIVE</span>
          <span>11 POINTS MATCH • WIN BY 2 RULES</span>
        </div>
      </div>

      {/* 4. Full screen Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-[#F5F2ED]/90 backdrop-blur-md flex flex-col justify-center items-center pointer-events-auto z-20">
          <span className="text-[11px] tracking-[0.3em] font-bold uppercase text-[#4A433F] mb-6">MATCH PAUSED</span>
          <button
            id="resume-btn"
            onClick={onTogglePause}
            onMouseEnter={handleHover}
            className="w-auto py-4 px-12 bg-[#4A433F] text-white rounded-2xl text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#5C534F] active:translate-y-[1px] transition-all duration-300 shadow-xl flex items-center justify-center gap-3 border border-transparent"
          >
            Resume Rally
          </button>
        </div>
      )}
    </div>
  );
};
