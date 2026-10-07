// Headless check: loads the game data and engine in Node, builds every
// tower path to tier 5, fires every ability and plays rounds on every map.
// node tools/sim.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {}, console, Math, performance: { now: () => Date.now() }, Set, Map, Float32Array, Uint8Array };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['bloons', 'rounds', 'maps', 'engine', 'towers', 'heroes']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
const BTD = ctx.BTD;
let fails = 0;
const check = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } };

function freeSpot(G, key, near) {
  for (let i = 0; i < 4000; i++) {
    const x = 20 + Math.random() * (BTD.W - 40), y = 20 + Math.random() * (BTD.H - 40);
    if (near && Math.hypot(x - near.x, y - near.y) > 200) continue;
    if (G.canPlace(key, x, y)) return { x, y };
  }
  return null;
}
function play(G, rounds, maxT) {
  for (let r = 0; r < rounds && !G.over; r++) {
    G.startRound();
    let t = 0;
    while (G.roundActive && !G.over && t < (maxT || 400)) { G.step(1 / 60); t += 1 / 60; }
  }
}

// 1. every tower, every crosspath combo to 5-2-0 style, abilities
for (const k of BTD.TOWER_ORDER) {
  for (let main = 0; main < 3; main++) {
    const side = (main + 1) % 3;
    const map = BTD.MAPS.find((m) => (BTD.TOWERS[k].water ? m.water : true));
    const G = new BTD.Game({ map, diff: 'Medium', mode: { id: 'x', start: 1, end: 200 } });
    G.cash = 1e9;
    G.round = 0;
    const p = freeSpot(G, k, G.trackPts[Math.floor(G.trackPts.length / 2)]) || freeSpot(G, k);
    check(p, `${k}: no spot`);
    if (!p) continue;
    const t = G.place(k, p.x, p.y);
    check(t, `${k}: place failed`);
    for (let i = 0; i < 5; i++) check(G.upgrade(t, main), `${k} path ${main} tier ${i + 1}`);
    for (let i = 0; i < 2; i++) check(G.upgrade(t, side), `${k} side ${side} tier ${i + 1}`);
    check(!G.upgrade(t, (main + 2) % 3), `${k} third path should be closed`);
    try {
      G.round = 44; play(G, 2, 120);
      if (t.stats.ability) { t.abilityCd = 0; G.startRound(); for (let i = 0; i < 60; i++) G.step(1 / 60); G.useAbility(t); for (let i = 0; i < 600; i++) G.step(1 / 60); }
      G.round = 98; G.over = false; G.lives = 1e9; play(G, 2, 60);
    } catch (e) { fails++; console.log('ERR', k, main, e.stack); }
  }
}
console.log('towers done');

// 2. heroes level up and abilities
for (const h of BTD.HERO_ORDER) {
  const G = new BTD.Game({ map: BTD.MAPS[0], diff: 'Medium', mode: { id: 'x', start: 1, end: 200 }, hero: h });
  G.cash = 1e6;
  const p = freeSpot(G, 'hero:' + h);
  const t = G.place('hero:' + h, p.x, p.y);
  check(t, 'hero place ' + h);
  try {
    G.heroXp(t, 1e7);
    check(t.hero.lvl === 20, h + ' level 20');
    G.round = 39; G.lives = 1e9; play(G, 2, 200);
    if (t.stats.ability) { t.abilityCd = 0; G.startRound(); for (let i = 0; i < 30; i++) G.step(1 / 60); G.useAbility(t); for (let i = 0; i < 300; i++) G.step(1 / 60); }
  } catch (e) { fails++; console.log('ERR hero', h, e.stack); }
}
console.log('heroes done');

// 3. every map: a basic dart defence survives early rounds; all rounds spawn
for (const m of BTD.MAPS) {
  const G = new BTD.Game({ map: m, diff: 'Easy', mode: BTD.MODES.Easy[0] });
  check(G.paths.every((p) => p.len > 600), m.id + ' path length');
  let placed = 0;
  for (const pt of G.trackPts.filter((_, i) => i % 25 === 0)) {
    const s = freeSpot(G, 'dart', pt);
    if (s && G.cash >= 200 && G.place('dart', s.x, s.y)) placed++;
  }
  check(placed >= 2, m.id + ' placed darts ' + placed);
  play(G, 6);
  check(!G.over, m.id + ' survived 6 rounds, lives ' + G.lives);
  console.log(m.id, 'len', G.paths.map((p) => Math.round(p.len)).join('/'), 'lives', G.lives, 'cash', Math.floor(G.cash), 'darts', placed, 'water', G.cells.filter((c) => c & 2).length);
}
// rounds parse
for (let r = 1; r <= 140; r++) {
  const spec = BTD.roundSpec(r);
  for (const [c, t] of spec) check(BTD.BLOONS[t.split(':')[0]] && c > 0, 'round ' + r + ' ' + t);
}
// rbe sanity vs BTD6
check(BTD.BLOONS.ceramic.rbe === 104 && BTD.BLOONS.moab.rbe === 616, 'rbe ' + BTD.BLOONS.ceramic.rbe + ' ' + BTD.BLOONS.moab.rbe);
check(BTD.BLOONS.moab.pops === 381, 'moab pops ' + BTD.BLOONS.moab.pops);
console.log(fails ? fails + ' failures' : 'all good');
process.exit(fails ? 1 : 0);
