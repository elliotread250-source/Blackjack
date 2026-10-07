// The player: creative-mode movement physics, collision, fluids and camera smoothing.
//
// Movement runs as a fixed 20 Hz simulation that follows the reference game's own per-tick
// rules (input impulse, friction, gravity 0.08 b/t^2 with 0.98 drag, jump 0.42 b/t, flying
// 0.05 with 0.91 glide and 0.6 vertical damping, water/lava drag, sprint and sneak
// multipliers). Running the original integration step is what makes speeds, acceleration
// curves and jump arcs match exactly (walk 4.317 m/s, sprint 5.612, sneak 1.295, fly 10.9,
// sprint-fly 21.8, fly vertical 7.5, jump apex 1.252, terminal ~78 m/s). Position, eye
// height, FOV and view bobbing are interpolated between ticks for rendering, and mouse look
// is applied every frame, so the camera stays smooth at any frame rate.
//
// Public velocities (vx, vy, vz) are in blocks per second.
import { collisionBoxes } from '../blocks/shapes';
import { COUNT, ID, ID_MASK, FLUID, SHAPE, SOLID, S } from '../blocks/registry';
import type { World } from '../world/world';
import type { Input } from './input';
import type { Settings } from '../settings';
import type { PlayerState } from '../types';

export const TICK = 0.05;                 // seconds per simulation step (20 Hz)
const MAX_TICKS_PER_FRAME = 5;
const HALF_W = 0.3;
const STAND_H = 1.8;
const CROUCH_H = 1.5;
const EYE_STAND = 1.62;
const EYE_CROUCH = 1.27;
const STEP = 0.6;
const GRAVITY = 0.08;
const DRAG = 0.98;
const JUMP = 0.42;
const WALK = 0.1;                         // movement speed attribute
const SPRINT_MUL = 1.3;
const SNEAK_MUL = 0.3;
const FLY = 0.05;                         // creative flying speed
const DOUBLE_TAP_SPACE = 0.3;             // seconds
const DOUBLE_TAP_W = 0.35;                // 7 ticks
const EPS = 1e-7;
const DEG = Math.PI / 180;
const PITCH_LIMIT = Math.PI / 2 - 0.001;

// Per-block movement properties (everything else: friction 0.6, factors 1).
const FRICTION = new Float32Array(COUNT).fill(0.6);
const SPEED_FACTOR = new Float32Array(COUNT).fill(1);
const JUMP_FACTOR = new Float32Array(COUNT).fill(1);
function setProp(arr: Float32Array, name: string, v: number) { const id = ID[name]; if (id !== undefined) arr[id] = v; }
setProp(FRICTION, 'ice', 0.98);
setProp(FRICTION, 'packed_ice', 0.98);
setProp(FRICTION, 'blue_ice', 0.989);
setProp(FRICTION, 'slime_block', 0.8);
setProp(SPEED_FACTOR, 'soul_sand', 0.4);
setProp(SPEED_FACTOR, 'honey_block', 0.4);
setProp(JUMP_FACTOR, 'honey_block', 0.5);
const WATER = ID.water ?? -1;
const LAVA = ID.lava ?? -1;
const SLIME = ID.slime_block ?? -1;
const COBWEB = ID.cobweb ?? -1;

/** Physics height of a fluid cell (source 8/9, flowing (8 - level)/9, full when the same fluid is above). */
export function fluidHeight(v: number, above: number): number {
  const id = v & ID_MASK;
  if ((above & ID_MASK) === id) return 1;
  const meta = v >> 10;
  if (meta & 8) return 8 / 9;
  return (8 - (meta & 7)) / 9;
}
/** Rendered surface height (mesher: 14/16, lowered by level/9 when flowing). */
function fluidSurface(v: number, above: number): number {
  const id = v & ID_MASK;
  if ((above & ID_MASK) === id) return 1;
  const meta = v >> 10;
  if (meta & 8) return 14 / 16;
  return Math.max(1 / 16, 14 / 16 - (meta & 7) / 9);
}

const wrapAngle = (a: number) => {
  if (a > Math.PI || a < -Math.PI) a -= Math.floor((a + Math.PI) / (2 * Math.PI)) * 2 * Math.PI;
  return a;
};

