/* The simulation. Runs at a fixed 60 ticks per second; everything is in
   arcade screen pixels (224 x 288) and 8px tiles, rows 0..35.

   Behaviour follows Jamey Pittman's "Pac-Man Dossier": per-level speeds,
   scatter/chase schedule, ghost targeting (with Pinky/Inky's up-direction
   overflow bug), the restricted intersections, dot counters for the ghost
   house, Cruise Elroy, frightened timings and fruit. */
'use strict';
(function (PM) {
  var UP = PM.UP, LEFT = PM.LEFT, DOWN = PM.DOWN, RIGHT = PM.RIGHT;
  var DX = PM.DX, DY = PM.DY, OPP = PM.OPP;
  var BASE = 1.25;           // pixels per tick at "100%" speed (75 px/s)
  var TOTAL_DOTS = 244;      // 240 dots + 4 energizers
  var HOUSE_Y = 140, DOOR_Y = 116, DOOR_X = 112;
  var FLASH_HALF = 8;        // ticks per half flash of a frightened ghost

  function mod(a, n) { return ((a % n) + n) % n; }
  function tileOf(v) { return Math.floor(v / 8); }
  function atCentre(x, y) { return mod(x - 4, 8) === 0 && mod(y - 4, 8) === 0; }

  var GHOSTS = [
    { name: 'blinky', scatter: [25, 0], x: 112, y: 116, homeX: 112, dir: LEFT, state: 'active' },
    { name: 'pinky', scatter: [2, 0], x: 112, y: 140, homeX: 112, dir: DOWN, state: 'house' },
    { name: 'inky', scatter: [27, 35], x: 96, y: 140, homeX: 96, dir: UP, state: 'house' },
    { name: 'clyde', scatter: [0, 35], x: 128, y: 140, homeX: 128, dir: UP, state: 'house' }
  ];

  function mulberry(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0);
    };
  }

  function Game(hooks) {
    this.hooks = hooks || {};
    this.hi = 0;
    this.score = 0;
    this.level = 1;
    this.lives = 0;
    this.frame = 0;
    this.wantDir = null;
    this.dots = new Uint8Array(28 * 36);
    this.ghosts = GHOSTS.map(function (d) { return { name: d.name, scatter: d.scatter, homeX: d.homeX }; });
    this.resetDots();
    this.spec = PM.levelSpec(1);
    this.resetActors();
    this.toAttract();
  }

  var P = Game.prototype;

  P.sfx = function (name) { if (this.hooks.sfx) this.hooks.sfx(name); };

  // ---------------------------------------------------------------- setup
  P.resetDots = function () {
    this.dots.fill(0);
    for (var r = 0; r < 31; r++) {
      for (var c = 0; c < 28; c++) {
        var ch = PM.MAZE[r][c];
        if (ch === '.') this.dots[(r + 3) * 28 + c] = 1;
        else if (ch === 'o') this.dots[(r + 3) * 28 + c] = 2;
      }
    }
    this.dotsEaten = 0;
  };

  P.resetActors = function () {
    this.pac = { x: 112, y: 212, dir: LEFT, face: LEFT, acc: 0, pause: 0, anim: 0, moving: false };
    this.wantDir = null;
    for (var i = 0; i < 4; i++) {
      var d = GHOSTS[i], g = this.ghosts[i];
      g.x = d.x; g.y = d.y; g.dir = d.dir; g.state = d.state;
      g.acc = 0; g.fright = false; g.exitRight = false; g.moved = d.dir;
    }
    this.modeIdx = 0;
    this.modeTime = 0;
    this.frightTime = 0;
    this.ghostCombo = 0;
    this.freeze = 0;
    this.eatenGhost = null;
    this.eatenPts = 0;
    this.idle = 0;
    this.fruit = null;
    this.popup = null;
    this.rand = mulberry(0x5EED + this.level * 977);
  };

  P.setupLevel = function () {
    this.spec = PM.levelSpec(this.level);
    this.resetDots();
    this.ghostDots = [0, 0, 0, 0];
    this.globalActive = false;
    this.globalDots = 0;
    this.elroySuspended = false;
    this.resetActors();
  };

  P.toAttract = function () {
    this.state = 'attract';
    this.t = 0;
    this.paused = false;
    this.attract = null;
    this.resetDots();
  };

  P.newGame = function () {
    this.level = 1;
    this.score = 0;
    this.lives = 3;
    this.extraGiven = false;
    this.paused = false;
    this.setupLevel();
    this.startReady(true);
  };

  P.startReady = function (intro) {
    this.state = 'ready';
    this.t = 0;
    this.intro = !!intro;
    this.readyTicks = intro ? 262 : 120;
    if (intro) this.sfx('intro');
  };

  // Is Pac-Man (and are the ghosts) on screen in the current state?
  P.actorsVisible = function () {
    if (this.state === 'ready') return !this.intro || this.t >= 130;
    return this.state === 'playing' || this.state === 'dying' || this.state === 'levelComplete';
  };

  // ---------------------------------------------------------------- tick
  P.tick = function () {
    this.frame++;
    switch (this.state) {
      case 'attract': this.tickAttract(); break;
      case 'ready':
        this.t++;
        if (this.t >= this.readyTicks) { this.state = 'playing'; this.t = 0; }
        break;
      case 'playing': this.tickPlaying(); break;
      case 'dying': this.tickDying(); break;
      case 'levelComplete': this.tickLevelComplete(); break;
      case 'intermission': this.tickIntermission(); break;
      case 'gameOver':
        this.t++;
        if (this.t > 60 * 30) this.toAttract();
        break;
    }
  };

  P.loopSound = function () {
    if (this.state !== 'playing' || this.freeze > 0) return '';
    for (var i = 0; i < 4; i++) {
      var s = this.ghosts[i].state;
      if (s === 'eyes' || s === 'entering') return 'eyes';
    }
    if (this.frightTime > 0) return 'fright';
    var left = TOTAL_DOTS - this.dotsEaten;
    var lvl = left > 180 ? 0 : left > 120 ? 1 : left > 70 ? 2 : left > 30 ? 3 : 4;
    return 'siren' + lvl;
  };

  P.tickPlaying = function () {
    var i, g;
    if (this.freeze > 0) {
      // Only eyes already heading home keep moving during the freeze.
      for (i = 0; i < 4; i++) {
        g = this.ghosts[i];
        if (g !== this.eatenGhost && (g.state === 'eyes' || g.state === 'entering')) this.moveGhost(g);
      }
      this.freeze--;
      if (this.freeze === 0) this.eatenGhost = null;
      return;
    }
    this.t++;

    // Frightened timer, or the scatter/chase schedule (paused while frightened).
    if (this.frightTime > 0) {
      this.frightTime--;
      if (this.frightTime === 0) this.endFright();
    } else {
      var dur = this.spec.schedule[this.modeIdx];
      if (dur !== Infinity) {
        this.modeTime++;
        if (this.modeTime >= dur) {
          this.modeIdx++;
          this.modeTime = 0;
          this.reverseAll();
        }
      }
    }

    this.idle++;
    this.updateHouse();

    this.movePac();
    if (this.dotsEaten >= TOTAL_DOTS) { this.startLevelComplete(); return; }
    if (this.checkCollisions()) return;

    for (i = 0; i < 4; i++) this.moveGhost(this.ghosts[i]);
    if (this.checkCollisions()) return;

    if (this.fruit) {
      this.fruit.timer--;
      if (this.fruit.timer <= 0) this.fruit = null;
    }
    if (this.popup) {
      this.popup.timer--;
      if (this.popup.timer <= 0) this.popup = null;
    }
  };

  P.mode = function () { return this.modeIdx % 2 === 0 ? 'scatter' : 'chase'; };

  P.elroy = function () {
    if (this.elroySuspended) return 0;
    var left = TOTAL_DOTS - this.dotsEaten;
    if (left <= this.spec.elroy2Dots) return 2;
    if (left <= this.spec.elroy1Dots) return 1;
    return 0;
  };

  // A forced reversal sends a ghost back the way it came. That is the
  // opposite of its last step, which differs from g.dir when it has just
  // picked a new direction at a tile centre.
  function reverseGhost(g) { g.dir = OPP[g.moved]; }

  P.reverseAll = function () {
    for (var i = 0; i < 4; i++) {
      var g = this.ghosts[i];
      if (g.state === 'active') reverseGhost(g);
      else if (g.state === 'house' || g.state === 'leaving') g.exitRight = true;
    }
  };

  P.startFright = function () {
    this.ghostCombo = 0;
    for (var i = 0; i < 4; i++) {
      var g = this.ghosts[i];
      if (g.state === 'active') reverseGhost(g);
    }
    if (this.spec.frightTicks <= 0) return;
    this.frightTime = this.spec.frightTicks;
    for (var j = 0; j < 4; j++) {
      var h = this.ghosts[j];
      if (h.state !== 'eyes' && h.state !== 'entering') h.fright = true;
    }
  };

  P.endFright = function () {
    this.frightTime = 0;
    for (var i = 0; i < 4; i++) this.ghosts[i].fright = false;
  };

  // Frightened ghosts flash white during the last `flashes` flashes.
  P.flashWhite = function () {
    if (this.frightTime <= 0) return false;
    var span = this.spec.flashes * FLASH_HALF * 2;
    if (this.frightTime > span) return false;
    return Math.floor((this.frightTime - 1) / FLASH_HALF) % 2 === 1;
  };

  // ---------------------------------------------------------------- house
  P.release = function (g) {
    if (g.state !== 'house') return;
    g.state = 'leaving';
    if (g.name === 'clyde') this.elroySuspended = false;
  };

  P.preferredGhost = function () {
    for (var i = 1; i < 4; i++) if (this.ghosts[i].state === 'house') return this.ghosts[i];
    return null;
  };

  P.updateHouse = function () {
    var g = this.preferredGhost();
    if (!g) return;
    var idx = this.ghosts.indexOf(g);
    if (!this.globalActive && this.ghostDots[idx] >= this.spec.dotLimits[idx - 1]) {
      this.release(g);
      return;
    }
    if (this.idle >= this.spec.idleLimit) {
      this.idle = 0;
      this.release(g);
    }
  };

  P.onDotEaten = function () {
    this.idle = 0;
    if (this.globalActive) {
      this.globalDots++;
      var gh = this.ghosts;
      if (this.globalDots === 7 && gh[1].state === 'house') this.release(gh[1]);
      else if (this.globalDots === 17 && gh[2].state === 'house') this.release(gh[2]);
      else if (this.globalDots === 32 && gh[3].state === 'house') {
        this.release(gh[3]);
        this.globalActive = false;
        this.globalDots = 0;
      }
    } else {
      var g = this.preferredGhost();
      if (g) this.ghostDots[this.ghosts.indexOf(g)]++;
    }
  };

  // ---------------------------------------------------------------- Pac-Man
  P.movePac = function () {
    var p = this.pac;
    if (p.pause > 0) { p.pause--; return; }
    var pct = this.frightTime > 0 ? this.spec.pacFright : this.spec.pac;
    p.acc += pct / 100 * BASE;
    while (p.acc >= 1) {
      p.acc -= 1;
      if (this.pacStep()) break;
    }
  };

  // One pixel of movement. Returns true if something was eaten (Pac-Man then
  // stalls: 1 tick per dot, 3 per energizer).
  P.pacStep = function () {
    var p = this.pac;
    var c = tileOf(p.x), r = tileOf(p.y);
    var cx = c * 8 + 4, cy = r * 8 + 4;
    var want = this.wantDir;
    if (want !== null && want !== p.dir) {
      if (want === OPP[p.dir]) p.dir = want;
      else if (PM.passable(c + DX[want], r + DY[want])) p.dir = want; // pre/post-turn
    }
    var d = p.dir;
    var along = DX[d] ? (p.x - cx) * DX[d] : (p.y - cy) * DY[d];
    if (along >= 0 && !PM.passable(c + DX[d], r + DY[d])) {
      p.moving = false;
      return false;
    }
    p.moving = true;
    p.x += DX[d];
    p.y += DY[d];
    // Cornering: drift back onto the centre line of the new corridor.
    if (DX[d]) { if (p.y !== cy) p.y += p.y < cy ? 1 : -1; }
    else if (p.x !== cx) p.x += p.x < cx ? 1 : -1;
    if (p.x < -8) p.x += 240; else if (p.x >= 232) p.x -= 240;
    p.face = d;
    p.anim++;
    return this.pacEat();
  };

  P.pacEat = function () {
    var p = this.pac;
    var c = tileOf(p.x), r = tileOf(p.y);
    var ate = false;
    if (this.fruit && r === 20 && (c === 13 || c === 14)) {
      var f = PM.FRUITS[this.fruit.kind];
      this.addScore(f.pts);
      this.popup = { pts: f.pts, timer: 120 };
      this.fruit = null;
      this.sfx('fruit');
    }
    if (c < 0 || c > 27 || r < 0 || r > 35) return false;
    var k = r * 28 + c, v = this.dots[k];
    if (!v) return ate;
    this.dots[k] = 0;
    this.dotsEaten++;
    if (v === 1) { this.addScore(10); p.pause = 1; }
    else { this.addScore(50); p.pause = 3; this.startFright(); }
    this.onDotEaten();
    this.sfx('chomp');
    if (this.dotsEaten === 70 || this.dotsEaten === 170) {
      this.fruit = { kind: this.spec.fruit, timer: 560 + (this.rand() % 41) };
    }
    return true;
  };

  P.addScore = function (n) {
    this.score += n;
    if (!this.extraGiven && this.score >= 10000) {
      this.extraGiven = true;
      this.lives++;
      this.sfx('extra');
    }
    if (this.score > this.hi) this.hi = this.score;
  };

  // ---------------------------------------------------------------- ghosts
  P.ghostSpeed = function (g) {
    var s = this.spec;
    if (g.state === 'eyes' || g.state === 'entering') return 2;
    if (g.state === 'house' || g.state === 'leaving') return 0.5;
    if (PM.inTunnel(tileOf(g.x), tileOf(g.y))) return s.tunnel / 100 * BASE;
    if (g.fright) return s.ghostFright / 100 * BASE;
    if (g.name === 'blinky') {
      var e = this.elroy();
      if (e === 2) return s.elroy2 / 100 * BASE;
      if (e === 1) return s.elroy1 / 100 * BASE;
    }
    return s.ghost / 100 * BASE;
  };

  P.moveGhost = function (g) {
    g.acc += this.ghostSpeed(g);
    while (g.acc >= 1) {
      g.acc -= 1;
      this.ghostStep(g);
    }
  };

  P.ghostStep = function (g) {
    var s;
    switch (g.state) {
      case 'house':
        g.y += g.dir === UP ? -1 : 1;
        if (g.y <= HOUSE_Y - 4) g.dir = DOWN;
        else if (g.y >= HOUSE_Y + 4) g.dir = UP;
        break;
      case 'leaving':
        if (g.x !== DOOR_X) {
          if (g.y !== HOUSE_Y) { s = g.y < HOUSE_Y ? 1 : -1; g.y += s; g.dir = s < 0 ? UP : DOWN; }
          else { s = g.x < DOOR_X ? 1 : -1; g.x += s; g.dir = s < 0 ? LEFT : RIGHT; }
        } else {
          g.y -= 1;
          g.dir = UP;
          if (g.y <= DOOR_Y) {
            g.y = DOOR_Y;
            g.state = 'active';
            g.dir = g.exitRight ? RIGHT : LEFT;
            g.moved = g.dir;
            g.exitRight = false;
          }
        }
        break;
      case 'entering':
        if (g.y < HOUSE_Y) {
          if (g.x !== DOOR_X) { s = g.x < DOOR_X ? 1 : -1; g.x += s; g.dir = s < 0 ? LEFT : RIGHT; }
          else { g.y += 1; g.dir = DOWN; }
        } else if (g.x !== g.homeX) {
          s = g.x < g.homeX ? 1 : -1; g.x += s; g.dir = s < 0 ? LEFT : RIGHT;
        } else {
          g.state = 'leaving';
          g.fright = false;
          g.dir = UP;
        }
        break;
      default: // active, eyes
        g.moved = g.dir;
        g.x += DX[g.dir];
        g.y += DY[g.dir];
        if (g.x < -8) g.x += 240; else if (g.x >= 232) g.x -= 240;
        if (atCentre(g.x, g.y)) {
          var c = tileOf(g.x), r = tileOf(g.y);
          if (g.state === 'eyes' && r === 14 && (c === 13 || c === 14)) { g.state = 'entering'; break; }
          g.dir = this.chooseDir(g, c, r);
        }
    }
  };

  P.chooseDir = function (g, c, r) {
    var back = OPP[g.dir], opts = [];
    var chasing = g.state === 'active' && !g.fright;
    for (var d = 0; d < 4; d++) {
      if (d === back) continue;
      if (!PM.passable(c + DX[d], r + DY[d])) continue;
      if (d === UP && chasing && PM.isRestricted(c, r)) continue;
      opts.push(d);
    }
    if (!opts.length) return back;
    if (opts.length === 1) return opts[0];
    if (g.fright && g.state === 'active') {
      var pick = this.rand() & 3;
      for (var k = 0; k < 4; k++, pick = (pick + 1) & 3) if (opts.indexOf(pick) >= 0) return pick;
    }
    var t = this.target(g);
    var best = opts[0], bestD = Infinity;
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var ex = c + DX[o] - t[0], ey = r + DY[o] - t[1];
      var dist = ex * ex + ey * ey;
      if (dist < bestD) { bestD = dist; best = o; }
    }
    return best;
  };

  P.target = function (g) {
    if (g.state === 'eyes') return [13, 14];
    var p = this.pac;
    var pc = tileOf(p.x), pr = tileOf(p.y), pd = p.face;
    var scatter = this.mode() === 'scatter';
    switch (g.name) {
      case 'blinky':
        if (scatter && !this.elroy()) return g.scatter;
        return [pc, pr];
      case 'pinky': {
        if (scatter) return g.scatter;
        var tc = pc + 4 * DX[pd], tr = pr + 4 * DY[pd];
        if (pd === UP) tc -= 4; // the original overflow bug
        return [tc, tr];
      }
      case 'inky': {
        if (scatter) return g.scatter;
        var ac = pc + 2 * DX[pd], ar = pr + 2 * DY[pd];
        if (pd === UP) ac -= 2;
        var b = this.ghosts[0];
        return [2 * ac - tileOf(b.x), 2 * ar - tileOf(b.y)];
      }
      default: { // clyde
        if (scatter) return g.scatter;
        var dx = tileOf(g.x) - pc, dy = tileOf(g.y) - pr;
        return dx * dx + dy * dy > 64 ? [pc, pr] : g.scatter;
      }
    }
  };

  // ---------------------------------------------------------------- collisions
  P.checkCollisions = function () {
    var p = this.pac, pc = tileOf(p.x), pr = tileOf(p.y);
    for (var i = 0; i < 4; i++) {
      var g = this.ghosts[i];
      if (g.state !== 'active' && g.state !== 'leaving') continue;
      if (tileOf(g.x) !== pc || tileOf(g.y) !== pr) continue;
      if (g.fright) { this.eatGhost(g); return true; }
      if (this.hooks.invincible) continue;
      this.die();
      return true;
    }
    return false;
  };

  P.eatGhost = function (g) {
    var pts = [200, 400, 800, 1600][Math.min(this.ghostCombo, 3)];
    this.ghostCombo++;
    this.addScore(pts);
    g.fright = false;
    // Caught in the doorway on the way out: the eyes drop straight back in.
    g.state = g.state === 'leaving' ? 'entering' : 'eyes';
    this.freeze = 60;
    this.eatenGhost = g;
    this.eatenPts = pts;
    this.sfx('ghost');
  };

  P.die = function () {
    this.state = 'dying';
    this.t = 0;
  };

  P.tickDying = function () {
    this.t++;
    if (this.t === 60) this.sfx('death');
    if (this.t >= 60 + 96 + 40) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.state = 'gameOver';
        this.t = 0;
        if (this.hooks.gameOver) this.hooks.gameOver();
        return;
      }
      this.resetActors();
      this.globalActive = true;
      this.globalDots = 0;
      this.elroySuspended = true;
      this.startReady(false);
    }
  };

  P.startLevelComplete = function () {
    this.state = 'levelComplete';
    this.t = 0;
    this.fruit = null;
  };

  P.tickLevelComplete = function () {
    this.t++;
    if (this.t >= 60 + 8 * 12 + 24) {
      var done = this.level;
      this.level++;
      this.setupLevel();
      if (done === 2 || done === 5 || done === 9 || done === 13 || done === 17) this.startIntermission();
      else this.startReady(false);
    }
  };

  // Coffee break after levels 2, 5, 9, 13 and 17: Blinky chases Pac-Man off
  // the left edge, then a giant Pac-Man chases a blue Blinky back.
  P.startIntermission = function () {
    this.state = 'intermission';
    this.t = 0;
    this.cut = { phase: 0, pac: 236, ghost: 236 + 28, anim: 0 };
    this.sfx('intermission');
  };

  P.tickIntermission = function () {
    this.t++;
    var k = this.cut;
    k.anim++;
    if (k.phase === 0) {
      k.pac -= 1.25;
      k.ghost -= 1.32;
      if (k.ghost < -40) { k.phase = 1; k.ghost = -24; k.pac = -90; k.wait = 50; }
    } else if (k.phase === 1) {
      if (k.wait > 0) { k.wait--; return; }
      k.ghost += 0.95;
      k.pac += 1.05;
      if (k.pac > 290) { k.phase = 2; k.wait = 30; }
    } else if (--k.wait <= 0) {
      this.cut = null;
      this.startReady(false);
    }
  };

  // Maze colour during the end-of-level flash.
  P.mazeWhite = function () {
    if (this.state !== 'levelComplete' || this.t < 60) return false;
    var k = Math.floor((this.t - 60) / 12);
    return k < 8 && k % 2 === 0;
  };

  P.dotsLeft = function () { return TOTAL_DOTS - this.dotsEaten; };

  // ---------------------------------------------------------------- attract
  // Roll-call of the ghosts, then the energizer chase along row 20.
  P.tickAttract = function () {
    this.t++;
    var t = this.t;
    if (t < 480) return;
    var a = this.attract;
    if (!a) {
      a = this.attract = {
        pac: { x: 236, dir: LEFT, anim: 0 },
        ghosts: [0, 1, 2, 3].map(function (i) { return { x: 236 + 34 + i * 16, alive: true, anim: 0 }; }),
        powered: false, freeze: 0, combo: 0, eaten: null, done: 0, energizer: true
      };
    }
    if (a.done) {
      a.done++;
      if (a.done > 90) { this.t = 0; this.attract = null; }
      return;
    }
    if (a.freeze > 0) {
      a.freeze--;
      if (a.freeze === 0) a.eaten = null;
      return;
    }
    var p = a.pac;
    if (!a.powered) {
      p.x -= 1; p.anim++;
      a.ghosts.forEach(function (g) { g.x -= 1.05; });
      if (p.x <= 36) { a.powered = true; a.energizer = false; p.dir = RIGHT; this.sfx('attractPower'); }
    } else {
      p.x += 1.1; p.anim++;
      a.ghosts.forEach(function (g) { if (g.alive) g.x += 0.55; });
      for (var i = 0; i < 4; i++) {
        var g = a.ghosts[i];
        if (g.alive && Math.abs(g.x - p.x) < 4) {
          g.alive = false;
          a.eaten = { x: g.x, pts: [200, 400, 800, 1600][a.combo] };
          a.combo++;
          a.freeze = 60;
          this.sfx('ghost');
          break;
        }
      }
      if (p.x > 250) a.done = 1;
    }
  };

  PM.Game = Game;
  PM.TOTAL_DOTS = TOTAL_DOTS;
})(window.PM);
