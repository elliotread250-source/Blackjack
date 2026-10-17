/* Connect 4 rules: the 7x6 board, dropping discs, wins, draws and undo.
 * Pure functions and plain data, no DOM, so the page, the tests and the bot
 * worker all share it. Cells are indexed row * 7 + col with row 0 at the
 * bottom. Players are 1 (red) and 2 (yellow); 0 is an empty cell. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.C4Logic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLS = 7, ROWS = 6, CELLS = COLS * ROWS;
  var DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];   // [dc, dr]: horizontal, vertical, two diagonals

  function idx(col, row) { return row * COLS + col; }
  function inside(col, row) { return col >= 0 && col < COLS && row >= 0 && row < ROWS; }

  function createBoard() { return new Array(CELLS).fill(0); }

  /** Lowest empty row in a column, or -1 when the column is full. */
  function nextRow(board, col) {
    if (!(col >= 0 && col < COLS) || col !== (col | 0)) return -1;
    for (var r = 0; r < ROWS; r++) if (!board[idx(col, r)]) return r;
    return -1;
  }
  function canDrop(board, col) { return nextRow(board, col) >= 0; }

  /** Puts a disc for player in col. Returns the row it landed on, or -1. */
  function drop(board, col, player) {
    var r = nextRow(board, col);
    if (r >= 0) board[idx(col, r)] = player;
    return r;
  }

  /** Takes the top disc out of col. Returns the row it was on, or -1. */
  function lift(board, col) {
    for (var r = ROWS - 1; r >= 0; r--) {
      if (board[idx(col, r)]) { board[idx(col, r)] = 0; return r; }
    }
    return -1;
  }

  /** The full line (4 or more, as [col,row] pairs) through (col,row) for the
   * disc on it, longest direction first, or null when there is none. */
  function lineAt(board, col, row) {
    var p = board[idx(col, row)];
    if (!p) return null;
    var best = null;
    for (var d = 0; d < 4; d++) {
      var dc = DIRS[d][0], dr = DIRS[d][1];
      var c0 = col, r0 = row;
      while (inside(c0 - dc, r0 - dr) && board[idx(c0 - dc, r0 - dr)] === p) { c0 -= dc; r0 -= dr; }
      var cells = [];
      var c = c0, r = r0;
      while (inside(c, r) && board[idx(c, r)] === p) { cells.push([c, r]); c += dc; r += dr; }
      if (cells.length >= 4 && (!best || cells.length > best.length)) best = cells;
    }
    return best;
  }

  /** Scans the whole board: { player, cells } for the first four found, or null. */
  function findWin(board) {
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        if (board[idx(c, r)]) {
          var line = lineAt(board, c, r);
          if (line) return { player: board[idx(c, r)], cells: line };
        }
      }
    }
    return null;
  }

  function isFull(board) {
    for (var c = 0; c < COLS; c++) if (!board[idx(c, ROWS - 1)]) return false;
    return true;
  }

  function legalMoves(board) {
    var out = [];
    for (var c = 0; c < COLS; c++) if (canDrop(board, c)) out.push(c);
    return out;
  }

  // ------------------------------------------------------------- game state

  /** A game: board, whose turn, the move list (columns) and the result.
   * result: 0 playing, 1 or 2 that player won, 3 draw. */
  function newGame(first) {
    return { board: createBoard(), first: first === 2 ? 2 : 1, turn: first === 2 ? 2 : 1, moves: [], result: 0, line: null };
  }

  /** Plays col for whoever's turn it is. Returns null if the move is illegal,
   * otherwise { col, row, player, line, result }. */
  function play(game, col) {
    if (game.result) return null;
    var player = game.turn;
    var row = drop(game.board, col, player);
    if (row < 0) return null;
    game.moves.push(col);
    var line = lineAt(game.board, col, row);
    if (line) { game.result = player; game.line = line; }
    else if (game.moves.length === CELLS) game.result = 3;
    game.turn = player === 1 ? 2 : 1;
    return { col: col, row: row, player: player, line: line, result: game.result };
  }

  /** Takes back the last move. Returns { col, row, player } or null. */
  function undo(game) {
    if (!game.moves.length) return null;
    var col = game.moves.pop();
    var row = nextRow(game.board, col);
    row = row < 0 ? ROWS - 1 : row - 1;
    var player = game.board[idx(col, row)];
    game.board[idx(col, row)] = 0;
    game.turn = player;
    game.result = 0;
    game.line = null;
    return { col: col, row: row, player: player };
  }

  /** Rebuilds a game from a list of columns. Returns null if any is illegal. */
  function fromMoves(moves, first) {
    var g = newGame(first);
    for (var i = 0; i < moves.length; i++) if (!play(g, moves[i])) return null;
    return g;
  }

  /** Columns where player would win right now. */
  function winningColumns(board, player) {
    var out = [];
    for (var c = 0; c < COLS; c++) {
      var r = drop(board, c, player);
      if (r < 0) continue;
      if (lineAt(board, c, r)) out.push(c);
      board[idx(c, r)] = 0;
    }
    return out;
  }

  return {
    COLS: COLS, ROWS: ROWS, CELLS: CELLS,
    idx: idx, createBoard: createBoard, nextRow: nextRow, canDrop: canDrop, drop: drop, lift: lift,
    lineAt: lineAt, findWin: findWin, isFull: isFull, legalMoves: legalMoves,
    newGame: newGame, play: play, undo: undo, fromMoves: fromMoves, winningColumns: winningColumns
  };
});
