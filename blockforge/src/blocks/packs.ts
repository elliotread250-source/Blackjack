// Built-in resource packs. A pack is a filter applied to every generated 16x16 tile, so the
// textures stay procedural and nothing is downloaded. Rules every filter follows:
//   * alpha is copied unchanged (it is a tint mask on opaque tiles, cutout or blending elsewhere)
//   * pixels the shader tints (grass, foliage and water tiles, and the alpha-masked part of
//     grass block sides) only change brightness, so grey tint masks stay grey
//   * neighbourhood filters never mix pixels across a mask/cutout edge
import type { ResourcePackId } from '../settings';
import { TEXTURE_NAMES, TEX_KIND, COUNT, TINT, TINTMASK, FACE_TEX } from './registry';
import { generateTexture } from './textures';

export interface ResourcePackInfo { id: ResourcePackId; name: string; description: string }

export const RESOURCE_PACKS: ResourcePackInfo[] = [
  { id: 'default', name: 'Default', description: 'The original BlockForge look.' },
  { id: 'smooth', name: 'Smooth', description: 'Soft, clean surfaces and richer colour.' },
  { id: 'retro', name: 'Retro', description: 'Chunky 8x8 pixels and a tiny palette.' },
  { id: 'vivid', name: 'Vivid', description: 'Bold colours and punchy contrast.' },
  { id: 'pastel', name: 'Pastel', description: 'Light, soft tones. Calm and dreamy.' },
  { id: 'custom', name: 'Imported Pack', description: 'Load a resource pack .zip from this device.' },
];

// ---------------------------------------------------------------- imported pack (this browser only)

let custom: { name: string; tiles: Map<string, Uint8ClampedArray> } | null = null;

/** Install (or clear) the pack imported from a .zip; textures it lacks fall back to the default look. */
export function setCustomPack(p: { name: string; tiles: Map<string, Uint8ClampedArray> } | null): void {
  custom = p;
  for (const k of Array.from(packCache.keys())) if (k.startsWith('custom:')) packCache.delete(k);
}

/** Name and texture count of the imported pack, or null when none is installed. */
export function customPackInfo(): { name: string; count: number } | null {
  return custom ? { name: custom.name, count: custom.tiles.size } : null;
}

export function isResourcePack(v: unknown): v is ResourcePackId {
  return RESOURCE_PACKS.some((p) => p.id === v);
}

/** How the renderer treats a tile: kind 0 opaque, 1 cutout, 2 translucent; tint 0 none, 1 whole tile, 2 by alpha mask. */
export interface TileInfo { kind: number; tint: number }

const TILE_TINT = new Uint8Array(1024);
for (let id = 1; id < COUNT; id++) {
  if (!TINT[id]) continue;
  for (let f = 0; f < 6; f++) {
    const t = FACE_TEX[id * 6 + f];
    if (TINTMASK[id]) { if (!TILE_TINT[t]) TILE_TINT[t] = 2; } else TILE_TINT[t] = 1;
  }
}

let nameIndex: Map<string, number> | null = null;
function indexOf(name: string): number {
  if (!nameIndex) nameIndex = new Map(TEXTURE_NAMES.map((n, i) => [n, i]));
  return nameIndex.get(name) ?? -1;
}

export function tileInfo(t: number): TileInfo {
  return t >= 0 && t < 1024 ? { kind: TEX_KIND[t], tint: TILE_TINT[t] } : { kind: 0, tint: 0 };
}

// ---------------------------------------------------------------- caches

const baseCache = new Map<string, Uint8ClampedArray>();
const packCache = new Map<string, Uint8ClampedArray>();

/** The unfiltered generated texture (cached; do not modify the returned array). */
export function baseTexture(name: string): Uint8ClampedArray {
  let d = baseCache.get(name);
  if (!d) { d = generateTexture(name); baseCache.set(name, d); }
  return d;
}

/** Texture `name` as drawn by `pack` (cached; do not modify the returned array). */
export function packTexture(name: string, pack: ResourcePackId): Uint8ClampedArray {
  const base = baseTexture(name);
  if (pack === 'default') return base;
  if (pack === 'custom') return custom?.tiles.get(name) ?? base;
  const key = pack + ':' + name;
  let d = packCache.get(key);
  if (!d) {
    d = filterTile(base, pack, tileInfo(indexOf(name)));
    packCache.set(key, d);
  }
  return d;
}

