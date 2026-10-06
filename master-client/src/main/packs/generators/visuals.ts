import { hexToRgb, jsonUiColor } from '@shared/hud'
import type { Settings } from '@shared/types'
import vanilla from '../vanilla/vanilla.json'
import { Canvas, type RGBA, mix, rgbaHex, rng, roundedPanel } from '../png'
import { type PackFiles, json, on } from './common'

type Json = Record<string, any>

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
const n = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d)
const r3 = (v: number): number => Math.round(v * 1000) / 1000

// ------------------------------------------------------------------ Fog
// A fog file with the same identifier replaces the vanilla one entirely, so each
// override is a copy of vanilla with only the "air" fog changed.
export function buildFog(s: Settings, files: PackFiles): void {
  if (!on(s, 'fog')) return
  const o = s.modules.fog.options
  for (const [file, entry] of Object.entries(vanilla.fogs as Record<string, { dimension: string; json: Json }>)) {
    const dim = entry.dimension
    if (o[`${dim}Enabled`] !== true) continue
    const fog = clone(entry.json)
    const air = fog['minecraft:fog_settings']?.distance?.air
    if (!air) continue
    const start = n(o[`${dim}Start`], air.fog_start)
    const end = Math.max(start + (dim === 'overworld' ? 0.01 : 1), n(o[`${dim}End`], air.fog_end))
    air.fog_start = r3(start)
    air.fog_end = r3(end)
    air.fog_color = String(o[`${dim}Color`] ?? air.fog_color).toUpperCase()
    files.set(`fogs/${file}`, json(fog))
  }
}

// ------------------------------------------------------------------ Hit particles
export function buildHitParticles(s: Settings, files: PackFiles): void {
  if (!on(s, 'hitparticles')) return
  const o = s.modules.hitparticles.options
  const size = n(o.size, 1)
  const amount = n(o.amount, 1)
  const tint = (hex: string): [number, number, number, number] => {
    const [r, g, b] = hexToRgb(hex)
    return [r3(r / 255), r3(g / 255), r3(b / 255), 1]
  }
  for (const [file, src] of Object.entries(vanilla.particles as Record<string, Json>)) {
    const p = clone(src)
    const c = p.particle_effect.components
    const color = file.startsWith('magic') ? String(o.magicColor ?? '#7cf2ff') : String(o.color ?? '#ffd84d')
    const [r, g, b, a] = tint(color)
    c['minecraft:particle_appearance_tinting'] = {
      color: {
        gradient: {
          '0.0': [`${r} * (0.85 + variable.particle_random_1 * 0.15)`, `${g} * (0.85 + variable.particle_random_2 * 0.15)`, `${b}`, a],
          '1.0': [r3(r * 0.7), r3(g * 0.7), r3(b * 0.7), a]
        },
        interpolant: 'variable.particle_age/variable.particle_lifetime'
      }
    }
    const bb = c['minecraft:particle_appearance_billboard']
    if (bb?.size) bb.size = bb.size.map((e: string | number) => `(${e}) * ${size}`)
    const steady = c['minecraft:emitter_rate_steady']
    if (steady) {
      steady.spawn_rate = Math.round(n(steady.spawn_rate, 520) * amount)
      steady.max_particles = `(${steady.max_particles}) * ${amount}`
    }
    const instant = c['minecraft:emitter_rate_instant']
    if (instant && amount !== 1) instant.num_particles = Math.max(1, Math.round(n(instant.num_particles, 1) * amount))
    files.set(`particles/${file}`, json(p))
  }
}

// ------------------------------------------------------------------ Hit colour
const PLAYER_RC = ['player.render_controllers.json']
const MOB_RC = [
  'zombie.render_controllers.json',
  'zombie.v2.render_controllers.json',
  'skeleton.render_controllers.json',
  'creeper.render_controllers.json',
  'spider.render_controllers.json',
  'enderman.render_controllers.json'
]

export function buildHitColor(s: Settings, files: PackFiles): void {
  if (!on(s, 'hitcolor')) return
  const o = s.modules.hitcolor.options
  const [r, g, b] = hexToRgb(String(o.color ?? '#3d7bff'))
  const hurt = { r: r3(r / 255), g: r3(g / 255), b: r3(b / 255), a: r3(n(o.opacity, 0.5)) }
  const targets = o.targets === 'all' ? [...PLAYER_RC, ...MOB_RC] : PLAYER_RC
  for (const file of targets) {
    const rc = clone((vanilla.renderControllers as Record<string, Json>)[file])
    for (const [id, ctrl] of Object.entries(rc.render_controllers as Record<string, Json>)) {
      // First-person and map controllers never flash; leave them as vanilla has them.
      if (id.endsWith('first_person') || id.endsWith('.map') || id.includes('spectator')) continue
      ctrl.is_hurt_color = hurt
    }
    files.set(`render_controllers/${file}`, json(rc))
  }
}

