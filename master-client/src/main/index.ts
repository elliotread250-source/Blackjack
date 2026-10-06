import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { BrowserWindow, Menu, Tray, app, dialog, ipcMain, nativeImage, safeStorage, screen, shell } from 'electron'
import { CH, PACK_BANNER, type AuthUser, type BedrockStatus, type DisplayInfo, type PackApplyResult } from '@shared/ipc'
import { MODULES, affectsPacks } from '@shared/modules'
import { EXPORT_KIND, activePlacements, type SettingsExport } from '@shared/settings'
import type { DeepPartial, Settings } from '@shared/types'
import { AccountStore } from './auth/accounts'
import { AddonManager } from './addons/manager'
import { bedrockStatus, launchBedrock } from './bedrock'
import { fetchNews } from './news'
import { OverlayController } from './overlay/controller'
import { grantFrameAccess } from './overlay/presentmon'
import { PackEngine } from './packs/engine'
import { isGameRunning } from './bedrock'
import { MachineStore, SettingsStore } from './store'
import { Updater } from './updater'
import { OverlayWindow, createMainWindow } from './windows'

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
app.setAppUserModelId('com.masterclient.launcher')

const startHidden = process.argv.includes('--hidden')
const resourcesDir = app.isPackaged ? join(process.resourcesPath, 'resources') : join(app.getAppPath(), 'resources')
const addonsDir = app.isPackaged ? join(process.resourcesPath, 'addons') : join(app.getAppPath(), 'addons')

let mainWin: BrowserWindow | null = null
let tray: Tray | null = null
let quitting = false
let user: AuthUser | null = null
let accounts: AccountStore
let machine: MachineStore
let settings: SettingsStore
let overlay: OverlayWindow
let controller: OverlayController
let packs: PackEngine
let addons: AddonManager
let updater: Updater
let packTimer: NodeJS.Timeout | null = null
let lastPackKey = ''

function broadcast(channel: string, payload: unknown): void {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(channel, payload)
}

function appIcon(): Electron.NativeImage | undefined {
  const img = nativeImage.createFromPath(join(resourcesDir, 'icon.png'))
  return img.isEmpty() ? undefined : img
}

function showMain(): void {
  if (!mainWin || mainWin.isDestroyed()) mainWin = createMainWindowWithHandlers(true)
  if (mainWin.isMinimized()) mainWin.restore()
  mainWin.show()
  mainWin.focus()
}

function createMainWindowWithHandlers(show: boolean): BrowserWindow {
  const win = createMainWindow(appIcon(), show)
  win.on('close', (e) => {
    if (quitting) return
    if (user && settings.get().launcher.closeToTray) {
      e.preventDefault()
      win.hide()
      return
    }
    // The overlay window would otherwise keep the app alive with nothing to show.
    quitting = true
    app.quit()
  })
  win.on('closed', () => {
    mainWin = null
  })
  return win
}

// ------------------------------------------------------------------ packs
/** Everything that changes what the pack engine writes. Overlay-only changes don't count. */
function packKey(s: Settings): string {
  const modules = MODULES.filter((m) => affectsPacks(m.id)).map((m) => [m.id, s.modules[m.id]])
  const placements = Object.entries(activePlacements(s)).filter(([id]) => affectsPacks(id))
  return JSON.stringify({ modules, placements, accent: s.appearance.accent })
}

function schedulePackApply(force = false): void {
  if (!user) return
  const key = packKey(settings.get())
  if (!force && key === lastPackKey) return
  lastPackKey = key
  if (packTimer) clearTimeout(packTimer)
  packTimer = setTimeout(() => void applyPacks(), 700)
}

async function applyPacks(): Promise<PackApplyResult> {
  const s = settings.get()
  const status = await bedrockStatus(s)
  const result = await packs.apply(s, status)
  broadcast(CH.packsApplied, result)
  if (result.ok && result.changed) overlay.send(CH.overlayPackBanner, PACK_BANNER)
  return result
}

