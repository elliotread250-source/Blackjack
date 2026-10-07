// Visual check: top-down map (colour by top block, shaded by height, water by depth) and a
// vertical cross-section (strata, caves, ores, lava). Usage:
//   node render.mjs <outDir> [seed] [x0] [z0] [sizeBlocks] [sectionZ]
import { Generator, BIOME_NAMES } from '../../src/world/generator';
import { BLOCKS, SHAPE, S, ID } from '../../src/blocks/registry';
import { writePNG } from './png';

const out = process.argv[2] ?? '.';
const seed = Number(process.argv[3] ?? 12345);
const X0 = Number(process.argv[4] ?? -512);
const Z0 = Number(process.argv[5] ?? -512);
const SIZE = Number(process.argv[6] ?? 1024);
const SEC_Z = Number(process.argv[7] ?? Z0 + SIZE / 2);

const hex = (s: string): [number, number, number] => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const COL = new Map<number, [number, number, number]>();
const named: Record<string, string> = {
  stone: '#7d7d7d', granite: '#9a6b58', diorite: '#bcbcbc', andesite: '#888888', deepslate: '#4a4a50', tuff: '#6c6d66',
  bedrock: '#222222', dirt: '#866043', coarse_dirt: '#77553b', podzol: '#6a4a26', mud: '#3c393d', clay: '#a0a6b3',
  sand: '#dbd3a0', sandstone: '#d0c48e', gravel: '#8a8380', snow_block: '#f6fafa', snow: '#f6fafa', ice: '#91b5fc',
  packed_ice: '#8eb4f0', snowy_grass_block: '#eef4f4', calcite: '#dfe0dc', cactus: '#4a8a2a', sugar_cane: '#94c06a',
  lily_pad: '#208030', pumpkin: '#e08a1c', oak_log: '#6b5232', birch_log: '#d8d6cf', spruce_log: '#3c2a15',
  cherry_log: '#38212c', dark_oak_log: '#3c2e1a', birch_leaves: '#6f9a48', spruce_leaves: '#3d5f3d', cherry_leaves: '#eab0c8',
  lava: '#e8641a', seagrass: '#2f7a3a',
  coal_ore: '#000000', deepslate_coal_ore: '#000000', iron_ore: '#e0b090', deepslate_iron_ore: '#e0b090',
  copper_ore: '#e0734d', deepslate_copper_ore: '#e0734d', gold_ore: '#fcee4b', deepslate_gold_ore: '#fcee4b',
  redstone_ore: '#ff1010', deepslate_redstone_ore: '#ff1010', lapis_ore: '#1f50e0', deepslate_lapis_ore: '#1f50e0',
  diamond_ore: '#5decf5', deepslate_diamond_ore: '#5decf5', emerald_ore: '#17dd62', deepslate_emerald_ore: '#17dd62',
};
for (const [k, v] of Object.entries(named)) COL.set(ID[k], hex(v));

