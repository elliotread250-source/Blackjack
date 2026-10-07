// Section mesher: turns a padded 18^3 block section into vertex buffers for the five
// render layers (opaque, cutout, translucent, water, lava). Runs in workers and on the
// main thread (edits). Hot paths use module-level typed scratch buffers and lookup
// tables only: no allocation per block. Vertex format: see MeshLayer in types.ts.
import {
  SHAPE, S, LAYER, TINT, TINTMASK, CULLSELF, LEAVES, WAVE, FLUID, SOLID, FAMILY, ID, COUNT, pack,
} from '../blocks/registry';
import { DEFAULT_TINT } from '../blocks/textures';
import {
  FULL_CUBE, FACE_FULL, SIDE_COVER, SIDE_COVER_Y, JITTER, cubeFaceTilePacked, buildModel, modelState, posHash,
} from '../blocks/shapes';
import type { ModelBox, NeighborFn } from '../blocks/shapes';
import type { World } from '../world/world';
import type { PaddedSection, MeshOptions, SectionMesh, MeshLayer } from '../types';
import { PAD, PAD_VOLUME, padIndex, padXZ, xzIndex } from '../world/constants';

// ---------------------------------------------------------------------------
// Tables

const SX = 1, SZ = PAD, SY = PAD * PAD;
const AXIS_STRIDE = [SX, SY, SZ];
/** padded index offset of the neighbour across face f */
const FOFF = [SX, -SX, SY, -SY, SZ, -SZ];
/** bit of the neighbour's face that touches our face f */
const OPP_BIT = [1 << 1, 1 << 0, 1 << 3, 1 << 2, 1 << 5, 1 << 4];
const FACE_AXIS = [0, 0, 1, 1, 2, 2];
const FACE_SHADE = [0.6, 0.6, 1, 0.5, 0.8, 0.8];
const AO_CURVE = [0.45, 0.65, 0.82, 1];
const INV17 = [0, 17, 17 / 2, 17 / 3, 17 / 4];

// Unit cube corners per face, counter-clockwise seen from outside:
// v0 bottom-left, v1 bottom-right, v2 top-right, v3 top-left (in texture space).
const FACE_VERTS = [
  [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], // +X east:  u = 1-z, v = 1-y
  [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], // -X west:  u = z
  [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], // +Y up:    u = x, v = z
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], // -Y down:  u = x, v = 1-z
  [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], // +Z south: u = x
  [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], // -Z north: u = 1-x
];
const FV = new Uint8Array(72);
const S1 = new Int32Array(24), S2 = new Int32Array(24);   // AO side offsets per face vertex
const U_AXIS = new Uint8Array(6), V_AXIS = new Uint8Array(6);
for (let f = 0; f < 6; f++) {
  const n = FACE_AXIS[f], a = n === 0 ? 1 : 0, b = n === 2 ? 1 : 2;
  for (let k = 0; k < 4; k++) {
    const c = FACE_VERTS[f][k];
    for (let i = 0; i < 3; i++) FV[(f * 4 + k) * 3 + i] = c[i];
    S1[f * 4 + k] = (c[a] ? 1 : -1) * AXIS_STRIDE[a];
    S2[f * 4 + k] = (c[b] ? 1 : -1) * AXIS_STRIDE[b];
  }
  const v0 = FACE_VERTS[f][0], v1 = FACE_VERTS[f][1], v3 = FACE_VERTS[f][3];
  for (let i = 0; i < 3; i++) { if (v1[i] !== v0[i]) U_AXIS[f] = i; if (v3[i] !== v0[i]) V_AXIS[f] = i; }
}
// Texture corner (pixels) of v0..v3 for an unrotated full face.
const CU = [0, 16, 16, 0], CV = [16, 16, 0, 0];

/** Ambient occlusion casters: full cubes and leaves (any packed value). */
const AO_OCC = new Uint8Array(65536);
for (let v = 0; v < 65536; v++) {
  const id = v & 1023;
  if (id < COUNT && (FULL_CUBE[v] || LEAVES[id])) AO_OCC[v] = 1;
}
const SCY_LO = new Float32Array(SIDE_COVER_Y.map((r) => r[0]));
const SCY_HI = new Float32Array(SIDE_COVER_Y.map((r) => r[1]));

const S_CUBE = S.cube, S_SLAB = S.slab, S_CROSS = S.cross, S_FLUID = S.fluid, S_LILY = S.lily;
const S_PANE = S.pane, S_FENCE = S.fence, S_DOOR = S.door, S_CACTUS = S.cactus;
const WATER = ID.water, SEAGRASS = ID.seagrass ?? -1;
const BEDROCK = pack(ID.bedrock);

/** Fluid a cell holds for meshing purposes (seagrass is always waterlogged). */
const FLUID_OF = new Uint16Array(1024);
for (let i = 0; i < COUNT; i++) if (FLUID[i]) FLUID_OF[i] = i;
if (SEAGRASS >= 0) FLUID_OF[SEAGRASS] = WATER;

