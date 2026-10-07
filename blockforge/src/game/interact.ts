// Creative block interaction: break, place (with every placement rule), use doors and
// trapdoors, pick block, and popping blocks that lose their support.
//
// Timings follow the reference game's creative mode: a click acts at once; holding the
// button repeats every 5 ticks (0.25 s) for breaking and every 4 ticks (0.2 s) for placing.
import { collisionBoxes } from '../blocks/shapes';
import {
  BLOCKS, COUNT, FLUID, ID, ID_MASK, OCCLUDES, ORIENT, REPLACEABLE, S, SHAPE, SOLID, isItem, pack,
} from '../blocks/registry';
import { FACE_DX, FACE_DY, FACE_DZ, FACE_TO_H, H_DX, H_DZ, H_TO_FACE, OPPOSITE_FACE } from '../world/constants';
import type { World } from '../world/world';
import type { Box, RayHit } from '../types';
import type { Hotbar } from './hotbar';
import type { Input } from './input';
import type { Player } from './player';
import { raycast } from './raycast';

export interface InteractHooks {
  onBreak(x: number, y: number, z: number, oldV: number): void;      // particles + sound
  onPlace(x: number, y: number, z: number, v: number): void;         // sound
  onSwing(): void;
  onUse(x: number, y: number, z: number, v: number): void;           // door/trapdoor toggled (sound)
}

export interface Placement {
  x: number; y: number; z: number; v: number;
  extra?: { x: number; y: number; z: number; v: number };
}

export const REACH = 5;                 // creative reach in blocks
export const BREAK_REPEAT = 0.25;       // 5 ticks
export const USE_REPEAT = 0.2;          // 4 ticks
const UP = 2, DOWN = 3;
const EPS = 1e-7;
const UNIT: Box[] = [[0, 0, 0, 1, 1, 1]];

// ---------------------------------------------------------------- block groups
const idSet = (names: string[]) => {
  const a = new Uint8Array(COUNT);
  for (const n of names) { const id = ID[n]; if (id !== undefined) a[id] = 1; }
  return a;
};
const SOIL = idSet(['grass_block', 'snowy_grass_block', 'dirt', 'coarse_dirt', 'podzol', 'rooted_dirt', 'mycelium', 'moss_block', 'mud']);
const SANDS = idSet(['sand', 'red_sand']);
const DEAD_BUSH_GROUND = new Uint8Array(COUNT);
const NO_SNOW_ON = idSet(['ice', 'packed_ice']);
const MUSHROOM_GROUND = idSet(['mycelium', 'podzol']);
const SUP_NONE = 0, SUP_SOIL = 1, SUP_SAND = 2, SUP_SOLID = 3, SUP_WATER = 4, SUP_CACTUS = 5, SUP_CANE = 6;
const SUPPORT = new Uint8Array(COUNT);
BLOCKS.forEach((b, i) => {
  SUPPORT[i] = b.support === 'soil' ? SUP_SOIL : b.support === 'sand' ? SUP_SAND : b.support === 'solid' ? SUP_SOLID
    : b.support === 'water' ? SUP_WATER : b.support === 'cactus' ? SUP_CACTUS : b.support === 'cane' ? SUP_CANE : SUP_NONE;
  // Dead bushes also grow on terracotta and dirt in the reference game.
  if (SANDS[i] || SOIL[i] || b.name === 'terracotta' || (b.name.endsWith('_terracotta') && !b.name.endsWith('glazed_terracotta'))) DEAD_BUSH_GROUND[i] = 1;
});
const WATER = ID.water ?? -1;
const LAVA = ID.lava ?? -1;
const ICE = ID.ice ?? -1;
const CACTUS = ID.cactus ?? -1;
const CANE = ID.sugar_cane ?? -1;
const LILY = ID.lily_pad ?? -1;
const SEAGRASS = ID.seagrass ?? -1;

