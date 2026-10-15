// node tools/test.mjs — slicing geometry, flight, scoring, combos, bombs, lives and the clock.
import assert from 'node:assert/strict';
import { segmentHits, newGame, spawnWave, step, slice, takeEvents, FRUITS, GRAVITY } from '../js/logic.js';

let n = 0; const ok = (v, m) => { assert(v, m); n++; };
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);

ok(segmentHits(0, 0, 100, 0, 50, 10, 12) && !segmentHits(0, 0, 100, 0, 50, 20, 12), 'segment passes near a circle');
ok(segmentHits(0, 0, 10, 0, 15, 0, 6) && !segmentHits(0, 0, 10, 0, 20, 0, 6), 'segment end caps');
// thrown things rise into view and come back down
let g = newGame('zen', 800, 600, rnd);
spawnWave(g);
let peak = Infinity;
for (let i = 0; i < 400; i++) { step(g, 1 / 120); for (const t of g.things) peak = Math.min(peak, t.y); }
ok(peak > 0 && peak < 600 * 0.6, `fruit peaks inside the screen (y=${peak.toFixed(0)})`);
// cutting scores and makes two halves; a 3-fruit swipe is a combo
g = newGame('classic', 800, 600, rnd);
g.things = [0, 1, 2].map(i => ({ id: i, kind: 'apple', x: 200 + i * 100, y: 300, vx: 0, vy: 0, r: 30, rot: 0, spin: 0, delay: 0, cut: false }));
ok(slice(g, 100, 300, 600, 300) === 3 && g.score === 3 && g.halves.length === 6, 'three fruit cut in one swipe');
step(g, 0.5);
ok(g.score === 6 && takeEvents(g).some(e => e.type === 'combo' && e.n === 3), '3-fruit combo pays 3 extra');
// bombs end Classic, cost points in Arcade
g = newGame('classic', 800, 600, rnd);
g.things = [{ id: 1, kind: 'bomb', x: 300, y: 300, vx: 0, vy: 0, r: 30, delay: 0 }];
slice(g, 250, 300, 350, 300); ok(g.over && g.why === 'bomb', 'bomb ends a Classic game');
g = newGame('arcade', 800, 600, rnd); g.score = 25;
g.things = [{ id: 1, kind: 'bomb', x: 300, y: 300, vx: 0, vy: 0, r: 30, delay: 0 }];
slice(g, 250, 300, 350, 300); ok(!g.over && g.score === 15, 'bomb costs 10 in Arcade');
// misses cost lives in Classic only
g = newGame('classic', 800, 600, rnd);
g.nextWave = 999;
g.things = [0, 1, 2].map(i => ({ id: i, kind: 'orange', x: 100 + i * 200, y: 650, vx: 0, vy: 100, r: 30, delay: 0, cut: false }));
step(g, 0.1); ok(g.lives === 0 && g.over && g.why === 'missed', 'three misses end Classic');
g = newGame('zen', 800, 600, rnd); g.nextWave = 999;
g.things = [{ id: 1, kind: 'orange', x: 100, y: 650, vx: 0, vy: 100, r: 30, delay: 0, cut: false }];
step(g, 0.1); ok(!g.over && g.missed === 0, 'misses are free in Zen');
// the clock
g = newGame('arcade', 800, 600, rnd);
for (let i = 0; i < 70 * 30; i++) step(g, 1 / 30);
ok(g.over && g.why === 'time', 'Arcade ends after 60 seconds');
// bananas
g = newGame('arcade', 800, 600, rnd);
g.things = [{ id: 1, kind: 'frenzy', x: 300, y: 300, vx: 0, vy: 0, r: 30, delay: 0 }, { id: 2, kind: 'apple', x: 400, y: 300, vx: 0, vy: 0, r: 30, delay: 0 }];
slice(g, 250, 300, 450, 300); ok(g.frenzy > 0 && g.score === 1 + 2, 'frenzy banana doubles points');
g.things = [{ id: 3, kind: 'freeze', x: 300, y: 300, vx: 0, vy: 0, r: 30, delay: 0 }];
slice(g, 250, 300, 350, 300); ok(g.freeze > 0, 'freeze banana slows time');
// a long Zen game never throws a bomb and keeps throwing fruit
g = newGame('zen', 800, 600, rnd);
let kinds = new Set();
for (let i = 0; i < 85 * 60; i++) { step(g, 1 / 60); for (const t of g.things) kinds.add(t.kind); }
ok(!kinds.has('bomb') && [...kinds].every(k => FRUITS[k]) && kinds.size >= 8, `zen threw ${kinds.size} kinds of fruit and no bombs`);
ok(GRAVITY > 0, 'gravity');
console.log(n + ' fruit ninja checks passed');
