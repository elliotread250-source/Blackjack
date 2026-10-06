import { app } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateStatus } from '@shared/ipc'

// Checks the GitHub Releases that the release workflow publishes (latest.yml)
// and installs the new version on quit, or right away from Settings.

const { autoUpdater } = electronUpdater

export class Updater {
  status: UpdateStatus = { state: app.isPackaged ? 'idle' : 'dev' }
  private timer: NodeJS.Timeout | null = null

  constructor(private readonly onStatus: (s: UpdateStatus) => void) {
    if (!app.isPackaged) return
    autoUpdater.autoDownload = true
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.on('checking-for-update', () => this.set({ state: 'checking' }))
    autoUpdater.on('update-available', (i) => this.set({ state: 'available', version: i.version }))
    autoUpdater.on('update-not-available', () => this.set({ state: 'none' }))
    autoUpdater.on('download-progress', (p) => this.set({ state: 'downloading', version: this.status.version, progress: Math.round(p.percent) }))
    autoUpdater.on('update-downloaded', (i) => this.set({ state: 'downloaded', version: i.version }))
    autoUpdater.on('error', (e) => this.set({ state: 'error', error: e?.message ?? String(e) }))
  }

  private set(s: UpdateStatus): void {
    this.status = s
    this.onStatus(s)
  }

  start(): void {
    if (!app.isPackaged) return
    void this.check()
    this.timer = setInterval(() => void this.check(), 6 * 60 * 60 * 1000)
  }

  async check(): Promise<UpdateStatus> {
    if (!app.isPackaged) return this.status
    try {
      await autoUpdater.checkForUpdates()
    } catch (e) {
      this.set({ state: 'error', error: (e as Error).message })
    }
    return this.status
  }

  install(): void {
    if (this.status.state === 'downloaded') autoUpdater.quitAndInstall()
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
  }
}
