// Lighting tests: run with tests/ws2-world/run.sh
import { Chunk } from '../../src/world/chunk';
import { World } from '../../src/world/world';
import { LOPAC, LMASK } from '../../src/world/light';
import { chunkKey, sectionKey, sectionKeyChunk, sectionKeyY, chunkKeyX, chunkKeyZ, COLUMN_VOLUME } from '../../src/world/constants';
import {
  test, summary, eq, ok, B, AIR, STONE, GRASS, GLASS, TORCH, GLOWSTONE, OAK_LEAVES, WATER, LAVA,
  genChunk, flat, makeWorld, grid, assertLightMatchesReference, rng, terrain, sliceImage, SCRATCH, type Filler,
} from './helpers';

console.log('WS2 lighting');

const sky = (w: World, x: number, y: number, z: number) => w.getSky(x, y, z);
const blk = (w: World, x: number, y: number, z: number) => w.getBlockLight(x, y, z);

// ------------------------------------------------------------------ tables
test('per-value opacity tables', () => {
  eq(LOPAC[STONE], 15, 'stone');
  eq(LOPAC[AIR], 0, 'air');
  eq(LOPAC[GLASS], 0, 'glass');
  eq(LOPAC[OAK_LEAVES], 1, 'leaves');
  eq(LOPAC[WATER], 1, 'water');
  eq(LOPAC[B('ice')], 1, 'ice');
  eq(LOPAC[LAVA], 0, 'lava');
  eq(LOPAC[B('stone_slab', 2)], 15, 'double slab');
  eq(LOPAC[B('stone_slab', 0)], 0, 'bottom slab');
  eq(LMASK[B('stone_slab', 0)], 1 << 3, 'bottom slab covers its bottom face');
  eq(LMASK[B('stone_slab', 1)], 1 << 2, 'top slab covers its top face');
  // stairs facing north (meta 0), upright: bottom + north (-Z, face 5)
  eq(LMASK[B('oak_stairs', 0)], (1 << 3) | (1 << 5), 'stairs N');
  eq(LMASK[B('oak_stairs', 1 | 4)], (1 << 2) | (1 << 0), 'upside-down stairs E');
});

// ------------------------------------------------------------------ basics
test('flat chunk: open air is 15, ground is dark, no block light', () => {
  const w = makeWorld(flat, [[0, 0]]);
  eq(sky(w, 5, 64, 5), 15); eq(sky(w, 5, 200, 5), 15); eq(sky(w, 5, 255, 5), 15);
  eq(sky(w, 5, 63, 5), 0, 'grass block'); eq(sky(w, 5, 10, 5), 0);
  eq(blk(w, 5, 64, 5), 0);
  eq(w.getLight(5, 300, 5), 0xf0, 'above world');
  eq(w.getLight(100, 64, 100), 0xf0, 'unloaded');
  ok(w.getChunk(0, 0)!.lit, 'lit flag');
  assertLightMatchesReference(w);
});

test('overhang: light under a roof decays sideways from the opening', () => {
  // roof at y=70 over z 0..7 (all x), open for z >= 8; single chunk so no light from outside
  const fill: Filler = (x, y, z) => (y === 70 && z <= 7 ? STONE : flat(x, y, z));
  const w = makeWorld(fill, [[0, 0]]);
  for (let z = 0; z <= 7; z++) for (const y of [64, 67, 69]) eq(sky(w, 8, y, z), 7 + z, `under roof z=${z} y=${y}`);
  eq(sky(w, 8, 64, 8), 15, 'opening'); eq(sky(w, 8, 71, 3), 15, 'above roof'); eq(sky(w, 8, 70, 3), 0, 'roof');
  assertLightMatchesReference(w);
  sliceImage(w, 0, 15, 58, 74, 8, 16, `${SCRATCH}/overhang-z-slice.png`, 'z');
});

