// Prove the mountain is climbable: chain bot searches waypoint to waypoint.
// Run: npx tsx tools/route.ts [--from N] [--to N]
// Progress (resting states + mouse plans) is saved to tools/route-progress.json.
import fs from 'node:fs';
import type { PlayerState } from '../src/sim/player';
import { cem } from './bot/cem';
import type { Plan } from './bot/core';
import { Pool } from './bot/pool';
import { W, spawnState } from './waypoints';

// --------------------------------------------------------------------------
const args = process.argv.slice(2);
const argOf = (k: string, d: number) => {
  const i = args.indexOf(k);
  return i >= 0 ? Number(args[i + 1]) : d;
};
const PROGRESS = new URL('./route-progress.json', import.meta.url);
type Step = { i: number; name: string; state: PlayerState; plan: Plan; evals: number };
let saved: Step[] = [];
try {
  saved = JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
} catch {
  /* fresh */
}

const from = argOf('--from', 0);
const to = argOf('--to', W.length - 1);


let start: PlayerState = from === 0 ? spawnState() : saved.find((s) => s.i === from - 1)!.state;
if (!start) throw new Error(`no saved state before waypoint ${from}`);

function chimneyInits(): Plan[] {
  const k = (a: number, r: number, d: number) => ({ x: Math.cos((a * Math.PI) / 180) * r, y: Math.sin((a * Math.PI) / 180) * r, d });
  const cycle = (side: 1 | -1) => {
    const plan: Plan = [];
    for (let c = 0; c < 3; c++) {
      const A = (a: number) => (side > 0 ? a : 180 - a);
      plan.push(k(A(-5), 2.0, c === 0 ? 0.15 : 0.08), k(A(-38), 2.0, 0.5), k(A(-5), 1.15, 0.06));
    }
    return plan;
  };
  return [cycle(1), cycle(-1)];
}

/** Hook the lip, haul in, rotate over the hook, shove onto the top. */
function mantleInits(start: PlayerState, lip: { x: number; y: number; side: 1 | -1 }): Plan[] {
  const px = start.body.x;
  const py = start.body.y + 0.32;
  const out: Plan[] = [];
  for (const over of [0.25, 0.45]) {
    const hx = lip.x + lip.side * over - px;
    const hy = lip.y + 0.18 - py;
    out.push([
      { x: hx, y: hy + 0.45, d: 0.25 },
      { x: hx, y: hy, d: 0.15 },
      { x: hx * 0.45, y: hy * 0.45, d: 0.35 },
      { x: hx * 0.9 + lip.side * 0.3, y: -0.1, d: 0.3 },
      { x: hx * 0.6 + lip.side * 0.4, y: -0.75, d: 0.3 },
      { x: lip.side * 1.4, y: -0.7, d: 0.3 },
      { x: lip.side * 1.0, y: -0.2, d: 0.3 },
    ]);
  }
  return out;
}

/** Kick off the near wall, hook the next ledge on the way up, haul onto it. */
function ledgeInits(start: PlayerState, lip: { x: number; y: number; side: 1 | -1 }): Plan[] {
  const px = start.body.x;
  const py = start.body.y + 0.32;
  const out: Plan[] = [];
  for (const rise of [0.8, 1.3]) {
    for (const over of [0.2, 0.4]) {
      const hx = lip.x + lip.side * over - px;
      const hy = lip.y + 0.2 - (py + rise);
      out.push([
        { x: -lip.side * 0.9, y: -1.75, d: 0.12 }, // shove down off the near wall
        { x: hx, y: hy + 0.3, d: 0.16 }, // swing up past the ledge
        { x: hx, y: hy - 0.1, d: 0.1 }, // set the hook
        { x: hx * 0.4, y: hy * 0.4 - 0.6, d: 0.3 }, // haul in
        { x: lip.side * 0.5, y: -0.6, d: 0.25 }, // rotate over the hook
        { x: lip.side * 1.2, y: -0.9, d: 0.25 }, // shove onto the top
        { x: lip.side * 0.8, y: -0.3, d: 0.3 },
      ]);
    }
  }
  return out;
}

const pool = new Pool(4);
const t0 = Date.now();
for (let i = from; i <= to; i++) {
  const wp = W[i];
  let ok = false;
  const tries: { keys: number; pop: number; iters: number; seed: number; init?: Plan; sigma?: number }[] = [];
  if (wp.kind === 'chimney') for (const init of chimneyInits()) tries.push({ keys: 9, pop: 128, iters: 30, seed: 11, init, sigma: 0.5 });
  if (wp.kind === 'mantle' && wp.lip) for (const init of mantleInits(start, wp.lip)) tries.push({ keys: 7, pop: 128, iters: 30, seed: 21, init, sigma: 0.6 });
  if (wp.kind === 'ledge' && wp.lip) {
    // Hop or brace up the chimney, hook the ledge, haul onto it.
    for (const init of ledgeInits(start, wp.lip)) tries.push({ keys: 7, pop: 128, iters: 35, seed: 31, init, sigma: 0.45 });
    for (const init of chimneyInits()) tries.push({ keys: 9, pop: 128, iters: 30, seed: 11, init, sigma: 0.5 });
    tries.push({ keys: 10, pop: 192, iters: 50, seed: 5 });
  }
  tries.push(
    { keys: 6, pop: 96, iters: 25, seed: 1 },
    { keys: 8, pop: 128, iters: 35, seed: 2 },
    { keys: 10, pop: 160, iters: 40, seed: 3 },
    { keys: 8, pop: 160, iters: 40, seed: 4 },
  );
  for (const tr of tries) {
    const res = await cem(pool, 'mountain', start, wp.goal, { hold: 1.0, restSpeed: 0.5 }, {
      keys: tr.keys,
      pop: tr.pop,
      iters: tr.iters,
      eliteFrac: 0.1,
      seed: tr.seed,
      init: tr.init,
      sigmaXY: tr.sigma,
      stopOnReach: true,
    });
    if (res.result.reached) {
      const b = res.result.final.body;
      console.log(
        `[${i}] OK   ${wp.name.padEnd(26)} at (${b.x.toFixed(1)},${b.y.toFixed(1)}) evals=${res.evals} t=${((Date.now() - t0) / 1000).toFixed(0)}s`,
      );
      saved = saved.filter((s) => s.i < i);
      saved.push({ i, name: wp.name, state: res.result.final, plan: res.plan, evals: res.evals });
      fs.writeFileSync(PROGRESS, JSON.stringify(saved));
      start = res.result.final;
      ok = true;
      break;
    }
    const f = res.result.final.body;
    console.log(`[${i}] ...  ${wp.name.padEnd(26)} try failed (dist ${res.result.finalDist.toFixed(2)}, ended (${f.x.toFixed(1)},${f.y.toFixed(1)}))`);
  }
  if (!ok) {
    console.log(`[${i}] FAIL ${wp.name}: stuck. Fix the level here, then rerun with --from ${i}.`);
    break;
  }
}
await pool.close();
