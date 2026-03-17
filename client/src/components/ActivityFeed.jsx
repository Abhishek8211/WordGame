import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock3, Footprints, Sparkles } from "lucide-react";
import useGameStore from "../store/useGameStore.js";

function formatCoordinate(row, col) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

function getEntryVisual(entry) {
  switch (entry.type) {
    case "move":
      return {
        Icon: Sparkles,
        accentClass: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
      };
    case "skip":
      return {
        Icon: Clock3,
        accentClass: "text-amber-300 border-amber-400/30 bg-amber-400/10",
      };
    default:
      return {
        Icon: Footprints,
        accentClass: "text-slate-300 border-white/10 bg-white/5",
      };
  }
}

function renderEntryCopy(entry) {
  if (entry.type === "move") {
    const coordinate = formatCoordinate(entry.row, entry.col);
    const wordLine = entry.words.length
      ? `Words: ${entry.words.join(", ")}`
      : "No word chain completed on this move.";

    return {
      title: `${entry.playerName} placed ${entry.letter} at ${coordinate}`,
      meta: `+${entry.points} pts${entry.multiplier > 1 ? ` • ${entry.multiplier}x tile` : ""}`,
      detail: wordLine,
    };
  }

  if (entry.type === "skip") {
    return {
      title:
        entry.reason === "timer"
          ? `${entry.playerName} ran out of time`
          : `${entry.playerName} skipped the turn`,
      meta: entry.reason === "timer" ? "Auto-skip" : "Manual skip",
      detail: "Turn passed to the next player.",
    };
  }

  return {
    title: entry.text,
    meta: "System",
    detail: "",
  };
}

const ActivityFeed = memo(function ActivityFeed() {
  const activity = useGameStore((state) => state.activity);
  const entries = [...activity].reverse().slice(0, 10);

  return (
    <section className="glass-card p-4 sm:p-5 flex flex-col gap-4 min-h-[260px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/40">
            Match Feed
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Recent Plays
          </h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:text-white/50">
          Live
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {entries.map((entry) => {
            const { Icon, accentClass } = getEntryVisual(entry);
            const copy = renderEntryCopy(entry);

            return (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="rounded-2xl border border-gray-200/80 bg-white/75 p-3.5 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.8)] dark:border-white/10 dark:bg-slate-950/45"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border ${accentClass}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {copy.title}
                      </p>
                      <span className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/35">
                        {copy.meta}
                      </span>
                    </div>
                    {copy.detail && (
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
                        {copy.detail}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {entries.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300/80 bg-white/55 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
            Match actions will stream here once the round starts.
          </div>
        )}
      </div>
    </section>
  );
});

export default ActivityFeed;
