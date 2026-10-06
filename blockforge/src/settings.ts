// Player-facing options, presets and persistence (localStorage, guarded).

export type Preset = 'low' | 'medium' | 'high' | 'custom';

export interface Settings {
  preset: Preset;
  renderDistance: number;   // chunks, 2..12
  fov: number;              // degrees, 50..110
  sensitivity: number;      // 0.1..2 (1 = default)
  invertY: boolean;
  viewBobbing: boolean;
  brightness: number;       // 0 (moody) .. 1 (bright)
  fancyLeaves: boolean;     // see-through leaves (cutout) vs opaque fast leaves
  smoothLighting: boolean;  // per-vertex light + ambient occlusion
  shadows: boolean;         // real-time sun shadow map
  shadowQuality: 1024 | 2048;
  waving: boolean;          // waving plants/leaves and water waves
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
  low: { renderDistance: 4, fancyLeaves: false, smoothLighting: true, shadows: false, waving: false, clouds: true, resolutionScale: 1, mipmaps: true },
  medium: { renderDistance: 6, fancyLeaves: true, smoothLighting: true, shadows: false, waving: true, clouds: true, resolutionScale: 1, mipmaps: true },
  high: { renderDistance: 8, fancyLeaves: true, smoothLighting: true, shadows: true, shadowQuality: 2048, waving: true, clouds: true, resolutionScale: 1, mipmaps: true },
};

export const DEFAULT_SETTINGS: Settings = {
  preset: 'low',
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

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* storage blocked: use defaults */ }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(s: Settings): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

/** Apply a preset in place (keeps unrelated options like FOV and sensitivity). */
export function applyPreset(s: Settings, p: Exclude<Preset, 'custom'>): Settings {
  Object.assign(s, PRESETS[p]);
  s.preset = p;
  return s;
}
