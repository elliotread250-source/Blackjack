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

  function split(mode, v) {
    const n = SHAPES[mode];
    return { shape: v % n, decal: Math.floor(v / n) % (mode === 'cube' ? 3 : 4) };
  }
  function name(mode, v) {
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
    }
    c.restore();
  }

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
    switch (shape) {
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

  function rider(c, z, o, x, y, scale) {
    c.save(); c.translate(x * z, y * z); cube(c, z * scale, o, o.cube || 0); c.restore();
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
    const v = Math.max(0, Math.min(COUNT - 1, o.v | 0));
    if (mode === 'cube') cube(c, z, o, v);
    else DRAW[mode](c, z, o, v);
  }

  // Unlock order: every mode's second icon first, then every mode's third,
  // and so on, so early wins spread across all eight characters.
  const MODES = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider', 'swing'];
  const ORDER = [];
  for (let v = 1; v < COUNT; v++) for (const m of MODES) ORDER.push([m, v]);

  root.GDIcons = { draw, COUNT, ORDER, name, MODES };
})(typeof self !== 'undefined' ? self : this);
