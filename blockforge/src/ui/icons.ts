// Item icons: every block is drawn once at startup into one sprite sheet.
// Cubes and other solid shapes are rendered isometrically by a tiny software rasterizer
// (nearest-neighbour texture sampling, z-buffer, top face full bright, left 0.8, right 0.6);
// plants, torches, doors, panes and rods become flat pixel sprites like inventory items.
// The shapes are drawn straight from the registry rules here so the icons never depend on
// the world mesher. Tinted textures use the biome-neutral DEFAULT_TINT.
import type { Atlas } from '../render/atlas';
import {
  COUNT, SHAPE, S, LAYER, L, TINT, TINTMASK, FACE_TEX, FLUID,
} from '../blocks/registry';
import { DEFAULT_TINT } from '../blocks/textures';

export interface IconSheet { url: string; size: number; cols: number; apply(el: HTMLElement, id: number): void; }

/** Icon cell size in sheet pixels (4 sheet pixels per texel, so flat sprites stay exact at GUI scale 2, 3 and 4). */
export const ICON_SIZE = 64;
const COLS = 32;
/** Extra non-block icons appended after the blocks. */
export const EXTRA_ICONS = { search: COUNT, missing: COUNT + 1 } as const;
const TOTAL = COUNT + 2;

type Tile = Uint8ClampedArray;
type TileFn = (t: number) => Tile;

// Isometric basis in sheet pixels: +x goes left-up, +z right-up, +y straight up (2:1 lines).
const EX = [-28, -14], EZ = [28, -14], EY = [0, -34];
const OX = 32, OY = 63;  // screen position of block corner (0,0,0)
const sx = (x: number, z: number) => OX + EX[0] * x + EZ[0] * z;
const sy = (x: number, y: number, z: number) => OY + EX[1] * x + EZ[1] * z + EY[1] * y;
const depth = (x: number, y: number, z: number) => -(x + z) * 0.6124 + y * 0.5; // larger = nearer

const enum Alpha { Opaque = 0, Cutout = 1, Blend = 2 }

interface Paint { tile: Tile; alpha: Alpha; tint: number[] | null; mask: boolean; shade: number; minAlpha: number }

/** Software render target for one icon cell. */
class Cell {
  px = new Uint8ClampedArray(ICON_SIZE * ICON_SIZE * 4);
  z = new Float32Array(ICON_SIZE * ICON_SIZE);
  clear() { this.px.fill(0); this.z.fill(-1e9); }

  /** Write one shaded, tinted texel colour into pixel i, honouring the alpha mode. */
  put(i: number, p: Paint, ti: number, d: number) {
    const t = p.tile;
    let a = t[ti + 3];
    let r = t[ti], g = t[ti + 1], b = t[ti + 2];
    if (p.alpha === Alpha.Opaque) {
      if (p.mask && a < 128 && p.tint) { r = r * p.tint[0] / 255; g = g * p.tint[1] / 255; b = b * p.tint[2] / 255; }
      a = 255;
    } else {
      if (p.alpha === Alpha.Cutout) { if (a < 128) return; a = 255; } else if (a === 0) return;
      if (p.tint) { r = r * p.tint[0] / 255; g = g * p.tint[1] / 255; b = b * p.tint[2] / 255; }
    }
    if (d <= this.z[i]) return;
    r *= p.shade; g *= p.shade; b *= p.shade;
    const o = i * 4, px = this.px;
    if (p.alpha === Alpha.Blend) {
      a = Math.max(a, p.minAlpha);
      const sa = a / 255, da = px[o + 3] / 255, oa = sa + da * (1 - sa);
      if (oa <= 0) return;
      px[o] = (r * sa + px[o] * da * (1 - sa)) / oa;
      px[o + 1] = (g * sa + px[o + 1] * da * (1 - sa)) / oa;
      px[o + 2] = (b * sa + px[o + 2] * da * (1 - sa)) / oa;
      px[o + 3] = oa * 255;
    } else {
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
      this.z[i] = d;
    }
  }