test('torch falloff 14,13,12... and removal back to 0', () => {
  // closed stone world with a cavity of 31x7x31 around (8, 30, 8)
  const fill: Filler = (x, y, z) => (Math.abs(x - 8) <= 15 && Math.abs(z - 8) <= 15 && y >= 27 && y <= 33 ? AIR : y < 100 ? STONE : AIR);
  const w = makeWorld(fill, grid(1));
  eq(blk(w, 8, 30, 8), 0);
  w.set(8, 30, 8, TORCH);
  for (let d = 0; d <= 14; d++) eq(blk(w, 8 + d, 30, 8), 14 - d, `east d=${d}`);
  for (let d = 0; d <= 14; d++) eq(blk(w, 8 - d, 30, 8), 14 - d, `west d=${d} (crosses into chunk -1)`);
  eq(blk(w, 8 + 2, 32, 8 + 3), 14 - 7, 'manhattan');
  eq(blk(w, 8, 33, 8), 11, 'up');
  eq(blk(w, 8, 34, 8), 0, 'stone above');
  assertLightMatchesReference(w, 'after torch');
  w.set(8, 30, 8, AIR);
  for (const c of w.chunks.values()) for (let i = 0; i < COLUMN_VOLUME; i++) if ((c.light[i] & 15) !== 0) throw new Error('block light left after removing the torch');
  assertLightMatchesReference(w, 'after removal');
});

test('glowstone holds 15 and lights neighbours with 14; opaque emitter in a wall', () => {
  const w = makeWorld(flat, [[0, 0]]);
  w.set(4, 63, 4, GLOWSTONE);
  eq(blk(w, 4, 63, 4), 15); eq(blk(w, 4, 64, 4), 14); eq(blk(w, 5, 63, 4), 0, 'grass beside is opaque');
  eq(blk(w, 4, 64 + 3, 4 + 2), 9);
  w.set(4, 63, 4, GRASS);
  eq(blk(w, 4, 64, 4), 0);
  assertLightMatchesReference(w);
});

test('digging a shaft lets sunlight in vertically at 15; capping it darkens below', () => {
  const w = makeWorld(flat, [[0, 0]]);
  for (let y = 63; y >= 40; y--) w.set(7, y, 7, AIR);
  for (let y = 63; y >= 40; y--) eq(sky(w, 7, y, 7), 15, `shaft y=${y}`);
  // side pocket at the bottom receives 14
  w.set(8, 40, 7, AIR);
  eq(sky(w, 8, 40, 7), 14, 'pocket');
  assertLightMatchesReference(w, 'shaft');
  w.set(7, 63, 7, STONE);
  for (let y = 62; y >= 40; y--) eq(sky(w, 7, y, 7), 0, `capped y=${y}`);
  eq(sky(w, 8, 40, 7), 0, 'pocket after capping');
  assertLightMatchesReference(w, 'capped');
});

test('placing a block over an open pit: below decays sideways', () => {
  const w = makeWorld(flat, [[0, 0]]);
  for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) for (let y = 63; y >= 58; y--) w.set(x, y, z, AIR);
  eq(sky(w, 7, 58, 7), 15);
  w.set(7, 64, 7, STONE);
  eq(sky(w, 7, 63, 7), 14, 'just under the new block');
  eq(sky(w, 7, 58, 7), 14, 'pit centre column still lit from its sides at 14');
  eq(sky(w, 6, 58, 6), 15);
  assertLightMatchesReference(w);
});

