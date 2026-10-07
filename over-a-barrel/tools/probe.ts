// Headless measurements of the core mechanic on the test map.
// Run: npx tsx tools/probe.ts
import { Sim } from '../src/sim/sim';
import { testLevel } from '../src/sim/levels/test';

type Key = [t: number, x: number, y: number];

/** Run a cursor keyframe script (cursor relative to pivot), linear between keys. */
function run(keys: Key[], opts: { spawn?: [number, number]; T?: number; log?: boolean } = {}) {
  const level = testLevel();
  if (opts.spawn) level.spawn = { x: opts.spawn[0], y: opts.spawn[1] };
  const sim = new Sim(level);
  sim.recordEvents = false;
  const p = sim.player;
  p.setCursor(keys[0][1], keys[0][2]);
  p.teleport(level.spawn.x, level.spawn.y);
  const T = opts.T ?? keys[keys.length - 1][0] + 1.5;
  let maxY = -Infinity;
  let maxYt = 0;
  let maxSpeed = 0;
  let k = 0;
  const log: string[] = [];
  while (sim.time < T) {
    const t = sim.time;
    while (k < keys.length - 1 && keys[k + 1][0] <= t) k++;
    const a = keys[k];
    const b = keys[Math.min(k + 1, keys.length - 1)];
    const u = b[0] > a[0] ? Math.min(1, Math.max(0, (t - a[0]) / (b[0] - a[0]))) : 1;
    p.setCursor(a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
    sim.step();
    const pos = p.body.getPosition();
    const vel = p.body.getLinearVelocity();
    if (pos.y > maxY) {
      maxY = pos.y;
      maxYt = sim.time;
    }
    maxSpeed = Math.max(maxSpeed, Math.hypot(vel.x, vel.y));
    if (opts.log && sim.steps % 12 === 0) {
      log.push(
        `t=${sim.time.toFixed(2)} body=(${pos.x.toFixed(2)},${pos.y.toFixed(2)}) v=(${vel.x.toFixed(2)},${vel.y.toFixed(2)}) ang=${p.angle().toFixed(2)} reach=${p.reach().toFixed(2)} cur=(${p.cursor.x.toFixed(2)},${p.cursor.y.toFixed(2)})`,
      );
    }
  }
  const pos = p.body.getPosition();
  const vel = p.body.getLinearVelocity();
  return { sim, maxY, maxYt, maxSpeed, end: { x: pos.x, y: pos.y, vx: vel.x, vy: vel.y }, log };
}

const fmt = (n: number) => n.toFixed(2);

// 1. Idle: lower the hammer onto the ground from the air, then hold. Nothing should creep.
for (const cy of [-0.45, -0.6, -0.9]) {
  const r = run([[0, 1.1, 0.1], [0.5, 1.1, cy], [4, 1.1, cy]], { T: 4 });
  const s1 = r.sim.player.body.getLinearVelocity();
  console.log(`idle(cy ${cy}): end=(${fmt(r.end.x)},${fmt(r.end.y)}) v=(${fmt(s1.x)},${fmt(s1.y)}) head=(${fmt(r.sim.player.headWorld().x)},${fmt(r.sim.player.headWorld().y)})`);
}

// 2. Straight pole vault: head down beside the barrel, then shove down hard.
for (const dur of [0.06, 0.12, 0.25]) {
  const r = run([
    [0, 0.55, -0.1],
    [0.4, 0.55, -0.55],
    [0.8, 0.55, -0.55],
    [0.8 + dur, 0.1, -2.0],
  ]);
  console.log(`vault(dur ${dur}): rise ${fmt(r.maxY - 0.43)} m at t=${fmt(r.maxYt)} maxSpeed=${fmt(r.maxSpeed)} end x=${fmt(r.end.x)}`);
}

// 3. Swing vault: plant the hammer far behind and sweep it under you.
for (const dur of [0.12, 0.25, 0.4]) {
  const r = run([
    [0, -1.5, 0.0],
    [0.4, -1.5, -0.5],
    [0.8, -1.5, -0.5],
    [0.8 + dur, 0.0, -2.0],
    [0.8 + dur * 2, 1.4, -1.4],
  ]);
  console.log(`swing(dur ${dur}): rise ${fmt(r.maxY - 0.43)} m, end x=${fmt(r.end.x)} maxSpeed=${fmt(r.maxSpeed)}`);
}

// 4. Shuffle right on flat ground: plant ahead (pressing in), drag yourself to it, repeat.
for (const press of [-0.7, -0.9, -1.1]) {
  const keys: Key[] = [[0, 1.0, 0.0]];
  let t = 0.3;
  for (let i = 0; i < 6; i++) {
    keys.push([t, 1.6, -0.1]);
    keys.push([t + 0.2, 1.6, press]);
    keys.push([t + 0.6, 0.3, press]);
    keys.push([t + 0.8, 0.5, -0.1]);
    t += 0.9;
  }
  const r = run(keys);
  console.log(`shuffle(press ${press}): 6 strokes moved x ${fmt(r.end.x - 2)} m`);
}

// 5. Chimney brace: barrel against the left wall, hammer pushed into the right wall.
for (const cx of [1.3, 1.6, 2.0]) {
  const r = run(
    [
      [0, 1.0, 0.3],
      [0.2, cx, 0.3],
      [3, cx, 0.3],
    ],
    { spawn: [38.47, 6], T: 3 },
  );
  console.log(`chimney brace(cx ${cx}): start y=6, end y=${fmt(r.end.y)} vy=${fmt(r.end.vy)}`);
}

// 6. Hook the 1.2 m step's edge from below and haul up.
{
  const r = run(
    [
      [0, 0.8, 0.2],
      [0.4, 1.2, 1.2],
      [0.8, 1.9, 0.9],
      [1.4, 1.9, 0.3],
      [2.4, 0.6, 0.0],
      [3.2, 0.3, -0.9],
      [4.0, 1.4, -0.6],
    ],
    { spawn: [12.0, 0.43], T: 6 },
  );
  console.log(`hook step: end=(${fmt(r.end.x)},${fmt(r.end.y)}) peak=${fmt(r.maxY)} (on top needs y>=1.63)`);
}
