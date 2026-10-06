import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, FolderOpen, Keyboard, LayoutDashboard, Loader2, Package, Play, RefreshCw } from 'lucide-react'
import { MODULES } from '@shared/modules'
import { keyLabel } from '@shared/keys'
import { PACK_BANNER } from '@shared/ipc'
import { useApp } from '../lib/store'
import { ModuleIcon } from '../lib/icons'
import { Landscape } from '../components/Landscape'
import { Banner, Button, Card, cx } from '../components/ui'

export function Home() {
  const settings = useApp((s) => s.settings)!
  const bedrock = useApp((s) => s.bedrock)
  const packResult = useApp((s) => s.packResult)
  const metrics = useApp((s) => s.metrics)
  const refreshBedrock = useApp((s) => s.refreshBedrock)
  const setPage = useApp((s) => s.setPage)
  const setOpenModule = useApp((s) => s.setOpenModule)
  const [launching, setLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [user] = useState(() => useApp.getState().user)

  useEffect(() => {
    void refreshBedrock()
  }, [refreshBedrock])

  const play = async () => {
    setLaunching(true)
    setLaunchError(null)
    const r = await window.mc.bedrock.launch()
    setTimeout(() => setLaunching(false), 2500)
    if (!r.ok) {
      setLaunching(false)
      setLaunchError(r.error ?? 'Minecraft did not start.')
    }
  }

  const enabled = MODULES.filter((m) => settings.modules[m.id]?.enabled && m.available !== 'no')
  const running = metrics?.gameRunning || bedrock?.running
  const statusLine = !bedrock
    ? 'Checking for Minecraft…'
    : bedrock.installed
      ? `Minecraft${bedrock.edition === 'preview' ? ' Preview' : ''} for Windows${bedrock.layout === 'gdk' ? ' (GDK)' : bedrock.layout === 'uwp' ? ' (UWP)' : ''} ${running ? 'is running' : 'is ready'}`
      : bedrock.platformSupported
        ? "Minecraft for Windows isn't installed"
        : 'Preview mode: Minecraft runs on Windows only'

  return (
    <div className="page-enter space-y-6">
      <section className="relative h-[340px] overflow-hidden rounded-2xl border border-line">
        <Landscape className="absolute inset-0 h-full w-full scale-105 blur-[2px]" animate={!settings.appearance.reduceMotion} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-8">
          <div className="text-xs font-semibold tracking-[0.3em] text-white/70 uppercase">Welcome back, {user?.username}</div>
          <h1 className="mt-2 font-pixel text-5xl leading-none text-white drop-shadow-lg">
            Master <span className="text-accent">Client</span>
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
            {bedrock?.installed ? <CheckCircle2 size={15} className="text-good" /> : <AlertTriangle size={15} className="text-warn" />}
            {statusLine}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => void play()}
              disabled={launching}
              className={cx(
                'glow group flex h-16 items-center gap-3 rounded-2xl bg-accent px-12 font-pixel text-3xl tracking-wider text-white transition-all duration-200 hover:scale-[1.03] hover:brightness-110 active:scale-[0.99] disabled:opacity-80',
                launching && 'animate-pulse'
              )}
            >
              {launching ? <Loader2 className="animate-spin" size={26} /> : <Play size={26} fill="currentColor" />}
              {launching ? 'LAUNCHING' : 'PLAY'}
            </button>
            <Button variant="default" className="h-16 rounded-2xl border-white/15 bg-black/30 px-5 text-white backdrop-blur hover:bg-black/50" onClick={() => setPage('editor')}>
              <LayoutDashboard size={18} /> Edit HUD
            </Button>
          </div>
        </div>
      </section>

      {launchError && (
        <Banner tone="bad" onClose={() => setLaunchError(null)}>
          <div className="font-semibold">Couldn't start Minecraft</div>
          <div className="mt-1 text-xs text-muted">{launchError}</div>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => void refreshBedrock(true)}>
              <RefreshCw size={14} /> Check again
            </Button>
            <Button onClick={() => setPage('settings')}>Set the game folder</Button>
          </div>
        </Banner>
      )}

      {packResult && !packResult.ok && (
        <Banner tone="warn">
          <div className="font-semibold">Pack not written</div>
          <div className="mt-1 text-xs text-muted">{packResult.error}</div>
        </Banner>
      )}
      {packResult?.ok && packResult.changed && (
        <Banner tone="info">
          <div className="font-semibold">{PACK_BANNER}</div>
          <div className="mt-1 text-xs text-muted">
            Master Client pack v{packResult.version.join('.')} is installed. Some servers force their own packs, which can override these.
            {packResult.warnings.map((w) => (
              <div key={w} className="mt-1 text-warn">
                {w}
              </div>
            ))}
          </div>
        </Banner>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Keyboard size={15} /> Overlay menu
          </div>
          <div className="mt-2 font-pixel text-2xl">{settings.hotkeys.menu.split('+').map(keyLabel).join(' + ')}</div>
          <div className="mt-1 text-xs text-muted">Opens the module menu over the game. Minecraft needs to be borderless or windowed.</div>
          <Button className="mt-3" onClick={() => void window.mc.overlay.toggleMenu()} disabled={!settings.overlay.enabled}>
            Open it now
          </Button>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Package size={15} /> Master Client pack
          </div>
          <div className="mt-2 font-pixel text-2xl">{packResult?.ok ? `v${packResult.version.join('.')}` : 'n/a'}</div>
          <div className="mt-1 text-xs text-muted">Generated from your HUD and Visuals settings into Minecraft's development packs.</div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => void window.mc.packs.apply().then((r) => useApp.setState({ packResult: r }))}>Apply now</Button>
            <Button variant="ghost" onClick={() => void window.mc.bedrock.openFolder('devRp')} disabled={!bedrock?.sharedRoot}>
              <FolderOpen size={14} />
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Live</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {[
              ['FPS', metrics?.fps ?? '--'],
              ['Ping', metrics?.ping != null ? `${metrics.ping}` : '--'],
              ['CPS', metrics ? metrics.cpsLeft : '--']
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-white/5 py-2">
                <div className="font-pixel text-xl tabular-nums">{v}</div>
                <div className="text-[10px] tracking-wider text-muted uppercase">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-muted">{running ? 'Minecraft is running.' : 'Start Minecraft to see live numbers.'}</div>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide">Active modules ({enabled.length})</h2>
          <button className="text-xs text-accent hover:underline" onClick={() => setPage('hud')}>
            Manage
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {enabled.map((m) => (
            <button key={m.id} onClick={() => setOpenModule(m.id)} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm hover:border-white/20">
              <ModuleIcon name={m.icon} size={14} className="text-accent" />
              {m.name}
            </button>
          ))}
          {enabled.length === 0 && <div className="text-sm text-muted">Nothing on yet. Head to HUD or Visuals.</div>}
        </div>
      </section>
    </div>
  )
}