test('leaves decay sky light by 1; water by 1 per block', () => {
  const fill: Filler = (x, y, z) => (y === 70 ? OAK_LEAVES : flat(x, y, z));
  const w = makeWorld(fill, [[0, 0]]);
  eq(sky(w, 8, 71, 8), 15); eq(sky(w, 8, 70, 8), 14, 'leaves cell'); eq(sky(w, 8, 69, 8), 13, 'below canopy');
  eq(sky(w, 8, 64, 8), 8, 'ground under a solid canopy');
  assertLightMatchesReference(w, 'leaves');
  const sea: Filler = (x, y, z) => (y < 40 ? STONE : y <= 62 ? WATER : AIR);
  const w2 = makeWorld(sea, [[0, 0]]);
  eq(sky(w2, 3, 62, 3), 14, 'sea surface'); eq(sky(w2, 3, 61, 3), 13); eq(sky(w2, 3, 50, 3), 2); eq(sky(w2, 3, 48, 3), 0);
  assertLightMatchesReference(w2, 'sea');
  // placing a single leaves block over open ground
  const w3 = makeWorld(flat, grid(1));
  w3.set(8, 66, 8, OAK_LEAVES);
  eq(sky(w3, 8, 66, 8), 14); eq(sky(w3, 8, 65, 8), 14, 'side light refills under a single leaf');
  w3.set(8, 66, 8, AIR);
  eq(sky(w3, 8, 65, 8), 15, 'back to direct sun');
  assertLightMatchesReference(w3, 'single leaf');
});

test('slab and stair roofs shade like the original', () => {
  const fill: Filler = (x, y, z) => (y === 70 && z <= 7 ? B('stone_slab', 0) : flat(x, y, z));
  const w = makeWorld(fill, [[0, 0]]);
  eq(sky(w, 8, 70, 3), 15, 'bottom slab cell itself is lit from above');
  eq(sky(w, 8, 69, 3), 7 + 3, 'below a bottom-slab roof: only side light');
  const fill2: Filler = (x, y, z) => (y === 70 && z <= 7 ? B('stone_slab', 1) : flat(x, y, z));
  const w2 = makeWorld(fill2, [[0, 0]]);
  eq(sky(w2, 8, 70, 3), 7 + 3, 'top slab is lit from the side only');
  eq(sky(w2, 8, 69, 3), 7 + 3, 'below it: side light, same as a full roof');
  w2.set(8, 70, 3, B('stone_slab', 2));
  eq(sky(w2, 8, 70, 3), 0, 'double slab is opaque');
  assertLightMatchesReference(w2, 'slabs');
});

test('light crosses chunk borders; A then B equals B then A', () => {
  const fill: Filler = (x, y, z) => {
    if (y === 70 && x >= 4 && x <= 27 && z >= -6 && z <= 9) return STONE;  // roof over the border x=16
    if (x === 15 && z === 2 && y === 64) return TORCH;
    if (x === 18 && z === 5 && y === 66) return GLOWSTONE;
    if (y === 66 && x >= 20 && x <= 24 && z >= 0 && z <= 4) return OAK_LEAVES;
    return flat(x, y, z);
  };
  const coords: [number, number][] = [[0, 0], [1, 0], [0, -1], [1, -1]];
  const a = makeWorld(fill, coords);
  const b = makeWorld(fill, coords.slice().reverse());
  const c = makeWorld(fill, [[1, -1], [0, 0], [1, 0], [0, -1]]);
  for (const [cx, cz] of coords) {
    const k = chunkKey(cx, cz);
    const la = a.chunks.get(k)!.light, lb = b.chunks.get(k)!.light, lc = c.chunks.get(k)!.light;
    for (let i = 0; i < COLUMN_VOLUME; i++) {
      if (la[i] !== lb[i] || la[i] !== lc[i]) throw new Error(`order dependent light at chunk ${cx},${cz} idx ${i}: ${la[i]} ${lb[i]} ${lc[i]}`);
    }
  }
  eq(blk(a, 16, 64, 2), 13, 'torch light in the next chunk');
  eq(blk(a, 15 - 13, 64, 2), 1);
  assertLightMatchesReference(a);
  sliceImage(a, 0, 31, 60, 72, 2, 12, `${SCRATCH}/border-roof-slice.png`);
});

