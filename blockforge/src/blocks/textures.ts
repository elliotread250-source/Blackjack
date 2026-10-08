// Procedural 16x16 pixel-art textures. Nothing here is copied from any game:
// every tile is drawn by code from noise, palettes and small shape routines.
import type { Dye, Wood } from './registry';
import { handmadeTexture } from './handmade';

export type RGB = [number, number, number];
type Rng = () => number;

const clamp = (v: number, a = 0, b = 255) => (v < a ? a : v > b ? b : v);
export const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mul = (c: RGB, f: number): RGB => [clamp(c[0] * f), clamp(c[1] * f), clamp(c[2] * f)];
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const add = (c: RGB, v: number): RGB => [clamp(c[0] + v), clamp(c[1] + v), clamp(c[2] + v)];
const gray = (v: number): RGB => [v, v, v];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Tex {
  d = new Uint8ClampedArray(1024);
  set(x: number, y: number, c: RGB, a = 255) {
    x &= 15; y &= 15;
    const i = (y * 16 + x) * 4;
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = a;
  }
  get(x: number, y: number): RGB {
    x &= 15; y &= 15;
    const i = (y * 16 + x) * 4;
    return [this.d[i], this.d[i + 1], this.d[i + 2]];
  }
  a(x: number, y: number) { return this.d[((y & 15) * 16 + (x & 15)) * 4 + 3]; }
  setA(x: number, y: number, a: number) { this.d[((y & 15) * 16 + (x & 15)) * 4 + 3] = a; }
  fill(fn: (x: number, y: number) => RGB | null, alpha = 255) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const c = fn(x, y);
      if (c) this.set(x, y, c, alpha);
    }
    return this;
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: RGB, a = 255) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, c, a);
    return this;
  }
  outline(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    for (let x = x0; x <= x1; x++) { this.set(x, y0, c); this.set(x, y1, c); }
    for (let y = y0; y <= y1; y++) { this.set(x0, y, c); this.set(x1, y, c); }
    return this;
  }
  shadeRect(x0: number, y0: number, x1: number, y1: number, f: number) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, mul(this.get(x, y), f), this.a(x, y));
    return this;
  }
  bevel(x0: number, y0: number, x1: number, y1: number, hi: number, lo: number) {
    for (let x = x0; x <= x1; x++) { this.set(x, y0, mul(this.get(x, y0), hi)); this.set(x, y1, mul(this.get(x, y1), lo)); }
    for (let y = y0 + 1; y < y1; y++) { this.set(x0, y, mul(this.get(x0, y), hi)); this.set(x1, y, mul(this.get(x1, y), lo)); }
    return this;
  }
  clear() { this.d.fill(0); return this; }
  copy() { const t = new Tex(); t.d.set(this.d); return t; }
  rotate(times: number) {
    const src = this.copy();
    for (let k = 0; k < (times & 3); k++) {
      const s = k === 0 ? src : this.copy();
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const i = (y * 16 + x) * 4, j = ((15 - x) * 16 + y) * 4;
        for (let c = 0; c < 4; c++) this.d[i + c] = s.d[j + c];
      }
    }
    return this;
  }
}

// Tileable value noise: `cx` x `cy` random cells wrapped over 16 pixels.
function pnoise(r: Rng, cx: number, cy = cx) {
  const g = new Float32Array(cx * cy);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const cw = 16 / cx, ch = 16 / cy;
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const fx = (x + 0.5) / cw - 0.5, fy = (y + 0.5) / ch - 0.5;
    const ix = Math.floor(fx), iy = Math.floor(fy);
    const tx = sm(fx - ix), ty = sm(fy - iy);
    const x0 = ((ix % cx) + cx) % cx, x1 = (x0 + 1) % cx;
    const y0 = ((iy % cy) + cy) % cy, y1 = (y0 + 1) % cy;
    const a = g[y0 * cx + x0] + (g[y0 * cx + x1] - g[y0 * cx + x0]) * tx;
    const b = g[y1 * cx + x0] + (g[y1 * cx + x1] - g[y1 * cx + x0]) * tx;
    return a + (b - a) * ty;
  };
}

// A ramp of n colours from dark to light around a base colour.
function ramp(base: RGB, n: number, spread = 0.35): RGB[] {
  const out: RGB[] = [];
  for (let i = 0; i < n; i++) out.push(mul(base, 1 - spread + (2 * spread * i) / (n - 1)));
  return out;
}

interface SpeckleOpts { layers?: [number, number][]; white?: number; contrast?: number; bias?: number }
// Noise field quantised into a small palette: the core of most natural textures.
function field(r: Rng, o: SpeckleOpts = {}) {
  const layers = (o.layers ?? [[4, 0.6], [8, 0.4]]).map(([c, w]) => [pnoise(r, c), w] as const);
  const white = o.white ?? 0.35, contrast = o.contrast ?? 1.6, bias = o.bias ?? 0;
  const tw = layers.reduce((s, l) => s + l[1], 0) + white;
  const vals = new Float32Array(256);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let v = 0;
    for (const [n, w] of layers) v += n(x, y) * w;
    v += r() * white;
    v = v / tw;
    vals[y * 16 + x] = clamp(0.5 + (v - 0.5) * contrast + bias, 0, 0.9999);
  }
  return (x: number, y: number) => vals[(y & 15) * 16 + (x & 15)];
}
function speckle(r: Rng, pal: RGB[], o: SpeckleOpts = {}) {
  const f = field(r, o);
  return new Tex().fill((x, y) => pal[Math.floor(f(x, y) * pal.length)]);
}

// ---------------------------------------------------------------- base materials
const P = {
  stone: hex('#7d7d7d'), dirt: hex('#86603e'), sand: hex('#dccf9e'), redSand: hex('#bf6a26'),
  deepslate: hex('#4d4d52'), netherrack: hex('#6e2d2b'), endStone: hex('#dcdf9e'),
  granite: hex('#9a6b57'), diorite: hex('#c9c9c6'), andesite: hex('#868787'), tuff: hex('#6c6d65'),
  calcite: hex('#dfe0dc'), clay: hex('#a0a6b4'), mud: hex('#3c3a3c'), snow: hex('#f4fbfb'),
  blackstone: hex('#2e2a30'), basalt: hex('#4b4a4f'), obsidian: hex('#140f1f'),
};

