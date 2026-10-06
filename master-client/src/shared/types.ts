// Types shared by the main process, the preload bridge and both renderer pages.

export type Engine = 'pack' | 'overlay' | 'vanilla' | 'behavior' | 'none'
export type Category = 'hud' | 'visuals'
export type Availability = 'yes' | 'partial' | 'no'

export type FontId = 'minecraft' | 'smooth' | 'ten' | 'mono'

export interface HudStyle {
  preset: string
  font: FontId
  textColor: string
  bgColor: string
  bgOpacity: number
  borderWidth: number
  borderColor: string
  radius: number
  shadow: boolean
}

/** What a module's style panel can actually change. Unsupported controls are shown disabled. */
export interface StyleSupport {
  font: boolean
  textColor: boolean
  background: boolean
  border: boolean
  radius: boolean
  shadow: boolean
}

export interface HudPlacement {
  /** Left edge as a fraction of screen width (0..1). */
  x: number
  /** Top edge as a fraction of screen height (0..1). */
  y: number
  scale: number
  style: HudStyle
}

export interface HudProfile {
  id: string
  name: string
  placements: Record<string, HudPlacement>
}

interface OptionBase {
  key: string
  label: string
  help?: string
  /** Only show this option when another option has a given value. */
  showIf?: { key: string; equals: unknown }
}

export type OptionDef =
  | (OptionBase & { type: 'toggle'; default: boolean })
  | (OptionBase & { type: 'slider'; default: number; min: number; max: number; step: number; unit?: string; format?: 'time' | 'percent' })
  | (OptionBase & { type: 'color'; default: string })
  | (OptionBase & { type: 'select'; default: string; choices: { value: string; label: string }[] })
  | (OptionBase & { type: 'key'; default: string })
  | (OptionBase & { type: 'text'; default: string; placeholder?: string })
  | (OptionBase & { type: 'pixels'; default: string[] })
  | (OptionBase & { type: 'heading' })

export interface HudSpec {
  /** False for modules that restyle something with no position of its own (player list, stack counts). */
  onHud: boolean
  movable: boolean
  resizable: boolean
  /** Box size in a 1920x1080 reference at scale 1. */
  base: { w: number; h: number }
  defaultPos: { x: number; y: number; scale: number }
  minScale: number
  maxScale: number
  style: StyleSupport
  /** Shown next to the size slider when it's disabled or means something specific. */
  sizeNote?: string
}

export interface VanillaLink {
  setting: string
  steps: string
}

export interface ModuleDef {
  id: string
  name: string
  category: Category
  engines: Engine[]
  available: Availability
  /** Why it's unavailable, or which part is. One line. */
  reason?: string
  description: string
  icon: string
  options: OptionDef[]
  hud?: HudSpec
  vanilla?: VanillaLink
  ownWorldsOnly?: boolean
  /** Extra label shown on the module, e.g. "Server ping (external)". */
  badge?: string
  /** Shown under the description; things worth knowing before turning it on. */
  note?: string
  defaultEnabled?: boolean
}

export interface ModuleState {
  enabled: boolean
  options: Record<string, unknown>
}

export interface ImportedPack {
  id: string
  name: string
  description: string
  type: 'resources' | 'data'
  uuid: string
  version: string
  folder: string
  importedAt: number
  hasScripts: boolean
}

export interface Settings {
  schema: 1
  appearance: {
    accent: string
    theme: 'dark' | 'midnight' | 'oled'
    reduceMotion: boolean
  }
  hotkeys: {
    /** uiohook key name (e.g. "ShiftRight") or an Electron accelerator (e.g. "Alt+M"). */
    menu: string
  }
  launcher: {
    startWithWindows: boolean
    minimizeToTrayOnLaunch: boolean
    closeToTray: boolean
  }
  game: {
    folderOverride: string | null
    edition: 'release' | 'preview'
  }
  overlay: {
    enabled: boolean
    displayId: number | null
    showWhenGameNotRunning: boolean
  }
  server: {
    address: string
    port: number
  }
  modules: Record<string, ModuleState>
  hud: {
    activeProfile: string
    profiles: Record<string, HudProfile>
    grid: number
    snap: boolean
    guides: boolean
  }
  addons: Record<string, { enabled: boolean }>
  imported: ImportedPack[]
}

export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T
