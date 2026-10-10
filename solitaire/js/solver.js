/*
 * Offline Klondike solver, used to build js/deals.js (the list behind
 * "Winnable deals only"). It is not loaded by the page.
 *
 *   node js/solver.js 1000 1 > /tmp/d1.json   # 1000 winnable Draw 1 deals
 *   node js/solver.js 1000 3 > /tmp/d3.json   # 1000 winnable Draw 3 deals
 *
 * Depth-first search with a transposition table. Safe foundation moves are
 * played automatically; the stock is treated as a cycle so "draw n times then
 * play the waste card" is a single move. The search is deliberately pruned
 * (it skips some pointless shuffles), so "not solved" means "unknown", never
 * "impossible". Every solution it reports is replayed through rules.js and
 * only deals that verifiably reach a win are emitted.
 */
'use strict';

const R = require('./rules.js');

const rank = (c) => (c % 13) + 1;
const suit = (c) => (c / 13) | 0;
const red = (c) => { const s = (c / 13) | 0; return s === 1 || s === 2; };

function solve(seed, draw, maxNodes) {
  const g = new R.Klondike({ seed, draw });
  const t = g.t.map((c) => c.slice());
  const down = g.down.slice();
  const f = [0, 0, 0, 0];
  let s = g.s.slice();
  let w = [];
  const path = [];       // solver moves, in order
  const seen = new Set();
  let nodes = 0;

  const canTab = (card, c) => {
    const col = t[c];
    if (!col.length) return rank(card) === 13;
    const top = col[col.length - 1];
    return red(top) !== red(card) && rank(card) === rank(top) - 1;
  };
  const canFound = (card) => f[suit(card)] === rank(card) - 1;
  const safe = (card) => {
    const r = rank(card);
    if (!canFound(card)) return false;
    if (r <= 2) return true;
    const rd = red(card);
    for (let k = 0; k < 4; k++) {
      const kr = k === 1 || k === 2;
      if (kr !== rd && f[k] < r - 1) return false;
    }
    return true;
  };
  const won = () => f[0] === 13 && f[1] === 13 && f[2] === 13 && f[3] === 13;

  function key() {
    const cols = [];
    for (let c = 0; c < 7; c++) {
      let k = String.fromCharCode(65 + down[c]);
      for (const x of t[c]) k += String.fromCharCode(48 + x);
      cols.push(k);
    }
    cols.sort();
    let k = f.join('.') + '|' + cols.join(',') + '|';
    for (const x of w) k += String.fromCharCode(48 + x);
    k += '|';
    for (const x of s) k += String.fromCharCode(48 + x);
    return k;
  }

  // ---- primitive moves with undo records
  function fromTab(c, idx) {
    const col = t[c];
    const cards = col.splice(idx);
    let flipped = false;
    if (col.length && down[c] >= col.length) { down[c] = col.length - 1; flipped = true; }
    if (!col.length) down[c] = 0;
    return { cards, flipped };
  }
  function undoFromTab(c, rec, prevDown) {
    t[c].push(...rec.cards);
    down[c] = prevDown;
  }

  /** Waste cards reachable by drawing: [{n, s, w}] with a distinct top each. */
  function stockOptions() {
    const out = [];
    if (w.length) out.push({ n: 0, s, w });
    const total = s.length + w.length;
    if (!total) return out;
    let ss = s.slice(), ww = w.slice();
    const tops = new Set();
    if (w.length) tops.add(w[w.length - 1]);
    const limit = 2 * Math.ceil(total / draw) + 4;
    for (let n = 1; n <= limit; n++) {
      if (ss.length) {
        const k = Math.min(draw, ss.length);
        for (let i = 0; i < k; i++) ww.push(ss.pop());
      } else if (ww.length) {
        ss = ww.reverse(); ww = [];
      }
      if (ww.length) {
        const top = ww[ww.length - 1];
        if (!tops.has(top)) { tops.add(top); out.push({ n, s: ss.slice(), w: ww.slice() }); }
      }
    }
    return out;
  }

  function kingWaiting() {
    for (let c = 0; c < 7; c++) {
      for (let i = Math.max(1, down[c]); i < t[c].length; i++) if (rank(t[c][i]) === 13) return true;
    }
    for (const x of s) if (rank(x) === 13) return true;
    for (const x of w) if (rank(x) === 13) return true;
    return false;
  }

  function genMoves() {
    const moves = [];
    // tableau to foundation
    for (let c = 0; c < 7; c++) {
      const col = t[c];
      if (!col.length) continue;
      const top = col[col.length - 1];
      if (canFound(top)) moves.push({ k: 'tf', c, pri: 100 + (col.length - 1 === down[c] ? 20 : 0) });
    }
    // tableau to tableau
    const kw = kingWaiting();
    for (let c = 0; c < 7; c++) {
      const col = t[c];
      for (let i = down[c]; i < col.length; i++) {
        const lead = col[i];
        let emptyDone = false;
        for (let d = 0; d < 7; d++) {
          if (d === c || !canTab(lead, d)) continue;
          const empty = !t[d].length;
          if (empty) { if (emptyDone) continue; emptyDone = true; }
          if (i === down[c] && i > 0) moves.push({ k: 'tt', c, i, d, pri: 80 + down[c] - (empty ? 5 : 0) });
          else if (i === 0) { if (!empty && kw) moves.push({ k: 'tt', c, i, d, pri: 30 }); }
          else if (canFound(col[i - 1])) moves.push({ k: 'tt', c, i, d, pri: 70 });
        }
      }
    }
    // stock/waste plays
    for (const o of stockOptions()) {
      const top = o.w[o.w.length - 1];
      if (canFound(top)) moves.push({ k: 'wf', o, pri: 60 - Math.min(o.n, 30) * 0.2 });
      let emptyDone = false;
      for (let d = 0; d < 7; d++) {
        if (!canTab(top, d)) continue;
        if (!t[d].length) { if (emptyDone) continue; emptyDone = true; }
        moves.push({ k: 'wt', o, d, pri: 50 - Math.min(o.n, 30) * 0.2 + (t[d].length ? 1 : 0) });
      }
    }
    moves.sort((a, b) => b.pri - a.pri);
    return moves;
  }

  // Apply a move; returns an undo closure.
  function apply(m) {
    if (m.k === 'tf') {
      const pd = down[m.c];
      const rec = fromTab(m.c, t[m.c].length - 1);
      f[suit(rec.cards[0])]++;
      return () => { f[suit(rec.cards[0])]--; undoFromTab(m.c, rec, pd); };
    }
    if (m.k === 'tt') {
      const pd = down[m.c];
      const rec = fromTab(m.c, m.i);
      t[m.d].push(...rec.cards);
      return () => { t[m.d].length -= rec.cards.length; undoFromTab(m.c, rec, pd); };
    }
    // waste moves: jump the stock to the option, then play the top
    const ps = s, pw = w;
    s = m.o.s.slice(); w = m.o.w.slice();
    const card = w.pop();
    if (m.k === 'wf') f[suit(card)]++;
    else t[m.d].push(card);
    return () => {
      if (m.k === 'wf') f[suit(card)]--;
      else t[m.d].pop();
      s = ps; w = pw;
    };
  }

  function autoSafe() {
    const undos = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (let c = 0; c < 7; c++) {
        const col = t[c];
        if (col.length && safe(col[col.length - 1])) {
          const m = { k: 'tf', c };
          undos.push(apply(m)); path.push(m);
          changed = true;
        }
      }
      if (w.length && safe(w[w.length - 1])) {
        const m = { k: 'wf', o: { n: 0, s, w } };
        undos.push(apply(m)); path.push(m);
        changed = true;
      }
    }
    return undos;
  }

  function dfs() {
    if (++nodes > maxNodes) throw new Error('budget');
    const undos = autoSafe();
    if (won()) return true;
    const k = key();
    if (!seen.has(k)) {
      seen.add(k);
      for (const m of genMoves()) {
        const u = apply(m);
        path.push(m);
        if (dfs()) return true;
        path.pop();
        u();
      }
    }
    for (let i = undos.length - 1; i >= 0; i--) { undos[i](); path.pop(); }
    return false;
  }

  let ok = false;
  try { ok = dfs(); } catch (e) { if (e.message !== 'budget') throw e; ok = false; }
  if (!ok) return { solved: false, nodes };
  return { solved: true, nodes, actions: toActions(path) };

  // Convert solver moves into rules.js actions (draws + moves).
  function toActions(moves) {
    const out = [];
    const sim = new R.Klondike({ seed, draw });
    const fOf = (card) => 'f' + suit(card);
    for (const m of moves) {
      if (m.k === 'tf') {
        const c = m.c, col = sim.t[c];
        out.push({ type: 'move', from: 't' + c, index: col.length - 1, to: fOf(col[col.length - 1]) });
      } else if (m.k === 'tt') {
        out.push({ type: 'move', from: 't' + m.c, index: m.i, to: 't' + m.d });
      } else {
        for (let i = 0; i < m.o.n; i++) out.push({ type: 'draw' });
        // apply draws to know the card for the foundation name
        for (let i = 0; i < m.o.n; i++) sim.drawCards();
        const card = sim.w[sim.w.length - 1];
        out.push({ type: 'move', from: 'w', index: sim.w.length - 1, to: m.k === 'wf' ? fOf(card) : 't' + m.d });
        sim.apply(out[out.length - 1]);
        continue;
      }
      sim.apply(out[out.length - 1]);
    }
    return out;
  }
}