/** Atlas tile `t` as drawn by `pack`. */
export function packTile(t: number, pack: ResourcePackId): Uint8ClampedArray {
  return packTexture(TEXTURE_NAMES[t] ?? 'missing', pack);
}

// ---------------------------------------------------------------- filters

const N = 256;
const luma = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

interface Work {
  rgb: Float32Array;   // 256 * 3, 0..255
  cls: Uint8Array;     // neighbourhood class: pixels only mix with the same class
  lumaW: Float32Array; // 0..1: share of the result that may only change brightness (tinted pixels)
  vis: Uint8Array;     // 1 when the pixel is ever seen (alpha test / blending)
  wrap: boolean;       // the tile repeats seamlessly (full blocks)
}

function prepare(px: Uint8ClampedArray, info: TileInfo): Work {
  const rgb = new Float32Array(N * 3), cls = new Uint8Array(N), lumaW = new Float32Array(N), vis = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    rgb[i * 3] = px[i * 4]; rgb[i * 3 + 1] = px[i * 4 + 1]; rgb[i * 3 + 2] = px[i * 4 + 2];
    const al = px[i * 4 + 3];
    if (info.kind === 0) {
      vis[i] = 1;
      if (info.tint === 2) { lumaW[i] = 1 - al / 255; cls[i] = al < 128 ? 1 : 0; } else if (info.tint === 1) lumaW[i] = 1;
    } else {
      vis[i] = info.kind === 1 ? (al >= 128 ? 1 : 0) : (al > 0 ? 1 : 0);
      cls[i] = vis[i] ? 0 : 2;
      if (info.tint) lumaW[i] = 1;
    }
  }
  return { rgb, cls, lumaW, vis, wrap: info.kind === 0 };
}

/** Write the filtered colours back with the original alpha, limiting tinted pixels to brightness changes. */
function finish(px: Uint8ClampedArray, w: Work, out: Float32Array): Uint8ClampedArray {
  const res = new Uint8ClampedArray(N * 4);
  for (let i = 0; i < N; i++) {
    const r0 = px[i * 4], g0 = px[i * 4 + 1], b0 = px[i * 4 + 2];
    let r = out[i * 3], g = out[i * 3 + 1], b = out[i * 3 + 2];
    const lw = w.lumaW[i];
    if (lw > 0) {
      const l0 = luma(r0, g0, b0), l1 = Math.max(0, Math.min(255, luma(r, g, b)));
      let lr: number, lg: number, lb: number;
      if (l0 > 0.5) { const k = l1 / l0; lr = r0 * k; lg = g0 * k; lb = b0 * k; } else { lr = lg = lb = l1; }
      r += (lr - r) * lw; g += (lg - g) * lw; b += (lb - b) * lw;
    }
    if (!w.vis[i]) { r = r0; g = g0; b = b0; }
    res[i * 4] = Math.round(r); res[i * 4 + 1] = Math.round(g); res[i * 4 + 2] = Math.round(b);
    res[i * 4 + 3] = px[i * 4 + 3];
  }
  return res;
}

/** Neighbour lookup honouring wrap; -1 when outside a non-repeating tile. */
function nb(x: number, y: number, wrap: boolean): number {
  if (wrap) return ((y & 15) << 4) | (x & 15);
  return x < 0 || y < 0 || x > 15 || y > 15 ? -1 : (y << 4) | x;
}

/** Edge-preserving blur: neighbours count less the more their colour differs. */
function bilateral(w: Work, radius: number, sigmaS: number, sigmaR: number): Float32Array {
  const src = w.rgb, out = new Float32Array(src);
  const inv2s = 1 / (2 * sigmaS * sigmaS), inv2r = 1 / (2 * sigmaR * sigmaR);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y << 4) | x;
    if (!w.vis[i]) continue;
    const r0 = src[i * 3], g0 = src[i * 3 + 1], b0 = src[i * 3 + 2];
    let sr = 0, sg = 0, sb = 0, sw = 0;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const j = nb(x + dx, y + dy, w.wrap);
      if (j < 0 || w.cls[j] !== w.cls[i] || !w.vis[j]) continue;
      const dr = src[j * 3] - r0, dg = src[j * 3 + 1] - g0, db = src[j * 3 + 2] - b0;
      const wt = Math.exp(-(dx * dx + dy * dy) * inv2s - (dr * dr + dg * dg + db * db) * inv2r);
      sr += src[j * 3] * wt; sg += src[j * 3 + 1] * wt; sb += src[j * 3 + 2] * wt; sw += wt;
    }
    out[i * 3] = sr / sw; out[i * 3 + 1] = sg / sw; out[i * 3 + 2] = sb / sw;
  }
  return out;
}

