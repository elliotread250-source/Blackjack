// WS1 world generation tests. Run:
//   npx esbuild tests/ws1-gen/gen.test.ts --bundle --platform=node --format=esm --outfile=<scratch>/gen.test.mjs && node --test <scratch>/gen.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Generator, BIOME, BIOME_NAMES, TREE_REACH } from '../../src/world/generator';
import { Noise, fbm2 } from '../../src/world/noise';
import { ID, BLOCKS, LEAVES, OCCLUDES, SOLID, FLUID } from '../../src/blocks/registry';
import { COLUMN_VOLUME, SEA_LEVEL } from '../../src/world/constants';

const idOf = (v: number) => v & 1023;
const LOGS = new Set(['oak_log', 'birch_log', 'spruce_log', 'cherry_log', 'dark_oak_log'].map((n) => ID[n]));
const SOIL = new Set(['dirt', 'grass_block', 'snowy_grass_block', 'podzol', 'coarse_dirt', 'mud', 'clay'].map((n) => ID[n]));

test('noise: seeded, deterministic, roughly in [-1, 1]', () => {
  const a = new Noise(1), b = new Noise(1), c = new Noise(2);
  let mn = 9, mx = -9, diff = 0;
  for (let i = 0; i < 20000; i++) {
    const x = i * 0.173, y = i * 0.0791;
    const v = a.noise2(x, y);
    assert.equal(v, b.noise2(x, y));
    if (v !== c.noise2(x, y)) diff++;
    mn = Math.min(mn, v, a.noise3(x, y, x - y)); mx = Math.max(mx, v, a.noise3(x, y, x - y));
  }
  assert.ok(mn >= -1.05 && mx <= 1.05, `range ${mn}..${mx}`);
  assert.ok(mn < -0.8 && mx > 0.8, `range too narrow ${mn}..${mx}`);
  assert.ok(diff > 19000);
  const f = fbm2(a, 3.3, 4.4, 4);
  assert.ok(f > -1 && f < 1);
});

test('determinism: same seed gives identical bytes, different seeds differ', () => {
  const coords = [[0, 0], [-1, 3], [17, -40], [-300, 211], [1000, 1000]];
  const g1 = new Generator(424242);
  const first = coords.map(([x, z]) => g1.generate(x, z));
  // a fresh instance, a different order, and interleaved spawn search must not change anything
  const g2 = new Generator(424242);
  g2.findSpawn();
  for (let i = coords.length - 1; i >= 0; i--) {
    const c = g2.generate(coords[i][0], coords[i][1]);
    assert.equal(c.cx, coords[i][0]);
    assert.equal(c.cz, coords[i][1]);
    assert.equal(c.blocks.length, COLUMN_VOLUME);
    assert.equal(c.biome.length, 256);
    assert.equal(c.tint.length, 256 * 9);
    assert.deepEqual(c.blocks, first[i].blocks, `blocks differ at ${coords[i]}`);
    assert.deepEqual(c.biome, first[i].biome);
    assert.deepEqual(c.tint, first[i].tint);
  }
  // regenerate the same chunk on the same instance
  assert.deepEqual(g1.generate(0, 0).blocks, first[0].blocks);
  const g3 = new Generator(424243);
  let same = 0;
  for (let i = 0; i < coords.length; i++) {
    const a = first[i].blocks, b = g3.generate(coords[i][0], coords[i][1]).blocks;
    let d = 0;
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) d++;
    if (d < 1000) same++;
  }
  assert.equal(same, 0, 'different seeds should give different terrain');
});

/** Assemble an NxN chunk area into one buffer for neighbourhood queries. */
function area(g: Generator, cx0: number, cz0: number, n: number) {
  const W = n * 16;
  const buf = new Uint16Array(W * W * 256);
  for (let cz = 0; cz < n; cz++) for (let cx = 0; cx < n; cx++) {
    const c = g.generate(cx0 + cx, cz0 + cz);
    for (let y = 0; y < 256; y++) for (let lz = 0; lz < 16; lz++) for (let lx = 0; lx < 16; lx++) {
      buf[(y * W + cz * 16 + lz) * W + cx * 16 + lx] = c.blocks[(y << 8) | (lz << 4) | lx];
    }
  }
  const get = (x: number, y: number, z: number) => (x < 0 || z < 0 || x >= W || z >= W || y < 0 || y > 255 ? -1 : idOf(buf[(y * W + z) * W + x]));
  return { W, get };
}

