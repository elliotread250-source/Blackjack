import { describe, expect, it } from 'vitest'
import yazl from 'yazl'
import { scanEntries, safePath, type ZipEntry } from '../src/main/addons/scan'
import { readZip } from '../src/main/addons/zip'

const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex')
const UUID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

function manifest(type: 'resources' | 'data', n: number, extra: object = {}) {
  return Buffer.from(
    JSON.stringify({
      format_version: 2,
      header: { name: `Pack ${n}`, uuid: UUID(n), version: [1, 0, 0], min_engine_version: [1, 21, 0] },
      modules: [{ type, uuid: UUID(n + 100), version: [1, 0, 0] }],
      ...extra
    })
  )
}

const e = (path: string, data: Buffer | string): ZipEntry => ({ path, data: Buffer.isBuffer(data) ? data : Buffer.from(data) })

function zip(entries: ZipEntry[]): Promise<Buffer> {
  const z = new yazl.ZipFile()
  for (const x of entries) z.addBuffer(x.data, x.path)
  z.end()
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    z.outputStream.on('data', (c: Buffer) => chunks.push(c))
    z.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

describe('add-on import scan', () => {
  it('accepts a normal resource pack', () => {
    const r = scanEntries([
      e('Cool/manifest.json', manifest('resources', 1)),
      e('Cool/pack_icon.png', PNG),
      e('Cool/textures/blocks/stone.png', PNG),
      e('Cool/texts/en_US.lang', 'pack.name=Cool'),
      e('Cool/sounds/hit.ogg', Buffer.from('OggS\0\0'))
    ])
    expect(r.problems).toEqual([])
    expect(r.packs).toHaveLength(1)
    expect(r.packs[0]).toMatchObject({ type: 'resources', uuid: UUID(1), version: '1.0.0', name: 'Pack 1' })
    expect(r.packs[0].files.map((f) => f.path).sort()).toContain('textures/blocks/stone.png')
  })

  it('accepts a behaviour pack with Script API JavaScript in its scripts folder', () => {
    const m = JSON.parse(manifest('data', 2).toString())
    m.modules.push({ type: 'script', language: 'javascript', uuid: UUID(300), version: [1, 0, 0], entry: 'scripts/main.js' })
    m.dependencies = [{ module_name: '@minecraft/server', version: '2.0.0' }]
    const r = scanEntries([e('manifest.json', JSON.stringify(m)), e('scripts/main.js', 'import { world } from "@minecraft/server"'), e('scripts/util/a.js', 'export const a = 1')])
    expect(r.problems).toEqual([])
    expect(r.packs[0]).toMatchObject({ type: 'data', hasScripts: true })
  })

  it('rejects executables whatever they are named', () => {
    const r = scanEntries([e('manifest.json', manifest('resources', 3)), e('textures/evil.png', Buffer.from('MZ\x90\0rest of a PE file'))])
    expect(r.problems.some((p) => p.includes('executable'))).toBe(true)
    const r2 = scanEntries([e('manifest.json', manifest('resources', 3)), e('run.exe', Buffer.from('hello'))])
    expect(r2.problems.some((p) => p.includes('not allowed'))).toBe(true)
    const r3 = scanEntries([e('manifest.json', manifest('resources', 3)), e('setup.bat', '@echo off')])
    expect(r3.problems.length).toBeGreaterThan(0)
  })

  it('rejects JavaScript in a resource pack and scripts from unofficial modules', () => {
    const r = scanEntries([e('manifest.json', manifest('resources', 4)), e('scripts/main.js', 'x')])
    expect(r.problems.some((p) => p.includes('JavaScript outside'))).toBe(true)
    const m = JSON.parse(manifest('data', 5).toString())
    m.dependencies = [{ module_name: 'left-pad', version: '1.0.0' }]
    expect(scanEntries([e('manifest.json', JSON.stringify(m))]).problems.some((p) => p.includes('official'))).toBe(true)
  })

  it('rejects fake images, bad manifests and path tricks', () => {
    expect(scanEntries([e('manifest.json', manifest('resources', 6)), e('a.png', 'not a png')]).problems.length).toBe(1)
    expect(scanEntries([e('manifest.json', '{"format_version":2,"header":{}}')]).problems.length).toBeGreaterThan(0)
    expect(scanEntries([e('readme.txt', 'hi')]).problems).toContain("No manifest.json found. This isn't a Bedrock pack.")
    expect(safePath('../../Windows/System32/x.dll')).toBeNull()
    expect(safePath('C:\\Windows\\x')).toBeNull()
    expect(safePath('/etc/passwd')).toBeNull()
    expect(safePath('a/./b/../c.json')).toBe('a/c.json')
  })

  it('reads a real .mcaddon with nested .mcpack files', async () => {
    const rp = await zip([e('manifest.json', manifest('resources', 7)), e('pack_icon.png', PNG)])
    const bp = await zip([e('manifest.json', manifest('data', 8)), e('items/thing.json', '{"format_version":"1.21.40"}')])
    const addon = await zip([e('My RP.mcpack', rp), e('My BP.mcpack', bp)])
    const entries = await readZip(addon)
    const r = scanEntries(entries)
    expect(r.problems).toEqual([])
    expect(r.packs.map((p) => p.type).sort()).toEqual(['data', 'resources'])
  })
})
