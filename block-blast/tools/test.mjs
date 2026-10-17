// node tools/test.mjs — rules checks, no dependencies.
import assert from 'node:assert/strict';
import { SIZE, SHAPES, emptyBoard, canPlace, place, fits, fullLines, newTray, gameOver, randomShape, scoreLines, dims } from '../js/logic.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
const idx = s => SHAPES.findIndex(x => JSON.stringify(x) === JSON.stringify(s));
const ONE = SHAPES[idx([[0, 0]])], LINE4 = SHAPES[idx([[0, 0], [0, 1], [0, 2], [0, 3]])], SQ3 = SHAPES[idx([[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]])];
ok(ONE && LINE4 && SQ3, 'shape library has singles, lines and the 3x3');
ok(new Set(SHAPES.map(s => JSON.stringify(s))).size === SHAPES.length, 'no duplicate shapes');
ok(SHAPES.every(s => { const [h, w] = dims(s); return h <= 5 && w <= 5 && s.every(([r, c]) => r >= 0 && c >= 0); }), 'shapes are anchored at the top-left');

let b = emptyBoard();
ok(canPlace(b, LINE4, 0, 4) && !canPlace(b, LINE4, 0, 5), 'pieces must stay on the board');
let r = place(b, LINE4, 0, 0, 1); ok(r && r.lines === 0 && r.points === 4, 'placing scores one point per block');
ok(!canPlace(r.board, ONE, 0, 2), 'cannot overlap blocks');
r = place(r.board, LINE4, 0, 4, 2); ok(r.lines === 1 && r.rows[0] === 0 && r.board.every(v => !v) && r.allClear, 'a full row clears (and an empty board is an all-clear)');
ok(r.points === 4 + 10 + 300, 'row clear + all-clear bonus');

// a row and a column at once, sharing a corner
b = emptyBoard();
for (let c = 1; c < SIZE; c++) b[c] = 3;           // row 0 except (0,0)
for (let rr = 1; rr < SIZE; rr++) b[rr * SIZE] = 3; // column 0 except (0,0)
b[SIZE + 1] = 5;                                    // something that stays
r = place(b, ONE, 0, 0, 4, 0);
ok(r.lines === 2 && r.rows.join() === '0' && r.cols.join() === '0' && r.cleared.length === 15, 'row and column clear together');
ok(r.board[SIZE + 1] === 5 && !r.allClear, 'other blocks stay');
ok(r.points === 1 + scoreLines(2, 1), 'double clear scores 30');
ok(scoreLines(1, 3) === 30 && scoreLines(3, 1) === 60, 'combo multiplies line points');

// fits / game over
b = new Array(SIZE * SIZE).fill(1); b[0] = 0;
ok(fits(b, ONE) && !fits(b, LINE4), 'fits finds the one hole');
ok(gameOver(b, [{ shape: idx(SQ3), color: 1 }, null, null]) && !gameOver(b, [{ shape: idx(ONE), color: 1 }, null, null]), 'game over only when nothing fits');
// a new tray always has something that fits when anything can
for (let t = 0; t < 200; t++) { const tr = newTray(b); ok(tr.some(p => fits(b, SHAPES[p.shape])), 'tray on a nearly full board has a playable piece'); }
// random shapes cover the whole library
const seen = new Set(); for (let t = 0; t < 20000; t++) seen.add(randomShape()); ok(seen.size === SHAPES.length, 'every shape can appear');
// a long random game obeys the rules and ends
let board = emptyBoard(), tray = newTray(board), score = 0, moves = 0, combo = 0;
while (!gameOver(board, tray) && moves < 5000) {
  const i = tray.findIndex(p => p && fits(board, SHAPES[p.shape]));
  const s = SHAPES[tray[i].shape];
  let done = false;
  for (let rr = 0; rr < SIZE && !done; rr++) for (let c = 0; c < SIZE && !done; c++) if (canPlace(board, s, rr, c)) {
    const res = place(board, s, rr, c, tray[i].color, combo); board = res.board; combo = res.combo; score += res.points; done = true;
    const { rows, cols } = fullLines(board); assert(!rows.length && !cols.length, 'no full lines left after a move');
  }
  tray[i] = null; moves++;
  if (tray.every(p => !p)) tray = newTray(board);
}
ok(moves > 10 && score >= moves, `random game: ${moves} moves, ${score} points`);
console.log(n + ' block blast checks passed');
