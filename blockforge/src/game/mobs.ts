// Creatures: grazing animals by day, monsters in the dark. One client simulates them (the
// player in single player, the room's host in multiplayer) and everyone else shows the
// snapshots it sends. All of them are BlockForge's own: Woolly, Tusker and Longhorn graze;
// Shambler, Skitter and Brute hunt.
import { ID, LEAVES, SOLID, FLUID, idOf } from '../blocks/registry';
import type { World } from '../world/world';

export interface MobType {
  key: string; name: string;
  w: number; h: number;
  hp: number; speed: number;
  hostile: boolean; dmg: number;
  /** [thing name, min, max, chance] */
  drops: [string, number, number, number][];
}

export const MOB_TYPES: MobType[] = [
  { key: 'woolly', name: 'Woolly', w: 0.8, h: 1.1, hp: 8, speed: 1.4, hostile: false, dmg: 0, drops: [['white_wool', 1, 2, 1], ['raw_meat', 1, 2, 1]] },
  { key: 'tusker', name: 'Tusker', w: 0.8, h: 0.9, hp: 10, speed: 1.7, hostile: false, dmg: 0, drops: [['raw_meat', 1, 3, 1], ['hide', 0, 1, 1]] },
  { key: 'longhorn', name: 'Longhorn', w: 0.9, h: 1.3, hp: 12, speed: 1.3, hostile: false, dmg: 0, drops: [['hide', 1, 2, 1], ['raw_meat', 1, 3, 1]] },
  { key: 'shambler', name: 'Shambler', w: 0.6, h: 1.8, hp: 20, speed: 2.4, hostile: true, dmg: 3, drops: [['bone', 0, 2, 1], ['thread', 0, 1, 0.5], ['raw_iron', 1, 1, 0.06]] },
  { key: 'skitter', name: 'Skitter', w: 0.9, h: 0.6, hp: 12, speed: 4.3, hostile: true, dmg: 2, drops: [['thread', 0, 2, 1]] },
  { key: 'brute', name: 'Brute', w: 0.9, h: 2.3, hp: 40, speed: 1.9, hostile: true, dmg: 6, drops: [['bone', 1, 3, 1], ['iron_ingot', 0, 1, 0.5], ['coal', 0, 2, 1]] },
];

export interface Mob {
  id: number; t: number;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  yaw: number; hp: number;
  ground: boolean;
  /** walk animation phase and speed (0..1) */
  walk: number; moving: number;
  /** seconds left of the red hurt flash */
  hurt: number;
  // simulation (authority only)
  aiT: number; dx: number; dz: number; go: boolean;
  atkCd: number; flee: number; sunT: number; age: number;
  // interpolation targets (followers only)
  tx: number; ty: number; tz: number; tyaw: number;
}

/** Someone a monster can chase. id < 0 is the local player. */
export interface MobTarget { id: number; x: number; y: number; z: number; hunted: boolean }

const GRAVITY = 26;
const JUMP = 8.6;
const MAX_ANIMALS = 8;
const MAX_HOSTILE = 10;

export class Mobs {
  list: Mob[] = [];
  /** This client runs the simulation. */
  authority = true;
  /** Monsters only appear in survival worlds. */
  hostileAllowed = true;
  onAttack: ((targetId: number, dmg: number, mob: Mob) => void) | null = null;
  onDeath: ((mob: Mob, killer: number, drops: [string, number][]) => void) | null = null;
  private nextId = 1;
  private spawnT = 2;

  constructor(private world: World) {}

  clear() { this.list.length = 0; }

  private blank(t: number, x: number, y: number, z: number): Mob {
    return {
      id: this.nextId++, t, x, y, z, vx: 0, vy: 0, vz: 0, yaw: Math.random() * 6.28, hp: MOB_TYPES[t].hp, ground: false,
      walk: 0, moving: 0, hurt: 0, aiT: Math.random() * 2, dx: 0, dz: 0, go: false, atkCd: 0, flee: 0, sunT: 0, age: 0,
      tx: x, ty: y, tz: z, tyaw: 0,
    };
  }

