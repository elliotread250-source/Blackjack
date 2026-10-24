// Online race client: one WebSocket to this game's own server (/ws, race.py). It keeps the seat token
// in sessionStorage so a dropped connection or a reload rejoins the same seat, pings every 15 s, and
// queues a finished run until the server has it. Nothing is decided here: the server picks the seed,
// replays every run and sends the standings.
const KEY = 'crossy.race';
const PING_MS = 15000;

export class RaceClient {
  constructor() {
    this.ws = null;
    this.handlers = {};
    this.want = false;          // keep a socket open
    this.retry = 0;
    this.retryT = 0;
    this.pingT = 0;
    this.queue = [];            // messages to send once open
    this.code = null; this.token = null; this.you = null;
    this.rtt = null;
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return this; }
  emit(ev, d) { for (const fn of this.handlers[ev] || []) { try { fn(d); } catch (e) { console.error(e); } } }

  saved() { try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; } }
  remember() { try { sessionStorage.setItem(KEY, JSON.stringify({ code: this.code, token: this.token })); } catch { /* storage blocked */ } }
  forget() { try { sessionStorage.removeItem(KEY); } catch { /* fine */ } }

  url() { return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`; }
  get open() { return !!(this.ws && this.ws.readyState === 1); }

  connect() {
    this.want = true;
    clearTimeout(this.retryT);
    if (this.ws && this.ws.readyState <= 1) return;
    let ws;
    try { ws = new WebSocket(this.url()); } catch { this.dropped(); return; }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      // a known seat is always reclaimed first, so queued messages land in the right room
      if (this.token && this.code) ws.send(JSON.stringify({ t: 'resume', code: this.code, token: this.token }));
      for (const m of this.queue.splice(0)) ws.send(JSON.stringify(m));
      clearInterval(this.pingT);
      this.pingT = setInterval(() => this.send({ t: 'ping', id: performance.now() }), PING_MS);
      this.emit('conn', true);
    };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.onMessage(m); };
    ws.onclose = () => { if (this.ws === ws) this.dropped(); };
    ws.onerror = () => {};
  }
  dropped() {
    clearInterval(this.pingT);
    this.ws = null;
    this.emit('conn', false);
    if (!this.want) return;
    if (this.retry > 8) { this.want = false; this.emit('lost'); return; }
    this.retryT = setTimeout(() => this.connect(), Math.min(8000, 500 * 2 ** this.retry++));
  }
  // messages that must arrive (create/join/finish) wait for the socket; pos updates are just dropped
  send(m, mustArrive) {
    if (this.open) { this.ws.send(JSON.stringify(m)); return true; }
    if (mustArrive) { this.queue.push(m); this.connect(); }
    return false;
  }
  close() {
    this.want = false;
    clearTimeout(this.retryT); clearInterval(this.pingT);
    if (this.open) this.ws.send(JSON.stringify({ t: 'leave' }));
    if (this.ws) { try { this.ws.close(); } catch { /* fine */ } }
    this.ws = null; this.queue = []; this.code = this.token = this.you = null;
    this.forget();
  }

  create(name, ch) { this.connect(); this.send({ t: 'create', name, ch }, true); }
  join(code, name, ch) { this.connect(); this.send({ t: 'join', code: String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4), name, ch }, true); }
  quick(name, ch) { this.connect(); this.send({ t: 'quick', name, ch }, true); }
  resume() {
    const s = this.saved();
    if (!s || !s.code || !s.token) return false;
    this.code = s.code; this.token = s.token;
    this.connect();
    return true;
  }
  go(hopTicks) { this.send({ t: 'go', hopTicks }, true); }
  pos(p) { this.send({ t: 'pos', ...p }); }
  finish(run) { this.send({ t: 'finish', ...run }, true); }

  onMessage(m) {
    switch (m.t) {
      case 'hello': break;
      case 'pong': if (typeof m.id === 'number') this.rtt = Math.round(performance.now() - m.id); break;
      case 'lobby':
        this.code = m.code; this.token = m.token; this.you = m.you;
        this.remember();
        this.emit('lobby', m);
        break;
      case 'error':
        if (m.msg === 'no session' || m.msg === 'expired') { this.forget(); this.code = this.token = null; }
        this.emit('error', m.msg);
        break;
      default: this.emit(m.t, m);
    }
  }
}

export const raceFromUrl = () => { const c = new URLSearchParams(location.search).get('race'); return c ? c.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) : null; };
export const raceLink = code => `${location.origin}${location.pathname}?race=${code}`;
