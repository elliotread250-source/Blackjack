// How snappy is a push off flat ground? Flicks the cursor and logs the barrel.
// Run: npx tsx tools/launch.ts
import { HAMMER, PHYSICS } from '../src/config';
import { Sim } from '../src/sim/sim';
import { getLevel } from './bot/core';

type Flick = { name: string; from: [number, number]; to: [number, number]; ms: number };

const flicks: Flick[] = [
  { name: 'straight down', from: [0.05, -0.55], to: [0.05, -2.0], ms: 40 },
  { name: 'down-back 30°', from: [0.3, -0.55], to: [1.0, -1.73], ms: 40 },
  { name: 'slow press', from: [0.05, -0.55], to: [0.05, -2.0], ms: 600 },
];

export function launch(f: Flick): string {
  const sim = new Sim(getLevel('test'));
  sim.recordEvents = false;
  const p = sim.player;
  p.setCursor(f.from[0], f.from[1]);
  p.teleport(3, 0.43);
  for (let i = 0; i < 2 * PHYSICS.hz; i++) sim.step();
  const y0 = p.body.getPosition().y;
  const dt = 1 / PHYSICS.hz;
  const steps = Math.round(f.ms / 1000 / dt);
  let t10 = -1;
  let peak = y0;
  let tPeak = 0;
  let vMax = 0;
  for (let i = 0; i < 3 * PHYSICS.hz; i++) {
    const k = Math.min(1, (i + 1) / Math.max(1, steps));
    p.setCursor(f.from[0] + (f.to[0] - f.from[0]) * k, f.from[1] + (f.to[1] - f.from[1]) * k);
    sim.step();
    const y = p.body.getPosition().y;
    const vy = p.body.getLinearVelocity().y;
    if (t10 < 0 && y - y0 > 0.1) t10 = (i + 1) * dt;
    if (y > peak) {
      peak = y;
      tPeak = (i + 1) * dt;
    }
    vMax = Math.max(vMax, vy);
  }
  return `${f.name.padEnd(14)} lift@${(t10 * 1000).toFixed(0).padStart(4)}ms  peak +${(peak - y0).toFixed(2)}m @${(tPeak * 1000).toFixed(0).padStart(4)}ms  vMax ${vMax.toFixed(2)} m/s`;
}

const variants: Record<string, Partial<typeof HAMMER>> = JSON.parse(process.argv[2] ?? '{"current":{}}');
const base = { ...HAMMER };
for (const [name, v] of Object.entries(variants)) {
  Object.assign(HAMMER, base, v);
  console.log(`--- ${name} ${JSON.stringify(v)}`);
  for (const f of flicks) console.log('  ' + launch(f));
}
