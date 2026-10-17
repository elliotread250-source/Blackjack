// Availability from the hub's own server-side checks (GET /api/status). "Online" only when the game's
// server actually answered recently; otherwise Checking / Not responding / Unknown. Never guessed.
const LABEL = { checking: 'Checking', up: 'Online', down: 'Not responding', unknown: 'Status unknown', soon: 'Coming soon' };
export const state = {};
const listeners = new Set();
export const onStatus = fn => listeners.add(fn);
export function paint(el, s) { el.dataset.state = s; el.lastChild.textContent = LABEL[s] || LABEL.unknown; el.title = s === 'up' ? 'The game server answered our check in the last couple of minutes' : ''; }
export async function loadStatus(tries = 0) {
  let data = null;
  try { const r = await fetch('/api/status', { cache: 'no-store' }); if (r.ok) data = await r.json(); } catch { data = null; }
  if (!data) { for (const k of Object.keys(state)) if (state[k] === 'checking') state[k] = 'unknown'; state.__failed = true; listeners.forEach(fn => fn()); return; }
  Object.assign(state, data.status);
  listeners.forEach(fn => fn());
  // the server checks in the background: ask again shortly while answers are still coming in
  if ((!data.fresh || Object.values(data.status).includes('checking')) && tries < 4) setTimeout(() => loadStatus(tries + 1), 3500 + tries * 2500);
}
export const statusOf = g => (g.pending ? 'soon' : state[g.id] || (state.__failed ? 'unknown' : 'checking'));
