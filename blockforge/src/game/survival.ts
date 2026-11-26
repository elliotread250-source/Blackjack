// Survival state for the local player: health, hunger, air, armour, and the things that
// hurt (falls, drowning, lava, starving, creatures).
import { ID, idOf } from '../blocks/registry';
import type { World } from '../world/world';
import type { Player } from './player';
import type { Inventory } from './inventory';
import type { ItemDef } from './items';

export const MAX_HEALTH = 20;
export const MAX_HUNGER = 20;
export const MAX_AIR = 10;   // seconds of breath

export interface SurvivalHooks {
  onHurt(amount: number, cause: string): void;
  onDeath(cause: string): void;
}
export interface SurvivalState { health: number; hunger: number; sat: number; air: number; spawn: [number, number, number] | null }

export class Survival {
  health = MAX_HEALTH;
  hunger = MAX_HUNGER;
  sat = 5;
  air = MAX_AIR;
  dead = false;
  spawn: [number, number, number] | null = null;
  /** Seconds since the last hit, for the HUD flash and the short immunity after a hit. */
  sinceHurt = 10;
  private exhaustion = 0;
  private regenT = 0;
  private starveT = 0;
  private drownT = 0;
  private burnT = 0;
  private fallPeak = -1e9;
  private wasGround = true;
  private lx = 0; private lz = 0; private hasLast = false;

  constructor(private inv: Inventory, private hooks: SurvivalHooks) {}

  /** Tire the player (digging, fighting). */
  exhaust(n: number) { this.exhaustion += n; }

  update(dt: number, p: Player, world: World) {
    if (this.dead) return;
    this.sinceHurt += dt;

    // ---- falls
    if (p.frozen) { this.fallPeak = p.y; this.wasGround = true; }
    else if (p.onGround || p.inWater || p.inLava || p.flying) {
      if (p.onGround && !this.wasGround && !p.inWater) {
        const drop = this.fallPeak - p.y;
        const under = idOf(world.get(Math.floor(p.x), Math.floor(p.y - 0.2), Math.floor(p.z)));
        const soft = under === ID.slime_block || under === ID.hay_block;
        if (drop > 3.5 && !soft) this.damage(Math.floor(drop - 3), 'fell from a high place', true);
      }
      this.fallPeak = p.y;
      this.wasGround = true;
    } else {
      if (this.wasGround) this.fallPeak = p.y;
      this.fallPeak = Math.max(this.fallPeak, p.y);
      this.wasGround = false;
    }
    if (p.y < -20) this.damage(1000, 'fell out of the world', true);

    // ---- breath
    if (p.headInWater) {
      this.air = Math.max(0, this.air - dt);
      if (this.air <= 0) {
        this.drownT += dt;
        if (this.drownT >= 1) { this.drownT = 0; this.damage(2, 'drowned', true); }
      }
    } else { this.air = Math.min(MAX_AIR, this.air + dt * 5); this.drownT = 0; }

    // ---- lava
    if (p.inLava) {
      this.burnT += dt;
      if (this.burnT >= 0.5) { this.burnT = 0; this.damage(4, 'tried to swim in lava'); }
    } else this.burnT = 0.4;

    // ---- hunger
    if (this.hasLast) {
      const d = Math.hypot(p.x - this.lx, p.z - this.lz);
      if (d < 3) this.exhaustion += d * (p.sprinting ? 0.1 : 0.012);
    }
    this.lx = p.x; this.lz = p.z; this.hasLast = true;
    this.exhaustion += dt * 0.006;
    while (this.exhaustion >= 4) {
      this.exhaustion -= 4;
      if (this.sat > 0) this.sat = Math.max(0, this.sat - 1);
      else this.hunger = Math.max(0, this.hunger - 1);
    }
    if (this.hunger >= 18 && this.health < MAX_HEALTH) {
      this.regenT += dt;
      if (this.regenT >= 3.5) { this.regenT = 0; this.health = Math.min(MAX_HEALTH, this.health + 1); this.exhaustion += 1.5; }
    } else this.regenT = 0;
    if (this.hunger <= 0) {
      this.starveT += dt;
      if (this.starveT >= 4) { this.starveT = 0; if (this.health > 1) this.damage(1, 'starved', true); }
    } else this.starveT = 0;
  }

  /** Too hungry to sprint. */
  get canSprint(): boolean { return this.hunger > 6; }

  damage(n: number, cause: string, ignoreArmor = false) {
    if (this.dead || n <= 0) return;
    if (!ignoreArmor) {
      if (this.sinceHurt < 0.5) return;   // brief immunity so one bite is one hit
      n = Math.max(1, Math.round(n * (1 - 0.04 * Math.min(20, this.inv.armorPoints()))));
    }
    this.sinceHurt = 0;
    this.health = Math.max(0, this.health - n);
    this.exhaustion += 0.3;
    this.hooks.onHurt(n, cause);
    if (this.health <= 0) { this.dead = true; this.hooks.onDeath(cause); }
  }

  /** Eat. Returns false when the player is not hungry. */
  eat(d: ItemDef): boolean {
    const f = d.food;
    if (!f || this.dead) return false;
    if (this.hunger >= MAX_HUNGER && !f.heal) return false;
    this.hunger = Math.min(MAX_HUNGER, this.hunger + f.hunger);
    this.sat = Math.min(this.hunger, this.sat + f.sat);
    if (f.heal) this.health = Math.min(MAX_HEALTH, this.health + f.heal);
    return true;
  }

  respawn() {
    this.health = MAX_HEALTH; this.hunger = MAX_HUNGER; this.sat = 5; this.air = MAX_AIR;
    this.dead = false; this.exhaustion = 0; this.sinceHurt = 10; this.hasLast = false; this.wasGround = true; this.fallPeak = -1e9;
  }

  /** Forget the fall in progress (after a teleport). */
  resetFall(y: number) { this.fallPeak = y; this.wasGround = true; this.hasLast = false; }

  serialize(): SurvivalState { return { health: this.health, hunger: this.hunger, sat: this.sat, air: this.air, spawn: this.spawn }; }
  restore(s: Partial<SurvivalState> | null | undefined) {
    const num = (v: unknown, d: number, max: number) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(max, v)) : d);
    this.health = num(s?.health, MAX_HEALTH, MAX_HEALTH) || MAX_HEALTH;
    this.hunger = num(s?.hunger, MAX_HUNGER, MAX_HUNGER);
    this.sat = num(s?.sat, 5, MAX_HUNGER);
    this.air = num(s?.air, MAX_AIR, MAX_AIR);
    this.spawn = Array.isArray(s?.spawn) && s!.spawn!.length === 3 ? [Number(s!.spawn![0]), Number(s!.spawn![1]), Number(s!.spawn![2])] : null;
    this.dead = false;
  }
}
