// Rules and the computer player. Pure functions, no DOM, so the tests can run them in Node.
// A board is an array of 9 cells: '', 'X' or 'O', read left to right, top to bottom.

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export const other = p => (p === 'X' ? 'O' : 'X');
export const empty = b => b.reduce((a, c, i) => (c ? a : (a.push(i), a)), []);

// { player, line } when someone has three in a row, 'draw' when the board is full, otherwise null.
export function result(b) {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { player: b[a], line };
  }
  return b.every(Boolean) ? 'draw' : null;
}

// Score for `me` with `turn` to move: +10 - depth for a win, depth - 10 for a loss, 0 for a draw.
// Preferring quick wins and slow losses makes the bot finish games and fight to the end.
function score(b, me, turn, depth) {
  const r = result(b);
  if (r === 'draw') return 0;
  if (r) return r.player === me ? 10 - depth : depth - 10;
  let best = turn === me ? -Infinity : Infinity;
  for (const i of empty(b)) {
    b[i] = turn;
    const s = score(b, me, other(turn), depth + 1);
    b[i] = '';
    best = turn === me ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

// Every move that is as good as possible for `me`.
export function bestMoves(board, me) {
  const b = board.slice();
  let best = -Infinity, moves = [];
  for (const i of empty(b)) {
    b[i] = me;
    const s = score(b, me, other(me), 1);
    b[i] = '';
    if (s > best) { best = s; moves = [i]; } else if (s === best) moves.push(i);
  }
  return moves;
}

// A move that wins on the spot for `p`, or -1.
export function winningMove(b, p) {
  for (const i of empty(b)) {
    const t = b.slice(); t[i] = p;
    const r = result(t);
    if (r && r !== 'draw') return i;
  }
  return -1;
}

const pick = (list, rnd) => list[Math.floor(rnd() * list.length)];

// easy: takes a win it can see half the time, otherwise plays anywhere.
// medium: always wins or blocks when it can, likes the centre and corners, otherwise random.
// impossible: perfect play (never loses), picking at random between equally good moves.
export function botMove(b, me, level = 'impossible', rnd = Math.random) {
  const free = empty(b);
  if (!free.length) return -1;
  if (level === 'easy') {
    const win = winningMove(b, me);
    if (win >= 0 && rnd() < 0.5) return win;
    return pick(free, rnd);
  }
  if (level === 'medium') {
    const win = winningMove(b, me);
    if (win >= 0) return win;
    const block = winningMove(b, other(me));
    if (block >= 0) return block;
    if (rnd() < 0.35) return pick(bestMoves(b, me), rnd);
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter(i => !b[i]);
    return corners.length && rnd() < 0.6 ? pick(corners, rnd) : pick(free, rnd);
  }
  return pick(bestMoves(b, me), rnd);
}
