// node tools/test.mjs [seeds] [rows] — rules, characters, shop and a passability run with the autopilot.
import assert from 'node:assert/strict';
import { Game, Profile, CHARACTERS, memoryStorage, zoneOf, BIOME_ROWS, VEHICLES, PRIZE_PRICE, GEM_VALUE, CHALLENGES, TPS, replayRun, NEW_2026, PRIZE_MAX_PRICE, TRAIN_WARN, trainState, HOP_CHOICES, hopFor, QUICK_HOP, QUICK_SKIN } from '../js/logic.js';
import { overlaps } from './overlap.mjs';
import { DAILIES, dailiesForDay, progressOf, liveValue, BASE_REWARD, RARITY_BONUS, dayOf, nextResetMs } from '../js/dailies.js';
import { MODELS, batPose } from '../js/characters.js';
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
// secret skins: codes, solid models, and the 1-tick hop that belongs to Quackers alone
{
  const sp = new Profile(memoryStorage());
  ok(sp.redeem('Parkour Sam')?.id === 'batcostume' && sp.selected === 'batcostume' && sp.owned.has('batcostume'), '"parkour sam" gives the Bat Costume');
  ok(new Profile(memoryStorage()).redeem('  PARKOUR   sam ')?.id === 'batcostume', 'codes ignore capitals and extra spaces');
  ok(sp.redeem('quackers250')?.id === 'quackers' && sp.selected === 'quackers', '"quackers250" gives Quackers');
  ok(sp.redeem('quackers') === null && sp.redeem('parkoursam') === null, 'near misses give nothing');
  ok(CHARACTERS.find(c => c.id === 'batcostume').price === null && CHARACTERS.find(c => c.id === 'quackers').price === null, 'neither skin can be bought');
  for (const tucked of [false, true]) {
    batPose.tucked = tucked;
    ok(overlaps(MODELS.batcostume()).length === 0, `batcostume (${tucked ? 'tucked in' : 'stretched out'}): no boxes pass through each other`);
  }
  ok(overlaps(MODELS.quackers()).length === 0, 'quackers: no boxes pass through each other');
  batPose.tucked = false; const spreadW = Math.max(...MODELS.batcostume().map(b => Math.abs(b[0]) + b[3] / 2)); batPose.tucked = true; const tuckW = Math.max(...MODELS.batcostume().map(b => Math.abs(b[0]) + b[3] / 2)); batPose.tucked = false;
  ok(spreadW > 7 && tuckW < 4 && MODELS.batcostume().length > 60 && MODELS.quackers().length > 25, 'bat wings really stretch out or tuck in; both secret models are detailed');
  ok(hopFor(QUICK_HOP, QUICK_SKIN) === 1 && hopFor(QUICK_HOP, 'duck') === 4 && hopFor(QUICK_HOP, 'chicken') === 4 && hopFor(8, QUICK_SKIN) === 8 && hopFor(4, 'chicken') === 4, '1 tick only with Quackers on');
  const q = new Game({ seed: 4242, hopTicks: QUICK_HOP }); const qa = new Autopilot(); let qn = 0;
  while (!q.player.dead && q.score < 150 && qn++ < 100000) { qa.update(q); q.step(); q.events.length = 0; }
  const qr = replayRun({ seed: 4242, hopTicks: QUICK_HOP, inputs: q.inputs, endTick: q.tick });
  ok(q.score >= 150 && qr.score === q.score && qr.coins === q.coins && JSON.stringify(qr.stats) === JSON.stringify(q.runStats()), `1-tick run replays exactly (score ${q.score})`);
  const qh = new Game({ seed: 1, hopTicks: QUICK_HOP }); qh.input('up'); qh.step(); let qt = 0; while (qh.player.hop && qt < 50) { qh.step(); qt++; }
  ok(qt === 1 && qh.hopTicks === 1, 'a 1-tick hop takes exactly 1 tick');
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
// ---------------------------------------------------------------- 2026: daily challenges catalogue
{
  ok(DAILIES.length === 100, 'exactly 100 daily challenges');
  ok(new Set(DAILIES.map(d => d.id)).size === 100, 'challenge ids unique');
  const by = (k, v) => DAILIES.filter(d => d[k] === v).length;
  ok(by('tier', 'easy') === 35 && by('tier', 'medium') === 35 && by('tier', 'hard') === 30, 'tiers 35 / 35 / 30');
  ok(by('rarity', 'standard') === 50 && by('rarity', 'rare') === 25 && by('rarity', 'epic') === 15 && by('rarity', 'legendary') === 10, 'rarities 50 / 25 / 15 / 10');
  ok(DAILIES.filter(d => d.bonus > 0).length === 50, '50 missions pay a rarity bonus');
  ok(BASE_REWARD.easy === 10 && BASE_REWARD.medium === 25 && BASE_REWARD.hard === 50, 'base rewards 10 / 25 / 50');
  ok(DAILIES.every(d => d.reward === BASE_REWARD[d.tier] + RARITY_BONUS[d.rarity]), 'reward = base + rarity bonus');
  ok(DAILIES.find(d => d.id === 'E01').reward === 10 && DAILIES.find(d => d.id === 'E19').reward === 15 && DAILIES.find(d => d.id === 'M27').reward === 40 && DAILIES.find(d => d.id === 'H26').reward === 80, 'examples: Easy Standard 10, Easy Rare 15, Medium Epic 40, Hard Legendary 80');
  const ranges = { E: [[1, 18, 'standard'], [19, 28, 'rare'], [29, 33, 'epic'], [34, 35, 'legendary']], M: [[1, 17, 'standard'], [18, 26, 'rare'], [27, 32, 'epic'], [33, 35, 'legendary']], H: [[1, 15, 'standard'], [16, 21, 'rare'], [22, 25, 'epic'], [26, 30, 'legendary']] };
  ok(DAILIES.every(d => ranges[d.id[0]].some(([a, b, r]) => +d.id.slice(1) >= a && +d.id.slice(1) <= b && d.rarity === r)), 'rarity ranges match the brief (E01-18 standard ... H26-30 legendary)');
  // rotation: one per tier, different, the same every time, and every mission used before any repeats
  const d0 = 20374;
  const days = [...Array(35)].map((_, i) => dailiesForDay(d0 + i));
  ok(days.every(ids => ids.length === 3 && ids[0][0] === 'E' && ids[1][0] === 'M' && ids[2][0] === 'H'), 'one Easy, one Medium, one Hard each day');
  ok(JSON.stringify(dailiesForDay(d0)) === JSON.stringify(dailiesForDay(d0)), 'the same three on every device');
  const passStart = d => Math.floor(d / 35) * 35;
  const p0 = passStart(d0 + 40);
  const easyPass = [...Array(35)].map((_, i) => dailiesForDay(p0 + i)[0]);
  ok(new Set(easyPass).size === 35, 'all 35 Easy missions come up once in a pass');
  const h0 = Math.floor((d0 + 40) / 30) * 30;
  ok(new Set([...Array(30)].map((_, i) => dailiesForDay(h0 + i)[2])).size === 30, 'all 30 Hard missions come up once in a pass');
  ok(dayOf(Date.UTC(2026, 9, 14, 23, 59, 59)) + 1 === dayOf(Date.UTC(2026, 9, 15, 0, 0, 0)) && nextResetMs(Date.UTC(2026, 9, 14, 12)) === Date.UTC(2026, 9, 15), 'days roll over at 00:00 UTC');
  // progress rules on made-up runs
  const run = o => ({ score: 0, ordCoins: 0, gems: 0, fwd: 0, side: 0, back: 0, roads: 0, rails: 0, rivers: 0, logs: 0, noBackRow: 0, sideAt: {}, ...o });
  const D = id => DAILIES.find(d => d.id === id);
  ok(progressOf(D('E01'), [run({ score: 9 }), run({ score: 12 })]).done, 'reach row 10 in one run');
  ok(progressOf(D('M09'), [run({ score: 30, roads: 12 }), run({ score: 30, roads: 9 })]).value === 20, 'roads add up across runs');
  ok(progressOf(D('M18'), [run({ score: 30, ordCoins: 3 }), run({ score: 30, ordCoins: 3 })]).value === 3, '"in one run" does not add up');
  ok(progressOf(D('E16'), [run({ score: 10 }), run({ score: 11 }), run({ score: 2 })]).value === 2, 'counts separate runs');
  ok(progressOf(D('E05'), [run({ score: 2, ordCoins: 1 })]).value === 0, 'instant restarts (under row 3) never count');
  ok(progressOf(D('E05'), [run({ score: 40, ordCoins: 5, practice: true })]).value === 0, 'practice runs never count');
  ok(progressOf(D('M25'), [run({ score: 40, ordCoins: 9, gems: 0 })]).value === 0 && progressOf(D('M25'), [run({ score: 40, gems: 1 })]).done, 'jewels and coins are tracked separately');
  ok(progressOf(D('M19'), [run({ score: 90, noBackRow: 55 })]).value === 55 && progressOf(D('M19'), [run({ score: 61, noBackRow: 61 })]).done, 'no-backward-hop rows');
  ok(progressOf(D('M20'), [run({ score: 60, sideAt: { 10: 1, 20: 3, 30: 5, 40: 7, 50: 9 } })]).value === 40 && progressOf(D('M20'), [run({ score: 60, sideAt: { 50: 7 } })]).done, 'fewer than 8 sideways hops by row 50');
  ok(liveValue(D('M09'), 15, run({ score: 20, roads: 6 })) === 20 && liveValue(D('E01'), 0, run({ score: 7 })) === 7, 'live preview adds the run in progress');
}
// ---------------------------------------------------------------- 2026: replays, hop speeds, jewels, trains
{
  for (const hopTicks of HOP_CHOICES) {
    const g = new Game({ seed: 4242, hopTicks }); const ap = new Autopilot(); let n = 0;
    while (!g.player.dead && g.score < 120 && n++ < 100000) { ap.update(g); g.step(); g.events.length = 0; }
    const r = replayRun({ seed: 4242, hopTicks, inputs: g.inputs, endTick: g.tick });
    ok(r.score === g.score && r.coins === g.coins && JSON.stringify(r.stats) === JSON.stringify(g.runStats()), `${hopTicks}-tick run replays exactly (score ${g.score})`);
    const h = new Game({ seed: 1, hopTicks }); h.input('up'); h.step(); let t = 0; while (h.player.hop && t < 50) { h.step(); t++; }   // the first step starts the hop
    ok(t === hopTicks, `a hop takes exactly ${hopTicks} ticks`);
  }
  const fast = replayRun({ seed: 9, inputs: [[0, 'up']], fast: [5], endTick: 600 });
  ok(fast.practice, 'a replay with "fast" is a practice run');
  ok(GEM_VALUE === 3, 'blue jewel is worth 3');
  const gj = new Game({ seed: 2 });
  gj.ensure(30);
  let gemRow = null;
  for (let r = 1; r < 400 && gemRow === null; r++) { const l = gj.lane(r); if (l.gem && l.type === 'grass') gemRow = r; }
  ok(gemRow !== null, 'jewels exist in the world');
  // stand the player next to the jewel and hop onto it
  const L = gj.lane(gemRow); Object.assign(gj.player, { row: gemRow - 1, x: L.coin, maxRow: gemRow - 1 });
  gj.lanes.set(gemRow - 1, { row: gemRow - 1, type: 'grass', blocked: new Set(), deco: [], items: [], speed: 0, dir: 1 });
  gj.input('up'); for (let i = 0; i < 12; i++) gj.step();
  const ev = gj.takeEvents().find(e => e.type === 'coin');
  ok(ev && ev.gem && ev.value === 3 && gj.coins === 3 && gj.stats.gems === 1 && gj.stats.ordCoins === 0, 'picking up a jewel gives exactly 3 coins and counts as a jewel');
  ok(TRAIN_WARN >= 2, `trains warn for ${TRAIN_WARN}s`);
  const tg = new Game({ seed: 31 }); tg.ensure(300);
  const rail = [...tg.lanes.values()].find(l => l.type === 'rail');
  let lastPhase = 'idle', warnT = 0, okWarn = true;
  for (let t = 0; t < 60; t += 1 / 60) {
    const s = trainState(rail, t);
    if (s.phase === 'warn') warnT += 1 / 60;
    if (s.phase === 'pass' && lastPhase === 'idle') okWarn = false;
    if (s.phase === 'idle') warnT = 0;
    lastPhase = s.phase;
  }
  ok(okWarn, 'a train never arrives without the warning first');
}
// ---------------------------------------------------------------- 2026: characters and the shop
{
  const NEW = [['foresthog', 25], ['squirrel', 35], ['goldfish', 50], ['hamster', 60], ['chick', 75], ['raccoon', 85], ['goat', 95], ['toucan', 110], ['sloth', 125], ['koala', 140], ['beaver', 150], ['otter', 170], ['axolotl', 190], ['redpanda', 200], ['peacock', 225], ['wolf', 250], ['boar', 275], ['flamingo', 300], ['arcticfox', 325], ['meerkat', 350], ['wyvern', 375], ['goldknight', 400], ['sorcerer', 450], ['pirateparrot', 500], ['samurai', 550], ['cyberfox', 600], ['deer', 700], ['crystalgolem', 800], ['whale', 900], ['royalphoenix', 1000]];
  ok(NEW_2026.size === 30 && NEW.every(([id, price]) => CHARACTERS.find(c => c.id === id)?.price === price), '30 new characters at the exact prices (Royal Phoenix 1,000)');
  ok(new Set(NEW.map(([id]) => JSON.stringify(MODELS[id]()))).size === 30, 'every new character has its own model');
  ok(MODELS.royalphoenix().length >= Math.max(...NEW.filter(([id]) => id !== 'royalphoenix').map(([id]) => MODELS[id]().length)), 'the Royal Phoenix is the most detailed of the new characters');
  ok(['chicken', 'pig', 'golden', 'ironsuit', 'phoenix'].every(id => CHARACTERS.some(c => c.id === id)) && CHARACTERS.find(c => c.id === 'pig').price === 60, 'original, secret and challenge skins kept (pig still 60)');
  const pr = new Profile(memoryStorage({ coins: 100000 }));
  const seen = new Set();
  for (let i = 0; i < 200; i++) { const c = pr.prize(Math.random); if (!c) break; seen.add(c.id); }
  ok(!seen.has('royalphoenix') && [...seen].every(id => CHARACTERS.find(c => c.id === id).price <= PRIZE_MAX_PRICE), 'the prize machine never gives characters over 300 coins');
}
console.log(`${n} crossy road checks passed (autopilot reached ${rows}+ on ${seeds} seeds, worst ${worst})`);
