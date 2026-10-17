// node tetris/tools/test.cjs — rules engine (js/engine.js): bag, movement, SRS kicks, hold, lock delay, scoring.
'use strict';
const E = require('../js/engine.js');
const { Game, ID, SHAPES, COLS, ROWS, TOP, SPAWN_X, SPAWN_Y } = E;
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fresh = (opts) => { const g = new Game(Object.assign({ rng: E.mulberry32(1) }, opts)); g.start(); return g; };
const withPiece = (type, rows, opts) => { const g = fresh(opts); if (rows) g.setBoardRows(rows); g.setActive(type); return g; };
const cellsOf = g => g.cells(g.active.type, g.active.rot, g.active.x, g.active.y);
const events = g => { const ev = []; g.on((t, d) => ev.push([t, d])); return ev; };
const finishClear = g => { while (g.phase === 'clearing') g.update(50); };

// --- 7-bag
{
  const bag = new E.Bag(E.mulberry32(9)), seq = [];
  for (let i = 0; i < 7 * 200; i++) seq.push(bag.next());
  let good = true;
  for (let i = 0; i < seq.length; i += 7) if (eq(seq.slice(i, i + 7).sort(), [1, 2, 3, 4, 5, 6, 7]) === false) good = false;
  ok(good, 'every group of 7 is one of each piece');
  let maxGap = 0; const last = {};
  seq.forEach((t, i) => { if (last[t] !== undefined) maxGap = Math.max(maxGap, i - last[t]); last[t] = i; });
  ok(maxGap <= 13, 'no piece is ever more than 13 apart (bag guarantee)');
  const a = new Game({ rng: E.mulberry32(5) }), b = new Game({ rng: E.mulberry32(5) });
  ok(eq(a.queue, b.queue), 'same seed, same queue');
  ok(a.queue.length === 7, 'queue keeps 7 ahead (5 shown)');
}

// --- spawn and movement
{
  const g = withPiece('T');
  ok(g.active.x === SPAWN_X && g.active.y === SPAWN_Y && g.active.rot === 0, 'spawns in the standard position');
  let moves = 0; while (g.shift(-1)) moves++;
  ok(moves === 3 && Math.min(...cellsOf(g).map(c => c[0])) === 0, 'left stops at the wall');
  moves = 0; while (g.shift(1)) moves++;
  ok(Math.max(...cellsOf(g).map(c => c[0])) === COLS - 1, 'right stops at the wall');
  const s = g.score; ok(g.softStep() && g.score === s + 1, 'soft drop scores 1 per row');
  const g2 = withPiece('O', ['....XX....', '....XX....']);
  const y0 = g2.active.y; g2.hardDrop();
  const top = Math.min(...g2.board.map((r, y) => r.some(v => v) ? y : 99));
  ok(top === ROWS - 4, 'hard drop lands on the stack');
}

// --- hard drop distance and points
{
  const g = withPiece('I'), ev = events(g);
  const y0 = g.active.y, s0 = g.score;
  g.hardDrop();
  const hd = ev.find(e => e[0] === 'harddrop')[1];
  ok(hd.dist === ROWS - 1 - (y0 + 1) && g.score - s0 === 2 * hd.dist, 'hard drop: distance to the floor, 2 points per row');
  ok(g.board[ROWS - 1].filter(Boolean).length === 4, 'the I lies flat on the floor');
  ok(!!g.active && g.active.y === SPAWN_Y && g.pieces === 1, 'the next piece spawns after a hard drop');
}

