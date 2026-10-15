// node snake/tools/test.cjs — Snake rules (engine.js), loaded in a sandbox; deterministic.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/engine.js'), 'utf8'), ctx);
const { Game } = ctx.window.SnakeEngine;
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };
const rngFrom = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const head = g => g.snake[0];
const occupied = g => { const s = new Set(); for (const c of g.snake) s.add(c.x + ',' + c.y); return s; };
const setSnake = (g, cells, dir) => {          // cells head first
  g.grid.fill(0); g.snake = cells.map(([x, y]) => ({ x, y })); for (const c of g.snake) g.grid[c.y * g.cols + c.x] = 1;
  g.dir = dir; g.queue = []; g.dead = false; g.won = false; g.deathCause = null;
};

// --- start state
const g0 = new Game(17, 15, 'classic', rngFrom(1));
ok(g0.snake.length === 4 && g0.dir === 'right' && !g0.dead, 'starts with a 4-long snake heading right');
ok(g0.apples.length === 1 && !occupied(g0).has(g0.apples[0].x + ',' + g0.apples[0].y), 'first apple is off the snake');
ok(g0.apples[0].y === head(g0).y && g0.apples[0].x > head(g0).x, 'first apple straight ahead');

// --- growth by exactly one per apple, score once
const g1 = new Game(17, 15, 'classic', rngFrom(2));
g1.apples = [{ x: head(g1).x + 1, y: head(g1).y }];
const len0 = g1.snake.length, ev = g1.step();
ok(ev.type === 'eat' && g1.snake.length === len0 + 1 && g1.score === 1, 'eating grows by one and scores once');
ok(g1.apples.length === 1 && !occupied(g1).has(g1.apples[0].x + ',' + g1.apples[0].y), 'a new apple appears on a free cell');
g1.step();
ok(g1.snake.length === len0 + 1, 'no extra growth on the next step');

// --- walls (classic) and wrap boundaries
const g2 = new Game(10, 9, 'classic', rngFrom(3));
setSnake(g2, [[9, 4], [8, 4], [7, 4]], 'right'); g2.apples = [{ x: 0, y: 0 }];
ok(g2.step().type === 'die' && g2.deathCause === 'wall', 'classic: hitting the right wall kills');
const g3 = new Game(10, 9, 'wrap', rngFrom(3));
setSnake(g3, [[9, 4], [8, 4], [7, 4]], 'right'); g3.apples = [{ x: 5, y: 0 }];
g3.step(); ok(!g3.dead && head(g3).x === 0 && head(g3).y === 4, 'wrap: right edge to column 0, same row');
setSnake(g3, [[3, 0], [3, 1], [3, 2]], 'up'); g3.step();
ok(!g3.dead && head(g3).x === 3 && head(g3).y === 8, 'wrap: top edge to the bottom row');
setSnake(g3, [[9, 4], [8, 4], [0, 4], [0, 3]], 'right');
ok(g3.step().type === 'die' && g3.deathCause === 'self', 'wrap: crossing an edge into the body still kills');

// --- self collision, and the vacating tail rule
const g4 = new Game(10, 9, 'classic', rngFrom(4));
setSnake(g4, [[4, 4], [5, 4], [5, 5], [4, 5], [3, 5]], 'down'); g4.apples = [{ x: 0, y: 0 }];
ok(g4.step().type === 'die' && g4.deathCause === 'self', 'running into the body kills');
setSnake(g4, [[4, 4], [5, 4], [5, 5], [4, 5]], 'down'); g4.apples = [{ x: 0, y: 0 }];
const st = g4.step();
ok(st.type === 'move' && !g4.dead && head(g4).x === 4 && head(g4).y === 5, 'moving into the tail cell is legal when the tail leaves');
setSnake(g4, [[4, 4], [5, 4], [5, 5], [4, 5]], 'down'); g4.apples = [{ x: 4, y: 5 }];   // apple on the tail: tail stays
ok(g4.step().type === 'die', 'into the tail while growing (tail stays) kills');

