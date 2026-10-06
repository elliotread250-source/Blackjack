import { LayoutDashboard } from 'lucide-react'
import { MODULES } from '@shared/modules'
import type { Category } from '@shared/types'
import { useApp } from '../lib/store'
import { ModuleGrid } from '../components/ModuleGrid'
import { Button } from '../components/ui'

const COPY: Record<Category, { title: string; blurb: string }> = {
  hud: {
    title: 'HUD',
    blurb: 'Overlay modules draw over the game and update instantly. Pack modules move and restyle Minecraft\'s own HUD through the Master Client pack and apply when you rejoin.'
  },
  visuals: {
    title: 'Visuals',
    blurb: 'Pack modules change how the game looks through official resource pack features. "In game" modules point you to the setting Minecraft already has.'
  }
}

export function ModulesPage({ category }: { category: Category }) {
  const setPage = useApp((s) => s.setPage)
  const settings = useApp((s) => s.settings)!
  const all = MODULES.filter((m) => m.category === category)
  const on = all.filter((m) => settings.modules[m.id]?.enabled).length
  const unavailable = all.filter((m) => m.available === 'no').length
  return (
    <div className="page-enter space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-pixel text-4xl">{COPY[category].title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">{COPY[category].blurb}</p>
          <p className="mt-1 text-xs text-muted">
            {on} on · {all.length - unavailable} available · {unavailable} unavailable on Bedrock
          </p>
        </div>
        {category === 'hud' && (
          <Button variant="accent" className="shrink-0 py-2.5" onClick={() => setPage('editor')}>
            <LayoutDashboard size={16} /> Edit HUD Layout
          </Button>
        )}
      </div>
      <ModuleGrid category={category} />
    </div>
  )
}
