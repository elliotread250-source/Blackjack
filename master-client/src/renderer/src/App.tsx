import { useEffect, useState } from 'react'
import { Pin } from 'lucide-react'
import { applyTheme, connectStore, useApp } from './lib/store'
import { Sidebar, TitleBar } from './components/Shell'
import { ModuleDrawer } from './components/ModuleSettings'
import { Button, Modal } from './components/ui'
import { HudEditor } from './hud/HudEditor'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { ModulesPage } from './pages/Modules'
import { Mods } from './pages/Mods'
import { News } from './pages/News'
import { SettingsPage } from './pages/Settings'

function PinTip({ onClose }: { onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Pin size={18} className="text-accent" /> Pin Master Client to your taskbar
      </div>
      <p className="mt-3 text-sm text-muted">Windows doesn't let apps pin themselves, so here's the quick way:</p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
        <li>Find the Master Client icon on your taskbar while it's open (or in the Start menu).</li>
        <li>Right-click it.</li>
        <li>Choose "Pin to taskbar".</li>
      </ol>
      <Button variant="accent" className="mt-5 w-full" onClick={onClose}>
        Got it
      </Button>
    </Modal>
  )
}

export function App() {
  const ready = useApp((s) => s.ready)
  const user = useApp((s) => s.user)
  const settings = useApp((s) => s.settings)
  const page = useApp((s) => s.page)
  const openModule = useApp((s) => s.openModule)
  const setPage = useApp((s) => s.setPage)
  const setOpenModule = useApp((s) => s.setOpenModule)
  const update = useApp((s) => s.update)
  const [pinTip, setPinTip] = useState(false)

  useEffect(() => {
    const off = connectStore()
    void (async () => {
      const u = await window.mc.auth.session()
      if (u) {
        useApp.setState({ user: u, settings: await window.mc.settings.get() })
        setPinTip((await window.mc.app.firstRun()).showPinTip)
      }
      useApp.setState({ ready: true })
    })()
    return off
  }, [])

  useEffect(() => applyTheme(settings), [settings?.appearance])

  const onAuthed = async () => {
    const u = await window.mc.auth.session()
    useApp.setState({ user: u, settings: await window.mc.settings.get(), page: 'home' })
    setPinTip((await window.mc.app.firstRun()).showPinTip)
  }

  const logout = async () => {
    await window.mc.auth.logOut()
    useApp.setState({ user: null, settings: null, page: 'home', openModule: null })
    applyTheme(null)
  }

  if (!ready) return <div className="h-full bg-bg" />

  if (!user || !settings) {
    return (
      <div className="flex h-full flex-col">
        <Login onAuthed={() => void onAuthed()} />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto p-7">
          {update?.state === 'downloaded' && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm">
              Master Client {update.version} is ready to install.
              <Button variant="accent" onClick={() => void window.mc.app.installUpdate()}>
                Restart to update
              </Button>
            </div>
          )}
          {page === 'home' && <Home />}
          {page === 'hud' && <ModulesPage category="hud" />}
          {page === 'visuals' && <ModulesPage category="visuals" />}
          {page === 'mods' && <Mods />}
          {page === 'settings' && <SettingsPage onLogout={() => void logout()} />}
          {page === 'news' && <News />}
          {page === 'editor' && <HudEditor onClose={() => setPage('hud')} />}
        </main>
      </div>
      {openModule && <ModuleDrawer id={openModule} onClose={() => setOpenModule(null)} />}
      {pinTip && (
        <PinTip
          onClose={() => {
            setPinTip(false)
            void window.mc.app.dismissPinTip()
          }}
        />
      )}
    </div>
  )
}