  /**
   * Rasterize a textured parallelogram: corner (x,y,z) in block units maps to texel (u0,v0);
   * edge A moves by (ax,ay,az) to u1, edge B by (bx,by,bz) to v1. Texels are 0..16.
   */
  quad(x: number, y: number, z: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number,
    u0: number, u1: number, v0: number, v1: number, p: Paint) {
    const ox = sx(x, z), oy = sy(x, y, z);
    const Ax = sx(x + ax, z + az) - ox, Ay = sy(x + ax, y + ay, z + az) - oy;
    const Bx = sx(x + bx, z + bz) - ox, By = sy(x + bx, y + by, z + bz) - oy;
    const det = Ax * By - Bx * Ay;
    if (Math.abs(det) < 1e-6) return;
    const d0 = depth(x, y, z), dA = depth(x + ax, y + ay, z + az) - d0, dB = depth(x + bx, y + by, z + bz) - d0;
    const xs = [ox, ox + Ax, ox + Bx, ox + Ax + Bx], ys = [oy, oy + Ay, oy + By, oy + Ay + By];
    const minX = Math.max(0, Math.floor(Math.min(...xs))), maxX = Math.min(ICON_SIZE - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys))), maxY = Math.min(ICON_SIZE - 1, Math.ceil(Math.max(...ys)));
    const eps = 1e-4;
    const uLo = Math.min(u0, u1), uHi = Math.max(u0, u1), vLo = Math.min(v0, v1), vHi = Math.max(v0, v1);
    for (let py = minY; py <= maxY; py++) {
      const cy = py + 0.5 - oy;
      for (let pxx = minX; pxx <= maxX; pxx++) {
        const cx = pxx + 0.5 - ox;
        const a = (cx * By - cy * Bx) / det;
        const b = (Ax * cy - Ay * cx) / det;
        if (a < -eps || a >= 1 + eps || b < -eps || b >= 1 + eps) continue;
        let tu = Math.floor(u0 + (u1 - u0) * Math.min(Math.max(a, 0), 0.99999));
        let tv = Math.floor(v0 + (v1 - v0) * Math.min(Math.max(b, 0), 0.99999));
        // Keep reversed ranges inside the face's own texels.
        if (u1 < u0) tu = Math.min(Math.max(tu, uLo), Math.ceil(uHi) - 1);
        if (v1 < v0) tv = Math.min(Math.max(tv, vLo), Math.ceil(vHi) - 1);
        tu = tu < 0 ? 0 : tu > 15 ? 15 : tu;
        tv = tv < 0 ? 0 : tv > 15 ? 15 : tv;
        this.put(py * ICON_SIZE + pxx, p, (tv * 16 + tu) * 4, d0 + a * dA + b * dB);
      }
    }
  }

  /** Flat sprite: texel (tx,ty) of `tile` covers `scale` x `scale` pixels starting at (ox,oy). */
  sprite(tile: Tile, p: Paint, ox: number, oy: number, scale: number, region?: (tx: number, ty: number) => boolean) {
    for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
      if (region && !region(tx, ty)) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const X = ox + tx * scale + dx, Y = oy + ty * scale + dy;
        if (X < 0 || Y < 0 || X >= ICON_SIZE || Y >= ICON_SIZE) continue;
        this.put(Y * ICON_SIZE + X, { ...p, tile }, (ty * 16 + tx) * 4, 0);
      }
    }
  }
}

/** Box in block units: x0,x1,y0,y1,z0,z1. */
type B6 = [number, number, number, number, number, number];

function tintFor(id: number): number[] | null {
  switch (TINT[id]) {
    case 1: return DEFAULT_TINT.grass;
    case 2: return DEFAULT_TINT.foliage;
    case 3: return DEFAULT_TINT.water;
    default: return null;
  }
}

function alphaFor(id: number): Alpha {
  const l = LAYER[id];
  return l === L.cutout ? Alpha.Cutout : l === L.translucent || l === L.water ? Alpha.Blend : Alpha.Opaque;
}

// Visible faces from the icon camera: top (+Y, face 2), north (-Z, face 5, drawn on the left)
// and west (-X, face 1, on the right).
const SHADE_TOP = 1, SHADE_LEFT = 0.8, SHADE_RIGHT = 0.6;

