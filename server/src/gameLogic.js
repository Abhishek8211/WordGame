/**
 * Server-side Game Logic
 * Handles grid initialization and word detection scanning.
 */

/** Create an N×N grid of empty strings */
function initGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(''));
}

/**
 * After placing a letter at (row, col), scan all 8 directions for words ≥ 3 chars.
 * Returns array of { word, cells: [{r,c}] }
 */
function checkWordsFormed(grid, row, col, size) {
  const directions = [
    { dr: 0,  dc: 1,  name: 'horizontal' },  // →
    { dr: 0,  dc: -1, name: 'horizontal' },  // ←
    { dr: 1,  dc: 0,  name: 'vertical' },    // ↓
    { dr: -1, dc: 0,  name: 'vertical' },    // ↑
    { dr: 1,  dc: 1,  name: 'diagonal' },    // ↘
    { dr: -1, dc: -1, name: 'diagonal' },    // ↖
    { dr: 1,  dc: -1, name: 'diagonal' },    // ↙
    { dr: -1, dc: 1,  name: 'diagonal' },    // ↗
  ];

  // For each of the 4 axis-pairs, build the full line through (row,col) and extract words
  const axes = [
    [directions[0], directions[1]],   // horizontal
    [directions[2], directions[3]],   // vertical
    [directions[4], directions[5]],   // diagonal ↘↖
    [directions[6], directions[7]],   // diagonal ↙↗
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
  let r = row + bwd.dr, c = col + bwd.dc;
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
    if (cell.ch !== '') {
      current.push(cell);
    } else {
      if (current.length >= 3) {
        words.push({ word: current.map((c) => c.ch).join(''), cells: current });
      }
      current = [];
    }
  }
  if (current.length >= 3) {
    words.push({ word: current.map((c) => c.ch).join(''), cells: current });
  }

  return words;
}

module.exports = { initGrid, checkWordsFormed, placeLetter: () => {} };
