/* Pool renderer: an English pub table on a canvas.
 *
 * The static table (wooden rails with sights, cushions with rounded
 * knuckles, pockets, cloth with texture and lamp light, baulk line, D and
 * black spot) is drawn once per resize into an offscreen canvas. Balls are
 * shaded per pixel into small sprites from their 3D orientation, so marks
 * on the surface roll with the ball while the lamp highlight stays put.
 * Portrait screens get the table rotated 90 degrees (baulk at the bottom).
 */
(function (root) {
  'use strict';
  var P = root.PoolPhysics;
  var L = P.L, W = P.W, R = P.R;
  var RAIL = 0.118;          // nose of the cushion to the outside of the wood
  var CUSH = 0.05;           // cushion depth
  var OUT_L = L + 2 * RAIL, OUT_W = W + 2 * RAIL;

  var CLOTHS = {
    green: { bed: '#1f7a45', light: '#2c9a5a', dark: '#11502b', cushion: '#1a6b3c', nose: 'rgba(160,240,190,0.25)' },
    blue: { bed: '#1f5f9a', light: '#2e7cc0', dark: '#123a63', cushion: '#1a5287', nose: 'rgba(170,215,255,0.25)' }
  };
  var BALL_RGB = {
    red: [206, 22, 34], yellow: [246, 190, 16], black: [22, 22, 24], cue: [246, 243, 232]
  };
  function ballColor(n) { return n === 0 ? BALL_RGB.cue : n === 8 ? BALL_RGB.black : n < 8 ? BALL_RGB.red : BALL_RGB.yellow; }

  // ------------------------------------------------------------ helpers
  function identity() { return new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1]); }
  /** Rotate orientation matrix M (body->world, row-major) by angular velocity w over dt. */
  function rotateBy(M, wx, wy, wz, dt) {
    var w = Math.sqrt(wx * wx + wy * wy + wz * wz);
    var th = w * dt;
    if (th < 1e-9) return false;
    var kx = wx / w, ky = wy / w, kz = wz / w;
    var c = Math.cos(th), s = Math.sin(th), t = 1 - c;
    var r00 = t * kx * kx + c, r01 = t * kx * ky - s * kz, r02 = t * kx * kz + s * ky;
    var r10 = t * kx * ky + s * kz, r11 = t * ky * ky + c, r12 = t * ky * kz - s * kx;
    var r20 = t * kx * kz - s * ky, r21 = t * ky * kz + s * kx, r22 = t * kz * kz + c;
    for (var col = 0; col < 3; col++) {
      var a = M[col], b = M[3 + col], d = M[6 + col];
      M[col] = r00 * a + r01 * b + r02 * d;
      M[3 + col] = r10 * a + r11 * b + r12 * d;
      M[6 + col] = r20 * a + r21 * b + r22 * d;
    }
    return true;
  }
  function orthonormalize(M) {
    // columns are the body axes in world space
    var ax = M[0], ay = M[3], az = M[6];
    var l = Math.sqrt(ax * ax + ay * ay + az * az); ax /= l; ay /= l; az /= l;
    var bx = M[1], by = M[4], bz = M[7];
    var d = ax * bx + ay * by + az * bz; bx -= d * ax; by -= d * ay; bz -= d * az;
    l = Math.sqrt(bx * bx + by * by + bz * bz); bx /= l; by /= l; bz /= l;
    M[0] = ax; M[3] = ay; M[6] = az; M[1] = bx; M[4] = by; M[7] = bz;
    M[2] = ay * bz - az * by; M[5] = az * bx - ax * bz; M[8] = ax * by - ay * bx;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // "8" glyph as an alpha map for the black's disc
  var GLYPH = null, GS = 64;
  function glyph() {
    if (GLYPH) return GLYPH;
    var c = document.createElement('canvas'); c.width = c.height = GS;
    var g = c.getContext('2d');
    g.fillStyle = '#000';
    g.font = 'bold 50px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('8', GS / 2, GS / 2 + 3);
    var d = g.getImageData(0, 0, GS, GS).data;
    GLYPH = new Float32Array(GS * GS);
    for (var i = 0; i < GS * GS; i++) GLYPH[i] = d[i * 4 + 3] / 255;
    return GLYPH;
  }

  // ------------------------------------------------------------ renderer
  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1; this.cssW = 1; this.cssH = 1;
    this.s = 100; this.ox = 0; this.oy = 0; this.rot = 0;
    this.cloth = 'green';
    this.tableCanvas = null;
    this.sprites = [];
    this.orient = [];
    this.spriteDirty = [];
    for (var i = 0; i < 16; i++) {
      this.orient.push(identity());
      this.sprites.push(null);
      this.spriteDirty.push(true);
    }
    this.randomizeOrientations(1);
  }

  Renderer.prototype.randomizeOrientations = function (seed) {
    var rnd = P.mulberry32(seed || 1);
    for (var i = 0; i < 16; i++) {
      var M = identity();
      rotateBy(M, rnd() - 0.5, rnd() - 0.5, rnd() - 0.5, 1 + rnd() * 5);
      // show the 8 / the logo dots from above-ish at the start
      if (i === 8) { M = identity(); rotateBy(M, 0, 1, 0, -Math.PI / 2 + 0.35); }
      this.orient[i] = M;
      this.spriteDirty[i] = true;
    }
  };

  /** Fit the table into the rectangle (x, y, w, h) in CSS px. */
  Renderer.prototype.setView = function (cssW, cssH, dpr, box, portrait) {
    this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.rot = portrait ? 1 : 0;
    var tw = portrait ? OUT_W : OUT_L, th = portrait ? OUT_L : OUT_W;
    var s = Math.min(box.w / tw, box.h / th);
    this.s = s;
    var w = tw * s, h = th * s;
    var x0 = box.x + (box.w - w) / 2, y0 = box.y + (box.h - h) / 2;
    this.rect = { x: x0, y: y0, w: w, h: h };
    if (!portrait) { this.ox = x0 + RAIL * s; this.oy = y0 + RAIL * s; }
    else { this.ox = x0 + RAIL * s; this.oy = y0 + RAIL * s; }
    this.buildTable();
    for (var i = 0; i < 16; i++) this.spriteDirty[i] = true;
    return this.rect;
  };

  Renderer.prototype.toScreen = function (x, y) {
    return this.rot ? [this.ox + y * this.s, this.oy + (L - x) * this.s] : [this.ox + x * this.s, this.oy + y * this.s];
  };
  Renderer.prototype.toWorld = function (px, py) {
    return this.rot ? [L - (py - this.oy) / this.s, (px - this.ox) / this.s] : [(px - this.ox) / this.s, (py - this.oy) / this.s];
  };
  /** World direction -> screen direction. */
  Renderer.prototype.dirToScreen = function (dx, dy) { return this.rot ? [dy, -dx] : [dx, dy]; };
  Renderer.prototype.dirToWorld = function (sx, sy) { return this.rot ? [-sy, sx] : [sx, sy]; };

  // world transform onto a context whose origin is at (offX, offY) CSS px
  Renderer.prototype.worldTransform = function (ctx, scale, offX, offY) {
    var s = this.s * scale;
    var ox = (this.ox - offX) * scale, oy = (this.oy - offY) * scale;
    if (this.rot) ctx.setTransform(0, -s, s, 0, ox, oy + L * s);
    else ctx.setTransform(s, 0, 0, s, ox, oy);
  };

  // ---------------------------------------------------------- the table
  Renderer.prototype.buildTable = function () {
    var dpr = this.dpr, rect = this.rect;
    var c = this.tableCanvas || document.createElement('canvas');
    var pad = 30;   // room for the drop shadow
    c.width = Math.max(1, Math.round((rect.w + pad * 2) * dpr));
    c.height = Math.max(1, Math.round((rect.h + pad * 2) * dpr));
    this.tableCanvas = c;
    this.tableOff = { x: rect.x - pad, y: rect.y - pad };
    var g = c.getContext('2d');
    var self = this, s = this.s;
    var cloth = CLOTHS[this.cloth] || CLOTHS.green;
    var px = 1 / s;   // one CSS pixel in world units
    var setW = function () { self.worldTransform(g, dpr, self.tableOff.x, self.tableOff.y); };
    var screenT = function () { g.setTransform(dpr, 0, 0, dpr, -self.tableOff.x * dpr, -self.tableOff.y * dpr); };
    g.clearRect(0, 0, c.width, c.height);

    // drop shadow under the whole table
    screenT();
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.65)';
    g.shadowBlur = 26 * dpr;
    g.shadowOffsetY = 10 * dpr;
    g.fillStyle = '#1a0d07';
    roundRect(g, rect.x + 4, rect.y + 4, rect.w - 8, rect.h - 8, Math.min(rect.w, rect.h) * 0.045);
    g.fill();
    g.restore();

    setW();
    // ---- wooden rail
    var rr = 0.055;
    roundRect(g, -RAIL, -RAIL, OUT_L, OUT_W, rr);
    var wood = g.createLinearGradient(0, -RAIL, 0, W + RAIL);
    wood.addColorStop(0, '#5a2d17'); wood.addColorStop(0.5, '#3d1d0e'); wood.addColorStop(1, '#2a1309');
    g.fillStyle = wood; g.fill();
    // grain: thin streaks along each rail
    g.save();
    roundRect(g, -RAIL, -RAIL, OUT_L, OUT_W, rr);
    g.clip();
    var rnd = P.mulberry32(77);
    g.lineWidth = px * 1.1;
    for (var k = 0; k < 140; k++) {
      var t = rnd(), a = 0.05 + rnd() * 0.09;
      g.strokeStyle = rnd() < 0.5 ? 'rgba(20,6,2,' + a + ')' : 'rgba(140,80,45,' + a * 0.8 + ')';
      var off = rnd() * (RAIL - 0.01);
      var wav = (rnd() - 0.5) * 0.01;
      g.beginPath();
      if (k % 2 === 0) {     // long rails
        var yy = k % 4 === 0 ? -RAIL + off : W + off;
        g.moveTo(-RAIL, yy); g.bezierCurveTo(L * 0.3, yy + wav, L * 0.7, yy - wav, L + RAIL, yy + wav * 0.5);
      } else {
        var xx = k % 4 === 1 ? -RAIL + off : L + off;
        g.moveTo(xx, -RAIL); g.bezierCurveTo(xx + wav, W * 0.3, xx - wav, W * 0.7, xx + wav * 0.5, W + RAIL);
      }
      g.stroke();
      void t;
    }
    g.restore();
    // lacquer: soft highlight on the top edge and a bevel line
    roundRect(g, -RAIL + 0.004, -RAIL + 0.004, OUT_L - 0.008, OUT_W - 0.008, rr - 0.004);
    g.lineWidth = px * 1.5; g.strokeStyle = 'rgba(255,210,170,0.18)'; g.stroke();
    roundRect(g, -RAIL, -RAIL, OUT_L, OUT_W, rr);
    g.lineWidth = px * 1.2; g.strokeStyle = 'rgba(0,0,0,0.6)'; g.stroke();
    // inner bevel where wood meets cushion
    g.beginPath(); g.rect(-CUSH - 0.008, -CUSH - 0.008, L + 2 * CUSH + 0.016, W + 2 * CUSH + 0.016);
    g.lineWidth = 0.008; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.stroke();

    // ---- sights (pearl diamonds) on the rails
    var sightR = 0.0085, mid = -CUSH - (RAIL - CUSH) / 2;
    var sights = [];
    for (var i = 1; i < 8; i++) { if (i === 4) continue; sights.push([L * i / 8, mid]); sights.push([L * i / 8, W - mid]); }
    for (var j = 1; j < 4; j++) { sights.push([mid, W * j / 4]); sights.push([L - mid, W * j / 4]); }
    sights.forEach(function (p) {
      g.save(); g.translate(p[0], p[1]); g.rotate(Math.PI / 4);
      var sg = g.createLinearGradient(-sightR, -sightR, sightR, sightR);
      sg.addColorStop(0, '#fffaf0'); sg.addColorStop(0.5, '#d9d2c4'); sg.addColorStop(1, '#a89f90');
      g.fillStyle = sg; g.fillRect(-sightR * 0.7, -sightR * 0.7, sightR * 1.4, sightR * 1.4);
      g.restore();
    });

    // ---- pocket surrounds: dark leather cups cut into the wood
    P.POCKETS.forEach(function (p) {
      var h = visualHole(p), rr2 = h.r + 0.016;
      g.beginPath(); g.arc(h.x, h.y, rr2 + 0.003, 0, Math.PI * 2);
      g.fillStyle = 'rgba(0,0,0,0.55)'; g.fill();
      g.beginPath(); g.arc(h.x, h.y, rr2, 0, Math.PI * 2);
      var cup = g.createRadialGradient(h.x - 0.012, h.y - 0.014, 0.004, h.x, h.y, rr2);
      cup.addColorStop(0, '#3a3634'); cup.addColorStop(0.7, '#1a1716'); cup.addColorStop(1, '#0d0b0a');
      g.fillStyle = cup; g.fill();
      g.lineWidth = px * 1.2; g.strokeStyle = 'rgba(255,235,210,0.14)'; g.stroke();
    });

    // ---- cushion ring background (under the cushions, only visible in the pocket throats)
    // ---- bed
    g.save();
    g.beginPath(); g.rect(0, 0, L, W);
    g.fillStyle = cloth.bed; g.fill();
    var lamp = g.createRadialGradient(L / 2, W / 2, 0.05, L / 2, W / 2, L * 0.62);
    lamp.addColorStop(0, cloth.light); lamp.addColorStop(0.55, cloth.bed); lamp.addColorStop(1, cloth.dark);
    g.fillStyle = lamp; g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1;
    // cloth texture in screen pixels
    g.clip();
    screenT();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = clothPattern(g);
    g.globalAlpha = 0.5;
    g.fillRect(0, 0, c.width, c.height);
    g.globalAlpha = 1;
    g.restore();
    setW();

    // ---- markings: baulk line, D, black spot
    g.strokeStyle = 'rgba(255,255,255,0.32)';
    g.lineWidth = Math.max(px * 1.2, 0.002);
    g.beginPath(); g.moveTo(P.BAULK_X, 0); g.lineTo(P.BAULK_X, W); g.stroke();
    g.beginPath(); g.arc(P.BAULK_X, W / 2, W / 6, Math.PI / 2, Math.PI * 1.5); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath(); g.arc(P.BLACK_SPOT_X, W / 2, 0.0045, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(P.CENTER_X, W / 2, 0.0028, 0, Math.PI * 2); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fill();

    // ---- pocket holes and throats
    g.save();
    g.beginPath(); g.rect(-CUSH - 0.006, -CUSH - 0.006, L + 2 * CUSH + 0.012, W + 2 * CUSH + 0.012);
    P.POCKETS.forEach(function (p) { var h = visualHole(p); g.moveTo(h.x + h.r, h.y); g.arc(h.x, h.y, h.r, 0, Math.PI * 2); });
    g.clip('nonzero');
    P.POCKETS.forEach(function (p) {
      var k0 = p.knuckles[0], k1 = p.knuckles[1];
      // throat: from the knuckles' noses back to the hole's widest point
      var ux = p.ux, uy = p.uy, sx = -uy, sy = ux;
      var hole0 = visualHole(p);
      var a0x = k0.x - ux * k0.r * 1.05, a0y = k0.y - uy * k0.r * 1.05;
      var a1x = k1.x - ux * k1.r * 1.05, a1y = k1.y - uy * k1.r * 1.05;
      var side0 = (a0x - hole0.x) * sx + (a0y - hole0.y) * sy > 0 ? 1 : -1;
      g.beginPath();
      g.moveTo(a0x, a0y); g.lineTo(a1x, a1y);
      g.lineTo(hole0.x - side0 * sx * hole0.r, hole0.y - side0 * sy * hole0.r);
      g.lineTo(hole0.x + side0 * sx * hole0.r, hole0.y + side0 * sy * hole0.r);
      g.closePath();
      var tg = g.createLinearGradient(p.mx - ux * 0.012, p.my - uy * 0.012, hole0.x, hole0.y);
      tg.addColorStop(0, 'rgba(6,6,6,0)'); tg.addColorStop(0.45, 'rgba(6,6,6,0.75)'); tg.addColorStop(1, '#050505');
      g.fillStyle = tg; g.fill();
      var hole = visualHole(p);
      g.beginPath(); g.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
      var hg = g.createRadialGradient(hole.x + ux * 0.012, hole.y + uy * 0.012, 0.002, hole.x, hole.y, hole.r);
      hg.addColorStop(0, '#000'); hg.addColorStop(0.72, '#050505'); hg.addColorStop(1, '#191919');
      g.fillStyle = hg; g.fill();
    });
    g.restore();

    // ---- cushions with rounded knuckles
    P.TABLE.segs.forEach(function (sg) {
      var ax = sg.ax, ay = sg.ay, tx = sg.tx, ty = sg.ty, nx = sg.nx, ny = sg.ny, len = sg.len;
      var kA = nearestKnuckle(ax, ay, nx, ny), kB = nearestKnuckle(sg.bx, sg.by, nx, ny);
      var rA = kA ? kA.r : 0.02, rB = kB ? kB.r : 0.02;
      var pts = [];
      var at = function (u, v) { return [ax + tx * u - nx * v, ay + ty * u - ny * v]; };
      pts.push(at(0, 0)); pts.push(at(len, 0));
      for (var q = 1; q <= 10; q++) {     // knuckle at B end, nose round towards the pocket
        var th = (q / 10) * Math.PI / 2;
        pts.push(at(len + Math.sin(th) * rB, rB - Math.cos(th) * rB));
      }
      pts.push(at(len + rB, CUSH + 0.01)); pts.push(at(-rA, CUSH + 0.01));
      for (var q2 = 0; q2 < 10; q2++) {
        var th2 = Math.PI / 2 - (q2 / 10) * Math.PI / 2;
        pts.push(at(-Math.sin(th2) * rA, rA - Math.cos(th2) * rA));
      }
      g.save();
      g.beginPath(); g.rect(-CUSH - 0.006, -CUSH - 0.006, L + 2 * CUSH + 0.012, W + 2 * CUSH + 0.012); g.clip();
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var m = 1; m < pts.length; m++) g.lineTo(pts[m][0], pts[m][1]);
      g.closePath();
      var cg = g.createLinearGradient(ax, ay, ax - nx * CUSH, ay - ny * CUSH);
      cg.addColorStop(0, cloth.cushion); cg.addColorStop(0.45, shade(cloth.cushion, -0.12)); cg.addColorStop(1, shade(cloth.cushion, -0.32));
      g.fillStyle = cg; g.fill();
      g.lineWidth = px; g.strokeStyle = 'rgba(0,0,0,0.25)'; g.stroke();
      // nose highlight
      g.beginPath();
      var n0 = at(0, 0.002), n1 = at(len, 0.002);
      g.moveTo(n0[0], n0[1]); g.lineTo(n1[0], n1[1]);
      g.strokeStyle = cloth.nose; g.lineWidth = Math.max(px * 1.4, 0.0025); g.stroke();
      g.restore();
    });
    // inner shadow along the cushion noses onto the bed
    g.save();
    g.beginPath(); g.rect(0, 0, L, W); g.clip();
    var sh = 0.016;
    [[0, 0, 0, sh, L, sh], [0, W, 0, W - sh, L, sh], [0, 0, sh, 0, sh, W], [L, 0, L - sh, 0, sh, W]].forEach(function (e, idx) {
      var gr = g.createLinearGradient(e[0], e[1], e[2], e[3]);
      gr.addColorStop(0, 'rgba(0,0,0,0.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      if (idx < 2) g.fillRect(0, idx === 0 ? 0 : W - sh, L, sh);
      else g.fillRect(idx === 2 ? 0 : L - sh, 0, sh, W);
    });
    g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0);
  };

  /** Where the pocket hole is drawn (the middle pockets sit a little further
   *  in than the physics drop circle so they stay inside the rail). */
  function visualHole(p) {
    if (!p.side) return { x: p.x, y: p.y, r: p.r + 0.004 };
    var d = 0.05;
    return { x: p.mx + p.ux * (d - P.TABLE.knuckles[2].r), y: p.my + p.uy * (d - P.TABLE.knuckles[2].r), r: 0.05 };
  }

  function nearestKnuckle(x, y, nx, ny) {
    var best = null, bd = 1;
    P.TABLE.knuckles.forEach(function (k) {
      var d = Math.hypot(k.x - (x - nx * k.r), k.y - (y - ny * k.r));
      if (d < bd) { bd = d; best = k; }
    });
    return bd < 0.01 ? best : null;
  }

  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    var m = f < 0 ? 1 + f : 1;
    var add = f > 0 ? f * 255 : 0;
    return 'rgb(' + Math.round(Math.min(255, r * m + add)) + ',' + Math.round(Math.min(255, g * m + add)) + ',' + Math.round(Math.min(255, b * m + add)) + ')';
  }

  var PATTERN_CANVAS = null;
  function clothPattern(g) {
    if (!PATTERN_CANVAS) {
      var c = document.createElement('canvas'); c.width = c.height = 96;
      var x = c.getContext('2d');
      var img = x.createImageData(96, 96), d = img.data, rnd = P.mulberry32(5);
      for (var i = 0; i < 96 * 96; i++) {
        var v = rnd();
        var light = v > 0.5;
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = light ? 255 : 0;
        d[i * 4 + 3] = Math.floor(Math.abs(v - 0.5) * 2 * (light ? 22 : 30));
      }
      x.putImageData(img, 0, 0);
      PATTERN_CANVAS = c;
    }
    return g.createPattern(PATTERN_CANVAS, 'repeat');
  }

  // ------------------------------------------------------------ balls
  var LIGHT = (function () { var x = -0.42, y = -0.55, z = 0.72, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();
  var HALF = (function () { var x = LIGHT[0], y = LIGHT[1], z = LIGHT[2] + 1, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();
  var COS_DISC = Math.cos(27 * Math.PI / 180), SIN_DISC = Math.sin(27 * Math.PI / 180);
  var COS_DOT = Math.cos(8 * Math.PI / 180);
  var COS_MARK = Math.cos(11 * Math.PI / 180);

  Renderer.prototype.ballSprite = function (n) {
    var size = Math.max(4, Math.ceil(2 * R * this.s * this.dpr) + 2);
    var sp = this.sprites[n];
    if (!sp || sp.size !== size) {
      var c = document.createElement('canvas'); c.width = c.height = size;
      var ctx = c.getContext('2d');
      sp = { canvas: c, ctx: ctx, img: ctx.createImageData(size, size), size: size };
      this.sprites[n] = sp;
      this.spriteDirty[n] = true;
    }
    if (!this.spriteDirty[n]) return sp;
    this.spriteDirty[n] = false;
    var M = this.orient[n], rot = this.rot;
    var data = sp.img.data, half = size / 2, rad = half - 1;
    var base = ballColor(n);
    var gl = n === 8 ? glyph() : null;
    var Lx = LIGHT[0], Ly = LIGHT[1], Lz = LIGHT[2], Hx = HALF[0], Hy = HALF[1], Hz = HALF[2];
    for (var py = 0; py < size; py++) {
      var v = (py + 0.5 - half) / rad;
      for (var px = 0; px < size; px++) {
        var u = (px + 0.5 - half) / rad;
        var d2 = u * u + v * v;
        var o = (py * size + px) * 4;
        var dist = Math.sqrt(d2);
        var alpha = (1 - dist) * rad + 0.5;
        if (alpha <= 0) { data[o + 3] = 0; continue; }
        if (alpha > 1) alpha = 1;
        var z = d2 < 1 ? Math.sqrt(1 - d2) : 0;
        // screen normal -> world -> body
        var wx = rot ? -v : u, wy = rot ? u : v, wz = z;
        var bx = M[0] * wx + M[3] * wy + M[6] * wz;
        var by = M[1] * wx + M[4] * wy + M[7] * wz;
        var bz = M[2] * wx + M[5] * wy + M[8] * wz;
        var r = base[0], g = base[1], b = base[2];
        if (n === 0) {
          // red dots on six axes so spin is visible
          var ax = bx < 0 ? -bx : bx, ay = by < 0 ? -by : by, az = bz < 0 ? -bz : bz;
          var m = ax > ay ? (ax > az ? ax : az) : (ay > az ? ay : az);
          if (m > COS_DOT) { var f = Math.min(1, (m - COS_DOT) * 900); r = r + (196 - r) * f; g = g + (28 - g) * f; b = b + (36 - b) * f; }
        } else if (n === 8) {
          var axb = bx < 0 ? -bx : bx;
          if (axb > COS_DISC - 0.01) {
            var fd = Math.min(1, (axb - COS_DISC + 0.01) * 120);
            var tu = (bx < 0 ? -by : by) / SIN_DISC, tv = -bz / SIN_DISC;
            var gx = Math.floor((tu * 0.5 + 0.5) * GS), gy = Math.floor((tv * 0.5 + 0.5) * GS);
            var ink = gx >= 0 && gx < GS && gy >= 0 && gy < GS ? gl[gy * GS + gx] : 0;
            var wr = 248 - ink * 236, wg = 246 - ink * 234, wb = 240 - ink * 228;
            r = r + (wr - r) * fd; g = g + (wg - g) * fd; b = b + (wb - b) * fd;
          }
        } else {
          // a faint maker's mark on two poles: just enough to read the roll
          var axm = bx < 0 ? -bx : bx;
          if (axm > COS_MARK) { var fm = Math.min(1, (axm - COS_MARK) * 400) * 0.32; r += (255 - r) * fm; g += (255 - g) * fm; b += (255 - b) * fm; }
          var ring = bz < 0 ? -bz : bz;
          if (ring < 0.035) { var fr = (1 - ring / 0.035) * 0.08; r *= 1 - fr; g *= 1 - fr; b *= 1 - fr; }
        }
        // lighting
        var diff = u * Lx + v * Ly + z * Lz; if (diff < 0) diff = 0;
        var spec = u * Hx + v * Hy + z * Hz; spec = spec > 0 ? Math.pow(spec, 60) : 0;
        var soft = u * Hx + v * Hy + z * Hz; soft = soft > 0 ? Math.pow(soft, 8) * 0.12 : 0;
        var amb = 0.3 + 0.12 * z;
        var lit = amb + 0.82 * diff;
        // cloth bounce light from below
        var bounce = (v > 0 ? v : 0) * (1 - z) * 0.18;
        var sr = r * lit + (spec * 1.05 + soft) * 255 + bounce * 30;
        var sg = g * lit + (spec * 1.05 + soft) * 255 + bounce * 120;
        var sb = b * lit + (spec * 1.05 + soft) * 255 + bounce * 60;
        // rim darkening
        var rim = 1 - Math.pow(1 - z, 3) * 0.45;
        data[o] = sr * rim > 255 ? 255 : sr * rim;
        data[o + 1] = sg * rim > 255 ? 255 : sg * rim;
        data[o + 2] = sb * rim > 255 ? 255 : sb * rim;
        data[o + 3] = alpha * 255;
      }
    }
    sp.ctx.putImageData(sp.img, 0, 0);
    return sp;
  };

  Renderer.prototype.rollBalls = function (sim, dt) {
    for (var i = 0; i < 16; i++) {
      if (!sim.on[i]) continue;
      if (rotateBy(this.orient[i], sim.wx[i], sim.wy[i], sim.wz[i], dt)) {
        this.spriteDirty[i] = true;
        if (Math.random() < 0.02) orthonormalize(this.orient[i]);
      }
    }
  };

  // --------------------------------------------------------- the frame
  /**
   * scene = { sim, sinking: [{n, x, y, tx, ty, t}], cue: {dx, dy, pull, alpha, ...},
   *   guide: predictAim result + {len, bad}, bih: {x, y, ok, baulk}, call: pocket,
   *   callAuto: bool, hidden: set of balls not to draw, ghostCue }
   */
  Renderer.prototype.draw = function (scene) {
    var ctx = this.ctx, dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // backdrop
    var bg = ctx.createRadialGradient(this.cssW / 2, this.cssH * 0.45, 10, this.cssW / 2, this.cssH / 2, Math.max(this.cssW, this.cssH) * 0.75);
    bg.addColorStop(0, '#1c2a24'); bg.addColorStop(1, '#070b0a');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, this.cssW, this.cssH);
    if (this.tableCanvas) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(this.tableCanvas, Math.round(this.tableOff.x * dpr), Math.round(this.tableOff.y * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (!scene) return;
    var sim = scene.sim, s = this.s, self = this;
    var rpx = R * s;

    // baulk highlight when the cue ball must be placed behind the line
    if (scene.bih && scene.bih.baulk) {
      this.worldTransform(ctx, dpr, 0, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, 0, P.BAULK_X, W);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // called pocket
    if (scene.call >= 0) this.drawCall(scene.call, scene.callAuto);

    // shadows
    for (var i = 0; i < 16; i++) {
      if (!sim.on[i] || (scene.hidden && scene.hidden[i])) continue;
      var p = this.toScreen(sim.x[i], sim.y[i]);
      this.drawShadow(ctx, p[0], p[1], rpx, 1);
    }
    // sinking balls (below the cushion level visually)
    if (scene.sinking) scene.sinking.forEach(function (k) {
      var f = Math.min(1, k.t / 0.32);
      var x = k.x + (k.tx - k.x) * f, y = k.y + (k.ty - k.y) * f;
      var q = self.toScreen(x, y);
      var sp = self.ballSprite(k.n);
      var sz = rpx * 2 * (1 - 0.35 * f);
      ctx.globalAlpha = 1 - f * 0.85;
      ctx.drawImage(sp.canvas, q[0] - sz / 2, q[1] - sz / 2, sz, sz);
      ctx.globalAlpha = 1;
    });

    // guide under the balls
    if (scene.guide) this.drawGuide(scene);

    // balls
    for (var j = 0; j < 16; j++) {
      if (!sim.on[j] || (scene.hidden && scene.hidden[j])) continue;
      var b = this.toScreen(sim.x[j], sim.y[j]);
      var spr = this.ballSprite(j);
      var size = spr.size / dpr;
      ctx.drawImage(spr.canvas, b[0] - size / 2, b[1] - size / 2, size, size);
    }

    if (scene.bih) this.drawInHand(scene.bih, sim);
    if (scene.cue) this.drawCue(scene.cue, sim);
  };

  Renderer.prototype.drawShadow = function (ctx, x, y, r, a) {
    var ox = r * 0.32, oy = r * 0.42;
    var g = ctx.createRadialGradient(x + ox, y + oy, r * 0.2, x + ox, y + oy, r * 1.35);
    g.addColorStop(0, 'rgba(0,0,0,' + 0.5 * a + ')');
    g.addColorStop(0.6, 'rgba(0,0,0,' + 0.22 * a + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x + ox, y + oy, r * 1.35, 0, Math.PI * 2); ctx.fill();
  };

  Renderer.prototype.drawCall = function (q, auto) {
    var ctx = this.ctx, p = P.POCKETS[q];
    var c = this.toScreen(p.mx + p.ux * 0.01, p.my + p.uy * 0.01);
    var r = R * this.s * 1.25;
    var t = (performance.now() % 1400) / 1400;
    ctx.save();
    ctx.strokeStyle = auto ? 'rgba(255,255,255,0.55)' : 'rgba(255,214,90,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash(auto ? [4, 4] : []);
    ctx.beginPath(); ctx.arc(c[0], c[1], r * (1 + 0.12 * Math.sin(t * Math.PI * 2)), 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    var lp = this.toScreen(p.mx - p.ux * 0.09, p.my - p.uy * 0.09);
    ctx.beginPath(); ctx.arc(lp[0], lp[1], r * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(r * 0.7) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('8', lp[0], lp[1] + 0.5);
    ctx.restore();
  };

  Renderer.prototype.drawGuide = function (scene) {
    var ctx = this.ctx, g = scene.guide, sim = scene.sim, s = this.s;
    var o = this.toScreen(sim.x[0], sim.y[0]);
    var self = this;
    var line = function (ax, ay, bx, by, w, col, dash) {
      var a = self.toScreen(ax, ay), b = self.toScreen(bx, by);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.setLineDash(dash || []);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    };
    ctx.save();
    ctx.lineCap = 'round';
    var bad = g.bad;
    var col = bad ? 'rgba(255,90,80,0.85)' : 'rgba(255,255,255,0.85)';
    if (g.type === 'ball') {
      var len = g.len || {};
      line(sim.x[0], sim.y[0], g.gx, g.gy, 1.6, 'rgba(255,255,255,0.7)');
      var gs = this.toScreen(g.gx, g.gy);
      ctx.setLineDash([]);
      ctx.strokeStyle = col; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(gs[0], gs[1], R * s, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = bad ? 'rgba(255,80,70,0.15)' : 'rgba(255,255,255,0.12)'; ctx.fill();
      if (bad) {
        var k = R * s * 0.45;
        ctx.beginPath(); ctx.moveTo(gs[0] - k, gs[1] - k); ctx.lineTo(gs[0] + k, gs[1] + k);
        ctx.moveTo(gs[0] + k, gs[1] - k); ctx.lineTo(gs[0] - k, gs[1] + k); ctx.stroke();
      } else {
        var ox = sim.x[g.ball], oy = sim.y[g.ball];
        var ol = Math.min(g.objLen, len.obj || 0.3);
        if (ol > 0.002) line(ox, oy, ox + g.nx * ol, oy + g.ny * ol, 2.2, 'rgba(255,255,255,0.9)');
        var cl = Math.min(g.cueLen, len.cue || 0.12) * Math.min(1, Math.sqrt(Math.max(0, 1 - g.cut * g.cut)) * 1.6);
        if (cl > 0.004 && (g.tx || g.ty)) line(g.gx, g.gy, g.gx + g.tx * cl, g.gy + g.ty * cl, 1.4, 'rgba(255,255,255,0.45)', [4, 4]);
      }
    } else {
      line(sim.x[0], sim.y[0], g.hx, g.hy, 1.6, 'rgba(255,255,255,0.7)');
      var hs = this.toScreen(g.hx, g.hy);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.4; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(hs[0], hs[1], R * s, 0, Math.PI * 2); ctx.stroke();
      if (g.len && g.len.bounce && g.pocket < 0) {
        var bl = Math.min(g.afterLen, g.len.bounce);
        if (bl > 0.01) line(g.hx, g.hy, g.hx + g.rx * bl, g.hy + g.ry * bl, 1.2, 'rgba(255,255,255,0.4)', [4, 5]);
      }
    }
    ctx.restore();
    void o;
  };

  Renderer.prototype.drawInHand = function (h, sim) {
    var ctx = this.ctx;
    var c = this.toScreen(sim.x[0], sim.y[0]);
    var r = R * this.s;
    var t = performance.now() / 1000;
    ctx.save();
    ctx.strokeStyle = h.ok ? 'rgba(255,255,255,0.8)' : 'rgba(255,80,70,0.95)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.lineDashOffset = -t * 12;
    ctx.beginPath(); ctx.arc(c[0], c[1], r * 1.7, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    if (h.dragging) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath(); ctx.arc(c[0], c[1], r * 1.7, 0, Math.PI * 2); ctx.fill();
    } else if (h.hint) {
      // a small hand/move icon above the ball
      var hy = c[1] - r * 2.9, hx = c[0];
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.arc(hx, hy, r * 0.95, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
      var a = r * 0.55;
      ctx.beginPath();
      ctx.moveTo(hx - a, hy); ctx.lineTo(hx + a, hy); ctx.moveTo(hx, hy - a); ctx.lineTo(hx, hy + a);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        ctx.moveTo(hx + d[0] * a, hy + d[1] * a);
        ctx.lineTo(hx + d[0] * a * 0.6 + d[1] * a * 0.3, hy + d[1] * a * 0.6 + d[0] * a * 0.3);
        ctx.moveTo(hx + d[0] * a, hy + d[1] * a);
        ctx.lineTo(hx + d[0] * a * 0.6 - d[1] * a * 0.3, hy + d[1] * a * 0.6 - d[0] * a * 0.3);
      });
      ctx.stroke();
    }
    ctx.restore();
  };

  /** cue = {dx, dy (world, from cue ball towards the shot), pull (m), alpha} */
  Renderer.prototype.drawCue = function (cue, sim) {
    if (!sim.on[0] || cue.alpha <= 0) return;
    var ctx = this.ctx, s = this.s;
    var c = this.toScreen(sim.x[0], sim.y[0]);
    var d = this.dirToScreen(cue.dx, cue.dy);
    var ang = Math.atan2(d[1], d[0]);
    var gap = (R + 0.006 + cue.pull) * s;
    var len = 1.45 * s;
    ctx.save();
    var rc = this.cueClip || this.rect;
    ctx.beginPath(); ctx.rect(rc.x, rc.y, rc.w, rc.h); ctx.clip();
    ctx.globalAlpha = cue.alpha;
    // shadow
    ctx.save();
    ctx.translate(c[0] + R * s * 0.6, c[1] + R * s * 0.9);
    ctx.rotate(ang + Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.moveTo(gap, -0.0055 * s); ctx.lineTo(gap + len, -0.0145 * s); ctx.lineTo(gap + len, 0.0145 * s); ctx.lineTo(gap, 0.0055 * s);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // stick, drawn along +x from the tip
    ctx.translate(c[0], c[1]);
    ctx.rotate(ang + Math.PI);
    var tipR = 0.0058 * s, buttR = 0.0148 * s;
    var rAt = function (f) { return tipR + (buttR - tipR) * f; };
    var seg = function (f0, f1, fill) {
      ctx.beginPath();
      ctx.moveTo(gap + len * f0, -rAt(f0)); ctx.lineTo(gap + len * f1, -rAt(f1));
      ctx.lineTo(gap + len * f1, rAt(f1)); ctx.lineTo(gap + len * f0, rAt(f0));
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    };
    var grad = function (c0, c1, c2) {
      var g = ctx.createLinearGradient(0, -buttR, 0, buttR);
      g.addColorStop(0, c0); g.addColorStop(0.45, c1); g.addColorStop(1, c2);
      return g;
    };
    seg(0, 0.008, grad('#6aa6ff', '#2f6fd6', '#1c3f80'));            // chalked tip
    seg(0.008, 0.025, grad('#ffffff', '#efe9dc', '#b9b2a2'));        // ferrule
    seg(0.025, 0.56, grad('#fbe7bf', '#e2c48c', '#a98650'));          // maple shaft
    seg(0.56, 0.575, grad('#f2f4f6', '#a9b0b7', '#5d646b'));          // joint
    seg(0.575, 0.78, grad('#7a3b1c', '#4d220f', '#2a1206'));          // forearm
    // decorative points
    ctx.fillStyle = 'rgba(240,220,170,0.75)';
    for (var k = 0; k < 2; k++) {
      ctx.beginPath();
      var base = gap + len * 0.6, tip = gap + len * (0.72 - k * 0.03);
      var yy = k ? -1 : 1;
      ctx.moveTo(base, yy * rAt(0.6) * 0.15); ctx.lineTo(tip, 0); ctx.lineTo(base, yy * rAt(0.6) * 0.75);
      ctx.closePath(); ctx.fill();
    }
    seg(0.78, 0.92, grad('#3b3b3b', '#151515', '#050505'));           // wrap
    seg(0.92, 0.985, grad('#7a3b1c', '#4d220f', '#2a1206'));          // butt
    seg(0.985, 1.0, grad('#333', '#111', '#000'));                    // bumper
    // wrap texture
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (var w = 0.79; w < 0.92; w += 0.006) {
      ctx.beginPath(); ctx.moveTo(gap + len * w, -rAt(w)); ctx.lineTo(gap + len * (w + 0.004), rAt(w)); ctx.stroke();
    }
    // a long specular streak
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(gap + len * 0.03, -rAt(0.3) * 0.55, len * 0.9, Math.max(1, rAt(0.3) * 0.22));
    ctx.restore();
  };

  /** Draw a spin selector (cue ball face with the tip contact) into a canvas. */
  function drawSpinFace(canvas, sx, sy, dpr) {
    var size = canvas.width, g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, size, size);
    var c = size / 2, r = size / 2 - 2 * dpr;
    var grd = g.createRadialGradient(c - r * 0.35, c - r * 0.4, r * 0.1, c, c, r);
    grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.7, '#e9e5da'); grd.addColorStop(1, '#a9a597');
    g.fillStyle = grd; g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = dpr;
    g.beginPath(); g.moveTo(c - r, c); g.lineTo(c + r, c); g.moveTo(c, c - r); g.lineTo(c, c + r); g.stroke();
    g.beginPath(); g.arc(c, c, r * 0.5, 0, Math.PI * 2); g.stroke();
    var tx = c + sx * r * 0.82, ty = c - sy * r * 0.82;
    g.fillStyle = '#d4202c'; g.strokeStyle = '#fff'; g.lineWidth = 2 * dpr;
    g.beginPath(); g.arc(tx, ty, Math.max(3 * dpr, r * 0.16), 0, Math.PI * 2); g.fill(); g.stroke();
  }

  root.PoolRender = {
    Renderer: Renderer, RAIL: RAIL, OUT_L: OUT_L, OUT_W: OUT_W, CLOTHS: CLOTHS,
    drawSpinFace: drawSpinFace, visualHole: visualHole, ballColor: ballColor, identity: identity, rotateBy: rotateBy
  };
})(typeof window !== 'undefined' ? window : globalThis);
