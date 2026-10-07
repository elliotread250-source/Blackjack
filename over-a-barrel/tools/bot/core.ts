// Shared bot logic: run a mouse plan on a fresh sim and score it.
import { Sim } from '../../src/sim/sim';
import type { PlayerState } from '../../src/sim/player';
import type { LevelDef } from '../../src/sim/types';
import { testLevel } from '../../src/sim/levels/test';
import { CONTAINER, HAMMER, PHYSICS } from '../../src/config';

// TUNE='{"HAMMER":{"reachGain":30}}' tries other constants without touching
// config.ts. Applied here so the main thread and every worker agree.
if (process.env.TUNE) {
  const t = JSON.parse(process.env.TUNE);
  Object.assign(HAMMER, t.HAMMER ?? {});
  Object.assign(PHYSICS, t.PHYSICS ?? {});
  Object.assign(CONTAINER, t.CONTAINER ?? {});
}

/** One mouse waypoint: cursor offset from the pivot (m) and seconds to glide there. */
export interface Key {
  x: number;
  y: number;
  d: number;
}
export type Plan = Key[];

/** Where the barrel's centre has to end up, at rest. */
export interface Goal {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Optional: the pick head must also finish above this height (m). */
  headMinY?: number;
}

export interface RolloutResult {
  score: number;
  reached: boolean;
  final: PlayerState;
  finalDist: number;
  minDist: number;
  endSpeed: number;
  maxY: number;
  minY: number;
}

const levels: Record<string, () => LevelDef> = { test: testLevel };

export function registerLevel(name: string, f: () => LevelDef): void {
  levels[name] = f;
}

export function getLevel(name: string): LevelDef {
  const f = levels[name];
  if (!f) throw new Error(`unknown level ${name}`);
  return f();
}

/** Only the terrain near the start matters for one short rollout (m). */
const LOCAL_RADIUS = 30;

/**
 * Rollouts run on the level cut down to the solids near their start. Anything
 * that re-runs a saved plan has to cut it the same way to get the same
 * numbers: far-off rock never touches the barrel, but it changes the order
 * the solver visits contacts in, and the physics is chaotic.
 */
export class LocalCut {
  private key = '';
  private local: LevelDef | null = null;

  /** Re-cut only when the start moves into a new whole-metre cell, as the workers always have. */
  get(name: string, level: LevelDef, start: PlayerState): LevelDef {
    const bx = start.body.x;
    const by = start.body.y;
    const key = `${name}:${Math.round(bx)}:${Math.round(by)}`;
    if (key !== this.key || !this.local) {
      this.local = {
        ...level,
        solids: level.solids.filter((s) => {
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const p of s.pts) {
            x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y);
          }
          const dx = Math.max(x0 - bx, 0, bx - x1);
          const dy = Math.max(y0 - by, 0, by - y1);
          return Math.hypot(dx, dy) < LOCAL_RADIUS;
        }),
      };
      this.key = key;
    }
    return this.local;
  }
}

export function distToBox(x: number, y: number, g: Goal): number {
  const dx = x < g.x0 ? g.x0 - x : x > g.x1 ? x - g.x1 : 0;
  const dy = y < g.y0 ? g.y0 - y : y > g.y1 ? y - g.y1 : 0;
  return Math.hypot(dx, dy * 1.3);
}

/** Cursor position at time t along a plan that starts from `from`. */
export function cursorAt(plan: Plan, from: { x: number; y: number }, t: number): { x: number; y: number } {
  let px = from.x;
  let py = from.y;
  for (const k of plan) {
    if (t < k.d) {
      const u = t / k.d;
      return { x: px + (k.x - px) * u, y: py + (k.y - py) * u };
    }
    t -= k.d;
    px = k.x;
    py = k.y;
  }
  return { x: px, y: py };
}

export function planDuration(plan: Plan): number {
  return plan.reduce((s, k) => s + k.d, 0);
}

export interface RolloutOpts {
  hold: number;
  /** Speed under which the barrel counts as settled. */
  restSpeed: number;
}

export function makeSim(level: LevelDef, start: PlayerState): Sim {
  const sim = new Sim(level);
  sim.recordEvents = false;
  sim.player.setState(start);
  return sim;
}

/** Run a plan, then hold the last cursor position for `hold` seconds, and score it. */
export function rollout(level: LevelDef, start: PlayerState, plan: Plan, goal: Goal, opts: RolloutOpts): RolloutResult {
  const sim = makeSim(level, start);
  const p = sim.player;
  const from = { ...start.cursor };
  const T = planDuration(plan);
  const total = T + opts.hold;
  let minDist = Infinity;
  let maxY = -Infinity;
  let minY = Infinity;
  let reachedEver = false;
  while (sim.time < total - 1e-9) {
    const c = cursorAt(plan, from, sim.time);
    p.setCursor(c.x, c.y);
    sim.step();
    const b = p.body.getPosition();
    const d = distToBox(b.x, b.y, goal);
    if (d < minDist) minDist = d;
    if (d === 0) reachedEver = true;
    if (b.y > maxY) maxY = b.y;
    if (b.y < minY) minY = b.y;
  }
  const b = p.body.getPosition();
  const v = p.body.getLinearVelocity();
  const endSpeed = Math.hypot(v.x, v.y);
  const head = p.hammer.getPosition();
  const headGap = goal.headMinY === undefined ? 0 : Math.max(0, goal.headMinY - head.y);
  const finalDist = distToBox(b.x, b.y, goal) + headGap;
  const reached = finalDist === 0 && endSpeed < opts.restSpeed;
  let score = -finalDist - 0.35 * minDist - 0.08 * Math.min(endSpeed, 5);
  if (reachedEver) score += 1;
  if (reached) score += 10 - 0.15 * T;
  return { score, reached, final: p.getState(), finalDist, minDist, endSpeed, maxY, minY };
}
