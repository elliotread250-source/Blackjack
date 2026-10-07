// WS3 unit tests: shapes + mesher. Run:
//   npx esbuild tests/ws3-mesh/unit.test.ts --bundle --platform=node --format=esm --outfile=$SCRATCH/unit.mjs && node $SCRATCH/unit.mjs
import { ID, pack, COUNT, SHAPE, S, BLOCKS, LAYER, FACE_TEX } from '../../src/blocks/registry';
import {
  stairShape, collisionBoxes, selectionBoxes, modelFor, isFullCube, connectsTo, cubeFaceTile,
} from '../../src/blocks/shapes';
import type { NeighborFn } from '../../src/blocks/shapes';
import { newPadded, meshSection, meshBlockItem, gatherSection } from '../../src/render/mesher';
import { padIndex, padXZ, PAD } from '../../src/world/constants';
import type { PaddedSection, SectionMesh, MeshLayer, Box } from '../../src/types';

let failures = 0, passes = 0;
function check(cond: boolean, msg: string) {
  if (cond) passes++; else { failures++; console.log('FAIL:', msg); }
}
function eq<T>(a: T, b: T, msg: string) { check(JSON.stringify(a) === JSON.stringify(b), `${msg}: got ${JSON.stringify(a)} expected ${JSON.stringify(b)}`); }

function pad(): PaddedSection {
  const p = newPadded();
  p.light.fill(0xf0);
  for (let i = 0; i < PAD * PAD; i++) { p.tint.set([120, 190, 80, 90, 170, 60, 60, 110, 230], i * 9); }
  return p;
}
const set = (p: PaddedSection, x: number, y: number, z: number, v: number) => { p.blocks[padIndex(x, y, z)] = v; };
const quads = (l: MeshLayer | null) => (l ? l.indexCount / 6 : 0);
const total = (m: SectionMesh) => m.reduce((s, l) => s + quads(l), 0);
const OPTS = { fancyLeaves: true, smoothLighting: true };

