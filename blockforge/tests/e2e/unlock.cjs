// Private pack link: #pack=<key> unlocks packs/real.bin into Resource Packs (not switched on).
// Uses its own test key and test pack (served in place of the real file), never the real key.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/unlock.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'tests/e2e/out-unlock'));
fs.mkdirSync(outDir, { recursive: true });
let failures = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failures++; };

// test pack in the locked format: "BFPK", u32 header length, JSON header, 1024-byte RGBA tiles
const STONE = [12, 34, 56];
const tile = (r, g, b) => { const t = Buffer.alloc(1024); for (let i = 0; i < 1024; i += 4) { t[i] = r; t[i + 1] = g; t[i + 2] = b; t[i + 3] = 255; } return t; };
const names = ['dirt', 'stone'];
const head = Buffer.from(JSON.stringify({ v: 1, name: 'Test Pack', names }));
const plain = Buffer.concat([Buffer.from('BFPK'), Buffer.from(new Uint32Array([head.length]).buffer), head, tile(90, 60, 30), tile(...STONE)]);
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const c = crypto.createCipheriv('aes-256-gcm', key, iv);
const locked = Buffer.concat([iv, c.update(plain), c.final(), c.getAuthTag()]);
const KEY = key.toString('base64url');
const WRONG = crypto.randomBytes(32).toString('base64url');

(async () => {
  const server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8134' }, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 664 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  await context.route('**/packs/real.bin', (route) => route.fulfill({ status: 200, contentType: 'application/octet-stream', body: locked }));
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const boot = async (url) => {
    await page.goto(url);
    await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  };
  const notice = () => page.evaluate(() => { const n = document.querySelector('.bf-notice'); return n && n.style.opacity !== '0' ? n.textContent : ''; });
  const state = () => page.evaluate((STONE) => {
    const bf = window.blockforge;
    const solid = (t, c) => { for (let i = 0; i < 1024; i += 4) if (t[i] !== c[0] || t[i + 1] !== c[1] || t[i + 2] !== c[2]) return false; return true; };
    return {
      setting: bf.settings.resourcePack, atlas: bf.atlas.pack, hash: location.hash,
      key: localStorage.getItem('blockforge.packkey'), stone: bf.atlas.tiles.some((t) => t && solid(t, STONE)),
    };
  }, STONE);
  const packRowText = async () => {
    await page.evaluate(() => { const m = window.blockforge.menus; m.showOptions(() => m.showTitle()); m.showPacks(); });
    await page.waitForTimeout(300);
    return page.evaluate(() => document.querySelector('[data-pack="custom"]').textContent);
  };

  // wrong key: explained, nothing added
  await boot(`http://127.0.0.1:8134/#pack=${WRONG}`);
  await page.waitForFunction(() => /does not fit/.test(document.querySelector('.bf-notice')?.textContent || ''), null, { timeout: 15000 }).catch(() => undefined);
  check('a wrong key is explained', /does not fit/.test(await notice()), await notice());
  check('the key is taken out of the address bar', (await state()).hash === '');
  await page.evaluate(() => localStorage.removeItem('blockforge.packkey'));

  // the real flow
  await boot(`http://127.0.0.1:8134/#pack=${KEY}`);
  await page.waitForFunction(() => /added/.test(document.querySelector('.bf-notice')?.textContent || ''), null, { timeout: 15000 }).catch(() => undefined);
  check('the link adds the pack and says where it is', /Test Pack added.*Resource Packs/.test(await notice()), await notice());
  let s = await state();
  check('the pack is not switched on by itself', s.setting === 'default' && s.atlas === 'default', JSON.stringify(s));
  check('the key is gone from the address bar', s.hash === '');
  await page.screenshot({ path: path.join(outDir, '01-title-notice.png') });
  const rowText = await packRowText();
  check('Resource Packs lists it', /Test Pack/.test(rowText) && /2 textures/.test(rowText), rowText);
  await page.touchscreen.tap(...(await page.evaluate(() => { const r = document.querySelector('[data-pack="custom"]').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })));
  await page.waitForTimeout(800);
  s = await state();
  check('picking it switches the textures', s.setting === 'custom' && s.atlas === 'custom' && s.stone, JSON.stringify(s));
  await page.screenshot({ path: path.join(outDir, '02-packs-selected.png') });

  // stays after a plain reload
  await boot('http://127.0.0.1:8134/');
  await page.waitForTimeout(500);
  s = await state();
  check('still on after a reload without the link', s.atlas === 'custom' && s.stone, JSON.stringify(s));

  // storage cleared but the key remembered: the pack comes back and is selected again
  await page.evaluate(() => new Promise((r) => { const q = indexedDB.deleteDatabase('blockforge-packs'); q.onsuccess = q.onerror = q.onblocked = () => r(); }));
  await boot('http://127.0.0.1:8134/');
  await page.waitForFunction(() => window.blockforge.atlas.pack === 'custom', null, { timeout: 15000 }).catch(() => undefined);
  s = await state();
  check('a lost pack is restored from the remembered key', s.atlas === 'custom' && s.setting === 'custom' && s.stone, JSON.stringify(s));

  // Remove Import forgets the key for good
  await packRowText();
  await page.locator('.bf-screen:visible button', { hasText: 'Remove Import' }).first().tap();
  await page.waitForTimeout(400);
  s = await state();
  check('Remove Import forgets the key', s.key === null && s.setting === 'default', JSON.stringify(s));
  await boot('http://127.0.0.1:8134/');
  await page.waitForTimeout(1500);
  check('and the pack does not come back', !/Test Pack/.test(await packRowText()));

  check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  server.kill();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