export class Player {
  x = 0; y = 80; z = 0;                  // feet centre
  vx = 0; vy = 0; vz = 0;                // blocks per second
  yaw = 0; pitch = 0;
  flying = false; sprinting = false; sneaking = false;
  onGround = false; inWater = false; inLava = false; headInWater = false;
  readonly width = 0.6 as const;
  readonly height = 1.8 as const;
  /** Last move was blocked sideways (sprint stops on a head-on hit). */
  horizontalCollision = false;
  /** The column under the player is not loaded yet: physics is frozen until it is. */
  frozen = false;

  // interpolation state (o* = previous tick, s* = position the last tick produced)
  private ox = 0; private oy = 80; private oz = 0;
  private sx = 0; private sy = 80; private sz = 0;
  private alpha = 0;
  private acc = 0;
  private clock = 0;
  private eyeH = EYE_STAND; private oEyeH = EYE_STAND;
  private fovMod = 1; private oFovMod = 1;
  private bobAmt = 0; private oBobAmt = 0;
  private walkDist = 0; private oWalkDist = 0;

  // input snapshot used by the ticks of this frame
  private kF = false; private kB = false; private kL = false; private kR = false;
  private kJump = false; private kShift = false; private kSprint = false;
  private jumpLatch = false;
  private flyToggle = false;
  private sprintTap = false;
  private lastSpaceTap = -1e9;
  private lastWTap = -1e9;

  // simulation state
  private tvx = 0; private tvy = 0; private tvz = 0;   // blocks per tick inside a tick
  private noJumpDelay = 0;
  private crouched = false;
  private minorCollision = false;
  private waterHeight = 0;
  private lavaHeight = 0;
  private eyeUnder = false;
  private stuck = false;
  private edgeGuard = false;

  // collision scratch (no allocation per tick)
  private w: World | null = null;
  private boxes = new Float64Array(6 * 128);
  private nBoxes = 0;
  private bb = new Float64Array(6);
  private tb = new Float64Array(6);
  private eb = new Float64Array(6);
  private mb = new Float64Array(6);
  private res = new Float64Array(3);
  private qx = 0; private qy = 0; private qz = 0;
  private nb = (dx: number, dy: number, dz: number): number => this.w!.get(this.qx + dx, this.qy + dy, this.qz + dz);
  private lcx = NaN; private lcz = NaN; private lres = false;

  /** Toggle creative flight on the next tick (the touch Fly button; same as a double-tap of Space). */
  toggleFlight(): void { this.flyToggle = true; }

  eyeHeight(): number { return this.oEyeH + (this.eyeH - this.oEyeH) * this.alpha; }
  /** Collision box height: 1.5 while crouching (fits under 1.5 block gaps), else 1.8. */
  boxHeight(): number { return this.crouched ? CROUCH_H : STAND_H; }

  update(dt: number, input: Input, world: World, settings: Settings): void {
    this.w = world;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.25) dt = 0.25;
    this.clock += dt;

    if (input.enabled) {
      if (input.mouseDX || input.mouseDY) {
        // The reference game's curve: slider s in 0..1 -> (0.6 s + 0.2)^3 * 8 * 0.15 deg per count.
        // settings.sensitivity 1 = the default slider position (0.5).
        const s = Math.max(0, Math.min(1, (settings.sensitivity || 1) * 0.5));
        const f = s * 0.6 + 0.2;
        const k = f * f * f * 8 * 0.15 * DEG;
        this.yaw = wrapAngle(this.yaw - input.mouseDX * k);
        const p = this.pitch - input.mouseDY * k * (settings.invertY ? -1 : 1);
        this.pitch = p > PITCH_LIMIT ? PITCH_LIMIT : p < -PITCH_LIMIT ? -PITCH_LIMIT : p;
      }
      if (input.pressed('Space')) {
        this.jumpLatch = true;
        if (this.clock - this.lastSpaceTap < DOUBLE_TAP_SPACE) { this.flyToggle = !this.flyToggle; this.lastSpaceTap = -1e9; }
        else this.lastSpaceTap = this.clock;
      }
      if (input.pressed('KeyW')) {
        if (this.clock - this.lastWTap < DOUBLE_TAP_W) { this.sprintTap = true; this.lastWTap = -1e9; }
        else this.lastWTap = this.clock;
      }
      this.kF = input.down('KeyW');
      this.kB = input.down('KeyS');
      this.kL = input.down('KeyA');
      this.kR = input.down('KeyD');
      this.kJump = input.down('Space');
      this.kShift = input.down('ShiftLeft') || input.down('ShiftRight');
      this.kSprint = input.down('ControlLeft') || input.down('ControlRight');
    } else {
      this.kF = this.kB = this.kL = this.kR = this.kJump = this.kShift = this.kSprint = false;
    }

