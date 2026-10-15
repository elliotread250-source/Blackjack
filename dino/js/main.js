/* Dino Run: boot, layout, the fixed 60 Hz loop, storage, the HTML bits
 * around the canvas and the window.__dino debug hook.
 */
(function () {
  'use strict';

  var Core = window.DinoCore;
  var Sfx = window.DinoAudio;
  var Renderer = window.DinoRender;
  var Input = window.DinoInput;
  var C = Core.C;

  var body = document.body;
  var canvas = document.getElementById('screen');
  var below = document.getElementById('below');
  var hintEl = document.getElementById('hint');
  var statsEl = document.getElementById('stats');
  var btnMute = document.getElementById('btn-mute');
  var btnPalette = document.getElementById('btn-palette');
  var btnPause = document.getElementById('btn-pause');
  var safeEl = document.getElementById('safe');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  // ------------------------------------------------------------------ storage
  var KEY_HI = 'dino.hi', KEY_MUTED = 'dino.muted', KEY_PALETTE = 'dino.palette';
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* blocked */ } }
  };
  var savedHi = Math.max(0, parseInt(store.get(KEY_HI), 10) || 0);

  // ------------------------------------------------------------------ state
  var game = new Core.Game({ highScore: savedHi });
  var renderer = new Renderer(canvas);
  renderer.palette = store.get(KEY_PALETTE) === 'colour' ? 'colour' : 'classic';
  Sfx.setMuted(store.get(KEY_MUTED) === '1');
  var paused = false;
  var touchMode = false;
  try {
    touchMode = window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches;
  } catch (e) { /* old browser */ }

  // ------------------------------------------------------------------ holds
  var sources = { jump: {}, duck: {} };
  function count(o) { var n = 0; for (var k in o) if (o[k]) n++; return n; }

  function jump(id, repeat) {
    sources.jump[id] = true;
    game.pressJump({ repeat: repeat });
    flush();
  }
  function unjump(id) {
    if (!sources.jump[id]) return;
    delete sources.jump[id];
    if (!count(sources.jump)) game.releaseJump();
  }
  function duck(id) {
    sources.duck[id] = true;
    game.pressDuck();
  }
  function unduck(id) {
    if (!sources.duck[id]) return;
    delete sources.duck[id];
    if (!count(sources.duck)) game.releaseDuck();
  }
  function dropHolds() {
    sources = { jump: {}, duck: {} };
    game.releaseAll();
    if (input) input.reset();
  }

  // ------------------------------------------------------------------ actions
  function setMuted(m) {
    Sfx.setMuted(m);
    store.set(KEY_MUTED, m ? '1' : '0');
    btnMute.setAttribute('aria-pressed', m ? 'true' : 'false');
    btnMute.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
  }
  function toggleMute() { setMuted(!Sfx.isMuted()); }

  function setPalette(name) {
    renderer.palette = name === 'colour' ? 'colour' : 'classic';
    store.set(KEY_PALETTE, renderer.palette);
    btnPalette.setAttribute('aria-pressed', renderer.palette === 'colour' ? 'true' : 'false');
  }
  function togglePalette() { setPalette(renderer.palette === 'colour' ? 'classic' : 'colour'); }

  function pause() {
    if (paused || !game.isRunning()) return;
    paused = true;
    dropHolds();
  }
  function resume() {
    if (!paused) return;
    paused = false;
    acc = 0;
    last = performance.now();
  }
  function togglePause() { if (paused) resume(); else pause(); }

  function enter(id) {
    if (paused) { resume(); return false; }
    if (game.state === 'crashed') { game.restart(); flush(); return false; }
    if (game.state === 'waiting') { jump(id, false); return true; }
    return false;
  }

  function setTouch(on) {
    if (on === touchMode) return;
    touchMode = on;
    uiKey = '';
  }

  // Sounds and saving, for whatever the game reported since last time.
  function flush() {
    var ev = game.drainEvents();
    for (var i = 0; i < ev.length; i++) {
      switch (ev[i]) {
        case 'jump':
        case 'restart':
          Sfx.play('jump');
          break;
        case 'score':
          Sfx.play('score');
          break;
        case 'crash':
          Sfx.play('hit');
          if (touchMode && navigator.vibrate) { try { navigator.vibrate(120); } catch (e) { /* ignore */ } }
          dropHolds();
          break;
        case 'highscore':
          if (game.hiScore > savedHi) {
            savedHi = game.hiScore;
            store.set(KEY_HI, savedHi);
          }
          break;
      }
    }
  }

  var input = Input.attach({
    jump: jump, unjump: unjump, duck: duck, unduck: unduck, enter: enter,
    mute: toggleMute, palette: togglePalette, togglePause: togglePause,
    paused: function () { return paused; },
    resume: resume,
    touch: setTouch,
    unlock: function () { Sfx.unlock(); },
    running: function () { return game.isRunning(); }
  });

  btnMute.addEventListener('click', function () { Sfx.unlock(); toggleMute(); btnMute.blur(); });
  btnPalette.addEventListener('click', function () { togglePalette(); btnPalette.blur(); });
  btnPause.addEventListener('click', function () { togglePause(); btnPause.blur(); });

  document.addEventListener('visibilitychange', function () { if (document.hidden) pause(); });
  window.addEventListener('blur', function () { pause(); });
  window.addEventListener('pagehide', function () { pause(); });

  // ------------------------------------------------------------------ layout
  // The strip fills the width. When the scale comes out at 2x or more it is
  // rounded down to whole device pixels if that costs little, so every game
  // pixel is the same size; the height is capped so it stays a strip.
  var layoutInfo = {};
  function safeInsets() {
    var cs = window.getComputedStyle(safeEl);
    return {
      t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0,
      b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0
    };
  }

  function layout() {
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var vh = document.documentElement.clientHeight || window.innerHeight;
    var dpr = window.devicePixelRatio || 1;
    var portrait = vh > vw;
    var phone = Math.min(vw, vh) < 560;
    var ins = safeInsets();
    var gutter = phone ? 8 : 24;
    var availW = Math.max(100, vw - ins.l - ins.r - gutter * 2);
    var maxH = portrait ? vh * 0.34 : (phone ? (vh - ins.t - ins.b) * 0.6 : vh * 0.5);
    var dev = Math.min(availW * dpr / C.WIDTH, maxH * dpr / C.HEIGHT);
    if (dev >= 2) {
      var whole = Math.floor(dev);
      if (whole / dev >= 0.86) dev = whole;
    }
    dev = Math.max(dev, 0.5);
    var cw = Math.round(C.WIDTH * dev), ch = Math.round(C.HEIGHT * dev);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    var cssW = cw / dpr, cssH = ch / dpr;
    var left = ins.l + (vw - ins.l - ins.r - cssW) / 2;
    var centre = portrait ? vh * 0.4 : (phone ? vh * 0.44 : vh * 0.47);
    var top = Math.max(ins.t + 4, centre - cssH / 2);
    left = Math.round(left * dpr) / dpr;
    top = Math.round(top * dpr) / dpr;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.style.left = left + 'px';
    canvas.style.top = top + 'px';
    below.style.left = left + 'px';
    below.style.width = cssW + 'px';
    below.style.top = (top + cssH + (phone ? 6 : 14)) + 'px';
    body.classList.toggle('portrait', portrait);
    layoutInfo = { vw: vw, vh: vh, dpr: dpr, scale: dev, cssW: cssW, cssH: cssH, left: left, top: top, portrait: portrait };
  }
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 60); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);

  // ------------------------------------------------------------------ HTML around the canvas
  var uiKey = '';
  var colourKey = '';

  function fmtTime(frames) {
    var s = Math.floor(frames / 60), m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function fmtNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function syncUi(col) {
    var st = game.state;
    var key = st + '|' + paused + '|' + touchMode + '|' + game.newHigh + '|' + (st === 'crashed' ? game.canRestart() : '');
    if (key !== uiKey) {
      uiKey = key;
      body.className = body.className.replace(/\bst-\w+/g, '').replace(/\bpaused\b/g, '').trim();
      body.classList.add('st-' + st);
      if (paused) body.classList.add('paused');
      body.classList.toggle('touch', touchMode);
      var hint = '', stats = '';
      if (paused) {
        hint = touchMode ? 'Paused &middot; tap to resume' : 'Paused &middot; press <kbd>P</kbd> or <kbd>Space</kbd> to resume';
      } else if (st === 'waiting') {
        hint = touchMode
          ? 'Tap to start<br><span class="keys">Tap to jump, hold to jump higher &middot; swipe down or hold &#9660; to duck</span>'
          : 'Press <kbd>Space</kbd> to start<br><span class="keys"><kbd>Space</kbd> / <kbd>&uarr;</kbd> jump (hold for higher) &middot; <kbd>&darr;</kbd> duck &middot; <kbd>M</kbd> mute &middot; <kbd>P</kbd> pause</span>';
      } else if (st === 'crashed') {
        var s = game.stats;
        stats = (game.newHigh ? '<b>New high score!</b> &middot; ' : '') +
          'Distance <b>' + fmtNum(game.score) + '</b> &middot; Jumps <b>' + s.jumps + '</b> &middot; Time <b>' + fmtTime(s.frames) + '</b>';
        hint = touchMode ? 'Tap to run again' : 'Press <kbd>Space</kbd> or <kbd>Enter</kbd> to run again';
        if (!game.canRestart()) hint = '&nbsp;';
      }
      hintEl.innerHTML = hint;
      statsEl.innerHTML = stats;
    }
    var ck = col.bg + col.text + col.hi;
    if (ck !== colourKey) {
      colourKey = ck;
      var rs = document.documentElement.style;
      rs.setProperty('--bg', col.bg);
      rs.setProperty('--fg', col.text);
      rs.setProperty('--soft', col.hi);
      if (themeMeta) themeMeta.setAttribute('content', col.bg);
    }
  }

  // ------------------------------------------------------------------ loop
  // Fixed 60 Hz steps, so a 120 Hz screen runs at exactly the same speed.
  var STEP = C.FRAME_MS;
  var acc = 0;
  var last = performance.now();

  function frame(now) {
    window.requestAnimationFrame(frame);
    var dt = now - last;
    last = now;
    if (!(dt > 0)) dt = 0;
    if (dt > 250) dt = 250;
    if (Math.abs(dt - STEP) < 0.6) dt = STEP;   // absorb vsync jitter on 60 Hz screens
    Input.pollPads(padActions);
    if (!paused) {
      acc += dt;
      var n = 0;
      while (acc >= STEP && n < 8) {
        game.step();
        acc -= STEP;
        n++;
      }
      if (n >= 8) acc = 0;
      flush();
    }
    syncUi(renderer.draw(game, { paused: paused }));
  }

  var padActions = {
    jump: jump, unjump: unjump, duck: duck, unduck: unduck, enter: enter,
    togglePause: togglePause, paused: function () { return paused; }, resume: resume,
    touch: setTouch, unlock: function () { Sfx.unlock(); },
    running: function () { return game.isRunning(); }
  };

  // ------------------------------------------------------------------ debug hook
  window.__dino = {
    game: game,
    info: function () {
      var t = game.trex;
      return {
        state: game.state, paused: paused, score: game.score, displayScore: game.displayScore,
        hiScore: game.hiScore, savedHi: savedHi, speed: game.speed,
        trex: { x: t.x, y: t.y, status: t.status, jumping: t.jumping, ducking: t.ducking, peakY: t.peakY },
        obstacles: game.obstacles.map(function (o) { return { type: o.type, x: Core.obstacleX(o), y: o.y, size: o.size }; }),
        night: game.night.amount, nightTarget: game.night.target,
        muted: Sfx.isMuted(), audio: Sfx.state(), palette: renderer.palette, touch: touchMode,
        stats: { jumps: game.stats.jumps, ducks: game.stats.ducks, frames: game.stats.frames },
        layout: layoutInfo, canvas: { w: canvas.width, h: canvas.height }
      };
    },
    setScore: function (n) { game.setScore(n); },
    setSpeed: function (s) { game.speed = s; },
    spawn: function (type, opts) { var o = game.spawn(type, opts); return { type: o.type, x: o.x, y: o.y }; },
    clearObstacles: function () { game.obstacles = []; },
    step: function (n) { for (var i = 0; i < (n || 1); i++) game.step(); flush(); },
    godMode: function (on) { game.noCollide = !!on; },
    pause: pause,
    resume: resume
  };

  setMuted(Sfx.isMuted());
  setPalette(renderer.palette);
  layout();
  window.requestAnimationFrame(frame);
}());
