/*
 * Puzzle generation off the main thread, so digging out an Expert puzzle
 * never stalls a tap. Message in: {id, level, seed}. Message out: the
 * generator's result plus {id, ms}, or {id, error}.
 */
/* global importScripts, SudokuCore */
importScripts('core.js');

self.onmessage = function (e) {
  var msg = e.data || {};
  var t0 = Date.now();
  try {
    var r = SudokuCore.generate(msg.level, msg.seed);
    r.id = msg.id;
    r.ms = Date.now() - t0;
    self.postMessage(r);
  } catch (err) {
    self.postMessage({ id: msg.id, error: String(err && err.message || err) });
  }
};
