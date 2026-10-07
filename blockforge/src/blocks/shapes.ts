// Block shapes: render models (boxes), collision and selection boxes, derived
// neighbour-dependent states (stair corners, fence/pane/wall connections) and the
// orientation-aware cube texture lookup. Geometry follows the reference game's
// block models closely (sizes in sixteenths of a block, "pixels").
import {
  SHAPE, S, OCCLUDES, FAMILY, FACE_TEX, ORIENT, SOLID, BLOCKS, COUNT, ID, LAYER, L,
} from './registry';
import type { Box } from '../types';
import { H_DX, H_DZ, H_TO_FACE, FACE_TO_H } from '../world/constants';

export type NeighborFn = (dx: number, dy: number, dz: number) => number; // packed neighbour value
export interface ModelBox {
  box: Box;                       // block units, may extend outside 0..1 only for collision
  tex: number[];                  // 6 atlas tile ids per face (-1 = no face)
  uv?: ([number, number, number, number] | null)[]; // per face override in texture pixels [u0,v0,u1,v1]
  rotate?: { axis: 'x' | 'y' | 'z'; angle: number; origin: [number, number, number] }; // radians, block units
  shade?: boolean;                // apply directional face shade (default true)
  /** Extension: smooth lighting + ambient occlusion for this box (default true). */
  ao?: boolean;
}

type UV4 = [number, number, number, number];

// ---------------------------------------------------------------------------
// Fast lookup tables over every packed value (id | meta << 10).

/** 1 when the packed value is a full opaque cube (OCCLUDES, or a double slab). */
export const FULL_CUBE = new Uint8Array(65536);
/**
 * Bit f set when face f of the packed block is a full opaque square on the block
 * boundary (so the neighbour's touching face can be culled). Full cubes have all 6 bits.
 */
export const FACE_FULL = new Uint8Array(65536);
/**
 * Partial coverage of the four side faces (opaque blocks only): 0 none,
 * 1 lower half, 2 upper half, 3 lower 2px (snow layer), 4 lower 1px (carpet).
 */
export const SIDE_COVER = new Uint8Array(65536);
/** y range [lo, hi] covered on the side faces for each SIDE_COVER code. */
export const SIDE_COVER_Y: ReadonlyArray<readonly [number, number]> = [[1, 0], [0, 0.5], [0.5, 1], [0, 2 / 16], [0, 1 / 16]];

for (let v = 0; v < 65536; v++) {
  const id = v & 1023;
  if (id >= COUNT || id === 0) continue;
  const m = v >> 10;
  const sh = SHAPE[id];
  const opaque = LAYER[id] === L.opaque;
  if (OCCLUDES[id] || (sh === S.slab && (m & 3) === 2)) { FULL_CUBE[v] = 1; FACE_FULL[v] = 63; continue; }
  if (!opaque) continue;
  if (sh === S.slab) {
    if ((m & 3) === 0) { FACE_FULL[v] = 1 << 3; SIDE_COVER[v] = 1; } else { FACE_FULL[v] = 1 << 2; SIDE_COVER[v] = 2; }
  } else if (sh === S.stairs) {
    if (m & 4) { FACE_FULL[v] = 1 << 2; SIDE_COVER[v] = 2; } else { FACE_FULL[v] = 1 << 3; SIDE_COVER[v] = 1; }
  } else if (sh === S.layer) { FACE_FULL[v] = 1 << 3; SIDE_COVER[v] = 3; } else if (sh === S.carpet) { FACE_FULL[v] = 1 << 3; SIDE_COVER[v] = 4; }
}

export function isFullCube(v: number): boolean { return FULL_CUBE[v & 0xffff] === 1; }

// Per-id flags used by the shape logic.
const GLAZED = new Uint8Array(COUNT);   // glazed terracotta: pinwheel side rotations
const GLASSY = new Uint8Array(COUNT);   // full glass blocks panes connect to
for (let i = 0; i < COUNT; i++) {
  const n = BLOCKS[i].name;
  if (n.endsWith('_glazed_terracotta')) GLAZED[i] = 1;
  if (SHAPE[i] === S.cube && (n === 'glass' || n === 'tinted_glass' || n.endsWith('_stained_glass'))) GLASSY[i] = 1;
}
const IRON_BARS = ID.iron_bars ?? -1;

