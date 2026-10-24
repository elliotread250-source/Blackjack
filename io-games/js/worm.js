// Wormhole Run client: decodes each viewer snapshot, interpolates every body point index by index (the
// server keeps point i on the same piece of body), and draws glowing worms over a dot-grid void.
import { boot } from './ui.js';
import { lerp } from './net.js';
import { steering, sender } from './input.js';

const HUES = [176, 300, 48, 206, 128, 18, 262, 336];
const width = mass => 8 + Math.sqrt(mass) * 0.55;

// one soft-glow sprite per pellet colour, drawn once
const sprites = HUES.map(h => {
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const g = c.getContext('2d'), grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  grad.addColorStop(0, `hsla(${h} 100% 88% / 1)`); grad.addColorStop(0.28, `hsla(${h} 100% 62% / .95)`); grad.addColorStop(1, `hsla(${h} 100% 50% / 0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 48, 48);
  return c;
});

function decode(flat) {
  const n = flat.length / 2, out = new Float32Array(flat.length);
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) { x = i ? x + flat[2 * i] : flat[0]; y = i ? y + flat[2 * i + 1] : flat[1]; out[2 * i] = x; out[2 * i + 1] = y; }
  return out;
}

const game = {
  R: 2800, me: null, names: new Map(), pellets: new Map(), eaten: [], cam: null, zoom: 1, mm: [], grid: null, ctrl: null, decoded: new WeakMap(),

  welcome(m) { this.R = m.world.r; this.me = m.you; this.pellets.clear(); this.eaten = []; this.names.clear(); this.mm = []; this.lastK = 0; },
  event() {},
  reset() { this.me = null; this.pellets.clear(); },

  ingest(s) {
    for (const [id, name] of s.nm || []) this.names.set(id, name);
    if (s.pl) {
      // the server sent every pellet inside rect pv: anything we hold in that rect and it didn't send is gone
      const [x0, y0, x1, y1] = s.pv, seen = new Set();
      for (let k = 0; k < s.pl.length; k += 5) {
        const id = s.pl[k]; seen.add(id);
        if (!this.pellets.has(id)) this.pellets.set(id, { x: s.pl[k + 1], y: s.pl[k + 2], v: s.pl[k + 3], c: s.pl[k + 4], born: performance.now() });
      }
      for (const [id, p] of this.pellets) if (!seen.has(id) && p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) this.pellets.delete(id);
    }
    for (const [pid, eater] of s.e || []) {
      const p = this.pellets.get(pid);
      if (p) { this.pellets.delete(pid); this.eaten.push({ ...p, eater, t0: performance.now() }); }
    }
    if (s.mm) this.mm = s.mm;
  },

  worms(net, now) {
    const pr = net.pair(now);
    if (!pr) return [];
    const pts = snap => { let d = this.decoded.get(snap); if (!d) { d = new Map(snap.d.w.map(w => [w[0], { mass: w[1], boost: w[2], color: w[3], pts: decode(w[4]) }])); this.decoded.set(snap, d); } return d; };
    const A = pts(pr.a), B = pts(pr.b), out = [];
    for (const [id, b] of B) {
      const a = A.get(id);
      if (!a || Math.abs(a.pts[0] - b.pts[0]) + Math.abs(a.pts[1] - b.pts[1]) > 200) { out.push({ id, ...b }); continue; }
      const n = b.pts.length, m = a.pts.length, p = new Float32Array(n);
      for (let i = 0; i < n; i++) p[i] = i < m ? lerp(a.pts[i], b.pts[i], pr.f) : b.pts[i];
      out.push({ id, mass: lerp(a.mass, b.mass, pr.f), boost: b.boost, color: b.color, pts: p });
    }
    return out;
  },

  render(ctx, W, H, now, net) {
    const latest = net.latest();
    if (latest && latest !== this.lastIngested) {
      // ingest every snapshot we haven't seen (several may arrive between frames)
      for (const s of net.snaps) if (s.k > (this.lastK || 0)) { this.ingest(s.d); this.lastK = s.k; }
      this.lastIngested = latest;
    }
    const worms = this.me ? this.worms(net, now) : [];
    const mine = worms.find(w => w.id === this.me);
    const target = mine ? [mine.pts[0], mine.pts[1]] : latest && latest.cam ? latest.cam : this.cam || [0, 0];
    this.cam = this.cam ? [lerp(this.cam[0], target[0], 0.25), lerp(this.cam[1], target[1], 0.25)] : target;
    if (latest && latest.z) this.zoom = lerp(this.zoom, latest.z, 0.05);
    const scale = Math.max(W, H) / (2 * 900 * this.zoom);
    const [cx, cy] = this.cam;
    const sx = x => (x - cx) * scale + W / 2, sy = y => (y - cy) * scale + H / 2;

    // void + dot grid
    ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
    const step = 64, r = Math.max(1, 1.6 * scale);
    ctx.fillStyle = 'rgba(120,150,210,.16)';
    const gx0 = Math.floor((cx - W / 2 / scale) / step) * step, gy0 = Math.floor((cy - H / 2 / scale) / step) * step;
    for (let x = gx0; x < cx + W / 2 / scale + step; x += step)
      for (let y = gy0; y < cy + H / 2 / scale + step; y += step)
        if (x * x + y * y < this.R * this.R) ctx.fillRect(sx(x) - r / 2, sy(y) - r / 2, r, r);
    // arena edge
    ctx.beginPath(); ctx.arc(sx(0), sy(0), this.R * scale, 0, Math.PI * 2);
    ctx.lineWidth = 10 * scale + 2; ctx.strokeStyle = 'rgba(255,92,122,.55)'; ctx.stroke();
    ctx.lineWidth = 40 * scale; ctx.strokeStyle = 'rgba(255,92,122,.08)'; ctx.stroke();
    if (!this.me) return;

    // pellets (gentle pulse) and the ones being slurped into a mouth
    const t = now / 1000;
    for (const [id, p] of this.pellets) {
      const x = sx(p.x), y = sy(p.y);
      if (x < -30 || y < -30 || x > W + 30 || y > H + 30) continue;
      const s = (5 + p.v * 2.2) * scale * (1 + 0.12 * Math.sin(t * 3 + id)) * Math.min(1, (now - p.born) / 300 + 0.2);
      ctx.drawImage(sprites[p.c % sprites.length], x - s * 1.6, y - s * 1.6, s * 3.2, s * 3.2);
    }
    const heads = new Map(worms.map(w => [w.id, w.pts]));
    this.eaten = this.eaten.filter(p => now - p.t0 < 220);
    for (const p of this.eaten) {
      const h = heads.get(p.eater), f = (now - p.t0) / 220;
      const x = h ? lerp(p.x, h[0], f) : p.x, y = h ? lerp(p.y, h[1], f) : p.y, s = (5 + p.v * 2.2) * scale * (1 - f);
      ctx.drawImage(sprites[p.c % sprites.length], sx(x) - s * 1.6, sy(y) - s * 1.6, s * 3.2, s * 3.2);
    }

    // worms, smallest first so big ones sit on top; yours last
    worms.sort((a, b) => (a.id === this.me) - (b.id === this.me) || a.mass - b.mass);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const w of worms) this.drawWorm(ctx, w, sx, sy, scale, t);
    this.minimap(ctx, W, H, mine);
  },

  drawWorm(ctx, w, sx, sy, scale, t) {
    const p = w.pts, n = p.length / 2, h = HUES[w.color % HUES.length], rad = width(w.mass) * scale;
    ctx.beginPath();
    ctx.moveTo(sx(p[2 * n - 2]), sy(p[2 * n - 1]));
    for (let i = n - 2; i > 0; i--) {      // quadratic through midpoints: smooth curve from sparse points
      const x = sx(p[2 * i]), y = sy(p[2 * i + 1]), x2 = sx(p[2 * i - 2]), y2 = sy(p[2 * i - 1]);
      ctx.quadraticCurveTo(x, y, (x + x2) / 2, (y + y2) / 2);
    }
    ctx.lineTo(sx(p[0]), sy(p[1]));
    ctx.strokeStyle = `hsla(${h} 100% 60% / ${w.boost ? 0.35 : 0.16})`; ctx.lineWidth = rad * 2 + (w.boost ? 16 : 9) * scale + 4; ctx.stroke();
    ctx.strokeStyle = `hsl(${h} 78% 46%)`; ctx.lineWidth = rad * 2; ctx.setLineDash([]); ctx.stroke();
    ctx.strokeStyle = `hsl(${h} 95% 66%)`; ctx.lineWidth = rad * 1.15;
    ctx.setLineDash([rad * 0.9, rad * 1.1]); ctx.lineDashOffset = -t * (w.boost ? 60 : 20); ctx.stroke();
    ctx.setLineDash([]);
    // head with eyes looking where it's going
    const hx = sx(p[0]), hy = sy(p[1]), ang = Math.atan2(p[1] - p[3], p[0] - p[2]);
    ctx.fillStyle = `hsl(${h} 90% 62%)`; ctx.beginPath(); ctx.arc(hx, hy, rad * 1.08, 0, Math.PI * 2); ctx.fill();
    for (const side of [-1, 1]) {
      const ex = hx + Math.cos(ang + side * 0.75) * rad * 0.55, ey = hy + Math.sin(ang + side * 0.75) * rad * 0.55;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, rad * 0.36, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#05070d'; ctx.beginPath(); ctx.arc(ex + Math.cos(ang) * rad * 0.14, ey + Math.sin(ang) * rad * 0.14, rad * 0.18, 0, Math.PI * 2); ctx.fill();
    }
    const name = this.names.get(w.id);
    if (name && w.id !== this.me) {
      ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(242,245,250,.85)'; ctx.fillText(name, hx, hy + rad * 1.4 + 4);
    }
  },

  minimap(ctx, W, H, mine) {
    // on touch screens the bottom-right corner belongs to the BOOST button
    const size = Math.min(120, Math.min(W, H) * 0.24), r = size / 2, cx = this.touch ? r + 14 : W - r - 14, cy = H - r - (this.touch ? 84 : 14);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16,21,29,.78)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,92,122,.45)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = 'rgba(166,173,186,.8)';
    for (let k = 0; k < this.mm.length; k += 3) {
      const s = 1 + this.mm[k + 2] * 0.45;
      ctx.fillRect(cx + this.mm[k] / 100 * r - s / 2, cy + this.mm[k + 1] / 100 * r - s / 2, s, s);
    }
    if (mine) {
      ctx.fillStyle = '#fff'; ctx.beginPath();
      ctx.arc(cx + mine.pts[0] / this.R * r, cy + mine.pts[1] / this.R * r, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  },

  hud(net) {
    const s = net.latest();
    const mine = s && s.w ? s.w.find(w => w[0] === this.me) : null;
    return mine ? { big: String(mine[1]), small: mine[2] ? 'length · boosting' : 'length' } : { big: '', small: '' };
  },

  attach(api) {
    this.touch = api.touch;
    this.ctrl = steering(api, { action: 'BOOST' });
    sender(api, () => ({ t: 'in', a: Math.round(this.ctrl.angle * 100) / 100, b: this.ctrl.action ? 1 : 0 }));
  },
};

boot({
  key: 'wormhole-run', title: 'Wormhole Run', accent: '#4ef0d6',
  tagline: 'Slurp up starlight, grow long, and make the others crash into you. Touch anyone\'s body and you burst into light.',
  howto: [
    'Steer with the mouse (or WASD / arrows). On a phone, drag anywhere.',
    'Hold the mouse button, Space or BOOST to go fast. Boosting burns length.',
    'Your head hitting another worm\'s body ends your run. Your own body is safe.',
    'Score: the longest you got.',
  ],
  format: s => String(s),
  live: v => String(Math.round(v)),
  crashText: 'You hit the edge of the wormhole.',
  game,
});
