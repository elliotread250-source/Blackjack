/* Wiring: settings, layout, the fixed-timestep loop, input (keys, swipes,
   d-pad), menus, scores, effects. */
(function () {
  'use strict';
  var Store = window.SnakeStore;
  var Sound = window.SnakeAudio;
  var Engine = window.SnakeEngine;
  var Render = window.SnakeRender;
  var TAU = Math.PI * 2;

  var SIZES = { small: [10, 9], medium: [17, 15], large: [24, 21] };
  var SPEEDS = { slow: 160, normal: 125, fast: 85 };
  var MODE_NAMES = { classic: 'Classic', wrap: 'Wrap', apples3: '3 Apples' };
  var MODE_DESC = { classic: 'Walls are deadly', wrap: 'Go through the edges', apples3: 'Three apples at once' };
  var SPEED_NAMES = { slow: 'Slow', normal: 'Normal', fast: 'Fast' };
  var SIZE_NAMES = { small: 'Small', medium: 'Medium', large: 'Large' };
  var DEFAULTS = { mode: 'classic', speed: 'normal', size: 'medium', skin: 'blue', dpad: 'off' };
  var VALID = { mode: MODE_NAMES, speed: SPEEDS, size: SIZES, skin: Render.SKINS, dpad: { on: 1, off: 1 } };
  var DIE_MS = 1150, WIN_MS = 1900;

  function $(id) { return document.getElementById(id); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var body = document.body;
  var root = document.documentElement;
  var app = $('app'), stage = $('stage'), frameEl = $('frame'), canvas = $('board'), hint = $('hint');
  var dpad = $('dpad');
  var scrTitle = $('scrTitle'), scrPause = $('scrPause'), scrOver = $('scrOver');
  var hudScore = $('hudScore'), hudBest = $('hudBest');

  /* ---------- settings ---------- */
  var settings = (function () {
    var s = Store.get('settings', null);
    var out = {};
    for (var k in DEFAULTS) {
      var v = s && typeof s === 'object' ? s[k] : undefined;
      out[k] = typeof v === 'string' && Object.prototype.hasOwnProperty.call(VALID[k], v) ? v : DEFAULTS[k];
    }
    return out;
  })();
  function saveSettings() { Store.set('settings', settings); }
  function bestKey() { return 'best.' + settings.size + '.' + settings.speed + '.' + settings.mode; }
  function getBest() {
    var n = Store.get(bestKey(), 0);
    return typeof n === 'number' && isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }

  /* ---------- touch detection ---------- */
  var isTouch = false;
  try { isTouch = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* old browser */ }
  if ('ontouchstart' in window) isTouch = true;
  var lastInputTouch = isTouch;
  function applyBodyClasses() {
    body.classList.toggle('touch', isTouch);
    body.classList.toggle('dpad-on', isTouch && settings.dpad === 'on');
    body.classList.toggle('muted', Sound.isMuted());
  }

  /* ---------- state ---------- */
  var renderer = new Render.Renderer(canvas);
  var game = null;
  var state = 'title';     // title | ready | playing | paused | dying | over
  var pausedFrom = 'playing';
  var stepMs = SPEEDS[settings.speed];
  var acc = 0;
  var last = performance.now();
  var particles = [];
  var effects = [];        // eat effects waiting for the head to reach the apple
  var eatenShown = [];     // eaten apples still drawn until then
  var shownScore = 0;
  var liveBest = 0;
  var bestAtStart = 0;
  var endKind = null;      // 'die' | 'win'
  var endAt = 0;
  var playTime = 0;
  var overLockUntil = 0;
  var nextBlink = 0, blinkUntil = 0;
  var shaking = false;
  var cellCss = 20;

  /* ---------- layout ---------- */
  function measure() {
    var cs = window.getComputedStyle(app);
    var W = window.innerWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    var H = window.innerHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    var compact = Math.min(W, H) < 560;
    var gutter = compact ? 8 : 24;
    var hudH = compact ? 46 : 56;
    var border = compact ? 6 : 12;
    var gap = 14;
    var dpadOn = body.classList.contains('dpad-on');
    var portrait = H >= W;
    var dp = 0, side = false;
    if (dpadOn) {
      if (portrait) dp = clamp(Math.min(W * 0.56, H * 0.27), 132, 220);
      else { side = true; dp = clamp(Math.min(H * 0.62, W * 0.3), 120, 210); }
    }
    return {
      hudH: hudH, border: border, dp: dp, side: side,
      availW: W - 2 * gutter - 2 * border - (side ? dp + gap : 0),
      availH: H - 2 * gutter - hudH - 2 * border - (dpadOn && !side ? dp + gap : 0),
      dpr: Math.min(window.devicePixelRatio || 1, 4)
    };
  }

  /* Pick landscape or portrait board, whichever gives bigger cells: on a
     portrait phone a 17x15 board becomes 15x17 and fills more screen. */
  function chooseDims(m) {
    var b = SIZES[settings.size];
    var cl = Math.min(m.availW / b[0], m.availH / b[1]);
    var cp = Math.min(m.availW / b[1], m.availH / b[0]);
    return cp > cl * 1.001 ? [b[1], b[0]] : [b[0], b[1]];
  }

  function applyLayout(m) {
    var cell = clamp(Math.min(m.availW / game.cols, m.availH / game.rows), 6, 60);
    var k = Math.max(4, Math.floor(cell * m.dpr));
    cellCss = k / m.dpr;
    root.style.setProperty('--hud-h', m.hudH + 'px');
    root.style.setProperty('--border', m.border + 'px');
    root.style.setProperty('--dpad', Math.round(m.dp) + 'px');
    stage.classList.toggle('side', m.side);
    renderer.resize(game.cols, game.rows, k, m.dpr);
  }

  function createGame(dims) {
    game = new Engine.Game(dims[0], dims[1], settings.mode);
    var now = performance.now();
    game.apples.forEach(function (a) { a.born = now; });
    particles.length = 0;
    effects.length = 0;
    eatenShown.length = 0;
    acc = 0;
    shownScore = 0;
    playTime = 0;
    endKind = null;
  }

  function layout() {
    var m = measure();
    if (!game || state === 'title' || state === 'ready') {
      var d = chooseDims(m);
      if (!game || d[0] !== game.cols || d[1] !== game.rows || game.mode !== settings.mode) createGame(d);
    }
    applyLayout(m);
  }
  var layoutQueued = false;
  function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(function () { layoutQueued = false; layout(); });
  }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('orientationchange', function () { queueLayout(); setTimeout(queueLayout, 250); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueLayout);

  /* ---------- HUD & menus ---------- */
  function pop(el) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
  function updateHud() {
    hudScore.textContent = shownScore;
    hudBest.textContent = liveBest;
  }

  function setState(s) {
    state = s;
    scrTitle.classList.toggle('show', s === 'title');
    scrPause.classList.toggle('show', s === 'paused');
    scrOver.classList.toggle('show', s === 'over');
    body.classList.toggle('menu', s === 'title' || s === 'paused' || s === 'over');
    body.classList.toggle('paused', s === 'paused');
    hint.classList.toggle('show', s === 'ready');
  }

  function updateTitleUI() {
    var segs = document.querySelectorAll('[data-setting]');
    for (var i = 0; i < segs.length; i++) {
      var key = segs[i].getAttribute('data-setting');
      var btns = segs[i].querySelectorAll('button');
      for (var j = 0; j < btns.length; j++) {
        var on = btns[j].getAttribute('data-value') === settings[key];
        btns[j].classList.toggle('sel', on);
        btns[j].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    $('modeDesc').textContent = MODE_DESC[settings.mode];
    $('titleBest').textContent = getBest();
  }

  function showTitle() {
    stepMs = SPEEDS[settings.speed];
    var m = measure();
    createGame(chooseDims(m));
    applyLayout(m);
    liveBest = getBest();
    updateHud();
    updateTitleUI();
    setState('title');
  }

  function newGame() {
    stepMs = SPEEDS[settings.speed];
    var m = measure();
    createGame(chooseDims(m));
    applyLayout(m);
    liveBest = bestAtStart = getBest();
    updateHud();
    setState('ready');
  }

  function begin(dir) {
    if (state !== 'ready') return;
    if (dir) game.enqueue(dir);
    setState('playing');
    Sound.play('start');
    acc = 0;
    last = performance.now();
    doStep();
  }

  function startFromTitle(dir) {
    newGame();
    if (dir) begin(dir);
  }

  function pause() {
    if (state !== 'playing' && state !== 'ready') return;
    pausedFrom = state;
    $('pauseScore').textContent = shownScore;
    $('pauseBest').textContent = liveBest;
    setState('paused');
    Sound.play('pause');
  }
  function resume() {
    if (state !== 'paused') return;
    setState(pausedFrom);
    last = performance.now();
    if (pausedFrom === 'playing') Sound.play('resume');
  }
  function togglePause() {
    if (state === 'paused') resume();
    else pause();
  }

  function formatTime(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  function showOver() {
    var score = game.score;
    var isNew = score > 0 && score > bestAtStart;
    var best = Math.max(getBest(), score);
    if (score > getBest()) Store.set(bestKey(), score);
    shownScore = score;
    liveBest = best;
    updateHud();
    $('ottl').textContent = endKind === 'win' ? 'You win!' : 'Game over';
    $('overScore').textContent = score;
    $('overBest').textContent = best;
    $('overBadge').hidden = !isNew;
    $('overMeta').textContent = [MODE_NAMES[settings.mode], SPEED_NAMES[settings.speed], SIZE_NAMES[settings.size], formatTime(playTime)].join(' · ');
    setState('over');
    overLockUntil = performance.now() + 450;
    if (isNew && endKind !== 'win') setTimeout(function () { Sound.play('best'); }, 180);
  }

  /* ---------- game events ---------- */
  function doStep() {
    var ev = game.step();
    if (!ev) return;
    if (ev.type === 'die') { onDie(); return; }
    if (ev.eaten) {
      ev.spawned.forEach(function (a) { a.born = Infinity; });
      eatenShown.push(ev.eaten);
      effects.push({ step: game.steps, apple: ev.eaten, spawned: ev.spawned });
    }
    if (ev.type === 'win') onWin();
  }

  /* The head is drawn one step behind the logic (that is what makes it
     glide), so the crunch, particles and score tick wait until the head
     visibly reaches the apple. */
  function fireEffects(t, force) {
    var now = performance.now();
    for (var i = 0; i < effects.length; i++) {
      var e = effects[i];
      if (!(force || game.steps > e.step || t >= 0.55)) continue;
      effects.splice(i--, 1);
      var idx = eatenShown.indexOf(e.apple);
      if (idx >= 0) eatenShown.splice(idx, 1);
      for (var j = 0; j < e.spawned.length; j++) e.spawned[j].born = now;
      burst(e.apple.x + 0.5, e.apple.y + 0.5);
      Sound.play('eat');
      shownScore = game.score - effects.length;
      pop(hudScore);
      if (shownScore > liveBest) {
        liveBest = shownScore;
        Store.set(bestKey(), liveBest);
        pop(hudBest);
      }
      updateHud();
    }
  }

  function onDie() {
    fireEffects(1, true);
    endKind = 'die';
    endAt = performance.now();
    setState('dying');
    Sound.play('die');
    vibrate([45, 40, 70]);
  }

  function onWin() {
    fireEffects(1, true);
    endKind = 'win';
    endAt = performance.now();
    setState('dying');
    Sound.play('win');
    confetti();
  }

  function vibrate(p) {
    if (!lastInputTouch || !navigator.vibrate) return;
    try {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(p);
    } catch (e) { /* unsupported */ }
  }

  /* ---------- particles ---------- */
  var BURST = ['#e9471d', '#ff7a45', '#ffb03a', '#c8321a', '#ffd166'];
  function burst(x, y) {
    for (var i = 0; i < 16; i++) {
      var a = Math.random() * TAU, sp = 2 + Math.random() * 3.4;
      var life = 0.4 + Math.random() * 0.3;
      particles.push({
        kind: 'dot', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: life, max: life, r: 0.06 + Math.random() * 0.07,
        color: i < 3 ? '#4fae2b' : BURST[i % BURST.length], drag: 4.5, g: 0
      });
    }
    particles.push({ kind: 'ring', x: x, y: y, vx: 0, vy: 0, life: 0.38, max: 0.38, color: '#ffffff', drag: 0, g: 0 });
  }
  var CONFETTI = ['#4e7cf6', '#e9471d', '#ffc83d', '#4fae2b', '#ec5f9e', '#9061f0', '#ffffff'];
  function confetti() {
    for (var i = 0; i < 110; i++) {
      var life = 1.4 + Math.random() * 0.9;
      particles.push({
        kind: 'confetti', x: Math.random() * game.cols, y: -0.5 - Math.random() * game.rows * 0.4,
        vx: (Math.random() - 0.5) * 3, vy: Math.random() * 3,
        life: life, max: life, r: 0.12 + Math.random() * 0.1,
        color: CONFETTI[i % CONFETTI.length], drag: 0.8, g: 7,
        rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12
      });
    }
  }
  function updateParticles(dt) {
    var s = dt / 1000;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.life -= s;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      var f = Math.exp(-p.drag * s);
      p.vx *= f;
      p.vy = p.vy * f + p.g * s;
      p.x += p.vx * s;
      p.y += p.vy * s;
      if (p.vr) p.rot += p.vr * s;
    }
  }

  /* ---------- main loop (fixed timestep, interpolated render) ---------- */
  var DIR_VEC = Engine.DIRS;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = now - last;
    last = now;
    if (!(dt >= 0)) dt = 0;
    if (dt > 250) dt = 250;

    var t = 1;
    if (state === 'playing') {
      acc += dt;
      playTime += dt;
      while (acc >= stepMs && state === 'playing') {
        acc -= stepMs;
        doStep();
      }
      t = state === 'playing' ? acc / stepMs : 1;
    } else if (state === 'paused' && pausedFrom === 'playing') {
      t = acc / stepMs;
    }
    if (game.steps === 0) t = 1;

    if (state !== 'paused') updateParticles(dt);
    if (effects.length) fireEffects(t, state !== 'playing' && state !== 'paused');

    var bump = null, flash = false, redFlash = 0;
    var tau = now - endAt;
    if (game.dead) {
      var b = tau < 70 ? 0.17 * tau / 70 : 0.08 + 0.09 * Math.max(0, 1 - (tau - 70) / 160);
      var dv = DIR_VEC[game.deathDir];
      bump = { x: dv[0] * b, y: dv[1] * b };
      if (state === 'dying') {
        flash = tau > 320 && tau < 1080 && Math.floor((tau - 320) / 125) % 2 === 0;
        redFlash = Math.max(0, 1 - tau / 380);
      }
    }
    if (state === 'dying') {
      if (endKind === 'die' && tau < 360) {
        var amp = 7 * Math.pow(1 - tau / 360, 2);
        frameEl.style.transform = 'translate(' + ((Math.random() * 2 - 1) * amp).toFixed(1) + 'px,' + ((Math.random() * 2 - 1) * amp).toFixed(1) + 'px)';
        shaking = true;
      } else if (shaking) {
        frameEl.style.transform = '';
        shaking = false;
      }
      if (tau > (endKind === 'win' ? WIN_MS : DIE_MS)) showOver();
    } else if (shaking) {
      frameEl.style.transform = '';
      shaking = false;
    }

    if (now > nextBlink) {
      blinkUntil = now + 140;
      nextBlink = now + 2200 + Math.random() * 3800;
    }

    // eyes follow the nearest apple
    var look = null, h = game.snake[0], bestD = Infinity;
    for (var i = 0; i < game.apples.length; i++) {
      var a = game.apples[i];
      if (a.born === Infinity) continue;
      var d = (a.x - h.x) * (a.x - h.x) + (a.y - h.y) * (a.y - h.y);
      if (d < bestD) { bestD = d; look = { x: a.x + 0.5, y: a.y + 0.5 }; }
    }

    renderer.draw({
      game: game, t: t, now: now, skin: settings.skin,
      bump: bump, flash: flash, dead: game.dead, blink: now < blinkUntil && !game.dead,
      look: look, eaten: eatenShown, particles: particles, redFlash: redFlash
    });
  }

  /* ---------- input ---------- */
  function steer(dir) {
    if (state === 'title') { startFromTitle(dir); return; }
    if (state === 'ready') { begin(dir); return; }
    if (state === 'playing') game.enqueue(dir);
  }

  function primaryAction() {
    if (state === 'title') startFromTitle(null);
    else if (state === 'ready') begin(null);
    else if (state === 'paused') resume();
    else if (state === 'over') { if (performance.now() > overLockUntil) newGame(); }
    else if (state === 'dying' && performance.now() - endAt > 450) showOver();
  }

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right'
  };
  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    lastInputTouch = false;
    var dir = KEYS[e.key] || KEYS[e.code];
    if (dir) {
      e.preventDefault();
      steer(dir);
      return;
    }
    var k = e.key;
    var onControl = e.target && e.target.closest && e.target.closest('button, a');
    var menuOpen = state === 'title' || state === 'paused' || state === 'over';
    if (k === ' ' || k === 'Enter' || k === 'Spacebar') {
      if (onControl && menuOpen) return; // let the focused button do its thing
      e.preventDefault();
      if (!e.repeat) primaryAction();
      return;
    }
    if (k === 'p' || k === 'P' || k === 'Escape' || k === 'Esc') {
      if (e.repeat) return;
      if (state === 'playing' || state === 'ready' || state === 'paused') {
        e.preventDefault();
        togglePause();
      }
      return;
    }
    if (k === 'm' || k === 'M') {
      if (!e.repeat) Sound.toggle();
    }
  });

  // Swipes: steer as soon as the finger has travelled far enough, without
  // waiting for it to lift, then re-anchor so one gesture can turn twice.
  var swipe = null;
  function swipeThreshold() { return clamp(cellCss * 0.5, 10, 22); }
  app.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    noteTouch(e);
    if (e.target.closest && e.target.closest('button, a, #dpad')) return;
    swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!swipe || e.pointerId !== swipe.id) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < swipeThreshold()) return;
    var dir = ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    swipe.x = e.clientX;
    swipe.y = e.clientY;
    swipe.moved = true;
    steer(dir);
  });
  function endSwipe(e) {
    if (!swipe || e.pointerId !== swipe.id) return;
    var tapped = !swipe.moved && e.type === 'pointerup';
    swipe = null;
    if (tapped && state === 'ready') begin(null);
  }
  window.addEventListener('pointerup', endSwipe);
  window.addEventListener('pointercancel', endSwipe);
  app.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function noteTouch(e) {
    if (e.pointerType === 'mouse') { lastInputTouch = false; return; }
    lastInputTouch = true;
    if (!isTouch) {
      isTouch = true;
      applyBodyClasses();
      queueLayout();
    }
  }
  window.addEventListener('pointerdown', noteTouch, { capture: true, passive: true });

  // D-pad: the whole pad is one zone; direction comes from where the thumb
  // is relative to its centre, so rolling the thumb round it works too.
  var dpadPtr = null, dpadDir = null;
  var dbtns = dpad.querySelectorAll('.dbtn');
  function dpadAt(e) {
    var r = dpad.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (Math.max(Math.abs(dx), Math.abs(dy)) < r.width * 0.12) return null;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }
  function dpadSet(dir) {
    if (dir === dpadDir) return;
    dpadDir = dir;
    for (var i = 0; i < dbtns.length; i++) dbtns[i].classList.toggle('on', dbtns[i].getAttribute('data-dir') === dir);
    if (dir) steer(dir);
  }
  dpad.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    dpadPtr = e.pointerId;
    try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    dpadSet(dpadAt(e));
  });
  dpad.addEventListener('pointermove', function (e) {
    if (e.pointerId === dpadPtr) dpadSet(dpadAt(e));
  });
  function dpadEnd(e) {
    if (e.pointerId !== dpadPtr) return;
    dpadPtr = null;
    dpadDir = null;
    for (var i = 0; i < dbtns.length; i++) dbtns[i].classList.remove('on');
  }
  dpad.addEventListener('pointerup', dpadEnd);
  dpad.addEventListener('pointercancel', dpadEnd);
  dpad.addEventListener('click', function (e) { e.preventDefault(); });

  /* ---------- buttons ---------- */
  function onClick(id, fn) {
    $(id).addEventListener('click', function (e) {
      if (e.detail > 0) this.blur(); // pointer click: keep Space for the game
      fn(e);
    });
  }
  onClick('btnPlay', function () { startFromTitle(null); });
  onClick('btnResume', resume);
  onClick('btnRestart', newGame);
  onClick('btnPauseMenu', showTitle);
  onClick('btnAgain', function () { newGame(); });
  onClick('btnOverMenu', showTitle);
  onClick('btnMute', function () { Sound.toggle(); });
  onClick('menuMute', function () { Sound.toggle(); });
  onClick('btnPause', function () {
    if (state === 'playing' || state === 'ready' || state === 'paused') togglePause();
  });
  onClick('btnDpad', function () {
    settings.dpad = settings.dpad === 'on' ? 'off' : 'on';
    saveSettings();
    applyBodyClasses();
    updateTitleUI();
    layout();
  });
  Sound.onChange(function (m) { body.classList.toggle('muted', m); });

  var segs = document.querySelectorAll('[data-setting]');
  Array.prototype.forEach.call(segs, function (seg) {
    var key = seg.getAttribute('data-setting');
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn || !seg.contains(btn)) return;
      if (e.detail > 0) btn.blur();
      var val = btn.getAttribute('data-value');
      if (settings[key] === val) return;
      settings[key] = val;
      saveSettings();
      Sound.play('click');
      if (key === 'dpad') applyBodyClasses();
      if (state === 'title') showTitle(); else updateTitleUI();
    });
  });

  /* ---------- auto-pause ---------- */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && state === 'playing') pause();
  });
  window.addEventListener('blur', function () {
    if (state === 'playing') pause();
  });

  /* ---------- debug / test hook ---------- */
  window.__snake = {
    get state() { return state; },
    get score() { return game.score; },
    get shownScore() { return shownScore; },
    get length() { return game.snake.length; },
    get dir() { return game.dir; },
    get queue() { return game.queue.slice(); },
    get snake() { return game.snake.map(function (c) { return { x: c.x, y: c.y }; }); },
    get apples() { return game.apples.map(function (a) { return { x: a.x, y: a.y }; }); },
    get board() { return { cols: game.cols, rows: game.rows, cell: cellCss }; },
    get best() { return liveBest; },
    get stepMs() { return stepMs; },
    get settings() { return JSON.parse(JSON.stringify(settings)); },
    get steps() { return game.steps; },
    get game() { return game; },
    placeApple: function (x, y, i) {
      var a = game.apples[i || 0];
      if (!a || !game.isFree(x, y)) return false;
      a.x = x;
      a.y = y;
      a.born = performance.now();
      return true;
    }
  };

  /* ---------- boot ---------- */
  applyBodyClasses();
  showTitle();
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();