function drawBox(cell: Cell, id: number, tiles: TileFn, b: B6, faces: { top?: number; north?: number; west?: number } = {}) {
  const [x0, x1, y0, y1, z0, z1] = b;
  const base = { alpha: alphaFor(id), tint: tintFor(id), mask: !!TINTMASK[id], minAlpha: FLUID[id] ? 185 : 0 };
  const top = faces.top ?? FACE_TEX[id * 6 + 2], north = faces.north ?? FACE_TEX[id * 6 + 5], west = faces.west ?? FACE_TEX[id * 6 + 1];
  // top: u = x, v = z
  cell.quad(x0, y1, z0, x1 - x0, 0, 0, 0, 0, z1 - z0, 16 * x0, 16 * x1, 16 * z0, 16 * z1, { ...base, tile: tiles(top), shade: SHADE_TOP });
  // north (z = z0): u = 1 - x, v = 1 - y
  cell.quad(x1, y1, z0, x0 - x1, 0, 0, 0, y0 - y1, 0, 16 * (1 - x1), 16 * (1 - x0), 16 * (1 - y1), 16 * (1 - y0), { ...base, tile: tiles(north), shade: SHADE_LEFT });
  // west (x = x0): u = z, v = 1 - y
  cell.quad(x0, y1, z0, 0, 0, z1 - z0, 0, y0 - y1, 0, 16 * z0, 16 * z1, 16 * (1 - y1), 16 * (1 - y0), { ...base, tile: tiles(west), shade: SHADE_RIGHT });
}

const P = 1 / 16;

/** Pixel-art magnifying glass for the search tab (original drawing). */
const SEARCH_ART = [
  '................',
  '....######......',
  '...#gggggg#.....',
  '..#gwwgggggr....',
  '..#gwggggggr....',
  '..#ggggggggr....',
  '..#ggggggggr....',
  '..#ggggggggr....',
  '...#ggggggr.....',
  '....#rrrrrhh....',
  '..........hHh...',
  '...........hHh..',
  '............hHh.',
  '.............hh.',
  '................',
  '................',
];
const SEARCH_PAL: Record<string, number[]> = {
  '#': [58, 58, 64, 255], r: [130, 130, 140, 255], g: [150, 204, 236, 200], w: [240, 250, 255, 255],
  h: [92, 62, 30, 255], H: [140, 98, 52, 255],
};

function artTile(rows: string[], pal: Record<string, number[]>): Tile {
  const t = new Uint8ClampedArray(1024);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const c = pal[rows[y][x]];
    if (!c) continue;
    const i = (y * 16 + x) * 4;
    t[i] = c[0]; t[i + 1] = c[1]; t[i + 2] = c[2]; t[i + 3] = c[3];
  }
  return t;
}

