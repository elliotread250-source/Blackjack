// One 16x256x16 column of blocks plus its light, biome and tint data.
import { COLUMN_VOLUME, SECTIONS } from './constants';
import type { GenChunk } from '../types';

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  /** packed blocks (id | meta << 10), index colIndex(x,y,z) */
  blocks: Uint16Array;
  /** packed light (sky << 4 | block), same indexing */
  light: Uint8Array;
  /** biome id per column, index xzIndex(x,z) */
  biome: Uint8Array;
  /** 256 columns x 9 bytes: grass rgb, foliage rgb, water rgb */
  tint: Uint8Array;
  /** non-air blocks per 16^3 section, kept up to date by set() */
  counts: Uint16Array;
  /** edited since generation/load: must be saved */
  modified = false;
  /** initial light has been computed (World.addChunk) */
  lit = false;

  constructor(g: GenChunk) {
    this.cx = g.cx;
    this.cz = g.cz;
    this.blocks = g.blocks.length === COLUMN_VOLUME ? g.blocks : fit(g.blocks);
    this.light = new Uint8Array(COLUMN_VOLUME);
    this.biome = g.biome && g.biome.length >= 256 ? g.biome : new Uint8Array(256);
    this.tint = g.tint && g.tint.length >= 256 * 9 ? g.tint : new Uint8Array(256 * 9);
    this.counts = new Uint16Array(SECTIONS);
    this.recount();
  }

  /** Packed block at local coords (x,z 0..15, y 0..255); 0 outside the column height. */
  get(x: number, y: number, z: number): number {
    if (y < 0 || y > 255) return 0;
    return this.blocks[(y << 8) | (z << 4) | x];
  }

  /**
   * Raw write at local coords: updates `counts` and `modified` only. Lighting, remeshing
   * and fluid updates are World.set's job.
   */
  set(x: number, y: number, z: number, v: number): void {
    if (y < 0 || y > 255) return;
    if ((v & 0x3ff) === 0) v = 0;           // air never carries state bits
    const i = (y << 8) | (z << 4) | x;
    const old = this.blocks[i];
    if (old === v) return;
    this.blocks[i] = v;
    if (old === 0) this.counts[y >> 4]++;
    else if (v === 0) this.counts[y >> 4]--;
    this.modified = true;
  }

  /** Recompute `counts` from `blocks` (after bulk writes). */
  recount(): void {
    const b = this.blocks, c = this.counts;
    for (let s = 0; s < SECTIONS; s++) {
      let n = 0;
      const end = (s + 1) << 12;
      for (let i = s << 12; i < end; i++) if (b[i] !== 0) n++;
      c[s] = n;
    }
  }
}

/** Copy a wrongly sized block array into a full column (defensive, never on the hot path). */
function fit(src: Uint16Array): Uint16Array {
  const out = new Uint16Array(COLUMN_VOLUME);
  out.set(src.subarray(0, Math.min(src.length, COLUMN_VOLUME)));
  return out;
}
