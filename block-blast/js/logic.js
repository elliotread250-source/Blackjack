// Rules for Block Blast. Pure functions over plain data, so the tests run them in Node.
// The board is SIZE*SIZE cells, each 0 (empty) or a colour index 1..COLORS. A shape is a list of
// [row, col] offsets from its top-left corner.

export const SIZE = 8, COLORS = 7;

const parse = rows => rows.flatMap((line, r) => [...line].map((ch, c) => (ch === '#' ? [r, c] : null)).filter(Boolean));
// [shape rows, weight]: small and line pieces are common, the big ones rarer.
const DEFS = [
  [['#'], 2],
  [['##'], 3], [['#', '#'], 3],
  [['###'], 3], [['#', '#', '#'], 3],
  [['####'], 2], [['#', '#', '#', '#'], 2],
  [['#####'], 1], [['#', '#', '#', '#', '#'], 1],
  [['##', '##'], 3],
  [['###', '###', '###'], 1],
  [['###', '###'], 1], [['##', '##', '##'], 1],
  [['#.', '##'], 2], [['.#', '##'], 2], [['##', '#.'], 2], [['##', '.#'], 2],
  [['#..', '###'], 1], [['..#', '###'], 1], [['###', '#..'], 1], [['###', '..#'], 1],
  [['#.', '#.', '##'], 1], [['.#', '.#', '##'], 1], [['##', '#.', '#.'], 1], [['##', '.#', '.#'], 1],
  [['###', '.#.'], 1], [['.#.', '###'], 1], [['#.', '##', '#.'], 1], [['.#', '##', '.#'], 1],
  [['##.', '.##'], 1], [['.##', '##.'], 1], [['#.', '##', '.#'], 1], [['.#', '##', '#.'], 1],
  [['#..', '.#.', '..#'], 0.5], [['..#', '.#.', '#..'], 0.5],
];
export const SHAPES = DEFS.map(([rows]) => parse(rows));
const WEIGHTS = DEFS.map(([, w]) => w), TOTAL = WEIGHTS.reduce((a, b) => a + b, 0);

export const emptyBoard = () => new Array(SIZE * SIZE).fill(0);
export const dims = shape => [Math.max(...shape.map(p => p[0])) + 1, Math.max(...shape.map(p => p[1])) + 1];

export function canPlace(board, shape, r, c) {
  for (const [dr, dc] of shape) {
    const rr = r + dr, cc = c + dc;
    if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE || board[rr * SIZE + cc]) return false;
  }
  return true;
}
export function fits(board, shape) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(board, shape, r, c)) return true;
  return false;
}

// Rows and columns that are full on `board`.
export function fullLines(board) {
  const rows = [], cols = [];
  for (let i = 0; i < SIZE; i++) {
    let row = true, col = true;
    for (let j = 0; j < SIZE; j++) { if (!board[i * SIZE + j]) row = false; if (!board[j * SIZE + i]) col = false; }
    if (row) rows.push(i); if (col) cols.push(i);
  }
  return { rows, cols };
}

// Places a piece and clears every full row and column at once. Returns the new board, the lines
// and cells cleared, and what the move scores. `combo` is the streak before this move.
export function place(board, shape, r, c, color, combo = 0) {
  if (!canPlace(board, shape, r, c)) return null;
  const b = board.slice();
  for (const [dr, dc] of shape) b[(r + dr) * SIZE + c + dc] = color;
  const { rows, cols } = fullLines(b), cleared = new Set();
  for (const i of rows) for (let j = 0; j < SIZE; j++) cleared.add(i * SIZE + j);
  for (const i of cols) for (let j = 0; j < SIZE; j++) cleared.add(j * SIZE + i);
  for (const i of cleared) b[i] = 0;
  const lines = rows.length + cols.length;
  const newCombo = lines ? combo + 1 : combo;
  const allClear = lines > 0 && b.every(v => !v);
  const points = shape.length + scoreLines(lines, newCombo) + (allClear ? 300 : 0);
  return { board: b, rows, cols, cleared: [...cleared], lines, combo: newCombo, allClear, points };
}
// 1 line 10, 2 lines 30, 3 lines 60 ... times the combo streak.
export function scoreLines(lines, combo) { return lines ? 10 * lines * (lines + 1) / 2 * Math.max(1, combo) : 0; }

export function randomShape(rnd = Math.random) {
  let x = rnd() * TOTAL;
  for (let i = 0; i < SHAPES.length; i++) { x -= WEIGHTS[i]; if (x < 0) return i; }
  return SHAPES.length - 1;
}

// A fresh tray of three. It tries to make sure at least one piece fits (a tray where nothing fits
// is an instant, unfair loss), and on a nearly-full board leans towards smaller pieces.
export function newTray(board, rnd = Math.random) {
  let tray;
  for (let attempt = 0; attempt < 40; attempt++) {
    tray = [0, 1, 2].map(() => ({ shape: randomShape(rnd), color: 1 + Math.floor(rnd() * COLORS) }));
    if (tray.some(p => fits(board, SHAPES[p.shape]))) return tray;
  }
  tray[0] = { shape: 0, color: tray[0].color }; // a single block, if anything at all fits
  return tray;
}

// True when none of the pieces left in the tray (nulls are used slots) can go anywhere.
export function gameOver(board, tray) { return tray.every(p => !p || !fits(board, SHAPES[p.shape])); }
