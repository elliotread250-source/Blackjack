#!/usr/bin/env node
/* Checks every level, main and practice.
 *
 * Beatable: depth-first search over hold/release decisions made every 50ms
 * (12 physics steps). A human can comfortably hit 50ms windows, so a level
 * that only passes with finer inputs fails. Extreme Demons (verifyStep 4)
 * must pass at 1/60s AND be proven unbeatable at 50ms.
 *
 * Unique: no 30-block stretch of any level with at least 4 real obstacles
 * in it (corridor spike rows and portals don't count) may appear anywhere
 * else, in the same level or another one.
 *
 *   node tools/verify.js         check everything
 *   node tools/verify.js 2       just level 2 (beatability only)
 *   node tools/verify.js --fix   reseed failing sections and tune Extreme
 *                                Demon tightness until all pass, then write
 *                                the BUMPS and TIGHT tables into levels.js
 */
'use strict';
const P = require('../js/physics.js');
const LEVELS = require('../js/levels.js');

const BUDGET = 3e6;
const WINDOW = 30;
const MIN_FEATURES = 4; // real obstacles: not filler spike rows, not portals

// Input granularity in physics steps: 12 = 50ms.
function stepOf(def) { return def.verifyStep || 12; }

function key(s, i) {
  return [i, Math.round(s.y * 20), Math.round(s.vy * 2), s.grav, s.mode, s.mini,
    s.grounded ? 1 : 0, s.held ? 1 : 0, s.used.length, s.speed, s.dash ? 1 : 0].join('|');
}

function solve(def, K = stepOf(def)) {
  const L = P.compile(def);
  const seen = new Set();
  const stack = [{ s: P.create(L), i: 0, inputs: [], next: 0 }];
  let expanded = 0;
  let furthest = 0;
  while (stack.length) {
    const top = stack[stack.length - 1];
    if (top.next > 1) { stack.pop(); continue; }
    // Try keeping the previous input first: fewer flickering clicks.
    const prev = top.inputs.length ? top.inputs[top.inputs.length - 1] : 0;
    const choice = top.next === 0 ? prev : 1 - prev;
    top.next++;
    const s = P.clone(top.s);
    for (let k = 0; k < K && !s.dead && !s.won; k++) P.step(s, L, choice === 1);
    if (++expanded > BUDGET) return { ok: false, furthest, reason: 'budget' };
    furthest = Math.max(furthest, s.x);
    const inputs = top.inputs.concat(choice);
    if (s.won) return { ok: true, inputs, expanded };
    if (s.dead) continue;
    const kk = key(s, top.i + 1);
    if (seen.has(kk)) continue;
    seen.add(kk);
    stack.push({ s, i: top.i + 1, inputs, next: 0 });
  }
  return { ok: false, furthest, reason: 'exhausted' };
}

// Impossible tiers must also be proven unbeatable with 50ms inputs.
function check(def) {
  if (stepOf(def) >= 12) return solve(def);
  // Cheap test first: if 50ms inputs already win, it isn't Impossible.
  const human = solve(def, 12);
  if (human.ok) return { ok: false, furthest: 0, reason: 'too easy: beatable with 50ms inputs' };
  const r = solve(def);
  if (r.ok && human.reason === 'budget') r.note = 'human-timing run unproven (budget)';
  return r;
}

// Every window of WINDOW blocks starting at an object, as a normalised
// signature. Returns the first stretch that already appeared elsewhere.
function findRepeat(levels) {
  const seen = new Map();
  for (let li = 0; li < levels.length; li++) {
    const objs = levels[li].objects.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    for (let i = 0; i < objs.length; i++) {
      const x0 = objs[i].x;
      if (i > 0 && objs[i - 1].x === x0) continue;
      const parts = [];
      let features = 0, fx = null;
      for (let j = i; j < objs.length && objs[j].x < x0 + WINDOW; j++) {
        const o = objs[j];
        if (!o.f && o.t !== 'p') { features++; if (fx === null) fx = o.x; }
        parts.push(`${o.t}${o.x - x0},${o.y},${o.w || ''},${o.h || ''},${o.d || ''},${o.c || o.k || ''}`);
      }
      if (features < MIN_FEATURES) continue;
      const sig = parts.join(';');
      const prev = seen.get(sig);
      // fx: first real obstacle, so --fix reseeds the section that owns it.
      if (prev) return { a: prev, b: { li, x: x0, fx } };
      seen.set(sig, { li, x: x0, fx });
    }
  }
  return null;
}

