#!/usr/bin/env node
/* Browser smoke test (Playwright + headless Chromium).
 *   PORT=8946 python3 server.py &      # in the neighbour/ folder
 *   NODE_PATH=$(npm root -g) node tools/smoke.cjs [url] [shots-dir]
 * Drives the game through window.__nn: title, walk to the house, get spotted, chased and caught,
 * wake up at home, pick up and throw, break a window, stack and climb crates, open the basement
 * and win. Desktop 1280x800 and phone landscape 844x390 with touch. Fails on any console error. */
'use strict';
const { chromium } = require('playwright');
const fs = require('fs');
const URL = process.argv[2] || 'http://localhost:8946/';
const SHOTS = (process.argv[3] || '/tmp/neighbour-shots').replace(/\/?$/, '/');
fs.mkdirSync(SHOTS, { recursive: true });

let fails = 0;
const check = (ok, msg) => { console.log((ok ? '  ok   ' : '  FAIL ') + msg); if (!ok) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function open(browser, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__nn && document.getElementById('loading').hidden, null, { timeout: 30000 });
  await wait(600);
  return { ctx, page, errors };
}
const nn = (page, fn, ...args) => page.evaluate(fn, ...args);
const shot = async (page, name) => { await wait(250); await page.screenshot({ path: SHOTS + name + '.png' }); };

