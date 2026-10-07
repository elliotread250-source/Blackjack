// Menus test: Shaders screen, Resource Packs (live atlas + icon rebuild), Restore Defaults,
// the pause menu Shaders button, and screenshots of every new screen at 1366x768, 1280x720
// and on a phone (844x390 at 3x, touch only), with a check that nothing leaves the viewport.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/menus.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-menus'));
fs.mkdirSync(outDir, { recursive: true });
const PORT = 8127;
const URL_ = `http://127.0.0.1:${PORT}/`;

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

const btn = (page, text) => page.locator('.bf-screen:visible button', { hasText: text }).first();
const frames = (page, n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);

/** Every visible element of the open menu lies inside the viewport. */
async function overflow(page, name) {
  const bad = await page.evaluate(() => {
    const res = [];
    const vw = innerWidth, vh = innerHeight;
    for (const e of document.querySelectorAll('.bf-menus *')) {
      if (e.closest('.bf-list-in') || e.closest('.bf-pano') || e.classList.contains('bf-tip')) continue;
      let p = e, hidden = false;
      while (p && p !== document.body) { if (getComputedStyle(p).display === 'none') { hidden = true; break; } p = p.parentElement; }
      if (hidden) continue;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) res.push(`${e.className || e.tagName} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || '').slice(0, 30)}"`);
    }
    return res.slice(0, 6);
  });
  check(`${name}: nothing outside the viewport`, bad.length === 0, bad.join(' | '));
}

/** Forbidden words in any visible menu text. */
async function wording(page, name) {
  const t = await page.evaluate(() => document.querySelector('.bf-menus').innerText + ' ' + Array.from(document.querySelectorAll('[data-tip]')).map((e) => e.dataset.tip).join(' '));
  check(`${name}: wording`, !/minecraft/i.test(t) && !t.includes('—'));
}

async function boot(browser, opts) {
  const context = await browser.newContext(opts);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  page.on('dialog', (d) => d.accept().catch(() => undefined));
  await page.goto(URL_);
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  return { context, page, errors };
}

