import { Position, START, colorOf, sqName, sqIndex } from './chess.js';
import { TurnClient, roomFromUrl, shareLink, clearRoomParam } from './arcade-net.js';

const $ = id => document.getElementById(id);
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const glyph = p => GLYPH[p.toLowerCase()] + '︎';
const store = {
  get(k, d) { try { const v = localStorage.getItem('chess.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('chess.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const settings = Object.assign({ mode: 'bot', level: 'medium', side: 'w', flipped: false, muted: false, name: '' }, store.get('settings', {}));
// ---------------------------------------------------------------- online play (server-validated)
const net = new TurnClient('chess');
const online = { white: -1, names: ['', ''], awaiting: false, drawReq: false, endText: '', info: '', infoCls: '', away: false };
const isOnline = () => settings.mode === 'online';
const myColor = () => (isOnline() && net.side >= 0 && online.white >= 0 ? (net.side === online.white ? 'w' : 'b') : null);

// ---------------------------------------------------------------- sound
let actx = null;
function tone(f, at, dur, type = 'triangle', vol = 0.3) {
  if (settings.muted) return;
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { actx = new AC(); } catch { return; } }
  if (actx.state === 'suspended') actx.resume();
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  move: () => { tone(220, 0, 0.07, 'square', 0.12); tone(140, 0.01, 0.08, 'sine', 0.3); },
  capture: () => { tone(330, 0, 0.06, 'square', 0.15); tone(110, 0.02, 0.12, 'sine', 0.4); },
  check: () => { tone(660, 0, 0.12, 'triangle', 0.25); tone(880, 0.08, 0.14, 'triangle', 0.2); },
  end: win => (win ? [523, 659, 784, 1047] : [440, 349, 294]).forEach((f, i) => tone(f, i * 0.12, 0.25, 'triangle', 0.25)),
};

// ---------------------------------------------------------------- game state
let pos = new Position(), sans = [], uci = [], selected = -1, thinking = 0, reqId = 0, dragging = null;
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
const toUci = m => sqName(m.from) + sqName(m.to) + (m.promo ? m.promo.toLowerCase() : '');
function load() {
  const saved = store.get('game', null);
  pos = new Position(); sans = []; uci = [];
  if (saved && Array.isArray(saved.uci)) for (const u of saved.uci) { const m = findMove(u); if (!m) break; play(m, true); }
}
function findMove(u) { return pos.moves().find(m => toUci(m) === u); }
const save = () => store.set('game', { uci });
const human = () => settings.mode === 'friend' || (isOnline() ? net.status === 'playing' && !online.awaiting && pos.turn === myColor() : pos.turn === settings.side);

function play(m, quiet = false) {
  sans.push(pos.san(m)); uci.push(toUci(m));
  pos.make(m);
  selected = -1;
  if (!quiet) {
    const o = pos.outcome();
    if (o) sfx.end(settings.mode === 'friend' || (o.result === '1-0') === ((isOnline() ? myColor() : settings.side) === 'w'));
    else if (pos.inCheck()) sfx.check();
    else if (m.captured) sfx.capture(); else sfx.move();
    if (!isOnline()) save();
  }
}

function botTurn() {
  if (settings.mode !== 'bot' || pos.outcome() || pos.turn === settings.side) return;
  thinking = ++reqId;
  worker.postMessage({ id: thinking, fen: pos.fen(), level: settings.level });
  render();
}
worker.onmessage = e => {
  if (e.data.id !== thinking) return;   // stale: the game moved on (undo or new game)
  thinking = 0;
  const m = e.data.move && pos.moves().find(x => x.from === e.data.move.from && x.to === e.data.move.to && (x.promo || '') === (e.data.move.promo || ''));
  if (m) play(m);
  render();
};

// ---------------------------------------------------------------- board
const boardEl = $('board'), squares = [];
for (let v = 0; v < 64; v++) {
  const b = document.createElement('button');
  b.className = 'sq'; b.dataset.v = v;
  boardEl.append(b); squares.push(b);
}
const realSq = v => (settings.flipped ? 63 - v : v);
const viewSq = s => (settings.flipped ? 63 - s : s);

function render() {
  const legal = selected >= 0 ? pos.moves().filter(m => m.from === selected) : [];
  const last = pos.history.length ? pos.history[pos.history.length - 1].m : null;
  const checkSq = pos.inCheck() ? pos.kingSq(pos.turn) : -1;
  for (let v = 0; v < 64; v++) {
    const s = realSq(v), p = pos.board[s], el = squares[v], r = s >> 3, f = s & 7;
    el.className = 'sq' + ((r + f) % 2 ? ' dk' : '');
    if (last && (s === last.from || s === last.to)) el.classList.add('last');
    if (s === selected) el.classList.add('sel');
    if (s === checkSq) el.classList.add('check');
    const target = legal.find(m => m.to === s);
    if (target) el.classList.add(p || target.flag === 'ep' ? 'cap' : 'dot');
    if (dragging && dragging.from === s) el.classList.add('lift');
    let html = p ? `<span class="pc ${colorOf(p)}">${glyph(p)}</span>` : '';
    if ((v & 7) === 7) html += `<span class="coord r">${8 - r}</span>`;
    if (v >> 3 === 7) html += `<span class="coord f">${'abcdefgh'[f]}</span>`;
    el.innerHTML = html;
    el.setAttribute('aria-label', sqName(s) + (p ? ' ' + (colorOf(p) === 'w' ? 'white ' : 'black ') + { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' }[p.toLowerCase()] : ''));
  }
  // status
  const o = pos.outcome(), st = $('status');
  st.classList.toggle('over', !!o); st.classList.toggle('thinking', !!thinking);
  const who = c => (settings.mode === 'bot' ? (c === settings.side ? 'You' : 'Computer') : c === 'w' ? 'White' : 'Black');
  if (isOnline()) {
    const me = myColor();
    st.classList.toggle('over', !!(o || online.endText));
    if (net.status === 'idle' || net.status === 'error') st.textContent = 'Play online';
    else if (net.status === 'connecting') st.textContent = 'Connecting…';
    else if (net.status === 'waiting') st.textContent = 'Waiting for your friend to join';
    else if (net.status === 'queued') st.textContent = 'Finding an opponent…';
    else if (net.status === 'reconnecting') st.textContent = 'Reconnecting…';
    else if (online.endText) st.textContent = online.endText;
    else if (o) { const w = o.result === '1-0' ? 'w' : o.result === '0-1' ? 'b' : null; st.textContent = w ? (o.reason === 'checkmate' ? 'Checkmate! ' : '') + (w === me ? 'You win! 🎉' : `${online.names[1 - net.side] || 'Your opponent'} wins.`) : `Draw by ${o.reason}.`; }
    else if (online.away) st.textContent = `${online.names[1 - net.side]} lost connection — holding their seat…`;
    else st.textContent = pos.turn === me ? `Your move${pos.inCheck() ? ' — check!' : ''}` : `${online.names[1 - net.side] || 'Opponent'} is thinking${pos.inCheck() ? ' — check!' : ''}`;
  } else if (o) {
    const winner = o.result === '1-0' ? 'w' : o.result === '0-1' ? 'b' : null;
    st.textContent = winner ? (o.reason === 'checkmate' ? 'Checkmate! ' : '') + (settings.mode === 'bot' ? (winner === settings.side ? 'You win! 🎉' : 'The computer wins.') : `${winner === 'w' ? 'White' : 'Black'} wins! 🎉`) : `Draw by ${o.reason}.`;
  } else if (thinking) st.textContent = 'Computer is thinking';
  else st.textContent = `${who(pos.turn)}${settings.mode === 'bot' && pos.turn === settings.side ? '' : pos.turn === 'w' ? ' (White)' : ' (Black)'} to move${pos.inCheck() ? ' — check!' : ''}`;
  // players, captures and material
  const bottom = settings.flipped ? 'b' : 'w', top = bottom === 'w' ? 'b' : 'w';
  const label = c => {
    if (isOnline() && myColor()) return c === myColor() ? `${online.names[net.side] || 'You'} (you)` : online.names[1 - net.side] || 'Opponent';
    return settings.mode === 'bot' ? (c === settings.side ? 'You' : 'Computer') : c === 'w' ? 'White' : 'Black';
  };
  $('name-bottom').textContent = label(bottom); $('name-top').textContent = label(top);
  if (isOnline() && net.rtt != null && myColor()) $(bottom === myColor() ? 'name-bottom' : 'name-top').insertAdjacentHTML('beforeend', `<span class="rtt">${net.rtt} ms</span>`);
  const full = { p: 8, n: 2, b: 2, r: 2, q: 1 }, worth = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const lost = c => Object.entries(full).flatMap(([k, n]) => Array(Math.max(0, n - pos.board.filter(p => p === (c === 'w' ? k.toUpperCase() : k)).length)).fill(k));
  const material = c => pos.board.reduce((a, p) => a + (p && colorOf(p) === c ? worth[p.toLowerCase()] || 0 : 0), 0);
  for (const [el, c] of [[$('caps-bottom'), bottom], [$('caps-top'), top]]) {
    const took = lost(c === 'w' ? 'b' : 'w'), diff = material(c) - material(c === 'w' ? 'b' : 'w');
    el.innerHTML = took.map(k => glyph(k)).join('') + (diff > 0 ? `<b>+${diff}</b>` : '');
  }
  // move list
  let html = '';
  for (let i = 0; i < sans.length; i += 2) html += `<li><span>${sans[i]}</span>${sans[i + 1] || ''}</li>`;
  $('moves').innerHTML = html; $('moves').scrollTop = 1e6;
  // controls
  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === settings.mode)));
  document.querySelector('.bot-only').hidden = settings.mode !== 'bot';
  $('level').value = settings.level; $('side').value = settings.side;
  $('undo').disabled = !uci.length || isOnline();
  $('undo').hidden = $('new').hidden = isOnline();
  renderOnline();
  $('mute').textContent = settings.muted ? '🔇' : '🔊';
}

function tryMove(from, to) {
  const opts = pos.moves().filter(m => m.from === from && m.to === to);
  if (!opts.length) return false;
  if (opts.length > 1) { choosePromotion(opts); return true; }
  commit(opts[0]);
  return true;
}
// a chosen move: online it goes to the server and is applied when the server confirms it
function commit(m) {
  if (isOnline()) { online.awaiting = true; selected = -1; net.move({ uci: toUci(m) }); render(); return; }
  play(m); render(); botTurn();
}
function choosePromotion(opts) {
  const box = $('promo');
  box.innerHTML = '<div>' + opts.map((m, i) => `<button data-i="${i}" aria-label="Promote to ${({ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' })[m.promo.toLowerCase()]}"><span class="pc ${colorOf(m.promo)}">${glyph(m.promo)}</span></button>`).join('') + '</div>';
  box.hidden = false;
  box.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { box.hidden = true; commit(opts[+b.dataset.i]); }));
}

// tap a piece then a square, or drag it
boardEl.addEventListener('pointerdown', e => {
  const el = e.target.closest('.sq'); if (!el || pos.outcome() || thinking || !human() || !$('promo').hidden) return;
  const s = realSq(+el.dataset.v), p = pos.board[s];
  if (selected >= 0 && s !== selected && tryMove(selected, s)) return;
  if (p && colorOf(p) === pos.turn) {
    selected = s;
    const g = document.createElement('span'); g.className = `pc ${colorOf(p)} ghost`; g.textContent = glyph(p);
    g.style.fontSize = getComputedStyle(el.querySelector('.pc')).fontSize;
    g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
    dragging = { from: s, ghost: g, moved: false, x: e.clientX, y: e.clientY };
    document.body.append(g);
  } else selected = -1;
  render();
});
addEventListener('pointermove', e => {
  if (!dragging) return;
  if (Math.hypot(e.clientX - dragging.x, e.clientY - dragging.y) > 6) dragging.moved = true;
  dragging.ghost.style.left = e.clientX + 'px'; dragging.ghost.style.top = e.clientY + 'px';
});
addEventListener('pointerup', e => {
  if (!dragging) return;
  const d = dragging; dragging = null; d.ghost.remove();
  if (d.moved) {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.sq');
    if (!el || !tryMove(d.from, realSq(+el.dataset.v))) render();
  } else render();
});

// ---------------------------------------------------------------- controls
function newGame() {
  reqId++; thinking = 0; $('promo').hidden = true;
  pos = new Position(START); sans = []; uci = []; selected = -1;
  settings.flipped = settings.mode === 'bot' && settings.side === 'b';
  saveSettings(); save(); render(); botTurn();
}
function saveSettings() { store.set('settings', settings); }
$('new').addEventListener('click', newGame);
$('undo').addEventListener('click', () => {
  reqId++; thinking = 0; $('promo').hidden = true;
  const back = settings.mode === 'bot' ? (pos.turn === settings.side ? 2 : 1) : 1;
  for (let i = 0; i < back && uci.length; i++) { pos.unmake(); sans.pop(); uci.pop(); }
  if (settings.mode === 'bot' && pos.turn !== settings.side && uci.length) { pos.unmake(); sans.pop(); uci.pop(); }
  selected = -1; save(); render(); botTurn();
});
$('flip').addEventListener('click', () => { settings.flipped = !settings.flipped; saveSettings(); render(); });
$('mute').addEventListener('click', () => { settings.muted = !settings.muted; saveSettings(); render(); });
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.mode === settings.mode) return;
  if (isOnline()) net.close();
  settings.mode = b.dataset.mode;
  if (isOnline()) { saveSettings(); resetBoard(); render(); } else newGame();
}));
$('level').addEventListener('change', e => { settings.level = e.target.value; saveSettings(); render(); });
$('side').addEventListener('change', e => { settings.side = e.target.value; newGame(); });
addEventListener('keydown', e => {
  if (e.target.tagName === 'SELECT') return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { $('undo').click(); e.preventDefault(); }
  if (e.key === 'Escape') { selected = -1; render(); }
});

