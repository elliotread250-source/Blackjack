'use strict';
// Getting Over It, browser tribute. A man in a pot, a sledgehammer, a mountain.
//
// Physics is position-based: every substep the body falls, the hammer head is
// put where the mouse says relative to the body, and if the head is touching
// something it stays put and the BODY moves instead. That one rule gives you
// hooking, pulling, vaulting and flinging, which is the whole game.
(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);

  // ---------------------------------------------------------------- tuning
  const G = 1150;                 // gravity, px/s^2
  const R = 26;                   // pot radius (the only part of you that collides)
  const HR = 11;                  // hammer head radius
  const PIVX = 0, PIVY = -24;     // shoulders, relative to the pot centre
  const MIN_L = 42, MAX_L = 168;  // hammer reach from the shoulders
  const H_SPEED = 2300;           // fastest the head can move relative to you, px/s
  const V_MAX = 1500;
  const STEP = 1 / 480;
  const PX_PER_M = 50;
  const START = { x: 0, y: -R - 1 };
  const SUMMIT_Y = -4865;
  const SAVE_KEY = 'goi.v1';

  const MATS = {
    dirt:  { fill: '#4d3b2c', edge: '#2c2018', cap: '#6da544', mu: 1.2,  grip: 0.6, slide: 0.95 },
    rock:  { fill: '#5d626d', edge: '#33363d', cap: '#8a909b', mu: 1.2,  grip: 0.6, slide: 0.965 },
    wood:  { fill: '#5e412a', edge: '#33220f', cap: '#7f5b3b', mu: 1.0,  grip: 0.5, slide: 0.965 },
    crate: { fill: '#9a7446', edge: '#5a4022', cap: '#b98f5a', mu: 1.0,  grip: 0.5, slide: 0.965 },
    metal: { fill: '#5f7486', edge: '#2f3c48', cap: '#8fa6b8', mu: 0.7,  grip: 0.3, slide: 0.975 },
    ice:   { fill: '#8fc6dc', edge: '#4f8aa3', cap: '#e8f8ff', mu: 0.12, grip: 0.0, slide: 0.9985 },
    hell:  { fill: '#b9471b', edge: '#5e200a', cap: '#f0883a', mu: 1.1,  grip: 0.5, slide: 0.965 },
    snow:  { fill: '#b8c4d4', edge: '#6d7d93', cap: '#ffffff', mu: 0.8,  grip: 0.35, slide: 0.98 },
    peak:  { fill: '#c3cedb', edge: '#6d7d93', cap: '#ffffff', mu: 1.3,  grip: 0.6, slide: 0.965 },
  };

  // ---------------------------------------------------------------- level
  const polys = [];
  const decor = []; // non-colliding shapes drawn behind the terrain

  function addPoly(pts, mat) {
    const P = { pts, mat, nx: [], ny: [], minx: 1e9, miny: 1e9, maxx: -1e9, maxy: -1e9 };
    for (const p of pts) {
      P.minx = Math.min(P.minx, p.x); P.maxx = Math.max(P.maxx, p.x);
      P.miny = Math.min(P.miny, p.y); P.maxy = Math.max(P.maxy, p.y);
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      const ex = b.x - a.x, ey = b.y - a.y, l = Math.hypot(ex, ey) || 1;
      let nx = ey / l, ny = -ex / l;
      if (pip(pts, (a.x + b.x) / 2 + nx * 0.5, (a.y + b.y) / 2 + ny * 0.5)) { nx = -nx; ny = -ny; }
      P.nx.push(nx); P.ny.push(ny);
    }
    polys.push(P);
    return P;
  }
  const box = (x1, y1, x2, y2, mat) =>
    addPoly([{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }], mat);
  function rect(cx, cy, w, h, ang, mat) {
    const c = Math.cos(ang), s = Math.sin(ang), pts = [];
    for (const [px, py] of [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]])
      pts.push({ x: cx + px * c - py * s, y: cy + px * s + py * c });
    return addPoly(pts, mat);
  }
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function blobPts(cx, cy, rx, ry, seed, n = 12, jag = 0.18) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.2;
      const k = 1 - jag + r() * jag * 1.4;
      pts.push({ x: cx + Math.cos(a) * rx * k, y: cy + Math.sin(a) * ry * k });
    }
    return pts;
  }
  const blob = (cx, cy, rx, ry, mat, seed, n, jag) => addPoly(blobPts(cx, cy, rx, ry, seed, n, jag), mat);

  function buildLevel() {
    // the world: floor and two walls you can't get past
    box(-1300, 0, 2100, 700, 'dirt');
    box(-1300, -5600, -900, 0, 'rock');
    box(1700, -5600, 2100, 0, 'rock');

    // the foot of the mountain: boulders, then the first cliff
    blob(390, 0, 95, 80, 'rock', 3, 11, 0.12);
    blob(610, -30, 115, 160, 'rock', 7, 12, 0.12);
    blob(845, -40, 120, 270, 'rock', 11, 12, 0.1);
    addPoly([{ x: 960, y: 0 }, { x: 975, y: -380 }, { x: 1010, y: -428 }, { x: 1700, y: -440 }, { x: 1700, y: 0 }], 'rock');

    // the dead tree: a trunk with branches that get shorter as you go up
    box(1350, -1150, 1420, -432, 'wood');
    rect(1190, -600, 320, 20, -0.06, 'wood');
    rect(1230, -765, 240, 18, -0.08, 'wood');
    rect(1265, -925, 170, 18, -0.1, 'wood');
    rect(1295, -1080, 110, 16, -0.12, 'wood');
    blob(1385, -1160, 60, 22, 'wood', 21, 9, 0.2);

    // the chimney: a ledge, a gap under the right wall, then straight up
    box(380, -1290, 1300, -1250, 'rock');
    box(380, -1960, 460, -1290, 'rock');
    box(640, -1870, 720, -1435, 'rock');
    box(640, -1870, 1150, -1840, 'rock');

    // the junkyard: crates, a barrel, a fridge and a long pipe back to the left
    rect(880, -1930, 120, 120, 0.1, 'crate');
    blob(1045, -2058, 72, 78, 'metal', 5, 10, 0.06);
    rect(1180, -2200, 110, 200, -0.06, 'metal');
    rect(900, -2420, 520, 30, 0.18, 'metal');
    box(250, -2520, 700, -2470, 'rock');
    decor.push({ pts: blobPts(980, -2080, 380, 300, 41, 16, 0.25), fill: 'rgba(30,24,22,.55)' });

    // the slide: a long icy slope with a few rocks to hook
    const s0 = { x: 320, y: -2520 }, s1 = { x: -500, y: -3110 };
    addPoly([s0, s1, { x: -900, y: -3110 }, { x: -900, y: -2470 }, { x: 250, y: -2470 }], 'ice');
    box(-900, -3112, -480, -3090, 'rock');
    const sl = Math.hypot(s1.x - s0.x, s1.y - s0.y);
    const nx = (s0.y - s1.y) / sl, ny = (s1.x - s0.x) / sl; // outward (up-right) normal of the slope
    [0.2, 0.37, 0.54, 0.71, 0.85, 0.97].forEach((t, i) =>
      blob(s0.x + (s1.x - s0.x) * t - nx * 6, s0.y + (s1.y - s0.y) * t + ny * 6, 22, 20, 'rock', 60 + i, 8, 0.15));

    // orange hell: jagged rocks rising to the right, gaps between them
    blob(-330, -3170, 90, 90, 'hell', 31, 13, 0.3);
    blob(-160, -3320, 80, 60, 'hell', 32, 12, 0.3);
    blob(40, -3420, 80, 80, 'hell', 33, 12, 0.3);
    blob(240, -3545, 85, 70, 'hell', 34, 12, 0.3);
    blob(450, -3665, 85, 70, 'hell', 35, 12, 0.3);
    blob(655, -3790, 95, 80, 'hell', 36, 13, 0.3);

    // the tower: blocks stacked left, right, left, all the way up
    decor.push({ pts: [{ x: 600, y: -3860 }, { x: 680, y: -4600 }, { x: 760, y: -4700 }, { x: 870, y: -4660 }, { x: 930, y: -3860 }], fill: 'rgba(70,80,105,.35)' });
    for (let i = 0; i < 6; i++) rect(i % 2 ? 610 : 830, -3935 - i * 115, 150, 100, 0, 'peak');
    rect(935, -4625, 290, 100, 0, 'peak');

    // the summit
    addPoly([{ x: 800, y: -4675 }, { x: 927, y: -4845 }, { x: 943, y: -4845 }, { x: 1070, y: -4675 }], 'peak');
  }

  const SECTIONS = [
    { y: 1e9,   name: 'The Foot of the Mountain', line: "There's a mountain. There's a hammer. You know what to do." },
    { y: -432,  name: 'The Dead Tree', line: 'Something grew here once. It gave up before you did.' },
    { y: -1290, name: 'The Chimney', line: "Narrow places are honest. There's only one way through them." },
    { y: -1870, name: 'The Junkyard', line: 'Everything up here was carried by someone who thought it mattered.' },
    { y: -2520, name: 'The Slide', line: 'Smooth things are the hardest to hold on to.' },
    { y: -3110, name: 'Orange Hell', line: "Getting angry is free. It just doesn't move the pot." },
    { y: -3870, name: 'The Tower', line: "You're higher now than most people bother to go." },
    { y: -4680, name: 'The Summit', line: 'Almost. Which, up here, means nothing yet.' },
  ];
  const FALL_LINES = [
    'Gravity keeps perfect records.',
    'You know this part now. That counts for something.',
    "The mountain didn't move. You did.",
    'Down is the only direction that never asks for effort.',
    'Breathe. Then swing.',
    'Every climb is mostly the bit you have already done.',
    "That was a lot of metres. They're all still there.",
    'Losing ground is still a kind of practice.',
    'Nobody saw that. Probably.',
    'The hammer was fine. It was the plan.',
  ];

  // ---------------------------------------------------------------- geometry
  function pip(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
    }
    return inside;
  }

  // Push circle p out of the terrain. Mutates p; returns {nx, ny, mat} or null.
  function collide(p, r) {
    let hx = 0, hy = 0, mat = null;
    for (let it = 0; it < 3; it++) {
      let any = false;
      for (const P of polys) {
        if (p.x + r < P.minx || p.x - r > P.maxx || p.y + r < P.miny || p.y - r > P.maxy) continue;
        const pts = P.pts, inside = pip(pts, p.x, p.y);
        let bd = Infinity, qx = 0, qy = 0, bi = 0;
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          const ex = b.x - a.x, ey = b.y - a.y;
          let t = ((p.x - a.x) * ex + (p.y - a.y) * ey) / (ex * ex + ey * ey || 1);
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const cx = a.x + ex * t, cy = a.y + ey * t, d = Math.hypot(p.x - cx, p.y - cy);
          if (d < bd) { bd = d; qx = cx; qy = cy; bi = i; }
        }
        if (!inside && bd >= r) continue;
        let nx, ny, depth;
        if (bd > 1e-6) {
          nx = (p.x - qx) / bd; ny = (p.y - qy) / bd;
          if (inside) { nx = -nx; ny = -ny; depth = bd + r; } else depth = r - bd;
        } else { nx = P.nx[bi]; ny = P.ny[bi]; depth = r; }
        p.x += nx * depth; p.y += ny * depth;
        hx += nx * depth; hy += ny * depth; mat = P.mat; any = true;
      }
      if (!any) break;
    }
    if (!mat) return null;
    const l = Math.hypot(hx, hy) || 1;
    return { nx: hx / l, ny: hy / l, mat };
  }

  // ---------------------------------------------------------------- state
  const S = {
    x: START.x, y: START.y, vx: 0, vy: 0,
    tinx: 120, tiny: 30,       // where the mouse says the head should be (relative to shoulders)
    ta: Math.atan2(30, 120), tl: 124, // where the head actually is, in polar
    hook: false, ax: 0, ay: 0, nx: 0, ny: -1, hmat: 'rock',
    time: 0, best: 0, falls: 0, bigFall: 0, peakY: START.y, section: 0, won: false,
    grounded: false,
  };
  let paused = true, sens = 1, sound = true, winT = -1;

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (d && Number.isFinite(d.x) && Number.isFinite(d.y)) {
        Object.assign(S, { x: d.x, y: d.y, time: d.time || 0, best: d.best || 0, falls: d.falls || 0,
          bigFall: d.bigFall || 0, section: d.section || 0, won: !!d.won, peakY: d.y });
        if (Number.isFinite(d.tinx)) { S.tinx = d.tinx; S.tiny = d.tiny; S.ta = Math.atan2(d.tiny, d.tinx); S.tl = Math.hypot(d.tinx, d.tiny); }
      }
      const o = JSON.parse(localStorage.getItem(SAVE_KEY + '.opts') || 'null');
      if (o) { sens = o.sens || 1; sound = o.sound !== false; }
    } catch { /* private mode: play without saving */ }
  }
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ x: S.x, y: S.y, tinx: S.tinx, tiny: S.tiny, time: S.time,
        best: S.best, falls: S.falls, bigFall: S.bigFall, section: S.section, won: S.won }));
    } catch {}
  }
  function saveOpts() { try { localStorage.setItem(SAVE_KEY + '.opts', JSON.stringify({ sens, sound })); } catch {} }

  const heightM = y => Math.max(0, Math.round(-(y + R) / PX_PER_M));

  // ---------------------------------------------------------------- audio
  let AC = null, noiseBuf = null, wind = null;
  function audio() {
    if (AC || !sound) return AC;
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
      const g = AC.createGain(); g.gain.value = 0;
      src.connect(f).connect(g).connect(AC.destination); src.start();
      wind = { g, f };
    } catch { AC = null; }
    return AC;
  }
  function clank(v, mat) {
    if (!sound || !AC || v < 0.05) return;
    const t = AC.currentTime, vol = Math.min(0.5, v * 0.5);
    const base = { metal: 1400, ice: 1900, wood: 420, crate: 380, dirt: 260, snow: 300 }[mat] || 900;
    const o = AC.createOscillator(), og = AC.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * 0.6, t + 0.12);
    og.gain.setValueAtTime(vol, t); og.gain.exponentialRampToValueAtTime(0.0001, t + (mat === 'metal' ? 0.35 : 0.14));
    o.connect(og).connect(AC.destination); o.start(t); o.stop(t + 0.4);
    const n = AC.createBufferSource(), nf = AC.createBiquadFilter(), ng = AC.createGain();
    n.buffer = noiseBuf; nf.type = 'bandpass'; nf.frequency.value = base * 2; nf.Q.value = 1.2;
    ng.gain.setValueAtTime(vol * 0.8, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    n.connect(nf).connect(ng).connect(AC.destination); n.start(t, Math.random() * 0.5); n.stop(t + 0.1);
  }
  function thud(v) {
    if (!sound || !AC || v < 0.08) return;
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.18);
    g.gain.setValueAtTime(Math.min(0.6, v * 0.6), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.25);
  }

  // ---------------------------------------------------------------- physics
  function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }

  let clankCD = 0, thudCD = 0, slideV = 0;
  function setOffset(x, y) {
    const l = Math.hypot(x, y);
    S.ta = Math.atan2(y, x); S.tl = Math.max(MIN_L, Math.min(MAX_L, l));
  }
  function step(dt) {
    // move the real hammer toward where the mouse wants it, at a limited speed
    const oTx = Math.cos(S.ta) * S.tl, oTy = Math.sin(S.ta) * S.tl;
    const tA = Math.atan2(S.tiny, S.tinx), tL = Math.max(MIN_L, Math.min(MAX_L, Math.hypot(S.tinx, S.tiny)));
    const maxDa = H_SPEED * dt / Math.max(S.tl, MIN_L);
    S.ta += Math.max(-maxDa, Math.min(maxDa, angDiff(tA, S.ta)));
    S.tl += Math.max(-H_SPEED * dt, Math.min(H_SPEED * dt, tL - S.tl));
    const Tx = Math.cos(S.ta) * S.tl, Ty = Math.sin(S.ta) * S.tl;
    const dTx = Tx - oTx, dTy = Ty - oTy;
    const ox = S.x, oy = S.y;

    if (S.hook) {
      // The head is planted. The hammer is rigid, so whatever the mouse does to
      // the head happens to the body instead, in reverse.
      const nx = S.nx, ny = S.ny, m = MATS[S.hmat];
      const dTn = dTx * nx + dTy * ny;
      // momentum lifting the head off counts too, once it outruns what you're still pushing
      const un = dTn + (S.vx * nx + S.vy * ny) * dt;
      const pressIn = -((S.tinx - Tx) * nx + (S.tiny - Ty) * ny); // cursor still inside the surface
      const press = Math.max(0, -dTn) + Math.max(0, pressIn) * 0.25;
      const support = -ny;                             // 1 flat ground, 0 wall, -1 ceiling
      if (dTn > 0.15 || un > 2.2 || (support < 0.35 && press < 1.2)) {
        S.hook = false; slideV = 0;
      } else {
        let ax = S.ax, ay = S.ay;
        // dragging the head along the surface: it holds up to what friction allows
        const tx = dTx - nx * dTn, ty = dTy - ny * dTn, tl = Math.hypot(tx, ty);
        const allow = m.mu * press + m.grip;
        if (tl > allow) { const k = (tl - allow) / tl; ax += tx * k; ay += ty * k; }
        // steep slick slopes: your weight drags the head downhill
        if (support >= 0.35) {
          const tan = Math.abs(nx) / support;
          if (tan > m.mu && press < 2) {
            const sinA = Math.abs(nx), cosA = support;
            slideV += G * (sinA - m.mu * cosA) * dt;
            const dir = nx > 0 ? 1 : -1; // (-ny, nx) * dir is the downhill tangent
            ax += -ny * dir * slideV * dt;
            ay += nx * dir * slideV * dt;
          } else slideV = 0;
        }
        // still touching something? if not, it slid off an edge
        const probe = { x: ax - nx * 2, y: ay - ny * 2 };
        const h = collide(probe, HR);
        if (!h) { S.hook = false; slideV = 0; }
        else {
          S.ax = probe.x; S.ay = probe.y; S.nx = h.nx; S.ny = h.ny; S.hmat = h.mat;
          S.x = S.ax - PIVX - Tx; S.y = S.ay - PIVY - Ty;
        }
      }
    }
    if (!S.hook) {
      S.vy += G * dt;
      S.x += S.vx * dt; S.y += S.vy * dt;
      const Dx = S.x + PIVX + Tx, Dy = S.y + PIVY + Ty;
      const h = { x: Dx, y: Dy }, hit = collide(h, HR);
      if (hit) {
        S.hook = true; slideV = 0; S.ax = h.x; S.ay = h.y; S.nx = hit.nx; S.ny = hit.ny; S.hmat = hit.mat;
        const hvx = (Dx - (ox + PIVX + oTx)) / dt, hvy = (Dy - (oy + PIVY + oTy)) / dt;
        const imp = Math.abs(hvx * hit.nx + hvy * hit.ny) / 1200;
        if (clankCD <= 0 && imp > 0.08) { clank(imp, hit.mat); clankCD = 0.06; }
        S.x += h.x - Dx; S.y += h.y - Dy;
      }
    }

    // the pot against the world. Velocity comes from how you moved before the
    // pot was pushed out, so being shoved out of a wall never launches you.
    let vx = (S.x - ox) / dt, vy = (S.y - oy) / dt;
    const b = { x: S.x, y: S.y }, bh = collide(b, R);
    S.x = b.x; S.y = b.y;
    if (bh && S.hook) {
      // the pot got shoved; the planted head stays put and the hammer angle gives
      const ox2 = S.ax - S.x - PIVX, oy2 = S.ay - S.y - PIVY, l = Math.hypot(ox2, oy2);
      if (l > MAX_L + 4 || l < MIN_L - 4) S.hook = false; else setOffset(ox2, oy2);
    }
    S.grounded = !!bh;
    if (bh) {
      const vn = vx * bh.nx + vy * bh.ny;
      if (thudCD <= 0 && vn < -350) { thud(-vn / 1400); thudCD = 0.15; }
      let tx = vx - bh.nx * vn, ty = vy - bh.ny * vn;
      if (!S.hook) { const k = MATS[bh.mat].slide; tx *= k; ty *= k; }
      vx = tx + bh.nx * Math.max(vn, 0); vy = ty + bh.ny * Math.max(vn, 0);
    }
    const sp = Math.hypot(vx, vy);
    if (sp > V_MAX) { vx *= V_MAX / sp; vy *= V_MAX / sp; }
    S.vx = vx; S.vy = vy;
    clankCD -= dt; thudCD -= dt;
  }

  function addInput(dx, dy) {
    S.tinx += dx; S.tiny += dy;
    const l = Math.hypot(S.tinx, S.tiny);
    if (l > MAX_L) { S.tinx *= MAX_L / l; S.tiny *= MAX_L / l; }
    else if (l < MIN_L) {
      if (l < 1e-3) { S.tinx = MIN_L; S.tiny = 0; } else { S.tinx *= MIN_L / l; S.tiny *= MIN_L / l; }
    }
  }

  // ---------------------------------------------------------------- progress, falls, lines
  let titleT = 0, quoteT = 0, saveT = 0, lastQuote = -1;
  function showTitle(text) { const el = $('title'); el.textContent = text; el.classList.add('show'); titleT = 3.2; }
  function showQuote(text) { const el = $('quote'); el.textContent = text; el.classList.add('show'); quoteT = 5.5; }

  function progress(dt) {
    const h = heightM(S.y);
    if (h > S.best) S.best = h;
    // the highest section you've reached gets its card the first time
    let sec = 0;
    for (let i = 0; i < SECTIONS.length; i++) if (S.y < SECTIONS[i].y) sec = i;
    if (sec > S.section) { S.section = sec; showTitle(SECTIONS[sec].name); showQuote(SECTIONS[sec].line); }
    // falls: drop from the highest point since you last touched anything
    const touching = S.grounded || S.hook;
    if (S.y < S.peakY) S.peakY = S.y;
    if (touching) {
      const drop = (S.y - S.peakY) / PX_PER_M;
      if (drop > 6) {
        S.falls++; S.bigFall = Math.max(S.bigFall, drop);
        if (drop > 9 && quoteT <= 0) {
          let i; do { i = Math.floor(Math.random() * FALL_LINES.length); } while (i === lastQuote);
          lastQuote = i; showQuote(FALL_LINES[i]);
        }
      }
      S.peakY = S.y;
    }
    if (!S.won && S.y < SUMMIT_Y && S.x > 860 && S.x < 1010) { S.won = true; winT = 0; save(); }
    if (titleT > 0 && (titleT -= dt) <= 0) $('title').classList.remove('show');
    if (quoteT > 0 && (quoteT -= dt) <= 0) $('quote').classList.remove('show');
    if ((saveT += dt) > 1) { saveT = 0; save(); }
  }

  // ---------------------------------------------------------------- rendering
  let W = 0, H = 0, DPR = 1, scale = 1;
  const cam = { x: START.x, y: START.y - 80 };
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    scale = Math.min(W, H) / 720;
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  function mix(c1, c2, t) {
    const a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    const r = Math.round(lerp(a >> 16, b >> 16, t)), g = Math.round(lerp(a >> 8 & 255, b >> 8 & 255, t)), bl = Math.round(lerp(a & 255, b & 255, t));
    return `rgb(${r},${g},${bl})`;
  }
  // sky keys by height in metres: morning, day, dusk, night, space
  const SKY = [[0, '#f3c99a', '#7fb2d9'], [30, '#9fd0f0', '#3f7fc4'], [55, '#f2a46b', '#5b4b8a'], [78, '#3a3566', '#14162e'], [100, '#151733', '#04050c']];
  function skyAt(m) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (m <= b[0]) { const t = Math.max(0, (m - a[0]) / (b[0] - a[0])); return [mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
    }
    return [SKY[SKY.length - 1][1], SKY[SKY.length - 1][2]];
  }

  const stars = Array.from({ length: 160 }, (_, i) => { const r = rng(900 + i); return { x: r(), y: r(), s: r() * 1.4 + 0.3 }; });
  function ridge(seed, n) { const r = rng(seed); return Array.from({ length: n }, () => r()); }
  const RIDGES = [ridge(1, 40), ridge(2, 40), ridge(3, 40)];

  function drawBackground(camM) {
    const [bot, top] = skyAt(camM);
    const g = ctx.createLinearGradient(0, H, 0, 0);
    g.addColorStop(0, bot); g.addColorStop(1, top);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const night = Math.max(0, Math.min(1, (camM - 60) / 25));
    if (night > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.8 * night})`;
      for (const s of stars) ctx.fillRect((s.x * W * 1.3 - cam.x * 0.02) % W, s.y * H, s.s, s.s);
    }
    // three ridgelines with parallax; they sink as you climb so the world opens up
    const cols = ['#9aa7b8', '#6f7d92', '#4b5669'];
    for (let L = 0; L < 3; L++) {
      const par = 0.08 + L * 0.07, base = H * (0.62 + L * 0.12) + camM * (4 - L) * 1.6;
      if (base > H + 40) continue;
      ctx.fillStyle = mix(cols[L], top, 0.35 + night * 0.4);
      ctx.beginPath(); ctx.moveTo(0, H);
      const span = W / 8, off = (cam.x * par) % span;
      for (let i = -1; i <= 10; i++) {
        const idx = ((Math.floor(cam.x * par / span) + i) % 40 + 40) % 40;
        ctx.lineTo(i * span - off, base - RIDGES[L][idx] * 140 * (1 + L * 0.3));
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    }
  }

  function tracePoly(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }

  function drawWorld(view) {
    for (const d of decor) { tracePoly(d.pts); ctx.fillStyle = d.fill; ctx.fill(); }
    // lake by the start, and a couple of trees
    ctx.fillStyle = 'rgba(80,140,190,.55)';
    ctx.beginPath(); ctx.ellipse(-520, 2, 260, 22, 0, 0, Math.PI); ctx.fill();
    for (const [tx, th] of [[-760, 240], [-250, 180], [180, 150]]) {
      ctx.fillStyle = '#3b2a1c'; ctx.fillRect(tx - 7, -th, 14, th);
      ctx.fillStyle = '#2f5d34'; ctx.beginPath(); ctx.ellipse(tx, -th, 60, 70, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3c7542'; ctx.beginPath(); ctx.ellipse(tx - 18, -th - 18, 38, 42, 0, 0, Math.PI * 2); ctx.fill();
    }
    // lava glow under orange hell
    const lg = ctx.createRadialGradient(150, -3350, 50, 150, -3350, 650);
    lg.addColorStop(0, 'rgba(255,120,40,.28)'); lg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = lg; ctx.fillRect(-600, -4000, 1500, 1300);

    for (const P of polys) {
      if (P.maxx < view.x0 || P.minx > view.x1 || P.maxy < view.y0 || P.miny > view.y1) continue;
      const m = MATS[P.mat];
      tracePoly(P.pts);
      ctx.fillStyle = m.fill; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = m.edge; ctx.lineJoin = 'round'; ctx.stroke();
      // grass, snow or highlights on the upward faces
      ctx.lineWidth = P.mat === 'dirt' || P.mat === 'snow' || P.mat === 'peak' ? 7 : 4; ctx.strokeStyle = m.cap; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i < P.pts.length; i++) {
        if (P.ny[i] < -0.55) { const a = P.pts[i], b = P.pts[(i + 1) % P.pts.length]; ctx.moveTo(a.x, a.y + 2); ctx.lineTo(b.x, b.y + 2); }
      }
      ctx.stroke();
    }
    // a flag on the summit
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(935, -4845); ctx.lineTo(935, -4955); ctx.stroke();
    const wave = Math.sin(performance.now() / 300) * 6;
    ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.moveTo(935, -4955); ctx.quadraticCurveTo(974, -4945 + wave, 1009, -4937); ctx.lineTo(935, -4917); ctx.fill();
  }

  function drawPlayer() {
    const px = S.x, py = S.y;
    const Tx = Math.cos(S.ta) * S.tl, Ty = Math.sin(S.ta) * S.tl;
    const sx = px + PIVX, sy = py + PIVY, hx = sx + Tx, hy = sy + Ty;
    const dx = Tx / S.tl, dy = Ty / S.tl, face = dx >= 0 ? 1 : -1;

    // hammer handle: starts a little behind the hands, ends at the head
    const hs = Math.max(-14, S.tl - 150);
    const g1x = sx + dx * hs, g1y = sy + dy * hs;
    const grip1x = sx + dx * Math.max(8, hs + 12), grip1y = sy + dy * Math.max(8, hs + 12);
    const grip2x = sx + dx * Math.max(24, hs + 34), grip2y = sy + dy * Math.max(24, hs + 34);

    // torso and head (drawn first so the pot rim sits in front)
    ctx.fillStyle = '#c99b74';
    ctx.beginPath(); ctx.ellipse(px, py - 22, 13, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + face * 2, py - 46, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4b3a2c';
    ctx.beginPath(); ctx.ellipse(px + face * 3, py - 38, 8, 6, 0, 0, Math.PI); ctx.fill(); // beard
    ctx.fillStyle = '#1e1a16'; ctx.beginPath(); ctx.arc(px + face * 6, py - 48, 1.6, 0, Math.PI * 2); ctx.fill();

    // arms
    ctx.strokeStyle = '#b8896a'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px - 8, py - 31); ctx.lineTo(grip1x, grip1y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 8, py - 31); ctx.lineTo(grip2x, grip2y); ctx.stroke();

    // handle and head
    ctx.strokeStyle = '#7a5532'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(g1x, g1y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = '#3b3f46'; ctx.fillRect(-9, -15, 18, 30);
    ctx.fillStyle = '#5b616b'; ctx.fillRect(-9, -15, 18, 5);
    ctx.restore();
    ctx.fillStyle = '#c99b74';
    ctx.beginPath(); ctx.arc(grip1x, grip1y, 3.5, 0, Math.PI * 2); ctx.arc(grip2x, grip2y, 3.5, 0, Math.PI * 2); ctx.fill();

    // the pot
    const pg = ctx.createRadialGradient(px - 9, py - 6, 4, px, py, R + 4);
    pg.addColorStop(0, '#5d5a57'); pg.addColorStop(1, '#1d1c1b');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(px, py, R, -0.12 * Math.PI, 1.12 * Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2a28';
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px - R - 3, py - 14, 2 * R + 6, 8, 4) : ctx.rect(px - R - 3, py - 14, 2 * R + 6, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(px - R, py - 13, 2 * R, 2);
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const camM = Math.max(0, -cam.y / PX_PER_M);
    drawBackground(camM);
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(scale, scale); ctx.translate(-cam.x, -cam.y);
    const hw = W / 2 / scale, hh = H / 2 / scale;
    drawWorld({ x0: cam.x - hw, x1: cam.x + hw, y0: cam.y - hh, y1: cam.y + hh });
    drawPlayer();
    ctx.restore();
    if (winT >= 0 && winT < 9) {
      const a = Math.min(1, winT / 2, (9 - winT) / 1.5);
      ctx.fillStyle = `rgba(8,8,16,${0.65 * a})`; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = a; ctx.fillStyle = '#f4efe4'; ctx.textAlign = 'center';
      ctx.font = `600 ${Math.min(56, W / 10)}px Fraunces, Georgia, serif`;
      ctx.fillText('You got over it.', W / 2, H / 2 - 10);
      ctx.font = `16px Inter, sans-serif`; ctx.fillStyle = '#c9c2b4';
      ctx.fillText(`${fmt(S.time)}  ·  ${S.falls} falls  ·  biggest fall ${Math.round(S.bigFall)} m`, W / 2, H / 2 + 28);
      ctx.fillText('The menu has a fresh start whenever you want one.', W / 2, H / 2 + 54);
      ctx.globalAlpha = 1;
    }
    // the cursor is the hammer; this little ring shows where the mouse is asking it to go
    if (!paused) {
      const ix = (S.x + PIVX + S.tinx - cam.x) * scale + W / 2, iy = (S.y + PIVY + S.tiny - cam.y) * scale + H / 2;
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ix, iy, 6, 0, Math.PI * 2); ctx.stroke();
    }
  }

  const fmt = t => { t = Math.floor(t); const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };

  function hud() {
    $('alt').textContent = heightM(S.y);
    $('sub').textContent = `best ${S.best} m${S.falls ? ' · ' + S.falls + ' falls' : ''}`;
    $('clock').textContent = fmt(S.time);
  }

  // ---------------------------------------------------------------- loop
  let last = performance.now(), hudT = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused) {
      const n = Math.max(1, Math.round(dt / STEP));
      for (let i = 0; i < n; i++) step(dt / n);
      S.time += dt;
      progress(dt);
      if ((hudT += dt) > 0.1) { hudT = 0; hud(); }
      if (wind && AC) {
        const sp = Math.hypot(S.vx, S.vy), m = heightM(S.y);
        wind.g.gain.setTargetAtTime(sound ? Math.min(0.12, 0.015 + m / 1500 + sp / 12000) : 0, AC.currentTime, 0.3);
      }
    }
    if (winT >= 0) winT += dt;
    // camera: follow, look a bit ahead of where you're going
    const tx = S.x + S.vx * 0.12, ty = S.y - Math.max(70, H / scale * 0.16) + S.vy * 0.1;
    const k = 1 - Math.exp(-dt * 5);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
    render();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- input
  const locked = () => document.pointerLockElement === canvas;
  window.addEventListener('mousemove', e => {
    if (paused) return;
    addInput(e.movementX * sens / scale, e.movementY * sens / scale);
  });
  canvas.addEventListener('mousedown', () => {
    if (!paused && !locked() && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch {} }
  });
  let touch = null;
  canvas.addEventListener('touchstart', e => { const t = e.changedTouches[0]; touch = { id: t.identifier, x: t.clientX, y: t.clientY }; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) if (touch && t.identifier === touch.id) {
      if (!paused) addInput((t.clientX - touch.x) * sens * 1.4 / scale, (t.clientY - touch.y) * sens * 1.4 / scale);
      touch.x = t.clientX; touch.y = t.clientY;
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', () => { touch = null; });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') { if (paused) play(); else pause(); }
  });
  document.addEventListener('pointerlockchange', () => { if (!locked() && !paused && !matchMedia('(pointer: coarse)').matches) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); if (!paused) pause(); } });

  function syncMenu() {
    const has = S.time > 1;
    $('stats').hidden = !has; $('newBtn').hidden = !has;
    $('playBtn').textContent = has ? 'Keep climbing' : 'Start climbing';
    $('sHeight').textContent = heightM(S.y) + ' m'; $('sBest').textContent = S.best + ' m'; $('sTime').textContent = fmt(S.time);
    $('sens').value = sens; $('snd').checked = sound;
  }
  function pause() { paused = true; save(); syncMenu(); $('menu').classList.remove('hidden'); if (locked()) document.exitPointerLock(); if (AC) AC.suspend(); }
  function play() {
    paused = false; $('menu').classList.add('hidden'); last = performance.now();
    audio(); if (AC) AC.resume();
    if (!matchMedia('(pointer: coarse)').matches && canvas.requestPointerLock) { try { canvas.requestPointerLock(); } catch {} }
    if (S.time < 1 && S.section === 0) { showTitle(SECTIONS[0].name); showQuote(SECTIONS[0].line); }
  }
  function reset() {
    Object.assign(S, { x: START.x, y: START.y, vx: 0, vy: 0, tinx: 120, tiny: 30, ta: Math.atan2(30, 120), tl: 124,
      hook: false, time: 0, falls: 0, bigFall: 0, peakY: START.y, section: 0, won: false });
    winT = -1; save(); cam.x = S.x; cam.y = S.y - 80;
  }
  $('playBtn').onclick = play;
  $('newBtn').onclick = () => { if (confirm('Start over from the bottom? Your best height is kept.')) { reset(); play(); } };
  $('pauseBtn').onclick = pause;
  $('sens').oninput = e => { sens = +e.target.value; saveOpts(); };
  $('snd').onchange = e => { sound = e.target.checked; saveOpts(); if (wind && !sound) wind.g.gain.value = 0; };

  // ---------------------------------------------------------------- boot
  buildLevel();
  load();
  cam.x = S.x; cam.y = S.y - 80;
  resize();
  window.addEventListener('resize', resize);
  syncMenu(); hud();
  requestAnimationFrame(frame);

  // hooks for automated tests: drive the hammer and step the world without the clock
  window.__goi = { S, step, addInput, collide, polys, STEP, reset, heightM, play, pause,
    simulate(sec) { const n = Math.round(sec / STEP); for (let i = 0; i < n; i++) step(STEP); progress(sec); } };
})();
