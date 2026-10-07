// Does the rig sit still? Holds a few poses and reports leftover motion.
// Run: npx tsx tools/idle.ts   (TUNE='{"HAMMER":{...}}' to compare constants)
import { Sim } from '../src/sim/sim';
import { getLevel } from './bot/core';

const poses: [string, number, number][] = [
  ['pick pressed into ground', 0.3, -1.2],
  ['pick resting out front', 1.4, -0.55],
  ['pick held in the air', 1.2, 0.6],
  ['leaning on pick behind', -1.0, -0.9],
];
for (const [name, cx, cy] of poses) {
  const sim = new Sim(getLevel('test'));
  sim.recordEvents = false;
  const p = sim.player;
  p.setCursor(cx, cy);
  p.teleport(3, 0.43);
  let n = 0;
  let bodyV = 0;
  let headV = 0;
  let spin = 0;
  while (sim.time < 3) {
    sim.step();
    if (sim.time < 2) continue;
    const v = p.body.getLinearVelocity();
    const hv = p.hammer.getLinearVelocity();
    bodyV += v.x * v.x + v.y * v.y;
    headV += hv.x * hv.x + hv.y * hv.y;
    spin += p.hammer.getAngularVelocity() ** 2;
    n++;
  }
  const rms = (s: number) => Math.sqrt(s / n).toFixed(4);
  console.log(`${name.padEnd(26)} barrel ${rms(bodyV)} m/s  head ${rms(headV)} m/s  spin ${rms(spin)} rad/s`);
}
