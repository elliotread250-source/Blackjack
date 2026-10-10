// Axis-aligned boxes, a 2D spatial hash over x/z and ray tests. Pure JS: no three.js, runs in Node,
// so the tests use exactly the collision and line-of-sight code the game uses.
//
// A box is a plain object { x0, y0, z0, x1, y1, z1, ... } with x0 < x1 etc.

export function makeBox(x0, y0, z0, x1, y1, z1, extra) {
  const b = {
    x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1),
    x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1),
  };
  return extra ? Object.assign(b, extra) : b;
}

export function boxesOverlap(a, b, eps = 0) {
  return a.x0 < b.x1 - eps && a.x1 > b.x0 + eps && a.y0 < b.y1 - eps && a.y1 > b.y0 + eps && a.z0 < b.z1 - eps && a.z1 > b.z0 + eps;
}

export function pointInBox(b, x, y, z) {
  return x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
}

export function pointInRectXZ(b, x, z) {
  return x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
}

// Slab test. Returns entry distance t in [0, tmax] along (dx,dy,dz) (need not be normalised), or -1.
export function rayBox(ox, oy, oz, dx, dy, dz, b, tmax) {
  let t0 = 0, t1 = tmax;
  if (Math.abs(dx) < 1e-12) { if (ox < b.x0 || ox > b.x1) return -1; }
  else {
    let a = (b.x0 - ox) / dx, c = (b.x1 - ox) / dx;
    if (a > c) { const t = a; a = c; c = t; }
    if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) return -1;
  }
  if (Math.abs(dy) < 1e-12) { if (oy < b.y0 || oy > b.y1) return -1; }
  else {
    let a = (b.y0 - oy) / dy, c = (b.y1 - oy) / dy;
    if (a > c) { const t = a; a = c; c = t; }
    if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) return -1;
  }
  if (Math.abs(dz) < 1e-12) { if (oz < b.z0 || oz > b.z1) return -1; }
  else {
    let a = (b.z0 - oz) / dz, c = (b.z1 - oz) / dz;
    if (a > c) { const t = a; a = c; c = t; }
    if (a > t0) t0 = a; if (c < t1) t1 = c; if (t0 > t1) return -1;
  }
  return t0;
}

// Uniform grid over x/z. Each box is listed in every cell it touches; queries de-duplicate with a stamp.
export class SpatialHash {
  constructor(cell = 2) {
    this.cell = cell;
    this.map = new Map();
    this.stamp = 1;
    this.all = [];
  }
  key(ix, iz) { return ix * 73856093 ^ iz * 19349663; }
  insert(b) {
    const c = this.cell;
    b._s = 0;
    this.all.push(b);
    for (let ix = Math.floor(b.x0 / c); ix <= Math.floor(b.x1 / c); ix++) {
      for (let iz = Math.floor(b.z0 / c); iz <= Math.floor(b.z1 / c); iz++) {
        const k = this.key(ix, iz);
        let l = this.map.get(k);
        if (!l) { l = []; this.map.set(k, l); }
        l.push(b);
      }
    }
  }
  // Boxes whose x/z rect touches [x0,x1]x[z0,z1]. Results go into out (cleared).
  query(x0, z0, x1, z1, out) {
    out.length = 0;
    const c = this.cell, s = ++this.stamp;
    for (let ix = Math.floor(x0 / c); ix <= Math.floor(x1 / c); ix++) {
      for (let iz = Math.floor(z0 / c); iz <= Math.floor(z1 / c); iz++) {
        const l = this.map.get(this.key(ix, iz));
        if (!l) continue;
        for (let i = 0; i < l.length; i++) {
          const b = l[i];
          if (b._s === s) continue;
          b._s = s;
          if (b.x1 >= x0 && b.x0 <= x1 && b.z1 >= z0 && b.z0 <= z1) out.push(b);
        }
      }
    }
    return out;
  }
  // Nearest hit along a segment from o by d (unnormalised) with t in [0,1]. filter(b) -> bool.
  raycast(ox, oy, oz, dx, dy, dz, filter, extra) {
    const c = this.cell, s = ++this.stamp;
    let best = Infinity, hit = null;
    // walk the cells the segment's x/z projection crosses (Amanatides & Woo)
    let ix = Math.floor(ox / c), iz = Math.floor(oz / c);
    const ex = Math.floor((ox + dx) / c), ez = Math.floor((oz + dz) / c);
    const sx = dx > 0 ? 1 : -1, sz = dz > 0 ? 1 : -1;
    const tdx = Math.abs(dx) < 1e-12 ? Infinity : c / Math.abs(dx);
    const tdz = Math.abs(dz) < 1e-12 ? Infinity : c / Math.abs(dz);
    let tmx = Math.abs(dx) < 1e-12 ? Infinity : ((dx > 0 ? (ix + 1) * c - ox : ox - ix * c) / Math.abs(dx));
    let tmz = Math.abs(dz) < 1e-12 ? Infinity : ((dz > 0 ? (iz + 1) * c - oz : oz - iz * c) / Math.abs(dz));
    for (let guard = 0; guard < 4096; guard++) {
      const l = this.map.get(this.key(ix, iz));
      if (l) {
        for (let i = 0; i < l.length; i++) {
          const b = l[i];
          if (b._s === s) continue;
          b._s = s;
          if (filter && !filter(b)) continue;
          const t = rayBox(ox, oy, oz, dx, dy, dz, b, 1);
          if (t >= 0 && t < best) { best = t; hit = b; }
        }
      }
      if (ix === ex && iz === ez) break;
      const tn = Math.min(tmx, tmz);
      if (tn > best || tn > 1) break;
      if (tmx < tmz) { tmx += tdx; ix += sx; } else { tmz += tdz; iz += sz; }
    }
    if (extra) {
      for (let i = 0; i < extra.length; i++) {
        const b = extra[i];
        if (!b || (filter && !filter(b))) continue;
        const t = rayBox(ox, oy, oz, dx, dy, dz, b, 1);
        if (t >= 0 && t < best) { best = t; hit = b; }
      }
    }
    return hit ? { t: best, box: hit } : null;
  }
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export function angleWrap(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }
export function dist2(ax, az, bx, bz) { const dx = ax - bx, dz = az - bz; return dx * dx + dz * dz; }

// Small deterministic RNG so tests and the AI routine are reproducible.
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