/** Blocks whose top texture is randomly turned per position (breaks up tiling). */
const RANDROT = new Uint8Array(COUNT);
for (const n of ['grass_block', 'snowy_grass_block', 'dirt', 'sand', 'red_sand', 'mycelium', 'podzol']) {
  if (ID[n] !== undefined) RANDROT[ID[n]] = 1;
}

// ---------------------------------------------------------------------------
// Growable per-layer scratch buffers

class LayerBuf {
  pos = new Int16Array(3 * 8192);
  uv = new Uint16Array(2 * 8192);
  tint = new Uint8Array(4 * 8192);
  light = new Uint8Array(4 * 8192);
  idx = new Uint32Array(12288);
  vc = 0;
  ic = 0;
  reserve(nv: number, ni: number) {
    if ((this.vc + nv) * 3 > this.pos.length) {
      const cap = Math.max(this.pos.length / 3 * 2, this.vc + nv);
      const p = new Int16Array(cap * 3); p.set(this.pos); this.pos = p;
      const u = new Uint16Array(cap * 2); u.set(this.uv); this.uv = u;
      const t = new Uint8Array(cap * 4); t.set(this.tint); this.tint = t;
      const l = new Uint8Array(cap * 4); l.set(this.light); this.light = l;
    }
    if (this.ic + ni > this.idx.length) {
      const i = new Uint32Array(Math.max(this.idx.length * 2, this.ic + ni)); i.set(this.idx); this.idx = i;
    }
  }
  finish(): MeshLayer | null {
    const vc = this.vc, ic = this.ic;
    if (vc === 0 || ic === 0) return null;
    let indices: Uint16Array | Uint32Array;
    if (vc <= 65535) { indices = new Uint16Array(ic); indices.set(this.idx.subarray(0, ic)); } else indices = this.idx.slice(0, ic);
    return {
      positions: this.pos.slice(0, vc * 3),
      uvs: this.uv.slice(0, vc * 2),
      tints: this.tint.slice(0, vc * 4),
      lights: this.light.slice(0, vc * 4),
      indices,
      vertexCount: vc,
      indexCount: ic,
    };
  }
}
const BUFS = [new LayerBuf(), new LayerBuf(), new LayerBuf(), new LayerBuf(), new LayerBuf()];

// Current job state (module level so the hot functions take few arguments).
let B: Uint16Array = new Uint16Array(PAD_VOLUME);
let LT: Uint8Array = new Uint8Array(PAD_VOLUME);
let TN: Uint8Array = new Uint8Array(PAD * PAD * 9);
let fancy = false, smooth = true, itemMode = false;
let curPi = 0;
// Tint of the block being meshed
let tR = 255, tG = 255, tB = 255, tM = 0;

const NB: NeighborFn = (dx, dy, dz) => B[curPi + dx + dz * SZ + dy * SY];

function vtx(b: LayerBuf, x: number, y: number, z: number, u: number, v: number, sky: number, blk: number, sh: number, flags: number) {
  const i = b.vc++;
  const p = i * 3, q = i * 2, r = i * 4;
  b.pos[p] = x; b.pos[p + 1] = y; b.pos[p + 2] = z;
  b.uv[q] = u; b.uv[q + 1] = v;
  const t = b.tint; t[r] = tR; t[r + 1] = tG; t[r + 2] = tB; t[r + 3] = tM;
  const l = b.light; l[r] = sky; l[r + 1] = blk; l[r + 2] = sh; l[r + 3] = flags;
}

/** Two triangles over the last 4 vertices; `flip` uses the 1-3 diagonal. */
function quad(b: LayerBuf, base: number, flip: boolean, back: boolean) {
  const ix = b.idx;
  let i = b.ic;
  if (flip) { ix[i++] = base + 1; ix[i++] = base + 2; ix[i++] = base + 3; ix[i++] = base + 1; ix[i++] = base + 3; ix[i++] = base; } else { ix[i++] = base; ix[i++] = base + 1; ix[i++] = base + 2; ix[i++] = base; ix[i++] = base + 2; ix[i++] = base + 3; }
  if (back) {
    if (flip) { ix[i++] = base + 1; ix[i++] = base + 3; ix[i++] = base + 2; ix[i++] = base + 1; ix[i++] = base; ix[i++] = base + 3; } else { ix[i++] = base; ix[i++] = base + 2; ix[i++] = base + 1; ix[i++] = base; ix[i++] = base + 3; ix[i++] = base + 2; }
  }
  b.ic = i;
}

function setTint(id: number, x: number, z: number) {
  const tt = TINT[id];
  if (tt) {
    const ti = padXZ(x, z) * 9 + (tt - 1) * 3;
    tR = TN[ti]; tG = TN[ti + 1]; tB = TN[ti + 2];
  } else { tR = 255; tG = 255; tB = 255; }
  tM = TINTMASK[id] ? 255 : 0;
}