function stone(r: Rng, base = P.stone) {
  return speckle(r, ramp(base, 5, 0.18), { layers: [[4, 0.5], [8, 0.5]], white: 0.5, contrast: 1.7 });
}
function dirt(r: Rng, base = P.dirt) {
  const t = speckle(r, ramp(base, 5, 0.28), { layers: [[4, 0.4], [16, 0.6]], white: 0.6, contrast: 1.5 });
  for (let i = 0; i < 7; i++) { const x = (r() * 16) | 0, y = (r() * 16) | 0; t.set(x, y, mul(base, 0.62)); }
  for (let i = 0; i < 4; i++) { const x = (r() * 16) | 0, y = (r() * 16) | 0; t.set(x, y, mul(base, 1.25)); }
  return t;
}
function sand(r: Rng, base = P.sand) {
  const t = speckle(r, ramp(base, 4, 0.08), { layers: [[8, 0.4], [16, 0.6]], white: 0.8, contrast: 1.4 });
  for (let i = 0; i < 6; i++) t.set((r() * 16) | 0, (r() * 16) | 0, mul(base, 0.84));
  return t;
}
function grassTop(r: Rng) {
  // Grey-scale: the biome colour is multiplied in by the shader. Alpha 0 = tinted pixel.
  const t = speckle(r, [gray(118), gray(140), gray(160), gray(178), gray(196)], { layers: [[4, 0.3], [16, 0.7]], white: 0.9, contrast: 1.5 });
  for (let i = 0; i < 256; i++) t.d[i * 4 + 3] = 0;
  return t;
}
function grassSide(r: Rng, snowy = false) {
  const t = dirt(r);
  const depth: number[] = [];
  for (let x = 0; x < 16; x++) depth.push(3 + (r() < 0.55 ? 1 : 0) + (r() < 0.2 ? 1 : 0));
  for (let x = 0; x < 16; x++) for (let y = 0; y < depth[x]; y++) {
    if (snowy) t.set(x, y, mul(P.snow, 0.93 + r() * 0.07));
    else t.set(x, y, gray(140 + r() * 50), 0);
  }
  return t;
}
function podzolTop(r: Rng) {
  return speckle(r, [hex('#4a3015'), hex('#5f3e1c'), hex('#7a5226'), hex('#8d6433'), hex('#a0753c')], { layers: [[4, 0.5], [16, 0.5]], white: 0.7 });
}
function topFringe(r: Rng, top: Tex, under: Tex, rows = 3) {
  const t = under.copy();
  for (let x = 0; x < 16; x++) {
    const d = rows + (r() < 0.5 ? 1 : 0);
    for (let y = 0; y < d; y++) t.set(x, y, top.get(x, (y + x * 3) & 15));
  }
  return t;
}
function gravel(r: Rng) {
  const t = speckle(r, ramp(hex('#827d7b'), 4, 0.15), { white: 0.8 });
  const cols = [hex('#6a6460'), hex('#9a9592'), hex('#5c5654'), hex('#b0a9a6'), hex('#7d726c')];
  for (let i = 0; i < 22; i++) {
    const x = (r() * 16) | 0, y = (r() * 16) | 0, c = cols[(r() * cols.length) | 0];
    const w = 1 + ((r() * 2) | 0), h = 1 + ((r() * 2) | 0);
    for (let dy = 0; dy <= h; dy++) for (let dx = 0; dx <= w; dx++) {
      const f = dy === 0 || dx === 0 ? 1.15 : dy === h || dx === w ? 0.78 : 1;
      t.set(x + dx, y + dy, mul(c, f));
    }
  }
  return t;
}
function cobble(r: Rng, base = P.stone, mossy = false) {
  const n = 9;
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) pts.push([r() * 16, r() * 16, 0.82 + r() * 0.3]);
  const t = new Tex();
  const noise = pnoise(r, 8);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let d1 = 99, d2 = 99, best = 0;
    for (let i = 0; i < n; i++) {
      let dx = Math.abs(x + 0.5 - pts[i][0]); dx = Math.min(dx, 16 - dx);
      let dy = Math.abs(y + 0.5 - pts[i][1]); dy = Math.min(dy, 16 - dy);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) { d2 = d1; d1 = d; best = i; } else if (d < d2) d2 = d;
    }
    const p = pts[best];
    if (d2 - d1 < 1.1) { t.set(x, y, mul(base, 0.52 + noise(x, y) * 0.12)); continue; }
    let ox = x + 0.5 - p[0]; if (ox > 8) ox -= 16; if (ox < -8) ox += 16;
    let oy = y + 0.5 - p[1]; if (oy > 8) oy -= 16; if (oy < -8) oy += 16;
    const light = 1 - (ox + oy) * 0.035;
    let f = p[2] * light * (0.92 + noise(x, y) * 0.16);
    f = Math.round(f * 8) / 8;
    t.set(x, y, mul(base, f));
  }
  if (mossy) addMoss(r, t, 0.45);
  return t;
}
function addMoss(r: Rng, t: Tex, amount: number) {
  const n = pnoise(r, 4), n2 = pnoise(r, 8);
  const moss = [hex('#4f6b2c'), hex('#5f7d34'), hex('#6f8f3c'), hex('#567532')];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++)
    if (n(x, y) * 0.7 + n2(x, y) * 0.3 > 1 - amount) t.set(x, y, moss[(r() * moss.length) | 0]);
}
function stoneBricks(r: Rng, base = P.stone, variant: 'plain' | 'mossy' | 'cracked' = 'plain') {
  const t = speckle(r, ramp(base, 4, 0.08), { white: 0.6 });
  const mortar = mul(base, 0.6);
  for (let x = 0; x < 16; x++) { t.set(x, 7, mortar); t.set(x, 15, mortar); }
  for (let y = 0; y < 7; y++) t.set(15, y, mortar);
  for (let y = 8; y < 15; y++) t.set(7, y, mortar);
  // bevels
  const brick = (x0: number, y0: number, x1: number, y1: number) => t.bevel(x0, y0, x1, y1, 1.12, 0.86);
  brick(0, 0, 14, 6); brick(8, 8, 15, 14); brick(0, 8, 6, 14);
  if (variant === 'mossy') addMoss(r, t, 0.4);
  if (variant === 'cracked') crack(r, t, mul(base, 0.45), 3);
  return t;
}
function crack(r: Rng, t: Tex, c: RGB, n: number) {
  for (let k = 0; k < n; k++) {
    let x = (r() * 16) | 0, y = (r() * 16) | 0;
    const len = 5 + ((r() * 6) | 0);
    for (let i = 0; i < len; i++) {
      t.set(x, y, c);
      x += r() < 0.5 ? (r() < 0.5 ? -1 : 1) : 0;
      y += r() < 0.7 ? 1 : 0;
    }
  }
}
function bricks(r: Rng, brick = hex('#965a49'), mortar = hex('#b4aca4'), rowH = 4, w = 8) {
  const t = new Tex();
  const rows = 16 / rowH;
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? w / 2 : 0;
    for (let b = 0; b < 16 / w + 1; b++) {
      const shade = 0.88 + r() * 0.22;
      for (let y = row * rowH; y < row * rowH + rowH; y++) for (let xx = 0; xx < w; xx++) {
        const x = (b * w + xx + off) & 15;
        const isM = y === row * rowH + rowH - 1 || xx === w - 1;
        if (isM) t.set(x, y, mul(mortar, 0.9 + r() * 0.12));
        else {
          let f = shade * (0.93 + r() * 0.12);
          if (y === row * rowH) f *= 1.1;
          t.set(x, y, mul(brick, f));
        }
      }
    }
  }
  return t;
}
function planks(r: Rng, base: RGB) {
  const t = new Tex();
  const grain = pnoise(r, 2, 16);
  for (let b = 0; b < 4; b++) {
    const s = 0.93 + r() * 0.12;
    const seam = (r() * 16) | 0;
    for (let y = b * 4; y < b * 4 + 4; y++) for (let x = 0; x < 16; x++) {
      let f = s * (0.9 + grain(x, y) * 0.18);
      if (y === b * 4 + 3) f *= 0.72;
      else if (y === b * 4) f *= 1.06;
      if (x === seam && y !== b * 4 + 3) f *= 0.75;
      f = Math.round(f * 14) / 14;
      t.set(x, y, mul(base, f));
    }
    if (r() < 0.6) t.set((seam + 2 + ((r() * 10) | 0)) & 15, b * 4 + 1, mul(base, 0.78));
  }
  return t;
}
function barkSide(r: Rng, base: RGB, birch = false) {
  const t = new Tex();
  const colShade: number[] = [];
  for (let x = 0; x < 16; x++) colShade.push(0.82 + r() * 0.3);
  const n = pnoise(r, 8, 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    let f = colShade[x] * (0.88 + n(x, y) * 0.24);
    if (!birch && (x % 4 === 0 || x % 4 === 3) && r() < 0.6) f *= 0.78;
    f = Math.round(f * 10) / 10;
    t.set(x, y, mul(base, f));
  }
  if (birch) {
    // dark birch marks
    for (let k = 0; k < 7; k++) {
      const y = (r() * 16) | 0, x = (r() * 14) | 0, w = 2 + ((r() * 3) | 0);
      for (let i = 0; i < w; i++) t.set(x + i, y, hex('#2b2a26'));
      if (r() < 0.5) t.set(x + 1, y + 1, hex('#45433d'));
    }
  }
  return t;
}
function logTop(r: Rng, inner: RGB, bark: RGB, stripped = false) {
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5;
    const d = Math.max(Math.abs(dx), Math.abs(dy)) * 0.7 + Math.sqrt(dx * dx + dy * dy) * 0.3;
    if (d > 7.2 && !stripped) { t.set(x, y, mul(bark, 0.9 + r() * 0.2)); continue; }
    const ring = Math.floor(d / 1.6) % 2;
    t.set(x, y, mul(inner, (ring ? 0.88 : 1.02) * (0.95 + r() * 0.08) * (stripped && d > 7.2 ? 0.85 : 1)));
  }
  return t;
}
function leaves(r: Rng, base: RGB, holes = 0.24) {
  const t = new Tex();
  const n = pnoise(r, 8);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = n(x, y) * 0.5 + r() * 0.5;
    if (v < holes) { t.set(x, y, mul(base, 0.35), 0); continue; }
    const f = v > 0.82 ? 1.22 : v > 0.6 ? 1.05 : v > 0.42 ? 0.9 : 0.74;
    t.set(x, y, mul(base, f));
  }
  return t;
}
function oreOverlay(r: Rng, base: Tex, ore: RGB[], clusters = 5) {
  const t = base.copy();
  const spots: [number, number][] = [];
  for (let k = 0; k < clusters; k++) {
    let cx = 0, cy = 0;
    for (let tries = 0; tries < 20; tries++) {
      cx = 2 + ((r() * 12) | 0); cy = 2 + ((r() * 12) | 0);
      if (spots.every(([sx, sy]) => Math.abs(sx - cx) + Math.abs(sy - cy) > 4)) break;
    }
    spots.push([cx, cy]);
    const cells: [number, number][] = [[cx, cy]];
    const size = 3 + ((r() * 3) | 0);
    while (cells.length < size) {
      const [px, py] = cells[(r() * cells.length) | 0];
      const d = (r() * 4) | 0;
      const nx = px + (d === 0 ? 1 : d === 1 ? -1 : 0), ny = py + (d === 2 ? 1 : d === 3 ? -1 : 0);
      if (!cells.some(([a, b]) => a === nx && b === ny)) cells.push([nx, ny]);
    }
    for (const [x, y] of cells) {
      const above = cells.some(([a, b]) => a === x && b === y - 1);
      const left = cells.some(([a, b]) => a === x - 1 && b === y);
      const c = !above || !left ? ore[0] : ore[1];
      t.set(x, y, c);
      const below = cells.some(([a, b]) => a === x && b === y + 1);
      if (!below) t.set(x, y + 1, mul(t.get(x, y + 1), 0.7));
    }
    const [hx, hy] = cells[0];
    t.set(hx, hy, ore[2] ?? add(ore[0], 40));
  }
  return t;
}
function smoothStone(r: Rng, base: RGB, edge = true) {
  const t = speckle(r, ramp(base, 3, 0.04), { white: 0.6 });
  if (edge) t.outline(0, 0, 15, 15, mul(base, 0.82));
  return t;
}
function polished(r: Rng, base: RGB) {
  const t = speckle(r, ramp(base, 4, 0.1), { layers: [[4, 0.7], [8, 0.3]], white: 0.4 });
  t.bevel(0, 0, 15, 15, 1.15, 0.78);
  return t;
}
function tiles(r: Rng, base: RGB, size = 8) {
  const t = speckle(r, ramp(base, 3, 0.08), { white: 0.6 });
  for (let y = 0; y < 16; y += size) for (let x = 0; x < 16; x += size) {
    const s = 0.9 + r() * 0.2;
    t.shadeRect(x, y, x + size - 1, y + size - 1, s);
    t.bevel(x, y, x + size - 1, y + size - 1, 1.12, 0.62);
  }
  return t;
}
function metalBlock(r: Rng, base: RGB, style: 'plate' | 'gem' | 'rough' | 'ingot' = 'plate') {
  const t = speckle(r, ramp(base, 4, 0.12), { layers: [[2, 0.4], [8, 0.6]], white: 0.4 });
  if (style === 'plate') {
    t.bevel(0, 0, 15, 15, 1.25, 0.7);
    t.bevel(1, 1, 14, 14, 1.08, 0.88);
    for (let i = 3; i < 13; i += 3) t.set(i, i, add(base, 50));
  } else if (style === 'gem') {
    t.bevel(0, 0, 15, 15, 1.3, 0.65);
    for (let y = 2; y < 14; y += 4) for (let x = 2; x < 14; x += 4) {
      t.rect(x, y, x + 2, y + 2, mul(base, 1.15)); t.set(x, y, add(base, 70)); t.set(x + 2, y + 2, mul(base, 0.7));
    }
  } else if (style === 'rough') {
    for (let k = 0; k < 18; k++) t.set((r() * 16) | 0, (r() * 16) | 0, mul(base, r() < 0.5 ? 0.7 : 1.3));
  } else {
    for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) t.set(x, y, mul(base, 0.75));
    for (let y = 0; y < 16; y += 4) t.set(((y * 5) & 15), y + 1, add(base, 60));
  }
  return t;
}

