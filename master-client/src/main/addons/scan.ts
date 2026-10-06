import { posix } from 'node:path'
import { parseJsonc } from '../util/jsonc'

// Validation for imported .mcpack / .mcaddon files. Only real Bedrock pack
// content gets through: JSON, images, sounds, Script API JavaScript, plus .lang
// (translations) and .mcfunction (command lists), which nearly every pack ships
// and which the game reads as plain text. Executables are rejected outright.

export const LIMITS = {
  maxEntries: 20_000,
  maxFileBytes: 64 * 1024 * 1024,
  maxTotalBytes: 300 * 1024 * 1024,
  maxPacks: 16
}

const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.tga'])
const SOUND = new Set(['.ogg', '.wav', '.fsb'])
const TEXT = new Set(['.json', '.lang', '.mcfunction'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface ZipEntry {
  path: string
  data: Buffer
}

export interface ScannedPack {
  root: string
  type: 'resources' | 'data'
  uuid: string
  version: string
  name: string
  description: string
  hasScripts: boolean
  files: ZipEntry[]
}

export interface ScanResult {
  packs: ScannedPack[]
  problems: string[]
}

/** Normalises a zip entry name, or returns null if it's unsafe (absolute, "..", drive letters). */
export function safePath(name: string): string | null {
  if (name.includes('\0')) return null
  const p = name.replace(/\\/g, '/')
  if (p.startsWith('/') || /^[a-z]:/i.test(p)) return null
  const norm = posix.normalize(p)
  if (norm.startsWith('../') || norm === '..' || norm.split('/').includes('..')) return null
  return norm.replace(/^\.\//, '')
}

function looksExecutable(data: Buffer): boolean {
  // PE (MZ), ELF, Mach-O, shell scripts.
  if (data.length >= 2 && data[0] === 0x4d && data[1] === 0x5a) return true
  if (data.length >= 4 && data.readUInt32BE(0) === 0x7f454c46) return true
  if (data.length >= 4 && [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe].includes(data.readUInt32BE(0))) return true
  if (data.length >= 2 && data[0] === 0x23 && data[1] === 0x21) return true
  return false
}

function imageMagicOk(ext: string, data: Buffer): boolean {
  if (ext === '.png') return data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (ext === '.jpg' || ext === '.jpeg') return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
  return true // TGA has no magic number
}

function isText(data: Buffer): boolean {
  return !data.subarray(0, 65536).includes(0)
}

function versionString(v: unknown): string | null {
  if (Array.isArray(v) && v.length === 3 && v.every((n) => Number.isInteger(n) && n >= 0)) return v.join('.')
  if (typeof v === 'string' && /^\d+\.\d+\.\d+([-+][0-9a-z.-]+)?$/i.test(v)) return v
  return null
}

interface Manifest {
  format_version?: unknown
  header?: { uuid?: unknown; name?: unknown; description?: unknown; version?: unknown }
  modules?: { type?: unknown; uuid?: unknown; entry?: unknown; language?: unknown }[]
  dependencies?: { uuid?: unknown; module_name?: unknown }[]
}

export function validateManifest(m: Manifest, files: Set<string>, root: string): { pack?: Omit<ScannedPack, 'files' | 'root'>; scriptDirs: string[]; problems: string[] } {
  const problems: string[] = []
  const where = root || '(root)'
  if (![1, 2, 3].includes(Number(m.format_version))) problems.push(`${where}: manifest format_version must be 1, 2 or 3.`)
  const h = m.header ?? {}
  if (typeof h.uuid !== 'string' || !UUID.test(h.uuid)) problems.push(`${where}: header.uuid isn't a valid UUID.`)
  const version = versionString(h.version)
  if (!version) problems.push(`${where}: header.version must be [x, y, z].`)
  if (!Array.isArray(m.modules) || m.modules.length === 0) problems.push(`${where}: manifest has no modules.`)

  const types = new Set<string>()
  const scriptDirs: string[] = []
  for (const mod of m.modules ?? []) {
    const t = String(mod.type)
    if (!['resources', 'data', 'script'].includes(t)) {
      problems.push(`${where}: module type "${t}" isn't supported (only resource and behaviour packs).`)
      continue
    }
    if (typeof mod.uuid !== 'string' || !UUID.test(mod.uuid)) problems.push(`${where}: a module has an invalid UUID.`)
    types.add(t)
    if (t === 'script') {
      const entry = typeof mod.entry === 'string' ? safePath(mod.entry) : null
      if (!entry || !entry.endsWith('.js')) problems.push(`${where}: script module entry must be a .js file.`)
      else if (!files.has(posix.join(root, entry))) problems.push(`${where}: script entry ${entry} is missing.`)
      else scriptDirs.push(posix.join(root, posix.dirname(entry)))
      if (mod.language !== undefined && mod.language !== 'javascript') problems.push(`${where}: only JavaScript scripts are allowed.`)
    }
  }
  for (const dep of m.dependencies ?? []) {
    if (dep.module_name !== undefined && !/^@minecraft\/[a-z-]+$/.test(String(dep.module_name))) {
      problems.push(`${where}: script dependency ${String(dep.module_name)} isn't an official @minecraft module.`)
    }
  }
  if (types.has('resources') && (types.has('data') || types.has('script'))) problems.push(`${where}: a pack can't be both a resource and a behaviour pack.`)
  if (problems.length > 0) return { problems, scriptDirs }
  return {
    pack: {
      type: types.has('resources') ? 'resources' : 'data',
      uuid: String(h.uuid).toLowerCase(),
      version: version!,
      name: typeof h.name === 'string' ? h.name.replace(/§./g, '').slice(0, 80) : 'Imported pack',
      description: typeof h.description === 'string' ? h.description.replace(/§./g, '').slice(0, 300) : '',
      hasScripts: types.has('script')
    },
    scriptDirs,
    problems
  }
}

/** Finds every pack (a folder with manifest.json) and checks every file in the archive. */
export function scanEntries(entries: ZipEntry[]): ScanResult {
  const problems: string[] = []
  const clean: ZipEntry[] = []
  for (const e of entries) {
    const p = safePath(e.path)
    if (!p) {
      problems.push(`Unsafe path in archive: ${e.path}`)
      continue
    }
    if (p.endsWith('/')) continue
    clean.push({ path: p, data: e.data })
  }
  const names = new Set(clean.map((e) => e.path))

  // Pack roots: folders containing manifest.json. Skip macOS junk.
  const roots = clean
    .filter((e) => posix.basename(e.path) === 'manifest.json' && !e.path.startsWith('__MACOSX/'))
    .map((e) => posix.dirname(e.path))
    .map((d) => (d === '.' ? '' : d))
  if (roots.length === 0) problems.push('No manifest.json found. This isn\'t a Bedrock pack.')
  if (roots.length > LIMITS.maxPacks) problems.push(`Too many packs in one file (${roots.length}).`)

  const packs: ScannedPack[] = []
  const scriptDirs: string[] = []
  for (const root of roots) {
    const file = clean.find((e) => e.path === posix.join(root, 'manifest.json'))!
    let manifest: Manifest
    try {
      manifest = parseJsonc<Manifest>(file.data.toString('utf8'))
    } catch {
      problems.push(`${root || '(root)'}: manifest.json isn't valid JSON.`)
      continue
    }
    const v = validateManifest(manifest, names, root)
    problems.push(...v.problems)
    scriptDirs.push(...v.scriptDirs)
    if (v.pack) packs.push({ ...v.pack, root, files: [] })
  }

  // Every file must belong to a pack and be an allowed, well-formed type.
  const sortedRoots = [...packs].sort((a, b) => b.root.length - a.root.length)
  for (const e of clean) {
    if (e.path.startsWith('__MACOSX/') || posix.basename(e.path) === '.DS_Store' || posix.basename(e.path) === 'Thumbs.db') continue
    const ext = posix.extname(e.path).toLowerCase()
    if (looksExecutable(e.data)) {
      problems.push(`Rejected executable content: ${e.path}`)
      continue
    }
    const owner = sortedRoots.find((p) => p.root === '' || e.path.startsWith(`${p.root}/`))
    if (!owner) {
      problems.push(`File outside any pack: ${e.path}`)
      continue
    }
    if (IMAGE.has(ext)) {
      if (!imageMagicOk(ext, e.data)) problems.push(`${e.path} isn't a real ${ext.slice(1).toUpperCase()} image.`)
    } else if (SOUND.has(ext)) {
      // Sounds are opaque binary; they just can't be executables (checked above).
    } else if (ext === '.js') {
      const inScripts = scriptDirs.some((d) => e.path.startsWith(`${d}/`))
      if (!owner.hasScripts || !inScripts) problems.push(`JavaScript outside a Script API module: ${e.path}`)
      else if (!isText(e.data)) problems.push(`${e.path} isn't a text script.`)
    } else if (TEXT.has(ext)) {
      if (!isText(e.data)) problems.push(`${e.path} isn't a text file.`)
      else if (ext === '.json') {
        try {
          parseJsonc(e.data.toString('utf8'))
        } catch {
          problems.push(`${e.path} isn't valid JSON.`)
        }
      }
    } else {
      problems.push(`File type not allowed: ${e.path}`)
      continue
    }
    owner.files.push({ path: owner.root ? e.path.slice(owner.root.length + 1) : e.path, data: e.data })
  }
  return { packs, problems }
}