/** Position salt from the column's biome tint (world-position dependent, never edited). */
function colSalt(x: number, z: number): number {
  const ti = padXZ(x, z) * 9;
  return (TN[ti] | (TN[ti + 1] << 8) | (TN[ti + 2] << 16)) ^ Math.imul(TN[ti + 3] | (TN[ti + 4] << 8) | (TN[ti + 5] << 16), 0x9e3779b1) ^ Math.imul(TN[ti + 6] | (TN[ti + 7] << 8) | (TN[ti + 8] << 16), 0x85ebca6b);
}

// ---------------------------------------------------------------------------
// Smooth lighting: per-corner values of a face for the layer centred on cell c.

const CS = new Float32Array(4), CB = new Float32Array(4);
const CAO = new Uint8Array(4);

function corners(c: number, f: number) {
  const lc = LT[c];
  const s0 = lc >> 4, b0 = lc & 15;
  const o = f * 4;
  for (let k = 0; k < 4; k++) {
    const s1 = S1[o + k], s2 = S2[o + k];
    const a = c + s1, b = c + s2, d = a + s2;
    const va = B[a], vb = B[b], vd = B[d];
    const fa = FULL_CUBE[va], fb = FULL_CUBE[vb];
    let s = s0, bl = b0, n = 1;
    if (!fa) { const l = LT[a]; s += l >> 4; bl += l & 15; n++; }
    if (!fb) { const l = LT[b]; s += l >> 4; bl += l & 15; n++; }
    if (!(fa && fb) && !FULL_CUBE[vd]) { const l = LT[d]; s += l >> 4; bl += l & 15; n++; }
    CS[k] = s * INV17[n]; CB[k] = bl * INV17[n];
    const oa = AO_OCC[va], ob = AO_OCC[vb];
    CAO[k] = oa && ob ? 0 : 3 - oa - ob - AO_OCC[vd];
  }
}

function flatLight(c: number) {
  const l = LT[c];
  const s = (l >> 4) * 17, b = (l & 15) * 17;
  CS[0] = CS[1] = CS[2] = CS[3] = s;
  CB[0] = CB[1] = CB[2] = CB[3] = b;
  CAO[0] = CAO[1] = CAO[2] = CAO[3] = 3;
}

// ---------------------------------------------------------------------------
// Cubes

function meshCube(x: number, y: number, z: number, pi: number, v: number, id: number) {
  const leaves = LEAVES[id] === 1;
  const fastLeaves = leaves && !fancy;
  const b = BUFS[fastLeaves ? 0 : LAYER[id]];
  const cullSelf = CULLSELF[id] === 1;
  const wave = leaves && !itemMode ? 2 << 3 : 0;
  setTint(id, x, z);
  for (let f = 0; f < 6; f++) {
    const fi = pi + FOFF[f];
    const nv = B[fi];
    if (FACE_FULL[nv] & OPP_BIT[f]) continue;
    if (nv !== 0) {
      const nid = nv & 1023;
      if (cullSelf && nid === id) continue;
      if (fastLeaves && LEAVES[nid]) continue;
    }
    const tp = cubeFaceTilePacked(v, f);
    const tile = tp & 0xffff;
    let rot = tp >>> 16;
    if (f === 2 && RANDROT[id] && !itemMode) rot = (rot + posHash(x, y, z, colSalt(x, z))) & 3;
    if (smooth) corners(fi, f); else flatLight(fi);
    const tx = (tile & 31) << 4, ty = (tile >> 5) << 4;
    b.reserve(4, 6);
    const base = b.vc;
    const shade = FACE_SHADE[f] * 255;
    const flags = f | wave;
    const o = f * 12;
    for (let k = 0; k < 4; k++) {
      const c = (k + rot) & 3;
      vtx(b, (x + FV[o + k * 3]) << 8, (y + FV[o + k * 3 + 1]) << 8, (z + FV[o + k * 3 + 2]) << 8,
        tx + CU[c], ty + CV[c], (CS[k] + 0.5) | 0, (CB[k] + 0.5) | 0, (shade * AO_CURVE[CAO[k]] + 0.5) | 0, flags);
    }
    const q0 = CAO[0] * 64 + CS[0] + CB[0] + CAO[2] * 64 + CS[2] + CB[2];
    const q1 = CAO[1] * 64 + CS[1] + CB[1] + CAO[3] * 64 + CS[3] + CB[3];
    quad(b, base, q0 < q1, false);
  }
}

// ---------------------------------------------------------------------------
// Cross plants

