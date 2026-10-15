/* localStorage wrapper. Every access is guarded: private modes, blocked
   cookies and sandboxed iframes can all throw on mere access. An in-memory
   copy keeps scores for the session when storage is unavailable. */
(function () {
  'use strict';
  var PREFIX = 'snake.';
  var mem = {};

  function get(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) { /* blocked or corrupt */ }
    return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : fallback;
  }

  function set(key, value) {
    mem[key] = value;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) { /* blocked or full */ }
  }

  window.SnakeStore = { get: get, set: set };
})();
