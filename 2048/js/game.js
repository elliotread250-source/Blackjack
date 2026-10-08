/*
 * 2048 front end: rendering, input, animation, persistence. The rules live
 * in logic.js; this file only decides what to draw and when.
 */
(function () {
  'use strict';

  var L = window.Logic2048;
  var Sound = window.Sound2048;

  var SIZES = [3, 4, 5, 6];
  var DEFAULT_SIZE = 4;
  var MAX_UNDO = 50;
  var SLIDE_MS = 100;
  var ANIM_MS = SLIDE_MS + 210;   // slide, then pop/appear
  var MAX_BOARD = 540;
  var SWIPE_MIN = 20;             // px of finger travel before it counts
  var MOUSE_SWIPE_MIN = 30;
  var CONFIRM_AFTER_MOVES = 10;   // ask before throwing away a longer game
  var KEY = 'openarcade.2048.';

  // ---------- storage (every access guarded: it can be blocked) ----------

  function load(k) {
    try { return window.localStorage.getItem(KEY + k); } catch (e) { return null; }
  }
  function save(k, v) {
    try { window.localStorage.setItem(KEY + k, String(v)); } catch (e) { /* storage blocked/full */ }
  }
  function loadJSON(k) {
    var s = load(k);
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  }
  function loadBest(n) {
    var b = parseInt(load('best.' + n), 10);
    return isFinite(b) && b > 0 ? b : 0;
  }

  // ---------- DOM ----------

  function $(id) { return document.getElementById(id); }
  var dom = {
    app: $('app'),
    topbar: document.querySelector('.topbar'),
    top: document.querySelector('.top'),
    hint: document.querySelector('.hint'),
    boardArea: $('board-area'),
    board: $('board'),
    grid: $('grid'),
    tiles: $('tiles'),
    overlay: $('overlay'),
    overlayTitle: $('overlay-title'),
    overlaySub: $('overlay-sub'),
    overlayActions: $('overlay-actions'),
    score: $('score'),
    best: $('best'),
    scoreBox: $('score-box'),
    bestBox: $('best-box'),
    moves: $('moves'),
    undo: $('undo'),
    newGame: $('new-game'),
    mute: $('mute'),
    sizes: $('sizes'),
    toast: $('toast')
  };

  // ---------- state ----------

  var size = DEFAULT_SIZE;
  var game = null;        // logic state (see logic.js)
  var history = [];       // undo stack of snapshots
  var best = 0;
  var bestAtStart = 0;    // best score when this game began
  var celebrated = false; // new-best fanfare already played this game
  var overlayKind = null; // 'win' | 'over' | 'confirm' | null

  var geom = { board: 0, gap: 0, cell: 0, n: 0 };
  var tileEls = new Map(); // tile id -> wrapper element
  var ghosts = [];         // merged-away tiles finishing their slide
  var animating = false;
  var animTimer = 0;
  var soundTimer = 0;
  var toastTimer = 0;

  // ---------- snapshots / persistence ----------

  function snapshot(g) {
    return {
      c: g.cells.map(function (t) { return t ? [t.id, t.v] : 0; }),
      s: g.score,
      m: g.moves,
      w: g.won
    };
  }
  function cellsFromSnap(c) {
    return c.map(function (x) { return x ? { id: x[0], v: x[1] } : null; });
  }
  function isPow2(v) { return typeof v === 'number' && v >= 2 && v <= 1e9 && (v & (v - 1)) === 0; }
  function validSnap(s, n) {
    if (!s || !Array.isArray(s.c) || s.c.length !== n * n) return false;
    if (typeof s.s !== 'number' || !isFinite(s.s) || s.s < 0) return false;
    if (typeof s.m !== 'number' || !isFinite(s.m) || s.m < 0) return false;
    var ids = {};
    for (var i = 0; i < s.c.length; i++) {
      var x = s.c[i];
      if (x === 0) continue;
      if (!Array.isArray(x) || x.length !== 2 || typeof x[0] !== 'number' || !isPow2(x[1])) return false;
      if (ids[x[0]]) return false;
      ids[x[0]] = 1;
    }
    return true;
  }

  function persist() {
    if (!game) return;
    var snap = snapshot(game);
    save('game.' + size, JSON.stringify({
      v: 1, c: snap.c, s: snap.s, m: snap.m, w: snap.w,
      k: game.keepPlaying, n: game.nextId, h: history,
      b0: bestAtStart, cel: celebrated
    }));
    save('size', size);
  }

  function restore(n) {
    var d = loadJSON('game.' + n);
    if (!d || d.v !== 1 || !validSnap(d, n)) return false;
    var hist = Array.isArray(d.h) ? d.h.filter(function (s) { return validSnap(s, n); }).slice(-MAX_UNDO) : [];
    var maxId = 0;
    [d].concat(hist).forEach(function (s) {
      s.c.forEach(function (x) { if (x && x[0] > maxId) maxId = x[0]; });
    });
    game = {
      size: n,
      cells: cellsFromSnap(d.c),
      score: d.s,
      moves: d.m,
      won: !!d.w,
      keepPlaying: !!d.k,
      over: false,
      nextId: Math.max(typeof d.n === 'number' ? d.n : 0, maxId + 1)
    };
    game.over = !L.canMove(game.cells, n);
    history = hist.map(function (s) { return { c: s.c, s: s.s, m: s.m, w: !!s.w }; });
    bestAtStart = typeof d.b0 === 'number' ? d.b0 : 0;
    celebrated = !!d.cel;
    return true;
  }

  // ---------- layout ----------

  function px(i) {
    var r = Math.floor(i / geom.n);
    var c = i % geom.n;
    return [geom.gap + c * (geom.cell + geom.gap), geom.gap + r * (geom.cell + geom.gap)];
  }
  function place(el, i) {
    el._idx = i;
    var p = px(i);
    el.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
  }

  function buildGrid() {
    dom.grid.textContent = '';
    for (var i = 0; i < size * size; i++) {
      var c = document.createElement('div');
      c.className = 'grid-cell';
      dom.grid.appendChild(c);
    }
  }

  // Room for the board, measured from the app box and the fixed-height
  // pieces around the board (never from the board area itself, whose size
  // follows the board and would feed back into this).
  function availableSpace() {
    var cs = getComputedStyle(dom.app);
    var innerW = dom.app.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var innerH = dom.app.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (cs.display === 'grid') {
      // Side-by-side: controls column on the left, board on the right.
      return { w: innerW - dom.top.offsetWidth - (parseFloat(cs.columnGap) || 0), h: innerH };
    }
    var acs = getComputedStyle(dom.boardArea);
    var tcs = getComputedStyle(dom.topbar);
    var used = dom.topbar.offsetHeight + parseFloat(tcs.marginBottom) +
      dom.top.offsetHeight + dom.hint.offsetHeight +
      parseFloat(acs.marginTop) + parseFloat(acs.marginBottom);
    return { w: innerW, h: innerH - used };
  }

  function layout(force) {
    var room = availableSpace();
    var w = room.w;
    var h = room.h;
    if (!(w > 0) || !(h > 0)) return;
    var avail = Math.floor(Math.min(w, h, MAX_BOARD));
    avail = Math.max(avail, 160);
    var n = size;
    var gap = Math.max(4, Math.round(avail * 0.12 / n));
    var cell = Math.floor((avail - gap * (n + 1)) / n);
    var board = cell * n + gap * (n + 1); // whole pixels everywhere: crisp edges
    if (!force && board === geom.board && n === geom.n) return;
    geom = { board: board, gap: gap, cell: cell, n: n };
    var st = document.documentElement.style;
    st.setProperty('--board-size', board + 'px');
    st.setProperty('--gap', gap + 'px');
    st.setProperty('--cell', cell + 'px');
    st.setProperty('--radius', Math.max(3, Math.round(cell * 0.03)) + 'px');
    var cells = dom.grid.children;
    for (var i = 0; i < cells.length; i++) place(cells[i], i);
    snapAll();
  }

  // Re-place every tile with transitions off (used on resize).
  function snapAll() {
    finishAnimations();
    dom.tiles.classList.add('instant');
    tileEls.forEach(function (el) { place(el, el._idx); });
    void dom.tiles.offsetWidth;
    dom.tiles.classList.remove('instant');
  }

  // ---------- tiles ----------

  function tileClass(v) {
    var digits = String(v).length;
    return 'tile ' + (v > 2048 ? 'vsuper' : 'v' + v) + ' d' + Math.min(digits, 7);
  }

  function makeTile(t, i, anim) {
    var el = document.createElement('div');
    el.className = tileClass(t.v);
    var inner = document.createElement('div');
    inner.className = 'tile-inner' + (anim ? ' ' + anim : '');
    inner.textContent = t.v;
    el.appendChild(inner);
    el._v = t.v;
    place(el, i);
    dom.tiles.appendChild(el);
    tileEls.set(t.id, el);
    return el;
  }

  function clearTiles() {
    finishAnimations();
    tileEls.forEach(function (el) { el.remove(); });
    tileEls.clear();
  }

  function startAnim() {
    animating = true;
    clearTimeout(animTimer);
    animTimer = setTimeout(finishAnimations, ANIM_MS);
  }

  // Jump every running animation to its end. Called before each move so a
  // fast player is never made to wait for the previous slide.
  function finishAnimations() {
    if (animTimer) { clearTimeout(animTimer); animTimer = 0; }
    if (!animating) return;
    animating = false;
    for (var i = 0; i < ghosts.length; i++) ghosts[i].remove();
    ghosts.length = 0;
    dom.tiles.classList.add('instant');
    var busy = dom.tiles.querySelectorAll('.tile-new, .tile-merged, .tile-restore');
    for (var j = 0; j < busy.length; j++) busy[j].classList.remove('tile-new', 'tile-merged', 'tile-restore');
    void dom.tiles.offsetWidth;
    dom.tiles.classList.remove('instant');
  }

  // Draw the whole board. mode: 'new' (tiles grow in), 'undo' (known tiles
  // slide back, the rest fade in), 'static' (no animation).
  function renderAll(mode) {
    finishAnimations();
    if (mode !== 'undo') clearTiles();
    var keep = new Set();
    var anim = mode === 'new' ? 'tile-new' : mode === 'undo' ? 'tile-restore' : '';
    game.cells.forEach(function (t, i) {
      if (!t) return;
      var el = tileEls.get(t.id);
      if (el && el._v === t.v) {
        place(el, i);
      } else {
        if (el) el.remove();
        makeTile(t, i, anim);
      }
      keep.add(t.id);
    });
    tileEls.forEach(function (el, id) {
      if (!keep.has(id)) { el.remove(); tileEls.delete(id); }
    });
    if (mode !== 'static') startAnim();
  }

  function renderMove(res, spawned) {
    res.slides.forEach(function (s) {
      var el = tileEls.get(s.id);
      if (el) place(el, s.to);
    });
    res.removed.forEach(function (r) {
      var el = tileEls.get(r.id);
      if (!el) return;
      tileEls.delete(r.id);
      el.classList.add('ghost');
      place(el, r.to);
      ghosts.push(el);
    });
    res.merged.forEach(function (m) { makeTile({ id: m.id, v: m.v }, m.at, 'tile-merged'); });
    if (spawned) makeTile(spawned, spawned.at, 'tile-new');
    startAnim();
  }

  // ---------- HUD ----------

  function setScoreText(el, n) {
    var s = String(n);
    el.textContent = s;
    el.classList.toggle('long', s.length >= 6 && s.length < 8);
    el.classList.toggle('longer', s.length >= 8);
  }

  function updateHUD() {
    setScoreText(dom.score, game.score);
    setScoreText(dom.best, best);
    dom.moves.textContent = game.moves;
    dom.undo.disabled = history.length === 0;
    var btns = dom.sizes.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-checked', String(Number(btns[i].getAttribute('data-size')) === size));
    }
  }

  function showAddition(n) {
    var old = dom.scoreBox.querySelectorAll('.score-addition');
    if (old.length > 3) old[0].remove();
    var a = document.createElement('div');
    a.className = 'score-addition';
    a.textContent = '+' + n;
    dom.scoreBox.appendChild(a);
    var done = function () { if (a.parentNode) a.remove(); };
    a.addEventListener('animationend', done);
    setTimeout(done, 900);
  }

  function flashBest() {
    dom.bestBox.classList.remove('flash');
    void dom.bestBox.offsetWidth;
    dom.bestBox.classList.add('flash');
  }

  function toast(msg) {
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { dom.toast.classList.remove('show'); }, 1800);
  }

  // ---------- overlays ----------

  function button(label, onClick, ghost) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn' + (ghost ? ' btn-ghost' : '');
    b.textContent = label;
    b.addEventListener('click', function (e) {
      if (e.detail) b.blur();
      onClick();
    });
    return b;
  }

  function showOverlay(kind, delay) {
    overlayKind = kind;
    var o = dom.overlay;
    o.className = 'overlay overlay-' + kind;
    o.style.setProperty('--overlay-delay', (delay || 0) + 'ms');
    dom.overlayActions.textContent = '';
    var acts = [];
    if (kind === 'win') {
      dom.overlayTitle.textContent = 'You win!';
      dom.overlaySub.textContent = 'Score ' + game.score + ' in ' + game.moves + ' moves';
      acts.push(button('Keep going', keepGoing));
      acts.push(button('New game', startNewGame, true));
      acts.push(button('Share', shareScore, true));
    } else if (kind === 'over') {
      dom.overlayTitle.textContent = 'Game over!';
      dom.overlaySub.textContent = 'Score ' + game.score + ' · best tile ' + L.maxTile(game.cells);
      acts.push(button('Try again', startNewGame));
      if (history.length) acts.push(button('Undo', undo, true));
      acts.push(button('Share', shareScore, true));
    } else {
      dom.overlayTitle.textContent = 'New game?';
      dom.overlaySub.textContent = 'This will end your current game.';
      acts.push(button('Cancel', hideOverlay, true));
      acts.push(button('New game', startNewGame));
    }
    acts.forEach(function (b) { dom.overlayActions.appendChild(b); });
    // Restart the fade-in each time it is shown.
    o.hidden = true;
    void o.offsetWidth;
    o.hidden = false;
  }

  function hideOverlay() {
    overlayKind = null;
    dom.overlay.hidden = true;
  }

  function primaryAction() {
    if (overlayKind === 'win') keepGoing();
    else if (overlayKind === 'over' || overlayKind === 'confirm') startNewGame();
  }

  function restoreOverlay() {
    if (game.over) showOverlay('over', 300);
    else if (game.won && !game.keepPlaying) showOverlay('win', 300);
    else hideOverlay();
  }

  // ---------- game flow ----------

  function startNewGame() {
    clearTimeout(soundTimer);
    finishAnimations();
    game = L.newGame(size);
    history = [];
    bestAtStart = best;
    celebrated = false;
    hideOverlay();
    renderAll('new');
    updateHUD();
    persist();
  }

  function requestNewGame() {
    if (overlayKind === 'confirm') { startNewGame(); return; }
    if (game.over || overlayKind || game.moves < CONFIRM_AFTER_MOVES) { startNewGame(); return; }
    showOverlay('confirm');
  }

  function keepGoing() {
    game.keepPlaying = true;
    hideOverlay();
    if (game.over) showOverlay('over');
    persist();
  }

  function doMove(dir) {
    if (!game) return false;
    if (overlayKind === 'confirm') hideOverlay(); // a move means "never mind"
    if (overlayKind) return false;
    finishAnimations();
    var res = L.move(game, dir);
    if (!res.moved) return false;

    history.push(snapshot(game));
    if (history.length > MAX_UNDO) history.shift();
    game = res.state;
    var spawned = L.spawn(game);
    game.over = !L.canMove(game.cells, size);

    renderMove(res, spawned);
    if (res.gained) showAddition(res.gained);

    var newBest = false;
    if (game.score > best) {
      best = game.score;
      save('best.' + size, best);
      if (!celebrated && bestAtStart > 0) { celebrated = true; newBest = true; }
    }
    updateHUD();

    Sound.slide();
    if (res.merged.length) {
      var top = 0;
      res.merged.forEach(function (m) { if (m.v > top) top = m.v; });
      Sound.merge(top, res.merged.length);
    }
    if (newBest) {
      flashBest();
      clearTimeout(soundTimer);
      soundTimer = setTimeout(Sound.newBest, 140);
    }

    if (res.justWon && !game.keepPlaying) {
      showOverlay('win', 450);
      clearTimeout(soundTimer);
      soundTimer = setTimeout(Sound.win, 300);
    } else if (game.over) {
      showOverlay('over', 800);
      clearTimeout(soundTimer);
      soundTimer = setTimeout(Sound.lose, 450);
    }
    persist();
    return true;
  }

  function undo() {
    if (!history.length || !game) return false;
    if (overlayKind === 'confirm') hideOverlay();
    clearTimeout(soundTimer);
    finishAnimations();
    var snap = history.pop();
    game = {
      size: size,
      cells: cellsFromSnap(snap.c),
      score: snap.s,
      moves: snap.m,
      won: !!snap.w,
      keepPlaying: game.keepPlaying,
      over: false,
      nextId: game.nextId
    };
    game.over = !L.canMove(game.cells, size);
    hideOverlay();
    renderAll('undo');
    updateHUD();
    Sound.undo();
    persist();
    return true;
  }

  function setSize(n) {
    n = Number(n);
    if (SIZES.indexOf(n) < 0 || n === size) return;
    clearTimeout(soundTimer);
    finishAnimations();
    persist();
    clearTiles();
    hideOverlay();
    size = n;
    best = loadBest(n);
    buildGrid();
    layout(true);
    if (restore(n)) {
      best = Math.max(best, game.score);
      renderAll('new');
      updateHUD();
      restoreOverlay();
      persist();
    } else {
      startNewGame();
    }
  }

  function setMuted(m, byUser) {
    Sound.setMuted(m);
    dom.mute.setAttribute('aria-pressed', String(m));
    dom.mute.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
    if (!byUser) return;
    save('muted', m ? '1' : '0');
    toast(m ? 'Sound off' : 'Sound on');
    if (!m) Sound.unlock();
  }

  function shareScore() {
    var text = 'I scored ' + game.score + ' in 2048 (' + size + '×' + size + '), best tile ' + L.maxTile(game.cells) + '.';
    var url = location.protocol.indexOf('http') === 0 ? location.origin + location.pathname : 'https://open-arcade.up.railway.app';
    var fallback = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + ' ' + url).then(
          function () { toast('Score copied to clipboard'); },
          function () { toast(text); }
        );
      } else {
        toast(text);
      }
    };
    if (navigator.share) {
      try {
        navigator.share({ title: '2048', text: text, url: url }).catch(function (e) {
          if (!e || e.name !== 'AbortError') fallback();
        });
      } catch (e) { fallback(); }
    } else {
      fallback();
    }
  }

  // ---------- input ----------

  var KEYS = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', a: 'left', s: 'down', d: 'right',
    k: 'up', j: 'down', h: 'left', l: 'right'
  };

  var MODIFIERS = { Shift: 1, Control: 1, Alt: 1, Meta: 1, Escape: 1, CapsLock: 1, Tab: 1 };

  function onKey(e) {
    var key = e.key || '';
    if (!MODIFIERS[key]) Sound.unlock();
    var lower = key.length === 1 ? key.toLowerCase() : key;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && lower === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var dir = KEYS[key] || KEYS[lower];
    if (dir) {
      e.preventDefault();
      doMove(dir);
      return;
    }
    var onButton = e.target && e.target.closest && e.target.closest('button, a');
    switch (lower) {
      case 'u': e.preventDefault(); undo(); break;
      case 'n': e.preventDefault(); requestNewGame(); break;
      case 'm': e.preventDefault(); setMuted(!Sound.isMuted(), true); break;
      case 'Escape':
        if (overlayKind === 'confirm') hideOverlay();
        else if (overlayKind === 'win') keepGoing();
        break;
      case 'Enter':
        if (!onButton && overlayKind) { e.preventDefault(); primaryAction(); }
        break;
      case ' ':
        if (!onButton) e.preventDefault(); // never scroll
        break;
    }
  }

  function swipeDir(dx, dy, min) {
    var ax = Math.abs(dx);
    var ay = Math.abs(dy);
    if (Math.max(ax, ay) < min) return null;
    return ax > ay ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  }

  function bindInput() {
    document.addEventListener('keydown', onKey);

    // Touch: a swipe on the board (or anywhere else on the page that isn't
    // a button or link) moves the tiles. Nothing on this page scrolls, so
    // every touchmove is cancelled: no scrolling, rubber-banding or pinch.
    var start = null;
    document.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1 || (e.target.closest && e.target.closest('button, a'))) { start = null; return; }
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', function (e) {
      if (!start || e.touches.length) return;
      var t = e.changedTouches[0];
      var dir = swipeDir(t.clientX - start.x, t.clientY - start.y, SWIPE_MIN);
      start = null;
      Sound.unlock();
      if (dir) doMove(dir);
    });
    document.addEventListener('touchcancel', function () { start = null; });
    var area = dom.boardArea;
    document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    document.addEventListener('dblclick', function (e) { e.preventDefault(); });

    // Mouse drag on the board works as a swipe too.
    var mstart = null;
    area.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest && e.target.closest('button, a')) return;
      mstart = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointerup', function (e) {
      if (!mstart || e.pointerType !== 'mouse') return;
      var dir = swipeDir(e.clientX - mstart.x, e.clientY - mstart.y, MOUSE_SWIPE_MIN);
      mstart = null;
      if (dir) doMove(dir);
    });

    // Audio may only start inside a user gesture.
    ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(function (type) {
      window.addEventListener(type, Sound.unlock, { passive: true, capture: true });
    });

    function clickBlur(fn) {
      return function (e) { if (e.detail) e.currentTarget.blur(); fn(); };
    }
    dom.newGame.addEventListener('click', clickBlur(requestNewGame));
    dom.undo.addEventListener('click', clickBlur(undo));
    dom.mute.addEventListener('click', clickBlur(function () { setMuted(!Sound.isMuted(), true); }));
    dom.sizes.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-size]');
      if (!b) return;
      if (e.detail) b.blur();
      setSize(b.getAttribute('data-size'));
    });

    // Keep the board fitted through resizes and rotations.
    var relayout = function () { layout(false); };
    // Resize work is deferred a frame: resizing the board inside the
    // observer callback would resize observed boxes again in the same frame.
    var queued = false;
    var queueLayout = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; layout(false); });
    };
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(queueLayout);
      ro.observe(dom.app);
      ro.observe(dom.top);
    }
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', function () { setTimeout(relayout, 120); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', relayout);

    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') persist();
    });
  }

  // ---------- debug hook (used by the automated tests) ----------

  window.__g2048 = {
    state: function () {
      return {
        size: size,
        rows: L.toRows(game.cells, size),
        score: game.score,
        best: best,
        moves: game.moves,
        won: game.won,
        keepPlaying: game.keepPlaying,
        over: game.over,
        undoSteps: history.length,
        overlay: overlayKind,
        animating: animating,
        tilesInDom: dom.tiles.querySelectorAll('.tile:not(.ghost)').length
      };
    },
    // Replace the board with the given rows (numbers, 0 = empty).
    setBoard: function (rows, score) {
      var n = Array.isArray(rows[0]) ? rows.length : Math.round(Math.sqrt(rows.length));
      if (n !== size) setSize(n);
      finishAnimations();
      var s = L.fromValues(rows, game.nextId);
      game.cells = s.cells;
      game.nextId = s.nextId;
      game.won = s.won;
      game.over = s.over;
      if (typeof score === 'number') game.score = score;
      history = [];
      hideOverlay();
      renderAll('static');
      updateHUD();
      if (game.over) showOverlay('over');
      persist();
    },
    move: doMove,
    undo: undo,
    newGame: startNewGame,
    setSize: setSize,
    finish: finishAnimations
  };

  // ---------- boot ----------

  function init() {
    setMuted(load('muted') === '1', false);
    var saved = parseInt(load('size'), 10);
    if (SIZES.indexOf(saved) >= 0) size = saved;
    best = loadBest(size);
    buildGrid();
    layout(true);
    if (restore(size)) {
      best = Math.max(best, game.score);
      renderAll('new');
      updateHUD();
      restoreOverlay();
    } else {
      startNewGame();
    }
    bindInput();
    // Fonts or late layout can shift the area size once after load.
    requestAnimationFrame(function () { layout(false); });
  }

  init();
})();
