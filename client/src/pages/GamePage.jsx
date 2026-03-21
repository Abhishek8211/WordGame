import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, LogOut, Moon, SkipForward, Sun, Zap } from "lucide-react";
import useGameStore from "../store/useGameStore.js";
import { getSocket, disconnectSocket } from "../utils/socket.js";
import ActivityFeed from "../components/ActivityFeed.jsx";
import Grid from "../components/Grid.jsx";
import GameStats from "../components/GameStats.jsx";
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
  const grid = useGameStore((s) => s.grid);
  const gameStarted = useGameStore((s) => s.gameStarted);
  const turnDuration = useGameStore((s) => s.turnDuration);
  const turnEndsAt = useGameStore((s) => s.turnEndsAt);
  const gameStats = useGameStore((s) => s.gameStats);
  const gameOverReason = useGameStore((s) => s.gameOverReason);
  const scores = useGameStore((s) => s.scores);
  const theme = useGameStore((s) => s.theme);
  const toggleTheme = useGameStore((s) => s.toggleTheme);

  const setPlayers = useGameStore((s) => s.setPlayers);
  const setGrid = useGameStore((s) => s.setGrid);
  const setCurrentTurn = useGameStore((s) => s.setCurrentTurn);
  const setTurnEndsAt = useGameStore((s) => s.setTurnEndsAt);
  const setScores = useGameStore((s) => s.setScores);
  const setActivity = useGameStore((s) => s.setActivity);
  const addActivityItem = useGameStore((s) => s.addActivityItem);
  const setGameStats = useGameStore((s) => s.setGameStats);
  const setGameOverReason = useGameStore((s) => s.setGameOverReason);
  const setBonusCells = useGameStore((s) => s.setBonusCells);
  const addWordFound = useGameStore((s) => s.addWordFound);
  const addChatMessage = useGameStore((s) => s.addChatMessage);
  const setLastWordFlash = useGameStore((s) => s.setLastWordFlash);
  const setGameStarted = useGameStore((s) => s.setGameStarted);
  const resetAll = useGameStore((s) => s.resetAll);
  const [clockNow, setClockNow] = useState(Date.now());
  const flashTimeoutsRef = useRef([]);

  const currentPlayer = players.find((p) => p.id === currentTurn);
  const isMyTurn = currentTurn === playerId;
  const sortedScores = useMemo(
    () => [...scores].sort((a, b) => b.score - a.score),
    [scores],
  );
  const winner = sortedScores[0] ?? null;
  const secondsLeft = turnEndsAt
    ? Math.max(0, Math.ceil((turnEndsAt - clockNow) / 1000))
    : turnDuration;
  const turnPercent = turnEndsAt
    ? Math.max(
        0,
        Math.min(100, ((turnEndsAt - clockNow) / (turnDuration * 1000)) * 100),
      )
    : 0;
  const boardFillPercent =
    gameStats?.totalCells && gameStats.totalCells > 0
      ? Math.round((gameStats.filledCells / gameStats.totalCells) * 100)
      : 0;
  const bonusTileCount = useGameStore((s) => s.bonusCells.length);

  useEffect(() => {
    setClockNow(Date.now());

    if (!turnEndsAt) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [turnEndsAt]);

  useEffect(
    () => () => {
      flashTimeoutsRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
    },
    [],
  );

  const queueWordFlash = (words) => {
    words.forEach((wordResult, index) => {
      const revealDelay = index * 650;
      const showTimer = window.setTimeout(() => {
        addWordFound(wordResult.word);
        setLastWordFlash({ word: wordResult.word, cells: wordResult.cells });
      }, revealDelay);
      const hideTimer = window.setTimeout(() => {
        setLastWordFlash(null);
      }, revealDelay + 1200);

      flashTimeoutsRef.current.push(showTimer, hideTimer);
    });
  };

  useEffect(() => {
    if (!roomCode) {
      navigate("/");
      return;
    }

    const socket = getSocket();

    socket.on(
      "grid_update",
      ({
        grid,
        newWords,
        scores,
        currentTurn,
        turnEndsAt,
        stats,
        activityEntry,
      }) => {
        setGrid(grid);
        setCurrentTurn(currentTurn);
        setTurnEndsAt(turnEndsAt ?? null);
        setScores(scores);
        setGameStats(stats ?? null);

        if (activityEntry) {
          addActivityItem(activityEntry);
        }

        if (newWords && newWords.length > 0) {
          queueWordFlash(newWords);
        }
      },
    );

    socket.on(
      "turn_update",
      ({ currentTurn, turnEndsAt, scores, stats, activityEntry }) => {
        setCurrentTurn(currentTurn);
        setTurnEndsAt(turnEndsAt ?? null);
        if (scores) setScores(scores);
        if (stats) setGameStats(stats);
        if (activityEntry) addActivityItem(activityEntry);
      },
    );

    socket.on("chat_message", addChatMessage);

    socket.on("room_update", ({ players }) => {
      setPlayers(players);
    });

    socket.on(
      "game_ended",
      ({ reason, scores, stats, activity, bonusCells }) => {
        setGameStarted(false);
        setScores(scores);
        setGameStats(stats ?? null);
        setActivity(activity ?? []);
        setBonusCells(bonusCells ?? []);
        setGameOverReason(reason ?? "Round complete.");
        setTurnEndsAt(null);
      },
    );

    return () => {
      socket.off("grid_update");
      socket.off("turn_update");
      socket.off("chat_message");
      socket.off("room_update");
      socket.off("game_ended");
    };
  }, [roomCode]);

  const handleLeave = () => {
    disconnectSocket();
    resetAll();
    navigate("/");
  };

  const handleReturnToLobby = () => {
    setGameStarted(false);
    setTurnEndsAt(null);
    navigate("/lobby");
  };

  const handleSkipTurn = () => {
    if (!isMyTurn) return;
    getSocket().emit("skip_turn", { roomCode });
  };

  const gameEnded = !gameStarted && scores.length > 0 && grid.length > 0;

  if (gameEnded) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[1.1fr_0.9fr]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="glass-card p-6 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-white/38">
              Round Complete
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {winner ? `${winner.name} takes the board.` : "Match finished."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 dark:text-white/56">
              {gameOverReason || "The round has ended."}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                  Final Words
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {gameStats?.totalWords ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                  Board Fill
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {boardFillPercent}%
                </p>
              </div>
              <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                  Best Word
                </p>
                <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
                  {gameStats?.bestWord?.word ?? "None"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="btn-primary flex items-center justify-center gap-2"
                onClick={handleReturnToLobby}
              >
                <ChevronLeft size={16} /> Back to Lobby
              </button>
              <button
                className="btn-secondary flex items-center justify-center gap-2"
                onClick={handleLeave}
              >
                <LogOut size={16} /> Leave Room
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <Scoreboard />
            <ActivityFeed />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6">
      <header className="glass-card px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Live Match
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                Room {roomCode}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {isMyTurn
                  ? "Your move."
                  : `${currentPlayer?.name ?? "Waiting"} is on the clock.`}
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-white/55">
                {gridSize}×{gridSize} board, {bonusTileCount} bonus tiles live,
                best word tracking enabled.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isMyTurn
                  ? "border border-amber-400/30 bg-amber-400/12 text-amber-300"
                  : "border border-gray-200 bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/30"
              }`}
              onClick={handleSkipTurn}
              disabled={!isMyTurn}
            >
              <span className="flex items-center gap-2">
                <SkipForward size={16} /> Skip Turn
              </span>
            </button>
            <button
              className="rounded-2xl btn-secondary p-3"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="rounded-2xl btn-danger flex items-center gap-2 px-4 py-3"
              onClick={handleLeave}
            >
              <LogOut size={14} /> Leave
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_290px] xl:items-center">
          <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-white/38">
              <span>Turn Pressure</span>
              <span>{secondsLeft}s left</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <motion.div
                className={`h-full rounded-full ${isMyTurn ? "bg-cyan-400" : "bg-amber-400"}`}
                animate={{ width: `${turnPercent}%` }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-white/50">
              <Zap
                size={15}
                className={isMyTurn ? "text-cyan-300" : "text-amber-300"}
              />
              <span>
                {isMyTurn
                  ? "Use the clock to decide whether to cash a safe tile or hunt for a multiplier."
                  : `${currentPlayer?.name ?? "The active player"} controls the board until the timer expires.`}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                Board Fill
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {boardFillPercent}%
              </p>
            </div>
            <div className="rounded-[24px] border border-gray-200/80 bg-white/75 p-4 dark:border-white/10 dark:bg-slate-950/45">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/38">
                Best Word
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                {gameStats?.bestWord?.word ?? "Pending"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-4">
        <GameStats secondsLeft={secondsLeft} turnPercent={turnPercent} />
      </div>

      <AnimatePresence>
        {lastWordFlash && (
          <motion.div
            className="fixed left-1/2 top-6 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-3 rounded-full border border-emerald-400/30 bg-slate-950/85 px-5 py-3 text-white shadow-[0_30px_80px_-42px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <span className="text-xl sm:text-2xl">✦</span>
            <span className="font-mono text-base font-bold uppercase tracking-[0.35em] text-emerald-300 sm:text-lg">
              {lastWordFlash.word}
            </span>
            <span className="text-xs text-emerald-300/80 sm:text-sm">
              +{lastWordFlash.word.length} pts
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mt-4 grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="order-2 xl:order-1">
          <Scoreboard />
        </aside>

        <div className="order-1 min-w-0 xl:order-2">
          <div className="glass-card p-4 sm:p-5">
            <Grid />
          </div>
        </div>

        <aside className="order-3">
          <ActivityFeed />
        </aside>
      </main>

      <Chat />
    </div>
  );
}
