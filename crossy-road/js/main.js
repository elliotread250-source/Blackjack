// Glue: screens, the fixed-timestep loop, input, sound and saved progress.
import { Game, Profile, TICK, CHARACTERS, charById, entityX, trainState } from './logic.js';
import { Renderer } from './render.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { store } from './store.js';
import { Autopilot } from './autopilot.js';
import { Leaderboard } from './leaderboard.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const profile = new Profile(store);
const sound = new Sound(profile.muted);
const canvas = $('game');
let renderer;
try {
  renderer = new Renderer(canvas);
} catch (err) {
  document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px;text-align:center;font:700 18px system-ui;color:#fff;background:#2c3448">This game needs WebGL, which is not available in this browser.</div>');
  throw err;
}
const autopilot = params.has('autopilot') ? new Autopilot() : null;
// test runs (?autopilot, ?seed=) never post scores
const board = new Leaderboard(!params.has('autopilot') && !params.has('seed'));
const touchUI = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

const THEME_NOTE = { snow: 'Comes with a snowy world', autumn: 'Comes with an autumn world', night: 'Comes with a night world', candy: 'Comes with a candy world' };
const DEATH_TEXT = {
  car: ['Splat!', 'Flattened!', 'Road pizza!'],
  train: ['Choo choo!', 'Derailed!', 'Train wreck!'],
  drown: ['Sploosh!', 'Can’t swim!', 'Glub glub!'],
  drift: ['Swept away!', 'Bye bye!', 'Over the edge!'],
  eagle: ['Snatched!', 'Eagle got you!', 'Too slow!'],
};

let game = null;
let state = 'title';           // title | playing | dying | over | paused | chars | board
let pausedFrom = null;
let deathTime = 0;
let runSeed = params.has('seed') ? Number(params.get('seed')) >>> 0 : null;
let charsFrom = 'title';
let sel = 0;
let lastOver = 0;

// ------------------------------------------------------------ game lifecycle
function newGame() {
  const seed = runSeed !== null ? runSeed++ : undefined;
  game = new Game({ seed });
  renderer.setTheme(charById(profile.selected).theme);
  renderer.setCharacter(profile.selected);
  renderer.reset(game);
  board.startRun();
  updateHud();
  prevPhase.clear(); passed.clear();
}

function show(id) {
  for (const s of ['s-title', 's-pause', 's-over', 's-chars', 's-board']) $(s).hidden = s !== id;
  $('arcade').hidden = !(id === 's-title' || id === 's-over');
  $('hud').hidden = id === 's-title' || id === 's-chars' || id === 's-board';
  $('hud').classList.toggle('over', id === 's-over');
}

function toTitle() {
  state = 'title';
  newGame();
  $('t-best').textContent = 'Best ' + profile.best;
  $('t-best').hidden = profile.best <= 0;
  show('s-title');
  setThemeColor();
  showWorldBest();
}

function startPlaying() {
  state = 'playing';
  show(null);
  $('hint').hidden = true;
}

function retry() {
  newGame();
  state = 'playing';
  show(null);
  $('hint').textContent = touchUI ? 'Tap to hop • swipe to turn' : 'Arrows / WASD to hop';
  $('hint').hidden = false;
  setThemeColor();
}

function pause() {
  if (state !== 'playing' && state !== 'dying') return;
  pausedFrom = state;
  state = 'paused';
  show('s-pause');
  sound.rumble(0);
}

function resume() {
  if (state !== 'paused') return;
  state = pausedFrom || 'playing';
  show(null);
  last = performance.now();
}

function gameOver() {
  state = 'over';
  lastOver = performance.now();
  const score = game.score;
  const isBest = profile.submit(score) && score > 0;
  const lines = DEATH_TEXT[game.player.dead ? game.player.dead.type : 'car'];
  $('o-why').textContent = lines[Math.floor(Math.random() * lines.length)];
  $('o-score').textContent = score;
  $('o-best').textContent = 'Best ' + profile.best;
  $('o-new').hidden = !isBest;
  $('o-coins').textContent = '+' + game.coins;
  show('s-over');
  updateHud();
  postScore(score);
  if (isBest) sound.best(); else sound.over();
  sound.rumble(0);
}

