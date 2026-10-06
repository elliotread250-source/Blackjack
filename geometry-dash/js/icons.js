/* Player icons: 24 designs for each of the eight modes.
 *
 *   GDIcons.draw(ctx, mode, size, o)
 *
 * o: { c1, c2, v (variant 0..23), cube (cube variant for the rider in the
 *      ship and UFO), t (seconds, for animation), grounded, boost }
 *
 * Variant v picks a body shape and a decal (stripes, dots, two-tone) that is
 * clipped to the body. Cube: 8 faces x 3 decals. Others: 6 bodies x 4 decals.
 * The caller sets lineWidth, strokeStyle and lineJoin before calling.
 */
(function (root) {
  'use strict';

  const COUNT = 24;
  const SHAPES = { cube: 8, ship: 6, ball: 6, ufo: 6, wave: 6, robot: 6, spider: 6, swing: 6 };
  const NAMES = {
    cube: ['Classic', 'Visor', 'Cross', 'Diamond', 'Split', 'Target', 'Smile', 'Stripes'],
    ship: ['Classic', 'Jet', 'Rocket', 'Manta', 'Tank', 'Twin'],
    ball: ['Classic', 'Gear', 'Eye', 'Swirl', 'Spiky', 'Bubble'],
    ufo: ['Classic', 'Ringed', 'Lander', 'Jelly', 'Diamond', 'Twin'],
    wave: ['Classic', 'Dart', 'Double', 'Crescent', 'Diamond', 'Chevron'],
    robot: ['Classic', 'Round', 'Cyclops', 'Mech', 'Crab', 'TV'],
    spider: ['Classic', 'Crab', 'Ant', 'Skull', 'Mech', 'Eyeball'],
    swing: ['Classic', 'Bat', 'Fish', 'Star', 'Heli', 'Bee'],
  };
  const DECALS = ['', 'Striped', 'Dotted', 'Two-tone'];

  // Special sets (variants COUNT and up): one design per mode for each set,
  // earned from the shop, vault codes, secret coins and easter eggs. Each
  // set forces its own colours (null keeps the player's), a special decal
  // and sometimes something on top (horns, crown, halo).
  const SPECIAL = [
    { key: 'demon', name: 'Demon', c1: '#2a0505', c2: '#ff2a1a', decal: 10, glow: '#ff2a1a', over: 'horns' },
    { key: 'gold', name: 'Golden', c1: '#ffd21f', c2: '#ff9a00', decal: 11, glow: '#ffcf33' },
    { key: 'checker', name: 'Checker', c1: null, c2: null, decal: 7 },
    { key: 'neon', name: 'Neon', c1: '#07070f', c2: null, decal: 0, neon: true },
    { key: 'ice', name: 'Frost', c1: '#8fe3ff', c2: '#ffffff', decal: 6, glow: '#bff3ff' },
    { key: 'flame', name: 'Inferno', c1: '#ff5a1a', c2: '#ffe23b', decal: 5 },
    { key: 'galaxy', name: 'Galaxy', c1: '#24105e', c2: '#d6a8ff', decal: 4 },
    { key: 'prism', name: 'Prism', c1: '#ffffff', c2: '#ffffff', decal: 8 },
    { key: 'ghost', name: 'Ghost', c1: '#e8eeff', c2: '#a9b8ff', decal: 0, alpha: 0.62 },
    { key: 'glitch', name: 'Glitch', c1: null, c2: null, decal: 9, jitter: true },
    { key: 'royal', name: 'Royal', c1: '#7b2bff', c2: '#ffd21f', decal: 0, over: 'crown' },
    { key: 'angel', name: 'Angel', c1: '#ffffff', c2: '#ffe28a', decal: 0, over: 'halo', glow: '#fff3b0' },
    // Shop expansion
    { key: 'ocean', name: 'Ocean', c1: '#1e6cff', c2: '#7ef0ff', decal: 6, glow: '#3ac8ff' },
    { key: 'sunset', name: 'Sunset', c1: '#ff5a8a', c2: '#ffb03b', decal: 1 },
    { key: 'shadow', name: 'Shadow', c1: '#121218', c2: '#6a5aff', decal: 3, glow: '#6a5aff' },
    { key: 'candy', name: 'Candy', c1: '#ff8ad8', c2: '#ffffff', decal: 1 },
    { key: 'zebra', name: 'Zebra', c1: '#ffffff', c2: '#000000', decal: 1 },
    { key: 'toxic', name: 'Toxic', c1: '#7dff3a', c2: '#1a4000', decal: 10, glow: '#7dff3a' },
    { key: 'magma', name: 'Magma', c1: '#3a0a00', c2: '#ff8a1e', decal: 10, glow: '#ff6a1e' },
    { key: 'cyber', name: 'Cyber', c1: '#05050f', c2: '#00ffd0', decal: 0, neon: true },
    { key: 'cosmic', name: 'Cosmic', c1: '#0a0a30', c2: '#ffe0ff', decal: 4, glow: '#c08aff' },
    { key: 'retro', name: 'Retro', c1: null, c2: null, decal: 7, jitter: true },
    { key: 'party', name: 'Party', c1: null, c2: null, decal: 2, over: 'party' },
    { key: 'emerald', name: 'Emerald', c1: '#00c878', c2: '#bfffe0', decal: 11, glow: '#00ff9a' },
    { key: 'ruby', name: 'Ruby', c1: '#e0103c', c2: '#ffb0c0', decal: 11, glow: '#ff2a5a' },
    { key: 'sapphire', name: 'Sapphire', c1: '#1040e0', c2: '#a0c0ff', decal: 11, glow: '#3a7aff' },
    { key: 'emperor', name: 'Emperor', c1: '#ffd21f', c2: '#e00030', decal: 11, over: 'crown', glow: '#ffd21f' },
  ];
  // Body shape each set uses, per mode (index into that mode's shapes).
  const SP_SHAPE = {
    demon: { cube: 0, ship: 2, ball: 4, ufo: 4, wave: 5, robot: 3, spider: 3, swing: 1 },
    gold: { cube: 5, ship: 0, ball: 1, ufo: 1, wave: 4, robot: 0, spider: 4, swing: 3 },
    checker: { cube: 1, ship: 4, ball: 0, ufo: 0, wave: 0, robot: 2, spider: 0, swing: 0 },
    neon: { cube: 3, ship: 1, ball: 3, ufo: 2, wave: 1, robot: 4, spider: 5, swing: 4 },
    ice: { cube: 2, ship: 3, ball: 5, ufo: 5, wave: 4, robot: 1, spider: 1, swing: 2 },
    flame: { cube: 7, ship: 2, ball: 4, ufo: 3, wave: 2, robot: 3, spider: 2, swing: 1 },
    galaxy: { cube: 6, ship: 3, ball: 2, ufo: 1, wave: 3, robot: 5, spider: 5, swing: 3 },
    prism: { cube: 4, ship: 5, ball: 1, ufo: 4, wave: 5, robot: 0, spider: 4, swing: 5 },
    ghost: { cube: 6, ship: 3, ball: 2, ufo: 3, wave: 3, robot: 2, spider: 3, swing: 2 },
    glitch: { cube: 1, ship: 1, ball: 1, ufo: 5, wave: 1, robot: 5, spider: 4, swing: 4 },
    royal: { cube: 5, ship: 0, ball: 3, ufo: 0, wave: 4, robot: 0, spider: 0, swing: 3 },
    angel: { cube: 6, ship: 3, ball: 5, ufo: 0, wave: 3, robot: 1, spider: 5, swing: 0 },
  };

  function split(mode, v) {
    if (v >= COUNT) {
      const k = v - COUNT, sp = SPECIAL[k];
      // Sets without a hand-picked shape table rotate through the shapes.
      const shape = SP_SHAPE[sp.key] ? SP_SHAPE[sp.key][mode] : (k * 3 + MODES.indexOf(mode) * 5) % SHAPES[mode];
      return { shape, decal: sp.decal };
    }
    const n = SHAPES[mode];
    return { shape: v % n, decal: Math.floor(v / n) % (mode === 'cube' ? 3 : 4) };
  }
  function name(mode, v) {
    if (v >= COUNT) return SPECIAL[v - COUNT].name + ' ' + NAMES[mode][split(mode, v).shape];
    const { shape, decal } = split(mode, v);
    return (DECALS[decal] ? DECALS[decal] + ' ' : '') + NAMES[mode][shape];
  }

  // ----------------------------------------------------------- helpers

  function poly(pts, z) {
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x * z, y * z) : p.moveTo(x * z, y * z)));
    p.closePath();
    return p;
  }
  function circ(x, y, r) { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; }
  function ell(x, y, rx, ry) { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p; }
  function rect(x, y, w, h) { const p = new Path2D(); p.rect(x, y, w, h); return p; }

  // Decal clipped to the body path.
  function decal(c, path, kind, z, o) {
    if (!kind) return;
    c.save();
    c.clip(path);
    if (kind === 1) {
      c.strokeStyle = o.c2; c.globalAlpha = 0.55; c.lineWidth = z * 0.11;
      c.beginPath();
      for (let k = -z * 1.5; k < z * 1.5; k += z * 0.3) { c.moveTo(k, -z); c.lineTo(k + z, z); }
      c.stroke();
    } else if (kind === 2) {
      c.fillStyle = o.c2; c.globalAlpha = 0.6;
      for (let x = -z; x <= z; x += z * 0.24) {
        for (let y = -z; y <= z; y += z * 0.24) {
          c.beginPath(); c.arc(x + ((y / (z * 0.24)) % 2 ? z * 0.12 : 0), y, z * 0.045, 0, Math.PI * 2); c.fill();
        }
      }
    } else if (kind === 3) {
      c.fillStyle = 'rgba(0,0,0,0.28)';
      c.fillRect(-z, 0, z * 2, z);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(-z, -z * 0.04, z * 2, z * 0.06);
    } else specialDecal(c, kind, z, o);
    c.restore();
  }

  function specialDecal(c, kind, z, o) {
    const t = o.t || 0;
    if (kind === 4) { // galaxy: nebula glow and twinkling stars
      const g = c.createRadialGradient(z * 0.15, -z * 0.15, 0, 0, 0, z);
      g.addColorStop(0, 'rgba(200,120,255,0.6)'); g.addColorStop(0.5, 'rgba(70,30,170,0.35)'); g.addColorStop(1, 'rgba(0,0,10,0.6)');
      c.fillStyle = g; c.fillRect(-z, -z, 2 * z, 2 * z);
      for (let i = 0; i < 18; i++) {
        const x = (((i * 37) % 19) / 19 - 0.5) * 1.7 * z, y = (((i * 53) % 23) / 23 - 0.5) * 1.7 * z;
        c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i * 1.7));
        c.fillStyle = i % 3 ? '#fff' : o.c2;
        c.beginPath(); c.arc(x, y, z * (i % 4 ? 0.022 : 0.042), 0, Math.PI * 2); c.fill();
      }
    } else if (kind === 5) { // inferno: flames licking up from the bottom
      for (let i = 0; i < 7; i++) {
        const x = (-0.9 + i * 0.3) * z, hgt = (0.5 + 0.22 * Math.sin(t * 9 + i * 2.1)) * z;
        c.fillStyle = i % 2 ? o.c2 : '#ff2a0a'; c.globalAlpha = 0.8;
        c.beginPath(); c.moveTo(x - 0.2 * z, 0.6 * z);
        c.quadraticCurveTo(x - 0.12 * z, 0.6 * z - hgt * 0.6, x, 0.6 * z - hgt);
        c.quadraticCurveTo(x + 0.12 * z, 0.6 * z - hgt * 0.6, x + 0.2 * z, 0.6 * z);
        c.fill();
      }
    } else if (kind === 6) { // frost: crystal facets and a glint
      c.fillStyle = '#fff';
      const facets = [[[-1, -1], [0.1, -1], [-0.4, 0.2], [-1, 0.5]], [[0.3, -1], [1, -1], [1, -0.2], [0.1, 0.3]], [[-0.2, 0.5], [0.6, 0.1], [1, 1], [-0.3, 1]]];
      facets.forEach((f, i) => {
        c.globalAlpha = [0.38, 0.2, 0.28][i];
        c.beginPath(); f.forEach(([x, y], k) => (k ? c.lineTo(x * z, y * z) : c.moveTo(x * z, y * z))); c.closePath(); c.fill();
      });
      c.globalAlpha = 0.8; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, z * 0.03);
      c.beginPath(); c.moveTo(-0.4 * z, 0.2 * z); c.lineTo(0.1 * z, 0.3 * z); c.lineTo(0.6 * z, 0.1 * z); c.stroke();
      const gx = ((t * 0.5) % 1.4 - 0.7) * 2 * z;
      c.globalAlpha = 0.5; c.fillRect(gx, -z, z * 0.1, 2 * z);
    } else if (kind === 7) { // checkerboard
      const q = z * 0.25;
      c.fillStyle = o.c2; c.globalAlpha = 0.75;
      for (let i = -4; i < 4; i++) for (let j = -4; j < 4; j++) if ((i + j) & 1) c.fillRect(i * q, j * q, q, q);
    } else if (kind === 8) { // prism: sliding rainbow bands
      c.rotate(-0.6);
      const q = z * 0.22, off = (t * 0.6 * z) % (q * 7);
      for (let k = -12; k < 12; k++) {
        c.fillStyle = `hsl(${((k + 12) % 7) * 51}, 95%, 60%)`;
        c.fillRect(k * q + off, -2 * z, q + 1, 4 * z);
      }
    } else if (kind === 9) { // glitch: shifting RGB scanlines
      const seed = Math.floor(t * 7);
      for (let i = 0; i < 6; i++) {
        const y = ((((i * 31 + seed * 17) % 20) / 20) - 0.5) * 2 * z;
        const off = ((((i * 13 + seed * 7) % 9) / 9) - 0.5) * 0.4 * z;
        c.globalAlpha = 0.7;
        c.fillStyle = ['#00f0ff', '#ff00e0', '#000'][i % 3];
        c.fillRect(-z + off, y, 2 * z, z * (0.05 + (i % 2) * 0.05));
      }
    } else if (kind === 10) { // demon: glowing lava cracks over a dark hide
      const g = c.createLinearGradient(0, z * 0.6, 0, -z * 0.2);
      g.addColorStop(0, 'rgba(255,60,20,0.55)'); g.addColorStop(1, 'rgba(255,60,20,0)');
      c.fillStyle = g; c.fillRect(-z, -z, 2 * z, 2 * z);
      c.strokeStyle = o.c2; c.lineWidth = Math.max(1, z * 0.045); c.lineJoin = 'miter';
      c.globalAlpha = 0.65 + 0.35 * Math.abs(Math.sin(t * 3));
      for (const line of [[[-0.9, 0.3], [-0.5, 0.12], [-0.38, 0.36], [0, 0.22]], [[0.9, -0.2], [0.52, 0.02], [0.42, 0.34], [0.12, 0.5]], [[-0.25, -0.9], [-0.12, -0.55], [0.15, -0.46], [0.22, -0.2]]]) {
        c.beginPath(); line.forEach(([x, y], k) => (k ? c.lineTo(x * z, y * z) : c.moveTo(x * z, y * z))); c.stroke();
      }
    } else if (kind === 11) { // gold: metallic bands and a moving sheen
      c.rotate(-0.7);
      for (let k = -6; k < 6; k++) {
        c.fillStyle = k % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(150,80,0,0.18)';
        c.fillRect(k * z * 0.26, -2 * z, z * 0.26, 4 * z);
      }
      const gx = ((t * 0.7) % 2 - 1) * 1.6 * z;
      c.fillStyle = 'rgba(255,255,240,0.6)'; c.fillRect(gx, -2 * z, z * 0.14, 4 * z);
    }
  }

  // Things worn on top: demon horns, a crown, an angel's halo. (X, Y) is
  // the top centre of the head and S its width, in pixels.
  function horns(c, X, Y, S) {
    for (const k of [-1, 1]) {
      const p = new Path2D();
      p.moveTo(X + k * S * 0.38, Y + S * 0.03);
      p.quadraticCurveTo(X + k * S * 0.52, Y - S * 0.14, X + k * S * 0.47, Y - S * 0.4);
      p.quadraticCurveTo(X + k * S * 0.3, Y - S * 0.12, X + k * S * 0.12, Y + S * 0.03);
      p.closePath();
      const g = c.createLinearGradient(0, Y, 0, Y - S * 0.4);
      g.addColorStop(0, '#5a0600'); g.addColorStop(1, '#ff6a3a');
      c.fillStyle = g; c.fill(p); c.stroke(p);
    }
  }
  function crown(c, X, Y, S) {
    const pts = [[-0.32, 0.03], [-0.32, -0.22], [-0.17, -0.09], [0, -0.32], [0.17, -0.09], [0.32, -0.22], [0.32, 0.03]];
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(X + x * S, Y + y * S) : p.moveTo(X + x * S, Y + y * S)));
    p.closePath();
    const g = c.createLinearGradient(0, Y - S * 0.32, 0, Y);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(1, '#e0a000');
    c.fillStyle = g; c.fill(p); c.stroke(p);
    c.fillStyle = '#ff3b6b'; c.beginPath(); c.arc(X, Y - S * 0.06, S * 0.05, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3bc8ff';
    for (const k of [-1, 1]) { c.beginPath(); c.arc(X + k * S * 0.19, Y - S * 0.04, S * 0.035, 0, Math.PI * 2); c.fill(); }
  }
  function partyHat(c, X, Y, S, t) {
    const p = new Path2D();
    p.moveTo(X - S * 0.26, Y + S * 0.02); p.lineTo(X + S * 0.04, Y - S * 0.5); p.lineTo(X + S * 0.3, Y + S * 0.02); p.closePath();
    c.fillStyle = '#ff3bd0'; c.fill(p);
    c.save(); c.clip(p); c.fillStyle = '#ffe23b';
    for (let i = 0; i < 4; i++) c.fillRect(X - S * 0.4, Y - S * 0.42 + i * S * 0.13, S * 0.8, S * 0.05);
    c.restore(); c.stroke(p);
    c.fillStyle = `hsl(${(t * 120) % 360},90%,60%)`;
    c.beginPath(); c.arc(X + S * 0.04, Y - S * 0.52, S * 0.08, 0, Math.PI * 2); c.fill(); c.stroke();
  }
  function halo(c, X, Y, S, t) {
    const y = Y - S * 0.22 + Math.sin(t * 3) * S * 0.03;
    c.save();
    c.shadowColor = '#fff3b0'; c.shadowBlur = S * 0.3;
    withWidth(c, Math.max(2, S * 0.07), () => {
      c.strokeStyle = '#ffe066'; c.beginPath(); c.ellipse(X, y, S * 0.3, S * 0.08, 0, 0, Math.PI * 2); c.stroke();
    });
    c.restore();
  }
  // Top centre of each mode's head (x, y, width as fractions of the size).
  const HEAD = {
    cube: [0, -0.5, 1], ship: [-0.03, -0.5, 0.48], ball: [0, -0.46, 0.8], ufo: [0, -0.48, 0.6],
    wave: [-0.12, -0.28, 0.62], robot: [0, -0.5, 0.8], spider: [0.05, -0.42, 0.72], swing: [0, -0.38, 0.75],
  };

  // Fill a body path with the primary colour, decal it, outline it.
  function hull(c, path, z, o, d, fill) {
    c.fillStyle = fill || o.c1;
    c.fill(path);
    decal(c, path, d, z, o);
    c.stroke(path);
  }
  function part(c, path, fill) { c.fillStyle = fill; c.fill(path); c.stroke(path); }

  function shine(c, x, y, w, h) {
    const g = c.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.38)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
  }
  function eye(c, x, y, r, look = 0.3) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#000'; c.beginPath(); c.arc(x + r * look, y, r * 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + r * look - r * 0.15, y - r * 0.2, r * 0.17, 0, Math.PI * 2); c.fill();
  }
  function withWidth(c, w, fn) { const lw = c.lineWidth; c.lineWidth = w; fn(); c.lineWidth = lw; }

  // --------------------------------------------------------------- cube

  function cube(c, z, o, v) {
    const { shape, decal: d } = split('cube', v);
    const h = z / 2, c1 = o.c1, c2 = o.c2;
    const lw = c.lineWidth;
    const box = (x, y, w, hh, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, hh); c.strokeRect(x, y, w, hh); };
    const eyes = (y, w, hh) => {
      c.fillStyle = '#000';
      c.fillRect(-h * 0.45, y, w, hh); c.fillRect(h * 0.45 - w, y, w, hh);
      c.fillStyle = '#fff';
      c.fillRect(-h * 0.45 + w * 0.15, y + hh * 0.12, w * 0.35, hh * 0.3);
      c.fillRect(h * 0.45 - w + w * 0.15, y + hh * 0.12, w * 0.35, hh * 0.3);
    };
    hull(c, rect(-h, -h, 2 * h, 2 * h), z, o, d);
    if (o.sp === 'demon') demonFace(c, h, c2);
    else switch (shape) {
      case 1:
        box(-h * 0.8, -h * 0.45, h * 1.6, h * 0.6, c2);
        c.fillStyle = '#000'; c.fillRect(-h * 0.6, -h * 0.25, h * 1.2, h * 0.18);
        c.fillStyle = '#fff'; c.fillRect(h * 0.25, -h * 0.25, h * 0.2, h * 0.08);
        break;
      case 2:
        c.fillStyle = c2;
        c.beginPath(); c.rect(-h * 0.25, -h * 0.75, h * 0.5, h * 1.5); c.rect(-h * 0.75, -h * 0.25, h * 1.5, h * 0.5); c.fill();
        c.fillStyle = '#000'; c.fillRect(-h * 0.12, -h * 0.12, h * 0.24, h * 0.24);
        break;
      case 3:
        part(c, poly([[0, -0.375], [0.375, 0], [0, 0.375], [-0.375, 0]], z), c2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(0, 0, h * 0.18, 0, Math.PI * 2); c.fill();
        break;
      case 4:
        part(c, poly([[0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], z), c2);
        eyes(-h * 0.4, h * 0.25, h * 0.35);
        break;
      case 5:
        box(-h * 0.65, -h * 0.65, h * 1.3, h * 1.3, c2);
        box(-h * 0.38, -h * 0.38, h * 0.76, h * 0.76, c1);
        box(-h * 0.14, -h * 0.14, h * 0.28, h * 0.28, c2);
        break;
      case 6:
        box(-h * 0.7, -h * 0.7, h * 1.4, h * 1.4, c2);
        eyes(-h * 0.4, h * 0.22, h * 0.32);
        withWidth(c, Math.max(1.5, h * 0.12), () => { c.beginPath(); c.arc(0, h * 0.05, h * 0.38, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); });
        break;
      case 7:
        c.fillStyle = c2;
        for (let i = 0; i < 3; i++) c.fillRect(-h * 0.7 + i * h * 0.55, -h * 0.75, h * 0.3, h * 1.5);
        eyes(-h * 0.35, h * 0.22, h * 0.3);
        break;
      default: {
        const i = h * 0.5;
        box(-i, -i, 2 * i, 2 * i, c2);
        c.fillStyle = '#000';
        c.fillRect(-i * 0.7, -i * 0.55, i * 0.45, i * 0.5); c.fillRect(i * 0.25, -i * 0.55, i * 0.45, i * 0.5);
        c.fillStyle = '#fff';
        c.fillRect(-i * 0.62, -i * 0.5, i * 0.16, i * 0.16); c.fillRect(i * 0.33, -i * 0.5, i * 0.16, i * 0.16);
      }
    }
    c.strokeStyle = 'rgba(0,0,0,0.28)'; c.lineWidth = Math.max(1, h * 0.1);
    c.strokeRect(-h + h * 0.14, -h + h * 0.14, 2 * h - h * 0.28, 2 * h - h * 0.28);
    c.strokeStyle = '#000';
    shine(c, -h, -h, 2 * h, h);
    c.lineWidth = lw;
  }

  // Slanted glowing eyes and a fanged grin.
  function demonFace(c, h, c2) {
    c.save();
    c.shadowColor = c2; c.shadowBlur = h * 0.5;
    c.fillStyle = c2;
    for (const k of [-1, 1]) {
      c.beginPath();
      c.moveTo(k * h * 0.12, -h * 0.12); c.lineTo(k * h * 0.72, -h * 0.42); c.lineTo(k * h * 0.62, -h * 0.02);
      c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
    c.fillStyle = '#000';
    c.beginPath(); c.moveTo(-h * 0.6, h * 0.22); c.quadraticCurveTo(0, h * 0.42, h * 0.6, h * 0.22);
    c.quadraticCurveTo(0, h * 0.85, -h * 0.6, h * 0.22); c.fill();
    c.fillStyle = '#fff';
    for (const x of [-0.36, -0.12, 0.12, 0.36]) {
      c.beginPath(); c.moveTo((x - 0.08) * h, h * 0.3); c.lineTo(x * h, h * 0.5); c.lineTo((x + 0.08) * h, h * 0.3); c.fill();
    }
  }

  // The player's own cube riding in the ship or UFO, in its own colours.
  function rider(c, z, o, x, y, scale) {
    c.save(); c.translate(x * z, y * z);
    draw(c, 'cube', z * scale, Object.assign({}, o.orig || o, { v: o.cube || 0 }));
    c.restore();
  }

  // --------------------------------------------------------------- ship

  function ship(c, z, o, v) {
    const { shape, decal: d } = split('ship', v);
    const glass = 'rgba(170,235,255,0.5)';
    switch (shape) {
      case 1: { // Jet
        part(c, poly([[-0.72, -0.02], [-0.52, -0.02], [-0.72, -0.38]], z), o.c2);
        c.fillStyle = glass; c.beginPath(); c.ellipse(0.02 * z, -0.06 * z, 0.3 * z, 0.2 * z, 0, Math.PI, 0); c.fill(); c.stroke();
        rider(c, z, o, -0.02, -0.24, 0.44);
        hull(c, poly([[-0.72, -0.02], [0.22, -0.06], [0.82, 0.12], [0.22, 0.3], [-0.62, 0.3]], z), z, o, d);
        part(c, poly([[-0.38, 0.2], [0.06, 0.2], [-0.46, 0.62], [-0.62, 0.62]], z), o.c2);
        c.fillStyle = '#fff'; c.fillRect(0.3 * z, 0.08 * z, 0.3 * z, 0.05 * z);
        break;
      }
      case 2: { // Rocket
        part(c, poly([[-0.55, 0.0], [-0.8, -0.32], [-0.4, -0.02]], z), o.c2);
        part(c, poly([[-0.55, 0.26], [-0.8, 0.58], [-0.4, 0.28]], z), o.c2);
        rider(c, z, o, 0.0, -0.26, 0.46);
        const body = new Path2D(); body.ellipse(0, 0.13 * z, 0.66 * z, 0.25 * z, 0, 0, Math.PI * 2);
        hull(c, body, z, o, d);
        part(c, circ(0.3 * z, 0.12 * z, 0.1 * z), 'rgba(170,235,255,0.85)');
        c.fillStyle = '#ff9e2b'; c.beginPath(); c.moveTo(-0.66 * z, 0.05 * z); c.lineTo(-0.9 * z, 0.13 * z); c.lineTo(-0.66 * z, 0.21 * z); c.fill();
        break;
      }
      case 3: { // Manta
        rider(c, z, o, -0.05, -0.22, 0.44);
        const p = new Path2D();
        p.moveTo(0.75 * z, 0.12 * z);
        p.quadraticCurveTo(0.15 * z, -0.12 * z, -0.72 * z, 0);
        p.lineTo(-0.5 * z, 0.18 * z);
        p.quadraticCurveTo(-0.25 * z, 0.7 * z, 0.1 * z, 0.46 * z);
        p.quadraticCurveTo(0.4 * z, 0.36 * z, 0.75 * z, 0.12 * z);
        hull(c, p, z, o, d);
        c.fillStyle = o.c2;
        c.beginPath(); c.moveTo(-0.3 * z, 0.2 * z); c.quadraticCurveTo(-0.1 * z, 0.5 * z, 0.15 * z, 0.32 * z); c.lineTo(0.1 * z, 0.22 * z); c.closePath(); c.fill(); c.stroke();
        eye(c, 0.48 * z, 0.12 * z, 0.06 * z);
        break;
      }
      case 4: { // Tank
        rider(c, z, o, -0.12, -0.27, 0.46);
        part(c, rect(0.3 * z, -0.14 * z, 0.5 * z, 0.11 * z), '#333');
        const body = new Path2D(); body.roundRect ? body.roundRect(-0.66 * z, -0.04 * z, 1.18 * z, 0.32 * z, 0.08 * z) : body.rect(-0.66 * z, -0.04 * z, 1.18 * z, 0.32 * z);
        hull(c, body, z, o, d);
        part(c, rect(-0.64 * z, 0.28 * z, 1.14 * z, 0.18 * z), '#222');
        c.fillStyle = o.c2;
        for (let i = 0; i < 5; i++) { c.beginPath(); c.arc((-0.5 + i * 0.23) * z, 0.37 * z, 0.06 * z, 0, Math.PI * 2); c.fill(); }
        break;
      }
      case 5: { // Twin engines
        part(c, ell(-0.42 * z, -0.12 * z, 0.26 * z, 0.09 * z), o.c2);
        part(c, ell(-0.42 * z, 0.4 * z, 0.26 * z, 0.09 * z), o.c2);
        c.fillStyle = '#ffb43b';
        c.beginPath(); c.arc(-0.7 * z, -0.12 * z, 0.06 * z, 0, Math.PI * 2); c.arc(-0.7 * z, 0.4 * z, 0.06 * z, 0, Math.PI * 2); c.fill();
        rider(c, z, o, 0.0, -0.24, 0.44);
        const body = new Path2D();
        body.moveTo(-0.6 * z, -0.02 * z); body.lineTo(0.35 * z, -0.02 * z);
        body.quadraticCurveTo(0.8 * z, 0.14 * z, 0.35 * z, 0.3 * z); body.lineTo(-0.6 * z, 0.3 * z); body.closePath();
        hull(c, body, z, o, d);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0.48 * z, 0.13 * z, 0.05 * z, 0, Math.PI * 2); c.fill();
        break;
      }
      default: { // Classic
        c.fillStyle = glass;
        c.beginPath(); c.arc(-z * 0.02, -z * 0.08, z * 0.32, Math.PI, 0); c.fill(); c.stroke();
        rider(c, z, o, -0.05, -0.28, 0.48);
        part(c, rect(-0.8 * z, 0.04 * z, 0.14 * z, 0.24 * z), '#222');
        c.fillStyle = o.c2; c.fillRect(-0.78 * z, 0.09 * z, 0.06 * z, 0.14 * z);
        hull(c, poly([[-0.68, -0.05], [0.28, -0.05], [0.74, 0.12], [0.38, 0.36], [-0.56, 0.36], [-0.72, 0.15]], z), z, o, d);
        part(c, poly([[-0.4, 0.08], [0.3, 0.08], [0.16, 0.24], [-0.4, 0.24]], z), o.c2);
        part(c, poly([[-0.3, 0.36], [-0.05, 0.36], [-0.32, 0.56], [-0.5, 0.56]], z), o.c1);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0.52 * z, 0.13 * z, 0.04 * z, 0, Math.PI * 2); c.fill();
      }
    }
    shine(c, -0.7 * z, -0.05 * z, 1.4 * z, 0.14 * z);
  }

  // --------------------------------------------------------------- ball

  function ball(c, z, o, v) {
    const { shape, decal: d } = split('ball', v);
    const r = z / 2;
    switch (shape) {
      case 1: { // Gear
        const p = new Path2D();
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2, rr = i % 2 ? r * 0.82 : r;
          i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(rr, 0);
        }
        p.closePath();
        hull(c, p, z, o, d);
        part(c, circ(0, 0, r * 0.55), o.c2);
        part(c, circ(0, 0, r * 0.22), '#222');
        break;
      }
      case 2: { // Eye
        hull(c, circ(0, 0, r), z, o, d);
        part(c, circ(r * 0.12, 0, r * 0.55), '#fff');
        part(c, circ(r * 0.2, 0, r * 0.32), o.c2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(r * 0.24, 0, r * 0.15, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(r * 0.12, -r * 0.12, r * 0.07, 0, Math.PI * 2); c.fill();
        break;
      }
      case 3: { // Swirl
        hull(c, circ(0, 0, r), z, o, d);
        const p = new Path2D();
        p.arc(0, 0, r * 0.82, -Math.PI / 2, Math.PI / 2);
        p.arc(0, r * 0.41, r * 0.41, Math.PI / 2, -Math.PI / 2, true);
        p.arc(0, -r * 0.41, r * 0.41, Math.PI / 2, -Math.PI / 2);
        part(c, p, o.c2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(0, -r * 0.41, r * 0.12, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0, r * 0.41, r * 0.12, 0, Math.PI * 2); c.fill();
        break;
      }
      case 4: { // Spiky
        const p = new Path2D();
        for (let i = 0; i < 20; i++) {
          const a = (i / 20) * Math.PI * 2, rr = i % 2 ? r * 0.78 : r;
          i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(rr, 0);
        }
        p.closePath();
        hull(c, p, z, o, d);
        withWidth(c, Math.max(1, r * 0.12), () => { c.strokeStyle = o.c2; c.beginPath(); c.arc(0, 0, r * 0.5, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#000'; });
        part(c, circ(0, 0, r * 0.25), '#000');
        break;
      }
      case 5: { // Bubble with a face
        hull(c, circ(0, 0, r), z, o, d);
        part(c, poly([[0, -0.3], [0.3, 0], [0, 0.3], [-0.3, 0]], z), o.c2);
        c.fillStyle = '#000';
        c.fillRect(-r * 0.24, -r * 0.14, r * 0.12, r * 0.18); c.fillRect(r * 0.12, -r * 0.14, r * 0.12, r * 0.18);
        break;
      }
      default: { // Classic
        hull(c, circ(0, 0, r), z, o, d);
        c.fillStyle = '#000';
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + Math.PI / 8;
          c.beginPath(); c.arc(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.06, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = o.c2;
        for (let i = 0; i < 4; i++) {
          c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r * 0.72, i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 4); c.closePath(); c.fill(); c.stroke();
        }
        part(c, circ(0, 0, r * 0.26), '#000');
        c.fillStyle = o.c2; c.beginPath(); c.arc(0, 0, r * 0.15, 0, Math.PI * 2); c.fill();
      }
    }
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath(); c.ellipse(-r * 0.3, -r * 0.45, r * 0.33, r * 0.15, -0.5, 0, Math.PI * 2); c.fill();
  }

  // ---------------------------------------------------------------- ufo

  function dome(c, z, x, y, r) {
    const g = c.createLinearGradient(0, (y - r) * z, 0, y * z);
    g.addColorStop(0, 'rgba(200,245,255,0.6)'); g.addColorStop(1, 'rgba(120,200,255,0.25)');
    c.fillStyle = g;
    c.beginPath(); c.arc(x * z, y * z, r * z, Math.PI, 0); c.fill(); c.stroke();
  }
  function ufo(c, z, o, v) {
    const { shape, decal: d } = split('ufo', v);
    const blink = (i) => (Math.floor((o.t || 0) * 6 + i) % 2 === 0 ? '#fff' : o.c2);
    switch (shape) {
      case 1: // Ringed
        rider(c, z, o, 0, -0.2, 0.42); dome(c, z, 0, -0.1, 0.36);
        hull(c, ell(0, 0.12 * z, 0.5 * z, 0.16 * z), z, o, d);
        withWidth(c, Math.max(2, z * 0.07), () => { c.strokeStyle = o.c2; c.beginPath(); c.ellipse(0, 0.14 * z, 0.7 * z, 0.12 * z, 0, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#000'; });
        break;
      case 2: // Lander with legs
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 0.3 * z, 0.2 * z); c.lineTo(s * 0.5 * z, 0.48 * z); c.lineTo(s * 0.6 * z, 0.48 * z); c.stroke(); }
        rider(c, z, o, 0, -0.26, 0.44); dome(c, z, 0, -0.12, 0.42);
        hull(c, ell(0, 0.12 * z, 0.6 * z, 0.2 * z), z, o, d);
        for (let i = 0; i < 3; i++) { c.fillStyle = blink(i); c.beginPath(); c.arc((-0.3 + i * 0.3) * z, 0.12 * z, 0.05 * z, 0, Math.PI * 2); c.fill(); }
        break;
      case 3: { // Jelly
        c.strokeStyle = o.c2;
        withWidth(c, Math.max(1.5, z * 0.05), () => {
          for (let i = 0; i < 5; i++) {
            const x = (-0.36 + i * 0.18) * z, w = Math.sin((o.t || 0) * 6 + i) * 0.05 * z;
            c.beginPath(); c.moveTo(x, 0.15 * z); c.quadraticCurveTo(x + w, 0.32 * z, x, 0.5 * z); c.stroke();
          }
        });
        c.strokeStyle = '#000';
        const bell = new Path2D();
        bell.arc(0, 0.1 * z, 0.5 * z, Math.PI, 0);
        for (let i = 0; i <= 5; i++) bell.lineTo((0.5 - i * 0.2) * z, (i % 2 ? 0.2 : 0.12) * z);
        bell.closePath();
        hull(c, bell, z, o, d);
        rider(c, z, o, 0, -0.08, 0.36);
        break;
      }
      case 4: // Diamond saucer
        rider(c, z, o, 0, -0.22, 0.42); dome(c, z, 0, -0.1, 0.34);
        hull(c, poly([[-0.72, 0.12], [0, -0.04], [0.72, 0.12], [0, 0.32]], z), z, o, d);
        part(c, poly([[-0.3, 0.12], [0, 0.04], [0.3, 0.12], [0, 0.2]], z), o.c2);
        break;
      case 5: // Twin domes
        dome(c, z, -0.42, 0.0, 0.16); dome(c, z, 0.42, 0.0, 0.16);
        rider(c, z, o, 0, -0.22, 0.42); dome(c, z, 0, -0.1, 0.34);
        hull(c, ell(0, 0.12 * z, 0.66 * z, 0.18 * z), z, o, d);
        for (let i = 0; i < 6; i++) { c.fillStyle = blink(i); c.beginPath(); c.arc((-0.5 + i * 0.2) * z, 0.16 * z, 0.04 * z, 0, Math.PI * 2); c.fill(); }
        break;
      default: // Classic
        rider(c, z, o, 0, -0.22, 0.42); dome(c, z, 0, -0.12, 0.38);
        hull(c, ell(0, 0.12 * z, 0.64 * z, 0.22 * z), z, o, d);
        part(c, ell(0, 0.2 * z, 0.38 * z, 0.08 * z), o.c2);
        for (let i = 0; i < 5; i++) { c.fillStyle = blink(i); c.beginPath(); c.arc((-0.44 + i * 0.22) * z, 0.08 * z, 0.045 * z, 0, Math.PI * 2); c.fill(); }
    }
  }

  // --------------------------------------------------------------- wave

  function wave(c, z, o, v) {
    const { shape, decal: d } = split('wave', v);
    switch (shape) {
      case 1: // Dart
        hull(c, poly([[0.65, 0], [-0.5, -0.3], [-0.3, 0], [-0.5, 0.3]], z), z, o, d);
        part(c, poly([[0.3, 0], [-0.2, -0.1], [-0.2, 0.1]], z), o.c2);
        break;
      case 2: // Double
        part(c, poly([[0.2, 0], [-0.55, -0.42], [-0.35, 0], [-0.55, 0.42]], z), o.c2);
        hull(c, poly([[0.6, 0], [-0.25, -0.42], [-0.05, 0], [-0.25, 0.42]], z), z, o, d);
        break;
      case 3: { // Crescent
        const p = new Path2D();
        p.moveTo(0.6 * z, 0);
        p.quadraticCurveTo(-0.1 * z, -0.2 * z, -0.45 * z, -0.48 * z);
        p.quadraticCurveTo(-0.15 * z, 0, -0.45 * z, 0.48 * z);
        p.quadraticCurveTo(-0.1 * z, 0.2 * z, 0.6 * z, 0);
        hull(c, p, z, o, d);
        eye(c, 0.15 * z, 0, 0.09 * z);
        break;
      }
      case 4: // Diamond
        hull(c, poly([[0.55, 0], [0, -0.4], [-0.55, 0], [0, 0.4]], z), z, o, d);
        part(c, poly([[0.25, 0], [0, -0.18], [-0.25, 0], [0, 0.18]], z), o.c2);
        break;
      case 5: // Chevron
        hull(c, poly([[0.6, 0], [0.0, -0.45], [-0.2, -0.45], [0.3, 0], [-0.2, 0.45], [0.0, 0.45]], z), z, o, d);
        part(c, poly([[0.15, 0], [-0.35, -0.45], [-0.55, -0.45], [-0.1, 0], [-0.55, 0.45], [-0.35, 0.45]], z), o.c2);
        break;
      default: // Classic
        hull(c, poly([[0.575, 0], [-0.4, -0.425], [-0.2, 0], [-0.4, 0.425]], z), z, o, d);
        c.fillStyle = o.c2;
        c.beginPath(); c.moveTo(0.3 * z, 0); c.lineTo(-0.175 * z, -0.2 * z); c.lineTo(-0.075 * z, 0); c.lineTo(-0.175 * z, 0.2 * z); c.closePath(); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.moveTo(0.375 * z, -0.025 * z); c.lineTo(-0.25 * z, -0.325 * z); c.lineTo(-0.225 * z, -0.25 * z); c.closePath(); c.fill();
    }
  }

  // -------------------------------------------------------------- robot

  function flameCone(c, z) {
    const len = z * (0.55 + Math.random() * 0.25);
    const g = c.createLinearGradient(0, z * 0.45, 0, z * 0.45 + len);
    g.addColorStop(0, 'rgba(255,240,160,1)'); g.addColorStop(0.3, 'rgba(255,163,31,0.95)');
    g.addColorStop(0.7, 'rgba(255,58,20,0.7)'); g.addColorStop(1, 'rgba(224,32,15,0)');
    c.save(); c.fillStyle = g;
    c.beginPath(); c.moveTo(-z * 0.34, z * 0.45);
    c.quadraticCurveTo(-z * 0.2, z * 0.45 + len * 0.6, 0, z * 0.45 + len);
    c.quadraticCurveTo(z * 0.2, z * 0.45 + len * 0.6, z * 0.34, z * 0.45);
    c.closePath(); c.fill(); c.restore();
  }
  function legs(c, z, o, xs, top, foot = true) {
    const step = o.grounded ? Math.sin((o.t || 0) * 14) * z * 0.12 : z * 0.1;
    xs.forEach((lx, i) => {
      const k = i % 2 ? -step : step;
      c.fillStyle = o.c2;
      c.fillRect(lx * z + k * 0.5, top * z, z * 0.16, z * (0.31 - top + 0.15)); c.strokeRect(lx * z + k * 0.5, top * z, z * 0.16, z * (0.31 - top + 0.15));
      c.fillRect(lx * z + k, z * 0.31, z * 0.16, z * 0.14); c.strokeRect(lx * z + k, z * 0.31, z * 0.16, z * 0.14);
      if (foot) { c.fillStyle = '#222'; c.fillRect(lx * z + k - z * 0.03, z * 0.43, z * 0.23, z * 0.08); c.strokeRect(lx * z + k - z * 0.03, z * 0.43, z * 0.23, z * 0.08); }
    });
    return step;
  }
  function robot(c, z, o, v) {
    const { shape, decal: d } = split('robot', v);
    if (o.boost) flameCone(c, z);
    const blink = Math.floor((o.t || 0) * 3) % 2 ? '#ff3b3b' : '#fff';
    switch (shape) {
      case 1: { // Round head
        legs(c, z, o, [-0.26, 0.1], 0.18);
        hull(c, rect(-0.36 * z, -0.12 * z, 0.72 * z, 0.32 * z), z, o, d);
        part(c, circ(0.02 * z, -0.32 * z, 0.24 * z), o.c1);
        part(c, ell(0.1 * z, -0.33 * z, 0.13 * z, 0.08 * z), '#111');
        c.fillStyle = o.c2; c.fillRect(0.08 * z, -0.37 * z, 0.1 * z, 0.08 * z);
        c.fillStyle = blink; c.beginPath(); c.arc(-0.15 * z, -0.0 * z, 0.05 * z, 0, Math.PI * 2); c.fill();
        break;
      }
      case 2: { // Cyclops
        legs(c, z, o, [-0.2, 0.06], 0.2);
        hull(c, rect(-0.3 * z, -0.5 * z, 0.6 * z, 0.72 * z), z, o, d);
        eye(c, 0.02 * z, -0.24 * z, 0.17 * z, 0.4);
        part(c, rect(-0.18 * z, 0.02 * z, 0.36 * z, 0.1 * z), o.c2);
        break;
      }
      case 3: { // Mech
        legs(c, z, o, [-0.3, 0.12], 0.18);
        part(c, rect(-0.66 * z, -0.12 * z, 0.18 * z, 0.38 * z), o.c2);
        part(c, rect(0.42 * z, -0.06 * z, 0.4 * z, 0.12 * z), '#333');
        hull(c, rect(-0.46 * z, -0.42 * z, 0.92 * z, 0.62 * z), z, o, d);
        part(c, poly([[-0.56, -0.42], [-0.2, -0.42], [-0.3, -0.28], [-0.56, -0.28]], z), o.c2);
        part(c, poly([[0.56, -0.42], [0.2, -0.42], [0.3, -0.28], [0.56, -0.28]], z), o.c2);
        c.fillStyle = '#111'; c.fillRect(-0.16 * z, -0.24 * z, 0.4 * z, 0.14 * z);
        c.fillStyle = blink; c.fillRect(0.06 * z, -0.21 * z, 0.12 * z, 0.08 * z);
        break;
      }
      case 4: { // Crab
        legs(c, z, o, [-0.42, -0.16, 0.1, 0.36], 0.12, false);
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 0.18 * z, -0.12 * z); c.lineTo(s * 0.24 * z, -0.42 * z); c.stroke(); eye(c, s * 0.24 * z, -0.46 * z, 0.08 * z); }
        const body = new Path2D(); body.ellipse(0, 0.04 * z, 0.55 * z, 0.2 * z, 0, 0, Math.PI * 2);
        hull(c, body, z, o, d);
        c.fillStyle = o.c2; c.fillRect(-0.2 * z, 0.0, 0.4 * z, 0.07 * z);
        break;
      }
      case 5: { // TV head
        legs(c, z, o, [-0.26, 0.1], 0.18);
        hull(c, rect(-0.34 * z, -0.06 * z, 0.68 * z, 0.26 * z), z, o, d);
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 0.08 * z, -0.5 * z); c.lineTo(s * 0.2 * z, -0.68 * z); c.stroke(); }
        part(c, rect(-0.42 * z, -0.52 * z, 0.84 * z, 0.48 * z), '#333');
        part(c, rect(-0.34 * z, -0.45 * z, 0.68 * z, 0.34 * z), o.c2);
        c.fillStyle = '#000'; c.fillRect(-0.18 * z, -0.36 * z, 0.08 * z, 0.1 * z); c.fillRect(0.12 * z, -0.36 * z, 0.08 * z, 0.1 * z);
        withWidth(c, Math.max(1.5, z * 0.04), () => { c.beginPath(); c.arc(0.01 * z, -0.24 * z, 0.08 * z, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); });
        break;
      }
      default: { // Classic
        const step = legs(c, z, o, [-0.28, 0.12], 0.15);
        part(c, rect(-0.58 * z, -0.18 * z + step * 0.4, 0.16 * z, 0.32 * z), o.c2);
        hull(c, rect(-0.45 * z, -0.5 * z, 0.9 * z, 0.68 * z), z, o, d);
        c.beginPath(); c.moveTo(-0.2 * z, -0.5 * z); c.lineTo(-0.26 * z, -0.66 * z); c.stroke();
        part(c, circ(-0.26 * z, -0.68 * z, 0.05 * z), blink);
        c.fillStyle = '#111'; c.fillRect(-0.08 * z, -0.4 * z, 0.46 * z, 0.22 * z);
        c.fillStyle = o.c2; c.fillRect(0.12 * z, -0.36 * z, 0.16 * z, 0.14 * z);
        c.fillStyle = '#fff'; c.fillRect(0.2 * z, -0.35 * z, 0.05 * z, 0.05 * z);
        part(c, rect(-0.32 * z, -0.08 * z, 0.38 * z, 0.18 * z), o.c2);
        c.fillStyle = '#fff'; c.beginPath(); c.arc(-0.13 * z, 0.01 * z, 0.04 * z, 0, Math.PI * 2); c.fill();
      }
    }
    shine(c, -0.45 * z, -0.5 * z, 0.9 * z, 0.3 * z);
  }

  // ------------------------------------------------------------- spider

  function spiderLegs(c, z, o, n, spread, mech) {
    const t = (o.t || 0) * 18;
    for (let i = 0; i < n; i++) {
      const side = i < n / 2 ? -1 : 1;
      const j = i % (n / 2);
      const hipX = side * z * (0.08 + j * spread);
      const kneeX = side * z * (0.32 + j * spread), kneeY = mech ? -z * 0.12 : -z * 0.02;
      const k = o.grounded ? Math.sin(t + i * 1.4) * z * 0.06 : 0;
      const footX = side * z * (0.42 + j * spread * 0.5) + k, footY = z * 0.5;
      c.lineCap = mech ? 'butt' : 'round';
      withWidth(c, Math.max(3, z * 0.12), () => { c.strokeStyle = '#000'; c.beginPath(); c.moveTo(hipX, z * 0.05); c.lineTo(kneeX, kneeY); c.lineTo(footX, footY); c.stroke(); });
      withWidth(c, Math.max(1.5, z * 0.055), () => { c.strokeStyle = j === 1 ? o.c1 : o.c2; c.stroke(); });
      if (mech) { c.fillStyle = o.c2; c.beginPath(); c.arc(kneeX, kneeY, z * 0.05, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.strokeStyle = '#000'; c.lineCap = 'butt';
    }
  }
  function spider(c, z, o, v) {
    const { shape, decal: d } = split('spider', v);
    switch (shape) {
      case 1: // Crab with claws
        spiderLegs(c, z, o, 6, 0.1);
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(0.2 * z, s * 0.04 * z - 0.1 * z); c.lineTo(0.5 * z, s * 0.1 * z - 0.18 * z); c.stroke();
          part(c, poly([[0.48, s * 0.1 - 0.3], [0.68, s * 0.1 - 0.22], [0.5, s * 0.1 - 0.1], [0.6, s * 0.1 - 0.18]], z), o.c2);
        }
        hull(c, ell(0, -0.08 * z, 0.4 * z, 0.28 * z), z, o, d);
        eye(c, 0.12 * z, -0.16 * z, 0.07 * z); eye(c, 0.28 * z, -0.12 * z, 0.06 * z);
        break;
      case 2: // Ant
        spiderLegs(c, z, o, 6, 0.14);
        for (const s of [0, 1]) { c.beginPath(); c.moveTo(0.42 * z, -0.16 * z); c.quadraticCurveTo((0.55 + s * 0.08) * z, -0.5 * z, (0.66 + s * 0.06) * z, -0.42 * z); c.stroke(); }
        hull(c, ell(-0.32 * z, -0.06 * z, 0.24 * z, 0.18 * z), z, o, d);
        part(c, ell(0.02 * z, -0.06 * z, 0.14 * z, 0.12 * z), o.c2);
        part(c, circ(0.32 * z, -0.1 * z, 0.16 * z), o.c1);
        eye(c, 0.38 * z, -0.14 * z, 0.06 * z);
        break;
      case 3: // Skull
        spiderLegs(c, z, o, 6, 0.1);
        hull(c, circ(0.08 * z, -0.12 * z, 0.36 * z), z, o, d);
        part(c, ell(-0.04 * z, -0.16 * z, 0.09 * z, 0.11 * z), '#000');
        part(c, ell(0.22 * z, -0.16 * z, 0.09 * z, 0.11 * z), '#000');
        c.fillStyle = o.c2; c.beginPath(); c.arc(-0.04 * z, -0.16 * z, 0.035 * z, 0, Math.PI * 2); c.arc(0.22 * z, -0.16 * z, 0.035 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; for (let i = 0; i < 4; i++) c.fillRect((-0.06 + i * 0.08) * z, 0.06 * z, 0.06 * z, 0.08 * z);
        break;
      case 4: // Mech
        spiderLegs(c, z, o, 4, 0.2, true);
        hull(c, rect(-0.38 * z, -0.34 * z, 0.76 * z, 0.38 * z), z, o, d);
        c.fillStyle = '#111'; c.fillRect(0.02 * z, -0.26 * z, 0.3 * z, 0.12 * z);
        c.fillStyle = o.c2; c.fillRect(0.18 * z, -0.24 * z, 0.1 * z, 0.08 * z);
        part(c, rect(-0.3 * z, -0.06 * z, 0.24 * z, 0.06 * z), o.c2);
        break;
      case 5: // Eyeball
        spiderLegs(c, z, o, 6, 0.1);
        hull(c, circ(0, -0.1 * z, 0.34 * z), z, o, d);
        part(c, circ(0.08 * z, -0.1 * z, 0.2 * z), '#fff');
        part(c, circ(0.13 * z, -0.1 * z, 0.11 * z), o.c2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(0.15 * z, -0.1 * z, 0.05 * z, 0, Math.PI * 2); c.fill();
        break;
      default: // Classic
        spiderLegs(c, z, o, 6, 0.12);
        hull(c, ell(-0.12 * z, -0.1 * z, 0.38 * z, 0.27 * z), z, o, d);
        c.fillStyle = o.c2; c.beginPath(); c.ellipse(-0.2 * z, -0.12 * z, 0.18 * z, 0.1 * z, 0, 0, Math.PI * 2); c.fill();
        part(c, circ(0.3 * z, -0.08 * z, 0.2 * z), o.c1);
        eye(c, 0.32 * z, -0.14 * z, 0.07 * z); eye(c, 0.44 * z, -0.06 * z, 0.05 * z);
        c.fillStyle = '#000'; c.beginPath(); c.moveTo(0.38 * z, 0.06 * z); c.lineTo(0.42 * z, 0.16 * z); c.lineTo(0.45 * z, 0.05 * z); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.ellipse(-0.15 * z, -0.26 * z, 0.2 * z, 0.06 * z, 0, 0, Math.PI * 2); c.fill();
  }

  // -------------------------------------------------------------- swing

  function swing(c, z, o, v) {
    const { shape, decal: d } = split('swing', v);
    switch (shape) {
      case 1: { // Bat
        for (const s of [-1, 1]) {
          const w = new Path2D();
          w.moveTo(-0.2 * z, s * 0.1 * z);
          w.quadraticCurveTo(-0.3 * z, s * 0.6 * z, -0.7 * z, s * 0.55 * z);
          w.quadraticCurveTo(-0.5 * z, s * 0.42 * z, -0.45 * z, s * 0.48 * z);
          w.quadraticCurveTo(-0.3 * z, s * 0.38 * z, -0.2 * z, s * 0.44 * z);
          w.quadraticCurveTo(-0.05 * z, s * 0.3 * z, 0.15 * z, s * 0.2 * z);
          w.closePath();
          part(c, w, o.c2);
        }
        hull(c, circ(0, 0, 0.36 * z), z, o, d);
        for (const s of [-1, 1]) part(c, poly([[0.05, s * 0.3], [0.22, s * 0.48], [0.28, s * 0.25]], z), o.c1);
        eye(c, 0.14 * z, 0, 0.1 * z, 0.4);
        break;
      }
      case 2: { // Fish
        part(c, poly([[-0.4, 0], [-0.75, -0.35], [-0.65, 0], [-0.75, 0.35]], z), o.c2);
        for (const s of [-1, 1]) part(c, poly([[-0.05, s * 0.25], [-0.25, s * 0.5], [0.15, s * 0.3]], z), o.c2);
        hull(c, ell(0, 0, 0.5 * z, 0.3 * z), z, o, d);
        eye(c, 0.26 * z, -0.06 * z, 0.09 * z, 0.4);
        withWidth(c, Math.max(1, z * 0.04), () => { c.beginPath(); c.arc(0.05 * z, 0, 0.16 * z, -0.9, 0.9); c.stroke(); });
        break;
      }
      case 3: { // Star
        for (const s of [-1, 1]) part(c, poly([[-0.2, s * 0.2], [-0.62, s * 0.55], [-0.3, s * 0.12]], z), o.c2);
        const p = new Path2D();
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? 0.2 : 0.44;
          i ? p.lineTo(Math.cos(a) * rr * z, Math.sin(a) * rr * z) : p.moveTo(Math.cos(a) * rr * z, Math.sin(a) * rr * z);
        }
        p.closePath();
        hull(c, p, z, o, d);
        eye(c, 0.02 * z, 0, 0.1 * z, 0.4);
        break;
      }
      case 4: { // Heli
        const spin = Math.abs(Math.sin((o.t || 0) * 20));
        for (const s of [-1, 1]) {
          c.beginPath(); c.moveTo(0, s * 0.36 * z); c.lineTo(0, s * 0.5 * z); c.stroke();
          part(c, rect(-0.5 * z * spin - 0.04 * z, s * 0.5 * z - 0.04 * z, (1 * spin + 0.08) * z, 0.08 * z), o.c2);
        }
        part(c, rect(-0.75 * z, -0.06 * z, 0.4 * z, 0.12 * z), o.c1);
        part(c, poly([[-0.75, -0.06], [-0.85, -0.25], [-0.7, -0.06]], z), o.c2);
        hull(c, circ(0, 0, 0.36 * z), z, o, d);
        part(c, ell(0.14 * z, -0.04 * z, 0.14 * z, 0.11 * z), 'rgba(170,235,255,0.85)');
        break;
      }
      case 5: { // Bee
        for (const s of [-1, 1]) part(c, ell(-0.08 * z, s * 0.36 * z, 0.18 * z, 0.12 * z), 'rgba(220,245,255,0.6)');
        part(c, poly([[-0.45, -0.06], [-0.7, 0], [-0.45, 0.06]], z), '#222');
        const body = ell(0, 0, 0.48 * z, 0.3 * z);
        c.fillStyle = o.c1; c.fill(body);
        c.save(); c.clip(body); c.fillStyle = o.c2;
        for (let i = 0; i < 3; i++) c.fillRect((-0.4 + i * 0.22) * z, -0.4 * z, 0.1 * z, 0.8 * z);
        c.restore();
        decal(c, body, d, z, o);
        c.stroke(body);
        eye(c, 0.26 * z, -0.06 * z, 0.09 * z, 0.4);
        break;
      }
      default: { // Classic
        for (const s of [-1, 1]) {
          const f = new Path2D();
          f.moveTo(-z * 0.15, s * z * 0.22); f.quadraticCurveTo(-z * 0.5, s * z * 0.62, -z * 0.68, s * z * 0.5);
          f.lineTo(-z * 0.4, s * z * 0.28); f.lineTo(z * 0.08, s * z * 0.32); f.closePath();
          part(c, f, o.c2);
          part(c, poly([[0.05, s * 0.3], [0.3, s * 0.55], [0.32, s * 0.28]], z), o.c2);
        }
        part(c, poly([[-0.5, 0], [-0.72, -0.12], [-0.72, 0.12]], z), o.c1);
        hull(c, circ(0, 0, 0.4 * z), z, o, d);
        withWidth(c, Math.max(1, z * 0.05), () => { c.beginPath(); c.arc(0, 0, z * 0.3, 0, Math.PI * 2); c.stroke(); });
        part(c, circ(0.1 * z, 0, 0.18 * z), o.c2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(0.14 * z, 0, 0.08 * z, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0.11 * z, -0.04 * z, 0.03 * z, 0, Math.PI * 2); c.fill();
      }
    }
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.ellipse(-0.08 * z, -0.24 * z, 0.2 * z, 0.08 * z, 0, 0, Math.PI * 2); c.fill();
  }

  const DRAW = { cube, ship, ball, ufo, wave, robot, spider, swing };

  function draw(c, mode, z, o) {
    const v = Math.max(0, Math.min(COUNT + SPECIAL.length - 1, o.v | 0));
    if (v < COUNT) { DRAW[mode](c, z, o, v); return; }
    const sp = SPECIAL[v - COUNT];
    const o2 = Object.assign({}, o, {
      c1: sp.c1 || o.c1, c2: sp.c2 || (sp.neon ? o.c1 : o.c2), orig: o.orig || o, sp: sp.key,
    });
    const t = o.t || 0;
    c.save();
    if (sp.glow) { c.shadowColor = sp.glow; c.shadowBlur = z * 0.3; }
    if (sp.neon) { c.strokeStyle = o.c1; c.shadowColor = o.c1; c.shadowBlur = z * 0.35; }
    if (sp.alpha) c.globalAlpha *= sp.alpha + 0.12 * Math.sin(t * 4);
    if (sp.jitter && Math.floor(t * 8) % 7 === 0) c.translate(z * 0.06, 0);
    DRAW[mode](c, z, o2, v);
    c.restore();
    const hd = HEAD[mode];
    const X = hd[0] * z, Y = hd[1] * z, S = hd[2] * z;
    if (sp.over === 'halo') halo(c, X, Y, S, t);
    else if (sp.over === 'party') partyHat(c, X, Y, S, t);
    else if (sp.over && mode !== 'ship' && mode !== 'ufo') (sp.over === 'horns' ? horns : crown)(c, X, Y, S);
  }

  // Unlock order: every mode's second icon first, then every mode's third,
  // and so on, so early wins spread across all eight characters.
  const MODES = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider', 'swing'];
  const ORDER = [];
  for (let v = 1; v < COUNT; v++) for (const m of MODES) ORDER.push([m, v]);

  // Variant number of a special set for drawing: COUNT + its index.
  const SETS = SPECIAL.map((sp) => sp.key);
  const special = (key) => COUNT + SETS.indexOf(key);

  const setName = (key) => SPECIAL[SETS.indexOf(key)].name;

  root.GDIcons = { draw, COUNT, ORDER, name, MODES, SETS, special, setName, TOTAL: COUNT + SPECIAL.length };
})(typeof self !== 'undefined' ? self : this);
