// Drives the in-page storage tests in headless Chromium.
// Usage: NODE_PATH=$(npm root -g) node tests/ws2-world/storage.browser.cjs <storage.iife.js>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const script = fs.readFileSync(process.argv[2], 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><script>${script.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
const ORIGIN = 'http://ws2-storage.test';
let failures = 0;

function report(label, r) {
  console.log(`${label}  [mode: ${r.mode}]`);
  for (const l of r.log) console.log('    ' + l);
  failures += r.fails;
}

async function page(ctx, init) {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { console.log('    pageerror', e.message); failures++; });
  p.on('console', (m) => { if (m.type() === 'error') console.log('    console.error', m.text()); });
  if (init) await p.addInitScript(init);
  await p.route(ORIGIN + '/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.goto(ORIGIN + '/');
  return p;
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const t0 = Date.now();

  // 1. Real IndexedDB, then a fresh page on the same origin (reload persistence), then delete.
  const ctx = await browser.newContext();
  let p = await page(ctx);
  let r = await p.evaluate(() => window.__ws2.run('basics'));
  report('IndexedDB basics', r);
  if (r.mode !== 'indexeddb') { console.log('    FAIL expected IndexedDB mode'); failures++; }
  r = await p.evaluate(() => window.__ws2.run('remap'));
  report('IndexedDB palette remap', r);
  await p.close();
  p = await page(ctx);
  r = await p.evaluate(() => window.__ws2.run('persisted'));
  report('IndexedDB after reload + delete', r);
  const dbNames = await p.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : ['blockforge']));
  if (!dbNames.includes('blockforge')) { console.log('    FAIL database name'); failures++; }
  const stores = await p.evaluate(() => new Promise((res) => { const q = indexedDB.open('blockforge'); q.onsuccess = () => { res(Array.from(q.result.objectStoreNames)); q.result.close(); }; }));
  console.log(`    info database 'blockforge' stores: ${stores.join(', ')}`);
  if (stores.join(',') !== 'chunks,worlds') { console.log('    FAIL object stores'); failures++; }
  await ctx.close();

  // 2. indexedDB missing entirely.
  const fallbacks = [
    ['indexedDB missing', () => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); }],
    ['indexedDB getter throws SecurityError', () => { Object.defineProperty(window, 'indexedDB', { get() { throw new DOMException('denied', 'SecurityError'); }, configurable: true }); }],
    ['indexedDB.open throws', () => { IDBFactory.prototype.open = function () { throw new DOMException('blocked by policy', 'InvalidStateError'); }; }],
    ['indexedDB.open fails asynchronously', () => {
      IDBFactory.prototype.open = function () {
        const req = { result: null, error: new DOMException('quota', 'UnknownError') };
        setTimeout(() => req.onerror && req.onerror({ preventDefault() {} }), 10);
        return req;
      };
    }],
    ['indexedDB.open never answers (5 s timeout)', () => { IDBFactory.prototype.open = function () { return {}; }; }],
  ];
  for (const [label, init] of fallbacks) {
    const c = await browser.newContext();
    const fp = await page(c, init);
    const fr = await fp.evaluate(() => window.__ws2.run('fallback'));
    report(`Fallback: ${label}`, fr);
    if (fr.mode !== 'memory') { console.log('    FAIL expected memory mode'); failures++; }
    await c.close();
  }

  // 3. Writes that IndexedDB rejects mid-session are kept in memory.
  {
    const c = await browser.newContext();
    const fp = await page(c, () => {
      const orig = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (v, k) { if (window.__failPuts) throw new DOMException('quota exceeded', 'QuotaExceededError'); return orig.call(this, v, k); };
    });
    await fp.evaluate(() => { window.__failPuts = true; });
    const fr = await fp.evaluate(() => window.__ws2.run('fallback'));
    report('IndexedDB put failing (quota): data stays available this session', fr);
    await c.close();
  }

  // 4. file:// page (offline single-file build). Works with whatever the browser allows.
  {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ws2-'));
    const file = path.join(dir, 'storage.html');
    fs.writeFileSync(file, html);
    const c = await browser.newContext();
    const fp = await c.newPage();
    fp.on('pageerror', (e) => { console.log('    pageerror', e.message); failures++; });
    await fp.goto('file://' + file);
    const fr = await fp.evaluate(() => window.__ws2.run('fallback'));
    report('file:// page', fr);
    await c.close();
  }

  // 5. about:blank with inline content (opaque origin).
  {
    const c = await browser.newContext();
    const fp = await c.newPage();
    fp.on('pageerror', (e) => { console.log('    pageerror', e.message); failures++; });
    await fp.setContent(html);
    const fr = await fp.evaluate(() => window.__ws2.run('fallback'));
    report('about:blank (setContent)', fr);
    await c.close();
  }

  await browser.close();
  console.log(`storage: ${failures ? failures + ' failure(s)' : 'all passed'} in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (failures) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
