import { useEffect, useState } from 'react'
import { LayoutDashboard, Puzzle, X } from 'lucide-react'
import type { AddonInfo } from '@shared/ipc'
import { keyLabel } from '@shared/keys'
import { useApp } from '../lib/store'
import { ModuleGrid } from '../components/ModuleGrid'
import { Button, Toggle, cx } from '../components/ui'

type Tab = 'hud' | 'visuals' | 'mods'

function ModsTab() {
  const [addons, setAddons] = useState<AddonInfo[]>([])
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void window.mc.addons.list().then(setAddons)
  }, [])
  return (
    <div className="space-y-2">
      {error && <div className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{error}</div>}
      {addons.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-xl border border-line bg-panel p-3">
          {a.icon ? <img src={a.icon} alt="" className="h-10 w-10 rounded-lg" style={{ imageRendering: 'pixelated' }} /> : <Puzzle className="text-muted" />}
          <div className="min-w-0 flex-1">
            <div className="font-medium">{a.name}</div>
            <div className="truncate text-xs text-muted">{a.perWorld ? 'Behaviour pack: turn on per world' : a.description}</div>
          </div>
          <Toggle
            on={a.enabled}
            onChange={(v) =>
              void window.mc.addons
                .setEnabled(a.id, v)
                .then(setAddons)
                .catch((e: Error) => setError(e.message))
            }
            label={a.name}
          />
        </div>
      ))}
      <p className="pt-2 text-xs text-muted">Import new add-ons from the Mods page in the launcher.</p>
    </div>
  )
}

export function Menu() {
  const [tab, setTab] = useState<Tab>('hud')
  const settings = useApp((s) => s.settings)!
  const openModule = useApp((s) => s.openModule)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !useApp.getState().openModule) void window.mc.overlay.closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/55 backdrop-blur-sm" onMouseDown={() => !openModule && void window.mc.overlay.closeMenu()}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="page-enter flex h-[78vh] w-[min(1180px,88vw)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-panel/95 shadow-2xl"
      >
        <div className="flex items-center gap-4 border-b border-line px-6 py-4">
          <div className="font-pixel text-2xl">
            Master <span className="text-accent">Client</span>
          </div>
          <div className="ml-4 flex rounded-lg border border-line bg-black/20 p-1 text-sm">
            {(['hud', 'visuals', 'mods'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cx('rounded-md px-4 py-1.5 capitalize', tab === t ? 'bg-accent text-white' : 'text-muted hover:text-ink')}>
                {t === 'hud' ? 'HUD' : t}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="accent" onClick={() => void window.mc.overlay.openEditor()}>
              <LayoutDashboard size={15} /> Edit HUD Layout
            </Button>
            <button onClick={() => void window.mc.overlay.closeMenu()} className="rounded-md p-2 text-muted hover:bg-white/5 hover:text-ink" aria-label="Close menu">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{tab === 'mods' ? <ModsTab /> : <ModuleGrid key={tab} category={tab} compact columns={5} />}</div>
        <div className="border-t border-line px-6 py-2.5 text-xs text-muted">
          {keyLabel(settings.hotkeys.menu)} or Esc to close · Overlay modules change instantly · Pack modules apply when you rejoin
        </div>
      </div>
    </div>
  )
}
