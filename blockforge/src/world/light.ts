// Sky light and block light: initial column lighting plus incremental add/remove BFS
// (Seed of Andromeda style) with typed-array ring queues, across loaded chunk borders.
//
// Rules (MC-like):
// * A cell's light is the max over neighbours of (neighbour light - max(1, opacity of the cell)),
//   where opacity is per packed value (LOPAC). Opaque cells (15) hold no light of their own
//   except their emission (glowstone holds 15 and lights neighbours with 14).
// * Sky light 15 travels straight down without loss into opacity-0 cells; leaves and water
//   (opacity 1) take 1 per step, also vertically, so a canopy or a sea darkens what is below.
// * Light cannot cross a face that is fully covered by a non-cube shape (LMASK): bottom slabs
//   and upright stairs cover their bottom face, top slabs and upside-down stairs their top face,
//   stairs their tall back face. Double slabs are opaque. This mirrors the "use shape for light
//   occlusion" behaviour, so a slab or stair roof casts shade like in the original game.
//
// BFS state lives in a 5x5 window of chunks centred on the chunk being edited or added.
// Queue entries address a cell as (window slot, column index); light changes outside the
// window are impossible (they never travel more than ~17 blocks from the edit).
import { OPACITY, EMIT, SHAPE, S, LAYER, L as LAYERS, COUNT } from '../blocks/registry';
import { chunkKey, sectionKey, H_TO_FACE, SECTIONS } from './constants';
import type { Chunk } from './chunk';

// ---------------------------------------------------------------------------
// Per packed value (id | meta << 10) lookup tables, 64 KB each.

/** Light opacity of a packed block value (0..15). */
export const LOPAC = new Uint8Array(65536);
/** Faces (bit = face index, see constants.ts) fully covered for light by the block's shape. */
export const LMASK = new Uint8Array(65536);
/** Block light emitted by a packed block value. */
export const LEMIT = new Uint8Array(65536);

const F_UP = 1 << 2, F_DOWN = 1 << 3;

(function buildTables() {
  for (let v = 0; v < 65536; v++) {
    const id = v & 0x3ff, meta = v >> 10;
    if (id >= COUNT || id === 0) continue; // unknown ids behave like air
    let op = OPACITY[id];
    let mask = 0;
    const shape = SHAPE[id];
    if (shape === S.slab) {
      if (meta === 2) op = LAYER[id] === LAYERS.opaque ? 15 : op;
      else mask = meta === 1 ? F_UP : F_DOWN;
    } else if (shape === S.stairs) {
      mask = ((meta & 4) ? F_UP : F_DOWN) | (1 << H_TO_FACE[meta & 3]);
    }
    LOPAC[v] = op;
    LMASK[v] = op >= 15 ? 0 : mask;
    LEMIT[v] = EMIT[id];
  }
})();

/** Sky light a cell at y = 255 receives straight from the sky above the world. */
function skyFromAbove(v: number): number {
  if (LMASK[v] & F_UP) return 0;
  const op = LOPAC[v];
  return op === 0 ? 15 : op >= 15 ? 0 : 15 - op;
}

// ---------------------------------------------------------------------------

/** Growable power-of-two ring buffer of int32 entries. */
class Ring {
  buf: Int32Array;
  mask: number;
  head = 0;
  tail = 0;
  constructor(bits: number) {
    this.buf = new Int32Array(1 << bits);
    this.mask = (1 << bits) - 1;
  }
  push(v: number): void {
    this.buf[this.tail] = v;
    this.tail = (this.tail + 1) & this.mask;
    if (this.tail === this.head) this.grow();
  }
  private grow(): void {
    const old = this.buf, n = old.length, nb = new Int32Array(n * 2);
    nb.set(old.subarray(this.head), 0);
    nb.set(old.subarray(0, this.head), n - this.head);
    this.buf = nb;
    this.mask = n * 2 - 1;
    this.head = 0;
    this.tail = n;
  }
  clear(): void { this.head = this.tail = 0; }
}

