import { FRUITS, MODES, newGame, step, slice, takeEvents, segmentHits } from './logic.js';

const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const store = {
  get(k, d) { try { const v = localStorage.getItem('fruitninja.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('fruitninja.' + k, JSON.stringify(v)); } catch { /* storage blocked */ } },
};
let muted = store.get('muted', false);
let W = 0, H = 0, dpr = 1, wood = null;

// ---------------------------------------------------------------- sound
let actx = null, noise = null;
function ac() {
  if (muted) return null;
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { actx = new AC(); } catch { return null; }
    noise = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function burst(dur, f0, f1, vol, type = 'bandpass') {
  const c = ac(); if (!c) return;
  const t = c.currentTime, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise; fl.type = type; fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = 1.2;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur);
}
function tone(f, at, dur, type = 'sine', vol = 0.3, slide = 1) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  swish: () => burst(0.16, 2400, 900, 0.25),
  splat: () => { burst(0.18, 900, 300, 0.5, 'lowpass'); tone(160 + Math.random() * 60, 0, 0.12, 'sine', 0.35, 0.6); },
  throw: () => burst(0.25, 400, 1200, 0.06),
  bomb: () => { burst(0.9, 1200, 60, 0.9, 'lowpass'); tone(70, 0, 0.8, 'sawtooth', 0.4, 0.4); },
  combo: n => { for (let i = 0; i < Math.min(n, 6); i++) tone(523 * Math.pow(1.122, i), i * 0.06, 0.2, 'triangle', 0.25); },
  miss: () => tone(220, 0, 0.3, 'square', 0.15, 0.6),
  over: () => [392, 330, 262].forEach((f, i) => tone(f, i * 0.2, 0.35, 'triangle', 0.25)),
  power: () => [660, 880, 1320].forEach((f, i) => tone(f, i * 0.07, 0.2, 'sine', 0.3)),
};

// ---------------------------------------------------------------- drawing
function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // wooden planks, drawn once
  wood = document.createElement('canvas'); wood.width = W * dpr; wood.height = H * dpr;
  const w = wood.getContext('2d'); w.scale(dpr, dpr);
  const plank = Math.max(70, H / 7);
  for (let y = 0, i = 0; y < H; y += plank, i++) {
    const g = w.createLinearGradient(0, y, 0, y + plank);
    const base = [['#7a4a24', '#5e3618'], ['#6e4220', '#563216'], ['#83512a', '#61391a']][i % 3];
    g.addColorStop(0, base[0]); g.addColorStop(1, base[1]);
    w.fillStyle = g; w.fillRect(0, y, W, plank);
    w.strokeStyle = 'rgba(0,0,0,.35)'; w.lineWidth = 3; w.beginPath(); w.moveTo(0, y + 1); w.lineTo(W, y + 1); w.stroke();
    w.strokeStyle = 'rgba(40,20,5,.18)'; w.lineWidth = 1.2;
    for (let k = 0; k < 7; k++) { const yy = y + 8 + Math.random() * (plank - 16); w.beginPath(); w.moveTo(0, yy); for (let x = 0; x <= W; x += 40) w.lineTo(x, yy + Math.sin(x * 0.01 + k) * 3); w.stroke(); }
    for (let k = 0; k < 2; k++) { w.fillStyle = 'rgba(40,20,5,.25)'; w.beginPath(); w.ellipse(Math.random() * W, y + plank / 2, 10, 5, 0, 0, 7); w.fill(); }
  }
  const v = w.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.5)');
  w.fillStyle = v; w.fillRect(0, 0, W, H);
  if (game) { game.w = W; game.h = H; }
  layoutMenu();
}

