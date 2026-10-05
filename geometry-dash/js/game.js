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
  const FACES = window.GDFaces;
  const LEVELS = window.GDLevels.map(P.compile);
  for (const L of LEVELS) L.coinIds = L.objects.filter((o) => o.t === 'coin').map((o) => o.id);

  const VIEW_H = 10.67;        // blocks visible vertically, same as GD's 320 units
  const PLAYER_SCREEN_X = 0.3; // fraction of screen width the player sits at (landscape)
  const MAX_DPR = 2;

  const PORTAL_COL = {
    cube: '#3bff6b', ship: '#ff4fd8', ball: '#ff4a3b', ufo: '#ff9e2b', wave: '#2bc0ff',
    robot: '#f2f2f2', spider: '#a04bff', swing: '#ffe23b',
    'grav+': '#ffd21f', 'grav-': '#2b8bff', mini: '#3bff9b', big: '#ff4fd8',
    s0: '#ff9e2b', s1: '#36b3ff', s2: '#3bff6b', s3: '#ff4fd8', s4: '#ff3b3b',
  };
  const ORB_COL = { yellow: '#ffe23b', pink: '#ff6bd8', red: '#ff3b3b', blue: '#3bc8ff', green: '#4bff5b', black: '#222', dash: '#5bffb0', dashp: '#ff6bd8' };
  const PAD_COL = { yellow: '#ffe23b', pink: '#ff6bd8', red: '#ff3b3b', blue: '#3bc8ff' };
  const MODE_LABEL = { cube: 'Cube', ship: 'Ship', ball: 'Ball', ufo: 'UFO', wave: 'Wave', robot: 'Robot', spider: 'Spider', swing: 'Swing' };

  // ----------------------------------------------------------- storage

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('gdr:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem('gdr:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const bump = (k, n = 1) => store.set(k, store.get(k, 0) + n);

  // ---------------------------------------------------------- settings

  const SET = Object.assign({
    music: store.get('music', true) === false ? 0 : 0.8, sfx: 0.9,
    fps: store.get('fps', false), pct: true, hitboxes: false, autoCp: false,
    fastRespawn: false, lowDetail: false, shake: true,
  }, store.get('settings', {}));
  const saveSet = () => store.set('settings', SET);
  const SETTINGS_UI = [
    ['music', 'Music volume', 'range'],
    ['sfx', 'Sound effects', 'range'],
    ['pct', 'Show percentage', 'bool'],
    ['fps', 'Show FPS', 'bool', 'F toggles it in game'],
    ['shake', 'Screen shake', 'bool'],
    ['fastRespawn', 'Fast respawn', 'bool', 'Half-second restarts'],
    ['autoCp', 'Auto checkpoints', 'bool', 'Practice mode drops one every 2s'],
    ['hitboxes', 'Show hitboxes', 'bool', 'In practice and mode practice'],
    ['lowDetail', 'Low detail', 'bool', 'Skips decoration for older devices'],
  ];

  // -------------------------------------------------------------- skin

  const PALETTE = [
    '#7dff3a', '#3af0ff', '#ffe23b', '#ff9e2b', '#ff3b3b', '#ff4fd8', '#a04bff', '#3b6bff',
    '#00c878', '#00a0ff', '#ffc0e0', '#ffffff', '#b0b0b0', '#505050', '#000000', '#8b4a1f',
  ];
  const ICONS = window.GDIcons;
  const SKIN = Object.assign({ c1: '#7dff3a', c2: '#3af0ff', glow: false, icons: {} }, store.get('skin', {}));
  SKIN.icons = SKIN.icons || {};
  const saveSkin = () => store.set('skin', SKIN);

  // ------------------------------------------------------------ unlocks
  // Everyone starts with icon 0 of each mode. Every level beaten (main or
  // mode practice, normal mode) unlocks the next icon in GDIcons.ORDER.
  let beatenCache = -1;
  function levelsBeaten() {
    if (beatenCache >= 0) return beatenCache;
    let n = 0;
    for (let i = 0; i < LEVELS.length; i++) if (store.get('best:' + (LEVELS[i].slot || String(i)), 0) === 100) n++;
    return (beatenCache = n);
  }
  function isUnlocked(mode, v) {
    if (v === 0) return true;
    const k = ICONS.ORDER.findIndex(([m, x]) => m === mode && x === v);
    return k >= 0 && k < levelsBeaten();
  }
  function equipped(mode) {
    const v = SKIN.icons[mode] || 0;
    return isUnlocked(mode, v) ? v : 0;
  }

  // ------------------------------------------------------------ canvas

  const canvas = document.getElementById('game');
  const mainCtx = canvas.getContext('2d', { alpha: false });
  let ctx = mainCtx; // swapped briefly to draw icon previews in menus
  let W = 0, H = 0, S = 40, VIEW_W = 16, dpr = 1, viewH = VIEW_H;
  const groundLift = () => (W < H ? viewH * 0.38 : 2.2);
  const TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let lowQuality = false; // set when the device can't hold frame rate
  const detail = () => !SET.lowDetail && !lowQuality;

  function playerX() { return W < H ? 0.18 : PLAYER_SCREEN_X; }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, lowQuality ? 1 : MAX_DPR);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    // Portrait: fit ~15 blocks across so there's room to see what's coming.
    S = W < H ? W / 15 : Math.min(H / VIEW_H, W / 11);
    viewH = H / S;
    VIEW_W = W / S;
  }
  window.addEventListener('resize', resize);
  resize();

  // ------------------------------------------------------------- state

  const G = {
    screen: 'home', returnTo: 'select',
    idx: 0, L: null, s: null,
    prevX: 0, prevY: 0, acc: 0,
    attempts: 1, jumps: 0, time: 0, cpTimer: 0,
    practice: false, checkpoints: [],
    deadTimer: 0, camX: 0, camY: -2.2,
    rot: 0, trail: [], lastMode: 'cube',
    fps: 60, fpsAcc: 0, fpsN: 0,
    shake: 0, flash: 0, streaks: [], popup: null, t: 0, ptrail: [], coinSeen: 0,
    menuBg: ['#2b5bff', '#1a3acc'], menuBgNow: ['#2b5bff', '#1a3acc'],
    page: store.get('page', 0), kitMode: 'cube', prMode: store.get('prMode', 'cube'), prMini: store.get('prMini', false),
  };
  let held = false;
  let pendingJumps = 0;

  // --------------------------------------------------------- particles

  const MAX_PARTS = 500;
  const parts = [];
  for (let i = 0; i < MAX_PARTS; i++) parts.push({ life: 0 });
  let partIdx = 0;
  // fire: shrinking, no gravity, drawn behind the player (robot boost jet)
  function spawn(x, y, vx, vy, life, size, color, square, fire = false) {
    const p = parts[partIdx];
    partIdx = (partIdx + 1) % MAX_PARTS;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = life; p.max = life;
    p.size = size; p.color = color; p.square = square; p.fire = fire;
  }
  function updateParts(dt) {
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.fire) {
        p.vx *= 1 - dt * 3; p.vy *= 1 - dt * 3;
        // Sparks skid along the ground instead of sinking through it.
        if (p.y < 0.08 && p.vy < 0) { p.y = 0.08; p.vy = 0; p.vx -= 4 * dt * 60 * 0.05; }
      } else p.vy -= 6 * dt;
    }
  }

  const FLAME = ['#fff0a0', '#ffd21f', '#ffa31f', '#ff6a1f', '#ff3a14', '#e0200f'];
  function flame(s, n, power) {
    const half = P.size(s) / 2;
    for (let i = 0; i < n; i++) {
      const k = Math.random();
      spawn(s.x - half * 0.2 + (Math.random() - 0.5) * half * 0.9, s.y - half * 0.85 * s.grav,
        -1.5 - Math.random() * 2.5 + (Math.random() - 0.5) * 2, -s.grav * (power * (3 + Math.random() * 5)),
        0.16 + Math.random() * 0.18, (0.18 + Math.random() * 0.2) * half * 2,
        FLAME[Math.floor(k * k * FLAME.length)], false, true);
    }
  }

  // ----------------------------------------------------------- colours

  function hex(c) {
    if (c[0] !== '#') { const m = c.match(/\d+/g); return [+m[0], +m[1], +m[2]]; }
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb(a, alpha) {
    return alpha == null ? `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})` : `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${alpha})`;
  }
  function mix(a, b, t) {
    const A = hex(a), B = hex(b);
    return rgb([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
  }
  function shade(c, k, alpha) { const A = hex(c); return rgb([A[0] * k, A[1] * k, A[2] * k], alpha); }
  function tint(c, k, alpha) { const A = hex(c); return rgb([A[0] + (255 - A[0]) * k, A[1] + (255 - A[1]) * k, A[2] + (255 - A[2]) * k], alpha); }

  // Background / ground colours, blended over 8 blocks after each trigger.
  function levelColors(L, x) {
    const cs = L.colors;
    let i = 0;
    while (i + 1 < cs.length && cs[i + 1].x <= x) i++;
    const cur = cs[i], prev = cs[Math.max(0, i - 1)];
    const t = i === 0 ? 1 : Math.min(1, Math.max(0, (x - cur.x) / 8));
    return { bg: mix(prev.bg, cur.bg, t), gr: mix(prev.gr, cur.gr, t) };
  }

  const sx = (x) => (x - G.camX) * S;
  const sy = (y) => H - (y - G.camY) * S;

  // ------------------------------------------------------------- input

  function press() {
    if (G.screen !== 'play') return;
    if (!held) { G.jumps++; pendingJumps++; }
    held = true;
  }
  function release() { held = false; }
  function releaseAll() { pointers.clear(); held = false; }

  const JUMP_KEYS = new Set(['Space', 'ArrowUp', 'KeyW']);
  window.addEventListener('keydown', (e) => {
    if (G.screen === 'play' && (JUMP_KEYS.has(e.code) || e.code === 'Enter')) {
      e.preventDefault(); if (!e.repeat) press();
      return;
    }
    if (e.repeat) return;
    const scr = G.screen;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (scr === 'play') pause();
      else if (scr === 'pause') resume();
      else if (scr === 'settings') closeSettings();
      else if (scr !== 'home' && scr !== 'complete') show('home');
    } else if (e.code === 'KeyR' && (scr === 'play' || scr === 'pause')) restart(true);
    else if (e.code === 'KeyZ' && scr === 'play') addCheckpoint();
    else if (e.code === 'KeyX' && scr === 'play') removeCheckpoint();
    else if (e.code === 'KeyF') { SET.fps = !SET.fps; saveSet(); }
    else if (scr === 'select') {
      if (e.code === 'ArrowLeft') setPage(G.page - 1);
      else if (e.code === 'ArrowRight') setPage(G.page + 1);
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); startLevel(MAIN[G.page], false, 'select'); }
    } else if (scr === 'home' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); show('select'); }
    else if (scr === 'complete' && e.code === 'Enter') ($('nextBtn').style.display !== 'none' ? $('nextBtn') : $('againBtn')).click();
  });
  window.addEventListener('keyup', (e) => { if (JUMP_KEYS.has(e.code) || e.code === 'Enter') release(); });

  // Track every finger so lifting one while another is down doesn't drop the hold.
  const pointers = new Set();
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); pointers.add(e.pointerId); press(); });
  const lift = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) release(); };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  window.addEventListener('contextmenu', (e) => { if (G.screen === 'play') e.preventDefault(); });
  canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('blur', () => { releaseAll(); if (G.screen === 'play') pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.screen === 'play') pause(); });

  // ---------------------------------------------------------- gameplay

  // Phones: go fullscreen and try to lock landscape. Both are best-effort;
  // iPhone Safari supports neither, which is what the rotate prompt is for.
  function goFullscreen() {
    if (!TOUCH) return;
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      const pr = req.call(el, { navigationUI: 'hide' });
      if (pr && pr.then) {
        pr.then(() => {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
        }).catch(() => {});
      }
    } catch (e) { /* not allowed here */ }
  }

  // Save-slot for a level: main levels keep their index (so old saves still
  // line up), practice tiers use their mode/tier id.
  const slotOf = (i) => LEVELS[i].slot || String(i);
  const bestOf = (i, practice) => store.get((practice ? 'practice:' : 'best:') + slotOf(i), 0);

  function startLevel(idx, practice, from) {
    goFullscreen();
    G.idx = idx;
    G.L = LEVELS[idx];
    G.practice = practice;
    G.returnTo = from || G.returnTo;
    G.checkpoints = [];
    G.attempts = 1;
    G.jumps = 0;
    G.time = 0;
    G.prevBest = bestOf(idx, practice);
    bump('attempts'); bump('att:' + slotOf(idx));
    spawnPlayer();
    show('play');
    AUDIO.start(G.L);
  }

  function spawnPlayer() {
    const cp = G.checkpoints[G.checkpoints.length - 1];
    G.s = cp ? P.clone(cp.s) : P.create(G.L);
    G.s.held = held;
    G.prevX = G.s.x; G.prevY = G.s.y;
    G.acc = 0; G.deadTimer = 0; G.cpTimer = 0;
    G.trail.length = 0; G.streaks.length = 0; G.ptrail.length = 0;
    G.coinSeen = G.s.coins.length;
    G.ownedCoins = store.get('coins:' + slotOf(G.idx), []);
    G.lastMode = G.s.mode;
    G.rot = cp ? cp.rot : 0;
    G.camX = G.s.x - VIEW_W * playerX();
    G.camY = cp ? cp.camY : -groundLift();
    G.flash = 0;
  }

  function restart(fresh) {
    if (fresh) G.checkpoints = [];
    G.attempts++;
    bump('attempts'); bump('att:' + slotOf(G.idx));
    spawnPlayer();
    if (!G.practice || fresh) AUDIO.start(G.L);
    show('play');
  }

  function addCheckpoint() {
    if (!G.practice || !G.s || G.s.dead || G.s.won) return;
    G.checkpoints.push({ s: P.clone(G.s), rot: G.rot, camY: G.camY });
  }
  function removeCheckpoint() { if (G.practice) G.checkpoints.pop(); }

  function flushJumps() { if (pendingJumps) { bump('jumps', pendingJumps); pendingJumps = 0; } }

  function die() {
    const s = G.s;
    AUDIO.crash();
    if (!G.practice) AUDIO.stop();
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 10;
      spawn(s.x, s.y, Math.cos(a) * v, Math.sin(a) * v, 0.5 + Math.random() * 0.6,
        0.1 + Math.random() * 0.24, Math.random() < 0.5 ? SKIN.c1 : SKIN.c2, true);
    }
    if (SET.shake) G.shake = 0.35;
    G.flash = 1;
    G.deadTimer = SET.fastRespawn ? 0.5 : 1.0;
    const pct = Math.min(99, progress());
    if (pct > bestOf(G.idx, G.practice) && pct >= 5) {
      G.popup = { text: G.practice ? 'Practice best!' : 'New Best!', sub: pct + '%', t: 1.3 };
    }
    saveBest(pct);
    bump('deaths');
    flushJumps();
  }

  function win() {
    AUDIO.stop();
    AUDIO.win();
    const first = !G.practice && bestOf(G.idx, false) < 100;
    const before = levelsBeaten();
    saveBest(100);
    if (!G.practice && G.s.coins.length) {
      const got = new Set(store.get('coins:' + slotOf(G.idx), []));
      for (const id of G.s.coins) got.add(G.L.coinIds.indexOf(id));
      store.set('coins:' + slotOf(G.idx), [...got]);
    }
    beatenCache = -1;
    const unlock = first ? ICONS.ORDER[before] : null;
    flushJumps();
    if (first) bump('cleared');
    for (let i = 0; i < 140; i++) {
      const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 12;
      spawn(G.s.x, G.s.y, Math.cos(a) * v, Math.sin(a) * v + 4, 1 + Math.random(),
        0.12 + Math.random() * 0.2, ['#ffe23b', SKIN.c1, SKIN.c2, '#ff4fd8'][i % 4], i % 2 === 0);
    }
    const L = G.L;
    $('completeStats').innerHTML = `${L.name}${G.practice ? ' (practice)' : ''}<br>` +
      `Attempts: ${G.attempts} &middot; Jumps: ${G.jumps} &middot; Time: ${G.time.toFixed(1)}s`;
    $('completeEarn').textContent = first && !L.training ? `+${L.stars} ★` : first ? 'Cleared!' : '';
    $('unlockBox').style.display = unlock ? '' : 'none';
    if (unlock) {
      $('unlockName').textContent = `New ${MODE_LABEL[unlock[0]]} icon: ${ICONS.name(unlock[0], unlock[1])}`;
      iconCanvasV($('unlockCv'), unlock[0], 64, 0.7, unlock[1]);
    }
    faceCanvas($('completeFace'), L.difficulty, 96, auraOf(L));
    const next = nextLevel();
    $('nextBtn').style.display = next == null ? 'none' : '';
    setTimeout(() => { if (G.screen === 'play' && G.s.won) show('complete'); }, 1400);
  }

  // The next level in whichever list the player came from.
  function nextLevel() {
    if (G.L.training) {
      const list = PRACTICE[!!G.L.mini][G.L.mode];
      return G.L.tier + 1 < list.length ? list[G.L.tier + 1] : null;
    }
    const k = MAIN.indexOf(G.idx);
    return k >= 0 && k + 1 < MAIN.length ? MAIN[k + 1] : null;
  }

  function progress() { return Math.max(0, Math.min(100, Math.floor((G.s.x / G.L.length) * 100))); }

  function saveBest(pct) {
    const k = (G.practice ? 'practice:' : 'best:') + slotOf(G.idx);
    if (pct > store.get(k, 0)) store.set(k, pct);
  }

  // --------------------------------------------------------------- loop

  let last = performance.now();
  let portraitOk = false;
  const needsRotate = () => TOUCH && !portraitOk && H > W;

  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1; // tab was asleep; don't fast-forward the run
    G.t += dt;

    G.fpsAcc += dt; G.fpsN++;
    if (G.fpsAcc >= 0.5) {
      G.fps = Math.round(G.fpsN / G.fpsAcc); G.fpsAcc = 0; G.fpsN = 0;
      // Three slow windows in a row while playing: render at 1x pixel density.
      if (G.screen === 'play' && !lowQuality) {
        G.slow = G.fps < 45 ? (G.slow || 0) + 1 : 0;
        if (G.slow >= 3) { lowQuality = true; resize(); }
      }
    }

    if (G.screen === 'play' && needsRotate()) {
      if (!$('rotate').classList.contains('show')) { releaseAll(); $('rotate').classList.add('show'); }
      if (AUDIO.ctx && AUDIO.ctx.state === 'running') AUDIO.ctx.suspend();
    } else {
      if ($('rotate').classList.contains('show')) {
        $('rotate').classList.remove('show');
        if (G.screen === 'play' && AUDIO.ctx) AUDIO.ctx.resume();
      }
      if (G.screen === 'play') update(dt);
    }
    if (G.s) render(dt);
    else renderMenuBg(dt);
    animateFaces(dt);
    requestAnimationFrame(frame);
  }

  function update(dt) {
    const s = G.s;
    updateParts(dt);
    for (const k of G.streaks) k.life -= dt;
    while (G.streaks.length && G.streaks[0].life <= 0) G.streaks.shift();
    G.shake = Math.max(0, G.shake - dt);
    G.flash = Math.max(0, G.flash - dt * 3);
    if (G.popup && (G.popup.t -= dt) <= 0) G.popup = null;
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
      if (s.teleported) {
        // GD-style spider streak from where it was to where it landed.
        G.streaks.push({ x: s.x, y0: G.prevY, y1: s.y, w: P.size(s), life: 0.3 });
        G.prevX = s.x; G.prevY = s.y;
      }
      if (s.dead) { die(); break; }
      if (s.won) { win(); break; }
    }
    if (s.dead || s.won) return;
    if (G.practice && SET.autoCp) {
      G.cpTimer += dt;
      if (G.cpTimer >= 2 && (s.grounded || s.bounds)) { addCheckpoint(); G.cpTimer = 0; }
    }
    visuals(dt);
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

    const boosting = s.mode === 'robot' && s.boost > 0 && s.held;
    if (boosting) {
      if (!G.wasBoost) flame(s, 14, 1.4);
      G.fireAcc = (G.fireAcc || 0) + dt * 140;
      const n = Math.floor(G.fireAcc);
      G.fireAcc -= n;
      flame(s, n, 1);
    }
    G.wasBoost = boosting;

    if (s.mode === 'wave') {
      G.trail.push(s.x, s.y);
      while (G.trail.length > 2 && G.trail[0] < G.camX - 1) G.trail.splice(0, 2);
    }
    // Light trail for flying icons and dashes (the wave draws its own).
    if (s.dash || (s.mode !== 'wave' && s.mode !== 'cube' && s.mode !== 'robot' && !s.grounded)) {
      G.ptrail.push(s.x, s.y, G.t);
    }
    while (G.ptrail.length && G.t - G.ptrail[2] > 0.3) G.ptrail.splice(0, 3);
    if (s.dash && Math.random() < dt * 80) {
      spawn(s.x - 0.4, s.y + (Math.random() - 0.5) * 0.8, -8 - Math.random() * 6, 0, 0.2, 0.06 + Math.random() * 0.05, '#fff', true);
    }
    // Coin pickup sparkle
    if (s.coins.length > G.coinSeen) {
      G.coinSeen = s.coins.length;
      for (let i = 0; i < 24; i++) {
        const a = Math.random() * Math.PI * 2;
        spawn(s.x, s.y, Math.cos(a) * 5, Math.sin(a) * 5 + 2, 0.6, 0.12, i % 2 ? '#ffe066' : '#fff', true);
      }
      G.popup = { text: 'Coin!', sub: `${G.coinSeen}/${G.L.coinCount}`, t: 0.9 };
    }
    if (s.grounded && Math.random() < dt * 40 && s.mode !== 'wave') {
      const half = P.size(s) / 2;
      spawn(s.x - half, s.y - half * s.grav, -2 - Math.random() * 2, 1.5 * s.grav * Math.random(),
        0.3, 0.08 + Math.random() * 0.06, SKIN.c1, true);
    }
    if ((s.mode === 'ship' || s.mode === 'ufo' || s.mode === 'swing') && Math.random() < dt * 60) {
      spawn(s.x - 0.5, s.y - 0.1 * s.grav, -3 - Math.random() * 2, (Math.random() - 0.5) * 2,
        0.35, 0.1 + Math.random() * 0.08, Math.random() < 0.5 ? '#ffb43b' : '#ffe23b', false);
    }
  }

  // ------------------------------------------------------- scenery data

  function lcg(seed) {
    let a = seed;
    return () => ((a = (a * 16807) % 2147483647) / 2147483647);
  }
  const BG_SQUARES = [], SKYLINE = [], DOTS = [];
  (function () {
    const r = lcg(7);
    for (let i = 0; i < 26; i++) BG_SQUARES.push({ x: r() * 64, y: r() * 14 - 2, s: 1.5 + r() * 4, a: 0.04 + r() * 0.06 });
    // Far skyline: towers and spires repeating every 96 blocks.
    for (let x = 0; x < 96;) {
      const w = 2 + Math.floor(r() * 5);
      SKYLINE.push({ x, w, h: 2 + r() * 7, spire: r() < 0.25 });
      x += w + (r() < 0.3 ? 1 : 0);
    }
    for (let i = 0; i < 40; i++) DOTS.push({ x: r(), y: r(), s: 0.04 + r() * 0.1, v: 0.01 + r() * 0.03, ph: r() * 6 });
  })();

  // -------------------------------------------------------------- render

  function renderMenuBg(dt) {
    G.camX += dt * 5;
    G.camY = -groundLift();
    const k = Math.min(1, dt * 3);
    G.menuBgNow = [mix(G.menuBgNow[0], G.menuBg[0], k), mix(G.menuBgNow[1], G.menuBg[1], k)];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackground(G.menuBgNow[0], G.menuBgNow[1], AUDIO.pulse());
    drawGround(G.menuBgNow[1], 0);
  }

  function render(dt) {
    const s = G.s, L = G.L;
    const alpha = s.dead || s.won ? 1 : G.acc / P.DT;
    const px = G.prevX + (s.x - G.prevX) * alpha;
    const py = G.prevY + (s.y - G.prevY) * alpha;

    G.camX = px - VIEW_W * playerX();
    let targetY;
    if (s.bounds) {
      targetY = (s.bounds.floor + s.bounds.ceil) / 2 - viewH / 2;
    } else {
      targetY = G.camY;
      const top = viewH - 3.5, bot = groundLift() + 0.4;
      if (py - targetY > top) targetY = py - top;
      if (py - targetY < bot) targetY = py - bot;
      targetY = Math.max(-groundLift(), targetY);
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
    drawObjects(L, pulse, col);
    if (s.bounds) drawCeiling(col.gr, s.bounds.ceil);
    drawGround(col.gr, s.bounds ? s.bounds.floor : 0);
    if (s.bounds && detail()) { drawThorns(sy(s.bounds.floor), 1); drawThorns(sy(s.bounds.ceil), -1); }
    if (SET.hitboxes && (G.practice || L.training)) drawHitboxes(L, s);
    drawCheckpoints();
    drawAttemptText();
    drawParts(true);
    drawStreaks();
    drawTrail(s);
    if (!s.dead) drawPlayer(s, px, py);
    drawParts(false);
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHud();
  }

  function drawBackground(bg, gr, pulse) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, shade(bg, 0.5 + pulse * 0.08));
    grad.addColorStop(1, bg);
    ctx.fillStyle = grad;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    const ground = sy(0);
    if (detail()) {
      // Soft light source that breathes with the beat.
      const lg = ctx.createRadialGradient(W * 0.72, H * 0.28, 0, W * 0.72, H * 0.28, Math.max(W, H) * 0.6);
      lg.addColorStop(0, tint(bg, 0.5, 0.22 + pulse * 0.12));
      lg.addColorStop(1, tint(bg, 0.5, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      // Skyline, far parallax.
      const base = ground * 0.45 + H * 0.55;
      const off = (G.camX * 0.06) % 96;
      ctx.fillStyle = shade(bg, 0.42, 0.6);
      for (let rep = -1; rep <= Math.ceil(VIEW_W / 96 / 0.9) + 1; rep++) {
        for (const b of SKYLINE) {
          const x = (b.x - off + rep * 96) * S * 0.9;
          const w = b.w * S * 0.9;
          if (x > W || x + w < 0) continue;
          const h = b.h * S * 0.55;
          ctx.fillRect(x, base - h, w - 1, h + H);
          if (b.spire) ctx.fillRect(x + w * 0.4, base - h - S * 0.8, w * 0.2, S * 0.8);
        }
      }
      // Window lights on the skyline
      ctx.fillStyle = tint(bg, 0.6, 0.18);
      for (let rep = -1; rep <= Math.ceil(VIEW_W / 96 / 0.9) + 1; rep++) {
        for (const b of SKYLINE) {
          const x = (b.x - off + rep * 96) * S * 0.9;
          if (x > W || x + b.w * S * 0.9 < 0 || b.w < 3) continue;
          const h = b.h * S * 0.55;
          for (let wy = base - h + S * 0.3; wy < base - S * 0.2; wy += S * 0.5) {
            ctx.fillRect(x + S * 0.3, wy, S * 0.18, S * 0.18);
            ctx.fillRect(x + b.w * S * 0.9 - S * 0.5, wy, S * 0.18, S * 0.18);
          }
        }
      }
    }
    // Parallax squares
    const off = (G.camX * 0.15) % 64;
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
    if (detail()) {
      // Drifting motes
      ctx.fillStyle = '#fff';
      for (const d of DOTS) {
        const x = ((d.x * W - G.camX * S * 0.3) % W + W) % W;
        const y = ((d.y - G.t * d.v) % 1 + 1) % 1 * H;
        ctx.globalAlpha = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(G.t * 2 + d.ph)) + pulse * 0.15;
        const z = d.s * S;
        ctx.fillRect(x, y, z, z);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawGround(gr, floorY) {
    const y = sy(floorY);
    if (y > H + 10) return;
    const g = ctx.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, gr);
    g.addColorStop(1, shade(gr, 0.45));
    ctx.fillStyle = g;
    ctx.fillRect(-20, y, W + 40, H - y + 40);
    // Tiles: seams, a lighter top bevel and an inner square on each.
    const step = 4;
    const start = Math.floor(G.camX / step) * step;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let gx = start; gx < G.camX + VIEW_W + step; gx += step) { ctx.moveTo(sx(gx), y); ctx.lineTo(sx(gx), H + 20); }
    ctx.stroke();
    if (detail()) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let gx = start; gx < G.camX + VIEW_W + step; gx += step) ctx.strokeRect(sx(gx) + S * 0.5, y + S * 0.5, S * 3, S * 3);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(-20, y, W + 40, S * 0.12);
    }
    glowLine(y);
  }

  function drawCeiling(gr, ceilY) {
    const y = sy(ceilY);
    if (y < -10) return;
    const g = ctx.createLinearGradient(0, 0, 0, y);
    g.addColorStop(0, shade(gr, 0.45));
    g.addColorStop(1, gr);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -40, W + 40, y + 40);
    glowLine(y);
  }

  function glowLine(y) {
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 1, W, 2);
    if (detail()) {
      ctx.globalAlpha = 0.25;
      ctx.fillRect(0, y - 4, W, 8);
      ctx.globalAlpha = 1;
    }
  }

  let drawStamp = 0;
  function drawObjects(L, pulse, col) {
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
    const top = shade(col.gr, 0.55), edge = tint(col.gr, 0.55);
    if (detail()) drawDecor(L, blocks, pulse, col);
    for (const o of others) if (o.t === 'p') drawPortal(o, pulse, true);
    for (const o of blocks) drawBlock(o, top, edge, pulse);
    if (detail()) drawBlockDeco(blocks, col, pulse);
    for (const o of others) {
      if (o.t === 's' || o.t === 'ss') drawSpike(o, top);
      else if (o.t === 'pad') drawPad(o, pulse);
      else if (o.t === 'orb') drawOrb(o, pulse);
      else if (o.t === 'saw') drawSaw(o, col);
      else if (o.t === 'coin') drawCoin(o);
    }
    if (detail()) drawSigns(others, pulse);
    for (const o of others) if (o.t === 'p') drawPortal(o, pulse, false);
    drawEndLine(L);
  }

  // Render-only scenery: light shafts under floating blocks and beat rings.
  function drawDecor(L, blocks, pulse, col) {
    for (const o of blocks) {
      if (o.y <= 0 || o.h > 3 || o.w > 8) continue;
      const x = sx(o.x), w = o.w * S, yb = sy(o.y), yg = sy(0);
      if (x > W || x + w < 0 || yg <= yb) continue;
      const g = ctx.createLinearGradient(0, yb, 0, yg);
      g.addColorStop(0, tint(col.gr, 0.6, 0.18 + pulse * 0.1));
      g.addColorStop(1, tint(col.gr, 0.6, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x + w * 0.15, yb, w * 0.7, yg - yb);
    }
    // Slowly turning background gears every 16 blocks, half parallax.
    const off = G.camX * 0.5;
    ctx.lineWidth = Math.max(2, S * 0.08);
    for (let k = Math.floor(off / 16) - 1; k <= Math.ceil((off + VIEW_W) / 16) + 1; k++) {
      const x = (k * 16 + 6 - off) * S, y = sy(2.5 + ((k * 7) % 5));
      const R = S * (1.3 + ((k * 13) % 3) * 0.5);
      ctx.strokeStyle = tint(col.bg, 0.55, 0.1 + pulse * 0.12);
      gear(x, y, R, G.t * (k % 2 ? 0.4 : -0.3));
    }
  }

  function gear(x, y, R, rot) {
    const teeth = 12;
    ctx.beginPath();
    for (let i = 0; i <= teeth * 4; i++) {
      const a = rot + (i / (teeth * 4)) * Math.PI * 2;
      const rr = (i % 4 < 2) ? R : R * 0.84;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * 0.18, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R * 0.18, y + Math.sin(a) * R * 0.18);
      ctx.lineTo(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55); ctx.stroke();
    }
  }

  // Deterministic 0..1 noise by integer, for decoration that must not flicker.
  const noise = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

  // Chains under ceiling-hung columns, crystal shards on column tips.
  function drawBlockDeco(blocks, col, pulse) {
    for (const o of blocks) {
      const x = sx(o.x), w = o.w * S;
      if (x > W + S || x + w < -S) continue;
      const hung = G.s && G.s.bounds && o.y > 0.5 && o.y + o.h >= G.s.bounds.ceil - 0.01;
      if (hung && noise(o.id) < 0.5) {
        // Swaying chain with a ring on the end
        const cx = x + w / 2, top = sy(o.y);
        const sway = Math.sin(G.t * 2 + o.id) * S * 0.08;
        ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = Math.max(2, S * 0.07);
        for (let i = 0; i < 4; i++) {
          const yy = top + S * (0.12 + i * 0.22);
          ctx.beginPath(); ctx.ellipse(cx + sway * (i / 4), yy, S * 0.06, S * 0.11, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = tint(col.gr, 0.7);
        ctx.beginPath(); ctx.arc(cx + sway, top + S * 1.12, S * 0.16, 0, Math.PI * 2); ctx.stroke();
      }
      if (o.h >= 2 && o.w <= 2 && noise(o.id + 50) < 0.6) {
        // Shards jutting from the sides near the free end
        const tipY = o.y > 0.5 ? sy(o.y) : sy(o.y + o.h);
        const dir = o.y > 0.5 ? -1 : 1; // toward the column's body
        ctx.fillStyle = tint(col.bg, 0.75, 0.75 + 0.25 * Math.sin(G.t * 3 + o.id));
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
        for (const side of [-1, 1]) {
          const bx = side < 0 ? x : x + w;
          const by = tipY + dir * S * (0.4 + noise(o.id + side) * 0.5);
          ctx.beginPath();
          ctx.moveTo(bx, by - S * 0.18); ctx.lineTo(bx + side * S * (0.45 + noise(o.id * 3 + side) * 0.3), by - dir * S * 0.2);
          ctx.lineTo(bx, by + S * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
    }
  }

  // Glowing arrows ahead of mode portals, "!" ahead of speed changes.
  function drawSigns(others, pulse) {
    for (const o of others) {
      if (o.t !== 'p') continue;
      const speed = o.k[0] === 's';
      if (!speed && !P.MODE_CFG[o.k]) continue;
      const x = sx(o.x - 4), y = Math.min(H - S * 1.5, Math.max(S * 1.5, sy(o.h > 4 ? G.camY + viewH / 2 : o.y)));
      if (x < -S * 2 || x > W + S * 2) continue;
      ctx.globalAlpha = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(G.t * 6)) + pulse * 0.2;
      outlinedText(speed ? '!' : '\u279c', x, y, S * 1.3, 'center', PORTAL_COL[o.k] || '#fff');
      ctx.globalAlpha = 1;
    }
  }

  // Thorny silhouette along a corridor edge; dir 1 = floor, -1 = ceiling.
  function drawThorns(y, dir) {
    ctx.fillStyle = '#000';
    ctx.beginPath();
    const x0 = Math.floor(G.camX * 2) / 2 - 1;
    ctx.moveTo(sx(x0), y + dir * S * 0.5);
    for (let wx = x0; wx < G.camX + VIEW_W + 1; wx += 0.5) {
      const k = Math.round(wx * 2);
      const hgt = S * (0.18 + noise(k) * 0.32);
      ctx.lineTo(sx(wx), y + dir * S * 0.05);
      ctx.lineTo(sx(wx + 0.12 + noise(k + 9) * 0.25), y - dir * hgt);
      ctx.lineTo(sx(wx + 0.5), y + dir * S * 0.05);
    }
    ctx.lineTo(sx(G.camX + VIEW_W + 1), y + dir * S * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  function drawSaw(o, col) {
    const cx = sx(o.x + o.r), cy = sy(o.y + o.r), R = o.r * S;
    if (cx + R < 0 || cx - R > W) return;
    const rot = G.t * 6;
    if (o.chain) {
      ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = Math.max(2, S * 0.07);
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(cx, cy - R - S * (0.1 + i * 0.2), S * 0.05, S * 0.1, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    const n = 14;
    for (let i = 0; i <= n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2;
      const rr = i % 2 ? R * 0.78 : R;
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.65);
    g.addColorStop(0, tint(col.gr, 0.5, 0.9)); g.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.62, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, R * 0.12);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); ctx.stroke();
    }
    ctx.fillStyle = tint(col.gr, 0.7); ctx.beginPath(); ctx.arc(0, 0, R * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // Secret coin: spinning gold disc with a star. Taken this run = gone;
  // collected on an earlier clear = ghostly.
  function drawCoin(o) {
    if (G.s.coins.indexOf(o.id) !== -1) return;
    const x = sx(o.x + 0.5), y = sy(o.y + 0.5) + Math.sin(G.t * 3 + o.id) * S * 0.06;
    if (x < -S || x > W + S) return;
    const owned = (G.ownedCoins || []).indexOf(G.L.coinIds.indexOf(o.id)) !== -1;
    const k = Math.abs(Math.cos(G.t * 2.5)) * 0.8 + 0.2;
    ctx.save();
    ctx.translate(x, y); ctx.scale(k, 1);
    ctx.globalAlpha = owned ? 0.45 : 1;
    const R = S * 0.5;
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R);
    g.addColorStop(0, '#fff6b0'); g.addColorStop(0.5, owned ? '#c8c8d8' : '#ffc61a'); g.addColorStop(1, owned ? '#6a6a80' : '#c07a00');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = owned ? '#9a9ab0' : '#e09000'; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, rr = i % 2 ? R * 0.25 : R * 0.6;
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
    if (detail() && Math.random() < 0.15) spawn(o.x + 0.2 + Math.random() * 0.6, o.y + Math.random(), 0, 0.8, 0.5, 0.08, '#ffe066', true);
  }

  function drawBlock(o, topCol, edgeCol, pulse) {
    const x = sx(o.x), y = sy(o.y + o.h), w = o.w * S, h = o.h * S;
    if (x > W || x + w < 0 || y > H || y + h < 0) return;
    if (detail()) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, topCol);
      g.addColorStop(Math.min(1, S * 1.2 / Math.max(h, 1)), 'rgba(0,0,0,0.9)');
      g.addColorStop(1, 'rgba(0,0,0,0.95)');
      ctx.fillStyle = g;
    } else ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < o.w; i++) { ctx.moveTo(x + i * S, y); ctx.lineTo(x + i * S, y + h); }
    for (let j = 1; j < o.h; j++) { ctx.moveTo(x, y + j * S); ctx.lineTo(x + w, y + j * S); }
    ctx.stroke();
    if (detail()) {
      // Inner bevel and corner studs
      ctx.strokeStyle = edgeCol;
      ctx.globalAlpha = 0.35 + pulse * 0.2;
      ctx.strokeRect(x + S * 0.16, y + S * 0.16, w - S * 0.32, h - S * 0.32);
      ctx.globalAlpha = 1;
      if (w >= S && h >= S) {
        ctx.fillStyle = edgeCol;
        const k = S * 0.1;
        ctx.fillRect(x + S * 0.08, y + S * 0.08, k, k);
        ctx.fillRect(x + w - S * 0.08 - k, y + S * 0.08, k, k);
        ctx.fillRect(x + S * 0.08, y + h - S * 0.08 - k, k, k);
        ctx.fillRect(x + w - S * 0.08 - k, y + h - S * 0.08 - k, k, k);
      }
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.5, S * 0.06);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }

  function drawSpike(o, topCol) {
    const small = o.t === 'ss';
    const x = sx(o.x), base = o.d === -1 ? sy(o.y + 1) : sy(o.y);
    const hgt = (small ? 0.45 : 1) * S * (o.d === -1 ? 1 : -1);
    const inset = small ? S * 0.15 : S * 0.04;
    if (x > W + S || x + S < -S) return;
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
    if (detail() && !small) {
      // Inner facet in the level colour
      ctx.fillStyle = topCol;
      ctx.beginPath();
      ctx.moveTo(x + S * 0.3, base + hgt * 0.12);
      ctx.lineTo(x + S / 2, base + hgt * 0.72);
      ctx.lineTo(x + S * 0.7, base + hgt * 0.12);
      ctx.closePath();
      ctx.fill();
    }
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
    if (detail()) {
      const g = ctx.createLinearGradient(0, 0, 0, -S * 1.2);
      g.addColorStop(0, tint(c, 0, 0.35 + pulse * 0.2));
      g.addColorStop(1, tint(c, 0, 0));
      ctx.fillStyle = g;
      ctx.fillRect(-S * 0.35, -S * 1.2, S * 0.7, S * 1.2);
    }
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
    if (detail()) {
      // Spinning dashed halo
      ctx.save();
      ctx.translate(x, y); ctx.rotate(G.t * 2.5);
      ctx.strokeStyle = c; ctx.lineWidth = S * 0.06;
      ctx.setLineDash([S * 0.25, S * 0.18]);
      ctx.beginPath(); ctx.arc(0, 0, S * 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
    if (o.c === 'dash' || o.c === 'dashp') {
      // Dash orb: double chevron
      ctx.fillStyle = '#fff';
      for (const dx of [-0.12, 0.12]) {
        ctx.beginPath();
        ctx.moveTo(x + (dx - 0.1) * S, y - 0.18 * S); ctx.lineTo(x + (dx + 0.1) * S, y);
        ctx.lineTo(x + (dx - 0.1) * S, y + 0.18 * S); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // GD-style portals. Tall trigger portals (full-height ones placed where
  // the player could be anywhere) draw as a normal-sized portal near the
  // middle of the view, plus a faint beam marking the whole trigger range.
  const PORTAL_VIS = 3.2;
  function drawPortal(o, pulse, back) {
    const c = PORTAL_COL[o.k] || '#fff';
    const x = sx(o.x + 0.5);
    if (x < -S * 2 || x > W + S * 2) return;
    let cy = o.y, h = o.h;
    if (o.h > PORTAL_VIS + 0.5) {
      if (back) {
        const g = ctx.createLinearGradient(x - S * 0.2, 0, x + S * 0.2, 0);
        g.addColorStop(0, tint(c, 0, 0)); g.addColorStop(0.5, tint(c, 0.3, 0.18 + pulse * 0.1)); g.addColorStop(1, tint(c, 0, 0));
        ctx.fillStyle = g;
        ctx.fillRect(x - S * 0.2, sy(o.y + o.h / 2), S * 0.4, o.h * S);
      }
      const mid = G.camY + viewH / 2;
      cy = Math.min(o.y + o.h / 2 - PORTAL_VIS / 2, Math.max(o.y - o.h / 2 + PORTAL_VIS / 2, mid));
      h = PORTAL_VIS;
    }
    const y = sy(cy);
    if (o.k[0] === 's') { if (!back) drawSpeedPortal(o, c, x, y, pulse); return; }
    const rx = S * 0.42, ry = (h / 2) * S;
    const a0 = back ? Math.PI * 0.5 : -Math.PI * 0.5, a1 = back ? Math.PI * 1.5 : Math.PI * 0.5;
    if (back) {
      // Inner glow and a slow swirl
      const g = ctx.createRadialGradient(x, y, 0, x, y, ry);
      g.addColorStop(0, tint(c, 0.4, 0.55 + pulse * 0.2));
      g.addColorStop(1, tint(c, 0, 0.05));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
      if (detail()) {
        ctx.save();
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = S * 0.06;
        for (let i = 0; i < 3; i++) {
          const ph = (G.t * 0.8 + i / 3) % 1;
          ctx.globalAlpha = 1 - ph;
          ctx.beginPath(); ctx.ellipse(x, y, rx * ph, ry * ph, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    // Frame: outer glow, black outline, colour band, white highlight
    if (detail()) {
      ctx.strokeStyle = tint(c, 0.2, 0.25 + pulse * 0.15); ctx.lineWidth = S * 0.6;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0, a1); ctx.stroke();
    }
    ctx.strokeStyle = '#000'; ctx.lineWidth = S * 0.34;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, a0, a1); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = S * (0.22 + pulse * 0.04);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = S * 0.05;
    ctx.beginPath(); ctx.ellipse(x, y, rx - S * 0.05, ry - S * 0.05, 0, a0, a1); ctx.stroke();
    if (back) return;
    // Caps top and bottom
    for (const sgn of [-1, 1]) {
      const yy = y + sgn * ry;
      ctx.fillStyle = c; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - S * 0.28, yy); ctx.lineTo(x, yy + sgn * S * 0.3); ctx.lineTo(x + S * 0.28, yy); ctx.lineTo(x, yy - sgn * S * 0.12);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // Emblem badge above the portal: what it turns you into / does
    const by = y - ry - S * 0.8;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.strokeStyle = c; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, by, S * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.save();
    ctx.translate(x, by);
    if (P.MODE_CFG[o.k]) drawIcon(o.k, S * 0.42, null);
    else if (o.k === 'grav+' || o.k === 'grav-') {
      const d = o.k === 'grav+' ? -1 : 1;
      ctx.fillStyle = c; ctx.strokeStyle = '#000';
      ctx.beginPath(); ctx.moveTo(0, d * S * 0.22); ctx.lineTo(S * 0.18, -d * S * 0.02); ctx.lineTo(S * 0.07, -d * S * 0.02);
      ctx.lineTo(S * 0.07, -d * S * 0.2); ctx.lineTo(-S * 0.07, -d * S * 0.2); ctx.lineTo(-S * 0.07, -d * S * 0.02);
      ctx.lineTo(-S * 0.18, -d * S * 0.02); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      const z = o.k === 'mini' ? S * 0.16 : S * 0.32;
      ctx.fillStyle = c; ctx.strokeStyle = '#000';
      ctx.fillRect(-z / 2, -z / 2, z, z); ctx.strokeRect(-z / 2, -z / 2, z, z);
    }
    ctx.restore();
    if (detail()) {
      // Motes spiralling into the portal
      ctx.fillStyle = c;
      for (let i = 0; i < 8; i++) {
        const ph = (G.t * 0.9 + i / 8) % 1;
        const a = i * 1.7 + G.t * 3;
        const k = 1 - ph;
        ctx.globalAlpha = ph;
        ctx.fillRect(x - S * 1.1 * k + Math.cos(a) * S * 0.15, y + Math.sin(a) * ry * 0.8 * k, S * 0.11, S * 0.11);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Speed portal: a framed panel of chevrons, more chevrons = faster.
  function drawSpeedPortal(o, c, x, y, pulse) {
    const n = { s0: 1, s1: 2, s2: 3, s3: 4, s4: 5 }[o.k];
    const w = S * (0.5 + n * 0.22), h = S * 1.9;
    if (detail()) {
      ctx.fillStyle = tint(c, 0.2, 0.2 + pulse * 0.15);
      roundRect(x - w / 2 - S * 0.25, y - h / 2 - S * 0.25, w + S * 0.5, h + S * 0.5, S * 0.4); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    roundRect(x - w / 2, y - h / 2, w, h, S * 0.25); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2;
    roundRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6, S * 0.2); ctx.stroke();
    ctx.fillStyle = c; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const cx = x + (i - (n - 1) / 2) * S * 0.24 + Math.sin(G.t * 6 - i) * S * 0.03;
      ctx.beginPath();
      ctx.moveTo(cx - S * 0.16, y - S * 0.6); ctx.lineTo(cx + S * 0.16, y);
      ctx.lineTo(cx - S * 0.16, y + S * 0.6); ctx.lineTo(cx - S * 0.04, y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
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

  function drawHitboxes(L, s) {
    ctx.lineWidth = 2;
    const x0 = Math.max(0, Math.floor(G.camX) - 1), x1 = Math.min(L.buckets.length - 1, Math.ceil(G.camX + VIEW_W) + 1);
    const seen = new Set();
    for (let i = x0; i <= x1; i++) {
      for (const o of L.buckets[i]) {
        if (seen.has(o)) continue;
        seen.add(o);
        if (o.t === 'b') {
          ctx.strokeStyle = 'rgba(80,160,255,0.9)';
          ctx.strokeRect(sx(o.x), sy(o.y + o.h), o.w * S, o.h * S);
        } else if (o.t === 's' || o.t === 'ss') {
          const h = P.hazardBox(o);
          ctx.strokeStyle = 'rgba(255,60,60,0.95)';
          ctx.strokeRect(sx(h[0]), sy(h[3]), (h[2] - h[0]) * S, (h[3] - h[1]) * S);
        }
      }
    }
    const half = P.size(s) / 2;
    ctx.strokeStyle = 'rgba(255,60,60,0.95)';
    ctx.strokeRect(sx(s.x - half), sy(s.y + half), half * 2 * S, half * 2 * S);
    const inner = s.mode === 'wave' ? half * 0.6 : half * 0.3;
    ctx.strokeStyle = 'rgba(80,160,255,0.95)';
    ctx.strokeRect(sx(s.x - inner), sy(s.y + inner), inner * 2 * S, inner * 2 * S);
  }

  function drawCheckpoints() {
    if (!G.practice) return;
    for (const cp of G.checkpoints) {
      const x = sx(cp.s.x), y = sy(cp.s.y);
      if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = '#3bff6b'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y - S * 0.35); ctx.lineTo(x + S * 0.22, y);
      ctx.lineTo(x, y + S * 0.35); ctx.lineTo(x - S * 0.22, y);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }

  function outlinedText(text, x, y, px, align = 'left', fill = '#fff') {
    ctx.font = `${Math.round(px)}px 'Lilita One', system-ui, sans-serif`;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, px * 0.14); ctx.strokeStyle = '#000'; ctx.fillStyle = fill;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y); ctx.fillText(text, x, y);
  }

  function drawAttemptText() {
    const x = sx(G.checkpoints.length ? G.checkpoints[G.checkpoints.length - 1].s.x + 4 : 6);
    if (x < -S * 12 || x > W) return;
    outlinedText(`Attempt ${G.attempts}`, x, sy(5), S * 0.9);
  }

  function drawTrail(s) {
    const tr = G.ptrail;
    if (tr.length < 6) return;
    ctx.lineCap = 'round';
    for (let i = 3; i < tr.length; i += 3) {
      const k = 1 - (G.t - tr[i + 2]) / 0.3;
      ctx.strokeStyle = s.dash ? `rgba(255,255,255,${k * 0.9})` : `rgba(255,255,255,${k * 0.55})`;
      ctx.lineWidth = S * (s.mini ? 0.18 : 0.3) * k;
      ctx.beginPath(); ctx.moveTo(sx(tr[i - 3]), sy(tr[i - 2])); ctx.lineTo(sx(tr[i]), sy(tr[i + 1])); ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  function drawStreaks() {
    for (const k of G.streaks) {
      const a = Math.max(0, k.life / 0.3);
      const x = sx(k.x), y0 = sy(k.y0), y1 = sy(k.y1);
      const w = k.w * S * (0.35 + 0.5 * a);
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.6, SKIN.c2);
      g.addColorStop(1, '#fff');
      ctx.globalAlpha = a;
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2, Math.min(y0, y1), w, Math.abs(y1 - y0));
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - w * 0.12, Math.min(y0, y1), w * 0.24, Math.abs(y1 - y0));
    }
    ctx.globalAlpha = 1;
  }

  // fire=true draws the flame particles (behind the player), fire=false the rest.
  function drawParts(fire) {
    for (const p of parts) {
      if (p.life <= 0 || !!p.fire !== fire) continue;
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = fire ? k * 0.9 : k;
      ctx.fillStyle = p.color;
      const s = p.size * S * (fire ? 0.35 + k * 0.65 : 1);
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
    drawIcon(s.mode, size, s);
    ctx.restore();
  }

  // Draws one mode's icon centred on the current origin.
  // Draws one mode's icon centred on the current origin. variant overrides
  // the equipped icon (icon kit previews).
  function drawIcon(mode, size, s, variant) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.strokeStyle = '#000';
    if (SKIN.glow && !(lowQuality && ctx === mainCtx)) { ctx.shadowColor = SKIN.c2; ctx.shadowBlur = size * 0.45; }
    ICONS.draw(ctx, mode, size, {
      c1: SKIN.c1, c2: SKIN.c2, v: variant == null ? equipped(mode) : variant, cube: equipped('cube'),
      t: G.t, grounded: !s || s.grounded, boost: !!(s && s.boost > 0 && s.held),
    });
    ctx.shadowBlur = 0;
  }

  function drawWaveTrail(s) {
    ctx.save();
    ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.strokeStyle = SKIN.c2; ctx.globalAlpha = 0.9;
    ctx.lineWidth = S * (s.mini ? 0.18 : 0.3);
    ctx.beginPath();
    ctx.moveTo(sx(G.trail[0]), sy(G.trail[1]));
    for (let i = 2; i < G.trail.length; i += 2) ctx.lineTo(sx(G.trail[i]), sy(G.trail[i + 1]));
    ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = S * 0.08;
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------- HUD

  function drawHud() {
    if (!G.s || G.screen !== 'play' && G.screen !== 'pause' && G.screen !== 'complete') return;
    const pct = G.s.won ? 100 : progress();
    const bw = Math.min(W * 0.5, 420), bh = 14;
    const bx = (W - bw) / 2, by = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(bx - 3, by - 3, bw + 6, bh + 6, 10); ctx.fill();
    ctx.fillStyle = G.practice ? '#3af0ff' : '#7dff3a';
    if (pct > 0) { roundRect(bx, by, bw * pct / 100, bh, 7); ctx.fill(); }
    // Best-run marker
    const best = G.prevBest || 0;
    if (best > 0 && best < 100) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(bx + bw * best / 100 - 1.5, by - 4, 3, bh + 8);
    }
    if (SET.pct) outlinedText(`${pct}%`, bx + bw + 12, by + bh / 2, 18);
    if (G.practice) outlinedText('PRACTICE', W / 2, by + bh + 18, 18, 'center');
    if (SET.fps) outlinedText(`${G.fps} fps`, W - 12, H - 16, 16, 'right');
    if (G.popup) {
      const k = Math.min(1, (1.3 - G.popup.t) * 6);
      const a = Math.min(1, G.popup.t * 3);
      ctx.globalAlpha = a;
      outlinedText(G.popup.text, W / 2, H * 0.38, 44 * (0.6 + 0.4 * k), 'center', '#ffe066');
      outlinedText(G.popup.sub, W / 2, H * 0.38 + 46, 30, 'center');
      ctx.globalAlpha = 1;
    }
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ---------------------------------------------------------------- UI

  const $ = (id) => document.getElementById(id);
  const SCREENS = ['home', 'select', 'practice', 'settings', 'statsScr', 'skin', 'pause', 'complete'];

  // Main levels, easiest first (indexes stay stable so saves don't move).
  const MAIN = LEVELS.map((L, i) => i).filter((i) => !LEVELS[i].training)
    .sort((a, b) => (LEVELS[a].order ?? LEVELS[a].stars) - (LEVELS[b].order ?? LEVELS[b].stars) || a - b);
  function coinSlots(i) {
    const got = store.get('coins:' + slotOf(i), []);
    return Array.from({ length: LEVELS[i].coinCount || 0 }, (_, k) =>
      `<span class="coin${got.indexOf(k) !== -1 ? ' got' : ''}"></span>`).join('');
  }
  // Practice levels: PRACTICE[mini][mode][tier] -> LEVELS index.
  const PRACTICE = { false: {}, true: {} };
  LEVELS.forEach((L, i) => { if (L.training) (PRACTICE[!!L.mini][L.mode] = PRACTICE[!!L.mini][L.mode] || [])[L.tier] = i; });

  const auraOf = (L) => (L.training ? null : L.stars >= 9 ? 'epic' : 'featured');

  function lengthLabel(L) {
    const secs = L.length / P.SPEEDS[L.startSpeed == null ? 1 : L.startSpeed];
    return secs < 20 ? 'Short' : secs < 45 ? 'Medium' : secs < 70 ? 'Long' : 'XL';
  }

  // Faces drawn into DOM canvases; Extreme Demon / epic ones keep burning.
  let liveFaces = [];
  function faceCanvas(cv, difficulty, cssSize, aura) {
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    cv.width = cssSize * r; cv.height = cssSize * r;
    const c = cv.getContext('2d');
    const f = { cv, c, r, difficulty, cssSize, aura };
    drawFaceInto(f);
    if (aura === 'epic' || difficulty === 'Extreme Demon') liveFaces.push(f);
  }
  function drawFaceInto(f) {
    f.c.setTransform(f.r, 0, 0, f.r, 0, 0);
    f.c.clearRect(0, 0, f.cssSize, f.cssSize);
    const rad = f.cssSize * (f.aura || f.difficulty === 'Extreme Demon' ? 0.3 : 0.36);
    FACES.draw(f.c, f.cssSize / 2, f.cssSize * 0.54, rad, f.difficulty, { aura: f.aura, time: G.t });
  }
  let faceTick = 0;
  function animateFaces(dt) {
    if ((faceTick += dt) < 1 / 24) return;
    faceTick = 0;
    liveFaces = liveFaces.filter((f) => f.cv.isConnected);
    for (const f of liveFaces) if (f.cv.offsetParent) drawFaceInto(f);
  }

  function show(screen) {
    G.screen = screen;
    for (const id of SCREENS) $(id).classList.toggle('show', screen === id);
    $('hud').classList.toggle('show', screen === 'play');
    $('cpbtns').classList.toggle('show', screen === 'play' && G.practice);
    if (screen === 'home' || screen === 'select' || screen === 'practice' || screen === 'statsScr' || screen === 'skin' || (screen === 'settings' && !G.s)) {
      if (G.s && screen !== 'settings') { AUDIO.stop(); G.s = null; }
    }
    if (screen === 'home') buildHome();
    if (screen === 'select') buildSelect();
    if (screen === 'practice') buildPractice();
    if (screen === 'statsScr') buildStats();
    if (screen === 'skin') buildSkin();
  }

  // ---------------------------------------------------------- home
  function buildHome() {
    G.menuBg = ['#2b5bff', '#1a3acc'];
    const beaten = MAIN.filter((i) => bestOf(i, false) === 100).length;
    $('tagline').textContent = `${MAIN.length} levels · 160 mode practices · ${beaten}/${MAIN.length} beaten`;
    iconCanvas($('hIconCv'), 'cube', 64, 0.7);
    iconCanvas($('hPracCv'), 'ship', 64, 0.8);
  }

  // -------------------------------------------------- level selector
  function buildSelect() {
    const track = $('track'), dots = $('dots');
    track.innerHTML = ''; dots.innerHTML = '';
    MAIN.forEach((i, k) => {
      const L = LEVELS[i];
      const best = bestOf(i, false), prac = bestOf(i, true);
      const slide = document.createElement('div');
      slide.className = 'slide';
      slide.innerHTML = `
        <div class="lvcard" role="button" tabindex="0" aria-label="Play ${L.name}" style="--lvc:${L.colors[0].bg}">
          <canvas></canvas>
          <div>
            <div class="lvno">Level ${L.levelNo || ''}</div>
            <div class="lvname">${L.name}</div>
            <div class="lvmeta"><span>${L.difficulty}</span><span class="star">${L.stars} ★</span>
              <span>${lengthLabel(L)}</span><span>${best === 100 ? '✓ Beaten' : ''}</span></div>
            <div class="lvmeta"><span style="color:#d8deff">Attempts: ${store.get('att:' + slotOf(i), 0)}</span><span class="coins">${coinSlots(i)}</span></div>
          </div>
        </div>
        <div class="lvbars">
          <div class="bar"><i style="width:${best}%"></i><b>Normal ${best}%</b></div>
          <div class="bar p"><i style="width:${prac}%"></i><b>Practice ${prac}%</b></div>
        </div>
        <div class="row"><button class="alt" data-prac="${i}">Practice</button></div>`;
      track.appendChild(slide);
      faceCanvas(slide.querySelector('canvas'), L.difficulty, 120, auraOf(L));
      const card = slide.querySelector('.lvcard');
      card.addEventListener('click', () => { if (!swiped) startLevel(i, false, 'select'); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') startLevel(i, false, 'select'); });
      slide.querySelector('[data-prac]').addEventListener('click', () => startLevel(i, true, 'select'));
      const dot = document.createElement('i');
      dots.appendChild(dot);
    });
    setPage(G.page, true);
  }

  function setPage(p, instant) {
    const n = MAIN.length;
    G.page = ((p % n) + n) % n;
    store.set('page', G.page);
    const track = $('track');
    if (instant) { track.style.transition = 'none'; requestAnimationFrame(() => { track.style.transition = ''; }); }
    track.style.transform = `translateX(${-G.page * 100}%)`;
    [...$('dots').children].forEach((d, k) => d.classList.toggle('on', k === G.page));
    const L = LEVELS[MAIN[G.page]];
    G.menuBg = [L.colors[0].bg, L.colors[0].gr];
  }

  // Swipe between slides; a swipe suppresses the card's click.
  let swipeX = null, swiped = false;
  $('slider').addEventListener('pointerdown', (e) => { swipeX = e.clientX; swiped = false; });
  $('slider').addEventListener('pointerup', (e) => {
    if (swipeX == null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 50) { swiped = true; setPage(G.page + (dx < 0 ? 1 : -1)); setTimeout(() => { swiped = false; }, 50); }
  });

  // ---------------------------------------------------- mode practice
  function buildPractice() {
    const mini = G.prMini, mode = G.prMode;
    G.menuBg = ['#3b1c6b', '#22104a'];
    $('prNormal').classList.toggle('on', !mini);
    $('prMini').classList.toggle('on', mini);
    const tabs = $('prTabs');
    tabs.innerHTML = '';
    for (const m of P.MODES) {
      const b = document.createElement('button');
      b.className = m === mode ? 'on' : '';
      b.setAttribute('aria-label', MODE_LABEL[m]);
      b.title = MODE_LABEL[m];
      b.innerHTML = '<canvas></canvas>';
      b.addEventListener('click', () => { G.prMode = m; store.set('prMode', m); buildPractice(); });
      tabs.appendChild(b);
      iconCanvas(b.querySelector('canvas'), m, 46, mini ? 0.5 : 0.72);
    }
    const list = PRACTICE[mini][mode];
    const done = list.filter((i) => bestOf(i, false) === 100).length;
    $('prHead').textContent = `${mini ? 'Mini ' : ''}${MODE_LABEL[mode]} · ${done}/${list.length} beaten`;
    const grid = $('prGrid');
    grid.innerHTML = '';
    list.forEach((i) => {
      const L = LEVELS[i];
      const best = bestOf(i, false);
      const b = document.createElement('button');
      b.className = 'tcard ghost' + (best === 100 ? ' done' : '');
      b.innerHTML = `<canvas></canvas><span class="tn">${L.tierName}</span><span class="tp">${best === 100 ? 'Beaten' : best + '%'}</span>`;
      b.setAttribute('aria-label', `${L.name}, best ${best}%`);
      b.addEventListener('click', () => startLevel(i, false, 'practice'));
      grid.appendChild(b);
      faceCanvas(b.querySelector('canvas'), L.tierName, 70, null);
    });
  }

  // -------------------------------------------------------- settings
  let settingsReturn = 'home';
  function openSettings(from) {
    settingsReturn = from;
    const list = $('setList');
    list.innerHTML = '';
    for (const [key, label, kind, hint] of SETTINGS_UI) {
      const row = document.createElement('div');
      row.className = 'setrow';
      row.innerHTML = `<span>${label}${hint ? `<small>${hint}</small>` : ''}</span>`;
      if (kind === 'range') {
        const input = document.createElement('input');
        input.type = 'range'; input.min = 0; input.max = 1; input.step = 0.05; input.value = SET[key];
        input.setAttribute('aria-label', label);
        input.addEventListener('input', () => { SET[key] = +input.value; saveSet(); applyAudio(); });
        row.appendChild(input);
      } else {
        const b = document.createElement('button');
        b.className = 'sw' + (SET[key] ? ' on' : '');
        b.setAttribute('aria-label', label); b.setAttribute('aria-pressed', !!SET[key]);
        b.addEventListener('click', () => {
          SET[key] = !SET[key]; saveSet();
          b.classList.toggle('on', SET[key]); b.setAttribute('aria-pressed', SET[key]);
        });
        row.appendChild(b);
      }
      list.appendChild(row);
    }
    G.screen = 'settings';
    for (const id of SCREENS) $(id).classList.toggle('show', id === 'settings');
  }
  function closeSettings() {
    if (settingsReturn === 'pause') {
      G.screen = 'pause';
      for (const id of SCREENS) $(id).classList.toggle('show', id === 'pause');
    } else show(settingsReturn);
  }
  function applyAudio() { AUDIO.setVolumes(SET.music, SET.sfx); }

  // ------------------------------------------------------------ stats
  function buildStats() {
    const beaten = MAIN.filter((i) => bestOf(i, false) === 100);
    const stars = beaten.reduce((n, i) => n + LEVELS[i].stars, 0);
    const prac = LEVELS.filter((L, i) => L.training && bestOf(i, false) === 100).length;
    const demons = beaten.filter((i) => /Demon/.test(LEVELS[i].difficulty)).length;
    const cells = [
      ['Stars', `${stars} ★`], ['Levels beaten', `${beaten.length}/${MAIN.length}`],
      ['Demons beaten', demons], ['Mode practices', `${prac}/160`],
      ['Coins', `${LEVELS.reduce((n, L, i) => n + store.get('coins:' + slotOf(i), []).length, 0)}/${LEVELS.reduce((n, L) => n + (L.coinCount || 0), 0)}`],
      ['Icons', `${Math.min(ICONS.COUNT * 8, 8 + levelsBeaten())}/${ICONS.COUNT * 8}`],
      ['Attempts', store.get('attempts', 0)], ['Jumps', store.get('jumps', 0)],
    ];
    $('statGrid').innerHTML = cells.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join('');
  }

  // --------------------------------------------------------- icon kit
  function iconCanvas(cv, mode, cssSize, fill) {
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    cv.width = cssSize * r; cv.height = cssSize * r;
    const c = cv.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    c.clearRect(0, 0, cssSize, cssSize);
    c.translate(cssSize / 2, cssSize / 2);
    withCtx(c, () => drawIcon(mode, cssSize * fill, { grounded: true }));
  }
  function withCtx(c, fn) { ctx = c; try { fn(); } finally { ctx = mainCtx; } }
  // Same as iconCanvas but for a specific (possibly locked) variant.
  function iconCanvasV(cv, mode, cssSize, fill, v) {
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    cv.width = cssSize * r; cv.height = cssSize * r;
    const c = cv.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    c.clearRect(0, 0, cssSize, cssSize);
    c.translate(cssSize / 2, cssSize / 2);
    withCtx(c, () => drawIcon(mode, cssSize * fill, { grounded: true }, v));
  }

  function renderSkinPreview() {
    const cv = $('skinPreview');
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    cv.width = w * r; cv.height = h * r;
    const c = cv.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    const cols = w < 380 ? 4 : 8, rows = cols === 4 ? 2 : 1;
    const cell = Math.min(w / cols, h / rows);
    const ox = (w - cell * cols) / 2, oy = (h - cell * rows) / 2;
    P.MODES.forEach((m, i) => {
      c.save();
      c.translate(ox + (i % cols + 0.5) * cell, oy + (Math.floor(i / cols) + 0.5) * cell);
      withCtx(c, () => drawIcon(m, cell * 0.55, { grounded: true }));
      c.restore();
    });
  }

  function buildSkin() {
    for (const [id, key] of [['sw1', 'c1'], ['sw2', 'c2']]) {
      const root = $(id);
      root.innerHTML = '';
      for (const col of PALETTE) {
        const b = document.createElement('button');
        b.style.background = col;
        b.setAttribute('aria-label', `${key === 'c1' ? 'Primary' : 'Secondary'} ${col}`);
        if (SKIN[key] === col) b.className = 'on';
        b.addEventListener('click', () => { SKIN[key] = col; saveSkin(); buildSkin(); });
        root.appendChild(b);
      }
    }
    // Mode tabs, then the 24 icons of the selected mode.
    const tabs = $('kitTabs');
    tabs.innerHTML = '';
    for (const m of P.MODES) {
      const b = document.createElement('button');
      b.className = m === G.kitMode ? 'on' : '';
      b.title = MODE_LABEL[m];
      b.setAttribute('aria-label', MODE_LABEL[m]);
      b.innerHTML = '<canvas></canvas>';
      b.addEventListener('click', () => { G.kitMode = m; buildSkin(); });
      tabs.appendChild(b);
      iconCanvas(b.querySelector('canvas'), m, 40, 0.7);
    }
    const total = ICONS.COUNT * P.MODES.length;
    const owned = Math.min(total, P.MODES.length + levelsBeaten());
    $('kitCount').textContent = `${owned}/${total} icons unlocked \u00b7 beat any level to unlock the next`;
    const grid = $('kitGrid');
    grid.innerHTML = '';
    for (let v = 0; v < ICONS.COUNT; v++) {
      const m = G.kitMode;
      const open = isUnlocked(m, v);
      const b = document.createElement('button');
      b.className = (equipped(m) === v ? 'on' : '') + (open ? '' : ' locked');
      b.title = open ? ICONS.name(m, v) : 'Locked';
      b.setAttribute('aria-label', open ? `${ICONS.name(m, v)} ${MODE_LABEL[m]}` : `Locked ${MODE_LABEL[m]} icon`);
      b.innerHTML = '<canvas></canvas>' + (open ? '' : '<span class="lock">\ud83d\udd12</span>');
      if (open) b.addEventListener('click', () => { SKIN.icons[m] = v; saveSkin(); buildSkin(); });
      grid.appendChild(b);
      iconCanvasV(b.querySelector('canvas'), m, 48, 0.68, v);
    }
    $('glowBtn').textContent = `Glow: ${SKIN.glow ? 'On' : 'Off'}`;
    requestAnimationFrame(renderSkinPreview);
  }

  // ------------------------------------------------------ pause / end
  function pause() {
    if (G.s && G.s.won) return;
    releaseAll();
    show('pause');
    if (AUDIO.ctx) AUDIO.ctx.suspend();
    const best = bestOf(G.idx, false), prac = bestOf(G.idx, true);
    $('pauseTitle').textContent = G.L.name;
    $('pauseStats').innerHTML = `${progress()}% &middot; Attempt ${G.attempts}`;
    $('pauseBest').style.width = best + '%'; $('pauseBestT').textContent = `Normal ${best}%`;
    $('pausePrac').style.width = prac + '%'; $('pausePracT').textContent = `Practice ${prac}%`;
    $('practiceBtn').textContent = G.practice ? 'Normal Mode' : 'Practice Mode';
  }
  function resume() {
    if (AUDIO.ctx) AUDIO.ctx.resume();
    last = performance.now();
    show('play');
  }
  function exitLevel() {
    flushJumps();
    if (AUDIO.ctx) AUDIO.ctx.resume();
    AUDIO.stop();
    G.s = null;
    show(G.returnTo);
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
    G.prevBest = bestOf(G.idx, G.practice);
    G.checkpoints = [];
    restart(true);
  });
  $('pauseSet').addEventListener('click', () => openSettings('pause'));
  $('menuBtn').addEventListener('click', exitLevel);
  $('menuBtn2').addEventListener('click', exitLevel);
  $('againBtn').addEventListener('click', () => { G.attempts = 0; G.jumps = 0; G.time = 0; G.prevBest = bestOf(G.idx, G.practice); restart(true); });
  $('nextBtn').addEventListener('click', () => { const n = nextLevel(); if (n != null) startLevel(n, false); });
  $('rotateOk').addEventListener('click', () => { portraitOk = true; });

  $('hPlay').addEventListener('click', () => show('select'));
  $('hPractice').addEventListener('click', () => show('practice'));
  $('hIcons').addEventListener('click', () => show('skin'));
  $('hSettings').addEventListener('click', () => openSettings('home'));
  $('hStats').addEventListener('click', () => show('statsScr'));
  $('selBack').addEventListener('click', () => show('home'));
  $('selPrev').addEventListener('click', () => setPage(G.page - 1));
  $('selNext').addEventListener('click', () => setPage(G.page + 1));
  $('prBack').addEventListener('click', () => show('home'));
  $('prNormal').addEventListener('click', () => { G.prMini = false; store.set('prMini', false); buildPractice(); });
  $('prMini').addEventListener('click', () => { G.prMini = true; store.set('prMini', true); buildPractice(); });
  $('setDone').addEventListener('click', closeSettings);

  // Save backup: everything this game keeps in localStorage, as one code.
  $('saveExport').addEventListener('click', () => {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('gdr:')) data[k] = localStorage.getItem(k);
      }
    } catch (e) { /* storage blocked */ }
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    $('saveCode').value = code;
    $('saveCode').select();
    const done = () => { $('saveExport').textContent = 'Copied!'; setTimeout(() => { $('saveExport').textContent = 'Copy save code'; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(code).then(done, () => {});
  });
  $('saveImport').addEventListener('click', () => {
    const code = $('saveCode').value.trim();
    if (!code) { $('saveCode').focus(); return; }
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(code))));
      const keys = Object.keys(data).filter((k) => k.startsWith('gdr:'));
      if (!keys.length) throw new Error('empty');
      if (!confirm(`Replace this device's progress with the save code (${keys.length} entries)?`)) return;
      for (const k of keys) localStorage.setItem(k, data[k]);
      location.reload();
    } catch (e) {
      $('saveImport').textContent = 'Invalid code';
      setTimeout(() => { $('saveImport').textContent = 'Load save code'; }, 1500);
    }
  });
  $('saveCode').addEventListener('keydown', (e) => e.stopPropagation());
  $('statsDone').addEventListener('click', () => show('home'));
  $('skinDone').addEventListener('click', () => show('home'));
  $('swapBtn').addEventListener('click', () => { [SKIN.c1, SKIN.c2] = [SKIN.c2, SKIN.c1]; saveSkin(); buildSkin(); });
  $('glowBtn').addEventListener('click', () => { SKIN.glow = !SKIN.glow; saveSkin(); buildSkin(); });
  window.addEventListener('resize', () => { if (G.screen === 'skin') renderSkinPreview(); });

  applyAudio();
  window.GD = G; // handy from the console when building levels
  show('home');
  requestAnimationFrame(frame);
})();
