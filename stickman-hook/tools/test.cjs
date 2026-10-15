#!/usr/bin/env node
/* Unit tests for the gameplay physics and level data.  node tools/test.cjs */
'use strict';
const path = require('path');
const assert = require('assert');
const P = require(path.join(__dirname, '..', 'js', 'physics.js'));
const LEVELS = require(path.join(__dirname, '..', 'js', 'levels.js')).LEVELS;
const C = P.C;

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); }
}
function near(a, b, tol, msg) { assert.ok(Math.abs(a - b) <= tol, (msg || '') + ` expected ${b} +- ${tol}, got ${a}`); }

// A sim hanging from a single fixed hook at (0, -1000).
function pendulum(opts, angle, len) {
  const s = P.createSim({ hooks: [[0, -1000]], finish: [50000, 50000] }, opts);
  s.state = 'play'; s.hook = 0; s.rope = len || 250;
  s.x = Math.sin(angle) * s.rope; s.y = -1000 + Math.cos(angle) * s.rope;
  s.vx = 0; s.vy = 0;
  return s;
}

test('rope keeps its length while swinging (fixed and moving hooks)', () => {
  const s = pendulum({}, 1.2, 260);
  for (let i = 0; i < 120 * 15; i++) {
    P.step(s, true);
    near(Math.hypot(s.x, s.y + 1000), 260, 1e-6, 'fixed hook rope length');
  }
  const m = P.createSim({ hooks: [[0, -1000, { ax: 150, ay: 80, per: 2 }]], finish: [50000, 50000] });
  m.state = 'play'; m.hook = 0; m.rope = 200;
  const hp = P.hookPos(m, 0); m.x = hp[0] + 200; m.y = hp[1];
  for (let i = 0; i < 120 * 10; i++) {
    P.step(m, true);
    const h = P.hookPos(m, 0);
    near(Math.hypot(m.x - h[0], m.y - h[1]), 200, 1e-6, 'moving hook rope length');
  }
});

test('energy is conserved in an unassisted swing (< 1% drift over 20 s)', () => {
  const s = pendulum({ assist: 0 }, Math.PI / 2, 250);
  const e0 = P.energy(s);
  let lo = e0, hi = e0;
  for (let i = 0; i < 120 * 20; i++) { P.step(s, true); const e = P.energy(s); lo = Math.min(lo, e); hi = Math.max(hi, e); }
  const scale = C.G * 250; // potential energy of one rope length
  assert.ok((hi - lo) / scale < 0.01, `drift ${((hi - lo) / scale * 100).toFixed(2)}%`);
  // and it actually swings to the other side and back
});

test('swing reaches the same height on the other side (no assist)', () => {
  const s = pendulum({ assist: 0 }, 1.0, 250);
  const y0 = s.y; let minY = Infinity, crossed = false;
  for (let i = 0; i < 240; i++) { P.step(s, true); if (s.x < 0) { crossed = true; minY = Math.min(minY, s.y); } }
  assert.ok(crossed, 'swung through the bottom');
  near(minY, y0, 2, 'turning height');
});

test('swing assist builds speed while holding, capped', () => {
  const s = pendulum({}, 0.3, 250);
  let maxSp = 0;
  for (let i = 0; i < 120 * 12; i++) { P.step(s, true); maxSp = Math.max(maxSp, Math.hypot(s.vx, s.vy)); }
  assert.ok(maxSp > 1500, 'built up to full loops, max ' + maxSp.toFixed(0));
  assert.ok(maxSp <= C.MAX_SPEED + 1e-6, 'never above MAX_SPEED');
});

test('release conserves momentum exactly at the moment of letting go', () => {
  const s = pendulum({}, 1.0, 250);
  for (let i = 0; i < 70; i++) P.step(s, true);
  const vx = s.vx, vy = s.vy, x = s.x, y = s.y;
  P.step(s, false);
  const ev = s.events.find(e => e.type === 'release');
  assert.ok(ev, 'release event');
  near(ev.vx, vx, 1e-9); near(ev.vy, vy, 1e-9);
  assert.strictEqual(s.hook, -1);
  // one free step later: only gravity changed the velocity
  near(s.vx, vx, 1e-9, 'vx after release');
  near(s.vy, vy + C.G * C.STEP, 1e-6, 'vy after release');
  near(s.x, x + vx * C.STEP, 0.2, 'x after release');
});

