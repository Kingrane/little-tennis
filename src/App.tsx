import { useState, useEffect } from "react";
import { GameMode, Difficulty, PaddleType, ServiceStatus } from "./types";
import { MainMenu } from "./components/MainMenu";
import { GameCanvas } from "./components/GameCanvas";
import { GameHUD } from "./components/GameHUD";
import { audioManager } from "./audio/AudioManager";
import { Trophy, Sparkles, Frown, Award, Undo2 } from "lucide-react";

export default function App() {
  // Game states coordinated globally
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.MENU);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.ROOKIE);
  const [paddleType, setPaddleType] = useState<PaddleType>(PaddleType.BALANCED);

  // Score states
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [statusText, setStatusText] = useState("STUDIO STABILIZED");
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>(ServiceStatus.NONE);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Increment to trigger resets inside 3D Canvas
  const [gameStateTrigger, setGameStateTrigger] = useState(0);

  // Victory states
  const [matchWinner, setMatchWinner] = useState<"PLAYER" | "OPPONENT" | null>(null);

  // Multiplayer online socket states
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [myRole, setMyRole] = useState<"host" | "guest" | null>(null);
  const [myNickname, setMyNickname] = useState("");
  const [opponentNickname, setOpponentNickname] = useState("");
  const [opponentPaddleType, setOpponentPaddleType] = useState<PaddleType | null>(null);
  const [roomCode, setRoomCode] = useState("");

  // Clean socket effect
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  // Initialize sound preferences
  useEffect(() => {
    audioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Point scoring checks for standard Ping Pong rules (reaches 11, wins by 2)
  const handleScoreUpdate = (playerScore: number, aiScore: number) => {
    setScore({ player: playerScore, opponent: aiScore });

    if (gameMode === GameMode.PRACTICE) {
      // Practice mode has no victory conditions
      return;
    }

    // Check if win criteria met
    const hasPlayerWonCap = playerScore >= 11 && (playerScore - aiScore) >= 2;
    const hasAiWonCap = aiScore >= 11 && (aiScore - playerScore) >= 2;

    if (hasPlayerWonCap) {
      setMatchWinner("PLAYER");
      setIsPaused(true);
      audioManager.playScorePoint(true);
    } else if (hasAiWonCap) {
      setMatchWinner("OPPONENT");
      setIsPaused(true);
      audioManager.playScorePoint(false);
    }
  };

  const startNewGame = (mode: GameMode, diff: Difficulty, paddle: PaddleType) => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setGameMode(mode);
    setDifficulty(diff);
    setPaddleType(paddle);
    setScore({ player: 0, opponent: 0 });
    setMatchWinner(null);
    setIsPaused(false);
    setStatusText("WARMING SERVS — PREPARE");
    setGameStateTrigger((prev) => prev + 1);
  };

  const startMultiplayerGame = (
    sock: WebSocket,
    role: "host" | "guest",
    room: string,
    myNick: string,
    oppNick: string,
    oppPaddle: PaddleType
  ) => {
    setSocket(sock);
    setMyRole(role);
    setRoomCode(room);
    setMyNickname(myNick);
    setOpponentNickname(oppNick);
    setOpponentPaddleType(oppPaddle);

    setScore({ player: 0, opponent: 0 });
    setMatchWinner(null);
    setGameMode(GameMode.MULTIPLAYER);
    setIsPaused(false);
    setStatusText("ARENA CONNECTED — GET READY!");
    setGameStateTrigger((prev) => prev + 1);
  };

  const handleResetMatch = () => {
    if (gameMode === GameMode.MULTIPLAYER && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "restart_match" }));
    }
    setScore({ player: 0, opponent: 0 });
    setMatchWinner(null);
    setIsPaused(false);
    audioManager.playMenuSelect();
    setStatusText("SCORES RESET — READY");
    setGameStateTrigger((prev) => prev + 1);
  };

  const handleExitToMenu = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setGameMode(GameMode.MENU);
    setMatchWinner(null);
    setIsPaused(false);
    audioManager.playMenuSelect();
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    audioManager.setEnabled(nextVal);
    audioManager.playMenuSelect();
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
    audioManager.playMenuSelect();
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex bg-[#fbf9f6] relative">
      {/* 1. Main Selection Menu Screen */}
      {gameMode === GameMode.MENU && (
        <MainMenu
          onStartGame={startNewGame}
          defaultDifficulty={difficulty}
          defaultPaddle={paddleType}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onStartMultiplayer={startMultiplayerGame}
        />
      )}

      {/* 2. Playing Arena Screen */}
      {gameMode !== GameMode.MENU && (
        <div className="w-full h-full relative">
          <GameCanvas
            gameMode={gameMode}
            difficulty={difficulty}
            paddleType={paddleType}
            onScoreUpdate={handleScoreUpdate}
            onStatusUpdate={setStatusText}
            onSetService={setServiceStatus}
            isPaused={isPaused}
            score={score}
            onResetScores={handleResetMatch}
            gameStateTrigger={gameStateTrigger}
            socket={socket}
            myRole={myRole}
            myNickname={myNickname}
            opponentNickname={opponentNickname}
            opponentPaddleType={opponentPaddleType || paddleType}
          />

          <GameHUD
            score={score}
            difficulty={difficulty}
            gameMode={gameMode}
            statusText={statusText}
            serviceStatus={serviceStatus}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            onResetMatch={handleResetMatch}
            onExitToMenu={handleExitToMenu}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            myNickname={myNickname}
            opponentNickname={opponentNickname}
          />
        </div>
      )}

      {/* 3. Victory / Defeat Overlays */}
      {matchWinner && (
        <div className="absolute inset-0 z-50 bg-[#fbf9f6]/95 backdrop-blur-lg flex flex-col justify-center items-center p-6 select-none animate-fade-in text-[#3d3831] font-sans">
          <div className="max-w-md w-full bg-white border border-[#eae3d7] rounded-3xl p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Background shimmers */}
            <div className="absolute w-[200px] h-[200px] bg-gold/10 rounded-full -top-16 -left-16 filter blur-2xl pointer-events-none" />
            <div className="absolute w-[200px] h-[200px] bg-[#ffdcb5]/20 rounded-full -bottom-16 -right-16 filter blur-2xl pointer-events-none" />

            {matchWinner === "PLAYER" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-600 mb-6 shadow-sm animate-bounce">
                  <Trophy size={32} />
                </div>
                <span className="text-[10px] tracking-[0.4em] text-amber-600 font-semibold uppercase mb-1">
                  CONGRATULATIONS
                </span>
                <h2 className="text-2xl font-extralight tracking-widest text-[#3d3831] uppercase mb-2">
                  {gameMode === GameMode.MULTIPLAYER ? `${myNickname || "YOU"} WINS` : "MATCH VICTORY"}
                </h2>
                <p className="text-xs text-[#8c8272] font-light max-w-xs leading-relaxed mb-6">
                  {gameMode === GameMode.MULTIPLAYER
                    ? "You claimed supremacy over the online arena with pristine precision."
                    : "You out-curved and dominated the arena with flawless tactical spins."}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 mb-6 shadow-sm">
                  <Frown size={32} />
                </div>
                <span className="text-[10px] tracking-[0.4em] text-slate-500 font-semibold uppercase mb-1">
                  MATCH OVER
                </span>
                <h2 className="text-2xl font-extralight tracking-widest text-[#3d3831] uppercase mb-2">
                  {gameMode === GameMode.MULTIPLAYER ? `${opponentNickname || "OPPONENT"} WINS` : "BOT VICTORY"}
                </h2>
                <p className="text-xs text-[#8c8272] font-light max-w-xs leading-relaxed mb-6">
                  {gameMode === GameMode.MULTIPLAYER
                    ? "Your opponent read your moves perfectly this time. Try again!"
                    : "The bot anticipated your sweeps. Train your topspin trajectory to crack its defense!"}
                </p>
              </>
            )}

            {/* Score display */}
            <div className="flex justify-center items-center gap-6 py-4 px-8 bg-[#faf8f5] border border-[#f3eee5] rounded-2xl mb-8 font-mono">
              <div className="flex flex-col items-center">
                <span className="text-2xl text-[#3d3831] font-semibold">{score.player}</span>
                <span className="text-[9px] text-[#9a8e7e] tracking-wider uppercase mt-0.5">
                  {gameMode === GameMode.MULTIPLAYER ? myNickname || "YOU" : "Player"}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-[#dfd6c6]" />
              <div className="flex flex-col items-center">
                <span className="text-2xl text-[#3d3831] font-semibold">{score.opponent}</span>
                <span className="text-[9px] text-[#9a8e7e] tracking-wider uppercase mt-0.5">
                  {gameMode === GameMode.MULTIPLAYER ? opponentNickname || "OPPONENT" : "AI Opponent"}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleResetMatch}
                className="flex-1 px-6 py-3.5 rounded-full bg-[#3d3831] hover:bg-[#524a41] text-white font-medium text-xs tracking-widest uppercase transition-all duration-300 shadow-sm"
              >
                Play Again
              </button>
              <button
                onClick={handleExitToMenu}
                className="flex-1 px-6 py-3.5 rounded-full bg-white border border-[#ded5c5] text-[#5e564a] hover:bg-[#faf7f2] font-medium text-xs tracking-widest uppercase transition-all duration-300"
              >
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
