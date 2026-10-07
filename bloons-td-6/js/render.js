'use strict';
// Drawing. Maps and bloons are pre-rendered to offscreen canvases; monkeys,
// projectiles and effects are drawn each frame with vector shapes.
(function () {
  const TAU = Math.PI * 2;
  const B = BTD.BLOONS;
  const R = {};
  BTD.R = R;

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const shade = (hex, f) => {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  };
  R.shade = shade;
  function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  // ---------------- MAP ----------------
  R.renderMap = function (G, scale) {
    const W = BTD.W, H = BTD.H;
    const c = mk(Math.round(W * scale), Math.round(H * scale));
    const x = c.getContext('2d');
    x.scale(scale, scale);
    const th = BTD.THEMES[G.map.theme];
    const rnd = seeded(G.decoSeed | 0);
    // ground
    x.fillStyle = th.g1; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) {
      x.fillStyle = rnd() < 0.5 ? th.g2 : th.g3;
      x.globalAlpha = 0.35 + rnd() * 0.35;
      const px = rnd() * W, py = rnd() * H, r = 3 + rnd() * 12;
      x.beginPath(); x.ellipse(px, py, r, r * 0.6, rnd() * 3, 0, TAU); x.fill();
    }
    x.globalAlpha = 1;
    if (th.deco === 'tiles') {
      x.strokeStyle = 'rgba(160,130,90,0.25)'; x.lineWidth = 1.5;
      for (let i = 0; i <= W; i += 40) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
      for (let j = 0; j <= H; j += 40) { x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
    }
    if (th.deco === 'cubes') {
      for (let i = 0; i < 60; i++) {
        const px = rnd() * W, py = rnd() * H, s = 10 + rnd() * 26;
        x.fillStyle = ['#d0d9e6', '#c3cfdf', '#dbe3ee'][i % 3];
        x.fillRect(px, py, s, s);
      }
    }
    // grass blades / flowers / etc
    for (let i = 0; i < 260; i++) {
      const px = rnd() * W, py = rnd() * H;
      if (th.deco === 'flowers') {
        if (rnd() < 0.25) { x.fillStyle = ['#ffffff', '#ffe14a', '#ff8fc2', '#b48cff'][(rnd() * 4) | 0]; x.beginPath(); x.arc(px, py, 2.4, 0, TAU); x.fill(); }
        else { x.strokeStyle = th.g2; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 2, py - 6); x.moveTo(px + 3, py); x.lineTo(px + 3, py - 7); x.stroke(); }
      } else if (th.deco === 'leaves') {
        x.fillStyle = ['#e0822a', '#c45b1d', '#f2b134', '#a5531a'][(rnd() * 4) | 0];
        x.beginPath(); x.ellipse(px, py, 4, 2, rnd() * 3, 0, TAU); x.fill();
      } else if (th.deco === 'snow') {
        x.fillStyle = 'rgba(160,190,215,0.35)'; x.beginPath(); x.ellipse(px, py, 8 + rnd() * 10, 3, 0, 0, TAU); x.fill();
      } else if (th.deco === 'graves') {
        if (rnd() < 0.08) { x.fillStyle = '#5c6070'; x.fillRect(px, py, 10, 14); x.beginPath(); x.arc(px + 5, py, 5, Math.PI, 0); x.fill(); }
        else { x.fillStyle = 'rgba(20,30,20,0.3)'; x.beginPath(); x.arc(px, py, 2, 0, TAU); x.fill(); }
      } else if (th.deco === 'embers') {
        x.fillStyle = rnd() < 0.3 ? 'rgba(255,120,40,0.6)' : 'rgba(20,10,8,0.4)'; x.beginPath(); x.arc(px, py, 1.5 + rnd() * 2, 0, TAU); x.fill();
      }
    }
    // water
    for (const w of G.map.water || []) {
      const shape = (pad) => {
        x.beginPath();
        if (w.t === 'circle') x.arc(w.x, w.y, w.r + pad, 0, TAU);
        else x.ellipse(w.x, w.y, w.rx + pad, w.ry + pad, 0, 0, TAU);
      };
      x.fillStyle = th.deco === 'tiles' ? '#f7f2e6' : th.deco === 'graves' ? '#4a4e44' : '#d8c38e';
      shape(9); x.fill();
      const rr = w.r || Math.max(w.rx, w.ry);
      const g = x.createRadialGradient(w.x, w.y, 4, w.x, w.y, rr);
      if (th.deco === 'graves') { g.addColorStop(0, '#2c5a7a'); g.addColorStop(1, '#1b3a52'); }
      else if (th.deco === 'tiles') { g.addColorStop(0, '#7ff0f0'); g.addColorStop(1, '#2bb8d4'); }
      else { g.addColorStop(0, '#5fc3ff'); g.addColorStop(1, '#2b86d6'); }
      x.fillStyle = g; shape(0); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = rnd() * TAU, d = rnd() * 0.6;
        const px = w.x + Math.cos(a) * (w.rx || w.r) * d, py = w.y + Math.sin(a) * (w.ry || w.r) * d;
        x.beginPath(); x.arc(px, py, 8 + rnd() * 8, Math.PI * 1.1, Math.PI * 1.6); x.stroke();
      }
    }
    // lava
    for (const l of G.map.lava || []) {
      x.fillStyle = '#2a1a16'; x.beginPath(); x.arc(l.x, l.y, l.r + 7, 0, TAU); x.fill();
      const g = x.createRadialGradient(l.x, l.y, 4, l.x, l.y, l.r);
      g.addColorStop(0, '#ffe066'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#c42a0a');
      x.fillStyle = g; x.beginPath(); x.arc(l.x, l.y, l.r, 0, TAU); x.fill();
      x.fillStyle = 'rgba(60,20,10,0.5)';
      for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = rnd() * l.r * 0.7; x.beginPath(); x.ellipse(l.x + Math.cos(a) * d, l.y + Math.sin(a) * d, 6 + rnd() * 8, 4, rnd() * 3, 0, TAU); x.fill(); }
    }
    // track
    const tw = BTD.TRACK_W;
    const strokePath = (p, w, col) => {
      x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round';
      x.beginPath(); x.moveTo(p.x[0], p.y[0]);
      for (let i = 1; i < p.n; i++) x.lineTo(p.x[i], p.y[i]);
      x.stroke();
    };
    for (const p of G.paths) strokePath(p, tw + 10, 'rgba(0,0,0,0.12)');
    for (const p of G.paths) strokePath(p, tw + 6, th.edge);
    for (const p of G.paths) strokePath(p, tw, th.track);
    for (const p of G.paths) strokePath(p, tw * 0.5, shade(th.track, 0.08));
    for (const p of G.paths) {
      for (let i = 0; i < p.n; i += 5) {
        if (rnd() < 0.5) continue;
        const off = (rnd() - 0.5) * tw * 0.8;
        const a = p.a[i] + Math.PI / 2;
        x.fillStyle = rnd() < 0.5 ? th.shade : shade(th.track, 0.15);
        x.beginPath(); x.ellipse(p.x[i] + Math.cos(a) * off, p.y[i] + Math.sin(a) * off, 1.5 + rnd() * 2.5, 1.2 + rnd() * 1.5, rnd() * 3, 0, TAU); x.fill();
      }
    }
    // stump (bloons vanish into it)
    if (G.map.stump) {
      const [sx, sy, sr] = G.map.stump;
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.ellipse(sx + 6, sy + 8, sr + 8, sr + 4, 0, 0, TAU); x.fill();
      x.fillStyle = '#7a4a22'; x.beginPath(); x.arc(sx, sy, sr + 6, 0, TAU); x.fill();
      x.fillStyle = '#d9a866'; x.beginPath(); x.arc(sx, sy, sr, 0, TAU); x.fill();
      x.strokeStyle = '#b07d44'; x.lineWidth = 2;
      for (let r = 10; r < sr; r += 9) { x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.stroke(); }
      x.fillStyle = '#2a1608'; x.beginPath(); x.arc(sx, sy, 20, 0, TAU); x.fill();
    }
    // trees and props
    for (const t of G.trees) drawProp(x, t, th, G.map.theme);
    if (G.map.castle) drawCastle(x, G.map.castle[0], G.map.castle[1]);
    return c;
  };
  function drawCastle(x, cx, cy) {
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(cx - 62, cy - 70, 140, 150);
    x.fillStyle = '#5a5f6a'; x.fillRect(cx - 70, cy - 78, 140, 156);
    x.fillStyle = '#6c717d';
    for (let i = 0; i < 7; i++) x.fillRect(cx - 70 + i * 21, cy - 92, 13, 16);
    for (const [tx, ty] of [[-70, -78], [70, -78], [-70, 78], [70, 78]]) {
      x.fillStyle = '#4c515c'; x.beginPath(); x.arc(cx + tx, cy + ty, 24, 0, TAU); x.fill();
      x.fillStyle = '#7a3a8a'; x.beginPath(); x.moveTo(cx + tx, cy + ty - 30); x.lineTo(cx + tx - 18, cy + ty); x.lineTo(cx + tx + 18, cy + ty); x.closePath(); x.fill();
    }
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1.5;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) x.strokeRect(cx - 70 + i * 24 + (j % 2) * 12, cy - 78 + j * 22, 24, 22);
    x.fillStyle = '#1a1018'; x.beginPath(); x.moveTo(cx - 52, cy + 26); x.lineTo(cx - 52, cy - 14); x.arc(cx - 32, cy - 14, 20, Math.PI, 0); x.lineTo(cx - 12, cy + 26); x.closePath(); x.fill();
    x.fillStyle = '#ffcf3a'; for (const s of [-1, 1]) { x.fillRect(cx + 20, cy + s * 34 - 8, 10, 16); }
  }
  function drawProp(x, t, th, theme) {
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.beginPath(); x.ellipse(t.x + 6, t.y + 7, t.r, t.r * 0.8, 0, 0, TAU); x.fill();
    if (theme === 'snow') {
      for (let i = 0; i < 3; i++) {
        const s = t.r * (1.1 - i * 0.28);
        x.fillStyle = th.tree[i % 3];
        x.beginPath(); x.moveTo(t.x, t.y - t.r * 1.2 + i * 6);
        x.lineTo(t.x - s, t.y + s * 0.6 - i * 4); x.lineTo(t.x + s, t.y + s * 0.6 - i * 4); x.closePath(); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.75)';
        x.beginPath(); x.moveTo(t.x, t.y - t.r * 1.2 + i * 6); x.lineTo(t.x - s * 0.4, t.y - t.r * 0.6 + i * 6); x.lineTo(t.x + s * 0.3, t.y - t.r * 0.7 + i * 6); x.fill();
      }
      return;
    }
    if (theme === 'cubism') {
      const s = t.r * 1.3;
      x.fillStyle = th.tree[(t.v * 3) | 0]; x.fillRect(t.x - s / 2, t.y - s / 2, s, s);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(t.x - s / 2, t.y - s / 2, s, s * 0.25);
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; x.strokeRect(t.x - s / 2, t.y - s / 2, s, s);
      return;
    }
    if (theme === 'lava') {
      x.fillStyle = '#2b1d19';
      x.beginPath();
      for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU, r = t.r * (0.75 + ((i * 37 + t.v * 100) % 10) / 30); x.lineTo(t.x + Math.cos(a) * r, t.y + Math.sin(a) * r); }
      x.closePath(); x.fill();
      x.fillStyle = '#4a342c'; x.beginPath(); x.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, t.r * 0.4, 0, TAU); x.fill();
      return;
    }
    if (theme === 'dark') {
      x.strokeStyle = '#1e1a16'; x.lineWidth = 4; x.lineCap = 'round';
      x.beginPath(); x.moveTo(t.x, t.y + t.r * 0.6); x.lineTo(t.x, t.y - t.r * 0.4);
      x.moveTo(t.x, t.y - t.r * 0.1); x.lineTo(t.x - t.r * 0.7, t.y - t.r * 0.8);
      x.moveTo(t.x, t.y - t.r * 0.2); x.lineTo(t.x + t.r * 0.6, t.y - t.r);
      x.moveTo(t.x, t.y - t.r * 0.4); x.lineTo(t.x + t.r * 0.1, t.y - t.r * 1.2); x.stroke();
      return;
    }
    const [c1, c2, c3] = th.tree;
    x.fillStyle = c2; x.beginPath(); x.arc(t.x, t.y, t.r, 0, TAU); x.fill();
    x.fillStyle = c1;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + t.v * 6; x.beginPath(); x.arc(t.x + Math.cos(a) * t.r * 0.45, t.y + Math.sin(a) * t.r * 0.45, t.r * 0.55, 0, TAU); x.fill(); }
    x.fillStyle = c3; x.beginPath(); x.arc(t.x - t.r * 0.3, t.y - t.r * 0.35, t.r * 0.4, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 1.5; x.beginPath(); x.arc(t.x, t.y, t.r, 0, TAU); x.stroke();
  }

  // ---------------- BLOONS ----------------
  const bcache = new Map();
  const RAINBOW = ['#ff2a2a', '#ff9a1a', '#ffe11c', '#3fd12a', '#2a8df0', '#8b3ad8'];
  function bloonBody(x, type, r, flags, dmg) {
    const def = B[type];
    const rx = r * 0.86, ry = r;
    x.save();
    // knot
    x.fillStyle = type === 'rainbow' ? '#8b3ad8' : type === 'zebra' ? '#222' : shade(def.color, -0.3);
    x.beginPath(); x.moveTo(-r * 0.18, ry * 0.95); x.lineTo(r * 0.18, ry * 0.95); x.lineTo(0, ry * 0.78); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.closePath();
    x.save(); x.clip();
    if (type === 'rainbow') {
      for (let i = 0; i < 6; i++) { x.fillStyle = RAINBOW[i]; x.fillRect(-rx + (i * 2 * rx) / 6, -ry, (2 * rx) / 6 + 0.5, ry * 2); }
    } else if (type === 'zebra') {
      x.fillStyle = '#f7f7f7'; x.fillRect(-rx, -ry, rx * 2, ry * 2);
      x.fillStyle = '#1b1b1d';
      for (let i = -3; i <= 3; i++) { x.beginPath(); x.moveTo(-rx, i * r * 0.36); x.quadraticCurveTo(0, i * r * 0.36 - r * 0.2, rx, i * r * 0.36); x.lineTo(rx, i * r * 0.36 + r * 0.13); x.quadraticCurveTo(0, i * r * 0.36 - r * 0.07, -rx, i * r * 0.36 + r * 0.13); x.fill(); }
    } else {
      const g = x.createRadialGradient(-rx * 0.35, -ry * 0.4, r * 0.1, 0, 0, r * 1.15);
      if (type === 'lead') { g.addColorStop(0, '#d8dde2'); g.addColorStop(0.5, '#8b9097'); g.addColorStop(1, '#4c5157'); }
      else if (type === 'ceramic') { g.addColorStop(0, '#e5a35e'); g.addColorStop(0.6, '#b8722e'); g.addColorStop(1, '#7a4618'); }
      else if (type === 'black') { g.addColorStop(0, '#6a6a70'); g.addColorStop(0.5, '#1b1b1d'); g.addColorStop(1, '#000'); }
      else if (type === 'white') { g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e7eaee'); g.addColorStop(1, '#b8bec6'); }
      else { g.addColorStop(0, shade(def.color, 0.45)); g.addColorStop(0.55, def.color); g.addColorStop(1, shade(def.color, -0.35)); }
      x.fillStyle = g; x.fillRect(-rx, -ry, rx * 2, ry * 2);
      if (type === 'ceramic') {
        x.strokeStyle = 'rgba(255,220,170,0.6)'; x.lineWidth = r * 0.12;
        for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(-rx, i * r * 0.45); x.lineTo(0, i * r * 0.45 - r * 0.25); x.lineTo(rx, i * r * 0.45); x.stroke(); }
        if (dmg > 0) {
          x.strokeStyle = 'rgba(60,30,10,0.9)'; x.lineWidth = 1.4;
          const cr = [[[-0.3, -0.5], [-0.1, -0.1], [-0.35, 0.2]], [[0.4, -0.3], [0.1, 0.1], [0.35, 0.45]], [[-0.2, 0.6], [0.05, 0.25], [0.3, 0.1]]];
          for (let k = 0; k < dmg; k++) { x.beginPath(); cr[k].forEach(([a, b], i) => (i ? x.lineTo(a * rx, b * ry) : x.moveTo(a * rx, b * ry))); x.stroke(); }
        }
      }
    }
    if (flags.includes('c')) {
      const rnd = seeded(type.length * 77);
      const cc = ['#3d6e2a', '#6b8f3a', '#4a3a22', '#86a856'];
      for (let i = 0; i < 9; i++) { x.fillStyle = cc[i % 4]; x.globalAlpha = 0.85; x.beginPath(); x.ellipse((rnd() - 0.5) * rx * 2, (rnd() - 0.5) * ry * 2, r * (0.25 + rnd() * 0.25), r * (0.18 + rnd() * 0.15), rnd() * 3, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
    }
    if (flags.includes('f')) {
      x.fillStyle = '#9aa3ad'; x.fillRect(-rx, -r * 0.12, rx * 2, r * 0.24); x.fillRect(-r * 0.12, -ry, r * 0.24, ry * 2);
      x.fillStyle = '#e6eaee';
      for (const [a, b] of [[-0.6, 0], [0.6, 0], [0, -0.65], [0, 0.65]]) { x.beginPath(); x.arc(a * rx, b * ry, r * 0.08, 0, TAU); x.fill(); }
    }
    x.restore();
    // highlight + outline
    x.fillStyle = 'rgba(255,255,255,0.55)';
    x.beginPath(); x.ellipse(-rx * 0.38, -ry * 0.42, rx * 0.22, ry * 0.32, -0.5, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = Math.max(1, r * 0.09);
    x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, TAU); x.stroke();
    if (flags.includes('r')) {
      x.strokeStyle = '#ff5fb0'; x.lineWidth = r * 0.12; x.setLineDash([r * 0.22, r * 0.18]);
      x.beginPath(); x.ellipse(0, 0, rx + r * 0.16, ry + r * 0.16, 0, 0, TAU); x.stroke(); x.setLineDash([]);
    }
    x.restore();
  }
  function blimpBody(x, type, flags, dmg) {
    const def = B[type];
    const L = def.len, Wd = def.wid;
    const col = def.color;
    x.save();
    // fins
    x.fillStyle = shade(col, -0.35);
    const fin = (sy) => { x.beginPath(); x.moveTo(-L * 0.32, 0); x.lineTo(-L * 0.55, sy * Wd * 0.62); x.lineTo(-L * 0.42, sy * Wd * 0.62); x.lineTo(-L * 0.18, sy * Wd * 0.2); x.closePath(); x.fill(); };
    fin(1); fin(-1);
    x.fillRect(-L * 0.56, -Wd * 0.06, L * 0.2, Wd * 0.12);
    // body
    const g = x.createLinearGradient(0, -Wd / 2, 0, Wd / 2);
    g.addColorStop(0, shade(col, 0.4)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.45));
    x.fillStyle = g;
    x.beginPath(); x.ellipse(0, 0, L / 2, Wd / 2, 0, 0, TAU); x.fill();
    x.save(); x.beginPath(); x.ellipse(0, 0, L / 2, Wd / 2, 0, 0, TAU); x.clip();
    // panels
    x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(i * L * 0.16, -Wd); x.lineTo(i * L * 0.16, Wd); x.stroke(); }
    if (type === 'zomg') { x.fillStyle = '#9be32c'; x.fillRect(-L / 2, -Wd * 0.08, L, Wd * 0.16); }
    if (type === 'bad') { x.fillStyle = 'rgba(30,0,60,0.45)'; x.fillRect(-L / 2, -Wd * 0.18, L, Wd * 0.36); }
    if (type === 'ddt') {
      x.fillStyle = 'rgba(80,90,70,0.8)';
      for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(-L * 0.35 + i * L * 0.14, (i % 2 ? 1 : -1) * Wd * 0.15, L * 0.07, Wd * 0.12, 0, 0, TAU); x.fill(); }
    }
    if (flags.includes('f')) {
      x.fillStyle = '#9aa3ad';
      x.fillRect(-L / 2, -Wd * 0.38, L, Wd * 0.1); x.fillRect(-L / 2, Wd * 0.28, L, Wd * 0.1);
    }
    // damage
    if (dmg > 0) {
      x.strokeStyle = 'rgba(0,0,0,0.65)'; x.lineWidth = 2;
      const rnd = seeded(type.length * 31 + 5);
      for (let k = 0; k < dmg * 3; k++) {
        const px = (rnd() - 0.5) * L * 0.8, py = (rnd() - 0.5) * Wd * 0.7;
        x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 14, py + (rnd() - 0.5) * 10); x.lineTo(px + (rnd() - 0.5) * 18, py + (rnd() - 0.5) * 14); x.stroke();
        if (dmg >= 3 && k % 2 === 0) { x.fillStyle = 'rgba(20,20,20,0.5)'; x.beginPath(); x.arc(px, py, 3, 0, TAU); x.fill(); }
      }
    }
    x.restore();
    // highlight
    x.fillStyle = 'rgba(255,255,255,0.3)';
    x.beginPath(); x.ellipse(L * 0.05, -Wd * 0.26, L * 0.32, Wd * 0.09, 0, 0, TAU); x.fill();
    // eyes at the nose
    const ex = L * 0.3;
    x.fillStyle = type === 'zomg' || type === 'ddt' ? '#c7ff3a' : type === 'bad' ? '#ff3ad1' : '#fff';
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(ex, s * Wd * 0.15, L * 0.055, Wd * 0.1, 0, 0, TAU); x.fill(); }
    x.fillStyle = '#000';
    for (const s of [-1, 1]) { x.beginPath(); x.arc(ex + L * 0.02, s * Wd * 0.14, Wd * 0.05, 0, TAU); x.fill(); }
    x.strokeStyle = '#000'; x.lineWidth = 2.4;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(ex - L * 0.06, s * Wd * 0.3); x.lineTo(ex + L * 0.06, s * Wd * 0.18); x.stroke(); }
    x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 2;
    x.beginPath(); x.ellipse(0, 0, L / 2, Wd / 2, 0, 0, TAU); x.stroke();
    x.restore();
  }
  R.bloonSprite = function (type, flags, dmg) {
    const key = type + '|' + flags + '|' + dmg;
    let c = bcache.get(key);
    if (c) return c;
    const def = B[type];
    const S = 3;
    if (def.moab) {
      const w = Math.ceil(def.len * 1.25 * S), h = Math.ceil(def.wid * 1.5 * S);
      c = mk(w, h);
      const x = c.getContext('2d');
      x.translate(w / 2, h / 2); x.scale(S, S);
      blimpBody(x, type, flags, dmg);
    } else {
      const r = def.r;
      const sz = Math.ceil(r * 2.8 * S);
      c = mk(sz, sz);
      const x = c.getContext('2d');
      x.translate(sz / 2, sz / 2); x.scale(S, S);
      bloonBody(x, type, r, flags, dmg);
    }
    c.S = S;
    bcache.set(key, c);
    return c;
  };
  function bloonFlags(b) { return (b.camo ? 'c' : '') + (b.regrow ? 'r' : '') + (b.fort ? 'f' : ''); }
  function dmgLevel(b) {
    if (b.t === 'ceramic') return b.hp >= b.maxHp * 0.75 ? 0 : b.hp >= b.maxHp * 0.5 ? 1 : b.hp >= b.maxHp * 0.25 ? 2 : 3;
    if (b.def.moab) return b.hp >= b.maxHp * 0.8 ? 0 : b.hp >= b.maxHp * 0.6 ? 1 : b.hp >= b.maxHp * 0.4 ? 2 : b.hp >= b.maxHp * 0.2 ? 3 : 4;
    return 0;
  }
  R.drawBloon = function (x, b) {
    const s = R.bloonSprite(b.t, bloonFlags(b), dmgLevel(b));
    const w = s.width / s.S, h = s.height / s.S;
    if (b.def.moab) {
      x.save(); x.translate(b.x, b.y); x.rotate(b.ang);
      x.drawImage(s, -w / 2, -h / 2, w, h);
      x.restore();
    } else {
      x.drawImage(s, b.x - w / 2, b.y - h / 2 - 2, w, h);
    }
    if (b.frozen > 0) {
      x.fillStyle = 'rgba(190,240,255,0.55)'; x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1.5;
      const r = b.r + 3;
      x.beginPath();
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; x.lineTo(b.x + Math.cos(a) * r, b.y + Math.sin(a) * r); }
      x.closePath(); x.fill(); x.stroke();
    }
    if (b.glue) {
      x.fillStyle = b.glue.dot ? 'rgba(170,230,40,0.55)' : 'rgba(230,240,120,0.55)';
      x.beginPath(); x.arc(b.x - b.r * 0.2, b.y + b.r * 0.2, b.r * 0.7, 0, TAU); x.fill();
      x.beginPath(); x.arc(b.x + b.r * 0.4, b.y - b.r * 0.1, b.r * 0.4, 0, TAU); x.fill();
    }
    if (b.burn) {
      x.fillStyle = 'rgba(255,140,30,0.75)';
      const t = performance.now() / 90;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(b.x + Math.sin(t + i * 2) * b.r * 0.5, b.y - b.r * 0.6 - (i % 2) * 3, 3 + (i % 2), 0, TAU); x.fill(); }
    }
    if (b.acid) { x.fillStyle = 'rgba(110,255,60,0.5)'; x.beginPath(); x.arc(b.x, b.y + b.r * 0.5, b.r * 0.45, 0, TAU); x.fill(); }
    if (b.stun > 0) {
      x.fillStyle = '#ffe14a';
      const t = performance.now() / 200;
      for (let i = 0; i < 3; i++) { const a = t + (i / 3) * TAU; x.beginPath(); x.arc(b.x + Math.cos(a) * b.r * 0.9, b.y - b.r - 2 + Math.sin(a) * 3, 2.4, 0, TAU); x.fill(); }
    }
    if (b.gold) { x.strokeStyle = 'rgba(255,215,40,0.9)'; x.lineWidth = 2; x.beginPath(); x.arc(b.x, b.y, b.r + 1, 0, TAU); x.stroke(); }
    if (b.flash > 0 && b.def.moab) { x.save(); x.translate(b.x, b.y); x.rotate(b.ang); x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(0, 0, b.def.len / 2, b.def.wid / 2, 0, 0, TAU); x.fill(); x.restore(); }
  };
  R.drawHealthBar = function (x, b) {
    if (!b.def.moab) return;
    const w = b.def.len * 0.7, f = Math.max(0, b.hp / b.maxHp);
    x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(b.x - w / 2 - 1, b.y - b.def.wid * 0.7 - 1, w + 2, 6);
    x.fillStyle = f > 0.5 ? '#5fe34a' : f > 0.25 ? '#ffd02a' : '#ff4a3a';
    x.fillRect(b.x - w / 2, b.y - b.def.wid * 0.7, w * f, 4);
  };

  // ---------------- MONKEYS ----------------
  const FUR = '#8a5a2b', FACE = '#e9c597';
  function monkey(x, r, o) {
    o = o || {};
    const fur = o.fur || FUR, face = o.face || FACE;
    // tail
    x.strokeStyle = shade(fur, -0.15); x.lineWidth = r * 0.18; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-r * 0.7, 0); x.quadraticCurveTo(-r * 1.3, r * 0.2, -r * 1.1, r * 0.75); x.stroke();
    // ears
    x.fillStyle = fur;
    for (const s of [-1, 1]) { x.beginPath(); x.arc(-r * 0.05, s * r * 0.82, r * 0.3, 0, TAU); x.fill(); }
    x.fillStyle = face;
    for (const s of [-1, 1]) { x.beginPath(); x.arc(-r * 0.05, s * r * 0.82, r * 0.17, 0, TAU); x.fill(); }
    // head
    const g = x.createRadialGradient(-r * 0.25, -r * 0.25, r * 0.1, 0, 0, r);
    g.addColorStop(0, shade(fur, 0.25)); g.addColorStop(1, shade(fur, -0.2));
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.8, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 1.2; x.stroke();
    // face
    x.fillStyle = face;
    x.beginPath(); x.ellipse(r * 0.38, 0, r * 0.42, r * 0.5, 0, 0, TAU); x.fill();
    x.fillStyle = '#1a0f05';
    for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.42, s * r * 0.2, r * 0.09, 0, TAU); x.fill(); }
    x.fillStyle = '#fff';
    for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.45, s * r * 0.2 - r * 0.03, r * 0.03, 0, TAU); x.fill(); }
  }
  function arm(x, r, side, len, col) {
    x.strokeStyle = col || shade(FUR, -0.1); x.lineWidth = r * 0.22; x.lineCap = 'round';
    x.beginPath(); x.moveTo(r * 0.1, side * r * 0.6); x.lineTo(r * 0.1 + len, side * r * 0.45); x.stroke();
  }
  function hat(x, r, col, brim) {
    x.fillStyle = col; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.62, 0, TAU); x.fill();
    if (brim) { x.fillStyle = shade(col, -0.25); x.beginPath(); x.ellipse(r * 0.15, 0, r * 0.25, r * 0.6, 0, -Math.PI / 2, Math.PI / 2); x.fill(); }
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.62, 0, TAU); x.stroke();
  }
  function band(x, r, col) {
    x.strokeStyle = col; x.lineWidth = r * 0.16;
    x.beginPath(); x.arc(0, 0, r * 0.68, Math.PI * 0.55, Math.PI * 1.45); x.stroke();
  }
  function topPath(up) {
    let best = -1, bv = 0;
    for (let i = 0; i < 3; i++) if (up[i] > bv) { bv = up[i]; best = i; }
    return [best, bv];
  }
  const PATHCOL = ['#e8402a', '#2a8df0', '#3fbf2a'];

  R.drawTower = function (x, t, now) {
    const k = t.k, up = t.up || [0, 0, 0], r = t.r || 16;
    const [tp, tv] = topPath(up);
    const ang = t.ang != null ? t.ang : -Math.PI / 2;
    x.save();
    x.translate(t.x, t.y);
    // shadow
    x.fillStyle = 'rgba(0,0,0,0.22)';
    x.beginPath(); x.ellipse(3, 4, r * 1.05, r * 0.9, 0, 0, TAU); x.fill();
    if (tv >= 5) {
      const gl = x.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.8);
      gl.addColorStop(0, 'rgba(255,220,60,0.55)'); gl.addColorStop(1, 'rgba(255,220,60,0)');
      x.fillStyle = gl; x.beginPath(); x.arc(0, 0, r * 1.8, 0, TAU); x.fill();
    }
    if (t.sprite === 'sentry') { drawSentry(x, t, ang); x.restore(); return; }
    if (t.hero) { drawHero(x, t, ang, now); x.restore(); return; }
    const D = DRAW[k];
    if (D) D(x, t, r, ang, up, tp, tv, now);
    else { x.rotate(ang); monkey(x, r); }
    x.restore();
    // boost marks
    if (t.boosts && t.boosts.length) {
      for (const b of t.boosts) {
        if (b.fan) { x.save(); x.translate(t.x, t.y); x.fillStyle = b.fan === 2 ? 'rgba(255,60,255,0.35)' : 'rgba(60,120,255,0.35)'; x.beginPath(); x.arc(0, 0, r * 1.1, 0, TAU); x.fill(); x.fillStyle = '#e8402a'; x.beginPath(); x.moveTo(-r * 0.6, r * 0.3); x.lineTo(-r * 1.2, r * 1.1); x.lineTo(-r * 0.2, r * 0.8); x.fill(); x.restore(); }
        if (b.brew) { x.fillStyle = 'rgba(255,60,60,0.8)'; x.beginPath(); x.arc(t.x + r * 0.8, t.y - r * 0.8, 4, 0, TAU); x.fill(); }
        if (b.overclock) { x.strokeStyle = 'rgba(80,210,255,0.8)'; x.lineWidth = 2; x.beginPath(); x.arc(t.x, t.y, r + 3, 0, TAU); x.stroke(); }
        if (b.tonic) { x.fillStyle = 'rgba(150,255,60,0.35)'; x.beginPath(); x.arc(t.x, t.y, r * 1.25, 0, TAU); x.fill(); }
        if (b.phoenix) { const a = now / 600; x.save(); x.translate(t.x + Math.cos(a) * 60, t.y + Math.sin(a) * 60); drawPhoenix(x, a + Math.PI / 2); x.restore(); }
      }
    }
  };
  function drawPhoenix(x, a) {
    x.rotate(a);
    x.fillStyle = '#ff7a1a';
    x.beginPath(); x.moveTo(14, 0); x.lineTo(-10, -18); x.lineTo(-4, 0); x.lineTo(-10, 18); x.closePath(); x.fill();
    x.fillStyle = '#ffd84a'; x.beginPath(); x.arc(6, 0, 6, 0, TAU); x.fill();
  }
  function drawSentry(x, t, ang) {
    x.fillStyle = '#5b6470'; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill();
    x.fillStyle = '#ffcc33'; x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fill();
    x.rotate(ang); x.fillStyle = '#2b2f36'; x.fillRect(2, -2, 12, 4);
  }

  const DRAW = {};
  DRAW.dart = (x, t, r, ang, up) => {
    x.rotate(ang);
    if (up[2] >= 3) { // crossbow
      x.fillStyle = '#6b4a2a'; x.fillRect(r * 0.5, -r * 0.12, r * 1.1, r * 0.24);
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 2; x.beginPath(); x.arc(r * 1.1, 0, r * 0.6, -1.2, 1.2); x.stroke();
    }
    arm(x, r, 1, r * 0.8); arm(x, r, -1, r * 0.5);
    if (up[0] >= 3) { x.fillStyle = up[0] >= 5 ? '#ffcf3a' : up[0] >= 4 ? '#6b6b6b' : '#555'; x.beginPath(); x.arc(r * 1.05, r * 0.45, up[0] >= 4 ? r * 0.55 : r * 0.38, 0, TAU); x.fill(); }
    else { x.fillStyle = '#ccc'; x.fillRect(r * 0.8, r * 0.38, r * 0.6, 2.5); x.fillStyle = '#e8402a'; x.fillRect(r * 0.68, r * 0.34, r * 0.18, 4); }
    monkey(x, r);
    if (up[1] >= 3) band(x, r, '#e8402a');
    if (up[2] >= 2) { x.fillStyle = '#2a3a4a'; for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.42, s * r * 0.2, r * 0.15, 0, TAU); x.fill(); } }
    if (up[1] >= 4) { x.fillStyle = '#2a5bd8'; x.beginPath(); x.arc(-r * 0.2, 0, r * 0.45, 0, TAU); x.fill(); }
  };
  DRAW.boomerang = (x, t, r, ang, up) => {
    x.rotate(ang);
    arm(x, r, 1, r * 0.7);
    if (up[1] >= 3) { x.fillStyle = '#9aa3ad'; x.fillRect(r * 0.2, r * 0.4, r * 0.8, r * 0.3); }
    x.save(); x.translate(r * 0.95, r * 0.5);
    x.fillStyle = up[0] >= 2 ? '#c8d0d8' : up[2] >= 2 ? '#ff6a2a' : '#f5c542';
    x.beginPath(); x.moveTo(-r * 0.4, -r * 0.3); x.quadraticCurveTo(r * 0.5, 0, -r * 0.4, r * 0.3); x.lineTo(-r * 0.15, 0); x.closePath(); x.fill();
    x.restore();
    monkey(x, r);
    if (up[0] >= 3) band(x, r, '#4ab0ff');
    if (up[2] >= 3) hat(x, r * 0.9, '#c48a3a', true);
  };
  DRAW.bomb = (x, t, r, ang, up) => {
    x.fillStyle = '#3c3f45'; x.beginPath(); x.arc(0, 0, r * 0.95, 0, TAU); x.fill();
    x.fillStyle = '#5a5f68'; x.beginPath(); x.arc(0, 0, r * 0.75, 0, TAU); x.fill();
    x.rotate(ang);
    const big = up[0] >= 3, mis = up[1] >= 2;
    x.fillStyle = mis ? '#7a8a6a' : '#22252a';
    x.fillRect(0, -r * (big ? 0.45 : 0.32), r * (mis ? 1.3 : 1.15), r * (big ? 0.9 : 0.64));
    x.fillStyle = '#111'; x.beginPath(); x.arc(r * (mis ? 1.3 : 1.15), 0, r * (big ? 0.42 : 0.3), 0, TAU); x.fill();
    if (mis) { x.fillStyle = '#c8302a'; x.fillRect(r * 0.2, -r * 0.35, r * 0.2, r * 0.7); }
    x.fillStyle = '#2a2d33'; x.beginPath(); x.arc(-r * 0.15, 0, r * 0.4, 0, TAU); x.fill();
    if (up[2] >= 3) { x.fillStyle = '#ffcc33'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-r * 0.5, (i - 1) * r * 0.35, r * 0.13, 0, TAU); x.fill(); } }
  };
  DRAW.tack = (x, t, r, ang, up, tp, tv) => {
    const hot = up[0] >= 3, ring = up[0] >= 4;
    const n = up[2] >= 3 ? 16 : up[2] >= 2 ? 12 : up[2] >= 1 ? 10 : 8;
    x.rotate(t.spin || 0);
    x.fillStyle = '#4a4f57';
    for (let i = 0; i < n; i++) { x.save(); x.rotate((i / n) * TAU); x.fillRect(r * 0.5, -r * 0.12, r * 0.55, r * 0.24); x.restore(); }
    const g = x.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r * 0.8);
    g.addColorStop(0, ring ? '#ffd27a' : hot ? '#ff9a5a' : '#e05a5a'); g.addColorStop(1, ring ? '#c84a0a' : hot ? '#c8302a' : '#8a1f1f');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.72, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = up[1] >= 3 ? '#c8d0d8' : '#2a2d33'; x.beginPath(); x.arc(0, 0, r * 0.28, 0, TAU); x.fill();
  };
  DRAW.ice = (x, t, r, ang, up) => {
    x.rotate(ang);
    if (up[2] >= 3) { x.fillStyle = '#6fb7d8'; x.fillRect(r * 0.2, -r * 0.3, r * 1.1, r * 0.6); x.fillStyle = '#bff1ff'; x.beginPath(); x.arc(r * 1.3, 0, r * 0.3, 0, TAU); x.fill(); }
    arm(x, r, 1, r * 0.4, '#7fb9d8'); arm(x, r, -1, r * 0.4, '#7fb9d8');
    monkey(x, r, { fur: '#7fb9d8', face: '#dff3ff' });
    x.fillStyle = 'rgba(255,255,255,0.9)';
    const n = 5 + up[0];
    for (let i = 0; i < n; i++) { const a = Math.PI * 0.6 + (i / (n - 1)) * Math.PI * 0.8; x.beginPath(); x.moveTo(-r * 0.1 + Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); x.lineTo(-r * 0.1 + Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); x.lineTo(-r * 0.1 + Math.cos(a + 0.15) * r * 0.55, Math.sin(a + 0.15) * r * 0.55); x.fill(); }
    if (up[1] >= 3) { x.strokeStyle = 'rgba(200,240,255,0.7)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, r * 1.2, 0, TAU); x.stroke(); }
  };
  DRAW.glue = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.fillStyle = up[1] >= 3 ? '#7a8a3a' : '#a0b04a'; x.fillRect(r * 0.3, -r * 0.18 + r * 0.45, r * 1.1, r * 0.36);
    x.fillStyle = up[0] >= 2 ? '#7aff3a' : '#e8f07a'; x.beginPath(); x.arc(-r * 0.75, 0, r * 0.45, 0, TAU); x.fill();
    arm(x, r, 1, r * 0.6);
    monkey(x, r);
    if (up[2] >= 3) band(x, r, '#e8f07a');
  };
  DRAW.sniper = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.fillStyle = '#2b2f2a'; x.fillRect(r * 0.2, r * 0.25, r * (up[2] >= 3 ? 1.5 : 1.9), r * 0.18);
    x.fillStyle = '#5a3a1a'; x.fillRect(r * 0.0, r * 0.2, r * 0.5, r * 0.28);
    arm(x, r, 1, r * 0.6); arm(x, r, -1, r * 0.4);
    monkey(x, r);
    hat(x, r * 0.92, '#4f6b2f', true);
    x.fillStyle = 'rgba(40,60,20,0.6)'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(-r * 0.3 + (i % 2) * r * 0.3, (i - 1.5) * r * 0.25, r * 0.12, 0, TAU); x.fill(); }
    if (up[1] >= 1) { x.fillStyle = '#7aff4a'; for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.42, s * r * 0.2, r * 0.13, 0, TAU); x.fill(); } }
  };
  DRAW.sub = (x, t, r, ang, up) => {
    x.rotate(ang);
    const sub = up[0] >= 3;
    x.globalAlpha = sub ? 0.7 : 1;
    const g = x.createLinearGradient(0, -r * 0.6, 0, r * 0.6);
    g.addColorStop(0, '#e8d25a'); g.addColorStop(1, '#8a7a2a');
    x.fillStyle = up[1] >= 3 ? '#5a6a7a' : g;
    x.beginPath(); x.ellipse(0, 0, r * 1.25, r * 0.55, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = '#5a5f68'; x.beginPath(); x.ellipse(r * 0.1, 0, r * 0.35, r * 0.25, 0, 0, TAU); x.fill();
    x.fillStyle = '#9ad8ff'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-r * 0.6 + i * r * 0.35, r * 0.28, r * 0.08, 0, TAU); x.fill(); }
    if (up[2] >= 1) { x.fillStyle = '#333'; x.fillRect(r * 0.9, -r * 0.35, r * 0.4, r * 0.12); x.fillRect(r * 0.9, r * 0.23, r * 0.4, r * 0.12); }
    if (up[0] >= 4) { x.fillStyle = 'rgba(100,255,100,0.8)'; x.beginPath(); x.arc(-r * 0.3, 0, r * 0.18, 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  };
  DRAW.buccaneer = (x, t, r, ang, up) => {
    x.rotate(ang);
    const big = up[0] >= 3 || up[1] >= 3;
    const L = big ? r * 1.5 : r * 1.25;
    x.fillStyle = up[0] >= 3 ? '#6a6f78' : '#8a5a2a';
    x.beginPath(); x.moveTo(L, 0); x.quadraticCurveTo(L * 0.4, -r * 0.75, -L * 0.8, -r * 0.6); x.lineTo(-L * 0.8, r * 0.6); x.quadraticCurveTo(L * 0.4, r * 0.75, L, 0); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 1.5; x.stroke();
    x.fillStyle = up[0] >= 3 ? '#8a8f98' : '#c4914a'; x.beginPath(); x.ellipse(0, 0, L * 0.7, r * 0.45, 0, 0, TAU); x.fill();
    if (up[0] >= 4) { x.fillStyle = '#4a4f57'; x.fillRect(-L * 0.6, -r * 0.35, L * 1.2, r * 0.7); x.strokeStyle = '#fff'; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(-L * 0.6, 0); x.lineTo(L * 0.6, 0); x.stroke(); x.setLineDash([]); }
    x.fillStyle = '#f2efe6'; x.beginPath(); x.moveTo(r * 0.1, -r * 0.05); x.lineTo(-r * 0.35, -r * 0.7); x.lineTo(-r * 0.35, r * 0.7); x.closePath(); x.fill();
    if (up[2] >= 3) { x.fillStyle = '#ffcf3a'; x.beginPath(); x.arc(-r * 0.6, 0, r * 0.18, 0, TAU); x.fill(); }
    x.save(); x.translate(r * 0.45, 0); x.scale(0.45, 0.45); monkey(x, r); x.restore();
  };
  DRAW.ace = (x, t, r, ang, up) => {
    x.fillStyle = '#5a5f68'; x.fillRect(-r, -r * 0.45, r * 2, r * 0.9);
    x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(-r * 0.9, 0); x.lineTo(r * 0.9, 0); x.stroke(); x.setLineDash([]);
  };
  DRAW.heli = (x, t, r) => {
    x.fillStyle = '#4a4f57'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    x.fillStyle = '#ffcf3a'; x.font = `bold ${r}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', 0, 1);
  };
  DRAW.mortar = (x, t, r, ang, up) => {
    x.fillStyle = '#5a5f68'; x.beginPath(); x.arc(r * 0.35, 0, r * 0.6, 0, TAU); x.fill();
    x.fillStyle = '#22252a'; x.beginPath(); x.arc(r * 0.35, 0, r * (up[0] >= 3 ? 0.42 : 0.32), 0, TAU); x.fill();
    if (up[1] >= 4) { for (const s of [-1, 1]) { x.fillStyle = '#5a5f68'; x.beginPath(); x.arc(r * 0.35, s * r * 0.75, r * 0.38, 0, TAU); x.fill(); x.fillStyle = '#22252a'; x.beginPath(); x.arc(r * 0.35, s * r * 0.75, r * 0.24, 0, TAU); x.fill(); } }
    x.save(); x.translate(-r * 0.55, 0); x.scale(0.7, 0.7); x.rotate(ang); monkey(x, r); hat(x, r * 0.9, '#4f6b2f', false); x.restore();
    if (up[2] >= 2) { x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(r * 0.35, 0, r * 0.14, 0, TAU); x.fill(); }
  };
  DRAW.dartling = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.fillStyle = '#3a3f45'; x.fillRect(r * 0.1, -r * 0.35, r * 1.4, r * 0.7);
    x.fillStyle = up[0] >= 3 ? '#ff3a3a' : up[1] >= 3 ? '#7a8a6a' : '#22252a';
    for (const s of [-1, 0, 1]) x.fillRect(r * 1.2, s * r * 0.22 - r * 0.07, r * 0.6, r * 0.14);
    if (up[0] >= 4) { x.fillStyle = 'rgba(255,80,255,0.7)'; x.beginPath(); x.arc(r * 1.8, 0, r * 0.25, 0, TAU); x.fill(); }
    monkey(x, r);
    x.fillStyle = '#2a2d33'; for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.42, s * r * 0.2, r * 0.15, 0, TAU); x.fill(); }
  };
  DRAW.wizard = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.strokeStyle = '#7a4a2a'; x.lineWidth = r * 0.14; x.beginPath(); x.moveTo(r * 0.1, r * 0.55); x.lineTo(r * 1.3, r * 0.55); x.stroke();
    x.fillStyle = up[1] >= 2 ? '#ff7a1a' : '#4ad8ff'; x.beginPath(); x.arc(r * 1.35, r * 0.55, r * 0.2, 0, TAU); x.fill();
    monkey(x, r);
    const hc = up[0] >= 5 || up[1] >= 5 || up[2] >= 5 ? '#ffcf3a' : up[2] >= 4 ? '#3a3a3a' : up[1] >= 3 ? '#c8302a' : '#5a2ab8';
    x.fillStyle = hc; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.62, 0, TAU); x.fill();
    x.fillStyle = shade(hc, 0.3); x.beginPath(); x.arc(-r * 0.15, 0, r * 0.3, 0, TAU); x.fill();
    x.fillStyle = '#ffe14a'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, rr = i % 2 ? r * 0.08 : r * 0.18; x.lineTo(-r * 0.15 + Math.cos(a) * rr, Math.sin(a) * rr); } x.fill();
  };
  DRAW.super = (x, t, r, ang, up) => {
    x.rotate(ang);
    const dark = up[2] >= 3, sun = up[0] >= 3, robo = up[1] >= 3;
    x.fillStyle = dark ? '#1a1a22' : sun ? '#ffcf3a' : '#d8302a';
    x.beginPath(); x.moveTo(-r * 0.2, -r * 0.8); x.lineTo(-r * 1.4, -r * 0.6); x.lineTo(-r * 1.5, r * 0.6); x.lineTo(-r * 0.2, r * 0.8); x.fill();
    if (robo) { x.fillStyle = '#9aa3ad'; x.fillRect(r * 0.1, -r * 0.85, r * 0.9, r * 0.3); x.fillRect(r * 0.1, r * 0.55, r * 0.9, r * 0.3); }
    arm(x, r, 1, r * 0.6, dark ? '#2a2a3a' : '#2a5bd8'); arm(x, r, -1, r * 0.6, dark ? '#2a2a3a' : '#2a5bd8');
    monkey(x, r);
    x.fillStyle = dark ? '#1a1a22' : sun ? '#ff9a1a' : '#2a5bd8'; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.6, Math.PI * 0.5, Math.PI * 1.5); x.fill();
    if (sun) { x.strokeStyle = 'rgba(255,220,60,0.8)'; x.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); x.lineTo(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25); x.stroke(); } }
  };
  DRAW.ninja = (x, t, r, ang, up) => {
    x.rotate(ang);
    arm(x, r, 1, r * 0.6, '#2a2a2a');
    monkey(x, r, { fur: up[0] >= 4 ? '#1a1a1a' : '#c8302a' });
    x.fillStyle = up[0] >= 4 ? '#1a1a1a' : '#c8302a'; x.fillRect(r * 0.05, -r * 0.45, r * 0.25, r * 0.9);
    x.fillStyle = '#eee'; x.fillRect(-r * 0.75, -r * 0.08, r * 0.45, r * 0.16);
    if (up[2] >= 3) { x.fillStyle = '#222'; x.beginPath(); x.arc(-r * 0.6, r * 0.6, r * 0.25, 0, TAU); x.fill(); }
  };
  DRAW.alchemist = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.fillStyle = up[2] >= 3 ? '#ffcf3a' : up[0] >= 3 ? '#ff3a3a' : '#7aff4a';
    x.beginPath(); x.arc(r * 0.95, r * 0.5, r * 0.3, 0, TAU); x.fill();
    x.fillStyle = '#ddd'; x.fillRect(r * 0.88, r * 0.1, r * 0.14, r * 0.2);
    arm(x, r, 1, r * 0.6);
    monkey(x, r);
    hat(x, r * 0.95, '#6a4a2a', true);
    x.fillStyle = '#9ad8ff'; for (const s of [-1, 1]) { x.beginPath(); x.arc(r * 0.05, s * r * 0.22, r * 0.14, 0, TAU); x.fill(); }
  };
  DRAW.druid = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.strokeStyle = '#6a4a2a'; x.lineWidth = r * 0.14; x.beginPath(); x.moveTo(r * 0.1, r * 0.55); x.lineTo(r * 1.2, r * 0.6); x.stroke();
    x.fillStyle = '#3fbf2a'; x.beginPath(); x.arc(r * 1.25, r * 0.6, r * 0.2, 0, TAU); x.fill();
    monkey(x, r);
    const hc = up[0] >= 3 ? '#4a6a8a' : up[2] >= 3 ? '#8a2a1a' : '#3f8a2a';
    x.fillStyle = hc; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.66, Math.PI * 0.45, Math.PI * 1.55); x.fill();
    x.fillStyle = '#7ad84a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(-r * 0.4, (i - 1.5) * r * 0.3, r * 0.16, r * 0.08, 0.6, 0, TAU); x.fill(); }
  };
  DRAW.farm = (x, t, r, ang, up) => {
    x.fillStyle = '#8a5a2a'; x.fillRect(-r, -r, r * 2, r * 2);
    x.fillStyle = '#6a4218'; for (let i = 0; i < 4; i++) x.fillRect(-r, -r + i * r * 0.5 + r * 0.2, r * 2, r * 0.12);
    const n = up[0] >= 3 ? 4 : up[0] >= 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const px = -r * 0.5 + (i % 2) * r, py = -r * 0.5 + Math.floor(i / 2) * r;
      x.fillStyle = '#3f9a2a';
      for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU; x.beginPath(); x.ellipse(px + Math.cos(a) * r * 0.25, py + Math.sin(a) * r * 0.25, r * 0.28, r * 0.12, a, 0, TAU); x.fill(); }
      x.fillStyle = '#ffe14a'; x.beginPath(); x.arc(px, py, r * 0.12, 0, TAU); x.fill();
    }
    if (up[1] >= 3) { x.fillStyle = '#d8d8d8'; x.fillRect(r * 0.3, r * 0.3, r * 0.65, r * 0.65); x.fillStyle = '#3a9b3a'; x.font = `bold ${r * 0.6}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', r * 0.62, r * 0.64); }
    if (up[2] >= 3) { x.fillStyle = '#c8302a'; x.fillRect(-r * 0.95, r * 0.35, r * 0.6, r * 0.6); x.fillStyle = '#fff'; x.fillRect(-r * 0.95, r * 0.35, r * 0.6, r * 0.12); }
    x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1.5; x.strokeRect(-r, -r, r * 2, r * 2);
  };
  DRAW.spike = (x, t, r, ang, up) => {
    x.fillStyle = '#6a6f78'; x.fillRect(-r, -r, r * 2, r * 2);
    x.fillStyle = '#8a8f98'; x.fillRect(-r + 3, -r + 3, r * 2 - 6, r * 2 - 6);
    x.fillStyle = up[0] >= 2 ? '#ff7a1a' : '#3a3f45'; x.beginPath(); x.arc(0, 0, r * 0.45, 0, TAU); x.fill();
    x.fillStyle = '#ddd'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + (t.spin || 0); x.beginPath(); x.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2); x.lineTo(Math.cos(a + 0.2) * r * 0.42, Math.sin(a + 0.2) * r * 0.42); x.lineTo(Math.cos(a - 0.2) * r * 0.42, Math.sin(a - 0.2) * r * 0.42); x.fill(); }
    x.fillStyle = '#ffcf3a'; x.fillRect(-r, -r, r * 2, 3); x.fillRect(-r, r - 3, r * 2, 3);
  };
  DRAW.village = (x, t, r, ang, up) => {
    x.fillStyle = '#a07a4a'; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
    const g = x.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r * 0.95);
    g.addColorStop(0, '#f2d27a'); g.addColorStop(1, '#b8862e');
    x.fillStyle = g; x.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, rr = i % 2 ? r * 0.8 : r * 0.95; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.fill();
    x.strokeStyle = 'rgba(90,60,20,0.6)'; x.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); x.stroke(); }
    x.strokeStyle = '#5a3a1a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -r * 1.1); x.stroke();
    x.fillStyle = up[2] >= 3 ? '#ffcf3a' : up[1] >= 3 ? '#2a5bd8' : '#e8402a'; x.beginPath(); x.moveTo(0, -r * 1.1); x.lineTo(r * 0.55, -r * 0.95); x.lineTo(0, -r * 0.8); x.fill();
  };
  DRAW.engineer = (x, t, r, ang, up) => {
    x.rotate(ang);
    x.fillStyle = '#4a4f57'; x.fillRect(r * 0.3, r * 0.3, r * 0.9, r * 0.3);
    x.fillStyle = '#ffcf3a'; x.fillRect(r * 0.3, r * 0.25, r * 0.3, r * 0.4);
    arm(x, r, 1, r * 0.6);
    monkey(x, r);
    hat(x, r * 0.92, '#ffcf3a', true);
    x.fillStyle = '#e0b020'; x.fillRect(-r * 0.6, -r * 0.06, r * 0.9, r * 0.12);
  };

  function drawHero(x, t, ang, now) {
    const r = t.r;
    x.rotate(ang);
    switch (t.k) {
      case 'quincy':
        x.strokeStyle = '#6a3a1a'; x.lineWidth = 2.5; x.beginPath(); x.arc(r * 0.7, 0, r * 0.75, -1.3, 1.3); x.stroke();
        x.strokeStyle = '#ddd'; x.lineWidth = 1; x.beginPath(); x.moveTo(r * 0.92, -r * 0.72); x.lineTo(r * 0.92, r * 0.72); x.stroke();
        monkey(x, r); x.fillStyle = '#3c7b2f'; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.66, Math.PI * 0.45, Math.PI * 1.55); x.fill();
        break;
      case 'gwendolin':
        x.fillStyle = '#ff7a1a'; x.beginPath(); x.arc(r * 1.1, r * 0.4, r * 0.28 + Math.sin(now / 80) * 2, 0, TAU); x.fill();
        arm(x, r, 1, r * 0.7);
        monkey(x, r); x.fillStyle = '#d6421e'; for (let i = 0; i < 7; i++) { const a = Math.PI * 0.55 + (i / 6) * Math.PI * 0.9; x.beginPath(); x.arc(-r * 0.1 + Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.26, 0, TAU); x.fill(); }
        break;
      case 'striker':
        x.fillStyle = '#4a5a3a'; x.fillRect(0, r * 0.15, r * 1.6, r * 0.4);
        monkey(x, r); x.fillStyle = '#2a3a2a'; x.beginPath(); x.ellipse(-r * 0.1, 0, r * 0.6, r * 0.66, 0, 0, TAU); x.fill();
        x.fillStyle = '#c8302a'; x.beginPath(); x.arc(-r * 0.1, r * 0.3, r * 0.12, 0, TAU); x.fill();
        break;
      case 'obyn':
        x.strokeStyle = '#6a4a2a'; x.lineWidth = r * 0.14; x.beginPath(); x.moveTo(r * 0.1, r * 0.55); x.lineTo(r * 1.3, r * 0.6); x.stroke();
        monkey(x, r, { fur: '#3a7ab0', face: '#bfe0f0' });
        x.fillStyle = '#2a8a3a'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(-r * 0.3, (i - 2.5) * r * 0.22, r * 0.22, r * 0.1, 0.5, 0, TAU); x.fill(); }
        break;
      case 'benjamin':
        x.fillStyle = '#222'; x.fillRect(r * 0.55, -r * 0.6, r * 0.7, r * 1.2); x.fillStyle = '#3aff6a'; x.fillRect(r * 0.6, -r * 0.5, r * 0.08, r * 1.0);
        monkey(x, r); x.fillStyle = '#2c2c3a'; x.beginPath(); x.arc(-r * 0.1, 0, r * 0.66, Math.PI * 0.45, Math.PI * 1.55); x.fill();
        break;
      case 'churchill':
        x.fillStyle = '#3a4a2a'; x.fillRect(-r, -r * 0.85, r * 2, r * 1.7);
        x.fillStyle = '#222'; x.fillRect(-r, -r * 0.95, r * 2, r * 0.25); x.fillRect(-r, r * 0.7, r * 2, r * 0.25);
        x.fillStyle = '#5a6a3a'; x.beginPath(); x.arc(0, 0, r * 0.6, 0, TAU); x.fill();
        x.fillStyle = '#2a3020'; x.fillRect(r * 0.3, -r * 0.13, r * 1.2, r * 0.26);
        x.save(); x.scale(0.55, 0.55); monkey(x, r); x.restore();
        break;
    }
    // level badge
    x.rotate(-ang);
    x.fillStyle = '#1a1a2a'; x.beginPath(); x.arc(r * 0.8, r * 0.8, 7, 0, TAU); x.fill();
    x.fillStyle = '#ffcf3a'; x.font = 'bold 9px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(t.hero ? t.hero.lvl : 1, r * 0.8, r * 0.82);
  }

  // air units drawn above everything
  R.drawAir = function (x, t, now) {
    const s = t.stats;
    if (s.mover === 'ace') {
      const p = t.ace, up = t.up;
      x.save(); x.translate(p.x, p.y); x.rotate(p.ang || 0);
      x.fillStyle = 'rgba(0,0,0,0.2)'; x.beginPath(); x.ellipse(8, 14, 22, 8, 0, 0, TAU); x.fill();
      const col = up[1] >= 3 ? '#4a5a3a' : up[2] >= 4 ? '#2a2d33' : up[0] >= 3 ? '#8a8f98' : '#d8302a';
      x.fillStyle = col;
      x.beginPath(); x.moveTo(24, 0); x.lineTo(-14, -5); x.lineTo(-18, 0); x.lineTo(-14, 5); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(6, 0); x.lineTo(-6, -24); x.lineTo(-12, -24); x.lineTo(-6, 0); x.lineTo(-12, 24); x.lineTo(-6, 24); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(-12, 0); x.lineTo(-20, -9); x.lineTo(-22, -9); x.lineTo(-18, 0); x.lineTo(-22, 9); x.lineTo(-20, 9); x.closePath(); x.fill();
      x.fillStyle = '#9ad8ff'; x.beginPath(); x.ellipse(8, 0, 6, 3, 0, 0, TAU); x.fill();
      x.restore();
    } else if (s.mover === 'heli') {
      const p = t.heli, up = t.up;
      x.save(); x.translate(p.x, p.y); x.rotate(p.ang || t.ang || 0);
      x.fillStyle = 'rgba(0,0,0,0.2)'; x.beginPath(); x.ellipse(10, 16, 20, 10, 0, 0, TAU); x.fill();
      const col = up[0] >= 4 ? '#3a4a2a' : up[1] >= 4 ? '#5a6a3a' : '#2a6ad8';
      x.fillStyle = col; x.fillRect(-26, -3, 18, 6);
      x.beginPath(); x.ellipse(0, 0, 15, 10, 0, 0, TAU); x.fill();
      x.fillStyle = '#9ad8ff'; x.beginPath(); x.ellipse(7, 0, 7, 7, 0, -1.3, 1.3); x.fill();
      x.strokeStyle = 'rgba(30,30,30,0.6)'; x.lineWidth = 3;
      const a = now / 30;
      for (let i = 0; i < 2; i++) { x.beginPath(); x.moveTo(Math.cos(a + i * Math.PI / 2) * 26, Math.sin(a + i * Math.PI / 2) * 26); x.lineTo(-Math.cos(a + i * Math.PI / 2) * 26, -Math.sin(a + i * Math.PI / 2) * 26); x.stroke(); }
      x.restore();
    }
  };

  // ---------------- PROJECTILES ----------------
  R.drawProj = function (x, p) {
    const a = p.a, sp = a.sprite || p.sprite || 'dart';
    if (p.k === 'shell' || p.k === 'lob') {
      const sc = 1 + (p.h || 0) / 60;
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(p.x, p.y, 4, 0, TAU); x.fill();
      x.fillStyle = p.k === 'lob' ? '#ff4a4a' : '#22252a'; x.beginPath(); x.arc(p.x, p.y - (p.h || 0), 5 * sc, 0, TAU); x.fill();
      return;
    }
    if (p.k === 'drop') {
      const f = p.age / p.life;
      if (sp === 'pineapple') {
        x.fillStyle = '#e8b02a'; x.beginPath(); x.ellipse(p.x, p.y, 6, 8, 0, 0, TAU); x.fill();
        x.fillStyle = '#3f9a2a'; x.beginPath(); x.moveTo(p.x, p.y - 7); x.lineTo(p.x - 4, p.y - 13); x.lineTo(p.x + 4, p.y - 13); x.fill();
        if (f > 0.6 && ((f * 20) | 0) % 2) { x.fillStyle = 'rgba(255,60,40,0.6)'; x.beginPath(); x.arc(p.x, p.y, 9, 0, TAU); x.fill(); }
      } else { x.fillStyle = '#22252a'; x.beginPath(); x.arc(p.x, p.y, sp === 'bomblet' ? 3.5 : 6, 0, TAU); x.fill(); }
      return;
    }
    const ang = Math.atan2(p.vy || 0, p.vx || 1);
    x.save(); x.translate(p.x, p.y);
    switch (sp) {
      case 'dart': case 'arrow': case 'nail': case 'thorn': case 'bolt':
        x.rotate(ang);
        x.fillStyle = sp === 'thorn' ? '#3f8a2a' : sp === 'nail' ? '#9aa3ad' : '#c8c8c8';
        x.fillRect(-7, -1.2, 12, 2.4);
        x.fillStyle = sp === 'bolt' ? '#6a4a2a' : '#e8402a';
        if (sp !== 'nail' && sp !== 'thorn') { x.beginPath(); x.moveTo(-8, 0); x.lineTo(-11, -3); x.lineTo(-5, 0); x.lineTo(-11, 3); x.fill(); }
        x.fillStyle = '#555'; x.beginPath(); x.moveTo(8, 0); x.lineTo(4, -2); x.lineTo(4, 2); x.fill();
        break;
      case 'bullet': x.rotate(ang); x.fillStyle = '#ffe17a'; x.fillRect(-4, -1, 8, 2); break;
      case 'spikeball': case 'jugg': case 'ujugg': {
        const r = sp === 'ujugg' ? 20 : sp === 'jugg' ? 14 : 9;
        x.rotate(p.rot);
        x.fillStyle = sp === 'ujugg' ? '#c8a02a' : '#555a60';
        for (let i = 0; i < 10; i++) { x.save(); x.rotate((i / 10) * TAU); x.beginPath(); x.moveTo(r * 0.6, -3); x.lineTo(r * 1.25, 0); x.lineTo(r * 0.6, 3); x.fill(); x.restore(); }
        x.fillStyle = sp === 'ujugg' ? '#ffd84a' : '#7a8088'; x.beginPath(); x.arc(0, 0, r * 0.8, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.arc(-r * 0.25, -r * 0.25, r * 0.3, 0, TAU); x.fill();
        break;
      }
      case 'rang': case 'hotrang': case 'glaive': case 'kylie':
        x.rotate(p.age * 18);
        x.fillStyle = sp === 'glaive' ? '#d8e0e8' : sp === 'hotrang' ? '#ff6a2a' : sp === 'kylie' ? '#c4914a' : '#f5c542';
        if (sp === 'glaive') { for (let i = 0; i < 3; i++) { x.rotate(TAU / 3); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(8, -6, 12, 0); x.quadraticCurveTo(6, 1, 0, 0); x.fill(); } }
        else { x.beginPath(); x.moveTo(-9, -6); x.quadraticCurveTo(6, 0, -9, 6); x.lineTo(-4, 0); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 1; x.stroke(); }
        break;
      case 'bomb': case 'bigbomb': case 'flashbomb': case 'iceball': case 'shell':
        x.fillStyle = sp === 'iceball' ? '#9ae4ff' : sp === 'flashbomb' ? '#f2f2f2' : '#22252a';
        x.beginPath(); x.arc(0, 0, sp === 'bigbomb' ? 9 : 6.5, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.4)'; x.beginPath(); x.arc(-2, -2, 2, 0, TAU); x.fill();
        if (sp === 'bomb' || sp === 'bigbomb') { x.fillStyle = '#ff9a1a'; x.beginPath(); x.arc(4, -5, 2, 0, TAU); x.fill(); }
        break;
      case 'missile': case 'bigmissile': {
        const s = sp === 'bigmissile' ? 1.7 : 1;
        x.rotate(p.ang != null && a.move === 'seek' ? p.ang : ang); x.scale(s, s);
        x.fillStyle = '#e8e8e8'; x.fillRect(-7, -2.5, 12, 5);
        x.fillStyle = '#d8302a'; x.beginPath(); x.moveTo(5, -2.5); x.lineTo(9, 0); x.lineTo(5, 2.5); x.fill();
        x.fillStyle = 'rgba(255,170,40,0.85)'; x.beginPath(); x.moveTo(-7, -2); x.lineTo(-13 - Math.random() * 4, 0); x.lineTo(-7, 2); x.fill();
        break;
      }
      case 'tack': case 'hottack': case 'shard': case 'frag': case 'icicle':
        x.rotate(ang);
        x.fillStyle = sp === 'hottack' ? '#ff5a1a' : sp === 'shard' || sp === 'icicle' ? '#bff1ff' : '#666';
        x.beginPath(); x.moveTo(sp === 'icicle' ? 12 : 6, 0); x.lineTo(-4, -2); x.lineTo(-4, 2); x.fill();
        break;
      case 'blade':
        x.rotate(p.age * 25); x.fillStyle = '#d8e0e8';
        x.beginPath(); for (let i = 0; i < 8; i++) { const aa = (i / 8) * TAU, rr = i % 2 ? 3 : 8; x.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } x.fill();
        break;
      case 'glue': x.fillStyle = a.fx && a.fx.glue && a.fx.glue.dot ? '#9ae43a' : '#eaf27a'; x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fill(); break;
      case 'grape': case 'hotgrape': x.fillStyle = sp === 'hotgrape' ? '#ff6a1a' : '#7a2ab8'; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill(); break;
      case 'magic': case 'spike':
        x.fillStyle = sp === 'spike' ? '#ff4aff' : '#c47aff';
        x.shadowColor = '#c47aff'; x.shadowBlur = 8;
        x.beginPath(); x.arc(0, 0, sp === 'spike' ? 7 : 5.5, 0, TAU); x.fill();
        x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 2.2, 0, TAU); x.fill();
        break;
      case 'fireball': case 'flame':
        x.fillStyle = 'rgba(255,120,20,0.85)'; x.beginPath(); x.arc(0, 0, sp === 'flame' ? 7 * (1 - p.age / (p.life || 1)) + 3 : 7, 0, TAU); x.fill();
        x.fillStyle = 'rgba(255,230,90,0.95)'; x.beginPath(); x.arc(0, 0, 3.5, 0, TAU); x.fill();
        break;
      case 'laser': x.rotate(ang); x.fillStyle = '#ff3a3a'; x.shadowColor = '#ff3a3a'; x.shadowBlur = 6; x.fillRect(-8, -1.5, 16, 3); break;
      case 'plasma': x.fillStyle = '#ff6aff'; x.shadowColor = '#ff6aff'; x.shadowBlur = 8; x.beginPath(); x.arc(0, 0, 4.5, 0, TAU); x.fill(); break;
      case 'sun': x.rotate(ang); x.fillStyle = '#fff3a0'; x.shadowColor = '#ffd84a'; x.shadowBlur = 10; x.fillRect(-12, -3, 24, 6); break;
      case 'darkblade': x.rotate(ang); x.fillStyle = '#3a1a4a'; x.beginPath(); x.moveTo(9, 0); x.lineTo(-6, -4); x.lineTo(-3, 0); x.lineTo(-6, 4); x.fill(); x.strokeStyle = '#b05aff'; x.lineWidth = 1; x.stroke(); break;
      case 'shuriken':
        x.rotate(p.age * 20); x.fillStyle = '#c8d0d8';
        x.beginPath(); for (let i = 0; i < 8; i++) { const aa = (i / 8) * TAU, rr = i % 2 ? 2 : 7; x.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } x.fill();
        break;
      case 'potion': x.rotate(p.age * 10); x.fillStyle = '#7aff4a'; x.beginPath(); x.arc(0, 2, 5, 0, TAU); x.fill(); x.fillStyle = '#ddd'; x.fillRect(-1.5, -6, 3, 5); break;
      case 'tornado':
        x.strokeStyle = 'rgba(230,240,255,0.8)'; x.lineWidth = 2;
        for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(0, -i * 4 + 6, 6 + i * 4, 3 + i, 0, 0, TAU); x.stroke(); }
        break;
      case 'wolf': x.rotate(ang); x.fillStyle = 'rgba(120,200,255,0.85)'; x.beginPath(); x.ellipse(0, 0, 10, 5, 0, 0, TAU); x.fill(); x.beginPath(); x.moveTo(8, -3); x.lineTo(13, -6); x.lineTo(11, 0); x.fill(); break;
      case 'zombie': case 'zmoab':
        if (sp === 'zmoab') { x.rotate((p.ang || 0) + Math.PI); x.fillStyle = 'rgba(90,140,90,0.85)'; x.beginPath(); x.ellipse(0, 0, 30, 18, 0, 0, TAU); x.fill(); }
        else { x.fillStyle = 'rgba(110,170,100,0.85)'; x.beginPath(); x.ellipse(0, 0, 9, 11, 0, 0, TAU); x.fill(); x.fillStyle = '#222'; x.fillRect(-4, -3, 2, 2); x.fillRect(2, -3, 2, 2); }
        break;
      default:
        x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill();
    }
    x.restore();
  };

  R.drawSpikes = function (x, s) {
    const f = s.fly;
    const px = s.sx + (s.x - s.sx) * f, py = s.sy + (s.y - s.sy) * f - Math.sin(f * Math.PI) * 30;
    const sp = s.sprite;
    x.save(); x.translate(px, py);
    if (sp === 'trap') {
      x.fillStyle = '#5a5f68'; x.fillRect(-11, -9, 22, 18); x.fillStyle = '#ffcf3a'; x.fillRect(-11, -9, 22, 4);
      x.fillStyle = '#222'; x.fillRect(-7, -3, 14, 8);
      const fill = Math.min(1, (s.trapped || 0) / 500);
      x.fillStyle = '#ff4a4a'; x.fillRect(-7, 5 - 8 * fill, 14, 8 * fill);
    } else if (sp === 'brambles') {
      x.strokeStyle = '#3a6a2a'; x.lineWidth = 2;
      for (let i = 0; i < 5; i++) { x.beginPath(); x.arc((i - 2) * 4, 0, 6, i, i + 3); x.stroke(); }
    } else if (sp === 'mines') {
      x.fillStyle = '#3a3f45'; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.fill(); x.fillStyle = '#ff3a3a'; x.beginPath(); x.arc(0, 0, 2.5, 0, TAU); x.fill();
    } else if (sp === 'caltrops') {
      x.fillStyle = '#444';
      for (let i = 0; i < 3; i++) { x.beginPath(); x.arc((i - 1) * 5, (i % 2) * 3, 2.2, 0, TAU); x.fill(); }
    } else {
      const col = sp === 'hotspikes' ? '#ff7a2a' : sp === 'permaspike' ? '#ffcf3a' : sp === 'spikeballs' ? '#5a5f68' : '#8a8f98';
      const n = Math.max(2, Math.min(6, Math.ceil((s.pierce / (s.a.pierce || 5)) * 6)));
      x.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU, ox = Math.cos(a) * 4, oy = Math.sin(a) * 4;
        if (sp === 'spikeballs') { x.beginPath(); x.arc(ox, oy, 3.5, 0, TAU); x.fill(); continue; }
        x.beginPath(); x.moveTo(ox, oy - 5); x.lineTo(ox - 3, oy + 2); x.lineTo(ox + 3, oy + 2); x.closePath(); x.fill();
      }
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 0.8; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.stroke();
    }
    x.restore();
  };
  R.drawPatch = function (x, p, now) {
    const f = 1 - p.age / p.life;
    x.globalAlpha = Math.min(1, f * 2) * 0.7;
    x.fillStyle = p.color;
    x.beginPath(); x.arc(p.x, p.y, p.r, 0, TAU); x.fill();
    x.globalAlpha = Math.min(1, f * 2);
    x.fillStyle = shade(p.color.startsWith('#') ? p.color : '#ff7a1a', 0.4);
    for (let i = 0; i < 6; i++) { const a = now / 300 + i; x.beginPath(); x.arc(p.x + Math.cos(a * 1.3) * p.r * 0.6, p.y + Math.sin(a) * p.r * 0.6, 3 + (i % 3), 0, TAU); x.fill(); }
    x.globalAlpha = 1;
  };
  R.drawBanana = function (x, b) {
    const f = b.fly;
    const px = b.sx + (b.x - b.sx) * f, py = b.sy + (b.y - b.sy) * f - Math.sin(f * Math.PI) * 40;
    x.save(); x.translate(px, py);
    const fade = b.life - b.age < 3 ? (((b.age * 6) | 0) % 2 ? 0.4 : 1) : 1;
    x.globalAlpha = fade;
    if (b.crate) {
      x.fillStyle = '#b8862e'; x.fillRect(-10, -9, 20, 18); x.strokeStyle = '#6a4a1a'; x.lineWidth = 2; x.strokeRect(-10, -9, 20, 18);
      x.beginPath(); x.moveTo(-10, -9); x.lineTo(10, 9); x.stroke();
      x.fillStyle = '#ffe14a'; x.beginPath(); x.arc(0, 0, 4, 0, TAU); x.fill();
    } else {
      x.rotate(-0.5);
      x.fillStyle = '#ffe14a'; x.strokeStyle = '#a07a10'; x.lineWidth = 1.2;
      x.beginPath(); x.arc(0, -6, 10, 0.5, Math.PI - 0.5); x.arc(0, -10, 10, Math.PI - 0.6, 0.6, true); x.closePath(); x.fill(); x.stroke();
    }
    x.restore();
  };

  // ---------------- EFFECTS ----------------
  R.drawFx = function (x, f, W, H) {
    const p = f.t / f.life;
    switch (f.k) {
      case 'pop': {
        x.save(); x.translate(f.x, f.y); x.rotate(f.rot);
        x.globalAlpha = 1 - p;
        x.fillStyle = '#fff'; x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1;
        const r = f.r * (1.1 + p * 0.5);
        x.beginPath();
        for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, rr = i % 2 ? r * 0.55 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        x.closePath(); x.fill(); x.stroke();
        x.restore(); x.globalAlpha = 1;
        break;
      }
      case 'moabpop': {
        x.globalAlpha = 1 - p;
        x.fillStyle = '#fff';
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + f.rot; const d = p * 70; x.beginPath(); x.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 8 * (1 - p) + 2, 0, TAU); x.fill(); }
        x.fillStyle = 'rgba(255,255,255,0.6)'; x.beginPath(); x.arc(f.x, f.y, 40 * (0.5 + p), 0, TAU); x.fill();
        x.globalAlpha = 1;
        break;
      }
      case 'boom': {
        x.globalAlpha = (1 - p) * 0.85;
        const g = x.createRadialGradient(f.x, f.y, 2, f.x, f.y, f.r);
        g.addColorStop(0, '#fff7c0'); g.addColorStop(0.4, f.color || '#ffb03a'); g.addColorStop(1, 'rgba(255,80,20,0)');
        x.fillStyle = g; x.beginPath(); x.arc(f.x, f.y, f.r * (0.6 + p * 0.5), 0, TAU); x.fill();
        x.globalAlpha = 1;
        break;
      }
      case 'aura': case 'ring':
        x.globalAlpha = (1 - p) * 0.8;
        x.strokeStyle = f.color; x.lineWidth = f.k === 'ring' ? 4 : 3;
        x.beginPath(); x.arc(f.x, f.y, f.r * (f.k === 'ring' ? 0.5 + p : 0.3 + p * 0.7), 0, TAU); x.stroke();
        if (f.k === 'aura') { x.fillStyle = f.color; x.globalAlpha = (1 - p) * 0.2; x.fill(); }
        x.globalAlpha = 1;
        break;
      case 'shot':
        x.globalAlpha = 1 - p;
        x.strokeStyle = f.color; x.lineWidth = f.w || 2;
        x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x2, f.y2); x.stroke();
        x.globalAlpha = 1;
        break;
      case 'beam':
        x.globalAlpha = 1 - p * 0.6;
        x.strokeStyle = f.color; x.lineWidth = f.w * 1.8; x.lineCap = 'round';
        x.shadowColor = f.color; x.shadowBlur = 12;
        x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x2, f.y2); x.stroke();
        x.strokeStyle = '#fff'; x.lineWidth = f.w * 0.5; x.stroke();
        x.shadowBlur = 0; x.globalAlpha = 1;
        break;
      case 'bolt': case 'chainshot':
        x.globalAlpha = 1 - p;
        x.strokeStyle = f.color; x.lineWidth = 2.5; x.shadowColor = f.color; x.shadowBlur = 8;
        x.beginPath();
        for (let i = 0; i < f.pts.length; i++) {
          const [px, py] = f.pts[i];
          if (!i) { x.moveTo(px, py); continue; }
          const [qx, qy] = f.pts[i - 1];
          for (let k = 1; k <= 3; k++) x.lineTo(qx + (px - qx) * (k / 3) + (k < 3 ? (Math.random() - 0.5) * 12 : 0), qy + (py - qy) * (k / 3) + (k < 3 ? (Math.random() - 0.5) * 12 : 0));
        }
        x.stroke(); x.shadowBlur = 0; x.globalAlpha = 1;
        break;
      case 'flash':
        x.globalAlpha = (1 - p) * 0.55; x.fillStyle = f.color; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
        break;
      case 'cash':
        x.globalAlpha = 1 - p * p;
        x.font = 'bold 16px "Luckiest Guy", "Lilita One", sans-serif'; x.textAlign = 'center';
        x.lineWidth = 3; x.strokeStyle = '#1a3a0a'; x.strokeText('+$' + f.n, f.x, f.y - p * 30);
        x.fillStyle = '#7dff3a'; x.fillText('+$' + f.n, f.x, f.y - p * 30);
        x.globalAlpha = 1;
        break;
      case 'block':
        x.globalAlpha = 1 - p; x.strokeStyle = '#ccc'; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(f.x - 4, f.y - 4); x.lineTo(f.x + 4, f.y + 4); x.moveTo(f.x + 4, f.y - 4); x.lineTo(f.x - 4, f.y + 4); x.stroke();
        x.globalAlpha = 1;
        break;
    }
  };

  // ---------------- FRAME ----------------
  R.frame = function (G, ctx, view, ui) {
    const now = performance.now();
    const { dpr, scale, ox, oy } = view;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d2a12'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox * dpr, oy * dpr);
    if (!G.mapCanvas || G.mapScale !== scale * dpr) { G.mapCanvas = R.renderMap(G, Math.min(3, scale * dpr)); G.mapScale = scale * dpr; }
    ctx.drawImage(G.mapCanvas, 0, 0, BTD.W, BTD.H);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, BTD.W, BTD.H); ctx.clip();
    for (const p of G.patches) R.drawPatch(ctx, p, now);
    for (const s of G.spikes) R.drawSpikes(ctx, s);
    // selected range below everything else
    if (ui.selected && G.towers.includes(ui.selected)) {
      const t = ui.selected;
      const rr = Math.min(G.range(t), 1400);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(t.x, t.y, rr, 0, TAU); ctx.fill(); ctx.stroke();
      if (t.aim && (t.k === 'mortar' || t.k === 'dartling')) {
        ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(t.aim.x, t.aim.y, 12, 0, TAU); ctx.moveTo(t.aim.x - 18, t.aim.y); ctx.lineTo(t.aim.x + 18, t.aim.y); ctx.moveTo(t.aim.x, t.aim.y - 18); ctx.lineTo(t.aim.x, t.aim.y + 18); ctx.stroke();
      }
    }
    for (const t of G.towers) if (!t.stats.mover || t.stats.mover) R.drawTower(ctx, t, now);
    const blimps = [];
    for (const b of G.bloons) { if (b.def.moab) { blimps.push(b); continue; } R.drawBloon(ctx, b); }
    for (const b of blimps) R.drawBloon(ctx, b);
    for (const b of blimps) R.drawHealthBar(ctx, b);
    for (const p of G.projs) R.drawProj(ctx, p);
    for (const t of G.towers) if (t.stats.mover) R.drawAir(ctx, t, now);
    for (const b of G.bananas) R.drawBanana(ctx, b);
    for (const f of G.fx) R.drawFx(ctx, f, BTD.W, BTD.H);
    // placement ghost
    if (ui.placing && ui.ghost) {
      const k = ui.placing;
      const def = k.startsWith('hero:') ? BTD.HEROES[k.slice(5)] : BTD.TOWERS[k];
      const ok = G.canPlace(k, ui.ghost.x, ui.ghost.y) && G.cash >= G.towerCost(k, ui.ghost.x, ui.ghost.y);
      const rr = Math.min(def.base.range || 120, 1400);
      ctx.fillStyle = ok ? 'rgba(255,255,255,0.2)' : 'rgba(255,40,40,0.25)';
      ctx.strokeStyle = ok ? 'rgba(255,255,255,0.6)' : 'rgba(255,60,60,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ui.ghost.x, ui.ghost.y, rr, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.85;
      const fake = { k: def.hero ? def.k : k, x: ui.ghost.x, y: ui.ghost.y, r: def.r || 16, up: [0, 0, 0], ang: -Math.PI / 2, hero: def.hero ? { lvl: 1 } : null };
      R.drawTower(ctx, fake, now);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // shop icons
  R.icon = function (k, size) {
    const c = mk(size * 2, size * 2);
    const x = c.getContext('2d');
    x.scale(2, 2);
    const isHero = !!BTD.HEROES[k] && !BTD.TOWERS[k];
    const def = isHero ? BTD.HEROES[k] : BTD.TOWERS[k];
    const r = def.r || 16;
    const s = (size * 0.36) / r;
    x.translate(size / 2, size / 2); x.scale(s, s);
    const fake = { k, x: 0, y: 0, r, up: [0, 0, 0], ang: -Math.PI / 2, hero: isHero ? { lvl: 1 } : null, stats: { mover: null } };
    R.drawTower(x, fake, 0);
    if (k === 'ace') R.drawAir(x, Object.assign(fake, { stats: { mover: 'ace' }, ace: { x: 0, y: 0, ang: -Math.PI / 2 } }), 0);
    if (k === 'heli') R.drawAir(x, Object.assign(fake, { stats: { mover: 'heli' }, heli: { x: 0, y: 0, ang: -Math.PI / 2 } }), 0);
    return c;
  };
  R.upgradeIcon = function (k, path, tier, size) {
    const c = mk(size * 2, size * 2);
    const x = c.getContext('2d');
    x.scale(2, 2);
    const def = BTD.TOWERS[k];
    const r = def.r || 16;
    const s = (size * 0.34) / r;
    x.translate(size / 2, size / 2); x.scale(s, s);
    const up = [0, 0, 0]; up[path] = tier;
    const fake = { k, x: 0, y: 0, r, up, ang: -Math.PI / 2, stats: { mover: null } };
    R.drawTower(x, fake, 0);
    if (k === 'ace') R.drawAir(x, Object.assign(fake, { stats: { mover: 'ace' }, ace: { x: 0, y: 0, ang: -Math.PI / 2 } }), 0);
    if (k === 'heli') R.drawAir(x, Object.assign(fake, { stats: { mover: 'heli' }, heli: { x: 0, y: 0, ang: -Math.PI / 2 } }), 0);
    return c;
  };
  R.bloonIcon = function (type, size) {
    const s = R.bloonSprite(type, '', 0);
    const c = mk(size * 2, size * 2);
    const x = c.getContext('2d');
    const k = Math.min((size * 2) / s.width, (size * 2) / s.height);
    x.drawImage(s, (size * 2 - s.width * k) / 2, (size * 2 - s.height * k) / 2, s.width * k, s.height * k);
    return c;
  };
})();