test('pulling light from a loaded neighbour and pushing into it', () => {
  // A is a sealed box with a torch next to its east wall-less border; B is open sky.
  const fill: Filler = (x, y, z) => {
    if (x < 16) { if (y >= 64 && y <= 70 && x >= 2 && z >= 2 && z <= 13) return y === 70 || x === 2 || z === 2 || z === 13 ? STONE : AIR; }
    return flat(x, y, z);
  };
  const w = new World(1);
  w.addChunk(new Chunk(genChunk(0, 0, fill)));
  eq(sky(w, 10, 66, 8), 0, 'A alone: the box is dark (its open side faces an unloaded chunk)');
  w.addChunk(new Chunk(genChunk(1, 0, fill)));
  eq(sky(w, 15, 66, 8), 14, 'sky light from B flows into A');
  eq(sky(w, 10, 66, 8), 9);
  w.set(20, 66, 8, TORCH);
  eq(blk(w, 15, 66, 8), 9, 'torch in B lights A');
  assertLightMatchesReference(w);
});

test('fuzz: random edits keep light identical to a full recompute (3x3 chunks)', () => {
  const w = makeWorld(terrain(7), grid(1));
  assertLightMatchesReference(w, 'initial');
  const r = rng(12345);
  const palette = [AIR, AIR, AIR, STONE, STONE, GLASS, TORCH, GLOWSTONE, OAK_LEAVES, WATER, LAVA, B('stone_slab', 0), B('stone_slab', 1), B('oak_stairs', 2), B('oak_stairs', 5), B('ice'), B('lantern')];
  for (let round = 0; round < 12; round++) {
    for (let k = 0; k < 40; k++) {
      const x = Math.floor(r() * 40) - 12, z = Math.floor(r() * 40) - 12;
      const top = w.topY(x, z);
      const y = Math.max(1, Math.min(254, top + Math.floor(r() * 12) - 8));
      if (r() < 0.25) {
        // carve or fill a small box (caves, roofs)
        const v = r() < 0.5 ? AIR : STONE;
        for (let dx = 0; dx < 3; dx++) for (let dz = 0; dz < 3; dz++) w.set(x + dx, y, z + dz, v);
      } else {
        w.set(x, y, z, palette[Math.floor(r() * palette.length)]);
      }
    }
    assertLightMatchesReference(w, `round ${round}`);
  }
});

test('fuzz: chunks loaded in random orders give identical light', () => {
  const fill = terrain(99);
  const coords = grid(1);
  const base = makeWorld(fill, coords);
  assertLightMatchesReference(base, 'base');
  const r = rng(4);
  for (let t = 0; t < 4; t++) {
    const order = coords.slice().sort(() => r() - 0.5);
    const w = makeWorld(fill, order);
    for (const [cx, cz] of coords) {
      const la = base.chunks.get(chunkKey(cx, cz))!.light, lb = w.chunks.get(chunkKey(cx, cz))!.light;
      for (let i = 0; i < COLUMN_VOLUME; i++) if (la[i] !== lb[i]) throw new Error(`order ${t}: chunk ${cx},${cz} differs at ${i}`);
    }
  }
});

test('edits at a chunk edge while the neighbour is unloaded, then loading it', () => {
  const fill = terrain(5);
  const w = makeWorld(fill, [[0, 0]]);
  for (let y = 60; y < 80; y++) w.set(15, y, 8, y % 3 ? AIR : TORCH);
  w.set(15, 75, 3, GLOWSTONE);
  // the neighbour arrives later: light must flow both ways
  w.addChunk(new Chunk(genChunk(1, 0, fill)));
  w.addChunk(new Chunk(genChunk(0, 1, fill)));
  assertLightMatchesReference(w, 'after neighbours arrive');
  // unload and reload a neighbour: light must come back exactly
  w.removeChunk(1, 0);
  w.addChunk(new Chunk(genChunk(1, 0, fill)));
  assertLightMatchesReference(w, 'after reload');
});

