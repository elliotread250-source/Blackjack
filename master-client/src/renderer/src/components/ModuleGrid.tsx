import { useMemo, useState } from 'react'
import { Ban, Search, Settings2 } from 'lucide-react'
import { MODULES } from '@shared/modules'
import type { Category, ModuleDef } from '@shared/types'
import { useApp } from '../lib/store'
import { ModuleIcon } from '../lib/icons'
import { EngineBadge, Toggle, cx } from './ui'

export function ModuleCard({ def, onGear, compact }: { def: ModuleDef; onGear: () => void; compact?: boolean }) {
  const enabled = useApp((s) => s.settings?.modules[def.id]?.enabled === true)
  const setModule = useApp((s) => s.setModule)
  const unavailable = def.available === 'no'
  return (
    <div
      onClick={() => !unavailable && setModule(def.id, { enabled: !enabled })}
      className={cx(
        'group relative flex flex-col rounded-xl border p-4 transition-all duration-150',
        unavailable ? 'cursor-default border-line bg-white/[0.02] opacity-55' : 'cursor-pointer hover:-translate-y-0.5',
        !unavailable && enabled ? 'border-accent/60 bg-accent/[0.09]' : !unavailable && 'border-line bg-panel hover:border-white/20',
        compact && 'p-3'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cx('rounded-lg p-2', enabled && !unavailable ? 'bg-accent/20 text-accent' : 'bg-white/5 text-muted')}>
          {unavailable ? <Ban size={18} /> : <ModuleIcon name={def.icon} />}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGear()
            }}
            className="rounded-md p-1.5 text-muted opacity-70 transition hover:bg-white/10 hover:text-ink group-hover:opacity-100"
            aria-label={`${def.name} settings`}
          >
            <Settings2 size={16} />
          </button>
          <Toggle on={enabled} disabled={unavailable} onChange={(v) => setModule(def.id, { enabled: v })} label={def.name} />
        </div>
      </div>
      <div className="mt-3 font-medium">{def.name}</div>
      {unavailable ? (
        <>
          <div className="mt-1 text-[11px] font-semibold tracking-wide text-bad/90 uppercase">Unavailable on Bedrock</div>
          <div className="mt-1 text-xs leading-snug text-muted">{def.reason}</div>
        </>
      ) : (
        <>
          <div className={cx('mt-1 text-xs leading-snug text-muted', compact ? 'line-clamp-2' : 'line-clamp-3')}>{def.description}</div>
          <div className="mt-auto flex flex-wrap gap-1 pt-3">
            {def.engines.map((e) => (
              <EngineBadge key={e} engine={e} />
            ))}
            {def.available === 'partial' && <span className="rounded-md bg-warn/15 px-1.5 py-0.5 text-[10px] font-semibold text-warn uppercase">Partial</span>}
          </div>
        </>
      )}
    </div>
  )
}

export function ModuleGrid({ category, compact, columns = 4 }: { category: Category | 'all'; compact?: boolean; columns?: number }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'on' | 'available'>('all')
  const settings = useApp((s) => s.settings)
  const setOpenModule = useApp((s) => s.setOpenModule)
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MODULES.filter((m) => category === 'all' || m.category === category)
      .filter((m) => !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
      .filter((m) => (filter === 'on' ? settings?.modules[m.id]?.enabled : filter === 'available' ? m.available !== 'no' : true))
      .sort((a, b) => Number(a.available === 'no') - Number(b.available === 'no'))
  }, [category, query, filter, settings])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules"
            className="w-full rounded-lg border border-line bg-panel py-2 pr-3 pl-9 text-sm outline-none placeholder:text-muted/70 focus:border-accent"
          />
        </div>
        <div className="flex rounded-lg border border-line bg-panel p-0.5 text-xs">
          {(['all', 'on', 'available'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cx('rounded-md px-3 py-1.5 capitalize', filter === f ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink')}>
              {f === 'on' ? 'Enabled' : f}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {list.map((m) => (
          <ModuleCard key={m.id} def={m} compact={compact} onGear={() => setOpenModule(m.id)} />
        ))}
      </div>
      {list.length === 0 && <div className="py-12 text-center text-sm text-muted">No modules match.</div>}
    </div>
  )
}
