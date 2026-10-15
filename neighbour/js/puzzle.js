// The Act 1 puzzle: get into the basement.
//
//   basement door  <- red key (padlock + chains)
//   red key        <- in the locked study upstairs, two ways in:
//     A) power route: crowbar (shed) -> pry the boarded garage window -> fuse (garage workbench)
//                     -> fuse box (pantry) -> the study's electric lock opens
//     B) climb route: stack crates (woodpile + 1 crate, or 3 crates) onto the garage roof
//                     -> break the study's side window with a thrown object -> climb in
//
// STEPS feeds the in-game notes; GRAPH is the AND/OR dependency graph the tests check; solveLevel is a
// physical reachability walk over the real collision boxes that plays the puzzle like a player would.

import { buildGrid, findNode, playerReach, MAX_L } from './nav.js';
import { doorBoxes, windowBox, windowCenter, ITEM_TYPES, CRATE } from './level.js';
import { SpatialHash } from './geom.js';
import { lineOfSight } from './perception.js';

export const STEPS = {
  crowbar:      { label: 'Found a crowbar in the shed' },
  garageWindow: { label: 'Pried the boards off the garage window' },
  fuse:         { label: 'Took the fuse from the garage' },
  power:        { label: 'Fixed the fuse box: the study lock has power' },
  stackCrates:  { label: 'Stacked crates to climb' },
  garageRoof:   { label: 'Climbed onto the garage roof' },
  studyWindow:  { label: 'Smashed the study window' },
  study:        { label: 'Got into the study' },
  redkey:       { label: 'Found the red key' },
  basement:     { label: 'Opened the basement' },
};

// requirement lists: any one inner list (all of its steps) is enough
export const GRAPH = {
  crowbar: [[]],
  throwable: [[]],
  stackCrates: [[]],
  garageWindow: [['crowbar']],
  fuse: [['garageWindow']],
  power: [['fuse']],
  garageRoof: [['stackCrates']],
  studyWindow: [['garageRoof', 'throwable'], ['stackCrates', 'throwable']],
  study: [['power'], ['studyWindow']],
  redkey: [['study']],
  basement: [['redkey']],
};
const FREE = new Set(['throwable']); // just picking things up, not a puzzle step

// smallest set of puzzle steps needed for a goal
export function minSteps(goal, graph = GRAPH) {
  const memo = new Map();
  const solve = (g, stack) => {
    if (memo.has(g)) return memo.get(g);
    if (stack.has(g)) return null;
    stack.add(g);
    let best = null;
    for (const alt of graph[g]) {
      const set = new Set();
      let ok = true;
      for (const d of alt) {
        const s = solve(d, stack);
        if (!s) { ok = false; break; }
        for (const x of s) set.add(x);
      }
      if (!ok) continue;
      if (!FREE.has(g)) set.add(g);
      if (!best || set.size < best.size) best = set;
    }
    stack.delete(g);
    memo.set(g, best);
    return best;
  };
  return solve(goal, new Set());
}

export function hasCycle(graph = GRAPH) {
  const state = {};
  const visit = n => {
    if (state[n] === 1) return true;
    if (state[n] === 2) return false;
    state[n] = 1;
    for (const alt of graph[n]) for (const d of alt) if (visit(d)) return true;
    state[n] = 2;
    return false;
  };
  return Object.keys(graph).some(visit);
}

