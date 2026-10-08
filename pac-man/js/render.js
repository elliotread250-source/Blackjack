/* Draws the game state. Everything is positioned in arcade pixels and
   snapped to whole device pixels, so sprites and text stay sharp at any
   (fractional) scale. */
'use strict';
(function (PM) {
  var C = PM.COLORS;
  var UP = PM.UP, LEFT = PM.LEFT, RIGHT = PM.RIGHT;
  var ctx, S, sprites, maze;

  function R(v) { return Math.round(v * S); }
  function img(cv, x, y, w, h) {
    w = w || cv.width; h = h || cv.height;
    var x0 = R(x), y0 = R(y);
    ctx.drawImage(cv, x0, y0, R(x + w) - x0, R(y + h) - y0);
  }
  function rect(x, y, w, h, color) {
    var x0 = R(x), y0 = R(y);
    ctx.fillStyle = color;
    ctx.fillRect(x0, y0, R(x + w) - x0, R(y + h) - y0);
  }
  function text(str, x, y, color) {
    var atlas = PM.fontAtlas(color);
    str = String(str).toUpperCase();
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === ' ') continue;
      var gi = PM.glyphIndex(ch);
      var x0 = R(x + i * 8), y0 = R(y);
      ctx.drawImage(atlas, gi * 8, 0, 8, 8, x0, y0, R(x + i * 8 + 8) - x0, R(y + 8) - y0);
    }
  }
  function textAt(str, col, row, color) { text(str, col * 8, row * 8, color); }
  function textCentre(str, row, color) { text(str, Math.round((224 - str.length * 8) / 2), row * 8, color); }
  function scoreStr(n) { return n === 0 ? '00' : String(n); }

  function header(game, blink1up) {
    if (!blink1up || Math.floor(game.frame / 16) % 2 === 0) textAt('1UP', 3, 0, C.white);
    textAt('HIGH SCORE', 9, 0, C.white);
    var s = scoreStr(game.score);
    textAt(s, 7 - s.length, 1, C.white);
    if (game.hi > 0) {
      var h = String(game.hi);
      textAt(h, 17 - h.length, 1, C.white);
    }
  }

  function ghostSprite(name, frame, dir) { return sprites.ghost[name][frame][dir]; }

  function drawGhost(game, g, frame) {
    var sp;
    if (g.state === 'eyes' || g.state === 'entering') sp = sprites.eyes[g.dir];
    else if (g.fright) sp = sprites.fright[game.flashWhite() ? 1 : 0][frame];
    else sp = ghostSprite(g.name, frame, g.dir);
    img(sp, g.x - 8, g.y - 8);
  }

  function pacMouth(p) { return [1, 2, 1, 0][Math.floor(p.anim / 2) % 4]; }

  function drawMazeLayer(game) {
    var white = game.mazeWhite();
    var cv = white ? maze.white : maze.blue;
    ctx.drawImage(cv, 0, R(24));
    var flashing = game.state === 'levelComplete' && game.t >= 60;
    if (!flashing) rect(104, 24 + 101, 16, 2, C.door);
  }

  function drawDots(game) {
    var blinkOff = game.state === 'playing' && Math.floor(game.frame / 10) % 2 === 1;
    var dots = game.dots;
    ctx.fillStyle = C.dot;
    for (var r = 3; r < 34; r++) {
      for (var c = 0; c < 28; c++) {
        var v = dots[r * 28 + c];
        if (v === 1) {
          var x0 = R(c * 8 + 3), y0 = R(r * 8 + 3);
          ctx.fillRect(x0, y0, Math.max(1, R(c * 8 + 5) - x0), Math.max(1, R(r * 8 + 5) - y0));
        } else if (v === 2 && !blinkOff) {
          img(sprites.energizer, c * 8, r * 8);
        }
      }
    }
  }

  function bottom(game) {
    var spare;
    if (game.state === 'ready' && game.intro && game.t < 130) spare = game.lives;
    else if (game.state === 'gameOver') spare = 0;
    else spare = game.lives - 1;
    for (var i = 0; i < Math.min(spare, 5); i++) img(sprites.life, 16 + i * 16, 272);
    var first = Math.max(1, game.level - 6);
    for (var l = first, k = 0; l <= game.level; l++, k++) {
      img(sprites.fruit[PM.fruitForLevel(l)], 192 - k * 16, 272);
    }
  }

  function renderGame(game) {
    var st = game.state;
    header(game, st === 'playing' || st === 'ready');
    drawMazeLayer(game);
    drawDots(game);

    if (game.fruit) img(sprites.fruit[game.fruit.kind], 104, 156);
    if (game.popup) img(sprites.fruitPts[game.popup.pts], 104, 160);

    var visible = game.actorsVisible();
    var p = game.pac;
    var gFrame = (st === 'playing') ? Math.floor(game.frame / 8) % 2 : 0;
    if (visible) {
      var hideGhosts = (st === 'dying' || st === 'levelComplete') && game.t >= 60;
      // Pac-Man
      if (st === 'dying') {
        if (game.t < 60) img(sprites.pac[p.face][pacMouth(p)], p.x - 8, p.y - 8);
        else if (game.t < 140) img(sprites.pacDeath[Math.floor((game.t - 60) / 8)], p.x - 8, p.y - 8);
        else if (game.t < 156) img(sprites.burst[Math.floor((game.t - 140) / 8)], p.x - 8, p.y - 8);
      } else if (st === 'ready') {
        img(sprites.pac[LEFT][0], p.x - 8, p.y - 8);
      } else if (game.freeze <= 0) {
        img(sprites.pac[p.face][st === 'levelComplete' ? 0 : pacMouth(p)], p.x - 8, p.y - 8);
      }
      // Ghosts
      if (!hideGhosts) {
        for (var i = 3; i >= 0; i--) {
          var g = game.ghosts[i];
          if (game.freeze > 0 && g === game.eatenGhost) img(sprites.ghostPts[game.eatenPts], g.x - 8, g.y - 4);
          else drawGhost(game, g, gFrame);
        }
      }
    }

    if (st === 'ready') {
      if (game.intro && game.t < 130) textAt('PLAYER ONE', 9, 14, C.cyan);
      textAt('READY!', 11, 20, C.yellow);
    }
    if (st === 'gameOver') textAt('GAME OVER', 9, 20, C.red);
    bottom(game);
  }

  var ROLL = [
    ['blinky', '-SHADOW', '"BLINKY"', C.red],
    ['pinky', '-SPEEDY', '"PINKY"', C.pink],
    ['inky', '-BASHFUL', '"INKY"', C.cyan],
    ['clyde', '-POKEY', '"CLYDE"', C.orange]
  ];

  function renderAttract(game, touch) {
    header(game, false);
    var t = game.t;
    if (t >= 20) textAt('CHARACTER / NICKNAME', 7, 5, C.white);
    for (var i = 0; i < 4; i++) {
      var t0 = 60 + i * 90, row = 7 + i * 3, r = ROLL[i];
      if (t >= t0) img(ghostSprite(r[0], 0, RIGHT), 28, row * 8 - 4);
      if (t >= t0 + 30) textAt(r[1], 7, row, r[3]);
      if (t >= t0 + 60) textAt(r[2], 18, row, r[3]);
    }
    var blink = Math.floor(game.frame / 10) % 2 === 0;
    if (t >= 420) {
      rect(10 * 8 + 3, 25 * 8 + 3, 2, 2, C.dot);
      textAt('10', 12, 25, C.white); textAt('PTS', 15, 25, C.white);
      if (blink) img(sprites.energizer, 10 * 8, 27 * 8);
      textAt('50', 12, 27, C.white); textAt('PTS', 15, 27, C.white);
    }
    var a = game.attract;
    if (a) {
      var y = 20 * 8 + 4;
      if (a.energizer && blink) img(sprites.energizer, 4 * 8, 20 * 8);
      var frame = Math.floor(game.frame / 8) % 2;
      for (var k = 3; k >= 0; k--) {
        var g = a.ghosts[k];
        if (!g.alive) continue;
        var sp = a.powered ? sprites.fright[0][frame] : ghostSprite(ROLL[k][0], frame, LEFT);
        img(sp, Math.round(g.x) - 8, y - 8);
      }
      if (a.eaten) img(sprites.ghostPts[a.eaten.pts], Math.round(a.eaten.x) - 8, y - 4);
      else {
        var p = a.pac;
        img(sprites.pac[p.dir][[1, 2, 1, 0][Math.floor(p.anim / 2) % 4]], Math.round(p.x) - 8, y - 8);
      }
    }
    if (Math.floor(game.frame / 32) % 4 !== 3) {
      textCentre('PRESS ENTER OR TAP TO START', 31, C.peach);
    }
  }

  function panel(x, y, w, h) {
    rect(x, y, w, h, '#000');
    var x0 = R(x) + 0.5, y0 = R(y) + 0.5;
    ctx.strokeStyle = C.wall;
    ctx.lineWidth = Math.max(1, Math.round(S));
    ctx.strokeRect(x0, y0, R(x + w) - R(x) - 1, R(y + h) - R(y) - 1);
  }
  function dim() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function renderPause(game, touch) {
    dim();
    panel(28, 112, 168, 64);
    textCentre('PAUSED', 16, C.yellow);
    textCentre(touch ? 'TAP TO RESUME' : 'PRESS P TO RESUME', 19, C.white);
  }

  function renderGameOver(game, touch) {
    if (game.t < 150) return;
    dim();
    panel(20, 88, 184, 112);
    textCentre('GAME OVER', 13, C.red);
    textCentre('SCORE ' + scoreStr(game.score), 16, C.white);
    if (game.newHi) { if (Math.floor(game.frame / 16) % 2 === 0) textCentre('NEW HIGH SCORE!', 18, C.yellow); }
    else textCentre('HIGH SCORE ' + scoreStr(game.hi), 18, C.white);
    if (touch) textCentre('TAP TO PLAY AGAIN', 21, C.peach);
    else { textCentre('PRESS ENTER', 21, C.peach); text('TO PLAY AGAIN', 60, 22 * 8 + 4, C.peach); }
  }

  PM.render = function (context, scale, spr, mazeCache, game, opts) {
    ctx = context; S = scale; sprites = spr; maze = mazeCache;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (game.state === 'attract') renderAttract(game, opts.touch);
    else {
      renderGame(game);
      if (game.state === 'gameOver') renderGameOver(game, opts.touch);
    }
    if (game.paused) renderPause(game, opts.touch);
  };
})(window.PM);