// ---------------------------------------------------------------- dyes
export const DYE_RGB: Record<Dye, RGB> = {
  white: [233, 236, 236], orange: [240, 118, 19], magenta: [189, 68, 179], light_blue: [58, 175, 217],
  yellow: [248, 197, 39], lime: [112, 185, 25], pink: [237, 141, 172], gray: [62, 68, 71],
  light_gray: [142, 142, 134], cyan: [21, 137, 145], purple: [121, 42, 172], blue: [53, 57, 157],
  brown: [114, 71, 40], green: [84, 109, 27], red: [161, 39, 34], black: [21, 21, 26],
};
function wool(r: Rng, c: RGB) {
  const t = new Tex();
  const n = pnoise(r, 8);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const knit = ((x + (y >> 1) * 2) & 3) < 2 ? 1.05 : 0.95;
    const f = knit * (0.92 + n(x, y) * 0.1 + (r() - 0.5) * 0.06);
    t.set(x, y, mul(c, f));
  }
  return t;
}
function concrete(r: Rng, c: RGB) {
  return new Tex().fill(() => mul(c, 0.97 + r() * 0.05));
}
function powder(r: Rng, c: RGB) {
  const base = mix(c, [255, 255, 255], 0.12);
  const t = new Tex().fill(() => mul(base, 0.86 + r() * 0.22));
  for (let k = 0; k < 18; k++) t.set((r() * 16) | 0, (r() * 16) | 0, mix(base, [255, 255, 255], 0.35));
  for (let k = 0; k < 12; k++) t.set((r() * 16) | 0, (r() * 16) | 0, mul(base, 0.7));
  return t;
}
function terracottaOf(c: RGB): RGB { return mul(mix(c, [152, 94, 67], 0.55), 0.9); }
function terracotta(r: Rng, c: RGB) {
  const n = pnoise(r, 4);
  return new Tex().fill((x, y) => mul(c, 0.93 + n(x, y) * 0.08 + r() * 0.04));
}
function glazed(r: Rng, c: RGB) {
  // A 4-fold symmetric tile pattern: draw one 8x8 quadrant, rotate it into the others.
  const light = mix(c, [255, 255, 255], 0.45), dark = mul(c, 0.55), accent = mix(c, [255, 220, 120], 0.35);
  const q: RGB[][] = [];
  for (let y = 0; y < 8; y++) { q.push([]); for (let x = 0; x < 8; x++) q[y].push(c); }
  const kind = (r() * 4) | 0;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const d = x + y, m = Math.max(x, y), ad = Math.abs(x - y);
    let col: RGB = c;
    if (kind === 0) col = d === 7 || d === 3 ? dark : m === 0 ? light : ad === 0 && x > 3 ? accent : c;
    else if (kind === 1) col = m === 2 || (m === 6 && (x + y) % 2) ? dark : x === y ? light : m < 2 ? accent : c;
    else if (kind === 2) col = (x === 0 || y === 0) ? dark : d % 4 === 0 ? light : (x === 4 || y === 4) ? accent : c;
    else col = m === 7 ? dark : (Math.abs(x - 4) + Math.abs(y - 4) === 2) ? light : d === 10 ? accent : c;
    q[y][x] = mul(col, 0.95 + r() * 0.08);
  }
  const t = new Tex();
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    t.set(x, y, q[y][x]);
    t.set(15 - y, x, q[y][x]);
    t.set(15 - x, 15 - y, q[y][x]);
    t.set(y, 15 - x, q[y][x]);
  }
  return t;
}
function stainedGlass(r: Rng, c: RGB) {
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const border = x === 0 || y === 0 || x === 15 || y === 15;
    if (border) t.set(x, y, mul(c, 0.85), 225);
    else t.set(x, y, mix(c, [255, 255, 255], 0.12), 130);
  }
  for (let i = 0; i < 4; i++) t.set(3 + i, 11 - i, mix(c, [255, 255, 255], 0.5), 190);
  t.set(10, 4, mix(c, [255, 255, 255], 0.5), 190); t.set(11, 3, mix(c, [255, 255, 255], 0.5), 190);
  return t;
}
function glass(r: Rng) {
  const t = new Tex();
  const frame = hex('#d9eef2');
  for (let x = 0; x < 16; x++) { t.set(x, 0, frame); t.set(x, 15, mul(frame, 0.8)); }
  for (let y = 0; y < 16; y++) { t.set(0, y, frame); t.set(15, y, mul(frame, 0.8)); }
  for (let i = 0; i < 4; i++) t.set(3 + i, 7 - i, hex('#ffffff'));
  t.set(4, 7, hex('#cfe9ef')); t.set(10, 11, hex('#ffffff')); t.set(11, 10, hex('#ffffff')); t.set(12, 9, hex('#cfe9ef'));
  return t;
}

// ---------------------------------------------------------------- wood
interface WoodPal { planks: RGB; bark: RGB; stripped: RGB; leaves: RGB; tinted: boolean }
export const WOOD_PAL: Record<Wood, WoodPal> = {
  oak: { planks: hex('#b38d58'), bark: hex('#6b5232'), stripped: hex('#b18e57'), leaves: gray(150), tinted: true },
  spruce: { planks: hex('#735632'), bark: hex('#3c2a15'), stripped: hex('#76593a'), leaves: hex('#4b6f48'), tinted: false },
  birch: { planks: hex('#c8b67a'), bark: hex('#d8d6cf'), stripped: hex('#c4ad73'), leaves: hex('#7ca052'), tinted: false },
  jungle: { planks: hex('#a07350'), bark: hex('#584519'), stripped: hex('#ab8455'), leaves: gray(158), tinted: true },
  acacia: { planks: hex('#a85a32'), bark: hex('#686056'), stripped: hex('#ae5d3b'), leaves: gray(146), tinted: true },
  dark_oak: { planks: hex('#432b14'), bark: hex('#3c2e1a'), stripped: hex('#60492f'), leaves: gray(130), tinted: true },
  mangrove: { planks: hex('#763630'), bark: hex('#5a3d2c'), stripped: hex('#7a382f'), leaves: gray(140), tinted: true },
  cherry: { planks: hex('#e3b2ac'), bark: hex('#38212c'), stripped: hex('#d8939a'), leaves: hex('#eab0c8'), tinted: false },
};
function door(r: Rng, w: WoodPal, top: boolean) {
  const t = planks(r, w.planks).rotate(1);
  t.outline(0, 0, 15, 15, mul(w.planks, 0.6));
  if (top) {
    // two windows
    for (const x0 of [2, 9]) t.rect(x0, 2, x0 + 4, 8, mul(w.planks, 0.2), 0);
    t.rect(2, 10, 13, 13, mul(w.planks, 0.85));
    t.outline(2, 10, 13, 13, mul(w.planks, 0.7));
  } else {
    t.outline(2, 1, 13, 7, mul(w.planks, 0.7));
    t.outline(2, 9, 13, 14, mul(w.planks, 0.7));
    t.set(12, 0, hex('#3a3a3a')); t.set(12, 1, hex('#5a5a5a'));
  }
  return t;
}
function trapdoor(r: Rng, w: WoodPal) {
  const t = planks(r, w.planks);
  t.outline(0, 0, 15, 15, mul(w.planks, 0.62));
  for (const [x, y] of [[3, 3], [9, 3], [3, 9], [9, 9]]) t.rect(x, y, x + 3, y + 3, mul(w.planks, 0.2), 0);
  return t;
}
function sapling(r: Rng, w: WoodPal) {
  const t = new Tex();
  const stem = mul(w.bark, 1.1);
  for (let y = 9; y < 16; y++) t.set(7 + (y > 12 ? 0 : 0), y, stem);
  t.set(8, 12, stem); t.set(6, 11, stem);
  const leaf = w.tinted ? mix(w.leaves, hex('#3f8f2a'), 0.75) : w.leaves;
  const blob = (cx: number, cy: number, rad: number) => {
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      if (x * x + y * y > rad * rad + 1) continue;
      if (r() < 0.15) continue;
      t.set(cx + x, cy + y, mul(leaf, 0.8 + r() * 0.4));
    }
  };
  blob(7, 6, 3); blob(4, 8, 2); blob(10, 8, 2); blob(7, 3, 2);
  return t;
}