function meshCross(x: number, y: number, z: number, pi: number, id: number) {
  const b = BUFS[LAYER[id]];
  const l = LT[pi];
  const sky = (l >> 4) * 17, blk = (l & 15) * 17;
  setTint(id, x, z);
  let ox = 0, oz = 0;
  if (JITTER[id] && !itemMode) {
    const h = posHash(x, y, z, colSalt(x, z));
    ox = ((h & 15) / 15 - 0.5) * (6 / 16);
    oz = (((h >>> 4) & 15) / 15 - 0.5) * (6 / 16);
  }
  const wave = WAVE[id] === 1 && !itemMode;
  const fb = 6 | (wave ? 1 << 3 : 0), ft = fb | (wave ? 32 : 0);
  const tile = cubeFaceTilePacked(id, 0) & 0xffff;
  const tx = (tile & 31) << 4, ty = (tile >> 5) << 4;
  const lo = 0.05, hi = 0.95;
  const xa = Math.round((x + lo + ox) * 256), xb = Math.round((x + hi + ox) * 256);
  const za = Math.round((z + lo + oz) * 256), zb = Math.round((z + hi + oz) * 256);
  const y0 = y << 8, y1 = (y + 1) << 8;
  b.reserve(8, 24);
  for (let pl = 0; pl < 2; pl++) {
    const z0 = pl ? zb : za, z1 = pl ? za : zb;
    const base = b.vc;
    vtx(b, xa, y0, z0, tx, ty + 16, sky, blk, 255, fb);
    vtx(b, xb, y0, z1, tx + 16, ty + 16, sky, blk, 255, fb);
    vtx(b, xb, y1, z1, tx + 16, ty, sky, blk, 255, ft);
    vtx(b, xa, y1, z0, tx, ty, sky, blk, 255, ft);
    quad(b, base, false, true);
  }
}

// ---------------------------------------------------------------------------
// Fluids

const FLUID_TOP = 14 / 16;

/** Surface height of a fluid cell of fluid F without looking above (level based). */
function ownHeight(v: number): number {
  const id = v & 1023;
  if (!FLUID[id]) return FLUID_TOP;            // waterlogged plants act as sources
  const m = v >> 10;
  if (m & 8) return FLUID_TOP;                  // falling
  return FLUID_TOP - (m & 7) / 9;
}

/** Height of neighbour cell i for corner averaging: >=0 fluid/air, -1 solid (ignored). */
function cellHeight(i: number, F: number): number {
  const v = B[i], id = v & 1023;
  if (FLUID_OF[id] === F) return FLUID_OF[B[i + SY] & 1023] === F ? 1 : ownHeight(v);
  return SOLID[id] ? -1 : 0;
}

function cornerHeight(self: number, s1: number, s2: number, diag: number, F: number): number {
  if (s1 >= 1 || s2 >= 1) return 1;
  let sum = 0, w = 0;
  if (s1 > 0 || s2 > 0) {
    const d = cellHeight(diag, F);
    if (d >= 1) return 1;
    if (d >= 0.8) { sum += d * 10; w += 10; } else if (d >= 0) { sum += d; w += 1; }
  }
  if (self >= 0.8) { sum += self * 10; w += 10; } else if (self >= 0) { sum += self; w += 1; }
  if (s1 >= 0.8) { sum += s1 * 10; w += 10; } else if (s1 >= 0) { sum += s1; w += 1; }
  if (s2 >= 0.8) { sum += s2 * 10; w += 10; } else if (s2 >= 0) { sum += s2; w += 1; }
  return w > 0 ? sum / w : self;
}

const maxLight = (a: number, b: number) => (Math.max(a >> 4, b >> 4) << 4) | Math.max(a & 15, b & 15);
const FH = new Float32Array(4); // corner heights indexed (cx + cz * 2)
// top face v0 (x0,z1), v1 (x1,z1), v2 (x1,z0), v3 (x0,z0)
const TOP_PX = [0, 256, 256, 0], TOP_PZ = [256, 256, 0, 0], TOP_H = [2, 3, 1, 0];

