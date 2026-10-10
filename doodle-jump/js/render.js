/* Doodle Jump - canvas renderer. Everything is drawn with code in a
 * hand-sketched style: jittered outlines (seeded per object so they don't
 * flicker), a second faint pencil pass, and flat fills on graph paper. */
(function () {
  'use strict';
  var C = window.DJCore, W = C.W, P = C.P;
  var INK = '#2b2620';
  var FONT = "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', 'Comic Neue', 'Segoe Print', 'Bradley Hand', cursive";
  function font(px, bold) { return (bold ? 'bold ' : '') + px + 'px ' + FONT; }
  function hash(a, b) { var x = Math.sin(a * 127.1 + b * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ---- sketch primitives ---------------------------------------------------------
  function smoothPath(ctx, pts, seed, jit, open) {
    var n = pts.length, q = new Array(n), i;
    for (i = 0; i < n; i++) {
      q[i] = [pts[i][0] + (hash(seed, i) - 0.5) * 2 * jit, pts[i][1] + (hash(seed, i + 57) - 0.5) * 2 * jit];
    }
    ctx.beginPath();
    if (open) {
      ctx.moveTo(q[0][0], q[0][1]);
      for (i = 1; i < n - 1; i++) {
        ctx.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
      }
      ctx.lineTo(q[n - 1][0], q[n - 1][1]);
      return;
    }
    ctx.moveTo((q[n - 1][0] + q[0][0]) / 2, (q[n - 1][1] + q[0][1]) / 2);
    for (i = 0; i < n; i++) {
      var a = q[i], b = q[(i + 1) % n];
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    ctx.closePath();
  }
  function shape(ctx, pts, seed, fill, opt) {
    opt = opt || {};
    var jit = opt.jit == null ? 0.7 : opt.jit;
    smoothPath(ctx, pts, seed, jit);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    ctx.strokeStyle = opt.ink || INK;
    ctx.lineWidth = opt.lw || 2.2;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.stroke();
    if (!opt.single) {
      smoothPath(ctx, pts, seed + 13, jit * 1.4);
      ctx.globalAlpha *= 0.3;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha /= 0.3;
    }
  }
  function line(ctx, pts, seed, lw, color, jit) {
    smoothPath(ctx, pts, seed, jit == null ? 0.5 : jit, true);
    ctx.strokeStyle = color || INK; ctx.lineWidth = lw || 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();
  }
  function rectPts(x, y, w, h, step) {
    var pts = [], i, n;
    step = step || 10;
    n = Math.max(1, Math.round(w / step));
    for (i = 0; i <= n; i++) pts.push([x + w * i / n, y]);
    var m = Math.max(1, Math.round(h / step));
    for (i = 1; i < m; i++) pts.push([x + w, y + h * i / m]);
    for (i = n; i >= 0; i--) pts.push([x + w * i / n, y + h]);
    for (i = m - 1; i >= 1; i--) pts.push([x, y + h * i / m]);
    return pts;
  }
  function ellPts(cx, cy, rx, ry, n) {
    var pts = [];
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return pts;
  }
  function dot(ctx, x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c || INK; ctx.fill(); }
  function star(ctx, x, y, r, c) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fillStyle = c || '#ffd84a'; ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
  }

  // ---- background ---------------------------------------------------------------
  function drawPaper(ctx, H, camY) {
    ctx.fillStyle = '#f7f2e2';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(96, 140, 205, 0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var s = 20;
    for (var x = 0; x <= W; x += s) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    var first = Math.ceil(camY / s) * s;
    for (var wy = first; wy < camY + H + s; wy += s) { var y = Math.round(wy - camY) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  }

  // ---- doodler --------------------------------------------------------------------
  var BODY = '#cbdc3d', BODY_D = '#a6b92a', PANTS = '#5f9a2a', PANTS_D = '#3c6a16';
  var BODY_PTS = [[-15, -9], [-17, -19], [-16, -30], [-12, -38], [-5, -42.5], [4, -42.5], [11, -38.5], [15.5, -31], [17, -20], [15, -9], [0, -8.5]];

  function drawDoodler(ctx, x, y, o) {
    var t = o.t || 0;
    ctx.save();
    ctx.translate(x, y);
    if (o.scale != null && o.scale !== 1) ctx.scale(o.scale, o.scale);
    if (o.squash) { var s = o.squash; ctx.scale(1 + 0.16 * s, 1 - 0.2 * s); }
    if (o.rot) { ctx.translate(0, -22); ctx.rotate(o.rot); ctx.translate(0, 22); }
    ctx.scale(o.face < 0 ? -1 : 1, 1);

    // jetpack goes behind
    if (o.fly === 'jetpack') drawJetpackOn(ctx, t);

    // legs
    var legs = [-11, -4, 3, 10];
    for (var i = 0; i < 4; i++) {
      var lx = legs[i], kick = o.squash ? 1.5 : 0;
      line(ctx, [[lx, -10], [lx + 0.5, -4 + kick], [lx, 0 + kick]], 300 + i, 2.4);
      line(ctx, [[lx, 0 + kick], [lx + 2.5, 0.3 + kick], [lx + 5, 0 + kick]], 310 + i, 2.4);
    }
    // body
    shape(ctx, BODY_PTS, 11, BODY, { jit: 0.35 });
    // pants stripes, clipped to the body
    ctx.save();
    smoothPath(ctx, BODY_PTS, 11, 0.35);
    ctx.clip();
    ctx.fillStyle = PANTS;
    ctx.fillRect(-20, -18, 40, 12);
    ctx.strokeStyle = PANTS_D; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(-20, -14.5); ctx.lineTo(20, -14); ctx.moveTo(-20, -11); ctx.lineTo(20, -11.3); ctx.stroke();
    ctx.fillStyle = BODY_D; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.ellipse(-12, -27, 4, 11, 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // body outline again on top of the fills
    smoothPath(ctx, BODY_PTS, 11, 0.35);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
    line(ctx, [[-16, -18], [0, -17.5], [16.5, -18]], 21, 1.8);

    var dead = o.dead;
    if (o.shoot) {
      // snout pointing straight up
      shape(ctx, [[-3.5, -40], [-3.2, -50], [-3, -55], [3, -55], [3.2, -50], [3.5, -40]], 31, BODY, { jit: 0.2, single: true });
      shape(ctx, ellPts(0, -56, 6.5, 3, 10), 32, BODY, { jit: 0.2, single: true });
      dot(ctx, 0, -56.2, 2.2);
      dot(ctx, -6, -35, 1.9); dot(ctx, 6, -35, 1.9);
    } else {
      // trumpet snout to the right
      shape(ctx, [[12, -35], [20, -35.5], [26, -36], [26, -29], [20, -28.5], [12, -28]], 33, BODY, { jit: 0.2, single: true });
      shape(ctx, ellPts(27, -32.5, 3, 6.5, 10), 34, BODY, { jit: 0.2, single: true });
      dot(ctx, 27.6, -32.5, 1.8);
      if (dead) {
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath();
        [[3, -34], [9, -35]].forEach(function (e) { ctx.moveTo(e[0] - 2, e[1] - 2); ctx.lineTo(e[0] + 2, e[1] + 2); ctx.moveTo(e[0] + 2, e[1] - 2); ctx.lineTo(e[0] - 2, e[1] + 2); });
        ctx.stroke();
      } else {
        dot(ctx, 3, -34, 1.9); dot(ctx, 9, -35, 1.9);
      }
    }
    if (o.fly === 'propeller') drawPropHatOn(ctx, t);
    ctx.restore();

    if (dead === 'hit') {
      for (var k = 0; k < 3; k++) {
        var a = t * 0.18 + k * Math.PI * 2 / 3;
        star(ctx, x + Math.cos(a) * 18, y - 50 + Math.sin(a) * 5, 5);
      }
    }
  }
  function drawPropHatOn(ctx, t) {
    shape(ctx, [[-12, -40], [-10, -47], [-4, -51], [4, -51], [10, -47], [12, -40], [0, -39]], 41, '#f4b733', { jit: 0.3, single: true });
    line(ctx, [[-11, -44], [0, -45], [11, -44]], 42, 1.6, '#c9781e');
    line(ctx, [[0, -51], [0, -57]], 43, 2);
    var bw = 15 * Math.abs(Math.cos(t * 0.9));
    ctx.fillStyle = '#e8453c';
    shape(ctx, ellPts(-bw / 2 - 1, -58, bw / 2 + 1.5, 2.6, 8), 44, '#e8453c', { jit: 0.1, single: true, lw: 1.6 });
    shape(ctx, ellPts(bw / 2 + 1, -58, bw / 2 + 1.5, 2.6, 8), 45, '#3d8de0', { jit: 0.1, single: true, lw: 1.6 });
    dot(ctx, 0, -58, 2);
  }
  function drawJetpackOn(ctx, t) {
    // flames
    for (var i = 0; i < 2; i++) {
      var fx = -23.5 + i * 9, fl = 20 + 12 * hash(Math.floor(t / 2), i);
      ctx.beginPath(); ctx.moveTo(fx - 5, -11); ctx.quadraticCurveTo(fx, -11 + fl * 1.5, fx + 5, -11); ctx.closePath();
      ctx.fillStyle = '#ff7a1a'; ctx.fill(); ctx.strokeStyle = '#c8420e'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 2.5, -11); ctx.quadraticCurveTo(fx, -11 + fl * 0.9, fx + 2.5, -11); ctx.closePath();
      ctx.fillStyle = '#ffe34d'; ctx.fill();
    }
    drawJetpackShape(ctx, -19, -26);
  }
  function drawJetpackShape(ctx, cx, cy) {
    for (var i = 0; i < 2; i++) {
      var x = cx - 4.5 + i * 9;
      shape(ctx, rectPts(x - 4.5, cy - 13, 9, 24, 6), 51 + i, '#b9c1cb', { jit: 0.3, single: true, lw: 1.8 });
      shape(ctx, ellPts(x, cy - 13, 4.5, 3, 8), 53 + i, '#e44a3b', { jit: 0.2, single: true, lw: 1.5 });
      shape(ctx, [[x - 3, cy + 11], [x + 3, cy + 11], [x + 4, cy + 15], [x - 4, cy + 15]], 55 + i, '#6f7782', { jit: 0.2, single: true, lw: 1.4 });
    }
    line(ctx, [[cx - 9, cy - 2], [cx + 9, cy - 2]], 57, 1.6, '#555');
  }

  // ---- platforms and items ---------------------------------------------------------
  var PLAT_COL = {
    normal: ['#77c443', '#b9e68c'],
    moving: ['#5db4ec', '#b9e2fb'],
    vmoving: ['#f0be44', '#fbe3a0'],
    breaking: ['#b47c43', '#d9ad7c'],
    vanish: ['#fdfdf9', '#ffffff']
  };
  function drawPlatform(ctx, pl, x, y, t) {
    var w = P.PLAT_W, h = P.PLAT_H, c = PLAT_COL[pl.kind] || PLAT_COL.normal, seed = pl.id * 7;
    ctx.save();
    if (pl.fading) {
      var f = pl.fadeT / 24;
      ctx.globalAlpha = Math.max(0, 1 - f);
      ctx.translate(x, y + h / 2); ctx.scale(1 + f * 0.3, 1 + f * 0.3); ctx.translate(-x, -(y + h / 2));
    }
    if (pl.kind === 'breaking' && pl.broken) {
      var a = Math.min(0.9, pl.breakT * 0.06);
      for (var s = 0; s < 2; s++) {
        var dir = s ? 1 : -1;
        ctx.save();
        ctx.translate(x + dir * (w / 4 + pl.breakT * 0.4), y + h / 2);
        ctx.rotate(dir * a);
        var pts = s ? [[0, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [3, h / 2], [-2, 2], [2, -2]]
                    : [[-w / 2, -h / 2], [0, -h / 2], [2, -2], [-2, 2], [3, h / 2], [-w / 2, h / 2]];
        if (s) pts = pts.map(function (p) { return [p[0] - w / 4, p[1]]; });
        else pts = pts.map(function (p) { return [p[0] + w / 4, p[1]]; });
        shape(ctx, pts, seed + s, c[0], { jit: 0.5, single: true });
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    var ink = pl.kind === 'vanish' ? '#8d8d8d' : INK;
    shape(ctx, rectPts(x - w / 2, y, w, h, 9), seed, c[0], { ink: ink });
    // highlight
    line(ctx, [[x - w / 2 + 6, y + 4], [x, y + 3.6], [x + w / 2 - 6, y + 4]], seed + 3, 2.2, c[1], 0.4);
    if (pl.kind === 'breaking') {
      line(ctx, [[x - 2, y + 1], [x + 2, y + 5], [x - 2, y + 9], [x + 1, y + h - 1]], seed + 5, 1.6, INK, 0.3);
      line(ctx, [[x - 18, y + 8], [x - 11, y + 7]], seed + 6, 1.2, '#7a4f22');
      line(ctx, [[x + 12, y + 9], [x + 19, y + 8]], seed + 7, 1.2, '#7a4f22');
    } else if (pl.kind === 'vmoving') {
      ctx.strokeStyle = '#a67a12'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(x - 15, y + 9); ctx.lineTo(x - 12, y + 5); ctx.lineTo(x - 9, y + 9);
      ctx.moveTo(x + 9, y + 6); ctx.lineTo(x + 12, y + 10); ctx.lineTo(x + 15, y + 6);
      ctx.stroke();
    } else if (pl.kind === 'moving') {
      line(ctx, [[x - 14, y + 9], [x + 14, y + 9]], seed + 8, 1.2, '#3b84b8');
    } else if (pl.kind === 'normal') {
      line(ctx, [[x - 20, y + 10], [x - 14, y + 9.5]], seed + 8, 1.1, '#4d8c25');
      line(ctx, [[x + 10, y + 10], [x + 18, y + 10.4]], seed + 9, 1.1, '#4d8c25');
    }
    ctx.restore();
    if (pl.item && !pl.fading) drawItem(ctx, pl.item, x + pl.item.ox, y, t);
  }

  function drawItem(ctx, it, x, y, t) {
    if (it.used && (it.kind === 'propeller' || it.kind === 'jetpack')) return;
    if (it.kind === 'spring') {
      var ext = it.t > 0, hgt = ext ? 24 : 11;
      ctx.strokeStyle = '#6d737c'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      ctx.beginPath();
      var n = 4;
      ctx.moveTo(x - 6, y);
      for (var i = 1; i <= n; i++) ctx.lineTo(x + (i % 2 ? 7 : -7), y - hgt * i / n + 2);
      ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
      shape(ctx, rectPts(x - 9, y - hgt - 2, 18, 4, 6), 61, '#c8ced6', { jit: 0.2, single: true, lw: 1.8 });
    } else if (it.kind === 'trampoline') {
      var sag = it.t > 0 ? 5 * Math.sin(it.t / 14 * Math.PI) : 0;
      line(ctx, [[x - 15, y], [x - 17, y - 9]], 71, 2.2);
      line(ctx, [[x + 15, y], [x + 17, y - 9]], 72, 2.2);
      ctx.beginPath(); ctx.moveTo(x - 19, y - 10); ctx.quadraticCurveTo(x, y - 10 + sag * 2, x + 19, y - 10);
      ctx.strokeStyle = '#2f6fd0'; ctx.lineWidth = 4; ctx.stroke();
      shape(ctx, rectPts(x - 21, y - 13, 6, 5, 6), 73, '#e44a3b', { jit: 0.2, single: true, lw: 1.5 });
      shape(ctx, rectPts(x + 15, y - 13, 6, 5, 6), 74, '#e44a3b', { jit: 0.2, single: true, lw: 1.5 });
    } else if (it.kind === 'propeller') {
      ctx.save(); ctx.translate(x, y + 39); drawPropHatOn(ctx, 0.6); ctx.restore();
    } else if (it.kind === 'jetpack') {
      ctx.save(); ctx.translate(x, y - 17); drawJetpackShape(ctx, 0, 0); ctx.restore();
    }
  }

  // ---- monsters -----------------------------------------------------------------------
  function teeth(ctx, x1, x2, y, n, h, down) {
    ctx.beginPath();
    var dx = (x2 - x1) / n;
    ctx.moveTo(x1, y);
    for (var i = 0; i < n; i++) { ctx.lineTo(x1 + dx * (i + 0.5), y + (down ? h : -h)); ctx.lineTo(x1 + dx * (i + 1), y); }
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  }
  function drawMonster(ctx, m, x, y, t, px) {
    ctx.save();
    ctx.translate(x, y);
    if (m.dead) {
      if (m.stomped) ctx.scale(1.2, 0.55);
      ctx.rotate(Math.PI);
    }
    var flash = m.hitT > 0 && (m.hitT % 4) < 2;
    var seed = m.id * 13;
    if (m.kind === 'blob') {
      var j = Math.sin(t * 0.15 + m.phase) * 1.2;
      ctx.scale(1 + j * 0.02, 1 - j * 0.02);
      var pts = [];
      for (var i = 0; i < 18; i++) {
        var a = i / 18 * Math.PI * 2, r = (i % 2 ? 19 : 23);
        pts.push([Math.cos(a) * r * 1.05, Math.sin(a) * r * 0.9]);
      }
      shape(ctx, pts, seed, flash ? '#ffffff' : '#7dbb3c', { jit: 1 });
      // mouth
      shape(ctx, ellPts(0, 6, 12, 7, 10), seed + 2, '#7a1b1b', { jit: 0.4, single: true, lw: 1.8 });
      teeth(ctx, -10, 10, 1.5, 5, 4, true);
      dot(ctx, -7, -8, 4.5, '#fff'); dot(ctx, 7, -8, 4.5, '#fff');
      dot(ctx, -6, -7.5, 2); dot(ctx, 8, -7.5, 2);
      line(ctx, [[-12, -15], [-4, -12]], seed + 3, 2);
      line(ctx, [[12, -15], [4, -12]], seed + 4, 2);
      line(ctx, [[-14, 18], [-15, 23]], seed + 5, 2.2);
      line(ctx, [[14, 18], [15, 23]], seed + 6, 2.2);
    } else if (m.kind === 'bat') {
      var fl = Math.sin(t * 0.45 + m.phase);
      for (var s = -1; s <= 1; s += 2) {
        var wy = -4 - fl * 9;
        shape(ctx, [[s * 9, -3], [s * 20, wy - 6], [s * 27, wy - 2], [s * 24, wy + 3], [s * 19, wy + 1], [s * 15, wy + 6], [s * 9, 5]], seed + s + 5, flash ? '#fff' : '#6a46a8', { jit: 0.5 });
      }
      shape(ctx, ellPts(0, 0, 12, 13, 12), seed, flash ? '#fff' : '#8a5fcf', { jit: 0.6 });
      shape(ctx, [[-8, -10], [-6, -18], [-2, -11]], seed + 7, '#8a5fcf', { jit: 0.3, single: true, lw: 1.6 });
      shape(ctx, [[8, -10], [6, -18], [2, -11]], seed + 8, '#8a5fcf', { jit: 0.3, single: true, lw: 1.6 });
      dot(ctx, -4.5, -3, 3.4, '#ffe14a'); dot(ctx, 4.5, -3, 3.4, '#ffe14a');
      dot(ctx, -4, -2.5, 1.5); dot(ctx, 5, -2.5, 1.5);
      line(ctx, [[-5, 5], [0, 7], [5, 5]], seed + 9, 1.6);
      teeth(ctx, -3.5, -1, 5.5, 1, 4, true); teeth(ctx, 1, 3.5, 5.5, 1, 4, true);
    } else if (m.kind === 'cyclops') {
      shape(ctx, [[-14, -14], [-17, -26], [-8, -19]], seed + 1, '#f4efe0', { jit: 0.3, single: true });
      shape(ctx, [[14, -14], [17, -26], [8, -19]], seed + 2, '#f4efe0', { jit: 0.3, single: true });
      line(ctx, [[-10, 18], [-11, 24], [-6, 24]], seed + 3, 2.2);
      line(ctx, [[10, 18], [11, 24], [16, 24]], seed + 4, 2.2);
      shape(ctx, ellPts(0, 0, 20, 21, 14), seed, flash ? '#fff' : '#e4573f', { jit: 0.8 });
      shape(ctx, ellPts(0, -4, 9.5, 9.5, 12), seed + 5, '#fff', { jit: 0.3, single: true, lw: 1.8 });
      var look = px != null ? Math.max(-1, Math.min(1, C.wrapDx(px, m.x) / 60)) : 0;
      dot(ctx, look * 4, -2, 4.2);
      line(ctx, [[-9, 10], [0, 13], [9, 10]], seed + 6, 2);
      teeth(ctx, -6, 6, 11.5, 3, 3.5, true);
    } else if (m.kind === 'big') {
      for (var k = 0; k < 6; k++) {
        var lx = -30 + k * 12, kick = Math.sin(t * 0.3 + k) * 2;
        line(ctx, [[lx, 16], [lx + kick, 25]], seed + 20 + k, 2.4);
      }
      var bp = [[-38, 10], [-36, -8], [-26, -20], [-10, -24], [10, -24], [26, -20], [36, -8], [38, 10], [28, 20], [0, 22], [-28, 20]];
      shape(ctx, bp, seed, flash ? '#fff' : '#4f8ed9', { jit: 1 });
      shape(ctx, [[-24, 4], [24, 4], [16, 14], [-16, 14]], seed + 2, '#5b1717', { jit: 0.4, single: true, lw: 1.8 });
      teeth(ctx, -22, 22, 4.5, 8, 4, true);
      teeth(ctx, -15, 15, 13.5, 6, 3.5, false);
      for (var e = -1; e <= 1; e++) {
        dot(ctx, e * 13, -10 - (e === 0 ? 4 : 0), 5, '#fff'); dot(ctx, e * 13 + 1, -9 - (e === 0 ? 4 : 0), 2.2);
      }
      for (var hp = 0; hp < m.hp && !m.dead; hp++) dot(ctx, -6 + hp * 6, -28, 2, '#e4573f');
    }
    ctx.restore();
  }

  function drawHole(ctx, h, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    var g = ctx.createRadialGradient(0, 0, 4, 0, 0, h.r + 12);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.55, 'rgba(10,8,20,0.95)');
    g.addColorStop(0.8, 'rgba(40,30,70,0.45)');
    g.addColorStop(1, 'rgba(40,30,70,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, h.r + 12, 0, Math.PI * 2); ctx.fill();
    shape(ctx, ellPts(0, 0, h.r, h.r, 16), h.id, '#0c0a14', { jit: 1.6 });
    ctx.rotate(t * 0.06);
    ctx.strokeStyle = 'rgba(160,140,220,0.55)'; ctx.lineWidth = 1.6;
    for (var k = 0; k < 4; k++) {
      ctx.beginPath();
      for (var i = 0; i <= 20; i++) {
        var a = k * Math.PI / 2 + i * 0.16, r = 4 + i * (h.r - 6) / 20;
        if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawUfo(ctx, u, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    if (!u.dead) {
      // beam
      var top = u.h / 2, L = C.UFO.beam;
      var fl = 0.28 + 0.06 * Math.sin(t * 0.3);
      ctx.beginPath();
      ctx.moveTo(-C.UFO.beamTop, top); ctx.lineTo(C.UFO.beamTop, top);
      ctx.lineTo(C.UFO.beamBot, top + L); ctx.lineTo(-C.UFO.beamBot, top + L); ctx.closePath();
      var gr = ctx.createLinearGradient(0, top, 0, top + L);
      gr.addColorStop(0, 'rgba(255,236,110,' + (fl + 0.15) + ')');
      gr.addColorStop(1, 'rgba(255,236,110,0)');
      ctx.fillStyle = gr; ctx.fill();
      ctx.strokeStyle = 'rgba(200,170,40,0.35)'; ctx.lineWidth = 1;
      for (var s = 0; s < 4; s++) {
        var yy = top + ((t * 1.5 + s * L / 4) % L), hw = lerp(C.UFO.beamTop, C.UFO.beamBot, (yy - top) / L);
        ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy); ctx.stroke();
      }
    } else {
      ctx.rotate(Math.PI * 0.9);
    }
    var flash = u.hitT > 0 && (u.hitT % 4) < 2;
    // dome with alien
    shape(ctx, [[-16, -4], [-14, -13], [-7, -19], [7, -19], [14, -13], [16, -4]], u.id + 1, 'rgba(170,220,250,0.9)', { jit: 0.4 });
    dot(ctx, 0, -9, 5.5, '#7ccf52'); dot(ctx, -2, -10, 1.4); dot(ctx, 2, -10, 1.4);
    line(ctx, [[-3, -14], [-5, -19]], u.id + 2, 1.2); line(ctx, [[3, -14], [5, -19]], u.id + 3, 1.2);
    shape(ctx, ellPts(0, 2, u.w / 2, 9, 18), u.id, flash ? '#fff' : '#c4cad3', { jit: 0.6 });
    line(ctx, [[-u.w / 2 + 4, 3], [0, 5], [u.w / 2 - 4, 3]], u.id + 4, 1.4, '#7d848f');
    for (var i = 0; i < 5; i++) {
      var on = (Math.floor(t / 8) + i) % 2 === 0;
      dot(ctx, -24 + i * 12, 4, 2.4, on ? '#ffdf3b' : '#e4573f');
    }
    ctx.restore();
  }

  // ---- particles / fx ------------------------------------------------------------------
  var fx = [];
  function onEvent(e, g) {
    var p = g.player, i;
    switch (e.type) {
      case 'break':
        for (i = 0; i < 6; i++) fx.push({ k: 'chip', x: e.x + (Math.random() - 0.5) * 40, y: e.y + 6, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, life: 40, max: 40, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: '#b47c43' });
        break;
      case 'stomp': case 'kill':
        for (i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; fx.push({ k: 'star', x: e.x, y: e.y, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3, life: 26, max: 26 }); }
        break;
      case 'hit':
        fx.push({ k: 'ring', x: e.x, y: e.y, life: 12, max: 12 });
        break;
      case 'vanish':
        for (i = 0; i < 5; i++) fx.push({ k: 'puff', x: e.x + (i - 2) * 12, y: e.y + 7, vx: (i - 2) * 0.4, vy: -0.5, life: 24, max: 24 });
        break;
      case 'best':
        fx.push({ k: 'text', text: 'new best!', x: p.x, y: p.y - 70, vx: 0, vy: -0.6, life: 90, max: 90, c: '#d23a2a' });
        break;
      case 'spring': case 'trampoline':
        fx.push({ k: 'lines', x: e.x, y: e.y, life: 14, max: 14 });
        break;
    }
  }
  function stepFx(g) {
    var out = [];
    if (g && g.player.fly && g.player.fly.kind === 'jetpack' && g.tick % 3 === 0) {
      var p = g.player;
      fx.push({ k: 'smoke', x: p.x - p.face * 19 + (Math.random() - 0.5) * 6, y: p.y + 14, vx: (Math.random() - 0.5) * 0.6, vy: 1.5, life: 30, max: 30 });
    }
    for (var i = 0; i < fx.length; i++) {
      var f = fx[i];
      f.life--;
      if (f.vx != null) { f.x += f.vx; f.y += f.vy; }
      if (f.k === 'chip') { f.vy += 0.3; f.rot += f.vr; }
      if (f.k === 'star') { f.vx *= 0.92; f.vy *= 0.92; }
      if (f.life > 0) out.push(f);
    }
    fx = out;
  }
  function clearFx() { fx = []; }
  function drawFx(ctx, camY) {
    for (var i = 0; i < fx.length; i++) {
      var f = fx[i], a = f.life / f.max, x = f.x, y = f.y - camY;
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.5);
      if (f.k === 'chip') { ctx.translate(x, y); ctx.rotate(f.rot); ctx.fillStyle = f.c; ctx.fillRect(-4, -2, 8, 4); ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(-4, -2, 8, 4); }
      else if (f.k === 'star') star(ctx, x, y, 5);
      else if (f.k === 'ring') { ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 10 + (1 - a) * 18, 0, Math.PI * 2); ctx.stroke(); }
      else if (f.k === 'smoke') { ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#d9d4c6'; ctx.strokeStyle = '#a49d8c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 3 + (1 - a) * 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      else if (f.k === 'puff') { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 4 + (1 - a) * 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      else if (f.k === 'text') { ctx.font = font(22, true); ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#fffdf3'; ctx.strokeText(f.text, x, y); ctx.fillStyle = f.c; ctx.fillText(f.text, x, y); }
      else if (f.k === 'lines') {
        ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        for (var s = -1; s <= 1; s += 2) { ctx.beginPath(); ctx.moveTo(x + s * 14, y - 4); ctx.lineTo(x + s * (22 + (1 - a) * 6), y - 14 - (1 - a) * 6); ctx.stroke(); }
      }
      ctx.restore();
    }
  }

  // ---- world ------------------------------------------------------------------------------
  function drawWorld(ctx, g, alpha, H) {
    var camY = lerp(g.ocamY, g.camY, alpha), t = g.tick + alpha;
    drawPaper(ctx, H, camY);

    // previous best: a pencil mark on the side
    if (g.best > 0) {
      var by = g.startY - g.best - camY;
      if (by > 46 && by < H + 10) drawBestMark(ctx, by, g.best);
    }
    var i;
    for (i = 0; i < g.holes.length; i++) {
      var h = g.holes[i];
      if (h.y - camY > -60 && h.y - camY < H + 60) drawHole(ctx, h, h.x, h.y - camY, t);
    }
    for (i = 0; i < g.platforms.length; i++) {
      var pl = g.platforms[i];
      var py = lerp(pl.oy, pl.y, alpha) - camY;
      if (py < -60 || py > H + 30) continue;
      var px = Math.abs(pl.x - pl.ox) > 50 ? pl.x : lerp(pl.ox, pl.x, alpha);
      drawPlatform(ctx, pl, px, py, t);
    }
    var p = g.player;
    for (i = 0; i < g.ufos.length; i++) {
      var u = g.ufos[i];
      var uy = lerp(u.oy, u.y, alpha) - camY;
      if (uy > -80 && uy < H + 200) drawUfo(ctx, u, lerp(u.ox, u.x, alpha), uy, t);
    }
    for (i = 0; i < g.monsters.length; i++) {
      var m = g.monsters[i];
      var my = lerp(m.oy, m.y, alpha) - camY;
      if (my > -60 && my < H + 60) drawMonster(ctx, m, lerp(m.ox, m.x, alpha), my, t, p.x);
    }
    for (i = 0; i < g.debris.length; i++) {
      var d = g.debris[i];
      ctx.save(); ctx.translate(d.x, d.y - camY); ctx.rotate(d.rot);
      if (d.kind === 'jetpack') drawJetpackShape(ctx, 0, 0);
      else { ctx.translate(0, 50); drawPropHatOn(ctx, 0.6); }
      ctx.restore();
    }
    // bullets
    for (i = 0; i < g.bullets.length; i++) {
      var b = g.bullets[i];
      var bx = b.x, byy = b.y - b.vy * (1 - alpha) - camY;
      dot(ctx, bx, byy, 4.2, INK); dot(ctx, bx, byy, 2.4, '#f6f0d8');
    }

    // player (drawn twice near the edges so wraparound looks seamless)
    var pxs = Math.abs(p.x - p.ox) > W / 2 ? p.x : lerp(p.ox, p.x, alpha);
    var pys = lerp(p.oy, p.y, alpha) - camY;
    var opts = {
      face: p.face, t: t, squash: p.squash > 0 ? Math.sin(p.squash / 7 * Math.PI) : 0,
      shoot: p.shootT > 0, fly: p.fly ? p.fly.kind : null, dead: p.dead,
      rot: 0, scale: 1
    };
    if (p.flip > 0) opts.rot = (1 - p.flip / 60) * Math.PI * 2 * (p.face > 0 ? 1 : -1);
    if (p.dead === 'hit') opts.rot = Math.sin(p.spin) * 0.25;
    if (p.dead === 'hole') { opts.scale = Math.max(0.05, 1 - p.deadT / 56); opts.rot = p.spin; }
    if (p.dead === 'ufo') { opts.scale = Math.max(0.3, 1 - p.deadT / 100); opts.rot = Math.sin(p.spin * 3) * 0.3; }
    if (p.fly && p.fly.kind === 'propeller') opts.rot = Math.sin(t * 0.12) * 0.06;
    drawDoodler(ctx, pxs, pys, opts);
    if (pxs < 30) drawDoodler(ctx, pxs + W, pys, opts);
    if (pxs > W - 30) drawDoodler(ctx, pxs - W, pys, opts);

    drawFx(ctx, camY);
  }

  function drawBestMark(ctx, y, best) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    line(ctx, [[W - 74, y + 1], [W - 40, y - 0.5], [W - 4, y + 1.5]], 901, 2.2, '#4a4a4a', 0.8);
    line(ctx, [[W - 70, y + 3], [W - 30, y + 2], [W - 8, y + 3.5]], 902, 1, '#6a6a6a', 0.8);
    line(ctx, [[4, y + 1], [22, y], [36, y + 1.5]], 903, 2, '#4a4a4a', 0.8);
    ctx.font = font(12, true); ctx.textAlign = 'right'; ctx.fillStyle = '#4a4a4a';
    ctx.fillText('best ' + best, W - 6, y - 5);
    ctx.restore();
  }

  // ---- HUD ----------------------------------------------------------------------------------
  function tornPts(x, y, w, h, seed, bottomOnly) {
    var pts = [[x, y], [x + w, y]];
    var n = Math.round(w / 9);
    for (var i = n; i >= 0; i--) pts.push([x + w * i / n, y + h + (hash(seed, i) - 0.5) * 7]);
    return pts;
  }
  function polyFill(ctx, pts, fill, stroke) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  function drawHUD(ctx, g, muted) {
    var pts = tornPts(-2, -2, W + 4, 42, 77);
    ctx.save();
    ctx.translate(0, 3);
    polyFill(ctx, pts, 'rgba(60,40,10,0.13)');
    ctx.restore();
    polyFill(ctx, pts, '#fdfbf3', 'rgba(120,110,90,0.45)');
    ctx.font = font(26, true); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = INK;
    ctx.fillText(String(g.score), 12, 30);
    // pause icon
    line(ctx, [[W - 30, 11], [W - 30.5, 21], [W - 30, 31]], 81, 4);
    line(ctx, [[W - 19, 11], [W - 18.5, 21], [W - 19, 31]], 82, 4);
    drawSpeaker(ctx, W - 66, 21, muted, 0.8);
  }
  function drawSpeaker(ctx, x, y, muted, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    shape(ctx, [[-10, -4], [-4, -4], [3, -11], [3, 11], [-4, 4], [-10, 4]], 91, '#fffdf3', { jit: 0.2, single: true, lw: 2.2 });
    if (muted) {
      line(ctx, [[8, -6], [18, 6]], 92, 2.4, '#d23a2a'); line(ctx, [[18, -6], [8, 6]], 93, 2.4, '#d23a2a');
    } else {
      ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(4, 0, 8, -0.8, 0.8); ctx.stroke();
      ctx.beginPath(); ctx.arc(4, 0, 14, -0.75, 0.75); ctx.stroke();
    }
    ctx.restore();
  }
  function drawGear(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    var pts = [];
    for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2, r = (i % 2 ? 9 : 12.5); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    shape(ctx, pts, 95, '#fffdf3', { jit: 0.3, single: true, lw: 2.2 });
    shape(ctx, ellPts(0, 0, 4, 4, 8), 96, '#f7f2e2', { jit: 0.2, single: true, lw: 2 });
    ctx.restore();
  }

  // ---- UI: paper panels and buttons -------------------------------------------------------
  function drawPanel(ctx, x, y, w, h, seed) {
    var pts = [];
    var n = Math.round(w / 14), m = Math.round(h / 14), i;
    for (i = 0; i <= n; i++) pts.push([x + w * i / n, y + (hash(seed, i) - 0.5) * 4]);
    for (i = 1; i < m; i++) pts.push([x + w + (hash(seed + 1, i) - 0.5) * 4, y + h * i / m]);
    for (i = n; i >= 0; i--) pts.push([x + w * i / n, y + h + (hash(seed + 2, i) - 0.5) * 6]);
    for (i = m - 1; i >= 1; i--) pts.push([x + (hash(seed + 3, i) - 0.5) * 4, y + h * i / m]);
    ctx.save(); ctx.translate(3, 5); polyFill(ctx, pts, 'rgba(60,40,10,0.16)'); ctx.restore();
    polyFill(ctx, pts, '#fffdf4', 'rgba(110,100,80,0.6)');
    // ruled lines
    ctx.save();
    ctx.beginPath(); for (i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]); ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(96,140,205,0.22)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var ly = y + 24; ly < y + h; ly += 22) { ctx.moveTo(x, ly + 0.5); ctx.lineTo(x + w, ly + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(220,90,90,0.35)';
    ctx.beginPath(); ctx.moveTo(x + 22.5, y); ctx.lineTo(x + 22.5, y + h); ctx.stroke();
    ctx.restore();
    // tape
    ctx.save();
    ctx.translate(x + w / 2, y + 2); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(240,226,160,0.75)';
    ctx.fillRect(-30, -9, 60, 18);
    ctx.restore();
  }

  function drawButton(ctx, b, hover) {
    if (b.hidden) return;
    var seed = b.seed || 5;
    ctx.save();
    if (b.disabled) ctx.globalAlpha = 0.4;
    var pressed = b.pressed;
    var y = b.y + (pressed ? 2 : 0);
    if (!pressed && b.style !== 'flat') {
      ctx.save(); ctx.translate(2, 3);
      smoothPath(ctx, rectPts(b.x, b.y, b.w, b.h, 12), seed, 0.6);
      ctx.fillStyle = 'rgba(60,40,10,0.18)'; ctx.fill();
      ctx.restore();
    }
    var fill = b.on ? '#ffe27a' : (b.style === 'primary' ? '#9fd96a' : '#fffdf4');
    if (hover && !b.disabled) fill = b.on ? '#ffd84a' : (b.style === 'primary' ? '#b4e886' : '#fff4c9');
    shape(ctx, rectPts(b.x, y, b.w, b.h, 12), seed, fill, { jit: 0.7, lw: 2.2 });
    if (b.icon === 'sound') drawSpeaker(ctx, b.x + b.w / 2 - 3, y + b.h / 2, b.muted, 0.85);
    else if (b.icon === 'gear') drawGear(ctx, b.x + b.w / 2, y + b.h / 2, 0.95);
    else {
      ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = font(b.size || 22, true);
      ctx.fillText(b.label, b.x + b.w / 2, y + b.h / 2 + 1);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
  }

  function text(ctx, s, x, y, size, color, align, bold) {
    ctx.font = font(size, bold !== false);
    ctx.textAlign = align || 'center';
    ctx.fillStyle = color || INK;
    ctx.fillText(s, x, y);
  }
  function wrapText(ctx, s, x, y, maxW, lh, size, color) {
    ctx.font = font(size, false);
    var words = s.split(' '), lineS = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = lineS ? lineS + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && lineS) { text(ctx, lineS, x, yy, size, color, 'center', false); lineS = words[i]; yy += lh; }
      else lineS = test;
    }
    if (lineS) text(ctx, lineS, x, yy, size, color, 'center', false);
    return yy;
  }

  function drawTitle(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.06);
    var word1 = 'doodle', word2 = 'jump';
    ctx.font = font(size, true);
    ctx.textAlign = 'center'; ctx.lineJoin = 'round';
    function wobbleWord(word, wx, wy, col) {
      var total = ctx.measureText(word).width, cx = wx - total / 2;
      for (var i = 0; i < word.length; i++) {
        var ch = word[i], cw = ctx.measureText(ch).width;
        ctx.save();
        ctx.translate(cx + cw / 2, wy + Math.sin(i * 1.7) * 3);
        ctx.rotate((hash(i, wx) - 0.5) * 0.22);
        ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.strokeText(ch, 0, 0);
        ctx.fillStyle = col; ctx.fillText(ch, 0, 0);
        ctx.restore();
        cx += cw;
      }
    }
    wobbleWord(word1, -24, 0, '#d8402f');
    wobbleWord(word2, 50, size * 0.95, '#d8402f');
    ctx.restore();
  }

  window.DJRender = {
    INK: INK, font: font,
    drawPaper: drawPaper, drawWorld: drawWorld, drawHUD: drawHUD, drawDoodler: drawDoodler,
    drawPlatform: drawPlatform, drawMonster: drawMonster, drawUfo: drawUfo, drawHole: drawHole,
    drawPanel: drawPanel, drawButton: drawButton, drawTitle: drawTitle, drawSpeaker: drawSpeaker,
    text: text, wrapText: wrapText, line: line, star: star,
    onEvent: onEvent, stepFx: stepFx, clearFx: clearFx
  };
})();
