/* Dino Run: the game simulation.
 *
 * Pure logic with no DOM, so the same file runs in the browser and in node for
 * the tests. Numbers follow Chrome's offline T-Rex runner: a 600x150 playfield,
 * speed 6 accelerating by 0.001 a frame to 13, gravity 0.6, the same jump
 * velocities and caps, the same obstacle table and gap formula, night every
 * 700 points for 12 seconds. Everything steps at a fixed 60 Hz.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DinoCore = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var WIDTH = 600;
  var HEIGHT = 150;
  var FRAME_MS = 1000 / 60;

  var C = {
    WIDTH: WIDTH,
    HEIGHT: HEIGHT,
    FPS: 60,
    FRAME_MS: FRAME_MS,

    // Runner
    SPEED: 6,
    MAX_SPEED: 13,
    ACCELERATION: 0.001,
    GAP_COEFFICIENT: 0.6,
    MAX_GAP_COEFFICIENT: 1.5,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_OBSTACLE_DUPLICATION: 2,
    CLEAR_TIME: 3000,            // ms of running before the first obstacle
    GAMEOVER_CLEAR_TIME: 750,    // ms before a jump press restarts
    INVERT_DISTANCE: 700,        // night every 700 points...
    INVERT_DURATION: 12000,      // ...for 12 seconds
    INVERT_FADE_FRAMES: 90,      // 1.5 s colour fade either way
    BOTTOM_PAD: 10,
    REVEAL_FRAMES: 24,           // the 0.4 s "ground extends" intro

    // T-Rex
    TREX_WIDTH: 44,
    TREX_HEIGHT: 47,
    TREX_WIDTH_DUCK: 59,
    TREX_HEIGHT_DUCK: 25,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: -10,
    DROP_VELOCITY: -5,
    MIN_JUMP_HEIGHT: 30,
    MAX_JUMP_Y: 30,              // the jump is capped once the top passes y=30
    SPEED_DROP_COEFFICIENT: 3,
    START_X: 50,
    JUMP_BUFFER_FRAMES: 6,       // a press just before landing still counts
    BLINK_MIN_MS: 1500,
    BLINK_MAX_MS: 7000,
    BLINK_MS: 150,

    // Distance meter
    DISTANCE_COEFFICIENT: 0.025,
    ACHIEVEMENT_DISTANCE: 100,
    FLASH_MS: 250,
    FLASH_ITERATIONS: 3,

    // Scenery
    CLOUD_SPEED: 0.15,           // fraction of the ground speed
    CLOUD_FREQUENCY: 0.5,
    MAX_CLOUDS: 6,
    CLOUD_WIDTH: 46,
    CLOUD_MIN_GAP: 100,
    CLOUD_MAX_GAP: 400,
    CLOUD_MIN_Y: 30,
    CLOUD_MAX_Y: 71,
    GROUND_WIDTH: 600,
    GROUND_TYPES: 3,             // 0 flat, 1-2 bumpy
    BUMPY_THRESHOLD: 0.3,
    MOON_SPEED: 0.25,
    STAR_SPEED: 0.3,
    NUM_STARS: 2,
    STAR_MAX_Y: 70,
    MOON_WIDTH: 24,
    MOON_PHASES: 7
  };
  C.GROUND_Y = HEIGHT - C.TREX_HEIGHT - C.BOTTOM_PAD; // 93: the T-Rex's y when standing
  C.MIN_JUMP_Y = C.GROUND_Y - C.MIN_JUMP_HEIGHT;      // 63
  C.GROUND_LINE_Y = 137;                               // the horizon line row

  // ------------------------------------------------------------------ boxes
  // Collision boxes are [x, y, w, h] in sprite pixels. Each set is a cover of
  // the sprite made only of solid pixels (generated from the art in
  // sprites.js and checked against it by the tests), so a hit always means
  // the pixels really touch, while the small bits left out (toes, the hand,
  // the tail tip) give a little slack on near misses. Like the original, the
  // pterodactyl's wings don't count, only its head and body.
  var TREX_BOXES = {
    STAND: [
      [7, 25, 20, 10], [23, 5, 8, 24], [29, 1, 12, 10], [15, 21, 10, 16], [1, 21, 6, 8], [21, 15, 2, 30],
      [11, 25, 4, 16], [17, 19, 20, 2], [5, 25, 24, 8], [29, 3, 14, 8], [23, 13, 16, 2], [1, 15, 2, 14]
    ],
    RUN: [
      [ // back leg up
        [7, 25, 20, 10], [23, 5, 8, 24], [29, 1, 12, 10], [15, 21, 10, 16], [1, 21, 6, 8], [21, 15, 2, 30],
        [17, 19, 20, 2], [5, 25, 24, 8], [29, 3, 14, 8], [11, 25, 4, 14], [23, 13, 16, 2], [1, 15, 2, 14]
      ],
      [ // front leg up
        [7, 25, 20, 10], [23, 5, 8, 24], [29, 1, 12, 10], [15, 21, 10, 16], [1, 21, 6, 8], [19, 17, 10, 16],
        [11, 25, 4, 16], [29, 3, 14, 8], [17, 19, 20, 2], [23, 13, 16, 2], [21, 15, 2, 26], [3, 23, 6, 8]
      ]
    ],
    DUCK: [
      [
        [9, 21, 34, 12], [13, 19, 20, 18], [3, 23, 56, 4], [7, 23, 44, 8], [47, 19, 10, 8], [25, 19, 2, 26],
        [11, 21, 26, 14], [1, 21, 4, 4], [7, 29, 48, 2], [15, 19, 4, 20], [39, 21, 4, 14], [43, 19, 14, 2]
      ],
      [
        [9, 21, 34, 12], [13, 19, 20, 18], [3, 23, 56, 4], [7, 23, 44, 8], [47, 19, 10, 8], [15, 19, 4, 22],
        [11, 21, 26, 14], [1, 21, 4, 4], [7, 29, 48, 2], [23, 19, 4, 20], [39, 21, 4, 14], [15, 19, 2, 26]
      ]
    ]
  };

  var PTERO_BOXES = [
    [20, 16, 16, 10], [10, 10, 10, 8], [18, 18, 24, 6], [0, 14, 8, 4],
    [22, 16, 10, 12], [16, 12, 6, 8], [18, 20, 28, 2], [8, 10, 12, 4]
  ];

  // Cacti are built from a trunk and up to two arms. The sprite module draws
  // them from these same numbers, so the boxes always match the pixels.
  // trunk: [x, w]; arm: [x, w, top, elbowTop, elbowH].
  var CACTUS_VARIANTS = {
    CACTUS_SMALL: [
      { trunk: [5, 6], left: [1, 3, 8, 17, 3], right: [13, 3, 4, 12, 3] },
      { trunk: [5, 6], left: [1, 3, 11, 20, 3], right: [13, 3, 6, 15, 3] },
      { trunk: [6, 6], left: [2, 3, 6, 14, 3], right: [14, 3, 10, 18, 3] },
      { trunk: [5, 6], left: [1, 3, 13, 21, 3], right: null }
    ],
    CACTUS_LARGE: [
      { trunk: [9, 7], left: [2, 4, 12, 26, 4], right: [19, 4, 10, 22, 4] },
      { trunk: [9, 7], left: [2, 4, 18, 30, 4], right: [19, 4, 7, 19, 4] },
      { trunk: [9, 7], left: [2, 4, 9, 22, 4], right: [19, 4, 15, 28, 4] },
      { trunk: [9, 7], left: null, right: [19, 4, 11, 24, 4] }
    ]
  };

  // The tips are rounded and the elbows' outer bottom corners are cut, so the
  // boxes leave those pixels out.
  function cactusBoxes(v, h) {
    var tx = v.trunk[0], tw = v.trunk[1];
    var b = [[tx, 1, tw, h - 1]];
    [v.left, v.right].forEach(function (a) {
      if (!a) return;
      var ax = a[0], aw = a[1], top = a[2], et = a[3], eh = a[4];
      var leftSide = ax < tx;
      var x0 = Math.min(ax, tx + tw), x1 = Math.max(ax + aw, tx);
      b.push([ax, top + 1, aw, et + eh - top - 2]);              // upright, minus the cut corner row
      b.push([x0, et, x1 - x0, eh - 1]);                          // elbow into the trunk
      if (leftSide) b.push([ax + 1, et + eh - 1, x1 - ax - 1, 1]);
      else b.push([x0, et + eh - 1, ax + aw - 1 - x0, 1]);
    });
    return b;
  }

  var OBSTACLE_TYPES = [
    { name: 'CACTUS_SMALL', width: 17, height: 35, y: 105, multipleSpeed: 4, minGap: 120, minSpeed: 0 },
    { name: 'CACTUS_LARGE', width: 25, height: 50, y: 90, multipleSpeed: 7, minGap: 120, minSpeed: 0 },
    { name: 'PTERODACTYL', width: 46, height: 40, y: [100, 75, 50], multipleSpeed: 999, minGap: 150,
      minSpeed: 8.5, numFrames: 2, frameMs: 1000 / 6, speedOffset: 0.8 }
  ];
  var TYPE_BY_NAME = {};
  OBSTACLE_TYPES.forEach(function (t) { TYPE_BY_NAME[t.name] = t; });

  // ------------------------------------------------------------------ rng
  // mulberry32: tiny, seedable and its state is one integer, which lets the
  // tests copy a game exactly.
  function makeRng(seed) {
    var a = seed >>> 0;
    var r = function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.getState = function () { return a; };
    r.setState = function (s) { a = s | 0; };
    return r;
  }
  function randInt(rng, min, max) { return Math.floor(rng() * (max - min + 1)) + min; }
  function randomSeed() { return (Math.random() * 4294967296) >>> 0; }

  // ------------------------------------------------------------------ T-Rex
  function newTrex(x) {
    return {
      x: x, y: C.GROUND_Y, vy: 0,
      status: 'waiting',            // waiting | running | jumping | ducking | crashed
      jumping: false, ducking: false,
      reachedMin: false, speedDrop: false, endPending: false,
      jumpCount: 0, buffer: 0,
      frame: 0, animMs: 0, blinkMs: 0, blinkDelay: 3000, blinking: false,
      peakY: C.GROUND_Y
    };
  }

  function trexStartJump(t, speed) {
    if (t.jumping) return false;
    t.status = 'jumping';
    t.ducking = false;
    t.vy = C.INITIAL_JUMP_VELOCITY - speed / 10;
    t.jumping = true;
    t.reachedMin = false;
    t.speedDrop = false;
    t.endPending = false;
    t.buffer = 0;
    t.frame = 0;
    t.animMs = 0;
    t.peakY = t.y;
    return true;
  }

  // Cut the climb short (but never below the minimum hop).
  function trexEndJump(t) {
    if (t.reachedMin && t.vy < C.DROP_VELOCITY) t.vy = C.DROP_VELOCITY;
  }

  // Releasing before the minimum height is remembered and applied when it is
  // reached, so the quickest tap is the smallest hop.
  function trexReleaseJump(t) {
    if (!t.jumping) return;
    if (t.reachedMin) trexEndJump(t);
    else t.endPending = true;
  }

  function trexSpeedDrop(t) {
    if (!t.jumping || t.speedDrop) return;
    t.speedDrop = true;
    t.vy = 1;
  }

  function trexSetDuck(t, on) {
    if (on) {
      if (t.jumping || t.ducking || t.status === 'crashed') return false;
      t.status = 'ducking';
      t.ducking = true;
      t.frame = 0;
      t.animMs = 0;
      return true;
    }
    if (t.ducking) {
      t.status = 'running';
      t.ducking = false;
      t.frame = 0;
      t.animMs = 0;
    }
    return false;
  }

  // One frame of the jump arc. Returns true on the frame it lands.
  function trexUpdateJump(t) {
    t.y += Math.round(t.speedDrop ? t.vy * C.SPEED_DROP_COEFFICIENT : t.vy);
    t.vy += C.GRAVITY;
    if (t.y < t.peakY) t.peakY = t.y;
    if (t.y < C.MIN_JUMP_Y || t.speedDrop) t.reachedMin = true;
    if (t.endPending && t.reachedMin) {
      t.endPending = false;
      trexEndJump(t);
    }
    if (t.y < C.MAX_JUMP_Y || t.speedDrop) trexEndJump(t);
    if (t.y > C.GROUND_Y) {
      t.y = C.GROUND_Y;
      t.vy = 0;
      t.jumping = false;
      t.speedDrop = false;
      t.reachedMin = false;
      t.endPending = false;
      t.status = 'running';
      t.frame = 0;
      t.animMs = 0;
      t.jumpCount++;
      return true;
    }
    return false;
  }

  // Physics for one frame given what is held. Shared by the game and the test
  // autoplayer so both see exactly the same arc. Returns bit flags:
  // 1 = landed, 2 = started a new jump on landing.
  function trexStep(t, held, speed) {
    var r = 0;
    if (t.jumping && trexUpdateJump(t)) {
      r |= 1;
      if (held.duck) {
        trexSetDuck(t, true);
      } else if ((held.jump && held.repeat) || t.buffer > 0) {
        var buffered = t.buffer > 0;
        trexStartJump(t, speed);
        if (buffered && !held.jump) t.endPending = true;
        r |= 2;
      }
    }
    if (t.buffer > 0) t.buffer--;
    return r;
  }

  var ANIM = {
    waiting: { frames: 1, ms: 1000 / 3 },
    running: { frames: 2, ms: 1000 / 12 },
    ducking: { frames: 2, ms: 1000 / 8 },
    jumping: { frames: 1, ms: 1000 / 60 },
    crashed: { frames: 1, ms: 1000 / 60 }
  };

  function trexAnimate(t, rng) {
    if (t.status === 'waiting') {
      t.blinkMs += FRAME_MS;
      if (t.blinking) {
        if (t.blinkMs >= C.BLINK_MS) {
          t.blinking = false;
          t.blinkMs = 0;
          t.blinkDelay = C.BLINK_MIN_MS + rng() * (C.BLINK_MAX_MS - C.BLINK_MIN_MS);
        }
      } else if (t.blinkMs >= t.blinkDelay) {
        t.blinking = true;
        t.blinkMs = 0;
      }
      return;
    }
    var a = ANIM[t.status];
    t.animMs += FRAME_MS;
    if (t.animMs >= a.ms - 0.001) {
      t.animMs = 0;
      t.frame = (t.frame + 1) % a.frames;
    }
  }

  function trexBoxes(t) {
    if (t.ducking) return TREX_BOXES.DUCK[t.frame & 1];
    if (t.status === 'running') return TREX_BOXES.RUN[t.frame & 1];
    return TREX_BOXES.STAND;
  }

  // ------------------------------------------------------------------ collision
  function boxHit(ax, ay, a, bx, by, b) {
    return ax + a[0] < bx + b[0] + b[2] &&
      ax + a[0] + a[2] > bx + b[0] &&
      ay + a[1] < by + b[1] + b[3] &&
      ay + a[1] + a[3] > by + b[1];
  }

  // Obstacles move in sub-pixels but are drawn and tested on whole pixels.
  function obstacleX(o) { return Math.round(o.x); }

  function collides(t, o, ox) {
    if (ox === undefined) ox = obstacleX(o);
    var tw = t.ducking ? C.TREX_WIDTH_DUCK : C.TREX_WIDTH;
    if (ox >= t.x + tw || ox + o.width <= t.x) return false;
    if (o.y >= t.y + C.TREX_HEIGHT || o.y + o.height <= t.y) return false;
    var tb = trexBoxes(t);
    for (var i = 0; i < tb.length; i++) {
      for (var j = 0; j < o.boxes.length; j++) {
        if (boxHit(t.x, t.y, tb[i], ox, o.y, o.boxes[j])) return true;
      }
    }
    return false;
  }

  function scoreFromDistance(d) {
    return d > 0 ? Math.round(Math.ceil(d) * C.DISTANCE_COEFFICIENT) : 0;
  }

  // ------------------------------------------------------------------ obstacles
  function makeObstacle(type, size, speed, rng, opts) {
    opts = opts || {};
    if (size > 1 && type.multipleSpeed > speed) size = 1;
    var o = {
      type: type.name, size: size,
      width: type.width * size, height: type.height,
      x: C.WIDTH + type.width, y: 0,
      speedOffset: 0, frame: 0, frameMs: 0,
      gap: 0, followingCreated: false,
      variants: [], boxes: []
    };
    if (Array.isArray(type.y)) {
      o.y = type.y[opts.yIndex !== undefined ? opts.yIndex : randInt(rng, 0, type.y.length - 1)];
    } else {
      o.y = type.y;
    }
    if (type.speedOffset) {
      o.speedOffset = opts.speedOffset !== undefined ? opts.speedOffset
        : (rng() > 0.5 ? type.speedOffset : -type.speedOffset);
      o.boxes = PTERO_BOXES;
    } else {
      var vs = CACTUS_VARIANTS[type.name];
      for (var i = 0; i < size; i++) {
        var vi = randInt(rng, 0, vs.length - 1);
        o.variants.push(vi);
        var bs = cactusBoxes(vs[vi], type.height);
        for (var k = 0; k < bs.length; k++) {
          o.boxes.push([bs[k][0] + i * type.width, bs[k][1], bs[k][2], bs[k][3]]);
        }
      }
    }
    // Gap to the next obstacle grows with this one's width and the speed.
    var minGap = Math.round(o.width * speed + type.minGap * C.GAP_COEFFICIENT);
    var maxGap = Math.round(minGap * C.MAX_GAP_COEFFICIENT);
    o.gap = randInt(rng, minGap, maxGap);
    return o;
  }

  // ------------------------------------------------------------------ game
  function Game(opts) {
    opts = opts || {};
    this.rng = opts.rng || makeRng(opts.seed !== undefined ? opts.seed : randomSeed());
    this.fx = opts.fxRng || makeRng(opts.fxSeed !== undefined ? opts.fxSeed : randomSeed());
    this.hiScore = opts.highScore | 0;
    this.events = [];
    this.night = {
      amount: 0, target: 0, timer: 0, phase: C.MOON_PHASES - 1, fade: 1 / C.INVERT_FADE_FRAMES,
      moonX: C.WIDTH - 50, stars: []
    };
    for (var i = 0; i < C.NUM_STARS; i++) {
      var seg = C.WIDTH / C.NUM_STARS;
      this.night.stars.push({
        x: randInt(this.fx, seg * i, seg * (i + 1)),
        y: randInt(this.fx, 2, C.STAR_MAX_Y),
        kind: i % 2
      });
    }
    this.clouds = [];
    this.addCloud();
    this.reset();
  }

  Game.prototype.emit = function (name) { this.events.push(name); };
  Game.prototype.drainEvents = function () { var e = this.events; this.events = []; return e; };

  Game.prototype.reset = function () {
    this.state = 'waiting';   // waiting | starting | playing | crashed
    this.frame = 0;
    this.trex = newTrex(0);
    this.held = { jump: false, duck: false, repeat: false };
    this.speed = C.SPEED;
    this.distanceRan = 0;
    this.score = 0;
    this.displayScore = 0;
    this.lastNightScore = 0;
    this.runningTime = 0;
    this.revealFrames = 0;
    this.activated = false;
    this.obstacles = [];
    this.history = [];
    this.ground = [{ x: 0, type: 0 }, { x: C.GROUND_WIDTH, type: this.groundType() }];
    this.flash = { active: false, ms: 0, iterations: 0, value: 0, paint: true };
    this.stats = { jumps: 0, ducks: 0, frames: 0 };
    this.crashFrame = -1;
    this.newHigh = false;
    this.crashedInto = null;
  };

  Game.prototype.groundType = function () {
    return this.fx() > C.BUMPY_THRESHOLD ? randInt(this.fx, 1, C.GROUND_TYPES - 1) : 0;
  };

  Game.prototype.isRunning = function () {
    return this.state === 'starting' || this.state === 'playing';
  };

  Game.prototype.canRestart = function () {
    return this.state === 'crashed' &&
      (this.frame - this.crashFrame) * FRAME_MS >= C.GAMEOVER_CLEAR_TIME;
  };

  // How much of the strip is uncovered: 44 px around the waiting T-Rex, then
  // it eases out to the full width as the run starts.
  Game.prototype.revealWidth = function () {
    if (this.state === 'waiting' || this.state === 'starting') return C.TREX_WIDTH;
    if (this.revealFrames >= C.REVEAL_FRAMES) return C.WIDTH;
    var p = this.revealFrames / C.REVEAL_FRAMES;
    p = 1 - Math.pow(1 - p, 3);
    return C.TREX_WIDTH + (C.WIDTH - C.TREX_WIDTH) * p;
  };

  // ---- input. `repeat` means a held press keeps jumping on landing, like a
  // held key does in the original; touches don't auto-repeat.
  Game.prototype.pressJump = function (opt) {
    this.held.jump = true;
    this.held.repeat = !!(opt && opt.repeat);
    var t = this.trex;
    if (this.state === 'crashed') {
      if (this.canRestart()) this.restart();
      return;
    }
    if (this.state === 'waiting') {
      this.state = 'starting';
      t.status = 'running';
      trexStartJump(t, this.speed);
      this.stats.jumps++;
      this.emit('jump');
      return;
    }
    if (t.jumping) {
      t.buffer = C.JUMP_BUFFER_FRAMES;
      return;
    }
    if (trexStartJump(t, this.speed)) {
      this.stats.jumps++;
      this.emit('jump');
    }
  };

  Game.prototype.releaseJump = function () {
    this.held.jump = false;
    trexReleaseJump(this.trex);
  };

  Game.prototype.pressDuck = function () {
    this.held.duck = true;
    if (!this.isRunning()) return;
    var t = this.trex;
    if (t.jumping) trexSpeedDrop(t);
    else if (trexSetDuck(t, true)) this.stats.ducks++;
  };

  Game.prototype.releaseDuck = function () {
    this.held.duck = false;
    var t = this.trex;
    t.speedDrop = false;
    if (t.status !== 'crashed') trexSetDuck(t, false);
  };

  Game.prototype.releaseAll = function () {
    this.releaseJump();
    this.releaseDuck();
  };

  // ---- the frame
  Game.prototype.step = function () {
    this.frame++;
    var t = this.trex;
    if (this.state === 'waiting') {
      trexAnimate(t, this.fx);
      this.updateNightFade();
      return;
    }
    if (this.state === 'crashed') return;

    this.runningTime += FRAME_MS;
    var r = trexStep(t, this.held, this.speed);
    if (r & 2) {
      this.stats.jumps++;
      this.emit('jump');
    } else if ((r & 1) && t.ducking) {
      this.stats.ducks++;
    }

    if (this.state === 'starting') {
      // The first landing sets the intro going.
      if (t.jumpCount < 1) {
        trexAnimate(t, this.fx);
        return;
      }
      this.state = 'playing';
      this.revealFrames = 0;
      this.emit('intro');
    }

    if (this.revealFrames < C.REVEAL_FRAMES) {
      this.revealFrames++;
      if (this.revealFrames >= C.REVEAL_FRAMES) this.activated = true;
    }
    if (t.x < C.START_X) t.x = Math.min(C.START_X, t.x + 1);

    var hasObstacles = this.runningTime > C.CLEAR_TIME;
    if (this.activated) {
      this.updateGround();
      this.updateClouds();
      if (hasObstacles) this.updateObstacles();
    }
    trexAnimate(t, this.fx);

    if (hasObstacles && !this.noCollide) {
      for (var i = 0; i < this.obstacles.length; i++) {
        if (collides(t, this.obstacles[i])) {
          this.crash(this.obstacles[i]);
          return;
        }
      }
    }

    if (this.activated) {
      this.distanceRan += this.speed;
      if (this.speed < C.MAX_SPEED) this.speed = Math.min(C.MAX_SPEED, this.speed + C.ACCELERATION);
    }
    this.updateScore();
    this.updateNight();
    this.stats.frames++;
  };

  Game.prototype.updateGround = function () {
    for (var i = 0; i < this.ground.length; i++) {
      var g = this.ground[i];
      g.x -= this.speed;
      if (g.x <= -C.GROUND_WIDTH) {
        g.x += C.GROUND_WIDTH * this.ground.length;
        g.type = this.groundType();
      }
    }
  };

  // Fractional part of the ground scroll, so new obstacles round the same
  // way as the ground under them and never shimmer against it.
  Game.prototype.scrollFraction = function () {
    var x = this.ground[0].x;
    return x - Math.floor(x);
  };

  Game.prototype.addCloud = function () {
    this.clouds.push({
      x: C.WIDTH,
      y: randInt(this.fx, C.CLOUD_MIN_Y, C.CLOUD_MAX_Y),
      gap: randInt(this.fx, C.CLOUD_MIN_GAP, C.CLOUD_MAX_GAP)
    });
  };

  Game.prototype.updateClouds = function () {
    var v = this.speed * C.CLOUD_SPEED;
    for (var i = 0; i < this.clouds.length; i++) this.clouds[i].x -= v;
    this.clouds = this.clouds.filter(function (c) { return c.x + C.CLOUD_WIDTH > 0; });
    var last = this.clouds[this.clouds.length - 1];
    if (!last) this.addCloud();
    else if (this.clouds.length < C.MAX_CLOUDS && (C.WIDTH - last.x) > last.gap &&
      this.fx() < C.CLOUD_FREQUENCY) this.addCloud();
  };

  Game.prototype.updateObstacles = function () {
    var obs = this.obstacles;
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      o.x -= this.speed + o.speedOffset;
      if (o.speedOffset) {
        o.frameMs += FRAME_MS;
        if (o.frameMs >= 1000 / 6) { o.frameMs = 0; o.frame ^= 1; }
      }
    }
    while (obs.length && obs[0].x + obs[0].width <= 0) obs.shift();
    var last = obs[obs.length - 1];
    if (!last) {
      this.addObstacle();
    } else if (!last.followingCreated && last.x + last.width + last.gap < C.WIDTH) {
      this.addObstacle();
      last.followingCreated = true;
    }
  };

  Game.prototype.isDuplicate = function (name) {
    var n = 0;
    for (var i = 0; i < this.history.length; i++) n = this.history[i] === name ? n + 1 : 0;
    return n >= C.MAX_OBSTACLE_DUPLICATION;
  };

  Game.prototype.pickType = function () {
    var speed = this.speed, type = null;
    for (var tries = 0; tries < 30 && !type; tries++) {
      var t = OBSTACLE_TYPES[randInt(this.rng, 0, OBSTACLE_TYPES.length - 1)];
      if (!this.isDuplicate(t.name) && speed >= t.minSpeed) type = t;
    }
    if (!type) {
      for (var i = 0; i < OBSTACLE_TYPES.length && !type; i++) {
        var u = OBSTACLE_TYPES[i];
        if (!this.isDuplicate(u.name) && speed >= u.minSpeed) type = u;
      }
    }
    return type || OBSTACLE_TYPES[0];
  };

  Game.prototype.addObstacle = function (forced) {
    var type = forced ? TYPE_BY_NAME[forced.type] : this.pickType();
    var size = forced && forced.size ? forced.size : randInt(this.rng, 1, C.MAX_OBSTACLE_LENGTH);
    var o = makeObstacle(type, size, this.speed, this.rng, forced);
    o.x = C.WIDTH + type.width + this.scrollFraction();
    // A pterodactyl flies a little faster or slower than the ground. If that
    // closes the gap to its neighbour, start it further back by the amount it
    // will close before reaching the T-Rex, so the spacing stays fair.
    var prev = this.obstacles[this.obstacles.length - 1];
    var closing = o.speedOffset - (prev ? prev.speedOffset : 0);
    if (prev && closing > 0) {
      o.x += Math.ceil(closing * (o.x - C.START_X) / (this.speed + o.speedOffset));
    }
    this.obstacles.push(o);
    this.history.unshift(type.name);
    if (this.history.length > C.MAX_OBSTACLE_DUPLICATION) this.history.length = C.MAX_OBSTACLE_DUPLICATION;
    return o;
  };

  Game.prototype.crash = function (o) {
    var t = this.trex;
    this.state = 'crashed';
    this.crashFrame = this.frame;
    this.crashedInto = o ? o.type : null;
    if (t.ducking) t.x += 1;   // the crash pose stands up
    t.status = 'crashed';
    t.ducking = false;
    t.jumping = false;
    this.emit('crash');
    if (this.score > this.hiScore) {
      this.hiScore = this.score;
      this.newHigh = true;
      this.emit('highscore');
    }
  };

  Game.prototype.restart = function () {
    var hold = this.held;
    var phase = this.night.phase;
    this.reset();
    this.held = { jump: hold.jump, duck: hold.duck, repeat: hold.repeat };
    this.night.target = 0;
    this.night.timer = 0;
    this.night.phase = phase;
    this.night.fade = 1 / 20;     // back to day quickly
    this.state = 'playing';
    this.trex = newTrex(C.START_X);
    this.trex.status = 'running';
    this.revealFrames = C.REVEAL_FRAMES;
    this.activated = true;
    this.emit('restart');
  };

  Game.prototype.updateScore = function () {
    var s = scoreFromDistance(this.distanceRan);
    var f = this.flash;
    if (s !== this.score) {
      if (!f.active && s > 0 &&
        Math.floor(s / C.ACHIEVEMENT_DISTANCE) > Math.floor(this.score / C.ACHIEVEMENT_DISTANCE)) {
        f.active = true;
        f.ms = 0;
        f.iterations = 0;
        f.value = Math.floor(s / C.ACHIEVEMENT_DISTANCE) * C.ACHIEVEMENT_DISTANCE;
        this.emit('score');
      }
      this.score = s;
    }
    if (f.active) {
      f.ms += FRAME_MS;
      if (f.ms < C.FLASH_MS) {
        f.paint = false;
      } else {
        f.paint = true;
        if (f.ms > C.FLASH_MS * 2) {
          f.ms = 0;
          f.iterations++;
          if (f.iterations > C.FLASH_ITERATIONS) f.active = false;
        }
      }
    } else {
      f.paint = true;
    }
    this.displayScore = f.active ? f.value : this.score;
  };

  Game.prototype.updateNight = function () {
    var n = this.night;
    if (n.timer > 0) {
      n.timer += FRAME_MS;
      if (n.timer > C.INVERT_DURATION) {
        n.timer = 0;
        n.target = 0;
        this.emit('nightEnd');
      }
    } else if (this.score > 0 &&
      Math.floor(this.score / C.INVERT_DISTANCE) > Math.floor(this.lastNightScore / C.INVERT_DISTANCE)) {
      n.timer = FRAME_MS;
      n.target = 1;
      n.fade = 1 / C.INVERT_FADE_FRAMES;
      n.phase = (n.phase + 1) % C.MOON_PHASES;
      this.emit('nightStart');
    }
    this.lastNightScore = this.score;
    this.updateNightFade();
    if (n.amount > 0) {
      n.moonX -= C.MOON_SPEED;
      if (n.moonX < -C.MOON_WIDTH) n.moonX = C.WIDTH;
      for (var i = 0; i < n.stars.length; i++) {
        var s = n.stars[i];
        s.x -= C.STAR_SPEED;
        if (s.x < -10) {
          s.x = C.WIDTH;
          s.y = randInt(this.fx, 2, C.STAR_MAX_Y);
        }
      }
    }
  };

  Game.prototype.updateNightFade = function () {
    var n = this.night;
    if (n.amount < n.target) n.amount = Math.min(n.target, n.amount + n.fade);
    else if (n.amount > n.target) n.amount = Math.max(n.target, n.amount - n.fade);
  };

  // ---- debug helpers (used by the tests and window.__dino)
  Game.prototype.setScore = function (n) {
    this.distanceRan = Math.max(0, n) / C.DISTANCE_COEFFICIENT;
    this.score = scoreFromDistance(this.distanceRan);
    this.displayScore = this.score;
    this.lastNightScore = this.score;
    this.flash.active = false;
    this.flash.paint = true;
  };

  Game.prototype.spawn = function (type, opts) {
    opts = opts || {};
    var o = this.addObstacle({ type: type, size: opts.size || 1, yIndex: opts.yIndex, speedOffset: opts.speedOffset });
    if (opts.x !== undefined) o.x = opts.x;
    return o;
  };

  return {
    C: C,
    TREX_BOXES: TREX_BOXES,
    PTERO_BOXES: PTERO_BOXES,
    CACTUS_VARIANTS: CACTUS_VARIANTS,
    OBSTACLE_TYPES: OBSTACLE_TYPES,
    cactusBoxes: cactusBoxes,
    makeRng: makeRng,
    randInt: randInt,
    newTrex: newTrex,
    trexStartJump: trexStartJump,
    trexEndJump: trexEndJump,
    trexReleaseJump: trexReleaseJump,
    trexSpeedDrop: trexSpeedDrop,
    trexSetDuck: trexSetDuck,
    trexUpdateJump: trexUpdateJump,
    trexStep: trexStep,
    trexBoxes: trexBoxes,
    boxHit: boxHit,
    collides: collides,
    obstacleX: obstacleX,
    makeObstacle: makeObstacle,
    scoreFromDistance: scoreFromDistance,
    Game: Game
  };
}));
