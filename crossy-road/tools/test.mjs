// node tools/test.mjs [seeds] [rows] — rules, characters, shop and a passability run with the autopilot.
import assert from 'node:assert/strict';
import { Game, Profile, CHARACTERS, memoryStorage, zoneOf, BIOME_ROWS, VEHICLES, PRIZE_PRICE, GEM_VALUE, CHALLENGES, TPS } from '../js/logic.js';
import { MODELS } from '../js/characters.js';
import { Autopilot } from '../js/autopilot.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
const seeds = +(process.argv[2] || 12), rows = +(process.argv[3] || 260);

// every character has a model made of valid boxes, ids are unique, and there are lots of them
ok(CHARACTERS.length >= 30, `${CHARACTERS.length} characters`);
ok(new Set(CHARACTERS.map(c => c.id)).size === CHARACTERS.length, 'character ids unique');
for (const c of CHARACTERS) {
  ok(MODELS[c.id], 'model for ' + c.id);
  const boxes = MODELS[c.id]();
  ok(boxes.length >= 5 && boxes.every(b => b.length >= 7 && b.slice(0, 6).every(Number.isFinite) && b[3] > 0 && b[4] > 0 && b[5] > 0), 'valid boxes for ' + c.id);
  const top = Math.max(...boxes.map(b => b[1] + b[4])), wide = Math.max(...boxes.map(b => Math.abs(b[0]) + b[3] / 2));
  ok(top < 16 && wide < 8, `${c.id} fits on a tile`);
}
// prize machine
const prof = new Profile(memoryStorage({ coins: PRIZE_PRICE * 2 }));
const won = prof.prize(() => 0.5);
ok(won && prof.owned.has(won.id) && prof.selected === won.id && prof.coins === PRIZE_PRICE, 'prize machine gives a new character');
prof.coins = PRIZE_PRICE - 1; ok(prof.prize() === null, 'prize needs coins');
// world: zones, new vehicles, floats, gems
const g = new Game({ seed: 99 });
g.ensure(BIOME_ROWS * 3 + 5);
const lanes = [...g.lanes.values()];
ok(lanes.every(l => l.zone === zoneOf(l.row)), 'every lane knows its biome');
ok(new Set(lanes.map(l => l.zone)).size >= 4, 'biomes change along the run');
const kinds = new Set(), floats = new Set();
for (let s = 1; s < 30; s++) { const w = new Game({ seed: s }); w.ensure(300); for (const l of w.lanes.values()) { if (l.type === 'road') l.items.forEach(v => kinds.add(v.kind)); if (l.type === 'river') l.items.forEach(v => floats.add(v.kind)); if (l.gem) floats.add('gem'); } }
for (const k of Object.keys(VEHICLES)) ok(kinds.has(k), 'vehicles include ' + k);
for (const k of ['log', 'turtles', 'raft', 'pad', 'gem']) ok(floats.has(k), 'world includes ' + k);
// a gem is worth more
{
  const w = new Game({ seed: 5 }); w.ensure(200);
  const lane = [...w.lanes.values()].find(l => l.gem);
  w.player.row = lane.row - 1; w.player.x = lane.coin; w.player.maxRow = lane.row - 1;
  w.player.hop = { fromRow: lane.row - 1, fromX: lane.coin, toRow: lane.row, toX: lane.coin, k: 7, float: null, water: false, dir: 'up' };
  w.step();
  ok(w.coins === GEM_VALUE, 'a gem is worth ' + GEM_VALUE + ' coins');
}
// passability across several biomes
let worst = Infinity;
for (let s = 1; s <= seeds; s++) {
  const w = new Game({ seed: s * 7919 }), pilot = new Autopilot();
  while (!w.player.dead && w.score < rows && w.tick < rows * 60 * 4) { pilot.update(w); w.step(); }
  worst = Math.min(worst, w.score);
  ok(w.score >= rows, `seed ${s * 7919}: autopilot reached ${w.score}${w.player.dead ? ' (died: ' + w.player.dead.type + ')' : ''}`);
}
// "fast": 20 s of invincibility against everything, and it can be used again and again
{
  const g = new Game({ seed: 77 });
  ok(g.makeInvincible() && g.invincible && Math.abs(g.invLeft() - 20) < 0.02, 'fast gives 20 s of invincibility');
  for (const kind of ['car', 'train', 'drown', 'drift', 'eagle']) { g.die(kind); ok(!g.player.dead, 'invincible to ' + kind); }
  // hop straight ahead for 15 s through whatever comes: never dies
  const dirs = ['up', 'up', 'up', 'left', 'up', 'right', 'up', 'right'];
  for (let i = 0; i < 15 * TPS; i++) { if (i % 9 === 0) g.input(dirs[(i / 9) % dirs.length]); g.step(); }
  ok(!g.player.dead && g.score > 5, `ran ${g.score} rows blind without dying`);
  for (let i = 0; i < 6 * TPS; i++) g.step();
  ok(!g.invincible, 'it wears off');
  g.die('car'); ok(g.player.dead, 'then cars hurt again');
  const h = new Game({ seed: 78 }); h.makeInvincible(); for (let i = 0; i < 19 * TPS; i++) h.step(); h.makeInvincible();
  ok(Math.abs(h.invLeft() - 20) < 0.02, 'typing it again restarts the 20 s');
}
// codes and challenge skins
{
  const pr = new Profile(memoryStorage({ coins: 99999 }));
  ok(!pr.canBuy('golden') && !pr.buy('ironsuit'), 'secret and challenge skins cannot be bought');
  ok(pr.redeem('nope') === null && pr.redeem(' GOLDEN ')?.id === 'golden' && pr.owned.has('golden') && pr.selected === 'golden', 'redeem "golden" -> Golden Chicken');
  ok(CHALLENGES.length >= 10 && CHALLENGES.every(c => ['classic', 'autumn', 'desert', 'jungle', 'snow', 'spooky', 'night', 'candy', 'space', 'metro', 'volcano', 'retro'].includes(c.theme)), `${CHALLENGES.length} challenge skins, each with a world`);
  const won = pr.recordRun({ score: 80, roads: 41, rails: 2, logs: 5, coins: 3 });
  ok(won.some(c => c.id === 'ironsuit') && won.some(c => c.id === 'starshield') && won.some(c => c.id === 'miner') && !pr.owned.has('marine'), 'a 80-row, 41-road run unlocks Iron Suit, Star Shield and Block Miner');
  ok(pr.records.score === 80 && pr.recordRun({ score: 10 }).length === 0 && pr.records.score === 80, 'best stats are kept');
  for (let i = 0; i < 40; i++) pr.prize?.(() => 0.99);
  ok(!CHALLENGES.some(c => pr.owned.has(c.id) && !['ironsuit', 'starshield', 'miner'].includes(c.id)), 'the prize machine never gives challenge skins');
  const g = new Game({ seed: 5 }); for (let i = 0; i < 600; i++) { if (i % 12 === 0) g.input('up'); g.step(); if (g.player.dead) break; }
  const st = g.runStats(); ok(st.roads + st.rails + st.rivers <= st.score && st.score >= 0, 'run stats count lanes crossed');
}
console.log(`${n} crossy road checks passed (autopilot reached ${rows}+ on ${seeds} seeds, worst ${worst})`);
