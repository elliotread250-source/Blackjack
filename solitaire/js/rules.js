/*
 * Klondike rules and game state. No DOM in here: the same file runs in the
 * browser (window.KlondikeRules) and in Node (module.exports) so the rules
 * can be unit-tested and the offline solver can reuse them.
 *
 * Cards are integers 0..51: id = suit * 13 + (rank - 1).
 * Suits: 0 spades, 1 hearts, 2 diamonds, 3 clubs (hearts/diamonds are red).
 *
 * Piles are named by short strings:
 *   's'  stock (face down, top = last element)
 *   'w'  waste (face up, top = last element)
 *   'f0'..'f3' foundations
 *   't0'..'t6' tableau columns; down[c] = how many cards at the bottom of
 *              column c are face down (they are always a prefix).
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.KlondikeRules = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const RANK_NAMES = ['', 'Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  const TABLEAU = ['t0', 't1', 't2', 't3', 't4', 't5', 't6'];
  const FOUNDATIONS = ['f0', 'f1', 'f2', 'f3'];
  const PILES = ['s', 'w'].concat(FOUNDATIONS, TABLEAU);
  // Compact snapshot alphabet: one character per card.
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  const suitOf = (id) => (id / 13) | 0;
  const rankOf = (id) => (id % 13) + 1;
  const isRed = (id) => { const s = (id / 13) | 0; return s === 1 || s === 2; };
  const cardName = (id) => RANKS[rankOf(id)] + SUITS[suitOf(id)];
  const cardLongName = (id) => RANK_NAMES[rankOf(id)] + ' of ' + SUIT_NAMES[suitOf(id)];

  // Small, fast, seedable PRNG (public-domain mulberry32).
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomSeed() {
    let s = 0;
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        s = a[0];
      }
    } catch (e) { s = 0; }
    if (!s) s = Math.floor(Math.random() * 4294967295) + 1;
    return s >>> 0 || 1;
  }

  function shuffledDeck(seed) {
    const deck = [];
    for (let i = 0; i < 52; i++) deck.push(i);
    const rnd = mulberry32(seed);
    for (let i = 51; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      const t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    return deck;
  }

  // Standard (Windows) scoring.
  const STANDARD = { wt: 5, wf: 10, tf: 10, ft: -15, flip: 5 };

  class Klondike {
    /**
     * opts.seed     deal number (uint32); random if omitted
     * opts.draw     1 or 3
     * opts.scoring  'standard' | 'vegas' | 'none'
     */
    constructor(opts) {
      opts = opts || {};
      this.draw = opts.draw === 3 ? 3 : 1;
      this.scoring = (opts.scoring === 'vegas' || opts.scoring === 'none') ? opts.scoring : 'standard';
      this.seed = (opts.seed != null && isFinite(opts.seed)) ? (Number(opts.seed) >>> 0) : randomSeed();
      this.history = [];
      this.deal();
    }

    deal() {
      const deck = shuffledDeck(this.seed);
      this.t = [[], [], [], [], [], [], []];
      this.down = [0, 0, 0, 0, 0, 0, 0];
      let k = 0;
      for (let r = 0; r < 7; r++) {
        for (let c = r; c < 7; c++) this.t[c].push(deck[k++]);
      }
      for (let c = 0; c < 7; c++) this.down[c] = c;
      // deck[28] is the top of the stock (drawn first).
      this.s = deck.slice(28).reverse();
      this.w = [];
      this.f = [[], [], [], []];
      this.score = this.scoring === 'vegas' ? -52 : 0;
      this.moves = 0;
      this.passes = 0; // number of times the waste was turned back into the stock
      this.history = [];
    }

    /** Deal order used by the UI for the deal animation: [{id, pile, index}] */
    dealOrder() {
      const out = [];
      for (let r = 0; r < 7; r++) {
        for (let c = r; c < 7; c++) out.push({ id: this.initialColumn(c)[r], pile: 't' + c, index: r });
      }
      return out;
    }

    initialColumn(c) {
      const deck = shuffledDeck(this.seed);
      const col = [];
      let k = 0;
      for (let r = 0; r < 7; r++) {
        for (let cc = r; cc < 7; cc++) { if (cc === c) col.push(deck[k]); k++; }
      }
      return col;
    }

    pile(name) {
      if (name === 's') return this.s;
      if (name === 'w') return this.w;
      const i = name.charCodeAt(1) - 48;
      if (name[0] === 'f') return this.f[i];
      if (name[0] === 't') return this.t[i];
      return null;
    }

    isFaceUp(name, index) {
      if (name === 's') return false;
      if (name[0] === 't') return index >= this.down[name.charCodeAt(1) - 48];
      return true;
    }

    maxRecycles() {
      if (this.scoring === 'vegas') return this.draw === 1 ? 0 : 2;
      return Infinity;
    }

    canRecycle() {
      return this.s.length === 0 && this.w.length > 0 && this.passes < this.maxRecycles();
    }

    canDraw() {
      return this.s.length > 0 || this.canRecycle();
    }

    /** Can the cards from `index` to the end of pile `from` be picked up? */
    canPick(from, index) {
      const p = this.pile(from);
      if (!p || index < 0 || index >= p.length) return false;
      const k = from[0];
      if (k === 's') return false;
      if (k === 'w' || k === 'f') return index === p.length - 1;
      // tableau: must be face up and a valid alternating descending run
      if (index < this.down[from.charCodeAt(1) - 48]) return false;
      for (let i = index; i < p.length - 1; i++) {
        if (rankOf(p[i]) !== rankOf(p[i + 1]) + 1 || isRed(p[i]) === isRed(p[i + 1])) return false;
      }
      return true;
    }

    /** Can `cards` (lead card first) be placed onto pile `to`? */
    canPlace(cards, to) {
      if (!cards.length) return false;
      const dst = this.pile(to);
      if (!dst) return false;
      const lead = cards[0];
      const k = to[0];
      if (k === 'f') {
        if (cards.length !== 1) return false;
        if (!dst.length) return rankOf(lead) === 1;
        const top = dst[dst.length - 1];
        return suitOf(top) === suitOf(lead) && rankOf(lead) === rankOf(top) + 1;
      }
      if (k === 't') {
        if (!dst.length) return rankOf(lead) === 13;
        const top = dst[dst.length - 1];
        return isRed(top) !== isRed(lead) && rankOf(lead) === rankOf(top) - 1;
      }
      return false;
    }

    canMove(from, index, to) {
      if (from === to) return false;
      if (from[0] === 'f' && to[0] === 'f') return false;
      if (!this.canPick(from, index)) return false;
      return this.canPlace(this.pile(from).slice(index), to);
    }

    legalTargets(from, index) {
      const out = [];
      for (const to of FOUNDATIONS) if (this.canMove(from, index, to)) out.push(to);
      for (const to of TABLEAU) if (this.canMove(from, index, to)) out.push(to);
      return out;
    }

    _addScore(delta) {
      if (this.scoring === 'none' || !delta) return;
      this.score += delta;
      if (this.scoring === 'standard' && this.score < 0) this.score = 0;
    }

    _moveScore(from, to) {
      const a = from[0], b = to[0];
      if (this.scoring === 'standard') return STANDARD[a + b] || 0;
      if (this.scoring === 'vegas') {
        if (b === 'f' && a !== 'f') return 5;
        if (a === 'f' && b !== 'f') return -5;
      }
      return 0;
    }

    _push() {
      this.history.push(this.encode());
      if (this.history.length > 3000) this.history.splice(0, this.history.length - 3000);
    }

    /** Move cards[index..] from pile `from` to pile `to`. Returns a result or null. */
    move(from, index, to) {
      if (!this.canMove(from, index, to)) return null;
      this._push();
      const src = this.pile(from);
      const dst = this.pile(to);
      const cards = src.splice(index);
      for (const c of cards) dst.push(c);
      let delta = this._moveScore(from, to);
      let flipped = null;
      if (from[0] === 't') {
        const c = from.charCodeAt(1) - 48;
        if (!src.length) this.down[c] = 0;
        else if (this.down[c] >= src.length) {
          this.down[c] = src.length - 1;
          flipped = src[src.length - 1];
          if (this.scoring === 'standard') delta += STANDARD.flip;
        }
      }
      this._addScore(delta);
      this.moves++;
      return { type: 'move', from, to, index, cards, flipped };
    }

    /** Turn cards from the stock (or recycle the waste). Returns a result or null. */
    drawCards() {
      if (this.s.length) {
        this._push();
        const n = Math.min(this.draw, this.s.length);
        const cards = [];
        for (let i = 0; i < n; i++) {
          const c = this.s.pop();
          this.w.push(c);
          cards.push(c);
        }
        this.moves++;
        return { type: 'draw', cards };
      }
      if (this.canRecycle()) {
        this._push();
        this.s = this.w.reverse();
        this.w = [];
        this.passes++;
        if (this.scoring === 'standard') this._addScore(this.draw === 1 ? -100 : -20);
        this.moves++;
        return { type: 'recycle', cards: this.s.slice() };
      }
      return null;
    }

    apply(m) {
      if (!m) return null;
      if (m.type === 'draw') return this.drawCards();
      return this.move(m.from, m.index, m.to);
    }

    canUndo() { return this.history.length > 0; }

    undo() {
      if (!this.history.length) return false;
      this.decode(this.history.pop());
      return true;
    }

    /** Restart the same deal (keeps seed, draw and scoring). */
    restart() {
      this.deal();
    }

    isWon() {
      return this.f[0].length === 13 && this.f[1].length === 13 && this.f[2].length === 13 && this.f[3].length === 13;
    }

    foundationCount() {
      return this.f[0].length + this.f[1].length + this.f[2].length + this.f[3].length;
    }

    allFaceUp() {
      for (let c = 0; c < 7; c++) if (this.down[c] > 0) return false;
      return true;
    }

    /** Where every card is: {id: {pile, index, up}} as an array indexed by id. */
    locate() {
      const out = new Array(52);
      for (const name of PILES) {
        const p = this.pile(name);
        for (let i = 0; i < p.length; i++) out[p[i]] = { pile: name, index: i, up: this.isFaceUp(name, i) };
      }
      return out;
    }

    /** Best destination for a tap on cards[index..] of `from` (foundation first). */
    bestTarget(from, index) {
      if (!this.canPick(from, index)) return null;
      const p = this.pile(from);
      const isTop = index === p.length - 1;
      if (isTop && from[0] !== 'f') {
        // Prefer the foundation already holding this suit, then the first empty one.
        for (const f of FOUNDATIONS) if (this.pile(f).length && this.canMove(from, index, f)) return f;
        for (const f of FOUNDATIONS) if (this.canMove(from, index, f)) return f;
      }
      const lead = p[index];
      let empty = null;
      let best = null, bestDist = 99;
      const fc = from[0] === 't' ? from.charCodeAt(1) - 48 : -1;
      for (let c = 0; c < 7; c++) {
        const to = TABLEAU[c];
        if (!this.canMove(from, index, to)) continue;
        if (this.t[c].length) {
          const d = fc < 0 ? c : Math.abs(c - fc);
          if (d < bestDist) { bestDist = d; best = to; }
        } else if (empty === null) {
          empty = to;
        }
      }
      if (best) return best;
      // A king already at the bottom of a column gains nothing by moving.
      if (empty && !(from[0] === 't' && index === 0 && rankOf(lead) === 13)) return empty;
      return null;
    }

    _kingWaiting() {
      // Is there a king that would benefit from an empty column?
      for (let c = 0; c < 7; c++) {
        const col = this.t[c];
        for (let i = Math.max(1, this.down[c]); i < col.length; i++) if (rankOf(col[i]) === 13) return true;
      }
      if (this.w.length && rankOf(this.w[this.w.length - 1]) === 13) return true;
      for (const c of this.s) if (rankOf(c) === 13) return true;
      for (const c of this.w) if (rankOf(c) === 13) return true;
      return false;
    }

    /**
     * Useful legal moves, best first. Each is {type:'move', from, index, to}
     * or {type:'draw'}. Pointless shuffles (e.g. a king from one empty column
     * to another, or a run hopping between equal spots) are left out.
     */
    hints() {
      const out = [];
      const add = (m, pri) => { m.pri = pri; out.push(m); };
      // 1. To the foundations.
      for (let c = 0; c < 7; c++) {
        const col = this.t[c];
        if (!col.length) continue;
        const i = col.length - 1;
        for (const f of FOUNDATIONS) {
          if (this.canMove(TABLEAU[c], i, f)) {
            add({ type: 'move', from: TABLEAU[c], index: i, to: f }, i > 0 && this.down[c] === i ? 120 : 100);
            break;
          }
        }
      }
      if (this.w.length) {
        const i = this.w.length - 1;
        for (const f of FOUNDATIONS) {
          if (this.canMove('w', i, f)) { add({ type: 'move', from: 'w', index: i, to: f }, 95); break; }
        }
      }
      // 2. Tableau to tableau.
      const kingWaiting = this._kingWaiting();
      for (let c = 0; c < 7; c++) {
        const col = this.t[c];
        for (let i = this.down[c]; i < col.length; i++) {
          if (!this.canPick(TABLEAU[c], i)) continue;
          let doneEmpty = false;
          for (let d = 0; d < 7; d++) {
            if (d === c) continue;
            const to = TABLEAU[d];
            if (!this.canMove(TABLEAU[c], i, to)) continue;
            const destEmpty = this.t[d].length === 0;
            if (destEmpty) {
              if (doneEmpty) continue; // one empty column is as good as another
              doneEmpty = true;
            }
            if (i === this.down[c] && i > 0) {
              // Moves the whole face-up run and turns over a card.
              add({ type: 'move', from: TABLEAU[c], index: i, to }, (destEmpty ? 75 : 80) + this.down[c]);
            } else if (i === 0) {
              // Empties a column: only worth it if a king is waiting for it.
              if (!destEmpty && kingWaiting) add({ type: 'move', from: TABLEAU[c], index: i, to }, 30);
            } else {
              // Partial run: worth it if the card it uncovers can go up.
              const under = col[i - 1];
              let ok = false;
              for (const f of FOUNDATIONS) if (this.canPlace([under], f)) { ok = true; break; }
              if (ok) add({ type: 'move', from: TABLEAU[c], index: i, to }, 70);
            }
          }
        }
      }
      // 3. Waste to tableau.
      if (this.w.length) {
        const i = this.w.length - 1;
        let doneEmpty = false;
        for (let d = 0; d < 7; d++) {
          const to = TABLEAU[d];
          if (!this.canMove('w', i, to)) continue;
          if (!this.t[d].length) { if (doneEmpty) continue; doneEmpty = true; add({ type: 'move', from: 'w', index: i, to }, 55); }
          else add({ type: 'move', from: 'w', index: i, to }, 60);
        }
      }
      // 4. Draw / recycle.
      if (this.canDraw()) add({ type: 'draw' }, 10);
      out.sort((a, b) => b.pri - a.pri);
      return out;
    }

    /**
     * True when nothing useful is left: no useful tableau/foundation move and
     * no card that can ever be turned from the stock is playable anywhere.
     */
    isStuck() {
      if (this.isWon()) return false;
      const h = this.hints();
      if (h.some((m) => m.type === 'move')) return false;
      if (!this.canDraw()) return true;
      const sim = this.clone();
      const cycle = sim.s.length + sim.w.length;
      const limit = cycle * 2 + 6;
      for (let n = 0; n < limit; n++) {
        if (!sim.drawCards()) break;
        if (sim.w.length) {
          const i = sim.w.length - 1;
          for (const to of PILES) if (to !== 'w' && to !== 's' && sim.canMove('w', i, to)) return false;
        }
      }
      return true;
    }

    /** Next move for auto-complete: lowest card that can go up, else draw. */
    nextAutoMove() {
      let best = null, bestRank = 99;
      const consider = (from, i) => {
        const p = this.pile(from);
        const r = rankOf(p[i]);
        if (r >= bestRank) return;
        for (const f of FOUNDATIONS) {
          if (this.canMove(from, i, f)) { best = { type: 'move', from, index: i, to: f }; bestRank = r; return; }
        }
      };
      for (let c = 0; c < 7; c++) if (this.t[c].length) consider(TABLEAU[c], this.t[c].length - 1);
      if (this.w.length) consider('w', this.w.length - 1);
      if (best) return best;
      if (this.canDraw()) return { type: 'draw' };
      return null;
    }

    /** Can the game be finished just by sending cards up (and drawing)? */
    canAutoComplete() {
      if (this.isWon() || !this.allFaceUp()) return false;
      if (!this.s.length && !this.w.length) return true;
      const sim = this.clone();
      let idle = 0;
      for (let n = 0; n < 2000 && !sim.isWon(); n++) {
        const m = sim.nextAutoMove();
        if (!m) return false;
        sim.apply(m);
        if (m.type === 'draw') { if (++idle > sim.s.length + sim.w.length + 4) return false; } else idle = 0;
      }
      return sim.isWon();
    }

    clone() {
      const g = Object.create(Klondike.prototype);
      g.draw = this.draw; g.scoring = this.scoring; g.seed = this.seed;
      g.history = [];
      g.decode(this.encode());
      return g;
    }

    /** Compact one-line snapshot of the position, score and counters. */
    encode() {
      const enc = (p) => { let s = ''; for (const c of p) s += ALPHA[c]; return s; };
      const parts = [enc(this.s), enc(this.w)];
      for (let i = 0; i < 4; i++) parts.push(enc(this.f[i]));
      for (let c = 0; c < 7; c++) parts.push(this.down[c] + enc(this.t[c]));
      return parts.join(',') + ';' + this.score + ';' + this.moves + ';' + this.passes;
    }

    decode(str) {
      const [layout, score, moves, passes] = String(str).split(';');
      const parts = layout.split(',');
      if (parts.length !== 13) throw new Error('bad snapshot');
      const dec = (s) => { const out = []; for (const ch of s) { const v = ALPHA.indexOf(ch); if (v < 0) throw new Error('bad card'); out.push(v); } return out; };
      const s = dec(parts[0]);
      const w = dec(parts[1]);
      const f = [dec(parts[2]), dec(parts[3]), dec(parts[4]), dec(parts[5])];
      const t = [], down = [];
      for (let c = 0; c < 7; c++) {
        const p = parts[6 + c];
        const m = /^(\d+)(.*)$/.exec(p);
        if (!m) throw new Error('bad column');
        const col = dec(m[2]);
        const d = Math.min(parseInt(m[1], 10), Math.max(0, col.length - 1));
        t.push(col); down.push(col.length ? d : 0);
      }
      const seen = new Uint8Array(52);
      let count = 0;
      for (const p of [s, w].concat(f, t)) for (const c of p) { if (seen[c]) throw new Error('duplicate card'); seen[c] = 1; count++; }
      if (count !== 52) throw new Error('missing cards');
      this.s = s; this.w = w; this.f = f; this.t = t; this.down = down;
      this.score = parseInt(score, 10) || 0;
      this.moves = parseInt(moves, 10) || 0;
      this.passes = parseInt(passes, 10) || 0;
    }

    toJSON() {
      return { v: 1, seed: this.seed, draw: this.draw, scoring: this.scoring, state: this.encode(), history: this.history.slice(-1500) };
    }

    static fromJSON(o) {
      if (!o || o.v !== 1 || typeof o.state !== 'string') throw new Error('bad save');
      const g = Object.create(Klondike.prototype);
      g.draw = o.draw === 3 ? 3 : 1;
      g.scoring = (o.scoring === 'vegas' || o.scoring === 'none') ? o.scoring : 'standard';
      g.seed = Number(o.seed) >>> 0;
      g.decode(o.state);
      g.history = Array.isArray(o.history) ? o.history.filter((h) => typeof h === 'string') : [];
      // Validate the history too; drop it if anything is off rather than crash on undo.
      try { const probe = g.clone(); for (const h of g.history) probe.decode(h); } catch (e) { g.history = []; }
      return g;
    }
  }

  /** Windows timed-game bonus: 700,000 / seconds for games longer than 30 s. */
  function timeBonus(seconds) {
    return seconds >= 30 ? Math.floor(700000 / seconds) : 0;
  }

  return {
    Klondike, mulberry32, shuffledDeck, randomSeed, timeBonus,
    suitOf, rankOf, isRed, cardName, cardLongName,
    SUITS, SUIT_NAMES, RANKS, RANK_NAMES, PILES, TABLEAU, FOUNDATIONS,
  };
});