/** What the lighting engine needs from the world. */
export interface LightHost {
  chunks: Map<number, Chunk>;
  dirtySections: Set<number>;
}

const W = 5, WN = 25, CENTER = 12;
// Window slot neighbours (-1 = outside the window).
const SL_E = new Int8Array(WN), SL_W = new Int8Array(WN), SL_S = new Int8Array(WN), SL_N = new Int8Array(WN);
// Slot -> index in the 7x7 dirty mask grid (one ring larger than the window).
const MI = new Uint8Array(WN);
for (let s = 0; s < WN; s++) {
  const col = s % W, row = (s / W) | 0;
  SL_E[s] = col < W - 1 ? s + 1 : -1;
  SL_W[s] = col > 0 ? s - 1 : -1;
  SL_S[s] = row < W - 1 ? s + W : -1;
  SL_N[s] = row > 0 ? s - W : -1;
  MI[s] = (row + 1) * 7 + col + 1;
}

// Face bits entered when moving in a direction: moving +X enters the neighbour's -X face.
const IN_FROM_W = 1 << 1;  // moving +X (east)
const IN_FROM_E = 1 << 0;  // moving -X
const IN_FROM_DOWN = F_DOWN; // moving +Y enters through the neighbour's bottom face
const IN_FROM_UP = F_UP;   // moving -Y
const IN_FROM_N = 1 << 5;  // moving +Z enters the -Z face
const IN_FROM_S = 1 << 4;  // moving -Z

export class Lighting {
  private host: LightHost;
  private ocx = 0;
  private ocz = 0;
  private wc: (Chunk | null)[] = new Array(WN).fill(null);
  private wb: (Uint16Array | null)[] = new Array(WN).fill(null);
  private wl: (Uint8Array | null)[] = new Array(WN).fill(null);
  private aq = new Ring(15);   // sky add queue: slot << 16 | idx
  private bq = new Ring(15);   // block add queue
  private rq = new Ring(14);   // removal queue: slot << 20 | idx << 4 | level
  private dm = new Uint16Array(49); // dirty sections per chunk in the 7x7 grid around the window
  private noTouchSlot = -1;    // slot whose writes need no dirty marking (a chunk being added)
  private sunH = new Uint16Array(256);

  /** Cells visited by the last operation (for stats/benchmarks). */
  work = 0;

  constructor(host: LightHost) { this.host = host; }

  private setWindow(ocx: number, ocz: number, center: Chunk | null): void {
    this.ocx = ocx; this.ocz = ocz;
    const chunks = this.host.chunks;
    for (let s = 0; s < WN; s++) {
      const dx = (s % W) - 2, dz = ((s / W) | 0) - 2;
      const c = s === CENTER && center ? center : chunks.get(chunkKey(ocx + dx, ocz + dz)) ?? null;
      this.wc[s] = c;
      this.wb[s] = c ? c.blocks : null;
      this.wl[s] = c ? c.light : null;
    }
  }

  private releaseWindow(): void {
    for (let s = 0; s < WN; s++) { this.wc[s] = null; this.wb[s] = null; this.wl[s] = null; }
  }

  /** Remember that the cell's light changed: dirty its section and every section within 1 block. */
  private touch(slot: number, idx: number): void {
    if (slot === this.noTouchSlot) return;
    const y = idx >> 8, ly = y & 15, sy = y >> 4;
    let ym = 1 << sy;
    if (ly === 0) { if (sy > 0) ym |= 1 << (sy - 1); }
    else if (ly === 15) { if (sy < SECTIONS - 1) ym |= 1 << (sy + 1); }
    const m = this.dm, mi = MI[slot];
    const lx = idx & 15, lz = (idx >> 4) & 15;
    m[mi] |= ym;
    if (lx === 0) m[mi - 1] |= ym; else if (lx === 15) m[mi + 1] |= ym;
    if (lz === 0) {
      m[mi - 7] |= ym;
      if (lx === 0) m[mi - 8] |= ym; else if (lx === 15) m[mi - 6] |= ym;
    } else if (lz === 15) {
      m[mi + 7] |= ym;
      if (lx === 0) m[mi + 6] |= ym; else if (lx === 15) m[mi + 8] |= ym;
    }
  }

