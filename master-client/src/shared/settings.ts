import { DEFAULT_STYLE, clamp } from './hud'
import { MODULES, MODULE_BY_ID, moduleDefaults } from './modules'
import type { HudPlacement, HudProfile, ModuleState, Settings } from './types'

export const DEFAULT_ACCENT = '#7c5cff'

export const ACCENTS = ['#7c5cff', '#3d7bff', '#18c6a3', '#5ad15a', '#ffb020', '#ff5d5d', '#ff4fa3', '#e8e8e8']

const DEFAULT_ON = new Set(['keystrokes', 'cps', 'fps', 'coords', 'crosshair'])

export function defaultPlacements(): Record<string, HudPlacement> {
  const out: Record<string, HudPlacement> = {}
  for (const m of MODULES) {
    if (!m.hud || !m.hud.onHud) continue
    out[m.id] = { ...m.hud.defaultPos, style: { ...DEFAULT_STYLE } }
  }
  return out
}

export function defaultProfile(id = 'default', name = 'Default'): HudProfile {
  return { id, name, placements: defaultPlacements() }
}

export function defaultModules(): Record<string, ModuleState> {
  const out: Record<string, ModuleState> = {}
  for (const m of MODULES) {
    out[m.id] = { enabled: m.available !== 'no' && DEFAULT_ON.has(m.id), options: moduleDefaults(m) }
  }
  return out
}

export function defaultSettings(): Settings {
  return {
    schema: 1,
    appearance: { accent: DEFAULT_ACCENT, theme: 'dark', reduceMotion: false },
    hotkeys: { menu: 'ShiftRight' },
    launcher: { startWithWindows: false, minimizeToTrayOnLaunch: true, closeToTray: false },
    game: { folderOverride: null, edition: 'release' },
    overlay: { enabled: true, displayId: null, showWhenGameNotRunning: false },
    server: { address: '', port: 19132 },
    modules: defaultModules(),
    hud: { activeProfile: 'default', profiles: { default: defaultProfile() }, grid: 8, snap: true, guides: true },
    addons: {},
    imported: []
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Deep merge where arrays and primitives from `patch` replace those in `base`. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : patch) as T
  const out: Record<string, unknown> = { ...base }
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue
    const cur = (base as Record<string, unknown>)[k]
    out[k] = isObj(cur) && isObj(v) ? deepMerge(cur, v) : v
  }
  return out as T
}

const HEX = /^#[0-9a-f]{6}$/i

function color(v: unknown, fallback: string): string {
  return typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : fallback
}

