// Mobile test: emulated phone (touch only), Touch controls turned on in settings,
// real multi-touch events through the Chrome DevTools Protocol.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/mobile.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-mobile'));
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8125' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
  const frames = (n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const rect = (sel) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; }, sel);

  await page.goto('http://127.0.0.1:8125/');
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '01-title-phone.png') });
  const hint = await page.evaluate(() => document.body.innerText.includes('Touch'));
  check('title screen hints at touch controls on a phone', hint);

  // Default must stay keyboard + mouse; the player turns touch on in Options.
  check('default control scheme is keyboard + mouse', (await page.evaluate(() => window.blockforge.settings.controls)) === 'keyboard');
  await page.evaluate(() => { const bf = window.blockforge; bf.settings.controls = 'touch'; bf.handlers.settingsChanged(bf.settings); });

  await page.evaluate(() => window.blockforge.handlers.createWorld('Phone World', 'mobile-test'));
  await frames(20);
  const state = await page.evaluate(() => ({ s: window.blockforge.game.state, locked: window.blockforge.input.locked, overlay: !!document.querySelector('.bf-touch.on') }));
  check('touch mode starts playing without pointer lock', state.s === 'playing' && state.locked && state.overlay, JSON.stringify(state));
  await page.screenshot({ path: path.join(outDir, '02-playing-landscape.png') });

  // Platform in the sky for clean checks.
  await page.evaluate(() => {
    const bf = window.blockforge, w = bf.game.world, p = bf.game.player;
    const cx = Math.floor(p.x), cz = Math.floor(p.z), y = 150;
    for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { w.set(cx + dx, y, cz + dz, bf.ID.stone); for (let h = 1; h < 5; h++) w.set(cx + dx, y + h, cz + dz, 0); }
    p.x = cx + 0.5; p.z = cz + 0.5; p.y = y + 1; p.vx = p.vy = p.vz = 0; p.flying = false; p.yaw = 0; p.pitch = 0;
  });
  await frames(10);

  // Joystick: push the left thumb up (forward) for a while.
  const z0 = await page.evaluate(() => window.blockforge.game.player.z);
  await touch('touchStart', [[130, 290, 1]]);
  for (let i = 1; i <= 6; i++) { await touch('touchMove', [[130, 290 - i * 10, 1]]); await page.waitForTimeout(30); }
  await page.waitForTimeout(1200);
  await touch('touchEnd', []);
  await frames(5);
  const z1 = await page.evaluate(() => window.blockforge.game.player.z);
  check('left joystick walks forward', z0 - z1 > 1, `moved ${(z0 - z1).toFixed(2)} blocks north`);

  // Look: drag on the right half while also holding the joystick (multi-touch).
  const yaw0 = await page.evaluate(() => window.blockforge.game.player.yaw);
  await touch('touchStart', [[130, 290, 1], [600, 180, 2]]);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', [[130, 270, 1], [600 + i * 15, 180, 2]]); await page.waitForTimeout(20); }
  await touch('touchEnd', []);
  await frames(5);
  const yaw1 = await page.evaluate(() => window.blockforge.game.player.yaw);
  check('dragging the right side turns the camera (while moving)', Math.abs(yaw1 - yaw0) > 0.2, `yaw changed ${(yaw1 - yaw0).toFixed(2)} rad`);

  // Back to the middle of the platform (the joystick walked us off it), standing still.
  const back2 = async () => {
    await page.evaluate(() => {
      const bf = window.blockforge, w = bf.game.world, p = bf.game.player;
      const cx = Math.floor(p.x), cz = Math.floor(p.z), y = 150;
      for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) { w.set(cx + dx, y, cz + dz, bf.ID.stone); for (let h = 1; h < 5; h++) w.set(cx + dx, y + h, cz + dz, 0); }
      p.x = cx + 0.5; p.z = cz + 0.5; p.y = y + 1; p.vx = p.vy = p.vz = 0; p.flying = false; p.yaw = 0; p.pitch = 0;
    });
    await frames(15);
  };
  await back2();
  // Jump button.
  const jb = await rect('.bf-touch [data-btn="jump"]');
  const yJ0 = await page.evaluate(() => window.blockforge.game.player.y);
  await touch('touchStart', [[jb.x, jb.y, 3]]);
  await page.waitForTimeout(150);
  await touch('touchEnd', []);
  let maxY = yJ0;
  for (let i = 0; i < 12; i++) { await frames(1); maxY = Math.max(maxY, await page.evaluate(() => window.blockforge.game.player.y)); }
  check('jump button jumps', maxY - yJ0 > 0.5, `rose ${(maxY - yJ0).toFixed(2)}`);
  await frames(30);

  // Break button removes the block the crosshair is on.
  await back2();
  await page.evaluate(() => { const p = window.blockforge.game.player; p.pitch = -0.75; });
  await frames(6);
  const target = await page.evaluate(() => { const h = window.blockforge.game.hit; return h && { x: h.x, y: h.y, z: h.z }; });
  const bb = await rect('.bf-touch [data-btn="break"]');
  await touch('touchStart', [[bb.x, bb.y, 4]]);
  await frames(2);
  await touch('touchEnd', []);
  await frames(4);
  const broken = target ? await page.evaluate((t) => window.blockforge.game.world.get(t.x, t.y, t.z), target) : -1;
  check('break button breaks the targeted block', broken === 0, JSON.stringify(target));

  // Quick tap on the view places a block.
  await page.evaluate(() => { const bf = window.blockforge; bf.hotbar.set(bf.hotbar.selected, bf.ID.oak_planks); bf.game.player.pitch = -0.75; });
  await frames(6);
  const t2 = await page.evaluate(() => { const h = window.blockforge.game.hit; return h && { x: h.x, y: h.y, z: h.z, face: h.face }; });
  await touch('touchStart', [[620, 160, 5]]);
  await page.waitForTimeout(60);
  await touch('touchEnd', []);
  await frames(6);
  const n = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]][t2 ? t2.face : 2];
  const placed = t2 ? await page.evaluate(([t, n]) => window.blockforge.game.world.get(t.x + n[0], t.y + n[1], t.z + n[2]) & 1023, [t2, n]) : -1;
  check('tapping the view places the held block', placed === (await page.evaluate(() => window.blockforge.ID.oak_planks)), `${placed}`);

  // Fly button toggles flying.
  const fb = await rect('.bf-touch [data-btn="fly"]');
  await touch('touchStart', [[fb.x, fb.y, 6]]);
  await page.waitForTimeout(60);
  await touch('touchEnd', []);
  await page.waitForTimeout(400);
  check('fly button toggles flying', await page.evaluate(() => window.blockforge.game.player.flying));

  // Hotbar slot tap.
  const slot = await rect('.bf-hotbar [data-slot="6"], [data-slot="6"]');
  await touch('touchStart', [[slot.x, slot.y, 7]]);
  await touch('touchEnd', []);
  await frames(3);
  check('tapping a hotbar slot selects it', (await page.evaluate(() => window.blockforge.hotbar.selected)) === 6);

  // Inventory button, pick an item, put it in a slot, close with the X.
  const ib = await rect('.bf-touch [data-btn="inventory"]');
  await touch('touchStart', [[ib.x, ib.y, 8]]);
  await touch('touchEnd', []);
  await frames(5);
  check('inventory button opens the inventory', await page.evaluate(() => window.blockforge.inventory.isOpen));
  await page.screenshot({ path: path.join(outDir, '03-inventory-phone.png') });
  const cell = await rect('[data-k="g3"]');
  await page.touchscreen.tap(cell.x, cell.y);
  const hs = await rect('[data-k="h8"]');
  await page.touchscreen.tap(hs.x, hs.y);
  await frames(3);
  const slot8 = await page.evaluate(() => window.blockforge.hotbar.slots[8]);
  check('tap item then tap hotbar slot fills the slot', slot8 > 0, `slot 9 = ${slot8}`);
  const xb = await rect('.bf-inv-close');
  await page.touchscreen.tap(xb.x, xb.y);
  await frames(5);
  const back = await page.evaluate(() => ({ open: window.blockforge.inventory.isOpen, s: window.blockforge.game.state, overlay: !!document.querySelector('.bf-touch.on') }));
  check('X closes the inventory and returns to the game', !back.open && back.s === 'playing' && back.overlay, JSON.stringify(back));

  // Pause button, then resume from the pause menu.
  const pb = await rect('.bf-touch [data-btn="pause"]');
  await touch('touchStart', [[pb.x, pb.y, 9]]);
  await touch('touchEnd', []);
  await frames(5);
  check('pause button opens the game menu', (await page.evaluate(() => window.blockforge.game.state)) === 'paused');
  await page.screenshot({ path: path.join(outDir, '04-pause-phone.png') });
  const resumeBtn = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find((e) => e.children.length <= 1 && /Back to Game/.test(e.textContent || ''));
    if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (resumeBtn) await page.touchscreen.tap(resumeBtn.x, resumeBtn.y);
  await frames(8);
  check('Back to Game resumes in touch mode', (await page.evaluate(() => window.blockforge.game.state)) === 'playing' && (await page.evaluate(() => window.blockforge.input.locked)));

  // Portrait.
  await page.setViewportSize({ width: 390, height: 844 });
  await frames(10);
  await page.evaluate(() => { const p = window.blockforge.game.player; p.pitch = -0.3; p.yaw = 0.6; });
  await frames(10);
  await page.screenshot({ path: path.join(outDir, '05-playing-portrait.png') });
  const overflow = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.bf-touch .bt').forEach((b) => { const r = b.getBoundingClientRect(); if (r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight) out.push(b.dataset.btn); });
    return out;
  });
  check('all touch buttons stay on screen in portrait', overflow.length === 0, overflow.join(','));

  check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
