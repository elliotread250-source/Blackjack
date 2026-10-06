import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createInterface } from 'node:readline'
import type { FpsStatus } from '@shared/ipc'
import { GAME_PROCESS } from '../bedrock/paths'
import { run } from '../bedrock'

// Frame timing for Minecraft from PresentMon (Intel/GameTechDev, MIT), which
// reads Windows' own ETW present events. Nothing is read from the game process.
// Windows only allows admins or members of "Performance Log Users" to start an
// ETW session, so a normal user hits "no-permission" until they grant it once.

export class FrameStats {
  private proc: ChildProcess | null = null
  private samples: { t: number; ms: number }[] = []
  private col = -1
  private wanted = false
  private restartTimer: NodeJS.Timeout | null = null
  status: FpsStatus = 'off'
  message: string | undefined
  windowSec = 1

  constructor(private readonly exePath: () => string) {}

  start(): void {
    this.wanted = true
    if (this.proc) return
    if (process.platform !== 'win32') {
      this.status = 'unsupported'
      this.message = 'FPS needs Windows.'
      return
    }
    const exe = this.exePath()
    if (!existsSync(exe)) {
      this.status = 'missing'
      this.message = 'PresentMon.exe is missing. Reinstall Master Client.'
      return
    }
    this.status = 'starting'
    this.col = -1
    const proc = spawn(
      exe,
      ['--process_name', GAME_PROCESS, '--output_stdout', '--stop_existing_session', '--session_name', 'MasterClientFrameStats'],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    this.proc = proc
    let stderr = ''
    proc.stderr?.on('data', (d) => {
      stderr += String(d)
      if (stderr.length > 4000) stderr = stderr.slice(-4000)
    })
    createInterface({ input: proc.stdout! }).on('line', (line) => this.onLine(line))
    proc.on('error', (e) => {
      this.status = 'error'
      this.message = e.message
    })
    proc.on('exit', (code) => {
      this.proc = null
      const text = stderr.toLowerCase()
      if (/access (is )?denied|administrator|elevat|performance log users/.test(text)) {
        this.status = 'no-permission'
        this.message = 'Windows blocked frame timing. Use "Allow FPS reading" in Settings, then sign out and back in.'
      } else if (this.wanted) {
        this.status = 'error'
        this.message = stderr.trim().split('\n').pop() || `PresentMon stopped (code ${code}).`
      }
      if (this.wanted) this.scheduleRestart(this.status === 'no-permission' ? 30_000 : 5_000)
    })
  }

  private scheduleRestart(ms: number): void {
    if (this.restartTimer) return
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null
      if (this.wanted) this.start()
    }, ms)
  }

  stop(): void {
    this.wanted = false
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.restartTimer = null
    this.proc?.kill()
    this.proc = null
    this.samples = []
    this.status = 'off'
  }

  private onLine(line: string): void {
    const cells = line.split(',')
    if (this.col < 0) {
      // Header row. PresentMon 2.x calls it FrameTime; 1.x and --v1_metrics call it msBetweenPresents.
      const lower = cells.map((c) => c.trim().toLowerCase())
      this.col = lower.indexOf('frametime')
      if (this.col < 0) this.col = lower.indexOf('msbetweenpresents')
      return
    }
    const ms = Number(cells[this.col])
    if (!Number.isFinite(ms) || ms <= 0 || ms > 2000) return
    const t = Date.now()
    this.samples.push({ t, ms })
    if (this.samples.length > 4000) this.samples.splice(0, this.samples.length - 4000)
    this.status = 'ok'
    this.message = undefined
  }

  read(gameRunning: boolean): { fps: number | null; frameTime: number | null; status: FpsStatus; message?: string } {
    const cutoff = Date.now() - this.windowSec * 1000
    this.samples = this.samples.filter((s) => s.t >= cutoff)
    if (this.status === 'ok' || this.status === 'starting' || this.status === 'waiting-for-game') {
      if (this.samples.length === 0) {
        if (this.proc) this.status = gameRunning ? 'starting' : 'waiting-for-game'
        return { fps: null, frameTime: null, status: this.status, message: this.message }
      }
      const avg = this.samples.reduce((a, s) => a + s.ms, 0) / this.samples.length
      return { fps: Math.round(1000 / avg), frameTime: Math.round(avg * 100) / 100, status: 'ok' }
    }
    return { fps: null, frameTime: null, status: this.status, message: this.message }
  }
}

/**
 * Adds the signed-in Windows user to Performance Log Users (well-known SID
 * S-1-5-32-559, so it works on non-English Windows). Shows a UAC prompt.
 */
export async function grantFrameAccess(): Promise<{ ok: boolean; error?: string }> {
  if (process.platform !== 'win32') return { ok: false, error: 'Windows only.' }
  const member = `${process.env.USERDOMAIN ?? ''}\\${process.env.USERNAME ?? ''}`.replace(/'/g, "''")
  const inner = `Add-LocalGroupMember -SID 'S-1-5-32-559' -Member '${member}' -ErrorAction SilentlyContinue`
  const r = await run(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `try { $p = Start-Process powershell.exe -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList '-NoProfile','-Command',"${inner.replace(/"/g, '`"')}"; exit $p.ExitCode } catch { exit 1223 }`
    ],
    120_000
  )
  if (r.code === 1223) return { ok: false, error: 'The Windows permission prompt was cancelled.' }
  if (r.code !== 0) return { ok: false, error: r.stderr.trim() || `Couldn't change the group (code ${r.code}).` }
  return { ok: true }
}