// ------------------------------------------------------------------ session
function applyLoginItem(s: Settings): void {
  if (process.platform !== 'win32' || !app.isPackaged) return
  app.setLoginItemSettings({ openAtLogin: s.launcher.startWithWindows, args: ['--hidden'] })
}

function onLogin(u: AuthUser): void {
  user = u
  const s = settings.load(u.id)
  controller.start(s)
  applyLoginItem(s)
  lastPackKey = ''
  schedulePackApply(true)
  buildTrayMenu()
}

function onLogout(): void {
  if (user) accounts.logOut(user.id)
  controller.stop()
  settings.unload()
  user = null
  buildTrayMenu()
}

function requireUser(): AuthUser {
  if (!user) throw new Error('Not signed in.')
  return user
}

function updateSettings(patch: DeepPartial<Settings> | null, replace?: unknown): Settings {
  requireUser()
  const prev = settings.get()
  const next = replace !== undefined ? settings.replace(replace) : settings.update(patch ?? {})
  broadcast(CH.settingsChanged, next)
  controller.apply(next)
  if (prev.launcher.startWithWindows !== next.launcher.startWithWindows) applyLoginItem(next)
  schedulePackApply()
  return next
}

// ------------------------------------------------------------------ tray
function buildTrayMenu(): void {
  if (!tray) return
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Master Client', click: showMain },
      { label: 'Play Minecraft', enabled: !!user, click: () => user && void launchBedrock(settings.get()) },
      { label: 'Toggle overlay menu', enabled: !!user, click: () => controller.toggleMenu() },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          quitting = true
          app.quit()
        }
      }
    ])
  )
}

// ------------------------------------------------------------------ IPC
function saveDialog(opts: Electron.SaveDialogOptions): Promise<Electron.SaveDialogReturnValue> {
  return mainWin ? dialog.showSaveDialog(mainWin, opts) : dialog.showSaveDialog(opts)
}

