// Texture atlas: every registry texture in one 512x512 RGBA DataTexture with a hand-built
// mip chain. Mips are filtered per 16x16 tile (no bleeding between tiles down to the 1x1
// level of a tile) with a policy chosen by TEX_KIND:
//   0 opaque       plain average (alpha is the grass tint mask, so it averages too)
//   1 cutout       alpha-weighted colour, alpha rescaled so the share of texels passing the
//                  0.5 alpha test matches the full-size tile (leaves and plants do not fade away)
//   2 translucent  plain average
// Below 1 texel per tile (levels 5..9) the chain continues with a plain 2x2 box filter so
// the texture is complete for WebGL1.
import {
  DataTexture, RGBAFormat, UnsignedByteType, NearestFilter, NearestMipmapLinearFilter, ClampToEdgeWrapping,
} from 'three';
import { TEXTURE_NAMES, TEX_KIND } from '../blocks/registry';
import { packTile } from '../blocks/packs';
import type { ResourcePackId } from '../settings';

export const ATLAS_SIZE = 512;
export const TILE_SIZE = 16;
export const ATLAS_COLS = ATLAS_SIZE / TILE_SIZE; // 32
export const MAX_TILES = ATLAS_COLS * ATLAS_COLS; // 1024

/** tiles[t] = level-0 16x16 RGBA (owned by the atlas, rewritten in place by rebuildAtlas); pack = resource pack drawn. */
export interface Atlas { texture: DataTexture; tiles: Uint8ClampedArray[]; pack?: ResourcePackId }

interface MipLevel { data: Uint8Array; width: number; height: number }

/** Mip chains are built lazily and cached per atlas (the 'mipmaps' option can be toggled live). */
const chains = new WeakMap<Atlas, MipLevel[]>();

/** Pixel origin of tile `t` in the atlas (image row 0 = top, v grows downward). */
export function tileOrigin(t: number): [number, number] {
  return [(t % ATLAS_COLS) * TILE_SIZE, Math.floor(t / ATLAS_COLS) * TILE_SIZE];
}

/** Tile `t` drawn with `pack` (a fresh copy; a broken generator gives the magenta check). */
function makeTile(t: number, pack: ResourcePackId): Uint8ClampedArray {
  let px: Uint8ClampedArray;
  try {
    px = packTile(t, pack);
  } catch (e) {
    console.warn('[atlas] texture failed', TEXTURE_NAMES[t], e);
    px = missingTile();
  }
  if (px.length !== TILE_SIZE * TILE_SIZE * 4) px = missingTile();
  return px.slice();
}

function blitTile(level0: Uint8Array, t: number, px: Uint8ClampedArray) {
  const [ox, oy] = tileOrigin(t);
  for (let y = 0; y < TILE_SIZE; y++) {
    level0.set(px.subarray(y * TILE_SIZE * 4, (y + 1) * TILE_SIZE * 4), ((oy + y) * ATLAS_SIZE + ox) * 4);
  }
}

export function buildAtlas(mipmaps: boolean, packId: ResourcePackId = 'default'): Atlas {
  const n = TEXTURE_NAMES.length;
  if (n > MAX_TILES) console.warn(`[atlas] ${n} textures do not fit in ${MAX_TILES} tiles`);
  const tiles: Uint8ClampedArray[] = [];
  const level0 = new Uint8Array(ATLAS_SIZE * ATLAS_SIZE * 4);
  for (let t = 0; t < n && t < MAX_TILES; t++) {
    const px = makeTile(t, packId);
    tiles.push(px);
    blitTile(level0, t, px);
  }
  const texture = new DataTexture(level0, ATLAS_SIZE, ATLAS_SIZE, RGBAFormat, UnsignedByteType);
  texture.name = 'atlas';
  texture.magFilter = NearestFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.unpackAlignment = 4;
  const atlas: Atlas = { texture, tiles, pack: packId };
  setAtlasMipmaps(atlas, mipmaps);
  return atlas;
}

/**
 * Redraw every tile with another resource pack, in place: the same DataTexture (and the same
 * tile arrays) get new pixels and a new mip chain, so every material, the held block and the
 * particles pick it up on the next frame without being rebuilt.
 */
export function rebuildAtlas(atlas: Atlas, packId: ResourcePackId): void {
  const tex = atlas.texture;
  const level0 = tex.image.data as unknown as Uint8Array;
  for (let t = 0; t < atlas.tiles.length; t++) {
    const px = makeTile(t, packId);
    atlas.tiles[t].set(px);
    blitTile(level0, t, px);
  }
  atlas.pack = packId;
  if (chains.has(atlas)) {
    if (tex.mipmaps.length > 0) {
      // Rewrite the uploaded levels in place (level 0 is the image itself).
      const chain = buildMipChain(level0);
      const cur = chains.get(atlas)!;
      for (let k = 1; k < chain.length && k < cur.length; k++) cur[k].data.set(chain[k].data);
    } else {
      chains.delete(atlas); // rebuilt the next time mipmaps are switched on
    }
  }
  tex.needsUpdate = true;
}

/** Switch mipmapping on/off (builds the chain the first time it is needed). */
export function setAtlasMipmaps(atlas: Atlas, on: boolean): void {
  const tex = atlas.texture;
  const want = on ? NearestMipmapLinearFilter : NearestFilter;
  if (tex.minFilter === want && (on ? tex.mipmaps.length > 0 : tex.mipmaps.length === 0) && tex.version > 0) return;
  if (on) {
    let chain = chains.get(atlas);
    if (!chain) {
      chain = buildMipChain(tex.image.data as unknown as Uint8Array);
      chains.set(atlas, chain);
    }
    tex.mipmaps = chain as unknown as typeof tex.mipmaps;
  } else {
    tex.mipmaps = [];
  }
  tex.minFilter = want;
  tex.needsUpdate = true;
}