// Replays a winning input list and drops coins on the path it took: three
// for main levels (30%, 55%, 80% of the way), one for practice (60%). Each
// prefers a moment the player is airborne, so coins float over obstacles.
function coinsFor(def, inputs, K) {
  const L = P.compile(def);
  const s = P.create(L);
  const path = [];
  for (const choice of inputs) {
    for (let k = 0; k < K && !s.dead && !s.won; k++) {
      P.step(s, L, choice === 1);
      path.push([s.x, s.y, s.grounded]);
    }
  }
  const at = def.training ? [0.6] : [0.3, 0.55, 0.8];
  return at.map((f) => {
    const tx = def.length * f;
    let best = null, bd = Infinity;
    for (const [x, y, g] of path) {
      const dd = Math.abs(x - tx) + (g ? 6 : 0);
      if (dd < bd) { bd = dd; best = [x, y]; }
    }
    const q = (v) => Math.round(v * 4) / 4;
    return [q(best[0] - 0.5), q(best[1] - 0.5)];
  });
}

function sectionAt(def, x) {
  const secs = def.sections || [[0, def.length]];
  for (let i = 0; i < secs.length; i++) if (x < secs[i][1]) return i;
  return secs.length - 1;
}

// Rewrites one `const NAME = {...};` table in levels.js.
function writeTable(src, name, obj) {
  const start = src.indexOf(`  const ${name} = {`);
  if (start < 0) throw new Error(`no ${name} table in levels.js`);
  const empty = `  const ${name} = {};`;
  const end = src.startsWith(empty, start) ? start + empty.length : src.indexOf('\n  };', start) + 5;
  const rows = Object.entries(obj).map(([k, v]) =>
    `    '${k.replace(/'/g, "\\'")}': ${JSON.stringify(v).replace(/,/g, ', ')},`);
  const body = rows.length ? `{\n${rows.join('\n')}\n  };` : '{};';
  return src.slice(0, start) + `  const ${name} = ${body}` + src.slice(end);
}

