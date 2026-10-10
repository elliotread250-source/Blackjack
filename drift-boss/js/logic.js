/* Drift Boss - game logic (road generation, car physics, scoring, items, shop).
 * Pure JS with no DOM access, so it runs both in the browser (window.DriftLogic)
 * and in node (module.exports) for the unit tests.
 *
 * World: a grid of unit tiles. The road is a monotone staircase that only ever
 * advances in +x (screen up-right) or +y (screen up-left), so it can never
 * cross itself. Holding the button steers towards +x, releasing towards +y.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DriftLogic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PI = Math.PI;
  const HALF = PI / 2;

  const CFG = {
    DT: 1 / 60,          // fixed simulation step
    SUB: 4,              // physics substeps per tick
    R_HEAD: 0.3,         // tightest heading turn radius (tiles)
    HEAD_GAIN: 9,        // heading approach gain (per tile travelled)
    SLIP_K: 7,           // how fast the velocity follows the heading (per tile): lower = more slide
    V0: 2.4,             // starting speed (tiles / s)
    VMAX: 5.8,           // top speed
    V_TAU: 450,          // blocks for the speed curve to approach VMAX
    ACCEL: 4.5,          // launch acceleration (tiles / s^2)
    BAND: 3,             // corners stay within |x - y| <= BAND so the road stays on screen
    AHEAD: 70,           // tiles kept generated ahead of the car
    BEHIND: 45,          // tiles kept behind the car
    COIN_R: 0.36,
    MAGNET_R: 0.85,
    PU_R: 0.42,
    BOOST_TIME: 5,
    BOOST_MULT: 1.5,
    DOUBLE_TIME: 10,
    REVIVE_COST: 25,
    FALL_TIME: 1.3,
    GRAVITY: 14,
    SHIELD_BONUS: 5,
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dirAngle(d) { return d === 0 ? 0 : HALF; }
  function key(x, y) { return x * 1048576 + y; }

  /* ------------------------------------------------------------------ physics */

  // Advance the car by a small distance h towards the target heading.
  // Everything is expressed per distance travelled, so the path through a
  // corner has exactly the same shape at every speed: only the timing tightens.
  function advance(car, target, h) {
    const maxTurn = h / CFG.R_HEAD;
    let d = (target - car.th) * CFG.HEAD_GAIN * h;
    if (d > maxTurn) d = maxTurn; else if (d < -maxTurn) d = -maxTurn;
    car.th += d;
    car.ph += (car.th - car.ph) * (1 - Math.exp(-CFG.SLIP_K * h));
    car.x += Math.cos(car.ph) * h;
    car.y += Math.sin(car.ph) * h;
  }

  // Lateral offset at the end of a corner when the turn starts D tiles before
  // the corner tile's centre (positive = overshot).
  function turnOffset(D) {
    const car = { x: 0.5, y: 0, th: HALF, ph: HALF };
    const C = 6.5, h = 0.004;
    while (car.y < C - D) advance(car, HALF, h);
    let n = 0;
    while (car.x < 5 && n++ < 100000) advance(car, 0, h);
    return car.y - C;
  }

  function calibrateTurn() {
    let lo = 0, hi = 1.5;
    for (let i = 0; i < 36; i++) {
      const mid = (lo + hi) / 2;
      if (turnOffset(mid) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  const TURN_D = calibrateTurn();

  /* --------------------------------------------------------------------- road */

  const PU_TYPES = ['boost', 'double', 'shield'];

  function Road(seed) {
    this.rng = mulberry32((seed >>> 0) || 1);
    this.tiles = [];
    this.first = 0;          // index of tiles[0]
    this.count = 0;          // next index to create
    this.map = new Map();
    this.cx = 0; this.cy = 0;
    this.dir = 1;
    this.sincePU = 0;
    this.nextPU = 34;
    this._push(3, 0, 1);
    // Opening straight: the car starts here going +y (button released).
    for (let i = 1; i <= 6; i++) this._push(3, i, 1);
  }

  Road.prototype._push = function (x, y, dir) {
    const t = { i: this.count++, x: x, y: y, dir: dir, corner: false, turnTo: -1, coin: 0, pu: null, taken: false };
    this.tiles.push(t);
    this.map.set(key(x, y), t);
    this.cx = x; this.cy = y; this.dir = dir;
    return t;
  };

  Road.prototype._pickLength = function (limit) {
    const diff = Math.min(1, this.count / 450);
    // weights for lengths 2..6, blending from easy to hard
    const easy = [0, 0.6, 3, 3, 2];
    const hard = [3, 3, 2, 1.4, 1];
    const minLen = this.count < 26 ? 3 : 2;
    let total = 0;
    const w = [];
    for (let n = 2; n <= 6; n++) {
      const v = (n < minLen || n > limit) ? 0 : easy[n - 2] + (hard[n - 2] - easy[n - 2]) * diff;
      w.push(v); total += v;
    }
    if (total <= 0) return Math.max(2, Math.min(limit, 6));
    let r = this.rng() * total;
    for (let k = 0; k < w.length; k++) {
      r -= w[k];
      if (r < 0) return k + 2;
    }
    return 2;
  };

  Road.prototype._segment = function () {
    const last = this.tiles[this.tiles.length - 1];
    const nd = 1 - this.dir;
    last.corner = true;
    last.turnTo = nd;
    const d = this.cx - this.cy;
    const limit = nd === 0 ? CFG.BAND - d : d + CFG.BAND;
    const n = this._pickLength(limit);
    const start = this.count;
    for (let k = 1; k <= n; k++) {
      if (nd === 0) this._push(this.cx + 1, this.cy, 0);
      else this._push(this.cx, this.cy + 1, 1);
    }
    // Items go on the straight tiles of the segment (not on the corner at its end).
    const straights = [];
    for (let i = start; i < start + n - 1; i++) straights.push(this.tiles[i - this.first]);
    this.sincePU += n;
    let puTile = null;
    if (this.sincePU >= this.nextPU && straights.length >= 2) {
      puTile = straights[Math.floor(straights.length / 2)];
      const r = this.rng();
      puTile.pu = r < 0.4 ? 'boost' : r < 0.72 ? 'double' : 'shield';
      this.sincePU = 0;
      this.nextPU = 38 + Math.floor(this.rng() * 36);
    }
    if (this.count > 12) {
      const row = straights.length >= 2 && this.rng() < 0.38;
      for (const t of straights) {
        if (t === puTile) continue;
        if (row || this.rng() < 0.1) t.coin = 1;
      }
    }
  };

  Road.prototype.ensure = function (index) {
    while (this.count <= index) this._segment();
  };

  Road.prototype.prune = function (minIndex) {
    while (this.first < minIndex && this.tiles.length > 1) {
      const t = this.tiles.shift();
      this.map.delete(key(t.x, t.y));
      this.first++;
    }
  };

  Road.prototype.get = function (i) {
    if (i < this.first) return null;
    this.ensure(i);
    return this.tiles[i - this.first] || null;
  };

  Road.prototype.at = function (x, y) {
    return this.map.get(key(Math.floor(x), Math.floor(y))) || null;
  };

  Road.prototype.last = function () { return this.tiles[this.tiles.length - 1]; };

  /* ---------------------------------------------------------------- autopilot */

  // Drives perfectly: starts each turn TURN_D before the corner tile's centre.
  // Used by the Fever boost and by the tests to prove corners are makeable.
  function Autopilot(game, early) {
    this.g = game;
    this.early = early || 0;   // tests: shift the press point (tiles)
    this.reset();
  }

  Autopilot.prototype.reset = function () {
    const g = this.g, car = g.car;
    const cur = (car.th < PI / 4) ? 0 : 1;
    this.target = cur;
    let i = Math.max(g.road.first, g.tileIdx);
    for (;;) {
      const t = g.road.get(i);
      if (t.corner && t.dir === cur) {
        // if we're already past this corner's turning point (mid-turn), skip it
        break;
      }
      i++;
    }
    this.next = i;
  };

  // Re-sync if the tracked corner was pruned or left behind (respawn, missed turn).
  Autopilot.prototype.check = function () {
    const c = this.g.road.get(this.next);
    if (!c || c.i < this.g.tileIdx - 1) this.reset();
  };

  Autopilot.prototype.along = function () {
    this.check();
    const c = this.g.road.get(this.next), car = this.g.car;
    return c.dir === 0 ? (c.x + 0.5 - car.x) : (c.y + 0.5 - car.y);
  };

  Autopilot.prototype.update = function (ds) {
    this.check();
    const c = this.g.road.get(this.next);
    if (this.along() - ds * 0.5 <= TURN_D + this.early) {
      this.target = c.turnTo;
      let i = c.i + 1;
      while (!this.g.road.get(i).corner) i++;
      this.next = i;
    }
    return this.target;
  };

  /* --------------------------------------------------------------------- game */

  function Game(opts) {
    opts = opts || {};
    this.seed = (opts.seed >>> 0) || ((Math.random() * 4294967295) >>> 0) || 7;
    this.road = new Road(this.seed);
    this.road.ensure(CFG.AHEAD);
    this.car = { x: 3.5, y: 1.5, z: 0, th: HALF, ph: HALF, v: 0, pitch: 0, roll: 0, vx: 0, vy: 0, vz: 0, spin: 0, pitchRate: 0, rollRate: 0 };
    this.prev = {};
    this.savePrev();
    this.state = 'ready';     // ready | play | falling | over | respawn
    this.tileIdx = 1;
    this.maxIdx = 1;
    this.score = 0;
    this.runCoins = 0;
    this.held = false;
    this.armed = true;        // a press that started the run must be released first
    this.boost = 0;
    this.boostOn = false;
    this.boostBlend = 0;
    this.dbl = 0;
    this.shield = false;
    this.reviveUsed = false;
    this.revives = 0;
    this.time = 0;
    this.fallT = 0;
    this.slip = 0;
    this.turnRate = 0;
    this.events = [];
    this.ap = null;
  }

  Game.prototype.savePrev = function () {
    const c = this.car, p = this.prev;
    p.x = c.x; p.y = c.y; p.z = c.z; p.th = c.th; p.ph = c.ph; p.pitch = c.pitch; p.roll = c.roll;
  };

  Game.prototype.emit = function (type, data) {
    const e = data || {};
    e.type = type;
    this.events.push(e);
  };

  Game.prototype.baseSpeed = function () {
    return CFG.V0 + (CFG.VMAX - CFG.V0) * (1 - Math.exp(-this.maxIdx / CFG.V_TAU));
  };

  Game.prototype.setInput = function (held) {
    held = !!held;
    if (held === this.held) return;
    this.held = held;
    if (!held) this.armed = true;
  };

  // Start driving (from the title or after a respawn).
  Game.prototype.go = function () {
    if (this.state !== 'ready' && this.state !== 'respawn') return false;
    this.state = 'play';
    this.armed = !this.held;
    this.emit('go');
    return true;
  };

  Game.prototype.playerDir = function () {
    return (this.held && this.armed) ? 0 : 1;
  };

  Game.prototype.step = function () {
    const dt = CFG.DT;
    this.savePrev();
    this.time += dt;
    const car = this.car;
    if (this.state === 'play') this.stepPlay(dt);
    else if (this.state === 'falling' || this.state === 'over') this.stepFall(dt);
    else {
      car.v = 0;
    }
  };

  Game.prototype.stepPlay = function (dt) {
    const car = this.car, road = this.road;
    if (this.dbl > 0) this.dbl = Math.max(0, this.dbl - dt);

    // speed
    const base = this.baseSpeed();
    this.boostBlend += ((this.boostOn ? 1 : 0) - this.boostBlend) * Math.min(1, dt * 3);
    const vt = base * (1 + (CFG.BOOST_MULT - 1) * this.boostBlend);
    if (car.v < vt) car.v = Math.min(vt, car.v + CFG.ACCEL * dt * (this.boostOn ? 2 : 1));
    else car.v = Math.max(vt, car.v - 2.5 * dt);
    const ds = car.v * dt;

    // steering
    let dir;
    if (this.boostOn) {
      this.boost -= dt;
      dir = this.ap.update(ds);
      if (this.boost <= 0) this.tryEndBoost();
    } else {
      dir = this.playerDir();
    }
    this.targetDir = dir;
    const target = dirAngle(dir);

    const h = ds / CFG.SUB;
    const th0 = car.th;
    for (let i = 0; i < CFG.SUB; i++) {
      advance(car, target, h);
      if (!road.at(car.x, car.y)) {
        this.offRoad();
        return;
      }
    }
    this.slip = car.th - car.ph;
    this.turnRate = (car.th - th0) / dt;

    const t = road.at(car.x, car.y);
    this.tileIdx = t.i;
    if (t.i > this.maxIdx) {
      const gained = t.i - this.maxIdx;
      const before = this.score;
      this.score += gained * (this.dbl > 0 ? 2 : 1);
      this.maxIdx = t.i;
      if (Math.floor(this.score / 100) > Math.floor(before / 100)) this.emit('milestone', { score: Math.floor(this.score / 100) * 100 });
      road.ensure(t.i + CFG.AHEAD);
      road.prune(t.i - CFG.BEHIND);
    }
    this.collect(t.i);
  };

  Game.prototype.collect = function (idx) {
    const car = this.car, road = this.road;
    const cr = this.boostOn ? CFG.MAGNET_R : CFG.COIN_R;
    for (let i = idx - 1; i <= idx + 2; i++) {
      const t = road.get(i);
      if (!t || t.taken) continue;
      if (!t.coin && !t.pu) continue;
      const dx = t.x + 0.5 - car.x, dy = t.y + 0.5 - car.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (t.coin && d < cr) {
        t.taken = true;
        this.runCoins += t.coin;
        this.emit('coin', { x: t.x + 0.5, y: t.y + 0.5, n: t.coin });
      } else if (t.pu && d < CFG.PU_R) {
        t.taken = true;
        this.applyPower(t.pu, t);
      }
    }
  };

  Game.prototype.applyPower = function (type, t) {
    const at = { x: t ? t.x + 0.5 : this.car.x, y: t ? t.y + 0.5 : this.car.y };
    if (type === 'boost') {
      this.boost = CFG.BOOST_TIME;
      if (!this.boostOn) {
        this.boostOn = true;
        this.ap = new Autopilot(this);
      }
    } else if (type === 'double') {
      this.dbl = CFG.DOUBLE_TIME;
    } else if (type === 'shield') {
      if (this.shield) {
        this.runCoins += CFG.SHIELD_BONUS;
        this.emit('coin', { x: at.x, y: at.y, n: CFG.SHIELD_BONUS });
      }
      this.shield = true;
    }
    this.emit('power', { kind: type, x: at.x, y: at.y });
  };

  // The boost hands control back only when the autopilot's direction matches
  // what the player is doing with the button, on a straight with room to react.
  Game.prototype.tryEndBoost = function () {
    const car = this.car;
    const want = this.ap.target;
    const player = this.held ? 0 : 1;
    const ang = dirAngle(want);
    if (player === want && Math.abs(car.th - ang) < 0.03 && Math.abs(car.ph - ang) < 0.04 && this.ap.along() > TURN_D + 0.6) {
      this.boostOn = false;
      this.boost = 0;
      this.armed = true;
      this.ap = null;
      this.emit('boostEnd');
    }
  };

  Game.prototype.boostWaiting = function () {
    return this.boostOn && this.boost <= 0;
  };

  Game.prototype.offRoad = function () {
    const car = this.car;
    if (this.shield) {
      this.shield = false;
      this.emit('shieldSave', { x: car.x, y: car.y });
      this.respawn();
      return;
    }
    this.state = 'falling';
    this.fallT = 0;
    car.vx = Math.cos(car.ph) * car.v;
    car.vy = Math.sin(car.ph) * car.v;
    car.vz = 0.6;
    const s = this.slip >= 0 ? 1 : -1;
    car.spin = s * (2 + Math.abs(this.slip) * 3);
    car.pitchRate = 2.4;
    car.rollRate = -s * 1.6;
    this.boostOn = false;
    this.ap = null;
    this.emit('fall', { x: car.x, y: car.y });
  };

  Game.prototype.stepFall = function (dt) {
    const car = this.car;
    this.fallT += dt;
    car.x += car.vx * dt;
    car.y += car.vy * dt;
    car.vx *= 0.995; car.vy *= 0.995;
    car.vz -= CFG.GRAVITY * dt;
    car.z += car.vz * dt;
    car.th += car.spin * dt;
    car.ph = car.th;
    car.pitch += car.pitchRate * dt;
    car.roll += car.rollRate * dt;
    if (this.state === 'falling' && this.fallT >= CFG.FALL_TIME) {
      this.state = 'over';
      this.emit('over', { score: this.score });
    }
  };

  // Put the car back at the start of a +y straight (button released), stopped.
  Game.prototype.respawn = function () {
    const road = this.road, car = this.car;
    let tile = null;
    for (let i = this.tileIdx; i > road.first; i--) {
      const t = road.get(i), p = road.get(i - 1);
      if (t.dir === 1 && !t.corner && p && p.corner && p.turnTo === 1) { tile = t; break; }
    }
    if (!tile) {
      for (let i = this.tileIdx + 1; ; i++) {
        const t = road.get(i), p = road.get(i - 1);
        if (t.dir === 1 && !t.corner && p && p.corner && p.turnTo === 1) { tile = t; break; }
      }
    }
    car.x = tile.x + 0.5; car.y = tile.y + 0.5; car.z = 0;
    car.th = car.ph = HALF;
    car.v = 0; car.pitch = 0; car.roll = 0; car.vx = car.vy = car.vz = 0;
    this.slip = 0; this.turnRate = 0;
    this.tileIdx = tile.i;
    this.boostOn = false; this.boost = 0; this.boostBlend = 0; this.ap = null;
    this.state = 'respawn';
    this.savePrev();
    this.emit('respawn', { x: car.x, y: car.y });
  };

  Game.prototype.canRevive = function (coins) {
    return this.state === 'over' && !this.reviveUsed && coins >= CFG.REVIVE_COST;
  };

  /* --------------------------------------------------------------------- shop */

  const CARS = [
    { id: 'hatch', name: 'Hatchback', price: 0 },
    { id: 'taxi', name: 'Taxi', price: 100 },
    { id: 'police', name: 'Police', price: 200 },
    { id: 'sports', name: 'Sports', price: 300 },
    { id: 'van', name: 'Van', price: 450 },
    { id: 'pickup', name: 'Pickup', price: 600 },
    { id: 'f1', name: 'Formula', price: 800 },
    { id: 'monster', name: 'Monster', price: 1000 },
  ];

  function carById(id) {
    for (const c of CARS) if (c.id === id) return c;
    return null;
  }

  function defaultSave() {
    return { best: 0, coins: 0, owned: ['hatch'], selected: 'hatch', muted: false, games: 0 };
  }

  function sanitizeSave(o) {
    const s = defaultSave();
    if (!o || typeof o !== 'object') return s;
    const num = (v) => (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : 0;
    s.best = num(o.best);
    s.coins = num(o.coins);
    s.games = num(o.games);
    s.muted = !!o.muted;
    if (Array.isArray(o.owned)) {
      for (const id of o.owned) if (carById(id) && s.owned.indexOf(id) < 0) s.owned.push(id);
    }
    if (carById(o.selected) && s.owned.indexOf(o.selected) >= 0) s.selected = o.selected;
    return s;
  }

  function buyCar(save, id) {
    const car = carById(id);
    if (!car) return { ok: false, reason: 'unknown' };
    if (save.owned.indexOf(id) >= 0) return { ok: false, reason: 'owned' };
    if (save.coins < car.price) return { ok: false, reason: 'coins' };
    save.coins -= car.price;
    save.owned.push(id);
    save.selected = id;
    return { ok: true };
  }

  function selectCar(save, id) {
    if (!carById(id) || save.owned.indexOf(id) < 0) return false;
    save.selected = id;
    return true;
  }

  // Spend coins on the once-per-run second chance.
  function tryRevive(game, save) {
    if (!game.canRevive(save.coins)) return false;
    save.coins -= CFG.REVIVE_COST;
    game.reviveUsed = true;
    game.revives++;
    game.respawn();
    return true;
  }

  return {
    CFG: CFG, TURN_D: TURN_D, PU_TYPES: PU_TYPES, CARS: CARS,
    mulberry32: mulberry32, advance: advance, turnOffset: turnOffset, dirAngle: dirAngle,
    Road: Road, Game: Game, Autopilot: Autopilot,
    carById: carById, defaultSave: defaultSave, sanitizeSave: sanitizeSave,
    buyCar: buyCar, selectCar: selectCar, tryRevive: tryRevive,
  };
});
