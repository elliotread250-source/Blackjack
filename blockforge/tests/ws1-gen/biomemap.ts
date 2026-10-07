// Large-scale biome overview: samples biomeAt/heightAt every STEP blocks over a square
// area and prints the biome area shares. Usage: node biomemap.mjs <outDir> [seed] [size] [step]
import { Generator, BIOME_NAMES } from '../../src/world/generator';
import { writePNG } from './png';

const out = process.argv[2] ?? '.';
const seed = Number(process.argv[3] ?? 12345);
const SIZE = Number(process.argv[4] ?? 4096);
const STEP = Number(process.argv[5] ?? 4);
const COLORS = ['#2b4fbf', '#1a2f8a', '#e8dc9c', '#8dc35a', '#3f8a2c', '#9fc98f', '#e3c46a', '#f4f8fa', '#8a8a8a', '#d8e4ee', '#5a6b35', '#f0a8c8', '#4f8fef', '#6f6f78'];
const rgb = COLORS.map((s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)]);
const g = new Generator(seed);
const N = SIZE / STEP;
const img = new Uint8Array(N * N * 3);
const counts = new Array(BIOME_NAMES.length).fill(0);
const hs = new Int16Array(N * N);
const t0 = performance.now();
for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
  const x = -SIZE / 2 + i * STEP, z = -SIZE / 2 + j * STEP;
  const h = g.heightAt(x, z);
  const b = g.biomeAt(x, z);
  counts[b]++;
  hs[j * N + i] = Math.max(h, 62);
  const o = (j * N + i) * 3;
  img[o] = rgb[b][0]; img[o + 1] = rgb[b][1]; img[o + 2] = rgb[b][2];
}
for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
  const d = hs[j * N + i] - hs[(j - 1) * N + i - 1];
  const k = d > 0 ? 1.1 : d < 0 ? 0.85 : 1;
  const o = (j * N + i) * 3;
  for (let c = 0; c < 3; c++) img[o + c] = Math.min(255, img[o + c] * k);
}
writePNG(`${out}/biomes_${seed}.png`, N, N, img);
const tot = N * N;
console.log(`seed ${seed} ${SIZE}x${SIZE} step ${STEP}: ${((performance.now() - t0) * 1000 / tot).toFixed(2)} us/sample`);
console.log(counts.map((n, b) => [n, b]).sort((a, b) => b[0] - a[0]).map(([n, b]) => `${BIOME_NAMES[b]} ${(100 * n / tot).toFixed(1)}%`).join(', '));
