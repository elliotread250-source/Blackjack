// Shared helpers for the WS2 node tests: synthetic chunks, a reference light solver
// written independently of light.ts, a tiny test harness and a PNG writer.
import { Chunk } from '../../src/world/chunk';
import { World } from '../../src/world/world';
import { LOPAC, LMASK, LEMIT } from '../../src/world/light';
import { ID, pack } from '../../src/blocks/registry';
import { chunkKey, COLUMN_VOLUME } from '../../src/world/constants';
import type { GenChunk } from '../../src/types';
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

export const B = (name: string, meta = 0) => {
  const id = ID[name];
  if (id === undefined) throw new Error('unknown block ' + name);
  return pack(id, meta);
};
export const AIR = 0;
export const STONE = B('stone');
export const DIRT = B('dirt');
export const GRASS = B('grass_block');
export const GLASS = B('glass');
export const TORCH = B('torch');
export const GLOWSTONE = B('glowstone');
export const OAK_LEAVES = B('oak_leaves');
export const OAK_LOG = B('oak_log');
export const WATER = B('water');
export const LAVA = B('lava');

export const SCRATCH = '/tmp/claude-0/-home-user-Blackjack/26b70c72-15d6-5390-92e8-4170e0677498/scratchpad/ws2-world';

// ---------------------------------------------------------------- harness

