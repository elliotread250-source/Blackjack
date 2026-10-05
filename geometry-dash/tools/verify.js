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

const K = 12;
const BUDGET = 3e6;

function key(s, i) {
  return [i, Math.round(s.y * 20), Math.round(s.vy * 2), s.grav, s.mode, s.mini,
    s.grounded ? 1 : 0, s.held ? 1 : 0, s.used.length, s.speed].join('|');
}

function solve(def) {
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

const only = process.argv[2] ? [+process.argv[2] - 1] : LEVELS.map((_, i) => i);
let failed = 0;
for (const i of only) {
  const def = LEVELS[i];
  const t0 = Date.now();
  const r = solve(def);
  const ms = Date.now() - t0;
  if (r.ok) {
    const secs = (r.inputs.length * K / P.TPS).toFixed(1);
    console.log(`PASS  ${def.name}  length ${def.length}  ${secs}s run  (${r.expanded} nodes, ${ms}ms)`);
  } else {
    failed++;
    console.log(`FAIL  ${def.name}  stuck near x=${r.furthest.toFixed(1)}  (${r.reason}, ${ms}ms)`);
  }
}
process.exit(failed ? 1 : 0);
