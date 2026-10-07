// Replay the saved route on the current level, feeding each plan's real end
// state into the next, and report the first waypoint it no longer reaches.
// Run: npx tsx tools/replay.ts   (after tools/route.ts has saved a full route)
import fs from 'node:fs';
import { mountainLevel } from '../src/sim/levels/mountain';
import type { PlayerState } from '../src/sim/player';
import { LocalCut, rollout, type Plan } from './bot/core';
import { W, spawnState } from './waypoints';

type Step = { i: number; name: string; state: PlayerState; plan: Plan };
const saved: Step[] = JSON.parse(fs.readFileSync(new URL('./route-progress.json', import.meta.url), 'utf8'));
const level = mountainLevel();
const cut = new LocalCut();
let state = spawnState();
let time = 0;
for (const [i, wp] of W.entries()) {
  const step = saved.find((s) => s.i === i);
  if (!step) {
    console.log(`[${i}] ${wp.name}: no saved plan yet; run npx tsx tools/route.ts --from ${i}`);
    process.exit(1);
  }
  const r = rollout(cut.get('mountain', level, state), state, step.plan, wp.goal, { hold: 1.0, restSpeed: 0.5 });
  if (!r.reached) {
    console.log(`[${i}] ${wp.name}: replay misses (dist ${r.finalDist.toFixed(2)}); rerun npx tsx tools/route.ts --from ${i}`);
    process.exit(1);
  }
  time += step.plan.reduce((s, k) => s + k.d, 0) + 1.0;
  state = r.final;
}
console.log(`replayed all ${W.length} waypoints, spawn to summit, in ${Math.round(time)} s of climbing`);