// ------------------------------------------------------------ global leaderboard
let lastScore = 0;
let boardFrom = 'title';
function setRank(text, gold) {
  $('o-rank').textContent = text;
  $('o-rank').classList.toggle('gold', !!gold);
  $('o-rank').hidden = !text;
}
function postScore(score) {
  lastScore = score;
  $('o-form').hidden = true;
  setRank('');
  if (!board.enabled || score <= 0) return;
  if (!board.name) {
    $('o-name').value = '';
    $('o-form').hidden = false;
    setRank('Post your score worldwide');
    return;
  }
  setRank('Posting…');
  board.submit(score, profile.selected).then(d => {
    if (state !== 'over') return;
    if (d.rank && d.rank <= 20) setRank(`World #${d.rank}!`, true);
    else if (d.rank) setRank(`World rank #${d.rank}`);
    else setRank(`World best ${d.best}`);
  }).catch(e => {
    if (state !== 'over') return;
    if (/name/i.test(e.message)) { $('o-name').value = board.name; $('o-form').hidden = false; }
    setRank(e.message);
  });
}
$('o-form').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('o-name').value.replace(/\s+/g, ' ').trim();
  if (!n) { $('o-name').focus(); return; }
  board.setName(n);
  $('o-name').blur();
  postScore(lastScore);
});
for (const ev of ['pointerdown', 'keydown']) $('o-form').addEventListener(ev, e => e.stopPropagation());

const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function renderBoard(rows, msg) {
  const me = board.name.toLowerCase();
  $('b-list').innerHTML = msg ? `<li class="msg">${esc(msg)}</li>` : rows.length
    ? rows.map((r, i) => `<li class="${r.name.toLowerCase() === me ? 'me' : ''}"><span class="rk">${i + 1}</span><span class="nm">${esc(r.name)}</span><span class="sc">${r.score}</span></li>`).join('')
    : '<li class="msg">No scores yet. Be the first!</li>';
  $('b-name').textContent = board.name ? `Playing as ${board.name} · change` : 'Set your name';
}
function openBoard() {
  boardFrom = state;
  state = 'board';
  show('s-board');
  renderBoard(board.top, board.top.length ? '' : 'Loading…');
  board.fetchTop().then(rows => { if (state === 'board') renderBoard(rows); })
    .catch(() => { if (state === 'board' && !board.top.length) renderBoard([], 'Leaderboard offline. Try again soon.'); });
}
function closeBoard() {
  state = boardFrom;
  show(boardFrom === 'over' ? 's-over' : 's-title');
  if (boardFrom === 'title') showWorldBest();
}
function showWorldBest() {
  if (!board.enabled) return;
  board.fetchTop().then(rows => {
    const w = rows[0];
    $('t-world').textContent = w ? `World best ${w.score} · ${w.name}` : '';
    $('t-world').hidden = !w;
  }).catch(() => {});
}
$('b-name').addEventListener('click', e => {
  e.stopPropagation();
  const n = (window.prompt('Name for the leaderboard (max 14 letters):', board.name) || '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (n) { board.setName(n); renderBoard(board.top); }
});

// ------------------------------------------------------------ HUD
function updateHud() {
  $('score').textContent = game ? game.score : 0;
  $('top').textContent = 'Top ' + Math.max(profile.best, game ? game.score : 0);
  $('coins').textContent = profile.coins;
}

const MUTE_ON = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const MUTE_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
function updateMute() {
  for (const b of document.querySelectorAll('.mute')) {
    b.innerHTML = profile.muted ? MUTE_OFF : MUTE_ON;
    b.setAttribute('aria-label', profile.muted ? 'Unmute' : 'Mute');
  }
}
function toggleMute() {
  sound.unlock();
  profile.setMuted(!profile.muted);
  sound.setMuted(profile.muted);
  updateMute();
  if (!profile.muted) sound.click();
}

function setThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const sky = renderer.th ? '#' + renderer.th.sky.toString(16).padStart(6, '0') : '#9fd6f0';
  if (meta) meta.setAttribute('content', sky);
  document.body.style.background = sky;
}

// ------------------------------------------------------------ characters screen
function openChars() {
  charsFrom = state;
  state = 'chars';
  sel = Math.max(0, CHARACTERS.findIndex(c => c.id === profile.selected));
  if (!renderer.carousel.length) renderer.buildCarousel(profile.owned);
  else renderer.setCarouselOwned(profile.owned);
  renderer.pPos = sel * 2.2;
  show('s-chars');
  updateChars();
}

