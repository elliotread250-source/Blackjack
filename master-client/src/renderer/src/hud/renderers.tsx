import type { CSSProperties, ReactNode } from 'react'
import { fontCss, rgba } from '@shared/hud'
import { keyLabel } from '@shared/keys'
import type { Metrics } from '@shared/ipc'
import type { HudStyle, Settings } from '@shared/types'

// Every HUD module's look, drawn at its 1920x1080 reference size. The editor and
// the overlay both position and scale these, so the preview matches the overlay.

export interface ViewProps {
  settings: Settings
  metrics: Metrics | null
  keys: Set<string>
  style: HudStyle
  preview: boolean
}

export function textStyle(style: HudStyle): CSSProperties {
  return {
    fontFamily: fontCss(style.font),
    color: style.textColor,
    textShadow: style.shadow ? '2px 2px 0 rgba(0,0,0,0.55)' : 'none'
  }
}

export function panelStyle(style: HudStyle): CSSProperties {
  return {
    ...textStyle(style),
    background: rgba(style.bgColor, style.bgOpacity),
    border: style.borderWidth > 0 ? `${style.borderWidth}px solid ${style.borderColor}` : undefined,
    borderRadius: style.radius
  }
}

const opt = <T,>(s: Settings, id: string, key: string, d: T): T => (s.modules[id]?.options[key] as T) ?? d

