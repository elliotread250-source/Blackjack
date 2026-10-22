// art.js: every candy is drawn in code (canvas paths + gradients), once per size, then cached
// as little canvases the board blits every frame. Six colours, six shapes, so players who
// cannot tell the colours apart can still tell the candies apart:
//   0 strawberry drop (round, red)    1 toffee block (square, orange)   2 lemon star (yellow)
//   3 lime wedge (triangle, green)    4 blueberry gem (diamond, blue)   5 grape heart (purple)
import { T } from './core.js';

export const CANDIES = [
  { name: 'Strawberry drop', shape: 'circle', light: '#ffb3b8', mid: '#f0364a', dark: '#8f0f2a' },
  { name: 'Toffee block', shape: 'square', light: '#ffd9a0', mid: '#ff9020', dark: '#a8480a' },
  { name: 'Lemon star', shape: 'star', light: '#fff8a8', mid: '#ffd91a', dark: '#b08500' },
  { name: 'Lime wedge', shape: 'triangle', light: '#c8ffa0', mid: '#4ccf3c', dark: '#1a7a22' },
  { name: 'Blueberry gem', shape: 'diamond', light: '#b0e4ff', mid: '#2f8cf5', dark: '#12489c' },
  { name: 'Grape heart', shape: 'heart', light: '#efc2ff', mid: '#a84ee6', dark: '#5a1c94' },
];

function rpoly(ctx, pts, r) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = mid(p, pts[(i + 1) % n]);
    ctx.arcTo(p[0], p[1], q[0], q[1], r);
  }
  ctx.closePath();
}

/** Trace a candy outline centred on (x, y) with "radius" R. */
function outline(ctx, shape, x, y, R) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(x, y, R * 0.98, 0, Math.PI * 2);
  else if (shape === 'square') rpoly(ctx, [[x - 0.86 * R, y - 0.86 * R], [x + 0.86 * R, y - 0.86 * R], [x + 0.86 * R, y + 0.86 * R], [x - 0.86 * R, y + 0.86 * R]], 0.32 * R);
  else if (shape === 'star') {
    const pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? 0.55 * R : 1.12 * R; pts.push([x + Math.cos(a) * rr, y + 0.05 * R + Math.sin(a) * rr]); }
    rpoly(ctx, pts, 0.2 * R);
  } else if (shape === 'triangle') rpoly(ctx, [[x, y - 1.02 * R], [x + 1.0 * R, y + 0.78 * R], [x - 1.0 * R, y + 0.78 * R]], 0.3 * R);
  else if (shape === 'diamond') rpoly(ctx, [[x, y - 1.12 * R], [x + 0.9 * R, y], [x, y + 1.12 * R], [x - 0.9 * R, y]], 0.2 * R);
  else if (shape === 'heart') {
    const s = R / 100;
    ctx.moveTo(x, y + 92 * s);
    ctx.bezierCurveTo(x - 30 * s, y + 66 * s, x - 108 * s, y + 22 * s, x - 100 * s, y - 36 * s);
    ctx.bezierCurveTo(x - 94 * s, y - 86 * s, x - 36 * s, y - 100 * s, x, y - 52 * s);
    ctx.bezierCurveTo(x + 36 * s, y - 100 * s, x + 94 * s, y - 86 * s, x + 100 * s, y - 36 * s);
    ctx.bezierCurveTo(x + 108 * s, y + 22 * s, x + 30 * s, y + 66 * s, x, y + 92 * s);
    ctx.closePath();
  }
}

