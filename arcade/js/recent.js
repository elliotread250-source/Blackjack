// Recently played: real launches from this browser (id + time), newest first, at most 10.
import { get, set, del } from './store.js';
const KEY = 'oa.recent', MAX = 10;
let list = (get(KEY, []) || []).filter(r => r && typeof r.id === 'string' && Number.isFinite(r.t));
const listeners = new Set();
export const onRecent = fn => listeners.add(fn);
export const recentList = () => list.slice();
const save = () => { if (list.length) set(KEY, list); else del(KEY); listeners.forEach(fn => fn()); };
export function recordLaunch(id) { list = [{ id, t: Date.now() }, ...list.filter(r => r.id !== id)].slice(0, MAX); save(); }
export function removeRecent(id) { list = list.filter(r => r.id !== id); save(); }
export function clearRecent() { const old = list; list = []; save(); return old; }
export function restoreRecent(old) { list = old; save(); }
export function ago(t) {
  const s = Math.max(1, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); return d === 1 ? 'yesterday' : `${d} days ago`;
}
