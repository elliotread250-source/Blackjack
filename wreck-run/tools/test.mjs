// node tools/test.mjs — town layout, driving, smashing, combos, drifts, ramps, pickups, people and animals.
import assert from 'node:assert/strict';
import { makeCity, Run, SMASH, botInput, ANIMALS, PEOPLE, PENALTY, CAR_R, SIZE, RUN_TIME, lotRect } from '../js/logic.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
const inBuilding = (C, x, z, pad = 0) => C.buildings.some(b => x > b.x0 - pad && x < b.x1 + pad && z > b.z0 - pad && z < b.z1 + pad);
const DT = 1 / 60;
let seed = 3; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);

for (const s of [1, 2, 3, 99]) {
  const C = makeCity(s);
  ok(C.smash.length > 150, `town ${s}: ${C.smash.length} things to smash`);
  ok(new Set(C.smash.map(o => o.kind)).size >= 18, 'lots of different things');
  ok(C.smash.every(o => SMASH[o.kind] && !inBuilding(C, o.x, o.z)), 'nothing to smash is inside a building');
  ok(C.pickups.every(p => !inBuilding(C, p.x, p.z, 1)), 'pickups are on open ground');
  ok(C.agents.some(a => ANIMALS.includes(a.kind)) && C.agents.some(a => a.kind === 'cyclist') && C.agents.some(a => a.kind === 'walker'), 'people, cyclists and animals live here');
}
// driving: speed up, steer, stop at walls
let r = new Run(1, rnd);
const start = { x: r.car.x, z: r.car.z };
ok(!inBuilding(r.city, start.x, start.z, CAR_R), 'start on open road');
for (let i = 0; i < 90; i++) r.step(DT, { throttle: 1 });
ok(r.speed > 20, `accelerates (${r.speed.toFixed(1)} m/s)`);
// smashing scores with a combo
r = new Run(1, rnd); r.city.agents = []; r.city.smash = [];
r.city.smash.push({ id: 1, kind: 'cone', x: r.car.x, z: r.car.z + 6, broken: false }, { id: 2, kind: 'mailbox', x: r.car.x, z: r.car.z + 12, broken: false });
for (let i = 0; i < 120; i++) r.step(DT, { throttle: 1 });
ok(r.smashed === 2 && r.combo === 2 && r.score > SMASH.cone.pts + SMASH.mailbox.pts, `two smashes in a row build a combo (score ${r.score})`);
// people and animals: bumping one stops you and costs points, and they are still there afterwards
for (const kind of ['walker', 'dog', 'cyclist']) {
  r = new Run(1, rnd); r.city.smash = [];
  const a = { kind, area: lotRect(2, 1), x: r.car.x, z: r.car.z + 8, tx: r.car.x, tz: r.car.z + 8, wait: 99, speed: 0, ang: 0, dodge: 0, startle: 0 };
  r.city.agents = [a];
  r.car.vz = 20;
  let stopped = false;
  for (let i = 0; i < 60; i++) { r.step(DT, {}); if (r.penalties) { stopped = r.speed < 2; break; } }
  ok(r.penalties === 1 && r.score === -PENALTY && stopped, `hitting a ${kind} costs ${PENALTY} and stops the car`);
  ok(r.city.agents.includes(a) && a.startle > 0, `the ${kind} is fine, just startled`);
}
ok(ANIMALS.length && PEOPLE.length, 'agent kinds');
// drifting scores
r = new Run(1, rnd); r.city.agents = []; r.city.smash = []; r.city.buildings = []; r.city.posts = [];
for (let i = 0; i < 60; i++) r.step(DT, { throttle: 1 });
for (let i = 0; i < 90; i++) r.step(DT, { throttle: 1, steer: 1, handbrake: true });
for (let i = 0; i < 30; i++) r.step(DT, { throttle: 0.5 });
ok(r.score > 0 && r.takeEvents().some(e => e.type === 'points' && /drift/i.test(e.label || '')), 'a handbrake slide scores drift points');
// ramps launch you and air time scores
r = new Run(1, rnd); r.city.agents = []; r.city.smash = []; r.city.buildings = []; r.city.posts = [];
r.city.ramps = [{ x: r.car.x, z: r.car.z + 25, dir: 0 }];
let maxY = 0; for (let i = 0; i < 240; i++) { r.step(DT, { throttle: 1 }); maxY = Math.max(maxY, r.car.y); }
ok(maxY > 3 && r.score > 0, `ramp jump reaches ${maxY.toFixed(1)} m and scores air time`);
// pickups
r = new Run(1, rnd); r.city.agents = []; r.city.smash = [];
r.city.pickups = [{ id: 1, kind: 'clock', x: r.car.x, z: r.car.z + 5, taken: 0 }, { id: 2, kind: 'star', x: r.car.x, z: r.car.z + 10, taken: 0 }];
for (let i = 0; i < 90; i++) r.step(DT, { throttle: 1 });
ok(r.timeLeft > RUN_TIME - 2 + 7 && r.score >= 500, 'clock adds time, star adds 500');
// a whole run with the bot: never ends up inside a building, time runs out, score stays sane
for (const s of [5, 6, 7]) {
  r = new Run(s, rnd); let inside = 0;
  while (!r.over) { r.step(DT, botInput(r, rnd)); if (inBuilding(r.city, r.car.x, r.car.z) || r.car.x < 0 || r.car.x > SIZE || r.car.z < 0 || r.car.z > SIZE) inside++; }
  ok(inside === 0, `seed ${s}: car never inside a building or off the map`);
  ok(r.score < 4000 * r.t, `score ${r.score} under the server's points-per-second ceiling`);
}
console.log(n + ' wreck run checks passed');
