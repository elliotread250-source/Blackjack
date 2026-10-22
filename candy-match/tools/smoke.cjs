#!/usr/bin/env node
/* Browser smoke test: serves the game with the real server.py and plays it in Chromium.
 *   NODE_PATH=$(npm root -g) node tools/smoke.cjs
 * Desktop 1280x800 with the mouse, phone 390x844 with touch: real drag swaps, tap-tap swaps,
 * an invalid swap, a won level, a lost level, boosters, pause, reload with saved progress, and
 * zero console errors. Screenshots go to $SHOTS (default: ./shots next to this file).
 */
'use strict';
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const { chromium } = require('playwright');

const PORT = process.env.PORT || '8948';
const BASE = `http://localhost:${PORT}/`;
const SHOTS = process.env.SHOTS || path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

let server, pass = 0;
const errors = [];
const ok = msg => { pass++; console.log('  ok   ' + msg); };

async function startServer() {
  server = spawn('python3', ['server.py'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT }, stdio: 'ignore' });
  const pid = server.pid;
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE + 'healthz'); if (r.ok) return pid; } catch (e) { /* not up yet */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
}

function watch(page, tag) {
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${tag}] console: ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${tag}] pageerror: ${e.message}`));
  page.on('requestfailed', r => errors.push(`[${tag}] request failed: ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) errors.push(`[${tag}] HTTP ${r.status()} ${r.url()}`); });
}

const state = page => page.evaluate(() => __candy.state());
const idle = page => page.waitForFunction(() => { const s = __candy.state(); return !s.busy || s.modalOpen; }, null, { timeout: 60000 });
const shot = (page, name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });

// ---- input helpers --------------------------------------------------------------------
const cellPoint = (page, i) => page.evaluate(i => __candy.cellCenter(i), i);
async function mouseDrag(page, a, b) {  // real mouse press, move, release
  const [ax, ay] = await cellPoint(page, a), [bx, by] = await cellPoint(page, b);
  await page.mouse.move(ax, ay); await page.mouse.down();
  await page.mouse.move((ax + bx) / 2, (ay + by) / 2, { steps: 4 });
  await page.mouse.move(bx, by, { steps: 4 });
  await page.mouse.up();
}
async function mouseTap2(page, a, b) {
  const [ax, ay] = await cellPoint(page, a), [bx, by] = await cellPoint(page, b);
  await page.mouse.click(ax, ay, { delay: 40 });
  await page.mouse.click(bx, by, { delay: 40 });
}
async function touchDrag(page, cdp, a, b) {
  const [ax, ay] = await cellPoint(page, a), [bx, by] = await cellPoint(page, b);
  const send = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await send('touchStart', ax, ay);
  for (let k = 1; k <= 6; k++) { await send('touchMove', ax + (bx - ax) * k / 6, ay + (by - ay) * k / 6); await page.waitForTimeout(16); }
  await send('touchEnd', bx, by);
}
async function touchTap(page, i) { const [x, y] = await cellPoint(page, i); await page.touchscreen.tap(x, y); }

// the best move according to the game's own bot (used so that the test actually wins)
const bestMove = page => page.evaluate(async () => {
  const B = await import('/js/bot.js');
  const m = B.pickMove(__candy.st, 1, 5, 'oracle');
  return m ? [m.a, m.b] : null;
});
const someValidMove = (page, k = 0) => page.evaluate(async k => {
  const C = await import('/js/core.js');
  const ms = C.findMoves(__candy.st);
  return ms[k % ms.length];
}, k);
const invalidPair = page => page.evaluate(async () => {
  const C = await import('/js/core.js');
  for (const i of __candy.st.L.cells) for (const j of [i + 1, i + 9]) if (j < 81 && __candy.st.L.mask[j] && (j - i === 9 || j % 9 !== 0) && !C.isValidSwap(__candy.st, i, j)) return [i, j];
  return null;
});
const noHScroll = async (page, label) => {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth, iw: innerWidth }));
  assert.ok(r.sw <= r.iw && r.bw <= r.iw, `${label}: horizontal scroll ${JSON.stringify(r)}`);
  ok(`${label}: no horizontal scroll`);
};