function meshFluid(x: number, y: number, z: number, pi: number, v: number, F: number) {
  const water = F === WATER;
  const b = BUFS[LAYER[F]];
  if (TINT[F]) { const ti = padXZ(x, z) * 9 + (TINT[F] - 1) * 3; tR = TN[ti]; tG = TN[ti + 1]; tB = TN[ti + 2]; } else { tR = tG = tB = 255; }
  tM = 0;
  const own = LT[pi];
  const above = B[pi + SY];
  const sameAbove = FLUID_OF[above & 1023] === F;
  if (sameAbove) { FH[0] = FH[1] = FH[2] = FH[3] = 1; } else {
    const h = ownHeight(v);
    const hn = cellHeight(pi - SZ, F), hs = cellHeight(pi + SZ, F);
    const hw = cellHeight(pi - SX, F), he = cellHeight(pi + SX, F);
    FH[0] = cornerHeight(h, hn, hw, pi - SZ - SX, F);
    FH[1] = cornerHeight(h, hn, he, pi - SZ + SX, F);
    FH[2] = cornerHeight(h, hs, hw, pi + SZ - SX, F);
    FH[3] = cornerHeight(h, hs, he, pi + SZ + SX, F);
  }
  const tile = cubeFaceTilePacked(F, 2) & 0xffff;
  const tx = (tile & 31) << 4, ty = (tile >> 5) << 4;
  const X = x << 8, Y = y << 8, Z = z << 8;

  // top
  if (!sameAbove && !((FACE_FULL[above] & (1 << 3)) && FH[0] >= 1 && FH[1] >= 1 && FH[2] >= 1 && FH[3] >= 1)) {
    const l = maxLight(own, LT[pi + SY]);
    const sky = (l >> 4) * 17, blk = (l & 15) * 17;
    const fl = 2 | (water && !itemMode ? 3 << 3 : 0);
    // flow direction turns the texture (downhill = texture "down")
    const fx = FH[0] + FH[2] - FH[1] - FH[3], fz = FH[0] + FH[1] - FH[2] - FH[3];
    let rot = 0;
    if (Math.abs(fx) + Math.abs(fz) > 1e-3) rot = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 3 : 1) : (fz > 0 ? 0 : 2);
    b.reserve(4, 12);
    const base = b.vc;
    for (let k = 0; k < 4; k++) {
      const c = (k + rot) & 3;
      vtx(b, X + TOP_PX[k], Y + Math.round(FH[TOP_H[k]] * 256), Z + TOP_PZ[k], tx + CU[c], ty + CV[c], sky, blk, 255, fl);
    }
    quad(b, base, false, water);
  }
  // sides
  for (let f = 0; f < 6; f++) {
    if (f === 2 || f === 3) continue;
    const fi = pi + FOFF[f];
    const nv = B[fi];
    if (FLUID_OF[nv & 1023] === F) continue;
    if (FACE_FULL[nv] & OPP_BIT[f]) continue;
    const l = maxLight(own, LT[fi]);
    const sky = (l >> 4) * 17, blk = (l & 15) * 17;
    const shade = (FACE_SHADE[f] * 255 + 0.5) | 0;
    b.reserve(4, 12);
    const base = b.vc;
    const o = f * 12;
    for (let k = 0; k < 4; k++) {
      const cx = FV[o + k * 3], cy = FV[o + k * 3 + 1], cz = FV[o + k * 3 + 2];
      const h = cy ? FH[cx + cz * 2] : 0;
      const t = Math.round(16 * (1 - h));
      vtx(b, X + (cx << 8), Y + Math.round(h * 256), Z + (cz << 8), tx + CU[k], ty + t, sky, blk, shade, f);
    }
    quad(b, base, false, water);
  }
  // bottom
  {
    const fi = pi - SY;
    const nv = B[fi];
    if (FLUID_OF[nv & 1023] !== F && !(FACE_FULL[nv] & (1 << 2))) {
      const l = maxLight(own, LT[fi]);
      const sky = (l >> 4) * 17, blk = (l & 15) * 17;
      const shade = (FACE_SHADE[3] * 255 + 0.5) | 0;
      b.reserve(4, 12);
      const base = b.vc;
      const o = 3 * 12;
      for (let k = 0; k < 4; k++) {
        vtx(b, X + (FV[o + k * 3] << 8), Y, Z + (FV[o + k * 3 + 2] << 8), tx + CU[k], ty + CV[k], sky, blk, shade, 3);
      }
      quad(b, base, false, water);
    }
  }
}

// ---------------------------------------------------------------------------
// Box models (slabs, stairs, fences, doors, ...): compiled once per state, cached.

interface CQuad {
  p: Float32Array;   // 4 vertices, block units
  uv: Uint16Array;   // 4 atlas pixel coords
  w: Float32Array;   // bilinear corner weights per vertex (4 x 4)
  face: number;      // nearest axis face (flags, shade, light layer)
  bface: number;     // face index when the quad lies on the block boundary, else -1
  rb0: number; rb1: number; // y extent of a boundary side quad (partial coverage culling)
  shade: number;     // face shade multiplier
  smooth: boolean;   // smooth lighting / AO allowed
  cullSame: number;  // 0 none, 1 hidden by the same block, 2 by the same shape + family
}

const MODEL_CACHE = new Map<number, CQuad[]>();

function projectST(f: number, x: number, y: number, z: number, out: Float32Array, o: number) {
  let s: number, t: number;
  switch (f) {
    case 0: s = 1 - z; t = 1 - y; break;
    case 1: s = z; t = 1 - y; break;
    case 2: s = x; t = z; break;
    case 3: s = x; t = 1 - z; break;
    case 4: s = x; t = 1 - y; break;
    default: s = 1 - x; t = 1 - y;
  }
  out[o] = Math.min(16, Math.max(0, s * 16));
  out[o + 1] = Math.min(16, Math.max(0, t * 16));
}

const EPS = 1e-5;

/** True when face f of box bi is covered by another solid box of the same model. */
function hiddenByOther(boxes: ModelBox[], bi: number, f: number): boolean {
  const bx = boxes[bi].box;
  const n = FACE_AXIS[f], pos = (f & 1) === 0;
  const plane = pos ? bx[n + 3] : bx[n];
  const ta = (n + 1) % 3, tb = (n + 2) % 3;
  for (let oi = 0; oi < boxes.length; oi++) {
    if (oi === bi) continue;
    const o = boxes[oi];
    if (o.rotate) continue;
    let solid = true;
    for (let k = 0; k < 6; k++) if (!(o.tex[k] >= 0)) { solid = false; break; }
    if (!solid) continue;
    const ob = o.box;
    if (ob[3] - ob[0] <= EPS || ob[4] - ob[1] <= EPS || ob[5] - ob[2] <= EPS) continue;
    const inside = pos ? ob[n] <= plane + EPS && ob[n + 3] > plane + EPS : ob[n] < plane - EPS && ob[n + 3] >= plane - EPS;
    if (!inside) continue;
    if (ob[ta] <= bx[ta] + EPS && ob[ta + 3] >= bx[ta + 3] - EPS && ob[tb] <= bx[tb] + EPS && ob[tb + 3] >= bx[tb + 3] - EPS) return true;
  }
  return false;
}

