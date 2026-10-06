import { hexToRgb } from '@shared/hud'
import { Canvas, type RGBA, mix } from './png'

// Original pack icons: a pixel glyph on a rounded gradient tile in the accent colour.

const GLYPHS: Record<string, string[]> = {
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####']
}

export function glyphIcon(letter: string, accentHex: string, size = 128): Canvas {
  const c = new Canvas(size, size)
  const [r, g, b] = hexToRgb(accentHex)
  const top: RGBA = [Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40), 255]
  const bottom: RGBA = [Math.round(r * 0.45), Math.round(g * 0.45), Math.round(b * 0.45), 255]
  const radius = size * 0.18
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.max(radius - x, 0, x - (size - 1 - radius))
      const dy = Math.max(radius - y, 0, y - (size - 1 - radius))
      const d = Math.sqrt(dx * dx + dy * dy)
      if (d > radius) continue
      const edgeAlpha = Math.min(1, radius - d + 0.5)
      const col = mix(top, bottom, (x + y) / (size * 2))
      c.set(x, y, [col[0], col[1], col[2], Math.round(255 * edgeAlpha)])
    }
  }
  const rows = GLYPHS[letter] ?? GLYPHS.M
  const px = Math.floor(size / 11)
  const gw = 5 * px
  const gh = 7 * px
  const ox = Math.round((size - gw) / 2)
  const oy = Math.round((size - gh) / 2)
  const sh = Math.max(1, px >> 2)
  const cells: [number, number][] = []
  rows.forEach((row, gy) => [...row].forEach((ch, gx) => ch === '#' && cells.push([ox + gx * px, oy + gy * px])))
  // Drop shadow first, then the glyph on top.
  for (const [x0, y0] of cells) for (let yy = 0; yy < px; yy++) for (let xx = 0; xx < px; xx++) c.blend(x0 + sh + xx, y0 + sh + yy, [0, 0, 0, 90])
  for (const [x0, y0] of cells) c.rect(x0, y0, px, px, [255, 255, 255, 255])
  return c
}

export function packIconPng(accentHex: string, behaviour = false): Buffer {
  return glyphIcon(behaviour ? 'W' : 'M', accentHex).toPng()
}
