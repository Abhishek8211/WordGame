import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star } from "lucide-react";
import useGameStore from "../store/useGameStore.js";

export default function Scoreboard() {
  const scores = useGameStore((s) => s.scores);
  const players = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const wordsFound = useGameStore((s) => s.wordsFound);
  const gameStats = useGameStore((s) => s.gameStats);

  // Merge scores from both sources; scores array is authoritative
  const display =
    scores.length > 0
      ? scores
      : players.map((p) => ({ id: p.id, name: p.name, score: p.score }));
  const sorted = [...display].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-4 min-w-[200px]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-800 dark:text-white font-semibold text-sm">
          <Trophy size={16} className="text-amber-400" />
          Scoreboard
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/35">
          {gameStats?.totalMoves ?? 0} moves
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <AnimatePresence>
          {sorted.map((p, idx) => {
            const isActive = p.id === currentTurn;
            const leaderScore = sorted[0]?.score ?? 1;
            const fill =
              leaderScore > 0 ? Math.max((p.score / leaderScore) * 100, 8) : 8;

            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isActive
                    ? "bg-cyan-400/12 border border-cyan-400/30 shadow-glow"
                    : "bg-gray-100/80 border border-transparent dark:bg-white/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono ${idx === 0 ? "text-amber-400" : "text-slate-400 dark:text-white/30"}`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-gray-800 dark:text-white font-medium truncate max-w-[110px]">
                      {p.name}
                    </span>
                    {isActive && (
                      <Star size={12} className="text-cyan-300 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <div
                      className={`h-full rounded-full ${idx === 0 ? "bg-amber-400" : "bg-cyan-400/80"}`}
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
                <motion.span
                  key={p.score}
                  className={`ml-3 font-mono font-bold ${idx === 0 ? "text-amber-400" : "text-cyan-300"}`}
                  initial={{ scale: 1.4, color: "#67e8f9" }}
                  animate={{
                    scale: 1,
                    color: idx === 0 ? "#fbbf24" : "#67e8f9",
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {p.score}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Recent words */}
      {wordsFound.length > 0 && (
        <div className="border-t border-gray-200 dark:border-white/10 pt-3">
          <div className="text-slate-500 dark:text-white/40 text-xs mb-2 uppercase tracking-[0.22em] font-semibold">
            Words Found
          </div>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
            {[...wordsFound]
              .reverse()
              .slice(0, 30)
              .map((w, i) => (
                <span
                  key={i}
                  className="bg-emerald-500/12 text-emerald-300 text-xs px-2 py-1 rounded-full border border-emerald-500/20 font-mono"
                >
                  {w}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
