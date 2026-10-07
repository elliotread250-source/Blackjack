// WS6 UI test: mounts the menus, HUD and creative inventory with stub handlers in headless
// Chromium, screenshots every screen at 1366x768 and 1280x720 (and 1920x1080 at scale 4),
// then scripts the inventory and menu interactions and checks the results.
// Usage: NODE_PATH=$(npm root -g) node tests/ws6-ui/ui.test.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const out = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(root, 'tests/ws6-ui/out');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
fs.mkdirSync(out, { recursive: true });
const bundle = path.join(out, 'ui-bundle.js');
execSync(`npx esbuild ${path.join(__dirname, 'harness-entry.ts')} --bundle --format=iife --outfile=${bundle} --log-level=warning`, { cwd: root });
const bootCss = fs.readFileSync(path.join(root, 'src/ui/boot.css'), 'utf8');

let failures = 0;
function check(cond, msg) { if (!cond) { failures++; console.log('  FAIL', msg); } else console.log('  ok  ', msg); }

async function mount(browser, w, h, guiScale = 2, dpr = 1) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.setContent(`<!doctype html><html><head><style>${bootCss}</style></head><body></body></html>`);
  await page.addScriptTag({ path: bundle });
  const r = await page.evaluate((s) => window.bfTest({ guiScale: s }), guiScale);
  await page.waitForTimeout(150);
  return { page, errors, iconMs: r.iconMs };
}

