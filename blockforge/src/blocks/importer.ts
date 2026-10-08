// Import a resource pack (.zip) the player picks from their own computer. Everything happens in
// the player's browser: the zip is read and decoded locally and the 16x16 tiles are kept in this
// browser's IndexedDB. Nothing is uploaded and nothing is bundled with the game.
//
// Layout read: assets/minecraft/textures/block/<name>.png (the standard block texture folder of
// resource packs). Texture names that differ from BlockForge's are mapped below; anything the
// pack does not have keeps BlockForge's own texture.
import { TEXTURE_NAMES, DYES } from './registry';
import { inflateRaw } from './inflate';

export interface CustomPack {
  name: string;
  /** BlockForge texture name -> 16x16 RGBA */
  tiles: Map<string, Uint8ClampedArray>;
}

const BLOCK_DIR = 'assets/minecraft/textures/block/';

// ------------------------------------------------------------------ name mapping

const ALIASES: Record<string, string[]> = {
  grass_side_snowy: ['grass_block_snow'],
  path_top: ['dirt_path_top', 'grass_path_top'],
  path_side: ['dirt_path_side', 'grass_path_side'],
  moss: ['moss_block'],
  amethyst: ['amethyst_block'],
  bone_top: ['bone_block_top'],
  bone_side: ['bone_block_side'],
  dripstone: ['dripstone_block'],
  purpur: ['purpur_block'],
  quartz_top: ['quartz_block_top'],
  quartz_side: ['quartz_block_side'],
  chiseled_quartz: ['chiseled_quartz_block'],
  chiseled_quartz_top: ['chiseled_quartz_block_top'],
  froglight_ochre: ['ochre_froglight_side'],
  froglight_ochre_top: ['ochre_froglight_top'],
  froglight_verdant: ['verdant_froglight_side'],
  froglight_verdant_top: ['verdant_froglight_top'],
  froglight_pearl: ['pearlescent_froglight_side'],
  froglight_pearl_top: ['pearlescent_froglight_top'],
  hay_top: ['hay_block_top'],
  hay_side: ['hay_block_side'],
  slime: ['slime_block'],
  honey: ['honey_block_side', 'honey_block_top'],
  honeycomb: ['honeycomb_block'],
  kelp_top: ['dried_kelp_top'],
  kelp_side: ['dried_kelp_side'],
  mushroom_brown: ['brown_mushroom_block'],
  mushroom_red: ['red_mushroom_block'],
  tall_grass: ['short_grass', 'grass'],
  water: ['water_still'],
  lava: ['lava_still'],
  mangrove_sapling: ['mangrove_propagule'],
  ore_nether_gold: ['nether_gold_ore'],
  ore_nether_quartz: ['nether_quartz_ore'],
};

// Textures whose model layout differs from BlockForge's: keep our own.
const SKIP = new Set(['missing', 'lantern', 'soul_lantern', 'end_rod', 'chest_top', 'chest_side', 'chest_front', 'embers']);

/** Candidate file names (without .png) in the pack for one of our texture names. */
export function packNamesFor(name: string): string[] {
  if (SKIP.has(name)) return [];
  if (ALIASES[name]) return ALIASES[name];
  let m: RegExpMatchArray | null;
  if ((m = name.match(/^ore_stone_(.+)$/))) return [`${m[1]}_ore`];
  if ((m = name.match(/^ore_deepslate_(.+)$/))) return [`deepslate_${m[1]}_ore`];
  if ((m = name.match(/^(wool|concrete|powder|terracotta|glazed|stained_glass)_(.+)$/)) && (DYES as readonly string[]).includes(m[2])) {
    const c = m[2];
    switch (m[1]) {
      case 'wool': return [`${c}_wool`];
      case 'concrete': return [`${c}_concrete`];
      case 'powder': return [`${c}_concrete_powder`];
      case 'terracotta': return [`${c}_terracotta`];
      case 'glazed': return [`${c}_glazed_terracotta`];
      case 'stained_glass': return [`${c}_stained_glass`];
    }
  }
  if ((m = name.match(/^flower_(.+)$/))) return [m[1]];
  return [name];
}

// Blocks BlockForge draws with a fixed colour while resource packs ship them grey (the game tints them).
const BAKE_TINT: Record<string, [number, number, number]> = {
  spruce_leaves: [0x61, 0x99, 0x61],
  birch_leaves: [0x80, 0xa7, 0x55],
  sugar_cane: [0x91, 0xbd, 0x59],
};

// ------------------------------------------------------------------ zip reading

interface ZipEntry { name: string; method: number; compSize: number; size: number; offset: number }

