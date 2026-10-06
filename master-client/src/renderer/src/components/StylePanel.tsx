import type { ReactNode } from 'react'
import { FONTS, STYLE_PRESETS, panelPreviewStyle } from '../hud/style'
import type { HudStyle, StyleSupport } from '@shared/types'
import { ColorInput, Row, Select, Slider, Toggle, cx } from './ui'

const NOT_SUPPORTED = 'Not supported by Bedrock for this element'

export function StylePanel({ style, support, onChange, compact }: { style: HudStyle; support: StyleSupport; onChange: (s: Partial<HudStyle>) => void; compact?: boolean }) {
  const any = Object.values(support).some(Boolean)
  const set = (s: Partial<HudStyle>) => onChange({ ...s, preset: 'custom' })
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-2 text-xs font-semibold tracking-wider text-muted uppercase">Presets</div>
        <div className={cx('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-6')}>
          {STYLE_PRESETS.map((p) => (
            <button
              key={p.id}
              disabled={!any}
              onClick={() => onChange({ ...p.style, preset: p.id })}
              className={cx(
                'flex h-12 flex-col items-center justify-center rounded-lg border text-[11px] transition-colors disabled:opacity-40',
                style.preset === p.id ? 'border-accent bg-accent/10' : 'border-line bg-white/5 hover:bg-white/10'
              )}
            >
              <span className="rounded px-1.5 py-0.5 text-[11px]" style={panelPreviewStyle(p.style)}>
                Aa
              </span>
              <span className="mt-1 text-muted">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
      <Field label="Font" off={!support.font} stacked={compact}>
        <Select value={style.font} disabled={!support.font} onChange={(v) => set({ font: v })} options={FONTS.map((f) => ({ value: f.id, label: f.label }))} />
      </Field>
      <Field label="Text colour" off={!support.textColor} stacked={compact}>
        <ColorInput value={style.textColor} disabled={!support.textColor} onChange={(v) => set({ textColor: v })} />
      </Field>
      <Field label="Background" off={!support.background} stacked={compact}>
        <ColorInput value={style.bgColor} disabled={!support.background} onChange={(v) => set({ bgColor: v })} />
      </Field>
      <Field label="Background opacity" off={!support.background} stacked={compact}>
        <Slider wide={compact} value={style.bgOpacity} min={0} max={1} step={0.05} disabled={!support.background} onChange={(v) => set({ bgOpacity: v })} display={`${Math.round(style.bgOpacity * 100)}%`} />
      </Field>
      <Field label="Border" off={!support.border} stacked={compact}>
        <Slider wide={compact} value={style.borderWidth} min={0} max={6} step={1} disabled={!support.border} onChange={(v) => set({ borderWidth: v })} display={`${style.borderWidth}px`} />
        <ColorInput value={style.borderColor} disabled={!support.border} onChange={(v) => set({ borderColor: v })} />
      </Field>
      <Field label="Corner radius" off={!support.radius} stacked={compact}>
        <Slider wide={compact} value={style.radius} min={0} max={24} step={1} disabled={!support.radius} onChange={(v) => set({ radius: v })} display={`${style.radius}px`} />
      </Field>
      <Field label="Shadow" off={!support.shadow} stacked={compact}>
        <Toggle on={style.shadow} disabled={!support.shadow} onChange={(v) => set({ shadow: v })} label="Shadow" />
      </Field>
    </div>
  )
}

function Field({ label, off, children, stacked }: { label: string; off: boolean; children: ReactNode; stacked?: boolean }) {
  return (
    <div title={off ? NOT_SUPPORTED : undefined}>
      <Row stacked={stacked} label={<span className={off ? 'text-muted' : ''}>{label}</span>} hint={off ? NOT_SUPPORTED : undefined}>
        {children}
      </Row>
    </div>
  )
}