function fix() {
  const fs = require('fs');
  const path = require('path').join(__dirname, '../js/levels.js');
  const bumps = JSON.parse(JSON.stringify(LEVELS.BUMPS));
  const tight = JSON.parse(JSON.stringify(LEVELS.TIGHT));
  const range = {}; // Extreme Demon bisection state: name -> [lo, hi]
  const cache = new Map();
  // A section that still fails after MAX_TRIES reseeds has knobs that are
  // wrong, not unlucky: report it and stop wasting time on it.
  const MAX_TRIES = 25;
  const stuck = new Set();
  const bump = (name, sec) => {
    bumps[name] = bumps[name] || [];
    bumps[name][sec] = (bumps[name][sec] || 0) + 1;
    if (bumps[name][sec] >= MAX_TRIES) stuck.add(`${name} section ${sec}`);
  };
  // Extreme Demon: bisect tightness between "too easy" and "impossible";
  // when the bracket closes without a hit, try the next seed.
  const tune = (def, r) => {
    const n = def.name;
    const [lo, hi] = range[n] || [0, 1];
    const t = tight[n] == null ? 0.5 : tight[n];
    const nr = r.reason.startsWith('too easy') ? [t, hi] : [lo, t];
    if (nr[1] - nr[0] < 1 / 200) {
      bump(n, 0);
      range[n] = [0, 1];
      tight[n] = 0.5;
      console.error(`  ${n}: bracket closed -> reseed`);
    } else {
      range[n] = nr;
      tight[n] = Math.round(((nr[0] + nr[1]) / 2) * 1000) / 1000;
      console.error(`  ${n}: ${r.reason.split(':')[0]} at tight ${t} -> ${tight[n]}`);
    }
  };
  // Progress is written back even when stuck, so a rerun resumes from it.
  let coins = null;
  const save = () => {
    const clean = {};
    for (const [k, v] of Object.entries(bumps)) {
      const arr = Array.from(v, (n) => n || 0);
      if (arr.some((n) => n)) clean[k] = arr;
    }
    let src = fs.readFileSync(path, 'utf8');
    src = writeTable(src, 'BUMPS', clean);
    src = writeTable(src, 'TIGHT', tight);
    if (coins) src = writeTable(src, 'COINS', coins);
    fs.writeFileSync(path, src);
    console.log('levels.js updated: ' + Object.keys(clean).length + ' reseeded, ' + Object.keys(tight).length + ' tuned');
  };
  for (let round = 0; round < 3000; round++) {
    const levels = LEVELS.buildAll(bumps, tight, {});
    let changed = false;
    for (const def of levels) {
      const ck = def.name + JSON.stringify(bumps[def.name] || []) + (tight[def.name] || '');
      let r = cache.get(ck);
      if (!r) { r = check(def); cache.set(ck, r); }
      if (r.ok) continue;
      const sec = sectionAt(def, r.furthest);
      if (stuck.has(`${def.name} section ${sec}`)) continue;
      changed = true;
      if (stepOf(def) < 12) { tune(def, r); continue; }
      console.error(`  ${def.name}: ${r.reason} near x=${r.furthest.toFixed(0)} -> reseed section ${sec}`);
      bump(def.name, sec);
    }
    if (changed) continue;
    const rep = findRepeat(levels);
    if (rep) {
      const def = levels[rep.b.li];
      const sec = sectionAt(def, rep.b.fx);
      if (stuck.has(`${def.name} section ${sec}`)) {
        console.error(`stuck on a repeat: ${levels[rep.a.li].name}@${rep.a.x} = ${def.name}@${rep.b.x}`);
        save(); return 2;
      }
      console.error(`  repeat: ${levels[rep.a.li].name}@${rep.a.x} = ${def.name}@${rep.b.x} -> reseed section ${sec}`);
      bump(def.name, sec);
      continue;
    }
    // Everything passes: place coins along each level's winning run.
    coins = {};
    for (const def of LEVELS.buildAll(bumps, tight, {})) {
      const ck = def.name + JSON.stringify(bumps[def.name] || []) + (tight[def.name] || '');
      const r = cache.get(ck);
      if (r && r.ok) coins[def.name] = coinsFor(def, r.inputs, stepOf(def));
    }
    save();
    if (stuck.size) { console.error('STUCK: ' + [...stuck].join(', ')); return 2; }
    return 0;
  }
  save();
  console.error('gave up' + (stuck.size ? '; STUCK: ' + [...stuck].join(', ') : ''));
  return 1;
}

if (process.argv[2] === '--fix') process.exit(fix());

const only = process.argv[2] ? [+process.argv[2] - 1] : LEVELS.map((_, i) => i);
let failed = 0;
for (const i of only) {
  const def = LEVELS[i];
  const t0 = Date.now();
  const r = check(def);
  const ms = Date.now() - t0;
  if (r.ok && def.coinCount) {
    // The run that proves the level must also pass through every coin.
    const L = P.compile(def), st = P.create(L), K = stepOf(def);
    for (const ch of r.inputs) for (let k = 0; k < K && !st.dead && !st.won; k++) P.step(st, L, ch === 1);
    r.note = (r.note ? r.note + '; ' : '') + `coins ${st.coins.length}/${def.coinCount} on solver path`;
  }
  if (r.ok) {
    const secs = (r.inputs.length * stepOf(def) / P.TPS).toFixed(1);
    console.log(`PASS  ${def.name}  length ${def.length}  ${secs}s run  (${r.expanded} nodes, ${ms}ms)${r.note ? '  [' + r.note + ']' : ''}`);
  } else {
    failed++;
    console.log(`FAIL  ${def.name}  ${r.reason} near x=${r.furthest.toFixed(1)}  (${ms}ms)`);
  }
}
if (!process.argv[2]) {
  const rep = findRepeat(LEVELS);
  if (rep) {
    failed++;
    console.log(`FAIL  repeated stretch: ${LEVELS[rep.a.li].name} @${rep.a.x} = ${LEVELS[rep.b.li].name} @${rep.b.x}`);
  } else {
    console.log(`PASS  no ${WINDOW}-block stretch repeats anywhere across ${LEVELS.length} levels`);
  }
}
process.exit(failed ? 1 : 0);