// ---------------------------------------------------------------- plants
function stem(t: Tex, x: number, y0: number, y1: number, c: RGB) { for (let y = y0; y <= y1; y++) t.set(x, y, c); }
function flower(r: Rng, kind: string) {
  const t = new Tex();
  const g = hex('#3f7d2a'), g2 = hex('#56a03a');
  const head = (cx: number, cy: number, petal: RGB, center: RGB | null, shape: 'round' | 'cup' | 'star' | 'ball' | 'bell') => {
    if (shape === 'round') {
      t.rect(cx - 1, cy - 1, cx + 1, cy + 1, petal);
      t.set(cx, cy - 2, petal); t.set(cx, cy + 2, petal); t.set(cx - 2, cy, petal); t.set(cx + 2, cy, petal);
      t.set(cx - 1, cy - 1, mul(petal, 1.15));
    } else if (shape === 'cup') {
      t.rect(cx - 1, cy - 2, cx + 1, cy + 1, petal);
      t.set(cx - 2, cy - 3, petal); t.set(cx, cy - 3, mul(petal, 1.1)); t.set(cx + 2, cy - 3, petal);
      t.set(cx - 2, cy - 2, mul(petal, 0.85)); t.set(cx + 2, cy - 2, mul(petal, 0.85));
      t.set(cx, cy - 1, mul(petal, 0.75));
    } else if (shape === 'star') {
      for (const [dx, dy] of [[0, -2], [0, 2], [-2, 0], [2, 0], [-1, -1], [1, 1], [1, -1], [-1, 1]]) t.set(cx + dx, cy + dy, petal);
      t.set(cx - 2, cy - 2, mul(petal, 0.9)); t.set(cx + 2, cy + 2, mul(petal, 0.9));
    } else if (shape === 'ball') {
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5 && (x + y) % 2 === 0) t.set(cx + x, cy + y, mul(petal, 0.85 + r() * 0.3));
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 5 && (x + y) % 2 !== 0) t.set(cx + x, cy + y, mul(petal, 0.6));
    } else {
      t.set(cx, cy, petal); t.set(cx - 1, cy + 1, petal); t.set(cx, cy + 1, mul(petal, 0.9)); t.set(cx + 1, cy + 1, petal);
    }
    if (center) t.set(cx, cy, center);
  };
  const leavesAt = (x: number, y: number) => { t.set(x - 1, y, g2); t.set(x - 2, y - 1, g2); t.set(x + 1, y + 1, g); t.set(x + 2, y, g2); };
  switch (kind) {
    case 'dandelion': stem(t, 7, 9, 15, g); leavesAt(7, 13); head(7, 7, hex('#f6d320'), hex('#e09a12'), 'round'); break;
    case 'poppy': stem(t, 7, 9, 15, g); leavesAt(7, 12); head(7, 6, hex('#d8231c'), hex('#2a1610'), 'round'); t.set(5, 5, hex('#b81c16')); t.set(9, 7, hex('#b81c16')); break;
    case 'blue_orchid': stem(t, 7, 9, 15, g); stem(t, 9, 11, 15, g); leavesAt(8, 13); head(6, 6, hex('#30b0e8'), hex('#d0f0ff'), 'star'); head(10, 9, hex('#2a9ad4'), null, 'star'); break;
    case 'allium': stem(t, 7, 7, 15, g); leavesAt(7, 13); head(7, 4, hex('#b05ae0'), null, 'ball'); break;
    case 'azure_bluet':
      stem(t, 5, 9, 15, g); stem(t, 9, 8, 15, g); stem(t, 11, 11, 15, g); stem(t, 7, 11, 15, g2);
      for (const [x, y] of [[5, 8], [9, 7], [11, 10], [7, 10]]) head(x, y, hex('#eef0f8'), hex('#e8d34c'), 'bell');
      break;
    case 'red_tulip': case 'orange_tulip': case 'white_tulip': case 'pink_tulip': {
      const c = kind === 'red_tulip' ? hex('#d63420') : kind === 'orange_tulip' ? hex('#ee8a1c') : kind === 'white_tulip' ? hex('#ecf0ee') : hex('#eca4c0');
      stem(t, 7, 8, 15, g); t.set(6, 13, g2); t.set(5, 12, g2); t.set(5, 11, g2); t.set(8, 12, g2); t.set(9, 11, g2);
      head(7, 7, c, null, 'cup'); break;
    }
    case 'oxeye_daisy': stem(t, 7, 9, 15, g); leavesAt(7, 13); head(7, 6, hex('#f2f3ee'), hex('#f0c822'), 'star'); t.set(7, 5, hex('#f2f3ee')); break;
    case 'cornflower': stem(t, 7, 8, 15, g); leavesAt(7, 13); head(7, 6, hex('#4a6ee0'), hex('#2a3c9c'), 'star'); break;
    case 'lily_of_the_valley':
      for (let y = 5; y < 16; y++) t.set(y < 8 ? 6 + (8 - y) : 6, y, g);
      t.set(4, 10, g2); t.set(3, 11, g2); t.set(10, 12, g2); t.set(11, 13, g2);
      for (const [x, y] of [[8, 5], [9, 8], [6, 9], [10, 4]]) { t.set(x, y, hex('#f6f8f2')); t.set(x, y + 1, hex('#e6e8e0')); }
      break;
  }
  return t;
}
function tallGrass(r: Rng, fern = false) {
  const t = new Tex();
  if (fern) {
    for (const [x0, lean] of [[7, 0], [4, -1], [11, 1]] as const) {
      const top = 2 + ((r() * 4) | 0);
      for (let y = top; y < 16; y++) {
        const x = x0 + Math.round(lean * (15 - y) * 0.25);
        t.set(x, y, gray(150 + r() * 40));
        if ((y - top) % 2 === 0 && y < 14) { t.set(x - 1, y, gray(130 + r() * 50)); t.set(x + 1, y + 1, gray(130 + r() * 50)); }
      }
    }
    return t;
  }
  for (let k = 0; k < 11; k++) {
    let x = 1 + ((r() * 14) | 0);
    const top = 3 + ((r() * 9) | 0);
    const lean = r() < 0.5 ? -1 : 1;
    for (let y = 15; y >= top; y--) {
      t.set(x, y, gray(130 + ((15 - y) / (15 - top)) * 70 + r() * 20));
      if (r() < 0.18) x += lean;
    }
  }
  return t;
}
function deadBush(r: Rng) {
  const t = new Tex();
  const c = hex('#7a5328'), c2 = hex('#94683a');
  const branch = (x: number, y: number, dx: number, len: number) => {
    for (let i = 0; i < len; i++) { t.set(x, y, i % 2 ? c2 : c); y--; if (i % 2) x += dx; }
  };
  branch(7, 15, 0, 6); branch(7, 11, -1, 7); branch(8, 11, 1, 7); branch(7, 9, 1, 5); branch(6, 12, -1, 4);
  return t;
}
function sugarCane(r: Rng) {
  const t = new Tex();
  const c = hex('#8fc35a'), j = hex('#6d9c3c'), l = hex('#a9d873');
  for (const x0 of [3, 8, 12]) for (let y = 0; y < 16; y++) {
    const joint = (y + x0) % 5 === 0;
    t.set(x0, y, joint ? j : c); t.set(x0 + 1, y, joint ? j : mul(c, 0.85));
  }
  for (const [x, y] of [[5, 4], [6, 3], [10, 9], [11, 8], [2, 12], [1, 11], [14, 2]]) t.set(x, y, l);
  return t;
}
function mushroom(r: Rng, red: boolean) {
  const t = new Tex();
  const stemC = hex('#d8cfc0');
  t.rect(7, 10, 8, 15, stemC); t.set(8, 15, mul(stemC, 0.85));
  const cap = red ? hex('#c8221c') : hex('#9a6c4c');
  if (red) {
    t.rect(4, 6, 11, 9, cap); t.rect(5, 5, 10, 5, cap); t.rect(6, 4, 9, 4, cap);
    for (const [x, y] of [[6, 6], [9, 5], [10, 8], [5, 8], [8, 7]]) t.set(x, y, hex('#f4f0ea'));
  } else {
    t.rect(4, 8, 11, 9, cap); t.rect(5, 7, 10, 7, mul(cap, 1.1)); t.rect(6, 6, 9, 6, mul(cap, 1.15));
  }
  return t;
}
function lilyPad(r: Rng) {
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 7.4) continue;
    if (dx > 0 && Math.abs(dy) < dx * 0.35) continue; // notch
    const vein = Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6 || Math.abs(dx - dy) < 0.7;
    t.set(x, y, gray(vein ? 190 : 140 + r() * 30 + (d < 4 ? 15 : 0)));
  }
  return t;
}
function seagrass(r: Rng) {
  const t = new Tex();
  for (let k = 0; k < 5; k++) {
    let x = 2 + ((r() * 12) | 0);
    for (let y = 15; y > 1 + r() * 6; y--) { t.set(x, y, mix(hex('#2f7a3a'), hex('#4fa45a'), r())); if (r() < 0.3) x += r() < 0.5 ? -1 : 1; }
  }
  return t;
}
function cobweb(r: Rng) {
  const t = new Tex();
  const c = hex('#e8e8ec');
  for (let i = 0; i < 16; i++) { t.set(i, i, c, 220); t.set(15 - i, i, c, 220); t.set(7, i, c, 200); t.set(i, 8, c, 200); }
  for (const rad of [3, 6]) for (let a = 0; a < 32; a++) {
    const x = Math.round(7.5 + Math.cos(a / 5.1) * rad), y = Math.round(7.5 + Math.sin(a / 5.1) * rad);
    t.set(x, y, c, 200);
  }
  return t;
}

