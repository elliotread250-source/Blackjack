// Balance probe: a greedy bot plays a map and reports how far it gets.
// node tools/bot.js meadow Medium
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, performance: { now: () => Date.now() }, Set, Map, Float32Array, Uint8Array };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['bloons', 'rounds', 'maps', 'engine', 'towers', 'heroes']) vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), ctx);
const BTD = ctx.BTD;
const [mapId = 'meadow', diff = 'Medium', modeId = 'standard', seed = '1'] = process.argv.slice(2);
let s = +seed; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
const map = BTD.MAPS.find((m) => m.id === mapId);
const mode = BTD.MODES[diff].find((m) => m.id === modeId);
const G = new BTD.Game({ map, diff, mode, hero: 'quincy' });
// plan: [tower, path order]
const plan = [['hero:quincy'], ['dart', [2, 2, 0]], ['tack', [2, 2, 0]], ['bomb', [1, 1, 2, 2, 1]], ['ninja', [0, 0, 2, 0, 2]], ['wizard', [0, 0, 1, 0, 0, 1]], ['farm', [0, 0, 2, 2]], ['tack', [0, 0, 2, 0, 2, 0]], ['sniper', [0, 1, 0, 1, 0, 0]], ['super', [0, 0, 2, 0, 2, 0]], ['village', [1, 1, 0, 0]], ['alchemist', [0, 0, 0, 2]], ['bomb', [1, 1, 2, 1, 2, 1]], ['super', [1, 1, 0, 0, 1, 1]], ['spike', [1, 1, 0, 0, 1]], ['ice', [0, 0, 1, 0, 0, 1]]];
let step = 0, sub = 0, cur = null;
const pts = G.trackPts;
function spot(k) {
  // like a player: try candidates and keep the one that covers the most track
  const def = k.startsWith('hero:') ? BTD.HEROES[k.slice(5)] : BTD.TOWERS[k];
  const rng = Math.min(def.base.range || 120, 160);
  let best = null, bv = -1;
  for (let i = 0; i < 400; i++) {
    const p = pts[Math.floor(pts.length * (0.1 + Math.random() * 0.8))];
    const a = Math.random() * 6.28, d = 28 + Math.random() * 40;
    const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
    if (!G.canPlace(k, x, y)) continue;
    let v = 0;
    for (const q of pts) if ((q.x - x) ** 2 + (q.y - y) ** 2 < rng * rng) v++;
    if (v > bv) { bv = v; best = { x, y }; }
  }
  return best;
}
function spend() {
  for (let guard = 0; guard < 40; guard++) {
    if (step >= plan.length) step = 1 + Math.floor(Math.random() * (plan.length - 1));
    const [k, ups] = plan[step];
    if (!cur) {
      if (G.cash < G.towerCost(k)) return;
      const p = spot(k); if (!p) { step++; continue; }
      cur = G.place(k, p.x, p.y); sub = 0;
      if (!cur) { step++; continue; }
    }
    if (!ups || sub >= ups.length) { cur = null; step++; continue; }
    const pp = ups[sub];
    if (!G.canUpgradePath(cur, pp)) { sub++; continue; }
    if (G.upgradeCost(cur, pp) > Math.max(2500, G.round * 250)) { sub++; continue; }
    if (G.cash < G.upgradeCost(cur, pp)) return;
    G.upgrade(cur, pp); sub++;
  }
}
let t0 = Date.now();
while (!G.over && !G.won) {
  spend();
  G.startRound();
  let t = 0;
  while (G.roundActive && !G.over && t < 600) { G.step(1 / 60); t += 1 / 60; for (const b of G.bananas) G.collectBanana(b); if (Math.floor(t * 60) % 60 === 0) spend(); }
  for (const tw of G.towers) if (tw.stats.ability && tw.abilityCd <= 0 && G.bloons.length) G.useAbility(tw);
  if (G.round % 5 === 0 || G.over) console.log('round', G.round, 'lives', G.lives, 'cash', Math.floor(G.cash), 'towers', G.towers.length, 'bloons', G.bloons.length, 'plan', step, plan[step] && plan[step][0], sub, G.towers.map((t) => t.k + t.up.join('')).join(' '));
}
console.log(G.won ? 'WON' : 'LOST', 'round', G.round, 'lives', G.lives, 'secs', (Date.now() - t0) / 1000);
