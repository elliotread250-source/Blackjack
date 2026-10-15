/* Pixel-art sprites, hand-drawn on the original 16px cell grid and rendered
   at any size. Each art pixel is snapped to device pixels (edges rounded,
   no smoothing), so the classic look stays crisp at 23px or 46px cells. */
(function () {
  'use strict';

  var COL = {
    W: '#ffffff', G: '#808080', L: '#c0c0c0', K: '#000000',
    R: '#ff0000', Y: '#ffff00', D: '#7b7b00'
  };

  // Windows number colours.
  var NUM = [null, '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];

  // 8x10 bold numerals, drawn at (4,3) inside the 16x16 cell.
  var DIGITS = {
    1: ['...###..', '..####..', '.#####..', '...###..', '...###..', '...###..', '...###..', '...###..', '.#######', '.#######'],
    2: ['.######.', '########', '.....###', '.....###', '.######.', '######..', '###.....', '###.....', '########', '########'],
    3: ['#######.', '########', '.....###', '.....###', '..#####.', '..#####.', '.....###', '.....###', '########', '#######.'],
    4: ['###..###', '###..###', '###..###', '###..###', '########', '########', '.....###', '.....###', '.....###', '.....###'],
    5: ['########', '########', '###.....', '###.....', '#######.', '########', '.....###', '.....###', '########', '#######.'],
    6: ['.#######', '########', '###.....', '###.....', '#######.', '########', '###..###', '###..###', '########', '.######.'],
    7: ['########', '########', '.....###', '.....###', '....###.', '....###.', '...###..', '...###..', '...###..', '...###..'],
    8: ['.######.', '########', '###..###', '###..###', '.######.', '.######.', '###..###', '###..###', '########', '.######.']
  };

  var QMARK = ['..####..', '.######.', '###..###', '.....###', '....###.', '...###..', '...###..', '........', '...###..', '...###..'];

  var FLAG = [
    '................',
    '................',
    '................',
    '......RRK.......',
    '....RRRRK.......',
    '..RRRRRRK.......',
    '....RRRRK.......',
    '......RRK.......',
    '........K.......',
    '........K.......',
    '......KKKK......',
    '....KKKKKKKK....',
    '....KKKKKKKK....',
    '................',
    '................',
    '................'
  ];

  var MINE = [
    '................',
    '................',
    '........K.......',
    '........K.......',
    '....K.KKKKK.K...',
    '.....KKKKKKK....',
    '....KKWWKKKKK...',
    '....KKWWKKKKK...',
    '..KKKKKKKKKKKKK.',
    '....KKKKKKKKK...',
    '....KKKKKKKKK...',
    '.....KKKKKKK....',
    '....K.KKKKK.K...',
    '........K.......',
    '........K.......',
    '................'
  ];

  // 17x17 faces.
  var FACE_BASE = [
    '......KKKKK......',
    '....KKYYYYYKK....',
    '...KYYYYYYYYYK...',
    '..KYYYYYYYYYYYK..',
    '.KYYYYYYYYYYYYYK.',
    '.KYYYYYYYYYYYYYK.',
    'KYYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYYK',
    '.KYYYYYYYYYYYYYK.',
    '.KYYYYYYYYYYYYYK.',
    '..KYYYYYYYYYYYK..',
    '...KYYYYYYYYYK...',
    '....KKYYYYYKK....',
    '......KKKKK......'
  ];
  // Features as [x, y] pixel lists over the base.
  function px(list) { return list.map(function (p) { return p; }); }
  var EYES = px([[5, 5], [6, 5], [5, 6], [6, 6], [10, 5], [11, 5], [10, 6], [11, 6]]);
  var FEATURES = {
    smile: EYES.concat([[4, 10], [12, 10], [5, 11], [11, 11], [6, 12], [7, 12], [8, 12], [9, 12], [10, 12]]),
    oh: px([[5, 4], [6, 4], [5, 5], [6, 5], [5, 6], [6, 6], [10, 4], [11, 4], [10, 5], [11, 5], [10, 6], [11, 6],
      [7, 9], [8, 9], [9, 9], [6, 10], [10, 10], [6, 11], [10, 11], [6, 12], [10, 12], [7, 13], [8, 13], [9, 13]]),
    cool: px([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5],
      [2, 4], [14, 4],
      [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6],
      [4, 7], [5, 7], [6, 7], [10, 7], [11, 7], [12, 7],
      [4, 10], [12, 10], [5, 11], [11, 11], [6, 12], [7, 12], [8, 12], [9, 12], [10, 12]]),
    dead: px([[4, 4], [6, 4], [5, 5], [4, 6], [6, 6], [10, 4], [12, 4], [11, 5], [10, 6], [12, 6],
      [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [5, 11], [11, 11], [4, 12], [12, 12]])
  };
  // Sunglasses glint.
  var GLINT = { cool: [[4, 6, 'W'], [10, 6, 'W']] };

  // 7-segment LCD digit: 13x23 cell, segments as [x, y, w, h] runs.
  var SEG = {
    a: [[2, 1, 9, 1], [3, 2, 7, 1], [4, 3, 5, 1]],
    b: [[11, 2, 1, 9], [10, 3, 1, 7], [9, 4, 1, 5]],
    c: [[11, 12, 1, 9], [10, 13, 1, 7], [9, 14, 1, 5]],
    d: [[2, 21, 9, 1], [3, 20, 7, 1], [4, 19, 5, 1]],
    e: [[1, 12, 1, 9], [2, 13, 1, 7], [3, 14, 1, 5]],
    f: [[1, 2, 1, 9], [2, 3, 1, 7], [3, 4, 1, 5]],
    g: [[3, 10, 7, 1], [2, 11, 9, 1], [3, 12, 7, 1]]
  };
  var SEGS_FOR = {
    '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd',
    '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', ' ': ''
  };
  var LCD_ON = '#ff0000', LCD_OFF = '#2c0000';

  // --- snapped drawing primitives -----------------------------------------
  // (sx, sy) = device pixels per art pixel; (ox, oy) = device offset.
  function rect(ctx, ox, oy, sx, sy, x, y, w, h) {
    var x0 = Math.round(x * sx), y0 = Math.round(y * sy);
    var x1 = Math.round((x + w) * sx), y1 = Math.round((y + h) * sy);
    if (x1 > x0 && y1 > y0) ctx.fillRect(ox + x0, oy + y0, x1 - x0, y1 - y0);
  }

  function art(ctx, ox, oy, sx, sy, rows, gx, gy, colorOverride) {
    for (var y = 0; y < rows.length; y++) {
      var r = rows[y], x = 0;
      while (x < r.length) {
        var ch = r.charAt(x);
        if (ch === '.') { x++; continue; }
        var e = x + 1;
        while (e < r.length && r.charAt(e) === ch) e++;
        ctx.fillStyle = colorOverride || COL[ch];
        rect(ctx, ox, oy, sx, sy, gx + x, gy + y, e - x, 1);
        x = e;
      }
    }
  }

  // Windows 3D bevel, b rings thick: light top/left, dark bottom/right,
  // with the classic diagonal split in the off corners.
  function bevel(ctx, ox, oy, sx, sy, x, y, w, h, b, light, dark) {
    for (var i = 0; i < b; i++) {
      ctx.fillStyle = light;
      rect(ctx, ox, oy, sx, sy, x, y + i, w - 1 - i, 1);
      rect(ctx, ox, oy, sx, sy, x + i, y, 1, h - 1 - i);
      ctx.fillStyle = dark;
      rect(ctx, ox, oy, sx, sy, x + w - 1 - i, y + i, 1, h - i);
      rect(ctx, ox, oy, sx, sy, x + i, y + h - 1 - i, w - i, 1);
    }
  }

  function makeCanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = Math.max(1, w); c.height = Math.max(1, h);
    return c;
  }

  // --- cells -----------------------------------------------------------------
  function cellBase(ctx, s, kind, bg) {
    if (kind === 'up') {
      ctx.fillStyle = COL.L; rect(ctx, 0, 0, s, s, 0, 0, 16, 16);
      bevel(ctx, 0, 0, s, s, 0, 0, 16, 16, 2, COL.W, COL.G);
    } else {
      ctx.fillStyle = COL.L; rect(ctx, 0, 0, s, s, 0, 0, 16, 16);
      if (bg) { ctx.fillStyle = bg; rect(ctx, 0, 0, s, s, 1, 1, 15, 15); }
      ctx.fillStyle = COL.G;
      rect(ctx, 0, 0, s, s, 0, 0, 16, 1);
      rect(ctx, 0, 0, s, s, 0, 0, 1, 16);
    }
  }

  function cellSprites(size) {
    var s = size / 16, out = {};
    function make(name, fn) {
      var c = makeCanvas(size, size), ctx = c.getContext('2d');
      fn(ctx);
      out[name] = c;
    }
    make('up', function (ctx) { cellBase(ctx, s, 'up'); });
    make('down', function (ctx) { cellBase(ctx, s, 'down'); });
    for (var n = 1; n <= 8; n++) {
      (function (n) {
        make('n' + n, function (ctx) {
          cellBase(ctx, s, 'down');
          art(ctx, 0, 0, s, s, DIGITS[n], 4, 3, NUM[n]);
        });
      })(n);
    }
    out.n0 = out.down;
    make('flag', function (ctx) { cellBase(ctx, s, 'up'); art(ctx, 0, 0, s, s, FLAG, 0, 0); });
    make('q', function (ctx) { cellBase(ctx, s, 'up'); art(ctx, 0, 0, s, s, QMARK, 4, 3, COL.K); });
    make('qdown', function (ctx) { cellBase(ctx, s, 'down'); art(ctx, 0, 0, s, s, QMARK, 4, 3, COL.K); });
    make('mine', function (ctx) { cellBase(ctx, s, 'down'); art(ctx, 0, 0, s, s, MINE, 0, 0); });
    make('boom', function (ctx) { cellBase(ctx, s, 'down', COL.R); art(ctx, 0, 0, s, s, MINE, 0, 0); });
    make('wrong', function (ctx) {
      cellBase(ctx, s, 'down');
      art(ctx, 0, 0, s, s, MINE, 0, 0);
      ctx.fillStyle = COL.R;
      for (var t = 2; t <= 13; t++) {
        rect(ctx, 0, 0, s, s, t, t + 1, 2, 1);
        rect(ctx, 0, 0, s, s, 15 - t, t + 1, 2, 1);
      }
    });
    return out;
  }

  // --- face button (26x26 art pixels) -----------------------------------------
  function drawFace(canvas, mood, pressed) {
    var ctx = canvas.getContext('2d');
    var sx = canvas.width / 26, sy = canvas.height / 26;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COL.L; rect(ctx, 0, 0, sx, sy, 0, 0, 26, 26);
    ctx.fillStyle = COL.G;
    rect(ctx, 0, 0, sx, sy, 0, 0, 26, 1); rect(ctx, 0, 0, sx, sy, 0, 25, 26, 1);
    rect(ctx, 0, 0, sx, sy, 0, 0, 1, 26); rect(ctx, 0, 0, sx, sy, 25, 0, 1, 26);
    var off = 4;
    if (pressed) {
      rect(ctx, 0, 0, sx, sy, 1, 1, 24, 1); rect(ctx, 0, 0, sx, sy, 1, 1, 1, 24);
      off = 5;
    } else {
      bevel(ctx, 0, 0, sx, sy, 1, 1, 24, 24, 2, COL.W, COL.G);
    }
    art(ctx, 0, 0, sx, sy, FACE_BASE, off, off);
    var f = FEATURES[mood] || FEATURES.smile;
    ctx.fillStyle = COL.K;
    for (var i = 0; i < f.length; i++) rect(ctx, 0, 0, sx, sy, off + f[i][0], off + f[i][1], 1, 1);
    var g = GLINT[mood];
    if (g) for (i = 0; i < g.length; i++) { ctx.fillStyle = COL[g[i][2]]; rect(ctx, 0, 0, sx, sy, off + g[i][0], off + g[i][1], 1, 1); }
  }

  // --- LCD counter (41x25 art pixels) ------------------------------------------
  function lcdText(value) {
    value = Math.round(value);
    if (value > 999) value = 999;
    if (value < -99) value = -99;
    if (value < 0) { var a = String(-value); return '-' + (a.length < 2 ? '0' + a : a); }
    var s = String(value);
    while (s.length < 3) s = '0' + s;
    return s;
  }

  function drawLCD(canvas, value) {
    var ctx = canvas.getContext('2d');
    var sx = canvas.width / 41, sy = canvas.height / 25;
    var text = typeof value === 'string' ? value : lcdText(value);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    bevel(ctx, 0, 0, sx, sy, 0, 0, 41, 25, 1, COL.G, COL.W);
    for (var d = 0; d < 3; d++) {
      var on = SEGS_FOR[text.charAt(d)] || '';
      for (var k in SEG) {
        ctx.fillStyle = on.indexOf(k) >= 0 ? LCD_ON : LCD_OFF;
        var runs = SEG[k];
        for (var r = 0; r < runs.length; r++) {
          rect(ctx, 0, 0, sx, sy, 1 + d * 13 + runs[r][0], 1 + runs[r][1], runs[r][2], runs[r][3]);
        }
      }
    }
  }

  // Inline SVG of an art grid (menu/title icons): crisp at any CSS size.
  function svgFromArt(rows, colors) {
    var h = rows.length, w = rows[0].length, parts = [];
    for (var y = 0; y < h; y++) {
      var r = rows[y], x = 0;
      while (x < w) {
        var ch = r.charAt(x);
        if (ch === '.') { x++; continue; }
        var e = x + 1;
        while (e < w && r.charAt(e) === ch) e++;
        parts.push('<rect x="' + x + '" y="' + y + '" width="' + (e - x) + '" height="1" fill="' + ((colors && colors[ch]) || COL[ch]) + '"/>');
        x = e;
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges" aria-hidden="true">' + parts.join('') + '</svg>';
  }

  window.MSSprites = {
    cellSprites: cellSprites,
    drawFace: drawFace,
    drawLCD: drawLCD,
    lcdText: lcdText,
    svgFromArt: svgFromArt,
    FLAG: FLAG,
    MINE: MINE
  };
})();
