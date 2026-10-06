import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, win32 } from 'node:path'
import type { BedrockStatus, FolderCandidate, GameLayout } from '@shared/ipc'

// Where Bedrock keeps its data on Windows.
//
// Up to 1.21.110 the game was a UWP app and everything lived under
//   %LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang
// From 1.21.120 it's a GDK app. Development packs moved to the shared folder
//   %APPDATA%\Minecraft Bedrock\Users\Shared\games\com.mojang
// and per-player data (worlds, options, global packs) to
//   %APPDATA%\Minecraft Bedrock\Users\<id>\games\com.mojang

export const PACKAGES = {
  release: { family: 'Microsoft.MinecraftUWP_8wekyb3d8bbwe', name: 'Microsoft.MinecraftUWP', protocol: 'minecraft', gdkDir: 'Minecraft Bedrock' },
  preview: { family: 'Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe', name: 'Microsoft.MinecraftWindowsBeta', protocol: 'minecraft-preview', gdkDir: 'Minecraft Bedrock Preview' }
} as const

export const GAME_PROCESS = 'Minecraft.Windows.exe'

export interface PathEnv {
  APPDATA?: string
  LOCALAPPDATA?: string
}

type FsLike = {
  exists(p: string): boolean
  dirs(p: string): string[]
}

export const realFs: FsLike = {
  exists: (p) => existsSync(p),
  dirs: (p) => {
    try {
      return readdirSync(p).filter((d) => {
        try {
          return statSync(join(p, d)).isDirectory()
        } catch {
          return false
        }
      })
    } catch {
      return []
    }
  }
}

export interface ResolvedFolders {
  layout: GameLayout | null
  sharedRoot: string | null
  userRoots: string[]
  candidates: FolderCandidate[]
}

export function resolveFolders(
  edition: 'release' | 'preview',
  env: PathEnv,
  override: string | null,
  fs: FsLike = realFs
): ResolvedFolders {
  const p = win32
  const pkg = PACKAGES[edition]
  const candidates: FolderCandidate[] = []

  const gdkUsers = env.APPDATA ? p.join(env.APPDATA, pkg.gdkDir, 'Users') : null
  const gdkShared = gdkUsers ? p.join(gdkUsers, 'Shared', 'games', 'com.mojang') : null
  const uwp = env.LOCALAPPDATA ? p.join(env.LOCALAPPDATA, 'Packages', pkg.family, 'LocalState', 'games', 'com.mojang') : null

  if (gdkShared) candidates.push({ path: gdkShared, layout: 'gdk', exists: fs.exists(gdkShared) })
  if (uwp) candidates.push({ path: uwp, layout: 'uwp', exists: fs.exists(uwp) })

  if (override) {
    return { layout: 'override', sharedRoot: override, userRoots: [override], candidates }
  }

  if (gdkUsers && gdkShared && fs.exists(gdkShared)) {
    const userRoots = fs
      .dirs(gdkUsers)
      .filter((d) => d.toLowerCase() !== 'shared')
      .map((d) => p.join(gdkUsers, d, 'games', 'com.mojang'))
      .filter((d) => fs.exists(d))
    return { layout: 'gdk', sharedRoot: gdkShared, userRoots, candidates }
  }

  if (uwp && fs.exists(uwp)) {
    return { layout: 'uwp', sharedRoot: uwp, userRoots: [uwp], candidates }
  }

  return { layout: null, sharedRoot: null, userRoots: [], candidates }
}

/** Folders where global_resource_packs.json should list Master Client. */
export function globalPackFiles(f: Pick<BedrockStatus, 'sharedRoot' | 'userRoots'>, fs: FsLike = realFs): string[] {
  const roots = f.userRoots.length > 0 ? [...f.userRoots] : f.sharedRoot ? [f.sharedRoot] : []
  // Some GDK installs keep a minecraftpe folder in Shared as well; keep it in sync if it's there.
  if (f.sharedRoot && !roots.includes(f.sharedRoot) && fs.exists(win32.join(f.sharedRoot, 'minecraftpe'))) roots.push(f.sharedRoot)
  return roots.map((r) => win32.join(r, 'minecraftpe', 'global_resource_packs.json'))
}
