// node tools/test.mjs — economy checks, no dependencies.
import assert from 'node:assert/strict';
import { newState, load, price, cps, clickValue, click, tick, buy, affordable, availableUpgrades, buyUpgrade, checkAchievements, golden, offline, format, UPGRADES, ACHIEVEMENTS, BUILDINGS } from '../js/logic.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
let s = newState(0);
ok(click(s) === 1 && s.cookies === 1 && s.clicks === 1, 'a click bakes one cookie');
ok(price('cursor', 0) === 15 && price('cursor', 1) === Math.ceil(15 * 1.15), 'prices grow by 15%');
{ let sum = 0; for (let i = 0; i < 10; i++) sum += 15 * Math.pow(1.15, i); ok(Math.abs(price('cursor', 0, 10) - Math.ceil(sum)) <= 1, 'bulk price equals the sum of single prices'); }
ok(!buy(s, 'cursor'), 'cannot buy what you cannot afford');
s.cookies = 15; ok(buy(s, 'cursor') && s.owned.cursor === 1 && s.cookies === 0, 'buying spends cookies');
ok(Math.abs(cps(s) - 0.1) < 1e-9, 'a cursor makes 0.1 per second');
tick(s, 10); ok(Math.abs(s.cookies - 1) < 1e-9, 'ten seconds of one cursor is one cookie');
s.cookies = 1e4; ok(affordable(s, 'cursor', 100) > 10, 'affordable counts how many you can buy');
// upgrades
s = newState(0); s.cookies = 1e6; buy(s, 'grandma');
const grandma0 = availableUpgrades(s).find(u => u.id === 'grandma0');
ok(grandma0, 'owning a grandma unlocks her first upgrade');
const before = cps(s); ok(buyUpgrade(s, 'grandma0') && Math.abs(cps(s) - before * 2) < 1e-9, 'tier upgrades double a building');
ok(!buyUpgrade(s, 'grandma1'), 'tier 2 needs 5 grandmas');
s.owned.cursor = 1; buyUpgrade(s, 'cursor0'); ok(clickValue(s) === 2, 'cursor upgrades double clicks too');
// achievements boost production
s = newState(0); s.owned.farm = 1; const c0 = cps(s); s.baked = 1; checkAchievements(s); ok(s.achievements.includes('baked1') && cps(s) > c0, 'achievements give +1%');
// golden cookies
s = newState(0); s.owned.grandma = 10; s.cookies = 1e6;
let r = golden(s, 1000, () => 0.1); ok(r.kind === 'lucky' && r.gain === Math.min(1e6 * 0.15, 10 * 900) + 13, 'lucky pays the smaller of 15% bank and 15 min of CpS');
r = golden(s, 1000, () => 0.5); ok(r.kind === 'frenzy' && cps(s, 2000) === cps(s) * 7 && cps(s, 1000 + 78000) === cps(s), 'frenzy is ×7 for 77 s');
r = golden(s, 1000, () => 0.95); ok(r.kind === 'clickfrenzy' && clickValue(s, 2000) >= 777, 'click frenzy is ×777');
// offline production, capped at a day
s = newState(0); s.owned.grandma = 1; s.saved = 0;
ok(Math.abs(offline(s, 3600e3).gain - 3600) < 1e-6, 'an hour away with one grandma is 3600 cookies');
s.saved = 0; ok(Math.abs(offline(s, 10 * 86400e3).secs - 86400) < 1e-6, 'offline time capped at 24 h');
// saves survive junk
s = load({ cookies: -5, upgrades: ['nope', 'cursor0'], achievements: ['nope'], owned: { cursor: 3 } });
ok(s.cookies === 0 && s.upgrades.join() === 'cursor0' && !s.achievements.length && s.owned.cursor === 3, 'load cleans bad data');
ok(load(JSON.parse(JSON.stringify(newState(5)))).started === 5, 'save round-trips');
// formatting
ok(format(1234) === '1,234' && format(1.5e6) === '1.5 million' && format(2e12) === '2 trillion' && format(0.25, 1) === '0.3', 'number formatting');
ok(UPGRADES.length === BUILDINGS.length * 4 + 10 && new Set(UPGRADES.map(u => u.id)).size === UPGRADES.length, 'upgrade ids unique');
ok(new Set(ACHIEVEMENTS.map(a => a.id)).size === ACHIEVEMENTS.length, 'achievement ids unique');
// a long simulated game keeps growing
s = newState(0);
for (let t = 0; t < 3600 * 6; t++) {
  for (let k = 0; k < 3; k++) click(s);
  tick(s, 1);
  for (const u of availableUpgrades(s)) buyUpgrade(s, u.id);
  let best = null, bestValue = 0;
  for (const b of BUILDINGS) { const p = price(b.id, s.owned[b.id] || 0); const v = b.cps / p; if (p <= s.cookies && v > bestValue) { best = b.id; bestValue = v; } }
  if (best) buy(s, best);
  checkAchievements(s);
}
ok(s.baked > 1e9 && cps(s) > 1e5, `six simulated hours reach ${format(s.baked)} baked, ${format(cps(s))}/s`);
{
  const { megaGolden } = await import('../js/logic.js');
  const m = newState(0); m.owned.grandma = 3; const base = cps(m), clickBase = clickValue(m);
  const r2 = megaGolden(m, 1000);
  ok(r2.kind === 'mega' && cps(m, 2000) === base * 1000 && clickValue(m, 2000) === clickBase * 1000, 'secret golden cookie: ×1000 production and clicks');
  ok(cps(m, 1000 + 100001) === base, 'and it wears off after 100 seconds');
}
console.log(n + ' cookie clicker checks passed');
