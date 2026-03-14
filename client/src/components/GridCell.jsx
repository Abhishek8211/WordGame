import React, { memo } from "react";
import { motion } from "framer-motion";

/**
 * Single grid cell — memoized to prevent 400 re-renders on every state change.
 */
const GridCell = memo(function GridCell({
  value,
  row,
  col,
  isMyTurn,
  isNewWord,
  bonusMultiplier,
  onClick,
  cellSize,
}) {
  const isEmpty = value === "";

  let cellClass = "grid-cell ";
  if (isNewWord) cellClass += "grid-cell-new-word ";
  else if (!isEmpty) cellClass += "grid-cell-filled ";
  else if (bonusMultiplier === 3)
    cellClass += "grid-cell-empty grid-cell-bonus-3x ";
  else if (bonusMultiplier === 2)
    cellClass += "grid-cell-empty grid-cell-bonus-2x ";
  else if (isMyTurn) cellClass += "grid-cell-empty grid-cell-active-turn ";
  else cellClass += "grid-cell-empty opacity-60 ";

  if (isEmpty && isMyTurn) {
    cellClass += "grid-cell-active-turn ";
  }

  const handleClick = () => {
    if (isEmpty && isMyTurn) onClick(row, col);
  };

  return (
    <motion.div
      className={cellClass}
      style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.38 }}
      onClick={handleClick}
      whileHover={isEmpty && isMyTurn ? { scale: 1.12, zIndex: 10 } : {}}
      whileTap={isEmpty && isMyTurn ? { scale: 0.92 } : {}}
      initial={false}
      animate={
        isNewWord ? { scale: [1, 1.25, 1], transition: { duration: 0.45 } } : {}
      }
      title={
        isEmpty && isMyTurn
          ? `Place letter at (${row},${col})${bonusMultiplier > 1 ? ` • ${bonusMultiplier}x tile` : ""}`
          : undefined
      }
    >
      {isEmpty && bonusMultiplier > 1 && (
        <span className="pointer-events-none absolute left-1 top-1 rounded-full border border-white/20 bg-slate-950/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75">
          {bonusMultiplier}x
        </span>
      )}
      {value}
    </motion.div>
  );
});

export default GridCell;
