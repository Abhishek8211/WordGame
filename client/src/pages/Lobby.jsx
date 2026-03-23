import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock3,
  Copy,
  Crown,
  UserX,
  Play,
  Settings2,
  Users,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { getSocket } from "../utils/socket.js";

export default function Lobby() {
  const navigate = useNavigate();
  const roomCode = useGameStore((s) => s.roomCode);
  const players = useGameStore((s) => s.players);
  const isHost = useGameStore((s) => s.isHost);
  const gridSize = useGameStore((s) => s.gridSize);
  const turnDuration = useGameStore((s) => s.turnDuration);
  const playerId = useGameStore((s) => s.playerId);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setGridSize = useGameStore((s) => s.setGridSize);
  const setTurnDuration = useGameStore((s) => s.setTurnDuration);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const setTurnEndsAt = useGameStore((s) => s.setTurnEndsAt);
  const setBonusCells = useGameStore((s) => s.setBonusCells);
  const setActivity = useGameStore((s) => s.setActivity);
  const setGameStats = useGameStore((s) => s.setGameStats);
  const setGameOverReason = useGameStore((s) => s.setGameOverReason);
  const setGrid = useGameStore((s) => s.setGrid);
  const setCurrentTurn = useGameStore((s) => s.setCurrentTurn);
  const setGameStarted = useGameStore((s) => s.setGameStarted);
  const setScores = useGameStore((s) => s.setScores);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetAll = useGameStore((s) => s.resetAll);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);

  const [copied, setCopied] = React.useState(false);
  const turnOptions = [15, 30, 45, 60];

  useEffect(() => {
    if (!roomCode) {
      navigate("/");
      return;
    }

    const socket = getSocket();

    socket.on("room_update", ({ players, gridSize, turnDuration }) => {
      setPlayers(players);
      setGridSize(gridSize);
      setTurnDuration(turnDuration ?? 30);
      // Update isHost status
      const me = players.find((p) => p.id === socket.id || p.id === playerId);
      if (me) setIsHost(me.isHost);
    });

    socket.on("kicked", () => {
      resetAll();
      navigate("/");
    });

    socket.on(
      "game_started",
      ({
        grid,
        gridSize,
        players,
        currentTurn,
        turnDuration,
        turnEndsAt,
        bonusCells,
        activity,
        stats,
      }) => {
        resetGame();
        setGameOverReason("");
        setGrid(grid);
        setGridSize(gridSize);
        setPlayers(players);
        setCurrentTurn(currentTurn);
        setTurnDuration(turnDuration ?? 30);
        setTurnEndsAt(turnEndsAt ?? null);
        setBonusCells(bonusCells ?? []);
        setActivity(activity ?? []);
        setGameStats(stats ?? null);
        setScores(
          players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
        );
        setGameStarted(true);
        navigate("/game");
      },
    );

    return () => {
      socket.off("room_update");
      socket.off("kicked");
      socket.off("game_started");
    };
  }, [roomCode, playerId]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const kickPlayer = (targetId) => {
    getSocket().emit("kick_player", { roomCode, targetId });
  };

  const changeGridSize = (val) => {
    const size = Number(val);
    setGridSize(size);
    getSocket().emit("set_grid_size", { roomCode, size });
  };

  const changeTurnDuration = (seconds) => {
    setTurnDuration(seconds);
    getSocket().emit("set_turn_duration", { roomCode, seconds });
  };

  const startGame = () => {
    if (players.length < 2) return;
    getSocket().emit("start_game", { roomCode });
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <button
        className="fixed right-4 top-4 z-30 rounded-2xl btn-secondary p-2 sm:right-6 sm:top-6"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div
        className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <section className="space-y-6">
          <div className="glass-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/38">
                  Match Lobby
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Stage the board and invite your squad.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-white/56">
                  Set the board size, pick the turn timer, then launch a fresh
                  round with randomized opening player and live bonus tiles.
                </p>
              </div>
              <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-300">
                {players.length}/6 ready
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="rounded-[28px] border border-gray-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/38">
                  Room Code
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="select-all font-mono text-4xl font-bold tracking-[0.28em] text-slate-950 dark:text-white sm:text-5xl">
                    {roomCode}
                  </span>
                  <button
                    className="rounded-2xl btn-secondary p-2.5"
                    onClick={copyCode}
                    title="Copy code"
                  >
                    <Copy size={18} />
                  </button>
                </div>
                {copied && (
                  <motion.span
                    className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    Copied to clipboard
                  </motion.span>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                    Board
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                    {gridSize} × {gridSize}
                  </p>
                </div>
                <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                    Turn Clock
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                    {turnDuration}s
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Users size={16} className="text-cyan-300" />
                Players
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/35">
                room ready at 2+
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <AnimatePresence>
                {players.map((p) => {
                  const isMe = p.id === playerId;
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      className="flex items-center justify-between gap-3 rounded-[24px] border border-gray-200/80 bg-white/75 px-4 py-4 dark:border-white/10 dark:bg-slate-950/45"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {p.isHost && (
                              <Crown size={14} className="text-amber-400" />
                            )}
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            {isMe && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-300">
                                You
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-white/45">
                            {p.isHost ? "Room host" : "Ready for kickoff"}
                          </p>
                        </div>
                      </div>
                      {isHost && !isMe && (
                        <button
                          className="btn-danger flex items-center gap-1.5"
                          onClick={() => kickPlayer(p.id)}
                        >
                          <UserX size={13} /> Kick
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {isHost ? (
            <motion.div
              className="glass-card p-5 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Settings2 size={16} className="text-cyan-300" />
                Match Controls
              </div>

              <div className="mt-5 space-y-6">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-white/45">
                    <span className="uppercase tracking-[0.22em] font-semibold">
                      Grid Size
                    </span>
                    <span className="font-mono text-cyan-300">
                      {gridSize} × {gridSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={20}
                    step={1}
                    value={gridSize}
                    onChange={(e) => changeGridSize(e.target.value)}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                    style={{
                      background: `linear-gradient(to right, #22d3ee ${((gridSize - 10) / 10) * 100}%, rgba(148,163,184,0.25) 0%)`,
                    }}
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-white/25">
                    <span>10×10</span>
                    <span>20×20</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45">
                    <Clock3 size={14} className="text-cyan-300" /> Turn Duration
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {turnOptions.map((seconds) => (
                      <button
                        key={seconds}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                          turnDuration === seconds
                            ? "border-cyan-400/30 bg-cyan-400/12 text-cyan-300 shadow-glow"
                            : "border-gray-200 bg-white/70 text-slate-600 hover:border-cyan-400/25 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                        }`}
                        onClick={() => changeTurnDuration(seconds)}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className={`btn-primary flex w-full items-center justify-center gap-2 py-4 text-base ${
                    players.length < 2 ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  onClick={startGame}
                  disabled={players.length < 2}
                >
                  <Play size={18} />
                  {players.length < 2
                    ? "Need at least 2 players"
                    : "Launch Match"}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <Sparkles size={16} className="text-cyan-300" />
                Ready Check
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Waiting for the host to launch the round.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-white/55">
                Current setup: {gridSize}×{gridSize} board, {turnDuration}
                -second turns, randomized opening player, and fresh bonus tiles
                on start.
              </p>
            </div>
          )}

          <div className="glass-card p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/40">
              Match Preview
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Live turn pressure
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/55">
                  The timer auto-skips stalled turns, keeping matches moving
                  without manual intervention.
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Tactical bonus tiles
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/55">
                  Landing on a 2x or 3x tile multiplies the entire move,
                  including formed-word points.
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Smarter round visibility
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/55">
                  The in-game HUD tracks board fill, best word, score race, and
                  recent match actions in one place.
                </p>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
