/* Drift Boss - main: input, fixed-step loop, camera, screens, garage, storage. */
(function () {
  'use strict';

  const L = window.DriftLogic, R = window.DriftRender, S = window.DriftSound, Cars = window.DriftCars;
  const CFG = L.CFG, FX = R.FX;
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = 'driftboss.save.v1';

  /* ---------------------------------------------------------------- storage */
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return L.sanitizeSave(raw ? JSON.parse(raw) : null);
    } catch (e) { return L.defaultSave(); }
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* private mode etc. */ }
  }
  const save = load();
  S.muted = save.muted;

  /* ----------------------------------------------------------------- canvas */
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1;

  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const v = R.view;
    v.W = W; v.H = H;
    v.s = Math.min(W / 6.3, H / 9.2);
    v.ox = W / 2; v.oy = H / 2;
    if (mode === 'garage') sizePreviews();
  }

  /* ------------------------------------------------------------------ state */
  let mode = 'title';          // title | play | over | garage
  let garageFrom = 'title';
  let paused = false;
  let game = null;
  let model = Cars.get(save.selected);
  const cam = { x: 0, y: 0, px: 0, py: 0, frozen: false };
  let shake = 0, simTime = 0;
  let reviveT = 0, reviveOpen = false;
  let tutor = null, tutorCorners = 0;
  let runStartCoins = 0;
  let overAt = 0;
  let lastPrompt = '';

  function carFrac() { return 0.7; }

  function camTarget(snap) {
    const v = R.view, c = game.car;
    const kx = Math.max(0.1, Math.min(0.35, (W / v.s - 6.3) / 6));
    const tx = R.unitX(c.x, c.y) * kx;
    const lead = snap ? 0 : (c.v * R.C2) / 7;
    const ty = R.unitY(c.x, c.y, 0) - (carFrac() - 0.5) * H / v.s - lead;
    return [tx, ty];
  }

  function snapCamera() {
    const t = camTarget(true);
    cam.x = cam.px = t[0]; cam.y = cam.py = t[1]; cam.frozen = false;
  }

  function newGame() {
    game = new L.Game({});
    FX.reset();
    model = Cars.get(save.selected);
    snapCamera();
    tutor = null;
  }

  /* ------------------------------------------------------------------ input */
  const pointers = new Set();
  let keyDown = false;

  function isHeld() { return pointers.size > 0 || keyDown; }

  function press() {
    S.init();
    if (paused) return;
    if (mode === 'title') { startRun(); return; }
    if (mode !== 'play' || reviveOpen) return;
    game.setInput(true);
    if (game.state === 'respawn') game.go();
  }
  function release() {
    if (!game) return;
    if (!isHeld()) game.setInput(false);
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== undefined && e.button > 0) return;
    e.preventDefault();
    pointers.add(e.pointerId);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    press();
  });
  const up = (e) => { if (pointers.delete(e.pointerId)) release(); };
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  $('title').addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a')) return;
    e.preventDefault();
    pointers.add(e.pointerId);
    press();
  });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (!e.target.closest('#grid')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  window.addEventListener('pointerdown', () => S.init(), true);

  window.addEventListener('keydown', (e) => {
    const k = e.code || e.key;
    if (k === 'Space' || e.key === ' ') {
      e.preventDefault();
      if (e.repeat) return;
      S.init();
      if (mode === 'over' && performance.now() - overAt > 500) { retry(); return; }
      if (reviveOpen) return;
      keyDown = true;
      press();
    } else if (k === 'KeyM' || e.key === 'm' || e.key === 'M') {
      toggleMute();
    } else if (k === 'KeyP' || e.key === 'p' || e.key === 'P' || k === 'Escape') {
      if (mode === 'garage' && k === 'Escape') { closeGarage(); return; }
      if (mode === 'play' && !reviveOpen) togglePause();
    } else if (k === 'Enter') {
      if (mode === 'over' && performance.now() - overAt > 500) { e.preventDefault(); retry(); }
      else if (mode === 'title' && document.activeElement === document.body) { e.preventDefault(); S.init(); startRun(); release(); }
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); keyDown = false; release(); }
  });
  window.addEventListener('blur', () => { pointers.clear(); keyDown = false; release(); });

  /* ---------------------------------------------------------------- screens */
  function show(id, on) { $(id).hidden = !on; }

  function setMode(m) {
    mode = m;
    show('title', m === 'title');
    show('hud', m === 'play');
    show('over', m === 'over');
    show('garage', m === 'garage');
    show('arcade', m === 'title' || m === 'over');
    show('btnPause', m === 'play');
    if (m !== 'play') { show('prompt', false); show('pausedOv', false); show('revive', false); reviveOpen = false; }
    refreshStats();
  }

  function refreshStats() {
    $('tBest').textContent = save.best;
    $('coinTotal').textContent = save.coins;
    $('hudBest').textContent = 'BEST ' + save.best;
  }

  function startRun() {
    if (game.state !== 'ready') newGame();
    runStartCoins = 0;
    setMode('play');
    game.setInput(isHeld());
    game.go();
    tutor = save.games < 3 ? new L.Autopilot(game) : null;
    tutorCorners = 0;
  }

  function retry() {
    S.click();
    newGame();
    setMode('play');
    game.setInput(false);
    game.go();
    tutor = save.games < 3 ? new L.Autopilot(game) : null;
    tutorCorners = 0;
  }

  function finish() {
    show('revive', false); reviveOpen = false;
    const score = game.score;
    const isNew = score > save.best;
    if (isNew) save.best = score;
    save.games++;
    persist();
    $('oScore').textContent = score;
    $('oBest').textContent = save.best;
    $('oCoins').textContent = '+' + game.runCoins;
    show('oNew', isNew && score > 0);
    setMode('over');
    overAt = performance.now();
    if (isNew && score > 0) setTimeout(() => S.newBest(), 250);
  }

  function openRevive() {
    reviveOpen = true;
    reviveT = 5;
    $('rvCoins').textContent = save.coins;
    $('rvCost').textContent = CFG.REVIVE_COST;
    show('revive', true);
  }

  function togglePause(force) {
    const p = force !== undefined ? force : !paused;
    if (p === paused) return;
    if (p && mode !== 'play') return;
    paused = p;
    show('pausedOv', paused);
    if (paused) { pointers.clear(); keyDown = false; if (game) game.setInput(false); S.suspend(); }
    else { S.resume(); last = performance.now(); acc = 0; }
  }

  function toggleMute() {
    save.muted = !save.muted;
    S.init();
    S.setMuted(save.muted);
    persist();
    updateMuteIcon();
  }
  function updateMuteIcon() {
    $('icoSound').hidden = save.muted; $('icoMute').hidden = !save.muted;
    $('btnMute').setAttribute('aria-pressed', save.muted ? 'true' : 'false');
  }

  function toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
  }

  function bumpCoins() {
    const p = $('coinPill');
    p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
  }

  function btn(id, fn) {
    $(id).addEventListener('click', (e) => { e.currentTarget.blur(); S.init(); fn(e); });
    $(id).addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  btn('btnMute', toggleMute);
  btn('btnPause', () => { S.click(); togglePause(true); });
  btn('btnResume', () => { S.click(); togglePause(false); });
  btn('btnQuit', () => { S.click(); togglePause(false); newGame(); setMode('title'); });
  btn('btnRetry', retry);
  btn('btnGarage', () => { S.click(); openGarage(); });
  btn('btnGarage2', () => { S.click(); openGarage(); });
  btn('btnBack', () => { S.click(); closeGarage(); });
  btn('btnRevive', () => {
    if (L.tryRevive(game, save)) {
      persist(); refreshStats();
      S.buy();
      show('revive', false); reviveOpen = false;
      cam.frozen = false;
    }
  });
  btn('btnNoRevive', () => { S.click(); finish(); });
  $('arcade').addEventListener('pointerdown', (e) => e.stopPropagation());

  /* ----------------------------------------------------------------- garage */
  const cards = [];
  function buildGarage() {
    const grid = $('grid');
    for (const car of L.CARS) {
      const el = document.createElement('div');
      el.className = 'car';
      el.innerHTML = '<span class="tag" hidden>SELECTED</span><span class="lock" hidden><svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span><canvas></canvas><div class="nm"></div><button class="btn"></button>';
      el.querySelector('.nm').textContent = car.name;
      const b = el.querySelector('button');
      b.addEventListener('click', () => { b.blur(); garageAction(car.id, el); });
      grid.appendChild(el);
      cards.push({ car: car, el: el, cv: el.querySelector('canvas'), b: b, tag: el.querySelector('.tag'), lock: el.querySelector('.lock') });
    }
  }
  function refreshGarage() {
    for (const c of cards) {
      const owned = save.owned.indexOf(c.car.id) >= 0;
      const sel = save.selected === c.car.id;
      c.el.classList.toggle('sel', sel);
      c.tag.hidden = !sel;
      c.b.className = 'btn' + (sel ? '' : owned ? ' green' : ' primary');
      if (sel) c.b.textContent = 'Selected';
      else if (owned) c.b.textContent = 'Select';
      else c.b.innerHTML = '<svg class="coin-ic"><use href="#coin"/></svg>' + c.car.price;
      c.b.disabled = sel;
      c.b.style.opacity = (!owned && save.coins < c.car.price) ? '0.6' : '';
      c.locked = !owned;
      c.lock.hidden = owned;
    }
    refreshStats();
  }
  function garageAction(id, el) {
    S.init();
    if (save.owned.indexOf(id) >= 0) {
      L.selectCar(save, id); S.click();
    } else {
      const r = L.buyCar(save, id);
      if (r.ok) { S.buy(); toast('NEW CAR!'); bumpCoins(); }
      else {
        S.deny();
        el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
        return;
      }
    }
    persist();
    model = Cars.get(save.selected);
    refreshGarage();
  }
  function sizePreviews() {
    for (const c of cards) {
      const r = c.cv.getBoundingClientRect();
      const w = Math.max(40, Math.round(r.width * dpr)), h = Math.max(30, Math.round(r.height * dpr));
      if (c.cv.width !== w || c.cv.height !== h) { c.cv.width = w; c.cv.height = h; }
    }
  }
  function openGarage() {
    garageFrom = mode;
    setMode('garage');
    refreshGarage();
    requestAnimationFrame(sizePreviews);
  }
  function closeGarage() {
    if (game.state !== 'ready') newGame();
    model = Cars.get(save.selected);
    setMode('title');
  }
  function drawGarage(time) {
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const g = c.cv.getContext('2d');
      R.drawPreview(g, c.cv.width, c.cv.height, Cars.get(c.car.id), -2.3 + Math.sin(time * 0.9 + i) * 0.6, time, c.locked);
    }
  }

  /* -------------------------------------------------------------- simulation */
  function handleEvents() {
    const evs = game.events;
    if (!evs.length) return;
    game.events = [];
    for (const e of evs) {
      switch (e.type) {
        case 'coin':
          save.coins += e.n;
          persist();
          $('coinTotal').textContent = save.coins;
          bumpCoins();
          S.coin();
          FX.burst(e.x, e.y, 0.18, '#ffd23f', 6, 1.2);
          FX.text(e.x, e.y, '+' + e.n, '#ffe066');
          break;
        case 'power': {
          S.power(e.kind);
          const col = e.kind === 'boost' ? '#ff9a3c' : e.kind === 'double' ? '#c18bff' : '#6fdcff';
          FX.ring(e.x, e.y, col); FX.burst(e.x, e.y, 0.3, col, 14, 1.8);
          toast(e.kind === 'boost' ? 'FEVER!' : e.kind === 'double' ? 'DOUBLE SCORE!' : 'SHIELD!');
          break;
        }
        case 'shieldSave':
          S.shieldBreak();
          FX.burst(e.x, e.y, 0.1, '#9fe8ff', 18, 2);
          shake = Math.max(shake, 0.5);
          FX.endSkid();
          setTimeout(() => toast('SAVED!'), 50);
          break;
        case 'respawn':
          tutor = null;
          FX.ring(e.x, e.y, '#ffffff');
          FX.endSkid();
          cam.frozen = false;
          break;
        case 'fall':
          S.fall();
          shake = 1;
          cam.frozen = true;
          FX.endSkid();
          FX.burst(e.x, e.y, 0, '#c3c8d3', 10, 1.4);
          break;
        case 'over':
          S.crash();
          shake = Math.max(shake, 0.35);
          if (game.canRevive(save.coins)) openRevive();
          else finish();
          break;
        case 'go':
          S.go();
          break;
        case 'milestone':
          toast(e.score + '!');
          S.milestone();
          break;
      }
    }
  }

  let puffT = 0;
  function emitFx() {
    const c = game.car;
    const st = game.state;
    if (st === 'play') {
      const slip = Math.abs(game.slip), tr = Math.abs(game.turnRate);
      const yaw = c.ph + (c.th - c.ph) * 1.3;
      const ca = Math.cos(yaw), sa = Math.sin(yaw);
      if (slip > 0.1 || tr > 1.2) {
        for (let w = 0; w < 2; w++) {
          const side = (w ? 0.115 : -0.115) * R.CAR_SCALE;
          const x = c.x - 0.17 * R.CAR_SCALE * ca - side * sa, y = c.y - 0.17 * R.CAR_SCALE * sa + side * ca;
          FX.skid(w, x, y, simTime);
          if (Math.random() < 0.35 + slip) FX.smoke(x, y, 0.03, Math.min(1, 0.4 + slip * 1.6));
        }
      } else FX.endSkid();
      if (game.boostOn) {
        for (let i = 0; i < 2; i++) {
          const off = (Math.random() - 0.5) * 1.2;
          FX.streak(c.x + ca * (0.6 + Math.random() * 0.6) - sa * off, c.y + sa * (0.6 + Math.random() * 0.6) + ca * off, Math.cos(c.ph), Math.sin(c.ph));
        }
        if (Math.random() < 0.5) FX.smoke(c.x - ca * 0.3, c.y - sa * 0.3, 0.07, 0.5, '255,170,80');
      }
    } else if (st === 'ready' || st === 'respawn') {
      puffT -= CFG.DT;
      if (puffT <= 0) {
        puffT = 0.35 + Math.random() * 0.2;
        const ca = Math.cos(c.th), sa = Math.sin(c.th);
        FX.smoke(c.x - ca * 0.3 + sa * 0.06, c.y - sa * 0.3 - ca * 0.06, 0.05, 0.45, '200,204,214');
      }
    } else if (st === 'falling' && game.fallT < 0.5) {
      if (Math.random() < 0.5) FX.smoke(c.x, c.y, c.z + 0.05, 0.5);
    }
  }

  function updateTutor() {
    if (!tutor || game.state !== 'play' || game.boostOn) return null;
    const before = tutor.next;
    const want = tutor.update(game.car.v * CFG.DT);
    if (tutor.next !== before) tutorCorners++;
    if (tutorCorners > 6) { tutor = null; return null; }
    const player = game.playerDir();
    if (want === player) return null;
    return want === 0 ? 'HOLD!' : 'RELEASE!';
  }

  let tutorText = null;
  function tick() {
    cam.px = cam.x; cam.py = cam.y;
    simTime += CFG.DT;
    game.step();
    if (mode === 'play') tutorText = updateTutor();
    handleEvents();
    emitFx();
    if (!cam.frozen) {
      const t = camTarget(false);
      const kx = 1 - Math.exp(-3 * CFG.DT), ky = 1 - Math.exp(-7 * CFG.DT);
      cam.x += (t[0] - cam.x) * kx;
      cam.y += (t[1] - cam.y) * ky;
    }
    shake = Math.max(0, shake - CFG.DT * 1.8);
    FX.update(CFG.DT, simTime);
    if (reviveOpen) {
      reviveT -= CFG.DT;
      $('rvBar').style.width = Math.max(0, reviveT / 5 * 100) + '%';
      if (reviveT <= 0) finish();
    }
  }

  /* ----------------------------------------------------------------- render */
  let lastScore = -1, lastChips = '';
  function updateHud() {
    if (mode !== 'play') return;
    if (game.score !== lastScore) { lastScore = game.score; $('score').textContent = game.score; }
    $('score').classList.toggle('x2', game.dbl > 0);
    let chips = '';
    if (game.boostOn) chips += chip('boost', '&#9889;', Math.max(0, game.boost) / CFG.BOOST_TIME);
    if (game.dbl > 0) chips += chip('double', 'x2', game.dbl / CFG.DOUBLE_TIME);
    if (game.shield) chips += '<div class="chip shield"><i>&#9670;</i>SHIELD</div>';
    if (chips !== lastChips) { lastChips = chips; $('chips').innerHTML = chips; }

    let p = '', pulse = false;
    if (game.state === 'respawn') { p = 'TAP TO GO<small>hold to turn &middot; release to go straight</small>'; pulse = true; }
    else if (game.boostWaiting()) {
      const want = game.ap ? game.ap.target : 1;
      if ((game.held ? 0 : 1) !== want) p = (want === 0 ? 'HOLD' : 'RELEASE') + '<small>to take back control</small>';
    } else if (tutorText) p = tutorText;
    else if (game.state === 'play' && tutor && game.maxIdx < 4) p = '<small>hold to turn &middot; release to go straight</small>';
    if (p !== lastPrompt) {
      lastPrompt = p;
      $('prompt').innerHTML = p;
      $('prompt').hidden = !p;
      $('prompt').classList.toggle('pulse', pulse);
    }
  }
  function chip(cls, ico, frac) {
    return '<div class="chip ' + cls + '"><i>' + ico + '</i><span class="bar"><b style="width:' + Math.round(frac * 100) + '%"></b></span></div>';
  }

  function render(alpha) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sh = shake * shake * 12;
    R.frame(ctx, {
      game: game, alpha: alpha, time: simTime,
      camx: cam.px + (cam.x - cam.px) * alpha, camy: cam.py + (cam.y - cam.py) * alpha,
      shakeX: (Math.random() - 0.5) * sh, shakeY: (Math.random() - 0.5) * sh,
      model: model, themeBlocks: game.maxIdx, boost: game.boostOn,
    });
  }

  function updateAudio() {
    const st = game.state;
    const engineOn = !paused && (mode === 'play' || mode === 'title') && (st === 'ready' || st === 'play' || st === 'respawn');
    const speed01 = Math.min(1, game.car.v / CFG.VMAX);
    const screech = (st === 'play' && !paused) ? Math.max(0, (Math.abs(game.slip) - 0.1) * 3) : 0;
    S.update(engineOn, speed01, game.boostOn, screech);
  }

  let last = performance.now(), acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    let dt = (now - last) / 1000;
    last = now;
    if (!(dt >= 0)) dt = 0;
    if (dt > 0.25) dt = 0.25;
    if (!paused && !document.hidden) {
      acc += dt;
      let n = 0;
      while (acc >= CFG.DT && n < 12) { tick(); acc -= CFG.DT; n++; }
      if (n >= 12) acc = 0;
    }
    render(paused ? 1 : Math.min(1, acc / CFG.DT));
    updateHud();
    updateAudio();
    if (mode === 'garage') drawGarage(now / 1000);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pointers.clear(); keyDown = false; if (game) game.setInput(false);
      if (mode === 'play' && !reviveOpen && (game.state === 'play' || game.state === 'respawn')) togglePause(true);
      S.suspend();
    } else {
      last = performance.now(); acc = 0;
      if (!paused) S.resume();
    }
  });

  /* ------------------------------------------------------------------- boot */
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 100));
  R.initClouds();
  buildGarage();
  newGame();
  resize();
  snapCamera();
  updateMuteIcon();
  setMode('title');
  requestAnimationFrame(loop);

  // test / debug hook
  window.__drift = {
    get game() { return game; }, get mode() { return mode; }, get save() { return save; }, get paused() { return paused; },
    L: L,
  };
})();
