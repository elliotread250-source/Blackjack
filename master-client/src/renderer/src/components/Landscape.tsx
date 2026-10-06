import { useEffect, useRef } from 'react'

// A procedurally drawn, blocky landscape for the hero and the HUD editor
// background. Original art: sky, pixel clouds, three parallax layers of hills.

function rand(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface LayerSpec {
  block: number
  base: number // fraction of height where the ground sits
  amp: number
  speed: number
  grass: string
  dirt: string
  stone: string
  shade: number
  trees: boolean
  seed: number
}

function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`
}

function drawLayer(w: number, h: number, l: LayerSpec): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const r = rand(l.seed)
  const cols = Math.ceil(w / l.block)
  const phase = r() * 100
  const heights: number[] = []
  for (let i = 0; i < cols; i++) {
    // Periodic over the strip so it tiles seamlessly.
    const t = (i / cols) * Math.PI * 2
    const v = Math.sin(t * 2 + phase) * 0.55 + Math.sin(t * 5 + phase * 1.7) * 0.3 + Math.sin(t * 11 + phase * 0.3) * 0.15
    heights.push(Math.round((h * l.base - v * h * l.amp) / l.block))
  }
  for (let i = 0; i < cols; i++) {
    const top = heights[i]
    for (let row = top; row * l.block < h; row++) {
      const depth = row - top
      const base = depth === 0 ? l.grass : depth < 3 ? l.dirt : l.stone
      const jitter = 0.9 + r() * 0.16
      g.fillStyle = shadeHex(base, l.shade * jitter)
      g.fillRect(i * l.block, row * l.block, l.block, l.block)
      if (depth === 0) {
        g.fillStyle = 'rgba(255,255,255,0.08)'
        g.fillRect(i * l.block, row * l.block, l.block, Math.max(1, l.block / 6))
      }
    }
    if (l.trees && r() < 0.07 && i > 1 && i < cols - 3) {
      const trunk = 3 + Math.floor(r() * 2)
      for (let k = 1; k <= trunk; k++) {
        g.fillStyle = shadeHex('#6b4a2b', l.shade)
        g.fillRect(i * l.block, (top - k) * l.block, l.block, l.block)
      }
      for (let dy = -2; dy <= 0; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) === 2 && dy === -2) continue
          g.fillStyle = shadeHex('#2f7d32', l.shade * (0.85 + r() * 0.25))
          g.fillRect((i + dx) * l.block, (top - trunk - 1 + dy) * l.block, l.block, l.block)
        }
      }
    }
  }
  return c
}

function drawClouds(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  const r = rand(42)
  const b = 12
  for (let n = 0; n < 9; n++) {
    const cx = Math.floor(r() * (w / b))
    const cy = Math.floor((0.05 + r() * 0.28) * (h / b))
    const len = 4 + Math.floor(r() * 9)
    for (let i = 0; i < len; i++) {
      const rows = i === 0 || i === len - 1 ? 1 : 2
      for (let j = 0; j < rows; j++) {
        g.fillStyle = j === rows - 1 && rows > 1 ? 'rgba(225,235,250,0.9)' : 'rgba(255,255,255,0.95)'
        g.fillRect(((cx + i) * b) % w, (cy + j) * b, b, b)
      }
    }
  }
  return c
}

export function Landscape({ animate = true, className, dim = 0 }: { animate?: boolean; className?: string; dim?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const g = canvas.getContext('2d')!
    let layers: { img: HTMLCanvasElement; speed: number }[] = []
    let clouds: HTMLCanvasElement | null = null
    let w = 0
    let h = 0
    let raf = 0
    const start = performance.now()

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      canvas.width = w
      canvas.height = h
      const stripW = w * 2
      const specs: LayerSpec[] = [
        { block: Math.max(6, h / 48), base: 0.58, amp: 0.1, speed: 4, grass: '#7fa7c9', dirt: '#6f93b3', stone: '#647f9b', shade: 1, trees: false, seed: 3 },
        { block: Math.max(9, h / 32), base: 0.7, amp: 0.12, speed: 10, grass: '#5d9e3a', dirt: '#7a5537', stone: '#6d6d74', shade: 0.75, trees: true, seed: 9 },
        { block: Math.max(14, h / 20), base: 0.86, amp: 0.1, speed: 22, grass: '#6cbf45', dirt: '#8a5f3c', stone: '#7b7b83', shade: 0.95, trees: true, seed: 27 }
      ]
      layers = specs.map((s) => ({ img: drawLayer(stripW, h, s), speed: s.speed }))
      clouds = drawClouds(stripW, h)
    }

    const frame = (now: number) => {
      const t = animate ? (now - start) / 1000 : 0
      const sky = g.createLinearGradient(0, 0, 0, h)
      sky.addColorStop(0, '#4f8fe6')
      sky.addColorStop(0.6, '#a9d3ff')
      sky.addColorStop(1, '#d9ecff')
      g.fillStyle = sky
      g.fillRect(0, 0, w, h)
      const sun = Math.max(24, h / 9)
      g.fillStyle = '#fff6c9'
      g.fillRect(w * 0.78, h * 0.12, sun, sun)
      g.fillStyle = 'rgba(255,246,201,0.25)'
      g.fillRect(w * 0.78 - sun * 0.25, h * 0.12 - sun * 0.25, sun * 1.5, sun * 1.5)
      const tile = (img: HTMLCanvasElement, speed: number) => {
        const off = (t * speed) % img.width
        g.drawImage(img, -off, 0)
        g.drawImage(img, img.width - off, 0)
      }
      if (clouds) tile(clouds, 6)
      for (const l of layers) tile(l.img, l.speed)
      if (dim > 0) {
        g.fillStyle = `rgba(0,0,0,${dim})`
        g.fillRect(0, 0, w, h)
      }
      if (animate) raf = requestAnimationFrame(frame)
    }

    build()
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => {
      build()
      if (!animate) frame(performance.now())
    })
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [animate, dim])
  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated' }} />
}
