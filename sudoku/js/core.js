/*
 * Sudoku rules engine with no DOM: geometry, a seeded RNG, a fast bitmask
 * solver, a "human" solver that grades puzzles by the techniques a person
 * needs, the puzzle generator and the hint finder. The same file runs in the
 * page (window.SudokuCore), in the generator Web Worker and in node
 * (module.exports) for the unit tests.
 *
 * A grid is a flat array of 81 numbers, 0 for an empty cell, read row by
 * row. Candidates are 9-bit masks: bit d-1 set means digit d is possible.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SudokuCore = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  // ---------- geometry ----------

  var ROW = new Uint8Array(81), COL = new Uint8Array(81), BOX = new Uint8Array(81);
  var UNITS = [];       // 0-8 rows, 9-17 columns, 18-26 boxes
  var CELL_UNITS = [];  // per cell: [row unit, column unit, box unit]
  var PEERS = [];       // per cell: the 20 cells that share a unit with it
  var SEE = new Uint8Array(81 * 81);
  var i, j, u;

  for (i = 0; i < 81; i++) {
    ROW[i] = (i / 9) | 0;
    COL[i] = i % 9;
    BOX[i] = ((ROW[i] / 3) | 0) * 3 + ((COL[i] / 3) | 0);
  }
  for (u = 0; u < 27; u++) UNITS.push([]);
  for (i = 0; i < 81; i++) {
    UNITS[ROW[i]].push(i);
    UNITS[9 + COL[i]].push(i);
    UNITS[18 + BOX[i]].push(i);
    CELL_UNITS.push([ROW[i], 9 + COL[i], 18 + BOX[i]]);
  }
  for (i = 0; i < 81; i++) {
    var peers = [];
    for (j = 0; j < 81; j++) {
      if (i !== j && (ROW[i] === ROW[j] || COL[i] === COL[j] || BOX[i] === BOX[j])) {
        SEE[i * 81 + j] = 1;
        peers.push(j);
      }
    }
    PEERS.push(peers);
  }
  // Boxes first: a hidden single in a box is the easiest thing for a person
  // to spot, so hints and grading look there before rows and columns.
  var UNIT_ORDER = [];
  for (u = 18; u < 27; u++) UNIT_ORDER.push(u);
  for (u = 0; u < 18; u++) UNIT_ORDER.push(u);

  var POP = new Uint8Array(512);
  var BIT_DIGIT = new Uint8Array(512);
  for (i = 1; i < 512; i++) POP[i] = POP[i >> 1] + (i & 1);
  for (i = 1; i <= 9; i++) BIT_DIGIT[1 << (i - 1)] = i;
  var ALL = 511;

  function sees(a, b) { return SEE[a * 81 + b] === 1; }
  function digitsOf(mask) {
    var out = [];
    for (var d = 1; d <= 9; d++) if (mask & (1 << (d - 1))) out.push(d);
    return out;
  }
  function cellName(c) { return 'R' + (ROW[c] + 1) + 'C' + (COL[c] + 1); }
  function unitName(un) {
    return un < 9 ? 'row ' + (un + 1) : un < 18 ? 'column ' + (un - 8) : 'box ' + (un - 17);
  }
  function unitKind(un) { return un < 9 ? 'row' : un < 18 ? 'column' : 'box'; }

  // ---------- seeded RNG ----------

  function hashSeed(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var k = 0; k < str.length; k++) {
      var ch = str.charCodeAt(k);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h1 ^ h2) >>> 0;
  }
  // mulberry32: tiny, fast and identical on every JS engine.
  function makeRng(seed) {
    var a = typeof seed === 'number' ? seed >>> 0 : hashSeed(String(seed));
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rng) {
    for (var k = arr.length - 1; k > 0; k--) {
      var m = (rng() * (k + 1)) | 0;
      var t = arr[k]; arr[k] = arr[m]; arr[m] = t;
    }
    return arr;
  }

  // ---------- grid helpers ----------

  function fromString(str) {
    var g = new Array(81);
    for (var k = 0; k < 81; k++) {
      var ch = str.charCodeAt(k);
      g[k] = ch >= 49 && ch <= 57 ? ch - 48 : 0;
    }
    return g;
  }
  function toString(grid) {
    var s = '';
    for (var k = 0; k < 81; k++) s += grid[k] ? String(grid[k]) : '.';
    return s;
  }

  /* Cells holding a digit that repeats inside one of their units. */
  function conflicts(values) {
    var out = new Uint8Array(81);
    for (var un = 0; un < 27; un++) {
      var U = UNITS[un], seen = 0, dup = 0;
      for (var k = 0; k < 9; k++) {
        var v = values[U[k]];
        if (!v) continue;
        var b = 1 << (v - 1);
        if (seen & b) dup |= b;
        seen |= b;
      }
      if (dup) for (k = 0; k < 9; k++) if (values[U[k]] && (dup & (1 << (values[U[k]] - 1)))) out[U[k]] = 1;
    }
    return out;
  }

  /* Candidate masks for every empty cell, from the digits on the board. */
  function candidates(values) {
    var c = new Uint16Array(81);
    for (var k = 0; k < 81; k++) {
      if (values[k]) continue;
      var used = 0, P = PEERS[k];
      for (var p = 0; p < 20; p++) { var v = values[P[p]]; if (v) used |= 1 << (v - 1); }
      c[k] = ~used & ALL;
    }
    return c;
  }

  // ---------- bitmask backtracking solver ----------

  /*
   * Counts solutions up to `limit` (default 2, which is all a uniqueness
   * check needs). The first solution is copied into `out` when given.
   * Minimum-remaining-values ordering with row/column/box bitmasks; a
   * 17-clue puzzle takes a few milliseconds.
   */
  function countSolutions(grid, limit, out) {
    limit = limit || 2;
    var g = new Uint8Array(81);
    var rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
    var empties = new Uint8Array(81), n = 0, k;
    for (k = 0; k < 81; k++) {
      var v = grid[k] | 0;
      if (v) {
        var b = 1 << (v - 1);
        if ((rows[ROW[k]] | cols[COL[k]] | boxes[BOX[k]]) & b) return 0;
        rows[ROW[k]] |= b; cols[COL[k]] |= b; boxes[BOX[k]] |= b;
        g[k] = v;
      } else empties[n++] = k;
    }
    var count = 0;
    function rec(depth) {
      if (depth === n) {
        count++;
        if (out && count === 1) for (var q = 0; q < 81; q++) out[q] = g[q];
        return count >= limit;
      }
      var bestK = -1, bestMask = 0, bestC = 10;
      for (var x = depth; x < n; x++) {
        var c = empties[x];
        var m = ~(rows[ROW[c]] | cols[COL[c]] | boxes[BOX[c]]) & ALL;
        var pc = POP[m];
        if (pc < bestC) { bestC = pc; bestK = x; bestMask = m; if (pc < 2) break; }
      }
      if (bestC === 0) return false;
      var cell = empties[bestK];
      empties[bestK] = empties[depth];
      empties[depth] = cell;
      var r = ROW[cell], co = COL[cell], bx = BOX[cell];
      while (bestMask) {
        var bit = bestMask & -bestMask;
        bestMask ^= bit;
        rows[r] |= bit; cols[co] |= bit; boxes[bx] |= bit;
        g[cell] = BIT_DIGIT[bit];
        if (rec(depth + 1)) return true;
        rows[r] ^= bit; cols[co] ^= bit; boxes[bx] ^= bit;
      }
      g[cell] = 0;
      return false;
    }
    rec(0);
    return count;
  }

  function solve(grid) {
    var out = new Array(81);
    return countSolutions(grid, 1, out) === 1 ? out : null;
  }

  function hasUniqueSolution(grid) { return countSolutions(grid, 2) === 1; }

  /* A uniformly shuffled complete grid. */
  function randomSolution(rng) {
    var g = new Uint8Array(81), k, d;
    // The three diagonal boxes never constrain each other: fill them freely.
    for (var b = 0; b < 3; b++) {
      var digs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
      k = 0;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) g[(b * 3 + r) * 9 + b * 3 + c] = digs[k++];
    }
    var rows = new Uint16Array(9), cols = new Uint16Array(9), boxes = new Uint16Array(9);
    var empties = [];
    for (k = 0; k < 81; k++) {
      if (g[k]) { d = 1 << (g[k] - 1); rows[ROW[k]] |= d; cols[COL[k]] |= d; boxes[BOX[k]] |= d; }
      else empties.push(k);
    }
    var n = empties.length;
    function rec(depth) {
      if (depth === n) return true;
      var bestK = -1, bestMask = 0, bestC = 10;
      for (var x = depth; x < n; x++) {
        var c = empties[x];
        var m = ~(rows[ROW[c]] | cols[COL[c]] | boxes[BOX[c]]) & ALL;
        if (POP[m] < bestC) { bestC = POP[m]; bestK = x; bestMask = m; if (bestC < 2) break; }
      }
      if (bestC === 0) return false;
      var cell = empties[bestK];
      empties[bestK] = empties[depth];
      empties[depth] = cell;
      var opts = shuffle(digitsOf(bestMask), rng);
      for (var o = 0; o < opts.length; o++) {
        var bit = 1 << (opts[o] - 1);
        rows[ROW[cell]] |= bit; cols[COL[cell]] |= bit; boxes[BOX[cell]] |= bit;
        g[cell] = opts[o];
        if (rec(depth + 1)) return true;
        rows[ROW[cell]] ^= bit; cols[COL[cell]] ^= bit; boxes[BOX[cell]] ^= bit;
      }
      g[cell] = 0;
      return false;
    }
    rec(0);
    return Array.prototype.slice.call(g);
  }

  // ---------- human-style solver ----------

  function makeState(grid) {
    var g = new Uint8Array(81), empty = 0, k;
    for (k = 0; k < 81; k++) { g[k] = grid[k] | 0; if (!g[k]) empty++; }
    return { g: g, c: candidates(g), empty: empty };
  }
  function cloneState(s) { return { g: new Uint8Array(s.g), c: new Uint16Array(s.c), empty: s.empty }; }
  function placeDigit(s, cell, d) {
    s.g[cell] = d;
    s.c[cell] = 0;
    s.empty--;
    var nb = ~(1 << (d - 1)), P = PEERS[cell];
    for (var p = 0; p < 20; p++) s.c[P[p]] &= nb;
  }
  function applyStep(s, st) {
    if (st.place) placeDigit(s, st.place[0], st.place[1]);
    else for (var e = 0; e < st.elim.length; e++) s.c[st.elim[e][0]] &= ~(1 << (st.elim[e][1] - 1));
  }

  /* Calls fn on each k-subset of arr (the same array object, reused); stops at the first truthy result. */
  function combos(arr, k, fn) {
    var pick = new Array(k), n = arr.length;
    function rec(start, depth) {
      if (depth === k) return fn(pick);
      for (var x = start; x <= n - (k - depth); x++) {
        pick[depth] = arr[x];
        var r = rec(x + 1, depth + 1);
        if (r) return r;
      }
      return null;
    }
    return rec(0, 0);
  }

  function elimFrom(s, cells, mask, skip) {
    var out = [];
    for (var x = 0; x < cells.length; x++) {
      var c = cells[x];
      if (skip && skip(c)) continue;
      var hit = s.c[c] & mask;
      while (hit) { var b = hit & -hit; hit ^= b; out.push([c, BIT_DIGIT[b]]); }
    }
    return out;
  }

  // Tier 1: singles.

  function findFullHouse(s) {
    for (var x = 0; x < 27; x++) {
      var un = UNIT_ORDER[x], U = UNITS[un], cnt = 0, cell = -1;
      for (var k = 0; k < 9; k++) if (!s.g[U[k]]) { cnt++; cell = U[k]; }
      if (cnt === 1 && POP[s.c[cell]] === 1) return { place: [cell, BIT_DIGIT[s.c[cell]]], unit: un, cells: U.slice() };
    }
    return null;
  }

  function findHiddenSingle(s) {
    for (var x = 0; x < 27; x++) {
      var un = UNIT_ORDER[x], U = UNITS[un], once = 0, twice = 0, k;
      for (k = 0; k < 9; k++) { var m = s.c[U[k]]; twice |= once & m; once |= m; }
      var only = once & ~twice;
      if (!only) continue;
      var bit = only & -only;
      for (k = 0; k < 9; k++) {
        if (s.c[U[k]] & bit) return { place: [U[k], BIT_DIGIT[bit]], unit: un, digit: BIT_DIGIT[bit], cells: U.slice() };
      }
    }
    return null;
  }

  function findNakedSingle(s) {
    for (var k = 0; k < 81; k++) {
      if (!s.g[k] && POP[s.c[k]] === 1) return { place: [k, BIT_DIGIT[s.c[k]]], cells: PEERS[k].concat([k]) };
    }
    return null;
  }

  // Tier 2: locked candidates and small subsets.

  function findLockedCandidates(s) {
    var un, d, bit, k, cells, U, elim;
    // Pointing: a digit confined to one line inside a box.
    for (var b = 0; b < 9; b++) {
      U = UNITS[18 + b];
      for (d = 1; d <= 9; d++) {
        bit = 1 << (d - 1);
        cells = [];
        for (k = 0; k < 9; k++) if (s.c[U[k]] & bit) cells.push(U[k]);
        if (cells.length < 2 || cells.length > 3) continue;
        var sameRow = true, sameCol = true;
        for (k = 1; k < cells.length; k++) {
          if (ROW[cells[k]] !== ROW[cells[0]]) sameRow = false;
          if (COL[cells[k]] !== COL[cells[0]]) sameCol = false;
        }
        var lines = [];
        if (sameRow) lines.push(ROW[cells[0]]);
        if (sameCol) lines.push(9 + COL[cells[0]]);
        for (var l = 0; l < lines.length; l++) {
          elim = elimFrom(s, UNITS[lines[l]], bit, function (c) { return BOX[c] === b; });
          if (elim.length) return { elim: elim, digit: d, unit: 18 + b, unit2: lines[l], cells: cells, sub: 'pointing' };
        }
      }
    }
    // Claiming: a digit confined to one box inside a line.
    for (un = 0; un < 18; un++) {
      U = UNITS[un];
      for (d = 1; d <= 9; d++) {
        bit = 1 << (d - 1);
        cells = [];
        for (k = 0; k < 9; k++) if (s.c[U[k]] & bit) cells.push(U[k]);
        if (cells.length < 2 || cells.length > 3) continue;
        var bx = BOX[cells[0]], same = true;
        for (k = 1; k < cells.length; k++) if (BOX[cells[k]] !== bx) same = false;
        if (!same) continue;
        var line = un;
        elim = elimFrom(s, UNITS[18 + bx], bit, function (c) { return line < 9 ? ROW[c] === line : COL[c] === line - 9; });
        if (elim.length) return { elim: elim, digit: d, unit: un, unit2: 18 + bx, cells: cells, sub: 'claiming' };
      }
    }
    return null;
  }

  function findNakedSubset(s, size) {
    for (var x = 0; x < 27; x++) {
      var un = UNIT_ORDER[x], U = UNITS[un], pool = [], empty = 0;
      for (var k = 0; k < 9; k++) {
        var c = U[k];
        if (s.g[c]) continue;
        empty++;
        if (POP[s.c[c]] >= 2 && POP[s.c[c]] <= size) pool.push(c);
      }
      if (pool.length < size || empty <= size) continue;
      var found = combos(pool, size, function (pick) {
        var m = 0;
        for (var q = 0; q < size; q++) m |= s.c[pick[q]];
        if (POP[m] !== size) return null;
        var inPick = pick.slice();
        var elim = elimFrom(s, U, m, function (cc) { return s.g[cc] || inPick.indexOf(cc) >= 0; });
        return elim.length ? { elim: elim, unit: un, cells: inPick, digits: digitsOf(m) } : null;
      });
      if (found) return found;
    }
    return null;
  }

  function findHiddenSubset(s, size) {
    for (var x = 0; x < 27; x++) {
      var un = UNIT_ORDER[x], U = UNITS[un], digs = [], pos = {}, free = 0;
      for (var d = 1; d <= 9; d++) {
        var bit = 1 << (d - 1), pm = 0;
        for (var k = 0; k < 9; k++) if (s.c[U[k]] & bit) pm |= 1 << k;
        if (pm) free++;
        if (POP[pm] >= 2 && POP[pm] <= size) { digs.push(d); pos[d] = pm; }
      }
      if (digs.length < size || free <= size) continue;
      var found = combos(digs, size, function (pick) {
        var pm = 0, dm = 0;
        for (var q = 0; q < size; q++) { pm |= pos[pick[q]]; dm |= 1 << (pick[q] - 1); }
        if (POP[pm] !== size) return null;
        var cells = [], elim = [];
        for (var k2 = 0; k2 < 9; k2++) {
          if (!(pm & (1 << k2))) continue;
          var c = U[k2];
          cells.push(c);
          var extra = s.c[c] & ~dm;
          while (extra) { var b = extra & -extra; extra ^= b; elim.push([c, BIT_DIGIT[b]]); }
        }
        return elim.length ? { elim: elim, unit: un, cells: cells, digits: pick.slice() } : null;
      });
      if (found) return found;
    }
    return null;
  }

  // Tier 3 and 4: fish, wings, chains, colouring.

  /* X-Wing (2), Swordfish (3), Jellyfish (4). */
  function findFish(s, size) {
    for (var d = 1; d <= 9; d++) {
      var bit = 1 << (d - 1);
      for (var orient = 0; orient < 2; orient++) {
        // orient 0: base lines are rows and the cover lines columns.
        var bases = [], masks = {};
        for (var a = 0; a < 9; a++) {
          var m = 0;
          for (var b = 0; b < 9; b++) {
            var cell = orient ? b * 9 + a : a * 9 + b;
            if (s.c[cell] & bit) m |= 1 << b;
          }
          if (POP[m] >= 2 && POP[m] <= size) { bases.push(a); masks[a] = m; }
        }
        if (bases.length < size) continue;
        var found = combos(bases, size, function (pick) {
          var cover = 0, q;
          for (q = 0; q < size; q++) cover |= masks[pick[q]];
          if (POP[cover] !== size) return null;
          var elim = [], cells = [];
          for (var y = 0; y < 9; y++) {
            if (!(cover & (1 << y))) continue;
            for (var x = 0; x < 9; x++) {
              var c = orient ? y * 9 + x : x * 9 + y;
              if (!(s.c[c] & bit)) continue;
              if (pick.indexOf(x) >= 0) cells.push(c);
              else elim.push([c, d]);
            }
          }
          if (!elim.length) return null;
          var lines = [];
          for (q = 0; q < size; q++) lines.push(orient ? 9 + pick[q] : pick[q]);
          return { elim: elim, digit: d, cells: cells, lines: lines, orient: orient };
        });
        if (found) return found;
      }
    }
    return null;
  }

  /* Lines where digit d has exactly two places: [line, cellA, cellB]. */
  function strongLines(s, bit, from, to) {
    var out = [];
    for (var un = from; un < to; un++) {
      var U = UNITS[un], a = -1, b = -1, n = 0;
      for (var k = 0; k < 9; k++) {
        if (s.c[U[k]] & bit) { n++; if (a < 0) a = U[k]; else b = U[k]; }
      }
      if (n === 2) out.push([un, a, b]);
    }
    return out;
  }

  function commonElim(s, d, ends, exclude) {
    var bit = 1 << (d - 1), elim = [];
    for (var c = 0; c < 81; c++) {
      if (!(s.c[c] & bit) || exclude.indexOf(c) >= 0) continue;
      var ok = true;
      for (var e = 0; e < ends.length; e++) if (!sees(c, ends[e])) { ok = false; break; }
      if (ok) elim.push([c, d]);
    }
    return elim;
  }

  function findSkyscraper(s) {
    for (var d = 1; d <= 9; d++) {
      var bit = 1 << (d - 1);
      for (var orient = 0; orient < 2; orient++) {
        var L = orient ? strongLines(s, bit, 9, 18) : strongLines(s, bit, 0, 9);
        var pos = orient ? ROW : COL; // position of a cell along the line
        for (var x = 0; x < L.length; x++) {
          for (var y = x + 1; y < L.length; y++) {
            var p = L[x], q = L[y];
            for (var i1 = 1; i1 <= 2; i1++) {
              for (var i2 = 1; i2 <= 2; i2++) {
                var baseP = p[i1], baseQ = q[i2], roofP = p[3 - i1], roofQ = q[3 - i2];
                if (pos[baseP] !== pos[baseQ] || pos[roofP] === pos[roofQ]) continue;
                var elim = commonElim(s, d, [roofP, roofQ], [baseP, baseQ, roofP, roofQ]);
                if (elim.length) return { elim: elim, digit: d, cells: [baseP, roofP, baseQ, roofQ], lines: [p[0], q[0]] };
              }
            }
          }
        }
      }
    }
    return null;
  }

  function findTwoStringKite(s) {
    for (var d = 1; d <= 9; d++) {
      var bit = 1 << (d - 1);
      var R = strongLines(s, bit, 0, 9), C = strongLines(s, bit, 9, 18);
      for (var x = 0; x < R.length; x++) {
        for (var y = 0; y < C.length; y++) {
          for (var a = 1; a <= 2; a++) {
            for (var b = 1; b <= 2; b++) {
              var A = R[x][a], X = R[x][3 - a], B = C[y][b], Y = C[y][3 - b];
              if (A === B || BOX[A] !== BOX[B]) continue;
              if (X === B || Y === A || X === Y || BOX[X] === BOX[A] || BOX[Y] === BOX[A]) continue;
              var T = ROW[Y] * 9 + COL[X];
              if (T === X || T === Y || !(s.c[T] & bit)) continue;
              return { elim: [[T, d]], digit: d, cells: [X, A, B, Y], lines: [R[x][0], C[y][0]] };
            }
          }
        }
      }
    }
    return null;
  }

  function bivalueCells(s) {
    var out = [];
    for (var k = 0; k < 81; k++) if (POP[s.c[k]] === 2) out.push(k);
    return out;
  }

  function findXYWing(s) {
    var bv = bivalueCells(s);
    for (var x = 0; x < bv.length; x++) {
      var P = bv[x], pm = s.c[P];
      for (var y = 0; y < bv.length; y++) {
        var A = bv[y];
        if (A === P || !sees(P, A)) continue;
        var shared = s.c[A] & pm;
        if (POP[shared] !== 1) continue;
        var z = s.c[A] & ~pm;
        var want = (pm & ~shared) | z;
        for (var w = 0; w < bv.length; w++) {
          var B = bv[w];
          if (B === P || B === A || s.c[B] !== want || !sees(P, B)) continue;
          var zd = BIT_DIGIT[z];
          var elim = commonElim(s, zd, [A, B], [P, A, B]);
          if (elim.length) return { elim: elim, digit: zd, cells: [A, P, B], pivot: P };
        }
      }
    }
    return null;
  }

  function findXYZWing(s) {
    var bv = bivalueCells(s);
    for (var P = 0; P < 81; P++) {
      var pm = s.c[P];
      if (POP[pm] !== 3) continue;
      for (var x = 0; x < bv.length; x++) {
        var A = bv[x];
        if ((s.c[A] & ~pm) || !sees(P, A)) continue;
        for (var y = x + 1; y < bv.length; y++) {
          var B = bv[y];
          if ((s.c[B] & ~pm) || s.c[B] === s.c[A] || !sees(P, B)) continue;
          var z = s.c[A] & s.c[B];
          if (POP[z] !== 1) continue;
          var zd = BIT_DIGIT[z];
          var elim = commonElim(s, zd, [P, A, B], [P, A, B]);
          if (elim.length) return { elim: elim, digit: zd, cells: [A, P, B], pivot: P };
        }
      }
    }
    return null;
  }

  function findWWing(s) {
    var bv = bivalueCells(s);
    for (var x = 0; x < bv.length; x++) {
      for (var y = x + 1; y < bv.length; y++) {
        var A = bv[x], B = bv[y];
        if (s.c[A] !== s.c[B] || sees(A, B)) continue;
        var ds = digitsOf(s.c[A]);
        for (var k = 0; k < 2; k++) {
          var w = ds[k], o = ds[1 - k], L = strongLines(s, 1 << (w - 1), 0, 27);
          for (var l = 0; l < L.length; l++) {
            var L1 = L[l][1], L2 = L[l][2];
            if (L1 === A || L1 === B || L2 === A || L2 === B) continue;
            if ((sees(L1, A) && sees(L2, B)) || (sees(L1, B) && sees(L2, A))) {
              var elim = commonElim(s, o, [A, B], [A, B]);
              if (elim.length) return { elim: elim, digit: o, link: w, cells: [A, L1, L2, B], unit: L[l][0] };
            }
          }
        }
      }
    }
    return null;
  }

  function findSimpleColoring(s) {
    for (var d = 1; d <= 9; d++) {
      var bit = 1 << (d - 1);
      var L = strongLines(s, bit, 0, 27);
      if (L.length < 2) continue;
      var adj = {}, k;
      for (k = 0; k < L.length; k++) {
        var a = L[k][1], b = L[k][2];
        (adj[a] = adj[a] || []).push(b);
        (adj[b] = adj[b] || []).push(a);
      }
      var color = new Int8Array(81).fill(-1), done = new Uint8Array(81);
      for (var start in adj) {
        start = +start;
        if (done[start]) continue;
        // Two-colour this chain of conjugate pairs.
        var comp = [start], queue = [start];
        color[start] = 0; done[start] = 1;
        while (queue.length) {
          var cur = queue.shift(), nb = adj[cur];
          for (var q = 0; q < nb.length; q++) {
            if (done[nb[q]]) continue;
            done[nb[q]] = 1;
            color[nb[q]] = 1 - color[cur];
            comp.push(nb[q]);
            queue.push(nb[q]);
          }
        }
        if (comp.length < 4) continue;
        // Colour wrap: two cells of one colour in a unit means that colour is false.
        for (var c1 = 0; c1 < comp.length; c1++) {
          for (var c2 = c1 + 1; c2 < comp.length; c2++) {
            if (color[comp[c1]] === color[comp[c2]] && sees(comp[c1], comp[c2])) {
              var bad = color[comp[c1]], elim = [];
              for (k = 0; k < comp.length; k++) if (color[comp[k]] === bad) elim.push([comp[k], d]);
              return { elim: elim, digit: d, cells: comp.slice(), colors: comp.map(function (c) { return color[c]; }), sub: 'wrap' };
            }
          }
        }
        // Colour trap: a cell that sees both colours cannot hold d.
        var trap = [];
        for (var c = 0; c < 81; c++) {
          if (!(s.c[c] & bit) || comp.indexOf(c) >= 0) continue;
          var see0 = false, see1 = false;
          for (k = 0; k < comp.length; k++) {
            if (sees(c, comp[k])) { if (color[comp[k]]) see1 = true; else see0 = true; }
          }
          if (see0 && see1) trap.push([c, d]);
        }
        if (trap.length) return { elim: trap, digit: d, cells: comp.slice(), colors: comp.map(function (c) { return color[c]; }), sub: 'trap' };
      }
    }
    return null;
  }

  /*
   * XY-Chain: bivalue cells linked through shared digits. If the first cell
   * is not z, every link is forced down the chain until the last cell is z,
   * so cells that see both ends cannot be z. Breadth-first over
   * (cell, forced digit) states, so it finds the shortest chain.
   */
  function findXYChain(s) {
    var bv = bivalueCells(s);
    if (bv.length < 3) return null;
    for (var x = 0; x < bv.length; x++) {
      var S = bv[x], ds = digitsOf(s.c[S]);
      for (var k = 0; k < 2; k++) {
        var z = ds[k], first = ds[1 - k];
        var prev = {}, seen = {}, queue = [[S, first]];
        seen[S * 10 + first] = 1;
        while (queue.length) {
          var st = queue.shift(), cur = st[0], v = st[1], vb = 1 << (v - 1);
          for (var y = 0; y < bv.length; y++) {
            var N = bv[y];
            if (N === cur || !(s.c[N] & vb) || !sees(cur, N)) continue;
            var w = BIT_DIGIT[s.c[N] & ~vb], key = N * 10 + w;
            if (seen[key]) continue;
            seen[key] = 1;
            prev[key] = cur * 10 + v;
            if (w === z && N !== S) {
              var chain = [N], pk = prev[key];
              while (pk !== undefined) { chain.unshift((pk / 10) | 0); pk = prev[pk]; }
              if (chain.length >= 4) {
                var elim = commonElim(s, z, [S, N], [S, N]);
                if (elim.length) return { elim: elim, digit: z, cells: chain };
              }
            }
            queue.push([N, w]);
          }
        }
      }
    }
    return null;
  }

  var TECHNIQUES = [
    { id: 'fullHouse', name: 'Full house', tier: 1, fn: findFullHouse },
    { id: 'hiddenSingle', name: 'Hidden single', tier: 1, fn: findHiddenSingle },
    { id: 'nakedSingle', name: 'Naked single', tier: 1, fn: findNakedSingle },
    { id: 'lockedCandidates', name: 'Locked candidates', tier: 2, fn: findLockedCandidates },
    { id: 'nakedPair', name: 'Naked pair', tier: 2, fn: function (s) { return findNakedSubset(s, 2); } },
    { id: 'hiddenPair', name: 'Hidden pair', tier: 2, fn: function (s) { return findHiddenSubset(s, 2); } },
    { id: 'nakedTriple', name: 'Naked triple', tier: 2, fn: function (s) { return findNakedSubset(s, 3); } },
    { id: 'hiddenTriple', name: 'Hidden triple', tier: 2, fn: function (s) { return findHiddenSubset(s, 3); } },
    { id: 'xWing', name: 'X-Wing', tier: 3, fn: function (s) { return findFish(s, 2); } },
    { id: 'skyscraper', name: 'Skyscraper', tier: 3, fn: findSkyscraper },
    { id: 'twoStringKite', name: '2-String Kite', tier: 3, fn: findTwoStringKite },
    { id: 'nakedQuad', name: 'Naked quad', tier: 3, fn: function (s) { return findNakedSubset(s, 4); } },
    { id: 'hiddenQuad', name: 'Hidden quad', tier: 3, fn: function (s) { return findHiddenSubset(s, 4); } },
    { id: 'xyWing', name: 'XY-Wing', tier: 3, fn: findXYWing },
    { id: 'xyzWing', name: 'XYZ-Wing', tier: 3, fn: findXYZWing },
    { id: 'swordfish', name: 'Swordfish', tier: 4, fn: function (s) { return findFish(s, 3); } },
    { id: 'simpleColoring', name: 'Simple colouring', tier: 4, fn: findSimpleColoring },
    { id: 'wWing', name: 'W-Wing', tier: 4, fn: findWWing },
    { id: 'xyChain', name: 'XY-Chain', tier: 4, fn: findXYChain },
    { id: 'jellyfish', name: 'Jellyfish', tier: 4, fn: function (s) { return findFish(s, 4); } }
  ];
  var TECH_BY_ID = {};
  TECHNIQUES.forEach(function (t) { TECH_BY_ID[t.id] = t; });

  function nextStep(s, maxTier) {
    for (var t = 0; t < TECHNIQUES.length; t++) {
      var T = TECHNIQUES[t];
      if (T.tier > maxTier) break;
      var st = T.fn(s);
      if (st) { st.tech = T.id; st.name = T.name; st.tier = T.tier; return st; }
    }
    return null;
  }

  /*
   * Solves like a person: always the easiest technique that makes progress.
   * Returns whether it got there and the hardest tier it needed. With sound
   * techniques only, reaching the end also proves the solution is unique.
   */
  function logicSolve(grid, maxTier, keepSteps) {
    var s = makeState(grid);
    var used = 0, counts = {}, steps = keepSteps ? [] : null, score = 0;
    maxTier = maxTier || 4;
    while (s.empty > 0) {
      var st = nextStep(s, maxTier);
      if (!st) break;
      if (st.tier > used) used = st.tier;
      counts[st.tech] = (counts[st.tech] || 0) + 1;
      score += st.tier === 1 ? 1 : st.tier === 2 ? 6 : st.tier === 3 ? 20 : 45;
      if (steps) steps.push(st);
      applyStep(s, st);
    }
    return { solved: s.empty === 0, tier: used, counts: counts, steps: steps, score: score, grid: s.g };
  }

  function grade(grid) {
    var r = logicSolve(grid, 4);
    return { solved: r.solved, tier: r.solved ? r.tier : 5, counts: r.counts, score: r.score };
  }

  // ---------- generator ----------

  var LEVELS = ['easy', 'medium', 'hard', 'expert'];
  var LEVEL_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' };
  // tier: the hardest technique tier the puzzle must need. dig: holes are
  // dug while the puzzle stays solvable with techniques up to this tier (0:
  // while the solution stays unique, which digs deeper). clues: the range
  // of givens to put back up to once the puzzle is graded.
  var LEVEL_CFG = {
    easy: { tier: 1, dig: 1, clues: [36, 40] },
    medium: { tier: 2, dig: 2, clues: [30, 33] },
    hard: { tier: 3, dig: 0, clues: [26, 29], maxClues: 28 },
    expert: { tier: 4, dig: 0, clues: [22, 26], maxClues: 26 }
  };

  /* Groups of cells that are removed together so the clue pattern stays symmetric. */
  function symmetryGroups(kind) {
    var groups = [], taken = new Uint8Array(81);
    for (var c = 0; c < 81; c++) {
      if (taken[c]) continue;
      var r = ROW[c], co = COL[c], mate;
      if (kind === 'mirror') mate = r * 9 + (8 - co);
      else if (kind === 'diagonal') mate = co * 9 + r;
      else mate = 80 - c; // 180-degree rotation
      taken[c] = taken[mate] = 1;
      groups.push(c === mate ? [c] : [c, mate]);
    }
    return groups;
  }
  var SYMMETRIES = ['rotational', 'rotational', 'rotational', 'mirror', 'diagonal'];

  function clueCount(g) {
    var n = 0;
    for (var k = 0; k < 81; k++) if (g[k]) n++;
    return n;
  }

  /*
   * One try: a random full grid, then dig symmetric holes as long as the
   * puzzle stays solvable with techniques up to the level's dig tier (which
   * also keeps the solution unique) or, for the hard levels, simply unique.
   * Then grade it, and put a few clues back to reach the level's clue range
   * as long as it still needs the same tier. ok is false when the dug puzzle
   * came out too easy, too hard or with too many clues.
   */
  function generateAttempt(level, rng) {
    var cfg = LEVEL_CFG[level];
    var solution = randomSolution(rng);
    var puzzle = solution.slice();
    var symmetry = SYMMETRIES[(rng() * SYMMETRIES.length) | 0];
    var groups = shuffle(symmetryGroups(symmetry), rng);
    var removed = [], k, x;
    for (x = 0; x < groups.length; x++) {
      var grp = groups[x];
      for (k = 0; k < grp.length; k++) puzzle[grp[k]] = 0;
      var ok = cfg.dig ? logicSolve(puzzle, cfg.dig).solved : countSolutions(puzzle, 2) === 1;
      if (ok) removed.push(grp);
      else for (k = 0; k < grp.length; k++) puzzle[grp[k]] = solution[grp[k]];
    }
    var g = logicSolve(puzzle, 4);
    var tier = g.solved ? g.tier : 5;
    if (tier !== cfg.tier || (cfg.maxClues && clueCount(puzzle) > cfg.maxClues)) {
      return { ok: false, puzzle: puzzle, solution: solution, tier: tier, score: g.score, symmetry: symmetry };
    }
    // Put clues back (random symmetric groups) while the puzzle keeps needing its tier.
    var lo = cfg.clues[0], hi = cfg.clues[1];
    var target = lo + ((rng() * (hi - lo + 1)) | 0);
    shuffle(removed, rng);
    var clues = clueCount(puzzle);
    for (x = 0; x < removed.length && clues < target; x++) {
      var grp2 = removed[x];
      if (clues + grp2.length > hi) continue;
      for (k = 0; k < grp2.length; k++) puzzle[grp2[k]] = solution[grp2[k]];
      var g2 = logicSolve(puzzle, 4);
      if (g2.solved && g2.tier === cfg.tier) { clues += grp2.length; g = g2; }
      else for (k = 0; k < grp2.length; k++) puzzle[grp2[k]] = 0;
    }
    return { ok: true, puzzle: puzzle, solution: solution, tier: g.tier, score: g.score, counts: g.counts, symmetry: symmetry };
  }

  /*
   * Generator object so callers can run attempts in slices (the page's
   * no-Worker fallback) or all at once. Deterministic for a given seed: the
   * daily puzzle comes out the same everywhere because attempts are bounded
   * by count, never by time.
   */
  function createGenerator(level, seed, maxAttempts) {
    if (!LEVEL_CFG[level]) level = 'medium';
    var rng = makeRng(seed);
    var attempts = 0, best = null, cfg = LEVEL_CFG[level];
    maxAttempts = maxAttempts || 400;
    function finish(r) {
      return {
        puzzle: toString(r.puzzle), solution: toString(r.solution), level: level,
        tier: r.tier, clues: clueCount(r.puzzle), attempts: attempts, symmetry: r.symmetry,
        exact: !!r.ok, seed: String(seed)
      };
    }
    return {
      step: function () {
        attempts++;
        var r = generateAttempt(level, rng);
        if (r.ok) return finish(r);
        // Remember the closest miss as a fallback: the right tier with too
        // many clues, else the hardest puzzle below the target.
        if (r.tier <= cfg.tier) {
          r.rank = r.tier * 1000 + r.score - clueCount(r.puzzle) * 5;
          if (!best || r.rank > best.rank) best = r;
        }
        if (attempts >= maxAttempts && best) { best.ok = false; return finish(best); }
        return null;
      },
      get attempts() { return attempts; }
    };
  }

  function generate(level, seed, maxAttempts) {
    var gen = createGenerator(level, seed, maxAttempts);
    for (;;) { var r = gen.step(); if (r) return r; }
  }

  // ---------- daily puzzle ----------

  var DAILY_LEVELS = ['hard', 'easy', 'medium', 'medium', 'hard', 'hard', 'expert']; // Sunday first

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  /* The same key gives the same puzzle on every device. */
  function dailyInfo(key) {
    var p = key.split('-');
    var wd = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])).getUTCDay();
    return { key: key, level: DAILY_LEVELS[wd], seed: 'open-arcade-sudoku-daily-' + key };
  }

  // ---------- hints ----------

  function lc(str) { return str.charAt(0).toLowerCase() + str.slice(1); }
  function list(arr) {
    if (arr.length < 2) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  /* One-sentence description of a step, for the hint bar. */
  function describeStep(st) {
    var d = st.digit, el = st.elim || [];
    var elimCells = list(uniq(el.map(function (e) { return cellName(e[0]); })).slice(0, 4)) + (el.length > 4 ? '…' : '');
    var elimDigits = list(uniq(el.map(function (e) { return e[1]; })));
    switch (st.tech) {
      case 'fullHouse':
        return 'Full house: ' + cellName(st.place[0]) + ' is the last empty cell in ' + unitName(st.unit) + ', so it is ' + st.place[1] + '.';
      case 'hiddenSingle':
        return 'Hidden single: in ' + unitName(st.unit) + ', ' + st.place[1] + ' fits only in ' + cellName(st.place[0]) + '.';
      case 'nakedSingle':
        return 'Naked single: ' + cellName(st.place[0]) + ' can only be ' + st.place[1] + '; every other digit is already in its row, column or box.';
      case 'lockedCandidates':
        return (st.sub === 'pointing' ? 'Pointing' : 'Claiming') + ': in ' + unitName(st.unit) + ' the ' + d + 's are all in ' +
          unitName(st.unit2) + ', so ' + d + ' is ruled out of ' + elimCells + '.';
      case 'nakedPair': case 'nakedTriple': case 'nakedQuad':
        return st.name + ' ' + st.digits.join('/') + ' in ' + unitName(st.unit) + ' (' + list(st.cells.map(cellName)) + ') rules ' +
          elimDigits + ' out of ' + elimCells + '.';
      case 'hiddenPair': case 'hiddenTriple': case 'hiddenQuad':
        return st.name + ' ' + st.digits.join('/') + ' in ' + unitName(st.unit) + ': those digits fit only in ' + list(st.cells.map(cellName)) +
          ', so ' + elimDigits + ' can go from there.';
      case 'xWing': case 'swordfish': case 'jellyfish':
        return st.name + ' on ' + d + ' in ' + list(st.lines.map(unitName)) + ' rules ' + d + ' out of ' + elimCells + '.';
      case 'skyscraper': case 'twoStringKite':
        return st.name + ' on ' + d + ' (' + list(st.cells.map(cellName)) + ') rules ' + d + ' out of ' + elimCells + '.';
      case 'xyWing': case 'xyzWing':
        return st.name + ' with pivot ' + cellName(st.pivot) + ' rules ' + d + ' out of ' + elimCells + '.';
      case 'wWing':
        return 'W-Wing: ' + cellName(st.cells[0]) + ' and ' + cellName(st.cells[3]) + ' are joined by a strong link on ' + st.link +
          ', so ' + d + ' is ruled out of ' + elimCells + '.';
      case 'simpleColoring':
        return 'Simple colouring on ' + d + ' rules ' + d + ' out of ' + elimCells + '.';
      case 'xyChain':
        return 'XY-Chain ' + st.cells.map(cellName).join('–') + ' rules ' + d + ' out of ' + elimCells + '.';
    }
    return st.name + '.';
  }
  function uniq(arr) {
    var out = [];
    for (var k = 0; k < arr.length; k++) if (out.indexOf(arr[k]) < 0) out.push(arr[k]);
    return out;
  }

  function singleAt(s, cell) {
    if (s.g[cell] || !s.c[cell]) return null;
    var cu = CELL_UNITS[cell], order = [cu[2], cu[0], cu[1]];
    for (var x = 0; x < 3; x++) {
      var U = UNITS[order[x]], empty = 0;
      for (var k = 0; k < 9; k++) if (!s.g[U[k]]) empty++;
      if (empty === 1 && POP[s.c[cell]] === 1) {
        return { tech: 'fullHouse', name: 'Full house', tier: 1, place: [cell, BIT_DIGIT[s.c[cell]]], unit: order[x], cells: U.slice() };
      }
    }
    for (x = 0; x < 3; x++) {
      var U2 = UNITS[order[x]], others = 0;
      for (k = 0; k < 9; k++) if (U2[k] !== cell) others |= s.c[U2[k]];
      var only = s.c[cell] & ~others;
      if (POP[only] === 1) {
        return { tech: 'hiddenSingle', name: 'Hidden single', tier: 1, place: [cell, BIT_DIGIT[only]], unit: order[x], digit: BIT_DIGIT[only], cells: U2.slice() };
      }
    }
    if (POP[s.c[cell]] === 1) {
      return { tech: 'nakedSingle', name: 'Naked single', tier: 1, place: [cell, BIT_DIGIT[s.c[cell]]], cells: PEERS[cell].concat([cell]) };
    }
    return null;
  }

  /*
   * The next cell to fill and why. Wrong entries are pointed out first;
   * otherwise the easiest deduction from the current board (preferring the
   * selected cell when it is a single), and if the techniques here run out,
   * the cell is simply revealed.
   * Returns {kind: 'fix'|'logic'|'reveal', cell, digit, text, cells, tech}.
   */
  function getHint(values, solution, preferCell) {
    var k;
    for (k = 0; k < 81; k++) {
      if (values[k] && values[k] !== solution[k]) {
        return { kind: 'fix', cell: k, digit: solution[k], text: 'The ' + values[k] + ' in ' + cellName(k) + ' is wrong; it should be ' + solution[k] + '.', cells: [k] };
      }
    }
    var s = makeState(values);
    if (s.empty === 0) return null;
    if (preferCell >= 0) {
      var st0 = singleAt(s, preferCell);
      if (st0 && st0.place[1] === solution[preferCell]) {
        return { kind: 'logic', cell: preferCell, digit: st0.place[1], text: describeStep(st0), cells: st0.cells, tech: st0.tech, unit: st0.unit };
      }
    }
    var pre = [];
    for (var guard = 0; guard < 40; guard++) {
      var st = nextStep(s, 4);
      if (!st) break;
      if (st.place) {
        if (st.place[1] !== solution[st.place[0]]) break;
        var text = describeStep(st);
        var cells = st.cells ? st.cells.slice() : [];
        if (pre.length === 1) text = describeStep(pre[0]) + ' Then: ' + lc(text);
        else if (pre.length > 1) {
          text = 'After ' + list(uniq(pre.map(function (p) { return p.name; }))) + ' eliminations: ' + lc(text);
        }
        for (k = 0; k < pre.length; k++) if (pre[k].cells) cells = cells.concat(pre[k].cells);
        return { kind: 'logic', cell: st.place[0], digit: st.place[1], text: text, cells: uniq(cells), tech: st.tech, unit: st.unit, pre: pre.map(function (p) { return p.tech; }) };
      }
      pre.push(st);
      applyStep(s, st);
    }
    var cell = preferCell >= 0 && !values[preferCell] ? preferCell : -1;
    if (cell < 0) {
      var bestN = 10;
      for (k = 0; k < 81; k++) if (!values[k] && POP[s.c[k]] < bestN) { bestN = POP[s.c[k]]; cell = k; }
    }
    return { kind: 'reveal', cell: cell, digit: solution[cell], text: 'Nothing simple applies here, so ' + cellName(cell) + ' is revealed: it is ' + solution[cell] + '.', cells: [cell] };
  }

  return {
    ROW: ROW, COL: COL, BOX: BOX, UNITS: UNITS, PEERS: PEERS, CELL_UNITS: CELL_UNITS, POP: POP, BIT_DIGIT: BIT_DIGIT,
    sees: sees, digitsOf: digitsOf, cellName: cellName, unitName: unitName, unitKind: unitKind,
    hashSeed: hashSeed, makeRng: makeRng, shuffle: shuffle,
    fromString: fromString, toString: toString, conflicts: conflicts, candidates: candidates,
    countSolutions: countSolutions, solve: solve, hasUniqueSolution: hasUniqueSolution, randomSolution: randomSolution,
    TECHNIQUES: TECHNIQUES, TECH_BY_ID: TECH_BY_ID, makeState: makeState, cloneState: cloneState, nextStep: nextStep,
    applyStep: applyStep, logicSolve: logicSolve, grade: grade, describeStep: describeStep,
    LEVELS: LEVELS, LEVEL_NAMES: LEVEL_NAMES, LEVEL_CFG: LEVEL_CFG, symmetryGroups: symmetryGroups,
    generateAttempt: generateAttempt, createGenerator: createGenerator, generate: generate,
    dateKey: dateKey, dailyInfo: dailyInfo, getHint: getHint, clueCount: clueCount
  };
});
