import { mkdtempSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PNG } from 'pngjs'
import { defaultSettings, deepMerge, sanitizeSettings } from '@shared/settings'
import { MODULES } from '@shared/modules'
import type { BedrockStatus } from '@shared/ipc'
import type { Settings } from '@shared/types'
import { buildResourceContent, buildBehaviorContent, resourceManifest, behaviorManifest, RP_FOLDER, BP_FOLDER } from '../src/main/packs/build'
import { PackEngine, setGlobalPack, syncFolder } from '../src/main/packs/engine'
import { MachineStore } from '../src/main/store'
import { flameAtlas, crosshairPng } from '../src/main/packs/generators/visuals'
import { worldTweaksScript, worldTweaksConfig } from '../src/main/packs/generators/behavior'

const tmp = () => mkdtempSync(join(tmpdir(), 'mc-test-'))

function allOn(): Settings {
  const s = defaultSettings()
  for (const m of MODULES) if (m.available !== 'no') s.modules[m.id].enabled = true
  s.modules.fullbright.options.nightVision = true
  s.modules.hitcolor.options.targets = 'all'
  s.modules.projectiles.options.arrow = 0.5
  s.modules.projectiles.options.pearl = 2
  return sanitizeSettings(s)
}

function fakeStatus(root: string, userRoots: string[] = []): BedrockStatus {
  return {
    platformSupported: true,
    installed: true,
    edition: 'release',
    packageFound: true,
    protocolRegistered: true,
    running: false,
    layout: 'gdk',
    sharedRoot: root,
    userRoots,
    candidates: []
  }
}

