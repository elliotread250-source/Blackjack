/* Pool: game flow, input, HUD, bots and online play. */
(function () {
  'use strict';
  var P = window.PoolPhysics, Rules = window.PoolRules, Bot = window.PoolBot, Audio = window.PoolAudio,
    Render = window.PoolRender, Net = window.PoolNet;
  var L = P.L, W = P.W, R = P.R;
  var $ = function (id) { return document.getElementById(id); };
  var LEVEL_NAMES = ['Easy', 'Medium', 'Hard', 'Pro'];
  var GUIDES = [
    { obj: 3, cue: 0.6, bounce: 0.6 },
    { obj: 0.36, cue: 0.18, bounce: 0 },
    { obj: 0.17, cue: 0.08, bounce: 0 },
    { obj: 0.09, cue: 0.04, bounce: 0 }
  ];
  var GUIDE_2P = { obj: 0.36, cue: 0.18, bounce: 0 };

  // ------------------------------------------------------------ storage
  function load(key, def) { try { var v = localStorage.getItem('pool.' + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function save(key, val) { try { localStorage.setItem('pool.' + key, JSON.stringify(val)); } catch (e) { /* private mode */ } }

  var settings = {
    name: String(load('name', '') || '').slice(0, 14),
    mute: !!load('mute', false),
    level: Math.max(0, Math.min(3, load('level', 1) | 0)),
    rules: load('rules', 'pub') === 'wpa' ? 'wpa' : 'pub',
    callBlack: !!load('callBlack', false),
    cloth: load('cloth', 'green') === 'blue' ? 'blue' : 'green',
    stats: load('stats', null) || {}
  };

  // ------------------------------------------------------------- state
  var canvas = $('game');
  var renderer = new Render.Renderer(canvas);
  renderer.cloth = settings.cloth;
  var G = {
    mode: null, sim: new P.Sim(), st: null, players: null, me: 0,
    phase: 'menu', aim: [1, 0], power: 0, spin: [0, 0], call: -1, callLocked: false,
    shotNo: 0, frames: [0, 0], seed: 1, level: settings.level, rules: settings.rules, callBlack: settings.callBlack,
    shot: null, shotBy: 0, sinking: [], speed: 1, acc: 0, strikeT: 0, cueView: null, lastStatus: '',
    bot: null, remote: null, pendingState: null, localRes: null, overShown: false, rematchAsked: false, rematchOffered: false,
    netStats: { states: 0, mismatch: 0, aimRecv: 0, aimSent: 0 }, botRng: P.mulberry32(1), lastAimSend: 0, lastAimKey: ''
  };
  Audio.setMuted(settings.mute);
  P.rack(G.sim, 3);
  renderer.randomizeOrientations(3);

  var view = { portrait: false, w: 0, h: 0 };
  var errors = [];
  window.addEventListener('error', function (e) { errors.push(String(e.message)); });

  // ------------------------------------------------------------ layout
  var hud = $('hud');
  function safeInsets() {
    var cs = getComputedStyle($('safe-probe'));
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  function place(el, x, y, w, h) { el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(h) + 'px'; }
  function placeLabel(el, cx, y) { el.style.left = Math.round(cx) + 'px'; el.style.top = Math.round(y) + 'px'; el.style.transform = 'translateX(-50%)'; }

  function layout() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var ins = safeInsets();
    var portrait = vh > vw * 1.05;
    view.portrait = portrait; view.w = vw; view.h = vh;
    hud.classList.toggle('portrait', portrait);
    var inGame = G.mode !== null;
    var hudH = inGame ? (portrait ? 106 : 60) + ins.t : 8 + ins.t;
    var box, ctrl = {};
    if (portrait) {
      var ctrlH = inGame ? Math.max(100, Math.min(132, vh * 0.15)) : 8;
      box = { x: 6 + ins.l, y: hudH + 2, w: vw - 12 - ins.l - ins.r, h: vh - hudH - ctrlH - ins.b - 6 };
      var rect = renderer.setView(vw, vh, dpr, box, true);
      var top = rect.y + rect.h + 6;
      var avail = vh - ins.b - top - 4;
      var px0 = 14 + ins.l, pw = vw - 28 - ins.l - ins.r;
      var spinS = Math.max(48, Math.min(62, avail - 50));
      ctrl.power = { x: px0, y: top + 2, w: pw, h: 38, horiz: true };
      ctrl.spin = { x: px0 + 4, y: top + 48, w: spinS, h: spinS };
      ctrl.fine = { x: px0 + spinS + 26, y: top + 50 + (spinS - 40) / 2, w: pw - spinS - 30, h: 40, horiz: true };
    } else {
      var side = inGame ? Math.max(70, Math.min(118, vw * 0.09)) : 8;
      box = { x: side + ins.l, y: hudH + 2, w: vw - 2 * side - ins.l - ins.r, h: vh - hudH - 8 - ins.b };
      var rect2 = renderer.setView(vw, vh, dpr, box, false);
      var leftMid = (ins.l + rect2.x) / 2, rightMid = (rect2.x + rect2.w + vw - ins.r) / 2;
      var pW = Math.max(34, Math.min(50, (rect2.x - ins.l) * 0.45));
      var pH = Math.min(rect2.h * 0.72, 360);
      ctrl.power = { x: leftMid - pW / 2, y: rect2.y + (rect2.h - pH) / 2, w: pW, h: pH, horiz: false };
      var sS = Math.max(48, Math.min(76, (vw - ins.r - rect2.x - rect2.w) - 18));
      ctrl.spin = { x: rightMid - sS / 2, y: rect2.y + rect2.h * 0.12, w: sS, h: sS };
      var fW = Math.max(30, Math.min(44, sS * 0.6)), fH = Math.min(rect2.h * 0.42, 230);
      ctrl.fine = { x: rightMid - fW / 2, y: ctrl.spin.y + sS + 34, w: fW, h: fH, horiz: false };
    }
    view.ctrl = ctrl;
    // the cue may reach past the table but never over the HUD or the controls
    renderer.cueClip = portrait
      ? { x: 0, y: hudH, w: vw, h: Math.max(10, ctrl.power.y - 4 - hudH) }
      : { x: ctrl.power.x + ctrl.power.w + 8, y: hudH, w: Math.max(10, ctrl.spin.x - 8 - (ctrl.power.x + ctrl.power.w + 8)), h: vh - hudH };
    var pEl = $('power');
    place(pEl, ctrl.power.x, ctrl.power.y, ctrl.power.w, ctrl.power.h);
    pEl.style.setProperty('--pdir', ctrl.power.horiz ? '90deg' : '180deg');
    place($('spin'), ctrl.spin.x, ctrl.spin.y, ctrl.spin.w, ctrl.spin.h);
    place($('fine'), ctrl.fine.x, ctrl.fine.y, ctrl.fine.w, ctrl.fine.h);
    if (ctrl.power.horiz) placeLabel($('power-label'), ctrl.power.x + ctrl.power.w / 2, ctrl.power.y + ctrl.power.h + 1);
    else placeLabel($('power-label'), ctrl.power.x + ctrl.power.w / 2, ctrl.power.y + ctrl.power.h + 6);
    placeLabel($('spin-label'), ctrl.spin.x + ctrl.spin.w / 2, ctrl.spin.y + ctrl.spin.h + 4);
    if (ctrl.fine.horiz) placeLabel($('fine-label'), ctrl.fine.x + ctrl.fine.w / 2, ctrl.fine.y + ctrl.fine.h + 2);
    else placeLabel($('fine-label'), ctrl.fine.x + ctrl.fine.w / 2, ctrl.fine.y + ctrl.fine.h + 6);
    // canvases inside controls
    var sm = $('spin-mini');
    sm.width = sm.height = Math.round(ctrl.spin.w * dpr);
    var fw = $('fine-wheel');
    fw.width = Math.round(ctrl.fine.w * dpr); fw.height = Math.round(ctrl.fine.h * dpr);
    view.dpr = dpr;
    drawSpinMini(); drawFine(); updatePowerUI();
  }

  // ------------------------------------------------------------ helpers
  function cur() { return G.st ? G.players[G.st.turn] : null; }
  function isLocalTurn() {
    if (!G.st || G.phase !== 'aim') return false;
    var p = G.players[G.st.turn];
    return p.kind === 'human';
  }
  function names() { return G.players ? G.players.map(function (p) { return p.name; }) : ['Player 1', 'Player 2']; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function norm(x, y) { var l = Math.sqrt(x * x + y * y) || 1; return [x / l, y / l]; }
  function rot(v, a) { var c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c]; }
  function round(v, k) { var m = Math.pow(10, k); return Math.round(v * m) / m; }
  function pullOf(power) { return 0.012 + power * 0.24; }

  // messages are built from player names; make "You" read naturally
  function phrase(s) {
    return s.replace(/\bYou's\b/g, 'Your').replace(/\bYou is\b/g, 'You are').replace(/\bYou has\b/g, 'You have')
      .replace(/\bYou pots the black and wins\b/g, 'You pot the black and win').replace(/\bYou pots\b/g, 'You pot').replace(/\bYou wins\b/g, 'You win').replace(/\bYou breaks\b/g, 'You break');
  }

  // ------------------------------------------------------------ toasts
  var toastTimer = 0;
  function clearToast() { clearTimeout(toastTimer); $('toast').className = ''; }
  function toast(msg, kind, ms) {
    var el = $('toast');
    el.textContent = phrase(msg);
    el.className = 'show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, ms || 2600);
  }

  // ------------------------------------------------------------ screens
  var SCREENS = ['menu', 'online', 'lobby', 'help', 'pause', 'over', 'dialog', 'spin-pop'];
  var helpReturn = 'menu';
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    var inMenus = id === 'menu' || id === 'online' || id === 'lobby' || (id === 'help' && G.mode === null);
    $('arcade').hidden = !inMenus;
  }
  function hideScreens() { SCREENS.forEach(function (s) { $(s).hidden = true; }); $('arcade').hidden = true; }
  function setGameUI(on) {
    hud.hidden = !on;
    ['power', 'power-label', 'spin', 'spin-label', 'fine', 'fine-label'].forEach(function (id) { $(id).hidden = !on; });
  }

  // ------------------------------------------------------------ frames
  function newFrame(breaker) {
    G.seed = (Math.random() * 2147483647) | 0 || 7;
    P.rack(G.sim, G.seed);
    renderer.randomizeOrientations(G.seed);
    G.st = Rules.newFrame({ mode: G.rules, breaker: breaker, callBlack: G.callBlack });
    G.shotNo = 0;
    G.sinking = [];
    G.overShown = false;
    G.rematchAsked = false; G.rematchOffered = false;
    G.botRng = P.mulberry32(G.seed ^ 0x5bd1e995);
    clearToast();
    startTurn(true);
  }

  function startGame(mode, opts) {
    opts = opts || {};
    G.mode = mode;
    G.frames = [0, 0];
    var me = settings.name || 'You';
    if (mode === 'bot') {
      G.players = [{ name: settings.name || 'You', kind: 'human' }, { name: 'Bot · ' + LEVEL_NAMES[G.level], kind: 'bot', level: G.level }];
    } else if (mode === 'local') {
      G.players = [{ name: settings.name || 'Player 1', kind: 'human' }, { name: 'Player 2', kind: 'human' }];
    }
    void me;
    hideScreens();
    setGameUI(true);
    layout();
    if (mode !== 'online') newFrame(0);
    Audio.unlock();
  }

  function quitToMenu() {
    if (G.mode === 'online') { Net.send({ t: 'leave' }); Net.close(); }
    G.mode = null; G.st = null; G.players = null; G.phase = 'menu'; G.bot = null; G.cueView = null;
    G.sinking = [];
    clearToast();
    setGameUI(false);
    P.rack(G.sim, 3);
    renderer.randomizeOrientations(3);
    layout();
    refreshMenu();
    show('menu');
  }

  // put the cue ball somewhere sensible when it is in hand
  function prepareInHand() {
    var st = G.st, sim = G.sim;
    if (!st.bih) return;
    if (sim.on[0] && P.validCueSpot(sim, sim.x[0], sim.y[0], st.baulk)) return;
    var spot = P.nearestCueSpot(sim, st.baulk || !sim.on[0] ? P.BAULK_X * 0.55 : sim.x[0], st.baulk || !sim.on[0] ? W / 2 : sim.y[0], st.baulk);
    sim.place(0, spot[0], spot[1]);
  }

  function aimAtNearestLegal() {
    var sim = G.sim, st = G.st, best = -1, bd = Infinity;
    for (var b = 1; b < 16; b++) {
      if (!sim.on[b] || !Rules.legalFirst(st, b)) continue;
      if (st.outOfBaulk && !st.free && sim.x[b] < P.BAULK_X) continue;
      var d = Math.hypot(sim.x[b] - sim.x[0], sim.y[b] - sim.y[0]);
      if (d < bd) { bd = d; best = b; }
    }
    if (best >= 0) G.aim = norm(sim.x[best] - sim.x[0], sim.y[best] - sim.y[0]);
  }

  function startTurn(first) {
    var st = G.st;
    G.phase = 'aim';
    G.power = 0; G.spin = [0, 0]; G.call = -1; G.callLocked = false;
    G.bot = null; G.remote = null;
    prepareInHand();
    aimAtNearestLegal();
    var p = cur();
    G.cueView = { dx: G.aim[0], dy: G.aim[1], pull: pullOf(0), alpha: 0 };
    drawSpinMini(); updatePowerUI();
    if (G.mode === 'online' && p.kind === 'human' && !first) Audio.turn();
    updateHUD(true);
    void first;
  }

  // ------------------------------------------------------------ shots
  /** shot = {place, dx, dy, v (speed), power, sx, sy, call} */
  function executeShot(shot, source) {
    var sim = G.sim, st = G.st;
    if (st.bih) {
      var pl = shot.place || [sim.x[0], sim.y[0]];
      if (!P.validCueSpot(sim, pl[0], pl[1], st.baulk)) pl = P.nearestCueSpot(sim, pl[0], pl[1], st.baulk);
      sim.place(0, pl[0], pl[1]);
      shot.place = [sim.x[0], sim.y[0]];
    } else shot.place = null;
    if (!(shot.v >= 0)) shot.v = P.powerToSpeed(shot.power);
    if (shot.power === undefined) shot.power = P.speedToPower(shot.v);
    G.shot = shot; G.shotBy = st.turn; G.shotN = G.shotNo; G.shotNo++;
    G.pendingState = null; G.localRes = null;
    if (G.mode === 'online' && source !== 'remote') {
      Net.send({ t: 'shot', n: G.shotN, c: shot.place, d: [shot.dx, shot.dy], v: shot.v, s: [shot.sx, shot.sy], k: shot.call });
    }
    G.phase = 'strike'; G.strikeT = 0;
    G.cueView = { dx: shot.dx, dy: shot.dy, pull: pullOf(shot.power), alpha: 1, from: pullOf(shot.power) };
    G.power = 0; updatePowerUI();
    updateHUD(true);
    if (document.hidden || window.__pool.instant) { beginRoll(); fastForward(); }
  }

  function beginRoll() {
    var s = G.shot;
    G.sim.events = [];
    G.sim.strike(s.dx, s.dy, s.v, s.sx, s.sy);
    Audio.cue(s.power);
    G.phase = 'roll'; G.acc = 0;
    G.cueView.alpha = 1;
  }

  function stepPhysics() {
    G.sim.step();
    renderer.rollBalls(G.sim, P.DT);
  }

  function processEvents(quiet) {
    var ev = G.sim.events;
    if (!ev || !ev.length) return;
    var clacks = 0;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.k === 'b') { if (!quiet && clacks++ < 4) Audio.clack(e.s); }
      else if (e.k === 'c') { if (!quiet) Audio.cushion(e.s); }
      else if (e.k === 'p') {
        if (!quiet) Audio.pocket(e.s);
        var hole = Render.visualHole(P.POCKETS[e.p]);
        G.sinking.push({ n: e.a, x: e.x, y: e.y, tx: hole.x, ty: hole.y, t: 0 });
      }
    }
    G.sim.events = [];
  }

  function fastForward() {
    var guard = 0;
    while (G.sim.moving() && guard++ < P.MAX_TIME / P.DT) { stepPhysics(); if (G.sim.time >= P.MAX_TIME) { G.sim.stopAll(); break; } }
    processEvents(true);
    G.sinking = [];
    finishShot();
  }

  function finishShot() {
    var sim = G.sim;
    sim.stopAll();
    G.rawSnap = sim.snapshot();       // the table as the shot left it
    var res = Rules.evaluate(G.st, sim.summary(G.shot.call));
    if (G.mode === 'online' && G.shotBy !== G.me) {
      G.localRes = res;
      if (G.pendingState) { var ps = G.pendingState; G.pendingState = null; applyRemoteState(ps); }
      else { G.phase = 'sync'; G.syncSince = performance.now(); updateHUD(true); }
      return;
    }
    applyResult(res, true);
  }

  function applyResult(res, authoritative) {
    var prev = G.st;
    if (res.rerack) {
      // the shooter picks the new rack's seed; the other side gets it in the state message
      G.seed = authoritative ? ((G.seed * 1103515245 + 12345) & 0x7fffffff) || 1 : res.rackSeed;
      P.rack(G.sim, G.seed);
      renderer.randomizeOrientations(G.seed);
    }
    G.st = res.state;
    G.sim.stopAll();
    if (!G.st.bih && !G.sim.on[0]) { G.st.bih = true; }
    prepareInHand();
    var msgs = Rules.describe(prev, res, names());
    if (res.rerack) G.sinking = [];
    if (authoritative && G.mode === 'online') {
      Net.send({ t: 'state', n: G.shotN, b: G.rawSnap.map(function (b) { return b || 0; }), r: G.st, rk: res.rerack ? G.seed : 0 });
    }
    if (res.winner >= 0) {
      if (msgs.length) toast(msgs.join(' · '), res.winner === prev.turn ? 'good' : 'foul', 3000);
      G.phase = 'over';
      gameOver(res);
      return;
    }
    if (res.foul) Audio.foul();
    if (msgs.length) toast(msgs.join(' · '), res.foul ? 'foul' : (res.assigned ? 'good' : ''), res.foul ? 3200 : 2400);
    startTurn(false);
  }

  function gameOver(res) {
    var w = res.winner;
    G.frames[w]++;
    var meWon;
    var title, sub = Rules.describe({ turn: res.shooter }, res, names())[0] || '';
    if (G.mode === 'bot') {
      meWon = w === 0;
      title = meWon ? 'You win!' : 'Bot wins';
      var key = LEVEL_NAMES[G.players[1].level];
      var s = settings.stats[key] || { w: 0, l: 0 };
      if (meWon) s.w++; else s.l++;
      settings.stats[key] = s; save('stats', settings.stats);
    } else if (G.mode === 'online') {
      meWon = w === G.me;
      title = meWon ? 'You win!' : G.players[w].name + ' wins';
    } else {
      meWon = true;
      title = G.players[w].name + ' wins!';
    }
    if (meWon) Audio.win(); else Audio.lose();
    setTimeout(function () {
      if (G.phase !== 'over' || G.overShown) return;
      G.overShown = true;
      $('over-title').textContent = title;
      $('over-sub').textContent = phrase(sub) + '  ·  Frames ' + G.frames[0] + '–' + G.frames[1];
      $('btn-again').textContent = G.mode === 'online' ? (G.rematchOffered ? 'Accept rematch' : 'Rematch') : 'Play again';
      $('btn-again').disabled = false;
      show('over');
      updateHUD(true);
    }, window.__pool.instant ? 0 : 1300);
  }

  // ------------------------------------------------------------ input
  var ptr = null;        // active canvas pointer gesture
  var shiftDown = false;
  var lastMouse = null;

  function eventPos(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function cueScreen() { return renderer.toScreen(G.sim.x[0], G.sim.y[0]); }
  function pocketAt(wx, wy) {
    for (var q = 0; q < 6; q++) {
      var p = P.POCKETS[q];
      if (Math.hypot(wx - p.x, wy - p.y) < 0.09) return q;
    }
    return -1;
  }
  function canCall() { return G.st && G.st.callBlack && Rules.onBlack(G.st, G.st.turn); }
  function aimAtScreen(px, py) {
    var w = renderer.toWorld(px, py);
    var dx = w[0] - G.sim.x[0], dy = w[1] - G.sim.y[0];
    if (dx * dx + dy * dy < 1e-6) return;
    G.aim = norm(dx, dy);
  }
  function screenAngle(px, py) { var c = cueScreen(); return Math.atan2(py - c[1], px - c[0]); }

  canvas.addEventListener('pointerdown', function (e) {
    Audio.unlock();
    if (!isLocalTurn() || ptr) return;
    var pos = eventPos(e), w = renderer.toWorld(pos[0], pos[1]);
    var touch = e.pointerType !== 'mouse';
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    var c = cueScreen();
    var dCue = Math.hypot(pos[0] - c[0], pos[1] - c[1]);
    var grab = Math.max(R * renderer.s * (touch ? 2.6 : 1.6), touch ? 30 : 0);
    if (G.st.bih && dCue < grab) {
      ptr = { id: e.pointerId, kind: 'ball', off: [G.sim.x[0] - w[0], G.sim.y[0] - w[1]], touch: touch };
      return;
    }
    if (canCall()) {
      var q = pocketAt(w[0], w[1]);
      if (q >= 0) { ptr = { id: e.pointerId, kind: 'call', pocket: q, start: pos }; return; }
    }
    if (touch) {
      ptr = { id: e.pointerId, kind: 'rotate', start: pos, t0: performance.now(), a0: screenAngle(pos[0], pos[1]), aim0: G.aim.slice(), moved: false };
    } else {
      ptr = { id: e.pointerId, kind: 'pull', start: pos, moved: false };
    }
  });

  canvas.addEventListener('pointermove', function (e) {
    var pos = eventPos(e);
    if (!ptr) {
      if (e.pointerType === 'mouse' && isLocalTurn()) {
        var c = cueScreen();
        var near = G.st.bih && Math.hypot(pos[0] - c[0], pos[1] - c[1]) < R * renderer.s * 1.6;
        canvas.style.cursor = near ? 'grab' : 'crosshair';
        if (shiftDown && lastMouse) {
          var a1 = screenAngle(lastMouse[0], lastMouse[1]), a2 = screenAngle(pos[0], pos[1]);
          var da = a2 - a1; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
          var sd = renderer.dirToScreen(G.aim[0], G.aim[1]);
          var ns = rot(sd, da * 0.08);
          G.aim = norm.apply(null, renderer.dirToWorld(ns[0], ns[1]));
        } else if (!near) aimAtScreen(pos[0], pos[1]);
      }
      lastMouse = pos;
      return;
    }
    if (e.pointerId !== ptr.id) return;
    if (ptr.kind === 'ball') {
      var w = renderer.toWorld(pos[0], pos[1]);
      var x = clamp(w[0] + ptr.off[0], R, G.st.baulk ? P.BAULK_X : L - R), y = clamp(w[1] + ptr.off[1], R, W - R);
      ptr.dragged = true;
      if (P.validCueSpot(G.sim, x, y, G.st.baulk)) { G.sim.x[0] = x; G.sim.y[0] = y; ptr.bad = false; }
      else {
        // slide along obstacles: take the nearest legal spot close to the finger
        var n = P.nearestCueSpot(G.sim, x, y, G.st.baulk);
        if (Math.hypot(n[0] - x, n[1] - y) < 2 * R) { G.sim.x[0] = n[0]; G.sim.y[0] = n[1]; }
        ptr.bad = true;
      }
    } else if (ptr.kind === 'rotate') {
      var moved = Math.hypot(pos[0] - ptr.start[0], pos[1] - ptr.start[1]);
      if (moved > 6) ptr.moved = true;
      if (ptr.moved) {
        var a = screenAngle(pos[0], pos[1]);
        var d = a - ptr.a0; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
        // finer when the finger is far from the cue ball
        var sd0 = renderer.dirToScreen(ptr.aim0[0], ptr.aim0[1]);
        var ns2 = rot(sd0, d);
        G.aim = norm.apply(null, renderer.dirToWorld(ns2[0], ns2[1]));
      }
    } else if (ptr.kind === 'pull') {
      var sdir = renderer.dirToScreen(G.aim[0], G.aim[1]);
      var back = -((pos[0] - ptr.start[0]) * sdir[0] + (pos[1] - ptr.start[1]) * sdir[1]);
      var range = Math.max(140, Math.min(320, renderer.rect.w * 0.3));
      G.power = clamp(back / range, 0, 1);
      if (Math.hypot(pos[0] - ptr.start[0], pos[1] - ptr.start[1]) > 4) ptr.moved = true;
      updatePowerUI();
    }
  });

  function endPointer(e, cancel) {
    if (!ptr || e.pointerId !== ptr.id) return;
    var g = ptr; ptr = null;
    if (!isLocalTurn()) return;
    var pos = eventPos(e);
    if (g.kind === 'ball') {
      if (!P.validCueSpot(G.sim, G.sim.x[0], G.sim.y[0], G.st.baulk)) {
        var n = P.nearestCueSpot(G.sim, G.sim.x[0], G.sim.y[0], G.st.baulk); G.sim.x[0] = n[0]; G.sim.y[0] = n[1];
      }
    } else if (g.kind === 'call') {
      if (Math.hypot(pos[0] - g.start[0], pos[1] - g.start[1]) < 12) { G.call = g.pocket; G.callLocked = true; Audio.tick(); }
    } else if (g.kind === 'rotate') {
      if (!g.moved && performance.now() - g.t0 < 350 && !cancel) aimAtScreen(pos[0], pos[1]);
    } else if (g.kind === 'pull') {
      if (!cancel && G.power > 0.015) shootNow();
      else { G.power = 0; updatePowerUI(); if (!g.moved && !cancel) aimAtScreen(pos[0], pos[1]); }
    }
  }
  canvas.addEventListener('pointerup', function (e) { endPointer(e, false); });
  canvas.addEventListener('pointercancel', function (e) { endPointer(e, true); });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); if (ptr && ptr.kind === 'pull') { ptr = null; G.power = 0; updatePowerUI(); } });

  function shootNow() {
    if (!isLocalTurn() || G.power <= 0.01) return;
    var power = G.power;
    executeShot({ place: G.st.bih ? [G.sim.x[0], G.sim.y[0]] : null, dx: G.aim[0], dy: G.aim[1], power: power, v: P.powerToSpeed(power), sx: G.spin[0], sy: G.spin[1], call: currentCall() }, 'local');
  }
  function currentCall() { return canCall() ? G.call : -1; }

  // ---- power bar
  var powerEl = $('power'), powerPtr = null;
  powerEl.addEventListener('pointerdown', function (e) {
    Audio.unlock();
    if (!isLocalTurn()) return;
    powerEl.setPointerCapture(e.pointerId);
    powerPtr = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.preventDefault();
  });
  powerEl.addEventListener('pointermove', function (e) {
    if (!powerPtr || e.pointerId !== powerPtr.id) return;
    var c = view.ctrl.power;
    var d = c.horiz ? (e.clientX - powerPtr.x) / (c.w * 0.85) : (e.clientY - powerPtr.y) / (c.h * 0.85);
    G.power = clamp(d, 0, 1);
    updatePowerUI();
  });
  function powerUp(e, cancel) {
    if (!powerPtr || e.pointerId !== powerPtr.id) return;
    powerPtr = null;
    if (!cancel && G.power > 0.015) shootNow();
    else { G.power = 0; updatePowerUI(); }
  }
  powerEl.addEventListener('pointerup', function (e) { powerUp(e, false); });
  powerEl.addEventListener('pointercancel', function (e) { powerUp(e, true); });

  function updatePowerUI() {
    var c = view.ctrl && view.ctrl.power;
    if (!c) return;
    var p = G.power;
    var fill = powerEl.querySelector('.fill'), knob = powerEl.querySelector('.knob');
    if (c.horiz) {
      fill.style.clipPath = 'inset(0 ' + ((1 - p) * 100) + '% 0 0)';
      var kw = 26;
      knob.style.left = (4 + p * (c.w - kw - 8)) + 'px'; knob.style.top = '4px'; knob.style.width = kw + 'px'; knob.style.height = (c.h - 8) + 'px';
    } else {
      fill.style.clipPath = 'inset(0 0 ' + ((1 - p) * 100) + '% 0)';
      var kh = 26;
      knob.style.top = (4 + p * (c.h - kh - 8)) + 'px'; knob.style.left = '4px'; knob.style.width = (c.w - 8) + 'px'; knob.style.height = kh + 'px';
    }
    powerEl.querySelector('.pct').textContent = p > 0 ? Math.round(p * 100) + '%' : '';
  }

  // ---- fine aim wheel
  var fineEl = $('fine'), finePtr = null, fineOffset = 0;
  fineEl.addEventListener('pointerdown', function (e) {
    if (!isLocalTurn()) return;
    fineEl.setPointerCapture(e.pointerId);
    finePtr = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.preventDefault();
  });
  fineEl.addEventListener('pointermove', function (e) {
    if (!finePtr || e.pointerId !== finePtr.id || !isLocalTurn()) return;
    var horiz = view.ctrl.fine.horiz;
    var d = horiz ? e.clientX - finePtr.x : e.clientY - finePtr.y;
    finePtr.x = e.clientX; finePtr.y = e.clientY;
    nudgeAim(d * 0.0007 * (horiz ? 1 : -1));
    fineOffset += d;
    drawFine();
  });
  fineEl.addEventListener('pointerup', function () { finePtr = null; });
  fineEl.addEventListener('pointercancel', function () { finePtr = null; });
  function nudgeAim(rad) {
    // positive = clockwise on screen
    var sd = renderer.dirToScreen(G.aim[0], G.aim[1]);
    var ns = rot(sd, rad);
    G.aim = norm.apply(null, renderer.dirToWorld(ns[0], ns[1]));
  }
  function drawFine() {
    var c = $('fine-wheel'), g = c.getContext('2d'), w = c.width, h = c.height;
    if (!view.ctrl) return;
    var horiz = view.ctrl.fine.horiz;
    var grd = horiz ? g.createLinearGradient(0, 0, w, 0) : g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#0e0e0e'); grd.addColorStop(0.5, '#4a4a4a'); grd.addColorStop(1, '#0e0e0e');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    var len = horiz ? w : h, step = 9 * view.dpr;
    var off = ((fineOffset * view.dpr) % step + step) % step;
    for (var p = off - step; p < len + step; p += step) {
      var f = Math.sin(Math.PI * clamp(p / len, 0, 1));
      g.fillStyle = 'rgba(255,255,255,' + (0.08 + 0.3 * f) + ')';
      if (horiz) g.fillRect(p, h * 0.18, Math.max(1, 2 * view.dpr * f), h * 0.64);
      else g.fillRect(w * 0.18, p, w * 0.64, Math.max(1, 2 * view.dpr * f));
    }
  }

  // ---- spin
  function drawSpinMini() { var c = $('spin-mini'); if (c.width) Render.drawSpinFace(c, G.spin[0], G.spin[1], view.dpr || 1); }
  $('spin').addEventListener('click', function () {
    if (!isLocalTurn()) return;
    var big = $('spin-big');
    var css = Math.min(window.innerWidth * 0.7, 230);
    big.width = big.height = Math.round(css * (view.dpr || 1));
    Render.drawSpinFace(big, G.spin[0], G.spin[1], view.dpr || 1);
    $('spin-pop').hidden = false;
  });
  var spinPtr = null;
  function setSpinFrom(e) {
    var big = $('spin-big'), r = big.getBoundingClientRect();
    var x = ((e.clientX - r.left) / r.width - 0.5) * 2 / 0.82, y = -((e.clientY - r.top) / r.height - 0.5) * 2 / 0.82;
    var m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    G.spin = [round(x, 3), round(y, 3)];
    Render.drawSpinFace(big, G.spin[0], G.spin[1], view.dpr || 1);
    drawSpinMini();
  }
  $('spin-big').addEventListener('pointerdown', function (e) { spinPtr = e.pointerId; $('spin-big').setPointerCapture(e.pointerId); setSpinFrom(e); });
  $('spin-big').addEventListener('pointermove', function (e) { if (spinPtr === e.pointerId) setSpinFrom(e); });
  $('spin-big').addEventListener('pointerup', function () { spinPtr = null; });
  $('btn-spin-reset').addEventListener('click', function () { G.spin = [0, 0]; Render.drawSpinFace($('spin-big'), 0, 0, view.dpr || 1); drawSpinMini(); });
  $('btn-spin-done').addEventListener('click', function () { $('spin-pop').hidden = true; });
  $('spin-pop').addEventListener('pointerdown', function (e) { if (e.target === $('spin-pop')) $('spin-pop').hidden = true; });

  // ---- keyboard
  var keys = {};
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'INPUT') return;
    shiftDown = e.shiftKey;
    var k = e.key;
    if (k === 'm' || k === 'M') { toggleMute(); return; }
    if (k === 'Escape') {
      if (!$('spin-pop').hidden) { $('spin-pop').hidden = true; return; }
      if (G.mode && $('pause').hidden && $('over').hidden && $('dialog').hidden) openPause();
      else if (!$('pause').hidden) closePause();
      return;
    }
    if (!isLocalTurn()) return;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Enter') e.preventDefault();
    if (k === 'ArrowLeft' || k === 'ArrowRight') {
      keys[k] = keys[k] ? keys[k] + 1 : 1;
      var step = (e.shiftKey ? 0.02 : 0.25) * Math.PI / 180 * Math.min(6, 1 + keys[k] * 0.15);
      nudgeAim(k === 'ArrowLeft' ? -step : step);
    } else if (k === 'ArrowUp' || k === 'ArrowDown') {
      G.power = clamp(G.power + (k === 'ArrowUp' ? 0.05 : -0.05), 0, 1); updatePowerUI();
    } else if (k === ' ' || k === 'Enter') {
      if (G.power > 0.015) shootNow(); else toast('Set the power first (Up arrow, the power bar, or pull back on the table)', '', 2200);
    } else if (k === '0') { G.spin = [0, 0]; drawSpinMini(); }
  });
  window.addEventListener('keyup', function (e) { shiftDown = e.shiftKey; keys[e.key] = 0; });

  function toggleMute() {
    settings.mute = !settings.mute; save('mute', settings.mute);
    Audio.setMuted(settings.mute);
    Audio.unlock();
    var b = $('btn-mute');
    b.querySelector('.wave').toggleAttribute('hidden', settings.mute);
    b.querySelector('.x').toggleAttribute('hidden', !settings.mute);
    b.setAttribute('aria-label', settings.mute ? 'Unmute' : 'Mute');
  }
  $('btn-mute').addEventListener('click', toggleMute);
  if (settings.mute) { $('btn-mute').querySelector('.wave').setAttribute('hidden', ''); $('btn-mute').querySelector('.x').removeAttribute('hidden'); }

  // ------------------------------------------------------------ bot
  function updateBot(dt) {
    var p = cur();
    if (!p || p.kind !== 'bot' || G.phase !== 'aim') return;
    var fast = G.speed > 1 || window.__pool.instant;
    if (!G.bot) {
      G.bot = { it: Bot.think(G.sim, G.st, { level: p.level, rng: G.botRng }), t: 0, plan: null, hint: null, stage: 'think', anim: 0, minThink: (0.45 + 0.15 * p.level + G.botRng() * 0.25) };
      G.cueView = { dx: G.aim[0], dy: G.aim[1], pull: pullOf(0), alpha: 1 };
    }
    var b = G.bot;
    b.t += dt * (fast ? 25 : 1);
    if (b.stage === 'think') {
      var t0 = performance.now();
      while (!b.plan && performance.now() - t0 < (fast ? 40 : 7)) {
        var r = b.it.next();
        if (r.done) { b.plan = r.value; break; }
        if (r.value) b.hint = r.value;
      }
      if (b.hint) {
        if (b.hint.place && G.st.bih) moveCueToward(b.hint.place, dt * 4);
        turnCueToward([b.hint.dx, b.hint.dy], dt * 5);
      }
      if (b.plan && b.t >= b.minThink) { b.stage = 'line'; b.anim = 0; }
    } else if (b.stage === 'line') {
      b.anim += dt * (fast ? 25 : 1);
      if (b.plan.place && G.st.bih) moveCueToward(b.plan.place, dt * 8);
      turnCueToward([b.plan.dx, b.plan.dy], dt * 9);
      if (b.anim > 0.3) {
        G.aim = [b.plan.dx, b.plan.dy];
        b.stage = 'pull'; b.anim = 0;
      }
    } else if (b.stage === 'pull') {
      b.anim += dt * (fast ? 25 : 1);
      var f = clamp(b.anim / 0.4, 0, 1);
      G.cueView.dx = b.plan.dx; G.cueView.dy = b.plan.dy;
      G.cueView.pull = pullOf(b.plan.power * (f < 0.8 ? f / 0.8 : 1));
      if (b.anim > 0.5) {
        var pl = b.plan;
        G.bot = null;
        executeShot({ place: pl.place, dx: pl.dx, dy: pl.dy, power: pl.power, v: P.powerToSpeed(pl.power), sx: pl.sx, sy: pl.sy, call: pl.call }, 'bot');
      }
    }
  }
  function turnCueToward(d, k) {
    var cv = G.cueView;
    var a0 = Math.atan2(cv.dy, cv.dx), a1 = Math.atan2(d[1], d[0]);
    var da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
    var a = a0 + da * Math.min(1, k);
    cv.dx = Math.cos(a); cv.dy = Math.sin(a); cv.alpha = 1;
  }
  function moveCueToward(p, k) {
    var sim = G.sim, f = Math.min(1, k);
    var nx = sim.x[0] + (p[0] - sim.x[0]) * f, ny = sim.y[0] + (p[1] - sim.y[0]) * f;
    if (Math.hypot(p[0] - nx, p[1] - ny) < 0.002) { nx = p[0]; ny = p[1]; }
    sim.x[0] = nx; sim.y[0] = ny;
  }

  // ------------------------------------------------------------ online
  var lobbyMode = null;   // 'create' | 'quick' | 'join'
  function onlineError(msg) { $('online-err').textContent = msg; }
  function goOnline(action, code) {
    var nm = ($('name2').value || $('name').value || '').trim().slice(0, 14);
    if (nm) { settings.name = nm; save('name', nm); $('name').value = nm; $('name2').value = nm; }
    onlineError(''); $('lobby-err').textContent = '';
    lobbyMode = action;
    Net.connect();
    var base = { name: settings.name || 'Player', rules: G.rules, callBlack: G.callBlack };
    if (action === 'create') { Net.send(Object.assign({ t: 'create' }, base)); showLobby('create'); }
    else if (action === 'quick') { Net.send(Object.assign({ t: 'quick' }, base)); showLobby('quick'); }
    else if (action === 'join') { Net.send(Object.assign({ t: 'join', code: code }, base)); showLobby('join', code); }
  }
  function showLobby(kind, code) {
    $('lobby-room').hidden = kind !== 'create';
    $('lobby-wait').innerHTML = '<span class="thinking">' + (kind === 'quick' ? 'Looking for an opponent (' + (G.rules === 'wpa' ? 'blackball' : 'pub') + ' rules)' : kind === 'join' ? 'Joining room ' + (code || '') : 'Waiting for an opponent') + '</span>';
    if (kind === 'create') { $('room-code').textContent = '----'; $('room-link').textContent = ''; }
    $('btn-share').hidden = !navigator.share;
    show('lobby');
  }
  Net.on('message', function (msg) {
    var t = msg.t;
    if (t === 'room') {
      if (!msg.code) return;
      G.roomCode = msg.code;
      $('room-code').textContent = msg.code;
      var link = location.origin + location.pathname + '?room=' + msg.code;
      $('room-link').textContent = link;
      G.roomLink = link;
    } else if (t === 'queued') {
      /* waiting */
    } else if (t === 'error') {
      var text = msg.msg === 'no room' ? 'No room with that code.' : msg.msg === 'room full' ? 'That room is already full.' : msg.msg === 'expired' ? 'The room expired.' : 'Server busy, try again.';
      if (G.mode === 'online') return;
      Net.close();
      show('online'); onlineError(text);
    } else if (t === 'start') {
      startOnline(msg);
    } else if (t === 'left') {
      if (G.mode === 'online') opponentGone('Your opponent left the game.');
      else if (!$('lobby').hidden) { show('online'); onlineError('Your opponent left.'); }
    } else if (t === 'rematch_req') {
      G.rematchOffered = true;
      if (G.phase === 'over') {
        $('btn-again').textContent = 'Accept rematch';
        $('over-sub').textContent = (G.players[1 - G.me].name) + ' wants a rematch';
      }
      toast(G.players ? G.players[1 - G.me].name + ' wants a rematch' : 'Rematch?', 'good');
    } else if (G.mode === 'online') {
      if (t === 'aim') onRemoteAim(msg);
      else if (t === 'shot') onRemoteShot(msg);
      else if (t === 'state') onRemoteState(msg);
    }
  });
  Net.on('close', function () {
    if (G.mode === 'online') opponentGone('Connection to the server was lost.');
    else if (!$('lobby').hidden) { show('online'); onlineError('Could not reach the server.'); }
  });
  Net.on('quality', function () { updateHUD(false); });

  function startOnline(msg) {
    var side = msg.side === 1 ? 1 : 0;
    var nm = Array.isArray(msg.names) ? msg.names : ['Player', 'Player'];
    G.mode = 'online';
    G.me = side;
    G.rules = msg.rules === 'wpa' ? 'wpa' : 'pub';
    G.callBlack = !!msg.callBlack;
    if (!G.players || msg.frame === 1) G.frames = [0, 0];
    G.players = [0, 1].map(function (i) { return { name: String(nm[i] || 'Player').slice(0, 14), kind: i === side ? 'human' : 'remote' }; });
    hideScreens(); setGameUI(true); layout();
    G.seed = (msg.seed | 0) || 1;
    P.rack(G.sim, G.seed);
    renderer.randomizeOrientations(G.seed);
    G.st = Rules.newFrame({ mode: G.rules, breaker: msg.breaker === 1 ? 1 : 0, callBlack: G.callBlack });
    G.shotNo = 0; G.sinking = []; G.overShown = false; G.rematchAsked = false; G.rematchOffered = false;
    G.pendingState = null;
    clearToast();
    try { if (location.search) history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
    startTurn(true);
    toast(G.st.turn === G.me ? 'You break' : G.players[G.st.turn].name + ' breaks', 'good');
  }

  function num(v) { return typeof v === 'number' && isFinite(v); }
  function onRemoteAim(m) {
    if (G.phase !== 'aim' || G.st.turn === G.me) return;
    if (!Array.isArray(m.d) || !num(m.d[0]) || !num(m.d[1])) return;
    var d = norm(m.d[0], m.d[1]);
    var r = { dx: d[0], dy: d[1], p: num(m.p) ? clamp(m.p, 0, 1) : 0 };
    if (G.st.bih && Array.isArray(m.c) && num(m.c[0]) && num(m.c[1])) r.c = [clamp(m.c[0], R, L - R), clamp(m.c[1], R, W - R)];
    G.remote = r;
    G.netStats.aimRecv++;
  }
  function onRemoteShot(m) {
    if (G.phase !== 'aim' || G.st.turn === G.me || m.n !== G.shotNo) return;
    if (!Array.isArray(m.d) || !num(m.d[0]) || !num(m.d[1]) || !num(m.v) || m.v < 0 || m.v > P.MAX_SPEED * 1.001) return;
    if (Math.hypot(m.d[0], m.d[1]) < 0.5 || Math.hypot(m.d[0], m.d[1]) > 2) return;
    var s = Array.isArray(m.s) && num(m.s[0]) && num(m.s[1]) ? [clamp(m.s[0], -1, 1), clamp(m.s[1], -1, 1)] : [0, 0];
    var place = null;
    if (G.st.bih) {
      if (!Array.isArray(m.c) || !num(m.c[0]) || !num(m.c[1])) return;
      place = [m.c[0], m.c[1]];
    }
    var call = (m.k | 0) >= 0 && (m.k | 0) < 6 ? m.k | 0 : -1;
    executeShot({ place: place, dx: m.d[0], dy: m.d[1], v: m.v, power: P.speedToPower(m.v), sx: s[0], sy: s[1], call: call }, 'remote');
  }
  function onRemoteState(m) {
    if (!Array.isArray(m.b) || m.b.length !== 16) return;
    var st = Rules.sanitize(m.r);
    if (!st) return;
    var ok = m.b.every(function (b) { return b === 0 || b === null || (Array.isArray(b) && num(b[0]) && num(b[1]) && b[0] > -0.3 && b[0] < L + 0.3 && b[1] > -0.3 && b[1] < W + 0.3); });
    if (!ok) return;
    if (G.phase === 'sync' && m.n === G.shotN) applyRemoteState(m);
    else if ((G.phase === 'roll' || G.phase === 'strike') && m.n === G.shotN) {
      G.pendingState = m;
      if (document.hidden) { if (G.phase === 'strike') beginRoll(); fastForward(); }
    }
  }
  function applyRemoteState(m) {
    var sim = G.sim, mismatch = false;
    for (var i = 0; i < 16; i++) {
      var b = m.b[i];
      if (b && Array.isArray(b)) {
        if (!sim.on[i] || sim.x[i] !== b[0] || sim.y[i] !== b[1]) mismatch = true;
        var keepOn = sim.on[i];
        sim.place(i, b[0], b[1]);
        if (!keepOn) renderer.spriteDirty[i] = true;
      } else {
        if (sim.on[i]) mismatch = true;
        sim.remove(i, -1);
      }
    }
    G.netStats.states++;
    if (mismatch) G.netStats.mismatch++;
    var res = G.localRes || { foul: '', winner: -1, rerack: false, assigned: 0, cont: false };
    var st = Rules.sanitize(m.r);
    var resLike = Object.assign({}, res, { state: st });
    if (st.winner >= 0) { resLike.winner = st.winner; resLike.reason = st.reason; }
    else resLike.winner = -1;
    resLike.rerack = !!(st.brk && (m.rk | 0) > 0);
    resLike.rackSeed = m.rk | 0;
    applyResult(resLike, false);
  }

  function opponentGone(text) {
    if (G.mode !== 'online') return;
    Net.close();
    var wasOver = G.phase === 'over';
    G.mode = 'online-ended';
    $('dialog-title').textContent = wasOver ? 'Opponent left' : 'Game interrupted';
    $('dialog-text').textContent = text;
    var box = $('dialog-buttons');
    box.innerHTML = '';
    var mk = function (label, cls, fn) { var b = document.createElement('button'); b.className = 'btn ' + cls; b.type = 'button'; b.textContent = label; b.onclick = fn; box.appendChild(b); };
    if (!wasOver) mk('Continue vs Bot', 'primary', continueVsBot);
    mk('Menu', '', quitToMenu);
    show('dialog');
  }
  function continueVsBot() {
    var opp = 1 - G.me;
    G.mode = 'bot';
    G.players[opp] = { name: 'Bot · ' + LEVEL_NAMES[G.level], kind: 'bot', level: G.level };
    G.players[G.me].kind = 'human';
    hideScreens();
    // if we were waiting for their result, our own simulation is now the truth
    if (G.phase === 'sync' && G.localRes) applyResult(G.localRes, true);
    G.bot = null;
    updateHUD(true);
  }

  function sendAim(now) {
    if (G.mode !== 'online' || !isLocalTurn() || G.st.turn !== G.me) return;
    if (now - G.lastAimSend < 100) return;
    var m = { t: 'aim', n: G.shotNo, d: [round(G.aim[0], 5), round(G.aim[1], 5)], p: round(G.power, 2) };
    if (G.st.bih) m.c = [round(G.sim.x[0], 4), round(G.sim.y[0], 4)];
    var key = JSON.stringify(m);
    if (key === G.lastAimKey && now - G.lastAimSend < 1000) return;
    G.lastAimKey = key; G.lastAimSend = now;
    Net.send(m);
    G.netStats.aimSent++;
  }

  // ------------------------------------------------------------ HUD
  var hudCache = {};
  function setText(el, text) { if (el.textContent !== text) el.textContent = text; }
  function updateHUD(force) {
    if (!G.st || !G.players) return;
    var st = G.st;
    for (var p = 0; p < 2; p++) {
      var card = $('p' + p);
      card.classList.toggle('turn', st.turn === p && G.phase !== 'over');
      setText(card.querySelector('.pname'), G.players[p].name);
      var g = st.groups[p];
      var chip = card.querySelector('.chip');
      var onB = Rules.onBlack(st, p);
      chip.className = 'chip' + (onB ? ' black' : g === 1 ? ' red' : g === 2 ? ' yellow' : '');
      var pips = card.querySelector('.pips');
      var left = Rules.remaining(st, g);
      var narrow = window.innerWidth <= 480;
      var key = g + ':' + left + ':' + onB;
      if (hudCache['pips' + p] !== key) {
        hudCache['pips' + p] = key;
        var html = '';
        if (g && !onB) for (var i = 0; i < 7; i++) html += '<i class="pip ' + (g === 1 ? 'red' : 'yellow') + (i < left ? ' on' : '') + '"></i>';
        pips.innerHTML = html;
      }
      var vis = card.querySelector('.visits');
      var vt = '';
      if (st.turn === p && G.phase !== 'over' && st.winner < 0) {
        if (st.mode === 'pub' && st.visits === 2) vt = st.free && !narrow ? '2 shots · free' : '2 shots';
        if (st.bih && !st.brk) vt = vt ? (narrow ? vt : vt + ' · in hand') : (narrow ? 'in hand' : 'Ball in hand');
      }
      if (!g && !onB) setText(card.querySelector('.frames'), st.brk ? '' : 'open table');
      else setText(card.querySelector('.frames'), onB ? 'on the black' : narrow ? '' : left + ' left');
      vis.hidden = !vt; setText(vis, vt);
    }
    // status line
    var status = '', hint = '', thinking = false;
    var c = cur();
    if (G.phase === 'aim') {
      if (c.kind === 'bot') { status = c.name.split(' · ')[0] + ' is thinking'; thinking = true; }
      else if (c.kind === 'remote') status = c.name + "'s shot";
      else status = G.mode === 'local' ? c.name + ' to play' : 'Your shot';
      if (c.kind === 'human') {
        if (st.brk) hint = 'Break: place the cue ball behind the baulk line';
        else if (st.bih) hint = 'Ball in hand: drag the cue ball' + (st.baulk ? ' (behind baulk)' : '');
        else if (st.free) hint = 'Free shot: you may hit any ball first';
        else if (st.mode === 'pub' && st.visits === 2) hint = 'You have 2 shots';
        if (canCall()) hint = (hint ? hint + ' · ' : '') + 'Tap a pocket to call the black';
        if (st.outOfBaulk && !st.free && !st.brk) hint = (hint ? hint + ' · ' : '') + 'play out of baulk';
      } else if (st.free) hint = 'Free shot';
    } else if (G.phase === 'sync') status = 'Syncing…';
    else if (G.phase === 'over') status = 'Frame over';
    else status = G.lastStatus || '';
    if (G.phase === 'aim' || G.phase === 'sync' || G.phase === 'over') G.lastStatus = status;
    var se = $('status');
    setText(se, status);
    se.classList.toggle('thinking', thinking);
    setText($('hint'), hint ? hint.charAt(0).toUpperCase() + hint.slice(1) : '');
    var net = $('net');
    net.hidden = G.mode !== 'online';
    if (G.mode === 'online') {
      net.className = 'net q' + Net.quality;
      setText($('net-label'), Net.quality === 3 ? 'online' : Net.quality === 2 ? 'slow' : Net.quality === 1 ? 'poor' : 'offline');
    }
    // controls enabled only on a local human turn
    var on = isLocalTurn();
    ['power', 'spin', 'fine'].forEach(function (id) { $(id).classList.toggle('disabled', !on); });
    void force;
  }

  // ------------------------------------------------------------ menu
  function refreshMenu() {
    $('name').value = settings.name;
    $('name2').value = settings.name;
    document.querySelectorAll('#rules-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.rules === G.rules)); });
    document.querySelectorAll('#level-seg button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.level === G.level)); });
    $('opt-call').checked = G.callBlack;
    $('opt-blue').checked = settings.cloth === 'blue';
    var s = settings.stats[LEVEL_NAMES[G.level]];
    $('bot-stats').textContent = s && (s.w || s.l) ? 'vs ' + LEVEL_NAMES[G.level] + ': ' + s.w + ' won · ' + s.l + ' lost' : 'Pick a level and play';
    $('quick-rules').textContent = (G.rules === 'wpa' ? 'blackball' : 'pub') + ' rules';
  }
  function saveName(v) { settings.name = v.trim().slice(0, 14); save('name', settings.name); }
  $('name').addEventListener('input', function () { saveName(this.value); });
  $('name2').addEventListener('input', function () { saveName(this.value); $('name').value = this.value; });
  document.querySelectorAll('#rules-seg button').forEach(function (b) {
    b.addEventListener('click', function () { G.rules = b.dataset.rules; save('rules', G.rules); refreshMenu(); Audio.unlock(); });
  });
  document.querySelectorAll('#level-seg button').forEach(function (b) {
    b.addEventListener('click', function () { G.level = +b.dataset.level; save('level', G.level); refreshMenu(); });
  });
  $('opt-call').addEventListener('change', function () { G.callBlack = this.checked; save('callBlack', G.callBlack); });
  $('opt-blue').addEventListener('change', function () {
    settings.cloth = this.checked ? 'blue' : 'green'; save('cloth', settings.cloth);
    renderer.cloth = settings.cloth; renderer.buildTable();
  });
  $('btn-bot').addEventListener('click', function () { startGame('bot'); });
  $('btn-local').addEventListener('click', function () { startGame('local'); });
  $('btn-online').addEventListener('click', function () { refreshMenu(); onlineError(''); show('online'); Audio.unlock(); });
  $('btn-online-back').addEventListener('click', function () { Net.close(); show('menu'); });
  $('btn-quick').addEventListener('click', function () { goOnline('quick'); });
  $('btn-create').addEventListener('click', function () { goOnline('create'); });
  $('btn-join').addEventListener('click', function () {
    var code = $('join-code').value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) { onlineError('Enter the 4-letter room code.'); return; }
    goOnline('join', code);
  });
  $('join-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('btn-join').click(); });
  $('btn-lobby-cancel').addEventListener('click', function () { Net.send({ t: 'cancel' }); Net.close(); show('online'); });
  $('btn-copy').addEventListener('click', function () {
    var link = G.roomLink || '';
    var done = function () { $('btn-copy').textContent = 'Copied!'; setTimeout(function () { $('btn-copy').textContent = 'Copy link'; }, 1500); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { fallbackCopy(link); done(); });
      else { fallbackCopy(link); done(); }
    } catch (e) { fallbackCopy(link); done(); }
  });
  function fallbackCopy(text) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
  $('btn-share').addEventListener('click', function () {
    if (navigator.share) navigator.share({ title: 'Pool', text: 'Play English pool with me, room ' + G.roomCode, url: G.roomLink }).catch(function () {});
  });
  $('btn-help').addEventListener('click', function () { helpReturn = 'menu'; show('help'); });
  $('btn-help-close').addEventListener('click', function () { if (helpReturn === 'pause') show('pause'); else show('menu'); });
  $('btn-menu').addEventListener('click', openPause);
  function openPause() {
    if (!G.mode || G.phase === 'over') return;
    $('btn-restart').hidden = G.mode === 'online';
    $('btn-quit').textContent = G.mode === 'online' ? 'Leave game' : 'Quit to menu';
    show('pause');
  }
  function closePause() { hideScreens(); }
  $('btn-resume').addEventListener('click', closePause);
  $('btn-restart').addEventListener('click', function () { hideScreens(); newFrame(G.st ? G.st.breaker : 0); });
  $('btn-pause-help').addEventListener('click', function () { helpReturn = 'pause'; show('help'); });
  $('btn-quit').addEventListener('click', quitToMenu);
  $('btn-over-menu').addEventListener('click', quitToMenu);
  $('btn-again').addEventListener('click', function () {
    if (G.mode === 'online') {
      Net.send({ t: 'rematch' });
      G.rematchAsked = true;
      $('btn-again').disabled = true;
      $('btn-again').textContent = 'Waiting for opponent…';
      return;
    }
    if (G.mode === 'online-ended') { quitToMenu(); return; }
    hideScreens();
    newFrame(1 - (G.st ? G.st.breaker : 1));
  });

  // ------------------------------------------------------------ loop
  var last = performance.now();
  var hudTimer = 0;
  function frame(now) {
    var dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    try { update(dt, now); draw(); } catch (e) { errors.push(String(e && e.stack || e)); if (window.console) console.error(e); }
    requestAnimationFrame(frame);
  }

  function update(dt, now) {
    // sinking animation
    for (var i = G.sinking.length - 1; i >= 0; i--) { G.sinking[i].t += dt; if (G.sinking[i].t > 0.34) G.sinking.splice(i, 1); }
    if (!G.st) return;
    if (G.phase === 'strike') {
      G.strikeT += dt * Math.max(1, G.speed);
      var f = Math.min(1, G.strikeT / 0.09);
      G.cueView.pull = G.cueView.from + (0.002 - G.cueView.from) * f * f;
      if (f >= 1) beginRoll();
    } else if (G.phase === 'roll') {
      G.cueView.alpha = Math.max(0, G.cueView.alpha - dt * 4);
      G.acc += dt * G.speed;
      var steps = 0, maxSteps = G.speed > 1 ? 4000 : 48;
      while (G.acc >= P.DT && steps < maxSteps) {
        stepPhysics(); G.acc -= P.DT; steps++;
        if (!G.sim.moving()) break;
        if (G.sim.time >= P.MAX_TIME) { G.sim.stopAll(); break; }
      }
      if (G.acc > P.DT * 4) G.acc = P.DT * 4;
      processEvents(G.speed > 3);
      if (!G.sim.moving()) finishShot();
    } else if (G.phase === 'aim') {
      var c = cur();
      if (c.kind === 'human') {
        G.cueView = { dx: G.aim[0], dy: G.aim[1], pull: pullOf(G.power), alpha: 1 };
        sendAim(now);
      } else if (c.kind === 'remote') {
        var r = G.remote;
        if (r) {
          // the stream is rounded: only follow real moves, the shot carries the exact spot
        if (r.c && Math.hypot(r.c[0] - G.sim.x[0], r.c[1] - G.sim.y[0]) > 1e-3) moveCueToward(r.c, dt * 12);
          turnCueToward([r.dx, r.dy], dt * 12);
          G.cueView.pull = G.cueView.pull + (pullOf(r.p) - G.cueView.pull) * Math.min(1, dt * 12);
        } else G.cueView.alpha = Math.min(1, (G.cueView.alpha || 0) + dt * 3);
      } else if (c.kind === 'bot') updateBot(dt);
    }
    hudTimer += dt;
    if (hudTimer > 0.2) { hudTimer = 0; updateHUD(false); }
  }

  function draw() {
    var sim = G.sim;
    if (!G.st) { renderer.draw({ sim: sim, sinking: G.sinking }); return; }
    var st = G.st, scene = { sim: sim, sinking: G.sinking, call: -1 };
    var local = isLocalTurn();
    if (G.phase === 'aim' || G.phase === 'strike' || (G.phase === 'roll' && G.cueView && G.cueView.alpha > 0)) scene.cue = G.cueView;
    if (local) {
      var g = P.predictAim(sim, G.aim[0], G.aim[1]);
      g.len = G.mode === 'bot' ? GUIDES[G.players[1].level] : GUIDE_2P;
      if (g.type === 'ball') {
        g.bad = !Rules.legalFirst(st, g.ball) || (st.outOfBaulk && !st.free && sim.x[g.ball] < P.BAULK_X && !(g.gx > P.BAULK_X));
        if (canCall() && !G.callLocked && g.ball === 8 && g.objPocket >= 0) G.call = g.objPocket;
      }
      scene.guide = g;
    }
    if (G.phase === 'aim' && canCall()) { scene.call = G.call; scene.callAuto = !G.callLocked; }
    if (G.phase === 'aim' && st.bih) scene.bih = { baulk: st.baulk, ok: !(ptr && ptr.kind === 'ball' && ptr.bad), dragging: !!(ptr && ptr.kind === 'ball'), hint: local };
    renderer.draw(scene);
  }

  // ------------------------------------------------------------ boot
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && G.st) {
      if (G.phase === 'strike') { beginRoll(); fastForward(); }
      else if (G.phase === 'roll') fastForward();
    }
  });
  // stop the page from scrolling / zooming on touch devices
  document.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.help, .screen')) e.preventDefault(); }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
  document.addEventListener('dblclick', function (e) { e.preventDefault(); });

  // debug / test hook
  window.__pool = {
    get G() { return G; },
    errors: errors,
    instant: false,
    set speed(v) { G.speed = Math.max(0.1, +v || 1); },
    get speed() { return G.speed; },
    renderer: renderer,
    state: function () {
      return {
        mode: G.mode, phase: G.phase, me: G.me, shotNo: G.shotNo, st: G.st ? JSON.parse(JSON.stringify(G.st)) : null,
        balls: G.sim.snapshot(), players: G.players ? G.players.map(function (p) { return { name: p.name, kind: p.kind }; }) : null,
        frames: G.frames.slice(), net: Object.assign({}, G.netStats)
      };
    },
    isLocalTurn: isLocalTurn,
    /** Take a shot as the local human: {dx,dy | angle(deg), power, sx, sy, place, call} */
    shoot: function (o) {
      if (!isLocalTurn()) return false;
      var d = o.angle !== undefined ? [Math.cos(o.angle * Math.PI / 180), Math.sin(o.angle * Math.PI / 180)] : norm(o.dx, o.dy);
      if (o.place && G.st.bih) { G.sim.x[0] = o.place[0]; G.sim.y[0] = o.place[1]; }
      G.aim = d; G.power = o.power || 0.5; G.spin = [o.sx || 0, o.sy || 0];
      if (o.call !== undefined) { G.call = o.call; G.callLocked = true; }
      shootNow();
      return true;
    },
    aimAt: function (b) { if (G.sim.on[b]) G.aim = norm(G.sim.x[b] - G.sim.x[0], G.sim.y[b] - G.sim.y[0]); return G.aim; },
    /** Rearrange the table: balls {n: [x,y] | null}; patch merges into the rules state. */
    setup: function (balls, patch) {
      if (balls) Object.keys(balls).forEach(function (k) { var b = balls[k]; if (b) G.sim.place(+k, b[0], b[1]); else G.sim.remove(+k, -1); });
      if (patch) Object.assign(G.st, patch);
      prepareInHand();
      startTurn(true);
    },
    toScreen: function (x, y) { var r = canvas.getBoundingClientRect(); var p = renderer.toScreen(x, y); return [p[0] + r.left, p[1] + r.top]; },
    layout: function () { return { portrait: view.portrait, rect: renderer.rect, ctrl: view.ctrl }; }
  };

  refreshMenu();
  layout();
  show('menu');
  // share links: ?room=CODE joins straight away
  var qs = new URLSearchParams(location.search);
  var roomParam = (qs.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (roomParam.length === 4) { $('join-code').value = roomParam; goOnline('join', roomParam); }
  requestAnimationFrame(frame);
})();
