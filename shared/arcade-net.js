// arcade-net.js — browser client for the shared turn-based rooms (shared/turnrooms.py).
// Canonical copy: shared/arcade-net.js, vendored into each game's js/ folder; do not edit copies.
//
//   const net = new TurnClient('chess');
//   net.on('start', snap => …); net.on('move', ev => …); net.create('Sam'); net.move({ uci: 'e2e4' });
//
// It keeps one WebSocket to the game's own server (wss:// on https pages), pings every 15 s and measures
// the round trip, and if the socket drops mid-game it reconnects with back-off and resumes the seat with
// the secret token the server gave us. The session is kept in sessionStorage, so reloading the tab
// resumes the same game. Nothing here pretends: "playing" only after the server says both seats are
// filled, and the opponent is reported away/back/left exactly as the server sees it.

const PING_MS = 15000;

export class TurnClient {
  constructor(game) {
    this.game = game;
    this.key = `${game}.online`;
    this.ws = null;
    this.status = 'idle';      // idle | connecting | waiting | queued | playing | reconnecting | ended | error
    this.code = null; this.side = -1; this.token = null; this.n = 0; this.rtt = null;
    this.handlers = {};
    this.wantOpen = false; this.retry = 0; this.retryTimer = 0; this.pingTimer = 0; this.pending = null;
  }
  on(ev, fn) { (this.handlers[ev] ||= []).push(fn); return this; }
  emit(ev, data) { for (const fn of this.handlers[ev] || []) { try { fn(data); } catch (e) { console.error(e); } } }
  setStatus(s) { if (this.status !== s) { this.status = s; this.emit('status', s); } }

  // ---- session (survives reloads in this tab only)
  saved() { try { return JSON.parse(sessionStorage.getItem(this.key) || 'null'); } catch { return null; } }
  remember() { try { sessionStorage.setItem(this.key, JSON.stringify({ code: this.code, token: this.token })); } catch { /* storage blocked */ } }
  forget() { try { sessionStorage.removeItem(this.key); } catch { /* fine */ } }

  // ---- socket
  url() { return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`; }
  open(first) {
    clearTimeout(this.retryTimer);
    this.wantOpen = true; this.pending = first;
    if (this.ws && this.ws.readyState <= 1) { if (this.ws.readyState === 1) this.flush(); return; }
    if (this.status !== 'reconnecting') this.setStatus('connecting');
    let ws;
    try { ws = new WebSocket(this.url()); } catch { this.fail('Could not open a connection.'); return; }
    this.ws = ws;
    ws.onopen = () => { this.retry = 0; this.flush(); this.startPing(); };
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } this.onMessage(m); };
    ws.onclose = () => { if (this.ws === ws) this.dropped(); };
    ws.onerror = () => {};
  }
  flush() { if (this.pending && this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(this.pending)); this.pending = null; } }
  send(o) { if (this.ws && this.ws.readyState === 1) { this.ws.send(JSON.stringify(o)); return true; } return false; }
  startPing() {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.send({ t: 'ping', id: performance.now() }), PING_MS);
    this.send({ t: 'ping', id: performance.now() });
  }
  dropped() {
    clearInterval(this.pingTimer); this.ws = null;
    if (!this.wantOpen) return;
    const s = this.saved();
    if (this.status === 'playing' || this.status === 'reconnecting' || (s && this.token)) {
      // mid-game: the server holds our seat for a while; try to get it back
      this.setStatus('reconnecting');
      const delay = Math.min(8000, 600 * 2 ** this.retry++);
      if (this.retry > 7) { this.fail('Lost the connection to the game server.'); return; }
      this.retryTimer = setTimeout(() => this.open({ t: 'resume', code: this.code, token: this.token }), delay);
    } else if (this.status === 'waiting' || this.status === 'queued' || this.status === 'connecting') {
      this.fail('Lost the connection to the game server.');
    }
  }
  fail(msg) { this.wantOpen = false; this.setStatus('error'); this.emit('error', msg); }
  close() {
    this.wantOpen = false; clearTimeout(this.retryTimer); clearInterval(this.pingTimer);
    this.send({ t: 'leave' });
    if (this.ws) { try { this.ws.close(); } catch { /* fine */ } }
    this.ws = null; this.code = null; this.side = -1; this.token = null; this.forget(); this.setStatus('idle');
  }

  // ---- actions
  create(name) { this.open({ t: 'create', name }); }
  join(code, name) { this.open({ t: 'join', code: String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4), name }); }
  quick(name) { this.open({ t: 'quick', name }); }
  resume() { const s = this.saved(); if (!s || !s.code || !s.token) return false; this.code = s.code; this.token = s.token; this.setStatus('reconnecting'); this.open({ t: 'resume', code: s.code, token: s.token }); return true; }
  move(fields) { return this.send({ t: 'move', n: this.n, ...fields }); }
  resign() { this.send({ t: 'resign' }); }
  offerDraw() { this.send({ t: 'draw' }); }
  declineDraw() { this.send({ t: 'nodraw' }); }
  rematch() { this.send({ t: 'rematch' }); }
  emote(e) { this.send({ t: 'emote', e }); }

  onMessage(m) {
    switch (m.t) {
      case 'hello': break;
      case 'pong': if (typeof m.id === 'number') { this.rtt = Math.round(performance.now() - m.id); this.emit('rtt', this.rtt); } break;
      case 'room': this.code = m.code; this.setStatus('waiting'); this.emit('room', m.code); break;
      case 'queued': this.setStatus('queued'); this.emit('queued'); break;
      case 'cancelled': break;
      case 'start':
        this.code = m.code; this.side = m.side; this.token = m.token; this.n = m.n;
        this.remember(); this.retry = 0;
        this.setStatus(m.over ? 'ended' : 'playing'); this.emit('start', m);
        if (m.away) this.emit('away', {});
        break;
      case 'move':
        this.n = m.n;
        if (m.over) this.setStatus('ended');
        this.emit('move', m);
        break;
      case 'reject': if (typeof m.n === 'number') this.n = m.n; this.emit('reject', m); break;
      case 'away': this.emit('away', m); break;
      case 'back': this.emit('back', m); break;
      case 'left': this.wantOpen = false; this.forget(); this.setStatus('idle'); this.emit('left', m); break;
      case 'error':
        if (m.msg === 'no session') { this.forget(); this.token = null; this.code = null; this.wantOpen = false; this.setStatus('idle'); this.emit('expired', m); }
        else this.fail({ 'no room': 'No room with that code.', 'room full': 'That room is already full.', busy: 'The server is busy — try again shortly.', expired: 'Nobody joined, so the room closed.' }[m.msg] || 'Something went wrong.');
        break;
      default: this.emit(m.t, m);
    }
  }
}

// helpers shared by the game UIs
export const roomFromUrl = () => { const c = new URLSearchParams(location.search).get('room'); return c ? c.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) : null; };
export const shareLink = code => `${location.origin}${location.pathname}?room=${code}`;
export const clearRoomParam = () => { if (location.search.includes('room=')) history.replaceState(null, '', location.pathname); };
