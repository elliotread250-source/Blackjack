import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import type { BedrockStatus, PackApplyResult, PackStatus } from '@shared/ipc'
import type { Settings } from '@shared/types'
import type { MachineStore } from '../store'
import { globalPackFiles } from '../bedrock/paths'
import { parseJsonc } from '../util/jsonc'
import type { PackFiles } from './generators/common'
import { wantsWorldTweaks } from './generators/behavior'
import {
  BP_FOLDER,
  RP_FOLDER,
  type Version,
  behaviorManifest,
  buildBehaviorContent,
  buildResourceContent,
  bump,
  resourceManifest
} from './build'

/** Writes `files` into `dir` and removes anything in `dir` that isn't in `files`. */
export function syncFolder(dir: string, files: PackFiles): void {
  mkdirSync(dir, { recursive: true })
  const wanted = new Set<string>()
  for (const [rel, content] of files) {
    const target = join(dir, ...rel.split('/'))
    if (!target.startsWith(dir + sep)) throw new Error(`Refusing to write outside the pack: ${rel}`)
    wanted.add(target)
    mkdirSync(dirname(target), { recursive: true })
    const buf = typeof content === 'string' ? Buffer.from(content, 'utf8') : content
    // Skip identical files so the game's file watcher doesn't see needless churn.
    if (existsSync(target)) {
      try {
        if (readFileSync(target).equals(buf)) continue
      } catch {
        // fall through and overwrite
      }
    }
    writeFileSync(target, buf)
  }
  for (const file of walk(dir)) if (!wanted.has(file)) unlinkSync(file)
  pruneEmptyDirs(dir)
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else out.push(p)
  }
  return out
}

function pruneEmptyDirs(dir: string, root = dir): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) {
      pruneEmptyDirs(p, root)
      if (readdirSync(p).length === 0 && relative(root, p)) rmSync(p, { recursive: true })
    }
  }
}

interface GlobalPackEntry {
  pack_id: string
  version: number[] | string
  subpack?: string
}

/**
 * Adds, moves or removes a pack in every global_resource_packs.json. `position`
 * 0 means highest priority. Returns true if any file changed.
 */
export function setGlobalPack(files: string[], packId: string, version: Version, enabled: boolean, position = 0): boolean {
  let changed = false
  for (const file of files) {
    let list: GlobalPackEntry[] = []
    try {
      if (existsSync(file)) {
        const parsed = parseJsonc<unknown>(readFileSync(file, 'utf8'))
        if (Array.isArray(parsed)) list = parsed as GlobalPackEntry[]
      }
    } catch {
      list = []
    }
    const before = JSON.stringify(list)
    const existing = list.find((e) => e.pack_id === packId)
    list = list.filter((e) => e.pack_id !== packId)
    if (enabled) {
      const entry: GlobalPackEntry = { ...(existing ?? {}), pack_id: packId, version: [...version] }
      list.splice(Math.min(position, list.length), 0, entry)
    }
    const after = JSON.stringify(list)
    if (before !== after) {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify(list, null, 2))
      changed = true
    }
  }
  return changed
}

export class PackEngine {
  constructor(
    private readonly machine: MachineStore,
    private readonly isGameRunning: () => Promise<boolean>
  ) {}

  status(bedrock: BedrockStatus | null): PackStatus {
    const m = this.machine.get()
    const installed = !!bedrock?.sharedRoot && existsSync(join(bedrock.sharedRoot, 'development_resource_packs', RP_FOLDER, 'manifest.json'))
    return { installed, version: m.rpHash ? m.rpVersion : null, lastAppliedAt: m.lastAppliedAt, pending: false }
  }

  async apply(s: Settings, bedrock: BedrockStatus): Promise<PackApplyResult> {
    const m = this.machine.get()
    const warnings: string[] = []
    const gameRunning = await this.isGameRunning().catch(() => false)
    if (!bedrock.sharedRoot) {
      return {
        ok: false,
        version: m.rpVersion,
        changed: false,
        gameRunning,
        globalListChanged: false,
        warnings,
        error: bedrock.error ?? "Couldn't find Minecraft's data folder. Open Minecraft once, or set the folder in Settings."
      }
    }
    try {
      // ---- Resource pack
      const rp = buildResourceContent(s)
      const rpDir = join(bedrock.sharedRoot, 'development_resource_packs', RP_FOLDER)
      const rpChanged = rp.hash !== m.rpHash
      const rpVersion: Version = rpChanged && m.rpHash ? bump(m.rpVersion) : m.rpVersion
      if (rpChanged || !existsSync(join(rpDir, 'manifest.json'))) {
        rp.files.set('manifest.json', resourceManifest(m.packIds, rpVersion))
        syncFolder(rpDir, rp.files)
      }

      // ---- Behaviour pack (only once you've used a feature that needs it)
      const bpDir = join(bedrock.sharedRoot, 'development_behavior_packs', BP_FOLDER)
      let bpChanged = false
      let bpVersion = m.bpVersion
      if (wantsWorldTweaks(s) || existsSync(bpDir)) {
        const bp = buildBehaviorContent(s)
        bpChanged = bp.hash !== m.bpHash
        bpVersion = bpChanged && m.bpHash ? bump(m.bpVersion) : m.bpVersion
        if (bpChanged || !existsSync(join(bpDir, 'manifest.json'))) {
          bp.files.set('manifest.json', behaviorManifest(m.packIds, bpVersion))
          syncFolder(bpDir, bp.files)
        }
        this.machine.set({ bpHash: bp.hash, bpVersion })
      }

      // ---- Global resource packs: Master Client first, so its UI wins.
      const globals = globalPackFiles(bedrock)
      const globalListChanged = setGlobalPack(globals, m.packIds.rpHeader, rpVersion, true, 0)
      if (globalListChanged && gameRunning) {
        warnings.push('Minecraft is running, so restart it once to pick up Master Client in Global Resources.')
      }
      if (bedrock.layout === 'gdk' && bedrock.userRoots.length === 0) {
        warnings.push("No player folder yet, so Master Client was added to the shared global packs list. If it doesn't show, open Minecraft once and press Apply again.")
      }

      this.machine.set({ rpHash: rp.hash, rpVersion, lastAppliedAt: Date.now() })
      return {
        ok: true,
        version: rpVersion,
        changed: rpChanged || bpChanged,
        rpPath: rpDir,
        bpPath: existsSync(bpDir) ? bpDir : undefined,
        gameRunning,
        globalListChanged,
        warnings
      }
    } catch (e) {
      return {
        ok: false,
        version: m.rpVersion,
        changed: false,
        gameRunning,
        globalListChanged: false,
        warnings,
        error: `Couldn't write the pack: ${(e as Error).message}`
      }
    }
  }
}
