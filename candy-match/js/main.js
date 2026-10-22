// main.js: screens, input, HUD and the glue between the rules (core.js), the board view
// (view.js) and saved progress (store.js).
import { W, H, N, newGame, playMove, useHammer, useShuffle, starsFor, jellyLeft } from './core.js';
import { LEVELS, LEVEL_COUNT } from './levels.js';
import { pickMove } from './bot.js';
import { BoardView } from './view.js';
import { CANDIES, drawIcon } from './art.js';
import { Sfx } from './audio.js';
import { Particles } from './tween.js';
import * as store from './store.js';
import { renderMap, WORLDS } from './map.js';

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const FAST = params.get('fast') ? Math.max(1, +params.get('fast') || 3) : 1;

const ICONS = {
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill-opacity="1"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  hammer: '<path d="M14.5 3.5l6 6-2.2 2.2-1.1-1.1-2.2 2.2L20 19.3 17.3 22l-6.4-6.4-6.4 6.4L2 19.5l6.4-6.4L3 7.7l2.2-2.2 2.2 2.2 2.2-2.2-1.1-1.1z" transform="rotate(8 12 12)"/>',
  shuffle: '<path d="M3 7h3.5c2.3 0 3.3 1.2 4.7 3.2l1.6 2.6c1.4 2 2.4 3.2 4.7 3.2H19V13l4 4-4 4v-3h-1.5c-3 0-4.4-1.6-6-3.8L9.9 11.4C8.8 9.9 8 9 6.5 9H3zM3 15h3.5c1.1 0 1.9-.5 2.7-1.5l1-1.6.9 1.4C9.9 14.9 8.7 17 6.5 17H3zM13 8.3l-.9 1.4C11 8.6 9.1 7 6.5 7H3V5h3.5C9.4 5 11.5 6.5 13 8.3zM19 3l4 4-4 4V8h-1.5c-1.1 0-2 .4-2.8 1.4l-1-1.5C14.7 6.2 15.9 5.3 17.5 5.3H19z"/>',
  map: '<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 16l3-3 2 2 3-5" fill="none" stroke="currentColor" stroke-width="2"/>',
};
document.querySelectorAll('i[data-ic]').forEach(el => { el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.ic] || ''}</svg>`; });
const STAR_PATH = 'M12 2l3 7 7.5.6-5.7 4.9 1.8 7.4L12 17.8 5.4 21.9l1.8-7.4L1.5 9.6 9 9z';
const starSvg = (cls = '') => `<svg viewBox="0 0 24 24" class="${cls}"><path d="${STAR_PATH}"/></svg>`;
const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ------------------------------------------------------------------ state
const prog = store.load();
Sfx.setMuted(!prog.sound);
const view = new BoardView($('#board'));
view.setSpeed(FAST);
let st = null, level = null, mapCtl = null;
let screen = 'map', busy = false, paused = false, hammerMode = false, runId = 0;
let bonusMode = false, hintTimer = 0, sel = -1, drag = null, kbSel = false;
const playedOnce = new Set();
const hud = { moves: 0, score: 0, shown: 0, collected: 0, delivered: 0 };
let chips = [];

// ------------------------------------------------------------------ small ui helpers
let toastTimer = 0;
function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
function syncSoundButtons() {
  for (const b of [$('#m-sound'), $('#g-sound')]) b.setAttribute('aria-pressed', String(Sfx.muted));
}
function toggleSound() {
  Sfx.unlock();
  Sfx.setMuted(!Sfx.muted); prog.sound = !Sfx.muted; store.save(prog); syncSoundButtons();
  if (!Sfx.muted) Sfx.play('click');
}
function showScreen(name) {
  screen = name;
  $('#map').hidden = name !== 'map';
  $('#game').hidden = name !== 'game';
  if (name === 'game') { view.start(); layoutGame(); } else { view.stop(); }
}

// modal
let modalOpen = false, modalDismiss = null;
function openModal(html, { dismiss = null, focus = '.btn' } = {}) {
  const m = $('#modal');
  m.innerHTML = html; m.hidden = false; modalOpen = true; modalDismiss = dismiss;
  const f = m.querySelector(focus);
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
  return m;
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; modalOpen = false; modalDismiss = null; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && modalDismiss) modalDismiss(); });

// ------------------------------------------------------------------ map
function candyPlural(c) { return CANDIES[c].name.toLowerCase() + 's'; }
function goalList(lv) {
  const g = lv.goal, out = [];
  if (g.score) out.push({ kind: 'star', text: `Score ${fmt(g.score)} points` });
  if (g.jelly) out.push({ kind: 'jelly', text: 'Clear all the jelly' });
  if (g.ing) out.push({ kind: 'cherry', text: `Bring ${g.ing} cherr${g.ing > 1 ? 'ies' : 'y'} to the bottom` });
  if (g.collect) out.push({ kind: 'candy', c: g.collect[0], text: `Collect ${g.collect[1]} ${candyPlural(g.collect[0])}` });
  return out;
}
function tipsFor(lv) {
  const rows = lv.rows.join(''), tips = [];
  if (lv.n === 1) tips.push('Drag a candy onto its neighbour, or tap two neighbours, to line up 3 of a kind.');
  if (lv.n === 2) tips.push('Match 4 in a row to make a striped candy. Match 5 for a colour bomb.');
  if (/J|K/.test(rows) && lv.n < 14) tips.push('Double jelly needs two hits.');
  if (/[ckK]/.test(rows) && !/x/.test(rows) && lv.n < 16) tips.push('Caged candies cannot be swapped. Match them to break the cage.');
  if (/x/.test(rows) && lv.n < 24) tips.push('Chocolate spreads every move it is not cleared. Match next to it!');
  if (lv.goal.ing && lv.n < 12) tips.push('Cherries fall as you clear candies beneath them. Get them to the bottom row.');
  if (lv.n === 3) tips.push('Make an L or T shape for a wrapped candy that blasts twice.');
  return tips.slice(0, 2);
}
function refreshMapChips() {
  $('#m-stars').textContent = store.totalStars(prog);
  $('#m-hammers').textContent = prog.hammers;
  $('#m-shuffles').textContent = prog.shuffles;
}
function buildMap(scroll = true) {
  refreshMapChips();
  mapCtl = renderMap($('#mapscroll'), { levels: LEVELS, prog, onPick });
  if (scroll) mapCtl.scrollToCurrent(false);
}
function onPick(n, btn) {
  Sfx.unlock();
  if (!store.isUnlocked(prog, n)) {
    Sfx.play('bad'); btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
    toast(`Win level ${n - 1} to unlock level ${n}`);
    return;
  }
  Sfx.play('click');
  openIntro(n);
}
function openIntro(n) {
  const lv = LEVELS[n - 1];
  const stars = prog.stars[n] | 0;
  const tips = tipsFor(lv);
  const m = openModal(`
    <div class="card" role="dialog" aria-modal="true" aria-label="Level ${n}">
      <div class="sub">${WORLDS[Math.floor((n - 1) / 10)]}</div>
      <h2>Level ${n}</h2>
      <div class="starrow small">${[0, 1, 2].map(i => starSvg(i < stars ? 'on' : '')).join('')}</div>
      <div class="goalrows">${goalList(lv).map((g, i) => `<div class="goalrow"><canvas data-i="${i}"></canvas><span>${g.text}</span></div>`).join('')}
        <div class="goalrow"><canvas data-i="moves"></canvas><span>${lv.moves} moves</span></div></div>
      ${tips.length ? `<div class="tips">${tips.map(t => `<div>${t}</div>`).join('')}</div>` : ''}
      <p>${prog.best[n] ? `Best score ${fmt(prog.best[n])}` : `3 stars at ${fmt(lv.stars[2])}`}</p>
      <div class="stack"><button class="btn green big wide" data-act="play">Play</button><button class="btn ghost wide" data-act="close">Back to map</button></div>
    </div>`, { dismiss: closeModal, focus: '[data-act=play]' });
  const gl = goalList(lv);
  m.querySelectorAll('canvas').forEach(cv => {
    if (cv.dataset.i === 'moves') { drawIcon(cv, 'moves'); return; }
    const g = gl[+cv.dataset.i]; drawIcon(cv, g.kind, g.c || 0);
  });
  m.addEventListener('click', function h(e) {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    Sfx.unlock(); Sfx.play('click');
    if (a.dataset.act === 'play') { m.removeEventListener('click', h); startLevel(n); }
    else if (a.dataset.act === 'close') closeModal();
  });
}

// ------------------------------------------------------------------ level lifecycle
function newSeed() { return (Math.random() * 2147483647) | 0; }
function layoutGame() {
  const wrap = $('#boardwrap');
  const size = Math.min(wrap.clientWidth - 16, wrap.clientHeight - 8, 720);
  if (size < 100) return;
  view.resize(size);
  if (st) view.sync(st);
}
new ResizeObserver(() => { if (screen === 'game') layoutGame(); }).observe($('#boardwrap'));

function buildGoals() {
  const box = $('#g-goals');
  box.innerHTML = ''; chips = [];
  for (const g of goalList(level)) {
    const el = document.createElement('div');
    el.className = 'goal';
    el.innerHTML = '<canvas></canvas><span class="t"></span>';
    box.appendChild(el);
    drawIcon(el.querySelector('canvas'), g.kind, g.c || 0);
    chips.push({ el, t: el.querySelector('.t'), kind: g.kind });
  }
}
function buildBar() {
  const bar = $('#g-bar');
  bar.querySelectorAll('svg').forEach(s => s.remove());
  const max = level.stars[2] * 1.1;
  level.stars.forEach((v, i) => {
    const pos = i === 0 && !level.goal.score ? 0.06 : v / max;
    bar.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 24 24" style="left:${Math.min(97, pos * 100)}%" data-s="${i}"><path d="${STAR_PATH}"/></svg>`);
  });
}
function renderHud() {
  const g = level.goal;
  $('#g-moves').textContent = hud.moves;
  $('#g-movebox').classList.toggle('low', hud.moves <= 5 && hud.moves > 0);
  $('#g-score').textContent = fmt(hud.shown);
  const max = level.stars[2] * 1.1;
  $('#g-bar .fill').style.width = Math.min(100, hud.shown / max * 100) + '%';
  let k = 0;
  let jl = 0; for (let i = 0; i < N; i++) jl += view.jelly[i];
  const set = (c, text, ok) => { c.t.textContent = text; c.el.classList.toggle('done', ok); };
  if (g.score) set(chips[k++], `${fmt(Math.min(hud.score, g.score))} / ${fmt(g.score)}`, hud.score >= g.score);
  if (g.jelly) set(chips[k++], jl ? `${jl} left` : 'Done', jl === 0);
  if (g.ing) set(chips[k++], `${hud.delivered} / ${g.ing}`, hud.delivered >= g.ing);
  if (g.collect) set(chips[k++], `${Math.min(hud.collected, g.collect[1])} / ${g.collect[1]}`, hud.collected >= g.collect[1]);
  const allDone = chips.length > 0 && chips.every(c => c.el.classList.contains('done'));
  document.querySelectorAll('#g-bar svg').forEach((s, i) => {
    s.classList.toggle('on', i === 0 ? allDone : hud.shown >= level.stars[i]);
  });
  $('#c-hammer').textContent = prog.hammers; $('#c-shuffle').textContent = prog.shuffles;
  $('#t-hammer').classList.toggle('empty', prog.hammers <= 0);
  $('#t-shuffle').classList.toggle('empty', prog.shuffles <= 0);
  $('#t-hammer').classList.toggle('on', hammerMode);
}
view.hooks.frame = () => {
  if (hud.shown !== hud.score) {
    const d = hud.score - hud.shown;
    hud.shown = Math.abs(d) < 2 ? hud.score : hud.shown + d * 0.18 + Math.sign(d);
    if ((hud.shown - hud.score) * Math.sign(d) > 0) hud.shown = hud.score;
    $('#g-score').textContent = fmt(hud.shown);
    $('#g-bar .fill').style.width = Math.min(100, hud.shown / (level.stars[2] * 1.1) * 100) + '%';
    if (hud.shown === hud.score) renderHud();
  }
};
view.hooks.onSwap = () => { hud.moves = Math.max(0, hud.moves - 1); renderHud(); };
view.hooks.onClear = ev => { hud.score = ev.score; hud.collected = ev.collected; hud.delivered = ev.delivered; renderHud(); };
view.hooks.onScore = s => { hud.score = s; renderHud(); };
view.hooks.onBonus = ev => { bonusMode = true; hud.moves = ev.left; renderHud(); };
view.hooks.onBonusTick = (k, total) => { hud.moves = Math.max(0, hud.moves - 1); $('#g-moves').textContent = hud.moves; };

