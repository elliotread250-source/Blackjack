// node tools/test.mjs — rules and bot checks, no dependencies.
import assert from 'node:assert/strict';
import { result, bestMoves, botMove, winningMove, empty, other } from '../js/logic.js';

const B = s => [...s].map(c => (c === '.' ? '' : c));
let n = 0; const ok = (v, m) => { assert(v, m); n++; };

ok(result(B('XXX......')).player === 'X', 'row win');
ok(result(B('O..O..O..')).player === 'O', 'column win');
ok(result(B('X...X...X')).line.join() === '0,4,8', 'diagonal line reported');
ok(result(B('XOXXOOOXX')) === 'draw', 'full board without a line is a draw');
ok(result(B('XO.......')) === null, 'game in progress');
ok(winningMove(B('XX.OO....'), 'X') === 2, 'sees its winning move');
ok(bestMoves(B('XX.OO....'), 'O').join() === '5', 'impossible bot wins instead of blocking when it can');
ok(botMove(B('XX..O....'), 'O', 'medium') === 2, 'medium blocks');

// Impossible never loses: play it against every possible opponent line, as both X and O.
function* games(b, turn, me) {
  const r = result(b);
  if (r) { yield r; return; }
  if (turn === me) { for (const i of bestMoves(b, me)) { b[i] = me; yield* games(b, other(turn), me); b[i] = ''; } }
  else for (const i of empty(b)) { b[i] = turn; yield* games(b, other(turn), me); b[i] = ''; }
}
for (const me of ['X', 'O']) {
  let count = 0;
  for (const r of games(Array(9).fill(''), 'X', me)) { count++; assert(r === 'draw' || r.player === me, `impossible bot as ${me} never loses`); }
  ok(count > 100, `explored ${count} games as ${me}`);
}
// Two perfect players always draw.
let b = Array(9).fill(''), t = 'X';
while (!result(b)) { b[botMove(b, t, 'impossible')] = t; t = other(t); }
ok(result(b) === 'draw', 'perfect vs perfect is a draw');
// Easy is beatable: it doesn't always block.
let missed = 0;
for (let i = 0; i < 200; i++) if (botMove(B('XX..O....'), 'O', 'easy') !== 2) missed++;
ok(missed > 50, 'easy sometimes misses a block');
console.log(n + ' tic tac toe checks passed');
