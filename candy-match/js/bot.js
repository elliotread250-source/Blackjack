// bot.js: a player for the pure game logic. Greedy with optional lookahead: it simulates
// every legal swap on a clone (the clone shares the seeded generator state, so a simulation
// is exactly what the real move would do) and scores the position. Used by the hint button
// (depth 1) and by tools/test.cjs and tools/tune.cjs to prove every level can be won.
import { T, N, W, clone, findMoves, playMove, newGame, jellyLeft, goalsMet } from './core.js';

/** How good is this position for this level's goal? Higher is better. */
export function potential(st) {
  const g = st.level.goal, b = st.board;
  let v = st.score * (g.score ? 1 : 0.3);
  v += (st.L.jellyTotal - jellyLeft(st)) * (g.jelly ? 240 : 60);
  v += st.delivered * 3000;
  if (g.collect) v += st.collected * 140;
  let choc = 0, cage = 0;
  for (let i = 0; i < N; i++) {
    const cd = b[i];
    if (!cd) continue;
    if (cd.t === T.ING) v += ((i / W) | 0) * (g.ing ? 420 : 0);
    else if (cd.t === T.SH || cd.t === T.SV) v += 150;
    else if (cd.t === T.WRAP) v += 230;
    else if (cd.t === T.BOMB) v += 400;
    else if (cd.t === T.CHOC) choc++;
    if (cd.cage) cage++;
  }
  v -= choc * 160 + cage * 40;
  if (st.status === 'won') v += 1e6 + st.score;
  else if (st.status === 'lost') v -= 1e5;
  return v;
}

function simulate(st, a, b, blind) {
  const s = clone(st);
  // A blind player cannot know which candies will drop in, so it judges the move on a
  // different random future; the move it picks is then played on the real one.
  if (blind) s.rs = (st.rs ^ 0x5bd1e995) + a * 131 + b * 7;
  playMove(s, a, b);
  return s;
}

// A person who has only a few jelly squares left stops going for the biggest score and
// works on those squares; this nudges the bot to do the same.
function focus(st, s, a, b) {
  if (!st.level.goal.jelly) return 0;
  const left = [];
  for (let i = 0; i < N; i++) if (s.jelly[i] > 0) left.push(i);
  if (!left.length || left.length > 9) return 0;
  let best = 9;
  for (const j of left) {
    for (const x of [a, b]) {
      const d = Math.max(Math.abs(((j / W) | 0) - ((x / W) | 0)), Math.abs((j % W) - (x % W)));
      if (d < best) best = d;
    }
  }
  return best <= 1 ? 500 : best <= 2 ? 250 : 0;
}

/** Best swap for st. mode 'blind' (a decent human: judges moves on a guessed future) or
 *  'oracle' (knows the real refills; depth 2 also looks one move further for the top `width`).
 *  Returns { a, b, s } where s is the real state after playing the move. */
export function pickMove(st, depth = 1, width = 5, mode = 'oracle') {
  const moves = findMoves(st);
  if (!moves.length) return null;
  const blind = mode === 'blind';
  const scored = moves.map(([a, b]) => { const s = simulate(st, a, b, blind); return { a, b, s, v: potential(s) + focus(st, s, a, b) }; });
  scored.sort((x, y) => y.v - x.v);
  if (blind) { const m = scored[0]; return { a: m.a, b: m.b, s: simulate(st, m.a, m.b, false), v: m.v }; }
  if (depth <= 1 || scored[0].s.status !== 'play') return scored[0];
  let best = null;
  for (const m of scored.slice(0, width)) {
    let v = m.v;
    if (m.s.status === 'play') {
      const next = findMoves(m.s);
      let bv = -Infinity;
      for (const [a, b] of next) bv = Math.max(bv, potential(simulate(m.s, a, b)));
      if (bv > -Infinity) v = m.v * 0.35 + bv;
    }
    if (!best || v > best.value) best = { a: m.a, b: m.b, s: m.s, v: m.v, value: v };
  }
  return best;
}

/** Play a whole level. Returns { won, st, used, turnsToGoal }. */
export function playLevel(level, seed, { depth = 1, width = 5, cap = null, mode = 'oracle' } = {}) {
  let st = newGame(level, seed);
  if (cap) st.moves = cap;
  let turnsToGoal = null;
  while (st.status === 'play') {
    const m = pickMove(st, depth, width, mode);
    if (!m) break;
    st = m.s;
    st.rec = null;
    if (turnsToGoal === null && goalsMet(st)) turnsToGoal = st.movesUsed;
  }
  return { won: st.status === 'won', st, used: st.movesUsed, turnsToGoal: turnsToGoal ?? (st.status === 'won' ? st.movesUsed : null) };
}
