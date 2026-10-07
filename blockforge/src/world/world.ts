// The loaded world: chunk map, block access, edits with full light/remesh/fluid updates.
import { Chunk } from './chunk';
import { Lighting } from './light';
import { FluidSim } from './fluids';
import { ID, pack } from '../blocks/registry';
import { chunkKey, sectionKey, SECTIONS } from './constants';

const BEDROCK = pack(ID.bedrock);

export class World {
  readonly seed: number;
  /** key chunkKey(cx,cz) */
  chunks = new Map<number, Chunk>();
  /** sectionKey(cx,sy,cz) of sections needing a remesh; the consumer deletes keys */
  dirtySections = new Set<number>();
  /** Called after every block change (edits and fluid flow), once dirty sections are marked. */
  onBlockChange: ((x: number, y: number, z: number, oldV: number, newV: number) => void) | null = null;
  readonly lighting: Lighting;
  readonly fluids: FluidSim;

  // One-entry chunk cache: physics, raycasts and fluids hit the same column repeatedly.
  private lastKey = NaN;
  private lastChunk: Chunk | undefined = undefined;

  constructor(seed: number) {
    this.seed = seed;
    this.lighting = new Lighting(this);
    this.fluids = new FluidSim(this);
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    const k = chunkKey(cx, cz);
    if (k === this.lastKey) return this.lastChunk;
    const c = this.chunks.get(k);
    this.lastKey = k;
    this.lastChunk = c;
    return c;
  }

  /** Packed block at integer world coords; y < 0 is bedrock, above the world or unloaded is air. */
  get(x: number, y: number, z: number): number {
    if (y < 0) return BEDROCK;
    if (y > 255) return 0;
    const c = this.getChunk(x >> 4, z >> 4);
    return c ? c.blocks[(y << 8) | ((z & 15) << 4) | (x & 15)] : 0;
  }

  /** Packed light (sky << 4 | block); above the world or unloaded is full sky. */
  getLight(x: number, y: number, z: number): number {
    if (y > 255) return 0xf0;
    if (y < 0) return 0;
    const c = this.getChunk(x >> 4, z >> 4);
    return c ? c.light[(y << 8) | ((z & 15) << 4) | (x & 15)] : 0xf0;
  }

  getSky(x: number, y: number, z: number): number { return this.getLight(x, y, z) >> 4; }
  getBlockLight(x: number, y: number, z: number): number { return this.getLight(x, y, z) & 15; }

  /**
   * Edit a block: updates light incrementally, marks the sections that must be remeshed
   * (the block's own section plus every non-empty section within one block of it, diagonals
   * included), flags the chunk as modified, wakes nearby fluids and calls onBlockChange.
   */
  set(x: number, y: number, z: number, v: number): void {
    this.apply(x, y, z, v, true);
  }

  /**
   * Same as set() but without onBlockChange: used by the fluid simulation, whose changes are
   * remeshed through the normal (budgeted, worker) path instead of synchronously, so a flood
   * cannot stall a frame. Direct edits, including placing water, go through set().
   */
  setQuiet(x: number, y: number, z: number, v: number): void {
    this.apply(x, y, z, v, false);
  }

  private apply(x: number, y: number, z: number, v: number, notify: boolean): void {
    if (y < 0 || y > 255) return;
    const c = this.getChunk(x >> 4, z >> 4);
    if (!c) return;
    if ((v & 0x3ff) === 0) v = 0;
    const lx = x & 15, lz = z & 15;
    const old = c.blocks[(y << 8) | (lz << 4) | lx];
    if (old === v) return;
    c.set(lx, y, lz, v);
    c.modified = true;
    if (c.lit) this.lighting.update(c, lx, y, lz, old, v);
    this.markAround(c, lx, y, lz);
    this.fluids.scheduleAround(x, y, z);
    if (notify && this.onBlockChange) this.onBlockChange(x, y, z, old, v);
  }

  /** Dirty the block's own section and the non-empty sections within one block of it. */
  private markAround(c: Chunk, lx: number, y: number, lz: number): void {
    const sy = y >> 4, ly = y & 15;
    this.dirtySections.add(sectionKey(c.cx, sy, c.cz));
    const x0 = lx === 0 ? -1 : 0, x1 = lx === 15 ? 1 : 0;
    const z0 = lz === 0 ? -1 : 0, z1 = lz === 15 ? 1 : 0;
    const y0 = ly === 0 && sy > 0 ? -1 : 0, y1 = ly === 15 && sy < SECTIONS - 1 ? 1 : 0;
    for (let dz = z0; dz <= z1; dz++) {
      for (let dx = x0; dx <= x1; dx++) {
        const n = dx === 0 && dz === 0 ? c : this.chunks.get(chunkKey(c.cx + dx, c.cz + dz));
        if (!n) continue;
        for (let dy = y0; dy <= y1; dy++) {
          if (n.counts[sy + dy] > 0) this.dirtySections.add(sectionKey(n.cx, sy + dy, n.cz));
        }
      }
    }
  }

  /**
   * Insert a column and compute its initial light, including light flowing in from and out to
   * already loaded neighbours. Marks its non-empty sections dirty, plus the non-empty sections
   * of the 8 neighbours (their border faces, AO and smooth light depend on this column).
   */
  addChunk(c: Chunk): void {
    const k = chunkKey(c.cx, c.cz);
    this.chunks.set(k, c);
    this.lastKey = NaN;
    this.lastChunk = undefined;
    this.lighting.initChunk(c);
    for (let sy = 0; sy < SECTIONS; sy++) if (c.counts[sy] > 0) this.dirtySections.add(sectionKey(c.cx, sy, c.cz));
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dz) continue;
        const n = this.chunks.get(chunkKey(c.cx + dx, c.cz + dz));
        if (!n || !n.lit) continue;
        for (let sy = 0; sy < SECTIONS; sy++) if (n.counts[sy] > 0) this.dirtySections.add(sectionKey(n.cx, sy, n.cz));
      }
    }
  }

  removeChunk(cx: number, cz: number): Chunk | undefined {
    const k = chunkKey(cx, cz);
    const c = this.chunks.get(k);
    if (!c) return undefined;
    this.chunks.delete(k);
    this.lastKey = NaN;
    this.lastChunk = undefined;
    for (let sy = 0; sy < SECTIONS; sy++) this.dirtySections.delete(sectionKey(cx, sy, cz));
    return c;
  }

  /** Highest non-air y in the column, -1 if empty or unloaded. */
  topY(x: number, z: number): number {
    const c = this.getChunk(x >> 4, z >> 4);
    if (!c) return -1;
    const b = c.blocks, col = ((z & 15) << 4) | (x & 15);
    for (let sy = SECTIONS - 1; sy >= 0; sy--) {
      if (!c.counts[sy]) continue;
      for (let y = sy * 16 + 15; y >= sy * 16; y--) if (b[(y << 8) | col] !== 0) return y;
    }
    return -1;
  }

  /** Advance the fluid simulation (bounded work per call). */
  tick(dt: number): void {
    this.fluids.tick(dt);
  }
}
