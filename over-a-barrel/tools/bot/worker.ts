import { parentPort } from 'node:worker_threads';
import { LocalCut, getLevel, registerLevel, rollout, type Goal, type Plan, type RolloutOpts } from './core';
import type { PlayerState } from '../../src/sim/player';
import type { LevelDef } from '../../src/sim/types';
import { mountainLevel } from '../../src/sim/levels/mountain';
import { wallLevel } from '../../src/sim/levels/walls';
import { chimneyLevel } from '../../src/sim/levels/chimneys';

registerLevel('mountain', mountainLevel);
for (const h of [2.2, 2.6, 3.0, 3.4, 3.8, 4.2]) registerLevel(`wall-${h}`, () => wallLevel(h));
for (const w of [1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.4]) registerLevel(`chimney-${w}`, () => chimneyLevel(w));

const cache = new Map<string, LevelDef>();

interface Job {
  id: number;
  level: string;
  start: PlayerState;
  plans: Plan[];
  goal: Goal;
  opts: RolloutOpts;
}

const cut = new LocalCut();

parentPort!.on('message', (job: Job) => {
  let level = cache.get(job.level);
  if (!level) {
    level = getLevel(job.level);
    cache.set(job.level, level);
  }
  const local = cut.get(job.level, level, job.start);
  const results = job.plans.map((plan) => rollout(local, job.start, plan, job.goal, job.opts));
  parentPort!.postMessage({ id: job.id, results });
});
