// What can a perfect mouse do? Bot vs. each obstacle on the test map.
// Run: npx tsx tools/capability.ts [names...]
import { Sim } from "../src/sim/sim";
import { getLevel, type Goal } from "./bot/core";
import { cem } from "./bot/cem";
import { Pool } from "./bot/pool";
import type { PlayerState } from "../src/sim/player";

function settle(
  level: string,
  x: number,
  y: number,
  cursor: [number, number],
): PlayerState {
  const sim = new Sim(getLevel(level));
  sim.recordEvents = false;
  sim.player.setCursor(cursor[0], cursor[1]);
  sim.player.teleport(x, y);
  for (let i = 0; i < 120; i++) sim.step();
  return sim.player.getState();
}

const tests: {
  name: string;
  spawn: [number, number];
  goal: Goal;
  keys?: number;
}[] = [
  {
    name: "step-1.2",
    spawn: [11.6, 0.43],
    goal: { x0: 13.6, x1: 16.6, y0: 1.6, y1: 2.4 },
  },
  {
    name: "boulder",
    spawn: [5.0, 0.43],
    goal: { x0: 8.4, x1: 11.0, y0: 0.4, y1: 0.6 },
  },
  {
    name: "ledge-2.6",
    spawn: [21.4, 0.43],
    goal: { x0: 23.3, x1: 29.6, y0: 3.0, y1: 3.8 },
    keys: 8,
  },
  {
    name: "branch-3.0",
    spawn: [85.6, 0.43],
    goal: { x0: 86.3, x1: 88.7, y0: 3.55, y1: 4.3 },
    keys: 8,
  },
  {
    name: "wall-4.0",
    spawn: [73.0, 0.43],
    goal: { x0: 74.5, x1: 79.6, y0: 4.4, y1: 5.2 },
    keys: 10,
  },
  {
    name: "ice-ramp",
    spawn: [49.0, 0.43],
    goal: { x0: 60.0, x1: 63.5, y0: 5.5, y1: 8.0 },
    keys: 10,
  },
];

// SEEDS=7,8,9 ITERS=60 retry the search harder before calling something impossible.
const only = process.argv.slice(2);
const seeds = (process.env.SEEDS ?? "7").split(",").map(Number);
const iters = Number(process.env.ITERS ?? 30);
const pool = new Pool(4);
for (const t of tests) {
  if (only.length && !only.includes(t.name)) continue;
  const start = settle("test", t.spawn[0], t.spawn[1], [1.0, 0.2]);
  for (const seed of seeds) {
    const t0 = Date.now();
    const res = await cem(
      pool,
      "test",
      start,
      t.goal,
      { hold: 1.2, restSpeed: 0.5 },
      {
        keys: t.keys ?? 6,
        pop: 96,
        iters,
        eliteFrac: 0.1,
        seed,
        stopOnReach: true,
      },
    );
    const r = res.result;
    console.log(
      `${t.name.padEnd(12)} seed=${seed} reached=${r.reached} dist=${r.finalDist.toFixed(2)} min=${r.minDist.toFixed(2)} maxY=${r.maxY.toFixed(2)} evals=${res.evals} ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    );
    if (r.reached) {
      console.log(
        "   plan",
        JSON.stringify(
          res.plan.map((k) => [
            +k.x.toFixed(2),
            +k.y.toFixed(2),
            +k.d.toFixed(2),
          ]),
        ),
      );
      break;
    }
  }
}
await pool.close();
