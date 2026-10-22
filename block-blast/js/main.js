import { SIZE, SHAPES, emptyBoard, dims, canPlace, place, fullLines, newTray, gameOver, fits } from './logic.js';

const $ = id => document.getElementById(id);
const boardEl = $('board'), trayEl = $('tray'), dragEl = $('drag'), popEl = $('pop');
const store = {
  get(k, d) { try { const v = localStorage.getItem('blockblast.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('blockblast.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};

// ---------------------------------------------------------------- sound
let actx = null, muted = store.get('muted', false);
function tone(f, at, dur, type = 'sine', vol = 0.4, slide = 1) {
  if (muted) return;
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { actx = new AC(); } catch { return; } }
  if (actx.state === 'suspended') actx.resume();
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  pick: () => tone(600, 0, 0.06, 'triangle', 0.3),
  drop: () => { tone(180, 0, 0.12, 'triangle', 0.7, 0.6); tone(90, 0, 0.1, 'sine', 0.6); },
  clear: (lines, combo) => { const base = 523 * Math.pow(1.06, Math.min(combo, 12)); for (let i = 0; i < 2 + lines; i++) tone(base * [1, 1.25, 1.5, 2, 2.5, 3][i % 6], i * 0.06, 0.25, 'triangle', 0.35); },
  bad: () => tone(160, 0, 0.12, 'square', 0.15),
  over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.3, 'sawtooth', 0.15)),
};

// ---------------------------------------------------------------- state
let board, tray, score, combo, sinceClear, best = store.get('best', 0), over = false, busy = 0;
function fresh() { board = emptyBoard(); tray = newTray(board); score = 0; combo = 0; sinceClear = 0; over = false; }
const saved = store.get('game', null);
if (saved && saved.board?.length === SIZE * SIZE && Array.isArray(saved.tray)) ({ board, tray, score, combo, sinceClear } = Object.assign({ combo: 0, sinceClear: 0 }, saved));
else fresh();
const save = () => store.set('game', over ? null : { board, tray, score, combo, sinceClear });

// ---------------------------------------------------------------- board
const cells = [];
for (let i = 0; i < SIZE * SIZE; i++) { const d = document.createElement('div'); d.className = 'cell'; boardEl.append(d); cells.push(d); }
function paintBoard() {
  cells.forEach((d, i) => {
    d.classList.remove('ghost', 'will-clear');
    if (d.classList.contains('blast')) return;
    if (board[i]) d.dataset.c = board[i]; else delete d.dataset.c;
  });
}

function pieceHTML(p, cls = 'blk') {
  const shape = SHAPES[p.shape], [h, w] = dims(shape), on = new Set(shape.map(([r, c]) => r * 10 + c));
  let html = '';
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) html += on.has(r * 10 + c) ? `<div class="${cls}" data-c="${p.color}"></div>` : '<div class="sp"></div>';
  return { html, w };
}
function paintTray(enter = false) {
  trayEl.innerHTML = '';
  tray.forEach((p, i) => {
    const slot = document.createElement('div'); slot.className = 'slot' + (enter ? ' enter' : ''); slot.dataset.i = i;
    if (enter) slot.style.animationDelay = (i * 0.06) + 's';
    if (p) {
      const { html, w } = pieceHTML(p);
      slot.innerHTML = `<div class="piece" style="grid-template-columns:repeat(${w},auto)">${html}</div>`;
      if (!fits(board, SHAPES[p.shape])) slot.classList.add('dead');
      slot.addEventListener('pointerdown', e => startDrag(e, i, slot));
      if (enter) slot.querySelector('.piece').style.animationDelay = (i * 0.07) + 's';
    }
    trayEl.append(slot);
  });
}
function paintScore(bump = false) {
  $('score').textContent = score.toLocaleString(); $('best').textContent = Math.max(best, score).toLocaleString();
  if (bump) { $('score').classList.add('bump'); setTimeout(() => $('score').classList.remove('bump'), 150); }
  $('mute').textContent = muted ? '🔇' : '🔊';
}

