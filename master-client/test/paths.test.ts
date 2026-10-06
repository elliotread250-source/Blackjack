import { describe, expect, it } from 'vitest'
import { globalPackFiles, resolveFolders } from '../src/main/bedrock/paths'

const env = { APPDATA: 'C:\\Users\\me\\AppData\\Roaming', LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' }
const GDK_USERS = 'C:\\Users\\me\\AppData\\Roaming\\Minecraft Bedrock\\Users'
const GDK_SHARED = `${GDK_USERS}\\Shared\\games\\com.mojang`
const UWP = 'C:\\Users\\me\\AppData\\Local\\Packages\\Microsoft.MinecraftUWP_8wekyb3d8bbwe\\LocalState\\games\\com.mojang'

function fakeFs(existing: string[], dirs: Record<string, string[]> = {}) {
  const set = new Set(existing)
  return { exists: (p: string) => set.has(p), dirs: (p: string) => dirs[p] ?? [] }
}

describe('Bedrock folders', () => {
  it('prefers the GDK layout and finds per-player folders', () => {
    const user = `${GDK_USERS}\\123456\\games\\com.mojang`
    const fs = fakeFs([GDK_SHARED, UWP, user], { [GDK_USERS]: ['Shared', '123456'] })
    const r = resolveFolders('release', env, null, fs)
    expect(r.layout).toBe('gdk')
    expect(r.sharedRoot).toBe(GDK_SHARED)
    expect(r.userRoots).toEqual([user])
    expect(globalPackFiles(r, fs)).toEqual([`${user}\\minecraftpe\\global_resource_packs.json`])
  })

  it('falls back to the old UWP layout', () => {
    const r = resolveFolders('release', env, null, fakeFs([UWP]))
    expect(r.layout).toBe('uwp')
    expect(r.sharedRoot).toBe(UWP)
    expect(r.userRoots).toEqual([UWP])
  })

  it('uses the manual override from Settings', () => {
    const r = resolveFolders('release', env, 'D:\\mc\\com.mojang', fakeFs([]))
    expect(r).toMatchObject({ layout: 'override', sharedRoot: 'D:\\mc\\com.mojang', userRoots: ['D:\\mc\\com.mojang'] })
  })

  it('reports nothing found', () => {
    const r = resolveFolders('preview', env, null, fakeFs([]))
    expect(r.layout).toBeNull()
    expect(r.candidates.map((c) => c.path)).toEqual([
      'C:\\Users\\me\\AppData\\Roaming\\Minecraft Bedrock Preview\\Users\\Shared\\games\\com.mojang',
      'C:\\Users\\me\\AppData\\Local\\Packages\\Microsoft.MinecraftWindowsBeta_8wekyb3d8bbwe\\LocalState\\games\\com.mojang'
    ])
  })
})
