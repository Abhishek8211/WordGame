import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Zap, Sun, Moon } from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { getSocket, disconnectSocket } from "../utils/socket.js";
import Grid from "../components/Grid.jsx";
import Scoreboard from "../components/Scoreboard.jsx";
import Chat from "../components/Chat.jsx";

export default function GamePage() {
  const navigate = useNavigate();
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const playerId = useGameStore((s) => s.playerId);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const lastWordFlash = useGameStore((s) => s.lastWordFlash);
  const gridSize = useGameStore((s) => s.gridSize);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);

  const setPlayers = useGameStore((s) => s.setPlayers);
  const setGrid = useGameStore((s) => s.setGrid);
  const updateGridCell = useGameStore((s) => s.updateGridCell);
  const setCurrentTurn = useGameStore((s) => s.setCurrentTurn);
  const setScores = useGameStore((s) => s.setScores);
  const addWordFound = useGameStore((s) => s.addWordFound);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const setLastWordFlash = useGameStore((s) => s.setLastWordFlash);
  const setGameStarted = useGameStore((s) => s.setGameStarted);
  const resetAll = useGameStore((s) => s.resetAll);

  const currentPlayer = players.find((p) => p.id === currentTurn);
  const isMyTurn = currentTurn === playerId;

  useEffect(() => {
    if (!roomCode) {
      navigate("/");
      return;
    }

    const socket = getSocket();

    // Authoritative grid update from server
    socket.on(
      "grid_update",
      ({ grid, row, col, letter, placedBy, newWords, scores, currentTurn }) => {
        // Use fine-grained cell update to avoid full grid re-render
        updateGridCell(row, col, letter);
        setCurrentTurn(currentTurn);
        setScores(scores);

        if (newWords && newWords.length > 0) {
          for (const w of newWords) {
            addWordFound(w.word);
            setLastWordFlash({ word: w.word, cells: w.cells });
            setTimeout(() => setLastWordFlash(null), 1200);
          }
        }
      },
    );

    socket.on("chat_message", addChatMessage);

    socket.on("room_update", ({ players }) => {
      setPlayers(players);
    });

    socket.on("game_ended", ({ reason, scores }) => {
      setGameStarted(false);
      setScores(scores);
      // Brief delay then go to a simple "game over" state (handled in render)
    });

    return () => {
      socket.off("grid_update");
      socket.off("chat_message");
      socket.off("room_update");
      socket.off("game_ended");
    };
  }, [roomCode]);

  const handleLeave = useCallback(() => {
    disconnectSocket();
    resetAll();
    navigate("/");
  }, []);

  const gameEnded = useGameStore(
    (s) => !s.gameStarted && s.scores.length > 0 && s.grid.length > 0,
  );
  const scores = useGameStore((s) => s.scores);

  if (gameEnded) {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          className="glass-card p-10 flex flex-col items-center gap-6 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 240 }}
        >
          <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
            Game Over!
          </h2>
          <div className="flex flex-col gap-2 w-full">
            {sorted.map((p, i) => (
              <div
                key={p.id}
                className={`flex justify-between px-4 py-3 rounded-xl ${i === 0 ? "bg-amber-500/20 border border-amber-500/30" : "bg-gray-100 dark:bg-white/5"}`}
              >
                <span className="font-medium text-gray-800 dark:text-white">
                  {i === 0 ? "🏆 " : ""}
                  {p.name}
                </span>
                <span className="font-mono font-bold text-violet-300">
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>
          <button className="btn-primary w-full" onClick={handleLeave}>
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/8 glass-card rounded-none">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            WordGrid
          </span>
          <span className="glass-card-sm px-3 py-1 text-xs font-mono text-violet-300">
            {roomCode}
          </span>
        </div>

        {/* Turn indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTurn}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isMyTurn
                ? "bg-violet-500/20 text-violet-300 shadow-glow"
                : "bg-gray-100 text-slate-500 dark:bg-white/5 dark:text-white/50"
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Zap
              size={14}
              className={
                isMyTurn
                  ? "text-violet-400"
                  : "text-slate-400 dark:text-white/30"
              }
            />
            {isMyTurn ? "Your Turn!" : `${currentPlayer?.name ?? "…"}'s turn`}
          </motion.div>
        </AnimatePresence>

        <button
          className="btn-danger flex items-center gap-1.5"
          onClick={handleLeave}
        >
          <LogOut size={14} /> Leave
        </button>

        {/* Theme toggle */}
        <button
          className="btn-secondary p-2 rounded-xl"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </header>

      {/* Word flash banner */}
      <AnimatePresence>
        {lastWordFlash && (
          <motion.div
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-3 flex items-center gap-3 border-emerald-500/40 bg-emerald-500/10"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <span className="text-2xl">✨</span>
            <span className="font-mono font-bold text-emerald-300 text-lg tracking-widest uppercase">
              {lastWordFlash.word}
            </span>
            <span className="text-emerald-400 text-sm">
              +{lastWordFlash.word.length} pts
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="flex-1 flex items-start justify-center gap-6 p-6 overflow-auto">
        {/* Left: Scoreboard */}
        <aside className="hidden lg:block pt-2 w-52 shrink-0">
          <Scoreboard />
        </aside>

        {/* Center: Grid */}
        <div className="flex-1 flex items-start justify-center min-w-0">
          <div className="flex flex-col items-center gap-4">
            {/* Grid size label */}
            <div className="text-slate-400 dark:text-white/30 text-xs font-mono">
              {gridSize} × {gridSize} grid
            </div>
            <Grid />
          </div>
        </div>

        {/* Right: Mobile scoreboard */}
        <aside className="lg:hidden fixed bottom-20 right-6 z-20 w-44">
          <Scoreboard />
        </aside>
      </main>

      {/* Chat (slide-out panel + toggle button) */}
      <Chat />
    </div>
  );
}