// ------------------------------------------------------------------ Projectile scale
const PROJECTILES: Record<string, string> = {
  arrow: 'arrow.entity.json',
  trident: 'thrown_trident.entity.json',
  pearl: 'ender_pearl.entity.json',
  snowball: 'snowball.entity.json',
  egg: 'egg.entity.json'
}

export function buildProjectiles(s: Settings, files: PackFiles): void {
  if (!on(s, 'projectiles')) return
  const o = s.modules.projectiles.options
  for (const [key, file] of Object.entries(PROJECTILES)) {
    const scale = n(o[key], 1)
    if (Math.abs(scale - 1) < 0.001) continue
    const e = clone((vanilla.entities as Record<string, Json>)[file])
    const desc = e['minecraft:client_entity'].description
    desc.scripts = { ...(desc.scripts ?? {}), scale: String(r3(scale)) }
    files.set(`entity/${file}`, json(e))
  }
}

// ------------------------------------------------------------------ View model
// Vanilla's breathing_bob is a small additive animation on the held item that
// plays in first person. Replacing it with the same bob plus fixed offsets moves
// the held item without touching any other animation.
export function buildViewModel(s: Settings, files: PackFiles): void {
  if (!on(s, 'viewmodel')) return
  const o = s.modules.viewmodel.options
  const x = n(o.x, 0)
  const y = n(o.y, 0)
  const z = n(o.z, 0)
  const scale = n(o.scale, 1)
  files.set(
    'animations/master_client_view_model.animation.json',
    json({
      format_version: '1.8.0',
      animations: {
        'animation.player.first_person.breathing_bob': {
          loop: true,
          override_previous_animation: false,
          bones: {
            rightitem: {
              position: [x, `${y} + variable.bob_animation * math.sin(q.life_time * 45.0) * 0.5`, z],
              rotation: [n(o.rx, 0), n(o.ry, 0), n(o.rz, 0)],
              scale: [scale, scale, scale]
            }
          }
        }
      }
    })
  )
}

// ------------------------------------------------------------------ Low fire
// Bedrock draws the on-screen fire (and fire on burning mobs) from
// textures/flame_atlas.png, a 16x512 strip of 32 frames. This paints an original
// flame animation, cut to the chosen height and faded to the chosen opacity.
export function flameAtlas(heightPct: number, opacityPct: number): Buffer {
  const frames = 32
  const c = new Canvas(16, 16 * frames)
  const height = Math.max(0.1, Math.min(1, heightPct / 100))
  const alpha = Math.max(0.1, Math.min(1, opacityPct / 100))
  const rand = rng(1337)
  const columns = Array.from({ length: 16 }, () => ({ phase: rand() * Math.PI * 2, amp: 0.25 + rand() * 0.35, base: 0.45 + rand() * 0.55 }))
  const hot: RGBA = [255, 246, 160, 255]
  const mid: RGBA = [255, 154, 30, 255]
  const cool: RGBA = [214, 54, 10, 255]
  for (let f = 0; f < frames; f++) {
    const t = (f / frames) * Math.PI * 2
    for (let x = 0; x < 16; x++) {
      const col = columns[x]
      const edge = 1 - Math.abs(x - 7.5) / 9
      const flame = Math.max(0, Math.min(1, (col.base + Math.sin(t * 2 + col.phase) * col.amp) * (0.55 + edge * 0.6)))
      const top = Math.round(16 * (1 - flame * height))
      for (let y = top; y < 16; y++) {
        const depth = (y - top) / Math.max(1, 16 - top)
        const color = depth < 0.35 ? mix(cool, mid, depth / 0.35) : mix(mid, hot, (depth - 0.35) / 0.65)
        const flicker = 0.85 + 0.15 * Math.sin(t * 3 + x + y)
        c.set(x, f * 16 + y, [color[0], color[1], color[2], Math.round(255 * alpha * flicker * Math.min(1, depth * 2 + 0.35))])
      }
    }
  }
  return c.toPng()
}

export function buildLowFire(s: Settings, files: PackFiles): void {
  if (!on(s, 'lowfire')) return
  const o = s.modules.lowfire.options
  files.set('textures/flame_atlas.png', flameAtlas(n(o.height, 40), n(o.opacity, 70)))
}

// ------------------------------------------------------------------ Crosshair
export function crosshairPng(rows: string[], hex: string): Buffer {
  const c = new Canvas(15, 15)
  const color = rgbaHex(hex, 1)
  rows.forEach((row, y) => [...row].forEach((ch, x) => ch === '#' && c.set(x, y, color)))
  return c.toPng()
}