function paintCandy(ctx, k, x, y, R) {
  const col = CANDIES[k];
  outline(ctx, col.shape, x, y, R);
  const g = ctx.createRadialGradient(x - R * 0.32, y - R * 0.4, R * 0.08, x, y + R * 0.05, R * 1.25);
  g.addColorStop(0, col.light); g.addColorStop(0.5, col.mid); g.addColorStop(1, col.dark);
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(1.5, R * 0.1); ctx.lineJoin = 'round';
  ctx.strokeStyle = col.dark; ctx.stroke();
  // inner rim light
  ctx.save();
  outline(ctx, col.shape, x, y, R); ctx.clip();
  ctx.lineWidth = R * 0.16; ctx.strokeStyle = 'rgba(255,255,255,.16)';
  outline(ctx, col.shape, x, y, R * 0.86); ctx.stroke();
  // gloss
  const gl = ctx.createLinearGradient(x, y - R, x, y);
  gl.addColorStop(0, 'rgba(255,255,255,.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.beginPath(); ctx.ellipse(x - R * 0.2, y - R * 0.5, R * 0.46, R * 0.26, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function sprinkles(ctx, x, y, R, n, seed) {
  const cols = ['#ff5a7a', '#ffd23f', '#5ce1ff', '#9dff6a', '#e08bff', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const a = seed + i * 2.399, d = R * (0.25 + 0.5 * ((i * 37 % 10) / 10));
    ctx.save(); ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d); ctx.rotate(a * 2);
    ctx.fillStyle = cols[i % cols.length];
    const w = R * 0.34, h = R * 0.12;
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill(); ctx.restore();
  }
}

function drawStriped(ctx, k, horiz, S) {
  const x = S / 2, y = S / 2, R = S * 0.37, col = CANDIES[k];
  paintCandy(ctx, k, x, y, R);
  ctx.save();
  outline(ctx, col.shape, x, y, R); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.62)';
  for (const o of [-0.62, -0.2, 0.22, 0.64]) {
    if (horiz) ctx.fillRect(x - R * 1.3, y + o * R - R * 0.09, R * 2.6, R * 0.18);
    else ctx.fillRect(x + o * R - R * 0.09, y - R * 1.3, R * 0.18, R * 2.6);
  }
  ctx.restore();
  // arrows at both ends show which way it blasts
  ctx.fillStyle = '#fff'; ctx.strokeStyle = col.dark; ctx.lineWidth = Math.max(1.2, S * 0.025); ctx.lineJoin = 'round';
  const a = S * 0.1;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    if (horiz) { const px = x + d * R * 0.78; ctx.moveTo(px + d * a, y); ctx.lineTo(px - d * a * 0.2, y - a); ctx.lineTo(px - d * a * 0.2, y + a); }
    else { const py = y + d * R * 0.78; ctx.moveTo(x, py + d * a); ctx.lineTo(x - a, py - d * a * 0.2); ctx.lineTo(x + a, py - d * a * 0.2); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function drawWrapped(ctx, k, S) {
  const x = S / 2, y = S / 2, R = S * 0.3, col = CANDIES[k];
  // twisted wrapper ends
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + d * R * 0.8, y);
    ctx.lineTo(x + d * S * 0.47, y - S * 0.17); ctx.lineTo(x + d * S * 0.42, y); ctx.lineTo(x + d * S * 0.47, y + S * 0.17);
    ctx.closePath();
    const g = ctx.createLinearGradient(x + d * R, y, x + d * S * 0.47, y);
    g.addColorStop(0, col.mid); g.addColorStop(1, col.light);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1.2, S * 0.025); ctx.strokeStyle = col.dark; ctx.lineJoin = 'round'; ctx.stroke();
  }
  paintCandy(ctx, k, x, y, R);
  // cellophane sheen and a white ribbon band
  ctx.save();
  outline(ctx, col.shape, x, y, R); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.fillRect(x - R * 1.2, y - R * 0.14, R * 2.4, R * 0.28);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = Math.max(1.5, S * 0.03);
  outline(ctx, col.shape, x, y, R * 1.14); ctx.stroke();
  ctx.fillStyle = '#fff';
  for (const [dx, dy, r] of [[0.28, -0.3, 0.06], [-0.2, 0.2, 0.04]]) { ctx.beginPath(); ctx.arc(x + dx * S, y + dy * S, r * S, 0, 7); ctx.fill(); }
}

