import { result, botMove, other } from './logic.js';
import { sound } from './audio.js';
import { TurnClient, roomFromUrl, shareLink, clearRoomParam } from './arcade-net.js';

const $ = id => document.getElementById(id);
const boardEl = $('board'), statusEl = $('status'), strike = $('strike'), strikeLine = $('strike-line');
const store = {
  get(k, d) { try { const v = localStorage.getItem('ttt.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('ttt.' + k, JSON.stringify(v)); } catch { /* storage blocked: play on */ } },
};

const settings = Object.assign({ mode: 'bot', level: 'medium', side: 'X', muted: false, name: '' }, store.get('settings', {}));
// online play: the server keeps the board and checks every move (shared turnrooms)
const net = new TurnClient('ttt');
const online = { x: -1, names: ['', ''], score: [0, 0], draws: 0, awaiting: false, away: false, info: '', infoCls: '' };
const isOnline = () => settings.mode === 'online';
const myMark = () => (net.side >= 0 && online.x >= 0 ? (net.side === online.x ? 'X' : 'O') : null);
const sideOf = mark => (mark === 'X' ? online.x : 1 - online.x);
let scores = store.get('scores', {});
let board, turn, starter = store.get('starter', 'X'), over = false, thinking = 0, cells = [];
sound.muted = settings.muted;

const X_SVG = '<svg viewBox="0 0 100 100" class="mx"><path d="M18 18 L82 82"/><path d="M82 18 L18 82"/></svg>';
const O_SVG = '<svg viewBox="0 0 100 100" class="mo"><circle cx="50" cy="50" r="34"/></svg>';
const scoreKey = () => (settings.mode === 'bot' ? `bot.${settings.level}.${settings.side}` : 'friend');
const curScores = () => scores[scoreKey()] || (scores[scoreKey()] = { X: 0, O: 0, D: 0 });
const isBot = p => settings.mode === 'bot' && p !== settings.side;
const blocked = () => isOnline() && (net.status !== 'playing' || online.awaiting || turn !== myMark());
const nameOf = p => {
  if (isOnline() && myMark()) return p === myMark() ? `${online.names[net.side] || 'You'} (you)` : online.names[1 - net.side] || 'Opponent';
  return settings.mode === 'bot' ? (p === settings.side ? 'You' : 'Computer') : (p === 'X' ? 'Player ✕' : 'Player ◯');
};

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
    c.disabled = over || !!board[i] || isBot(turn) || !!thinking || blocked();
    c.setAttribute('aria-label', `Square ${i + 1}: ${board[i] || 'empty'}`);
    if (!board[i] && !over && !isBot(turn) && !blocked()) c.innerHTML = `<span class="ghost">${turn === 'X' ? X_SVG : O_SVG}</span>`;
    else if (!board[i]) c.innerHTML = '';
  });
  const s = isOnline() ? { X: online.x >= 0 ? online.score[online.x] : 0, O: online.x >= 0 ? online.score[1 - online.x] : 0, D: online.draws } : curScores();
  $('score-x').textContent = s.X; $('score-o').textContent = s.O; $('score-d').textContent = s.D;
  $('name-x').textContent = nameOf('X'); $('name-o').textContent = nameOf('O');
  document.querySelector('.x-side').classList.toggle('turn', !over && turn === 'X');
  document.querySelector('.o-side').classList.toggle('turn', !over && turn === 'O');
  if (!over) {
    statusEl.classList.remove('win');
    statusEl.textContent = settings.mode === 'bot' ? (isBot(turn) ? 'Computer is thinking…' : 'Your move') : `${nameOf(turn)} to move`;
    if (isOnline()) statusEl.textContent = ({ idle: 'Play online', error: 'Play online', connecting: 'Connecting…', waiting: 'Waiting for your friend to join', queued: 'Finding an opponent…', reconnecting: 'Reconnecting…' })[net.status]
      || (online.away ? `${online.names[1 - net.side]} lost connection — holding their seat…` : turn === myMark() ? 'Your move' : `${online.names[1 - net.side] || 'Opponent'} to move`);
  }
  renderOnline();
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

function human(i) {
  if (isOnline()) { if (!blocked() && !over && !board[i]) { online.awaiting = true; net.move({ cell: i }); render(); } return; }
  if (!isBot(turn) && !thinking) place(i);
}

function botTurn() {
  render();
  thinking = setTimeout(() => { thinking = 0; place(botMove(board, turn, settings.level)); }, 420 + Math.random() * 280);
  render();
}

function finish(r) {
  over = true;
  const s = isOnline() ? { X: 0, O: 0, D: 0 } : curScores();
  if (r === 'draw') {
    s.D++; if (isOnline()) online.draws++; statusEl.textContent = "It's a draw!"; sound.draw();
    $('score-d').parentElement.classList.add('bump');
  } else {
    if (!isOnline()) s[r.player]++;
    for (const i of r.line) cells[i].classList.add('won');
    const [a, , c] = r.line, at = i => [50 + (i % 3) * 100, 50 + Math.floor(i / 3) * 100];
    const [x1, y1] = at(a), [x2, y2] = at(c), dx = Math.sign(x2 - x1) * 30, dy = Math.sign(y2 - y1) * 30;
    Object.entries({ x1: x1 - dx, y1: y1 - dy, x2: x2 + dx, y2: y2 + dy }).forEach(([k, v]) => strikeLine.setAttribute(k, v));
    strike.classList.add('show');
    statusEl.classList.add('win');
    if (isOnline()) {
      const mine = r.player === myMark();
      statusEl.textContent = mine ? 'You win! 🎉' : `${online.names[1 - net.side] || 'Your opponent'} wins.`;
      mine ? sound.win() : sound.lose();
    } else if (settings.mode === 'bot') {
      statusEl.textContent = isBot(r.player) ? 'The computer wins.' : 'You win! 🎉';
      isBot(r.player) ? sound.lose() : sound.win();
    } else { statusEl.textContent = `${nameOf(r.player)} wins! 🎉`; sound.win(); }
    document.querySelector(r.player === 'X' ? '.x-side' : '.o-side').classList.add('bump');
  }
  if (!isOnline()) store.set('scores', scores);
  boardEl.classList.add('over');
  render();
  setTimeout(() => document.querySelectorAll('.bump').forEach(e => e.classList.remove('bump')), 600);
}

function save() { store.set('settings', settings); }
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.mode === settings.mode) return;
  if (isOnline()) net.close();
  settings.mode = b.dataset.mode; save(); sound.tap();
  if (isOnline()) { clearBoard(); render(); } else newRound(false);
}));
$('level').addEventListener('change', e => { settings.level = e.target.value; save(); newRound(false); });
$('side').addEventListener('change', e => { settings.side = e.target.value; save(); newRound(false); });
$('next').addEventListener('click', () => { sound.tap(); newRound(true); });
$('reset').addEventListener('click', () => { scores[scoreKey()] = { X: 0, O: 0, D: 0 }; store.set('scores', scores); sound.tap(); render(); });
$('mute').addEventListener('click', () => { settings.muted = sound.muted = !settings.muted; save(); render(); });
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.target.tagName === 'SELECT') return;
  if (/^[1-9]$/.test(e.key)) { human(+e.key - 1); e.preventDefault(); }
  else if ((e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'n') && over && !isOnline()) { newRound(true); e.preventDefault(); }
});

