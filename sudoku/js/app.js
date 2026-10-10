/*
 * Sudoku front end: board rendering, input, undo, timer, saved games,
 * stats, settings and dialogs. The rules, generator and hint logic live in
 * core.js; puzzles are made in a Web Worker (worker.js) and a few are kept
 * ready in localStorage so a new game starts instantly.
 */
(function () {
  'use strict';

  var C = window.SudokuCore;
  var Sound = window.SudokuSound;
  var KEY = 'openarcade.sudoku.';
  var LEVELS = C.LEVELS;
  var MISTAKE_LIMIT = 3;
  var MAX_UNDO = 600;
  var STAT_KEYS = ['easy', 'medium', 'hard', 'expert', 'daily'];

  // ---------- storage (every access guarded: it can be blocked or full) ----------

  function load(k) { try { return window.localStorage.getItem(KEY + k); } catch (e) { return null; } }
  function save(k, v) { try { window.localStorage.setItem(KEY + k, v); } catch (e) { /* blocked or full */ } }
  function loadJSON(k) {
    var s = load(k);
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  }
  function saveJSON(k, v) {
    var s;
    try { s = JSON.stringify(v); } catch (e) { return; }
    save(k, s);
  }

  // ---------- settings ----------

  var DEFAULTS = {
    theme: 'auto',
    sound: true,
    checkMistakes: true,
    mistakeLimit: true,
    highlightConflicts: true,
    highlightPeers: true,
    highlightSame: true,
    autoRemoveNotes: true,
    numberFirst: false,
    showTimer: true,
    showCounts: true,
    lastLevel: 'easy'
  };
  var settings = (function () {
    var s = loadJSON('settings') || {}, out = {};
    for (var k in DEFAULTS) out[k] = s && typeof s[k] === typeof DEFAULTS[k] ? s[k] : DEFAULTS[k];
    if (['auto', 'light', 'dark'].indexOf(out.theme) < 0) out.theme = 'auto';
    if (LEVELS.indexOf(out.lastLevel) < 0) out.lastLevel = 'easy';
    return out;
  })();
  function saveSettings() { saveJSON('settings', settings); }

  // ---------- stats ----------

  function blankStats() { return { started: 0, won: 0, lost: 0, perfect: 0, totalTime: 0, best: 0, streak: 0, bestStreak: 0 }; }
  var stats = loadStats();
  function loadStats() {
    var s = loadJSON('stats') || {}, out = {};
    STAT_KEYS.forEach(function (k) {
      var b = blankStats(), v = s[k] || {};
      for (var f in b) if (typeof v[f] === 'number' && isFinite(v[f]) && v[f] >= 0) b[f] = v[f];
      out[k] = b;
    });
    out.dailyDone = {};
    if (s.dailyDone && typeof s.dailyDone === 'object') {
      for (var d in s.dailyDone) if (/^\d{4}-\d\d-\d\d$/.test(d) && s.dailyDone[d]) out.dailyDone[d] = s.dailyDone[d];
    }
    return out;
  }
  function saveStats() { saveJSON('stats', stats); }
  function statKey(g) { return g.daily ? 'daily' : g.level; }

  // ---------- DOM ----------

  function $(id) { return document.getElementById(id); }
  var dom = {
    root: document.documentElement,
    app: $('app'), topbar: $('topbar'), stage: $('stage'), play: $('play'), controls: $('controls'),
    board: $('board'), boardWrap: $('board-wrap'), numpad: $('numpad'),
    levelName: $('level-name'), mistakes: $('mistakes'), timer: $('timer'),
    pauseOverlay: $('pause-overlay'), genOverlay: $('gen-overlay'), genText: $('gen-text'),
    hintbar: $('hintbar'), hintText: $('hint-text'), toast: $('toast'),
    undo: $('t-undo'), redo: $('t-redo'), erase: $('t-erase'), notes: $('t-notes'), notesPill: $('notes-pill'),
    auto: $('t-auto'), hint: $('t-hint'), mute: $('btn-mute'), pause: $('btn-pause'),
    modalRoot: $('modal-root'), metaTheme: $('meta-theme')
  };

  var cellEls = [], valEls = [], noteEls = [], numBtns = [], numCnt = [];
  var baseCls = new Array(81), anim = [], animTimers = {}, shownVal = [], shownNotes = [];
  for (var q = 0; q < 81; q++) { anim.push(''); shownVal.push(-1); shownNotes.push(-1); }

  function buildBoard() {
    var frag = document.createDocumentFragment();
    for (var b = 0; b < 9; b++) {
      var box = document.createElement('div');
      box.className = 'box';
      for (var k = 0; k < 9; k++) {
        var r = ((b / 3) | 0) * 3 + ((k / 3) | 0), c = (b % 3) * 3 + (k % 3), i = r * 9 + c;
        var cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');
        cell.dataset.i = i;
        cell.style.setProperty('--di', ((r + c) * 16) + 'ms');
        cell.style.setProperty('--dw', ((r + c) * 38) + 'ms');
        var v = document.createElement('span');
        v.className = 'v';
        var notes = document.createElement('div');
        notes.className = 'notes';
        var spans = [];
        for (var d = 1; d <= 9; d++) {
          var s = document.createElement('span');
          s.textContent = d;
          notes.appendChild(s);
          spans.push(s);
        }
        cell.appendChild(v);
        cell.appendChild(notes);
        box.appendChild(cell);
        cellEls[i] = cell;
        valEls[i] = v;
        noteEls[i] = spans;
      }
      frag.appendChild(box);
    }
    dom.board.appendChild(frag);

    for (var n = 1; n <= 9; n++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num';
      btn.dataset.d = n;
      btn.setAttribute('aria-label', 'Number ' + n);
      btn.innerHTML = '<span class="n">' + n + '</span><span class="cnt"></span>';
      dom.numpad.appendChild(btn);
      numBtns[n] = btn;
      numCnt[n] = btn.querySelector('.cnt');
    }
  }

  // ---------- game state ----------

  var slots = { classic: null, daily: null };
  var game = null;          // the game on screen (one of the slots)
  var selected = -1;
  var notesMode = false;
  var armed = 0;            // number-first mode: the digit being placed
  var paused = false;       // paused by the player
  var generating = false;
  var modalOpen = null;
  var genReq = 0;

  function fill81(v) { var a = new Array(81); for (var k = 0; k < 81; k++) a[k] = v; return a; }

  function makeGame(p, slot, dailyKey) {
    var puzzle = C.fromString(p.puzzle);
    return {
      slot: slot, level: p.level, daily: dailyKey || null, seed: p.seed || '',
      puzzle: puzzle, solution: C.fromString(p.solution), values: puzzle.slice(), notes: fill81(0),
      mistakes: 0, elapsed: 0, undo: [], redo: [], hints: 0, moves: 0,
      status: 'playing', secondChance: false, sel: -1, created: Date.now()
    };
  }

  function serialize(g, active) {
    return {
      v: 1, slot: g.slot, level: g.level, daily: g.daily, seed: g.seed,
      puzzle: C.toString(g.puzzle), solution: C.toString(g.solution), values: C.toString(g.values),
      notes: g.notes.slice(), mistakes: g.mistakes, elapsed: Math.round(active ? elapsedNow() : g.elapsed),
      undo: g.undo, redo: g.redo, hints: g.hints, moves: g.moves, status: g.status,
      secondChance: g.secondChance, sel: active ? selected : g.sel, created: g.created
    };
  }

  function validPuzzle(p) {
    if (!p || typeof p.puzzle !== 'string' || typeof p.solution !== 'string') return false;
    if (p.puzzle.length !== 81 || !/^[1-9]{81}$/.test(p.solution) || !/^[1-9.]{81}$/.test(p.puzzle)) return false;
    var sol = C.fromString(p.solution);
    for (var k = 0; k < 81; k++) {
      var ch = p.puzzle.charAt(k);
      if (ch !== '.' && +ch !== sol[k]) return false;
    }
    var conf = C.conflicts(sol);
    for (k = 0; k < 81; k++) if (conf[k]) return false;
    return LEVELS.indexOf(p.level) >= 0;
  }

  function validChange(ch) {
    if (!Array.isArray(ch) || ch.length !== 5) return false;
    for (var k = 0; k < 5; k++) if (typeof ch[k] !== 'number' || !isFinite(ch[k])) return false;
    return ch[0] >= 0 && ch[0] < 81 && ch[1] >= 0 && ch[1] <= 9 && ch[3] >= 0 && ch[3] <= 9;
  }
  function validHistory(h) {
    if (!Array.isArray(h)) return [];
    for (var k = 0; k < h.length; k++) {
      var e = h[k];
      if (!e || !Array.isArray(e.c) || !e.c.length || !e.c.every(validChange)) return [];
    }
    return h.slice(-MAX_UNDO);
  }

  function deserialize(o, slot) {
    try {
      if (!o || !validPuzzle(o) || typeof o.values !== 'string' || !/^[0-9.]{81}$/.test(o.values)) return null;
      var g = makeGame(o, slot, typeof o.daily === 'string' && /^\d{4}-\d\d-\d\d$/.test(o.daily) ? o.daily : null);
      var vals = C.fromString(o.values);
      for (var k = 0; k < 81; k++) {
        if (g.puzzle[k] && vals[k] !== g.puzzle[k]) return null;
        g.values[k] = vals[k];
      }
      if (Array.isArray(o.notes) && o.notes.length === 81) {
        for (k = 0; k < 81; k++) g.notes[k] = (o.notes[k] | 0) & 511;
      }
      g.mistakes = Math.max(0, o.mistakes | 0);
      g.elapsed = typeof o.elapsed === 'number' && isFinite(o.elapsed) && o.elapsed >= 0 ? o.elapsed : 0;
      g.undo = validHistory(o.undo);
      g.redo = validHistory(o.redo);
      g.hints = Math.max(0, o.hints | 0);
      g.moves = Math.max(0, o.moves | 0);
      g.status = ['playing', 'won', 'lost'].indexOf(o.status) >= 0 ? o.status : 'playing';
      g.secondChance = !!o.secondChance;
      g.sel = typeof o.sel === 'number' && o.sel >= -1 && o.sel < 81 ? o.sel : -1;
      g.created = typeof o.created === 'number' ? o.created : Date.now();
      return g;
    } catch (e) {
      return null;
    }
  }

  function persist() {
    if (!game) return;
    game.sel = selected;
    var out = { active: game.slot };
    ['classic', 'daily'].forEach(function (s) {
      var g = slots[s];
      out[s] = g ? serialize(g, g === game) : null;
    });
    saveJSON('games', out);
  }

  // ---------- timer ----------

  var clock = { running: false, since: 0 };
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function elapsedNow() {
    if (!game) return 0;
    return game.elapsed + (clock.running ? now() - clock.since : 0);
  }
  function shouldRun() {
    return !!game && game.status === 'playing' && !paused && !document.hidden && !modalOpen && !generating;
  }
  function syncClock() {
    var run = shouldRun();
    if (run && !clock.running) { clock.running = true; clock.since = now(); }
    else if (!run && clock.running) { game.elapsed += now() - clock.since; clock.running = false; }
    renderTimer();
  }
  function stopClockFor(g) {
    // Bank the running time into g before it stops being the game on screen.
    if (clock.running && g) { g.elapsed += now() - clock.since; clock.running = false; }
  }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (x < 10 ? '0' : '') + x;
  }
  var lastTimerText = '';
  function renderTimer() {
    var t = fmtTime(elapsedNow());
    if (t !== lastTimerText) { dom.timer.textContent = t; lastTimerText = t; }
  }

  // ---------- rendering ----------

  function setCellClass(i) {
    var cls = baseCls[i] + anim[i];
    if (cellEls[i].className !== cls) cellEls[i].className = cls;
  }

  function render() {
    if (!game) return;
    var g = game, vals = g.values, sol = g.solution;
    var selVal = selected >= 0 ? vals[selected] : 0;
    var focus = settings.numberFirst && armed ? armed : selVal;
    var conf = C.conflicts(vals);
    var check = settings.checkMistakes;
    var playing = g.status === 'playing';
    var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var i = 0; i < 81; i++) {
      var v = vals[i], given = g.puzzle[i] !== 0;
      var cls = 'cell' + (given ? ' given' : v ? ' entry' : '');
      if (playing && selected >= 0) {
        if (i === selected) cls += ' sel';
        else if (settings.highlightPeers && C.sees(selected, i)) cls += ' peer';
      }
      if (playing && settings.highlightSame && focus && v === focus && i !== selected) cls += ' same';
      if (v && !given && check && v !== sol[i]) cls += ' err';
      else if (settings.highlightConflicts && conf[i]) cls += ' conflict';
      baseCls[i] = cls;
      setCellClass(i);

      if (shownVal[i] !== v) {
        valEls[i].textContent = v ? String(v) : '';
        shownVal[i] = v;
      }
      var nm = v ? 0 : g.notes[i];
      var noteKey = nm | ((playing && focus && settings.highlightSame ? focus : 0) << 9);
      if (shownNotes[i] !== noteKey) {
        var spans = noteEls[i];
        for (var d = 1; d <= 9; d++) {
          var on = (nm >> (d - 1)) & 1;
          spans[d - 1].className = on ? (d === (noteKey >> 9) ? 'on hl' : 'on') : '';
        }
        shownNotes[i] = noteKey;
      }
      var label = C.cellName(i) + ', ' + (v ? v : nm ? 'notes ' + C.digitsOf(nm).join(' ') : 'empty');
      if (cellEls[i].getAttribute('aria-label') !== label) cellEls[i].setAttribute('aria-label', label);
      if (v && (!check || v === sol[i])) counts[v]++;
    }

    for (var n = 1; n <= 9; n++) {
      var left = Math.max(0, 9 - counts[n]);
      var done = left === 0;
      var nc = 'num' + (done ? ' done' : '') + (settings.numberFirst && armed === n ? ' armed' : '');
      if (numBtns[n].className !== nc) numBtns[n].className = nc;
      var txt = String(left);
      if (numCnt[n].textContent !== txt) numCnt[n].textContent = txt;
    }

    dom.undo.disabled = !playing || !g.undo.length;
    dom.redo.disabled = !playing || !g.redo.length;
    dom.erase.disabled = !playing;
    dom.auto.disabled = !playing;
    dom.hint.disabled = !playing;
    dom.notes.setAttribute('aria-pressed', notesMode ? 'true' : 'false');
    dom.notesPill.textContent = notesMode ? 'ON' : 'OFF';
    dom.controls.classList.toggle('notes-mode', notesMode);

    dom.levelName.textContent = levelLabel(g);
    if (check) {
      dom.mistakes.innerHTML = 'Mistakes <b>' + g.mistakes + (settings.mistakeLimit ? '/' + MISTAKE_LIMIT : '') + '</b>';
      dom.mistakes.classList.toggle('bad', g.mistakes > 0);
    } else {
      dom.mistakes.textContent = '';
    }
    dom.app.classList.toggle('paused', paused && playing);
    dom.pauseOverlay.hidden = !(paused && playing);
    dom.pause.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
    dom.app.classList.toggle('no-timer', !settings.showTimer);
    dom.app.classList.toggle('no-counts', !settings.showCounts);
    renderTimer();
  }

  function levelLabel(g) {
    var name = C.LEVEL_NAMES[g.level] || g.level;
    if (!g.daily) return name;
    var p = g.daily.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    var mon = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return 'Daily · ' + mon + ' · ' + name;
  }

  // Restartable per-cell animation classes that survive re-renders.
  function animateCell(i, name, ms, delay) {
    var key = i + name;
    clearTimeout(animTimers[key]);
    if (delay != null) cellEls[i].style.setProperty('--d', delay + 'ms');
    if (anim[i].indexOf(' ' + name) >= 0) {
      anim[i] = anim[i].replace(' ' + name, '');
      setCellClass(i);
      void cellEls[i].offsetWidth; // restart the CSS animation
    }
    anim[i] += ' ' + name;
    setCellClass(i);
    animTimers[key] = setTimeout(function () {
      anim[i] = anim[i].replace(' ' + name, '');
      setCellClass(i);
    }, ms + (delay || 0));
  }
  function clearAnims() {
    for (var k in animTimers) clearTimeout(animTimers[k]);
    animTimers = {};
    for (var i = 0; i < 81; i++) { anim[i] = ''; setCellClass(i); }
    hintZone = [];
  }

  function boardAnim(cls, ms) {
    dom.board.classList.remove(cls);
    void dom.board.offsetWidth;
    dom.board.classList.add(cls);
    clearTimeout(boardAnim[cls]);
    boardAnim[cls] = setTimeout(function () { dom.board.classList.remove(cls); }, ms);
  }

  // ---------- toast & hint bar ----------

  var toastTimer = 0;
  function toast(msg, ms) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove('show'); }, ms || 2200);
  }
  var hintTimer = 0;
  function showHint(text) {
    dom.hintText.textContent = text;
    // Above the tools when the side panel has room, else over the tool row.
    var room = dom.controls.getBoundingClientRect().top - dom.stage.getBoundingClientRect().top;
    dom.hintbar.classList.toggle('above', dom.app.classList.contains('wide') && room > 110);
    dom.hintbar.hidden = false;
    clearTimeout(hintTimer);
    hintTimer = setTimeout(hideHint, Math.max(5000, text.length * 75));
  }
  function hideHint() {
    clearTimeout(hintTimer);
    dom.hintbar.hidden = true;
    setHintZone([]);
  }
  // Cells shaded to show where a hint's reasoning happens; they stay lit
  // as long as the hint text is on screen.
  var hintZone = [];
  function setHintZone(cells) {
    var k;
    for (k = 0; k < hintZone.length; k++) {
      var c = hintZone[k];
      anim[c] = anim[c].replace(' hintzone', '');
      setCellClass(c);
    }
    hintZone = cells.slice();
    for (k = 0; k < hintZone.length; k++) {
      anim[hintZone[k]] += ' hintzone';
      setCellClass(hintZone[k]);
    }
  }

  // ---------- moves ----------

  function canPlay() { return !!game && game.status === 'playing' && !paused && !generating && !modalOpen; }

  /* Apply [cell, newValue, newNotes] changes as one undoable move. */
  function commit(changes) {
    var g = game, rec = [];
    for (var k = 0; k < changes.length; k++) {
      var ch = changes[k], i = ch[0];
      var ov = g.values[i], on = g.notes[i];
      if (ov === ch[1] && on === ch[2]) continue;
      rec.push([i, ov, on, ch[1], ch[2]]);
      g.values[i] = ch[1];
      g.notes[i] = ch[2];
    }
    if (!rec.length) return false;
    g.undo.push({ s: selected, c: rec });
    if (g.undo.length > MAX_UNDO) g.undo.splice(0, g.undo.length - MAX_UNDO);
    g.redo.length = 0;
    g.moves++;
    return true;
  }

  function placeDigit(i, d, opts) {
    var g = game;
    opts = opts || {};
    if (g.puzzle[i]) return;
    if (g.values[i] === d) {
      if (opts.toggle) eraseCell(i);
      return;
    }
    var bit = 1 << (d - 1);
    var wrong = d !== g.solution[i];
    var changes = [[i, d, 0]];
    if (settings.autoRemoveNotes && !(wrong && settings.checkMistakes)) {
      var P = C.PEERS[i];
      for (var k = 0; k < 20; k++) {
        var p = P[k];
        if (!g.values[p] && (g.notes[p] & bit)) changes.push([p, 0, g.notes[p] & ~bit]);
      }
    }
    if (!commit(changes)) return;
    if (opts.hint) g.hints++;
    hideHintUnless(opts.hint);
    render();

    if (wrong && settings.checkMistakes) {
      g.mistakes++;
      Sound.play('mistake');
      animateCell(i, 'shake', 400);
      try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) { /* ignore */ }
      render();
      persist();
      if (settings.mistakeLimit && g.mistakes >= MISTAKE_LIMIT) lose();
      return;
    }
    animateCell(i, opts.hint ? 'hinted' : 'pop', opts.hint ? 900 : 220);
    if (isSolved()) { persist(); win(); return; }
    var units = completedUnits(i);
    if (units.length) {
      Sound.play('unit');
      waveUnits(units, i);
    } else {
      Sound.play(opts.hint ? 'hint' : 'place');
    }
    if (isFull()) toast('The board is full, but something is not right yet.', 3000);
    persist();
  }

  function hideHintUnless(keep) { if (!keep) hideHint(); }

  function toggleNote(i, d) {
    var g = game;
    if (g.values[i]) {
      if (!g.puzzle[i]) toast('Erase the digit first to add notes.', 1600);
      return;
    }
    if (!commit([[i, 0, g.notes[i] ^ (1 << (d - 1))]])) return;
    hideHint();
    Sound.play('note');
    render();
    persist();
  }

  function eraseCell(i) {
    var g = game;
    if (i < 0 || g.puzzle[i]) return;
    if (!g.values[i] && !g.notes[i]) return;
    if (!commit([[i, 0, 0]])) return;
    hideHint();
    Sound.play('erase');
    render();
    persist();
  }

  function input(d, noteOverride) {
    if (!canPlay() || selected < 0) return;
    if (game.puzzle[selected]) return;
    if (notesMode !== !!noteOverride) toggleNote(selected, d);
    else placeDigit(selected, d);
  }

  function undo() {
    if (!canPlay() || !game.undo.length) return;
    var e = game.undo.pop();
    for (var k = e.c.length - 1; k >= 0; k--) {
      var ch = e.c[k];
      game.values[ch[0]] = ch[1];
      game.notes[ch[0]] = ch[2];
    }
    game.redo.push(e);
    selected = e.c[0][0];
    hideHint();
    Sound.play('undo');
    render();
    persist();
  }

  function redo() {
    if (!canPlay() || !game.redo.length) return;
    var e = game.redo.pop();
    for (var k = 0; k < e.c.length; k++) {
      var ch = e.c[k];
      game.values[ch[0]] = ch[3];
      game.notes[ch[0]] = ch[4];
    }
    game.undo.push(e);
    selected = e.c[0][0];
    hideHint();
    Sound.play('undo');
    render();
    if (isSolved()) { persist(); win(); return; }
    persist();
  }

  function autoNotes() {
    if (!canPlay()) return;
    var cand = C.candidates(game.values), changes = [];
    for (var i = 0; i < 81; i++) if (!game.values[i] && game.notes[i] !== cand[i]) changes.push([i, 0, cand[i]]);
    if (!changes.length) { toast('Notes are already up to date.'); return; }
    commit(changes);
    hideHint();
    Sound.play('hint');
    render();
    for (var k = 0; k < changes.length; k++) {
      var c = changes[k][0];
      animateCell(c, 'notesin', 300);
    }
    persist();
  }

  function hint() {
    if (!canPlay()) return;
    var h = C.getHint(game.values, game.solution, selected);
    if (!h || h.cell < 0) return;
    selected = h.cell;
    if (h.kind === 'fix') {
      // Swap the wrong digit for the right one in one undoable move.
      commit([[h.cell, 0, 0]]);
    }
    showHint(h.text);
    setHintZone((h.cells || []).filter(function (c) { return c !== h.cell; }));
    placeDigit(h.cell, h.digit, { hint: true });
    if (h.kind === 'fix' && game.status === 'playing') render();
  }

  function isSolved() {
    for (var k = 0; k < 81; k++) if (game.values[k] !== game.solution[k]) return false;
    return true;
  }
  function isFull() {
    for (var k = 0; k < 81; k++) if (!game.values[k]) return false;
    return true;
  }

  function completedUnits(i) {
    var out = [], g = game, conf = C.conflicts(g.values);
    C.CELL_UNITS[i].forEach(function (u) {
      var U = C.UNITS[u];
      for (var k = 0; k < 9; k++) {
        var c = U[k];
        if (!g.values[c] || conf[c] || (settings.checkMistakes && g.values[c] !== g.solution[c])) return;
      }
      out.push(u);
    });
    return out;
  }

  function waveUnits(units, origin) {
    var r0 = C.ROW[origin], c0 = C.COL[origin];
    units.forEach(function (u) {
      C.UNITS[u].forEach(function (c) {
        var dist = Math.max(Math.abs(C.ROW[c] - r0), Math.abs(C.COL[c] - c0));
        animateCell(c, 'wave', 640, dist * 45);
      });
    });
  }

  // ---------- selection ----------

  function select(i) {
    if (!game) return;
    selected = i;
    render();
  }

  function move(dr, dc) {
    if (!canPlay()) return;
    if (selected < 0) { select(40); return; }
    var r = (C.ROW[selected] + dr + 9) % 9, c = (C.COL[selected] + dc + 9) % 9;
    select(r * 9 + c);
  }

  function onCellTap(i) {
    if (!canPlay()) return;
    if (settings.numberFirst && armed) {
      selected = i;
      if (game.puzzle[i]) { render(); return; }
      if (notesMode) toggleNote(i, armed);
      else placeDigit(i, armed, { toggle: true });
      render();
      return;
    }
    select(i);
  }

  function onNumber(d) {
    if (!canPlay()) return;
    if (settings.numberFirst) {
      armed = armed === d ? 0 : d;
      Sound.play('click');
      render();
      return;
    }
    input(d, false);
  }

  function toggleNotesMode() {
    if (!game || game.status !== 'playing') return;
    notesMode = !notesMode;
    Sound.play('click');
    render();
  }

  // ---------- pause ----------

  function setPaused(p) {
    if (!game || game.status !== 'playing' || generating) return;
    paused = p;
    if (p) hideHint();
    syncClock();
    render();
    persist();
  }

  // ---------- win / lose ----------

  function win() {
    var g = game;
    g.status = 'won';
    syncClock();
    var t = Math.round(g.elapsed);
    var st = stats[statKey(g)];
    st.won++;
    st.totalTime += t;
    var newBest = !st.best || t < st.best;
    if (newBest) st.best = t;
    st.streak++;
    if (st.streak > st.bestStreak) st.bestStreak = st.streak;
    if (!g.mistakes) st.perfect++;
    if (g.daily) stats.dailyDone[g.daily] = { t: t, m: g.mistakes };
    saveStats();
    hideHint();
    selected = -1;
    armed = 0;
    render();
    persist();
    clearAnims();
    boardAnim('win', 2000);
    Sound.play('win');
    setTimeout(function () {
      if (game === g && g.status === 'won') showWin(g, newBest, st);
    }, 1250);
  }

  function lose() {
    var g = game;
    g.status = 'lost';
    syncClock();
    var st = stats[statKey(g)];
    st.lost++;
    st.streak = 0;
    saveStats();
    hideHint();
    render();
    persist();
    setTimeout(function () { Sound.play('lose'); }, 250);
    setTimeout(function () {
      if (game === g && g.status === 'lost') showLose(g);
    }, 650);
  }

  function secondChance() {
    var g = game;
    if (!g || g.status !== 'lost' || g.secondChance) return;
    g.secondChance = true;
    g.status = 'playing';
    g.mistakes = MISTAKE_LIMIT - 1;
    closeModal();
    // Take back the move that ended the game.
    if (g.undo.length) {
      var e = g.undo.pop();
      for (var k = e.c.length - 1; k >= 0; k--) { g.values[e.c[k][0]] = e.c[k][1]; g.notes[e.c[k][0]] = e.c[k][2]; }
      selected = e.c[0][0];
    }
    render();
    syncClock();
    persist();
  }

  function restartPuzzle() {
    var g = game;
    if (!g) return;
    stopClockFor(g);
    g.values = g.puzzle.slice();
    g.notes = fill81(0);
    g.mistakes = 0;
    g.elapsed = 0;
    g.undo = [];
    g.redo = [];
    g.hints = 0;
    g.moves = 0;
    g.status = 'playing';
    g.secondChance = false;
    selected = -1;
    armed = 0;
    paused = false;
    closeModal();
    hideHint();
    clearAnims();
    render();
    boardAnim('intro', 1100);
    syncClock();
    persist();
  }

  // ---------- puzzle supply (worker + ready-made cache) ----------

  var worker = null, workerFailed = false, pending = {}, reqSeq = 0;
  var pregen = loadPregen();
  var pregenBusy = false;

  function loadPregen() {
    var p = loadJSON('pregen') || {}, out = { daily: null };
    LEVELS.forEach(function (l) {
      out[l] = Array.isArray(p[l]) ? p[l].filter(function (x) { return validPuzzle(x) && x.level === l; }).slice(0, 2) : [];
    });
    if (p.daily && typeof p.daily.key === 'string' && validPuzzle(p.daily)) out.daily = p.daily;
    return out;
  }
  function savePregen() { saveJSON('pregen', pregen); }

  function getWorker() {
    if (worker || workerFailed) return worker;
    try {
      worker = new Worker('js/worker.js');
      worker.onmessage = function (e) {
        var r = e.data || {}, cb = pending[r.id];
        delete pending[r.id];
        if (!cb) return;
        if (r.error || !validPuzzle(r)) { cb.fallback(); return; }
        cb.done(r);
      };
      worker.onerror = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        workerFailed = true;
        worker = null;
        var all = pending;
        pending = {};
        for (var id in all) all[id].fallback();
      };
    } catch (e) {
      workerFailed = true;
      worker = null;
    }
    return worker;
  }

  /* Generate on the main thread in small slices, if workers are unavailable. */
  function generateSliced(level, seed, done) {
    var gen = C.createGenerator(level, seed);
    (function slice() {
      var t0 = now();
      while (now() - t0 < 12) {
        var r = gen.step();
        if (r) { done(r); return; }
      }
      setTimeout(slice, 0);
    })();
  }

  function requestPuzzle(level, seed, done) {
    var w = getWorker();
    var fallback = function () { generateSliced(level, seed, done); };
    if (!w) { fallback(); return; }
    var id = ++reqSeq;
    pending[id] = { done: done, fallback: fallback };
    try { w.postMessage({ id: id, level: level, seed: seed }); } catch (e) { delete pending[id]; fallback(); }
  }

  function randomSeed() {
    var s = '';
    try {
      var a = new Uint32Array(2);
      window.crypto.getRandomValues(a);
      s = a[0].toString(36) + a[1].toString(36);
    } catch (e) {
      s = Math.random().toString(36).slice(2);
    }
    return s + Date.now().toString(36);
  }

  function todayKey() { return C.dateKey(new Date()); }

  function obtainPuzzle(level, dailyKey, done) {
    if (dailyKey) {
      if (pregen.daily && pregen.daily.key === dailyKey) { done(pregen.daily); return; }
      var info = C.dailyInfo(dailyKey);
      requestPuzzle(info.level, info.seed, function (r) {
        r.key = dailyKey;
        pregen.daily = r;
        savePregen();
        done(r);
      });
      return;
    }
    var list = pregen[level];
    if (list && list.length) {
      var p = list.shift();
      savePregen();
      done(p);
      return;
    }
    requestPuzzle(level, randomSeed(), done);
  }

  /* Keep one puzzle per level (and today's daily) ready, one at a time. */
  function topUpPregen() {
    if (pregenBusy || generating) return;
    var key = todayKey();
    if (!pregen.daily || pregen.daily.key !== key) {
      var info = C.dailyInfo(key);
      pregenBusy = true;
      requestPuzzle(info.level, info.seed, function (r) {
        pregenBusy = false;
        r.key = key;
        pregen.daily = r;
        savePregen();
        setTimeout(topUpPregen, 50);
      });
      return;
    }
    for (var k = 0; k < LEVELS.length; k++) {
      var l = LEVELS[k];
      if (pregen[l].length < 1) {
        pregenBusy = true;
        requestPuzzle(l, randomSeed(), function (lv) {
          return function (r) {
            pregenBusy = false;
            if (r.level === lv && pregen[lv].length < 2) { pregen[lv].push(stripPuzzle(r)); savePregen(); }
            setTimeout(topUpPregen, 50);
          };
        }(l));
        return;
      }
    }
  }
  function stripPuzzle(r) { return { puzzle: r.puzzle, solution: r.solution, level: r.level, seed: r.seed, tier: r.tier }; }

  // ---------- starting games ----------

  function abandonCheck(g) {
    if (g && g.status === 'playing' && g.moves > 0) {
      stats[statKey(g)].streak = 0;
      saveStats();
    }
  }

  function newGame(slot, level, dailyKey) {
    if (generating) return;
    closeModal();
    hideHint();
    if (game) { stopClockFor(game); persist(); }
    abandonCheck(slots[slot]);
    generating = true;
    var myReq = ++genReq;
    var t = setTimeout(function () {
      if (generating && genReq === myReq) {
        dom.genText.textContent = 'Making ' + (dailyKey ? 'today’s puzzle' : 'a' + (level === 'easy' || level === 'expert' ? 'n ' : ' ') + C.LEVEL_NAMES[level] + ' puzzle') + '…';
        dom.genOverlay.hidden = false;
      }
    }, 120);
    syncClock();
    obtainPuzzle(level, dailyKey, function (p) {
      if (genReq !== myReq) return;
      clearTimeout(t);
      generating = false;
      dom.genOverlay.hidden = true;
      game = makeGame(p, slot, dailyKey);
      game.level = dailyKey ? C.dailyInfo(dailyKey).level : p.level;
      slots[slot] = game;
      stats[statKey(game)].started++;
      saveStats();
      if (!dailyKey) { settings.lastLevel = level; saveSettings(); }
      selected = -1;
      armed = 0;
      paused = false;
      notesMode = false;
      clearAnims();
      render();
      boardAnim('intro', 1100);
      syncClock();
      persist();
      setTimeout(topUpPregen, 1200);
    });
  }

  function switchTo(slot) {
    var g = slots[slot];
    if (!g) return;
    closeModal();
    hideHint();
    if (game && game !== g) { stopClockFor(game); game.sel = selected; }
    game = g;
    selected = g.sel;
    armed = 0;
    paused = false;
    notesMode = false;
    clearAnims();
    render();
    boardAnim('intro', 1100);
    syncClock();
    persist();
  }

  function startDaily() {
    var key = todayKey();
    var d = slots.daily;
    if (d && d.daily === key) {
      switchTo('daily');
      if (d.status === 'won') toast('You solved today\u2019s puzzle in ' + fmtTime(d.elapsed) + '. New one tomorrow!', 3000);
      return;
    }
    newGame('daily', C.dailyInfo(key).level, key);
  }

  // ---------- modals ----------

  var modalReturnFocus = null;
  function openModal(id) {
    var el = $('m-' + id);
    if (!el) return;
    if (modalOpen) $('m-' + modalOpen).hidden = true;
    else modalReturnFocus = document.activeElement;
    modalOpen = id;
    dom.modalRoot.hidden = false;
    el.hidden = false;
    el.scrollTop = 0;
    hideHint();
    syncClock();
    var sels = ['.btn.primary:not([hidden])', '.level-opt.current', '[aria-selected="true"]', '.btn:not([hidden])', 'button:not(.modal-x)'], f = null;
    for (var k = 0; k < sels.length && !f; k++) f = el.querySelector(sels[k]);
    if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  }
  function closeModal() {
    if (!modalOpen) return;
    $('m-' + modalOpen).hidden = true;
    dom.modalRoot.hidden = true;
    modalOpen = null;
    syncClock();
    var a = document.activeElement;
    if (a && a.blur && a !== document.body) a.blur();
    modalReturnFocus = null;
  }
  function modalDismissible() { return modalOpen && $('m-' + modalOpen).hasAttribute('data-dismiss'); }

  function levelDots(l) {
    var n = LEVELS.indexOf(l) + 1, s = '<span class="dots">';
    for (var k = 1; k <= 4; k++) s += '<i' + (k <= n ? ' class="on"' : '') + '></i>';
    return s + '</span>';
  }

  var LEVEL_BLURB = { easy: 'Singles only', medium: 'Pairs & pointing', hard: 'Wings & fish', expert: 'Chains & colouring' };

  function openNewGame() {
    var cur = game && !game.daily ? game.level : settings.lastLevel;
    var html = '';
    LEVELS.forEach(function (l) {
      var st = stats[l];
      html += '<button type="button" class="level-opt' + (l === cur ? ' current' : '') + '" data-level="' + l + '">' +
        '<b>' + C.LEVEL_NAMES[l] + '</b>' + levelDots(l) +
        '<small>' + LEVEL_BLURB[l] + (st.best ? ' · best ' + fmtTime(st.best) : '') + '</small></button>';
    });
    $('new-levels').innerHTML = html;

    var key = todayKey(), info = C.dailyInfo(key), done = stats.dailyDone[key];
    var d = new Date();
    var inProgress = slots.daily && slots.daily.daily === key && slots.daily.status === 'playing' && slots.daily.moves > 0;
    var go = done ? '<span class="go done">Solved ' + fmtTime(done.t) + '</span>' : '<span class="go">' + (inProgress ? 'Continue' : 'Play') + ' ›</span>';
    var streak = dailyStreak();
    $('new-daily').innerHTML = '<span class="cal"><span>' + d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase() + '</span><b>' + d.getDate() + '</b></span>' +
      '<span class="txt"><b>Daily puzzle</b><small>' + d.toLocaleDateString(undefined, { weekday: 'long' }) + ' · ' + C.LEVEL_NAMES[info.level] +
      (streak ? ' · ' + streak + '-day streak' : '') + '</small></span>' + go;

    var extra = '';
    var other = game && game.slot === 'daily' ? slots.classic : slots.daily;
    if (other && other !== game && other.status === 'playing' && other.moves > 0 && (!other.daily || other.daily === key)) {
      extra += '<button type="button" class="btn" id="new-resume">Resume ' + (other.daily ? 'daily' : C.LEVEL_NAMES[other.level]) + ' · ' + fmtTime(other.elapsed) + '</button>';
    }
    if (game && game.moves > 0) extra += '<button type="button" class="btn" id="new-restart">Restart puzzle</button>';
    $('new-extra').innerHTML = extra;
    $('new-extra').hidden = !extra;
    openModal('new');
  }

  function dailyStreak() {
    var d = new Date(), n = 0;
    if (!stats.dailyDone[C.dateKey(d)]) d.setDate(d.getDate() - 1);
    while (stats.dailyDone[C.dateKey(d)] && n < 10000) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function showWin(g, newBest, st) {
    $('win-sub').textContent = levelLabel(g);
    $('win-time').textContent = fmtTime(g.elapsed);
    $('win-best').hidden = !(newBest && st.won > 1);
    var rows = [
      ['Mistakes', String(g.mistakes)],
      ['Hints used', String(g.hints)],
      ['Best time', fmtTime(st.best)],
      ['Average time', fmtTime(st.won ? st.totalTime / st.won : 0)]
    ];
    if (g.daily) rows.push(['Daily streak', dailyStreak() + (dailyStreak() === 1 ? ' day' : ' days')]);
    else rows.push(['Win streak', String(st.streak)]);
    $('win-stats').innerHTML = rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');
    $('win-again').textContent = g.daily ? 'Play ' + C.LEVEL_NAMES[settings.lastLevel] : 'New ' + C.LEVEL_NAMES[g.level] + ' game';
    openModal('win');
  }

  function showLose(g) {
    $('lose-sub').textContent = 'You made ' + MISTAKE_LIMIT + ' mistakes on this ' + (g.daily ? 'daily' : C.LEVEL_NAMES[g.level]) + ' puzzle.';
    $('lose-second').hidden = g.secondChance;
    openModal('lose');
  }

  var statsTab = null;
  function openStats(tab) {
    statsTab = tab || statsTab || (game ? statKey(game) : 'easy');
    renderStats();
    openModal('stats');
  }
  function renderStats() {
    var names = { easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert', daily: 'Daily' };
    $('stats-tabs').innerHTML = STAT_KEYS.map(function (k) {
      return '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === statsTab) + '">' + names[k] + '</button>';
    }).join('');
    var st = stats[statsTab];
    var tiles = [
      [st.started, 'Games started'],
      [st.won, 'Games won'],
      [st.started ? Math.round(100 * Math.min(1, st.won / st.started)) + '%' : '–', 'Win rate'],
      [st.perfect, 'No-mistake wins'],
      [st.best ? fmtTime(st.best) : '–', 'Best time'],
      [st.won ? fmtTime(st.totalTime / st.won) : '–', 'Average time']
    ];
    if (statsTab === 'daily') {
      var best = 0, d = Object.keys(stats.dailyDone).sort(), run = 0, prev = null;
      d.forEach(function (k) {
        var t = new Date(k + 'T12:00:00');
        run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
        if (run > best) best = run;
        prev = t;
      });
      tiles.push([dailyStreak(), 'Day streak'], [best, 'Best day streak']);
    } else {
      tiles.push([st.streak, 'Win streak'], [st.bestStreak, 'Best win streak']);
    }
    $('stats-tiles').innerHTML = tiles.map(function (t) { return '<div class="tile"><b>' + t[0] + '</b><small>' + t[1] + '</small></div>'; }).join('');
    var rb = $('stats-reset');
    rb.classList.remove('confirm');
    rb.textContent = 'Reset statistics';
  }

  var SETTING_ROWS = [
    ['checkMistakes', 'Mistake checking', 'Wrong digits turn red as soon as you place them.'],
    ['mistakeLimit', 'Mistake limit', 'Game over after ' + MISTAKE_LIMIT + ' mistakes.'],
    ['highlightConflicts', 'Highlight duplicates', 'Show digits that clash in a row, column or box.'],
    ['highlightPeers', 'Highlight row, column & box', 'Shade the lines through the selected cell.'],
    ['highlightSame', 'Highlight matching numbers', 'Shade every cell and note with the selected digit.'],
    ['autoRemoveNotes', 'Auto-remove notes', 'Placing a digit clears it from notes it can see.'],
    ['numberFirst', 'Number-first input', 'Pick a number on the pad, then tap cells to fill them.'],
    ['showTimer', 'Show timer', ''],
    ['showCounts', 'Show remaining counts', 'Small numbers under each digit on the pad.'],
    ['sound', 'Sound effects', '']
  ];

  function openSettings() {
    var html = '<div class="set-row"><span class="lbl"><b>Theme</b></span><span class="seg" id="theme-seg">' +
      ['auto', 'light', 'dark'].map(function (t) {
        return '<button type="button" data-theme="' + t + '" aria-pressed="' + (settings.theme === t) + '">' + t.charAt(0).toUpperCase() + t.slice(1) + '</button>';
      }).join('') + '</span></div>';
    SETTING_ROWS.forEach(function (r) {
      var off = r[0] === 'mistakeLimit' && !settings.checkMistakes;
      html += '<label class="set-row' + (off ? ' off' : '') + '"><span class="lbl"><b>' + r[1] + '</b>' + (r[2] ? '<small>' + r[2] + '</small>' : '') +
        '</span><input type="checkbox" class="switch" data-set="' + r[0] + '"' + (settings[r[0]] ? ' checked' : '') + '></label>';
    });
    $('settings-list').innerHTML = html;
    openModal('settings');
  }

  function changeSetting(k, v) {
    settings[k] = v;
    saveSettings();
    if (k === 'sound') applySound();
    if (k === 'numberFirst' && !v) armed = 0;
    if (k === 'checkMistakes') {
      var row = document.querySelector('[data-set="mistakeLimit"]');
      if (row) row.closest('.set-row').classList.toggle('off', !v);
    }
    shownNotes = shownNotes.map(function () { return -1; });
    render();
  }

  // ---------- theme & sound ----------

  var darkMQ = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function effectiveDark() {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return !!(darkMQ && darkMQ.matches);
  }
  function applyTheme() {
    if (settings.theme === 'auto') dom.root.removeAttribute('data-theme');
    else dom.root.setAttribute('data-theme', settings.theme);
    var dark = effectiveDark();
    dom.root.classList.toggle('dark', dark);
    dom.metaTheme.setAttribute('content', dark ? '#0f131a' : '#eef1f6');
    var seg = $('theme-seg');
    if (seg) Array.prototype.forEach.call(seg.children, function (b) { b.setAttribute('aria-pressed', String(b.dataset.theme === settings.theme)); });
  }
  if (darkMQ) {
    var onScheme = function () { if (settings.theme === 'auto') applyTheme(); };
    if (darkMQ.addEventListener) darkMQ.addEventListener('change', onScheme);
    else if (darkMQ.addListener) darkMQ.addListener(onScheme);
  }
  function toggleTheme() {
    settings.theme = effectiveDark() ? 'light' : 'dark';
    saveSettings();
    applyTheme();
  }

  function applySound() {
    Sound.setMuted(!settings.sound);
    dom.mute.setAttribute('aria-pressed', settings.sound ? 'false' : 'true');
    dom.mute.setAttribute('aria-label', settings.sound ? 'Mute sound' : 'Unmute sound');
  }
  function toggleMute() {
    settings.sound = !settings.sound;
    saveSettings();
    applySound();
    if (settings.sound) Sound.play('click');
    toast(settings.sound ? 'Sound on' : 'Sound off', 1200);
    var box = document.querySelector('[data-set="sound"]');
    if (box) box.checked = settings.sound;
  }

  // ---------- layout ----------

  var layoutRaf = 0;
  function layout() {
    layoutRaf = 0;
    var W = dom.stage.clientWidth, H = dom.stage.clientHeight;
    var padX = 20, infoH = 40;
    // Tall: board on top, tools and pad below.
    var toolsH = 56, gapsT = 12 * 2 + 16 + 8;
    var s1 = Math.min(W - padX, H - infoH - toolsH - 60 - gapsT);
    var numH = Math.max(46, Math.min(68, Math.round(s1 / 9 * 1.3)));
    var tallS = Math.min(W - padX, H - infoH - toolsH - numH - gapsT, 760);
    // Wide: board on the left, a panel on the right.
    var panel = Math.max(250, Math.min(340, Math.round(W * 0.3)));
    var wideS = Math.min(H - infoH - (window.innerHeight <= 480 ? 14 : 24), W - panel - 28 - padX - 8, 760);
    var wide = wideS > tallS * 1.04;
    var S = Math.floor(wide ? wideS : tallS);
    if (S < 200) S = 200;
    var outer = S >= 480 ? 3 : 2, boxgap = S >= 480 ? 3 : 2;
    var cell = Math.floor((S - 2 * outer - 2 * boxgap - 6) / 9);
    var bs = cell * 9 + 6 + 2 * outer + 2 * boxgap;
    var st = dom.root.style;
    st.setProperty('--cell', cell + 'px');
    st.setProperty('--bs', bs + 'px');
    st.setProperty('--outer', outer + 'px');
    st.setProperty('--boxgap', boxgap + 'px');
    dom.app.classList.toggle('wide', wide);
    dom.app.classList.toggle('tall', !wide);
    if (wide) {
      var pw = Math.min(panel, W - bs - 28 - padX);
      var btn = Math.floor(Math.min((pw - 20) / 3, (bs - toolsH - 30) / 3 * 0.92));
      st.setProperty('--panel', pw + 'px');
      st.setProperty('--numh', Math.max(48, Math.min(btn, 96)) + 'px');
      st.setProperty('--numf', Math.round(Math.max(24, Math.min(btn * 0.42, 38))) + 'px');
      st.setProperty('--content', (bs + pw + 28) + 'px');
    } else {
      var bw = (bs - 8 * 5) / 9;
      var nh = Math.round(Math.min(numH, bw * 1.55));
      // Tall phones have height to spare: grow the pad and the gap above
      // the tools a little, so the controls sit nearer the thumb.
      var spare = H - (16 + infoH + bs + toolsH + nh + gapsT);
      if (spare > 0) {
        var grow = Math.max(0, Math.min(spare * 0.35, bw * 1.95 - nh, 76 - nh));
        nh += Math.round(grow);
        spare -= grow;
      }
      st.setProperty('--numh', nh + 'px');
      st.setProperty('--tgap', Math.round(Math.max(12, Math.min(12 + spare * 0.3, 44))) + 'px');
      st.setProperty('--numf', Math.round(Math.max(20, Math.min(bw * 0.62, 32))) + 'px');
      st.setProperty('--content', bs + 'px');
    }
  }
  function scheduleLayout() { if (!layoutRaf) layoutRaf = requestAnimationFrame(layout); }

  // ---------- events ----------

  function bind() {
    dom.board.addEventListener('pointerdown', function (e) {
      if (e.button && e.button !== 0) return;
      var el = e.target.closest ? e.target.closest('.cell') : null;
      if (!el) return;
      e.preventDefault();
      Sound.unlock();
      onCellTap(+el.dataset.i);
    });
    dom.board.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    dom.numpad.addEventListener('click', function (e) {
      var b = e.target.closest('.num');
      if (b) onNumber(+b.dataset.d);
    });
    dom.undo.addEventListener('click', undo);
    dom.redo.addEventListener('click', redo);
    dom.erase.addEventListener('click', function () { if (canPlay()) eraseCell(selected); });
    dom.notes.addEventListener('click', toggleNotesMode);
    dom.auto.addEventListener('click', autoNotes);
    dom.hint.addEventListener('click', hint);
    $('hint-close').addEventListener('click', hideHint);
    dom.pause.addEventListener('click', function () { setPaused(!paused); });
    $('btn-resume').addEventListener('click', function () { setPaused(false); });
    $('level-btn').addEventListener('click', openNewGame);
    $('btn-new').addEventListener('click', openNewGame);
    $('btn-stats').addEventListener('click', function () { openStats(); });
    $('btn-settings').addEventListener('click', openSettings);
    $('btn-theme').addEventListener('click', toggleTheme);
    dom.mute.addEventListener('click', toggleMute);
    $('btn-help').addEventListener('click', function () { openModal('help'); });

    $('new-levels').addEventListener('click', function (e) {
      var b = e.target.closest('[data-level]');
      if (b) newGame('classic', b.dataset.level);
    });
    $('new-daily').addEventListener('click', startDaily);
    $('new-extra').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'new-restart') restartPuzzle();
      if (b.id === 'new-resume') switchTo(game && game.slot === 'daily' ? 'classic' : 'daily');
    });
    $('win-again').addEventListener('click', function () {
      newGame('classic', game && !game.daily ? game.level : settings.lastLevel);
    });
    $('win-choose').addEventListener('click', openNewGame);
    $('lose-second').addEventListener('click', secondChance);
    $('lose-restart').addEventListener('click', restartPuzzle);
    $('lose-new').addEventListener('click', openNewGame);
    $('stats-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tab]');
      if (b) { statsTab = b.dataset.tab; renderStats(); }
    });
    $('stats-reset').addEventListener('click', function () {
      var b = this;
      if (!b.classList.contains('confirm')) {
        b.classList.add('confirm');
        b.textContent = 'Tap again to reset all statistics';
        return;
      }
      STAT_KEYS.forEach(function (k) { stats[k] = blankStats(); });
      stats.dailyDone = {};
      saveStats();
      renderStats();
      toast('Statistics reset');
    });
    $('settings-list').addEventListener('change', function (e) {
      var k = e.target.dataset && e.target.dataset.set;
      if (k) changeSetting(k, e.target.checked);
    });
    $('settings-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme]');
      if (b) { settings.theme = b.dataset.theme; saveSettings(); applyTheme(); }
    });

    dom.modalRoot.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeModal(); return; }
      if (e.target === dom.modalRoot && modalDismissible()) closeModal();
    });

    // Mouse clicks on game buttons should not leave them focused: the board
    // is driven by document-level keys, and a stray focus ring (or Space
    // re-clicking the button) only gets in the way.
    dom.app.addEventListener('mousedown', function (e) {
      if (e.target.closest && e.target.closest('.tool, .num, .icon-btn, .level-btn')) e.preventDefault();
    });
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', function () { Sound.unlock(); }, { passive: true });

    document.addEventListener('visibilitychange', function () {
      syncClock();
      if (document.hidden) persist();
    });
    window.addEventListener('pagehide', persist);
    window.addEventListener('resize', scheduleLayout);
    window.addEventListener('orientationchange', function () { setTimeout(layout, 150); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleLayout);
    // iOS pinch zoom ignores user-scalable=no.
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('touchmove', function (e) {
      if (!e.target.closest || !e.target.closest('.modal')) e.preventDefault();
    }, { passive: false });

    setInterval(function () { if (clock.running) renderTimer(); }, 250);
    setInterval(function () { if (clock.running) persist(); }, 5000);
  }

  var DIGIT_CODES = {};
  for (var dd = 1; dd <= 9; dd++) { DIGIT_CODES['Digit' + dd] = dd; DIGIT_CODES['Numpad' + dd] = dd; }

  function onKey(e) {
    if (e.defaultPrevented) return;
    var key = e.key, code = e.code, mod = e.ctrlKey || e.metaKey;
    if (key !== 'Shift' && key !== 'Control' && key !== 'Meta' && key !== 'Alt') Sound.unlock();

    if (modalOpen) {
      if (key === 'Escape' && modalDismissible()) { e.preventDefault(); closeModal(); }
      return;
    }
    if (e.altKey) return;

    if (mod) {
      var k = (key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
      return;
    }

    if (paused && game && game.status === 'playing') {
      if (key === 'p' || key === 'P' || key === 'Escape' || key === ' ' || key === 'Enter') { e.preventDefault(); setPaused(false); }
      return;
    }

    var d = DIGIT_CODES[code] || (/^[1-9]$/.test(key) ? +key : 0);
    if (d) {
      e.preventDefault();
      input(d, e.shiftKey);
      return;
    }
    switch (key) {
      case 'Backspace': case 'Delete': case '0':
        e.preventDefault();
        if (canPlay()) eraseCell(selected);
        return;
      case 'ArrowUp': case 'w': case 'W': e.preventDefault(); move(-1, 0); return;
      case 'ArrowDown': case 's': case 'S': e.preventDefault(); move(1, 0); return;
      case 'ArrowLeft': case 'a': case 'A': e.preventDefault(); move(0, -1); return;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); move(0, 1); return;
      case 'n': case 'N': toggleNotesMode(); return;
      case 'h': case 'H': hint(); return;
      case 'p': case 'P': setPaused(!paused); return;
      case 'm': case 'M': toggleMute(); return;
      case 'Escape':
        if (!dom.hintbar.hidden) hideHint();
        else if (armed) { armed = 0; render(); }
        else if (selected >= 0) select(-1);
        return;
    }
    if (code === 'Numpad0' || code === 'Digit0') { e.preventDefault(); if (canPlay()) eraseCell(selected); }
  }

  // ---------- debug / test hook ----------

  window.__sudoku = {
    get solution() { return game ? C.toString(game.solution) : null; },
    get puzzle() { return game ? C.toString(game.puzzle) : null; },
    get values() { return game ? C.toString(game.values) : null; },
    get notes() { return game ? game.notes.slice() : null; },
    get selected() { return selected; },
    get status() { return game ? game.status : null; },
    get mistakes() { return game ? game.mistakes : 0; },
    get level() { return game ? game.level : null; },
    get daily() { return game ? game.daily : null; },
    get elapsed() { return elapsedNow(); },
    get paused() { return paused; },
    get generating() { return generating; },
    get modal() { return modalOpen; },
    get notesMode() { return notesMode; },
    get undoDepth() { return game ? game.undo.length : 0; },
    get stats() { return JSON.parse(JSON.stringify(stats)); },
    get settings() { return JSON.parse(JSON.stringify(settings)); },
    newGame: function (level) { newGame('classic', level || 'easy'); },
    playDaily: startDaily,
    select: function (i) { if (canPlay()) select(i); },
    core: C
  };

  // ---------- boot ----------

  function boot() {
    buildBoard();
    applyTheme();
    applySound();
    layout();
    bind();

    var saved = loadJSON('games');
    if (saved && typeof saved === 'object') {
      slots.classic = deserialize(saved.classic, 'classic');
      slots.daily = deserialize(saved.daily, 'daily');
      var act = saved.active === 'daily' ? 'daily' : 'classic';
      var g = slots[act] || slots.classic || slots.daily;
      if (g && g.status === 'playing') {
        game = g;
        selected = g.sel;
        render();
        boardAnim('intro', 1100);
        syncClock();
        setTimeout(topUpPregen, 1500);
        return;
      }
      if (g) game = g;
    }
    newGame('classic', settings.lastLevel);
  }

  boot();
})();
