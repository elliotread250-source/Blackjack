import { join } from 'node:path'
import { BrowserWindow, type Display, type NativeImage, app, desktopCapturer, screen, session, shell } from 'electron'

const preload = join(__dirname, '../preload/index.js')

function loadPage(win: BrowserWindow, page: 'index' | 'overlay'): void {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (!app.isPackaged && devUrl) void win.loadURL(`${devUrl}/${page}.html`)
  else void win.loadFile(join(__dirname, `../renderer/${page}.html`))
}

/** No new windows and no navigation away from the app; https links open in the browser. */
function harden(win: BrowserWindow): void {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) void shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, url) => {
    const devUrl = process.env.ELECTRON_RENDERER_URL
    if (!(devUrl && url.startsWith(devUrl))) e.preventDefault()
  })
}

export function createMainWindow(icon: NativeImage | undefined, show: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 790,
    minWidth: 1060,
    minHeight: 680,
    show: false,
    frame: false,
    backgroundColor: '#0a0a0f',
    title: 'Master Client',
    icon,
    webPreferences: { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: false }
  })
  harden(win)
  win.once('ready-to-show', () => {
    if (show) win.show()
  })
  loadPage(win, 'index')
  return win
}

export class OverlayWindow {
  win: BrowserWindow | null = null
  private display: Display | null = null
  private menuOpen = false
  private visible = false
  private capture = false

  constructor() {
    // The zoom module captures the screen the overlay is on. Only the overlay may ask.
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
      const main = this.win?.webContents.mainFrame
      const from = request.frame
      if (!main || !from || from.processId !== main.processId || from.routingId !== main.routingId) {
        callback({})
        return
      }
      const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
      const id = String(this.display?.id ?? '')
      const source = sources.find((s) => s.display_id === id) ?? sources[0]
      callback(source ? { video: source } : {})
    })
  }

  ensure(displayId: number | null): BrowserWindow {
    const display = screen.getAllDisplays().find((d) => d.id === displayId) ?? screen.getPrimaryDisplay()
    if (this.win && !this.win.isDestroyed()) {
      if (this.display?.id !== display.id || JSON.stringify(this.display.bounds) !== JSON.stringify(display.bounds)) {
        this.win.setBounds(display.bounds)
        this.display = display
      }
      return this.win
    }
    this.display = display
    const win = new BrowserWindow({
      ...display.bounds,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      alwaysOnTop: true,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      movable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      hasShadow: false,
      title: 'Master Client Overlay',
      webPreferences: { preload, sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, spellcheck: false }
    })
    harden(win)
    win.setAlwaysOnTop(true, 'screen-saver')
    win.setIgnoreMouseEvents(true, { forward: true })
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    loadPage(win, 'overlay')
    win.on('closed', () => {
      this.win = null
    })
    this.win = win
    return win
  }

  setVisible(visible: boolean): void {
    if (!this.win) return
    const want = visible || this.menuOpen
    if (want === this.visible) return
    this.visible = want
    if (want) this.win.showInactive()
    else this.win.hide()
  }

  setMenuOpen(open: boolean): void {
    if (!this.win) return
    this.menuOpen = open
    if (open) {
      this.win.setIgnoreMouseEvents(false)
      this.win.setFocusable(true)
      this.win.show()
      this.win.focus()
      this.visible = true
    } else {
      this.win.setIgnoreMouseEvents(true, { forward: true })
      this.win.setFocusable(false)
      this.win.blur()
    }
  }

  get isMenuOpen(): boolean {
    return this.menuOpen
  }

  async captureSourceId(): Promise<string | null> {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } })
    const id = String(this.display?.id ?? '')
    return (sources.find((s) => s.display_id === id) ?? sources[0])?.id ?? null
  }

  /** While zoom's capture runs, hide the overlay from screen capture so it doesn't zoom into itself. */
  setCaptureActive(active: boolean): void {
    if (!this.win || active === this.capture) return
    this.capture = active
    this.win.setContentProtection(active)
  }

  send(channel: string, payload: unknown): void {
    if (this.win && !this.win.isDestroyed()) this.win.webContents.send(channel, payload)
  }

  destroy(): void {
    if (this.win && !this.win.isDestroyed()) this.win.destroy()
    this.win = null
    this.menuOpen = false
    this.visible = false
  }
}
