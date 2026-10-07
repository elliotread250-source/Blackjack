// Tallest plain wall a perfect mouse can get on top of.
import { Sim } from '../src/sim/sim';
import { wallLevel } from '../src/sim/levels/walls';
import { cem } from './bot/cem';
import { Pool } from './bot/pool';

const pool = new Pool(4);
for (const h of [2.2, 2.6, 3.0, 3.4, 3.8]) {
  const sim = new Sim(wallLevel(h));
  sim.recordEvents = false;
  sim.player.setCursor(1.0, 0.2);
  sim.player.teleport(8.6, 0.43);
  for (let i = 0; i < 120; i++) sim.step();
  const start = sim.player.getState();
  const goal = { x0: 10.6, x1: 17.6, y0: h + 0.38, y1: h + 1.4 };
  let ok = false;
  const t0 = Date.now();
  for (const seed of [1, 2, 3]) {
    const res = await cem(pool, `wall-${h}`, start, goal, { hold: 1.2, restSpeed: 0.5 }, {
      keys: 8, pop: 128, iters: 40, eliteFrac: 0.1, seed, stopOnReach: true,
    });
    if (res.result.reached) {
      console.log(`wall ${h}: CLIMBED (seed ${seed}, ${res.evals} evals, ${((Date.now() - t0) / 1000).toFixed(1)}s) maxY=${res.result.maxY.toFixed(2)}`);
      ok = true;
      break;
    }
    console.log(`wall ${h}: seed ${seed} failed, best dist ${res.result.finalDist.toFixed(2)} maxY=${res.result.maxY.toFixed(2)}`);
  }
  if (!ok) console.log(`wall ${h}: not found`);
}
await pool.close();
