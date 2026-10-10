/* Stickman Hook - canvas drawing: sky, parallax, level objects, stickman,
 * trail and particles. Pure drawing; no game state lives here. */
(function () {
  'use strict';
  var P = window.SHPhys, RD = window.SHRagdoll;
  var TAU = Math.PI * 2;

  var THEMES = [
    { name: 'Meadow', sky: ['#7cc8f5', '#d8f1ff'], sun: '#fff6c9', far: '#cfe9f7', mid: '#a7dfb4', near: '#86cf99',
      block: '#ffffff', edge: '#cfe0ea', pad: '#ffc93c', spin: '#ff8a5b', podium: '#ffd166', ui: '#2d8fd5' },
    { name: 'Bubblegum', sky: ['#ff9ec7', '#ffe6f1'], sun: '#fff3f8', far: '#ffd0e4', mid: '#ffb3d2', near: '#f79bc2',
      block: '#ffffff', edge: '#f7c9dc', pad: '#6ad3ff', spin: '#9b7bff', podium: '#ffe08a', ui: '#e0508f' },
    { name: 'Mint', sky: ['#5fd6c4', '#e3fff7'], sun: '#fbfff0', far: '#c4f1e6', mid: '#93e0c9', near: '#6fcfb2',
      block: '#ffffff', edge: '#bfe9dd', pad: '#ffb347', spin: '#ff6f91', podium: '#ffd166', ui: '#1fa58c' },
    { name: 'Lavender', sky: ['#a594ff', '#f0ebff'], sun: '#fff9e8', far: '#dcd3ff', mid: '#c2b3fb', near: '#a998ef',
      block: '#ffffff', edge: '#d9d0fa', pad: '#5fe0b7', spin: '#ff7a8a', podium: '#ffd166', ui: '#6f5ce0' },
    { name: 'Sunset', sky: ['#ff8a6b', '#ffe2a8'], sun: '#fff1c4', far: '#ffc9a2', mid: '#f7a98c', near: '#e98e7b',
      block: '#fffaf3', edge: '#f3d5c0', pad: '#5ec8ff', spin: '#8b6cff', podium: '#fff0a8', ui: '#e0663f' },
    { name: 'Starlight', sky: ['#3f4294', '#c79ee6'], sun: '#fff4d6', far: '#7d6fc0', mid: '#6b5aae', near: '#58489a',
      block: '#f6f2ff', edge: '#b8a8e8', pad: '#ffd84d', spin: '#ff7ab8', podium: '#ffe27a', ui: '#7b5cff', stars: true }
  ];

  var SKINS = [
    { id: 'classic', name: 'Classic', body: '#23232b', trail: 'plain', unlock: null },
    { id: 'coral', name: 'Coral', body: '#ff5a5f', trail: 'plain', unlock: { levels: 5 } },
    { id: 'ocean', name: 'Ocean', body: '#2f7fe8', trail: 'bubble', unlock: { levels: 10 } },
    { id: 'ninja', name: 'Ninja', body: '#1d1d26', trail: 'dark', acc: 'band', unlock: { levels: 15 } },
    { id: 'gold', name: 'Gold', body: '#e9a90d', trail: 'sparkle', unlock: { levels: 20 } },
    { id: 'neon', name: 'Neon', body: '#13c98f', trail: 'neon', glow: '#3dffc0', unlock: { levels: 25 } },
    { id: 'rainbow', name: 'Rainbow', body: 'rainbow', trail: 'rainbow', unlock: { levels: 30 } },
    { id: 'royal', name: 'Royal', body: '#6a3df0', trail: 'fire', acc: 'crown', unlock: { stars: 75 } }
  ];

  function themeFor(levelIdx) { return THEMES[Math.min(THEMES.length - 1, Math.floor(levelIdx / 5))]; }

  // ---------- helpers ----------
  function rrect(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function skinColor(skin, t, i) {
    if (skin.body === 'rainbow') return 'hsl(' + ((t * 120 + (i || 0) * 40) % 360) + ',85%,55%)';
    return skin.body;
  }

  // ---------- background ----------
  function drawBackground(c, W, H, view, theme, time) {
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]); g.addColorStop(1, theme.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var s = view.scale, unit = Math.max(W, H);

    if (theme.stars) {
      c.fillStyle = '#ffffff';
      for (var i = 0; i < 70; i++) {
        var sx = ((hash(i) * 2000 - view.cx * s * 0.03) % 2000 + 2000) % 2000 / 2000 * W;
        var sy = hash(i + 99) * H * 0.6;
        c.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(time * 1.3 + i));
        c.beginPath(); c.arc(sx, sy, 1 + hash(i + 7) * 1.6, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
    }
    // sun / moon
    var sunX = W * 0.78 - view.cx * s * 0.01 % W, sunY = H * 0.2;
    var sr = unit * 0.06;
    c.fillStyle = theme.sun; c.globalAlpha = 0.35;
    c.beginPath(); c.arc(sunX, sunY, sr * 1.8, 0, TAU); c.fill();
    c.globalAlpha = 0.9;
    c.beginPath(); c.arc(sunX, sunY, sr, 0, TAU); c.fill();
    c.globalAlpha = 1;

    // clouds (far)
    var span = unit * 1.6;
    for (var k = 0; k < 7; k++) {
      var cx = ((hash(k + 3) * span - view.cx * s * 0.08 - time * 6) % span + span) % span - unit * 0.2;
      var cy = H * (0.12 + hash(k + 11) * 0.35) - view.cy * s * 0.03;
      var cs = unit * (0.035 + hash(k + 21) * 0.03);
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.beginPath();
      c.arc(cx, cy, cs, 0, TAU); c.arc(cx + cs * 1.1, cy - cs * 0.5, cs * 1.25, 0, TAU);
      c.arc(cx + cs * 2.3, cy, cs * 0.95, 0, TAU);
      c.fill();
      rrect(c, cx - cs * 0.2, cy - cs * 0.2, cs * 2.7, cs * 1.1, cs * 0.55); c.fill();
    }
    // hills, three parallax layers
    var vy = view.cy * s;
    hills(c, W, H, view.cx * s * 0.12, H * 0.6 - vy * 0.05, unit * 0.07, theme.far, 0.0019 / (unit / 1000), 1);
    hills(c, W, H, view.cx * s * 0.25, H * 0.72 - vy * 0.1, unit * 0.06, theme.mid, 0.0032 / (unit / 1000), 2);
    hills(c, W, H, view.cx * s * 0.45, H * 0.86 - vy * 0.16, unit * 0.05, theme.near, 0.005 / (unit / 1000), 3);
  }
  function hills(c, W, H, off, base, amp, color, f, seed) {
    c.fillStyle = color;
    c.beginPath(); c.moveTo(0, H);
    var top = Math.max(H * 0.25, base);
    for (var x = 0; x <= W + 16; x += 16) {
      var u = x + off;
      var y = top - amp * (0.6 * Math.sin(u * f + seed) + 0.3 * Math.sin(u * f * 2.3 + seed * 2.1) + 0.25 * Math.sin(u * f * 0.47 + seed * 3.7));
      c.lineTo(x, y);
    }
    c.lineTo(W, H); c.closePath(); c.fill();
  }

  // ---------- world ----------
  function visible(view, x0, y0, x1, y1) {
    var hw = view.W / 2 / view.scale + 60, hh = view.H / 2 / view.scale + 60;
    return x1 > view.cx - hw && x0 < view.cx + hw && y1 > view.cy - hh && y0 < view.cy + hh;
  }

  function drawWorld(c, sim, view, theme, time, fx) {
    var lv = sim.lv, i;
    // moving hook tracks
    c.lineCap = 'round';
    for (i = 0; i < lv.hooks.length; i++) {
      var h = lv.hooks[i];
      if (!h.ax && !h.ay) continue;
      c.strokeStyle = 'rgba(40,30,80,0.14)'; c.lineWidth = 6;
      c.setLineDash([2, 14]);
      c.beginPath(); c.moveTo(h.x - h.ax, h.y - h.ay); c.lineTo(h.x + h.ax, h.y + h.ay); c.stroke();
      c.setLineDash([]);
      c.fillStyle = 'rgba(40,30,80,0.14)';
      c.beginPath(); c.arc(h.x - h.ax, h.y - h.ay, 6, 0, TAU); c.arc(h.x + h.ax, h.y + h.ay, 6, 0, TAU); c.fill();
    }
    for (i = 0; i < lv.blocks.length; i++) {
      var b = lv.blocks[i];
      if (!visible(view, b.x, b.y, b.x + b.w, b.y + b.h + 400)) continue;
      if (b.podium) drawPodium(c, lv.finish, theme, time, fx);
      else if (b.start) drawStart(c, b, theme);
      else drawBlock(c, b, theme, time);
    }
    for (i = 0; i < lv.pads.length; i++) {
      var p = lv.pads[i];
      if (!visible(view, p.x - p.w, p.y - 80, p.x + p.w, p.y + 80)) continue;
      drawPad(c, p, sim.padSquash[i] || 0, theme, time);
    }
    for (i = 0; i < lv.spinners.length; i++) {
      var sp = lv.spinners[i];
      if (!visible(view, sp.x - sp.len, sp.y - sp.len, sp.x + sp.len, sp.y + sp.len)) continue;
      drawSpinner(c, sp, P.spinnerAngle(sim, i), theme);
    }
  }

  function drawHooks(c, sim, view, cand, time) {
    var lv = sim.lv;
    for (var i = 0; i < lv.hooks.length; i++) {
      var hp = P.hookPos(sim, i);
      if (!visible(view, hp[0] - 40, hp[1] - 40, hp[0] + 40, hp[1] + 40)) continue;
      var lit = i === cand || i === sim.hook;
      // hooks stay easy to see when the world is zoomed out on small screens
      var r = 13 * Math.max(1, Math.min(1.6, 0.8 / view.scale));
      if (lit) {
        var pulse = 0.5 + 0.5 * Math.sin(time * 9);
        c.fillStyle = 'rgba(255,60,140,' + (0.18 + 0.12 * pulse) + ')';
        c.beginPath(); c.arc(hp[0], hp[1], r + 12 + pulse * 4, 0, TAU); c.fill();
      }
      c.fillStyle = 'rgba(0,0,0,0.12)';
      c.beginPath(); c.arc(hp[0] + 2, hp[1] + 4, r, 0, TAU); c.fill();
      c.fillStyle = lit ? '#ff2f86' : '#ff9cc4';
      c.beginPath(); c.arc(hp[0], hp[1], r, 0, TAU); c.fill();
      c.lineWidth = r * 0.27; c.strokeStyle = lit ? '#ffffff' : 'rgba(255,255,255,0.75)';
      c.beginPath(); c.arc(hp[0], hp[1], r * 0.65, 0, TAU); c.stroke();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(hp[0] - r * 0.27, hp[1] - r * 0.3, r * 0.2, 0, TAU); c.fill();
    }
  }

  function drawBlock(c, b, theme, time) {
    var r = 16;
    c.fillStyle = 'rgba(30,20,60,0.10)';
    rrect(c, b.x + 5, b.y + 8, b.w, b.h, r); c.fill();
    if (b.bouncy) {
      c.fillStyle = '#ff6fae';
      rrect(c, b.x, b.y, b.w, b.h, r); c.fill();
      c.save(); rrect(c, b.x, b.y, b.w, b.h, r); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = 12;
      var off = (time * 30) % 40;
      for (var d = -b.h - 40; d < b.w + b.h; d += 40) {
        c.beginPath(); c.moveTo(b.x + d + off, b.y); c.lineTo(b.x + d + off + b.h, b.y + b.h); c.stroke();
      }
      c.restore();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4;
      rrect(c, b.x + 4, b.y + 4, b.w - 8, b.h - 8, r - 4); c.stroke();
    } else {
      c.fillStyle = theme.block;
      rrect(c, b.x, b.y, b.w, b.h, r); c.fill();
      c.strokeStyle = theme.edge; c.lineWidth = 5;
      rrect(c, b.x + 2.5, b.y + 2.5, b.w - 5, b.h - 5, r - 2); c.stroke();
    }
  }

  function drawStart(c, b, theme) {
    c.fillStyle = 'rgba(30,20,60,0.10)';
    rrect(c, b.x + 5, b.y + 8, b.w, b.h, 14); c.fill();
    var g = c.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, theme.edge);
    c.fillStyle = g; rrect(c, b.x, b.y, b.w, b.h, 14); c.fill();
    c.fillStyle = theme.ui; rrect(c, b.x, b.y, b.w, 12, 6); c.fill();
    c.fillStyle = theme.ui; c.globalAlpha = 0.65;
    c.font = 'bold 20px system-ui, -apple-system, "Segoe UI", sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('START', b.x + b.w / 2, b.y + 48);
    c.globalAlpha = 1;
  }

  function drawPodium(c, f, theme, time, fx) {
    var x = f.x, y = f.y, w = f.w;
    c.fillStyle = 'rgba(30,20,60,0.12)'; rrect(c, x + 6, y + 10, w, 320, 18); c.fill();
    var g = c.createLinearGradient(0, y, 0, y + 320);
    g.addColorStop(0, theme.podium); g.addColorStop(1, '#ffffff');
    c.fillStyle = g; rrect(c, x, y, w, 320, 18); c.fill();
    // checkered strip
    c.save(); rrect(c, x, y, w, 26, 12); c.clip();
    var sq = 13;
    for (var cx = 0; cx < w; cx += sq) for (var cy = 0; cy < 26; cy += sq) {
      c.fillStyle = ((cx + cy) / sq) % 2 ? '#2a2a35' : '#ffffff';
      c.fillRect(x + cx, y + cy, sq, sq);
    }
    c.restore();
    // trophy-ish star on the front
    star(c, x + w / 2, y + 120, 34, 15, '#ffffff', 0.85);
    star(c, x + w / 2, y + 120, 26, 11, theme.podium, 1);
    // goal arch
    var top = y - 250;
    c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 14, y); c.lineTo(x + 14, top); c.moveTo(x + w - 14, y); c.lineTo(x + w - 14, top); c.stroke();
    // waving checkered banner
    var bw = w - 28, bh = 44, cols = 12;
    for (var k = 0; k < cols; k++) {
      var u0 = k / cols, u1 = (k + 1) / cols;
      var w0 = Math.sin(time * 4 + u0 * 6) * 6, w1 = Math.sin(time * 4 + u1 * 6) * 6;
      for (var row = 0; row < 2; row++) {
        c.fillStyle = (k + row) % 2 ? '#2a2a35' : '#ffffff';
        c.beginPath();
        c.moveTo(x + 14 + bw * u0, top + row * bh / 2 + w0);
        c.lineTo(x + 14 + bw * u1, top + row * bh / 2 + w1);
        c.lineTo(x + 14 + bw * u1, top + (row + 1) * bh / 2 + w1);
        c.lineTo(x + 14 + bw * u0, top + (row + 1) * bh / 2 + w0);
        c.closePath(); c.fill();
      }
    }
    c.fillStyle = theme.ui;
    c.beginPath(); c.arc(x + 14, top, 9, 0, TAU); c.arc(x + w - 14, top, 9, 0, TAU); c.fill();
  }

  function star(c, x, y, r1, r2, col, a) {
    c.fillStyle = col; c.globalAlpha = a;
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? r2 : r1, an = -Math.PI / 2 + i * Math.PI / 5;
      c.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r);
    }
    c.closePath(); c.fill(); c.globalAlpha = 1;
  }

  function drawPad(c, p, squash, theme, time) {
    c.save();
    c.translate(p.x, p.y); c.rotate(p.ang);
    var hw = p.w / 2, dip = Math.sin(squash * Math.PI) * 12 * squash + squash * 4;
    // base
    c.fillStyle = 'rgba(30,20,60,0.12)'; rrect(c, -hw + 8, 52, p.w - 8, 12, 6); c.fill();
    c.fillStyle = '#5b5670'; rrect(c, -hw + 4, 44, p.w - 8, 12, 6); c.fill();
    // springs
    c.strokeStyle = '#8a86a0'; c.lineWidth = 4; c.lineJoin = 'round';
    [-hw + 26, 0, hw - 26].forEach(function (sx) {
      c.beginPath();
      var top = 8 + dip, bot = 44, n = 6;
      for (var i = 0; i <= n; i++) {
        var yy = top + (bot - top) * i / n;
        c.lineTo(sx + (i % 2 ? 8 : -8) * (i === 0 || i === n ? 0 : 1), yy);
      }
      c.stroke();
    });
    // bouncy top
    c.fillStyle = theme.pad;
    rrect(c, -hw, -6 + dip, p.w, 16, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    rrect(c, -hw + 8, -3 + dip, p.w - 16, 4, 2); c.fill();
    // arrow hint
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.moveTo(0, -22 + dip - Math.abs(Math.sin(time * 5)) * 4); c.lineTo(9, -12 + dip); c.lineTo(-9, -12 + dip); c.closePath(); c.fill();
    c.restore();
  }

  function drawSpinner(c, s, ang, theme) {
    c.save();
    c.translate(s.x, s.y); c.rotate(ang);
    var hl = s.len / 2, t = P.C.SPIN_THICK;
    c.fillStyle = 'rgba(30,20,60,0.12)'; rrect(c, -hl - t + 4, -t + 7, s.len + 2 * t, 2 * t, t); c.fill();
    c.fillStyle = theme.spin; rrect(c, -hl - t, -t, s.len + 2 * t, 2 * t, t); c.fill();
    c.save(); rrect(c, -hl - t, -t, s.len + 2 * t, 2 * t, t); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    for (var x = -hl - t; x < hl + t; x += 36) {
      c.beginPath(); c.moveTo(x, -t); c.lineTo(x + 14, -t); c.lineTo(x + 14 - 2 * t, t); c.lineTo(x - 2 * t, t); c.closePath(); c.fill();
    }
    c.restore();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
    c.fillStyle = '#5b5670'; c.beginPath(); c.arc(0, 0, 4.5, 0, TAU); c.fill();
    c.restore();
  }

  // ---------- stickman ----------
  var LIMBS = [[1, 2], [1, 3, 4], [1, 5, 6], [2, 7, 8], [2, 9, 10]];
  function drawStickman(c, r, skin, time, dx, dy, ropeFrom) {
    dx = dx || 0; dy = dy || 0;
    var col = skinColor(skin, time, 0);
    var X = function (i) { return r.px[i] + dx; }, Y = function (i) { return r.py[i] + dy; };
    if (ropeFrom) {
      c.strokeStyle = '#3b3550'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(ropeFrom[0], ropeFrom[1]); c.lineTo(X(RD.HAND_R), Y(RD.HAND_R)); c.stroke();
    }
    if (skin.glow) { c.shadowColor = skin.glow; c.shadowBlur = 16; }
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 8;
    for (var l = 0; l < LIMBS.length; l++) {
      var L = LIMBS[l];
      c.strokeStyle = skin.body === 'rainbow' ? skinColor(skin, time, l + 1) : col;
      c.beginPath(); c.moveTo(X(L[0]), Y(L[0]));
      for (var k = 1; k < L.length; k++) c.lineTo(X(L[k]), Y(L[k]));
      c.stroke();
    }
    // head
    var hx = X(0), hy = Y(0);
    var ax = X(0) - X(1), ay = Y(0) - Y(1), al = Math.hypot(ax, ay) || 1;
    ax /= al; ay /= al;
    var cx = hx + ax * 3, cy = hy + ay * 3;
    c.fillStyle = col;
    c.beginPath(); c.arc(cx, cy, 11, 0, TAU); c.fill();
    c.shadowBlur = 0;
    if (skin.acc === 'band') {
      var px = -ay, py = ax;
      c.strokeStyle = '#ff3b4e'; c.lineWidth = 3.5;
      c.beginPath(); c.moveTo(cx + px * 11 + ax, cy + py * 11 + ay); c.lineTo(cx - px * 11 + ax, cy - py * 11 + ay); c.stroke();
      var w = Math.sin(time * 14) * 3;
      c.beginPath(); c.moveTo(cx - px * 11 + ax, cy - py * 11 + ay);
      c.lineTo(cx - px * 21 - ax * 4 + w, cy - py * 21 - ay * 4 + w); c.stroke();
    } else if (skin.acc === 'crown') {
      var bx = cx + ax * 10, by = cy + ay * 10, qx = -ay, qy = ax;
      c.fillStyle = '#ffd23f';
      c.beginPath();
      c.moveTo(bx + qx * 8, by + qy * 8);
      c.lineTo(bx + qx * 9 + ax * 10, by + qy * 9 + ay * 10);
      c.lineTo(bx + qx * 3 + ax * 5, by + qy * 3 + ay * 5);
      c.lineTo(bx + ax * 12, by + ay * 12);
      c.lineTo(bx - qx * 3 + ax * 5, by - qy * 3 + ay * 5);
      c.lineTo(bx - qx * 9 + ax * 10, by - qy * 9 + ay * 10);
      c.lineTo(bx - qx * 8, by - qy * 8);
      c.closePath(); c.fill();
    }
    // a bright eye so you can see which way he faces
    var face = (r.px[6] + r.px[4]) / 2 - r.px[2] >= 0 ? 1 : -1;
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(cx + (-ay) * 4.5 * face + ax * 2, cy + ax * 4.5 * face + ay * 2, 2.4, 0, TAU); c.fill();
  }

  // ---------- trail ----------
  function drawTrail(c, pts, skin, time) {
    var n = pts.length;
    if (n < 3) return;
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (var i = 1; i < n; i++) {
      var a = i / n;
      var col;
      switch (skin.trail) {
        case 'rainbow': col = 'hsla(' + ((i * 22 + time * 200) % 360) + ',90%,60%,' + (a * 0.7) + ')'; break;
        case 'fire': col = 'hsla(' + (10 + a * 40) + ',100%,' + (50 + a * 15) + '%,' + (a * 0.65) + ')'; break;
        case 'neon': col = 'rgba(61,255,192,' + (a * 0.6) + ')'; break;
        case 'bubble': col = 'rgba(80,170,255,' + (a * 0.45) + ')'; break;
        case 'sparkle': col = 'rgba(255,205,60,' + (a * 0.55) + ')'; break;
        case 'dark': col = 'rgba(30,30,40,' + (a * 0.35) + ')'; break;
        default: col = 'rgba(255,255,255,' + (a * 0.55) + ')';
      }
      c.strokeStyle = col;
      c.lineWidth = 3 + a * 9;
      c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
      if (skin.trail === 'sparkle' && i % 3 === 0) {
        star(c, pts[i][0] + Math.sin(i * 7 + time * 5) * 8, pts[i][1] + Math.cos(i * 5) * 8, 5 * a + 1, 2 * a + 0.5, '#fff6b0', a);
      }
      if (skin.trail === 'bubble' && i % 4 === 0) {
        c.strokeStyle = 'rgba(255,255,255,' + a * 0.8 + ')'; c.lineWidth = 1.5;
        c.beginPath(); c.arc(pts[i][0], pts[i][1] + Math.sin(i + time * 4) * 6, 3 + a * 3, 0, TAU); c.stroke();
      }
    }
  }

  // ---------- particles ----------
  function drawParticles(c, parts) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], a = Math.max(0, Math.min(1, p.life / p.max));
      c.globalAlpha = a;
      if (p.kind === 'confetti') {
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = p.color; c.fillRect(-p.size, -p.size * 0.45, p.size * 2, p.size * 0.9);
        c.restore();
      } else if (p.kind === 'ring') {
        c.strokeStyle = p.color; c.lineWidth = 4 * a;
        c.beginPath(); c.arc(p.x, p.y, p.size * (1.6 - a), 0, TAU); c.stroke();
      } else {
        c.fillStyle = p.color;
        c.beginPath(); c.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, TAU); c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  /* Small preview of a skin, for the skins screen (draws into a 2D context
   * already scaled so the figure fits ~ 90x110 units). */
  function drawSkinPreview(c, skin, w, h, time, locked) {
    var r = RD.create(0, 0);
    RD.setPose(r, 0, 0, 'cheer', time);
    c.save();
    c.translate(w / 2, h * 0.62);
    var k = Math.min(w, h) / 95;
    c.scale(k, k);
    if (locked) c.globalAlpha = 0.25;
    var trail = [];
    for (var i = 0; i < 14; i++) trail.push([-60 + i * 4, 30 - Math.sin(i / 13 * Math.PI) * 30]);
    if (!locked) drawTrail(c, trail, skin, time);
    drawStickman(c, r, locked ? { body: '#8a8aa0', trail: 'plain' } : skin, time);
    c.restore();
  }

  window.SHRender = {
    THEMES: THEMES, SKINS: SKINS, themeFor: themeFor,
    drawBackground: drawBackground, drawWorld: drawWorld, drawHooks: drawHooks,
    drawStickman: drawStickman, drawTrail: drawTrail, drawParticles: drawParticles,
    drawSkinPreview: drawSkinPreview, rrect: rrect, star: star
  };
})();
