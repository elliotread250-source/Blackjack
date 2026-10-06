import type { FontId, HudStyle, StyleSupport } from './types'

export const REFERENCE = { w: 1920, h: 1080 }

export const FONTS: { id: FontId; label: string; css: string; jsonUi: string }[] = [
  { id: 'minecraft', label: 'Minecraft (pixel)', css: "'Pixelify Sans', 'Inter', sans-serif", jsonUi: 'default' },
  { id: 'smooth', label: 'Smooth', css: "'Inter', system-ui, sans-serif", jsonUi: 'smooth' },
  { id: 'ten', label: 'Minecraft Ten', css: "'Pixelify Sans', 'Inter', sans-serif", jsonUi: 'MinecraftTen' },
  { id: 'mono', label: 'Monospace', css: "ui-monospace, 'Cascadia Mono', Consolas, monospace", jsonUi: 'default' }
]

export function fontCss(id: FontId): string {
  return (FONTS.find((f) => f.id === id) ?? FONTS[0]).css
}

export function fontJsonUi(id: FontId): string {
  return (FONTS.find((f) => f.id === id) ?? FONTS[0]).jsonUi
}

export const DEFAULT_STYLE: HudStyle = {
  preset: 'default',
  font: 'minecraft',
  textColor: '#ffffff',
  bgColor: '#000000',
  bgOpacity: 0.45,
  borderWidth: 0,
  borderColor: '#ffffff',
  radius: 4,
  shadow: true
}

export const STYLE_PRESETS: { id: string; label: string; style: Omit<HudStyle, 'preset'> }[] = [
  { id: 'default', label: 'Default', style: { ...DEFAULT_STYLE } },
  {
    id: 'minimal',
    label: 'Minimal',
    style: { ...DEFAULT_STYLE, bgOpacity: 0, radius: 0, shadow: true }
  },
  {
    id: 'glass',
    label: 'Glass',
    style: { ...DEFAULT_STYLE, font: 'smooth', bgColor: '#ffffff', bgOpacity: 0.12, borderWidth: 1, borderColor: '#ffffff', radius: 8, shadow: false }
  },
  {
    id: 'retro',
    label: 'Retro',
    style: { ...DEFAULT_STYLE, bgOpacity: 0.7, borderWidth: 2, borderColor: '#5a5a5a', radius: 0, shadow: true }
  },
  {
    id: 'outline',
    label: 'Outline',
    style: { ...DEFAULT_STYLE, font: 'smooth', bgOpacity: 0.2, borderWidth: 2, borderColor: '#7c5cff', radius: 6, shadow: false }
  },
  {
    id: 'bold',
    label: 'Bold',
    style: { ...DEFAULT_STYLE, font: 'ten', textColor: '#ffe14d', bgOpacity: 0.6, radius: 2, shadow: true }
  }
]

export const ALL_STYLE: StyleSupport = { font: true, textColor: true, background: true, border: true, radius: true, shadow: true }
export const BG_ONLY: StyleSupport = { font: false, textColor: false, background: true, border: true, radius: true, shadow: false }
export const TEXT_ONLY: StyleSupport = { font: true, textColor: true, background: false, border: false, radius: false, shadow: true }
export const NO_STYLE: StyleSupport = { font: false, textColor: false, background: false, border: false, radius: false, shadow: false }

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return [255, 255, 255]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

/** JSON UI colours are 0..1 floats. */
export function jsonUiColor(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex)
  return [round3(r / 255), round3(g / 255), round3(b / 255)]
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}
