// 2.5D walkable grid built straight from the level's collision boxes, A* for the neighbour and a
// climbing-aware flood fill for the player. Pure JS; the tests use these exact functions.
//
// Every 0.5 m column can hold several walkable surfaces (ground floor, upper floor, attic, a table
// top...). A surface at height h is walkable when no box overlaps the agent's square footprint
// between h + step and h + clear: anything lower than `step` can simply be stepped onto.

import { SpatialHash } from './geom.js';

export const STEP = 0.45;          // walk up without jumping (stairs are 0.27)
export const PLAYER_CLIMB = 1.45;  // jump apex + mantle, see world.js (physics allows ~1.5)
export const MAX_L = 12;

export function buildGrid(boxes, opt) {
  const { bounds, cell = 0.5, radius = 0.3, clear = 1.9, step = STEP } = opt;
  const nx = Math.ceil((bounds.x1 - bounds.x0) / cell), nz = Math.ceil((bounds.z1 - bounds.z0) / cell);
  const N = nx * nz;
  const h = new Float32Array(N * MAX_L).fill(NaN);
  const head = new Float32Array(N * MAX_L).fill(0);
  const count = new Uint8Array(N);
  const hash = new SpatialHash(2);
  for (const b of boxes) if (b.col !== false) hash.insert(b);
  if (opt.extra) for (const b of opt.extra) hash.insert(b);
  const near = [];
  const cand = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const cx = bounds.x0 + (ix + 0.5) * cell, cz = bounds.z0 + (iz + 0.5) * cell;
      const fx0 = cx - radius, fx1 = cx + radius, fz0 = cz - radius, fz1 = cz + radius;
      hash.query(fx0, fz0, fx1, fz1, near);
      cand.length = 0;
      cand.push(0);
      for (let i = near.length - 1; i >= 0; i--) {
        const b = near[i];
        if (!(b.x0 < fx1 && b.x1 > fx0 && b.z0 < fz1 && b.z1 > fz0)) { near[i] = near[near.length - 1]; near.pop(); continue; }
        if (b.y1 > 0.001) cand.push(b.y1);
      }
      cand.sort((a, b) => a - b);
      let n = 0, last = -1e9;
      const base = (iz * nx + ix) * MAX_L;
      for (let k = 0; k < cand.length; k++) {
        const s = cand[k];
        if (s - last < 1e-4) continue;
        let ok = true, roof = Infinity;
        for (let i = 0; i < near.length; i++) {
          const b = near[i];
          if (b.y1 > s + step && b.y0 < s + clear) { ok = false; break; }
          if (b.y0 >= s + step && b.y0 < roof) roof = b.y0;
        }
        if (!ok) continue;
        // merge with a surface just below (thin trims, rugs): keep the higher one
        if (n > 0 && s - h[base + n - 1] < 0.12) { h[base + n - 1] = s; head[base + n - 1] = roof - s; last = s; continue; }
        if (n >= MAX_L) break;
        h[base + n] = s; head[base + n] = roof - s; n++; last = s;
      }
      count[iz * nx + ix] = n;
    }
  }
  return { nx, nz, cell, x0: bounds.x0, z0: bounds.z0, h, head, count, radius, step, clear };
}

export function nodePos(g, id) {
  const col = (id / MAX_L) | 0, ix = col % g.nx, iz = (col / g.nx) | 0;
  return [g.x0 + (ix + 0.5) * g.cell, g.h[id], g.z0 + (iz + 0.5) * g.cell];
}

export function colOf(g, x, z) {
  const ix = Math.floor((x - g.x0) / g.cell), iz = Math.floor((z - g.z0) / g.cell);
  if (ix < 0 || iz < 0 || ix >= g.nx || iz >= g.nz) return -1;
  return iz * g.nx + ix;
}

