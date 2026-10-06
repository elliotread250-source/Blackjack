import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { AddonInfo, BedrockStatus, ImportResult } from '@shared/ipc'
import type { ImportedPack, Settings } from '@shared/types'
import { globalPackFiles } from '../bedrock/paths'
import { setGlobalPack } from '../packs/engine'
import { scanEntries } from './scan'
import { readZip } from './zip'

interface BuiltinPack {
  folder: string
  type: 'resources' | 'data'
  uuid: string
  version: [number, number, number]
}

interface BuiltinMeta {
  id: string
  name: string
  description: string
  kind: 'resources' | 'data' | 'addon'
  packs: BuiltinPack[]
  details: string[]
}

const devDir = (root: string, type: 'resources' | 'data') => join(root, type === 'resources' ? 'development_resource_packs' : 'development_behavior_packs')

function toVersion(v: string): [number, number, number] {
  const p = v.split(/[.+-]/).map((n) => parseInt(n, 10))
  return [p[0] || 0, p[1] || 0, p[2] || 0]
}

function slug(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 32) || 'pack'
}

export class AddonManager {
  private iconCache = new Map<string, string | null>()

  constructor(
    private readonly builtinRoot: string,
    private readonly importRoot: string
  ) {}

  builtins(): { meta: BuiltinMeta; dir: string }[] {
    if (!existsSync(this.builtinRoot)) return []
    return readdirSync(this.builtinRoot)
      .map((d) => join(this.builtinRoot, d))
      .filter((d) => existsSync(join(d, 'addon.json')))
      .map((dir) => ({ meta: JSON.parse(readFileSync(join(dir, 'addon.json'), 'utf8')) as BuiltinMeta, dir }))
  }

  private icon(file: string): string | null {
    if (!this.iconCache.has(file)) {
      this.iconCache.set(file, existsSync(file) ? `data:image/png;base64,${readFileSync(file).toString('base64')}` : null)
    }
    return this.iconCache.get(file) ?? null
  }

  list(s: Settings): AddonInfo[] {
    const out: AddonInfo[] = this.builtins().map(({ meta, dir }) => ({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      kind: meta.kind,
      icon: this.icon(join(dir, meta.packs[0].folder, 'pack_icon.png')),
      enabled: s.addons[meta.id]?.enabled === true,
      builtin: true,
      perWorld: meta.packs.some((p) => p.type === 'data'),
      hasScripts: meta.packs.some((p) => p.type === 'data'),
      version: meta.packs[0].version.join('.'),
      details: meta.details
    }))
    for (const p of s.imported) {
      out.push({
        id: p.id,
        name: p.name,
        description: p.description || (p.type === 'resources' ? 'Imported resource pack' : 'Imported behaviour pack'),
        kind: p.type,
        icon: this.icon(join(this.importRoot, p.id, 'pack_icon.png')),
        enabled: s.addons[p.id]?.enabled !== false,
        builtin: false,
        perWorld: p.type === 'data',
        hasScripts: p.hasScripts,
        version: p.version,
        details: [p.hasScripts ? 'Uses the Script API' : '', `Imported ${new Date(p.importedAt).toLocaleDateString()}`].filter(Boolean)
      })
    }
    return out
  }

  /** Installs or removes an add-on's packs in the game folder. */
  setEnabled(s: Settings, bedrock: BedrockStatus, id: string, enabled: boolean): void {
    if (!bedrock.sharedRoot) throw new Error(bedrock.error ?? "Couldn't find Minecraft's data folder.")
    const globals = globalPackFiles(bedrock)
    const builtin = this.builtins().find((b) => b.meta.id === id)
    if (builtin) {
      for (const pack of builtin.meta.packs) {
        const target = join(devDir(bedrock.sharedRoot, pack.type), `MC_${builtin.meta.id}_${pack.folder}`)
        if (enabled) {
          rmSync(target, { recursive: true, force: true })
          mkdirSync(dirname(target), { recursive: true })
          cpSync(join(builtin.dir, pack.folder), target, { recursive: true })
        } else {
          rmSync(target, { recursive: true, force: true })
        }
        // Stand-alone resource packs go in Global Resources (below Master Client's own pack).
        // An add-on's resource pack comes along with its behaviour pack instead.
        if (pack.type === 'resources' && builtin.meta.kind === 'resources') setGlobalPack(globals, pack.uuid, pack.version, enabled, 1)
      }
      return
    }
    const imported = s.imported.find((p) => p.id === id)
    if (!imported) throw new Error('Unknown add-on.')
    const target = join(devDir(bedrock.sharedRoot, imported.type), imported.folder)
    if (imported.type === 'resources') {
      if (!existsSync(target)) cpSync(join(this.importRoot, imported.id), target, { recursive: true })
      setGlobalPack(globals, imported.uuid, toVersion(imported.version), enabled, 1)
    } else if (enabled) {
      cpSync(join(this.importRoot, imported.id), target, { recursive: true })
    } else {
      rmSync(target, { recursive: true, force: true })
    }
  }

  remove(s: Settings, bedrock: BedrockStatus, id: string): void {
    const imported = s.imported.find((p) => p.id === id)
    if (!imported) throw new Error('Only imported add-ons can be removed.')
    if (bedrock.sharedRoot) {
      rmSync(join(devDir(bedrock.sharedRoot, imported.type), imported.folder), { recursive: true, force: true })
      if (imported.type === 'resources') setGlobalPack(globalPackFiles(bedrock), imported.uuid, [0, 0, 0], false)
    }
    rmSync(join(this.importRoot, imported.id), { recursive: true, force: true })
  }

  /** Validates an .mcpack/.mcaddon and installs every pack in it. */
  async importArchive(buf: Buffer, fileName: string, s: Settings, bedrock: BedrockStatus): Promise<ImportResult> {
    if (!bedrock.sharedRoot) return { ok: false, error: bedrock.error ?? "Couldn't find Minecraft's data folder." }
    let entries
    try {
      entries = await readZip(buf)
    } catch (e) {
      return { ok: false, error: `${fileName} isn't a readable pack: ${(e as Error).message}` }
    }
    const scan = scanEntries(entries)
    if (scan.problems.length > 0 || scan.packs.length === 0) {
      return { ok: false, error: `${fileName} was rejected.`, problems: scan.problems.slice(0, 20) }
    }
    const installed: ImportedPack[] = []
    for (const pack of scan.packs) {
      const existing = s.imported.find((p) => p.uuid === pack.uuid)
      const id = existing?.id ?? `imp_${pack.uuid.slice(0, 8)}`
      const folder = existing?.folder ?? `MCImport_${slug(pack.name)}_${pack.uuid.slice(0, 8)}`
      const store = join(this.importRoot, id)
      rmSync(store, { recursive: true, force: true })
      for (const f of pack.files) {
        const target = join(store, ...f.path.split('/'))
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, f.data)
      }
      const target = join(devDir(bedrock.sharedRoot, pack.type), folder)
      rmSync(target, { recursive: true, force: true })
      cpSync(store, target, { recursive: true })
      if (pack.type === 'resources') setGlobalPack(globalPackFiles(bedrock), pack.uuid, toVersion(pack.version), true, 1)
      this.iconCache.delete(join(store, 'pack_icon.png'))
      installed.push({
        id,
        name: pack.name,
        description: pack.description,
        type: pack.type,
        uuid: pack.uuid,
        version: pack.version,
        folder,
        importedAt: Date.now(),
        hasScripts: pack.hasScripts
      })
    }
    return { ok: true, packs: installed }
  }
}