function drawBomb(ctx, S) {
  const x = S / 2, y = S / 2, R = S * 0.4;
  const g = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R * 1.1);
  g.addColorStop(0, '#9a6340'); g.addColorStop(0.55, '#52301b'); g.addColorStop(1, '#1f0e06');
  ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(1.5, S * 0.03); ctx.strokeStyle = '#2a1209'; ctx.stroke();
  sprinkles(ctx, x, y, R, 11, 0.6);
  const gl = ctx.createLinearGradient(x, y - R, x, y);
  gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(x - R * 0.25, y - R * 0.5, R * 0.45, R * 0.24, -0.5, 0, 7); ctx.fill();
}

function drawCherry(ctx, S) {
  const x = S / 2, y = S / 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#3b8a2a'; ctx.lineWidth = Math.max(2, S * 0.045);
  ctx.beginPath(); ctx.moveTo(x - S * 0.14, y + S * 0.08); ctx.quadraticCurveTo(x - S * 0.05, y - S * 0.28, x + S * 0.08, y - S * 0.36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + S * 0.15, y + S * 0.12); ctx.quadraticCurveTo(x + S * 0.14, y - S * 0.2, x + S * 0.08, y - S * 0.36); ctx.stroke();
  ctx.fillStyle = '#58c444'; ctx.strokeStyle = '#2c7a22'; ctx.lineWidth = Math.max(1.2, S * 0.02);
  ctx.beginPath(); ctx.ellipse(x + S * 0.2, y - S * 0.33, S * 0.15, S * 0.075, -0.35, 0, 7); ctx.fill(); ctx.stroke();
  for (const [cx, cy] of [[x - S * 0.15, y + S * 0.15], [x + S * 0.16, y + S * 0.19]]) {
    const r = S * 0.19;
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r * 1.2);
    g.addColorStop(0, '#ff9aa0'); g.addColorStop(0.5, '#e0183a'); g.addColorStop(1, '#7c0820');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = Math.max(1.2, S * 0.025); ctx.strokeStyle = '#6a0a1c'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy - r * 0.4, r * 0.3, r * 0.17, -0.5, 0, 7); ctx.fill();
  }
}

function drawChoc(ctx, S) {
  const x = S * 0.07, w = S * 0.86, r = S * 0.14;
  const g = ctx.createLinearGradient(0, x, 0, x + w);
  g.addColorStop(0, '#8a5632'); g.addColorStop(1, '#4a2813');
  ctx.beginPath(); ctx.roundRect(x, x, w, w, r); ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(1.5, S * 0.035); ctx.strokeStyle = '#2c1509'; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, x, w, w, r); ctx.clip();
  ctx.strokeStyle = 'rgba(30,12,4,.7)'; ctx.lineWidth = Math.max(1.5, S * 0.04);
  ctx.beginPath(); ctx.moveTo(S / 2, x); ctx.lineTo(S / 2, x + w); ctx.moveTo(x, S / 2); ctx.lineTo(x + w, S / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,.35)'; ctx.lineWidth = Math.max(1, S * 0.03);
  ctx.beginPath(); ctx.moveTo(x + S * 0.04, S / 2 - S * 0.03); ctx.lineTo(x + S * 0.04, x + S * 0.04); ctx.lineTo(S / 2 - S * 0.04, x + S * 0.04);
  ctx.moveTo(S / 2 + S * 0.04, S / 2 - S * 0.03); ctx.lineTo(S / 2 + S * 0.04, x + S * 0.04); ctx.lineTo(x + w - S * 0.05, x + S * 0.04);
  ctx.stroke();
  ctx.restore();
}

function drawCage(ctx, S) {
  const x = S * 0.06, w = S * 0.88;
  ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.roundRect(x, x, w, w, S * 0.12); ctx.fill();
  ctx.lineCap = 'round';
  for (const [col, lw] of [['#3a3050', S * 0.075], ['#d6cfe6', S * 0.04]]) {
    ctx.strokeStyle = col; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.roundRect(x, x, w, w, S * 0.12); ctx.stroke();
    ctx.beginPath();
    for (const f of [0.3, 0.5, 0.7]) { ctx.moveTo(S * f, x); ctx.lineTo(S * f, x + w); }
    ctx.moveTo(x, S * 0.5); ctx.lineTo(x + w, S * 0.5);
    ctx.stroke();
  }
}

