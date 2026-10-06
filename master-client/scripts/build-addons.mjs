// Generates the starter Add-Ons in addons/. Every texture here is drawn in code,
// so nothing of Mojang's is redistributed. Run `npm run assets` after editing.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { PNG } from 'pngjs'

const ROOT = resolve('addons')
const MIN_ENGINE = [1, 21, 90]

// Fixed UUIDs: these packs are the same on every install.
const ID = {
  cleanUi: { header: '3af51956-c8ba-42ff-9e33-969a15e3bf13', module: '5bca794b-be7f-4a59-bca1-752144ea6fcf' },
  toolsRp: { header: '89d1ceee-ce8c-4f81-89a5-2ec03fd791ca', module: 'a11242c0-bf06-4c2d-a4a7-5f87247750c7' },
  toolsBp: { header: 'fa400bda-7fbe-444c-9f8a-fc48c2fb4cab', data: '0b5a9d44-a85a-4f39-af1e-a9f99712bd2c', script: '9d4a4886-56fb-498a-b621-dfd2567595db' },
  visuals: { header: '7af629e9-d049-404b-9087-665870e02554', module: '2c1dc71a-dd72-4b39-ad2d-159e9d1d9d9d' }
}
const VERSION = [1, 0, 0]

// ---------------------------------------------------------------- tiny canvas
class Canvas {
  constructor(w, h) {
    this.w = w
    this.h = h
    this.d = Buffer.alloc(w * h * 4)
  }
  set(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return
    const i = (y * this.w + x) * 4
    this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = c[3] ?? 255
  }
  rect(x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c)
  }
  frame(x, y, w, h, c) {
    this.rect(x, y, w, 1, c); this.rect(x, y + h - 1, w, 1, c); this.rect(x, y, 1, h, c); this.rect(x + w - 1, y, 1, h, c)
  }
  draw(rows, palette, ox = 0, oy = 0) {
    rows.forEach((r, y) => [...r].forEach((ch, x) => palette[ch] && this.set(ox + x, oy + y, palette[ch])))
  }
  png() {
    const p = new PNG({ width: this.w, height: this.h })
    this.d.copy(p.data)
    return PNG.sync.write(p)
  }
}

const hex = (h, a = 255) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a]

const GLYPHS = {
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..']
}

function icon(letter, color) {
  const size = 128
  const c = new Canvas(size, size)
  const top = hex(color)
  const bottom = top.map((v, i) => (i < 3 ? Math.round(v * 0.4) : 255))
  const r = 22
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.max(r - x, 0, x - (size - 1 - r))
      const dy = Math.max(r - y, 0, y - (size - 1 - r))
      if (dx * dx + dy * dy > r * r) continue
      const t = (x + y) / (size * 2)
      c.set(x, y, top.map((v, i) => (i < 3 ? Math.round(v + (bottom[i] - v) * t) : 255)))
    }
  }
  const px = 11
  const ox = Math.round((size - 5 * px) / 2)
  const oy = Math.round((size - 7 * px) / 2)
  GLYPHS[letter].forEach((row, gy) => [...row].forEach((ch, gx) => ch === '#' && c.rect(ox + gx * px, oy + gy * px, px, px, [255, 255, 255, 255])))
  return c.png()
}

// ---------------------------------------------------------------- writing
function write(rel, content) {
  const p = join(ROOT, rel)
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, typeof content === 'string' || Buffer.isBuffer(content) ? content : JSON.stringify(content, null, 2) + '\n')
}

function rpManifest(name, description, ids) {
  return {
    format_version: 2,
    header: { name, description, uuid: ids.header, version: VERSION, min_engine_version: MIN_ENGINE },
    modules: [{ type: 'resources', uuid: ids.module, version: VERSION }],
    metadata: { authors: ['Master Client'], license: 'MIT' }
  }
}

rmSync(ROOT, { recursive: true, force: true })

