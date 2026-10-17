/* Snake rules: grid, snake, apples, input queue. No DOM, no timing. */
(function () {
  'use strict';

  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  var QUEUE_MAX = 2;

  function Game(cols, rows, mode, rng) {
    this.cols = cols;
    this.rows = rows;
    this.mode = mode || 'classic';
    this.wrap = this.mode === 'wrap';
    this.appleCount = this.mode === 'apples3' ? 3 : 1;
    this.rng = rng || Math.random;
    this.reset();
  }

  Game.prototype.reset = function () {
    var c = this.cols, r = this.rows;
    this.grid = new Uint8Array(c * r); // 1 = snake body
    var y = Math.floor(r / 2);
    var len = 4;
    this.snake = []; // head first
    for (var i = 0; i < len; i++) {
      var x = len - i;
      this.snake.push({ x: x, y: y });
      this.grid[y * c + x] = 1;
    }
    // Where the tail was one step ago (used to interpolate the tail end).
    this.prevTail = { x: 1, y: y };
    this.dir = 'right';
    this.queue = [];
    this.apples = [];
    this.score = 0;
    this.steps = 0;
    this.dead = false;
    this.won = false;
    this.deathCause = null;
    this.deathDir = null;
    // Like the original: the first apple sits straight ahead of the snake.
    var ax = Math.min(c - 2, Math.max(len + 2, Math.floor(c * 0.75)));
    this.apples.push({ x: ax, y: y });
    while (this.apples.length < this.appleCount) {
      if (!this.spawnApple()) break;
    }
  };

  Game.prototype.appleAt = function (x, y) {
    for (var i = 0; i < this.apples.length; i++) {
      if (this.apples[i].x === x && this.apples[i].y === y) return i;
    }
    return -1;
  };

  Game.prototype.isFree = function (x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return false;
    return !this.grid[y * this.cols + x] && this.appleAt(x, y) < 0;
  };

  Game.prototype.spawnApple = function () {
    var free = [];
    var c = this.cols, n = c * this.rows;
    for (var i = 0; i < n; i++) {
      if (!this.grid[i] && this.appleAt(i % c, (i / c) | 0) < 0) free.push(i);
    }
    if (!free.length) return null;
    var idx = free[Math.floor(this.rng() * free.length)];
    var a = { x: idx % c, y: (idx / c) | 0 };
    this.apples.push(a);
    return a;
  };

  /* Buffer a turn. Each queued turn is checked against the one before it,
     so Up-then-Left from moving Right becomes two clean consecutive turns,
     and reversing straight back into the neck is refused. */
  Game.prototype.enqueue = function (d) {
    if (this.dead || this.won || !DIRS[d]) return false;
    var last = this.queue.length ? this.queue[this.queue.length - 1] : this.dir;
    if (d === last || d === OPP[last]) return false;
    if (this.queue.length >= QUEUE_MAX) return false;
    this.queue.push(d);
    return true;
  };

  Game.prototype.step = function () {
    if (this.dead || this.won) return null;
    var dir = this.queue.length ? this.queue.shift() : this.dir;
    var v = DIRS[dir];
    var c = this.cols, r = this.rows;
    var head = this.snake[0];
    var nx = head.x + v[0], ny = head.y + v[1];
    if (this.wrap) {
      nx = (nx + c) % c;
      ny = (ny + r) % r;
    } else if (nx < 0 || ny < 0 || nx >= c || ny >= r) {
      return this.die(dir, 'wall');
    }
    var ai = this.appleAt(nx, ny);
    var eating = ai >= 0;
    var tail = this.snake[this.snake.length - 1];
    // The tail moves out of its cell this step unless we are growing,
    // so following your own tail closely is legal.
    var intoTail = tail.x === nx && tail.y === ny;
    if (this.grid[ny * c + nx] && (eating || !intoTail)) return this.die(dir, 'self');

    this.dir = dir;
    var ev = { type: 'move', eaten: null, spawned: [] };
    if (eating) {
      this.prevTail = { x: tail.x, y: tail.y };
    } else {
      this.grid[tail.y * c + tail.x] = 0;
      this.prevTail = this.snake.pop();
    }
    this.snake.unshift({ x: nx, y: ny });
    this.grid[ny * c + nx] = 1;
    this.steps++;

    if (eating) {
      ev.eaten = this.apples.splice(ai, 1)[0];
      ev.type = 'eat';
      this.score++;
      if (this.snake.length >= c * r) {
        this.won = true;
        this.queue.length = 0;
        ev.type = 'win';
        return ev;
      }
      while (this.apples.length < this.appleCount) {
        var s = this.spawnApple();
        if (!s) break;
        ev.spawned.push(s);
      }
    }
    return ev;
  };

  Game.prototype.die = function (dir, cause) {
    this.dead = true;
    this.deathDir = dir;
    this.deathCause = cause;
    this.queue.length = 0;
    return { type: 'die', cause: cause, dir: dir };
  };

  window.SnakeEngine = { Game: Game, DIRS: DIRS, OPP: OPP };
})();
