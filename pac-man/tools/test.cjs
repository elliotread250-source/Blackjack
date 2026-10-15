// node pac-man/tools/test.cjs — simulation rules (data.js, maze.js, game.js) in a sandbox, plus seeded long runs.
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, Math, Uint8Array }; vm.createContext(ctx);
for (const f of ['data.js', 'maze.js', 'game.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', f), 'utf8'), ctx, { filename: f });
const PM = ctx.window.PM;
const { UP, LEFT, DOWN, RIGHT } = PM;
let n = 0; const fails = [];
const ok = (c, m) => { if (c) n++; else fails.push(m); };
const rngFrom = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const tile = v => Math.floor(v / 8);
const playing = (hooks) => { const g = new PM.Game(hooks || {}); g.newGame(); while (g.state === 'ready') g.tick(); return g; };

// --- maze
const md = PM.countMapDots();
ok(md.dots === 240 && md.energizers === 4 && PM.TOTAL_DOTS === 244, 'maze has 240 dots and 4 power pellets');
ok(PM.passable(-1, 17) && PM.passable(28, 17) && !PM.passable(-1, 16), 'the tunnel row continues off screen, nothing else does');
ok(PM.isRestricted(12, 14) && PM.isRestricted(15, 26) && !PM.isRestricted(13, 14), 'restricted up-turn tiles');

// --- start of game
const g1 = new PM.Game();
ok(g1.state === 'attract', 'boots into attract mode');
g1.newGame();
ok(g1.state === 'ready' && g1.lives === 3 && g1.score === 0 && g1.level === 1 && g1.dotsLeft() === 244, 'new game: ready, 3 lives, full maze');
let t = 0; while (g1.state === 'ready') { g1.tick(); t++; }
ok(g1.state === 'playing' && t === 262, 'intro ready lasts 262 ticks, then play');
ok(g1.ghosts[0].state === 'active' && g1.ghosts.slice(1).every(g => g.state === 'house' || g.state === 'leaving'), 'Blinky starts outside, the rest in the house');

// --- steering: buffered turn waits for an opening; walls stop Pac-Man
const g2 = playing({ invincible: true });
g2.wantDir = UP;                                   // start tile (13/14, 26): no opening upward yet
const y0 = g2.pac.y; for (let i = 0; i < 4; i++) g2.tick();
ok(g2.pac.y === y0 && g2.pac.dir === LEFT, 'an up request is held while there is a wall above');
for (let i = 0; i < 200 && g2.pac.dir !== UP; i++) g2.tick();
ok(g2.pac.dir === UP, 'the held turn is taken at the next opening');
const g3 = playing({ invincible: true });
for (let i = 0; i < 20; i++) g3.tick();
ok(g3.pac.dir === LEFT && g3.pac.moving, 'Pac-Man sets off to the left');
g3.wantDir = RIGHT; g3.pac.pause = 0; const x3 = g3.pac.x; g3.tick(); g3.tick();
ok(g3.pac.dir === RIGHT && g3.pac.x > x3, 'reversal is immediate, even between tiles');
const g3b = playing({ invincible: true }); g3b.wantDir = DOWN;      // a wall below the start corridor
for (let i = 0; i < 400; i++) g3b.tick();
ok(PM.passable(tile(g3b.pac.x), tile(g3b.pac.y)) && !g3b.pac.moving, 'running into a wall stops Pac-Man on a path tile');

// --- eating and scoring
const g4 = playing({ invincible: true });
const s0 = g4.score, d0 = g4.dotsEaten;
for (let i = 0; i < 30; i++) g4.tick();
ok(g4.dotsEaten > d0 && g4.score - s0 === (g4.dotsEaten - d0) * 10, 'dots score 10 each');
const g5 = playing({ invincible: true });
const ek = 6 * 28 + 1;                               // top-left power pellet (col 1, row 6)
ok(g5.dots[ek] === 2, 'power pellet in the top-left corner');
g5.pac.x = 1 * 8 + 4; g5.pac.y = 7 * 8 + 4; g5.pac.dir = UP; g5.wantDir = UP;
const sc = g5.score;
for (let i = 0; i < 12 && g5.dots[ek]; i++) g5.tick();
ok(!g5.dots[ek] && g5.score - sc >= 50 && g5.frightTime > 0, 'a power pellet scores 50 and frightens');
ok(g5.ghosts.filter(g => g.state !== 'eyes' && g.state !== 'entering').every(g => g.fright), 'every ghost not already eyes turns blue');
const pts = [];
for (const gh of g5.ghosts) { const b = g5.score; g5.eatGhost(gh); pts.push(g5.score - b); }
ok(pts.join() === '200,400,800,1600', 'ghost chain scores 200, 400, 800, 1600');
ok(g5.freeze === 60, 'eating a ghost freezes play briefly');
ok(g5.ghosts.every(gh => !gh.fright && (gh.state === 'eyes' || gh.state === 'entering')), 'eaten ghosts become eyes');

// --- extra life once at 10,000
const g6 = playing({ invincible: true });
g6.addScore(9990); ok(g6.lives === 3, 'no extra life below 10,000');
g6.addScore(10); ok(g6.lives === 4, 'extra life at 10,000');
g6.addScore(20000); ok(g6.lives === 4, 'only one extra life');