  // ------------------------------------------------------------------ world queries
  private solid(x: number, y: number, z: number): boolean {
    if (y < 0) return true;
    return SOLID[idOf(this.world.get(Math.floor(x), Math.floor(y), Math.floor(z)))] === 1;
  }
  private loaded(x: number, z: number): boolean { return !!this.world.getChunk(Math.floor(x / 16), Math.floor(z / 16)); }
  private hits(x: number, y: number, z: number, hw: number, h: number): boolean {
    const x0 = Math.floor(x - hw), x1 = Math.floor(x + hw), z0 = Math.floor(z - hw), z1 = Math.floor(z + hw);
    const y0 = Math.floor(y), y1 = Math.floor(y + h - 0.01);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) for (let zz = z0; zz <= z1; zz++) if (this.solid(xx, yy, zz)) return true;
    return false;
  }

  // ------------------------------------------------------------------ frame
  update(dt: number, targets: MobTarget[], daylight: number) {
    if (!this.authority) { this.follow(dt); return; }
    this.spawnT -= dt;
    if (this.spawnT <= 0) { this.spawnT = 1.5; this.spawn(targets, daylight); }
    for (let i = this.list.length - 1; i >= 0; i--) {
      const m = this.list[i];
      if (!this.step(m, dt, targets, daylight)) this.list.splice(i, 1);
    }
  }

  private nearest(m: Mob, targets: MobTarget[], huntedOnly: boolean): { t: MobTarget | null; d: number } {
    let best: MobTarget | null = null, bd = 1e9;
    for (const t of targets) {
      if (huntedOnly && !t.hunted) continue;
      const d = Math.hypot(t.x - m.x, t.y - m.y, t.z - m.z);
      if (d < bd) { bd = d; best = t; }
    }
    return { t: best, d: bd };
  }

  /** One creature, one frame. Returns false when it should be removed. */
  private step(m: Mob, dt: number, targets: MobTarget[], daylight: number): boolean {
    const type = MOB_TYPES[m.t];
    const any = this.nearest(m, targets, false);
    if (!any.t || any.d > 96) return false;
    if (!this.loaded(m.x, m.z)) return any.d < 80;       // wait for the chunk; drop it if nobody is near
    m.age += dt;
    if (m.hurt > 0) m.hurt -= dt;
    if (m.atkCd > 0) m.atkCd -= dt;
    if (m.flee > 0) m.flee -= dt;

    // ---- thinking
    let speed = type.speed;
    const prey = type.hostile ? this.nearest(m, targets, true) : { t: null, d: 1e9 };
    if (prey.t && prey.d < 22) {
      const dx = prey.t.x - m.x, dz = prey.t.z - m.z, l = Math.hypot(dx, dz) || 1;
      m.dx = dx / l; m.dz = dz / l; m.go = l > 0.9;
      if (prey.d < 1.7 && Math.abs(prey.t.y - m.y) < 2 && m.atkCd <= 0) {
        m.atkCd = 1.1;
        this.onAttack?.(prey.t.id, type.dmg, m);
      }
    } else {
      m.aiT -= dt;
      if (m.flee > 0) speed *= 1.8;
      if (m.aiT <= 0) {
        m.aiT = 2 + Math.random() * 5;
        if (m.flee > 0 || Math.random() < 0.6) { const a = Math.random() * 6.283; m.dx = Math.cos(a); m.dz = Math.sin(a); m.go = true; }
        else m.go = false;
      }
      speed *= m.flee > 0 ? 1 : 0.6;
    }

    // ---- sunlight wears monsters down, so day is safe above ground
    if (type.hostile && daylight > 0.6 && this.world.getSky(Math.floor(m.x), Math.floor(m.y + type.h), Math.floor(m.z)) >= 14) {
      m.sunT += dt;
      if (m.sunT >= 1) { m.sunT = 0; m.hp -= 3; m.hurt = 0.25; if (m.hp <= 0) return false; }
    }
    // far away and bored: fade out so the world does not fill up
    if (any.d > 56 && m.age > 30 && Math.random() < dt * 0.05) return false;

    // ---- physics
    const hw = type.w / 2;
    const inFluid = FLUID[idOf(this.world.get(Math.floor(m.x), Math.floor(m.y + 0.4), Math.floor(m.z)))] === 1;
    const want = m.go ? speed : 0;
    const k = Math.min(1, dt * 8);
    m.vx += (m.dx * want - m.vx) * k;
    m.vz += (m.dz * want - m.vz) * k;
    if (inFluid) { m.vy += (2.2 - m.vy) * Math.min(1, dt * 4); m.vx *= 0.9; m.vz *= 0.9; }
    else m.vy = Math.max(-40, m.vy - GRAVITY * dt);
    let blocked = false;
    const nx = m.x + m.vx * dt;
    if (!this.hits(nx, m.y, m.z, hw, type.h)) m.x = nx; else { m.vx = 0; blocked = true; }
    const nz = m.z + m.vz * dt;
    if (!this.hits(m.x, m.y, nz, hw, type.h)) m.z = nz; else { m.vz = 0; blocked = true; }
    const ny = m.y + m.vy * dt;
    if (!this.hits(m.x, ny, m.z, hw, type.h)) { m.y = ny; m.ground = false; }
    else {
      if (m.vy < 0) {
        const top = Math.floor(ny) + 1;
        if (!this.hits(m.x, top, m.z, hw, type.h)) m.y = top;
        m.ground = true;
      }
      m.vy = 0;
    }
    if (blocked && m.go && (m.ground || inFluid)) { m.vy = JUMP; m.ground = false; }
    if (m.y < -30) return false;

    const sp = Math.hypot(m.vx, m.vz);
    m.moving = Math.min(1, sp / 2);
    m.walk += sp * dt * 2.4;
    if (sp > 0.2) {
      const want2 = Math.atan2(-m.vx, -m.vz);
      let d = want2 - m.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.yaw += d * Math.min(1, dt * 10);
    }
    return true;
  }

  // ------------------------------------------------------------------ spawning
  private count(hostile: boolean, t: MobTarget, r: number): number {
    let n = 0;
    for (const m of this.list) if (MOB_TYPES[m.t].hostile === hostile && Math.hypot(m.x - t.x, m.z - t.z) < r) n++;
    return n;
  }

  private spawn(targets: MobTarget[], daylight: number) {
    const w = this.world;
    for (const t of targets) {
      // animals: on grass, under the open sky, by day
      if (daylight > 0.4 && this.count(false, t, 72) < MAX_ANIMALS && Math.random() < 0.5) {
        const a = Math.random() * 6.283, d = 20 + Math.random() * 26;
        const x = Math.floor(t.x + Math.cos(a) * d), z = Math.floor(t.z + Math.sin(a) * d);
        if (this.loaded(x, z)) {
          let y = w.topY(x, z);
          while (y > 1 && (LEAVES[idOf(w.get(x, y, z))] || !SOLID[idOf(w.get(x, y, z))])) y--;
          if (idOf(w.get(x, y, z)) === ID.grass_block && !this.solid(x, y + 1, z) && !this.solid(x, y + 2, z) && !FLUID[idOf(w.get(x, y + 1, z))]) {
            const type = Math.floor(Math.random() * 3);
            const herd = 1 + Math.floor(Math.random() * 3);
            for (let i = 0; i < herd; i++) this.list.push(this.blank(type, x + 0.5 + (Math.random() - 0.5) * 2, y + 1.01, z + 0.5 + (Math.random() - 0.5) * 2));
          }
        }
      }
      if (!this.hostileAllowed || !t.hunted) continue;
      const night = daylight < 0.25;
      if (this.count(true, t, 72) >= (night ? MAX_HOSTILE : 5)) continue;
      for (let tries = 0; tries < 6; tries++) {
        const a = Math.random() * 6.283, d = 16 + Math.random() * 30;
        const x = Math.floor(t.x + Math.cos(a) * d), z = Math.floor(t.z + Math.sin(a) * d);
        if (!this.loaded(x, z)) continue;
        let y: number;
        if (night && Math.random() < 0.6) {
          y = w.topY(x, z);
          while (y > 1 && (LEAVES[idOf(w.get(x, y, z))] || !SOLID[idOf(w.get(x, y, z))])) y--;
          y += 1;
        } else {
          // somewhere dark underground near the player's depth
          y = Math.floor(t.y) - 14 + Math.floor(Math.random() * 22);
          if (y < 2 || y > 250) continue;
          while (y > 2 && !this.solid(x, y - 1, z)) y--;
          if (w.getSky(x, y, z) > 2) continue;
        }
        if (!this.solid(x, y - 1, z) || this.solid(x, y, z) || this.solid(x, y + 1, z)) continue;
        if (FLUID[idOf(w.get(x, y, z))] || w.getBlockLight(x, y, z) > 6) continue;
        const r = Math.random();
        const type = r < 0.6 ? 3 : r < 0.92 ? 4 : 5;
        if (type === 5 && this.solid(x, y + 2, z)) continue;
        this.list.push(this.blank(type, x + 0.5, y + 0.01, z + 0.5));
        break;
      }
    }
  }

  // ------------------------------------------------------------------ combat
  /** A player hit creature `id` (authority only). kx, kz = direction of the knock. */
  hit(id: number, dmg: number, kx: number, kz: number, killer: number) {
    const m = this.list.find((q) => q.id === id);
    if (!m) return;
    const type = MOB_TYPES[m.t];
    m.hp -= dmg;
    m.hurt = 0.3;
    m.vx += kx * 6; m.vz += kz * 6; m.vy = Math.max(m.vy, 5);
    m.ground = false;
    if (!type.hostile) { m.flee = 5; m.aiT = 0; }
    if (m.hp <= 0) {
      const drops: [string, number][] = [];
      for (const [name, a, b, chance] of type.drops) {
        if (Math.random() > chance) continue;
        const n = a + Math.floor(Math.random() * (b - a + 1));
        if (n > 0) drops.push([name, n]);
      }
      this.list.splice(this.list.indexOf(m), 1);
      this.onDeath?.(m, killer, drops);
    }
  }

  /** Nearest creature the ray (origin + dir * t, t <= reach) passes through. */
  pick(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, reach: number): { mob: Mob; dist: number } | null {
    let best: Mob | null = null, bd = reach;
    for (const m of this.list) {
      const type = MOB_TYPES[m.t];
      const d = rayBox(ox, oy, oz, dx, dy, dz, m.x - type.w / 2 - 0.1, m.y, m.z - type.w / 2 - 0.1, m.x + type.w / 2 + 0.1, m.y + type.h, m.z + type.w / 2 + 0.1);
      if (d >= 0 && d < bd) { bd = d; best = m; }
    }
    return best ? { mob: best, dist: bd } : null;
  }

  // ------------------------------------------------------------------ network
  snapshot(): number[] {
    const out: number[] = [];
    for (const m of this.list) out.push(m.id, m.t, Math.round(m.x * 16), Math.round(m.y * 16), Math.round(m.z * 16), Math.round(m.yaw * 100), Math.ceil(m.hp), m.hurt > 0 ? 1 : 0);
    return out;
  }

  applySnapshot(a: number[]) {
    const seen = new Set<number>();
    for (let i = 0; i + 7 < a.length; i += 8) {
      const id = a[i], t = a[i + 1];
      if (!MOB_TYPES[t]) continue;
      seen.add(id);
      const x = a[i + 2] / 16, y = a[i + 3] / 16, z = a[i + 4] / 16;
      let m = this.list.find((q) => q.id === id);
      if (!m) { m = this.blank(t, x, y, z); m.id = id; this.list.push(m); }
      m.tx = x; m.ty = y; m.tz = z; m.tyaw = a[i + 5] / 100; m.hp = a[i + 6];
      if (a[i + 7] && m.hurt <= 0) m.hurt = 0.3;
    }
    for (let i = this.list.length - 1; i >= 0; i--) if (!seen.has(this.list[i].id)) this.list.splice(i, 1);
  }

  private follow(dt: number) {
    const k = Math.min(1, dt * 12);
    for (const m of this.list) {
      const ox = m.x, oz = m.z;
      m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k; m.z += (m.tz - m.z) * k;
      let d = m.tyaw - m.yaw;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.yaw += d * k;
      const sp = Math.hypot(m.x - ox, m.z - oz) / Math.max(dt, 1e-3);
      m.moving = Math.min(1, sp / 2);
      m.walk += sp * dt * 2.4;
      if (m.hurt > 0) m.hurt -= dt;
    }
  }
}

/** Distance along the ray to an axis-aligned box, or -1. */
export function rayBox(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number,
  x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): number {
  let t0 = 0, t1 = 1e9;
  const o = [ox, oy, oz], d = [dx, dy, dz], lo = [x0, y0, z0], hi = [x1, y1, z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-9) { if (o[i] < lo[i] || o[i] > hi[i]) return -1; continue; }
    let a = (lo[i] - o[i]) / d[i], b = (hi[i] - o[i]) / d[i];
    if (a > b) { const s = a; a = b; b = s; }
    t0 = Math.max(t0, a); t1 = Math.min(t1, b);
    if (t0 > t1) return -1;
  }
  return t0;
}
