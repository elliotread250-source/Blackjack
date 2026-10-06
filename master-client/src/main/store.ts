import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { deepMerge, defaultSettings, sanitizeSettings } from '@shared/settings'
import type { DeepPartial, Settings } from '@shared/types'

export function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch {
    return fallback
  }
}

export function writeJsonAtomic(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true })
  const tmp = `${file}.tmp`
  writeFileSync(tmp, JSON.stringify(value, null, 2))
  renameSync(tmp, file)
}

/** Per-account settings: userData/profiles/<id>/settings.json */
export class SettingsStore {
  private current: Settings = defaultSettings()
  private file: string | null = null

  constructor(private readonly root: string) {}

  load(userId: number): Settings {
    this.file = join(this.root, 'profiles', String(userId), 'settings.json')
    this.current = sanitizeSettings(readJson(this.file, {}))
    this.save()
    return this.current
  }

  unload(): void {
    this.file = null
    this.current = defaultSettings()
  }

  get(): Settings {
    return this.current
  }

  get loaded(): boolean {
    return this.file !== null
  }

  update(patch: DeepPartial<Settings>): Settings {
    this.current = sanitizeSettings(deepMerge(this.current, patch))
    this.save()
    return this.current
  }

  replace(next: unknown): Settings {
    this.current = sanitizeSettings(next)
    this.save()
    return this.current
  }

  private save(): void {
    if (this.file) writeJsonAtomic(this.file, this.current)
  }
}

export interface PackIds {
  rpHeader: string
  rpModule: string
  bpHeader: string
  bpData: string
  bpScript: string
}

export interface MachineState {
  packIds: PackIds
  rpVersion: [number, number, number]
  bpVersion: [number, number, number]
  rpHash: string | null
  bpHash: string | null
  lastAppliedAt: number | null
  pinTipShown: boolean
}

/** Machine-wide state (the pack lives in the game folder, which every account shares). */
export class MachineStore {
  private state: MachineState

  constructor(private readonly file: string) {
    const raw = readJson<Partial<MachineState>>(file, {})
    const ids = raw.packIds
    this.state = {
      // Fresh UUIDs per install, generated the first time the launcher runs.
      packIds:
        ids && ids.rpHeader && ids.rpModule && ids.bpHeader && ids.bpData && ids.bpScript
          ? ids
          : { rpHeader: randomUUID(), rpModule: randomUUID(), bpHeader: randomUUID(), bpData: randomUUID(), bpScript: randomUUID() },
      rpVersion: validVersion(raw.rpVersion) ?? [1, 0, 0],
      bpVersion: validVersion(raw.bpVersion) ?? [1, 0, 0],
      rpHash: typeof raw.rpHash === 'string' ? raw.rpHash : null,
      bpHash: typeof raw.bpHash === 'string' ? raw.bpHash : null,
      lastAppliedAt: typeof raw.lastAppliedAt === 'number' ? raw.lastAppliedAt : null,
      pinTipShown: raw.pinTipShown === true
    }
    this.save()
  }

  get(): MachineState {
    return this.state
  }

  set(patch: Partial<MachineState>): MachineState {
    this.state = { ...this.state, ...patch }
    this.save()
    return this.state
  }

  private save(): void {
    writeJsonAtomic(this.file, this.state)
  }
}

function validVersion(v: unknown): [number, number, number] | null {
  return Array.isArray(v) && v.length === 3 && v.every((n) => Number.isInteger(n) && n >= 0) ? (v as [number, number, number]) : null
}
