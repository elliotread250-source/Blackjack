#!/usr/bin/env node
/* Geometry + visual-consistency tests for the Phase 2 rebuild (no three.js).  node tools/visual.cjs
 * The dressing pass, furniture models and exterior trim must never change how a level plays:
 * collision volume, sight-blocking geometry, doors and windows stay exactly as they were, and
 * everything they draw has to exist (materials, furniture models, decor types). */
'use strict';
const fs = require('fs');
const path = require('path');
const J = f => require(path.join(__dirname, '..', 'js', f));
const { buildLevel, MISSIONS } = J('level.js');
const { dressRooms } = J('dress.js');
const src = f => fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');

let n = 0;
const fails = [];
const ok = (c, msg) => { if (c) n++; else fails.push(msg); };

// --- what exists: texture/material keys, furniture models, decor types (read from source; three.js isn't loadable here)
const tex = src('textures.js');
const MATS = new Set();
for (const block of tex.match(/TEX_SCALE = \{[\s\S]*?\n\};|Object\.assign\(TEX_SCALE, \{[\s\S]*?\}\);/g) || []) for (const m of block.matchAll(/([a-z_0-9]+):\s*[\d.]+/g)) MATS.add(m[1]);
const FURN = new Set([...src('furniture.js').matchAll(/case '(f_[a-z]+)'/g)].map(m => m[1]));
const DECOR = new Set([...src('models.js').matchAll(/case '([a-zA-Z]+)'/g)].map(m => m[1]));
ok(MATS.size > 40 && MATS.has('wp_damask') && MATS.has('fl_parquet') && MATS.has('rug_red'), 'material library parsed (' + MATS.size + ')');
ok(FURN.size >= 40, 'furniture library parsed (' + FURN.size + ' models)');

const vol = b => (b.x1 - b.x0) * (b.y1 - b.y0) * (b.z1 - b.z0);
const sum = (bs, f) => bs.reduce((s, b) => s + f(b), 0);
const faceMats = b => (b.m == null ? [] : typeof b.m === 'string' ? [b.m] : Object.values(b.m).filter(Boolean));
const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