/** Screens of a size: title, options (top + bottom), shaders, packs, then in-game pause. */
async function tour(browser, tag, opts, full) {
  const { context, page, errors } = await boot(browser, opts);
  const shot = async (n) => { await page.waitForTimeout(150); await page.screenshot({ path: path.join(outDir, `${tag}-${n}.png`) }); };
  if (full) await page.evaluate(() => window.blockforge.handlers.createWorld('Menu World', 'menus').then(() => window.blockforge.game.saveAndQuit()));
  await page.waitForSelector('.bf-screen:visible button.bf-btn');
  await page.waitForTimeout(400);
  await shot('01-title'); await overflow(page, `${tag} title`); await wording(page, `${tag} title`);
  await btn(page, 'Options...').click();
  await shot('02-options'); await overflow(page, `${tag} options`); await wording(page, `${tag} options`);
  await page.evaluate(() => { const l = document.querySelector('.bf-screen:not([style*="none"]) .bf-list'); l.dispatchEvent(new WheelEvent('wheel', { deltaY: 4000, bubbles: true, cancelable: true })); });
  await shot('03-options-bottom');
  await page.evaluate(() => { const l = document.querySelector('.bf-screen:not([style*="none"]) .bf-list'); l.dispatchEvent(new WheelEvent('wheel', { deltaY: -4000, bubbles: true, cancelable: true })); });
  await btn(page, 'Shaders:').click();
  await shot('04-shaders'); await overflow(page, `${tag} shaders`); await wording(page, `${tag} shaders`);
  await btn(page, 'Done').click();
  await btn(page, 'Resource Packs...').click();
  await page.waitForTimeout(300);
  await shot('05-packs'); await overflow(page, `${tag} packs`); await wording(page, `${tag} packs`);
  await btn(page, 'Done').click();
  await btn(page, 'Done').click();
  await page.evaluate(() => window.blockforge.handlers.createWorld('Menu World 2', 'menus2'));
  await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); bf.game.pause(); });
  await shot('06-pause'); await overflow(page, `${tag} pause`); await wording(page, `${tag} pause`);
  check(`${tag}: no console errors`, errors.length === 0, errors.slice(0, 4).join(' | '));
  await context.close();
}

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

  // ------------------------------------------------------------------ behaviour (1366x768)
  {
    const { context, page, errors } = await boot(browser, { viewport: { width: 1366, height: 768 } });
    const S = () => page.evaluate(() => { const s = window.blockforge.settings; return { ...s }; });

    // Options no longer has the separate Shadows / Waving Plants toggles.
    await btn(page, 'Options...').click();
    const optText = await page.evaluate(() => Array.from(document.querySelectorAll('.bf-screen:not([style*="none"]) button')).map((b) => b.textContent).join('|'));
    check('options: Shaders button present', /Shaders: Off\.\.\./.test(optText), optText.slice(0, 120));
    check('options: no separate Shadows or Waving toggles', !/Shadows:|Waving Plants/.test(optText));
    check('options: Resource Packs button present', optText.includes('Resource Packs...'));

    // Shaders screen.
    await btn(page, 'Shaders:').click();
    check('shaders screen opens', (await page.evaluate(() => window.blockforge.menus.current())) === 'shaders');
    await page.locator('.bf-card', { hasText: 'Ultra' }).click();
    let s = await S();
    check('Ultra sets the shader pack and derived flags', s.shaderPack === 'ultra' && s.shadows && s.waving, JSON.stringify({ p: s.shaderPack, sh: s.shadows, w: s.waving }));
    check('Ultra on Low settings makes the preset Custom', s.preset === 'custom', s.preset);
    await page.locator('.bf-card', { hasText: 'Off' }).click();
    s = await S();
    check('Off again matches the Low preset', s.shaderPack === 'off' && !s.shadows && !s.waving && s.preset === 'low', s.preset);
    check('Shadow Quality is disabled when shaders are Off', await btn(page, 'Shadow Quality').isDisabled());
    await page.locator('.bf-card', { hasText: 'Fancy' }).click();
    check('Shadow Quality enabled with Fancy', !(await btn(page, 'Shadow Quality').isDisabled()));
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('blockforge.settings.v1') || '{}').shaderPack);
    check('shader choice is saved', saved === 'fancy', saved);
    await page.locator('.bf-card', { hasText: 'Off' }).click();
    await btn(page, 'Done').click();
    check('Done returns to Options', (await page.evaluate(() => window.blockforge.menus.current())) === 'options');

    // Resource packs: atlas pixels change in place, icons are redrawn, old sheet released.
    const before = await page.evaluate(() => {
      const bf = window.blockforge, t = bf.atlas.texture;
      const d = t.image.data; let sum = 0; for (let i = 0; i < 512 * 64 * 4; i++) sum = (sum * 31 + d[i]) | 0;
      return { sum, version: t.version, url: getComputedStyle(document.documentElement).getPropertyValue('--bf-icons').trim(), sheet: bf.icons.url, tile: Array.from(bf.atlas.tiles[1].slice(0, 16)), mips: t.mipmaps.length };
    });
    await btn(page, 'Resource Packs...').click();
    await page.locator('.bf-packrow', { hasText: 'Retro' }).click();
    await page.waitForFunction(() => window.blockforge.atlas.pack === 'retro', null, { timeout: 10000 });
    await page.waitForFunction((old) => window.blockforge.icons.url !== old, before.sheet, { timeout: 10000 });
    await page.waitForTimeout(400);
    const after = await page.evaluate(async (oldUrl) => {
      const bf = window.blockforge, t = bf.atlas.texture;
      const d = t.image.data; let sum = 0; for (let i = 0; i < 512 * 64 * 4; i++) sum = (sum * 31 + d[i]) | 0;
      let oldAlive = true;
      try { await (await fetch(oldUrl)).arrayBuffer(); } catch { oldAlive = false; }
      return { sum, version: t.version, url: getComputedStyle(document.documentElement).getPropertyValue('--bf-icons').trim(), sheet: bf.icons.url, tile: Array.from(bf.atlas.tiles[1].slice(0, 16)), oldAlive, mips: t.mipmaps.length, mip1: t.mipmaps.length ? Array.from(t.mipmaps[1].data.slice(0, 8)) : [] };
    }, before.sheet);
    check('retro: setting saved', (await page.evaluate(() => JSON.parse(localStorage.getItem('blockforge.settings.v1')).resourcePack)) === 'retro');
    check('retro: atlas pixels changed in place', after.sum !== before.sum && JSON.stringify(after.tile) !== JSON.stringify(before.tile));
    check('retro: texture re-uploaded', after.version > before.version, `${before.version} -> ${after.version}`);
    check('retro: mip chain kept', after.mips === before.mips, `${after.mips} levels`);
    check('retro: icon sheet redrawn', after.url !== before.url && after.url.includes(after.sheet));
    check('retro: old icon sheet released', !after.oldAlive);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(outDir, 'b-packs-retro.png') });
    await btn(page, 'Done').click();
    await btn(page, 'Done').click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outDir, 'b-title-retro.png') });

    // Restore Defaults.
    await page.evaluate(() => {
      const bf = window.blockforge, s = bf.settings;
      s.fov = 95; s.guiScale = 3; s.controls = 'touch'; s.volume = 0.2; s.shaderPack = 'ultra'; s.renderDistance = 10;
      bf.handlers.settingsChanged(s);
    });
    await btn(page, 'Options...').click();
    const restore = btn(page, 'Restore Defaults');
    await restore.scrollIntoViewIfNeeded().catch(() => undefined);
    await page.evaluate(() => { const l = document.querySelector('.bf-screen:not([style*="none"]) .bf-list'); l.dispatchEvent(new WheelEvent('wheel', { deltaY: 4000, bubbles: true, cancelable: true })); });
    await restore.click();
    const armed = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.includes('Click again to restore defaults')));
    check('first click asks for a second click', armed);
    s = await S();
    check('first click changes nothing yet', s.fov === 95 && s.resourcePack === 'retro');
    await page.screenshot({ path: path.join(outDir, 'b-restore-armed.png') });
    await page.waitForTimeout(3300);
    const disarmed = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === 'Restore Defaults'));
    check('the question goes away after 3 seconds', disarmed);
    await btn(page, 'Restore Defaults').click();
    await btn(page, 'Click again').click();
    await page.waitForFunction(() => window.blockforge.atlas.pack === 'default', null, { timeout: 10000 });
    s = await S();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('blockforge.settings.v1')));
    check('second click restores defaults', s.fov === 70 && s.guiScale === 2 && s.controls === 'keyboard' && s.volume === 0.6 && s.shaderPack === 'off' && s.renderDistance === 4 && s.resourcePack === 'default' && s.preset === 'low', JSON.stringify(s));
    check('restored settings are saved', stored.fov === 70 && stored.resourcePack === 'default' && stored.controls === 'keyboard');
    const u = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--u').trim());
    check('GUI scale applied live', u === '2px', u);
    const tileBack = await page.evaluate(() => Array.from(window.blockforge.atlas.tiles[1].slice(0, 16)));
    check('textures back to default', JSON.stringify(tileBack) === JSON.stringify(before.tile));
    await page.screenshot({ path: path.join(outDir, 'b-restored.png') });
    await btn(page, 'Done').click();

    // In game: pause menu shader button and a live pack switch.
    await page.evaluate(() => window.blockforge.handlers.createWorld('Pack World', 'packs'));
    await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); const p = bf.game.player; p.pitch = -0.35; p.yaw = 0.7; bf.game.setTimeMode('noon'); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, 'c-world-default.png') });
    await page.evaluate(() => window.blockforge.game.pause());
    await page.waitForTimeout(400);   // let the pause screen settle before clicking
    await btn(page, /^\s*Shaders: Off\s*$/).click();
    s = await S();
    check('pause menu cycles shaders Off -> Fancy', s.shaderPack === 'fancy' && s.shadows, s.shaderPack);
    check('pause button label follows', await btn(page, /^\s*Shaders: Fancy\s*$/).isVisible());
    await btn(page, /^\s*Shaders: Fancy\s*$/).click();
    await btn(page, /^\s*Shaders: Ultra\s*$/).click();
    check('and back to Off', (await S()).shaderPack === 'off');
    await btn(page, 'Options...').click();
    await btn(page, 'Resource Packs...').click();
    for (const pk of ['Smooth', 'Retro', 'Vivid', 'Pastel']) {
      await page.locator('.bf-packrow', { hasText: pk }).click();
      await page.waitForFunction((id) => window.blockforge.atlas.pack === id, pk.toLowerCase(), { timeout: 10000 });
      await page.evaluate(() => { const bf = window.blockforge; bf.menus.hide(); bf.game.state = 'playing'; });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(outDir, `c-world-${pk.toLowerCase()}.png`) });
      await page.evaluate(() => { const bf = window.blockforge; bf.game.state = 'paused'; bf.menus.showPacks(); });
    }
    await page.screenshot({ path: path.join(outDir, 'c-packs-over-game.png') });
    // (the released-sheet check fetches a revoked blob URL on purpose; Chrome logs that load)
    const real = errors.filter((e) => !/ERR_FILE_NOT_FOUND/.test(e));
    check('behaviour: no console errors', real.length === 0, real.slice(0, 4).join(' | '));
    await context.close();
  }

  // ------------------------------------------------------------------ screenshots at three sizes
  await tour(browser, 'd1366', { viewport: { width: 1366, height: 768 } }, true);
  await tour(browser, 'd1280', { viewport: { width: 1280, height: 720 } }, true);
  await tour(browser, 'phone', {
    viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36',
  }, true);

  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