// ---------------------------------------------------------------------------
// Cube textures

/**
 * Orientation-aware cube face texture without allocation: tile | rot << 16, where rot is
 * the number of clockwise quarter turns of the texture as seen looking at the face.
 */
export function cubeFaceTilePacked(v: number, face: number): number {
  const id = v & 1023;
  const o = ORIENT[id];
  const base = id * 6;
  if (o === 0) return FACE_TEX[base + face];
  const m = v >> 10;
  if (o === 1) {
    const axis = m & 3;
    if (axis === 1) { // X axis: ends east/west, side grain along x
      if (face === 0) return FACE_TEX[base + 2];
      if (face === 1) return FACE_TEX[base + 3];
      return FACE_TEX[base + 4] | (1 << 16);
    }
    if (axis === 2) { // Z axis: ends south/north, side grain along z
      if (face === 4) return FACE_TEX[base + 2];
      if (face === 5) return FACE_TEX[base + 3];
      if (face === 0 || face === 1) return FACE_TEX[base + 4] | (1 << 16);
      return FACE_TEX[base + 4];
    }
    return FACE_TEX[base + face];
  }
  // horizontal: front faces dir d; FACE_TEX is for d = 0 (front on the north face)
  const d = m & 3;
  if (face === 2) return FACE_TEX[base + 2] | ((GLAZED[id] ? (d + 1) & 3 : d) << 16);
  if (face === 3) return FACE_TEX[base + 3] | (((4 - d) & 3) << 16);
  const h0 = (FACE_TO_H[face] - d + 4) & 3;
  const t = FACE_TEX[base + H_TO_FACE[h0]];
  return GLAZED[id] ? t | (h0 << 16) : t;
}

export function cubeFaceTile(v: number, face: number): { tile: number; rot: number } {
  const p = cubeFaceTilePacked(v, face);
  return { tile: p & 0xffff, rot: p >>> 16 };
}

// ---------------------------------------------------------------------------
// Connections and stairs

const isStairs = (v: number) => SHAPE[v & 1023] === S.stairs;

export function connectsTo(v: number, other: number, dir: number): boolean {
  const oid = other & 1023;
  if (oid === 0) return false;
  const id = v & 1023;
  const sh = SHAPE[id], osh = SHAPE[oid];
  if (FULL_CUBE[other & 0xffff]) return true;
  switch (sh) {
    case S.fence:
      if (osh === S.fence && FAMILY[oid] === FAMILY[id]) return true;
      break;
    case S.pane:
      if (osh === S.pane || GLASSY[oid]) return true;
      break;
    case S.wall:
      if (osh === S.wall) return true;
      break;
    default:
      return false;
  }
  // The full back of a stair facing towards us counts as a solid face (fences/walls).
  if (sh !== S.pane && osh === S.stairs && ((other >> 10) & 3) === ((dir + 2) & 3)) return true;
  return false;
}

/** Connection bits (bit d = connected towards horizontal dir d). */
export function connectionMask(v: number, nb: NeighborFn): number {
  let m = 0;
  for (let d = 0; d < 4; d++) if (connectsTo(v, nb(H_DX[d], 0, H_DZ[d]), d)) m |= 1 << d;
  return m;
}

export const STAIR_SHAPES = ['straight', 'inner_left', 'inner_right', 'outer_left', 'outer_right'] as const;
export type StairShape = typeof STAIR_SHAPES[number];
const ST_STRAIGHT = 0, ST_INNER_LEFT = 1, ST_INNER_RIGHT = 2, ST_OUTER_LEFT = 3, ST_OUTER_RIGHT = 4;

