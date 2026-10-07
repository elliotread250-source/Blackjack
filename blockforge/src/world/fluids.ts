// Water and lava flow, modelled on the original game's flowing-fluid rules.
//
// Stored state (meta): bits 0-2 level (0 source, 1..7 flowing), bit 3 falling. A falling cell
// counts as a full column (amount 8) for its neighbours, like the original.
// * Each scheduled cell recomputes its state from its neighbours (non-sources only): the
//   strongest horizontal neighbour minus the drop-off (water 1, lava 2), full falling fluid if
//   the same fluid is above, a new water source when two sources touch it over a solid block
//   or a source. Removing a source therefore drains the flow, wave by wave.
// * Then it spreads: down into air (as falling fluid) when possible, otherwise sideways in
//   the directions with the shortest path to a drop (searched 4 blocks out for water, 2 for
//   lava), replacing plants, snow layers and torches.
// * Water ticks every 0.25 s, lava every 1.5 s. Lava touching water (above or beside) turns
//   into obsidian (source) or cobblestone (flowing) right away; lava flowing down into water
//   turns that water into stone.
// * Work per tick() is bounded (updates and milliseconds) so floods never stall a frame.
import type { World } from './world';
import { ID, COUNT, pack, FLUID, SOLID, REPLACEABLE, SHAPE, S } from '../blocks/registry';

const WATER = ID.water;
const LAVA = ID.lava;
const FALLING = 8;
const OBSIDIAN = pack(ID.obsidian);
const BARRIER = pack(ID.bedrock);   // what unloaded columns look like to fluids: solid, never washed
const COBBLE = pack(ID.cobblestone);
const STONE = pack(ID.stone);

export const WATER_DELAY = 0.25;
export const LAVA_DELAY = 1.5;

/** Non-fluid blocks a fluid washes away when it flows into them. */
const WASH = new Uint8Array(1024);
WASH[0] = 1;
for (let id = 1; id < COUNT; id++) {
  if (FLUID[id]) continue;
  const smallPlant = (SHAPE[id] === S.cross || SHAPE[id] === S.torch) && !SOLID[id];
  if (REPLACEABLE[id] || smallPlant) WASH[id] = 1;
}
if (ID.seagrass !== undefined) WASH[ID.seagrass] = 0;  // grows under water
if (ID.cobweb !== undefined) WASH[ID.cobweb] = 0;      // holds water back, as in the original

const HDX = [0, 1, 0, -1];
const HDZ = [-1, 0, 1, 0];
const OPP = [2, 3, 0, 1];

// Position keys: x, z in +-1M blocks, y 0..255, exact in a double.
const OFF = 1048576;
const ZSPAN = 2097152;
const posKey = (x: number, y: number, z: number) => ((x + OFF) * ZSPAN + (z + OFF)) * 256 + y;

/** Growable ring of (key, due time) pairs. Delays are constant per fluid, so it stays sorted. */
class TimedRing {
  keys = new Float64Array(1024);
  due = new Float64Array(1024);
  head = 0;
  size = 0;
  push(k: number, t: number): void {
    if (this.size === this.keys.length) this.grow();
    const i = (this.head + this.size) % this.keys.length;
    this.keys[i] = k;
    this.due[i] = t;
    this.size++;
  }
  frontDue(): number { return this.size ? this.due[this.head] : Infinity; }
  shift(): number {
    const k = this.keys[this.head];
    this.head = (this.head + 1) % this.keys.length;
    this.size--;
    return k;
  }
  private grow(): void {
    const n = this.keys.length, nk = new Float64Array(n * 2), nd = new Float64Array(n * 2);
    for (let j = 0; j < this.size; j++) {
      const i = (this.head + j) % n;
      nk[j] = this.keys[i];
      nd[j] = this.due[i];
    }
    this.keys = nk; this.due = nd; this.head = 0;
  }
  clear(): void { this.head = 0; this.size = 0; }
}

