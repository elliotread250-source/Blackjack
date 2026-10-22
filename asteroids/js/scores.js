/*
 * Settings and the top-10 table, kept in localStorage. Every access is wrapped:
 * storage can be missing, full, or throw outright (private modes, sandboxed
 * frames, blocked cookies), and the game must carry on regardless.
 */
(function () {
  'use strict';

  const PREFIX = 'asteroids.';

  const Store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
    },
  };

  function clean(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((e) => e && Number.isFinite(e.score) && e.score > 0)
      .map((e) => ({ score: Math.floor(e.score), initials: String(e.initials || '').toUpperCase().replace(/[^A-Z ]/g, '').slice(0, 3).padEnd(3, ' ') }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  const HighScores = {
    list: clean(Store.get('hiscores', [])),
    best() { return this.list.length ? this.list[0].score : 0; },
    qualifies(score) {
      return score > 0 && (this.list.length < 10 || score > this.list[this.list.length - 1].score);
    },
    /** Insert and save; returns the index of the new entry. */
    add(score, initials) {
      const entry = { score, initials: (initials || '   ').slice(0, 3).padEnd(3, ' ') };
      let i = this.list.findIndex((e) => score > e.score);
      if (i < 0) i = this.list.length;
      this.list.splice(i, 0, entry);
      this.list = this.list.slice(0, 10);
      Store.set('hiscores', this.list);
      return i < 10 ? i : -1;
    },
    reload() { this.list = clean(Store.get('hiscores', [])); },
  };

  window.Store = Store;
  window.HighScores = HighScores;
})();
