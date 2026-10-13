// node tools/test.mjs [seeds] [distance] — physics checks and long bot runs that prove the track is passable.
import assert from 'node:assert/strict';
import { Run, Track, botStep, TRAIN_H, LANES, speedAt, POWER_TIME } from '../js/logic.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
const seeds = +(process.argv[2] || 25), far = +(process.argv[3] || 4000);
const DT = 1 / 60;

// every segment keeps a train-free safe lane, and safe lanes move one step at a time
{
  const tr = new Track(5); tr.ensure(8000);
  let prev = null;
  for (const s of tr.segments) {
    ok(!tr.things.some(t => t.kind === 'train' && t.lane === s.safe && t.z1 > s.z0 && t.z0 < s.z1 && !t.speed), 'safe lane has no static trains');
    if (prev !== null) assert(Math.abs(s.safe - prev) <= 1);
    prev = s.safe;
  }
  const kinds = new Set(tr.things.map(t => t.kind + (t.ramp ? '+ramp' : '') + (t.speed ? '+moving' : '')));
  for (const k of ['train', 'train+ramp', 'train+moving', 'hurdle', 'bar']) ok(kinds.has(k), 'track has ' + k);
}
// jumping clears a hurdle, rolling clears a barrier, standing still hits both
function lane0(things) { const r = new Run(1); r.track.things = things; r.track.coins = []; r.track.powers = []; r.track.genZ = 1e9; return r; }
{
  let r = lane0([{ kind: 'hurdle', lane: 0, z0: 10, z1: 10.5 }]);
  for (let i = 0; i < 120; i++) r.step(DT); ok(r.p.dead?.why === 'hurdle', 'running into a hurdle crashes');
  r = lane0([{ kind: 'hurdle', lane: 0, z0: 10, z1: 10.5 }]);
  for (let i = 0; i < 120; i++) { if (r.p.z > 8 && r.p.ground) r.input('jump'); r.step(DT); } ok(!r.p.dead, 'jumping clears a hurdle');
  r = lane0([{ kind: 'bar', lane: 0, z0: 10, z1: 10.5 }]);
  for (let i = 0; i < 120; i++) r.step(DT); ok(r.p.dead?.why === 'bar', 'running into a barrier crashes');
  r = lane0([{ kind: 'bar', lane: 0, z0: 10, z1: 10.5 }]);
  for (let i = 0; i < 120; i++) { if (r.p.z > 8.5 && r.p.roll <= 0) r.input('roll'); r.step(DT); } ok(!r.p.dead, 'rolling clears a barrier');
  // trains: a flat front crashes, a ramp carries you onto the roof, side swipes stumble then catch
  r = lane0([{ kind: 'train', lane: 0, z0: 10, z1: 30, ramp: false, speed: 0 }]);
  for (let i = 0; i < 120; i++) r.step(DT); ok(r.p.dead?.why === 'train', 'a train front crashes');
  r = lane0([{ kind: 'train', lane: 0, z0: 10, z1: 30, ramp: true, speed: 0 }]);
  let top = 0; for (let i = 0; i < 90; i++) { r.step(DT); top = Math.max(top, r.p.y); } ok(!r.p.dead && Math.abs(top - TRAIN_H) < 0.01, 'a ramp takes you onto the roof');
  r = lane0([{ kind: 'train', lane: 1, z0: -5, z1: 40, ramp: false, speed: 0 }]);
  r.step(DT); r.input('right'); ok(r.p.lane === 0 && r.chased, 'swiping into a train stumbles');
  r.step(DT); r.input('right'); ok(r.p.dead?.why === 'caught', 'a second stumble gets you caught');
}
// coins, magnet, power-ups
{
  const r = lane0([]); r.track.coins = [{ lane: 0, z: 5, y: 1, taken: false }, { lane: 1, z: 8, y: 1, taken: false }];
  for (let i = 0; i < 60; i++) r.step(DT); ok(r.coins === 1, 'collect the coin in your lane only');
  const m = lane0([]); m.power.magnet = POWER_TIME.magnet; m.track.coins = [{ lane: 1, z: 8, y: 1, taken: false }, { lane: -1, z: 9, y: 4, taken: false }];
  for (let i = 0; i < 60; i++) m.step(DT); ok(m.coins === 2, 'the magnet pulls coins from other lanes');
  const s = lane0([]); s.power.sneakers = 5; s.input('jump'); let h = 0; for (let i = 0; i < 90; i++) { s.step(DT); h = Math.max(h, s.p.y); } ok(h > TRAIN_H, 'super sneakers jump onto trains');
}
// the bot runs a long way on many seeds
let worst = Infinity;
for (let s = 1; s <= seeds; s++) {
  const r = new Run(s * 104729);
  while (!r.p.dead && r.p.z < far) { botStep(r); r.step(DT); }
  worst = Math.min(worst, r.p.z);
  ok(!r.p.dead, `seed ${s * 104729}: bot ran ${r.p.z.toFixed(0)}${r.p.dead ? ' and died: ' + r.p.dead.why : ''}`);
}
ok(speedAt(far) > speedAt(0), 'the run speeds up');
console.log(`${n} subway checks passed (bot ran ${far} on ${seeds} seeds, worst ${worst.toFixed(0)})`);