// The surface you are standing on (highest at or a little above your feet), or the nearest one
// within `rings` cells when the column has none.
export function findNode(g, x, y, z, rings = 4) {
  const ix0 = Math.floor((x - g.x0) / g.cell), iz0 = Math.floor((z - g.z0) / g.cell);
  let best = -1, bd = Infinity;
  for (let r = 0; r <= rings; r++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const ix = ix0 + dx, iz = iz0 + dz;
        if (ix < 0 || iz < 0 || ix >= g.nx || iz >= g.nz) continue;
        const col = iz * g.nx + ix, n = g.count[col];
        for (let l = 0; l < n; l++) {
          const hh = g.h[col * MAX_L + l];
          const dy = hh > y + 0.6 ? (hh - y) * 4 : (y - hh);
          const d = dx * dx + dz * dz + dy * dy * 4;
          if (d < bd) { bd = d; best = col * MAX_L + l; }
        }
      }
    }
    if (best >= 0) return best;
  }
  return best;
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// Walkable neighbours (|dh| <= step). Diagonals need both side cells walkable too (no corner cutting).
export function neighbours(g, id, out) {
  out.length = 0;
  const col = (id / MAX_L) | 0, ix = col % g.nx, iz = (col / g.nx) | 0;
  const hh = g.h[id], step = g.step;
  const side = (cx, cz) => {
    if (cx < 0 || cz < 0 || cx >= g.nx || cz >= g.nz) return -1;
    const c = cz * g.nx + cx, n = g.count[c];
    for (let l = 0; l < n; l++) if (Math.abs(g.h[c * MAX_L + l] - hh) <= step) return c * MAX_L + l;
    return -1;
  };
  // two stair treads under the same footprint are one small step apart
  for (let l = 0; l < g.count[col]; l++) {
    const o = col * MAX_L + l;
    if (o !== id && Math.abs(g.h[o] - hh) <= step) out.push(o, 0.5);
  }
  for (let d = 0; d < 8; d++) {
    const [dx, dz] = DIRS[d];
    const cx = ix + dx, cz = iz + dz;
    if (cx < 0 || cz < 0 || cx >= g.nx || cz >= g.nz) continue;
    if (d >= 4 && (side(ix + dx, iz) < 0 || side(ix, iz + dz) < 0)) continue;
    const c = cz * g.nx + cx, n = g.count[c];
    for (let l = 0; l < n; l++) {
      if (Math.abs(g.h[c * MAX_L + l] - hh) <= step) out.push(c * MAX_L + l, d >= 4 ? 1.4142 : 1);
    }
  }
  return out;
}

// ---------------------------------------------------------------- A*
class Heap {
  constructor() { this.ids = []; this.f = []; }
  get size() { return this.ids.length; }
  push(id, f) {
    const a = this.ids, b = this.f; let i = a.length; a.push(id); b.push(f);
    while (i > 0) { const p = (i - 1) >> 1; if (b[p] <= f) break; a[i] = a[p]; b[i] = b[p]; i = p; }
    a[i] = id; b[i] = f;
  }
  pop() {
    const a = this.ids, b = this.f, top = a[0], lid = a.pop(), lf = b.pop();
    if (a.length) {
      let i = 0; const n = a.length;
      for (;;) {
        let c = 2 * i + 1; if (c >= n) break;
        if (c + 1 < n && b[c + 1] < b[c]) c++;
        if (b[c] >= lf) break;
        a[i] = a[c]; b[i] = b[c]; i = c;
      }
      a[i] = lid; b[i] = lf;
    }
    return top;
  }
}

export function makePather(g) {
  const M = g.nx * g.nz * MAX_L;
  const gs = new Float32Array(M), par = new Int32Array(M), stamp = new Uint32Array(M), closed = new Uint32Array(M);
  let run = 0;
  const nb = [];
  return function astar(start, goal, maxIter = 60000) {
    if (start < 0 || goal < 0) return null;
    run++;
    const [gx, gy, gz] = nodePos(g, goal);
    const heur = id => { const p = nodePos(g, id); return (Math.hypot(p[0] - gx, p[2] - gz) + Math.abs(p[1] - gy) * 1.5) / g.cell; };
    const open = new Heap();
    gs[start] = 0; par[start] = -1; stamp[start] = run;
    open.push(start, heur(start));
    let best = start, bh = heur(start), it = 0;
    while (open.size && it++ < maxIter) {
      const cur = open.pop();
      if (closed[cur] === run) continue;
      closed[cur] = run;
      if (cur === goal) { best = cur; bh = 0; break; }
      const hc = heur(cur);
      if (hc < bh) { bh = hc; best = cur; }
      neighbours(g, cur, nb);
      for (let i = 0; i < nb.length; i += 2) {
        const n = nb[i];
        if (closed[n] === run) continue;
        const ng = gs[cur] + nb[i + 1];
        if (stamp[n] !== run || ng < gs[n]) {
          stamp[n] = run; gs[n] = ng; par[n] = cur;
          open.push(n, ng + heur(n));
        }
      }
    }
    // reconstruct to the goal, or to the closest node reached when the goal can't be reached
    const path = [];
    let c = best;
    while (c >= 0) { path.push(c); c = par[c]; if (path.length > 20000) break; }
    path.reverse();
    return { path, complete: best === goal };
  };
}

