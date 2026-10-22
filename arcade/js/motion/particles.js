// One pooled particle system on a single overlay canvas (#fx): ember bursts, hearts, confetti, sparks.
// Capped, scaled by the quality governor, and idle (no loop at all) when nothing is alive.
import { addTask, isFull, quality } from './engine.js';

const MAX = 320, pool = [];
let cv, ctx, W = 0, H = 0, dpr = 1, running = false;
const COLORS = ['#ff7518', '#ff8c32', '#ffb347', '#ffd08a'];
function size() {
  cv = cv || document.getElementById('fx'); if (!cv) return false;
  dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
  cv.width = W * dpr; cv.height = H * dpr; ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return true;
}
addEventListener('resize', () => { if (cv) size(); });

const HEART = new Path2D('M0 3.5C-4.4.4-4.8-2.6-2.8-3.6-1.6-4.2-.5-3.6 0-2.6.5-3.6 1.6-4.2 2.8-3.6 4.8-2.6 4.4.4 0 3.5Z');
export function burst(x, y, { count = 18, shape = 'dot', spread = 1, power = 1, gravity = 900, colors = COLORS, up = false } = {}) {
  if (!isFull() || quality === 0) return;
  if (!ctx && !size()) return;
  const n = Math.round(count * (quality === 1 ? .4 : quality === 2 ? .7 : 1));
  for (let i = 0; i < n && pool.length < MAX; i++) {
    const a = up ? -Math.PI / 2 + (Math.random() - .5) * Math.PI * .9 * spread : Math.random() * Math.PI * 2;
    const v = (160 + Math.random() * 380) * power;
    pool.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (shape === 'confetti' ? 240 : 0), g: gravity, life: 1, decay: .7 + Math.random() * .9,
      s: shape === 'confetti' ? 4 + Math.random() * 5 : shape === 'heart' ? 1.1 + Math.random() * .9 : 1.2 + Math.random() * 2.4,
      rot: Math.random() * 6, vr: (Math.random() - .5) * 14, shape, c: colors[Math.random() * colors.length | 0] });
  }
  if (!running) loop();
}
function loop() {
  running = true;
  addTask(dt => {
    ctx.clearRect(0, 0, W, H);
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i];
      p.vy += p.g * dt; p.vx *= 1 - 1.6 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= p.decay * dt;
      if (p.life <= 0 || p.y > H + 40) { pool.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = p.c;
      if (p.shape === 'confetti') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); }
      else if (p.shape === 'heart') { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s); ctx.fill(HEART); ctx.restore(); }
      else { ctx.shadowColor = p.c; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0; }
    }
    ctx.globalAlpha = 1;
    if (!pool.length) { ctx.clearRect(0, 0, W, H); running = false; return false; }
  });
}
export const emberBurst = (x, y, o) => burst(x, y, { count: 22, ...o });
export const confettiBurst = (x, y, o) => burst(x, y, { count: 90, shape: 'confetti', power: 1.6, gravity: 700, colors: [...COLORS, '#f2f5fa'], ...o });
export function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