/** Bounding box of the non-transparent texels of a tile (for centring small sprites). */
function inkBounds(tile: Tile, region?: (x: number, y: number) => boolean) {
  let x0 = 16, y0 = 16, x1 = -1, y1 = -1;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (region && !region(x, y)) continue;
    if (tile[(y * 16 + x) * 4 + 3] >= 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return x1 < 0 ? { x0: 0, y0: 0, x1: 15, y1: 15 } : { x0, y0, x1, y1 };
}

/** Draw the icon for block `id` into `cell` (cleared first). */
function drawBlockIcon(cell: Cell, id: number, tiles: TileFn): void {
  cell.clear();
  if (id <= 0 || id >= COUNT) return;
  const shape = SHAPE[id];
  const flat = { alpha: alphaFor(id) === Alpha.Opaque ? Alpha.Cutout : alphaFor(id), tint: tintFor(id), mask: false, shade: 1, minAlpha: 0 };
  const side = FACE_TEX[id * 6 + 5];
  switch (shape) {
    case S.slab: drawBox(cell, id, tiles, [0, 1, 0, 0.5, 0, 1]); return;
    case S.stairs:
      drawBox(cell, id, tiles, [0, 1, 0, 0.5, 0, 1]);
      drawBox(cell, id, tiles, [0, 1, 0.5, 1, 0.5, 1]);
      return;
    case S.fence:
      drawBox(cell, id, tiles, [6 * P, 10 * P, 0, 1, 0, 4 * P]);
      drawBox(cell, id, tiles, [6 * P, 10 * P, 0, 1, 12 * P, 1]);
      drawBox(cell, id, tiles, [7 * P, 9 * P, 12 * P, 15 * P, 4 * P, 12 * P]);
      drawBox(cell, id, tiles, [7 * P, 9 * P, 6 * P, 9 * P, 4 * P, 12 * P]);
      return;
    case S.wall:
      drawBox(cell, id, tiles, [4 * P, 12 * P, 0, 1, 4 * P, 12 * P]);
      drawBox(cell, id, tiles, [5 * P, 11 * P, 0, 14 * P, 0, 1]);
      return;
    case S.layer: drawBox(cell, id, tiles, [0, 1, 0, 2 * P, 0, 1]); return;
    case S.carpet: drawBox(cell, id, tiles, [0, 1, 0, P, 0, 1]); return;
    case S.trapdoor: drawBox(cell, id, tiles, [0, 1, 0, 3 * P, 0, 1], { north: FACE_TEX[id * 6 + 2], west: FACE_TEX[id * 6 + 2] }); return;
    case S.chest: drawBox(cell, id, tiles, [P, 15 * P, 0, 14 * P, P, 15 * P]); return;
    case S.cactus: {
      // Sides are set back one pixel; the top covers the whole block (like the block model).
      const base = { alpha: Alpha.Cutout, tint: null, mask: false, minAlpha: 0 };
      cell.quad(0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 16, 0, 16, { ...base, tile: tiles(FACE_TEX[id * 6 + 2]), shade: SHADE_TOP });
      cell.quad(1, 1, P, -1, 0, 0, 0, -1, 0, 0, 16, 0, 16, { ...base, tile: tiles(FACE_TEX[id * 6 + 5]), shade: SHADE_LEFT });
      cell.quad(P, 1, 0, 0, 0, 1, 0, -1, 0, 0, 16, 0, 16, { ...base, tile: tiles(FACE_TEX[id * 6 + 1]), shade: SHADE_RIGHT });
      return;
    }
    case S.door: {
      // Both halves stacked, 2 sheet pixels per texel: looks like a little door item.
      const top = tiles(FACE_TEX[id * 6 + 2]), bottom = tiles(FACE_TEX[id * 6 + 3]);
      cell.sprite(top, { ...flat, tile: top, alpha: Alpha.Cutout }, 16, 0, 2);
      cell.sprite(bottom, { ...flat, tile: bottom, alpha: Alpha.Cutout }, 16, 32, 2);
      return;
    }
    case S.torch:
    case S.lantern: {
      const t = tiles(side);
      // Lantern tiles keep their top-face pixels in the corner (0..5, 0..5): not part of the sprite.
      const region = shape === S.lantern ? (x: number, y: number) => !(x <= 5 && y <= 5) : undefined;
      const bb = inkBounds(t, region);
      const offX = Math.round((16 - (bb.x1 - bb.x0 + 1)) / 2) - bb.x0;
      const offY = Math.round((16 - (bb.y1 - bb.y0 + 1)) / 2) - bb.y0;
      cell.sprite(t, { ...flat, tile: t, alpha: Alpha.Cutout }, offX * 4, offY * 4, 4, region);
      return;
    }
    case S.rod: {
      // A diagonal rod with its little base, coloured from the rod texture.
      const t = tiles(side);
      const col = (x: number, y: number) => [t[(y * 16 + x) * 4], t[(y * 16 + x) * 4 + 1], t[(y * 16 + x) * 4 + 2], 255];
      const rod = artTile(Array.from({ length: 16 }, () => '.'.repeat(16)), {});
      const set = (x: number, y: number, c: number[]) => { const i = (y * 16 + x) * 4; rod[i] = c[0]; rod[i + 1] = c[1]; rod[i + 2] = c[2]; rod[i + 3] = 255; };
      for (let k = 0; k < 11; k++) { set(4 + k, 11 - k, col(7, 4)); set(5 + k, 11 - k, col(8, 4)); }
      for (let k = 0; k < 4; k++) set(1 + k, 11 + k - 1, col(1, 1)), set(2 + k, 12 + k - 1, col(2, 2));
      cell.sprite(rod, { ...flat, tile: rod, alpha: Alpha.Cutout }, 0, 0, 4);
      return;
    }
    case S.cross:
    case S.pane:
    case S.lily: {
      const t = tiles(side);
      cell.sprite(t, { ...flat, tile: t, alpha: shape === S.pane && LAYER[id] === L.translucent ? Alpha.Blend : Alpha.Cutout }, 0, 0, 4);
      return;
    }
    default:
      drawBox(cell, id, tiles, [0, 1, 0, 1, 0, 1]);
  }
}

/** Render a single block icon to a standalone canvas (used for world list thumbnails). */
export function blockIconCanvas(id: number, tiles: TileFn): HTMLCanvasElement {
  const cell = new Cell();
  drawBlockIcon(cell, id, tiles);
  const c = document.createElement('canvas');
  c.width = ICON_SIZE; c.height = ICON_SIZE;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(ICON_SIZE, ICON_SIZE);
    img.data.set(cell.px);
    g.putImageData(img, 0, 0);
  }
  return c;
}

