// Draws the Master Client icon (original art) and writes build/icon.png,
// build/icon.ico (PNG-compressed entries, 16 to 256) and resources/icon.png.
import { mkdirSync, writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'

const M = ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##']

function draw(size) {
  const ss = 4
  const S = size * ss
  const big = new Float32Array(S * S * 4)
  const r = S * 0.22
  const top = [150, 120, 255]
  const bot = [76, 40, 200]
  const px = Math.floor(S / 12)
  const ox = Math.round((S - 7 * px) / 2)
  const oy = Math.round((S - 7 * px) / 2)
  const inGlyph = (x, y, dx = 0, dy = 0) => {
    const gx = Math.floor((x - ox - dx) / px)
    const gy = Math.floor((y - oy - dy) / px)
    return gx >= 0 && gy >= 0 && gx < 7 && gy < 7 && M[gy][gx] === '#'
  }
  const shadow = Math.max(1, Math.round(px * 0.18))
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = Math.max(r - x, 0, x - (S - 1 - r))
      const dy = Math.max(r - y, 0, y - (S - 1 - r))
      if (dx * dx + dy * dy > r * r) continue
      const t = (x * 0.35 + y) / (S * 1.35)
      let c = top.map((v, i) => v + (bot[i] - v) * t)
      // soft top highlight
      if (y < S * 0.5) c = c.map((v) => Math.min(255, v + (1 - y / (S * 0.5)) * 18))
      if (inGlyph(x, y, shadow, shadow)) c = c.map((v) => v * 0.55)
      if (inGlyph(x, y)) c = [255, 255, 255]
      const i = (y * S + x) * 4
      big[i] = c[0]; big[i + 1] = c[1]; big[i + 2] = c[2]; big[i + 3] = 255
    }
  }
  const png = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let R = 0, G = 0, B = 0, A = 0
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const i = ((y * ss + sy) * S + x * ss + sx) * 4
        const a = big[i + 3] / 255
        R += big[i] * a; G += big[i + 1] * a; B += big[i + 2] * a; A += a
      }
      const o = (y * size + x) * 4
      const n = ss * ss
      png.data[o] = A ? Math.round(R / A) : 0
      png.data[o + 1] = A ? Math.round(G / A) : 0
      png.data[o + 2] = A ? Math.round(B / A) : 0
      png.data[o + 3] = Math.round((A / n) * 255)
    }
  }
  return PNG.sync.write(png)
}

function ico(images) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  const dir = Buffer.alloc(16 * images.length)
  let offset = 6 + dir.length
  images.forEach(({ size, data }, i) => {
    const o = i * 16
    dir.writeUInt8(size >= 256 ? 0 : size, o)
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1)
    dir.writeUInt8(0, o + 2)
    dir.writeUInt8(0, o + 3)
    dir.writeUInt16LE(1, o + 4)
    dir.writeUInt16LE(32, o + 6)
    dir.writeUInt32LE(data.length, o + 8)
    dir.writeUInt32LE(offset, o + 12)
    offset += data.length
  })
  return Buffer.concat([header, dir, ...images.map((i) => i.data)])
}

mkdirSync('build', { recursive: true })
mkdirSync('resources', { recursive: true })
writeFileSync('build/icon.png', draw(512))
writeFileSync('resources/icon.png', draw(256))
writeFileSync('build/icon.ico', ico([16, 24, 32, 48, 64, 128, 256].map((size) => ({ size, data: draw(size) }))))
console.log('icons written')
