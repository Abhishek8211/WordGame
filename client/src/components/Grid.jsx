import React, { useState, useCallback, useMemo } from "react";
import GridCell from "./GridCell.jsx";
import useGameStore from "../store/useGameStore.js";
import { getSocket } from "../utils/socket.js";

/**
 * Renders the N×N grid. Cells are memoized.
 * Input overlay pops up when you click an empty cell.
 */
export default function Grid() {
  const grid = useGameStore((s) => s.grid);
  const gridSize = useGameStore((s) => s.gridSize);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const playerId = useGameStore((s) => s.playerId);
  const roomCode = useGameStore((s) => s.roomCode);
  const lastWordFlash = useGameStore((s) => s.lastWordFlash);
  const theme = useGameStore((s) => s.theme);

  const [pending, setPending] = useState(null); // { row, col }
  const [letter, setLetter] = useState("");
  const [error, setError] = useState("");

  const isMyTurn = currentTurn === playerId;

  // Track which cells are part of the latest word flash
  const flashCells = useMemo(() => {
    if (!lastWordFlash) return new Set();
    return new Set(lastWordFlash.cells.map((c) => `${c.r}-${c.c}`));
  }, [lastWordFlash]);

  // Compute cell pixel size based on grid to fit viewport
  const cellSize = useMemo(() => {
    const maxPx = Math.min(window.innerWidth * 0.58, 640);
    return Math.floor(maxPx / gridSize);
  }, [gridSize]);

  const handleCellClick = useCallback((row, col) => {
    setPending({ row, col });
    setLetter("");
    setError("");
  }, []);

  const handleSubmit = () => {
    const trimmed = letter.trim().toUpperCase();
    if (!trimmed || !/^[A-Z]$/.test(trimmed)) {
      setError("Enter a single letter A–Z.");
      return;
    }

    const socket = getSocket();
    socket.emit(
      "place_letter",
      { roomCode, row: pending.row, col: pending.col, letter: trimmed },
      (res) => {
        if (!res.success) {
          setError(res.error || "Could not place letter.");
        } else {
          setPending(null);
          setLetter("");
          setError("");
        }
      },
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setPending(null);
      setError("");
    }
    // Auto-fill single letter key presses
    if (/^[a-zA-Z]$/.test(e.key)) setLetter(e.key.toUpperCase());
  };

  if (!grid || grid.length === 0) {
    return (
      <div className="text-slate-400 dark:text-white/40 text-sm">
        Waiting for grid…
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Grid */}
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-glass backdrop-blur-sm"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          gap: 1,
          padding: 6,
          background:
            theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <GridCell
              key={`${r}-${c}`}
              value={cell}
              row={r}
              col={c}
              isMyTurn={isMyTurn}
              isNewWord={flashCells.has(`${r}-${c}`)}
              onClick={handleCellClick}
              cellSize={cellSize}
            />
          )),
        )}

        {/* Letter input overlay */}
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            style={{
              backdropFilter: "blur(4px)",
              background: "rgba(0,0,0,0.55)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setPending(null);
            }}
          >
            <div
              className="glass-card p-6 flex flex-col items-center gap-3 min-w-[200px]"
              onKeyDown={handleKeyDown}
            >
              <span className="text-slate-500 dark:text-white/60 text-sm">
                Cell ({pending.row},{pending.col}) — Enter letter:
              </span>
              <input
                autoFocus
                className="glass-input text-center text-3xl font-mono font-bold uppercase tracking-widest w-20"
                maxLength={1}
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value.toUpperCase());
                  setError("");
                }}
              />
              {error && (
                <span className="text-red-500 dark:text-red-400 text-xs">
                  {error}
                </span>
              )}
              <div className="flex gap-2 w-full">
                <button className="btn-primary flex-1" onClick={handleSubmit}>
                  Place
                </button>
                <button
                  className="btn-secondary flex-1"
                  onClick={() => setPending(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Turn label */}
      <div
        className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-300 ${
          isMyTurn
            ? "bg-violet-500/20 text-violet-300 shadow-glow animate-pulse-glow"
            : "bg-gray-100 text-slate-500 dark:bg-white/5 dark:text-white/40"
        }`}
      >
        {isMyTurn ? "✦ Your turn — click a cell" : "Waiting for opponent…"}
      </div>
    </div>
  );
}