const amountOf = (meta: number) => (meta === 0 || (meta & FALLING) ? 8 : 8 - (meta & 7));

export class FluidSim {
  private world: World;
  /** Simulation clock in seconds. */
  time = 0;
  /** Max fluid updates per tick() call. */
  maxUpdates = 512;
  /** Max milliseconds per tick() call. */
  budgetMs = 4;
  /** Updates processed by the last tick() (stats). */
  lastUpdates = 0;

  private wq = new TimedRing();
  private lq = new TimedRing();
  private wPending = new Set<number>();
  private lPending = new Set<number>();
  private contact = new Set<number>();   // lava cells to check for water right away

  // Memo for the drop search (11x11 around the spreading cell).
  private stamp = 1;
  private passStamp = new Uint32Array(121);
  private passVal = new Uint8Array(121);
  private holeStamp = new Uint32Array(121);
  private holeVal = new Uint8Array(121);
  private sx = 0;
  private sy = 0;
  private sz = 0;
  private skind = 0;

  constructor(world: World) { this.world = world; }

  /** Block at a position as fluids see it: unloaded columns are solid so nothing pours into them. */
  private get(x: number, y: number, z: number): number {
    if (y < 0) return BARRIER;
    if (y > 255) return 0;
    const c = this.world.getChunk(x >> 4, z >> 4);
    return c ? c.blocks[(y << 8) | ((z & 15) << 4) | (x & 15)] : BARRIER;
  }

  /** Number of fluid cells waiting for an update. */
  get pending(): number { return this.wq.size + this.lq.size + this.contact.size; }

  /** Wake the fluid at (x,y,z) if there is one (no-op for other blocks). */
  schedule(x: number, y: number, z: number): void {
    if (y < 0 || y > 255) return;
    const id = this.get(x, y, z) & 0x3ff;
    if (id === WATER) {
      const k = posKey(x, y, z);
      if (!this.wPending.has(k)) { this.wPending.add(k); this.wq.push(k, this.time + WATER_DELAY); }
    } else if (id === LAVA) {
      const k = posKey(x, y, z);
      this.contact.add(k);
      if (!this.lPending.has(k)) { this.lPending.add(k); this.lq.push(k, this.time + LAVA_DELAY); }
    }
  }

  /** Wake the fluid at a changed block and its 6 neighbours. */
  scheduleAround(x: number, y: number, z: number): void {
    this.schedule(x, y, z);
    this.schedule(x + 1, y, z);
    this.schedule(x - 1, y, z);
    this.schedule(x, y + 1, z);
    this.schedule(x, y - 1, z);
    this.schedule(x, y, z + 1);
    this.schedule(x, y, z - 1);
  }

  /** Forget every pending update (used when a world is unloaded). */
  clear(): void {
    this.wq.clear(); this.lq.clear();
    this.wPending.clear(); this.lPending.clear(); this.contact.clear();
  }

  tick(dt: number): void {
    if (dt > 0) this.time += dt;
    let budget = this.maxUpdates;
    const t0 = now();
    let n = 0;

    if (this.contact.size) {
      const list = Array.from(this.contact);
      this.contact.clear();
      for (const k of list) {
        if (budget <= 0) { this.contact.add(k); continue; }
        budget--; n++;
        this.lavaContact(k);
      }
    }

    const wq = this.wq, lq = this.lq;
    while (budget > 0) {
      const wd = wq.frontDue(), ld = lq.frontDue();
      const useWater = wd <= ld;
      const d = useWater ? wd : ld;
      if (d > this.time + 1e-6) break;
      const k = useWater ? wq.shift() : lq.shift();
      (useWater ? this.wPending : this.lPending).delete(k);
      this.update(k);
      budget--; n++;
      if ((n & 15) === 0 && now() - t0 > this.budgetMs) break;
    }
    this.lastUpdates = n;
  }

  // ------------------------------------------------------------------ rules

