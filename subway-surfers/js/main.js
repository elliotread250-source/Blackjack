import { Run, botStep, POWER_TIME } from './logic.js';
import { Renderer, SKINS } from './render.js';
import { Leaderboard } from './leaderboard.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const store = {
  get(k, d) { try { const v = localStorage.getItem('subway.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('subway.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const profile = Object.assign({ best: 0, bank: 0, owned: ['jake'], skin: 'jake', muted: false }, store.get('profile', {}));
const save = () => store.set('profile', profile);
let renderer;
try { renderer = new Renderer($('game')); } catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<div class="screen dim">This game needs WebGL, which is not available in this browser.</div>'); throw e;
}

// ---------------------------------------------------------------- sound
let actx = null;
function tone(f, at, dur, type = 'triangle', vol = 0.25, slide = 1) {
  if (profile.muted) return;
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { actx = new AC(); } catch { return; } }
  if (actx.state === 'suspended') actx.resume();
  const t = actx.currentTime + at, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
}
let coinPitch = 0, coinT = 0;
const sfx = {
  coin: () => { const now = performance.now(); coinPitch = now - coinT < 300 ? Math.min(coinPitch + 1, 8) : 0; coinT = now; tone(1320 * Math.pow(1.06, coinPitch), 0, 0.08, 'square', 0.08); tone(1980 * Math.pow(1.06, coinPitch), 0.04, 0.1, 'square', 0.06); },
  jump: () => tone(300, 0, 0.18, 'triangle', 0.2, 2.2),
  roll: () => tone(500, 0, 0.18, 'sawtooth', 0.08, 0.4),
  swipe: () => tone(700, 0, 0.06, 'sine', 0.08, 1.5),
  land: () => tone(120, 0, 0.08, 'sine', 0.25),
  stumble: () => { tone(200, 0, 0.2, 'square', 0.15, 0.6); tone(90, 0.05, 0.25, 'sine', 0.3); },
  crash: () => { tone(160, 0, 0.5, 'sawtooth', 0.25, 0.3); tone(80, 0, 0.6, 'square', 0.15, 0.5); },
  power: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.05, 0.15, 'triangle', 0.15)),
};

// ---------------------------------------------------------------- game flow
let run = new Run(), state = 'title', last = performance.now(), deadAt = 0;
const autopilot = params.has('autopilot');
// practice runs (?autopilot, ?seed=) never post scores
const board = new Leaderboard(!autopilot && !params.has('seed'));
function updateTitle() {
  const ids = Object.keys(SKINS), s = SKINS[profile.skin];
  $('s-name').textContent = s.name;
  const owned = profile.owned.includes(profile.skin);
  $('s-info').textContent = owned ? 'Ready' : `🔒 ${s.price} coins`;
  $('play').textContent = owned ? 'Tap to play' : profile.bank >= s.price ? `Unlock for ${s.price}` : `Need ${s.price - profile.bank} more coins`;
  $('t-best').textContent = profile.best ? 'Best ' + Math.floor(profile.best).toLocaleString() : '';
  $('bank').textContent = profile.bank.toLocaleString();
  $('mute').textContent = profile.muted ? '🔇' : '🔊';
  renderer.setSkin(profile.skin);
  void ids;
}
function toTitle() {
  state = 'title'; run = new Run();
  $('title').hidden = false; $('hud').hidden = true; $('over').hidden = true; $('paused').hidden = true;
  if (!profile.owned.includes(profile.skin)) profile.skin = 'jake';
  updateTitle();
  showWorldBest();
}
function play() {
  const s = SKINS[profile.skin];
  if (!profile.owned.includes(profile.skin)) {
    if (profile.bank < s.price) return;
    profile.bank -= s.price; profile.owned.push(profile.skin); save(); sfx.power(); updateTitle(); return;
  }
  run = new Run(params.has('seed') ? +params.get('seed') : undefined);
  board.startRun();
  state = 'play';
  $('title').hidden = true; $('hud').hidden = false; $('over').hidden = true;
}
function gameOver() {
  state = 'over';
  const score = Math.floor(run.score), isBest = score > profile.best;
  if (isBest) profile.best = score;
  profile.bank += run.coins; save();
  $('o-why').textContent = { caught: 'Caught!', train: 'Crash!', oncoming: 'Crash!', hurdle: 'Tripped!', bar: 'Ouch!' }[run.p.dead.why] || 'Busted!';
  $('o-score').textContent = score.toLocaleString();
  $('o-best').textContent = isBest && score ? '🏆 New best!' : 'Best ' + Math.floor(profile.best).toLocaleString();
  $('o-coins').textContent = '+' + run.coins;
  $('over').hidden = false; $('hud').hidden = true;
  lastScore = score; postScore(score);
}

