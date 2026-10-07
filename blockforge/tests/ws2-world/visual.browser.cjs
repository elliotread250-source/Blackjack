// Renders the WS2 lighting test scene with the real mesher/materials in headless Chromium and
// checks that remeshing only the dirty sections matches a full remesh pixel for pixel.
// Usage: NODE_PATH=$(npm root -g) node tests/ws2-world/visual.browser.cjs <visual.iife.js> <outDir> [--webgl1]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const script = fs.readFileSync(process.argv[2], 'utf8');
const outDir = process.argv[3];
const webgl1 = process.argv.includes('--webgl1');
fs.mkdirSync(outDir, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body></body><script>${script.replace(/<\/script/gi, '<\\/script')}</script></html>`;

(async () => {
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (webgl1) args.push('--disable-webgl2');
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  let failures = 0;
  page.on('pageerror', (e) => { console.log('pageerror', e.message); failures++; });
  page.on('console', (m) => { if (m.type() === 'error') console.log('console.error', m.text()); });
  await page.route('http://ws2-visual.test/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await page.goto('http://ws2-visual.test/');
  const init = await page.evaluate(() => window.__vis.init(12345));
  console.log(`init: spawn ${init.sx},${init.sz} ground ${init.gy}; 49 columns lit in ${init.ms.toFixed(0)} ms`, await page.evaluate(() => window.__vis.info()));
  const { sx, sz, gy } = init;
  const shot = async (name) => { await page.screenshot({ path: path.join(outDir, name) }); };

  const views = {
    overview: { x: sx - 14, y: gy + 14, z: sz + 26, yaw: -0.55, pitch: -0.42 },
    overhang: { x: sx + 10, y: gy + 2.6, z: sz + 12, yaw: 0, pitch: -0.08 },
    house: { x: sx - 4, y: gy + 2.6, z: sz - 4, yaw: Math.PI * 0.25, pitch: -0.25 },
    shelter: { x: sx - 6, y: gy + 2.2, z: sz + 18, yaw: 0, pitch: -0.05 },
  };
  const check = async (label, view, dayTime) => {
    const diff = await page.evaluate(([v, t]) => window.__vis.dirtyCheck({ ...v, dayTime: t }), [view, dayTime]);
    console.log(`  dirty-section check ${label}: ${diff} differing pixels`);
    if (diff) failures++;
  };

  for (let stage = 0; stage <= 2; stage++) {
    const n = await page.evaluate((s) => window.__vis.edit(s), stage);
    console.log(`stage ${stage}: remeshed ${n} dirty sections`);
    await check(`stage ${stage} overview noon`, views.overview, 0.25);
    await check(`stage ${stage} overview night`, views.overview, 0.75);
    await check(`stage ${stage} house`, views.house, 0.25);
    await check(`stage ${stage} overhang night`, views.overhang, 0.75);
    for (const [name, v] of Object.entries(views)) {
      for (const [tn, t] of [['noon', 0.25], ['night', 0.75]]) {
        await page.evaluate(([vv, tt]) => window.__vis.render({ ...vv, dayTime: tt }), [v, t]);
        await shot(`s${stage}-${name}-${tn}${webgl1 ? '-gl1' : ''}.png`);
      }
    }
  }
  await browser.close();
  console.log(failures ? `visual: ${failures} failure(s)` : 'visual: dirty-section checks passed');
  if (failures) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exit(1); });
