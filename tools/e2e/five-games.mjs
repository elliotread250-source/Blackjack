// Browser checks for Tetris, Snake, Pac-Man, 2048 and Minesweeper against local servers.
//
//   cd tools/e2e && npm ci            # playwright only; browsers come from the local Playwright cache
//   (start each game: cd <game> && PORT=94xx python3 server.py)
//   node five-games.mjs [--browsers chromium,firefox,webkit] [--shots ../../docs/five-games/screens]
//
// Nothing here talks to a live service: every URL is localhost (override with TETRIS_URL etc.).
import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BROWSERS = arg('--browsers', 'chromium,firefox,webkit').split(',');
const SHOTS = arg('--shots', null);
const GAMES = {
  tetris: process.env.TETRIS_URL || 'http://localhost:9401/',
  snake: process.env.SNAKE_URL || 'http://localhost:9402/',
  'pac-man': process.env.PACMAN_URL || 'http://localhost:9403/',
  2048: process.env.G2048_URL || 'http://localhost:9404/',
  minesweeper: process.env.MINES_URL || 'http://localhost:9405/',
};
const VIEWPORTS = [
  { w: 360, h: 800, touch: true }, { w: 390, h: 844, touch: true }, { w: 768, h: 1024, touch: true },
  { w: 1366, h: 768, touch: false }, { w: 1920, h: 1080, touch: false },
];
const ENGINES = { chromium, firefox, webkit };

let pass = 0; const fails = []; const notes = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, url, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, hasTouch: vp.touch,
    isMobile: vp.touch && vp.w < 768 && browser.browserType().name() !== 'firefox',
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { ctx, page, errors };
}

