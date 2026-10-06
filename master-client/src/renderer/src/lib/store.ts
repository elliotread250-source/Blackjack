import { create } from 'zustand'
import type { AuthUser, BedrockStatus, Metrics, PackApplyResult, UpdateStatus } from '@shared/ipc'
import { deepMerge } from '@shared/settings'
import type { DeepPartial, HudPlacement, ModuleState, Settings } from '@shared/types'

export type Page = 'home' | 'hud' | 'visuals' | 'mods' | 'settings' | 'news' | 'editor'

interface AppState {
  ready: boolean
  user: AuthUser | null
  settings: Settings | null
  metrics: Metrics | null
  bedrock: BedrockStatus | null
  packResult: PackApplyResult | null
  update: UpdateStatus | null
  page: Page
  openModule: string | null
  setPage(p: Page): void
  setOpenModule(id: string | null): void
  setUser(u: AuthUser | null): void
  setSettings(s: Settings | null): void
  patch(p: DeepPartial<Settings>): void
  setModule(id: string, m: DeepPartial<ModuleState>): void
  setPlacement(id: string, p: DeepPartial<HudPlacement>): void
  refreshBedrock(refresh?: boolean): Promise<void>
}

// Settings changes show instantly and reach the main process at most every
// 120ms, merged, so dragging a slider doesn't write the file dozens of times.
let pending: DeepPartial<Settings> | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function flush(): void {
  timer = null
  const p = pending
  pending = null
  if (p) void window.mc.settings.update(p)
}

export const useApp = create<AppState>((set, get) => ({
  ready: false,
  user: null,
  settings: null,
  metrics: null,
  bedrock: null,
  packResult: null,
  update: null,
  page: 'home',
  openModule: null,
  setPage: (page) => set({ page, openModule: null }),
  setOpenModule: (openModule) => set({ openModule }),
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings: settings && pending ? deepMerge(settings, pending) : settings }),
  patch: (p) => {
    const cur = get().settings
    if (!cur) return
    set({ settings: deepMerge(cur, p) })
    pending = pending ? deepMerge(pending, p) : p
    if (!timer) timer = setTimeout(flush, 120)
  },
  setModule: (id, m) => get().patch({ modules: { [id]: m } }),
  setPlacement: (id, p) => {
    const s = get().settings
    if (!s) return
    get().patch({ hud: { profiles: { [s.hud.activeProfile]: { placements: { [id]: p } } } } })
  },
  refreshBedrock: async (refresh = false) => set({ bedrock: await window.mc.bedrock.status(refresh) })
}))

/** Wires main-process events into the store. Call once per page. */
export function connectStore(): () => void {
  const offs = [
    window.mc.settings.onChange((s) => useApp.getState().setSettings(s)),
    window.mc.overlay.onMetrics((m) => useApp.setState({ metrics: m })),
    window.mc.packs.onApplied((r) => useApp.setState({ packResult: r })),
    window.mc.app.onUpdate((u) => useApp.setState({ update: u }))
  ]
  return () => offs.forEach((off) => off())
}

export function applyTheme(s: Settings | null): void {
  const root = document.documentElement
  root.style.setProperty('--mc-accent', s?.appearance.accent ?? '#7c5cff')
  root.dataset.theme = s?.appearance.theme ?? 'dark'
  root.classList.toggle('reduce-motion', s?.appearance.reduceMotion === true)
}