function rotatePoints(p: Float32Array, r: NonNullable<ModelBox['rotate']>) {
  const c = Math.cos(r.angle), s = Math.sin(r.angle);
  const [ox, oy, oz] = r.origin;
  for (let k = 0; k < 4; k++) {
    const dx = p[k * 3] - ox, dy = p[k * 3 + 1] - oy, dz = p[k * 3 + 2] - oz;
    let nx = dx, ny = dy, nz = dz;
    if (r.axis === 'x') { ny = dy * c - dz * s; nz = dy * s + dz * c; } else if (r.axis === 'y') { nx = dx * c + dz * s; nz = -dx * s + dz * c; } else { nx = dx * c - dy * s; ny = dx * s + dy * c; }
    p[k * 3] = nx + ox; p[k * 3 + 1] = ny + oy; p[k * 3 + 2] = nz + oz;
  }
}

/** Compile model boxes into ready-to-emit quads (allocates; results are cached). */
export function compileModel(boxes: ModelBox[], id: number): CQuad[] {
  const sh = SHAPE[id];
  const out: CQuad[] = [];
  const st = new Float32Array(8);
  for (let bi = 0; bi < boxes.length; bi++) {
    const mb = boxes[bi];
    const bx = mb.box;
    for (let f = 0; f < 6; f++) {
      const tile = mb.tex[f];
      if (!(tile >= 0)) continue;
      const n = FACE_AXIS[f], ta = (n + 1) % 3, tb = (n + 2) % 3;
      if (bx[ta + 3] - bx[ta] <= EPS || bx[tb + 3] - bx[tb] <= EPS) continue;
      if (!mb.rotate && hiddenByOther(boxes, bi, f)) continue;
      const p = new Float32Array(12);
      for (let k = 0; k < 4; k++) {
        for (let i = 0; i < 3; i++) p[k * 3 + i] = FACE_VERTS[f][k][i] ? bx[i + 3] : bx[i];
        projectST(f, p[k * 3], p[k * 3 + 1], p[k * 3 + 2], st, k * 2);
      }
      const ov = mb.uv ? mb.uv[f] : null;
      if (ov) {
        st[0] = ov[0]; st[1] = ov[3]; st[2] = ov[2]; st[3] = ov[3];
        st[4] = ov[2]; st[5] = ov[1]; st[6] = ov[0]; st[7] = ov[1];
      }
      const tx = (tile & 31) << 4, ty = (tile >> 5) << 4;
      const uv = new Uint16Array(8);
      for (let k = 0; k < 4; k++) { uv[k * 2] = tx + Math.round(st[k * 2]); uv[k * 2 + 1] = ty + Math.round(st[k * 2 + 1]); }
      let face = f, aligned = true;
      if (mb.rotate) {
        rotatePoints(p, mb.rotate);
        const ax = p[3] - p[0], ay = p[4] - p[1], az = p[5] - p[2];
        const bxv = p[9] - p[0], byv = p[10] - p[1], bzv = p[11] - p[2];
        const nx = ay * bzv - az * byv, ny = az * bxv - ax * bzv, nz = ax * byv - ay * bxv;
        const len = Math.hypot(nx, ny, nz) || 1;
        const anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz);
        if (anx >= any && anx >= anz) face = nx > 0 ? 0 : 1; else if (any >= anz) face = ny > 0 ? 2 : 3; else face = nz > 0 ? 4 : 5;
        aligned = Math.max(anx, any, anz) / len > 0.9999;
        if (aligned) for (let i = 0; i < 12; i++) p[i] = Math.round(p[i] * 4096) / 4096; // snap rotation noise
      }
      // boundary?
      let bface = -1;
      const fa = FACE_AXIS[face];
      if (aligned) {
        const c = p[fa];
        const onPlane = (face & 1) === 0 ? Math.abs(c - 1) < EPS : Math.abs(c) < EPS;
        if (onPlane) bface = face;
      }
      let ylo = 1, yhi = 0;
      for (let k = 0; k < 4; k++) { ylo = Math.min(ylo, p[k * 3 + 1]); yhi = Math.max(yhi, p[k * 3 + 1]); }
      // bilinear weights against the unit face corners of `face`
      const w = new Float32Array(16);
      const ua = U_AXIS[face], va = V_AXIS[face];
      const u0 = FACE_VERTS[face][0][ua], v0 = FACE_VERTS[face][0][va];
      for (let k = 0; k < 4; k++) {
        const a = Math.min(1, Math.max(0, Math.abs(p[k * 3 + ua] - u0)));
        const bb = Math.min(1, Math.max(0, Math.abs(p[k * 3 + va] - v0)));
        w[k * 4] = (1 - a) * (1 - bb); w[k * 4 + 1] = a * (1 - bb); w[k * 4 + 2] = a * bb; w[k * 4 + 3] = (1 - a) * bb;
      }
      let cullSame = 0;
      if (bface >= 0) {
        if (sh === S_PANE || sh === S_FENCE) cullSame = 2;
        else if ((sh === S_DOOR || sh === S_CACTUS) && (bface === 2 || bface === 3)) cullSame = 1;
      }
      out.push({
        p, uv, w, face, bface, rb0: ylo, rb1: yhi,
        shade: mb.shade === false ? 1 : FACE_SHADE[face],
        smooth: mb.ao !== false && aligned,
        cullSame,
      });
    }
  }
  return out;
}