describe('resource pack content', () => {
  it('produces only valid JSON and PNG files with every module on', () => {
    const { files } = buildResourceContent(allOn())
    expect(files.size).toBeGreaterThan(20)
    for (const [path, content] of files) {
      if (path.endsWith('.json')) expect(() => JSON.parse(String(content)), path).not.toThrow()
      else if (path.endsWith('.png')) expect(() => PNG.sync.read(content as Buffer), path).not.toThrow()
      else throw new Error(`unexpected file type ${path}`)
    }
  })

  it('only writes the vanilla hud file when a HUD module needs it', () => {
    const s = defaultSettings()
    for (const id of Object.keys(s.modules)) s.modules[id].enabled = false
    const { files } = buildResourceContent(s)
    expect(files.has('ui/hud_screen.json')).toBe(false)
    expect([...files.keys()].sort()).toEqual(['pack_icon.png', 'textures/master_client/white.png'])
  })

  it('moves chat out of chat_stack and keeps coordinates in it when only chat is on', () => {
    const s = defaultSettings()
    for (const id of Object.keys(s.modules)) s.modules[id].enabled = false
    s.modules.chat.enabled = true
    const hud = JSON.parse(String(buildResourceContent(s).files.get('ui/hud_screen.json')))
    const mods = hud.root_panel.modifications
    expect(mods[0]).toEqual({ array_name: 'controls', operation: 'remove', control_name: 'chat_stack' })
    const stack = mods[1].value[0].chat_stack.controls.map((c: object) => Object.keys(c)[0])
    expect(stack).toContain('player_position@hud.player_position')
    expect(stack).not.toContain('chat_panel@hud.chat_panel')
    const chatPanel = hud.chat_panel.controls[0].stack_panel.factory
    expect(chatPanel.max_children_size).toBe(20)
    expect(hud.master_client_hud.controls[0].mc_chat.size[0]).toBe('40%')
  })

  it('positions pack modules with percentage offsets from the HUD layout', () => {
    const s = defaultSettings()
    for (const id of Object.keys(s.modules)) s.modules[id].enabled = false
    s.modules.coords.enabled = true
    s.hud.profiles.default.placements.coords.x = 0.25
    s.hud.profiles.default.placements.coords.y = 0.5
    const hud = JSON.parse(String(buildResourceContent(s).files.get('ui/hud_screen.json')))
    expect(hud.master_client_hud.controls[0].mc_coords.offset).toEqual(['25%', '50%'])
  })

  it('changes the hash when a pack option changes and not when an overlay option does', () => {
    const a = defaultSettings()
    a.modules.fog.enabled = true
    const h1 = buildResourceContent(a).hash
    const b = deepMerge(a, { modules: { keystrokes: { options: { fade: 300 } } } }) as Settings
    expect(buildResourceContent(b).hash).toBe(h1)
    const c = deepMerge(a, { modules: { fog: { options: { overworldEnd: 0.5 } } } }) as Settings
    expect(buildResourceContent(c).hash).not.toBe(h1)
  })

  it('copies vanilla fog and only changes the air fog', () => {
    const s = defaultSettings()
    s.modules.fog.enabled = true
    s.modules.fog.options.overworldStart = 0.3
    s.modules.fog.options.overworldEnd = 0.6
    s.modules.fog.options.overworldColor = '#123456'
    const fog = JSON.parse(String(buildResourceContent(s).files.get('fogs/default_fog_setting.json')))
    const d = fog['minecraft:fog_settings']
    expect(d.description.identifier).toBe('minecraft:fog_default')
    expect(d.distance.air).toMatchObject({ fog_start: 0.3, fog_end: 0.6, fog_color: '#123456' })
    expect(d.distance.water.fog_color).toBe('#44AFF5')
  })

  it('injects the hurt colour into third-person player controllers only', () => {
    const s = defaultSettings()
    s.modules.hitcolor.enabled = true
    const rc = JSON.parse(String(buildResourceContent(s).files.get('render_controllers/player.render_controllers.json')))
    expect(rc.render_controllers['controller.render.player.third_person'].is_hurt_color).toEqual({ r: 0.239, g: 0.482, b: 1, a: 0.5 })
    expect(rc.render_controllers['controller.render.player.first_person'].is_hurt_color).toBeUndefined()
  })

  it('raises Vibrant Visuals ambient light for full bright', () => {
    const s = defaultSettings()
    s.modules.fullbright.enabled = true
    const l = JSON.parse(String(buildResourceContent(s).files.get('lighting/global.json')))
    expect(l['minecraft:lighting_settings'].ambient.illuminance).toBe(0.6)
    expect(l['minecraft:lighting_settings'].directional_lights.orbital.sun).toBeDefined()
  })

  it('draws a 16x512 flame atlas and a 15x15 crosshair', () => {
    const atlas = PNG.sync.read(flameAtlas(40, 70))
    expect([atlas.width, atlas.height]).toEqual([16, 512])
    const xh = PNG.sync.read(crosshairPng(Array(15).fill('#'.repeat(15)), '#ff0000'))
    expect([xh.width, xh.height]).toEqual([15, 15])
    expect([...xh.data.slice(0, 4)]).toEqual([255, 0, 0, 255])
  })

  it('writes a manifest with the per-install UUIDs and version', () => {
    const ids = { rpHeader: 'a', rpModule: 'b', bpHeader: 'c', bpData: 'd', bpScript: 'e' }
    const m = JSON.parse(resourceManifest(ids, [1, 0, 7]))
    expect(m.header).toMatchObject({ uuid: 'a', version: [1, 0, 7] })
    expect(m.modules[0]).toMatchObject({ type: 'resources', uuid: 'b', version: [1, 0, 7] })
    const b = JSON.parse(behaviorManifest(ids, [1, 0, 2]))
    expect(b.modules.map((x: { type: string }) => x.type)).toEqual(['data', 'script'])
    expect(b.dependencies[0].module_name).toBe('@minecraft/server')
  })
})