async function startLevel(n, retry = false) {
  const my = ++runId;
  level = LEVELS[n - 1];
  const seed = retry || playedOnce.has(n) ? newSeed() : level.seed;
  playedOnce.add(n);
  prog.played++; store.save(prog);
  st = newGame(level, seed, true);
  hud.moves = st.moves; hud.score = hud.shown = 0; hud.collected = 0; hud.delivered = 0;
  bonusMode = false; hammerMode = false; sel = -1; drag = null; paused = false;
  closeModal();
  $('#g-title').textContent = `Level ${n}`;
  $('#board').classList.remove('hammer');
  showScreen('game');
  buildGoals(); buildBar();
  view.setState(st);
  layoutGame();
  view.setState(st);
  renderHud();
  busy = true;
  await view.intro();
  if (my !== runId) return;
  view.sync(st);
  busy = false;
  scheduleHint();
}

function leaveToMap() {
  runId++; busy = false; bonusMode = false; hammerMode = false;
  view.tw.flush(); clearTimeout(hintTimer);
  closeModal(); showScreen('map');
  buildMap(false);
  if (mapCtl) mapCtl.scrollToCurrent(false);
}

// ------------------------------------------------------------------ playing
const canInput = () => screen === 'game' && !busy && !paused && !modalOpen && st && st.status === 'play';