// ---------------------------------------------------------------- online panel
function resetBoard() { reqId++; thinking = 0; pos = new Position(START); sans = []; uci = []; selected = -1; online.endText = ''; online.awaiting = false; online.drawReq = false; online.away = false; }
function info(msg, cls = '') { online.info = msg; online.infoCls = cls; renderOnline(); }
function renderOnline() {
  $('online').hidden = !isOnline();
  if (!isOnline()) return;
  const st = net.status, inGame = st === 'playing' || st === 'ended' || st === 'reconnecting';
  $('ol-lobby').hidden = !(st === 'idle' || st === 'error' || st === 'connecting');
  $('ol-wait').hidden = !(st === 'waiting' || st === 'queued');
  $('ol-game').hidden = !inGame;
  $('ol-wait-label').textContent = st === 'queued' ? 'Looking for someone to play…' : 'Room code — send it to a friend';
  $('ol-code-show').textContent = st === 'waiting' ? net.code : '…';
  $('ol-copy').hidden = st !== 'waiting';
  const over = st === 'ended';
  $('ol-rematch').hidden = !over; $('ol-draw').hidden = $('ol-resign').hidden = over;
  $('ol-drawreq').hidden = !online.drawReq || over;
  $('ol-create').disabled = $('ol-quick').disabled = st === 'connecting';
  $('ol-info').textContent = online.info; $('ol-info').className = 'ol-info ' + online.infoCls;
  if (!$('ol-name').matches(':focus')) $('ol-name').value = settings.name || '';
}
const myName = () => (settings.name = ($('ol-name').value || '').trim().slice(0, 14), saveSettings(), settings.name || 'Player');
$('ol-create').addEventListener('click', () => { const n = myName(); resetBoard(); info(''); net.create(n); render(); });
$('ol-quick').addEventListener('click', () => { const n = myName(); resetBoard(); info(''); net.quick(n); render(); });
$('ol-join').addEventListener('submit', e => { e.preventDefault(); const c = $('ol-code').value.trim(); if (c.length !== 4) { info('Room codes have 4 letters.', 'err'); return; } const n = myName(); resetBoard(); info(''); net.join(c, n); render(); });
$('ol-cancel').addEventListener('click', () => { net.close(); info(''); render(); });
$('ol-leave').addEventListener('click', () => { net.close(); resetBoard(); info('You left the game.'); render(); });
$('ol-copy').addEventListener('click', async () => { const link = shareLink(net.code); try { if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Chess', text: 'Play chess with me', url: link }); else { await navigator.clipboard.writeText(link); info('Invite link copied.'); } } catch { info(link); } });
$('ol-resign').addEventListener('click', () => { if (confirm('Resign this game?')) net.resign(); });
$('ol-draw').addEventListener('click', () => { net.offerDraw(); info('Draw offered.'); });
$('ol-accept').addEventListener('click', () => { online.drawReq = false; net.offerDraw(); });
$('ol-decline').addEventListener('click', () => { online.drawReq = false; net.declineDraw(); render(); });
$('ol-rematch').addEventListener('click', () => { net.rematch(); info('Rematch requested — waiting for your opponent.'); });
net.on('status', () => render());
net.on('rtt', () => render());
net.on('start', snap => {
  resetBoard(); clearRoomParam();
  for (const u of snap.moves) { const m = findMove(u); if (!m) break; play(m, true); }
  online.white = snap.white; online.names = snap.names; online.away = !!snap.away;
  if (snap.over && snap.result && !pos.outcome()) online.endText = 'This game is over.';
  settings.flipped = myColor() === 'b';
  info(snap.n ? 'Back in your game.' : `You play ${myColor() === 'w' ? 'White — you move first' : 'Black'}.`);
  sfx.move(); render();
});
net.on('move', ev => {
  online.awaiting = false; online.drawReq = false;
  if (ev.uci) { const m = findMove(ev.uci); if (m) play(m); }
  const opp = online.names[1 - net.side] || 'Your opponent';
  if (ev.resigned !== undefined) { online.endText = ev.resigned === net.side ? 'You resigned.' : `${opp} resigned — you win! 🎉`; sfx.end(ev.resigned !== net.side); }
  else if (ev.agreed) { online.endText = 'Draw agreed.'; sfx.end(false); }
  if (ev.over) info(`Score: you ${ev.score[net.side]} – ${ev.score[1 - net.side]} ${opp}`);
  render();
});
net.on('reject', r => { online.awaiting = false; info(r.why === 'stale' ? 'Board out of date — resynced.' : `The server refused that move (${r.why}).`, 'warn'); render(); });
net.on('away', () => { online.away = true; info(`${online.names[1 - net.side] || 'Your opponent'} lost connection. Their seat is held for a short while.`, 'warn'); render(); });
net.on('back', () => { online.away = false; info(`${online.names[1 - net.side] || 'Your opponent'} is back.`); render(); });
net.on('left', () => { info(`${online.names[1 - net.side] || 'Your opponent'} left the game.`, 'warn'); render(); });
net.on('draw_req', () => { online.drawReq = true; info('Your opponent offers a draw.'); render(); });
net.on('draw_no', () => info('Your draw offer was declined.'));
net.on('rematch_req', () => info('Your opponent wants a rematch — press Rematch to play again.'));
net.on('expired', () => { resetBoard(); info('That game has ended (the server no longer has it).', 'warn'); render(); });
net.on('error', msg => { info(msg, 'err'); render(); });

// an invite link (?room=CODE) switches to online play and joins
const linkRoom = roomFromUrl();
if (linkRoom) { settings.mode = 'online'; saveSettings(); }
if (isOnline()) {
  resetBoard();
  if (linkRoom) { $('ol-code').value = linkRoom; net.join(linkRoom, settings.name || 'Player'); }
  else net.resume();
} else load();
render();
botTurn();
window.__chess = { get fen() { return pos.fen(); }, get sans() { return sans.slice(); }, get thinking() { return !!thinking; }, move: (a, b) => tryMove(sqIndex(a), sqIndex(b)), newGame, settings, net, online };