  private update(k: number): void {
    const y = k % 256;
    const t = (k - y) / 256;
    const zz = t % ZSPAN;
    const z = zz - OFF;
    const x = (t - zz) / ZSPAN - OFF;
    const w = this.world;
    let v = this.get(x, y, z);
    const id = v & 0x3ff;
    if (id !== WATER && id !== LAVA) return;
    if (id === LAVA && this.touchesWater(x, y, z)) { this.solidify(x, y, z, v); return; }
    if ((v >> 10) !== 0) {
      const nv = this.newLiquid(x, y, z, id);
      if (nv === 0) { w.setQuiet(x, y, z, 0); return; }
      if (nv !== v) { w.setQuiet(x, y, z, nv); v = nv; }
    }
    this.spread(x, y, z, v);
  }

  private lavaContact(k: number): void {
    const y = k % 256;
    const t = (k - y) / 256;
    const zz = t % ZSPAN;
    const z = zz - OFF;
    const x = (t - zz) / ZSPAN - OFF;
    const v = this.get(x, y, z);
    if ((v & 0x3ff) !== LAVA) return;
    if (this.touchesWater(x, y, z)) this.solidify(x, y, z, v);
  }

  private touchesWater(x: number, y: number, z: number): boolean {
    if ((this.get(x, y + 1, z) & 0x3ff) === WATER) return true;
    for (let d = 0; d < 4; d++) if ((this.get(x + HDX[d], y, z + HDZ[d]) & 0x3ff) === WATER) return true;
    return false;
  }

  private solidify(x: number, y: number, z: number, v: number): void {
    this.world.setQuiet(x, y, z, (v >> 10) === 0 ? OBSIDIAN : COBBLE);
  }

  /** The state a cell should have given its neighbours (0 = no fluid). */
  newLiquid(x: number, y: number, z: number, kind: number): number {
    let maxAmt = 0, sources = 0;
    for (let d = 0; d < 4; d++) {
      const n = this.get(x + HDX[d], y, z + HDZ[d]);
      if ((n & 0x3ff) !== kind) continue;
      const m = n >> 10;
      if (m === 0) sources++;
      const a = amountOf(m);
      if (a > maxAmt) maxAmt = a;
    }
    if (kind === WATER && sources >= 2) {
      const b = this.get(x, y - 1, z), bid = b & 0x3ff;
      if ((SOLID[bid] && !FLUID[bid]) || (bid === kind && (b >> 10) === 0)) return pack(kind, 0);
    }
    if ((this.get(x, y + 1, z) & 0x3ff) === kind) return pack(kind, FALLING);
    const amt = maxAmt - (kind === LAVA ? 2 : 1);
    return amt <= 0 ? 0 : pack(kind, 8 - amt);
  }

  /** Can fluid `kind` move into a cell holding `t`? Same-fluid cells update themselves instead. */
  private canFlowInto(t: number, kind: number, down: boolean): boolean {
    const tid = t & 0x3ff;
    if (tid === 0) return true;
    if (tid === kind) return false;
    if (FLUID[tid]) return down && kind === LAVA && tid === WATER;
    return WASH[tid] === 1;
  }

  private spread(x: number, y: number, z: number, v: number): void {
    const w = this.world;
    const kind = v & 0x3ff, meta = v >> 10;
    if (y > 0) {
      const b = this.get(x, y - 1, z);
      if (this.canFlowInto(b, kind, true)) {
        if (kind === LAVA && (b & 0x3ff) === WATER) w.setQuiet(x, y - 1, z, STONE);
        else {
          const nb = this.newLiquid(x, y - 1, z, kind);
          if (nb !== 0 && nb !== b) w.setQuiet(x, y - 1, z, nb);
        }
        if (this.sourceNeighbors(x, y, z, kind) >= 3) this.spreadToSides(x, y, z, v);
        return;
      }
    }
    if (meta === 0 || !this.isHole(this.get(x, y - 1, z), kind)) this.spreadToSides(x, y, z, v);
  }