function openDialog(opts: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue> {
  return mainWin ? dialog.showOpenDialog(mainWin, opts) : dialog.showOpenDialog(opts)
}

function registerIpc(): void {
  // Arguments arrive from the renderer untyped; every handler coerces what it uses.
  const handle = (ch: string, fn: (...args: any[]) => unknown) => ipcMain.handle(ch, (_e, ...args) => fn(...args))

  handle(CH.authSession, () => user)
  handle(CH.authSignUp, async (u: string, p: string, remember: boolean) => {
    const r = await accounts.signUp(String(u ?? ''), String(p ?? ''), remember === true)
    if (r.ok) onLogin(r.user)
    return r
  })
  handle(CH.authLogIn, async (u: string, p: string, remember: boolean) => {
    const r = await accounts.logIn(String(u ?? ''), String(p ?? ''), remember === true)
    if (r.ok) onLogin(r.user)
    return r
  })
  handle(CH.authLogOut, () => onLogout())
  handle(CH.authReset, (u: string, code: string, p: string) => accounts.resetPassword(String(u ?? ''), String(code ?? ''), String(p ?? '')))

  handle(CH.settingsGet, () => {
    requireUser()
    return settings.get()
  })
  handle(CH.settingsUpdate, (patch: DeepPartial<Settings>) => updateSettings(patch))
  handle(CH.settingsReplace, (next: unknown) => updateSettings(null, next))
  handle(CH.settingsExport, async () => {
    requireUser()
    const r = await saveDialog({
      title: 'Export Master Client settings',
      defaultPath: 'master-client-settings.json',
      filters: [{ name: 'Master Client settings', extensions: ['json'] }]
    })
    if (r.canceled || !r.filePath) return { ok: false }
    const data: SettingsExport = { kind: EXPORT_KIND, exportedAt: new Date().toISOString(), appVersion: app.getVersion(), settings: settings.get() }
    writeFileSync(r.filePath, JSON.stringify(data, null, 2))
    return { ok: true, path: r.filePath }
  })
  handle(CH.settingsImport, async () => {
    requireUser()
    const r = await openDialog({
      title: 'Import Master Client settings',
      properties: ['openFile'],
      filters: [{ name: 'Master Client settings', extensions: ['json'] }]
    })
    if (r.canceled || !r.filePaths[0]) return { ok: false }
    try {
      if (statSync(r.filePaths[0]).size > 5 * 1024 * 1024) return { ok: false, error: 'That file is too large to be a settings export.' }
      const data = JSON.parse(readFileSync(r.filePaths[0], 'utf8')) as Partial<SettingsExport>
      if (data.kind !== EXPORT_KIND || !data.settings) return { ok: false, error: "That isn't a Master Client settings export." }
      // Imported add-on records point at packs on another PC; keep this PC's own.
      const merged = { ...data.settings, imported: settings.get().imported }
      return { ok: true, settings: updateSettings(null, merged) }
    } catch (e) {
      return { ok: false, error: `Couldn't read that file: ${(e as Error).message}` }
    }
  })

  handle(CH.bedrockStatus, (refresh?: boolean) => bedrockStatus(settings.get(), refresh === true))
  handle(CH.bedrockLaunch, async () => {
    const s = settings.get()
    requireUser()
    const r = await launchBedrock(s)
    if (r.ok && s.launcher.minimizeToTrayOnLaunch && mainWin) mainWin.hide()
    return r
  })
  handle(CH.bedrockOpenFolder, async (which: 'data' | 'devRp' | 'devBp') => {
    const st = await bedrockStatus(settings.get())
    if (!st.sharedRoot) return
    const sub = which === 'devRp' ? 'development_resource_packs' : which === 'devBp' ? 'development_behavior_packs' : ''
    await shell.openPath(sub ? join(st.sharedRoot, sub) : st.sharedRoot)
  })
  handle(CH.bedrockChooseFolder, async () => {
    const r = await openDialog({ title: 'Choose the com.mojang folder', properties: ['openDirectory'] })
    return r.canceled ? null : (r.filePaths[0] ?? null)
  })

  handle(CH.packsApply, () => {
    requireUser()
    return applyPacks()
  })
  handle(CH.packsStatus, async () => packs.status(await bedrockStatus(settings.get())))

  const withBedrock = async (): Promise<BedrockStatus> => {
    requireUser()
    return bedrockStatus(settings.get())
  }
  handle(CH.addonsList, () => {
    requireUser()
    return addons.list(settings.get())
  })
  handle(CH.addonsSetEnabled, async (id: string, enabled: boolean) => {
    const st = await withBedrock()
    addons.setEnabled(settings.get(), st, String(id), enabled === true)
    updateSettings({ addons: { [String(id)]: { enabled: enabled === true } } })
    return addons.list(settings.get())
  })
  handle(CH.addonsRemove, async (id: string) => {
    const st = await withBedrock()
    addons.remove(settings.get(), st, String(id))
    const s = settings.get()
    const rest = Object.fromEntries(Object.entries(s.addons).filter(([k]) => k !== id))
    updateSettings(null, { ...s, imported: s.imported.filter((p) => p.id !== id), addons: rest })
    return addons.list(settings.get())
  })
  handle(CH.addonsImport, async () => {
    const st = await withBedrock()
    const r = await openDialog({
      title: 'Import a Bedrock add-on',
      properties: ['openFile'],
      filters: [{ name: 'Bedrock add-ons', extensions: ['mcpack', 'mcaddon', 'zip'] }]
    })
    if (r.canceled || !r.filePaths[0]) return { ok: false, cancelled: true }
    const file = r.filePaths[0]
    if (statSync(file).size > 300 * 1024 * 1024) return { ok: false, error: 'That file is over 300 MB.' }
    const result = await addons.importArchive(readFileSync(file), file.split(/[\\/]/).pop() ?? 'pack', settings.get(), st)
    if (result.ok && result.packs) {
      const s = settings.get()
      const ids = new Set(result.packs.map((p) => p.id))
      updateSettings(null, {
        ...s,
        imported: [...s.imported.filter((p) => !ids.has(p.id)), ...result.packs],
        addons: { ...s.addons, ...Object.fromEntries(result.packs.map((p) => [p.id, { enabled: true }])) }
      })
    }
    return result
  })

  handle(CH.overlayToggleMenu, () => controller.toggleMenu())
  handle(CH.overlayCloseMenu, () => controller.closeMenu())
  handle(CH.overlayOpenEditor, () => controller.openEditor())
  handle(CH.overlayGrantFrameAccess, () => grantFrameAccess())
  handle(CH.overlayDisplays, (): DisplayInfo[] => {
    const primary = screen.getPrimaryDisplay().id
    return screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: `${d.label || `Display ${i + 1}`} (${d.size.width}x${d.size.height})`,
      primary: d.id === primary,
      bounds: d.bounds,
      scaleFactor: d.scaleFactor
    }))
  })
  ipcMain.on(CH.overlaySetCaptureActive, (_e, active: boolean) => overlay.setCaptureActive(active === true))
  // Only the overlay window may ask for a screen to capture.
  ipcMain.handle(CH.overlayCaptureSource, (e) => (overlay.win && e.sender === overlay.win.webContents ? overlay.captureSourceId() : null))

  handle(CH.appVersion, () => app.getVersion())
  ipcMain.on(CH.appMinimize, (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
  ipcMain.on(CH.appToggleMaximize, (e) => {
    const w = BrowserWindow.fromWebContents(e.sender)
    if (w) w.isMaximized() ? w.unmaximize() : w.maximize()
  })
  ipcMain.on(CH.appClose, (e) => BrowserWindow.fromWebContents(e.sender)?.close())
  handle(CH.appOpenExternal, async (url: string) => {
    if (typeof url === 'string' && url.startsWith('https://')) await shell.openExternal(url)
  })
  handle(CH.appUpdateStatus, () => updater.status)
  handle(CH.appCheckForUpdates, () => updater.check())
  handle(CH.appInstallUpdate, () => {
    quitting = true
    updater.install()
  })
  handle(CH.appFirstRun, () => ({ showPinTip: process.platform === 'win32' && !machine.get().pinTipShown }))
  handle(CH.appDismissPinTip, () => {
    machine.set({ pinTipShown: true })
  })
  handle(CH.appNews, () => fetchNews(app.getVersion()))
}

// ------------------------------------------------------------------ startup
app.on('second-instance', () => showMain())

app.whenReady().then(async () => {
  const userData = app.getPath('userData')
  machine = new MachineStore(join(userData, 'machine.json'))
  settings = new SettingsStore(userData)
  accounts = await AccountStore.open({
    file: join(userData, 'accounts.sqlite'),
    sessionFile: join(userData, 'session.bin'),
    wasmBinary: readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm')),
    box: {
      available: () => safeStorage.isEncryptionAvailable(),
      encrypt: (s) => safeStorage.encryptString(s),
      decrypt: (b) => safeStorage.decryptString(b)
    }
  })
  overlay = new OverlayWindow()
  controller = new OverlayController(overlay, broadcast)
  packs = new PackEngine(machine, isGameRunning)
  addons = new AddonManager(addonsDir, join(userData, 'imported-packs'))
  updater = new Updater((u) => broadcast(CH.appUpdate, u))
  registerIpc()

  const remembered = accounts.restoreSession()
  if (remembered) onLogin(remembered)

  mainWin = createMainWindowWithHandlers(!(startHidden && remembered))
  const icon = appIcon()
  if (icon) {
    tray = new Tray(icon.resize({ width: 16, height: 16 }))
    tray.setToolTip('Master Client')
    tray.on('double-click', showMain)
    buildTrayMenu()
  }
  updater.start()
})

app.on('before-quit', () => {
  quitting = true
})

app.on('window-all-closed', () => {
  // With close-to-tray the app keeps running in the tray for the overlay.
  if (quitting || !user || !settings.get().launcher.closeToTray) app.quit()
})

app.on('will-quit', () => {
  controller?.stop()
  accounts?.close()
})
