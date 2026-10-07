// Icon sheet test: builds every block icon from generated textures in Chromium, checks the
// build time budget, that every item has a non-empty icon, and saves zoomed contact sheets.
// Usage: NODE_PATH=$(npm root -g) node tests/ws6-ui/icons.test.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const out = process.argv[2] || path.join(root, 'tests/ws6-ui/out');
fs.mkdirSync(out, { recursive: true });
const bundle = path.join(out, 'icons-bundle.js');
execSync(`npx esbuild ${path.join(__dirname, 'icons-entry.ts')} --bundle --format=iife --outfile=${bundle} --log-level=warning`, { cwd: root });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent('<html><body style="margin:0;background:#8b8b8b"></body></html>');
  await page.addScriptTag({ path: bundle });
  const res = await page.evaluate(() => window.runIcons());
  console.log(`textures ${res.tTex.toFixed(0)} ms, buildIcons ${res.tIcons.toFixed(0)} ms (render only ${res.tRender.toFixed(0)} ms), ${res.count} blocks`);
  // Decode the sheet and check every item cell has ink.
  const check = await page.evaluate(async ({ url, cols, size, count }) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const empty = [];
    for (let id = 1; id < count + 1; id++) {
      const cx = (id % cols) * size, cy = Math.floor(id / cols) * size;
      let ink = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (d[((cy + y) * c.width + cx + x) * 4 + 3] > 0) ink++;
      if (ink < 40) empty.push(id);
    }
    return { w: img.width, h: img.height, empty };
  }, res);
  console.log('sheet', check.w, 'x', check.h, 'decoded OK');
  const emptyNames = check.empty.filter((id) => id < res.count).map((id) => res.names[id]);
  console.log('empty icons:', emptyNames.join(', ') || 'none');
  // Contact sheets: all icons on a slot-grey background at GUI scale 2 and 3.
  for (const scale of [2, 3]) {
    await page.evaluate(({ scale, count, names }) => {
      document.body.innerHTML = '';
      const sheet = window.iconSheet();
      const wrap = document.createElement('div');
      wrap.style.cssText = `display:grid;grid-template-columns:repeat(${scale === 2 ? 36 : 28}, ${18 * scale}px);gap:0;padding:4px`;
      for (let id = 1; id < count; id++) {
        const s = document.createElement('div');
        s.style.cssText = `width:${18 * scale}px;height:${18 * scale}px;position:relative;background:#8b8b8b;box-shadow:inset ${scale}px ${scale}px 0 #373737, inset -${scale}px -${scale}px 0 #fff`;
        const i = document.createElement('div');
        i.style.cssText = `position:absolute;left:${scale}px;top:${scale}px;width:${16 * scale}px;height:${16 * scale}px`;
        sheet.apply(i, id);
        i.title = names[id];
        s.appendChild(i); wrap.appendChild(s);
      }
      document.body.appendChild(wrap);
    }, { scale, count: res.count, names: res.names });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, `icons-x${scale}.png`), fullPage: true });
  }
  if (errors.length) console.log('console:', errors.join('\n'));
  const fail = res.tIcons > 300 || emptyNames.length > 0;
  console.log(fail ? 'FAIL' : 'icons: all checks passed');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