async function desktop(browser) {
  console.log('desktop 1280x800');
  const { ctx, page, errors } = await open(browser, { viewport: { width: 1280, height: 800 } });
  await shot(page, 'd01-title');
  check(await page.isVisible('#s-title'), 'title screen shows');
  await page.click('#t-new');
  await shot(page, 'd02-difficulty');
  await page.click('[data-d=normal]');
  await page.click('#d-go');
  await wait(500);
  await nn(page, () => window.__nn.freeze(true));   // the test drives time with sim()
  let s = await nn(page, () => window.__nn.state());
  check(s.mode === 'play' && Math.abs(s.z - 15.4) < 0.5, `game starts at home (${s.x}, ${s.z})`);
  // keep him out of the way for now
  await nn(page, () => window.__nn.setAIState('patrol', { x: 0, y: 0, z: -45, hold: true }));
  await nn(page, () => { window.__nn.look(window.__nn.world.level.spawn.yaw, 0.05); window.__nn.sim(0.1); });
  await shot(page, 'd03-home');

  // walk out of the house and across the road
  await nn(page, () => window.__nn.sim(5, { mz: 1, sprint: true }));
  s = await nn(page, () => window.__nn.state());
  check(s.z < 9.5, `walked out of your front door (z ${s.z})`);
  await nn(page, () => { window.__nn.teleport(0.4, 0.12, -4.6, 0, 0.18); window.__nn.sim(0.1); });
  await shot(page, 'd04-street');
  await nn(page, () => window.__nn.sim(1.6, { mz: 1 }));
  s = await nn(page, () => window.__nn.state());
  check(s.z < -6.8, `walked through the gate into his front yard (z ${s.z})`);

  // spotted: he's on the porch looking at the gate
  await nn(page, () => { window.__nn.teleport(1.5, 0.12, -4.6, 0, 0.12); window.__nn.setAIState('patrol', { x: 0, y: 0.15, z: -10.8, look: Math.PI, hold: true }); });
  const tSpot = await nn(page, () => window.__nn.sim(4, {}, w => w.ai.state === 'chase'));
  s = await nn(page, () => window.__nn.state());
  check(s.ai.state === 'chase', `he spots you and gives chase (after ${tSpot.toFixed ? tSpot.toFixed(2) : tSpot}s)`);
  await nn(page, () => window.__nn.sim(0.45));
  await shot(page, 'd05-spotted-chase');
  // carry something so we can see it dropped where we get caught
  await nn(page, () => window.__nn.giveItem('canLawn'));
  const before = await nn(page, () => { const p = window.__nn.world.player; return [p.x, p.z]; });
  await nn(page, () => window.__nn.sim(4, {}, w => !!w.player.caught));
  s = await nn(page, () => window.__nn.state());
  check(s.caught, 'he catches you');
  await nn(page, () => window.__nn.sim(0.6));
  await shot(page, 'd06-caught-grab');
  await nn(page, () => window.__nn.sim(1.2));
  await shot(page, 'd06b-caught-black');
  await nn(page, () => window.__nn.sim(1.0));
  await nn(page, () => window.__nn.sim(2.0));
  s = await nn(page, () => window.__nn.state());
  const can = await nn(page, () => { const p = window.__nn.world.propById.canLawn; return [p.x, p.z, p.held]; });
  check(!s.caught && Math.abs(s.x + 1.6) < 0.3 && Math.abs(s.z - 15.4) < 0.3, `woke up at home (${s.x}, ${s.z})`);
  check(!can[2] && Math.hypot(can[0] - before[0], can[1] - before[1]) < 3, `the can dropped where you were caught (${can[0].toFixed(1)}, ${can[1].toFixed(1)})`);
  check(s.caughtN === 1, 'caught counter is 1');
  await shot(page, 'd07-wake');

  // pick up a can from his lawn and throw it through the kitchen window
  await nn(page, () => {
    const W = window.__nn.world, c = W.propById.apple10;
    window.__nn.setAIState('patrol', { x: 20, y: 0, z: -50, hold: true });
    window.__nn.teleport(c.x, 0.0, c.z + 1.0, 0, 0);
    window.__nn.sim(0.1);
    window.__nn.lookAt(c.x, c.y + 0.06, c.z);
  });
  s = await nn(page, () => window.__nn.state());
  check(s.look && s.look.startsWith('prop:'), 'looking at an item shows a prompt (' + s.look + ')');
  await shot(page, 'd08-look-item');
  await nn(page, () => window.__nn.sim(1 / 60, { interact: true }));
  s = await nn(page, () => window.__nn.state());
  check(s.inv.some(Boolean), 'picked it up: ' + s.inv.filter(Boolean).join(','));
  await nn(page, () => { window.__nn.teleport(6, 0, -7.5, 0, 0.14); window.__nn.sim(0.05); });
  await shot(page, 'd09-holding');
  await nn(page, () => window.__nn.sim(2, t => ({ primary: t < 0.7, primaryPress: t < 0.02 })));
  const glass = await nn(page, () => window.__nn.world.winById.kitchenW.glass);
  check(!glass, 'the throw broke the kitchen window');
  await shot(page, 'd10-window-broken');

  // stack two crates and climb them (back yard)
  await nn(page, () => {
    const W = window.__nn.world, a = W.propById.crateBack;
    a.x = 0; a.y = 0; a.z = -50; a.rest = false;
    window.__nn.teleport(0, 0, -48.2, 0, -0.42);
    window.__nn.giveItem('crateShed');
    window.__nn.sim(0.4);
  });
  s = await nn(page, () => window.__nn.state());
  await nn(page, () => window.__nn.sim(1 / 60, { drop: true }));
  await nn(page, () => window.__nn.sim(0.8));
  const stackY = await nn(page, () => window.__nn.world.propById.crateShed.y);
  check(stackY > 0.65, `crate stacked on the other (y ${stackY.toFixed(2)})`);
  await nn(page, () => { window.__nn.teleport(1.6, 0, -47.8, 0.7, -0.15); window.__nn.sim(0.05); });
  await shot(page, 'd11-crate-stack');
  await nn(page, () => {
    const W = window.__nn.world, c = W.propById.crateFront;
    c.x = 0; c.y = 0; c.z = -49.05; c.rest = false;
    window.__nn.teleport(0, 0, -47.6, 0, 0);
  });
  const top = await nn(page, () => { let top = 0; window.__nn.sim(1.6, t => ({ mz: t < 1.1 ? 1 : 0, jump: (t > 0.2 && t < 0.25) || (t > 0.75 && t < 0.8) }), w => { if (w.player.onGround) top = Math.max(top, w.player.y); return false; }); return top; });
  check(top > 1.35, `climbed the crate stack (feet at ${top.toFixed(2)} m)`);
  await nn(page, () => { window.__nn.look(Math.PI * 0.85, -0.2); window.__nn.sim(0.05); });
  await shot(page, 'd12-on-stack');

  // a tour of the house
  const tour = [
    ['d13-kitchen', [3.0, 0, -13.0], [9, 1.0, -19]],
    ['d14-hall-stairs', [0.9, 0, -12.8], [-1.3, 1.5, -19]],
    ['d15-living', [-2.8, 0, -13.0], [-6, 1.0, -20.5]],
    ['d16-pantry-basement-door', [5.2, 0, -22.6], [9.9, 1.0, -24.5]],
    ['d17-study-key', [2.8, 3.2, -12.8], [7.1, 4.0, -20.1]],
    ['d18-landing', [0.8, 3.2, -12.8], [0.4, 4.4, -24]],
    ['d19-bedroom', [-2.6, 3.2, -12.8], [-8.6, 3.8, -18]],
    ['d20-nursery', [-2.6, 3.2, -27.4], [-7.5, 3.8, -23.5]],
    ['d21-attic', [4.2, 6.4, -25.8], [-3.5, 7.2, -18.5]],
    ['d22-garage', [10.9, 0, -12.8], [16.5, 0.9, -19.8]],
    ['d23-shed', [14.8, 0.08, -43.0], [19.2, 1.0, -44.4]],
    ['d24-backyard', [9, 0, -38], [0, 2.5, -28]],
    ['d25-side-garage-roof', [22, 0, -24], [14, 3.5, -16]],
  ];
  await nn(page, () => window.__nn.setAIState('patrol', { x: -6.2, y: 0, z: -16.5, look: -1.2, hold: true }));
  for (const [name, at, to] of tour) {
    await nn(page, (a) => { window.__nn.teleport(a[0][0], a[0][1], a[0][2], 0, 0); window.__nn.sim(0.05); window.__nn.lookAt(...a[1]); window.__nn.sim(1 / 60); }, [at, to]);
    await shot(page, name);
  }
  // the neighbour up close
  await nn(page, () => { window.__nn.setAIState('patrol', { x: -4.4, y: 0, z: -16.2, look: Math.PI * 0.75, hold: true }); window.__nn.teleport(-2.6, 0, -13.6, 0.65, 0.06); window.__nn.sim(0.05); });
  await shot(page, 'd26-neighbour');

  // hiding in the wardrobe
  await nn(page, () => { const W = window.__nn.world; W.enterHide(W.hides.find(h => h.id === 'wardrobe')); window.__nn.setAIState('patrol', { x: -5.8, y: 3.2, z: -16.5, look: 2.2, hold: true }); window.__nn.sim(0.1); });
  await shot(page, 'd27-hiding');
  await nn(page, () => window.__nn.world.exitHide());

  // he learns: two more catches at the back door -> traps / camera / boards
  for (let i = 0; i < 2; i++) {
    await nn(page, () => { window.__nn.teleport(0.6, 0, -30.4, 0, 0); window.__nn.setAIState('chase', { x: 0.6, y: 0, z: -29.8, lastKnown: [0.6, 0, -30.4] }); window.__nn.sim(3.4); });
  }
  s = await nn(page, () => window.__nn.state());
  check(s.traps >= 1, `he placed bear traps after catches (${s.traps} traps, ${s.cams} cameras)`);
  await nn(page, () => { const W = window.__nn.world, t = W.traps[0]; window.__nn.setAIState('patrol', { x: 20, y: 0, z: -50, hold: true }); window.__nn.teleport(t.x + 1.6, t.y, t.z + 2.2, 0.55, -0.55); window.__nn.sim(0.05); });
  await shot(page, 'd28-trap');

  // pause + settings + help
  await nn(page, () => window.__nn.pause());
  await shot(page, 'd29-pause');
  await page.click('#p-settings'); await shot(page, 'd30-settings'); await page.click('#o-done');
  await page.click('#p-help'); await shot(page, 'd31-help'); await page.click('#h-done');
  await page.click('#p-resume');

  // the puzzle: power route, then the red key opens the basement
  await nn(page, () => { window.__nn.setAIState('patrol', { x: 20, y: 0, z: -50, hold: true }); window.__nn.completeStep('crowbar'); window.__nn.completeStep('garageWindow'); window.__nn.completeStep('fuse'); });
  await nn(page, () => { const W = window.__nn.world; window.__nn.teleport(9.0, 0, -22.4, -Math.PI / 2, 0); window.__nn.sim(0.05); W.interact({ kind: 'fusebox', ref: W.fusebox }); window.__nn.sim(0.05); });
  s = await nn(page, () => window.__nn.state());
  check(s.steps.includes('power') && !(await nn(page, () => window.__nn.world.doorById.study.locked)), 'fuse box powers the study lock');
  await nn(page, () => { window.__nn.giveItem('redkey'); window.__nn.teleport(8.6, 0, -24.5, -Math.PI / 2, 0.0); window.__nn.sim(0.1); });
  s = await nn(page, () => window.__nn.state());
  check(s.look === 'door:basement', 'looking at the basement door (' + s.look + ')');
  await shot(page, 'd32-basement-door');
  await nn(page, () => window.__nn.sim(1 / 60, { interact: true }));
  check(!(await nn(page, () => window.__nn.world.doorById.basement.locked)), 'red key unlocks the basement');
  await nn(page, () => window.__nn.sim(0.6));
  await shot(page, 'd33-basement-open');
  await nn(page, () => window.__nn.sim(3, { mz: 1 }, w => w.flags.won));
  await nn(page, () => window.__nn.sim(1.6));
  await wait(600);
  check(await page.isVisible('#s-win'), 'win screen: "You got in. What\'s he hiding?"');
  await shot(page, 'd34-win');
  check(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
  await ctx.close();
}

async function phone(browser) {
  console.log('phone landscape 844x390 (touch)');
  const { ctx, page, errors } = await open(browser, { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await shot(page, 'p01-title');
  check(await page.isHidden('#rotate'), 'no rotate prompt in landscape');
  await page.tap('#t-new');
  await page.tap('[data-d=easy]');
  await page.tap('#d-go');
  await wait(500);
  await nn(page, () => window.__nn.freeze(true));
  check(await page.isVisible('#touch'), 'touch controls show');
  await nn(page, () => { window.__nn.setAIState('patrol', { x: 0, y: 0, z: -45, hold: true }); window.__nn.teleport(0.4, 0.12, -4.4, 0, 0.12); });
  await shot(page, 'p02-play');
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  // joystick: push up for a second
  const z0 = (await nn(page, () => window.__nn.state())).z;
  await touch('touchStart', [{ x: 120, y: 300, id: 1 }]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [{ x: 120, y: 300 - i * 8, id: 1 }]); await wait(30); }
  await nn(page, () => window.__nn.sim(1, () => window.__nn.input.poll()));
  await shot(page, 'p03-joystick');
  await touch('touchEnd', []);
  const z1 = (await nn(page, () => window.__nn.state())).z;
  check(z1 < z0 - 0.5, `joystick walks forward (z ${z0} -> ${z1})`);
  // drag on the right to look around
  const yaw0 = await nn(page, () => window.__nn.world.player.yaw);
  await touch('touchStart', [{ x: 600, y: 200, id: 2 }]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [{ x: 600 - i * 12, y: 200, id: 2 }]); await wait(20); }
  await touch('touchEnd', []);
  await nn(page, () => window.__nn.sim(1 / 60, () => window.__nn.input.poll()));
  const yaw1 = await nn(page, () => window.__nn.world.player.yaw);
  check(Math.abs(yaw1 - yaw0) > 0.05, `drag to look turns the camera (${yaw0.toFixed(2)} -> ${yaw1.toFixed(2)})`);
  // look at a can and press USE
  await nn(page, () => { const c = window.__nn.world.propById.apple11; window.__nn.teleport(c.x, 0, c.z + 1.6, 0, 0); window.__nn.sim(0.05); window.__nn.lookAt(c.x, c.y + 0.06, c.z); });
  await shot(page, 'p04-look');
  const use = await page.$('.tb[data-b=use]');
  const bb = await use.boundingBox();
  await touch('touchStart', [{ x: bb.x + bb.width / 2, y: bb.y + bb.height / 2, id: 3 }]);
  await nn(page, () => window.__nn.sim(1 / 60, () => window.__nn.input.poll()));
  await touch('touchEnd', []);
  const inv = (await nn(page, () => window.__nn.state())).inv.filter(Boolean);
  check(inv.length === 1, 'USE button picks the item up (' + inv.join(',') + ')');
  await shot(page, 'p05-holding');
  // throw button (hold to charge) at the living room window
  await nn(page, () => { window.__nn.teleport(-6, 0, -8, 0, 0.16); window.__nn.sim(0.05); });
  const th = await (await page.$('.tb[data-b=throw]')).boundingBox();
  await touch('touchStart', [{ x: th.x + th.width / 2, y: th.y + th.height / 2, id: 4 }]);
  await nn(page, () => window.__nn.sim(0.6, () => window.__nn.input.poll()));
  await touch('touchEnd', []);
  await nn(page, () => window.__nn.sim(1.5, () => window.__nn.input.poll()));
  check(!(await nn(page, () => window.__nn.world.winById.livingW.glass)), 'THROW button breaks the living room window');
  await shot(page, 'p06-thrown');
  // get chased on the phone
  await nn(page, () => { window.__nn.teleport(-6, 0, -8.5, 0, 0.05); window.__nn.setAIState('chase', { x: -4, y: 0, z: -9.5, lastKnown: [-6, 0, -8.5] }); window.__nn.sim(0.6); });
  await shot(page, 'p07-chase');
  check(errors.length === 0, 'no console errors' + (errors.length ? ': ' + errors.slice(0, 5).join(' | ') : ''));
  await ctx.close();
  // portrait shows the rotate prompt
  const P = await open(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  check(await P.page.isVisible('#rotate'), 'portrait asks you to rotate');
  await shot(P.page, 'p08-portrait');
  await P.ctx.close();
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try { await desktop(browser); await phone(browser); }
  catch (e) { fails++; console.log('  FAIL exception: ' + (e && e.stack || e)); }
  await browser.close();
  console.log(fails ? `\n${fails} check(s) failed` : '\nall smoke checks passed');
  process.exit(fails ? 1 : 0);
})();
