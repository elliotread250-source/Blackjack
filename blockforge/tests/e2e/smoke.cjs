// End-to-end smoke test: boots the built game in headless Chromium, creates a world,
// flies the camera to a few viewpoints and saves screenshots.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/smoke.cjs [outDir] [--webgl1] [--file] [--preset=low|medium|high]
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const outDir = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(root, 'tests/e2e/out'));
const webgl1 = process.argv.includes('--webgl1');
const useFile = process.argv.includes('--file');
const presetArg = (process.argv.find((a) => a.startsWith('--preset=')) || '--preset=low').split('=')[1];
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  let server = null;
  let url;
  if (useFile) {
    url = 'file://' + path.join(root, 'dist/blockforge.html');
  } else {
    server = spawn('node', ['server.js'], { cwd: root, env: { ...process.env, PORT: '8123' }, stdio: 'pipe' });
    await new Promise((r) => setTimeout(r, 800));
    url = 'http://127.0.0.1:8123/';
  }
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (webgl1) args.push('--disable-webgl2');
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  const t0 = Date.now();
  await page.goto(url);
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  console.log('booted in', Date.now() - t0, 'ms');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '01-title.png') });

  await page.evaluate((preset) => {
    const bf = window.blockforge;
    if (bf.applyPreset) bf.applyPreset(preset);
  }, presetArg);
  const t1 = Date.now();
  await page.evaluate(() => window.blockforge.handlers.createWorld('Smoke Test', 'blockforge'));
  console.log('world ready in', Date.now() - t1, 'ms');
  await page.evaluate(() => window.blockforge.debug.play());
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, '02-spawn.png') });

  const shots = [
    { name: '03-look-down', pitch: -0.5, yaw: 0.8 },
    { name: '04-aerial', dy: 30, pitch: -0.45, yaw: 2.2 },
    { name: '05-sunset', dy: 20, pitch: -0.2, yaw: 3.6, time: 'sunset' },
    { name: '06-night', dy: 20, pitch: -0.1, yaw: 4.2, time: 'midnight' },
    { name: '07-noon-far', dy: 60, pitch: -0.35, yaw: 5.5, time: 'noon' },
  ];
  for (const s of shots) {
    await page.evaluate((s) => {
      const g = window.blockforge.game;
      const p = g.player;
      if (s.dy) { p.y += s.dy; p.flying = true; p.vy = 0; }
      p.yaw = s.yaw; p.pitch = s.pitch;
      if (s.time) g.setTimeMode(s.time);
    }, s);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(outDir, s.name + '.png') });
  }
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const start = performance.now();
    const f = () => { n++; if (performance.now() - start < 3000) requestAnimationFrame(f); else res(n / ((performance.now() - start) / 1000)); };
    requestAnimationFrame(f);
  }));
  const info = await page.evaluate(() => {
    const bf = window.blockforge;
    return { renderer: bf.renderer.info, stats: bf.renderer.stats(), chunks: bf.game.chunks && bf.game.chunks.stats };
  });
  console.log('fps (SwiftShader, CPU rendering):', fps.toFixed(1));
  console.log(JSON.stringify(info));
  // Inventory + debug overlay screenshots
  await page.evaluate(() => { const bf = window.blockforge; bf.hud.setDebugVisible(true); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '08-debug.png') });
  await page.evaluate(() => { const bf = window.blockforge; bf.hud.setDebugVisible(false); bf.inventory.open(); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, '09-inventory.png') });
  await page.evaluate(() => { const bf = window.blockforge; bf.inventory.close(); bf.game.pause(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, '10-pause.png') });

  console.log(errors.length ? 'CONSOLE:\n' + errors.slice(0, 40).join('\n') : 'no console errors');
  await browser.close();
  if (server) server.kill();
})().catch((e) => { console.error(e); process.exit(1); });