function Panel({ style, children, className = '' }: { style: HudStyle; children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center ${className}`} style={panelStyle(style)}>
      {children}
    </div>
  )
}

function pingColor(ms: number | null): string | undefined {
  if (ms == null) return undefined
  return ms < 60 ? '#5be37d' : ms < 130 ? '#ffd84d' : '#ff6b6b'
}

// ------------------------------------------------------------------ overlay modules
function Fps({ settings, metrics, style, preview }: ViewProps) {
  const m = metrics
  const fps = preview && (!m || m.fps == null) ? 144 : m?.fps
  const ft = preview && (!m || m.frameTime == null) ? 6.94 : m?.frameTime
  const showFt = opt(settings, 'fps', 'showFrameTime', false)
  const status = m?.fpsStatus
  const note = !preview && fps == null ? (status === 'no-permission' ? 'needs permission' : status === 'waiting-for-game' ? 'waiting for game' : status === 'missing' ? 'PresentMon missing' : '') : ''
  return (
    <Panel style={style}>
      <div className="flex items-baseline gap-2 text-[22px] leading-none">
        <span className="opacity-70">FPS</span>
        <span className="tabular-nums">{fps ?? '--'}</span>
        {showFt && ft != null && <span className="text-[15px] opacity-70 tabular-nums">{ft.toFixed(1)}ms</span>}
        {note && <span className="text-[12px] opacity-60">{note}</span>}
      </div>
    </Panel>
  )
}

function Cps({ settings, metrics, style, preview }: ViewProps) {
  const l = preview && !metrics ? 12 : (metrics?.cpsLeft ?? 0)
  const r = preview && !metrics ? 3 : (metrics?.cpsRight ?? 0)
  const mode = opt<string>(settings, 'cps', 'mode', 'both')
  return (
    <Panel style={style}>
      <div className="flex items-baseline gap-2 text-[22px] leading-none tabular-nums">
        <span className="opacity-70">CPS</span>
        {mode !== 'right' && <span>{l}</span>}
        {mode === 'both' && <span className="opacity-50">|</span>}
        {mode !== 'left' && <span>{r}</span>}
      </div>
    </Panel>
  )
}

function Ping({ settings, metrics, style, preview }: ViewProps) {
  const ms = preview && (!metrics || metrics.ping == null) ? 42 : (metrics?.ping ?? null)
  const showLabel = opt(settings, 'ping', 'showLabel', true)
  const colored = opt(settings, 'ping', 'colorCode', true)
  const status = metrics?.pingStatus
  const text = ms != null ? `${ms} ms` : status === 'no-address' ? 'set a server' : status === 'timeout' ? 'no reply' : '--'
  return (
    <Panel style={style}>
      <div className="flex flex-col items-center leading-none">
        {showLabel && <span className="mb-1 text-[11px] tracking-wide opacity-60">Server ping (external)</span>}
        <span className="text-[20px] tabular-nums" style={{ color: colored ? pingColor(ms) : undefined }}>
          {text}
        </span>
      </div>
    </Panel>
  )
}

function Keystrokes({ settings, keys, style, metrics, preview }: ViewProps) {
  const o = (k: string, d: string) => String(opt(settings, 'keystrokes', k, d))
  const press = opt(settings, 'keystrokes', 'pressColor', '#ffffff')
  const fade = opt(settings, 'keystrokes', 'fade', 120)
  const showMouse = opt(settings, 'keystrokes', 'showMouse', true)
  const showSpace = opt(settings, 'keystrokes', 'showSpace', true)
  const showCps = opt(settings, 'keystrokes', 'showCps', true)
  const demo = preview && keys.size === 0 ? new Set([o('forward', 'W'), 'Mouse1']) : keys
  const key = (name: string, label: ReactNode, w: number, h: number, sub?: string) => {
    const down = demo.has(name)
    return (
      <div
        key={name}
        className="flex flex-col items-center justify-center"
        style={{
          ...textStyle(style),
          width: w,
          height: h,
          borderRadius: style.radius,
          border: style.borderWidth > 0 ? `${style.borderWidth}px solid ${style.borderColor}` : undefined,
          background: down ? rgba(press, 0.9) : rgba(style.bgColor, style.bgOpacity),
          color: down ? '#111' : style.textColor,
          textShadow: down ? 'none' : textStyle(style).textShadow,
          transform: down ? 'scale(0.94)' : 'none',
          transition: `background ${fade}ms ease, color ${fade}ms ease, transform 70ms ease`
        }}
      >
        <span className="text-[20px] leading-none">{label}</span>
        {sub && <span className="mt-1 text-[11px] leading-none opacity-70 tabular-nums">{sub}</span>}
      </div>
    )
  }
  const K = 54
  const G = 6
  return (
    <div className="flex h-full w-full flex-col items-center justify-start gap-[6px] p-[6px]">
      <div className="flex gap-[6px]">
        <div style={{ width: K }} />
        {key(o('forward', 'W'), keyLabel(o('forward', 'W')), K, K)}
        <div style={{ width: K }} />
      </div>
      <div className="flex gap-[6px]">
        {key(o('left', 'A'), keyLabel(o('left', 'A')), K, K)}
        {key(o('back', 'S'), keyLabel(o('back', 'S')), K, K)}
        {key(o('right', 'D'), keyLabel(o('right', 'D')), K, K)}
      </div>
      {showMouse && (
        <div className="flex gap-[6px]">
          {key('Mouse1', 'LMB', (3 * K + 2 * G - G) / 2, 48, showCps ? `${preview && !metrics ? 12 : (metrics?.cpsLeft ?? 0)} CPS` : undefined)}
          {key('Mouse2', 'RMB', (3 * K + 2 * G - G) / 2, 48, showCps ? `${preview && !metrics ? 3 : (metrics?.cpsRight ?? 0)} CPS` : undefined)}
        </div>
      )}
      {showSpace && (
        <div className="flex gap-[6px]">
          {key(o('sneak', 'Shift'), keyLabel(o('sneak', 'Shift')), K, 36)}
          {key(o('jump', 'Space'), <span className="block h-[3px] w-14 rounded-full bg-current opacity-80" />, 2 * K + G, 36)}
        </div>
      )}
    </div>
  )
}

function Debug({ settings, metrics, style, preview }: ViewProps) {
  const m = metrics
  const show = (k: string) => opt(settings, 'debug', k, true)
  const v = <T,>(live: T | null | undefined, demo: T): T | null => (preview && (live == null || !m) ? demo : (live ?? null))
  const rows: [string, string][] = []
  if (show('fps')) rows.push(['FPS', String(v(m?.fps, 144) ?? '--')])
  if (show('frametime')) rows.push(['Frame time', v(m?.frameTime, 6.94) != null ? `${v(m?.frameTime, 6.94)!.toFixed(2)} ms` : '--'])
  if (show('ping')) rows.push(['Server ping', v(m?.ping, 42) != null ? `${v(m?.ping, 42)} ms` : '--'])
  if (show('cps')) rows.push(['CPS', `${v(m?.cpsLeft, 12) ?? 0} | ${v(m?.cpsRight, 3) ?? 0}`])
  if (show('cpu')) rows.push(['CPU', v(m?.cpu, 23) != null ? `${v(m?.cpu, 23)}%` : '--'])
  if (show('gpu')) rows.push(['GPU', v(m?.gpu, 61) != null ? `${v(m?.gpu, 61)}%` : '--'])
  if (show('ram')) {
    const ram = v(m?.ram, { used: 9.4 * 2 ** 30, total: 16 * 2 ** 30 })
    rows.push(['RAM', ram ? `${(ram.used / 2 ** 30).toFixed(1)} / ${(ram.total / 2 ** 30).toFixed(0)} GB` : '--'])
  }
  return (
    <div className="flex h-full w-full flex-col justify-center gap-1 px-4 py-3" style={panelStyle(style)}>
      <div className="mb-1 text-[13px] tracking-widest opacity-60">DEBUG</div>
      {rows.map(([k, val]) => (
        <div key={k} className="flex justify-between gap-6 text-[16px] leading-tight tabular-nums">
          <span className="opacity-70">{k}</span>
          <span>{val}</span>
        </div>
      ))}
    </div>
  )
}

// ------------------------------------------------------------------ pack module previews
function Coords({ style }: ViewProps) {
  return (
    <Panel style={style}>
      <span className="text-[20px] whitespace-nowrap">Position: 128, 64, -256</span>
    </Panel>
  )
}

function Chat({ settings, style }: ViewProps) {
  const lines = ['<Alex> anyone up for bedwars?', '<Steve> gg', '[Server] Welcome to the hub!', '<Alex> joining now']
  const bg = opt(settings, 'chat', 'bgOpacity', 0.5)
  return (
    <div className="flex h-full w-full flex-col justify-start gap-[2px]" style={textStyle(style)}>
      {lines.map((l) => (
        <div key={l} className="px-2 py-[3px] text-[18px] leading-tight" style={{ background: `rgba(0,0,0,${bg})` }}>
          {l}
        </div>
      ))}
    </div>
  )
}

function Scoreboard({ settings, style }: ViewProps) {
  const nameColor = opt(settings, 'scoreboard', 'nameColor', '#ffffff')
  const scoreColor = opt(settings, 'scoreboard', 'scoreColor', '#ff5555')
  const hide = opt(settings, 'scoreboard', 'hideNumbers', false)
  const rows = [['Kills', 12], ['Deaths', 3], ['Coins', 480], ['Streak', 4], ['Wins', 27]] as const
  return (
    <div className="flex h-full w-full flex-col bg-black/45 px-3 py-2" style={{ ...textStyle(style), color: undefined }}>
      <div className="mb-2 text-center text-[18px] text-yellow-300">SCORES</div>
      {rows.map(([n, v]) => (
        <div key={n} className="flex justify-between text-[17px] leading-snug">
          <span style={{ color: nameColor }}>{n}</span>
          {!hide && <span style={{ color: scoreColor }}>{v}</span>}
        </div>
      ))}
    </div>
  )
}

function Bossbar({ style }: ViewProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1" style={panelStyle({ ...style, bgOpacity: style.bgOpacity * 0.6 })}>
      <span className="text-[15px] leading-none text-white" style={{ fontFamily: fontCss(style.font) }}>
        Ender Dragon
      </span>
      <div className="h-[10px] w-[340px] bg-black/60 p-[1px]">
        <div className="h-full w-[70%] bg-fuchsia-500" />
      </div>
    </div>
  )
}

function Potion({ style }: ViewProps) {
  const effects = [
    ['#e8473c', '1:30'],
    ['#7fd3ff', '3:00'],
    ['#9f6bff', '0:45']
  ]
  return (
    <div className="flex h-full w-full items-start justify-end gap-2 p-2" style={panelStyle(style)}>
      {effects.map(([c, t]) => (
        <div key={c} className="flex flex-col items-center gap-1">
          <div className="h-11 w-11 rounded-sm border-2 border-black/50" style={{ background: c }} />
          <span className="text-[12px] text-white">{t}</span>
        </div>
      ))}
    </div>
  )
}

function PaperDoll({ style }: ViewProps) {
  const px = 7
  const rows = ['..hh..', '..hh..', 'aabbaa', 'aabbaa', 'aabbaa', '..ll..', '..ll..', '..ll..']
  const col: Record<string, string> = { h: '#c8946a', b: '#2fa6a8', a: '#c8946a', l: '#3f3f9e' }
  return (
    <div className="flex h-full w-full items-center justify-center" style={panelStyle(style)}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(6, ${px}px)` }}>
        {rows.flatMap((r, y) => [...r].map((ch, x) => <div key={`${x}-${y}`} style={{ width: px, height: px * 1.3, background: col[ch] ?? 'transparent' }} />))}
      </div>
    </div>
  )
}