// ---------------------------------------------------------------- online panel
function clearBoard() {
  clearTimeout(thinking); thinking = 0;
  board = Array(9).fill(''); turn = 'X'; over = false; online.awaiting = false;
  boardEl.classList.remove('over'); strike.classList.remove('show');
  cells.forEach(c => { c.innerHTML = ''; c.classList.remove('won'); });
}
function info(msg, cls = '') { online.info = msg; online.infoCls = cls; renderOnline(); }
function renderOnline() {
  const on = isOnline(), st = net.status;
  $('online').classList.toggle('hidden', !on);
  $('local-row').classList.toggle('hidden', on);
  if (!on) return;
  $('ol-lobby').classList.toggle('hidden', !(st === 'idle' || st === 'error' || st === 'connecting'));
  $('ol-wait').classList.toggle('hidden', !(st === 'waiting' || st === 'queued'));
  $('ol-game').classList.toggle('hidden', !(st === 'playing' || st === 'ended' || st === 'reconnecting'));
  $('ol-wait-label').textContent = st === 'queued' ? 'Looking for someone to play…' : 'Room code — send it to a friend';
  $('ol-code-show').textContent = st === 'waiting' ? net.code : '…';
  $('ol-copy').classList.toggle('hidden', st !== 'waiting');
  $('ol-rematch').classList.toggle('hidden', st !== 'ended');
  $('ol-create').disabled = $('ol-quick').disabled = st === 'connecting';
  $('ol-info').textContent = online.info; $('ol-info').className = 'ol-info ' + online.infoCls;
  if (document.activeElement !== $('ol-name')) $('ol-name').value = settings.name || '';
}
const myName = () => { settings.name = ($('ol-name').value || '').trim().slice(0, 14); save(); return settings.name || 'Player'; };
$('ol-create').addEventListener('click', () => { const n = myName(); clearBoard(); info(''); net.create(n); render(); });
$('ol-quick').addEventListener('click', () => { const n = myName(); clearBoard(); info(''); net.quick(n); render(); });
$('ol-join').addEventListener('submit', e => { e.preventDefault(); const c = $('ol-code').value.trim(); if (c.length !== 4) { info('Room codes have 4 letters.', 'err'); return; } const n = myName(); clearBoard(); info(''); net.join(c, n); render(); });
$('ol-cancel').addEventListener('click', () => { net.close(); info(''); render(); });
$('ol-leave').addEventListener('click', () => { net.close(); clearBoard(); online.score = [0, 0]; online.draws = 0; info('You left the game.'); render(); });
$('ol-copy').addEventListener('click', async () => { const link = shareLink(net.code); try { if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Tic Tac Toe', text: 'Play Tic Tac Toe with me', url: link }); else { await navigator.clipboard.writeText(link); info('Invite link copied.'); } } catch { info(link); } });
$('ol-rematch').addEventListener('click', () => { net.rematch(); info('Rematch requested — waiting for your opponent.'); });
net.on('status', () => render());
net.on('start', snap => {
  clearBoard(); clearRoomParam();
  online.x = snap.x; online.names = snap.names; online.score = snap.score; online.away = !!snap.away;
  snap.board.forEach((m, i) => { board[i] = m; if (m) cells[i].innerHTML = m === 'X' ? X_SVG : O_SVG; });
  turn = snap.turn === online.x ? 'X' : 'O';
  if (snap.over) { over = true; boardEl.classList.add('over'); }
  info(snap.n ? 'Back in your game.' : `You are ${myMark() === 'X' ? '✕ — you go first' : '◯'}.`);
  sound.tap(); render();
});
net.on('move', ev => {
  online.awaiting = false; online.score = ev.score;
  if (typeof ev.cell === 'number' && !board[ev.cell]) {
    board[ev.cell] = ev.mark;
    cells[ev.cell].innerHTML = ev.mark === 'X' ? X_SVG : O_SVG;
    cells[ev.cell].firstElementChild.classList.add('draw-in');
    sound.place(ev.mark);
  }
  turn = ev.next >= 0 ? (ev.next === online.x ? 'X' : 'O') : turn;
  if (ev.over) { finish(result(board) || 'draw'); info(`Score: you ${ev.score[net.side]} – ${ev.score[1 - net.side]} ${online.names[1 - net.side] || 'opponent'}`); }
  render();
});
net.on('reject', r => { online.awaiting = false; info(`The server refused that move (${r.why}).`, 'warn'); render(); });
net.on('away', () => { online.away = true; info(`${online.names[1 - net.side] || 'Your opponent'} lost connection. Their seat is held for a short while.`, 'warn'); render(); });
net.on('back', () => { online.away = false; info(`${online.names[1 - net.side] || 'Your opponent'} is back.`); render(); });
net.on('left', () => { info(`${online.names[1 - net.side] || 'Your opponent'} left the game.`, 'warn'); render(); });
net.on('rematch_req', () => info('Your opponent wants a rematch — press Rematch to play again.'));
net.on('expired', () => { clearBoard(); info('That game has ended (the server no longer has it).', 'warn'); render(); });
net.on('error', msg => { info(msg, 'err'); render(); });

const linkRoom = roomFromUrl();
if (linkRoom) { settings.mode = 'online'; save(); }
if (isOnline()) {
  clearBoard(); render();
  if (linkRoom) net.join(linkRoom, settings.name || 'Player'); else net.resume();
} else newRound(false);
window.__ttt = { get board() { return board.slice(); }, get turn() { return turn; }, get over() { return over; }, place: human, newRound, settings, net, online };