    this.acc += dt;
    let n = 0;
    while (this.acc >= TICK && n < MAX_TICKS_PER_FRAME) { this.tick(); this.acc -= TICK; n++; }
    if (this.acc >= TICK) this.acc = TICK * 0.999;   // too slow to keep up: drop time, never spiral
    this.alpha = this.acc / TICK;
    this.updateHead();
  }

  eye(): { x: number; y: number; z: number } {
    const p = this.renderPos();
    return { x: p[0], y: p[1] + this.eyeHeight(), z: p[2] };
  }

  look(): [number, number, number] {
    const cp = Math.cos(this.pitch);
    return [-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp];
  }

  /** 1 normally, 1.1 sprinting, 1.15 sprint-flying, eased like the reference game. */
  fovScale(): number { return this.oFovMod + (this.fovMod - this.oFovMod) * this.alpha; }

  /**
   * View bobbing. phase is in radians (walked distance * 0.6 * PI): the reference game sways
   * the camera by x = sin(phase) * a * 0.5, y = -|cos(phase)| * a, roll sin(phase) * a * 3 deg,
   * pitch |cos(phase - 0.2)| * a * 5 deg with a = amount * 0.1 (blocks). amount is 0..1
   * (1 = walking or sprinting on the ground, about 0.35 sneaking, 0 airborne or flying).
   */
  bob(): { phase: number; amount: number } {
    const a = this.alpha;
    const walk = this.oWalkDist + (this.walkDist - this.oWalkDist) * a;
    const amt = this.oBobAmt + (this.bobAmt - this.oBobAmt) * a;
    return { phase: walk * Math.PI, amount: Math.max(0, Math.min(1, amt / 0.1)) };
  }

  serialize(): PlayerState {
    return { x: this.x, y: this.y, z: this.z, yaw: this.yaw, pitch: this.pitch, flying: this.flying };
  }

  restore(s: PlayerState): void {
    const fin = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
    this.x = fin(s.x, 0.5);
    this.y = Math.max(0, Math.min(300, fin(s.y, 80)));
    this.z = fin(s.z, 0.5);
    this.yaw = wrapAngle(fin(s.yaw, 0));
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, fin(s.pitch, 0)));
    this.flying = !!s.flying;
    this.vx = this.vy = this.vz = 0;
    this.ox = this.sx = this.x; this.oy = this.sy = this.y; this.oz = this.sz = this.z;
    this.acc = 0; this.alpha = 0;
    this.crouched = this.sneaking = this.sprinting = false;
    this.eyeH = this.oEyeH = EYE_STAND;
    this.fovMod = this.oFovMod = 1;
    this.bobAmt = this.oBobAmt = 0;
    this.onGround = false;
    this.noJumpDelay = 0;
    this.flyToggle = this.sprintTap = this.jumpLatch = false;
  }

  // ------------------------------------------------------------------ simulation
  private renderPos(): [number, number, number] {
    // Something moved the player from outside the simulation (teleport, restore): no lerp.
    if (this.x !== this.sx || this.y !== this.sy || this.z !== this.sz) return [this.x, this.y, this.z];
    const a = this.alpha;
    return [this.ox + (this.x - this.ox) * a, this.oy + (this.y - this.oy) * a, this.oz + (this.z - this.oz) * a];
  }

  private tick(): void {
    const w = this.w!;
    this.ox = this.x; this.oy = this.y; this.oz = this.z;
    this.oEyeH = this.eyeH; this.oFovMod = this.fovMod; this.oBobAmt = this.bobAmt; this.oWalkDist = this.walkDist;
    this.lcx = NaN;
    if (!this.loadedAt(Math.floor(this.x), Math.floor(this.z))) {
      // Never fall into terrain that has not streamed in yet.
      this.frozen = true;
      this.vx = this.vy = this.vz = 0;
      this.sx = this.x; this.sy = this.y; this.sz = this.z;
      this.jumpLatch = false;
      return;
    }
    this.frozen = false;
    this.tvx = this.vx * TICK; this.tvy = this.vy * TICK; this.tvz = this.vz * TICK;

    this.updateFluids(w);
    if (this.noJumpDelay > 0) this.noJumpDelay--;

    // Double-tap Space toggles creative flight (not while sneaking into a crawl gap).
    if (this.flyToggle) {
      this.flyToggle = false;
      this.flying = !this.flying;
      // Taking off from the ground (touch Fly button): lift a little so landing does not end it at once.
      if (this.flying && this.onGround) { this.tvy = Math.max(this.tvy, 0.2); this.onGround = false; }
    }

    // Pose: crouch while Shift is held on foot; stay crouched where there is no room to stand.
    const shift = this.kShift;
    if (shift && !this.flying) this.crouched = true;
    else if (this.crouched && this.fits(STAND_H)) this.crouched = false;
    this.sneaking = this.crouched;

    let fwd = (this.kF ? 1 : 0) - (this.kB ? 1 : 0);
    let str = (this.kL ? 1 : 0) - (this.kR ? 1 : 0);
    if (this.crouched) { fwd *= SNEAK_MUL; str *= SNEAK_MUL; }

    // Sprint: Ctrl, or double-tap W. Stops when W is let go, when sneaking, on a head-on
    // collision, or when wading at the water surface.
    const hasForward = fwd > 1e-5;
    if (!this.sprinting && hasForward && !this.crouched) {
      if (this.sprintTap && (this.onGround || this.flying || this.eyeUnder)) this.sprinting = true;
      if (this.kSprint && (!this.inWater || this.eyeUnder || this.flying)) this.sprinting = true;
    }
    this.sprintTap = false;
    if (this.sprinting && (!hasForward || this.crouched || (this.horizontalCollision && !this.minorCollision) ||
      (this.inWater && !this.eyeUnder && !this.flying))) this.sprinting = false;

    const jump = this.kJump || this.jumpLatch;
    this.jumpLatch = false;
    if (this.flying) {
      let d = 0;
      if (shift) d--;
      if (jump) d++;
      this.tvy += d * FLY * 3;
    } else if (this.inWater && shift) {
      this.tvy -= 0.04;   // sink faster while sneaking in water
    }
    if (Math.abs(this.tvx) < 0.003) this.tvx = 0;
    if (Math.abs(this.tvy) < 0.003) this.tvy = 0;
    if (Math.abs(this.tvz) < 0.003) this.tvz = 0;

    if (jump && !this.flying) {
      const fh = this.inLava ? this.lavaHeight : this.waterHeight;
      const inW = this.inWater && fh > 0;
      const thr = 0.4;
      if (!inW || (this.onGround && !(fh > thr))) {
        if (!this.inLava || (this.onGround && !(fh > thr))) {
          if ((this.onGround || (inW && fh <= thr)) && this.noJumpDelay === 0) { this.jumpFromGround(w); this.noJumpDelay = 10; }
        } else this.tvy += 0.04;   // swim up in lava
      } else this.tvy += 0.04;     // swim up in water
    } else this.noJumpDelay = 0;

    this.edgeGuard = shift && !this.flying && this.onGround;
    this.travel(w, str * 0.98, fwd * 0.98);

    // Touching the ground ends creative flight.
    if (this.onGround && this.flying) this.flying = false;

    const hs = Math.min(0.1, Math.sqrt(this.tvx * this.tvx + this.tvz * this.tvz));
    this.bobAmt += ((this.onGround ? hs : 0) - this.bobAmt) * 0.4;
    const fovT = this.sprinting ? (this.flying ? 1.15 : 1.1) : 1;
    this.fovMod += (fovT - this.fovMod) * 0.5;
    this.eyeH += ((this.crouched ? EYE_CROUCH : EYE_STAND) - this.eyeH) * 0.5;

    this.vx = this.tvx / TICK; this.vy = this.tvy / TICK; this.vz = this.tvz / TICK;
    this.sx = this.x; this.sy = this.y; this.sz = this.z;
  }

  private jumpFromGround(w: World) {
    const feet = w.get(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z)) & ID_MASK;
    let jf = JUMP_FACTOR[feet];
    if (jf === 1) jf = JUMP_FACTOR[this.blockBelow(w, 0.5000001)];
    this.tvy = JUMP * jf;
    if (this.sprinting) {
      this.tvx -= Math.sin(this.yaw) * 0.2;
      this.tvz -= Math.cos(this.yaw) * 0.2;
    }
  }

  private travel(w: World, xxa: number, zza: number) {
    if (this.inWater && !this.flying) {
      const y0 = this.y;
      const f = this.sprinting ? 0.9 : 0.8;
      this.moveRelative(0.02, xxa, zza);
      this.move(w, this.tvx, this.tvy, this.tvz);
      this.tvx *= f; this.tvy *= 0.8; this.tvz *= f;
      if (!this.sprinting) this.tvy -= GRAVITY / 16;
      if (this.horizontalCollision && this.freeAt(w, this.tvx, this.tvy + 0.6 - this.y + y0, this.tvz)) this.tvy = 0.3;
    } else if (this.inLava && !this.flying) {
      const y0 = this.y;
      this.moveRelative(0.02, xxa, zza);
      this.move(w, this.tvx, this.tvy, this.tvz);
      if (this.lavaHeight <= 0.4) {
        this.tvx *= 0.5; this.tvy *= 0.8; this.tvz *= 0.5;
        if (!this.sprinting) this.tvy -= GRAVITY / 16;
      } else {
        this.tvx *= 0.5; this.tvy *= 0.5; this.tvz *= 0.5;
      }
      this.tvy -= GRAVITY / 4;
      if (this.horizontalCollision && this.freeAt(w, this.tvx, this.tvy + 0.6 - this.y + y0, this.tvz)) this.tvy = 0.3;
    } else {
      const bf = FRICTION[this.blockBelow(w, 0.5000001)];
      const keep = this.onGround ? bf * 0.91 : 0.91;
      const speed = this.onGround
        ? WALK * (this.sprinting ? SPRINT_MUL : 1) * (0.21600002 / (bf * bf * bf))
        : this.flying ? FLY * (this.sprinting ? 2 : 1) : this.sprinting ? 0.026 : 0.02;
      const vy0 = this.tvy;
      this.moveRelative(speed, xxa, zza);
      this.move(w, this.tvx, this.tvy, this.tvz);
      this.tvy = this.flying ? vy0 * 0.6 : (this.tvy - GRAVITY) * DRAG;
      this.tvx *= keep; this.tvz *= keep;
    }
  }

  private moveRelative(speed: number, xxa: number, zza: number) {
    const len2 = xxa * xxa + zza * zza;
    if (len2 < 1e-7) return;
    let ix = xxa, iz = zza;
    if (len2 > 1) { const l = Math.sqrt(len2); ix /= l; iz /= l; }
    ix *= speed; iz *= speed;
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    // forward = (-sin yaw, -cos yaw), left = (-cos yaw, sin yaw)
    this.tvx += -iz * s - ix * c;
    this.tvz += -iz * c + ix * s;
  }

  private setBB(h = this.boxHeight()) {
    const b = this.bb;
    b[0] = this.x - HALF_W; b[1] = this.y; b[2] = this.z - HALF_W;
    b[3] = this.x + HALF_W; b[4] = this.y + h; b[5] = this.z + HALF_W;
    return b;
  }

  private move(w: World, mx: number, my: number, mz: number) {
    if (this.stuck) {
      mx *= 0.25; my *= 0.05; mz *= 0.25;
      this.tvx = this.tvy = this.tvz = 0;
    }
    const bb = this.setBB();
    const ax = Math.abs(mx), ay = Math.abs(my), az = Math.abs(mz);
    this.gather(w, bb[0] - ax - 0.01, bb[1] - ay - STEP - 0.01, bb[2] - az - 0.01, bb[3] + ax + 0.01, bb[4] + ay + STEP + 0.01, bb[5] + az + 0.01);

    // Sneaking on the ground: never step off an edge higher than the step height.
    if (this.edgeGuard && my <= 0) {
      let d0 = mx, d1 = mz;
      const s = 0.05;
      while (d0 !== 0 && this.free(d0, -STEP, 0)) d0 = d0 < s && d0 >= -s ? 0 : d0 > 0 ? d0 - s : d0 + s;
      while (d1 !== 0 && this.free(0, -STEP, d1)) d1 = d1 < s && d1 >= -s ? 0 : d1 > 0 ? d1 - s : d1 + s;
      while (d0 !== 0 && d1 !== 0 && this.free(d0, -STEP, d1)) {
        d0 = d0 < s && d0 >= -s ? 0 : d0 > 0 ? d0 - s : d0 + s;
        d1 = d1 < s && d1 >= -s ? 0 : d1 > 0 ? d1 - s : d1 + s;
      }
      mx = d0; mz = d1;
    }

    this.collide(mx, my, mz);
    const rx = this.res[0], ry = this.res[1], rz = this.res[2];
    this.x += rx; this.y += ry; this.z += rz;

    const hx = Math.abs(mx - rx) > 1e-5, hz = Math.abs(mz - rz) > 1e-5;
    const vert = Math.abs(my - ry) > 1e-5;
    this.horizontalCollision = hx || hz;
    this.onGround = vert && my < 0;
    this.minorCollision = this.horizontalCollision && this.isMinorCollision(rx, rz);
    if (hx) this.tvx = 0;
    if (hz) this.tvz = 0;
    const under = this.blockId(w, Math.floor(this.x), Math.floor(this.y - 0.2), Math.floor(this.z));
    if (vert) {
      if (under === SLIME && my < 0 && !this.kShift && this.tvy < 0) this.tvy = -this.tvy;
      else this.tvy = 0;
    }
    if (this.onGround && under === SLIME && !this.kShift) {
      const d = Math.abs(this.tvy);
      if (d < 0.1) { const k = 0.4 + d * 0.2; this.tvx *= k; this.tvz *= k; }
    }
    this.walkDist += Math.sqrt(rx * rx + rz * rz) * 0.6;
    const feet = this.blockId(w, Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    let sf = feet === WATER ? 1 : SPEED_FACTOR[feet];
    if (sf === 1 && feet !== WATER) sf = SPEED_FACTOR[this.blockBelow(w, 0.5000001)];
    if (sf !== 1) { this.tvx *= sf; this.tvz *= sf; }
  }

  /** The reference game keeps sprinting when a wall only deflects the move by under 8 degrees. */
  private isMinorCollision(rx: number, rz: number): boolean {
    let fwd = (this.kF ? 1 : 0) - (this.kB ? 1 : 0), str = (this.kL ? 1 : 0) - (this.kR ? 1 : 0);
    if (this.crouched) { fwd *= SNEAK_MUL; str *= SNEAK_MUL; }
    const s = Math.sin(this.yaw), c = Math.cos(this.yaw);
    const ix = -fwd * s - str * c, iz = -fwd * c + str * s;
    const d4 = ix * ix + iz * iz, d5 = rx * rx + rz * rz;
    if (d4 < 1e-5 || d5 < 1e-5) return false;
    const cos = (ix * rx + iz * rz) / Math.sqrt(d4 * d5);
    return Math.acos(Math.max(-1, Math.min(1, cos))) < 0.13962634;
  }

  /** Resolve a move against the gathered boxes: y, x, z sweeps plus the 0.6 auto step-up. */
  private collide(mx: number, my: number, mz: number) {
    const bb = this.bb;
    this.sweep(bb, mx, my, mz);
    let rx = this.res[0], ry = this.res[1], rz = this.res[2];
    const collX = Math.abs(rx - mx) > EPS, collY = Math.abs(ry - my) > EPS, collZ = Math.abs(rz - mz) > EPS;
    if ((this.onGround || (collY && my < 0)) && (collX || collZ)) {
      this.sweep(bb, mx, STEP, mz);
      let ax = this.res[0], ay = this.res[1], az = this.res[2];
      const e = this.eb;
      e.set(bb);
      if (mx < 0) e[0] += mx; else e[3] += mx;
      if (mz < 0) e[2] += mz; else e[5] += mz;
      const up = this.clip(e, 1, STEP);
      if (up < STEP) {
        const m = this.mb;
        m.set(bb); m[1] += up; m[4] += up;
        this.sweep(m, mx, 0, mz);
        const bx = this.res[0], bz = this.res[2];
        if (bx * bx + bz * bz > ax * ax + az * az) { ax = bx; ay = up; az = bz; }
      }
      if (ax * ax + az * az > rx * rx + rz * rz) {
        const m = this.mb;
        m.set(bb);
        m[0] += ax; m[3] += ax; m[1] += ay; m[4] += ay; m[2] += az; m[5] += az;
        const down = this.clip(m, 1, -ay + my);
        rx = ax; ry = ay + down; rz = az;
      }
    }
    this.res[0] = rx; this.res[1] = ry; this.res[2] = rz;
  }

  private sweep(src: Float64Array, mx: number, my: number, mz: number) {
    const t = this.tb;
    t.set(src);
    const dy = this.clip(t, 1, my); t[1] += dy; t[4] += dy;
    const dx = this.clip(t, 0, mx); t[0] += dx; t[3] += dx;
    const dz = this.clip(t, 2, mz); t[2] += dz; t[5] += dz;
    this.res[0] = dx; this.res[1] = dy; this.res[2] = dz;
  }

  /** How far `bb` can move by d along `axis` before touching a gathered box. */
  private clip(bb: Float64Array, axis: number, d: number): number {
    if (Math.abs(d) < EPS) return 0;
    const B = this.boxes, n = this.nBoxes;
    const a1 = axis === 0 ? 1 : 0, a2 = axis === 2 ? 1 : 2;
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      if (B[o + a1 + 3] <= bb[a1] + EPS || B[o + a1] >= bb[a1 + 3] - EPS) continue;
      if (B[o + a2 + 3] <= bb[a2] + EPS || B[o + a2] >= bb[a2 + 3] - EPS) continue;
      if (d > 0) {
        const gap = B[o + axis] - bb[axis + 3];
        if (gap >= -EPS && gap < d) d = gap;
      } else {
        const gap = B[o + axis + 3] - bb[axis];
        if (gap <= EPS && gap > d) d = gap;
      }
    }
    return Math.abs(d) < EPS ? 0 : d;
  }

  /** No gathered box overlaps bb moved by (dx, dy, dz). */
  private free(dx: number, dy: number, dz: number): boolean {
    const B = this.boxes, n = this.nBoxes, bb = this.bb;
    const x0 = bb[0] + dx, y0 = bb[1] + dy, z0 = bb[2] + dz, x1 = bb[3] + dx, y1 = bb[4] + dy, z1 = bb[5] + dz;
    for (let i = 0; i < n; i++) {
      const o = i * 6;
      if (B[o] < x1 - EPS && B[o + 3] > x0 + EPS && B[o + 1] < y1 - EPS && B[o + 4] > y0 + EPS && B[o + 2] < z1 - EPS && B[o + 5] > z0 + EPS) return false;
    }
    return true;
  }

  /** Room for the player's box (with height h) at the current position. */
  private fits(h: number): boolean {
    const w = this.w!;
    const bb = this.setBB(h);
    this.gather(w, bb[0], bb[1], bb[2], bb[3], bb[4], bb[5]);
    const ok = this.free(0, 0, 0);
    this.setBB();
    return ok;
  }

  /** Free of blocks and liquids when the box is moved by the offset (water ledge climbing). */
  private freeAt(w: World, dx: number, dy: number, dz: number): boolean {
    const bb = this.setBB();
    const x0 = bb[0] + dx, y0 = bb[1] + dy, z0 = bb[2] + dz, x1 = bb[3] + dx, y1 = bb[4] + dy, z1 = bb[5] + dz;
    this.gather(w, x0, y0, z0, x1, y1, z1);
    if (!this.free(dx, dy, dz)) return false;
    for (let by = Math.floor(y0); by <= Math.floor(y1 - EPS); by++) {
      for (let bz = Math.floor(z0); bz <= Math.floor(z1 - EPS); bz++) {
        for (let bx = Math.floor(x0); bx <= Math.floor(x1 - EPS); bx++) {
          if (FLUID[w.get(bx, by, bz) & ID_MASK]) return false;
        }
      }
    }
    return true;
  }

  private pushBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    let o = this.nBoxes * 6;
    if (o + 6 > this.boxes.length) {
      const nb = new Float64Array(this.boxes.length * 2);
      nb.set(this.boxes);
      this.boxes = nb;
    }
    const B = this.boxes;
    B[o++] = x0; B[o++] = y0; B[o++] = z0; B[o++] = x1; B[o++] = y1; B[o] = z1;
    this.nBoxes++;
  }

  /** Collect world-space collision boxes of every block touching the region. */
  private gather(w: World, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
    this.nBoxes = 0;
    const bx0 = Math.floor(x0), bx1 = Math.floor(x1);
    const bz0 = Math.floor(z0), bz1 = Math.floor(z1);
    // One block lower: fences and walls below reach 0.5 into the block above.
    const by0 = Math.max(-2, Math.floor(y0) - 1), by1 = Math.min(256, Math.floor(y1));
    for (let bz = bz0; bz <= bz1; bz++) {
      for (let bx = bx0; bx <= bx1; bx++) {
        if (!this.loadedAt(bx, bz)) {
          // Unloaded terrain acts as a wall so nobody walks or falls into the void.
          this.pushBox(bx, by0, bz, bx + 1, by1 + 1, bz + 1);
          continue;
        }
        for (let by = by0; by <= by1; by++) {
          const v = w.get(bx, by, bz);
          const id = v & ID_MASK;
          if (!SOLID[id]) continue;
          if (SHAPE[id] === S.cube) { this.pushBox(bx, by, bz, bx + 1, by + 1, bz + 1); continue; }
          this.qx = bx; this.qy = by; this.qz = bz;
          const list = collisionBoxes(v, this.nb);
          for (let i = 0; i < list.length; i++) {
            const b = list[i];
            this.pushBox(bx + b[0], by + b[1], bz + b[2], bx + b[3], by + b[4], bz + b[5]);
          }
        }
      }
    }
  }

  private loadedAt(bx: number, bz: number): boolean {
    const cx = bx >> 4, cz = bz >> 4;
    if (cx === this.lcx && cz === this.lcz) return this.lres;
    this.lcx = cx; this.lcz = cz;
    this.lres = this.w!.getChunk(cx, cz) !== undefined;
    return this.lres;
  }

  private blockId(w: World, x: number, y: number, z: number): number {
    return w.get(x, y, z) & ID_MASK;
  }

  private blockBelow(w: World, d: number): number {
    return this.blockId(w, Math.floor(this.x), Math.floor(this.y - d), Math.floor(this.z));
  }

  /** inWater / inLava, fluid depth over the feet, eyes under water, cobweb contact. */
  private updateFluids(w: World) {
    const h = this.boxHeight();
    const x0 = this.x - HALF_W + 0.001, x1 = this.x + HALF_W - 0.001;
    const y0 = this.y + 0.001, y1 = this.y + h - 0.001;
    const z0 = this.z - HALF_W + 0.001, z1 = this.z + HALF_W - 0.001;
    let inW = false, inL = false, wh = 0, lh = 0, web = false;
    const byA = Math.max(0, Math.floor(y0)), byB = Math.min(255, Math.floor(y1));
    for (let by = byA; by <= byB; by++) {
      for (let bz = Math.floor(z0); bz <= Math.floor(z1); bz++) {
        for (let bx = Math.floor(x0); bx <= Math.floor(x1); bx++) {
          const v = w.get(bx, by, bz);
          const id = v & ID_MASK;
          if (id === COBWEB) { web = true; continue; }
          if (!FLUID[id]) continue;
          const top = by + fluidHeight(v, w.get(bx, by + 1, bz));
          if (top < y0) continue;
          if (id === LAVA) { inL = true; if (top - y0 > lh) lh = top - y0; }
          else { inW = true; if (top - y0 > wh) wh = top - y0; }
        }
      }
    }
    this.inWater = inW; this.inLava = inL; this.waterHeight = wh; this.lavaHeight = lh; this.stuck = web;
    const ey = this.y + this.eyeH - 0.11111111;
    const ex = Math.floor(this.x), ez = Math.floor(this.z), eby = Math.floor(ey);
    const ev = w.get(ex, eby, ez);
    this.eyeUnder = (ev & ID_MASK) === WATER && ey < eby + fluidHeight(ev, w.get(ex, eby + 1, ez));
  }

  /** Camera-in-water test on the interpolated eye (matches the rendered water surface). */
  private updateHead() {
    const w = this.w;
    if (!w) return;
    const e = this.eye();
    const bx = Math.floor(e.x), by = Math.floor(e.y), bz = Math.floor(e.z);
    const v = w.get(bx, by, bz);
    this.headInWater = (v & ID_MASK) === WATER && e.y < by + fluidSurface(v, w.get(bx, by + 1, bz));
  }
}