// ================================================================ Clean UI
{
  const base = 'master_clean_ui'
  write(`${base}/addon.json`, {
    id: 'clean_ui',
    name: 'Master Clean UI',
    description: 'A see-through hotbar with thin borders and a crisp selection outline.',
    kind: 'resources',
    packs: [{ folder: 'pack', type: 'resources', uuid: ID.cleanUi.header, version: VERSION }],
    details: ['Translucent hotbar slots', 'Bright selection outline', 'Works with Master Client HUD modules']
  })
  write(`${base}/pack/manifest.json`, rpManifest('Master Clean UI', 'Clean, see-through hotbar. From Master Client.', ID.cleanUi))
  write(`${base}/pack/pack_icon.png`, icon('U', '#3d7bff'))
  for (let i = 0; i <= 8; i++) {
    const c = new Canvas(20, 22)
    c.rect(1, 1, 18, 20, [12, 12, 18, 120])
    c.frame(0, 0, 20, 22, [255, 255, 255, 70])
    write(`${base}/pack/textures/ui/hotbar_${i}.png`, c.png())
  }
  for (const cap of ['hotbar_start_cap', 'hotbar_end_cap']) {
    const c = new Canvas(1, 22)
    c.rect(0, 0, 1, 22, [255, 255, 255, 70])
    write(`${base}/pack/textures/ui/${cap}.png`, c.png())
    write(`${base}/pack/textures/ui/${cap}.json`, { nineslice_size: 0, base_size: [1, 22] })
  }
  const sel = new Canvas(24, 24)
  sel.frame(0, 0, 24, 24, [255, 255, 255, 255])
  sel.frame(1, 1, 22, 22, [255, 255, 255, 160])
  sel.rect(2, 2, 20, 20, [255, 255, 255, 28])
  write(`${base}/pack/textures/ui/selected_hotbar_slot.png`, sel.png())
}

