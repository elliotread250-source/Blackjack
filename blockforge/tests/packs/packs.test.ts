// Resource pack filters: alpha is preserved exactly, tinted pixels stay grey, every pack
// changes the textures, and preview sheets are written for eyeballing. Run:
//   npx esbuild tests/packs/packs.test.ts --bundle --platform=node --format=esm --outfile=$OUT/packs.mjs && node $OUT/packs.mjs $OUT
import { RESOURCE_PACKS, packTile, baseTexture, tileInfo, filterTile } from '../../src/blocks/packs';
import { TEXTURE_NAMES } from '../../src/blocks/registry';
import { DEFAULT_TINT } from '../../src/blocks/textures';
import { writePNG } from '../ws1-gen/png';

const out = process.argv[2] || '.';
let failures = 0, passes = 0;
function check(cond: boolean, msg: string) { if (cond) passes++; else { failures++; if (failures < 30) console.log('FAIL:', msg); } }

const t0 = Date.now();
for (const p of RESOURCE_PACKS) {
  const ts = Date.now();
  let changed = 0;
  for (let t = 0; t < TEXTURE_NAMES.length; t++) {
    const base = baseTexture(TEXTURE_NAMES[t]);
    const px = packTile(t, p.id);
    const info = tileInfo(t);
    check(px.length === 1024, `${p.id} ${TEXTURE_NAMES[t]} size`);
    let alphaOk = true, greyOk = true, diff = 0;
    for (let i = 0; i < 256; i++) {
      if (px[i * 4 + 3] !== base[i * 4 + 3]) alphaOk = false;
      const baseGrey = base[i * 4] === base[i * 4 + 1] && base[i * 4 + 1] === base[i * 4 + 2];
      const tinted = info.tint === 1 || (info.tint === 2 && base[i * 4 + 3] < 128);
      if (tinted && baseGrey && info.kind === 0 && !(Math.abs(px[i * 4] - px[i * 4 + 1]) <= 1 && Math.abs(px[i * 4 + 1] - px[i * 4 + 2]) <= 1)) greyOk = false;
      diff += Math.abs(px[i * 4] - base[i * 4]) + Math.abs(px[i * 4 + 1] - base[i * 4 + 1]) + Math.abs(px[i * 4 + 2] - base[i * 4 + 2]);
    }
    check(alphaOk, `${p.id} ${TEXTURE_NAMES[t]} keeps alpha`);
    check(greyOk, `${p.id} ${TEXTURE_NAMES[t]} tinted grey pixels stay grey`);
    if (diff > 0) changed++;
  }
  if (p.id === 'default') check(changed === 0, 'default pack is unchanged');
  else check(changed > TEXTURE_NAMES.length * 0.8, `${p.id} changes most textures (${changed}/${TEXTURE_NAMES.length})`);
  console.log(`${p.id}: ${TEXTURE_NAMES.length} tiles in ${Date.now() - ts} ms, ${changed} changed`);
}
// Filter purity: same input -> same output, input untouched.
{
  const base = baseTexture('stone');
  const copy = base.slice();
  const a = filterTile(base, 'retro', tileInfo(TEXTURE_NAMES.indexOf('stone')));
  const b = filterTile(base, 'retro', tileInfo(TEXTURE_NAMES.indexOf('stone')));
  check(a.every((v, i) => v === b[i]), 'filters are deterministic');
  check(copy.every((v, i) => v === base[i]), 'filters do not modify their input');
}
console.log(`all packs in ${Date.now() - t0} ms`);

// Preview sheet: rows = packs, columns = sample textures (tinted like in a plains biome),
// each drawn 2x2 tiled at scale 4 so seams show.
const SAMPLES: [string, number[] | null, boolean][] = [
  ['grass_top', DEFAULT_TINT.grass, true], ['grass_side', DEFAULT_TINT.grass, true], ['dirt', null, false], ['stone', null, false],
  ['cobblestone', null, false], ['oak_planks', null, false], ['oak_log', null, false], ['oak_leaves', DEFAULT_TINT.foliage, false],
  ['sand', null, false], ['bricks', null, false], ['stone_bricks', null, false], ['ore_stone_diamond', null, false],
  ['water', DEFAULT_TINT.water, false], ['glass', null, false], ['flower_poppy', null, false], ['wool_red', null, false],
  ['cherry_leaves', null, false], ['gold_block', null, false], ['spruce_planks', null, false], ['terracotta_orange', null, false],
];
const S = 4, CELL = 16 * 2 * S + 8;
const W = SAMPLES.length * CELL + 8, H = RESOURCE_PACKS.length * CELL + 8;
const rgb = new Uint8Array(W * H * 3).fill(60);
RESOURCE_PACKS.forEach((p, row) => {
  SAMPLES.forEach(([name, tint, mask], col) => {
    const t = TEXTURE_NAMES.indexOf(name);
    if (t < 0) { console.log('no texture', name); return; }
    const px = packTile(t, p.id);
    const kind = tileInfo(t).kind;
    for (let y = 0; y < 32 * S; y++) for (let x = 0; x < 32 * S; x++) {
      const tx = Math.floor(x / S) & 15, ty = Math.floor(y / S) & 15;
      const i = (ty * 16 + tx) * 4;
      let r = px[i], g = px[i + 1], b = px[i + 2];
      const a = px[i + 3];
      if (kind !== 0 && a < 128 && kind === 1) continue;
      if (tint && (!mask || a < 128) && (kind !== 0 || !mask || a < 128)) {
        const f = mask ? 1 - a / 255 : 1;
        r = r * (1 - f + f * tint[0] / 255); g = g * (1 - f + f * tint[1] / 255); b = b * (1 - f + f * tint[2] / 255);
      }
      const X = 8 + col * CELL + x, Y = 8 + row * CELL + y;
      const o = (Y * W + X) * 3;
      if (kind === 2) { const al = Math.max(a, 60) / 255; rgb[o] = rgb[o] * (1 - al) + r * al; rgb[o + 1] = rgb[o + 1] * (1 - al) + g * al; rgb[o + 2] = rgb[o + 2] * (1 - al) + b * al; }
      else { rgb[o] = r; rgb[o + 1] = g; rgb[o + 2] = b; }
    }
  });
});
writePNG(`${out}/packs-preview.png`, W, H, rgb);
console.log(`wrote ${out}/packs-preview.png`);
console.log(failures ? `${failures} FAILED, ${passes} passed` : `ALL PASSED (${passes} checks)`);
process.exit(failures ? 1 : 0);