// per-block memo of corner light for (face, layer) pairs
const MS = new Float32Array(48), MB = new Float32Array(48), MA = new Float32Array(48), MQ = new Float32Array(48);
const memoStamp = new Int32Array(12);
let stamp = 0;

function meshModel(x: number, y: number, z: number, pi: number, v: number, id: number, sh: number) {
  curPi = pi;
  const state = modelState(v, NB);
  const rot = sh === S_LILY && !itemMode ? posHash(x, y, z, colSalt(x, z)) & 3 : 0;
  const key = v + state * 65536 + rot * 33554432;
  let quads = MODEL_CACHE.get(key);
  if (!quads) { quads = compileModel(buildModel(v, state, rot), id); MODEL_CACHE.set(key, quads); }
  if (!quads.length) return;
  const b = BUFS[LAYER[id]];
  setTint(id, x, z);
  stamp++;
  const fam = FAMILY[id];
  for (let qi = 0; qi < quads.length; qi++) {
    const q = quads[qi];
    let lc = pi;
    if (q.bface >= 0) {
      const fi = pi + FOFF[q.bface];
      const nv = B[fi];
      if (FACE_FULL[nv] & OPP_BIT[q.bface]) continue;
      if (nv !== 0) {
        const nid = nv & 1023;
        if (q.bface !== 2 && q.bface !== 3) {
          const sc = SIDE_COVER[nv];
          if (sc && q.rb0 >= SCY_LO[sc] - EPS && q.rb1 <= SCY_HI[sc] + EPS) continue;
        }
        if (nid === id && CULLSELF[id]) continue;
        if (q.cullSame === 1 && nid === id) continue;
        if (q.cullSame === 2 && SHAPE[nid] === sh && FAMILY[nid] === fam) continue;
      }
      lc = fi;
    }
    const f = q.face;
    const sm = smooth && q.smooth;
    const mo = (f * 2 + (q.bface >= 0 ? 1 : 0)) * 4;
    if (sm && memoStamp[mo >> 2] !== stamp) {
      memoStamp[mo >> 2] = stamp;
      corners(lc, f);
      for (let k = 0; k < 4; k++) { MS[mo + k] = CS[k]; MB[mo + k] = CB[k]; MA[mo + k] = AO_CURVE[CAO[k]]; MQ[mo + k] = CAO[k] * 64 + CS[k] + CB[k]; }
    }
    const fl = LT[lc];
    const fsky = (fl >> 4) * 17, fblk = (fl & 15) * 17;
    b.reserve(4, 6);
    const base = b.vc;
    const shade = q.shade * 255;
    const w = q.w, p = q.p;
    let qa = 0, qb = 0;
    for (let k = 0; k < 4; k++) {
      let sky = fsky, blk = fblk, ao = 1;
      if (sm) {
        const w0 = w[k * 4], w1 = w[k * 4 + 1], w2 = w[k * 4 + 2], w3 = w[k * 4 + 3];
        sky = MS[mo] * w0 + MS[mo + 1] * w1 + MS[mo + 2] * w2 + MS[mo + 3] * w3;
        blk = MB[mo] * w0 + MB[mo + 1] * w1 + MB[mo + 2] * w2 + MB[mo + 3] * w3;
        ao = MA[mo] * w0 + MA[mo + 1] * w1 + MA[mo + 2] * w2 + MA[mo + 3] * w3;
        const qq = MQ[mo] * w0 + MQ[mo + 1] * w1 + MQ[mo + 2] * w2 + MQ[mo + 3] * w3;
        if (k === 0 || k === 2) qa += qq; else qb += qq;
      }
      vtx(b, Math.round((x + p[k * 3]) * 256), Math.round((y + p[k * 3 + 1]) * 256), Math.round((z + p[k * 3 + 2]) * 256),
        q.uv[k * 2], q.uv[k * 2 + 1], (sky + 0.5) | 0, (blk + 0.5) | 0, (shade * ao + 0.5) | 0, f);
    }
    quad(b, base, qa < qb, false);
  }
}

// ---------------------------------------------------------------------------
// Public API

export function newPadded(): PaddedSection {
  return { blocks: new Uint16Array(PAD_VOLUME), light: new Uint8Array(PAD_VOLUME), tint: new Uint8Array(PAD * PAD * 9) };
}