// ------------------------------------------------------------------ dirty sections

function snapshot(w: World): Map<number, { b: Uint16Array; l: Uint8Array }> {
  const m = new Map<number, { b: Uint16Array; l: Uint8Array }>();
  for (const c of w.chunks.values()) m.set(chunkKey(c.cx, c.cz), { b: c.blocks.slice(), l: c.light.slice() });
  return m;
}

/** Every section whose padded 18^3 region holds a changed cell must be dirty (unless empty). */
function checkDirty(w: World, before: Map<number, { b: Uint16Array; l: Uint8Array }>, label: string): number {
  let needed = 0;
  for (const c of w.chunks.values()) {
    const s = before.get(chunkKey(c.cx, c.cz))!;
    for (let i = 0; i < COLUMN_VOLUME; i++) {
      if (s.b[i] === c.blocks[i] && s.l[i] === c.light[i]) continue;
      const x = c.cx * 16 + (i & 15), y = i >> 8, z = c.cz * 16 + ((i >> 4) & 15);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const yy = y + dy;
        if (yy < 0 || yy > 255) continue;
        const ncx = Math.floor((x + dx) / 16), ncz = Math.floor((z + dz) / 16), sy = yy >> 4;
        const n = w.getChunk(ncx, ncz);
        if (!n) continue;
        const own = dx === 0 && dy === 0 && dz === 0 && s.b[i] !== c.blocks[i];
        if (n.counts[sy] === 0 && !own) continue;
        needed++;
        if (!w.dirtySections.has(sectionKey(ncx, sy, ncz))) {
          throw new Error(`${label}: section ${ncx},${sy},${ncz} not dirty although cell (${x},${y},${z}) changed`);
        }
      }
    }
  }
  return needed;
}

test('dirty sections: own, neighbours within one block incl. diagonals, light changes', () => {
  const w = makeWorld(terrain(3), grid(1));
  const r = rng(77);
  for (let k = 0; k < 60; k++) {
    w.dirtySections.clear();
    const before = snapshot(w);
    // bias towards section and chunk borders
    const pick = () => { const v = Math.floor(r() * 48) - 16; return r() < 0.5 ? (v & ~15) + (r() < 0.5 ? 0 : 15) : v; };
    const x = pick(), z = pick();
    const y = Math.min(250, Math.max(2, (w.topY(x, z) & ~15) + (r() < 0.5 ? 0 : 15) + Math.floor(r() * 3) - 1));
    const vals = [AIR, STONE, TORCH, GLOWSTONE, OAK_LEAVES, GLASS];
    w.set(x, y, z, vals[Math.floor(r() * vals.length)]);
    checkDirty(w, before, `edit ${k} at ${x},${y},${z}`);
  }
});

test('dirty sections: corner block marks the 7 neighbouring sections', () => {
  const w = makeWorld((x, y, z) => (y < 40 ? STONE : AIR), grid(1));
  w.dirtySections.clear();
  w.set(15, 31, 15, AIR);  // corner of section (0,1,0): +x, +y, +z neighbours
  const want = [[0, 1, 0], [1, 1, 0], [0, 1, 1], [1, 1, 1], [0, 2, 0], [1, 2, 0], [0, 2, 1], [1, 2, 1]];
  for (const [cx, sy, cz] of want) ok(w.dirtySections.has(sectionKey(cx, sy, cz)), `missing ${cx},${sy},${cz}`);
  const extra = Array.from(w.dirtySections).filter((k) => !want.some(([cx, sy, cz]) => sectionKey(cx, sy, cz) === k));
  eq(extra.length, 0, `unexpected dirty sections ${extra.map((k) => `${chunkKeyX(sectionKeyChunk(k))},${sectionKeyY(k)},${chunkKeyZ(sectionKeyChunk(k))}`).join(' ')}`);
});