  private sourceNeighbors(x: number, y: number, z: number, kind: number): number {
    const src = pack(kind, 0);
    let n = 0;
    for (let d = 0; d < 4; d++) if (this.get(x + HDX[d], y, z + HDZ[d]) === src) n++;
    return n;
  }

  private spreadToSides(x: number, y: number, z: number, v: number): void {
    const kind = v & 0x3ff, meta = v >> 10;
    const i = (meta & FALLING) ? 7 : amountOf(meta) - (kind === LAVA ? 2 : 1);
    if (i <= 0) return;
    const dirs = this.spreadDirs(x, y, z, kind);
    const w = this.world;
    for (let d = 0; d < 4; d++) {
      if (!(dirs & (1 << d))) continue;
      const nx = x + HDX[d], nz = z + HDZ[d];
      const t = this.get(nx, y, nz);
      if (!this.canFlowInto(t, kind, false)) continue;
      const ns = this.newLiquid(nx, y, nz, kind);
      if (ns !== 0 && ns !== t) w.setQuiet(nx, y, nz, ns);
    }
  }

  // ---- drop search ("slope distance"), memoised on an 11x11 grid around the source cell

  private isHole(b: number, kind: number): boolean {
    const tid = b & 0x3ff;
    return tid === 0 || tid === kind || FLUID[tid] === 1 || WASH[tid] === 1;
  }

  private canPass(t: number, kind: number): boolean {
    const tid = t & 0x3ff;
    if (tid === kind) return (t >> 10) !== 0;
    return tid === 0 || (!FLUID[tid] && WASH[tid] === 1);
  }

  private passAt(dx: number, dz: number): boolean {
    const i = (dz + 5) * 11 + dx + 5;
    if (this.passStamp[i] !== this.stamp) {
      this.passStamp[i] = this.stamp;
      this.passVal[i] = this.canPass(this.get(this.sx + dx, this.sy, this.sz + dz), this.skind) ? 1 : 0;
    }
    return this.passVal[i] === 1;
  }

  private holeAt(dx: number, dz: number): boolean {
    const i = (dz + 5) * 11 + dx + 5;
    if (this.holeStamp[i] !== this.stamp) {
      this.holeStamp[i] = this.stamp;
      this.holeVal[i] = this.sy > 0 && this.isHole(this.get(this.sx + dx, this.sy - 1, this.sz + dz), this.skind) ? 1 : 0;
    }
    return this.holeVal[i] === 1;
  }

  private slopeDistance(dx: number, dz: number, depth: number, from: number, maxDepth: number): number {
    let best = 1000;
    for (let d = 0; d < 4; d++) {
      if (d === from) continue;
      const nx = dx + HDX[d], nz = dz + HDZ[d];
      if (!this.passAt(nx, nz)) continue;
      if (this.holeAt(nx, nz)) return depth;
      if (depth < maxDepth) {
        const j = this.slopeDistance(nx, nz, depth + 1, OPP[d], maxDepth);
        if (j < best) best = j;
      }
    }
    return best;
  }

  /** Bitmask of horizontal directions (0 N, 1 E, 2 S, 3 W) the fluid should flow towards. */
  private spreadDirs(x: number, y: number, z: number, kind: number): number {
    this.stamp++;
    this.sx = x; this.sy = y; this.sz = z; this.skind = kind;
    const maxDepth = kind === LAVA ? 2 : 4;
    let best = 1000, dirs = 0;
    for (let d = 0; d < 4; d++) {
      const dx = HDX[d], dz = HDZ[d];
      if (!this.passAt(dx, dz)) continue;
      const dist = this.holeAt(dx, dz) ? 0 : this.slopeDistance(dx, dz, 1, OPP[d], maxDepth);
      if (dist < best) { best = dist; dirs = 0; }
      if (dist <= best) dirs |= 1 << d;
    }
    return dirs;
  }
}

const now: () => number = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
