import React, { memo, useState, useCallback, useMemo, useEffect } from "react";
import GridCell from "./GridCell.jsx";
import useGameStore from "../store/useGameStore.js";
import { getSocket } from "../utils/socket.js";

/**
 * Renders the N×N grid. Cells are memoized.
 * Input overlay pops up when you click an empty cell.
 */
const Grid = memo(function Grid() {
  const grid = useGameStore((s) => s.grid);
  const gridSize = useGameStore((s) => s.gridSize);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const playerId = useGameStore((s) => s.playerId);
  const roomCode = useGameStore((s) => s.roomCode);
  const lastWordFlash = useGameStore((s) => s.lastWordFlash);
  const bonusCells = useGameStore((s) => s.bonusCells);
  const theme = useGameStore((s) => s.theme);

  const [pending, setPending] = useState(null); // { row, col }
  const [letter, setLetter] = useState("");
  const [error, setError] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isMyTurn = currentTurn === playerId;

  // Track which cells are part of the latest word flash
  const flashCells = useMemo(() => {
    if (!lastWordFlash) return new Set();
    return new Set(lastWordFlash.cells.map((c) => `${c.r}-${c.c}`));
  }, [lastWordFlash]);

  const bonusLookup = useMemo(
    () =>
      new Map(
        bonusCells.map((cell) => [`${cell.row}-${cell.col}`, cell.multiplier]),
      ),
    [bonusCells],
  );

  // Compute cell pixel size based on grid to fit viewport
  const cellSize = useMemo(() => {
    const isMobile = windowWidth < 640;
    const maxPx = isMobile
      ? Math.min(windowWidth * 0.94 - 16, 520)
      : Math.min(windowWidth * 0.58, 640);
    return Math.max(Math.floor(maxPx / gridSize), isMobile ? 24 : 28);
  }, [gridSize, windowWidth]);

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
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex w-full items-center justify-between gap-3 rounded-3xl border border-gray-200/80 bg-white/70 px-4 py-3 text-xs text-slate-500 shadow-[0_18px_42px_-30px_rgba(15,23,42,0.9)] dark:border-white/10 dark:bg-slate-950/45 dark:text-white/45">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          <span>Standard turn tile</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-semibold text-cyan-300">
            2x
          </span>
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-semibold text-amber-300">
            3x
          </span>
        </div>
      </div>

      <div className="w-full overflow-auto touch-pan-x touch-pan-y">
        <div className="flex justify-center">
          <div
            className="relative rounded-[28px] overflow-hidden border border-gray-200/90 dark:border-white/10 backdrop-blur-sm shadow-[0_30px_80px_-42px_rgba(15,23,42,0.95)]"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
              gap: 2,
              padding: 10,
              background:
                theme === "dark"
                  ? "linear-gradient(180deg, rgba(15,23,42,0.88), rgba(2,6,23,0.95))"
                  : "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(226,232,240,0.9))",
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
                  bonusMultiplier={bonusLookup.get(`${r}-${c}`) ?? 1}
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
                  className="glass-card p-5 flex flex-col items-center gap-3 w-[min(260px,84vw)]"
                  onKeyDown={handleKeyDown}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/40 text-center">
                    Selected Cell
                  </span>
                  <span className="text-sm text-slate-600 dark:text-white/70 text-center">
                    {String.fromCharCode(65 + pending.col)}
                    {pending.row + 1}
                    {bonusLookup.get(`${pending.row}-${pending.col}`) > 1
                      ? ` • ${bonusLookup.get(`${pending.row}-${pending.col}`)}x tile`
                      : ""}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-white/50 text-center">
                    Enter a single letter to lock in your move.
                  </span>
                  <input
                    autoFocus
                    inputMode="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
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
                    <button
                      className="btn-primary flex-1 py-2.5 text-sm"
                      onClick={handleSubmit}
                    >
                      Place
                    </button>
                    <button
                      className="btn-secondary flex-1 py-2.5 text-sm"
                      onClick={() => setPending(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Turn label */}
      <div
        className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all duration-300 ${
          isMyTurn
            ? "bg-cyan-400/15 text-cyan-300 shadow-glow animate-pulse-glow"
            : "bg-gray-100 text-slate-500 dark:bg-white/5 dark:text-white/40"
        }`}
      >
        {isMyTurn
          ? "Your turn: claim a tile and place a letter."
          : "Waiting for the active player to move."}
      </div>
    </div>
  );
});

export default Grid;
