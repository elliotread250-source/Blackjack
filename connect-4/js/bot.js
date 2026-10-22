/* Connect 4 bot. A bitboard engine shared by every level:
 *
 *   Easy        mostly random; takes an immediate win or block some of the time.
 *   Medium      depth-4 minimax with a simple eval, random among near-best moves.
 *   Hard        depth-8 alpha-beta with the full eval (centre weighting, threat
 *               counting with odd/even row parity).
 *   Impossible  negamax with alpha-beta, a transposition table, move ordering,
 *               "never hand over an immediate win" pruning and iterative
 *               deepening against a ~1 s clock. Once the remaining moves fit in
 *               the search it is an exact solver (most games from around the
 *               middle), before that it searches as deep as the clock allows.
 *
 * The board is the classic 7 bits per column layout (6 cells plus a sentinel)
 * split across two 32-bit ints, since JS bit operations are 32-bit:
 * columns 0-3 live in the low int (28 bits), columns 4-6 in the high one
 * (21 bits). Shifts across the split are stitched together by hand.
 *
 * Runs in a Web Worker in the page (js/worker.js) and directly in Node for
 * the tests. No dependencies. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.C4Bot = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var M28 = 0x0FFFFFFF, M21 = 0x1FFFFF;
  var BOTTOM_L = 1 | (1 << 7) | (1 << 14) | (1 << 21);
  var BOTTOM_H = 1 | (1 << 7) | (1 << 14);
  var BOARD_L = 0x3F * BOTTOM_L;
  var BOARD_H = 0x3F * BOTTOM_H;
  // rows 0, 2, 4 (the 1st, 3rd and 5th rows: "odd" threats, good for the first player)
  var ODD_L = 0x15 * BOTTOM_L, ODD_H = 0x15 * BOTTOM_H;
  // rows 1, 3, 5 ("even" threats, good for the second player)
  var EVEN_L = 0x2A * BOTTOM_L, EVEN_H = 0x2A * BOTTOM_H;
  var COL_L = [], COL_H = [];
  for (var c0 = 0; c0 < 7; c0++) {
    COL_L.push(c0 < 4 ? 0x3F << (7 * c0) : 0);
    COL_H.push(c0 < 4 ? 0 : 0x3F << (7 * (c0 - 4)));
  }
  var C3 = COL_L[3], C2 = COL_L[2], C1 = COL_L[1], C4 = COL_H[4], C5 = COL_H[5];
  var CENTER_ORDER = [3, 2, 4, 1, 5, 0, 6];
  var WIN = 100000;          // a win when the winning disc is the n-th on the board scores WIN - n
  var INF = 1 << 30;
  var LEVELS = ['easy', 'medium', 'hard', 'impossible'];

  function now() { return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now(); }

  function pop(x) {
    x = x - ((x >>> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
    return Math.imul((x + (x >>> 4)) & 0x0F0F0F0F, 0x01010101) >>> 24;
  }
  // 49-bit shifts on (lo, hi) pairs
  function shlL(l, s) { return (l << s) & M28; }
  function shlH(l, h, s) { return ((h << s) | (l >>> (28 - s))) & M21; }
  function shrL(l, h, s) { return ((l >>> s) | (h << (28 - s))) & M28; }
  function shrH(h, s) { return h >>> s; }

  /** Empty cells that would complete four for the stones (pl, ph). Result in WL/WH. */
  var WL = 0, WH = 0;
  function winPos(pl, ph, ml, mh) {
    var rl = shlL(pl, 1) & shlL(pl, 2) & shlL(pl, 3);
    var rh = shlH(pl, ph, 1) & shlH(pl, ph, 2) & shlH(pl, ph, 3);
    var tl, th, s;
    for (var k = 0; k < 3; k++) {
      s = k === 0 ? 7 : k === 1 ? 6 : 8;
      tl = shlL(pl, s) & shlL(pl, 2 * s); th = shlH(pl, ph, s) & shlH(pl, ph, 2 * s);
      rl |= tl & shlL(pl, 3 * s); rh |= th & shlH(pl, ph, 3 * s);
      rl |= tl & shrL(pl, ph, s); rh |= th & shrH(ph, s);
      tl = shrL(pl, ph, s) & shrL(pl, ph, 2 * s); th = shrH(ph, s) & shrH(ph, 2 * s);
      rl |= tl & shlL(pl, s); rh |= th & shlH(pl, ph, s);
      rl |= tl & shrL(pl, ph, 3 * s); rh |= th & shrH(ph, 3 * s);
    }
    WL = rl & (BOARD_L ^ ml);
    WH = rh & (BOARD_H ^ mh);
  }

  /** Four in a row anywhere in (pl, ph)? */
  function aligned(pl, ph) {
    var dirs = [1, 6, 7, 8];
    for (var k = 0; k < 4; k++) {
      var s = dirs[k];
      var ml = pl & shrL(pl, ph, s), mh = ph & shrH(ph, s);
      if ((ml & shrL(ml, mh, 2 * s)) | (mh & shrH(mh, 2 * s))) return true;
    }
    return false;
  }

  // ------------------------------------------------------------- position

  /** Bitboards for a move list. cur = stones of the player to move. Returns
   * null if a move is illegal or the game is already won. */
  function fromMoves(moves) {
    var cl = 0, ch = 0, ml = 0, mh = 0;
    for (var i = 0; i < moves.length; i++) {
      var c = moves[i];
      if (!(c >= 0 && c < 7) || c !== (c | 0)) return null;
      var bl = ((ml + BOTTOM_L) & COL_L[c]) & BOARD_L;
      var bh = ((mh + BOTTOM_H) & COL_H[c]) & BOARD_H;
      if (!(bl | bh)) return null;
      // the mover's stones after the move
      var pl = cl | bl, ph = ch | bh;
      if (aligned(pl, ph)) return i === moves.length - 1 ? { won: true } : null;
      cl ^= ml; ch ^= mh;           // switch to the other player
      ml |= bl; mh |= bh;
    }
    return { cl: cl, ch: ch, ml: ml, mh: mh, moves: moves.length };
  }

  function moveBits(ml, mh, c) {
    return [((ml + BOTTOM_L) & COL_L[c]) & BOARD_L, ((mh + BOTTOM_H) & COL_H[c]) & BOARD_H];
  }

  // ------------------------------------------------------- transposition table

  var TT_BITS = 20, TT_SIZE = 1 << TT_BITS;
  var ttKL = null, ttKH, ttV, ttD, ttF, ttM;
  var EXACT = 0, LOWER = 1, UPPER = 2;
  function ttInit() {
    if (!ttKL) {
      ttKL = new Int32Array(TT_SIZE); ttKH = new Int32Array(TT_SIZE); ttV = new Int32Array(TT_SIZE);
      ttD = new Int8Array(TT_SIZE); ttF = new Int8Array(TT_SIZE); ttM = new Int8Array(TT_SIZE);
    }
    ttKH.fill(-1);
  }
  function slotOf(kl, kh) { return Math.imul(kl ^ Math.imul(kh + 0x2C1B3C6D, 0x297A2D39), 0x9E3779B1) >>> (32 - TT_BITS); }

  // ----------------------------------------------------------------- search

  var nodes = 0, deadline = Infinity, aborted = false, evalKind = 2;
  var orderCol = new Int8Array(43 * 7), orderScore = new Int32Array(43 * 7);

  function evaluate(cl, ch, ml, mh, moves, owl, owh) {
    winPos(cl, ch, ml, mh);
    var mwl = WL, mwh = WH;
    var ol = cl ^ ml, oh = ch ^ mh;
    var s = 0;
    // centre weighting
    s += 4 * (pop(cl & C3) - pop(ol & C3));
    s += 2 * (pop(cl & C2) + pop(ch & C4) - pop(ol & C2) - pop(oh & C4));
    s += pop(cl & C1) + pop(ch & C5) - pop(ol & C1) - pop(oh & C5);
    // threats: empty cells that would complete a four
    s += 12 * (pop(mwl) + pop(mwh) - pop(owl) - pop(owh));
    if (evalKind >= 2) {
      // odd threats favour the first player, even ones the second
      var meFirst = (moves & 1) === 0;
      var mpl = meFirst ? ODD_L : EVEN_L, mph = meFirst ? ODD_H : EVEN_H;
      var opl = meFirst ? EVEN_L : ODD_L, oph = meFirst ? EVEN_H : ODD_H;
      s += 10 * (pop(mwl & mpl) + pop(mwh & mph) - pop(owl & opl) - pop(owh & oph));
      // two threats stacked on top of each other win outright once reached
      s += 30 * (pop(mwl & shlL(mwl, 1)) + pop(mwh & shlH(mwl, mwh, 1)));
      s -= 30 * (pop(owl & shlL(owl, 1)) + pop(owh & shlH(owl, owh, 1)));
    }
    return s;
  }

  function negamax(cl, ch, ml, mh, moves, depth, alpha, beta) {
    if ((++nodes & 2047) === 0 && now() > deadline) aborted = true;
    if (aborted) return 0;
    var pl = (ml + BOTTOM_L) & BOARD_L, ph = (mh + BOTTOM_H) & BOARD_H;
    winPos(cl, ch, ml, mh);
    if ((WL & pl) | (WH & ph)) return WIN - moves - 1;
    winPos(cl ^ ml, ch ^ mh, ml, mh);
    var owl = WL, owh = WH;
    var fl = pl & owl, fh = ph & owh;
    if (fl | fh) {
      if (pop(fl) + pop(fh) > 1) return -(WIN - moves - 2);
      pl = fl; ph = fh;
    }
    pl &= ~shrL(owl, owh, 1); ph &= ~shrH(owh, 1);
    if (!(pl | ph)) return -(WIN - moves - 2);
    if (moves >= 40) return 0;
    var rem = 42 - moves;
    if (depth > rem) depth = rem;
    if (depth <= 0) return evaluate(cl, ch, ml, mh, moves, owl, owh);

    var hi = WIN - moves - 3;
    if (beta > hi) { beta = hi; if (alpha >= beta) return beta; }
    var lo = -(WIN - moves - 4);
    if (alpha < lo) { alpha = lo; if (alpha >= beta) return alpha; }

    var kl = cl + ml, kh = ch + mh;
    var slot = slotOf(kl, kh), ttMove = -1;
    if (ttKL[slot] === kl && ttKH[slot] === kh) {
      ttMove = ttM[slot];
      if (ttD[slot] >= depth) {
        var tv = ttV[slot], tf = ttF[slot];
        if (tf === EXACT) return tv;
        if (tf === LOWER) { if (tv > alpha) alpha = tv; }
        else if (tv < beta) beta = tv;
        if (alpha >= beta) return tv;
      }
    }

    // order: TT move, then by how many new threats the move makes, centre first on ties
    var base = moves * 7, n = 0;
    for (var i = 0; i < 7; i++) {
      var c = CENTER_ORDER[i];
      var bl = pl & COL_L[c], bh = ph & COL_H[c];
      if (!(bl | bh)) continue;
      var sc;
      if (c === ttMove) sc = 1000;
      else { winPos(cl | bl, ch | bh, ml, mh); sc = pop(WL) + pop(WH); }
      var j = n++;
      while (j > 0 && orderScore[base + j - 1] < sc) {
        orderScore[base + j] = orderScore[base + j - 1]; orderCol[base + j] = orderCol[base + j - 1]; j--;
      }
      orderScore[base + j] = sc; orderCol[base + j] = c;
    }

    var a0 = alpha, best = -INF, bestMove = orderCol[base];
    var nl = cl ^ ml, nh = ch ^ mh;
    for (var k = 0; k < n; k++) {
      var col = orderCol[base + k];
      var v = -negamax(nl, nh, ml | (pl & COL_L[col]), mh | (ph & COL_H[col]), moves + 1, depth - 1, -beta, -alpha);
      if (aborted) return 0;
      if (v > best) { best = v; bestMove = col; }
      if (v > alpha) { alpha = v; if (alpha >= beta) break; }
    }
    ttKL[slot] = kl; ttKH[slot] = kh; ttV[slot] = best; ttD[slot] = depth; ttM[slot] = bestMove;
    ttF[slot] = best <= a0 ? UPPER : best >= beta ? LOWER : EXACT;
    return best;
  }

  /** Root analysis shared by the searching levels: immediate wins, forced
   * blocks, and the list of moves that don't hand over a win. */
  function rootInfo(p) {
    var pl = (p.ml + BOTTOM_L) & BOARD_L, ph = (p.mh + BOTTOM_H) & BOARD_H;
    var info = { legal: [], win: -1, forced: [], safe: [] };
    winPos(p.cl, p.ch, p.ml, p.mh);
    var wl = WL, wh = WH;
    winPos(p.cl ^ p.ml, p.ch ^ p.mh, p.ml, p.mh);
    var owl = WL, owh = WH;
    var underL = shrL(owl, owh, 1), underH = shrH(owh, 1);
    for (var i = 0; i < 7; i++) {
      var c = CENTER_ORDER[i];
      var bl = pl & COL_L[c], bh = ph & COL_H[c];
      if (!(bl | bh)) continue;
      info.legal.push(c);
      if (((bl & wl) | (bh & wh)) && info.win < 0) info.win = c;
      if ((bl & owl) | (bh & owh)) info.forced.push(c);
      else if (!((bl & underL) | (bh & underH))) info.safe.push(c);
    }
    if (info.forced.length === 1) info.safe = info.forced.slice();
    else if (info.forced.length > 1) info.safe = [];
    return info;
  }

  function childScore(p, c, depth, alpha, beta) {
    var b = moveBits(p.ml, p.mh, c);
    return -negamax(p.cl ^ p.ml, p.ch ^ p.mh, p.ml | b[0], p.mh | b[1], p.moves + 1, depth - 1, -beta, -alpha);
  }

  /** Full-window score for every candidate at a fixed depth (Medium, Hard). */
  function scoreAll(p, cands, depth) {
    var out = [];
    for (var i = 0; i < cands.length; i++) {
      var v = childScore(p, cands[i], depth, -INF, INF);
      if (aborted) break;
      out.push({ col: cands[i], score: v });
    }
    return out;
  }

  /** Iterative deepening to the clock (Impossible). */
  function deepen(p, cands, maxDepth) {
    var order = cands.slice(), best = { col: order[0], score: 0, depth: 0, exact: false };
    var rem = 42 - p.moves;
    for (var d = 1; d <= Math.min(maxDepth, rem); d++) {
      var alpha = -INF, bestV = -INF, bestC = -1, done = 0;
      for (var i = 0; i < order.length; i++) {
        var v = childScore(p, order[i], d, alpha, INF);
        if (aborted) break;
        done++;
        if (v > bestV) { bestV = v; bestC = order[i]; }
        if (v > alpha) alpha = v;
      }
      if (aborted) {
        // a move that beat the previous best at the new depth is still a better choice
        if (done > 0 && bestC !== best.col) best = { col: bestC, score: bestV, depth: d, exact: false, partial: true };
        break;
      }
      best = { col: bestC, score: bestV, depth: d, exact: d >= rem };
      if (best.exact || Math.abs(bestV) > WIN - 100) { best.exact = true; break; }
      order.splice(order.indexOf(bestC), 1);
      order.unshift(bestC);
    }
    return best;
  }

  function pick(list, rng) { return list[Math.floor(rng() * list.length) % list.length]; }

  var lastLevel = null;

  /**
   * Picks a column for the player to move.
   * moves: columns played so far (0-6), from the empty board.
   * level: 'easy' | 'medium' | 'hard' | 'impossible' (or 0-3).
   * opts: { budget: ms for Impossible (default 1000), rng: () => [0,1) }
   * Returns { col, score, depth, nodes, ms, exact, book } or null if no move.
   */
  function chooseMove(moves, level, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    if (typeof level === 'number') level = LEVELS[level] || 'hard';
    if (LEVELS.indexOf(level) < 0) level = 'hard';
    var t0 = now();
    var p = fromMoves(moves || []);
    if (!p || p.won || p.moves >= 42) return null;
    var info = rootInfo(p);
    if (!info.legal.length) return null;
    var res = function (col, extra) {
      var r = { col: col, score: 0, depth: 0, nodes: nodes, ms: now() - t0, exact: false, book: false, level: level };
      if (extra) for (var k in extra) r[k] = extra[k];
      r.ms = now() - t0;
      return r;
    };
    nodes = 0;

    if (level === 'easy') {
      var oppWins = info.forced;
      if (info.win >= 0 && rng() < 0.7) return res(info.win);
      if (oppWins.length && rng() < 0.5) return res(pick(oppWins, rng));
      var weights = [1, 2, 3, 4, 3, 2, 1], total = 0, i;
      for (i = 0; i < info.legal.length; i++) total += weights[info.legal[i]];
      var x = rng() * total;
      for (i = 0; i < info.legal.length; i++) { x -= weights[info.legal[i]]; if (x < 0) return res(info.legal[i]); }
      return res(info.legal[info.legal.length - 1]);
    }

    if (info.win >= 0) return res(info.win, { score: WIN - p.moves - 1, exact: true });
    // nothing saves the game: block one threat and hope
    if (!info.safe.length) return res(info.forced.length ? info.forced[0] : info.legal[0], { score: -(WIN - p.moves - 2), exact: true });
    if (info.safe.length === 1) return res(info.safe[0], { forced: true });

    if (lastLevel !== level) { ttInit(); lastLevel = level; }
    aborted = false;

    if (level === 'medium' || level === 'hard') {
      evalKind = level === 'medium' ? 1 : 2;
      deadline = t0 + (opts.budget || 1100);
      var scored = scoreAll(p, info.safe, level === 'medium' ? 4 : 8);
      if (!scored.length) return res(info.safe[0]);
      var top = -INF;
      scored.forEach(function (s) { if (s.score > top) top = s.score; });
      var tol = level === 'medium' && Math.abs(top) < WIN - 100 ? 6 : 0;
      var good = scored.filter(function (s) { return s.score >= top - tol; }).map(function (s) { return s.col; });
      return res(pick(good, rng), { score: top, depth: level === 'medium' ? 4 : 8, nodes: nodes });
    }

    // impossible
    evalKind = 2;
    if (p.moves === 0) return res(3, { book: true });
    deadline = t0 + (opts.budget || 1000);
    var b = deepen(p, info.safe, opts.maxDepth || 42);
    return res(b.col, { score: b.score, depth: b.depth, exact: b.exact, nodes: nodes });
  }

  /** Exact game value for the player to move (WIN - n: wins with the n-th disc,
   * negative: loses, 0: draw), or null if it can't finish within budget ms. */
  function solve(moves, budget) {
    var p = fromMoves(moves || []);
    if (!p || p.won) return null;
    if (p.moves >= 42) return 0;
    if (lastLevel !== 'impossible') { ttInit(); lastLevel = 'impossible'; }
    evalKind = 2; aborted = false; nodes = 0;
    deadline = now() + (budget || 10000);
    var rem = 42 - p.moves;
    var v = negamax(p.cl, p.ch, p.ml, p.mh, p.moves, rem, -INF, INF);
    return aborted ? null : v;
  }

  return {
    LEVELS: LEVELS, WIN: WIN,
    chooseMove: chooseMove, solve: solve, fromMoves: fromMoves,
    _internal: { winPos: winPos, aligned: aligned, pop: pop }
  };
});
