import { Worker } from 'node:worker_threads';
import os from 'node:os';
import type { Goal, Plan, RolloutOpts, RolloutResult } from './core';
import type { PlayerState } from '../../src/sim/player';

export class Pool {
  private workers: Worker[] = [];
  private nextId = 1;
  private pending = new Map<number, (r: RolloutResult[]) => void>();

  constructor(n = Math.max(1, os.cpus().length)) {
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./worker-boot.mjs', import.meta.url));
      w.on('message', (m: { id: number; results: RolloutResult[] }) => {
        const cb = this.pending.get(m.id);
        this.pending.delete(m.id);
        cb?.(m.results);
      });
      w.on('error', (e) => {
        console.error('worker error', e);
        process.exit(1);
      });
      this.workers.push(w);
    }
  }

  get size(): number {
    return this.workers.length;
  }

  async evaluate(level: string, start: PlayerState, plans: Plan[], goal: Goal, opts: RolloutOpts): Promise<RolloutResult[]> {
    const n = this.workers.length;
    const chunk = Math.ceil(plans.length / n);
    const jobs: Promise<RolloutResult[]>[] = [];
    for (let i = 0; i < n; i++) {
      const part = plans.slice(i * chunk, (i + 1) * chunk);
      if (!part.length) continue;
      const id = this.nextId++;
      jobs.push(
        new Promise((resolve) => {
          this.pending.set(id, resolve);
          this.workers[i].postMessage({ id, level, start, plans: part, goal, opts });
        }),
      );
    }
    return (await Promise.all(jobs)).flat();
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}