/** Plain 3x3 box blur within a class. */
function box3(w: Work, src: Float32Array): Float32Array {
  const out = new Float32Array(src);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const i = (y << 4) | x;
    if (!w.vis[i]) continue;
    let sr = 0, sg = 0, sb = 0, n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = nb(x + dx, y + dy, w.wrap);
      if (j < 0 || w.cls[j] !== w.cls[i] || !w.vis[j]) continue;
      sr += src[j * 3]; sg += src[j * 3 + 1]; sb += src[j * 3 + 2]; n++;
    }
    out[i * 3] = sr / n; out[i * 3 + 1] = sg / n; out[i * 3 + 2] = sb / n;
  }
  return out;
}

/** Mean brightness of the visible pixels of each class. */
function classMeans(w: Work, src: Float32Array): Float32Array {
  const sum = new Float32Array(3), cnt = new Float32Array(3);
  for (let i = 0; i < N; i++) {
    if (!w.vis[i]) continue;
    sum[w.cls[i]] += luma(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]);
    cnt[w.cls[i]]++;
  }
  for (let c = 0; c < 3; c++) sum[c] = cnt[c] ? sum[c] / cnt[c] : 128;
  return sum;
}

/** Saturation and contrast around the class mean, in place. */
function grade(w: Work, src: Float32Array, sat: number, contrast: number, lift = 0, gain = 1) {
  const mean = classMeans(w, src);
  for (let i = 0; i < N; i++) {
    const m = mean[w.cls[i]];
    const r = src[i * 3], g = src[i * 3 + 1], b = src[i * 3 + 2];
    const l = luma(r, g, b);
    const l2 = m + (l - m) * contrast;
    for (let c = 0; c < 3; c++) {
      let v = l2 + (src[i * 3 + c] - l) * sat;
      v = v * gain + lift;
      src[i * 3 + c] = Math.max(0, Math.min(255, v));
    }
  }
}

function smooth(px: Uint8ClampedArray, info: TileInfo): Uint8ClampedArray {
  const w = prepare(px, info);
  const out = bilateral(w, 2, 1.4, 30);
  // A whisper of the original keeps a little texture; then richer colour.
  for (let i = 0; i < N * 3; i++) out[i] = out[i] * 0.92 + w.rgb[i] * 0.08;
  grade(w, out, 1.2, 1.04, -2, 1.0);
  return finish(px, w, out);
}

function vivid(px: Uint8ClampedArray, info: TileInfo): Uint8ClampedArray {
  const w = prepare(px, info);
  const out = new Float32Array(w.rgb);
  grade(w, out, 1.6, 1.35);
  // Global S-ish curve plus a light unsharp mask so details pop.
  const blur = box3(w, out);
  for (let i = 0; i < N * 3; i++) {
    let v = out[i] + (out[i] - blur[i]) * 0.35;
    v = 128 + (v - 128) * 1.08;
    out[i] = Math.max(0, Math.min(255, v));
  }
  return finish(px, w, out);
}

function pastel(px: Uint8ClampedArray, info: TileInfo): Uint8ClampedArray {
  const w = prepare(px, info);
  const soft = box3(w, w.rgb);
  const out = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) out[i] = w.rgb[i] * 0.6 + soft[i] * 0.4;
  grade(w, out, 0.55, 0.7);
  for (let i = 0; i < N * 3; i++) out[i] = out[i] + (255 - out[i]) * 0.36;
  return finish(px, w, out);
}