test('trees are continuous across chunk borders (3x3 areas, several biomes)', () => {
  // For a few seeds, find a chunk of every tree-bearing biome and test the area around it.
  const want = [BIOME.forest, BIOME.birch_forest, BIOME.plains, BIOME.cherry_grove, BIOME.snowy_tundra, BIOME.mountains, BIOME.swamp];
  const seeds: [number, number, number][] = [];
  for (const seed of [12345, 777]) {
    const g = new Generator(seed);
    const found = new Set<number>();
    for (let r = 0; r < 120 && found.size < want.length; r += 3) {
      for (let k = 0; k < 16 && found.size < want.length; k++) {
        const a = k * Math.PI / 8, cx = Math.round(Math.cos(a) * r), cz = Math.round(Math.sin(a) * r);
        // the whole 3x3 block of chunk centres must be the same biome so the area is full of trees
        const b = g.biomeAt(cx * 16 + 8, cz * 16 + 8);
        if (!want.includes(b) || found.has(b)) continue;
        if (b === BIOME.mountains && g.heightAt(cx * 16 + 8, cz * 16 + 8) > 112) continue;
        if (g.biomeAt(cx * 16 - 8, cz * 16 - 8) !== b || g.biomeAt(cx * 16 + 24, cz * 16 + 24) !== b) continue;
        found.add(b);
        seeds.push([seed, cx, cz]);
      }
    }
  }
  assert.ok(seeds.length >= 10, `found only ${seeds.length} test areas`);
  let trunks = 0, checked = 0, leavesChecked = 0;
  const fails: string[] = [];
  for (const [seed, cx0, cz0] of seeds) {
    const g = new Generator(seed);
    // 5x5 chunks: the inner 3x3 is checked, the ring gives full context
    const { W, get } = area(g, cx0 - 1, cz0 - 1, 5);
    const lo = 16, hi = W - 16;
    const isLeaf = (v: number) => v > 0 && LEAVES[v] === 1;
    const okAt = (v: number) => v !== 0 && v !== -1 && (isLeaf(v) || LOGS.has(v) || OCCLUDES[v] === 1);
    for (let z = lo; z < hi; z++) for (let x = lo; x < hi; x++) {
      for (let y = 40; y < 250; y++) {
        const v = get(x, y, z);
        if (!LOGS.has(v) || !SOIL.has(get(x, y - 1, z))) continue;
        // trunk base: walk up the vertical log run
        let top = y;
        while (get(x, top + 1, z) === v) top++;
        const th = top - y + 1;
        if (th < 3) continue;
        trunks++;
        // every side of the trunk must have canopy (or a log/solid block) near the top
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dz] of dirs) {
          let ok = false;
          for (let yy = top - 2; yy <= top + 1 && !ok; yy++) ok = okAt(get(x + dx, yy, z + dz));
          checked++;
          if (!ok) fails.push(`seed ${seed} trunk ${BLOCKS[v].name} at area (${x},${y},${z}) h${th} missing canopy dir ${dx},${dz}`);
          // small oak/birch: the radius-2 layers always reach two blocks out on the axes
          if ((v === ID.oak_log || v === ID.birch_log) && th <= 7) {
            let ok2 = false;
            for (let yy = top - 2; yy <= top - 1 && !ok2; yy++) ok2 = okAt(get(x + 2 * dx, yy, z + 2 * dz));
            checked++;
            if (!ok2) fails.push(`seed ${seed} ${BLOCKS[v].name} at (${x},${y},${z}) h${th} missing outer canopy ${dx},${dz}`);
          }
        }
      }
    }
    // no orphan leaves: every leaf must have a log nearby (a tree decided differently by two
    // chunks would leave canopy without its trunk)
    for (let z = lo; z < hi; z++) for (let x = lo; x < hi; x++) for (let y = 40; y < 250; y++) {
      if (!isLeaf(get(x, y, z))) continue;
      leavesChecked++;
      let found = false;
      for (let dy = -7; dy <= 3 && !found; dy++) for (let dz = -TREE_REACH; dz <= TREE_REACH && !found; dz++) for (let dx = -TREE_REACH; dx <= TREE_REACH && !found; dx++) {
        if (LOGS.has(get(x + dx, y + dy, z + dz))) found = true;
      }
      if (!found) fails.push(`seed ${seed} orphan leaf at (${x},${y},${z})`);
    }
  }
  assert.ok(trunks > 300, `too few trees in the sample (${trunks})`);
  assert.equal(fails.length, 0, fails.slice(0, 10).join('\n'));
  console.log(`  trees: ${seeds.length} areas, ${trunks} trunks, ${checked} canopy checks, ${leavesChecked} leaves checked`);
});

