// Player profiles. The game talks to one interface; there are two kinds behind it:
//   GuestProfile   — the original on-device save (localStorage), for people who skip signing in.
//   AccountProfile — everything lives on the server: coins, characters, settings, records. Runs are
//                    played on server-issued seeds ("tickets") and sent back as hop inputs, which the
//                    server replays to decide the score and coins. Finished runs that can't be sent
//                    right away wait in a local queue and are retried, so nothing is lost offline.
import { Profile, CHARACTERS, charById, PRIZE_PRICE, PRIZE_MAX_PRICE, hopFor } from './logic.js';
import { store } from './store.js';

export const DEFAULT_SETTINGS = { hopTicks: 4, volume: 0.8, sfx: 1, muted: false, quality: 'high', reducedMotion: false,
  highContrast: false, trainWarning: 'strong', shake: true, batWings: 'spread' };

export class ApiError extends Error {
  constructor(status, data) { super((data && data.error) || (status ? 'Request failed' : 'No connection')); this.status = status; this.data = data || {}; }
}
export async function api(path, body) {
  let res;
  try {
    res = await fetch(path, body === undefined ? { credentials: 'same-origin', cache: 'no-store' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch { throw new ApiError(0, { error: 'Can’t reach the server. Check your connection.' }); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

// ---------------------------------------------------------------- guest (on this device only)
export class GuestProfile {
  constructor() {
    this.local = new Profile(store);
    this.isGuest = true;
    this.username = null;
    this.settings = { ...DEFAULT_SETTINGS, ...(store.get('settings', {}) || {}), muted: this.local.muted };
    this.champion = false;
    this.rank = null;
  }
  get coins() { return this.local.coins; }
  get best() { return this.local.best; }
  get owned() { return this.local.owned; }
  get selected() { return this.local.selected; }
  get records() { return this.local.records; }
  get muted() { return !!this.settings.muted; }
  get hopTicks() { return hopFor(this.settings.hopTicks, this.selected); }
  hasLocalProgress() { return false; }
  async saveSettings(part) {
    Object.assign(this.settings, part);
    if ('muted' in part) this.local.setMuted(part.muted);
    store.set('settings', this.settings);
    return this.settings;
  }
  async select(id) { return this.local.select(id); }
  async buy(id) {
    const c = charById(id);
    if (this.local.owned.has(id)) return { ok: true };
    if (c.price === null) return { ok: false, error: 'This character can’t be bought.' };
    if (this.local.coins < c.price) return { ok: false, error: `You need ${c.price - this.local.coins} more coins.` };
    return { ok: this.local.buy(id) };
  }
  async prize() { const c = this.local.prize(); return c ? { ok: true, char: c } : { ok: false, error: 'Not enough coins.' }; }
  async redeem(code) { const c = this.local.redeem(code); return c ? { ok: true, char: c } : { ok: false }; }
  // runs: guests keep coins as they collect them (the original rules) and nothing is sent anywhere
  ticket() { return null; }
  runCoin(n) { this.local.addCoins(n); }
  async finishRun(game) {
    const won = game.usedFast ? [] : this.local.recordRun(game.runStats());
    const isBest = this.local.submit(game.score) && game.score > 0;
    return { score: game.score, coins: game.coins, confirmed: true, isBest, unlocked: won.map(c => c.id) };
  }
  async flush() {}
  async daily() { return null; }
}

// ---------------------------------------------------------------- account (on the server)
export class AccountProfile {
  constructor(user) {
    this.isGuest = false;
    this.apply(user);
    this.tickets = (store.get('tickets.' + this.id, []) || []).filter(t => Date.now() - t.issued < 40 * 3600 * 1000);
    this.pending = store.get('pending.' + this.id, []) || [];
    this.dailyState = null;
    this.refill();
  }
  apply(u) {
    if (!u) return;
    this.id = u.id; this.username = u.username;
    this.coins = u.coins; this.best = u.best; this.rank = u.rank; this.champion = !!u.champion;
    this.owned = new Set(u.owned); this.selected = u.equipped; this.records = u.records || {};
    this.settings = { ...DEFAULT_SETTINGS, ...(u.settings || {}) };
    this.stats = { runs: u.runs, rows: u.rows, deaths: u.deaths, coinsCollected: u.coinsCollected, coinsEarned: u.coinsEarned, coinsSpent: u.coinsSpent, created: u.created };
    this.migrated = !!u.migrated;
  }
  get muted() { return !!this.settings.muted; }
  // ticks per hop for the next run (the secret 1-tick hop only while wearing its skin)
  get hopTicks() { return hopFor(this.settings.hopTicks, this.selected); }

  async refreshMe() { const d = await api('/api/me'); this.apply(d.user); return this; }
  async saveSettings(part) {
    Object.assign(this.settings, part);
    const d = await api('/api/me/settings', { settings: this.settings });
    this.settings = { ...DEFAULT_SETTINGS, ...d.settings };
    if ('hopTicks' in part) this.refill();
    return this.settings;
  }
  async select(id) {
    if (!this.owned.has(id)) return false;
    this.selected = id;
    try { this.apply((await api('/api/me/equip', { char: id })).user); } catch { /* shown as equipped locally; the server keeps its own */ }
    this.refill();   // the hop length can depend on the skin
    return true;
  }
  async buy(id) {
    try {
      const d = await api('/api/shop/buy', { char: id });
      if (d.user) this.apply(d.user); else await this.refreshMe();
      return { ok: true };
    } catch (e) { return { ok: false, error: e.status === 402 ? 'Not enough coins.' : e.message }; }
  }
  async prize() {
    const req = rid();
    try {
      const d = await api('/api/shop/prize', { req });
      if (d.user) this.apply(d.user); else await this.refreshMe();
      return { ok: true, char: charById(d.won) };
    } catch (e) { return { ok: false, error: e.status === 402 ? 'Not enough coins.' : e.message }; }
  }
  async redeem(code) {
    try { const d = await api('/api/redeem', { code }); this.apply(d.user); this.refill(); return { ok: true, char: charById(d.char) }; }
    catch (e) { return { ok: false, error: e.message, status: e.status }; }
  }

  // ---- runs on server seeds
  saveQueues() { store.set('tickets.' + this.id, this.tickets); store.set('pending.' + this.id, this.pending); }
  refill() {
    const want = 3;
    this.tickets = this.tickets.filter(t => t.hopTicks === this.hopTicks);
    if (this.filling || this.tickets.length >= want) return;
    this.filling = true;
    const next = () => api('/api/run/start', {}).then(t => {
      this.tickets.push({ ...t, issued: Date.now() });
      this.saveQueues();
      if (this.tickets.length < want) return next();
    });
    next().catch(() => {}).finally(() => { this.filling = false; });
  }
  // The seed for the next run (null when offline with no tickets left: that run is practice).
  ticket() {
    const i = this.tickets.findIndex(t => t.hopTicks === this.hopTicks);
    const t = i >= 0 ? this.tickets.splice(i, 1)[0] : null;
    this.saveQueues();
    this.refill();
    return t;
  }
  // a ticket handed out for a game that was never actually started can be reused
  giveBack(t) { if (t && !this.tickets.some(x => x.token === t.token)) { this.tickets.unshift(t); this.saveQueues(); } }
  runCoin() { /* account coins are paid by the server after the replay */ }

  async finishRun(game, ticket, flags = {}) {
    if (!ticket) return { score: game.score, coins: game.coins, confirmed: false, practice: true };
    const payload = { token: ticket.token, inputs: game.inputs, fast: game.fastTicks, endTick: game.tick, score: game.score, autopilot: !!flags.autopilot };
    this.pending.push(payload);
    this.saveQueues();
    try {
      const d = await this.send(payload);
      return { score: d.result.score, coins: d.practice ? 0 : d.result.coins, confirmed: true, practice: d.practice, unlocked: d.unlocked || [], isBest: !d.practice && d.result.score >= this.best && d.result.score > 0, daily: d.daily, champion: d.champion };
    } catch (e) {
      return { score: game.score, coins: game.coins, confirmed: false, pending: e.status === 0 || e.status >= 500, error: e.message };
    }
  }
  async send(payload) {
    const prevBest = this.best;
    const d = await api('/api/run/finish', payload);
    this.pending = this.pending.filter(p => p.token !== payload.token);
    this.saveQueues();
    if (d.user) this.apply(d.user);
    if (d.daily) this.dailyState = d.daily;
    d.prevBest = prevBest;
    return d;
  }
  // retry runs that couldn't be sent earlier (offline, server busy)
  async flush() {
    for (const p of this.pending.slice()) {
      try { await this.send(p); } catch (e) {
        if (e.status && e.status < 500) { this.pending = this.pending.filter(x => x.token !== p.token); this.saveQueues(); } // rejected or expired: drop it
        else break;
      }
    }
  }

  // ---- daily missions
  async daily() { this.dailyState = await api('/api/daily'); return this.dailyState; }
  async claim(day, id) {
    const d = await api('/api/daily/claim', { day, id });
    this.apply(d.user); this.dailyState = d.daily;
    return d;
  }
}

// What an old on-device save holds, for bringing it into a new account.
export function localSave() {
  const p = new Profile(store);
  const extra = [...p.owned].filter(id => id !== 'chicken');
  return { coins: p.coins, owned: [...p.owned], selected: p.selected, records: p.records, best: p.best, worth: p.coins + extra.length, count: extra.length };
}
export { PRIZE_PRICE, PRIZE_MAX_PRICE, CHARACTERS };
