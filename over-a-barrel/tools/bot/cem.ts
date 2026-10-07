// Cross-entropy search over mouse plans.
import { HAMMER } from '../../src/config';
import { rng } from '../../src/sim/geom';
import type { PlayerState } from '../../src/sim/player';
import type { Goal, Plan, RolloutOpts, RolloutResult } from './core';
import type { Pool } from './pool';

export interface CemConfig {
  keys: number;
  pop: number;
  iters: number;
  eliteFrac: number;
  seed: number;
  init?: Plan;
  /** Initial spread of cursor positions (m). */
  sigmaXY?: number;
  /** Stop as soon as a plan reaches the goal (feasibility is all we need). */
  stopOnReach?: boolean;
  log?: boolean;
}

export interface CemResult {
  plan: Plan;
  result: RolloutResult;
  evals: number;
}

function gauss(r: () => number): number {
  const u = Math.max(1e-9, r());
  const v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const D_MIN = 0.06;
const D_MAX = 0.9;

function clampKey(x: number, y: number, d: number) {
  const len = Math.hypot(x, y);
  const max = HAMMER.maxReach;
  if (len > max) {
    x *= max / len;
    y *= max / len;
  }
  return { x, y, d: Math.min(D_MAX, Math.max(D_MIN, d)) };
}

export async function cem(
  pool: Pool,
  level: string,
  start: PlayerState,
  goal: Goal,
  opts: RolloutOpts,
  cfg: CemConfig,
): Promise<CemResult> {
  const r = rng(cfg.seed);
  const K = cfg.init ? cfg.init.length : cfg.keys;
  const mean: number[] = [];
  const std: number[] = [];
  const s0 = cfg.sigmaXY ?? 1.1;
  for (let i = 0; i < K; i++) {
    const k = cfg.init?.[i];
    mean.push(k ? k.x : start.cursor.x * 0.5, k ? k.y : start.cursor.y * 0.5, k ? k.d : 0.3);
    std.push(k ? s0 * 0.5 : s0, k ? s0 * 0.5 : s0, k ? 0.08 : 0.15);
  }
  const toPlan = (vec: number[]): Plan => {
    const plan: Plan = [];
    for (let i = 0; i < K; i++) plan.push(clampKey(vec[i * 3], vec[i * 3 + 1], vec[i * 3 + 2]));
    return plan;
  };
  const fromPlan = (plan: Plan): number[] => plan.flatMap((k) => [k.x, k.y, k.d]);

  let best: CemResult | null = null;
  let evals = 0;
  const nElite = Math.max(2, Math.round(cfg.pop * cfg.eliteFrac));

  for (let it = 0; it < cfg.iters; it++) {
    const vecs: number[][] = [];
    if (best) vecs.push(fromPlan(best.plan));
    vecs.push(mean.slice());
    while (vecs.length < cfg.pop) vecs.push(mean.map((m, j) => m + std[j] * gauss(r)));
    const plans = vecs.map(toPlan);
    const results = await pool.evaluate(level, start, plans, goal, opts);
    evals += plans.length;
    const order = results.map((res, i) => ({ res, plan: plans[i] })).sort((a, b) => b.res.score - a.res.score);
    if (!best || order[0].res.score > best.result.score) best = { plan: order[0].plan, result: order[0].res, evals };
    if (cfg.log) {
      const b = best.result;
      console.log(
        `  it ${it} best=${b.score.toFixed(2)} reached=${b.reached} dist=${b.finalDist.toFixed(2)} min=${b.minDist.toFixed(2)} speed=${b.endSpeed.toFixed(2)}`,
      );
    }
    if (cfg.stopOnReach && best.result.reached) break;
    const elites = order.slice(0, nElite).map((o) => fromPlan(o.plan));
    for (let j = 0; j < mean.length; j++) {
      let m = 0;
      for (const e of elites) m += e[j];
      m /= elites.length;
      let v = 0;
      for (const e of elites) v += (e[j] - m) ** 2;
      const sd = Math.sqrt(v / elites.length);
      mean[j] = 0.3 * mean[j] + 0.7 * m;
      const floor = j % 3 === 2 ? 0.015 : 0.04;
      std[j] = Math.max(floor, 0.3 * std[j] + 0.7 * sd);
    }
  }
  best!.evals = evals;
  return best!;
}