// ---------------------------------------------------------------- shape queries
const nbAt = (world: World, x: number, y: number, z: number) =>
  (dx: number, dy: number, dz: number) => world.get(x + dx, y + dy, z + dz);

function collisionOf(world: World, x: number, y: number, z: number, v: number): Box[] {
  const id = v & ID_MASK;
  if (!SOLID[id]) return [];
  if (SHAPE[id] === S.cube) return UNIT;
  return collisionBoxes(v, nbAt(world, x, y, z));
}

/** Is (u, w) on face `face` of the block covered by a box that reaches that face? */
function covered(boxes: Box[], face: number, u: number, w: number): boolean {
  const axis = face >> 1, pos = (face & 1) === 0;
  const a1 = axis === 0 ? 1 : 0, a2 = axis === 2 ? 1 : 2;
  for (const b of boxes) {
    if (pos ? b[axis + 3] < 1 - 1e-6 : b[axis] > 1e-6) continue;
    if (b[a1] <= u && b[a1 + 3] >= u && b[a2] <= w && b[a2 + 3] >= w) return true;
  }
  return false;
}

const FULL_SAMPLES = [0.01, 0.25, 0.5, 0.75, 0.99];
const CENTER_SAMPLES = [7 / 16 + 0.01, 9 / 16 - 0.01];

/** The face is a full square (wall torches, doors, snow layers need this). */
export function sturdyFace(world: World, x: number, y: number, z: number, face: number): boolean {
  if (y < 0) return true;
  if (y > 255) return false;
  const v = world.get(x, y, z);
  const id = v & ID_MASK;
  if (!SOLID[id]) return false;
  if (SHAPE[id] === S.cube) return true;
  const boxes = collisionOf(world, x, y, z, v);
  for (const u of FULL_SAMPLES) for (const w of FULL_SAMPLES) if (!covered(boxes, face, u, w)) return false;
  return true;
}

/** The face covers its centre 2x2 pixels (standing torches and lanterns: fences and walls count). */
export function centerSupport(world: World, x: number, y: number, z: number, face: number): boolean {
  if (y < 0) return true;
  if (y > 255) return false;
  const v = world.get(x, y, z);
  const id = v & ID_MASK;
  if (!SOLID[id]) return false;
  if (SHAPE[id] === S.cube) return true;
  const boxes = collisionOf(world, x, y, z, v);
  for (const u of CENTER_SAMPLES) for (const w of CENTER_SAMPLES) if (!covered(boxes, face, u, w)) return false;
  return true;
}

function fullCollisionBlock(v: number): boolean {
  const id = v & ID_MASK;
  if (!SOLID[id]) return false;
  return SHAPE[id] === S.cube || (SHAPE[id] === S.slab && ((v >> 10) & 3) === 2);
}

/** Horizontal direction the player looks towards (0 N, 1 E, 2 S, 3 W). */
export function lookDir(player: Player): number {
  const lx = -Math.sin(player.yaw), lz = -Math.cos(player.yaw);
  if (Math.abs(lx) > Math.abs(lz)) return lx > 0 ? 1 : 3;
  return lz > 0 ? 2 : 0;
}

const axisOfFace = (face: number) => (face <= 1 ? 1 : face <= 3 ? 0 : 2);

/** Would the block's collision boxes overlap the player's box? */
export function intersectsPlayer(world: World, player: Player, x: number, y: number, z: number, v: number): boolean {
  const boxes = collisionOf(world, x, y, z, v);
  if (!boxes.length) return false;
  const h = player.boxHeight();
  const px0 = player.x - 0.3, px1 = player.x + 0.3, py0 = player.y, py1 = player.y + h, pz0 = player.z - 0.3, pz1 = player.z + 0.3;
  for (const b of boxes) {
    if (x + b[0] < px1 - EPS && x + b[3] > px0 + EPS && y + b[1] < py1 - EPS && y + b[4] > py0 + EPS && z + b[2] < pz1 - EPS && z + b[5] > pz0 + EPS) return true;
  }
  return false;
}

