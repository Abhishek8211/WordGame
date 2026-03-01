import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Single grid cell — memoized to prevent 400 re-renders on every state change.
 */
const GridCell = memo(function GridCell({ value, row, col, isMyTurn, isNewWord, onClick, cellSize }) {
  const isEmpty = value === '';

  let cellClass = 'grid-cell ';
  if (isNewWord)     cellClass += 'grid-cell-new-word ';
  else if (!isEmpty) cellClass += 'grid-cell-filled ';
  else if (isMyTurn) cellClass += 'grid-cell-empty grid-cell-active-turn ';
  else               cellClass += 'grid-cell-empty opacity-60 ';

  const handleClick = () => {
    if (isEmpty && isMyTurn) onClick(row, col);
  };

  return (
    <motion.div
      className={cellClass}
      style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.38 }}
      onClick={handleClick}
      whileHover={isEmpty && isMyTurn ? { scale: 1.12, zIndex: 10 } : {}}
      whileTap={isEmpty   && isMyTurn ? { scale: 0.92 } : {}}
      initial={false}
      animate={isNewWord ? { scale: [1, 1.25, 1], transition: { duration: 0.45 } } : {}}
      title={isEmpty && isMyTurn ? `Place letter at (${row},${col})` : undefined}
    >
      {value}
    </motion.div>
  );
});

export default GridCell;
