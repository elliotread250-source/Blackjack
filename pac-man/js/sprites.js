/* Builds every sprite as a tiny offscreen canvas at arcade resolution.
   They are scaled up with smoothing off, so they stay pixel-sharp. */
'use strict';
(function (PM) {
  var C = PM.COLORS;
  var UP = PM.UP, LEFT = PM.LEFT, DOWN = PM.DOWN, RIGHT = PM.RIGHT;

  function canvas(w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    return cv;
  }
  function plot(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }

  function fromRows(rows, pal, w, h, ox, oy) {
    var cv = canvas(w, h), ctx = cv.getContext('2d');
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x];
        if (ch !== '.' && pal[ch]) plot(ctx, ox + x, oy + y, pal[ch]);
      }
    }
    return cv;
  }

  // --- Pac-Man -----------------------------------------------------------
  // 13x13 disc; the mouth is a wedge cut from the centre toward `dir`.
  function pacCanvas(dir, half, color) {
    var cv = canvas(16, 16), ctx = cv.getContext('2d');
    var fx = [0, -1, 0, 1][dir], fy = [-1, 0, 1, 0][dir];
    var t = half * Math.PI / 180;
    for (var y = 0; y < 13; y++) {
      for (var x = 0; x < 13; x++) {
        var dx = x - 6, dy = y - 6;
        if (dx * dx + dy * dy > 42.25) continue;
        if (half > 0 && (dx !== 0 || dy !== 0)) {
          // angle between pixel and facing direction
          var fwd = dx * fx + dy * fy, side = dx * fy - dy * fx;
          var ang = Math.atan2(Math.abs(side), fwd);
          if (ang <= t + 1e-9) continue;
        }
        plot(ctx, x + 1, y + 1, color);
      }
    }
    return cv;
  }

  // Giant Pac-Man for the intermission, 32x32 facing right.
  function bigPacCanvas(half) {
    var cv = canvas(32, 32), ctx = cv.getContext('2d');
    var t = half * Math.PI / 180;
    ctx.fillStyle = C.pac;
    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 32; x++) {
        var dx = x - 15.5, dy = y - 15.5;
        if (dx * dx + dy * dy > 15.6 * 15.6) continue;
        if (half > 0 && dx > 0 && Math.atan2(Math.abs(dy), dx) <= t) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }

  function burstCanvas(r0, r1) {
    var cv = canvas(16, 16), ctx = cv.getContext('2d');
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4;
      for (var r = r0; r <= r1; r++) {
        plot(ctx, Math.round(7 + Math.cos(a) * r), Math.round(7 + Math.sin(a) * r), C.pac);
      }
    }
    return cv;
  }

  // --- Ghosts ------------------------------------------------------------
  // Eye placement per direction: [whiteX, whiteY, pupilDX, pupilDY]
  var EYES = [];
  EYES[UP] = [2, 1, 1, 0];
  EYES[LEFT] = [1, 3, 0, 2];
  EYES[DOWN] = [2, 4, 1, 3];
  EYES[RIGHT] = [3, 3, 2, 2];
  var WHITE_SHAPE = ['.##.', '####', '####', '####', '.##.'];

  function drawEyes(ctx, dir, ox, oy) {
    var e = EYES[dir];
    for (var i = 0; i < 2; i++) {
      var wx = ox + e[0] + i * 6, wy = oy + e[1];
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 4; x++) if (WHITE_SHAPE[y][x] === '#') plot(ctx, wx + x, wy + y, C.white);
      }
      ctx.fillStyle = C.blue;
      ctx.fillRect(wx + e[2], wy + e[3], 2, 2);
    }
  }

  function ghostCanvas(color, frame, dir) {
    var cv = canvas(16, 16), ctx = cv.getContext('2d');
    var rows = PM.GHOST_BODY.concat(PM.GHOST_SKIRT[frame]);
    ctx.fillStyle = color;
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < 14; x++) if (rows[y][x] === '#') ctx.fillRect(x + 1, y + 1, 1, 1);
    }
    if (dir !== null) drawEyes(ctx, dir, 1, 1);
    return cv;
  }

  function frightCanvas(frame, flash) {
    var body = flash ? C.white : C.blue;
    var face = flash ? C.red : C.peach;
    var cv = ghostCanvas(body, frame, null), ctx = cv.getContext('2d');
    ctx.fillStyle = face;
    ctx.fillRect(1 + 4, 1 + 5, 2, 2);
    ctx.fillRect(1 + 8, 1 + 5, 2, 2);
    var m1 = '..##..##..##..', m2 = '.#..##..##..#.';
    for (var x = 0; x < 14; x++) {
      if (m1[x] === '#') ctx.fillRect(1 + x, 1 + 9, 1, 1);
      if (m2[x] === '#') ctx.fillRect(1 + x, 1 + 10, 1, 1);
    }
    return cv;
  }

  function eyesCanvas(dir) {
    var cv = canvas(16, 16), ctx = cv.getContext('2d');
    drawEyes(ctx, dir, 1, 1);
    return cv;
  }

  // --- Points pop-ups ----------------------------------------------------
  function pointsCanvas(n, color) {
    var s = String(n);
    var w = s.length * 4 - 1;
    var cv = canvas(16, 8), ctx = cv.getContext('2d');
    var ox = Math.floor((16 - w) / 2);
    ctx.fillStyle = color;
    for (var i = 0; i < s.length; i++) {
      var g = PM.MINI[s[i]];
      for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 3; x++) if (g[y][x] === '#') ctx.fillRect(ox + i * 4 + x, 1 + y, 1, 1);
      }
    }
    return cv;
  }

  // --- Font --------------------------------------------------------------
  var fontCache = {};
  var FONT_KEYS = Object.keys(PM.FONT);
  var FONT_INDEX = {};
  FONT_KEYS.forEach(function (k, i) { FONT_INDEX[k] = i; });

  PM.fontAtlas = function (color) {
    if (fontCache[color]) return fontCache[color];
    var cv = canvas(FONT_KEYS.length * 8, 8), ctx = cv.getContext('2d');
    ctx.fillStyle = color;
    FONT_KEYS.forEach(function (k, i) {
      var g = PM.FONT[k];
      for (var y = 0; y < 7; y++) {
        for (var x = 0; x < 7; x++) if (g[y][x] === '#') ctx.fillRect(i * 8 + x, y, 1, 1);
      }
    });
    fontCache[color] = cv;
    return cv;
  };
  PM.glyphIndex = function (ch) {
    var i = FONT_INDEX[ch];
    return i === undefined ? FONT_INDEX[' '] : i;
  };

  // --- Build everything --------------------------------------------------
  PM.buildSprites = function () {
    var S = {};
    // Pac-Man: [dir][0 closed, 1 half, 2 wide]
    S.pac = [];
    for (var d = 0; d < 4; d++) S.pac[d] = [pacCanvas(d, 0, C.pac), pacCanvas(d, 24, C.pac), pacCanvas(d, 46, C.pac)];
    S.pacDeath = [];
    [16, 34, 52, 70, 88, 106, 124, 142, 160, 176].forEach(function (a) { S.pacDeath.push(pacCanvas(UP, a, C.pac)); });
    S.burst = [burstCanvas(3, 6), burstCanvas(5, 7)];
    S.life = pacCanvas(LEFT, 46, C.pac);
    S.bigPac = [bigPacCanvas(0), bigPacCanvas(24), bigPacCanvas(46)];

    var ghostColors = { blinky: C.red, pinky: C.pink, inky: C.cyan, clyde: C.orange };
    S.ghost = {};
    Object.keys(ghostColors).forEach(function (name) {
      S.ghost[name] = [[], []];
      for (var f = 0; f < 2; f++) for (var dd = 0; dd < 4; dd++) S.ghost[name][f][dd] = ghostCanvas(ghostColors[name], f, dd);
    });
    S.fright = [[frightCanvas(0, false), frightCanvas(1, false)], [frightCanvas(0, true), frightCanvas(1, true)]];
    S.eyes = [eyesCanvas(UP), eyesCanvas(LEFT), eyesCanvas(DOWN), eyesCanvas(RIGHT)];

    S.ghostPts = {};
    [200, 400, 800, 1600].forEach(function (n) { S.ghostPts[n] = pointsCanvas(n, C.cyan); });
    S.fruitPts = {};
    PM.FRUITS.forEach(function (f) { S.fruitPts[f.pts] = pointsCanvas(f.pts, C.pink); });

    S.fruit = PM.FRUITS.map(function (f) {
      var art = PM.FRUIT_ART[f.name];
      var w = art.rows[0].length, h = art.rows.length;
      return fromRows(art.rows, art.pal, 16, 16, Math.floor((16 - w) / 2), Math.floor((16 - h) / 2) + 1);
    });
    S.energizer = fromRows(PM.ENERGIZER, { '#': C.dot }, 8, 8, 0, 0);
    return S;
  };
})(window.PM);
