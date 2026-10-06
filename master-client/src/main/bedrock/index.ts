import { execFile, spawn } from 'node:child_process'
import { shell } from 'electron'
import type { BedrockStatus, LaunchResult } from '@shared/ipc'
import type { Settings } from '@shared/types'
import { GAME_PROCESS, PACKAGES, resolveFolders } from './paths'

const isWindows = process.platform === 'win32'

export function run(cmd: string, args: string[], timeout = 8000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      const code = err ? (typeof (err as NodeJS.ErrnoException).code === 'number' ? Number((err as NodeJS.ErrnoException).code) : 1) : 0
      resolve({ code, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') })
    })
  })
}

export async function isGameRunning(): Promise<boolean> {
  if (!isWindows) return false
  const r = await run('tasklist', ['/FI', `IMAGENAME eq ${GAME_PROCESS}`, '/NH', '/FO', 'CSV'])
  return r.stdout.toLowerCase().includes(GAME_PROCESS.toLowerCase())
}

async function packageFound(edition: 'release' | 'preview'): Promise<boolean> {
  const name = PACKAGES[edition].name
  const r = await run('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `(Get-AppxPackage -Name ${name} | Select-Object -First 1 -ExpandProperty PackageFamilyName)`
  ])
  return r.stdout.trim().length > 0
}

async function protocolRegistered(edition: 'release' | 'preview'): Promise<boolean> {
  const r = await run('reg', ['query', `HKCR\\${PACKAGES[edition].protocol}`, '/ve'])
  return r.code === 0
}

let cached: { at: number; key: string; status: BedrockStatus } | null = null

export async function bedrockStatus(settings: Settings, refresh = false): Promise<BedrockStatus> {
  const edition = settings.game.edition
  const key = `${edition}|${settings.game.folderOverride ?? ''}`
  if (!refresh && cached && cached.key === key && Date.now() - cached.at < 15_000) {
    return { ...cached.status, running: await isGameRunning() }
  }

  const folders = resolveFolders(edition, { APPDATA: process.env.APPDATA, LOCALAPPDATA: process.env.LOCALAPPDATA }, settings.game.folderOverride)

  if (!isWindows) {
    const status: BedrockStatus = {
      platformSupported: false,
      installed: false,
      edition,
      packageFound: false,
      protocolRegistered: false,
      running: false,
      ...folders,
      error: 'Minecraft Bedrock for Windows only runs on Windows. Everything else in Master Client still works here for previewing.'
    }
    cached = { at: Date.now(), key, status }
    return status
  }

  const [pkg, proto, running] = await Promise.all([packageFound(edition), protocolRegistered(edition), isGameRunning()])
  const installed = pkg || proto
  const status: BedrockStatus = {
    platformSupported: true,
    installed,
    edition,
    packageFound: pkg,
    protocolRegistered: proto,
    running,
    ...folders,
    error: !installed
      ? `Minecraft${edition === 'preview' ? ' Preview' : ''} for Windows isn't installed. Get it from the Microsoft Store or the Xbox app, open it once, then press PLAY again.`
      : !folders.sharedRoot
        ? 'Minecraft is installed but its data folder hasn\'t been created yet. Open the game once, or set the folder in Settings.'
        : undefined
  }
  cached = { at: Date.now(), key, status }
  return status
}

export async function launchBedrock(settings: Settings): Promise<LaunchResult> {
  const status = await bedrockStatus(settings, true)
  if (!status.platformSupported) return { ok: false, error: status.error }
  if (!status.installed) return { ok: false, error: status.error }

  const pkg = PACKAGES[settings.game.edition]
  // First choice: the protocol handler the game registers.
  if (status.protocolRegistered) {
    try {
      await shell.openExternal(`${pkg.protocol}://`)
      return { ok: true, method: 'protocol' }
    } catch {
      // fall through to the Start menu entry
    }
  }
  // Fallback: the app's Start menu entry (AUMID), which works for UWP and GDK installs.
  try {
    const child = spawn('explorer.exe', [`shell:AppsFolder\\${pkg.family}!App`], { detached: true, stdio: 'ignore', windowsHide: true })
    child.unref()
    return { ok: true, method: 'appsfolder' }
  } catch (e) {
    return { ok: false, error: `Couldn't start Minecraft: ${(e as Error).message}` }
  }
}