function fruitBody(kind, r) {
  const f = FRUITS[kind];
  const ry = r / (f.oval || 1);
  const g = ctx.createRadialGradient(-r * 0.35, -ry * 0.4, r * 0.1, 0, 0, r * 1.05);
  g.addColorStop(0, '#ffffffaa'); g.addColorStop(0.12, f.skin); g.addColorStop(1, f.skin2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, ry, 0, 0, Math.PI * 2); ctx.fill();
  if (f.stripes) { ctx.strokeStyle = '#13521b'; ctx.lineWidth = r * 0.12; for (const a of [-0.55, -0.15, 0.25, 0.65]) { ctx.beginPath(); ctx.ellipse(r * a, 0, r * 0.18, ry * 0.95, 0, -1.3, 1.3); ctx.stroke(); } }
  if (kind === 'pineapple') { ctx.strokeStyle = 'rgba(120,70,0,.6)'; ctx.lineWidth = 2; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.3 - r, -ry); ctx.lineTo(i * r * 0.3 + r, ry); ctx.moveTo(i * r * 0.3 + r, -ry); ctx.lineTo(i * r * 0.3 - r, ry); ctx.stroke(); } }
  if (kind === 'strawberry') { ctx.fillStyle = '#ffe36a'; for (let i = 0; i < 12; i++) { const a = i * 2.4, d = (i % 3 + 1) * r * 0.25; ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d * 0.9 + r * 0.1, 1.6, 2.4, a, 0, 7); ctx.fill(); } }
  if (kind === 'coconut' || kind === 'kiwi') { ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; for (let i = 0; i < 26; i++) { const a = i * 0.8, d = r * (0.3 + (i % 5) * 0.14); ctx.beginPath(); ctx.moveTo(Math.cos(a) * d, Math.sin(a) * d); ctx.lineTo(Math.cos(a) * d + 3, Math.sin(a) * d + 2); ctx.stroke(); } }
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -ry * 0.45, r * 0.28, ry * 0.16, -0.6, 0, 7); ctx.fill();
}
function fruitTop(kind, r) {
  const f = FRUITS[kind], ry = r / (f.oval || 1);
  if (f.leaf || kind === 'strawberry') {
    ctx.fillStyle = '#3f8f2a';
    if (kind === 'strawberry') { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.18, -ry * 0.95, r * 0.12, r * 0.3, i * 0.5, 0, 7); ctx.fill(); } }
    else { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2, -ry - 8, 4, 12); ctx.fillStyle = '#3f8f2a'; ctx.beginPath(); ctx.ellipse(r * 0.25, -ry - 4, r * 0.28, r * 0.12, -0.5, 0, 7); ctx.fill(); }
  }
  if (f.crown) { ctx.fillStyle = '#3f9b2f'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.15 - 6, -ry + 4); ctx.lineTo(i * r * 0.28, -ry - r * (0.8 - Math.abs(i) * 0.15)); ctx.lineTo(i * r * 0.15 + 6, -ry + 4); ctx.fill(); } }
}
function drawThing(t) {
  ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot);
  if (t.kind === 'bomb') {
    const g = ctx.createRadialGradient(-t.r * 0.3, -t.r * 0.3, 2, 0, 0, t.r);
    g.addColorStop(0, '#6a6a7a'); g.addColorStop(1, '#0a0a10');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, t.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff2a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(9, 9); ctx.moveTo(9, -9); ctx.lineTo(-9, 9); ctx.stroke();
    ctx.fillStyle = '#4a4a55'; ctx.fillRect(-6, -t.r - 8, 12, 10);
    ctx.strokeStyle = '#c8a060'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -t.r - 8); ctx.quadraticCurveTo(10, -t.r - 22, 18, -t.r - 18); ctx.stroke();
    const sp = 6 + Math.random() * 6; ctx.fillStyle = Math.random() < 0.5 ? '#ffdd55' : '#ff7a2a';
    ctx.beginPath(); ctx.arc(18, -t.r - 18, sp / 2, 0, 7); ctx.fill();
  } else if (t.kind === 'frenzy' || t.kind === 'freeze') {
    ctx.shadowColor = t.kind === 'frenzy' ? '#ff4a2a' : '#4ad8ff'; ctx.shadowBlur = 25;
    ctx.fillStyle = t.kind === 'frenzy' ? '#ffe14a' : '#9fe8ff';
    ctx.beginPath(); ctx.arc(0, -t.r * 0.9, t.r * 1.4, 0.35 * Math.PI, 0.65 * Math.PI, false); ctx.arc(0, -t.r * 1.5, t.r * 1.6, 0.62 * Math.PI, 0.38 * Math.PI, true); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#5a3a1a'; ctx.fillRect(t.r * 0.55, -t.r * 0.05, 6, 6);
  } else { fruitBody(t.kind, t.r); fruitTop(t.kind, t.r); }
  ctx.restore();
}
function drawHalf(h) {
  if (!FRUITS[h.kind]) return;
  const f = FRUITS[h.kind], r = h.r, ry = r / (f.oval || 1);
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
  ctx.beginPath(); ctx.rect(-r * 2, h.side < 0 ? -r * 2 : 0, r * 4, r * 2); ctx.clip();
  fruitBody(h.kind, r);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.15, f.flesh); g.addColorStop(1, f.flesh);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, ry * 0.32, 0, 0, 7); ctx.fill();
  if (f.seeds) { ctx.fillStyle = h.kind === 'kiwi' ? '#1a1a1a' : h.kind === 'strawberry' ? '#ffe36a' : '#1a1a1a'; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.2, h.side * ry * 0.08, 1.8, 2.8, 0, 0, 7); ctx.fill(); } }
  ctx.restore();
}