async function runEvents(events, my) {
  busy = true;
  clearTimeout(hintTimer); view.clearHint();
  await view.play(events.slice());
  if (my !== runId) return false;
  view.sync(st);
  hud.score = st.score; hud.shown = Math.max(hud.shown, 0); hud.collected = st.collected; hud.delivered = st.delivered;
  hud.moves = st.moves;
  renderHud();
  return true;
}
async function afterTurn(my) {
  if (st.status === 'won') { await finish(true, my); }
  else if (st.status === 'lost') { await finish(false, my); }
  else { busy = false; scheduleHint(); }
}
async function attemptSwap(a, b) {
  if (!canInput()) return;
  const my = runId;
  sel = -1; view.sel = -1; view.cursor = kbSel ? view.cursor : -1;
  const res = playMove(st, a, b);
  if (!res.ok && !res.events.length) return;
  if (!(await runEvents(res.events, my))) return;
  if (res.ok) hud.moves = st.moves;
  await afterTurn(my);
}
async function applyHammer(i) {
  const my = runId;
  hammerMode = false; $('#board').classList.remove('hammer');
  const res = useHammer(st, i);
  if (!res.ok) { toast('Cherries cannot be smashed'); renderHud(); return; }
  prog.hammers--; store.save(prog);
  if (!(await runEvents(res.events, my))) return;
  await afterTurn(my);
}
async function doShuffle() {
  if (!canInput()) return;
  if (prog.shuffles <= 0) { toast('No shuffles left. Earn one by getting 3 stars on a level.'); Sfx.play('bad'); return; }
  const my = runId;
  prog.shuffles--; store.save(prog);
  const res = useShuffle(st);
  if (!(await runEvents(res.events, my))) return;
  await afterTurn(my);
}
function toggleHammer() {
  if (!canInput()) return;
  Sfx.unlock();
  if (prog.hammers <= 0) { toast('No hammers left. Every new star earns one.'); Sfx.play('bad'); return; }
  hammerMode = !hammerMode; sel = -1; view.sel = -1;
  $('#board').classList.toggle('hammer', hammerMode);
  Sfx.play('click');
  if (hammerMode) toast('Tap a candy to smash it', 2600);
  renderHud();
}