// --- rotation: basic, against walls, against the stack
{
  const g = withPiece('T'); g.rotate(1);
  ok(g.active.rot === 1 && eq(cellsOf(g).sort(), g.cells(ID.T, 1, SPAWN_X, SPAWN_Y).sort()), 'rotate in open space uses kick 0');
  // T vertical against the left wall: rotating back must kick right
  const w = withPiece('T'); w.rotate(-1); while (w.shift(-1)); // rot 3, flush left
  const xs = cellsOf(w).map(c => c[0]); ok(Math.min(...xs) === 0, 'T flush left in L state');
  const ev = events(w); ok(w.rotate(-1) && w.active.rot === 2, 'rotation next to the left wall succeeds');
  ok(cellsOf(w).every(([x]) => x >= 0), 'wall kick keeps the piece in bounds');
  // I against the right wall, vertical -> horizontal must kick left
  const i = withPiece('I'); i.rotate(1); while (i.shift(1));
  ok(Math.max(...cellsOf(i).map(c => c[0])) === COLS - 1, 'I flush right in R state');
  ok(i.rotate(-1) && cellsOf(i).every(([x]) => x < COLS), 'I rotation at the right wall kicks inward');
  // every rotation of every piece at every column of an empty field stays in bounds or fails cleanly
  let bad = '';
  for (let t = 1; t <= 7 && !bad; t++) for (let x = -2; x < COLS && !bad; x++) for (const dir of [1, -1, 2]) {
    const g3 = withPiece(t);
    g3.active.x = x; if (g3.collides(t, 0, x, g3.active.y)) continue;
    const before = JSON.stringify(g3.active);
    const r = g3.rotate(dir);
    if (!r && JSON.stringify(g3.active) !== before) bad = 'failed rotation moved the piece';
    if (cellsOf(g3).some(([cx, cy]) => cx < 0 || cx >= COLS || cy >= ROWS || g3.board[cy][cx])) bad = `piece ${t} x ${x} dir ${dir} out of bounds`;
  }
  ok(!bad, 'rotations never leave the field or overlap blocks' + (bad ? ' — ' + bad : ''));
  // rotation blocked completely by the stack
  const box = withPiece('I', [
    'XXX....XXX', 'XXX....XXX', 'XXX....XXX', 'XXX....XXX', 'XXXXXXXXXX'.replace(/X/g, 'X')]);
  box.active.x = 3; box.active.y = ROWS - 7;     // horizontal I sits in the 4-wide well's mouth
  while (box.tryMove(0, 1));
  const ok180 = JSON.stringify(box.active);
  box.rotate(1);
  ok(!box.collides(box.active.type, box.active.rot, box.active.x, box.active.y), 'rotation inside a well never overlaps');
  // T-spin double: T in R state above the slot, rotate clockwise (kick 0) into it; 3 corners, both front ones
  const t = withPiece('T', ['..X.......', '...XXXXXXX', 'X.XXXXXXXX']);
  t.active.rot = 1; t.active.x = 0; t.active.y = ROWS - 3;
  ok(!t.collides(ID.T, 1, 0, ROWS - 3), 'T fits above the slot');
  const tev = events(t);
  ok(t.rotate(1) && t.active.rot === 2 && t.detectTSpin() === 'full', 'rotating into the slot is a full T-spin');
  t.hardDrop();
  const ta = tev.find(e => e[0] === 'action')[1];
  ok(ta.name === 'T-SPIN DOUBLE' && ta.lines === 2 && ta.points === 1200, 'T-spin double scores 1200 at level 1');
  // the same final position reached without a rotation is not a T-spin
  const nt = withPiece('T', ['..........', '...XXXXXXX', 'X.XXXXXXXX']);
  nt.active.rot = 2; nt.active.x = 0; nt.active.y = ROWS - 3; const nev = events(nt); nt.hardDrop();
  ok(nev.find(e => e[0] === 'lock')[1].tspin === 'none', 'dropping a T in without rotating is not a T-spin');
}

// --- I-piece kick table (SRS, guideline values)
ok(eq(E.kicksFor(ID.I, 0, 1), [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]]), 'I 0→R kicks match SRS');
ok(eq(E.kicksFor(ID.T, 0, 1), [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]]), 'JLSTZ 0→R kicks match SRS');
ok(eq(E.kicksFor(ID.O, 0, 1), [[0, 0]]), 'O never kicks');
{
  // reverse kicks are the negation of forward kicks (SRS symmetry)
  let sym = true;
  for (const tbl of [E.KICKS_I, E.KICKS_JLSTZ]) for (const k of Object.keys(tbl)) {
    const [a, b] = k.split('>'); const back = tbl[b + '>' + a];
    if (!eq(tbl[k].map(([x, y]) => [-x, -y]).map(v => v.map(z => z || 0)), back.map(v => v.map(z => z || 0)))) sym = false;
  }
  ok(sym, 'every kick table entry mirrors its reverse');
}