function num(v: unknown, fallback: number, lo = -Infinity, hi = Infinity): number {
  return typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str(v: unknown, fallback: string, max = 200): string {
  return typeof v === 'string' ? v.slice(0, max) : fallback
}

function sanitizePlacement(id: string, v: unknown): HudPlacement {
  const def = MODULE_BY_ID[id]
  const d = def?.hud?.defaultPos ?? { x: 0.1, y: 0.1, scale: 1 }
  const p = isObj(v) ? v : {}
  const s = isObj(p.style) ? p.style : {}
  const fonts = ['minecraft', 'smooth', 'ten', 'mono']
  return {
    x: num(p.x, d.x, 0, 1),
    y: num(p.y, d.y, 0, 1),
    scale: num(p.scale, d.scale, def?.hud?.minScale ?? 0.25, def?.hud?.maxScale ?? 4),
    style: {
      preset: str(s.preset, DEFAULT_STYLE.preset, 40),
      font: (fonts.includes(s.font as string) ? s.font : DEFAULT_STYLE.font) as HudPlacement['style']['font'],
      textColor: color(s.textColor, DEFAULT_STYLE.textColor),
      bgColor: color(s.bgColor, DEFAULT_STYLE.bgColor),
      bgOpacity: num(s.bgOpacity, DEFAULT_STYLE.bgOpacity, 0, 1),
      borderWidth: Math.round(num(s.borderWidth, DEFAULT_STYLE.borderWidth, 0, 6)),
      borderColor: color(s.borderColor, DEFAULT_STYLE.borderColor),
      radius: Math.round(num(s.radius, DEFAULT_STYLE.radius, 0, 24)),
      shadow: bool(s.shadow, DEFAULT_STYLE.shadow)
    }
  }
}

function sanitizeProfile(id: string, v: unknown): HudProfile {
  const p = isObj(v) ? v : {}
  const placements = isObj(p.placements) ? p.placements : {}
  const base = defaultPlacements()
  for (const key of Object.keys(base)) base[key] = sanitizePlacement(key, placements[key])
  return { id, name: str(p.name, id, 40) || id, placements: base }
}

function sanitizeOptions(id: string, v: unknown): Record<string, unknown> {
  const def = MODULE_BY_ID[id]
  const defaults = def ? moduleDefaults(def) : {}
  if (!def || !isObj(v)) return defaults
  for (const o of def.options) {
    const val = v[o.key]
    switch (o.type) {
      case 'toggle':
        defaults[o.key] = bool(val, o.default)
        break
      case 'slider':
        defaults[o.key] = num(val, o.default, o.min, o.max)
        break
      case 'color':
        defaults[o.key] = color(val, o.default)
        break
      case 'select':
        defaults[o.key] = o.choices.some((c) => c.value === val) ? val : o.default
        break
      case 'key':
      case 'text':
        defaults[o.key] = str(val, o.default, 64)
        break
      case 'pixels':
        defaults[o.key] =
          Array.isArray(val) && val.length === 15 && val.every((r) => typeof r === 'string' && /^[.#]{15}$/.test(r)) ? [...val] : [...o.default]
        break
      case 'heading':
        break
    }
  }
  return defaults
}

/**
 * Turns anything (an old settings file, an imported export, a partial object) into
 * a complete, valid Settings. Unknown keys are dropped and every value is clamped.
 */
export function sanitizeSettings(input: unknown): Settings {
  const d = defaultSettings()
  const v = isObj(input) ? input : {}
  const ap = isObj(v.appearance) ? v.appearance : {}
  const hk = isObj(v.hotkeys) ? v.hotkeys : {}
  const la = isObj(v.launcher) ? v.launcher : {}
  const ga = isObj(v.game) ? v.game : {}
  const ov = isObj(v.overlay) ? v.overlay : {}
  const sv = isObj(v.server) ? v.server : {}
  const mo = isObj(v.modules) ? v.modules : {}
  const hu = isObj(v.hud) ? v.hud : {}
  const ad = isObj(v.addons) ? v.addons : {}

  const modules: Settings['modules'] = {}
  for (const m of MODULES) {
    const cur = isObj(mo[m.id]) ? (mo[m.id] as Record<string, unknown>) : {}
    modules[m.id] = {
      enabled: m.available === 'no' ? false : bool(cur.enabled, d.modules[m.id].enabled),
      options: sanitizeOptions(m.id, cur.options)
    }
  }

  const profiles: Settings['hud']['profiles'] = {}
  const rawProfiles = isObj(hu.profiles) ? hu.profiles : {}
  for (const [id, p] of Object.entries(rawProfiles).slice(0, 50)) {
    const safeId = id.replace(/[^a-z0-9_-]/gi, '').slice(0, 40)
    if (safeId) profiles[safeId] = sanitizeProfile(safeId, p)
  }
  if (!profiles.default) profiles.default = defaultProfile()
  const active = typeof hu.activeProfile === 'string' && profiles[hu.activeProfile] ? hu.activeProfile : 'default'

  const addons: Settings['addons'] = {}
  for (const [id, a] of Object.entries(ad)) {
    if (isObj(a) && /^[a-z0-9_-]{1,64}$/i.test(id)) addons[id] = { enabled: bool(a.enabled, false) }
  }

  const imported = Array.isArray(v.imported)
    ? v.imported
        .filter(isObj)
        .filter((p) => typeof p.id === 'string' && typeof p.folder === 'string')
        .map((p) => ({
          id: str(p.id, '', 64),
          name: str(p.name, 'Imported pack', 80),
          description: str(p.description, '', 300),
          type: (p.type === 'data' ? 'data' : 'resources') as 'data' | 'resources',
          uuid: str(p.uuid, '', 40),
          version: str(p.version, '1.0.0', 20),
          folder: str(p.folder, '', 120),
          importedAt: num(p.importedAt, Date.now()),
          hasScripts: bool(p.hasScripts, false)
        }))
    : []

  return {
    schema: 1,
    appearance: {
      accent: color(ap.accent, d.appearance.accent),
      theme: (['dark', 'midnight', 'oled'].includes(ap.theme as string) ? ap.theme : 'dark') as Settings['appearance']['theme'],
      reduceMotion: bool(ap.reduceMotion, false)
    },
    hotkeys: { menu: str(hk.menu, d.hotkeys.menu, 40) || d.hotkeys.menu },
    launcher: {
      startWithWindows: bool(la.startWithWindows, d.launcher.startWithWindows),
      minimizeToTrayOnLaunch: bool(la.minimizeToTrayOnLaunch, d.launcher.minimizeToTrayOnLaunch),
      closeToTray: bool(la.closeToTray, d.launcher.closeToTray)
    },
    game: {
      folderOverride: typeof ga.folderOverride === 'string' && ga.folderOverride.trim() ? ga.folderOverride.slice(0, 500) : null,
      edition: ga.edition === 'preview' ? 'preview' : 'release'
    },
    overlay: {
      enabled: bool(ov.enabled, true),
      displayId: typeof ov.displayId === 'number' ? ov.displayId : null,
      showWhenGameNotRunning: bool(ov.showWhenGameNotRunning, false)
    },
    server: {
      address: str(sv.address, '', 253).trim(),
      port: Math.round(num(sv.port, 19132, 1, 65535))
    },
    modules,
    hud: {
      activeProfile: active,
      profiles,
      grid: Math.round(num(hu.grid, 8, 2, 64)),
      snap: bool(hu.snap, true),
      guides: bool(hu.guides, true)
    },
    addons,
    imported
  }
}

export function activePlacements(s: Settings): Record<string, HudPlacement> {
  return (s.hud.profiles[s.hud.activeProfile] ?? s.hud.profiles.default).placements
}

export const EXPORT_KIND = 'master-client-settings'

export interface SettingsExport {
  kind: typeof EXPORT_KIND
  exportedAt: string
  appVersion: string
  settings: Settings
}