  /** Move accumulated dirty bits into world.dirtySections (non-empty sections of loaded chunks). */
  private flushDirty(): void {
    const m = this.dm, dirty = this.host.dirtySections;
    for (let i = 0; i < 49; i++) {
      const bits = m[i];
      if (!bits) continue;
      m[i] = 0;
      const dx = (i % 7) - 3, dz = ((i / 7) | 0) - 3;
      const c = (dx >= -2 && dx <= 2 && dz >= -2 && dz <= 2)
        ? this.wc[(dz + 2) * W + dx + 2]
        : this.host.chunks.get(chunkKey(this.ocx + dx, this.ocz + dz)) ?? null;
      if (!c) continue;
      for (let sy = 0; sy < SECTIONS; sy++) {
        if ((bits & (1 << sy)) && c.counts[sy] > 0) dirty.add(sectionKey(c.cx, sy, c.cz));
      }
    }
  }

  // ------------------------------------------------------------------ add BFS

  private relaxSky(slot: number, idx: number, lv: number, inBit: number, down: boolean): void {
    const L = this.wl[slot];
    if (!L) return;
    const v = this.wb[slot]![idx];
    if (LMASK[v] & inBit) return;
    const op = LOPAC[v];
    const nv = down && lv === 15 && op === 0 ? 15 : lv - (op > 1 ? op : 1);
    if (nv <= 0) return;
    const cur = L[idx];
    if ((cur >> 4) >= nv) return;
    L[idx] = (cur & 15) | (nv << 4);
    this.touch(slot, idx);
    this.aq.push((slot << 16) | idx);
  }

  private propagateSky(): void {
    const q = this.aq, wl = this.wl, wb = this.wb;
    let n = 0;
    while (q.head !== q.tail) {
      const e = q.buf[q.head];
      q.head = (q.head + 1) & q.mask;
      n++;
      const slot = e >>> 16, idx = e & 0xffff;
      const lv = wl[slot]![idx] >> 4;
      if (lv <= 1) continue;
      const mk = LMASK[wb[slot]![idx]];
      const x = idx & 15, z = (idx >> 4) & 15, y = idx >> 8;
      if (y > 0 && !(mk & F_DOWN)) this.relaxSky(slot, idx - 256, lv, IN_FROM_UP, true);
      if (y < 255 && !(mk & F_UP)) this.relaxSky(slot, idx + 256, lv, IN_FROM_DOWN, false);
      if (!(mk & 1)) {
        if (x < 15) this.relaxSky(slot, idx + 1, lv, IN_FROM_W, false);
        else { const s = SL_E[slot]; if (s >= 0) this.relaxSky(s, idx - 15, lv, IN_FROM_W, false); }
      }
      if (!(mk & 2)) {
        if (x > 0) this.relaxSky(slot, idx - 1, lv, IN_FROM_E, false);
        else { const s = SL_W[slot]; if (s >= 0) this.relaxSky(s, idx + 15, lv, IN_FROM_E, false); }
      }
      if (!(mk & 16)) {
        if (z < 15) this.relaxSky(slot, idx + 16, lv, IN_FROM_N, false);
        else { const s = SL_S[slot]; if (s >= 0) this.relaxSky(s, idx - 240, lv, IN_FROM_N, false); }
      }
      if (!(mk & 32)) {
        if (z > 0) this.relaxSky(slot, idx - 16, lv, IN_FROM_S, false);
        else { const s = SL_N[slot]; if (s >= 0) this.relaxSky(s, idx + 240, lv, IN_FROM_S, false); }
      }
    }
    q.clear();
    this.work += n;
  }

