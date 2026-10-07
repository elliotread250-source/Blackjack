// Fluid simulation tests: run with tests/ws2-world/run.sh fluids
import { World } from '../../src/world/world';
import { ID, pack } from '../../src/blocks/registry';
import {
  test, summary, eq, ok, B, AIR, STONE, GRASS, TORCH, WATER, LAVA, flat, makeWorld, grid,
  assertLightMatchesReference, sliceImage, SCRATCH, type Filler,
} from './helpers';

console.log('WS2 fluids');

const water = (level: number, falling = false) => pack(ID.water, level | (falling ? 8 : 0));
const lava = (level: number, falling = false) => pack(ID.lava, level | (falling ? 8 : 0));
const name = (v: number) => (v === 0 ? 'air' : `${v & 0x3ff}:${v >> 10}`);

function run(w: World, seconds: number, step = 0.05): void {
  const n = Math.round(seconds / step);
  for (let i = 0; i < n; i++) w.tick(step);
}

test('water source on a flat floor spreads to a 7-block diamond', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, WATER);
  run(w, 6);
  for (let dz = -10; dz <= 10; dz++) for (let dx = -10; dx <= 10; dx++) {
    const d = Math.abs(dx) + Math.abs(dz);
    const v = w.get(8 + dx, 64, 8 + dz);
    const want = d === 0 ? water(0) : d <= 7 ? water(d) : AIR;
    if (v !== want) throw new Error(`at d=${d} (${dx},${dz}) got ${name(v)} want ${name(want)}`);
    eq(w.get(8 + dx, 65, 8 + dz), AIR, 'nothing above');
  }
  eq(w.fluids.pending, 0, 'settled');
  assertLightMatchesReference(w);
});

test('spreads one block per 0.25 s', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, WATER);
  run(w, 0.25);
  eq(w.get(9, 64, 8), water(1), 'first ring after one water tick');
  eq(w.get(10, 64, 8), AIR, 'not yet');
  run(w, 0.5);
  eq(w.get(11, 64, 8), water(3));
});

test('flows towards the nearest drop and falls off a ledge', () => {
  // upper floor y=63 for x < 12, lower floor y=57 for x >= 12
  const fill: Filler = (x, y, z) => (x >= 12 ? (y <= 57 ? STONE : AIR) : flat(x, y, z));
  const w = makeWorld(fill, grid(1));
  w.set(8, 64, 8, WATER);
  run(w, 10);
  eq(w.get(9, 64, 8), water(1)); eq(w.get(11, 64, 8), water(3));
  eq(w.get(8, 64, 7), AIR, 'no flow away from the drop');
  eq(w.get(7, 64, 8), AIR, 'no flow away from the drop (west)');
  eq(w.get(12, 64, 8), water(4), 'edge cell');
  for (let y = 58; y <= 63; y++) eq(w.get(12, y, 8), water(0, true), `falling column y=${y}`);
  eq(w.get(13, 58, 8), water(1), 'spreads where it lands');
  eq(w.get(19, 58, 8), water(7));
  eq(w.get(20, 58, 8), AIR);
  eq(w.get(12, 58, 15), water(7));
  eq(w.get(11, 58, 8), STONE, 'cliff untouched');
  assertLightMatchesReference(w);
  sliceImage(w, 4, 24, 54, 68, 8, 14, `${SCRATCH}/fluid-ledge.png`);
  // removing the source drains everything, including the pool below
  w.set(8, 64, 8, AIR);
  run(w, 20);
  let left = 0;
  for (let x = -16; x < 32; x++) for (let z = -16; z < 32; z++) for (let y = 55; y < 70; y++) if ((w.get(x, y, z) & 0x3ff) === ID.water) left++;
  eq(left, 0, 'water cells left after draining');
  eq(w.fluids.pending, 0, 'settled');
  assertLightMatchesReference(w, 'after drain');
});

test('removing the source drains a flat spread', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, WATER);
  run(w, 6);
  w.set(8, 64, 8, AIR);
  run(w, 4);
  let left = 0;
  for (let x = -8; x < 24; x++) for (let z = -8; z < 24; z++) if (w.get(x, 64, z) !== AIR) left++;
  eq(left, 0, 'cells left');
});

