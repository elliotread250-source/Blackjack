// World fastest-times client. The server (server.py) keeps each name's best time per level; we ask
// for a run token when a game starts or resumes and hand it back with the time. Every call fails
// soft: a dead network must never get in the way of playing.
import { store } from './store.js';

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Leaderboard offline');
  return data;
}

export class Leaderboard {
  constructor(enabled) { this.enabled = enabled; this.run = null; this.name = String(store.get('lbName', '') || ''); }
  setName(n) { this.name = n; store.set('lbName', n); }
  startRun() { this.run = null; if (this.enabled) api('/api/run', {}).then(d => { this.run = d.run; }).catch(() => {}); }
  async top(level) { const d = await api('/api/leaderboard?level=' + level); return Array.isArray(d.top) ? d.top : []; }
  async submit(level, time, caught, diff) {
    if (!this.enabled) throw new Error('Practice run');
    if (!this.run) throw new Error('Leaderboard offline');
    const run = this.run; this.run = null;
    try { return await api('/api/score', { run, name: this.name, level, time, caught, diff }); }
    catch (e) { if (/name|slow/i.test(e.message)) this.run = run; throw e; }
  }
}