  private relaxBlock(slot: number, idx: number, lv: number, inBit: number): void {
    const L = this.wl[slot];
    if (!L) return;
    const v = this.wb[slot]![idx];
    if (LMASK[v] & inBit) return;
    const op = LOPAC[v];
    const nv = lv - (op > 1 ? op : 1);
    if (nv <= 0) return;
    const cur = L[idx];
    if ((cur & 15) >= nv) return;
    L[idx] = (cur & 0xf0) | nv;
    this.touch(slot, idx);
    this.bq.push((slot << 16) | idx);
  }

  private propagateBlock(): void {
    const q = this.bq, wl = this.wl, wb = this.wb;
    let n = 0;
    while (q.head !== q.tail) {
      const e = q.buf[q.head];
      q.head = (q.head + 1) & q.mask;
      n++;
      const slot = e >>> 16, idx = e & 0xffff;
      const lv = wl[slot]![idx] & 15;
      if (lv <= 1) continue;
      const mk = LMASK[wb[slot]![idx]];
      const x = idx & 15, z = (idx >> 4) & 15, y = idx >> 8;
      if (y > 0 && !(mk & F_DOWN)) this.relaxBlock(slot, idx - 256, lv, IN_FROM_UP);
      if (y < 255 && !(mk & F_UP)) this.relaxBlock(slot, idx + 256, lv, IN_FROM_DOWN);
      if (!(mk & 1)) {
        if (x < 15) this.relaxBlock(slot, idx + 1, lv, IN_FROM_W);
        else { const s = SL_E[slot]; if (s >= 0) this.relaxBlock(s, idx - 15, lv, IN_FROM_W); }
      }
      if (!(mk & 2)) {
        if (x > 0) this.relaxBlock(slot, idx - 1, lv, IN_FROM_E);
        else { const s = SL_W[slot]; if (s >= 0) this.relaxBlock(s, idx + 15, lv, IN_FROM_E); }
      }
      if (!(mk & 16)) {
        if (z < 15) this.relaxBlock(slot, idx + 16, lv, IN_FROM_N);
        else { const s = SL_S[slot]; if (s >= 0) this.relaxBlock(s, idx - 240, lv, IN_FROM_N); }
      }
      if (!(mk & 32)) {
        if (z > 0) this.relaxBlock(slot, idx - 16, lv, IN_FROM_S);
        else { const s = SL_N[slot]; if (s >= 0) this.relaxBlock(s, idx + 240, lv, IN_FROM_S); }
      }
    }
    q.clear();
    this.work += n;
  }

  // ------------------------------------------------------------------ removal BFS
  // Removal ignores shape masks and opacity on purpose: clearing a cell that was lit some
  // other way is harmless (the boundary re-seeds it), missing a dependent cell is not.

  private unSky(slot: number, idx: number, lv: number, down: boolean): void {
    const L = this.wl[slot];
    if (!L) return;
    const cur = L[idx], nl = cur >> 4;
    if (nl === 0) return;
    if (nl < lv || (down && lv === 15 && nl === 15)) {
      L[idx] = cur & 15;
      this.touch(slot, idx);
      this.rq.push((slot << 20) | (idx << 4) | nl);
      if ((idx >> 8) === 255) {
        const t = skyFromAbove(this.wb[slot]![idx]);
        if (t > 0) { L[idx] = (L[idx] & 15) | (t << 4); this.aq.push((slot << 16) | idx); }
      }
    } else {
      this.aq.push((slot << 16) | idx);
    }
  }

