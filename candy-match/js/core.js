// core.js: the pure rules of Candy Match. No DOM, no timers, no Math.random: everything
// that is random comes from the seeded generator stored in the game state, so a game is
// a pure function of (level, seed, moves). The renderer never decides anything; it replays
// the `events` list that playMove() records (set st.rec = [] to record).
//
// Board: 9x9, index i = row * 9 + col, row 0 at the top. A cell is playable (mask) or a
// hole. Every column's playable cells form one contiguous run, so refills always enter at
// the top of the run and ingredients leave at the bottom of it.

export const W = 9, H = 9, N = W * H;
export const T = Object.freeze({ NORMAL: 0, SH: 1, SV: 2, WRAP: 3, BOMB: 4, ING: 5, CHOC: 6 });
// SH = striped candy that clears its ROW, SV = clears its COLUMN. A 4-in-a-row horizontal
// match makes an SV (the stripes run across the match), a vertical one makes an SH.
export const SCORE = { candy: 20, jelly: 50, deliver: 500, choc: 10, maxMult: 8, bonusMove: 250 };

const colAt = cd => (cd !== null && cd.t <= 3 ? cd.c : -1);
export const isSpecial = cd => cd !== null && cd.t >= 1 && cd.t <= 4;

// ------------------------------------------------------------------ layout

const _lay = new WeakMap();
/** Parse level.rows into masks. Legend: . normal  # hole  j jelly  J double jelly
 *  c cage  k cage+jelly  K cage+double jelly  x chocolate  i ingredient (cherry). */
export function layoutOf(level) {
  let L = _lay.get(level);
  if (L) return L;
  const mask = new Uint8Array(N), jelly = new Uint8Array(N), cage = new Uint8Array(N);
  const choc = new Uint8Array(N), ing = new Uint8Array(N);
  const top = new Int8Array(W).fill(-1), bot = new Int8Array(W).fill(-1);
  const cells = [];
  let jellyTotal = 0;
  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const ch = level.rows[r][c], i = r * W + c;
      if (ch === '#') continue;
      mask[i] = 1; cells.push(i);
      if (top[c] < 0) top[c] = r;
      bot[c] = r;
      if (ch === 'j') jelly[i] = 1;
      else if (ch === 'J') jelly[i] = 2;
      else if (ch === 'c') cage[i] = 1;
      else if (ch === 'k') { cage[i] = 1; jelly[i] = 1; }
      else if (ch === 'K') { cage[i] = 1; jelly[i] = 2; }
      else if (ch === 'x') choc[i] = 1;
      else if (ch === 'i') ing[i] = 1;
      jellyTotal += jelly[i];
    }
  }
  L = { mask, jelly, cage, choc, ing, top, bot, cells, jellyTotal, ncol: level.colors || 6 };
  _lay.set(level, L);
  return L;
}

// ------------------------------------------------------------------ rng