export function buildCrosshair(s: Settings, files: PackFiles): void {
  if (!on(s, 'crosshair')) return
  const o = s.modules.crosshair.options
  if (o.customTexture !== true || !Array.isArray(o.pixels)) return
  files.set('textures/ui/cross_hair.png', crosshairPng(o.pixels as string[], String(o.textureColor ?? '#ffffff')))
}

// ------------------------------------------------------------------ Dark mode
// Replaces the light panel, slot and button textures with dark ones edged in the
// accent colour, at the same sizes and nineslice settings as vanilla, and lightens
// the text colours that were tuned for light panels.
export function buildDarkMode(s: Settings, files: PackFiles, globals: Record<string, unknown>): void {
  if (!on(s, 'darkmode')) return
  const o = s.modules.darkmode.options
  const accentHex = o.useAccent === false ? String(o.accent ?? '#7c5cff') : s.appearance.accent
  const accent = rgbaHex(accentHex, 1)
  const shade = n(o.shade, 0.85)
  const base: RGBA = [Math.round(52 * (1 - shade) + 14), Math.round(52 * (1 - shade) + 14), Math.round(58 * (1 - shade) + 18), 255]
  const raised = mix(base, [70, 70, 82, 255], 0.35)
  const edge = mix(base, accent, 0.55)

  const panel = (name: string, corner: number, radius: number, fill: RGBA, stroke: RGBA, border = 1) => {
    const t = roundedPanel({ corner, radius, border, fill, stroke })
    files.set(`textures/ui/${name}.png`, t.png)
    files.set(`textures/ui/${name}.json`, json(t.nineslice))
  }
  panel('dialog_background_opaque', 4, 2, base, edge)
  panel('dialog_background_opaque_overlap_bottom', 4, 2, base, edge)
  panel('button_borderless_light', 2, 1, raised, mix(raised, accent, 0.25))
  panel('button_borderless_lighthover', 2, 1, mix(raised, accent, 0.2), accent)
  panel('button_borderless_lightpressed', 2, 1, mix(base, accent, 0.45), accent)
  panel('button_borderless_lightpressednohover', 2, 1, mix(base, accent, 0.35), mix(base, accent, 0.7))
  panel('panel_outline', 2, 0, [0, 0, 0, 0], edge)

  // Inventory slot: recessed dark square.
  const slot = new Canvas(10, 10)
  slot.fill(mix(base, [0, 0, 0, 255], 0.35))
  slot.rect(0, 0, 10, 1, mix(base, [0, 0, 0, 255], 0.6))
  slot.rect(0, 0, 1, 10, mix(base, [0, 0, 0, 255], 0.6))
  slot.rect(0, 9, 10, 1, mix(base, accent, 0.3))
  slot.rect(9, 0, 1, 10, mix(base, accent, 0.3))
  files.set('textures/ui/cell_image.png', slot.toPng())
  files.set('textures/ui/cell_image.json', json({ nineslice_size: 1, base_size: [5, 5] }))

  const light: [number, number, number] = [0.86, 0.86, 0.9]
  for (const v of [
    '$light_button_default_text_color',
    '$light_button_locked_text_color',
    '$light_toggle_default_text_color',
    '$light_toggle_checked_default_text_color',
    '$title_text_color',
    '$pocket_title_text_color',
    '$tab_checked_text_color',
    '$dark_body_text_color'
  ]) {
    globals[v] = light
  }
  globals['$light_button_hover_text_color'] = jsonUiColor('#ffffff')
}

// ------------------------------------------------------------------ Full bright (Vibrant Visuals)
// Vibrant Visuals reads lighting/global.json from resource packs. Raising its
// ambient illuminance lifts the light level everywhere, caves and nights included.
export function buildFullBright(s: Settings, files: PackFiles): void {
  if (!on(s, 'fullbright')) return
  const o = s.modules.fullbright.options
  if (o.ambientBoost === false) return
  const lighting = clone(vanilla.lighting as Json)
  const ambient = lighting['minecraft:lighting_settings'].ambient
  ambient.illuminance = r3(Math.max(n(ambient.illuminance, 0.02), n(o.ambientLevel, 0.6)))
  ambient.color = '#FFFFFF'
  files.set('lighting/global.json', json(lighting))
}

export function buildVisuals(s: Settings, files: PackFiles, globals: Record<string, unknown>): void {
  buildFog(s, files)
  buildHitParticles(s, files)
  buildHitColor(s, files)
  buildProjectiles(s, files)
  buildViewModel(s, files)
  buildLowFire(s, files)
  buildCrosshair(s, files)
  buildDarkMode(s, files, globals)
  buildFullBright(s, files)
}
