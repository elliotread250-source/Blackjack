/* Breakout game engine: rules + physics only, no DOM.
 *
 * Runs as a browser global (window.BreakoutEngine) and as a CommonJS module so
 * the physics can be exercised headless in Node. Everything advances in fixed
 * 1/120 s steps; the ball is moved with swept circle-vs-rectangle tests (the
 * earliest contact inside the step wins, then the rest of the step continues
 * from the contact point), so it cannot tunnel through bricks or the paddle at
 * any speed. Rendering, audio and input live elsewhere and talk to the engine
 * through `game.input` (in) and `game.drain()` events (out).
 */
(function (root, factory) {
  var isNode = typeof module === 'object' && module.exports;
  var levels = isNode ? require('./levels.js') : root.BreakoutLevels;
  var api = factory(levels);
  if (isNode) module.exports = api;
  else root.BreakoutEngine = api;
})(typeof self !== 'undefined' ? self : this, function (LEVELS) {
  'use strict';

  // ---- geometry (logical units; the renderer scales these to the screen) ----
  const W = 480;              // playfield width
  const WALL = 12;            // side wall thickness
  const HUD_H = 50;           // HUD strip; the top wall is its lower edge
  const MIN_H = 600, MAX_H = 1000;
  const STEP = 1 / 120;

  const BALL_R = 6;
  const PADDLE_H = 12;
  const PADDLE_GAP = 64;      // paddle top sits this far above the bottom edge
  const PADDLE_W = 84, PADDLE_W_CLASSIC = 78;
  const PADDLE_MAX_SPEED = 3600;
  const KEY_SPEED = 640;

  const DEG = Math.PI / 180;
  const MAX_BOUNCE = 62 * DEG;          // steepest paddle deflection from vertical
  const MIN_BOUNCE = 5 * DEG;           // never straight up off the paddle
  const MIN_SIN_H = Math.sin(20 * DEG); // never flatter than 20 deg from horizontal
  const MIN_SIN_V = Math.sin(4 * DEG);  // never closer than 4 deg to vertical

  const CAP_W = 34, CAP_H = 15, CAP_VY = 135;
  const LASER_VY = 900, LASER_CD = 0.2, LASER_LEN = 12;
  const MAX_BALLS = 8, MAX_LIVES = 6, START_LIVES = 3;
  const DROP_CHANCE = 0.16, MAX_CAPSULES = 2;
  const LOOP_LIMIT = 9;       // seconds without a paddle/brick hit before nudging the ball

  const CLASSIC_SPEEDS = [300, 350, 410, 480, 560];
  const ARCADE_COLS = 13, CLASSIC_COLS = 14;

  const BRICKS = {
    w: { hp: 1, pts: 50 }, o: { hp: 1, pts: 60 }, c: { hp: 1, pts: 70 }, g: { hp: 1, pts: 80 },
    r: { hp: 1, pts: 90 }, b: { hp: 1, pts: 100 }, p: { hp: 1, pts: 110 }, m: { hp: 1, pts: 110 },
    y: { hp: 1, pts: 120 }, x: { hp: 2, pts: 200 }, X: { hp: 3, pts: 300 },
    '#': { hp: 0, pts: 0, steel: true },
  };
  // Atari 1976: red, red, orange, orange, green, green, yellow, yellow (top to bottom).
  const CLASSIC_ROWS = [['cr', 7], ['cr', 7], ['co', 5], ['co', 5], ['cg', 3], ['cg', 3], ['cy', 1], ['cy', 1]];

  const POWERUPS = {
    expand: { label: 'E', name: 'EXPAND', color: '#3f7dff', good: true, weight: 14, dur: 20 },
    shrink: { label: '-', name: 'SHRINK', color: '#e8253f', good: false, weight: 8, dur: 12 },
    multi: { label: 'M', name: 'MULTI-BALL', color: '#1ec8e6', good: true, weight: 13, dur: 0 },
    slow: { label: 'S', name: 'SLOW', color: '#f4b81f', good: true, weight: 11, dur: 10 },
    laser: { label: 'L', name: 'LASER', color: '#ff4f9e', good: true, weight: 11, dur: 15 },
    catch: { label: 'C', name: 'CATCH', color: '#2fd36b', good: true, weight: 11, dur: 20 },
    life: { label: '+', name: 'EXTRA LIFE', color: '#bcc4d8', good: true, weight: 3, dur: 0 },
    fire: { label: 'F', name: 'FIREBALL', color: '#ff7a1a', good: true, weight: 7, dur: 10 },
  };
  const TIMED = ['expand', 'shrink', 'slow', 'laser', 'catch', 'fire'];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function clampH(h) { return clamp(Math.round(h), MIN_H, MAX_H); }

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---- swept circle vs axis-aligned rectangle ----
  // Moves a circle of radius r from (px,py) by (dx,dy). Returns true if it touches
  // the rectangle during the move; the time of impact (0..1) and the contact
  // normal are left in HIT. Uses the rectangle grown by r: four faces plus four
  // rounded corners, and only counts surfaces the circle is moving towards.
  const HIT = { t: 0, nx: 0, ny: 0 };
  const T_EPS = 1e-6;
  function sweepRect(px, py, dx, dy, r, rx, ry, rw, rh) {
    const x0 = rx - r, x1 = rx + rw + r, y0 = ry - r, y1 = ry + rh + r;
    const ex = px + dx, ey = py + dy;
    if ((px < ex ? ex : px) < x0 || (px < ex ? px : ex) > x1 || (py < ey ? ey : py) < y0 || (py < ey ? py : ey) > y1) return false;
    let best = 2, nx = 0, ny = 0, t, c;
    if (dx > 0) { t = (x0 - px) / dx; if (t >= -T_EPS && t < best) { c = py + dy * t; if (c >= ry && c <= ry + rh) { best = t; nx = -1; ny = 0; } } }
    else if (dx < 0) { t = (x1 - px) / dx; if (t >= -T_EPS && t < best) { c = py + dy * t; if (c >= ry && c <= ry + rh) { best = t; nx = 1; ny = 0; } } }
    if (dy > 0) { t = (y0 - py) / dy; if (t >= -T_EPS && t < best) { c = px + dx * t; if (c >= rx && c <= rx + rw) { best = t; nx = 0; ny = -1; } } }
    else if (dy < 0) { t = (y1 - py) / dy; if (t >= -T_EPS && t < best) { c = px + dx * t; if (c >= rx && c <= rx + rw) { best = t; nx = 0; ny = 1; } } }
    const a = dx * dx + dy * dy;
    if (a > 0) {
      for (let k = 0; k < 4; k++) {
        const cx = (k & 1) ? rx + rw : rx;
        const cy = (k & 2) ? ry + rh : ry;
        const fx = px - cx, fy = py - cy;
        const b = fx * dx + fy * dy;
        if (b >= 0) continue; // moving away from this corner
        const cc = fx * fx + fy * fy - r * r;
        const disc = b * b - a * cc;
        if (disc < 0) continue;
        t = (-b - Math.sqrt(disc)) / a;
        if (t < -T_EPS || t >= best) continue;
        const hx = px + dx * t, hy = py + dy * t;
        // only the quarter of the corner circle outside the faces counts
        if ((k & 1) ? hx < cx : hx > cx) continue;
        if ((k & 2) ? hy < cy : hy > cy) continue;
        best = t; nx = (hx - cx) / r; ny = (hy - cy) / r;
      }
    }
    if (best > 1) return false;
    HIT.t = best < 0 ? 0 : best; HIT.nx = nx; HIT.ny = ny;
    return true;
  }

  function reflect(b, nx, ny) {
    const d = b.vx * nx + b.vy * ny;
    if (d < 0) { b.vx -= 2 * d * nx; b.vy -= 2 * d * ny; }
  }

  // ===========================================================================
  class Game {
    constructor(opts) {
      opts = opts || {};
      this.rng = opts.rng || Math.random;
      this.H = clampH(opts.H || 640);
      this.events = [];
      this.input = { targetX: null, keyDir: 0, fireHeld: false, action: false };
      this.debug = { invincible: false, noDrops: false, recordPaths: false, speedOverride: 0 };
      this.mode = 'arcade';
      this.state = 'idle';
      this.level = 1;
      this.wall = 1;
      this.score = 0;
      this.lives = START_LIVES;
      this.time = 0;
      this.bricks = [];
      this.balls = [];
      this.capsules = [];
      this.lasers = [];
      this.fx = { expand: 0, shrink: 0, slow: 0, laser: 0, catch: 0, fire: 0 };
      this.paddle = { x: W / 2, prevX: W / 2, w: PADDLE_W, kv: 0, squash: 0 };
      this.nextId = 1;
      this.brickVersion = 0;
      this.breakable = 0;
      this.introT = 0;
      this.timer = 0;
      this.laserCd = 0;
      this.speed = 300;
      this.stats = { bricks: 0, powerups: 0, maxLevel: 1 };
    }

    // ---- derived geometry ----
    get L() { return WALL; }
    get R() { return W - WALL; }
    get T() { return HUD_H; }
    get paddleTop() { return this.H - PADDLE_GAP; }
    get levelCount() { return this.mode === 'classic' ? 2 : LEVELS.length; }
    get levelName() {
      if (this.mode === 'classic') return this.wall === 1 ? 'First Wall' : 'Second Wall';
      const d = LEVELS[this.level - 1];
      return d ? d.name : '';
    }
    brickTop() { return HUD_H + (this.mode === 'classic' ? 54 : 30) + clamp((this.H - 640) * 0.22, 0, 80); }
    // tall portrait playfields get chunkier bricks so the wall fills more of the screen
    brickScale() { return 1 + 0.3 * clamp((this.H - 640) / 360, 0, 1); }

    emit(e) { this.events.push(e); }
    drain() { const e = this.events; this.events = []; return e; }

    setHeight(h) {
      h = clampH(h);
      if (h === this.H) return;
      this.H = h;
      for (const b of this.balls) {
        if (b.stuck) { b.y = this.paddleTop - b.r - 0.01; b.prevY = b.y; }
        else if (b.y > h - 4) { b.y = Math.max(this.T + b.r, h * 0.6); b.prevY = b.y; if (b.vy > 0) b.vy = -b.vy; }
      }
    }

    // ---- game flow ----
    newGame(mode, startLevel) {
      this.mode = mode === 'classic' ? 'classic' : 'arcade';
      this.level = this.mode === 'arcade' ? clamp(startLevel | 0 || 1, 1, LEVELS.length) : 1;
      this.wall = 1;
      this.score = 0;
      this.lives = START_LIVES;
      this.stats = { bricks: 0, powerups: 0, maxLevel: this.level };
      this.paddle.x = W / 2;
      this.paddle.prevX = W / 2;
      this.paddle.kv = 0;
      this.loadLevel();
    }

    loadLevel() {
      this.bricks = [];
      this.breakable = 0;
      const top = this.brickTop();
      if (this.mode === 'classic') {
        const bw = (this.R - this.L) / CLASSIC_COLS, bh = 15 * this.brickScale();
        for (let r = 0; r < CLASSIC_ROWS.length; r++) {
          for (let c = 0; c < CLASSIC_COLS; c++) {
            this.addBrick(this.L + c * bw, top + r * bh, bw, bh, CLASSIC_ROWS[r][0], 1, CLASSIC_ROWS[r][1], false, r, c);
          }
        }
        this.rowCount = CLASSIC_ROWS.length;
        this.shrunk = false;
      } else {
        const def = LEVELS[this.level - 1];
        const bw = (this.R - this.L) / ARCADE_COLS, bh = 18 * this.brickScale();
        for (let r = 0; r < def.rows.length; r++) {
          const row = def.rows[r];
          for (let c = 0; c < ARCADE_COLS; c++) {
            const ch = row[c];
            const t = BRICKS[ch];
            if (!t) continue;
            this.addBrick(this.L + c * bw, top + r * bh, bw, bh, ch, t.hp, t.pts, !!t.steel, r, c);
          }
        }
        this.rowCount = def.rows.length;
      }
      this.brickVersion++;
      this.introT = 2.4;
      this.serve();
      this.emit({ type: 'level', level: this.level, wall: this.wall, mode: this.mode, name: this.levelName });
    }

    addBrick(x, y, w, h, color, hp, pts, steel, row, col) {
      this.bricks.push({ id: this.nextId++, x, y, w, h, color, hp, maxHp: hp, pts, steel, row, col, alive: true });
      if (!steel) this.breakable++;
    }

    baseSpeed() {
      if (this.mode === 'classic') {
        const i = (this.hits >= 4 ? 1 : 0) + (this.hits >= 12 ? 1 : 0) + (this.hitOrange ? 1 : 0) + (this.hitRed ? 1 : 0);
        return CLASSIC_SPEEDS[i];
      }
      return Math.min(300 + 12 * (this.level - 1), 440);
    }
    maxSpeed() { return this.mode === 'classic' ? CLASSIC_SPEEDS[4] : Math.min(560 + 14 * (this.level - 1), 720); }
    speedNow() { return this.debug.speedOverride || this.speed; }

    serve() {
      this.capsules = [];
      this.lasers = [];
      for (const k of TIMED) this.fx[k] = 0;
      this.hits = 0;
      this.hitOrange = false;
      this.hitRed = false;
      this.speed = this.baseSpeed();
      this.laserCd = 0;
      const p = this.paddle;
      p.w = this.targetPaddleW();
      const b = this.makeBall(p.x, this.paddleTop - BALL_R - 0.01, 0, 0);
      b.stuck = true;
      b.serve = true;
      b.stuckOff = (this.rng() < 0.5 ? -1 : 1) * p.w * 0.17;
      b.catchT = 0;
      this.balls = [b];
      this.state = 'playing';
    }

    makeBall(x, y, vx, vy) {
      return { id: this.nextId++, x, y, prevX: x, prevY: y, vx, vy, r: BALL_R, stuck: false, stuckOff: 0, catchT: 0, idle: 0, serve: false };
    }

    targetPaddleW() {
      if (this.mode === 'classic') return this.shrunk ? PADDLE_W_CLASSIC / 2 : PADDLE_W_CLASSIC;
      if (this.fx.expand > 0) return PADDLE_W * 1.55;
      if (this.fx.shrink > 0) return PADDLE_W * 0.62;
      return PADDLE_W;
    }

    // ---- one fixed step ----
    step() {
      const dt = STEP;
      this.time += dt;
      const p = this.paddle;
      p.prevX = p.x;
      for (const b of this.balls) { b.prevX = b.x; b.prevY = b.y; }
      for (const c of this.capsules) c.prevY = c.y;
      for (const l of this.lasers) l.prevY = l.y;
      if (this.introT > 0) this.introT -= dt;

      if (this.state === 'playing') this.stepPlaying(dt);
      else if (this.state === 'lost') {
        this.updatePaddle(dt);
        this.timer -= dt;
        if (this.timer <= 0) {
          if (this.lives > 0) { this.serve(); this.emit({ type: 'serve' }); }
          else { this.state = 'over'; this.emit({ type: 'gameOver', score: this.score }); }
        }
      } else if (this.state === 'clear') {
        this.updatePaddle(dt);
        this.timer -= dt;
        if (this.timer <= 0) this.advance();
      }
      this.input.action = false;
    }

    stepPlaying(dt) {
      const p = this.paddle;
      this.updatePaddle(dt);
      if (this.input.action) this.doAction();
      if (this.laserCd > 0) this.laserCd -= dt;
      if (this.input.fireHeld && this.fx.laser > 0) this.tryFire();

      const sp = this.speedNow();
      let inFlight = false;
      for (let i = this.balls.length - 1; i >= 0; i--) {
        const b = this.balls[i];
        if (b.stuck) {
          b.x = clamp(p.x + b.stuckOff, this.L + b.r, this.R - b.r);
          b.y = this.paddleTop - b.r - 0.01;
          if (b.catchT > 0) { b.catchT -= dt; if (b.catchT <= 0) this.release(b); }
          continue;
        }
        inFlight = true;
        const len = Math.hypot(b.vx, b.vy) || 1;
        b.vx *= sp / len; b.vy *= sp / len;
        this.scoop(b);
        if (!b.stuck) this.moveBall(b, dt);
        b.idle += dt;
        if (b.idle > LOOP_LIMIT) this.perturb(b);
        if (b.y - b.r > this.H) {
          if (this.debug.invincible) { b.y = this.H - b.r; b.vy = -Math.abs(b.vy); this.emit({ type: 'miss', x: b.x }); }
          else { this.balls.splice(i, 1); this.emit({ type: 'ballLost', x: b.x, y: this.H }); }
        }
      }
      if (this.balls.length === 0) { this.loseLife(); return; }

      this.updateCapsules(dt);
      this.updateLasers(dt);
      for (const k of TIMED) {
        if (this.fx[k] > 0) {
          this.fx[k] -= dt;
          if (this.fx[k] <= 0) { this.fx[k] = 0; this.emit({ type: 'fxEnd', kind: k }); }
        }
      }
      if (this.fx.catch <= 0) {
        for (const b of this.balls) if (b.stuck && !b.serve && b.catchT > 0.4) b.catchT = 0.4;
      }
      if (this.mode === 'arcade' && inFlight && this.fx.slow <= 0) {
        this.speed = Math.min(this.maxSpeed(), this.speed + 2.5 * dt);
      }
      if (this.breakable <= 0) this.levelCleared();
    }

    updatePaddle(dt) {
      const p = this.paddle, inp = this.input;
      const tw = this.targetPaddleW();
      p.w += (tw - p.w) * Math.min(1, dt * 14);
      if (Math.abs(tw - p.w) < 0.05) p.w = tw;
      if (inp.keyDir) {
        p.kv += (inp.keyDir * KEY_SPEED - p.kv) * Math.min(1, dt * 14);
        p.x += p.kv * dt;
      } else if (inp.targetX != null) {
        p.kv = 0;
        const m = PADDLE_MAX_SPEED * dt;
        p.x += clamp(inp.targetX - p.x, -m, m);
      } else if (p.kv) {
        p.kv *= Math.max(0, 1 - dt * 14);
        if (Math.abs(p.kv) < 1) p.kv = 0;
        p.x += p.kv * dt;
      }
      const lo = this.L + p.w / 2, hi = this.R - p.w / 2;
      if (p.x < lo) { p.x = lo; p.kv = 0; }
      if (p.x > hi) { p.x = hi; p.kv = 0; }
      if (p.squash > 0) p.squash = Math.max(0, p.squash - dt * 7);
    }

    doAction() {
      let released = false;
      for (const b of this.balls) if (b.stuck) { this.release(b); released = true; }
      if (!released && this.fx.laser > 0) this.tryFire();
    }

    release(b) {
      const p = this.paddle;
      b.stuck = false;
      b.serve = false;
      b.catchT = 0;
      b.idle = 0;
      b.x = clamp(p.x + b.stuckOff, this.L + b.r, this.R - b.r);
      b.y = this.paddleTop - b.r - 0.01;
      this.aimFromPaddle(b);
      this.emit({ type: 'launch', x: b.x, y: b.y });
    }

    // where the ball meets the paddle decides the outgoing angle
    aimFromPaddle(b) {
      const p = this.paddle;
      const off = clamp((b.x - p.x) / (p.w / 2 + b.r), -1, 1);
      let ang = off * MAX_BOUNCE;
      if (Math.abs(ang) < MIN_BOUNCE) ang = (off > 0 ? 1 : off < 0 ? -1 : (b.vx < 0 ? -1 : 1)) * MIN_BOUNCE;
      const sp = this.speedNow();
      b.vx = sp * Math.sin(ang);
      b.vy = -sp * Math.cos(ang);
      return off;
    }

    paddleBounce(b) {
      const p = this.paddle;
      b.y = Math.min(b.y, this.paddleTop - b.r - 0.01);
      const off = this.aimFromPaddle(b);
      b.idle = 0;
      p.squash = 1;
      this.paddleHits = (this.paddleHits || 0) + 1;
      this.emit({ type: 'paddle', x: b.x, y: this.paddleTop, off });
      if (this.mode === 'arcade') this.speed = Math.min(this.maxSpeed(), this.speed + 1);
      if (this.fx.catch > 0) {
        b.stuck = true;
        b.stuckOff = clamp(b.x - p.x, -p.w / 2, p.w / 2);
        b.catchT = 2.5;
        b.vx = 0; b.vy = 0;
        this.emit({ type: 'caught', x: b.x, y: b.y });
      }
    }

    // Paddle moved sideways into a ball that was not tunnelled by the sweep.
    scoop(b) {
      if (b.vy <= 0) return;
      const p = this.paddle, top = this.paddleTop;
      const left = p.x - p.w / 2, right = p.x + p.w / 2;
      const cx = clamp(b.x, left, right), cy = clamp(b.y, top, top + PADDLE_H);
      const dx = b.x - cx, dy = b.y - cy;
      if (dx * dx + dy * dy >= b.r * b.r) return;
      if (b.y <= top + PADDLE_H * 0.5) {
        this.paddleBounce(b);
      } else {
        if (b.x < p.x) { b.x = left - b.r - 0.01; if (b.vx > 0) b.vx = -b.vx; }
        else { b.x = right + b.r + 0.01; if (b.vx < 0) b.vx = -b.vx; }
        b.x = clamp(b.x, this.L + b.r, this.R - b.r);
      }
    }

    moveBall(b, dt) {
      const minX = this.L + b.r, maxX = this.R - b.r, minY = this.T + b.r;
      const fire = this.fx.fire > 0;
      const rec = this.debug.recordPaths;
      if (rec) { b.path = [b.x, b.y]; b.passIds = []; }
      const p = this.paddle;
      const pl = p.x - p.w / 2;
      let rem = 1;
      for (let guard = 0; guard < 12 && rem > 1e-7; guard++) {
        const dx = b.vx * dt * rem, dy = b.vy * dt * rem;
        let tBest = 2, nx = 0, ny = 0, what = 0, target = null;
        if (dx < 0 && b.x + dx < minX) { tBest = Math.max(0, (minX - b.x) / dx); nx = 1; ny = 0; what = 1; }
        else if (dx > 0 && b.x + dx > maxX) { tBest = Math.max(0, (maxX - b.x) / dx); nx = -1; ny = 0; what = 1; }
        if (dy < 0 && b.y + dy < minY) {
          const t = Math.max(0, (minY - b.y) / dy);
          if (t < tBest) { tBest = t; nx = 0; ny = 1; what = 2; }
        }
        const bricks = this.bricks;
        for (let i = 0; i < bricks.length; i++) {
          const br = bricks[i];
          if (!br.alive) continue;
          if (sweepRect(b.x, b.y, dx, dy, b.r, br.x, br.y, br.w, br.h) && HIT.t < tBest) {
            tBest = HIT.t; nx = HIT.nx; ny = HIT.ny; what = 3; target = br;
          }
        }
        if (dy > 0 && sweepRect(b.x, b.y, dx, dy, b.r, pl, this.paddleTop, p.w, PADDLE_H) && HIT.t < tBest) {
          tBest = HIT.t; nx = HIT.nx; ny = HIT.ny; what = 4;
        }
        if (!what) { b.x += dx; b.y += dy; break; }

        b.x += dx * tBest; b.y += dy * tBest;
        rem *= 1 - tBest;
        if (rec) b.path.push(b.x, b.y);

        if (what === 3) {
          if (fire && !target.steel) { if (rec) b.passIds.push(target.id); this.hitBrick(target, b, true); continue; }
          reflect(b, nx, ny);
          this.hitBrick(target, b, false);
        } else if (what === 4) {
          if (ny < -0.35) {
            this.paddleBounce(b);
            if (b.stuck) break;
          } else reflect(b, nx, ny);
        } else {
          reflect(b, nx, ny);
          this.emit({ type: 'wall', x: b.x, y: b.y, top: what === 2 });
          if (what === 2 && this.mode === 'classic' && !this.shrunk) {
            this.shrunk = true; // broke through to the back wall: paddle halves
            this.emit({ type: 'shrinkClassic' });
          }
        }
        this.clampAngle(b);
        b.x += nx * 1e-3; b.y += ny * 1e-3;
      }
      // belt and braces: floating point must never leave the ball outside the walls
      if (b.x < minX) { b.x = minX; if (b.vx < 0) b.vx = -b.vx; }
      if (b.x > maxX) { b.x = maxX; if (b.vx > 0) b.vx = -b.vx; }
      if (b.y < minY) { b.y = minY; if (b.vy < 0) b.vy = -b.vy; }
    }

    clampAngle(b) {
      const sp = Math.hypot(b.vx, b.vy);
      if (!sp) return;
      let ux = b.vx / sp, uy = b.vy / sp;
      if (Math.abs(uy) < MIN_SIN_H) {
        uy = (uy < 0 ? -1 : uy > 0 ? 1 : -1) * MIN_SIN_H;
        ux = (ux < 0 ? -1 : 1) * Math.sqrt(1 - uy * uy);
      }
      if (Math.abs(ux) < MIN_SIN_V) {
        ux = (ux < 0 ? -1 : ux > 0 ? 1 : (this.rng() < 0.5 ? -1 : 1)) * MIN_SIN_V;
        uy = (uy < 0 ? -1 : 1) * Math.sqrt(1 - ux * ux);
      }
      b.vx = ux * sp; b.vy = uy * sp;
    }

    // Break up a ball that has been bouncing between walls/steel for too long.
    perturb(b) {
      const a = (this.rng() < 0.5 ? -1 : 1) * (6 + this.rng() * 10) * DEG;
      const c = Math.cos(a), s = Math.sin(a);
      const vx = b.vx * c - b.vy * s, vy = b.vx * s + b.vy * c;
      b.vx = vx; b.vy = vy;
      this.clampAngle(b);
      b.idle = 0;
    }

    hitBrick(br, b, viaFire) {
      if (br.steel) {
        this.emit({ type: 'steel', id: br.id, x: br.x + br.w / 2, y: br.y + br.h / 2 });
        return;
      }
      if (b) b.idle = 0;
      br.hp -= viaFire ? br.hp : 1;
      this.brickVersion++;
      const rowFromBottom = this.rowCount - 1 - br.row;
      if (br.hp <= 0) {
        br.alive = false;
        this.breakable--;
        this.stats.bricks++;
        this.score += br.pts;
        this.emit({ type: 'brick', destroyed: true, id: br.id, x: br.x, y: br.y, w: br.w, h: br.h, color: br.color, maxHp: br.maxHp, pts: br.pts, row: rowFromBottom, fire: !!viaFire, laser: !b });
        this.maybeDrop(br);
      } else {
        if (this.mode === 'arcade') this.score += 10;
        this.emit({ type: 'brick', destroyed: false, id: br.id, x: br.x, y: br.y, w: br.w, h: br.h, color: br.color, maxHp: br.maxHp, hp: br.hp, pts: 10, row: rowFromBottom, laser: !b });
      }
      if (this.mode === 'classic') {
        if (!b) return;
        const before = this.speed;
        this.hits++;
        if (br.color === 'co') this.hitOrange = true;
        if (br.color === 'cr') this.hitRed = true;
        this.speed = this.baseSpeed();
        if (this.speed > before) this.emit({ type: 'speedUp' });
      } else {
        this.speed = Math.min(this.maxSpeed(), this.speed + 1.5);
      }
    }

    maybeDrop(br) {
      if (this.mode !== 'arcade' || this.debug.noDrops) return;
      if (this.capsules.length >= MAX_CAPSULES || this.state !== 'playing') return;
      if (this.rng() > DROP_CHANCE) return;
      let total = 0;
      const opts = [];
      for (const k in POWERUPS) {
        if (k === 'life' && this.lives >= MAX_LIVES) continue;
        if (k === 'multi' && this.balls.length >= MAX_BALLS - 2) continue;
        opts.push(k); total += POWERUPS[k].weight;
      }
      let r = this.rng() * total, kind = opts[0];
      for (const k of opts) { r -= POWERUPS[k].weight; if (r <= 0) { kind = k; break; } }
      this.spawnCapsule(kind, br.x + br.w / 2, br.y + br.h / 2);
    }

    spawnCapsule(kind, x, y) {
      x = clamp(x, this.L + CAP_W / 2, this.R - CAP_W / 2);
      this.capsules.push({ id: this.nextId++, kind, x, y, prevY: y, age: 0 });
    }

    updateCapsules(dt) {
      const p = this.paddle, top = this.paddleTop;
      for (let i = this.capsules.length - 1; i >= 0; i--) {
        const c = this.capsules[i];
        c.y += CAP_VY * dt;
        c.age += dt;
        if (c.y + CAP_H / 2 >= top && c.y - CAP_H / 2 <= top + PADDLE_H &&
            c.x + CAP_W / 2 >= p.x - p.w / 2 && c.x - CAP_W / 2 <= p.x + p.w / 2) {
          this.capsules.splice(i, 1);
          this.collect(c.kind, c.x);
        } else if (c.y - CAP_H / 2 > this.H) {
          this.capsules.splice(i, 1);
        }
      }
    }

    collect(kind, x) {
      const P = POWERUPS[kind];
      const fx = this.fx;
      this.stats.powerups++;
      this.score += 100;
      switch (kind) {
        case 'expand': fx.expand = P.dur; fx.shrink = 0; break;
        case 'shrink': fx.shrink = P.dur; fx.expand = 0; break;
        case 'slow':
          this.speed = Math.max(this.baseSpeed() * 0.85, Math.min(this.speed, this.baseSpeed()) * 0.85);
          fx.slow = P.dur;
          break;
        case 'laser': fx.laser = P.dur; break;
        case 'catch': fx.catch = P.dur; break;
        case 'fire': fx.fire = P.dur; break;
        case 'life': this.lives = Math.min(MAX_LIVES, this.lives + 1); break;
        case 'multi': this.splitBalls(); break;
      }
      this.emit({ type: 'powerup', kind, good: P.good, x, y: this.paddleTop, name: P.name });
    }

    splitBalls() {
      for (const b of this.balls) if (b.stuck) this.release(b);
      const src = this.balls.slice();
      for (const b of src) {
        for (const a of [-28 * DEG, 28 * DEG]) {
          if (this.balls.length >= MAX_BALLS) return;
          const c = Math.cos(a), s = Math.sin(a);
          const nb = this.makeBall(b.x, b.y, b.vx * c - b.vy * s, b.vx * s + b.vy * c);
          this.clampAngle(nb);
          this.balls.push(nb);
        }
      }
    }

    tryFire() {
      if (this.fx.laser <= 0 || this.laserCd > 0 || this.lasers.length > 10) return;
      const p = this.paddle, y = this.paddleTop - 2;
      const dx = p.w / 2 - 7;
      this.lasers.push({ x: p.x - dx, y, prevY: y }, { x: p.x + dx, y, prevY: y });
      this.laserCd = LASER_CD;
      this.emit({ type: 'laser', x: p.x, y });
    }

    updateLasers(dt) {
      for (let i = this.lasers.length - 1; i >= 0; i--) {
        const l = this.lasers[i];
        const y0 = l.y;
        l.y -= LASER_VY * dt;
        // swept: the bolt covers [l.y - LASER_LEN, y0] this step; take the lowest brick it touches
        let hit = null;
        for (const br of this.bricks) {
          if (!br.alive || l.x < br.x || l.x > br.x + br.w) continue;
          if (br.y + br.h < l.y - LASER_LEN || br.y > y0) continue;
          if (!hit || br.y > hit.y) hit = br;
        }
        if (hit) {
          this.lasers.splice(i, 1);
          this.hitBrick(hit, null, false);
          this.emit({ type: 'laserHit', x: l.x, y: hit.y + hit.h, steel: hit.steel });
        } else if (l.y - LASER_LEN < this.T) {
          this.lasers.splice(i, 1);
          this.emit({ type: 'laserHit', x: l.x, y: this.T, steel: true });
        }
      }
    }

    loseLife() {
      this.lives--;
      this.capsules = [];
      this.lasers = [];
      for (const k of TIMED) this.fx[k] = 0;
      this.state = 'lost';
      this.timer = this.lives > 0 ? 1.4 : 1.8;
      this.emit({ type: 'lifeLost', lives: this.lives, x: this.paddle.x, y: this.paddleTop });
    }

    levelCleared() {
      this.state = 'clear';
      this.timer = 2.2;
      this.capsules = [];
      this.lasers = [];
      for (const k of TIMED) this.fx[k] = 0;
      const last = this.mode === 'classic' ? this.wall >= 2 : this.level >= LEVELS.length;
      const bonus = this.mode === 'arcade' ? 1000 : 0;
      this.score += bonus;
      for (const b of this.balls) this.emit({ type: 'ballVanish', x: b.x, y: b.y });
      this.balls = [];
      this.emit({ type: 'levelClear', bonus, last, level: this.level, wall: this.wall });
    }

    advance() {
      if (this.mode === 'classic') {
        if (this.wall >= 2) { this.win(); return; }
        this.wall++;
      } else {
        if (this.level >= LEVELS.length) { this.win(); return; }
        this.level++;
        this.stats.maxLevel = Math.max(this.stats.maxLevel, this.level);
      }
      this.loadLevel();
    }

    win() {
      this.state = 'won';
      this.emit({ type: 'win', score: this.score });
    }

    // ---- helpers used by the debug hook, the demo and tests ----
    clearLevel() {
      for (const br of this.bricks) if (!br.steel && br.alive) br.alive = false;
      this.breakable = 0;
      this.brickVersion++;
    }
  }

  // A competent but imperfect autopilot: predicts where the lowest falling ball
  // will cross the paddle line (folding wall bounces) and aims with a random
  // offset so the ball explores the whole field. Used by the attract-mode demo
  // and the headless tests.
  function autopilot(g, ap) {
    const p = g.paddle, inp = g.input;
    let target = null;
    for (const b of g.balls) {
      if (b.stuck) continue;
      if (b.vy > 0 && (!target || target.vy <= 0 || b.y > target.y)) target = b;
      else if (!target) target = b;
    }
    if (target) {
      let x = target.x;
      if (target.vy > 0) {
        const lo = g.L + target.r, hi = g.R - target.r, span = hi - lo;
        const t = (g.paddleTop - target.r - target.y) / target.vy;
        let u = target.x + target.vx * t - lo;
        const period = 2 * span;
        u = ((u % period) + period) % period;
        x = lo + (u > span ? period - u : u);
      }
      if (ap.lastPaddle !== g.paddleHits) { ap.lastPaddle = g.paddleHits; ap.offset = (g.rng() * 2 - 1) * 0.75; }
      inp.targetX = x - (ap.offset || 0) * (p.w / 2);
    }
    const stuck = g.balls.some(function (b) { return b.stuck; });
    if (stuck) {
      ap.wait = (ap.wait || 0) + STEP;
      if (ap.wait > (ap.launchDelay || 0.6)) { inp.action = true; ap.wait = 0; }
    } else ap.wait = 0;
    inp.fireHeld = g.fx.laser > 0;
  }

  return {
    W, WALL, HUD_H, STEP, MIN_H, MAX_H, BALL_R, PADDLE_H, CAP_W, CAP_H, LASER_LEN,
    MAX_LIVES, POWERUPS, TIMED, LEVELS, BRICKS,
    Game, makeRng, sweepRect, autopilot, clamp,
  };
});
