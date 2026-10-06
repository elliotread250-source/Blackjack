import { PNG } from 'pngjs'
import { hexToRgb } from '@shared/hud'

export type RGBA = [number, number, number, number]

/** Tiny RGBA canvas for generating pack textures. Everything here is original art. */
export class Canvas {
  readonly data: Uint8ClampedArray

  constructor(
    readonly width: number,
    readonly height: number
  ) {
    this.data = new Uint8ClampedArray(width * height * 4)
  }

  set(x: number, y: number, c: RGBA): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    const i = (y * this.width + x) * 4
    this.data[i] = c[0]
    this.data[i + 1] = c[1]
    this.data[i + 2] = c[2]
    this.data[i + 3] = c[3]
  }

  /** Alpha-composite c over the existing pixel. */
  blend(x: number, y: number, c: RGBA): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    const i = (y * this.width + x) * 4
    const sa = c[3] / 255
    const da = this.data[i + 3] / 255
    const oa = sa + da * (1 - sa)
    if (oa <= 0) return
    for (let k = 0; k < 3; k++) this.data[i + k] = (c[k] * sa + this.data[i + k] * da * (1 - sa)) / oa
    this.data[i + 3] = oa * 255
  }

  fill(c: RGBA): void {
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) this.set(x, y, c)
  }

  rect(x0: number, y0: number, w: number, h: number, c: RGBA): void {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, c)
  }

  toPng(): Buffer {
    const png = new PNG({ width: this.width, height: this.height })
    png.data = Buffer.from(this.data.buffer, this.data.byteOffset, this.data.byteLength)
    return PNG.sync.write(png)
  }
}

export function rgbaHex(hex: string, alpha = 1): RGBA {
  const [r, g, b] = hexToRgb(hex)
  return [r, g, b, Math.round(Math.max(0, Math.min(1, alpha)) * 255)]
}

export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  return [0, 1, 2, 3].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGBA
}

/**
 * Rounded rectangle with a border, anti-aliased by supersampling. Used as a
 * nineslice background: `corner` is the nineslice size in UI pixels and the
 * image is drawn at `res` pixels per UI pixel so corners stay smooth.
 */
export function roundedPanel(opts: {
  corner: number
  radius: number
  border: number
  fill: RGBA
  stroke: RGBA
  res?: number
}): { png: Buffer; nineslice: { nineslice_size: number; base_size: [number, number] } } {
  const res = opts.res ?? 4
  const base = opts.corner * 2 + 2
  const size = base * res
  const c = new Canvas(size, size)
  const r = opts.radius * res
  const bw = opts.border * res
  const ss = 4
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = 0
      let inner = 0
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = x + (sx + 0.5) / ss
          const py = y + (sy + 0.5) / ss
          if (inRoundRect(px, py, 0, 0, size, size, r)) {
            inside++
            if (bw <= 0 || inRoundRect(px, py, bw, bw, size - bw * 2, size - bw * 2, Math.max(0, r - bw))) inner++
          }
        }
      }
      if (inside === 0) continue
      const total = ss * ss
      const fillCover = inner / total
      const strokeCover = (inside - inner) / total
      const out: RGBA = [0, 0, 0, 0]
      // Composite stroke and fill by coverage.
      const fa = (opts.fill[3] / 255) * fillCover
      const sa = (opts.stroke[3] / 255) * strokeCover
      const a = fa + sa
      if (a > 0) {
        for (let k = 0; k < 3; k++) out[k] = Math.round((opts.fill[k] * fa + opts.stroke[k] * sa) / a)
        out[3] = Math.round(Math.min(1, a) * 255)
      }
      c.set(x, y, out)
    }
  }
  return { png: c.toPng(), nineslice: { nineslice_size: opts.corner, base_size: [base, base] } }
}

function inRoundRect(px: number, py: number, x: number, y: number, w: number, h: number, r: number): boolean {
  if (px < x || py < y || px > x + w || py > y + h) return false
  const rr = Math.min(r, w / 2, h / 2)
  const cx = px < x + rr ? x + rr : px > x + w - rr ? x + w - rr : px
  const cy = py < y + rr ? y + rr : py > y + h - rr ? y + h - rr : py
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= rr * rr
}

/** Deterministic PRNG so generated textures (and therefore pack hashes) are stable. */
export function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
