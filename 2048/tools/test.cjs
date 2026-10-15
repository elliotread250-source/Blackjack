// node 2048/tools/test.cjs — rules of 2048 (logic.js), deterministic.
'use strict';
const L = require('../js/logic.js');
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const seq = vals => { let i = 0; return () => vals[i++ % vals.length]; };   // scripted randomness

// --- the brief's acceptance examples (left moves, before spawning)
eq(L.slideLine([2, 2, 2, 2]), { line: [4, 4, 0, 0], score: 8, moved: true }, '[2,2,2,2] left');
eq(L.slideLine([2, 0, 2, 2]), { line: [4, 2, 0, 0], score: 4, moved: true }, '[2,0,2,2] left');
eq(L.slideLine([4, 4, 8, 0]), { line: [8, 8, 0, 0], score: 8, moved: true }, '[4,4,8,0] left (new 8 must not merge again)');
eq(L.slideLine([2, 2, 2, 0]).line, [4, 2, 0, 0], 'the pair nearest the wall merges first');
eq(L.slideLine([2, 4, 8, 16]), { line: [2, 4, 8, 16], score: 0, moved: false }, 'no-op line');
eq(L.slideLine([0, 0, 0, 2]).line, [2, 0, 0, 0], 'gap compression');
eq(L.slideLine([8, 0, 0, 8]), { line: [16, 0, 0, 0], score: 16, moved: true }, 'merge across gaps');
eq(L.slideLine([4, 4, 4, 4, 4]).line, [8, 8, 4, 0, 0], 'odd run on a 5-wide line');

// --- all four directions on the same board, via move()
const B = [[2, 0, 2, 4], [0, 4, 4, 0], [8, 0, 0, 8], [2, 2, 2, 2]];
const after = d => L.toRows(L.move(L.fromValues(B), d).state.cells, 4);
eq(after('left'), [[4, 4, 0, 0], [8, 0, 0, 0], [16, 0, 0, 0], [4, 4, 0, 0]], 'move left');
eq(after('right'), [[0, 0, 4, 4], [0, 0, 0, 8], [0, 0, 0, 16], [0, 0, 4, 4]], 'move right');
eq(after('up'), [[2, 4, 2, 4], [8, 2, 4, 8], [2, 0, 2, 2], [0, 0, 0, 0]], 'move up');
eq(after('down'), [[0, 0, 0, 0], [2, 0, 2, 4], [8, 4, 4, 8], [2, 2, 2, 2]], 'move down');
const scored = L.move(L.fromValues(B), 'left');
ok(scored.gained === 4 + 8 + 16 + 8 && scored.state.score === 36, 'score gain equals the sum of merged tiles');
ok(scored.state.moves === 1, 'a real move counts once');

// --- no-ops: nothing changes, no move counted, no spawn, no randomness consumed
const stuck = L.fromValues([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]);
const r0 = L.move(stuck, 'left');
ok(!r0.moved && r0.state.moves === 0 && r0.slides.length === 0, 'blocked move is a no-op');
let calls = 0; const counting = () => { calls++; return 0.5; };
// the game only spawns when moved is true; emulate its rule and check randomness stays untouched
if (r0.moved) L.spawn(r0.state, counting);
ok(calls === 0, 'a no-op consumes no randomness');

// --- single-merge limit and tile identity
const m = L.move(L.fromValues([[2, 2, 4, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
eq(L.toRows(m.state.cells, 4)[0], [4, 4, 0, 0], 'a new 4 does not merge with the existing 4');
ok(m.merged.length === 1 && m.removed.length === 2, 'one merge reported, both parents removed');
const ids = m.state.cells.filter(Boolean).map(t => t.id);
ok(new Set(ids).size === ids.length, 'tile ids stay unique');

// --- spawning: one tile in an empty cell, 2 at 90% / 4 at 10%
const s1 = L.fromValues([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 0]]);
const sp = L.spawn(s1, seq([0.3, 0.95]));
ok(sp.at === 15 && sp.v === 4, 'spawn uses the only empty cell, high roll gives a 4');
ok(L.spawn(s1, seq([0.1])) === null, 'no spawn on a full board');
let fours = 0; const R = L.newGame; void R;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 20000; i++) { const s = L.createState(4); if (L.spawn(s, rnd).v === 4) fours++; }
ok(fours > 1700 && fours < 2300, `about 10% fours (${fours}/20000)`);
const ng = L.newGame(4, rnd);
ok(ng.cells.filter(Boolean).length === 2, 'a new game starts with exactly two tiles in distinct cells');

// --- defeat only when no move exists
ok(!L.canMove(L.fromValues([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]).cells, 4), 'checkerboard full board: no moves');
ok(L.canMove(L.fromValues([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 8, 8]]).cells, 4), 'full board with an adjacent pair is not over');
ok(L.canMove(L.fromValues([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 2], [4, 2, 4, 8]]).cells, 4), 'vertical-only pair still counts');

// --- target: 2048 announced once, keep going does not re-announce
const w = L.move(L.fromValues([[1024, 1024, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), 'left');
ok(w.justWon && w.state.won, 'reaching 2048 wins');
const w2 = L.move(Object.assign(w.state, { keepPlaying: true, cells: L.fromValues([[2048, 0, 1024, 1024], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]).cells }), 'left');
ok(w2.moved && !w2.justWon, 'a second 2048 after winning does not interrupt again');

// --- other sizes keep the same rules
for (const size of [3, 5, 6]) {
  const s = L.createState(size); s.cells[0] = { id: 1, v: 2 }; s.cells[size - 1] = { id: 2, v: 2 }; s.nextId = 3;
  const r = L.move(s, 'left');
  ok(r.moved && r.state.cells[0].v === 4 && r.gained === 4, `${size}x${size}: edge-to-edge merge`);
}

// --- long random game: invariants hold on every move
seed = 99; let g = L.newGame(4, rnd), total = 0;
for (let i = 0; i < 3000 && !g.over; i++) {
  const d = L.DIRECTIONS[Math.floor(rnd() * 4)], before = g.cells.reduce((a, t) => a + (t ? t.v : 0), 0);
  const r = L.move(g, d);
  if (!r.moved) continue;
  const mid = r.state.cells.reduce((a, t) => a + (t ? t.v : 0), 0);
  if (mid !== before) { ok(false, 'tile sum must be preserved by a move'); break; }
  g = r.state; L.spawn(g, rnd); g.over = !L.canMove(g.cells, 4); total++;
}
ok(total > 50, `random game ran ${total} moves with the tile sum preserved`);

if (fails.length) { for (const f of fails) console.log('FAIL', f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} 2048 logic checks passed`);