test('dirty sections: onBlockChange sees them already marked', () => {
  const w = makeWorld(flat, grid(1));
  w.dirtySections.clear();
  let seen = false;
  w.onBlockChange = (x, y, z, o, n) => {
    seen = w.dirtySections.has(sectionKey(0, 3, 0)) && o === GRASS && n === AIR && x === 3 && y === 63 && z === 3;
  };
  w.set(3, 63, 3, AIR);
  ok(seen, 'callback order');
  ok(w.getChunk(0, 0)!.modified, 'modified');
});

test('addChunk marks its sections and the neighbours\' non-empty sections', () => {
  const w = makeWorld(flat, [[0, 0]]);
  w.dirtySections.clear();
  const before = snapshot(w);
  w.addChunk(new Chunk(genChunk(1, 0, (x, y, z) => (x === 16 && y === 64 && z === 5 ? TORCH : flat(x, y, z)))));
  for (let sy = 0; sy < 4; sy++) { ok(w.dirtySections.has(sectionKey(1, sy, 0)), 'own ' + sy); ok(w.dirtySections.has(sectionKey(0, sy, 0)), 'neighbour ' + sy); }
  ok(!w.dirtySections.has(sectionKey(1, 8, 0)), 'empty sections are not queued');
  const old = before.get(chunkKey(0, 0))!;
  ok(old.l[(64 << 8) | (5 << 4) | 15] !== w.getChunk(0, 0)!.light[(64 << 8) | (5 << 4) | 15], 'torch light entered the old chunk');
});

// ------------------------------------------------------------------ chunk + world basics
test('chunk counts, topY, get/set bounds', () => {
  const w = makeWorld(flat, [[0, 0]]);
  const c = w.getChunk(0, 0)!;
  eq(c.counts[0], 4096); eq(c.counts[3], 4096); eq(c.counts[4], 0);
  w.set(1, 64, 1, STONE);
  eq(c.counts[4], 1);
  w.set(1, 64, 1, AIR);
  eq(c.counts[4], 0);
  eq(w.topY(1, 1), 63); eq(w.topY(100, 100), -1);
  eq(w.get(1, -1, 1), B('bedrock')); eq(w.get(1, 256, 1), 0); eq(w.get(100, 64, 100), 0);
  w.set(100, 64, 100, STONE); // unloaded: ignored
  w.set(1, 300, 1, STONE);
  eq(w.removeChunk(0, 0), c); eq(w.getChunk(0, 0), undefined); eq(w.get(1, 10, 1), 0);
});

test('negative coordinates map to the right chunk', () => {
  const w = makeWorld(flat, grid(1));
  w.set(-1, 64, -1, GLOWSTONE);
  eq(w.getChunk(-1, -1)!.get(15, 64, 15), GLOWSTONE);
  eq(blk(w, 0, 64, -1), 14);
  eq(blk(w, -17, 64, -1), 0);
  assertLightMatchesReference(w);
});

// ------------------------------------------------------------------ visual dumps
test('visual: terrain slices with caves, trees, torches', () => {
  const w = makeWorld(terrain(7), grid(1));
  for (let z = -8; z <= 24; z += 8) {
    sliceImage(w, -16, 31, 40, 100, z, 6, `${SCRATCH}/terrain-z${z}.png`);
  }
  // night-style dump with torches in a dug room
  const w2 = makeWorld(flat, grid(1));
  for (let x = -6; x <= 20; x++) for (let y = 52; y <= 58; y++) w2.set(x, y, 8, AIR);
  w2.set(-6, 52, 8, TORCH); w2.set(10, 52, 8, B('lantern')); w2.set(20, 58, 8, GLOWSTONE);
  for (let y = 59; y <= 63; y++) w2.set(4, y, 8, AIR);
  sliceImage(w2, -10, 24, 48, 70, 8, 12, `${SCRATCH}/room-slice.png`);
  assertLightMatchesReference(w2);
});

summary('lighting');
