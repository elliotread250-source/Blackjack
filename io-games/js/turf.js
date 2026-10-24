// Turf Wars client: keeps a copy of the grid (owner + trails) from the server's deltas and draws it.
import { boot } from './ui.js';
import { lerp } from './net.js';
import { fourWay, sender } from './input.js';

// territory / trail / head colours per player, picked by id
const HUES = [18, 200, 140, 280, 48, 330, 170, 228, 95, 0, 258, 190, 60, 305, 120, 215];
const pal = id => {
  const h = HUES[id % HUES.length], s = 78;
  return { land: `hsl(${h} ${s}% 46%)`, edge: `hsl(${h} ${s}% 30%)`, trail: `hsla(${h} ${s + 10}% 62% / .62)`, head: `hsl(${h} 90% 64%)` };
};
const cache = new Map();
const colors = id => { let c = cache.get(id); if (!c) cache.set(id, c = pal(id)); return c; };

const game = {
  N: 0, owner: null, trail: null, trails: new Map(), names: new Map(), counts: new Map(), me: null, cam: null,
  mini: null, miniCtx: null, miniDirty: true, miniAt: 0, net: null, ctrl: null,

  welcome(m) {
    const w = m.world;
    this.N = w.n;
    this.owner = new Int32Array(w.n * w.n);
    this.trail = new Int32Array(w.n * w.n);
    this.trails = new Map(); this.counts = new Map();
    let i = 0;
    for (let k = 0; k < w.owner.length; k += 2) {
      const v = w.owner[k], run = w.owner[k + 1];
      this.owner.fill(v, i, i + run);
      if (v) this.counts.set(v, (this.counts.get(v) || 0) + run);
      i += run;
    }
    for (const [pid, cells] of w.trails) { this.trails.set(pid, cells.slice()); for (const c of cells) this.trail[c] = pid; }
    for (const [id, name] of w.names) this.names.set(id, name);
    this.me = m.you;
    this.mini = document.createElement('canvas');
    this.mini.width = this.mini.height = w.n;
    this.miniCtx = this.mini.getContext('2d');
    this.miniDirty = true;
  },

  event(e) {
    if (!this.owner) return;
    const g = e.g || [];
    for (let k = 0; k < g.length; k += 2) {
      const i = g[k], v = g[k + 1], old = this.owner[i];
      if (old) this.counts.set(old, (this.counts.get(old) || 1) - 1);
      if (v) this.counts.set(v, (this.counts.get(v) || 0) + 1);
      this.owner[i] = v;
    }
    if (g.length) this.miniDirty = true;
    for (const pid of e.tc || []) {                           // trail cleared (captured or died)
      for (const c of this.trails.get(pid) || []) if (this.trail[c] === pid) this.trail[c] = 0;
      this.trails.delete(pid);
    }
    const ta = e.ta || [];
    for (let k = 0; k < ta.length; k += 2) {
      const i = ta[k], pid = ta[k + 1];
      this.trail[i] = pid;
      let list = this.trails.get(pid); if (!list) this.trails.set(pid, list = []);
      list.push(i);
    }
    for (const [id, name] of e.pn || []) this.names.set(id, name);
  },

  reset() { this.owner = null; },

  // interpolated head positions, in cells
  heads(net, now) {
    const pr = net.pair(now);
    const out = new Map();
    if (!pr) return out;
    const A = new Map(), pa = pr.a.d.p, pb = pr.b.d.p;
    for (let k = 0; k < pa.length; k += 4) A.set(pa[k], [pa[k + 1] / 100, pa[k + 2] / 100]);
    for (let k = 0; k < pb.length; k += 4) {
      const id = pb[k], x = pb[k + 1] / 100, y = pb[k + 2] / 100, a = A.get(id);
      // a jump of more than two cells is a respawn, not movement: don't slide across the map
      if (a && Math.abs(a[0] - x) + Math.abs(a[1] - y) < 2) out.set(id, [lerp(a[0], x, pr.f), lerp(a[1], y, pr.f), pb[k + 3]]);
      else out.set(id, [x, y, pb[k + 3]]);
    }
    return out;
  },

  render(ctx, W, H, now, net) {
    ctx.fillStyle = '#080b10';
    ctx.fillRect(0, 0, W, H);
    if (!this.owner) { this.idle(ctx, W, H, now); return; }
    const N = this.N, heads = this.heads(net, now);
    const mine = heads.get(this.me);
    if (mine) this.cam = this.cam ? [lerp(this.cam[0], mine[0], 0.35), lerp(this.cam[1], mine[1], 0.35)] : [mine[0], mine[1]];
    const cam = this.cam || [N / 2, N / 2];
    const CS = Math.max(16, Math.min(34, Math.min(W, H) / 26));
    const ox = W / 2 - cam[0] * CS, oy = H / 2 - cam[1] * CS;
    this.screen = mine ? [W / 2 + (mine[0] - cam[0]) * CS, H / 2 + (mine[1] - cam[1]) * CS] : [W / 2, H / 2];
    const x0 = Math.max(0, Math.floor(-ox / CS)), x1 = Math.min(N - 1, Math.ceil((W - ox) / CS));
    const y0 = Math.max(0, Math.floor(-oy / CS)), y1 = Math.min(N - 1, Math.ceil((H - oy) / CS));

    // map floor and a faint grid
    ctx.fillStyle = '#121925';
    ctx.fillRect(ox, oy, N * CS, N * CS);
    ctx.strokeStyle = 'rgba(255,255,255,.035)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 1; x++) { ctx.moveTo(ox + x * CS, oy + y0 * CS); ctx.lineTo(ox + x * CS, oy + (y1 + 1) * CS); }
    for (let y = y0; y <= y1 + 1; y++) { ctx.moveTo(ox + x0 * CS, oy + y * CS); ctx.lineTo(ox + (x1 + 1) * CS, oy + y * CS); }
    ctx.stroke();

    // territory: one fillRect per run of same-owner cells, then a darker lip where turf meets something else
    const own = this.owner, tr = this.trail, lip = Math.max(3, CS * 0.18);
    for (let y = y0; y <= y1; y++) {
      let x = x0;
      while (x <= x1) {
        const v = own[y * N + x];
        let e = x;
        while (e + 1 <= x1 && own[y * N + e + 1] === v) e++;
        if (v) { ctx.fillStyle = colors(v).land; ctx.fillRect(ox + x * CS, oy + y * CS, (e - x + 1) * CS + 0.5, CS + 0.5); }
        x = e + 1;
      }
    }
    // lips and trails: collect rectangles per colour, then one fill per colour (switching fillStyle per
    // cell is what costs frames on a busy map)
    const lips = new Map(), trails = new Map(), inset = CS * 0.16;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * N + x, v = own[i], t = tr[i];
        if (v && (y === N - 1 || own[i + N] !== v)) { let a = lips.get(v); if (!a) lips.set(v, a = []); a.push(x, y); }
        if (t) { let a = trails.get(t); if (!a) trails.set(t, a = []); a.push(x, y); }
      }
    }
    for (const [v, a] of lips) {
      ctx.fillStyle = colors(v).edge; ctx.beginPath();
      for (let k = 0; k < a.length; k += 2) ctx.rect(ox + a[k] * CS, oy + (a[k + 1] + 1) * CS - lip, CS + 0.5, lip);
      ctx.fill();
    }
    for (const [v, a] of trails) {
      ctx.fillStyle = colors(v).trail; ctx.beginPath();
      for (let k = 0; k < a.length; k += 2) ctx.rect(ox + a[k] * CS + inset, oy + a[k + 1] * CS + inset, CS - inset * 2, CS - inset * 2);
      ctx.fill();
    }
    // edge of the world
    ctx.strokeStyle = 'rgba(255,92,122,.75)'; ctx.lineWidth = 4;
    ctx.strokeRect(ox - 2, oy - 2, N * CS + 4, N * CS + 4);

    // heads and names
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.font = `600 ${Math.round(Math.max(11, CS * 0.42))}px Inter, system-ui, sans-serif`;
    for (const [id, [x, y]] of heads) {
      const sx = ox + x * CS, sy = oy + y * CS;
      if (sx < -CS || sy < -CS || sx > W + CS || sy > H + CS) continue;
      const c = colors(id), s = CS * 0.86;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      ctx.fillRect(sx - s / 2 + 3, sy - s / 2 + 4, s, s);
      ctx.fillStyle = c.head;
      ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      ctx.strokeStyle = id === this.me ? '#fff' : 'rgba(255,255,255,.55)'; ctx.lineWidth = id === this.me ? 3 : 1.5;
      ctx.strokeRect(sx - s / 2, sy - s / 2, s, s);
      ctx.fillStyle = 'rgba(8,11,16,.75)';
      ctx.fillText(this.names.get(id) || '', sx + 1, sy - s / 2 - 3);
      ctx.fillStyle = '#f2f5fa';
      ctx.fillText(this.names.get(id) || '', sx, sy - s / 2 - 4);
    }
    this.minimap(ctx, W, H, now, heads);
  },

  rgb(v) {
    const key = v === this.me ? -v : v;
    let c = this.rgbCache.get(key);
    if (!c) this.rgbCache.set(key, c = hsl(HUES[v % HUES.length], 0.78, v === this.me ? 0.62 : 0.42));
    return c;
  },
  rgbCache: new Map(),

  minimap(ctx, W, H, now, heads) {
    const size = Math.min(130, Math.min(W, H) * 0.24);
    if (this.miniDirty && now - this.miniAt > 200) {
      this.miniAt = now; this.miniDirty = false;
      const img = this.miniCtx.createImageData(this.N, this.N), d = img.data;
      for (let i = 0; i < this.owner.length; i++) {
        const v = this.owner[i], k = i * 4;
        if (v) { const [r, g, b] = this.rgb(v); d[k] = r; d[k + 1] = g; d[k + 2] = b; d[k + 3] = 255; }
        else { d[k] = 22; d[k + 1] = 29; d[k + 2] = 40; d[k + 3] = 235; }
      }
      this.miniCtx.putImageData(img, 0, 0);
    }
    const x = W - size - 12, y = H - size - 12;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.mini, x, y, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1; ctx.strokeRect(x - .5, y - .5, size + 1, size + 1);
    const mine = heads.get(this.me);
    if (mine) { ctx.fillStyle = '#fff'; ctx.fillRect(x + mine[0] / this.N * size - 2.5, y + mine[1] / this.N * size - 2.5, 5, 5); }
  },

  idle(ctx, W, H, now) {
    // menu backdrop before joining: drifting blocks of colour
    const CS = 38;
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137 + now * 0.012 * (1 + (i % 3))) % (W + 200)) - 100, y = (i * 89) % H;
      ctx.fillStyle = colors(i + 1).land; ctx.globalAlpha = 0.18;
      ctx.fillRect(x, y, CS * (2 + i % 4), CS * (1 + i % 3));
    }
    ctx.globalAlpha = 1;
  },

  hud(net) {
    if (!this.owner) return {};
    const pct = (this.counts.get(this.me) || 0) * 100 / (this.N * this.N);
    return { big: `${pct.toFixed(2)}%`, small: 'of the map is yours' };
  },

  attach(api) {
    this.ctrl = fourWay(api, () => this.screen || [innerWidth / 2, innerHeight / 2]);
    sender(api, () => (this.ctrl.dir === null ? null : { t: 'in', d: this.ctrl.dir }));
  },
};

function hsl(h, s, l) {
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

boot({
  key: 'turf-wars', title: 'Turf Wars', accent: '#ff9b3d',
  tagline: 'Leave your turf, draw a loop, come home: everything inside is yours. Get your trail cut and you lose it all.',
  howto: [
    'Arrow keys / WASD, or point the mouse where to go. On a phone, swipe.',
    'Outside your turf you leave a trail. Close the loop to claim what it surrounds.',
    'Cross anyone\'s trail and they\'re out. Your own trail and the edge are deadly too.',
    'Score: your peak share of the map.',
  ],
  format: s => `${(s / 100).toFixed(2)}%`,
  live: v => `${Number(v).toFixed(2)}%`,
  crashText: 'You crashed into a trail or the edge.',
  game,
});