// hint after a few idle seconds
function scheduleHint() {
  clearTimeout(hintTimer);
  if (!st || st.status !== 'play') return;
  hintTimer = setTimeout(() => {
    if (!canInput() || hammerMode) { scheduleHint(); return; }
    const m = pickMove(st, 1, 5, 'oracle');
    if (m) view.setHint(m.a, m.b);
  }, params.get('hint') ? +params.get('hint') : 6000);
}

// ------------------------------------------------------------------ input
const cv = $('#board');
const adjacent = (a, b) => { const d = Math.abs(a - b); return d === W || (d === 1 && ((a / W) | 0) === ((b / W) | 0)); };
cv.addEventListener('pointerdown', e => {
  Sfx.unlock();
  if (busy && bonusMode) { view.boost = true; view.applySpeed(); return; }
  if (!canInput()) return;
  e.preventDefault();
  clearTimeout(hintTimer); view.clearHint(); scheduleHint();
  kbSel = false; view.cursor = -1;
  const { i } = view.cellAt(e.clientX, e.clientY);
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  if (hammerMode) { drag = { i, hammer: true }; return; }
  drag = { i, x: e.clientX, y: e.clientY, moved: false, wasSel: sel === i };
  if (i < 0) return;
  if (sel >= 0 && sel !== i && adjacent(sel, i)) { const a = sel; drag.moved = true; attemptSwap(a, i); return; }
  if (sel !== i) { sel = i; view.sel = i; Sfx.play('select'); }
});
cv.addEventListener('pointermove', e => {
  if (!drag || drag.hammer || drag.moved || drag.i < 0 || !canInput()) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y, th = view.cell * 0.32;
  if (Math.hypot(dx, dy) < th) return;
  const r = (drag.i / W) | 0, c = drag.i % W;
  let nr = r, nc = c;
  if (Math.abs(dx) > Math.abs(dy)) nc += dx > 0 ? 1 : -1; else nr += dy > 0 ? 1 : -1;
  drag.moved = true;
  if (nr < 0 || nr >= H || nc < 0 || nc >= W || !st.L.mask[nr * W + nc]) return;
  attemptSwap(drag.i, nr * W + nc);
});
cv.addEventListener('pointerup', e => {
  const d = drag; drag = null;
  if (!d) return;
  if (d.hammer) {
    const { i } = view.cellAt(e.clientX, e.clientY);
    if (i >= 0 && i === d.i && canInput()) applyHammer(i);
    return;
  }
  if (!d.moved && d.wasSel) { sel = -1; view.sel = -1; }
});
cv.addEventListener('pointercancel', () => { drag = null; });
cv.addEventListener('contextmenu', e => e.preventDefault());