function drawJelly(ctx, S, layers) {
  const x = S * 0.035, w = S * 0.93, r = S * 0.17;
  ctx.beginPath(); ctx.roundRect(x, x, w, w, r);
  const g = ctx.createLinearGradient(0, 0, S, S);
  if (layers >= 2) { g.addColorStop(0, 'rgba(255,92,190,.82)'); g.addColorStop(1, 'rgba(214,52,160,.82)'); }
  else { g.addColorStop(0, 'rgba(255,170,226,.62)'); g.addColorStop(1, 'rgba(255,128,205,.62)'); }
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = Math.max(1.5, S * 0.03); ctx.strokeStyle = layers >= 2 ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.6)'; ctx.stroke();
  if (layers >= 2) { ctx.beginPath(); ctx.roundRect(S * 0.14, S * 0.14, S * 0.72, S * 0.72, r * 0.7); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, S * 0.025); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(S * 0.3, S * 0.17, S * 0.16, S * 0.05, -0.3, 0, 7); ctx.fill();
}

/** A cache of cell-sized sprites for one pixel size. */
export function makeSprites(px) {
  const S = Math.max(8, Math.round(px));
  const cache = new Map();
  const mk = fn => { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'); fn(x); return c; };
  const get = (t, c, layers = 0) => {
    const key = t + ':' + (t === T.BOMB || t === T.ING || t === T.CHOC ? 0 : c) + ':' + layers;
    let s = cache.get(key);
    if (s) return s;
    s = mk(ctx => {
      if (t === T.NORMAL) paintCandy(ctx, c, S / 2, S / 2, S * 0.37);
      else if (t === T.SH) drawStriped(ctx, c, true, S);
      else if (t === T.SV) drawStriped(ctx, c, false, S);
      else if (t === T.WRAP) drawWrapped(ctx, c, S);
      else if (t === T.BOMB) drawBomb(ctx, S);
      else if (t === T.ING) drawCherry(ctx, S);
      else if (t === T.CHOC) drawChoc(ctx, S);
      else if (t === 'cage') drawCage(ctx, S);
      else if (t === 'jelly') drawJelly(ctx, S, layers);
    });
    cache.set(key, s);
    return s;
  };
  return { S, get };
}

/** Draw a candy icon (for goal chips etc.) into a small canvas element. */
export function drawIcon(canvas, kind, c = 0) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = canvas.clientWidth || 32;
  canvas.width = canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  const sp = makeSprites(canvas.width);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (kind === 'candy') ctx.drawImage(sp.get(T.NORMAL, c), 0, 0);
  else if (kind === 'cherry') ctx.drawImage(sp.get(T.ING, 0), 0, 0);
  else if (kind === 'jelly') ctx.drawImage(sp.get('jelly', 0, 1), 0, 0);
  else if (kind === 'moves') {
    const S = canvas.width;
    ctx.fillStyle = '#7c3fe6'; ctx.strokeStyle = '#4b1fa8'; ctx.lineWidth = S * 0.05; ctx.lineJoin = 'round';
    for (const d of [-1, 1]) {
      const y = S * (0.5 + d * 0.17), x0 = S * (d < 0 ? 0.18 : 0.82), x1 = S * (d < 0 ? 0.72 : 0.28);
      ctx.beginPath(); ctx.moveTo(x0, y - S * 0.07); ctx.lineTo(x1 + (d < 0 ? 0 : 0), y - S * 0.07);
      ctx.lineTo(x1, y - S * 0.17); ctx.lineTo(d < 0 ? S * 0.88 : S * 0.12, y); ctx.lineTo(x1, y + S * 0.17); ctx.lineTo(x1, y + S * 0.07); ctx.lineTo(x0, y + S * 0.07); ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  } else if (kind === 'bomb') ctx.drawImage(sp.get(T.BOMB, 0), 0, 0);
  else if (kind === 'star') { paintCandy(ctx, 2, canvas.width / 2, canvas.width / 2, canvas.width * 0.4); }
}
