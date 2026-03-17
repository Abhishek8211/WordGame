import React from "react";
import { Clock3, Crown, LayoutGrid, Sigma } from "lucide-react";
import useGameStore from "../store/useGameStore.js";

function StatCard({ icon: Icon, label, value, helper, tone = "cyan" }) {
  const toneClass =
    tone === "amber"
      ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
      : tone === "emerald"
        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
        : "border-cyan-400/25 bg-cyan-400/10 text-cyan-300";

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white/80 p-4 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.9)] dark:border-white/10 dark:bg-slate-950/45">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-white/40">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-white/55">
            {helper}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClass}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default function GameStats({ secondsLeft, turnPercent }) {
  const stats = useGameStore((state) => state.gameStats);

  const filledCells = stats?.filledCells ?? 0;
  const totalCells = stats?.totalCells ?? 0;
  const progressLabel = totalCells ? `${filledCells}/${totalCells}` : "0/0";
  const wordsLabel = stats?.totalWords ?? 0;
  const bestWord = stats?.bestWord?.word ?? "None yet";
  const bestWordHelper = stats?.bestWord
    ? `${stats.bestWord.playerName} • ${stats.bestWord.points} pts`
    : "Highest-value word will appear here.";

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Clock3}
        label="Turn Clock"
        value={`${secondsLeft}s`}
        helper={`${Math.max(Math.round(turnPercent), 0)}% of the turn window remains.`}
      />
      <StatCard
        icon={LayoutGrid}
        label="Board Progress"
        value={progressLabel}
        helper="Filled cells across the shared board."
        tone="emerald"
      />
      <StatCard
        icon={Sigma}
        label="Words Claimed"
        value={wordsLabel}
        helper="Unique validated words scored this round."
      />
      <StatCard
        icon={Crown}
        label="Best Word"
        value={bestWord}
        helper={bestWordHelper}
        tone="amber"
      />
    </section>
  );
}