  private unpropagateSky(): void {
    const q = this.rq;
    let n = 0;
    while (q.head !== q.tail) {
      const e = q.buf[q.head];
      q.head = (q.head + 1) & q.mask;
      n++;
      const slot = e >>> 20, idx = (e >>> 4) & 0xffff, lv = e & 15;
      const x = idx & 15, z = (idx >> 4) & 15, y = idx >> 8;
      if (y > 0) this.unSky(slot, idx - 256, lv, true);
      if (y < 255) this.unSky(slot, idx + 256, lv, false);
      if (x < 15) this.unSky(slot, idx + 1, lv, false);
      else { const s = SL_E[slot]; if (s >= 0) this.unSky(s, idx - 15, lv, false); }
      if (x > 0) this.unSky(slot, idx - 1, lv, false);
      else { const s = SL_W[slot]; if (s >= 0) this.unSky(s, idx + 15, lv, false); }
      if (z < 15) this.unSky(slot, idx + 16, lv, false);
      else { const s = SL_S[slot]; if (s >= 0) this.unSky(s, idx - 240, lv, false); }
      if (z > 0) this.unSky(slot, idx - 16, lv, false);
      else { const s = SL_N[slot]; if (s >= 0) this.unSky(s, idx + 240, lv, false); }
    }
    q.clear();
    this.work += n;
  }

  private unBlock(slot: number, idx: number, lv: number): void {
    const L = this.wl[slot];
    if (!L) return;
    const cur = L[idx], nl = cur & 15;
    if (nl === 0) return;
    if (nl < lv) {
      L[idx] = cur & 0xf0;
      this.touch(slot, idx);
      this.rq.push((slot << 20) | (idx << 4) | nl);
      const em = LEMIT[this.wb[slot]![idx]];
      if (em > 0) { L[idx] = (L[idx] & 0xf0) | em; this.bq.push((slot << 16) | idx); }
    } else {
      this.bq.push((slot << 16) | idx);
    }
  }

  private unpropagateBlock(): void {
    const q = this.rq;
    let n = 0;
    while (q.head !== q.tail) {
      const e = q.buf[q.head];
      q.head = (q.head + 1) & q.mask;
      n++;
      const slot = e >>> 20, idx = (e >>> 4) & 0xffff, lv = e & 15;
      const x = idx & 15, z = (idx >> 4) & 15, y = idx >> 8;
      if (y > 0) this.unBlock(slot, idx - 256, lv);
      if (y < 255) this.unBlock(slot, idx + 256, lv);
      if (x < 15) this.unBlock(slot, idx + 1, lv);
      else { const s = SL_E[slot]; if (s >= 0) this.unBlock(s, idx - 15, lv); }
      if (x > 0) this.unBlock(slot, idx - 1, lv);
      else { const s = SL_W[slot]; if (s >= 0) this.unBlock(s, idx + 15, lv); }
      if (z < 15) this.unBlock(slot, idx + 16, lv);
      else { const s = SL_S[slot]; if (s >= 0) this.unBlock(s, idx - 240, lv); }
      if (z > 0) this.unBlock(slot, idx - 16, lv);
      else { const s = SL_N[slot]; if (s >= 0) this.unBlock(s, idx + 240, lv); }
    }
    q.clear();
    this.work += n;
  }

  /** Push every neighbour of a cell that holds light onto the add queues (they relight it). */
  private seedAround(slot: number, idx: number, sky: boolean, block: boolean): void {
    const x = idx & 15, z = (idx >> 4) & 15, y = idx >> 8;
    if (y > 0) this.seedCell(slot, idx - 256, sky, block);
    if (y < 255) this.seedCell(slot, idx + 256, sky, block);
    if (x < 15) this.seedCell(slot, idx + 1, sky, block); else this.seedCell(SL_E[slot], idx - 15, sky, block);
    if (x > 0) this.seedCell(slot, idx - 1, sky, block); else this.seedCell(SL_W[slot], idx + 15, sky, block);
    if (z < 15) this.seedCell(slot, idx + 16, sky, block); else this.seedCell(SL_S[slot], idx - 240, sky, block);
    if (z > 0) this.seedCell(slot, idx - 16, sky, block); else this.seedCell(SL_N[slot], idx + 240, sky, block);
  }