let failures = 0, passes = 0;
export function test(name: string, fn: () => void): void {
  const t0 = performance.now();
  try {
    fn();
    passes++;
    console.log(`  ok   ${name} (${(performance.now() - t0).toFixed(0)} ms)`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${(e as Error).stack?.split('\n').slice(0, 4).join('\n       ')}`);
  }
}
export function summary(label: string): void {
  console.log(`${label}: ${passes} passed, ${failures} failed`);
  if (failures) process.exitCode = 1;
}
export function eq<T>(a: T, b: T, msg = ''): void {
  if (a !== b) throw new Error(`${msg} expected ${String(b)}, got ${String(a)}`);
}
export function ok(c: unknown, msg = 'assertion failed'): void {
  if (!c) throw new Error(msg);
}

// ---------------------------------------------------------------- chunks

export type Filler = (x: number, y: number, z: number) => number;

/** Build a GenChunk from a world-coordinate filler. */
export function genChunk(cx: number, cz: number, fill: Filler): GenChunk {
  const blocks = new Uint16Array(COLUMN_VOLUME);
  for (let y = 0; y < 256; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
    const v = fill(cx * 16 + x, y, cz * 16 + z);
    if (v) blocks[(y << 8) | (z << 4) | x] = v;
  }
  return { cx, cz, blocks, biome: new Uint8Array(256), tint: new Uint8Array(256 * 9) };
}

/** Flat ground: stone below 60, dirt 60..62, grass at 63, air from 64. */
export const flat: Filler = (_x, y) => (y < 60 ? STONE : y < 63 ? DIRT : y === 63 ? GRASS : AIR);

export function makeWorld(fill: Filler, coords: [number, number][]): World {
  const w = new World(1);
  for (const [cx, cz] of coords) w.addChunk(new Chunk(genChunk(cx, cz, fill)));
  return w;
}

export function grid(r: number): [number, number][] {
  const out: [number, number][] = [];
  for (let cz = -r; cz <= r; cz++) for (let cx = -r; cx <= r; cx++) out.push([cx, cz]);
  return out;
}

// ---------------------------------------------------------------- reference light
// Brute force fixed point over every loaded column, on its own flat arrays with world
// coordinates. Only shares the per-value tables (LOPAC/LMASK/LEMIT) with light.ts.

const FACE = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const OPPF = [1, 0, 3, 2, 5, 4];

export function referenceLight(w: World): Map<number, Uint8Array> {
  const keys = Array.from(w.chunks.values());
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const c of keys) { minX = Math.min(minX, c.cx); maxX = Math.max(maxX, c.cx); minZ = Math.min(minZ, c.cz); maxZ = Math.max(maxZ, c.cz); }
  const X = (maxX - minX + 1) * 16, Z = (maxZ - minZ + 1) * 16;
  const N = X * Z * 256;
  const blocks = new Uint16Array(N), present = new Uint8Array(N);
  const sky = new Uint8Array(N), blk = new Uint8Array(N);
  const at = (x: number, y: number, z: number) => (y * Z + z) * X + x;
  for (const c of keys) {
    const ox = (c.cx - minX) * 16, oz = (c.cz - minZ) * 16;
    for (let y = 0; y < 256; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const i = at(ox + x, y, oz + z);
      blocks[i] = c.blocks[(y << 8) | (z << 4) | x];
      present[i] = 1;
    }
  }
  const q: number[] = [];
  // sky: virtual source above the world
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    const i = at(x, 255, z);
    if (!present[i]) continue;
    const v = blocks[i];
    if (LMASK[v] & 4) continue;
    const op = LOPAC[v];
    const s = op === 0 ? 15 : Math.max(0, 15 - op);
    if (s > 0) { sky[i] = s; q.push(x, 255, z); }
  }
  const run = (arr: Uint8Array, isSky: boolean) => {
    for (let h = 0; h < q.length; h += 3) {
      const x = q[h], y = q[h + 1], z = q[h + 2];
      const i = at(x, y, z), lv = arr[i];
      if (lv <= 1) continue;
      for (let f = 0; f < 6; f++) {
        const nx = x + FACE[f][0], ny = y + FACE[f][1], nz = z + FACE[f][2];
        if (nx < 0 || nz < 0 || nx >= X || nz >= Z || ny < 0 || ny > 255) continue;
        const j = at(nx, ny, nz);
        if (!present[j]) continue;
        if (LMASK[blocks[i]] & (1 << f)) continue;
        if (LMASK[blocks[j]] & (1 << OPPF[f])) continue;
        const op = LOPAC[blocks[j]];
        const nv = isSky && f === 3 && lv === 15 && op === 0 ? 15 : lv - Math.max(1, op);
        if (nv > arr[j]) { arr[j] = nv; q.push(nx, ny, nz); }
      }
    }
  };
  run(sky, true);
  q.length = 0;
  for (let i = 0; i < N; i++) {
    if (!present[i]) continue;
    const e = LEMIT[blocks[i]];
    if (e) { blk[i] = e; const x = i % X, z = Math.floor(i / X) % Z, y = Math.floor(i / (X * Z)); q.push(x, y, z); }
  }
  run(blk, false);
  const out = new Map<number, Uint8Array>();
  for (const c of keys) {
    const ox = (c.cx - minX) * 16, oz = (c.cz - minZ) * 16;
    const L = new Uint8Array(COLUMN_VOLUME);
    for (let y = 0; y < 256; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const i = at(ox + x, y, oz + z);
      L[(y << 8) | (z << 4) | x] = (sky[i] << 4) | blk[i];
    }
    out.set(chunkKey(c.cx, c.cz), L);
  }
  return out;
}

/** Throws with the first mismatches when the world's light differs from the reference. */
export function assertLightMatchesReference(w: World, label = ''): void {
  const ref = referenceLight(w);
  const bad: string[] = [];
  let count = 0;
  for (const c of w.chunks.values()) {
    const r = ref.get(chunkKey(c.cx, c.cz))!;
    for (let i = 0; i < COLUMN_VOLUME; i++) {
      if (c.light[i] !== r[i]) {
        count++;
        if (bad.length < 8) {
          const x = c.cx * 16 + (i & 15), z = c.cz * 16 + ((i >> 4) & 15), y = i >> 8;
          bad.push(`(${x},${y},${z}) got sky ${c.light[i] >> 4} block ${c.light[i] & 15}, want sky ${r[i] >> 4} block ${r[i] & 15} [block ${c.blocks[i]}]`);
        }
      }
    }
  }
  if (count) throw new Error(`${label} light differs from reference in ${count} cells:\n         ${bad.join('\n         ')}`);
}

// ---------------------------------------------------------------- deterministic RNG + noise

export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function hash3(x: number, y: number, z: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise in [0,1). */
export function vnoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz, seed);
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), sx), l(c(0, 1, 0), c(1, 1, 0), sx), sy),
    l(l(c(0, 0, 1), c(1, 0, 1), sx), l(c(0, 1, 1), c(1, 1, 1), sx), sy),
    sz,
  );
}

/**
 * Realistic-ish terrain: rolling heights around 64..90, caves (some open to the surface),
 * a sea at 62, oak trees with leaf canopies, a few torches and lava pools in deep caves.
 */
export function terrain(seed: number): Filler {
  const heightAt = (x: number, z: number) =>
    Math.floor(58 + vnoise3(x / 40, 0, z / 40, seed) * 28 + vnoise3(x / 9, 5, z / 9, seed) * 6);
  const treeAt = (x: number, z: number) => hash3(x, 7, z, seed) < 0.018;
  return (x, y, z) => {
    const h = heightAt(x, z);
    if (y === 0) return B('bedrock');
    if (y <= h) {
      const cave = vnoise3(x / 14, y / 9, z / 14, seed + 1);
      const tunnel = Math.abs(vnoise3(x / 22, y / 16, z / 22, seed + 2) - 0.5);
      if (y > 4 && (cave > 0.72 || tunnel < 0.035) && (h > 64 || y < h - 5)) {
        if (y <= 10) return LAVA;
        if (hash3(x, y, z, seed + 3) < 0.004) return TORCH;
        return AIR;
      }
      if (y === h) return h < 63 ? B('sand') : GRASS;
      if (y > h - 4) return DIRT;
      return hash3(x, y, z, seed + 4) < 0.01 ? B('coal_ore') : STONE;
    }
    if (y <= 62) return WATER;
    // trees: trunk 5 tall, canopy radius 2 around the top
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const tx = x + dx, tz = z + dz;
      if (!treeAt(tx, tz)) continue;
      const th = heightAt(tx, tz);
      if (th < 63) continue;
      const top = th + 6;
      if (dx === 0 && dz === 0 && y > th && y < top) return OAK_LOG;
      if (y >= top - 2 && y <= top + 1) {
        const r = y > top - 1 ? 1 : 2;
        if (Math.abs(dx) <= r && Math.abs(dz) <= r && !(Math.abs(dx) === 2 && Math.abs(dz) === 2)) return OAK_LEAVES;
      }
    }
    return AIR;
  };
}

// ---------------------------------------------------------------- PNG

export function writePNG(path: string, w: number, h: number, rgba: Uint8Array): void {
  const crcTable = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c; }
  const crc = (buf: Buffer) => { let c = -1; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  mkdirSync(path.replace(/\/[^/]*$/, ''), { recursive: true });
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

/**
 * Vertical slice (x along the image, y up) of the world at depth z (or along z at x when axis is 'z'), `scale` px per block.
 * Solid blocks are drawn in a flat colour, open cells show their light: blue-white for sky,
 * orange for block light, black when dark. Digits are not drawn; brightness is linear in level.
 */
export function sliceImage(w: World, x0: number, x1: number, y0: number, y1: number, z: number, scale: number, path: string, axis: 'x' | 'z' = 'x'): void {
  const W = (x1 - x0 + 1) * scale, H = (y1 - y0 + 1) * scale;
  const img = new Uint8Array(W * H * 4);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const wx = axis === 'x' ? x : z, wz = axis === 'x' ? z : x;
    const v = w.get(wx, y, wz), l = w.getLight(wx, y, wz);
    let r: number, g: number, b: number;
    const id = v & 0x3ff;
    if (id && LOPAC[v] >= 15) {
      const e = LEMIT[v];
      if (e) { r = 255; g = 230; b = 120; } else { r = 70; g = 70; b = 75; }
    } else {
      const s = (l >> 4) / 15, k = (l & 15) / 15;
      r = Math.min(255, s * 170 + k * 255);
      g = Math.min(255, s * 200 + k * 160);
      b = Math.min(255, s * 255 + k * 40);
      if (id === ID.water) { r *= 0.6; g *= 0.75; }
      if (id && id !== ID.water) { r = r * 0.5 + 40; g = g * 0.5 + 60; b = b * 0.5 + 20; }
    }
    for (let py = 0; py < scale; py++) for (let px = 0; px < scale; px++) {
      const ix = (x - x0) * scale + px, iy = (y1 - y) * scale + py;
      const o = (iy * W + ix) * 4;
      const grid = px === 0 || py === 0;
      img[o] = grid ? r * 0.85 : r; img[o + 1] = grid ? g * 0.85 : g; img[o + 2] = grid ? b * 0.85 : b; img[o + 3] = 255;
    }
  }
  writePNG(path, W, H, img);
}