// ---------------------------------------------------------------- physical walk
// Plays the level with the player's real movement abilities (walk, drop, climb, crate stacks),
// opening what can be opened as soon as it is reachable. disable: list of action keys to forbid,
// e.g. 'power', 'break:studyEW', 'boards:garageW', 'item:crowbar'. Returns the action log.
export function solveLevel(level, opts = {}) {
  const disable = new Set(opts.disable || []);
  const maxCrates = opts.maxCrates === undefined ? 99 : opts.maxCrates;
  const st = {
    have: new Set(), boardsOff: new Set(), broken: new Set(), unlocked: new Set(), power: false, log: [], reached: false,
  };
  for (const w of level.windows) if (!w.boards) st.boardsOff.add(w.id);
  const hash = new SpatialHash(2);
  for (const b of level.boxes) if (b.col !== false || b.op !== false) hash.insert(b);
  const doorsById = Object.fromEntries(level.doors.map(d => [d.id, d]));

  for (let iter = 0; iter < 40; iter++) {
    const extra = [], wbox = {};
    for (const w of level.windows) {
      wbox[w.id] = windowBox(w);
      if (!st.boardsOff.has(w.id)) extra.push(wbox[w.id]);
      else if (w.glass && !st.broken.has(w.id)) extra.push(wbox[w.id]);
    }
    for (const d of level.doors) if (d.lock && !st.unlocked.has(d.id)) extra.push(doorBoxes(d).closed);
    const g = buildGrid(level.boxes, { bounds: level.reachBounds, cell: 0.5, radius: 0.3, clear: 1.0, extra });
    const crates = Math.min(maxCrates, [...st.have].filter(id => level.items.find(i => i.id === id).type === 'crate').length);
    const start = findNode(g, level.spawn.x, level.spawn.y, level.spawn.z);
    const R = playerReach(g, start, crates, CRATE);
    st.lastGrid = g; st.lastReach = R;
    // any reachable surface near a point (hands reach ~1.6 m out, items up to 2.1 m above your feet)
    const solid = b => b.col !== false;
    let ignore = null;
    const handLos = (ax, ay, az, bx, by, bz) => {
      const f = ignore ? (b => b !== ignore && solid(b)) : solid;
      const hit = hash.raycast(ax, ay, az, bx - ax, by - ay, bz - az, f, extra);
      return !hit || hit.t > 0.98;
    };
    const near = (x, y, z, rad = 1.6, up = 2.1, down = 0.6) => {
      const r = Math.ceil(rad / g.cell);
      const ix0 = Math.floor((x - g.x0) / g.cell), iz0 = Math.floor((z - g.z0) / g.cell);
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const ix = ix0 + dx, iz = iz0 + dz;
        if (ix < 0 || iz < 0 || ix >= g.nx || iz >= g.nz) continue;
        const cx = g.x0 + (ix + 0.5) * g.cell, cz = g.z0 + (iz + 0.5) * g.cell;
        if (Math.hypot(cx - x, cz - z) > rad) continue;
        const col = iz * g.nx + ix;
        for (let l = 0; l < g.count[col]; l++) {
          const id = col * MAX_L + l;
          if (!R.seen[id]) continue;
          const h = g.h[id];
          if (y - h <= up && h - y <= down && handLos(cx, h + 1.4, cz, x, y + 0.08, z)) return [cx, h, cz];
        }
      }
      return null;
    };
    let changed = false;
    const act = (key, msg) => { st.log.push(msg || key); changed = true; };
    // pick up everything reachable
    for (const it of level.items) {
      if (st.have.has(it.id) || disable.has('item:' + it.id)) continue;
      if (near(it.x, it.y, it.z)) { st.have.add(it.id); act('item:' + it.id, 'pick:' + it.id); }
    }
    const haveType = t => [...st.have].some(id => level.items.find(i => i.id === id).type === t);
    const throwable = [...st.have].some(id => { const t = level.items.find(i => i.id === id).type; return t !== 'redkey' && t !== 'fuse'; });
    for (const w of level.windows) {
      const c = windowCenter(w);
      if (!st.boardsOff.has(w.id)) {
        ignore = wbox[w.id];
        const can = haveType('crowbar') && !disable.has('boards:' + w.id) && near(c[0], w.sill + 0.3, c[2], 1.6, 1.9, 0.9);
        ignore = null;
        if (can) { st.boardsOff.add(w.id); act('boards:' + w.id); }
        continue;
      }
      if (w.glass && !st.broken.has(w.id) && throwable && w.breakable && !disable.has('break:' + w.id)) {
        // a clear throw from some reachable spot within 14 m
        const r = Math.ceil(14 / g.cell);
        const ix0 = Math.floor((c[0] - g.x0) / g.cell), iz0 = Math.floor((c[2] - g.z0) / g.cell);
        let ok = false;
        for (let dz = -r; dz <= r && !ok; dz += 2) for (let dx = -r; dx <= r && !ok; dx += 2) {
          const ix = ix0 + dx, iz = iz0 + dz;
          if (ix < 0 || iz < 0 || ix >= g.nx || iz >= g.nz) continue;
          const col = iz * g.nx + ix;
          const cx = g.x0 + (ix + 0.5) * g.cell, cz = g.z0 + (iz + 0.5) * g.cell;
          if (Math.hypot(cx - c[0], cz - c[2]) > 14) continue;
          for (let l = 0; l < g.count[col] && !ok; l++) {
            if (!R.seen[col * MAX_L + l]) continue;
            const ey = g.h[col * MAX_L + l] + 1.5;
            // aim at the pane from slightly in front of it, so the window's own frame doesn't count
            const dx2 = cx - c[0], dz2 = cz - c[2], dl = Math.hypot(dx2, dz2) || 1;
            if (lineOfSight(hash, [], cx, ey, cz, c[0] + dx2 / dl * 0.3, c[1], c[2] + dz2 / dl * 0.3)) ok = true;
          }
        }
        if (ok) { st.broken.add(w.id); act('break:' + w.id); }
      }
    }
    if (!st.power && haveType('fuse') && !disable.has('power')) {
      const fb = level.fusebox;
      if (near(fb.x, fb.y, fb.z, 1.4, 2.0, 0.5)) { st.power = true; act('power'); }
    }
    for (const d of level.doors) {
      if (!d.lock || st.unlocked.has(d.id)) continue;
      const m = (d.t0 + d.t1) / 2;
      const side = s => (d.axis === 'z' ? [m + s * 0.8, d.y + 0.9, d.c] : [d.c, d.y + 0.9, m + s * 0.8]);
      if (d.lock === 'bolt' && !disable.has('bolt:' + d.id)) {
        const p = side(d.inside); if (near(p[0], p[1], p[2], 0.9, 1.4, 0.3)) { st.unlocked.add(d.id); act('bolt:' + d.id); }
      } else if (d.lock === 'power') {
        const pin = side(d.inside);
        if (st.power) { st.unlocked.add(d.id); act('unlock:' + d.id); }
        else if (near(pin[0], pin[1], pin[2], 0.9, 1.4, 0.3)) { st.unlocked.add(d.id); act('inside:' + d.id); }
      } else if (d.lock === 'red' && haveType('redkey') && !disable.has('key:' + d.id)) {
        const a = side(-1), b = side(1);
        if (near(a[0], a[1], a[2], 1.0, 1.4, 0.3) || near(b[0], b[1], b[2], 1.0, 1.4, 0.3)) { st.unlocked.add(d.id); act('key:' + d.id); }
      }
    }
    const tb = level.basementTrigger;
    if (st.unlocked.has('basement') && near((tb.x0 + tb.x1) / 2, 0, (tb.z0 + tb.z1) / 2, 1.2, 0.5, 0.5)) {
      st.reached = true; st.log.push('basement'); break;
    }
    if (!changed) break;
  }
  st.doorsById = doorsById;
  return st;
}

export function itemIsThrowable(type) { return type !== 'redkey' && !!ITEM_TYPES[type]; }
