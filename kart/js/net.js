// WebSocket client: room messages, clock sync with the server and the interpolation buffer
// used to draw other players' karts ~100 ms in the past.

export const ITEM_CODES = [null, 'boost', 'banana', 'shell', 'shield'];

export class Net {
  constructor(on) {
    this.on = on; // { message(msg), status(str), close() }
    this.ws = null;
    this.offset = 0;      // serverTime - performance.now()
    this.bestRtt = Infinity;
    this.rtt = 0;
    this.samples = [];
    this.pingId = 0;
    this.pingTimer = null;
    this.open = false;
    this.id = null;
  }
  connect() {
    if (this.ws && (this.ws.readyState === 0 || this.ws.readyState === 1)) return this.ready;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
    this.ready = new Promise((resolve, reject) => {
      let ws;
      try { ws = new WebSocket(url); } catch (e) { reject(e); return; }
      this.ws = ws;
      const to = setTimeout(() => { reject(new Error('timeout')); try { ws.close(); } catch {} }, 8000);
      ws.onmessage = ev => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg || typeof msg.t !== 'string') return;
        if (msg.t === 'hello') {
          clearTimeout(to);
          this.open = true;
          this.id = msg.id;
          if (typeof msg.s === 'number') this.offset = msg.s - performance.now();
          this.burstPing();
          resolve();
          return;
        }
        if (msg.t === 'pong') { this.onPong(msg); return; }
        this.on.message(msg);
      };
      ws.onclose = () => {
        clearTimeout(to);
        const was = this.open;
        this.open = false;
        clearInterval(this.pingTimer);
        if (!was) reject(new Error('closed'));
        else this.on.close();
      };
      ws.onerror = () => {};
    });
    return this.ready;
  }
  close() {
    clearInterval(this.pingTimer);
    this.open = false;
    if (this.ws) { this.ws.onclose = null; try { this.ws.close(); } catch {} }
    this.ws = null;
  }
  send(obj) {
    if (this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(obj)); } catch {} }
  }
  burstPing() {
    let n = 0;
    const iv = setInterval(() => { this.ping(); if (++n >= 6) clearInterval(iv); }, 120);
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.ping(), 2500);
  }
  ping() { this.send({ t: 'ping', id: ++this.pingId, c: performance.now() }); }
  onPong(msg) {
    const now = performance.now();
    if (typeof msg.c !== 'number' || typeof msg.s !== 'number') return;
    const rtt = now - msg.c;
    if (rtt < 0 || rtt > 5000) return;
    this.rtt = rtt;
    const off = msg.s - (msg.c + rtt / 2);
    this.samples.push({ rtt, off });
    if (this.samples.length > 12) this.samples.shift();
    // trust the lowest-latency samples most
    const best = [...this.samples].sort((a, b) => a.rtt - b.rtt).slice(0, 4);
    const target = best.reduce((a, s) => a + s.off, 0) / best.length;
    if (this.samples.length <= 3 || Math.abs(target - this.offset) > 250) this.offset = target;
    else this.offset += (target - this.offset) * 0.3;
  }
  serverNow() { return performance.now() + this.offset; }
}

// Kart state <-> compact array
export function packState(k) {
  const r = v => Math.round(v * 100) / 100;
  const flags = (k.boostT > 0 ? 1 : 0) | (k.spinT > 0 ? 2 : 0) | (k.shieldT > 0 ? 4 : 0) | (!k.grounded ? 8 : 0) | (k.respawnT > 0 && k.respawnPhase === 1 ? 16 : 0) | (k.finished ? 32 : 0) | (k.wrongWay ? 64 : 0) | (k.respawnT > 0 && k.respawnPhase === 0 ? 128 : 0);
  return [r(k.x), r(k.y), r(k.z), Math.round(k.yaw * 1000) / 1000, r(k.vx), r(k.vy), r(k.vz), r(k.steer), k.drift, k.driftStage, r(k.progress), k.lapsDone, flags, r(k.speed), r(k.spinAng), r(k.pitch), r(k.roll), Math.max(0, ITEM_CODES.indexOf(k.item)), k.boostKind || 0, k.rollT > 0 ? 1 : 0];
}

export class RemoteBuffer {
  constructor() { this.buf = []; this.lastTs = -Infinity; }
  push(ts, s) {
    if (!Array.isArray(s) || s.length < 17) return;
    for (let i = 0; i < s.length; i++) if (typeof s[i] !== 'number' || !Number.isFinite(s[i])) return;
    if (ts <= this.lastTs - 2000) return;
    this.lastTs = Math.max(this.lastTs, ts);
    const b = this.buf;
    let i = b.length;
    while (i > 0 && b[i - 1].ts > ts) i--;
    b.splice(i, 0, { ts, s });
    if (b.length > 40) b.shift();
  }
  // interpolated state at time t (server ms)
  sample(t) {
    const b = this.buf;
    if (!b.length) return null;
    if (t <= b[0].ts) return unpack(b[0].s);
    for (let i = b.length - 1; i >= 0; i--) {
      if (b[i].ts <= t) {
        const a = b[i], c = b[i + 1];
        if (!c) {
          // extrapolate a little from the last known velocity
          const dt = Math.min(0.25, (t - a.ts) / 1000);
          const u = unpack(a.s);
          u.x += u.vx * dt; u.z += u.vz * dt; if (u.air) u.y += u.vy * dt;
          return u;
        }
        const f = (t - a.ts) / Math.max(1, c.ts - a.ts);
        return lerpState(unpack(a.s), unpack(c.s), f);
      }
    }
    return unpack(b[0].s);
  }
}
function unpack(s) {
  const f = s[12] | 0;
  return {
    x: s[0], y: s[1], z: s[2], yaw: s[3], vx: s[4], vy: s[5], vz: s[6], steer: s[7], drift: s[8] | 0, driftStage: s[9] | 0,
    progress: s[10], lapsDone: s[11] | 0, boost: !!(f & 1), spin: !!(f & 2), shield: !!(f & 4), air: !!(f & 8), rescue: !!(f & 16), finished: !!(f & 32), hidden: !!(f & 128),
    speed: s[13], spinAng: s[14], pitch: s[15], roll: s[16], item: ITEM_CODES[s[17] | 0] || null, boostKind: s[18] | 0, rolling: !!s[19],
  };
}
function lerpState(a, b, f) {
  const l = (x, y) => x + (y - x) * f;
  let dy = b.yaw - a.yaw;
  if (dy > Math.PI) dy -= Math.PI * 2; else if (dy < -Math.PI) dy += Math.PI * 2;
  const o = { ...b };
  o.x = l(a.x, b.x); o.y = l(a.y, b.y); o.z = l(a.z, b.z); o.yaw = a.yaw + dy * f;
  o.vx = l(a.vx, b.vx); o.vy = l(a.vy, b.vy); o.vz = l(a.vz, b.vz); o.speed = l(a.speed, b.speed);
  o.pitch = l(a.pitch, b.pitch); o.roll = l(a.roll, b.roll); o.steer = l(a.steer, b.steer);
  o.progress = l(a.progress, b.progress);
  // a jump of more than 15 m means a respawn: don't slide across the map
  if (Math.hypot(b.x - a.x, b.z - a.z) > 15) { o.x = b.x; o.y = b.y; o.z = b.z; }
  return o;
}
