import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { CH, type MasterApi, type Unsubscribe } from '@shared/ipc'

// The only bridge between the pages and the main process. Pages get these
// functions and nothing else: no Node, no ipcRenderer, no file system.

function listen<T>(channel: string, cb: (payload: T) => void): Unsubscribe {
  const fn = (_e: IpcRendererEvent, payload: T) => cb(payload)
  ipcRenderer.on(channel, fn)
  return () => ipcRenderer.removeListener(channel, fn)
}

const invoke = <T>(channel: string, ...args: unknown[]): Promise<T> => ipcRenderer.invoke(channel, ...args) as Promise<T>

const api: MasterApi = {
  platform: process.platform,
  auth: {
    session: () => invoke(CH.authSession),
    signUp: (u, p, r) => invoke(CH.authSignUp, u, p, r),
    logIn: (u, p, r) => invoke(CH.authLogIn, u, p, r),
    logOut: () => invoke(CH.authLogOut),
    reset: (u, c, p) => invoke(CH.authReset, u, c, p)
  },
  settings: {
    get: () => invoke(CH.settingsGet),
    update: (patch) => invoke(CH.settingsUpdate, patch),
    replace: (next) => invoke(CH.settingsReplace, next),
    exportFile: () => invoke(CH.settingsExport),
    importFile: () => invoke(CH.settingsImport),
    onChange: (cb) => listen(CH.settingsChanged, cb)
  },
  bedrock: {
    status: (refresh) => invoke(CH.bedrockStatus, refresh),
    launch: () => invoke(CH.bedrockLaunch),
    openFolder: (which) => invoke(CH.bedrockOpenFolder, which),
    chooseFolder: () => invoke(CH.bedrockChooseFolder)
  },
  packs: {
    apply: () => invoke(CH.packsApply),
    status: () => invoke(CH.packsStatus),
    onApplied: (cb) => listen(CH.packsApplied, cb)
  },
  addons: {
    list: () => invoke(CH.addonsList),
    setEnabled: (id, enabled) => invoke(CH.addonsSetEnabled, id, enabled),
    importFile: () => invoke(CH.addonsImport),
    remove: (id) => invoke(CH.addonsRemove, id)
  },
  overlay: {
    toggleMenu: () => invoke(CH.overlayToggleMenu),
    closeMenu: () => invoke(CH.overlayCloseMenu),
    openEditor: () => invoke(CH.overlayOpenEditor),
    displays: () => invoke(CH.overlayDisplays),
    grantFrameAccess: () => invoke(CH.overlayGrantFrameAccess),
    setCaptureActive: (active) => ipcRenderer.send(CH.overlaySetCaptureActive, active),
    captureSourceId: () => invoke(CH.overlayCaptureSource),
    onMetrics: (cb) => listen(CH.overlayMetrics, cb),
    onInput: (cb) => listen(CH.overlayInput, cb),
    onMenu: (cb) => listen(CH.overlayMenu, cb),
    onZoom: (cb) => listen(CH.overlayZoom, cb),
    onPackBanner: (cb) => listen(CH.overlayPackBanner, cb)
  },
  app: {
    version: () => invoke(CH.appVersion),
    minimize: () => ipcRenderer.send(CH.appMinimize),
    toggleMaximize: () => ipcRenderer.send(CH.appToggleMaximize),
    close: () => ipcRenderer.send(CH.appClose),
    openExternal: (url) => invoke(CH.appOpenExternal, url),
    updateStatus: () => invoke(CH.appUpdateStatus),
    checkForUpdates: () => invoke(CH.appCheckForUpdates),
    installUpdate: () => invoke(CH.appInstallUpdate),
    onUpdate: (cb) => listen(CH.appUpdate, cb),
    firstRun: () => invoke(CH.appFirstRun),
    dismissPinTip: () => invoke(CH.appDismissPinTip),
    news: () => invoke(CH.appNews)
  }
}

contextBridge.exposeInMainWorld('mc', api)
