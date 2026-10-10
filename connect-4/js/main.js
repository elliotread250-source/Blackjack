/* Connect 4: the page. Board rendering and animation on a canvas, input
 * (mouse, touch, keyboard), the three modes (vs bot, pass and play, online),
 * menus, scores and the win effects. Rules live in logic.js, the bot in
 * bot.js (run in worker.js), sounds in audio.js and the socket in net.js. */
(function () {
  'use strict';
  var L = window.C4Logic, Bot = window.C4Bot, Sound = window.C4Audio, Net = window.C4Net;
  var $ = function (id) { return document.getElementById(id); };
  function load(key, def) { try { var v = localStorage.getItem('c4.' + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
  function save(key, val) { try { localStorage.setItem('c4.' + key, JSON.stringify(val)); } catch (e) { /* private mode */ } }
  function now() { return performance.now(); }

  var LEVELS = ['easy', 'medium', 'hard', 'impossible'];
  var LEVEL_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard', impossible: 'Impossible' };
  var COLOR_NAMES = ['Red', 'Yellow'];
  var EMOTES = ['👍', '😮', '😂', '😭', '🔥', '👏', '🤔', '😎'];

  var settings = {
    name: String(load('name', '') || '').slice(0, 14),
    level: load('level', 'medium'),
    first: load('first', 'you'),
    muted: !!load('muted', false)
  };
  if (LEVELS.indexOf(settings.level) < 0) settings.level = 'medium';
  if (['you', 'bot', 'alt'].indexOf(settings.first) < 0) settings.first = 'you';
  var stats = load('stats', {});
  if (!stats || typeof stats !== 'object') stats = {};
  Sound.setMuted(settings.muted);

  // ------------------------------------------------------------------ state
  var S = {
    mode: null,               // 'bot' | 'local' | 'online' | 'ended' | null (menus)
    game: L.newGame(1),
    players: [{ name: 'You', meta: '' }, { name: 'Bot', meta: '' }],
    level: settings.level,
    humanSide: 0,             // vs bot: the side (0 red, 1 yellow) the person plays
    score: [0, 0, 0],         // red wins, yellow wins, draws (this session)
    counted: false,
    gameNo: 0,
    thinking: false,
    botMove: null,            // { col, at } waiting to be played
    botCol: 3,                // where the bot's preview disc hovers
    win: null,                // { cells, t0 } once the winning disc has landed
    over: false,              // result shown
    // online
    side: 0, code: null, token: null, onlineGame: 0, pending: false, pendingAt: 0,
    oppAway: false, reconnecting: false, rematchAsked: false, rematchOffered: false,
    // input
    cursor: 3, hoverCol: -1, previewX: -1
  };
  var anims = [];             // falling / lifting discs

  // --------------------------------------------------------------- helpers
  function setText(el, t) { if (el.textContent !== t) el.textContent = t; }
  var toastTimer = 0;
  function toast(msg, kind, ms) {
    var el = $('toast');
    el.textContent = msg;
    el.className = 'show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = ''; }, ms || 2200);
  }
  function sideOfTurn() { return S.game.turn - 1; }
  function busy() { return anims.length > 0; }

  // ------------------------------------------------------------- rendering
  var canvas = $('board'), ctx = canvas.getContext('2d');
  var fx = $('fx'), fctx = fx.getContext('2d');
  var geo = { s: 60, pad: 10, top: 60, w: 400, h: 400, dpr: 1 };
  var boardLayer = null, discSprite = [null, null], dirty = true;
  var BW = 7.36, BH = 7.5;    // canvas size in cells: board + frame, preview row + board + shadow

  function layout() {
    var stage = $('stage');
    var W = stage.clientWidth, H = stage.clientHeight;
    var s = Math.max(24, Math.min(W / BW, H / BH, 96));
    s = Math.floor(s * 2) / 2;
    geo.s = s; geo.pad = 0.18 * s; geo.top = 1.0 * s;
    geo.w = Math.round(BW * s); geo.h = Math.round(BH * s);
    geo.dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.style.width = geo.w + 'px'; canvas.style.height = geo.h + 'px';
    canvas.width = Math.round(geo.w * geo.dpr); canvas.height = Math.round(geo.h * geo.dpr);
    buildBoard(); buildDiscs();
    var d = geo.dpr;
    fx.width = Math.round(window.innerWidth * d); fx.height = Math.round(window.innerHeight * d);
    dirty = true;
  }
  function cellX(c) { return geo.pad + geo.s * (c + 0.5); }
  function cellY(r) { return geo.top + geo.pad + geo.s * (5.5 - r); }
  var PREVIEW_ROW = 0;        // row coordinate of the preview disc, set in buildBoard
  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function buildBoard() {
    var d = geo.dpr, s = geo.s * d, pad = geo.pad * d;
    var w = Math.round(7 * s + 2 * pad), h = Math.round(6 * s + 2 * pad);
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d');
    var grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#3d80f7'); grad.addColorStop(0.5, '#2458d6'); grad.addColorStop(1, '#1a43ae');
    roundRect(g, 0, 0, w, h, 0.3 * s); g.fillStyle = grad; g.fill();
    // a soft sheen across the top
    var sheen = g.createLinearGradient(0, 0, 0, h * 0.5);
    sheen.addColorStop(0, 'rgba(255,255,255,0.16)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sheen; roundRect(g, 0, 0, w, h * 0.5, 0.3 * s); g.fill();
    var hr = 0.395 * s;
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000'; // Opaque mask: the transparent sheen must not weaken hole cutouts.
    for (var r = 0; r < 6; r++) for (var col = 0; col < 7; col++) {
      g.beginPath(); g.arc(pad + s * (col + 0.5), pad + s * (r + 0.5), hr, 0, Math.PI * 2); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    // bevelled hole rims: dark above, light below
    g.lineWidth = 0.055 * s;
    for (r = 0; r < 6; r++) for (col = 0; col < 7; col++) {
      var x = pad + s * (col + 0.5), y = pad + s * (r + 0.5);
      var rim = g.createLinearGradient(x, y - hr, x, y + hr);
      rim.addColorStop(0, 'rgba(5,15,60,0.55)'); rim.addColorStop(0.5, 'rgba(10,30,100,0.15)'); rim.addColorStop(1, 'rgba(170,205,255,0.5)');
      g.strokeStyle = rim; g.beginPath(); g.arc(x, y, hr + 0.02 * s, 0, Math.PI * 2); g.stroke();
    }
    // frame edge
    var edge = g.createLinearGradient(0, 0, 0, h);
    edge.addColorStop(0, 'rgba(255,255,255,0.45)'); edge.addColorStop(0.3, 'rgba(255,255,255,0.08)'); edge.addColorStop(1, 'rgba(0,10,60,0.5)');
    g.lineWidth = Math.max(1.5, 0.03 * s); g.strokeStyle = edge;
    roundRect(g, g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth, 0.3 * s - g.lineWidth / 2); g.stroke();
    boardLayer = c;
    PREVIEW_ROW = 5.5 + (geo.top + geo.pad - geo.top * 0.5) / geo.s;
  }

  function buildDiscs() {
    var d = geo.dpr, r = 0.42 * geo.s * d;
    var size = Math.ceil(2 * r + 4);
    var COLORS = [['#ff9aa2', '#ef3b4a', '#a10f1d', '#c81f2e'], ['#fff3b0', '#ffc933', '#b88300', '#e8aa12']];
    for (var p = 0; p < 2; p++) {
      var c = document.createElement('canvas'); c.width = c.height = size;
      var g = c.getContext('2d'), cx = size / 2, cy = size / 2, k = COLORS[p];
      var grad = g.createRadialGradient(cx - 0.35 * r, cy - 0.4 * r, 0.05 * r, cx, cy, r);
      grad.addColorStop(0, k[0]); grad.addColorStop(0.45, k[1]); grad.addColorStop(1, k[2]);
      g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      // the moulded inner ring of a real disc
      g.lineWidth = 0.09 * r; g.strokeStyle = 'rgba(0,0,0,0.2)';
      g.beginPath(); g.arc(cx, cy, 0.66 * r, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 0.05 * r; g.strokeStyle = 'rgba(255,255,255,0.22)';
      g.beginPath(); g.arc(cx + 0.03 * r, cy + 0.04 * r, 0.73 * r, 0, Math.PI * 2); g.stroke();
      var face = g.createRadialGradient(cx - 0.2 * r, cy - 0.25 * r, 0, cx, cy, 0.62 * r);
      face.addColorStop(0, 'rgba(255,255,255,0.12)'); face.addColorStop(1, 'rgba(0,0,0,0.06)');
      g.fillStyle = face; g.beginPath(); g.arc(cx, cy, 0.62 * r, 0, Math.PI * 2); g.fill();
      g.save(); g.translate(cx - 0.36 * r, cy - 0.46 * r); g.rotate(-0.6);
      g.fillStyle = 'rgba(255,255,255,0.32)'; g.beginPath(); g.ellipse(0, 0, 0.3 * r, 0.14 * r, 0, 0, Math.PI * 2); g.fill();
      g.restore();
      g.lineWidth = Math.max(1, 0.04 * r); g.strokeStyle = 'rgba(0,0,0,0.25)';
      g.beginPath(); g.arc(cx, cy, r - g.lineWidth / 2, 0, Math.PI * 2); g.stroke();
      discSprite[p] = c;
    }
  }
  function drawDisc(side, x, y, alpha) {
    var img = discSprite[side], sz = img.width / geo.dpr;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - sz / 2, y - sz / 2, sz, sz);
    ctx.globalAlpha = 1;
  }

  function previewInfo() {
    if (!S.mode || S.mode === 'ended' || S.game.result || busy()) return null;
    var side = sideOfTurn();
    if (S.mode === 'bot' && side !== S.humanSide) return { side: side, col: S.botMove ? S.botMove.col : S.botCol, alpha: 0.9 };
    if (!isHumanTurn() && !(S.mode === 'online' && S.pending)) return null;
    var col = S.hoverCol >= 0 ? S.hoverCol : S.cursor;
    return { side: side, col: col, alpha: S.hoverCol >= 0 || S.keyActive ? 1 : 0.55, highlight: S.hoverCol >= 0 || S.keyActive };
  }

  function draw(t) {
    var s = geo.s, d = geo.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, geo.w, geo.h);
    var bw = 7 * s + 2 * geo.pad, bh = 6 * s + 2 * geo.pad, by = geo.top;
    // what shows through the holes
    var back = ctx.createLinearGradient(0, by, 0, by + bh);
    back.addColorStop(0, '#0a1436'); back.addColorStop(1, '#050b22');
    ctx.fillStyle = back; roundRect(ctx, 3, by + 3, bw - 6, bh - 6, 0.25 * s); ctx.fill();

    var board = S.game.board, winSet = null, winK = 0;
    if (S.win) {
      winSet = {};
      S.win.cells.forEach(function (c) { winSet[c[0] + ',' + c[1]] = 1; });
      winK = Math.min(1, (t - S.win.t0) / 450);
    }
    var hidden = {};
    anims.forEach(function (a) { if (!a.lift) hidden[a.col + ',' + a.row] = 1; });
    for (var r = 0; r < 6; r++) for (var c = 0; c < 7; c++) {
      var p = board[r * 7 + c];
      if (!p || hidden[c + ',' + r]) continue;
      drawDisc(p - 1, cellX(c), cellY(r));
      if (winSet && !winSet[c + ',' + r]) {
        ctx.fillStyle = 'rgba(4,8,30,' + (0.42 * winK).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(cellX(c), cellY(r), 0.42 * s, 0, Math.PI * 2); ctx.fill();
      }
    }
    anims.forEach(function (a) { drawDisc(a.side, cellX(a.col), cellY(a.pos)); });

    // the board, with a soft shadow that falls into the holes
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 0.18 * s; ctx.shadowOffsetY = 0.06 * s;
    ctx.drawImage(boardLayer, 0, by, bw, bh);
    ctx.restore();

    var pv = previewInfo();
    if (pv) {
      var target = cellX(pv.col);
      if (S.previewX < 0) S.previewX = target;
      S.previewX += (target - S.previewX) * 0.35;
      if (Math.abs(target - S.previewX) < 0.5) S.previewX = target;
      if (pv.highlight) {
        ctx.fillStyle = 'rgba(255,255,255,0.075)';
        roundRect(ctx, cellX(pv.col) - 0.47 * s, by + geo.pad * 0.45, 0.94 * s, 6 * s + geo.pad * 1.1, 0.3 * s); ctx.fill();
      }
      var bobY = pv.side === S.humanSide || S.mode !== 'bot' ? 0 : Math.sin(t / 180) * 0.03 * s;
      drawDisc(pv.side, S.previewX, cellY(PREVIEW_ROW) + bobY, pv.alpha);
      if (S.mode === 'online' && S.pending) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath(); ctx.arc(S.previewX, cellY(PREVIEW_ROW), 0.08 * s * (0.6 + 0.4 * Math.sin(t / 90)), 0, Math.PI * 2); ctx.fill();
      }
    } else S.previewX = -1;

    // last move marker
    if (!S.win && !busy() && S.game.moves.length && S.mode) {
      var lc = S.game.moves[S.game.moves.length - 1], lr = L.nextRow(board, lc);
      lr = lr < 0 ? 5 : lr - 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1.5, 0.035 * s);
      ctx.beginPath(); ctx.arc(cellX(lc), cellY(lr), 0.13 * s, 0, Math.PI * 2); ctx.stroke();
    }

    if (S.win) {
      var cells = S.win.cells, pulse = 0.5 + 0.5 * Math.sin(t / 160);
      ctx.lineWidth = 0.075 * s;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 + 0.45 * pulse).toFixed(3) + ')';
      cells.forEach(function (cc) { ctx.beginPath(); ctx.arc(cellX(cc[0]), cellY(cc[1]), 0.44 * s, 0, Math.PI * 2); ctx.stroke(); });
      var a = cells[0], b = cells[cells.length - 1];
      var x0 = cellX(a[0]), y0 = cellY(a[1]), x1 = cellX(b[0]), y1 = cellY(b[1]);
      var e = 1 - Math.pow(1 - winK, 3);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(255,220,120,0.9)'; ctx.shadowBlur = 0.35 * s;
      ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 0.13 * s;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); ctx.stroke();
      ctx.restore();
    }
  }

  // ------------------------------------------------------------ animation
  var GRAV = 58;              // rows per second squared
  function startDrop(res) {
    var from = PREVIEW_ROW;
    if (S.previewX >= 0 && Math.abs(S.previewX - cellX(res.col)) > 1) S.previewX = cellX(res.col);
    anims.push({ col: res.col, row: res.row, side: res.player - 1, pos: from, v: 2.5, bounces: 0, dist: from - res.row, res: res });
    dirty = true;
  }
  function startLift(m) {
    anims.push({ col: m.col, row: m.row, side: m.player - 1, pos: m.row, v: -16, lift: true });
    Sound.lift();
  }
  function stepAnims(dt) {
    for (var i = anims.length - 1; i >= 0; i--) {
      var a = anims[i];
      if (a.lift) {
        a.v -= 40 * dt; a.pos -= a.v * dt;
        if (a.pos > PREVIEW_ROW + 1.5) anims.splice(i, 1);
        continue;
      }
      a.v += GRAV * dt; a.pos -= a.v * dt;
      if (a.pos <= a.row) {
        a.pos = a.row;
        if (a.bounces === 0) Sound.drop(a.dist / 6, a.side + 1);
        else Sound.bounce(Math.min(1, a.v / 8));
        if (a.v > 3.2 && a.bounces < 3) { a.v = -a.v * 0.26; a.bounces++; }
        else { anims.splice(i, 1); landed(a.res); }
      }
    }
  }
  function finishAnims() {
    var list = anims; anims = [];
    list.forEach(function (a) { if (!a.lift && a.res) landed(a.res); });
  }

  /** A disc finished falling. */
  function landed(res) {
    dirty = true;
    if (res.result && S.game.result === res.result && S.game.moves.length && !S.over) finishGame();
  }

  // --------------------------------------------------------------- confetti
  var parts = [];
  function confetti(big) {
    var W = window.innerWidth, H = window.innerHeight;
    var rect = canvas.getBoundingClientRect();
    var cols = ['#ef3b4a', '#ffc933', '#ffffff', '#4f8cff', '#3ccf7e', '#ff8fd1'];
    var n = big ? 170 : 70;
    for (var i = 0; i < n; i++) {
      var fromTop = i % 3 !== 0;
      parts.push({
        x: fromTop ? Math.random() * W : rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.5,
        y: fromTop ? -20 - Math.random() * H * 0.3 : rect.top + rect.height * 0.45,
        vx: fromTop ? (Math.random() - 0.5) * 120 : (Math.random() - 0.5) * 900,
        vy: fromTop ? 80 + Math.random() * 160 : -350 - Math.random() * 650,
        rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 14,
        w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, c: cols[i % cols.length],
        round: Math.random() < 0.3, life: 3 + Math.random() * 1.5, wob: Math.random() * 6.3
      });
    }
  }
  function stepConfetti(dt) {
    var d = geo.dpr;
    fctx.setTransform(d, 0, 0, d, 0, 0);
    fctx.clearRect(0, 0, fx.width / d, fx.height / d);
    if (!parts.length) return;
    var H = window.innerHeight;
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += 700 * dt; p.vx *= Math.pow(0.35, dt); p.vy *= Math.pow(0.55, dt);
      p.wob += dt * 7; p.x += (p.vx + Math.sin(p.wob) * 30) * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
      if (p.y > H + 30 || p.life <= 0) { parts.splice(i, 1); continue; }
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      fctx.globalAlpha = Math.min(1, p.life * 2);
      fctx.fillStyle = p.c;
      if (p.round) { fctx.beginPath(); fctx.arc(0, 0, p.w / 2.4, 0, Math.PI * 2); fctx.fill(); }
      else fctx.fillRect(-p.w / 2, -p.h / 2 * Math.abs(Math.cos(p.wob)), p.w, p.h * Math.abs(Math.cos(p.wob)) + 1);
      fctx.restore();
    }
  }

  // ------------------------------------------------------------ main loop
  var lastT = 0;
  function frame(t) {
    var dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016);
    lastT = t;
    if (anims.length) stepAnims(dt);
    // bot move waiting for the board to settle and its preview to glide over
    if (S.botMove && !busy() && t >= S.botMove.at && S.previewX >= 0 && Math.abs(S.previewX - cellX(S.botMove.col)) < 2) {
      var col = S.botMove.col; S.botMove = null; S.thinking = false; S.botCol = col;
      applyMove(col);
    }
    if (S.mode === 'online' && S.pending && t - S.pendingAt > 6000) { S.pending = false; resync(); }
    var pv = previewInfo();
    var animating = anims.length || S.win || (pv && S.previewX >= 0 && Math.abs(S.previewX - cellX(pv.col)) > 0.5) || (S.mode === 'online' && S.pending) || (pv && S.mode === 'bot' && pv.side !== S.humanSide);
    if (dirty || animating) { draw(t); dirty = false; }
    if (parts.length || fx._had) { stepConfetti(dt); fx._had = parts.length > 0; }
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- moves
  function isHumanTurn() {
    if (!S.mode || S.game.result) return false;
    var side = sideOfTurn();
    if (S.mode === 'local') return true;
    if (S.mode === 'bot') return side === S.humanSide && !S.botMove;
    if (S.mode === 'online') return side === S.side && !S.pending && !S.reconnecting;
    return false;
  }

  function attemptDrop(col) {
    if (!(col >= 0 && col < 7) || !S.mode || S.mode === 'ended') return;
    if (S.game.result) return;
    if (!isHumanTurn()) {
      if (S.mode === 'online' && !S.pending) toast(S.reconnecting ? 'Reconnecting…' : 'Wait for ' + S.players[1 - S.side].name + ' to move', '', 1400);
      return;
    }
    if (busy()) finishAnims();
    if (S.game.result) return;
    if (!L.canDrop(S.game.board, col)) { Sound.nope(); toast('That column is full', 'bad', 1300); return; }
    S.cursor = col;
    if (S.mode === 'online') {
      S.pending = true; S.pendingAt = now(); S.hoverCol = col;
      Net.send({ t: 'move', col: col, n: S.game.moves.length });
      dirty = true;
      return;
    }
    applyMove(col);
  }

  function applyMove(col) {
    var res = L.play(S.game, col);
    if (!res) return null;
    startDrop(res);
    if (!res.result && S.mode === 'bot' && sideOfTurn() !== S.humanSide) requestBot();
    updateHUD();
    return res;
  }

  function finishGame() {
    var g = S.game;
    S.over = true;
    if (g.line) S.win = { cells: g.line, t0: now() };
    if (!S.counted) {
      S.counted = true;
      if (g.result === 3) S.score[2]++;
      else if (S.mode !== 'online') S.score[g.result - 1]++;
      if (S.mode === 'bot') {
        var st = stats[S.level] || { w: 0, l: 0, d: 0 };
        if (g.result === 3) st.d++; else if (g.result - 1 === S.humanSide) st.w++; else st.l++;
        stats[S.level] = st; save('stats', stats);
      }
      if (g.result !== 3) bump(g.result - 1);
    }
    var mine = myWin();
    if (g.result === 3) { Sound.draw(); }
    else if (mine === false) { Sound.lose(); }
    else { Sound.win(); confetti(mine === true); }
    updateHUD();
    setTimeout(showResult, 550);
  }
  /** true: the person here won; false: they lost; null: pass and play (someone won). */
  function myWin() {
    var g = S.game;
    if (!g.result || g.result === 3) return undefined;
    if (S.mode === 'bot') return g.result - 1 === S.humanSide;
    if (S.mode === 'online' || S.mode === 'ended') return g.result - 1 === S.side;
    return null;
  }
  function bump(side) {
    var el = $('p' + side).querySelector('.pscore');
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  function lineKind(cells) {
    var a = cells[0], b = cells[cells.length - 1];
    var n = cells.length + ' in a row';
    if (a[1] === b[1]) return n + ', across';
    if (a[0] === b[0]) return n + ', up and down';
    return n + ', diagonal';
  }

  function showResult() {
    if (!S.over || !S.game.result) return;
    var g = S.game, title = '', sub = '', cls = '';
    var mine = myWin();
    if (g.result === 3) { title = "It's a draw"; sub = 'The board is full'; }
    else {
      var w = g.result - 1;
      cls = w === 0 ? 'red' : 'yellow';
      if (S.mode === 'bot') title = mine ? 'You win!' : 'Bot wins';
      else if (S.mode === 'online' || S.mode === 'ended') title = mine ? 'You win!' : S.players[w].name + ' wins';
      else title = S.players[w].name + ' wins!';
      sub = lineKind(g.line);
      if (S.mode === 'bot') sub += ' · ' + LEVEL_NAMES[S.level] + ' bot';
    }
    var t = $('result-title');
    setText(t, title); t.className = cls;
    setText($('result-sub'), sub);
    var again = $('btn-again');
    again.disabled = false;
    if (S.mode === 'online') {
      if (S.rematchAsked) { again.textContent = 'Waiting…'; again.disabled = true; setText($('result-sub'), 'Waiting for ' + S.players[1 - S.side].name + '…'); }
      else again.textContent = S.rematchOffered ? 'Accept rematch' : 'Rematch';
      $('btn-result-undo').hidden = true;
      $('btn-result-menu').textContent = 'Leave';
    } else {
      again.textContent = 'Play again';
      $('btn-result-undo').hidden = !canUndo();
      $('btn-result-menu').textContent = 'Menu';
    }
    if (S.mode === 'ended') { again.hidden = true; } else again.hidden = false;
    $('result').hidden = false;
    $('tools').hidden = true;
    $('emotes').hidden = true;
  }
  function hideResult() {
    $('result').hidden = true;
    $('tools').hidden = false;
  }

  // ------------------------------------------------------------------ bot
  var worker = null, botReq = 0, botCallbacks = {};
  try {
    worker = new Worker('js/worker.js');
    worker.onmessage = function (ev) {
      var d = ev.data || {}, cb = botCallbacks[d.id];
      delete botCallbacks[d.id];
      if (cb) cb(d.move);
    };
    worker.onerror = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      worker = null;
      // answer anything outstanding on the main thread instead
      Object.keys(botCallbacks).forEach(function (id) { var cb = botCallbacks[id]; delete botCallbacks[id]; cb(null); });
    };
  } catch (e) { worker = null; }

  function requestBot() {
    var id = ++botReq, t0 = now(), moves = S.game.moves.slice(), level = S.level;
    S.thinking = true;
    var deliver = function (move) {
      if (id !== botReq || S.mode !== 'bot' || S.game.moves.length !== moves.length) return;
      if (!move) move = Bot.chooseMove(moves, level, { budget: 500 });
      if (!move) return;
      var minDelay = { easy: 550, medium: 600, hard: 650, impossible: 500 }[level] || 550;
      S.botMove = { col: move.col, at: t0 + minDelay };
    };
    if (worker) { botCallbacks[id] = deliver; worker.postMessage({ id: id, moves: moves, level: level, budget: 1000 }); }
    else setTimeout(function () { deliver(Bot.chooseMove(moves, level, { budget: 700 })); }, 30);
    updateHUD();
  }
  function cancelBot() { botReq++; S.botMove = null; S.thinking = false; }

  // ----------------------------------------------------------------- undo
  function canUndo() {
    if (S.mode === 'local') return S.game.moves.length > 0;
    if (S.mode === 'bot') {
      // can't take back the bot's opening move on its own
      var g = S.game, firstHuman = (g.first - 1) === S.humanSide ? 0 : 1;
      return g.moves.length > firstHuman;
    }
    return false;
  }
  function undo() {
    if (!canUndo()) return;
    if (busy()) finishAnims();
    cancelBot();
    var wasOver = !!S.game.result;
    var result = S.game.result;
    var lifted = [];
    if (S.mode === 'local') lifted.push(L.undo(S.game));
    else {
      while (S.game.moves.length) {
        lifted.push(L.undo(S.game));
        if (sideOfTurn() === S.humanSide) break;
      }
    }
    if (wasOver && S.counted) {
      S.counted = false;
      if (result === 3) S.score[2]--; else S.score[result - 1]--;
      if (S.mode === 'bot') {
        var st = stats[S.level];
        if (st) { if (result === 3) st.d--; else if (result - 1 === S.humanSide) st.w--; else st.l--; save('stats', stats); }
      }
    }
    lifted.forEach(function (m) { if (m) startLift(m); });
    S.win = null; S.over = false; parts.length = 0;
    hideResult();
    if (S.mode === 'bot' && sideOfTurn() !== S.humanSide) requestBot();
    updateHUD();
  }

  // ---------------------------------------------------------- game setup
  function resetBoard(first) {
    cancelBot();
    anims = []; parts.length = 0;
    S.game = L.newGame(first);
    S.counted = false; S.win = null; S.over = false;
    S.cursor = 3; S.botCol = 3; S.previewX = -1;
    hideResult();
    dirty = true;
  }

  function startBot(level, humanSide) {
    S.mode = 'bot';
    S.level = level || settings.level;
    S.humanSide = humanSide === 1 ? 1 : 0;
    var me = { name: settings.name || 'You', meta: settings.name ? 'You' : COLOR_NAMES[S.humanSide] };
    var bot = { name: 'Bot', meta: LEVEL_NAMES[S.level] };
    S.players = S.humanSide === 0 ? [me, bot] : [bot, me];
    S.score = [0, 0, 0]; S.gameNo = 0;
    hideScreens();
    newRound();
  }
  function startLocal() {
    S.mode = 'local';
    S.players = [{ name: 'Red', meta: 'Player 1' }, { name: 'Yellow', meta: 'Player 2' }];
    S.score = [0, 0, 0]; S.gameNo = 0;
    hideScreens();
    newRound();
  }
  function newRound() {
    if (S.mode !== 'bot' && S.mode !== 'local') return;
    S.gameNo++;
    var firstSide;
    if (S.mode === 'local') firstSide = (S.gameNo - 1) % 2;
    else {
      var humanFirst = settings.first === 'you' || (settings.first === 'alt' && S.gameNo % 2 === 1);
      firstSide = humanFirst ? S.humanSide : 1 - S.humanSide;
    }
    resetBoard(firstSide + 1);
    updateHUD();
    if (S.mode === 'bot' && firstSide !== S.humanSide) requestBot();
    else if (S.gameNo > 1 || S.mode === 'local') toast(S.mode === 'local' ? S.players[firstSide].name + ' goes first' : 'You go first', '', 1300);
    if (S.mode === 'bot' && firstSide !== S.humanSide) toast('Bot goes first', '', 1300);
  }

  // ------------------------------------------------------------------ HUD
  var lastTurnKey = '';
  function updateHUD() {
    var g = S.game;
    for (var i = 0; i < 2; i++) {
      var card = $('p' + i), pl = S.players[i] || { name: '', meta: '' };
      setText(card.querySelector('.pname'), pl.name);
      var meta = pl.meta || '';
      if (S.mode === 'online' || S.mode === 'ended') meta = i === S.side ? 'You' : (S.oppAway ? 'Reconnecting…' : 'Opponent');
      setText(card.querySelector('.pmeta'), meta);
      setText(card.querySelector('.pscore'), String(S.score[i]));
      card.classList.toggle('turn', !!S.mode && !g.result && sideOfTurn() === i);
      card.classList.toggle('winner', g.result === i + 1);
    }
    setText($('draws'), S.score[2] ? S.score[2] + (S.score[2] === 1 ? ' draw' : ' draws') : 'vs');

    // status line
    var text = '', disc = 'none', thinking = false;
    if (!S.mode) text = '';
    else if (g.result === 3) text = "It's a draw";
    else if (g.result) {
      var w = g.result - 1, mine = myWin();
      disc = w === 0 ? 'red' : 'yellow';
      text = mine === true ? 'You win!' : mine === false ? (S.mode === 'bot' ? 'Bot wins' : S.players[w].name + ' wins') : S.players[w].name + ' wins!';
    } else {
      var side = sideOfTurn();
      disc = side === 0 ? 'red' : 'yellow';
      if (S.mode === 'bot') {
        if (side === S.humanSide) text = 'Your turn';
        else { text = 'Bot is thinking'; thinking = true; }
      } else if (S.mode === 'local') text = S.players[side].name + "'s turn";
      else if (S.mode === 'online') {
        if (S.reconnecting) { text = 'Reconnecting'; thinking = true; }
        else if (S.oppAway) { text = S.players[1 - S.side].name + ' reconnecting'; thinking = true; }
        else if (side === S.side) text = 'Your turn';
        else { text = S.players[side].name + "'s turn"; }
      } else text = 'Game over';
    }
    var st = $('status-text');
    setText(st, text);
    st.className = thinking ? 'thinking' : '';
    var sd = $('status-disc');
    var key = disc + '|' + g.moves.length + '|' + g.result;
    var cls = 'sdisc ' + disc;
    if (key !== lastTurnKey && disc !== 'none') {
      sd.className = cls; void sd.offsetWidth; sd.className = cls + ' hop';
    } else if (sd.className.indexOf(disc) < 0) sd.className = cls;
    lastTurnKey = key;

    // tools
    var online = S.mode === 'online' || S.mode === 'ended';
    $('btn-undo').hidden = online;
    $('btn-new').hidden = online;
    $('btn-emote').hidden = S.mode !== 'online';
    if (S.mode !== 'online') $('emotes').hidden = true;
    $('btn-undo').disabled = !canUndo();
    $('btn-restart').hidden = online;
    $('btn-quit').textContent = online ? 'Leave game' : 'Quit to menu';
    var net = $('net');
    net.hidden = !online;
    if (online) {
      var q = S.mode === 'ended' ? 0 : S.reconnecting ? 0 : Net.quality;
      net.className = 'net q' + q;
      setText($('net-label'), S.mode === 'ended' ? 'offline' : S.reconnecting ? 'reconnecting' : q === 3 ? 'online' : q === 2 ? 'slow' : q === 1 ? 'poor' : 'offline');
    }
    if (!$('result').hidden && S.over) showResult();
    dirty = true;
  }

  // -------------------------------------------------------------- screens
  var SCREENS = ['menu', 'online', 'lobby', 'help', 'pause', 'dialog'];
  var helpReturn = 'menu';
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    var inMenus = id === 'menu' || id === 'online' || id === 'lobby' || (id === 'help' && helpReturn === 'menu');
    $('arcade').hidden = !inMenus;
    $('emotes').hidden = true;
  }
  function hideScreens() { SCREENS.forEach(function (s) { $(s).hidden = true; }); $('arcade').hidden = true; }
  function anyScreen() { return SCREENS.some(function (s) { return !$(s).hidden; }); }

  function refreshMenu() {
    ['name', 'name2'].forEach(function (id) { $(id).value = settings.name; });
    Array.prototype.forEach.call($('level-seg').children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.level === settings.level)); });
    Array.prototype.forEach.call($('first-seg').querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.first === settings.first)); });
    $('opt-sound').checked = !settings.muted;
    var st = stats[settings.level];
    $('bot-stats').textContent = st && (st.w || st.l || st.d) ? LEVEL_NAMES[settings.level] + ': ' + st.w + ' won · ' + st.l + ' lost · ' + st.d + ' drawn' : '';
    $('btn-mute').classList.toggle('muted', settings.muted);
  }
  function saveName(v) {
    var nm = String(v || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 14);
    settings.name = nm; save('name', nm);
    $('name').value = nm; $('name2').value = nm;
  }
  function setMuted(m) {
    settings.muted = !!m; save('muted', settings.muted);
    Sound.setMuted(settings.muted);
    $('btn-mute').classList.toggle('muted', settings.muted);
    $('opt-sound').checked = !settings.muted;
  }

  function quitToMenu() {
    if (S.mode === 'online') { Net.send({ t: 'leave' }); }
    if (S.mode === 'online' || S.mode === 'ended') Net.close();
    clearTimeout(reconnectTimer);
    S.reconnecting = false;
    cancelBot();
    S.mode = null;
    resetBoard(1);
    S.players = [{ name: '', meta: '' }, { name: '', meta: '' }];
    S.score = [0, 0, 0];
    updateHUD();
    refreshMenu();
    show('menu');
  }

  function dialog(title, text, buttons) {
    $('dialog-title').textContent = title;
    $('dialog-text').textContent = text;
    var box = $('dialog-buttons');
    box.innerHTML = '';
    buttons.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn ' + (b.cls || ''); el.type = 'button'; el.textContent = b.label;
      el.onclick = b.fn; box.appendChild(el);
    });
    show('dialog');
    var first = box.querySelector('button');
    if (first) first.focus();
  }

  // --------------------------------------------------------------- online
  var lobbyMode = null, reconnectTimer = 0;
  function onlineError(msg) { $('online-err').textContent = msg; }
  function goOnline(action, code) {
    saveName($('name2').value || $('name').value);
    onlineError(''); $('lobby-err').textContent = '';
    lobbyMode = action;
    Net.close();
    Net.connect();
    var base = { name: settings.name || 'Player' };
    if (action === 'create') Net.send(Object.assign({ t: 'create' }, base));
    else if (action === 'quick') Net.send(Object.assign({ t: 'quick' }, base));
    else Net.send(Object.assign({ t: 'join', code: code }, base));
    showLobby(action, code);
  }
  function showLobby(kind, code) {
    $('lobby-room').hidden = kind !== 'create';
    $('lobby-wait').innerHTML = '';
    var span = document.createElement('span');
    span.className = 'thinking';
    span.textContent = kind === 'quick' ? 'Looking for an opponent' : kind === 'join' ? 'Joining room ' + (code || '') : 'Waiting for your friend to join';
    $('lobby-wait').appendChild(span);
    if (kind === 'create') { $('room-code').textContent = '----'; $('room-link').textContent = ''; }
    $('btn-share').hidden = !navigator.share;
    show('lobby');
  }
  function roomLink(code) { return location.origin + location.pathname + '?room=' + code; }

  Net.on('message', function (msg) {
    var t = msg.t;
    if (t === 'room') {
      if (!msg.code) return;
      S.code = msg.code;
      $('room-code').textContent = msg.code;
      $('room-link').textContent = roomLink(msg.code);
    } else if (t === 'queued' || t === 'hello' || t === 'cancelled') {
      /* nothing to do */
    } else if (t === 'error') {
      if (S.mode === 'online') {
        if (msg.msg === 'no session') { S.reconnecting = false; opponentGone('The game is no longer available.'); }
        return;
      }
      var text = msg.msg === 'no room' ? 'No room with that code.' : msg.msg === 'room full' ? 'That room is already full.' : msg.msg === 'expired' ? 'The room expired.' : 'Server busy, try again.';
      Net.close();
      if (!$('lobby').hidden || !$('online').hidden) { show('online'); onlineError(text); }
    } else if (t === 'start') {
      onStart(msg);
    } else if (S.mode !== 'online') {
      if (t === 'left' && !$('lobby').hidden) { show('online'); onlineError('Your opponent left.'); }
    } else if (t === 'move') {
      onRemoteMove(msg);
    } else if (t === 'reject') {
      S.pending = false;
      if (msg.why === 'stale' || msg.why === 'turn') resync();
      if (msg.why === 'full') toast('That column is full', 'bad', 1300);
      else if (msg.why === 'turn') toast('Not your turn', 'bad', 1300);
      Sound.nope();
      updateHUD();
    } else if (t === 'left') {
      opponentGone(S.players[1 - S.side].name + ' left the game.');
    } else if (t === 'away') {
      S.oppAway = true; updateHUD();
      toast(S.players[1 - S.side].name + ' lost connection. Waiting for them…', 'bad', 2600);
    } else if (t === 'back') {
      if (S.oppAway) toast(S.players[1 - S.side].name + ' is back', 'good', 1600);
      S.oppAway = false; updateHUD();
    } else if (t === 'rematch_req') {
      S.rematchOffered = true;
      toast(S.players[1 - S.side].name + ' wants a rematch', 'good');
      updateHUD();
      if (S.over) showResult();
    } else if (t === 'emote') {
      if (EMOTES.indexOf(msg.e) >= 0) showBubble(1 - S.side, msg.e);
    }
  });
  Net.on('close', function () {
    if (S.mode === 'online' && S.code && S.token) beginReconnect();
    else if (!$('lobby').hidden) { show('online'); onlineError('Could not reach the server.'); }
  });
  Net.on('quality', function () { if (S.mode === 'online') updateHUD(); });

  function onStart(msg) {
    var side = msg.side === 1 ? 1 : 0;
    var names = Array.isArray(msg.names) ? msg.names : ['Player', 'Player'];
    var first = msg.first === 1 ? 2 : 1;
    var moves = Array.isArray(msg.moves) ? msg.moves.filter(function (c) { return c === (c | 0); }) : [];
    var g = L.fromMoves(moves, first);
    if (!g) return;
    var resumed = S.mode === 'online' && S.code === msg.code && S.onlineGame === msg.game;
    var fresh = !resumed;
    if (S.mode !== 'online' || S.code !== msg.code) S.score = [0, 0, 0];
    S.mode = 'online';
    S.side = side; S.code = msg.code; S.token = String(msg.token || ''); S.onlineGame = msg.game | 0;
    S.players = [0, 1].map(function (i) { return { name: String(names[i] || 'Player').slice(0, 14), meta: '' }; });
    if (Array.isArray(msg.score)) { S.score[0] = msg.score[0] | 0; S.score[1] = msg.score[1] | 0; }
    S.pending = false; S.reconnecting = false; clearTimeout(reconnectTimer);
    S.oppAway = !!msg.away;
    hideScreens();
    try { if (location.search) history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
    if (resumed && g.moves.length === S.game.moves.length && g.result === S.game.result) { updateHUD(); return; }
    var wasCounted = resumed && S.counted;
    cancelBot();
    anims = [];
    S.game = g;
    S.win = null; S.over = false;
    S.counted = !!g.result && (wasCounted || !fresh);
    if (fresh) { S.rematchAsked = false; S.rematchOffered = false; S.cursor = 3; parts.length = 0; }
    hideResult();
    if (g.result) {
      if (!S.counted && g.result === 3) S.score[2]++;
      S.counted = true;
      S.over = true;
      if (g.line) S.win = { cells: g.line, t0: now() - 1000 };
      showResult();
    }
    updateHUD();
    if (fresh) {
      Sound.turn();
      toast(first - 1 === side ? 'You go first' : S.players[first - 1].name + ' goes first', 'good', 1600);
    }
  }

  function onRemoteMove(msg) {
    if (msg.n !== S.game.moves.length + 1) { resync(); return; }
    var res = L.play(S.game, msg.col);
    if (!res || res.row !== msg.row || res.player !== msg.side + 1) { resync(); return; }
    if (msg.side === S.side) S.pending = false;
    if (Array.isArray(msg.score)) { S.score[0] = msg.score[0] | 0; S.score[1] = msg.score[1] | 0; }
    S.rematchAsked = false; S.rematchOffered = false;
    startDrop(res);
    if (!res.result && sideOfTurn() === S.side && msg.side !== S.side && document.hidden) Sound.turn();
    updateHUD();
  }
  function resync() {
    if (S.mode !== 'online' || !S.code || !S.token) return;
    Net.send({ t: 'resume', code: S.code, token: S.token });
  }

  function beginReconnect() {
    if (S.reconnecting) return;
    S.reconnecting = true; S.reconnectStart = now(); S.pending = false;
    updateHUD();
    tryReconnect(0);
  }
  function tryReconnect(attempt) {
    if (!S.reconnecting || S.mode !== 'online') return;
    if (now() - S.reconnectStart > 25000) { S.reconnecting = false; opponentGone('Lost the connection to the server.'); return; }
    Net.connect();
    Net.send({ t: 'resume', code: S.code, token: S.token });
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(function () {
      if (S.reconnecting && Net.state !== 'open') tryReconnect(attempt + 1);
      else if (S.reconnecting) reconnectTimer = setTimeout(function () { tryReconnect(attempt + 1); }, 3000);
    }, [800, 1500, 2500, 3000][Math.min(attempt, 3)]);
  }

  function opponentGone(text) {
    if (S.mode !== 'online') return;
    Net.close();
    clearTimeout(reconnectTimer);
    S.reconnecting = false; S.pending = false;
    var over = !!S.game.result;
    S.mode = 'ended';
    updateHUD();
    var buttons = [];
    if (!over) buttons.push({ label: 'Continue vs Bot', cls: 'primary', fn: continueVsBot });
    buttons.push({ label: 'Play online again', cls: over ? 'primary' : '', fn: function () { quitToMenu(); show('online'); } });
    buttons.push({ label: 'Menu', fn: quitToMenu });
    dialog(over ? 'Opponent left' : 'Game interrupted', text, buttons);
  }
  function continueVsBot() {
    var g = S.game, mySide = S.side;
    S.mode = 'bot';
    S.level = settings.level;
    S.humanSide = mySide;
    S.players[1 - mySide] = { name: 'Bot', meta: LEVEL_NAMES[S.level] };
    S.players[mySide] = { name: S.players[mySide].name, meta: 'You' };
    S.gameNo = 1;
    hideScreens();
    if (!g.result && sideOfTurn() !== S.humanSide) requestBot();
    updateHUD();
  }

  function showBubble(side, e) {
    var b = $('p' + side).querySelector('.bubble');
    b.textContent = e;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    Sound.pop();
  }
  function buildEmotes() {
    var box = $('emotes');
    EMOTES.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = e; b.setAttribute('aria-label', 'Send ' + e);
      b.addEventListener('click', function () {
        if (S.mode !== 'online') return;
        Net.send({ t: 'emote', e: e });
        showBubble(S.side, e);
        box.hidden = true;
      });
      box.appendChild(b);
    });
  }

  // ---------------------------------------------------------------- input
  var pointerDown = false;
  function colAt(ev) {
    var r = canvas.getBoundingClientRect();
    var x = ev.clientX - r.left, y = ev.clientY - r.top;
    if (x < 0 || x > r.width || y < -geo.s || y > r.height + geo.s * 0.5) return -1;
    var c = Math.floor((x - geo.pad) / geo.s);
    return Math.max(0, Math.min(6, c));
  }
  function setHover(c) {
    if (c !== S.hoverCol) {
      if (c >= 0 && isHumanTurn()) Sound.hover();
      S.hoverCol = c;
      if (c >= 0) S.cursor = c;
      dirty = true;
    }
  }
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'mouse' || pointerDown) { S.keyActive = false; setHover(colAt(e)); }
  });
  canvas.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !pointerDown) setHover(-1); });
  canvas.addEventListener('pointerdown', function (e) {
    Sound.unlock();
    if (e.button !== undefined && e.button > 0) return;
    pointerDown = true; S.keyActive = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    setHover(colAt(e));
    $('emotes').hidden = true;
  });
  canvas.addEventListener('pointerup', function (e) {
    if (!pointerDown) return;
    pointerDown = false;
    var c = colAt(e);
    if (c >= 0) attemptDrop(c);
    if (e.pointerType !== 'mouse') setHover(-1);
  });
  canvas.addEventListener('pointercancel', function () { pointerDown = false; setHover(-1); });

  document.addEventListener('keydown', function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === 'INPUT') {
      if (e.key === 'Enter' && e.target.id === 'join-code') { e.preventDefault(); joinFromInput(); }
      return;
    }
    if (anyScreen()) {
      if (e.key === 'Escape') {
        if (!$('help').hidden) { e.preventDefault(); closeHelp(); }
        else if (!$('pause').hidden) { e.preventDefault(); hideScreens(); }
        else if (!$('online').hidden) { e.preventDefault(); show('menu'); }
      }
      return;
    }
    if (!S.mode) return;
    Sound.unlock();
    var k = e.key, handled = true;
    if (k >= '1' && k <= '7' && !e.ctrlKey && !e.metaKey && !e.altKey) { S.keyActive = true; S.hoverCol = -1; S.cursor = +k - 1; attemptDrop(+k - 1); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { S.keyActive = true; S.hoverCol = -1; S.cursor = Math.max(0, S.cursor - 1); Sound.hover(); dirty = true; }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { S.keyActive = true; S.hoverCol = -1; S.cursor = Math.min(6, S.cursor + 1); Sound.hover(); dirty = true; }
    else if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 's' || k === 'S') {
      if (S.over && S.game.result) { if (S.mode !== 'ended' && k === 'Enter') again(); }
      else { S.keyActive = true; attemptDrop(S.hoverCol >= 0 ? S.hoverCol : S.cursor); }
    }
    else if ((k === 'z' || k === 'Z') && (e.ctrlKey || e.metaKey)) undo();
    else if (k === 'u' || k === 'U' || k === 'Backspace') undo();
    else if (k === 'n' || k === 'N') { if (S.mode === 'bot' || S.mode === 'local') newRound(); else if (S.over) again(); }
    else if (k === 'm' || k === 'M') setMuted(!settings.muted);
    else if (k === 'Escape') { if (S.mode === 'ended') quitToMenu(); else show('pause'); }
    else handled = false;
    if (handled) e.preventDefault();
  });

  function again() {
    if (S.mode === 'online') {
      if (!S.over || S.rematchAsked) return;
      S.rematchAsked = true;
      Net.send({ t: 'rematch' });
      showResult();
      return;
    }
    if (S.mode === 'bot' || S.mode === 'local') newRound();
  }
  function joinFromInput() {
    var code = $('join-code').value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) { onlineError('Codes are 4 letters.'); return; }
    goOnline('join', code);
  }
  function closeHelp() { if (helpReturn === 'pause') show('pause'); else show('menu'); }

  // ------------------------------------------------------------- buttons
  function click(id, fn) { $(id).addEventListener('click', function (e) { Sound.unlock(); Sound.click(); fn(e); }); }
  Array.prototype.forEach.call($('level-seg').children, function (b) {
    b.addEventListener('click', function () { settings.level = b.dataset.level; save('level', settings.level); refreshMenu(); Sound.unlock(); Sound.click(); });
  });
  Array.prototype.forEach.call($('first-seg').querySelectorAll('button'), function (b) {
    b.addEventListener('click', function () { settings.first = b.dataset.first; save('first', settings.first); refreshMenu(); Sound.unlock(); Sound.click(); });
  });
  $('name').addEventListener('change', function () { saveName($('name').value); });
  $('name2').addEventListener('change', function () { saveName($('name2').value); });
  $('opt-sound').addEventListener('change', function () { Sound.unlock(); setMuted(!$('opt-sound').checked); });
  click('btn-bot', function () { saveName($('name').value); startBot(settings.level, 0); });
  click('btn-local', function () { saveName($('name').value); startLocal(); });
  click('btn-online', function () { saveName($('name').value); onlineError(''); show('online'); });
  click('btn-help', function () { helpReturn = 'menu'; show('help'); });
  click('btn-help-close', closeHelp);
  click('btn-online-back', function () { Net.close(); show('menu'); });
  click('btn-quick', function () { goOnline('quick'); });
  click('btn-create', function () { goOnline('create'); });
  click('btn-join', joinFromInput);
  $('join-code').addEventListener('input', function () {
    var v = this.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (v !== this.value) this.value = v;
  });
  click('btn-copy', function () {
    var link = $('room-link').textContent;
    if (!link) return;
    var done = function () { toast('Link copied', 'good', 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { toast(link, '', 4000); });
    else toast(link, '', 4000);
  });
  click('btn-share', function () {
    var link = $('room-link').textContent;
    if (link && navigator.share) navigator.share({ title: 'Connect 4', text: 'Play Connect 4 with me! Room ' + S.code, url: link }).catch(function () {});
  });
  click('btn-lobby-cancel', function () { Net.send({ t: 'cancel' }); Net.close(); S.code = null; show('online'); });
  click('btn-menu', function () { if (S.mode === 'ended') { quitToMenu(); return; } show('pause'); });
  $('btn-mute').addEventListener('click', function () { Sound.unlock(); setMuted(!settings.muted); Sound.click(); });
  click('btn-resume', hideScreens);
  click('btn-restart', function () { hideScreens(); newRound(); });
  click('btn-pause-help', function () { helpReturn = 'pause'; show('help'); });
  click('btn-quit', quitToMenu);
  click('btn-undo', undo);
  click('btn-result-undo', undo);
  click('btn-new', newRound);
  click('btn-again', again);
  click('btn-result-menu', quitToMenu);
  click('btn-emote', function () { $('emotes').hidden = !$('emotes').hidden; });

  // ------------------------------------------------------------------ boot
  buildEmotes();
  if (window.ResizeObserver) new ResizeObserver(function () { layout(); }).observe($('stage'));
  window.addEventListener('resize', layout);
  layout();
  refreshMenu();
  updateHUD();
  show('menu');
  requestAnimationFrame(frame);

  // share links: ?room=CODE joins straight away
  var qs = new URLSearchParams(location.search);
  var roomParam = (qs.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (roomParam.length === 4) { $('join-code').value = roomParam; goOnline('join', roomParam); }

  // a small hook for the automated browser tests
  window.C4Debug = {
    state: function () {
      return { mode: S.mode, moves: S.game.moves.slice(), turn: S.game.turn, result: S.game.result, busy: busy(),
        human: isHumanTurn(), score: S.score.slice(), side: S.side, code: S.code, over: S.over, thinking: S.thinking || !!S.botMove };
    }
  };
})();
