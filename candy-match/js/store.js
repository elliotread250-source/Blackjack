// store.js: saved progress, always behind try/catch (private windows and blocked storage
// throw; the game then simply works for the session without saving).
const KEY = 'candymatch.v1';
const defaults = () => ({ stars: {}, best: {}, hammers: 2, shuffles: 2, sound: true, played: 0 });

export function load() {
  const p = defaults();
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && typeof raw === 'object') {
      if (raw.stars && typeof raw.stars === 'object') for (const k in raw.stars) { const v = raw.stars[k] | 0; if (v >= 0 && v <= 3) p.stars[k] = v; }
      if (raw.best && typeof raw.best === 'object') for (const k in raw.best) { const v = +raw.best[k]; if (v >= 0) p.best[k] = v; }
      for (const k of ['hammers', 'shuffles', 'played']) if (Number.isFinite(raw[k]) && raw[k] >= 0) p[k] = raw[k] | 0;
      if (typeof raw.sound === 'boolean') p.sound = raw.sound;
    }
  } catch (e) { /* ignore */ }
  return p;
}
export function save(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* ignore */ } }
export const totalStars = p => Object.values(p.stars).reduce((a, b) => a + b, 0);
export const isUnlocked = (p, n) => n === 1 || (p.stars[n - 1] | 0) > 0;
export const highestUnlocked = (p, count) => { let n = 1; while (n < count && isUnlocked(p, n + 1)) n++; return n; };

/** Record a finished level; returns the booster rewards it earned. */
export function award(p, n, stars, score) {
  const old = p.stars[n] | 0;
  const gain = Math.max(0, stars - old);
  const reward = { hammers: gain, shuffles: stars === 3 && old < 3 ? 1 : 0, newBest: score > (p.best[n] || 0), gain };
  p.stars[n] = Math.max(old, stars);
  p.best[n] = Math.max(p.best[n] || 0, score);
  p.hammers += reward.hammers; p.shuffles += reward.shuffles;
  save(p);
  return reward;
}