const g = new Generator(seed);
const N = SIZE / 16;
const img = new Uint8Array(SIZE * SIZE * 3);
const heights = new Int16Array(SIZE * SIZE);
const biomeCount = new Map<number, number>();
const t0 = performance.now();
const cx0 = Math.floor(X0 / 16), cz0 = Math.floor(Z0 / 16);
for (let cz = 0; cz < N; cz++) {
  for (let cx = 0; cx < N; cx++) {
    const c = g.generate(cx0 + cx, cz0 + cz);
    for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      const col = (lz << 4) | lx;
      const px = cx * 16 + lx, pz = cz * 16 + lz;
      biomeCount.set(c.biome[col], (biomeCount.get(c.biome[col]) ?? 0) + 1);
      let y = 255, v = 0;
      for (; y > 0; y--) { v = c.blocks[(y << 8) | col] & 1023; if (v && !(SHAPE[v] === S.cross && v !== ID.sugar_cane)) break; }
      let rgb: [number, number, number];
      const t = col * 9;
      let depth = 0;
      if (v === ID.water) {
        let yy = y; while (yy > 0 && (c.blocks[(yy << 8) | col] & 1023) === ID.water || (c.blocks[(yy << 8) | col] & 1023) === ID.seagrass) yy--;
        depth = y - yy;
        const k = Math.max(0.35, 1 - depth / 30);
        rgb = [c.tint[t + 6] * k, c.tint[t + 7] * k, c.tint[t + 8] * k];
      } else if (v === ID.grass_block) rgb = [c.tint[t], c.tint[t + 1], c.tint[t + 2]];
      else if (v === ID.oak_leaves || v === ID.dark_oak_leaves) rgb = [c.tint[t + 3] * 0.78, c.tint[t + 4] * 0.78, c.tint[t + 5] * 0.78];
      else rgb = COL.get(v) ?? [255, 0, 255];
      heights[pz * SIZE + px] = v === ID.water ? 62 : y;
      const o = (pz * SIZE + px) * 3;
      img[o] = rgb[0]; img[o + 1] = rgb[1]; img[o + 2] = rgb[2];
    }
  }
}
const genMs = (performance.now() - t0) / (N * N);
// hillshade: compare with the north-west neighbour
for (let z = 0; z < SIZE; z++) for (let x = 0; x < SIZE; x++) {
  const h = heights[z * SIZE + x];
  const hn = heights[Math.max(0, z - 1) * SIZE + Math.max(0, x - 1)];
  const d = h - hn;
  const k = d > 0 ? 1.12 + Math.min(0.1, d * 0.02) : d < 0 ? 0.84 - Math.min(0.12, -d * 0.02) : 1;
  const alt = 0.9 + Math.min(0.2, Math.max(-0.1, (h - 64) / 400));
  const o = (z * SIZE + x) * 3;
  for (let k2 = 0; k2 < 3; k2++) img[o + k2] = Math.max(0, Math.min(255, img[o + k2] * k * alt));
}
writePNG(`${out}/map_${seed}.png`, SIZE, SIZE, img);
// 4x zoom of the centre 128x128 blocks, for close inspection
const ZS = Math.min(128, SIZE), Z4 = ZS * 4, zimg = new Uint8Array(Z4 * Z4 * 3), zo = (SIZE - ZS) >> 1;
for (let y = 0; y < Z4; y++) for (let x = 0; x < Z4; x++) {
  const si = ((zo + (y >> 2)) * SIZE + zo + (x >> 2)) * 3, di = (y * Z4 + x) * 3;
  zimg[di] = img[si]; zimg[di + 1] = img[si + 1]; zimg[di + 2] = img[si + 2];
}
writePNG(`${out}/zoom_${seed}.png`, Z4, Z4, zimg);

// cross-section along x at z = SEC_Z
const W = SIZE, H = 256;
const sec = new Uint8Array(W * H * 3);
const scz = Math.floor(SEC_Z / 16), lz = ((SEC_Z % 16) + 16) % 16;
for (let cx = 0; cx < N; cx++) {
  const c = g.generate(cx0 + cx, scz);
  for (let lx = 0; lx < 16; lx++) {
    const col = (lz << 4) | lx;
    const sx = cx * 16 + lx;
    const ht = g.heightAt(cx0 * 16 + sx, SEC_Z);
    for (let y = 0; y < 256; y++) {
      const v = c.blocks[(y << 8) | col] & 1023;
      let rgb: [number, number, number];
      if (v === 0) rgb = y > ht ? [150, 190, 250] : [92, 52, 36];
      else if (v === ID.water) rgb = [40, 80, 220];
      else if (v === ID.grass_block) rgb = [100, 170, 70];
      else if (v === ID.oak_leaves || v === ID.dark_oak_leaves) rgb = [60, 130, 40];
      else rgb = COL.get(v) ?? (SHAPE[v] === S.cross ? [150, 190, 250] : [255, 0, 255]);
      const o = ((255 - y) * W + sx) * 3;
      sec[o] = rgb[0]; sec[o + 1] = rgb[1]; sec[o + 2] = rgb[2];
    }
  }
}
writePNG(`${out}/section_${seed}.png`, W, H, sec);
// 3x zoom of the section: 256 blocks wide, y 0..159
{
  const ZW = Math.min(256, W), ZH = 160, K = 3, zx0 = (W - ZW) >> 1;
  const z = new Uint8Array(ZW * K * ZH * K * 3);
  for (let y = 0; y < ZH * K; y++) for (let x = 0; x < ZW * K; x++) {
    const sy = 255 - (ZH - 1) + Math.floor(y / K), sx = zx0 + Math.floor(x / K);
    const si = (sy * W + sx) * 3, di = (y * ZW * K + x) * 3;
    z[di] = sec[si]; z[di + 1] = sec[si + 1]; z[di + 2] = sec[si + 2];
  }
  writePNG(`${out}/sectionzoom_${seed}.png`, ZW * K, ZH * K, z);
}
const tot = SIZE * SIZE;
console.log(`seed ${seed}: ${N * N} chunks, ${genMs.toFixed(2)} ms/chunk`);
console.log([...biomeCount.entries()].sort((a, b) => b[1] - a[1]).map(([b, n]) => `${BIOME_NAMES[b]} ${(100 * n / tot).toFixed(1)}%`).join(', '));
