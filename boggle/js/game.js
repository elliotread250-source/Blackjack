/*
 * Boggle UI: title screen, board rendering, drag / tap / keyboard input,
 * the round timer, the CPU, results and saved stats. All the rules live in
 * logic.js (window.BoggleLogic); this file is just the table.
 */
(function () {
  'use strict';

  var L = window.BoggleLogic;
  var Sound = window.BoggleSound;
  var WORDS_URL = 'words.txt?v=1';
  var KEY = 'oa-boggle:';

  /* ---------- storage (never trusted, never required) ---------- */

  function load(name, fallback) {
    try {
      var raw = localStorage.getItem(KEY + name);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function save(name, value) {
    try { localStorage.setItem(KEY + name, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
  }

  var settings = (function () {
    var s = load('settings', {});
    if (!s || typeof s !== 'object') s = {};
    return {
      size: s.size === 5 ? 5 : 4,
      opponent: ['solo', 'easy', 'normal', 'hard'].indexOf(s.opponent) >= 0 ? s.opponent : 'solo',
      daily: s.daily === true,
      timed: s.timed !== false,
      muted: s.muted === true
    };
  })();
  function saveSettings() { save('settings', settings); }

  function getStats(size) { return L.sanitizeStats((load('stats', {}) || {})[size]); }
  function putStats(size, st) {
    var all = load('stats', {});
    if (!all || typeof all !== 'object') all = {};
    all[size] = st;
    save('stats', all);
  }
  function dailyRecords() {
    var d = load('daily', {});
    return d && typeof d === 'object' ? d : {};
  }

  /* ---------- DOM ---------- */

  function $(id) { return document.getElementById(id); }
  var app = $('app');
  var tray = $('tray');
  var boardEl = $('board');
  var facesEl = $('faces');
  var svg = $('path-svg');
  var wordEl = $('word');
  var previewEl = $('preview');
  var hintEl = $('hint');
  var toastEl = $('toast');
  var timerEl = $('timer');
  var playBtn = $('play-btn');
  var submitBtn = $('submit-btn');
  var endBtn = $('end-btn');
  var foundList = $('found-list');
  var floatLayer = $('float-layer');
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ---------- state ---------- */

  var dict = null;
  var dictState = 'loading'; // loading | ready | error

  var S = {
    phase: 'title', // title | playing | paused | over
    size: 4, minLen: 3, seconds: 180, timed: true, opponent: 'solo',
    daily: false, dayKey: '', dailyNo: 0,
    board: [], solution: [], solMap: null,
    found: [], foundSet: null, score: 0,
    path: [], typed: '', typedMiss: false,
    elapsed: 0, lastFrame: 0, lastTickSec: -1,
    bot: [], botShown: 0,
    rot: 0, spinning: false,
    tiles: [], cells: [], centers: [], pitch: 1,
    result: null, resultTab: 'all', activeChip: null
  };

  /* ---------- dictionary ---------- */

  function loadDictionary() {
    dictState = 'loading';
    updatePlayButton();
    fetch(WORDS_URL, { cache: 'default' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        dict = L.parseWordList(text);
        if (dict.words.length < 1000) throw new Error('word list too short');
        dictState = 'ready';
        updatePlayButton();
      })
      .catch(function () {
        dictState = 'error';
        updatePlayButton();
      });
  }

  function updatePlayButton() {
    var t = playBtn.querySelector('.play-text');
    playBtn.classList.toggle('loading', dictState === 'loading');
    if (dictState === 'loading') {
      playBtn.disabled = true;
      t.textContent = 'Loading words…';
    } else if (dictState === 'error') {
      playBtn.disabled = false;
      t.textContent = 'Couldn’t load words. Retry';
    } else {
      playBtn.disabled = false;
      t.textContent = 'Play';
    }
  }

  /* ---------- title screen ---------- */

  function syncSetup() {
    var today = new Date();
    var key = L.dateKey(today);
    var no = L.dailyNumber(today);
    var rec = dailyRecords()[key + ':' + settings.size];
    $('daily-no').textContent = '#' + no + (rec ? ' ✓' : '');
    $('timer-label').textContent = fmtTime(L.MODES[settings.size].seconds);

    var vs = settings.opponent !== 'solo';
    var relaxed = $('relaxed-btn');
    relaxed.disabled = vs;
    var timed = vs ? true : settings.timed;

    var values = { size: String(settings.size), opponent: settings.opponent, daily: settings.daily ? '1' : '0', timed: timed ? '1' : '0' };
    var segs = document.querySelectorAll('.setup .seg');
    for (var i = 0; i < segs.length; i++) {
      var opt = segs[i].getAttribute('data-opt');
      var btns = segs[i].querySelectorAll('button');
      for (var j = 0; j < btns.length; j++) {
        var on = btns[j].getAttribute('data-val') === values[opt];
        btns[j].setAttribute('aria-checked', on ? 'true' : 'false');
        btns[j].tabIndex = on ? 0 : -1;
      }
    }

    var note = '';
    if (vs) note = 'Against the CPU the clock always runs. Words you both find are crossed out.';
    else if (settings.daily && rec) note = 'You played today’s board: ' + rec.score + ' pts, ' + rec.words + ' of ' + rec.total + ' words. Replays don’t change that.';
    else if (settings.daily) note = 'Everyone gets the same letters today. New board at midnight.';
    $('opt-note').textContent = note;

    var st = getStats(settings.size);
    var parts = [];
    if (st.played) parts.push('Best (' + L.MODES[settings.size].name + '): <b>' + st.best + '</b> pts');
    if (st.longest) parts.push('Longest: <b>' + st.longest.toUpperCase() + '</b>');
    $('best-line').innerHTML = parts.join(' &middot; ');
  }

  function onSetupClick(e) {
    var btn = e.target.closest('.seg button');
    if (!btn || btn.disabled) return;
    var opt = btn.parentNode.getAttribute('data-opt');
    var v = btn.getAttribute('data-val');
    if (opt === 'size') settings.size = v === '5' ? 5 : 4;
    else if (opt === 'opponent') settings.opponent = v;
    else if (opt === 'daily') settings.daily = v === '1';
    else if (opt === 'timed') settings.timed = v === '1';
    saveSettings();
    Sound.unlock();
    Sound.select(2);
    syncSetup();
  }

  // Arrow keys inside a radio group, like native radios.
  function onSetupKey(e) {
    var btn = e.target.closest('.seg button');
    if (!btn) return;
    var dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    var btns = Array.prototype.filter.call(btn.parentNode.querySelectorAll('button'), function (b) { return !b.disabled; });
    var i = btns.indexOf(btn);
    var next = btns[(i + dir + btns.length) % btns.length];
    next.focus();
    next.click();
  }

  function showScreen(name) {
    app.setAttribute('data-screen', name);
    if (name === 'title') syncSetup();
  }

  /* ---------- starting a round ---------- */

  function startGame() {
    if (dictState === 'error') { loadDictionary(); return; }
    if (dictState !== 'ready') return;
    Sound.unlock();

    var mode = L.MODES[settings.size];
    S.size = settings.size;
    S.minLen = mode.minLen;
    S.seconds = mode.seconds;
    S.opponent = settings.opponent;
    S.timed = S.opponent !== 'solo' ? true : settings.timed;
    S.daily = settings.daily;

    var t0 = performance.now();
    var rnd;
    if (S.daily) {
      var now = new Date();
      S.dayKey = L.dateKey(now);
      S.dailyNo = L.dailyNumber(now);
      rnd = L.mulberry32(L.dailySeed(S.dayKey, S.size));
    } else {
      rnd = L.mulberry32(L.randomSeed());
    }
    var g = L.generateBoard(S.size, rnd, dict, { minLen: S.minLen });
    S.board = g.board;
    S.solution = g.solution;
    S.solMap = new Map();
    for (var i = 0; i < g.solution.length; i++) S.solMap.set(g.solution[i].word, g.solution[i].path);
    S.solveMs = performance.now() - t0;

    S.found = [];
    S.foundSet = new Set();
    S.score = 0;
    S.path = [];
    S.typed = '';
    S.typedMiss = false;
    S.elapsed = 0;
    S.lastFrame = 0;
    S.lastTickSec = -1;
    S.rot = 0;
    S.result = null;
    S.activeChip = null;
    S.bot = S.opponent === 'solo' ? [] : L.planBot(S.solution, S.opponent, S.seconds, L.mulberry32(L.randomSeed()), S.minLen, dict);
    S.botShown = 0;

    app.classList.remove('over');
    app.classList.toggle('solo', S.opponent === 'solo');
    $('hud-mode').innerHTML = '<b>' + mode.name + '</b>' + (S.daily ? 'Daily #' + S.dailyNo : 'Random');
    // Solo: the right-hand box shows the best score to beat instead.
    var solo = S.opponent === 'solo';
    $('cpu-box').classList.toggle('best', solo);
    $('cpu-label').textContent = solo ? 'Best' : 'CPU';
    $('cpu-unit').textContent = solo ? 'pts' : 'words';
    $('cpu-sub').textContent = solo ? (getStats(S.size).played ? mode.name : 'no games yet') : cap(S.opponent) + ' bot';
    $('cpu-words').textContent = solo ? String(getStats(S.size).best) : '0';
    endBtn.classList.remove('confirm');
    endBtn.querySelector('span').textContent = 'End';
    foundList.innerHTML = '';
    $('pause-cover').hidden = true;
    $('again-btn').textContent = S.daily ? 'Random board' : 'New board';
    clearGhost();
    hintEl.textContent = window.matchMedia && matchMedia('(pointer: fine)').matches ? 'Drag across the letters, or type a word' : 'Drag across the letters';
    updateHud();
    showScreen('game');
    buildBoard(true);
    layout();
    setPreview();
    S.phase = 'playing';
    updateTimer();
    requestAnimationFrame(frame);
    Sound.shake();
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- board ---------- */

  function faceHTML(f) {
    if (f === 'qu') return 'Q<small>u</small>';
    return f.toUpperCase();
  }

  function buildBoard(roll) {
    // Two stacked grids: the cubes, then the path line, then the letters on
    // top, so the line never hides a letter.
    var n = S.size;
    boardEl.style.setProperty('--n', n);
    facesEl.style.setProperty('--n', n);
    boardEl.innerHTML = '';
    facesEl.innerHTML = '';
    S.tiles = [];
    S.cells = [];
    for (var i = 0; i < S.board.length; i++) {
      var t = document.createElement('div');
      t.className = 'tile';
      t.setAttribute('role', 'gridcell');
      t.setAttribute('aria-label', S.board[i] === 'qu' ? 'Qu' : S.board[i].toUpperCase());
      var cell = document.createElement('div');
      cell.className = 'cell';
      var f = document.createElement('span');
      f.className = 'face' + (S.board[i] === 'qu' ? ' qu' : '');
      f.innerHTML = faceHTML(S.board[i]);
      cell.appendChild(f);
      if (roll) {
        var vars = {
          '--d': Math.round(Math.random() * 220) + 'ms',
          '--rx': Math.round((Math.random() - 0.5) * 60) + 'px',
          '--ry': Math.round(-20 - Math.random() * 40) + 'px',
          '--rr': Math.round((Math.random() - 0.5) * 360) + 'deg'
        };
        [t, cell].forEach(function (el) {
          el.classList.add('roll');
          for (var k in vars) el.style.setProperty(k, vars[k]);
          el.addEventListener('animationend', onRollEnd);
        });
      }
      boardEl.appendChild(t);
      facesEl.appendChild(cell);
      S.tiles.push(t);
      S.cells.push(cell);
    }
    placeTiles();
  }

  function onRollEnd(e) {
    if (e.animationName === 'roll') e.currentTarget.classList.remove('roll');
  }

  // Display row/col of cell i after S.rot quarter turns clockwise.
  function displayRC(i) {
    var n = S.size;
    var r = Math.floor(i / n), c = i % n;
    for (var k = 0; k < S.rot; k++) { var t = r; r = c; c = n - 1 - t; }
    return [r, c];
  }

  function placeTiles() {
    for (var i = 0; i < S.tiles.length; i++) {
      var rc = displayRC(i);
      S.tiles[i].style.gridRow = S.cells[i].style.gridRow = String(rc[0] + 1);
      S.tiles[i].style.gridColumn = S.cells[i].style.gridColumn = String(rc[1] + 1);
    }
  }

  // Tile centres in tray coordinates (what the SVG and hit tests use).
  function measure() {
    var ox = boardEl.offsetLeft, oy = boardEl.offsetTop;
    S.centers = [];
    for (var i = 0; i < S.tiles.length; i++) {
      var t = S.tiles[i];
      S.centers.push([ox + t.offsetLeft + t.offsetWidth / 2, oy + t.offsetTop + t.offsetHeight / 2]);
    }
    var a = S.tiles[0], n = S.size;
    S.tileSize = a ? a.offsetWidth : 1;
    S.pitch = n > 1 ? (boardEl.clientWidth - S.tileSize) / (n - 1) : S.tileSize;
    svg.setAttribute('viewBox', '0 0 ' + tray.clientWidth + ' ' + tray.clientHeight);
  }

  function rotate() {
    if (S.spinning || (S.phase !== 'playing' && S.phase !== 'over')) return;
    S.spinning = true;
    clearGhost(true);
    svg.style.opacity = '0';
    boardEl.classList.add('spin');
    facesEl.classList.add('spin');
    Sound.select(1);
    setTimeout(function () {
      boardEl.style.transition = facesEl.style.transition = 'none';
      var faces = facesEl.querySelectorAll('.face');
      for (var i = 0; i < faces.length; i++) faces[i].style.transition = 'none';
      boardEl.classList.remove('spin');
      facesEl.classList.remove('spin');
      S.rot = (S.rot + 1) % 4;
      placeTiles();
      measure();
      drawPath();
      if (S.activeChip) highlightWord(S.activeChip, true);
      void boardEl.offsetWidth;
      boardEl.style.transition = facesEl.style.transition = '';
      for (var j = 0; j < faces.length; j++) faces[j].style.transition = '';
      svg.style.opacity = '';
      S.spinning = false;
    }, 270);
  }

  /* ---------- layout ---------- */

  function layout() {
    if (app.getAttribute('data-screen') !== 'game') return;
    var appH = app.clientHeight;
    var W = window.innerWidth;
    var wide = W >= 820;
    var over = S.phase === 'over' || app.classList.contains('over');
    var main = document.querySelector('.main');
    var mainW = main.clientWidth - 24;
    var used = document.querySelector('.game-top').offsetHeight + $('hud').offsetHeight + previewEl.offsetHeight;
    var ctrl = (over ? $('over-actions') : $('controls'));
    var ctrlH = (ctrl.offsetHeight || 46) + 12;
    var bottom = 12;
    var bs;
    if (wide) {
      var sideMin = 340;
      bs = Math.min(appH - used - ctrlH - bottom - 6, mainW - 22 - sideMin, 600);
    } else {
      var sideMin = over ? Math.max(250, appH * 0.46) : Math.max(110, appH * 0.15);
      bs = Math.min(appH - used - ctrlH - 10 - sideMin - bottom, mainW, 560);
    }
    bs = Math.max(Math.floor(bs), 180);
    tray.style.setProperty('--bs', bs + 'px');
    var ext = wide ? bs : Math.min(mainW, Math.max(bs, 330));
    app.style.setProperty('--bs-ext', ext + 'px');
    measure();
    drawPath();
    if (S.activeChip) highlightWord(S.activeChip, true);
  }

  /* ---------- path drawing ---------- */

  function polyPoints(path) {
    var pts = [];
    for (var i = 0; i < path.length; i++) {
      var c = S.centers[path[i]];
      if (c) pts.push(c[0].toFixed(1) + ',' + c[1].toFixed(1));
    }
    return pts.join(' ');
  }

  function pathLength(path) {
    var len = 0;
    for (var i = 1; i < path.length; i++) {
      var a = S.centers[path[i - 1]], b = S.centers[path[i]];
      len += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return len;
  }

  var liveG = document.createElementNS(SVGNS, 'g');
  var ghostG = document.createElementNS(SVGNS, 'g');
  svg.appendChild(ghostG);
  svg.appendChild(liveG);

  function drawInto(g, path, cls, animate) {
    g.innerHTML = '';
    if (!path.length || !S.centers.length) return;
    var w = S.pitch * 0.16;
    if (path.length > 1) {
      var pl = document.createElementNS(SVGNS, 'polyline');
      pl.setAttribute('points', polyPoints(path));
      pl.setAttribute('class', 'line' + (cls ? ' ' + cls : '') + (animate ? ' draw' : ''));
      pl.setAttribute('stroke-width', w.toFixed(1));
      if (animate) pl.style.setProperty('--len', Math.ceil(pathLength(path)) + 1);
      g.appendChild(pl);
    }
    for (var i = 0; i < path.length; i++) {
      var c = S.centers[path[i]];
      var dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('cx', c[0].toFixed(1));
      dot.setAttribute('cy', c[1].toFixed(1));
      dot.setAttribute('r', (i === 0 ? w * 0.95 : w * 0.6).toFixed(1));
      if (cls) dot.setAttribute('class', cls);
      g.appendChild(dot);
    }
  }

  function drawPath() {
    drawInto(liveG, S.phase === 'playing' ? S.path : [], '', false);
    var sel = {};
    for (var i = 0; i < S.path.length; i++) sel[S.path[i]] = true;
    var last = S.path[S.path.length - 1];
    for (var j = 0; j < S.tiles.length; j++) {
      var on = !!sel[j] && S.phase === 'playing';
      S.tiles[j].classList.toggle('sel', on);
      S.cells[j].classList.toggle('sel', on);
      S.tiles[j].classList.toggle('last', j === last && S.phase === 'playing');
      S.cells[j].classList.toggle('last', j === last && S.phase === 'playing');
    }
  }

  var ghostTimer = 0;
  function ghostPath(path, cls) {
    clearTimeout(ghostTimer);
    drawInto(ghostG, path, cls, false);
    ghostG.style.transition = 'none';
    ghostG.style.opacity = '1';
    ghostG.getBoundingClientRect();
    requestAnimationFrame(function () {
      ghostG.style.transition = 'opacity 450ms ease-out 120ms';
      ghostG.style.opacity = '0';
    });
    ghostTimer = setTimeout(function () { ghostG.innerHTML = ''; }, 700);
  }
  function clearGhost(keepTiles) {
    clearTimeout(ghostTimer);
    ghostG.innerHTML = '';
    ghostG.style.opacity = '1';
    ghostG.style.transition = 'none';
    if (!keepTiles) {
      for (var i = 0; i < S.tiles.length; i++) S.tiles[i].classList.remove('hl', 'hl-cpu');
    }
  }

  function flashTiles(path, cls) {
    for (var i = 0; i < path.length; i++) {
      var t = S.tiles[path[i]];
      if (!t) continue;
      t.classList.remove('flash-good', 'flash-bad', 'flash-warn');
      void t.offsetWidth;
      t.classList.add(cls);
    }
    setTimeout(function () {
      for (var i = 0; i < path.length; i++) if (S.tiles[path[i]]) S.tiles[path[i]].classList.remove(cls);
    }, 420);
  }

  /* ---------- preview + feedback ---------- */

  var previewTimer = 0;
  function currentWord() {
    if (S.typed) return S.typed;
    return S.path.length ? L.wordFromPath(S.board, S.path) : '';
  }

  // Only new letters animate in: the spans for the unchanged start stay put.
  var shownWord = '';
  function renderWord(word, cls) {
    var className = 'word' + (cls ? ' ' + cls : '') + (word.length > 10 ? ' long' : '');
    var pts = wordEl.querySelector('.pts');
    if (pts) wordEl.removeChild(pts);
    var spans = wordEl.querySelectorAll('span');
    var keep = 0;
    var calm = !/\b(ok|no|warn)\b/.test(wordEl.className) && !/\b(ok|no|warn)\b/.test(className);
    if (calm && spans.length === shownWord.length) {
      while (keep < word.length && keep < shownWord.length && word[keep] === shownWord[keep]) keep++;
    }
    if (keep === 0) wordEl.innerHTML = '';
    else for (var r = spans.length - 1; r >= keep; r--) wordEl.removeChild(spans[r]);
    for (var i = keep; i < word.length; i++) {
      var sp = document.createElement('span');
      sp.textContent = word.charAt(i).toUpperCase();
      wordEl.appendChild(sp);
    }
    wordEl.className = className;
    shownWord = word;
  }

  function setPreview() {
    clearTimeout(previewTimer);
    var w = currentWord();
    var cls = '';
    if (w) {
      if (S.typed && S.typedMiss) cls = 'miss';
      else if (S.foundSet && S.foundSet.has(w)) cls = 'dupe';
    }
    renderWord(w, cls);
    if (w && w.length >= S.minLen && !cls) {
      var p = document.createElement('span');
      p.className = 'pts';
      var n = L.scoreWord(w);
      p.textContent = n + (n === 1 ? ' pt' : ' pts');
      wordEl.appendChild(p);
    }
    previewEl.classList.toggle('has-word', !!w);
    submitBtn.disabled = !(S.phase === 'playing' && (S.typed || S.path.length >= 2));
  }

  function flashWord(word, cls) {
    clearTimeout(previewTimer);
    renderWord(word, cls);
    previewEl.classList.add('has-word');
    previewTimer = setTimeout(function () {
      if (!currentWord()) { renderWord('', ''); previewEl.classList.remove('has-word'); }
    }, cls === 'ok' ? 430 : 700);
  }

  var toastTimer = 0;
  function toast(msg, kind) {
    clearTimeout(toastTimer);
    toastEl.className = 'toast';
    toastEl.textContent = msg;
    void toastEl.offsetWidth;
    toastEl.className = 'toast show ' + (kind || '');
    toastTimer = setTimeout(function () { toastEl.className = 'toast'; }, 1350);
  }

  function floatPoints(path, pts) {
    var c = S.centers[path[path.length - 1]];
    if (!c) return;
    var el = document.createElement('div');
    el.className = 'float';
    el.textContent = '+' + pts;
    el.style.left = c[0] + 'px';
    el.style.top = c[1] + 'px';
    floatLayer.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 950);
  }

  var PRAISE = { 1: 'Good', 2: 'Nice!', 3: 'Great!', 5: 'Superb!', 11: 'Amazing!' };

  /* ---------- submitting ---------- */

  function submit() {
    if (S.phase !== 'playing') return;
    var word = currentWord();
    if (!word) return;
    var path = S.typed ? (S.typedMiss ? null : L.findPath(S.board, S.typed, false)) : S.path.slice();
    if (S.typed && !path) path = null;
    if (path && L.wordFromPath(S.board, path) !== word) path = null; // e.g. typed "q" alone
    S.path = [];
    S.typed = '';
    S.typedMiss = false;
    drawPath();
    setPreview();

    if (word.length < S.minLen) {
      flashWord(word, 'warn');
      toast('Too short (' + S.minLen + '+ letters)', 'warn');
      if (path) flashTiles(path, 'flash-warn');
      Sound.bad();
      return;
    }
    if (!path) {
      flashWord(word, 'no');
      toast('Not on the board', 'bad');
      Sound.bad();
      return;
    }
    if (S.foundSet.has(word)) {
      flashWord(word, 'warn');
      toast('Already found', 'warn');
      flashTiles(path, 'flash-warn');
      var chip = foundList.querySelector('[data-word="' + word + '"]');
      if (chip) { chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); }
      Sound.dupe();
      return;
    }
    if (!dict.set.has(word)) {
      flashWord(word, 'no');
      toast('Not a word', 'bad');
      flashTiles(path, 'flash-bad');
      Sound.bad();
      return;
    }
    var pts = L.scoreWord(word);
    S.found.push(word);
    S.foundSet.add(word);
    S.score += pts;
    flashWord(word, 'ok');
    toast(PRAISE[pts] + ' +' + pts, 'good');
    flashTiles(path, 'flash-good');
    ghostPath(path, 'good');
    floatPoints(path, pts);
    addFoundChip(word, pts);
    updateHud(true);
    Sound.good(pts);
  }

  function addFoundChip(word, pts) {
    var prev = foundList.querySelector('.chip.new');
    if (prev) prev.classList.remove('new');
    var li = document.createElement('li');
    li.className = 'chip new';
    li.setAttribute('data-word', word);
    li.innerHTML = esc(word) + ' <i>' + pts + '</i>';
    foundList.insertBefore(li, foundList.firstChild);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }

  function updateHud(bumpMine) {
    var sc = $('my-score');
    sc.textContent = S.score;
    var n = S.found.length;
    $('my-words').textContent = n + (n === 1 ? ' word' : ' words');
    $('found-meta').textContent = n + ' · ' + S.score + ' pts';
    $('found-empty').hidden = n > 0;
    if (bumpMine) { sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump'); }
  }

  /* ---------- pointer input ---------- */

  var drag = null;

  function trayPoint(e) {
    var r = tray.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  // Nearest cell to a point. Strict mode only counts a circle around each
  // centre, so a diagonal swipe through the corner where four cubes meet
  // does not clip the two side cubes.
  function hitCell(x, y, strict) {
    var best = -1, bestD = Infinity;
    for (var i = 0; i < S.centers.length; i++) {
      var c = S.centers[i];
      var d = Math.hypot(x - c[0], y - c[1]);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) return -1;
    var lim = strict ? S.pitch * 0.4 : S.pitch * 0.72;
    return bestD <= lim ? best : -1;
  }

  function onPointerDown(e) {
    if (S.phase !== 'playing' || S.spinning) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var p = trayPoint(e);
    var cell = hitCell(p[0], p[1], false);
    if (cell < 0) return;
    e.preventDefault();
    Sound.unlock();
    if (S.typed) { S.typed = ''; S.typedMiss = false; S.path = []; }
    var path = S.path;
    var last = path[path.length - 1];
    var mode;
    if (path.length && cell === last) mode = 'last';
    else if (path.length && path.indexOf(cell) >= 0) { path.length = path.indexOf(cell) + 1; mode = 'trunc'; }
    else if (path.length && L.isAdjacent(S.size, last, cell)) { path.push(cell); mode = 'append'; }
    else { S.path = [cell]; mode = 'new'; }
    drag = { id: e.pointerId, mode: mode, moved: false, x: p[0], y: p[1] };
    try { tray.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (mode !== 'last') Sound.select(S.path.length);
    drawPath();
    setPreview();
  }

  function stepTo(x, y) {
    var cell = hitCell(x, y, true);
    var path = S.path;
    if (cell < 0 || !path.length) return;
    var last = path[path.length - 1];
    if (cell === last) return;
    if (path.length >= 2 && cell === path[path.length - 2]) {
      path.pop();
      drag.moved = true;
      Sound.select(path.length);
      return true;
    }
    if (path.indexOf(cell) < 0 && L.isAdjacent(S.size, last, cell)) {
      path.push(cell);
      drag.moved = true;
      Sound.select(path.length);
      return true;
    }
    return false;
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    e.preventDefault();
    var p = trayPoint(e);
    // Walk the segment since the last event so a fast swipe can't skip a cube.
    var dx = p[0] - drag.x, dy = p[1] - drag.y;
    var dist = Math.hypot(dx, dy);
    var steps = Math.max(1, Math.ceil(dist / (S.pitch * 0.15)));
    var changed = false;
    for (var i = 1; i <= steps; i++) {
      if (stepTo(drag.x + dx * i / steps, drag.y + dy * i / steps)) changed = true;
    }
    drag.x = p[0];
    drag.y = p[1];
    if (changed) { drawPath(); setPreview(); }
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (e.type === 'pointercancel') return;
    if (d.moved) {
      if (S.path.length >= 2) submit();
      return;
    }
    if (d.mode === 'last') {
      if (S.path.length >= 2) submit();
      else { S.path = []; drawPath(); setPreview(); }
    }
  }

  /* ---------- keyboard ---------- */

  function setTyped(t) {
    S.typed = t;
    if (!t) { S.path = []; S.typedMiss = false; }
    else {
      var p = L.findPath(S.board, t, true);
      S.path = p || [];
      S.typedMiss = !p;
    }
    drawPath();
    setPreview();
  }

  function onKeyDown(e) {
    var modal = $('modal-stats');
    if (!modal.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeStats(); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var screen = app.getAttribute('data-screen');
    if (screen === 'title') {
      if (e.key === 'Enter' && (document.activeElement === document.body || !document.activeElement)) { e.preventDefault(); startGame(); }
      return;
    }
    if (S.phase === 'paused') {
      if (e.key === 'Escape' || e.key === ' ') { e.preventDefault(); resume(); }
      return;
    }
    if (S.phase === 'over') {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); rotate(); }
      return;
    }
    if (S.phase !== 'playing') return;
    var k = e.key;
    if (/^[a-zA-Z]$/.test(k)) {
      e.preventDefault();
      if (drag) return;
      if (S.typed.length >= 25) return;
      var next = S.typed + k.toLowerCase();
      setTyped(next);
      if (!S.typedMiss) Sound.select(S.path.length);
    } else if (k === 'Backspace') {
      e.preventDefault();
      if (S.typed) setTyped(S.typed.slice(0, -1));
      else if (S.path.length) { S.path.pop(); drawPath(); setPreview(); }
    } else if (k === 'Enter') {
      e.preventDefault();
      if (document.activeElement && document.activeElement.tagName === 'BUTTON' && document.activeElement !== submitBtn && !S.typed && !S.path.length) return;
      submit();
    } else if (k === 'Escape') {
      e.preventDefault();
      if (S.typed || S.path.length) setTyped('');
      else pause();
    } else if (k === 'ArrowRight' || k === 'ArrowLeft') {
      e.preventDefault();
      rotate();
    }
  }

  /* ---------- timer + CPU ---------- */

  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function frame(now) {
    if (S.phase !== 'playing') { S.lastFrame = 0; return; }
    if (S.lastFrame) S.elapsed += Math.min(250, now - S.lastFrame);
    S.lastFrame = now;
    updateTimer();
    updateBot();
    if (S.timed && S.elapsed >= S.seconds * 1000) { finishRound(true); return; }
    requestAnimationFrame(frame);
  }

  function updateTimer() {
    timerEl.classList.remove('done');
    if (!S.timed) {
      timerEl.classList.add('relaxed');
      timerEl.classList.remove('low');
      timerEl.textContent = fmtTime(S.elapsed / 1000 - 0.999);
      return;
    }
    timerEl.classList.remove('relaxed');
    var left = S.seconds - S.elapsed / 1000;
    timerEl.textContent = fmtTime(left);
    var low = left <= 10.5 && S.phase === 'playing';
    timerEl.classList.toggle('low', low);
    var whole = Math.ceil(left);
    if (low && whole !== S.lastTickSec && whole > 0) {
      S.lastTickSec = whole;
      Sound.tick(whole <= 3);
    }
  }

  function updateBot() {
    if (!S.bot.length) return;
    var sec = S.elapsed / 1000;
    var n = S.botShown;
    while (n < S.bot.length && S.bot[n].t <= sec) n++;
    if (n !== S.botShown) {
      S.botShown = n;
      var el = $('cpu-words');
      el.textContent = n;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  /* ---------- pause ---------- */

  function pause() {
    if (S.phase !== 'playing') return;
    S.phase = 'paused';
    drag = null;
    $('pause-cover').hidden = false;
    $('end-btn-2').textContent = 'End round';
    setTimeout(function () { $('resume-btn').focus(); }, 0);
  }
  function resume() {
    if (S.phase !== 'paused') return;
    S.phase = 'playing';
    $('pause-cover').hidden = true;
    S.lastFrame = 0;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    requestAnimationFrame(frame);
  }

  var endConfirmTimer = 0;
  function onEndClick() {
    if (S.phase !== 'playing') return;
    if (!endBtn.classList.contains('confirm')) {
      endBtn.classList.add('confirm');
      endBtn.querySelector('span').textContent = 'Sure?';
      clearTimeout(endConfirmTimer);
      endConfirmTimer = setTimeout(function () {
        endBtn.classList.remove('confirm');
        endBtn.querySelector('span').textContent = 'End';
      }, 2500);
      return;
    }
    clearTimeout(endConfirmTimer);
    finishRound(false);
  }

  /* ---------- end of round ---------- */

  function finishRound(timeUp) {
    if (S.phase !== 'playing' && S.phase !== 'paused') return;
    S.phase = 'over';
    drag = null;
    S.path = [];
    S.typed = '';
    $('pause-cover').hidden = true;
    drawPath();
    clearTimeout(previewTimer);
    renderWord('', '');
    previewEl.classList.remove('has-word');

    var sec = S.elapsed / 1000;
    var cpuWords = [];
    for (var i = 0; i < S.bot.length; i++) if (timeUp || S.bot[i].t <= sec) cpuWords.push(S.bot[i].word);
    S.botShown = cpuWords.length;
    var vs = S.opponent !== 'solo';
    var c = L.cancelWords(S.found, cpuWords);
    var myScore = vs ? c.myScore : L.scoreList(S.found);
    var outcome = null;
    if (vs) outcome = c.myScore > c.theirScore ? 'win' : c.myScore < c.theirScore ? 'loss' : 'tie';

    var rec = L.recordGame(getStats(S.size), myScore, S.found, outcome);
    putStats(S.size, rec.stats);
    var firstDaily = false;
    if (S.daily) {
      var all = dailyRecords();
      var k = S.dayKey + ':' + S.size;
      if (!all[k]) {
        all[k] = { score: myScore, words: S.found.length, total: S.solution.length };
        firstDaily = true;
        // Keep the last few weeks only.
        var keys = Object.keys(all).sort();
        while (keys.length > 60) delete all[keys.shift()];
        save('daily', all);
      }
    }

    S.result = {
      vs: vs, timeUp: timeUp, outcome: outcome, cancel: c, cpuWords: cpuWords,
      myScore: myScore, cpuScore: vs ? c.theirScore : 0,
      isBest: rec.isBest, best: rec.stats.best, firstDaily: firstDaily
    };
    S.resultTab = 'all';
    S.activeChip = null;

    timerEl.classList.remove('low', 'relaxed');
    timerEl.classList.add('done');
    timerEl.textContent = timeUp ? 'Time!' : fmtTime(S.timed ? S.seconds - sec : sec - 0.999);
    if (vs) $('cpu-words').textContent = cpuWords.length;
    else { $('cpu-words').textContent = rec.stats.best; $('cpu-sub').textContent = rec.isBest ? 'new best!' : L.MODES[S.size].name; }
    updateHud();
    app.classList.add('over');
    renderResults();
    layout();
    if (outcome === 'win' || (!vs && rec.isBest)) Sound.win(); else Sound.end();
  }

  function renderResults() {
    var R = S.result;
    var c = R.cancel;
    var total = S.solution.length;
    var maxPts = L.scoreList(S.solution.map(function (s) { return s.word; }));
    var pct = total ? Math.round(S.found.length / total * 100) : 0;
    var longest = S.solution.length ? S.solution[0].word : '';
    var h = '<div class="rb-row">';
    var title;
    if (R.vs) title = R.outcome === 'win' ? 'You win!' : R.outcome === 'loss' ? 'CPU wins' : 'It’s a tie';
    else title = R.timeUp ? 'Time’s up!' : 'Round over';
    h += scoreCard('You', R.myScore, S.found.length, '');
    h += '<div class="rb-mid"><h2 class="' + (R.outcome || '') + '">' + title + '</h2>' + (R.isBest ? '<span class="badge-best">NEW BEST</span>' : '') + '</div>';
    if (R.vs) h += scoreCard('CPU', R.cpuScore, R.cpuWords.length, 'cpu');
    else h += '<div class="score-card pct"><div class="l">Found</div><div class="n">' + pct + '%</div><div class="s">of ' + total + '</div></div>';
    h += '</div>';
    h += '<div class="sub">You found <b>' + S.found.length + '</b> of <b>' + total + '</b> words (' + pct + '%) &middot; ' + maxPts + ' pts possible';
    if (R.vs && c.shared.length) h += ' &middot; ' + c.shared.length + ' cancelled';
    h += '</div>';
    $('result-banner').innerHTML = h;

    var tabs = [['all', 'All ' + total], ['mine', 'Yours ' + S.found.length]];
    if (R.vs) { tabs.push(['cpu', 'CPU ' + R.cpuWords.length]); tabs.push(['cancel', 'Cancelled ' + c.shared.length]); }
    var th = '';
    for (var i = 0; i < tabs.length; i++) {
      th += '<button type="button" role="tab" data-tab="' + tabs[i][0] + '" aria-selected="' + (S.resultTab === tabs[i][0]) + '">' + tabs[i][1] + '</button>';
    }
    $('result-tabs').innerHTML = th;
    renderResultList();
    setOverPreview(longest ? 'Longest: ' + longest.toUpperCase() : '');
  }

  function scoreCard(label, pts, words, cls) {
    return '<div class="score-card ' + cls + '"><div class="l">' + label + '</div><div class="n">' + pts +
      '</div><div class="s">' + words + (words === 1 ? ' word' : ' words') + '</div></div>';
  }

  function setOverPreview(text) {
    renderWord('', '');
    hintEl.textContent = text;
    previewEl.classList.remove('has-word');
  }

  function chipHTML(word, cls, pts) {
    return '<button type="button" class="chip ' + cls + '" data-word="' + word + '">' + esc(word) + ' <i>' + pts + '</i></button>';
  }

  function renderResultList() {
    var R = S.result;
    var c = R.cancel;
    var mine = new Set(S.found);
    var theirs = new Set(R.cpuWords);
    var shared = new Set(c.shared);
    // Star the longest word(s), unless so many tie that stars mean nothing.
    var longestLen = S.solution.length ? S.solution[0].word.length : 0;
    var ties = 0;
    while (ties < S.solution.length && S.solution[ties].word.length === longestLen) ties++;
    if (ties > 3) longestLen = -1;
    var html = '';
    var tab = S.resultTab;
    var sorted = function (arr) { return arr.slice().sort(L.compareWords); };
    var i, w;

    if (tab === 'all') {
      html += '<div class="legend"><span class="lg-mine">You</span>' + (R.vs ? '<span class="lg-cpu">CPU</span>' : '') + '<span class="lg-long">Longest</span><span>Missed</span></div>';
      var groups = {};
      var order = [];
      for (i = 0; i < S.solution.length; i++) {
        w = S.solution[i].word;
        var key = Math.min(w.length, 8);
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(w);
      }
      for (var g = 0; g < order.length; g++) {
        var len = order[g];
        var list = groups[len];
        var got = 0;
        for (i = 0; i < list.length; i++) if (mine.has(list[i])) got++;
        var pts = L.scoreWord(new Array(len + 1).join('a'));
        html += '<h3>' + (len >= 8 ? '8+ letters' : len + ' letters') + ' &middot; ' + pts + (pts === 1 ? ' pt' : ' pts') + ' &middot; ' + got + '/' + list.length + '</h3><div class="chips">';
        for (i = 0; i < list.length; i++) {
          w = list[i];
          var cls = shared.has(w) ? 'both cancel' : mine.has(w) ? 'mine' : theirs.has(w) ? 'theirs' : 'missed';
          if (w.length === longestLen) cls += ' longest';
          html += chipHTML(w, cls, L.scoreWord(w));
        }
        html += '</div>';
      }
      if (!S.solution.length) html += '<p class="empty">No words on this board.</p>';
    } else if (tab === 'mine') {
      var ms = sorted(S.found);
      if (!ms.length) html += '<p class="empty">You didn’t find any words this time.</p>';
      else {
        html += '<h3>' + ms.length + ' words &middot; ' + R.myScore + ' pts</h3><div class="chips">';
        for (i = 0; i < ms.length; i++) {
          w = ms[i];
          var x = shared.has(w);
          html += chipHTML(w, x ? 'cancel' : 'mine' + (w.length === longestLen ? ' longest' : ''), x ? 0 : L.scoreWord(w));
        }
        html += '</div>';
      }
    } else if (tab === 'cpu') {
      var cs = sorted(R.cpuWords);
      if (!cs.length) html += '<p class="empty">The CPU didn’t find any words.</p>';
      else {
        html += '<h3>' + cs.length + ' words &middot; ' + R.cpuScore + ' pts</h3><div class="chips">';
        for (i = 0; i < cs.length; i++) {
          w = cs[i];
          var y = shared.has(w);
          html += chipHTML(w, y ? 'cancel' : 'theirs', y ? 0 : L.scoreWord(w));
        }
        html += '</div>';
      }
    } else if (tab === 'cancel') {
      var sh = sorted(c.shared);
      if (!sh.length) html += '<p class="empty">No words in common, nothing cancelled.</p>';
      else {
        html += '<h3>Found by both, scored by neither</h3><div class="chips">';
        for (i = 0; i < sh.length; i++) html += chipHTML(sh[i], 'both cancel', 0);
        html += '</div>';
      }
    }
    var listEl = $('result-list');
    listEl.innerHTML = html;
    listEl.scrollTop = 0;
    if (S.activeChip) {
      var act = listEl.querySelector('[data-word="' + S.activeChip + '"]');
      if (act) act.classList.add('active');
    }
  }

  function onResultTab(e) {
    var b = e.target.closest('button[data-tab]');
    if (!b) return;
    S.resultTab = b.getAttribute('data-tab');
    var all = $('result-tabs').querySelectorAll('button');
    for (var i = 0; i < all.length; i++) all[i].setAttribute('aria-selected', all[i] === b ? 'true' : 'false');
    renderResultList();
  }

  function onResultChip(e) {
    var b = e.target.closest('.chip[data-word]');
    if (!b) return;
    var w = b.getAttribute('data-word');
    var prev = $('result-list').querySelector('.chip.active');
    if (prev) prev.classList.remove('active');
    if (S.activeChip === w) {
      S.activeChip = null;
      clearGhost();
      setOverPreview(S.solution.length ? 'Longest: ' + S.solution[0].word.toUpperCase() : '');
      return;
    }
    b.classList.add('active');
    highlightWord(w, false);
    Sound.select(3);
  }

  function highlightWord(w, quiet) {
    var path = (S.solMap && S.solMap.get(w)) || L.findPath(S.board, w, false);
    S.activeChip = w;
    clearGhost();
    if (!path) return;
    var mine = S.foundSet.has(w);
    var cpu = S.result && S.result.cpuWords.indexOf(w) >= 0 && !mine;
    var cls = mine ? 'good' : cpu ? 'cpu' : '';
    drawInto(ghostG, path, cls, !quiet);
    for (var i = 0; i < path.length; i++) S.tiles[path[i]].classList.add(cpu ? 'hl-cpu' : 'hl');
    if (!quiet) {
      renderWord(w, '');
      var p = document.createElement('span');
      p.className = 'pts';
      var n = L.scoreWord(w);
      p.textContent = n + (n === 1 ? ' pt' : ' pts');
      wordEl.appendChild(p);
      previewEl.classList.add('has-word');
    }
  }

  /* ---------- stats modal ---------- */

  var statsSize = 4;
  var lastFocus = null;
  function openStats() {
    lastFocus = document.activeElement;
    statsSize = app.getAttribute('data-screen') === 'game' ? S.size : settings.size;
    renderStats();
    $('modal-stats').hidden = false;
    if (S.phase === 'playing') pause();
    setTimeout(function () { $('modal-stats').querySelector('.modal-card').focus(); }, 0);
  }
  function closeStats() {
    $('modal-stats').hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function renderStats() {
    var tabs = $('stats-tabs').querySelectorAll('button');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-checked', tabs[i].getAttribute('data-val') === String(statsSize) ? 'true' : 'false');
    var st = getStats(statsSize);
    var avg = st.played ? Math.round(st.totalScore / st.played * 10) / 10 : 0;
    var vsGames = st.wins + st.losses + st.ties;
    var cells = [
      [st.played, 'Played'], [st.best, 'Best score'], [avg, 'Average'],
      [st.totalWords, 'Words found'], [st.longest ? st.longest.toUpperCase() : '–', 'Longest word', 'word'],
      [vsGames ? st.wins + '-' + st.losses + (st.ties ? '-' + st.ties : '') : '–', 'vs CPU W-L']
    ];
    var h = '';
    for (var j = 0; j < cells.length; j++) {
      h += '<div class="stat"><div class="n' + (cells[j][2] ? ' ' + cells[j][2] : '') + '">' + esc(cells[j][0]) + '</div><div class="l">' + cells[j][1] + '</div></div>';
    }
    $('stat-grid').innerHTML = h;
    var today = L.dateKey(new Date());
    var rec = dailyRecords()[today + ':' + statsSize];
    $('stat-extra').innerHTML = rec
      ? 'Today’s daily: <b>' + rec.score + ' pts</b>, ' + rec.words + ' of ' + rec.total + ' words.'
      : 'You haven’t played today’s daily ' + (statsSize === 5 ? 'Big Boggle' : 'Classic') + ' board yet.';
  }

  /* ---------- sound toggle ---------- */

  function syncSound() {
    Sound.setMuted(settings.muted);
    var btns = document.querySelectorAll('.btn-sound');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('aria-pressed', settings.muted ? 'false' : 'true');
  }

  /* ---------- wiring ---------- */

  document.querySelector('.setup').addEventListener('click', onSetupClick);
  document.querySelector('.setup').addEventListener('keydown', onSetupKey);
  playBtn.addEventListener('click', startGame);
  tray.addEventListener('pointerdown', onPointerDown);
  tray.addEventListener('pointermove', onPointerMove);
  tray.addEventListener('pointerup', onPointerUp);
  tray.addEventListener('pointercancel', onPointerUp);
  tray.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('keydown', onKeyDown);
  submitBtn.addEventListener('click', submit);
  $('clear-btn').addEventListener('click', function () { setTyped(''); });
  $('rotate-btn').addEventListener('click', rotate);
  endBtn.addEventListener('click', onEndClick);
  $('menu-btn').addEventListener('click', function () {
    if (S.phase === 'playing') pause();
    else if (S.phase === 'paused') resume();
    else showScreen('title');
  });
  $('resume-btn').addEventListener('click', resume);
  $('end-btn-2').addEventListener('click', function () { finishRound(false); });
  $('quit-btn').addEventListener('click', function () { S.phase = 'title'; showScreen('title'); });
  $('again-btn').addEventListener('click', function () {
    if (S.daily) { settings.daily = false; saveSettings(); }
    startGame();
  });
  $('menu-btn-2').addEventListener('click', function () { S.phase = 'title'; showScreen('title'); });
  $('result-tabs').addEventListener('click', onResultTab);
  $('result-list').addEventListener('click', onResultChip);

  var soundBtns = document.querySelectorAll('.btn-sound');
  for (var sb = 0; sb < soundBtns.length; sb++) {
    soundBtns[sb].addEventListener('click', function () {
      settings.muted = !settings.muted;
      saveSettings();
      syncSound();
      if (!settings.muted) { Sound.unlock(); Sound.select(3); }
    });
  }
  var statBtns = document.querySelectorAll('.btn-stats');
  for (var st = 0; st < statBtns.length; st++) statBtns[st].addEventListener('click', openStats);
  $('modal-stats').addEventListener('click', function (e) {
    if (e.target === e.currentTarget || e.target.closest('.modal-close')) closeStats();
    var b = e.target.closest('#stats-tabs button');
    if (b) { statsSize = Number(b.getAttribute('data-val')); renderStats(); }
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && S.phase === 'playing') pause();
  });

  var resizeRaf = 0;
  window.addEventListener('resize', function () {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layout);
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', function () {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(layout);
  });

  syncSound();
  syncSetup();
  loadDictionary();

  // For the smoke test and the curious: read-only peek at the round.
  window.BoggleGame = {
    state: function () {
      return { phase: S.phase, board: S.board.slice(), size: S.size, rot: S.rot, found: S.found.slice(), score: S.score, words: S.solution.length, solveMs: S.solveMs, centers: S.centers.slice() };
    },
    pathOf: function (w) { return S.solMap ? S.solMap.get(w) || null : null; },
    solution: function () { return S.solution.map(function (s) { return s.word; }); },
    ready: function () { return dictState === 'ready'; }
  };
})();
