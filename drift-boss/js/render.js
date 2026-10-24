/* Drift Boss - canvas 2D isometric renderer and visual effects. */
(function () {
  'use strict';

  const PITCH = 50 * Math.PI / 180;
  const SP = Math.sin(PITCH), CP = Math.cos(PITCH);
  const C1 = Math.SQRT1_2, C2 = SP * Math.SQRT1_2, C3 = CP;
  const VIEW = [CP * Math.SQRT1_2, CP * Math.SQRT1_2, -SP];   // camera looks along this
  const LIGHT = (function () { const l = [-0.35, -0.6, 1]; const n = Math.hypot(l[0], l[1], l[2]); return [l[0] / n, l[1] / n, l[2] / n]; })();
  const SLAB = 0.5;          // road block thickness (tiles)
  const CAR_SCALE = 1.38;
  const PIVOT = 0.09;
  const TAU = Math.PI * 2;

  function key(x, y) { return x * 1048576 + y; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ----------------------------------------------------------------- colours */
  const rgbCache = {};
  function rgb(hex) {
    let c = rgbCache[hex];
    if (!c) {
      const h = hex.replace('#', '');
      c = rgbCache[hex] = [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
    }
    return c;
  }
  const shadeCache = new Map();
  function shade(hex, b) {
    const q = Math.round(b * 40);
    const k = hex + q;
    let s = shadeCache.get(k);
    if (!s) {
      const c = rgb(hex), f = q / 40;
      s = 'rgb(' + clamp(Math.round(c[0] * f), 0, 255) + ',' + clamp(Math.round(c[1] * f), 0, 255) + ',' + clamp(Math.round(c[2] * f), 0, 255) + ')';
      shadeCache.set(k, s);
    }
    return s;
  }
  function mixHex(a, b, t) {
    const x = rgb(a), y = rgb(b);
    return 'rgb(' + Math.round(lerp(x[0], y[0], t)) + ',' + Math.round(lerp(x[1], y[1], t)) + ',' + Math.round(lerp(x[2], y[2], t)) + ')';
  }

  const THEMES = [
    { top: '#3fa9ec', bot: '#bfe8ff', cloud: 0.92, star: 0 },
    { top: '#ff7f5c', bot: '#ffe1b0', cloud: 0.85, star: 0 },
    { top: '#5246b0', bot: '#f6a6c4', cloud: 0.6, star: 0.3 },
    { top: '#0d1638', bot: '#344a8c', cloud: 0.35, star: 1 },
    { top: '#1aa59a', bot: '#d9f6c4', cloud: 0.8, star: 0 },
  ];
  const THEME_LEN = 150;

  function themeAt(blocks) {
    const t = blocks / THEME_LEN;
    const i = Math.floor(t);
    let f = (t - i - 0.8) / 0.2;
    f = f <= 0 ? 0 : f >= 1 ? 1 : f * f * (3 - 2 * f);
    const A = THEMES[i % THEMES.length], B = THEMES[(i + 1) % THEMES.length];
    return { top: mixHex(A.top, B.top, f), bot: mixHex(A.bot, B.bot, f), cloud: lerp(A.cloud, B.cloud, f), star: lerp(A.star, B.star, f) };
  }

  /* ------------------------------------------------------------------ view */
  const view = { W: 1, H: 1, s: 60, camx: 0, camy: 0, ox: 0, oy: 0 };

  function unitX(x, y) { return (x - y) * C1; }
  function unitY(x, y, z) { return -((x + y) * C2 + z * C3); }
  function px(x, y, z) { return (unitX(x, y) - view.camx) * view.s + view.ox; }
  function py(x, y, z) { return (unitY(x, y, z) - view.camy) * view.s + view.oy; }

  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(px(pts[0], pts[1], pts[2]), py(pts[0], pts[1], pts[2]));
    for (let i = 3; i < pts.length; i += 3) ctx.lineTo(px(pts[i], pts[i + 1], pts[i + 2]), py(pts[i], pts[i + 1], pts[i + 2]));
    ctx.closePath();
  }

  /* ----------------------------------------------------------------- clouds */
  const cloudSprites = [];
  const clouds = [];
  function makeCloud(w, h, seed) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    let r = seed;
    const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const puffs = [];
    const n = 7 + Math.floor(rnd() * 4);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const pr = h * (0.16 + 0.17 * Math.sin(t * Math.PI) + rnd() * 0.06);
      puffs.push([w * (0.14 + t * 0.72) + (rnd() - 0.5) * w * 0.05, h * 0.62 - pr * 0.45 + (rnd() - 0.5) * h * 0.1, pr]);
    }
    // soft shadow underneath
    g.fillStyle = 'rgba(120,140,190,0.18)';
    for (const p of puffs) { g.beginPath(); g.arc(p[0], p[1] + h * 0.06, p[2], 0, TAU); g.fill(); }
    const grad = g.createLinearGradient(0, h * 0.15, 0, h * 0.85);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.6, '#f4f7ff');
    grad.addColorStop(1, '#d6def2');
    g.fillStyle = grad;
    for (const p of puffs) { g.beginPath(); g.arc(p[0], p[1], p[2], 0, TAU); g.fill(); }
    return c;
  }

  function initClouds() {
    for (let i = 0; i < 4; i++) cloudSprites.push(makeCloud(300, 130, 1234 + i * 977));
    let r = 99;
    const rnd = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    for (let i = 0; i < 16; i++) {
      const far = i < 8;
      clouds.push({ x: rnd(), y: rnd(), sp: cloudSprites[i % 4], sc: far ? 0.5 + rnd() * 0.3 : 0.9 + rnd() * 0.6, par: far ? 0.25 : 0.55, drift: (far ? 4 : 9) * (0.6 + rnd()), a: far ? 0.55 : 0.85 });
    }
  }

  function drawSky(ctx, theme, time) {
    const W = view.W, H = view.H;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.top);
    g.addColorStop(1, theme.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (theme.star > 0.02) {
      ctx.fillStyle = '#ffffff';
      let r = 7;
      for (let i = 0; i < 70; i++) {
        r = (r * 16807) % 2147483647; const x = (r / 2147483647) * W;
        r = (r * 16807) % 2147483647; const y = ((r / 2147483647) * H * 1.3 - view.camy * view.s * 0.08) % H;
        r = (r * 16807) % 2147483647; const tw = 0.5 + 0.5 * Math.sin(time * 2 + i);
        ctx.globalAlpha = theme.star * (0.35 + 0.5 * tw) * (1 - (y < 0 ? 0 : y / H) * 0.6);
        ctx.fillRect(x, (y + H) % H, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawClouds(ctx, theme, time, layer) {
    const W = view.W, H = view.H;
    const unit = Math.min(W, H);
    for (const c of clouds) {
      if ((c.par > 0.4) !== layer) continue;
      const w = c.sp.width * c.sc * unit / 420, h = c.sp.height * c.sc * unit / 420;
      const spanX = W + w * 2, spanY = H + h * 2;
      let x = c.x * spanX - view.camx * view.s * c.par + time * c.drift;
      let y = c.y * spanY - view.camy * view.s * c.par;
      x = ((x % spanX) + spanX) % spanX - w;
      y = ((y % spanY) + spanY) % spanY - h;
      ctx.globalAlpha = c.a * theme.cloud;
      ctx.drawImage(c.sp, x, y, w, h);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------- road */
  const ROAD = {
    top: '#4b5263', topLine: '#4b5263', edge: '#f4f6fa', dash: 'rgba(255,255,255,0.7)',
    bandY: '#e6e9f0', bandX: '#c3c8d3', sideY0: '#a7aec0', sideY1: '#6d7488', sideX0: '#878ea2', sideX1: '#545a6c',
    kerbR: '#e84545', kerbW: '#f7f7f7',
  };
  const EDGE_IN = 0.085, KERB = 0.14;

  function drawTile(ctx, t, map, s) {
    const x = t.x, y = t.y;
    const hasN = map.has(key(x, y - 1)), hasS = map.has(key(x, y + 1));
    const hasW = map.has(key(x - 1, y)), hasE = map.has(key(x + 1, y));
    // side faces (only the two that face the camera)
    if (!hasN) {
      const g = ctx.createLinearGradient(0, py(x, y, 0), 0, py(x, y, -SLAB));
      g.addColorStop(0, ROAD.sideY0); g.addColorStop(1, ROAD.sideY1);
      ctx.fillStyle = g;
      poly(ctx, [x, y, 0, x + 1, y, 0, x + 1, y, -SLAB, x, y, -SLAB]);
      ctx.fill();
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = ROAD.bandY;
      poly(ctx, [x, y, 0, x + 1, y, 0, x + 1, y, -0.08, x, y, -0.08]);
      ctx.fill();
    }
    if (!hasW) {
      const g = ctx.createLinearGradient(0, py(x, y, 0), 0, py(x, y, -SLAB));
      g.addColorStop(0, ROAD.sideX0); g.addColorStop(1, ROAD.sideX1);
      ctx.fillStyle = g;
      poly(ctx, [x, y, 0, x, y + 1, 0, x, y + 1, -SLAB, x, y, -SLAB]);
      ctx.fill();
      ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = ROAD.bandX;
      poly(ctx, [x, y, 0, x, y + 1, 0, x, y + 1, -0.08, x, y, -0.08]);
      ctx.fill();
    }
    // top
    ctx.fillStyle = ROAD.top;
    poly(ctx, [x, y, 0, x + 1, y, 0, x + 1, y + 1, 0, x, y + 1, 0]);
    ctx.fill();
    ctx.strokeStyle = ROAD.topLine; ctx.lineWidth = 1.2; ctx.stroke();

    const e = EDGE_IN;
    if (t.corner) {
      // kerbs on the two outer edges
      const closedN = !hasN, closedE = !hasE, closedS = !hasS, closedW = !hasW;
      const stripes = 6;
      for (let k = 0; k < stripes; k++) {
        const a0 = k / stripes, a1 = (k + 1) / stripes;
        ctx.fillStyle = (k & 1) ? ROAD.kerbW : ROAD.kerbR;
        if (closedS) { poly(ctx, [x + a0, y + 1, 0, x + a1, y + 1, 0, x + a1, y + 1 - KERB, 0, x + a0, y + 1 - KERB, 0]); ctx.fill(); }
        if (closedW) { poly(ctx, [x, y + a0, 0, x + KERB, y + a0, 0, x + KERB, y + a1, 0, x, y + a1, 0]); ctx.fill(); }
        if (closedN) { poly(ctx, [x + a0, y, 0, x + a1, y, 0, x + a1, y + KERB, 0, x + a0, y + KERB, 0]); ctx.fill(); }
        if (closedE) { poly(ctx, [x + 1, y + a0, 0, x + 1 - KERB, y + a0, 0, x + 1 - KERB, y + a1, 0, x + 1, y + a1, 0]); ctx.fill(); }
      }
      // inner corner notch joining the edge lines, plus a curved centre dash
      ctx.strokeStyle = ROAD.edge; ctx.lineWidth = Math.max(1, 0.04 * s); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
      ctx.beginPath();
      let ix, iy, sgnx, sgny;
      if (hasN) { ix = x + 1; iy = y; sgnx = -1; sgny = 1; } else { ix = x; iy = y + 1; sgnx = 1; sgny = -1; }
      ctx.moveTo(px(ix + sgnx * e, iy, 0), py(ix + sgnx * e, iy, 0));
      ctx.lineTo(px(ix + sgnx * e, iy + sgny * e, 0), py(ix + sgnx * e, iy + sgny * e, 0));
      ctx.lineTo(px(ix, iy + sgny * e, 0), py(ix, iy + sgny * e, 0));
      ctx.stroke();
      ctx.strokeStyle = ROAD.dash; ctx.lineWidth = Math.max(1, 0.045 * s);
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) {
        const a = Math.PI / 4 - 0.32 + 0.64 * k / 8;
        const qx = ix + sgnx * 0.5 * Math.cos(a), qy = iy + sgny * 0.5 * Math.sin(a);
        if (k === 0) ctx.moveTo(px(qx, qy, 0), py(qx, qy, 0)); else ctx.lineTo(px(qx, qy, 0), py(qx, qy, 0));
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = ROAD.edge; ctx.lineWidth = Math.max(1, 0.04 * s); ctx.lineCap = 'butt';
      ctx.beginPath();
      if (t.dir === 0) {
        ctx.moveTo(px(x, y + e, 0), py(x, y + e, 0)); ctx.lineTo(px(x + 1, y + e, 0), py(x + 1, y + e, 0));
        ctx.moveTo(px(x, y + 1 - e, 0), py(x, y + 1 - e, 0)); ctx.lineTo(px(x + 1, y + 1 - e, 0), py(x + 1, y + 1 - e, 0));
      } else {
        ctx.moveTo(px(x + e, y, 0), py(x + e, y, 0)); ctx.lineTo(px(x + e, y + 1, 0), py(x + e, y + 1, 0));
        ctx.moveTo(px(x + 1 - e, y, 0), py(x + 1 - e, y, 0)); ctx.lineTo(px(x + 1 - e, y + 1, 0), py(x + 1 - e, y + 1, 0));
      }
      // the very first tile has an open back end
      if (!hasN && t.dir === 1) { ctx.moveTo(px(x + e, y + e, 0), py(x + e, y + e, 0)); ctx.lineTo(px(x + 1 - e, y + e, 0), py(x + 1 - e, y + e, 0)); }
      ctx.stroke();
      ctx.strokeStyle = ROAD.dash; ctx.lineWidth = Math.max(1, 0.045 * s);
      ctx.beginPath();
      if (t.dir === 0) { ctx.moveTo(px(x + 0.3, y + 0.5, 0), py(x + 0.3, y + 0.5, 0)); ctx.lineTo(px(x + 0.7, y + 0.5, 0), py(x + 0.7, y + 0.5, 0)); }
      else { ctx.moveTo(px(x + 0.5, y + 0.3, 0), py(x + 0.5, y + 0.3, 0)); ctx.lineTo(px(x + 0.5, y + 0.7, 0), py(x + 0.5, y + 0.7, 0)); }
      ctx.stroke();
    }
  }

  function tileOnScreen(t) {
    const sx = px(t.x + 0.5, t.y + 0.5, 0), sy = py(t.x + 0.5, t.y + 0.5, 0);
    const m = view.s * 1.2;
    return sx > -m && sx < view.W + m && sy > -m && sy < view.H + m + view.s * SLAB;
  }

  /* ------------------------------------------------------------------ models */
  // pose: x, y, z (world), yaw, pitch, roll, scale; proj: {X(x,y,z), Y(x,y,z)}
  const tmp = [];
  function drawModel(ctx, prims, pose, proj, time, lineW) {
    const cy = Math.cos(pose.yaw), sy = Math.sin(pose.yaw);
    const cpp = Math.cos(pose.pitch || 0), spp = Math.sin(pose.pitch || 0);
    const cr = Math.cos(pose.roll || 0), sr = Math.sin(pose.roll || 0);
    const S = pose.scale || 1;
    const list = tmp; list.length = 0;
    for (const p of prims) {
      const W = [];
      for (const v of p.v) {
        const a = v[0], b = v[1], c = v[2] - PIVOT;
        const b1 = b * cr - c * sr, c1 = b * sr + c * cr;
        const a2 = a * cpp + c1 * spp, c2 = -a * spp + c1 * cpp;
        W.push(pose.x + (a2 * cy - b1 * sy) * S, pose.y + (a2 * sy + b1 * cy) * S, pose.z + (c2 + PIVOT) * S);
      }
      let mx = 0, my = 0, mz = 0;
      const n = p.v.length;
      for (let i = 0; i < W.length; i += 3) { mx += W[i]; my += W[i + 1]; mz += W[i + 2]; }
      list.push({ p: p, W: W, d: (mx * VIEW[0] + my * VIEW[1] + mz * VIEW[2]) / n });
    }
    list.sort((A, B) => B.d - A.d);
    const flashPhase = Math.floor(time * 6) & 1;
    for (const it of list) {
      const W = it.W;
      for (const f of it.p.f) {
        const i0 = f.i[0] * 3, i1 = f.i[1] * 3, i2 = f.i[2] * 3;
        const ux = W[i1] - W[i0], uy = W[i1 + 1] - W[i0 + 1], uz = W[i1 + 2] - W[i0 + 2];
        const wx = W[i2] - W[i0], wy = W[i2 + 1] - W[i0 + 1], wz = W[i2 + 2] - W[i0 + 2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        if (nx * VIEW[0] + ny * VIEW[1] + nz * VIEW[2] >= -0.001) continue;
        const dl = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2];
        let b = 0.5 + 0.55 * (dl > 0 ? dl : 0);
        let col = f.c;
        if (f.flash) { col = f.flash[flashPhase]; b = 1; }
        else if (f.glow) b = Math.max(b, 1.02);
        const fill = shade(col, b);
        ctx.fillStyle = fill;
        ctx.beginPath();
        for (let k = 0; k < f.i.length; k++) {
          const j = f.i[k] * 3;
          const X = proj.X(W[j], W[j + 1], W[j + 2]), Y = proj.Y(W[j], W[j + 1], W[j + 2]);
          if (k === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = fill; ctx.lineWidth = lineW; ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }
  }

  const worldProj = { X: px, Y: py };

  /* --------------------------------------------------------------------- FX */
  const FX = {
    parts: [], skids: [[], []], cur: [null, null], texts: [],
    reset() { this.parts.length = 0; this.skids = [[], []]; this.cur = [null, null]; this.texts.length = 0; },
    smoke(x, y, z, k, col) {
      this.parts.push({ t: 'smoke', x: x, y: y, z: z, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: 0.25 + Math.random() * 0.3, r: 0.05 + Math.random() * 0.04, dr: 0.22 * k, life: 0, max: 0.55 + Math.random() * 0.35, a: 0.55 * k, col: col || '235,236,242' });
    },
    burst(x, y, z, col, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = speed * (0.4 + Math.random() * 0.8);
        this.parts.push({ t: 'spark', x: x, y: y, z: z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: 0.8 + Math.random() * 1.4, r: 0.03 + Math.random() * 0.02, life: 0, max: 0.5 + Math.random() * 0.3, col: col });
      }
    },
    ring(x, y, col) { this.parts.push({ t: 'ring', x: x, y: y, z: 0.05, life: 0, max: 0.5, col: col }); },
    streak(x, y, dx, dy) { this.parts.push({ t: 'streak', x: x, y: y, z: 0.05 + Math.random() * 0.25, vx: -dx * 6, vy: -dy * 6, vz: 0, life: 0, max: 0.25, dx: dx, dy: dy }); },
    text(x, y, str, col, big) { this.texts.push({ x: x, y: y, z: 0.4, str: str, col: col, life: 0, max: big ? 1.3 : 0.8, big: !!big }); },
    skid(w, x, y, time) {
      let s = this.cur[w];
      if (!s) { s = this.cur[w] = []; this.skids[w].push(s); }
      s.push(x, y, time);
    },
    endSkid() { this.cur[0] = this.cur[1] = null; },
    update(dt, time) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.life += dt;
        if (p.life >= p.max) { this.parts.splice(i, 1); continue; }
        if (p.t === 'smoke') { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.r += p.dr * dt; }
        else if (p.t === 'spark') { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 5 * dt; }
        else if (p.t === 'streak') { p.x += p.vx * dt; p.y += p.vy * dt; }
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life += dt; t.z += dt * 0.8;
        if (t.life >= t.max) this.texts.splice(i, 1);
      }
      for (let w = 0; w < 2; w++) {
        const list = this.skids[w];
        for (let i = list.length - 1; i >= 0; i--) {
          const s = list[i];
          if (time - s[s.length - 1] > 4.5) { if (this.cur[w] === s) this.cur[w] = null; list.splice(i, 1); }
        }
      }
    },
  };

  function drawSkids(ctx, time) {
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.5, 0.05 * view.s);
    for (let w = 0; w < 2; w++) {
      for (const s of FX.skids[w]) {
        for (let i = 3; i < s.length; i += 3) {
          const age = time - s[i + 2];
          const a = 0.42 * clamp(1 - age / 4.5, 0, 1);
          if (a <= 0.01) continue;
          ctx.strokeStyle = 'rgba(28,30,38,' + a.toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(px(s[i - 3], s[i - 2], 0), py(s[i - 3], s[i - 2], 0));
          ctx.lineTo(px(s[i], s[i + 1], 0), py(s[i], s[i + 1], 0));
          ctx.stroke();
        }
      }
    }
  }

  function drawParts(ctx) {
    const s = view.s;
    for (const p of FX.parts) {
      const k = p.life / p.max;
      if (p.t === 'smoke') {
        ctx.fillStyle = 'rgba(' + p.col + ',' + (p.a * (1 - k)).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px(p.x, p.y, p.z), py(p.x, p.y, p.z), p.r * s, 0, TAU); ctx.fill();
      } else if (p.t === 'spark') {
        ctx.fillStyle = p.col; ctx.globalAlpha = 1 - k;
        ctx.beginPath(); ctx.arc(px(p.x, p.y, p.z), py(p.x, p.y, p.z), p.r * s * (1 - k * 0.5), 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      } else if (p.t === 'ring') {
        ctx.strokeStyle = p.col; ctx.globalAlpha = 1 - k; ctx.lineWidth = Math.max(1.5, 0.05 * s);
        ctx.beginPath(); ctx.ellipse(px(p.x, p.y, p.z), py(p.x, p.y, p.z), (0.15 + k * 0.5) * s, (0.15 + k * 0.5) * s * SP, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (p.t === 'streak') {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = Math.max(1, 0.025 * s);
        ctx.beginPath(); ctx.moveTo(px(p.x, p.y, p.z), py(p.x, p.y, p.z)); ctx.lineTo(px(p.x - p.dx * 0.5, p.y - p.dy * 0.5, p.z), py(p.x - p.dx * 0.5, p.y - p.dy * 0.5, p.z)); ctx.stroke();
      }
    }
  }

  function drawTexts(ctx) {
    const s = view.s;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const t of FX.texts) {
      const k = t.life / t.max;
      const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
      const size = (t.big ? 0.42 : 0.3) * s * pop;
      ctx.font = '900 ' + Math.round(Math.max(12, size)) + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      const X = px(t.x, t.y, t.z), Y = py(t.x, t.y, t.z);
      ctx.lineWidth = Math.max(3, size * 0.16); ctx.strokeStyle = 'rgba(20,20,40,0.65)'; ctx.lineJoin = 'round';
      ctx.strokeText(t.str, X, Y);
      ctx.fillStyle = t.col; ctx.fillText(t.str, X, Y);
    }
    ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------------ items */
  function drawCoin(ctx, x, y, time) {
    const s = view.s;
    const bob = Math.sin(time * 3 + (x + y)) * 0.025;
    const z = 0.16 + bob;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(px(x, y, 0), py(x, y, 0), 0.09 * s, 0.09 * s * SP, 0, 0, TAU); ctx.fill();
    const X = px(x, y, z), Y = py(x, y, z);
    const spin = Math.cos(time * 4 + (x + y) * 0.7);
    const r = 0.11 * s, rx = Math.max(r * 0.12, r * Math.abs(spin));
    ctx.fillStyle = '#c98a00';
    ctx.beginPath(); ctx.ellipse(X + (spin > 0 ? 1 : -1) * Math.min(2, r * 0.12), Y, rx, r, 0, 0, TAU); ctx.fill();
    const g = ctx.createLinearGradient(X - rx, Y - r, X + rx, Y + r);
    g.addColorStop(0, '#fff2a0'); g.addColorStop(0.5, '#ffcf2e'); g.addColorStop(1, '#f0a400');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(X, Y, rx, r, 0, 0, TAU); ctx.fill();
    if (rx > r * 0.35) {
      ctx.strokeStyle = 'rgba(180,110,0,0.75)'; ctx.lineWidth = Math.max(1, r * 0.12);
      ctx.beginPath(); ctx.ellipse(X, Y, rx * 0.62, r * 0.62, 0, 0, TAU); ctx.stroke();
    }
  }

  const PU_STYLE = { boost: { c: '#ff7a1a', c2: '#ffd23f' }, double: { c: '#9b4dff', c2: '#e2c6ff' }, shield: { c: '#16b8e8', c2: '#bff1ff' } };

  function drawPowerIcon(ctx, kind, X, Y, r) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
    if (kind === 'boost') {
      ctx.beginPath();
      ctx.moveTo(X + r * 0.15, Y - r * 0.62); ctx.lineTo(X - r * 0.38, Y + r * 0.1); ctx.lineTo(X - r * 0.02, Y + r * 0.1);
      ctx.lineTo(X - r * 0.15, Y + r * 0.62); ctx.lineTo(X + r * 0.38, Y - r * 0.12); ctx.lineTo(X + r * 0.03, Y - r * 0.12);
      ctx.closePath(); ctx.fill();
    } else if (kind === 'double') {
      ctx.font = '900 ' + Math.round(r * 0.95) + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('x2', X, Y + r * 0.05);
    } else {
      ctx.beginPath();
      ctx.moveTo(X, Y - r * 0.6);
      ctx.quadraticCurveTo(X + r * 0.3, Y - r * 0.42, X + r * 0.5, Y - r * 0.42);
      ctx.quadraticCurveTo(X + r * 0.5, Y + r * 0.3, X, Y + r * 0.62);
      ctx.quadraticCurveTo(X - r * 0.5, Y + r * 0.3, X - r * 0.5, Y - r * 0.42);
      ctx.quadraticCurveTo(X - r * 0.3, Y - r * 0.42, X, Y - r * 0.6);
      ctx.fill();
    }
  }

  function drawPower(ctx, kind, x, y, time) {
    const s = view.s;
    const bob = Math.sin(time * 2.6 + x) * 0.04;
    const z = 0.3 + bob;
    const st = PU_STYLE[kind];
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(px(x, y, 0), py(x, y, 0), 0.13 * s, 0.13 * s * SP, 0, 0, TAU); ctx.fill();
    const X = px(x, y, z), Y = py(x, y, z);
    const r = 0.17 * s;
    const pulse = 1 + 0.08 * Math.sin(time * 6);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = st.c2;
    ctx.beginPath(); ctx.arc(X, Y, r * 1.35 * pulse, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    const g = ctx.createRadialGradient(X - r * 0.3, Y - r * 0.3, r * 0.1, X, Y, r);
    g.addColorStop(0, st.c2); g.addColorStop(1, st.c);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1.5, r * 0.12);
    ctx.stroke();
    drawPowerIcon(ctx, kind, X, Y, r);
  }

  /* ------------------------------------------------------------------- car */
  function carPose(game, alpha, time) {
    const c = game.car, p = game.prev;
    const x = lerp(p.x, c.x, alpha), y = lerp(p.y, c.y, alpha), z = lerp(p.z, c.z, alpha);
    const th = lerp(p.th, c.th, alpha), ph = lerp(p.ph, c.ph, alpha);
    const onRoad = game.state !== 'falling' && game.state !== 'over';
    const yaw = onRoad ? ph + (th - ph) * 1.3 : th;
    const idle = (game.state === 'ready' || game.state === 'respawn') ? Math.sin(time * 38) * 0.004 : 0;
    return { x: x, y: y, z: z + idle, yaw: yaw, pitch: lerp(p.pitch, c.pitch, alpha), roll: lerp(p.roll, c.roll, alpha) + (onRoad ? -(th - ph) * 0.12 : 0), scale: CAR_SCALE, onRoad: onRoad };
  }

  function drawCarShadow(ctx, pose) {
    if (!pose.onRoad) return;
    const ca = Math.cos(pose.yaw), sa = Math.sin(pose.yaw);
    const L = 0.27 * CAR_SCALE, B = 0.15 * CAR_SCALE;
    const pts = [[L, B], [-L, B], [-L, -B], [L, -B]];
    ctx.fillStyle = 'rgba(10,12,30,0.28)';
    ctx.beginPath();
    pts.forEach((q, i) => {
      const x = pose.x + q[0] * ca - q[1] * sa + 0.02, y = pose.y + q[0] * sa + q[1] * ca - 0.02;
      if (i === 0) ctx.moveTo(px(x, y, 0), py(x, y, 0)); else ctx.lineTo(px(x, y, 0), py(x, y, 0));
    });
    ctx.closePath(); ctx.fill();
  }

  function drawFlames(ctx, pose, time) {
    const ca = Math.cos(pose.yaw), sa = Math.sin(pose.yaw);
    const back = -0.28 * CAR_SCALE;
    for (const side of [-0.06, 0.06]) {
      const bx = pose.x + back * ca - side * sa, by = pose.y + back * sa + side * ca, bz = pose.z + 0.07;
      const len = 0.16 + Math.random() * 0.12;
      const tx = bx - ca * len, ty = by - sa * len;
      const X0 = px(bx, by, bz), Y0 = py(bx, by, bz), X1 = px(tx, ty, bz), Y1 = py(tx, ty, bz);
      const nx = -(Y1 - Y0), ny = X1 - X0, nl = Math.hypot(nx, ny) || 1;
      const w = 0.045 * view.s;
      for (const [col, k] of [['rgba(255,120,30,0.9)', 1], ['rgba(255,230,120,0.95)', 0.5]]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(X0 + nx / nl * w * k, Y0 + ny / nl * w * k);
        ctx.lineTo(X0 + (X1 - X0) * k, Y0 + (Y1 - Y0) * k);
        ctx.lineTo(X0 - nx / nl * w * k, Y0 - ny / nl * w * k);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  function drawShield(ctx, pose, time) {
    const X = px(pose.x, pose.y, pose.z + 0.12), Y = py(pose.x, pose.y, pose.z + 0.12);
    const r = 0.36 * view.s * (1 + 0.04 * Math.sin(time * 5));
    const g = ctx.createRadialGradient(X, Y, r * 0.3, X, Y, r);
    g.addColorStop(0, 'rgba(120,220,255,0.02)');
    g.addColorStop(1, 'rgba(120,220,255,0.28)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(X, Y, r, r * 0.82, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(190,240,255,' + (0.55 + 0.25 * Math.sin(time * 7)).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1.5, 0.03 * view.s);
    ctx.stroke();
  }

  /* ------------------------------------------------------------------ frame */
  function frame(ctx, st) {
    const game = st.game, time = st.time;
    view.camx = st.camx + st.shakeX / view.s;
    view.camy = st.camy + st.shakeY / view.s;
    const theme = themeAt(st.themeBlocks);
    drawSky(ctx, theme, time);
    drawClouds(ctx, theme, time, false);
    drawClouds(ctx, theme, time, true);

    const road = game.road, map = road.map, s = view.s;
    const pose = carPose(game, st.alpha, time);
    const prims = st.model;
    const drawCar = () => {
      ctx.save();
      if (!pose.onRoad && pose.z < -2.5) ctx.globalAlpha = clamp(1 - (-pose.z - 2.5) / 4, 0, 1);
      drawModel(ctx, prims, pose, worldProj, time, Math.max(0.6, s * 0.012));
      ctx.restore();
    };

    // road, far to near; a falling car is slotted in between the blocks
    const carKey = pose.x + pose.y;
    let carDrawn = pose.onRoad;
    const tiles = road.tiles;
    for (let i = tiles.length - 1; i >= 0; i--) {
      const t = tiles[i];
      if (!carDrawn && t.x + t.y + 1 <= carKey) { drawCar(); carDrawn = true; }
      if (tileOnScreen(t)) drawTile(ctx, t, map, s);
    }
    if (!carDrawn) drawCar();

    drawSkids(ctx, time);
    if (pose.onRoad) drawCarShadow(ctx, pose);

    // items and the car, sorted far to near
    const items = [];
    for (const t of tiles) {
      if (t.taken || (!t.coin && !t.pu)) continue;
      if (!tileOnScreen(t)) continue;
      items.push(t);
    }
    items.sort((a, b) => (b.x + b.y) - (a.x + a.y));
    let carDone = !pose.onRoad;
    for (const t of items) {
      if (!carDone && t.x + t.y + 1 < carKey) {
        if (st.boost) drawFlames(ctx, pose, time);
        drawCar(); carDone = true;
      }
      if (t.pu) drawPower(ctx, t.pu, t.x + 0.5, t.y + 0.5, time);
      else drawCoin(ctx, t.x + 0.5, t.y + 0.5, time);
    }
    if (!carDone) { if (st.boost) drawFlames(ctx, pose, time); drawCar(); }
    if (pose.onRoad && game.shield) drawShield(ctx, pose, time);

    drawParts(ctx);
    drawTexts(ctx);
    return pose;
  }

  /* --------------------------------------------------------- garage preview */
  function drawPreview(ctx, w, h, prims, yaw, time, locked) {
    ctx.clearRect(0, 0, w, h);
    const sc = Math.min(w / 1.05, h / 0.78);
    const ox = w / 2, oy = h * 0.6;
    const proj = {
      X: (x, y, z) => (x - y) * C1 * sc + ox,
      Y: (x, y, z) => -((x + y) * C2 + z * C3) * sc + oy,
    };
    // little road block
    const T = 0.36, hs = 0.42;
    const P = (x, y, z) => [proj.X(x, y, z), proj.Y(x, y, z)];
    const fillPoly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
    fillPoly([P(-hs, -hs, 0), P(hs, -hs, 0), P(hs, -hs, -T), P(-hs, -hs, -T)], ROAD.sideY0);
    fillPoly([P(-hs, -hs, 0), P(-hs, hs, 0), P(-hs, hs, -T), P(-hs, -hs, -T)], ROAD.sideX0);
    fillPoly([P(-hs, -hs, 0), P(hs, -hs, 0), P(hs, -hs, -0.05), P(-hs, -hs, -0.05)], ROAD.bandY);
    fillPoly([P(-hs, -hs, 0), P(-hs, hs, 0), P(-hs, hs, -0.05), P(-hs, -hs, -0.05)], ROAD.bandX);
    fillPoly([P(-hs, -hs, 0), P(hs, -hs, 0), P(hs, hs, 0), P(-hs, hs, 0)], ROAD.top);
    // shadow
    const ca = Math.cos(yaw), sa = Math.sin(yaw);
    const sh = [[0.3, 0.16], [-0.3, 0.16], [-0.3, -0.16], [0.3, -0.16]].map(q => P(q[0] * ca - q[1] * sa + 0.02, q[0] * sa + q[1] * ca - 0.02, 0));
    fillPoly(sh, 'rgba(10,12,30,0.3)');
    drawModel(ctx, prims, { x: 0, y: 0, z: 0, yaw: yaw, pitch: 0, roll: 0, scale: 1.25 }, proj, time, 0.8);
    if (locked) { ctx.fillStyle = 'rgba(18,20,52,0.32)'; ctx.fillRect(0, 0, w, h); }
  }

  window.DriftRender = {
    view: view, FX: FX, frame: frame, drawPreview: drawPreview, initClouds: initClouds,
    unitX: unitX, unitY: unitY, C2: C2, CAR_SCALE: CAR_SCALE, carPose: carPose, themeAt: themeAt, SLAB: SLAB,
  };
})();
