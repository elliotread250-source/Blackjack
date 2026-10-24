/* Dino Run: draws a game state onto a 600x150 buffer, then scales that onto
 * the screen canvas with smoothing off, so every pixel stays square.
 */
(function (root) {
  'use strict';

  var Core = root.DinoCore;
  var S = root.DinoSprites;
  var C = Core.C;

  // Day and night colours per role; night is blended in by the fade amount.
  // Classic night is the exact inversion of the day colours, as in Chrome.
  var PALETTES = {
    classic: {
      day: {
        bg: '#f7f7f7', trex: '#535353', cactus: '#535353', ptero: '#535353', ground: '#535353',
        cloud: '#dadada', text: '#535353', hi: '#757575', moon: '#535353', crater: '#535353', star: '#535353'
      },
      night: {
        bg: '#080808', trex: '#acacac', cactus: '#acacac', ptero: '#acacac', ground: '#acacac',
        cloud: '#2a2a2a', text: '#acacac', hi: '#8a8a8a', moon: '#e9e9e9', crater: '#b4b4b4', star: '#d8d8d8'
      }
    },
    colour: {
      day: {
        bg: '#f7f0de', trex: '#2f7d8c', cactus: '#4f8a35', ptero: '#b4553e', ground: '#a3845a',
        cloud: '#c6d6dc', text: '#5c5246', hi: '#8f8475', moon: '#f7f0de', crater: '#f7f0de', star: '#f7f0de'
      },
      night: {
        bg: '#141d36', trex: '#86d2de', cactus: '#7fc266', ptero: '#e6947b', ground: '#78684f',
        cloud: '#2b385a', text: '#d5d9e8', hi: '#959db5', moon: '#f6eecb', crater: '#d6cb9b', star: '#fff2c4'
      }
    }
  };
  var ROLES = Object.keys(PALETTES.classic.day);

  function rgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function hex2(v) { var s = Math.round(v).toString(16); return s.length < 2 ? '0' + s : s; }
  function mix(a, b, t) {
    if (t <= 0) return a;
    if (t >= 1) return b;
    var A = rgb(a), B = rgb(b);
    return '#' + hex2(A[0] + (B[0] - A[0]) * t) + hex2(A[1] + (B[1] - A[1]) * t) + hex2(A[2] + (B[2] - A[2]) * t);
  }

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.buf = document.createElement('canvas');
    this.buf.width = C.WIDTH;
    this.buf.height = C.HEIGHT;
    this.b = this.buf.getContext('2d', { alpha: false });
    this.palette = 'classic';
    this.key = '';
    this.colors = null;
  }

  Renderer.PALETTES = PALETTES;

  // A straight blend of day into its inverse passes through a moment where
  // everything is the same grey. Instead the sky sweeps quickly through the
  // middle and the sprites and text flip to their night colour as soon as
  // that stands out more, so there is always contrast mid-run.
  var FLIP = { trex: 1, cactus: 1, ptero: 1, ground: 1, text: 1, hi: 1 };
  function luminance(h) {
    var c = rgb(h).map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    var x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function skyCurve(t) {
    var d = 2 * t - 1;
    return 0.5 + 0.5 * (d < 0 ? -Math.sqrt(-d) : Math.sqrt(d));
  }

  Renderer.prototype.resolve = function (amount) {
    var key = this.palette + ':' + Math.round(amount * 1000);
    if (key !== this.key) {
      var p = PALETTES[this.palette] || PALETTES.classic, out = {};
      var sky = amount <= 0 ? 0 : amount >= 1 ? 1 : skyCurve(amount);
      var bg = mix(p.day.bg, p.night.bg, sky);
      for (var i = 0; i < ROLES.length; i++) {
        var r = ROLES[i];
        if (FLIP[r]) {
          // whichever of the day or night colour stands out more against this sky
          out[r] = amount <= 0 ? p.day[r] : amount >= 1 ? p.night[r]
            : contrast(p.day[r], bg) >= contrast(p.night[r], bg) ? p.day[r] : p.night[r];
        } else {
          out[r] = mix(p.day[r], p.night[r], r === 'bg' || r === 'cloud' ? sky : amount);
        }
      }
      this.key = key;
      this.colors = out;
    }
    return this.colors;
  };

  function pad(n, digits) {
    var s = String(n);
    while (s.length < digits) s = '0' + s;
    return s;
  }

  function trexSprite(t) {
    var T = S.TREX;
    switch (t.status) {
      case 'waiting': return t.blinking ? T.blink : T.stand;
      case 'running': return T.run[t.frame % 2];
      case 'ducking': return T.duck[t.frame % 2];
      case 'crashed': return T.crash;
      default: return T.stand;
    }
  }

  Renderer.prototype.draw = function (game, ui) {
    var b = this.b;
    var col = this.resolve(game.night.amount);
    var st = game.state;
    var n = game.night;
    var i;

    b.fillStyle = col.bg;
    b.fillRect(0, 0, C.WIDTH, C.HEIGHT);

    var reveal = Math.round(game.revealWidth());
    b.save();
    if (reveal < C.WIDTH) {
      b.beginPath();
      b.rect(0, 0, reveal, C.HEIGHT);
      b.clip();
    }

    // Night sky: moon and stars fade in with the dark.
    if (n.amount > 0) {
      b.globalAlpha = n.amount;
      S.draw(b, S.MOON[n.phase], Math.round(n.moonX), 26, [null, col.moon, col.crater]);
      for (i = 0; i < n.stars.length; i++) {
        var s = n.stars[i];
        S.draw(b, S.STARS[s.kind], Math.round(s.x), s.y, [null, col.star]);
      }
      b.globalAlpha = 1;
    }

    for (i = 0; i < game.clouds.length; i++) {
      var c = game.clouds[i];
      S.draw(b, S.CLOUD, Math.round(c.x), c.y, [null, col.cloud, col.bg]);
    }

    for (i = 0; i < game.ground.length; i++) {
      var g = game.ground[i], gx = Math.round(g.x);
      if (gx < C.WIDTH && gx + C.GROUND_WIDTH > 0) S.draw(b, S.GROUND[g.type], gx, S.GROUND_TOP, [null, col.ground]);
    }

    for (i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i], ox = Core.obstacleX(o);
      if (ox > C.WIDTH || ox + o.width < 0) continue;
      if (o.type === 'PTERODACTYL') {
        S.draw(b, S.PTERO[o.frame], ox, o.y, [null, col.ptero]);
      } else {
        var w = o.width / o.size, set = S.CACTI[o.type];
        for (var k = 0; k < o.size; k++) S.draw(b, set[o.variants[k]], ox + k * w, o.y, [null, col.cactus]);
      }
    }

    var t = game.trex;
    S.draw(b, trexSprite(t), t.x, t.y, [null, col.trex]);

    // Score, with leading zeros, and the high score beside it.
    var showScore = st === 'playing' || st === 'crashed';
    var digits = Math.max(5, String(game.displayScore).length, String(game.hiScore).length);
    var scoreX = C.WIDTH - 8 - (digits * S.ADVANCE - 2);
    if (showScore && game.flash.paint) S.drawText(b, pad(game.displayScore, digits), scoreX, 5, col.text);
    if (showScore && game.hiScore > 0) {
      var hiStr = 'HI ' + pad(game.hiScore, digits);
      S.drawText(b, hiStr, scoreX - 20 - S.textWidth(hiStr), 5, col.hi);
    }
    b.restore();

    // Title before the run, fading as the ground rolls out.
    var titleAlpha = 0;
    if (st === 'waiting' || st === 'starting') titleAlpha = 1;
    else if (st === 'playing' && game.revealFrames < C.REVEAL_FRAMES) titleAlpha = 1 - game.revealFrames / C.REVEAL_FRAMES;
    if (ui && ui.paused) titleAlpha = 0;
    if (titleAlpha > 0) {
      b.globalAlpha = titleAlpha;
      var title = 'DINO RUN';
      S.drawText(b, title, Math.round((C.WIDTH - S.textWidth(title, 2)) / 2), 40, col.text, 2);
      if (game.hiScore > 0) {
        var hs = 'HI ' + pad(game.hiScore, 5);
        S.drawText(b, hs, Math.round((C.WIDTH - S.textWidth(hs)) / 2), 82, col.hi);
      }
      b.globalAlpha = 1;
    }

    if (st === 'crashed') {
      var go = 'GAME OVER';
      S.drawText(b, go, Math.round((C.WIDTH - S.textWidth(go, 1, 20)) / 2), 42, col.text, 1, 20);
      S.draw(b, S.RESTART, Math.round(C.WIDTH / 2 - S.RESTART.w / 2), 75, [null, col.text]);
    }

    if (ui && ui.paused && st !== 'crashed') {
      var p = 'PAUSED', pw = S.textWidth(p, 1, 20);
      var px = Math.round((C.WIDTH - pw) / 2);
      b.fillStyle = col.bg;
      b.fillRect(px - 12, 50, pw + 24, 30);
      S.drawText(b, p, px, 58, col.text, 1, 20);
    }

    var ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.buf, 0, 0, this.canvas.width, this.canvas.height);
    return col;
  };

  root.DinoRender = Renderer;
}(typeof self !== 'undefined' ? self : this));