// ---------------------------------------------------------------- crafted / decorative
function bookshelf(r: Rng) {
  const p = WOOD_PAL.oak.planks;
  const t = planks(r, p);
  const bookCols = [hex('#8a2b22'), hex('#2d4e8a'), hex('#3f6b2a'), hex('#b0892c'), hex('#5c2f6e'), hex('#3a3a3a'), hex('#a35a2a'), hex('#cfc4a4')];
  for (const y0 of [1, 9]) {
    t.rect(0, y0, 15, y0 + 5, mul(p, 0.38));
    let x = 1;
    while (x < 15) {
      const w = 1 + ((r() * 2) | 0), h = 4 + ((r() * 2) | 0), c = bookCols[(r() * bookCols.length) | 0];
      for (let i = 0; i < w && x < 15; i++, x++) {
        for (let y = y0 + 6 - h; y < y0 + 6; y++) t.set(x, y, mul(c, i === 0 ? 1.15 : 0.95));
        t.set(x, y0 + 6 - h + 1, mul(c, 0.7));
      }
      if (r() < 0.2) x++;
    }
    for (let x2 = 0; x2 < 16; x2++) t.set(x2, y0 + 6, mul(p, 0.85));
  }
  return t;
}
function craftingTop(r: Rng) {
  const p = WOOD_PAL.oak.planks;
  const t = planks(r, mul(p, 1.05));
  t.outline(0, 0, 15, 15, mul(p, 0.55));
  for (let i = 1; i < 15; i++) { t.set(5, i, mul(p, 0.62)); t.set(10, i, mul(p, 0.62)); t.set(i, 5, mul(p, 0.62)); t.set(i, 10, mul(p, 0.62)); }
  return t;
}
function craftingSide(r: Rng, front: boolean) {
  const p = WOOD_PAL.oak.planks;
  const t = planks(r, p);
  t.rect(0, 0, 15, 2, mul(p, 0.72)); t.bevel(0, 0, 15, 2, 1.1, 0.7);
  if (front) {
    // a saw and a hammer hanging on the front
    for (let x = 3; x < 8; x++) t.set(x, 6, hex('#b8b8b8'));
    for (let x = 3; x < 8; x += 1) t.set(x, 7, x % 2 ? hex('#8a8a8a') : hex('#b8b8b8'));
    t.rect(8, 5, 9, 7, hex('#5a3a1e'));
    t.rect(11, 5, 13, 6, hex('#7a7a7a')); t.rect(12, 7, 12, 11, hex('#5a3a1e'));
  } else {
    t.rect(3, 6, 12, 7, hex('#6a6a6a')); t.rect(5, 8, 6, 12, hex('#5a3a1e')); t.rect(10, 8, 10, 12, hex('#5a3a1e'));
  }
  return t;
}
function furnace(r: Rng, part: 'top' | 'side' | 'front', base = hex('#7a7a7a'), blast = false) {
  const t = smoothStone(r, base, false);
  t.bevel(0, 0, 15, 15, 1.15, 0.72);
  if (part === 'top') { t.outline(2, 2, 13, 13, mul(base, 0.85)); return t; }
  if (part === 'side') { t.rect(0, 0, 15, 1, mul(base, 0.9)); t.bevel(0, 0, 15, 15, 1.1, 0.75); if (blast) t.rect(3, 5, 12, 6, mul(base, 0.6)); return t; }
  t.rect(3, 2, 12, 5, mul(base, 0.55)); t.bevel(3, 2, 12, 5, 0.7, 1.2);
  t.rect(3, 8, 12, 13, hex('#1e1c1c')); t.bevel(3, 8, 12, 13, 0.7, 1.25);
  for (let x = 4; x < 12; x++) t.set(x, 12, x % 2 ? hex('#ff9a2a') : hex('#c8521c'));
  for (let x = 4; x < 12; x += 3) t.set(x, 11, hex('#ffd060'));
  if (blast) for (let x = 3; x <= 12; x += 3) for (let y = 8; y <= 13; y++) t.set(x, y, mul(base, 0.75));
  return t;
}
function chest(r: Rng, part: 'top' | 'side' | 'front') {
  const wood = hex('#a2742f');
  const t = planks(r, wood);
  const rim = mul(wood, 0.48);
  t.outline(1, part === 'top' ? 1 : 2, 14, part === 'top' ? 14 : 15, rim);
  if (part !== 'top') { for (let x = 1; x < 15; x++) t.set(x, 7, rim); }
  if (part === 'front') { t.rect(7, 6, 8, 9, hex('#c8c8c8')); t.set(7, 6, hex('#ffffff')); t.set(8, 9, hex('#7a7a7a')); }
  return t;
}
function pumpkin(r: Rng, part: 'top' | 'side' | 'face' | 'lit') {
  const c = hex('#d8811a');
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ridge = x % 4 === 0 ? 0.78 : x % 4 === 2 ? 1.08 : 0.96;
    t.set(x, y, mul(c, ridge * (0.94 + r() * 0.1)));
  }
  if (part === 'top') {
    const t2 = new Tex();
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      t2.set(x, y, mul(c, (d % 3 < 1 ? 0.82 : 1) * (0.94 + r() * 0.1)));
    }
    t2.rect(7, 7, 8, 8, hex('#5a6a20')); t2.set(8, 6, hex('#6e7e28'));
    return t2;
  }
  if (part === 'face' || part === 'lit') {
    const hole = part === 'lit' ? hex('#ffd34a') : hex('#3a2108');
    const hole2 = part === 'lit' ? hex('#ffb020') : hex('#2a1604');
    t.rect(3, 4, 5, 6, hole); t.rect(10, 4, 12, 6, hole); t.set(5, 6, hole2); t.set(12, 6, hole2);
    t.rect(3, 9, 12, 11, hole); t.set(3, 9, mul(c, 0.9)); t.set(12, 9, mul(c, 0.9));
    t.set(5, 9, mul(c, 0.95)); t.set(9, 11, mul(c, 0.95)); t.set(6, 11, hole2); t.set(11, 10, hole2);
  }
  return t;
}
function melon(r: Rng, top: boolean) {
  const g = hex('#6f9a26'), d = hex('#4a6e12');
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const stripe = top ? (Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) | 0) % 3 === 0 : (x + ((y * 0.2) | 0)) % 4 < 2;
    t.set(x, y, mul(stripe ? d : g, 0.9 + r() * 0.2));
  }
  return t;
}
function tnt(r: Rng, part: 'top' | 'bottom' | 'side') {
  const red = hex('#c8321e');
  const t = new Tex();
  if (part === 'side') {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(red, x % 4 === 3 ? 0.78 : 0.95 + r() * 0.08));
    t.rect(0, 5, 15, 10, hex('#e8e4dc'));
    // a little bomb glyph instead of letters
    t.rect(6, 6, 9, 9, hex('#2a2a2a')); t.set(10, 6, hex('#2a2a2a')); t.set(11, 5, hex('#f0a020'));
    t.rect(2, 7, 4, 8, hex('#c8321e')); t.rect(11, 7, 13, 8, hex('#c8321e'));
  } else {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(red, 0.9 + r() * 0.1));
    for (const [cx, cy] of [[4, 4], [11, 4], [4, 11], [11, 11]]) { t.rect(cx - 2, cy - 2, cx + 1, cy + 1, hex('#8a2010')); t.rect(cx - 1, cy - 1, cx, cy, hex('#e8e4dc')); }
    if (part === 'top') t.rect(7, 7, 8, 8, hex('#3a3a3a'));
  }
  return t;
}
function glowstone(r: Rng) {
  const base = [hex('#8a5a2a'), hex('#b8823c'), hex('#e0b860'), hex('#f8de8c'), hex('#fff4c0')];
  return speckle(r, base, { layers: [[4, 0.4], [8, 0.6]], white: 0.8, contrast: 1.9 });
}
function seaLantern(r: Rng) {
  const t = new Tex();
  const a = hex('#a8c8c0'), b = hex('#e4f4f0'), c = hex('#d0e8e4');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(c, 0.95 + r() * 0.08));
  t.outline(0, 0, 15, 15, a);
  for (let y = 3; y <= 12; y++) for (let x = 3; x <= 12; x++) if ((x + y) % 3 === 0 || (x - y + 15) % 4 === 0) t.set(x, y, b);
  t.outline(2, 2, 13, 13, mul(a, 1.05));
  return t;
}
function torch(r: Rng, soul = false) {
  const t = new Tex();
  const wood = hex('#6b4a26'), wood2 = hex('#8a6234');
  for (let y = 8; y < 16; y++) { t.set(7, y, wood2); t.set(8, y, wood); }
  const f1 = soul ? hex('#7ff4f8') : hex('#ffe070'), f2 = soul ? hex('#2ab8d0') : hex('#ff9a20'), f3 = soul ? hex('#ffffff') : hex('#fff8d0');
  t.set(7, 6, f1); t.set(8, 6, f2); t.set(7, 7, f2); t.set(8, 7, f1);
  t.set(7, 5, f3, 230); t.set(8, 5, f1, 200); t.set(7, 4, f1, 150);
  return t;
}
function lantern(r: Rng, soul = false) {
  const t = new Tex();
  const iron = hex('#3c4048'), iron2 = hex('#5a6070');
  const glow = soul ? hex('#6ee8f0') : hex('#ffcf5a'), glow2 = soul ? hex('#c8fcff') : hex('#fff0b0');
  // body (rows 9..15, cols 5..10)
  t.rect(5, 9, 10, 15, iron);
  t.rect(6, 10, 9, 14, glow); t.rect(7, 11, 8, 12, glow2);
  t.set(5, 9, iron2); t.set(10, 15, mul(iron, 0.7));
  // cap (rows 7..8, cols 6..9)
  t.rect(6, 7, 9, 8, iron2); t.set(7, 6, iron); t.set(8, 6, iron);
  // top of body (rows 0..5 used by top-face uv)
  t.rect(0, 0, 5, 5, iron); t.rect(1, 1, 4, 4, iron2); t.rect(2, 2, 3, 3, mul(glow, 0.8));
  return t;
}
function endRod() {
  const t = new Tex();
  for (let y = 0; y < 16; y++) { t.set(7, y, hex('#f4f0e8')); t.set(8, y, hex('#d8d0c8')); }
  t.rect(0, 0, 3, 3, hex('#c8b8d8')); t.rect(1, 1, 2, 2, hex('#e8dcf0'));
  return t;
}
function froglight(r: Rng, c: RGB, top: boolean) {
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = top ? Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)) : 0;
    const swirl = top ? (d | 0) % 3 === 0 : (x + y * 2) % 7 < 2;
    t.set(x, y, mul(c, (swirl ? 0.85 : 1.05) * (0.95 + r() * 0.08)));
  }
  if (!top) t.outline(0, 0, 15, 15, mul(c, 0.8));
  return t;
}
function hay(r: Rng, top: boolean) {
  const c = hex('#c4a028'), band = hex('#7a4a1c');
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (top) { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); t.set(x, y, mul(c, (d | 0) % 2 ? 0.88 : 1.02 + r() * 0.06)); }
    else t.set(x, y, mul(c, (x % 3 === 0 ? 0.85 : 1) * (0.92 + r() * 0.14)));
  }
  if (!top) { t.rect(0, 3, 15, 4, band); t.rect(0, 11, 15, 12, band); }
  return t;
}
function sponge(r: Rng, wet: boolean) {
  const c = wet ? hex('#a8a43c') : hex('#c8c048');
  const t = speckle(r, ramp(c, 4, 0.12), { white: 0.4 });
  for (let k = 0; k < 14; k++) {
    const x = (r() * 15) | 0, y = (r() * 15) | 0;
    t.rect(x, y, x + 1, y + (r() < 0.5 ? 0 : 1), mul(c, 0.55));
  }
  return t;
}
function slime(r: Rng) {
  const t = new Tex();
  const c = hex('#6cc04c');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(c, 0.95 + r() * 0.1), 170);
  t.outline(0, 0, 15, 15, mul(c, 0.8)); for (let i = 0; i < 16; i++) { t.setA(i, 0, 230); t.setA(i, 15, 230); t.setA(0, i, 230); t.setA(15, i, 230); }
  t.outline(3, 3, 12, 12, mul(c, 0.75)); for (let i = 3; i <= 12; i++) { t.setA(i, 3, 220); t.setA(i, 12, 220); t.setA(3, i, 220); t.setA(12, i, 220); }
  t.set(4, 4, hex('#c8f0b0'), 230); t.set(5, 4, hex('#c8f0b0'), 230);
  return t;
}
function honey(r: Rng) {
  const t = new Tex();
  const c = hex('#f0a82a');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(c, 0.92 + r() * 0.12), 200);
  t.outline(0, 0, 15, 15, mul(c, 0.8));
  for (let i = 0; i < 16; i++) { t.setA(i, 0, 240); t.setA(i, 15, 240); t.setA(0, i, 240); t.setA(15, i, 240); }
  t.set(4, 3, hex('#ffe6a0'), 230); t.set(3, 4, hex('#ffe6a0'), 230);
  return t;
}
function honeycomb(r: Rng) {
  const c = hex('#e09a28');
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const row = y >> 2, off = row % 2 ? 2 : 0;
    const edge = (y & 3) === 3 || ((x + off) & 3) === 3;
    t.set(x, y, edge ? mul(c, 0.68) : mul(c, 1 + r() * 0.08));
  }
  return t;
}
function noteBlock(r: Rng, top = false) {
  const wood = hex('#6a4426');
  const t = planks(r, wood);
  t.outline(0, 0, 15, 15, mul(wood, 0.55));
  if (!top) { t.rect(5, 6, 6, 11, hex('#2a1a10')); t.rect(7, 4, 11, 5, hex('#2a1a10')); t.rect(10, 5, 11, 10, hex('#2a1a10')); t.rect(3, 10, 6, 12, hex('#2a1a10')); t.rect(8, 9, 11, 11, hex('#2a1a10')); }
  else { t.rect(4, 4, 11, 11, hex('#2a1a10')); t.rect(5, 5, 10, 10, hex('#3a2a20')); }
  return t;
}
function target(r: Rng, top: boolean) {
  const t = new Tex();
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.sqrt((x - 7.5) ** 2 + (y - 7.5) ** 2);
    const ring = top ? 1 : (Math.floor(d / 2.2)) % 2;
    t.set(x, y, ring ? mul(hex('#e8dcc8'), 0.95 + r() * 0.08) : mul(hex('#d2342a'), 0.95 + r() * 0.08));
  }
  if (top) { const g = tallGrass(r); for (let i = 0; i < 1024; i += 4) if (g.d[i + 3]) { /* hay-ish top */ } }
  return t;
}
function barrel(r: Rng, top: boolean) {
  const wood = hex('#86603a');
  if (top) {
    const t = planks(r, wood).rotate(1);
    t.outline(0, 0, 15, 15, mul(wood, 0.5)); t.outline(1, 1, 14, 14, mul(wood, 0.8));
    t.rect(6, 6, 9, 9, mul(wood, 0.45));
    return t;
  }
  const t = planks(r, wood).rotate(1);
  for (const y of [2, 13]) for (let x = 0; x < 16; x++) t.set(x, y, hex('#4a4a4e'));
  return t;
}
function kelp(r: Rng, top: boolean) {
  const c = hex('#3a4a24');
  const t = speckle(r, ramp(c, 4, 0.2), { white: 0.5 });
  if (top) { t.outline(0, 0, 15, 15, mul(c, 0.7)); t.outline(4, 4, 11, 11, mul(c, 0.8)); }
  else for (let y = 0; y < 16; y += 5) for (let x = 0; x < 16; x++) t.set(x, y, mul(c, 0.65));
  return t;
}
function mushroomBlock(r: Rng, kind: 'brown' | 'red' | 'stem') {
  if (kind === 'stem') {
    const t = speckle(r, ramp(hex('#cfc8b8'), 4, 0.06), { layers: [[2, 0.6], [16, 0.4]], white: 0.5 });
    for (let x = 0; x < 16; x += 3) for (let y = 0; y < 16; y++) if (r() < 0.25) t.set(x, y, hex('#b8b0a0'));
    return t;
  }
  const c = kind === 'red' ? hex('#c42a22') : hex('#97704e');
  const t = speckle(r, ramp(c, 3, 0.06), { white: 0.4 });
  if (kind === 'red') for (const [x, y, w] of [[2, 3, 3], [10, 2, 2], [6, 8, 3], [12, 10, 2], [2, 12, 2]]) t.rect(x, y, x + w - 1, y + w - 1, hex('#ece8e0'));
  return t;
}
function cactus(r: Rng, part: 'top' | 'side' | 'bottom') {
  const c = hex('#5a8a2c');
  const t = new Tex();
  if (part === 'side') {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const rib = x % 4 === 1 ? 1.12 : x % 4 === 3 ? 0.82 : 1;
      t.set(x, y, mul(c, rib * (0.92 + r() * 0.1)));
    }
    for (let k = 0; k < 10; k++) { const x = ((r() * 4) | 0) * 4 + 1, y = (r() * 16) | 0; t.set(x, y, hex('#e8e0b8')); }
    return t;
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, mul(c, (d > 6 ? 0.8 : d < 2 ? 1.2 : 1) * (0.94 + r() * 0.08)));
  }
  if (part === 'top') { t.set(7, 7, hex('#d8e080')); t.set(8, 8, hex('#d8e080')); }
  return t;
}
function amethyst(r: Rng) {
  const pal = [hex('#5a3c8c'), hex('#7a54b0'), hex('#9a70d0'), hex('#c4a0f0'), hex('#e8d4ff')];
  const t = speckle(r, pal, { layers: [[4, 0.7], [8, 0.3]], white: 0.4, contrast: 1.8 });
  for (let k = 0; k < 6; k++) { const x = (r() * 15) | 0, y = (r() * 15) | 0; t.set(x, y, pal[4]); t.set(x + 1, y + 1, pal[3]); }
  return t;
}
function magma(r: Rng) {
  const t = speckle(r, [hex('#3a1408'), hex('#5a1c0c'), hex('#7a2a10'), hex('#8a3412')], { white: 0.5 });
  const n = pnoise(r, 4);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = n(x, y);
    if (v > 0.62 && v < 0.7) t.set(x, y, hex('#ff7a1a'));
    else if (v >= 0.7 && v < 0.74) t.set(x, y, hex('#ffb040'));
  }
  return t;
}
function crying(r: Rng) {
  const t = speckle(r, [hex('#0c0814'), hex('#160e22'), hex('#24163a'), hex('#3a2460')], { white: 0.6 });
  for (let k = 0; k < 9; k++) { const x = (r() * 16) | 0, y = (r() * 14) | 0; t.set(x, y, hex('#8a3ae0')); t.set(x, y + 1, hex('#c070ff')); }
  return t;
}
function water() {
  const t = new Tex();
  const r = makeRng(77);
  const n = pnoise(r, 4, 8);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = n(x, y);
    t.set(x, y, gray(v > 0.6 ? 220 : v > 0.4 ? 190 : 170), 200);
  }
  return t;
}
function lava() {
  const t = new Tex();
  const r = makeRng(99);
  const n = pnoise(r, 4), n2 = pnoise(r, 8);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const v = n(x, y) * 0.6 + n2(x, y) * 0.4;
    t.set(x, y, v > 0.62 ? hex('#ffd24a') : v > 0.5 ? hex('#ff9a1e') : v > 0.38 ? hex('#e8641a') : hex('#c8461a'));
  }
  return t;
}
function bedrock(r: Rng) {
  return speckle(r, [hex('#1e1e1e'), hex('#3a3a3a'), hex('#575757'), hex('#7a7a7a'), hex('#a0a0a0')], { layers: [[4, 0.5], [8, 0.5]], white: 0.5, contrast: 2.2 });
}
function deepslate(r: Rng, top: boolean) {
  if (top) return speckle(r, ramp(P.deepslate, 4, 0.14), { layers: [[4, 0.5], [8, 0.5]], white: 0.5 });
  return speckle(r, ramp(P.deepslate, 4, 0.16), { layers: [[8, 0.3], [16, 0.2]], white: 0.2, contrast: 1.7 }).fill((x, y) => null) && (() => {
    const t = new Tex();
    const rows = pnoise(r, 2, 8);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = rows(x, y) * 0.7 + r() * 0.3;
      t.set(x, y, mul(P.deepslate, 0.78 + Math.round(v * 4) / 4 * 0.38));
    }
    return t;
  })();
}
function snowTex(r: Rng) {
  return speckle(r, [hex('#e4eef2'), hex('#eef6f8'), hex('#f6fbfc'), hex('#ffffff')], { white: 0.6 });
}
function ice(r: Rng, kind: 'ice' | 'packed' | 'blue') {
  const base = kind === 'blue' ? hex('#74a8f4') : kind === 'packed' ? hex('#8eb4f0') : hex('#90b8f8');
  const t = speckle(r, ramp(base, 3, 0.06), { white: 0.4 });
  for (let k = 0; k < 5; k++) {
    let x = (r() * 16) | 0, y = (r() * 16) | 0;
    for (let i = 0; i < 6; i++) { t.set(x, y, mix(base, [255, 255, 255], 0.5)); x++; if (r() < 0.5) y++; }
  }
  if (kind === 'ice') for (let i = 0; i < 1024; i += 4) t.d[i + 3] = 175;
  return t;
}
function sandstone(r: Rng, base: RGB, part: 'side' | 'top' | 'bottom' | 'chiseled' | 'cut') {
  if (part === 'top') return speckle(r, ramp(base, 3, 0.05), { white: 0.6 });
  if (part === 'bottom') return speckle(r, ramp(base, 4, 0.1), { white: 0.6 }).bevel(0, 0, 15, 15, 1, 0.85);
  const t = speckle(r, ramp(base, 3, 0.06), { white: 0.5 });
  if (part === 'side') {
    t.rect(0, 0, 15, 2, mul(base, 1.04)); t.rect(0, 13, 15, 15, mul(base, 0.92));
    for (let x = 0; x < 16; x++) { t.set(x, 3, mul(base, 0.84)); t.set(x, 12, mul(base, 0.86)); if (r() < 0.4) t.set(x, 8, mul(base, 0.92)); }
  } else if (part === 'cut') {
    t.outline(0, 0, 15, 15, mul(base, 0.85)); t.outline(0, 0, 15, 7, mul(base, 0.85));
  } else {
    t.outline(0, 0, 15, 15, mul(base, 0.82)); t.rect(0, 0, 15, 2, mul(base, 0.95)); t.rect(0, 13, 15, 15, mul(base, 0.95));
    t.outline(4, 5, 11, 10, mul(base, 0.75)); t.rect(6, 7, 9, 8, mul(base, 0.7));
  }
  return t;
}
function quartz(r: Rng, part: 'top' | 'side' | 'chiseled' | 'chiseled_top' | 'pillar' | 'pillar_top' | 'bricks') {
  const base = hex('#ebe5de');
  const t = speckle(r, ramp(base, 3, 0.03), { white: 0.6 });
  if (part === 'side') t.bevel(0, 0, 15, 15, 1.02, 0.92);
  if (part === 'chiseled' || part === 'chiseled_top') { t.outline(0, 0, 15, 15, mul(base, 0.85)); t.outline(3, 3, 12, 12, mul(base, 0.85)); if (part === 'chiseled') t.outline(5, 5, 10, 10, mul(base, 0.9)); }
  if (part === 'pillar') for (let y = 0; y < 16; y++) { t.set(0, y, mul(base, 0.85)); t.set(15, y, mul(base, 0.85)); t.set(4, y, mul(base, 0.92)); t.set(11, y, mul(base, 0.92)); }
  if (part === 'pillar_top') { t.outline(0, 0, 15, 15, mul(base, 0.85)); t.outline(3, 3, 12, 12, mul(base, 0.9)); }
  if (part === 'bricks') return bricks(r, base, mul(base, 0.82), 4, 8);
  return t;
}
function prismarine(r: Rng, kind: 'plain' | 'bricks' | 'dark') {
  if (kind === 'plain') {
    const pal = [hex('#3e7a6c'), hex('#4f9284'), hex('#63a596'), hex('#79b4a0'), hex('#5a8aa0')];
    return speckle(r, pal, { layers: [[4, 0.6], [8, 0.4]], white: 0.4, contrast: 1.8 });
  }
  if (kind === 'bricks') return bricks(r, hex('#62a898'), hex('#3c7a6c'), 8, 8);
  const t = speckle(r, ramp(hex('#335a4c'), 3, 0.08), { white: 0.4 });
  t.outline(0, 0, 15, 15, hex('#1e3a30')); t.outline(4, 4, 11, 11, hex('#264a3e'));
  for (let i = 0; i < 16; i += 8) for (let y = 0; y < 16; y++) t.set(i, y, hex('#1e3a30'));
  return t;
}
function purpur(r: Rng, kind: 'block' | 'pillar' | 'pillar_top') {
  const base = hex('#a77aa7');
  if (kind === 'block') return tiles(r, base, 8);
  const t = speckle(r, ramp(base, 3, 0.06), { white: 0.5 });
  if (kind === 'pillar') for (let y = 0; y < 16; y++) for (const x of [0, 5, 10, 15]) t.set(x, y, mul(base, 0.82));
  else { t.outline(0, 0, 15, 15, mul(base, 0.8)); t.outline(4, 4, 11, 11, mul(base, 0.85)); }
  return t;
}
function chiseledStoneBricks(r: Rng) {
  const base = P.stone;
  const t = speckle(r, ramp(base, 3, 0.06), { white: 0.5 });
  t.bevel(0, 0, 15, 15, 1.15, 0.6);
  t.outline(3, 3, 12, 12, mul(base, 0.68));
  t.bevel(4, 4, 11, 11, 1.12, 0.8);
  t.outline(6, 6, 9, 9, mul(base, 0.7));
  return t;
}
function chiseledNether(r: Rng) {
  const base = hex('#2e1418');
  const t = tiles(r, base, 16);
  t.outline(3, 3, 12, 12, mul(base, 1.6)); t.rect(6, 6, 9, 9, mul(base, 1.4)); t.rect(7, 7, 8, 8, mul(base, 0.6));
  return t;
}
function copper(r: Rng, oxidation: number) {
  const fresh = hex('#c06a4c'), green = hex('#52a088');
  const c = mix(fresh, green, oxidation);
  const t = metalBlock(r, c, 'plate');
  if (oxidation > 0 && oxidation < 1) for (let k = 0; k < 30; k++) t.set((r() * 16) | 0, (r() * 16) | 0, mix(c, oxidation > 0.5 ? fresh : green, 0.4));
  return t;
}
function embers(r: Rng) {
  const t = planks(r, hex('#4a2a14'));
  for (let k = 0; k < 26; k++) t.set((r() * 16) | 0, (r() * 16) | 0, r() < 0.5 ? hex('#ff8a20') : hex('#ffc040'));
  return t;
}
function ironBars() {
  const t = new Tex();
  const c = hex('#6a6c70'), c2 = hex('#a0a2a8');
  for (const x of [1, 5, 9, 13]) for (let y = 0; y < 16; y++) { t.set(x, y, c2); t.set(x + 1, y, c); }
  for (const y of [0, 15]) for (let x = 0; x < 16; x++) t.set(x, y, c);
  return t;
}
function missing() {
  return new Tex().fill((x, y) => ((x >> 3) + (y >> 3)) % 2 ? [248, 0, 248] : [0, 0, 0]);
}
function path(r: Rng, top: boolean) {
  const base = hex('#947a46');
  if (top) return speckle(r, ramp(base, 4, 0.12), { white: 0.6 });
  const t = dirt(r);
  for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) t.set(x, y, mul(base, 0.92 + r() * 0.12));
  for (let x = 0; x < 16; x++) t.set(x, 0, hex('#00000000'.slice(0, 7)), 0);
  return t;
}
function soul(r: Rng, soil: boolean) {
  const base = soil ? hex('#4a3a2e') : hex('#584234');
  const t = speckle(r, ramp(base, 4, 0.22), { white: 0.6 });
  if (!soil) for (let k = 0; k < 4; k++) {
    const x = 1 + ((r() * 12) | 0), y = 1 + ((r() * 12) | 0), d = mul(base, 0.55);
    t.set(x, y, d); t.set(x + 2, y, d); t.set(x, y + 2, d); t.set(x + 1, y + 2, d); t.set(x + 2, y + 2, d);
  }
  return t;
}

