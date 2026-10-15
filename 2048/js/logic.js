/*
 * 2048 rules, with no DOM in sight so the same file runs in the browser
 * (as window.Logic2048) and in node (module.exports) for the unit tests.
 *
 * A board is a flat array of size*size cells, each null or a tile {id, v}.
 * Tiles carry ids so the renderer can slide the same element across the
 * board instead of redrawing it in its new spot.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Logic2048 = api;
})(typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var DIRECTIONS = ['up', 'right', 'down', 'left'];
  var WIN_VALUE = 2048;

  // Flat indices of line i, ordered starting from the edge the tiles move
  // toward. Walking a line in this order is what makes [2,2,2] left give
  // [4,2] rather than [2,4]: the pair nearest the wall merges first.
  function lineIndices(size, dir, i) {
    var out = [];
    for (var j = 0; j < size; j++) {
      var r, c;
      if (dir === 'left') { r = i; c = j; }
      else if (dir === 'right') { r = i; c = size - 1 - j; }
      else if (dir === 'up') { r = j; c = i; }
      else { r = size - 1 - j; c = i; } // down
      out.push(r * size + c);
    }
    return out;
  }

  // Plain-number version of one line, for tests and reasoning:
  // slideLine([2,2,2,2]) -> {line:[4,4,0,0], score:8, moved:true}
  function slideLine(values) {
    var tiles = [];
    for (var k = 0; k < values.length; k++) if (values[k]) tiles.push(values[k]);
    var out = [];
    var score = 0;
    for (var i = 0; i < tiles.length; i++) {
      if (i + 1 < tiles.length && tiles[i] === tiles[i + 1]) {
        out.push(tiles[i] * 2);
        score += tiles[i] * 2;
        i++;
      } else {
        out.push(tiles[i]);
      }
    }
    while (out.length < values.length) out.push(0);
    var moved = false;
    for (var m = 0; m < values.length; m++) if ((values[m] || 0) !== out[m]) moved = true;
    return { line: out, score: score, moved: moved };
  }

  function emptyIndices(cells) {
    var out = [];
    for (var i = 0; i < cells.length; i++) if (!cells[i]) out.push(i);
    return out;
  }

  function cloneCells(cells) {
    return cells.map(function (t) { return t ? { id: t.id, v: t.v } : null; });
  }

  function createState(size) {
    var cells = [];
    for (var i = 0; i < size * size; i++) cells.push(null);
    return { size: size, cells: cells, score: 0, moves: 0, won: false, keepPlaying: false, over: false, nextId: 1 };
  }

  // Build a state from plain values (rows of numbers, or a flat array).
  // Used by the tests and the debug hook.
  function fromValues(values, nextId) {
    var flat = Array.isArray(values[0]) ? [].concat.apply([], values) : values.slice();
    var size = Math.round(Math.sqrt(flat.length));
    if (size * size !== flat.length) throw new Error('board must be square');
    var s = createState(size);
    var id = nextId || 1;
    s.cells = flat.map(function (v) { return v ? { id: id++, v: v } : null; });
    s.nextId = id;
    s.won = maxTile(s.cells) >= WIN_VALUE;
    s.over = !canMove(s.cells, size);
    return s;
  }

  function toValues(cells) {
    return cells.map(function (t) { return t ? t.v : 0; });
  }

  function toRows(cells, size) {
    var v = toValues(cells);
    var rows = [];
    for (var r = 0; r < size; r++) rows.push(v.slice(r * size, r * size + size));
    return rows;
  }

  function maxTile(cells) {
    var m = 0;
    for (var i = 0; i < cells.length; i++) if (cells[i] && cells[i].v > m) m = cells[i].v;
    return m;
  }

  function canMove(cells, size) {
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var t = cells[r * size + c];
        if (!t) return true;
        if (c + 1 < size) { var right = cells[r * size + c + 1]; if (!right || right.v === t.v) return true; }
        if (r + 1 < size) { var below = cells[(r + 1) * size + c]; if (!below || below.v === t.v) return true; }
      }
    }
    return false;
  }

  /*
   * Slide every line toward dir. Pure: returns a new state plus what the
   * renderer needs to animate it:
   *   slides  [{id, from, to}]          surviving tiles and where they went
   *   removed [{id, from, to}]          tiles consumed by a merge (they slide
   *                                     to `to` and then vanish)
   *   merged  [{id, v, at, from:[a,b]}] the new tile each merge produced
   * No tile is spawned here; the caller does that only when moved is true.
   */
  function move(state, dir) {
    var size = state.size;
    var cells = state.cells;
    var next = [];
    for (var n = 0; n < size * size; n++) next.push(null);
    var nextId = state.nextId;
    var gained = 0;
    var moved = false;
    var slides = [];
    var removed = [];
    var merged = [];

    for (var i = 0; i < size; i++) {
      var idx = lineIndices(size, dir, i);
      var t = 0;
      var last = null; // the tile most recently placed in this line
      for (var j = 0; j < size; j++) {
        var cell = cells[idx[j]];
        if (!cell) continue;
        if (last && !last.merged && last.v === cell.v) {
          // Merge into the tile ahead. Each tile merges at most once per
          // move, so the result is marked and can't absorb a third tile.
          var nv = cell.v * 2;
          var made = { id: nextId++, v: nv };
          next[last.pos] = made;
          gained += nv;
          removed.push({ id: last.id, from: last.from, to: last.pos });
          removed.push({ id: cell.id, from: idx[j], to: last.pos });
          merged.push({ id: made.id, v: nv, at: last.pos, from: [last.id, cell.id] });
          // The tile ahead no longer survives on its own.
          slides = slides.filter(function (s) { return s.id !== last.id; });
          last.merged = true;
          moved = true;
        } else {
          var pos = idx[t++];
          next[pos] = { id: cell.id, v: cell.v };
          slides.push({ id: cell.id, from: idx[j], to: pos });
          if (pos !== idx[j]) moved = true;
          last = { id: cell.id, v: cell.v, from: idx[j], pos: pos, merged: false };
        }
      }
    }

    var out = {
      size: size,
      cells: moved ? next : cloneCells(cells),
      score: state.score + gained,
      moves: state.moves + (moved ? 1 : 0),
      won: state.won,
      keepPlaying: state.keepPlaying,
      over: state.over,
      nextId: nextId
    };
    var reachedWin = false;
    if (moved) {
      for (var k = 0; k < merged.length; k++) if (merged[k].v >= WIN_VALUE) reachedWin = true;
      if (reachedWin && !state.won) out.won = true; else reachedWin = false;
    }
    return {
      moved: moved,
      state: out,
      gained: gained,
      slides: moved ? slides : [],
      removed: moved ? removed : [],
      merged: moved ? merged : [],
      justWon: reachedWin
    };
  }

  // Drop one tile (2 at 90%, 4 at 10%) in a random empty cell. Mutates the
  // state it is given and returns the new tile with its index, or null.
  function spawn(state, rng) {
    rng = rng || Math.random;
    var empty = emptyIndices(state.cells);
    if (!empty.length) return null;
    var at = empty[Math.min(empty.length - 1, Math.floor(rng() * empty.length))];
    var v = rng() < 0.9 ? 2 : 4;
    var tile = { id: state.nextId++, v: v };
    state.cells[at] = tile;
    return { id: tile.id, v: v, at: at };
  }

  function newGame(size, rng) {
    var s = createState(size);
    spawn(s, rng);
    spawn(s, rng);
    return s;
  }

  return {
    DIRECTIONS: DIRECTIONS,
    WIN_VALUE: WIN_VALUE,
    lineIndices: lineIndices,
    slideLine: slideLine,
    emptyIndices: emptyIndices,
    cloneCells: cloneCells,
    createState: createState,
    fromValues: fromValues,
    toValues: toValues,
    toRows: toRows,
    maxTile: maxTile,
    canMove: canMove,
    move: move,
    spawn: spawn,
    newGame: newGame
  };
});
