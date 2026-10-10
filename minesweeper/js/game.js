/* Minesweeper UI: layout, rendering, mouse/touch/keyboard input, menus,
   dialogs, timer, best times. Rules live in board.js. */
(function () {
  'use strict';

  var MS = window.Minesweeper, SP = window.MSSprites, SND = window.MSSound;
  var HIDDEN = MS.HIDDEN, REVEALED = MS.REVEALED, FLAGGED = MS.FLAGGED, QUESTION = MS.QUESTION;
  var LONG_PRESS_MS = 350;
  var ZOOMS = [0.5, 0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5, 3];
  var ZOOM_DEFAULT = 4;
  var IS_MAC = /Mac/.test(navigator.platform || '') && !('ontouchend' in document);

  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // ---------- storage: every access guarded (blocked storage must not break play)
  var NS = 'openarcade.minesweeper.';
  function load(key, dflt) {
    try {
      var raw = window.localStorage.getItem(NS + key);
      if (raw === null) return dflt;
      var v = JSON.parse(raw);
      return (v && typeof v === 'object') ? v : dflt;
    } catch (e) { return dflt; }
  }
  function save(key, v) {
    try { window.localStorage.setItem(NS + key, JSON.stringify(v)); } catch (e) { /* storage blocked */ }
  }

  var settings = load('settings', {});
  if (['beginner', 'intermediate', 'expert', 'custom'].indexOf(settings.level) < 0) settings.level = 'beginner';
  (function () {
    var c = settings.custom || {};
    settings.custom = MS.clampCustom(c.w || 20, c.h || 12, c.mines || 40);
  })();
  settings.marks = settings.marks === true;
  settings.muted = settings.muted === true;
  if (!settings.zoom || typeof settings.zoom !== 'object') settings.zoom = {};
  function saveSettings() { save('settings', settings); }

  var best = load('best', {});
  var stats = load('stats', {});

  // ---------- elements
  var root = document.documentElement;
  var desk = $('desk'), wrap = $('wrap'), win = $('win'), client = $('client'), field = $('field');
  var cv = $('board'), lcdMines = $('lcd-mines'), lcdTime = $('lcd-time');
  var faceBtn = $('face'), faceCv = $('face-cv');
  var stLeft = $('st-left'), stRight = $('st-right');
  var modebar = $('modebar'), mDig = $('m-dig'), mFlag = $('m-flag');
  var muteBtn = $('mute'), backdrop = $('backdrop');
  var arcade = document.querySelector('.arcade');

  // ---------- state
  var board = null, levelKey = null, dims = null, lastDimsKey = '';
  var transposed = false, dispCols = 0, dispRows = 0, cellDev = 16, dpr = 1;
  var sprites = null, pressed = null, pressSig = '';
  var faceDown = false, flagMode = false;
  var touchSeen = false, lastTouch = 0;
  var timer = { t0: 0, id: 0, shown: 0, running: false, ms: 0 };
  var flags = { touch: false, narrow: false, short: false, side: false };
  var coarseMQ = window.matchMedia ? window.matchMedia('(pointer: coarse)') : { matches: false };
  var sbw = (function () {
    var d = document.createElement('div');
    d.style.cssText = 'position:absolute;top:-999px;width:100px;height:100px;overflow:scroll';
    document.body.appendChild(d);
    var w = d.offsetWidth - d.clientWidth;
    document.body.removeChild(d);
    return w;
  })();

  // mouse
  var ms = { left: false, right: false, middle: false, chord: false, consumed: false, hover: -1, ctrlRight: false };
  // touch
  var tp = { id: null, cell: -1, x: 0, y: 0, timer: 0, long: false, active: false };

  // ---------- icons
  var SPEAKER_ON = [
    '....K........', '...KK.....K..', '..KWK..K...K.', 'KKKWK...K..K.', 'KWWWK...K...K', 'KWWWK...K...K',
    'KWWWK...K...K', 'KKKWK...K..K.', '..KWK..K...K.', '...KK.....K..', '....K........'
  ];
  var SPEAKER_OFF = [
    '....K........', '...KK........', '..KWK........', 'KKKWK.RR..RR.', 'KWWWK..RRRR..', 'KWWWK...RR...',
    'KWWWK..RRRR..', 'KKKWK.RR..RR.', '..KWK........', '...KK........', '....K........'
  ];
  mFlag.querySelector('.flag-ico').innerHTML = SP.svgFromArt(SP.FLAG.slice(2, 14).map(function (r) { return r.slice(2, 14); }));

  // =====================================================================
  // Game flow
  // =====================================================================
  function dimsFor(key) {
    if (key === 'custom') return { key: 'custom', name: 'Custom', w: settings.custom.w, h: settings.custom.h, mines: settings.custom.mines };
    return MS.LEVELS[key];
  }

  function recordKey() {
    return levelKey === 'custom' ? 'custom-' + dims.w + 'x' + dims.h + '-' + dims.mines : levelKey;
  }

  function newGame(key) {
    if (key && key !== settings.level) { settings.level = key; saveSettings(); }
    levelKey = settings.level;
    dims = dimsFor(levelKey);
    board = new MS.Board(dims.w, dims.h, dims.mines);
    pressed = new Uint8Array(board.size);
    pressSig = '';
    resetPointers();
    stopTimer();
    timer.shown = 0; timer.ms = 0;
    closeMenus();
    var dk = dims.w + 'x' + dims.h;
    var changed = dk !== lastDimsKey;
    lastDimsKey = dk;
    layout(changed);
    setStatus();
    syncMenus();
  }

  function startTimer() {
    timer.t0 = performance.now();
    timer.running = true;
    timer.shown = 1;          // Windows shows 1 the moment you click
    drawTime();
    clearInterval(timer.id);
    timer.id = setInterval(tickTimer, 100);
  }
  function tickTimer() {
    if (!timer.running) return;
    var sec = Math.min(999, 1 + Math.floor((performance.now() - timer.t0) / 1000));
    if (sec !== timer.shown) { timer.shown = sec; drawTime(); }
  }
  function stopTimer() {
    if (timer.running) timer.ms = performance.now() - timer.t0;
    timer.running = false;
    clearInterval(timer.id);
  }

  function statFor(k) {
    var s = stats[k];
    if (!s || typeof s !== 'object') s = stats[k] = { played: 0, won: 0 };
    return s;
  }

  function onGameStart() {
    startTimer();
    statFor(recordKey()).played++;
    save('stats', stats);
  }

  function fmt(ms) { return (ms / 1000).toFixed(2) + ' s'; }

  function onWin() {
    stopTimer();
    tickTimerFinal();
    var k = recordKey(), ms = timer.ms;
    statFor(k).won++;
    save('stats', stats);
    var prev = typeof best[k] === 'number' ? best[k] : null;
    var isBest = prev === null || ms < prev;
    if (isBest) { best[k] = ms; save('best', best); }
    SND.win();
    setStatus('Cleared in ' + fmt(ms) + (isBest ? ' — new best time!' : ''));
    if (isBest) {
      var label = levelKey === 'custom' ? 'Custom ' + dims.w + '×' + dims.h + ' (' + dims.mines + ' mines)' : dims.name;
      $('win-text').textContent = 'You cleared ' + label + ' in ' + (ms / 1000).toFixed(2) + ' seconds.' +
        (prev !== null ? ' Previous best: ' + (prev / 1000).toFixed(2) + ' s.' : '');
      var wf = $('win-face');
      wf.width = wf.height = Math.round(52 * (window.devicePixelRatio || 1));
      SP.drawFace(wf, 'cool', false);
      setTimeout(function () { if (board && board.status === 'won') openDialog('dlg-win'); }, 650);
    }
  }
  function tickTimerFinal() {
    var sec = Math.min(999, 1 + Math.floor(timer.ms / 1000));
    if (sec !== timer.shown) { timer.shown = sec; drawTime(); }
  }

  function onLose() {
    stopTimer();
    SND.explode();
    buzz([60, 40, 120]);
    setStatus(flags.touch ? 'Boom! Tap the face to play again.' : 'Boom! Click the face or press F2 to play again.');
  }

  function afterMove(res) {
    if (!res) return;
    if (res.lost) onLose();
    else if (res.won) onWin();
    else if (res.opened.length > 1) SND.flood(res.opened.length);
    else if (res.opened.length === 1) SND.reveal();
    draw();
    drawMines();
  }

  function doReveal(i) {
    if (i < 0 || board.isOver()) return;
    var st = board.state[i];
    if (st === REVEALED) { doChord(i); return; }
    if (st === FLAGGED) return;
    var first = !board.generated;
    var res = board.reveal(i);
    if (first && res) onGameStart();
    afterMove(res);
  }

  function doChord(i) {
    if (i < 0 || board.isOver()) return;
    afterMove(board.chord(i));
  }

  function doFlag(i) {
    if (i < 0 || board.isOver()) return false;
    var ns = board.toggleFlag(i, settings.marks);
    if (ns === null) return false;
    if (ns === FLAGGED) SND.flag(true);
    else if (ns === QUESTION) SND.mark();
    else SND.flag(false);
    draw();
    drawMines();
    return true;
  }

  function buzz(p) {
    if (!flags.touch) return;
    try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ }
  }

  // =====================================================================
  // Rendering
  // =====================================================================
  function spriteFor(i) {
    var st = board.state[i];
    if (board.status === 'lost') {
      if (board.exploded[i]) return 'boom';
      if (board.mine[i] && st !== FLAGGED) return 'mine';
      if (st === FLAGGED && !board.mine[i]) return 'wrong';
    }
    if (st === REVEALED) return 'n' + board.count[i];
    if (st === FLAGGED) return 'flag';
    if (st === QUESTION) return pressed[i] ? 'qdown' : 'q';
    return pressed[i] ? 'down' : 'up';
  }

  var drawQueued = false;
  function draw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(drawNow);
  }
  function drawNow() {
    drawQueued = false;
    if (!board || !sprites) return;
    var ctx = cv.getContext('2d'), w = board.w;
    for (var r = 0; r < dispRows; r++) {
      for (var c = 0; c < dispCols; c++) {
        var i = transposed ? c * w + r : r * w + c;
        ctx.drawImage(sprites[spriteFor(i)], c * cellDev, r * cellDev);
      }
    }
    drawFace();
  }

  function mood() {
    if (board.status === 'won') return 'cool';
    if (board.status === 'lost') return 'dead';
    var holding = ((ms.left || ms.middle || ms.chord) && !ms.consumed) || tp.active;
    return holding ? 'oh' : 'smile';
  }
  var faceSig = '';
  function drawFace(force) {
    var sig = mood() + faceDown + faceCv.width;
    if (sig === faceSig && !force) return;
    faceSig = sig;
    SP.drawFace(faceCv, mood(), faceDown);
  }
  function drawMines() { SP.drawLCD(lcdMines, board.mines - board.flags); }
  function drawTime() { SP.drawLCD(lcdTime, timer.shown); }

  // =====================================================================
  // Layout: fit the board to the viewport
  // =====================================================================
  function metrics(cell) {
    var s = cell / 16, k = Math.min(s, 2), hs = clamp(s, 1, flags.short ? 1.25 : 2);
    var n = flags.narrow;
    var m = {
      cb: n ? 2 : clamp(Math.round(3 * k), 2, 6),
      pad: n ? 4 : clamp(Math.round(6 * k), 4, 12),
      fb: n ? 2 : clamp(Math.round(3 * k), 2, 6),
      pb: n ? 1 : clamp(Math.round(2 * k), 1, 4),
      ppy: Math.max(2, Math.round(4 * hs)),
      ppx: Math.max(3, Math.round(5 * hs)),
      lcdW: Math.round(41 * hs), lcdH: Math.round(25 * hs), face: Math.round(26 * hs)
    };
    m.panelH = 2 * m.pb + 2 * m.ppy + Math.max(m.lcdH, m.face);
    m.panelMinW = 2 * m.pb + 2 * m.ppx + 2 * m.lcdW + m.face + 8;
    return m;
  }
  function clientSize(m, bw, bh) {
    return {
      w: 2 * m.cb + 2 * m.pad + Math.max(bw + 2 * m.fb, m.panelMinW),
      h: 2 * m.cb + 3 * m.pad + m.panelH + 2 * m.fb + bh
    };
  }
  function devCss(c) { return Math.max(1, Math.round(c * dpr)) / dpr; }
  function pf(v) { return parseFloat(v) || 0; }

  var avail = { w: 0, h: 0, w0: 0, h0: 0 };

  function measure() {
    var cs = getComputedStyle(desk);
    avail.w0 = desk.clientWidth - pf(cs.paddingLeft) - pf(cs.paddingRight);
    avail.h0 = desk.clientHeight - pf(cs.paddingTop) - pf(cs.paddingBottom);
    var winR = win.getBoundingClientRect(), cliR = client.getBoundingClientRect();
    var acs = getComputedStyle(arcade);
    var fixedW = winR.width - cliR.width;
    var fixedH = (winR.height - cliR.height) + arcade.offsetHeight + pf(acs.marginTop) + pf(acs.marginBottom);
    if (flags.touch) {
      var mcs = getComputedStyle(modebar);
      if (flags.side) fixedW += modebar.offsetWidth + pf(mcs.marginLeft) + pf(mcs.marginRight);
      else fixedH += modebar.offsetHeight + pf(mcs.marginTop) + pf(mcs.marginBottom);
    }
    avail.w = avail.w0 - fixedW;
    avail.h = avail.h0 - fixedH;
  }

  function layout(resetScroll) {
    if (!board) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    flags.touch = touchSeen || !!coarseMQ.matches;
    flags.narrow = vw < 560;
    flags.short = vh < 540;
    flags.side = flags.touch && flags.short && vw > vh;
    root.classList.toggle('touch', flags.touch);
    root.classList.toggle('narrow', flags.narrow);
    root.classList.toggle('short', flags.short);
    root.classList.toggle('side', flags.side);
    dpr = window.devicePixelRatio || 1;
    measure();

    var maxCell = flags.touch ? 56 : 40, minCell = flags.touch ? 24 : 16, softMin = flags.touch ? 21 : 14;
    function fits(cols, rows, c, widthOnly) {
      var m = metrics(c), cc = devCss(c), s = clientSize(m, cols * cc, rows * cc);
      return s.w <= avail.w && (widthOnly || s.h <= avail.h);
    }
    function largest(cols, rows, widthOnly) {
      for (var c = maxCell; c > 8; c--) if (fits(cols, rows, c, widthOnly)) return c;
      return 8;
    }
    function plan(cols, rows) {
      var full = largest(cols, rows, false);
      if (full >= minCell) return { c: full, score: 3000 + full };
      var wfit = largest(cols, rows, true);
      if (full >= softMin && wfit - full <= 1) return { c: full, score: 3000 + full };
      if (wfit >= softMin) return { c: wfit, score: 2000 + wfit };
      return { c: minCell, score: 1000 + full };
    }
    var W = board.w, H = board.h;
    var pN = plan(W, H), pT = (vh > vw && W !== H) ? plan(H, W) : null;
    transposed = !!(pT && pT.score > pN.score + 1);   // only when it clearly helps
    dispCols = transposed ? H : W;
    dispRows = transposed ? W : H;
    var base = (transposed ? pT : pN).c;
    var c = clamp(Math.round(base * ZOOMS[zoomIndex()]), 8, 112);
    apply(c);
    // Safety net: the page itself must never overflow.
    for (var tries = 0; tries < 6; tries++) {
      var r = wrap.getBoundingClientRect();
      if (r.width <= avail.w0 + 0.5 && r.height <= avail.h0 + 0.5) break;
      measure();
      apply(field.classList.contains('scroll') ? c : --c);
    }
    if (resetScroll) { field.scrollLeft = 0; field.scrollTop = 0; }
    syncZoomButtons();
  }

  function apply(c) {
    var m = metrics(c);
    var st = root.style;
    st.setProperty('--cb', m.cb + 'px');
    st.setProperty('--pad', m.pad + 'px');
    st.setProperty('--fb', m.fb + 'px');
    st.setProperty('--pb', m.pb + 'px');
    st.setProperty('--ppy', m.ppy + 'px');
    st.setProperty('--ppx', m.ppx + 'px');

    cellDev = Math.max(4, Math.round(c * dpr));
    var css = cellDev / dpr, bw = dispCols * css, bh = dispRows * css;
    cv.width = dispCols * cellDev;
    cv.height = dispRows * cellDev;
    cv.style.width = bw + 'px';
    cv.style.height = bh + 'px';

    var maxFW = avail.w - (2 * m.cb + 2 * m.pad + 2 * m.fb);
    var maxFH = avail.h - (2 * m.cb + 3 * m.pad + m.panelH + 2 * m.fb);
    var needW = bw > maxFW + 0.01, needH = bh > maxFH + 0.01;
    if (needH && !needW && bw + sbw > maxFW) needW = true;
    if (needW && !needH && bh + sbw > maxFH) needH = true;
    var scroll = needW || needH;
    field.classList.toggle('scroll', scroll);
    field.style.width = scroll ? Math.max(40, Math.floor(Math.min(bw + (needH ? sbw : 0), maxFW))) + 'px' : '';
    field.style.height = scroll ? Math.max(40, Math.floor(Math.min(bh + (needW ? sbw : 0), maxFH))) + 'px' : '';

    sizeCanvas(lcdMines, m.lcdW, m.lcdH);
    sizeCanvas(lcdTime, m.lcdW, m.lcdH);
    faceBtn.style.width = m.face + 'px';
    faceBtn.style.height = m.face + 'px';
    faceCv.width = faceCv.height = Math.round(m.face * dpr);

    sprites = SP.cellSprites(cellDev);
    drawMines();
    drawTime();
    drawFace(true);
    drawNow();
  }

  function sizeCanvas(el, w, h) {
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.width = Math.round(w * dpr);
    el.height = Math.round(h * dpr);
  }

  var layoutQueued = false;
  function queueLayout() {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(function () { layoutQueued = false; layout(false); });
  }

  // ---------- zoom
  function zoomIndex() {
    var z = settings.zoom[levelKey];
    return (typeof z === 'number' && z >= 0 && z < ZOOMS.length) ? z : ZOOM_DEFAULT;
  }
  function zoomBy(d) {
    var z = d === 0 ? ZOOM_DEFAULT : clamp(zoomIndex() + d, 0, ZOOMS.length - 1);
    if (z === zoomIndex()) return;
    // keep the centre of the visible board in place
    var fx = (field.scrollLeft + field.clientWidth / 2) / Math.max(1, field.scrollWidth);
    var fy = (field.scrollTop + field.clientHeight / 2) / Math.max(1, field.scrollHeight);
    settings.zoom[levelKey] = z;
    saveSettings();
    layout(false);
    field.scrollLeft = fx * field.scrollWidth - field.clientWidth / 2;
    field.scrollTop = fy * field.scrollHeight - field.clientHeight / 2;
  }
  function syncZoomButtons() {
    $('z-out').disabled = zoomIndex() === 0;
    $('z-in').disabled = zoomIndex() === ZOOMS.length - 1;
  }

  // =====================================================================
  // Input
  // =====================================================================
  function cellAt(cx, cy) {
    var r = cv.getBoundingClientRect();
    if (cx < r.left || cy < r.top || cx >= r.right || cy >= r.bottom) return -1;
    if (field.classList.contains('scroll')) {
      var f = field.getBoundingClientRect();
      if (cx < f.left || cy < f.top || cx >= f.left + field.clientLeft + field.clientWidth ||
          cy >= f.top + field.clientTop + field.clientHeight) return -1;
    }
    var c = Math.floor((cx - r.left) / r.width * dispCols);
    var rr = Math.floor((cy - r.top) / r.height * dispRows);
    if (c < 0 || rr < 0 || c >= dispCols || rr >= dispRows) return -1;
    return transposed ? c * board.w + rr : rr * board.w + c;
  }

  function pressCell(i) {
    var st = board.state[i];
    if (st === HIDDEN || st === QUESTION) pressed[i] = 1;
  }
  function pressArea(i) {
    pressCell(i);
    var nb = board.neighbours(i);
    for (var k = 0; k < nb.length; k++) pressCell(nb[k]);
  }

  function updatePress() {
    var i = -1, area = false;
    if (!board.isOver()) {
      if (tp.active) { i = tp.cell; area = i >= 0 && board.state[i] === REVEALED; }
      else if (!ms.consumed && (ms.chord || ms.middle)) { i = ms.hover; area = true; }
      else if (!ms.consumed && ms.left) { i = ms.hover; area = i >= 0 && board.state[i] === REVEALED; }
    }
    var sig = i + ':' + area + ':' + mood();
    if (sig === pressSig) return;
    pressSig = sig;
    pressed.fill(0);
    if (i >= 0) { if (area) pressArea(i); else pressCell(i); }
    draw();
  }

  function resetPointers() {
    ms.left = ms.right = ms.middle = ms.chord = ms.consumed = ms.ctrlRight = false;
    ms.hover = -1;
    clearTimeout(tp.timer);
    tp.id = null; tp.active = false; tp.long = false;
    faceDown = false;
    if (pressed) { pressSig = ''; updatePress(); }
  }

  function recentTouch() { return Date.now() - lastTouch < 800; }

  function noteTouch() {
    lastTouch = Date.now();
    if (!touchSeen) { touchSeen = true; queueLayout(); }
  }

  // --- mouse (mouse events give one down/up per button, which chording needs)
  cv.addEventListener('mousedown', function (e) {
    if (recentTouch()) return;
    e.preventDefault();
    SND.unlock();
    closeMenus();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (board.isOver()) return;
    var b = e.button;
    if (b === 0 && e.ctrlKey && IS_MAC) { b = 2; ms.ctrlRight = true; }
    // re-sync with the real button state (a release may have happened off-window)
    if (typeof e.buttons === 'number' && e.buttons) {
      ms.left = !!(e.buttons & 1) && !ms.ctrlRight;
      ms.right = !!(e.buttons & 2) || ms.ctrlRight;
      ms.middle = !!(e.buttons & 4);
      if (!ms.left && !ms.right && !ms.middle) ms.consumed = false;
    }
    ms.hover = cellAt(e.clientX, e.clientY);
    if (b === 0) { ms.left = true; if (ms.right) ms.chord = true; }
    else if (b === 1) { ms.middle = true; ms.chord = true; }
    else if (b === 2) {
      ms.right = true;
      if (ms.left) ms.chord = true;
      else doFlag(ms.hover);     // Windows flags on the press, not the release
    }
    updatePress();
  });

  document.addEventListener('mousemove', function (e) {
    if (!ms.left && !ms.right && !ms.middle) return;
    if (recentTouch()) return;
    var h = cellAt(e.clientX, e.clientY);
    if (h !== ms.hover) { ms.hover = h; updatePress(); }
  });

  document.addEventListener('mouseup', function (e) {
    if (!ms.left && !ms.right && !ms.middle) return;
    if (recentTouch()) return;
    var b = e.button;
    if (b === 0 && ms.ctrlRight) { b = 2; ms.ctrlRight = false; }
    var i = ms.hover = cellAt(e.clientX, e.clientY);
    if (b === 0 && ms.left) {
      ms.left = false;
      if (ms.chord) fireChord(i);
      else if (!ms.consumed && i >= 0) doReveal(i);   // on a number this chords
    } else if (b === 1 && ms.middle) {
      ms.middle = false;
      if (ms.chord) fireChord(i);
    } else if (b === 2 && ms.right) {
      ms.right = false;
      if (ms.chord) fireChord(i);
    }
    if (!ms.left && !ms.right && !ms.middle) { ms.consumed = false; ms.chord = false; }
    updatePress();
  });

  function fireChord(i) {
    ms.chord = false;
    ms.consumed = true;            // the other button's release does nothing
    if (i >= 0 && !board.isOver() && board.state[i] === REVEALED) doChord(i);
  }

  window.addEventListener('blur', function () { resetPointers(); });

  // --- touch (pointer events: the browser cancels them when a pan starts)
  cv.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    noteTouch();
    SND.unlock();
    closeMenus();
    if (tp.id !== null) { cancelTouch(); return; }   // second finger: abort
    if (board.isOver()) return;
    tp.id = e.pointerId;
    tp.x = e.clientX; tp.y = e.clientY;
    tp.cell = cellAt(e.clientX, e.clientY);
    tp.long = false;
    tp.active = true;
    clearTimeout(tp.timer);
    tp.timer = setTimeout(onLongPress, LONG_PRESS_MS);
    updatePress();
  });
  cv.addEventListener('pointermove', function (e) {
    if (e.pointerId !== tp.id) return;
    lastTouch = Date.now();
    if (Math.abs(e.clientX - tp.x) > 10 || Math.abs(e.clientY - tp.y) > 10) cancelTouch();
  });
  cv.addEventListener('pointerup', function (e) {
    if (e.pointerId !== tp.id) return;
    lastTouch = Date.now();
    clearTimeout(tp.timer);
    var i = tp.cell, wasLong = tp.long;
    tp.id = null;
    tp.active = false;
    if (!wasLong) tapAction(i);
    updatePress();
  });
  cv.addEventListener('pointercancel', function (e) { if (e.pointerId === tp.id) cancelTouch(); });

  function cancelTouch() {
    clearTimeout(tp.timer);
    tp.id = null;
    tp.active = false;
    updatePress();
  }

  function onLongPress() {
    if (tp.id === null) return;
    tp.long = true;
    tp.active = false;
    var i = tp.cell;
    if (i >= 0 && !board.isOver()) {
      var st = board.state[i], acted = false;
      if (st === REVEALED) { var before = board.revealed; doChord(i); acted = board.revealed !== before || board.isOver(); }
      else if (flagMode) { if (st !== FLAGGED) { doReveal(i); acted = true; } }
      else acted = doFlag(i);
      if (acted) buzz(25);
    }
    updatePress();
  }

  function tapAction(i) {
    if (i < 0 || board.isOver()) return;
    var st = board.state[i];
    if (st === REVEALED) doChord(i);
    else if (flagMode) doFlag(i);
    else doReveal(i);
  }

  // no context menu / selection callout on the game window
  [win, modebar].forEach(function (el) {
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    el.addEventListener('selectstart', function (e) { if (!/INPUT/.test(e.target.tagName)) e.preventDefault(); });
  });
  cv.addEventListener('dragstart', function (e) { e.preventDefault(); });

  // first gesture unlocks audio; any touch switches on the touch UI
  document.addEventListener('pointerdown', function (e) {
    SND.unlock();
    if (e.pointerType === 'touch') noteTouch();
  }, true);
  document.addEventListener('keydown', function () { SND.unlock(); }, true);

  // --- face button: sinks while held, new game on release over it
  faceBtn.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    faceDown = true;
    drawFace();
  });
  faceBtn.addEventListener('pointerleave', function () { if (faceDown) { faceDown = false; drawFace(); } });
  faceBtn.addEventListener('pointerup', function () { if (faceDown) { faceDown = false; drawFace(); } });
  faceBtn.addEventListener('pointercancel', function () { faceDown = false; drawFace(); });
  faceBtn.addEventListener('click', function () {
    SND.click();
    newGame();
  });

  // --- touch mode bar
  function setFlagMode(on) {
    flagMode = !!on;
    mDig.setAttribute('aria-pressed', String(!flagMode));
    mFlag.setAttribute('aria-pressed', String(flagMode));
  }
  mDig.addEventListener('click', function () { setFlagMode(false); SND.click(); });
  mFlag.addEventListener('click', function () { setFlagMode(true); SND.click(); });
  $('z-in').addEventListener('click', function () { zoomBy(1); });
  $('z-out').addEventListener('click', function () { zoomBy(-1); });

  // --- sound toggle
  function setMuted(m) {
    settings.muted = !!m;
    SND.setMuted(settings.muted);
    saveSettings();
    muteBtn.innerHTML = SP.svgFromArt(settings.muted ? SPEAKER_OFF : SPEAKER_ON);
    muteBtn.setAttribute('aria-pressed', String(settings.muted));
    muteBtn.setAttribute('aria-label', settings.muted ? 'Unmute sound' : 'Mute sound');
    muteBtn.title = settings.muted ? 'Sound off (M)' : 'Sound on (M)';
    syncMenus();
  }
  muteBtn.addEventListener('click', function () { setMuted(!settings.muted); if (!settings.muted) SND.click(); });

  // --- keyboard
  document.addEventListener('keydown', function (e) {
    var dlg = openDialogEl;
    if (dlg) {
      if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
      else if ((e.key === 'F2') && dlg.id !== 'dlg-custom') { e.preventDefault(); closeDialog(); newGame(); }
      return;
    }
    var t = e.target;
    if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'F2': case 'n': case 'N': e.preventDefault(); newGame(); break;
      case '1': newGame('beginner'); break;
      case '2': newGame('intermediate'); break;
      case '3': newGame('expert'); break;
      case 'm': case 'M': setMuted(!settings.muted); break;
      case '+': case '=': zoomBy(1); break;
      case '-': case '_': zoomBy(-1); break;
      case '0': zoomBy(0); break;
      case 'Escape': closeMenus(); break;
      default: return;
    }
  });

  // =====================================================================
  // Menus
  // =====================================================================
  var openMenuBtn = null;
  var menuBtns = Array.prototype.slice.call(document.querySelectorAll('.menu-btn'));
  function openMenu(btn) {
    closeMenus();
    resetPointers();
    btn.nextElementSibling.hidden = false;
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    openMenuBtn = btn;
    syncMenus();
  }
  function closeMenus() {
    if (!openMenuBtn) return;
    openMenuBtn.nextElementSibling.hidden = true;
    openMenuBtn.classList.remove('open');
    openMenuBtn.setAttribute('aria-expanded', 'false');
    openMenuBtn = null;
  }
  menuBtns.forEach(function (b) {
    b.addEventListener('click', function () { if (openMenuBtn === b) closeMenus(); else openMenu(b); });
    b.addEventListener('pointerenter', function (e) {
      if (openMenuBtn && openMenuBtn !== b && e.pointerType === 'mouse') openMenu(b);
    });
  });
  document.addEventListener('pointerdown', function (e) {
    if (openMenuBtn && !(e.target.closest && e.target.closest('.menu'))) closeMenus();
  }, true);

  Array.prototype.forEach.call(document.querySelectorAll('.dropdown button'), function (item) {
    item.addEventListener('click', function () {
      var act = item.getAttribute('data-act');
      closeMenus();
      if (act === 'new') newGame();
      else if (act === 'level') newGame(item.getAttribute('data-level'));
      else if (act === 'custom') openCustom();
      else if (act === 'marks') {
        settings.marks = !settings.marks;
        saveSettings();
        if (!settings.marks) { board.clearMarks(); draw(); }
        syncMenus();
      }
      else if (act === 'sound') setMuted(!settings.muted);
      else if (act === 'best') openBest();
      else if (act === 'howto') openDialog('dlg-howto');
      else if (act === 'about') openDialog('dlg-about');
    });
  });

  function syncMenus() {
    Array.prototype.forEach.call(document.querySelectorAll('.dropdown [data-level]'), function (el) {
      el.setAttribute('aria-checked', String(el.getAttribute('data-level') === settings.level));
    });
    var marks = document.querySelector('[data-act="marks"]'), snd = document.querySelector('[data-act="sound"]');
    marks.setAttribute('aria-checked', String(settings.marks));
    snd.setAttribute('aria-checked', String(!settings.muted));
  }

  // =====================================================================
  // Dialogs
  // =====================================================================
  var openDialogEl = null, lastFocus = null;
  function openDialog(id) {
    closeMenus();
    closeDialog();
    resetPointers();
    var d = $(id);
    lastFocus = document.activeElement;
    backdrop.hidden = false;
    d.hidden = false;
    openDialogEl = d;
    var f = d.querySelector('input') || d.querySelector('.dbuttons .btn98:last-child, .cf-buttons .btn98');
    if (f) try { f.focus({ preventScroll: true }); if (f.select) f.select(); } catch (e) { /* ignore */ }
  }
  function closeDialog() {
    if (!openDialogEl) return;
    openDialogEl.hidden = true;
    backdrop.hidden = true;
    openDialogEl = null;
    if (lastFocus && lastFocus.focus && lastFocus !== document.body) try { lastFocus.blur(); } catch (e) { /* ignore */ }
  }
  backdrop.addEventListener('pointerdown', function (e) { if (e.target === backdrop) closeDialog(); });
  backdrop.addEventListener('contextmenu', function (e) { if (!/INPUT/.test(e.target.tagName)) e.preventDefault(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
    b.addEventListener('click', closeDialog);
  });

  function openCustom() {
    $('cf-h').value = dims.h;
    $('cf-w').value = dims.w;
    $('cf-m').value = dims.mines;
    updateCustomHint();
    openDialog('dlg-custom');
  }
  function updateCustomHint() {
    var w = MS.clampCustom($('cf-w').value, $('cf-h').value, 10).w;
    var h = MS.clampCustom($('cf-w').value, $('cf-h').value, 10).h;
    $('cf-m').max = MS.maxMines(w, h);
    $('cf-hint').textContent = 'Width 9–30, height 9–24, mines 10–' + MS.maxMines(w, h) + ' for ' + w + '×' + h + '.';
  }
  ['cf-w', 'cf-h'].forEach(function (id) { $(id).addEventListener('input', updateCustomHint); });
  $('custom-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = MS.clampCustom($('cf-w').value, $('cf-h').value, $('cf-m').value);
    settings.custom = c;
    saveSettings();
    closeDialog();
    lastDimsKey = '';
    newGame('custom');
  });

  function openBest() {
    var rows = [], keys = ['beginner', 'intermediate', 'expert'];
    keys.forEach(function (k) {
      rows.push(bestRow(MS.LEVELS[k].name, k, levelKey === k));
    });
    if (levelKey === 'custom') rows.push(bestRow('Custom ' + dims.w + '×' + dims.h + '/' + dims.mines, recordKey(), true));
    $('best-table').innerHTML = rows.join('');
    resetArmed = false;
    $('best-reset').textContent = 'Reset Scores';
    openDialog('dlg-best');
  }
  function bestRow(label, k, cur) {
    var t = typeof best[k] === 'number' ? (best[k] / 1000).toFixed(2) + ' seconds' : '—';
    var s = stats[k] && stats[k].played ? 'won ' + stats[k].won + ' of ' + stats[k].played : '';
    return '<tr' + (cur ? ' class="cur"' : '') + '><td>' + label + ':</td><td class="t">' + t + '</td><td class="s">' + s + '</td></tr>';
  }
  var resetArmed = false, resetTimer = 0;
  $('best-reset').addEventListener('click', function () {
    var btn = $('best-reset');
    if (!resetArmed) {
      resetArmed = true;
      btn.textContent = 'Really reset?';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { resetArmed = false; btn.textContent = 'Reset Scores'; }, 3000);
      return;
    }
    resetArmed = false;
    best = {}; stats = {};
    save('best', best); save('stats', stats);
    openBest();
    setStatus();
  });

  // =====================================================================
  // Status bar
  // =====================================================================
  function setStatus(msg) {
    var label = levelKey === 'custom'
      ? 'Custom ' + dims.w + ' × ' + dims.h + ', ' + dims.mines + ' mines'
      : dims.name + ' · ' + dims.w + ' × ' + dims.h + ' · ' + dims.mines + ' mines';
    stLeft.textContent = msg || label;
    var b = best[recordKey()];
    stRight.textContent = 'Best: ' + (typeof b === 'number' ? fmt(b) : '—');
  }

  // =====================================================================
  // Boot
  // =====================================================================
  window.addEventListener('resize', queueLayout);
  window.addEventListener('orientationchange', function () { queueLayout(); setTimeout(queueLayout, 300); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueLayout);
  if (coarseMQ.addEventListener) coarseMQ.addEventListener('change', queueLayout);

  SND.setMuted(settings.muted);
  setMuted(settings.muted);
  setFlagMode(false);
  newGame();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueLayout);

  // Debug/test hook: mine layout in board coordinates, plus a few helpers.
  window.__mines = function () {
    if (!board || !board.generated) return null;
    return board.mineList().map(function (i) { return [i % board.w, Math.floor(i / board.w)]; });
  };
  window.__game = {
    get board() { return board; },
    get transposed() { return transposed; },
    get flagMode() { return flagMode; },
    get timer() { return timer.shown; },
    get mood() { return mood(); },
    get faceDown() { return faceDown; },
    get pressedCount() { var n = 0; for (var i = 0; i < pressed.length; i++) n += pressed[i]; return n; },
    get dialog() { return openDialogEl ? openDialogEl.id : null; },
    newGame: newGame,
    redraw: function () { pressSig = ''; draw(); drawMines(); drawFace(true); },
    cellCenter: function (x, y) {
      var r = cv.getBoundingClientRect();
      var c = transposed ? y : x, rr = transposed ? x : y;
      var cw = r.width / dispCols, ch = r.height / dispRows;
      return { x: r.left + (c + 0.5) * cw, y: r.top + (rr + 0.5) * ch, cell: cw };
    },
    scrollIntoView: function (x, y) {
      if (!field.classList.contains('scroll')) return;
      var c = transposed ? y : x, rr = transposed ? x : y;
      var css = cellDev / dpr;
      field.scrollLeft = (c + 0.5) * css - field.clientWidth / 2;
      field.scrollTop = (rr + 0.5) * css - field.clientHeight / 2;
    },
    layoutInfo: function () {
      return { cell: cellDev / dpr, transposed: transposed, cols: dispCols, rows: dispRows,
        scroll: field.classList.contains('scroll'), flags: Object.assign({}, flags) };
    }
  };
})();