export function rnd(st) {
  let t = (st.rs = (st.rs + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rint = (st, n) => Math.floor(rnd(st) * n);

const mk = (st, t, c) => ({ id: st.nextId++, t, c, cage: 0 });

// ------------------------------------------------------------------ new game

export function newGame(level, seed = 1, rec = false) {
  const L = layoutOf(level);
  const st = {
    level, L, rs: ((seed >>> 0) * 2654435761 + 12345) | 0, nextId: 1,
    board: new Array(N).fill(null), jelly: Uint8Array.from(L.jelly),
    moves: level.moves, score: 0, delivered: 0, collected: 0, status: 'play',
    pending: [], chocCleared: false, rec: null, maxMult: 0, movesUsed: 0, bonusMoves: 0,
  };
  for (let attempt = 0; attempt < 500; attempt++) {
    st.board.fill(null);
    for (const i of L.cells) {
      let cd;
      if (L.ing[i]) cd = mk(st, T.ING, 0);
      else if (L.choc[i]) cd = mk(st, T.CHOC, 0);
      else {
        const bad = [];
        const c = i % W, r = (i / W) | 0;
        if (c >= 2 && colAt(st.board[i - 1]) >= 0 && colAt(st.board[i - 1]) === colAt(st.board[i - 2])) bad.push(colAt(st.board[i - 1]));
        if (r >= 2 && colAt(st.board[i - W]) >= 0 && colAt(st.board[i - W]) === colAt(st.board[i - 2 * W])) bad.push(colAt(st.board[i - W]));
        const ok = [];
        for (let k = 0; k < L.ncol; k++) if (!bad.includes(k)) ok.push(k);
        cd = mk(st, T.NORMAL, ok[rint(st, ok.length)]);
        cd.cage = L.cage[i];
      }
      st.board[i] = cd;
    }
    if (findGroups(st).length === 0 && hasMove(st)) break;
  }
  st.rec = rec ? [] : null;
  return st;
}

export function clone(st) {
  return {
    ...st,
    board: st.board.map(c => (c ? { ...c } : null)),
    jelly: st.jelly.slice(),
    pending: st.pending.slice(),
    rec: null,
  };
}

// ------------------------------------------------------------------ goals

export function goalsMet(st) {
  const g = st.level.goal;
  if (g.score && st.score < g.score) return false;
  if (g.jelly && jellyLeft(st) > 0) return false;
  if (g.ing && st.delivered < g.ing) return false;
  if (g.collect && st.collected < g.collect[1]) return false;
  return true;
}
export function jellyLeft(st) { let s = 0; for (let i = 0; i < N; i++) s += st.jelly[i]; return s; }
export function jellyCells(st) { let s = 0; for (let i = 0; i < N; i++) if (st.jelly[i]) s++; return s; }
export function countType(st, t) { let n = 0; for (const cd of st.board) if (cd && cd.t === t) n++; return n; }
export function starsFor(level, st) {
  if (st.status !== 'won') return 0;
  return st.score >= level.stars[2] ? 3 : st.score >= level.stars[1] ? 2 : 1;
}

// ------------------------------------------------------------------ matching

function hasMatchAt(b, i) {
  const col = colAt(b[i]);
  if (col < 0) return false;
  const r = (i / W) | 0, c = i % W;
  let n = 1;
  for (let k = c - 1; k >= 0 && colAt(b[r * W + k]) === col; k--) n++;
  for (let k = c + 1; k < W && colAt(b[r * W + k]) === col; k++) n++;
  if (n >= 3) return true;
  n = 1;
  for (let k = r - 1; k >= 0 && colAt(b[k * W + c]) === col; k--) n++;
  for (let k = r + 1; k < H && colAt(b[k * W + c]) === col; k++) n++;
  return n >= 3;
}

/** Connected groups of overlapping runs of 3+. Each: { cells:Set, runs:[{h,cells}], color }. */
export function findGroups(st) {
  const b = st.board, runs = [];
  for (let r = 0; r < H; r++) {
    let c = 0;
    while (c < W) {
      const col = colAt(b[r * W + c]);
      if (col < 0) { c++; continue; }
      let e = c + 1;
      while (e < W && colAt(b[r * W + e]) === col) e++;
      if (e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push(r * W + k); runs.push({ h: true, cells, col }); }
      c = e;
    }
  }
  for (let c = 0; c < W; c++) {
    let r = 0;
    while (r < H) {
      const col = colAt(b[r * W + c]);
      if (col < 0) { r++; continue; }
      let e = r + 1;
      while (e < H && colAt(b[e * W + c]) === col) e++;
      if (e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push(k * W + c); runs.push({ h: false, cells, col }); }
      r = e;
    }
  }
  if (!runs.length) return [];
  const par = runs.map((_, k) => k);
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const owner = new Int16Array(N).fill(-1);
  runs.forEach((run, k) => {
    for (const i of run.cells) { if (owner[i] < 0) owner[i] = k; else par[find(owner[i])] = find(k); }
  });
  const byRoot = new Map();
  runs.forEach((run, k) => {
    const root = find(k);
    let g = byRoot.get(root);
    if (!g) byRoot.set(root, g = { cells: new Set(), runs: [], color: run.col });
    g.runs.push(run);
    for (const i of run.cells) g.cells.add(i);
  });
  return [...byRoot.values()];
}

function creationFor(st, g, pivots) {
  const b = st.board;
  let maxLen = 0, hasH = false, hasV = false, longRun = null;
  for (const run of g.runs) {
    if (run.cells.length > maxLen) { maxLen = run.cells.length; longRun = run; }
    if (run.h) hasH = true; else hasV = true;
  }
  let t = -1;
  if (maxLen >= 5) t = T.BOMB;
  else if (hasH && hasV) t = T.WRAP;
  else if (maxLen === 4) t = longRun.h ? T.SV : T.SH;
  if (t < 0) return null;
  const ok = i => b[i].t === T.NORMAL && !b[i].cage;
  let pos = -1;
  if (pivots) for (const p of pivots) if (g.cells.has(p) && ok(p)) { pos = p; break; }
  if (pos < 0) {
    let cand;
    if (t === T.WRAP) {
      const cnt = new Map();
      for (const run of g.runs) for (const i of run.cells) cnt.set(i, (cnt.get(i) || 0) + 1);
      for (const [i, n] of cnt) if (n > 1) { cand = i; break; }
    } else cand = longRun.cells[Math.floor((t === T.BOMB ? maxLen : maxLen - 1) / 2)];
    if (cand !== undefined && ok(cand)) pos = cand;
    else for (const i of g.cells) if (ok(i)) { pos = i; break; }
  }
  if (pos < 0) return null;
  return { i: pos, t, c: t === T.BOMB ? 0 : g.color };
}

// ------------------------------------------------------------------ moves

const adj = (a, b) => {
  const d = Math.abs(a - b);
  return (d === W) || (d === 1 && ((a / W) | 0) === ((b / W) | 0));
};
const comboKind = (ca, cb) => {
  if (ca.t === T.BOMB || cb.t === T.BOMB) {
    const o = ca.t === T.BOMB ? cb : ca;
    if (o.t === T.ING || o.t === T.CHOC) return 0;
    return 1;
  }
  return ca.t >= 1 && ca.t <= 3 && cb.t >= 1 && cb.t <= 3 ? 1 : 0;
};

export function isValidSwap(st, a, b) {
  if (a < 0 || b < 0 || a >= N || b >= N || !adj(a, b)) return false;
  const bd = st.board, ca = bd[a], cb = bd[b];
  if (!ca || !cb || !st.L.mask[a] || !st.L.mask[b]) return false;
  if (ca.t === T.CHOC || cb.t === T.CHOC || ca.cage || cb.cage) return false;
  if (comboKind(ca, cb)) return true;
  if (ca.t === T.BOMB || cb.t === T.BOMB) return false;
  bd[a] = cb; bd[b] = ca;
  const ok = hasMatchAt(bd, a) || hasMatchAt(bd, b);
  bd[a] = ca; bd[b] = cb;
  return ok;
}

export function findMoves(st) {
  const out = [];
  for (const i of st.L.cells) {
    const c = i % W;
    if (c < W - 1 && isValidSwap(st, i, i + 1)) out.push([i, i + 1]);
    if (i + W < N && isValidSwap(st, i, i + W)) out.push([i, i + W]);
  }
  return out;
}
export function hasMove(st) {
  for (const i of st.L.cells) {
    const c = i % W;
    if (c < W - 1 && isValidSwap(st, i, i + 1)) return true;
    if (i + W < N && isValidSwap(st, i, i + W)) return true;
  }
  return false;
}

// ------------------------------------------------------------------ geometry helpers

export function blastCells(L, i, rad) {
  const r0 = (i / W) | 0, c0 = i % W, out = [];
  for (let r = Math.max(0, r0 - rad); r <= Math.min(H - 1, r0 + rad); r++)
    for (let c = Math.max(0, c0 - rad); c <= Math.min(W - 1, c0 + rad); c++)
      if (L.mask[r * W + c]) out.push(r * W + c);
  return out;
}
function lineCells(L, r, c, rows, cols) {
  const out = [];
  for (const i of L.cells) {
    const ir = (i / W) | 0, ic = i % W;
    if ((rows && Math.abs(ir - r) <= rows - 1) || (cols && Math.abs(ic - c) <= cols - 1)) out.push(i);
  }
  return out;
}
function mostCommonColor(st) {
  const n = new Array(6).fill(0);
  for (const cd of st.board) if (cd && cd.t <= 3) n[cd.c]++;
  let best = 0;
  for (let k = 1; k < 6; k++) if (n[k] > n[best]) best = k;
  return best;
}

// ------------------------------------------------------------------ the clear step

function clearStep(st, req, mult, deliveries) {
  const b = st.board, L = st.L, goal = st.level.goal;
  const clear = new Map();
  const createdAt = new Map();
  for (const cr of req.created) createdAt.set(cr.i, cr);
  const activated = req.activated;
  const fx = req.fx;
  const cageSet = new Set(), cageBroken = [];
  const q = [];
  let activations = 0, chocHit = 0;

  const hit = i => {
    const cd = b[i];
    if (!cd || cd.t === T.ING || clear.has(i) || createdAt.has(i) || cageSet.has(i)) return;
    if (cd.cage) { cd.cage = 0; cageSet.add(i); cageBroken.push(i); return; }
    clear.set(i, 'clear');
    q.push(i);
  };
  for (const i of req.cells) hit(i);
  for (const i of req.matched) {
    const r = (i / W) | 0, c = i % W;
    if (c > 0 && b[i - 1] && b[i - 1].t === T.CHOC) hit(i - 1);
    if (c < W - 1 && b[i + 1] && b[i + 1].t === T.CHOC) hit(i + 1);
    if (r > 0 && b[i - W] && b[i - W].t === T.CHOC) hit(i - W);
    if (r < H - 1 && b[i + W] && b[i + W].t === T.CHOC) hit(i + W);
  }
  while (q.length) {
    const i = q.shift(), cd = b[i];
    if (activated.has(i) || cd.t < 1 || cd.t > 4) continue;
    activated.add(i);
    activations++;
    const r = (i / W) | 0, c = i % W;
    if (cd.t === T.SH) {
      fx.push({ k: 'row', r, i, c: cd.c });
      for (let k = 0; k < W; k++) if (L.mask[r * W + k]) hit(r * W + k);
    } else if (cd.t === T.SV) {
      fx.push({ k: 'col', c, i, col: cd.c });
      for (let k = 0; k < H; k++) if (L.mask[k * W + c]) hit(k * W + c);
    } else if (cd.t === T.WRAP) {
      fx.push({ k: 'blast', i, rad: 1, col: cd.c });
      for (const j of blastCells(L, i, 1)) hit(j);
      st.pending.push({ i, rad: 1 });
    } else {
      const color = mostCommonColor(st), cells = [];
      for (let j = 0; j < N; j++) if (colAt(b[j]) === color) { cells.push(j); hit(j); }
      fx.push({ k: 'zap', i, color, cells });
    }
  }
  for (const i of deliveries) clear.set(i, 'deliver');

  // score + goals + jelly, then actually remove
  const m = Math.min(mult, SCORE.maxMult);
  let pts = req.bonus || 0;
  const cleared = [], jellyHits = [];
  const rec = st.rec;
  for (const [i, kind] of clear) {
    const cd = b[i];
    if (kind === 'deliver') { st.delivered++; pts += SCORE.deliver; }
    else if (cd.t === T.CHOC) { pts += SCORE.choc * m; chocHit++; }
    else {
      pts += SCORE.candy * m;
      if (cd.t <= 3 && goal.collect && cd.c === goal.collect[0]) st.collected++;
    }
    if (rec) cleared.push({ i, id: cd.id, t: cd.t, c: cd.c, kind: kind === 'deliver' ? 'deliver' : cd.t === T.CHOC ? 'choc' : 'candy' });
    b[i] = null;
  }
  const jellyCheck = [...clear.keys(), ...createdAt.keys()];
  for (const i of jellyCheck) {
    if (st.jelly[i] > 0 && (clear.get(i) !== 'deliver')) {
      st.jelly[i]--; pts += SCORE.jelly;
      if (rec) jellyHits.push({ i, left: st.jelly[i] });
    }
  }
  for (const cr of req.created) {
    const cd = b[cr.i];
    cd.t = cr.t; cd.c = cr.c;
  }
  if (chocHit) st.chocCleared = true;
  st.score += pts;
  if (mult > st.maxMult) st.maxMult = mult;
  if (rec) {
    rec.push({
      t: 'clear', mult, pts, score: st.score, cleared, fx,
      created: req.created.map(cr => ({ ...cr, id: b[cr.i].id })),
      jelly: jellyHits, cage: cageBroken, activations,
      collected: st.collected, delivered: st.delivered,
    });
  }
}

function deliveriesOf(st) {
  const out = [];
  if (!st.level.goal.ing && !countType(st, T.ING)) return out;
  for (let c = 0; c < W; c++) {
    if (st.L.bot[c] < 0) continue;
    const i = st.L.bot[c] * W + c;
    if (st.board[i] && st.board[i].t === T.ING) out.push(i);
  }
  return out;
}

// Would putting colour `col` on cell i complete a line of three with the candies already there?
function makesMatch(b, i, col) {
  const c = i % W, r = (i / W) | 0;
  const at = j => colAt(b[j]);
  if (c >= 2 && at(i - 1) === col && at(i - 2) === col) return true;
  if (c >= 1 && c < W - 1 && at(i - 1) === col && at(i + 1) === col) return true;
  if (c < W - 2 && at(i + 1) === col && at(i + 2) === col) return true;
  if (r < H - 2 && at(i + W) === col && at(i + 2 * W) === col) return true;
  if (r >= 1 && r < H - 1 && at(i - W) === col && at(i + W) === col) return true;
  return false;
}
const SPAWN_AVOID = 0.95; // how often a refill candy dodges completing a line (keeps cascades fun, not endless)

function gravity(st) {
  const b = st.board, L = st.L, goal = st.level.goal, rec = st.rec;
  const mv = rec ? [] : null, sp = rec ? [] : null;
  let ingOn = 0;
  if (goal.ing) for (let i = 0; i < N; i++) if (b[i] && b[i].t === T.ING) ingOn++;
  const ingMax = st.level.ingMax || 2;
  const gap = new Int8Array(W);
  for (let c = 0; c < W; c++) {
    const r0 = L.top[c], r1 = L.bot[c];
    if (r0 < 0) { gap[c] = -1; continue; }
    let w = r1;
    for (let r = r1; r >= r0; r--) {
      const i = r * W + c, cd = b[i];
      if (cd) {
        if (r !== w) { const j = w * W + c; b[j] = cd; b[i] = null; if (mv) mv.push({ id: cd.id, from: i, to: j }); }
        w--;
      }
    }
    gap[c] = w;
  }
  for (let c = 0; c < W; c++) {
    const r0 = L.top[c], w = gap[c];
    if (w < r0) continue;
    const n = w - r0 + 1;
    for (let r = w; r >= r0; r--) {
      const i = r * W + c;
      let cd;
      if (goal.ing && st.delivered + ingOn < goal.ing && ingOn < ingMax && rnd(st) < 0.16) { cd = mk(st, T.ING, 0); ingOn++; }
      else {
        let col = rint(st, L.ncol);
        if (rnd(st) < SPAWN_AVOID) for (let k = 0; k < 6 && makesMatch(b, i, col); k++) col = rint(st, L.ncol);
        cd = mk(st, T.NORMAL, col);
      }
      b[i] = cd;
      if (sp) sp.push({ id: cd.id, t: cd.t, c: cd.c, to: i, fromRow: r - n });
    }
  }
  if (rec) rec.push({ t: 'fall', moves: mv, spawned: sp });
}

/** Run matches/cascades until the board is quiet. `first` is an optional forced clear request. */
function resolve(st, first, pivots) {
  let mult = 0, req = first;
  for (let guard = 0; guard < 80; guard++) {
    const groups = findGroups(st);
    const created = [], matched = [];
    for (const g of groups) {
      const cr = creationFor(st, g, mult === 0 ? pivots : null);
      if (cr) created.push(cr);
      for (const i of g.cells) matched.push(i);
    }
    const del = deliveriesOf(st);
    if (!req && !groups.length && !st.pending.length && !del.length) break;
    mult++;
    const r = { cells: [], matched, created, activated: new Set(), fx: [], bonus: 0 };
    if (req) {
      r.cells.push(...req.cells);
      for (const i of req.activated || []) r.activated.add(i);
      if (req.fx) r.fx.push(...req.fx);
      r.bonus = req.bonus || 0;
      if (req.transform && st.rec) st.rec.push({ t: 'transform', items: req.transform });
    }
    for (const p of st.pending) {
      r.cells.push(...blastCells(st.L, p.i, p.rad));
      r.fx.push({ k: 'blast', i: p.i, rad: p.rad, second: true });
    }
    st.pending = req && req.later ? req.later.slice() : [];
    for (const g of groups) for (const i of g.cells) r.cells.push(i);
    clearStep(st, r, mult, del);
    gravity(st);
    req = null;
  }
}

// ------------------------------------------------------------------ special combos

function comboReq(st, ca, cb, a, b) {
  // after the swap: ca sits at b (the cell the player dragged to), cb sits at a
  const L = st.L, bd = st.board;
  const req = { cells: [], activated: new Set([a, b]), fx: [], bonus: 0 };
  const t1 = ca.t, t2 = cb.t;
  if (t1 === T.BOMB && t2 === T.BOMB) {
    for (const i of L.cells) if (bd[i] && bd[i].t !== T.ING) req.cells.push(i);
    req.fx.push({ k: 'all', i: b });
    req.bonus = 2000;
    return req;
  }
  if (t1 === T.BOMB || t2 === T.BOMB) {
    const bombAt = t1 === T.BOMB ? b : a, other = t1 === T.BOMB ? cb : ca;
    const color = other.c;
    const cells = [bombAt];
    let transform = null;
    if (other.t !== T.NORMAL) {
      transform = [];
      let k = 0;
      for (let i = 0; i < N; i++) {
        const cd = bd[i];
        if (cd && cd.t === T.NORMAL && cd.c === color && !cd.cage) {
          cd.t = other.t === T.WRAP ? T.WRAP : (k++ % 2 ? T.SH : T.SV);
          transform.push({ i, id: cd.id, t: cd.t, c: cd.c });
        }
      }
      req.activated = new Set([bombAt]);
      req.bonus = 600;
    } else req.bonus = 200;
    for (let i = 0; i < N; i++) if (bd[i] && colAt(bd[i]) === color && !(transform === null && i === bombAt)) cells.push(i);
    req.cells = cells;
    req.transform = transform;
    req.fx.push({ k: 'zap', i: bombAt, color, cells: cells.slice(1) });
    return req;
  }
  const r = (b / W) | 0, c = b % W;
  const striped = x => x === T.SH || x === T.SV;
  if (striped(t1) && striped(t2)) {
    req.cells = lineCells(L, r, c, 1, 1);
    req.fx.push({ k: 'row', r, i: b, c: ca.c }, { k: 'col', c, i: b, col: cb.c });
    req.bonus = 300;
  } else if (t1 === T.WRAP && t2 === T.WRAP) {
    req.cells = blastCells(L, b, 2);
    req.fx.push({ k: 'blast', i: b, rad: 2, col: ca.c });
    req.later = [{ i: b, rad: 2 }];
    req.bonus = 400;
  } else {
    req.cells = lineCells(L, r, c, 2, 2);
    req.fx.push({ k: 'rows', r, n: 3, i: b }, { k: 'cols', c, n: 3, i: b });
    req.bonus = 500;
  }
  return req;
}

// ------------------------------------------------------------------ shuffle

function shuffleBoard(st) {
  const b = st.board, L = st.L, rec = st.rec;
  const slots = [];
  for (const i of L.cells) { const cd = b[i]; if (cd && cd.t !== T.ING && cd.t !== T.CHOC && !cd.cage) slots.push(i); }
  const before = rec ? slots.map(i => ({ id: b[i].id, from: i })) : null;
  const items = slots.map(i => b[i]);
  const place = () => { slots.forEach((i, k) => { b[i] = items[k]; }); };
  let done = false;
  for (let attempt = 0; attempt < 400 && !done; attempt++) {
    for (let k = items.length - 1; k > 0; k--) { const j = rint(st, k + 1), t = items[k]; items[k] = items[j]; items[j] = t; }
    place();
    done = findGroups(st).length === 0 && hasMove(st);
  }
  for (let attempt = 0; attempt < 400 && !done; attempt++) {
    // fallback: repaint plain candies with fresh colours
    for (const cd of items) if (cd.t === T.NORMAL) cd.c = rint(st, L.ncol);
    place();
    done = findGroups(st).length === 0 && hasMove(st);
  }
  if (rec) {
    const pos = new Map();
    slots.forEach(i => pos.set(b[i].id, i));
    rec.push({ t: 'shuffle', moves: before.map(x => ({ id: x.id, from: x.from, to: pos.get(x.id) })), ok: done });
  }
  return done;
}
export function ensureMove(st) {
  if (!hasMove(st)) shuffleBoard(st);
}

// ------------------------------------------------------------------ chocolate

function spreadChocolate(st) {
  const b = st.board;
  if (st.chocCleared) return;
  const cand = [];
  for (let i = 0; i < N; i++) {
    const cd = b[i];
    if (!cd || cd.t !== T.CHOC) continue;
    const r = (i / W) | 0, c = i % W;
    const ns = [];
    if (c > 0) ns.push(i - 1);
    if (c < W - 1) ns.push(i + 1);
    if (r > 0) ns.push(i - W);
    if (r < H - 1) ns.push(i + W);
    for (const n of ns) if (b[n] && b[n].t <= 3 && !b[n].cage && !cand.includes(n)) cand.push(n);
  }
  if (!cand.length) return;
  const i = cand[rint(st, cand.length)];
  b[i].t = T.CHOC; b[i].c = 0;
  if (st.rec) st.rec.push({ t: 'spread', i, id: b[i].id });
}

// ------------------------------------------------------------------ end of a turn / bonus

function runBonus(st) {
  const b = st.board, L = st.L;
  const left = Math.min(st.moves, 14);
  st.bonusMoves = st.moves;
  if (left <= 0) return;
  if (st.rec) st.rec.push({ t: 'bonusStart', left: st.moves });
  const picks = [];
  const pool = [];
  for (const i of L.cells) { const cd = b[i]; if (cd && cd.t === T.NORMAL && !cd.cage) pool.push(i); }
  for (let k = 0; k < left && pool.length; k++) {
    const j = rint(st, pool.length), i = pool.splice(j, 1)[0];
    const cd = b[i];
    cd.t = k % 3 === 2 ? T.WRAP : (rint(st, 2) ? T.SH : T.SV);
    picks.push({ i, id: cd.id, t: cd.t, c: cd.c });
  }
  st.score += SCORE.bonusMove * st.moves;
  if (st.rec) st.rec.push({ t: 'bonusPick', items: picks, pts: SCORE.bonusMove * st.moves, score: st.score });
  st.moves = 0;
  for (const p of picks) {
    let at = -1;
    for (let i = 0; i < N; i++) if (b[i] && b[i].id === p.id) { at = i; break; }
    if (at < 0 || b[at].t === T.NORMAL) continue;
    resolve(st, { cells: [at], activated: new Set(), fx: [] }, null);
  }
  // sweep anything left over so that no special survives the end of the level
  for (let guard = 0; guard < 6; guard++) {
    let any = -1;
    for (let i = 0; i < N; i++) if (b[i] && b[i].t >= 1 && b[i].t <= 4) { any = i; break; }
    if (any < 0) break;
    resolve(st, { cells: [any], activated: new Set(), fx: [] }, null);
  }
}

function endTurn(st, fromMove) {
  if (fromMove) spreadChocolate(st);
  if (goalsMet(st)) { st.status = 'won'; runBonus(st); }
  else if (st.moves <= 0) st.status = 'lost';
  else ensureMove(st);
  if (st.rec) st.rec.push({ t: 'end', status: st.status });
}

// ------------------------------------------------------------------ public actions

/** Try to swap cell a with neighbour b. Returns { ok, events }. Mutates st when ok. */
export function playMove(st, a, b) {
  if (st.status !== 'play' || st.moves <= 0) return { ok: false, events: [] };
  const rec = st.rec;
  if (rec) rec.length = 0;
  if (!isValidSwap(st, a, b)) return { ok: false, events: rec ? [{ t: 'bounce', a, b, ida: st.board[a] && st.board[a].id, idb: st.board[b] && st.board[b].id }] : [] };
  const bd = st.board, ca = bd[a], cb = bd[b];
  if (rec) rec.push({ t: 'swap', a, b, ida: ca.id, idb: cb.id });
  bd[a] = cb; bd[b] = ca;
  st.moves--; st.movesUsed++; st.chocCleared = false;
  if (comboKind(ca, cb)) resolve(st, comboReq(st, ca, cb, a, b), null);
  else resolve(st, null, [b, a]);
  endTurn(st, true);
  return { ok: true, events: rec || [] };
}

/** Hammer: smash one cell (breaks a cage, or clears a candy / chocolate). Costs no move. */
export function useHammer(st, i) {
  if (st.status !== 'play') return { ok: false, events: [] };
  const cd = st.board[i];
  if (!cd || cd.t === T.ING) return { ok: false, events: [] };
  if (st.rec) st.rec.length = 0;
  if (st.rec) st.rec.push({ t: 'hammer', i, id: cd.id });
  resolve(st, { cells: [i], activated: new Set(), fx: [] }, null);
  endTurn(st, false);
  return { ok: true, events: st.rec || [] };
}

/** Shuffle booster: reshuffle the whole board, costs no move. */
export function useShuffle(st) {
  if (st.status !== 'play') return { ok: false, events: [] };
  if (st.rec) st.rec.length = 0;
  shuffleBoard(st);
  return { ok: true, events: st.rec || [] };
}