/** Render every icon into one RGBA buffer (cols x rows cells). Pure: usable in node tests. */
export function renderIconPixels(tiles: TileFn): { data: Uint8ClampedArray; width: number; height: number; cols: number; rows: number } {
  const rows = Math.ceil(TOTAL / COLS);
  const width = COLS * ICON_SIZE, height = rows * ICON_SIZE;
  const data = new Uint8ClampedArray(width * height * 4);
  const cell = new Cell();
  const blit = (index: number) => {
    const c = index % COLS, r = Math.floor(index / COLS);
    for (let y = 0; y < ICON_SIZE; y++) {
      data.set(cell.px.subarray(y * ICON_SIZE * 4, (y + 1) * ICON_SIZE * 4), ((r * ICON_SIZE + y) * width + c * ICON_SIZE) * 4);
    }
  };
  for (let id = 1; id < COUNT; id++) {
    try { drawBlockIcon(cell, id, tiles); } catch (e) { cell.clear(); console.warn('[icons] failed', id, e); }
    blit(id);
  }
  // Extras
  cell.clear();
  const search = artTile(SEARCH_ART, SEARCH_PAL);
  cell.sprite(search, { tile: search, alpha: Alpha.Blend, tint: null, mask: false, shade: 1, minAlpha: 0 }, 0, 0, 4);
  blit(EXTRA_ICONS.search);
  cell.clear();
  drawBox(cell, 1, () => tiles(0), [0, 1, 0, 1, 0, 1]);
  blit(EXTRA_ICONS.missing);
  return { data, width, height, cols: COLS, rows };
}

/** Uncompressed 32-bit BMP with an alpha channel: built synchronously, decoded natively. */
function encodeBMP(data: Uint8ClampedArray, w: number, h: number): ArrayBuffer {
  const headerSize = 14 + 108;
  const buf = new ArrayBuffer(headerSize + w * h * 4);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x42); dv.setUint8(1, 0x4d);
  dv.setUint32(2, buf.byteLength, true);
  dv.setUint32(10, headerSize, true);
  dv.setUint32(14, 108, true);
  dv.setInt32(18, w, true);
  dv.setInt32(22, -h, true);           // top-down rows
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 32, true);
  dv.setUint32(30, 3, true);           // BI_BITFIELDS
  dv.setUint32(34, w * h * 4, true);
  dv.setInt32(38, 2835, true); dv.setInt32(42, 2835, true);
  dv.setUint32(54, 0x00ff0000, true);  // red mask
  dv.setUint32(58, 0x0000ff00, true);  // green
  dv.setUint32(62, 0x000000ff, true);  // blue
  dv.setUint32(66, 0xff000000, true);  // alpha
  dv.setUint32(70, 0x73524742, true);  // 'sRGB'
  const out = new Uint8Array(buf, headerSize);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = data[i + 2]; out[i + 1] = data[i + 1]; out[i + 2] = data[i]; out[i + 3] = data[i + 3];
  }
  return buf;
}

