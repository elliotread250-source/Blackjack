import { join } from 'node:path'
import { app, globalShortcut } from 'electron'
import { CH, type MenuState, type Metrics, type ZoomState } from '@shared/ipc'
import { isAccelerator } from '@shared/keys'
import type { Settings } from '@shared/types'
import { isGameRunning } from '../bedrock'
import type { OverlayWindow } from '../windows'
import { InputService } from './input'
import { PingService } from './ping'
import { FrameStats } from './presentmon'
import { SystemStats } from './sysinfo'

export function presentMonPath(): string {
  return app.isPackaged ? join(process.resourcesPath, 'resources', 'bin', 'PresentMon.exe') : join(app.getAppPath(), 'resources', 'bin', 'PresentMon.exe')
}

const on = (s: Settings, id: string) => s.modules[id]?.enabled === true
const opt = <T>(s: Settings, id: string, key: string): T => s.modules[id]?.options[key] as T

/**
 * Runs everything behind the overlay engine: the input hook, PresentMon, the
 * external ping, system stats, zoom state and the menu hotkey. Pushes metrics
 * to every window a few times a second.
 */
export class OverlayController {
  readonly input = new InputService()
  readonly frames = new FrameStats(presentMonPath)
  readonly ping = new PingService()
  readonly system = new SystemStats()
  private settings: Settings | null = null
  private metricsTimer: NodeJS.Timeout | null = null
  private gameTimer: NodeJS.Timeout | null = null
  private gameRunning = false
  private accelerator: string | null = null
  private zoom: ZoomState = { active: false, level: 4 }
  private menu: MenuState = { open: false, view: 'menu' }

  constructor(
    private readonly overlay: OverlayWindow,
    private readonly broadcast: (channel: string, payload: unknown) => void
  ) {
    this.input.on('key', (key: string, down: boolean) => this.onKey(key, down))
    this.input.on('wheel', (rotation: number) => this.onWheel(rotation))
  }

  start(s: Settings): void {
    this.apply(s)
    if (!this.metricsTimer) this.metricsTimer = setInterval(() => this.pushMetrics(), 200)
    if (!this.gameTimer) {
      const poll = async () => {
        this.gameRunning = await isGameRunning().catch(() => false)
        this.updateVisibility()
      }
      void poll()
      this.gameTimer = setInterval(() => void poll(), 3000)
    }
  }

  stop(): void {
    if (this.metricsTimer) clearInterval(this.metricsTimer)
    if (this.gameTimer) clearInterval(this.gameTimer)
    this.metricsTimer = null
    this.gameTimer = null
    this.input.stop()
    this.frames.stop()
    this.ping.stop()
    this.system.stop()
    if (this.accelerator) globalShortcut.unregister(this.accelerator)
    this.accelerator = null
    this.overlay.destroy()
    this.settings = null
  }

  /** Called whenever settings change. Starts or stops only what's needed. */
  apply(s: Settings): void {
    this.settings = s
    if (s.overlay.enabled) this.overlay.ensure(s.overlay.displayId)
    else this.overlay.destroy()

    // Keys the hook passes on. Everything else is ignored at the source.
    const tracked = new Set<string>()
    if (on(s, 'keystrokes')) {
      for (const k of ['forward', 'left', 'back', 'right', 'jump', 'sneak']) tracked.add(String(opt(s, 'keystrokes', k)))
      tracked.add('Mouse1')
      tracked.add('Mouse2')
    }
    if (on(s, 'zoom')) tracked.add(String(opt(s, 'zoom', 'key') ?? 'C'))
    const menuKey = s.hotkeys.menu
    if (!isAccelerator(menuKey)) tracked.add(menuKey)
    this.input.setTracked(tracked)

    // CPS counts every click, so the hook runs whenever anything needs input.
    const needInput = tracked.size > 0 || on(s, 'cps') || (on(s, 'debug') && opt(s, 'debug', 'cps') !== false)
    if (needInput) this.input.start()
    else this.input.stop()

    // Menu hotkey as an accelerator (e.g. Alt+M). Single keys like Right Shift go through the hook,
    // since Electron accelerators can't bind a modifier on its own.
    if (this.accelerator && this.accelerator !== menuKey) {
      globalShortcut.unregister(this.accelerator)
      this.accelerator = null
    }
    if (isAccelerator(menuKey) && this.accelerator !== menuKey) {
      try {
        if (globalShortcut.register(menuKey, () => this.toggleMenu())) this.accelerator = menuKey
      } catch {
        this.accelerator = null
      }
    }

    const needFps = on(s, 'fps') || (on(s, 'debug') && (opt(s, 'debug', 'fps') !== false || opt(s, 'debug', 'frametime') !== false))
    this.frames.windowSec = Number(opt(s, 'fps', 'smoothing') ?? 1)
    if (needFps) this.frames.start()
    else this.frames.stop()

    const needPing = on(s, 'ping') || (on(s, 'debug') && opt(s, 'debug', 'ping') !== false)
    this.ping.configure(s.server.address, s.server.port, Number(opt(s, 'ping', 'interval') ?? 2), needPing)

    if (on(s, 'debug')) this.system.start()
    else this.system.stop()

    if (!on(s, 'zoom') && this.zoom.active) this.setZoom({ ...this.zoom, active: false })
    else if (!this.zoom.active) this.zoom.level = Number(opt(s, 'zoom', 'level') ?? 4)

    this.updateVisibility()
  }