test('performance: average generate() under 15 ms per column', () => {
  const g = new Generator(777);
  for (let i = 0; i < 4; i++) g.generate(500 + i, 500); // JIT warm-up
  // 50 land columns (forest, plains, desert, tundra, swamp...) around spawn
  const t0 = performance.now();
  const N = 50;
  let land = 0;
  for (let i = 0; i < N; i++) {
    const cx = (i % 10) * 4 - 20, cz = Math.floor(i / 10) * 4 - 10;
    const c = g.generate(cx, cz);
    if (c.biome[136] !== BIOME.ocean && c.biome[136] !== BIOME.deep_ocean) land++;
  }
  const avg = (performance.now() - t0) / N;
  // mountains are the most expensive terrain (tall columns, deep caves): measure them too
  const t1 = performance.now();
  let mcount = 0;
  for (let i = 0; i < 20; i++) {
    const c = g.generate(94 + (i % 5), -96 + Math.floor(i / 5));
    if (c.biome[136] === BIOME.mountains || c.biome[136] === BIOME.snowy_peaks) mcount++;
  }
  const mtn = (performance.now() - t1) / 20;
  console.log(`  generate(): ${avg.toFixed(2)} ms average over ${N} columns (${land} land), ${mtn.toFixed(2)} ms in a mountain area (${mcount}/20 mountain)`);
  assert.ok(land >= 15 && mcount >= 10, `sample not representative: ${land} land, ${mcount} mountain`);
  assert.ok(mtn < 15, `mountains ${mtn} ms`);
  assert.ok(avg < 15, `average ${avg} ms`);
});

test('ores: only inside their height bands, deepslate variants below the deepslate line', () => {
  const g = new Generator(777);
  const bands: Record<string, [number, number]> = {
    coal: [5, 128], copper: [20, 96], iron: [5, 72], gold: [5, 32], redstone: [5, 16], lapis: [5, 32], diamond: [5, 16], emerald: [5, 100],
  };
  const count: Record<string, number> = {};
  const bandCount: Record<string, number[]> = {};
  const errors: string[] = [];
  const N = 64;
  let mountainChunks = 0;
  for (let i = 0; i < N; i++) {
    // half the chunks from a mountain region so emeralds can appear
    const cx = i < 32 ? (i % 8) * 7 - 28 : 92 + (i % 8), cz = i < 32 ? Math.floor(i / 8) * 7 - 14 : -98 + Math.floor((i - 32) / 8);
    const c = g.generate(cx, cz);
    let mtn = false;
    for (let k = 0; k < 256; k++) if (c.biome[k] === BIOME.mountains || c.biome[k] === BIOME.snowy_peaks) mtn = true;
    if (mtn) mountainChunks++;
    for (let y = 0; y < 256; y++) for (let k = 0; k < 256; k++) {
      const v = idOf(c.blocks[(y << 8) | k]);
      const name = BLOCKS[v].name;
      if (!name.endsWith('_ore')) continue;
      const deep = name.startsWith('deepslate_');
      const kind = name.replace('deepslate_', '').replace('_ore', '');
      const [a, b] = bands[kind];
      if (y < a || y > b) errors.push(`${name} at y=${y}`);
      if (deep && y >= 20) errors.push(`${name} above the deepslate line at y=${y}`);
      if (!deep && y < 12) errors.push(`${name} inside solid deepslate at y=${y}`);
      if (kind === 'emerald' && c.biome[k] !== BIOME.mountains && c.biome[k] !== BIOME.snowy_peaks) errors.push(`emerald outside mountains`);
      count[kind] = (count[kind] ?? 0) + 1;
      (bandCount[kind] ??= [0, 0, 0, 0, 0, 0, 0, 0])[Math.min(7, y >> 4)]++;
    }
  }
  assert.equal(errors.length, 0, errors.slice(0, 10).join('\n'));
  const per = (k: string) => (count[k] ?? 0) / N;
  console.log('  ore blocks per chunk:', Object.keys(bands).map((k) => `${k} ${per(k).toFixed(1)}`).join(', '));
  for (const k of Object.keys(bandCount)) console.log(`    ${k.padEnd(9)} by 16-block band: ${bandCount[k].join(' ')}`);
  assert.ok(per('coal') > per('iron') && per('iron') > per('gold'), 'coal > iron > gold');
  assert.ok(per('coal') > 40 && per('coal') < 400, `coal ${per('coal')}`);
  assert.ok(per('iron') > 15, `iron ${per('iron')}`);
  assert.ok(per('copper') > 10, `copper ${per('copper')}`);
  assert.ok(per('diamond') > 0.5 && per('diamond') < 15, `diamond ${per('diamond')}`);
  assert.ok(per('gold') > 1 && per('redstone') > 2 && per('lapis') > 0.5, 'rare ores present');
  assert.ok(mountainChunks > 0 && (count.emerald ?? 0) > 0, 'emeralds in mountains');
});

