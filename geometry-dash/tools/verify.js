#!/usr/bin/env node
/* Proves each built-in level can be beaten.
 *
 * Depth-first search over hold/release decisions made every 50ms (12 physics
 * steps). A human can comfortably hit 50ms windows, so a level that only
 * passes with finer inputs fails here. Visited states are bucketed so the
 * search stays fast on long levels.
 *
 *   node tools/verify.js          all levels
 *   node tools/verify.js 2        just level 2
 */
'use strict';
const P = require('../js/physics.js');
const LEVELS = require('../js/levels.js');

const BUDGET = 3e6;

// Input granularity in physics steps: 12 = 50ms. A level can ask for a finer
// check (verifyStep) when it's meant to be beyond human timing.
function stepOf(def) { return def.verifyStep || 12; }

function key(s, i) {
  return [i, Math.round(s.y * 20), Math.round(s.vy * 2), s.grav, s.mode, s.mini,
    s.grounded ? 1 : 0, s.held ? 1 : 0, s.used.length, s.speed].join('|');
}

function solve(def) {
  const K = stepOf(def);
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

// Levels checked at finer-than-human timing must also be proven unbeatable
// at 50ms; otherwise they aren't the "Impossible" they claim to be.
function check(def) {
  const r = solve(def);
  if (!r.ok || stepOf(def) >= 12) return r;
  const human = solve(Object.assign({}, def, { verifyStep: 12 }));
  if (human.ok) return { ok: false, furthest: def.length, reason: 'too easy: beatable with 50ms inputs' };
  if (human.reason === 'budget') r.note = 'human-timing run unproven (budget)';
  return r;
}

// --seeds [mode]: for each practice tier, search seeds 1..60 and print the first that passes.
if (process.argv[2] === '--seeds') {
  const out = {};
  for (const def of LEVELS.filter((d) => d.training && (!process.argv[3] || d.mode === process.argv[3]))) {
    out[def.mode] = out[def.mode] || [];
    let seed = 0;
    for (let k = 1; k <= 60; k++) {
      if (check(LEVELS.buildTraining(def.mode, def.tier, k)).ok) { seed = k; break; }
    }
    out[def.mode][def.tier] = seed;
    console.log(def.name, seed || 'NONE');
  }
  console.log(JSON.stringify(out));
  process.exit(0);
}

const only = process.argv[2] ? [+process.argv[2] - 1] : LEVELS.map((_, i) => i);
let failed = 0;
for (const i of only) {
  const def = LEVELS[i];
  const t0 = Date.now();
  const r = check(def);
  const ms = Date.now() - t0;
  if (r.ok) {
    const secs = (r.inputs.length * stepOf(def) / P.TPS).toFixed(1);
    console.log(`PASS  ${def.name}  length ${def.length}  ${secs}s run  (${r.expanded} nodes, ${ms}ms)${r.note ? '  [' + r.note + ']' : ''}`);
  } else {
    failed++;
    console.log(`FAIL  ${def.name}  stuck near x=${r.furthest.toFixed(1)}  (${r.reason}, ${ms}ms)`);
  }
}
process.exit(failed ? 1 : 0);
