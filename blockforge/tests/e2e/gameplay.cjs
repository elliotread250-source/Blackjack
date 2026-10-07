// Gameplay test: drives the real game through its input layer and checks world state.
// Builds a stone platform high in the sky so terrain never gets in the way.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/gameplay.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-gameplay'));
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8124' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  await page.goto('http://127.0.0.1:8124/');
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  await page.evaluate(() => window.blockforge.handlers.createWorld('Gameplay', 'gameplay-test'));
  await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); bf.input.virtualLock = true; });
  const frames = (n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  await frames(20);

  // A 9x9 stone platform at y=150 under the player, which stands in its middle looking north.
  const P = await page.evaluate(() => {
    const bf = window.blockforge, g = bf.game, w = g.world, p = g.player;
    const cx = Math.floor(p.x), cz = Math.floor(p.z), y = 150;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
      w.set(cx + dx, y, cz + dz, bf.ID.stone);
      for (let h = 1; h <= 6; h++) w.set(cx + dx, y + h, cz + dz, 0);
    }
    p.x = cx + 0.5; p.z = cz + 0.5; p.y = y + 1; p.vx = p.vy = p.vz = 0; p.flying = false;
    p.yaw = 0; p.pitch = 0;
    return { cx, cz, y };
  });
  await frames(15);
  const get = (x, y, z) => page.evaluate(([x, y, z]) => window.blockforge.game.world.get(x, y, z), [x, y, z]);
  const id = (name) => page.evaluate((n) => window.blockforge.ID[n], name);
  const aim = (yaw, pitch) => page.evaluate(([yaw, pitch]) => { const p = window.blockforge.game.player; p.yaw = yaw; p.pitch = pitch; }, [yaw, pitch]);
  const hitNow = () => page.evaluate(() => { const h = window.blockforge.game.hit; return h && { x: h.x, y: h.y, z: h.z, face: h.face, block: h.block }; });
  const click = async (b) => {
    await page.evaluate((b) => { const i = window.blockforge.input; i.clicked[b] = true; i.buttons[b] = true; }, b);
    await frames(1);
    await page.evaluate((b) => { window.blockforge.input.buttons[b] = false; }, b);
    await frames(8); // past the repeat delay so the next click is a fresh one
  };
  const hold = (name) => page.evaluate((n) => { const bf = window.blockforge; bf.hotbar.set(bf.hotbar.selected, bf.ID[n]); }, name);
  const reset = () => page.evaluate(() => {
    const bf = window.blockforge, p = bf.game.player;
    p.vx = p.vy = p.vz = 0; p.flying = false; p.sneaking = false;
  });

  check('player stands on the platform', Math.abs((await page.evaluate(() => window.blockforge.game.player.y)) - (P.y + 1)) < 0.05);

  // Looking 2 blocks ahead and down hits the platform's top face.
  await aim(0, -0.75);
  await frames(4);
  let h = await hitNow();
  check('raycast hits the platform top face', !!h && h.face === 2 && h.y === P.y, JSON.stringify(h));

  // Break it.
  await click(0);
  check('left click breaks the targeted block', h && (await get(h.x, h.y, h.z)) === 0);

  // Place stone back into the hole: look at the side wall of the hole (block below) or the neighbour.
  await hold('stone');
  await aim(0, -0.75);
  await frames(4);
  h = await hitNow();
  await click(2);
  const n = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]][h ? h.face : 2];
  check('right click places the held block against the hit face', !!h && (await get(h.x + n[0], h.y + n[1], h.z + n[2])) === (await id('stone')), JSON.stringify(h));

  // Slabs: placing on the top face gives a bottom slab; a second one makes it double.
  await page.evaluate((P) => { const w = window.blockforge.game.world; w.set(P.cx, P.y + 1, P.cz - 2, 0); w.set(P.cx, P.y + 1, P.cz - 3, 0); }, P);
  await hold('stone_slab');
  await aim(0, -0.62);
  await frames(4);
  h = await hitNow();
  await click(2);
  const slab1 = h ? await get(h.x, h.y + 1, h.z) : -1;
  check('slab on a top face is a bottom slab', (slab1 & 1023) === (await id('stone_slab')) && (slab1 >> 10) === 0, `${slab1 & 1023} meta ${slab1 >> 10}`);
  await frames(4);
  await click(2);
  const slab2 = h ? await get(h.x, h.y + 1, h.z) : -1;
  check('second slab merges into a double slab', (slab2 >> 10) === 2, `meta ${slab2 >> 10}`);

  // Stairs face the player's look direction (north = meta 0).
  await page.evaluate((P) => { const w = window.blockforge.game.world; w.set(P.cx + 2, P.y + 1, P.cz - 2, 0); }, P);
  await hold('oak_stairs');
  await page.evaluate((P) => { const p = window.blockforge.game.player; p.x = P.cx + 2.5; p.z = P.cz + 0.5; }, P);
  await aim(0, -0.62);
  await frames(4);
  h = await hitNow();
  await click(2);
  const st = h ? await get(h.x, h.y + 1, h.z) : -1;
  check('stairs face the way the player looks', (st & 1023) === (await id('oak_stairs')) && ((st >> 10) & 3) === 0, `meta ${st >> 10}`);

  // Torch on top of a block stands upright; on a wall it becomes a wall torch.
  await page.evaluate((P) => { const p = window.blockforge.game.player; p.x = P.cx - 1.5; p.z = P.cz + 0.5; }, P);
  await hold('torch');
  await aim(0, -0.62);
  await frames(4);
  h = await hitNow();
  await click(2);
  const torch = h ? await get(h.x, h.y + 1, h.z) : -1;
  check('torch on top of a block stands upright', (torch & 1023) === (await id('torch')) && (torch >> 10) === 0, `id ${torch & 1023} meta ${torch >> 10}`);

  // Water placed on the platform spreads.
  await page.evaluate((P) => { const p = window.blockforge.game.player; p.x = P.cx + 0.5; p.z = P.cz + 2.5; }, P);
  await hold('water');
  await aim(0, -0.9);
  await frames(4);
  h = await hitNow();
  await click(2);
  await page.waitForTimeout(2500);
  const wet = await page.evaluate((P) => {
    const bf = window.blockforge, w = bf.game.world; let n = 0;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) if ((w.get(P.cx + dx, P.y + 1, P.cz + dz) & 1023) === bf.ID.water) n++;
    return n;
  }, P);
  check('water flows across the platform', wet > 3, `${wet} water cells`);

  // Walk forward for a second on the flat platform.
  await page.evaluate((P) => {
    const bf = window.blockforge, w = bf.game.world, p = bf.game.player;
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) for (let h = 1; h <= 3; h++) w.set(P.cx + dx, P.y + h, P.cz + dz, 0);
    for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) w.set(P.cx + dx, P.y, P.cz + dz, bf.ID.stone);
    p.x = P.cx + 0.5; p.z = P.cz + 3.5; p.y = P.y + 1; p.yaw = 0; p.pitch = 0;
  }, P);
  await reset();
  await frames(10);
  // Software rendering runs below 10 fps, so measure distance against the player's own sim clock.
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(600);
  const a = await page.evaluate(() => { const p = window.blockforge.game.player; return { z: p.z, t: p.clock }; });
  await page.waitForTimeout(1200);
  const b = await page.evaluate(() => { const p = window.blockforge.game.player; return { z: p.z, t: p.clock }; });
  await page.keyboard.up('KeyW');
  const speed = (a.z - b.z) / (b.t - a.t);
  check('W walks at about 4.3 blocks per second', speed > 3.9 && speed < 4.8, `${speed.toFixed(2)} blocks/s`);

  // Jump height.
  await reset();
  await frames(20);
  const yJump = await page.evaluate(async () => {
    const p = window.blockforge.game.player; const y0 = p.y; let max = y0;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    await new Promise((r) => setTimeout(r, 60));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
    const t0 = performance.now();
    await new Promise((r) => { const f = () => { max = Math.max(max, p.y); if (performance.now() - t0 < 900) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    return max - y0;
  });
  check('jump reaches about 1.25 blocks', yJump > 1.0 && yJump < 1.5, yJump.toFixed(2));

  // Double-tap space toggles flying.
  await frames(20);
  await page.keyboard.press('Space'); await page.waitForTimeout(250); await page.keyboard.press('Space');
  await frames(6);
  check('double-tap Space toggles flying', await page.evaluate(() => window.blockforge.game.player.flying));

  // Inventory opens and closes with E.
  await page.keyboard.press('KeyE');
  await frames(5);
  check('E opens the creative inventory', await page.evaluate(() => window.blockforge.inventory.isOpen));
  await page.screenshot({ path: path.join(outDir, 'inventory.png') });
  await page.keyboard.press('KeyE');
  await frames(5);
  check('E closes the inventory', !(await page.evaluate(() => window.blockforge.inventory.isOpen)));
  await page.evaluate(() => { const bf = window.blockforge; bf.input.enabled = true; bf.input.virtualLock = true; bf.game.state = 'playing'; });
  await page.keyboard.press('Digit5');
  await frames(3);
  check('number keys select hotbar slots', (await page.evaluate(() => window.blockforge.hotbar.selected)) === 4);

  await page.evaluate((P) => { const p = window.blockforge.game.player; p.x = P.cx + 0.5; p.z = P.cz + 6.5; p.y = P.y + 2; p.flying = true; p.yaw = 0; p.pitch = -0.35; }, P);
  await frames(20);
  await page.screenshot({ path: path.join(outDir, 'platform.png') });

  // Save, quit, reload: the platform must still be there.
  await page.evaluate(() => window.blockforge.game.saveAndQuit());
  await frames(10);
  const worlds = await page.evaluate(() => window.blockforge.storage.listWorlds());
  check('world appears in the saved world list', worlds.length >= 1);
  await page.evaluate((wid) => window.blockforge.handlers.playWorld(wid), worlds[0].id);
  await frames(10);
  check('edits survive save and reload', (await get(P.cx + 4, P.y, P.cz + 4)) === (await id('stone')));

  check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