async function playUntilDone(page, drag, tag, maxMoves = 40, shotAt = null) {
  for (let n = 0; n < maxMoves; n++) {
    const s = await state(page);
    if (s.status !== 'play') break;
    const m = await bestMove(page);
    if (!m) break;
    await drag(m[0], m[1]);
    if (shotAt !== null && s.moves === shotAt) { await page.waitForTimeout(350); await shot(page, `${tag}-mid-cascade`); }
    await idle(page);
  }
  return state(page);
}

(async () => {
  const pid = await startServer();
  console.log(`server pid ${pid} on :${PORT}`);
  const browser = await chromium.launch();
  try {
    // =============================================================== desktop, mouse
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await ctx.newPage(); watch(page, 'desktop');
      await page.goto(BASE + '?debug=1&fast=4');
      assert.strictEqual(await page.title(), 'Candy Match'); ok('title is Candy Match');
      assert.ok(await page.$('link[rel=icon][href="icon.svg"]')); ok('icon link present');
      const hub = await page.getAttribute('.arcade', 'href');
      assert.ok(/open-arcade|localhost:8084/.test(hub), hub); ok('"Arcade" link points at the hub: ' + hub);
      await page.waitForSelector('.node[data-level="1"].current');
      await noHScroll(page, 'desktop map');
      await shot(page, 'd1-map');
      const locked = await page.$$eval('.node.locked', n => n.length);
      assert.strictEqual(locked, 39); ok('39 levels locked on a new save');
      // locked level refuses
      await page.click('.node[data-level="5"]');
      await page.waitForTimeout(200);
      assert.ok(await page.evaluate(() => document.querySelector('#modal').hidden)); ok('locked level does not open');
      await page.click('.node[data-level="1"]');
      await page.waitForSelector('[data-act=play]');
      await shot(page, 'd2-intro');
      await page.click('[data-act=play]');
      await page.waitForSelector('#game:not([hidden])');
      await idle(page);
      await noHScroll(page, 'desktop game');
      await shot(page, 'd3-game');
      const box = await page.evaluate(() => { const r = document.querySelector('#board').getBoundingClientRect(); return [r.width, r.height]; });
      assert.ok(box[0] > 450 && Math.abs(box[0] - box[1]) < 2, 'board is square and large: ' + box); ok('desktop board ' + Math.round(box[0]) + 'px square');

      // invalid swap bounces back and costs nothing
      let s0 = await state(page);
      const bad = await invalidPair(page);
      await mouseDrag(page, bad[0], bad[1]);
      await page.waitForTimeout(100); await idle(page);
      let s1 = await state(page);
      assert.strictEqual(s1.moves, s0.moves); assert.strictEqual(s1.score, s0.score); ok('invalid swap bounced back, no move used');
      // drag swap
      const m1 = await someValidMove(page);
      await mouseDrag(page, m1[0], m1[1]);
      await shot(page, 'd4-swap');
      await idle(page);
      s1 = await state(page);
      assert.strictEqual(s1.moves, s0.moves - 1); assert.ok(s1.score > 0); ok(`mouse drag swap: score ${s1.score}, moves ${s1.moves}`);
      // tap-tap swap
      const m2 = await bestMove(page);
      await mouseTap2(page, m2[0], m2[1]);
      await idle(page);
      const s2 = await state(page);
      assert.strictEqual(s2.moves, s1.moves - 1); ok('tap-tap swap works');
      // keep playing with real drags until the level is won
      const done = await playUntilDone(page, (a, b) => mouseDrag(page, a, b), 'd', 30);
      assert.strictEqual(done.status, 'won', 'level 1 should be won, got ' + JSON.stringify(done)); ok(`won level 1 with score ${done.score}`);
      await page.waitForSelector('#modal .card h2');
      await page.waitForTimeout(1800);
      await shot(page, 'd5-win');
      const stars = await page.evaluate(() => __candy.progress.stars[1]);
      assert.ok(stars >= 1); ok('stars saved for level 1: ' + stars);
      await page.click('[data-act=map]');
      await page.waitForSelector('.node[data-level="1"].done');
      assert.ok(!(await page.$('.node[data-level="2"].locked'))); ok('level 2 unlocked after the win');
      await shot(page, 'd6-map-after');

      // lose level 2 on purpose
      await page.click('.node[data-level="2"]');
      await page.click('[data-act=play]');
      await page.waitForSelector('#game:not([hidden])'); await idle(page);
      await page.evaluate(() => __candy.setMoves(2));
      for (let k = 0; k < 2; k++) {
        const m = await someValidMove(page, k * 3);
        await mouseDrag(page, m[0], m[1]); await idle(page);
      }
      await page.waitForSelector('#modal .card');
      assert.ok((await page.textContent('#modal h2')).includes('Out of moves')); ok('out of moves shows the fail screen');
      await page.waitForTimeout(300);
      await shot(page, 'd7-lose');
      await page.click('[data-act=retry]');
      await page.waitForSelector('#game:not([hidden])'); await idle(page);
      const r = await state(page);
      assert.strictEqual(r.status, 'play'); assert.strictEqual(r.score, 0); ok('try again restarts the level');
      // pause menu
      await page.click('#g-pause');
      await page.waitForSelector('[data-act=resume]');
      await shot(page, 'd8-pause');
      await page.click('[data-act=resume]');
      await page.waitForFunction(() => document.querySelector('#modal').hidden);
      ok('pause and resume');
      await ctx.storageState({ path: path.join(SHOTS, 'state.json') });
      // reload: progress persists
      await page.reload();
      await page.waitForSelector('.node[data-level="2"].current, .node[data-level="2"]:not(.locked)');
      const after = await page.evaluate(() => ({ stars: __candy ? 0 : 0, s1: JSON.parse(localStorage.getItem('candymatch.v1')).stars }));
      assert.ok(after.s1['1'] >= 1); assert.ok(!(await page.$('.node[data-level="2"].locked'))); ok('reload keeps saved progress');
      assert.ok(await page.$('.node[data-level="1"].done'));
      await ctx.close();
    }

    // =============================================================== phone, touch
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
      const page = await ctx.newPage(); watch(page, 'phone');
      const cdp = await ctx.newCDPSession(page);
      await page.goto(BASE + '?debug=1&fast=2&hint=1500');
      await page.waitForSelector('.node[data-level="1"].current');
      await noHScroll(page, 'phone map');
      await shot(page, 'm1-map');
      await page.tap('.node[data-level="1"]');
      await page.waitForSelector('[data-act=play]');
      await shot(page, 'm2-intro');
      await page.tap('[data-act=play]');
      await page.waitForSelector('#game:not([hidden])'); await idle(page);
      await noHScroll(page, 'phone game');
      await page.waitForTimeout(2000);
      assert.strictEqual(await page.evaluate(() => __candy.view.hintIds && __candy.view.hintIds.size), 2); ok('hint pulses two candies after a few idle seconds');
      await shot(page, 'm3b-hint');
      const bw = await page.evaluate(() => document.querySelector('#board').getBoundingClientRect().width);
      assert.ok(bw >= 360, 'board fills the phone width: ' + bw); ok(`phone board ${Math.round(bw)}px wide (cell ${Math.round(bw / 9)}px)`);
      const tools = await page.$$eval('.tool, .iconbtn, .btn', els => els.filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }));
      assert.ok(Math.min(...tools) >= 44, 'touch targets >= 44px: ' + Math.min(...tools)); ok('touch targets are at least 44px');
      await shot(page, 'm3-game');
      // touch swipe
      let s0 = await state(page);
      const m = await someValidMove(page);
      await touchDrag(page, cdp, m[0], m[1]);
      await shot(page, 'm4-swipe'); await idle(page);
      let s1 = await state(page);
      assert.strictEqual(s1.moves, s0.moves - 1); ok('touch swipe swap works, score ' + s1.score);
      // touch tap-tap
      const m2 = await bestMove(page);
      await touchTap(page, m2[0]); await shot(page, 'm5-selected'); await touchTap(page, m2[1]); await idle(page);
      assert.strictEqual((await state(page)).moves, s1.moves - 1); ok('touch tap-tap swap works');
      // invalid swipe
      const bad = await invalidPair(page);
      s0 = await state(page);
      await touchDrag(page, cdp, bad[0], bad[1]); await page.waitForTimeout(150); await idle(page);
      assert.strictEqual((await state(page)).moves, s0.moves); ok('touch invalid swap bounces');
      // hammer booster
      const h0 = await page.evaluate(() => __candy.progress.hammers);
      await page.tap('#t-hammer');
      await page.waitForSelector('#board.hammer');
      await shot(page, 'm6-hammer-mode');
      const target = await page.evaluate(() => __candy.st.L.cells.find(i => __candy.st.board[i].t === 0 && !__candy.st.board[i].cage));
      await touchTap(page, target); await page.waitForTimeout(150); await idle(page);
      const h1 = await page.evaluate(() => __candy.progress.hammers);
      assert.strictEqual(h1, h0 - 1); ok('hammer smashed a candy and used a charge');
      // shuffle booster
      const sh0 = await page.evaluate(() => __candy.progress.shuffles);
      await page.tap('#t-shuffle'); await page.waitForTimeout(250); await shot(page, 'm7-shuffle'); await idle(page);
      assert.strictEqual(await page.evaluate(() => __candy.progress.shuffles), sh0 - 1); ok('shuffle booster works');
      // pause on phone
      await page.tap('#g-pause'); await page.waitForSelector('[data-act=resume]'); await shot(page, 'm8-pause'); await page.tap('[data-act=resume]');
      // play to the win, capturing the bonus phase
      const left = await state(page);
      let won = left;
      for (let n = 0; n < 30 && won.status === 'play'; n++) {
        const mv = await bestMove(page);
        await touchDrag(page, cdp, mv[0], mv[1]);
        const st = await state(page);
        if (st.status === 'won' || (await page.evaluate(() => __candy.st.status)) === 'won') {
          for (let k = 0; k < 4; k++) { await page.waitForTimeout(450); await shot(page, `m9-bonus-${k}`); if (await page.evaluate(() => { const s = __candy.state(); return !s.busy || s.modalOpen; })) break; }
        }
        await idle(page);
        won = await state(page);
      }
      assert.strictEqual(won.status, 'won'); ok('won on the phone, score ' + won.score);
      await page.waitForSelector('#modal .card'); await page.waitForTimeout(1900); await shot(page, 'm10-win');
      await page.tap('[data-act=next]');
      await page.waitForSelector('[data-act=play]'); await page.waitForTimeout(400); await shot(page, 'm11-next-intro');
      await page.tap('[data-act=play]'); await page.waitForSelector('#game:not([hidden])'); await idle(page);
      // a later level with obstacles: start level via the stored unlock
      await ctx.close();
    }

    // =============================================================== phone landscape + frame rate
    {
      const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
      const page = await ctx.newPage(); watch(page, 'landscape');
      await page.goto(BASE + '?debug=1&fast=2');
      await page.tap('.node[data-level="1"]'); await page.tap('[data-act=play]');
      await page.waitForSelector('#game:not([hidden])'); await idle(page);
      await noHScroll(page, 'landscape game');
      const bw = await page.evaluate(() => document.querySelector('#board').getBoundingClientRect().width);
      assert.ok(bw >= 280, 'landscape board size ' + bw); ok('landscape phone board ' + Math.round(bw) + 'px');
      await shot(page, 'l1-landscape');
      await ctx.close();

      const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
      const p2 = await c2.newPage(); watch(p2, 'perf');
      const cdp = await c2.newCDPSession(p2);
      await p2.goto(BASE + '?debug=1&fast=1');
      await p2.tap('.node[data-level="1"]'); await p2.tap('[data-act=play]');
      await p2.waitForSelector('#game:not([hidden])'); await idle(p2);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await p2.evaluate(() => {
        window.__dts = []; window.__js = [];
        let last = performance.now(); const f = n => { window.__dts.push(n - last); last = n; requestAnimationFrame(f); }; requestAnimationFrame(f);
        const v = __candy.view, od = v.draw.bind(v), ot = v.tick.bind(v);
        v.draw = () => { const t = performance.now(); od(); window.__js.push(performance.now() - t); };
        v.tick = dt => { const t = performance.now(); ot(dt); window.__js.push(performance.now() - t); };
      });
      for (let k = 0; k < 4; k++) { const m = await bestMove(p2); await mouseDrag(p2, m[0], m[1]); await idle(p2); }
      const { dts, js } = await p2.evaluate(() => ({ dts: window.__dts.slice(5), js: window.__js }));
      dts.sort((a, b) => a - b);
      const avg = dts.reduce((a, b) => a + b, 0) / dts.length, p95 = dts[Math.floor(dts.length * 0.95)];
      const jsAvg = 2 * js.reduce((a, b) => a + b, 0) / js.length;   // draw + tick per frame
      console.log(`       4x CPU throttle, headless software rendering: ${dts.length} frames, avg ${avg.toFixed(1)} ms, p95 ${p95.toFixed(1)} ms; game JS ${jsAvg.toFixed(2)} ms per frame`);
      assert.ok(jsAvg < 8, 'game code costs ' + jsAvg + ' ms per frame'); ok('per-frame game cost is small (' + jsAvg.toFixed(1) + ' ms with a 4x throttled CPU)');
      await c2.close();
    }

    // =============================================================== obstacle levels render (progress seeded)
    {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
      const stars = {}; for (let i = 1; i <= 39; i++) stars[i] = 2;
      await ctx.addInitScript(s => { try { localStorage.setItem('candymatch.v1', JSON.stringify({ stars: s, best: {}, hammers: 3, shuffles: 3, sound: false, played: 5 })); } catch (e) { /* ignore */ } }, stars);
      const page = await ctx.newPage(); watch(page, 'phone2');
      await page.goto(BASE + '?debug=1&fast=2');
      await page.waitForSelector('.node');
      await page.evaluate(() => document.querySelector('#mapscroll').scrollTo(0, 0));
      await page.waitForTimeout(200); await shot(page, 'o0-map-top');
      for (const n of [5, 9, 13, 20, 27, 36, 40]) {
        await page.evaluate(n => document.querySelector(`.node[data-level="${n}"]`).scrollIntoView({ block: 'center' }), n);
        await page.tap(`.node[data-level="${n}"]`);
        await page.waitForSelector('[data-act=play]');
        if (n === 40) await shot(page, 'o-intro-40');
        await page.tap('[data-act=play]');
        await page.waitForSelector('#game:not([hidden])'); await idle(page);
        await page.waitForTimeout(150);
        await shot(page, `o-level-${n}`);
        const mv = await bestMove(page);
        await touchDrag(page, await ctx.newCDPSession(page), mv[0], mv[1]); await idle(page);
        if (n === 20) await shot(page, 'o-level-20-after');
        await page.tap('#g-pause'); await page.waitForSelector('[data-act=map]'); await page.tap('[data-act=map]');
        await page.waitForSelector('#mapscroll .node');
      }
      ok('obstacle levels 5, 9, 13, 20, 27, 36, 40 start and accept a move');
      await ctx.close();
    }

    assert.deepStrictEqual(errors, [], 'console/page errors:\n' + errors.join('\n'));
    ok('zero console errors, zero failed requests');
    console.log(`\n${pass} checks passed. Screenshots in ${SHOTS}`);
  } catch (e) {
    console.error('\nSMOKE FAILED:', e && e.stack || e);
    if (errors.length) console.error('console errors so far:\n' + errors.join('\n'));
    process.exitCode = 1;
  } finally {
    await browser.close();
    try { process.kill(pid); } catch (e) { /* already gone */ }
  }
})();