  private seedCell(slot: number, idx: number, sky: boolean, block: boolean): void {
    if (slot < 0) return;
    const L = this.wl[slot];
    if (!L) return;
    const l = L[idx];
    if (sky && (l >> 4) > 1) this.aq.push((slot << 16) | idx);
    if (block && (l & 15) > 1) this.bq.push((slot << 16) | idx);
  }

  // ------------------------------------------------------------------ public API

  /**
   * Incremental update after the block at local (lx,y,lz) of chunk `c` changed from `oldV`
   * to `newV` (the new value is already stored). Marks dirty sections.
   */
  update(c: Chunk, lx: number, y: number, lz: number, oldV: number, newV: number): void {
    const skyChanged = LOPAC[oldV] !== LOPAC[newV] || LMASK[oldV] !== LMASK[newV];
    const blockChanged = skyChanged || LEMIT[oldV] !== LEMIT[newV];
    if (!blockChanged) return;
    this.setWindow(c.cx, c.cz, c);
    this.noTouchSlot = -1;
    const idx = (y << 8) | (lz << 4) | lx;
    const L = c.light;

    if (skyChanged) {
      const s = L[idx] >> 4;
      if (s > 0) {
        L[idx] &= 15;
        this.touch(CENTER, idx);
        this.rq.push((CENTER << 20) | (idx << 4) | s);
        this.unpropagateSky();
      }
      this.seedAround(CENTER, idx, true, false);
      if (y === 255) {
        const t = skyFromAbove(newV);
        if (t > (L[idx] >> 4)) { L[idx] = (L[idx] & 15) | (t << 4); this.touch(CENTER, idx); this.aq.push((CENTER << 16) | idx); }
      }
      this.propagateSky();
    }

    const b = L[idx] & 15;
    if (b > 0) {
      L[idx] &= 0xf0;
      this.touch(CENTER, idx);
      this.rq.push((CENTER << 20) | (idx << 4) | b);
      this.unpropagateBlock();
    }
    this.seedAround(CENTER, idx, false, true);
    const em = LEMIT[newV];
    if (em > (L[idx] & 15)) { L[idx] = (L[idx] & 0xf0) | em; this.touch(CENTER, idx); this.bq.push((CENTER << 16) | idx); }
    this.propagateBlock();

    this.flushDirty();
    this.releaseWindow();
  }