// keyboard: arrows move a cursor, Enter/Space picks a candy, arrows then swap it
cv.addEventListener('keydown', e => {
  if (!canInput()) return;
  const dirs = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
  if (view.cursor < 0 && (dirs[e.key] || e.key === 'Enter' || e.key === ' ')) {
    view.cursor = st.L.cells[Math.floor(st.L.cells.length / 2)]; kbSel = true;
    if (dirs[e.key] || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!dirs[e.key]) return; }
  }
  kbSel = true;
  if (dirs[e.key]) {
    e.preventDefault();
    const [dr, dc] = dirs[e.key], r = ((view.cursor / W) | 0) + dr, c = (view.cursor % W) + dc;
    if (r < 0 || r >= H || c < 0 || c >= W || !st.L.mask[r * W + c]) return;
    const to = r * W + c;
    if (sel >= 0 && sel === view.cursor) { attemptSwap(sel, to); view.cursor = to; sel = -1; view.sel = -1; return; }
    view.cursor = to;
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (hammerMode) { applyHammer(view.cursor); return; }
    sel = sel === view.cursor ? -1 : view.cursor; view.sel = sel; Sfx.play('select');
  }
});
cv.addEventListener('blur', () => { view.cursor = -1; });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (modalOpen && modalDismiss) { modalDismiss(); return; }
    if (hammerMode) { toggleHammer(); return; }
    if (screen === 'game' && !modalOpen) openPause();
  } else if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) toggleSound();
});
document.addEventListener('pointerdown', () => Sfx.unlock(), { capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { Sfx.suspend(); if (screen === 'game' && !modalOpen && st && st.status === 'play' && !busy) openPause(); }
  else Sfx.resume();
});

