// ui.js — everything the three games share around the canvas: the menu (account, play, all-time board,
// back to Open Arcade), the HUD with the live top 10, the end screen, toasts, and the render loop.
//
// A game module calls boot({ key, title, ..., game }) where `game` supplies:
//   welcome(msg)            world data from the server when we join a room
//   event(msg)              reliable deltas ("ev") from the server
//   render(ctx, w, h, now)  draw one frame (called every animation frame, 60 fps)
//   hud()                   { big, small, center, centerWarn } for the stat boxes
//   attach(api)             wire up input; api.playing() says whether input should be sent
//   reset()                 forget the world (socket closed)
import { IoNet } from './net.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (root, sel) => root.querySelector(sel);

async function api(path, body) {
  const opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  let r;
  try { r = await fetch(path, { credentials: 'same-origin', ...opt }); }
  catch { throw new Error('Could not reach the server. Check your connection.'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.error || 'Something went wrong.'); e.data = data; throw e; }
  return data;
}

export function boot(cfg) {
  document.body.style.setProperty('--accent', cfg.accent);
  document.title = `${cfg.title} · Open Arcade`;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const net = new IoNet(cfg.key);
  const game = cfg.game;
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  let user = null, accounts = [], state = 'menu', lastOver = null, wantSpawn = false;

  // ---------------------------------------------------------------- DOM
  const menu = document.createElement('div');
  menu.className = 'overlay';
  menu.innerHTML = `
    <div class="card">
      <div class="top-row"><a class="back" data-hub href="https://open-arcade.up.railway.app">← Open Arcade</a><span class="online" id="online"></span></div>
      <div class="menu-grid">
        <div>
          <h1 class="title">${esc(cfg.title)}</h1>
          <p class="tagline">${esc(cfg.tagline)}</p>
          <div class="panel" id="acct"></div>
          <button class="btn play" id="play" disabled>Play</button>
          <ul class="howto">${cfg.howto.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        </div>
        <div class="panel"><h2>All-time top 20</h2><ol class="board" id="board"></ol><div class="mybest" id="mybest"></div></div>
      </div>
    </div>`;
  const hud = document.createElement('div');
  hud.className = 'hud hidden';
  hud.innerHTML = `
    <div class="stat"><div class="big" id="h-big">0</div><div class="small" id="h-small"></div></div>
    <div class="center hidden" id="h-center"></div>
    <div class="live"><h3>This round</h3><ol id="h-live"></ol></div>
    <div class="toast hidden" id="h-toast"></div>
    <button class="btn menu-btn" id="h-menu">Menu</button>
    <div class="net" id="h-net"></div>`;
  const end = document.createElement('div');
  end.className = 'overlay hidden';
  end.innerHTML = `
    <div class="card end">
      <div class="label" id="e-label">Final score</div>
      <div class="score" id="e-score">0</div>
      <p class="why" id="e-why"></p>
      <div class="facts"><div><b id="e-rank">-</b><span>rank this round</span></div><div><b id="e-best">-</b><span id="e-best-l">your best</span></div></div>
      <div class="row"><button class="btn" id="e-menu">Menu</button><button class="btn play" id="e-again">Play again</button></div>
    </div>`;
  document.body.append(hud, menu, end);
  document.querySelectorAll('a[data-hub]').forEach(a => { a.href = window.OPEN_ARCADE_HUB || a.href; });
  const play = $(menu, '#play');

  // ---------------------------------------------------------------- account panel
  const acct = $(menu, '#acct');
  function renderAccount(msg = '', err = false, extra = '') {
    if (user) {
      acct.innerHTML = `<h2>Signed in</h2><div class="who"><b>${esc(user.username)}</b><button class="btn link" id="a-out">Switch player</button></div>${extra}`;
      $(acct, '#a-out').onclick = async () => { await api('/api/auth/logout', {}).catch(() => {}); user = null; net.close(); refreshSession(); };
      play.disabled = false;
      return;
    }
    play.disabled = true;
    const others = accounts.length ? `<div class="chips">${accounts.map(a => `<button class="chip" data-a="${esc(a)}">${esc(a)}</button>`).join('')}</div>` : '';
    acct.innerHTML = `<h2>Pick a username to play</h2>
      <form class="field" id="a-name"><input id="a-user" maxlength="14" autocomplete="username" placeholder="Username" aria-label="Username"><button class="btn primary">Next</button></form>
      ${others}<div class="msg ${err ? 'err' : ''}" id="a-msg">${esc(msg)}</div>`;
    $(acct, '#a-name').onsubmit = e => { e.preventDefault(); checkName($(acct, '#a-user').value); };
    acct.querySelectorAll('[data-a]').forEach(b => b.onclick = async () => {
      try { user = (await api('/api/auth/switch', { username: b.dataset.a })).user; renderAccount(); loadBoard(); }
      catch (e) { askPin(b.dataset.a, true); }
    });
  }
  async function checkName(raw) {
    try {
      const r = await api('/api/auth/check', { username: raw });
      if (!r.ok) return renderAccount(r.error, true);
      askPin(r.username, r.exists);
    } catch (e) { renderAccount(e.message, true); }
  }
  function askPin(name, exists, msg = '', err = false) {
    acct.innerHTML = `<h2>${exists ? `Welcome back, ${esc(name)}` : `New player: ${esc(name)}`}</h2>
      <form class="field" id="a-pin"><input id="a-p" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="${exists ? 'current-password' : 'new-password'}"
        placeholder="${exists ? 'Your PIN' : 'Choose a 4-8 digit PIN'}" aria-label="PIN"><button class="btn primary">${exists ? 'Sign in' : 'Create'}</button></form>
      <div class="msg ${err ? 'err' : ''}">${esc(msg || (exists ? '' : 'Your PIN keeps your scores yours on any device.'))}</div>
      <button class="btn link" id="a-back">Use a different name</button>${exists ? ' · <button class="btn link" id="a-forgot">Forgot PIN?</button>' : ''}`;
    const input = $(acct, '#a-p');
    setTimeout(() => input.focus(), 30);
    $(acct, '#a-back').onclick = () => renderAccount();
    if (exists) $(acct, '#a-forgot').onclick = () => askRecovery(name);
    $(acct, '#a-pin').onsubmit = async e => {
      e.preventDefault();
      try {
        const r = await api(exists ? '/api/auth/login' : '/api/auth/register', { username: name, pin: input.value });
        user = r.user;
        renderAccount('', false, r.recovery ? recoveryNote(r.recovery) : '');
        loadBoard();
      } catch (err2) { askPin(name, exists, err2.message, true); }
    };
  }
  function askRecovery(name, msg = '') {
    acct.innerHTML = `<h2>Reset PIN for ${esc(name)}</h2>
      <form id="a-rec"><div class="field"><input id="a-code" placeholder="Recovery code (XXXX-XXXX-XXXX)" autocomplete="off"></div>
      <div class="field"><input id="a-new" type="password" inputmode="numeric" maxlength="8" placeholder="New PIN"><button class="btn primary">Reset</button></div></form>
      <div class="msg err">${esc(msg)}</div><button class="btn link" id="a-back">Back</button>`;
    $(acct, '#a-back').onclick = () => askPin(name, true);
    $(acct, '#a-rec').onsubmit = async e => {
      e.preventDefault();
      try {
        const r = await api('/api/auth/recover', { username: name, code: $(acct, '#a-code').value, pin: $(acct, '#a-new').value });
        user = r.user; renderAccount('', false, recoveryNote(r.recovery)); loadBoard();
      } catch (err2) { askRecovery(name, err2.message); }
    };
  }
  const recoveryNote = code => `<div class="recovery">Write this down. It's the only way back in if you forget your PIN, and it's shown once:<code>${esc(code)}</code></div>`;

  async function refreshSession() {
    try { const s = await api('/api/session'); user = s.user; accounts = s.accounts || []; }
    catch (e) { user = null; renderAccount(e.message, true); return; }
    renderAccount();
    loadBoard();
  }

  // ---------------------------------------------------------------- all-time board
  async function loadBoard() {
    const board = $(menu, '#board'), mine = $(menu, '#mybest');
    try {
      const r = await api(`/api/leaderboard?game=${cfg.key}`);
      board.innerHTML = r.top.length ? r.top.map(row => `<li class="${user && row.name === user.username ? 'me' : ''}"><span class="n">${row.rank}</span><span>${esc(row.name)}</span><span class="s">${esc(cfg.format(row.score))}</span></li>`).join('')
        : '<div class="board-empty">No scores yet. Be the first on the board.</div>';
      mine.textContent = r.me && r.me.best ? `Your best: ${cfg.format(r.me.best)} · #${r.me.rank} all time` : '';
    } catch { board.innerHTML = '<div class="board-empty">Leaderboard unavailable right now.</div>'; }
    api('/api/stats').then(s => { const n = s[cfg.key]?.humans || 0; $(menu, '#online').textContent = n ? `${n} online now` : ''; }).catch(() => {});
  }

  // ---------------------------------------------------------------- flow
  function show(which) {
    state = which;
    menu.classList.toggle('hidden', which !== 'menu');
    end.classList.toggle('hidden', which !== 'over');
    hud.classList.toggle('hidden', which === 'menu' && !net.connected);
  }
  function startPlay() {
    if (!user) return;
    lastOver = null;
    if (net.connected) { net.send({ t: 'spawn' }); show('playing'); }
    else { wantSpawn = false; net.connect(); show('playing'); }
  }
  play.onclick = startPlay;
  $(end, '#e-again').onclick = startPlay;
  $(end, '#e-menu').onclick = () => { show('menu'); loadBoard(); };
  $(hud, '#h-menu').onclick = () => { show('menu'); loadBoard(); };
  addEventListener('keydown', e => {
    if (e.key === 'Enter' && state === 'over') startPlay();
    if (e.key === 'Escape' && state === 'playing') { show('menu'); loadBoard(); }
  });

  net.on('welcome', m => { game.welcome(m); show(state === 'menu' ? 'menu' : 'playing'); });
  net.on('ev', m => game.event(m));
  net.on('error', m => { if (m.code === 'auth') { user = null; refreshSession(); show('menu'); } });
  net.on('closed', () => {
    game.reset();
    if (state === 'playing') toast('Connection lost. Press Play to rejoin.', 4000);
    show('menu');
    refreshSession();
  });
  net.on('over', m => {
    lastOver = m;
    $(end, '#e-score').textContent = cfg.format(m.score);
    $(end, '#e-label').textContent = m.reason === 'time' ? 'Round over' : 'Final score';
    $(end, '#e-why').textContent = m.reason === 'time' ? 'Time! Here is how you did.' : m.by ? `Taken out by ${m.by}.` : (cfg.crashText || 'You crashed.');
    $(end, '#e-rank').textContent = `#${m.rank} of ${m.of}`;
    $(end, '#e-best').textContent = m.counted && m.best ? cfg.format(m.best) : '-';
    $(end, '#e-best-l').textContent = m.counted && m.allTime ? `your best · #${m.allTime} all time` : m.counted ? 'your best' : 'too short to count';
    setTimeout(() => { if (lastOver === m && state !== 'menu') show('over'); }, cfg.endDelay ?? 900);
  });
  net.on('eaten', m => toast(`Swallowed by ${m.by}! Popping back up…`, 2600));

  // live top 10 and your rank
  let myRank = 0;
  net.on('me', m => { myRank = m.rank; });
  net.on('lb', m => {
    $(hud, '#h-live').innerHTML = m.top.map(([id, name, v], i) => `<li class="${id === net.you ? 'me' : ''}"><span>${i + 1}. ${esc(name)}</span><span>${esc(cfg.live(v))}</span></li>`).join('');
  });

  let toastTimer = 0;
  function toast(text, ms = 2000) {
    const t = $(hud, '#h-toast');
    t.textContent = text; t.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  // ---------------------------------------------------------------- canvas + loop
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.75 : 2);
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  }
  addEventListener('resize', resize);
  resize();
  let hudAt = 0;
  function frame(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    game.render(ctx, W, H, now, net);
    if (now - hudAt > 100) {            // DOM text 10x a second is plenty
      hudAt = now;
      const h = game.hud(net) || {};
      $(hud, '#h-big').textContent = h.big ?? '';
      $(hud, '#h-small').textContent = (h.small ?? '') + (myRank ? `  ·  #${myRank}` : '');
      const c = $(hud, '#h-center');
      c.classList.toggle('hidden', !h.center);
      c.classList.toggle('warn', !!h.centerWarn);
      if (h.center) c.textContent = h.center;
      $(hud, '#h-net').textContent = net.rtt ? `${Math.round(net.rtt)} ms` : '';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  game.attach({ canvas, net, touch, playing: () => state === 'playing' && net.connected, toast, size: () => [W, H] });
  show('menu');
  refreshSession();
}