// ---------------------------------------------------------------- effects
let stains = [], drops = [], texts = [], flash = 0;
function splat(x, y, color, r) {
  stains.push({ x, y, r: r * (1.2 + Math.random() * 0.6), color, life: 3, blobs: Array.from({ length: 7 }, () => [Math.random() * 6.28, 0.3 + Math.random() * 0.8, 0.2 + Math.random() * 0.35]) });
  if (stains.length > 30) stains.shift();
  for (let i = 0; i < 16; i++) { const a = Math.random() * 6.28, s = 120 + Math.random() * 340; drops.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 150, r: 2 + Math.random() * 4, color, life: 0.7 + Math.random() * 0.4 }); }
}
function popText(text, x, y, color = '#ffd84a', size = 34) { texts.push({ text, x, y, color, size, life: 1.1 }); }

// ---------------------------------------------------------------- blade
let trail = [], down = false, lastPt = null;
function bladeTo(x, y) {
  const now = performance.now() / 1000;
  trail.push({ x, y, t: now });
  if (lastPt) {
    const d = Math.hypot(x - lastPt.x, y - lastPt.y);
    if (d > 2) {
      if (state === 'play' && !paused) { const n = slice(game, lastPt.x, lastPt.y, x, y); if (n) handleEvents(); }
      if (state === 'menu') menuSlice(lastPt.x, lastPt.y, x, y);
      if (d > 30 && now - lastSwish > 0.18) { sfx.swish(); lastSwish = now; }
    }
  }
  lastPt = { x, y };
}
let lastSwish = 0;
canvas.addEventListener('pointerdown', e => { ac(); down = true; lastPt = null; trail = []; bladeTo(e.clientX, e.clientY); canvas.setPointerCapture?.(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (down) for (const c of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) bladeTo(c.clientX, c.clientY); });
addEventListener('pointerup', () => { down = false; lastPt = null; });
addEventListener('pointercancel', () => { down = false; lastPt = null; });
function drawTrail() {
  const now = performance.now() / 1000;
  trail = trail.filter(p => now - p.t < 0.14);
  if (trail.length < 2) return;
  for (const [width, color] of [[14, 'rgba(160,220,255,.35)'], [6, '#ffffff']]) {
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i], k = i / trail.length;
      ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineWidth = width * k;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------- menu: slice a fruit to pick a mode
const MENU = [{ mode: 'classic', kind: 'watermelon', label: 'Classic' }, { mode: 'arcade', kind: 'pineapple', label: 'Arcade' }, { mode: 'zen', kind: 'peach', label: 'Zen' }];
function layoutMenu() {
  const n = MENU.length, gap = Math.min(W / (n + 0.4), 240), y = H * (W < 600 ? 0.55 : 0.58), r = Math.min(70, gap * 0.3);
  MENU.forEach((m, i) => { m.x = W / 2 + (i - (n - 1) / 2) * gap; m.y = y; m.r = r; });
  $('labels').innerHTML = MENU.map(m => `<div style="left:${m.x}px;top:${m.y + m.r * 1.75}px">${m.label}</div>`).join('');
}
function menuSlice(x1, y1, x2, y2) {
  for (const m of MENU) if (segmentHits(x1, y1, x2, y2, m.x, m.y, m.r)) {
    splat(m.x, m.y, FRUITS[m.kind].juice, m.r); sfx.splat();
    for (const s of [-1, 1]) menuHalves.push({ kind: m.kind, x: m.x, y: m.y, vx: s * 160, vy: -200, rot: Math.atan2(y2 - y1, x2 - x1), spin: s * 3, side: s, r: m.r });
    setTimeout(() => start(m.mode), 450);
    state = 'starting';
    return;
  }
}
let menuHalves = [];
function drawMenu(t, dt) {
  for (const m of MENU) {
    ctx.save(); ctx.translate(m.x, m.y);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 6; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.arc(0, 0, m.r * 1.45, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.rotate(Math.sin(t * 1.4 + m.x) * 0.25);
    if (state === 'menu') { fruitBody(m.kind, m.r); fruitTop(m.kind, m.r); }
    ctx.restore();
  }
  for (const h of menuHalves) { h.vy += 1250 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.spin * dt; drawHalf(h); }
}

// ---------------------------------------------------------------- game flow
let state = 'menu', game = null, paused = false, best = store.get('best', {});
function start(mode) {
  game = newGame(mode, W, H);
  state = 'play'; paused = false; menuHalves = []; stains = []; drops = []; texts = [];
  $('menu').hidden = true; $('over').hidden = true; $('paused').hidden = true; $('hud').hidden = false;
  $('best').textContent = 'Best ' + (best[mode] || 0);
  updateHud();
}
function toMenu() {
  state = 'menu'; game = null; menuHalves = [];
  $('menu').hidden = false; $('over').hidden = true; $('paused').hidden = true; $('hud').hidden = true;
}
function gameOver() {
  state = 'over';
  const m = game.mode, prev = best[m] || 0, isBest = game.score > prev;
  if (isBest) { best[m] = game.score; store.set('best', best); }
  $('over-title').textContent = game.why === 'time' ? "Time's up!" : 'Game Over';
  $('over-why').textContent = game.why === 'bomb' ? 'You sliced a bomb!' : game.why === 'missed' ? 'Three fruit got away.' : MODES[m].name + ' mode';
  $('final').textContent = game.score;
  $('final-best').textContent = isBest && game.score ? '🏆 New best!' : 'Best ' + Math.max(prev, game.score);
  setTimeout(() => { if (state === 'over') $('over').hidden = false; }, game.why === 'bomb' ? 900 : 300);
  sfx.over();
}
function handleEvents() {
  for (const e of takeEvents(game)) {
    if (e.type === 'cut') {
      const f = FRUITS[e.kind];
      splat(e.x, e.y, f ? f.juice : e.kind === 'freeze' ? '#9fe8ff' : '#ffe14a', e.r); sfx.splat();
      if (e.pts > 1) popText('+' + e.pts, e.x, e.y - 30, '#ffe14a', 26);
    } else if (e.type === 'combo') { popText(`${e.n} Fruit Combo +${e.n}`, Math.min(W - 140, Math.max(140, e.x)), e.y - 40, '#ffd84a', 30); sfx.combo(e.n); }
    else if (e.type === 'bomb') { flash = 1; sfx.bomb(); if (game.mode !== 'classic') popText('-10', e.x, e.y, '#ff5a5a', 40); }
    else if (e.type === 'miss') { sfx.miss(); popText('✕', e.x, H - 40, '#ff3b3b', 44); }
    else if (e.type === 'power') { sfx.power(); popText(e.kind === 'frenzy' ? 'FRENZY!' : 'FREEZE!', e.x, e.y, e.kind === 'frenzy' ? '#ff7a3a' : '#9fe8ff', 40); }
    else if (e.type === 'over') gameOver();
  }
  updateHud();
}
function updateHud() {
  if (!game) return;
  $('score').textContent = game.score;
  const m = MODES[game.mode];
  $('lives').innerHTML = m.lives ? Array.from({ length: 3 }, (_, i) => `<i class="${i < game.missed ? 'lost' : ''}">✕</i>`).join('') : '';
  $('timer').textContent = m.time ? Math.ceil(game.timeLeft) : '';
  $('timer').classList.toggle('low', !!m.time && game.timeLeft < 10);
  $('power').textContent = game.frenzy > 0 ? '🍌 FRENZY ×2' : game.freeze > 0 ? '❄️ FREEZE' : '';
}

// ---------------------------------------------------------------- loop
let last = performance.now(), thrown = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const t = now / 1000;
  ctx.drawImage(wood, 0, 0, W, H);
  // juice stains fade on the wood
  for (const s of stains) {
    s.life -= dt; ctx.globalAlpha = Math.max(0, Math.min(0.75, s.life / 2));
    ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.6, 0, 7); ctx.fill();
    for (const [a, d, rr] of s.blobs) { ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * s.r * d, s.y + Math.sin(a) * s.r * d, s.r * rr, 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1; stains = stains.filter(s => s.life > 0);
  if (state === 'menu' || state === 'starting') drawMenu(t, dt);
  if (game) {
    if (state === 'play' && !paused) {
      const before = game.wave;
      step(game, dt); handleEvents();
      if (game.wave !== before && t - thrown > 0.3) { sfx.throw(); thrown = t; }
    }
    if (game.freeze > 0) { ctx.fillStyle = 'rgba(120,200,255,.12)'; ctx.fillRect(0, 0, W, H); }
    for (const h of game.halves) drawHalf(h);
    for (const th of game.things) if (th.delay <= 0) drawThing(th);
  }
  for (const d of drops) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; ctx.fillStyle = d.color; ctx.globalAlpha = Math.max(0, Math.min(1, d.life * 2)); ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1; drops = drops.filter(d => d.life > 0);
  for (const x of texts) {
    x.life -= dt; x.y -= 40 * dt;
    ctx.globalAlpha = Math.max(0, Math.min(1, x.life * 2)); ctx.font = `900 ${x.size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(x.text, x.x, x.y); ctx.fillStyle = x.color; ctx.fillText(x.text, x.x, x.y);
  }
  ctx.globalAlpha = 1; texts = texts.filter(x => x.life > 0);
  drawTrail();
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); flash -= dt * 1.5; }
}

// ---------------------------------------------------------------- buttons
document.querySelectorAll('.mode-buttons button').forEach(b => b.addEventListener('click', () => { ac(); start(b.dataset.mode); }));
$('again').addEventListener('click', () => start(game.mode));
$('to-menu').addEventListener('click', toMenu);
$('pause').addEventListener('click', () => { if (state === 'play') { paused = true; $('paused').hidden = false; } });
$('resume').addEventListener('click', () => { paused = false; $('paused').hidden = true; last = performance.now(); });
$('quit').addEventListener('click', toMenu);
$('mute').addEventListener('click', () => { muted = !muted; store.set('muted', muted); $('mute').textContent = muted ? '🔇' : '🔊'; });
$('mute').textContent = muted ? '🔇' : '🔊';
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play' && !paused) { paused = true; $('paused').hidden = false; } });
addEventListener('keydown', e => { if ((e.key === 'Escape' || e.key === 'p') && state === 'play') (paused ? $('resume') : $('pause')).click(); });
addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
window.__fn = { get game() { return game; }, get state() { return state; }, start, slice: (a, b, c, d) => { if (game) { slice(game, a, b, c, d); handleEvents(); } } };
