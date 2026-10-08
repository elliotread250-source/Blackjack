/* Canvas drawing: checkerboard, apples, the snake as a smooth tapered tube,
   eyes, particles. Everything below is in cell units (1 = one grid cell)
   except where the transform is reset to device pixels. */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var LIGHT = '#aad751';
  var DARK = '#a2d149';
  var STEP = 0.1;      // sample spacing along the snake, in cells
  var BODY_R = 0.4;    // body radius, in cells
  var OUTLINE = 0.05;  // darker rim around the body

  var SKINS = {
    blue:   { body: '#4e7cf6', edge: '#2f5bd3', hi: '#9db9ff' },
    purple: { body: '#9061f0', edge: '#6c3fd0', hi: '#c6aaff' },
    pink:   { body: '#ec5f9e', edge: '#c63f7c', hi: '#ffb0d2' },
    orange: { body: '#f2892c', edge: '#cf6610', hi: '#ffc58f' },
    black:  { body: '#3a4250', edge: '#20262f', hi: '#8792a6' }
  };

  function mix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    var g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    var bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function paleSkin(s) {
    return { body: mix(s.body, '#ffffff', 0.62), edge: mix(s.edge, '#ffffff', 0.5), hi: '#ffffff' };
  }

  function easeOutBack(p) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var c1 = 1.70158, c3 = c1 + 1, q = p - 1;
    return 1 + c3 * q * q * q + c1 * q * q;
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.bg = document.createElement('canvas');
    this.apple = document.createElement('canvas');
    this.cols = 0;
    this.rows = 0;
    this.k = 1;
    this.dpr = 1;
    this.xs = [];
    this.ys = [];
    this.ss = [];
    this.rad = [];
    this.pts = [];
  }

  /* k = device pixels per cell (an integer, so the checkerboard is crisp). */
  Renderer.prototype.resize = function (cols, rows, k, dpr) {
    var same = cols === this.cols && rows === this.rows && k === this.k && dpr === this.dpr;
    this.cols = cols;
    this.rows = rows;
    this.k = k;
    this.dpr = dpr;
    var w = cols * k, h = rows * k;
    this.canvas.style.width = (w / dpr) + 'px';
    this.canvas.style.height = (h / dpr) + 'px';
    if (same && this.canvas.width === w && this.canvas.height === h) return;
    this.canvas.width = w;
    this.canvas.height = h;
    this.buildBoard();
    this.buildApple();
  };

  Renderer.prototype.buildBoard = function () {
    var k = this.k, c = this.cols, r = this.rows;
    var b = this.bg;
    b.width = c * k;
    b.height = r * k;
    var g = b.getContext('2d');
    g.fillStyle = LIGHT;
    g.fillRect(0, 0, b.width, b.height);
    g.fillStyle = DARK;
    for (var y = 0; y < r; y++) {
      for (var x = 0; x < c; x++) {
        if ((x + y) & 1) g.fillRect(x * k, y * k, k, k);
      }
    }
    // A whisper of inner shadow along the top edge for depth.
    var grad = g.createLinearGradient(0, 0, 0, k * 0.45);
    grad.addColorStop(0, 'rgba(30,60,10,0.16)');
    grad.addColorStop(1, 'rgba(30,60,10,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, b.width, k * 0.45);
  };

  /* The apple is painted once per size into a sprite, then stamped. */
  Renderer.prototype.buildApple = function () {
    var k = this.k;
    var S = Math.ceil(k * 1.3);
    var a = this.apple;
    a.width = S;
    a.height = S;
    var g = a.getContext('2d');
    g.clearRect(0, 0, S, S);
    var cx = S / 2, cy = S / 2 + k * 0.05, R = k * 0.37;
    paintApple(g, cx, cy, R);
    this.appleSize = S / k; // in cells
  };

  function paintApple(g, cx, cy, R) {
    function P(x, y) { return [cx + x * R, cy + y * R]; }
    function shape() {
      g.beginPath();
      var p = P(0, -0.62); g.moveTo(p[0], p[1]);
      var seq = [
        [0.25, -0.95, 0.8, -1.0, 0.97, -0.5],
        [1.1, -0.1, 1.02, 0.45, 0.72, 0.8],
        [0.55, 0.99, 0.25, 1.0, 0, 0.88],
        [-0.25, 1.0, -0.55, 0.99, -0.72, 0.8],
        [-1.02, 0.45, -1.1, -0.1, -0.97, -0.5],
        [-0.8, -1.0, -0.25, -0.95, 0, -0.62]
      ];
      for (var i = 0; i < seq.length; i++) {
        var s = seq[i];
        var a1 = P(s[0], s[1]), a2 = P(s[2], s[3]), a3 = P(s[4], s[5]);
        g.bezierCurveTo(a1[0], a1[1], a2[0], a2[1], a3[0], a3[1]);
      }
      g.closePath();
    }
    // soft contact shadow
    g.save();
    g.fillStyle = 'rgba(30,60,10,0.2)';
    g.beginPath();
    g.ellipse(cx + R * 0.12, cy + R * 0.92, R * 0.8, R * 0.22, 0, 0, TAU);
    g.fill();
    g.restore();
    // body
    var grad = g.createRadialGradient(cx - R * 0.38, cy - R * 0.4, R * 0.08, cx, cy, R * 1.1);
    grad.addColorStop(0, '#ff8a63');
    grad.addColorStop(0.45, '#ec4a1f');
    grad.addColorStop(1, '#c03210');
    shape();
    g.fillStyle = grad;
    g.fill();
    g.lineWidth = Math.max(1, R * 0.07);
    g.strokeStyle = 'rgba(140,30,5,0.55)';
    g.stroke();
    // shine
    g.save();
    g.translate(cx - R * 0.45, cy - R * 0.3);
    g.rotate(-0.45);
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath();
    g.ellipse(0, 0, R * 0.15, R * 0.27, 0, 0, TAU);
    g.fill();
    g.restore();
    // stem
    g.strokeStyle = '#6e4220';
    g.lineCap = 'round';
    g.lineWidth = R * 0.13;
    g.beginPath();
    var s0 = P(0, -0.58), s1 = P(0.03, -0.9), s2 = P(0.16, -1.08);
    g.moveTo(s0[0], s0[1]);
    g.quadraticCurveTo(s1[0], s1[1], s2[0], s2[1]);
    g.stroke();
    // leaf
    g.save();
    var lp = P(0.42, -0.98);
    g.translate(lp[0], lp[1]);
    g.rotate(-0.42);
    g.fillStyle = '#4fae2b';
    g.beginPath();
    g.moveTo(-R * 0.34, 0);
    g.quadraticCurveTo(0, -R * 0.26, R * 0.34, 0);
    g.quadraticCurveTo(0, R * 0.26, -R * 0.34, 0);
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    g.lineWidth = Math.max(0.8, R * 0.04);
    g.beginPath();
    g.moveTo(-R * 0.26, 0);
    g.lineTo(R * 0.26, 0);
    g.stroke();
    g.restore();
  }

  /* ---------- snake geometry ---------- */

  /* Build the snake's centreline for interpolation t in [0,1] between the
     previous step and the current one, with corners rounded into arcs, then
     sample it densely. Coordinates are "unwrapped" so a snake crossing a
     wrap edge stays one continuous line (drawn again at an offset). */
  Renderer.prototype.buildPath = function (game, t, bump) {
    var s = game.snake, n = s.length, c = game.cols, r = game.rows;
    var P = this.pts;
    P.length = 0;
    var px = s[0].x + 0.5, py = s[0].y + 0.5;
    P.push(px, py);
    for (var i = 1; i < n; i++) {
      var dx = s[i].x - s[i - 1].x, dy = s[i].y - s[i - 1].y;
      if (dx > 1) dx -= c; else if (dx < -1) dx += c;
      if (dy > 1) dy -= r; else if (dy < -1) dy += r;
      px += dx;
      py += dy;
      P.push(px, py);
    }
    var pt = game.prevTail, tl = s[n - 1];
    var tdx = pt.x - tl.x, tdy = pt.y - tl.y;
    if (tdx > 1) tdx -= c; else if (tdx < -1) tdx += c;
    if (tdy > 1) tdy -= r; else if (tdy < -1) tdy += r;
    var ptx = px + tdx, pty = py + tdy;

    // polyline head -> tail
    var L = [];
    if (bump) {
      L.push(P[0] + bump.x, P[1] + bump.y, P[0], P[1]);
    } else {
      L.push(P[2] + (P[0] - P[2]) * t, P[3] + (P[1] - P[3]) * t);
    }
    for (i = 1; i < n; i++) L.push(P[2 * i], P[2 * i + 1]);
    var tt = bump ? 1 : t;
    L.push(ptx + (px - ptx) * tt, pty + (py - pty) * tt);
    // drop zero-length segments
    var Q = [L[0], L[1]];
    for (i = 2; i < L.length; i += 2) {
      var lx = Q[Q.length - 2], ly = Q[Q.length - 1];
      if (Math.abs(L[i] - lx) + Math.abs(L[i + 1] - ly) > 1e-5) Q.push(L[i], L[i + 1]);
    }

    var xs = this.xs, ys = this.ys;
    xs.length = 0;
    ys.length = 0;
    xs.push(Q[0]);
    ys.push(Q[1]);
    var m = Q.length / 2;
    var cx = Q[0], cy = Q[1];
    function seg(x0, y0, x1, y1) {
      var len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 1e-6) return;
      var kk = Math.max(1, Math.ceil(len / STEP));
      for (var j = 1; j <= kk; j++) {
        xs.push(x0 + (x1 - x0) * j / kk);
        ys.push(y0 + (y1 - y0) * j / kk);
      }
    }
    for (i = 1; i < m - 1; i++) {
      var ax = Q[2 * i - 2], ay = Q[2 * i - 1];
      var bx = Q[2 * i], by = Q[2 * i + 1];
      var ex = Q[2 * i + 2], ey = Q[2 * i + 3];
      var l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(ex - bx, ey - by);
      var d1x = (bx - ax) / l1, d1y = (by - ay) / l1;
      var d2x = (ex - bx) / l2, d2y = (ey - by) / l2;
      if (Math.abs(d1x * d2y - d1y * d2x) < 1e-3) continue; // straight through
      var rr = Math.min(0.5, i === 1 ? l1 : l1 * 0.5, i === m - 2 ? l2 : l2 * 0.5);
      var sx = bx - d1x * rr, sy = by - d1y * rr;
      var fx = bx + d2x * rr, fy = by + d2y * rr;
      seg(cx, cy, sx, sy);
      var kq = Math.max(2, Math.ceil(rr * 1.6 / STEP));
      for (var j = 1; j <= kq; j++) {
        var u = j / kq, iu = 1 - u;
        xs.push(iu * iu * sx + 2 * iu * u * bx + u * u * fx);
        ys.push(iu * iu * sy + 2 * iu * u * by + u * u * fy);
      }
      cx = fx;
      cy = fy;
    }
    seg(cx, cy, Q[2 * m - 2], Q[2 * m - 1]);

    var ss = this.ss;
    ss.length = xs.length;
    ss[0] = 0;
    for (i = 1; i < xs.length; i++) ss[i] = ss[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
    return ss[xs.length - 1];
  };

  /* Radius along the body: a slightly fuller head, a tapering tail. */
  Renderer.prototype.computeRadii = function (len) {
    var ss = this.ss, rad = this.rad, n = ss.length;
    rad.length = n;
    var taper = Math.min(2.6, Math.max(0.6, len * 0.55));
    for (var i = 0; i < n; i++) {
      var s = ss[i];
      var r = BODY_R;
      var u = (len - s) / taper;
      if (u < 1) {
        var e = 1 - (1 - u) * (1 - u);
        r = BODY_R * (0.36 + 0.64 * e);
      }
      if (s < 0.55) r *= 1 + 0.08 * (1 - s / 0.55);
      rad[i] = r;
    }
  };

  Renderer.prototype.offsets = function (game) {
    if (!game.wrap) return [[0, 0]];
    var xs = this.xs, ys = this.ys, n = xs.length;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < n; i++) {
      if (xs[i] < minX) minX = xs[i];
      if (xs[i] > maxX) maxX = xs[i];
      if (ys[i] < minY) minY = ys[i];
      if (ys[i] > maxY) maxY = ys[i];
    }
    var c = game.cols, r = game.rows, out = [];
    var kx0 = Math.ceil((-1 - maxX) / c), kx1 = Math.floor((c + 1 - minX) / c);
    var ky0 = Math.ceil((-1 - maxY) / r), ky1 = Math.floor((r + 1 - minY) / r);
    for (var kx = kx0; kx <= kx1; kx++) {
      for (var ky = ky0; ky <= ky1; ky++) out.push([kx * c, ky * r]);
    }
    return out;
  };

  /* Add one circle per sample to the current path; filled once per pass. */
  Renderer.prototype.addCircles = function (offs, dx, dy, extra, hi) {
    var g = this.ctx, xs = this.xs, ys = this.ys, rad = this.rad;
    var n = xs.length, C = this.cols, R = this.rows;
    for (var o = 0; o < offs.length; o++) {
      var ox = offs[o][0] + dx, oy = offs[o][1] + dy;
      for (var i = n - 1; i >= 0; i--) {
        var r = rad[i], x = xs[i] + ox, y = ys[i] + oy;
        if (hi) {
          x -= r * 0.2;
          y -= r * 0.26;
          r *= 0.42;
        } else {
          r += extra;
        }
        if (x + r < 0 || y + r < 0 || x - r > C || y - r > R) continue;
        g.moveTo(x + r, y);
        g.arc(x, y, r, 0, TAU);
      }
    }
  };

  Renderer.prototype.drawSnake = function (v) {
    var g = this.ctx, game = v.game;
    var len = this.buildPath(game, v.t, v.bump);
    this.computeRadii(len);
    var offs = this.offsets(game);
    var skin = SKINS[v.skin] || SKINS.blue;
    if (v.flash) skin = paleSkin(skin);

    g.fillStyle = 'rgba(25,60,0,0.2)';
    g.beginPath();
    this.addCircles(offs, 0.06, 0.1, OUTLINE, false);
    g.fill();

    g.fillStyle = skin.edge;
    g.beginPath();
    this.addCircles(offs, 0, 0, OUTLINE, false);
    g.fill();

    g.fillStyle = skin.body;
    g.beginPath();
    this.addCircles(offs, 0, 0, 0, false);
    g.fill();

    g.globalAlpha = 0.42;
    g.fillStyle = skin.hi;
    g.beginPath();
    this.addCircles(offs, 0, 0, 0, true);
    g.fill();
    g.globalAlpha = 1;

    // head direction from the smoothed centreline
    var xs = this.xs, ys = this.ys, ss = this.ss;
    var hx = xs[0], hy = ys[0], dx = 0, dy = 0;
    for (var i = 1; i < xs.length; i++) {
      if (ss[i] >= 0.3) { dx = hx - xs[i]; dy = hy - ys[i]; break; }
    }
    var dl = Math.hypot(dx, dy);
    if (dl < 1e-4) {
      var D = window.SnakeEngine.DIRS[game.dir];
      dx = D[0]; dy = D[1];
    } else {
      dx /= dl; dy /= dl;
    }
    var hr = this.rad[0];
    for (var o = 0; o < offs.length; o++) {
      var x = hx + offs[o][0], y = hy + offs[o][1];
      if (x < -1 || y < -1 || x > this.cols + 1 || y > this.rows + 1) continue;
      this.drawEyes(x, y, dx, dy, hr, skin, v, offs[o]);
    }
  };

  Renderer.prototype.drawEyes = function (hx, hy, dx, dy, r, skin, v, off) {
    var g = this.ctx;
    var px = -dy, py = dx;
    var er = r * 0.37, pr = er * 0.56;
    var fwd = r * 0.14, side = r * 0.5;
    for (var sIdx = -1; sIdx <= 1; sIdx += 2) {
      var ex = hx + dx * fwd + px * side * sIdx;
      var ey = hy + dy * fwd + py * side * sIdx;
      if (v.dead) {
        g.strokeStyle = '#1b2140';
        g.lineWidth = 0.065;
        g.lineCap = 'round';
        var q = er * 0.72;
        g.beginPath();
        g.moveTo(ex - q, ey - q); g.lineTo(ex + q, ey + q);
        g.moveTo(ex + q, ey - q); g.lineTo(ex - q, ey + q);
        g.stroke();
        continue;
      }
      if (v.blink) {
        g.strokeStyle = skin.edge;
        g.lineWidth = 0.06;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(ex - px * er * 0.9, ey - py * er * 0.9);
        g.lineTo(ex + px * er * 0.9, ey + py * er * 0.9);
        g.stroke();
        continue;
      }
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(ex, ey, er, 0, TAU);
      g.fill();
      g.strokeStyle = 'rgba(20,40,110,0.35)';
      g.lineWidth = 0.025;
      g.stroke();
      // pupil looks at the apple
      var lx = dx, ly = dy;
      if (v.look) {
        lx = v.look.x - (ex - off[0]);
        ly = v.look.y - (ey - off[1]);
        var ll = Math.hypot(lx, ly);
        if (ll > 0.05) { lx /= ll; ly /= ll; } else { lx = dx; ly = dy; }
      }
      var reach = (er - pr) * 0.85;
      var ppx = ex + lx * reach, ppy = ey + ly * reach;
      g.fillStyle = '#16182b';
      g.beginPath();
      g.arc(ppx, ppy, pr, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.arc(ppx - pr * 0.32, ppy - pr * 0.36, pr * 0.3, 0, TAU);
      g.fill();
    }
  };

  Renderer.prototype.drawApple = function (cx, cy, scale) {
    if (scale <= 0.01) return;
    var sz = this.appleSize * scale;
    this.ctx.drawImage(this.apple, cx - sz / 2, cy - sz / 2, sz, sz);
  };

  Renderer.prototype.drawParticles = function (list) {
    var g = this.ctx;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var a = Math.max(0, p.life / p.max);
      if (p.kind === 'ring') {
        var q = 1 - a;
        g.globalAlpha = a * 0.7;
        g.strokeStyle = p.color;
        g.lineWidth = 0.07 * a + 0.02;
        g.beginPath();
        g.arc(p.x, p.y, 0.3 + q * 0.75, 0, TAU);
        g.stroke();
      } else if (p.kind === 'confetti') {
        g.globalAlpha = Math.min(1, a * 2);
        g.fillStyle = p.color;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        g.restore();
      } else {
        g.globalAlpha = Math.min(1, a * 1.6);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(p.x, p.y, p.r * (0.4 + 0.6 * a), 0, TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  };

  Renderer.prototype.draw = function (v) {
    var g = this.ctx, k = this.k, game = v.game;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.drawImage(this.bg, 0, 0);
    g.setTransform(k, 0, 0, k, 0, 0);

    if (game.wrap) {
      g.save();
      g.strokeStyle = 'rgba(255,255,255,0.45)';
      g.lineWidth = 0.06;
      g.setLineDash([0.22, 0.2]);
      g.lineDashOffset = -(v.now / 1000) * 0.6;
      g.strokeRect(0.05, 0.05, this.cols - 0.1, this.rows - 0.1);
      g.restore();
    }

    var pulse = 1 + 0.035 * Math.sin(v.now / 260);
    for (var i = 0; i < game.apples.length; i++) {
      var a = game.apples[i];
      var age = a.born == null ? 1e9 : v.now - a.born;
      var s = easeOutBack(age / 320);
      this.drawApple(a.x + 0.5, a.y + 0.5, s * (age > 320 ? pulse : 1));
    }
    for (i = 0; i < v.eaten.length; i++) {
      this.drawApple(v.eaten[i].x + 0.5, v.eaten[i].y + 0.5, 1);
    }

    this.drawSnake(v);
    this.drawParticles(v.particles);

    if (v.redFlash > 0) {
      g.fillStyle = 'rgba(230,40,20,' + (0.22 * v.redFlash).toFixed(3) + ')';
      g.fillRect(0, 0, this.cols, this.rows);
    }
  };

  window.SnakeRender = { Renderer: Renderer, SKINS: SKINS };
})();
