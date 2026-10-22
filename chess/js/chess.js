// Chess rules and a computer player. No DOM, so the same file runs in the page, in the Web Worker
// that thinks for the computer, and in the Node tests.
//
// Squares are 0..63: index = rank * 8 + file with rank 0 = the 8th rank (top, black's side) and
// file 0 = the a-file. Pieces are 'PNBRQK' for white and 'pnbrqk' for black, '' for empty.

export const FILES = 'abcdefgh';
export const sqName = i => FILES[i & 7] + (8 - (i >> 3));
export const sqIndex = n => (8 - +n[1]) * 8 + FILES.indexOf(n[0]);
export const colorOf = p => (p ? (p === p.toUpperCase() ? 'w' : 'b') : null);
const other = c => (c === 'w' ? 'b' : 'w');

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const KG = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class Position {
  constructor(fen = START) { this.load(fen); }

  load(fen) {
    const [rows, turn, castle, ep, half, full] = fen.trim().split(/\s+/);
    this.board = [];
    for (const ch of rows.replace(/\//g, '')) {
      if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) this.board.push('');
      else this.board.push(ch);
    }
    if (this.board.length !== 64) throw new Error('bad FEN');
    this.turn = turn || 'w';
    this.castle = castle && castle !== '-' ? castle : '';
    this.ep = ep && ep !== '-' ? sqIndex(ep) : -1;
    this.half = +(half || 0); this.full = +(full || 1);
    this.history = [];
    this.keys = [this.key()];
    return this;
  }

  fen() {
    let s = '';
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[r * 8 + f];
        if (!p) { empty++; continue; }
        if (empty) { s += empty; empty = 0; }
        s += p;
      }
      if (empty) s += empty;
      if (r < 7) s += '/';
    }
    return `${s} ${this.turn} ${this.castle || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
  }
  // position identity for repetition (board, side, castling, en passant)
  key() { return this.board.join(',') + this.turn + this.castle + this.ep; }
  clone() { const p = Object.create(Position.prototype); Object.assign(p, this, { board: this.board.slice(), history: this.history.slice(), keys: this.keys.slice() }); return p; }

  kingSq(c) { return this.board.indexOf(c === 'w' ? 'K' : 'k'); }

  attacked(sq, by) {
    const B = this.board, r = sq >> 3, f = sq & 7;
    const at = (rr, ff) => (rr >= 0 && rr < 8 && ff >= 0 && ff < 8 ? B[rr * 8 + ff] : null);
    const own = p => p && colorOf(p) === by;
    const pawnRow = by === 'w' ? r + 1 : r - 1, P = by === 'w' ? 'P' : 'p';
    if (at(pawnRow, f - 1) === P || at(pawnRow, f + 1) === P) return true;
    for (const [dr, df] of KN) { const p = at(r + dr, f + df); if (own(p) && p.toLowerCase() === 'n') return true; }
    for (const [dr, df] of KG) { const p = at(r + dr, f + df); if (own(p) && p.toLowerCase() === 'k') return true; }
    for (const [dirs, kinds] of [[DIAG, 'bq'], [ORTH, 'rq']]) {
      for (const [dr, df] of dirs) {
        let rr = r + dr, ff = f + df;
        while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
          const p = B[rr * 8 + ff];
          if (p) { if (own(p) && kinds.includes(p.toLowerCase())) return true; break; }
          rr += dr; ff += df;
        }
      }
    }
    return false;
  }
  inCheck(c = this.turn) { return this.attacked(this.kingSq(c), other(c)); }

  // Pseudo-legal moves (may leave the king in check).
  pseudo(capturesOnly = false) {
    const B = this.board, c = this.turn, out = [];
    const add = (from, to, flag = '', promo = '') => out.push({ from, to, piece: B[from], captured: flag === 'ep' ? (c === 'w' ? 'p' : 'P') : B[to], flag, promo });
    for (let sq = 0; sq < 64; sq++) {
      const p = B[sq];
      if (!p || colorOf(p) !== c) continue;
      const r = sq >> 3, f = sq & 7, kind = p.toLowerCase();
      if (kind === 'p') {
        const dir = c === 'w' ? -1 : 1, start = c === 'w' ? 6 : 1, last = c === 'w' ? 0 : 7;
        const push = (to, flag = '') => { if ((to >> 3) === last) for (const q of 'qrbn') add(sq, to, flag, c === 'w' ? q.toUpperCase() : q); else add(sq, to, flag); };
        const one = sq + dir * 8;
        if (!capturesOnly && !B[one]) {
          push(one);
          if (r === start && !B[one + dir * 8]) add(sq, one + dir * 8, 'double');
        }
        for (const df of [-1, 1]) {
          const ff = f + df; if (ff < 0 || ff > 7) continue;
          const to = (r + dir) * 8 + ff;
          if (B[to] && colorOf(B[to]) !== c) push(to);
          else if (to === this.ep) add(sq, to, 'ep');
        }
        continue;
      }
      const jump = (deltas, slide) => {
        for (const [dr, df] of deltas) {
          let rr = r + dr, ff = f + df;
          while (rr >= 0 && rr < 8 && ff >= 0 && ff < 8) {
            const to = rr * 8 + ff, q = B[to];
            if (q) { if (colorOf(q) !== c) add(sq, to); break; }
            if (!capturesOnly) add(sq, to);
            if (!slide) break;
            rr += dr; ff += df;
          }
        }
      };
      if (kind === 'n') jump(KN, false);
      else if (kind === 'b') jump(DIAG, true);
      else if (kind === 'r') jump(ORTH, true);
      else if (kind === 'q') jump([...DIAG, ...ORTH], true);
      else if (kind === 'k') {
        jump(KG, false);
        if (!capturesOnly) {
          const opp = other(c), row = c === 'w' ? 7 : 0, k = row * 8 + 4;
          if (sq === k && !this.attacked(k, opp)) {
            const [ks, qs] = c === 'w' ? ['K', 'Q'] : ['k', 'q'];
            if (this.castle.includes(ks) && !B[k + 1] && !B[k + 2] && B[k + 3] === (c === 'w' ? 'R' : 'r') && !this.attacked(k + 1, opp) && !this.attacked(k + 2, opp)) add(k, k + 2, 'castle');
            if (this.castle.includes(qs) && !B[k - 1] && !B[k - 2] && !B[k - 3] && B[k - 4] === (c === 'w' ? 'R' : 'r') && !this.attacked(k - 1, opp) && !this.attacked(k - 2, opp)) add(k, k - 2, 'castle');
          }
        }
      }
    }
    return out;
  }

  moves(capturesOnly = false) {
    const c = this.turn, legal = [];
    for (const m of this.pseudo(capturesOnly)) {
      this.make(m);
      if (!this.attacked(this.kingSq(c), other(c))) legal.push(m);
      this.unmake();
    }
    return legal;
  }

  make(m) {
    const B = this.board, c = this.turn;
    this.history.push({ m, castle: this.castle, ep: this.ep, half: this.half, full: this.full });
    B[m.to] = m.promo || m.piece; B[m.from] = '';
    if (m.flag === 'ep') B[m.to + (c === 'w' ? 8 : -8)] = '';
    if (m.flag === 'castle') {
      if (m.to > m.from) { B[m.from + 1] = B[m.from + 3]; B[m.from + 3] = ''; } else { B[m.from - 1] = B[m.from - 4]; B[m.from - 4] = ''; }
    }
    // castling rights disappear when a king or rook moves, or a rook is captured on its square
    const drop = { 60: 'KQ', 4: 'kq', 63: 'K', 56: 'Q', 7: 'k', 0: 'q' };
    for (const s of [m.from, m.to]) if (drop[s]) for (const ch of drop[s]) this.castle = this.castle.replace(ch, '');
    this.ep = m.flag === 'double' ? (m.from + m.to) >> 1 : -1;
    this.half = m.piece.toLowerCase() === 'p' || m.captured ? 0 : this.half + 1;
    if (c === 'b') this.full++;
    this.turn = other(c);
    this.keys.push(this.key());
  }

  unmake() {
    const h = this.history.pop(); if (!h) return;
    this.keys.pop();
    const { m } = h, B = this.board;
    this.turn = other(this.turn);
    const c = this.turn;
    B[m.from] = m.piece; B[m.to] = m.flag === 'ep' ? '' : m.captured;
    if (m.flag === 'ep') B[m.to + (c === 'w' ? 8 : -8)] = m.captured;
    if (m.flag === 'castle') {
      if (m.to > m.from) { B[m.from + 3] = B[m.from + 1]; B[m.from + 1] = ''; } else { B[m.from - 4] = B[m.from - 1]; B[m.from - 1] = ''; }
    }
    Object.assign(this, { castle: h.castle, ep: h.ep, half: h.half, full: h.full });
  }

  repetitions() { const k = this.keys[this.keys.length - 1]; return this.keys.filter(x => x === k).length; }
  insufficient() {
    const rest = this.board.filter(p => p && p.toLowerCase() !== 'k');
    if (!rest.length) return true;
    if (rest.length === 1 && 'nb'.includes(rest[0].toLowerCase())) return true;
    if (rest.every(p => p.toLowerCase() === 'b')) {
      const colours = new Set(this.board.map((p, i) => (p && p.toLowerCase() === 'b' ? ((i >> 3) + (i & 7)) % 2 : -1)).filter(x => x >= 0));
      return colours.size === 1;
    }
    return false;
  }
  // null while the game goes on, otherwise { result: '1-0' | '0-1' | '1/2-1/2', reason }
  outcome() {
    if (!this.moves().length) {
      if (this.inCheck()) return { result: this.turn === 'w' ? '0-1' : '1-0', reason: 'checkmate' };
      return { result: '1/2-1/2', reason: 'stalemate' };
    }
    if (this.half >= 100) return { result: '1/2-1/2', reason: 'fifty-move rule' };
    if (this.repetitions() >= 3) return { result: '1/2-1/2', reason: 'threefold repetition' };
    if (this.insufficient()) return { result: '1/2-1/2', reason: 'insufficient material' };
    return null;
  }

  // Standard algebraic notation for a legal move in this position.
  san(m) {
    let s;
    if (m.flag === 'castle') s = m.to > m.from ? 'O-O' : 'O-O-O';
    else {
      const kind = m.piece.toUpperCase();
      const cap = m.captured ? 'x' : '';
      if (kind === 'P') s = (cap ? FILES[m.from & 7] : '') + cap + sqName(m.to) + (m.promo ? '=' + m.promo.toUpperCase() : '');
      else {
        const rivals = this.moves().filter(o => o.piece === m.piece && o.to === m.to && o.from !== m.from);
        let dis = '';
        if (rivals.length) {
          const sameFile = rivals.some(o => (o.from & 7) === (m.from & 7)), sameRank = rivals.some(o => (o.from >> 3) === (m.from >> 3));
          dis = !sameFile ? FILES[m.from & 7] : !sameRank ? String(8 - (m.from >> 3)) : sqName(m.from);
        }
        s = kind + dis + cap + sqName(m.to);
      }
    }
    this.make(m);
    const o = this.outcome();
    if (o && o.reason === 'checkmate') s += '#'; else if (this.inCheck()) s += '+';
    this.unmake();
    return s;
  }

  perft(depth) {
    if (!depth) return 1;
    let n = 0;
    for (const m of this.moves()) { this.make(m); n += this.perft(depth - 1); this.unmake(); }
    return n;
  }
}

// ---------------------------------------------------------------- the computer player
const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
// Piece-square tables from white's point of view (index 0 = a8), in centipawns.
const PST = {
  p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
  ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
};

// Static evaluation from the side to move's point of view.
export function evaluate(pos) {
  let score = 0, material = 0;
  for (const p of pos.board) if (p && p.toLowerCase() !== 'p' && p.toLowerCase() !== 'k') material += VAL[p.toLowerCase()];
  const endgame = material <= 2600;
  for (let i = 0; i < 64; i++) {
    const p = pos.board[i]; if (!p) continue;
    const k = p.toLowerCase(), white = p !== k;
    const idx = white ? i : (7 - (i >> 3)) * 8 + (i & 7);
    const v = VAL[k] + (k === 'k' && endgame ? PST.ke : PST[k])[idx];
    score += white ? v : -v;
  }
  return pos.turn === 'w' ? score : -score;
}

const MATE = 100000;
function order(moves) {
  return moves.sort((a, b) => ((b.captured ? VAL[b.captured.toLowerCase()] * 10 - VAL[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0))
    - ((a.captured ? VAL[a.captured.toLowerCase()] * 10 - VAL[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0)));
}

// Best move for the side to move. level: 'easy' | 'medium' | 'hard'. Returns { move, score, depth }.
export function think(fen, level = 'medium', opts = {}) {
  const pos = new Position(fen);
  const rnd = opts.random || Math.random;
  const root = pos.moves();
  if (!root.length) return { move: null };
  const maxDepth = { easy: 1, medium: 3, hard: 5 }[level] || 3;
  const budget = opts.ms ?? ({ easy: 200, medium: 900, hard: 2500 }[level] || 900);
  const t0 = Date.now();
  let nodes = 0, stop = false;

  function quiesce(alpha, beta, ply) {
    nodes++;
    const stand = evaluate(pos);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (ply > 6) return alpha;
    for (const m of order(pos.moves(true))) {
      pos.make(m);
      const s = -quiesce(-beta, -alpha, ply + 1);
      pos.unmake();
      if (s >= beta) return beta;
      if (s > alpha) alpha = s;
    }
    return alpha;
  }
  function search(depth, alpha, beta, ply) {
    if ((++nodes & 1023) === 0 && Date.now() - t0 > budget) stop = true;
    if (stop) return 0;
    if (ply && (pos.repetitions() >= 2 || pos.half >= 100)) return 0;
    if (depth <= 0) return quiesce(alpha, beta, 0);
    const moves = order(pos.moves());
    if (!moves.length) return pos.inCheck() ? -MATE + ply : 0;
    for (const m of moves) {
      pos.make(m);
      const s = -search(depth - 1, -beta, -alpha, ply + 1);
      pos.unmake();
      if (stop) return 0;
      if (s >= beta) return beta;
      if (s > alpha) alpha = s;
    }
    return alpha;
  }

  let best = root[0], bestScore = -Infinity, reached = 0, ranked = root.map(m => ({ m, s: 0 }));
  for (let depth = 1; depth <= maxDepth; depth++) {
    const scored = [];
    let alpha = -Infinity;
    for (const { m } of ranked) {
      pos.make(m);
      const s = -search(depth - 1, -Infinity, -alpha + 1, 1);
      pos.unmake();
      if (stop) break;
      scored.push({ m, s });
      if (s > alpha) alpha = s;
    }
    if (stop && scored.length < ranked.length) break;
    ranked = scored.sort((a, b) => b.s - a.s);
    best = ranked[0].m; bestScore = ranked[0].s; reached = depth;
    if (Math.abs(bestScore) > MATE - 100) break;
  }
  // Easy and medium sometimes pick a slightly worse move so they feel human and beatable.
  if (level !== 'hard' && ranked.length > 1) {
    const slack = level === 'easy' ? 180 : 25;
    const close = ranked.filter(r => r.s >= ranked[0].s - slack);
    if (close.length > 1 && rnd() < (level === 'easy' ? 0.7 : 0.35)) best = close[Math.floor(rnd() * close.length)].m;
    if (level === 'easy' && rnd() < 0.15) best = ranked[Math.floor(rnd() * ranked.length)].m;
  }
  return { move: best, score: bestScore, depth: reached, nodes };
}