// --- death, lives and game over
let overCalls = 0;
const g7 = playing({ gameOver: () => overCalls++ });
const bl = g7.ghosts[0]; bl.fright = false; bl.state = 'active'; bl.x = g7.pac.x; bl.y = g7.pac.y;
ok(g7.checkCollisions() && g7.state === 'dying', 'touching an active ghost kills');
while (g7.state === 'dying') g7.tick();
ok(g7.state === 'ready' && g7.lives === 2 && g7.dotsLeft() === 244 - g7.dotsEaten, 'a death costs a life and keeps the dots');
g7.lives = 1; while (g7.state === 'ready') g7.tick(); g7.die(); while (g7.state === 'dying') g7.tick();
ok(g7.state === 'gameOver' && g7.lives === 0 && overCalls === 1, 'last life lost: game over, reported once');
for (let i = 0; i < 60 * 31; i++) g7.tick();
ok(g7.state === 'attract', 'game over returns to attract mode');
g7.newGame();
ok(g7.lives === 3 && g7.score === 0 && g7.level === 1 && g7.dotsLeft() === 244, 'restart restores a fresh game');

// --- level clear
const g8 = playing({ invincible: true });
for (let k = 0; k < g8.dots.length; k++) if (g8.dots[k]) { g8.dots[k] = 0; g8.dotsEaten++; }
g8.tick();
ok(g8.state === 'levelComplete', 'eating the last dot completes the level');
while (g8.state === 'levelComplete') g8.tick();
ok(g8.level === 2 && g8.state === 'ready' && g8.dotsLeft() === 244, 'level 2 starts with a full maze');

// --- seeded long runs: invariants every tick, deterministic outcome
function run(seed, ticks) {
  const r = rngFrom(seed), g = new PM.Game({});
  let bad = '', games = 0, maxLevel = 1, lastScore = 0, ticksPlayed = 0;
  g.newGame(); games++;
  for (let i = 0; i < ticks && !bad; i++) {
    if (r() < 0.04) g.wantDir = Math.floor(r() * 4);
    g.tick();
    if (g.state === 'playing') ticksPlayed++;
    if (g.state === 'attract' || (g.state === 'gameOver' && g.t > 90)) { g.newGame(); games++; lastScore = 0; }
    const p = g.pac;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) bad = 'pac position not finite';
    else if (p.x < -8 || p.x >= 232 || p.y < 0 || p.y >= 288) bad = `pac off the board (${p.x},${p.y})`;
    else if (!PM.passable(tile(p.x), tile(p.y))) bad = `pac in a wall at tile (${tile(p.x)},${tile(p.y)})`;
    for (const gh of g.ghosts) {
      if (!['active', 'house', 'leaving', 'eyes', 'entering'].includes(gh.state)) bad = 'ghost state ' + gh.state;
      else if (gh.state === 'active' && !PM.passable(tile(gh.x), tile(gh.y))) bad = `${gh.name} in a wall`;
      else if (gh.x < -8 || gh.x >= 232) bad = `${gh.name} off the board`;
    }
    let left = 0; for (let k = 0; k < g.dots.length; k++) if (g.dots[k]) left++;
    if (left !== g.dotsLeft()) bad = `dot count drift (${left} vs ${g.dotsLeft()})`;
    if (g.score < lastScore) bad = 'score went down within a game';
    lastScore = g.score;
    if (g.lives < 0 || g.lives > 6) bad = 'lives ' + g.lives;
    if (g.frightTime < 0 || g.freeze < 0) bad = 'negative timer';
    maxLevel = Math.max(maxLevel, g.level);
  }
  const sig = [g.state, g.score, g.level, g.lives, g.pac.x, g.pac.y, g.ghosts.map(x => x.x + ':' + x.y + ':' + x.state).join('|')].join(',');
  return { bad, games, maxLevel, sig, ticksPlayed };
}
let total = 0;
for (const seed of [1, 7, 42, 2026]) {
  const a = run(seed, 60000), b = run(seed, 60000);
  total += 60000;
  ok(!a.bad, `seed ${seed}: 60,000 ticks keep every invariant${a.bad ? ' — ' + a.bad : ''}`);
  ok(a.sig === b.sig, `seed ${seed}: same seed, same outcome`);
  ok(a.games >= 2 && a.ticksPlayed > 20000, `seed ${seed}: run covers deaths, game over and restart (${a.games} games)`);
}
// an invincible bot clears levels, so later level specs, fruit and intermissions get exercised too
{
  const r = rngFrom(99), g = new PM.Game({ invincible: true }); g.newGame();
  let bad = '', sawFruit = false, sawCut = false;
  for (let i = 0; i < 200000 && g.level < 6 && !bad; i++) {
    // greedy: head for the nearest dot by turning at junctions toward it
    if (g.pac && r() < 0.2) {
      const pc = tile(g.pac.x), pr = tile(g.pac.y); let best = null, bd = 1e9;
      for (let k = 0; k < g.dots.length; k++) if (g.dots[k]) { const c = k % 28, rr = (k / 28) | 0, d = Math.abs(c - pc) + Math.abs(rr - pr); if (d < bd) { bd = d; best = [c, rr]; } }
      if (best) { const dx = best[0] - pc, dy = best[1] - pr; const want = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? LEFT : RIGHT) : (dy < 0 ? UP : DOWN); g.wantDir = r() < 0.7 ? want : Math.floor(r() * 4); }
    }
    g.tick(); total++;
    if (g.fruit) sawFruit = true;
    if (g.state === 'intermission') sawCut = true;
    if (!PM.passable(tile(g.pac.x), tile(g.pac.y))) bad = 'pac in a wall';
  }
  ok(!bad && g.level >= 4, `invincible bot reaches level ${g.level}${bad ? ' — ' + bad : ''}`);
  ok(sawFruit && sawCut, 'fruit and the coffee-break intermission occur');
}

if (fails.length) { for (const f of fails) console.log('FAIL', f); console.log(`${n} passed, ${fails.length} failed`); process.exit(1); }
console.log(`${n} pac-man checks passed (${total.toLocaleString()} simulated ticks)`);
