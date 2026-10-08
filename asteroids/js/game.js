/*
 * The game simulation. Pure logic, no DOM: it advances one arcade frame per
 * step() at a fixed 60 Hz and reports what happened through `events`, which
 * main.js turns into sounds. Distances are world units (1024 x 768 on the
 * desktop, like the arcade's vector screen) and speeds are units per frame.
 */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const { SHIP, ROCK_UNIT } = window.Shapes;

  const C = {
    ROT: TAU * 3 / 256,          // 256 headings, three per frame like the arcade
    THRUST: 0.13,
    FRICTION: 1 - 1 / 128,
    MAX_SPEED: 6.4,
    SHIP_R: 7,
    BULLET_SPEED: 9,
    BULLET_LIFE: 60,
    MAX_BULLETS: 4,
    SAUCER_BULLET_SPEED: 6.5,
    SAUCER_BULLET_LIFE: 70,
    SAUCER_MAX_BULLETS: 2,
    ROCK_R: [0, 9, 18, 36],
    ROCK_PTS: [0, 100, 50, 20],
    ROCK_SPEED: [[0, 0], [1.1, 2.5], [0.8, 1.8], [0.45, 1.2]],
    ROCK_MASS: [0, 1, 3, 7],
    SAUCER_PTS: { large: 200, small: 1000 },
    EXTRA_LIFE: 10000,
    START_LIVES: 3,
    HYPER_TICKS: 42,
    DEAD_TICKS: 130,
    START_TICKS: 110,
    INVULN_TICKS: 120,
    WAVE_DELAY: 120,
    MAX_WAVE_ROCKS: 11,
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function wrapD(d, size) {
    if (d > size / 2) return d - size;
    if (d < -size / 2) return d + size;
    return d;
  }

  const NO_INPUT = { left: false, right: false, thrust: false, fire: false, hyper: false };

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.W = opts.W || 1024;
      this.H = opts.H || 768;
      this.seed(opts.seed != null ? opts.seed : (Math.random() * 4294967296) >>> 0);
      this.events = [];
      this.hiScore = 0;
      this.tick = 0;
      this.attract(false);
    }

    seed(s) { this.rand = mulberry32(s >>> 0); }
    r(a, b) { return a + (b - a) * this.rand(); }
    emit(type, data) {
      if (this.events.length > 256) this.events.splice(0, 128);
      const e = data || {};
      e.type = type;
      this.events.push(e);
    }

    resetStats() {
      this.stats = {
        shots: 0, destroyed: [0, 0, 0, 0], created: [0, 0, 0, 0], points: 0,
        saucers: { large: 0, small: 0 }, saucerKills: { large: 0, small: 0 },
        deaths: 0, hypers: 0, hyperDeaths: 0, extraLives: 0, maxRocks: 0, waves: 0,
      };
    }

    clearWorld() {
      this.rocks = [];
      this.bullets = [];
      this.saucer = null;
      this.particles = [];
      this.debris = [];
    }

    newShip(state, timer) {
      return {
        x: this.W / 2, y: this.H / 2, px: this.W / 2, py: this.H / 2,
        vx: 0, vy: 0, a: -Math.PI / 2, pa: -Math.PI / 2,
        state, timer, invuln: 0, thrusting: false,
      };
    }

    /** Attract mode: drifting rocks and the occasional saucer, no ship. */
    attract(keepRocks) {
      this.mode = 'attract';
      if (!keepRocks || !this.rocks) this.clearWorld();
      this.ship = this.newShip('none', 0);
      this.score = this.score || 0;
      this.lives = 0;
      this.resetStats();
      if (!keepRocks || !this.rocks.length) { this.wave = 0; this.startWave(); }
      this.saucerTimer = 300 + this.rand() * 300;
    }

    newGame() {
      this.mode = 'play';
      this.clearWorld();
      this.score = 0;
      this.lives = C.START_LIVES;
      this.nextLife = C.EXTRA_LIFE;
      this.wave = 0;
      this.beatN = 0;
      this.beatTimer = 30;
      this.waveTimer = 0;
      this.resetStats();
      this.ship = this.newShip('waiting', C.START_TICKS);
      this.playerIntro = C.START_TICKS;
      this.startWave();
    }

    resize(W, H) {
      if (W === this.W && H === this.H) return;
      const fx = W / this.W, fy = H / this.H;
      const sc = (o) => { o.x *= fx; o.y *= fy; if (o.px != null) { o.px *= fx; o.py *= fy; } };
      sc(this.ship);
      this.rocks.forEach(sc); this.bullets.forEach(sc); this.particles.forEach(sc); this.debris.forEach(sc);
      if (this.saucer) sc(this.saucer);
      this.W = W; this.H = H;
    }

    // ---- waves and rocks ------------------------------------------------

    startWave() {
      this.wave++;
      this.stats && this.stats.waves++;
      const n = this.mode === 'attract' ? 6 : Math.min(C.MAX_WAVE_ROCKS, 2 + 2 * this.wave);
      for (let i = 0; i < n; i++) {
        let x, y;
        // Rocks come in along the screen edges, like the arcade.
        for (let tries = 0; tries < 8; tries++) {
          if (this.rand() < 0.5) { x = this.rand() * this.W; y = 0; } else { x = 0; y = this.rand() * this.H; }
          if (!this.ship || this.ship.state === 'none' || this.distTo(this.ship, x, y) > 180) break;
        }
        this.addRock(x, y, 3, this.rand() * TAU);
      }
      this.waveMass = this.rockMass();
      this.waveTick = 0;
      this.waveTimer = 0;
      this.saucerTimer = this.saucerInterval() + 120;
    }

    addRock(x, y, size, ang) {
      const sp = C.ROCK_SPEED[size];
      const speed = this.r(sp[0], sp[1]);
      const rock = {
        x, y, px: x, py: y,
        vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed,
        size, shape: (this.rand() * 4) | 0,
      };
      this.rocks.push(rock);
      if (this.stats) {
        this.stats.created[size]++;
        if (this.rocks.length > this.stats.maxRocks) this.stats.maxRocks = this.rocks.length;
      }
      return rock;
    }

    rockMass() {
      let m = 0;
      for (const k of this.rocks) m += C.ROCK_MASS[k.size];
      return m;
    }

    /** Destroy rock j; large and medium rocks break into two of the next size. */
    breakRock(j) {
      const k = this.rocks[j];
      const last = this.rocks.pop();
      if (j < this.rocks.length) this.rocks[j] = last;
      this.stats.destroyed[k.size]++;
      this.emit('explode', { size: k.size });
      this.burst(k.x, k.y, [0, 6, 9, 13][k.size], [0, 1.6, 2.0, 2.4][k.size]);
      if (k.size > 1) {
        const base = Math.atan2(k.vy, k.vx);
        for (let n = 0; n < 2; n++) {
          const a = base + (n ? 1 : -1) * this.r(0.25, 1.2);
          const c = this.addRock(k.x, k.y, k.size - 1, a);
          c.x += c.vx * 2; c.y += c.vy * 2;
          c.px = c.x; c.py = c.y;
        }
      }
      return k;
    }

    // ---- scoring -----------------------------------------------------------

    addScore(p) {
      if (this.mode !== 'play') return;
      this.score += p;
      this.stats.points += p;
      while (this.score >= this.nextLife) {
        this.lives++;
        this.nextLife += C.EXTRA_LIFE;
        this.stats.extraLives++;
        this.emit('extraLife');
      }
    }

    // ---- effects -------------------------------------------------------------

    burst(x, y, n, speed) {
      for (let i = 0; i < n; i++) {
        const a = this.rand() * TAU;
        const s = speed * (0.25 + this.rand() * 0.75);
        const life = 28 + ((this.rand() * 26) | 0);
        this.particles.push({ x, y, px: x, py: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life });
      }
      if (this.particles.length > 400) this.particles.splice(0, this.particles.length - 400);
    }

    shatter(segs, x, y, vx, vy) {
      for (const sg of segs) {
        const mx = (sg[0] + sg[2]) / 2, my = (sg[1] + sg[3]) / 2;
        const out = Math.atan2(my, mx) + this.r(-0.6, 0.6);
        const s = this.r(0.35, 1.3);
        const life = 80 + ((this.rand() * 60) | 0);
        this.debris.push({
          x: x + mx, y: y + my, px: x + mx, py: y + my,
          vx: vx * 0.35 + Math.cos(out) * s, vy: vy * 0.35 + Math.sin(out) * s,
          a: Math.atan2(sg[3] - sg[1], sg[2] - sg[0]), va: this.r(-0.12, 0.12),
          len: Math.hypot(sg[2] - sg[0], sg[3] - sg[1]), life, max: life,
        });
      }
    }

    // ---- ship ----------------------------------------------------------------

    shipSegments(s) {
      const c = Math.cos(s.a), si = Math.sin(s.a);
      const t = (p) => [p[0] * c - p[1] * si, p[0] * si + p[1] * c];
      const n = t(SHIP.nose), l = t(SHIP.left), r = t(SHIP.right), bl = t(SHIP.barL), br = t(SHIP.barR);
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const ml = mid(n, l), mr = mid(n, r);
      return [
        [n[0], n[1], ml[0], ml[1]], [ml[0], ml[1], l[0], l[1]],
        [n[0], n[1], mr[0], mr[1]], [mr[0], mr[1], r[0], r[1]],
        [bl[0], bl[1], br[0], br[1]],
      ];
    }

    killShip() {
      const s = this.ship;
      if (s.state !== 'alive') return;
      this.shatter(this.shipSegments(s), s.x, s.y, s.vx, s.vy);
      this.burst(s.x, s.y, 10, 1.8);
      s.state = 'dead';
      s.timer = C.DEAD_TICKS;
      s.thrusting = false;
      s.vx = s.vy = 0;
      this.lives--;
      this.stats.deaths++;
      this.emit('shipExplode');
    }

    distTo(o, x, y) {
      return Math.hypot(wrapD(o.x - x, this.W), wrapD(o.y - y, this.H));
    }

    centreClear() {
      const cx = this.W / 2, cy = this.H / 2;
      for (const k of this.rocks) if (this.distTo(k, cx, cy) < C.ROCK_R[k.size] + 90) return false;
      if (this.saucer && Math.hypot(this.saucer.x - cx, this.saucer.y - cy) < 170) return false;
      for (const b of this.bullets) if (b.owner === 'saucer' && this.distTo(b, cx, cy) < 90) return false;
      return true;
    }

    hyperRisk() {
      return Math.min(0.16, 0.05 + this.rocks.length * 0.004);
    }

    updateShip(inp) {
      const s = this.ship;
      s.px = s.x; s.py = s.y; s.pa = s.a;
      s.thrusting = false;
      if (s.state === 'alive') {
        if (inp.left) s.a -= C.ROT;
        if (inp.right) s.a += C.ROT;
        if (s.a > Math.PI) { s.a -= TAU; s.pa -= TAU; } else if (s.a < -Math.PI) { s.a += TAU; s.pa += TAU; }
        if (inp.thrust) {
          s.vx += Math.cos(s.a) * C.THRUST;
          s.vy += Math.sin(s.a) * C.THRUST;
          s.thrusting = true;
        }
        s.vx *= C.FRICTION; s.vy *= C.FRICTION;
        const sp = Math.hypot(s.vx, s.vy);
        if (sp > C.MAX_SPEED) { s.vx *= C.MAX_SPEED / sp; s.vy *= C.MAX_SPEED / sp; }
        if (Math.abs(s.vx) < 0.004) s.vx = 0;
        if (Math.abs(s.vy) < 0.004) s.vy = 0;
        this.move(s);
        if (s.invuln > 0) s.invuln--;
        if (inp.fire) this.fire();
        if (inp.hyper) this.hyperspace();
      } else if (s.state === 'hyper') {
        if (--s.timer <= 0) {
          s.x = s.px = this.r(0.06, 0.94) * this.W;
          s.y = s.py = this.r(0.08, 0.92) * this.H;
          s.state = 'alive';
          s.invuln = 0;
          if (this.rand() < this.hyperRisk()) {
            this.stats.hyperDeaths++;
            this.killShip();
          } else {
            this.emit('hyperIn');
          }
        }
      } else if (s.state === 'dead') {
        if (--s.timer <= 0) {
          if (this.lives <= 0) this.gameOver();
          else { s.state = 'waiting'; s.timer = 0; }
        }
      } else if (s.state === 'waiting') {
        if (this.playerIntro > 0) this.playerIntro--;
        if (--s.timer <= 0 && this.centreClear()) {
          Object.assign(s, this.newShip('alive', 0));
          s.invuln = C.INVULN_TICKS;
          this.playerIntro = 0;
          this.emit('spawn');
        }
      }
    }

    fire() {
      const s = this.ship;
      let mine = 0;
      for (const b of this.bullets) if (b.owner === 'ship') mine++;
      if (mine >= C.MAX_BULLETS) return;
      const c = Math.cos(s.a), si = Math.sin(s.a);
      const x = s.x + c * SHIP.nose[0], y = s.y + si * SHIP.nose[0];
      this.bullets.push({
        x, y, px: x, py: y,
        vx: s.vx + c * C.BULLET_SPEED, vy: s.vy + si * C.BULLET_SPEED,
        life: C.BULLET_LIFE, owner: 'ship',
      });
      this.stats.shots++;
      this.emit('fire');
    }

    hyperspace() {
      const s = this.ship;
      s.state = 'hyper';
      s.timer = C.HYPER_TICKS;
      s.vx = s.vy = 0;
      s.invuln = 0;
      this.stats.hypers++;
      this.emit('hyper');
    }

    gameOver() {
      this.mode = 'over';
      this.ship.state = 'none';
      if (this.score > this.hiScore) this.hiScore = this.score;
      this.saucerTimer = 240 + this.rand() * 240;
      this.emit('gameOver');
    }

    // ---- saucers --------------------------------------------------------------

    saucerInterval() {
      // Saucers turn up more often as the wave wears on and the score climbs.
      const base = Math.max(300, 780 - this.wave * 45 - Math.min(180, this.score / 250));
      return base * this.r(0.75, 1.25);
    }

    smallSaucerChance() {
      if (this.mode !== 'play') return 0;
      if (this.score >= 40000) return 1;
      if (this.score < 2000) return 0;
      return 0.15 + 0.85 * (this.score / 40000);
    }

    spawnSaucer() {
      const small = this.rand() < this.smallSaucerChance();
      const hw = small ? 10 : 20;
      const left = this.rand() < 0.5;
      const sp = small ? 2.5 : 2.0;
      const y = this.r(0.14, 0.86) * this.H;
      const x = left ? -hw : this.W + hw;
      this.saucer = {
        x, y, px: x, py: y, vx: left ? sp : -sp, vy: 0, small, hw,
        fireTimer: 24 + ((this.rand() * 30) | 0), turnTimer: 40 + ((this.rand() * 50) | 0),
      };
      this.stats.saucers[small ? 'small' : 'large']++;
      this.emit('saucerIn', { small });
    }

    removeSaucer(killed) {
      const u = this.saucer;
      if (!u) return;
      if (killed) {
        const k = u.hw / 20;
        this.burst(u.x, u.y, 12, 2.2);
        this.shatter([
          [-20 * k, 0, -8 * k, -6 * k], [8 * k, -6 * k, 20 * k, 0], [-8 * k, 6.5 * k, 8 * k, 6.5 * k],
          [-4.5 * k, -12 * k, 4.5 * k, -12 * k], [-10 * k, 0, 10 * k, 0],
        ], u.x, u.y, u.vx, u.vy);
        this.emit('explode', { size: u.small ? 2 : 3 });
      }
      this.saucer = null;
      this.saucerTimer = this.saucerInterval();
      this.emit('saucerOut');
    }

    updateSaucer() {
      const u = this.saucer;
      if (!u) {
        const s = this.ship;
        const live = this.mode !== 'play' || s.state === 'alive' || s.state === 'hyper';
        if (live && this.rocks.length > 0) {
          this.saucerTimer -= this.rocks.length <= 3 ? 2 : 1;
          if (this.saucerTimer <= 0) this.spawnSaucer();
        }
        return;
      }
      u.px = u.x; u.py = u.y;
      u.x += u.vx; u.y += u.vy;
      if (u.y < 0) { u.y += this.H; u.py += this.H; } else if (u.y >= this.H) { u.y -= this.H; u.py -= this.H; }
      if (--u.turnTimer <= 0) {
        const d = ((this.rand() * 3) | 0) - 1;
        u.vy = d * Math.abs(u.vx);
        u.turnTimer = 50 + ((this.rand() * 70) | 0);
      }
      if ((u.vx > 0 && u.x > this.W + u.hw) || (u.vx < 0 && u.x < -u.hw)) { this.removeSaucer(false); return; }
      if (--u.fireTimer <= 0) {
        u.fireTimer = (u.small ? 38 : 52) - Math.min(14, this.wave * 2) + ((this.rand() * 12) | 0);
        this.saucerFire(u);
      }
    }

    saucerFire(u) {
      let n = 0;
      for (const b of this.bullets) if (b.owner === 'saucer') n++;
      if (n >= C.SAUCER_MAX_BULLETS) return;
      const s = this.ship;
      let ang;
      if (u.small && s.state === 'alive') {
        // Small saucer aims straight at the ship, its error closing up as the score rises.
        const dx = wrapD(s.x - u.x, this.W), dy = wrapD(s.y - u.y, this.H);
        const t = Math.min(1, this.score / 35000);
        const err = 0.32 * (1 - t) + 0.035 * t;
        ang = Math.atan2(dy, dx) + (this.rand() * 2 - 1) * err;
      } else {
        ang = this.rand() * TAU;
      }
      const c = Math.cos(ang), si = Math.sin(ang);
      const x = u.x + c * u.hw * 0.5, y = u.y + si * u.hw * 0.3;
      this.bullets.push({
        x, y, px: x, py: y,
        vx: c * C.SAUCER_BULLET_SPEED, vy: si * C.SAUCER_BULLET_SPEED,
        life: C.SAUCER_BULLET_LIFE, owner: 'saucer',
      });
      this.emit('saucerFire');
    }

    // ---- motion & collisions ------------------------------------------------

    move(o) {
      o.px = o.x; o.py = o.y;
      o.x += o.vx; o.y += o.vy;
      const W = this.W, H = this.H;
      if (o.x < 0) { o.x += W; o.px += W; } else if (o.x >= W) { o.x -= W; o.px -= W; }
      if (o.y < 0) { o.y += H; o.py += H; } else if (o.y >= H) { o.y -= H; o.py -= H; }
    }

    /** Swept test: did bullet b pass within (rx, ry) of object o during this frame? */
    sweep(b, o, rx, ry, wrapX) {
      const dx = wrapX ? wrapD(b.x - o.x, this.W) : b.x - o.x;
      const dy = wrapD(b.y - o.y, this.H);
      const k = rx / ry;
      const ex = dx, ey = dy * k;
      const rvx = b.vx - (o.vx || 0), rvy = (b.vy - (o.vy || 0)) * k;
      const sx = ex - rvx, sy = ey - rvy;
      const l2 = rvx * rvx + rvy * rvy;
      let t = l2 > 0 ? -(sx * rvx + sy * rvy) / l2 : 1;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const cx = sx + rvx * t, cy = sy + rvy * t;
      return cx * cx + cy * cy < rx * rx;
    }

    collide() {
      const s = this.ship;
      const shipLive = s.state === 'alive';
      const shipHittable = shipLive && s.invuln <= 0;

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        let hit = false;
        for (let j = this.rocks.length - 1; j >= 0; j--) {
          const k = this.rocks[j];
          const r = C.ROCK_R[k.size];
          if (this.sweep(b, k, r, r, true)) {
            this.breakRock(j);
            if (b.owner === 'ship') this.addScore(C.ROCK_PTS[k.size]);
            hit = true;
            break;
          }
        }
        const u = this.saucer;
        if (!hit && u && b.owner === 'ship' && this.sweep(b, u, u.hw * 0.95, u.hw * 0.6, false)) {
          this.stats.saucerKills[u.small ? 'small' : 'large']++;
          this.addScore(u.small ? C.SAUCER_PTS.small : C.SAUCER_PTS.large);
          this.removeSaucer(true);
          hit = true;
        }
        if (!hit && b.owner === 'saucer' && shipHittable && s.state === 'alive' && this.sweep(b, s, C.SHIP_R + 1, C.SHIP_R + 1, true)) {
          this.killShip();
          hit = true;
        }
        if (hit) this.bullets.splice(i, 1);
      }

      if (s.state === 'alive' && s.invuln <= 0) {
        for (let j = this.rocks.length - 1; j >= 0; j--) {
          const k = this.rocks[j];
          if (this.distTo(k, s.x, s.y) < C.ROCK_R[k.size] * 0.86 + C.SHIP_R) {
            this.breakRock(j);
            this.addScore(C.ROCK_PTS[k.size]);
            this.killShip();
            break;
          }
        }
      }

      const u = this.saucer;
      if (u && s.state === 'alive' && s.invuln <= 0) {
        const dx = (s.x - u.x) / (u.hw + C.SHIP_R), dy = wrapD(s.y - u.y, this.H) / (u.hw * 0.6 + C.SHIP_R);
        if (dx * dx + dy * dy < 1) {
          this.stats.saucerKills[u.small ? 'small' : 'large']++;
          this.addScore(u.small ? C.SAUCER_PTS.small : C.SAUCER_PTS.large);
          this.removeSaucer(true);
          this.killShip();
        }
      }

      if (this.saucer) {
        const v = this.saucer;
        for (let j = this.rocks.length - 1; j >= 0; j--) {
          const k = this.rocks[j];
          const dx = k.x - v.x, dy = wrapD(k.y - v.y, this.H);
          if (Math.hypot(dx, dy) < C.ROCK_R[k.size] * 0.85 + v.hw * 0.7) {
            this.breakRock(j);
            this.removeSaucer(true);
            break;
          }
        }
      }
    }

    beatInterval() {
      const ratio = this.waveMass > 0 ? this.rockMass() / this.waveMass : 0;
      const byRocks = 15 + 46 * ratio;
      const byTime = 62 - this.waveTick / 140;
      return Math.round(Math.max(15, Math.min(byRocks, byTime)));
    }

    /** Advance one 60 Hz frame. inp: {left, right, thrust, fire, hyper}; fire/hyper are presses. */
    step(inp) {
      inp = inp || NO_INPUT;
      this.tick++;
      const s = this.ship;
      if (this.mode === 'play') this.updateShip(inp);

      for (const k of this.rocks) this.move(k);
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        this.move(b);
        if (--b.life <= 0) this.bullets.splice(i, 1);
      }
      this.updateSaucer();
      this.collide();

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.px = p.x; p.py = p.y;
        p.x += p.vx; p.y += p.vy;
        if (--p.life <= 0) this.particles.splice(i, 1);
      }
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.px = d.x; d.py = d.y;
        d.x += d.vx; d.y += d.vy; d.a += d.va;
        d.vx *= 0.995; d.vy *= 0.995;
        if (--d.life <= 0) this.debris.splice(i, 1);
      }

      if (this.rocks.length === 0) {
        if (++this.waveTimer >= C.WAVE_DELAY) this.startWave();
      } else {
        this.waveTimer = 0;
        this.waveTick++;
      }

      if (this.mode === 'play' && (s.state === 'alive' || s.state === 'hyper') && this.rocks.length > 0) {
        if (--this.beatTimer <= 0) {
          this.emit('beat', { n: this.beatN });
          this.beatN ^= 1;
          this.beatTimer = this.beatInterval();
        }
      }
    }
  }

  Game.C = C;
  Game.wrapD = wrapD;
  window.AsteroidsGame = Game;
})();