// ---------------------------------------------------------------- dragging
let drag = null;
const metrics = () => {
  const r = boardEl.getBoundingClientRect(), cs = getComputedStyle(boardEl), pad = parseFloat(cs.paddingLeft), gap = parseFloat(cs.columnGap) || 3;
  const cell = (r.width - pad * 2 - gap * (SIZE - 1)) / SIZE;
  return { x: r.left + pad, y: r.top + pad, cell, step: cell + gap };
};
function startDrag(e, i, slot) {
  if (over || busy || !tray[i] || drag) return;
  e.preventDefault();
  const p = tray[i], shape = SHAPES[p.shape], [h, w] = dims(shape), m = metrics();
  const { html } = pieceHTML(p);
  dragEl.innerHTML = html; dragEl.style.gridTemplateColumns = `repeat(${w}, ${m.cell}px)`; dragEl.style.gap = (m.step - m.cell) + 'px';
  dragEl.querySelectorAll('.blk,.sp').forEach(b => { b.style.width = b.style.height = m.cell + 'px'; });
  dragEl.classList.add('on'); dragEl.hidden = false;
  // Keep the piece above a finger so it can be seen; with a mouse, hold it by its centre.
  const lift = e.pointerType === 'mouse' ? 0 : m.cell * 1.6 + h * m.step / 2;
  drag = { i, slot, p, shape, w, h, m, lift, id: e.pointerId, r: -1, c: -1 };
  slot.classList.add('dragging');
  try { slot.setPointerCapture(e.pointerId); } catch { /* fine */ }
  slot.addEventListener('pointermove', moveDrag); slot.addEventListener('pointerup', endDrag); slot.addEventListener('pointercancel', endDrag);
  sfx.pick();
  moveDrag(e);
}
function moveDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const { m, w, h, lift } = drag;
  const left = e.clientX - (w * m.step) / 2 + (m.step - m.cell) / 2, top = e.clientY - (h * m.step) / 2 - lift;
  dragEl.style.transform = `translate(${left}px, ${top}px)`;
  const c = Math.round((left - m.x) / m.step), r = Math.round((top - m.y) / m.step);
  if (r === drag.r && c === drag.c) return;
  drag.r = r; drag.c = c;
  preview();
}
function preview() {
  paintBoard();
  const { shape, p, r, c } = drag;
  if (!canPlace(board, shape, r, c)) { drag.ok = false; return; }
  drag.ok = true;
  const b = board.slice();
  for (const [dr, dc] of shape) { const k = (r + dr) * SIZE + c + dc; b[k] = p.color; cells[k].classList.add('ghost'); cells[k].dataset.c = p.color; }
  const { rows, cols } = fullLines(b);
  for (const i of rows) for (let j = 0; j < SIZE; j++) { const k = i * SIZE + j; cells[k].classList.add('will-clear'); cells[k].dataset.c = p.color; }
  for (const i of cols) for (let j = 0; j < SIZE; j++) { const k = j * SIZE + i; cells[k].classList.add('will-clear'); cells[k].dataset.c = p.color; }
}
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag; drag = null;
  d.slot.removeEventListener('pointermove', moveDrag); d.slot.removeEventListener('pointerup', endDrag); d.slot.removeEventListener('pointercancel', endDrag);
  dragEl.hidden = true; dragEl.classList.remove('on'); d.slot.classList.remove('dragging');
  paintBoard();
  if (e.type === 'pointerup' && d.ok) commit(d.i, d.r, d.c);
  else if (d.r > -3 && d.r < SIZE + 2 && d.c > -3 && d.c < SIZE + 2) sfx.bad();
}

// ---------------------------------------------------------------- moves
function commit(i, r, c) {
  const p = tray[i], res = place(board, SHAPES[p.shape], r, c, p.color, combo);
  if (!res) return;
  // paint the placed piece first, then blast the full lines
  const placedBoard = board.slice();
  for (const [dr, dc] of SHAPES[p.shape]) { const k = (r + dr) * SIZE + c + dc; placedBoard[k] = p.color; cells[k].dataset.c = p.color; cells[k].classList.remove('placed'); void cells[k].offsetWidth; cells[k].classList.add('placed'); }
  board = res.board; tray[i] = null;
  if (res.lines) { combo = res.combo; sinceClear = 0; } else if (++sinceClear >= 3) combo = 0;
  score += res.points;
  sfx.drop();
  if (res.lines) {
    busy++;
    for (const k of res.cleared) { cells[k].dataset.c = placedBoard[k]; cells[k].classList.add('blast'); }
    setTimeout(() => { for (const k of res.cleared) cells[k].classList.remove('blast'); busy--; paintBoard(); }, 380);
    setTimeout(() => sfx.clear(res.lines, combo), 60);
    pop(`+${res.points}`, 'pts');
    if (res.allClear) setTimeout(() => pop('All clear! +300', 'great'), 250);
    else if (combo >= 2) setTimeout(() => pop(`Combo ×${combo}`, 'combo'), 250);
    else if (res.lines >= 2) setTimeout(() => pop(['', '', 'Great!', 'Amazing!', 'Incredible!'][Math.min(res.lines, 4)] || 'Unreal!', 'great'), 250);
  }
  if (tray.every(x => !x)) { tray = newTray(board); paintTray(true); } else paintTray();
  if (score > best) { best = score; store.set('best', best); }
  paintScore(true);
  if (gameOver(board, tray)) { over = true; setTimeout(showOver, 700); }
  save();
}
function pop(text, cls) {
  const d = document.createElement('div'); d.className = cls; d.textContent = text;
  popEl.append(d); setTimeout(() => d.remove(), 1100);
}
let bestAtStart = best;
function showOver() {
  sfx.over();
  $('final').textContent = score.toLocaleString();
  $('newbest').hidden = !(score > 0 && score >= best && score > bestAtStart);
  $('over').hidden = false;
  save();
}
function restart() {
  fresh(); bestAtStart = best; $('over').hidden = true;
  cells.forEach(d => d.classList.remove('blast', 'placed'));
  paintBoard(); paintTray(true); paintScore(); save();
}
$('again').addEventListener('click', restart);
$('restart').addEventListener('click', () => { if (over || score === 0 || confirm('Start a new game? This one will be lost.')) restart(); });
$('mute').addEventListener('click', () => { muted = !muted; store.set('muted', muted); paintScore(); });
addEventListener('resize', () => { if (!drag) paintBoard(); });

paintBoard(); paintTray(true); paintScore();
if (gameOver(board, tray)) { over = true; showOver(); }
window.__bb = {
  get board() { return board.slice(); }, get tray() { return tray.slice(); }, get score() { return score; }, get over() { return over; },
  play: (i, r, c) => { if (tray[i] && canPlace(board, SHAPES[tray[i].shape], r, c)) { commit(i, r, c); return true; } return false; },
  restart,
};
