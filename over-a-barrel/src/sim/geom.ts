import type { Vec } from './types';

export const v = (x: number, y: number): Vec => ({ x, y });

export function clamp(x: number, lo: number, hi: number): number {
  return x < lo ? lo : x > hi ? hi : x;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Wrap an angle into (-π, π]. */
export function wrapPi(a: number): number {
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
}

export function signedArea(pts: Vec[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j].x * pts[i].y - pts[i].x * pts[j].y);
  }
  return a / 2;
}

/** Counter-clockwise copy with near-duplicate and collinear points removed. */
export function cleanPolygon(pts: Vec[], minDist = 0.02): Vec[] {
  let out: Vec[] = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > minDist) out.push({ x: p.x, y: p.y });
  }
  if (out.length > 2) {
    const f = out[0];
    const l = out[out.length - 1];
    if (Math.hypot(f.x - l.x, f.y - l.y) <= minDist) out.pop();
  }
  // Drop points that sit on a straight line between their neighbours.
  let changed = true;
  while (changed && out.length > 3) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      const a = out[(i + out.length - 1) % out.length];
      const b = out[i];
      const c = out[(i + 1) % out.length];
      const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 1e-6) {
        out.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  if (signedArea(out) < 0) out = out.reverse();
  return out;
}

/** Deterministic PRNG (mulberry32) so procedural detail never changes between loads. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rect(x0: number, y0: number, x1: number, y1: number): Vec[] {
  return [v(x0, y0), v(x1, y0), v(x1, y1), v(x0, y1)];
}

/** A lumpy rounded rock centred on (cx, cy). */
export function boulder(cx: number, cy: number, rx: number, ry: number, seed: number, n = 14, lump = 0.12): Vec[] {
  const r = rng(seed);
  const pts: Vec[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (r() - 0.5) * 2 * lump;
    pts.push(v(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k));
  }
  return pts;
}

/** Polygon from a centreline: a branch/limb of varying thickness. */
export function limb(points: Vec[], widths: number[]): Vec[] {
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const w = widths[i] / 2;
    left.push(v(p.x - dy * w, p.y + dx * w));
    right.push(v(p.x + dy * w, p.y - dx * w));
  }
  return [...right, ...left.reverse()];
}

export function pointInPolygon(p: Vec, pts: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function bounds(pts: Vec[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  return { x0, y0, x1, y1 };
}
