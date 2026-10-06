import { EventEmitter } from 'node:events'
import { CODE_TO_KEY, mouseKey } from '@shared/keys'

// Global input hook for YOUR OWN keyboard and mouse, used by keystrokes, CPS, the
// zoom key and the Right Shift menu.
//
// It only listens. uiohook-napi also has keyTap/keyToggle for sending input; this
// app never calls them (test/safety.test.ts fails the build if anything does).
// Only keys you've bound are passed on, nothing is stored, and nothing leaves the PC.

interface HookModule {
  uIOhook: EventEmitter & { start(): void; stop(): void }
}

export interface InputEvents {
  key: (key: string, down: boolean) => void
  wheel: (rotation: number) => void
}

export class InputService extends EventEmitter {
  private hook: HookModule['uIOhook'] | null = null
  private running = false
  private tracked = new Set<string>()
  private down = new Set<string>()
  private leftClicks: number[] = []
  private rightClicks: number[] = []
  error: string | null = null

  setTracked(keys: Iterable<string>): void {
    this.tracked = new Set(keys)
    for (const k of [...this.down]) if (!this.tracked.has(k)) this.down.delete(k)
  }

  start(): void {
    if (this.running) return
    try {
      // Loaded lazily so the launcher still opens if the native module can't load.
      const mod = require('uiohook-napi') as HookModule
      this.hook = mod.uIOhook
      this.hook.on('keydown', (e: { keycode: number }) => this.onKey(e.keycode, true))
      this.hook.on('keyup', (e: { keycode: number }) => this.onKey(e.keycode, false))
      this.hook.on('mousedown', (e: { button: unknown }) => this.onMouse(e.button, true))
      this.hook.on('mouseup', (e: { button: unknown }) => this.onMouse(e.button, false))
      this.hook.on('wheel', (e: { rotation: number }) => this.emit('wheel', e.rotation))
      this.hook.start()
      this.running = true
      this.error = null
    } catch (e) {
      this.error = `Input hook unavailable: ${(e as Error).message}`
      this.hook = null
    }
  }

  stop(): void {
    if (!this.running || !this.hook) return
    try {
      this.hook.stop()
    } catch {
      // already stopped
    }
    this.hook.removeAllListeners()
    this.running = false
    this.down.clear()
  }

  private onKey(code: number, isDown: boolean): void {
    const key = CODE_TO_KEY[code]
    if (!key || !this.tracked.has(key)) return
    // Holding a key repeats keydown; only pass on real changes.
    if (isDown === this.down.has(key)) return
    if (isDown) this.down.add(key)
    else this.down.delete(key)
    this.emit('key', key, isDown)
  }

  private onMouse(button: unknown, isDown: boolean): void {
    const key = mouseKey(button)
    if (!key) return
    if (isDown) {
      const now = Date.now()
      if (key === 'Mouse1') this.leftClicks.push(now)
      if (key === 'Mouse2') this.rightClicks.push(now)
    }
    if (!this.tracked.has(key)) return
    if (isDown === this.down.has(key)) return
    if (isDown) this.down.add(key)
    else this.down.delete(key)
    this.emit('key', key, isDown)
  }

  /** Clicks in the last second. */
  cps(): { left: number; right: number } {
    const cutoff = Date.now() - 1000
    this.leftClicks = this.leftClicks.filter((t) => t > cutoff)
    this.rightClicks = this.rightClicks.filter((t) => t > cutoff)
    return { left: this.leftClicks.length, right: this.rightClicks.length }
  }

  isDown(key: string): boolean {
    return this.down.has(key)
  }
}
