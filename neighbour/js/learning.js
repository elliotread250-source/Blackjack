// The neighbour learns. He remembers where he caught you, where he spotted you and which way you
// keep getting in, and after catches he answers with bear traps, security cameras and boards/chains
// on your favourite entrance. Pure JS (tested in Node). Everything he does is announced when you
// wake up and is visible in the world, so it stays fair.

export function createLearning() {
  return { catches: [], spots: [], entries: {}, traps: [], cams: [], blocked: [], learns: 0, lastSpot: null };
}

export function recordCatch(L, x, y, z) { L.catches.push([x, y, z]); }

export function recordSpot(L, x, y, z, t) {
  const ls = L.lastSpot;
  if (ls && Math.hypot(ls[0] - x, ls[2] - z) < 4 && t - ls[3] < 6) return;
  L.spots.push([x, y, z]);
  L.lastSpot = [x, y, z, t];
  if (L.spots.length > 60) L.spots.shift();
}

export function recordEntry(L, id) { L.entries[id] = (L.entries[id] || 0) + 1; }

// Densest cluster: the point with the most weighted neighbours within r (catches weigh 3, spots 1).
export function hotspot(L, r = 3.5, exclude = []) {
  const pts = L.catches.map(p => [p, 3]).concat(L.spots.map(p => [p, 1]));
  let best = null, bs = 0;
  for (const [p] of pts) {
    if (exclude.some(e => Math.hypot(e[0] - p[0], e[2] - p[2]) < 3 && Math.abs(e[1] - p[1]) < 1.5)) continue;
    let s = 0, sx = 0, sy = 0, sz = 0;
    for (const [q, w] of pts) {
      if (Math.hypot(q[0] - p[0], q[2] - p[2]) < r && Math.abs(q[1] - p[1]) < 1.5) { s += w; sx += q[0] * w; sy += q[1] * w; sz += q[2] * w; }
    }
    if (s > bs) { bs = s; best = [sx / s, sy / s, sz / s, s]; }
  }
  return best;
}

export function mostUsedEntry(L, entries, minCount = 2) {
  let best = null, bc = minCount - 1;
  for (const id in L.entries) {
    const e = entries[id];
    if (!e || e.high || L.blocked.includes(id)) continue;
    if (L.entries[id] > bc) { bc = L.entries[id]; best = id; }
  }
  return best;
}

// After a catch: decide what he does. ctx = { diff, entries, camMounts, snap(x,y,z) -> [x,y,z]|null,
// see(mount, [x,y,z]) -> bool, blockable(id) -> bool }. Returns a list of actions and records them in L.
export function learn(L, ctx) {
  const out = [];
  const nCatch = L.catches.length;
  if (nCatch === 0 || nCatch % ctx.diff.learnEvery !== 0) return out;
  L.learns++;
  const per = ctx.diff.perLearn || 1;
  // 1) bear traps at the hottest spots (not on top of an existing trap)
  for (let i = 0; i < per && L.traps.length < ctx.diff.traps; i++) {
    const hs = hotspot(L, 3.5, L.traps);
    if (!hs) break;
    const p = ctx.snap ? ctx.snap(hs[0], hs[1], hs[2], L.traps) : [hs[0], hs[1], hs[2]];
    if (!p) break;
    L.traps.push(p);
    out.push({ type: 'trap', pos: p });
  }
  // 2) a camera watching where he keeps spotting you (needs a few sightings)
  if (L.cams.length < ctx.diff.cams && L.spots.length + nCatch >= 2) {
    const hs = hotspot(L, 5);
    if (hs) {
      let best = null, bd = Infinity;
      for (const m of ctx.camMounts) {
        if (L.cams.includes(m.id)) continue;
        const d = Math.hypot(m.x - hs[0], m.z - hs[2]) + Math.abs(m.y - 2.5 - hs[1]) * 3;
        if (d > 16) continue;
        if (ctx.see && !ctx.see(m, hs)) continue;
        if (d < bd) { bd = d; best = m; }
      }
      if (best) { L.cams.push(best.id); out.push({ type: 'camera', mount: best.id }); }
    }
  }
  // 3) board up or chain the entrance you use most
  if (L.blocked.length < ctx.diff.blocks) {
    const id = mostUsedEntry(L, ctx.entries, 2);
    if (id && (!ctx.blockable || ctx.blockable(id))) { L.blocked.push(id); out.push({ type: 'block', entry: id }); }
  }
  return out;
}
