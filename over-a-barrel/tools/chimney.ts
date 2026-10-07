// Bracing climb up smooth chimneys of several widths, in 1.5 m stages.
import { Sim } from '../src/sim/sim';
import { chimneyLevel } from '../src/sim/levels/chimneys';
import { cem } from './bot/cem';
import { Pool } from './bot/pool';

const widths = process.argv.slice(2).map(Number);
const pool = new Pool(4);
for (const w of widths.length ? widths : [1.8, 2.0, 2.2, 2.4]) {
  const sim = new Sim(chimneyLevel(w));
  sim.recordEvents = false;
  sim.player.setCursor(0.6, 0.6);
  sim.player.teleport(w / 2, 0.43);
  for (let i = 0; i < 120; i++) sim.step();
  let start = sim.player.getState();
  const t0 = Date.now();
  let reachedY = start.body.y;
  for (const y of [2, 3.5, 5, 6.5, 8]) {
    const goal = { x0: 0, x1: w, y0: y, y1: y + 1.0 };
    let done = false;
    for (const seed of [1, 2, 3]) {
      const res = await cem(pool, `chimney-${w}`, start, goal, { hold: 1.0, restSpeed: 0.44 }, {
        keys: 8, pop: 128, iters: 35, eliteFrac: 0.1, seed, stopOnReach: true,
      });
      if (res.result.reached) {
        start = res.result.final;
        reachedY = start.body.y;
        done = true;
        break;
      }
    }
    if (!done) break;
  }
  console.log(`chimney ${w} m: braced up to y=${reachedY.toFixed(2)} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await pool.close();
