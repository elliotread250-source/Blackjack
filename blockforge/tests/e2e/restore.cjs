// Restore test: play a world, build and fly somewhere, then close the tab WITHOUT using
// Save and Quit. Reopening the page must offer "Continue: <world>" on the title screen and
// bring back the build, the position and look direction, flying, the hotbar and the time.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/restore.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-restore'));
fs.mkdirSync(outDir, { recursive: true });
const PORT = 8126;
const URL_ = `http://127.0.0.1:${PORT}/`;

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

async function open(context, errors) {
  const page = await context.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  // Leaving a page mid-game asks first (beforeunload); the player confirms.
  page.on('dialog', (d) => d.accept().catch(() => undefined));
  await page.goto(URL_);
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  return page;
}
const frames = (page, n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

/** Make some edits and move the player; returns what must come back. */
async function playSome(page, tag, offset) {
  return page.evaluate(([tag, offset]) => {
    const bf = window.blockforge, g = bf.game, w = g.world, p = g.player, ID = bf.ID;
    const bx = Math.floor(p.x) + 3 + offset, bz = Math.floor(p.z) + 2, by = 150 + offset;
    const blocks = [];
    // A little tower of mixed blocks plus a hole, high enough that terrain never interferes.
    const names = ['gold_block', 'diamond_block', 'oak_planks', 'red_wool', 'glass', 'bricks'];
    for (let i = 0; i < names.length; i++) {
      const v = ID[names[i]];
      w.set(bx, by + i, bz, v);
      blocks.push([bx, by + i, bz, v]);
    }
    w.set(bx + 1, by, bz, ID.oak_stairs | (2 << 10));
    blocks.push([bx + 1, by, bz, ID.oak_stairs | (2 << 10)]);
    // Dig into dry ground nearby (a hole in water would just fill up again).
    for (let dx = -2; dx >= -8; dx--) {
      const ty = w.topY(bx + dx, bz), top = w.get(bx + dx, ty, bz) & 1023;
      if (ty > 0 && ty < by && top !== ID.water && top !== ID.lava && !bf.BLOCKS[top].name.includes('leaves')) {
        w.set(bx + dx, ty, bz, 0); blocks.push([bx + dx, ty, bz, 0]);
        break;
      }
    }
    // Hotbar and time of day.
    const slots = ['bricks', 'glass', 'torch', 'gold_block', 'red_wool', 'oak_log', 'diamond_block', 'stone', 'sand'].map((n) => ID[n]);
    if (tag === 'b') slots.reverse();
    bf.hotbar.load(slots, tag === 'a' ? 6 : 2);
    g.setTimeMode('cycle');
    g.dayTime = tag === 'a' ? 0.6 : 0.31;
    // Fly somewhere else and look around.
    p.flying = true; p.vx = p.vy = p.vz = 0;
    p.x = bx + 0.25 + 21.5; p.y = by + 7.375; p.z = bz - 17.75;
    p.yaw = tag === 'a' ? 1.234 : -2.5; p.pitch = tag === 'a' ? -0.321 : 0.2;
    return { blocks, pos: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch }, slots, selected: bf.hotbar.selected, dayTime: g.dayTime };
  }, [tag, offset]);
}

async function continueAndCheck(page, exp, label) {
  await page.waitForSelector('button.bf-continue', { state: 'visible', timeout: 15000 });
  const text = await page.evaluate(() => document.querySelector('button.bf-continue').textContent.trim());
  check(`${label}: title offers Continue for the last world`, /^Continue: Restore Test/.test(text), text);
  await page.screenshot({ path: path.join(outDir, `${label}-1-title.png`) });
  await page.click('button.bf-continue');
  await page.waitForFunction(() => { const g = window.blockforge.game; return g.state === 'playing' || g.state === 'paused'; }, null, { timeout: 90000 });
  await frames(page, 5);
  const got = await page.evaluate((exp) => {
    const bf = window.blockforge, g = bf.game, p = g.player;
    return {
      blocks: exp.blocks.map(([x, y, z]) => g.world.get(x, y, z)),
      pos: { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, flying: p.flying },
      slots: bf.hotbar.slots.slice(), selected: bf.hotbar.selected, dayTime: g.dayTime, timeMode: g.timeMode, name: g.meta && g.meta.name,
    };
  }, exp);
  check(`${label}: Continue opened that world`, got.name === 'Restore Test', got.name);
  const bad = exp.blocks.filter((b, i) => got.blocks[i] !== b[3]);
  check(`${label}: every edit came back`, bad.length === 0, bad.length ? JSON.stringify(bad.slice(0, 3)) + ' got ' + JSON.stringify(got.blocks) : `${exp.blocks.length} blocks`);
  const d = Math.hypot(got.pos.x - exp.pos.x, got.pos.y - exp.pos.y, got.pos.z - exp.pos.z);
  check(`${label}: position within 0.5 blocks`, d < 0.5, `off by ${d.toFixed(3)}`);
  check(`${label}: look direction restored`, Math.abs(got.pos.yaw - exp.pos.yaw) < 0.01 && Math.abs(got.pos.pitch - exp.pos.pitch) < 0.01, `yaw ${got.pos.yaw.toFixed(3)} pitch ${got.pos.pitch.toFixed(3)}`);
  check(`${label}: still flying`, got.pos.flying === true);
  check(`${label}: hotbar restored`, JSON.stringify(got.slots) === JSON.stringify(exp.slots) && got.selected === exp.selected, `${JSON.stringify(got.slots)} sel ${got.selected}`);
  check(`${label}: time of day restored`, Math.abs(got.dayTime - exp.dayTime) < 0.01 && got.timeMode === 'cycle', `${got.dayTime.toFixed(4)} vs ${exp.dayTime.toFixed(4)}`);
  await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); bf.input.virtualLock = true; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, `${label}-2-restored.png`) });
}

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const errors = [];

  // 1. No saved world yet: no Continue button.
  let page = await open(context, errors);
  await page.waitForTimeout(500);
  check('fresh browser: no Continue button', !(await page.isVisible('button.bf-continue')));

  // 2. Play, build, fly, then close the tab two seconds later (no Save and Quit).
  await page.evaluate(() => window.blockforge.handlers.createWorld('Restore Test', 'restore-seed'));
  await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); bf.input.virtualLock = true; });
  await frames(page, 10);
  const a = await playSome(page, 'a', 0);
  await frames(page, 3);
  await page.screenshot({ path: path.join(outDir, 'a-0-before-close.png') });
  await page.waitForTimeout(2000);
  await page.close();

  page = await open(context, errors);
  await continueAndCheck(page, a, 'a');

  // 3. Harder: edit, move and navigate away almost at once (only the exit save can catch it).
  const b = await playSome(page, 'b', 12);
  await frames(page, 2);
  await page.waitForTimeout(300);
  await page.goto('about:blank');
  page.close();
  page = await open(context, errors);
  await continueAndCheck(page, b, 'b');
  const leftovers = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('blockforge.journal.')).length);
  console.log(`emergency chunk copies still waiting to be moved: ${leftovers}`);

  check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
