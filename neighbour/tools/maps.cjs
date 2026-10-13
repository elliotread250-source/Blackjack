// Levels 2 (The Cold Cellar) and 3 (Hollow Lane): reachability, locks, patrols, stairs, safety, saves, escape.
const assert = require('node:assert/strict');
const { buildLevel, MISSIONS } = require('../js/level.js');
const { World } = require('../js/world.js');
const { solveLevel } = require('../js/puzzle.js');
const { boxesOverlap } = require('../js/geom.js');
let count = 0;
const ok = (v, msg) => { assert(v, msg); count++; };
const STAIRS = {
  1: { top: { x: 10, y: 3.2, z: 1.2, yaw: 0 }, downTo: 0.3, upFrom: 3.15 },                 // hatch stairs, north = down
  2: { top: { x: 8.8, y: 3.2, z: -4.8, yaw: 0 }, downTo: 0.3, upFrom: 3.15 },               // lounge -> basement
};
for (const mission of [1, 2]) {
  const l = buildLevel(mission), name = MISSIONS[mission].name;
  ok(l.mission === mission && l.exit, name + ': map identity and exit');
  ok(l.boxes.length !== buildLevel(0).boxes.length, name + ': its own geometry');
  for (const id of ['basement', 'study']) ok(l.doors.some(d => d.id === id), name + ': has door ' + id);
  const solved = solveLevel(l);
  for (const id of [...l.targets, 'fuse', 'redkey']) ok(solved.have.has(id), name + ': ' + id + ' physically reachable');
  for (const disable of [['power'], ['item:redkey'], ['item:fuse']]) ok(!solveLevel(l, { disable }).have.has(l.targets[0]), name + ': cannot bypass ' + disable);
  if (mission === 1) ok(!solveLevel(l, { disable: ['break:laundryW'] }).have.has('fuse'), name + ': laundry needs its window broken first');

  let w = new World({ mission, seed: 7 });
  for (const p of w.pois) ok(w.path(w.ai.x, w.ai.y, w.ai.z, p.x, p.y, p.z)?.complete, name + ': patrol reaches ' + p.id);
  w.ai.update = () => {};
  w.step(1 / 60, {}); ok(!w.flags.won, name + ': no win at spawn');
  ok(!w.level.boxes.some(b => b.col && boxesOverlap(w.playerBox(), b, 0.005)), name + ': spawn has standing room');
  ok(w.isSafe(w.player.x, w.player.y, w.player.z), name + ': spawn is safe');
  // walk the stairs both ways with real 60 Hz physics
  Object.assign(w.player, STAIRS[mission].top);
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y < STAIRS[mission].downTo, name + ': walks down to the basement (y=' + w.player.y.toFixed(2) + ')');
  w.player.yaw = Math.PI;
  for (let i = 0; i < 200; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y > STAIRS[mission].upFrom, name + ': climbs back up (y=' + w.player.y.toFixed(2) + ')');
  // caught: wake at the spawn, keep the fuse in the world
  w.pickUp(w.propById.fuse); w.catchPlayer(); for (let i = 0; i < 170; i++) w.step(1 / 60, {});
  ok(!w.player.caught && !w.propById.fuse.gone, name + ': caught recovery keeps the fuse');
  const target = l.targets[0];
  w.pickUp(w.propById[target]); w.setPower(true);
  const saved = w.serialize(); w = new World({ mission: saved.mission }); ok(w.load(saved), name + ': save reloads');
  w.ai.update = () => {};
  ok(w.propById[target].gone && w.steps[target] !== undefined && w.flags.power, name + ': save keeps progress');
  Object.assign(w.player, { x: 0, y: 0, z: -15 }); w.step(1 / 60, {}); ok(!w.flags.won, name + ': no win away from the exit');
  Object.assign(w.player, l.spawn); w.flags.power = false; w.step(1 / 60, {}); ok(!w.flags.won, name + ': power required');
  w.setPower(true); w.step(1 / 60, {}); ok(w.flags.won, name + ': target + power + exit wins');
  ok(typeof w.objective() === 'string', name + ': objective text');
  console.log(name + ': passed');
}
// Hollow Lane: all three floors connect for him, and you can walk out of your own house.
{
  const w = new World({ mission: 2, seed: 3 });
  for (const [x, y, z] of [[4, 0, -14], [-6.5, 3.2, -17.5], [4, 6.4, -8], [-5, 6.4, -15]]) ok(w.path(w.ai.x, w.ai.y, w.ai.z, x, y, z)?.complete, `Hollow Lane: he reaches ${x},${y},${z}`);
  w.ai.update = () => {};
  for (let i = 0; i < 240; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.z < 6, 'Hollow Lane: player walks out of their house');
  // upstairs from the hall
  Object.assign(w.player, { x: -8.8, y: 3.2, z: -5.2, yaw: 0 });
  for (let i = 0; i < 220; i++) w.step(1 / 60, { mz: 1 });
  ok(w.player.y > 6.3, 'Hollow Lane: hall stairs reach the first floor (y=' + w.player.y.toFixed(2) + ')');
}
console.log(count + ' map checks passed');
