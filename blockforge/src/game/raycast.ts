// Block picking: Amanatides-Woo voxel walk that tests the real selection boxes of each block
// it passes (slabs only in their half, plants by their small box, fences by their post...).
import { selectionBoxes } from '../blocks/shapes';
import { FLUID, ID_MASK, S, SHAPE, TARGETABLE } from '../blocks/registry';
import type { World } from '../world/world';
import type { Box, RayHit } from '../types';

const UNIT: Box[] = [[0, 0, 0, 1, 1, 1]];
const SOURCE_FLUID: Box[] = [[0, 0, 0, 1, 14 / 16, 1]];

/**
 * Nearest block hit along the ray, or null. Air and fluids are skipped unless
 * `hitFluids` is set, in which case fluid source blocks are hit by their surface (used to
 * aim lily pads at water, like the reference game's place-on-water items).
 */
export function raycast(
  world: World, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDist: number,
  hitFluids = false,
): RayHit | null {
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (!(len > 0) || !(maxDist > 0)) return null;
  dx /= len; dy /= len; dz /= len;

  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
  const tDX = stepX ? Math.abs(1 / dx) : Infinity;
  const tDY = stepY ? Math.abs(1 / dy) : Infinity;
  const tDZ = stepZ ? Math.abs(1 / dz) : Infinity;
  let tMX = stepX > 0 ? (x + 1 - ox) / dx : stepX < 0 ? (ox - x) / -dx : Infinity;
  let tMY = stepY > 0 ? (y + 1 - oy) / dy : stepY < 0 ? (oy - y) / -dy : Infinity;
  let tMZ = stepZ > 0 ? (z + 1 - oz) / dz : stepZ < 0 ? (oz - z) / -dz : Infinity;

  // Face the ray enters through on each axis, and the face reported when starting inside.
  const faceX = dx > 0 ? 1 : 0, faceY = dy > 0 ? 3 : 2, faceZ = dz > 0 ? 5 : 4;
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  const insideFace = ax >= ay && ax >= az ? faceX : ay >= az ? faceY : faceZ;

  let qx = 0, qy = 0, qz = 0;
  const nb = (ex: number, ey: number, ez: number) => world.get(qx + ex, qy + ey, qz + ez);

  let best = Infinity, bx = 0, by = 0, bz = 0, bFace = 0, bBlock = 0;
  let tEnter = 0;
  // Boxes stay inside their cell, so the first voxel with a hit holds the nearest one; keep
  // walking only while a later cell could still start before the best hit.
  for (let guard = 0; guard < 1024; guard++) {
    if (tEnter > maxDist || tEnter > best) break;
    if (y >= 0 && y <= 255) {
      const v = world.get(x, y, z);
      const id = v & ID_MASK;
      let boxes: Box[] | null = null;
      if (TARGETABLE[id]) {
        if (SHAPE[id] === S.cube) boxes = UNIT;
        else { qx = x; qy = y; qz = z; boxes = selectionBoxes(v, nb); }
      } else if (hitFluids && FLUID[id] && ((v >> 10) & 7) === 0) {
        boxes = SOURCE_FLUID;
      }
      if (boxes) {
        for (let i = 0; i < boxes.length; i++) {
          const b = boxes[i];
          // Slab test against the box in world space.
          let tn = -Infinity, tf = Infinity, fn = insideFace;
          let ok = true;
          for (let a = 0; a < 3 && ok; a++) {
            const o = a === 0 ? ox : a === 1 ? oy : oz;
            const d = a === 0 ? dx : a === 1 ? dy : dz;
            const base = a === 0 ? x : a === 1 ? y : z;
            const lo = base + b[a], hi = base + b[a + 3];
            if (d === 0) {
              if (o < lo || o > hi) ok = false;
              continue;
            }
            let t0 = (lo - o) / d, t1 = (hi - o) / d;
            if (t0 > t1) { const t = t0; t0 = t1; t1 = t; }
            if (t0 > tn) { tn = t0; fn = a === 0 ? faceX : a === 1 ? faceY : faceZ; }
            if (t1 < tf) tf = t1;
            if (tn > tf) ok = false;
          }
          if (!ok || tf < 0) continue;
          let t = tn;
          if (t < 0) { t = 0; fn = insideFace; }   // the eye is inside this box
          if (t <= maxDist && t < best) {
            best = t; bx = x; by = y; bz = z; bFace = fn; bBlock = v;
          }
        }
      }
    }
    // Advance to the next cell.
    if (tMX < tMY) {
      if (tMX < tMZ) { x += stepX; tEnter = tMX; tMX += tDX; }
      else { z += stepZ; tEnter = tMZ; tMZ += tDZ; }
    } else if (tMY < tMZ) { y += stepY; tEnter = tMY; tMY += tDY; }
    else { z += stepZ; tEnter = tMZ; tMZ += tDZ; }
    if (tEnter === Infinity) break;
  }
  if (best === Infinity) return null;
  return {
    x: bx, y: by, z: bz, face: bFace,
    px: ox + dx * best, py: oy + dy * best, pz: oz + dz * best,
    dist: best, block: bBlock,
  };
}