describe('world tweaks behaviour pack', () => {
  it('bakes the config into the script', () => {
    const s = allOn()
    s.modules.timechanger.options.time = 18000
    const script = worldTweaksScript(worldTweaksConfig(s))
    expect(script).toContain('"value":18000')
    expect(script).toContain('"nightVision":true')
    expect(script).toContain("from '@minecraft/server'")
    expect(buildBehaviorContent(s).files.has('scripts/main.js')).toBe(true)
  })
})

describe('pack engine install', () => {
  it('installs, bumps the version on change, and registers in global packs', async () => {
    const root = tmp()
    const user = join(root, 'user', 'games', 'com.mojang')
    mkdirSync(join(user, 'minecraftpe'), { recursive: true })
    writeFileSync(join(user, 'minecraftpe', 'global_resource_packs.json'), JSON.stringify([{ pack_id: 'other', version: [1, 0, 0] }]))
    const machine = new MachineStore(join(root, 'machine.json'))
    const engine = new PackEngine(machine, async () => false)
    const status = fakeStatus(join(root, 'shared'), [user])

    const s = defaultSettings()
    const r1 = await engine.apply(s, status)
    expect(r1.ok).toBe(true)
    expect(r1.version).toEqual([1, 0, 0])
    const rpDir = join(root, 'shared', 'development_resource_packs', RP_FOLDER)
    expect(existsSync(join(rpDir, 'manifest.json'))).toBe(true)
    const globals = JSON.parse(readFileSync(join(user, 'minecraftpe', 'global_resource_packs.json'), 'utf8'))
    expect(globals[0]).toEqual({ pack_id: machine.get().packIds.rpHeader, version: [1, 0, 0] })
    expect(globals[1].pack_id).toBe('other')

    const same = await engine.apply(s, status)
    expect(same.changed).toBe(false)
    expect(same.version).toEqual([1, 0, 0])

    s.modules.lowfire.enabled = true
    const r2 = await engine.apply(s, status)
    expect(r2.changed).toBe(true)
    expect(r2.version).toEqual([1, 0, 1])
    expect(existsSync(join(rpDir, 'textures', 'flame_atlas.png'))).toBe(true)
    const m2 = JSON.parse(readFileSync(join(rpDir, 'manifest.json'), 'utf8'))
    expect(m2.header.version).toEqual([1, 0, 1])
    const g2 = JSON.parse(readFileSync(join(user, 'minecraftpe', 'global_resource_packs.json'), 'utf8'))
    expect(g2[0].version).toEqual([1, 0, 1])

    // Turning it off removes the stale texture.
    s.modules.lowfire.enabled = false
    await engine.apply(s, status)
    expect(existsSync(join(rpDir, 'textures', 'flame_atlas.png'))).toBe(false)

    // Behaviour pack only appears once a feature needs it.
    expect(existsSync(join(root, 'shared', 'development_behavior_packs', BP_FOLDER))).toBe(false)
    s.modules.timechanger.enabled = true
    await engine.apply(s, status)
    expect(existsSync(join(root, 'shared', 'development_behavior_packs', BP_FOLDER, 'scripts', 'main.js'))).toBe(true)
  })

  it('reports a friendly error with no game folder', async () => {
    const root = tmp()
    const engine = new PackEngine(new MachineStore(join(root, 'machine.json')), async () => false)
    const r = await engine.apply(defaultSettings(), { ...fakeStatus(root), sharedRoot: null, error: undefined })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/data folder/)
  })

  it('refuses paths that escape the pack folder', () => {
    const root = tmp()
    expect(() => syncFolder(join(root, 'pack'), new Map([['../evil.json', '{}']]))).toThrow(/outside/)
  })

  it('keeps unrelated global packs and handles a missing file', () => {
    const root = tmp()
    const f = join(root, 'g.json')
    expect(setGlobalPack([f], 'mine', [1, 0, 0], true)).toBe(true)
    expect(setGlobalPack([f], 'mine', [1, 0, 0], true)).toBe(false)
    expect(setGlobalPack([f], 'mine', [1, 0, 0], false)).toBe(true)
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual([])
  })
})