function updateChars() {
  const c = CHARACTERS[sel];
  const owned = profile.owned.has(c.id);
  $('c-name').textContent = owned ? c.name : '???';
  $('c-coins').textContent = profile.coins;
  const btn = $('c-action');
  const note = THEME_NOTE[c.theme] || '';
  if (owned) {
    const isSel = profile.selected === c.id;
    btn.textContent = isSel ? 'Selected' : 'Select';
    btn.disabled = isSel;
    btn.className = 'btn green';
    $('c-info').textContent = note || (isSel ? 'Ready to cross' : 'Unlocked');
  } else {
    btn.innerHTML = '<span class="coin-ic"></span>' + c.price;
    btn.disabled = profile.coins < c.price;
    btn.className = 'btn orange';
    $('c-info').textContent = (profile.coins < c.price ? 'Need ' + (c.price - profile.coins) + ' more coins' : 'Unlock ' + c.name) + (note ? ' • ' + note.toLowerCase() : '');
  }
  $('c-dots').innerHTML = CHARACTERS.map((ch, i) => `<i class="${i === sel ? 'on' : ''} ${profile.owned.has(ch.id) ? '' : 'lock'}"></i>`).join('');
}

function charsStep(d) {
  sel = (sel + d + CHARACTERS.length) % CHARACTERS.length;
  sound.click();
  updateChars();
}

function charsAction() {
  const c = CHARACTERS[sel];
  if (profile.owned.has(c.id)) {
    if (profile.select(c.id)) sound.click();
  } else if (profile.buy(c.id)) {
    sound.buy();
    renderer.setCarouselOwned(profile.owned);
  }
  updateChars();
  updateHud();
}

function closeChars() {
  sound.click();
  toTitle();
}

// ------------------------------------------------------------ input
function onMove(dir, src) {
  sound.unlock();
  if (state === 'title') {
    startPlaying();
    game.input(dir);
  } else if (state === 'playing') {
    if (!game.started) $('hint').hidden = true;
    game.input(dir);
  } else if (state === 'chars') {
    if (dir === 'left') charsStep(src === 'swipe' ? 1 : -1);
    else if (dir === 'right') charsStep(src === 'swipe' ? -1 : 1);
  }
}

function onKey(e) {
  if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return false;
  const k = e.code;
  if (k === 'KeyM') { toggleMute(); return true; }
  if (state === 'board') {
    if (k === 'Escape' || k === 'Space' || k === 'Enter') { closeBoard(); return true; }
    return false;
  }
  if (k === 'KeyP' || k === 'Escape') {
    if (state === 'playing' || state === 'dying') pause();
    else if (state === 'paused') resume();
    else if (state === 'chars' && k === 'Escape') closeChars();
    return true;
  }
  if (k === 'Space' || k === 'Enter') {
    sound.unlock();
    if (state === 'title') { startPlaying(); game.input('up'); }
    else if (state === 'playing') game.input('up');
    else if (state === 'paused') resume();
    else if (state === 'over' && performance.now() - lastOver > 400) retry();
    else if (state === 'chars') charsAction();
    return true;
  }
  if (k === 'KeyC' && (state === 'title' || state === 'over')) { sound.unlock(); openChars(); return true; }
  return false;
}

new Input(canvas, onMove, onKey);

const click = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); sound.unlock(); fn(); e.currentTarget.blur(); });
click('b-pause', pause);
click('p-resume', resume);
click('p-menu', () => { sound.click(); toTitle(); });
click('o-retry', () => { sound.click(); retry(); });
click('o-chars', () => { sound.click(); openChars(); });
click('t-chars', () => { sound.click(); openChars(); });
click('t-board', () => { sound.click(); openBoard(); });
click('o-board', () => { sound.click(); openBoard(); });
click('b-back', () => { sound.click(); closeBoard(); });
click('c-back', closeChars);
click('c-prev', () => charsStep(-1));
click('c-next', () => charsStep(1));
click('c-action', charsAction);
for (const b of document.querySelectorAll('.mute')) b.addEventListener('click', e => { e.stopPropagation(); toggleMute(); b.blur(); });
// buttons should never start a hop underneath them
for (const b of document.querySelectorAll('button, a')) b.addEventListener('pointerdown', e => e.stopPropagation());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); sound.suspend(); } else if (!profile.muted) sound.resume();
});
window.addEventListener('blur', () => pause());
window.addEventListener('resize', () => renderer.resize());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.cancelable) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

