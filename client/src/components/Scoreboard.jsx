import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import useGameStore from '../store/useGameStore.js';

export default function Scoreboard() {
  const scores     = useGameStore((s) => s.scores);
  const players    = useGameStore((s) => s.players);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const wordsFound  = useGameStore((s) => s.wordsFound);

  // Merge scores from both sources; scores array is authoritative
  const display = scores.length > 0 ? scores : players.map((p) => ({ id: p.id, name: p.name, score: p.score }));
  const sorted  = [...display].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card p-4 flex flex-col gap-3 min-w-[200px]">
      <div className="flex items-center gap-2 text-white font-semibold text-sm">
        <Trophy size={16} className="text-amber-400" />
        Scoreboard
      </div>

      {/* Player list */}
      <div className="flex flex-col gap-1">
        <AnimatePresence>
          {sorted.map((p, idx) => {
            const isActive = p.id === currentTurn;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-violet-500/20 border border-violet-500/30 shadow-glow'
                    : 'bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${idx === 0 ? 'text-amber-400' : 'text-white/30'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-white font-medium truncate max-w-[110px]">{p.name}</span>
                  {isActive && <Star size={12} className="text-violet-400 animate-pulse" />}
                </div>
                <motion.span
                  key={p.score}
                  className={`font-mono font-bold ${idx === 0 ? 'text-amber-400' : 'text-violet-300'}`}
                  initial={{ scale: 1.4, color: '#a78bfa' }}
                  animate={{ scale: 1, color: idx === 0 ? '#fbbf24' : '#c4b5fd' }}
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
        <div className="border-t border-white/10 pt-3">
          <div className="text-white/40 text-xs mb-1">Words Found</div>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
            {[...wordsFound].reverse().slice(0, 30).map((w, i) => (
              <span key={i} className="bg-emerald-500/15 text-emerald-300 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