// Is the straight walk from a to b (world positions on surfaces) clear on the grid?
export function walkableLine(g, ax, ay, az, bx, by, bz) {
  const d = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(d / (g.cell * 0.5)));
  let y = ay;
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
    const col = colOf(g, x, z);
    if (col < 0) return false;
    let ok = false;
    for (let l = 0; l < g.count[col]; l++) {
      const hh = g.h[col * MAX_L + l];
      if (Math.abs(hh - y) <= g.step) { y = hh; ok = true; break; }
    }
    if (!ok) return false;
    // check the 4 footprint corners too, so we don't shave wall corners
    const r = g.radius * 0.9;
    for (const [ox, oz] of [[r, r], [r, -r], [-r, r], [-r, -r]]) {
      const c2 = colOf(g, x + ox, z + oz);
      if (c2 < 0) return false;
      let ok2 = false;
      for (let l = 0; l < g.count[c2]; l++) if (Math.abs(g.h[c2 * MAX_L + l] - y) <= g.step) { ok2 = true; break; }
      if (!ok2) return false;
    }
  }
  return Math.abs(y - by) <= g.step + 0.01;
}

// Turn a node path into world waypoints, dropping the ones we can walk straight past.
export function smoothPath(g, ids) {
  const pts = ids.map(id => nodePos(g, id));
  if (pts.length <= 2) return pts;
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = Math.min(pts.length - 1, i + 12);
    for (; j > i + 1; j--) {
      const a = pts[i], b = pts[j];
      if (Math.abs(a[1] - b[1]) < 0.05 && walkableLine(g, a[0], a[1], a[2], b[0], b[1], b[2])) break;
    }
    out.push(pts[j]);
    i = j;
  }
  return out;
}

// Connected components over walkable edges (used by the tests).
export function components(g) {
  const M = g.nx * g.nz * MAX_L;
  const comp = new Int32Array(M).fill(-1);
  const sizes = [];
  const nb = [], stack = [];
  for (let col = 0; col < g.nx * g.nz; col++) {
    for (let l = 0; l < g.count[col]; l++) {
      const s = col * MAX_L + l;
      if (comp[s] >= 0) continue;
      const k = sizes.length; let size = 0;
      comp[s] = k; stack.push(s);
      while (stack.length) {
        const c = stack.pop(); size++;
        neighbours(g, c, nb);
        for (let i = 0; i < nb.length; i += 2) if (comp[nb[i]] < 0) { comp[nb[i]] = k; stack.push(nb[i]); }
      }
      sizes.push(size);
    }
  }
  return { comp, sizes };
}

// Player flood fill: walk (|dh| <= step), drop down any height, and climb up to
// PLAYER_CLIMB + crate stack (crates of height `crate`, as many as fit under the headroom).
export function playerReach(g, startId, crates = 0, crate = 0.7) {
  const M = g.nx * g.nz * MAX_L;
  const seen = new Uint8Array(M);
  const stack = [startId];
  seen[startId] = 1;
  let n = 0;
  while (stack.length) {
    const id = stack.pop(); n++;
    const col = (id / MAX_L) | 0, ix = col % g.nx, iz = (col / g.nx) | 0;
    const hh = g.h[id];
    const fit = Math.max(0, Math.floor((g.head[id] - 1.8) / crate + 1e-6));
    const climb = PLAYER_CLIMB + crate * Math.min(crates, fit);
    const canJump = g.head[id] >= 1.8;
    for (let l = 0; l < g.count[col]; l++) {
      const o = col * MAX_L + l, dh = g.h[o] - hh;
      if (seen[o] || o === id) continue;
      if ((dh <= g.step && dh >= -g.step) || (canJump && dh > 0 && dh <= climb)) { seen[o] = 1; stack.push(o); }
    }
    for (let d = 0; d < 4; d++) {
      const [dx, dz] = DIRS[d];
      const cx = ix + dx, cz = iz + dz;
      if (cx < 0 || cz < 0 || cx >= g.nx || cz >= g.nz) continue;
      const c = cz * g.nx + cx;
      // walking or dropping lands on the highest surface at or below step height
      let land = -1;
      for (let l = 0; l < g.count[c]; l++) if (g.h[c * MAX_L + l] <= hh + g.step) land = c * MAX_L + l;
      // ...but only if nothing solid is in between (no falling through floors)
      if (land >= 0 && !seen[land] && g.h[land] + g.head[land] >= hh + 1.0) { seen[land] = 1; stack.push(land); }
      if (!canJump) continue;
      for (let l = 0; l < g.count[c]; l++) {
        const nid = c * MAX_L + l, dh = g.h[nid] - hh;
        if (dh > g.step && dh <= climb && !seen[nid]) { seen[nid] = 1; stack.push(nid); }
      }
    }
  }
  return { seen, n };
}
