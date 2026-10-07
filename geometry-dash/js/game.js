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
  // Loop teleports make a level longer than its x length (Dash's 3-2-1 room).
  const tpExtra = (L) => L.objects.reduce((n, o) => n + (o.t === 'tp' ? (o.x - o.tx) * o.n : 0), 0);
  for (const L of LEVELS) { L.coinIds = L.objects.filter((o) => o.t === 'coin').map((o) => o.id); L.tpExtra = tpExtra(L); }

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
  const SKIN = Object.assign({ c1: '#7dff3a', c2: '#3af0ff', glow: false, icons: {}, trail: 'classic', death: 'classic' }, store.get('skin', {}));
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
    if (v >= ICONS.COUNT) return setOwned(mode, ICONS.SETS[v - ICONS.COUNT]);
    const k = ICONS.ORDER.findIndex(([m, x]) => m === mode && x === v);
    return k >= 0 && k < levelsBeaten();
  }

  // ------------------------------------------------------------ economy
  // Mana orbs come in as you set new bests (5% of a level's orbs for each
  // new 10%, the rest on the clear) and buy icons in the shop. Diamonds
  // come from first clears and secret coins and buy the Prism set.
  // Practice mode (checkpoints) pays nothing, same as GD.
  const ORB_BY_STARS = { 1: 25, 2: 50, 3: 75, 4: 125, 5: 175, 6: 225, 7: 275, 8: 350, 9: 425, 10: 500, 12: 600, 15: 750 };
  const ORB_BY_TIER = [25, 40, 50, 75, 100, 125, 175, 200, 225, 275, 325, 350, 425, 475, 500];
  const orbsOf = (L) => (L.training ? ORB_BY_TIER[L.tier] : ORB_BY_STARS[L.stars] || L.stars * 50);
  const diamondsOf = (L) => (L.training ? L.tier + 1 : L.stars + 2);
  const COIN_DIAMONDS = 2;
  // Orbs a level has paid out once milestone m is reached (1..9 = 10%..90%, 10 = cleared).
  function orbsUpTo(L, m) {
    const share = Math.round(orbsOf(L) * 0.05);
    return Math.min(m, 9) * share + (m >= 10 ? orbsOf(L) - 9 * share : 0);
  }
  const wallet = () => ({ orbs: store.get('orbs', 0), diamonds: store.get('diamonds', 0) });
  const walletHtml = () => { const w = wallet(); return `<span class="orb-i"></span>${w.orbs}<span class="dia-i"></span>${w.diamonds}`; };

  // ------------------------------------------------------- special sets
  // Each special set (icons.js) is earned one way: bought per mode in the
  // shop, Golden per mode for total secret coins, Demon from a vault code,
  // three from main-menu easter eggs, Angel from beating the secret level.
  // Icon set prices (cube price; other modes cost a little more each).
  const SHOP_ORBS = {
    candy: 80, checker: 150, zebra: 250, neon: 400, sunset: 600, ice: 750, ocean: 1000, flame: 1200,
    retro: 1800, galaxy: 2500, party: 3500, toxic: 5000, magma: 8000, shadow: 12000, cyber: 20000, cosmic: 35000,
  };
  const SHOP_DIAMONDS = { prism: 25, emerald: 60, ruby: 120, sapphire: 250, emperor: 500 };
  const MODE_MULT = { cube: 1, ship: 1.1, ball: 1.2, ufo: 1.3, wave: 1.45, robot: 1.6, spider: 1.75, swing: 1.9 };
  const setPrice = (set, mode) => {
    const base = SHOP_ORBS[set] || SHOP_DIAMONDS[set];
    const v = base * MODE_MULT[mode];
    return base >= 100 ? Math.round(v / 10) * 10 : Math.round(v);
  };
  // Colours, trails and death effects: [id, name, price, 'orbs' | 'diamonds']
  const SHOP_COLORS = [
    ['#ff7f50', 'Coral', 40], ['#7fffd4', 'Aqua', 60], ['#dda0dd', 'Plum', 90], ['#f0e68c', 'Khaki', 120],
    ['#40e0d0', 'Turquoise', 180], ['#ff1493', 'Hot Pink', 250], ['#9acd32', 'Lime', 320], ['#4682b4', 'Steel', 400],
    ['#d2691e', 'Copper', 520], ['#00ced1', 'Teal', 650], ['#8a2be2', 'Violet', 800], ['#ff4500', 'Blaze', 1000],
    ['#2e8b57', 'Forest', 1300], ['#b22222', 'Crimson', 1700], ['#ffd700', 'Gold', 2200], ['#c0c0c0', 'Silver', 2800],
    ['#191970', 'Midnight', 3600], ['#e6e6fa', 'Lavender', 4500], ['#00ff7f', 'Spring', 6000], ['#ff00ff', 'Magenta', 8000],
    ['#0ff0f0', 'Electric', 15, 'diamonds'], ['#ffe4b5', 'Champagne', 35, 'diamonds'], ['#ff6ec7', 'Neon Rose', 70, 'diamonds'], ['#39ff14', 'Radioactive', 150, 'diamonds'],
  ];
  const SHOP_TRAILS = [
    ['classic', 'Classic', 0], ['smoke', 'Smoke', 120], ['ice', 'Frost', 300], ['fire', 'Fire', 700], ['neon', 'Neon', 1500],
    ['gold', 'Gold Dust', 3000], ['hearts', 'Hearts', 5500], ['rainbow', 'Rainbow', 9000], ['lightning', 'Lightning', 16000],
    ['ghost', 'Afterimage', 30000], ['galaxy', 'Stardust', 45, 'diamonds'], ['void', 'Void', 200, 'diamonds'],
  ];
  const SHOP_DEATHS = [
    ['classic', 'Classic', 0], ['pixels', 'Pixels', 100], ['shatter', 'Shatter', 350], ['confetti', 'Confetti', 900],
    ['fireworks', 'Fireworks', 2000], ['ghost', 'Ghost', 4000], ['vaporize', 'Vaporize', 8000], ['blackhole', 'Black Hole', 18000],
    ['nova', 'Supernova', 40000], ['lightning', 'Thunder', 60, 'diamonds'], ['glitch', 'Glitch', 180, 'diamonds'],
  ];
  const ownedItem = (key) => store.get('owned', []).indexOf(key) !== -1;
  const GOLD_COINS = { cube: 3, ship: 6, ball: 10, ufo: 14, wave: 20, robot: 26, spider: 33, swing: 40 };
  const EGG_SET = { moon: 'ghost', logo: 'glitch', corners: 'royal' };
  const hasEgg = (k) => store.get('eggs', []).indexOf(k) !== -1;
  function coinTotal() {
    let n = 0;
    for (let i = 0; i < LEVELS.length; i++) n += store.get('coins:' + (LEVELS[i].slot || String(i)), []).length;
    return n;
  }
  function setOwned(mode, key) {
    if (SHOP_ORBS[key] || SHOP_DIAMONDS[key]) return store.get('owned', []).indexOf(mode + ':' + key) !== -1;
    if (key === 'gold') return coinTotal() >= GOLD_COINS[mode];
    if (key === 'demon') return store.get('vault', []).indexOf('demon') !== -1;
    if (key === 'angel') return SECRET >= 0 && store.get('best:' + (LEVELS[SECRET].slot || String(SECRET)), 0) === 100;
    for (const e in EGG_SET) if (EGG_SET[e] === key) return hasEgg(e);
    return false;
  }
  function setHint(mode, key) {
    if (SHOP_ORBS[key]) return `Shop: ${setPrice(key, mode).toLocaleString()} orbs`;
    if (SHOP_DIAMONDS[key]) return `Shop: ${setPrice(key, mode).toLocaleString()} diamonds`;
    if (key === 'gold') return `Collect ${GOLD_COINS[mode]} secret coins (you have ${coinTotal()})`;
    if (key === 'demon') return 'Unlocked by a vault code';
    if (key === 'angel') return 'Beat the secret level';
    return 'Hidden somewhere on the main menu';
  }
  const SECRET = LEVELS.findIndex((L) => L.secret);
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
    if (G.screen === 'editor') { edKey(e); return; }
    if (G.screen === 'play' && (JUMP_KEYS.has(e.code) || e.code === 'Enter')) {
      e.preventDefault(); if (!e.repeat) press();
      return;
    }
    if (e.repeat) return;
    const scr = G.screen;
    if (scr === 'home') konamiKey(e.code);
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (scr === 'play') pause();
      else if (scr === 'pause') resume();
      else if (scr === 'settings') closeSettings();
      else if (scr === 'shared') leaveShared();
      else if (scr !== 'home' && scr !== 'complete') show('home');
    } else if (e.code === 'KeyR' && (scr === 'play' || scr === 'pause')) restart(true);
    else if (e.code === 'KeyZ' && scr === 'play') addCheckpoint();
    else if (e.code === 'KeyX' && scr === 'play') removeCheckpoint();
    else if (e.code === 'KeyF') { SET.fps = !SET.fps; saveSet(); }
    else if (scr === 'select') {
      if (e.code === 'ArrowLeft') setPage(G.page - 1);
      else if (e.code === 'ArrowRight') setPage(G.page + 1);
      else if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (G.page < MAIN.length) startLevel(MAIN[G.page], false, 'select'); else soonTap(); }
    } else if (scr === 'home' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); show('select'); }
    else if (scr === 'complete' && e.code === 'Enter') ($('nextBtn').style.display !== 'none' ? $('nextBtn') : $('againBtn')).click();
  });
  window.addEventListener('keyup', (e) => { if (JUMP_KEYS.has(e.code) || e.code === 'Enter') release(); });

  // Track every finger so lifting one while another is down doesn't drop the hold.
  const pointers = new Set();
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (G.screen === 'editor') { edPointer(e, 'down'); return; }
    pointers.add(e.pointerId); press();
  });
  canvas.addEventListener('pointermove', (e) => { if (G.screen === 'editor') edPointer(e, 'move'); });
  window.addEventListener('pointerup', (e) => { if (G.screen === 'editor') edPointer(e, 'up'); });
  canvas.addEventListener('wheel', (e) => { if (G.screen === 'editor') { e.preventDefault(); edWheel(e); } }, { passive: false });
  const lift = (e) => { pointers.delete(e.pointerId); if (pointers.size === 0) release(); };
  window.addEventListener('pointerup', lift);
  window.addEventListener('pointercancel', lift);
  window.addEventListener('contextmenu', (e) => { if (G.screen === 'play' || G.screen === 'editor') e.preventDefault(); });
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
  const slotOf = (i) => (i < 0 ? G.L.slot : LEVELS[i].slot || String(i));
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
    G.orbM = store.get('orbm:' + slotOf(idx), 0);
    bump('attempts'); bump('att:' + slotOf(idx));
    spawnPlayer();
    show('play');
    playMusic(G.L);
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
    G.fin = null; G.orbPop = null;
  }

  function restart(fresh) {
    if (fresh) G.checkpoints = [];
    G.attempts++;
    bump('attempts'); bump('att:' + slotOf(G.idx));
    spawnPlayer();
    if (!G.practice || fresh) playMusic(G.L);
    show('play');
  }

  function addCheckpoint() {
    if (!G.practice || !G.s || G.s.dead || G.s.won) return;
    G.checkpoints.push({ s: P.clone(G.s), rot: G.rot, camY: G.camY });
  }
  function removeCheckpoint() { if (G.practice) G.checkpoints.pop(); }

  function flushJumps() { if (pendingJumps) { bump('jumps', pendingJumps); pendingJumps = 0; } }

  // Death effects from the shop.
  function deathFx(s) {
    const id = SKIN.death || 'classic', cols = deathColors(id);
    const col = () => cols[Math.floor(Math.random() * cols.length)];
    const burst = (n, vmin, vmax, life, size, square, fire) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = vmin + Math.random() * (vmax - vmin);
        spawn(s.x, s.y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + Math.random() * 0.6), size * (0.5 + Math.random()), col(), square, fire);
      }
    };
    switch (id) {
      case 'pixels': burst(70, 1, 6, 0.9, 0.12, true); break;
      case 'shatter': burst(14, 4, 12, 1.0, 0.35, true); break;
      case 'confetti': burst(90, 4, 14, 1.4, 0.12, true); break;
      case 'fireworks': burst(60, 8, 16, 1.0, 0.1, false); burst(40, 2, 6, 1.2, 0.15, false); break;
      case 'ghost': for (let i = 0; i < 30; i++) spawn(s.x + (Math.random() - 0.5), s.y, (Math.random() - 0.5) * 2, 3 + Math.random() * 4, 1.2, 0.2, col(), false); break;
      case 'vaporize': burst(120, 0.5, 4, 0.6, 0.06, false); G.flash = 1.5; break;
      case 'blackhole':
        for (let i = 0; i < 60; i++) { const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 2; spawn(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, -Math.cos(a) * r * 3, -Math.sin(a) * r * 3, 0.33, 0.12, col(), true); }
        break;
      case 'nova': burst(150, 10, 24, 0.8, 0.14, false, true); if (SET.shake) G.shake = 0.6; break;
      case 'lightning':
        for (let k = 0; k < 6; k++) { let x = s.x, y = s.y; const a = Math.random() * Math.PI * 2; for (let j = 0; j < 8; j++) { x += Math.cos(a) * 0.5 + (Math.random() - 0.5) * 0.5; y += Math.sin(a) * 0.5 + (Math.random() - 0.5) * 0.5; spawn(x, y, 0, 0, 0.35, 0.1, col(), true); } }
        break;
      case 'glitch': for (let i = 0; i < 40; i++) spawn(s.x + (Math.random() - 0.5) * 3, s.y + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 20, 0, 0.3, 0.1 + Math.random() * 0.3, col(), true); break;
      default: burst(46, 2, 12, 0.8, 0.17, true);
    }
  }

  function die() {
    const s = G.s;
    AUDIO.crash();
    if (!G.practice) AUDIO.stop();
    deathFx(s);
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
    const L = G.L;
    const first = !G.practice && bestOf(G.idx, false) < 100;
    const before = levelsBeaten();
    // Everything you own before this clear, to show what it unlocked.
    const ownedBefore = specialsOwned();
    saveBest(100);
    let newCoins = 0;
    if (!G.practice && !L.custom && G.s.coins.length) {
      const got = new Set(store.get('coins:' + slotOf(G.idx), []));
      const had = got.size;
      for (const id of G.s.coins) got.add(G.L.coinIds.indexOf(id));
      store.set('coins:' + slotOf(G.idx), [...got]);
      newCoins = got.size - had;
    }
    beatenCache = -1;
    // Player-made levels pay nothing, same as unrated levels in GD.
    const orbs = G.practice || L.custom ? 0 : payOrbs(10);
    const diamonds = L.custom ? 0 : (first ? diamondsOf(L) : 0) + newCoins * COIN_DIAMONDS;
    if (diamonds) bump('diamonds', diamonds);
    const unlocks = [];
    if (first && !L.custom && before < ICONS.ORDER.length) unlocks.push(ICONS.ORDER[before]);
    for (const k of specialsOwned()) if (ownedBefore.indexOf(k) === -1) { const [m, set] = k.split(':'); unlocks.push([m, ICONS.special(set)]); }
    flushJumps();
    if (first && !L.custom) bump('cleared');
    if (!L.custom && !G.practice) cloudSync();
    // GD-style finish: the icon is pulled into the end wall, light bursts
    // out of it and the banner drops in; the results follow (see finish()).
    G.fin = { t: 0, x: G.s.x, y: G.s.y, hit: false };
    $('completeStats').innerHTML = `${L.name}${G.practice ? ' (practice)' : ''}<br>` +
      `Attempts: ${G.attempts} &middot; Jumps: ${G.jumps} &middot; Time: ${G.time.toFixed(1)}s`;
    const earn = [];
    if (first && L.custom) earn.push('Cleared!');
    else if (first && !L.training) earn.push(`+${L.stars} ★`);
    else if (first) earn.push('Cleared!');
    if (orbs) earn.push(`<span class="orb-i"></span>+${orbs}`);
    if (diamonds) earn.push(`<span class="dia-i"></span>+${diamonds}`);
    $('completeEarn').innerHTML = earn.join(' &nbsp;');
    showUnlocks($('unlockBox'), unlocks);
    faceCanvas($('completeFace'), L.difficulty, 96, auraOf(L));
    const next = nextLevel();
    $('nextBtn').style.display = next == null ? 'none' : '';
  }

  // Icon box on the complete and vault screens: one icon gets its name,
  // several get a count.
  function showUnlocks(box, list) {
    box.style.display = list.length ? '' : 'none';
    if (!list.length) return;
    box.innerHTML = list.slice(0, 4).map(() => '<canvas></canvas>').join('') +
      `<span>${list.length === 1 ? `New ${MODE_LABEL[list[0][0]]} icon: ${ICONS.name(list[0][0], list[0][1])}` : `${list.length} new icons!`}</span>`;
    box.querySelectorAll('canvas').forEach((cv, i) => iconCanvasV(cv, list[i][0], 64, 0.7, list[i][1]));
  }
  // "mode:set" for every special icon currently owned.
  function specialsOwned() {
    const out = [];
    for (const set of ICONS.SETS) for (const m of P.MODES) if (setOwned(m, set)) out.push(m + ':' + set);
    return out;
  }

  // Orbs for each new 10% of a level, paid the moment you pass it.
  function payOrbs(m) {
    const k = 'orbm:' + slotOf(G.idx), had = store.get(k, 0);
    if (m <= had) return 0;
    const n = orbsUpTo(G.L, m) - orbsUpTo(G.L, had);
    store.set(k, m);
    bump('orbs', n);
    return n;
  }

  // The next level in whichever list the player came from.
  function nextLevel() {
    if (G.L.custom) return null;
    if (G.L.training) {
      const list = PRACTICE[!!G.L.mini][G.L.mode];
      return G.L.tier + 1 < list.length ? list[G.L.tier + 1] : null;
    }
    const k = MAIN.indexOf(G.idx);
    return k >= 0 && k + 1 < MAIN.length ? MAIN[k + 1] : null;
  }

  function progress() {
    return Math.max(0, Math.min(100, Math.floor(((G.s.x + (G.s.tpDist || 0)) / (G.L.length + (G.L.tpExtra || 0))) * 100)));
  }

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
    else if (G.screen === 'editor') renderEditor();
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
    if (G.orbPop && (G.orbPop.t -= dt) <= 0) G.orbPop = null;
    if (s.dead) {
      G.deadTimer -= dt;
      if (G.deadTimer <= 0) restart(false);
      return;
    }
    if (s.won) { if (G.fin && G.fin.t > 2.5) show('complete'); return; }
    G.time += dt;
    G.acc += dt;
    while (G.acc >= P.DT) {
      G.prevX = s.x; G.prevY = s.y;
      P.step(s, G.L, held);
      G.acc -= P.DT;
      if (s.teleported) {
        if (s.mode === 'spider' && Math.abs(s.x - G.prevX) < 1) {
          // GD-style spider streak from where it was to where it landed,
          // with a splash where it lands.
          G.streaks.push({ x: s.x, y0: G.prevY, y1: s.y, w: P.size(s), life: 0.3 });
          for (let i = 0; i < 12; i++) spawn(s.x + (Math.random() - 0.5) * 0.8, s.y - 0.45 * s.grav, (Math.random() - 0.5) * 6, -s.grav * Math.random() * 4, 0.35, 0.08 + Math.random() * 0.08, i % 2 ? SKIN.c2 : '#fff', true);
        } else {
          // Loop teleport: flash and clear trails so nothing streaks across.
          G.trail.length = 0; G.ptrail.length = 0; G.flash = 0.6;
          AUDIO.tick();
        }
        G.prevX = s.x; G.prevY = s.y;
      }
      if (s.dead) { die(); break; }
      if (s.won) { win(); break; }
    }
    if (!G.practice && !s.won && !G.L.custom) {
      const m = Math.min(9, Math.floor(progress() / 10));
      if (m > G.orbM) {
        G.orbM = m;
        const n = payOrbs(m);
        if (n) { G.orbPop = { n, t: 1.1 }; AUDIO.orb(); }
      }
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
    trailParticles(s, dt);
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

    // GD-style end: the camera stops and the icon runs on into the end wall.
    G.camX = Math.min(px - VIEW_W * playerX(), L.length - VIEW_W * 0.8);
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
    if (!s.dead && !s.won) G.camY += (targetY - G.camY) * Math.min(1, dt * 5);
    if (G.fin) G.fin.t += dt;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (L.camFx) {
      // Camera tilts and zooms (Dash): around the screen centre, eased in
      // over 6 blocks at each end of the section.
      const fx = camFxAt(L, px);
      if (fx.rot || fx.zoom !== 1) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
        const cover = 1 + Math.abs(Math.sin(fx.rot)) * (W / H) * 0.6;
        ctx.translate(W / 2, H / 2); ctx.rotate(fx.rot); ctx.scale(fx.zoom * cover, fx.zoom * cover); ctx.translate(-W / 2, -H / 2);
      }
    }
    if (G.shake > 0) {
      const k = G.shake * 14;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }
    const col = levelColors(L, px);
    const pulse = AUDIO.pulse();
    drawBackground(col.bg, col.gr, pulse);
    if (L.themes) drawThemes(L, 'back', pulse);
    drawObjects(L, pulse, col);
    if (s.bounds) drawCeiling(col.gr, s.bounds.ceil);
    drawGround(col.gr, s.bounds ? s.bounds.floor : 0);
    if (L.themes) drawThemes(L, 'front', pulse);
    if (s.bounds && detail()) { drawThorns(sy(s.bounds.floor), 1); drawThorns(sy(s.bounds.ceil), -1); }
    if (SET.hitboxes && (G.practice || L.training)) drawHitboxes(L, s);
    drawCheckpoints();
    drawAttemptText();
    drawParts(true);
    drawStreaks();
    drawTrail(s);
    if (G.fin) drawFinish(s);
    else if (!s.dead) drawPlayer(s, px, py);
    drawParts(false);
    if (G.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${G.flash * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFinishBanner();
    drawHud();
  }

  function camFxAt(L, x) {
    let rot = 0, zoom = 1;
    for (const [x0, x1, r, z] of L.camFx) {
      if (x < x0 - 6 || x > x1 + 6) continue;
      const k = Math.max(0, Math.min(1, (x - x0 + 6) / 6, (x1 + 6 - x) / 6));
      const deg = r === 'sway' ? Math.sin(G.t * 0.9) * 7 : r;
      rot += (deg * Math.PI / 180) * k; zoom += (z - 1) * k;
    }
    return { rot, zoom };
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

  // ------------------------------------------------------------ themes
  // Render-only scenery a level can ask for per section (levels.js
  // `themes`): lava or acid floors, ruins, hanging crushers, ice mountains,
  // chains of glowing orbs, chevrons, torches, a dark cave, a dungeon, a
  // countdown, a grey flash, neon frames and an end altar. 'back' layers go
  // behind the level, 'front' ones over the ground. Each is clipped to its
  // section, so scenery changes exactly where the section does.
  const BACK = new Set(['dark', 'ruins', 'embers', 'crushers', 'mountains', 'orbChain', 'chevrons', 'countdown', 'neon']);
  function drawThemes(L, layer, pulse) {
    if (!detail() && layer === 'back') return;
    for (const th of L.themes) {
      const x0 = th[0], x1 = th[1];
      if (x1 < G.camX - 2 || x0 > G.camX + VIEW_W + 2) continue;
      const a = Math.max(0, sx(x0)), b = Math.min(W, sx(x1));
      if (b <= a) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(a, -10, b - a, H + 20); ctx.clip();
      for (let i = 2; i < th.length; i++) {
        const [kind, arg] = th[i].split(':');
        if (BACK.has(kind) !== (layer === 'back')) continue;
        const fn = THEME[kind];
        if (fn) { ctx.save(); fn(x0, x1, arg, pulse); ctx.restore(); }
      }
      ctx.restore();
    }
  }
  const floorY = () => sy(G.s && G.s.bounds ? G.s.bounds.floor : 0);
  function liquid(c1, c2, glow) {
    const y = floorY();
    if (y > H + 4) return;
    const g = ctx.createLinearGradient(0, y - S * 0.4, 0, H);
    g.addColorStop(0, c1); g.addColorStop(0.25, c2); g.addColorStop(1, '#000');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-10, H + 10);
    for (let px = -10; px <= W + 10; px += 8) {
      const wx = G.camX + px / S;
      ctx.lineTo(px, y - S * 0.12 + Math.sin(wx * 1.7 + G.t * 3) * S * 0.07 + Math.sin(wx * 0.6 - G.t * 2) * S * 0.05);
    }
    ctx.lineTo(W + 10, H + 10); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createLinearGradient(0, y - S * 1.6, 0, y);
    gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, glow);
    ctx.fillStyle = gl; ctx.fillRect(0, y - S * 1.6, W, S * 1.6);
    // Bubbles popping up from the surface
    for (let k = Math.floor(G.camX); k < G.camX + VIEW_W; k++) {
      const ph = (G.t * 0.8 + k * 0.37) % 1, sd = ((k * 9301 + 49297) % 233) / 233;
      if (sd > 0.35) continue;
      ctx.fillStyle = c1; ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.arc(sx(k + sd * 2), y - ph * S * 0.8, S * 0.08 * (1 - ph * 0.5), 0, Math.PI * 2); ctx.fill();
    }
  }
  function flame(x, y, s, blue) {
    const f = Math.sin(G.t * 12 + x) * 0.15;
    const g = ctx.createRadialGradient(x, y - s * 0.4, 0, x, y - s * 0.3, s * 0.7);
    g.addColorStop(0, blue ? '#e0ffff' : '#fff6c0'); g.addColorStop(0.4, blue ? '#3bc8ff' : '#ffb000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - s * 0.25, y); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.5, x + f * s, y - s * (0.9 + f));
    ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.5, x + s * 0.25, y); ctx.fill();
  }
  const THEME = {
    lava() { liquid('#ffd23b', '#ff5a00', 'rgba(255,90,0,0.35)'); },
    // Glowing embers drifting up off the lava, and a heat shimmer.
    embers() {
      const base = floorY();
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 40; k++) {
        const sd = ((k * 9301 + 49297) % 233280) / 233280;
        const life = (G.t * (0.25 + sd * 0.3) + sd) % 1;
        const x = ((sd * 997 + k * 0.37) * S * 7 - G.camX * S * 0.9) % (W + S * 2);
        const px = x < 0 ? x + W + S * 2 : x, py = base - life * H * 0.8;
        ctx.globalAlpha = (1 - life) * 0.9;
        ctx.fillStyle = k % 3 ? '#ffb030' : '#fff0a0';
        const r = S * (0.04 + sd * 0.06);
        ctx.beginPath(); ctx.arc(px + Math.sin(G.t * 2 + k) * S * 0.3, py, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 0.12;
      const g = ctx.createLinearGradient(0, base - S * 3, 0, base);
      g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, 'rgba(255,120,40,1)');
      ctx.fillStyle = g; ctx.fillRect(0, base - S * 3, W, S * 3);
    },
    // Jagged dark rock along the ceiling, lit from below.
    rockCeil() {
      const y = sy(G.s && G.s.bounds ? G.s.bounds.ceil : 8);
      if (y < -S) return;
      ctx.fillStyle = '#120404';
      ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-10, y);
      for (let px = -10; px <= W + 10; px += S * 0.5) {
        const wx = Math.floor((G.camX + px / S) * 2);
        ctx.lineTo(px, y + S * (0.15 + ((wx * 7919) % 7) / 20));
      }
      ctx.lineTo(W + 10, -10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,90,30,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    },
    // The opening's darkness, lifting where the red ring fires you up.
    dark(x0) {
      const edge = sx(x0 + 12);
      if (edge <= 0) return;
      const g = ctx.createLinearGradient(edge - S * 1.5, 0, edge + S * 2.5, 0);
      g.addColorStop(0, 'rgba(8,0,0,0.88)'); g.addColorStop(1, 'rgba(8,0,0,0)');
      ctx.fillStyle = 'rgba(8,0,0,0.88)'; ctx.fillRect(0, 0, Math.max(0, edge - S * 1.5), H);
      ctx.fillStyle = g; ctx.fillRect(edge - S * 1.5, 0, S * 4, H);
    },
    acid() { liquid('#d8ff5a', '#4bdc1e', 'rgba(90,255,40,0.3)'); },
    // Golden ruined pillars in the middle distance
    ruins() {
      const off = G.camX * 0.45, base = floorY();
      for (let k = Math.floor(off / 7) - 1; k < (off + VIEW_W) / 7 + 1; k++) {
        const x = (k * 7 + 2 - off) * S, h = (2.5 + ((k * 37) % 5) * 0.6) * S, w = S * 0.9;
        const g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, '#a05a00'); g.addColorStop(0.5, '#ffd23b'); g.addColorStop(1, '#a05a00');
        ctx.globalAlpha = 0.55; ctx.fillStyle = g;
        ctx.fillRect(x, base - h, w, h);
        ctx.fillRect(x - S * 0.2, base - h - S * 0.25, w + S * 0.4, S * 0.25);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let j = 1; j < 4; j++) ctx.fillRect(x + j * w / 4, base - h, 2, h);
      }
    },
    // Spiked stone crushers hanging from chains along the top
    crushers() {
      const off = G.camX * 0.8;
      for (let k = Math.floor(off / 4) - 1; k < (off + VIEW_W) / 4 + 1; k++) {
        const x = (k * 4 - off) * S, len = (0.6 + ((k * 13) % 4) * 0.35 + Math.sin(G.t * 1.5 + k) * 0.1) * S;
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = '#1a0a0a'; ctx.lineWidth = Math.max(2, S * 0.06);
        ctx.beginPath(); ctx.moveTo(x + S * 0.6, 0); ctx.lineTo(x + S * 0.6, len); ctx.stroke();
        ctx.fillStyle = '#3a2a2a'; ctx.fillRect(x, len, S * 1.2, S * 0.7);
        ctx.fillStyle = '#5a4a4a'; ctx.fillRect(x, len, S * 1.2, S * 0.12);
        ctx.fillStyle = '#ff9e2b';
        for (let j = 0; j < 4; j++) { const sx0 = x + j * S * 0.3; ctx.beginPath(); ctx.moveTo(sx0, len + S * 0.7); ctx.lineTo(sx0 + S * 0.15, len + S * 0.95); ctx.lineTo(sx0 + S * 0.3, len + S * 0.7); ctx.fill(); }
      }
    },
    // Snowy mountains and an icy shimmer
    mountains() {
      const base = floorY();
      for (const [par, h, col] of [[0.15, 3.5, 'rgba(200,220,255,0.35)'], [0.3, 2.4, 'rgba(160,190,255,0.45)']]) {
        const off = G.camX * par;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(-10, base);
        for (let k = Math.floor(off / 3) - 1; k < (off + VIEW_W) / 3 + 2; k++) {
          const x = (k * 3 - off) * S, pk = h * (0.6 + ((k * 7919) % 5) / 10);
          ctx.lineTo(x, base); ctx.lineTo(x + 1.5 * S, base - pk * S); ctx.lineTo(x + 3 * S, base);
        }
        ctx.lineTo(W + 10, base); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let k = Math.floor(off / 3) - 1; k < (off + VIEW_W) / 3 + 2; k++) {
          const x = (k * 3 - off) * S, pk = h * (0.6 + ((k * 7919) % 5) / 10);
          ctx.beginPath(); ctx.moveTo(x + 1.5 * S, base - pk * S); ctx.lineTo(x + 1.15 * S, base - (pk - 0.6) * S); ctx.lineTo(x + 1.85 * S, base - (pk - 0.6) * S); ctx.fill();
        }
      }
    },
    // Two wavy chains of glowing orbs joined by crackling lightning
    orbChain(x0, x1, arg, pulse) {
      const fire = arg === 'fire';
      const core = fire ? '#fff2a0' : '#ffffff', mid = fire ? '#ffa31f' : '#7ee8ff', bolt = fire ? '#ffcf5a' : '#c8f4ff';
      const off = G.camX * 0.6;
      for (const [cy, amp, ph] of [[0.3, 1.4, 0], [0.72, 1.2, 2]]) {
        const pts = [];
        for (let k = Math.floor(off / 1.6) - 1; k < (off + VIEW_W) / 1.6 + 2; k++) {
          pts.push([(k * 1.6 - off) * S, H * cy + Math.sin(k * 0.55 + ph) * amp * S]);
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = bolt; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.8;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (!i) { ctx.moveTo(x, y); return; }
          const [px, py] = pts[i - 1];
          for (let j = 1; j <= 3; j++) ctx.lineTo(px + (x - px) * j / 3, py + (y - py) * j / 3 + (Math.random() - 0.5) * S * 0.25);
        });
        ctx.stroke();
        for (const [x, y] of pts) {
          const r = S * (0.32 + pulse * 0.08);
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
          g.addColorStop(0, core); g.addColorStop(0.35, mid); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    chevrons(x0, x1, arg) {
      const col = arg === 'yellow' ? '#ffd21f' : '#ffb0c8';
      const off = G.camX * 0.7;
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, S * 0.12); ctx.lineCap = 'square'; ctx.globalAlpha = 0.75;
      for (let k = Math.floor(off / 3) - 1; k < (off + VIEW_W) / 3 + 1; k++) {
        const x = (k * 3 + ((k * 31) % 3) * 0.4 - off) * S, y = H * (0.2 + ((k * 17) % 7) / 10), z = S * 0.32;
        ctx.save(); ctx.translate(x, y + Math.sin(G.t * 2 + k) * S * 0.1); ctx.rotate(((k * 53) % 4) * Math.PI / 2 * 0.25);
        ctx.beginPath(); ctx.moveTo(-z * 0.5, -z); ctx.lineTo(z * 0.5, 0); ctx.lineTo(-z * 0.5, z); ctx.stroke();
        ctx.restore();
      }
    },
    torches(x0, x1, arg) {
      const base = floorY();
      for (let k = Math.ceil(x0 / 6) * 6; k < x1; k += 6) {
        const x = sx(k + 2);
        if (x < -S || x > W + S) continue;
        ctx.fillStyle = '#2a1a3a'; ctx.fillRect(x - S * 0.2, base - S * 0.9, S * 0.4, S * 0.9);
        ctx.fillStyle = '#4a3a5a'; ctx.fillRect(x - S * 0.32, base - S * 1.0, S * 0.64, S * 0.16);
        flame(x, base - S * 1.0, S * 0.9, arg === 'blue');
      }
    },
    // Winding dark tunnel: black rock above and below with green edges
    cave() {
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      const edge = (top) => {
        ctx.beginPath(); ctx.moveTo(-10, top ? -10 : H + 10);
        const pts = [];
        for (let px = -10; px <= W + 10; px += 10) {
          const wx = G.camX + px / S;
          const c = H * (0.5 + 0.22 * Math.sin(wx * 0.11) + 0.08 * Math.sin(wx * 0.37));
          const yy = c + (top ? -1 : 1) * H * 0.28;
          pts.push([px, yy]); ctx.lineTo(px, yy);
        }
        ctx.lineTo(W + 10, top ? -10 : H + 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4bff6b';
        for (let i = 0; i < pts.length; i += 2) ctx.fillRect(pts[i][0], pts[i][1] - 1.5, 3, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.92)';
      };
      edge(true); edge(false);
    },
    // Dark stone dungeon with grass spikes along the ceiling and floor
    dungeon() {
      const base = floorY();
      ctx.fillStyle = 'rgba(10,0,20,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#5aff3b';
      for (let px = -(G.camX * S % 6); px < W; px += 6) {
        const h = 4 + Math.abs(Math.sin(px * 0.7)) * 6;
        ctx.beginPath(); ctx.moveTo(px, base); ctx.lineTo(px + 3, base - h); ctx.lineTo(px + 6, base); ctx.fill();
      }
    },
    // The 3-2-1 countdown room: big numbers fading through the section
    countdown(x0, x1) {
      const len = x1 - x0, mid = (G.camX + VIEW_W / 2 - x0) / len;
      let n = mid < 1 / 3 ? 3 : mid < 2 / 3 ? 2 : 1, k = (mid * 3) % 1;
      if (G.s) {
        // Which lap of the loop room you're on
        let laps = 0;
        for (const id in G.s.tp) laps += G.s.tp[id];
        n = 3 - laps; k = Math.max(0, Math.min(1, mid));
      }
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(k * Math.PI);
      ctx.font = `${Math.round(H * 0.5)}px 'Lilita One', system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3ae0ff'; ctx.fillText(String(n), W / 2, H * 0.45);
      ctx.font = `${Math.round(S * 0.6)}px 'Lilita One', system-ui, sans-serif`;
      ctx.globalAlpha = 0.8;
      for (const [num, fx, fy] of [[1, 0.25, 0.35], [2, 0.75, 0.6], [3, 0.12, 0.62]]) ctx.fillText(String(num), W * fx, H * fy);
    },
    // Everything turns grey for the transition
    mono() {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H);
    },
    // Neon cyan brick frames and little purple monsters in the background
    neon() {
      const off = G.camX * 0.6;
      for (let k = Math.floor(off / 9) - 1; k < (off + VIEW_W) / 9 + 1; k++) {
        const x = (k * 9 - off) * S, y = H * (0.15 + ((k * 7) % 3) * 0.12);
        ctx.strokeStyle = '#3af0ff'; ctx.lineWidth = Math.max(2, S * 0.1); ctx.globalAlpha = 0.5;
        ctx.shadowColor = '#3af0ff'; ctx.shadowBlur = S * 0.4;
        ctx.strokeRect(x, y, S * 2.4, S * 1.6);
        ctx.shadowBlur = 0;
        const mx = x + S * 4.5, my = y + S * 2.2 + Math.sin(G.t * 3 + k) * S * 0.15;
        ctx.globalAlpha = 0.85; ctx.fillStyle = '#8a3ad0'; ctx.fillRect(mx, my, S * 0.6, S * 0.5);
        ctx.fillStyle = '#c0ff5a'; ctx.fillRect(mx + S * 0.1, my + S * 0.12, S * 0.12, S * 0.12); ctx.fillRect(mx + S * 0.38, my + S * 0.12, S * 0.12, S * 0.12);
      }
    },
    // A candle-lit skull altar just before the end wall
    altar(x0, x1) {
      const L = G.L, x = sx((L ? L.length : x1) - 3), base = floorY();
      if (x < -S * 4 || x > W + S * 4) return;
      ctx.fillStyle = '#1a3a4a'; ctx.fillRect(x - S * 2, base - S * 0.6, S * 4, S * 0.6);
      ctx.fillStyle = '#3af0ff'; ctx.fillRect(x - S * 2, base - S * 0.6, S * 4, S * 0.1);
      ctx.fillStyle = '#e8d8a0';
      ctx.beginPath(); ctx.arc(x, base - S * 1.1, S * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - S * 0.22, base - S * 0.85, S * 0.44, S * 0.25);
      ctx.fillStyle = '#000';
      ctx.fillRect(x - S * 0.2, base - S * 1.2, S * 0.14, S * 0.14); ctx.fillRect(x + S * 0.06, base - S * 1.2, S * 0.14, S * 0.14);
      for (const dx of [-1.5, 1.5]) {
        ctx.fillStyle = '#f0e0c0'; ctx.fillRect(x + dx * S - S * 0.08, base - S * 1.1, S * 0.16, S * 0.5);
        flame(x + dx * S, base - S * 1.1, S * 0.5, false);
      }
    },
  };

  // Block textures a theme can ask for with 'skin:lava|brick|stone'.
  function skinAt(L, x) {
    for (const th of L.themes) {
      if (x < th[0] || x >= th[1]) continue;
      for (let i = 2; i < th.length; i++) if (th[i].startsWith('skin:')) return th[i].slice(5);
    }
    return null;
  }
  function drawSkinBlock(o, sk, pulse) {
    const x = sx(o.x), y = sy(o.y + o.h), w = o.w * S, h = o.h * S;
    if (x > W || x + w < 0 || y > H || y + h < 0) return;
    if (sk === 'lava') {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#ff8a1e'); g.addColorStop(Math.min(1, S / Math.max(h, 1)), '#c8340c'); g.addColorStop(1, '#5a0c04');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      // Dark lava-rock speckles, fixed per block
      ctx.fillStyle = 'rgba(60,8,0,0.55)';
      for (let i = 0; i < o.w * o.h * 3; i++) {
        const u = ((i * 7919 + o.x * 31) % 97) / 97, v = ((i * 104729 + o.y * 17) % 89) / 89;
        ctx.beginPath(); ctx.arc(x + u * w, y + v * h, S * (0.06 + (i % 3) * 0.03), 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = `rgba(255,230,120,${0.7 + pulse * 0.3})`; ctx.fillRect(x, y, w, Math.max(2, S * 0.07));
      ctx.strokeStyle = '#2a0400'; ctx.lineWidth = Math.max(1.5, S * 0.05); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    } else if (sk === 'skull') {
      drawSkinBlock(o, 'lava', pulse);
      if (o.hang) {
        // Chains up into the dark, and the odd hanging cage
        ctx.strokeStyle = '#1a0606'; ctx.lineWidth = Math.max(2, S * 0.07);
        for (const fx of [0.2, 0.8]) {
          const cx = x + w * fx;
          for (let yy = y - S * 0.25; yy > -S; yy -= S * 0.3) {
            ctx.beginPath(); ctx.ellipse(cx, yy, S * 0.06, S * 0.12, 0, 0, Math.PI * 2); ctx.stroke();
          }
        }
        // Spiked sides
        ctx.fillStyle = '#c8c8d0';
        for (const side of [0, 1]) {
          for (let j = 0; j < o.h * 3; j++) {
            const yy = y + (j + 0.5) * S / 3, xx = side ? x + w : x, dir = side ? 1 : -1;
            ctx.beginPath(); ctx.moveTo(xx, yy - S * 0.1); ctx.lineTo(xx + dir * S * 0.22, yy); ctx.lineTo(xx, yy + S * 0.1); ctx.fill();
          }
        }
        if (Math.floor(o.x) % 3 === 0) {
          const cx = x + w + S * 0.9, cy = y + S * 0.6;
          ctx.beginPath(); ctx.moveTo(cx, -S); ctx.lineTo(cx, cy - S * 0.45); ctx.stroke();
          ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = Math.max(1.5, S * 0.04);
          ctx.strokeRect(cx - S * 0.3, cy - S * 0.45, S * 0.6, S * 0.8);
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - S * 0.3 + i * S * 0.15, cy - S * 0.45); ctx.lineTo(cx - S * 0.3 + i * S * 0.15, cy + S * 0.35); ctx.stroke(); }
        }
      }
      if (o.w >= 2 && o.h >= 2) {
        // Demon skull face
        const cx = x + w / 2, cy = y + h * (o.hang ? 0.5 : 0.45), z = Math.min(w, h) * 0.32;
        ctx.fillStyle = 'rgba(40,0,0,0.75)';
        ctx.beginPath(); ctx.ellipse(cx, cy, z, z * 0.9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,${200 + pulse * 55},60,1)`;
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + k * z * 0.15, cy - z * 0.15); ctx.lineTo(cx + k * z * 0.65, cy - z * 0.45); ctx.lineTo(cx + k * z * 0.55, cy + z * 0.05); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = '#ffe9c0';
        for (let i = -2; i <= 2; i++) ctx.fillRect(cx + i * z * 0.2 - z * 0.07, cy + z * 0.3, z * 0.14, z * 0.22);
        ctx.fillStyle = '#ffb000';
        for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + k * z * 0.6, cy - z * 0.7); ctx.lineTo(cx + k * z * 1.0, cy - z * 1.25); ctx.lineTo(cx + k * z * 0.9, cy - z * 0.6); ctx.fill(); }
      }
    } else if (sk === 'gold') {
      // Fluted golden pillar with a capital
      const g = ctx.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#a05a00'); g.addColorStop(0.45, '#ffe066'); g.addColorStop(1, '#a05a00');
      ctx.fillStyle = g; ctx.fillRect(x + w * 0.08, y, w * 0.84, h);
      ctx.fillStyle = 'rgba(120,60,0,0.45)';
      for (let i = 1; i < 4; i++) ctx.fillRect(x + w * 0.08 + i * w * 0.21, y + S * 0.3, Math.max(2, S * 0.05), h - S * 0.3);
      ctx.fillStyle = '#ffd23b'; ctx.fillRect(x - 2, y, w + 4, S * 0.28);
      ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = Math.max(1.5, S * 0.05);
      ctx.strokeRect(x - 2, y, w + 4, S * 0.28); ctx.strokeRect(x + w * 0.08, y + S * 0.28, w * 0.84, h - S * 0.28);
      ctx.fillStyle = `rgba(255,240,160,${0.3 + pulse * 0.4})`; ctx.fillRect(x - 2, y - 2, w + 4, 3);
    } else if (sk === 'brick') {
      ctx.fillStyle = '#140c34'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(58,240,255,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j < o.h * 2; j++) {
        const yy = y + j * S / 2; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy);
        for (let i = (j % 2) * 0.5; i < o.w; i += 1) { ctx.moveTo(x + i * S, yy); ctx.lineTo(x + i * S, yy + S / 2); }
      }
      ctx.stroke();
      ctx.save();
      ctx.shadowColor = '#3af0ff'; ctx.shadowBlur = S * (0.3 + pulse * 0.2);
      ctx.strokeStyle = '#5af6ff'; ctx.lineWidth = Math.max(2, S * 0.09); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1e1a24'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(160,150,180,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 0; j < o.h * 2; j++) {
        const yy = y + j * S / 2; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy);
        for (let i = (j % 2) * 0.5; i < o.w; i += 1) { ctx.moveTo(x + i * S, yy); ctx.lineTo(x + i * S, yy + S / 2); }
      }
      ctx.stroke();
      ctx.strokeStyle = '#6a6478'; ctx.lineWidth = Math.max(1.5, S * 0.06); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      if (sk === 'moss') { ctx.fillStyle = '#5aff3b'; ctx.fillRect(x, y - 2, w, Math.max(3, S * 0.08)); }
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
    const blocks = [], others = [], glowOrbs = [];
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
    for (const o of blocks) {
      const sk = L.themes && skinAt(L, o.x + o.w / 2);
      if (sk) drawSkinBlock(o, sk, pulse); else drawBlock(o, top, edge, pulse);
    }
    if (detail()) drawBlockDeco(blocks, col, pulse);
    for (const o of others) {
      if (o.t === 's' || o.t === 'ss') drawSpike(o, top);
      else if (o.t === 'pad') drawPad(o, pulse);
      else if (o.t === 'orb') drawOrb(o, pulse);
      else if (o.t === 'saw') { if (o.glow) glowOrbs.push(o); else drawSaw(o, col); }
      else if (o.t === 'coin') drawCoin(o);
      else if (o.t === 'sw') drawSwitch(o, pulse);
      else if (o.t === 'tp') drawTeleport(o);
    }
    if (glowOrbs.length) drawGlowOrbs(glowOrbs, pulse);
    for (const o of others) if (o.t === 'fake') drawFake(o, top, edge);
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

  // Dash's orb chains: glowing hazard orbs joined by crackling lightning.
  function drawGlowOrbs(list, pulse) {
    list.sort((a, b) => a.x - b.x);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const rows = {};
    for (const o of list) (rows[o.glow] = rows[o.glow] || []).push(o);
    for (const key in rows) {
      const fire = key.startsWith('fire'), row = rows[key];
      ctx.strokeStyle = fire ? '#ffcf5a' : '#c8f4ff'; ctx.lineWidth = Math.max(1.5, S * 0.05);
      ctx.beginPath();
      for (let i = 1; i < row.length; i++) {
        const a = row[i - 1], b = row[i];
        if (b.x - a.x > 2) continue;
        const ax = sx(a.x + a.r), ay = sy(a.y + a.r), bx = sx(b.x + b.r), by = sy(b.y + b.r);
        ctx.moveTo(ax, ay);
        for (let j = 1; j < 4; j++) ctx.lineTo(ax + (bx - ax) * j / 4 + (Math.random() - 0.5) * S * 0.1, ay + (by - ay) * j / 4 + (Math.random() - 0.5) * S * 0.25);
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
      for (const o of row) {
        const x = sx(o.x + o.r), y = sy(o.y + o.r), R = o.r * S * (1.25 + pulse * 0.2);
        if (x < -R * 2 || x > W + R * 2) continue;
        const g = ctx.createRadialGradient(x, y, 0, x, y, R * 1.7);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, fire ? '#ffe066' : '#bff6ff'); g.addColorStop(0.55, fire ? '#ff7a1a' : '#3ac8ff'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, R * 1.7, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  // Switch block (Dash's coin 1 puzzle): red-and-gold until you bump it, then green.
  function drawSwitch(o, pulse) {
    const x = sx(o.x), y = sy(o.y + o.h), w = o.w * S, h = o.h * S;
    if (x > W || x + w < 0) return;
    const on = G.s && G.s.lit.indexOf(o.id) !== -1;
    ctx.strokeStyle = '#1a0a0a'; ctx.lineWidth = Math.max(2, S * 0.05);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y - S * 3); ctx.stroke();
    ctx.save();
    if (on) { ctx.shadowColor = '#5aff3b'; ctx.shadowBlur = S * (0.5 + pulse * 0.3); }
    ctx.fillStyle = on ? '#3bdc1e' : (o.id % 2 ? '#d02020' : '#ffb000');
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(2, S * 0.06); ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5);
    ctx.fillStyle = on ? '#c0ff9a' : '#ffe9a0'; ctx.fillRect(x + w * 0.35, y + h * 0.35, w * 0.3, h * 0.3);
  }

  // Loop teleport: a blue ring that swirls you back to the room's start.
  function drawTeleport(o) {
    const x = sx(o.x + 0.5), y = sy(o.y), h = o.h * S;
    if (x < -S * 2 || x > W + S * 2) return;
    const left = G.s ? o.n - (G.s.tp[o.id] || 0) : o.n;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = left > 0 ? `rgba(80,200,255,${0.8 - i * 0.2})` : 'rgba(255,170,60,0.5)';
      ctx.lineWidth = Math.max(2, S * 0.12);
      ctx.beginPath(); ctx.ellipse(x, y, S * (0.35 + i * 0.12), h / 2 - i * S * 0.2, 0, G.t * (3 + i), G.t * (3 + i) + Math.PI * 1.5); ctx.stroke();
    }
    ctx.restore();
  }

  // Secret coin: spinning gold disc with a star. Taken this run = gone;
  // collected on an earlier clear = ghostly.
  function drawCoin(o) {
    if (G.s && G.s.coins.indexOf(o.id) !== -1) return;
    if (o.lock && G.s && P.lit(G.s, G.L, o.lock) < o.lockN) {
      // Still sunk in the lava: just the rim showing, rising as switches light.
      const k = P.lit(G.s, G.L, o.lock) / o.lockN;
      ctx.save(); ctx.globalAlpha = 0.35 + k * 0.3;
      ctx.fillStyle = '#ffc61a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sx(o.x + 0.5), sy(o.y - 0.4 + k * 0.5), S * 0.4, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.restore();
      return;
    }
    const x = sx(o.x + 0.5), y = sy(o.y + 0.5) + Math.sin(G.t * 3 + o.id) * S * 0.06;
    if (x < -S || x > W + S) return;
    const owned = !!(G.s && G.L.coinIds) && (G.ownedCoins || []).indexOf(G.L.coinIds.indexOf(o.id)) !== -1;
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
    if (G.s && detail() && Math.random() < 0.15) spawn(o.x + 0.2 + Math.random() * 0.6, o.y + Math.random(), 0, 0.8, 0.5, 0.08, '#ffe066', true);
  }

  // Fake wall over a secret coin: looks like the column around it, with a
  // faint shimmer as the only hint. Goes see-through once you're inside.
  function drawFake(o, topCol, edgeCol) {
    const x = sx(o.x), y = sy(o.y + o.h), w = o.w * S, h = o.h * S;
    if (x > W || x + w < 0) return;
    const s = G.s, inside = !!s && s.x + 1 > o.x && s.x < o.x + o.w && s.y + 1 > o.y && s.y < o.y + o.h;
    o._a = (o._a === undefined ? 0.94 : o._a) + ((inside ? 0.3 : 0.94) - (o._a === undefined ? 0.94 : o._a)) * 0.15;
    ctx.save();
    ctx.globalAlpha = o._a;
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < o.w; i++) { ctx.moveTo(x + i * S, y); ctx.lineTo(x + i * S, y + h); }
    ctx.stroke();
    if (detail()) {
      ctx.strokeStyle = edgeCol;
      ctx.globalAlpha = o._a * 0.35;
      ctx.strokeRect(x + S * 0.16, y + S * 0.16, w - S * 0.32, h - S * 0.32);
      // A slow diagonal glint sweeping across every few seconds
      const ph = ((G.t * 0.45 + o.x * 0.07) % 1) * 1.6 - 0.3;
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.globalAlpha = o._a * 0.16;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const gx = x + ph * (w + h);
      ctx.moveTo(gx, y); ctx.lineTo(gx + S * 0.35, y); ctx.lineTo(gx + S * 0.35 - h, y + h); ctx.lineTo(gx - h, y + h);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = o._a;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.5, S * 0.06);
    ctx.beginPath();
    ctx.moveTo(x + 1, y); ctx.lineTo(x + 1, y + h);
    ctx.moveTo(x + w - 1, y); ctx.lineTo(x + w - 1, y + h);
    ctx.stroke();
    ctx.globalAlpha = 1;
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
    const used = !!G.s && G.s.used.indexOf(o.id) !== -1;
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
    const used = !!G.s && G.s.used.indexOf(o.id) !== -1;
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

  // The end wall: a glowing band with a bright edge, a block past the
  // level's last column. Flares up when the icon hits it.
  const WALL = 1.5;
  function drawEndLine(L) {
    const x = sx(L.length + WALL);
    if (x > W + 10) return;
    const hit = G.fin && G.fin.hit ? Math.max(0, 1 - (G.fin.t - 0.5) * 1.5) : 0;
    const g = ctx.createLinearGradient(x - S * 3, 0, x, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, `rgba(255,255,255,${0.7 + hit * 0.3})`);
    ctx.fillStyle = g;
    ctx.fillRect(x - S * 3, 0, S * 3, H);
    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 2, 0, 4 + hit * S * 0.3, H);
    if (G.s && detail() && Math.random() < 0.5) {
      spawn(L.length + WALL - Math.random() * 0.4, G.camY + Math.random() * viewH, -0.5 - Math.random(), 1 + Math.random() * 2, 0.6, 0.08, '#fff', true);
    }
  }

  // Finish: 0-0.5s the icon is pulled in an arc into the end wall, spinning
  // and shrinking; on contact a flash, a ring and a burst of light rays;
  // from 0.75s the banner drops in. game.update() opens the results at 2.5s.
  function drawFinish(s) {
    const f = G.fin, L = G.L;
    const wx = L.length + WALL, wy = G.camY + viewH / 2;
    const k = Math.min(1, f.t / 0.5), e = k * k;
    if (!f.hit) {
      const cx = (f.x + wx) / 2, cy = Math.max(f.y, wy) + 2.5;
      const x = (1 - e) * (1 - e) * f.x + 2 * (1 - e) * e * cx + e * e * wx;
      const y = (1 - e) * (1 - e) * f.y + 2 * (1 - e) * e * cy + e * e * wy;
      G.rot += 0.35 + k * 0.5;
      drawPlayer(s, x, y, 1 - 0.75 * e);
      if (k >= 1) {
        f.hit = true;
        G.flash = 1;
        if (SET.shake) G.shake = 0.25;
        AUDIO.boom();
        for (let i = 0; i < 150; i++) {
          const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 14;
          spawn(wx, wy, Math.cos(a) * v - 3, Math.sin(a) * v, 0.8 + Math.random(),
            0.1 + Math.random() * 0.2, ['#ffe23b', SKIN.c1, SKIN.c2, '#fff'][i % 4], i % 2 === 0);
        }
      }
      return;
    }
    const t = f.t - 0.5;
    const X = sx(wx), Y = sy(wy);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Light rays fanning out from the impact, slowly turning.
    const R = Math.max(W, H) * 1.3 * Math.min(1, t / 0.35);
    const fade = t > 1.6 ? Math.max(0.35, 1 - (t - 1.6)) : 1;
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = G.t * 0.35 + (i / n) * Math.PI * 2, w = Math.PI / n * 0.55;
      ctx.fillStyle = i % 2 ? `rgba(255,226,90,${0.22 * fade})` : `rgba(255,255,255,${0.16 * fade})`;
      ctx.beginPath(); ctx.moveTo(X, Y);
      ctx.lineTo(X + Math.cos(a - w) * R, Y + Math.sin(a - w) * R);
      ctx.lineTo(X + Math.cos(a + w) * R, Y + Math.sin(a + w) * R);
      ctx.closePath(); ctx.fill();
    }
    // Two shock rings
    for (const d of [0, 0.18]) {
      const p = (t - d) / 0.7;
      if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = `rgba(255,255,255,${1 - p})`;
      ctx.lineWidth = S * 0.35 * (1 - p) + 1;
      ctx.beginPath(); ctx.arc(X, Y, S * (0.5 + p * 9), 0, Math.PI * 2); ctx.stroke();
    }
    const glow = ctx.createRadialGradient(X, Y, 0, X, Y, S * 4);
    glow.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(X - S * 4, Y - S * 4, S * 8, S * 8);
    ctx.restore();
  }

  // "LEVEL COMPLETE!" drops in big, overshoots and settles (screen space).
  function drawFinishBanner() {
    const f = G.fin;
    if (!f || G.screen === 'complete') return;
    const p = Math.min(1, (f.t - 0.75) / 0.55);
    if (p <= 0) return;
    const c1 = 1.70158, c3 = c1 + 1;
    const back = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    const sc = 1 + (1 - back) * 1.6;
    const px = Math.min(W * 0.085, 86) * sc;
    const text = G.practice ? 'PRACTICE COMPLETE!' : 'LEVEL COMPLETE!';
    const y = H * 0.3;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 3);
    ctx.font = `${Math.round(px)}px 'Lilita One', system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(4, px * 0.16); ctx.strokeStyle = '#000';
    ctx.strokeText(text, W / 2, y + px * 0.07);
    ctx.strokeText(text, W / 2, y);
    const g = ctx.createLinearGradient(0, y - px / 2, 0, y + px / 2);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffe066'); g.addColorStop(1, '#ffa600');
    ctx.fillStyle = g;
    ctx.fillText(text, W / 2, y);
    ctx.restore();
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

  // Trail colour for a style at segment k (shop trails).
  function trailColor(id, k, t) {
    switch (id) {
      case 'rainbow': return `hsl(${(k * 25 + t * 200) % 360},95%,60%)`;
      case 'fire': return ['#fff0a0', '#ffd21f', '#ff8a1e', '#ff3a14'][k % 4];
      case 'ice': return k % 2 ? '#bff6ff' : '#ffffff';
      case 'neon': return SKIN.c1;
      case 'gold': return k % 3 ? '#ffd21f' : '#fff3a0';
      case 'hearts': return k % 2 ? '#ff4f8a' : '#ffb0c8';
      case 'lightning': return k % 2 ? '#c8f4ff' : '#ffffff';
      case 'ghost': return SKIN.c2;
      case 'galaxy': return ['#c08aff', '#ffffff', '#5a8aff', '#ffe0ff'][k % 4];
      case 'void': return k % 2 ? '#2a0040' : '#8a2be2';
      case 'smoke': return '#9a9aaa';
      default: return '#ffffff';
    }
  }
  function deathColors(id) {
    switch (id) {
      case 'confetti': case 'fireworks': return ['#ff3b5c', '#ffe23b', '#3bff6b', '#3ac8ff', '#ff4fd8'];
      case 'ghost': return ['#ffffff', '#c8d8ff'];
      case 'vaporize': return ['#ffffff', '#bff6ff'];
      case 'blackhole': return ['#8a2be2', '#2a0040', '#ffffff'];
      case 'nova': return ['#ffffff', '#ffe066', '#ff8a1e'];
      case 'lightning': return ['#ffffff', '#c8f4ff', '#3ac8ff'];
      case 'glitch': return ['#00f0ff', '#ff00e0', '#ffffff'];
      default: return [SKIN.c1, SKIN.c2];
    }
  }

  function drawTrail(s) {
    const tr = G.ptrail, id = SKIN.trail || 'classic';
    if (tr.length < 6) return;
    ctx.lineCap = 'round';
    if (id === 'neon' || id === 'void' || id === 'galaxy') { ctx.shadowColor = trailColor(id, 0, G.t); ctx.shadowBlur = S * 0.4; }
    for (let i = 3; i < tr.length; i += 3) {
      const k = 1 - (G.t - tr[i + 2]) / 0.3, seg = i / 3;
      const col = id === 'classic' ? '#ffffff' : trailColor(id, seg, G.t);
      ctx.strokeStyle = col;
      ctx.globalAlpha = s.dash ? k * 0.9 : k * (id === 'classic' ? 0.55 : 0.8);
      ctx.lineWidth = S * (s.mini ? 0.18 : 0.3) * k * (id === 'lightning' ? 0.6 : 1);
      ctx.beginPath();
      const jx = id === 'lightning' ? (Math.random() - 0.5) * S * 0.3 : 0;
      ctx.moveTo(sx(tr[i - 3]), sy(tr[i - 2])); ctx.lineTo(sx(tr[i]) + jx, sy(tr[i + 1]) + jx); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
    if (id === 'ghost' && tr.length > 12) {
      // Afterimages of the icon along the trail
      for (let i = tr.length - 12; i > 0; i -= 9) {
        ctx.save(); ctx.globalAlpha = 0.18 * i / tr.length;
        ctx.translate(sx(tr[i]), sy(tr[i + 1]));
        drawIcon(s.mode, (s.mini ? 0.6 : 1) * S, s);
        ctx.restore();
      }
    }
  }
  // Particles some trails leave behind wherever you go.
  function trailParticles(s, dt) {
    const id = SKIN.trail || 'classic';
    const rate = { fire: 50, smoke: 25, gold: 30, hearts: 10, galaxy: 30, ice: 20, void: 25 }[id];
    if (!rate || Math.random() > dt * rate) return;
    const y = s.y + (Math.random() - 0.5) * 0.5;
    if (id === 'fire') spawn(s.x - 0.4, y, -2, 1 + Math.random() * 2, 0.35, 0.1 + Math.random() * 0.1, trailColor('fire', Math.floor(Math.random() * 4)), false, true);
    else if (id === 'smoke') spawn(s.x - 0.4, y, -1, 1.5, 0.6, 0.2 + Math.random() * 0.15, 'rgba(150,150,170,0.6)', false);
    else spawn(s.x - 0.4, y, -1 - Math.random() * 2, (Math.random() - 0.5) * 2, 0.5, 0.06 + Math.random() * 0.08, trailColor(id, Math.floor(Math.random() * 4), G.t), id !== 'hearts');
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

  function drawPlayer(s, px, py, scale = 1) {
    if (s.auto) {
      // The "1" flying as a glowing orb, with a sparkling tail.
      const x = sx(px), y = sy(py), R = S * 0.45;
      if (Math.random() < 0.8) spawn(px - 0.2, py + (Math.random() - 0.5) * 0.4, -3 - Math.random() * 3, (Math.random() - 0.5) * 2, 0.4, 0.1, Math.random() < 0.5 ? '#bff6ff' : '#3ac8ff', true);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 2.4);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#7ee8ff'); g.addColorStop(0.6, '#1e8cff'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    const size = (s.mini ? 0.6 : 1) * S * scale;
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
    ctx.strokeStyle = SKIN.trail && SKIN.trail !== 'classic' ? trailColor(SKIN.trail, 0, G.t) : SKIN.c2; ctx.globalAlpha = 0.9;
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
    if (G.orbPop) {
      const rise = (1.1 - G.orbPop.t) * 16;
      ctx.globalAlpha = Math.min(1, G.orbPop.t * 3);
      const ox = bx + bw + 20, oy = by + bh + 26 - rise;
      drawOrbIcon(ox, oy, 9);
      outlinedText(`+${G.orbPop.n}`, ox + 14, oy, 18, 'left', '#9ff3ff');
      ctx.globalAlpha = 1;
    }
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

  function drawOrbIcon(x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#5ff0ff'); g.addColorStop(1, '#1060e0');
    ctx.fillStyle = g; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
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
  const SCREENS = ['home', 'select', 'practice', 'settings', 'statsScr', 'skin', 'shop', 'vault', 'create', 'editor', 'shared', 'online', 'pause', 'complete'];

  // Main levels, easiest first (indexes stay stable so saves don't move).
  // The secret level joins the end once its door has been found.
  let MAIN = [];
  function refreshMain() {
    MAIN = LEVELS.map((L, i) => i).filter((i) => !LEVELS[i].training && (!LEVELS[i].secret || hasEgg('door')))
      .sort((a, b) => (LEVELS[a].order ?? LEVELS[a].stars) - (LEVELS[b].order ?? LEVELS[b].stars) || a - b);
  }
  refreshMain();
  function coinSlots(i) {
    const got = store.get('coins:' + slotOf(i), []);
    return Array.from({ length: LEVELS[i].coinCount || 0 }, (_, k) =>
      `<span class="coin${got.indexOf(k) !== -1 ? ' got' : ''}"></span>`).join('');
  }
  // Practice levels: PRACTICE[mini][mode][tier] -> LEVELS index.
  const PRACTICE = { false: {}, true: {} };
  LEVELS.forEach((L, i) => { if (L.training) (PRACTICE[!!L.mini][L.mode] = PRACTICE[!!L.mini][L.mode] || [])[L.tier] = i; });
  const PRAC_TOTAL = LEVELS.filter((L) => L.training).length;

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
    if (['home', 'select', 'practice', 'statsScr', 'skin', 'shop', 'vault', 'create', 'editor', 'shared', 'online'].indexOf(screen) !== -1 || (screen === 'settings' && !G.s)) {
      if (G.s && screen !== 'settings') { AUDIO.stop(); G.s = null; }
    }
    if (screen === 'home') buildHome();
    if (screen === 'select') buildSelect();
    if (screen === 'practice') buildPractice();
    if (screen === 'statsScr') buildStats();
    if (screen === 'skin') buildSkin();
    if (screen === 'shop') buildShop();
    if (screen === 'vault') buildVault();
    if (screen === 'create') buildCreate();
    if (screen === 'editor') buildEditor();
    if (screen === 'online') buildOnline();
  }

  // ---------------------------------------------------------- home
  function buildHome() {
    G.menuBg = ['#2b5bff', '#1a3acc'];
    const beaten = MAIN.filter((i) => bestOf(i, false) === 100).length;
    $('tagline').textContent = `${MAIN.length} levels · ${PRAC_TOTAL} mode practices · ${beaten}/${MAIN.length} beaten`;
    iconCanvas($('hIconCv'), 'cube', 64, 0.7);
    iconCanvas($('hPracCv'), 'ship', 64, 0.8);
    $('hWallet').innerHTML = walletHtml();
    $('moon').classList.toggle('found', hasEgg('moon'));
    $('keyhole').className = 'keyhole' + (hasEgg('door') ? ' open' : '');
  }

  // ------------------------------------------------------ easter eggs
  // Main menu secrets: tap the logo 10 times (Glitch set), tap the faint
  // moon (Ghost), tap the four corners clockwise from the top left or
  // type the Konami code (Royal), and tap the keyhole in the ground three
  // times to open the secret level.
  let toastTimer = 0;
  function toast(text, icon) {
    $('toastText').textContent = text;
    $('toastCv').style.display = icon ? '' : 'none';
    if (icon) iconCanvasV($('toastCv'), icon[0], 48, 0.75, icon[1]);
    $('toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('show'), 3400);
  }
  function findEgg(k) {
    if (hasEgg(k)) return;
    store.set('eggs', store.get('eggs', []).concat(k));
    AUDIO.unlock();
    if (k === 'door') {
      refreshMain();
      toast('A secret door opened... check the level select!');
    } else {
      const set = EGG_SET[k];
      toast(`Secret found! ${ICONS.setName(set)} icon set unlocked`, ['cube', ICONS.special(set)]);
    }
    buildHome();
  }

  let logoTaps = 0, logoT = 0;
  $('logo').addEventListener('click', () => {
    const now = performance.now(), el = $('logo');
    logoTaps = now - logoT < 1500 ? logoTaps + 1 : 1;
    logoT = now;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 110);
    AUDIO.tick();
    if (logoTaps >= 10) {
      logoTaps = 0;
      el.classList.remove('spin'); void el.offsetWidth; el.classList.add('spin');
      findEgg('logo');
    }
  });
  $('moon').addEventListener('click', () => { $('moon').classList.add('found'); findEgg('moon'); });

  const CORNERS = ['tl', 'tr', 'br', 'bl'];
  let cornerSeq = [], cornerT = 0;
  $('home').addEventListener('pointerdown', (e) => {
    const m = Math.max(56, Math.min(W, H) * 0.14);
    const h = e.clientX < m ? 'l' : e.clientX > W - m ? 'r' : null;
    const v = e.clientY < m ? 't' : e.clientY > H - m ? 'b' : null;
    if (!h || !v) { cornerSeq = []; return; }
    const now = performance.now();
    if (now - cornerT > 6000) cornerSeq = [];
    cornerT = now;
    cornerSeq.push(v + h);
    if (cornerSeq.join() !== CORNERS.slice(0, cornerSeq.length).join()) cornerSeq = v + h === 'tl' ? ['tl'] : [];
    if (cornerSeq.length === 4) { cornerSeq = []; findEgg('corners'); }
  });
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
  let konami = 0;
  function konamiKey(code) {
    konami = code === KONAMI[konami] ? konami + 1 : code === KONAMI[0] ? (konami === 2 ? 2 : 1) : 0;
    if (konami === KONAMI.length) { konami = 0; findEgg('corners'); }
  }

  let keyTaps = 0;
  $('keyhole').addEventListener('click', () => {
    if (hasEgg('door')) { show('select'); setPage(MAIN.indexOf(SECRET)); return; }
    keyTaps++;
    AUDIO.tick();
    $('keyhole').className = 'keyhole k' + Math.min(2, keyTaps);
    if (keyTaps >= 3) findEgg('door');
  });

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
        <div class="lvcard${L.secret ? ' secret' : ''}" role="button" tabindex="0" aria-label="Play ${L.name}" style="--lvc:${L.secret ? '#2a0a4a' : L.colors[0].bg}">
          <canvas></canvas>
          <div>
            <div class="lvno">${L.secret ? 'Secret Level' : 'Level ' + (L.levelNo || '')}</div>
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
        <div class="row"><button class="alt" data-prac="${i}">Practice</button><button class="ghost songbtn" data-song="${i}"></button></div>`;
      track.appendChild(slide);
      faceCanvas(slide.querySelector('canvas'), L.difficulty, 120, auraOf(L));
      const card = slide.querySelector('.lvcard');
      card.addEventListener('click', () => { if (!swiped) startLevel(i, false, 'select'); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') startLevel(i, false, 'select'); });
      slide.querySelector('[data-prac]').addEventListener('click', () => startLevel(i, true, 'select'));
      const sb = slide.querySelector('[data-song]');
      sb.textContent = '\u266a ' + songLabel(L, slotOf(i));
      sb.addEventListener('click', () => openSong(L, slotOf(i), () => buildSelect()));
      const dot = document.createElement('i');
      dots.appendChild(dot);
    });
    // GD's "Coming soon" page at the end. It talks back, and drops hints.
    const soon = document.createElement('div');
    soon.className = 'slide';
    soon.innerHTML = '<div class="soon" role="button" tabindex="0" aria-label="Coming soon">Coming Soon!<small></small></div>';
    soon.firstChild.addEventListener('click', () => { if (!swiped) soonTap(); });
    track.appendChild(soon);
    dots.appendChild(document.createElement('i'));
    setPage(G.page, true);
  }

  const SOON = [
    'Stop poking it.', 'It is still coming soon.', 'Seriously, there is nothing here.', 'Okay. Want a secret?',
    'Tap the logo. A lot.', 'The moon is watching you.', 'Corners. Clockwise, from the top left.',
    'Something is buried in the ground...', 'Codes go in the Vault.', 'That is all I know.', 'Go away.', '...',
  ];
  function soonTap() {
    G.soonN = ((G.soonN || 0) % SOON.length) + 1;
    $('track').querySelector('.soon small').textContent = SOON[G.soonN - 1];
    AUDIO.tick();
  }

  function setPage(p, instant) {
    const n = MAIN.length + 1;
    G.page = ((p % n) + n) % n;
    store.set('page', G.page);
    const track = $('track');
    if (instant) { track.style.transition = 'none'; requestAnimationFrame(() => { track.style.transition = ''; }); }
    track.style.transform = `translateX(${-G.page * 100}%)`;
    [...$('dots').children].forEach((d, k) => d.classList.toggle('on', k === G.page));
    const L = LEVELS[MAIN[G.page]];
    G.menuBg = L ? [L.colors[0].bg, L.colors[0].gr] : ['#20203a', '#121224'];
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
      ['Demons beaten', demons], ['Mode practices', `${prac}/${PRAC_TOTAL}`],
      ['Coins', `${LEVELS.reduce((n, L, i) => n + store.get('coins:' + slotOf(i), []).length, 0)}/${LEVELS.reduce((n, L) => n + (L.coinCount || 0), 0)}`],
      ['Icons', `${iconsOwned()}/${ICONS.TOTAL * 8}`],
      ['Orbs', store.get('orbs', 0)], ['Diamonds', store.get('diamonds', 0)],
      ['Secrets found', `${['moon', 'logo', 'corners', 'door'].filter(hasEgg).length}/4`],
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
      for (const col of PALETTE.concat(SHOP_COLORS.map((c) => c[0]).filter((c) => ownedItem('col:' + c)))) {
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
    $('kitCount').textContent = `${iconsOwned()}/${ICONS.TOTAL * P.MODES.length} icons unlocked \u00b7 beat any level to unlock the next`;
    const grid = $('kitGrid');
    grid.innerHTML = '';
    for (let v = 0; v < ICONS.TOTAL; v++) {
      const m = G.kitMode;
      if (v === ICONS.COUNT) {
        const sep = document.createElement('div');
        sep.className = 'label kitsep';
        sep.textContent = 'Special icons: shop, secret coins, vault codes and secrets';
        grid.appendChild(sep);
      }
      const open = isUnlocked(m, v);
      const hint = v >= ICONS.COUNT ? setHint(m, ICONS.SETS[v - ICONS.COUNT]) : 'Beat more levels';
      const b = document.createElement('button');
      b.className = (equipped(m) === v ? 'on' : '') + (open ? '' : ' locked');
      b.title = open ? ICONS.name(m, v) : 'Locked: ' + hint;
      b.setAttribute('aria-label', open ? `${ICONS.name(m, v)} ${MODE_LABEL[m]}` : `Locked ${MODE_LABEL[m]} icon. ${hint}`);
      b.innerHTML = '<canvas></canvas>' + (open ? '' : '<span class="lock">\ud83d\udd12</span>');
      b.addEventListener('click', () => {
        if (open) { SKIN.icons[m] = v; saveSkin(); buildSkin(); } else toast(hint, null);
      });
      grid.appendChild(b);
      iconCanvasV(b.querySelector('canvas'), m, 48, 0.68, v);
    }
    $('glowBtn').textContent = `Glow: ${SKIN.glow ? 'On' : 'Off'}`;
    requestAnimationFrame(renderSkinPreview);
  }

  function iconsOwned() {
    return Math.min(ICONS.COUNT * 8, 8 + levelsBeaten()) + specialsOwned().length;
  }

  // ------------------------------------------------------------- shop
  const SHOP_SETS = Object.keys(SHOP_ORBS).concat(Object.keys(SHOP_DIAMONDS));
  const KEEPER = [
    'Welcome! Spend those orbs.', 'Fresh icons, just in.', 'No refunds. Ever.',
    'Prism costs diamonds. Worth every one.', 'Back again? Good taste.', 'Orbs come from beating your best. Go earn some.',
  ];
  function buildShop(say) {
    G.menuBg = ['#6a3300', '#3a1a00'];
    const cat = G.shopCat || 'icons', m = G.shopMode || 'cube';
    $('shopSay').textContent = say || KEEPER[Math.floor(Math.random() * KEEPER.length)];
    $('shopWallet').innerHTML = walletHtml();
    const cats = $('shopCats');
    cats.innerHTML = '';
    for (const [k, label] of [['icons', 'Icons'], ['colors', 'Colours'], ['trails', 'Trails'], ['deaths', 'Death FX']]) {
      const b = document.createElement('button');
      b.textContent = label; b.className = k === cat ? 'on' : '';
      b.addEventListener('click', () => { G.shopCat = k; buildShop($('shopSay').textContent); });
      cats.appendChild(b);
    }
    const tabs = $('shopTabs');
    tabs.innerHTML = '';
    tabs.style.display = cat === 'icons' ? '' : 'none';
    if (cat === 'icons') {
      for (const mm of P.MODES) {
        const b = document.createElement('button');
        b.className = mm === m ? 'on' : '';
        b.setAttribute('aria-label', MODE_LABEL[mm]); b.title = MODE_LABEL[mm];
        b.innerHTML = '<canvas></canvas>';
        b.addEventListener('click', () => { G.shopMode = mm; buildShop($('shopSay').textContent); });
        tabs.appendChild(b);
        iconCanvasV(b.querySelector('canvas'), mm, 40, 0.7, ICONS.special(SHOP_SETS[P.MODES.indexOf(mm) % SHOP_SETS.length]));
      }
    }
    const grid = $('shopGrid');
    grid.innerHTML = '';
    const w = wallet();
    // One shop card: preview, name, and a buy / equip button.
    const card = (name, price, cur, own, isOn, onEquip, ownKey, preview) => {
      const can = cur === 'diamonds' ? w.diamonds >= price : w.orbs >= price;
      const it = document.createElement('div');
      it.className = 'item';
      const btn = own ? (isOn ? 'Equipped' : 'Equip') : `<span class="${cur === 'diamonds' ? 'dia-i' : 'orb-i'}"></span>${price.toLocaleString()}`;
      it.innerHTML = `<canvas></canvas><span class="nm"></span><button class="${own ? 'ghost' : 'gold'}${own || can ? '' : ' poor'}">${btn}</button>`;
      it.querySelector('.nm').textContent = name;
      it.querySelector('button').addEventListener('click', () => {
        if (own) { onEquip(); saveSkin(); buildShop('Looking sharp.'); return; }
        if (!can) { AUDIO.nope(); buildShop(`You need ${(price - (cur === 'diamonds' ? w.diamonds : w.orbs)).toLocaleString()} more ${cur} for that one.`); return; }
        bump(cur === 'diamonds' ? 'diamonds' : 'orbs', -price);
        store.set('owned', store.get('owned', []).concat(ownKey));
        onEquip(); saveSkin();
        AUDIO.buy();
        buildShop(`Thanks! ${name} is yours, and equipped.`);
      });
      grid.appendChild(it);
      preview(it.querySelector('canvas'));
    };
    if (cat === 'icons') {
      const sets = SHOP_SETS.slice().sort((x, y) => (SHOP_DIAMONDS[x] ? 1e6 : 0) + setPrice(x, m) - (SHOP_DIAMONDS[y] ? 1e6 : 0) - setPrice(y, m));
      for (const set of sets) {
        const v = ICONS.special(set);
        card(ICONS.name(m, v), setPrice(set, m), SHOP_DIAMONDS[set] ? 'diamonds' : 'orbs', setOwned(m, set), equipped(m) === v,
          () => { SKIN.icons[m] = v; }, m + ':' + set, (cv) => iconCanvasV(cv, m, 64, 0.68, v));
      }
    } else if (cat === 'colors') {
      for (const [col, name, price, cur] of SHOP_COLORS) {
        card(name, price, cur || 'orbs', ownedItem('col:' + col), SKIN.c1 === col,
          () => { SKIN.c1 = col; }, 'col:' + col, (cv) => {
            cv.width = cv.height = 64; const c = cv.getContext('2d');
            c.fillStyle = col; c.strokeStyle = '#000'; c.lineWidth = 4;
            c.beginPath(); c.arc(32, 32, 24, 0, Math.PI * 2); c.fill(); c.stroke();
          });
      }
    } else {
      const list = cat === 'trails' ? SHOP_TRAILS : SHOP_DEATHS, key = cat === 'trails' ? 'trail' : 'death';
      for (const [id, name, price, cur] of list) {
        const own = price === 0 || ownedItem(key + ':' + id);
        card(name, price, cur || 'orbs', own, SKIN[key] === id, () => { SKIN[key] = id; }, key + ':' + id,
          (cv) => fxPreview(cv, key, id));
      }
    }
  }

  // Little looping previews of trails and death effects in shop cards.
  const fxCards = [];
  function fxPreview(cv, kind, id) {
    cv.width = cv.height = 64;
    fxCards.push({ cv, kind, id });
  }
  setInterval(() => {
    if (G.screen !== 'shop') { fxCards.length = 0; return; }
    for (let i = fxCards.length - 1; i >= 0; i--) {
      const f = fxCards[i];
      if (!f.cv.isConnected) { fxCards.splice(i, 1); continue; }
      const c = f.cv.getContext('2d'), t = performance.now() / 1000;
      c.clearRect(0, 0, 64, 64);
      if (f.kind === 'trail') {
        for (let k = 0; k < 14; k++) {
          const x = 8 + k * 3.4, y = 32 + Math.sin(t * 4 - k * 0.4) * 12;
          c.fillStyle = trailColor(f.id, k, t);
          c.globalAlpha = (k + 1) / 14;
          c.beginPath(); c.arc(x, y, 2 + k * 0.35, 0, Math.PI * 2); c.fill();
        }
        c.globalAlpha = 1;
        c.fillStyle = SKIN.c1; c.strokeStyle = '#000'; c.lineWidth = 2;
        c.fillRect(54, 26 + Math.sin(t * 4 - 14 * 0.4) * 12, 10, 10);
      } else {
        const ph = (t * 0.8) % 1;
        const cols = deathColors(f.id);
        for (let k = 0; k < 18; k++) {
          const a = k / 18 * Math.PI * 2 + (f.id === 'blackhole' ? ph * 3 : 0);
          const r = f.id === 'blackhole' ? 28 * (1 - ph) : 6 + ph * 26;
          c.globalAlpha = 1 - ph;
          c.fillStyle = cols[k % cols.length];
          const z = f.id === 'pixels' || f.id === 'shatter' ? 5 : 3.5;
          c.fillRect(32 + Math.cos(a) * r - z / 2, 32 + Math.sin(a) * r - z / 2 + (f.id === 'ghost' ? -ph * 16 : 0), z, z);
        }
        c.globalAlpha = 1;
      }
    }
  }, 50);

  // ------------------------------------------------------------ vault
  // Codes are kept as FNV-1a hashes of the upper-cased code, so reading
  // the source doesn't give them away. Each unlocks a set (or pays out).
  const VAULT = {
    '1v4lpa8': { set: 'demon', say: 'ELLOIT... The demons answer to you now.' },
    '1hi2m62': { orbs: 100000, diamonds: 1000, say: 'Coins!!! Fine. Take them. Spend wisely.' },
  };
  const VAULT_NO = [
    'Nope.', 'Try again.', 'That is not a code.', 'Are you even trying?', 'Wrong. Obviously.',
    'Hmm... no.', 'I have all day.', 'Nice try.', 'The lock did not even move.',
  ];
  function hashCode(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h.toString(36);
  }
  function buildVault() {
    G.menuBg = ['#2e2a40', '#16141f'];
    $('vaultSay').textContent = 'Got a code? Let\'s hear it.';
    $('vaultCode').value = '';
    $('vaultBox').style.display = 'none';
    $('vaultLock').classList.remove('shake', 'open');
    if (!TOUCH) setTimeout(() => $('vaultCode').focus(), 50);
  }
  function tryCode() {
    const code = $('vaultCode').value.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) { $('vaultCode').focus(); return; }
    const h = hashCode(code), r = VAULT[h];
    const lock = $('vaultLock');
    lock.classList.remove('shake', 'open'); void lock.offsetWidth;
    $('vaultBox').style.display = 'none';
    if (!r) {
      AUDIO.nope(); lock.classList.add('shake');
      $('vaultSay').textContent = VAULT_NO[Math.floor(Math.random() * VAULT_NO.length)];
      return;
    }
    const used = store.get('codes', []);
    if (used.indexOf(h) !== -1) { $('vaultSay').textContent = 'You already used that one.'; return; }
    store.set('codes', used.concat(h));
    if (r.set) store.set('vault', store.get('vault', []).concat(r.set));
    if (r.orbs) bump('orbs', r.orbs);
    if (r.diamonds) bump('diamonds', r.diamonds);
    AUDIO.unlock(); lock.classList.add('open');
    $('vaultSay').textContent = r.say;
    if (r.set) showUnlocks($('vaultBox'), P.MODES.map((m) => [m, ICONS.special(r.set)]));
    else if (r.orbs || r.diamonds) {
      const box = $('vaultBox');
      box.style.display = '';
      box.innerHTML = `<span><span class="orb-i"></span>+${(r.orbs || 0).toLocaleString()} <span class="dia-i"></span>+${(r.diamonds || 0).toLocaleString()}</span>`;
    }
    $('vaultCode').value = '';
  }
  $('vaultGo').addEventListener('click', tryCode);
  $('vaultCode').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') tryCode(); });
  $('vaultDone').addEventListener('click', () => show('home'));
  $('shopDone').addEventListener('click', () => show('home'));
  $('hShop').addEventListener('click', () => show('shop'));
  $('hVault').addEventListener('click', () => show('vault'));

  // Saves from before orbs and diamonds existed: pay out what their
  // progress would have earned, once.
  if (!store.get('econ', 0)) {
    let orbs = 0, dia = 0;
    LEVELS.forEach((L, i) => {
      const best = store.get('best:' + slotOf(i), 0);
      const m = best === 100 ? 10 : Math.floor(best / 10);
      if (m) { orbs += orbsUpTo(L, m); store.set('orbm:' + slotOf(i), m); }
      if (best === 100) dia += diamondsOf(L);
      dia += COIN_DIAMONDS * store.get('coins:' + slotOf(i), []).length;
    });
    store.set('orbs', store.get('orbs', 0) + orbs);
    store.set('diamonds', store.get('diamonds', 0) + dia);
    store.set('econ', 1);
  }

  // ----------------------------------------------------------- editor
  // Player-made levels. A level is { id, name, mode, mini, speed, face,
  // bg, gr, song, o } where o lists objects as [kind, x, y, extra, flip]
  // on whole-block cells:
  //   b block · f fake wall · c coin · s spike · ss small spike · w saw
  //   o orb (extra = colour) · d pad (extra = colour) · p portal (extra = kind)
  // flip = -1 hangs a spike or pad upside down. Saved levels live under
  // 'my:levels'; sharing packs one into a link (deflated JSON, base64url).
  const ED_KINDS = ['b', 'f', 'c', 's', 'ss', 'w', 'o', 'd', 'p'];
  const ED_CATS = [
    ['Blocks', [['b'], ['f'], ['c']]],
    ['Spikes', [['s'], ['ss'], ['w']]],
    ['Orbs', ['yellow', 'pink', 'red', 'blue', 'green', 'black', 'dash', 'dashp'].map((c) => ['o', c])],
    ['Pads', ['yellow', 'pink', 'red', 'blue'].map((c) => ['d', c])],
    ['Modes', P.MODES.map((m) => ['p', m])],
    ['Portals', ['grav+', 'grav-', 'mini', 'big', 's0', 's1', 's2', 's3', 's4'].map((k) => ['p', k])],
  ];
  const PORTAL_NAME = {
    'grav+': 'Gravity flip', 'grav-': 'Normal gravity', mini: 'Mini', big: 'Normal size',
    s0: '0.5x speed', s1: '1x speed', s2: '2x speed', s3: '3x speed', s4: '4x speed',
  };
  const cap1 = (w) => (w ? w[0].toUpperCase() + w.slice(1) : '');
  function edItemName([k, e]) {
    return { b: 'Block', f: 'Fake wall (fly through it)', c: 'Secret coin (3 max)', s: 'Spike', ss: 'Small spike', w: 'Saw',
      o: `${e === 'dash' ? 'Dash' : e === 'dashp' ? 'Pink dash' : cap1(e || '')} orb`, d: `${cap1(e || '')} pad`,
      p: MODE_LABEL[e] ? `${MODE_LABEL[e]} portal` : PORTAL_NAME[e] }[k];
  }
  const ED_COLORS = [
    ['#2b5bff', '#1a3acc'], ['#c22bff', '#7a17b0'], ['#ff3b5c', '#b01734'], ['#ff8a1f', '#b0560f'],
    ['#16c79a', '#0d7d61'], ['#00a8ff', '#0068a0'], ['#3b1c6b', '#22104a'], ['#300010', '#180008'],
  ];
  // Corridor heights of the bounded modes (physics.js MODE_CFG.bound).
  const BOUND = { ship: 10, ball: 8, ufo: 10, wave: 10, spider: 8, swing: 10 };
  const ED = { lv: null, L: null, cam: { x: -3, y: -3 }, cat: 0, item: ['b'], tool: 'build', flip: false,
    undo: [], drag: null, hover: null };

  const myLevels = () => store.get('my:levels', []);
  function saveMine(lv) {
    const list = myLevels(), i = list.findIndex((x) => x.id === lv.id);
    if (i >= 0) list[i] = lv; else list.unshift(lv);
    store.set('my:levels', list);
  }
  function newLevel() {
    return { id: Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36), name: `My Level ${myLevels().length + 1}`,
      mode: 'cube', mini: false, speed: 1, face: 'Normal', bg: '#2b5bff', gr: '#1a3acc', song: 1 + Math.floor(Math.random() * 9999), o: [] };
  }

  // Editor entry -> game object (see physics.js for the object shapes).
  function toGame([k, x, y, e, f], id) {
    switch (k) {
      case 'b': return { t: 'b', x, y, w: 1, h: 1, id };
      case 'f': return { t: 'fake', x, y, w: 1, h: 1, id };
      case 'c': return { t: 'coin', x, y, w: 1, h: 1, id };
      case 's': case 'ss': return { t: k, x, y, d: f || 1, w: 1, h: 1, id };
      case 'w': return { t: 'saw', x: x - 0.5, y: y - 0.5, w: 2, h: 2, r: 1, id };
      case 'o': return { t: 'orb', x, y, c: e, w: 1, h: 1, id };
      case 'd': return { t: 'pad', x, y, c: e, d: f || 1, w: 1, h: 1, id };
      default: {
        const o = { t: 'p', x, y: y + 0.5, k: e, h: 3, w: 1, id };
        // Corridor modes get a corridor centred on the portal.
        if (BOUND[e]) { const fl = Math.max(0, Math.round(y + 0.5 - BOUND[e] / 2)); o.b = [fl, fl + BOUND[e]]; }
        return o;
      }
    }
  }
  function edBox([k, x, y]) {
    if (k === 'w') return [x - 0.5, y - 0.5, x + 1.5, y + 1.5];
    if (k === 'p') return [x, y - 1, x + 1, y + 2];
    return [x, y, x + 1, y + 1];
  }
  function edToDef(lv, slot) {
    const objects = lv.o.map((e, i) => toGame(e, i));
    let maxX = 10;
    for (const o of objects) maxX = Math.max(maxX, o.x + o.w);
    return {
      name: lv.name, objects, colors: [{ x: 0, bg: lv.bg, gr: lv.gr }], length: Math.ceil(maxX) + 12,
      startMode: lv.mode, startMini: !!lv.mini, startSpeed: lv.speed, difficulty: lv.face, stars: 0,
      bpm: 118 + (lv.song % 8) * 7, key: lv.song % 12, seed: lv.song, custom: true, slot,
      coinCount: objects.filter((o) => o.t === 'coin').length,
    };
  }
  function edCompile() {
    ED.L = P.compile(edToDef(ED.lv, 'my:' + ED.lv.id));
    ED.L.coinIds = [];
  }

  // Anything shared over a link is untrusted: keep only what the editor
  // could have made itself.
  const FACE_NAMES = ['Easy', 'Normal', 'Hard', 'Harder', 'Insane', 'Easy Demon', 'Medium Demon', 'Hard Demon', 'Insane Demon', 'Extreme Demon'];
  function cleanLevel(d) {
    const okCol = (c, dflt) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : dflt);
    const extras = { o: ED_CATS[2][1].map((i) => i[1]), d: ED_CATS[3][1].map((i) => i[1]), p: ED_CATS[4][1].concat(ED_CATS[5][1]).map((i) => i[1]) };
    const o = [];
    let coins = 0;
    for (const e of Array.isArray(d.o) ? d.o.slice(0, 6000) : []) {
      if (!Array.isArray(e)) continue;
      const [k, x, y, ex, f] = e;
      if (ED_KINDS.indexOf(k) === -1 || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > 9999 || y < 0 || y > 80) continue;
      if (extras[k] && extras[k].indexOf(ex) === -1) continue;
      if (k === 'c' && ++coins > 3) continue;
      const item = [k, x, y];
      if (extras[k]) item.push(ex);
      if ((k === 's' || k === 'ss' || k === 'd') && f === -1) { if (item.length === 3) item.push(0); item.push(-1); }
      o.push(item);
    }
    return {
      id: typeof d.id === 'string' ? d.id.slice(0, 24) : newLevel().id,
      name: String(d.name || d.n || 'Untitled').slice(0, 28),
      mode: P.MODES.indexOf(d.mode || d.m) !== -1 ? d.mode || d.m : 'cube',
      mini: !!(d.mini || d.mi), speed: [0, 1, 2, 3, 4].indexOf(d.speed ?? d.s) !== -1 ? d.speed ?? d.s : 1,
      face: FACE_NAMES.indexOf(d.face || d.f) !== -1 ? d.face || d.f : 'Normal',
      bg: okCol(d.bg, '#2b5bff'), gr: okCol(d.gr, '#1a3acc'),
      song: Number.isInteger(d.song ?? d.so) ? Math.abs(d.song ?? d.so) % 100000 : 1, o,
    };
  }

  // Share links: #lvl= + 'z' (deflate-raw) or 'j' (plain), base64url JSON.
  async function packLevel(lv) {
    const json = JSON.stringify({ v: 1, n: lv.name, m: lv.mode, mi: lv.mini ? 1 : 0, s: lv.speed, f: lv.face, bg: lv.bg, gr: lv.gr, so: lv.song, o: lv.o });
    let bytes = new TextEncoder().encode(json), tag = 'j';
    if (window.CompressionStream) {
      try {
        const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        bytes = new Uint8Array(await new Response(cs).arrayBuffer());
        tag = 'z';
      } catch (e) { /* plain JSON then */ }
    }
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return tag + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  async function unpackLevel(code) {
    const tag = code[0];
    const bin = atob(code.slice(1).replace(/-/g, '+').replace(/_/g, '/'));
    let bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    if (tag === 'z') {
      const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      bytes = new Uint8Array(await new Response(ds).arrayBuffer());
    } else if (tag !== 'j') throw new Error('bad code');
    return cleanLevel(JSON.parse(new TextDecoder().decode(bytes)));
  }
  const shareUrl = (code) => `${location.origin}${location.pathname}#lvl=${code}`;

  // Draw one game object at its own position (previews, ghost, editor).
  function drawGameObj(o, col) {
    const top = shade(col.gr, 0.55), edge = tint(col.gr, 0.55);
    if (o.t === 'b') drawBlock(o, top, edge, 0);
    else if (o.t === 'fake') drawFake(o, top, edge);
    else if (o.t === 's' || o.t === 'ss') drawSpike(o, top);
    else if (o.t === 'pad') drawPad(o, 0);
    else if (o.t === 'orb') drawOrb(o, 0);
    else if (o.t === 'p') { drawPortal(o, 0, true); drawPortal(o, 0, false); }
    else if (o.t === 'saw') drawSaw(o, col);
    else if (o.t === 'coin') drawCoin(o);
  }
  // Render an object into a small menu canvas by pointing the world
  // transform (S, W, H, camera) at it for one draw.
  function edPreview(cv, item, size) {
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    cv.width = size * r; cv.height = size * r;
    const c = cv.getContext('2d');
    c.setTransform(r, 0, 0, r, 0, 0);
    const o = toGame([item[0], 0, 0, item[1], ED.flip ? -1 : 1], 0);
    const span = o.t === 'p' ? 3.4 : o.t === 'saw' ? 2.3 : 1.5;
    const bb = edBox([item[0], 0, 0]);
    const keep = [W, H, S, G.camX, G.camY, viewH];
    S = size / span; W = size; H = size; viewH = span;
    G.camX = (bb[0] + bb[2]) / 2 - span / 2; G.camY = (bb[1] + bb[3]) / 2 - span / 2;
    ctx = c;
    try { drawGameObj(o, { bg: ED.lv.bg, gr: ED.lv.gr }); } finally {
      [W, H, S, G.camX, G.camY, viewH] = keep;
      ctx = mainCtx;
    }
  }

  function renderEditor() {
    if (!ED.L) return;
    G.camX = ED.cam.x; G.camY = ED.cam.y;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const col = { bg: ED.lv.bg, gr: ED.lv.gr };
    drawBackground(col.bg, col.gr, 0);
    drawObjects(ED.L, 0, col);
    drawGround(col.gr, 0);
    // Grid, with every fifth line a bit stronger
    const g0 = Math.max(0, Math.floor(G.camY)), gy = sy(0);
    for (const strong of [false, true]) {
      ctx.strokeStyle = strong ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = Math.floor(G.camX); x <= G.camX + VIEW_W + 1; x++) {
        if ((x % 5 === 0) !== strong) continue;
        const px = Math.round(sx(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, gy);
      }
      for (let y = g0; y <= G.camY + viewH + 1; y++) {
        if ((y % 5 === 0) !== strong) continue;
        const py = Math.round(sy(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(W, py);
      }
      ctx.stroke();
    }
    // Start position: the icon you'll play, faded
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.translate(sx(0), sy(0.5));
    drawIcon(ED.lv.mode, S * (ED.lv.mini ? 0.6 : 1), null);
    ctx.restore();
    outlinedText('Start', sx(0), sy(0.5) - S * 0.95, Math.max(12, S * 0.32), 'center');
    // Hovered cell: what you're about to place, or the delete box
    const h = ED.hover;
    if (h && ED.tool !== 'move') {
      ctx.save();
      if (ED.tool === 'build') {
        ctx.globalAlpha = 0.55;
        drawGameObj(toGame([ED.item[0], h.x, h.y, ED.item[1], ED.flip ? -1 : 1], -1), col);
        ctx.restore(); ctx.save();
      }
      ctx.strokeStyle = ED.tool === 'build' ? '#7dff3a' : '#ff3b3b';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx(h.x) + 1, sy(h.y + 1) + 1, S - 2, S - 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function edCell(e) {
    const wx = G.camX + e.clientX / S, wy = G.camY + (H - e.clientY) / S;
    return { x: Math.floor(wx), y: Math.floor(wy) };
  }
  function edPush() {
    ED.undo.push(JSON.stringify(ED.lv.o));
    if (ED.undo.length > 120) ED.undo.shift();
  }
  function edChanged() { edCompile(); saveMine(ED.lv); }
  function edAt(x, y) {
    const cx = x + 0.5, cy = y + 0.5;
    return ED.lv.o.filter((e) => { const b = edBox(e); return cx > b[0] && cx < b[2] && cy > b[1] && cy < b[3]; });
  }
  function edPlace(c) {
    if (c.y < 0 || c.x < -2) return false;
    const [k, ex] = ED.item;
    const same = ED.lv.o.find((e) => e[1] === c.x && e[2] === c.y);
    if (same && same[0] === k && same[3] === ex && (same[4] || 1) === (ED.flip ? -1 : 1)) return false;
    if (k === 'c' && ED.lv.o.filter((e) => e[0] === 'c').length >= 3) { toast('Three secret coins per level, max'); return false; }
    ED.lv.o = ED.lv.o.filter((e) => !(e[1] === c.x && e[2] === c.y));
    const item = [k, c.x, c.y];
    if (ex) item.push(ex);
    if (ED.flip && (k === 's' || k === 'ss' || k === 'd')) { if (item.length === 3) item.push(0); item.push(-1); }
    ED.lv.o.push(item);
    return true;
  }
  function edErase(c) {
    const hit = edAt(c.x, c.y);
    if (!hit.length) return false;
    ED.lv.o = ED.lv.o.filter((e) => hit.indexOf(e) === -1);
    return true;
  }
  function edPointer(e, kind) {
    if (kind === 'down') {
      const pan = ED.tool === 'move' || e.button === 1 || e.button === 2 || (ED.drag && ED.drag.id !== e.pointerId);
      ED.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, pan, last: null, pushed: false };
      if (!pan) edPointer(e, 'paint');
      return;
    }
    if (kind === 'move') {
      ED.hover = e.pointerType === 'mouse' ? edCell(e) : null;
      if (!ED.drag || ED.drag.id !== e.pointerId) return;
      if (ED.drag.pan) {
        ED.cam.x -= (e.clientX - ED.drag.x) / S; ED.cam.y += (e.clientY - ED.drag.y) / S;
        ED.drag.x = e.clientX; ED.drag.y = e.clientY;
        edClamp();
      } else edPointer(e, 'paint');
      return;
    }
    if (kind === 'up') { if (ED.drag && ED.drag.id === e.pointerId) ED.drag = null; return; }
    // paint: place or erase on each new cell the pointer crosses
    const c = edCell(e), d = ED.drag;
    if (d.last && d.last.x === c.x && d.last.y === c.y) return;
    d.last = c;
    const before = JSON.stringify(ED.lv.o);
    if (!d.pushed) { ED.undo.push(before); d.pushed = true; if (ED.undo.length > 120) ED.undo.shift(); }
    if (ED.tool === 'erase' ? edErase(c) : edPlace(c)) { edChanged(); AUDIO.tick(); }
  }
  function edClamp() {
    ED.cam.x = Math.max(-6, Math.min(9999, ED.cam.x));
    ED.cam.y = Math.max(-groundLift() - 4, Math.min(60, ED.cam.y));
  }
  function edWheel(e) {
    const k = e.deltaMode === 1 ? 0.6 : 0.025;
    if (e.shiftKey) ED.cam.y -= e.deltaY * k;
    else { ED.cam.x += (e.deltaX || e.deltaY) * k; ED.cam.y -= (e.deltaX ? e.deltaY : 0) * k; }
    edClamp();
  }
  function edKey(e) {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    const step = e.shiftKey ? 5 : 1;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') ED.cam.x -= step;
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') ED.cam.x += step;
    else if (e.code === 'ArrowUp' || e.code === 'KeyW') ED.cam.y += step;
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') ED.cam.y -= step;
    else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) edUndo();
    else if (e.code === 'Digit1') edTool('build');
    else if (e.code === 'Digit2') edTool('erase');
    else if (e.code === 'Digit3') edTool('move');
    else if (e.code === 'KeyF') edFlip();
    else if (e.code === 'Enter') edTest();
    else if (e.code === 'Escape') { if ($('edSet').classList.contains('show') || $('edShareBox').classList.contains('show')) edPanels(); else edExit(); }
    else return;
    e.preventDefault();
    edClamp();
  }
  function edUndo() {
    if (!ED.undo.length) return;
    ED.lv.o = JSON.parse(ED.undo.pop());
    edChanged();
  }
  function edTool(t) {
    ED.tool = t;
    for (const [id, k] of [['edBuild', 'build'], ['edErase', 'erase'], ['edMove', 'move']]) $(id).classList.toggle('on', k === t);
  }
  function edFlip() { ED.flip = !ED.flip; $('edFlip').classList.toggle('on', ED.flip); buildEdItems(); }
  function edPanels(which) {
    $('edSet').classList.toggle('show', which === 'set');
    $('edShareBox').classList.toggle('show', which === 'share');
  }

  function openEditor(lv) {
    ED.lv = lv; ED.undo = []; ED.hover = null; ED.drag = null;
    ED.cam = { x: -3, y: -3 };
    show('editor');
  }
  function buildEditor() {
    G.menuBg = [ED.lv.bg, ED.lv.gr];
    edCompile();
    $('edName').value = ED.lv.name;
    edTool(ED.tool);
    $('edFlip').classList.toggle('on', ED.flip);
    edPanels();
    const cats = $('edCats');
    cats.innerHTML = '';
    ED_CATS.forEach(([name], i) => {
      const b = document.createElement('button');
      b.className = 'ghost' + (i === ED.cat ? ' on' : '');
      b.textContent = name;
      b.addEventListener('click', () => { ED.cat = i; ED.item = ED_CATS[i][1][0]; buildEditor(); });
      cats.appendChild(b);
    });
    buildEdItems();
    // First open: keep the ground just above the bottom toolbar.
    if (ED.cam.y === -3) ED.cam.y = -(($('edBottom').getBoundingClientRect().height || 120) / S) - 0.3;
  }
  function buildEdItems() {
    const row = $('edItems');
    row.innerHTML = '';
    for (const it of ED_CATS[ED.cat][1]) {
      const b = document.createElement('button');
      const on = it[0] === ED.item[0] && it[1] === ED.item[1];
      b.className = 'ghost' + (on ? ' on' : '');
      b.title = edItemName(it);
      b.setAttribute('aria-label', edItemName(it));
      b.innerHTML = '<canvas></canvas>';
      b.addEventListener('click', () => { ED.item = it; if (ED.tool !== 'build') edTool('build'); buildEdItems(); });
      row.appendChild(b);
      edPreview(b.querySelector('canvas'), it, 44);
    }
  }
  function buildEdSettings() {
    const lv = ED.lv;
    const modes = $('esModes');
    modes.innerHTML = '';
    for (const m of P.MODES) {
      const b = document.createElement('button');
      b.className = m === lv.mode ? 'on' : '';
      b.title = MODE_LABEL[m]; b.setAttribute('aria-label', 'Start as ' + MODE_LABEL[m]);
      b.innerHTML = '<canvas></canvas>';
      b.addEventListener('click', () => { lv.mode = m; edChanged(); buildEdSettings(); });
      modes.appendChild(b);
      iconCanvas(b.querySelector('canvas'), m, 34, 0.75);
    }
    const seg = (id, opts, cur, set) => {
      const el = $(id);
      el.innerHTML = '';
      for (const [v, label] of opts) {
        const b = document.createElement('button');
        b.textContent = label;
        b.className = v === cur ? 'on' : '';
        b.addEventListener('click', () => { set(v); edChanged(); buildEdSettings(); });
        el.appendChild(b);
      }
    };
    seg('esSize', [[false, 'Normal'], [true, 'Mini']], lv.mini, (v) => { lv.mini = v; });
    seg('esSpeed', [[0, '0.5x'], [1, '1x'], [2, '2x'], [3, '3x'], [4, '4x']], lv.speed, (v) => { lv.speed = v; });
    const cols = $('esCols');
    cols.innerHTML = '';
    for (const [bg, gr] of ED_COLORS) {
      const b = document.createElement('button');
      b.style.background = `linear-gradient(${bg} 50%, ${gr} 50%)`;
      b.className = bg === lv.bg ? 'on' : '';
      b.setAttribute('aria-label', 'Colour ' + bg);
      b.addEventListener('click', () => { lv.bg = bg; lv.gr = gr; G.menuBg = [bg, gr]; edChanged(); buildEdSettings(); buildEdItems(); });
      cols.appendChild(b);
    }
    const face = $('esFace');
    face.innerHTML = FACE_NAMES.map((f) => `<option${f === lv.face ? ' selected' : ''}>${f}</option>`).join('');
    $('esSong').textContent = '\u266a ' + songLabel(edToDef(lv, 'my:' + lv.id), 'my:' + lv.id);
  }

  function edExit() {
    ED.lv.name = $('edName').value.trim().slice(0, 28) || ED.lv.name;
    saveMine(ED.lv);
    show('create');
  }
  function edTest() {
    ED.lv.name = $('edName').value.trim().slice(0, 28) || ED.lv.name;
    saveMine(ED.lv);
    edPanels();
    startCustom(edToDef(ED.lv, 'my:' + ED.lv.id), 'editor');
  }
  async function edShare(lv) {
    const code = await packLevel(lv);
    const url = shareUrl(code);
    $('edShareUrl').value = url;
    $('edShareInfo').textContent = `${lv.name}: ${lv.o.length} objects. Anyone with this link can play it.`;
    $('edShareNative').style.display = navigator.share ? '' : 'none';
    edPanels('share');
  }

  // Play a level that isn't one of the built-in ones (editor test, a link).
  function startCustom(def, from) {
    const L = P.compile(def);
    L.coinIds = L.objects.filter((o) => o.t === 'coin').map((o) => o.id);
    L.tpExtra = tpExtra(L);
    goFullscreen();
    G.idx = -1; G.L = L; G.practice = false; G.returnTo = from;
    G.checkpoints = []; G.attempts = 1; G.jumps = 0; G.time = 0;
    G.prevBest = store.get('best:' + L.slot, 0);
    G.orbM = 10;
    bump('attempts');
    spawnPlayer();
    show('play');
    playMusic(L);
  }

  // ------------------------------------------------------ create list
  function buildCreate() {
    G.menuBg = ['#1a6b3a', '#0d4022'];
    const list = myLevels(), root = $('crList');
    root.innerHTML = '';
    if (!list.length) root.innerHTML = '<div class="label">No levels yet. Make one!</div>';
    for (const lv of list) {
      const row = document.createElement('div');
      row.className = 'myrow';
      row.innerHTML = '<canvas></canvas><div class="mi"><b></b><span></span></div>' +
        '<button class="alt">Edit</button><button>Play</button><button class="gold">Share</button><button class="alt">Upload</button><button class="ghost" aria-label="Delete">✕</button>';
      row.querySelector('b').textContent = lv.name;
      row.querySelector('span').textContent = `${lv.o.length} objects · best ${store.get('best:my:' + lv.id, 0)}%`;
      const [edit, play, share, up, del] = row.querySelectorAll('button');
      up.addEventListener('click', () => uploadLevel(lv));
      edit.addEventListener('click', () => openEditor(lv));
      play.addEventListener('click', () => startCustom(edToDef(lv, 'my:' + lv.id), 'create'));
      share.addEventListener('click', async () => {
        const url = shareUrl(await packLevel(lv));
        $('crShareUrl').value = url; $('crShareRow').style.display = '';
        $('crShareUrl').select();
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => toast('Link copied! Send it to anyone.'), () => {});
      });
      del.addEventListener('click', () => {
        if (!confirm(`Delete "${lv.name}"? This can't be undone.`)) return;
        store.set('my:levels', myLevels().filter((x) => x.id !== lv.id));
        buildCreate();
      });
      root.appendChild(row);
      faceCanvas(row.querySelector('canvas'), lv.face, 44, null);
    }
  }
  $('crNew').addEventListener('click', () => { const lv = newLevel(); saveMine(lv); openEditor(lv); });
  $('crDone').addEventListener('click', () => show('home'));
  $('crOpen').addEventListener('click', () => {
    const v = $('crShareUrl').value.trim();
    const m = v.match(/lvl=([A-Za-z0-9_-]+)/) || v.match(/^([zj][A-Za-z0-9_-]+)$/);
    if (!m) { $('crShareRow').style.display = ''; $('crShareUrl').focus(); toast('Paste a level link into the box first'); return; }
    openShared(m[1]);
  });
  $('crShareUrl').addEventListener('keydown', (e) => e.stopPropagation());
  $('hCreate').addEventListener('click', () => show('create'));

  // Editor buttons
  $('edBack').addEventListener('click', edExit);
  $('edTest').addEventListener('click', edTest);
  $('edUndo').addEventListener('click', edUndo);
  $('edBuild').addEventListener('click', () => edTool('build'));
  $('edErase').addEventListener('click', () => edTool('erase'));
  $('edMove').addEventListener('click', () => edTool('move'));
  $('edFlip').addEventListener('click', edFlip);
  $('edSetBtn').addEventListener('click', () => { buildEdSettings(); edPanels($('edSet').classList.contains('show') ? null : 'set'); });
  $('edShare').addEventListener('click', () => { ED.lv.name = $('edName').value.trim().slice(0, 28) || ED.lv.name; saveMine(ED.lv); edShare(ED.lv); });
  $('esDone').addEventListener('click', () => edPanels());
  $('esFace').addEventListener('change', () => { ED.lv.face = $('esFace').value; edChanged(); });
  $('esNewSong').addEventListener('click', () => { ED.lv.song = 1 + Math.floor(Math.random() * 9999); edChanged(); buildEdSettings(); });
  $('esClear').addEventListener('click', () => {
    if (!ED.lv.o.length || !confirm('Clear every object in this level?')) return;
    edPush(); ED.lv.o = []; edChanged();
  });
  $('edShareCopy').addEventListener('click', () => {
    $('edShareUrl').select();
    if (navigator.clipboard) navigator.clipboard.writeText($('edShareUrl').value).then(() => toast('Link copied! Send it to anyone.'), () => {});
  });
  $('edShareNative').addEventListener('click', () => {
    navigator.share({ title: ED.lv.name, text: `Play my Geometry Dash level "${ED.lv.name}"`, url: $('edShareUrl').value }).catch(() => {});
  });
  $('edShareClose').addEventListener('click', () => edPanels());
  for (const id of ['edName', 'edShareUrl']) $(id).addEventListener('keydown', (e) => e.stopPropagation());
  $('edName').addEventListener('change', () => { ED.lv.name = $('edName').value.trim().slice(0, 28) || ED.lv.name; saveMine(ED.lv); });

  // ------------------------------------------------- shared level links
  let sharedLv = null, sharedCode = '';
  async function openShared(code) {
    try {
      sharedLv = await unpackLevel(code);
      sharedCode = code;
    } catch (e) {
      toast('That level link is broken or incomplete');
      return;
    }
    G.menuBg = [sharedLv.bg, sharedLv.gr];
    show('shared');
    $('shName').textContent = sharedLv.name;
    $('shInfo').textContent = `Player-made level · ${sharedLv.o.length} objects · starts as ${MODE_LABEL[sharedLv.mode]}${sharedLv.mini ? ' (mini)' : ''}`;
    faceCanvas($('shFace'), sharedLv.face, 96, null);
  }
  const sharedSlot = () => 'sh:' + hashCode(sharedCode);
  function leaveShared() {
    if (location.hash.startsWith('#lvl=')) history.replaceState(null, '', location.pathname + location.search);
    show('home');
  }
  $('shPlay').addEventListener('click', () => startCustom(edToDef(sharedLv, sharedSlot()), 'shared'));
  $('shSave').addEventListener('click', () => {
    const copy = Object.assign({}, sharedLv, { id: newLevel().id, o: sharedLv.o.map((e) => e.slice()) });
    saveMine(copy);
    toast(`Saved "${copy.name}" to your levels`);
  });
  $('shBack').addEventListener('click', leaveShared);
  function checkHash() {
    const m = location.hash.match(/^#lvl=([A-Za-z0-9_-]+)/);
    if (m) openShared(m[1]);
  }
  window.addEventListener('hashchange', checkHash);

  // ------------------------------------------------------------ songs
  // Every level has a generated song in its own style (audio.js). Players
  // can also give any level their own music file: it's kept in IndexedDB on
  // this device under the level's save slot, decoded once, and loops from
  // the top on every attempt like GD's songs.
  const songCache = new Map(); // slot -> AudioBuffer
  function songDB() {
    return new Promise((ok, no) => {
      if (!window.indexedDB) { no(new Error('no IndexedDB')); return; }
      const rq = indexedDB.open('gdr-songs', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('songs');
      rq.onsuccess = () => ok(rq.result);
      rq.onerror = () => no(rq.error);
    });
  }
  async function songOp(mode, fn) {
    const db = await songDB();
    return new Promise((ok, no) => {
      const tx = db.transaction('songs', mode), st = tx.objectStore('songs');
      const rq = fn(st);
      tx.oncomplete = () => ok(rq && rq.result);
      tx.onerror = () => no(tx.error);
    });
  }
  const songName = (slot) => store.get('song:' + slot, null);
  function songLabel(L, slot) {
    const own = songName(slot);
    if (own) return own;
    return `${AUDIO.STYLES[(L.style != null ? L.style : L.seed || 1) % AUDIO.STYLES.length]} \u00b7 ${L.bpm || 130} BPM`;
  }
  function playMusic(L) {
    const slot = L.slot || slotOf(G.idx);
    if (!songName(slot)) { AUDIO.start(L); return; }
    const buf = songCache.get(slot);
    if (buf) { AUDIO.startBuffer(buf, L.bpm); return; }
    AUDIO.start(L); // generated song until the file is decoded
    loadSong(slot).then((b) => {
      if (b && G.L === L && (G.screen === 'play' || G.screen === 'pause') && !G.s.won) AUDIO.startBuffer(b, L.bpm);
    });
  }
  async function loadSong(slot) {
    if (songCache.has(slot)) return songCache.get(slot);
    try {
      const blob = await songOp('readonly', (st) => st.get(slot));
      if (!blob || !AUDIO.ensure()) return null;
      const buf = await AUDIO.ctx.decodeAudioData(await blob.arrayBuffer());
      songCache.set(slot, buf);
      return buf;
    } catch (e) { return null; }
  }
  let songTarget = null;
  function openSong(L, slot, after) {
    songTarget = { L, slot, after };
    $('songLevel').textContent = L.name;
    $('songNow').textContent = '\u266a ' + songLabel(L, slot) + (songName(slot) ? ' (your file)' : ' (built-in)');
    $('songReset').style.display = songName(slot) ? '' : 'none';
    $('songBox').classList.add('show');
  }
  function closeSong() {
    $('songBox').classList.remove('show');
    AUDIO.stop();
    if (songTarget && songTarget.after) songTarget.after();
    // Back in a paused level: the level's (possibly new) song from the top on resume.
    if (G.s && songTarget && G.L === songTarget.L) G.songChanged = true;
  }
  $('songFile').addEventListener('change', async () => {
    const f = $('songFile').files[0];
    $('songFile').value = '';
    if (!f || !songTarget) return;
    if (f.size > 40 * 1024 * 1024) { toast('That file is over 40MB, pick a smaller one'); return; }
    const { slot } = songTarget;
    try {
      AUDIO.ensure();
      const buf = await AUDIO.ctx.decodeAudioData(await f.arrayBuffer());
      await songOp('readwrite', (st) => st.put(f, slot));
      songCache.set(slot, buf);
      store.set('song:' + slot, f.name.replace(/\.[^.]+$/, '').slice(0, 40));
      toast('Song added to ' + songTarget.L.name);
      openSong(songTarget.L, slot, songTarget.after);
    } catch (e) {
      toast("Couldn't read that file as audio");
    }
  });
  $('songPick').addEventListener('click', () => $('songFile').click());
  $('songPlay').addEventListener('click', async () => {
    const { L, slot } = songTarget;
    const buf = songName(slot) ? await loadSong(slot) : null;
    if (buf) AUDIO.startBuffer(buf, L.bpm); else AUDIO.start(L);
  });
  $('songReset').addEventListener('click', async () => {
    const { L, slot } = songTarget;
    store.set('song:' + slot, null);
    songCache.delete(slot);
    try { await songOp('readwrite', (st) => st.delete(slot)); } catch (e) { /* storage blocked */ }
    openSong(L, slot, songTarget.after);
  });
  $('songDone').addEventListener('click', closeSong);
  $('pauseSong').addEventListener('click', () => openSong(G.L, G.L.slot || slotOf(G.idx), null));
  $('esOwnSong').addEventListener('click', () => openSong(edToDef(ED.lv, 'my:' + ED.lv.id), 'my:' + ED.lv.id, () => buildEdSettings()));

  // ----------------------------------------------------------- online
  // The Railway server (server.py) holds everyone's uploaded levels, the
  // leaderboard and cloud saves. Served from Railway the API is same-origin;
  // the GitHub Pages copy talks to the Railway one.
  const API = /github\.io$/.test(location.hostname) ? 'https://game-production-8782.up.railway.app' : '';
  const acct = () => store.get('acct', null);
  async function api(path, body) {
    const r = await fetch(API + '/api' + path, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : undefined);
    const out = await r.json().catch(() => ({ error: 'server error' }));
    if (!r.ok) throw new Error(out.error || 'server error');
    return out;
  }
  function summary() {
    const beaten = MAIN.filter((i) => bestOf(i, false) === 100 && !LEVELS[i].secret);
    return {
      stars: beaten.reduce((n, i) => n + LEVELS[i].stars, 0),
      demons: beaten.filter((i) => /Demon/.test(LEVELS[i].difficulty)).length,
      coins: LEVELS.reduce((n, L, i) => n + store.get('coins:' + slotOf(i), []).length, 0),
      levels: beaten.length,
      practice: LEVELS.filter((L, i) => L.training && bestOf(i, false) === 100).length,
    };
  }
  function saveBlob() {
    const data = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('gdr:') && k !== 'gdr:acct') data[k] = localStorage.getItem(k);
      }
    } catch (e) { /* storage blocked */ }
    return data;
  }
  // After a clear: post the score and back the save up (quietly; offline is fine).
  let syncTimer = 0;
  function cloudSync() {
    const a = acct();
    if (!a) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      api('/score', Object.assign({ token: a.token }, summary())).catch(() => {});
      api('/save', { token: a.token, data: saveBlob() }).then(() => store.set('cloudAt', Date.now())).catch(() => {});
    }, 1500);
  }

  let onTab = 'levels', onSort = 'new', onBy = 'stars', onPage = 0, onQuery = '';
  function buildOnline() {
    G.menuBg = ['#0a4a6a', '#052a3a'];
    for (const b of $('onTabs').children) b.classList.toggle('on', b.dataset.t === onTab);
    $('onLevels').style.display = onTab === 'levels' ? '' : 'none';
    $('onBoard').style.display = onTab === 'board' ? '' : 'none';
    $('onAcct').style.display = onTab === 'acct' ? '' : 'none';
    if (onTab === 'levels') { onPage = 0; loadLevels(false); }
    if (onTab === 'board') loadBoard();
    if (onTab === 'acct') buildAcct();
  }
  function rowEl(cls) { const d = document.createElement('div'); d.className = 'myrow' + (cls ? ' ' + cls : ''); return d; }
  async function loadLevels(more) {
    const list = $('onList');
    if (!more) list.innerHTML = '<div class="label">Loading…</div>';
    for (const b of $('onSort').children) b.classList.toggle('on', b.dataset.s === onSort);
    try {
      const r = await api(`/levels?sort=${onSort}&page=${onPage}&q=${encodeURIComponent(onQuery)}`);
      if (!more) list.innerHTML = '';
      if (!r.levels.length && !more) list.innerHTML = '<div class="label">No levels yet. Upload one from Create!</div>';
      for (const lv of r.levels) {
        const row = rowEl();
        row.innerHTML = '<canvas></canvas><div class="mi"><b></b><span></span></div><button>Play</button><button class="ghost">♥</button>';
        row.querySelector('b').textContent = lv.name;
        row.querySelector('span').textContent = `by ${lv.author} · ${lv.plays} plays · ${lv.likes} likes`;
        const [play, like] = row.querySelectorAll('button');
        play.addEventListener('click', () => playOnline(lv.id));
        like.addEventListener('click', async () => {
          const a = acct();
          if (!a) { toast('Make an account first (Account tab)'); return; }
          try { await api(`/levels/${lv.id}/like`, { token: a.token }); like.classList.remove('ghost'); like.classList.add('gold'); } catch (e) { toast(e.message); }
        });
        list.appendChild(row);
        faceCanvas(row.querySelector('canvas'), lv.face || 'Normal', 44, null);
      }
      $('onMore').style.display = r.more ? '' : 'none';
    } catch (e) {
      list.innerHTML = '<div class="label">Can’t reach the online server right now.</div>';
    }
  }
  async function playOnline(id) {
    try {
      const r = await api('/levels/' + id);
      const lv = await unpackLevel(r.code);
      lv.name = r.name;
      startCustom(edToDef(lv, 'on:' + id), 'online');
    } catch (e) { toast('Couldn’t load that level'); }
  }
  async function loadBoard() {
    const list = $('onRanks');
    list.innerHTML = '<div class="label">Loading…</div>';
    for (const b of $('onBy').children) b.classList.toggle('on', b.dataset.b === onBy);
    const a = acct();
    if (a) await api('/score', Object.assign({ token: a.token }, summary())).catch(() => {});
    try {
      const r = await api('/leaderboard?by=' + onBy);
      list.innerHTML = r.players.length ? '' : '<div class="label">Nobody on the board yet. Be first!</div>';
      r.players.forEach((p, k) => {
        const row = rowEl(a && a.id === p.id ? 'me' : '');
        row.innerHTML = '<span class="rank"></span><div class="mi"><b></b><span></span></div><span class="val"></span>';
        row.querySelector('.rank').textContent = k + 1;
        row.querySelector('b').textContent = p.name;
        row.querySelector('.mi span').textContent = `${p.stars} ★ · ${p.demons} demons · ${p.coins} coins · ${p.levels} levels`;
        row.querySelector('.val').textContent = onBy === 'stars' ? p.stars + ' ★' : p[onBy];
        list.appendChild(row);
      });
    } catch (e) { list.innerHTML = '<div class="label">Can’t reach the online server right now.</div>'; }
  }
  function buildAcct() {
    const a = acct();
    $('acNew').style.display = a ? 'none' : '';
    $('acHave').style.display = a ? '' : 'none';
    $('acStatus').textContent = a ? `Logged in as ${a.name}` + (store.get('cloudAt', 0) ? ` · last cloud save ${new Date(store.get('cloudAt', 0)).toLocaleString()}` : '')
      : 'Make an account to upload levels, get on the leaderboard and keep your progress in the cloud.';
    if (a) $('acCode').value = a.token;
  }
  $('onTabs').addEventListener('click', (e) => { if (e.target.dataset.t) { onTab = e.target.dataset.t; buildOnline(); } });
  $('onSort').addEventListener('click', (e) => { if (e.target.dataset.s) { onSort = e.target.dataset.s; onPage = 0; loadLevels(false); } });
  $('onBy').addEventListener('click', (e) => { if (e.target.dataset.b) { onBy = e.target.dataset.b; loadBoard(); } });
  $('onMore').addEventListener('click', () => { onPage++; loadLevels(true); });
  let searchT = 0;
  $('onSearch').addEventListener('input', () => { clearTimeout(searchT); searchT = setTimeout(() => { onQuery = $('onSearch').value.trim(); onPage = 0; loadLevels(false); }, 300); });
  $('acCreate').addEventListener('click', async () => {
    const name = $('acName').value.trim();
    if (name.length < 2) { toast('Pick a name of at least 2 characters'); return; }
    try {
      const r = await api('/register', { name });
      store.set('acct', r);
      toast(`Welcome, ${r.name}!`);
      cloudSync();
      buildAcct();
    } catch (e) { toast(e.message); }
  });
  $('acSave').addEventListener('click', async () => {
    try { await api('/save', { token: acct().token, data: saveBlob() }); store.set('cloudAt', Date.now()); toast('Saved to the cloud'); buildAcct(); } catch (e) { toast(e.message); }
  });
  $('acLoad').addEventListener('click', async () => {
    try {
      const r = await api('/load', { token: acct().token });
      if (!r.data) { toast('Nothing saved in the cloud yet'); return; }
      if (!confirm('Replace this device’s progress with your cloud save?')) return;
      const keep = localStorage.getItem('gdr:acct');
      for (const k of Object.keys(r.data)) if (k.startsWith('gdr:')) localStorage.setItem(k, r.data[k]);
      localStorage.setItem('gdr:acct', keep);
      location.reload();
    } catch (e) { toast(e.message); }
  });
  $('acCopy').addEventListener('click', () => { $('acCode').select(); if (navigator.clipboard) navigator.clipboard.writeText($('acCode').value).then(() => toast('Account code copied'), () => {}); });
  $('acLoginBtn').addEventListener('click', async () => {
    const token = $('acLogin').value.trim();
    try {
      const r = await api('/whoami', { token });
      store.set('acct', { token, id: r.id, name: r.name });
      toast(`Logged in as ${r.name}. Load from cloud to bring your progress over.`);
      $('acLogin').value = '';
      buildAcct();
    } catch (e) { toast('That account code didn’t work'); }
  });
  $('acRenameBtn').addEventListener('click', async () => {
    try {
      const r = await api('/rename', { token: acct().token, name: $('acRename').value.trim() });
      store.set('acct', Object.assign(acct(), { name: r.name }));
      $('acRename').value = '';
      buildAcct();
    } catch (e) { toast(e.message); }
  });
  for (const id of ['onSearch', 'acName', 'acLogin', 'acRename', 'acCode']) $(id).addEventListener('keydown', (e) => e.stopPropagation());
  $('onDone').addEventListener('click', () => show('home'));
  $('hOnline').addEventListener('click', () => show('online'));

  async function uploadLevel(lv) {
    const a = acct();
    if (!a) { onTab = 'acct'; show('online'); toast('Make an account first, then upload'); return; }
    try {
      const r = await api('/levels', { token: a.token, name: lv.name, code: await packLevel(lv), face: lv.face, objects: lv.o.length });
      toast(r.existing ? 'Already uploaded: it’s in Online → Levels' : 'Uploaded! Everyone can play it in Online → Levels');
    } catch (e) { toast(e.message); }
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
    if (G.songChanged) { G.songChanged = false; playMusic(G.L); }
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
  checkHash();
  requestAnimationFrame(frame);
})();