// ---------------------------------------------------------------- survival rules
/** Whether block v can stay at (x, y, z): plant soil, torch/lantern attachment, door halves... */
export function canSurvive(world: World, x: number, y: number, z: number, v: number): boolean {
  const id = v & ID_MASK;
  if (!id) return true;
  const meta = v >> 10;
  const shape = SHAPE[id];
  if (shape === S.torch) {
    if (meta === 0) return centerSupport(world, x, y - 1, z, UP);
    const d = meta - 1;
    if (d < 0 || d > 3) return false;
    // A wall torch leans towards d; its wall is the block on the opposite side.
    return sturdyFace(world, x - H_DX[d], y, z - H_DZ[d], H_TO_FACE[d]);
  }
  if (shape === S.lantern) {
    return meta & 1 ? centerSupport(world, x, y + 1, z, DOWN) : centerSupport(world, x, y - 1, z, UP);
  }
  if (shape === S.door) {
    if (meta & 8) {
      const b = world.get(x, y - 1, z);
      return (b & ID_MASK) === id && ((b >> 10) & 8) === 0;
    }
    const a = world.get(x, y + 1, z);
    return (a & ID_MASK) === id && ((a >> 10) & 8) !== 0 && sturdyFace(world, x, y - 1, z, UP);
  }
  if (shape === S.layer) {
    const b = world.get(x, y - 1, z) & ID_MASK;
    return !NO_SNOW_ON[b] && sturdyFace(world, x, y - 1, z, UP);
  }
  if (shape === S.carpet) {
    const b = world.get(x, y - 1, z) & ID_MASK;
    return b !== 0 && !FLUID[b];
  }
  const sup = SUPPORT[id];
  if (sup === SUP_NONE) return true;
  const below = world.get(x, y - 1, z);
  const bid = below & ID_MASK;
  switch (sup) {
    case SUP_SOIL: return SOIL[bid] === 1;
    case SUP_SAND: return DEAD_BUSH_GROUND[bid] === 1;
    case SUP_SOLID: return OCCLUDES[bid] === 1 || MUSHROOM_GROUND[bid] === 1;
    case SUP_WATER: {
      const above = world.get(x, y + 1, z) & ID_MASK;
      return ((bid === WATER && ((below >> 10) & 7) === 0) || bid === ICE) && !FLUID[above];
    }
    case SUP_CACTUS: {
      for (let d = 0; d < 4; d++) {
        const n = world.get(x + H_DX[d], y, z + H_DZ[d]) & ID_MASK;
        if (SOLID[n] || n === LAVA) return false;
      }
      if (FLUID[world.get(x, y + 1, z) & ID_MASK]) return false;
      return bid === CACTUS || SANDS[bid] === 1;
    }
    case SUP_CANE: {
      if (bid === CANE) return true;
      if (!SOIL[bid] && !SANDS[bid]) return false;
      for (let d = 0; d < 4; d++) if ((world.get(x + H_DX[d], y - 1, z + H_DZ[d]) & ID_MASK) === WATER) return true;
      return false;
    }
  }
  return true;
}

/** Can block value `v` be replaced by placing `id` (clicked = it is the block the ray hit)? */
function canReplace(v: number, id: number, hit: RayHit, clicked: boolean): boolean {
  const tid = v & ID_MASK;
  if (tid === 0) return true;
  if (SHAPE[tid] === S.slab && tid === id) {
    const m = (v >> 10) & 3;
    if (m === 2) return false;
    if (!clicked) return true;
    const upper = hit.py - hit.y > 0.5;
    const horiz = hit.face !== UP && hit.face !== DOWN;
    return m === 0 ? hit.face === UP || (upper && horiz) : hit.face === DOWN || (!upper && horiz);
  }
  // Grass, snow layers and fluids give way, but a plant never replaces its own kind.
  if (REPLACEABLE[tid]) return tid !== id;
  return false;
}

