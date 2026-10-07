// Lighting benchmark: World.addChunk on realistic columns (rolling terrain, caves open to the
// surface, trees, a sea, torches, lava) and typical World.set edits. Target: addChunk well
// under 8 ms on average.
import { Chunk } from '../../src/world/chunk';
import { World } from '../../src/world/world';
import type { GenChunk } from '../../src/types';
import { genChunk, terrain, AIR, STONE, TORCH, GLOWSTONE, WATER as WATER_V, rng, assertLightMatchesReference } from './helpers';

const R = 4; // 9x9 columns
const seeds = [7, 1234];
let worst = 0;
for (const seed of seeds) {
  const fill = terrain(seed);
  const t0 = performance.now();
  const gens: GenChunk[] = [];
  for (let cz = -R; cz <= R; cz++) for (let cx = -R; cx <= R; cx++) gens.push(genChunk(cx, cz, fill));
  gens.sort((a, b) => (a.cx ** 2 + a.cz ** 2) - (b.cx ** 2 + b.cz ** 2));   // nearest first, like the game
  console.log(`seed ${seed}: generated ${gens.length} test columns in ${(performance.now() - t0).toFixed(0)} ms`);

  const times: number[] = [];
  let lastWorld: World | null = null;
  for (let pass = 0; pass < 4; pass++) {
    const w = new World(seed);
    for (const g of gens) {
      const c = new Chunk({ cx: g.cx, cz: g.cz, blocks: g.blocks.slice(), biome: g.biome, tint: g.tint });
      const s = performance.now();
      w.addChunk(c);
      const ms = performance.now() - s;
      if (pass > 0) times.push(ms);   // pass 0 warms the JIT
    }
    lastWorld = w;
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const p95 = times[Math.floor(times.length * 0.95)], max = times[times.length - 1];
  worst = Math.max(worst, avg);
  console.log(`  addChunk: avg ${avg.toFixed(2)} ms, median ${times[times.length >> 1].toFixed(2)} ms, p95 ${p95.toFixed(2)} ms, max ${max.toFixed(2)} ms over ${times.length} adds`);

  // edits on the loaded world
  const w = lastWorld!;
  const r = rng(seed);
  const kinds: [string, () => number][] = [['stone', () => STONE], ['air', () => AIR], ['torch', () => TORCH], ['glowstone', () => GLOWSTONE]];
  for (const [label, val] of kinds) {
    const et: number[] = [];
    for (let i = 0; i < 300; i++) {
      const x = Math.floor(r() * 64) - 32, z = Math.floor(r() * 64) - 32;
      const y = w.topY(x, z) + (label === 'air' ? 0 : 1);
      const s = performance.now();
      w.set(x, y, z, val());
      et.push(performance.now() - s);
    }
    et.sort((a, b) => a - b);
    console.log(`  set(${label}) at the surface: avg ${(et.reduce((s, t) => s + t, 0) / et.length).toFixed(3)} ms, max ${et[et.length - 1].toFixed(2)} ms`);
  }
  // remove the torches/glowstone again (removal BFS)
  let rem = 0, remMs = 0;
  for (const c of w.chunks.values()) {
    for (let i = 0; i < 65536; i++) {
      const v = c.blocks[i];
      if (v === TORCH || v === GLOWSTONE) {
        const s = performance.now();
        w.set(c.cx * 16 + (i & 15), i >> 8, c.cz * 16 + ((i >> 4) & 15), AIR);
        remMs += performance.now() - s; rem++;
        if (rem >= 300) break;
      }
    }
    if (rem >= 300) break;
  }
  console.log(`  removing ${rem} emitters: avg ${(remMs / rem).toFixed(3)} ms`);
  const small = new World(seed);
  for (const g of gens.filter((g) => Math.abs(g.cx) <= 1 && Math.abs(g.cz) <= 1)) small.addChunk(new Chunk({ cx: g.cx, cz: g.cz, blocks: g.blocks.slice(), biome: g.biome, tint: g.tint }));
  assertLightMatchesReference(small, 'bench world');
}
// harder column types
const scenarios: [string, (x: number, y: number, z: number) => number][] = [
  ['deep ocean (water 20..62)', (_x, y) => (y < 20 ? STONE : y <= 62 ? WATER_V : AIR)],
  ['overhang: roof at 120 over a 50-high open space, lit from the sides only', (x, y, z) => (y < 60 ? STONE : y === 120 && ((x & 63) < 56 && (z & 63) < 56) ? STONE : AIR)],
];
for (const [label, fill] of scenarios) {
  const gens: GenChunk[] = [];
  for (let cz = -2; cz <= 2; cz++) for (let cx = -2; cx <= 2; cx++) gens.push(genChunk(cx, cz, fill));
  gens.sort((a, b) => (a.cx ** 2 + a.cz ** 2) - (b.cx ** 2 + b.cz ** 2));
  const times: number[] = [];
  for (let pass = 0; pass < 3; pass++) {
    const w = new World(1);
    for (const g of gens) {
      const c = new Chunk({ cx: g.cx, cz: g.cz, blocks: g.blocks.slice(), biome: g.biome, tint: g.tint });
      const s = performance.now();
      w.addChunk(c);
      if (pass > 0) times.push(performance.now() - s);
    }
  }
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  worst = Math.max(worst, avg);
  console.log(`${label}: addChunk avg ${avg.toFixed(2)} ms, max ${Math.max(...times).toFixed(2)} ms`);
}

console.log(worst < 8 ? `PASS: addChunk average ${worst.toFixed(2)} ms < 8 ms` : `FAIL: addChunk average ${worst.toFixed(2)} ms`);
if (worst >= 8) process.exitCode = 1;
