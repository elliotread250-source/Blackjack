/* Boot: layout, the fixed-timestep loop, storage, buttons and the debug hook. */
'use strict';
(function (PM) {
  var A = PM.Audio;
  var canvas = document.getElementById('screen');
  var ctx = canvas.getContext('2d', { alpha: false });
  var btnPause = document.getElementById('btn-pause');
  var btnMute = document.getElementById('btn-mute');
  var link = document.getElementById('arcade');
  var pad = document.getElementById('dpad');
  var safeEl = document.getElementById('safe');

  // ------------------------------------------------------------- storage
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* blocked */ } }
  };
  var savedHi = parseInt(store.get('pacman.hi'), 10) || 0;
  A.setMuted(store.get('pacman.muted') === '1');

  function saveHi() {
    if (game.hi > savedHi) { savedHi = game.hi; store.set('pacman.hi', savedHi); }
  }

  // ------------------------------------------------------------- game
  var startHi = 0;
  var game = new PM.Game({
    sfx: function (name) {
      if (game && game.state === 'attract') return; // the attract mode is silent, as in the arcade
      switch (name) {
        case 'intro': A.intro(); break;
        case 'chomp': A.chomp(); break;
        case 'ghost': A.ghostEaten(); break;
        case 'fruit': A.fruit(); break;
        case 'death': A.death(); break;
        case 'extra': A.extraLife(); break;
        case 'intermission': A.intermission(); break;
        case 'attractPower': break;
      }
    },
    gameOver: function () {
      game.newHi = game.score > startHi && game.score > 0;
      saveHi();
    }
  });
  game.hi = savedHi;
  var sprites = PM.buildSprites();

  function inGame() {
    var s = game.state;
    return s === 'ready' || s === 'playing' || s === 'dying' || s === 'levelComplete' || s === 'intermission';
  }

  function startGame() {
    startHi = game.hi;
    game.newHi = false;
    game.newGame();
  }

  function setPaused(p) {
    if (p && !inGame()) return;
    game.paused = !!p;
    if (game.paused) { A.setLoop(''); A.suspend(); }
    else A.resume();
    btnPause.setAttribute('aria-label', game.paused ? 'Resume' : 'Pause');
  }

  var actions = {
    gesture: function () { A.unlock(); if (!game.paused) A.resume(); },
    touchSeen: function () { if (!touch) { touch = true; layout(); } },
    dir: function (d) {
      if (game.paused) return;
      game.wantDir = d;
    },
    start: function () {
      if (game.paused) { setPaused(false); return; }
      if (game.state === 'intermission') { A.stopMusic(); game.cut = null; game.startReady(false); return; }
      if (game.state === 'attract' || (game.state === 'gameOver' && game.t >= 60)) startGame();
    },
    tap: function () { actions.start(); },
    pause: function () {
      if (game.paused) setPaused(false);
      else if (inGame()) setPaused(true);
    },
    mute: function () {
      A.setMuted(!A.isMuted());
      store.set('pacman.muted', A.isMuted() ? '1' : '0');
      syncMute();
    }
  };
  PM.Input(actions);

  btnPause.addEventListener('click', function () {
    if (game.paused) setPaused(false);
    else if (inGame()) setPaused(true);
    else actions.start();
    btnPause.blur();
  });
  btnMute.addEventListener('click', function () { actions.mute(); btnMute.blur(); });
  function syncMute() {
    var m = A.isMuted();
    btnMute.setAttribute('aria-pressed', m ? 'true' : 'false');
    btnMute.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
  }
  syncMute();

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (inGame()) setPaused(true);
      A.setLoop('');
      A.suspend();
      saveHi();
    } else if (!game.paused) {
      A.resume();
    }
  });
  window.addEventListener('pagehide', saveHi);

  // ------------------------------------------------------------- layout
  var touch = false;
  try { touch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window); }
  catch (e) { touch = 'ontouchstart' in window; }

  var scale = 1, mazeCache = null, mazeScale = 0;

  function place(el, x, y, w, h) {
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';
    if (w !== undefined) { el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(h) + 'px'; }
    el.style.right = 'auto'; el.style.bottom = 'auto';
  }

  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 4);
    var cs = window.getComputedStyle(safeEl);
    var sat = parseFloat(cs.paddingTop) || 0, sab = parseFloat(cs.paddingBottom) || 0;
    var sal = parseFloat(cs.paddingLeft) || 0, sar = parseFloat(cs.paddingRight) || 0;
    var aw = Math.max(1, vw - sal - sar), ah = Math.max(1, vh - sat - sab);
    var s = Math.min(aw / 224, ah / 288);
    var cw = 224 * s, ch = 288 * s;
    var left = sal + (aw - cw) / 2, top = sat + (ah - ch) / 2;
    var mode = 'plain';
    if (touch) {
      if (vh >= vw) {
        if (ah - ch >= 130) { mode = 'portrait'; top = sat; }
      } else if ((aw - cw) / 2 >= 104) {
        mode = 'landscape';
      }
    }
    document.body.classList.toggle('touch', touch);
    document.body.classList.toggle('has-pad', mode === 'portrait' || mode === 'landscape');

    var bw = Math.max(224, Math.round(cw * dpr)), bh = Math.max(288, Math.round(bw * 288 / 224));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    canvas.style.width = (bw / dpr) + 'px';
    canvas.style.height = (bh / dpr) + 'px';
    canvas.style.left = Math.round(left) + 'px';
    canvas.style.top = Math.round(top) + 'px';
    scale = bw / 224;
    if (scale !== mazeScale) { mazeCache = PM.buildMaze(scale); mazeScale = scale; }

    var bs = touch ? 46 : 40, m = 10;
    if (mode === 'portrait') {
      var areaTop = top + ch, areaH = vh - sab - areaTop;
      var size = Math.max(110, Math.min(areaH * 0.86, vw * 0.56, 240));
      place(pad, vw / 2 - size / 2, areaTop + (areaH - size) / 2, size, size);
      var by = areaTop + Math.min(areaH / 2 - bs / 2, 18);
      place(btnPause, sal + 16, by);
      place(btnMute, vw - sar - 16 - bs, by);
      link.style.left = (sal + 6) + 'px'; link.style.top = 'auto';
      link.style.bottom = (sab + 6) + 'px'; link.style.right = 'auto';
    } else if (mode === 'landscape') {
      var side = (aw - cw) / 2;
      var size2 = Math.min(side * 0.86, ah * 0.62, 210);
      var rx = left + cw + (side - size2) / 2;
      place(pad, rx, sat + (ah - size2) / 2 + ah * 0.08, size2, size2);
      var lx = sal + (side - bs) / 2;
      place(btnPause, lx, sat + ah / 2 - bs - 8);
      place(btnMute, lx, sat + ah / 2 + 8);
      link.style.left = (sal + 6) + 'px'; link.style.top = (sat + 6) + 'px';
      link.style.bottom = 'auto'; link.style.right = 'auto';
    } else {
      place(btnMute, vw - sar - m - bs, sat + m);
      place(btnPause, vw - sar - m * 2 - bs * 2, sat + m);
      link.style.left = (sal + 6) + 'px'; link.style.right = 'auto';
      if (left - sal >= 110 || top - sat >= 34) {
        // In the letterbox, clear of the screen.
        link.style.top = (sat + 6) + 'px'; link.style.bottom = 'auto';
      } else {
        // No room beside the screen: bottom-left, over the empty lives row.
        link.style.top = 'auto'; link.style.bottom = (sab + 4) + 'px';
      }
    }
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  layout();

  // ------------------------------------------------------------- gamepad
  var padPrev = {};
  function pollGamepad() {
    if (!navigator.getGamepads) return;
    var pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    var gp = null;
    for (var i = 0; pads && i < pads.length; i++) if (pads[i] && pads[i].connected) { gp = pads[i]; break; }
    if (!gp) return;
    var b = function (n) { return !!(gp.buttons[n] && gp.buttons[n].pressed); };
    var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (b(12) || ay < -0.6) actions.dir(PM.UP);
    else if (b(13) || ay > 0.6) actions.dir(PM.DOWN);
    else if (b(14) || ax < -0.6) actions.dir(PM.LEFT);
    else if (b(15) || ax > 0.6) actions.dir(PM.RIGHT);
    var now = { a: b(0), start: b(9) };
    if (now.a && !padPrev.a) { A.unlock(); if (!inGame() || game.paused) actions.start(); }
    if (now.start && !padPrev.start) { A.unlock(); if (inGame()) actions.pause(); else actions.start(); }
    padPrev = now;
  }

  // ------------------------------------------------------------- loop
  var STEP = 1000 / 60;
  var last = performance.now(), acc = 0;
  var lastUi = '';

  function syncUi() {
    var playing = inGame() && !game.paused;
    var key = (playing ? 'p' : 'n');
    if (key !== lastUi) {
      lastUi = key;
      document.body.classList.toggle('playing', playing);
    }
  }

  function step(n) {
    for (var i = 0; i < n; i++) {
      var before = game.state;
      game.tick();
      if (before !== 'gameOver' && game.state === 'gameOver') saveHi();
    }
  }

  function frame(now) {
    var dt = now - last;
    last = now;
    if (dt > 250 || dt < 0) dt = STEP;
    if (Math.abs(dt - STEP) < 1) dt = STEP; // absorb 60Hz vsync jitter
    pollGamepad();
    if (!game.paused && !debug.hold) {
      acc += dt;
      var n = 0;
      while (acc >= STEP - 0.01 && n < 8) { step(1); acc -= STEP; n++; }
      if (n === 8) acc = 0;
    }
    A.setLoop(game.paused ? '' : game.loopSound());
    syncUi();
    PM.render(ctx, scale, sprites, mazeCache, game, { touch: touch });
    window.requestAnimationFrame(frame);
  }
  window.requestAnimationFrame(frame);

  // ------------------------------------------------------------- debug hook
  var debug = window.__pacman = {
    hold: false,
    game: game,
    get state() { return game.state; },
    get paused() { return game.paused; },
    get scale() { return scale; },
    mapDots: function () { return PM.countMapDots(); },
    boardDots: function () {
      var d = 0, e = 0;
      for (var i = 0; i < game.dots.length; i++) { if (game.dots[i] === 1) d++; else if (game.dots[i] === 2) e++; }
      return { dots: d, energizers: e };
    },
    start: function () { startGame(); },
    tick: function (n) { step(n || 1); },
    setDir: function (d) { game.wantDir = d; },
    passable: PM.passable,
    tileChar: PM.tileChar
  };
})(window.PM);