for (let i = 0; i < MISSIONS.length; i++) {
  const L = buildLevel(i), name = MISSIONS[i].name;
  // 1. every material a visible box uses exists
  const missing = new Set();
  for (const b of L.boxes) if (b.vis) for (const m of faceMats(b)) if (!MATS.has(m)) missing.add(m);
  ok(!missing.size, name + ': all box materials exist' + (missing.size ? ' (missing ' + [...missing] + ')' : ''));
  // 2. every decor item has a model
  const noModel = new Set(L.decor.filter(d => d.t.startsWith('f_') ? !FURN.has(d.t) : !DECOR.has(d.t)).map(d => d.t));
  ok(!noModel.size, name + ': every decor item has a model' + (noModel.size ? ' (' + [...noModel] + ')' : ''));
  // 3. furniture is sane: positive size, finite position
  const bad = L.decor.filter(d => d.t.startsWith('f_') && d.t !== 'f_brace' && !(d.w > 0 && d.d > 0 && d.h > 0 && [d.x, d.y, d.z].every(Number.isFinite)));
  ok(!bad.length, name + ': every furniture piece has a real footprint' + (bad.length ? ' (' + bad.map(d => d.t) + ')' : ''));
  // 4. decorative trim never collides or blocks sight
  const deco = L.boxes.filter(b => b.deco);
  ok(deco.every(b => !b.col && !b.op), name + ': ' + deco.length + ' trim boxes are visual only');
  // 5. furnished collision boxes still collide (only the drawing moved to the model)
  const furnished = L.boxes.filter(b => b.noDress && !b.vis);
  ok(furnished.every(b => b.col), name + ': ' + furnished.length + ' furnished boxes keep their collision');
  // 6. dressing only splits boxes: collision and sight-blocking volume are unchanged by another pass
  const cv = sum(L.boxes.filter(b => b.col), vol), ov = sum(L.boxes.filter(b => b.op), vol), cn = L.boxes.length;
  dressRooms(L);
  ok(Math.abs(sum(L.boxes.filter(b => b.col), vol) - cv) < 1e-6 && Math.abs(sum(L.boxes.filter(b => b.op), vol) - ov) < 1e-6,
    name + ': re-dressing keeps collision and sight volume (' + cv.toFixed(1) + ' m3)');
  ok(L.boxes.length >= cn, name + ': re-dressing never drops geometry');
  // 7. every room got its wallpaper, floor and trim
  for (const R of L.rooms || []) {
    const near = b => overlap(b.x0, b.x1, R.x0 - 0.3, R.x1 + 0.3) > 0.05 && overlap(b.z0, b.z1, R.z0 - 0.3, R.z1 + 0.3) > 0.05 && overlap(b.y0, b.y1, R.y, R.y + R.h) > 0.2;
    const walls = L.boxes.filter(b => near(b) && typeof b.m === 'object' && b.m && Object.entries(b.m).some(([k, v]) => k !== 'all' && k !== 'py' && k !== 'ny' && v === R.wall)).length;
    ok(walls >= 2, name + ' / ' + R.name + ': walls papered (' + walls + ' pieces of ' + R.wall + ')');
    if (R.floor) ok(L.boxes.some(b => b.m && b.m.py === R.floor && overlap(b.x0, b.x1, R.x0, R.x1) > 0.05 && overlap(b.z0, b.z1, R.z0, R.z1) > 0.05 && Math.abs(b.y1 - R.y) < 0.03), name + ' / ' + R.name + ': floor laid (' + R.floor + ')');
    ok(L.boxes.some(b => b.deco && Math.abs(b.y0 - R.y) < 0.03 && b.y1 - b.y0 < 0.2 && overlap(b.x0, b.x1, R.x0 - 0.3, R.x1 + 0.3) > 0.01 && overlap(b.z0, b.z1, R.z0 - 0.3, R.z1 + 0.3) > 0.01), name + ' / ' + R.name + ': skirting boards');
  }
  // 8. no furniture stands in a doorway (doors must look as open as they play)
  const lowWall = new Set(['f_picture', 'f_curtains', 'f_bulb', 'f_ceilinglamp', 'f_pendant', 'f_pipes', 'f_elecbox']);
  for (const d of L.doors) {
    const a0 = d.c - d.w / 2 + 0.05, a1 = d.c + d.w / 2 - 0.05, t0 = Math.min(d.t0, d.t1) - 0.25, t1 = Math.max(d.t0, d.t1) + 0.25;
    const [x0, x1, z0, z1] = d.axis === 'x' ? [a0, a1, t0, t1] : [t0, t1, a0, a1];
    const hit = L.decor.filter(f => f.t.startsWith('f_') && !lowWall.has(f.t) && f.t !== 'f_brace').find(f => {
      const c = Math.abs(Math.cos(f.ry || 0)), s = Math.abs(Math.sin(f.ry || 0)), hx = (f.w * c + f.d * s) / 2, hz = (f.w * s + f.d * c) / 2;
      return overlap(f.x - hx, f.x + hx, x0, x1) > 0.02 && overlap(f.z - hz, f.z + hz, z0, z1) > 0.02 && overlap(f.y, f.y + f.h, d.y, d.y + d.h) > 0.02;
    });
    ok(!hit, name + ': doorway ' + d.id + ' is clear' + (hit ? ' (blocked by ' + hit.t + ' at ' + hit.x.toFixed(1) + ',' + hit.z.toFixed(1) + ')' : ''));
  }
  // 9. every light has a fitting nearby or is outdoors/decor-lit, and sits inside the map
  const nb = L.reachBounds || L.navBounds || { x0: -40, z0: -80, x1: 40, z1: 30 };
  ok(L.lights.every(l => (l.x > nb.x0 - 5 && l.x < nb.x1 + 5 && l.z > nb.z0 - 5 && l.z < nb.z1 + 5) || l.x > 100), name + ': lights inside the map');
}
// 10. graphics presets are ordered: low <= medium <= high on every cost
{
  const r = src('render.js'), m = r.match(/export const GFX = \{([\s\S]*?)\n\};/);
  ok(m, 'GFX presets exist');
  const P = {};
  for (const q of ['low', 'medium', 'high']) {
    const line = m[1].match(new RegExp(q + ': \\{([^}]*)\\}'))[1];
    P[q] = { tex: +line.match(/tex: (\d+)/)[1], sm: +line.match(/shadowMap: (\d+)/)[1], r: +line.match(/ratio: \[([\d.]+)/)[1] };
  }
  ok(P.low.tex <= P.medium.tex && P.medium.tex <= P.high.tex && P.low.sm <= P.medium.sm && P.medium.sm <= P.high.sm && P.low.r <= P.medium.r && P.medium.r <= P.high.r, 'graphics presets get steadily more expensive');
  ok(/data-v="medium"/.test(fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8')), 'Medium is selectable in the menu');
}
if (fails.length) { for (const f of fails) console.log('FAIL ' + f); console.log(n + ' passed, ' + fails.length + ' failed'); process.exit(1); }
console.log(n + ' visual checks passed');
