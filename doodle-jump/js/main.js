/* Doodle Jump - screens, input (keys, touch, tilt), layout and the main loop. */
(function () {
  'use strict';
  var C = window.DJCore, R = window.DJRender, A = window.DJAudio, W = C.W;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var arcade = document.getElementById('arcade');
  var STEP = 1 / 60;

  // ---- storage (every access guarded: private mode, blocked storage...) ----------------
  var PREFIX = 'doodlejump.';
  function load(k, d) {
    try { var v = window.localStorage.getItem(PREFIX + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
  }
  function save(k, v) { try { window.localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  var store = {
    best: Math.max(0, Math.floor(+load('best', 0) || 0)),
    muted: !!load('muted', false),
    steer: load('steer', null),          // 'tilt' | 'touch' | null (not chosen yet)
    sens: clampInt(load('sens', 1), 0, 2),
    tiltAsked: !!load('tiltAsked', false)
  };
  function clampInt(v, a, b) { v = Math.round(+v); return isNaN(v) ? a : Math.max(a, Math.min(b, v)); }
  A.setMuted(store.muted);

  // ---- device capabilities ----------------------------------------------------------------
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var DOE = window.DeviceOrientationEvent;
  var needsPermission = !!(DOE && typeof DOE.requestPermission === 'function');
  var tilt = { seen: false, raw: 0, filt: 0, zero: 0, lastT: 0, granted: !needsPermission, denied: false, waitT: 0 };

  // ---- state -------------------------------------------------------------------------------------
  var H = 640, scale = 1, dpr = 1, rect = { left: 0, top: 0 };
  var screen = 'menu';      // menu | play | paused | over
  var overlay = null;       // null | 'settings' | 'tiltAsk'
  var g = null;
  var acc = 0, last = 0, alpha = 1;
  var menuTick = 0, overT = 0, hintT = 0, hintMsg = '', newBest = false, toastT = 0, toastMsg = '';
  var steerMode = isTouch ? 'touch' : 'keys';
  var keys = { left: false, right: false };
  var shootQ = 0;
  var touches = {}, touchSeq = 0;
  var hoverId = null, pressed = null;
  var buttons = [];

  // ---- layout ------------------------------------------------------------------------------------
  function resize() {
    var vw = window.innerWidth, vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (vw / vh <= 400 / 600) {
      scale = vw / W; H = Math.round(vh / scale);
      if (H > 900) { H = 900; scale = Math.min(vw / W, vh / 900); }
    } else {
      H = 640; scale = vh / H;
      if (W * scale > vw) scale = vw / W;
    }
    var cw = W * scale, ch = H * scale;
    var left = Math.round((vw - cw) / 2), top = Math.round((vh - ch) / 2);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.style.left = left + 'px'; canvas.style.top = top + 'px';
    canvas.width = Math.max(1, Math.round(cw * dpr)); canvas.height = Math.max(1, Math.round(ch * dpr));
    rect = { left: left, top: top };
    arcade.style.left = (left + 8) + 'px';
    arcade.style.top = (top + 8) + 'px';
    document.body.classList.toggle('framed', cw < vw - 2);
    if (g) C.setViewH(g, H);
  }
  function toLogical(cx, cy) { return { x: (cx - rect.left) / scale, y: (cy - rect.top) / scale }; }

  // ---- tilt ----------------------------------------------------------------------------------------
  function screenAngle() {
    var a = 0;
    try {
      if (window.screen && window.screen.orientation && typeof window.screen.orientation.angle === 'number') a = window.screen.orientation.angle;
      else if (typeof window.orientation === 'number') a = window.orientation;
    } catch (e) { a = 0; }
    return ((a % 360) + 360) % 360;
  }
  window.addEventListener('deviceorientation', function (e) {
    if (e.gamma == null && e.beta == null) return;
    var ang = screenAngle(), v;
    if (ang === 90) v = e.beta; else if (ang === 270) v = -e.beta; else if (ang === 180) v = -e.gamma; else v = e.gamma;
    if (v == null || isNaN(v)) return;
    if (!tilt.seen) tilt.filt = v;
    tilt.seen = true; tilt.raw = v;
    tilt.filt += (v - tilt.filt) * 0.5;
    tilt.lastT = performance.now();
  });
  function tiltAxis() {
    var range = [28, 20, 13][store.sens];
    var a = (tilt.filt - tilt.zero) / range;
    if (Math.abs(a) < 0.06) return 0;
    return Math.max(-1, Math.min(1, a));
  }
  function calibrate() { tilt.zero = tilt.seen ? Math.max(-30, Math.min(30, tilt.filt)) : 0; }
  function tiltUsable() { return tilt.seen || (needsPermission && tilt.granted); }
  function resolveSteer() {
    if (!isTouch) return 'keys';
    if (store.steer === 'touch') return 'touch';
    if (store.steer === 'tilt') return tiltUsable() ? 'tilt' : 'touch';
    return (tilt.seen && !needsPermission) ? 'tilt' : 'touch';
  }
  function requestTilt(done) {
    if (!needsPermission) { done(tilt.seen); return; }
    try {
      DOE.requestPermission().then(function (r) {
        tilt.granted = r === 'granted'; tilt.denied = !tilt.granted; done(tilt.granted);
      }).catch(function () { tilt.denied = true; done(false); });
    } catch (e) { tilt.denied = true; done(false); }
  }

  // ---- game flow ---------------------------------------------------------------------------------
  function setScreen(s) {
    screen = s;
    document.body.classList.toggle('show-arcade', (s === 'menu' || s === 'over') && !overlay);
    canvas.style.cursor = 'default';
  }
  function setOverlay(o) { overlay = o; setScreen(screen); pressed = null; }

  function startGame() {
    if (isTouch && needsPermission && !store.steer && !store.tiltAsked) { setOverlay('tiltAsk'); return; }
    begin();
  }
  function begin(opts) {
    opts = opts || {};
    steerMode = resolveSteer();
    var seed = opts.seed != null ? opts.seed : (Math.random() * 4294967296) >>> 0;
    g = C.createGame({ seed: seed, viewH: H, best: store.best, diffOffset: opts.diffOffset || 0 });
    overlay = null;
    setScreen('play');
    acc = 0; newBest = false; shootQ = 0; touches = {};
    R.clearFx(); A.stopLoops();
    calibrate();
    tilt.waitT = 0;
    hintT = 200;
    hintMsg = steerMode === 'tilt' ? 'tilt to steer · tap to shoot'
      : steerMode === 'touch' ? 'hold left / right to steer · tap up top to shoot'
      : '← → to move · space to shoot';
  }
  function gameOver() {
    setScreen('over');
    overT = 0;
    A.stopLoops();
    if (g.score > store.best) { store.best = g.score; newBest = true; save('best', store.best); }
  }
  function pause() {
    if (screen !== 'play') return;
    setScreen('paused'); A.stopLoops(); keys.left = keys.right = false; touches = {};
  }
  function resume() {
    if (screen !== 'paused') return;
    setOverlay(null); setScreen('play'); last = performance.now(); acc = 0;
    if (g && g.player.fly) A.play(g.player.fly.kind, g.player.fly.t / 60);
  }
  function toMenu() { setOverlay(null); setScreen('menu'); A.stopLoops(); g = null; }
  function toggleMute() {
    store.muted = !store.muted; save('muted', store.muted); A.setMuted(store.muted);
    if (!store.muted) { A.unlock(); A.play('click'); if (g && screen === 'play' && g.player.fly) A.play(g.player.fly.kind, g.player.fly.t / 60); }
  }
  function toast(msg) { toastMsg = msg; toastT = 150; }

  function activate(id) {
    A.unlock();
    if (id !== 'mute' && id !== 'soundOn' && id !== 'soundOff') A.play('click');
    switch (id) {
      case 'play': case 'again': startGame(); break;
      case 'menu': toMenu(); break;
      case 'pause': pause(); break;
      case 'resume': resume(); break;
      case 'mute': toggleMute(); break;
      case 'settings': setOverlay('settings'); break;
      case 'done': setOverlay(null); if (g && screen === 'paused') steerMode = resolveSteer(); break;
      case 'soundOn': if (store.muted) toggleMute(); break;
      case 'soundOff': if (!store.muted) toggleMute(); break;
      case 'steerTouch': store.steer = 'touch'; save('steer', 'touch'); if (g) steerMode = resolveSteer(); break;
      case 'steerTilt':
        requestTilt(function (ok) {
          store.tiltAsked = true; save('tiltAsked', true);
          if (ok || tilt.seen) { store.steer = 'tilt'; save('steer', 'tilt'); calibrate(); }
          else toast('tilt not available');
          if (g) steerMode = resolveSteer();
        });
        break;
      case 'sens0': case 'sens1': case 'sens2': store.sens = +id.slice(4); save('sens', store.sens); break;
      case 'calibrate': calibrate(); toast('level set'); break;
      case 'useTilt':
        requestTilt(function (ok) {
          store.tiltAsked = true; save('tiltAsked', true);
          store.steer = ok ? 'tilt' : 'touch'; save('steer', store.steer);
          if (!ok) toast('motion not allowed: touch controls on');
          begin();
        });
        break;
      case 'useTouch':
        store.tiltAsked = true; save('tiltAsked', true);
        store.steer = 'touch'; save('steer', 'touch');
        begin();
        break;
    }
  }

  // ---- UI layout per screen --------------------------------------------------------------------
  function btn(id, x, y, w, h, label, o) {
    var b = { id: id, x: x, y: y, w: w, h: h, label: label, seed: id.length * 31 + x };
    if (o) for (var k in o) b[k] = o[k];
    buttons.push(b);
    return b;
  }
  function panelRect() {
    if (overlay === 'settings') { var sh = isTouch ? 430 : 350; return { x: 26, y: Math.round(H / 2 - sh / 2), w: W - 52, h: sh }; }
    if (overlay === 'tiltAsk') return { x: 30, y: Math.round(H / 2 - 170), w: W - 60, h: 330 };
    if (screen === 'paused') return { x: 60, y: Math.round(H / 2 - 160), w: W - 120, h: 320 };
    if (screen === 'over') {
      var ty = Math.round(H / 2 - 190), e = Math.min(1, overT / 32), k = 1 - Math.pow(1 - e, 3);
      return { x: 30, y: Math.round(H + 20 + (ty - H - 20) * k), w: W - 60, h: 360 };
    }
    return null;
  }
  function buildUI() {
    buttons = [];
    var pr = panelRect();
    if (overlay === 'settings') {
      var y = pr.y + 70, x0 = pr.x + 34, bw;
      if (isTouch) {
        var tiltOk = tiltUsable() || needsPermission;
        btn('steerTilt', x0 + 98, y, 92, 40, 'tilt', { on: store.steer === 'tilt' && tiltUsable(), disabled: !tiltOk, size: 19 });
        btn('steerTouch', x0 + 196, y, 92, 40, 'touch', { on: !(store.steer === 'tilt' && tiltUsable()), size: 19 });
        y += 74;
        bw = 60;
        var sOn = store.steer === 'tilt' && tiltUsable();
        btn('sens0', x0 + 98, y, bw, 38, 'low', { on: store.sens === 0, disabled: !sOn, size: 16 });
        btn('sens1', x0 + 98 + 64, y, bw, 38, 'mid', { on: store.sens === 1, disabled: !sOn, size: 16 });
        btn('sens2', x0 + 98 + 128, y, bw, 38, 'high', { on: store.sens === 2, disabled: !sOn, size: 16 });
        y += 54;
        btn('calibrate', x0 + 98, y, 188, 38, 'set level now', { disabled: !sOn, size: 16 });
        y += 70;
      }
      btn('soundOn', x0 + 98, y, 92, 40, 'on', { on: !store.muted, size: 19 });
      btn('soundOff', x0 + 196, y, 92, 40, 'off', { on: store.muted, size: 19 });
      btn('done', W / 2 - 70, pr.y + pr.h - 66, 140, 46, 'done', { style: 'primary' });
    } else if (overlay === 'tiltAsk') {
      btn('useTilt', W / 2 - 100, pr.y + pr.h - 128, 200, 50, 'use tilt', { style: 'primary' });
      btn('useTouch', W / 2 - 100, pr.y + pr.h - 66, 200, 44, 'touch controls', { size: 19 });
    } else if (screen === 'menu') {
      btn('play', W / 2 - 80, Math.round(H * 0.40), 160, 58, 'play', { style: 'primary', size: 28 });
      btn('settings', W / 2 - 64, H - 74, 54, 50, '', { icon: 'gear' });
      btn('mute', W / 2 + 10, H - 74, 54, 50, '', { icon: 'sound', muted: store.muted });
    } else if (screen === 'paused') {
      btn('resume', W / 2 - 80, pr.y + 92, 160, 50, 'resume', { style: 'primary' });
      btn('settings', W / 2 - 80, pr.y + 156, 160, 44, 'settings', { size: 20 });
      btn('menu', W / 2 - 80, pr.y + 214, 160, 44, 'menu', { size: 20 });
    } else if (screen === 'over') {
      var ready = overT > 30;
      btn('again', W / 2 - 150, pr.y + pr.h - 74, 160, 52, 'play again', { style: 'primary', disabled: !ready, size: 22 });
      btn('menu', W / 2 + 22, pr.y + pr.h - 74, 128, 52, 'menu', { disabled: !ready, size: 22 });
    }
    if (screen === 'play' && !overlay) {
      btn('pause', W - 50, 0, 50, 44, '', { hidden: true });
      btn('mute', W - 92, 0, 42, 44, '', { hidden: true });
    }
    for (var i = 0; i < buttons.length; i++) buttons[i].pressed = pressed && pressed.id === buttons[i].id;
  }
  function hitButton(pt) {
    for (var i = buttons.length - 1; i >= 0; i--) {
      var b = buttons[i];
      if (b.disabled) continue;
      var pad = isTouch ? 6 : 0;
      if (pt.x >= b.x - pad && pt.x <= b.x + b.w + pad && pt.y >= b.y - pad && pt.y <= b.y + b.h + pad) return b;
    }
    return null;
  }

  // ---- pointer input --------------------------------------------------------------------------------
  function steeringTouch() {
    var best = null;
    for (var k in touches) { var t = touches[k]; if (t.role === 'steer' && (!best || t.seq > best.seq)) best = t; }
    return best;
  }
  function down(id, cx, cy, isTouchPt) {
    A.unlock();
    var pt = toLogical(cx, cy);
    buildUI();
    var b = hitButton(pt);
    if (b) { touches[id] = { role: 'ui', seq: ++touchSeq }; pressed = { id: b.id, ptr: id }; return; }
    if (screen === 'play' && !overlay) {
      if (!isTouchPt || steerMode === 'tilt' || steerMode === 'keys') { shootQ = Math.min(shootQ + 1, 2); touches[id] = { role: 'shoot' }; return; }
      if (pt.y < H * 0.28 || steeringTouch()) { shootQ = Math.min(shootQ + 1, 2); touches[id] = { role: 'shoot' }; return; }
      touches[id] = { role: 'steer', side: cx < window.innerWidth / 2 ? -1 : 1, seq: ++touchSeq };
    }
  }
  function move(id, cx, cy) {
    var t = touches[id];
    if (t && t.role === 'steer') t.side = cx < window.innerWidth / 2 ? -1 : 1;
  }
  function up(id, cx, cy, cancel) {
    var t = touches[id];
    delete touches[id];
    if (t && t.role === 'ui' && pressed && pressed.ptr === id) {
      var pid = pressed.id;
      pressed = null;
      if (cancel) return;
      buildUI();
      var b = hitButton(toLogical(cx, cy));
      if (b && b.id === pid) activate(pid);
    }
  }
  var lastTouchT = -1e9;
  document.addEventListener('touchstart', function (e) {
    if (e.target === arcade) return;
    e.preventDefault();
    lastTouchT = performance.now();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; down('t' + t.identifier, t.clientX, t.clientY, true); }
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    e.preventDefault();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; move('t' + t.identifier, t.clientX, t.clientY); }
  }, { passive: false });
  function touchEnd(e, cancel) {
    if (e.target === arcade) return;
    lastTouchT = performance.now();
    for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; up('t' + t.identifier, t.clientX, t.clientY, cancel); }
  }
  document.addEventListener('touchend', function (e) { touchEnd(e, false); }, { passive: false });
  document.addEventListener('touchcancel', function (e) { touchEnd(e, true); }, { passive: false });

  function fromTouch() { return performance.now() - lastTouchT < 800; }
  document.addEventListener('mousedown', function (e) {
    if (fromTouch() || e.button !== 0 || e.target === arcade) return;
    down('m', e.clientX, e.clientY, false);
  });
  document.addEventListener('mousemove', function (e) {
    if (fromTouch()) return;
    var b = hitButton(toLogical(e.clientX, e.clientY));
    hoverId = b ? b.id : null;
    canvas.style.cursor = b ? 'pointer' : 'default';
  });
  document.addEventListener('mouseup', function (e) {
    if (fromTouch() || e.button !== 0) return;
    up('m', e.clientX, e.clientY, false);
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  // ---- keyboard -----------------------------------------------------------------------------------
  document.addEventListener('keydown', function (e) {
    var k = e.code || e.key, handled = true;
    A.unlock();
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = true;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = true;
    else if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === ' ') {
      if (screen === 'play' && !overlay) { if (!e.repeat) shootQ = Math.min(shootQ + 1, 2); }
      else if (!e.repeat && screen === 'menu' && !overlay && (k === 'Space' || k === ' ')) startGame();
      else if (!e.repeat && screen === 'over' && overT > 30 && (k === 'Space' || k === ' ')) startGame();
    }
    else if (k === 'Enter' || k === 'NumpadEnter') {
      if (e.repeat) return;
      if (overlay === 'settings') setOverlay(null);
      else if (screen === 'menu' && !overlay) startGame();
      else if (screen === 'over' && overT > 30) startGame();
      else if (screen === 'paused') resume();
    }
    else if (k === 'KeyP' || k === 'Escape') {
      if (e.repeat) return;
      if (overlay === 'settings') setOverlay(null);
      else if (screen === 'play') pause();
      else if (screen === 'paused') resume();
    }
    else if (k === 'KeyM') { if (!e.repeat) toggleMute(); }
    else handled = false;
    if (handled) e.preventDefault();
  });
  document.addEventListener('keyup', function (e) {
    var k = e.code || e.key;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.left = false;
    if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
  });
  window.addEventListener('blur', function () { keys.left = keys.right = false; touches = {}; });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pause(); A.suspend(); }
    else { A.resume(); last = performance.now(); }
  });
  window.addEventListener('pagehide', function () { pause(); });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });

  // ---- simulation --------------------------------------------------------------------------------
  var SOUND_FOR = {
    jump: 1, spring: 1, trampoline: 1, monster: 1, ufo: 1, hole: 1, stomp: 1, shoot: 1, hit: 1, kill: 1,
    break: 1, vanish: 1, fall: 1, hurt: 1, suck: 1, abduct: 1, best: 1, flyEnd: 1
  };
  function tick() {
    var st = steeringTouch();
    var inp = {
      left: keys.left || (st && st.side < 0) || false,
      right: keys.right || (st && st.side > 0) || false,
      axis: null,
      shoot: shootQ > 0 && screen === 'play'
    };
    if (shootQ > 0) shootQ--;
    if (steerMode === 'tilt' && !inp.left && !inp.right) {
      inp.axis = tiltAxis();
      if (!tilt.seen && ++tilt.waitT > 150) {
        steerMode = 'touch';
        toast('no tilt detected: touch to steer');
      }
    }
    if (screen !== 'play') { inp = {}; }
    else if (typeof window.__djInput === 'function') inp = window.__djInput(g, inp) || inp;
    C.step(g, inp);
    for (var i = 0; i < g.events.length; i++) {
      var e = g.events[i];
      R.onEvent(e, g);
      if (e.type === 'propeller') A.play('propeller', C.P.PROP_T / 60);
      else if (e.type === 'jetpack') A.play('jetpack', C.P.JET_T / 60);
      else if (SOUND_FOR[e.type]) A.play(e.type);
    }
    R.stepFx(g);
    if (hintT > 0) hintT--;
    if (g.over && screen === 'play') gameOver();
  }

  // ---- drawing ------------------------------------------------------------------------------------
  function drawMenu() {
    R.drawPaper(ctx, H, 0);
    var t = menuTick;
    // decorative scene: the doodler bouncing, a monster on a ledge, a bat flapping about
    var ly = Math.round(H * 0.74);
    R.drawPlatform(ctx, { id: 901, kind: 'normal' }, 322, ly, t);
    R.drawMonster(ctx, { id: 950, kind: 'blob', phase: 0, hitT: 0, hp: 1, x: 322 }, 322, ly - 21, t, 80);
    R.drawPlatform(ctx, { id: 902, kind: 'breaking' }, 214, Math.round(H * 0.64), t);
    R.drawMonster(ctx, { id: 951, kind: 'bat', phase: 0, hitT: 0, hp: 1, x: 330 }, 330 + Math.sin(t * 0.03) * 20, Math.round(H * 0.55) + Math.sin(t * 0.08) * 6, t);
    var py = ly, period = 65, k = t % period;
    var off = Math.max(0, 13 * k - 0.2 * k * k);
    R.drawPlatform(ctx, { id: 970, kind: 'normal' }, 80, py, t);
    R.drawDoodler(ctx, 80, py - off, { face: 1, t: t, squash: k < 7 ? Math.sin(k / 7 * Math.PI) : 0, shoot: (Math.floor(t / period) % 4) === 3 && k > 20 && k < 40 });
    R.drawTitle(ctx, W / 2 - 10, Math.round(H * 0.17), 64);
    // best
    if (store.best > 0) R.text(ctx, 'best: ' + store.best, W / 2, Math.round(H * 0.40) + 92, 20, '#555');
    // controls hint
    var hint = isTouch ? (resolveSteer() === 'tilt' || (needsPermission && !store.tiltAsked) ? 'tilt or touch to steer · tap to shoot' : 'hold left / right to steer · tap the top to shoot')
      : '← → move · space shoot · P pause · M mute';
    R.wrapText(ctx, hint, W / 2, H - 92, W - 40, 19, 15, '#6a6252');
  }

  function dim() { ctx.fillStyle = 'rgba(40,30,10,0.28)'; ctx.fillRect(0, 0, W, H); }

  function drawOverlayPanels() {
    var pr = panelRect();
    if (!pr) return;
    if (overlay || screen === 'paused') dim();
    R.drawPanel(ctx, pr.x, pr.y, pr.w, pr.h, overlay === 'settings' ? 41 : screen === 'over' ? 17 : 29);
    var cx = W / 2;
    if (overlay === 'settings') {
      R.text(ctx, 'settings', cx, pr.y + 46, 30, '#d8402f');
      var y = pr.y + 70, x0 = pr.x + 34;
      if (isTouch) {
        R.text(ctx, 'steering', x0 + 90, y + 27, 18, R.INK, 'right');
        var note = !(tiltUsable() || needsPermission) ? 'no tilt sensor found' : tilt.denied ? 'motion access was denied' : '';
        if (note) R.text(ctx, note, x0 + 196, y + 56, 13, '#8a7f6a', 'center', false);
        y += 74;
        R.text(ctx, 'tilt feel', x0 + 90, y + 25, 18, R.INK, 'right');
        y += 54 + 70;
      }
      R.text(ctx, 'sound', x0 + 90, y + 27, 18, R.INK, 'right');
      if (!isTouch) R.wrapText(ctx, '← → / A D move · space, ↑ or click shoot · P / Esc pause · M mute', cx, y + 78, pr.w - 60, 20, 15, '#6a6252');
    } else if (overlay === 'tiltAsk') {
      R.text(ctx, 'tilt to steer?', cx, pr.y + 50, 30, '#d8402f');
      R.wrapText(ctx, 'Tilt your phone left and right to move, like the original. You can switch any time in settings.', cx, pr.y + 92, pr.w - 60, 22, 17, '#4a4436');
    } else if (screen === 'paused') {
      R.text(ctx, 'paused', cx, pr.y + 58, 34, '#d8402f');
    } else if (screen === 'over') {
      R.text(ctx, 'game over!', cx, pr.y + 62, 42, '#d8402f');
      R.text(ctx, 'your score: ' + g.score, cx, pr.y + 128, 24, R.INK);
      R.text(ctx, 'your high score: ' + store.best, cx, pr.y + 168, 20, '#555');
      if (newBest) {
        ctx.save();
        ctx.translate(cx + 4, pr.y + 222); ctx.rotate(-0.08);
        ctx.strokeStyle = '#d8402f'; ctx.lineWidth = 2.5;
        ctx.strokeRect(-92, -22, 184, 36);
        R.text(ctx, 'new high score!', 0, 4, 20, '#d8402f');
        ctx.restore();
      } else {
        var s = g.stats;
        R.text(ctx, s.kills + (s.kills === 1 ? ' monster' : ' monsters') + ' · ' + s.jumps + ' jumps', cx, pr.y + 216, 15, '#8a7f6a', 'center', false);
      }
    }
  }

  function drawHint() {
    if (screen !== 'play') return;
    var msg = null, a = 0;
    if (toastT > 0) { msg = toastMsg; a = Math.min(1, toastT / 30); }
    else if (hintT > 0) { msg = hintMsg; a = Math.min(1, hintT / 40); }
    if (!msg) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = R.font(17, true);
    var w = ctx.measureText(msg).width + 28, y = Math.round(H * 0.6);
    R.drawPanel(ctx, W / 2 - w / 2, y - 26, w, 40, 3);
    R.text(ctx, msg, W / 2, y + 1, 17, R.INK);
    ctx.restore();
  }

  function render() {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if (screen === 'menu' || !g) drawMenu();
    else {
      R.drawWorld(ctx, g, screen === 'play' ? alpha : 1, H);
      if (screen !== 'over') R.drawHUD(ctx, g, store.muted);
      drawHint();
    }
    buildUI();
    drawOverlayPanels();
    for (var i = 0; i < buttons.length; i++) R.drawButton(ctx, buttons[i], hoverId === buttons[i].id);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 20) {
      acc -= STEP; n++;
      menuTick++;
      if (toastT > 0) toastT--;
      if (g && (screen === 'play' || screen === 'over') && !overlay) {
        tick();
        if (screen === 'over') overT++;
      }
    }
    if (n >= 20) acc = 0;
    alpha = acc / STEP;
    render();
  }

  // debug/test hook (read-mostly; used by the automated browser tests)
  window.__dj = {
    get g() { return g; }, get screen() { return screen; }, get overlay() { return overlay; },
    get steerMode() { return steerMode; }, get H() { return H; }, get store() { return store; },
    get tilt() { return tilt; }, get buttons() { buildUI(); return buttons.map(function (b) { return { id: b.id, x: b.x, y: b.y, w: b.w, h: b.h, disabled: !!b.disabled }; }); },
    toScreen: function (x, y) { return { x: rect.left + x * scale, y: rect.top + y * scale }; },
    audio: function () { return A.state(); },
    debugStart: function (opts) { begin(opts); }
  };

  resize();
  setScreen('menu');
  last = performance.now();
  requestAnimationFrame(frame);
})();
