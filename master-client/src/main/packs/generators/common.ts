import type { HudPlacement, HudStyle, Settings } from '@shared/types'
import { activePlacements } from '@shared/settings'
import { MODULE_BY_ID } from '@shared/modules'
import { REFERENCE } from '@shared/hud'
import { roundedPanel, rgbaHex } from '../png'

export type PackFiles = Map<string, Buffer | string>

export const TEX_DIR = 'textures/master_client'

export function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function on(s: Settings, id: string): boolean {
  const def = MODULE_BY_ID[id]
  return !!def && def.available !== 'no' && s.modules[id]?.enabled === true
}

export function opt<T>(s: Settings, id: string, key: string): T {
  return s.modules[id]?.options[key] as T
}

export function placement(s: Settings, id: string): HudPlacement {
  const p = activePlacements(s)[id]
  if (p) return p
  const d = MODULE_BY_ID[id]?.hud?.defaultPos ?? { x: 0, y: 0, scale: 1 }
  return { ...d, style: { preset: 'default', font: 'minecraft', textColor: '#ffffff', bgColor: '#000000', bgOpacity: 0.45, borderWidth: 0, borderColor: '#ffffff', radius: 4, shadow: true } }
}

export function pct(fraction: number): string {
  return `${(Math.round(fraction * 10000) / 100).toString()}%`
}

/** Module box size (editor base size x scale) as a % of the 1920x1080 reference. */
export function boxSize(id: string, scale: number): [string, string] {
  const base = MODULE_BY_ID[id]?.hud?.base ?? { w: 100, h: 40 }
  return [pct((base.w * scale) / REFERENCE.w), pct((base.h * scale) / REFERENCE.h)]
}

/**
 * Editor pixels are 1080p screen pixels. Bedrock's UI is roughly 3 screen pixels
 * per UI pixel at 1080p on the default GUI scale, which is close enough for corner
 * radius and border width.
 */
export function toUiPx(screenPx: number): number {
  return Math.max(0, Math.round(screenPx / 3))
}

export function hasBackground(style: HudStyle): boolean {
  return style.bgOpacity > 0.001 || style.borderWidth > 0
}

/**
 * Writes a rounded, bordered nineslice texture for a module's background and
 * returns the JSON UI image element that uses it.
 */
export function backgroundImage(files: PackFiles, id: string, style: HudStyle, size: [string | number, string | number] = ['100%', '100%']): Record<string, unknown> {
  const radius = toUiPx(style.radius)
  const border = style.borderWidth > 0 ? Math.max(1, toUiPx(style.borderWidth)) : 0
  const corner = Math.max(2, radius, border + 1)
  const tex = roundedPanel({
    corner,
    radius,
    border,
    fill: rgbaHex(style.bgColor, style.bgOpacity),
    stroke: border > 0 ? rgbaHex(style.borderColor, 1) : rgbaHex(style.bgColor, style.bgOpacity)
  })
  const path = `${TEX_DIR}/bg_${id}`
  files.set(`${path}.png`, tex.png)
  files.set(`${path}.json`, json(tex.nineslice))
  return {
    [`mc_${id}_bg`]: {
      type: 'image',
      texture: path,
      size,
      layer: 0
    }
  }
}
