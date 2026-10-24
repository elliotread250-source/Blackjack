// node minesweeper/tools/test.cjs — board rules (board.js), seeded and deterministic.
'use strict';
const M = require('../js/board.js');
const { Board, HIDDEN, REVEALED, FLAGGED, QUESTION, mulberry32 } = M;
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };

// --- presets
ok(M.LEVELS.beginner.w === 9 && M.LEVELS.beginner.h === 9 && M.LEVELS.beginner.mines === 10, 'beginner 9x9/10');
ok(M.LEVELS.intermediate.w === 16 && M.LEVELS.intermediate.h === 16 && M.LEVELS.intermediate.mines === 40, 'intermediate 16x16/40');
ok(M.LEVELS.expert.w === 30 && M.LEVELS.expert.h === 16 && M.LEVELS.expert.mines === 99, 'expert 30x16/99');

// --- first click safety, mine count and uniqueness across many seeds, presets and custom density limits
const configs = [[9, 9, 10], [16, 16, 40], [30, 16, 99], [9, 9, M.maxMines(9, 9)], [30, 24, M.maxMines(30, 24)], [12, 9, M.maxMines(12, 9)]];
let boards = 0, safeAll = true, countAll = true, zoneAll = true;
for (const [w, h, mines] of configs) {
  for (let seed = 1; seed <= 300; seed++) {
    const r = mulberry32(seed * 7919 + w);
    const first = Math.floor(r() * w * h);
    const b = new Board(w, h, mines, { rng: mulberry32(seed) });
    const res = b.reveal(first);
    boards++;
    if (b.mine[first] || !res || res.lost) safeAll = false;
    if (b.mineList().length !== mines) countAll = false;
    if (b.neighbours(first).some(i => b.mine[i])) zoneAll = false;   // stronger guarantee: neighbours clear too
  }
}
ok(safeAll, `first click never a mine (${boards} boards incl. max density)`);
ok(countAll, 'exactly the requested number of mines, each in a different cell');
ok(zoneAll, 'the first click\'s neighbours are clear (opens an area), even at maximum density');
ok(9 * 9 - M.maxMines(9, 9) >= 9 && 30 * 24 - M.maxMines(30, 24) >= 9, 'custom limits always leave room for the 3x3 safe zone');

// --- neighbour counts at corners, edges and interior
const b = new Board(5, 4, 0);
b.setMines([0, 1, 5, 19]);   // (0,0) (1,0) (0,1) (4,3)
ok(b.count[6] === 3, 'interior next to three mines counts 3');
ok(b.count[18] === 1 && b.count[14] === 1 && b.count[13] === 1, 'corner mine counted by its 3 neighbours');
ok(b.neighbours(0).length === 3 && b.neighbours(2).length === 5 && b.neighbours(6).length === 8, 'corner/edge/interior neighbour counts');

// --- flood fill: zeros spread, numbers form the border, flags are never opened
const f = new Board(6, 6, 0);
f.setMines([35]);
f.toggleFlag(0);
const res = f.reveal(14);
ok(res && !res.lost && f.state[0] === FLAGGED, 'flood fill does not open a flagged cell');
ok(f.state[28] === REVEALED && f.count[28] === 1, 'numbered border cells open');
ok(f.state[35] === HIDDEN, 'the mine stays hidden');
ok(f.status === 'playing', 'game continues while a flagged safe cell remains');
f.toggleFlag(0); f.reveal(0);
ok(f.status === 'won', 'revealing the last safe cell wins, even with mines unflagged');
ok(f.state[35] === FLAGGED && f.flags === 1, 'on a win every mine gets a flag');

// --- flags: never reveal, ? marks optional, counter rule
const g = new Board(4, 4, 0); g.setMines([15]);
ok(g.toggleFlag(3) === FLAGGED && g.flags === 1, 'flag on');
ok(g.reveal(3) === null && g.state[3] === FLAGGED, 'clicking a flagged cell does nothing');
ok(g.toggleFlag(3, true) === QUESTION && g.flags === 0, 'flag -> ? with marks on, flag count drops');
ok(g.toggleFlag(3, true) === HIDDEN, '? -> hidden');
ok(g.toggleFlag(3, false) === FLAGGED && g.toggleFlag(3, false) === HIDDEN, 'without marks: flag -> hidden');

// --- chording: only with matching flags; a wrong flag is a real risk
const c = new Board(4, 4, 0); c.setMines([0]);
c.reveal(5);                                       // count 1 at (1,1)
ok(c.chord(5) === null, 'no chord without the right number of flags');
c.toggleFlag(0);
const cr = c.chord(5);
ok(cr && !cr.lost && c.state[10] === REVEALED, 'correct flag: chord opens the neighbours');
const d = new Board(4, 4, 0); d.setMines([0]);
d.reveal(5); d.toggleFlag(1);                      // wrong flag
const dr = d.chord(5);
ok(dr && dr.lost && d.exploded[0] === 1, 'wrong flag: chord detonates the real mine');
ok(d.status === 'lost' && d.reveal(15) === null && d.toggleFlag(15) === null, 'no actions after a loss');

// --- defeat marks the triggering mine
const e = new Board(4, 4, 0); e.setMines([10]);
e.reveal(0);
const er = e.reveal(10);
ok(er.lost && e.exploded[10] === 1 && e.status === 'lost', 'revealing a mine loses and marks it exploded');

// --- restart: a fresh board has nothing carried over
const fresh = new Board(9, 9, 10);
ok(!fresh.generated && fresh.flags === 0 && fresh.revealed === 0 && fresh.status === 'ready', 'restart gives a clean board');

// --- clampCustom documents the limits (the UI now validates inline before using it)
const cc = M.clampCustom(40, 5, 999);
ok(cc.w === 30 && cc.h === 9 && cc.mines === M.maxMines(30, 9), 'clampCustom limits');

if (fails.length) { for (const x of fails) console.log('FAIL', x); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} minesweeper board checks passed (${boards} seeded first clicks)`);
