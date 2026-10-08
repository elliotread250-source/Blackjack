// Resource pack import on an emulated phone, with a small test pack this script writes itself.
// Runs twice: with the browser's own zip/image decoders, and with DecompressionStream and
// createImageBitmap removed (old iPhones and old Android Chrome), which forces the built-in
// decompressor and the <img> decoder.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/import.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const zlib = require('zlib');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-import'));
fs.mkdirSync(outDir, { recursive: true });
let failures = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failures++; };

// ---------------------------------------------------------------- tiny PNG + zip writers
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function zip(files) {
  const locals = [], centrals = [];
  let off = 0;
  for (const [name, data, store] of files) {
    const n = Buffer.from(name), comp = store ? data : zlib.deflateRawSync(data), method = store ? 0 : 8, crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(method, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(n.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(method, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, n, comp); centrals.push(ch, n);
    off += 30 + n.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, end]);
}
const solid = (r, g, b, a = 255, w = 16, h = 16) => { const p = new Uint8Array(w * h * 4); for (let i = 0; i < p.length; i += 4) { p[i] = r; p[i + 1] = g; p[i + 2] = b; p[i + 3] = a; } return p; };
// stone: a unique solid colour; dirt: 32x32 (scaled down); oak_planks: a 16x48 animation strip (top frame used)
const STONE = [12, 34, 56];
const strip = solid(200, 10, 10, 255, 16, 48); for (let i = 16 * 16 * 4; i < strip.length; i++) strip[i] = 0;
const files = [
  ['pack.mcmeta', Buffer.from('{"pack":{"pack_format":32,"description":"test"}}'), true],
  ['assets/minecraft/textures/block/stone.png', png(16, 16, solid(...STONE))],
  ['assets/minecraft/textures/block/dirt.png', png(32, 32, solid(90, 60, 30, 255, 32, 32))],
  ['assets/minecraft/textures/block/oak_planks.png', png(16, 48, strip), true],
  ['assets/minecraft/textures/block/grass_block_top.png', png(16, 16, solid(128, 128, 128))],
  ['assets/minecraft/textures/block/grass_block_side.png', png(16, 16, solid(90, 60, 30))],
  ['assets/minecraft/textures/block/grass_block_side_overlay.png', png(16, 16, solid(0, 0, 0, 0))],
];
const zipPath = path.join(outDir, 'test-pack.zip');
fs.writeFileSync(zipPath, zip(files));

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8133' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const legacy of [false, true]) {
    const tag = legacy ? 'legacy decoders' : 'native decoders';
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
    });
    if (legacy) await context.addInitScript(() => { delete window.DecompressionStream; delete window.createImageBitmap; });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
    await page.goto('http://127.0.0.1:8133/');
    await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
    if (legacy) check(`${tag}: APIs really removed`, await page.evaluate(() => typeof DecompressionStream === 'undefined' && typeof createImageBitmap === 'undefined'));
    await page.evaluate(() => window.blockforge.menus.showOptions(() => window.blockforge.menus.showTitle()));
    await page.locator('.bf-screen:visible button', { hasText: 'Resource Packs' }).first().tap();
    await page.waitForTimeout(300);
    await page.locator('input[type=file]').setInputFiles(zipPath);
    await page.waitForFunction(() => /Imported \d+ textures|No block|None of|Damaged|Unsupported|not a zip/.test(document.body.innerText), null, { timeout: 60000 });
    const status = await page.evaluate(() => (document.body.innerText.match(/(Imported|No block|None of|Damaged|Unsupported)[^\n]*/) || [''])[0]);
    check(`${tag}: import finishes`, /^Imported [4-9] textures/.test(status), status);
    await page.waitForTimeout(800);
    const r = await page.evaluate((STONE) => {
      const bf = window.blockforge, tiles = bf.atlas.tiles;
      const isSolid = (t, c) => { for (let i = 0; i < 1024; i += 4) if (t[i] !== c[0] || t[i + 1] !== c[1] || t[i + 2] !== c[2] || t[i + 3] !== 255) return false; return true; };
      return {
        pack: bf.settings.resourcePack, atlasPack: bf.atlas.pack,
        stone: tiles.some((t) => t && isSolid(t, STONE)),
        dirt: tiles.some((t) => t && isSolid(t, [90, 60, 30])),
        planks: tiles.some((t) => t && isSolid(t, [200, 10, 10])),
      };
    }, STONE);
    check(`${tag}: pack selected and atlas switched`, r.pack === 'custom' && r.atlasPack === 'custom', JSON.stringify(r));
    check(`${tag}: stone texture applied exactly`, r.stone);
    check(`${tag}: 32x32 texture scaled to 16x16`, r.dirt);
    check(`${tag}: animated strip uses its top frame`, r.planks);
    await page.screenshot({ path: path.join(outDir, `packs-${legacy ? 'legacy' : 'native'}.png`) });
    // persists across a reload
    await page.reload();
    await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
    await page.waitForTimeout(500);
    check(`${tag}: still on after reload`, (await page.evaluate(() => window.blockforge.atlas.pack)) === 'custom');
    check(`${tag}: no console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  // ---------------------------------------------------------------- storage trouble on phones
  // Init script: IndexedDB faults for the pack database, switched by flags in localStorage so
  // they survive reloads: 'abort' aborts the save, 'hang' never answers, 'failOnce' throws once.
  const faults = () => {
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (name, ver) => {
      const mode = name === 'blockforge-packs' ? localStorage.getItem('bf.test.idb') : null;
      if (mode === 'hang') return {};
      if (mode === 'failOnce') {
        localStorage.removeItem('bf.test.idb');
        const req = { error: new DOMException('Connection to Indexed Database server lost', 'UnknownError') };
        setTimeout(() => req.onerror && req.onerror(new Event('error')), 5);
        return req;
      }
      return open(name, ver);
    };
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...a) {
      const r = put.apply(this, a);
      if (this.name === 'packs' && localStorage.getItem('bf.test.idb') === 'abort') this.transaction.abort();
      return r;
    };
  };
  const phone = (w = 750, h = 342) => browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  const boot = async (page) => {
    await page.goto('http://127.0.0.1:8133/');
    await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  };
  const openPacks = async (page) => {
    await page.evaluate(() => window.blockforge.menus.showOptions(() => window.blockforge.menus.showTitle()));
    await page.locator('.bf-screen:visible button', { hasText: 'Resource Packs' }).first().tap();
    await page.waitForTimeout(300);
  };
  const statusText = (page) => page.evaluate(() => {
    const s = Array.from(document.querySelectorAll('.bf-screen .bf-c-gray')).find((e) => e.offsetParent && /Import|Reading|Bedrock|visit|No block/.test(e.textContent));
    if (!s) return { text: '', right: 0, vw: innerWidth };
    return { text: s.textContent, right: s.getBoundingClientRect().right, vw: innerWidth };
  });

  for (const mode of ['abort', 'hang']) {
    const context = await phone();
    await context.addInitScript(faults);
    const page = await context.newPage();
    await boot(page);
    await page.evaluate((m) => localStorage.setItem('bf.test.idb', m), mode);
    await openPacks(page);
    await page.locator('input[type=file]').setInputFiles(zipPath);
    await page.waitForFunction(() => window.blockforge.atlas.pack === 'custom', null, { timeout: 30000 }).catch(() => undefined);
    check(`save ${mode}: the pack is still applied`, (await page.evaluate(() => window.blockforge.atlas.pack)) === 'custom');
    await page.waitForFunction(() => /this visit only/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => undefined);
    const st = await statusText(page);
    check(`save ${mode}: the player is told it was not saved`, /this visit only/.test(st.text), st.text.replace(/\n/g, ' / '));
    check(`save ${mode}: Import is usable again`, await page.locator('.bf-screen:visible button', { hasText: 'Import Pack' }).first().isEnabled());
    await page.screenshot({ path: path.join(outDir, `save-${mode}.png`) });
    await context.close();
  }

  {
    // a storage error at startup must not switch the imported pack off
    const context = await phone();
    await context.addInitScript(faults);
    const page = await context.newPage();
    await boot(page);
    await openPacks(page);
    await page.locator('input[type=file]').setInputFiles(zipPath);
    await page.waitForFunction(() => /Imported \d+ textures/.test(document.body.innerText), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => localStorage.setItem('bf.test.idb', 'failOnce'));
    await boot(page);
    await page.waitForFunction(() => window.blockforge.atlas.pack === 'custom', null, { timeout: 15000 }).catch(() => undefined);
    const r = await page.evaluate(() => ({ atlas: window.blockforge.atlas.pack, setting: window.blockforge.settings.resourcePack, saved: JSON.parse(localStorage.getItem('blockforge.settings.v1') || '{}').resourcePack }));
    check('read error at startup: pack comes back after a retry', r.atlas === 'custom' && r.setting === 'custom' && r.saved === 'custom', JSON.stringify(r));
    await context.close();
  }

  {
    // a hung pack database must not delay the start when no imported pack is selected
    const context = await phone();
    await context.addInitScript(faults);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8133/');
    await page.evaluate(() => localStorage.setItem('bf.test.idb', 'hang'));
    const t0 = Date.now();
    await boot(page);
    const ms = Date.now() - t0;
    check('hung pack storage does not hold up the start', ms < 4500, `${ms} ms`);
    await context.close();
  }

  {
    // Bedrock packs: explained, and every message fits on a portrait phone
    const bedrock = path.join(outDir, 'bedrock-pack.mcpack');
    fs.writeFileSync(bedrock, zip([
      ['manifest.json', Buffer.from('{"format_version":2,"header":{"name":"test"}}'), true],
      ['textures/blocks/stone.png', png(16, 16, solid(1, 2, 3))],
    ]));
    const context = await phone(390, 664);
    const page = await context.newPage();
    await boot(page);
    await openPacks(page);
    check('the file picker offers .mcpack files', /\.mcpack/.test(await page.locator('input[type=file]').getAttribute('accept')));
    await page.locator('input[type=file]').setInputFiles(bedrock);
    await page.waitForFunction(() => /Bedrock/.test(document.body.innerText), null, { timeout: 15000 }).catch(() => undefined);
    const st = await statusText(page);
    check('a Bedrock pack is explained', /Bedrock/.test(st.text), st.text.replace(/\n/g, ' / '));
    check('the message fits on a portrait phone', st.right > 0 && st.right <= st.vw + 0.5, `right ${Math.round(st.right)} of ${st.vw}`);
    await page.screenshot({ path: path.join(outDir, 'bedrock-portrait.png') });
    await context.close();
  }

  {
    // after a finger scroll in the list, the very next tap must work
    const context = await phone(750, 342);
    const page = await context.newPage();
    await boot(page);
    await openPacks(page);
    const cdp = await context.newCDPSession(page);
    const list = await page.evaluate(() => { const r = Array.from(document.querySelectorAll('.bf-list')).find((e) => e.offsetParent).getBoundingClientRect(); return { x: r.x + r.width / 2, top: r.top, bottom: r.bottom }; });
    const y0 = list.bottom - 20, y1 = list.top + 20;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: list.x, y: y0, id: 1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: list.x, y: y0 + ((y1 - y0) * i) / 8, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(300);
    const row = await page.evaluate(() => { const r = document.querySelector('[data-pack="custom"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, vh: innerHeight }; });
    check('the imported-pack row is on screen after scrolling', row.y > 0 && row.y < row.vh, JSON.stringify(row));
    const chooser = page.waitForEvent('filechooser', { timeout: 3000 }).then(() => true, () => false);
    await page.touchscreen.tap(row.x, row.y);
    check('first tap after a scroll opens the file picker', await chooser);
    await context.close();
  }

  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
