// gen.worker.ts protocol test. Bundles the worker exactly like build.mjs (iife, minified)
// and runs it (1) in node with a fake `self`, (2) in headless Chromium as a blob-URL Worker,
// the way ChunkManager starts it. Run: NODE_PATH=$(npm root -g) node tests/ws1-gen/worker.test.cjs
const path = require('path');
const assert = require('assert');
const root = path.resolve(__dirname, '../..');
const esbuild = require(path.join(root, 'node_modules/esbuild'));

(async () => {
  const r = await esbuild.build({
    entryPoints: [path.join(root, 'src/workers/gen.worker.ts')], bundle: true, write: false,
    format: 'iife', minify: true, target: 'es2019',
  });
  const code = r.outputFiles[0].text;
  console.log(`worker bundle: ${(code.length / 1024).toFixed(1)} KB`);
  assert.ok(!/document|window\./.test(code), 'worker must not touch the DOM');

  // ---- 1. node, fake worker scope
  const sent = [];
  const fakeSelf = { onmessage: null, postMessage: (msg, transfer) => sent.push({ msg, transfer }) };
  new Function('self', code)(fakeSelf);
  assert.equal(typeof fakeSelf.onmessage, 'function');
  // a 'gen' that arrives before 'init' is queued, then answered after init
  fakeSelf.onmessage({ data: { type: 'gen', id: 7, cx: 2, cz: -3 } });
  assert.equal(sent.length, 0);
  fakeSelf.onmessage({ data: { type: 'init', seed: 12345 } });
  fakeSelf.onmessage({ data: { type: 'gen', id: 8, cx: 0, cz: 0 } });
  assert.equal(sent.length, 2);
  const m = sent[0].msg;
  assert.equal(m.type, 'chunk'); assert.equal(m.id, 7); assert.equal(m.cx, 2); assert.equal(m.cz, -3);
  assert.ok(m.blocks instanceof Uint16Array && m.blocks.length === 65536);
  assert.ok(m.biome instanceof Uint8Array && m.biome.length === 256);
  assert.ok(m.tint instanceof Uint8Array && m.tint.length === 2304);
  assert.deepEqual(sent[0].transfer, [m.blocks.buffer, m.biome.buffer, m.tint.buffer]);
  assert.equal(sent[1].msg.id, 8);
  console.log('node fake-worker: ok');

  // ---- 2. real browser worker (WebGL not needed)
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { console.log('playwright not available, skipping browser part'); return; }
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><title>gen worker</title>');
    const res = await page.evaluate(async (src) => {
      const url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      const w = new Worker(url);
      const out = [];
      const done = new Promise((resolve, reject) => {
        w.onerror = (e) => reject(new Error(e.message));
        w.onmessage = (e) => { out.push(e.data); if (out.length === 6) resolve(); };
      });
      w.postMessage({ type: 'init', seed: 12345 });
      const t0 = performance.now();
      for (let i = 0; i < 6; i++) w.postMessage({ type: 'gen', id: i, cx: i - 3, cz: 1 });
      await done;
      const ms = (performance.now() - t0) / 6;
      w.terminate();
      return out.map((d) => ({
        type: d.type, id: d.id, cx: d.cx, cz: d.cz,
        blocks: d.blocks && d.blocks.constructor.name, blen: d.blocks && d.blocks.length,
        nonAir: d.blocks ? d.blocks.reduce((s, v) => s + (v ? 1 : 0), 0) : 0,
        sum: d.blocks ? d.blocks.reduce((s, v, i) => (s + v * (i % 251 + 1)) % 1000000007, 0) : 0,
        biome: d.biome && d.biome.length, tint: d.tint && d.tint.length, ms,
      }));
    }, code);
    assert.equal(res.length, 6);
    // the browser result must be byte-identical to the node result for the same chunk
    const nodeChunk = (() => {
      const s2 = [];
      const fs2 = { onmessage: null, postMessage: (msg) => s2.push(msg) };
      new Function('self', code)(fs2);
      fs2.onmessage({ data: { type: 'init', seed: 12345 } });
      fs2.onmessage({ data: { type: 'gen', id: 0, cx: -3, cz: 1 } });
      return s2[0].blocks.reduce((s, v, i) => (s + v * (i % 251 + 1)) % 1000000007, 0);
    })();
    res.forEach((d, i) => {
      assert.equal(d.type, 'chunk'); assert.equal(d.id, i); assert.equal(d.cx, i - 3); assert.equal(d.cz, 1);
      assert.equal(d.blocks, 'Uint16Array'); assert.equal(d.blen, 65536); assert.equal(d.biome, 256); assert.equal(d.tint, 2304);
      assert.ok(d.nonAir > 10000);
    });
    assert.equal(res[0].sum, nodeChunk, 'browser and node generate identical terrain');
    console.log(`browser worker: ok, ${res[0].ms.toFixed(1)} ms per chunk including messaging`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
