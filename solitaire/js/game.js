/*
 * Solitaire UI: layout, rendering, drag and drop, animations, persistence,
 * stats, dialogs and the win cascade. Rules live in rules.js, card art in
 * cards.js and sound in sound.js.
 */
(function () {
  'use strict';

  const R = window.KlondikeRules;
  const Art = window.CardArt;
  const Klondike = R.Klondike;
  const rankOf = R.rankOf;
  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------- storage
  const KEYS = { settings: 'solitaire.settings.v1', stats: 'solitaire.stats.v1', game: 'solitaire.game.v1' };
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function lsSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  }
  function lsDel(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  const FELTS = {
    green: { name: 'Green', theme: '#0a5a2f', swatch: 'radial-gradient(circle at 40% 35%, #1a9a56, #075029)' },
    blue: { name: 'Blue', theme: '#103f6a', swatch: 'radial-gradient(circle at 40% 35%, #2b82c6, #0b355c)' },
    red: { name: 'Red', theme: '#5c1521', swatch: 'radial-gradient(circle at 40% 35%, #b83545, #4f0e16)' },
    teal: { name: 'Teal', theme: '#075351', swatch: 'radial-gradient(circle at 40% 35%, #18a098, #05484a)' },
    slate: { name: 'Slate', theme: '#262d37', swatch: 'radial-gradient(circle at 40% 35%, #627082, #1f252e)' },
    purple: { name: 'Purple', theme: '#331a52', swatch: 'radial-gradient(circle at 40% 35%, #7d4cad, #2c1546)' },
  };
  const DEFAULTS = { draw: 1, scoring: 'standard', winnable: false, tapMove: true, sound: true, felt: 'green', back: 'blue' };

  function loadSettings() {
    const s = Object.assign({}, DEFAULTS);
    const o = lsGet(KEYS.settings, null);
    if (o && typeof o === 'object') {
      if (o.draw === 1 || o.draw === 3) s.draw = o.draw;
      if (o.scoring === 'standard' || o.scoring === 'vegas' || o.scoring === 'none') s.scoring = o.scoring;
      for (const k of ['winnable', 'tapMove', 'sound']) if (typeof o[k] === 'boolean') s[k] = o[k];
      if (FELTS[o.felt]) s.felt = o.felt;
      if (Art.BACKS[o.back]) s.back = o.back;
    }
    return s;
  }
  function saveSettings() { lsSet(KEYS.settings, settings); }

  function blankStats() { return { played: 0, won: 0, bestTime: null, bestScore: null, streak: 0, bestStreak: 0 }; }
  function loadStats() {
    const out = { d1: blankStats(), d3: blankStats() };
    const o = lsGet(KEYS.stats, null);
    if (o && typeof o === 'object') {
      for (const k of ['d1', 'd3']) {
        if (!o[k] || typeof o[k] !== 'object') continue;
        for (const f of Object.keys(out[k])) {
          const v = o[k][f];
          if (typeof v === 'number' && isFinite(v) && v >= 0) out[k][f] = Math.floor(v);
        }
      }
    }
    return out;
  }
  function saveStats() { lsSet(KEYS.stats, stats); }

  let settings = loadSettings();
  let stats = loadStats();

  // ---------------------------------------------------------------- state
  const sound = new window.SolitaireSound();
  const reduceMotion = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const isTouch = (() => { try { return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window; } catch (e) { return false; } })();
  if (isTouch) document.documentElement.classList.add('touch');

  let game = null;
  let elapsed = 0;        // ms of play before timerStart
  let timerStart = 0;     // performance.now() while the clock runs, else 0
  let started = false;    // first action made in this deal
  let counted = false;    // counted as "played" in stats
  let finished = false;   // won
  let winInfo = null;
  let locs = [];          // card id -> {pile, index, up}
  let L = null;           // layout metrics

  let dealing = false, dealTimer = 0;
  let autoRunning = false, autoTimer = 0;
  let press = null, drag = null, lastTap = null;
  let hintEls = [], hintTimer = 0, hintCycle = 0;
  let dropEl = null;
  let stuckShownFor = null;
  let autoToastShown = false;
  let cascade = null, winDialogTimer = 0;

  const table = $('table');
  const cardEls = [];
  const slotEls = {};

  // ---------------------------------------------------------------- DOM setup
  const RECYCLE_SVG = '<svg class="recycle" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>' +
    '<svg class="none" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m6.5 17.5 11-11"/></svg>';

  function buildTable() {
    for (const name of R.PILES) {
      const el = document.createElement('div');
      el.className = 'slot';
      el.dataset.pile = name;
      if (name === 's') { el.classList.add('stock'); el.innerHTML = RECYCLE_SVG; el.title = 'Stock'; }
      else if (name[0] === 'f') el.textContent = 'A';
      else if (name[0] === 't') el.textContent = '';
      table.appendChild(el);
      slotEls[name] = el;
    }
    for (let id = 0; id < 52; id++) {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.id = id;
      const face = document.createElement('div');
      face.className = 'face';
      el.appendChild(face);
      el._x = 0; el._y = 0; el._z = 0; el._up = false; el._anim = null; el._flip = null;
      table.appendChild(el);
      cardEls.push(el);
    }
  }

  const faceCache = { full: [], compact: [] };
  let facesCompact = null;
  function faceURL(id, compact) {
    const set = compact ? faceCache.compact : faceCache.full;
    if (!set[id]) set[id] = Art.dataURL(compact ? Art.compactFace(id) : Art.fullFace(id));
    return set[id];
  }
  function applyFaces() {
    if (facesCompact === L.compact) return;
    facesCompact = L.compact;
    for (let id = 0; id < 52; id++) cardEls[id].style.setProperty('--front', 'url("' + faceURL(id, L.compact) + '")');
  }
  function backURL(theme) { return Art.dataURL(Art.backSVG(theme)); }
  function applyBack() { table.style.setProperty('--back', 'url("' + backURL(settings.back) + '")'); }
  function applyFelt() {
    for (const k of Object.keys(FELTS)) document.body.classList.toggle('felt-' + k, k === settings.felt);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', FELTS[settings.felt].theme);
  }

  // ---------------------------------------------------------------- layout
  function layout() {
    const W = table.clientWidth, H = table.clientHeight;
    const narrow = W < 600;
    const pad = narrow ? 4 : Math.max(10, Math.round(W * 0.012));
    const topPad = narrow ? 8 : (H < 420 ? 8 : 14);
    let gap = narrow ? 3 : 0;
    let cw = narrow ? (W - 2 * pad - 6 * gap) / 7 : (W - 2 * pad) / (7 + 6 * 0.14);
    const byHeight = (H - topPad - 8) / (1.4 * 4.1);
    cw = Math.max(20, Math.floor(Math.min(cw, byHeight, 160)));
    const ch = Math.round(cw * 1.4);
    if (!narrow) gap = Math.max(4, Math.round(Math.min(cw * 0.2, (W - 2 * pad - 7 * cw) / 6)));
    const totalW = 7 * cw + 6 * gap;
    const x0 = Math.round((W - totalW) / 2);
    const colX = [];
    for (let c = 0; c < 7; c++) colX.push(x0 + c * (cw + gap));
    const rowGap = Math.max(narrow ? 8 : 10, Math.round(ch * 0.13));
    const compact = cw < 78;
    L = {
      W, H, cw, ch, gap, colX, narrow, compact,
      topY: topPad,
      tabY: topPad + ch + rowGap,
      bottom: H - (narrow ? 6 : 10),
      fanDown: Math.max(3, ch * (compact ? 0.085 : 0.1)),
      fanUp: ch * (compact ? 0.3 : 0.26),
      fanUpMin: ch * (compact ? 0.2 : 0.165),
      wasteFan: cw * (compact ? 0.3 : 0.24),
    };
    table.style.setProperty('--cw', cw + 'px');
    table.style.setProperty('--ch', ch + 'px');
    table.style.setProperty('--cr', (cw * 0.065).toFixed(2) + 'px');
    for (const name of R.PILES) {
      const p = slotXY(name);
      slotEls[name].style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    }
    applyFaces();
  }

  function slotXY(name) {
    if (name === 's') return { x: L.colX[0], y: L.topY };
    if (name === 'w') return { x: L.colX[1], y: L.topY };
    const i = name.charCodeAt(1) - 48;
    if (name[0] === 'f') return { x: L.colX[3 + i], y: L.topY };
    return { x: L.colX[i], y: L.tabY };
  }

  function columnOffsets(c) {
    const col = game.t[c];
    const n = col.length;
    const d = game.down[c];
    let dOff = L.fanDown, uOff = L.fanUp;
    if (n < 2) return { dOff, uOff };
    const ups = Math.max(0, n - d - 1);
    const avail = Math.max(0, L.bottom - L.tabY - L.ch);
    if (d * dOff + ups * uOff > avail) {
      if (ups > 0) uOff = Math.max(L.fanUpMin, (avail - d * dOff) / ups);
      if (d * dOff + ups * uOff > avail && d > 0) dOff = Math.max(2, (avail - ups * uOff) / d);
      const need = d * dOff + ups * uOff;
      if (need > avail && need > 0) { const k = avail / need; dOff *= k; uOff *= k; }
    }
    return { dOff, uOff };
  }

  /** Resting position of every card: [{x, y, z, up}] by id. */
  function positions() {
    const pos = new Array(52);
    const s = game.s;
    for (let i = 0; i < s.length; i++) {
      const k = Math.floor(i / 8) * (L.compact ? 0.5 : 1);
      pos[s[i]] = { x: L.colX[0] - k, y: L.topY - k, z: 1 + i, up: false };
    }
    const w = game.w;
    const vis = game.draw === 3 ? 3 : 1;
    const first = Math.max(0, w.length - vis);
    for (let i = 0; i < w.length; i++) {
      const k = Math.max(0, i - first);
      pos[w[i]] = { x: L.colX[1] + k * L.wasteFan, y: L.topY, z: 100 + i, up: true };
    }
    for (let f = 0; f < 4; f++) {
      const p = game.f[f];
      for (let i = 0; i < p.length; i++) pos[p[i]] = { x: L.colX[3 + f], y: L.topY, z: 200 + f * 14 + i, up: true };
    }
    for (let c = 0; c < 7; c++) {
      const col = game.t[c];
      const d = game.down[c];
      const o = columnOffsets(c);
      let y = L.tabY;
      for (let i = 0; i < col.length; i++) {
        pos[col[i]] = { x: L.colX[c], y: Math.round(y * 10) / 10, z: 300 + c * 25 + i, up: i >= d };
        y += i < d ? o.dOff : o.uOff;
      }
    }
    return pos;
  }

  // ---------------------------------------------------------------- card motion
  function setXY(el, x, y) {
    el._x = x; el._y = y;
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  }

  function currentXY(el) {
    if (el._anim) {
      try {
        const m = getComputedStyle(el).transform;
        if (m && m !== 'none') { const mm = new DOMMatrixReadOnly(m); return { x: mm.m41, y: mm.m42 }; }
      } catch (e) { /* fall through */ }
    }
    return { x: el._x, y: el._y };
  }

  function stopMotion(el) {
    if (!el._anim) return;
    const p = currentXY(el);
    const a = el._anim;
    el._anim = null;
    a.cancel();
    setXY(el, p.x, p.y);
  }

  function placeCard(el, x, y, z, anim, delay, dur) {
    const from = currentXY(el);
    if (el._anim) { const a = el._anim; el._anim = null; a.cancel(); }
    el._z = z;
    setXY(el, x, y);
    const dist = Math.hypot(x - from.x, y - from.y);
    if (!anim || dist < 0.5) { el.style.zIndex = z; return 0; }
    const d = dur || Math.min(380, Math.max(150, 120 + dist * 0.35));
    el.style.zIndex = 1000 + z;
    const a = el.animate(
      [{ transform: 'translate3d(' + from.x + 'px,' + from.y + 'px,0)' }, { transform: 'translate3d(' + x + 'px,' + y + 'px,0)' }],
      { duration: d, delay: delay || 0, easing: 'cubic-bezier(.22,.8,.32,1)', fill: 'backwards' }
    );
    el._anim = a;
    a.onfinish = () => { if (el._anim === a) { el._anim = null; el.style.zIndex = el._z; } };
    return d;
  }

  function setUp(el, up, anim, delay) {
    if (!anim) {
      if (el._flip) { const f = el._flip; el._flip = null; f.cancel(); }
      el._up = up;
      el.classList.toggle('up', up);
      return;
    }
    if (el._up === up) return;
    if (el._flip) { const f = el._flip; el._flip = null; f.cancel(); }
    el._up = up;
    const face = el.firstChild;
    const half = 105;
    const a1 = face.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }],
      { duration: half, delay: delay || 0, easing: 'ease-in', fill: 'both' });
    el._flip = a1;
    a1.onfinish = () => {
      if (el._flip !== a1) return;
      el.classList.toggle('up', el._up);
      const a2 = face.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: half, easing: 'ease-out' });
      el._flip = a2;
      a1.cancel();
      a2.onfinish = () => { if (el._flip === a2) el._flip = null; };
    };
  }

  function shake(ids) {
    if (reduceMotion) return;
    for (const id of ids) {
      const el = cardEls[id];
      if (el._anim) continue;
      const x = el._x, y = el._y;
      const t = (dx) => ({ transform: 'translate3d(' + (x + dx) + 'px,' + y + 'px,0)' });
      el.animate([t(0), t(-5), t(5), t(-3), t(3), t(0)], { duration: 280, easing: 'ease-out' });
    }
  }

  // ---------------------------------------------------------------- render
  function render(opts) {
    opts = opts || {};
    const anim = opts.anim !== false && !reduceMotion;
    const pos = positions();
    locs = game.locate();
    const delays = opts.delays || {};
    const flipDelays = opts.flipDelays || {};
    for (let id = 0; id < 52; id++) {
      const el = cardEls[id], p = pos[id], loc = locs[id];
      const delay = delays[id] || 0;
      placeCard(el, p.x, p.y, p.z, anim, delay, opts.dur);
      setUp(el, p.up, anim, delay + (flipDelays[id] || 0));
      el.classList.toggle('grab', loc.pile !== 's' && game.canPick(loc.pile, loc.index));
      el.classList.toggle('stockcard', loc.pile === 's');
      el.classList.remove('dragging', 'drop-ok');
    }
    updateSlots();
    updateHud();
    updateButtons();
  }

  function updateSlots() {
    const st = slotEls.s;
    st.classList.toggle('spent', game.s.length === 0 && game.w.length > 0 && !game.canRecycle());
    st.style.visibility = (game.s.length === 0 && game.w.length === 0) ? 'hidden' : '';
    st.title = game.s.length ? 'Stock' : (game.canRecycle() ? 'Turn the waste back over' : 'No more passes');
  }

  function fmtTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(ss).padStart(2, '0');
  }
  function fmtScore(score, scoring) {
    if (scoring === 'vegas') return (score < 0 ? '−$' : '$') + Math.abs(score).toLocaleString('en-US');
    return score.toLocaleString('en-US');
  }

  function updateHud() {
    const scoreStat = $('score').parentNode;
    scoreStat.style.display = game.scoring === 'none' ? 'none' : '';
    $('score').textContent = fmtScore(game.score, game.scoring);
    $('moves').textContent = String(game.moves);
    $('time').textContent = fmtTime(elapsedNow());
  }

  function updateButtons() {
    const busy = dealing || autoRunning;
    $('btn-undo').disabled = busy || finished || !game.canUndo();
    $('btn-hint').disabled = busy || finished;
    const canAuto = !busy && !finished && game.canAutoComplete();
    const btn = $('btn-auto');
    if (btn.hidden === canAuto) btn.hidden = !canAuto;
    if (canAuto && !autoToastShown) {
      autoToastShown = true;
      toast(isTouch ? 'All cards are face up. Tap Finish!' : 'All cards are face up. Press Finish (A) to auto-complete.', null, 2600);
    }
  }

  // ---------------------------------------------------------------- timer
  function elapsedNow() { return elapsed + (timerStart ? performance.now() - timerStart : 0); }
  function syncTimer() {
    const run = !!game && started && !finished && !dealing && !document.hidden;
    if (run && !timerStart) timerStart = performance.now();
    else if (!run && timerStart) { elapsed = elapsedNow(); timerStart = 0; }
  }
  setInterval(() => {
    if (!game) return;
    syncTimer();
    $('time').textContent = fmtTime(elapsedNow());
  }, 250);

  // ---------------------------------------------------------------- persistence
  function save() {
    if (!game) return;
    lsSet(KEYS.game, { v: 1, game: game.toJSON(), elapsed: Math.round(elapsedNow()), started, counted, finished });
  }
  function restore() {
    const o = lsGet(KEYS.game, null);
    if (!o || typeof o !== 'object' || o.finished) return false;
    try {
      game = Klondike.fromJSON(o.game);
    } catch (e) {
      return false;
    }
    elapsed = Math.max(0, Number(o.elapsed) || 0);
    started = !!o.started || game.moves > 0;
    counted = !!o.counted;
    finished = false;
    return true;
  }

  // ---------------------------------------------------------------- actions
  function statKey() { return 'd' + game.draw; }

  function afterAction(res, opts) {
    opts = opts || {};
    hintCycle = 0;
    started = true;
    if (!counted) {
      counted = true;
      stats[statKey()].played++;
      saveStats();
    }
    syncTimer();
    const delays = {}, flipDelays = {};
    if (res.type === 'draw') res.cards.forEach((id, i) => { delays[id] = i * 75; });
    else if (res.type === 'recycle') { const n = res.cards.length; res.cards.forEach((id, i) => { delays[id] = Math.min(n - 1 - i, 24) * 9; }); }
    if (res.flipped != null) flipDelays[res.flipped] = 90;
    render({ delays, flipDelays, dur: opts.dur });
    if (res.type === 'move') {
      if (res.to[0] === 'f') sound.foundation(rankOf(res.cards[0]));
      else sound.place();
      if (res.flipped != null) sound.flip(0.12);
    } else if (res.type === 'draw') {
      sound.draw();
      for (let i = 1; i < res.cards.length; i++) sound.deal(i * 0.075);
    } else if (res.type === 'recycle') {
      sound.recycle();
    }
    save();
    if (game.isWon()) { onWin(); return; }
    if (!opts.auto) checkStuck();
  }

  function doMove(from, index, to, opts) {
    const res = game.move(from, index, to);
    if (!res) return false;
    afterAction(res, opts);
    return true;
  }

  function doDraw() {
    if (dealing || autoRunning || finished) return;
    clearHint();
    const res = game.drawCards();
    if (!res) {
      if (game.s.length === 0 && game.w.length > 0) { toast('No more passes through the stock'); sound.bump(); }
      return;
    }
    afterAction(res);
  }

  function undo() {
    if (dealing || autoRunning || finished || !game.canUndo()) return;
    sound.unlock();
    clearHint();
    closePopover();
    game.undo();
    hintCycle = 0;
    stuckShownFor = null;
    sound.undo();
    render();
    save();
  }

  function checkStuck() {
    if (finished || !game.isStuck()) return;
    const key = game.encode();
    if (stuckShownFor === key) return;
    stuckShownFor = key;
    toast('No more moves', [
      { label: 'Undo', fn: undo },
      { label: 'New game', fn: () => newGame() },
    ], 9000);
  }

  function showHint() {
    if (dealing || autoRunning || finished) return;
    sound.unlock();
    clearHint();
    const hs = game.hints();
    if (!hs.length) { toast('No moves available'); sound.bump(); return; }
    const h = hs[hintCycle % hs.length];
    hintCycle++;
    if (h.type === 'draw') {
      hintEls.push(game.s.length ? cardEls[game.s[game.s.length - 1]] : slotEls.s);
      if (hs.length === 1) toast(game.s.length ? 'Turn a card from the stock' : 'Turn the waste back over');
    } else {
      for (const id of game.pile(h.from).slice(h.index)) hintEls.push(cardEls[id]);
      hintEls.push(pileTopEl(h.to));
    }
    for (const el of hintEls) el.classList.add('hint');
    sound.hint();
    hintTimer = setTimeout(clearHint, 2400);
  }
  function clearHint() {
    clearTimeout(hintTimer);
    for (const el of hintEls) el.classList.remove('hint');
    hintEls = [];
  }

  function pileTopEl(name) {
    const p = game.pile(name);
    return p.length ? cardEls[p[p.length - 1]] : slotEls[name];
  }

  function autoComplete() {
    if (dealing || autoRunning || finished || !game.canAutoComplete()) return;
    sound.unlock();
    clearHint();
    closePopover();
    hideToast();
    autoRunning = true;
    updateButtons();
    const step = () => {
      autoTimer = 0;
      if (!autoRunning) return;
      const m = game.nextAutoMove();
      const res = m ? game.apply(m) : null;
      if (!res) { autoRunning = false; updateButtons(); return; }
      afterAction(res, { auto: true, dur: 240 });
      if (finished) { autoRunning = false; return; }
      autoTimer = setTimeout(step, res.type === 'move' ? 95 : 140);
    };
    step();
  }
  function stopAuto() {
    autoRunning = false;
    clearTimeout(autoTimer);
    autoTimer = 0;
  }

  function pickSeed(draw) {
    if (settings.winnable) {
      const list = window.SolitaireDeals && window.SolitaireDeals['d' + draw];
      if (list && list.length) return list[Math.floor(Math.random() * list.length)];
    }
    return R.randomSeed();
  }

  function resetSession() {
    stopAuto();
    stopCascade();
    clearHint();
    closePopover();
    closeModal($('dlg-win'));
    clearTimeout(winDialogTimer);
    hideToast();
    cancelDrag(false);
    press = null;
    lastTap = null;
    stuckShownFor = null;
    autoToastShown = false;
    winInfo = null;
  }

  function newGame(opts) {
    opts = opts || {};
    if (game && counted && !finished) {
      // Abandoning a game in progress counts as a loss for the streak.
      stats[statKey()].streak = 0;
      saveStats();
    }
    resetSession();
    const draw = opts.draw === 1 || opts.draw === 3 ? opts.draw : settings.draw;
    const seed = opts.seed != null ? opts.seed : pickSeed(draw);
    game = new Klondike({ seed, draw, scoring: settings.scoring });
    elapsed = 0; timerStart = 0; started = false; counted = false; finished = false;
    save();
    dealAnimation();
  }

  function restartDeal() {
    const wasFinished = finished;
    resetSession();
    game.restart();
    elapsed = 0; timerStart = 0; started = false; finished = false;
    if (wasFinished) counted = false; // replaying a won deal is a new game
    save();
    dealAnimation();
    toast('Deal restarted');
  }

  // ---------------------------------------------------------------- deal animation
  function dealAnimation() {
    clearTimeout(dealTimer);
    dealing = false;
    layout();
    const pos = positions();
    locs = game.locate();
    for (let id = 0; id < 52; id++) cardEls[id].style.visibility = '';
    if (reduceMotion) { render({ anim: false }); return; }
    const sx = L.colX[0], sy = L.topY;
    for (let id = 0; id < 52; id++) {
      setUp(cardEls[id], false, false);
      placeCard(cardEls[id], sx, sy, 1, false);
    }
    for (const id of game.s) placeCard(cardEls[id], pos[id].x, pos[id].y, pos[id].z, false);
    dealing = true;
    sound.unlock();
    sound.shuffle();
    const t0 = 380, step = 44;
    let k = 0;
    for (let r = 0; r < 7; r++) {
      for (let c = r; c < 7; c++) {
        const id = game.t[c][r];
        const el = cardEls[id], p = pos[id];
        const delay = t0 + k * step;
        placeCard(el, p.x, p.y, p.z, true, delay, 270);
        sound.deal(delay / 1000);
        if (p.up) setUp(el, true, true, delay + 210);
        k++;
      }
    }
    updateSlots();
    updateHud();
    updateButtons();
    dealTimer = setTimeout(finishDeal, t0 + k * step + 520);
  }

  function finishDeal() {
    clearTimeout(dealTimer);
    if (!dealing) return;
    dealing = false;
    render({ anim: false });
  }

  // ---------------------------------------------------------------- pointer input
  function toTable(e) {
    const r = table.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e) {
    if (press || drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    sound.unlock();
    closePopover();
    if (dealing) { finishDeal(); return; }
    if (autoRunning || finished) return;
    clearHint();
    const cardEl = e.target.closest('.card');
    const slotEl = e.target.closest('.slot');
    const p = toTable(e);
    if (cardEl) {
      const id = +cardEl.dataset.id;
      const loc = locs[id];
      if (!loc) return;
      if (loc.pile === 's') press = { kind: 'stock', pointerId: e.pointerId };
      else if (game.canPick(loc.pile, loc.index)) {
        press = {
          kind: 'card', pointerId: e.pointerId, type: e.pointerType,
          pile: loc.pile, index: loc.index, ids: game.pile(loc.pile).slice(loc.index),
          x0: p.x, y0: p.y,
        };
      } else press = { kind: 'none', pointerId: e.pointerId };
    } else if (slotEl && slotEl.dataset.pile === 's') {
      press = { kind: 'stock', pointerId: e.pointerId };
    } else {
      return;
    }
    try { table.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!press || e.pointerId !== press.pointerId || press.kind !== 'card') return;
    const p = toTable(e);
    const dx = p.x - press.x0, dy = p.y - press.y0;
    if (!drag) {
      const th = press.type === 'mouse' ? 4 : 7;
      if (dx * dx + dy * dy < th * th) return;
      startDrag(press);
    }
    for (let i = 0; i < drag.ids.length; i++) {
      const el = cardEls[drag.ids[i]];
      setXY(el, drag.starts[i].x + dx, drag.starts[i].y + dy);
    }
    drag.last = p;
    const to = findDropTarget(drag, p);
    const el = to ? pileTopEl(to) : null;
    if (el !== dropEl) {
      if (dropEl) dropEl.classList.remove('drop-ok');
      dropEl = el;
      if (dropEl) dropEl.classList.add('drop-ok');
    }
    e.preventDefault();
  }

  function startDrag(pr) {
    drag = Object.assign({}, pr, { starts: [], moved: 0 });
    pr.dragging = true;
    drag.ids.forEach((id, i) => {
      const el = cardEls[id];
      stopMotion(el);
      drag.starts.push({ x: el._x, y: el._y });
      el.classList.add('dragging');
      el.style.zIndex = 5000 + i;
    });
  }

  function onPointerUp(e) {
    if (!press || e.pointerId !== press.pointerId) return;
    const pr = press;
    press = null;
    try { table.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (drag) { endDrag(toTable(e)); return; }
    if (dealing || autoRunning || finished) return;
    if (pr.kind === 'stock') doDraw();
    else if (pr.kind === 'card') onTap(pr);
  }

  function onPointerCancel(e) {
    if (!press || e.pointerId !== press.pointerId) return;
    press = null;
    cancelDrag(true);
  }

  function clearDropHighlight() {
    if (dropEl) dropEl.classList.remove('drop-ok');
    dropEl = null;
  }

  function cancelDrag(rerender) {
    clearDropHighlight();
    if (!drag) return;
    const d = drag;
    drag = null;
    for (const id of d.ids) cardEls[id].classList.remove('dragging');
    if (rerender && game) render();
  }

  function endDrag(p) {
    const d = drag;
    clearDropHighlight();
    drag = null;
    for (const id of d.ids) cardEls[id].classList.remove('dragging');
    const to = findDropTarget(d, p);
    if (to && doMove(d.pile, d.index, to, { fromDrag: true })) return;
    const lead = cardEls[d.ids[0]];
    const dist = Math.hypot(lead._x - d.starts[0].x, lead._y - d.starts[0].y);
    render({ dur: Math.min(300, 160 + dist * 0.25) });
    if (dist > L.cw * 0.6) sound.bump();
  }

  function overlapArea(ax, ay, aw, ah, bx, by, bw, bh) {
    const w = Math.min(ax + aw, bx + bw) - Math.max(ax, bx);
    const h = Math.min(ay + ah, by + bh) - Math.max(ay, by);
    return w > 0 && h > 0 ? w * h : 0;
  }

  function pileRect(name) {
    const base = slotXY(name);
    if (name[0] !== 't') return { x: base.x, y: base.y, w: L.cw, h: L.ch };
    const col = game.pile(name);
    let bottom = base.y + L.ch;
    if (col.length) bottom = cardEls[col[col.length - 1]]._y + L.ch;
    return { x: base.x, y: base.y, w: L.cw, h: Math.max(L.ch, bottom - base.y) };
  }

  function findDropTarget(d, p) {
    const lead = cardEls[d.ids[0]];
    const targets = game.legalTargets(d.pile, d.index);
    if (!targets.length) return null;
    let best = null, bestA = 0;
    for (const to of targets) {
      const r = pileRect(to);
      const a = overlapArea(lead._x, lead._y, L.cw, L.ch, r.x, r.y, r.w, r.h);
      if (a > bestA) { bestA = a; best = to; }
    }
    if (best) return best;
    // Forgiving fallback for fingers: the pointer itself over a target.
    for (const to of targets) {
      const r = pileRect(to);
      const gx = L.gap / 2 + 2;
      if (p.x >= r.x - gx && p.x <= r.x + r.w + gx && p.y >= r.y - 6 && p.y <= r.y + r.h + L.ch * 0.4) return to;
    }
    return null;
  }

  function foundationTarget(from, index) {
    for (const f of R.FOUNDATIONS) if (game.canMove(from, index, f)) return f;
    return null;
  }

  function onTap(pr) {
    const now = performance.now();
    const prev = lastTap;
    // The second click of a double-click lands on whatever was under the
    // card that just moved; swallow it instead of moving that card too.
    if (prev && prev.acted && prev.pile === pr.pile && now - prev.t < 330) {
      lastTap = null;
      return;
    }
    let acted = false;
    if (settings.tapMove) {
      const to = game.bestTarget(pr.pile, pr.index);
      if (to) acted = doMove(pr.pile, pr.index, to);
      else { shake(pr.ids); sound.bump(); }
    } else if (prev && prev.id === pr.ids[0] && now - prev.t < 420) {
      const to = pr.ids.length === 1 ? foundationTarget(pr.pile, pr.index) : null;
      if (to) acted = doMove(pr.pile, pr.index, to);
      else shake(pr.ids);
    }
    lastTap = { pile: pr.pile, id: pr.ids[0], t: now, acted };
  }

  // ---------------------------------------------------------------- win
  function onWin() {
    finished = true;
    syncTimer();
    clearHint();
    const secs = Math.max(1, Math.round(elapsed / 1000));
    const st = stats[statKey()];
    const bonus = game.scoring === 'standard' ? R.timeBonus(secs) : 0;
    const final = game.score + bonus;
    const hadWins = st.won > 0;
    st.won++;
    st.streak++;
    st.bestStreak = Math.max(st.bestStreak, st.streak);
    let newTime = false, newScore = false;
    if (st.bestTime == null || secs < st.bestTime) { newTime = hadWins; st.bestTime = secs; }
    if (game.scoring === 'standard' && (st.bestScore == null || final > st.bestScore)) { newScore = hadWins && st.bestScore != null; st.bestScore = final; }
    saveStats();
    winInfo = { secs, bonus, final, newTime, newScore, moves: game.moves, scoring: game.scoring, draw: game.draw, seed: game.seed };
    save();
    updateButtons();
    hideToast();
    setTimeout(() => {
      if (!finished) return;
      sound.win();
      startCascade();
    }, 420);
    clearTimeout(winDialogTimer);
    winDialogTimer = setTimeout(showWinDialog, reduceMotion ? 600 : 3400);
  }

  function showWinDialog() {
    clearTimeout(winDialogTimer);
    if (!finished || !winInfo) return;
    const dlg = $('dlg-win');
    if (!dlg.hidden) return;
    const w = winInfo;
    const st = stats['d' + w.draw];
    $('win-sub').textContent = 'Draw ' + w.draw + ' · Deal #' + w.seed;
    $('win-time').textContent = fmtTime(w.secs * 1000);
    $('win-moves').textContent = String(w.moves);
    $('win-score').textContent = w.scoring === 'none' ? '–' : fmtScore(w.final, w.scoring);
    $('win-bonus').textContent = w.bonus ? 'Includes a time bonus of ' + w.bonus.toLocaleString('en-US') : '';
    const badges = [];
    if (w.newTime) badges.push('New best time!');
    if (w.newScore) badges.push('New high score!');
    if (st.streak >= 2) badges.push(st.streak + ' wins in a row');
    $('win-badges').innerHTML = badges.map((b) => '<span>' + b + '</span>').join('');
    const pct = st.played ? Math.round((st.won / st.played) * 100) : 0;
    $('win-record').textContent = 'Won ' + st.won + ' of ' + st.played + ' (' + pct + '%)';
    openModal(dlg);
    setTimeout(() => { try { $('win-new').focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
  }

  const bitmapCache = new Map();
  function cardBitmap(id, w, h, dpr) {
    const key = id + ':' + w + ':' + (L.compact ? 1 : 0) + ':' + dpr;
    if (bitmapCache.has(key)) return Promise.resolve(bitmapCache.get(key));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w * dpr));
          c.height = Math.max(1, Math.round(h * dpr));
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          bitmapCache.set(key, c);
          resolve(c);
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = faceURL(id, L.compact);
    });
  }

  function startCascade() {
    if (reduceMotion) return;
    stopCascade();
    const canvas = $('cascade');
    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.hidden = false;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const token = { raf: 0 };
    cascade = token;
    const ids = [];
    for (let r = 13; r >= 1; r--) {
      for (let f = 0; f < 4; f++) { const p = game.f[f]; if (p[r - 1] != null) ids.push(p[r - 1]); }
    }
    const cw = L.cw, ch = L.ch;
    Promise.all(ids.map((id) => cardBitmap(id, cw, ch, dpr))).then((bmps) => {
      if (cascade !== token) return;
      const tr = table.getBoundingClientRect();
      const s = Math.max(0.6, cw / 90);
      const active = [];
      let next = 0, lastLaunch = -1e9, last = performance.now();
      const frame = (now) => {
        if (cascade !== token) return;
        const dt = Math.min(2.5, Math.max(0.25, (now - last) / 16.667));
        last = now;
        if (next < ids.length && now - lastLaunch > 210) {
          const el = cardEls[ids[next]];
          const p = currentXY(el);
          active.push({
            img: bmps[next], x: tr.left + p.x, y: tr.top + p.y,
            vx: (Math.random() < 0.5 ? -1 : 1) * (2.2 + Math.random() * 4.8) * s,
            vy: -(Math.random() * 7) * s,
            bounce: 0.68 + Math.random() * 0.17,
          });
          el.style.visibility = 'hidden';
          next++;
          lastLaunch = now;
        }
        for (let i = active.length - 1; i >= 0; i--) {
          const c = active[i];
          c.vy += 0.6 * s * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          if (c.y + ch > H) { c.y = H - ch; c.vy = -c.vy * c.bounce; }
          if (c.x + cw < 0 || c.x > W) { active.splice(i, 1); continue; }
          if (c.img) ctx.drawImage(c.img, c.x, c.y, cw, ch);
          else { ctx.fillStyle = '#fff'; ctx.fillRect(c.x, c.y, cw, ch); }
        }
        if (next >= ids.length && !active.length) { token.raf = 0; return; }
        token.raf = requestAnimationFrame(frame);
      };
      token.raf = requestAnimationFrame(frame);
    });
  }

  function stopCascade() {
    if (cascade && cascade.raf) cancelAnimationFrame(cascade.raf);
    cascade = null;
    const canvas = $('cascade');
    if (!canvas.hidden) {
      canvas.hidden = true;
      try { canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); } catch (e) { /* ignore */ }
    }
    for (const el of cardEls) el.style.visibility = '';
  }

  // ---------------------------------------------------------------- toast
  let toastTimer = 0, toastHideTimer = 0;
  function toast(msg, actions, ms) {
    const el = $('toast');
    clearTimeout(toastTimer);
    clearTimeout(toastHideTimer);
    el.textContent = '';
    const span = document.createElement('span');
    span.className = 'msg';
    span.textContent = msg;
    el.appendChild(span);
    for (const a of actions || []) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = a.label;
      b.addEventListener('click', () => { hideToast(); a.fn(); });
      el.appendChild(b);
    }
    el.hidden = false;
    void el.offsetWidth;
    el.classList.add('show');
    toastTimer = setTimeout(hideToast, ms || 1800);
  }
  function hideToast() {
    const el = $('toast');
    clearTimeout(toastTimer);
    if (el.hidden) return;
    el.classList.remove('show');
    clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => { el.hidden = true; }, 220);
  }

  // ---------------------------------------------------------------- popover + dialogs
  const popover = $('newmenu');
  function openPopover() {
    const btn = $('btn-new');
    $('deal-no').textContent = '#' + game.seed;
    popover.hidden = false;
    const r = btn.getBoundingClientRect();
    const pw = popover.offsetWidth, ph = popover.offsetHeight;
    let left = r.left + r.width / 2 - pw / 2;
    left = Math.max(8, Math.min(window.innerWidth - pw - 8, left));
    let top = r.top > window.innerHeight / 2 ? r.top - ph - 8 : r.bottom + 8;
    top = Math.max(8, Math.min(window.innerHeight - ph - 8, top));
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
    btn.setAttribute('aria-expanded', 'true');
  }
  function closePopover() {
    if (popover.hidden) return;
    popover.hidden = true;
    $('btn-new').setAttribute('aria-expanded', 'false');
  }

  function openModal(dlg) {
    closePopover();
    dlg.hidden = false;
  }
  function closeModal(dlg) {
    if (dlg.hidden) return;
    dlg.hidden = true;
  }
  function topModal() {
    for (const id of ['dlg-options', 'dlg-win']) if (!$(id).hidden) return $(id);
    return null;
  }

  // ---------------------------------------------------------------- options dialog
  function openOptions() {
    syncOptions();
    renderStats();
    $('next-note').hidden = true;
    openModal($('dlg-options'));
  }

  function syncOptions() {
    document.querySelectorAll('#dlg-options .seg').forEach((seg) => {
      const key = seg.dataset.setting;
      seg.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-checked', String(String(settings[key]) === b.dataset.value));
      });
    });
    document.querySelectorAll('#dlg-options input.switch').forEach((inp) => {
      inp.checked = !!settings[inp.dataset.setting];
    });
    document.querySelectorAll('#felt-swatches button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === settings.felt)));
    document.querySelectorAll('#back-swatches button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.value === settings.back)));
  }

  function buildSwatches() {
    const felt = $('felt-swatches');
    for (const [k, v] of Object.entries(FELTS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.value = k;
      b.title = v.name;
      b.setAttribute('aria-label', v.name + ' table');
      b.style.background = v.swatch;
      felt.appendChild(b);
    }
    const backs = $('back-swatches');
    for (const [k, v] of Object.entries(Art.BACKS)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.dataset.value = k;
      b.title = v.name;
      b.setAttribute('aria-label', v.name + ' card back');
      b.style.backgroundImage = 'url("' + backURL(k) + '")';
      backs.appendChild(b);
    }
  }

  function renderStats() {
    const fmtBest = (v, f) => (v == null ? '–' : f(v));
    const rows = [
      ['Played', (s) => s.played],
      ['Won', (s) => s.won],
      ['Win rate', (s) => (s.played ? Math.round((s.won / s.played) * 100) + '%' : '–')],
      ['Best time', (s) => fmtBest(s.bestTime, (v) => fmtTime(v * 1000))],
      ['Best score', (s) => fmtBest(s.bestScore, (v) => v.toLocaleString('en-US'))],
      ['Current streak', (s) => s.streak],
      ['Best streak', (s) => s.bestStreak],
    ];
    const tb = $('stats-table').querySelector('tbody');
    tb.innerHTML = rows.map(([label, f]) => '<tr><td>' + label + '</td><td>' + f(stats.d1) + '</td><td>' + f(stats.d3) + '</td></tr>').join('');
  }

  function pristine() { return !started && game.moves === 0; }

  function onSettingChanged(key) {
    if (key === 'draw' || key === 'scoring') {
      if (pristine() && !finished) {
        // Nothing played yet: deal again straight away with the new rules.
        newGame();
        $('next-note').hidden = true;
      } else {
        $('next-note').hidden = (settings.draw === game.draw && settings.scoring === game.scoring);
      }
    } else if (key === 'sound') {
      sound.setMuted(!settings.sound);
      updateMuteButton();
      if (settings.sound) { sound.unlock(); sound.place(); }
    } else if (key === 'felt') {
      applyFelt();
    } else if (key === 'back') {
      applyBack();
    }
  }

  function wireOptions() {
    buildSwatches();
    document.querySelectorAll('#dlg-options .seg').forEach((seg) => {
      seg.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const key = seg.dataset.setting;
        const v = key === 'draw' ? Number(b.dataset.value) : b.dataset.value;
        if (settings[key] === v) return;
        settings[key] = v;
        saveSettings();
        syncOptions();
        onSettingChanged(key);
      });
    });
    document.querySelectorAll('#dlg-options input.switch').forEach((inp) => {
      inp.addEventListener('change', () => {
        settings[inp.dataset.setting] = inp.checked;
        saveSettings();
        onSettingChanged(inp.dataset.setting);
      });
    });
    for (const [id, key] of [['felt-swatches', 'felt'], ['back-swatches', 'back']]) {
      $(id).addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        settings[key] = b.dataset.value;
        saveSettings();
        syncOptions();
        onSettingChanged(key);
      });
    }
    $('deal-now').addEventListener('click', () => { closeModal($('dlg-options')); newGame(); });
    let resetArmed = 0;
    $('reset-stats').addEventListener('click', () => {
      const b = $('reset-stats');
      if (!resetArmed) {
        b.textContent = 'Tap again to reset all statistics';
        resetArmed = setTimeout(() => { resetArmed = 0; b.textContent = 'Reset statistics'; }, 3500);
        return;
      }
      clearTimeout(resetArmed);
      resetArmed = 0;
      b.textContent = 'Reset statistics';
      stats = { d1: blankStats(), d3: blankStats() };
      // The game in progress has not been counted any more.
      counted = false;
      saveStats();
      save();
      renderStats();
      toast('Statistics reset');
    });
  }

  function updateMuteButton() {
    const b = $('btn-mute');
    b.setAttribute('aria-pressed', String(!settings.sound));
    b.setAttribute('aria-label', settings.sound ? 'Mute sound' : 'Unmute sound');
    b.title = (settings.sound ? 'Mute' : 'Unmute') + ' (M)';
  }

  function toggleMute() {
    settings.sound = !settings.sound;
    saveSettings();
    sound.setMuted(!settings.sound);
    if (settings.sound) sound.unlock();
    updateMuteButton();
    syncOptions();
    toast(settings.sound ? 'Sound on' : 'Sound off', null, 1000);
  }

  // ---------------------------------------------------------------- wiring
  function wire() {
    table.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
    table.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => e.preventDefault());

    const blurAfter = (fn) => (e) => { const b = e.currentTarget; fn(e); if (b && b.blur && e.detail) b.blur(); };
    $('btn-new').addEventListener('click', blurAfter(() => {
      sound.unlock();
      if (popover.hidden) openPopover(); else closePopover();
    }));
    $('btn-undo').addEventListener('click', blurAfter(undo));
    $('btn-hint').addEventListener('click', blurAfter(showHint));
    $('btn-auto').addEventListener('click', blurAfter(autoComplete));
    $('btn-mute').addEventListener('click', blurAfter(toggleMute));
    $('btn-menu').addEventListener('click', blurAfter(() => { sound.unlock(); openOptions(); }));

    popover.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      closePopover();
      const v = b.dataset.new;
      if (v === 'restart') { restartDeal(); return; }
      const draw = Number(v);
      if (settings.draw !== draw) { settings.draw = draw; saveSettings(); }
      newGame({ draw });
    });

    document.addEventListener('pointerdown', (e) => {
      sound.unlock();
      if (!popover.hidden && !popover.contains(e.target) && !$('btn-new').contains(e.target)) closePopover();
    }, true);

    for (const dlg of document.querySelectorAll('.modal')) {
      dlg.addEventListener('click', (e) => {
        if (e.target === dlg || e.target.closest('[data-close]')) closeModal(dlg);
      });
    }
    $('win-new').addEventListener('click', () => newGame());
    $('cascade').addEventListener('pointerdown', () => showWinDialog());

    document.addEventListener('keydown', onKey);

    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        if (!game) return;
        if (drag) { press = null; cancelDrag(false); }
        closePopover();
        layout();
        if (dealing) finishDeal();
        render({ anim: false });
        if (cascade) {
          // Keep the trails canvas matched to the new viewport.
          stopCascade();
          for (const id of [].concat(game.f[0], game.f[1], game.f[2], game.f[3])) cardEls[id].style.visibility = '';
        }
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

    document.addEventListener('visibilitychange', () => {
      syncTimer();
      if (document.hidden) save();
    });
    window.addEventListener('pagehide', () => { syncTimer(); save(); });
  }

  function onKey(e) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      if (e.key !== 'Escape') return;
    }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ((e.ctrlKey || e.metaKey) && !e.altKey && k === 'z') {
      e.preventDefault();
      if (!topModal()) undo();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    sound.unlock();
    if (k === 'Escape') {
      if (!popover.hidden) { closePopover(); return; }
      const m = topModal();
      if (m) closeModal(m);
      return;
    }
    if (k === 'm') { toggleMute(); return; }
    const modal = topModal();
    if (modal && modal.id === 'dlg-options') return;
    if (modal && modal.id === 'dlg-win') {
      if (k === 'n' || k === 'F2') { e.preventDefault(); newGame(); }
      return;
    }
    switch (k) {
      case 'n': case 'F2': e.preventDefault(); closePopover(); newGame(); break;
      case 'u': case 'Backspace': e.preventDefault(); undo(); break;
      case 'h': showHint(); break;
      case ' ': case 'd': e.preventDefault(); if (dealing) finishDeal(); else doDraw(); break;
      case 'a': autoComplete(); break;
      default: break;
    }
  }

  // ---------------------------------------------------------------- debug hook (used by tests)
  function cardRect(id) {
    const r = table.getBoundingClientRect();
    const el = cardEls[id];
    return { x: r.left + el._x, y: r.top + el._y, w: L.cw, h: L.ch, cx: r.left + el._x + L.cw / 2, cy: r.top + el._y + L.ch / 2 };
  }
  function slotRect(name) {
    const r = table.getBoundingClientRect();
    const p = slotXY(name);
    return { x: r.left + p.x, y: r.top + p.y, w: L.cw, h: L.ch, cx: r.left + p.x + L.cw / 2, cy: r.top + p.y + L.ch / 2 };
  }
  window.__solitaire = {
    get game() { return game; },
    get layout() { return L; },
    get stats() { return JSON.parse(JSON.stringify(stats)); },
    get settings() { return JSON.parse(JSON.stringify(settings)); },
    state() {
      return {
        encode: game.encode(), seed: game.seed, draw: game.draw, score: game.score, moves: game.moves,
        elapsed: Math.round(elapsedNow()), started, counted, finished, dealing, autoRunning,
        canUndo: game.canUndo(), canAuto: game.canAutoComplete(), won: game.isWon(),
      };
    },
    locate: () => game.locate(),
    cardRect, slotRect,
    hints: () => game.hints(),
    newGame: (opts) => newGame(opts),
    finishDeal,
    /** Lay out a nearly-won game: A..J of each suit up, Q/K left in the tableau. */
    setupNearWin(opts) {
      opts = opts || {};
      resetSession();
      dealing = false;
      clearTimeout(dealTimer);
      const id = (rank, suit) => suit * 13 + rank - 1;
      game.f = [0, 1, 2, 3].map((s) => { const a = []; for (let r = 1; r <= 11; r++) a.push(id(r, s)); return a; });
      game.t = [[id(13, 0), id(12, 1)], [id(13, 1), id(12, 0)], [id(13, 2), id(12, 3)], [id(13, 3), id(12, 2)], [], [], []];
      game.down = [0, 0, 0, 0, 0, 0, 0];
      game.s = []; game.w = [];
      if (opts.hidden) { game.t[4] = [id(12, 3)]; game.t[2] = [id(13, 2)]; game.t[4] = []; }
      game.history = [];
      started = true;
      if (!counted) { counted = true; stats[statKey()].played++; saveStats(); }
      finished = false;
      render({ anim: false });
      save();
      return game.encode();
    },
  };

  // ---------------------------------------------------------------- boot
  function init() {
    buildTable();
    applyBack();
    applyFelt();
    sound.setMuted(!settings.sound);
    updateMuteButton();
    wireOptions();
    wire();
    layout();
    if (restore()) {
      render({ anim: false });
      syncTimer();
    } else {
      newGame();
    }
  }

  init();
})();
