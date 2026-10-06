// Copies the handful of vanilla Bedrock definitions the pack engine has to
// override wholesale (fog settings, crit particles, a few render controllers and
// projectile client entities) out of a checkout of Mojang/bedrock-samples.
//
//   git clone --depth 1 https://github.com/Mojang/bedrock-samples
//   node scripts/snapshot-vanilla.mjs ../bedrock-samples
//
// Those files are Mojang's and are used under the Minecraft EULA, which allows
// building add-ons from them. Only what's needed is copied.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'

const src = resolve(process.argv[2] ?? '../bedrock-samples')
const rp = join(src, 'resource_pack')

function strip(text) {
  let out = ''
  let i = 0
  let s = false
  while (i < text.length) {
    const c = text[i], n = text[i + 1]
    if (s) { out += c; if (c === '\\') { out += n ?? ''; i += 2; continue } if (c === '"') s = false; i++; continue }
    if (c === '"') { s = true; out += c; i++ }
    else if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++ }
    else if (c === '/' && n === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i += 2 }
    else { out += c; i++ }
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1').replace(/^﻿/, ''))
}
const read = (p) => strip(readFileSync(p, 'utf8'))

const NETHER = ['hell', 'basalt_deltas', 'crimson_forest', 'warped_forest', 'soulsand_valley']
const END = ['the_end']

const fogs = {}
for (const f of readdirSync(join(rp, 'fogs')).filter((f) => f.endsWith('.json')).sort()) {
  const name = basename(f, '_fog_setting.json')
  const json = read(join(rp, 'fogs', f))
  const dimension = NETHER.includes(name) ? 'nether' : END.includes(name) ? 'end' : 'overworld'
  fogs[f] = { dimension, json }
}

const particles = {}
for (const f of ['critical_hit.json', 'basic_crit.json', 'magic_critical_hit.json']) particles[f] = read(join(rp, 'particles', f))

const renderControllers = {}
for (const f of [
  'player.render_controllers.json',
  'zombie.render_controllers.json',
  'zombie.v2.render_controllers.json',
  'skeleton.render_controllers.json',
  'creeper.render_controllers.json',
  'spider.render_controllers.json',
  'enderman.render_controllers.json'
]) {
  renderControllers[f] = read(join(rp, 'render_controllers', f))
}

const entities = {}
for (const f of ['arrow.entity.json', 'thrown_trident.entity.json', 'ender_pearl.entity.json', 'snowball.entity.json', 'egg.entity.json']) {
  entities[f] = read(join(rp, 'entity', f))
}

// Vibrant Visuals lighting. Full bright raises the ambient light in a copy of this.
const lighting = read(join(rp, 'lighting', 'global.json'))

let commit = 'unknown'
try { commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD']).toString().trim() } catch {}
const manifest = read(join(rp, 'manifest.json'))

const out = {
  source: 'https://github.com/Mojang/bedrock-samples',
  commit,
  minEngineVersion: manifest.header.min_engine_version,
  fogs,
  particles,
  renderControllers,
  entities,
  lighting
}
const dest = resolve('src/main/packs/vanilla/vanilla.json')
writeFileSync(dest, JSON.stringify(out))
console.log(`wrote ${dest} (${Object.keys(fogs).length} fogs, commit ${commit.slice(0, 8)})`)