// --- hold
{
  const g = fresh(); g.setQueue(['I', 'O', 'T', 'S', 'Z', 'J', 'L']); g.setActive('T');
  ok(g.holdPiece() && g.hold === ID.T && g.active.type === ID.I, 'first hold stores the piece and takes the next');
  ok(!g.holdPiece() && g.hold === ID.T && g.active.type === ID.I, 'second hold before locking is refused');
  g.hardDrop();
  ok(g.holdUsed === false, 'hold is available again for the next piece');
  const cur = g.active.type;
  ok(g.holdPiece() && g.active.type === ID.T && g.hold === cur, 'hold swaps with the stored piece');
  ok(g.active.x === SPAWN_X && g.active.rot === 0, 'a held piece comes back in spawn orientation');
}

// --- lock delay and the reset limit
{
  const g = withPiece('T'); while (g.tryMove(0, 1)); g.afterDescend();
  g.update(499); ok(g.active && g.active.type === ID.T, 'still movable just before the lock delay');
  g.update(2); ok(!g.active || g.pieces === 1, 'locks once the delay runs out');
  const r = withPiece('T'); while (r.tryMove(0, 1)); r.afterDescend();
  let locked = false, maneuvers = 0;
  for (let i = 0; i < 40 && !locked; i++) {
    r.update(400);                                   // nearly lock, then fidget
    if (r.pieces) { locked = true; break; }
    r.rotate(i % 2 ? 1 : -1); maneuvers++;
    if (r.pieces) locked = true;
  }
  ok(locked && maneuvers <= 17 && r.resets <= 15, `infinite spin prevented: locks after ${maneuvers} maneuvers (15 resets, then the next grounded move locks)`);
  // rapid rotate + hold right at the lock boundary: no double lock, no lost piece
  const b = fresh(); b.setQueue(['O', 'I', 'S', 'Z', 'J', 'L', 'T']); b.setActive('T');
  while (b.tryMove(0, 1)); b.afterDescend();
  b.update(499); b.rotate(1); b.holdPiece(); b.update(1);
  ok(b.pieces === 0 && b.active.type === ID.O && b.hold === ID.T, 'hold at the lock boundary swaps cleanly');
  b.rotate(1); b.rotate(-1); b.hardDrop();
  ok(b.pieces === 1, 'hard drop after the swap locks exactly one piece');
  const cells = b.board.reduce((s, r) => s + r.filter(Boolean).length, 0);
  ok(cells === 4, 'exactly four cells on the board after one lock');
}

