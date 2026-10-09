/*
 * Front end: screens (attract, play, pause, game over, initials, high
 * scores), the fixed 60 Hz loop, layout for desktop and phones, and the
 * glue between the simulation, the renderer, input and sound.
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('screen');
  const body = document.body;
  const Sound = window.Sound;
  const HS = window.HighScores;
  const Store = window.Store;
  const Game = window.AsteroidsGame;
  const VF = window.VFont;

  const STEP = 1000 / 60;
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  const ATTRACT_PAGE = 60 * 8;

  const R = new window.Renderer(canvas);
  const game = new Game();
  game.hiScore = HS.best();

  let state = 'attract';
  let stateT = 0;
  let last = performance.now(), acc = 0;
  let attractT = 0, attractPage = 0;
  let qualifies = false;
  let entry = null;
  let lastEntry = -1;
  let padMode = null;
  let touch = detectTouch();
  let muted = !!Store.get('muted', false);
  let trails = !!Store.get('trails', false);
  Sound.setMuted(muted);
  R.trails = trails;

  function detectTouch() {
    let coarse = false, hover = true;
    try {
      coarse = window.matchMedia('(pointer: coarse)').matches;
      hover = window.matchMedia('(hover: hover)').matches;
    } catch (e) { /* old browser */ }
    const touchy = 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
    return coarse || (touchy && !hover);
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // ---- input ------------------------------------------------------------

  const input = new window.Input({
    onPress,
    onType,
    isTyping: () => state === 'initials',
    isPlaying: () => state === 'playing' || state === 'paused',
    onTouch: () => { if (!touch) { touch = true; layout(); } },
    padActive: () => body.classList.contains('pad'),
  }, $('pad'));

  function onPress(name) {
    Sound.unlock();
    if (name === 'mute') { toggleMute(); return; }
    if (name === 'trails') { toggleTrails(); return; }
    if (name === 'pause') {
      if (state === 'playing') setPaused(true);
      else if (state === 'paused') setPaused(false);
      return;
    }
    const go = name === 'start' || name === 'fire';
    switch (state) {
      case 'attract':
        if (go) startGame();
        break;
      case 'paused':
        if (name === 'start') setPaused(false);
        break;
      case 'gameover':
        if (go) {
          if (qualifies) { if (stateT > 30) startEntry(); } else if (stateT > 45) startGame();
        }
        break;
      case 'scores':
        if (go && stateT > 40) startGame();
        break;
      case 'initials':
        if (stateT < 20) break;
        if (name === 'left') cycle(-1);
        else if (name === 'right') cycle(1);
        else if (name === 'hyper' || name === 'fire' || name === 'start') confirmLetter();
        break;
    }
  }

  function onType(ch) {
    if (state !== 'initials' || stateT < 20) return;
    if (ch === '\b') {
      if (entry.pos > 0) { entry.pos--; entry.idx = Math.max(0, ALPHA.indexOf(entry.letters[entry.pos])); }
      return;
    }
    entry.idx = ALPHA.indexOf(ch);
    confirmLetter();
  }

  canvas.addEventListener('pointerdown', (e) => {
    Sound.unlock();
    if (e.pointerType === 'touch' && !touch) { touch = true; layout(); }
    if (state === 'attract') startGame();
    else if (state === 'paused') setPaused(false);
    else if (state === 'gameover') {
      if (qualifies) { if (stateT > 30) startEntry(); } else if (stateT > 45) startGame();
    } else if (state === 'scores' && stateT > 40) startGame();
  });

  for (const ev of ['pointerdown', 'keydown', 'touchend']) window.addEventListener(ev, () => Sound.unlock(), true);
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('dblclick', (e) => e.preventDefault());

  const btnMute = $('btn-mute'), btnPause = $('btn-pause'), btnTrails = $('btn-trails');
  btnMute.addEventListener('click', () => { Sound.unlock(); toggleMute(); btnMute.blur(); });
  btnPause.addEventListener('click', () => { setPaused(state === 'playing'); btnPause.blur(); });
  btnTrails.addEventListener('click', () => { toggleTrails(); btnTrails.blur(); });

  function toggleMute() {
    muted = !muted;
    Sound.setMuted(muted);
    Store.set('muted', muted);
    updateDom();
  }

  function toggleTrails() {
    trails = !trails;
    R.trails = trails;
    R.fresh = true;
    Store.set('trails', trails);
    updateDom();
  }

  // ---- screens ------------------------------------------------------------

  function enter(s) {
    state = s;
    stateT = 0;
    updateDom();
  }

  function startGame() {
    Sound.unlock();
    input.drain();
    game.newGame();
    lastEntry = -1;
    entry = null;
    enter('playing');
  }

  function setPaused(p) {
    if (p && state === 'playing') {
      state = 'paused';
      Sound.stopLoops();
      updateDom();
    } else if (!p && state === 'paused') {
      state = 'playing';
      acc = 0;
      last = performance.now();
      input.drain();
      updateDom();
    }
  }

  function toAttract() {
    game.attract(true);
    attractT = 0;
    attractPage = 0;
    enter('attract');
  }

  function startEntry() {
    entry = { letters: ['A', ' ', ' '], pos: 0, idx: 0, hold: 0 };
    input.drain();
    enter('initials');
  }

  function cycle(d) {
    entry.idx = (entry.idx + d + ALPHA.length) % ALPHA.length;
  }

  function confirmLetter() {
    entry.letters[entry.pos] = ALPHA[entry.idx];
    entry.pos++;
    if (entry.pos >= 3) { finishEntry(); return; }
    entry.idx = 0;
  }

  function finishEntry() {
    lastEntry = HS.add(game.score, entry.letters.join(''));
    game.hiScore = HS.best();
    enter('scores');
  }

  function updateDom() {
    const c = body.classList;
    c.toggle('menu', state === 'attract' || state === 'paused' || state === 'gameover' || state === 'scores');
    c.toggle('ingame', state === 'playing' || state === 'paused');
    c.toggle('paused', state === 'paused');
    c.toggle('touch', touch);
    const padOn = touch && (state === 'playing' || state === 'initials');
    if (c.contains('pad') !== padOn) {
      c.toggle('pad', padOn);
      if (padOn) input.layoutPad(); else input.releasePad();
    }
    btnMute.setAttribute('aria-pressed', String(muted));
    btnMute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    btnTrails.setAttribute('aria-pressed', String(trails));
    btnPause.setAttribute('aria-label', state === 'paused' ? 'Resume' : 'Pause');
  }

  // ---- simulation tick ------------------------------------------------------

  function tick() {
    stateT++;
    const inp = input.frame();
    switch (state) {
      case 'attract':
        game.step(null);
        if (++attractT >= ATTRACT_PAGE) {
          attractT = 0;
          attractPage = (attractPage + 1) % 2;
          if (attractPage === 1 && !HS.list.length) attractPage = 0;
        }
        break;
      case 'playing':
        game.step(inp);
        if (game.mode === 'over') {
          qualifies = HS.qualifies(game.score);
          enter('gameover');
        }
        break;
      case 'gameover':
        game.step(null);
        if (qualifies && stateT >= 150) startEntry();
        else if (!qualifies && stateT >= 60 * 25) toAttract();
        break;
      case 'initials': {
        game.step(null);
        const dir = (input.held('right') ? 1 : 0) - (input.held('left') ? 1 : 0);
        if (dir && stateT >= 20) {
          entry.hold++;
          if (entry.hold > 22 && entry.hold % 6 === 0) cycle(dir);
        } else {
          entry.hold = 0;
        }
        if (stateT >= 60 * 90) { while (entry.pos < 3) confirmLetter(); }
        break;
      }
      case 'scores':
        game.step(null);
        if (stateT >= 60 * 20) toAttract();
        break;
    }
    playEvents();
  }

  function playEvents() {
    const evs = game.events;
    if (state === 'playing') {
      for (const e of evs) {
        switch (e.type) {
          case 'fire': Sound.fire(); break;
          case 'saucerFire': Sound.saucerFire(); break;
          case 'explode': Sound.explode(e.size); break;
          case 'shipExplode': Sound.shipExplode(); break;
          case 'beat': Sound.beat(e.n); break;
          case 'extraLife': Sound.extraLife(); break;
          case 'hyper': Sound.hyper(); break;
          case 'hyperIn': Sound.hyperIn(); break;
        }
      }
    }
    evs.length = 0;
  }

  // ---- drawing --------------------------------------------------------------

  function overlay() {
    const W = game.W, H = game.H, maxW = W * 0.9;
    const now = performance.now();
    const blink = now % 1000 < 600;
    const T = (s, y, size, b, align, x) => R.text(s, x == null ? W / 2 : x, y, size, align || 'center', b || 0, maxW);

    if (state === 'attract') {
      if (attractPage === 0) {
        T('ASTEROIDS', H * 0.22, Math.min(78, W * 0.1));
        if (blink) T('PUSH START', H * 0.47, 26);
        const lines = touch
          ? ['TAP TO PLAY']
          : ['ARROWS OR A D ROTATE    UP OR W THRUST', 'SPACE OR K FIRE    SHIFT OR S HYPERSPACE', 'ENTER START   P PAUSE   M SOUND   T TRAILS'];
        lines.forEach((l, i) => T(l, H * 0.6 + i * 26, 13, 1));
        T('1 COIN 1 PLAY', H * 0.84, 20, 0);
      } else {
        table(-1);
        if (blink) T('PUSH START', H * 0.86, 22);
      }
    } else if (state === 'playing') {
      if (game.ship.state === 'waiting' && game.playerIntro > 0) T('PLAYER 1', H * 0.34, 22);
    } else if (state === 'paused') {
      T('PAUSED', H * 0.36, 44);
      T(touch ? 'TAP TO RESUME' : 'PRESS P TO RESUME', H * 0.5, 16, 1);
      if (!touch) T('M SOUND   T TRAILS', H * 0.5 + 30, 13, 2);
    } else if (state === 'gameover') {
      T('GAME OVER', H * 0.36, 40);
      if (!qualifies && stateT > 45) {
        if (blink) T('PUSH START', H * 0.52, 24);
        T(touch ? 'TAP TO PLAY AGAIN' : 'PRESS ENTER TO PLAY AGAIN', H * 0.52 + 40, 13, 1);
      }
    } else if (state === 'initials') {
      const lines = ['YOUR SCORE IS ONE OF THE TEN BEST', 'PLEASE ENTER YOUR INITIALS', 'PUSH ROTATE TO SELECT LETTER', 'PUSH HYPERSPACE WHEN LETTER IS CORRECT'];
      lines.forEach((l, i) => T(l, H * 0.2 + i * 34, 18, i < 2 ? 0 : 1));
      const size = 40, adv = size;
      const x0 = W / 2 - adv * 1.5 + 4;
      for (let i = 0; i < 3; i++) {
        let ch, b = 0;
        if (i < entry.pos) ch = entry.letters[i];
        else if (i === entry.pos) { ch = ALPHA[entry.idx]; if (ch === ' ') ch = '_'; b = blink ? 0 : 2; }
        else { ch = '_'; b = 1; }
        R.text(ch, x0 + i * adv, H * 0.56, size, 'left', b);
      }
      if (!touch) T('OR TYPE YOUR INITIALS', H * 0.56 + 76, 13, 2);
    } else if (state === 'scores') {
      table(lastEntry);
      if (stateT > 40 && blink) T('PUSH START', H * 0.86, 22);
    }
  }

  function table(highlight) {
    const W = game.W, H = game.H;
    R.text('HIGH SCORES', W / 2, H * 0.17, 26, 'center', 0, W * 0.9);
    const rowH = Math.min(36, H * 0.052);
    const size = Math.min(20, rowH * 0.58);
    const blink = performance.now() % 700 < 420;
    const digits = Math.max(2, String(HS.best()).length);
    HS.list.forEach((e, i) => {
      const line = String(i + 1).padStart(2, ' ') + '. ' + String(e.score).padStart(digits, ' ') + ' ' + e.initials;
      const b = i === highlight ? (blink ? 0 : 2) : 1;
      R.text(line, W / 2, H * 0.27 + i * rowH, size, 'center', b, W * 0.9);
    });
  }

  function draw(dt, alpha) {
    R.begin(dt);
    const paused = state === 'paused';
    R.world(game, alpha, { paused });
    // Dim the rocks behind screens that are mostly text.
    let dim = 1;
    if (paused) dim = 0.35;
    else if (state === 'initials' || state === 'scores' || (state === 'attract' && attractPage === 1)) dim = 0.45;
    R.flush(dim);
    const best = Math.max(HS.best(), state === 'attract' ? 0 : game.score);
    R.hud(game, best, state === 'playing' || paused);
    overlay();
    R.flush(1);
    R.end();
    R.frameBorder();
  }

  // ---- layout -----------------------------------------------------------------

  const padEls = {};
  for (const el of document.querySelectorAll('#pad [data-btn]')) padEls[el.dataset.btn] = el;

  function readSafe() {
    const cs = window.getComputedStyle($('safe'));
    return {
      t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
      b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0,
    };
  }

  function layout() {
    const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
    const sf = readSafe();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let ax = sf.l, ay = sf.t, aw = vw - sf.l - sf.r, ah = vh - sf.t - sf.b;
    let W = 1024, H = 768;
    padMode = null;
    if (touch) {
      if (vw / vh > 1.45) {
        padMode = 'sides';
        const side = clamp(vw * 0.19, 112, 210);
        ax += side; aw -= side * 2;
      } else {
        padMode = 'below';
        ah -= clamp(vh * 0.25, 150, 240);
      }
      aw = Math.max(80, aw); ah = Math.max(80, ah);
      // On phones the playfield takes the shape of the space left over, with
      // a little less area than the arcade's so things stay a playable size.
      const asp = clamp(aw / ah, 0.6, 1.42);
      const AREA = 600000;
      W = Math.round(Math.sqrt(AREA * asp));
      H = Math.round(Math.sqrt(AREA / asp));
    }
    const scale = Math.min(aw / W, ah / H);
    const w = W * scale, h = H * scale;
    const view = { x: ax + (aw - w) / 2, y: ay + (ah - h) / 2, scale, W, H };
    R.resize(vw, vh, dpr, view);
    game.resize(W, H);
    placePad(vw, vh, sf, view);
    updateDom();
    input.layoutPad();
  }

  function placePad(vw, vh, sf, view) {
    if (!padMode) return;
    const set = (name, cx, cy, size) => {
      const s = padEls[name].style;
      s.width = s.height = Math.round(size) + 'px';
      s.left = Math.round(cx - size / 2) + 'px';
      s.top = Math.round(cy - size / 2) + 'px';
    };
    if (padMode === 'sides') {
      const side = view.x - sf.l;
      const size = clamp(Math.min(side * 0.44, vh * 0.22), 46, 88);
      const lx = sf.l + side / 2, rx = vw - sf.r - side / 2;
      const y = Math.min(vh * 0.68, vh - sf.b - size * 0.75);
      set('left', lx - size * 0.56, y, size);
      set('right', lx + size * 0.56, y, size);
      set('fire', rx + size * 0.36, y, size);
      set('thrust', rx - size * 0.36, y - size * 1.08, size);
      set('hyper', rx + size * 0.4, y - size * 2.1, size * 0.78);
    } else {
      const top = view.y + view.H * view.scale, bot = vh - sf.b;
      const bh = Math.max(60, bot - top);
      const size = clamp(Math.min(vw * 0.185, bh * 0.4), 46, 86);
      const cy = top + bh / 2;
      const L = sf.l + 12, Rr = vw - sf.r - 12;
      set('left', L + size / 2, cy + size * 0.2, size);
      set('right', L + size * 1.5 + 10, cy + size * 0.2, size);
      set('fire', Rr - size / 2, cy + size * 0.42, size);
      set('thrust', Rr - size * 1.42, cy - size * 0.42, size);
      const hx = ((L + size * 2 + 10) + (Rr - size * 1.92)) / 2;
      set('hyper', hx, cy - size * 0.45, size * 0.74);
    }
  }

  let layoutQueued = false;
  function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => { layoutQueued = false; layout(); });
  }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('orientationchange', () => { queueLayout(); setTimeout(layout, 300); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueLayout);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (state === 'playing') setPaused(true);
      Sound.stopLoops();
      input.clear();
    } else {
      last = performance.now();
      acc = 0;
    }
  });
  window.addEventListener('blur', () => { if (state === 'playing') setPaused(true); });
  window.addEventListener('pagehide', () => Sound.stopLoops());

  // ---- main loop -----------------------------------------------------------------

  let perfFrames = 0, perfSlow = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = now - last;
    last = now;
    if (!(dt >= 0)) dt = 0;
    if (dt > 250) dt = 250;
    if (state === 'paused') input.pollPads();
    else {
      acc += dt;
      let n = 0;
      while (acc >= STEP) {
        tick();
        acc -= STEP;
        if (++n >= 8) { acc = 0; break; }
      }
    }
    const playing = state === 'playing';
    Sound.thrust(playing && game.ship.thrusting);
    Sound.saucer(playing && game.saucer ? (game.saucer.small ? 'small' : 'large') : null);

    // If the bloom is too slow on this device, fall back to a cheaper glow.
    if (R.quality > 0 && !document.hidden) {
      perfFrames++;
      if (dt > 24) perfSlow++;
      if (perfFrames >= 180) {
        if (perfSlow > 90) R.quality--;
        perfFrames = perfSlow = 0;
      }
    }
    draw(dt / 1000, state === 'paused' ? 1 : acc / STEP);
  }

  layout();
  updateDom();
  requestAnimationFrame((t) => { last = t; frame(t); });

  // Debug / test hook.
  window.__asteroids = {
    Game, game, input, renderer: R, highScores: HS, sound: Sound, font: VF,
    get state() { return state; },
    get stateT() { return stateT; },
    get entry() { return entry; },
    get touch() { return touch; },
    get padMode() { return padMode; },
    get view() { return R.view; },
    get qualifies() { return qualifies; },
    get attractPage() { return attractPage; },
    set attractPage(p) { attractPage = p; attractT = 0; },
    start: startGame,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    toAttract,
    tick(n) { for (let i = 0; i < (n || 1); i++) tick(); },
    layout,
  };
})();
