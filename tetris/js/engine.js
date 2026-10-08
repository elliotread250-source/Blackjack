/*
 * Tetris engine: pure game logic with no DOM access, so the browser and the
 * node unit tests run exactly the same code.
 *
 * Coordinates: x grows right, y grows DOWN. The matrix is 10 wide and 40 tall;
 * rows 0..19 are the hidden buffer above the 20 visible rows (20..39).
 * Kick tables below are written the way the Tetris Guideline / wiki prints
 * them (y up) and are flipped when applied.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TetrisEngine = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const COLS = 10;
  const ROWS = 40;
  const VISIBLE = 20;
  const TOP = ROWS - VISIBLE;       // first visible row index
  const SPAWN_X = 3;
  const SPAWN_Y = TOP;              // top of the piece's bounding box

  const NAMES = ['', 'I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  const ID = { I: 1, J: 2, L: 3, O: 4, S: 5, T: 6, Z: 7, X: 8 };

  // Spawn orientation inside the SRS bounding box.
  const BASE = {
    1: { n: 4, cells: [[0, 1], [1, 1], [2, 1], [3, 1]] },
    2: { n: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    3: { n: 3, cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
    4: { n: 3, cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
    5: { n: 3, cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    6: { n: 3, cells: [[1, 0], [0, 1], [1, 1], [2, 1]] },
    7: { n: 3, cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  };

  // SHAPES[type][rot] = [[x,y],...]; states 0, R, 2, L by true rotation of the box.
  const SHAPES = [null];
  for (let t = 1; t <= 7; t++) {
    const n = BASE[t].n;
    const states = [BASE[t].cells];
    for (let r = 1; r < 4; r++) {
      const prev = states[r - 1];
      states.push(t === ID.O ? prev : prev.map(([x, y]) => [n - 1 - y, x]));
    }
    SHAPES.push(states);
  }

  // SRS wall kicks (x right, y UP), tests in order. Key "from>to", 0=spawn 1=R 2=180 3=L.
  const KICKS_JLSTZ = {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const KICKS_I = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };
  // 180 rotation is not part of SRS proper; this is the widely used SRS+ table.
  const KICKS_180 = {
    '0>2': [[0, 0], [0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0]],
    '2>0': [[0, 0], [0, -1], [-1, -1], [1, -1], [-1, 0], [1, 0]],
    '1>3': [[0, 0], [1, 0], [1, 2], [1, 1], [0, 2], [0, 1]],
    '3>1': [[0, 0], [-1, 0], [-1, 2], [-1, 1], [0, 2], [0, 1]],
  };

  function kicksFor(type, from, to) {
    if (type === ID.O) return [[0, 0]];
    if ((from + 2) % 4 === to) return KICKS_180[from + '>' + to];
    return (type === ID.I ? KICKS_I : KICKS_JLSTZ)[from + '>' + to];
  }

  // Guideline gravity, in ms per row. Capped at level 20 (effectively 20G).
  function gravityMs(level) {
    const L = Math.max(1, Math.min(level, 20));
    return Math.pow(0.8 - (L - 1) * 0.007, L - 1) * 1000;
  }

  // Deterministic PRNG for tests / replays.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Bag {
    constructor(rng) { this.rng = rng || Math.random; this.items = []; }
    next() {
      if (!this.items.length) {
        const a = [1, 2, 3, 4, 5, 6, 7];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(this.rng() * (i + 1));
          const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
        }
        this.items = a;
      }
      return this.items.shift();
    }
  }

  function makeBoard() {
    const b = [];
    for (let y = 0; y < ROWS; y++) b.push(new Uint8Array(COLS));
    return b;
  }

  const LINE_SCORE = [0, 100, 300, 500, 800];
  const TSPIN_SCORE = [400, 800, 1200, 1600];
  const MINI_SCORE = [100, 200, 400, 400];
  const PC_SCORE = [0, 800, 1200, 1800, 2000];
  const CLEAR_NAMES = ['', 'SINGLE', 'DOUBLE', 'TRIPLE', 'TETRIS'];

  const DEFAULTS = {
    das: 170,          // ms before auto-shift
    arr: 50,           // ms between auto-shift steps
    lockDelay: 500,    // ms on the ground before locking
    maxResets: 15,     // move/rotate lock resets per lowest row
    clearDelay: 380,   // ms of line clear animation
    softFactor: 20,    // soft drop = 20x gravity
    sprintLines: 40,
  };

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.mode = opts.mode === 'sprint' ? 'sprint' : 'marathon';
      this.startLevel = this.mode === 'sprint' ? 1 : Math.max(1, Math.min(99, opts.startLevel | 0 || 1));
      this.rng = opts.rng || Math.random;
      this.cfg = Object.assign({}, DEFAULTS, opts.cfg || {});
      this.listeners = [];
      this.reset();
    }

    on(fn) { this.listeners.push(fn); return this; }
    emit(type, data) { for (const fn of this.listeners) fn(type, data || {}); }

    reset() {
      this.board = makeBoard();
      this.bag = new Bag(this.rng);
      this.queue = [];
      this.fillQueue();
      this.active = null;
      this.hold = null;
      this.holdUsed = false;
      this.score = 0;
      this.lines = 0;
      this.level = this.startLevel;
      this.combo = -1;
      this.b2b = false;
      this.pieces = 0;
      this.time = 0;
      this.stats = { tetrises: 0, tspins: 0, maxCombo: 0, b2bMax: 0, perfect: 0 };
      this.b2bChain = 0;
      this.phase = 'idle';            // idle | falling | clearing | over | done
      this.held = { left: false, right: false, soft: false };
      this.dir = 0;
      this.das = 0;
      this.arrAcc = 0;
      this.gravAcc = 0;
      this.lockTimer = 0;
      this.resets = 0;
      this.touched = false;
      this.lowestY = 0;
      this.lastRotate = false;
      this.lastKick = -1;
      this.clearRows = [];
      this.clearTimer = 0;
      this.finishPending = false;
      this.irs = 0;
      this.ihs = false;
      this.overReason = '';
    }

    fillQueue() { while (this.queue.length < 7) this.queue.push(this.bag.next()); }

    start() {
      if (this.phase !== 'idle') return;
      this.phase = 'falling';
      this.spawnNext();
    }

    get playing() { return this.phase === 'falling' || this.phase === 'clearing'; }

    // ---- geometry -------------------------------------------------------
    cells(type, rot, x, y) { return SHAPES[type][rot].map(([cx, cy]) => [x + cx, y + cy]); }

    collides(type, rot, x, y) {
      const sh = SHAPES[type][rot];
      for (let i = 0; i < 4; i++) {
        const cx = x + sh[i][0], cy = y + sh[i][1];
        if (cx < 0 || cx >= COLS || cy >= ROWS || cy < 0) return true;
        if (this.board[cy][cx]) return true;
      }
      return false;
    }

    occupied(x, y) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y < 0) return false;
      return this.board[y][x] !== 0;
    }

    grounded() {
      const a = this.active;
      return !!a && this.collides(a.type, a.rot, a.x, a.y + 1);
    }

    ghostY() {
      const a = this.active;
      if (!a) return 0;
      let y = a.y;
      while (!this.collides(a.type, a.rot, a.x, y + 1)) y++;
      return y;
    }

    gravityMs() { return gravityMs(this.level); }

    // ---- spawning -------------------------------------------------------
    spawnNext() {
      const t = this.queue.shift();
      this.fillQueue();
      this.spawn(t, false);
    }

    spawn(type, fromHold) {
      let y = SPAWN_Y;
      if (this.collides(type, 0, SPAWN_X, y)) {
        if (!this.collides(type, 0, SPAWN_X, y - 1)) y -= 1;
        else {
          this.active = { type, rot: 0, x: SPAWN_X, y };
          this.gameOver('blockout');
          return false;
        }
      }
      this.active = { type, rot: 0, x: SPAWN_X, y };
      if (!fromHold) this.holdUsed = false;
      this.lockTimer = 0;
      this.resets = 0;
      this.touched = false;
      this.lowestY = y;
      this.lastRotate = false;
      this.lastKick = -1;
      this.gravAcc = 0;
      this.emit('spawn', { type, fromHold: !!fromHold });
      // Initial hold / rotation buffered during the line clear.
      if (this.ihs && !fromHold) { this.ihs = false; this.holdPiece(); return true; }
      if (this.irs) { const r = this.irs; this.irs = 0; this.rotate(r); }
      return true;
    }

    // ---- movement -------------------------------------------------------
    canAct() { return this.phase === 'falling' && !!this.active; }

    tryMove(dx, dy) {
      const a = this.active;
      if (this.collides(a.type, a.rot, a.x + dx, a.y + dy)) return false;
      a.x += dx; a.y += dy;
      return true;
    }

    afterManeuver() {
      if (this.resets < this.cfg.maxResets) {
        if (this.touched) this.resets++;
        this.lockTimer = 0;
      } else if (this.grounded()) {
        this.lockPiece();
      }
    }

    afterDescend() {
      this.lastRotate = false;
      const a = this.active;
      if (a.y > this.lowestY) {
        this.lowestY = a.y;
        this.resets = 0;
        this.touched = false;
        this.lockTimer = 0;
      }
    }

    shift(dir) {
      if (!this.canAct()) return false;
      if (!this.tryMove(dir, 0)) return false;
      this.lastRotate = false;
      this.emit('move', { dir });
      this.afterManeuver();
      return true;
    }

    softStep() {
      if (!this.canAct()) return false;
      if (!this.tryMove(0, 1)) return false;
      this.score += 1;
      this.afterDescend();
      this.emit('soft', {});
      return true;
    }

    rotate(dir) {
      if (this.phase === 'clearing' || (this.phase === 'falling' && !this.active)) { this.irs = dir; return false; }
      if (!this.canAct()) return false;
      const a = this.active;
      if (a.type === ID.O) { this.emit('rotate', { dir, kick: 0, o: true }); return false; }
      const from = a.rot;
      const to = (from + (dir === 2 ? 2 : dir) + 4) % 4;
      const kicks = kicksFor(a.type, from, to);
      for (let i = 0; i < kicks.length; i++) {
        const nx = a.x + kicks[i][0], ny = a.y - kicks[i][1];
        if (!this.collides(a.type, to, nx, ny)) {
          a.x = nx; a.y = ny; a.rot = to;
          if (a.y > this.lowestY) this.afterDescend();   // a kick down counts as a new lowest row
          this.lastRotate = true;
          this.lastKick = dir === 2 ? -1 : i;
          this.emit('rotate', { dir, kick: i });
          this.afterManeuver();
          return true;
        }
      }
      this.emit('rotatefail', { dir });
      return false;
    }

    hardDrop() {
      if (!this.canAct()) return false;
      const a = this.active;
      const fromY = a.y;
      let dist = 0;
      while (!this.collides(a.type, a.rot, a.x, a.y + 1)) { a.y++; dist++; }
      if (dist > 0) this.lastRotate = false;
      this.score += 2 * dist;
      this.emit('harddrop', { dist, fromY, type: a.type, rot: a.rot, x: a.x, y: a.y });
      this.lockPiece();
      return true;
    }

    holdPiece() {
      if (this.phase === 'clearing' || (this.phase === 'falling' && !this.active)) { this.ihs = true; return false; }
      if (!this.canAct()) return false;
      if (this.holdUsed) { this.emit('holdfail', {}); return false; }
      const cur = this.active.type;
      this.active = null;
      if (this.hold == null) {
        this.hold = cur;
        const t = this.queue.shift();
        this.fillQueue();
        this.holdUsed = true;
        this.emit('hold', { type: cur });
        this.spawn(t, true);
      } else {
        const t = this.hold;
        this.hold = cur;
        this.holdUsed = true;
        this.emit('hold', { type: cur });
        this.spawn(t, true);
      }
      return true;
    }

    // ---- input with DAS/ARR ---------------------------------------------
    press(action) {
      switch (action) {
        case 'left':
        case 'right': {
          const d = action === 'left' ? -1 : 1;
          this.held[action] = true;
          this.dir = d; this.das = 0; this.arrAcc = 0;
          this.shift(d);
          break;
        }
        case 'soft':
          if (!this.held.soft) { this.held.soft = true; this.softStep(); this.gravAcc = 0; }
          break;
        case 'cw': this.rotate(1); break;
        case 'ccw': this.rotate(-1); break;
        case 'r180': this.rotate(2); break;
        case 'hard': this.hardDrop(); break;
        case 'hold': this.holdPiece(); break;
      }
    }

    release(action) {
      if (action === 'left' || action === 'right') {
        this.held[action] = false;
        const d = action === 'left' ? -1 : 1;
        if (this.dir === d) {
          this.dir = this.held.left ? -1 : this.held.right ? 1 : 0;
          this.das = 0; this.arrAcc = 0;
        }
      } else if (action === 'soft') {
        this.held.soft = false;
      }
    }

    releaseAll() {
      this.held.left = this.held.right = this.held.soft = false;
      this.dir = 0; this.das = 0; this.arrAcc = 0;
    }

    // ---- simulation -----------------------------------------------------
    update(dt) {
      if (this.phase === 'over' || this.phase === 'done') return;
      if (this.phase !== 'idle') this.time += dt;

      if (this.dir !== 0) {
        const prev = this.das;
        this.das += dt;
        if (this.das >= this.cfg.das) {
          if (this.cfg.arr <= 0) {
            if (this.canAct()) while (this.shift(this.dir)) { /* to the wall */ }
          } else {
            if (prev < this.cfg.das) { this.shift(this.dir); this.arrAcc = this.das - this.cfg.das; }
            else this.arrAcc += dt;
            while (this.arrAcc >= this.cfg.arr) { this.arrAcc -= this.cfg.arr; this.shift(this.dir); }
          }
        }
      }

      if (this.phase === 'clearing') {
        this.clearTimer += dt;
        if (this.clearTimer >= this.cfg.clearDelay) this.finishClear();
        return;
      }
      if (this.phase !== 'falling' || !this.active) return;

      const a = this.active;
      let rate = 1 / gravityMs(this.level);
      if (this.held.soft) rate *= this.cfg.softFactor;
      this.gravAcc += dt * rate;
      while (this.gravAcc >= 1 && this.active === a) {
        if (this.tryMove(0, 1)) {
          this.gravAcc -= 1;
          if (this.held.soft) this.score += 1;
          this.afterDescend();
        } else { this.gravAcc = 0; break; }
      }
      if (this.active !== a || this.phase !== 'falling') return;

      if (this.grounded()) {
        this.touched = true;
        this.lockTimer += dt;
        if (this.lockTimer >= this.cfg.lockDelay) this.lockPiece();
      } else {
        this.lockTimer = 0;
      }
    }

    detectTSpin() {
      const a = this.active;
      if (a.type !== ID.T || !this.lastRotate) return 'none';
      const c = [[0, 0], [2, 0], [2, 2], [0, 2]].map(([dx, dy]) => this.occupied(a.x + dx, a.y + dy));
      const count = c.filter(Boolean).length;
      if (count < 3) return 'none';
      // Front corners (the side the T points at): 0:up 1:right 2:down 3:left.
      const front = [[0, 1], [1, 2], [2, 3], [3, 0]][a.rot];
      if (c[front[0]] && c[front[1]]) return 'full';
      if (this.lastKick === 4) return 'full';   // TST / fin kick upgrade
      return 'mini';
    }

    lockPiece() {
      const a = this.active;
      if (!a) return;
      const tspin = this.detectTSpin();
      const cells = this.cells(a.type, a.rot, a.x, a.y);
      for (const [x, y] of cells) this.board[y][x] = a.type;
      this.pieces++;
      this.active = null;
      this.lockTimer = 0;
      this.emit('lock', { type: a.type, cells, tspin });

      const full = [];
      for (let y = 0; y < ROWS; y++) {
        let ok = true;
        for (let x = 0; x < COLS; x++) if (!this.board[y][x]) { ok = false; break; }
        if (ok) full.push(y);
      }
      const n = full.length;

      if (n === 0 && cells.every(([, y]) => y < TOP)) {
        this.gameOver('lockout');
        return;
      }

      this.score_(n, tspin, full);

      if (n > 0) {
        this.phase = 'clearing';
        this.clearRows = full;
        this.clearTimer = 0;
      } else {
        this.spawnNext();
      }
    }

    score_(n, tspin, full) {
      const level = this.level;
      let base;
      if (tspin === 'full') base = TSPIN_SCORE[n];
      else if (tspin === 'mini') base = MINI_SCORE[n];
      else base = LINE_SCORE[n];

      let b2bBonus = false;
      let comboBonus = 0;
      let perfect = false;
      if (n > 0) {
        const difficult = n === 4 || tspin !== 'none';
        if (difficult) {
          if (this.b2b) { b2bBonus = true; base *= 1.5; this.b2bChain++; }
          else this.b2bChain = 0;
          this.b2b = true;
          this.stats.b2bMax = Math.max(this.stats.b2bMax, this.b2bChain);
        } else {
          this.b2b = false;
          this.b2bChain = 0;
        }
        this.combo++;
        if (this.combo > 0) comboBonus = 50 * this.combo * level;
        this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
        if (n === 4) this.stats.tetrises++;
        // Perfect clear: every row that is not being cleared is empty.
        perfect = true;
        const fullSet = new Set(full);
        for (let y = 0; y < ROWS && perfect; y++) {
          if (fullSet.has(y)) continue;
          for (let x = 0; x < COLS; x++) if (this.board[y][x]) { perfect = false; break; }
        }
      } else {
        this.combo = -1;
      }
      if (tspin !== 'none') this.stats.tspins++;

      let points = Math.round(base * level) + comboBonus;
      let pcPoints = 0;
      if (perfect) {
        pcPoints = (n === 4 && b2bBonus ? 3200 : PC_SCORE[n]) * level;
        points += pcPoints;
        this.stats.perfect++;
      }
      this.score += points;

      if (n > 0 || tspin !== 'none') {
        let name = '';
        if (tspin === 'full') name = 'T-SPIN' + (n ? ' ' + CLEAR_NAMES[n] : '');
        else if (tspin === 'mini') name = 'T-SPIN MINI' + (n ? ' ' + CLEAR_NAMES[n] : '');
        else name = CLEAR_NAMES[n];
        this.emit('action', {
          lines: n, tspin, name, b2b: b2bBonus, combo: this.combo, points, perfect, pcPoints, rows: full.slice(), level,
        });
      }

      if (n > 0) {
        this.lines += n;
        if (this.mode === 'sprint') {
          if (this.lines >= this.cfg.sprintLines) {
            this.finishPending = true;
            this.finishTime = this.time;
          }
        } else {
          const nl = this.startLevel + Math.floor(this.lines / 10);
          if (nl > this.level) { this.level = nl; this.emit('levelup', { level: nl }); }
        }
      }
    }

    finishClear() {
      const rows = new Set(this.clearRows);
      const kept = this.board.filter((_, y) => !rows.has(y));
      while (kept.length < ROWS) kept.unshift(new Uint8Array(COLS));
      this.board = kept;
      this.clearRows = [];
      this.clearTimer = 0;
      if (this.finishPending) {
        this.phase = 'done';
        this.time = this.finishTime;
        this.emit('complete', { time: this.finishTime });
        return;
      }
      this.phase = 'falling';
      this.spawnNext();
    }

    gameOver(reason) {
      this.phase = 'over';
      this.overReason = reason;
      this.releaseAll();
      this.emit('gameover', { reason });
    }

    // ---- helpers for tests / debugging ---------------------------------
    setBoardRows(rows) {
      // rows: strings, bottom-aligned; '.' or ' ' empty, letters IJLOSTZ or X (grey).
      this.board = makeBoard();
      const off = ROWS - rows.length;
      rows.forEach((s, i) => {
        for (let x = 0; x < COLS; x++) {
          const ch = s[x] || '.';
          this.board[off + i][x] = ch === '.' || ch === ' ' ? 0 : (ID[ch] || 8);
        }
      });
    }

    setQueue(types) {
      this.queue = types.map((t) => (typeof t === 'number' ? t : ID[t]));
      this.fillQueue();
    }

    setActive(type) {
      this.active = null;
      this.spawn(typeof type === 'number' ? type : ID[type], true);
    }
  }

  // ---- demo AI (El-Tetris weights) ---------------------------------------
  const AI = {
    evaluate(board, landingHeight, eroded) {
      let rowT = 0, colT = 0, holes = 0, wells = 0;
      for (let y = TOP; y < ROWS; y++) {
        let prev = 1;
        for (let x = 0; x < COLS; x++) {
          const f = board[y][x] ? 1 : 0;
          if (f !== prev) rowT++;
          prev = f;
        }
        if (prev !== 1) rowT++;
      }
      for (let x = 0; x < COLS; x++) {
        let prev = 0, seen = false, depth = 0;
        for (let y = TOP; y < ROWS; y++) {
          const f = board[y][x] ? 1 : 0;
          if (f !== prev) colT++;
          prev = f;
          if (f) seen = true; else if (seen) holes++;
          const l = x === 0 || board[y][x - 1];
          const r = x === COLS - 1 || board[y][x + 1];
          if (!f && l && r) { depth++; wells += depth; } else depth = 0;
        }
        if (prev !== 1) colT++;
      }
      return -4.500158825082766 * landingHeight + 3.4181268101392694 * eroded
        - 3.2178882868487753 * rowT - 9.348695305445199 * colT
        - 7.899265427351652 * holes - 3.3855972247263626 * wells;
    },

    best(game) {
      const a = game.active;
      if (!a) return null;
      let best = null;
      const rots = a.type === ID.O ? 1 : 4;
      for (let rot = 0; rot < rots; rot++) {
        for (let x = -2; x < COLS; x++) {
          if (game.collides(a.type, rot, x, a.y)) continue;
          let y = a.y;
          while (!game.collides(a.type, rot, x, y + 1)) y++;
          const cells = game.cells(a.type, rot, x, y);
          const b = game.board.map((r) => r.slice());
          for (const [cx, cy] of cells) b[cy][cx] = a.type;
          let cleared = 0, eroded = 0;
          for (let yy = 0; yy < ROWS; yy++) {
            if (b[yy].every((v) => v)) {
              cleared++;
              eroded += cells.filter(([, cy]) => cy === yy).length;
              b.splice(yy, 1);
              b.unshift(new Uint8Array(COLS));
            }
          }
          let minY = 99, maxY = -1;
          for (const [, cy] of cells) { minY = Math.min(minY, cy); maxY = Math.max(maxY, cy); }
          const lh = ROWS - (minY + maxY) / 2;
          const v = AI.evaluate(b, lh, cleared * eroded);
          if (!best || v > best.v) best = { rot, x, v };
        }
      }
      return best;
    },
  };

  return {
    COLS, ROWS, VISIBLE, TOP, SPAWN_X, SPAWN_Y, NAMES, ID, SHAPES,
    KICKS_JLSTZ, KICKS_I, KICKS_180, kicksFor, gravityMs, mulberry32,
    Bag, Game, AI, DEFAULTS,
  };
}));
