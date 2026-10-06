import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { REFERENCE } from '@shared/hud'
import type { MenuState, ZoomState } from '@shared/ipc'
import { MODULES } from '@shared/modules'
import { activePlacements } from '@shared/settings'
import { applyTheme, connectStore, useApp } from '../lib/store'
import { ModuleDrawer } from '../components/ModuleSettings'
import { HudEditor } from '../hud/HudEditor'
import { ModuleView, OverlayCrosshair } from '../hud/renderers'
import { Menu } from './Menu'
import { Zoom } from './Zoom'

const OVERLAY_HUD = MODULES.filter((m) => m.engines.includes('overlay') && m.hud?.onHud)

export function OverlayApp() {
  const settings = useApp((s) => s.settings)
  const metrics = useApp((s) => s.metrics)
  const openModule = useApp((s) => s.openModule)
  const [keys, setKeys] = useState<Set<string>>(new Set())
  const [menu, setMenu] = useState<MenuState>({ open: false, view: 'menu' })
  const [zoom, setZoom] = useState<ZoomState>({ active: false, level: 4 })
  const [banner, setBanner] = useState<string | null>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const offStore = connectStore()
    const load = async () => {
      const u = await window.mc.auth.session()
      useApp.setState({ user: u, settings: u ? await window.mc.settings.get() : null })
    }
    void load()
    const offs = [
      window.mc.overlay.onInput((e) =>
        setKeys((prev) => {
          const next = new Set(prev)
          if (e.down) next.add(e.key)
          else next.delete(e.key)
          return next
        })
      ),
      window.mc.overlay.onMenu((m) => {
        setMenu(m)
        if (m.open) void load()
        else useApp.setState({ openModule: null })
      }),
      window.mc.overlay.onZoom(setZoom),
      window.mc.overlay.onPackBanner((text) => setBanner(text))
    ]
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => {
      offStore()
      offs.forEach((off) => off())
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => applyTheme(settings), [settings?.appearance])

  useEffect(() => {
    if (!banner) return
    const t = setTimeout(() => setBanner(null), 6000)
    return () => clearTimeout(t)
  }, [banner])

  if (!settings) return null
  const placements = activePlacements(settings)
  const k = size.h / REFERENCE.h
  const editing = menu.open && menu.view === 'editor'
  const crosshair = settings.modules.crosshair
  return (
    <div className="fixed inset-0 overflow-hidden">
      {settings.modules.zoom.enabled && <Zoom zoom={zoom} settings={settings} />}
      {!editing &&
        OVERLAY_HUD.filter((m) => settings.modules[m.id]?.enabled).map((m) => {
          const p = placements[m.id]
          if (!p) return null
          return (
            <div
              key={m.id}
              className="pointer-events-none absolute origin-top-left"
              style={{ left: p.x * size.w, top: p.y * size.h, width: m.hud!.base.w, height: m.hud!.base.h, transform: `scale(${p.scale * k})` }}
            >
              <ModuleView id={m.id} settings={settings} metrics={metrics} keys={keys} style={p.style} preview={false} />
            </div>
          )
        })}
      {crosshair.enabled && crosshair.options.overlay === true && !editing && <OverlayCrosshair settings={settings} />}
      {banner && (
        <div className="page-enter pointer-events-none absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-accent/40 bg-black/80 px-4 py-2.5 text-sm text-white shadow-2xl backdrop-blur">
          <RefreshCw size={15} className="text-accent" />
          {banner}
        </div>
      )}
      {menu.open && menu.view === 'menu' && <Menu />}
      {editing && <HudEditor live keys={keys} onClose={() => void window.mc.overlay.closeMenu()} />}
      {menu.open && openModule && <ModuleDrawer id={openModule} onClose={() => useApp.setState({ openModule: null })} />}
    </div>
  )
}
