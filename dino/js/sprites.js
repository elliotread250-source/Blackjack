/* Dino Run: hand-made pixel art.
 *
 * Every sprite is a small bitmap typed in as text below (or, for the cacti,
 * clouds, moon and ground, built from a few numbers) and turned into lists
 * of horizontal runs. Drawing is just fillRect per run on the 600x150 buffer,
 * which keeps every pixel crisp and lets any palette recolour it for free.
 *
 * The T-Rex and pterodactyl are drawn on a 2 px grid like the original; the
 * cacti, text and scenery use single pixels where it helps.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.DinoSprites = factory(root.DinoCore);
}(typeof self !== 'undefined' ? self : this, function (Core) {
  'use strict';

  var C = Core.C;

  // ------------------------------------------------------------------ bitmaps
  function blank(w, h) { return { w: w, h: h, px: new Uint8Array(w * h) }; }
  function set(bm, x, y, v) { if (x >= 0 && y >= 0 && x < bm.w && y < bm.h) bm.px[y * bm.w + x] = v; }
  function get(bm, x, y) { return (x >= 0 && y >= 0 && x < bm.w && y < bm.h) ? bm.px[y * bm.w + x] : 0; }

  // Text art -> bitmap. '.' is empty, 'X' colour 1, 'o' colour 2. Each
  // character is a `block`-pixel square starting at (ox, oy).
  function fromArt(rows, w, h, block, ox, oy) {
    var bm = blank(w, h);
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var ch = rows[r][c];
        var v = ch === 'X' ? 1 : ch === 'o' ? 2 : 0;
        if (!v) continue;
        for (var dy = 0; dy < block; dy++) {
          for (var dx = 0; dx < block; dx++) set(bm, ox + c * block + dx, oy + r * block + dy, v);
        }
      }
    }
    return bm;
  }

  // Bitmap -> runs [x, y, len, colour] for fast drawing.
  function toRuns(bm) {
    var runs = [];
    for (var y = 0; y < bm.h; y++) {
      var x = 0;
      while (x < bm.w) {
        var v = bm.px[y * bm.w + x];
        if (!v) { x++; continue; }
        var x0 = x;
        while (x < bm.w && bm.px[y * bm.w + x] === v) x++;
        runs.push([x0, y, x - x0, v]);
      }
    }
    return runs;
  }

  function sprite(bm) { return { w: bm.w, h: bm.h, bm: bm, runs: toRuns(bm) }; }

  // ------------------------------------------------------------------ T-Rex
  // 22x22 cells of 2 px, offset by 1 px inside the 44x47 frame (the original
  // sprite's transparent border), so the collision boxes line up exactly.
  var TREX_TOP = [
    '............XXXXXXXX..',
    '...........XX.XXXXXXX.',
    '...........XXXXXXXXXX.',
    '...........XXXXXXXXXX.',
    '...........XXXXXXXXXX.',
    '...........XXXXX......',
    '...........XXXXXXXX...',
    'X.........XXXXX.......',
    'X........XXXXXX.......',
    'XX......XXXXXXXXXX....',
    'XXX....XXXXXXXX..X....',
    'XXXX..XXXXXXXXX.......',
    'XXXXXXXXXXXXXXX.......',
    'XXXXXXXXXXXXXXX.......',
    '.XXXXXXXXXXXXX........',
    '..XXXXXXXXXXXX........',
    '...XXXXXXXXXX.........',
    '....XXXXXXXX..........'
  ];
  var LEGS_STAND = [
    '.....XXX.XX...........',
    '.....XX...X...........',
    '.....X....X...........',
    '.....XX...XX..........'
  ];
  var LEGS_RUN_A = [   // back leg lifted
    '.....XX..XX...........',
    '......XX..X...........',
    '..........X...........',
    '..........XX..........'
  ];
  var LEGS_RUN_B = [   // front leg lifted
    '.....XXX.XX...........',
    '.....XX...XX..........',
    '.....X................',
    '.....XX...............'
  ];

  function trexFrame(top, legs) {
    return fromArt(top.concat(legs), C.TREX_WIDTH, C.TREX_HEIGHT, 2, 1, 1);
  }

  var standBm = trexFrame(TREX_TOP, LEGS_STAND);

  var blinkTop = TREX_TOP.slice();
  blinkTop[1] = '...........XXXXXXXXXX.';
  var blinkBm = trexFrame(blinkTop, LEGS_STAND);

  // Crashed: X eyes, jaw dropped.
  var crashTop = TREX_TOP.slice();
  crashTop[5] = '...........XXXX.......';
  crashTop[6] = '...........XXXX.......';
  crashTop[7] = 'X.........XXXXXXXX....';
  var crashBm = trexFrame(crashTop, LEGS_STAND);
  (function () {
    // A 6x6 hole where the eye was, with a 4x4 cross in it.
    for (var y = 3; y < 9; y++) for (var x = 25; x < 31; x++) set(crashBm, x, y, 0);
    for (var i = 0; i < 4; i++) {
      set(crashBm, 26 + i, 4 + i, 1);
      set(crashBm, 29 - i, 4 + i, 1);
    }
  }());

  // Ducking: 29x13 cells drawn in the bottom of a 59x47 frame.
  var DUCK_BODY = [
    'X.....XXXXXXXXXXX....XXXXXXX.',
    'XX..XXXXXXXXXXXXXXXXXX.XXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    '..XXXXXXXXXXXXXXXXXXXXXXX....',
    '...XXXXXXXXXXXXXXXXXXXXXXXX..',
    '....XXXXXXXXXXXXXXXXX........',
    '.....XXXXXXXXXXXXX.XX........',
    '......XXXXXXXXXX.....X.......'
  ];
  var DUCK_LEGS_A = [
    '.......XX..XX................',
    '........XX..X................',
    '............X................',
    '............XX...............'
  ];
  var DUCK_LEGS_B = [
    '.......XXX.XX................',
    '.......XX...XX...............',
    '.......X.....................',
    '.......XX....................'
  ];
  function duckFrame(legs) {
    return fromArt(DUCK_BODY.concat(legs), C.TREX_WIDTH_DUCK, C.TREX_HEIGHT, 2, 1, 19);
  }

  var TREX = {
    stand: sprite(standBm),
    blink: sprite(blinkBm),
    run: [sprite(trexFrame(TREX_TOP, LEGS_RUN_A)), sprite(trexFrame(TREX_TOP, LEGS_RUN_B))],
    duck: [sprite(duckFrame(DUCK_LEGS_A)), sprite(duckFrame(DUCK_LEGS_B))],
    crash: sprite(crashBm)
  };

  // ------------------------------------------------------------------ pterodactyl
  // 23x20 cells of 2 px in a 46x40 frame, facing left. Wings up, wings down.
  var PTERO_HEAD = [
    '.......................',
    '.......................',
    '.......................',
    '.......................',
    '.....XX................',
    '....XXXXXX.............',
    '...XXXXXXXX............',
    'XXXX.XXXXXX............',
    'XXXXXXXXXXXXXXXXXX.....',
    '........XXXXXXXXXXXXX..',
    '.........XXXXXXXXXXXXXX',
    '.........XXXXXXXXXXXX..',
    '..........XXXXXXXXX....',
    '...........XXXXX.......'
  ];
  var PTERO_UP = [
    '.........X.............',
    '.........XX............',
    '.........XXX...........',
    '.........XXXX..........',
    '.....XX..XXXXX.........',
    '....XXXXXXXXXXX........',
    '...XXXXXXXXXXXXX.......',
    'XXXX.XXXXXXXXXXXX......',
    'XXXXXXXXXXXXXXXXXX.....',
    '........XXXXXXXXXXXXX..',
    '.........XXXXXXXXXXXXXX',
    '.........XXXXXXXXXXXX..',
    '..........XXXXXXXXX....',
    '...........XXXXX.......'
  ];
  var PTERO_DOWN = PTERO_HEAD.slice(0, 12).concat([
    '.........XXXXXXXXXX....',
    '.........XXXXXXX.......',
    '.........XXXXX.........',
    '.........XXXX..........',
    '.........XXX...........',
    '.........XX............',
    '.........X.............'
  ]);
  var PTERO = [
    sprite(fromArt(PTERO_UP, 46, 40, 2, 0, 0)),
    sprite(fromArt(PTERO_DOWN, 46, 40, 2, 0, 0))
  ];

  // ------------------------------------------------------------------ cacti
  // Built from the trunk/arm numbers in core.js, with rounded tips and a few
  // spine notches so the groups don't look stamped.
  function cactusBitmap(v, w, h, seed) {
    var bm = blank(w, h);
    function rect(x, y, rw, rh) {
      for (var yy = y; yy < y + rh; yy++) for (var xx = x; xx < x + rw; xx++) set(bm, xx, yy, 1);
    }
    function tip(x, y, rw) {
      // round the top corners of a column
      set(bm, x, y, 0);
      set(bm, x + rw - 1, y, 0);
    }
    var tx = v.trunk[0], tw = v.trunk[1];
    rect(tx, 0, tw, h);
    tip(tx, 0, tw);
    [v.left, v.right].forEach(function (a) {
      if (!a) return;
      var ax = a[0], aw = a[1], top = a[2], et = a[3], eh = a[4];
      rect(ax, top, aw, et + eh - top);
      var x0 = Math.min(ax, tx + tw), x1 = Math.max(ax + aw, tx);
      rect(x0, et, x1 - x0, eh);
      tip(ax, top, aw);
      // the outer bottom corner of the elbow
      var outer = ax < tx ? ax : ax + aw - 1;
      set(bm, outer, et + eh - 1, 0);
    });
    // Spine notches: single empty pixels just inside the trunk edge.
    var s = seed, side = seed & 1;
    for (var y = 5 + (seed % 4); y < h - 6; y += 8 + (s % 5)) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      set(bm, side ? tx + 1 : tx + tw - 2, y, 0);
      set(bm, side ? tx + 1 : tx + tw - 2, y + 1, 0);
      side ^= 1;
    }
    return bm;
  }

  var CACTI = {};
  Core.OBSTACLE_TYPES.forEach(function (t) {
    var vs = Core.CACTUS_VARIANTS[t.name];
    if (!vs) return;
    CACTI[t.name] = vs.map(function (v, i) { return sprite(cactusBitmap(v, t.width, t.height, 7 + i * 13)); });
  });

  // ------------------------------------------------------------------ clouds
  // Outline in colour 1, inside in colour 2 (drawn as the sky).
  var cloud = (function () {
    var w = C.CLOUD_WIDTH, h = 14, bm = blank(w, h);
    function inside(px, py) {
      var x = px + 0.5, y = py + 0.5;
      if (x >= 4 && x <= 42 && y >= 9 && y <= 14) return true;
      function circ(cx, cy, r) { return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }
      return circ(14, 9.5, 5.5) || circ(25, 7.5, 7.5) || circ(35.5, 10, 5) || circ(7, 11.5, 3.5) || circ(40, 11.5, 3);
    }
    var x, y;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (inside(x, y)) set(bm, x, y, 2);
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (get(bm, x, y) && (!get(bm, x - 1, y) || !get(bm, x + 1, y) || !get(bm, x, y - 1) || y === h - 1 || !get(bm, x, y + 1))) {
          bm.px[y * w + x] = 3;
        }
      }
    }
    for (var i = 0; i < bm.px.length; i++) bm.px[i] = bm.px[i] === 3 ? 1 : bm.px[i];
    return sprite(bm);
  }());

  // ------------------------------------------------------------------ night sky
  // Seven moon phases: crescents to full and back. Colour 1 is the moon,
  // colour 2 a few darker crater pixels.
  var MOON = (function () {
    var r = 12, d = r * 2, shifts = [-0.32, -0.56, -0.8, null, 0.8, 0.56, 0.32];
    return shifts.map(function (k) {
      var bm = blank(d, d), cx = r, cy = r;
      for (var y = 0; y < d; y++) {
        for (var x = 0; x < d; x++) {
          var X = x + 0.5, Y = y + 0.5;
          var lit = (X - cx) * (X - cx) + (Y - cy) * (Y - cy) <= r * r;
          if (lit && k !== null) {
            var sx = cx + k * d;
            if ((X - sx) * (X - sx) + (Y - cy) * (Y - cy) <= r * r) lit = false;
          }
          if (lit) set(bm, x, y, 1);
        }
      }
      [[8, 7, 3], [17, 12, 2], [10, 17, 2], [16, 19, 1], [19, 6, 1]].forEach(function (c) {
        for (var yy = 0; yy < c[2]; yy++) for (var xx = 0; xx < c[2]; xx++) {
          if (get(bm, c[0] + xx, c[1] + yy)) set(bm, c[0] + xx, c[1] + yy, 2);
        }
      });
      return sprite(bm);
    });
  }());

  var STARS = [
    sprite(fromArt([
      '...X...',
      '...X...',
      '..XXX..',
      'XXXXXXX',
      '..XXX..',
      '...X...',
      '...X...'
    ], 7, 7, 1, 0, 0)),
    sprite(fromArt([
      '..X..',
      '..X..',
      'XXXXX',
      '..X..',
      '..X..'
    ], 5, 5, 1, 0, 0))
  ];

  // ------------------------------------------------------------------ ground
  // Three 600 px strips: flat, and two bumpy ones. The line sits on
  // C.GROUND_LINE_Y; the strip starts two rows above it for the bumps.
  var GROUND_TOP = C.GROUND_LINE_Y - 2;
  var GROUND = (function () {
    var w = C.GROUND_WIDTH, h = 11, out = [];
    for (var type = 0; type < C.GROUND_TYPES; type++) {
      var bm = blank(w, h), rng = Core.makeRng(1234 + type * 777), x, i;
      for (x = 0; x < w; x++) set(bm, x, 2, 1);
      if (type > 0) {
        x = 30 + Core.randInt(rng, 0, 40);
        while (x < w - 20) {
          var len = Core.randInt(rng, 5, 14), tall = rng() < 0.4 ? 2 : 1;
          for (i = 0; i < len; i++) set(bm, x + i, 2, 0);
          if (tall === 1) {
            set(bm, x, 2, 1); set(bm, x + len - 1, 2, 1);
            for (i = 1; i < len - 1; i++) set(bm, x + i, 1, 1);
          } else {
            set(bm, x, 2, 1); set(bm, x + len - 1, 2, 1);
            set(bm, x + 1, 1, 1); set(bm, x + len - 2, 1, 1);
            for (i = 2; i < len - 2; i++) set(bm, x + i, 0, 1);
          }
          x += len + Core.randInt(rng, 40, 140);
        }
      }
      // pebbles and dashes below the line
      x = type === 0 ? 50 : Core.randInt(rng, 0, 12);
      while (x < w) {
        var row = 4 + Core.randInt(rng, 0, 5), dash = rng() < 0.35 ? Core.randInt(rng, 2, 4) : 1;
        for (i = 0; i < dash; i++) set(bm, x + i, row, 1);
        if (rng() < 0.12) { set(bm, x + dash + 1, row - 1, 1); set(bm, x + dash + 2, row - 1, 1); }
        x += dash + Core.randInt(rng, 6, type === 0 ? 30 : 22);
      }
      out.push(sprite(bm));
    }
    return out;
  }());

  // ------------------------------------------------------------------ restart icon
  // A circular arrow on the 2 px grid, 36x32.
  var RESTART = sprite(fromArt([
    '.........X........',
    '.....XXXXXX.......',
    '...XXXXXXXXX......',
    '..XXXX...XX.......',
    '.XXX.....X........',
    '.XXX..............',
    'XXX...............',
    'XXX...............',
    'XXX...........XXX.',
    'XXX...........XXX.',
    '.XXX.........XXX..',
    '.XXXX.......XXXX..',
    '..XXXXX...XXXXX...',
    '...XXXXXXXXXXX....',
    '.....XXXXXXX......',
    '..................'
  ], 36, 32, 2, 0, 0));

  // ------------------------------------------------------------------ font
  // 5x7 cells of 2 px: 10x14 glyphs on a 12 px advance.
  var GLYPHS = {
    '0': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    '1': ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
    '2': ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'],
    '3': ['XXXXX', '...X.', '..X..', '...X.', '....X', 'X...X', '.XXX.'],
    '4': ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'],
    '5': ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
    '6': ['..XX.', '.X...', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'],
    '7': ['XXXXX', '....X', '...X.', '..X..', '.X...', '.X...', '.X...'],
    '8': ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'],
    '9': ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '...X.', '.XX..'],
    'A': ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    'B': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'XXXX.'],
    'C': ['.XXX.', 'X...X', 'X....', 'X....', 'X....', 'X...X', '.XXX.'],
    'D': ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
    'E': ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
    'F': ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....'],
    'G': ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXXX'],
    'H': ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
    'I': ['.XXX.', '..X..', '..X..', '..X..', '..X..', '..X..', '.XXX.'],
    'J': ['..XXX', '...X.', '...X.', '...X.', '...X.', 'X..X.', '.XX..'],
    'K': ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'],
    'L': ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
    'M': ['X...X', 'XX.XX', 'X.X.X', 'X.X.X', 'X...X', 'X...X', 'X...X'],
    'N': ['X...X', 'X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X'],
    'O': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    'P': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....'],
    'Q': ['.XXX.', 'X...X', 'X...X', 'X...X', 'X.X.X', 'X..X.', '.XX.X'],
    'R': ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
    'S': ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
    'T': ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
    'U': ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
    'V': ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '..X..'],
    'W': ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'X.X.X', '.X.X.'],
    'X': ['X...X', 'X...X', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'],
    'Y': ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
    'Z': ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'XXXXX'],
    '-': ['.....', '.....', '.....', 'XXXXX', '.....', '.....', '.....'],
    '!': ['..X..', '..X..', '..X..', '..X..', '..X..', '.....', '..X..'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....']
  };
  var FONT = {};
  Object.keys(GLYPHS).forEach(function (k) { FONT[k] = sprite(fromArt(GLYPHS[k], 10, 14, 2, 0, 0)); });
  var GLYPH_W = 10, GLYPH_H = 14, ADVANCE = 12;

  // ------------------------------------------------------------------ drawing
  // Draw a sprite's runs. colors[i] is the fill for colour index i (index 0
  // is never drawn). `scale` draws runs as scale x scale blocks.
  function draw(ctx, s, x, y, colors, scale) {
    var runs = s.runs, cur = null, k = scale || 1;
    for (var i = 0; i < runs.length; i++) {
      var r = runs[i], col = colors[r[3]];
      if (!col) continue;
      if (col !== cur) { ctx.fillStyle = col; cur = col; }
      ctx.fillRect(x + r[0] * k, y + r[1] * k, r[2] * k, k);
    }
  }

  // Monochrome text; `spacing` overrides the advance (GAME OVER is spread out).
  function textWidth(str, scale, spacing) {
    var k = scale || 1, adv = (spacing || ADVANCE) * k;
    return str.length ? adv * (str.length - 1) + GLYPH_W * k : 0;
  }
  function drawText(ctx, str, x, y, color, scale, spacing) {
    var k = scale || 1, adv = (spacing || ADVANCE) * k, cols = [null, color, color];
    for (var i = 0; i < str.length; i++) {
      var g = FONT[str[i]];
      if (g && str[i] !== ' ') draw(ctx, g, x + i * adv, y, cols, k);
    }
  }

  return {
    TREX: TREX,
    PTERO: PTERO,
    CACTI: CACTI,
    CLOUD: cloud,
    MOON: MOON,
    STARS: STARS,
    GROUND: GROUND,
    GROUND_TOP: GROUND_TOP,
    RESTART: RESTART,
    FONT: FONT,
    GLYPH_W: GLYPH_W,
    GLYPH_H: GLYPH_H,
    ADVANCE: ADVANCE,
    fromArt: fromArt,
    toRuns: toRuns,
    draw: draw,
    drawText: drawText,
    textWidth: textWidth,
    get: get
  };
}));
