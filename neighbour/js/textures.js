// Procedural textures drawn on canvases at load time: no image files. Most are light grey patterns
// that the per-box vertex colour tints, so one "paper2" texture serves every damask wallpaper.
import * as THREE from 'three';

// metres covered by one repeat of each texture (world-space UVs divide by this)
export const TEX_SCALE = {
  grass: 3, asphalt: 5, paving: 1.6, concrete: 3, brick: 1.4, siding: 1.6, shingle: 1.6, trim: 2, paint: 2,
  paper1: 0.9, paper2: 0.8, paper3: 0.7, panel: 1.6, tile: 0.9, checker: 0.8, woodfloor: 2, carpet: 1.2, plaster: 2.5,
  wood: 1.2, fabric: 0.6, metal: 1, fence: 1.8, board: 1, block: 1.6, attic: 2, counter: 1, hedge: 1.2, dirt: 1.2,
  bark: 1, garagedoor: 2.4, roofflat: 2.5, cardboard: 1, crate: 0.7, door: 1, emissive: 1, glass: 1, diamond: 0.6,
};

function rnd(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function noise(g, n, r, amt, size = 1, alpha = 1) {
  const img = g.getImageData(0, 0, n, n), d = img.data;
  for (let y = 0; y < n; y += size) for (let x = 0; x < n; x += size) {
    const v = (r() - 0.5) * amt;
    for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) {
      const i = ((y + yy) * n + x + xx) * 4;
      d[i] += v * alpha; d[i + 1] += v * alpha; d[i + 2] += v * alpha;
    }
  }
  g.putImageData(img, 0, 0);
}
const grey = v => { const c = Math.max(0, Math.min(255, v | 0)); return `rgb(${c},${c},${c})`; };

