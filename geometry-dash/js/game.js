/* Rendering, input, menus and the main loop.
 *
 * Physics runs on a fixed 240Hz step (physics.js). Rendering runs on
 * requestAnimationFrame at whatever the display does (60/120/144Hz) and
 * interpolates the player between the last two physics steps, so motion
 * stays smooth without the sim ever depending on frame rate.
 */
(function () {
  'use strict';

  const P = window.GDPhysics;
  const AUDIO = window.GDAudio;
  const LEVELS = window.GDLevels.map(P.compile);

  const VIEW_H = 10.67;        // blocks visible vertically, same as GD's 320 units
  const PLAYER_SCREEN_X = 0.3; // fraction of screen width the player sits at
  const RESPAWN = 1.0;         // seconds between death and the next attempt
  const MAX_DPR = 2;

  const COL1 = '#7dff3a';      // default icon colours
  const COL2 = '#3af0ff';

  const PORTAL_COL = {
    cube: '#3bff6b', ship: '#ff4fd8', ball: '#ff4a3b', ufo: '#ff9e2b', wave: '#2bc0ff',
    robot: '#f2f2f2', spider: '#a04bff', swing: '#ffe23b',
    'grav+': '#ffd21f', 'grav-': '#2b8bff', mini: '#3bff9b', big: '#ff4fd8',
    s0: '#ff9e2b', s1: '#36b3ff', s2: '#3bff6b', s3: '#ff4fd8', s4: '#ff3b3b',
  };
  const ORB_COL = { yellow: '#ffe23b', pink: '#ff6bd8', red: '#ff3b3b', blue: '#3bc8ff', green: '#4bff5b', black: '#222' };
  const PAD_COL = { yellow: '#ffe23b', pink: '#ff6bd8', red: '#ff3b3b', blue: '#3bc8ff' };

  // ----------------------------------------------------------- storage

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('gdr:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem('gdr:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ------------------------------------------------------------ canvas

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = 0, H = 0, S = 40, VIEW_W = 16, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // Portrait phones: keep at least ~11 blocks of lookahead horizontally.
    S = Math.min(H / VIEW_H, W / 11);
    VIEW_W = W / S;
  }
  window.addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------- state

  const G = {
    screen: 'menu',
    idx: 0, L: null, s: null,
    prevX: 0, prevY: 0, acc: 0,
    attempts: 1, jumps: 0, time: 0,
    practice: false, checkpoints: [],
    deadTimer: 0, camX: 0, camY: -2.2,
    rot: 0, trail: [], lastMode: 'cube',
    showFps: store.get('fps', false), fps: 60, fpsAcc: 0, fpsN: 0,
    shake: 0, flash: 0,
  };
  let held = false;

  // --------------------------------------------------------- particles

  const MAX_PARTS = 400;
  const parts = [];
  for (let i = 0; i < MAX_PARTS; i++) parts.push({ life: 0 });
  let partIdx = 0;
  function spawn(x, y, vx, vy, life, size, color, square) {
    const p = parts[partIdx];
    partIdx = (partIdx + 1) % MAX_PARTS;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life;
    p.size = size; p.color = color; p.square = square;
  }
  function updateParts(dt) {
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy -= 6 * dt;
    }
  }

  // ----------------------------------------------------------- helpers

  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
  }
  function shade(c, k) {
    const A = hex(c);
    return `rgb(${Math.round(A[0] * k)},${Math.round(A[1] * k)},${Math.round(A[2] * k)})`;
  }

  // Background / ground colours, blended over 8 blocks after each trigger.
  function levelColors(L, x) {
    const cs = L.colors;
    let i = 0;
    while (i + 1 < cs.length && cs[i + 1].x <= x) i++;
    const cur = cs[i];
    const prev = cs[Math.max(0, i - 1)];
    const t = i === 0 ? 1 : Math.min(1, Math.max(0, (x - cur.x) / 8));
    return { bg: mix(prev.bg, cur.bg, t), gr: mix(prev.gr, cur.gr, t), bgHex: t < 0.5 ? prev.bg : cur.bg };
  }

  const sx = (x) => (x - G.camX) * S;
  const sy = (y) => H - (y - G.camY) * S;

  // ------------------------------------------------------------- input

  function press() {
    if (G.screen !== 'play') return;
    if (!held) G.jumps++;
    held = true;
  }
  function release() { held = false; }

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW', 'Enter']);
  window.addEventListener('keydown', (e) => {
    if (JUMP_KEYS.has(e.code)) {
      if (G.screen === 'play') { e.preventDefault(); if (!e.repeat) press(); }
      return;
    }
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (G.screen === 'play') pause();
      else if (G.screen === 'pause') resume();
    } else if (e.code === 'KeyR' && (G.screen === 'play' || G.screen === 'pause')) {
      restart(true);
    } else if (e.code === 'KeyZ' && G.screen === 'play') {
      addCheckpoint();
    } else if (e.code === 'KeyX' && G.screen === 'play') {
      removeCheckpoint();
    } else if (e.code === 'KeyF') {
      toggleFps();
    }
  });
  window.addEventListener('keyup', (e) => { if (JUMP_KEYS.has(e.code)) release(); });

  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', () => { release(); if (G.screen === 'play') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.screen === 'play') pause(); });

  // ---------------------------------------------------------- gameplay

  function startLevel(idx, practice) {
    G.idx = idx;
    G.L = LEVELS[idx];
    G.practice = practice;
    G.checkpoints = [];
    G.attempts = 1;
    G.jumps = 0;
    G.time = 0;
    store.set('attempts', store.get('attempts', 0) + 1);
    spawnPlayer();
    show('play');
    AUDIO.start(G.L);
  }

  function spawnPlayer() {
    const cp = G.checkpoints[G.checkpoints.length - 1];
    G.s = cp ? P.clone(cp.s) : P.create(G.L);
    G.s.held = held;
    G.prevX = G.s.x; G.prevY = G.s.y;
    G.acc = 0;
    G.deadTimer = 0;
    G.trail.length = 0;
    G.lastMode = G.s.mode;
    G.rot = cp ? cp.rot : 0;
    G.camX = G.s.x - VIEW_W * PLAYER_SCREEN_X;
    G.camY = cp ? cp.camY : -2.2;
    G.flash = 0;
  }

  function restart(fresh) {
    if (fresh) G.checkpoints = [];
    G.attempts++;
    spawnPlayer();
    if (!G.practice || fresh) AUDIO.start(G.L);
    show('play');
  }

  function addCheckpoint() {
    if (!G.practice || !G.s || G.s.dead) return;
    G.checkpoints.push({ s: P.clone(G.s), rot: G.rot, camY: G.camY });
  }
  function removeCheckpoint() {
    if (G.practice) G.checkpoints.pop();
  }

  function die() {
    const s = G.s;
    AUDIO.crash();
    if (!G.practice) AUDIO.stop();
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 9;
      spawn(s.x, s.y, Math.cos(a) * v, Math.sin(a) * v, 0.5 + Math.random() * 0.5,
        0.1 + Math.random() * 0.22, Math.random() < 0.5 ? COL1 : COL2, true);
    }
    G.shake = 0.35;
    G.flash = 1;
    G.deadTimer = RESPAWN;
    saveBest(Math.min(99, progress()));
  }

  function win() {
    AUDIO.stop();
    AUDIO.win();
    saveBest(100);
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 12;
      spawn(G.s.x, G.s.y, Math.cos(a) * v, Math.sin(a) * v + 4, 1 + Math.random(),
        0.12 + Math.random() * 0.2, ['#ffe23b', COL1, COL2, '#ff4fd8'][i % 4], i % 2 === 0);
    }
    const secs = G.time.toFixed(1);
    document.getElementById('completeStats').innerHTML =
      `${G.L.name}${G.practice ? ' (practice)' : ''}<br>Attempts: ${G.attempts}<br>Jumps: ${G.jumps}<br>Time: ${secs}s`;
    setTimeout(() => { if (G.screen === 'play' && G.s.won) show('complete'); }, 1400);
  }

  function progress() {
    return Math.max(0, Math.min(100, Math.floor((G.s.x / G.L.length) * 100)));
  }

  function saveBest(pct) {
    const k = (G.practice ? 'practice:' : 'best:') + G.idx;
    if (pct > store.get(k, 0)) store.set(k, pct);
  }

  // --------------------------------------------------------------- loop

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // tab was asleep; don't fast-forward the run

    G.fpsAcc += dt; G.fpsN++;
    if (G.fpsAcc >= 0.5) { G.fps = Math.round(G.fpsN / G.fpsAcc); G.fpsAcc = 0; G.fpsN = 0; }

    if (G.screen === 'play') update(dt);
    if (G.s) render(dt);
    else renderMenuBg(dt);
    requestAnimationFrame(frame);
  }

  function update(dt) {
    const s = G.s;
    updateParts(dt);
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt * 3);
    if (s.dead) {
      G.deadTimer -= dt;
      if (G.deadTimer <= 0) restart(false);
      return;
    }
    if (s.won) return;
    G.time += dt;
    G.acc += dt;
    while (G.acc >= P.DT) {
      G.prevX = s.x; G.prevY = s.y;
      P.step(s, G.L, held);
      G.acc -= P.DT;
      if (s.teleported) { G.prevX = s.x; G.prevY = s.y; }
      if (s.dead) { die(); break; }
      if (s.won) { win(); break; }
    }
    if (!s.dead) visuals(dt);
  }

  // Cosmetic per-frame state: rotation, trails, ground sparks.
  function visuals(dt) {
    const s = G.s;
    if (s.mode !== G.lastMode) { G.trail.length = 0; G.lastMode = s.mode; G.rot = 0; }
    const speed = P.SPEEDS[s.speed];
    if (s.mode === 'cube') {
      if (s.grounded) {
        const target = Math.round(G.rot / (Math.PI / 2)) * (Math.PI / 2);
        G.rot += (target - G.rot) * Math.min(1, dt * 22);
      } else {
        // One half-turn per normal jump, same as GD.
        G.rot += s.grav * dt * Math.PI / (2 * P.JUMP / P.G) * (s.mini ? 1.25 : 1);
      }
    } else if (s.mode === 'ball') {
      G.rot += s.grav * dt * speed / (P.size(s) / 2);
    } else if (s.mode === 'ship' || s.mode === 'wave' || s.mode === 'swing') {
      const target = -Math.atan2(s.vy, speed) * (s.mode === 'swing' ? 0.5 : 1);
      G.rot += (target - G.rot) * Math.min(1, dt * (s.mode === 'wave' ? 40 : 14));
    } else {
      G.rot += (0 - G.rot) * Math.min(1, dt * 14);
    }

    if (s.mode === 'wave') {
      G.trail.push(s.x, s.y);
      while (G.trail.length > 2 && G.trail[0] < G.camX - 1) G.trail.splice(0, 2);
    }
    if (s.grounded && Math.random() < dt * 40 && s.mode !== 'wave') {
      const half = P.size(s) / 2;
      spawn(s.x - half, s.y - half * s.grav, -2 - Math.random() * 2, 1.5 * s.grav * Math.random(),
        0.3, 0.08 + Math.random() * 0.06, COL1, true);
    }
    if ((s.mode === 'ship' || s.mode === 'ufo' || s.mode === 'swing') && Math.random() < dt * 60) {
      spawn(s.x - 0.5, s.y - 0.1 * s.grav, -3 - Math.random() * 2, (Math.random() - 0.5) * 2,
        0.35, 0.1 + Math.random() * 0.08, Math.random() < 0.5 ? '#ffb43b' : '#ffe23b', false);
    }
  }

  // -------------------------------------------------------------- render

  const BG_SQUARES = [];
  (function () {
    let a = 7;
    const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) BG_SQUARES.push({ x: r() * 64, y: r() * 14 - 2, s: 1.5 + r() * 4, a: 0.04 + r() * 0.06 });
  })();

  function renderMenuBg(dt) {
    G.camX += dt * 4;
    G.camY = -2.2;
    drawBackground('#2b5bff', '#1a3acc', 0);
    drawGround('#1a3acc', 0, null);
  }

  function render(dt) {
    const s = G.s, L = G.L;
    const alpha = s.dead || s.won ? 1 : G.acc / P.DT;
    const px = G.prevX + (s.x - G.prevX) * alpha;
    const py = G.prevY + (s.y - G.prevY) * alpha;

    // Camera
    G.camX = px - VIEW_W * PLAYER_SCREEN_X;
    let targetY;
    if (s.bounds) {
      targetY = (s.bounds.floor + s.bounds.ceil) / 2 - VIEW_H / 2;
    } else {
      targetY = G.camY;
      const top = VIEW_H - 3.5, bot = 2.6;
      if (py - targetY > top) targetY = py - top;
      if (py - targetY < bot) targetY = py - bot;
      targetY = Math.max(-2.2, targetY);
    }
    if (!s.dead) G.camY += (targetY - G.camY) * Math.min(1, dt * 5);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.shake > 0) {
      const k = G.shake * 14;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    const col = levelColors(L, px);
    const pulse = AUDIO.pulse();
    drawBackground(col.bg, col.gr, pulse);
    drawObjects(L, pulse);
    if (s.bounds) drawCeiling(col.gr, s.bounds.ceil);
    drawGround(col.gr, s.bounds ? s.bounds.floor : 0, s.bounds);
    drawCheckpoints();
    drawAttemptText();
    if (!s.dead) drawPlayer(s, px, py);
    drawParts();
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHud();
  }

  function drawBackground(bg, gr, pulse) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, shade(rgbHex(bg), 0.55 + pulse * 0.08));
    grad.addColorStop(1, bg);
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    // Parallax squares
    const par = 0.12;
    const off = (G.camX * par) % 64;
    ctx.lineWidth = 2;
    for (const q of BG_SQUARES) {
      for (let rep = -1; rep <= Math.ceil(VIEW_W / 64) + 1; rep++) {
        const x = (q.x - off + rep * 64) * S;
        if (x > W + 200 || x + q.s * S < -200) continue;
        const y = H - (q.y - G.camY * 0.2) * S;
        ctx.strokeStyle = `rgba(255,255,255,${q.a})`;
        ctx.fillStyle = `rgba(0,0,0,${q.a * 0.8})`;
        ctx.fillRect(x, y - q.s * S, q.s * S, q.s * S);
        ctx.strokeRect(x, y - q.s * S, q.s * S, q.s * S);
      }
    }
  }

  function rgbHex(rgb) {
    if (rgb[0] === '#') return rgb;
    const m = rgb.match(/\d+/g);
    return '#' + m.slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('');
  }

  function drawGround(gr, floorY, bounds) {
    const y = sy(floorY);
    if (y > H + 10) return;
    ctx.fillStyle = gr;
    ctx.fillRect(-20, y, W + 40, H - y + 40);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-20, y + S * 0.5, W + 40, H - y);
    // tile seams
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    const step = 4;
    const start = Math.floor(G.camX / step) * step;
    ctx.beginPath();
    for (let gx = start; gx < G.camX + VIEW_W + step; gx += step) {
      ctx.moveTo(sx(gx), y); ctx.lineTo(sx(gx), y + S * 4);
    }
    ctx.stroke();
    glowLine(y);
  }

  function drawCeiling(gr, ceilY) {
    const y = sy(ceilY);
    if (y < -10) return;
    ctx.fillStyle = gr;
    ctx.fillRect(-20, -40, W + 40, y + 40);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-20, -40, W + 40, y + 40 - S * 0.5);
    glowLine(y);
  }

  function glowLine(y) {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 1, W, 2);
  }

  let drawStamp = 0;
  function drawObjects(L, pulse) {
    const stamp = ++drawStamp;
    const x0 = Math.max(0, Math.floor(G.camX) - 1);
    const x1 = Math.min(L.buckets.length - 1, Math.ceil(G.camX + VIEW_W) + 1);
    const blocks = [], others = [];
    for (let i = x0; i <= x1; i++) {
      for (const o of L.buckets[i]) {
        if (o._d === stamp) continue;
        o._d = stamp;
        (o.t === 'b' ? blocks : others).push(o);
      }
    }
    // Portals' back halves go behind everything
    for (const o of others) if (o.t === 'p') drawPortal(o, pulse, true);
    for (const o of blocks) drawBlock(o);
    for (const o of others) {
      if (o.t === 's' || o.t === 'ss') drawSpike(o);
      else if (o.t === 'pad') drawPad(o, pulse);
      else if (o.t === 'orb') drawOrb(o, pulse);
    }
    for (const o of others) if (o.t === 'p') drawPortal(o, pulse, false);
    drawEndLine(L);
  }

  function drawBlock(o) {
    const x = sx(o.x), y = sy(o.y + o.h), w = o.w * S, h = o.h * S;
    if (x > W || x + w < 0 || y > H || y + h < 0) return;
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(x, y, w, h);
    // inner cell grid, GD style
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < o.w; i++) { ctx.moveTo(x + i * S, y); ctx.lineTo(x + i * S, y + h); }
    for (let j = 1; j < o.h; j++) { ctx.moveTo(x, y + j * S); ctx.lineTo(x + w, y + j * S); }
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.5, S * 0.06);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function drawSpike(o) {
    const small = o.t === 'ss';
    const x = sx(o.x), base = o.d === -1 ? sy(o.y + 1) : sy(o.y);
    const hgt = (small ? 0.45 : 1) * S * (o.d === -1 ? 1 : -1);
    const inset = small ? S * 0.15 : S * 0.04;
    ctx.beginPath();
    ctx.moveTo(x + inset, base);
    ctx.lineTo(x + S / 2, base + hgt);
    ctx.lineTo(x + S - inset, base);
    ctx.closePath();
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.5, S * 0.05);
    ctx.stroke();
  }

  function drawPad(o, pulse) {
    const used = G.s.used.indexOf(o.id) !== -1;
    const c = PAD_COL[o.c];
    const flip = o.d === -1;
    const x = sx(o.x + 0.5), y = flip ? sy(o.y + 1) : sy(o.y);
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(1, -1);
    ctx.globalAlpha = used ? 0.5 : 1;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(0, 0, S * 0.45, S * (0.22 + pulse * 0.05), 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function drawOrb(o, pulse) {
    const used = G.s.used.indexOf(o.id) !== -1;
    const c = ORB_COL[o.c];
    const x = sx(o.x + 0.5), y = sy(o.y + 0.5);
    const r = S * 0.36 * (1 + pulse * 0.12);
    ctx.globalAlpha = used ? 0.35 : 1;
    ctx.strokeStyle = c;
    ctx.lineWidth = S * 0.06;
    ctx.beginPath();
    ctx.arc(x, y, S * 0.58, 0, Math.PI * 2);
    ctx.globalAlpha *= 0.5;
    ctx.stroke();
    ctx.globalAlpha = used ? 0.35 : 1;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawPortal(o, pulse, back) {
    const c = PORTAL_COL[o.k] || '#fff';
    const x = sx(o.x + 0.5), y = sy(o.y);
    const rx = S * 0.42, ry = (o.h / 2) * S;
    if (y + ry < 0 || y - ry > H) return;
    if (o.k[0] === 's') {
      if (back) return;
      // speed portal: chevrons
      const n = { s0: 1, s1: 2, s2: 3, s3: 4, s4: 5 }[o.k];
      const yc = Math.min(Math.max(y, S * 2), H - S * 2);
      ctx.fillStyle = c;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      for (let i = 0; i < n; i++) {
        const cx = x + (i - (n - 1) / 2) * S * 0.32;
        ctx.beginPath();
        ctx.moveTo(cx - S * 0.2, yc - S * 0.7);
        ctx.lineTo(cx + S * 0.2, yc);
        ctx.lineTo(cx - S * 0.2, yc + S * 0.7);
        ctx.lineTo(cx - S * 0.05, yc);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      return;
    }
    ctx.lineWidth = S * (0.2 + pulse * 0.04);
    ctx.strokeStyle = c;
    ctx.beginPath();
    if (back) ctx.ellipse(x, y, rx, ry, 0, Math.PI * 0.5, Math.PI * 1.5);
    else ctx.ellipse(x, y, rx, ry, 0, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath();
    if (back) ctx.ellipse(x, y, rx + S * 0.1, ry + S * 0.1, 0, Math.PI * 0.5, Math.PI * 1.5);
    else ctx.ellipse(x, y, rx + S * 0.1, ry + S * 0.1, 0, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    if (back) {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.15 + pulse * 0.1;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawEndLine(L) {
    const x = sx(L.length);
    if (x > W + 10) return;
    const g = ctx.createLinearGradient(x - S * 3, 0, x, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(x - S * 3, 0, S * 3, H);
  }

  function drawCheckpoints() {
    if (!G.practice) return;
    for (const cp of G.checkpoints) {
      const x = sx(cp.s.x), y = sy(cp.s.y);
      if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = '#3bff6b';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - S * 0.35); ctx.lineTo(x + S * 0.22, y);
      ctx.lineTo(x, y + S * 0.35); ctx.lineTo(x - S * 0.22, y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  function drawAttemptText() {
    const x = sx(G.checkpoints.length ? G.checkpoints[G.checkpoints.length - 1].s.x + 4 : 6);
    if (x < -S * 12 || x > W) return;
    ctx.font = `${Math.round(S * 0.9)}px 'Lilita One', system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, S * 0.12);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const label = `Attempt ${G.attempts}`;
    const y = sy(5);
    ctx.strokeText(label, x, y);
    ctx.fillText(label, x, y);
  }

  function drawParts() {
    for (const p of parts) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      const s = p.size * S;
      const x = sx(p.x), y = sy(p.y);
      if (p.square) ctx.fillRect(x - s / 2, y - s / 2, s, s);
      else { ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------ player

  function drawPlayer(s, px, py) {
    const size = (s.mini ? 0.6 : 1) * S;
    if (s.mode === 'wave' && G.trail.length >= 4) drawWaveTrail(s);
    ctx.save();
    ctx.translate(sx(px), sy(py));
    ctx.rotate(G.rot);
    if (s.grav === -1 && s.mode !== 'cube' && s.mode !== 'ball') ctx.scale(1, -1);
    ctx.lineJoin = 'round';
    const lw = Math.max(2, size * 0.08);
    ctx.lineWidth = lw;
    ctx.strokeStyle = '#000';
    switch (s.mode) {
      case 'cube': drawCube(size); break;
      case 'ship': drawShip(size); break;
      case 'ball': drawBall(size); break;
      case 'ufo': drawUfo(size); break;
      case 'wave': drawWave(size); break;
      case 'robot': drawRobot(size, s); break;
      case 'spider': drawSpider(size, s); break;
      case 'swing': drawSwing(size); break;
    }
    ctx.restore();
  }

  function drawCube(z, scale = 1) {
    const h = (z * scale) / 2;
    ctx.fillStyle = COL1;
    ctx.fillRect(-h, -h, 2 * h, 2 * h);
    ctx.strokeRect(-h, -h, 2 * h, 2 * h);
    ctx.fillStyle = COL2;
    const i = h * 0.5;
    ctx.fillRect(-i, -i, 2 * i, 2 * i);
    ctx.strokeRect(-i, -i, 2 * i, 2 * i);
    ctx.fillStyle = '#000';
    ctx.fillRect(-i * 0.7, -i * 0.55, i * 0.45, i * 0.5);
    ctx.fillRect(i * 0.25, -i * 0.55, i * 0.45, i * 0.5);
  }

  function drawShip(z) {
    ctx.save();
    ctx.translate(-z * 0.05, -z * 0.28);
    drawCube(z, 0.5);
    ctx.restore();
    ctx.fillStyle = COL1;
    ctx.beginPath();
    ctx.moveTo(-z * 0.65, -z * 0.05);
    ctx.lineTo(z * 0.25, -z * 0.05);
    ctx.lineTo(z * 0.7, z * 0.12);
    ctx.lineTo(z * 0.35, z * 0.35);
    ctx.lineTo(-z * 0.55, z * 0.35);
    ctx.lineTo(-z * 0.7, z * 0.15);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    ctx.beginPath();
    ctx.moveTo(-z * 0.35, z * 0.08);
    ctx.lineTo(z * 0.25, z * 0.08);
    ctx.lineTo(z * 0.12, z * 0.24);
    ctx.lineTo(-z * 0.35, z * 0.24);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  function drawBall(z) {
    const r = z / 2;
    ctx.fillStyle = COL1;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.82, i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill();
  }

  function drawUfo(z) {
    ctx.save();
    ctx.translate(0, -z * 0.22);
    drawCube(z, 0.45);
    ctx.restore();
    ctx.fillStyle = 'rgba(160,230,255,0.45)';
    ctx.beginPath(); ctx.arc(0, -z * 0.12, z * 0.38, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL1;
    ctx.beginPath(); ctx.ellipse(0, z * 0.12, z * 0.62, z * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    ctx.beginPath(); ctx.ellipse(0, z * 0.12, z * 0.32, z * 0.08, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawWave(z) {
    const h = z * 0.5;
    ctx.fillStyle = COL1;
    ctx.beginPath();
    ctx.moveTo(h * 1.1, 0);
    ctx.lineTo(-h * 0.8, -h * 0.8);
    ctx.lineTo(-h * 0.4, 0);
    ctx.lineTo(-h * 0.8, h * 0.8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    ctx.beginPath();
    ctx.moveTo(h * 0.5, 0);
    ctx.lineTo(-h * 0.3, -h * 0.3);
    ctx.lineTo(-h * 0.3, h * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  function drawWaveTrail(s) {
    ctx.save();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';
    ctx.strokeStyle = COL2;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = S * (s.mini ? 0.18 : 0.3);
    ctx.beginPath();
    ctx.moveTo(sx(G.trail[0]), sy(G.trail[1]));
    for (let i = 2; i < G.trail.length; i += 2) ctx.lineTo(sx(G.trail[i]), sy(G.trail[i + 1]));
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = S * 0.08;
    ctx.stroke();
    ctx.restore();
  }

  function drawRobot(z, s) {
    const t = G.time * 14;
    const step = s.grounded ? Math.sin(t) * z * 0.12 : z * 0.1;
    ctx.fillStyle = COL2;
    ctx.fillRect(-z * 0.32 + step, z * 0.15, z * 0.2, z * 0.35);
    ctx.strokeRect(-z * 0.32 + step, z * 0.15, z * 0.2, z * 0.35);
    ctx.fillRect(z * 0.1 - step, z * 0.15, z * 0.2, z * 0.35);
    ctx.strokeRect(z * 0.1 - step, z * 0.15, z * 0.2, z * 0.35);
    ctx.fillStyle = COL1;
    ctx.fillRect(-z * 0.45, -z * 0.5, z * 0.9, z * 0.7);
    ctx.strokeRect(-z * 0.45, -z * 0.5, z * 0.9, z * 0.7);
    ctx.fillStyle = COL2;
    ctx.fillRect(-z * 0.05, -z * 0.38, z * 0.4, z * 0.22);
    ctx.fillStyle = '#000';
    ctx.fillRect(z * 0.15, -z * 0.34, z * 0.12, z * 0.14);
  }

  function drawSpider(z, s) {
    const t = G.time * 18;
    ctx.strokeStyle = '#000';
    for (let i = 0; i < 4; i++) {
      const lx = -z * 0.38 + i * z * 0.25;
      const k = s.grounded ? Math.sin(t + i * 1.6) * z * 0.08 : 0;
      ctx.lineWidth = Math.max(3, z * 0.12);
      ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx + k - z * 0.06, z * 0.5); ctx.stroke();
      ctx.lineWidth = Math.max(1.5, z * 0.06);
      ctx.strokeStyle = COL2;
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(2, z * 0.08);
    ctx.strokeStyle = '#000';
    ctx.fillStyle = COL1;
    ctx.beginPath(); ctx.ellipse(0, -z * 0.1, z * 0.48, z * 0.3, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    ctx.beginPath(); ctx.ellipse(z * 0.18, -z * 0.14, z * 0.16, z * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function drawSwing(z) {
    ctx.fillStyle = COL2;
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-z * 0.2, d * z * 0.2);
      ctx.lineTo(-z * 0.6, d * z * 0.5);
      ctx.lineTo(z * 0.05, d * z * 0.3);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = COL1;
    ctx.beginPath(); ctx.arc(0, 0, z * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL2;
    ctx.beginPath(); ctx.arc(z * 0.08, 0, z * 0.18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // --------------------------------------------------------------- HUD

  function drawHud() {
    if (!G.s || G.screen === 'menu') return;
    const pct = G.s.won ? 100 : progress();
    const bw = Math.min(W * 0.5, 420), bh = 14;
    const bx = (W - bw) / 2, by = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10);
    ctx.fill();
    ctx.fillStyle = G.practice ? '#3af0ff' : '#7dff3a';
    if (pct > 0) { roundRect(bx, by, bw * pct / 100, bh, 7); ctx.fill(); }
    ctx.font = "18px 'Lilita One', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const label = `${pct}%`;
    ctx.strokeText(label, bx + bw + 12, by + bh / 2);
    ctx.fillText(label, bx + bw + 12, by + bh / 2);
    if (G.practice) {
      ctx.textAlign = 'center';
      ctx.strokeText('PRACTICE', W / 2, by + bh + 18);
      ctx.fillText('PRACTICE', W / 2, by + bh + 18);
    }
    if (G.showFps) {
      ctx.textAlign = 'right';
      ctx.strokeText(`${G.fps} fps`, W - 12, H - 16);
      ctx.fillText(`${G.fps} fps`, W - 12, H - 16);
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- UI

  const $ = (id) => document.getElementById(id);
  const FACE = { Easy: '#3bc8ff', Normal: '#3bff6b', Hard: '#ffd21f', Harder: '#ff7a1f', Insane: '#ff3bd0' };

  function buildMenu() {
    const root = $('levels');
    root.innerHTML = '';
    LEVELS.forEach((L, i) => {
      const best = store.get('best:' + i, 0), prac = store.get('practice:' + i, 0);
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="top">
          <div class="face" style="background:${FACE[L.difficulty] || '#fff'}"></div>
          <div>
            <div class="name">${L.name}</div>
            <div class="meta">${L.difficulty} &middot; <span class="star">&#9733;</span> ${L.stars}</div>
          </div>
        </div>
        <div class="barlabel"><span>Normal</span><span>${best}%</span></div>
        <div class="bar"><i style="width:${best}%"></i></div>
        <div class="barlabel"><span>Practice</span><span>${prac}%</span></div>
        <div class="bar p"><i style="width:${prac}%"></i></div>
        <div class="btns">
          <button data-play="${i}">Play</button>
          <button class="alt" data-practice="${i}">Practice</button>
        </div>`;
      root.appendChild(card);
    });
    root.querySelectorAll('[data-play]').forEach((b) =>
      b.addEventListener('click', () => startLevel(+b.dataset.play, false)));
    root.querySelectorAll('[data-practice]').forEach((b) =>
      b.addEventListener('click', () => startLevel(+b.dataset.practice, true)));
  }

  function show(screen) {
    G.screen = screen;
    $('menu').classList.toggle('show', screen === 'menu');
    $('pause').classList.toggle('show', screen === 'pause');
    $('complete').classList.toggle('show', screen === 'complete');
    $('hud').classList.toggle('show', screen === 'play');
    $('cpbtns').classList.toggle('show', screen === 'play' && G.practice);
    if (screen === 'menu') { G.s = null; buildMenu(); }
  }

  function pause() {
    if (G.s && G.s.won) return;
    release();
    show('pause');
    if (AUDIO.ctx) AUDIO.ctx.suspend();
    $('pauseTitle').textContent = G.L.name;
    $('pauseStats').innerHTML = `${progress()}% &middot; Attempt ${G.attempts}<br>Best: ${store.get('best:' + G.idx, 0)}%`;
    $('practiceBtn').textContent = G.practice ? 'Normal Mode' : 'Practice Mode';
  }

  function resume() {
    if (AUDIO.ctx) AUDIO.ctx.resume();
    last = performance.now();
    show('play');
  }

  function toggleFps() {
    G.showFps = !G.showFps;
    store.set('fps', G.showFps);
    $('fpsBtn').textContent = `FPS: ${G.showFps ? 'On' : 'Off'}`;
  }

  $('pauseBtn').addEventListener('click', (e) => { e.stopPropagation(); pause(); });
  $('pauseBtn').addEventListener('pointerdown', (e) => e.stopPropagation());
  $('cpAdd').addEventListener('pointerdown', (e) => { e.stopPropagation(); addCheckpoint(); });
  $('cpDel').addEventListener('pointerdown', (e) => { e.stopPropagation(); removeCheckpoint(); });
  $('resumeBtn').addEventListener('click', resume);
  $('restartBtn').addEventListener('click', () => { if (AUDIO.ctx) AUDIO.ctx.resume(); restart(true); });
  $('practiceBtn').addEventListener('click', () => {
    if (AUDIO.ctx) AUDIO.ctx.resume();
    G.practice = !G.practice;
    G.checkpoints = [];
    restart(true);
  });
  $('menuBtn').addEventListener('click', () => { if (AUDIO.ctx) AUDIO.ctx.resume(); AUDIO.stop(); show('menu'); });
  $('menuBtn2').addEventListener('click', () => show('menu'));
  $('againBtn').addEventListener('click', () => { G.attempts = 0; G.jumps = 0; G.time = 0; restart(true); });

  let musicOn = store.get('music', true);
  AUDIO.setEnabled(musicOn);
  $('musicBtn').textContent = `Music: ${musicOn ? 'On' : 'Off'}`;
  $('musicBtn').addEventListener('click', () => {
    musicOn = !musicOn;
    store.set('music', musicOn);
    AUDIO.setEnabled(musicOn);
    $('musicBtn').textContent = `Music: ${musicOn ? 'On' : 'Off'}`;
  });
  $('fpsBtn').textContent = `FPS: ${G.showFps ? 'On' : 'Off'}`;
  $('fpsBtn').addEventListener('click', toggleFps);

  window.GD = G; // handy from the console when building levels
  show('menu');
  requestAnimationFrame(frame);
})();