/** k-means colour reduction of the given pixels (in place on `col`), deterministic seeds. */
function reduce(col: Float32Array, idx: number[], k: number) {
  if (idx.length === 0) return;
  const dist = (p: number, c: Float32Array, o: number) => {
    const dr = col[p * 3] - c[o], dg = col[p * 3 + 1] - c[o + 1], db = col[p * 3 + 2] - c[o + 2];
    return dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
  };
  // Seeds: the darkest pixel, then repeatedly the pixel farthest from every seed so far
  // (keeps small accents like ore specks and petals as their own colour).
  const kk = Math.min(k, idx.length);
  const cen = new Float32Array(kk * 3);
  let first = idx[0];
  for (const p of idx) if (luma(col[p * 3], col[p * 3 + 1], col[p * 3 + 2]) < luma(col[first * 3], col[first * 3 + 1], col[first * 3 + 2])) first = p;
  cen[0] = col[first * 3]; cen[1] = col[first * 3 + 1]; cen[2] = col[first * 3 + 2];
  const near = new Float32Array(idx.length).fill(Infinity);
  let used = 1;
  for (; used < kk; used++) {
    let far = -1, fd = 0;
    for (let n = 0; n < idx.length; n++) {
      near[n] = Math.min(near[n], dist(idx[n], cen, (used - 1) * 3));
      if (near[n] > fd) { fd = near[n]; far = idx[n]; }
    }
    if (far < 0 || fd < 4) break;
    cen[used * 3] = col[far * 3]; cen[used * 3 + 1] = col[far * 3 + 1]; cen[used * 3 + 2] = col[far * 3 + 2];
  }
  const asg = new Int32Array(idx.length);
  for (let it = 0; it < 8; it++) {
    for (let n = 0; n < idx.length; n++) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < used; c++) {
        const d = dist(idx[n], cen, c * 3);
        if (d < bd) { bd = d; best = c; }
      }
      asg[n] = best;
    }
    const sum = new Float32Array(used * 4);
    for (let n = 0; n < idx.length; n++) {
      const p = idx[n], c = asg[n];
      sum[c * 4] += col[p * 3]; sum[c * 4 + 1] += col[p * 3 + 1]; sum[c * 4 + 2] += col[p * 3 + 2]; sum[c * 4 + 3]++;
    }
    for (let c = 0; c < used; c++) if (sum[c * 4 + 3]) for (let ch = 0; ch < 3; ch++) cen[c * 3 + ch] = sum[c * 4 + ch] / sum[c * 4 + 3];
  }
  for (let n = 0; n < idx.length; n++) {
    const p = idx[n], c = asg[n];
    col[p * 3] = cen[c * 3]; col[p * 3 + 1] = cen[c * 3 + 1]; col[p * 3 + 2] = cen[c * 3 + 2];
  }
}

/** 16 levels per channel: a coarse 12-bit palette (fine enough to keep every hue). */
const q16 = (v: number) => Math.round((Math.max(0, Math.min(255, v)) / 255) * 15) * 17;

function retro(px: Uint8ClampedArray, info: TileInfo): Uint8ClampedArray {
  const w = prepare(px, info);
  const out = new Float32Array(w.rgb);
  // 1. 8x8 effective resolution: each 2x2 block takes the average of its pixels of the same class.
  for (let by = 0; by < 16; by += 2) for (let bx = 0; bx < 16; bx += 2) {
    const ids = [(by << 4) | bx, (by << 4) | (bx + 1), ((by + 1) << 4) | bx, ((by + 1) << 4) | (bx + 1)];
    for (const i of ids) {
      if (!w.vis[i]) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const j of ids) {
        if (!w.vis[j] || w.cls[j] !== w.cls[i]) continue;
        r += w.rgb[j * 3]; g += w.rgb[j * 3 + 1]; b += w.rgb[j * 3 + 2]; n++;
      }
      out[i * 3] = r / n; out[i * 3 + 1] = g / n; out[i * 3 + 2] = b / n;
    }
  }
  // 2. A few colours per tile (per class), with a little extra contrast.
  grade(w, out, 1.15, 1.2);
  for (let c = 0; c < 3; c++) {
    const idx: number[] = [];
    for (let i = 0; i < N; i++) if (w.vis[i] && w.cls[i] === c) idx.push(i);
    reduce(out, idx, w.lumaW[idx[0] ?? 0] > 0.5 ? 3 : 5);
  }
  // 3. Snap to the coarse global palette. Tinted pixels stay grey through `finish`.
  for (let i = 0; i < N * 3; i++) out[i] = q16(out[i]);
  return finish(px, w, out);
}

/** Apply a pack to one 16x16 RGBA tile. Returns a new array; alpha is always unchanged. */
export function filterTile(px: Uint8ClampedArray, pack: ResourcePackId, info: TileInfo): Uint8ClampedArray {
  if (px.length !== N * 4) return px.slice();
  switch (pack) {
    case 'smooth': return smooth(px, info);
    case 'retro': return retro(px, info);
    case 'vivid': return vivid(px, info);
    case 'pastel': return pastel(px, info);
    default: return px.slice();
  }
}
