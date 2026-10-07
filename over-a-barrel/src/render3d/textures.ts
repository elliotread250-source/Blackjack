import { CanvasTexture, LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { rng } from '../sim/geom';

/** Tileable fractal value noise on an N×N grid, values ~0..1. */
function fractalNoise(size: number, seed: number, baseCells: number, octaves: number, stretchY = 1): Float32Array {
  const out = new Float32Array(size * size);
  const r = rng(seed);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const cellsX = baseCells << o;
    const cellsY = Math.max(1, Math.round(cellsX / stretchY));
    const grid = new Float32Array(cellsX * cellsY);
    for (let i = 0; i < grid.length; i++) grid[i] = r();
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * cellsY;
      const y0 = Math.floor(gy);
      const ty = gy - y0;
      const sy = ty * ty * (3 - 2 * ty);
      const ya = y0 % cellsY;
      const yb = (y0 + 1) % cellsY;
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * cellsX;
        const x0 = Math.floor(gx);
        const tx = gx - x0;
        const sx = tx * tx * (3 - 2 * tx);
        const xa = x0 % cellsX;
        const xb = (x0 + 1) % cellsX;
        const a = grid[ya * cellsX + xa];
        const b = grid[ya * cellsX + xb];
        const c = grid[yb * cellsX + xa];
        const d = grid[yb * cellsX + xb];
        out[y * size + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
    }
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

function canvasOf(size: number): [HTMLCanvasElement, CanvasRenderingContext2D, ImageData] {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  return [c, ctx, ctx.createImageData(size, size)];
}

function finish(c: HTMLCanvasElement, color: boolean): Texture {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = color ? SRGBColorSpace : LinearSRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Normal map from a tileable height field. */
function normalFrom(h: Float32Array, size: number, strength: number): Texture {
  const [c, ctx, img] = canvasOf(size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)];
      const rr = h[y * size + ((x + 1) % size)];
      const u = h[((y - 1 + size) % size) * size + x];
      const dn = h[((y + 1) % size) * size + x];
      let nx = (l - rr) * strength;
      let ny = (dn - u) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * size + x) * 4;
      d[i] = (nx * 0.5 + 0.5) * 255;
      d[i + 1] = (ny * 0.5 + 0.5) * 255;
      d[i + 2] = (nz * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, false);
}

export interface TextureSet {
  rock: Texture;
  rockNormal: Texture;
  bark: Texture;
  barkNormal: Texture;
  staves: Texture;
  stavesNormal: Texture;
  ice: Texture;
  soft: Texture;
  cloud: Texture;
  flake: Texture;
}

export function makeTextures(): TextureSet {
  const S = 512;

  // Rock: lumpy noise plus sedimentary strata and a few dark cracks.
  const base = fractalNoise(S, 11, 3, 7);
  const strata = fractalNoise(S, 12, 2, 4, 5);
  const fine = fractalNoise(S, 13, 32, 3);
  const height = new Float32Array(S * S);
  const [rc, rctx, rimg] = canvasOf(S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = y * S + x;
      // Faint, wandering bedding planes rather than ruled stripes.
      const band = Math.sin((y / S) * Math.PI * 2 * 3 + strata[i] * 14) * 0.5 + 0.5;
      const h = base[i] * 0.8 + band * 0.1 + fine[i] * 0.1;
      height[i] = h;
      const g = 156 + (h - 0.5) * 230 + (band - 0.5) * 10;
      const p = i * 4;
      rimg.data[p] = rimg.data[p + 1] = rimg.data[p + 2] = Math.max(60, Math.min(255, g));
      rimg.data[p + 3] = 255;
    }
  }
  rctx.putImageData(rimg, 0, 0);
  // Cracks: thin wandering dark lines, wrapped so the tile stays seamless.
  const r = rng(77);
  rctx.lineCap = 'round';
  for (let k = 0; k < 16; k++) {
    let px = r() * S;
    let py = r() * S;
    let ang = r() * Math.PI * 2;
    rctx.strokeStyle = `rgba(30,24,20,${0.18 + r() * 0.22})`;
    rctx.lineWidth = 0.6 + r() * 1.1;
    const steps = 8 + Math.floor(r() * 14);
    for (let s = 0; s < steps; s++) {
      const nx = px + Math.cos(ang) * 9;
      const ny = py + Math.sin(ang) * 9;
      for (const ox of [-S, 0, S]) {
        for (const oy of [-S, 0, S]) {
          rctx.beginPath();
          rctx.moveTo(px + ox, py + oy);
          rctx.lineTo(nx + ox, ny + oy);
          rctx.stroke();
        }
      }
      px = nx;
      py = ny;
      ang += (r() - 0.5) * 1.1;
    }
  }
  const rock = finish(rc, true);
  const rockNormal = normalFrom(height, S, 6);

  // Bark: long vertical fibres.
  const fib = fractalNoise(S, 21, 3, 5, 0.12);
  const knots = fractalNoise(S, 22, 4, 3);
  const barkH = new Float32Array(S * S);
  const [bc, bctx, bimg] = canvasOf(S);
  for (let i = 0; i < S * S; i++) {
    const h = fib[i] * 0.8 + knots[i] * 0.2;
    barkH[i] = h;
    const g = 120 + (h - 0.5) * 260;
    bimg.data[i * 4] = bimg.data[i * 4 + 1] = bimg.data[i * 4 + 2] = Math.max(40, Math.min(255, g));
    bimg.data[i * 4 + 3] = 255;
  }
  bctx.putImageData(bimg, 0, 0);
  const bark = finish(bc, true);
  const barkNormal = normalFrom(barkH, S, 9);

  // Barrel staves: u wraps around the barrel, v runs up it.
  const W = 512;
  const grain = fractalNoise(W, 31, 3, 5, 0.2);
  const stH = new Float32Array(W * W);
  const [sc, sctx, simg] = canvasOf(W);
  const staves = 16;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const u = (x / W) * staves;
      const f = u - Math.floor(u);
      const seam = Math.min(f, 1 - f) < 0.035 ? 1 : 0;
      const plank = Math.floor(u);
      const tone = 0.85 + ((plank * 37) % 11) / 55;
      const h = grain[i] * 0.6 + 0.4 - seam * 0.8;
      stH[i] = h;
      const g = (110 + grain[i] * 120) * tone * (seam ? 0.35 : 1);
      simg.data[i * 4] = Math.min(255, g * 1.0);
      simg.data[i * 4 + 1] = Math.min(255, g * 0.72);
      simg.data[i * 4 + 2] = Math.min(255, g * 0.48);
      simg.data[i * 4 + 3] = 255;
    }
  }
  sctx.putImageData(simg, 0, 0);
  const stavesTex = finish(sc, true);
  stavesTex.wrapT = RepeatWrapping;
  const stavesNormal = normalFrom(stH, W, 5);

  // Ice: faint frosty streaks.
  const iceN = fractalNoise(256, 41, 3, 5, 0.4);
  const [ic, ictx, iimg] = canvasOf(256);
  for (let i = 0; i < 256 * 256; i++) {
    const g = 200 + iceN[i] * 55;
    iimg.data[i * 4] = g;
    iimg.data[i * 4 + 1] = g;
    iimg.data[i * 4 + 2] = 255;
    iimg.data[i * 4 + 3] = 255;
  }
  ictx.putImageData(iimg, 0, 0);
  const ice = finish(ic, true);

  // Soft round sprite for dust and glows.
  const [softC, softCtx] = canvasOf(64);
  const g = softCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  softCtx.fillStyle = g;
  softCtx.fillRect(0, 0, 64, 64);
  const soft = new CanvasTexture(softC);
  soft.colorSpace = SRGBColorSpace;

  // Cloud puff: a cluster of soft blobs.
  const [cc, cctx] = canvasOf(256);
  const cr = rng(55);
  for (let k = 0; k < 22; k++) {
    const x = 50 + cr() * 156;
    const y = 90 + cr() * 70 - Math.abs(x - 128) * 0.25;
    const rad = 26 + cr() * 38;
    const gg = cctx.createRadialGradient(x, y, 0, x, y, rad);
    gg.addColorStop(0, 'rgba(255,255,255,0.55)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    cctx.fillStyle = gg;
    cctx.fillRect(0, 0, 256, 256);
  }
  const cloud = new CanvasTexture(cc);
  cloud.colorSpace = SRGBColorSpace;

  // Snowflake / raindrop dot.
  const [fc, fctx] = canvasOf(32);
  const fg = fctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  fg.addColorStop(0, 'rgba(255,255,255,1)');
  fg.addColorStop(0.3, 'rgba(255,255,255,0.9)');
  fg.addColorStop(1, 'rgba(255,255,255,0)');
  fctx.fillStyle = fg;
  fctx.fillRect(0, 0, 32, 32);
  const flake = new CanvasTexture(fc);
  flake.colorSpace = SRGBColorSpace;

  return { rock, rockNormal, bark, barkNormal, staves: stavesTex, stavesNormal, ice, soft, cloud, flake };
}