// ---------------------------------------------------------------- dispatch
const ORE_COL: Record<string, RGB[]> = {
  coal: [hex('#2a2a2a'), hex('#1a1a1a'), hex('#4a4a4a')],
  iron: [hex('#d8af93'), hex('#b88a6c'), hex('#f0d8c4')],
  copper: [hex('#e07a4a'), hex('#4a9a7a'), hex('#ffb088')],
  gold: [hex('#fcd84a'), hex('#d8a020'), hex('#fff6b0')],
  redstone: [hex('#e01a10'), hex('#a00a08'), hex('#ff6a50')],
  lapis: [hex('#2450c0'), hex('#1a3490'), hex('#6a90f0')],
  diamond: [hex('#5ae8e0'), hex('#2ab8b0'), hex('#c8fff8')],
  emerald: [hex('#28d860'), hex('#10a040'), hex('#a0ffc0')],
  nether_gold: [hex('#fcd84a'), hex('#d8a020'), hex('#fff6b0')],
  nether_quartz: [hex('#ece6dc'), hex('#c8c0b4'), hex('#ffffff')],
};

type Gen = (r: Rng) => Tex;
const GEN: Record<string, Gen> = {
  missing: () => missing(),
  grass_top: grassTop,
  grass_side: (r) => grassSide(r),
  grass_side_snowy: (r) => grassSide(r, true),
  dirt: (r) => dirt(r),
  coarse_dirt: (r) => { const t = dirt(r); for (let k = 0; k < 30; k++) t.set((r() * 16) | 0, (r() * 16) | 0, r() < 0.5 ? hex('#5a3e24') : hex('#8a7a6a')); return t; },
  rooted_dirt: (r) => { const t = dirt(r); for (let k = 0; k < 4; k++) { let x = (r() * 16) | 0, y = (r() * 16) | 0; for (let i = 0; i < 5; i++) { t.set(x, y, hex('#9a7a54')); y++; if (r() < 0.4) x += r() < 0.5 ? -1 : 1; } } return t; },
  podzol_top: podzolTop,
  podzol_side: (r) => topFringe(r, podzolTop(r), dirt(r)),
  mycelium_top: (r) => speckle(r, [hex('#5a4a5a'), hex('#6e5e6a'), hex('#857580'), hex('#9a8c98'), hex('#b0a4b0')], { white: 0.8 }),
  mycelium_side: (r) => topFringe(r, speckle(r, [hex('#6e5e6a'), hex('#857580'), hex('#9a8c98')], { white: 0.8 }), dirt(r)),
  path_top: (r) => path(r, true),
  path_side: (r) => path(r, false),
  mud: (r) => speckle(r, ramp(P.mud, 4, 0.1), { layers: [[4, 0.7], [8, 0.3]], white: 0.3 }),
  packed_mud: (r) => speckle(r, ramp(hex('#8e6a4e'), 4, 0.12), { white: 0.5 }),
  mud_bricks: (r) => bricks(r, hex('#8a6a4c'), hex('#6a4e38'), 4, 8),
  clay: (r) => speckle(r, ramp(P.clay, 4, 0.06), { layers: [[4, 0.8], [8, 0.2]], white: 0.3 }),
  moss: (r) => speckle(r, [hex('#46602a'), hex('#567430'), hex('#668a38'), hex('#76983e'), hex('#86a848')], { white: 0.6 }),
  sand: (r) => sand(r),
  red_sand: (r) => sand(r, P.redSand),
  gravel,
  stone: (r) => stone(r),
  granite: (r) => speckle(r, [hex('#6e4636'), hex('#8a5a48'), hex('#9e6c58'), hex('#b07e6a'), hex('#c49a88')], { layers: [[8, 0.4], [16, 0.6]], white: 0.9, contrast: 1.8 }),
  diorite: (r) => { const t = speckle(r, [hex('#a8a8a4'), hex('#c4c4c0'), hex('#d4d4d0'), hex('#e4e4e0')], { white: 0.7 }); for (let k = 0; k < 14; k++) { const x = (r() * 16) | 0, y = (r() * 16) | 0; t.set(x, y, hex('#6e6e6c')); if (r() < 0.5) t.set(x + 1, y, hex('#8a8a88')); } return t; },
  andesite: (r) => speckle(r, [hex('#666868'), hex('#787a7a'), hex('#888a8a'), hex('#9a9c9c'), hex('#aaacac')], { layers: [[4, 0.4], [8, 0.6]], white: 0.8, contrast: 1.7 }),
  deepslate: (r) => deepslate(r, false),
  deepslate_top: (r) => deepslate(r, true),
  tuff: (r) => { const t = speckle(r, ramp(P.tuff, 5, 0.16), { white: 0.7 }); for (let k = 0; k < 10; k++) t.set((r() * 16) | 0, (r() * 16) | 0, hex('#9a9a88')); return t; },
  calcite: (r) => speckle(r, ramp(P.calcite, 4, 0.06), { layers: [[4, 0.6], [8, 0.4]], white: 0.4 }),
  dripstone: (r) => speckle(r, ramp(hex('#866a5c'), 5, 0.18), { layers: [[2, 0.3], [16, 0.7]], white: 0.4 }),
  bedrock,
  snow: snowTex,
  ice: (r) => ice(r, 'ice'),
  packed_ice: (r) => ice(r, 'packed'),
  blue_ice: (r) => ice(r, 'blue'),
  obsidian: (r) => { const t = speckle(r, [hex('#0c0a14'), hex('#140f1f'), hex('#1e1630'), hex('#2a2042')], { white: 0.6 }); for (let k = 0; k < 6; k++) t.set((r() * 16) | 0, (r() * 16) | 0, hex('#4a3a6e')); return t; },
  crying_obsidian: crying,
  netherrack: (r) => speckle(r, ramp(P.netherrack, 5, 0.22), { layers: [[4, 0.4], [16, 0.6]], white: 0.8 }),
  soul_sand: (r) => soul(r, false),
  soul_soil: (r) => soul(r, true),
  magma,
  basalt_top: (r) => { const t = speckle(r, ramp(P.basalt, 4, 0.14), { white: 0.5 }); t.outline(1, 1, 14, 14, mul(P.basalt, 0.75)); return t; },
  basalt_side: (r) => { const t = new Tex(); const n = pnoise(r, 8, 2); return t.fill((x, y) => mul(P.basalt, 0.8 + Math.round(n(x, y) * 4) / 4 * 0.35)); },
  blackstone: (r) => speckle(r, ramp(P.blackstone, 5, 0.25), { white: 0.6 }),
  blackstone_top: (r) => speckle(r, ramp(P.blackstone, 4, 0.18), { layers: [[4, 0.8], [16, 0.2]], white: 0.4 }),
  end_stone: (r) => { const t = speckle(r, ramp(P.endStone, 4, 0.08), { white: 0.6 }); for (let k = 0; k < 12; k++) t.set((r() * 16) | 0, (r() * 16) | 0, mul(P.endStone, 0.8)); return t; },
  amethyst,
  bone_top: (r) => { const t = speckle(r, ramp(hex('#e4dec8'), 3, 0.05), { white: 0.5 }); t.rect(5, 5, 10, 10, hex('#c8c0a6')); t.rect(6, 6, 9, 9, hex('#e4dec8')); return t; },
  bone_side: (r) => { const t = speckle(r, ramp(hex('#e4dec8'), 3, 0.05), { white: 0.5 }); for (let y = 0; y < 16; y++) { t.set(3, y, hex('#c8c0a6')); t.set(12, y, hex('#c8c0a6')); } return t; },
  cobblestone: (r) => cobble(r),
  mossy_cobblestone: (r) => cobble(r, P.stone, true),
  cobbled_deepslate: (r) => cobble(r, hex('#56565c')),
  smooth_stone: (r) => smoothStone(r, hex('#a0a0a0')),
  smooth_stone_slab_side: (r) => { const t = smoothStone(r, hex('#a0a0a0')); for (let x = 0; x < 16; x++) t.set(x, 7, hex('#8a8a8a')); return t; },
  stone_bricks: (r) => stoneBricks(r),
  mossy_stone_bricks: (r) => stoneBricks(r, P.stone, 'mossy'),
  cracked_stone_bricks: (r) => stoneBricks(r, P.stone, 'cracked'),
  chiseled_stone_bricks: chiseledStoneBricks,
  bricks: (r) => bricks(r),
  polished_granite: (r) => polished(r, hex('#9a6a56')),
  polished_diorite: (r) => polished(r, hex('#cdcdca')),
  polished_andesite: (r) => polished(r, hex('#848686')),
  polished_deepslate: (r) => polished(r, hex('#48484d')),
  polished_tuff: (r) => polished(r, hex('#62645c')),
  polished_blackstone: (r) => polished(r, hex('#36303a')),
  deepslate_bricks: (r) => bricks(r, hex('#4c4c50'), hex('#2e2e32'), 4, 8),
  deepslate_tiles: (r) => tiles(r, hex('#3a3a3e'), 4),
  polished_blackstone_bricks: (r) => bricks(r, hex('#3a3440'), hex('#221e26'), 8, 8),
  prismarine: (r) => prismarine(r, 'plain'),
  prismarine_bricks: (r) => prismarine(r, 'bricks'),
  dark_prismarine: (r) => prismarine(r, 'dark'),
  nether_bricks: (r) => bricks(r, hex('#2e1418'), hex('#160a0c'), 4, 8),
  red_nether_bricks: (r) => bricks(r, hex('#4a0a0c'), hex('#2a0406'), 4, 8),
  cracked_nether_bricks: (r) => { const t = bricks(r, hex('#2e1418'), hex('#160a0c'), 4, 8); crack(r, t, hex('#0a0405'), 4); return t; },
  chiseled_nether_bricks: chiseledNether,
  end_stone_bricks: (r) => bricks(r, hex('#dadc9c'), hex('#b4b47a'), 8, 8),
  purpur: (r) => purpur(r, 'block'),
  purpur_pillar: (r) => purpur(r, 'pillar'),
  purpur_pillar_top: (r) => purpur(r, 'pillar_top'),
  terracotta: (r) => terracotta(r, hex('#985e43')),
  sandstone: (r) => sandstone(r, hex('#d8cb94'), 'side'),
  sandstone_top: (r) => sandstone(r, hex('#dccf9a'), 'top'),
  sandstone_bottom: (r) => sandstone(r, hex('#d8cb94'), 'bottom'),
  chiseled_sandstone: (r) => sandstone(r, hex('#d8cb94'), 'chiseled'),
  cut_sandstone: (r) => sandstone(r, hex('#d8cb94'), 'cut'),
  red_sandstone: (r) => sandstone(r, hex('#b8622a'), 'side'),
  red_sandstone_top: (r) => sandstone(r, hex('#bc642c'), 'top'),
  red_sandstone_bottom: (r) => sandstone(r, hex('#b8622a'), 'bottom'),
  chiseled_red_sandstone: (r) => sandstone(r, hex('#b8622a'), 'chiseled'),
  cut_red_sandstone: (r) => sandstone(r, hex('#b8622a'), 'cut'),
  quartz_top: (r) => quartz(r, 'top'),
  quartz_side: (r) => quartz(r, 'side'),
  chiseled_quartz: (r) => quartz(r, 'chiseled'),
  chiseled_quartz_top: (r) => quartz(r, 'chiseled_top'),
  quartz_pillar: (r) => quartz(r, 'pillar'),
  quartz_pillar_top: (r) => quartz(r, 'pillar_top'),
  quartz_bricks: (r) => quartz(r, 'bricks'),
  glass,
  tinted_glass: (r) => { const t = new Tex(); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) t.set(x, y, mul(hex('#2a2430'), 0.9 + r() * 0.2), x === 0 || y === 0 || x === 15 || y === 15 ? 235 : 190); return t; },
  iron_bars: () => ironBars(),
  coal_block: (r) => metalBlock(r, hex('#1c1c1e'), 'rough'),
  iron_block: (r) => metalBlock(r, hex('#d8d8d8'), 'plate'),
  copper_block: (r) => copper(r, 0),
  exposed_copper: (r) => copper(r, 0.3),
  weathered_copper: (r) => copper(r, 0.62),
  oxidized_copper: (r) => copper(r, 1),
  gold_block: (r) => metalBlock(r, hex('#f6d23e'), 'plate'),
  redstone_block: (r) => metalBlock(r, hex('#b0140a'), 'gem'),
  lapis_block: (r) => metalBlock(r, hex('#1e4aa6'), 'rough'),
  diamond_block: (r) => metalBlock(r, hex('#62dcd6'), 'gem'),
  emerald_block: (r) => metalBlock(r, hex('#2ac25c'), 'gem'),
  netherite_block: (r) => metalBlock(r, hex('#42393a'), 'ingot'),
  raw_iron_block: (r) => metalBlock(r, hex('#a6876a'), 'rough'),
  raw_copper_block: (r) => metalBlock(r, hex('#9a5a3c'), 'rough'),
  raw_gold_block: (r) => metalBlock(r, hex('#dca23a'), 'rough'),
  glowstone,
  sea_lantern: seaLantern,
  torch: (r) => torch(r),
  soul_torch: (r) => torch(r, true),
  lantern: (r) => lantern(r),
  soul_lantern: (r) => lantern(r, true),
  shroomlight: (r) => speckle(r, [hex('#c8662a'), hex('#e88a3a'), hex('#f4a84c'), hex('#ffcc70'), hex('#fff0b0')], { white: 0.6, contrast: 1.8 }),
  pumpkin_top: (r) => pumpkin(r, 'top'),
  pumpkin_side: (r) => pumpkin(r, 'side'),
  carved_pumpkin: (r) => pumpkin(r, 'face'),
  jack_o_lantern: (r) => pumpkin(r, 'lit'),
  redstone_lamp_on: (r) => { const t = speckle(r, [hex('#8a5a2a'), hex('#c8862e'), hex('#f0c060'), hex('#fff0b0')], { white: 0.6 }); t.outline(0, 0, 15, 15, hex('#5a3a1a')); for (let i = 3; i < 13; i += 4) { t.rect(i, 3, i + 1, 12, hex('#fff4c8')); } return t; },
  froglight_ochre: (r) => froglight(r, hex('#f4dc8c'), false),
  froglight_ochre_top: (r) => froglight(r, hex('#f4dc8c'), true),
  froglight_verdant: (r) => froglight(r, hex('#d0ecc0'), false),
  froglight_verdant_top: (r) => froglight(r, hex('#d0ecc0'), true),
  froglight_pearl: (r) => froglight(r, hex('#f0dcf0'), false),
  froglight_pearl_top: (r) => froglight(r, hex('#f0dcf0'), true),
  end_rod: () => endRod(),
  embers,
  bookshelf,
  crafting_table_top: craftingTop,
  crafting_table_side: (r) => craftingSide(r, false),
  crafting_table_front: (r) => craftingSide(r, true),
  furnace_top: (r) => furnace(r, 'top'),
  furnace_side: (r) => furnace(r, 'side'),
  furnace_front: (r) => furnace(r, 'front'),
  blast_furnace_top: (r) => furnace(r, 'top', hex('#5e5e62'), true),
  blast_furnace_side: (r) => furnace(r, 'side', hex('#5e5e62'), true),
  blast_furnace_front: (r) => furnace(r, 'front', hex('#5e5e62'), true),
  chest_top: (r) => chest(r, 'top'),
  chest_side: (r) => chest(r, 'side'),
  chest_front: (r) => chest(r, 'front'),
  barrel_top: (r) => barrel(r, true),
  barrel_side: (r) => barrel(r, false),
  note_block: (r) => noteBlock(r),
  jukebox_top: (r) => noteBlock(r, true),
  jukebox_side: (r) => { const t = planks(r, hex('#6a4426')); t.outline(0, 0, 15, 15, hex('#3a2416')); t.outline(1, 1, 14, 14, hex('#4a3020')); return t; },
  tnt_top: (r) => tnt(r, 'top'),
  tnt_bottom: (r) => tnt(r, 'bottom'),
  tnt_side: (r) => tnt(r, 'side'),
  target_top: (r) => hay(r, true),
  target_side: (r) => target(r, false),
  melon_top: (r) => melon(r, true),
  melon_side: (r) => melon(r, false),
  hay_top: (r) => hay(r, true),
  hay_side: (r) => hay(r, false),
  sponge: (r) => sponge(r, false),
  wet_sponge: (r) => sponge(r, true),
  slime,
  honey,
  honeycomb,
  kelp_top: (r) => kelp(r, true),
  kelp_side: (r) => kelp(r, false),
  mushroom_brown: (r) => mushroomBlock(r, 'brown'),
  mushroom_red: (r) => mushroomBlock(r, 'red'),
  mushroom_stem: (r) => mushroomBlock(r, 'stem'),
  cobweb,
  cactus_top: (r) => cactus(r, 'top'),
  cactus_bottom: (r) => cactus(r, 'bottom'),
  cactus_side: (r) => cactus(r, 'side'),
  sugar_cane: sugarCane,
  tall_grass: (r) => tallGrass(r),
  fern: (r) => tallGrass(r, true),
  dead_bush: deadBush,
  brown_mushroom: (r) => mushroom(r, false),
  red_mushroom: (r) => mushroom(r, true),
  lily_pad: lilyPad,
  seagrass,
  water: () => water(),
  lava: () => lava(),
};

