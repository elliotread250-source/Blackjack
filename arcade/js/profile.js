// "Your arcade": local-only stats and badges, saved in this browser (no accounts, nothing sent).
import { get, set, del } from './store.js';
const KEY = 'oa.profile';
const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayN = s => Math.round(new Date(s + 'T12:00:00').getTime() / 864e5);
function load() {
  const p = get(KEY, null) || {};
  return { first: p.first || Date.now(), launches: p.launches && typeof p.launches === 'object' ? p.launches : {}, days: Array.isArray(p.days) ? p.days.slice(-400) : [],
    badges: p.badges && typeof p.badges === 'object' ? p.badges : {}, flags: p.flags && typeof p.flags === 'object' ? p.flags : {} };
}
let P = load();
if (!get(KEY, null)) save(false);
const listeners = new Set();
export const onProfile = fn => listeners.add(fn);
function save(emit = true) { set(KEY, P); if (emit) listeners.forEach(fn => fn()); }

export const BADGES = [
  ['first-coin', 'FIRST COIN', 'Launch your first game', 'coin'],
  ['explorer', 'EXPLORER', 'Try 5 different games', 'controller'],
  ['collector', 'COLLECTOR', 'Try 10 different games', 'trophy'],
  ['completionist', 'COMPLETIONIST', 'Try every live game', 'crown'],
  ['night-owl', 'NIGHT OWL', 'Launch a game after midnight', 'clock'],
  ['early-bird', 'EARLY BIRD', 'Launch a game before 7 am', 'fire'],
  ['on-a-roll', 'ON A ROLL', 'Play on 3 days in a row', 'fire'],
  ['dedicated', 'DEDICATED', 'Play on 7 days in a row', 'badge'],
  ['curator', 'CURATOR', 'Keep 5 favourites', 'heart'],
  ['lucky-spin', 'LUCKY SPIN', 'Use the slot machine', 'shuffle'],
  ['secret-agent', 'SECRET AGENT', 'Find the Konami code', 'keyboard'],
  ['speed-reader', 'SPEED READER', 'Use the command palette', 'search'],
];
const unlockFns = new Set();
export const onUnlock = fn => unlockFns.add(fn);
export function unlock(id) {
  if (P.badges[id] || !BADGES.some(b => b[0] === id)) return false;
  P.badges[id] = Date.now(); save();
  const b = BADGES.find(x => x[0] === id); unlockFns.forEach(fn => fn(b));
  return true;
}
export const hasBadge = id => !!P.badges[id];

export function streaks() {
  const days = [...new Set(P.days)].sort().map(dayN);
  let best = 0, run = 0, prev = null;
  for (const d of days) { run = prev !== null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  const t = dayN(today()), cur = days.length && (days[days.length - 1] === t || days[days.length - 1] === t - 1) ? run : 0;
  return { current: cur, best };
}
export function recordProfileLaunch(id, liveIds) {
  P.launches[id] = (P.launches[id] || 0) + 1;
  const d = today(); if (P.days[P.days.length - 1] !== d) P.days.push(d);
  save();
  const tried = Object.keys(P.launches).length, h = new Date().getHours();
  unlock('first-coin');
  if (tried >= 5) unlock('explorer');
  if (tried >= 10) unlock('collector');
  if (liveIds && liveIds.every(x => P.launches[x])) unlock('completionist');
  if (h >= 0 && h < 4) unlock('night-owl');
  if (h >= 4 && h < 7) unlock('early-bird');
  const s = streaks();
  if (s.current >= 3) unlock('on-a-roll');
  if (s.current >= 7) unlock('dedicated');
}
export function flag(k) { if (!P.flags[k]) { P.flags[k] = Date.now(); save(); } }
export const stats = () => ({ ...P, tried: Object.keys(P.launches).length, total: Object.values(P.launches).reduce((a, b) => a + b, 0), ...streaks() });
export const launchesOf = id => P.launches[id] || 0;
export function resetProfile() { del(KEY); P = load(); P.first = Date.now(); save(); }