const DRAW = {
  grass(g, n, r) {
    g.fillStyle = grey(200); g.fillRect(0, 0, n, n);
    for (let i = 0; i < n * 6; i++) { g.fillStyle = grey(150 + r() * 100); g.fillRect(r() * n, r() * n, 1 + r() * 1.5, 2 + r() * 5); }
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(80,80,80,${0.08 + r() * 0.08})`; g.beginPath(); g.arc(r() * n, r() * n, 6 + r() * 22, 0, 7); g.fill(); }
  },
  asphalt(g, n, r) { g.fillStyle = grey(150); g.fillRect(0, 0, n, n); noise(g, n, r, 70, 1); for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(40,40,40,0.25)'; g.lineWidth = 1 + r() * 2; g.beginPath(); let x = r() * n, y = r() * n; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (r() - 0.5) * 50; y += (r() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); } },
  paving(g, n, r) { g.fillStyle = grey(225); g.fillRect(0, 0, n, n); noise(g, n, r, 30, 2); g.strokeStyle = grey(120); g.lineWidth = n / 64; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(0, i * n / 2); g.lineTo(n, i * n / 2); g.moveTo(i * n / 2, 0); g.lineTo(i * n / 2, n); g.stroke(); } },
  concrete(g, n, r) { g.fillStyle = grey(215); g.fillRect(0, 0, n, n); noise(g, n, r, 26, 2); for (let i = 0; i < 10; i++) { g.fillStyle = `rgba(90,90,90,${r() * 0.12})`; g.beginPath(); g.arc(r() * n, r() * n, 5 + r() * 30, 0, 7); g.fill(); } },
  brick(g, n, r) {
    g.fillStyle = grey(140); g.fillRect(0, 0, n, n);
    const rows = 8, bw = n / 4, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2;
      g.fillStyle = grey(200 + r() * 50);
      g.fillRect(x * bw + ox + 2, y * bh + 2, bw - 4, bh - 4);
    }
    noise(g, n, r, 30, 1);
  },
  siding(g, n, r) {
    const rows = 8, h = n / rows;
    for (let y = 0; y < rows; y++) {
      const grd = g.createLinearGradient(0, y * h, 0, (y + 1) * h);
      grd.addColorStop(0, grey(255)); grd.addColorStop(0.85, grey(222)); grd.addColorStop(1, grey(150));
      g.fillStyle = grd; g.fillRect(0, y * h, n, h);
    }
    noise(g, n, r, 18, 1);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(110,110,110,${r() * 0.12})`; g.fillRect(r() * n, r() * n, 20 + r() * 60, 1); }
  },
  shingle(g, n, r) {
    const rows = 8, h = n / rows, w = n / 6;
    g.fillStyle = grey(120); g.fillRect(0, 0, n, n);
    for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
      const ox = (y % 2) * w / 2;
      g.fillStyle = grey(170 + r() * 70);
      g.fillRect(x * w + ox + 1, y * h + 1, w - 2, h - 1);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x * w + ox + 1, y * h + h - 3, w - 2, 3);
    }
    noise(g, n, r, 30, 1);
  },
  trim(g, n, r) { g.fillStyle = grey(240); g.fillRect(0, 0, n, n); noise(g, n, r, 10, 2); },
  paint(g, n, r) { g.fillStyle = grey(235); g.fillRect(0, 0, n, n); noise(g, n, r, 14, 2); },
  plaster(g, n, r) { g.fillStyle = grey(238); g.fillRect(0, 0, n, n); noise(g, n, r, 12, 4); },
  paper1(g, n, r) {
    g.fillStyle = grey(235); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 8; i++) { g.fillStyle = grey(i % 2 ? 205 : 220); g.fillRect(i * n / 8, 0, n / 16, n); }
    g.fillStyle = grey(190); for (let i = 0; i < 8; i++) g.fillRect(i * n / 8 + n / 16 - 1, 0, 2, n);
    noise(g, n, r, 14, 2);
    stains(g, n, r);
  },
  paper2(g, n, r) {
    g.fillStyle = grey(232); g.fillRect(0, 0, n, n);
    g.fillStyle = grey(200);
    const s = n / 4;
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) {
      const cx = x * s + (y % 2) * s / 2, cy = y * s;
      g.beginPath(); g.moveTo(cx, cy - s * 0.4); g.quadraticCurveTo(cx + s * 0.3, cy, cx, cy + s * 0.4); g.quadraticCurveTo(cx - s * 0.3, cy, cx, cy - s * 0.4); g.fill();
      g.beginPath(); g.arc(cx, cy, s * 0.07, 0, 7); g.fillStyle = grey(245); g.fill(); g.fillStyle = grey(200);
    }
    noise(g, n, r, 14, 2);
    stains(g, n, r);
  },
  paper3(g, n, r) {
    g.fillStyle = grey(236); g.fillRect(0, 0, n, n);
    const s = n / 6;
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const cx = x * s + (y % 2) * s / 2, cy = y * s;
      g.fillStyle = grey(196);
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.arc(cx + Math.cos(a) * s * 0.12, cy + Math.sin(a) * s * 0.12, s * 0.09, 0, 7); g.fill(); }
      g.fillStyle = grey(170); g.beginPath(); g.arc(cx, cy, s * 0.06, 0, 7); g.fill();
    }
    noise(g, n, r, 12, 2);
    stains(g, n, r);
  },
  panel(g, n, r) { wood(g, n, r, true); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(i * n / 4, 0, 3, n); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(i * n / 4 + 3, 0, 2, n); } },
  tile(g, n, r) {
    g.fillStyle = grey(170); g.fillRect(0, 0, n, n);
    const k = 6, s = n / k;
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) { g.fillStyle = grey(225 + r() * 25); g.fillRect(x * s + 1.5, y * s + 1.5, s - 3, s - 3); }
    noise(g, n, r, 10, 1);
  },
  checker(g, n, r) {
    const k = 4, s = n / k;
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) { g.fillStyle = (x + y) % 2 ? grey(70) : grey(232); g.fillRect(x * s, y * s, s, s); }
    noise(g, n, r, 18, 2);
    for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(100,80,60,${r() * 0.15})`; g.beginPath(); g.arc(r() * n, r() * n, 4 + r() * 20, 0, 7); g.fill(); }
  },
  woodfloor(g, n, r) {
    const rows = 8, h = n / rows;
    for (let y = 0; y < rows; y++) {
      const off = r() * n;
      g.fillStyle = grey(185 + r() * 45); g.fillRect(0, y * h, n, h);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(60,60,60,${0.05 + r() * 0.1})`; g.fillRect(0, y * h + r() * h, n, 1); }
      g.fillStyle = grey(110); g.fillRect(0, y * h, n, 1.5); g.fillRect(off, y * h, 2, h);
    }
    noise(g, n, r, 14, 1);
  },
  carpet(g, n, r) { g.fillStyle = grey(210); g.fillRect(0, 0, n, n); noise(g, n, r, 40, 1); noise(g, n, r, 20, 4); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 3; g.strokeRect(6, 6, n - 12, n - 12); },
  wood(g, n, r) { wood(g, n, r, false); },
  fabric(g, n, r) { g.fillStyle = grey(215); g.fillRect(0, 0, n, n); for (let i = 0; i < n; i += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; g.fillRect(i, 0, 1, n); g.fillRect(0, i, n, 1); } noise(g, n, r, 18, 1); },
  metal(g, n, r) { g.fillStyle = grey(200); g.fillRect(0, 0, n, n); for (let i = 0; i < n; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.12})`; g.fillRect(0, i, n, 1); } noise(g, n, r, 16, 1); },
  fence(g, n, r) {
    const k = 8, w = n / k;
    g.fillStyle = grey(90); g.fillRect(0, 0, n, n);
    for (let i = 0; i < k; i++) { g.fillStyle = grey(200 + r() * 45); g.fillRect(i * w + 1.5, 0, w - 3, n); for (let j = 0; j < 6; j++) { g.fillStyle = `rgba(80,80,80,${r() * 0.15})`; g.fillRect(i * w + 2 + r() * (w - 4), 0, 1, n); } }
    noise(g, n, r, 14, 1);
  },
  board(g, n, r) { wood(g, n, r, false); g.fillStyle = 'rgba(0,0,0,0.3)'; for (const [x, y] of [[0.08, 0.5], [0.92, 0.5]]) { g.beginPath(); g.arc(x * n, y * n, n / 40, 0, 7); g.fill(); } },
  block(g, n, r) {
    g.fillStyle = grey(150); g.fillRect(0, 0, n, n);
    const rows = 4, bw = n / 2, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 3; x++) { const ox = (y % 2) * bw / 2; g.fillStyle = grey(210 + r() * 25); g.fillRect(x * bw + ox + 2, y * bh + 2, bw - 4, bh - 4); }
    noise(g, n, r, 30, 2);
  },
  attic(g, n, r) {
    const rows = 6, h = n / rows;
    for (let y = 0; y < rows; y++) { g.fillStyle = grey(170 + r() * 60); g.fillRect(0, y * h, n, h); g.fillStyle = grey(90); g.fillRect(0, y * h, n, 2); }
    for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(50,50,50,${r() * 0.15})`; g.fillRect(r() * n, r() * n, 10 + r() * 40, 1); }
    noise(g, n, r, 20, 1);
  },
  counter(g, n, r) { g.fillStyle = grey(225); g.fillRect(0, 0, n, n); for (let i = 0; i < n * 3; i++) { g.fillStyle = grey(140 + r() * 110); g.fillRect(r() * n, r() * n, 1.5, 1.5); } },
  hedge(g, n, r) { g.fillStyle = grey(120); g.fillRect(0, 0, n, n); for (let i = 0; i < n * 2; i++) { g.fillStyle = grey(110 + r() * 140); g.beginPath(); g.ellipse(r() * n, r() * n, 2 + r() * 4, 1 + r() * 3, r() * 3, 0, 7); g.fill(); } },
  dirt(g, n, r) { g.fillStyle = grey(170); g.fillRect(0, 0, n, n); noise(g, n, r, 60, 2); for (let i = 0; i < 60; i++) { g.fillStyle = grey(100 + r() * 80); g.beginPath(); g.arc(r() * n, r() * n, 1 + r() * 4, 0, 7); g.fill(); } },
  bark(g, n, r) { g.fillStyle = grey(150); g.fillRect(0, 0, n, n); for (let i = 0; i < 60; i++) { g.fillStyle = grey(80 + r() * 120); g.fillRect(r() * n, 0, 2 + r() * 5, n); } noise(g, n, r, 30, 1); },
  garagedoor(g, n, r) { g.fillStyle = grey(235); g.fillRect(0, 0, n, n); for (let i = 0; i < 4; i++) { g.fillStyle = grey(160); g.fillRect(0, i * n / 4, n, 3); g.fillStyle = grey(250); g.fillRect(0, i * n / 4 + 3, n, 2); } noise(g, n, r, 12, 2); for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(120,90,60,${r() * 0.2})`; g.fillRect(r() * n, r() * n * 0.3 + n * 0.7, 3, 20 + r() * 40); } },
  roofflat(g, n, r) { g.fillStyle = grey(170); g.fillRect(0, 0, n, n); noise(g, n, r, 70, 1); noise(g, n, r, 30, 3); },
  cardboard(g, n, r) { g.fillStyle = grey(225); g.fillRect(0, 0, n, n); noise(g, n, r, 16, 2); g.fillStyle = grey(250); g.fillRect(0, n * 0.45, n, n * 0.1); },
  crate(g, n, r) {
    wood(g, n, r, false);
    g.strokeStyle = grey(90); g.lineWidth = n / 22; g.strokeRect(n * 0.04, n * 0.04, n * 0.92, n * 0.92);
    g.beginPath(); g.moveTo(n * 0.08, n * 0.08); g.lineTo(n * 0.92, n * 0.92); g.stroke();
    g.strokeStyle = grey(225); g.lineWidth = n / 40; g.strokeRect(n * 0.1, n * 0.1, n * 0.8, n * 0.8);
  },
  door(g, n, r) {
    wood(g, n, r, true);
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = n / 50;
    for (const [x, y, w, h] of [[0.15, 0.08, 0.7, 0.36], [0.15, 0.52, 0.7, 0.4]]) { g.strokeRect(x * n, y * n, w * n, h * n); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.strokeRect(x * n + 3, y * n + 3, w * n - 6, h * n - 6); g.strokeStyle = 'rgba(0,0,0,0.35)'; }
  },
  emissive(g, n) { g.fillStyle = '#fff'; g.fillRect(0, 0, n, n); },
  glass(g, n) { g.fillStyle = '#fff'; g.fillRect(0, 0, n, n); },
};

// ---- Hello Neighbor style: bolder, chunkier, cartoonier versions of the main surfaces
Object.assign(DRAW, {
  brick(g, n, r) {
    g.fillStyle = grey(95); g.fillRect(0, 0, n, n);
    const rows = 6, bw = n / 3, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 4; x++) {
      const ox = (y % 2) * bw / 2, v = 205 + r() * 50;
      g.fillStyle = grey(v); g.fillRect(x * bw + ox + 4, y * bh + 4, bw - 8, bh - 8);
      g.fillStyle = grey(v + 25); g.fillRect(x * bw + ox + 6, y * bh + 6, bw - 14, 4);             // highlight
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x * bw + ox + 4, y * bh + bh - 9, bw - 8, 5);   // shadow
    }
    noise(g, n, r, 18, 2);
  },
  siding(g, n, r) {
    const rows = 6, h = n / rows;
    for (let y = 0; y < rows; y++) {
      const grd = g.createLinearGradient(0, y * h, 0, (y + 1) * h);
      grd.addColorStop(0, grey(255)); grd.addColorStop(0.75, grey(232)); grd.addColorStop(1, grey(120));
      g.fillStyle = grd; g.fillRect(0, y * h, n, h);
      g.fillStyle = grey(70); g.fillRect(0, (y + 1) * h - 3, n, 3);
    }
    noise(g, n, r, 10, 2);
    for (let i = 0; i < 4; i++) { g.fillStyle = grey(150); g.fillRect(r() * n, 0, 3, n); }             // seams
  },
  shingle(g, n, r) {
    const rows = 6, h = n / rows, w = n / 5;
    g.fillStyle = grey(60); g.fillRect(0, 0, n, n);
    for (let y = 0; y < rows; y++) for (let x = -1; x < 6; x++) {
      const ox = (y % 2) * w / 2, v = 180 + r() * 60;
      g.fillStyle = grey(v); g.beginPath();
      g.moveTo(x * w + ox + 2, y * h); g.lineTo(x * w + ox + w - 2, y * h); g.lineTo(x * w + ox + w - 2, y * h + h * 0.7);
      g.quadraticCurveTo(x * w + ox + w / 2, y * h + h + 4, x * w + ox + 2, y * h + h * 0.7); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x * w + ox + 2, y * h + h * 0.62, w - 4, 3);
    }
  },
  paper1(g, n, r) {
    // fat candy stripes with a thin pinstripe
    for (let i = 0; i < 6; i++) { g.fillStyle = grey(i % 2 ? 175 : 245); g.fillRect(i * n / 6, 0, n / 6, n); }
    g.fillStyle = grey(110); for (let i = 0; i < 6; i++) g.fillRect(i * n / 6 + n / 12 - 1.5, 0, 3, n);
    noise(g, n, r, 10, 2); stains(g, n, r);
  },
  paper2(g, n, r) {
    // big polka dots with dark rims
    g.fillStyle = grey(240); g.fillRect(0, 0, n, n);
    const s = n / 3;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * s + (y % 2) * s / 2, cy = y * s;
      g.fillStyle = grey(110); g.beginPath(); g.arc(cx, cy, s * 0.3, 0, 7); g.fill();
      g.fillStyle = grey(175); g.beginPath(); g.arc(cx, cy, s * 0.24, 0, 7); g.fill();
      g.fillStyle = grey(225); g.beginPath(); g.arc(cx - s * 0.07, cy - s * 0.07, s * 0.07, 0, 7); g.fill();
    }
    noise(g, n, r, 10, 2); stains(g, n, r);
  },
  paper3(g, n, r) {
    // zig-zag chevrons
    g.fillStyle = grey(240); g.fillRect(0, 0, n, n);
    const rows = 6, h = n / rows;
    for (let y = 0; y < rows; y++) {
      g.strokeStyle = grey(y % 2 ? 140 : 190); g.lineWidth = h * 0.42; g.lineJoin = 'miter';
      g.beginPath(); for (let x = -1; x <= 8; x++) g.lineTo(x * n / 8, y * h + (x % 2 ? h * 0.25 : h * 0.75)); g.stroke();
    }
    noise(g, n, r, 10, 2); stains(g, n, r);
  },
  woodfloor(g, n, r) {
    const rows = 6, h = n / rows;
    for (let y = 0; y < rows; y++) {
      const off = r() * n;
      g.fillStyle = grey(175 + r() * 70); g.fillRect(0, y * h, n, h);
      for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(60,40,20,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 1.5; g.beginPath(); const yy = y * h + 4 + r() * (h - 8); g.moveTo(0, yy); g.bezierCurveTo(n / 3, yy + (r() - 0.5) * 8, n * 2 / 3, yy + (r() - 0.5) * 8, n, yy); g.stroke(); }
      g.fillStyle = grey(60); g.fillRect(0, y * h, n, 3); g.fillRect(off, y * h, 4, h);
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.arc(off + 14, y * h + h / 2, 2.5, 0, 7); g.arc(off - 14, y * h + h / 2, 2.5, 0, 7); g.fill();
    }
  },
  carpet(g, n, r) {
    // diamond-pattern rug
    g.fillStyle = grey(200); g.fillRect(0, 0, n, n); noise(g, n, r, 30, 1);
    const s = n / 4;
    for (let y = 0; y <= 4; y++) for (let x = 0; x <= 4; x++) {
      g.fillStyle = (x + y) % 2 ? grey(140) : grey(240);
      g.beginPath(); g.moveTo(x * s, y * s - s * 0.4); g.lineTo(x * s + s * 0.4, y * s); g.lineTo(x * s, y * s + s * 0.4); g.lineTo(x * s - s * 0.4, y * s); g.fill();
    }
    g.strokeStyle = grey(90); g.lineWidth = 6; g.strokeRect(4, 4, n - 8, n - 8);
  },
  tile(g, n, r) {
    g.fillStyle = grey(80); g.fillRect(0, 0, n, n);
    const k = 4, s = n / k;
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
      g.fillStyle = grey(230 + r() * 25); g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6);
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(x * s + 6, y * s + 6, s * 0.4, 4);
    }
  },
  checker(g, n, r) {
    const k = 4, s = n / k;
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) { g.fillStyle = (x + y) % 2 ? grey(45) : grey(245); g.fillRect(x * s, y * s, s, s); }
    noise(g, n, r, 10, 2);
  },
  fence(g, n, r) {
    const k = 6, w = n / k;
    g.fillStyle = grey(50); g.fillRect(0, 0, n, n);
    for (let i = 0; i < k; i++) {
      g.fillStyle = grey(205 + r() * 40); g.fillRect(i * w + 4, 0, w - 8, n);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(i * w + 6, 0, 3, n);
      for (let j = 0; j < 3; j++) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.arc(i * w + w / 2, n * (0.2 + j * 0.3), 2.5, 0, 7); g.fill(); }
    }
  },
  block(g, n, r) {
    g.fillStyle = grey(90); g.fillRect(0, 0, n, n);
    const rows = 4, bw = n / 2, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 3; x++) { const ox = (y % 2) * bw / 2; g.fillStyle = grey(200 + r() * 40); g.fillRect(x * bw + ox + 5, y * bh + 5, bw - 10, bh - 10); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x * bw + ox + 5, y * bh + bh - 12, bw - 10, 7); }
    noise(g, n, r, 20, 2);
  },
  hedge(g, n, r) {
    g.fillStyle = grey(90); g.fillRect(0, 0, n, n);
    for (let i = 0; i < n; i++) { const v = 120 + r() * 135; g.fillStyle = grey(v); g.beginPath(); g.arc(r() * n, r() * n, 4 + r() * 7, 0, 7); g.fill(); g.fillStyle = grey(Math.min(255, v + 40)); g.beginPath(); g.arc(r() * n, r() * n, 2, 0, 7); g.fill(); }
  },
  grass(g, n, r) {
    g.fillStyle = grey(205); g.fillRect(0, 0, n, n);
    for (let i = 0; i < n * 4; i++) { g.fillStyle = grey(150 + r() * 105); const x = r() * n, y = r() * n; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - 6 - r() * 5); g.lineTo(x + 3, y); g.fill(); }
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(r() * n, r() * n, 2.5, 0, 7); g.fill(); }
  },
});

function wood(g, n, r, vertical) {
  g.fillStyle = grey(205); g.fillRect(0, 0, n, n);
  for (let i = 0; i < 70; i++) {
    g.strokeStyle = `rgba(60,60,60,${0.05 + r() * 0.14})`; g.lineWidth = 0.5 + r() * 1.5;
    g.beginPath();
    const p = r() * n;
    if (vertical) { g.moveTo(p, 0); g.bezierCurveTo(p + (r() - 0.5) * 12, n / 3, p + (r() - 0.5) * 12, n * 2 / 3, p, n); }
    else { g.moveTo(0, p); g.bezierCurveTo(n / 3, p + (r() - 0.5) * 12, n * 2 / 3, p + (r() - 0.5) * 12, n, p); }
    g.stroke();
  }
  noise(g, n, r, 14, 1);
}
function stains(g, n, r) {
  for (let i = 0; i < 3; i++) {
    const x = r() * n, y = r() * n;
    const grd = g.createRadialGradient(x, y, 1, x, y, 10 + r() * 30);
    grd.addColorStop(0, 'rgba(110,100,80,0.18)'); grd.addColorStop(1, 'rgba(110,100,80,0)');
    g.fillStyle = grd; g.fillRect(0, 0, n, n);
  }
}

export function makeTextures(size = 256, aniso = 1) {
  const out = {};
  let seed = 11;
  for (const k of Object.keys(DRAW)) {
    const n = k === 'emissive' || k === 'glass' ? 4 : FULL_COLOUR.has(k) ? size * 2 : size;
    const c = canvas(n), g = c.getContext('2d', { willReadFrequently: true });
    DRAW[k](g, n, rnd(seed += 7919));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = aniso;
    out[k] = t;
  }
  return out;
}

// tram floor: diamond-plate steel
Object.assign(DRAW, {
  diamond(g, n, r) {
    g.fillStyle = grey(190); g.fillRect(0, 0, n, n);
    const s = n / 8;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const cx = (x + 0.5) * s, cy = (y + 0.5) * s, a = (x + y) % 2 ? 0.6 : -0.6;
      g.save(); g.translate(cx, cy); g.rotate(a);
      g.fillStyle = grey(235); g.fillRect(-s * 0.32, -s * 0.07, s * 0.64, s * 0.14);
      g.fillStyle = grey(120); g.fillRect(-s * 0.32, s * 0.07, s * 0.64, s * 0.04);
      g.restore();
    }
    noise(g, n, r, 18, 2);
  },
});

// ================================================================================== 2026 material library
// Full-colour materials (drawn in colour, used with a white vertex tint) for the things that need more
// than one colour: wallpapers, floors and rugs. Plus richer versions of the tinted greyscale surfaces.
// Everything is drawn from a seeded generator, so a surface looks the same on every load.
export const FULL_COLOUR = new Set();
const hex = (h, a = 1) => `rgba(${(h >> 16) & 255},${(h >> 8) & 255},${h & 255},${a})`;
function mix(a, b, t) {
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t), g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t), bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return (r << 16) | (g << 8) | bl;
}
function colourNoise(g, n, r, amt, size = 2) { noise(g, n, r, amt, size); }
function wear(g, n, r, k = 1) {
  // faded patches, a few scuffs and a grimy band at the bottom of the repeat
  for (let i = 0; i < 4 * k; i++) {
    const x = r() * n, y = r() * n, gr = g.createRadialGradient(x, y, 1, x, y, 14 + r() * 40);
    gr.addColorStop(0, `rgba(${r() < 0.5 ? '255,250,230' : '90,70,50'},${0.06 + r() * 0.08})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, n, n);
  }
  for (let i = 0; i < 6 * k; i++) { g.strokeStyle = `rgba(60,40,30,${0.05 + r() * 0.08})`; g.lineWidth = 1; g.beginPath(); const x = r() * n, y = r() * n; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 10); g.stroke(); }
}
function verticalGrain(g, n, r, a = 0.05) { for (let x = 0; x < n; x += 2) { g.fillStyle = `rgba(0,0,0,${r() * a})`; g.fillRect(x, 0, 1, n); } }
function leaf(g, x, y, s, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.6, 0, 0, s); g.quadraticCurveTo(-s * 0.6, 0, 0, -s); g.fill(); g.restore(); }
function flower(g, x, y, s, petal, centre) {
  g.fillStyle = petal;
  for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55, s * 0.45, s * 0.3, a, 0, 7); g.fill(); }
  g.fillStyle = centre; g.beginPath(); g.arc(x, y, s * 0.28, 0, 7); g.fill();
}
function star(g, x, y, s) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 - Math.PI / 2, rr = k % 2 ? s * 0.45 : s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
// floorboards running along the texture's x; each plank its own shade, grain, joints, nails and wear
function planks(g, n, r, base, opt = {}) {
  const rows = opt.rows || 6, h = n / rows;
  for (let y = 0; y < rows; y++) {
    let x0 = -r() * n * 0.6;
    while (x0 < n) {
      const len = n * (0.45 + r() * 0.55), shade = (r() - 0.5) * (opt.vary ?? 0.22);
      const c = shade > 0 ? mix(base, 0xffffff, shade * 0.6) : mix(base, 0x000000, -shade);
      g.fillStyle = hex(c); g.fillRect(x0, y * h, len, h);
      for (let k = 0; k < 9; k++) { g.strokeStyle = `rgba(40,20,10,${0.06 + r() * 0.12})`; g.lineWidth = 0.6 + r() * 1.4; g.beginPath(); const yy = y * h + 2 + r() * (h - 4); g.moveTo(x0, yy); g.bezierCurveTo(x0 + len / 3, yy + (r() - 0.5) * 6, x0 + len * 2 / 3, yy + (r() - 0.5) * 6, x0 + len, yy); g.stroke(); }
      if (r() < (opt.knots ?? 0.35)) { const kx = x0 + r() * len, ky = y * h + h * (0.3 + r() * 0.4); g.fillStyle = 'rgba(50,25,10,0.45)'; g.beginPath(); g.ellipse(kx, ky, 3 + r() * 4, 2 + r() * 2, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(20,10,5,0.75)'; g.fillRect(x0 + len - 1.5, y * h, 2, h);                 // end joint
      if (opt.nails !== false) { g.fillStyle = 'rgba(20,15,10,0.6)'; for (const ny of [h * 0.25, h * 0.75]) { g.beginPath(); g.arc(x0 + 6, y * h + ny, 1.6, 0, 7); g.fill(); } }
      x0 += len;
    }
    g.fillStyle = 'rgba(20,10,5,0.8)'; g.fillRect(0, y * h, n, 2);                                    // gap between rows
    g.fillStyle = `rgba(255,240,210,${opt.shine ?? 0.12})`; g.fillRect(0, y * h + 3, n, 2);             // polished edge
  }
  for (let i = 0; i < (opt.scratches ?? 12); i++) { g.strokeStyle = `rgba(255,240,220,${0.05 + r() * 0.08})`; g.lineWidth = 1; g.beginPath(); const x = r() * n, y = r() * n; g.moveTo(x, y); g.lineTo(x + 10 + r() * 40, y + (r() - 0.5) * 4); g.stroke(); }
  colourNoise(g, n, r, 10, 1);
}

const FULL = {
  // ---- wallpapers (one repeat ≈ 1 m)
  wp_blue(g, n, r) {           // strong blue with small cream diamonds
    g.fillStyle = hex(0x2f5a9e); g.fillRect(0, 0, n, n); verticalGrain(g, n, r, 0.06);
    const s = n / 6;
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const cx = x * s + (y % 2) * s / 2, cy = y * s;
      g.fillStyle = hex(0xf2e6c4); g.beginPath(); g.moveTo(cx, cy - s * 0.22); g.lineTo(cx + s * 0.15, cy); g.lineTo(cx, cy + s * 0.22); g.lineTo(cx - s * 0.15, cy); g.fill();
      g.fillStyle = hex(0x23477e); g.beginPath(); g.arc(cx, cy, s * 0.05, 0, 7); g.fill();
      g.fillStyle = hex(0x3d6ab2); g.fillRect(cx + s * 0.45, cy - 1, s * 0.1, 2);
    }
    wear(g, n, r);
  },
  wp_yellow(g, n, r) {         // warm vintage yellow, thin stripes, faded flowers
    g.fillStyle = hex(0xe8c35a); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 8; i++) { g.fillStyle = hex(0xf3d98a); g.fillRect(i * n / 8, 0, n / 32, n); g.fillStyle = hex(0xc99b3a, 0.6); g.fillRect(i * n / 8 + n / 16, 0, 2, n); }
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) flower(g, x * n / 4 + (y % 2) * n / 8 + n / 16, y * n / 3 + n / 6, n / 28, hex(0xf8ecc8, 0.85), hex(0xc8803a, 0.8));
    wear(g, n, r);
  },
  wp_floral_g(g, n, r) {       // faded green with leaves and pale flowers
    g.fillStyle = hex(0x6f8f62); g.fillRect(0, 0, n, n); verticalGrain(g, n, r, 0.05);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * n / 4 + (y % 2) * n / 8, cy = y * n / 4 + n / 8;
      g.fillStyle = hex(0x4f6e44); for (let k = 0; k < 4; k++) leaf(g, cx + Math.cos(k * 1.57 + 0.4) * n / 22, cy + Math.sin(k * 1.57 + 0.4) * n / 22, n / 26, k * 1.57 + 0.4);
      flower(g, cx, cy, n / 34, hex(0xe8dcc0), hex(0xc87a6a));
    }
    wear(g, n, r);
  },
  wp_floral_r(g, n, r) {       // dusty red with cream roses
    g.fillStyle = hex(0x9a4a44); g.fillRect(0, 0, n, n); verticalGrain(g, n, r, 0.05);
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
      const cx = x * n / 4 + (y % 2) * n / 8, cy = y * n / 4 + n / 8;
      g.fillStyle = hex(0x6e8a5a); leaf(g, cx - n / 20, cy + n / 30, n / 30, -0.8); leaf(g, cx + n / 20, cy + n / 30, n / 30, 0.8);
      flower(g, cx, cy, n / 26, hex(0xf2dcc4), hex(0xd88a7a));
    }
    wear(g, n, r);
  },
  wp_floral_b(g, n, r) {       // beige with small blue sprigs
    g.fillStyle = hex(0xd8c8a4); g.fillRect(0, 0, n, n);
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const cx = x * n / 6 + (y % 2) * n / 12, cy = y * n / 6 + n / 12;
      g.fillStyle = hex(0x7a8a5a); leaf(g, cx, cy + n / 40, n / 50, 0.4);
      flower(g, cx, cy, n / 60, hex(0x5a7ab0), hex(0xf2e6c4));
    }
    wear(g, n, r);
  },
  wp_stripe(g, n, r) {         // two blues, narrow stripes and little fleurs
    for (let i = 0; i < 8; i++) { g.fillStyle = hex(i % 2 ? 0x3a6a9a : 0x5a8ab8); g.fillRect(i * n / 8, 0, n / 8, n); }
    g.fillStyle = hex(0xe8eef4, 0.7); for (let i = 0; i < 8; i++) g.fillRect(i * n / 8, 0, 2, n);
    g.fillStyle = hex(0xdfe8f2, 0.8);
    for (let i = 0; i < 8; i += 2) for (let y = 0; y < 4; y++) { const cx = i * n / 8 + n / 16, cy = y * n / 4 + n / 8; leaf(g, cx, cy, n / 40, 0); g.beginPath(); g.arc(cx, cy + n / 30, n / 90, 0, 7); g.fill(); }
    wear(g, n, r);
  },
  wp_burgundy(g, n, r) {       // deep red with a darker damask
    g.fillStyle = hex(0x6e1f2a); g.fillRect(0, 0, n, n); verticalGrain(g, n, r, 0.08);
    g.fillStyle = hex(0x4e1420);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const cx = x * n / 3 + (y % 2) * n / 6, cy = y * n / 3 + n / 6, s = n / 9;
      g.beginPath(); g.moveTo(cx, cy - s); g.bezierCurveTo(cx + s, cy - s * 0.5, cx + s * 0.6, cy + s * 0.4, cx, cy + s); g.bezierCurveTo(cx - s * 0.6, cy + s * 0.4, cx - s, cy - s * 0.5, cx, cy - s); g.fill();
      g.fillStyle = hex(0x8a3040); g.beginPath(); g.arc(cx, cy, s * 0.18, 0, 7); g.fill(); g.fillStyle = hex(0x4e1420);
      leaf(g, cx - s * 0.9, cy + s * 0.2, s * 0.35, -0.9); leaf(g, cx + s * 0.9, cy + s * 0.2, s * 0.35, 0.9);
    }
    wear(g, n, r);
  },
  wp_cream(g, n, r) {          // warm off-white, gentle repeating shapes
    g.fillStyle = hex(0xece2cc); g.fillRect(0, 0, n, n);
    g.strokeStyle = hex(0xd6c8a8); g.lineWidth = 2;
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) { const cx = x * n / 5 + (y % 2) * n / 10, cy = y * n / 5 + n / 10; g.beginPath(); g.arc(cx, cy, n / 30, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - n / 20, cy); g.lineTo(cx + n / 20, cy); g.stroke(); }
    wear(g, n, r);
  },
  wp_kids(g, n, r) {           // pale blue with stars, clouds and wide-eyed little animals
    g.fillStyle = hex(0xa8d0ec); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 6; i++) { const x = r() * n, y = r() * n; g.fillStyle = hex(0xffffff, 0.9); for (const [dx, rr] of [[0, 1], [n / 30, 0.8], [-n / 30, 0.7]]) { g.beginPath(); g.arc(x + dx, y, n / 30 * rr, 0, 7); g.fill(); } }
    g.fillStyle = hex(0xf8d84a); for (let i = 0; i < 10; i++) star(g, r() * n, r() * n, n / 45);
    for (let i = 0; i < 4; i++) {          // a little bear with staring eyes
      const x = (i % 2 + 0.5) * n / 2 + (r() - 0.5) * 20, y = (Math.floor(i / 2) + 0.5) * n / 2;
      g.fillStyle = hex(0xd89a6a); g.beginPath(); g.arc(x, y, n / 26, 0, 7); g.fill(); g.beginPath(); g.arc(x - n / 34, y - n / 34, n / 70, 0, 7); g.arc(x + n / 34, y - n / 34, n / 70, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x - n / 80, y - n / 160, n / 110, 0, 7); g.arc(x + n / 80, y - n / 160, n / 110, 0, 7); g.fill();
      g.fillStyle = '#111'; g.beginPath(); g.arc(x - n / 80, y - n / 160, n / 260, 0, 7); g.arc(x + n / 80, y - n / 160, n / 260, 0, 7); g.fill();
    }
    wear(g, n, r);
  },
  wp_damask(g, n, r) {         // teal with a pale damask (very Hello Neighbor hallway)
    g.fillStyle = hex(0x2f7a78); g.fillRect(0, 0, n, n); verticalGrain(g, n, r, 0.06);
    g.fillStyle = hex(0x5aa8a0);
    for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
      const cx = x * n / 3 + (y % 2) * n / 6, cy = y * n / 3 + n / 6, s = n / 10;
      g.beginPath(); g.moveTo(cx, cy - s); g.quadraticCurveTo(cx + s, cy, cx, cy + s); g.quadraticCurveTo(cx - s, cy, cx, cy - s); g.fill();
      leaf(g, cx, cy - s * 1.25, s * 0.3, 0); leaf(g, cx - s * 0.8, cy, s * 0.3, -1.2); leaf(g, cx + s * 0.8, cy, s * 0.3, 1.2);
    }
    wear(g, n, r);
  },
  wp_basement(g, n, r) {       // old peeling paper: faded, water stains, plaster showing through
    g.fillStyle = hex(0xb8ab88); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 8; i++) { g.fillStyle = hex(0xa8986e, 0.6); g.fillRect(i * n / 8, 0, n / 24, n); }
    for (let i = 0; i < 5; i++) { const x = r() * n, y = r() * n * 0.7; const gr = g.createLinearGradient(x, y, x, y + n * 0.4); gr.addColorStop(0, 'rgba(110,90,50,0.35)'); gr.addColorStop(1, 'rgba(110,90,50,0)'); g.fillStyle = gr; g.fillRect(x - 12, y, 24 + r() * 20, n * 0.4); }
    for (let i = 0; i < 4; i++) { const x = r() * n, y = r() * n; g.fillStyle = hex(0xd8d2c4); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 7; k++) g.lineTo(x + (r() - 0.3) * 40, y + (r() - 0.3) * 40); g.fill(); }
    wear(g, n, r, 2);
  },
  // ---- floors (one repeat ≈ 2 m)
  fl_red(g, n, r) { planks(g, n, r, 0x8a4a2a, { shine: 0.14 }); },          // warm reddish-brown living rooms
  fl_honey(g, n, r) { planks(g, n, r, 0xc8904a, { shine: 0.16 }); },        // light honey bedrooms
  fl_walnut(g, n, r) { planks(g, n, r, 0x4e3020, { shine: 0.1, rows: 7 }); }, // dark study floors
  fl_attic(g, n, r) { planks(g, n, r, 0x8a7458, { rows: 4, vary: 0.35, knots: 0.8, shine: 0.02, scratches: 30 }); },
  fl_aged(g, n, r) { planks(g, n, r, 0x6e6250, { rows: 5, vary: 0.3, shine: 0.03, scratches: 25 }); wear(g, n, r, 2); },
  fl_parquet(g, n, r) {        // herringbone for the mansion
    g.fillStyle = hex(0x5a3a22); g.fillRect(0, 0, n, n);
    const w = n / 16, l = n / 4;
    for (let y = -2; y < 10; y++) for (let x = -2; x < 10; x++) {
      const px = x * l / 2 + y * w, py = y * w * 2 - x * w;
      g.save(); g.translate(px, py); g.rotate((x % 2 ? 1 : -1) * Math.PI / 4);
      g.fillStyle = hex(mix(0x9a6a3a, 0x6a4424, r() * 0.6)); g.fillRect(0, 0, l, w - 1.5);
      g.strokeStyle = 'rgba(40,20,10,0.2)'; g.beginPath(); g.moveTo(2, w / 2); g.lineTo(l - 2, w / 2 + (r() - 0.5) * 2); g.stroke(); g.restore();
    }
    colourNoise(g, n, r, 8, 1);
  },
  fl_kitchen(g, n, r) {        // cream and sea-green checker tiles with grout
    const k = 4, s = n / k;
    g.fillStyle = hex(0x8a8478); g.fillRect(0, 0, n, n);
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
      g.fillStyle = hex((x + y) % 2 ? mix(0x3f8a7a, 0x2f6a5e, r() * 0.4) : mix(0xf2e8d2, 0xd8ccb0, r() * 0.4)); g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x * s + 5, y * s + 5, s * 0.5, 3);
    }
    wear(g, n, r);
  },
  fl_bath(g, n, r) {           // small white hexagon mosaic with grey grout
    g.fillStyle = hex(0x9a9a98); g.fillRect(0, 0, n, n);
    const s = n / 16;
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const cx = x * s * 1.5, cy = y * s * 1.73 + (x % 2) * s * 0.866;
      g.fillStyle = hex(r() < 0.06 ? 0x3a6a9a : mix(0xf4f4f0, 0xdcdcd4, r())); g.beginPath();
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * s * 0.9, cy + Math.sin(a) * s * 0.9); }
      g.fill();
    }
  },
  // ---- rugs (stretch over the whole rug: local UVs)
  rug_red(g, n, r) { rug(g, n, r, 0x8a2a2a, 0xd8a050, 0x2a3a5a); },
  rug_blue(g, n, r) { rug(g, n, r, 0x2a4a7a, 0xe8d8a8, 0x8a2a2a); },
  rug_green(g, n, r) { rug(g, n, r, 0x3a5a3a, 0xd8b878, 0x6a3a2a); },
};
function rug(g, n, r, field, accent, border) {
  g.fillStyle = hex(border); g.fillRect(0, 0, n, n);
  g.fillStyle = hex(accent); g.fillRect(n * 0.05, n * 0.05, n * 0.9, n * 0.9);
  g.fillStyle = hex(field); g.fillRect(n * 0.09, n * 0.09, n * 0.82, n * 0.82);
  g.fillStyle = hex(accent);
  const c = n / 2; g.beginPath(); g.moveTo(c, n * 0.2); g.lineTo(n * 0.8, c); g.lineTo(c, n * 0.8); g.lineTo(n * 0.2, c); g.fill();
  g.fillStyle = hex(field); g.beginPath(); g.moveTo(c, n * 0.3); g.lineTo(n * 0.7, c); g.lineTo(c, n * 0.7); g.lineTo(n * 0.3, c); g.fill();
  g.fillStyle = hex(border); g.beginPath(); g.arc(c, c, n * 0.08, 0, 7); g.fill();
  for (let i = 0; i < 12; i++) { g.fillStyle = hex(accent); g.fillRect(n * 0.12 + i * n * 0.065, n * 0.11, n * 0.03, n * 0.03); g.fillRect(n * 0.12 + i * n * 0.065, n * 0.86, n * 0.03, n * 0.03); }
  for (let y = 0; y < n; y += 2) { g.fillStyle = `rgba(0,0,0,${r() * 0.06})`; g.fillRect(0, y, n, 1); }   // weave
  for (let x = 0; x < n; x += 2) { g.fillStyle = `rgba(255,255,255,${r() * 0.04})`; g.fillRect(x, 0, 1, n); }
}
for (const k of Object.keys(FULL)) FULL_COLOUR.add(k);
Object.assign(DRAW, FULL);
Object.assign(TEX_SCALE, {
  wp_blue: 1, wp_yellow: 1.1, wp_floral_g: 1.2, wp_floral_r: 1.2, wp_floral_b: 0.9, wp_stripe: 1, wp_burgundy: 1.3, wp_cream: 1, wp_kids: 1.4, wp_damask: 1.3, wp_basement: 1.2,
  fl_red: 2.2, fl_honey: 2.2, fl_walnut: 2.2, fl_attic: 2.6, fl_aged: 2.4, fl_parquet: 1.6, fl_kitchen: 1.2, fl_bath: 0.7,
  rug_red: 1, rug_blue: 1, rug_green: 1, planks: 2, rust: 1.2, stone: 1.6,
});