export function generateTexture(name: string): Uint8ClampedArray {
  const hand = handmadeTexture(name);
  if (hand) return hand;
  const r = makeRng(hashStr(name));
  const g = GEN[name];
  if (g) return g(r).d;
  let m: RegExpMatchArray | null;
  if ((m = name.match(/^ore_(stone|deepslate|nether)_(.+)$/))) {
    const base = m[1] === 'stone' ? stone(r) : m[1] === 'deepslate' ? deepslate(r, false) : speckle(r, ramp(P.netherrack, 5, 0.22), { layers: [[4, 0.4], [16, 0.6]], white: 0.8 });
    const key = m[1] === 'nether' ? `nether_${m[2]}` : m[2];
    return oreOverlay(r, base, ORE_COL[key] ?? ORE_COL.coal, m[2] === 'diamond' || m[2] === 'emerald' ? 4 : 5).d;
  }
  if ((m = name.match(/^(wool|concrete|powder|terracotta|glazed|stained_glass)_(.+)$/))) {
    const c = DYE_RGB[m[2] as Dye];
    if (c) {
      switch (m[1]) {
        case 'wool': return wool(r, c).d;
        case 'concrete': return concrete(r, mul(c, 0.92)).d;
        case 'powder': return powder(r, c).d;
        case 'terracotta': return terracotta(r, terracottaOf(c)).d;
        case 'glazed': return glazed(r, c).d;
        case 'stained_glass': return stainedGlass(r, c).d;
      }
    }
  }
  if ((m = name.match(/^flower_(.+)$/))) return flower(r, m[1]).d;
  if ((m = name.match(/^(stripped_)?(.+?)_(log|log_top|planks|leaves|door_top|door_bottom|trapdoor|sapling)$/))) {
    const w = WOOD_PAL[m[2] as Wood];
    if (w) {
      const stripped = !!m[1];
      switch (m[3]) {
        case 'log': return stripped ? barkSide(r, w.stripped).d : barkSide(r, w.bark, m[2] === 'birch').d;
        case 'log_top': return logTop(r, stripped ? w.stripped : w.planks, w.bark, stripped).d;
        case 'planks': return planks(r, w.planks).d;
        case 'leaves': return leaves(r, w.leaves, m[2] === 'cherry' ? 0.2 : 0.25).d;
        case 'door_top': return door(r, w, true).d;
        case 'door_bottom': return door(r, w, false).d;
        case 'trapdoor': return trapdoor(r, w).d;
        case 'sapling': return sapling(r, w).d;
      }
    }
  }
  if (typeof console !== 'undefined') console.warn('[textures] no generator for', name);
  return missing().d;
}

// Default tints used for icons and the held item (the world uses biome tints).
export const DEFAULT_TINT: Record<string, RGB> = {
  grass: hex('#7bbd56'),
  foliage: hex('#5fab36'),
  water: hex('#3f76e4'),
};