// ---------------------------------------------------------------- global leaderboard
let lastScore = 0, boardFrom = 'title';
function setRank(text, gold) { $('o-rank').textContent = text; $('o-rank').classList.toggle('gold', !!gold); $('o-rank').hidden = !text; }
function postScore(score) {
  $('o-form').hidden = true; setRank('');
  if (!board.enabled || score <= 0) return;
  if (!board.name) { setRank('Add your name to join the world leaderboard'); $('o-form').hidden = false; $('o-name').focus(); return; }
  setRank('Sending score…');
  board.submit(score, profile.skin).then(d => {
    setRank(d.rank ? `World rank #${d.rank}${d.rank <= 3 ? ' 🏆' : ''}` : 'Not in the top 100 yet', d.rank && d.rank <= 20);
    showWorldBest();
  }).catch(e => {
    setRank(e.message);
    if (/name/i.test(e.message)) { $('o-name').value = board.name; $('o-form').hidden = false; }
  });
}
$('o-form').addEventListener('submit', e => {
  e.preventDefault();
  const n = $('o-name').value.replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!n) return;
  board.setName(n); $('o-form').hidden = true; postScore(lastScore);
});
function renderBoard(rows, msg) {
  const me = board.name.toLowerCase();
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $('b-list').innerHTML = rows.map(r => `<li class="${r.name.toLowerCase() === me ? 'me' : ''}"><span>${esc(r.name)}</span><span>${Number(r.score).toLocaleString()}</span></li>`).join('');
  $('b-msg').textContent = msg || (rows.length ? '' : 'No scores yet. Be the first!');
  $('b-name').textContent = board.name ? `Playing as ${board.name} · change` : 'Set your name';
}
function openBoard() {
  boardFrom = state; state = 'board';
  $('board').hidden = false; $('title').hidden = true; $('over').hidden = true;
  renderBoard(board.top, board.top.length ? '' : 'Loading…');
  board.fetchTop().then(rows => { if (state === 'board') renderBoard(rows); }).catch(() => { if (state === 'board' && !board.top.length) renderBoard([], 'Leaderboard offline. Try again soon.'); });
}
function closeBoard() {
  $('board').hidden = true;
  if (boardFrom === 'over') { state = 'over'; $('over').hidden = false; } else toTitle();
}
function showWorldBest() {
  if (!board.enabled) return;
  board.fetchTop().then(rows => {
    const b = rows[0];
    $('t-world').hidden = !b; if (b) $('t-world').textContent = `World best: ${b.name} · ${Number(b.score).toLocaleString()}`;
  }).catch(() => {});
}
$('trophy').addEventListener('click', openBoard);
$('o-board').addEventListener('click', openBoard);
$('b-close').addEventListener('click', closeBoard);
$('b-name').addEventListener('click', () => {
  const n = (prompt('Name for the leaderboard (max 14 letters):', board.name) || '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (n) { board.setName(n); renderBoard(board.top); }
});
function act(a) {
  if (state === 'title' && (a === 'jump' || a === 'tap')) return play();
  if (state !== 'play' || run.p.dead) return;
  if (a !== 'tap') run.input(a);
}

// ---------------------------------------------------------------- input: keys and swipes
const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump', ArrowDown: 'roll', s: 'roll', S: 'roll' };
addEventListener('keydown', e => {
  if (e.repeat) return;
  if (e.target.tagName === 'INPUT') return;
  if ((e.key === 'Escape' || e.key === 'p') && state === 'play') { pause(); return; }
  if (e.key === 'Enter' && state === 'over') { play(); return; }
  if (KEYS[e.key]) { e.preventDefault(); act(KEYS[e.key]); }
});
let touch = null;
const canvas = $('game');
canvas.addEventListener('pointerdown', e => { touch = { x: e.clientX, y: e.clientY, done: false }; });
addEventListener('pointermove', e => {
  if (!touch || touch.done) return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
  if (Math.hypot(dx, dy) < 28) return;
  touch.done = true;
  act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'jump' : 'roll'));
});
addEventListener('pointerup', () => { if (touch && !touch.done && state === 'title') act('tap'); touch = null; });