/** Fills blocks/light/tint of section (cx, sy, cz) including a 1-block border from neighbour columns. */
export function gatherSection(world: World, cx: number, sy: number, cz: number, out: PaddedSection): void {
  const ob = out.blocks, ol = out.light, ot = out.tint;
  const center = world.getChunk(cx, cz);
  for (let dz = -1; dz <= 1; dz++) {
    const za = dz < 0 ? -1 : dz === 0 ? 0 : 16, zb = dz < 0 ? -1 : dz === 0 ? 15 : 16;
    for (let dx = -1; dx <= 1; dx++) {
      const xa = dx < 0 ? -1 : dx === 0 ? 0 : 16, xb = dx < 0 ? -1 : dx === 0 ? 15 : 16;
      const c = dx === 0 && dz === 0 ? center : world.getChunk(cx + dx, cz + dz);
      const cb = c ? c.blocks : null, cl = c ? c.light : null;
      for (let py = -1; py <= 16; py++) {
        const wy = sy * 16 + py;
        for (let z = za; z <= zb; z++) {
          let pi = padIndex(xa, py, z);
          if (!cb || !cl || wy > 255) {
            for (let x = xa; x <= xb; x++, pi++) { ob[pi] = 0; ol[pi] = 0xf0; }
          } else if (wy < 0) {
            for (let x = xa; x <= xb; x++, pi++) { ob[pi] = BEDROCK; ol[pi] = 0; }
          } else {
            const row = (wy << 8) | ((z & 15) << 4);
            for (let x = xa; x <= xb; x++, pi++) { const ci = row | (x & 15); ob[pi] = cb[ci]; ol[pi] = cl[ci]; }
          }
        }
      }
      // tints of these columns (missing neighbour: clamp to the centre column)
      for (let z = za; z <= zb; z++) {
        for (let x = xa; x <= xb; x++) {
          const pt = padXZ(x, z) * 9;
          let src: Uint8Array | null = null, si = 0;
          if (c) { src = c.tint; si = xzIndex(x & 15, z & 15) * 9; } else if (center) {
            src = center.tint; si = xzIndex(Math.min(15, Math.max(0, x)), Math.min(15, Math.max(0, z))) * 9;
          }
          if (src) for (let k = 0; k < 9; k++) ot[pt + k] = src[si + k];
          else for (let k = 0; k < 9; k++) ot[pt + k] = DEFAULT_TINT_BYTES[k];
        }
      }
    }
  }
}

const DEFAULT_TINT_BYTES = new Uint8Array([
  ...DEFAULT_TINT.grass, ...DEFAULT_TINT.foliage, ...DEFAULT_TINT.water,
].map((c) => Math.round(c)));

function begin(p: PaddedSection, opts: MeshOptions, item: boolean) {
  B = p.blocks; LT = p.light; TN = p.tint;
  fancy = !!opts.fancyLeaves; smooth = !!opts.smoothLighting; itemMode = item;
  for (const b of BUFS) { b.vc = 0; b.ic = 0; }
}

function meshBlock(x: number, y: number, z: number, pi: number, v: number) {
  const id = v & 1023;
  if (id === 0 || id >= COUNT) return;
  const sh = SHAPE[id];
  if (sh === S_CUBE || (sh === S_SLAB && ((v >> 10) & 3) === 2)) meshCube(x, y, z, pi, v, id);
  else if (sh === S_CROSS) meshCross(x, y, z, pi, id);
  else if (sh === S_FLUID) meshFluid(x, y, z, pi, v, id);
  else meshModel(x, y, z, pi, v, id, sh);
  if (id === SEAGRASS) meshFluid(x, y, z, pi, v, WATER);
}

function finish(): SectionMesh {
  return BUFS.map((b) => b.finish());
}

/** Mesh one padded section into the 5 render layers (null = empty layer). */
export function meshSection(p: PaddedSection, opts: MeshOptions): SectionMesh {
  begin(p, opts, false);
  const blocks = p.blocks;
  for (let y = 0; y < 16; y++) {
    for (let z = 0; z < 16; z++) {
      let pi = padIndex(0, y, z);
      for (let x = 0; x < 16; x++, pi++) {
        const v = blocks[pi];
        if (v !== 0) meshBlock(x, y, z, pi, v);
      }
    }
  }
  return finish();
}

let itemPad: PaddedSection | null = null;

/** A single block at the origin (0..1), full sky light, no neighbours (held block). */
export function meshBlockItem(v: number): SectionMesh {
  if (!itemPad) itemPad = newPadded();
  const p = itemPad;
  p.blocks.fill(0);
  p.light.fill(0xf0);
  for (let i = 0; i < PAD * PAD; i++) p.tint.set(DEFAULT_TINT_BYTES, i * 9);
  const pi = padIndex(0, 0, 0);
  p.blocks[pi] = v;
  begin(p, { fancyLeaves: true, smoothLighting: false }, true);
  meshBlock(0, 0, 0, pi, v);
  return finish();
}