/** The reference game's door hinge rule: neighbouring doors and walls first, then the click position. */
function doorHingeRight(world: World, x: number, y: number, z: number, id: number, dir: number, hit: RayHit): boolean {
  const left = (dir + 3) & 3, right = (dir + 1) & 3;
  const lx = x + H_DX[left], lz = z + H_DZ[left], rx = x + H_DX[right], rz = z + H_DZ[right];
  const bl = world.get(lx, y, lz), blu = world.get(lx, y + 1, lz);
  const br = world.get(rx, y, rz), bru = world.get(rx, y + 1, rz);
  const i = (fullCollisionBlock(bl) ? -1 : 0) + (fullCollisionBlock(blu) ? -1 : 0) + (fullCollisionBlock(br) ? 1 : 0) + (fullCollisionBlock(bru) ? 1 : 0);
  const doorL = (bl & ID_MASK) === id && ((bl >> 10) & 8) === 0;
  const doorR = (br & ID_MASK) === id && ((br >> 10) & 8) === 0;
  if ((!doorL || doorR) && i <= 0) {
    if ((!doorR || doorL) && i >= 0) {
      const j = H_DX[dir], k = H_DZ[dir];
      const d0 = hit.px - x, d1 = hit.pz - z;
      const leftHinge = (j >= 0 || !(d1 < 0.5)) && (j <= 0 || !(d1 > 0.5)) && (k >= 0 || !(d0 > 0.5)) && (k <= 0 || !(d0 < 0.5));
      return !leftHinge;
    }
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- placement
/**
 * Where and as what `id` would be placed for this hit, or null when the rules forbid it.
 * `extra` is the upper half of a door.
 */
export function placementFor(id: number, hit: RayHit, player: Player, world: World): Placement | null {
  if (!(id > 0 && id < COUNT)) return null;
  const shape = SHAPE[id];
  const face = hit.face;
  const hid = hit.block & ID_MASK;
  let x: number, y: number, z: number;
  let replacing = false;
  if (id === LILY && FLUID[hid]) {
    // Aimed at a water surface: the pad floats in the air block on top.
    x = hit.x; y = hit.y + 1; z = hit.z;
    if (world.get(x, y, z) !== 0) return null;
  } else if (canReplace(hit.block, id, hit, true)) {
    x = hit.x; y = hit.y; z = hit.z;
    replacing = true;
  } else {
    x = hit.x + FACE_DX[face]; y = hit.y + FACE_DY[face]; z = hit.z + FACE_DZ[face];
    if (y < 0 || y > 255) return null;
    if (!canReplace(world.get(x, y, z), id, hit, false)) return null;
  }
  if (y < 0 || y > 255) return null;
  const cur = world.get(x, y, z);
  const cid = cur & ID_MASK;
  // Plants, torches and other non-solid blocks are not placed into water or lava.
  if (FLUID[cid] && ((!SOLID[id] && !FLUID[id]) || id === LILY)) return null;
  if (FLUID[id] && cid === id) return null;

  const upper = hit.py - y > 0.5;          // click height inside the target cell
  const dir = lookDir(player);
  let meta = 0;
  let extra: Placement['extra'];

  switch (shape) {
    case S.slab:
      if (cid === id && ((cur >> 10) & 3) !== 2) meta = 2;   // second matching slab: double
      else meta = face !== DOWN && (face === UP || !upper) ? 0 : 1;
      break;
    case S.stairs:
      meta = dir | (face !== DOWN && (face === UP || !upper) ? 0 : 4);
      break;
    case S.torch:
      if (face === DOWN) return null;
      if (face !== UP) {
        const d = FACE_TO_H[face];       // lean away from the clicked wall
        meta = sturdyFace(world, x - H_DX[d], y, z - H_DZ[d], H_TO_FACE[d]) ? d + 1 : 0;
      }
      break;
    case S.lantern: {
      const canHang = centerSupport(world, x, y + 1, z, DOWN);
      const canStand = centerSupport(world, x, y - 1, z, UP);
      const hangFirst = face === DOWN || (face !== UP && player.pitch > 0);
      if (hangFirst) meta = canHang ? 1 : canStand ? 0 : -1;
      else meta = canStand ? 0 : canHang ? 1 : -1;
      if (meta < 0) return null;
      break;
    }
    case S.door: {
      if (y + 1 > 255) return null;
      if (!canReplace(world.get(x, y + 1, z), id, hit, false)) return null;
      if (!sturdyFace(world, x, y - 1, z, UP)) return null;
      meta = dir | (doorHingeRight(world, x, y, z, id, dir, hit) ? 16 : 0);
      extra = { x, y: y + 1, z, v: pack(id, meta | 8) };
      break;
    }
    case S.trapdoor: {
      // Facing = the side the panel rests against when open: the clicked wall, or the far
      // side (look direction) when placed on a floor or ceiling.
      let facing: number, top: boolean;
      if (!replacing && face !== UP && face !== DOWN) { facing = FACE_TO_H[OPPOSITE_FACE[face]]; top = upper; }
      else { facing = dir; top = face !== UP; }
      meta = facing | (top ? 8 : 0);
      break;
    }
    case S.rod:
      meta = axisOfFace(face);
      break;
    default:
      if (ORIENT[id] === 1) meta = axisOfFace(face);
      else if (ORIENT[id] === 2) meta = (dir + 2) & 3;   // the front faces the player
  }
  const v = pack(id, meta);
  if (shape !== S.door && !canSurvive(world, x, y, z, v)) return null;
  if (SOLID[id] && intersectsPlayer(world, player, x, y, z, v)) return null;
  if (extra && intersectsPlayer(world, player, extra.x, extra.y, extra.z, extra.v)) return null;
  return extra ? { x, y, z, v, extra } : { x, y, z, v };
}

// ---------------------------------------------------------------- interaction
export class Interaction {
  private world: World;
  private player: Player;
  private hotbar: Hotbar;
  private hooks: InteractHooks;
  private breakDelay = 0;
  private useDelay = 0;

  constructor(world: World, player: Player, hotbar: Hotbar, hooks: InteractHooks) {
    this.world = world;
    this.player = player;
    this.hotbar = hotbar;
    this.hooks = hooks;
  }

  update(dt: number, input: Input, hit: RayHit | null): void {
    // Middle click: pick block.
    if (input.clicked[1] && hit) {
      const id = hit.block & ID_MASK;
      if (isItem(id)) this.hotbar.pick(id);
    }

    // Left: break at once on click, then every 0.25 s while held on a block.
    if (input.clicked[0]) {
      this.breakDelay = BREAK_REPEAT;
      if (hit) this.breakBlock(hit.x, hit.y, hit.z);
      this.hooks.onSwing();
    } else if (input.buttons[0]) {
      if (hit) {
        this.breakDelay -= dt;
        if (this.breakDelay <= 0) {
          this.breakDelay = Math.max(0, this.breakDelay + BREAK_REPEAT);
          this.breakBlock(hit.x, hit.y, hit.z);
          this.hooks.onSwing();
        }
      }
    } else this.breakDelay = 0;

    // Right: use a door/trapdoor or place, at once on click, then every 0.2 s while held.
    if (this.useDelay > 0) this.useDelay -= dt;
    if (input.clicked[2]) {
      this.useDelay = USE_REPEAT;
      this.use(hit);
    } else if (input.buttons[2] && this.useDelay <= 0) {
      this.useDelay = Math.max(0, this.useDelay + USE_REPEAT);
      this.use(hit);
    }
  }

  /** Remove a block (both halves of a door) and pop what depended on it. */
  breakBlock(x: number, y: number, z: number): void {
    const w = this.world;
    const old = w.get(x, y, z);
    const id = old & ID_MASK;
    if (!id || FLUID[id]) return;
    w.set(x, y, z, id === SEAGRASS ? pack(WATER, 0) : 0);
    this.hooks.onBreak(x, y, z, old);
    if (SHAPE[id] === S.door) {
      const oy = (old >> 10) & 8 ? y - 1 : y + 1;
      const ov = w.get(x, oy, z);
      if ((ov & ID_MASK) === id) {
        w.set(x, oy, z, 0);
        this.hooks.onBreak(x, oy, z, ov);
        this.settle(x, oy, z);
      }
    }
    this.settle(x, y, z);
  }

  private use(hit: RayHit | null) {
    const p = this.player, w = this.world;
    const held = this.hotbar.current();
    if (hit) {
      const v = hit.block, id = v & ID_MASK, shape = SHAPE[id];
      if ((shape === S.door || shape === S.trapdoor) && (!p.sneaking || !held)) {
        this.toggle(hit.x, hit.y, hit.z, v);
        return;
      }
    }
    if (!held) return;
    let h = hit;
    if (held === LILY) {
      const e = p.eye(), l = p.look();
      const fh = raycast(w, e.x, e.y, e.z, l[0], l[1], l[2], REACH, true);
      if (fh && FLUID[fh.block & ID_MASK]) h = fh;
    }
    if (!h) return;
    const pl = placementFor(held, h, p, w);
    if (!pl) return;
    w.set(pl.x, pl.y, pl.z, pl.v);
    if (pl.extra) w.set(pl.extra.x, pl.extra.y, pl.extra.z, pl.extra.v);
    this.hooks.onPlace(pl.x, pl.y, pl.z, pl.v);
    this.hooks.onSwing();
    this.settle(pl.x, pl.y, pl.z);
    if (pl.extra) this.settle(pl.extra.x, pl.extra.y, pl.extra.z);
  }

  private toggle(x: number, y: number, z: number, v: number) {
    const w = this.world;
    const id = v & ID_MASK, meta = v >> 10;
    const open = (meta & 4) === 0;
    const nv = pack(id, (meta & ~4) | (open ? 4 : 0));
    w.set(x, y, z, nv);
    if (SHAPE[id] === S.door) {
      const oy = meta & 8 ? y - 1 : y + 1;
      const ov = w.get(x, oy, z);
      if ((ov & ID_MASK) === id) w.set(x, oy, z, pack(id, ((ov >> 10) & ~4) | (open ? 4 : 0)));
    }
    this.hooks.onUse(x, y, z, nv);
    this.hooks.onSwing();
  }

  /**
   * After a change at (x, y, z): pop neighbours that can no longer stay (plants on broken
   * soil, torches on a removed wall, lanterns, snow, carpets, doors, cactus next to a new
   * solid block, sugar cane that lost its water), following chains like cane stacks.
   */
  private settle(x: number, y: number, z: number) {
    const w = this.world;
    const stack = [x, y, z];
    let budget = 512;
    while (stack.length && budget > 0) {
      const cz = stack.pop()!, cy = stack.pop()!, cx = stack.pop()!;
      for (let k = 0; k < 10; k++) {
        let nx = cx, ny = cy, nz = cz;
        if (k < 4) { nx += H_DX[k]; nz += H_DZ[k]; }
        else if (k === 4) ny++;
        else if (k === 5) ny--;
        else { nx += H_DX[k - 6]; nz += H_DZ[k - 6]; ny++; }   // cane next to the changed cell
        if (ny < 0 || ny > 255) continue;
        const v = w.get(nx, ny, nz);
        const id = v & ID_MASK;
        if (!id || FLUID[id]) continue;
        if (canSurvive(w, nx, ny, nz, v)) continue;
        w.set(nx, ny, nz, id === SEAGRASS ? pack(WATER, 0) : 0);
        this.hooks.onBreak(nx, ny, nz, v);
        stack.push(nx, ny, nz);
        if (--budget <= 0) break;
      }
    }
  }
}
