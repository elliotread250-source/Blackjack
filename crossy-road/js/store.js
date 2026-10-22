// localStorage, always wrapped: private windows and blocked storage must not break the game.
const P = 'crossy.';
export const store = {
  get(key, def) {
    try {
      const v = localStorage.getItem(P + key);
      if (v === null || v === undefined) return def;
      return JSON.parse(v);
    } catch { return def; }
  },
  set(key, val) {
    try { localStorage.setItem(P + key, JSON.stringify(val)); } catch { /* full or blocked */ }
  },
};