test('ballistic flight after release follows a parabola', () => {
  const s = P.createSim({ hooks: [], finish: [50000, 50000] });
  s.state = 'play'; s.x = 0; s.y = -5000; s.vx = 600; s.vy = -900;
  for (let i = 0; i < 120; i++) P.step(s, false);
  near(s.x, 600, 1e-6); near(s.y, -5000 - 900 + 0.5 * C.G, 6);
});

test('grabbing picks the hook in reach, preferring hooks in front', () => {
  const s = P.createSim({ hooks: [[-200, 0], [250, 0], [2000, 0]], finish: [50000, 50000] });
  s.state = 'play'; s.x = 0; s.y = 100; s.vx = 300; s.vy = 0;
  assert.strictEqual(P.candidateHook(s), 1, 'front hook');
  s.vx = -300;
  assert.strictEqual(P.candidateHook(s), 0, 'moving left: left hook is in front');
  s.x = 1200; s.vx = 300;
  assert.strictEqual(P.candidateHook(s), -1, 'nothing in reach');
  s.x = 0; s.vx = 300;
  P.step(s, true);
  assert.strictEqual(s.hook, 1);
  assert.ok(s.events.some(e => e.type === 'grab'));
});

test('bounce pads launch you at least at their power', () => {
  const s = P.createSim({ hooks: [], pads: [[0, 0, 200, 0, 1500]], finish: [50000, 50000] });
  s.state = 'play'; s.x = 0; s.y = -200; s.vx = 100; s.vy = 0;
  let bounced = false;
  for (let i = 0; i < 120 && !bounced; i++) {
    P.step(s, false);
    if (s.events.some(e => e.type === 'boing')) bounced = true;
    s.events.length = 0;
  }
  assert.ok(bounced, 'hit the pad');
  near(s.vy, -1500 + C.G * C.STEP / 2, 25, 'upward launch');
  near(s.vx, 100, 1e-6, 'tangential speed kept');
  // angled pad pushes forward
  const a = P.createSim({ hooks: [], pads: [[0, 0, 200, 30, 1600]], finish: [50000, 50000] });
  a.state = 'play'; a.x = 0; a.y = -150; a.vx = 0; a.vy = 0;
  for (let i = 0; i < 120; i++) P.step(a, false);
  assert.ok(a.vx > 600, 'angled pad sends you forward, vx ' + a.vx.toFixed(0));
});

test('bouncy walls reflect, solid walls absorb', () => {
  const b = P.createSim({ hooks: [], blocks: [[100, -6000, 50, 2000, 'bouncy']], finish: [50000, 50000] });
  b.state = 'play'; b.x = 0; b.y = -5000; b.vx = 900; b.vy = 0;
  for (let i = 0; i < 30; i++) P.step(b, false);
  assert.ok(b.vx < -800, 'bounced back, vx ' + b.vx.toFixed(0));
  const s = P.createSim({ hooks: [], blocks: [[100, -6000, 50, 2000, 'solid']], finish: [50000, 50000] });
  s.state = 'play'; s.x = 0; s.y = -5000; s.vx = 900; s.vy = 0;
  for (let i = 0; i < 30; i++) P.step(s, false);
  assert.ok(s.vx < 0 && s.vx > -400, 'solid wall: weak rebound, vx ' + s.vx.toFixed(0));
  assert.ok(s.x < 100 - C.PLAYER_R + 1, 'stays outside the wall');
});