// --- line clears and scoring
{
  const g = withPiece('I', ['XXXXXX....', 'XXXXXX....', 'XXXXXX....', 'XXXXXX....'.replace(/./g, (c, i) => i < 9 ? 'X' : '.')]);
  // make a clean tetris well: column 9 empty in 4 rows
  g.setBoardRows(['XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.']);
  g.setActive('I'); g.rotate(1); while (g.shift(1));
  const ev = events(g); const s0 = g.score; g.hardDrop();
  const act = ev.find(e => e[0] === 'action')[1];
  ok(act.lines === 4 && act.name === 'TETRIS' && act.perfect, 'four lines: a Tetris and a perfect clear');
  ok(g.phase === 'clearing', 'clear animation phase');
  finishClear(g);
  ok(g.board.every(r => r.every(v => !v)) && g.lines === 4, 'cleared rows removed, board empty');
  ok(act.points === 800 + 2000, 'Tetris 800 + perfect clear 2000 at level 1');
  // single, double, triple at level 1, then combo bonus
  const s = withPiece('I', ['XXXXXX....']); while (s.shift(1)); const e1 = events(s); s.hardDrop();
  ok(e1.find(e => e[0] === 'action')[1].points === 100 + 800, 'single 100 (+800 perfect clear)');
  const d = withPiece('O', ['X.........', 'XXXXXXXX..', 'XXXXXXXX..']); while (d.shift(1)); const e2 = events(d); d.hardDrop();
  const da = e2.find(e => e[0] === 'action')[1]; ok(da.lines === 2 && da.points === 300, 'double scores 300');
  const t = withPiece('I', ['XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'X.........']); t.rotate(1); while (t.shift(1)); const e3 = events(t); t.hardDrop();
  ok(e3.find(e => e[0] === 'action')[1].lines === 3, 'triple clears three lines');
  // chain: combos and back-to-back
  const c = fresh({ startLevel: 1 });
  c.setBoardRows(['X.........', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.']);
  const ce = events(c);
  c.setActive('I'); c.rotate(1); while (c.shift(1)); c.hardDrop(); finishClear(c);
  c.active = null; c.setActive('I'); c.rotate(1); while (c.shift(1)); c.hardDrop(); finishClear(c);
  const acts = ce.filter(e => e[0] === 'action').map(e => e[1]);
  ok(acts.length === 2 && !acts[0].b2b && acts[1].b2b, 'second Tetris in a row is back-to-back');
  ok(acts[1].combo === 1 && acts[1].points === 800 * 1.5 + 50, 'b2b ×1.5 plus combo 50×level');
  ok(c.stats.tetrises === 2 && c.lines === 8, 'stats and line count');
  // level up every 10 lines in marathon
  const lv = fresh(); lv.lines = 9; lv.setBoardRows(['XXXXXXXXX.']); lv.setActive('I'); lv.rotate(1); while (lv.shift(1)); lv.hardDrop();
  ok(lv.level === 2, 'level rises at 10 lines');
}

// --- sprint completion
{
  const g = fresh({ mode: 'sprint' }); const ev = events(g);
  g.lines = 39; g.time = 12345;
  g.setBoardRows(['XXXXXXXXX.']); g.setActive('I'); g.rotate(1); while (g.shift(1)); g.hardDrop(); finishClear(g);
  ok(g.phase === 'done' && ev.some(e => e[0] === 'complete'), '40 lines completes the sprint');
  const before = g.score; g.update(1000); g.press('hard');
  ok(g.phase === 'done' && g.score === before, 'nothing moves after the sprint ends');
}

// --- game over on spawn collision, restart
{
  const g = fresh(); const ev = events(g);
  for (let y = TOP - 2; y < ROWS; y++) for (let x = 0; x < COLS; x++) g.board[y][x] = (x === 0 ? 0 : 8);
  g.active = null; g.spawnNext();
  ok(g.phase === 'over' && g.overReason === 'blockout' && ev.some(e => e[0] === 'gameover'), 'a blocked spawn ends the game');
  ok(!g.shift(-1) && !g.rotate(1) && !g.hardDrop(), 'no input after game over');
  g.reset(); g.start();
  ok(g.phase === 'falling' && g.score === 0 && g.lines === 0 && g.hold === null && g.board.every(r => r.every(v => !v)), 'restart clears everything');
}

// --- DAS/ARR and releaseAll (focus loss)
{
  const g = withPiece('T');
  g.press('left'); const x1 = g.active.x;
  g.update(169); ok(g.active.x === x1, 'no auto-shift before DAS');
  g.update(1); ok(g.active.x === x1 - 1, 'auto-shift at DAS');
  g.releaseAll(); const x2 = g.active.x; g.update(1000);
  ok(g.active.x === x2 && !g.held.left, 'releaseAll stops auto-shift (blur)');
}

// --- long AI run: board stays consistent
{
  const g = fresh({ rng: E.mulberry32(77) }); let bad = '', pieces = 0;
  for (let i = 0; i < 3000 && g.phase !== 'over' && !bad; i++) {
    if (g.phase === 'clearing') { finishClear(g); continue; }
    const b = E.AI.best(g); if (!b) break;
    g.active.rot = b.rot; g.active.x = b.x;
    if (g.collides(g.active.type, b.rot, b.x, g.active.y)) bad = 'AI chose a colliding spot';
    g.hardDrop(); pieces++;
    const filled = g.board.reduce((s, r) => s + r.filter(Boolean).length, 0);
    if (filled !== pieces * 4 - g.lines * 10 && g.phase !== 'clearing') bad = `cell count drift at piece ${pieces}`;
  }
  ok(!bad && pieces >= 500, `AI plays ${pieces} pieces with a consistent board${bad ? ' — ' + bad : ''}`);
}

if (fails.length) { for (const f of fails) console.log('FAIL', f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} tetris engine checks passed`);