function Armor({ style }: ViewProps) {
  return (
    <div className="flex h-full w-full items-center gap-[2px] px-1" style={panelStyle(style)}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-[14px] w-[14px] rounded-[2px] border border-black/60" style={{ background: i < 7 ? '#c9d1d9' : '#3c3c44' }} />
      ))}
    </div>
  )
}

const VIEWS: Record<string, (p: ViewProps) => ReactNode> = {
  fps: Fps,
  cps: Cps,
  ping: Ping,
  keystrokes: Keystrokes,
  debug: Debug,
  coords: Coords,
  chat: Chat,
  scoreboard: Scoreboard,
  bossbar: Bossbar,
  potion: Potion,
  paperdoll: PaperDoll,
  armor: Armor
}

export function ModuleView(props: ViewProps & { id: string }) {
  const View = VIEWS[props.id]
  return View ? <View {...props} /> : null
}

export function OverlayCrosshair({ settings }: { settings: Settings }) {
  const o = settings.modules.crosshair.options
  const color = String(o.color ?? '#00ff88')
  const size = Number(o.size ?? 8)
  const gap = Number(o.gap ?? 3)
  const t = Number(o.thickness ?? 2)
  const outline = o.outline === true
  const dot = o.dot === true
  const bar = (style: CSSProperties) => (
    <div className="absolute" style={{ background: color, boxShadow: outline ? '0 0 0 1px rgba(0,0,0,0.85)' : undefined, ...style }} />
  )
  return (
    <div className="pointer-events-none absolute top-1/2 left-1/2" style={{ width: 0, height: 0 }}>
      {bar({ left: -t / 2, top: -gap - size, width: t, height: size })}
      {bar({ left: -t / 2, top: gap, width: t, height: size })}
      {bar({ top: -t / 2, left: -gap - size, height: t, width: size })}
      {bar({ top: -t / 2, left: gap, height: t, width: size })}
      {dot && bar({ left: -t / 2, top: -t / 2, width: t, height: t })}
    </div>
  )
}