test('two sources create a third over a solid floor, not over air', () => {
  const fill: Filler = (x, y, z) => (y === 64 && (z === 7 || z === 9) ? STONE : flat(x, y, z));
  const w = makeWorld(fill, grid(1));
  w.set(5, 64, 8, WATER);
  w.set(7, 64, 8, WATER);
  run(w, 2);
  eq(w.get(6, 64, 8), water(0), 'new source between two sources');
  eq(w.get(4, 64, 8), water(1), 'outside stays flowing');
  eq(w.get(8, 64, 8), water(1));
  // over a hole: no new source (it falls instead)
  const w2 = makeWorld((x, y, z) => (y === 64 && (z === 7 || z === 9) ? STONE : x === 6 && z === 8 && y === 63 ? AIR : flat(x, y, z)), grid(1));
  w2.set(5, 64, 8, WATER);
  w2.set(7, 64, 8, WATER);
  run(w2, 2);
  ok(w2.get(6, 64, 8) !== water(0), 'no source over a hole');
});

test('lava: step 2 up to level 6, slow ticks', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, LAVA);
  run(w, 1.45);
  eq(w.get(9, 64, 8), AIR, 'lava waits 1.5 s');
  run(w, 0.1);
  eq(w.get(9, 64, 8), lava(2));
  run(w, 8);
  for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) {
    const d = Math.abs(dx) + Math.abs(dz);
    const want = d === 0 ? lava(0) : d <= 3 ? lava(2 * d) : AIR;
    const v = w.get(8 + dx, 64, 8 + dz);
    if (v !== want) throw new Error(`lava at d=${d} got ${name(v)} want ${name(want)}`);
  }
  eq(w.getBlockLight(8, 64, 8), 15, 'lava glows');
  eq(w.getBlockLight(11, 65, 8), 14, 'flowing lava glows too (every lava cell emits 15)');
  assertLightMatchesReference(w);
});

test('lava source meeting water becomes obsidian', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, LAVA);
  w.set(10, 64, 8, WATER);
  run(w, 0.5);
  eq(w.get(8, 64, 8), B('obsidian'));
  eq(w.getBlockLight(8, 65, 8), 0, 'no glow left');
});

test('flowing lava meeting water becomes cobblestone', () => {
  const fill: Filler = (x, y, z) => (y === 64 && (z === 7 || z === 9) ? STONE : flat(x, y, z));
  const w = makeWorld(fill, grid(1));
  w.set(2, 64, 8, LAVA);
  run(w, 1.6);
  eq(w.get(3, 64, 8), lava(2));
  w.set(5, 64, 8, WATER);
  run(w, 0.3);
  eq(w.get(4, 64, 8), water(1));
  eq(w.get(3, 64, 8), B('cobblestone'));
  eq(w.get(2, 64, 8), LAVA, 'source behind is untouched');
});

test('lava flowing down into water makes stone; water falling on lava makes obsidian', () => {
  // a one-block water pool at (8,64,8) walled in
  const pool: Filler = (x, y, z) => (y === 64 && !(x === 8 && z === 8) && Math.abs(x - 8) <= 1 && Math.abs(z - 8) <= 1 ? STONE : flat(x, y, z));
  const w = makeWorld(pool, grid(1));
  w.set(8, 64, 8, WATER);
  w.set(8, 66, 8, LAVA);
  run(w, 3.2);
  eq(w.get(8, 65, 8), lava(0, true), 'falling lava');
  eq(w.get(8, 64, 8), STONE, 'water below turned to stone');
  const w2 = makeWorld(pool, grid(1));
  w2.set(8, 64, 8, LAVA);
  w2.set(8, 66, 8, WATER);
  run(w2, 0.6);
  eq(w2.get(8, 64, 8), B('obsidian'));
});

