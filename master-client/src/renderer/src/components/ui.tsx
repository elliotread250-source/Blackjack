import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { fromBrowserButton, fromBrowserCode, keyLabel } from '@shared/keys'
import { ACCENTS } from '@shared/settings'
import type { Engine } from '@shared/types'

export function cx(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(' ')
}

export function Toggle({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange(!on)
      }}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
        on ? 'bg-accent' : 'bg-white/12',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      )}
    >
      <span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled,
  className,
  title,
  type = 'button'
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'accent' | 'ghost' | 'danger'
  disabled?: boolean
  className?: string
  title?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'accent' && 'bg-accent text-white hover:brightness-110 active:brightness-95',
        variant === 'default' && 'border border-line bg-white/5 text-ink hover:bg-white/10',
        variant === 'ghost' && 'text-muted hover:bg-white/5 hover:text-ink',
        variant === 'danger' && 'border border-bad/30 bg-bad/10 text-bad hover:bg-bad/20',
        className
      )}
    >
      {children}
    </button>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-xl border border-line bg-panel', className)}>{children}</div>
}

export function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold tracking-wide text-ink">{title}</h3>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}

export function Row({ label, hint, children, stacked }: { label: ReactNode; hint?: ReactNode; children: ReactNode; stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="space-y-1.5">
        <div>
          <div className="text-sm text-ink">{label}</div>
          {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <div className="text-sm text-ink">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
  display,
  wide
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  disabled?: boolean
  display?: string
  wide?: boolean
}) {
  return (
    <div className={cx('flex items-center gap-3', wide ? 'w-full' : 'w-64')}>
      <input
        type="range"
        className="h-1.5 flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-16 text-right font-mono text-xs text-muted tabular-nums">{display ?? value}</span>
    </div>
  )
}

export function ColorInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className={cx('flex items-center gap-2 rounded-lg border border-line bg-white/5 px-2 py-1', disabled && 'opacity-40')}>
      <input type="color" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
      <span className="font-mono text-xs text-muted uppercase">{value}</span>
    </label>
  )
}

export function Select<T extends string>({ value, onChange, options, disabled }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className="rounded-lg border border-line bg-panel2 px-3 py-1.5 text-sm text-ink outline-none focus:border-accent disabled:opacity-40"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  className,
  autoFocus
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  className?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cx('rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/60 focus:border-accent', className)}
    />
  )
}

/** Click, then press a key or mouse button. Escape cancels. */
export function KeyCapture({ value, onChange, allowCombos, allowMouse = true }: { value: string; onChange: (k: string) => void; allowCombos?: boolean; allowMouse?: boolean }) {
  const [listening, setListening] = useState(false)
  useEffect(() => {
    if (!listening) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') return setListening(false)
      const key = fromBrowserCode(e.code)
      if (!key) return
      const isModifier = ['Shift', 'ShiftRight', 'Ctrl', 'CtrlRight', 'Alt', 'AltRight'].includes(key)
      if (allowCombos && !isModifier && (e.ctrlKey || e.altKey)) {
        const parts = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', key].filter(Boolean)
        onChange(parts.join('+'))
      } else {
        onChange(key)
      }
      setListening(false)
    }
    const onMouse = (e: MouseEvent) => {
      if (!allowMouse) return
      const key = fromBrowserButton(e.button)
      if (!key) return
      e.preventDefault()
      onChange(key)
      setListening(false)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('mousedown', onMouse, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('mousedown', onMouse, true)
    }
  }, [listening, allowCombos, allowMouse, onChange])
  return (
    <button
      type="button"
      onClick={() => setListening(true)}
      className={cx(
        'min-w-24 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors',
        listening ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-white/5 text-ink hover:bg-white/10'
      )}
    >
      {listening ? 'Press a key…' : value.split('+').map(keyLabel).join(' + ')}
    </button>
  )
}

const ENGINE_STYLE: Record<Engine, { label: string; className: string; title: string }> = {
  pack: { label: 'Pack', className: 'bg-violet-500/15 text-violet-300', title: 'Delivered through the generated Master Client resource pack. Applies when you rejoin.' },
  overlay: { label: 'Overlay', className: 'bg-sky-500/15 text-sky-300', title: 'Drawn in the overlay window from Windows and your own input. Applies instantly.' },
  vanilla: { label: 'In game', className: 'bg-white/10 text-ink/80', title: 'Minecraft already has this setting. Set it in Minecraft.' },
  behavior: { label: 'Own worlds', className: 'bg-emerald-500/15 text-emerald-300', title: 'Behaviour pack for your own worlds only.' },
  none: { label: 'Unavailable', className: 'bg-white/5 text-muted', title: 'Unavailable on Bedrock.' }
}

export function EngineBadge({ engine }: { engine: Engine }) {
  const e = ENGINE_STYLE[engine]
  return (
    <span title={e.title} className={cx('rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase', e.className)}>
      {e.label}
    </span>
  )
}

export function Modal({ children, onClose, wide }: { children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div onMouseDown={(e) => e.stopPropagation()} className={cx('page-enter relative w-full rounded-2xl border border-line bg-panel p-6 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 rounded-md p-1 text-muted hover:bg-white/5 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export function AccentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {ACCENTS.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cx('h-6 w-6 rounded-full transition-transform hover:scale-110', value === c && 'ring-2 ring-white ring-offset-2 ring-offset-panel')}
          style={{ background: c }}
          aria-label={`Accent ${c}`}
        />
      ))}
      <ColorInput value={value} onChange={onChange} />
    </div>
  )
}

export function Banner({ tone = 'info', children, onClose }: { tone?: 'info' | 'warn' | 'bad' | 'good'; children: ReactNode; onClose?: () => void }) {
  return (
    <div
      className={cx(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        tone === 'info' && 'border-accent/30 bg-accent/10 text-ink',
        tone === 'warn' && 'border-warn/30 bg-warn/10 text-ink',
        tone === 'bad' && 'border-bad/30 bg-bad/10 text-ink',
        tone === 'good' && 'border-good/30 bg-good/10 text-ink'
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Dismiss">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
