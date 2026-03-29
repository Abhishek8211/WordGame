/**
 * Server-side Game Logic
 * Handles grid initialization and word detection scanning.
 */

/** Create an N×N grid of empty strings */
function initGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(""));
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function generateBonusCells(size) {
  const totalBonusCells = Math.max(
    4,
    Math.min(size + 2, Math.floor(size * 0.75)),
  );
  const tripleCount = Math.max(1, Math.floor(totalBonusCells / 4));
  const positions = [];
  const occupied = new Set();

  while (positions.length < totalBonusCells) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    const key = `${row}-${col}`;

    if (occupied.has(key)) {
      continue;
    }

    occupied.add(key);
    positions.push({ row, col });
  }

  return shuffle(positions).map((cell, index) => ({
    ...cell,
    multiplier: index < tripleCount ? 3 : 2,
  }));
}

function getCellMultiplier(bonusCells, row, col) {
  const matchedCell = bonusCells.find(
    (cell) => cell.row === row && cell.col === col,
  );

  return matchedCell?.multiplier ?? 1;
}

function isGridFull(grid) {
  return grid.every((row) => row.every((cell) => cell !== ""));
}

function createInitialStats(size) {
  return {
    totalCells: size * size,
    filledCells: 0,
    totalMoves: 0,
    totalWords: 0,
    bestWord: null,
  };
}

function getStatsSnapshot(stats) {
  return {
    ...stats,
    remainingCells: Math.max(stats.totalCells - stats.filledCells, 0),
  };
}

/**
 * After placing a letter at (row, col), scan all 8 directions for words ≥ 3 chars.
 * Returns array of { word, cells: [{r,c}] }
 */
function checkWordsFormed(grid, row, col, size) {
  const directions = [
    { dr: 0, dc: 1, name: "horizontal" }, // →
    { dr: 0, dc: -1, name: "horizontal" }, // ←
    { dr: 1, dc: 0, name: "vertical" }, // ↓
    { dr: -1, dc: 0, name: "vertical" }, // ↑
    { dr: 1, dc: 1, name: "diagonal" }, // ↘
    { dr: -1, dc: -1, name: "diagonal" }, // ↖
    { dr: 1, dc: -1, name: "diagonal" }, // ↙
    { dr: -1, dc: 1, name: "diagonal" }, // ↗
  ];

  // For each of the 4 axis-pairs, build the full line through (row,col) and extract words
  const axes = [
    [directions[0], directions[1]], // horizontal
    [directions[2], directions[3]], // vertical
    [directions[4], directions[5]], // diagonal ↘↖
    [directions[6], directions[7]], // diagonal ↙↗
  ];

  const results = [];

  for (const [fwd, bwd] of axes) {
    const line = buildLine(grid, row, col, fwd, bwd, size);
    const words = extractWordsFromLine(line);
    results.push(...words);
  }

  return results;
}

/** Build the full character line along an axis through (row, col) */
function buildLine(grid, row, col, fwd, bwd, size) {
  const cells = [];

  // Walk backward first
  let r = row + bwd.dr,
    c = col + bwd.dc;
  const backCells = [];
  while (r >= 0 && r < size && c >= 0 && c < size) {
    backCells.unshift({ r, c, ch: grid[r][c] });
    r += bwd.dr;
    c += bwd.dc;
  }

  cells.push(...backCells, { r: row, c: col, ch: grid[row][col] });

  // Walk forward
  r = row + fwd.dr;
  c = col + fwd.dc;
  while (r >= 0 && r < size && c >= 0 && c < size) {
    cells.push({ r, c, ch: grid[r][c] });
    r += fwd.dr;
    c += fwd.dc;
  }

  return cells;
}

/** Extract all contiguous letter sequences ≥ 3 chars from a line of cells */
function extractWordsFromLine(line) {
  const words = [];
  let current = [];

  for (const cell of line) {
    if (cell.ch !== "") {
      current.push(cell);
    } else {
      if (current.length >= 3) {
        words.push({ word: current.map((c) => c.ch).join(""), cells: current });
      }
      current = [];
    }
  }
  if (current.length >= 3) {
    words.push({ word: current.map((c) => c.ch).join(""), cells: current });
  }

  return words;
}

module.exports = {
  initGrid,
  generateBonusCells,
  getCellMultiplier,
  isGridFull,
  createInitialStats,
  getStatsSnapshot,
  checkWordsFormed,
};