// ================================================================ Master Tools (BP + RP)
{
  const base = 'master_tools'
  write(`${base}/addon.json`, {
    id: 'master_tools',
    name: 'Master Tools',
    description: 'Three handy items for your own worlds: an item magnet, a recall charm and a glow wand.',
    kind: 'addon',
    packs: [
      { folder: 'rp', type: 'resources', uuid: ID.toolsRp.header, version: VERSION },
      { folder: 'bp', type: 'data', uuid: ID.toolsBp.header, version: VERSION }
    ],
    details: [
      'Item Magnet: hold it to pull dropped items to you (iron + redstone)',
      'Recall Charm: use it to go back to your spawn point (ender pearl + gold)',
      'Glow Wand: places invisible light where you point (glowstone + stick)',
      'Turn on "Master Tools" in a world\'s Behavior Packs. Adding one turns off achievements for that world.'
    ]
  })

  write(`${base}/rp/manifest.json`, rpManifest('Master Tools Resources', 'Textures for Master Tools.', ID.toolsRp))
  write(`${base}/rp/pack_icon.png`, icon('T', '#18c6a3'))
  write(`${base}/rp/textures/item_texture.json`, {
    resource_pack_name: 'master_tools',
    texture_name: 'atlas.items',
    texture_data: {
      mc_magnet: { textures: 'textures/items/mc_magnet' },
      mc_recall_charm: { textures: 'textures/items/mc_recall_charm' },
      mc_glow_wand: { textures: 'textures/items/mc_glow_wand' }
    }
  })
  const items = {
    mc_magnet: [
      '................',
      '................',
      '...RRRR..RRRR...',
      '...RRRR..RRRR...',
      '...RRrr..rrRR...',
      '...RRrr..rrRR...',
      '...RRrr..rrRR...',
      '...RRrr..rrRR...',
      '...RRrr..rrRR...',
      '...RRRr..rRRR...',
      '....RRRrrRRR....',
      '.....RRRRRR.....',
      '......RRRR......',
      '................',
      '...SS......SS...',
      '................'
    ],
    mc_recall_charm: [
      '................',
      '.......gg.......',
      '......g..g......',
      '......g..g......',
      '.......gg.......',
      '......BBBB......',
      '.....BbbbBB.....',
      '....BbwbbbBB....',
      '....BbbbbbBB....',
      '....BBbbbbBB....',
      '.....BBbbBB.....',
      '......BBBB......',
      '.......BB.......',
      '................',
      '................',
      '................'
    ],
    mc_glow_wand: [
      '............YY..',
      '...........YWWY.',
      '..........YWWWY.',
      '...........YWY..',
      '..........kk....',
      '.........kk.....',
      '........kk......',
      '.......kk.......',
      '......kk........',
      '.....kk.........',
      '....kk..........',
      '...kk...........',
      '..kk............',
      '................',
      '................',
      '................'
    ]
  }
  const pal = {
    R: hex('#c62f2f'), r: hex('#7a1a1a'), S: hex('#cfd8dc'),
    g: hex('#e8b923'), B: hex('#1f4fbf'), b: hex('#3f8cff'), w: hex('#e8f4ff'),
    Y: hex('#ffd84d'), W: hex('#fffbe0'), k: hex('#7a5230')
  }
  for (const [name, rows] of Object.entries(items)) {
    const c = new Canvas(16, 16)
    c.draw(rows, pal)
    write(`${base}/rp/textures/items/${name}.png`, c.png())
  }

  write(`${base}/bp/manifest.json`, {
    format_version: 2,
    header: {
      name: 'Master Tools',
      description: 'Item magnet, recall charm and glow wand. For your own worlds.',
      uuid: ID.toolsBp.header,
      version: VERSION,
      min_engine_version: MIN_ENGINE
    },
    modules: [
      { type: 'data', uuid: ID.toolsBp.data, version: VERSION },
      { type: 'script', language: 'javascript', uuid: ID.toolsBp.script, version: VERSION, entry: 'scripts/main.js' }
    ],
    dependencies: [
      { uuid: ID.toolsRp.header, version: VERSION },
      { module_name: '@minecraft/server', version: '2.0.0' }
    ],
    metadata: { authors: ['Master Client'], license: 'MIT' }
  })
  write(`${base}/bp/pack_icon.png`, icon('T', '#18c6a3'))

  const item = (id, name, iconName, extra = {}) => ({
    format_version: '1.21.40',
    'minecraft:item': {
      description: { identifier: `masterclient:${id}`, menu_category: { category: 'equipment' } },
      components: {
        'minecraft:icon': iconName,
        'minecraft:display_name': { value: name },
        'minecraft:max_stack_size': 1,
        'minecraft:hand_equipped': true,
        ...extra
      }
    }
  })
  write(`${base}/bp/items/magnet.json`, item('magnet', 'Item Magnet', 'mc_magnet'))
  write(`${base}/bp/items/recall_charm.json`, item('recall_charm', 'Recall Charm', 'mc_recall_charm', { 'minecraft:cooldown': { category: 'masterclient_recall', duration: 10 } }))
  write(`${base}/bp/items/glow_wand.json`, item('glow_wand', 'Glow Wand', 'mc_glow_wand', { 'minecraft:cooldown': { category: 'masterclient_glow', duration: 0.25 } }))

  const shaped = (id, pattern, key) => ({
    format_version: '1.20.10',
    'minecraft:recipe_shaped': {
      description: { identifier: `masterclient:${id}_recipe` },
      tags: ['crafting_table'],
      pattern,
      key,
      unlock: [{ item: Object.values(key)[0] }],
      result: { item: `masterclient:${id}` }
    }
  })
  write(`${base}/bp/recipes/magnet.json`, shaped('magnet', ['I I', 'I I', 'RIR'], { I: 'minecraft:iron_ingot', R: 'minecraft:redstone' }))
  write(`${base}/bp/recipes/recall_charm.json`, shaped('recall_charm', [' G ', 'GEG', ' G '], { E: 'minecraft:ender_pearl', G: 'minecraft:gold_ingot' }))
  write(`${base}/bp/recipes/glow_wand.json`, shaped('glow_wand', ['  L', ' S ', 'S  '], { L: 'minecraft:glowstone', S: 'minecraft:stick' }))

  write(
    `${base}/bp/scripts/main.js`,
    `// Master Tools. Stable @minecraft/server 2.x APIs only.
import { EquipmentSlot, system, world } from '@minecraft/server'

const MAGNET = 'masterclient:magnet'
const RECALL = 'masterclient:recall_charm'
const GLOW = 'masterclient:glow_wand'

function holding(player, id) {
  const eq = player.getComponent('minecraft:equippable')
  if (!eq) return false
  return eq.getEquipment(EquipmentSlot.Mainhand)?.typeId === id || eq.getEquipment(EquipmentSlot.Offhand)?.typeId === id
}

// Item Magnet: while it's in either hand, dropped items within 8 blocks come to you.
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (!holding(player, MAGNET)) continue
    const items = player.dimension.getEntities({ type: 'minecraft:item', location: player.location, maxDistance: 8 })
    for (const item of items) {
      try {
        item.teleport(player.location)
      } catch {
        // the item was picked up or despawned this tick
      }
    }
  }
}, 4)

const FACE = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 }
}

world.afterEvents.itemUse.subscribe(({ source: player, itemStack }) => {
  if (!itemStack) return
  if (itemStack.typeId === RECALL) {
    const spawn = player.getSpawnPoint()
    if (spawn) {
      player.teleport({ x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 }, { dimension: spawn.dimension })
    } else {
      const overworld = world.getDimension('overworld')
      const d = world.getDefaultSpawnLocation()
      const top = d.y > 320 ? overworld.getTopmostBlock({ x: d.x, z: d.z }) : undefined
      const y = top ? top.location.y + 1 : d.y
      player.teleport({ x: d.x + 0.5, y, z: d.z + 0.5 }, { dimension: overworld })
    }
    player.playSound('mob.endermen.portal')
    return
  }
  if (itemStack.typeId === GLOW) {
    const hit = player.getBlockFromViewDirection({ maxDistance: 8 })
    if (!hit) return
    const off = FACE[hit.face] ?? FACE.Up
    const target = hit.block.offset(off)
    if (target && target.isAir) {
      target.setType('minecraft:light_block_14')
      player.playSound('random.orb')
    }
  }
})
`
  )
}

