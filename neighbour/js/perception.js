// What the neighbour (and his cameras) can see and hear. Pure JS so the tests can check that walls
// block sight, glass doesn't, shadows and crouching hide you and noise is muffled by walls.

import { pointInBox } from './geom.js';

export const VISION = {
  fov: 110 * Math.PI / 180,   // full cone angle
  range: 22,
  feel: 1.3,                  // he notices you this close even behind him
};

// Ambient light level (0 dark .. 1 bright) at a point: the smallest light zone containing it, else outdoors.
export function lightAt(level, x, y, z) {
  let best = null, bv = Infinity;
  for (const zn of level.lightZones) {
    const b = zn.box;
    if (!pointInBox(b, x, y, z)) continue;
    const v = (b.x1 - b.x0) * (b.y1 - b.y0) * (b.z1 - b.z0);
    if (v < bv) { bv = v; best = zn; }
  }
  return best ? best.level : level.outdoorLight;
}

// Line of sight between two points. blockers: a SpatialHash of static boxes; dyn: extra boxes
// (closed doors, boards, crates). Boxes with op === false (glass, decals) don't block.
const opaque = b => b.op !== false;
export function lineOfSight(hash, dyn, ax, ay, az, bx, by, bz) {
  const hit = hash.raycast(ax, ay, az, bx - ax, by - ay, bz - az, opaque, dyn);
  return !hit || hit.t > 0.999;
}

// How fast the observer's awareness of the target grows (per second, 0 = can't see).
// obs: {x, y (eye), z, yaw, fov, range}; tgt: {x, y (feet), z, height, crouch, speed, light}
export function sightRate(hash, dyn, obs, tgt) {
  const dx = tgt.x - obs.x, dz = tgt.z - obs.z;
  const dist = Math.hypot(dx, dz);
  const range = obs.range || VISION.range;
  if (dist > range) return 0;
  const fwdX = -Math.sin(obs.yaw), fwdZ = -Math.cos(obs.yaw);
  const cos = dist > 1e-3 ? (dx * fwdX + dz * fwdZ) / dist : 1;
  const half = (obs.fov || VISION.fov) / 2;
  const ang = Math.acos(Math.max(-1, Math.min(1, cos)));
  const feel = obs.feel !== undefined ? obs.feel : VISION.feel;
  if (ang > half && dist > feel) return 0;
  // two sample points on the body; any clear line counts
  const headY = tgt.y + tgt.height - 0.12, chestY = tgt.y + tgt.height * 0.55;
  let seen = 0;
  if (lineOfSight(hash, dyn, obs.x, obs.y, obs.z, tgt.x, headY, tgt.z)) seen++;
  if (lineOfSight(hash, dyn, obs.x, obs.y, obs.z, tgt.x, chestY, tgt.z)) seen++;
  if (!seen) return 0;
  const near = dist < 4 ? 1 : Math.max(0.18, 1 - (dist - 4) / (range - 4) * 0.82);
  const centre = ang > half ? 0.6 : 1 - 0.45 * (ang / half);
  const light = 0.15 + 0.85 * (tgt.light === undefined ? 1 : tgt.light);
  const crouch = tgt.crouch ? 0.5 : 1;
  const motion = tgt.speed > 4 ? 1.35 : tgt.speed > 0.5 ? 1 : 0.7;
  const body = seen === 2 ? 1 : 0.7;
  let rate = 2.6 * near * centre * light * crouch * motion * body;
  if (dist < 2.2) rate = Math.max(rate, 3);   // right in front of him: no hiding in plain sight
  return rate;
}

// Noise heard by a listener: 0..1+ (>= 1 means clearly heard). Walls in between cut the range.
export function hearNoise(hash, dyn, listener, noise, mul = 1) {
  const d = Math.hypot(noise.x - listener.x, (noise.y - listener.y) * 1.5, noise.z - listener.z);
  let r = noise.radius * mul;
  if (!lineOfSight(hash, dyn, listener.x, listener.y, listener.z, noise.x, noise.y + 0.3, noise.z)) r *= 0.6;
  if (d >= r) return 0;
  return 1 - d / r * 0.5 + (d < r * 0.5 ? 0.25 : 0);
}

// Noise radii (m) for the things you do.
export const NOISE = {
  sprint: 9, walk: 3.6, crouch: 0.9, land: 6, jump: 3,
  door: 6, doorSlam: 12, glass: 26, impact: 9, trap: 30, alarm: 40, boards: 14, chain: 16, crate: 7,
};
