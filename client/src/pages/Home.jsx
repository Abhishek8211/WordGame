import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Grid3x3,
  Hash,
  LogIn,
  Moon,
  Plus,
  Sparkles,
  Sun,
  TimerReset,
  Trophy,
} from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { connectSocket } from "../utils/socket.js";

export default function Home() {
  const navigate = useNavigate();
  const playerName = useGameStore((s) => s.playerName);
  const theme = useGameStore((s) => s.theme);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setPlayerId = useGameStore((s) => s.setPlayerId);
  const setRoomCode = useGameStore((s) => s.setRoomCode);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setIsHost = useGameStore((s) => s.setIsHost);
  const setGridSize = useGameStore((s) => s.setGridSize);
  const setTurnDuration = useGameStore((s) => s.setTurnDuration);
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const resetAll = useGameStore((s) => s.resetAll);

  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const featureCards = [
    {
      icon: TimerReset,
      title: "Timed turns",
      body: "Each round runs on a shared clock with auto-skip protection for inactive turns.",
    },
    {
      icon: Grid3x3,
      title: "Bonus tiles",
      body: "Fresh 2x and 3x cells appear every match, changing the board rhythm and score races.",
    },
    {
      icon: Trophy,
      title: "Live race",
      body: "Scoreboard, activity feed, and best-word tracking keep every move readable in real time.",
    },
  ];

  const roomFacts = ["Up to 6 players", "10-20 board", "2x / 3x multipliers"];

  const handleCreate = () => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setError("Enter your name first.");
      return;
    }

    setLoading(true);
    setError("");

    resetAll();
    setPlayerName(trimmedName);
    setGridSize(10);
    setTurnDuration(30);

    const socket = connectSocket();
    const doCreate = () => {
      setPlayerId(socket.id);
      socket.emit("create_room", { playerName: trimmedName }, (res) => {
        setLoading(false);
        if (res.success) {
          setRoomCode(res.roomCode);
          setIsHost(true);
          setPlayers([res.player]);
          setGridSize(res.gridSize ?? 10);
          setTurnDuration(res.turnDuration ?? 30);
          navigate("/lobby");
        } else {
          setError(res.error || "Failed to create room.");
        }
      });
    };

    if (socket.connected) doCreate();
    else socket.once("connect", doCreate);
  };

  const handleJoin = () => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setError("Enter your name first.");
      return;
    }
    if (!joinCode.trim()) {
      setError("Enter the room code.");
      return;
    }
    setLoading(true);
    setError("");

    resetAll();
    setPlayerName(trimmedName);

    const socket = connectSocket();
    const doJoin = () => {
      setPlayerId(socket.id);
      socket.emit(
        "join_room",
        {
          roomCode: joinCode.trim().toUpperCase(),
          playerName: trimmedName,
        },
        (res) => {
          setLoading(false);
          if (res.success) {
            setRoomCode(res.roomCode);
            setIsHost(false);
            setPlayers(res.players);
            setGridSize(res.gridSize);
            setTurnDuration(res.turnDuration ?? 30);
            navigate("/lobby");
          } else {
            setError(res.error || "Failed to join room.");
          }
        },
      );
    };

    if (socket.connected) doJoin();
    else socket.once("connect", doJoin);
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

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <motion.section
          className="flex flex-col gap-8"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="space-y-5">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
              <Sparkles size={14} /> Realtime Word Strategy
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-tight text-slate-950 dark:text-white sm:text-6xl xl:text-7xl">
                Turn letters into a live multiplayer board battle.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-white/62 sm:text-lg">
                WordGame blends tactical letter placement, real-time scoring,
                timed turns, and bonus tiles into a faster, cleaner room-based
                experience.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[28px] border border-gray-200/80 bg-white/80 p-5 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.95)] dark:border-white/10 dark:bg-slate-950/45"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Icon size={18} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/52">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {roomFacts.map((fact) => (
              <div
                key={fact}
                className="rounded-2xl border border-gray-200/80 bg-white/65 px-4 py-3 text-sm font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/58"
              >
                {fact}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="glass-card mx-auto w-full max-w-xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/38">
              Enter The Arena
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Create a room or jump straight into one.
            </h2>
            <p className="text-sm leading-6 text-slate-500 dark:text-white/55">
              Rooms open with 30-second turns by default and unlock bonus tiles
              as soon as the match starts.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/40">
                Player Name
              </label>
              <input
                className="glass-input"
                placeholder="Enter your player name"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (mode === "join" ? handleJoin() : handleCreate())
                }
                maxLength={20}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                  mode === "create"
                    ? "border border-cyan-400/30 bg-cyan-400/12 text-cyan-300 shadow-glow"
                    : "border border-gray-200 bg-white/70 text-slate-600 hover:border-cyan-400/30 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                }`}
                onClick={() => {
                  setMode("create");
                  setError("");
                }}
              >
                <Plus size={16} /> Create Room
              </button>
              <button
                className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                  mode === "join"
                    ? "border border-cyan-400/30 bg-cyan-400/12 text-cyan-300 shadow-glow"
                    : "border border-gray-200 bg-white/70 text-slate-600 hover:border-cyan-400/30 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                }`}
                onClick={() => {
                  setMode("join");
                  setError("");
                }}
              >
                <LogIn size={16} /> Join Room
              </button>
            </div>

            <AnimatePresence>
              {mode === "join" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500 dark:text-white/40">
                    Room Code
                  </label>
                  <div className="relative">
                    <Hash
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/28"
                    />
                    <input
                      className="glass-input pl-11 font-mono text-lg uppercase tracking-[0.35em]"
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase());
                        setError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      maxLength={6}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}

            {mode && (
              <motion.button
                className="btn-primary w-full py-4 text-base"
                onClick={mode === "create" ? handleCreate : handleJoin}
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Connecting
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === "create" ? "Create Room" : "Join Room"}
                    <ArrowRight size={16} />
                  </span>
                )}
              </motion.button>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/40">
                  Turns
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  30s
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/40">
                  Players
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  2-6
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200/80 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/40">
                  Scoring
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                  Live
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
