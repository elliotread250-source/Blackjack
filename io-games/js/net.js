// net.js — the WebSocket side of every IO game: connect, keep a buffer of server snapshots and hand the
// renderer two of them to interpolate between.
//
// Timing: the server ticks at `hz` and stamps each snapshot with its tick number k, so a snapshot's
// server time is k * 1000 / hz. We track `offset` = arrival time minus server time, taking the lowest
// value seen (the least-delayed packet) and letting it creep up slowly in case the clocks drift. The
// renderer then draws the world as it was DELAY ms ago, which is almost always between two snapshots
// we already have; that is what makes movement smooth over a normal connection.

const DELAY = 110;

export class IoNet {
  constructor(game) {
    this.game = game;
    this.ws = null;
    this.handlers = {};
    this.snaps = [];
    this.offset = null;
    this.hz = 20;
    this.rtt = null;
    this.you = null;
    this.connected = false;
  }

  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return this; }
  emit(ev, data) { for (const fn of this.handlers[ev] || []) { try { fn(data); } catch (e) { console.error(e); } } }

  connect() {
    if (this.ws && this.ws.readyState <= 1) return;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?game=${encodeURIComponent(this.game)}`;
    const ws = new WebSocket(url);
    this.ws = ws;
    this.snaps = [];
    this.offset = null;
    ws.onopen = () => { this.connected = true; this.ping(); this.pinger = setInterval(() => this.ping(), 3000); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.onMessage(m); };
    ws.onclose = ev => {
      clearInterval(this.pinger);
      if (this.ws !== ws) return;
      this.ws = null; this.connected = false;
      this.emit('closed', ev.code);
    };
    ws.onerror = () => {};
  }

  close() { const ws = this.ws; this.ws = null; this.connected = false; clearInterval(this.pinger); if (ws) ws.close(); }
  send(o) { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(o)); return true; } return false; }
  ping() { this.send({ t: 'ping', id: performance.now() }); }

  onMessage(m) {
    const now = performance.now();
    switch (m.t) {
      case 's': {
        const st = m.k * 1000 / this.hz;
        const o = now - st;
        if (this.offset === null || o < this.offset) this.offset = o;
        else this.offset += (o - this.offset) * 0.002;
        this.snaps.push({ time: st, k: m.k, d: m });
        if (this.snaps.length > 40) this.snaps.splice(0, this.snaps.length - 40);
        this.emit('snap', m);
        break;
      }
      case 'welcome': this.you = m.you; this.hz = m.hz || 20; this.snaps = []; this.offset = null; this.emit('welcome', m); break;
      case 'pong': if (typeof m.id === 'number') this.rtt = now - m.id; break;
      default: this.emit(m.t, m);
    }
  }

  // The two snapshots around "now - DELAY" (server time) and how far between them we are.
  pair(now = performance.now()) {
    const s = this.snaps;
    if (!s.length) return null;
    if (this.offset === null || s.length === 1) return { a: s[s.length - 1], b: s[s.length - 1], f: 1 };
    const t = now - this.offset - DELAY;
    for (let i = s.length - 1; i > 0; i--) {
      if (s[i - 1].time <= t) {
        const a = s[i - 1], b = s[i];
        const f = Math.max(0, Math.min(1, (t - a.time) / Math.max(1, b.time - a.time)));
        return { a, b, f };
      }
    }
    return { a: s[0], b: s[0], f: 1 };
  }

  latest() { return this.snaps.length ? this.snaps[this.snaps.length - 1].d : null; }
}

export const lerp = (a, b, f) => a + (b - a) * f;
export const lerpAngle = (a, b, f) => a + ((((b - a) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI) * f;