/** Levels 0..9 (512 -> 1). Level 0 is the atlas itself. Exported for tests. */
export function buildMipChain(level0: Uint8Array): MipLevel[] {
  const levels: MipLevel[] = [{ data: level0, width: ATLAS_SIZE, height: ATLAS_SIZE }];
  // Per-tile levels 1..4 are filtered straight from level 0 (exact box filter over 2^k texels).
  const coverage = new Float32Array(MAX_TILES);
  for (let t = 0; t < MAX_TILES; t++) {
    if (TEX_KIND[t] !== 1) continue;
    const [ox, oy] = tileOrigin(t);
    let pass = 0;
    for (let y = 0; y < TILE_SIZE; y++) for (let x = 0; x < TILE_SIZE; x++) {
      if (level0[((oy + y) * ATLAS_SIZE + ox + x) * 4 + 3] >= 128) pass++;
    }
    coverage[t] = pass / (TILE_SIZE * TILE_SIZE);
  }
  const alphaScratch = new Float32Array(TILE_SIZE * TILE_SIZE);
  for (let k = 1; k <= 4; k++) {
    const size = ATLAS_SIZE >> k, ts = TILE_SIZE >> k, f = 1 << k, area = f * f;
    const out = new Uint8Array(size * size * 4);
    for (let t = 0; t < MAX_TILES; t++) {
      const kind = TEX_KIND[t];
      const [ox0, oy0] = tileOrigin(t);
      const ox = ox0 >> k, oy = oy0 >> k;
      let n = 0;
      for (let y = 0; y < ts; y++) for (let x = 0; x < ts; x++) {
        let r = 0, g = 0, b = 0, a = 0, wr = 0, wg = 0, wb = 0;
        const sx = ox0 + x * f, sy = oy0 + y * f;
        for (let dy = 0; dy < f; dy++) {
          let i = ((sy + dy) * ATLAS_SIZE + sx) * 4;
          for (let dx = 0; dx < f; dx++, i += 4) {
            const al = level0[i + 3];
            r += level0[i]; g += level0[i + 1]; b += level0[i + 2]; a += al;
            wr += level0[i] * al; wg += level0[i + 1] * al; wb += level0[i + 2] * al;
          }
        }
        const o = ((oy + y) * size + ox + x) * 4;
        if (kind === 1 && a > 0) {
          out[o] = Math.round(wr / a); out[o + 1] = Math.round(wg / a); out[o + 2] = Math.round(wb / a);
        } else {
          out[o] = Math.round(r / area); out[o + 1] = Math.round(g / area); out[o + 2] = Math.round(b / area);
        }
        const avgA = a / area;
        if (kind === 1) alphaScratch[n++] = avgA;
        else out[o + 3] = Math.round(avgA);
      }
      if (kind === 1) {
        const s = coverageScale(alphaScratch, n, coverage[t]);
        let m = 0;
        for (let y = 0; y < ts; y++) for (let x = 0; x < ts; x++) {
          const o = ((oy + y) * size + ox + x) * 4;
          out[o + 3] = Math.min(255, Math.round(alphaScratch[m++] * s));
        }
      }
    }
    levels.push({ data: out, width: size, height: size });
  }
  // Levels 5..9: plain 2x2 box filter of the previous level.
  for (let k = 5; (ATLAS_SIZE >> k) >= 1; k++) {
    const prev = levels[k - 1];
    const size = ATLAS_SIZE >> k;
    const out = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      for (let c = 0; c < 4; c++) {
        const p = prev.data, w = prev.width;
        const v = p[((2 * y) * w + 2 * x) * 4 + c] + p[((2 * y) * w + 2 * x + 1) * 4 + c]
          + p[((2 * y + 1) * w + 2 * x) * 4 + c] + p[((2 * y + 1) * w + 2 * x + 1) * 4 + c];
        out[(y * size + x) * 4 + c] = (v + 2) >> 2;
      }
    }
    levels.push({ data: out, width: size, height: size });
  }
  return levels;
}

/**
 * Scale factor s for the averaged alphas a[0..n) so that the fraction of texels with
 * a*s >= 127.5 is as close as possible to `target` (the full-size coverage).
 */
function coverageScale(a: Float32Array, n: number, target: number): number {
  if (n === 0) return 1;
  const cov = (s: number) => {
    let c = 0;
    for (let i = 0; i < n; i++) if (a[i] * s >= 127.5) c++;
    return c / n;
  };
  if (target <= 0) return 1;
  let lo = 0.25, hi = 64;
  if (cov(hi) < target) return hi;
  for (let it = 0; it < 24; it++) {
    const mid = Math.sqrt(lo * hi);
    if (cov(mid) >= target) hi = mid; else lo = mid;
  }
  // `hi` reaches the target; `lo` stays just below it: take whichever is closer.
  const ch = cov(hi), cl = cov(lo);
  const s = Math.abs(cl - target) < Math.abs(ch - target) ? lo : hi;
  // Never make a tile more transparent than its plain average (keeps opaque cores solid).
  return Math.max(1, s);
}

function missingTile(): Uint8ClampedArray {
  const d = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
  for (let y = 0; y < TILE_SIZE; y++) for (let x = 0; x < TILE_SIZE; x++) {
    const on = ((x >> 3) ^ (y >> 3)) & 1;
    const i = (y * TILE_SIZE + x) * 4;
    d[i] = on ? 248 : 0; d[i + 1] = 0; d[i + 2] = on ? 248 : 0; d[i + 3] = 255;
  }
  return d;
}
