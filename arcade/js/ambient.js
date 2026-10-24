// Ambient background on one canvas, driven by the motion engine: a faded graphite grid with occasional orange
// power surges, signal nodes racing along grid lines with comet trails (a spark when two meet), embers rising and
// pushed away by the pointer (plus soft far-layer bokeh), and faint code fragments. Mood shifts per section.
// Capped (≤60 desktop / ≤20 phone), scaled by the quality governor, and fully stopped when Background effects is
// off, motion is not Full, or the tab is hidden.
import { addTask, isFull, bgOn, quality, onQuality, onLevel } from './motion/engine.js';

const FRAGS = ['<play/>', '{ score++ }', '// insert coin', 'while(alive)', '0x1UP', 'ready();', '=> next', 'HI-SCORE 999990', 'fn hop()', 'press(START)'];
const MOODS = { discover: [1, 1, 1], featured: [1, 1, .8], popular: [1.6, 1, .8], categories: [1.1, 1.2, 1], lobby: [1, 1.6, 1], shelf: [.8, 1, .7], library: [.7, .9, .8], favourites: [1.2, .8, .8], profile: [1, 1, 1.1], idea: [.9, 1, 2.2] };
let cv, ctx, W = 0, H = 0, dpr = 1, gridImg = null, G = 56, small = false;
let nodes = [], embers = [], frags = [], surges = [], sparks = [];
let stop = null, mood = [1, 1, 1], target = [1, 1, 1], px = -999, py = -999, last = 0;