// ---------------------------------------------------------------- per page, every viewport
async function smoke(bname, browser, game, url, vp) {
  const tag = `${bname} ${game} ${vp.w}x${vp.h}`;
  const { ctx, page, errors } = await open(browser, url, vp);
  const info = await page.evaluate(() => {
    const meta = document.querySelector('meta[name=viewport]');
    const hub = document.querySelector('a[data-hub]');
    const small = [];
    for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || r.width < 2) continue;
      if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
      // only controls a finger can actually reach (not covered by an overlay)
      const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
      if (!top || !(el === top || el.contains(top))) continue;
      if (Math.min(r.width, r.height) < 43.5) small.push(`${el.id || el.className || el.tagName}:${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return {
      meta: meta && meta.content, hub: hub && hub.href,
      overflowX: document.documentElement.scrollWidth - innerWidth,
      small,
    };
  });
  ok(errors.length === 0, `${tag}: no console errors (${errors.slice(0, 2).join(' | ')})`);
  ok(info.meta && !/user-scalable\s*=\s*no|maximum-scale/.test(info.meta), `${tag}: page zoom not disabled (${info.meta})`);
  ok(info.hub && info.hub.startsWith('http://localhost:8084'), `${tag}: hub link points at the local hub (${info.hub})`);
  ok(info.overflowX <= 1, `${tag}: no horizontal page scroll (${info.overflowX}px)`);
  if (vp.touch && info.small.length) notes.push(`${tag}: controls under 44px: ${info.small.join(', ')}`);
  if (vp.touch) ok(info.small.length === 0, `${tag}: touch targets ≥ 44px (${info.small.join(', ')})`);
  if (SHOTS) {
    const dir = path.join(SHOTS, bname); fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, `${game}-${vp.w}x${vp.h}.png`) });
  }
  await ctx.close();
}

// a text field the page did not have: keys typed into it must not drive the game
const addField = page => page.evaluate(() => {
  const i = document.createElement('input'); i.id = '__probe'; i.style.cssText = 'position:fixed;left:0;bottom:0;z-index:99999';
  document.body.appendChild(i); i.focus();
});
const blurWindow = page => page.evaluate(() => window.dispatchEvent(new Event('blur')));

// ---------------------------------------------------------------- per game behaviour
const FLOWS = {
  async tetris(page, tag) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    let st = await page.evaluate(() => window.__tetris.state());
    ok(st.screen === 'ready' || st.screen === 'playing', `${tag}: Enter starts a game (${st.screen})`);
    await page.evaluate(() => window.__tetris.skipReady());
    await page.keyboard.down('ArrowLeft');
    await blurWindow(page);
    st = await page.evaluate(() => ({ screen: window.__tetris.screen, held: window.__tetris.game.held.left, dir: window.__tetris.game.dir }));
    ok(st.screen === 'paused' && !st.held && st.dir === 0, `${tag}: window blur pauses and drops held keys (${JSON.stringify(st)})`);
    await page.keyboard.up('ArrowLeft');
    const x0 = await page.evaluate(() => { window.__tetris.app.resume ? window.__tetris.app.resume() : null; return window.__tetris.state(); });
    await addField(page);
    const before = await page.evaluate(() => window.__tetris.state().screen);
    await page.keyboard.press('KeyP'); await page.keyboard.press('Enter');
    const after = await page.evaluate(() => window.__tetris.state().screen);
    ok(before === after, `${tag}: keys typed in a text field are ignored (${before} → ${after})`);
    void x0;
  },
  async snake(page, tag) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    let s = await page.evaluate(() => window.__snake.state);
    ok(s === 'playing', `${tag}: an arrow key starts the game (${s})`);
    await blurWindow(page);
    s = await page.evaluate(() => window.__snake.state);
    ok(s === 'paused', `${tag}: window blur pauses (${s})`);
    const steps = await page.evaluate(() => window.__snake.steps);
    await page.waitForTimeout(600);
    ok(await page.evaluate(() => window.__snake.steps) === steps, `${tag}: no steps while paused`);
    await page.keyboard.press('Space');
    await page.waitForTimeout(50);
    const after = await page.evaluate(() => window.__snake.steps);
    ok(after - steps <= 1, `${tag}: resume does not replay the paused time (${after - steps} steps)`);
    await addField(page);
    const d0 = await page.evaluate(() => window.__snake.dir);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowDown');
    const q = await page.evaluate(() => window.__snake.queue);
    ok(q.length === 0 && await page.evaluate(() => window.__snake.dir) === d0, `${tag}: arrows typed in a text field do not steer`);
    const mute = await page.evaluate(() => [document.getElementById('btnMute').getAttribute('aria-pressed'), document.getElementById('menuMute').getAttribute('aria-pressed')]);
    ok(mute[0] === mute[1] && (mute[0] === 'true' || mute[0] === 'false'), `${tag}: both sound buttons report the same state (${mute})`);
  },
  async 'pac-man'(page, tag) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    let s = await page.evaluate(() => ({ st: window.__pacman.state, sr: document.getElementById('sr-status').textContent }));
    ok(s.st === 'ready' && /Level 1/.test(s.sr), `${tag}: Enter starts, status announced (${s.st}: ${s.sr})`);
    await blurWindow(page);
    ok(await page.evaluate(() => window.__pacman.paused), `${tag}: window blur pauses`);
    const f0 = await page.evaluate(() => window.__pacman.game.frame);
    await page.waitForTimeout(400);
    ok(await page.evaluate(() => window.__pacman.game.frame) === f0, `${tag}: simulation frozen while paused`);
    await page.keyboard.press('Enter');
    ok(!(await page.evaluate(() => window.__pacman.paused)), `${tag}: Enter resumes`);
    await page.keyboard.press('KeyH');
    s = await page.evaluate(() => ({ open: document.getElementById('help').open, paused: window.__pacman.paused, text: document.getElementById('help').innerText }));
    ok(s.open && s.paused && /power pellet/i.test(s.text), `${tag}: H opens How to play and pauses`);
    await page.keyboard.press('Escape');
    s = await page.evaluate(() => ({ open: document.getElementById('help').open, paused: window.__pacman.paused }));
    ok(!s.open && s.paused, `${tag}: Esc closes the help, game stays paused`);
    await page.keyboard.press('Enter');
    await addField(page);
    const want = await page.evaluate(() => window.__pacman.game.wantDir);
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('KeyP');
    s = await page.evaluate(() => ({ w: window.__pacman.game.wantDir, p: window.__pacman.paused }));
    ok(s.w === want && !s.p, `${tag}: keys typed in a text field are ignored`);
  },
  async 2048(page, tag) {
    await page.evaluate(() => window.__g2048.setBoard([[2, 2, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 4]], 0));
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(250);
    const s = await page.evaluate(() => ({ st: window.__g2048.state(), sr: document.getElementById('sr-status').textContent, rows: document.querySelectorAll('#sr-board tr').length, cells: [...document.querySelectorAll('#sr-board td')].map(t => t.textContent) }));
    ok(s.st.rows[0][0] === 4 && s.st.score === 4, `${tag}: arrow key merges (${JSON.stringify(s.st.rows[0])})`);
    ok(/left/i.test(s.sr) && /4/.test(s.sr), `${tag}: move announced (${s.sr})`);
    ok(s.rows === 4 && s.cells.length === 16 && s.cells.includes('4'), `${tag}: screen-reader table mirrors the board`);
    await addField(page);
    const moves = s.st.moves;
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    ok(await page.evaluate(() => window.__g2048.state().moves) === moves, `${tag}: arrows typed in a text field do not move tiles`);
  },
  async minesweeper(page, tag) {
    await page.focus('#board');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(100);
    let s = await page.evaluate(() => ({ gen: window.__game.board.generated, sr: document.getElementById('sr-cell').textContent }));
    ok(s.gen && s.sr.length > 0, `${tag}: Enter on the focused field opens a square (${s.sr})`);
    await page.keyboard.press('Home'); await page.keyboard.press('PageUp');
    s = await page.evaluate(() => ({ sr: document.getElementById('sr-cell').textContent, mines: window.__mines() }));
    ok(!/mine(?! left| around)/i.test(s.sr.replace(/\d+ mines? around/, '')), `${tag}: cursor description never reveals a mine (${s.sr})`);
    // custom field: out-of-range width is explained, not clamped
    await page.click('#mb-game');
    await page.click('[data-act=custom]');
    await page.fill('#cf-w', '99');
    await page.press('#cf-w', 'Enter');
    s = await page.evaluate(() => ({ err: document.getElementById('cf-err').textContent, inv: document.getElementById('cf-w').getAttribute('aria-invalid'), dlg: window.__game.dialog, w: window.__game.board.w }));
    ok(s.err.length > 0 && s.inv === 'true' && s.dlg === 'dlg-custom', `${tag}: invalid custom width is reported inline (${s.err})`);
    await page.fill('#cf-w', '12'); await page.fill('#cf-h', '10'); await page.fill('#cf-m', '20');
    await page.press('#cf-w', 'Enter');
    s = await page.evaluate(() => ({ dlg: window.__game.dialog, w: window.__game.board.w, h: window.__game.board.h, m: window.__game.board.mines }));
    ok(!s.dlg && s.w === 12 && s.h === 10 && s.m === 20, `${tag}: valid custom field accepted (${JSON.stringify(s)})`);
  },
};

const t0 = Date.now();
for (const bname of BROWSERS) {
  const browser = await ENGINES[bname].launch();
  for (const [game, url] of Object.entries(GAMES)) {
    for (const vp of VIEWPORTS) {
      try { await smoke(bname, browser, game, url, vp); } catch (e) { fails.push(`${bname} ${game} ${vp.w}x${vp.h}: ${e.message.split('\n')[0]}`); }
    }
    for (const vp of [VIEWPORTS[3], VIEWPORTS[1]]) {
      const tag = `${bname} ${game} ${vp.w}x${vp.h} flow`;
      const { ctx, page, errors } = await open(browser, url, vp);
      try { await FLOWS[game](page, tag); } catch (e) { fails.push(`${tag}: ${e.message.split('\n')[0]}`); }
      ok(errors.length === 0, `${tag}: no console errors during play (${errors.slice(0, 2).join(' | ')})`);
      await ctx.close();
    }
  }
  await browser.close();
}
await wait(0);
if (fails.length) for (const f of fails) console.log('FAIL', f);
console.log(`${pass} passed, ${fails.length} failed (${BROWSERS.join(', ')}; ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
process.exit(fails.length ? 1 : 0);
