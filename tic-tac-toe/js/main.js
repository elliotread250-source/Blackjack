import { result, botMove, other } from './logic.js';
import { sound } from './audio.js';

const $ = id => document.getElementById(id);
const boardEl = $('board'), statusEl = $('status'), strike = $('strike'), strikeLine = $('strike-line');
const store = {
  get(k, d) { try { const v = localStorage.getItem('ttt.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ttt.' + k, JSON.stringify(v)); } catch { /* storage blocked: play on */ } },
};

const settings = Object.assign({ mode: 'bot', level: 'medium', side: 'X', muted: false }, store.get('settings', {}));
let scores = store.get('scores', {});
let board, turn, starter = store.get('starter', 'X'), over = false, thinking = 0, cells = [];
sound.muted = settings.muted;

const X_SVG = '<svg viewBox="0 0 100 100" class="mx"><path d="M18 18 L82 82"/><path d="M82 18 L18 82"/></svg>';
const O_SVG = '<svg viewBox="0 0 100 100" class="mo"><circle cx="50" cy="50" r="34"/></svg>';
const scoreKey = () => (settings.mode === 'bot' ? `bot.${settings.level}.${settings.side}` : 'friend');
const curScores = () => scores[scoreKey()] || (scores[scoreKey()] = { X: 0, O: 0, D: 0 });
const isBot = p => settings.mode === 'bot' && p !== settings.side;
const nameOf = p => (settings.mode === 'bot' ? (p === settings.side ? 'You' : 'Computer') : (p === 'X' ? 'Player ✕' : 'Player ◯'));

for (let i = 0; i < 9; i++) {
  const c = document.createElement('button');
  c.className = 'cell'; c.dataset.i = i; c.setAttribute('role', 'gridcell');
  c.addEventListener('click', () => human(i));
  boardEl.append(c); cells.push(c);
}

function newRound(swap = true) {
  clearTimeout(thinking); thinking = 0;
  if (swap) { starter = other(starter); store.set('starter', starter); }
  board = Array(9).fill(''); turn = starter; over = false;
  boardEl.classList.remove('over'); strike.classList.remove('show');
  cells.forEach(c => { c.innerHTML = ''; c.classList.remove('won'); });
  render();
  if (isBot(turn)) botTurn();
}

function render() {
  cells.forEach((c, i) => {
    c.disabled = over || !!board[i] || isBot(turn) || !!thinking;
    c.setAttribute('aria-label', `Square ${i + 1}: ${board[i] || 'empty'}`);
    if (!board[i] && !over && !isBot(turn)) c.innerHTML = `<span class="ghost">${turn === 'X' ? X_SVG : O_SVG}</span>`;
    else if (!board[i]) c.innerHTML = '';
  });
  const s = curScores();
  $('score-x').textContent = s.X; $('score-o').textContent = s.O; $('score-d').textContent = s.D;
  $('name-x').textContent = nameOf('X'); $('name-o').textContent = nameOf('O');
  document.querySelector('.x-side').classList.toggle('turn', !over && turn === 'X');
  document.querySelector('.o-side').classList.toggle('turn', !over && turn === 'O');
  if (!over) {
    statusEl.classList.remove('win');
    statusEl.textContent = settings.mode === 'bot' ? (isBot(turn) ? 'Computer is thinking…' : 'Your move') : `${nameOf(turn)} to move`;
  }
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode)));
  document.querySelector('.bot-only').classList.toggle('hidden', settings.mode !== 'bot');
  $('level').value = settings.level; $('side').value = settings.side;
  $('mute').textContent = settings.muted ? '🔇' : '🔊';
}

function place(i) {
  if (over || board[i]) return;
  board[i] = turn;
  cells[i].innerHTML = turn === 'X' ? X_SVG : O_SVG;
  cells[i].firstElementChild.classList.add('draw-in');
  sound.place(turn);
  const r = result(board);
  if (r) return finish(r);
  turn = other(turn);
  render();
  if (isBot(turn)) botTurn();
}

function human(i) { if (!isBot(turn) && !thinking) place(i); }

function botTurn() {
  render();
  thinking = setTimeout(() => { thinking = 0; place(botMove(board, turn, settings.level)); }, 420 + Math.random() * 280);
  render();
}

function finish(r) {
  over = true;
  const s = curScores();
  if (r === 'draw') {
    s.D++; statusEl.textContent = "It's a draw!"; sound.draw();
    $('score-d').parentElement.classList.add('bump');
  } else {
    s[r.player]++;
    for (const i of r.line) cells[i].classList.add('won');
    const [a, , c] = r.line, at = i => [50 + (i % 3) * 100, 50 + Math.floor(i / 3) * 100];
    const [x1, y1] = at(a), [x2, y2] = at(c), dx = Math.sign(x2 - x1) * 30, dy = Math.sign(y2 - y1) * 30;
    Object.entries({ x1: x1 - dx, y1: y1 - dy, x2: x2 + dx, y2: y2 + dy }).forEach(([k, v]) => strikeLine.setAttribute(k, v));
    strike.classList.add('show');
    statusEl.classList.add('win');
    if (settings.mode === 'bot') {
      statusEl.textContent = isBot(r.player) ? 'The computer wins.' : 'You win! 🎉';
      isBot(r.player) ? sound.lose() : sound.win();
    } else { statusEl.textContent = `${nameOf(r.player)} wins! 🎉`; sound.win(); }
    document.querySelector(r.player === 'X' ? '.x-side' : '.o-side').classList.add('bump');
  }
  store.set('scores', scores);
  boardEl.classList.add('over');
  render();
  setTimeout(() => document.querySelectorAll('.bump').forEach(e => e.classList.remove('bump')), 600);
}

function save() { store.set('settings', settings); }
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => { settings.mode = b.dataset.mode; save(); sound.tap(); newRound(false); }));
$('level').addEventListener('change', e => { settings.level = e.target.value; save(); newRound(false); });
$('side').addEventListener('change', e => { settings.side = e.target.value; save(); newRound(false); });
$('next').addEventListener('click', () => { sound.tap(); newRound(true); });
$('reset').addEventListener('click', () => { scores[scoreKey()] = { X: 0, O: 0, D: 0 }; store.set('scores', scores); sound.tap(); render(); });
$('mute').addEventListener('click', () => { settings.muted = sound.muted = !settings.muted; save(); render(); });
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.tagName === 'SELECT') return;
  if (/^[1-9]$/.test(e.key)) { human(+e.key - 1); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'n') && over) { newRound(true); e.preventDefault(); }
});

newRound(false);
window.__ttt = { get board() { return board.slice(); }, get turn() { return turn; }, get over() { return over; }, place: human, newRound, settings };
