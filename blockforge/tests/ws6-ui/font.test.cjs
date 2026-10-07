// Pixel font test: builds the TTF in Chromium, checks it passes the OTS sanitizer,
// that document.fonts.check() is true, and that rendered glyphs are pixel crisp.
// Usage: NODE_PATH=$(npm root -g) node tests/ws6-ui/font.test.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const root = path.resolve(__dirname, '../..');
const out = process.argv[2] || path.join(root, 'tests/ws6-ui/out');
fs.mkdirSync(out, { recursive: true });
const bundle = path.join(out, 'font-bundle.js');
execSync(`npx esbuild ${path.join(__dirname, 'font-entry.ts')} --bundle --format=iife --outfile=${bundle} --log-level=warning`, { cwd: root });

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 300 } });
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  await page.setContent('<html><body style="margin:0;background:#202020"></body></html>');
  await page.addScriptTag({ path: bundle });
  const res = await page.evaluate(async () => {
    const t0 = performance.now();
    const bin = window.bfFont.buildFontBinary();
    const tBuild = performance.now() - t0;
    await window.bfFont.loadPixelFont();
    const ok = document.fonts.check('16px BlockForge');
    // Direct FontFace check that throws on sanitizer rejection.
    let direct = 'ok';
    try { await new FontFace('BFDirect', bin).load(); } catch (e) { direct = String(e); }
    const lines = ['The quick brown fox jumps over the lazy dog.', 'THE QUICK BROWN FOX: 0123456789 !?#$%&*()[]{}<>/\\|', 'Singleplayer  Options...  Render Distance: 8 chunks'];
    const scales = [2, 3];
    const results = [];
    for (const s of scales) {
      const c = document.createElement('canvas');
      c.width = 880; c.height = 3 * 9 * s + 8;
      const g = c.getContext('2d');
      g.fillStyle = '#202020'; g.fillRect(0, 0, c.width, c.height);
      g.font = `${8 * s}px BlockForge`;
      g.textBaseline = 'alphabetic';
      g.fillStyle = '#ffffff';
      lines.forEach((l, i) => g.fillText(l, 4, 4 + (i * 9 + 8) * s));
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let ink = 0, partial = 0;
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i];
        if (v === 255) ink++; else if (v !== 0x20) partial++;
      }
      results.push({ scale: s, ink, partial, width: g.measureText(lines[0]).width });
      c.style.display = 'block';
      document.body.appendChild(c);
    }
    // DOM text with a shadow, like the UI uses.
    const div = document.createElement('div');
    div.style.cssText = 'font:16px BlockForge;color:#fff;text-shadow:2px 2px 0 #3f3f3f;padding:4px;line-height:18px';
    div.textContent = 'BlockForge pixel font: Save and Quit to Title … ';
    document.body.appendChild(div);
    return { tBuild, bytes: bin.byteLength, ok, direct, results, expectW: window.bfFont.textWidth(lines[0]) };
  });
  await page.screenshot({ path: path.join(out, 'font.png') });
  console.log(JSON.stringify(res, null, 1));
  let fail = 0;
  if (!res.ok) { console.log('FAIL fonts.check false'); fail++; }
  if (res.direct !== 'ok') { console.log('FAIL FontFace rejected:', res.direct); fail++; }
  for (const r of res.results) {
    if (r.partial > 0) { console.log(`FAIL scale ${r.scale}: ${r.partial} anti-aliased pixels`); fail++; }
    if (Math.round(r.width) !== (res.expectW + 1) * r.scale) { console.log(`FAIL scale ${r.scale}: width ${r.width} != ${(res.expectW + 1) * r.scale}`); fail++; }
  }
  if (logs.length) console.log('console:', logs.join('\n'));
  console.log(fail ? `${fail} FAILURES` : 'font: all checks passed');
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