async function shots(browser, w, h, scale, tag) {
  const { page, errors, iconMs } = await mount(browser, w, h, scale);
  console.log(`[${tag}] ${w}x${h} gui scale ${scale}: layout`, JSON.stringify(await page.evaluate(() => window.bf.guiLayout())), `icons ${iconMs.toFixed(0)} ms`);
  const snap = async (name) => { await page.waitForTimeout(120); await page.screenshot({ path: path.join(out, `${tag}-${name}.png`) }); };
  const overflow = async (name) => {
    // Every visible element of the open UI must lie inside the viewport.
    const bad = await page.evaluate(() => {
      const res = [];
      const vw = innerWidth, vh = innerHeight;
      for (const e of document.querySelectorAll('#ui *')) {
        const st = getComputedStyle(e);
        if (st.display === 'none' || st.visibility === 'hidden' || e.closest('.bf-list-in') || e.classList.contains('bf-pano') || e.closest('.bf-pano')) continue;
        let p = e, hidden = false;
        while (p && p !== document.body) { if (getComputedStyle(p).display === 'none') { hidden = true; break; } p = p.parentElement; }
        if (hidden) continue;
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) res.push(`${e.className || e.tagName} ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} "${(e.textContent || '').slice(0, 30)}"`);
      }
      return res.slice(0, 6);
    });
    check(bad.length === 0, `${tag} ${name}: nothing outside the viewport ${bad.length ? JSON.stringify(bad) : ''}`);
  };
  await page.evaluate(() => window.bf.menus.showTitle());
  await page.waitForTimeout(400);
  await snap('01-title'); await overflow('title');
  await page.evaluate(() => window.bf.menus.showWorlds());
  await page.waitForTimeout(200);
  await snap('02-worlds'); await overflow('worlds');
  await page.evaluate(() => document.querySelectorAll('.bf-row')[1].click());
  await page.evaluate(() => [...document.querySelectorAll('.bf-btn')].find((b) => b.textContent.trim() === 'Delete' && b.offsetParent).click());
  await snap('03-delete-confirm'); await overflow('delete');
  await page.evaluate(() => window.bf.menus.back());
  await page.evaluate(() => [...document.querySelectorAll('.bf-btn')].find((b) => b.textContent.trim() === 'Create New World' && b.offsetParent).click());
  await page.waitForTimeout(100);
  await snap('04-create'); await overflow('create');
  await page.evaluate(() => window.bf.menus.showOptions(() => window.bf.menus.showTitle()));
  await snap('05-options'); await overflow('options');
  await page.mouse.move(Math.round(w / 2) - 100, 120);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(800);
  await snap('06-options-scrolled');
  await page.evaluate(() => window.bf.menus.showControls(() => window.bf.menus.showTitle()));
  await snap('07-controls'); await overflow('controls');
  await page.evaluate(() => { window.bf.menus.hide(); window.bf.hud.setVisible(true); window.bf.menus.showPause(); });
  await snap('08-pause'); await overflow('pause');
  await page.evaluate(() => window.bf.menus.showOptions(() => window.bf.menus.showPause()));
  await snap('09-options-ingame');
  await page.evaluate(() => window.bf.menus.showLoading('Generating terrain', 0.4));
  await snap('10-loading'); await overflow('loading');
  await page.evaluate(() => {
    const bf = window.bf;
    bf.menus.hide();
    bf.hud.setVisible(true);
    bf.hud.setDebugVisible(true);
    bf.hud.setDebug([
      'BlockForge 1.0 (2026-10-07)', '60 fps (16.7 ms)', 'Draw calls: 412  Triangles: 1,204,332', 'Sections: 210 / 388 visible',
      'Chunks: 81 loaded, gen queue 0, mesh queue 2', '', 'XYZ: 12.513 / 71.000 / -40.250', 'Block: 12 71 -41',
      'Chunk: 12 7 7 in 0 4 -3', 'Facing: north (Towards negative Z) (0.0 / 12.5)', 'Biome: plains', 'Light: 15 sky, 0 block',
      'Time: 09:12 (cycle)', 'Mode: creative, flying', '', 'Looking at: 13 70 -44', 'Grass Block [grass_block] meta 0',
    ], [
      'Renderer: WebGL 2', 'GPU: ANGLE (Intel, Intel(R) UHD Graphics 620)', 'Vendor: Google Inc. (Intel)', 'Display: 1366x768 @ 1.00x',
      'Memory: 212 / 4096 MB', 'CPU threads: 4', '', 'Preset: low, render distance 4', 'Shadows: off, leaves: fast', 'Seed: 1234567',
    ]);
    bf.hud.message('Saved screenshot as blockforge_2026-10-07_14.03.11.png');
    bf.hud.message('World saved');
    bf.hotbar.select(2);
    bf.hud.showItemName('Oak Planks');
  });
  await snap('11-hud-debug'); await overflow('hud');
  await page.evaluate(() => { window.bf.hud.setDebugVisible(false); window.bf.hud.setFps('60 fps'); window.bf.hud.setUnderwaterTint(true); });
  await snap('12-hud-fps-underwater');
  await page.evaluate(() => { window.bf.hud.setUnderwaterTint(false); window.bf.inv.open(); });
  await page.mouse.move(Math.round(w / 2) - 20, Math.round(h / 2) - 30);
  await page.waitForTimeout(150);
  await snap('13-inventory-building'); await overflow('inventory');
  await page.evaluate(() => window.bf.inv.selectTab(2));
  await page.mouse.move(Math.round(w / 2) + 10, Math.round(h / 2) - 10);
  await snap('14-inventory-natural');
  await page.evaluate(() => window.bf.inv.selectTab(8));
  await page.keyboard.type('oak');
  await page.mouse.move(Math.round(w / 2) - 60, Math.round(h / 2) - 50);
  await snap('15-inventory-search');
  // hold an item on the cursor
  await page.evaluate(() => window.bf.inv.selectTab(6));
  const slot = await page.evaluate(() => { const r = document.querySelector('[data-k="g3"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(slot.x, slot.y);
  await page.mouse.move(slot.x + 70, slot.y + 40);
  await snap('16-inventory-held');
  await page.evaluate(() => window.bf.inv.close());
  if (errors.length) console.log('console:', errors.join('\n'));
  check(errors.length === 0, `${tag}: no console errors`);
  await page.close();
}

async function interactions(browser) {
  console.log('[interactions] 1366x768');
  const { page, errors } = await mount(browser, 1366, 768, 2);
  const center = async (k) => page.evaluate((k) => { const r = document.querySelector(`[data-k="${k}"]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, k);
  const state = () => page.evaluate(() => ({ slots: window.bf.hotbar.slots.slice(), sel: window.bf.hotbar.selected, held: window.bf.inv.heldItem, items: window.bf.inv.visibleItems }));
  await page.keyboard.press('KeyE');
  check(await page.evaluate(() => window.bf.inv.isOpen), 'E opens the inventory (harness routing)');
  await page.evaluate(() => window.bf.inv.selectTab(0));
  let s = await state();
  const first = s.items[0], second = s.items[1];
  // click item -> held; click hotbar slot 4 -> placed, previous content now held
  let g0 = await center('g0'), h4 = await center('h4');
  const old4 = s.slots[4];
  await page.mouse.click(g0.x, g0.y);
  s = await state();
  check(s.held === first, 'click on an item puts it on the cursor');
  await page.mouse.click(h4.x, h4.y);
  s = await state();
  check(s.slots[4] === first && s.held === old4, 'click on a hotbar slot drops it there and picks up the old item (swap)');
  // click outside the panel clears the held item
  await page.mouse.click(20, 20);
  s = await state();
  check(s.held === 0, 'click outside the panel discards the held item');
  // shift-click -> first free slot
  await page.evaluate(() => { const h = window.bf.hotbar; h.set(6, 0); h.set(7, 0); });
  const g1 = await center('g1');
  await page.keyboard.down('Shift');
  await page.mouse.click(g1.x, g1.y);
  await page.keyboard.up('Shift');
  s = await state();
  check(s.slots[6] === second && s.held === 0, 'shift-click sends the item to the first free hotbar slot');
  // shift-click when full -> selected slot
  await page.evaluate(() => { const h = window.bf.hotbar; for (let i = 0; i < 9; i++) if (!h.slots[i]) h.set(i, 1); h.select(3); });
  const g2 = await center('g2');
  await page.keyboard.down('Shift');
  await page.mouse.click(g2.x, g2.y);
  await page.keyboard.up('Shift');
  s = await state();
  check(s.slots[3] === s.items[2], 'shift-click with a full hotbar replaces the selected slot');
  // shift-click a hotbar slot clears it; right-click clears too
  const h8 = await center('h8');
  await page.keyboard.down('Shift');
  await page.mouse.click(h8.x, h8.y);
  await page.keyboard.up('Shift');
  s = await state();
  check(s.slots[8] === 0, 'shift-click on a hotbar slot clears it');
  const h7 = await center('h7');
  await page.mouse.click(h7.x, h7.y, { button: 'right' });
  s = await state();
  check(s.slots[7] === 0 && s.held === 0, 'right-click on a hotbar slot clears it');
  // drag and drop from the grid to hotbar slot 0
  const g5 = await center('g5'), h0 = await center('h0');
  await page.mouse.move(g5.x, g5.y);
  await page.mouse.down();
  await page.mouse.move((g5.x + h0.x) / 2, (g5.y + h0.y) / 2, { steps: 4 });
  await page.mouse.move(h0.x, h0.y, { steps: 4 });
  await page.mouse.up();
  s = await state();
  check(s.slots[0] === s.items[5] && s.held === 0, 'drag and drop from the grid onto a hotbar slot');
  // drag hotbar 0 onto hotbar 2 swaps
  const before = s.slots.slice();
  const h2 = await center('h2');
  await page.mouse.move(h0.x, h0.y);
  await page.mouse.down();
  await page.mouse.move(h2.x, h2.y, { steps: 6 });
  await page.mouse.up();
  s = await state();
  check(s.slots[2] === before[0] && s.slots[0] === before[2] && s.held === 0, 'drag between hotbar slots swaps them');
  // drag outside -> discarded
  const g6 = await center('g6');
  const slotsBefore = s.slots.slice();
  await page.mouse.move(g6.x, g6.y);
  await page.mouse.down();
  await page.mouse.move(30, 30, { steps: 6 });
  await page.mouse.up();
  s = await state();
  check(s.held === 0 && JSON.stringify(s.slots) === JSON.stringify(slotsBefore), 'dragging an item outside the panel drops nothing');
  // digit key while hovering
  const g4 = await center('g4');
  await page.mouse.move(g4.x, g4.y);
  await page.keyboard.press('Digit9');
  s = await state();
  check(s.slots[8] === s.items[4], 'pressing 9 while hovering an item puts it in hotbar slot 9');
  const hs = s.slots.slice();
  const h1 = await center('h1');
  await page.mouse.move(h1.x, h1.y);
  await page.keyboard.press('Digit6');
  s = await state();
  check(s.slots[5] === hs[1] && s.slots[1] === hs[5], 'pressing 6 while hovering hotbar slot 2 swaps the two slots');
  // tooltip on hover
  await page.mouse.move(g4.x, g4.y);
  const tip = await page.evaluate(() => { const t = document.querySelector('.bf-inv-root .bf-tip'); return t.classList.contains('bf-on') ? t.textContent : null; });
  check(!!tip && tip.startsWith(await page.evaluate((id) => window.bf.names[id], s.items[4])), `tooltip shows the block name (${tip})`);
  // scrolling
  const firstVisible = await page.evaluate(() => document.querySelector('[data-k="g0"] .bf-icon').dataset.icon);
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(100);
  const afterScroll = await page.evaluate(() => document.querySelector('[data-k="g0"] .bf-icon').dataset.icon);
  check(firstVisible !== afterScroll, 'mouse wheel scrolls the grid');
  // search: T switches to search, typing filters
  await page.mouse.move(5, 5);
  await page.keyboard.press('KeyT');
  check(await page.evaluate(() => window.bf.inv.currentTab === 8), 'T switches to the search tab');
  await page.keyboard.type('stairs');
  s = await state();
  const expected = await page.evaluate(() => window.bf.names.filter((n, id) => id > 0 && n.toLowerCase().includes('stairs')).length);
  check(s.items.length === expected && expected > 10, `search "stairs" lists ${s.items.length} items (expected ${expected})`);
  check(await page.evaluate(() => window.bf.inv.isOpen), 'typing E-free text keeps the inventory open');
  await page.keyboard.type(' oake');
  s = await state();
  check(s.items.length === 1 && await page.evaluate((id) => window.bf.names[id], s.items[0]) === 'Oak Stairs', 'typing "e" in the search box types instead of closing');
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.type('zzzz');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('.bf-inv-empty')).display !== 'none'), 'no-match message shows for an empty search');
  await page.keyboard.press('Escape');
  check(!(await page.evaluate(() => window.bf.inv.isOpen)), 'Esc closes the inventory');
  await page.keyboard.press('KeyE');
  await page.evaluate(() => window.bf.inv.selectTab(1));
  await page.keyboard.press('KeyE');
  check(!(await page.evaluate(() => window.bf.inv.isOpen)), 'E closes the inventory on a category tab');

  // Menus
  const btn = (label) => page.evaluate((label) => { const b = [...document.querySelectorAll('.bf-menus .bf-btn')].find((x) => x.textContent.trim() === label && x.offsetParent); if (!b) return false; b.click(); return true; }, label);
  await page.evaluate(() => window.bf.menus.showTitle());
  check(await btn('Singleplayer'), 'title has Singleplayer');
  await page.waitForTimeout(100);
  check(await page.evaluate(() => window.bf.menus.current()) === 'worlds', 'Singleplayer opens the world list');
  check(await page.evaluate(() => document.querySelectorAll('.bf-row').length) === 3, 'world list shows 3 worlds');
  await page.evaluate(() => document.querySelectorAll('.bf-row')[2].click());
  await btn('Delete');
  await btn('Delete');
  await page.waitForTimeout(100);
  const log1 = await page.evaluate(() => window.bf.log.filter((x) => x[0] === 'deleteWorld'));
  check(log1.length === 1 && log1[0][1] === 'w3', 'Delete asks for confirmation then deletes the selected world');
  check(await page.evaluate(() => document.querySelectorAll('.bf-row').length) === 2, 'list refreshes after delete');
  await btn('Create New World');
  await page.waitForTimeout(50);
  check(await page.evaluate(() => window.bf.menus.current()) === 'create', 'Create New World opens the create screen');
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Test Land');
  await page.keyboard.press('Tab');
  await page.keyboard.type('hello seed');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  const create = await page.evaluate(() => window.bf.log.filter((x) => x[0] === 'createWorld'));
  check(create.length === 1 && create[0][1] === 'Test Land' && create[0][2] === 'hello seed', `create passes name and seed (${JSON.stringify(create[0])})`);
  check(await page.evaluate(() => window.bf.menus.current()) === 'loading', 'loading screen after create');
  await page.evaluate(() => window.bf.menus.showPause());
  await btn('Time of Day: Day Cycle');
  check(await page.evaluate(() => window.bf.log.some((x) => x[0] === 'setTimeMode' && x[1] === 'sunrise')), 'time of day button cycles to Sunrise');
  check(await page.evaluate(() => [...document.querySelectorAll('.bf-btn')].some((b) => b.textContent.trim() === 'Time of Day: Sunrise')), 'time of day label updates');
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => window.bf.log.some((x) => x[0] === 'resume')) && !(await page.evaluate(() => window.bf.menus.isOpen())), 'Esc on pause resumes');
  await page.evaluate(() => window.bf.menus.showPause());
  await btn('Options...');
  check(await page.evaluate(() => window.bf.menus.current()) === 'options', 'pause Options opens options');
  const n0 = await page.evaluate(() => window.bf.log.filter((x) => x[0] === 'settingsChanged').length);
  await btn('Clouds: ON');
  const n1 = await page.evaluate(() => window.bf.log.filter((x) => x[0] === 'settingsChanged').length);
  check(n1 === n0 + 1 && await page.evaluate(() => window.bf.settings.clouds === false && window.bf.settings.preset === 'custom'), 'toggling Clouds applies live and switches the preset to Custom');
  await btn('Graphics: Custom');
  check(await page.evaluate(() => window.bf.settings.preset === 'low' && window.bf.settings.clouds === true), 'Graphics button applies the Low preset');
  await btn('Graphics: Low');
  check(await page.evaluate(() => window.bf.settings.preset === 'medium' && window.bf.settings.renderDistance === 6 && window.bf.settings.fancyLeaves), 'Graphics button cycles to Medium');
  // slider drag: render distance
  const sl = await page.evaluate(() => { const s = [...document.querySelectorAll('.bf-slider')].find((x) => x.textContent.includes('Render Distance')); const r = s.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
  await page.mouse.move(sl.x + 5, sl.y);
  await page.mouse.down();
  await page.mouse.move(sl.x + sl.w - 2, sl.y, { steps: 5 });
  await page.mouse.up();
  check(await page.evaluate(() => window.bf.settings.renderDistance === 12), 'dragging the render distance slider to the right end gives 12');
  await page.keyboard.press('ArrowLeft');
  check(await page.evaluate(() => window.bf.settings.renderDistance === 11), 'arrow keys nudge a focused slider');
  // gui scale
  await btn('GUI Scale: 2');
  check(await page.evaluate(() => window.bf.settings.guiScale === 3 && window.bf.guiLayout().uDev === 3), 'GUI Scale 3 applies immediately');
  await btn('GUI Scale: 3');
  check(await page.evaluate(() => window.bf.guiLayout().uDev === 3), 'GUI Scale 4 clamps to 3 on a 1366x768 screen');
  await btn('GUI Scale: 4 (fits 3)');
  check(await page.evaluate(() => window.bf.guiLayout().uDev === 2), 'GUI Scale wraps back to 2');
  await page.evaluate(() => { const b = [...document.querySelectorAll('.bf-menus .bf-btn')].find((x) => x.textContent.trim() === 'Done' && x.offsetParent); b.click(); });
  check(await page.evaluate(() => window.bf.menus.current()) === 'pause', 'Done returns to the pause menu');
  await btn('Save and Quit to Title');
  await page.waitForTimeout(50);
  check(await page.evaluate(() => window.bf.menus.current()) === 'title', 'Save and Quit returns to title');
  await page.evaluate(() => window.bf.menus.showControls(() => window.bf.menus.showTitle()));
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => window.bf.menus.current()) === 'title', 'Esc on controls goes back');
  const text = await page.evaluate(() => document.getElementById('ui').innerText + [...document.querySelectorAll('[data-tip]')].map((e) => e.dataset.tip).join(' '));
  check(!/minecraft/i.test(text) && !text.includes('—'), 'no forbidden words or em dashes in UI text');
  if (errors.length) console.log('console:', errors.join('\n'));
  check(errors.length === 0, 'interactions: no console errors');
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  if (!only || only === 'shots') {
    await shots(browser, 1366, 768, 2, 'a1366');
    await shots(browser, 1280, 720, 4, 'b1280s4');
    await shots(browser, 1920, 1080, 4, 'c1920');
  }
  if (!only || only === 'interact') await interactions(browser);
  await browser.close();
  console.log(failures ? `${failures} FAILURES` : 'ui: all checks passed');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
