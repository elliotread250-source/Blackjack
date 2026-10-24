// Sinkhole client: the city arrives once on join; after that only "eaten"/"respawned" ids and hole
// positions. Objects are drawn back to front (by y) in a cheap oblique projection so buildings stand up.
import { boot } from './ui.js';
import { lerp } from './net.js';
import { steering, sender } from './input.js';

const HUES = [200, 18, 140, 280, 48, 330, 170, 228, 95, 0, 258, 190];
const SHIRTS = ['#ff7a59', '#4f8cff', '#ffd23f', '#7ad67a', '#c77dff', '#ff5c8a', '#3dd6d0', '#f2f5fa'];
const CARS = ['#e63946', '#457b9d', '#f1c453', '#2a9d8f', '#f4f1de', '#8d99ae', '#6a4c93', '#ff8c42'];
const hash = i => ((i * 2654435761) >>> 0) % 997;

const game = {
  me: null, size: 3600, block: 480, road: 120, types: [], objs: null, alive: null, order: [], falling: [], back: new Map(),
  blocks: [], names: new Map(), cam: null, scale: 1, ctrl: null,

  welcome(m) {
    const w = m.world;
    Object.assign(this, { me: m.you, size: w.size, block: w.block, road: w.road, types: w.types });
    const n = w.objs.length / 4;
    this.objs = { t: new Uint8Array(n), x: new Float32Array(n), y: new Float32Array(n), rot: new Float32Array(n) };
    for (let i = 0; i < n; i++) { this.objs.t[i] = w.objs[4 * i]; this.objs.x[i] = w.objs[4 * i + 1]; this.objs.y[i] = w.objs[4 * i + 2]; this.objs.rot[i] = w.objs[4 * i + 3]; }
    this.alive = new Uint8Array(n).fill(1);
    for (const i of w.dead) this.alive[i] = 0;
    // painter's order: things lower on screen are drawn later
    this.order = Array.from({ length: n }, (_, i) => i).sort((a, b) => (this.objs.y[a] + this.r(a)) - (this.objs.y[b] + this.r(b)));
    for (const [id, name] of w.names) this.names.set(id, name);
    // ground colour per block from what stands on it
    const step = this.block + this.road, per = Math.floor(this.size / step);
    this.blocks = [];
    for (let bx = 0; bx < per; bx++) for (let by = 0; by < per; by++) {
      const x0 = this.road / 2 + bx * step, y0 = this.road / 2 + by * step;
      let kind = 'plaza';
      for (let i = 0; i < n; i++) {
        const tn = this.types[this.objs.t[i]][0];
        if (this.objs.x[i] > x0 && this.objs.x[i] < x0 + this.block && this.objs.y[i] > y0 && this.objs.y[i] < y0 + this.block) {
          if (tn === 'fountain') { kind = 'park'; break; }
          if (tn === 'house') kind = 'lawn';
        }
      }
      this.blocks.push({ x0, y0, kind });
    }
    this.falling = []; this.back.clear();
  },

  r(i) { return this.types[this.objs.t[i]][1]; },

  event(e) {
    if (!this.objs) return;
    const x = e.x || [];
    for (let k = 0; k < x.length; k += 2) { this.alive[x[k]] = 0; this.falling.push({ i: x[k], hole: x[k + 1], t0: performance.now() }); }
    for (const i of e.o || []) { this.alive[i] = 1; this.back.set(i, performance.now()); }
    if (e.reset) { this.alive.fill(1); this.falling = []; }
    for (const [id, name] of e.pn || []) this.names.set(id, name);
  },

  reset() { this.objs = null; this.me = null; },

  holes(net, now) {
    const pr = net.pair(now);
    if (!pr) return new Map();
    const A = new Map(), ha = pr.a.d.h, hb = pr.b.d.h, out = new Map();
    for (let k = 0; k < ha.length; k += 5) A.set(ha[k], [ha[k + 1], ha[k + 2], ha[k + 3] / 10]);
    for (let k = 0; k < hb.length; k += 5) {
      const id = hb[k], x = hb[k + 1], y = hb[k + 2], r = hb[k + 3] / 10, a = A.get(id);
      out.set(id, a && Math.hypot(a[0] - x, a[1] - y) < 120 ? { x: lerp(a[0], x, pr.f), y: lerp(a[1], y, pr.f), r: lerp(a[2], r, pr.f), score: hb[k + 4] } : { x, y, r, score: hb[k + 4] });
    }
    return out;
  },

  render(ctx, W, H, now, net) {
    ctx.fillStyle = '#2b3039'; ctx.fillRect(0, 0, W, H);
    if (!this.objs) return;
    const holes = this.holes(net, now), mine = holes.get(this.me);
    if (mine) this.cam = this.cam ? [lerp(this.cam[0], mine.x, 0.3), lerp(this.cam[1], mine.y, 0.3)] : [mine.x, mine.y];
    const cam = this.cam || [this.size / 2, this.size / 2];
    const want = Math.max(W, H) / 2 / (380 + (mine ? mine.r : 40) * 4.2);
    this.scale = lerp(this.scale, want, 0.06);
    const s = this.scale, ox = W / 2 - cam[0] * s, oy = H / 2 - cam[1] * s;
    const vx0 = -ox / s - 200, vx1 = (W - ox) / s + 200, vy0 = -oy / s - 260, vy1 = (H - oy) / s + 200;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s);

    // ground: asphalt everywhere, then sidewalks and block interiors, then lane dashes
    ctx.fillStyle = '#3b414c'; ctx.fillRect(0, 0, this.size, this.size);
    const B = this.block;
    for (const b of this.blocks) {
      if (b.x0 > vx1 || b.x0 + B < vx0 || b.y0 > vy1 || b.y0 + B < vy0) continue;
      ctx.fillStyle = '#a3a9b3'; ctx.fillRect(b.x0, b.y0, B, B);
      ctx.fillStyle = b.kind === 'park' ? '#5f9f4f' : b.kind === 'lawn' ? '#86b96a' : '#c4c7cc';
      ctx.fillRect(b.x0 + 26, b.y0 + 26, B - 52, B - 52);
    }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.setLineDash([26, 22]);
    ctx.beginPath();
    const step = B + this.road;
    for (let k = 0; k * step <= this.size; k++) { const c = k * step; ctx.moveTo(c, 0); ctx.lineTo(c, this.size); ctx.moveTo(0, c); ctx.lineTo(this.size, c); }
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = '#ff5c7a'; ctx.lineWidth = 8; ctx.strokeRect(0, 0, this.size, this.size);

    // holes
    for (const [id, h] of holes) {
      if (h.x + h.r < vx0 || h.x - h.r > vx1 || h.y + h.r < vy0 || h.y - h.r > vy1) continue;
      const g = ctx.createRadialGradient(h.x, h.y, h.r * 0.15, h.x, h.y, h.r);
      g.addColorStop(0, '#000'); g.addColorStop(0.75, '#06080c'); g.addColorStop(1, '#1d2430');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `hsl(${HUES[id % HUES.length]} 90% ${id === this.me ? 68 : 55}%)`; ctx.lineWidth = Math.max(3, h.r * 0.09);
      ctx.stroke();
    }
    // things falling in: shrink toward the middle of the hole, clipped to it
    this.falling = this.falling.filter(f => now - f.t0 < 520);
    for (const f of this.falling) {
      const h = holes.get(f.hole); if (!h) continue;
      const k = (now - f.t0) / 520, i = f.i;
      ctx.save(); ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.clip();
      const x = lerp(this.objs.x[i], h.x, k * 0.8), y = lerp(this.objs.y[i], h.y, k * 0.8);
      ctx.translate(x, y); ctx.scale(1 - k * 0.85, 1 - k * 0.85); ctx.rotate(k * 2); ctx.globalAlpha = 1 - k * 0.7;
      this.drawObj(ctx, i, 0, 0, 0.25);
      ctx.restore();
    }
    // the city
    for (const i of this.order) {
      if (!this.alive[i]) continue;
      const x = this.objs.x[i], y = this.objs.y[i];
      if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      const back = this.back.get(i);
      if (back) { const k = (now - back) / 400; if (k >= 1) this.back.delete(i); else ctx.globalAlpha = k; }
      this.drawObj(ctx, i, x, y, 1);
      ctx.globalAlpha = 1;
    }
    // names over holes
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [id, h] of holes) {
      if (h.x < vx0 || h.x > vx1 || h.y < vy0 || h.y > vy1) continue;
      const fs = Math.max(13, h.r * 0.32) / Math.max(0.6, s) * 0.9;
      ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`;
      ctx.lineWidth = fs * 0.22; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.fillStyle = id === this.me ? '#ffd08a' : '#fff';
      const name = this.names.get(id) || '';
      ctx.strokeText(name, h.x, h.y - h.r - fs * 0.8); ctx.fillText(name, h.x, h.y - h.r - fs * 0.8);
    }
    ctx.restore();
  },

  // one object at (x, y). `flat` < 1 squashes building height (used while falling)
  drawObj(ctx, i, x, y, flat) {
    const [name, r] = this.types[this.objs.t[i]], rot = this.objs.rot[i], hsh = hash(i);
    const box = (w, h, height, side, roof) => {     // oblique box: side face below, roof raised by `height`
      const lift = height * 0.45 * flat;
      ctx.fillStyle = side; ctx.fillRect(x - w / 2, y - h / 2 - lift, w, h + lift);
      ctx.fillStyle = roof; ctx.fillRect(x - w / 2, y - h / 2 - lift, w, h);
      return lift;
    };
    const shadow = (rr) => { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + rr * 0.25, y + rr * 0.3, rr, rr * 0.8, 0, 0, Math.PI * 2); ctx.fill(); };
    const rotated = (fn) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); fn(); ctx.restore(); };
    switch (name) {
      case 'person':
        shadow(4); ctx.fillStyle = SHIRTS[hsh % SHIRTS.length]; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill();
        ctx.fillStyle = '#f0c8a0'; ctx.beginPath(); ctx.arc(x, y - 1, 2.6, 0, 7); ctx.fill(); break;
      case 'cone':
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 5, y + 4); ctx.lineTo(x - 5, y + 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, y - 1, 6, 2); break;
      case 'hydrant': shadow(5); ctx.fillStyle = '#d7263d'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb3bd'; ctx.beginPath(); ctx.arc(x - 1, y - 2, 2.2, 0, 7); ctx.fill(); break;
      case 'bin': ctx.fillStyle = '#2f5d3a'; ctx.fillRect(x - 6, y - 7, 12, 13); ctx.fillStyle = '#4a8a57'; ctx.fillRect(x - 6, y - 8, 12, 4); break;
      case 'lamp': shadow(3); ctx.fillStyle = '#5c6470'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,224,140,.85)'; ctx.beginPath(); ctx.arc(x, y - 6, 3.5, 0, 7); ctx.fill(); break;
      case 'bush': ctx.fillStyle = '#3d7a34'; for (const [dx, dy, rr] of [[-5, 2, 7], [5, 2, 7], [0, -4, 8]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, rr, 0, 7); ctx.fill(); } break;
      case 'bench': rotated(() => { ctx.fillStyle = '#8a5a35'; ctx.fillRect(-13, -4, 26, 8); ctx.fillStyle = '#b07a4a'; ctx.fillRect(-13, -4, 26, 3); }); break;
      case 'bike': rotated(() => { ctx.strokeStyle = '#2b2f36'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-7, 0, 4.5, 0, 7); ctx.moveTo(11.5, 0); ctx.arc(7, 0, 4.5, 0, 7); ctx.moveTo(-7, 0); ctx.lineTo(0, -4); ctx.lineTo(7, 0); ctx.stroke(); ctx.fillStyle = CARS[hsh % CARS.length]; ctx.fillRect(-2, -6, 5, 3); }); break;
      case 'tree':
        shadow(18); ctx.fillStyle = '#2f6b2a'; ctx.beginPath(); ctx.arc(x, y - 8 * flat, 20, 0, 7); ctx.fill();
        ctx.fillStyle = '#4b9440'; ctx.beginPath(); ctx.arc(x - 5, y - 13 * flat, 12, 0, 7); ctx.fill(); break;
      case 'car': case 'van': {
        const L = name === 'car' ? 50 : 62, Wd = name === 'car' ? 26 : 30;
        rotated(() => {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-L / 2 + 3, -Wd / 2 + 4, L, Wd);
          ctx.fillStyle = name === 'van' ? (hsh % 2 ? '#f4f1de' : '#457b9d') : CARS[hsh % CARS.length];
          ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 7); ctx.fill();
          ctx.fillStyle = 'rgba(20,30,45,.75)'; ctx.fillRect(L * 0.12, -Wd / 2 + 4, L * 0.16, Wd - 8); ctx.fillRect(-L * 0.34, -Wd / 2 + 4, L * 0.12, Wd - 8);
        });
        break;
      }
      case 'bus':
        rotated(() => {
          ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-48, -14, 100, 32);
          ctx.fillStyle = '#f1b51c'; ctx.beginPath(); ctx.roundRect(-50, -16, 100, 32, 6); ctx.fill();
          ctx.fillStyle = 'rgba(20,30,45,.7)'; for (let k = -40; k < 40; k += 14) ctx.fillRect(k, -12, 10, 6), ctx.fillRect(k, 6, 10, 6);
        });
        break;
      case 'kiosk': box(56, 50, 26, '#8c5b3b', '#d8d0c0'); ctx.fillStyle = '#e63946'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 28 + k * 14, y - 25 - 26 * 0.45 * flat, 7, 12); break;
      case 'fountain':
        ctx.fillStyle = '#9aa3ad'; ctx.beginPath(); ctx.arc(x, y, 48, 0, 7); ctx.fill();
        ctx.fillStyle = '#4aa3df'; ctx.beginPath(); ctx.arc(x, y, 40, 0, 7); ctx.fill();
        ctx.fillStyle = '#bfe6ff'; ctx.beginPath(); ctx.arc(x, y, 10 + 3 * Math.sin(performance.now() / 300), 0, 7); ctx.fill(); break;
      case 'house': {
        const w = 84, lift = box(w, w, 30, '#a86b4f', '#c98d6b');
        ctx.fillStyle = hsh % 2 ? '#8e3b2e' : '#4e5d73';
        ctx.fillRect(x - w / 2, y - w / 2 - lift, w, w / 2); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x - w / 2, y - w / 2 - lift, w, 4);
        break;
      }
      case 'shop': {
        const w = 110, lift = box(w, w, 42, '#7d8794', '#b9c0c9');
        ctx.fillStyle = CARS[hsh % CARS.length]; ctx.fillRect(x - w / 2, y + w / 2 - lift - 10, w, 10);
        ctx.fillStyle = '#d9dee4'; ctx.fillRect(x - w / 2 + 10, y - w / 2 - lift + 10, w - 20, w - 30);
        break;
      }
      case 'office': case 'tower': {
        const w = name === 'office' ? 150 : 200, height = name === 'office' ? 110 : 210;
        const lift = box(w, w, height, name === 'office' ? '#3b5f86' : '#4a5564', name === 'office' ? '#6f9ccc' : '#8c99a8');
        ctx.fillStyle = 'rgba(190,225,255,.55)';            // windows on the face
        for (let fy = y + w / 2 - lift + 8; fy < y + w / 2 - 8; fy += 16) for (let fx = x - w / 2 + 8; fx < x + w / 2 - 8; fx += 18) ctx.fillRect(fx, fy, 10, 8);
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - w / 2 + 14, y - w / 2 - lift + 14, w - 28, w - 28);
        break;
      }
      default: ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  },

  hud(net) {
    const s = net.latest();
    if (!s || !this.objs) return {};
    let mine = null;
    for (let k = 0; k < s.h.length; k += 5) if (s.h[k] === this.me) mine = s.h[k + 4];
    const left = Math.ceil(s.left), mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    if (s.ph === 'end') return { big: mine === null ? '' : String(mine), small: 'swallowed', center: `Next round in ${left}s` };
    return { big: mine === null ? '' : String(mine), small: 'mass swallowed', center: mm, centerWarn: left <= 15 };
  },

  attach(api) {
    this.ctrl = steering(api);
    sender(api, () => ({ t: 'in', a: Math.round(this.ctrl.angle * 100) / 100, m: Math.round(this.ctrl.mag * 10) / 10 }));
  },
};

boot({
  key: 'sinkhole', title: 'Sinkhole', accent: '#8f7bff',
  tagline: 'You are a hole in the road. Swallow people, then cars, then whole buildings. Bigger holes can swallow you.',
  howto: [
    'Mouse: point where to go, further from the middle is faster. Phone: drag anywhere. Keys: WASD / arrows.',
    'Anything smaller than you that slides over the middle falls in. Bigger things unlock as you grow.',
    'A hole 15% bigger than you can swallow you. You pop back up smaller, score kept.',
    'Rounds last 2½ minutes. Score: total mass swallowed in the round.',
  ],
  format: s => s.toLocaleString(),
  live: v => Math.round(v).toLocaleString(),
  endDelay: 200,
  game,
});