// --- turns: no reversal, queue of two, one turn per step, redundant entries ignored
const g5 = new Game(17, 15, 'classic', rngFrom(5));
ok(!g5.enqueue('left'), 'immediate reversal refused');
ok(!g5.enqueue('right'), 'same direction is redundant');
ok(g5.enqueue('up') && g5.enqueue('left'), 'right-up-left queues two legal turns');
ok(!g5.enqueue('down'), 'a third turn does not fit the buffer');
const y0 = head(g5).y, x0 = head(g5).x;
g5.apples = [{ x: 0, y: 0 }];
g5.step(); ok(g5.dir === 'up' && head(g5).y === y0 - 1 && head(g5).x === x0, 'first queued turn on the first step');
g5.step(); ok(g5.dir === 'left' && head(g5).x === x0 - 1, 'second turn on the next step (no instant reversal)');
ok(g5.queue.length === 0, 'queue consumed one per step');
ok(!g5.enqueue('right'), 'reversal checked against the effective direction');

// --- three apples: unique, and fewer when space runs out
const g6 = new Game(10, 9, 'apples3', rngFrom(6));
const keys = g6.apples.map(a => a.x + ',' + a.y);
ok(g6.apples.length === 3 && new Set(keys).size === 3, '3 Apples: three distinct apples');
const g7 = new Game(4, 3, 'apples3', rngFrom(7));
// fill all but two cells with snake: only 2 apples can exist
const cells = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) cells.push([x, y]);
setSnake(g7, cells.slice(0, 10).reverse(), 'right'); g7.apples = [];
let spawned = 0; while (g7.apples.length < 3 && g7.spawnApple()) spawned++;
ok(spawned === 2 && g7.apples.length === 2, 'scarce space: apple count drops instead of looping forever');
ok(g7.spawnApple() === null, 'no free cell: spawn reports none');

// --- full board is a win and does not try to place more food
const g8 = new Game(4, 3, 'classic', rngFrom(8));
const path8 = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2], [2, 2]];   // 11 cells, head last
setSnake(g8, path8.slice().reverse(), 'right'); g8.apples = [{ x: 3, y: 2 }];
const w = g8.step();
ok(w.type === 'win' && g8.won && g8.snake.length === 12, 'filling the board wins');
ok(g8.step() === null, 'no further steps after a win');

// --- restart clears score, body, queue, apples and flags
g5.score = 9; g5.enqueue('down'); g5.dead = true; g5.reset();
ok(g5.score === 0 && g5.snake.length === 4 && g5.queue.length === 0 && !g5.dead && !g5.won && g5.dir === 'right', 'reset restores the start state');

// --- long seeded run: no overlap, legal cells, apples never on the body
for (const mode of ['classic', 'wrap', 'apples3']) {
  const r = rngFrom(42), g = new Game(17, 15, mode, r);
  let steps = 0, bad = '';
  for (let i = 0; i < 20000 && !bad; i++) {
    if (g.dead || g.won) g.reset();
    if (r() < 0.3) g.enqueue(['up', 'down', 'left', 'right'][Math.floor(r() * 4)]);
    // steer away from walls a little so runs last
    const h = head(g);
    if (mode !== 'wrap' && (h.x <= 0 || h.x >= g.cols - 1 || h.y <= 0 || h.y >= g.rows - 1)) g.enqueue(h.y < g.rows / 2 ? 'down' : 'up');
    g.step(); steps++;
    const occ = occupied(g);
    if (occ.size !== g.snake.length) bad = 'snake overlaps itself';
    if (g.snake.some(c => c.x < 0 || c.y < 0 || c.x >= g.cols || c.y >= g.rows)) bad = 'snake left the board';
    if (g.apples.some(a => occ.has(a.x + ',' + a.y)) && !g.dead) bad = 'apple on the snake';
    if (new Set(g.apples.map(a => a.x + ',' + a.y)).size !== g.apples.length) bad = 'duplicate apples';
  }
  ok(!bad, `${mode}: ${steps} seeded steps keep the board consistent${bad ? ' — ' + bad : ''}`);
}

if (fails.length) { for (const f of fails) console.log('FAIL', f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} snake rule checks passed`);