// ------------------------------------------------------------------ culling
{
  const p = pad();
  for (let x = 4; x < 7; x++) for (let y = 4; y < 7; y++) for (let z = 4; z < 7; z++) set(p, x, y, z, pack(ID.stone));
  const m = meshSection(p, OPTS);
  eq(quads(m[0]), 54, 'solid 3x3x3 stone cube faces');
  eq(m[0]!.vertexCount, 216, 'solid cube vertex count');
  check(m[1] === null && m[2] === null && m[3] === null && m[4] === null, 'only opaque layer used');
}
{
  const p = pad();
  for (let x = 4; x < 7; x++) for (let y = 4; y < 7; y++) for (let z = 4; z < 7; z++) set(p, x, y, z, pack(ID.glass));
  const m = meshSection(p, OPTS);
  eq(quads(m[1]), 54, 'glass 3x3x3 (glass-glass culled)');
}
{
  const p = pad();
  set(p, 5, 5, 5, pack(ID.glass)); set(p, 6, 5, 5, pack(ID.stone));
  const m = meshSection(p, OPTS);
  eq(quads(m[1]), 5, 'glass next to stone: face culled');
  eq(quads(m[0]), 6, 'stone next to glass: all faces drawn');
}
{
  const p = pad();
  set(p, 5, 5, 5, pack(ID.glass)); set(p, 6, 5, 5, pack(ID.white_stained_glass));
  const m = meshSection(p, OPTS);
  eq(quads(m[1]) + quads(m[2]), 12, 'glass next to different glass: both drawn');
}
{
  const p = pad();
  set(p, 5, 5, 5, pack(ID.oak_leaves)); set(p, 6, 5, 5, pack(ID.birch_leaves));
  const fast = meshSection(p, { fancyLeaves: false, smoothLighting: true });
  eq([quads(fast[0]), quads(fast[1])], [10, 0], 'fast leaves: opaque layer, leaf-leaf culled');
  const fancy = meshSection(p, { fancyLeaves: true, smoothLighting: true });
  eq([quads(fancy[0]), quads(fancy[1])], [0, 12], 'fancy leaves: cutout, all faces');
  // wave flag 2 on leaves, tint mode 0
  const l = fancy[1]!;
  check(((l.lights[3] >> 3) & 3) === 2, 'leaves wave flag 2');
  eq(l.tints[3], 0, 'leaves tint mode 0');
  eq([l.tints[0], l.tints[1], l.tints[2]], [90, 170, 60], 'oak leaves foliage tint');
}
{
  // grass block: tint mask mode 255 on all faces, grass rgb
  const p = pad();
  set(p, 5, 5, 5, pack(ID.grass_block));
  const m = meshSection(p, OPTS);
  const l = m[0]!;
  let ok = true;
  for (let i = 0; i < l.vertexCount; i++) if (l.tints[i * 4 + 3] !== 255 || l.tints[i * 4] !== 120) ok = false;
  check(ok, 'grass block tint mask mode 255 + grass rgb on every vertex');
}
{
  // slab culling: two bottom slabs side by side hide the touching faces, stone under slab hidden
  const p = pad();
  set(p, 5, 5, 5, pack(ID.stone_slab, 0)); set(p, 6, 5, 5, pack(ID.stone_slab, 0)); set(p, 5, 4, 5, pack(ID.stone));
  const m = meshSection(p, OPTS);
  // slab A: 6 - 1 (east side) - 1 (bottom on stone) = 4; slab B: 6 - 1 (west) = 5; stone: 6 - 1 (top under slab) = 5
  eq(quads(m[0]), 14, 'slab neighbour culling');
  // double slab acts as a full cube
  const q = pad();
  set(q, 5, 5, 5, pack(ID.stone_slab, 2)); set(q, 6, 5, 5, pack(ID.stone));
  eq(quads(meshSection(q, OPTS)[0]), 10, 'double slab culls like a cube');
  check(isFullCube(pack(ID.stone_slab, 2)) && !isFullCube(pack(ID.stone_slab, 0)) && isFullCube(pack(ID.stone)) && !isFullCube(pack(ID.glass)), 'isFullCube');
}
{
  // fluids: water pool 2x1x1 sources, faces between water skipped, top flagged wave 3
  const p = pad();
  set(p, 5, 5, 5, pack(ID.water)); set(p, 6, 5, 5, pack(ID.water));
  const m = meshSection(p, OPTS);
  // each block: top, bottom, 3 sides = 5 faces x 2 blocks, each double sided -> 10 quads x 2 = 20
  eq(quads(m[3]), 20, 'water faces (double sided)');
  const l = m[3]!;
  let topWave = 0, maxY = 0;
  for (let i = 0; i < l.vertexCount; i++) {
    if ((l.lights[i * 4 + 3] & 7) === 2) { check(((l.lights[i * 4 + 3] >> 3) & 3) === 3, 'water top wave 3'); topWave++; }
    maxY = Math.max(maxY, l.positions[i * 3 + 1]);
  }
  eq(topWave, 8, 'water top vertices');
  check(maxY < 6 * 256 && maxY > 5 * 256 + 128, 'water surface below block top (corners averaged towards air)');
  // water covered by water: full height, no top face
  set(p, 5, 6, 5, pack(ID.water));
  const m2 = meshSection(p, OPTS);
  let full = false;
  for (let i = 0; i < m2[3]!.vertexCount; i++) if (m2[3]!.positions[i * 3 + 1] === 6 * 256) full = true;
  check(full, 'water under water reaches full height');
  // flowing water slopes: level 4 next to source
  const q = pad();
  for (let x = 3; x < 9; x++) for (let z = 3; z < 9; z++) set(q, x, 4, z, pack(ID.stone));
  set(q, 5, 5, 5, pack(ID.water, 0)); set(q, 6, 5, 5, pack(ID.water, 2)); set(q, 7, 5, 5, pack(ID.water, 5));
  const mq = meshSection(q, OPTS)[3]!;
  const tops: number[] = [];
  for (let i = 0; i < mq.vertexCount; i++) if ((mq.lights[i * 4 + 3] & 7) === 2) tops.push(mq.positions[i * 3 + 1] - 5 * 256);
  check(Math.max(...tops) - Math.min(...tops) > 60, `flowing water has a sloped surface (${Math.min(...tops)}..${Math.max(...tops)})`);
  // lava in layer 4, no back faces
  const r = pad();
  set(r, 5, 5, 5, pack(ID.lava));
  const ml = meshSection(r, OPTS);
  eq(quads(ml[4]), 6, 'lava single block 6 faces in lava layer');
  // seagrass is waterlogged: no hole in the water
  const sg = pad();
  set(sg, 5, 5, 5, pack(ID.water)); set(sg, 6, 5, 5, pack(ID.seagrass));
  const ms = meshSection(sg, OPTS);
  eq(quads(ms[3]), 20, 'seagrass cell renders as water too');
  check(quads(ms[1]) === 4, 'seagrass cross quads (2 planes x 2 windings)');
}
{
  // cross plants: both windings, wave 1 + top bit, no face shade, jitter within +-3px
  const p = pad();
  set(p, 5, 5, 5, pack(ID.short_grass)); set(p, 5, 4, 5, pack(ID.grass_block));
  const l = meshSection(p, OPTS)[1]!;
  eq(l.indexCount, 24, 'cross plant index count (2 planes x 2 windings x 2 tris)');
  let topCount = 0, ok = true;
  for (let i = 0; i < l.vertexCount; i++) {
    const fl = l.lights[i * 4 + 3];
    if ((fl & 7) !== 6 || ((fl >> 3) & 3) !== 1) ok = false;
    if (fl & 32) { topCount++; if (l.positions[i * 3 + 1] !== 6 * 256) ok = false; }
    if (l.lights[i * 4 + 2] !== 255) ok = false;
    const x = l.positions[i * 3] - 5 * 256;
    if (x < 0.05 * 256 - 3 * 16 - 1 || x > 0.95 * 256 + 3 * 16 + 1) ok = false;
  }
  check(ok, 'cross flags/shade/jitter range');
  eq(topCount, 4, 'cross top vertices flagged');
}