test('biomes: 4096x4096 sample has every biome, none dominates, patches are large', () => {
  for (const seed of [12345, 777]) {
    const g = new Generator(seed);
    const STEP = 8, N = 4096 / STEP;
    const counts = new Array(BIOME_NAMES.length).fill(0);
    const grid = new Uint8Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const b = g.biomeAt(-2048 + i * STEP, -2048 + j * STEP);
      grid[j * N + i] = b;
      counts[b]++;
    }
    const share = counts.map((c) => c / (N * N));
    console.log(`  seed ${seed}: ` + share.map((s, b) => [s, b]).sort((a, b) => b[0] - a[0]).map(([s, b]) => `${BIOME_NAMES[b]} ${(100 * s).toFixed(1)}%`).join(', '));
    share.forEach((s, b) => {
      assert.ok(s > 0.002, `${BIOME_NAMES[b]} missing (${(100 * s).toFixed(2)}%)`);
      assert.ok(s < 0.3, `${BIOME_NAMES[b]} dominates (${(100 * s).toFixed(1)}%)`);
    });
    // Large patches: label 4-connected components of equal biome. Thin features (rivers,
    // beaches, stony shores) are excluded; everything else should sit in big regions.
    const label = new Int32Array(N * N).fill(-1);
    const stack = new Int32Array(N * N);
    let tiny = 0, considered = 0, weighted = 0;
    for (let s0 = 0; s0 < N * N; s0++) {
      if (label[s0] >= 0) continue;
      const b = grid[s0];
      let sp = 0, size = 0;
      stack[sp++] = s0; label[s0] = s0;
      while (sp) {
        const p = stack[--sp]; size++;
        const px = p % N, pz = (p / N) | 0;
        if (px > 0 && label[p - 1] < 0 && grid[p - 1] === b) { label[p - 1] = s0; stack[sp++] = p - 1; }
        if (px < N - 1 && label[p + 1] < 0 && grid[p + 1] === b) { label[p + 1] = s0; stack[sp++] = p + 1; }
        if (pz > 0 && label[p - N] < 0 && grid[p - N] === b) { label[p - N] = s0; stack[sp++] = p - N; }
        if (pz < N - 1 && label[p + N] < 0 && grid[p + N] === b) { label[p + N] = s0; stack[sp++] = p + N; }
      }
      if (b === BIOME.river || b === BIOME.beach || b === BIOME.stony_shore) continue;
      considered += size;
      weighted += size * size;
      if (size < 16) tiny += size; // < ~32x32 blocks
    }
    const meanPatch = (weighted / considered) * STEP * STEP; // area-weighted, in blocks^2
    console.log(`    patches: area-weighted mean ${Math.round(Math.sqrt(meanPatch))} blocks across, ${(100 * tiny / considered).toFixed(2)}% of samples in tiny fragments`);
    assert.ok(Math.sqrt(meanPatch) > 300, 'biome patches should be hundreds of blocks wide');
    assert.ok(tiny / considered < 0.02, `biomes too fragmented: ${(100 * tiny / considered).toFixed(2)}%`);
  }
});

