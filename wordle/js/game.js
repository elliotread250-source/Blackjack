/*
 * Wordle UI: board, keyboard, modals, persistence. Rules and scoring live in
 * logic.js; sounds in audio.js; word lists in words.js.
 */
(function () {
  'use strict';

  var L = window.WordleLogic;
  var Sound = window.WordleSound;
  var ANSWERS = window.WordleWords.answers;
  var VALID = new Set(ANSWERS.concat(window.WordleWords.guesses));
  var ROWS = L.MAX_GUESSES;
  var COLS = L.WORD_LEN;

  var FLIP_STAGGER = 300;   // ms between tiles in a reveal
  var FLIP_HALF = 250;      // ms for each half of a tile flip

  var doc = document;
  var root = doc.documentElement;
  var $ = function (id) { return doc.getElementById(id); };

  // ---------------------------------------------------------------- storage

  var PREFIX = 'oa-wordle:';
  function load(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      if (raw == null) return fallback;
      var v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function store(key, value) {
    try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* storage blocked or full */ }
  }

  var saved = load('settings', {});
  if (!saved || typeof saved !== 'object') saved = {};
  var settings = {
    hard: saved.hard === true,
    theme: saved.theme === 'dark' || saved.theme === 'light' ? saved.theme : null,
    contrast: saved.contrast === true,
    muted: saved.muted === true,
    mode: saved.mode === 'unlimited' ? 'unlimited' : 'daily'
  };
  function saveSettings() { store('settings', settings); }

  var stats = {
    daily: L.sanitizeStats(load('stats-daily', null)),
    unlimited: L.sanitizeStats(load('stats-unlimited', null))
  };
  function saveStats(mode) { store('stats-' + mode, stats[mode]); }

  var recent = load('recent', []);
  if (!Array.isArray(recent)) recent = [];
  recent = recent.filter(function (w) { return typeof w === 'string'; }).slice(-300);

  // ------------------------------------------------------------------ games

  function isWord(w) { return typeof w === 'string' && /^[a-z]{5}$/.test(w); }

  function makeGame(mode, answer, day) {
    return {
      mode: mode,
      answer: answer,
      day: mode === 'daily' ? day : null,
      guesses: [],
      marks: [],
      current: '',
      status: 'playing',
      hard: false,
      recorded: false,
      gaveUp: false
    };
  }

  function newDaily() {
    var day = L.dayIndex(new Date());
    return makeGame('daily', L.dailyAnswerForDay(day, ANSWERS), day);
  }

  function newUnlimited() {
    var answer = L.randomAnswer(ANSWERS, recent.slice(-200));
    recent.push(answer);
    if (recent.length > 300) recent = recent.slice(-300);
    store('recent', recent);
    return makeGame('unlimited', answer, null);
  }

  // Rebuild a saved game, recomputing colours and status from the guesses
  // rather than trusting whatever was stored.
  function restore(raw, mode) {
    if (!raw || typeof raw !== 'object' || !isWord(raw.answer) || !Array.isArray(raw.guesses)) return null;
    var g = makeGame(mode, raw.answer, raw.day);
    for (var i = 0; i < raw.guesses.length && i < ROWS; i++) {
      var w = raw.guesses[i];
      if (!isWord(w)) return null;
      g.guesses.push(w);
      g.marks.push(L.scoreGuess(w, g.answer));
      if (w === g.answer) { g.status = 'won'; break; }
    }
    if (g.status === 'playing' && g.guesses.length >= ROWS) g.status = 'lost';
    if (g.status === 'playing' && raw.gaveUp === true) { g.status = 'lost'; g.gaveUp = true; }
    if (g.status === 'playing' && typeof raw.current === 'string' && /^[a-z]{0,5}$/.test(raw.current)) g.current = raw.current;
    g.hard = raw.hard === true;
    g.recorded = raw.recorded === true;
    return g;
  }

  function saveGame(g) {
    store('game-' + g.mode, {
      answer: g.answer,
      day: g.day,
      guesses: g.guesses,
      current: g.current,
      hard: g.hard,
      recorded: g.recorded,
      gaveUp: g.gaveUp
    });
  }

  var currentDay = L.dayIndex(new Date());
  var games = { daily: null, unlimited: null };

  (function loadGames() {
    var d = restore(load('game-daily', null), 'daily');
    var todays = L.dailyAnswerForDay(currentDay, ANSWERS);
    games.daily = d && d.day === currentDay && d.answer === todays ? d : newDaily();
    var u = restore(load('game-unlimited', null), 'unlimited');
    games.unlimited = u || null;   // created lazily, so a daily-only player doesn't burn words
  })();

  function ensureGame(mode) {
    if (!games[mode]) {
      games[mode] = mode === 'daily' ? newDaily() : newUnlimited();
      saveGame(games[mode]);
    }
    return games[mode];
  }

  var game = ensureGame(settings.mode);

  // -------------------------------------------------------------------- DOM

  var app = $('app');
  var boardWrap = $('board-wrap');
  var boardEl = $('board');
  var keyboardEl = $('keyboard');
  var toaster = $('toaster');
  var rowEls = [];
  var tileEls = [];
  var keyEls = {};

  // The toaster floats above modals too (so "Copied" shows over the stats).
  doc.body.appendChild(toaster);

  (function buildBoard() {
    for (var r = 0; r < ROWS; r++) {
      var row = doc.createElement('div');
      row.className = 'row';
      var tiles = [];
      for (var c = 0; c < COLS; c++) {
        var t = doc.createElement('div');
        t.className = 'tile';
        t.setAttribute('aria-hidden', 'true');
        row.appendChild(t);
        tiles.push(t);
      }
      boardEl.appendChild(row);
      rowEls.push(row);
      tileEls.push(tiles);
    }
  })();

  var BACKSPACE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"/></svg>';

  (function buildKeyboard() {
    var layout = [
      'qwertyuiop'.split(''),
      ['_'].concat('asdfghjkl'.split(''), ['_']),
      ['enter'].concat('zxcvbnm'.split(''), ['back'])
    ];
    layout.forEach(function (keys) {
      var row = doc.createElement('div');
      row.className = 'kb-row';
      keys.forEach(function (k) {
        if (k === '_') {
          var sp = doc.createElement('div');
          sp.className = 'key spacer';
          row.appendChild(sp);
          return;
        }
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'key';
        b.tabIndex = -1;
        b.setAttribute('data-key', k);
        if (k === 'enter') {
          b.className += ' wide';
          b.textContent = 'Enter';
          b.setAttribute('aria-label', 'Enter');
        } else if (k === 'back') {
          b.className += ' wide';
          b.innerHTML = BACKSPACE_SVG;
          b.setAttribute('aria-label', 'Backspace');
        } else {
          b.textContent = k;
          b.setAttribute('aria-label', k.toUpperCase());
        }
        keyEls[k] = b;
        row.appendChild(b);
      });
      keyboardEl.appendChild(row);
    });
  })();

  // ------------------------------------------------------------- rendering

  var gen = 0;          // bumps on every full re-render; stale timers check it
  var busy = false;     // a row is being revealed
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }

  function stopAnimations(el) {
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
  }

  function setTile(tile, letter, state) {
    tile.textContent = letter || '';
    if (letter && !state) tile.setAttribute('data-filled', '');
    else tile.removeAttribute('data-filled');
    if (state) tile.setAttribute('data-state', state);
    else tile.removeAttribute('data-state');
  }

  function rowLabel(word, marks) {
    var names = { correct: 'correct', present: 'in the word', absent: 'not in the word' };
    return word.toUpperCase() + ': ' + word.split('').map(function (ch, i) {
      return ch.toUpperCase() + ' ' + names[marks[i]];
    }).join(', ');
  }

  function renderBoard() {
    for (var r = 0; r < ROWS; r++) {
      stopAnimations(rowEls[r]);
      var word = r < game.guesses.length ? game.guesses[r] : (r === game.guesses.length && game.status === 'playing' ? game.current : '');
      var marks = r < game.guesses.length ? game.marks[r] : null;
      for (var c = 0; c < COLS; c++) {
        stopAnimations(tileEls[r][c]);
        setTile(tileEls[r][c], word[c], marks ? marks[c] : null);
      }
      if (marks) rowEls[r].setAttribute('aria-label', rowLabel(word, marks));
      else rowEls[r].removeAttribute('aria-label');
    }
  }

  function renderKeyboard(upto) {
    var hist = [];
    var n = upto == null ? game.guesses.length : upto;
    for (var i = 0; i < n; i++) hist.push({ word: game.guesses[i], marks: game.marks[i] });
    var st = L.letterStates(hist);
    Object.keys(keyEls).forEach(function (k) {
      if (k.length !== 1) return;
      if (st[k]) {
        keyEls[k].setAttribute('data-state', st[k]);
        keyEls[k].setAttribute('aria-label', k.toUpperCase() + ' ' + (st[k] === 'absent' ? 'not in word' : st[k]));
      } else {
        keyEls[k].removeAttribute('data-state');
        keyEls[k].setAttribute('aria-label', k.toUpperCase());
      }
    });
  }

  function renderChrome() {
    var modes = $('modes').querySelectorAll('button');
    for (var i = 0; i < modes.length; i++) {
      modes[i].setAttribute('aria-checked', String(modes[i].getAttribute('data-mode') === game.mode));
    }
    $('puzzle-no').textContent = '#' + L.puzzleNumber(games.daily.day);
    var hardOn = game.hard || (settings.hard && game.guesses.length === 0 && game.status === 'playing');
    $('hard-badge').hidden = !hardOn;
    var nb = $('btn-new');
    nb.hidden = game.mode !== 'unlimited';
    nb.classList.remove('armed');
    nb.classList.toggle('ready', game.status !== 'playing');
    nb.querySelector('span').textContent = 'New';
    giveUpArmed = 0;
  }

  function renderAll() {
    gen++;
    busy = false;
    renderBoard();
    renderKeyboard();
    renderChrome();
  }

  // ----------------------------------------------------------------- toasts

  function toast(text, ms, cls) {
    var el = doc.createElement('div');
    el.className = 'toast' + (cls ? ' ' + cls : '');
    el.textContent = text;
    toaster.insertBefore(el, toaster.firstChild);
    if (ms !== Infinity) {
      setTimeout(function () {
        el.classList.add('fade');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
      }, ms || 1000);
    }
    while (toaster.children.length > 3) toaster.removeChild(toaster.lastChild);
    return el;
  }

  function clearToasts() {
    while (toaster.firstChild) toaster.removeChild(toaster.firstChild);
  }

  // ------------------------------------------------------------- animation

  function animate(el, frames, opts) {
    if (reduceMotion || !el.animate) return null;
    try { return el.animate(frames, opts); } catch (e) { return null; }
  }

  function pop(tile) {
    animate(tile, [
      { transform: 'scale(0.8)', opacity: 0.6 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1)' }
    ], { duration: 100, easing: 'ease-out' });
  }

  function shake(row) {
    animate(row, [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-1px)', offset: 0.1 },
      { transform: 'translateX(2px)', offset: 0.2 },
      { transform: 'translateX(-4px)', offset: 0.3 },
      { transform: 'translateX(4px)', offset: 0.4 },
      { transform: 'translateX(-4px)', offset: 0.5 },
      { transform: 'translateX(4px)', offset: 0.6 },
      { transform: 'translateX(-4px)', offset: 0.7 },
      { transform: 'translateX(2px)', offset: 0.8 },
      { transform: 'translateX(-1px)', offset: 0.9 },
      { transform: 'translateX(0)' }
    ], { duration: 600 });
  }

  function bounce(row) {
    var tiles = row.children;
    for (var i = 0; i < tiles.length; i++) {
      animate(tiles[i], [
        { transform: 'translateY(0)', offset: 0 },
        { transform: 'translateY(0)', offset: 0.2 },
        { transform: 'translateY(-30px)', offset: 0.4 },
        { transform: 'translateY(5px)', offset: 0.5 },
        { transform: 'translateY(-15px)', offset: 0.6 },
        { transform: 'translateY(2px)', offset: 0.8 },
        { transform: 'translateY(0)', offset: 1 }
      ], { duration: 1000, delay: i * 100, easing: 'ease-out' });
    }
  }

  // Flip each tile of a row in turn, colouring it at the half-way point.
  function reveal(r, word, marks, done) {
    var my = gen;
    var stagger = reduceMotion ? 80 : FLIP_STAGGER;
    var finished = 0;
    function tileDone() {
      if (++finished === COLS && my === gen) done();
    }
    marks.forEach(function (m, i) {
      var tile = tileEls[r][i];
      setTimeout(function () {
        if (my !== gen) return;
        var a1 = animate(tile, [{ transform: 'rotateX(0deg)' }, { transform: 'rotateX(-90deg)' }],
          { duration: FLIP_HALF, easing: 'ease-in', fill: 'forwards' });
        function half() {
          if (my !== gen) return;
          setTile(tile, word[i], m);
          Sound.flip(m, i);
          var a2 = animate(tile, [{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0deg)' }],
            { duration: FLIP_HALF, easing: 'ease-out' });
          if (a1) a1.cancel();
          if (a2) a2.onfinish = tileDone;
          else setTimeout(tileDone, reduceMotion ? 0 : FLIP_HALF);
        }
        if (a1) a1.onfinish = half;
        else setTimeout(half, reduceMotion ? 0 : FLIP_HALF);
      }, i * stagger);
    });
    rowEls[r].setAttribute('aria-label', rowLabel(word, marks));
  }

  // ------------------------------------------------------------------ input

  function addLetter(ch) {
    if (busy || game.status !== 'playing' || game.current.length >= COLS) return;
    var r = game.guesses.length;
    var c = game.current.length;
    game.current += ch;
    setTile(tileEls[r][c], ch, null);
    pop(tileEls[r][c]);
    Sound.key();
    saveGame(game);
  }

  function removeLetter() {
    if (busy || game.status !== 'playing' || !game.current.length) return;
    var r = game.guesses.length;
    game.current = game.current.slice(0, -1);
    setTile(tileEls[r][game.current.length], '', null);
    Sound.back();
    saveGame(game);
  }

  function reject(msg) {
    shake(rowEls[game.guesses.length]);
    toast(msg, 1000);
    Sound.invalid();
  }

  function submit() {
    if (busy) return;
    if (game.status !== 'playing') {
      if (game.mode === 'unlimited') startUnlimited();
      return;
    }
    var word = game.current;
    if (word.length < COLS) return reject('Not enough letters');
    if (!VALID.has(word)) return reject('Not in word list');
    var history = game.guesses.map(function (w, i) { return { word: w, marks: game.marks[i] }; });
    if (game.guesses.length === 0) game.hard = settings.hard;
    if (game.hard) {
      var err = L.hardModeError(word, history);
      if (err) return reject(err);
    }

    var marks = L.scoreGuess(word, game.answer);
    var r = game.guesses.length;
    game.guesses.push(word);
    game.marks.push(marks);
    game.current = '';
    if (L.isWin(marks)) game.status = 'won';
    else if (game.guesses.length >= ROWS) game.status = 'lost';
    if (game.status !== 'playing') recordGame(game);
    saveGame(game);

    busy = true;
    var g = game;
    reveal(r, word, marks, function () {
      busy = false;
      renderKeyboard();
      renderChrome();
      if (g.status === 'won') celebrate(r);
      else if (g.status === 'lost') mourn();
    });
  }

  function recordGame(g) {
    if (g.recorded) return;
    var result = { won: g.status === 'won', guesses: g.guesses.length };
    if (g.mode === 'daily') result.day = g.day;
    L.recordResult(stats[g.mode], result);
    g.recorded = true;
    saveStats(g.mode);
  }

  var endTimer = 0;

  function celebrate(r) {
    var my = gen;
    toast(L.winMessage(game.guesses.length), 2000);
    bounce(rowEls[r]);
    Sound.win(game.guesses.length);
    clearTimeout(endTimer);
    endTimer = setTimeout(function () { if (my === gen && !openModal) showModal('stats'); }, reduceMotion ? 1200 : 2300);
  }

  function mourn() {
    var my = gen;
    toast(game.answer, Infinity, 'answer');
    Sound.lose();
    clearTimeout(endTimer);
    endTimer = setTimeout(function () { if (my === gen && !openModal) showModal('stats'); }, 2200);
  }

  function handleKey(k) {
    Sound.unlock();
    if (k === 'enter') submit();
    else if (k === 'back') removeLetter();
    else if (/^[a-z]$/.test(k)) addLetter(k);
  }

  keyboardEl.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep focus off the keys
  keyboardEl.addEventListener('touchstart', function () {}, { passive: true });      // lets :active work on iOS
  keyboardEl.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.key') : null;
    if (!b || !b.getAttribute('data-key')) return;
    handleKey(b.getAttribute('data-key'));
  });

  doc.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (openModal) {
      if (e.key === 'Escape') { e.preventDefault(); hideModal(); }
      return;
    }
    var key = e.key;
    if (key === 'Enter') {
      // A keyboard user on a focused button gets the button.
      var a = doc.activeElement;
      if (a && a !== doc.body && (a.tagName === 'BUTTON' || a.tagName === 'A')) return;
      e.preventDefault();
      handleKey('enter');
    } else if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault();
      handleKey('back');
    } else if (/^[a-zA-Z]$/.test(key)) {
      e.preventDefault();
      flashKey(key.toLowerCase());
      handleKey(key.toLowerCase());
    }
  });

  function flashKey(k) {
    var b = keyEls[k];
    if (!b) return;
    b.classList.add('pressed');
    setTimeout(function () { b.classList.remove('pressed'); }, 90);
  }

  // Mouse/touch clicks shouldn't leave buttons focused (Enter would re-press them).
  doc.addEventListener('click', function (e) {
    if (e.detail === 0) return;
    var b = e.target.closest ? e.target.closest('button, a') : null;
    if (b && b.blur) b.blur();
  });

  // No rubber-banding or pull-to-refresh, except inside a scrolling modal.
  doc.addEventListener('touchmove', function (e) {
    if (!(e.target.closest && e.target.closest('.modal-body'))) e.preventDefault();
  }, { passive: false });

  // ------------------------------------------------------------------ modes

  function setMode(mode) {
    if (mode !== 'daily' && mode !== 'unlimited') return;
    if (mode === game.mode || busy) return;
    clearTimeout(endTimer);
    clearToasts();
    settings.mode = mode;
    saveSettings();
    game = ensureGame(mode);
    renderAll();
    Sound.ui();
  }

  function startUnlimited() {
    clearTimeout(endTimer);
    clearToasts();
    games.unlimited = newUnlimited();
    saveGame(games.unlimited);
    if (game.mode !== 'unlimited') settings.mode = 'unlimited';
    saveSettings();
    game = games.unlimited;
    renderAll();
  }

  $('modes').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) setMode(b.getAttribute('data-mode'));
  });

  var giveUpArmed = 0;
  $('btn-new').addEventListener('click', function () {
    if (busy || game.mode !== 'unlimited') return;
    var nb = this;
    if (game.status !== 'playing' || game.guesses.length === 0) {
      Sound.ui();
      startUnlimited();
      return;
    }
    if (giveUpArmed && Date.now() - giveUpArmed < 3500) {
      giveUpArmed = 0;
      game.status = 'lost';
      game.gaveUp = true;
      game.current = '';
      recordGame(game);
      saveGame(game);
      renderBoard();
      renderChrome();
      mourn();
      return;
    }
    giveUpArmed = Date.now();
    nb.classList.add('armed');
    nb.querySelector('span').textContent = 'Give up?';
    toast('Tap again to give up and see the word', 1600);
    setTimeout(function () {
      if (giveUpArmed && Date.now() - giveUpArmed >= 3400) {
        giveUpArmed = 0;
        nb.classList.remove('armed');
        nb.querySelector('span').textContent = 'New';
      }
    }, 3500);
  });

  // ----------------------------------------------------------------- modals

  var openModal = null;
  var lastFocus = null;

  function showModal(name) {
    if (openModal) hideModal(true);
    var m = $('modal-' + name);
    if (!m) return;
    clearToasts();
    if (name === 'stats') renderStats(game.mode);
    if (name === 'settings') renderSettings();
    lastFocus = doc.activeElement;
    m.hidden = false;
    m.classList.remove('closing');
    openModal = m;
    var body = m.querySelector('.modal-body');
    if (body) body.scrollTop = 0;
    var card = m.querySelector('.modal-card');
    if (card) { try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); } }
    if (name === 'stats') startCountdown();
  }

  function hideModal(instant) {
    var m = openModal;
    if (!m) return;
    openModal = null;
    stopCountdown();
    if (instant || reduceMotion) {
      m.hidden = true;
    } else {
      m.classList.add('closing');
      setTimeout(function () { if (openModal !== m) { m.hidden = true; m.classList.remove('closing'); } }, 160);
    }
    if (lastFocus && lastFocus.focus && lastFocus !== doc.body) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    lastFocus = null;
  }

  Array.prototype.forEach.call(doc.querySelectorAll('.modal'), function (m) {
    m.addEventListener('click', function (e) {
      if (e.target === m || (e.target.closest && e.target.closest('.modal-close'))) hideModal();
    });
  });

  $('btn-help').addEventListener('click', function () { showModal('help'); });
  $('btn-stats').addEventListener('click', function () { showModal('stats'); });
  $('btn-settings').addEventListener('click', function () { showModal('settings'); });

  // -------------------------------------------------------------- statistics

  var statsTab = 'daily';

  function renderStats(tab) {
    statsTab = tab;
    var s = stats[tab];
    var tabs = $('stats-tabs').querySelectorAll('button');
    for (var i = 0; i < tabs.length; i++) tabs[i].setAttribute('aria-checked', String(tabs[i].getAttribute('data-mode') === tab));

    $('st-played').textContent = s.played;
    $('st-winpct').textContent = s.played ? Math.round((s.wins / s.played) * 100) : 0;
    $('st-streak').textContent = L.displayStreak(s, tab === 'daily' ? L.dayIndex(new Date()) : undefined);
    $('st-max').textContent = s.maxStreak;

    var g = games[tab];
    var over = g && g.status !== 'playing';
    var highlight = g && g.status === 'won' ? g.guesses.length - 1 : -1;
    var max = Math.max.apply(null, s.dist.concat([1]));
    var dist = $('dist');
    dist.innerHTML = '';
    for (var k = 0; k < 6; k++) {
      var row = doc.createElement('div');
      row.className = 'dist-row';
      var lab = doc.createElement('div');
      lab.className = 'dist-label';
      lab.textContent = k + 1;
      var track = doc.createElement('div');
      track.className = 'dist-track';
      var bar = doc.createElement('div');
      bar.className = 'dist-bar' + (k === highlight ? ' current' : '');
      bar.textContent = s.dist[k];
      bar.style.width = Math.max(7, Math.round((s.dist[k] / max) * 100)) + '%';
      track.appendChild(bar);
      row.appendChild(lab);
      row.appendChild(track);
      dist.appendChild(row);
    }
    $('dist-empty').hidden = s.played > 0;
    dist.hidden = s.played === 0;

    // The result banner and footer belong to the finished game of this tab.
    var res = $('stats-result');
    if (over) {
      res.hidden = false;
      res.innerHTML = '';
      var head = doc.createElement('div');
      var sub = doc.createElement('small');
      var label = tab === 'daily' ? 'Wordle #' + L.puzzleNumber(g.day) : 'Unlimited';
      if (g.status === 'won') {
        head.textContent = L.winMessage(g.guesses.length) + '!';
        sub.textContent = label + ' solved in ' + g.guesses.length + '/' + ROWS + (g.hard ? ' on hard mode' : '');
      } else {
        head.appendChild(doc.createTextNode('The word was '));
        var b = doc.createElement('span');
        b.className = 'reveal';
        b.textContent = g.answer;
        head.appendChild(b);
        sub.textContent = label + (g.gaveUp ? ': you gave up' : ': better luck next time');
      }
      res.appendChild(head);
      res.appendChild(sub);
    } else {
      res.hidden = true;
    }
    $('stats-footer').hidden = !over;
    $('countdown-box').hidden = tab !== 'daily';
    $('btn-again').hidden = tab !== 'unlimited';
    updateCountdown();
  }

  $('stats-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) renderStats(b.getAttribute('data-mode'));
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function updateCountdown() {
    var ms = L.msUntilTomorrow(new Date());
    var s = Math.floor(ms / 1000);
    $('countdown').textContent = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor((s % 3600) / 60)) + ':' + pad(s % 60);
  }
  var countdownTimer = 0;
  function startCountdown() {
    stopCountdown();
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
  }
  function stopCountdown() { clearInterval(countdownTimer); countdownTimer = 0; }

  $('btn-again').addEventListener('click', function () {
    hideModal(true);
    startUnlimited();
  });

  // ------------------------------------------------------------------ share

  function shareTextFor(g) {
    var url = '';
    try { if (location.protocol === 'https:') url = location.origin + location.pathname; } catch (e) { /* ignore */ }
    return L.shareText({
      label: g.mode === 'daily' ? String(L.puzzleNumber(g.day)) : 'Unlimited',
      rows: g.marks,
      won: g.status === 'won',
      hard: g.hard,
      dark: root.getAttribute('data-theme') === 'dark',
      contrast: settings.contrast,
      url: url
    });
  }

  function copyFallback(text) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    doc.body.removeChild(ta);
    return ok;
  }

  function copied(ok) {
    toast(ok ? 'Copied results to clipboard' : 'Could not copy. Your browser blocked the clipboard.', ok ? 1500 : 2500);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { copied(true); }, function () { copied(copyFallback(text)); });
    } else {
      copied(copyFallback(text));
    }
  }

  $('btn-share').addEventListener('click', function () {
    var g = games[statsTab];
    if (!g || g.status === 'playing') return;
    var text = shareTextFor(g);
    api.lastShare = text;
    var coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) { /* ignore */ }
    if (coarse && navigator.share) {
      navigator.share({ text: text }).catch(function (err) {
        if (!err || err.name !== 'AbortError') copyText(text);
      });
    } else {
      copyText(text);
    }
  });

  // --------------------------------------------------------------- settings

  var mqDark = null;
  try { mqDark = window.matchMedia('(prefers-color-scheme: dark)'); } catch (e) { /* ignore */ }

  function isDark() {
    if (settings.theme) return settings.theme === 'dark';
    return !!(mqDark && mqDark.matches);
  }

  function applyTheme() {
    var dark = isDark();
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    if (settings.contrast) root.setAttribute('data-contrast', 'high');
    else root.removeAttribute('data-contrast');
    var metas = doc.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].removeAttribute('media');
      metas[i].setAttribute('content', dark ? '#121213' : '#ffffff');
    }
  }

  if (mqDark) {
    var onScheme = function () { if (!settings.theme) { applyTheme(); renderSettings(); } };
    if (mqDark.addEventListener) mqDark.addEventListener('change', onScheme);
    else if (mqDark.addListener) mqDark.addListener(onScheme);
  }

  function applySound() {
    Sound.setMuted(settings.muted);
    $('btn-sound').setAttribute('aria-pressed', String(!settings.muted));
    $('btn-sound').setAttribute('aria-label', settings.muted ? 'Sound off. Turn sound on' : 'Sound on. Turn sound off');
  }

  function renderSettings() {
    $('sw-hard').setAttribute('aria-checked', String(settings.hard));
    $('sw-dark').setAttribute('aria-checked', String(isDark()));
    $('sw-contrast').setAttribute('aria-checked', String(settings.contrast));
    $('sw-sound').setAttribute('aria-checked', String(!settings.muted));
  }

  $('sw-hard').addEventListener('click', function () {
    if (!settings.hard && game.status === 'playing' && game.guesses.length > 0) {
      toast('Hard mode can only be enabled at the start of a round', 1800);
      Sound.invalid();
      return;
    }
    settings.hard = !settings.hard;
    if (!settings.hard && game.status === 'playing') { game.hard = false; saveGame(game); }
    saveSettings();
    renderSettings();
    renderChrome();
    Sound.ui();
  });

  $('sw-dark').addEventListener('click', function () {
    settings.theme = isDark() ? 'light' : 'dark';
    saveSettings();
    applyTheme();
    renderSettings();
    Sound.ui();
  });

  $('sw-contrast').addEventListener('click', function () {
    settings.contrast = !settings.contrast;
    saveSettings();
    applyTheme();
    renderSettings();
    Sound.ui();
  });

  function toggleSound() {
    settings.muted = !settings.muted;
    saveSettings();
    applySound();
    renderSettings();
    Sound.ui();
  }
  $('sw-sound').addEventListener('click', toggleSound);
  $('btn-sound').addEventListener('click', toggleSound);

  // ------------------------------------------------------------------ layout

  function fit() {
    var vh = window.innerHeight;
    if (window.visualViewport && window.visualViewport.height) vh = Math.min(vh, Math.round(window.visualViewport.height));
    root.style.setProperty('--app-h', vh + 'px');
    var r = boardWrap.getBoundingClientRect();
    var gap = 5;
    var size = function (g) {
      return Math.floor(Math.min((r.width - 16 - (COLS - 1) * g) / COLS, (r.height - 12 - (ROWS - 1) * g) / ROWS, 62));
    };
    var t = size(gap);
    if (t < 46) { gap = 4; t = size(gap); }
    if (t < 30) { gap = 3; t = size(gap); }
    t = Math.max(18, t);
    root.style.setProperty('--tile', t + 'px');
    root.style.setProperty('--gap', gap + 'px');
    // Toasts sit at the top of the board, over modals if need be.
    toaster.style.top = Math.round(r.top + 6) + 'px';
    toaster.style.left = Math.round(r.left + r.width / 2) + 'px';
  }

  var fitQueued = false;
  function queueFit() {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fit(); });
  }
  window.addEventListener('resize', queueFit);
  window.addEventListener('orientationchange', function () { queueFit(); setTimeout(fit, 250); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueFit);
  if (window.ResizeObserver) new ResizeObserver(queueFit).observe(boardWrap);

  // -------------------------------------------------------------- day change

  function checkDay() {
    var today = L.dayIndex(new Date());
    if (today === currentDay || busy) return;
    var d = games.daily;
    // Someone half way through yesterday's puzzle at midnight gets to finish it.
    if (d && d.status === 'playing' && d.guesses.length > 0) return;
    currentDay = today;
    games.daily = newDaily();
    saveGame(games.daily);
    if (game.mode === 'daily') {
      game = games.daily;
      if (openModal && openModal.id === 'modal-stats') hideModal(true);
      renderAll();
      toast('A new Wordle is ready', 2000);
    } else {
      renderChrome();
    }
  }
  setInterval(checkDay, 5000);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) checkDay(); });

  // -------------------------------------------------------------- debugging

  var api = {
    answer: function () { return game.answer; },
    setAnswer: function (w) {
      w = String(w).toLowerCase();
      if (!isWord(w)) throw new Error('need a five-letter word');
      game.answer = w;
      game.marks = game.guesses.map(function (g) { return L.scoreGuess(g, w); });
      saveGame(game);
      renderAll();
      return w;
    },
    state: function () { return JSON.parse(JSON.stringify(game)); },
    stats: function () { return JSON.parse(JSON.stringify(stats)); },
    settings: function () { return JSON.parse(JSON.stringify(settings)); },
    setMode: setMode,
    newUnlimited: startUnlimited,
    isBusy: function () { return busy; },
    isValid: function (w) { return VALID.has(String(w).toLowerCase()); },
    dailyFor: function (date) { return L.dailyAnswer(date, ANSWERS); },
    counts: { answers: ANSWERS.length, valid: VALID.size },
    lastShare: null
  };
  window.__wordle = api;

  // ------------------------------------------------------------------- boot

  applyTheme();
  applySound();
  renderSettings();
  renderAll();
  fit();
  // Fonts/safe-area can settle a frame late.
  requestAnimationFrame(fit);

  if (!load('seen-help', false)) {
    store('seen-help', true);
    showModal('help');
  } else if (game.status !== 'playing') {
    setTimeout(function () { if (!openModal) showModal('stats'); }, 500);
  }
})();
