// Dev-only: draw the whole level (or a region) for eyeballing geometry.
// /tools/overview.html?x0=..&x1=..&y0=..&y1=..&ppm=..
import { mountainLevel } from '../src/sim/levels/mountain';
import { cleanPolygon } from '../src/sim/geom';

const q = new URLSearchParams(location.search);
const level = mountainLevel();
const x0 = Number(q.get('x0') ?? -28), x1 = Number(q.get('x1') ?? 192);
const y0 = Number(q.get('y0') ?? -14), y1 = Number(q.get('y1') ?? 222);
const ppm = Number(q.get('ppm') ?? 4);
const c = document.getElementById('c') as HTMLCanvasElement;
c.width = Math.round((x1 - x0) * ppm);
c.height = Math.round((y1 - y0) * ppm);
const ctx = c.getContext('2d')!;
const sx = (x: number) => (x - x0) * ppm;
const sy = (y: number) => (y1 - y) * ppm;
ctx.fillStyle = '#26303d';
ctx.fillRect(0, 0, c.width, c.height);
// grid every 10 m
ctx.strokeStyle = 'rgba(255,255,255,0.07)';
ctx.fillStyle = 'rgba(255,255,255,0.35)';
ctx.font = `${Math.max(9, ppm * 1.6)}px monospace`;
for (let x = Math.ceil(x0 / 10) * 10; x <= x1; x += 10) { ctx.beginPath(); ctx.moveTo(sx(x), 0); ctx.lineTo(sx(x), c.height); ctx.stroke(); ctx.fillText(String(x), sx(x) + 2, c.height - 4); }
for (let y = Math.ceil(y0 / 10) * 10; y <= y1; y += 10) { ctx.beginPath(); ctx.moveTo(0, sy(y)); ctx.lineTo(c.width, sy(y)); ctx.stroke(); ctx.fillText(String(y), 2, sy(y) - 2); }
const col: Record<string, string> = { rock: '#8a7b6c', wood: '#7a5230', ice: '#a9dcf0', snow: '#eef', metal: '#999' };
for (const s of level.solids) {
  const pts = cleanPolygon(s.pts);
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(sx(p.x), sy(p.y)) : ctx.moveTo(sx(p.x), sy(p.y))));
  ctx.closePath();
  ctx.fillStyle = s.style === 'summit' ? '#d8b25a' : col[s.mat];
  ctx.globalAlpha = 0.85;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.stroke();
}
// spawn + summit
ctx.fillStyle = '#4f4';
ctx.fillRect(sx(level.spawn.x) - 3, sy(level.spawn.y) - 3, 6, 6);
const s = level.summit;
ctx.strokeStyle = '#ff0';
ctx.strokeRect(sx(s.x0), sy(s.y1), (s.x1 - s.x0) * ppm, (s.y1 - s.y0) * ppm);
for (const sec of level.sections) { ctx.fillStyle = '#fc6'; ctx.fillText(sec.name, sx(x0) + 30, sy(sec.y0) - 3); }
(window as any).__done = true;