  /**
   * Initial light for a freshly inserted column, including light flowing in from and out to
   * the loaded neighbours. Marks changed neighbour sections dirty (not the column itself).
   */
  initChunk(c: Chunk): void {
    this.setWindow(c.cx, c.cz, c);
    this.noTouchSlot = CENTER;
    const L = c.light, B = c.blocks, counts = c.counts;
    L.fill(0);

    let top = -1;
    for (let s = SECTIONS - 1; s >= 0; s--) if (counts[s] > 0) { top = s; break; }
    const yStart = (top + 1) * 16 - 1;
    if (yStart < 255) L.fill(0xf0, (yStart + 1) << 8);

    // 1. Vertical sky fill. Cells below the direct sunlight with partial light (under leaves,
    //    in water) are seeded right away since they may light their sides.
    const sunH = this.sunH, aq = this.aq, bq = this.bq;
    const C16 = CENTER << 16;
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        let v = 15, prevMask = 0, sh = yStart + 1;
        for (let y = yStart; y >= 0; y--) {
          const i = (y << 8) | (z << 4) | x;
          const bv = B[i];
          const mk = LMASK[bv];
          if ((prevMask & F_DOWN) || (mk & F_UP)) break;
          const op = LOPAC[bv];
          if (v !== 15 || op !== 0) {
            v -= op > 1 ? op : 1;
            if (v <= 0) break;
          }
          L[i] = v << 4;
          if (v === 15) sh = y; else if (v > 1) aq.push(C16 | i);
          prevMask = mk;
        }
        sunH[(z << 4) | x] = sh;
      }
    }

    // 2. Direct sunlight next to a column whose sunlight starts higher spreads sideways.
    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        const k = (z << 4) | x, s = sunH[k];
        let m = s;
        if (x > 0 && sunH[k - 1] > m) m = sunH[k - 1];
        if (x < 15 && sunH[k + 1] > m) m = sunH[k + 1];
        if (z > 0 && sunH[k - 16] > m) m = sunH[k - 16];
        if (z < 15 && sunH[k + 16] > m) m = sunH[k + 16];
        for (let y = s; y < m; y++) aq.push(C16 | (y << 8) | k);
      }
    }

    // 3. Emitters.
    for (let s = 0; s <= top; s++) {
      if (!counts[s]) continue;
      const end = (s + 1) << 12;
      for (let i = s << 12; i < end; i++) {
        const em = LEMIT[B[i]];
        if (em) { L[i] |= em; bq.push(C16 | i); }
      }
    }

    // 4. Border cells against loaded neighbours: pull their light in, push ours out.
    this.borderSeeds(c, top, 13, 15, 0, 1);  // east: our x=15 vs their x=0
    this.borderSeeds(c, top, 11, 0, 15, 1);  // west
    this.borderSeeds(c, top, 17, 15, 0, 16); // south: our z=15 vs their z=0
    this.borderSeeds(c, top, 7, 0, 15, 16);  // north

    this.propagateSky();
    this.propagateBlock();
    this.noTouchSlot = -1;
    this.flushDirty();
    c.lit = true;
    this.releaseWindow();
  }

  /**
   * Compare the border layer of the new chunk with the touching layer of a neighbour and
   * queue whichever side can raise the other. `stride` 1 walks z along an x border (strideIdx 16),
   * 16 walks x along a z border.
   */
  private borderSeeds(c: Chunk, top: number, nslot: number, our: number, their: number, axis: number): void {
    const nc = this.wc[nslot];
    if (!nc) return;
    let ntop = -1;
    for (let s = SECTIONS - 1; s >= 0; s--) if (nc.counts[s] > 0) { ntop = s; break; }
    const yMax = Math.min(255, (Math.max(top, ntop) + 1) * 16 + 15);
    const A = c.light, AB = c.blocks, NL = nc.light, NB = nc.blocks;
    // face of our cell that touches the neighbour, and the neighbour's touching face
    let ourFace: number, theirFace: number;
    if (axis === 1) { ourFace = our === 15 ? 1 : 2; theirFace = our === 15 ? 2 : 1; }  // bits: +X=1, -X=2
    else { ourFace = our === 15 ? 16 : 32; theirFace = our === 15 ? 32 : 16; }         // +Z=16, -Z=32
    const aq = this.aq, bq = this.bq;
    const ourSlot = CENTER << 16, theirSlot = nslot << 16;
    for (let y = 0; y <= yMax; y++) {
      for (let t = 0; t < 16; t++) {
        const ai = axis === 1 ? (y << 8) | (t << 4) | our : (y << 8) | (our << 4) | t;
        const bi = axis === 1 ? (y << 8) | (t << 4) | their : (y << 8) | (their << 4) | t;
        const va = AB[ai], vb = NB[bi];
        if ((LMASK[va] & ourFace) || (LMASK[vb] & theirFace)) continue;
        const la = A[ai], lb = NL[bi];
        if (la === lb) continue;
        const oa = LOPAC[va], ob = LOPAC[vb];
        const da = oa > 1 ? oa : 1, db = ob > 1 ? ob : 1;
        const sa = la >> 4, sb = lb >> 4;
        if (sa - db > sb) aq.push(ourSlot | ai);
        else if (sb - da > sa) aq.push(theirSlot | bi);
        const ba = la & 15, bb = lb & 15;
        if (bb - da > ba) bq.push(theirSlot | bi);
        else if (ba - db > bb) bq.push(ourSlot | ai);
      }
    }
  }
}