// ---------------------------------------------------------------- buttons
$('play').addEventListener('click', play);
$('again').addEventListener('click', play);
$('menu').addEventListener('click', toTitle);
const skinIds = Object.keys(SKINS);
const stepSkin = d => { profile.skin = skinIds[(skinIds.indexOf(profile.skin) + d + skinIds.length) % skinIds.length]; updateTitle(); };
$('s-prev').addEventListener('click', () => stepSkin(-1));
$('s-next').addEventListener('click', () => stepSkin(1));
$('mute').addEventListener('click', () => { profile.muted = !profile.muted; save(); updateTitle(); });
function pause() { if (state !== 'play') return; state = 'paused'; $('paused').hidden = false; }
$('pause').addEventListener('click', pause);
$('resume').addEventListener('click', () => { state = 'play'; $('paused').hidden = true; last = performance.now(); });
$('quit').addEventListener('click', toTitle);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
addEventListener('resize', () => renderer.resize());
$('keys').textContent = matchMedia('(pointer: coarse)').matches ? 'Swipe left / right to change lane, up to jump, down to roll' : 'Arrows / WASD: change lane, jump, roll • P pause';

// ---------------------------------------------------------------- loop
const ICON = { magnet: '🧲 Magnet', sneakers: '👟 Super sneakers', double: '✖️2 Double score' };
function hud() {
  $('score').textContent = Math.floor(run.score).toLocaleString();
  $('coins').textContent = run.coins;
  $('mult').textContent = '×' + run.mult;
  $('powers').innerHTML = Object.entries(run.power).filter(([, v]) => v > 0).map(([k, v]) => `<div>${ICON[k]}<i style="width:${(v / POWER_TIME[k]) * 100}%"></i></div>`).join('');
  $('warn').textContent = run.chased && !run.p.dead ? 'The inspector is on your tail!' : '';
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  if (state === 'play') {
    // fixed 120 Hz steps keep collisions solid at high speed
    let left = dt;
    while (left > 1e-6) { const h = Math.min(1 / 120, left); if (autopilot) botStep(run); run.step(h); left -= h; }
    for (const e of run.takeEvents()) {
      if (e.type === 'coin') sfx.coin(); else if (e.type === 'jump') sfx.jump(); else if (e.type === 'roll') sfx.roll(); else if (e.type === 'swipe') sfx.swipe();
      else if (e.type === 'land') sfx.land(); else if (e.type === 'stumble') sfx.stumble(); else if (e.type === 'power') sfx.power();
      else if (e.type === 'crash') { sfx.crash(); deadAt = now; state = 'dying'; if (navigator.vibrate && matchMedia('(pointer: coarse)').matches && navigator.userActivation?.hasBeenActive) try { navigator.vibrate(80); } catch { /* fine */ } }
    }
    hud();
  } else if (state === 'dying' && now - deadAt > 1100) gameOver();
  renderer.update(run, state === 'paused' ? 0 : dt, t, state === 'title');
}
toTitle();
requestAnimationFrame(frame);
if (autopilot) play();
window.__subway = { get run() { return run; }, get state() { return state; }, play, act, profile, renderer };
