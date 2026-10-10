// Global leaderboard client. The server (server.py) keeps each name's best score;
// we ask it for a run token when a game is created and hand that back with the score.
// Every call fails soft: a dead network must never get in the way of playing.
import { store } from './store.js';

async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Leaderboard offline');
  return data;
}

export class Leaderboard {
  constructor(enabled) {
    this.enabled = enabled;
    this.run = null;
    this.top = [];
    this.name = String(store.get('lbName', '') || '');
  }
  setName(n) { this.name = n; store.set('lbName', n); }
  startRun() {
    this.run = null;
    if (!this.enabled) return;
    api('/api/run', {}).then(d => { this.run = d.run; }).catch(() => {});
  }
  async fetchTop() {
    const d = await api('/api/leaderboard');
    this.top = Array.isArray(d.top) ? d.top : [];
    return this.top;
  }
  // -> { rank, best } ; throws with a short, player-facing message
  async submit(score, char) {
    if (!this.enabled) throw new Error('Practice run');
    if (!this.run) throw new Error('Leaderboard offline');
    const run = this.run;
    this.run = null;   // one score per run
    let d;
    try {
      d = await api('/api/score', { run, name: this.name, score, char });
    } catch (e) {
      // these are rejected before the server spends the token, so a retry can reuse it
      if (/name|slow/i.test(e.message)) this.run = run;
      throw e;
    }
    if (Array.isArray(d.top)) this.top = d.top;
    return d;
  }
}