function readZipDirectory(buf: ArrayBuffer): ZipEntry[] {
  const v = new DataView(buf);
  // End of central directory record: scan back over a possible comment.
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 22 - 65535); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('That file is not a zip archive.');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out: ZipEntry[] = [];
  for (let n = 0; n < count && p + 46 <= buf.byteLength; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const compSize = v.getUint32(p + 20, true);
    const size = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true), extraLen = v.getUint16(p + 30, true), commentLen = v.getUint16(p + 32, true);
    const offset = v.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(buf, p + 46, nameLen));
    out.push({ name, method, compSize, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

async function readEntry(buf: ArrayBuffer, e: ZipEntry): Promise<Uint8Array> {
  const v = new DataView(buf);
  if (v.getUint32(e.offset, true) !== 0x04034b50) throw new Error('Damaged zip entry: ' + e.name);
  const start = e.offset + 30 + v.getUint16(e.offset + 26, true) + v.getUint16(e.offset + 28, true);
  const data = new Uint8Array(buf, start, e.compSize);
  if (e.method === 0) return data.slice();
  if (e.method !== 8) throw new Error('Unsupported compression in ' + e.name);
  if (nativeInflate) {
    try {
      const ds = new DecompressionStream('deflate-raw');
      const stream = new Blob([data as BlobPart]).stream().pipeThrough(ds);
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch {
      // no 'deflate-raw' here (older Chrome): use the built-in decoder from now on
      nativeInflate = false;
    }
  }
  return inflateRaw(data, e.size);
}

/** iPhones before iOS 16.4 have no DecompressionStream; older Chrome lacks 'deflate-raw'. */
let nativeInflate = typeof DecompressionStream !== 'undefined';

// ------------------------------------------------------------------ image decoding

let canvas: HTMLCanvasElement | null = null;
let ctx2d: CanvasRenderingContext2D | null = null;

let bitmapOK = typeof createImageBitmap === 'function';

/** A decoded image plus how to free it. */
interface Decoded { src: CanvasImageSource; width: number; height: number; free(): void }

async function decodePng(png: Uint8Array): Promise<Decoded | null> {
  const blob = new Blob([png as BlobPart], { type: 'image/png' });
  if (bitmapOK) {
    try {
      const bmp = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      return { src: bmp, width: bmp.width, height: bmp.height, free: () => bmp.close() };
    } catch {
      // some Safari versions reject these options or blobs here: decode through <img> instead
      bitmapOK = false;
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return { src: img, width: img.naturalWidth, height: img.naturalHeight, free: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

/** Decode a PNG and return its top square frame as 16x16 RGBA. */
async function decodeTile(png: Uint8Array): Promise<Uint8ClampedArray | null> {
  const bmp = await decodePng(png);
  if (!bmp || !bmp.width || !bmp.height) { bmp?.free(); return null; }
  const w = bmp.width, frame = Math.min(bmp.width, bmp.height);
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    ctx2d = canvas.getContext('2d', { willReadFrequently: true });
  }
  const g = ctx2d!;
  g.clearRect(0, 0, 16, 16);
  // Exact 16x16 pixels stay crisp; higher resolution packs are scaled down smoothly.
  g.imageSmoothingEnabled = frame > 16;
  if (frame > 16) g.imageSmoothingQuality = 'high';
  g.drawImage(bmp.src, 0, 0, Math.min(w, frame), frame, 0, 0, 16, 16);
  bmp.free();
  return g.getImageData(0, 0, 16, 16).data;
}

// ------------------------------------------------------------------ post-processing

/** The grass top is fully biome tinted: alpha 0 marks every pixel as tinted (see TINTMASK). */
function asTintMask(t: Uint8ClampedArray): Uint8ClampedArray {
  const out = t.slice();
  for (let i = 3; i < out.length; i += 4) out[i] = 0;
  return out;
}

/** Grass side: dirt where the overlay is clear, grey tinted overlay pixels (alpha 0) elsewhere. */
function grassSide(side: Uint8ClampedArray, overlay: Uint8ClampedArray | null): Uint8ClampedArray {
  const out = side.slice();
  for (let i = 0; i < 256; i++) {
    const o = i * 4;
    out[o + 3] = 255;
    if (overlay && overlay[o + 3] > 40) {
      out[o] = overlay[o]; out[o + 1] = overlay[o + 1]; out[o + 2] = overlay[o + 2];
      out[o + 3] = 0;   // tinted by the biome's grass colour in the shader
    }
  }
  return out;
}

/**
 * Leaves: packs leave the see-through pixels black, but the fast-leaves setting draws leaves
 * solid, so fill those pixels with a darker shade of the leaf colour (alpha stays 0).
 */
function fillLeafHoles(t: Uint8ClampedArray): Uint8ClampedArray {
  const out = t.slice();
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] >= 128) { r += out[i]; g += out[i + 1]; b += out[i + 2]; n++; }
  if (!n) return out;
  r = (r / n) * 0.55; g = (g / n) * 0.55; b = (b / n) * 0.55;
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] < 128) { out[i] = r; out[i + 1] = g; out[i + 2] = b; }
  return out;
}

/** Water: the shader reads the texture as a soft brightness pattern, so keep it calm and mid-grey. */
function calmWater(t: Uint8ClampedArray): Uint8ClampedArray {
  const out = t.slice();
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += (t[i * 4] + t[i * 4 + 1] + t[i * 4 + 2]) / 3;
  const mean = sum / 256;
  for (let i = 0; i < 256; i++) {
    const o = i * 4;
    const v = (t[o] + t[o + 1] + t[o + 2]) / 3;
    const w = Math.max(0, Math.min(255, 190 + (v - mean) * 0.45));
    out[o] = out[o + 1] = out[o + 2] = w;
    out[o + 3] = 200;
  }
  return out;
}

function bake(t: Uint8ClampedArray, c: [number, number, number]): Uint8ClampedArray {
  const out = t.slice();
  for (let i = 0; i < out.length; i += 4) {
    out[i] = (out[i] * c[0]) / 255; out[i + 1] = (out[i + 1] * c[1]) / 255; out[i + 2] = (out[i + 2] * c[2]) / 255;
  }
  return out;
}

// ------------------------------------------------------------------ import

export async function importResourcePack(file: Blob, fileName: string, onProgress?: (done: number, total: number) => void): Promise<CustomPack> {
  const buf = await file.arrayBuffer();
  const entries = readZipDirectory(buf);
  const byName = new Map<string, ZipEntry>();
  let packRoot = '';
  for (const e of entries) {
    const i = e.name.indexOf(BLOCK_DIR);
    if (i < 0 || !e.name.endsWith('.png')) continue;
    if (!packRoot) packRoot = e.name.slice(0, i);
    byName.set(e.name.slice(i + BLOCK_DIR.length, -4), e);
  }
  if (!byName.size) throw new Error('No block textures found. Pick a resource pack zip with assets/minecraft/textures/block in it.');

  const cache = new Map<string, Uint8ClampedArray | null>();
  const load = async (n: string) => {
    if (cache.has(n)) return cache.get(n)!;
    const e = byName.get(n);
    const t = e ? await decodeTile(await readEntry(buf, e)) : null;
    cache.set(n, t);
    return t;
  };

  const tiles = new Map<string, Uint8ClampedArray>();
  const names = TEXTURE_NAMES;
  let done = 0;
  for (const name of names) {
    done++;
    if (done % 16 === 0) onProgress?.(done, names.length);
    try {
      if (name === 'grass_top') {
        const t = await load('grass_block_top');
        if (t) tiles.set(name, asTintMask(t));
        continue;
      }
      if (name === 'grass_side') {
        const side = await load('grass_block_side');
        if (side) tiles.set(name, grassSide(side, await load('grass_block_side_overlay')));
        continue;
      }
      for (const cand of packNamesFor(name)) {
        let t = await load(cand);
        if (!t) continue;
        const tint = BAKE_TINT[name];
        if (tint) t = bake(t, tint);
        if (name.endsWith('_leaves')) t = fillLeafHoles(t);
        if (name === 'water') t = calmWater(t);
        tiles.set(name, t);
        break;
      }
    } catch (e) {
      console.warn('[packs] skipped', name, e);
    }
  }
  onProgress?.(names.length, names.length);
  if (!tiles.size) throw new Error('None of the textures in that pack match BlockForge blocks.');
  const base = fileName.replace(/\.zip$/i, '').trim() || 'Imported Pack';
  return { name: base.length > 32 ? base.slice(0, 31) + '…' : base, tiles };
}

// ------------------------------------------------------------------ persistence (this browser only)

const DB = 'blockforge-packs', STORE = 'packs', KEY = 'custom';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCustomPack(p: CustomPack): Promise<void> {
  const db = await openDb();
  const tiles: Record<string, ArrayBuffer> = {};
  for (const [k, v] of p.tiles) tiles[k] = v.slice().buffer;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ name: p.name, tiles }, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  // ask the browser not to clear the pack when the disk runs low (it stays on at every start)
  try { void navigator.storage?.persist?.().catch(() => undefined); } catch { /* ignore */ }
}

export async function loadCustomPack(): Promise<CustomPack | null> {
  try {
    const db = await openDb();
    const rec = await new Promise<{ name: string; tiles: Record<string, ArrayBuffer> } | undefined>((resolve, reject) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!rec) return null;
    const tiles = new Map<string, Uint8ClampedArray>();
    for (const [k, v] of Object.entries(rec.tiles)) if (v.byteLength === 1024) tiles.set(k, new Uint8ClampedArray(v));
    return tiles.size ? { name: rec.name, tiles } : null;
  } catch {
    return null;
  }
}

export async function deleteCustomPack(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    db.close();
  } catch { /* nothing stored */ }
}

