import { useCallback, useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Copy, Grid3x3, Magnet, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { REFERENCE, DEFAULT_STYLE, clamp } from '@shared/hud'
import { MODULES, MODULE_BY_ID } from '@shared/modules'
import { activePlacements, defaultPlacements } from '@shared/settings'
import type { HudPlacement, HudProfile, Settings } from '@shared/types'
import { useApp } from '../lib/store'
import { Landscape } from '../components/Landscape'
import { StylePanel } from '../components/StylePanel'
import { Button, EngineBadge, Select, Slider, TextInput, Toggle, cx } from '../components/ui'
import { ModuleIcon } from '../lib/icons'
import { MockGame } from './MockGame'
import { ModuleView } from './renderers'

const PLACEABLE = MODULES.filter((m) => m.hud?.onHud && m.available !== 'no')
const SNAP_PX = 6

interface Guide {
  axis: 'x' | 'y'
  at: number
}

function rectOf(p: HudPlacement, id: string, w: number, h: number) {
  const base = MODULE_BY_ID[id].hud!.base
  const k = h / REFERENCE.h
  return { left: p.x * w, top: p.y * h, width: base.w * p.scale * k, height: base.h * p.scale * k }
}

export function HudEditor({ live = false, keys = new Set<string>(), onClose }: { live?: boolean; keys?: Set<string>; onClose: () => void }) {
  const settings = useApp((s) => s.settings) as Settings
  const metrics = useApp((s) => s.metrics)
  const setPlacement = useApp((s) => s.setPlacement)
  const setModule = useApp((s) => s.setModule)
  const patch = useApp((s) => s.patch)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })
  const [selected, setSelected] = useState<string | null>(null)
  const [guides, setGuides] = useState<Guide[]>([])
  const [renaming, setRenaming] = useState<string | null>(null)
  const placements = activePlacements(settings)
  const enabled = PLACEABLE.filter((m) => settings.modules[m.id]?.enabled)
  const grid = settings.hud.grid
  const k = size.h / REFERENCE.h

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize({ w: r.width, h: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Arrow keys nudge the selected module by one grid step (Shift: 5 steps, Alt: 1px).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selected) setSelected(null)
        else onClose()
        return
      }
      if (!selected || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      e.preventDefault()
      const p = placements[selected]
      const step = (e.altKey ? 1 : grid * k) * (e.shiftKey ? 5 : 1)
      const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
      const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
      setPlacement(selected, { x: clamp(p.x + dx / size.w, 0, 1), y: clamp(p.y + dy / size.h, 0, 1) })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, placements, grid, k, size, setPlacement, onClose])

  const snap = useCallback(
    (id: string, left: number, top: number, width: number, height: number) => {
      const found: Guide[] = []
      let nx = left
      let ny = top
      if (settings.hud.guides) {
        const xs = [0, size.w / 2, size.w]
        const ys = [0, size.h / 2, size.h]
        for (const m of enabled) {
          if (m.id === id) continue
          const r = rectOf(placements[m.id], m.id, size.w, size.h)
          xs.push(r.left, r.left + r.width / 2, r.left + r.width)
          ys.push(r.top, r.top + r.height / 2, r.top + r.height)
        }
        const best = (cands: number[], edges: number[]) => {
          let pick: { delta: number; at: number } | null = null
          for (const c of cands) for (const e of edges) {
            const d = c - e
            if (Math.abs(d) <= SNAP_PX && (!pick || Math.abs(d) < Math.abs(pick.delta))) pick = { delta: d, at: c }
          }
          return pick
        }
        const bx = best(xs, [left, left + width / 2, left + width])
        const by = best(ys, [top, top + height / 2, top + height])
        if (bx) {
          nx = left + bx.delta
          found.push({ axis: 'x', at: bx.at })
        }
        if (by) {
          ny = top + by.delta
          found.push({ axis: 'y', at: by.at })
        }
      }
      if (settings.hud.snap) {
        const g = grid * k
        if (!found.some((f) => f.axis === 'x')) nx = Math.round(nx / g) * g
        if (!found.some((f) => f.axis === 'y')) ny = Math.round(ny / g) * g
      }
      return { x: clamp(nx, 0, Math.max(0, size.w - width)), y: clamp(ny, 0, Math.max(0, size.h - height)), guides: found }
    },
    [settings.hud.guides, settings.hud.snap, enabled, placements, size, grid, k]
  )

  const startDrag = (id: string, e: RPointerEvent<HTMLDivElement>) => {
    const def = MODULE_BY_ID[id]
    if (!def.hud?.movable) return
    e.preventDefault()
    e.stopPropagation()
    setSelected(id)
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const start = { mx: e.clientX, my: e.clientY, ...rectOf(placements[id], id, size.w, size.h) }
    const move = (ev: PointerEvent) => {
      const r = snap(id, start.left + ev.clientX - start.mx, start.top + ev.clientY - start.my, start.width, start.height)
      setGuides(r.guides)
      setPlacement(id, { x: r.x / size.w, y: r.y / size.h })
    }
    const up = () => {
      setGuides([])
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  const startResize = (id: string, e: RPointerEvent<HTMLDivElement>) => {
    const def = MODULE_BY_ID[id].hud!
    e.preventDefault()
    e.stopPropagation()
    const el = e.currentTarget
    el.setPointerCapture(e.pointerId)
    const p = placements[id]
    const start = { mx: e.clientX, scale: p.scale }
    const move = (ev: PointerEvent) => {
      const w0 = def.base.w * k
      const next = clamp(Math.round(((start.scale * w0 + ev.clientX - start.mx) / w0) * 20) / 20, def.minScale, def.maxScale)
      setPlacement(id, { scale: next })
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }

  // ---- profiles
  const profiles = Object.values(settings.hud.profiles)
  const active = settings.hud.activeProfile
  const saveProfiles = async (next: Record<string, HudProfile>, activeId: string) => {
    const s = await window.mc.settings.replace({ ...settings, hud: { ...settings.hud, profiles: next, activeProfile: activeId } })
    useApp.getState().setSettings(s)
  }
  const newProfile = (copy: boolean) => {
    const id = `layout_${Date.now().toString(36)}`
    const placementsCopy = copy ? structuredClone(placements) : defaultPlacements()
    void saveProfiles({ ...settings.hud.profiles, [id]: { id, name: copy ? `${settings.hud.profiles[active].name} copy` : 'New layout', placements: placementsCopy } }, id)
  }
  const deleteProfile = () => {
    if (active === 'default') return
    const next = { ...settings.hud.profiles }
    delete next[active]
    void saveProfiles(next, 'default')
  }

  const sel = selected ? MODULE_BY_ID[selected] : null
  const selP = selected ? placements[selected] : null

  const canvas = (
    <div
      ref={canvasRef}
      className={cx('relative overflow-hidden', live ? 'h-full w-full' : 'aspect-video w-full rounded-xl border border-line shadow-2xl')}
      onPointerDown={() => setSelected(null)}
    >
      {!live && (
        <>
          <Landscape animate={false} className="absolute inset-0 h-full w-full" />
          <MockGame scale={k * 1.4} />
        </>
      )}
      {live && <div className="absolute inset-0 bg-black/25" />}
      {settings.hud.snap && (
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: `${grid * k * 4}px ${grid * k * 4}px`
          }}
        />
      )}
      {guides.map((g, i) => (
        <div key={i} className="pointer-events-none absolute bg-accent" style={g.axis === 'x' ? { left: g.at, top: 0, bottom: 0, width: 1 } : { top: g.at, left: 0, right: 0, height: 1 }} />
      ))}
      {enabled.map((m) => {
        const p = placements[m.id]
        const r = rectOf(p, m.id, size.w, size.h)
        const isSel = selected === m.id
        return (
          <div
            key={m.id}
            onPointerDown={(e) => startDrag(m.id, e)}
            className={cx('group absolute', m.hud!.movable ? 'cursor-move' : 'cursor-default')}
            style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
          >
            <div className="pointer-events-none absolute top-0 left-0 origin-top-left" style={{ width: m.hud!.base.w, height: m.hud!.base.h, transform: `scale(${p.scale * k})` }}>
              <ModuleView id={m.id} settings={settings} metrics={metrics} keys={keys} style={p.style} preview={!live} />
            </div>
            <div className={cx('absolute -inset-[3px] rounded-md border-2 transition-colors', isSel ? 'border-accent' : 'border-transparent group-hover:border-white/50')} />
            <div className={cx('absolute -top-6 left-0 flex items-center gap-1 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white', isSel ? 'flex' : 'hidden group-hover:flex')}>
              {m.name}
              <EngineBadge engine={m.engines.includes('overlay') ? 'overlay' : 'pack'} />
            </div>
            {isSel && m.hud!.resizable && <div onPointerDown={(e) => startResize(m.id, e)} className="absolute -right-2 -bottom-2 h-4 w-4 cursor-nwse-resize rounded-sm border-2 border-white bg-accent" />}
          </div>
        )
      })}
    </div>
  )

  const toolbar = (
    <div className={cx('flex items-center gap-2', live ? 'flex-nowrap rounded-xl border border-white/10 bg-black/80 px-3 py-2 whitespace-nowrap shadow-2xl backdrop-blur' : 'flex-wrap')}>
      <span className="mr-2 text-sm font-semibold">HUD editor</span>
      {renaming ? (
        <TextInput
          autoFocus
          value={renaming}
          onChange={setRenaming}
          className="w-44 py-1"
          placeholder="Layout name"
        />
      ) : (
        <Select value={active} onChange={(v) => patch({ hud: { activeProfile: v } })} options={profiles.map((p) => ({ value: p.id, label: p.name }))} />
      )}
      {renaming ? (
        <Button
          variant="accent"
          onClick={() => {
            patch({ hud: { profiles: { [active]: { name: renaming.trim() || 'Layout' } } } })
            setRenaming(null)
          }}
        >
          Save name
        </Button>
      ) : (
        <>
          <Button variant="ghost" title="New layout" onClick={() => newProfile(false)}>
            <Plus size={15} />
          </Button>
          <Button variant="ghost" title="Duplicate layout" onClick={() => newProfile(true)}>
            <Copy size={15} />
          </Button>
          <Button variant="ghost" title="Rename layout" onClick={() => setRenaming(settings.hud.profiles[active].name)}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" title="Delete layout" disabled={active === 'default'} onClick={deleteProfile}>
            <Trash2 size={15} />
          </Button>
        </>
      )}
      <div className="mx-2 h-6 w-px bg-white/10" />
      <label className="flex items-center gap-2 text-xs text-muted">
        <Grid3x3 size={14} /> Snap
        <Toggle on={settings.hud.snap} onChange={(v) => patch({ hud: { snap: v } })} label="Snap to grid" />
      </label>
      <Select value={String(grid)} onChange={(v) => patch({ hud: { grid: Number(v) } })} options={['4', '8', '16', '32'].map((g) => ({ value: g, label: `${g}px` }))} />
      <label className="flex items-center gap-2 text-xs text-muted">
        <Magnet size={14} /> Guides
        <Toggle on={settings.hud.guides} onChange={(v) => patch({ hud: { guides: v } })} label="Alignment guides" />
      </label>
      <div className="mx-2 h-6 w-px bg-white/10" />
      <Button variant="ghost" onClick={() => patch({ hud: { profiles: { [active]: { placements: defaultPlacements() } } } })}>
        <RotateCcw size={14} /> Reset all
      </Button>
      <Button variant="accent" onClick={onClose}>
        Done
      </Button>
    </div>
  )

  const inspector = (
    <div className={cx('flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto', live ? 'max-h-[80vh] rounded-xl border border-white/10 bg-black/85 p-4 backdrop-blur' : 'max-h-full')}>
      {sel && selP ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ModuleIcon name={sel.icon} />
              <span className="font-semibold">{sel.name}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted hover:text-ink" aria-label="Deselect">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-1">
            {sel.engines.map((e) => (
              <EngineBadge key={e} engine={e} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['x', 'y'] as const).map((axis) => (
              <label key={axis} className="text-xs text-muted">
                {axis.toUpperCase()} (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={Math.round(selP[axis] * 1000) / 10}
                  onChange={(e) => setPlacement(sel.id, { [axis]: clamp(Number(e.target.value) / 100, 0, 1) })}
                  className="mt-1 w-full rounded-lg border border-line bg-panel2 px-2 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
          <div>
            <div className="mb-1 text-xs text-muted">Size</div>
            <Slider
              value={selP.scale}
              min={sel.hud!.minScale}
              max={sel.hud!.maxScale}
              step={0.05}
              disabled={!sel.hud!.resizable}
              onChange={(v) => setPlacement(sel.id, { scale: v })}
              display={`${selP.scale.toFixed(2)}x`}
            />
            {sel.hud!.sizeNote && <div className="mt-1 text-xs text-muted">{sel.hud!.sizeNote}</div>}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setPlacement(sel.id, { ...sel.hud!.defaultPos })}>
              Reset position
            </Button>
            <Button className="flex-1" onClick={() => setPlacement(sel.id, { style: { ...DEFAULT_STYLE } })}>
              Reset style
            </Button>
          </div>
          <StylePanel compact style={selP.style} support={sel.hud!.style} onChange={(st) => setPlacement(sel.id, { style: st })} />
        </>
      ) : (
        <>
          <div className="text-sm font-semibold">Modules</div>
          <p className="text-xs text-muted">Turn modules on to place them. Drag to move, drag the corner to resize, arrow keys to nudge.</p>
          <div className="space-y-1">
            {PLACEABLE.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                <button className="flex items-center gap-2 text-sm" onClick={() => settings.modules[m.id].enabled && setSelected(m.id)}>
                  <ModuleIcon name={m.icon} size={15} className="text-muted" />
                  {m.name}
                  <EngineBadge engine={m.engines.includes('overlay') ? 'overlay' : 'pack'} />
                </button>
                <Toggle on={settings.modules[m.id].enabled} onChange={(v) => setModule(m.id, { enabled: v })} label={m.name} />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Pack modules show their approximate size. Exact size follows your in-game GUI scale, and pack changes apply when you rejoin.
          </p>
        </>
      )}
    </div>
  )

  if (live) {
    return (
      <div className="fixed inset-0 z-40">
        {canvas}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">{toolbar}</div>
        <div className="absolute top-20 right-4">{inspector}</div>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col gap-4">
      {toolbar}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 items-start">{canvas}</div>
        {inspector}
      </div>
    </div>
  )
}