// ================================================================ Master Visuals
{
  const base = 'master_visuals'
  write(`${base}/addon.json`, {
    id: 'visuals',
    name: 'Master Visuals',
    description: 'Clear glass: thin-framed glass and panes you can actually see through, in every colour.',
    kind: 'resources',
    packs: [{ folder: 'pack', type: 'resources', uuid: ID.visuals.header, version: VERSION }],
    details: ['Clear glass and glass panes', 'All 16 stained glass colours', 'Vanilla compatible: only replaces glass textures']
  })
  write(`${base}/pack/manifest.json`, rpManifest('Master Visuals', 'Clear glass. From Master Client.', ID.visuals))
  write(`${base}/pack/pack_icon.png`, icon('V', '#ff4fa3'))
  const colors = {
    '': '#dfeff5', black: '#1d1d21', blue: '#3c44aa', brown: '#835432', cyan: '#169c9c', gray: '#474f52',
    green: '#5e7c16', light_blue: '#3ab3da', lime: '#80c71f', magenta: '#c74ebd', orange: '#f9801d',
    pink: '#f38baa', purple: '#8932b8', red: '#b02e26', silver: '#9d9d97', white: '#f9fffe', yellow: '#fed83d'
  }
  for (const [name, col] of Object.entries(colors)) {
    const tint = hex(col)
    const block = new Canvas(16, 16)
    block.rect(1, 1, 14, 14, [tint[0], tint[1], tint[2], name ? 70 : 0])
    block.frame(0, 0, 16, 16, [tint[0], tint[1], tint[2], 230])
    block.set(2, 2, [255, 255, 255, 140])
    block.set(3, 2, [255, 255, 255, 90])
    block.set(2, 3, [255, 255, 255, 90])
    write(`${base}/pack/textures/blocks/glass${name ? `_${name}` : ''}.png`, block.png())
    const pane = new Canvas(16, 16)
    pane.rect(7, 0, 2, 16, [tint[0], tint[1], tint[2], 230])
    write(`${base}/pack/textures/blocks/glass_pane_top${name ? `_${name}` : ''}.png`, pane.png())
  }
}

console.log('Starter add-ons written to', ROOT)