// ---- richer tinted surfaces (greyscale, coloured by the box tint)
Object.assign(DRAW, {
  // painted wooden siding: individual boards, grain, seams, nail heads and chipped paint
  siding(g, n, r) {
    const rows = 6, h = n / rows;
    for (let y = 0; y < rows; y++) {
      const v = 228 + r() * 22;
      const grd = g.createLinearGradient(0, y * h, 0, (y + 1) * h);
      grd.addColorStop(0, grey(v + 10)); grd.addColorStop(0.8, grey(v - 12)); grd.addColorStop(1, grey(110));
      g.fillStyle = grd; g.fillRect(0, y * h, n, h);
      for (let k = 0; k < 6; k++) { g.strokeStyle = `rgba(80,80,80,${0.04 + r() * 0.06})`; g.lineWidth = 1; g.beginPath(); const yy = y * h + 3 + r() * (h - 8); g.moveTo(0, yy); g.bezierCurveTo(n / 3, yy + (r() - 0.5) * 4, n * 2 / 3, yy + (r() - 0.5) * 4, n, yy); g.stroke(); }
      const seam = r() * n; g.fillStyle = grey(95); g.fillRect(seam, y * h, 2, h - 3);
      g.fillStyle = 'rgba(0,0,0,0.35)'; for (const nx of [seam - 5, seam + 7]) { g.beginPath(); g.arc(nx, y * h + h * 0.45, 1.4, 0, 7); g.fill(); }
      g.fillStyle = grey(60); g.fillRect(0, (y + 1) * h - 3, n, 3);
    }
    for (let i = 0; i < 7; i++) {          // paint chipped off: bare grey wood showing
      const x = r() * n, y = r() * n; g.fillStyle = grey(150); g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 6; k++) g.lineTo(x + (r() - 0.4) * 14, y + (r() - 0.4) * 7); g.fill();
    }
    noise(g, n, r, 8, 2);
  },
  // bare/old boards (sheds, attics, boarded windows): darker gaps, knots, rough grain
  board(g, n, r) {
    const rows = 4, h = n / rows;
    for (let y = 0; y < rows; y++) {
      g.fillStyle = grey(175 + r() * 60); g.fillRect(0, y * h, n, h);
      for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(40,40,40,${0.06 + r() * 0.12})`; g.lineWidth = 0.6 + r() * 1.2; g.beginPath(); const yy = y * h + r() * h; g.moveTo(0, yy); g.bezierCurveTo(n / 3, yy + (r() - 0.5) * 8, n * 2 / 3, yy + (r() - 0.5) * 8, n, yy); g.stroke(); }
      if (r() < 0.7) { g.fillStyle = 'rgba(40,30,20,0.4)'; g.beginPath(); g.ellipse(r() * n, y * h + h / 2, 4, 2.5, 0, 0, 7); g.fill(); }
      g.fillStyle = grey(40); g.fillRect(0, y * h, n, 2.5);
      g.fillStyle = 'rgba(0,0,0,0.5)'; for (const x of [n * 0.06, n * 0.94]) { g.beginPath(); g.arc(x, y * h + h / 2, 2, 0, 7); g.fill(); }
    }
    noise(g, n, r, 12, 1);
  },
  // brick: offset bricks, raised edges, light mortar, chips and soot near the bottom
  brick(g, n, r) {
    g.fillStyle = grey(200); g.fillRect(0, 0, n, n);                  // mortar
    noise(g, n, r, 20, 2);
    const rows = 8, bw = n / 4, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 5; x++) {
      const ox = (y % 2) * bw / 2, v = 150 + r() * 70;
      const x0 = x * bw + ox + 2.5, y0 = y * bh + 2.5, w = bw - 5, hh = bh - 5;
      g.fillStyle = grey(v); g.fillRect(x0, y0, w, hh);
      g.fillStyle = grey(Math.min(255, v + 30)); g.fillRect(x0, y0, w, 2);                  // top highlight
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x0, y0 + hh - 2.5, w, 2.5);               // shadow
      for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.15})`; g.fillRect(x0 + r() * w, y0 + r() * hh, 2 + r() * 3, 1 + r() * 2); }
      if (r() < 0.12) { g.fillStyle = grey(200); g.fillRect(x0 + (r() < 0.5 ? 0 : w - 5), y0, 5, 4); }  // chipped corner
    }
  },
  // concrete: fine grain, hairline cracks, damp patches and dirt toward the bottom of the repeat
  concrete(g, n, r) {
    g.fillStyle = grey(205); g.fillRect(0, 0, n, n);
    noise(g, n, r, 22, 1); noise(g, n, r, 14, 4);
    for (let i = 0; i < 6; i++) { const x = r() * n, y = r() * n, gr = g.createRadialGradient(x, y, 1, x, y, 10 + r() * 36); gr.addColorStop(0, `rgba(70,70,70,${0.12 + r() * 0.1})`); gr.addColorStop(1, 'rgba(70,70,70,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }
    for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(40,40,40,0.35)'; g.lineWidth = 1; g.beginPath(); let x = r() * n, y = r() * n; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 22; y += r() * 14; g.lineTo(x, y); } g.stroke(); }
    const gr = g.createLinearGradient(0, n * 0.7, 0, n); gr.addColorStop(0, 'rgba(60,55,45,0)'); gr.addColorStop(1, 'rgba(60,55,45,0.18)'); g.fillStyle = gr; g.fillRect(0, 0, n, n);
  },
  // concrete blocks for basements: rough faces, deep joints, damp stains
  block(g, n, r) {
    g.fillStyle = grey(120); g.fillRect(0, 0, n, n);
    const rows = 4, bw = n / 2, bh = n / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 3; x++) {
      const ox = (y % 2) * bw / 2, v = 185 + r() * 40;
      g.fillStyle = grey(v); g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, bh - 6);
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(x * bw + ox + 3, y * bh + 3, bw - 6, 2);
      g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x * bw + ox + 3, y * bh + bh - 7, bw - 6, 4);
    }
    noise(g, n, r, 26, 1);
    for (let i = 0; i < 3; i++) { const x = r() * n; const gr = g.createLinearGradient(0, 0, 0, n); gr.addColorStop(0, 'rgba(50,60,50,0)'); gr.addColorStop(1, 'rgba(50,60,50,0.22)'); g.fillStyle = gr; g.fillRect(x, n * 0.3, 18 + r() * 30, n * 0.7); }
  },
  // shingles: rows of overlapping tabs with shadowed lower edges and the odd missing one
  shingle(g, n, r) {
    const rows = 8, h = n / rows, w = n / 6;
    g.fillStyle = grey(45); g.fillRect(0, 0, n, n);
    for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
      if (r() < 0.03) continue;
      const ox = (y % 2) * w / 2, v = 165 + r() * 75;
      g.fillStyle = grey(v); g.beginPath(); g.moveTo(x * w + ox + 1.5, y * h); g.lineTo(x * w + ox + w - 1.5, y * h);
      g.lineTo(x * w + ox + w - 1.5, y * h + h * 0.82); g.quadraticCurveTo(x * w + ox + w / 2, y * h + h + 3, x * w + ox + 1.5, y * h + h * 0.82); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x * w + ox + 3, y * h + 2, w - 6, 2);
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x * w + ox + 1.5, y * h + h * 0.72, w - 3, 3);
      for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(x * w + ox + r() * w, y * h + r() * h * 0.7, 2, 2); }
    }
  },
  // rusty metal for pipes, boilers and cellar doors
  rust(g, n, r) {
    g.fillStyle = grey(190); g.fillRect(0, 0, n, n); noise(g, n, r, 30, 1);
    for (let i = 0; i < 14; i++) { const x = r() * n, y = r() * n, gr = g.createRadialGradient(x, y, 1, x, y, 6 + r() * 24); gr.addColorStop(0, `rgba(120,60,20,${0.3 + r() * 0.3})`); gr.addColorStop(1, 'rgba(120,60,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, n, n); }
    for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(80,40,10,${0.2 + r() * 0.2})`; g.fillRect(r() * n, r() * n, 1.5, 10 + r() * 30); }
  },
  // rough stone (foundations, paths, fountains)
  stone(g, n, r) {
    g.fillStyle = grey(110); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 26; i++) {
      const x = r() * n, y = r() * n, s = 14 + r() * 26, v = 160 + r() * 80;
      g.fillStyle = grey(v); g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; g.lineTo(x + Math.cos(a) * s * (0.7 + r() * 0.3), y + Math.sin(a) * s * (0.5 + r() * 0.3)); } g.fill();
      g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x - s * 0.4, y - s * 0.35, s * 0.6, 2);
    }
    noise(g, n, r, 18, 2);
  },
  planks: (g, n, r) => DRAW.board(g, n, r),
});
