import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hash, Plus, LogIn, Sun, Moon } from "lucide-react";
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
  const toggleTheme = useGameStore((s) => s.toggleTheme);
  const resetAll = useGameStore((s) => s.resetAll);

  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!playerName.trim()) {
      setError("Enter your name first.");
      return;
    }
    setLoading(true);
    setError("");

    resetAll();
    setPlayerName(playerName.trim());

    const socket = connectSocket();

    socket.once("connect", () => {
      setPlayerId(socket.id);
      socket.emit("create_room", { playerName: playerName.trim() }, (res) => {
        setLoading(false);
        if (res.success) {
          setRoomCode(res.roomCode);
          setIsHost(true);
          setPlayers([res.player]);
          navigate("/lobby");
        } else {
          setError(res.error || "Failed to create room.");
        }
      });
    });

    // If already connected
    if (socket.connected) {
      setPlayerId(socket.id);
      socket.emit("create_room", { playerName: playerName.trim() }, (res) => {
        setLoading(false);
        if (res.success) {
          setRoomCode(res.roomCode);
          setIsHost(true);
          setPlayers([res.player]);
          navigate("/lobby");
        } else {
          setError(res.error || "Failed to create room.");
        }
      });
    }
  };

  const handleJoin = () => {
    if (!playerName.trim()) {
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
    setPlayerName(playerName.trim());

    const socket = connectSocket();
    const doJoin = () => {
      setPlayerId(socket.id);
      socket.emit(
        "join_room",
        {
          roomCode: joinCode.trim().toUpperCase(),
          playerName: playerName.trim(),
        },
        (res) => {
          setLoading(false);
          if (res.success) {
            setRoomCode(res.roomCode);
            setIsHost(false);
            setPlayers(res.players);
            setGridSize(res.gridSize);
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      {/* Theme toggle */}
      <button
        className="fixed top-4 right-4 sm:top-5 sm:right-5 btn-secondary p-2 rounded-xl"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <motion.div
        className="w-full max-w-md flex flex-col items-center gap-8"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo / Title */}
        <div className="text-center">
          <motion.h1
            className="text-4xl sm:text-6xl font-extrabold bg-gradient-to-br from-violet-400 via-purple-300 to-pink-400 bg-clip-text text-transparent"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            WordGrid
          </motion.h1>
          <p className="text-slate-500 dark:text-white/40 mt-2 text-sm tracking-wide">
            Multiplayer word battle
          </p>
        </div>

        {/* Card */}
        <div className="glass-card w-full p-5 sm:p-8 flex flex-col gap-4 sm:gap-5">
          {/* Name input */}
          <div>
            <label className="text-slate-500 dark:text-white/50 text-xs font-medium uppercase tracking-wider mb-1.5 block">
              Your Name
            </label>
            <input
              className="glass-input"
              placeholder="Enter your player name…"
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

          {/* Mode selector */}
          <div className="flex gap-3">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                mode === "create"
                  ? "bg-violet-600 text-white shadow-glow"
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200 border border-gray-300 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:border-white/10"
              }`}
              onClick={() => {
                setMode("create");
                setError("");
              }}
            >
              <Plus size={16} /> Create Room
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                mode === "join"
                  ? "bg-violet-600 text-white shadow-glow"
                  : "bg-gray-100 text-slate-600 hover:bg-gray-200 border border-gray-300 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10 dark:border-white/10"
              }`}
              onClick={() => {
                setMode("join");
                setError("");
              }}
            >
              <LogIn size={16} /> Join Room
            </button>
          </div>

          {/* Join code input */}
          {mode === "join" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label className="text-slate-500 dark:text-white/50 text-xs font-medium uppercase tracking-wider mb-1.5 block">
                Room Code
              </label>
              <div className="relative">
                <Hash
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30"
                />
                <input
                  className="glass-input pl-9 font-mono uppercase tracking-widest text-lg"
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

          {/* Error */}
          {error && (
            <motion.p
              className="text-red-500 dark:text-red-400 text-sm text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          {/* Action button */}
          {mode && (
            <motion.button
              className="btn-primary w-full py-3.5 text-base"
              onClick={mode === "create" ? handleCreate : handleJoin}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Connecting…
                </span>
              ) : mode === "create" ? (
                "Create Room →"
              ) : (
                "Join Room →"
              )}
            </motion.button>
          )}
        </div>

        <p className="text-white/20 text-xs">
          Invite friends · Form words · Rule the grid
        </p>
      </motion.div>
    </div>
  );
}