test('fluids wash away plants, snow layers and torches but not solid blocks', () => {
  const fill: Filler = (x, y, z) => (y === 64 && x === 10 && z === 8 ? B('short_grass') : y === 64 && x === 8 && z === 10 ? TORCH : y === 64 && x === 6 && z === 8 ? STONE : y === 64 && x === 8 && z === 6 ? B('snow') : flat(x, y, z));
  const w = makeWorld(fill, grid(1));
  eq(w.getBlockLight(8, 65, 10), 13, 'torch lit');
  w.set(8, 64, 8, WATER);
  run(w, 3);
  eq(w.get(10, 64, 8), water(2), 'grass washed away');
  eq(w.get(8, 64, 10), water(2), 'torch washed away');
  eq(w.get(8, 64, 6), water(2), 'snow layer replaced');
  eq(w.get(6, 64, 8), STONE, 'stone holds');
  eq(w.getBlockLight(8, 65, 10), 0, 'torch light gone');
  assertLightMatchesReference(w);
});

test('placed flowing water without a source dries up', () => {
  const w = makeWorld(flat, grid(1));
  w.set(8, 64, 8, water(3));
  run(w, 3);
  let n = 0;
  for (let x = 0; x < 16; x++) for (let z = 0; z < 16; z++) if (w.get(x, 64, z) !== AIR) n++;
  eq(n, 0, 'cells left');
});

test('work per tick is bounded when an ocean pours into a cave', () => {
  // a sea (y 60..70 water) over a huge cave; open a 32x32 hole in its floor at once
  const fill: Filler = (x, y, z) => {
    if (y === 0) return B('bedrock');
    if (y < 20) return STONE;
    if (y < 50) return AIR;           // cave
    if (y < 60) return STONE;
    if (y <= 70) return WATER;
    return AIR;
  };
  const w = makeWorld(fill, grid(1));
  for (let y = 59; y >= 50; y--) for (let x = -8; x < 24; x++) for (let z = -8; z < 24; z++) w.set(x, y, z, AIR);
  let maxUpdates = 0, maxMs = 0, total = 0, capped = 0;
  for (let i = 0; i < 600; i++) {
    const t0 = performance.now();
    w.tick(1 / 60);
    const ms = performance.now() - t0;
    if (i > 2) maxMs = Math.max(maxMs, ms);
    maxUpdates = Math.max(maxUpdates, w.fluids.lastUpdates);
    if (w.fluids.lastUpdates >= 512) capped++;
    total += w.fluids.lastUpdates;
  }
  console.log(`       flood: ${total} updates in 600 frames, max ${maxUpdates}/frame (${capped} frames at the cap), max ${maxMs.toFixed(1)} ms/frame, pending ${w.fluids.pending}`);
  ok(maxUpdates <= 512, 'update cap');
  ok(maxMs < 12, `frame time ${maxMs.toFixed(1)} ms`);
  ok(total > 5000, 'it does flow');
  let falling = 0;
  for (let y = 20; y < 50; y++) if ((w.get(1, y, 1) & 0x3ff) === ID.water) falling++;
  ok(falling >= 25, `water reached the cave floor (${falling})`);
});

test('fluid next to an unloaded chunk does not crash and stays put at the border', () => {
  const w = makeWorld(flat, [[0, 0]]);
  w.set(15, 64, 8, WATER);
  run(w, 3);
  eq(w.get(16, 64, 8), AIR, 'unloaded');
  eq(w.get(14, 64, 8), water(1));
  void GRASS;
});

test('fluid flow marks dirty sections but only direct edits call onBlockChange', () => {
  const w = makeWorld(flat, grid(1));
  const calls: number[] = [];
  w.onBlockChange = (_x, _y, _z, _o, n) => calls.push(n);
  w.set(8, 64, 8, WATER);
  eq(calls.length, 1, 'placing water notifies');
  w.dirtySections.clear();
  run(w, 0.3);
  eq(calls.length, 1, 'flow does not notify');
  ok(w.dirtySections.size > 0, 'flow marks sections dirty');
  ok(w.getChunk(0, 0)!.modified, 'flow marks the chunk modified');
});

summary('fluids');
