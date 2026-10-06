import { Home, LayoutDashboard, Minus, Newspaper, Puzzle, Settings, Sparkles, Square, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useApp, type Page } from '../lib/store'
import { cx } from './ui'

const NAV: { id: Page; label: string; icon: ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={18} /> },
  { id: 'hud', label: 'HUD', icon: <LayoutDashboard size={18} /> },
  { id: 'visuals', label: 'Visuals', icon: <Sparkles size={18} /> },
  { id: 'mods', label: 'Mods', icon: <Puzzle size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  { id: 'news', label: 'News', icon: <Newspaper size={18} /> }
]

export function TitleBar() {
  return (
    <div className="drag flex h-9 shrink-0 items-center justify-between border-b border-line bg-bg/80 pl-4 backdrop-blur">
      <div className="font-pixel text-sm tracking-wide text-muted">
        Master <span className="text-accent">Client</span>
      </div>
      <div className="no-drag flex h-full">
        <button onClick={() => window.mc.app.minimize()} className="flex w-11 items-center justify-center text-muted hover:bg-white/5 hover:text-ink" aria-label="Minimize">
          <Minus size={15} />
        </button>
        <button onClick={() => window.mc.app.toggleMaximize()} className="flex w-11 items-center justify-center text-muted hover:bg-white/5 hover:text-ink" aria-label="Maximize">
          <Square size={12} />
        </button>
        <button onClick={() => window.mc.app.close()} className="flex w-11 items-center justify-center text-muted hover:bg-red-500 hover:text-white" aria-label="Close">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const page = useApp((s) => s.page)
  const setPage = useApp((s) => s.setPage)
  const user = useApp((s) => s.user)
  return (
    <nav className="flex w-[78px] shrink-0 flex-col items-center gap-1 border-r border-line bg-panel/60 py-4">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent font-pixel text-xl text-white glow">M</div>
      {NAV.map((n) => {
        const active = page === n.id || (page === 'editor' && n.id === 'hud')
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={cx(
              'group relative flex w-16 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] transition-all duration-150',
              active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-white/5 hover:text-ink'
            )}
          >
            {active && <span className="absolute top-1/2 -left-[7px] h-6 w-1 -translate-y-1/2 rounded-r bg-accent" />}
            {n.icon}
            {n.label}
          </button>
        )
      })}
      <div className="mt-auto flex flex-col items-center gap-1 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold uppercase" title={user?.username}>
          {user?.username.slice(0, 1)}
        </div>
      </div>
    </nav>
  )
}
