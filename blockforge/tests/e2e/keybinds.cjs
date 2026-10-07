// Key bindings test: rebinding through the Controls screen, conflicts, reset, and the new
// bindings driving the game. Usage: NODE_PATH=$(npm root -g) node tests/e2e/keybinds.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-keybinds'));
fs.mkdirSync(outDir, { recursive: true });
let failures = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failures++; };

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8132' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:8132/');
  await page.waitForFunction(() => window.blockforge && window.blockforge.game);
  const frames = (n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const visBtn = (re) => page.locator('.bf-screen:visible button').filter({ hasText: re }).first();

  // Controls screen from the title.
  await page.evaluate(() => window.blockforge.menus.showControls(() => window.blockforge.menus.showTitle()));
  await frames(5);
  await page.screenshot({ path: path.join(outDir, 'controls.png') });
  // The first W key button is Walk Forward.
  await visBtn(/^\s*W\s*$/).click();
  check('clicking a key waits for input', await visBtn(/Press a key/).isVisible());
  await page.keyboard.press('KeyI');
  await frames(3);
  let kb = await page.evaluate(() => window.blockforge.settings.keybinds);
  check('forward rebound to I', kb.forward === 'KeyI', JSON.stringify(kb));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('blockforge.settings.v1')).keybinds);
  check('binding saved', stored && stored.forward === 'KeyI');

  // Conflict: bind Walk Backward (S) to I too.
  await visBtn(/^\s*S\s*$/).click();
  await page.keyboard.press('KeyI');
  await frames(3);
  const reds = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-screen button.bf-c-red')).filter((b) => b.offsetParent).map((b) => b.textContent.trim()));
  check('duplicate keys are shown in red', reds.length === 2 && reds.every((t) => t === 'I'), reds.join(','));
  await page.screenshot({ path: path.join(outDir, 'conflict.png') });

  // Esc cancels a pending capture without leaving the screen.
  await visBtn(/^\s*E\s*$/).click();
  await page.keyboard.press('Escape');
  await frames(3);
  check('Esc cancels without changing the key', (await page.evaluate(() => window.blockforge.settings.keybinds.inventory)) === undefined);
  check('Esc did not close the Controls screen', (await page.evaluate(() => window.blockforge.menus.current())) === 'controls');

  // A mouse button can be bound too.
  await visBtn(/^\s*E\s*$/).click();
  await page.mouse.click(640, 360, { button: 'middle' });
  await frames(3);
  check('mouse buttons can be bound', (await page.evaluate(() => window.blockforge.settings.keybinds.inventory)) === 'Mouse1');

  // Reset Keys puts everything back.
  await visBtn(/Reset Keys/).click();
  await frames(3);
  kb = await page.evaluate(() => window.blockforge.settings.keybinds);
  check('Reset Keys restores defaults', Object.keys(kb).length === 0, JSON.stringify(kb));

  // Rebind forward to I and break to B, then play.
  await visBtn(/^\s*W\s*$/).click();
  await page.keyboard.press('KeyI');
  await page.evaluate(() => { const bf = window.blockforge; bf.settings.keybinds.attack = 'KeyB'; });
  await visBtn(/Done/).click();
  await page.evaluate(() => window.blockforge.handlers.createWorld('Binds', 'binds'));
  await page.evaluate(() => {
    const bf = window.blockforge, w = bf.game.world, p = bf.game.player;
    bf.debug.play(); bf.input.virtualLock = true;
    const cx = Math.floor(p.x), cz = Math.floor(p.z), y = 150;
    for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) { w.set(cx + dx, y, cz + dz, bf.ID.stone); for (let h = 1; h < 4; h++) w.set(cx + dx, y + h, cz + dz, 0); }
    p.x = cx + 0.5; p.z = cz + 0.5; p.y = y + 1; p.vx = p.vy = p.vz = 0; p.flying = false; p.yaw = 0; p.pitch = 0;
  });
  await frames(15);
  const z0 = await page.evaluate(() => window.blockforge.game.player.z);
  await page.keyboard.down('KeyW'); await page.waitForTimeout(500); await page.keyboard.up('KeyW');
  await frames(5);
  const z1 = await page.evaluate(() => window.blockforge.game.player.z);
  check('old key W no longer walks', Math.abs(z1 - z0) < 0.05, (z0 - z1).toFixed(2));
  await page.keyboard.down('KeyI'); await page.waitForTimeout(800); await page.keyboard.up('KeyI');
  await frames(5);
  const z2 = await page.evaluate(() => window.blockforge.game.player.z);
  check('new key I walks forward', z1 - z2 > 0.5, (z1 - z2).toFixed(2));
  await page.evaluate(() => { window.blockforge.game.player.pitch = -0.8; });
  await frames(6);
  const hit = await page.evaluate(() => { const h = window.blockforge.game.hit; return h && { x: h.x, y: h.y, z: h.z }; });
  await page.keyboard.press('KeyB');
  await frames(4);
  check('break bound to B breaks blocks', !!hit && (await page.evaluate((h) => window.blockforge.game.world.get(h.x, h.y, h.z), hit)) === 0, JSON.stringify(hit));

  check('no console errors', errors.length === 0, errors.slice(0, 4).join(' | '));
  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
