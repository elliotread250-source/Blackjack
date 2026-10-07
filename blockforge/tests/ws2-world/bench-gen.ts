// addChunk benchmark + reference check on columns from the real generator (WS1).
// Run: sh tests/ws2-world/run.sh bench-gen
import { Generator } from '../../src/world/generator';
import { Chunk } from '../../src/world/chunk';
import { World } from '../../src/world/world';
import type { GenChunk } from '../../src/types';
import { assertLightMatchesReference, sliceImage, SCRATCH } from './helpers';

const seeds = [1, 20251007, -42];
let worst = 0;
for (const seed of seeds) {
  const gen = new Generator(seed);
  const sp = gen.findSpawn();
  const ccx = Math.floor(sp.x / 16), ccz = Math.floor(sp.z / 16);
  const R = 4;
  const gens: GenChunk[] = [];
  const g0 = performance.now();
  for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) gens.push(gen.generate(ccx + dx, ccz + dz));
  const genMs = (performance.now() - g0) / gens.length;
  gens.sort((a, b) => ((a.cx - ccx) ** 2 + (a.cz - ccz) ** 2) - ((b.cx - ccx) ** 2 + (b.cz - ccz) ** 2));
  const times: number[] = [];
  let last: World | null = null;
  for (let pass = 0; pass < 4; pass++) {
    const w = new World(seed);
    for (const g of gens) {
      const c = new Chunk({ cx: g.cx, cz: g.cz, blocks: g.blocks.slice(), biome: g.biome, tint: g.tint });
      const t = performance.now();
      w.addChunk(c);
      if (pass > 0) times.push(performance.now() - t);
    }
    last = w;
  }
  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  worst = Math.max(worst, avg);
  console.log(`seed ${seed} (spawn ${sp.x},${sp.z}): generate ${genMs.toFixed(1)} ms/column; addChunk avg ${avg.toFixed(2)} ms, p95 ${times[Math.floor(times.length * 0.95)].toFixed(2)} ms, max ${times[times.length - 1].toFixed(2)} ms`);
  const small = new World(seed);
  for (const g of gens) if (Math.abs(g.cx - ccx) <= 1 && Math.abs(g.cz - ccz) <= 1) small.addChunk(new Chunk({ cx: g.cx, cz: g.cz, blocks: g.blocks.slice(), biome: g.biome, tint: g.tint }));
  assertLightMatchesReference(small, `seed ${seed}`);
  sliceImage(last!, sp.x - 40, sp.x + 40, 20, 110, sp.z, 4, `${SCRATCH}/gen-seed${seed}.png`);
}
console.log(worst < 8 ? `PASS: addChunk average ${worst.toFixed(2)} ms < 8 ms on generated terrain` : `FAIL ${worst.toFixed(2)} ms`);
if (worst >= 8) process.exitCode = 1;