// ------------------------------------------------------------ events -> sound/effects
function handleEvents() {
  for (const e of game.takeEvents()) {
    switch (e.type) {
      case 'hop': sound.hop(); break;
      case 'bump': sound.bump(); break;
      case 'land': if (e.log) sound.plop(); break;
      case 'score': updateHud(); break;
      case 'coin':
        profile.addCoins(1);
        sound.coin();
        renderer.collectCoin(e.row);
        updateHud();
        $('coinbox').classList.remove('pop'); void $('coinbox').offsetWidth; $('coinbox').classList.add('pop');
        break;
      case 'death':
        state = 'dying';
        deathTime = performance.now();
        renderer.onDeath(game);
        if (e.kind === 'car') sound.squish();
        else if (e.kind === 'train') sound.smash();
        else if (e.kind === 'drown' || e.kind === 'drift') sound.splash();
        else if (e.kind === 'eagle') { sound.screech(); setTimeout(() => sound.flap(), 450); }
        if (navigator.vibrate && touchUI) { try { navigator.vibrate(60); } catch { /* ignore */ } }
        break;
    }
  }
}

// Traffic whooshes, horns, train bells and rumble near the player.
const prevPhase = new Map();
const passed = new Map();
function ambient() {
  if (state !== 'playing' && state !== 'dying') { sound.rumble(0); return; }
  const p = game.player, t = game.t;
  const row = game.curRow(), px = p.x;
  let rumble = 0, bell = false;
  for (let r = row - 2; r <= row + 8; r++) {
    const lane = game.lanes.get(r);
    if (!lane) continue;
    if (lane.type === 'road' && Math.abs(r - row) <= 1) {
      for (let i = 0; i < lane.items.length; i++) {
        const v = lane.items[i];
        const dx = entityX(lane, v, t) - px;
        const key = r * 64 + i;
        const prev = passed.get(key);
        passed.set(key, dx);
        if (prev !== undefined && Math.sign(prev) !== Math.sign(dx) && Math.abs(dx) < 3 && !p.dead) sound.whoosh(r === row ? 1 : 0.6);
        if (r === row && !p.dead && lane.dir * -dx > 0 && Math.abs(dx) < 3.6 && Math.abs(dx) > v.len / 2 + 0.6) sound.horn();
      }
    } else if (lane.type === 'rail') {
      const s = trainState(lane, t);
      const near = 1 - Math.abs(r - row) / 9;
      if (s.phase === 'warn' && r - row <= 5) bell = true;
      if (s.phase === 'pass') {
        const lo = Math.min(s.head, s.tail), hi = Math.max(s.head, s.tail);
        const dist = px < lo ? lo - px : px > hi ? px - hi : 0;
        rumble = Math.max(rumble, near * Math.max(0, 1 - dist / 22));
        if (prevPhase.get(r) !== 'pass' && Math.abs(r - row) <= 4) sound.trainHorn();
      }
      prevPhase.set(r, s.phase);
    }
  }
  if (bell) sound.bell();
  sound.rumble(rumble);
}

// ------------------------------------------------------------ main loop (fixed 60 Hz simulation)
let last = performance.now();
let acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.25) dt = 0.25;
  if (state === 'chars') {
    renderer.renderCarousel(sel, dt, charById(CHARACTERS[sel].id).theme);
    return;
  }
  if (state !== 'paused') {
    acc += dt;
    let n = 0;
    while (acc >= TICK) {
      if (autopilot && state === 'playing') autopilot.update(game);
      game.step();
      handleEvents();
      acc -= TICK;
      if (++n > 12) { acc = 0; break; }
    }
    if (state === 'dying' && now - deathTime > (game.player.dead.type === 'eagle' ? 1500 : 1150)) gameOver();
    ambient();
  }
  renderer.update(state === 'paused' ? 0 : acc / TICK, state === 'paused' ? 0 : dt);
  renderer.render();
}

// ------------------------------------------------------------ boot
$('t-keys').textContent = touchUI ? 'Tap to hop forward • swipe left, right or back' : 'Arrows / WASD to hop • P pause • M mute • C characters';
$('tap').textContent = touchUI ? 'Tap to play' : 'Press ↑ to play';
updateMute();
toTitle();
requestAnimationFrame(frame);
if (autopilot) { startPlaying(); }

// test hook
window.__crossy = { get state() { return state; }, get game() { return game; }, profile, renderer, sound };
