// Master Tools. Stable @minecraft/server 2.x APIs only.
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
