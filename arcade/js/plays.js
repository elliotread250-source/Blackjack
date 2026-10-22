// Real play counts from the hub server (POST /api/play, GET /api/plays). Never invented.
export const plays = {};
export let playsState = 'loading';           // loading | ok | failed
const listeners = new Set();
export const onPlays = fn => listeners.add(fn);
const emit = () => listeners.forEach(fn => fn());
export async function loadPlays() {
  try {
    const r = await fetch('/api/plays', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    Object.assign(plays, (await r.json()).plays || {});
    playsState = 'ok';
  } catch { playsState = 'failed'; }
  emit();
}
// one count per launch; sendBeacon survives the page navigating to the game
export function countPlay(id) {
  const body = JSON.stringify({ game: id });
  let sent = false;
  try { sent = !!(navigator.sendBeacon && navigator.sendBeacon('/api/play', new Blob([body], { type: 'application/json' }))); } catch { sent = false; }
  if (!sent) fetch('/api/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  if (playsState === 'ok') { plays[id] = (plays[id] || 0) + 1; emit(); }
}
export const fmtPlays = n => `${n.toLocaleString()} ${n === 1 ? 'play' : 'plays'}`;
