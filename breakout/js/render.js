/* Canvas renderer + visual effects (particles, shake, flashes, popups, trails).
 * Draws in logical playfield units scaled to the screen at devicePixelRatio.
 * Static layers (background, playfield frame, brick wall) are cached in
 * offscreen canvases and only redrawn when they change. */
(function () {
  'use strict';
  const E = window.BreakoutEngine;
  const W = E.W;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  // ---------- colour helpers ----------
  function hexRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(h, to, t) {
    const a = hexRgb(h), b = hexRgb(to);
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }
  function rgba(h, a) { const c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  const BASE = {
    w: '#e6ebff', o: '#ff8a3d', c: '#2ee2f2', g: '#3fe07c', r: '#ff4d64', b: '#4f7fff', p: '#a66cff', m: '#ff5cc8', y: '#ffd23f',
    x: '#c5cde2', X: '#f3c14d', '#': '#5d6679',
    cr: '#f4473d', co: '#ff9a2e', cg: '#37cb5b', cy: '#f4d83c',
  };
  const PAL = {};
  for (const k in BASE) {
    PAL[k] = { base: BASE[k], hi: mix(BASE[k], '#ffffff', 0.42), lo: mix(BASE[k], '#000000', 0.38), glow: rgba(BASE[k], 0.16) };
  }

  function roundRect(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  function makeCanvas(w, h) {
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(w));
    cv.height = Math.max(1, Math.round(h));
    return cv;
  }

  const glowCache = {};
  function glowSprite(color) {
    if (glowCache[color]) return glowCache[color];
    const cv = makeCanvas(64, 64), c = cv.getContext('2d');
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(color, 0.9));
    g.addColorStop(0.25, rgba(color, 0.45));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    glowCache[color] = cv;
    return cv;
  }

  function easeOutBack(t) { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // ---------- state ----------
  const R = {
    canvas: null, ctx: null, dpr: 1, vw: 1, vh: 1,
    fx: 0, fy: 0, s: 1, H: 640, hudReserve: 90,
    bg: null, panel: null, bricks: null, brickKey: '',
    parts: [], ghosts: [], popups: [], flashes: new Map(), trails: new Map(),
    trauma: 0, sx: 0, sy: 0, screenFlash: 0, screenFlashColor: '#ffffff',
    time: 0, introStart: 0, lastGame: null, banner: null,
  };

  R.init = function (canvas) {
    R.canvas = canvas;
    R.ctx = canvas.getContext('2d');
  };

  R.resize = function (o) {
    R.vw = o.vw; R.vh = o.vh; R.dpr = o.dpr;
    R.fx = o.fx; R.fy = o.fy; R.s = o.s; R.H = o.H; R.hudReserve = o.hudReserve;
    buildBackground();
    buildPanel();
    R.brickKey = '';
  };

  R.reset = function () {
    R.parts.length = 0; R.ghosts.length = 0; R.popups.length = 0;
    R.flashes.clear(); R.trails.clear();
    R.trauma = 0; R.screenFlash = 0; R.banner = null;
  };

  R.shake = function (amount) { R.trauma = Math.min(1, R.trauma + amount); };

  // ---------- cached layers ----------
  function buildBackground() {
    const d = R.dpr;
    const cv = makeCanvas(R.vw * d, R.vh * d), c = cv.getContext('2d');
    c.scale(d, d);
    const g = c.createLinearGradient(0, 0, 0, R.vh);
    g.addColorStop(0, '#0d1030');
    g.addColorStop(0.55, '#080a1e');
    g.addColorStop(1, '#05060f');
    c.fillStyle = g;
    c.fillRect(0, 0, R.vw, R.vh);
    const blobs = [[0.15, 0.1, '#6d3cff', 0.18], [0.9, 0.25, '#ff3fa4', 0.1], [0.5, 1.05, '#16c6ff', 0.14]];
    for (const b of blobs) {
      const rad = Math.max(R.vw, R.vh) * 0.65;
      const rg = c.createRadialGradient(R.vw * b[0], R.vh * b[1], 0, R.vw * b[0], R.vh * b[1], rad);
      rg.addColorStop(0, rgba(b[2], b[3]));
      rg.addColorStop(1, rgba(b[2], 0));
      c.fillStyle = rg;
      c.fillRect(0, 0, R.vw, R.vh);
    }
    // faint stars
    let seed = 7;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const n = Math.round(R.vw * R.vh / 9000);
    for (let i = 0; i < n; i++) {
      c.fillStyle = 'rgba(200,210,255,' + (0.08 + rnd() * 0.3).toFixed(2) + ')';
      const s = rnd() < 0.85 ? 1 : 1.6;
      c.fillRect(rnd() * R.vw, rnd() * R.vh, s, s);
    }
    // soft glow around the playfield
    c.save();
    c.shadowColor = 'rgba(70,110,255,0.45)';
    c.shadowBlur = 40;
    c.fillStyle = '#06081a';
    roundRect(c, R.fx, R.fy, W * R.s, R.H * R.s, 10 * R.s);
    c.fill();
    c.restore();
    R.bg = cv;
  }

  function buildPanel() {
    const d = R.dpr, s = R.s, H = R.H;
    const cv = makeCanvas(W * s * d, H * s * d), c = cv.getContext('2d');
    c.scale(s * d, s * d);
    const L = E.WALL, Rr = W - E.WALL, T = E.HUD_H;
    // clip to the rounded field
    roundRect(c, 0, 0, W, H, 10);
    c.clip();
    // field
    const g = c.createLinearGradient(0, T, 0, H);
    g.addColorStop(0, '#0c1238');
    g.addColorStop(0.6, '#090d28');
    g.addColorStop(1, '#070918');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // grid
    c.strokeStyle = 'rgba(120,140,255,0.05)';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = L; x <= Rr; x += 38) { c.moveTo(x + 0.5, T); c.lineTo(x + 0.5, H); }
    for (let y = T; y <= H; y += 38) { c.moveTo(L, y + 0.5); c.lineTo(Rr, y + 0.5); }
    c.stroke();
    // danger glow at the bottom
    const dg = c.createLinearGradient(0, H - 40, 0, H);
    dg.addColorStop(0, 'rgba(255,40,90,0)');
    dg.addColorStop(1, 'rgba(255,40,90,0.13)');
    c.fillStyle = dg;
    c.fillRect(L, H - 40, Rr - L, 40);
    // side walls
    for (const side of [0, 1]) {
      const x0 = side ? Rr : 0;
      const wg = c.createLinearGradient(x0, 0, x0 + L, 0);
      wg.addColorStop(0, side ? '#2a3360' : '#141a3a');
      wg.addColorStop(1, side ? '#141a3a' : '#2a3360');
      c.fillStyle = wg;
      c.fillRect(x0, T, L, H - T);
    }
    // HUD strip
    const hg = c.createLinearGradient(0, 0, 0, T);
    hg.addColorStop(0, '#161c46');
    hg.addColorStop(1, '#0e1334');
    c.fillStyle = hg;
    c.fillRect(0, 0, W, T);
    // neon edges
    function neon(x1, y1, x2, y2, col) {
      c.strokeStyle = rgba(col, 0.18); c.lineWidth = 6;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = rgba(col, 0.35); c.lineWidth = 3;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = rgba(col, 0.95); c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    neon(L, T, L, H, '#39d5ff');
    neon(Rr, T, Rr, H, '#39d5ff');
    neon(0, T, W, T, '#8b6bff');
    R.panel = cv;
  }

  function brickKey(g) { return g.brickVersion + '|' + R.H + '|' + R.s + '|' + R.dpr; }

  function buildBricks(g) {
    const d = R.dpr, s = R.s;
    if (!R.bricks || R.bricks.width !== Math.round(W * s * d) || R.bricks.height !== Math.round(R.H * s * d)) {
      R.bricks = makeCanvas(W * s * d, R.H * s * d);
    }
    const c = R.bricks.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, R.bricks.width, R.bricks.height);
    c.setTransform(s * d, 0, 0, s * d, 0, 0);
    for (const br of g.bricks) if (br.alive) drawBrick(c, br);
    R.brickKey = brickKey(g);
    R.lastGame = g;
  }

  // ---------- bricks ----------
  function drawBrick(c, br) {
    const pad = 1.3;
    const x = br.x + pad, y = br.y + pad, w = br.w - pad * 2, h = br.h - pad * 2;
    const P = PAL[br.color] || PAL.w;
    if (br.steel) {
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#b5bdcf');
      g.addColorStop(0.45, '#727b90');
      g.addColorStop(0.55, '#5c6579');
      g.addColorStop(1, '#3a4152');
      c.fillStyle = g;
      roundRect(c, x, y, w, h, 2.5);
      c.fill();
      c.strokeStyle = 'rgba(15,18,28,0.7)';
      c.lineWidth = 1;
      c.stroke();
      // diagonal brushed lines
      c.save();
      roundRect(c, x, y, w, h, 2.5);
      c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.12)';
      c.beginPath();
      for (let k = -h; k < w; k += 6) { c.moveTo(x + k, y + h); c.lineTo(x + k + h, y); }
      c.stroke();
      c.restore();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(x + 2, y + 1, w - 4, 1);
      c.fillStyle = '#2a303d';
      for (const rx of [x + 4.5, x + w - 4.5]) {
        c.beginPath(); c.arc(rx, y + h / 2, 1.7, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.45)';
      for (const rx of [x + 4.1, x + w - 4.9]) { c.fillRect(rx, y + h / 2 - 1.2, 0.9, 0.9); }
      return;
    }
    // soft glow halo
    c.fillStyle = P.glow;
    roundRect(c, x - 1.5, y - 1.5, w + 3, h + 3, 4.5);
    c.fill();
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, P.hi);
    g.addColorStop(0.45, P.base);
    g.addColorStop(1, P.lo);
    c.fillStyle = g;
    roundRect(c, x, y, w, h, 3);
    c.fill();
    // gloss
    c.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(c, x + 2, y + 1.4, w - 4, Math.max(2, h * 0.3), 2);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(x + 2.5, y + h - 2.2, w - 5, 1.2);
    if (br.maxHp > 1) {
      c.strokeStyle = 'rgba(255,255,255,0.55)';
      c.lineWidth = 1;
      roundRect(c, x + 2.5, y + 2.5, w - 5, h - 5, 1.5);
      c.stroke();
      // a little shine diagonal
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.moveTo(x + w * 0.62, y + 1); c.lineTo(x + w * 0.72, y + 1); c.lineTo(x + w * 0.56, y + h - 1); c.lineTo(x + w * 0.46, y + h - 1);
      c.closePath(); c.fill();
      const dmg = br.maxHp - br.hp;
      if (dmg > 0) drawCracks(c, br, x, y, w, h, dmg);
    }
  }

  function drawCracks(c, br, x, y, w, h, dmg) {
    let seed = br.id * 9301 + 49297;
    const rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    c.lineJoin = 'round';
    const n = dmg * 2;
    for (let k = 0; k < n; k++) {
      let px = x + w * (0.15 + rnd() * 0.7), py = rnd() < 0.5 ? y + 1 : y + h - 1;
      const dir = py < y + h / 2 ? 1 : -1;
      const pts = [[px, py]];
      const segs = 3 + Math.floor(rnd() * 2);
      for (let i = 0; i < segs; i++) {
        px += (rnd() - 0.5) * 9;
        py += dir * (h / segs) * (0.6 + rnd() * 0.5);
        pts.push([Math.max(x + 1, Math.min(x + w - 1, px)), Math.max(y + 1, Math.min(y + h - 1, py))]);
      }
      c.strokeStyle = 'rgba(18,20,34,0.85)';
      c.lineWidth = 1.3;
      c.beginPath();
      pts.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.4)';
      c.lineWidth = 0.6;
      c.beginPath();
      pts.forEach(function (p, i) { if (i) c.lineTo(p[0] + 0.8, p[1]); else c.moveTo(p[0] + 0.8, p[1]); });
      c.stroke();
    }
  }

  // ---------- particles ----------
  function spawn(p) {
    if (R.parts.length > 700) R.parts.shift();
    R.parts.push(p);
  }
  function burst(x, y, color, n, speed, opts) {
    opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = opts.angle != null ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI) : Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.75);
      const life = (opts.life || 0.6) * (0.6 + Math.random() * 0.6);
      spawn({
        kind: opts.kind || 'sq', x: x + (opts.jx ? (Math.random() - 0.5) * opts.jx : 0), y: y + (opts.jy ? (Math.random() - 0.5) * opts.jy : 0),
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - (opts.up || 0),
        g: opts.g != null ? opts.g : 520, life, max: life, color, size: (opts.size || 3) * (0.6 + Math.random() * 0.8),
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, add: !!opts.add,
      });
    }
  }
  function ring(x, y, color, r0, r1, life, width) {
    spawn({ kind: 'ring', x, y, vx: 0, vy: 0, g: 0, life, max: life, color, r0, r1, size: width || 2, add: true });
  }
  function popup(x, y, text, color, size, life, rise) {
    R.popups.push({ x, y, text, color, size: size || 12, t: 0, life: life || 0.85, rise: rise == null ? 28 : rise });
    if (R.popups.length > 40) R.popups.shift();
  }

  // ---------- engine events -> visuals ----------
  R.event = function (e, g, touch) {
    const s = R;
    switch (e.type) {
      case 'brick': {
        const P = PAL[e.color] || PAL.w;
        const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        if (e.destroyed) {
          s.ghosts.push({ x: e.x, y: e.y, w: e.w, h: e.h, color: e.color, t: 0, life: 0.24 });
          burst(cx, cy, P.base, e.maxHp > 1 ? 16 : 11, 230, { jx: e.w * 0.8, jy: e.h * 0.6, up: 60, life: 0.7, size: 3.2 });
          burst(cx, cy, '#ffffff', 4, 320, { kind: 'spark', life: 0.32, g: 0, add: true, size: 1.4 });
          let busy = 0;
          for (const q of s.popups) if (q.brick && q.t < 0.5) busy++;
          if (busy < 5 && (g.mode === 'arcade' || e.pts >= 5)) { popup(cx, cy, '+' + e.pts, P.hi, e.pts >= 200 ? 14 : 11); s.popups[s.popups.length - 1].brick = true; }
          if (e.maxHp > 1) R.shake(0.22);
          else if (e.fire) R.shake(0.08);
          s.flashes.delete(e.id);
        } else {
          s.flashes.set(e.id, { x: e.x, y: e.y, w: e.w, h: e.h, t: 0.2 });
          burst(cx, cy + (e.laser ? e.h / 2 : 0), '#ffffff', 5, 200, { kind: 'spark', life: 0.25, g: 0, add: true, size: 1.2 });
          burst(cx, cy, P.base, 3, 120, { jx: e.w * 0.6, life: 0.4, size: 2 });
        }
        break;
      }
      case 'steel':
        s.flashes.set(e.id, { x: e.x - 1, y: e.y - 1, w: 0, h: 0, t: 0.18, steel: true });
        burst(e.x, e.y, '#fff3c4', 6, 260, { kind: 'spark', life: 0.25, g: 0, add: true, size: 1.3 });
        break;
      case 'paddle':
        burst(e.x, e.y, '#7ff3ff', 6, 170, { kind: 'spark', angle: -Math.PI / 2, spread: 2.2, life: 0.28, g: 0, add: true, size: 1.3 });
        break;
      case 'wall':
        burst(e.x, e.y, '#9fb4ff', 3, 120, { kind: 'spark', life: 0.18, g: 0, add: true, size: 1 });
        break;
      case 'launch':
        ring(e.x, e.y, '#7ff3ff', 4, 26, 0.35, 2);
        break;
      case 'caught':
        ring(e.x, e.y, '#4dff9a', 3, 18, 0.3, 2);
        break;
      case 'laser': {
        const p = g.paddle, dx = p.w / 2 - 7;
        burst(p.x - dx, e.y - 4, '#ff7ab8', 3, 120, { kind: 'spark', angle: -Math.PI / 2, spread: 1, life: 0.15, g: 0, add: true, size: 1.2 });
        burst(p.x + dx, e.y - 4, '#ff7ab8', 3, 120, { kind: 'spark', angle: -Math.PI / 2, spread: 1, life: 0.15, g: 0, add: true, size: 1.2 });
        break;
      }
      case 'laserHit':
        burst(e.x, e.y, e.steel ? '#fff3c4' : '#ff8cc6', 5, 160, { kind: 'spark', angle: Math.PI / 2, spread: 2.4, life: 0.22, g: 0, add: true, size: 1.2 });
        break;
      case 'powerup': {
        const P = E.POWERUPS[e.kind];
        ring(e.x, e.y, P.color, 6, 60, 0.45, 3);
        burst(e.x, e.y, P.color, 14, 220, { angle: -Math.PI / 2, spread: 2.6, life: 0.55, size: 2.4, add: true });
        let label = P.name + (P.good ? '!' : '');
        popup(g.paddle.x, g.paddleTop - 26, label, P.color, 15, 1.2, 34);
        if (e.kind === 'laser') popup(g.paddle.x, g.paddleTop - 8, touch ? 'TAP 2ND FINGER OR FIRE' : 'CLICK / SPACE TO FIRE', '#ffd1e6', 9, 1.6, 30);
        if (e.kind === 'catch') popup(g.paddle.x, g.paddleTop - 8, touch ? 'TAP TO RELEASE' : 'CLICK / SPACE TO RELEASE', '#c9ffd9', 9, 1.6, 30);
        s.screenFlash = 0.14; s.screenFlashColor = P.color;
        break;
      }
      case 'ballLost':
        burst(e.x, R.H - 4, '#ff4d6d', 14, 260, { angle: -Math.PI / 2, spread: 1.6, life: 0.6, add: true, size: 2.4 });
        break;
      case 'lifeLost':
        R.shake(0.55);
        s.screenFlash = 0.28; s.screenFlashColor = '#ff2d55';
        burst(e.x, e.y + 6, '#7ff3ff', 26, 300, { jx: g.paddle.w, life: 0.8, size: 2.6, add: true });
        break;
      case 'levelClear':
        s.screenFlash = 0.22; s.screenFlashColor = '#ffffff';
        R.shake(0.2);
        break;
      case 'ballVanish':
        ring(e.x, e.y, '#ffffff', 2, 22, 0.4, 2);
        burst(e.x, e.y, '#bff6ff', 10, 160, { life: 0.5, g: 0, add: true, size: 2 });
        break;
      case 'shrinkClassic':
        popup(g.paddle.x, g.paddleTop - 22, 'PADDLE HALVED', '#ff8a8a', 12, 1.3, 30);
        break;
      case 'speedUp':
        popup(W / 2, g.paddleTop - 120, 'SPEED UP', '#ffe27a', 11, 0.9, 20);
        break;
      case 'level':
        R.reset();
        R.introStart = R.time;
        break;
      case 'miss':
        break;
    }
  };

  R.update = function (dt) {
    R.time += dt;
    for (let i = R.parts.length - 1; i >= 0; i--) {
      const p = R.parts[i];
      p.life -= dt;
      if (p.life <= 0) { R.parts.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - Math.min(1, dt * 1.5);
      p.rot += p.vr * dt;
    }
    for (let i = R.ghosts.length - 1; i >= 0; i--) { R.ghosts[i].t += dt; if (R.ghosts[i].t >= R.ghosts[i].life) R.ghosts.splice(i, 1); }
    for (let i = R.popups.length - 1; i >= 0; i--) { R.popups[i].t += dt; if (R.popups[i].t >= R.popups[i].life) R.popups.splice(i, 1); }
    R.flashes.forEach(function (f, id) { f.t -= dt; if (f.t <= 0) R.flashes.delete(id); });
    R.trauma = Math.max(0, R.trauma - dt * 1.6);
    const amp = 7 * R.trauma * R.trauma;
    R.sx = amp * (Math.random() * 2 - 1);
    R.sy = amp * (Math.random() * 2 - 1);
    R.screenFlash = Math.max(0, R.screenFlash - dt * 0.9);
  };

  // ---------- drawing ----------
  function lerp(a, b, t) { return a + (b - a) * t; }

  R.draw = function (g, alpha, info) {
    const c = R.ctx, d = R.dpr, s = R.s;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    if (R.bg) c.drawImage(R.bg, 0, 0);
    else { c.fillStyle = '#070912'; c.fillRect(0, 0, R.canvas.width, R.canvas.height); }

    // shaken field origin, snapped to device pixels
    const ox = Math.round((R.fx + R.sx * s) * d), oy = Math.round((R.fy + R.sy * s) * d);
    if (R.panel) c.drawImage(R.panel, ox, oy);
    c.setTransform(s * d, 0, 0, s * d, ox, oy);

    // clip to the field below the HUD
    c.save();
    c.beginPath();
    c.rect(E.WALL, E.HUD_H, W - 2 * E.WALL, R.H - E.HUD_H);
    c.clip();

    drawBricksLayer(c, g, ox, oy);
    drawGhostsAndFlashes(c, g);
    drawCapsules(c, g, alpha);
    drawLasers(c, g, alpha);
    drawPaddle(c, g, alpha);
    drawBalls(c, g, alpha);
    drawParticles(c);
    drawPopups(c);
    if (!info.demo) drawCenterText(c, g, info);
    if (R.screenFlash > 0) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = R.screenFlash;
      c.fillStyle = R.screenFlashColor;
      c.fillRect(0, 0, W, R.H);
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();

    // HUD is not shaken
    c.setTransform(s * d, 0, 0, s * d, Math.round(R.fx * d), Math.round(R.fy * d));
    drawHUD(c, g, info);
    if (info.dim) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = 'rgba(4,6,16,' + info.dim + ')';
      c.fillRect(0, 0, R.canvas.width, R.canvas.height);
    }
  };

  function drawBricksLayer(c, g, ox, oy) {
    const sinceIntro = R.time - R.introStart;
    const animating = sinceIntro < 0.95 && g.state === 'playing' && g.introT > 0;
    if (animating) {
      for (const br of g.bricks) {
        if (!br.alive) continue;
        const k = clamp01((sinceIntro - br.row * 0.045 - (br.col % 2) * 0.02) / 0.42);
        if (k <= 0) continue;
        const e = easeOutBack(k);
        c.save();
        c.globalAlpha = k;
        c.translate(0, -(1 - e) * 46);
        drawBrick(c, br);
        c.restore();
      }
      return;
    }
    if (R.lastGame !== g || R.brickKey !== brickKey(g)) buildBricks(g);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(R.bricks, ox, oy);
    c.restore();
  }

  function drawGhostsAndFlashes(c, g) {
    c.save();
    for (const gh of R.ghosts) {
      const k = gh.t / gh.life;
      const sc = 1 + k * 0.35;
      const P = PAL[gh.color] || PAL.w;
      c.globalAlpha = (1 - k) * 0.9;
      c.fillStyle = k < 0.35 ? '#ffffff' : P.hi;
      const w = gh.w * sc, h = gh.h * sc;
      roundRect(c, gh.x + gh.w / 2 - w / 2 + 1, gh.y + gh.h / 2 - h / 2 + 1, w - 2, h - 2, 3);
      c.fill();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'lighter';
    R.flashes.forEach(function (f, id) {
      let br = f;
      if (f.steel) {
        br = null;
        for (const b of g.bricks) if (b.id === id) { br = b; break; }
        if (!br) return;
      }
      c.globalAlpha = Math.min(1, f.t / 0.2) * 0.75;
      c.fillStyle = '#ffffff';
      roundRect(c, br.x + 1.3, br.y + 1.3, br.w - 2.6, br.h - 2.6, 3);
      c.fill();
    });
    c.restore();
  }

  function drawCapsules(c, g, a) {
    const cw = E.CAP_W, ch = E.CAP_H;
    for (const cap of g.capsules) {
      const P = E.POWERUPS[cap.kind];
      const x = cap.x - cw / 2, y = lerp(cap.prevY, cap.y, a) - ch / 2;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.55;
      c.drawImage(glowSprite(P.color), x - 12, y - 12, cw + 24, ch + 24);
      c.restore();
      const gr = c.createLinearGradient(0, y, 0, y + ch);
      gr.addColorStop(0, mix(P.color, '#ffffff', 0.55));
      gr.addColorStop(0.5, P.color);
      gr.addColorStop(1, mix(P.color, '#000000', 0.5));
      c.fillStyle = gr;
      roundRect(c, x, y, cw, ch, ch / 2);
      c.fill();
      // rolling band
      c.save();
      roundRect(c, x, y, cw, ch, ch / 2);
      c.clip();
      const band = ((cap.age * 1.6) % 1) * (ch + 8) - 4;
      c.fillStyle = 'rgba(255,255,255,0.28)';
      c.fillRect(x, y + band - 2, cw, 3);
      if (!P.good) {
        c.fillStyle = 'rgba(0,0,0,0.22)';
        for (let k = -ch; k < cw; k += 7) {
          c.beginPath(); c.moveTo(x + k, y + ch); c.lineTo(x + k + 3, y + ch); c.lineTo(x + k + ch + 3, y); c.lineTo(x + k + ch, y); c.closePath(); c.fill();
        }
      }
      c.restore();
      c.strokeStyle = 'rgba(0,0,0,0.45)';
      c.lineWidth = 1;
      roundRect(c, x + 0.5, y + 0.5, cw - 1, ch - 1, ch / 2);
      c.stroke();
      drawCapsuleLabel(c, cap.kind, cap.x, y + ch / 2, 1);
    }
  }

  function drawCapsuleLabel(c, kind, cx, cy, sc) {
    const P = E.POWERUPS[kind];
    c.save();
    c.translate(cx, cy);
    c.scale(sc, sc);
    c.fillStyle = '#ffffff';
    c.strokeStyle = 'rgba(0,0,0,0.55)';
    c.lineWidth = 2.4;
    c.lineJoin = 'round';
    if (kind === 'life') {
      c.beginPath();
      c.moveTo(0, 4.2);
      c.bezierCurveTo(-7, -0.5, -3.6, -6.5, 0, -2.6);
      c.bezierCurveTo(3.6, -6.5, 7, -0.5, 0, 4.2);
      c.closePath();
      c.stroke();
      c.fillStyle = '#ff3b6b';
      c.fill();
    } else if (kind === 'shrink') {
      // two arrows pointing inwards
      c.beginPath();
      c.moveTo(-8, -3.6); c.lineTo(-2, 0); c.lineTo(-8, 3.6); c.closePath();
      c.moveTo(8, -3.6); c.lineTo(2, 0); c.lineTo(8, 3.6); c.closePath();
      c.stroke();
      c.fill();
    } else {
      c.font = '900 11px ' + FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.strokeText(P.label, 0, 0.8);
      c.fillText(P.label, 0, 0.8);
    }
    c.restore();
  }
  R.drawCapsuleLabel = drawCapsuleLabel;

  function drawLasers(c, g, a) {
    if (!g.lasers.length) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const l of g.lasers) {
      const y = lerp(l.prevY, l.y, a);
      c.globalAlpha = 0.5;
      c.drawImage(glowSprite('#ff4f9e'), l.x - 7, y - E.LASER_LEN - 6, 14, E.LASER_LEN + 12);
      c.globalAlpha = 1;
      c.fillStyle = '#ff7ab8';
      c.fillRect(l.x - 1.6, y - E.LASER_LEN, 3.2, E.LASER_LEN);
      c.fillStyle = '#ffffff';
      c.fillRect(l.x - 0.6, y - E.LASER_LEN + 1, 1.2, E.LASER_LEN - 2);
    }
    c.restore();
  }

  function drawPaddle(c, g, a) {
    if (g.state === 'lost' || g.state === 'over') {
      if (g.state === 'over' || (g.timer > 0.9 && g.lives >= 0)) return;
    }
    const p = g.paddle;
    const px = lerp(p.prevX, p.x, a);
    const h = E.PADDLE_H;
    const sq = p.squash;
    const hh = h * (1 - 0.25 * sq), ww = p.w * (1 + 0.05 * sq);
    const x0 = px - ww / 2, y0 = g.paddleTop + (h - hh) * 0.5;
    const laser = g.fx.laser > 0, catching = g.fx.catch > 0;
    // glow
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.45 + 0.35 * sq;
    c.drawImage(glowSprite(catching ? '#3dff95' : '#3fd7ff'), x0 - 16, y0 - 14, ww + 32, hh + 28);
    c.restore();
    // laser cannons
    if (laser) {
      c.fillStyle = '#ffd0e4';
      const dx = p.w / 2 - 7;
      for (const cx of [px - dx, px + dx]) {
        c.fillStyle = '#6b1d45';
        c.fillRect(cx - 2.6, y0 - 5, 5.2, 6);
        c.fillStyle = '#ff7ab8';
        c.fillRect(cx - 1.6, y0 - 6, 3.2, 6);
      }
    }
    // body
    const grad = c.createLinearGradient(0, y0, 0, y0 + hh);
    grad.addColorStop(0, '#effcff');
    grad.addColorStop(0.32, '#6ee0ff');
    grad.addColorStop(1, '#1d5fd6');
    c.fillStyle = grad;
    roundRect(c, x0, y0, ww, hh, hh / 2);
    c.fill();
    // end caps
    c.save();
    roundRect(c, x0, y0, ww, hh, hh / 2);
    c.clip();
    const capW = Math.min(13, ww * 0.2);
    const cg = c.createLinearGradient(0, y0, 0, y0 + hh);
    if (laser) { cg.addColorStop(0, '#ffc2dc'); cg.addColorStop(0.4, '#ff3d8b'); cg.addColorStop(1, '#8c1048'); }
    else { cg.addColorStop(0, '#ffd6f4'); cg.addColorStop(0.4, '#d65cff'); cg.addColorStop(1, '#6a1fa8'); }
    c.fillStyle = cg;
    c.fillRect(x0, y0, capW, hh);
    c.fillRect(x0 + ww - capW, y0, capW, hh);
    c.fillStyle = 'rgba(10,14,40,0.55)';
    c.fillRect(x0 + capW - 1, y0, 1.4, hh);
    c.fillRect(x0 + ww - capW - 0.4, y0, 1.4, hh);
    // gloss line
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillRect(x0 + hh / 2, y0 + 1.6, ww - hh, 1.3);
    c.restore();
    if (catching) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.55 + 0.35 * Math.sin(R.time * 10);
      c.fillStyle = '#5dffa8';
      c.fillRect(x0 + capW, y0 - 1.2, ww - capW * 2, 2);
      c.restore();
    }
  }

  function drawBalls(c, g, a) {
    const fire = g.fx.fire > 0;
    const seen = new Set();
    for (const b of g.balls) {
      seen.add(b.id);
      const x = b.stuck ? b.x : lerp(b.prevX, b.x, a), y = b.stuck ? b.y : lerp(b.prevY, b.y, a);
      let tr = R.trails.get(b.id);
      if (!tr) { tr = []; R.trails.set(b.id, tr); }
      if (!b.stuck) {
        tr.push(x, y);
        if (tr.length > 20) tr.splice(0, 2);
      } else tr.length = 0;
      // trail
      if (tr.length > 2) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const n = tr.length / 2;
        for (let i = 0; i < n - 1; i++) {
          const k = (i + 1) / n;
          c.globalAlpha = k * (fire ? 0.5 : 0.32);
          c.fillStyle = fire ? (i % 2 ? '#ff9d2e' : '#ff5a1f') : '#59d8ff';
          c.beginPath();
          c.arc(tr[i * 2], tr[i * 2 + 1], b.r * (0.35 + 0.6 * k), 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
      if (fire && !b.stuck && Math.random() < 0.7) {
        spawn({ kind: 'dot', x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, g: -40, life: 0.35, max: 0.35, color: Math.random() < 0.5 ? '#ffb02e' : '#ff4d1f', size: 2.2 + Math.random() * 2, rot: 0, vr: 0, add: true });
      }
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.75;
      const gs = b.r * (fire ? 6 : 4.6);
      c.drawImage(glowSprite(fire ? '#ff6a1a' : '#7fe8ff'), x - gs / 2, y - gs / 2, gs, gs);
      c.restore();
      const rg = c.createRadialGradient(x - b.r * 0.35, y - b.r * 0.35, 0.5, x, y, b.r);
      if (fire) { rg.addColorStop(0, '#fffbe0'); rg.addColorStop(0.5, '#ffc54a'); rg.addColorStop(1, '#ff5a1a'); }
      else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.6, '#e8fbff'); rg.addColorStop(1, '#8fdfff'); }
      c.fillStyle = rg;
      c.beginPath();
      c.arc(x, y, b.r, 0, Math.PI * 2);
      c.fill();
    }
    if (R.trails.size > seen.size) R.trails.forEach(function (_, id) { if (!seen.has(id)) R.trails.delete(id); });
  }

  function drawParticles(c) {
    for (const p of R.parts) {
      const k = p.life / p.max;
      c.globalAlpha = Math.min(1, k * 1.4);
      c.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      if (p.kind === 'sq') {
        c.fillStyle = p.color;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        const sz = p.size * (0.5 + 0.5 * k);
        c.fillRect(-sz / 2, -sz / 2, sz, sz);
        c.restore();
      } else if (p.kind === 'spark') {
        c.strokeStyle = p.color;
        c.lineWidth = p.size;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        c.stroke();
      } else if (p.kind === 'ring') {
        const t = 1 - k;
        c.strokeStyle = p.color;
        c.lineWidth = p.size * k + 0.3;
        c.beginPath();
        c.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * (1 - Math.pow(1 - t, 3)), 0, Math.PI * 2);
        c.stroke();
      } else {
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size * k, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  function drawPopups(c) {
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const p of R.popups) {
      const k = p.t / p.life;
      const pop = k < 0.12 ? 0.6 + k / 0.12 * 0.4 : 1;
      c.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      c.font = '900 ' + Math.round(p.size * pop * 10) / 10 + 'px ' + FONT;
      const y = p.y - p.rise * (1 - Math.pow(1 - k, 2));
      if (p.half == null) p.half = c.measureText(p.text).width / 2 + 4;
      const x = Math.max(E.WALL + p.half, Math.min(W - E.WALL - p.half, p.x));
      c.lineWidth = 3;
      c.strokeStyle = 'rgba(5,6,20,0.8)';
      c.lineJoin = 'round';
      c.strokeText(p.text, x, y);
      c.fillStyle = p.color;
      c.fillText(p.text, x, y);
    }
    c.globalAlpha = 1;
  }

  function glowText(c, text, x, y, size, color, alpha, weight) {
    c.save();
    c.globalAlpha = alpha;
    c.font = (weight || 900) + ' ' + size + 'px ' + FONT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.shadowColor = color;
    c.shadowBlur = size * 0.6;
    c.fillStyle = color;
    c.fillText(text, x, y);
    c.shadowBlur = 0;
    c.fillStyle = '#ffffff';
    c.globalAlpha = alpha * 0.85;
    c.fillText(text, x, y);
    c.restore();
  }

  function drawCenterText(c, g, info) {
    const cy = Math.round(g.paddleTop - Math.min(170, (g.paddleTop - g.brickTop()) * 0.42));
    if (g.state === 'playing' && g.introT > 0) {
      const t = 2.4 - g.introT;
      const al = Math.min(clamp01(t / 0.25), clamp01(g.introT / 0.45));
      const sc = 0.85 + 0.15 * easeOutBack(clamp01(t / 0.35));
      c.save();
      c.translate(W / 2, cy - 18);
      c.scale(sc, sc);
      const big = g.mode === 'classic' ? 'WALL ' + g.wall : 'LEVEL ' + g.level;
      glowText(c, big, 0, 0, 38, g.mode === 'classic' ? '#ffb347' : '#59d8ff', al);
      glowText(c, g.mode === 'classic' ? 'CLASSIC 1976' : g.levelName.toUpperCase(), 0, 34, 14, '#d9b8ff', al, 800);
      c.restore();
    }
    const stuckServe = g.state === 'playing' && g.balls.length && g.balls[0].stuck && g.balls[0].serve;
    if (stuckServe) {
      const pulse = 0.55 + 0.45 * Math.sin(R.time * 4);
      c.save();
      c.globalAlpha = pulse;
      c.font = '800 12px ' + FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#cfe7ff';
      c.fillText(info.touch ? 'TAP TO LAUNCH' : 'CLICK OR SPACE TO LAUNCH', W / 2, g.paddleTop - 54);
      c.globalAlpha = 0.6;
      c.font = '700 10px ' + FONT;
      c.fillStyle = '#8f9ccc';
      c.fillText(info.touch ? 'DRAG ANYWHERE TO MOVE' : 'MOUSE OR ← → TO MOVE', W / 2, g.paddleTop - 36);
      c.restore();
    }
    if (g.state === 'lost') {
      const t = (g.lives > 0 ? 1.4 : 1.8) - g.timer;
      const al = Math.min(clamp01(t / 0.2), 1);
      if (g.lives > 0) glowText(c, g.lives === 1 ? 'LAST BALL!' : g.lives + ' BALLS LEFT', W / 2, cy, 22, '#ff6b8b', al);
      else glowText(c, 'GAME OVER', W / 2, cy, 40, '#ff4d6d', al);
    } else if (g.state === 'clear') {
      const t = 2.2 - g.timer;
      const al = Math.min(clamp01(t / 0.2), clamp01(g.timer / 0.3));
      const sc = 0.8 + 0.2 * easeOutBack(clamp01(t / 0.4));
      c.save();
      c.translate(W / 2, cy - 10);
      c.scale(sc, sc);
      glowText(c, g.mode === 'classic' ? 'WALL CLEARED!' : 'LEVEL CLEAR!', 0, 0, 34, '#5dffa8', al);
      if (g.mode === 'arcade') glowText(c, '+1000 BONUS', 0, 34, 15, '#ffe27a', al, 800);
      c.restore();
    } else if (g.state === 'over') {
      glowText(c, 'GAME OVER', W / 2, cy, 40, '#ff4d6d', 1);
    } else if (g.state === 'won') {
      glowText(c, 'YOU WIN!', W / 2, cy, 44, '#ffe27a', 1);
    }
  }

  function drawHUD(c, g, info) {
    const T = E.HUD_H;
    if (info.demo) {
      c.save();
      c.font = '900 15px ' + FONT;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(200,210,255,0.5)';
      c.fillText('D E M O', W / 2, T / 2 + 1);
      c.restore();
      return;
    }
    const right = W - R.hudReserve;
    const colW = (right - 16) / 3;
    const cols = [
      ['SCORE', String(g.score), '#f1f4ff'],
      ['BEST', String(Math.max(info.best || 0, g.score)), '#ffd76a'],
      g.mode === 'classic' ? ['CLASSIC', 'WALL ' + g.wall, '#ffb347'] : ['LEVEL', g.level + '/' + g.levelCount, '#7fe8ff'],
    ];
    c.save();
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    for (let i = 0; i < 3; i++) {
      const x = 16 + colW * i;
      c.font = '800 9px ' + FONT;
      c.fillStyle = 'rgba(160,172,230,0.75)';
      c.fillText(cols[i][0], x, 19);
      c.font = '900 ' + (cols[i][1].length > 7 ? 16 : 19) + 'px ' + FONT;
      c.fillStyle = cols[i][2];
      c.fillText(cols[i][1], x, 40);
    }
    c.restore();

    // lives as little paddles, bottom-left
    const ly = R.H - 20;
    const shown = Math.max(0, g.lives);
    for (let i = 0; i < shown; i++) {
      const x = E.WALL + 10 + i * 24;
      const gr = c.createLinearGradient(0, ly, 0, ly + 6);
      gr.addColorStop(0, '#d8f8ff');
      gr.addColorStop(1, '#2a74e0');
      c.fillStyle = gr;
      roundRect(c, x, ly, 18, 6, 3);
      c.fill();
      c.fillStyle = '#c65cff';
      c.fillRect(x + 1, ly + 1, 3, 4);
      c.fillRect(x + 14, ly + 1, 3, 4);
    }

    // active power-ups, bottom-right, with a draining bar
    let x = W - E.WALL - 10;
    for (let i = E.TIMED.length - 1; i >= 0; i--) {
      const k = E.TIMED[i];
      const left = g.fx[k];
      if (left <= 0) continue;
      const P = E.POWERUPS[k];
      const w = 24, h = 11;
      x -= w;
      const y = R.H - 26;
      const blink = left < 2.5 && Math.sin(R.time * 18) < 0;
      c.globalAlpha = blink ? 0.4 : 1;
      c.fillStyle = P.color;
      roundRect(c, x, y, w, h, h / 2);
      c.fill();
      drawCapsuleLabel(c, k, x + w / 2, y + h / 2, 0.75);
      c.fillStyle = 'rgba(255,255,255,0.16)';
      c.fillRect(x + 2, y + h + 3, w - 4, 2);
      c.fillStyle = P.color;
      c.fillRect(x + 2, y + h + 3, (w - 4) * Math.min(1, left / P.dur), 2);
      c.globalAlpha = 1;
      x -= 6;
    }
  }

  window.BreakoutRender = R;
})();