// ------------------------------------------------------------------ indices + UVs for every block/state
function validate(m: SectionMesh, label: string) {
  for (let li = 0; li < 5; li++) {
    const l = m[li];
    if (!l) continue;
    check(l.positions.length === l.vertexCount * 3 && l.uvs.length === l.vertexCount * 2 && l.tints.length === l.vertexCount * 4 && l.lights.length === l.vertexCount * 4, `${label} layer ${li} array sizes`);
    check(l.indices.length === l.indexCount && l.indexCount % 3 === 0, `${label} index count`);
    check(l.vertexCount <= 65535 ? l.indices instanceof Uint16Array : l.indices instanceof Uint32Array, `${label} index type`);
    let maxI = 0;
    for (let i = 0; i < l.indexCount; i++) maxI = Math.max(maxI, l.indices[i]);
    check(maxI < l.vertexCount, `${label} layer ${li} index < vertexCount`);
    check(l.vertexCount % 4 === 0, `${label} quads`);
    let bad = 0;
    for (let q = 0; q < l.vertexCount; q += 4) {
      let u0 = 1e9, u1 = -1, v0 = 1e9, v1 = -1;
      for (let k = 0; k < 4; k++) { const u = l.uvs[(q + k) * 2], v = l.uvs[(q + k) * 2 + 1]; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
      if (u1 > 512 || v1 > 512) bad++;
      if (Math.floor(u0 / 16) !== Math.floor((u1 - 1e-3) / 16) && u1 !== u0) bad++;
      if (Math.floor(v0 / 16) !== Math.floor((v1 - 1e-3) / 16) && v1 !== v0) bad++;
      if (u1 === u0 && v1 === v0) bad++;
    }
    check(bad === 0, `${label} layer ${li}: ${bad} quads with UVs outside one tile`);
  }
}
{
  // every block id x every meta in a random neighbourhood
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  for (let pass = 0; pass < 6; pass++) {
    const p = pad();
    for (let i = 0; i < p.light.length; i++) p.light[i] = (rnd() * 256) | 0;
    let n = 0;
    for (let y = -1; y <= 16; y++) for (let z = -1; z <= 16; z++) for (let x = -1; x <= 16; x++) {
      if (rnd() < 0.45) continue;
      const id = 1 + ((n++ * 7 + pass * 13) % (COUNT - 1));
      const meta = (rnd() * 64) | 0;
      set(p, x, y, z, pack(id, meta));
    }
    validate(meshSection(p, { fancyLeaves: pass % 2 === 0, smoothLighting: pass % 3 !== 0 }), `random pass ${pass}`);
  }
  for (let id = 1; id < COUNT; id++) for (let meta = 0; meta < 32; meta++) {
    validate(meshBlockItem(pack(id, meta)), `item ${BLOCKS[id].name}:${meta}`);
  }
  const it = meshBlockItem(pack(ID.stone));
  eq(quads(it[0]), 6, 'item cube has 6 faces');
  let maxP = 0;
  for (let i = 0; i < it[0]!.positions.length; i++) maxP = Math.max(maxP, it[0]!.positions[i]);
  eq(maxP, 256, 'item block spans 0..1 (256 units)');
  check(it[0]!.lights[0] === 255, 'item full sky light');
  const fl = meshBlockItem(pack(ID.poppy))[1]!;
  let wave = 0;
  for (let i = 0; i < fl.vertexCount; i++) wave |= fl.lights[i * 4 + 3] >> 3;
  eq(wave, 0, 'held items do not wave');
}

// ------------------------------------------------------------------ smooth light + AO corner configuration
{
  const p = pad();
  const L = 0xf0;
  p.light.fill(L);
  set(p, 5, 5, 5, pack(ID.stone));
  set(p, 6, 6, 5, pack(ID.stone)); // east of the cell above
  set(p, 5, 6, 6, pack(ID.stone)); // south of the cell above
  const m = meshSection(p, OPTS);
  const l = m[0]!;
  // find the top face of the floor block (y = 6*256 for all 4 verts, x in 5..6)
  const want = new Map<string, number>();
  for (let q = 0; q < l.vertexCount; q += 4) {
    let top = true;
    for (let k = 0; k < 4; k++) {
      const i = q + k;
      if ((l.lights[i * 4 + 3] & 7) !== 2 || l.positions[i * 3 + 1] !== 6 * 256 || l.positions[i * 3] < 5 * 256 || l.positions[i * 3] > 6 * 256 || l.positions[i * 3 + 2] < 5 * 256 || l.positions[i * 3 + 2] > 6 * 256) top = false;
    }
    if (!top) continue;
    for (let k = 0; k < 4; k++) {
      const i = q + k;
      want.set(`${l.positions[i * 3] / 256 - 5},${l.positions[i * 3 + 2] / 256 - 5}`, l.lights[i * 4 + 2]);
    }
  }
  // corner (1,1) touches both occluders -> AO 0 (0.45); (1,0) only east -> 0.82; (0,1) only south -> 0.82; (0,0) none -> 1
  eq([want.get('0,0'), want.get('1,0'), want.get('0,1'), want.get('1,1')], [255, 209, 209, 115], 'AO brightness at the 4 corners');
  // AO anisotropic -> diagonal through the brighter pair (1,0)-(0,1): check the quad is flipped
  // smooth light: corner (1,1) averages only the open cell (both sides occluded) -> sky 15
  const pf = pad();
  pf.light.fill(0xf0);
  set(pf, 5, 5, 5, pack(ID.stone));
  set(pf, 5, 6, 5, 0);
  pf.light[padIndex(6, 6, 5)] = 0x00; // dark open cell east of the front cell
  const lf = meshSection(pf, OPTS)[0]!;
  let found = false;
  for (let i = 0; i < lf.vertexCount; i++) {
    if ((lf.lights[i * 4 + 3] & 7) === 2 && lf.positions[i * 3] === 6 * 256 && lf.positions[i * 3 + 1] === 6 * 256 && lf.positions[i * 3 + 2] === 5 * 256) {
      eq(lf.lights[i * 4], Math.round(15 * 3 / 4 * 17), 'smooth sky light averages 4 cells'); found = true;
    }
  }
  check(found, 'found corner vertex');
  const flat = meshSection(pf, { fancyLeaves: true, smoothLighting: false })[0]!;
  let allFull = true;
  for (let i = 0; i < flat.vertexCount; i++) if ((flat.lights[i * 4 + 3] & 7) === 2 && flat.lights[i * 4] !== 255) allFull = false;
  check(allFull, 'flat lighting uses the neighbour cell');
  // face shade without AO
  const shades = new Set<string>();
  for (let i = 0; i < flat.vertexCount; i++) shades.add(`${flat.lights[i * 4 + 3] & 7}:${flat.lights[i * 4 + 2]}`);
  eq([...shades].sort(), ['0:153', '1:153', '2:255', '3:128', '4:204', '5:204'], 'face shade up 1, down .5, N/S .8, E/W .6');
}

// ------------------------------------------------------------------ stairs corner rules
{
  const st = (facing: number, top = 0) => pack(ID.oak_stairs, facing | (top << 2));
  const DX = [0, 1, 0, -1], DZ = [-1, 0, 1, 0];
  const nbOf = (m: Map<string, number>): NeighborFn => (dx, dy, dz) => m.get(`${dx},${dy},${dz}`) ?? 0;
  // own facing E (1): front = east neighbour, back = west
  const cases: [string, [number, number, number][], string][] = [
    ['alone', [], 'straight'],
    ['front N', [[1, 0, st(0)]], 'outer_left'],
    ['front S', [[1, 0, st(2)]], 'outer_right'],
    ['back N', [[-1, 0, st(0)]], 'inner_left'],
    ['back S', [[-1, 0, st(2)]], 'inner_right'],
    ['front same facing', [[1, 0, st(1)]], 'straight'],
    ['front opposite', [[1, 0, st(3)]], 'straight'],
    ['front N other half', [[1, 0, st(0, 1)]], 'straight'],
    ['front N but side has same stair', [[1, 0, st(0)], [0, 1, st(1)]], 'straight'],
    ['front N, other side stair', [[1, 0, st(0)], [0, -1, st(1)]], 'outer_left'],
    ['back S blocked by same stair on south', [[-1, 0, st(2)], [0, 1, st(1)]], 'straight'],
    ['front wins over back', [[1, 0, st(0)], [-1, 0, st(2)]], 'outer_left'],
    ['front not stairs, back N', [[1, 0, pack(ID.stone)], [-1, 0, st(0)]], 'inner_left'],
  ];
  for (const [name, nbs, want] of cases) {
    const m = new Map<string, number>();
    for (const [dx, dz, v] of nbs) m.set(`${dx},0,${dz}`, v);
    eq(stairShape(st(1), nbOf(m)), want, `stairs ${name}`);
  }
  // rotational symmetry: every facing, every neighbour facing/half at front and back
  for (let d = 0; d < 4; d++) for (let half = 0; half < 2; half++) for (const where of [1, -1]) for (let nd = 0; nd < 4; nd++) for (let nh = 0; nh < 2; nh++) {
    const m = new Map<string, number>();
    m.set(`${DX[d] * where},0,${DZ[d] * where}`, st(nd, nh));
    const got = stairShape(st(d, half), nbOf(m));
    // expected via rotation to facing E
    const rel = (nd - d + 4) & 3; // neighbour facing relative (0 = same)
    let exp = 'straight';
    if (nh === half && (rel === 1 || rel === 3)) {
      const left = rel === 3;
      exp = where === 1 ? (left ? 'outer_left' : 'outer_right') : (left ? 'inner_left' : 'inner_right');
    }
    eq(got, exp, `stairs d${d} h${half} ${where > 0 ? 'front' : 'back'} nd${nd} nh${nh}`);
  }
  // geometry of each shape (facing E, bottom): volume and step quarters
  const vol = (bs: Box[]) => bs.reduce((s, b) => s + (b[3] - b[0]) * (b[4] - b[1]) * (b[5] - b[2]), 0);
  const mk = (pairs: [number, number, number][]) => { const m = new Map<string, number>(); for (const [dx, dz, v] of pairs) m.set(`${dx},0,${dz}`, v); return nbOf(m); };
  eq(vol(collisionBoxes(st(1), mk([]))), 0.75, 'straight stairs volume');
  eq(vol(collisionBoxes(st(1), mk([[1, 0, st(0)]]))), 0.625, 'outer stairs volume');
  eq(vol(collisionBoxes(st(1), mk([[-1, 0, st(0)]]))), 0.875, 'inner stairs volume');
  // outer_left facing E: quarter at north-east
  const ol = collisionBoxes(st(1), mk([[1, 0, st(0)]]));
  eq(ol[1], [0.5, 0.5, 0, 1, 1, 0.5], 'outer_left E quarter at NE');
  const orr = collisionBoxes(st(1), mk([[1, 0, st(2)]]));
  eq(orr[1], [0.5, 0.5, 0.5, 1, 1, 1], 'outer_right E quarter at SE');
  const il = collisionBoxes(st(1), mk([[-1, 0, st(0)]]));
  eq(il.slice(1), [[0.5, 0.5, 0, 1, 1, 1], [0, 0.5, 0, 0.5, 1, 0.5]], 'inner_left E: east half + NW quarter');
  const up = collisionBoxes(st(1, 1), mk([]));
  eq(up, [[0, 0.5, 0, 1, 1, 1], [0.5, 0, 0, 1, 0.5, 1]], 'upside-down straight stairs');
  // all 5 shapes x 4 facings x 2 halves mesh without errors and keep faces on the outside
  for (let d = 0; d < 4; d++) for (let h = 0; h < 2; h++) {
    const p = pad();
    set(p, 5, 5, 5, st(d, h));
    validate(meshSection(p, OPTS), `stairs ${d}/${h}`);
  }
}

// ------------------------------------------------------------------ collision / selection per shape
{
  const none: NeighborFn = () => 0;
  const full: NeighborFn = () => pack(ID.stone);
  const nbDirs = (dirs: number[], v: number): NeighborFn => (dx, dy, dz) => {
    if (dy !== 0) return 0;
    const d = dz === -1 ? 0 : dx === 1 ? 1 : dz === 1 ? 2 : dx === -1 ? 3 : -1;
    return dirs.includes(d) ? v : 0;
  };
  const maxY = (bs: Box[]) => Math.max(...bs.map((b) => b[4]));
  eq(collisionBoxes(pack(ID.stone), none), [[0, 0, 0, 1, 1, 1]], 'cube collision');
  eq(collisionBoxes(pack(ID.stone_slab, 0), none), [[0, 0, 0, 1, 0.5, 1]], 'bottom slab');
  eq(collisionBoxes(pack(ID.stone_slab, 1), none), [[0, 0.5, 0, 1, 1, 1]], 'top slab');
  eq(collisionBoxes(pack(ID.stone_slab, 2), none), [[0, 0, 0, 1, 1, 1]], 'double slab');
  const fence = pack(ID.oak_fence);
  eq(collisionBoxes(fence, none), [[6 / 16, 0, 6 / 16, 10 / 16, 1.5, 10 / 16]], 'fence post collision 1.5 tall');
  eq(collisionBoxes(fence, nbDirs([0, 1], fence)).length, 3, 'fence N+E: post + 2 arms');
  eq(maxY(selectionBoxes(fence, none)), 1, 'fence selection 1 tall');
  check(connectsTo(fence, pack(ID.spruce_fence), 0) && connectsTo(fence, pack(ID.stone), 0) && !connectsTo(fence, pack(ID.cobblestone_wall), 0) && !connectsTo(fence, pack(ID.glass_pane), 0), 'fence connections');
  const wall = pack(ID.cobblestone_wall);
  eq(maxY(collisionBoxes(wall, none)), 1.5, 'wall collision 1.5 tall');
  eq(selectionBoxes(wall, nbDirs([0, 2], wall)).map((b) => b[4]), [14 / 16, 14 / 16], 'straight wall: low sides, no post');
  eq(selectionBoxes(wall, nbDirs([0, 1], wall)).length, 3, 'corner wall: post + 2 sides');
  check(connectsTo(wall, pack(ID.mossy_cobblestone_wall), 0) && !connectsTo(wall, fence, 0), 'wall connections');
  const pane = pack(ID.glass_pane);
  eq(selectionBoxes(pane, none).length, 5, 'unconnected pane: + cross');
  eq(selectionBoxes(pane, nbDirs([1, 3], pack(ID.glass))).length, 3, 'pane E-W between glass');
  check(connectsTo(pane, pack(ID.iron_bars), 0) && connectsTo(pane, pack(ID.red_stained_glass), 0) && connectsTo(pane, pack(ID.stone), 0) && !connectsTo(pane, fence, 0), 'pane connections');
  eq(collisionBoxes(pack(ID.torch), none), [], 'torch no collision');
  eq(selectionBoxes(pack(ID.torch), none), [[6 / 16, 0, 6 / 16, 10 / 16, 10 / 16, 10 / 16]], 'torch selection');
  eq(selectionBoxes(pack(ID.torch, 2), none), [[0, 3 / 16, 5.5 / 16, 5 / 16, 13 / 16, 10.5 / 16]], 'wall torch leaning east (wall west)');
  eq(selectionBoxes(pack(ID.torch, 1), none), [[5.5 / 16, 3 / 16, 11 / 16, 10.5 / 16, 13 / 16, 1]], 'wall torch leaning north (wall south)');
  const door = (facing: number, open: number, hingeR: number) => pack(ID.oak_door, facing | (open << 2) | (hingeR << 4));
  eq(collisionBoxes(door(1, 0, 0), none), [[0, 0, 0, 3 / 16, 1, 1]], 'door facing E closed: panel on the west');
  eq(collisionBoxes(door(1, 1, 0), none), [[0, 0, 0, 1, 1, 3 / 16]], 'door facing E open, left hinge: north side');
  eq(collisionBoxes(door(1, 1, 1), none), [[0, 0, 13 / 16, 1, 1, 1]], 'door facing E open, right hinge: south side');
  eq(collisionBoxes(door(0, 0, 0), none), [[0, 0, 13 / 16, 1, 1, 1]], 'door facing N closed: south side');
  eq(collisionBoxes(door(0, 1, 0), none), [[0, 0, 0, 3 / 16, 1, 1]], 'door facing N open left hinge: west side');
  const td = (facing: number, open: number, top: number) => pack(ID.oak_trapdoor, facing | (open << 2) | (top << 3));
  eq(collisionBoxes(td(0, 0, 0), none), [[0, 0, 0, 1, 3 / 16, 1]], 'trapdoor bottom');
  eq(collisionBoxes(td(0, 0, 1), none), [[0, 13 / 16, 0, 1, 1, 1]], 'trapdoor top');
  eq(collisionBoxes(td(1, 1, 0), none), [[13 / 16, 0, 0, 1, 1, 1]], 'trapdoor open facing E against east side');
  eq(collisionBoxes(pack(ID.snow), none), [], 'snow layer: no collision');
  eq(selectionBoxes(pack(ID.snow), none), [[0, 0, 0, 1, 2 / 16, 1]], 'snow layer selection 2px');
  eq(collisionBoxes(pack(ID.white_carpet), none), [[0, 0, 0, 1, 1 / 16, 1]], 'carpet 1px');
  eq(collisionBoxes(pack(ID.cactus), none), [[1 / 16, 0, 1 / 16, 15 / 16, 15 / 16, 15 / 16]], 'cactus collision');
  eq(selectionBoxes(pack(ID.lantern), none).length, 2, 'lantern selection');
  eq(selectionBoxes(pack(ID.lantern, 1), none)[0][1], 1 / 16, 'hanging lantern raised');
  eq(collisionBoxes(pack(ID.chest), none), [[1 / 16, 0, 1 / 16, 15 / 16, 14 / 16, 15 / 16]], 'chest 14px tall inset 1px');
  eq(selectionBoxes(pack(ID.end_rod, 1), none), [[0, 6 / 16, 6 / 16, 1, 10 / 16, 10 / 16]], 'end rod X');
  eq(collisionBoxes(pack(ID.lily_pad), none), [[1 / 16, 0, 1 / 16, 15 / 16, 1.5 / 16, 15 / 16]], 'lily pad');
  eq(collisionBoxes(pack(ID.poppy), none), [], 'flower no collision');
  eq(selectionBoxes(pack(ID.poppy), none), [[5 / 16, 0, 5 / 16, 11 / 16, 10 / 16, 11 / 16]], 'flower selection');
  eq(selectionBoxes(pack(ID.water), none), [], 'water not selectable');
  eq(selectionBoxes(0, none), [], 'air');
  eq(collisionBoxes(pack(ID.stone), full), [[0, 0, 0, 1, 1, 1]], 'neighbours do not matter for cubes');
  // modelFor covers every non-cube non-cross non-fluid shape
  for (let id = 1; id < COUNT; id++) {
    const sh = SHAPE[id];
    if (sh === S.cross || sh === S.fluid) continue;
    for (let meta = 0; meta < 32; meta++) {
      const mb = modelFor(pack(id, meta), none);
      if (!mb.length) { check(false, `modelFor empty for ${BLOCKS[id].name}:${meta}`); break; }
    }
  }
}

// ------------------------------------------------------------------ cube texture orientation
{
  const log = ID.oak_log;
  const end = FACE_TEX[log * 6 + 2], side = FACE_TEX[log * 6 + 0];
  eq([0, 1, 2, 3, 4, 5].map((f) => cubeFaceTile(pack(log, 0), f).tile), [side, side, end, end, side, side], 'log Y');
  eq([0, 1, 2, 3, 4, 5].map((f) => cubeFaceTile(pack(log, 1), f)), [{ tile: end, rot: 0 }, { tile: end, rot: 0 }, { tile: side, rot: 1 }, { tile: side, rot: 1 }, { tile: side, rot: 1 }, { tile: side, rot: 1 }], 'log X');
  eq([0, 1, 2, 3, 4, 5].map((f) => cubeFaceTile(pack(log, 2), f)), [{ tile: side, rot: 1 }, { tile: side, rot: 1 }, { tile: side, rot: 0 }, { tile: side, rot: 0 }, { tile: end, rot: 0 }, { tile: end, rot: 0 }], 'log Z');
  const fur = ID.furnace;
  const front = FACE_TEX[fur * 6 + 5], fside = FACE_TEX[fur * 6 + 0];
  eq([0, 1, 4, 5].map((f) => cubeFaceTile(pack(fur, 0), f).tile), [fside, fside, fside, front], 'furnace facing N');
  eq([0, 1, 4, 5].map((f) => cubeFaceTile(pack(fur, 1), f).tile), [front, fside, fside, fside], 'furnace facing E');
  eq([0, 1, 4, 5].map((f) => cubeFaceTile(pack(fur, 2), f).tile), [fside, fside, front, fside], 'furnace facing S');
  eq([0, 1, 4, 5].map((f) => cubeFaceTile(pack(fur, 3), f).tile), [fside, front, fside, fside], 'furnace facing W');
  check(LAYER[ID.chest] === 1, 'chest is cutout');
}

// ------------------------------------------------------------------ gatherSection
{
  const mk = (cx: number, cz: number, fill: (x: number, y: number, z: number) => number) => {
    const blocks = new Uint16Array(65536), light = new Uint8Array(65536), tint = new Uint8Array(256 * 9);
    for (let y = 0; y < 256; y++) for (let z = 0; z < 16; z++) for (let x = 0; x < 16; x++) {
      const i = (y << 8) | (z << 4) | x;
      blocks[i] = fill(cx * 16 + x, y, cz * 16 + z);
      light[i] = (x + z + y) & 255;
    }
    for (let i = 0; i < 256; i++) tint[i * 9] = cx * 10 + cz + 50;
    return { cx, cz, blocks, light, tint };
  };
  const chunks = new Map<string, ReturnType<typeof mk>>();
  const fill = (x: number, y: number, z: number) => ((x * 7 + y * 3 + z * 5) % 11 === 0 ? pack(ID.stone) : 0);
  for (let cz = -1; cz <= 1; cz++) for (let cx = -1; cx <= 1; cx++) if (!(cx === 1 && cz === 1)) chunks.set(`${cx},${cz}`, mk(cx, cz, fill));
  const world = { getChunk: (cx: number, cz: number) => chunks.get(`${cx},${cz}`) };
  const p = newPadded();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gatherSection(world as any, 0, 0, 0, p);
  let ok = true;
  for (let y = -1; y <= 16; y++) for (let z = -1; z <= 16; z++) for (let x = -1; x <= 16; x++) {
    const v = p.blocks[padIndex(x, y, z)], l = p.light[padIndex(x, y, z)];
    if (y < 0) { if (v !== pack(ID.bedrock) || l !== 0) ok = false; continue; }
    if (x === 16 && z === 16) { if (v !== 0 || l !== 0xf0) ok = false; continue; }
    if (v !== fill(x, y, z)) { if (ok) console.log("blk", x, y, z, v, fill(x, y, z)); ok = false; }
    const lx = x & 15, lz = z & 15;
    if (l !== ((lx + lz + y) & 255)) { if (ok) console.log("lt", x, y, z, l); ok = false; }
  }
  check(ok, 'gatherSection blocks/light incl. borders, bedrock below 0, missing chunk = air + sky');
  eq([p.tint[padXZ(-1, -1) * 9], p.tint[padXZ(5, 5) * 9], p.tint[padXZ(16, 5) * 9], p.tint[padXZ(5, -1) * 9], p.tint[padXZ(16, 16) * 9]], [39, 50, 60, 49, 50], 'gatherSection tints (missing chunk clamps to centre)');
  const top = newPadded();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gatherSection(world as any, 0, 15, 0, top);
  check(top.blocks[padIndex(3, 16, 3)] === 0 && top.light[padIndex(3, 16, 3)] === 0xf0, 'above y 255 is air with full sky light');
}

console.log(`${passes} passed, ${failures} failed`);
if (failures) process.exit(1);