test('falling off the bottom ends the run (and a fresh sim restarts from the start)', () => {
  const s = P.createSim(LEVELS[0]);
  P.step(s, false);
  assert.strictEqual(s.state, 'ready', 'waits for the first press');
  P.start(s); s.hook = -1; s.vx = 0;
  s.x = 300; s.y = s.lv.deathY - 50; s.vy = 300;
  let n = 0;
  while (s.state === 'play' && n++ < 240) P.step(s, false);
  assert.strictEqual(s.state, 'dead');
  assert.ok(s.events.some(e => e.type === 'fall'));
  const r = P.createSim(LEVELS[0]);
  near(r.x, r.lv.start[0], 1e-9); assert.strictEqual(r.state, 'ready'); assert.strictEqual(r.t, 0);
});

test('getting stuck off the rope counts as a fall', () => {
  const s = P.createSim({ hooks: [], blocks: [[-500, 0, 1000, 100, 'solid']], finish: [50000, 50000] });
  s.state = 'play'; s.x = 0; s.y = -18; s.vx = 0; s.vy = 0;
  let n = 0;
  while (s.state === 'play' && n++ < 120 * 3) P.step(s, false);
  assert.strictEqual(s.state, 'dead'); assert.strictEqual(s.deadReason, 'stuck');
});

test('finish: reaching the podium wins, missing it does not', () => {
  const s = P.createSim(LEVELS[0]);
  P.start(s);
  const f = s.lv.finish;
  s.x = f.x + f.w / 2; s.y = f.y - 60; s.vx = 0; s.vy = 0;
  P.step(s, false);
  assert.strictEqual(s.state, 'won');
  assert.ok(s.events.some(e => e.type === 'finish'));
  const m = P.createSim(LEVELS[0]);
  P.start(m); m.x = f.x - 200; m.y = f.y - 60; m.vx = 0; m.vy = 0;
  P.step(m, false);
  assert.strictEqual(m.state, 'play');
});

test('determinism: same inputs give bit-identical results', () => {
  const plan = [[0, 80], [130, 260], [300, 420]];
  const a = P.replay(LEVELS[16], plan, 1500), b = P.replay(LEVELS[16], plan, 1500);
  assert.strictEqual(a.x, b.x); assert.strictEqual(a.y, b.y);
  assert.strictEqual(a.vx, b.vx); assert.strictEqual(a.steps, b.steps);
  // stepping one sim vs. a clone made midway
  const s = P.createSim(LEVELS[12]); P.step(s, true);
  for (let i = 0; i < 100; i++) P.step(s, i < 60);
  const c = P.cloneSim(s);
  for (let i = 0; i < 300; i++) { P.step(s, i % 90 < 50); P.step(c, i % 90 < 50); }
  assert.strictEqual(s.x, c.x); assert.strictEqual(s.vy, c.vy);
});

test('level data is well formed', () => {
  assert.ok(LEVELS.length >= 30, 'at least 30 levels');
  LEVELS.forEach((L, i) => {
    const lv = P.compile(L);
    assert.ok(L.name, 'level ' + (i + 1) + ' name');
    assert.ok(lv.hooks.length >= 2, 'level ' + (i + 1) + ' hooks');
    assert.ok(lv.finish.x > lv.start[0] + 500, 'level ' + (i + 1) + ' finish to the right');
    const s = P.createSim(lv); P.start(s);
    assert.ok(P.candidateHook(s) >= 0, 'level ' + (i + 1) + ': first hook in reach of the start');
    assert.ok(L.par > 0, 'level ' + (i + 1) + ' has a par time');
  });
});

test('solver solutions (tools/solutions.json) still finish every level', () => {
  let sol;
  try { sol = require(path.join(__dirname, 'solutions.json')); } catch (e) { throw new Error('run node tools/solve.cjs --json first'); }
  LEVELS.forEach((L, i) => {
    const s = sol[i + 1];
    assert.ok(s, 'solution for level ' + (i + 1));
    const r = P.replay(L, s.plan, 120 * 120);
    assert.strictEqual(r.state, 'won', 'level ' + (i + 1) + ' replay');
    assert.ok(r.t <= L.par + 1e-9, 'level ' + (i + 1) + ' par is beatable');
  });
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exitCode = fail ? 1 : 0;
