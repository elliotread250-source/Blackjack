/* Difficulty faces, drawn with canvas so they stay crisp at any size.
 *
 *   GDFaces.draw(ctx, cx, cy, r, difficulty, { aura })
 *
 * difficulty is one of FACES' keys (GD's scale, Easy ... Extreme Demon).
 * aura: 'featured' draws GD's yellow glow behind the face, 'epic' a fire
 * ring. Extreme Demon always burns.
 */
(function (root) {
  'use strict';

  const FACES = {
    'Easy':          { col: '#3bc8ff', kind: 'easy' },
    'Normal':        { col: '#3bea5a', kind: 'normal' },
    'Hard':          { col: '#ffb21f', kind: 'hard' },
    'Harder':        { col: '#ff5a2b', kind: 'harder' },
    'Insane':        { col: '#ff3bd0', kind: 'insane' },
    'Easy Demon':    { col: '#b46bff', kind: 'demon', rank: 0 },
    'Medium Demon':  { col: '#ff8a1f', kind: 'demon', rank: 1 },
    'Hard Demon':    { col: '#ec2424', kind: 'demon', rank: 2 },
    'Insane Demon':  { col: '#ff1f6b', kind: 'demon', rank: 3 },
    'Extreme Demon': { col: '#9a0012', kind: 'demon', rank: 4 },
    // Practice-only steps between GD's ten
    'Casual':        { col: '#3be8c8', kind: 'easy' },
    'Tricky':        { col: '#ffd21f', kind: 'hard' },
    'Brutal':        { col: '#c43bff', kind: 'insane' },
    'Nightmare':     { col: '#3b4bff', kind: 'demon', rank: 1 },
    'Mythic':        { col: '#00e0a0', kind: 'demon', rank: 3 },
  };
  const ORDER = Object.keys(FACES);

  function lighten(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v + (255 - v) * k);
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function darken(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v * (1 - k));
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  function aura(c, cx, cy, r, type, t) {
    if (type === 'featured') {
      const g = c.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6);
      g.addColorStop(0, 'rgba(255,220,60,0.9)');
      g.addColorStop(1, 'rgba(255,220,60,0)');
      c.fillStyle = g;
      c.beginPath(); c.arc(cx, cy, r * 1.6, 0, Math.PI * 2); c.fill();
      return;
    }
    // Fire: flickering tongues around the rim.
    const n = 14;
    for (let layer = 0; layer < 3; layer++) {
      c.fillStyle = ['#ff3b14', '#ff8a1f', '#ffe066'][layer];
      const reach = r * (1.55 - layer * 0.17);
      c.beginPath();
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const wob = 0.85 + 0.15 * Math.sin(t * 9 + i * 2.3 + layer);
        const tip = i % 2 === 0 ? reach * wob : r * 0.95;
        const x = cx + Math.cos(a - Math.PI / 2) * tip, y = cy + Math.sin(a - Math.PI / 2) * tip * (a > Math.PI * 0.5 && a < Math.PI * 1.5 ? 0.9 : 1.08);
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath(); c.fill();
    }
  }

  function eye(c, x, y, rx, ry, slant) {
    c.save();
    c.translate(x, y); c.rotate(slant);
    c.fillStyle = '#000';
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.ellipse(-rx * 0.3, -ry * 0.35, rx * 0.35, ry * 0.3, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function brow(c, x0, y0, x1, y1, w) {
    c.strokeStyle = '#000'; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }

  function draw(c, cx, cy, r, difficulty, opts = {}) {
    const f = FACES[difficulty] || FACES.Normal;
    const t = (opts.time != null ? opts.time : performance.now() / 1000);
    c.save();
    if (f.kind === 'demon' && f.rank === 4) aura(c, cx, cy, r, 'epic', t);
    else if (opts.aura) aura(c, cx, cy, r, opts.aura, t);

    const lw = Math.max(1.5, r * 0.11);
    // Demon horns go behind the head.
    if (f.kind === 'demon') {
      const big = 1 + f.rank * 0.08;
      for (const s of [-1, 1]) {
        // Thick curved horns, shaded from base to tip.
        const hg = c.createLinearGradient(cx, cy - r * 0.5, cx + s * r, cy - r * 1.5 * big);
        hg.addColorStop(0, f.rank >= 3 ? '#3a0008' : darken(f.col, 0.45));
        hg.addColorStop(1, f.rank >= 3 ? '#ff5a3b' : lighten(f.col, 0.55));
        c.fillStyle = hg; c.strokeStyle = '#000'; c.lineWidth = lw * 0.8;
        c.beginPath();
        c.moveTo(cx + s * r * 0.2, cy - r * 0.78);
        c.quadraticCurveTo(cx + s * r * 0.75, cy - r * 1.05 * big, cx + s * r * 0.98 * big, cy - r * 1.55 * big);
        c.quadraticCurveTo(cx + s * r * 1.15, cy - r * 0.95, cx + s * r * 0.88, cy - r * 0.38);
        c.closePath(); c.fill(); c.stroke();
        if (f.rank === 4) { // extra pair of small horns
          c.fillStyle = '#1a0004';
          c.beginPath();
          c.moveTo(cx + s * r * 0.1, cy - r * 0.92);
          c.lineTo(cx + s * r * 0.28, cy - r * 1.35);
          c.lineTo(cx + s * r * 0.36, cy - r * 0.85);
          c.closePath(); c.fill(); c.stroke();
        }
      }
    }

    // Head with a soft top-left light.
    const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.1, cx, cy, r);
    g.addColorStop(0, lighten(f.col, 0.45));
    g.addColorStop(0.55, f.col);
    g.addColorStop(1, darken(f.col, 0.35));
    c.fillStyle = g; c.strokeStyle = '#000'; c.lineWidth = lw;
    c.beginPath();
    if (f.kind === 'demon') {
      // Slightly pointed chin.
      c.moveTo(cx - r, cy - r * 0.1);
      c.quadraticCurveTo(cx - r, cy - r, cx, cy - r);
      c.quadraticCurveTo(cx + r, cy - r, cx + r, cy - r * 0.1);
      c.quadraticCurveTo(cx + r * 0.95, cy + r * 0.7, cx, cy + r * 1.05);
      c.quadraticCurveTo(cx - r * 0.95, cy + r * 0.7, cx - r, cy - r * 0.1);
    } else {
      c.arc(cx, cy, r, 0, Math.PI * 2);
    }
    c.fill(); c.stroke();
    // Rim shine
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = lw * 0.6;
    c.beginPath(); c.arc(cx, cy, r * 0.8, Math.PI * 1.1, Math.PI * 1.45); c.stroke();

    const ex = r * 0.38, ey = -r * 0.18;
    switch (f.kind) {
      case 'easy':
        eye(c, cx - ex, cy + ey, r * 0.13, r * 0.2, 0);
        eye(c, cx + ex, cy + ey, r * 0.13, r * 0.2, 0);
        c.fillStyle = '#000';
        c.beginPath(); c.arc(cx, cy + r * 0.2, r * 0.42, 0.1 * Math.PI, 0.9 * Math.PI); c.closePath(); c.fill();
        c.fillStyle = '#ff7aa8';
        c.beginPath(); c.ellipse(cx, cy + r * 0.5, r * 0.18, r * 0.09, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(255,120,160,0.45)';
        c.beginPath(); c.ellipse(cx - r * 0.62, cy + r * 0.2, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(cx + r * 0.62, cy + r * 0.2, r * 0.14, r * 0.08, 0, 0, Math.PI * 2); c.fill();
        break;
      case 'normal':
        eye(c, cx - ex, cy + ey, r * 0.13, r * 0.2, 0);
        eye(c, cx + ex, cy + ey, r * 0.13, r * 0.2, 0);
        c.strokeStyle = '#000'; c.lineWidth = lw; c.lineCap = 'round';
        c.beginPath(); c.arc(cx, cy + r * 0.12, r * 0.38, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
        break;
      case 'hard':
        eye(c, cx - ex, cy + ey + r * 0.05, r * 0.13, r * 0.17, 0);
        eye(c, cx + ex, cy + ey + r * 0.05, r * 0.13, r * 0.17, 0);
        brow(c, cx - r * 0.6, cy - r * 0.48, cx - r * 0.2, cy - r * 0.35, lw);
        brow(c, cx + r * 0.6, cy - r * 0.48, cx + r * 0.2, cy - r * 0.35, lw);
        c.strokeStyle = '#000'; c.lineWidth = lw;
        c.beginPath(); c.moveTo(cx - r * 0.32, cy + r * 0.45); c.lineTo(cx + r * 0.32, cy + r * 0.4); c.stroke();
        break;
      case 'harder':
        eye(c, cx - ex, cy + ey + r * 0.08, r * 0.15, r * 0.13, 0.35);
        eye(c, cx + ex, cy + ey + r * 0.08, r * 0.15, r * 0.13, -0.35);
        brow(c, cx - r * 0.65, cy - r * 0.55, cx - r * 0.15, cy - r * 0.25, lw * 1.3);
        brow(c, cx + r * 0.65, cy - r * 0.55, cx + r * 0.15, cy - r * 0.25, lw * 1.3);
        c.fillStyle = '#000';
        c.beginPath(); c.arc(cx, cy + r * 0.72, r * 0.36, 1.15 * Math.PI, 1.85 * Math.PI); c.closePath(); c.fill();
        c.fillStyle = '#fff';
        c.fillRect(cx - r * 0.2, cy + r * 0.42, r * 0.4, r * 0.08);
        break;
      case 'insane': {
        for (const s of [-1, 1]) {
          c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = lw * 0.8;
          c.beginPath(); c.arc(cx + s * ex, cy + ey, r * 0.22, 0, Math.PI * 2); c.fill(); c.stroke();
          c.fillStyle = '#000';
          c.beginPath(); c.arc(cx + s * ex + s * r * 0.04, cy + ey + r * 0.03, r * 0.07, 0, Math.PI * 2); c.fill();
          brow(c, cx + s * r * 0.7, cy - r * 0.62, cx + s * r * 0.15, cy - r * 0.4, lw * 1.2);
        }
        // Wide jagged grin
        c.fillStyle = '#000';
        c.beginPath();
        c.moveTo(cx - r * 0.55, cy + r * 0.22);
        c.quadraticCurveTo(cx, cy + r * 0.95, cx + r * 0.55, cy + r * 0.22);
        c.closePath(); c.fill();
        c.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
          const x = cx - r * 0.4 + i * r * 0.2;
          c.beginPath(); c.moveTo(x - r * 0.07, cy + r * 0.27); c.lineTo(x + r * 0.07, cy + r * 0.27); c.lineTo(x, cy + r * 0.42); c.closePath(); c.fill();
        }
        break;
      }
      default: { // demons
        const glow = f.rank >= 3 ? '#ffef5a' : f.rank === 2 ? '#ffd23b' : '#fff';
        for (const s of [-1, 1]) {
          c.fillStyle = '#000';
          c.beginPath();
          c.moveTo(cx + s * r * 0.12, cy - r * 0.08);
          c.lineTo(cx + s * r * 0.7, cy - r * 0.38);
          c.lineTo(cx + s * r * 0.55, cy + r * 0.02);
          c.closePath(); c.fill();
          c.fillStyle = glow;
          c.beginPath();
          c.moveTo(cx + s * r * 0.24, cy - r * 0.1);
          c.lineTo(cx + s * r * 0.58, cy - r * 0.28);
          c.lineTo(cx + s * r * 0.5, cy - r * 0.05);
          c.closePath(); c.fill();
          if (f.rank >= 3) {
            c.fillStyle = '#d00010';
            c.beginPath(); c.arc(cx + s * r * 0.42, cy - r * 0.13, r * 0.05, 0, Math.PI * 2); c.fill();
          }
        }
        // Mouth with fangs
        c.fillStyle = '#000';
        c.beginPath();
        c.moveTo(cx - r * 0.55, cy + r * 0.25);
        c.quadraticCurveTo(cx, cy + r * 0.45, cx + r * 0.55, cy + r * 0.25);
        c.quadraticCurveTo(cx, cy + r * 0.95, cx - r * 0.55, cy + r * 0.25);
        c.fill();
        c.fillStyle = '#fff';
        const fangs = 2 + f.rank;
        for (let i = 0; i < fangs; i++) {
          const x = cx - r * 0.38 + (i / Math.max(1, fangs - 1)) * r * 0.76;
          c.beginPath(); c.moveTo(x - r * 0.06, cy + r * 0.33); c.lineTo(x + r * 0.06, cy + r * 0.33); c.lineTo(x, cy + r * 0.5); c.closePath(); c.fill();
        }
        if (f.rank >= 2) { // scar
          c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = lw * 0.6;
          c.beginPath(); c.moveTo(cx + r * 0.55, cy - r * 0.75); c.lineTo(cx + r * 0.75, cy - r * 0.5); c.stroke();
        }
      }
    }
    c.restore();
  }

  root.GDFaces = { draw, FACES, ORDER, color: (d) => (FACES[d] || FACES.Normal).col };
})(typeof self !== 'undefined' ? self : this);
