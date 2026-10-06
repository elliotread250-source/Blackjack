import { Ban, Gamepad2, Info, X } from 'lucide-react'
import { formatTime, MODULE_BY_ID } from '@shared/modules'
import { activePlacements } from '@shared/settings'
import type { OptionDef, Settings } from '@shared/types'
import { useApp } from '../lib/store'
import { ModuleIcon } from '../lib/icons'
import { PixelEditor } from './PixelEditor'
import { StylePanel } from './StylePanel'
import { Banner, ColorInput, EngineBadge, KeyCapture, Row, Select, Slider, TextInput, Toggle } from './ui'

function display(o: Extract<OptionDef, { type: 'slider' }>, v: number): string {
  if (o.format === 'time') return formatTime(v)
  if (o.format === 'percent') return `${Math.round(v * 100)}%`
  const dp = o.step < 1 ? (o.step < 0.1 ? 2 : 1) : 0
  return `${v.toFixed(dp)}${o.unit ?? ''}`
}

export function OptionField({ o, value, onChange, settings, moduleId }: { o: OptionDef; value: unknown; onChange: (v: unknown) => void; settings: Settings; moduleId: string }) {
  switch (o.type) {
    case 'heading':
      return <div className="pt-2 text-xs font-semibold tracking-wider text-muted uppercase">{o.label}</div>
    case 'toggle':
      return (
        <Row label={o.label} hint={o.help}>
          <Toggle on={value === true} onChange={onChange} label={o.label} />
        </Row>
      )
    case 'slider':
      return (
        <Row label={o.label} hint={o.help}>
          <Slider value={Number(value)} min={o.min} max={o.max} step={o.step} onChange={onChange} display={display(o, Number(value))} />
        </Row>
      )
    case 'color':
      return (
        <Row label={o.label} hint={o.help}>
          <ColorInput value={String(value)} onChange={onChange} />
        </Row>
      )
    case 'select':
      return (
        <Row label={o.label} hint={o.help}>
          <Select value={String(value)} onChange={onChange} options={o.choices} />
        </Row>
      )
    case 'key':
      return (
        <Row label={o.label} hint={o.help}>
          <KeyCapture value={String(value)} onChange={onChange} />
        </Row>
      )
    case 'text':
      return (
        <Row label={o.label} hint={o.help}>
          <TextInput value={String(value)} onChange={onChange} placeholder={o.placeholder} />
        </Row>
      )
    case 'pixels':
      return (
        <PixelEditor
          value={value as string[]}
          color={String(settings.modules[moduleId].options.textureColor ?? '#ffffff')}
          onChange={onChange}
        />
      )
  }
}

export function ModuleOptions({ id }: { id: string }) {
  const settings = useApp((s) => s.settings)!
  const setModule = useApp((s) => s.setModule)
  const def = MODULE_BY_ID[id]
  const state = settings.modules[id]
  const visible = def.options.filter((o) => !o.showIf || state.options[o.showIf.key] === o.showIf.equals)
  return (
    <div className="space-y-4">
      {id === 'ping' && (
        <Row label="Server address" hint="Bedrock server to ping. Also set in Settings.">
          <TextInput value={settings.server.address} onChange={(v) => useApp.getState().patch({ server: { address: v } })} placeholder="play.example.net" />
          <TextInput
            value={String(settings.server.port)}
            onChange={(v) => useApp.getState().patch({ server: { port: Number(v.replace(/\D/g, '')) || 19132 } })}
            className="w-24"
            placeholder="19132"
          />
        </Row>
      )}
      {visible.map((o) => (
        <OptionField key={o.key} o={o} moduleId={id} settings={settings} value={state.options[o.key]} onChange={(v) => setModule(id, { options: { [o.key]: v } })} />
      ))}
    </div>
  )
}

export function VanillaSteps({ id }: { id: string }) {
  const def = MODULE_BY_ID[id]
  if (!def.vanilla) return null
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] p-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Gamepad2 size={15} className="text-accent" /> Set in Minecraft settings
      </div>
      <div className="text-sm text-ink">{def.vanilla.setting}</div>
      <div className="mt-1 text-xs text-muted">{def.vanilla.steps}</div>
    </div>
  )
}

/** Slide-over panel opened from a module's gear icon. */
export function ModuleDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const settings = useApp((s) => s.settings)!
  const setModule = useApp((s) => s.setModule)
  const setPlacement = useApp((s) => s.setPlacement)
  const setPage = useApp((s) => s.setPage)
  const def = MODULE_BY_ID[id]
  const state = settings.modules[id]
  const placement = activePlacements(settings)[id]
  const unavailable = def.available === 'no'
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className="page-enter flex h-full w-[520px] flex-col border-l border-line bg-panel shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-accent/15 p-2.5 text-accent">
              <ModuleIcon name={def.icon} size={22} />
            </div>
            <div>
              <div className="text-lg font-semibold">{def.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {def.engines.map((e) => (
                  <EngineBadge key={e} engine={e} />
                ))}
                {def.badge && <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">{def.badge}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Toggle on={state.enabled} disabled={unavailable} onChange={(v) => setModule(id, { enabled: v })} label={`Turn ${def.name} on`} />
            <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-ink" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <p className="text-sm text-muted">{def.description}</p>
          {unavailable && (
            <Banner tone="bad">
              <div className="flex items-center gap-2 font-semibold">
                <Ban size={14} /> Unavailable on Bedrock
              </div>
              <div className="mt-1 text-xs text-muted">{def.reason}</div>
            </Banner>
          )}
          {def.available === 'partial' && (
            <Banner tone="warn">
              <div className="font-semibold">Partly available</div>
              <div className="mt-1 text-xs text-muted">{def.reason}</div>
            </Banner>
          )}
          {def.note && (
            <div className="flex gap-2 text-xs text-muted">
              <Info size={14} className="mt-0.5 shrink-0" />
              {def.note}
            </div>
          )}
          {def.ownWorldsOnly && (
            <Banner tone="good">
              <div className="font-semibold">Own worlds only</div>
              <div className="mt-1 text-xs text-muted">Turn on "Master Client World Tweaks" in your world's Behavior Packs.</div>
            </Banner>
          )}
          <VanillaSteps id={id} />
          {!unavailable && def.options.length > 0 && <ModuleOptions id={id} />}
          {!unavailable && def.hud?.onHud && placement && (
            <div className="space-y-4 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Position and style</div>
                <button className="text-xs text-accent hover:underline" onClick={() => setPage('editor')}>
                  Open HUD editor
                </button>
              </div>
              <Row label="Size" hint={def.hud.sizeNote}>
                <Slider
                  value={placement.scale}
                  min={def.hud.minScale}
                  max={def.hud.maxScale}
                  step={0.05}
                  disabled={!def.hud.resizable}
                  onChange={(v) => setPlacement(id, { scale: v })}
                  display={`${placement.scale.toFixed(2)}x`}
                />
              </Row>
              <StylePanel style={placement.style} support={def.hud.style} onChange={(st) => setPlacement(id, { style: st })} />
            </div>
          )}
          {def.engines.includes('pack') && !unavailable && (
            <p className="text-xs text-muted">Pack changes apply when you rejoin your world or server. Some servers force their own packs, which can override these.</p>
          )}
        </div>
      </div>
    </div>
  )
}
