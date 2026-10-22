#!/usr/bin/env node
/* Rules tests for Nosy Neighbour (no dependencies, no three.js).  node tools/test.cjs */
'use strict';
const path = require('path');
const assert = require('assert');
const J = f => require(path.join(__dirname, '..', 'js', f));
const G = J('geom.js');
const LV = J('level.js');
const N = J('nav.js');
const PC = J('perception.js');
const AI = J('ai.js');
const LR = J('learning.js');
const PZ = J('puzzle.js');
const W = J('world.js');

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e)); }
}
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b} +- ${tol}, got ${a}`);

const level = LV.buildLevel();
const baseDoor = LV.doorBoxes(level.doors.find(d => d.id === 'basement')).closed;
const nav = N.buildGrid(level.boxes, { bounds: level.navBounds, radius: 0.3, clear: 1.9, extra: [baseDoor] });
const comps = N.components(nav);
const mainComp = comps.comp[N.findNode(nav, 8.3, 0, -18.9)];
const newWorld = (o = {}) => new W.World(Object.assign({ level, nav, seed: 7 }, o));
// run the world with a fixed input for t seconds
function run(w, secs, inp = {}, each) {
  const dt = 1 / 60;
  for (let i = 0; i < secs * 60; i++) {
    const frame = typeof inp === 'function' ? inp(i * dt) : inp;
    w.step(dt, frame);
    if (each && each(w) === true) return true;
    w.events.length = 0;
  }
  return false;
}
function put(w, x, y, z, yaw = 0) { Object.assign(w.player, { x, y, z, yaw, vx: 0, vy: 0, vz: 0, onGround: true, fallFrom: y }); }
function quietAI(w) { w.ai.teleport({ x: 20, y: 0, z: -50 }); w.ai.setState('patrol'); w.ai.poi = { id: 'x', x: 20, y: 0, z: -50, look: 0, dur: 1e9, anim: 'idle' }; w.ai.poiT = 1e9; w.ai.path = []; w.ai.pathI = 0; }

console.log('geometry');
test('ray/box slab test and spatial hash raycast', () => {
  const b = G.makeBox(1, 0, -1, 2, 2, 1);
  near(G.rayBox(0, 1, 0, 1, 0, 0, b, 10), 1, 1e-9);
  assert.strictEqual(G.rayBox(0, 3, 0, 1, 0, 0, b, 10), -1);
  const h = new G.SpatialHash(2); h.insert(b); h.insert(G.makeBox(10, 0, 10, 11, 1, 11));
  const hit = h.raycast(-5, 1, 0, 20, 0, 0);
  assert.ok(hit && hit.box === b); near(hit.t * 20, 6, 1e-6);
  assert.strictEqual(h.raycast(-5, 1, 5, 20, 0, 0), null);
});

console.log('level');
test('every opening is 1.3 m wide on a 0.5 m grid line, items sit in free space', () => {
  for (const d of level.doors) { near(d.w, 1.3, 1e-9); near((d.c * 2) % 1, 0, 1e-9, d.id); }
  for (const w of level.windows) { near(w.w, 1.3, 1e-9); near((w.c * 2) % 1, 0, 1e-9, w.id); }
  const h = new G.SpatialHash(2); for (const b of level.boxes) if (b.col) h.insert(b);
  const out = [];
  for (const it of level.items) {
    const def = LV.ITEM_TYPES[it.type];
    const bb = G.makeBox(it.x - def.size[0] / 2 + 0.01, it.y + 0.01, it.z - def.size[2] / 2 + 0.01, it.x + def.size[0] / 2 - 0.01, it.y + def.size[1], it.z + def.size[2] / 2 - 0.01);
    h.query(bb.x0, bb.z0, bb.x1, bb.z1, out);
    const bad = out.find(o => G.boxesOverlap(bb, o));
    assert.ok(!bad, `${it.id} overlaps a solid at ${[bad && bad.x0, bad && bad.y0, bad && bad.z0]}`);
  }
});

console.log('navigation');
test('one connected walkable graph: all routine points, hiding spots and floors (stairs connect)', () => {
  for (const p of level.pois) { const n = N.findNode(nav, p.x, p.y, p.z, 1); assert.ok(n >= 0 && comps.comp[n] === mainComp, 'poi ' + p.id); }
  for (const h of level.hides) { const n = N.findNode(nav, h.face[0], h.y, h.face[1], 1); assert.ok(n >= 0 && comps.comp[n] === mainComp, 'hide ' + h.id); }
  for (const d of level.doors) {
    if (d.id === 'basement' || d.id === 'home') continue;
    const m = (d.t0 + d.t1) / 2;
    for (const s of [-0.8, 0.8]) {
      const [x, z] = d.axis === 'z' ? [m + s, d.c] : [d.c, m + s];
      const n = N.findNode(nav, x, d.y, z, 1);
      assert.ok(n >= 0 && comps.comp[n] === mainComp, `door ${d.id} side ${s}`);
    }
  }
  // every floor cell of the neighbour's property (ground, upper floor, attic) is in the same component
  const floors = [0, 0.15, LV.F1, LV.F2];
  let total = 0, inMain = 0; const stray = [];
  for (let col = 0; col < nav.nx * nav.nz; col++) {
    for (let l = 0; l < nav.count[col]; l++) {
      const id = col * N.MAX_L + l, [x, h, z] = N.nodePos(nav, id);
      if (!floors.some(f => Math.abs(h - f) < 0.01)) continue;
      if (h > 1 && !(x > -10 && x < 10 && z > -28 && z < -12)) continue;  // roofs aren't floors
      if (x > 10.2 && x < 12.8 && z > -27.4 && z < -21.2) continue; // behind the basement door
      if (z > -6.4 || x < -26 || x > 26) continue;                  // outside the yard
      total++;
      if (comps.comp[id] === mainComp) inMain++; else if (stray.length < 6) stray.push([x, h, z].join(','));
    }
  }
  assert.ok(inMain / total > 0.995, `floor cells connected ${inMain}/${total}, stray e.g. ${stray.join(' ')}`);
});
test('A* paths between every pair of routine points, across all three floors', () => {
  const astar = N.makePather(nav);
  for (const a of level.pois) for (const b of level.pois) {
    if (a === b) continue;
    const r = astar(N.findNode(nav, a.x, a.y, a.z), N.findNode(nav, b.x, b.y, b.z));
    assert.ok(r && r.complete, `${a.id} -> ${b.id}`);
  }
  const r = astar(N.findNode(nav, 8.3, 0, -18.9), N.findNode(nav, -1.2, LV.F2, -22.4));
  const ys = r.path.map(id => nav.h[id]);
  assert.ok(Math.max(...ys) > 6.3 && ys.some(y => y > 1 && y < 3), 'climbs the stairs');
  for (let i = 1; i < ys.length; i++) assert.ok(Math.abs(ys[i] - ys[i - 1]) <= N.STEP + 1e-6, 'no step taller than a stair');
});
test('he cannot walk through the basement door, into windows or onto furniture', () => {
  const inside = N.findNode(nav, 11.6, 0, -24.5, 0);
  assert.ok(inside < 0 || comps.comp[inside] !== mainComp, 'basement is off limits');
  const table = N.findNode(nav, 5.6, 0.8, -16.4, 0);
  assert.ok(table < 0 || nav.h[table] < 0.1 || comps.comp[table] !== mainComp, 'kitchen table top is not walkable');
});

console.log('puzzle + reachability');
test('dependency graph has no cycles; the key needs at least 2 steps and the basement needs the key', () => {
  assert.ok(!PZ.hasCycle());
  const k = PZ.minSteps('redkey'); assert.ok(k.size >= 3, [...k].join(','));
  assert.ok(PZ.minSteps('basement').has('redkey'));
  for (const alt of PZ.GRAPH.study) {
    const steps = new Set(); for (const d of alt) for (const s of PZ.minSteps(d)) steps.add(s);
    assert.ok(steps.size >= 2, 'route ' + alt.join('+') + ' needs ' + [...steps].join(','));
  }
});
test('physical walk: the player can reach every puzzle item and the basement', () => {
  const r = PZ.solveLevel(level);
  assert.ok(r.reached, r.log.join(' | '));
  for (const id of ['crowbar', 'fuse', 'redkey', 'crateFront', 'crateBack', 'crateShed', 'cratePantry']) assert.ok(r.have.has(id), 'reached ' + id);
  for (const it of level.items) assert.ok(r.have.has(it.id), 'every item is reachable: ' + it.id);
  const iKey = r.log.indexOf('pick:redkey'), iBase = r.log.indexOf('key:basement');
  assert.ok(iKey >= 0 && iBase > iKey, 'basement opened after the key');
});
test('the red key is locked away until a route is solved (power route and window route both work)', () => {
  const power = PZ.solveLevel(level, { disable: ['break:studyEW', 'break:studyFW'] });
  assert.ok(power.reached && power.log.includes('power') && power.log.includes('boards:garageW') && power.log.indexOf('power') < power.log.indexOf('pick:redkey'), 'power route ' + power.log.join(' | '));
  const win = PZ.solveLevel(level, { disable: ['power'] });
  assert.ok(win.reached && win.log.some(s => s.startsWith('break:study')), 'window route');
  const none = PZ.solveLevel(level, { disable: ['power', 'break:studyEW', 'break:studyFW'] });
  assert.ok(!none.have.has('redkey') && !none.reached, 'no route, no key');
  const noCrowbar = PZ.solveLevel(level, { disable: ['item:crowbar', 'break:studyEW', 'break:studyFW'] });
  assert.ok(!noCrowbar.have.has('fuse'), 'the fuse needs the crowbar');
});
test('box-stack climbs: garage roof needs crates (1 on the woodpile, or a stack of 3)', () => {
  const noCrates = PZ.solveLevel(level, { disable: ['power', 'break:studyFW'], maxCrates: 0 });
  assert.ok(!noCrates.have.has('redkey'), 'no crates, no roof');
  const one = PZ.solveLevel(level, { disable: ['power', 'break:studyFW'], maxCrates: 1 });
  assert.ok(one.have.has('redkey') && one.log.includes('break:studyEW'), 'one crate on the woodpile reaches the roof');
  const shut = level.windows.map(LV.windowBox).concat(level.doors.filter(d => d.lock).map(d => LV.doorBoxes(d).closed));
  const g0 = N.buildGrid(level.boxes, { bounds: level.reachBounds, radius: 0.3, clear: 1.0, extra: shut });
  const roof = N.findNode(g0, 14, 3.2, -16, 0);
  assert.ok(roof >= 0 && Math.abs(g0.h[roof] - 3.2) < 0.05);
  const start = N.findNode(g0, level.spawn.x, 0, level.spawn.z);
  assert.ok(!N.playerReach(g0, start, 0).seen[roof], 'roof not reachable without crates');
  assert.ok(N.playerReach(g0, start, 1).seen[roof], 'one crate (on the woodpile) is enough');
  // without the woodpile it takes a stack of three
  const flat = level.boxes.filter(b => b.tag !== 'woodpile' && b.tag !== 'hedge');
  const g1 = N.buildGrid(flat, { bounds: level.reachBounds, radius: 0.3, clear: 1.0, extra: shut });
  const s1 = N.findNode(g1, level.spawn.x, 0, level.spawn.z), r1 = N.findNode(g1, 14, 3.2, -16, 0);
  assert.ok(!N.playerReach(g1, s1, 2).seen[r1], 'two crates on flat ground are not enough');
  assert.ok(N.playerReach(g1, s1, 3).seen[r1], 'three crates are');
  // the high bathroom window: sill 1.9 needs a crate
  const broken = level.windows.filter(w => w.id !== 'bathW').map(LV.windowBox).concat(level.doors.filter(d => d.lock).map(d => LV.doorBoxes(d).closed));
  const g2 = N.buildGrid(level.boxes, { bounds: level.reachBounds, radius: 0.3, clear: 1.0, extra: broken });
  const s2 = N.findNode(g2, level.spawn.x, 0, level.spawn.z), sill = N.findNode(g2, -8.5, 1.9, -28.1, 0);
  assert.ok(sill >= 0 && Math.abs(g2.h[sill] - 1.9) < 0.05, 'sill surface');
  const outside = N.findNode(g2, -8.5, 0, -28.8, 0);
  const climb = g2.h[sill] - g2.h[outside];
  assert.ok(climb > N.PLAYER_CLIMB && climb <= N.PLAYER_CLIMB + LV.CRATE, `from the yard the high window needs exactly one crate (climb ${climb.toFixed(2)})`);
  assert.ok(N.playerReach(g2, s2, 1).seen[sill], 'reachable');
  void s2;
});

console.log('perception');
const hash = new G.SpatialHash(2); for (const b of level.boxes) if (b.col || b.op) hash.insert(b);
const lit = (x, y, z) => PC.lightAt(level, x, y, z);
test('vision is blocked by walls but not by glass or open doorways', () => {
  const obs = { x: 6, y: AI.EYE, z: -17, yaw: Math.atan2(-(-6 - 6), -(-17 + 17)) };   // kitchen, looking west
  const tgt = { x: -6, y: 0, z: -17, height: 1.75, crouch: false, speed: 1, light: 1 };   // living room, behind 2 walls
  assert.strictEqual(PC.sightRate(hash, [], obs, tgt), 0, 'through walls');
  // living room window from the front yard: glass doesn't block
  const out = { x: -6, y: AI.EYE, z: -8, yaw: 0 };
  assert.ok(PC.sightRate(hash, [], out, { x: -6, y: 0, z: -14, height: 1.75, crouch: false, speed: 1, light: 0.8 }) > 0, 'through glass');
  // kitchen door open (no leaf in the dyn list) vs closed leaf
  const hallObs = { x: 0, y: AI.EYE, z: -14, yaw: -Math.PI / 2 };
  const kit = { x: 5, y: 0, z: -14, height: 1.75, crouch: false, speed: 1, light: 1 };
  assert.ok(PC.sightRate(hash, [], hallObs, kit) > 0, 'open doorway');
  const leaf = LV.doorBoxes(level.doors.find(d => d.id === 'kitchen')).closed;
  assert.strictEqual(PC.sightRate(hash, [leaf], hallObs, kit), 0, 'closed door');
});
test('crouching in shadow is much harder to spot than standing in light', () => {
  const obs = { x: -14, y: AI.EYE, z: -30, yaw: Math.PI };    // looking up the side passage toward the street
  const shadow = lit(-13, 1, -22.5), bright = lit(-6, 1, -16);
  assert.ok(shadow < 0.35 && bright > 0.6, `light levels ${shadow} ${bright}`);
  const standLit = PC.sightRate(hash, [], obs, { x: -14, y: 0, z: -40 + 30, height: 1.75, crouch: false, speed: 3, light: bright });
  const a = PC.sightRate(hash, [], obs, { x: -14.5, y: 0, z: -22, height: 1.75, crouch: false, speed: 3, light: 0.9 });
  const b = PC.sightRate(hash, [], obs, { x: -14.5, y: 0, z: -22, height: 1.0, crouch: true, speed: 1.5, light: shadow });
  assert.ok(a > 0 && b > 0 && b < a * 0.35, `stand-lit ${a.toFixed(2)} vs crouch-shadow ${b.toFixed(2)}`);
  void standLit;
  // behind him only counts when very close
  const back = { x: 0, y: AI.EYE, z: -40, yaw: 0 };
  assert.strictEqual(PC.sightRate(hash, [], back, { x: 0, y: 0, z: -36, height: 1.75, crouch: false, speed: 1, light: 1 }), 0);
  assert.ok(PC.sightRate(hash, [], back, { x: 0, y: 0, z: -39, height: 1.75, crouch: false, speed: 1, light: 1 }) > 0);
});
test('noise: sprinting carries, crouching is silent, glass is heard through walls, walls muffle', () => {
  const L = { x: 6, y: 1.6, z: -18 };
  const at = (x, z, r) => PC.hearNoise(hash, [], L, { x, y: 0, z, radius: r });
  assert.ok(at(6, -12.5 + 5.5 - 2, PC.NOISE.sprint) > 0 || at(6, -14, PC.NOISE.sprint) > 0, 'sprint nearby');
  assert.strictEqual(at(6, -15.5, PC.NOISE.crouch), 0, 'crouch at 2.5 m');
  assert.ok(at(-6, -16.5, PC.NOISE.glass) > 0, 'glass across the house');
  const open = PC.hearNoise(hash, [], { x: 0, y: 1.6, z: -40 }, { x: 0, y: 0, z: -46, radius: 8 });
  const walled = PC.hearNoise(hash, [], { x: 6, y: 1.6, z: -18 }, { x: 6, y: 0, z: -24.2, radius: 8 });
  assert.ok(open > walled, `open ${open.toFixed(2)} > through wall ${walled.toFixed(2)}`);
});

console.log('neighbour AI');
test('patrol: he works through his routine', () => {
  const w = newWorld(); w.player.x = 0; w.player.z = 15; // at home, out of sight
  const seen = new Set();
  run(w, 150, {}, ww => { if (ww.ai.arrived() && ww.ai.poi) seen.add(ww.ai.poi.id); });
  assert.ok(seen.size >= 3, 'visited ' + [...seen].join(','));
  assert.strictEqual(w.player.caught, null);
});
test('noise makes him suspicious and he goes to look', () => {
  const w = newWorld(); put(w, 0, 0, 15);
  w.ai.teleport({ x: 8.3, y: 0, z: -18.9 });
  w.noises.push({ x: 0, y: 0, z: -40, radius: 40, kind: 'glass', player: true });
  w.ai.update(1 / 60, w);
  assert.strictEqual(w.ai.state, 'suspicious');
  run(w, 30, {}, ww => Math.hypot(ww.ai.x - 0, ww.ai.z + 40) < 1.5);
  assert.ok(Math.hypot(w.ai.x, w.ai.z + 40) < 2, `reached the noise (${w.ai.x.toFixed(1)}, ${w.ai.z.toFixed(1)})`);
});
test('seeing you: suspicious, then chase; he follows you upstairs and catches you', () => {
  const w = newWorld();
  w.ai.teleport({ x: 5, y: 0, z: -14, look: Math.PI / 2 });   // kitchen, facing the hall door (west)
  w.ai.poi = { id: 'x', x: 5, y: 0, z: -14, look: Math.PI / 2, dur: 1e9, anim: 'idle' }; w.ai.poiT = 1e9; w.ai.path = []; w.ai.pathI = 0;
  put(w, -1, 0, -14);                                         // standing in the hall, in view
  w.doorById.kitchen.target = w.doorById.kitchen.angle = 1;
  let states = new Set();
  run(w, 2, {}, ww => { states.add(ww.ai.state); return ww.ai.state === 'chase'; });
  assert.ok(states.has('chase'), 'states ' + [...states]);
  // now you're up in the bedroom; he heads there (doors open for him)
  put(w, -6, LV.F1, -18); w.ai.setState('chase'); w.ai.lastKnown = [-6, LV.F1, -18];
  let caught = run(w, 40, {}, ww => !!ww.player.caught);
  assert.ok(caught, `caught upstairs (ai at ${w.ai.x.toFixed(1)},${w.ai.y.toFixed(1)},${w.ai.z.toFixed(1)} ${w.ai.state})`);
});
test('losing you: chase -> search -> patrol', () => {
  const w = newWorld();
  w.ai.teleport({ x: 0, y: 0, z: -40 }); put(w, 0, 0, 15);
  w.ai.setState('chase'); w.ai.lastKnown = [-8, 0, -36];
  const states = [];
  run(w, 40, {}, ww => { if (states[states.length - 1] !== ww.ai.state) states.push(ww.ai.state); return ww.ai.state === 'patrol' && states.includes('search'); });
  assert.deepStrictEqual(states.slice(0, 3), ['chase', 'search', 'patrol'], states.join('>'));
});
test('hiding in a wardrobe he saw you enter does not save you', () => {
  const w = newWorld();
  const h = w.hides.find(s => s.id === 'wardrobe');
  put(w, h.face[0], h.y, h.face[1] + 1);
  w.ai.teleport({ x: -6, y: LV.F1, z: -14, look: Math.PI });
  w.ai.setState('chase'); w.ai.lastKnown = [w.player.x, w.player.y, w.player.z];
  w.ai.seenT = 0; w.enterHide(h);
  const caught = run(w, 20, {}, ww => !!ww.player.caught);
  assert.ok(caught, 'he opened the wardrobe (' + w.ai.state + ')');
});

console.log('caught + learning');
test('getting caught: grab, wake up at home, carried items drop where you were caught', () => {
  const w = newWorld();
  put(w, -6, 0, -36);
  w.pickUp(w.propById.crowbar); w.pickUp(w.propById.fuse);
  assert.deepStrictEqual(w.player.inv.filter(Boolean).sort(), ['crowbar', 'fuse']);
  w.ai.teleport({ x: -6, y: 0, z: -35.4 });
  w.ai.setState('chase');
  run(w, 0.2);
  assert.ok(w.player.caught, 'grabbed');
  run(w, 3);
  const s = level.spawn, p = w.player;
  near(p.x, s.x, 0.01); near(p.z, s.z, 0.01);
  assert.strictEqual(p.caught, null); assert.deepStrictEqual(p.inv, [null, null, null, null]);
  for (const id of ['crowbar', 'fuse']) {
    const pr = w.propById[id];
    assert.ok(!pr.held && Math.hypot(pr.x + 6, pr.z + 36) < 1.5, `${id} dropped at the catch (${pr.x.toFixed(2)}, ${pr.z.toFixed(2)})`);
  }
  assert.strictEqual(w.stats.caught, 1);
  assert.strictEqual(w.ai.state, 'patrol');
  assert.strictEqual(w.learn.catches.length, 1);
});
test('learning: traps go to the most-used spot, cameras watch it, the favourite entry gets blocked', () => {
  const L = LR.createLearning();
  for (let i = 0; i < 3; i++) LR.recordCatch(L, 0.5 + i * 0.3, 0, -30);
  LR.recordCatch(L, -8, 0, -38);
  for (let i = 0; i < 3; i++) LR.recordEntry(L, 'backDoor');
  LR.recordEntry(L, 'kitchenWindow');
  const acts = LR.learn(L, { diff: AI.DIFFICULTY.normal, entries: level.entries, camMounts: level.camMounts });
  const trap = acts.find(a => a.type === 'trap');
  assert.ok(trap && Math.hypot(trap.pos[0] - 0.8, trap.pos[2] + 30) < 1, 'trap at the hotspot ' + JSON.stringify(trap));
  const cam = acts.find(a => a.type === 'camera'); assert.ok(cam && cam.mount === 'back', 'camera ' + JSON.stringify(cam));
  const blk = acts.find(a => a.type === 'block'); assert.ok(blk && blk.entry === 'backDoor', 'block ' + JSON.stringify(blk));
  // a second round puts the next trap somewhere else
  LR.recordCatch(L, 0.5, 0, -30);
  const again = LR.learn(L, { diff: AI.DIFFICULTY.normal, entries: level.entries, camMounts: level.camMounts });
  const t2 = again.find(a => a.type === 'trap');
  assert.ok(t2 && Math.hypot(t2.pos[0] - trap.pos[0], t2.pos[2] - trap.pos[2]) > 2.5, 'no stacking traps');
  // easy learns slower
  const E = LR.createLearning(); LR.recordCatch(E, 0, 0, -30);
  assert.strictEqual(LR.learn(E, { diff: AI.DIFFICULTY.easy, entries: level.entries, camMounts: level.camMounts }).length, 0);
});
test('in the world: catches at the back door bring a visible trap there that snaps shut on you', () => {
  const w = newWorld();
  for (let i = 0; i < 2; i++) {
    put(w, 0.6, 0, -30.5); w.ai.teleport({ x: 0.6, y: 0, z: -29.9 }); w.ai.setState('chase');
    run(w, 3.2);
  }
  assert.ok(w.traps.length >= 1, 'trap placed');
  const t = w.traps[0];
  assert.ok(Math.hypot(t.x - 0.6, t.z + 30.5) < 2.5 && t.armed, `trap near the catches (${t.x},${t.z})`);
  quietAI(w);
  put(w, t.x, t.y, t.z + 1.2, 0);
  let snapped = false;
  run(w, 1.5, { mz: 0.5 }, ww => { if (ww.events.some(e => e.type === 'trap')) snapped = true; return snapped; });
  assert.ok(snapped && w.player.stuck > 0, 'snapped');
  const x0 = w.player.x, z0 = w.player.z;
  run(w, 1, { mz: 1 });
  near(Math.hypot(w.player.x - x0, w.player.z - z0), 0, 0.05, 'stuck in place');
});

console.log('player + props');
test('walking up the stairs to the upper floor, and the attic stairs', () => {
  const w = newWorld(); quietAI(w);
  put(w, -1.3, 0, -15.2, 0);
  run(w, 2.5, { mz: 1 });
  assert.ok(w.player.y > LV.F1 - 0.05 && w.player.z < -19, `top of flight 1 (${w.player.y.toFixed(2)}, z ${w.player.z.toFixed(2)})`);
  put(w, 1.3, LV.F1, -20.3, 0);
  run(w, 2.5, { mz: 1 });
  assert.ok(w.player.y > LV.F2 - 0.05, `attic (${w.player.y.toFixed(2)})`);
});
test('stack two crates and climb them', () => {
  const w = newWorld(); quietAI(w);
  const a = w.propById.crateBack, b = w.propById.crateShed;
  put(w, 0, 0, -48, 0);
  a.x = 0; a.y = 0; a.z = -50; a.rest = false;
  w.pickUp(b);
  run(w, 0.5);
  w.player.pitch = -0.45;
  w.look = w.lookTarget();
  assert.ok(w.look && w.look.ref === a, 'looking at the crate');
  assert.ok(w.dropSelected(), 'dropped on top');
  run(w, 1);
  near(b.y, 0.7, 0.03, 'second crate rests on the first'); near(b.x, 0, 0.05); near(b.z, -50, 0.05);
  w.player.pitch = 0;
  // jump onto the first... the stack is 1.4 high: climb via a third crate placed as a step
  const c = w.propById.crateFront; c.x = 0; c.y = 0; c.z = -49.05; c.rest = false;
  put(w, 0, 0, -47.6, 0);
  let top = 0;
  run(w, 2.0, t => ({ mz: t < 1.3 ? 1 : 0, jump: t > 0.2 && t < 0.25 || t > 0.75 && t < 0.8 }), ww => { if (ww.player.onGround) top = Math.max(top, ww.player.y); });
  assert.ok(top > 1.38, `stood on top of the stack (y ${top.toFixed(2)})`);
});
test('throwing a can breaks the kitchen window (and he hears it)', () => {
  const w = newWorld();
  w.ai.teleport({ x: 0, y: 0, z: -20 });
  put(w, 6, 0, -8, 0);
  w.pickUp(w.propById.can7 || w.props.find(p => p.type === 'can'));
  w.player.pitch = 0.12;
  let heard = false, broke = false;
  run(w, 2, t => ({ primary: t < 0.6, primaryPress: t < 0.02 }), ww => {
    if (ww.events.some(e => e.type === 'glass')) broke = true;
    if (ww.events.some(e => e.type === 'ai-heard')) heard = true;
  });
  assert.ok(broke && !w.winById.kitchenW.glass, 'window broken');
  assert.ok(heard || w.ai.state === 'suspicious', 'he heard it');
});
test('crowbar pries boards; fuse powers the study lock; red key opens the basement and wins', () => {
  const w = newWorld(); quietAI(w);
  w.pickUp(w.propById.crowbar);
  w.useWindow(w.winById.garageW);
  assert.ok(!w.winById.garageW.boards && w.steps.garageWindow !== undefined);
  w.pickUp(w.propById.fuse);
  w.interact({ kind: 'fusebox', ref: w.fusebox });
  assert.ok(w.flags.power && !w.doorById.study.locked);
  put(w, 8.6, 0, -24.5, -Math.PI / 2);
  w.useDoor(w.doorById.basement);
  assert.ok(w.doorById.basement.locked, 'still locked without the key');
  w.pickUp(w.propById.redkey);
  w.useDoor(w.doorById.basement);
  assert.ok(!w.doorById.basement.locked);
  let won = run(w, 3, { mz: 1 }, ww => ww.flags.won);
  assert.ok(won, 'walked into the basement');
});
test('save and load keep puzzle progress, items, traps and what he learned', () => {
  const w = newWorld();
  w.pickUp(w.propById.crowbar); w.useWindow(w.winById.garageW);
  w.breakWindow(w.winById.kitchenW);
  w.traps.push({ id: 'trap1', x: 1, y: 0, z: -30, armed: true }); LR.recordEntry(w.learn, 'frontDoor');
  const data = JSON.parse(JSON.stringify(w.serialize()));
  const w2 = newWorld(); assert.ok(w2.load(data));
  assert.ok(!w2.winById.garageW.boards && !w2.winById.kitchenW.glass);
  assert.ok(w2.hasItem('crowbar') && w2.traps.length === 1 && w2.learn.entries.frontDoor === 1 && w2.steps.crowbar !== undefined);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