// ------------------------------------------------------------------ pause / results
function openPause() {
  if (screen !== 'game' || modalOpen || !st || st.status !== 'play') return;
  paused = true; clearTimeout(hintTimer);
  const close = () => { paused = false; closeModal(); scheduleHint(); };
  const m = openModal(`
    <div class="card" role="dialog" aria-modal="true" aria-label="Paused">
      <div class="sub">Level ${level.n}</div><h2>Paused</h2>
      <div class="stack">
        <button class="btn green big wide" data-act="resume">Resume</button>
        <div class="row2"><button class="btn purple" data-act="restart">Restart</button><button class="btn purple" data-act="map">Map</button></div>
        <button class="btn ghost wide" data-act="sound">Sound: ${Sfx.muted ? 'off' : 'on'}</button>
      </div>
      <a class="modal-arcade" data-hub href="https://open-arcade.up.railway.app">&larr; Arcade</a>
    </div>`, { dismiss: close, focus: '[data-act=resume]' });
  if (window.OPEN_ARCADE_HUB) m.querySelector('[data-hub]').href = window.OPEN_ARCADE_HUB;
  m.addEventListener('click', function h(e) {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    Sfx.play('click');
    const act = a.dataset.act;
    if (act === 'resume') { m.removeEventListener('click', h); close(); }
    else if (act === 'restart') { m.removeEventListener('click', h); paused = false; startLevel(level.n, true); }
    else if (act === 'map') { m.removeEventListener('click', h); paused = false; leaveToMap(); }
    else if (act === 'sound') { toggleSound(); a.textContent = `Sound: ${Sfx.muted ? 'off' : 'on'}`; }
  });
}

const confetti = { canvas: $('#confetti'), pa: new Particles(260), on: false };
function launchConfetti() {
  const c = confetti.canvas, d = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * d; c.height = innerHeight * d;
  const cols = ['#ff4fa0', '#ffd23f', '#2fcf9b', '#5ab8ff', '#a37bff', '#ff8a3d'];
  const n = view.reduced ? 40 : 160;
  confetti.pa.reduced = false;
  for (let i = 0; i < n; i++) confetti.pa.add({
    x: Math.random() * innerWidth, y: -20 - Math.random() * 200, vx: (Math.random() - 0.5) * 220, vy: 80 + Math.random() * 260, g: 260,
    life: 2600 + Math.random() * 1400, age: 0, size: 5 + Math.random() * 5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14,
    color: cols[(Math.random() * cols.length) | 0], shape: Math.random() < 0.7 ? 'rect' : 'circle',
  });
  if (confetti.on) return;
  confetti.on = true;
  let last = performance.now();
  const ctx = c.getContext('2d');
  const loop = now => {
    const dt = Math.min(50, now - last); last = now;
    confetti.pa.update(dt);
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    confetti.pa.draw(ctx);
    if (confetti.pa.list.length) requestAnimationFrame(loop); else { confetti.on = false; ctx.clearRect(0, 0, c.width, c.height); }
  };
  requestAnimationFrame(loop);
}

