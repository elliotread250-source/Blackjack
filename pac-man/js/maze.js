/* Maze geometry and the wall renderer.

   The arcade draws its walls as thin blue lines running through the middle
   of the boundary wall tiles, with rounded corners, plus a second line on
   the outer border and the ghost house. We get the same picture from the
   tile map with a distance field:

     C   = every point at least one tile (8px) away from any corridor
     f(p) = distance from p to C

   The single wall line is the contour f = 4 (half a tile off the corridor,
   rounded at every corner); the outer border's second line is f = 1, drawn
   only on the border band, which also gives the narrow "U" tabs that poke
   into the maze at the top and sides. */
'use strict';
(function (PM) {
  var MAZE = PM.MAZE;

  // Tile lookup in screen tile coordinates (28 x 36, maze rows 3..33).
  PM.tileChar = function (c, r) {
    if (r >= 3 && r <= 33 && c >= 0 && c <= 27) return MAZE[r - 3][c];
    if (r === 17) return ' '; // the tunnel continues off screen
    return '#';
  };
  PM.isPath = function (ch) { return ch === '.' || ch === 'o' || ch === ' '; };
  PM.passable = function (c, r) { return PM.isPath(PM.tileChar(c, r)); };
  PM.isRestricted = function (c, r) { return (r === 14 || r === 26) && (c === 12 || c === 15); };
  PM.inTunnel = function (c, r) { return r === 17 && (c <= 5 || c >= 22); };

  PM.countMapDots = function () {
    var dots = 0, energizers = 0;
    for (var r = 0; r < MAZE.length; r++) {
      for (var c = 0; c < 28; c++) {
        if (MAZE[r][c] === '.') dots++;
        else if (MAZE[r][c] === 'o') energizers++;
      }
    }
    return { dots: dots, energizers: energizers };
  };

  // ---------------------------------------------------------------------
  // Distance field, computed once in maze pixel space (224 x 248) at R
  // samples per pixel.
  var R = 4, MW = 224, MH = 248;
  var GW = MW * R + 1, GH = MH * R + 1;
  var field = null;      // Float32Array of distances in maze pixels
  var borderTile = null; // Uint8Array 28x31: wall/void tiles connected to the screen edge

  function inHouse(c, r) { return c >= 10 && c <= 17 && r >= 12 && r <= 16; }

  // Corridor-ness for the field, maze tile coords (rows 0..30). The house
  // counts as open so no contour is generated inside it (drawn by hand).
  function openTile(c, r) {
    if (r === 14 && (c < 0 || c > 27)) return true;
    if (c < 0 || c > 27 || r < 0 || r > 30) return false;
    if (inHouse(c, r)) return true;
    var ch = MAZE[r][c];
    return ch === '.' || ch === 'o' || ch === ' ';
  }

  function computeBorder() {
    borderTile = new Uint8Array(28 * 31);
    var stack = [];
    var solid = function (c, r) {
      var ch = MAZE[r][c];
      return (ch === '#' || ch === '_') && !inHouse(c, r);
    };
    for (var r = 0; r < 31; r++) {
      for (var c = 0; c < 28; c++) {
        if ((r === 0 || r === 30 || c === 0 || c === 27) && solid(c, r)) {
          borderTile[r * 28 + c] = 1;
          stack.push(c, r);
        }
      }
    }
    while (stack.length) {
      var y = stack.pop(), x = stack.pop();
      for (var d = 0; d < 4; d++) {
        var nx = x + PM.DX[d], ny = y + PM.DY[d];
        if (nx < 0 || nx > 27 || ny < 0 || ny > 30) continue;
        var k = ny * 28 + nx;
        if (!borderTile[k] && solid(nx, ny)) { borderTile[k] = 1; stack.push(nx, ny); }
      }
    }
  }

  // 1-D squared distance transform (Felzenszwalb & Huttenlocher).
  function edt1d(f, n, d, v, z) {
    var k = 0;
    v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (var q = 1; q < n; q++) {
      var s;
      do {
        var p = v[k];
        s = ((f[q] + q * q) - (f[p] + p * p)) / (2 * q - 2 * p);
        if (s <= z[k]) k--; else break;
      } while (k >= 0);
      k++;
      v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (var q2 = 0; q2 < n; q2++) {
      while (z[k + 1] < q2) k++;
      var dq = q2 - v[k];
      d[q2] = dq * dq + f[v[k]];
    }
  }

  function computeField() {
    var INF = 1e20;
    var grid = new Float64Array(GW * GH);
    // Open-tile lookup with a one-tile margin.
    var open = new Uint8Array(30 * 33);
    for (var r = -1; r <= 31; r++) {
      for (var c = -1; c <= 28; c++) open[(r + 1) * 30 + (c + 1)] = openTile(c, r) ? 1 : 0;
    }
    var lim = 8 - 1e-6;
    for (var j = 0; j < GH; j++) {
      var py = j / R;
      var tr = Math.min(Math.floor(py / 8), 30);
      for (var i = 0; i < GW; i++) {
        var px = i / R;
        var tc = Math.min(Math.floor(px / 8), 27);
        var near = false;
        for (var dr = -1; dr <= 1 && !near; dr++) {
          var rr = tr + dr;
          if (rr < -1 || rr > 31) continue;
          for (var dc = -1; dc <= 1; dc++) {
            var cc = tc + dc;
            if (cc < -1 || cc > 28) continue;
            if (!open[(rr + 1) * 30 + (cc + 1)]) continue;
            var x0 = cc * 8, y0 = rr * 8;
            var ddx = px < x0 ? x0 - px : (px > x0 + 8 ? px - x0 - 8 : 0);
            var ddy = py < y0 ? y0 - py : (py > y0 + 8 ? py - y0 - 8 : 0);
            if (ddx * ddx + ddy * ddy < lim * lim) { near = true; break; }
          }
        }
        grid[j * GW + i] = near ? INF : 0;
      }
    }
    // 2-D EDT: columns then rows.
    var n = Math.max(GW, GH);
    var f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
    for (var x = 0; x < GW; x++) {
      for (var y = 0; y < GH; y++) f[y] = grid[y * GW + x];
      edt1d(f, GH, d, v, z);
      for (var y2 = 0; y2 < GH; y2++) grid[y2 * GW + x] = d[y2];
    }
    for (var y3 = 0; y3 < GH; y3++) {
      var off = y3 * GW;
      for (var x2 = 0; x2 < GW; x2++) f[x2] = grid[off + x2];
      edt1d(f, GW, d, v, z);
      for (var x3 = 0; x3 < GW; x3++) grid[off + x3] = d[x3];
    }
    field = new Float32Array(GW * GH);
    for (var k = 0; k < field.length; k++) field[k] = Math.sqrt(grid[k]) / R;
  }

  function sample(px, py) {
    var gx = px * R, gy = py * R;
    if (gx < 0) gx = 0; if (gy < 0) gy = 0;
    if (gx > GW - 1.001) gx = GW - 1.001;
    if (gy > GH - 1.001) gy = GH - 1.001;
    var ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
    var k = iy * GW + ix;
    var a = field[k], b = field[k + 1], c = field[k + GW], e = field[k + GW + 1];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + e * fx) * fy;
  }

  // Render the maze walls (no door) into a canvas at S device px per maze px.
  PM.buildMaze = function (S) {
    if (!field) { computeBorder(); computeField(); }
    var W = Math.max(1, Math.round(MW * S)), H = Math.max(1, Math.round(MH * S));
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(W, H);
    var data = img.data;
    var lineW = 1.0;
    var half = Math.max(lineW * S, 1.2) / 2;
    var col = [0x21, 0x21, 0xDE];
    for (var v = 0; v < H; v++) {
      var py = (v + 0.5) / S;
      var trow = Math.floor(py / 8);
      for (var u = 0; u < W; u++) {
        var px = (u + 0.5) / S;
        if (px > 80 && px < 144 && py > 96 && py < 136) continue; // ghost house, drawn below
        var fv = sample(px, py);
        if (fv > 5.5) continue;
        var a = half + 0.5 - Math.abs(fv - 4) * S;
        var tcol = Math.floor(px / 8);
        var onBorder = tcol < 0 || tcol > 27 || trow < 0 || trow > 30 || borderTile[trow * 28 + tcol];
        if (onBorder) {
          var a2 = half + 0.5 - Math.abs(fv - 1) * S;
          if (a2 > a) a = a2;
        }
        if (a <= 0) continue;
        if (a > 1) a = 1;
        var o = (v * W + u) * 4;
        data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(img, 0, 0);

    // Ghost house: square-cornered double line with a gap for the door.
    ctx.save();
    ctx.scale(W / MW, H / MH);
    ctx.strokeStyle = PM.COLORS.wall;
    ctx.lineWidth = Math.max(lineW, 1.2 / S);
    ctx.lineJoin = 'miter';
    ctx.beginPath();
    ctx.moveTo(104, 100); ctx.lineTo(84, 100); ctx.lineTo(84, 132); ctx.lineTo(140, 132); ctx.lineTo(140, 100); ctx.lineTo(120, 100);
    ctx.moveTo(104, 103); ctx.lineTo(87, 103); ctx.lineTo(87, 129); ctx.lineTo(137, 129); ctx.lineTo(137, 103); ctx.lineTo(120, 103);
    ctx.moveTo(104, 100); ctx.lineTo(104, 103);
    ctx.moveTo(120, 100); ctx.lineTo(120, 103);
    ctx.stroke();
    ctx.restore();

    // White copy for the end-of-level flash.
    var white = document.createElement('canvas');
    white.width = W; white.height = H;
    var wc = white.getContext('2d');
    wc.drawImage(cv, 0, 0);
    wc.globalCompositeOperation = 'source-in';
    wc.fillStyle = '#FFFFFF';
    wc.fillRect(0, 0, W, H);
    return { blue: cv, white: white, w: W, h: H };
  };
})(window.PM);