  private updateVisibility(): void {
    const s = this.settings
    if (!s || !s.overlay.enabled) return
    this.overlay.setVisible(this.gameRunning || s.overlay.showWhenGameNotRunning)
  }

  toggleMenu(view: MenuState['view'] = 'menu'): void {
    if (!this.settings?.overlay.enabled) return
    const open = !(this.menu.open && this.menu.view === view)
    this.setMenu({ open, view })
  }

  openEditor(): void {
    if (!this.settings?.overlay.enabled) return
    this.setMenu({ open: true, view: 'editor' })
  }

  closeMenu(): void {
    this.setMenu({ open: false, view: 'menu' })
  }

  private setMenu(m: MenuState): void {
    this.menu = m
    this.overlay.ensure(this.settings?.overlay.displayId ?? null)
    this.overlay.setMenuOpen(m.open)
    this.overlay.send(CH.overlayMenu, m)
    this.updateVisibility()
  }

  private onKey(key: string, down: boolean): void {
    const s = this.settings
    if (!s) return
    this.broadcast(CH.overlayInput, { key, down })
    if (down && key === s.hotkeys.menu) this.toggleMenu()
    if (on(s, 'zoom') && key === String(opt(s, 'zoom', 'key') ?? 'C') && !this.menu.open) {
      const mode = opt<string>(s, 'zoom', 'mode') ?? 'hold'
      if (mode === 'hold') this.setZoom({ active: down, level: down ? Number(opt(s, 'zoom', 'level') ?? 4) : this.zoom.level })
      else if (down) this.setZoom({ active: !this.zoom.active, level: Number(opt(s, 'zoom', 'level') ?? 4) })
    }
  }

  private onWheel(rotation: number): void {
    const s = this.settings
    if (!s || !this.zoom.active || opt(s, 'zoom', 'scroll') === false) return
    const factor = rotation < 0 ? 1.15 : 1 / 1.15
    this.setZoom({ active: true, level: Math.max(1.25, Math.min(20, this.zoom.level * factor)) })
  }

  private setZoom(z: ZoomState): void {
    this.zoom = z
    this.overlay.send(CH.overlayZoom, z)
  }

  metrics(): Metrics {
    const s = this.settings
    const f = this.frames.read(this.gameRunning)
    const cps = this.input.cps()
    const sys = s && on(s, 'debug') ? this.system.sample() : { cpu: null, gpu: null, ram: null }
    return {
      fps: f.fps,
      frameTime: f.frameTime,
      fpsStatus: f.status,
      fpsMessage: f.message,
      ping: this.ping.ping,
      pingStatus: this.ping.status,
      pingMethod: this.ping.method,
      serverMotd: this.ping.motd,
      cpsLeft: cps.left,
      cpsRight: cps.right,
      cpu: sys.cpu,
      gpu: sys.gpu,
      ram: sys.ram,
      gameRunning: this.gameRunning
    }
  }

  private pushMetrics(): void {
    this.broadcast(CH.overlayMetrics, this.metrics())
  }
}
