// Shader pack test: renders the same viewpoints (spawn, a lake, a sunset towards the sun, night
// with torches, a cave mouth) with each shader pack and saves canvas screenshots taken through
// Renderer.screenshot() (so post effects are included). Also switches packs back and forth at
// runtime and reports draw calls / triangles per pack at render distance 4 and 8.
// Usage: NODE_PATH=$(npm root -g) node tests/e2e/shaders.cjs [outDir] [--webgl1] [--html=path]
//        [--packs=off,fancy,ultra] [--views=spawn,lake,sunset,night,cave] [--no-stats] [--nodepth]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '../..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const a = argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const outDir = path.resolve(argv[0] && !argv[0].startsWith('--') ? argv[0] : path.join(root, 'tests/e2e/out-shaders'));
const webgl1 = argv.includes('--webgl1');
const html = path.resolve(opt('html', path.join(root, 'dist/blockforge.html')));
const packs = opt('packs', 'off,fancy,ultra').split(',');
const views = opt('views', 'spawn,lake,sunset,night,cave').split(',');
const rd = Number(opt('rd', '6'));
fs.mkdirSync(outDir, { recursive: true });

let failures = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
  if (!ok) failures++;
}

(async () => {
  const args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
  if (webgl1) args.push('--disable-webgl2');
  const browser = await chromium.launch({ args });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto('file://' + html);
  await page.waitForFunction(() => window.blockforge && window.blockforge.game, null, { timeout: 60000 });
  if (argv.includes('--nodepth')) await page.evaluate(() => { window.blockforge.renderer.debugNoDepthTexture = true; });
  const frames = (n) => page.evaluate((n) => new Promise((r) => { let i = 0; const f = () => (++i >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const setPack = (p, extra = {}) => page.evaluate(([p, extra]) => {
    const bf = window.blockforge, s = bf.settings;
    s.shaderPack = p; s.shadows = p !== 'off'; s.waving = p !== 'off';
    Object.assign(s, extra);
    bf.handlers.settingsChanged(s);
  }, [p, extra]);

  await setPack('off', { renderDistance: rd, fancyLeaves: true, shadowQuality: 2048 });
  await page.evaluate(() => window.blockforge.handlers.createWorld('Shaders', 'blockforge'));
  await page.evaluate(() => { const bf = window.blockforge; bf.debug.play(); bf.input.virtualLock = true; bf.hud.setVisible(false); });
  const info = await page.evaluate(() => window.blockforge.renderer.info);
  console.log('renderer', JSON.stringify(info));

  const waitReady = async (x, z, r) => {
    for (let i = 0; i < 240; i++) {
      const ok = await page.evaluate(([x, z, r]) => window.blockforge.game.chunks.areaReady(x, z, r), [x, z, r]);
      if (ok) return true;
      await page.waitForTimeout(250);
    }
    return false;
  };

  // ---------------------------------------------------------------- viewpoints
  const spawn = await page.evaluate(() => { const p = window.blockforge.game.player; return { x: p.x, y: p.y, z: p.z }; });
  await waitReady(spawn.x, spawn.z, Math.min(rd, 4));
  const V = await page.evaluate(([sx, sz]) => {
    const bf = window.blockforge, w = bf.game.world, ID = bf.ID;
    const top = (x, z) => w.topY(x, z);
    const idAt = (x, y, z) => w.get(x, y, z) & 1023;
    const isWater = (x, z) => { const t = top(x, z); return t === 62 && idAt(x, 62, z) === ID.water; };
    const out = {};
    // lake / ocean: nearest sea-level water with a long water run and land beyond it
    let best = null;
    for (let r = 2; r < 90 && !best; r += 2) {
      for (let a = 0; a < 32 && !best; a++) {
        const x = Math.floor(sx + Math.cos(a / 32 * Math.PI * 2) * r), z = Math.floor(sz + Math.sin(a / 32 * Math.PI * 2) * r);
        if (!isWater(x, z)) continue;
        // land behind the camera spot: step back towards land so we stand at the shore
        for (let d = 0; d < 16 && !best; d++) {
          const ang = d / 16 * Math.PI * 2, dx = Math.cos(ang), dz = Math.sin(ang);
          let run = 0;
          while (run < 70 && isWater(Math.floor(x + dx * run), Math.floor(z + dz * run))) run++;
          if (run >= 14 && run < 70) best = { x: x + 0.5, z: z + 0.5, dx, dz, run };
        }
      }
    }
    if (best) {
      const yaw = Math.atan2(-best.dx, -best.dz);
      out.lake = { x: best.x - best.dx * 2, y: 66.5, z: best.z - best.dz * 2, yaw, pitch: -0.18, time: 0.16 };
    } else out.lake = { x: sx, y: 90, z: sz, yaw: 0.5, pitch: -0.3, time: 0.16 };
    const gy = top(Math.floor(sx), Math.floor(sz));
    out.spawn = { x: sx, y: gy + 2.62, z: sz, yaw: 2.4, pitch: -0.22, time: 0.13 };
    // sunset: a bit above the ground at spawn, looking straight at the sun
    out.sunset = { x: sx, y: gy + 4.6, z: sz, time: 0.475, lookSun: true };
    // night: a ring of torches + a lantern and glowstone around a point near spawn
    const nx = Math.floor(sx) + 6, nz = Math.floor(sz);
    const ny = top(nx, nz) + 1;
    const ring = [[0, 0], [3, 2], [-3, 2], [2, -3], [-2, -3], [5, -1], [-5, -1]];
    for (const [dx, dz] of ring) {
      const x = nx + dx, z = nz + dz;
      const t = top(x, z);
      const surf = idAt(x, t, z);
      if (bf.BLOCKS[surf] && bf.BLOCKS[surf].shape && bf.BLOCKS[surf].shape !== 'cube') { w.set(x, t, z, 0); }
      const tt = top(x, z);
      w.set(x, tt + 1, z, ID.torch);
    }
    w.set(nx, top(nx, nz + 4) + 1, nz + 4, ID.glowstone);
    out.night = { x: nx + 0.5, y: ny + 4.5, z: nz - 9.5, yaw: Math.PI, pitch: -0.3, time: 0.75 };
    // cave mouth: a stone hill with a tunnel into it, a torch deep inside
    const cx = Math.floor(sx) - 14, cz = Math.floor(sz) - 4;
    let base = 999;
    for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) base = Math.min(base, top(cx + dx, cz + dz));
    base = Math.max(base, 63);
    for (let dx = -6; dx <= 6; dx++) for (let dz = -6; dz <= 6; dz++) {
      const h = 9 - Math.floor(Math.max(Math.abs(dx), Math.abs(dz)) * 0.9) - ((dx * 7 + dz * 13) & 1);
      for (let y = base - 3; y <= base + h; y++) w.set(cx + dx, y, cz + dz, y >= base + h - 0 ? ID.grass_block : y > base + h - 3 ? ID.dirt : ID.stone);
    }
    for (let dz = -7; dz <= 3; dz++) for (let dx = -1; dx <= 1; dx++) for (let y = base + 1; y <= base + 4; y++) {
      if (dz === 3 && Math.abs(dx) === 1 && y === base + 4) continue;
      w.set(cx + dx, y, cz + dz, 0);
    }
    for (let dz = -7; dz <= 6; dz++) for (let dx = -1; dx <= 1; dx++) w.set(cx + dx, base, cz + dz, ID.stone);
    w.set(cx + 1, base + 1, cz - 3, ID.torch);
    out.cave = { x: cx + 0.5, y: base + 3.2, z: cz + 13.5, yaw: 0, pitch: -0.08, time: 0.14 };
    return out;
  }, [spawn.x, spawn.z]);
  console.log('views', JSON.stringify(V));

  const goto = async (v) => {
    await page.evaluate((v) => {
      const bf = window.blockforge, g = bf.game;
      g.setTimeMode('noon');
      g.dayTime = v.time;
      let yaw = v.yaw || 0, pitch = v.pitch || 0;
      if (v.lookSun) {
        // the sun direction for this time (sky.ts: tilt 0.38 rad towards +z)
        const a = v.time * Math.PI * 2, T = 0.38;
        let dx = Math.cos(a), dy = Math.sin(a) * Math.cos(T), dz = Math.sin(a) * Math.sin(T);
        const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
        pitch = Math.asin(dy) + 0.04; yaw = Math.atan2(-dx, -dz) - 0.25;
      }
      g.player.restore({ x: v.x, y: v.y - 1.62, z: v.z, yaw, pitch, flying: true });
    }, v);
    await waitReady(v.x, v.z, Math.min(rd, 4));
    await frames(6);
  };
  const shot = async (file) => {
    const b64 = await page.evaluate(async () => {
      const blob = await window.blockforge.renderer.screenshot();
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      return btoa(s);
    });
    fs.writeFileSync(path.join(outDir, file), Buffer.from(b64, 'base64'));
    return Buffer.from(b64, 'base64').length;
  };
  const sample = () => page.evaluate(async () => {
    // average brightness of a rendered frame (through the screenshot path, since the canvas
    // buffer is not preserved between frames): catches black screens
    const blob = await window.blockforge.renderer.screenshot();
    const bmp = await createImageBitmap(blob);
    const t = document.createElement('canvas'); t.width = 64; t.height = 36;
    const x = t.getContext('2d'); x.drawImage(bmp, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data; let s = 0;
    for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2];
    return s / (d.length / 4) / 3;
  });

  const tag = webgl1 ? 'gl1' : 'gl2';
  for (const vname of views) {
    const v = V[vname];
    if (!v) continue;
    await goto(v);
    for (const p of packs) {
      await setPack(p);
      await frames(4);
      await shot(`${vname}-${p}-${tag}.png`);
      const lum = await sample();
      check(`${vname} ${p}: not black`, lum > (vname === 'night' ? 3 : 25), `mean ${lum.toFixed(1)}`);
    }
  }

  // ---------------------------------------------------------------- runtime switching + leaks
  if (!argv.includes('--no-switch')) {
    await goto(V.spawn);
    const before = await page.evaluate(() => { const i = window.blockforge.renderer.three.info; return { tex: i.memory.textures, geo: i.memory.geometries, prog: i.programs.length }; });
    for (let k = 0; k < 3; k++) for (const p of ['ultra', 'off', 'fancy', 'ultra', 'off']) { await setPack(p); await frames(2); }
    await frames(4);
    const after = await page.evaluate(() => { const i = window.blockforge.renderer.three.info; return { tex: i.memory.textures, geo: i.memory.geometries, prog: i.programs.length }; });
    check('no texture leak after 15 pack switches', after.tex <= before.tex, `${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
    check('no program growth after 15 pack switches', after.prog <= before.prog + 2, `${before.prog} -> ${after.prog}`);
  }

  // ---------------------------------------------------------------- stats per pack
  if (!argv.includes('--no-stats')) {
    await goto(V.spawn);
    for (const r of [4, 8]) {
      await page.evaluate((r) => { const bf = window.blockforge; bf.settings.renderDistance = r; bf.handlers.settingsChanged(bf.settings); }, r);
      await waitReady(V.spawn.x, V.spawn.z, r);
      await frames(4);
      for (const p of packs) {
        await setPack(p);
        await frames(4);
        const st = await page.evaluate(() => window.blockforge.renderer.stats());
        const fps = await page.evaluate(() => new Promise((res) => {
          let n = 0; const start = performance.now();
          const f = () => { n++; if (performance.now() - start < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - start) / 1000)); };
          requestAnimationFrame(f);
        }));
        console.log(`stats rd=${r} pack=${p}: drawCalls=${st.drawCalls} triangles=${st.triangles} sections=${st.sections} visible=${st.visibleSections} fps(swiftshader)=${fps.toFixed(1)}`);
      }
    }
  }

  const bad = errors.filter((e) => !/GPU stall|ReadPixels|Automatic fallback|WebGL 1 support/i.test(e));
  check('no console errors', bad.length === 0, bad.slice(0, 10).join(' | '));
  await browser.close();
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