/** Replay actions through rules.js; true only if every step is legal and the game ends won. */
function verify(seed, draw, actions) {
  const g = new R.Klondike({ seed, draw });
  for (const a of actions) {
    const r = a.type === 'draw' ? g.drawCards() : g.move(a.from, a.index, a.to);
    if (!r) return false;
  }
  return g.isWon();
}

if (typeof module === 'object' && module.exports) module.exports = { solve, verify };

if (require.main === module) {
  const count = parseInt(process.argv[2] || '100', 10);
  const draw = process.argv[3] === '3' ? 3 : 1;
  const budget = parseInt(process.argv[4] || '200000', 10);
  const start = parseInt(process.argv[5] || '1', 10);
  const rnd = R.mulberry32(start * 7919 + draw);
  const found = [];
  let tried = 0, failedVerify = 0;
  const t0 = Date.now();
  while (found.length < count) {
    const seed = (Math.floor(rnd() * 4294967295) >>> 0) || 1;
    tried++;
    const res = solve(seed, draw, budget);
    if (res.solved) {
      if (verify(seed, draw, res.actions)) found.push(seed);
      else failedVerify++;
    }
    if (tried % 50 === 0) process.stderr.write(`tried ${tried}, solved ${found.length}, bad ${failedVerify}, ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  }
  process.stderr.write(`done: ${found.length} of ${tried} solved, ${failedVerify} failed verification, ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
  process.stdout.write(JSON.stringify(found) + '\n');
}
