/* Minesweeper board logic. No DOM: runs in the browser (window.Minesweeper)
   and in node (module.exports) so the rules can be unit-tested. */
(function (root) {
  'use strict';

  var HIDDEN = 0, REVEALED = 1, FLAGGED = 2, QUESTION = 3;

  var LEVELS = {
    beginner:     { key: 'beginner',     name: 'Beginner',     w: 9,  h: 9,  mines: 10 },
    intermediate: { key: 'intermediate', name: 'Intermediate', w: 16, h: 16, mines: 40 },
    expert:       { key: 'expert',       name: 'Expert',       w: 30, h: 16, mines: 99 }
  };

  // Windows' Custom Field limits.
  var LIMITS = { minW: 9, maxW: 30, minH: 9, maxH: 24, minMines: 10 };

  function maxMines(w, h) { return (w - 1) * (h - 1); }

  function clampInt(v, lo, hi, dflt) {
    v = parseInt(v, 10);
    if (!isFinite(v)) v = dflt;
    return Math.max(lo, Math.min(hi, v));
  }

  // Clamp a custom field the way Windows does: silently, never refusing.
  function clampCustom(w, h, mines) {
    w = clampInt(w, LIMITS.minW, LIMITS.maxW, LIMITS.minW);
    h = clampInt(h, LIMITS.minH, LIMITS.maxH, LIMITS.minH);
    mines = clampInt(mines, LIMITS.minMines, maxMines(w, h), LIMITS.minMines);
    return { w: w, h: h, mines: mines };
  }

  // Small seeded PRNG, used by the tests for reproducible layouts.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function Board(w, h, mines, opts) {
    opts = opts || {};
    this.w = w | 0;
    this.h = h | 0;
    this.size = this.w * this.h;
    this.mines = Math.max(0, Math.min(mines | 0, this.size - 1));
    this.rng = opts.rng || Math.random;
    this.mine = new Uint8Array(this.size);
    this.count = new Uint8Array(this.size);
    this.state = new Uint8Array(this.size);
    this.exploded = new Uint8Array(this.size);
    this.generated = false;
    this.status = 'ready';      // ready -> playing -> won | lost
    this.flags = 0;
    this.revealed = 0;
    this.safeZone = 0;          // how many cells the first click kept clear
    this._buildNeighbours();
  }

  Board.prototype._buildNeighbours = function () {
    // Flat neighbour table: nbr[start[i] .. start[i+1]) are i's neighbours.
    var w = this.w, h = this.h, size = this.size;
    var start = new Int32Array(size + 1);
    var list = new Int32Array(size * 8);
    var k = 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        start[y * w + x] = k;
        for (var dy = -1; dy <= 1; dy++) {
          var ny = y + dy;
          if (ny < 0 || ny >= h) continue;
          for (var dx = -1; dx <= 1; dx++) {
            var nx = x + dx;
            if ((dx === 0 && dy === 0) || nx < 0 || nx >= w) continue;
            list[k++] = ny * w + nx;
          }
        }
      }
    }
    start[size] = k;
    this._nStart = start;
    this._nList = list;
  };

  Board.prototype.idx = function (x, y) { return y * this.w + x; };
  Board.prototype.xy = function (i) { return [i % this.w, (i / this.w) | 0]; };
  Board.prototype.inBounds = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };

  Board.prototype.neighbours = function (i) {
    var out = [];
    for (var k = this._nStart[i], e = this._nStart[i + 1]; k < e; k++) out.push(this._nList[k]);
    return out;
  };

  Board.prototype.isOver = function () { return this.status === 'won' || this.status === 'lost'; };

  // Place mines after the first click. The clicked cell and, when the board
  // has room, its neighbours are kept clear so the first click opens an area.
  Board.prototype.generate = function (safeIdx) {
    var size = this.size, safe = new Uint8Array(size), i;
    var nb = this.neighbours(safeIdx);
    safe[safeIdx] = 1;
    if (size - 1 - nb.length >= this.mines) {
      for (i = 0; i < nb.length; i++) safe[nb[i]] = 1;
      this.safeZone = nb.length + 1;
    } else {
      this.safeZone = 1;
    }
    var pool = [];
    for (i = 0; i < size; i++) if (!safe[i]) pool.push(i);
    // Partial Fisher-Yates: the first `mines` entries become mines.
    for (i = 0; i < this.mines; i++) {
      var j = i + Math.floor(this.rng() * (pool.length - i));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      this.mine[pool[i]] = 1;
    }
    this._computeCounts();
    this.generated = true;
    if (this.status === 'ready') this.status = 'playing';
  };

  // Deterministic layout (tests, debugging).
  Board.prototype.setMines = function (indices) {
    this.mine.fill(0);
    for (var i = 0; i < indices.length; i++) this.mine[indices[i]] = 1;
    this.mines = indices.length;
    this._computeCounts();
    this.generated = true;
    if (this.status === 'ready') this.status = 'playing';
  };

  Board.prototype._computeCounts = function () {
    var s = this._nStart, l = this._nList;
    for (var i = 0; i < this.size; i++) {
      var c = 0;
      for (var k = s[i], e = s[i + 1]; k < e; k++) c += this.mine[l[k]];
      this.count[i] = c;
    }
  };

  Board.prototype.mineList = function () {
    var out = [];
    for (var i = 0; i < this.size; i++) if (this.mine[i]) out.push(i);
    return out;
  };

  Board.prototype.flagsAround = function (i) {
    var c = 0, s = this._nStart, l = this._nList;
    for (var k = s[i], e = s[i + 1]; k < e; k++) if (this.state[l[k]] === FLAGGED) c++;
    return c;
  };

  // Iterative flood fill: opens `start` and spreads through zero cells.
  // Flags are left alone; question marks are opened.
  Board.prototype._open = function (start, out) {
    var st = this.state, cnt = this.count, s = this._nStart, l = this._nList;
    var stack = [start];
    while (stack.length) {
      var i = stack.pop();
      if (st[i] === REVEALED || st[i] === FLAGGED || this.mine[i]) continue;
      st[i] = REVEALED;
      this.revealed++;
      out.push(i);
      if (cnt[i] === 0) {
        for (var k = s[i], e = s[i + 1]; k < e; k++) {
          var n = l[k];
          if (st[n] === HIDDEN || st[n] === QUESTION) stack.push(n);
        }
      }
    }
  };

  Board.prototype._result = function (opened, boom) {
    return { opened: opened, boom: boom || [], won: this.status === 'won', lost: this.status === 'lost' };
  };

  Board.prototype._lose = function (boom) {
    this.status = 'lost';
    for (var i = 0; i < boom.length; i++) this.exploded[boom[i]] = 1;
  };

  Board.prototype._checkWin = function () {
    if (this.status !== 'playing') return;
    if (this.revealed === this.size - this.mines) {
      this.status = 'won';
      for (var i = 0; i < this.size; i++) {
        if (this.mine[i] && this.state[i] !== FLAGGED) this.state[i] = FLAGGED;
      }
      this.flags = this.mines;
    }
  };

  // Left click. Returns null when nothing happens.
  Board.prototype.reveal = function (i) {
    if (this.isOver() || i < 0 || i >= this.size) return null;
    var st = this.state[i];
    if (st === REVEALED || st === FLAGGED) return null;
    if (!this.generated) this.generate(i);
    if (this.mine[i]) {
      this._lose([i]);
      return this._result([], [i]);
    }
    var opened = [];
    this._open(i, opened);
    this._checkWin();
    return this._result(opened);
  };

  Board.prototype.canChord = function (i) {
    return this.status === 'playing' && this.state[i] === REVEALED && this.count[i] > 0 &&
      this.flagsAround(i) === this.count[i];
  };

  // Chord on a revealed number whose flag count matches: open the rest.
  Board.prototype.chord = function (i) {
    if (i < 0 || i >= this.size || !this.canChord(i)) return null;
    var opened = [], boom = [], nb = this.neighbours(i);
    for (var k = 0; k < nb.length; k++) {
      var n = nb[k], st = this.state[n];
      if (st !== HIDDEN && st !== QUESTION) continue;
      if (this.mine[n]) boom.push(n);
      else this._open(n, opened);
    }
    if (!opened.length && !boom.length) return null;
    if (boom.length) this._lose(boom);
    else this._checkWin();
    return this._result(opened, boom);
  };

  // Right click: hidden -> flag -> (? if marks) -> hidden. Returns new state or null.
  Board.prototype.toggleFlag = function (i, marks) {
    if (this.isOver() || i < 0 || i >= this.size) return null;
    var st = this.state[i];
    if (st === REVEALED) return null;
    if (st === HIDDEN) { this.state[i] = FLAGGED; this.flags++; }
    else if (st === FLAGGED) { this.state[i] = marks ? QUESTION : HIDDEN; this.flags--; }
    else { this.state[i] = HIDDEN; }
    return this.state[i];
  };

  Board.prototype.clearMarks = function () {
    for (var i = 0; i < this.size; i++) if (this.state[i] === QUESTION) this.state[i] = HIDDEN;
  };

  var api = {
    HIDDEN: HIDDEN, REVEALED: REVEALED, FLAGGED: FLAGGED, QUESTION: QUESTION,
    LEVELS: LEVELS, LIMITS: LIMITS, maxMines: maxMines, clampCustom: clampCustom,
    mulberry32: mulberry32, Board: Board
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Minesweeper = api;
})(typeof self !== 'undefined' ? self : this);