async function finish(won, my) {
  clearTimeout(hintTimer);
  await view.tw.wait(won ? 450 : 350);
  if (my !== runId) return;
  bonusMode = false; view.boost = false; view.applySpeed();
  hammerMode = false; $('#board').classList.remove('hammer');
  const n = level.n;
  if (won) {
    const stars = starsFor(level, st);
    const rw = store.award(prog, n, stars, st.score);
    Sfx.play('win'); launchConfetti();
    const rewards = [rw.hammers ? `<span class="reward">+${rw.hammers} hammer${rw.hammers > 1 ? 's' : ''}</span>` : '', rw.shuffles ? '<span class="reward">+1 shuffle</span>' : ''].join('');
    const next = n < LEVEL_COUNT;
    const m = openModal(`
      <div class="card" role="dialog" aria-modal="true" aria-label="Level complete">
        <div class="sub">Level ${n}</div><h2>${['', 'Sweet!', 'Tasty!', 'Divine!'][stars]}</h2>
        <div class="starrow">${[0, 1, 2].map(() => starSvg('')).join('')}</div>
        <div class="bigscore">${fmt(st.score)}</div>
        ${rw.newBest && prog.stars[n] ? '<div class="newbest">New best</div>' : ''}
        <div>${rewards}</div>
        ${stars < 3 ? `<p>${stars === 1 ? '2' : '3'} stars at ${fmt(level.stars[stars])}. Specials and spare moves score big.</p>` : '<p>Perfect! Three stars.</p>'}
        <div class="stack">
          ${next ? '<button class="btn green big wide" data-act="next">Next level</button>' : '<p>You cleared every level!</p>'}
          <div class="row2"><button class="btn purple" data-act="replay">Replay</button><button class="btn purple" data-act="map">Map</button></div>
        </div>
      </div>`, { focus: '[data-act=next]' });
    m.querySelectorAll('.starrow svg').forEach((s, i) => {
      if (i < stars) setTimeout(() => { s.classList.add('on'); Sfx.play('star', i); }, 350 + i * 420);
    });
    m.addEventListener('click', function h(e) {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      m.removeEventListener('click', h);
      Sfx.play('click');
      if (a.dataset.act === 'next') { leaveToMap(); buildMap(false); openIntro(n + 1); if (mapCtl) mapCtl.scrollToCurrent(true); }
      else if (a.dataset.act === 'replay') startLevel(n, true);
      else leaveToMap();
    });
  } else {
    Sfx.play('lose');
    const g = level.goal, left = [];
    if (g.score && st.score < g.score) left.push(`${fmt(g.score - st.score)} more points`);
    if (g.jelly && jellyLeft(st) > 0) left.push(`${jellyLeft(st)} jelly layer${jellyLeft(st) > 1 ? 's' : ''}`);
    if (g.ing && st.delivered < g.ing) left.push(`${g.ing - st.delivered} cherr${g.ing - st.delivered > 1 ? 'ies' : 'y'}`);
    if (g.collect && st.collected < g.collect[1]) left.push(`${g.collect[1] - st.collected} more ${candyPlural(g.collect[0])}`);
    const m = openModal(`
      <div class="card" role="dialog" aria-modal="true" aria-label="Out of moves">
        <div class="sub">Level ${n}</div><h2>Out of moves</h2>
        <p>So close! Still to go: ${left.join(', ') || 'a little more'}.</p>
        <div class="bigscore">${fmt(st.score)}</div>
        <div class="stack">
          <button class="btn green big wide" data-act="retry">Try again</button>
          <button class="btn purple wide" data-act="map">Back to map</button>
        </div>
      </div>`, { focus: '[data-act=retry]' });
    m.addEventListener('click', function h(e) {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      m.removeEventListener('click', h);
      Sfx.play('click');
      if (a.dataset.act === 'retry') startLevel(n, true); else leaveToMap();
    });
  }
}

// ------------------------------------------------------------------ wiring
$('#g-pause').addEventListener('click', () => { Sfx.unlock(); Sfx.play('click'); openPause(); });
$('#g-sound').addEventListener('click', toggleSound);
$('#m-sound').addEventListener('click', toggleSound);
$('#t-hammer').addEventListener('click', toggleHammer);
$('#t-shuffle').addEventListener('click', () => { Sfx.unlock(); doShuffle(); });

let rz = 0;
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => { if (screen === 'map') { const y = $('#mapscroll').scrollTop; buildMap(false); $('#mapscroll').scrollTop = y; } }, 150);
});

syncSoundButtons();
buildMap(true);

if (params.get('debug')) {
  window.__candy = {
    get st() { return st; }, view,
    state: () => ({ screen, busy, paused, modalOpen, status: st && st.status, moves: st && st.moves, score: st && st.score, level: level && level.n, hudMoves: hud.moves }),
    setMoves(n) { st.moves = n; hud.moves = n; renderHud(); },
    cellCenter(i) { const r = view.cv.getBoundingClientRect(), c = view.cell * r.width / view.size; return [r.left + ((i % W) + 0.5) * c, r.top + (((i / W) | 0) + 0.5) * c, c]; },
    progress: prog,
  };
}