function layout() {
  cv = cv || document.getElementById('ambient'); if (!cv) return false;
  dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  if (W < 2 || H < 2) { ctx = null; return false; }
  small = W < 700; G = small ? 44 : 56;
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  gridImg = document.createElement('canvas'); gridImg.width = cv.width; gridImg.height = cv.height;
  const g = gridImg.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.strokeStyle = 'rgba(120,140,165,.075)'; g.lineWidth = 1; g.beginPath();
  for (let x = (W % G) / 2; x < W; x += G) { g.moveTo(x + .5, 0); g.lineTo(x + .5, H); }
  for (let y = 0; y < H; y += G) { g.moveTo(0, y + .5); g.lineTo(W, y + .5); }
  g.stroke();
  const fade = g.createRadialGradient(W * .55, H * .35, 0, W * .55, H * .35, Math.max(W, H) * .75);
  fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(8,11,16,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = fade; g.fillRect(0, 0, W, H);
  populate();
  return true;
}
function caps() { const q = quality; const max = small ? 20 : 60; return { embers: Math.round(max * (q >= 3 ? .62 : q === 2 ? .4 : .2)), bokeh: q >= 3 && !small ? 6 : 0, nodes: small ? 3 : q >= 2 ? 6 : 3, frags: small || q < 2 ? 0 : 6 }; }
function populate() {
  const c = caps();
  nodes = Array.from({ length: c.nodes }, node);
  embers = [...Array.from({ length: c.embers }, () => ember(true)), ...Array.from({ length: c.bokeh }, () => ember(true, true))];
  frags = Array.from({ length: c.frags }, (_, i) => ({ t: FRAGS[(i * 3) % FRAGS.length], x: Math.random() * W, y: H * (.12 + i * .14), v: 4 + Math.random() * 6, a: .05 + Math.random() * .05 }));
}
function node() {
  const horiz = Math.random() < .5;
  return { horiz, p: Math.random() * (horiz ? W : H), line: Math.floor(Math.random() * ((horiz ? H : W) / G)) * G + (horiz ? 0 : (W % G) / 2), v: (40 + Math.random() * 70) * (Math.random() < .5 ? -1 : 1), life: 3 + Math.random() * 5 };
}
function ember(any, bokeh = false) {
  return { x: Math.random() * W, y: any ? Math.random() * H : H + 10, r: bokeh ? 6 + Math.random() * 12 : .6 + Math.random() * 1.6, vy: bokeh ? 4 + Math.random() * 5 : 8 + Math.random() * 16,
    vx: -3 + Math.random() * 6, a: bokeh ? .04 + Math.random() * .05 : .15 + Math.random() * .45, ph: Math.random() * 6.28, bokeh, ox: 0, oy: 0 };
}

function draw(dt, time) {
  if (!ctx || !gridImg) return;
  for (let i = 0; i < 3; i++) mood[i] += (target[i] - mood[i]) * Math.min(1, dt * 1.5);
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(gridImg, 0, 0, W, H);
  // power surges: a grid line briefly lights orange and fades
  if (Math.random() < dt * .25) { const horiz = Math.random() < .5; surges.push({ horiz, at: horiz ? Math.floor(Math.random() * (H / G)) * G : Math.floor(Math.random() * (W / G)) * G + (W % G) / 2, life: 1 }); }
  for (let i = surges.length - 1; i >= 0; i--) {
    const s = surges[i]; s.life -= dt * .9; if (s.life <= 0) { surges.splice(i, 1); continue; }
    const gr = s.horiz ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(255,117,24,0)'); gr.addColorStop(.5, `rgba(255,140,50,${(.22 * s.life).toFixed(3)})`); gr.addColorStop(1, 'rgba(255,117,24,0)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.5; ctx.beginPath();
    if (s.horiz) { ctx.moveTo(0, s.at + .5); ctx.lineTo(W, s.at + .5); } else { ctx.moveTo(s.at + .5, 0); ctx.lineTo(s.at + .5, H); }
    ctx.stroke();
  }
  // signal nodes with comet trails; a spark when two meet
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]; n.p += n.v * dt * mood[1]; n.life -= dt;
    if (n.life < 0 || n.p < -60 || n.p > (n.horiz ? W : H) + 60) { nodes[i] = node(); continue; }
    const x = n.horiz ? n.p : n.line, y = n.horiz ? n.line : n.p, len = 70, tx = n.horiz ? -Math.sign(n.v) * len : 0, ty = n.horiz ? 0 : -Math.sign(n.v) * len;
    const gr = ctx.createLinearGradient(x + tx, y + ty, x, y); gr.addColorStop(0, 'rgba(255,117,24,0)'); gr.addColorStop(1, 'rgba(255,160,70,.6)');
    ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x + tx, y + ty); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,110,.95)'; ctx.beginPath(); ctx.arc(x, y, 1.9, 0, 6.283); ctx.fill();
    for (let j = i + 1; j < nodes.length; j++) {
      const m = nodes[j]; if (m.horiz === n.horiz) continue;
      const mx = m.horiz ? m.p : m.line, my = m.horiz ? m.line : m.p;
      if (Math.abs(mx - x) < 4 && Math.abs(my - y) < 4 && sparks.length < 12) for (let k = 0; k < 6; k++) sparks.push({ x, y, vx: (Math.random() - .5) * 160, vy: (Math.random() - .5) * 160, life: .6 });
    }
  }
  for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; ctx.fillStyle = `rgba(255,208,138,${(s.life * 1.4).toFixed(2)})`; ctx.fillRect(s.x, s.y, 2, 2); }
  // embers rising, pushed away by the pointer (repel radius ~120 px); far-layer bokeh drawn soft
  for (let i = 0; i < embers.length; i++) {
    const e = embers[i]; e.y -= e.vy * dt * mood[0]; e.x += (e.vx + Math.sin(time + e.ph) * 4) * dt;
    if (!e.bokeh && px > -900) {
      const dx = e.x + e.ox - px, dy = e.y + e.oy - py, d2 = dx * dx + dy * dy;
      if (d2 < 14400) { const d = Math.sqrt(d2) || 1, f = (120 - d) / 120 * 90 * dt; e.ox += dx / d * f; e.oy += dy / d * f; }
    }
    e.ox *= 1 - dt * .9; e.oy *= 1 - dt * .9;
    if (e.y < -20) { embers[i] = ember(false, e.bokeh); continue; }
    const fl = .7 + .3 * Math.sin(time * 2 + e.ph), x = e.x + e.ox, y = e.y + e.oy;
    if (e.bokeh) { const g = ctx.createRadialGradient(x, y, 0, x, y, e.r); g.addColorStop(0, `rgba(255,150,60,${(e.a * fl).toFixed(3)})`); g.addColorStop(1, 'rgba(255,117,24,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, e.r, 0, 6.283); ctx.fill(); }
    else { ctx.fillStyle = `rgba(255,${130 + (e.r * 30 | 0)},60,${(e.a * fl).toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, e.r, 0, 6.283); ctx.fill(); }
  }
  // faint code fragments
  if (frags.length) {
    ctx.font = '12px "JetBrains Mono", monospace';
    for (const f of frags) { f.x += f.v * dt; if (f.x > W + 140) f.x = -160; ctx.fillStyle = `rgba(255,150,80,${(f.a * mood[2]).toFixed(3)})`; ctx.fillText(f.t, f.x, f.y); }
  }
}

function run() {
  const want = bgOn() && isFull() && !document.hidden && quality > 0;
  if (!ctx && !layout()) return;
  if (want && !stop) { last = 0; stop = addTask((dt, now) => { if (!(bgOn() && isFull() && quality > 0)) { stop = null; still(); return false; } draw(dt, now / 1000); }); }
  else if (!want && stop) { stop(); stop = null; still(); }
  else if (!want) still();
}
function still() { if (!ctx) return; if (bgOn()) draw(0, 0); else ctx.clearRect(0, 0, W, H); }

export function initAmbient() {
  layout(); run();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); run(); }, 200); });
  document.addEventListener('visibilitychange', run);
  onLevel(run); onQuality(() => { populate(); run(); });
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });
  document.addEventListener('pointerleave', () => { px = py = -999; });
  // section moods
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && MOODS[e.target.id]) target = MOODS[e.target.id]; }), { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(MOODS).forEach(id => { const s = document.getElementById(id); if (s) io.observe(s); });
}
export { run as updateAmbient };
