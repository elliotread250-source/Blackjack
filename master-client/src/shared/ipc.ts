import type { DeepPartial, ImportedPack, Settings } from './types'

export interface AuthUser {
  id: number
  username: string
  createdAt: number
}

export type AuthResult = { ok: true; user: AuthUser; recoveryCode?: string } | { ok: false; error: string }

export type GameLayout = 'gdk' | 'uwp' | 'override'

export interface FolderCandidate {
  path: string
  layout: 'gdk' | 'uwp'
  exists: boolean
}

export interface BedrockStatus {
  platformSupported: boolean
  installed: boolean
  edition: 'release' | 'preview'
  packageFound: boolean
  protocolRegistered: boolean
  running: boolean
  layout: GameLayout | null
  /** com.mojang folder that holds development_*_packs. */
  sharedRoot: string | null
  /** com.mojang folders whose minecraftpe/global_resource_packs.json gets Master Client added. */
  userRoots: string[]
  candidates: FolderCandidate[]
  error?: string
}

export interface LaunchResult {
  ok: boolean
  method?: 'protocol' | 'appsfolder'
  error?: string
}

export interface PackApplyResult {
  ok: boolean
  version: [number, number, number]
  changed: boolean
  rpPath?: string
  bpPath?: string
  gameRunning: boolean
  globalListChanged: boolean
  warnings: string[]
  error?: string
}

export interface PackStatus {
  installed: boolean
  version: [number, number, number] | null
  lastAppliedAt: number | null
  pending: boolean
}

export interface AddonInfo {
  id: string
  name: string
  description: string
  kind: 'resources' | 'data' | 'addon'
  icon: string | null
  enabled: boolean
  builtin: boolean
  perWorld: boolean
  hasScripts: boolean
  version: string
  details: string[]
}

export interface ImportResult {
  ok: boolean
  packs?: ImportedPack[]
  error?: string
  problems?: string[]
  cancelled?: boolean
}

export type FpsStatus = 'ok' | 'starting' | 'waiting-for-game' | 'no-permission' | 'missing' | 'off' | 'unsupported' | 'error'
export type PingStatus = 'ok' | 'no-address' | 'timeout' | 'error' | 'off'

export interface Metrics {
  fps: number | null
  frameTime: number | null
  fpsStatus: FpsStatus
  fpsMessage?: string
  ping: number | null
  pingStatus: PingStatus
  pingMethod?: 'raknet' | 'icmp'
  serverMotd?: string
  cpsLeft: number
  cpsRight: number
  cpu: number | null
  gpu: number | null
  ram: { used: number; total: number } | null
  gameRunning: boolean
}

export interface InputEvent {
  key: string
  down: boolean
}

export interface ZoomState {
  active: boolean
  level: number
}

export interface MenuState {
  open: boolean
  view: 'menu' | 'editor'
}

export type UpdateState = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'none' | 'error' | 'dev'

export interface UpdateStatus {
  state: UpdateState
  version?: string
  progress?: number
  error?: string
}

export interface DisplayInfo {
  id: number
  label: string
  primary: boolean
  bounds: { x: number; y: number; width: number; height: number }
  scaleFactor: number
}

export interface NewsItem {
  id: string
  title: string
  date: string
  body: string
  url?: string
  tag: 'release' | 'tip' | 'notice'
}

export interface Unsubscribe {
  (): void
}

