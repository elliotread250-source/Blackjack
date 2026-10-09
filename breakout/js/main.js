/* Breakout: wiring. Screens, input (mouse / keyboard / touch), the fixed-step
 * loop, saved settings and the debug hook (window.__breakout). */
(function () {
  'use strict';
  const E = window.BreakoutEngine, R = window.BreakoutRender, S = window.BreakoutSound;
  const W = E.W;
  const TOUCH_GAIN = 1.25; // relative drag: paddle moves a bit further than the finger

  // ---------- storage (every access guarded: private mode / blocked storage) ----------
  const Store = {
    get: function (k, d) { try { const v = window.localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* ignore */ } },
  };
  const KEY_MUTE = 'breakout.muted', KEY_MODE = 'breakout.mode', KEY_MAXLVL = 'breakout.maxLevel';
  const bestKey = function (m) { return 'breakout.best.' + m; };
  const toInt = function (v) { const n = parseInt(v, 10); return isFinite(n) && n > 0 ? n : 0; };

  const $ = function (id) { return document.getElementById(id); };
  const body = document.body;
  const canvas = $('game');
  const overlay = $('overlay');
  R.init(canvas);

  const game = new E.Game();
  const demo = new E.Game();
  demo.debug.invincible = true;
  const demoAp = { launchDelay: 0.9 };
  const testAp = { launchDelay: 0.3 };

  let screen = 'title';
  let mode = Store.get(KEY_MODE, 'arcade') === 'classic' ? 'classic' : 'arcade';
  let maxLevel = E.clamp(toInt(Store.get(KEY_MAXLVL, '1')) || 1, 1, E.LEVELS.length);
  let startLevel = 1;
  const best = { arcade: toInt(Store.get(bestKey('arcade'), '0')), classic: toInt(Store.get(bestKey('classic'), '0')) };
  let touchMode = false;
  try { touchMode = window.matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer: fine)').matches); } catch (e) { touchMode = 'ontouchstart' in window; }
  let lay = { fx: 0, fy: 0, s: 1, H: 640 };
  let auto = false;
  let overDelay = -1;
  let endInfo = null;

  // ---------- layout ----------
  function readInsets() {
    const cs = getComputedStyle($('safe-probe'));
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }

  function layout() {
    const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    const ins = readInsets();
    const m = Math.min(vw, vh) < 520 ? 0 : 14;
    const aw = Math.max(50, vw - ins.l - ins.r - 2 * m), ah = Math.max(50, vh - ins.t - ins.b - 2 * m);
    // Tall screens get a taller playfield (more room between bricks and paddle);
    // the width is fixed so the brick grid never changes.
    const H = E.clamp(Math.round(W * ah / aw), E.MIN_H, E.MAX_H);
    const s = Math.min(aw / W, ah / H);
    const fx = ins.l + m + (aw - W * s) / 2, fy = ins.t + m + (ah - H * s) / 2;
    game.setHeight(H);
    demo.setHeight(H);
    lay = { fx, fy, s, H: game.H };

    const bs = Math.round(E.clamp(E.HUD_H * s * 0.74, 30, 44));
    document.documentElement.style.setProperty('--icon', bs + 'px');
    const hud = $('hud');
    hud.style.top = Math.round(fy + (E.HUD_H * s - bs) / 2) + 'px';
    hud.style.right = Math.round(vw - (fx + W * s) + 8 * s) + 'px';
    const fire = $('btn-fire');
    fire.style.right = Math.round(vw - (fx + W * s) + 18 * s) + 'px';
    fire.style.top = Math.round(fy + (game.paddleTop - 190) * s) + 'px';
    const hudReserve = (2 * bs + 8 + 8 * s + 10) / s;
    R.resize({ vw, vh, dpr, fx, fy, s, H: game.H, hudReserve });
  }

  // ---------- settings / UI ----------
  function setMuted(m) {
    S.setMuted(m);
    body.classList.toggle('muted', m);
    $('btn-mute').setAttribute('aria-label', m ? 'Unmute' : 'Mute');
    Store.set(KEY_MUTE, m ? '1' : '0');
  }
  function toggleMute() { setMuted(!S.isMuted()); }

  function setTouch(v) {
    if (v === touchMode) return;
    touchMode = v;
    body.classList.toggle('touch', v);
  }

  const MODE_DESC = {
    arcade: '12 hand-built levels with multi-hit and steel bricks and falling power-ups.',
    classic: 'The 1976 Atari rules: 8 rows, two walls, 3 balls. Break through and your paddle halves.',
  };

  function refreshTitle() {
    document.querySelectorAll('.seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    $('mode-desc').textContent = MODE_DESC[mode];
    $('title-best').textContent = 'Best ' + best[mode];
    const showLvl = mode === 'arcade' && maxLevel > 1;
    $('level-row').hidden = !showLvl;
    startLevel = E.clamp(startLevel, 1, maxLevel);
    $('lvl').textContent = String(startLevel);
    $('lvl-dn').disabled = startLevel <= 1;
    $('lvl-up').disabled = startLevel >= maxLevel;
  }
  function setMode(m) {
    mode = m === 'classic' ? 'classic' : 'arcade';
    Store.set(KEY_MODE, mode);
    refreshTitle();
  }
  function stepLevel(d) {
    startLevel = E.clamp(startLevel + d, 1, maxLevel);
    refreshTitle();
  }

  function show(name) {
    screen = name;
    body.dataset.screen = name;
    overlay.classList.toggle('hidden', name === 'play');
    overlay.classList.toggle('is-title', name === 'title');
    $('scr-title').hidden = name !== 'title';
    $('scr-pause').hidden = name !== 'paused';
    $('scr-over').hidden = name !== 'over';
    const a = document.activeElement;
    if (a && a !== body && a.blur) a.blur();
    if (name !== 'play') { keys.left = keys.right = false; game.input.keyDir = 0; game.input.fireHeld = false; drag = null; extra.clear(); }
    updateFireButton();
  }

  function saveBest() {
    const m = game.mode;
    if (game.score > best[m]) {
      best[m] = game.score;
      Store.set(bestKey(m), best[m]);
      return true;
    }
    return false;
  }

  function startGame() {
    S.unlock();
    if (screen === 'paused' || screen === 'over') saveBest();
    R.reset();
    game.input.targetX = null;
    game.input.keyDir = 0;
    game.input.fireHeld = false;
    game.newGame(mode, mode === 'arcade' ? startLevel : 1);
    handle(game.drain(), true);
    endInfo = null;
    overDelay = -1;
    acc = 0;
    show('play');
  }

  function pause() {
    if (screen !== 'play') return;
    show('paused');
  }
  function resume() {
    if (screen !== 'paused') return;
    acc = 0;
    last = performance.now();
    show('play');
  }
  function toTitle() {
    saveBest();
    R.reset();
    startDemo();
    refreshTitle();
    show('title');
  }

  function showOver() {
    const won = endInfo && endInfo.won;
    const isNew = saveBest() || (game.score > 0 && game.score === best[game.mode] && endInfo && endInfo.newBest);
    $('over-title').textContent = won ? 'You Win!' : 'Game Over';
    $('over-sub').textContent = game.mode === 'classic'
      ? (won ? 'Both walls cleared. A perfect 896?' : 'Classic mode')
      : (won ? 'All ' + E.LEVELS.length + ' levels cleared!' : 'Arcade mode');
    $('over-newbest').hidden = !isNew;
    const reached = game.mode === 'classic' ? 'Wall ' + game.wall : game.level + ' / ' + E.LEVELS.length;
    const stats = [
      ['big', 'Score', game.score],
      ['', game.mode === 'classic' ? 'Wall' : 'Level', reached],
      ['', 'Bricks', game.stats.bricks],
      ['', 'Best', best[game.mode]],
      ['', game.mode === 'classic' ? 'Balls' : 'Power-ups', game.mode === 'classic' ? '3' : game.stats.powerups],
    ];
    const box = $('over-stats');
    box.textContent = '';
    for (const st of stats) {
      const d = document.createElement('div');
      d.className = 'stat' + (st[0] ? ' ' + st[0] : '');
      const sp = document.createElement('span'); sp.textContent = st[1];
      const sv = document.createElement('strong'); sv.textContent = String(st[2]);
      d.appendChild(sp); d.appendChild(sv);
      box.appendChild(d);
    }
    show('over');
  }

  function startDemo() {
    demo.newGame('arcade', 1 + Math.floor(Math.random() * E.LEVELS.length));
    demo.drain();
    demo.introT = 0;
    R.introStart = -10;
  }

  // ---------- engine events -> sound + effects ----------
  function sfx(e) {
    switch (e.type) {
      case 'brick':
        if (e.destroyed) { S.brick(e.row); if (e.maxHp > 1) S.smash(); }
        else S.damage();
        break;
      case 'steel': S.steel(); break;
      case 'paddle': S.paddle(e.off); break;
      case 'wall': S.wall(); break;
      case 'launch': S.launch(); break;
      case 'laser': S.laser(); break;
      case 'powerup':
        if (e.kind === 'life') S.life(); else if (e.good) S.powerup(); else S.bad();
        break;
      case 'caught': S.catchBall(); break;
      case 'lifeLost':
        S.lifeLost();
        if (touchMode && navigator.vibrate) { try { navigator.vibrate(70); } catch (err) { /* ignore */ } }
        break;
      case 'levelClear': S.levelClear(); break;
      case 'speedUp': S.speedUp(); break;
      case 'shrinkClassic': S.shrink(); break;
      case 'gameOver': S.gameOver(); break;
      case 'win': S.win(); break;
    }
  }

  function handle(events, real) {
    for (const e of events) {
      R.event(e, real ? game : demo, touchMode);
      if (!real) continue;
      sfx(e);
      if (e.type === 'level' && game.mode === 'arcade' && e.level > maxLevel) {
        maxLevel = e.level;
        Store.set(KEY_MAXLVL, maxLevel);
      }
      if (e.type === 'gameOver' || e.type === 'win') {
        const newBest = game.score > best[game.mode];
        endInfo = { won: e.type === 'win', newBest };
        overDelay = e.type === 'win' ? 1.6 : 1.1;
      }
    }
  }

  // ---------- input ----------
  const keys = { left: false, right: false };
  let drag = null;           // the finger that steers the paddle
  const extra = new Set();   // any other fingers (fire)

  function updateKeyDir() {
    const d = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    game.input.keyDir = d;
    if (d) game.input.targetX = null;
  }
  function toLogicalX(cx) { return (cx - lay.fx) / lay.s; }
  function isUi(t) { return !!(t && t.closest && t.closest('button, a, .card, summary')); }

  window.addEventListener('pointerdown', function (e) {
    S.unlock();
    if (isUi(e.target)) return;
    if (e.pointerType === 'mouse') {
      setTouch(false);
      if (screen !== 'play') return;
      game.input.targetX = toLogicalX(e.clientX);
      if (e.button === 0) { game.input.action = true; game.input.fireHeld = true; }
      return;
    }
    setTouch(true);
    if (screen !== 'play') return;
    if (e.cancelable) e.preventDefault();
    if (!drag) {
      drag = { id: e.pointerId, lastX: e.clientX, t0: performance.now(), moved: 0 };
      game.input.targetX = game.paddle.x;
    } else {
      extra.add(e.pointerId);
      game.input.action = true;
      game.input.fireHeld = true;
    }
  }, { passive: false });

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse') {
      if (screen === 'play' && !keys.left && !keys.right) game.input.targetX = toLogicalX(e.clientX);
      return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    if (e.cancelable) e.preventDefault();
    const dx = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    drag.moved += Math.abs(dx);
    if (screen !== 'play') return;
    const half = game.paddle.w / 2;
    const from = game.input.targetX == null ? game.paddle.x : game.input.targetX;
    game.input.targetX = E.clamp(from + dx / lay.s * TOUCH_GAIN, E.WALL + half, W - E.WALL - half);
  }, { passive: false });

  function endPointer(e) {
    if (e.pointerType === 'mouse') { game.input.fireHeld = false; return; }
    if (drag && e.pointerId === drag.id) {
      const quick = performance.now() - drag.t0 < 320 && drag.moved < 14;
      if (e.type === 'pointerup' && quick && screen === 'play') game.input.action = true;
      drag = null;
      return;
    }
    if (extra.delete(e.pointerId) && extra.size === 0) game.input.fireHeld = false;
  }
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);

  // stop iOS from scrolling/zooming the page under the game
  document.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.card')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { if (screen === 'play') e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    S.unlock();
    const k = e.code || e.key;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (k) {
      case 'ArrowLeft': case 'KeyA':
        if (screen === 'title') { if (k === 'ArrowLeft') { setMode('arcade'); e.preventDefault(); } break; }
        keys.left = true; updateKeyDir(); e.preventDefault(); break;
      case 'ArrowRight': case 'KeyD':
        if (screen === 'title') { if (k === 'ArrowRight') { setMode('classic'); e.preventDefault(); } break; }
        keys.right = true; updateKeyDir(); e.preventDefault(); break;
      case 'ArrowUp': case 'ArrowDown':
        if (screen === 'title') { e.preventDefault(); if (mode === 'arcade') stepLevel(k === 'ArrowUp' ? 1 : -1); break; }
        if (k === 'ArrowDown') { e.preventDefault(); break; }
        // fall through: Up launches like Space
      case 'Space': case 'KeyW':
        if (screen === 'play') {
          e.preventDefault();
          if (!e.repeat) game.input.action = true;
          game.input.fireHeld = true;
        }
        break;
      case 'KeyP': case 'Escape':
        if (screen === 'play') pause();
        else if (screen === 'paused') resume();
        else if (screen === 'over' && k === 'Escape') toTitle();
        e.preventDefault();
        break;
      case 'KeyM':
        if (!e.repeat) toggleMute();
        break;
      case 'Enter': case 'NumpadEnter':
        if (e.target && e.target.tagName === 'SUMMARY') break;
        e.preventDefault();
        if (e.repeat) break;
        if (screen === 'title' || screen === 'over') startGame();
        else if (screen === 'paused') resume();
        break;
    }
  });
  window.addEventListener('keyup', function (e) {
    const k = e.code || e.key;
    if (k === 'ArrowLeft' || k === 'KeyA') { keys.left = false; updateKeyDir(); }
    if (k === 'ArrowRight' || k === 'KeyD') { keys.right = false; updateKeyDir(); }
    if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
      game.input.fireHeld = false;
      if (screen === 'play') e.preventDefault();
    }
  });

  window.addEventListener('blur', function () {
    keys.left = keys.right = false;
    updateKeyDir();
    game.input.fireHeld = false;
    pause();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pause(); saveBest(); }
  });
  window.addEventListener('pagehide', saveBest);

  // ---------- buttons ----------
  function onTap(id, fn) {
    $(id).addEventListener('click', function (e) { e.preventDefault(); S.unlock(); fn(); });
  }
  onTap('btn-start', startGame);
  onTap('btn-again', startGame);
  onTap('btn-resume', resume);
  onTap('btn-restart', startGame);
  onTap('btn-menu', toTitle);
  onTap('btn-over-menu', toTitle);
  onTap('btn-pause', function () { if (screen === 'play') pause(); else resume(); });
  onTap('btn-mute', toggleMute);
  onTap('lvl-dn', function () { stepLevel(-1); });
  onTap('lvl-up', function () { stepLevel(1); });
  document.querySelectorAll('.seg button').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.mode); });
  });
  // keep HUD buttons from also launching the ball
  ['btn-pause', 'btn-mute'].forEach(function (id) {
    $(id).addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  });
  const fireBtn = $('btn-fire');
  fireBtn.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    S.unlock();
    if (screen !== 'play') return;
    game.input.action = true;
    game.input.fireHeld = true;
    fireBtn.classList.add('on');
    try { fireBtn.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });
  function fireUp() { game.input.fireHeld = false; fireBtn.classList.remove('on'); }
  fireBtn.addEventListener('pointerup', fireUp);
  fireBtn.addEventListener('pointercancel', fireUp);
  fireBtn.addEventListener('lostpointercapture', fireUp);

  let fireShown = false;
  function updateFireButton() {
    const on = screen === 'play' && game.fx.laser > 0;
    if (on !== fireShown) { fireShown = on; body.classList.toggle('laser-on', on); if (!on) fireUp(); }
  }

  // ---------- main loop ----------
  let last = performance.now(), acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1; // after a stall, slow down rather than jump
    let g = game;
    let alpha = 1;
    if (screen === 'play') {
      acc += dt;
      let n = 0;
      while (acc >= E.STEP && n < 40) {
        if (auto) E.autopilot(game, testAp);
        game.step();
        acc -= E.STEP;
        n++;
      }
      handle(game.drain(), true);
      alpha = acc / E.STEP;
      if (overDelay >= 0) { overDelay -= dt; if (overDelay < 0) showOver(); }
      updateFireButton();
    } else if (screen === 'title') {
      g = demo;
      acc += dt;
      let n = 0;
      while (acc >= E.STEP && n < 40) { E.autopilot(demo, demoAp); demo.step(); acc -= E.STEP; n++; }
      handle(demo.drain(), false);
      alpha = acc / E.STEP;
      if (demo.state === 'won' || demo.state === 'over') startDemo();
    } else {
      acc = 0;
    }
    R.update(screen === 'paused' ? 0 : dt);
    R.draw(g, alpha, { best: best[game.mode], touch: touchMode, demo: screen === 'title', dim: screen === 'title' ? 0.3 : 0 });
  }

  // ---------- debug / test hook ----------
  window.__breakout = {
    E, R, S, game, demo,
    get screen() { return screen; },
    get layout() { return lay; },
    get best() { return Object.assign({}, best); },
    start: function (m, lvl) { if (m) setMode(m); if (lvl) { maxLevel = Math.max(maxLevel, lvl); startLevel = lvl; } startGame(); },
    steps: function (n) { for (let i = 0; i < (n || 1); i++) { if (auto) E.autopilot(game, testAp); game.step(); } handle(game.drain(), true); },
    clearLevel: function () { game.clearLevel(); },
    spawnPowerup: function (kind, x) { game.spawnCapsule(kind, x == null ? game.paddle.x : x, game.paddleTop - 40); },
    loseBall: function () { for (const b of game.balls) { b.stuck = false; b.y = game.H + 40; b.vy = Math.abs(b.vy) || 300; } },
    autoplay: function (on) { auto = !!on; },
    pause, resume, toTitle,
  };

  // ---------- boot ----------
  body.classList.toggle('touch', touchMode);
  setMuted(Store.get(KEY_MUTE, '0') === '1');
  refreshTitle();
  layout();
  startDemo();
  show('title');
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 150); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  requestAnimationFrame(function (t) { last = t; frame(t); });
})();
