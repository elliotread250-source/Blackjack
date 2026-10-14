import { Run, botInput, SIZE, PITCH, N, ROAD, ANIMALS } from './logic.js';
import { Renderer, CARS } from './render.js';
import { Leaderboard } from './leaderboard.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const store = {
  get(k, d) { try { const v = localStorage.getItem('wreckrun.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('wreckrun.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
const profile = Object.assign({ best: 0, car: 'red', muted: false }, store.get('profile', {}));
const save = () => store.set('profile', profile);
const touchUI = matchMedia('(pointer: coarse)').matches || params.has('touch');
const board = new Leaderboard(!params.has('autopilot') && !params.has('seed'));
const autopilot = params.has('autopilot');

let run = new Run(params.has('seed') ? +params.get('seed') : 7);
let renderer;
try { renderer = new Renderer($('game'), run, { car: profile.car, low: touchUI }); } catch (e) {
  document.body.insertAdjacentHTML('beforeend', '<div class="screen dim">Wreck Run needs WebGL, which is not available in this browser.</div>'); throw e;
}

// ---------------------------------------------------------------- sound (all synthesised)
let actx = null, engine = null;
function ac() {
  if (profile.muted) return null;
  if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; try { actx = new AC(); } catch { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(f, at, dur, type = 'triangle', vol = 0.2, slide = 1) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, f0, vol) {
  const c = ac(); if (!c) return;
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = f0; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(c.destination); s.start();
}
function engineSound(speed, on) {
  const c = ac(); if (!c) return;
  if (!engine) {
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(c.destination); o.start(); o2.start();
    engine = { o, o2, g };
  }
  const t = c.currentTime, rpm = 40 + speed * 3.2 + (speed % 12) * 2;
  engine.o.frequency.setTargetAtTime(rpm, t, 0.08); engine.o2.frequency.setTargetAtTime(rpm * 0.5, t, 0.08);
  engine.g.gain.setTargetAtTime(on ? 0.05 : 0, t, 0.1);
}
const sfx = {
  smash: combo => { noise(0.25, 1800, 0.35); tone(300 + combo * 60, 0, 0.12, 'square', 0.08); },
  crash: hard => { noise(hard ? 0.6 : 0.3, 600, hard ? 0.6 : 0.35); },
  oops: () => { tone(420, 0, 0.12, 'square', 0.12); tone(280, 0.12, 0.2, 'square', 0.12); },
  star: () => [880, 1175, 1568].forEach((f, i) => tone(f, i * 0.06, 0.18, 'triangle', 0.2)),
  pickup: () => tone(660, 0, 0.2, 'sine', 0.2, 1.8),
  jump: () => tone(200, 0, 0.3, 'sine', 0.15, 2.5),
  land: () => noise(0.2, 400, 0.4),
  boost: () => noise(0.12, 3000, 0.04),
  over: () => [523, 392, 330, 262].forEach((f, i) => tone(f, i * 0.15, 0.3, 'triangle', 0.2)),
};

// ---------------------------------------------------------------- input
const keys = new Set(), touchKeys = new Set();
const KEYMAP = { ArrowUp: 'gas', w: 'gas', W: 'gas', ArrowDown: 'brake', s: 'brake', S: 'brake', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ' ': 'drift', Shift: 'nitro' };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && state === 'play') { pause(); return; }
  if (e.key === 'Enter' && (state === 'title' || state === 'over')) { start(); return; }
  if (KEYMAP[e.key]) { keys.add(KEYMAP[e.key]); e.preventDefault(); }
});
addEventListener('keyup', e => { if (KEYMAP[e.key]) keys.delete(KEYMAP[e.key]); });
addEventListener('blur', () => { keys.clear(); touchKeys.clear(); });
for (const b of document.querySelectorAll('#touch button')) {
  const k = b.dataset.k, on = e => { e.preventDefault(); touchKeys.add(k); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch { /* fine */ } ac(); };
  const off = () => { touchKeys.delete(k); b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
}
function readInput() {
  const k = x => keys.has(x) || touchKeys.has(x);
  return { throttle: (k('gas') ? 1 : 0) - (k('brake') ? 1 : 0), steer: (k('right') ? 1 : 0) - (k('left') ? 1 : 0), handbrake: k('drift'), boost: k('nitro') };
}

// ---------------------------------------------------------------- game flow
let state = 'title', last = performance.now(), lastScore = 0, boardFrom = 'title';
function setCarName() { $('c-name').textContent = profile.car[0].toUpperCase() + profile.car.slice(1); }
function toTitle() {
  state = 'title';
  for (const id of ['hud', 'touch', 'over', 'board', 'paused']) $(id).hidden = true;
  $('title').hidden = false; setCarName(); showWorldBest();
  $('how').innerHTML = touchUI ? '▲ gas · ▼ brake/reverse · ◀ ▶ steer · DRIFT handbrake · NOS boost' : 'W / ↑ gas · S / ↓ brake · A D / ← → steer · Space drift · Shift nitro · P pause';
  $('how').innerHTML += '<br>Smash anything for points and chain them for a combo. Drift and jump for more. Stars are +500, clocks add time.<br>People and animals are off limits: bump one and you stop dead and lose points.';
}
function newRun(seed) {
  run = new Run(seed);
  renderer.build(run);
}
function start() {
  ac();
  newRun(params.has('seed') ? +params.get('seed') : undefined);
  board.startRun();
  state = 'play';
  for (const id of ['title', 'over', 'board', 'paused']) $(id).hidden = true;
  $('hud').hidden = false; $('touch').hidden = !touchUI; document.body.classList.toggle('touching', touchUI);
  flash('GO!');
}
function pause() { if (state !== 'play') return; state = 'paused'; $('paused').hidden = false; engineSound(0, false); }
function gameOver() {
  state = 'over'; engineSound(0, false); sfx.over();
  const score = Math.max(0, run.score), isBest = score > profile.best;
  if (isBest) profile.best = score; save();
  $('o-score').textContent = score.toLocaleString();
  $('o-best').textContent = isBest && score ? '🏆 New best!' : 'Best ' + profile.best.toLocaleString();
  $('o-stats').textContent = `${run.smashed} things smashed · ${run.penalties} near-misses gone wrong`;
  $('hud').hidden = true; $('touch').hidden = true; $('over').hidden = false;
  lastScore = score; postScore(score);
}
let flashT = 0;
function flash(text) { $('msg').textContent = text; $('msg').style.opacity = 1; clearTimeout(flashT); flashT = setTimeout(() => { $('msg').style.opacity = 0; }, 1100); }
function pop(text, x, z, cls = '') {
  const p = renderer.project(x, 2.5, z); if (p.behind || p.x < -50 || p.x > innerWidth + 50) return;
  const d = document.createElement('div'); d.className = cls; d.textContent = text; d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
  $('pops').append(d); setTimeout(() => d.remove(), 1000);
}

// ---------------------------------------------------------------- leaderboard
function setRank(text, gold) { $('o-rank').textContent = text; $('o-rank').classList.toggle('gold', !!gold); $('o-rank').hidden = !text; }
function postScore(score) {
  $('o-form').hidden = true; setRank('');
  if (!board.enabled || score <= 0) return;
  if (!board.name) { setRank('Add your name to join the world leaderboard'); $('o-form').hidden = false; return; }
  setRank('Sending score…');
  board.submit(score, profile.car).then(d => { setRank(d.rank ? `World rank #${d.rank}${d.rank <= 3 ? ' 🏆' : ''}` : 'Not in the top 100 yet', d.rank && d.rank <= 20); })
    .catch(e => { setRank(e.message); if (/name/i.test(e.message)) { $('o-name').value = board.name; $('o-form').hidden = false; } });
}
$('o-form').addEventListener('submit', e => { e.preventDefault(); const n = $('o-name').value.replace(/\s+/g, ' ').trim().slice(0, 14); if (!n) return; board.setName(n); $('o-form').hidden = true; postScore(lastScore); });
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderBoard(rows, msg) {
  const me = board.name.toLowerCase();
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
function showWorldBest() {
  if (!board.enabled) return;
  board.fetchTop().then(rows => { const b = rows[0]; $('t-world').hidden = !b; if (b) $('t-world').textContent = `World best: ${b.name} · ${Number(b.score).toLocaleString()}`; }).catch(() => {});
}

// ---------------------------------------------------------------- buttons
$('play').addEventListener('click', start);
$('again').addEventListener('click', start);
$('menu').addEventListener('click', toTitle);
$('trophy').addEventListener('click', openBoard);
$('o-board').addEventListener('click', openBoard);
$('b-close').addEventListener('click', () => { $('board').hidden = true; if (boardFrom === 'over') { state = 'over'; $('over').hidden = false; } else toTitle(); });
$('b-name').addEventListener('click', () => { const n = (prompt('Name for the leaderboard (max 14 letters):', board.name) || '').replace(/\s+/g, ' ').trim().slice(0, 14); if (n) { board.setName(n); renderBoard(board.top); } });
$('pause').addEventListener('click', pause);
$('resume').addEventListener('click', () => { state = 'play'; $('paused').hidden = true; last = performance.now(); });
$('quit').addEventListener('click', toTitle);
$('mute').addEventListener('click', () => { profile.muted = !profile.muted; save(); $('mute').textContent = profile.muted ? '🔇' : '🔊'; if (profile.muted) engineSound(0, false); });
$('mute').textContent = profile.muted ? '🔇' : '🔊';
const stepCar = d => { profile.car = CARS[(CARS.indexOf(profile.car) + d + CARS.length) % CARS.length]; save(); setCarName(); renderer.setCar(profile.car); };
$('c-prev').addEventListener('click', () => stepCar(-1));
$('c-next').addEventListener('click', () => stepCar(1));
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
addEventListener('resize', () => renderer.resize());

// ---------------------------------------------------------------- minimap
const map = $('map'), mg = map.getContext('2d');
function drawMap() {
  const c = run.car, R = 75, scale = 0.9;
  mg.clearRect(0, 0, 150, 150);
  mg.save(); mg.beginPath(); mg.arc(R, R, R, 0, 7); mg.clip();
  mg.translate(R, R); mg.rotate(Math.PI + c.h); mg.scale(scale, scale); mg.translate(-c.x, -c.z);
  mg.fillStyle = 'rgba(120,170,100,.55)'; mg.fillRect(-20, -20, SIZE + 40, SIZE + 40);
  mg.fillStyle = 'rgba(40,44,52,.9)';
  for (let k = 0; k <= N; k++) { mg.fillRect(-ROAD / 2, k * PITCH - ROAD / 2, SIZE + ROAD, ROAD); mg.fillRect(k * PITCH - ROAD / 2, -ROAD / 2, ROAD, SIZE + ROAD); }
  mg.fillStyle = 'rgba(200,190,170,.85)'; for (const b of run.city.buildings) mg.fillRect(b.x0, b.z0, b.x1 - b.x0, b.z1 - b.z0);
  for (const p of run.city.pickups) if (!p.taken) { mg.fillStyle = p.kind === 'star' ? '#ffd23f' : p.kind === 'clock' ? '#ffffff' : '#3ab8ff'; mg.beginPath(); mg.arc(p.x, p.z, 4, 0, 7); mg.fill(); }
  mg.restore();
  mg.fillStyle = '#ff3a3a'; mg.beginPath(); mg.moveTo(R, R - 9); mg.lineTo(R - 6, R + 7); mg.lineTo(R + 6, R + 7); mg.fill();
}

// ---------------------------------------------------------------- loop
let comboShown = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  let inp = {};
  if (state === 'play' || state === 'title') {
    inp = state === 'title' || autopilot ? botInput(run) : readInput();
    let left = dt;
    while (left > 1e-6) { const h = Math.min(1 / 120, left); run.step(h, inp); left -= h; }
    if (state === 'title' && run.timeLeft < 30) run.timeLeft = 120;
    for (const e of run.takeEvents()) {
      if (state === 'title') { if (e.type === 'smash') renderer.smashFx(e); else if (e.type === 'respawn') renderer.respawn(e.id); continue; }
      switch (e.type) {
        case 'smash': renderer.smashFx(e); sfx.smash(e.combo); break;
        case 'respawn': renderer.respawn(e.id); break;
        case 'points': pop((e.pts > 0 ? '+' : '') + e.pts.toLocaleString() + (e.label && !/Careful|animals/.test(e.label) ? ' ' + e.label : ''), e.x, e.z, e.pts < 0 ? 'bad' : e.pts >= 300 || e.label ? 'big' : ''); if (e.label && e.pts > 0) flash(e.label); break;
        case 'oops': sfx.oops(); flash(ANIMALS.includes(e.kind) ? 'Leave the animals alone! −250' : 'Watch out for people! −250'); renderer.shake = 0.35; break;
        case 'crash': sfx.crash(e.hard); renderer.shake = e.hard ? 0.6 : 0.25; renderer.puff(e.x, 0.8, e.z, 4, 0xffd27a); break;
        case 'pickup': if (e.kind === 'star') sfx.star(); else { sfx.pickup(); flash(e.kind === 'clock' ? '+8 seconds' : 'Nitro!'); } break;
        case 'jump': sfx.jump(); break;
        case 'land': sfx.land(); if (e.hard) renderer.shake = 0.4; break;
        case 'boost': if (Math.random() < 0.15) sfx.boost(); break;
        case 'over': gameOver(); break;
      }
    }
    if (state === 'play' || state === 'over') {
      $('score').textContent = Math.max(0, run.score).toLocaleString();
      $('combo').textContent = run.combo > 1 ? `×${run.combo} COMBO` : '';
      if (run.combo !== comboShown) { comboShown = run.combo; $('combo').classList.add('pop'); setTimeout(() => $('combo').classList.remove('pop'), 100); }
      const s = Math.ceil(run.timeLeft); $('time').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; $('time').classList.toggle('low', run.timeLeft < 10);
      $('speed').textContent = Math.round(run.speed * 3.6); $('nitro').style.width = run.car.nitro * 100 + '%';
      drawMap();
      engineSound(run.speed, state === 'play');
    }
  }
  renderer.update(state === 'paused' ? 0 : dt, t, inp, state === 'title');
}
toTitle();
requestAnimationFrame(frame);
if (autopilot) start();
window.__wreck = { get run() { return run; }, get state() { return state; }, start, renderer, profile };