test('height field is continuous across chunk and biome borders', () => {
  const g = new Generator(4242);
  let pairs = 0, big = 0, borderPairs = 0, borderBig = 0;
  const calm = (b: number) => b !== BIOME.mountains && b !== BIOME.snowy_peaks && b !== BIOME.stony_shore;
  for (let z = -1024; z < 1024; z += 7) {
    let ph = g.heightAt(-1024, z), pb = g.biomeAt(-1024, z);
    for (let x = -1023; x < 1024; x++) {
      const h = g.heightAt(x, z), b = g.biomeAt(x, z);
      if (calm(b) && calm(pb)) {
        const jump = Math.abs(h - ph) > 3;
        pairs++; if (jump) big++;
        if (b !== pb) { borderPairs++; if (jump) borderBig++; }
      }
      ph = h; pb = b;
    }
  }
  console.log(`  ${pairs} neighbour pairs, ${(100 * big / pairs).toFixed(3)}% steps > 3; ${borderPairs} across biome borders, ${borderBig} steps > 3`);
  assert.ok(big / pairs < 0.005, 'too many cliffs outside mountains');
  assert.ok(borderPairs > 100);
  assert.ok(borderBig / borderPairs < 0.01, 'biome borders create cliffs');
  // chunk output agrees with heightAt (surface before caves) and biomeAt
  for (const [cx, cz] of [[0, 0], [-5, 7], [33, -12]]) {
    const c = g.generate(cx, cz);
    for (let k = 0; k < 256; k += 5) {
      const x = cx * 16 + (k & 15), z = cz * 16 + (k >> 4);
      const h = g.heightAt(x, z);
      assert.equal(c.biome[k], g.biomeAt(x, z));
      const top = idOf(c.blocks[(h << 8) | k]);
      // the surface block is solid ground unless a cave mouth opened it
      if (top !== 0 && top !== ID.lava) assert.ok(SOLID[top] || top === ID.ice || top === ID.packed_ice, `surface ${BLOCKS[top].name}`);
      for (let y = h + 1; y < 256; y++) {
        const v = idOf(c.blocks[(y << 8) | k]);
        if (v !== 0 && !LEAVES[v] && !LOGS.has(v)) {
          assert.ok(!OCCLUDES[v] || y === SEA_LEVEL || v === ID.cactus || v === ID.pumpkin, `terrain above heightAt: ${BLOCKS[v].name} at y=${y} h=${h}`);
        }
      }
    }
  }
});

test('oceans, water, caves and lava', () => {
  const g = new Generator(12345);
  let oceanCols = 0, floorOk = 0, lavaHigh = 0, waterAboveSea = 0, leaks = 0, lava = 0;
  for (let i = 0; i < 40; i++) {
    const cx = (i % 8) * 6 - 24, cz = Math.floor(i / 8) * 6 - 30;
    const c = g.generate(cx, cz);
    for (let k = 0; k < 256; k++) {
      const x = cx * 16 + (k & 15), z = cz * 16 + (k >> 4);
      const h = g.heightAt(x, z);
      const b = c.biome[k];
      if (b === BIOME.ocean || b === BIOME.deep_ocean) {
        oceanCols++;
        const f = idOf(c.blocks[(h << 8) | k]);
        if (f === ID.sand || f === ID.gravel || f === ID.clay || f === ID.dirt) floorOk++;
        if (b === BIOME.ocean) assert.ok(h >= 34 && h <= 61, `ocean floor ${h}`);
      }
      for (let y = 0; y < 256; y++) {
        const v = idOf(c.blocks[(y << 8) | k]);
        if (v === ID.lava) { lava++; if (y > 10) lavaHigh++; }
        if (v === ID.water && y > SEA_LEVEL) waterAboveSea++;
        // a water cell must never touch cave air below or beside it inside this column
        if (v === ID.water && y > 0 && idOf(c.blocks[((y - 1) << 8) | k]) === 0) leaks++;
      }
    }
  }
  assert.equal(lavaHigh, 0, 'lava only at y <= 10');
  assert.ok(lava > 0, 'some lava lakes');
  assert.equal(waterAboveSea, 0);
  assert.equal(leaks, 0, 'water over air');
  assert.ok(oceanCols > 1000);
  assert.ok(floorOk / oceanCols > 0.97, 'ocean floors are sand/gravel/clay');
});

