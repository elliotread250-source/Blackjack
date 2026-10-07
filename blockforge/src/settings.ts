// Player-facing options, presets and persistence (localStorage, guarded).

export type Preset = 'low' | 'medium' | 'high' | 'custom';
export type ControlScheme = 'keyboard' | 'touch';
export type ShaderPack = 'off' | 'fancy' | 'ultra';
export type ResourcePackId = 'default' | 'smooth' | 'retro' | 'vivid' | 'pastel';

export interface Settings {
  controls: ControlScheme;  // 'keyboard' = keyboard + mouse (default), 'touch' = on-screen touch controls
  touchSensitivity: number; // 0.25..3, look speed for touch dragging (1 = default)
  touchButtonScale: number; // 0.75..1.5, size of the on-screen buttons
  preset: Preset;
  shaderPack: ShaderPack;   // off = cheap shading; fancy = sun shadows, waving plants, reflective water;
                            // ultra = fancy + bloom, god rays, volumetric fog, planar water reflections
  resourcePack: ResourcePackId; // built-in texture pack (see src/blocks/packs.ts)
  renderDistance: number;   // chunks, 2..12
  fov: number;              // degrees, 50..110
  sensitivity: number;      // 0.1..2 (1 = default)
  invertY: boolean;
  viewBobbing: boolean;
  brightness: number;       // 0 (moody) .. 1 (bright)
  fancyLeaves: boolean;     // see-through leaves (cutout) vs opaque fast leaves
  smoothLighting: boolean;  // per-vertex light + ambient occlusion
  shadows: boolean;         // derived from shaderPack (fancy/ultra); kept for older saved settings
  shadowQuality: 1024 | 2048;
  waving: boolean;          // derived from shaderPack (fancy/ultra)
  clouds: boolean;
  resolutionScale: number;  // 0.5..1, multiplied by min(devicePixelRatio, 2)
  mipmaps: boolean;
  guiScale: number;         // 2..4 CSS px per GUI pixel
  fullscreen: boolean;      // go fullscreen + keyboard lock when playing (stops Ctrl+W closing the tab)
  volume: number;           // 0..1
  showFps: boolean;
  maxFps: number;           // 0 = unlimited (vsync)
}

export const PRESETS: Record<Exclude<Preset, 'custom'>, Partial<Settings>> = {
  low: { renderDistance: 4, fancyLeaves: false, smoothLighting: true, shaderPack: 'off', clouds: true, resolutionScale: 1, mipmaps: true },
  medium: { renderDistance: 6, fancyLeaves: true, smoothLighting: true, shaderPack: 'fancy', shadowQuality: 1024, clouds: true, resolutionScale: 1, mipmaps: true },
  high: { renderDistance: 8, fancyLeaves: true, smoothLighting: true, shaderPack: 'ultra', shadowQuality: 2048, clouds: true, resolutionScale: 1, mipmaps: true },
};

export const DEFAULT_SETTINGS: Settings = {
  controls: 'keyboard',
  touchSensitivity: 1,
  touchButtonScale: 1,
  preset: 'low',
  shaderPack: 'off',
  resourcePack: 'default',
  renderDistance: 4,
  fov: 70,
  sensitivity: 1,
  invertY: false,
  viewBobbing: true,
  brightness: 0.5,
  fancyLeaves: false,
  smoothLighting: true,
  shadows: false,
  shadowQuality: 1024,
  waving: false,
  clouds: true,
  resolutionScale: 1,
  mipmaps: true,
  guiScale: 2,
  fullscreen: false,
  volume: 0.6,
  showFps: false,
  maxFps: 0,
};

const KEY = 'blockforge.settings.v1';

/** Keep the legacy shadows/waving flags in step with the shader pack. */
export function syncShaderFlags(s: Settings): Settings {
  s.shadows = s.shaderPack !== 'off';
  s.waving = s.shaderPack !== 'off';
  return s;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Settings>;
      const s = { ...DEFAULT_SETTINGS, ...saved };
      // Settings saved before shader packs existed: map the old toggles onto a pack.
      if (!saved.shaderPack) s.shaderPack = saved.shadows ? 'fancy' : saved.waving ? 'fancy' : 'off';
      return syncShaderFlags(s);
    }
  } catch { /* storage blocked: use defaults */ }
  return syncShaderFlags({ ...DEFAULT_SETTINGS });
}

/** Reset every option to its default, in place (the same object is shared by the whole game). */
export function restoreDefaults(s: Settings): Settings {
  for (const k of Object.keys(s) as (keyof Settings)[]) delete (s as unknown as Record<string, unknown>)[k];
  Object.assign(s, DEFAULT_SETTINGS);
  return syncShaderFlags(s);
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Apply a preset in place (keeps unrelated options like FOV and sensitivity). */
export function applyPreset(s: Settings, p: Exclude<Preset, 'custom'>): Settings {
  Object.assign(s, PRESETS[p]);
  s.preset = p;
  return syncShaderFlags(s);
}
