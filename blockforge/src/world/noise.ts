// Seeded simplex noise (2D and 3D) plus small deterministic hash / RNG helpers used by
// world generation. Based on the public-domain simplex reference by Stefan Gustavson,
// with a seeded permutation table. No allocation per call.

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;
const F3 = 1 / 3;
const G3 = 1 / 6;

// 12 gradient directions (cube edge midpoints); 2D uses their x/y parts.
const GRAD3 = new Float64Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
]);
// 2D gradients: 8 evenly spread unit-ish directions give rounder features than GRAD3.xy.
const GRAD2 = new Float64Array([
  1, 0, -1, 0, 0, 1, 0, -1,
  0.7071067811865476, 0.7071067811865476, -0.7071067811865476, 0.7071067811865476,
  0.7071067811865476, -0.7071067811865476, -0.7071067811865476, -0.7071067811865476,
]);

/** 32-bit integer mix (lowbias32 by Chris Wellons). */
export function mix32(h: number): number {
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Deterministic hash of a seed and two integers, uint32. */
export function hash2i(seed: number, x: number, z: number): number {
  return mix32((seed ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1)) >>> 0);
}

/** Deterministic hash of a seed and three integers, uint32. */
export function hash3i(seed: number, x: number, y: number, z: number): number {
  return mix32((seed ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x9e3779b1) ^ Math.imul(z | 0, 0x165667b1)) >>> 0);
}

/** uint32 -> [0,1) */
export const unit = (h: number) => (h >>> 0) / 4294967296;

/** Small fast seeded PRNG (mulberry32). Reseedable so one instance can be reused. */
export class Rng {
  s: number;
  constructor(seed = 0) { this.s = seed >>> 0; }
  seed(s: number): this { this.s = s >>> 0; return this; }
  /** uint32 */
  u32(): number {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }
  /** [0,1) */
  next(): number { return this.u32() / 4294967296; }
  /** integer in [0, n) */
  int(n: number): number { return Math.floor(this.next() * n); }
  /** integer in [a, b] */
  range(a: number, b: number): number { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p: number): boolean { return this.next() < p; }
}

export class Noise {
  private perm = new Uint8Array(512);
  private perm12 = new Uint8Array(512);
  private perm8 = new Uint8Array(512);

  constructor(seed: number) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    const r = new Rng(mix32((seed >>> 0) ^ 0x5bd1e995));
    for (let i = 255; i > 0; i--) {
      const j = r.int(i + 1);
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) {
      const v = p[i & 255];
      this.perm[i] = v;
      this.perm12[i] = v % 12;
      this.perm8[i] = v & 7;
    }
  }

  /** 2D simplex noise, about [-1, 1]. */
  noise2(xin: number, yin: number): number {
    const perm = this.perm, pg = this.perm8;
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    let i1: number, j1: number;
    if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      const g = pg[ii + perm[jj]] << 1;
      t0 *= t0;
      n += t0 * t0 * (GRAD2[g] * x0 + GRAD2[g + 1] * y0);
    }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      const g = pg[ii + i1 + perm[jj + j1]] << 1;
      t1 *= t1;
      n += t1 * t1 * (GRAD2[g] * x1 + GRAD2[g + 1] * y1);
    }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      const g = pg[ii + 1 + perm[jj + 1]] << 1;
      t2 *= t2;
      n += t2 * t2 * (GRAD2[g] * x2 + GRAD2[g + 1] * y2);
    }
    return 70 * n;
  }

  /** 3D simplex noise, about [-1, 1]. */
  noise3(xin: number, yin: number, zin: number): number {
    const perm = this.perm, pg = this.perm12;
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    let n = 0;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 > 0) {
      const g = pg[ii + perm[jj + perm[kk]]] * 3;
      t0 *= t0;
      n += t0 * t0 * (GRAD3[g] * x0 + GRAD3[g + 1] * y0 + GRAD3[g + 2] * z0);
    }
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 > 0) {
      const g = pg[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
      t1 *= t1;
      n += t1 * t1 * (GRAD3[g] * x1 + GRAD3[g + 1] * y1 + GRAD3[g + 2] * z1);
    }
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 > 0) {
      const g = pg[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
      t2 *= t2;
      n += t2 * t2 * (GRAD3[g] * x2 + GRAD3[g + 1] * y2 + GRAD3[g + 2] * z2);
    }
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 > 0) {
      const g = pg[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
      t3 *= t3;
      n += t3 * t3 * (GRAD3[g] * x3 + GRAD3[g + 1] * y3 + GRAD3[g + 2] * z3);
    }
    return 32 * n;
  }
}

// Per-octave offsets so octaves do not all share the lattice origin (which would make
// every octave zero at (0,0) and correlate them).
const OFF_X = [0, 37.17, -91.43, 151.9, -203.3, 263.7, -317.1, 389.5, -431.9, 499.3];
const OFF_Y = [0, -53.71, 71.29, -127.3, 181.7, -241.1, 293.9, -347.3, 409.1, -461.7];

/** Fractal sum of 2D simplex octaves, normalised back to about [-1, 1]. */
export function fbm2(n: Noise, x: number, y: number, octaves: number, lacunarity = 2, gain = 0.5): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * n.noise2(x * f + OFF_X[o % 10], y * f + OFF_Y[o % 10]);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

/** Fractal sum of 3D simplex octaves, normalised back to about [-1, 1]. */
export function fbm3(n: Noise, x: number, y: number, z: number, octaves: number, lacunarity = 2, gain = 0.5): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * n.noise3(x * f + OFF_X[o % 10], y * f + OFF_Y[o % 10], z * f - OFF_X[o % 10]);
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}

/**
 * Ridged multifractal in [0, 1]: sharp crests where the base noise crosses zero, each
 * octave weighted by the previous one so ridges stay crisp and valleys stay smooth.
 */
export function ridged2(n: Noise, x: number, y: number, octaves: number, lacunarity = 2, gain = 0.5): number {
  let sum = 0, amp = 1, norm = 0, f = 1, w = 1;
  for (let o = 0; o < octaves; o++) {
    let v = 1 - Math.abs(n.noise2(x * f + OFF_X[o % 10], y * f + OFF_Y[o % 10]));
    v *= v;
    v *= w;
    w = v * 1.6 > 1 ? 1 : v * 1.6;
    sum += v * amp;
    norm += amp;
    amp *= gain;
    f *= lacunarity;
  }
  return sum / norm;
}