export interface MasterApi {
  platform: string
  auth: {
    session(): Promise<AuthUser | null>
    signUp(username: string, password: string, remember: boolean): Promise<AuthResult>
    logIn(username: string, password: string, remember: boolean): Promise<AuthResult>
    logOut(): Promise<void>
    reset(username: string, recoveryCode: string, newPassword: string): Promise<AuthResult>
  }
  settings: {
    get(): Promise<Settings>
    update(patch: DeepPartial<Settings>): Promise<Settings>
    replace(next: Settings): Promise<Settings>
    exportFile(): Promise<{ ok: boolean; path?: string; error?: string }>
    importFile(): Promise<{ ok: boolean; error?: string; settings?: Settings }>
    onChange(cb: (s: Settings) => void): Unsubscribe
  }
  bedrock: {
    status(refresh?: boolean): Promise<BedrockStatus>
    launch(): Promise<LaunchResult>
    openFolder(which: 'data' | 'devRp' | 'devBp'): Promise<void>
    chooseFolder(): Promise<string | null>
  }
  packs: {
    apply(): Promise<PackApplyResult>
    status(): Promise<PackStatus>
    onApplied(cb: (r: PackApplyResult) => void): Unsubscribe
  }
  addons: {
    list(): Promise<AddonInfo[]>
    setEnabled(id: string, enabled: boolean): Promise<AddonInfo[]>
    importFile(): Promise<ImportResult>
    remove(id: string): Promise<AddonInfo[]>
  }
  overlay: {
    toggleMenu(): Promise<void>
    closeMenu(): Promise<void>
    openEditor(): Promise<void>
    displays(): Promise<DisplayInfo[]>
    grantFrameAccess(): Promise<{ ok: boolean; error?: string }>
    /** The overlay tells main when its zoom screen capture is running, so the overlay can hide itself from capture. */
    setCaptureActive(active: boolean): void
    /** Desktop-capture source id for the screen the overlay is on (zoom). */
    captureSourceId(): Promise<string | null>
    onMetrics(cb: (m: Metrics) => void): Unsubscribe
    onInput(cb: (e: InputEvent) => void): Unsubscribe
    onMenu(cb: (s: MenuState) => void): Unsubscribe
    onZoom(cb: (z: ZoomState) => void): Unsubscribe
    onPackBanner(cb: (text: string) => void): Unsubscribe
  }
  app: {
    version(): Promise<string>
    minimize(): void
    toggleMaximize(): void
    close(): void
    openExternal(url: string): Promise<void>
    updateStatus(): Promise<UpdateStatus>
    checkForUpdates(): Promise<UpdateStatus>
    installUpdate(): Promise<void>
    onUpdate(cb: (u: UpdateStatus) => void): Unsubscribe
    firstRun(): Promise<{ showPinTip: boolean }>
    dismissPinTip(): Promise<void>
    news(): Promise<NewsItem[]>
  }
}

export const CH = {
  authSession: 'auth:session',
  authSignUp: 'auth:signUp',
  authLogIn: 'auth:logIn',
  authLogOut: 'auth:logOut',
  authReset: 'auth:reset',
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsReplace: 'settings:replace',
  settingsExport: 'settings:export',
  settingsImport: 'settings:import',
  settingsChanged: 'settings:changed',
  bedrockStatus: 'bedrock:status',
  bedrockLaunch: 'bedrock:launch',
  bedrockOpenFolder: 'bedrock:openFolder',
  bedrockChooseFolder: 'bedrock:chooseFolder',
  packsApply: 'packs:apply',
  packsStatus: 'packs:status',
  packsApplied: 'packs:applied',
  addonsList: 'addons:list',
  addonsSetEnabled: 'addons:setEnabled',
  addonsImport: 'addons:import',
  addonsRemove: 'addons:remove',
  overlayToggleMenu: 'overlay:toggleMenu',
  overlayCloseMenu: 'overlay:closeMenu',
  overlayOpenEditor: 'overlay:openEditor',
  overlayDisplays: 'overlay:displays',
  overlayGrantFrameAccess: 'overlay:grantFrameAccess',
  overlaySetCaptureActive: 'overlay:setCaptureActive',
  overlayCaptureSource: 'overlay:captureSource',
  overlayMetrics: 'overlay:metrics',
  overlayInput: 'overlay:input',
  overlayMenu: 'overlay:menu',
  overlayZoom: 'overlay:zoom',
  overlayPackBanner: 'overlay:packBanner',
  appVersion: 'app:version',
  appMinimize: 'app:minimize',
  appToggleMaximize: 'app:toggleMaximize',
  appClose: 'app:close',
  appOpenExternal: 'app:openExternal',
  appUpdateStatus: 'app:updateStatus',
  appCheckForUpdates: 'app:checkForUpdates',
  appInstallUpdate: 'app:installUpdate',
  appUpdate: 'app:update',
  appFirstRun: 'app:firstRun',
  appDismissPinTip: 'app:dismissPinTip',
  appNews: 'app:news'
} as const

export const PACK_BANNER = 'Pack changes apply when you rejoin your world or server.'