function canTakeShape(v: number, nb: NeighborFn, dir: number): boolean {
  const o = nb(H_DX[dir], 0, H_DZ[dir]);
  return !isStairs(o) || ((o >> 10) & 3) !== ((v >> 10) & 3) || ((o >> 12) & 1) !== ((v >> 12) & 1);
}

/** Stair corner shape index into STAIR_SHAPES (same rules as the reference game). */
export function stairShapeIndex(v: number, nb: NeighborFn): number {
  const m = v >> 10, d = m & 3, half = (m >> 2) & 1;
  const front = nb(H_DX[d], 0, H_DZ[d]);
  if (isStairs(front) && ((front >> 12) & 1) === half) {
    const d1 = (front >> 10) & 3;
    if ((d1 & 1) !== (d & 1) && canTakeShape(v, nb, (d1 + 2) & 3)) return d1 === ((d + 3) & 3) ? ST_OUTER_LEFT : ST_OUTER_RIGHT;
  }
  const back = nb(-H_DX[d], 0, -H_DZ[d]);
  if (isStairs(back) && ((back >> 12) & 1) === half) {
    const d2 = (back >> 10) & 3;
    if ((d2 & 1) !== (d & 1) && canTakeShape(v, nb, d2)) return d2 === ((d + 3) & 3) ? ST_INNER_LEFT : ST_INNER_RIGHT;
  }
  return ST_STRAIGHT;
}

export function stairShape(v: number, nb: NeighborFn): StairShape {
  return STAIR_SHAPES[stairShapeIndex(v, nb)];
}

/** Wall state bits: 0-3 connections, 4 raised post, 5-8 tall side per dir. */
export function wallState(v: number, nb: NeighborFn): number {
  const c = connectionMask(v, nb);
  const above = nb(0, 1, 0), aid = above & 1023, ash = SHAPE[aid];
  const straight = c === 5 || c === 10;
  const aboveFull = FULL_CUBE[above & 0xffff] === 1;
  let tall = 0;
  for (let d = 0; d < 4; d++) {
    if (!(c & (1 << d))) continue;
    if (aboveFull) tall |= 1 << d;
    else if (ash === S.wall && connectsTo(above, nb(H_DX[d], 1, H_DZ[d]), d)) tall |= 1 << d;
  }
  let post = !straight;
  if (!post && aid !== 0) {
    if (ash === S.wall) {
      let ac = 0;
      for (let d = 0; d < 4; d++) if (connectsTo(above, nb(H_DX[d], 1, H_DZ[d]), d)) ac |= 1 << d;
      if (ac !== 5 && ac !== 10) post = true;
    } else if (ash === S.torch || ash === S.lantern || ash === S.rod) post = true;
    else if (!aboveFull && SOLID[aid] && tall === 0) post = true;
  }
  return c | (post ? 16 : 0) | (tall << 5);
}

/**
 * Neighbour-derived state that selects the model variant (stairs shape, connections).
 * Together with the packed value it fully determines `modelFor`.
 */