test('findSpawn returns dry land, not in water or trees, for many seeds', () => {
  for (const seed of [1, 2, 3, 12345, 777, 2024, -99, 123456789, 42, 8]) {
    const g = new Generator(seed);
    const t = performance.now();
    const s = g.findSpawn();
    const ms = performance.now() - t;
    const h = g.heightAt(s.x, s.z);
    const b = g.biomeAt(s.x, s.z);
    assert.ok(h >= SEA_LEVEL + 1, `seed ${seed}: spawn height ${h}`);
    assert.ok(b !== BIOME.ocean && b !== BIOME.deep_ocean && b !== BIOME.river, `seed ${seed}: spawn biome ${BIOME_NAMES[b]}`);
    const c = g.generate(Math.floor(s.x / 16), Math.floor(s.z / 16));
    const k = ((s.z & 15) << 4) | (s.x & 15);
    const ground = idOf(c.blocks[(h << 8) | k]);
    assert.ok(SOLID[ground] && !LEAVES[ground], `seed ${seed}: ground ${BLOCKS[ground].name}`);
    for (let y = h + 1; y <= h + 2; y++) {
      const v = idOf(c.blocks[(y << 8) | k]);
      assert.ok(!SOLID[v] && !FLUID[v], `seed ${seed}: blocked by ${BLOCKS[v].name}`);
    }
    assert.ok(Math.hypot(s.x, s.z) < 3000, `seed ${seed}: spawn far away ${s.x},${s.z}`);
    assert.deepEqual(g.findSpawn(), s, 'cached');
    console.log(`  seed ${seed}: spawn ${s.x},${s.z} y=${h + 1} ${BIOME_NAMES[b]} (${ms.toFixed(0)} ms)`);
  }
});

test('decoration and tints', () => {
  const g = new Generator(12345);
  const seen = new Set<number>();
  for (const [cx, cz] of [[-14, 8], [-2, -6], [-23, -12], [10, 5], [-28, -26], [-46, -71], [-20, 40], [12, 30], [-31, -2], [-6, -26], [-10, -10], [15, -15]]) {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const c = g.generate(cx + dx, cz + dz);
      for (let i = 0; i < c.blocks.length; i++) seen.add(idOf(c.blocks[i]));
      for (let k = 0; k < 256 * 9; k++) assert.ok(c.tint[k] >= 0 && c.tint[k] <= 255);
    }
  }
  const want = ['short_grass', 'fern', 'dandelion', 'poppy', 'oak_log', 'oak_leaves', 'birch_log', 'spruce_log', 'cherry_leaves', 'cactus', 'dead_bush', 'sugar_cane', 'seagrass', 'snow', 'ice', 'snowy_grass_block', 'sand', 'sandstone', 'gravel', 'clay', 'lily_pad', 'mud', 'deepslate', 'tuff', 'granite', 'diorite', 'andesite', 'bedrock', 'lava', 'water'];
  const missing = want.filter((n) => !seen.has(ID[n]));
  assert.deepEqual(missing, [], `never generated: ${missing.join(', ')}`);
  // swamp water is murky green, ocean water blue
  const swampy = { r: 0, n: 0 }, oceany = { b: 0, n: 0 };
  for (let i = 0; i < 30; i++) {
    const c = g.generate(i * 9 - 140, i * 5 - 80);
    for (let k = 0; k < 256; k++) {
      if (c.biome[k] === BIOME.swamp) { swampy.r += c.tint[k * 9 + 6 + 1] - c.tint[k * 9 + 6 + 2]; swampy.n++; }
      if (c.biome[k] === BIOME.ocean) { oceany.b += c.tint[k * 9 + 8] - c.tint[k * 9 + 6]; oceany.n++; }
    }
  }
  if (swampy.n) assert.ok(swampy.r / swampy.n > -40, 'swamp water should not be bright blue');
  if (oceany.n) assert.ok(oceany.b / oceany.n > 100, 'ocean water is blue');
});