/** Blob URL of the sheet currently in use, so a rebuilt sheet can release the old one. */
let liveURL: string | null = null;
let sheetGen = 0;

function tileSource(atlas: Pick<Atlas, 'tiles'>): TileFn {
  const missing = new Uint8ClampedArray(1024);
  return (t) => atlas.tiles[t] ?? atlas.tiles[0] ?? missing;
}

/** Render the sheet pixels and publish them as the --bf-icons CSS image. */
function paintSheet(sheet: IconSheet, tiles: TileFn): void {
  const gen = ++sheetGen;
  const { data, width, height, cols, rows } = renderIconPixels(tiles);
  sheet.cols = cols;
  const setURL = (url: string) => {
    if (gen !== sheetGen) { if (url.startsWith('blob:')) URL.revokeObjectURL(url); return; }
    const old = liveURL;
    liveURL = url.startsWith('blob:') ? url : null;
    sheet.url = url;
    document.documentElement.style.setProperty('--bf-icons', `url("${url}")`);
    // Release the previous sheet once the new one is decoded (the old image stays on screen until then).
    if (old && old !== url) {
      const img = new Image();
      const drop = () => URL.revokeObjectURL(old);
      img.onload = drop; img.onerror = drop;
      img.src = url;
      setTimeout(drop, 3000);
    }
  };
  document.documentElement.style.setProperty('--bf-icons-size', `${cols * 100}% ${rows * 100}%`);
  let canvasFallback = () => {
    const c = document.createElement('canvas');
    c.width = width; c.height = height;
    const g = c.getContext('2d');
    if (!g) return;
    const img = g.createImageData(width, height);
    img.data.set(data);
    g.putImageData(img, 0, 0);
    if (c.toBlob) c.toBlob((b) => { if (b) setURL(URL.createObjectURL(b)); else setURL(c.toDataURL()); }, 'image/png');
    else setURL(c.toDataURL());
    canvasFallback = () => undefined;
  };
  try {
    const url = URL.createObjectURL(new Blob([encodeBMP(data, width, height)], { type: 'image/bmp' }));
    setURL(url);
    // Paranoia: if this browser cannot decode alpha BMPs, switch to a PNG made by a canvas.
    const probe = new Image();
    probe.onerror = () => canvasFallback();
    probe.src = url;
  } catch {
    canvasFallback();
  }
}

/** Build the icon sprite sheet from the atlas tiles. */
export function buildIcons(atlas: Pick<Atlas, 'tiles'>): IconSheet {
  const rows = Math.ceil(TOTAL / COLS);
  const sheet: IconSheet = {
    url: '',
    size: ICON_SIZE,
    cols: COLS,
    apply(el: HTMLElement, id: number) {
      if (!(id > 0 && id < TOTAL)) {
        el.classList.remove('bf-icon');
        el.style.backgroundPosition = '';
        el.removeAttribute('data-icon');
        return;
      }
      el.classList.add('bf-icon');
      const cols = sheet.cols;
      const c = id % cols, r = Math.floor(id / cols);
      el.style.backgroundPosition = `${cols > 1 ? (c * 100) / (cols - 1) : 0}% ${rows > 1 ? (r * 100) / (rows - 1) : 0}%`;
      el.setAttribute('data-icon', String(id));
    },
  };
  paintSheet(sheet, tileSource(atlas));
  return sheet;
}

/**
 * Redraw every icon from the atlas' current tiles (after a resource pack change). The sheet
 * object stays the same, so the HUD and inventory keep working; the CSS image is swapped and
 * the old blob URL released.
 */
export function rebuildIcons(sheet: IconSheet, atlas: Pick<Atlas, 'tiles'>): void {
  paintSheet(sheet, tileSource(atlas));
}