export function modelState(v: number, nb: NeighborFn): number {
  switch (SHAPE[v & 1023]) {
    case S.stairs: return stairShapeIndex(v, nb);
    case S.fence: case S.pane: return connectionMask(v, nb);
    case S.wall: return wallState(v, nb);
    default: return 0;
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers (pixel units in, block units out)

const P = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box =>
  [x0 / 16, y0 / 16, z0 / 16, x1 / 16, y1 / 16, z1 / 16];

/** Rotate a box authored for the north side to horizontal dir d (clockwise seen from above). */
function rotH(b: Box, d: number): Box {
  let [x0, y0, z0, x1, y1, z1] = b;
  for (let i = 0; i < (d & 3); i++) {
    const nx0 = 1 - z1, nx1 = 1 - z0, nz0 = x0, nz1 = x1;
    x0 = nx0; x1 = nx1; z0 = nz0; z1 = nz1;
  }
  return [x0, y0, z0, x1, y1, z1];
}

const all6 = (t: number) => [t, t, t, t, t, t];

/** xz rect [x0, z0, x1, z1] of the half of the block towards dir d. */
function halfRect(d: number): [number, number, number, number] {
  switch (d & 3) {
    case 0: return [0, 0, 1, 0.5];
    case 1: return [0.5, 0, 1, 1];
    case 2: return [0, 0.5, 1, 1];
    default: return [0, 0, 0.5, 1];
  }
}
function quarterRect(a: number, b: number): [number, number, number, number] {
  const r = halfRect(a), s = halfRect(b);
  return [Math.max(r[0], s[0]), Math.max(r[1], s[1]), Math.min(r[2], s[2]), Math.min(r[3], s[3])];
}

function stairBoxes(v: number, shape: number): Box[] {
  const m = v >> 10, d = m & 3, top = (m >> 2) & 1;
  const out: Box[] = [top ? [0, 0.5, 0, 1, 1, 1] : [0, 0, 0, 1, 0.5, 1]];
  const y0 = top ? 0 : 0.5, y1 = top ? 0.5 : 1;
  const left = (d + 3) & 3, right = (d + 1) & 3, back = (d + 2) & 3;
  const rects: [number, number, number, number][] = [];
  switch (shape) {
    case ST_INNER_LEFT: rects.push(halfRect(d), quarterRect(back, left)); break;
    case ST_INNER_RIGHT: rects.push(halfRect(d), quarterRect(back, right)); break;
    case ST_OUTER_LEFT: rects.push(quarterRect(d, left)); break;
    case ST_OUTER_RIGHT: rects.push(quarterRect(d, right)); break;
    default: rects.push(halfRect(d));
  }
  for (const r of rects) out.push([r[0], y0, r[1], r[2], y1, r[3]]);
  return out;
}

function slabBox(v: number): Box {
  const m = (v >> 10) & 3;
  return m === 2 ? [0, 0, 0, 1, 1, 1] : m === 1 ? [0, 0.5, 0, 1, 1, 1] : [0, 0, 0, 1, 0.5, 1];
}

/** Door panel side and hinge corner for a door state. */
function doorGeom(v: number): { box: Box; hingeX: number; hingeZ: number } {
  const m = v >> 10, d = m & 3, open = (m >> 2) & 1, right = (m >> 4) & 1;
  const hingeSide = right ? (d + 1) & 3 : (d + 3) & 3;
  const near = (d + 2) & 3;                       // side the player stood on
  const side = open ? hingeSide : near;
  const T = 3 / 16;
  let box: Box;
  switch (side) {
    case 0: box = [0, 0, 0, 1, 1, T]; break;
    case 1: box = [1 - T, 0, 0, 1, 1, 1]; break;
    case 2: box = [0, 0, 1 - T, 1, 1, 1]; break;
    default: box = [0, 0, 0, T, 1, 1];
  }
  // hinge corner: between the near side and the hinge side
  const hx = H_DX[near] + H_DX[hingeSide], hz = H_DZ[near] + H_DZ[hingeSide];
  return { box, hingeX: hx > 0 ? 1 : 0, hingeZ: hz > 0 ? 1 : 0 };
}

function trapdoorBox(v: number): Box {
  const m = v >> 10, d = m & 3, open = (m >> 2) & 1, top = (m >> 3) & 1;
  const T = 3 / 16;
  if (!open) return top ? [0, 1 - T, 0, 1, 1, 1] : [0, 0, 0, 1, T, 1];
  switch (d) {   // open: lies against the side it faces
    case 0: return [0, 0, 0, 1, 1, T];
    case 1: return [1 - T, 0, 0, 1, 1, 1];
    case 2: return [0, 0, 1 - T, 1, 1, 1];
    default: return [0, 0, 0, T, 1, 1];
  }
}

const TORCH_ANGLE = 22.5 * Math.PI / 180;

/** Wall torch box and rotation for lean dir d (wall on the opposite side). */
function wallTorch(d: number): { box: Box; rotate: NonNullable<ModelBox['rotate']> } {
  const y0 = 3.5 / 16, y1 = 13.5 / 16;
  switch (d & 3) {
    case 1: return { box: [0, y0, 7 / 16, 2 / 16, y1, 9 / 16], rotate: { axis: 'z', angle: -TORCH_ANGLE, origin: [1 / 16, y0, 0.5] } };
    case 3: return { box: [14 / 16, y0, 7 / 16, 1, y1, 9 / 16], rotate: { axis: 'z', angle: TORCH_ANGLE, origin: [15 / 16, y0, 0.5] } };
    case 2: return { box: [7 / 16, y0, 0, 9 / 16, y1, 2 / 16], rotate: { axis: 'x', angle: TORCH_ANGLE, origin: [0.5, y0, 1 / 16] } };
    default: return { box: [7 / 16, y0, 14 / 16, 9 / 16, y1, 1], rotate: { axis: 'x', angle: -TORCH_ANGLE, origin: [0.5, y0, 15 / 16] } };
  }
}

// Torch texture: stick in columns 7-8, head rows 6-7.
const TORCH_UV: (UV4 | null)[] = [[7, 6, 9, 16], [7, 6, 9, 16], [7, 6, 9, 8], [7, 14, 9, 16], [7, 6, 9, 16], [7, 6, 9, 16]];

// ---------------------------------------------------------------------------
// Render models

/**
 * Render boxes for a block given its derived state (see `modelState`). `rot` turns the
 * whole model by quarter turns around the vertical axis (lily pad variants).
 */
export function buildModel(v: number, state: number, rot = 0): ModelBox[] {
  const id = v & 1023, m = v >> 10;
  const base = id * 6;
  const t0 = FACE_TEX[base];
  switch (SHAPE[id]) {
    case S.cube: {
      const tex: number[] = [];
      for (let f = 0; f < 6; f++) tex.push(cubeFaceTilePacked(v, f) & 0xffff);
      return [{ box: [0, 0, 0, 1, 1, 1], tex }];
    }
    case S.slab: {
      const tex = [FACE_TEX[base], FACE_TEX[base + 1], FACE_TEX[base + 2], FACE_TEX[base + 3], FACE_TEX[base + 4], FACE_TEX[base + 5]];
      return [{ box: slabBox(v), tex }];
    }
    case S.stairs: {
      const tex = [FACE_TEX[base], FACE_TEX[base + 1], FACE_TEX[base + 2], FACE_TEX[base + 3], FACE_TEX[base + 4], FACE_TEX[base + 5]];
      return stairBoxes(v, state).map((box) => ({ box, tex: tex.slice() }));
    }
    case S.fence: {
      const out: ModelBox[] = [{ box: P(6, 0, 6, 10, 16, 10), tex: all6(t0) }];
      for (let d = 0; d < 4; d++) {
        if (!(state & (1 << d))) continue;
        out.push({ box: rotH(P(7, 12, 0, 9, 15, 6), d), tex: all6(t0) });
        out.push({ box: rotH(P(7, 6, 0, 9, 9, 6), d), tex: all6(t0) });
      }
      return out;
    }
    case S.wall: {
      const out: ModelBox[] = [];
      if (state & 16) out.push({ box: P(4, 0, 4, 12, 16, 12), tex: all6(t0) });
      for (let d = 0; d < 4; d++) {
        if (!(state & (1 << d))) continue;
        const h = state & (1 << (5 + d)) ? 16 : 14;
        out.push({ box: rotH(P(5, 0, 0, 11, h, 8), d), tex: all6(t0) });
      }
      if (!out.length) out.push({ box: P(4, 0, 4, 12, 16, 12), tex: all6(t0) });
      return out;
    }
    case S.pane: {
      const conn = state & 15 ? state & 15 : 15;   // unconnected: a + cross
      const col = id === IRON_BARS ? 1 : 0;        // an opaque frame column for the thin edges
      const boxes: Box[] = [P(7, 0, 7, 9, 16, 9)];
      for (let d = 0; d < 4; d++) if (conn & (1 << d)) boxes.push(rotH(P(7, 0, 0, 9, 16, 7), d));
      return boxes.map((b) => {
        const xs = Math.round(b[0] * 16), xe = Math.round(b[3] * 16), zs = Math.round(b[2] * 16), ze = Math.round(b[5] * 16);
        const thinX = xe - xs <= 2, thinZ = ze - zs <= 2;
        const flat: UV4 = xe - xs >= ze - zs ? [xs, 0, xe, 1] : [col, zs, col + 1, ze];
        const edge: UV4 = [col, 0, col + 1, 16];
        const uv: (UV4 | null)[] = [
          thinZ ? edge : null, thinZ ? edge : null, flat, flat, thinX ? edge : null, thinX ? edge : null,
        ];
        return { box: b, tex: all6(t0), uv };
      });
    }
    case S.torch: {
      if (m === 0) return [{ box: P(7, 0, 7, 9, 10, 9), tex: all6(t0), uv: TORCH_UV, shade: false, ao: false }];
      const w = wallTorch(m - 1);
      return [{ box: w.box, tex: all6(t0), uv: TORCH_UV, rotate: w.rotate, shade: false, ao: false }];
    }
    case S.door: {
      const tile = (m >> 3) & 1 ? FACE_TEX[base + 2] : FACE_TEX[base + 3];
      const g = doorGeom(v);
      const [x0, , z0, x1, , z1] = g.box;
      const uv: (UV4 | null)[] = [null, null, null, null, null, null];
      // Big faces: texture u = 0 at the hinge edge on both sides (handle on the free side).
      const thinX = x1 - x0 < 0.5;
      const faces = thinX ? [0, 1] : [4, 5];
      for (const f of faces) {
        // u grows along +z on the west face, -z on the east, +x on south, -x on north
        const leftAtMin = f === 1 || f === 4;
        const hingeAtMin = thinX ? g.hingeZ === 0 : g.hingeX === 0;
        uv[f] = leftAtMin === hingeAtMin ? [0, 0, 16, 16] : [16, 0, 0, 16];
      }
      return [{ box: g.box, tex: all6(tile), uv }];
    }
    case S.trapdoor:
      return [{ box: trapdoorBox(v), tex: all6(t0) }];
    case S.layer:
      return [{ box: P(0, 0, 0, 16, 2, 16), tex: all6(t0) }];
    case S.carpet:
      return [{ box: P(0, 0, 0, 16, 1, 16), tex: all6(t0) }];
    case S.cactus: {
      const side = FACE_TEX[base + 4], top = FACE_TEX[base + 2], bot = FACE_TEX[base + 3];
      return [
        { box: [0, 0, 0, 1, 1, 1], tex: [-1, -1, top, bot, -1, -1] },
        { box: P(0, 0, 1, 16, 16, 15), tex: [-1, -1, -1, -1, side, side] },
        { box: P(1, 0, 0, 15, 16, 16), tex: [side, side, -1, -1, -1, -1] },
      ];
    }
    case S.lantern: {
      const hang = m & 1 ? 1 : 0;
      const body: (UV4 | null)[] = [[5, 9, 11, 16], [5, 9, 11, 16], [0, 0, 6, 6], [0, 0, 6, 6], [5, 9, 11, 16], [5, 9, 11, 16]];
      const cap: (UV4 | null)[] = [[6, 7, 10, 9], [6, 7, 10, 9], [1, 1, 5, 5], [1, 1, 5, 5], [6, 7, 10, 9], [6, 7, 10, 9]];
      const nub: (UV4 | null)[] = [[7, 6, 9, 7], [7, 6, 9, 7], [7, 6, 9, 7], [7, 6, 9, 7], [7, 6, 9, 7], [7, 6, 9, 7]];
      const out: ModelBox[] = [
        { box: P(5, hang, 5, 11, 7 + hang, 11), tex: all6(t0), uv: body },
        { box: P(6, 7 + hang, 6, 10, 9 + hang, 10), tex: all6(t0), uv: cap },
      ];
      if (hang) out.push({ box: P(7.5, 10, 7.5, 8.5, 16, 8.5), tex: [t0, t0, -1, -1, t0, t0], uv: nub });
      else out.push({ box: P(7, 9, 7, 9, 10, 9), tex: all6(t0), uv: nub });
      return out;
    }
    case S.chest: {
      const tex: number[] = [];
      for (let f = 0; f < 6; f++) tex.push(cubeFaceTilePacked(v, f) & 0xffff);
      return [{ box: P(1, 0, 1, 15, 14, 15), tex }];
    }
    case S.rod: {
      const axis = m & 3;
      const rotate: ModelBox['rotate'] = axis === 1 ? { axis: 'z', angle: -Math.PI / 2, origin: [0.5, 0.5, 0.5] }
        : axis === 2 ? { axis: 'x', angle: Math.PI / 2, origin: [0.5, 0.5, 0.5] } : undefined;
      const baseUV: (UV4 | null)[] = [[0, 0, 4, 1], [0, 0, 4, 1], [0, 0, 4, 4], [0, 0, 4, 4], [0, 0, 4, 1], [0, 0, 4, 1]];
      const rodUV: (UV4 | null)[] = [[7, 0, 9, 15], [7, 0, 9, 15], [7, 0, 9, 2], [7, 0, 9, 2], [7, 0, 9, 15], [7, 0, 9, 15]];
      return [
        { box: P(6, 0, 6, 10, 1, 10), tex: all6(t0), uv: baseUV, rotate, ao: false, shade: false },
        { box: P(7, 1, 7, 9, 16, 9), tex: all6(t0), uv: rodUV, rotate, ao: false, shade: false },
      ];
    }
    case S.lily: {
      const y = 0.1 / 16;
      const r = rot & 3;
      return [{
        box: [0, y, 0, 1, y, 1], tex: [-1, -1, t0, t0, -1, -1],
        uv: [null, null, [0, 0, 16, 16], [0, 16, 16, 0], null, null],
        rotate: r ? { axis: 'y', angle: -r * Math.PI / 2, origin: [0.5, 0.5, 0.5] } : undefined,
      }];
    }
    default:
      return [];   // cross plants and fluids are meshed procedurally
  }
}

/** Render boxes for every non-cube, non-cross, non-fluid shape. */
export function modelFor(v: number, nb: NeighborFn): ModelBox[] {
  return buildModel(v, modelState(v, nb));
}

// ---------------------------------------------------------------------------
// Collision and selection

const FULL_BOX: Box = [0, 0, 0, 1, 1, 1];

// Selection boxes of cross plants (pixels), by block name.
const PLANT_SEL = new Map<number, Box>();
{
  const set = (names: string[], b: Box) => { for (const n of names) if (ID[n] !== undefined) PLANT_SEL.set(ID[n], b); };
  set(['short_grass', 'fern', 'dead_bush'], P(2, 0, 2, 14, 13, 14));
  set(['dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip',
    'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley'], P(5, 0, 5, 11, 10, 11));
  set(['brown_mushroom', 'red_mushroom'], P(5, 0, 5, 11, 6, 11));
  set(['sugar_cane'], P(2, 0, 2, 14, 16, 14));
  set(['cobweb'], FULL_BOX);
  set(['seagrass'], P(2, 0, 2, 14, 12, 14));
  for (let i = 0; i < COUNT; i++) if (BLOCKS[i].name.endsWith('_sapling')) PLANT_SEL.set(i, P(2, 0, 2, 14, 12, 14));
}

/** Horizontal "cross collision" shape (fences, panes, walls): post + arms. */
function crossShape(conn: number, post: Box | null, arm: Box): Box[] {
  const out: Box[] = [];
  if (post) out.push(post);
  for (let d = 0; d < 4; d++) if (conn & (1 << d)) out.push(rotH(arm, d));
  return out;
}

function shapeBoxes(v: number, nb: NeighborFn, collision: boolean): Box[] {
  const id = v & 1023, m = v >> 10;
  if (id === 0 || id >= COUNT) return [];
  switch (SHAPE[id]) {
    case S.cube: return [FULL_BOX.slice() as Box];
    case S.slab: return [slabBox(v)];
    case S.stairs: return stairBoxes(v, stairShapeIndex(v, nb));
    case S.fence: {
      const h = collision ? 24 : 16;
      return crossShape(connectionMask(v, nb), P(6, 0, 6, 10, h, 10), P(6, 0, 0, 10, h, 6));
    }
    case S.pane: {
      let c = connectionMask(v, nb);
      if (!c) c = 15;
      return crossShape(c, P(7, 0, 7, 9, 16, 9), P(7, 0, 0, 9, 16, 7));
    }
    case S.wall: {
      const st = wallState(v, nb);
      const out: Box[] = [];
      const ph = collision ? 24 : 16;
      if (st & 16 || !(st & 15)) out.push(P(4, 0, 4, 12, ph, 12));
      for (let d = 0; d < 4; d++) {
        if (!(st & (1 << d))) continue;
        const h = collision ? 24 : st & (1 << (5 + d)) ? 16 : 14;
        out.push(rotH(P(5, 0, 0, 11, h, 8), d));
      }
      return out;
    }
    case S.torch: {
      if (collision) return [];
      if (m === 0) return [P(6, 0, 6, 10, 10, 10)];
      // wall torch, leaning towards d with the wall on the opposite side
      return [rotH(P(5.5, 3, 11, 10.5, 13, 16), (m - 1) & 3)];
    }
    case S.door: return [doorGeom(v).box];
    case S.trapdoor: return [trapdoorBox(v)];
    case S.layer: return collision ? [] : [P(0, 0, 0, 16, 2, 16)];
    case S.carpet: return [P(0, 0, 0, 16, 1, 16)];
    case S.cactus: return collision ? [P(1, 0, 1, 15, 15, 15)] : [P(1, 0, 1, 15, 16, 15)];
    case S.lantern: {
      const h = m & 1 ? 1 : 0;
      return [P(5, h, 5, 11, 7 + h, 11), P(6, 7 + h, 6, 10, 9 + h, 10)];
    }
    case S.chest: return [P(1, 0, 1, 15, 14, 15)];
    case S.rod: {
      const a = m & 3;
      return [a === 1 ? P(0, 6, 6, 16, 10, 10) : a === 2 ? P(6, 6, 0, 10, 10, 16) : P(6, 0, 6, 10, 16, 10)];
    }
    case S.lily: return [P(1, 0, 1, 15, 1.5, 15)];
    case S.cross: {
      if (collision) return [];
      const b = PLANT_SEL.get(id);
      return [b ? b.slice() as Box : P(2, 0, 2, 14, 14, 14)];
    }
    default: return [];   // fluids
  }
}

/** Collision boxes ([] for non-solid); fences and walls are 1.5 blocks tall. */
export function collisionBoxes(v: number, nb: NeighborFn): Box[] {
  if (!SOLID[v & 1023]) return [];
  return shapeBoxes(v, nb, true);
}

/** What the cursor outlines and rays hit. */
export function selectionBoxes(v: number, nb: NeighborFn): Box[] {
  return shapeBoxes(v, nb, false);
}

// ---------------------------------------------------------------------------
// Random offsets (position hashed), shared with the mesher.

/** Plants that get a random horizontal offset (short grass, ferns, flowers). */
export const JITTER = new Uint8Array(COUNT);
for (const n of ['short_grass', 'fern', 'dandelion', 'poppy', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip',
  'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley']) {
  if (ID[n] !== undefined) JITTER[ID[n]] = 1;
}

/** 32-bit position hash. */
export function posHash(x: number, y: number, z: number, salt = 0): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(z | 0, 0x165667b1) ^ Math.imul(y | 0, 0x9e3779b1) ^ salt;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Horizontal render offset of a jittered plant at world (x, y, z), in blocks (+-3px).
 * The mesher uses the same function with section-local coordinates and a salt.
 */
export function plantOffset(h: number): [number, number] {
  return [((h & 15) / 15 - 0.5) * (6 / 16), (((h >>> 4) & 15) / 15 - 0.5) * (6 / 16)];
}
