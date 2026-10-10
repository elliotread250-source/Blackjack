/* Stickman Hook - game flow, input, camera, saving, UI. */
(function () {
  'use strict';
  var P = window.SHPhys, RD = window.SHRagdoll, R = window.SHRender, A = window.SHAudio;
  var LEVELS = window.SHLevels.LEVELS;
  var C = P.C, STEP = C.STEP;
  var SAVE_KEY = 'stickmanHook.v1';

  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('game'), ctx = canvas.getContext('2d');
  var W = 0, H = 0, DPR = 1, baseScale = 1;

  // ---------- save ----------
  var save = { unlocked: 1, best: {}, stars: {}, skin: 'classic', muted: false, last: 0 };
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          if (s.unlocked >= 1) save.unlocked = Math.min(LEVELS.length, Math.floor(s.unlocked));
          if (s.best && typeof s.best === 'object') save.best = s.best;
          if (s.stars && typeof s.stars === 'object') save.stars = s.stars;
          if (typeof s.skin === 'string') save.skin = s.skin;
          save.muted = !!s.muted;
          if (s.last >= 0) save.last = Math.min(LEVELS.length - 1, Math.floor(s.last));
        }
      }
    } catch (e) { /* storage blocked: play without saving */ }
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignore */ }
  }
  function completedCount() { var n = 0; for (var i = 0; i < LEVELS.length; i++) if (save.best[i + 1]) n++; return n; }
  function totalStars() { var n = 0; for (var k in save.stars) n += save.stars[k] | 0; return n; }
  function skinUnlocked(sk) {
    if (!sk.unlock) return true;
    if (sk.unlock.levels) return completedCount() >= sk.unlock.levels;
    if (sk.unlock.stars) return totalStars() >= sk.unlock.stars;
    return false;
  }
  function currentSkin() {
    for (var i = 0; i < R.SKINS.length; i++) if (R.SKINS[i].id === save.skin && skinUnlocked(R.SKINS[i])) return R.SKINS[i];
    return R.SKINS[0];
  }
  function fmt(t) { return t.toFixed(2); }

  // ---------- state ----------
  var G = {
    mode: 'title', levelIdx: 0, sim: null, rag: null, theme: R.THEMES[0],
    cam: { x: 0, y: 0, z: 1 }, prevX: 0, prevY: 0,
    trail: [], parts: [], time: 0, acc: 0,
    deadTimer: 0, winTimer: 0, finishShown: false, celebrate: null,
    hintTimer: 0, grabbedOnce: false, lastWin: null,
    demo: null, demoRag: null
  };
  var input = { pointers: new Set(), space: false, latch: false };
  function held() { return input.pointers.size > 0 || input.space; }

  // ---------- layout ----------
  function resize() {
    var vv = window.visualViewport;
    W = Math.round(vv ? vv.width : window.innerWidth) || window.innerWidth;
    H = Math.round(vv ? vv.height : window.innerHeight) || window.innerHeight;
    DPR = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    // Show about 1.1M square world units, but never less than 900 wide or
    // 640 tall, so phones in portrait still see the next hook coming.
    var s = Math.sqrt(W * H / 1.1e6);
    s = Math.min(s, W / 900, H / 640);
    baseScale = Math.max(0.2, s);
  }

  // ---------- levels ----------
  function startLevel(i) {
    G.levelIdx = i;
    save.last = i; persist();
    G.theme = R.themeFor(i);
    document.documentElement.style.setProperty('--ui', G.theme.ui);
    var meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.setAttribute('content', G.theme.sky[0]);
    resetLevel();
    setMode('play');
    var L = LEVELS[i];
    $('hudLevel').innerHTML = 'Level ' + (i + 1) + '<small></small>';
    $('hudLevel').querySelector('small').textContent = L.name;
    showHint(L.hint || (i === 0 ? '' : 'Hold to grab • release to fly'), L.hint ? 6 : 3);
  }
  function resetLevel() {
    var L = LEVELS[G.levelIdx];
    G.sim = P.createSim(L);
    var st = G.sim.lv.start;
    G.rag = RD.create(st[0], st[1] - RD.FOOT);
    G.prevX = G.sim.x; G.prevY = G.sim.y;
    G.trail = []; G.parts = [];
    G.deadTimer = 0; G.winTimer = 0; G.finishShown = false; G.celebrate = null; G.grabbedOnce = false;
    G.cam.x = st[0] + viewW() * 0.22; G.cam.y = st[1] - 140; G.cam.z = 1;
    input.latch = false;
    updateHudTime();
  }
  function viewW() { return W / (baseScale * G.cam.z); }
  function viewH() { return H / (baseScale * G.cam.z); }

  // ---------- modes / screens ----------
  var screens = { title: 'scrTitle', select: 'scrSelect', skins: 'scrSkins', pause: 'scrPause', finish: 'scrFinish' };
  function setMode(m) {
    G.mode = m;
    for (var k in screens) $(screens[k]).classList.toggle('on', k === m && (k !== 'finish' || G.finishShown));
    document.body.className = 'mode-' + m + (m === 'title' || m === 'select' || m === 'pause' ? ' show-arcade' : '');
    if (m === 'title') refreshTitle();
    if (m === 'select') buildGrid();
    if (m === 'skins') buildSkins();
    if (m !== 'play') { input.pointers.clear(); input.space = false; A.wind(0); }
    if (m !== 'play' && m !== 'finish') hideHint();
  }
  function refreshTitle() {
    $('btnPlay').textContent = completedCount() >= LEVELS.length ? 'Play' : (completedCount() ? 'Continue • Level ' + nextLevel() : 'Play');
    $('totals').textContent = completedCount() + ' / ' + LEVELS.length + ' levels  •  ' + totalStars() + ' / ' + LEVELS.length * 3 + ' ★';
  }
  function nextLevel() {
    for (var i = 0; i < Math.min(save.unlocked, LEVELS.length); i++) if (!save.best[i + 1]) return i + 1;
    return Math.min(save.unlocked, LEVELS.length);
  }

  var LOCK = '<svg viewBox="0 0 24 24"><path d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';
  function starsHtml(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += i < n ? '★' : '<i>★</i>';
    return s;
  }
  function buildGrid() {
    var g = $('grid'); g.innerHTML = '';
    for (var i = 0; i < LEVELS.length; i++) {
      if (i % 5 === 0) {
        var h = document.createElement('div'); h.className = 'group';
        h.textContent = R.themeFor(i).name; g.appendChild(h);
      }
      var b = document.createElement('button');
      var locked = i >= save.unlocked;
      b.className = 'tile' + (locked ? ' locked' : '') + (i === G.levelIdx && !locked ? ' current' : '');
      b.setAttribute('aria-label', 'Level ' + (i + 1) + (locked ? ' (locked)' : ''));
      b.dataset.level = i;
      var th = R.themeFor(i);
      if (!locked) b.style.background = 'linear-gradient(180deg,#fff 0%,#fff 55%,' + th.sky[1] + ' 100%)';
      if (locked) b.innerHTML = '<span class="n" style="opacity:.35">' + (i + 1) + '</span>' + LOCK;
      else {
        var best = save.best[i + 1];
        b.innerHTML = '<span class="n" style="color:' + th.ui + '">' + (i + 1) + '</span><span class="st">' + starsHtml(save.stars[i + 1] | 0) +
          '</span><span class="bt">' + (best ? fmt(best / 1000) + 's' : '—') + '</span>';
      }
      g.appendChild(b);
    }
  }
  function buildSkins() {
    var g = $('skinGrid'); g.innerHTML = '';
    var cur = currentSkin();
    R.SKINS.forEach(function (sk) {
      var ok = skinUnlocked(sk);
      var d = document.createElement('button');
      d.className = 'skin' + (ok ? '' : ' locked') + (sk.id === cur.id ? ' sel' : '');
      d.dataset.skin = sk.id;
      var cv = document.createElement('canvas');
      d.appendChild(cv);
      var b = document.createElement('b'); b.textContent = sk.name; d.appendChild(b);
      var s = document.createElement('span');
      s.textContent = ok ? (sk.id === cur.id ? 'Selected' : 'Tap to wear') :
        sk.unlock.levels ? 'Finish ' + sk.unlock.levels + ' levels' : 'Collect ' + sk.unlock.stars + ' ★';
      d.appendChild(s);
      g.appendChild(d);
      d._skin = sk; d._ok = ok; d._cv = cv;
    });
    drawSkinCards();
  }
  function drawSkinCards() {
    var cards = document.querySelectorAll('#skinGrid .skin');
    for (var i = 0; i < cards.length; i++) {
      var d = cards[i], cv = d._cv;
      var w = cv.clientWidth || 140, h = cv.clientHeight || 110;
      if (cv.width !== Math.round(w * DPR)) { cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR); }
      var c = cv.getContext('2d');
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.clearRect(0, 0, w, h);
      R.drawSkinPreview(c, d._skin, w, h, G.time + i * 0.4, !d._ok);
    }
  }

  var hintT = 0;
  function showHint(text, secs) {
    var el = $('hint');
    if (!text) { hideHint(); return; }
    el.textContent = text; el.classList.add('on');
    G.hintTimer = secs || 4;
  }
  function hideHint() { $('hint').classList.remove('on'); G.hintTimer = 0; }
  var toastTimer = 0;
  function toast(text) {
    var el = $('toast'); el.textContent = text; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }
  function updateHudTime() {
    var s = G.sim, best = save.best[G.levelIdx + 1];
    var t = s ? (s.state === 'won' && G.lastWin ? G.lastWin : s.t) : 0;
    $('hudTime').innerHTML = fmt(t) + '<small>' + (best ? 'best ' + fmt(best / 1000) : '&nbsp;') + '</small>';
  }

  // ---------- particles ----------
  var CONFETTI = ['#ff4f8b', '#ffc93c', '#4dc9ff', '#6be08a', '#9b7bff', '#ff8a5b'];
  function burst(x, y, n, kind, color, speed, life) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, sp = speed * (0.3 + Math.random() * 0.7);
      G.parts.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'confetti' ? speed * 0.6 : 0),
        life: life * (0.6 + Math.random() * 0.4), max: life, kind: kind,
        color: color || CONFETTI[i % CONFETTI.length], size: kind === 'confetti' ? 6 + Math.random() * 4 : 4 + Math.random() * 5,
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, g: kind === 'confetti' ? 900 : 300
      });
    }
  }
  function updateParts(dt) {
    for (var i = G.parts.length - 1; i >= 0; i--) {
      var p = G.parts[i];
      p.life -= dt;
      if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      if (p.kind === 'ring') continue;
      p.vy += p.g * dt;
      if (p.kind === 'confetti') { p.vx *= 0.985; p.vy = Math.min(p.vy, 260); }
      else { p.vx *= 0.95; p.vy *= 0.95; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }

  // ---------- simulation tick ----------
  function handleEvents(sim) {
    for (var i = 0; i < sim.events.length; i++) {
      var e = sim.events[i];
      switch (e.type) {
        case 'jump': A.play('jump'); break;
        case 'grab': {
          A.play('grab');
          var hp = P.hookPos(sim, e.hook);
          G.parts.push({ x: hp[0], y: hp[1], life: 0.35, max: 0.35, kind: 'ring', color: '#ff2f86', size: 30 });
          if (!G.grabbedOnce) { G.grabbedOnce = true; if (G.levelIdx === 0) showHint('Now let go to fly!', 2.5); }
          break;
        }
        case 'release': {
          var sp = Math.hypot(e.vx, e.vy);
          A.play('release', { speed: sp });
          // somersault: the faster you let go, the more you flip
          var dir = e.vx >= 0 ? 1 : -1;
          var cur = RD.spinRate(G.rag, STEP);
          var want = dir * Math.min(13, 3 + sp / 160);
          RD.spin(G.rag, want - cur * 0.5, STEP);
          break;
        }
        case 'boing':
          A.play('boing', { kind: e.kind });
          burst(e.x, e.y, 10, 'dot', 'rgba(255,255,255,0.9)', 260, 0.4);
          break;
        case 'thud': A.play('thud'); burst(e.x, e.y, 6, 'dot', 'rgba(255,255,255,0.8)', 160, 0.3); break;
        case 'finish': onWin(sim); break;
        case 'fall': onFall(sim, e.stuck); break;
      }
    }
    sim.events.length = 0;
  }

  function onWin(sim) {
    var t = sim.t, i = G.levelIdx, key = i + 1;
    G.lastWin = t;
    var L = LEVELS[i], par = L.par || 0;
    var stars = !par || t <= par + 1e-9 ? 3 : t <= par * 1.5 ? 2 : 1;
    var prevBest = save.best[key];
    var ms = Math.round(t * 1000);
    var newBest = !prevBest || ms < prevBest;
    var beforeSkins = R.SKINS.filter(skinUnlocked).map(function (s) { return s.id; });
    if (newBest) save.best[key] = ms;
    save.stars[key] = Math.max(save.stars[key] | 0, stars);
    save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, i + 2));
    persist();
    var fresh = R.SKINS.filter(function (s) { return skinUnlocked(s) && beforeSkins.indexOf(s.id) < 0; });
    A.play('finish'); A.wind(0);
    var f = sim.lv.finish;
    burst(f.x + f.w / 2, f.y - 60, 70, 'confetti', null, 900, 2.6);
    G.celebrate = { t: 0, fx: sim.x, fy: sim.y, tx: f.x + f.w / 2, ty: f.y - RD.FOOT };
    G.winTimer = 0;
    // fill the finish panel now, show it shortly
    $('finishTitle').textContent = i === LEVELS.length - 1 ? 'You beat the game!' : 'Level ' + key + ' Complete!';
    $('finishTime').textContent = fmt(t) + 's';
    var fb = $('finishBest');
    fb.className = newBest && prevBest ? 'new' : '';
    fb.textContent = newBest && prevBest ? 'New best! (was ' + fmt(prevBest / 1000) + 's)' :
      prevBest ? 'Best ' + fmt(prevBest / 1000) + 's' : (par ? '★★★ under ' + fmt(par) + 's' : '');
    $('finishUnlock').textContent = fresh.length ? 'New skin unlocked: ' + fresh.map(function (s) { return s.name; }).join(', ') + '!' : '';
    $('btnNext').style.display = i < LEVELS.length - 1 ? '' : 'none';
    var starEls = $('finishStars').querySelectorAll('i');
    for (var k = 0; k < 3; k++) starEls[k].classList.remove('on');
    G.pendingStars = stars; G.freshSkins = fresh;
    setMode('finish');
    hideHint();
    updateHudTime();
  }

  function onFall(sim, stuck) {
    A.play('fall'); A.wind(0);
    G.deadTimer = 0.85;
    showHint(stuck ? 'Stuck! Restarting…' : 'Oops! Try again', 1.2);
  }

  function tick() {
    var sim = G.sim;
    if (G.mode === 'play') {
      var h = held() || input.latch;
      input.latch = false;
      G.prevX = sim.x; G.prevY = sim.y;
      if (sim.state === 'ready' || sim.state === 'play') {
        P.step(sim, h);
        handleEvents(sim);
      }
      if (sim.state === 'dead') {
        RD.stepFree(G.rag, STEP, C.G);
        if (G.trail.length) G.trail.shift();
        G.deadTimer -= STEP;
        if (G.deadTimer <= 0) { resetLevel(); showHint('', 0); }
      }
    } else if (G.mode === 'finish') {
      G.prevX = sim.x; G.prevY = sim.y;
    }
    if (!sim) return;
    // ragdoll
    if (sim.state === 'ready') {
      RD.setPose(G.rag, sim.lv.start[0], sim.lv.start[1] - RD.FOOT, 'stand', G.time);
    } else if (sim.state === 'play') {
      if (sim.hook >= 0) {
        var hp = P.hookPos(sim, sim.hook);
        var dx = hp[0] - sim.x, dy = hp[1] - sim.y, dl = Math.hypot(dx, dy) || 1;
        RD.stepHang(G.rag, sim.x + dx / dl * 24, sim.y + dy / dl * 24, sim.vx, sim.vy, STEP, C.G, -dx / dl, -dy / dl);
      } else {
        RD.stepFly(G.rag, sim.x, sim.y, STEP, 0.9985);
      }
      G.trailTick = (G.trailTick || 0) + 1;
      if (G.trailTick % 2 === 0) {
        G.trail.push([sim.x, sim.y]);
        if (G.trail.length > 22) G.trail.shift();
      }
    } else if (sim.state === 'won' && G.celebrate) {
      var cb = G.celebrate;
      cb.t += STEP;
      var k = Math.min(1, cb.t / 0.55), e = 1 - Math.pow(1 - k, 3);
      var x = cb.fx + (cb.tx - cb.fx) * e, y = cb.fy + (cb.ty - 14 - cb.fy) * e - Math.sin(k * Math.PI) * 90;
      sim.x = x; sim.y = y;
      if (k < 1) RD.stepFly(G.rag, x, y, STEP, 0.95);
      else RD.setPose(G.rag, cb.tx, cb.ty - Math.abs(Math.sin((cb.t - 0.55) * 7)) * 16, 'cheer', G.time);
      if (G.trail.length) G.trail.shift();
      G.winTimer += STEP;
      if (G.winTimer > 0.9 && !G.finishShown) {
        G.finishShown = true;
        $('scrFinish').classList.add('on');
        revealStars();
      }
    }
    updateParts(STEP);
  }
  function revealStars() {
    var els = $('finishStars').querySelectorAll('i'), n = G.pendingStars || 0;
    for (var k = 0; k < n; k++) (function (k) {
      setTimeout(function () { els[k].classList.add('on'); A.play('star', { i: k }); }, 180 + k * 220);
    })(k);
    if (G.freshSkins && G.freshSkins.length) setTimeout(function () { A.play('unlock'); }, 900);
  }

  // ---------- demo (menus) ----------
  function initDemo() {
    var d = P.createSim({ hooks: [[0, 0]], finish: [9000, 9000] }, { assist: 0 });
    d.state = 'play'; d.hook = 0; d.rope = 190;
    var a = 1.1; d.x = Math.sin(a) * 190; d.y = Math.cos(a) * 190; d.vx = 0; d.vy = 0;
    G.demo = d; G.demoRag = RD.create(d.x, d.y);
  }
  function tickDemo() {
    var d = G.demo;
    d.lv.deathY = 1e9;
    P.step(d, true); d.events.length = 0; d.idle = 0;
    var dx = -d.x, dy = -d.y, dl = Math.hypot(dx, dy) || 1;
    RD.stepHang(G.demoRag, d.x + dx / dl * 24, d.y + dy / dl * 24, d.vx, d.vy, STEP, C.G, -dx / dl, -dy / dl);
  }

  // ---------- render ----------
  function render(alpha) {
    var th = G.mode === 'play' || G.mode === 'pause' || G.mode === 'finish' ? G.theme : R.themeFor(save.last || 0);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var inGame = G.sim && (G.mode === 'play' || G.mode === 'pause' || G.mode === 'finish');
    var scale, view;
    if (inGame) {
      scale = baseScale * G.cam.z;
      view = { W: W, H: H, scale: scale, cx: G.cam.x, cy: G.cam.y };
    } else {
      scale = baseScale * 1.25;
      var portrait = H > W;
      view = { W: W, H: H, scale: scale, cx: 0, cy: portrait ? 200 : 120 };
    }
    R.drawBackground(ctx, W, H, view, th, G.time);
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * (W / 2 - view.cx * scale), DPR * (H / 2 - view.cy * scale));
    if (inGame) {
      var sim = G.sim;
      var ix = G.prevX + (sim.x - G.prevX) * alpha, iy = G.prevY + (sim.y - G.prevY) * alpha;
      R.drawWorld(ctx, sim, view, th, G.time);
      var skin = currentSkin();
      if (G.trail.length > 2) R.drawTrail(ctx, G.trail.concat([[ix, iy]]), skin, G.time);
      var cand = sim.state === 'play' || sim.state === 'ready' ? (sim.hook >= 0 ? sim.hook : (sim.state === 'play' ? P.candidateHook(sim) : firstHookInReach(sim))) : -1;
      R.drawHooks(ctx, sim, view, cand, G.time);
      var rope = sim.hook >= 0 && sim.state === 'play' ? P.hookPos(sim, sim.hook) : null;
      var ox = sim.state === 'play' ? ix - sim.x : 0, oy = sim.state === 'play' ? iy - sim.y : 0;
      R.drawStickman(ctx, G.rag, skin, G.time, ox, oy, rope);
      R.drawParticles(ctx, G.parts);
      if (sim.state === 'ready' && G.mode === 'play') drawReadyHint(sim);
    } else if (G.demo && G.mode === 'title') {
      R.drawHooks(ctx, G.demo, view, 0, G.time);
      R.drawStickman(ctx, G.demoRag, currentSkin(), G.time, 0, 0, [0, 0]);
    }
  }
  function firstHookInReach(sim) {
    var c = P.cloneSim(sim); c.state = 'play'; c.vx = C.START_VX;
    return P.candidateHook(c);
  }
  function drawReadyHint(sim) {
    var st = sim.lv.start, k = 0.5 + 0.5 * Math.sin(G.time * 5);
    ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.4 * k) + ')';
    ctx.font = '800 26px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(40,30,70,0.25)';
    var label = 'HOLD TO SWING';
    ctx.strokeText(label, st[0], st[1] - 105 - k * 6);
    ctx.fillText(label, st[0], st[1] - 105 - k * 6);
  }

  function updateCamera(dt) {
    var sim = G.sim; if (!sim) return;
    var vw = viewW(), vh = viewH();
    var sp = Math.hypot(sim.vx, sim.vy);
    var zt = sim.state === 'play' ? 1 - Math.min(0.16, Math.max(0, sp - 900) / 1700 * 0.16) : 1;
    G.cam.z += (zt - G.cam.z) * (1 - Math.exp(-dt * 1.5));
    var tx, ty;
    if (sim.state === 'dead') return;
    if (sim.state === 'won' && G.celebrate) { tx = G.celebrate.tx; ty = G.celebrate.ty - 80; }
    else if (sim.state === 'ready') { tx = sim.lv.start[0] + vw * 0.22; ty = sim.lv.start[1] - 140; }
    else {
      var lx = Math.max(-vw * 0.2, Math.min(vw * 0.25, sim.vx * 0.32));
      var ly = Math.max(-vh * 0.18, Math.min(vh * 0.2, sim.vy * 0.16));
      tx = sim.x + lx + vw * 0.1; ty = sim.y + ly;
    }
    var k = 1 - Math.exp(-dt * 3.6);
    G.cam.x += (tx - G.cam.x) * k;
    G.cam.y += (ty - G.cam.y) * k;
    var maxY = sim.lv.deathY - vh * 0.5 + 60;
    if (G.cam.y > maxY) G.cam.y = maxY;
  }

  // ---------- main loop ----------
  var last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = last ? Math.min(0.1, (ts - last) / 1000) : STEP;
    last = ts;
    if (document.hidden) return;
    G.time += dt;
    var paused = G.mode === 'pause';
    if (!paused) {
      G.acc += dt;
      var n = 0;
      while (G.acc >= STEP && n < 24) {
        if (G.mode === 'play' || G.mode === 'finish') tick();
        else if (G.demo && G.mode !== 'pause') tickDemo();
        G.acc -= STEP; n++;
      }
      if (n >= 24) G.acc = 0;
      if (G.mode === 'play' || G.mode === 'finish') updateCamera(dt);
    }
    if (G.mode === 'play' && G.sim) {
      updateHudTime();
      A.wind(G.sim.state === 'play' ? Math.hypot(G.sim.vx, G.sim.vy) : 0);
      if (G.hintTimer > 0) { G.hintTimer -= dt; if (G.hintTimer <= 0) hideHint(); }
    }
    if (G.mode === 'skins') drawSkinCards();
    render(paused ? 1 : Math.min(1, G.acc / STEP));
  }

  // ---------- input ----------
  function press() {
    A.init();
    if (G.mode !== 'play') return;
    input.latch = true;
  }
  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (G.mode !== 'play') return;
    try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    input.pointers.add(e.pointerId);
    press();
  });
  function up(e) { input.pointers.delete(e.pointerId); }
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('touchmove', function (e) {
    if (!e.target.closest || !e.target.closest('.screen')) e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (e.repeat) return;
      A.init();
      if (G.mode === 'play') { input.space = true; press(); }
      else if (G.mode === 'title') clickBtn(playMain);
      else if (G.mode === 'finish' && G.finishShown) clickBtn(goNext);
      else if (G.mode === 'pause') clickBtn(resume);
      return;
    }
    if (e.repeat) return;
    if (k === 'Enter') {
      if (G.mode === 'title') clickBtn(playMain);
      else if (G.mode === 'finish' && G.finishShown) clickBtn(goNext);
    } else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'p' || k === 'P' || k === 'Escape') {
      if (G.mode === 'play') pause();
      else if (G.mode === 'pause') resume();
      else if (k === 'Escape' && (G.mode === 'select' || G.mode === 'skins')) setMode('title');
    } else if (k === 'r' || k === 'R') {
      if (G.mode === 'play' || G.mode === 'finish' || G.mode === 'pause') { resetLevel(); setMode('play'); }
    }
  });
  window.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Spacebar') input.space = false; });
  window.addEventListener('blur', function () { input.pointers.clear(); input.space = false; });

  function pause() {
    if (G.mode !== 'play') return;
    setMode('pause'); A.wind(0);
  }
  function resume() { if (G.mode === 'pause') { setMode('play'); last = 0; } }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { pause(); A.suspend(); } else { A.resume(); last = 0; }
  });

  function toggleMute() {
    save.muted = !save.muted; persist();
    A.setMuted(save.muted); syncMute();
  }
  function syncMute() {
    $('icoSound').style.display = save.muted ? 'none' : '';
    $('icoMute').style.display = save.muted ? '' : 'none';
    $('btnMute').setAttribute('aria-pressed', save.muted ? 'true' : 'false');
  }

  function clickBtn(fn) { A.init(); A.play('click'); fn(); }
  function playMain() { startLevel(nextLevel() - 1); }
  function goNext() {
    if (G.levelIdx < LEVELS.length - 1) startLevel(G.levelIdx + 1);
    else setMode('select');
  }
  function on(id, fn) {
    $(id).addEventListener('click', function (e) { e.preventDefault(); clickBtn(fn); });
  }
  on('btnPlay', playMain);
  on('btnLevels', function () { setMode('select'); });
  on('btnSkins', function () { setMode('skins'); });
  on('selBack', function () { setMode('title'); });
  on('skinBack', function () { setMode('title'); });
  on('btnResume', resume);
  on('btnRestart', function () { resetLevel(); setMode('play'); });
  on('btnPauseLevels', function () { setMode('select'); });
  on('btnNext', goNext);
  on('btnRetry', function () { startLevel(G.levelIdx); });
  on('btnFinLevels', function () { setMode('select'); });
  on('btnPause', pause);
  $('btnMute').addEventListener('click', function (e) { e.preventDefault(); A.init(); toggleMute(); A.play('click'); });
  $('grid').addEventListener('click', function (e) {
    var t = e.target.closest('.tile');
    if (!t || t.classList.contains('locked')) return;
    clickBtn(function () { startLevel(+t.dataset.level); });
  });
  $('skinGrid').addEventListener('click', function (e) {
    var t = e.target.closest('.skin');
    if (!t || !t._ok) return;
    clickBtn(function () { save.skin = t._skin.id; persist(); buildSkins(); toast(t._skin.name + ' equipped'); });
  });
  // stop UI taps from reaching the game
  ['topright', 'scrPause', 'scrFinish'].forEach(function (id) {
    $(id).addEventListener('pointerdown', function (e) { e.stopPropagation(); });
  });

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () { setTimeout(resize, 120); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  // ---------- debug hook (tests / speedrunning the checks) ----------
  window.__hook = {
    get mode() { return G.mode; },
    get sim() { return G.sim; },
    get save() { return JSON.parse(JSON.stringify(save)); },
    get levels() { return LEVELS.length; },
    get cam() { return { x: G.cam.x, y: G.cam.y, z: G.cam.z, scale: baseScale * G.cam.z }; },
    startLevel: function (i) { startLevel(i); },
    /* Put the stickman just above the podium so the next step finishes. */
    win: function () {
      var s = G.sim; if (!s) return;
      if (s.state === 'ready') P.start(s);
      s.hook = -1; s.x = s.lv.finish.x + s.lv.finish.w / 2; s.y = s.lv.finish.y - 40; s.vx = 0; s.vy = 0;
    },
    /* Play a plan from tools/solve.cjs ([[press, release], ...] step indices). */
    plan: null,
    unlockAll: function () { save.unlocked = LEVELS.length; persist(); },
    setMode: setMode
  };

  // ---------- boot ----------
  load();
  A.setMuted(save.muted); syncMute();
  resize();
  initDemo();
  G.levelIdx = save.last || 0;
  setMode('title');
  requestAnimationFrame(frame);
})();
