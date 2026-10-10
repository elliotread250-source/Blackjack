// Procedural textures drawn on canvases at load time: no image files. Most are light grey patterns
// that the per-box vertex colour tints, so one "paper2" texture serves every damask wallpaper.
import * as THREE from 'three';

// metres covered by one repeat of each texture (world-space UVs divide by this)
export const TEX_SCALE = {
  grass: 3, asphalt: 5, paving: 1.6, concrete: 3, brick: 1.4, siding: 1.6, shingle: 1.6, trim: 2, paint: 2,
  paper1: 0.9, paper2: 0.8, paper3: 0.7, panel: 1.6, tile: 0.9, checker: 0.8, woodfloor: 2, carpet: 1.2, plaster: 2.5,
  wood: 1.2, fabric: 0.6, metal: 1, fence: 1.8, board: 1, block: 1.6, attic: 2, counter: 1, hedge: 1.2, dirt: 1.2,
  bark: 1, garagedoor: 2.4, roofflat: 2.5, cardboard: 1, crate: 0.7, door: 1, emissive: 1, glass: 1,
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
    const n = k === 'emissive' || k === 'glass' ? 4 : size;
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
