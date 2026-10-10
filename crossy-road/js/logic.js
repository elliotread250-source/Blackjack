// Crossy Road game rules: lane generation, the hop grid, vehicles, logs, trains, the eagle,
// scoring and the coin shop. No DOM and no three.js here, so the same file runs in node for
// the unit tests and the autopilot.
//
// Coordinates: the player moves on a grid of integer columns (x) and rows. Row 0 is the start,
// rows grow forward. Columns -COLS..COLS are playable; lanes extend further for scenery.
// Everything that moves is a pure function of time (constant speed, wrapping), so the world can
// be sampled at any instant without stepping it: the renderer interpolates for free and a
// planner can look ahead without cloning lanes.

export const TPS = 60;                 // fixed simulation rate
export const TICK = 1 / TPS;
export const COLS = 4;                 // playable columns are -4..4
export const HOP_TICKS = 8;            // one hop takes 8 ticks (0.133 s)
export const HALF = 18;                // lanes wrap at x = +-18 (well outside the view)
export const WRAP = HALF * 2;
export const EDGE_DEATH = 5.4;         // carried this far out on a log = gone
export const BEHIND_LIMIT = 4;         // rows behind the camera push before the eagle comes
export const AHEAD = 32;               // rows generated ahead of the player
export const KEEP_BEHIND = 14;         // rows kept behind the player
export const WALL_ROW = -4;            // rows at or below this are solid forest
export const IDLE_LIMIT = 9 * 60;       // ticks without a hop before the eagle comes
export const MAX_QUEUE = 2;            // buffered hops
export const PLAYER_HALF = 0.28;       // player half width for collisions

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------- random numbers
export class Rng {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() {
    // mulberry32
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  weighted(pairs) { // [[value, weight], ...]
    let total = 0;
    for (const p of pairs) total += p[1];
    let r = this.next() * total;
    for (const p of pairs) { if ((r -= p[1]) < 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  }
}

export function wrapX(x) {
  return ((((x + HALF) % WRAP) + WRAP) % WRAP) - HALF;
}

// Vehicle catalogue: logic only needs the length; the renderer uses kind/colour.
export const VEHICLES = {
  car: { len: 1.5 },
  taxi: { len: 1.5 },
  van: { len: 1.9 },
  truck: { len: 2.7 },
  bus: { len: 3.3 },
};
export const TRAIN_CAR = 3.2;          // length of one train carriage
export const TRAIN_SPEED = 30;         // tiles per second
export const TRAIN_WARN = 1.6;         // seconds of flashing light before the train

// Where each moving thing is at time t.
export function entityX(lane, e, t) {
  return lane.speed ? wrapX(e.x0 + lane.dir * lane.speed * t) : e.x0;
}

// Rail lanes run a fixed cycle: idle, warning, train passing.
export function trainState(lane, t) {
  const ph = (((t + lane.offset) % lane.period) + lane.period) % lane.period;
  if (ph < lane.idle) return { phase: 'idle', until: lane.idle - ph };
  if (ph < lane.idle + TRAIN_WARN) return { phase: 'warn', until: lane.idle + TRAIN_WARN - ph };
  const s = ph - lane.idle - TRAIN_WARN;
  const head = -lane.dir * (HALF + 2) + lane.dir * TRAIN_SPEED * s;
  return { phase: 'pass', head, tail: head - lane.dir * lane.trainLen, s };
}

// Difficulty 0..1 grows with distance.
export function difficulty(row) { return clamp(row / 260, 0, 1); }

// Split a set of columns into contiguous runs (the separate pockets of a row).
export function runs(cols) {
  const sorted = [...cols].sort((a, b) => a - b);
  const out = [];
  for (const c of sorted) {
    const last = out[out.length - 1];
    if (last && c === last[last.length - 1] + 1) last.push(c); else out.push([c]);
  }
  return out;
}

const ALL_COLS = [];
for (let c = -COLS; c <= COLS; c++) ALL_COLS.push(c);

// ---------------------------------------------------------------- lane generation
// Each generated row remembers which playable columns the player can be standing on when they
// arrive there (`reach`). Grass and lily-pad rows only ever leave openings that connect to the
// reachable columns below, so trees and water can never wall the run off. Roads, rails and log
// rivers can be crossed at any column (with timing), so they reset reach to "everything".
export class LaneGen {
  constructor(seed) {
    this.rng = new Rng(seed);
    this.row = WALL_ROW - 8;        // next row to generate
    this.queue = [];                // planned specs for the current segment
    this.reach = null;              // null = all columns reachable
    this.lastHazard = null;
    this.lastRiverDir = 1;
  }

  next() {
    const row = this.row++;
    let lane;
    if (row <= WALL_ROW) lane = this.wall(row);
    else if (row <= 2) lane = this.startGrass(row);
    else {
      if (!this.queue.length) this.plan(row);
      const spec = this.queue.shift();
      lane = this.build(row, spec);
    }
    return lane;
  }

  wall(row) {
    const blocked = new Set(ALL_COLS);
    return { row, type: 'grass', blocked, deco: this.decoFor(row, blocked, 1), coin: null, speed: 0, dir: 1, items: [] };
  }

  startGrass(row) {
    const blocked = new Set();
    if (row !== 0) {
      for (const c of ALL_COLS) if (Math.abs(c) >= 2 && this.rng.chance(row < 0 ? 0.35 : 0.2)) blocked.add(c);
    }
    this.reach = this.flood(blocked, row === WALL_ROW + 1 ? ALL_COLS : (this.reach || ALL_COLS));
    return { row, type: 'grass', blocked, deco: this.decoFor(row, blocked), coin: null, speed: 0, dir: 1, items: [] };
  }

  // Reachable columns in a row given the columns that can be entered from below.
  flood(blocked, entry) {
    const out = new Set();
    for (const c of entry) {
      if (blocked.has(c) || out.has(c)) continue;
      let a = c, b = c;
      while (a - 1 >= -COLS && !blocked.has(a - 1)) a--;
      while (b + 1 <= COLS && !blocked.has(b + 1)) b++;
      for (let k = a; k <= b; k++) out.add(k);
    }
    return out;
  }

  plan(row) {
    const r = this.rng;
    const d = difficulty(row);
    // A short grass break between hazards most of the time.
    const grassFirst = this.lastHazard !== 'grass' && r.chance(lerp(0.8, 0.55, d));
    if (grassFirst || this.lastHazard === null) {
      const n = r.weighted([[1, 5], [2, 3], [3, 1]]);
      for (let i = 0; i < n; i++) this.queue.push({ type: 'grass' });
      this.lastHazard = 'grass';
      return;
    }
    const kind = r.weighted([
      ['road', 0.5],
      ['river', row < 8 ? 0 : lerp(0.24, 0.3, d)],
      ['rail', row < 14 ? 0 : lerp(0.14, 0.22, d)],
    ]);
    this.lastHazard = kind;
    if (kind === 'road') {
      const maxLanes = 1 + Math.round(lerp(1, 3, d));
      const n = r.int(1, maxLanes);
      for (let i = 0; i < n; i++) this.queue.push({ type: 'road' });
    } else if (kind === 'river') {
      const maxRows = 1 + Math.round(lerp(1, 2.4, d));
      const n = r.int(1, maxRows);
      for (let i = 0; i < n; i++) {
        const lily = n >= 2 && r.chance(0.28) && !(i > 0 && this.queue[this.queue.length - 1].lily);
        this.queue.push({ type: 'river', lily });
      }
    } else {
      const n = r.chance(lerp(0.15, 0.45, d)) ? 2 : 1;
      for (let i = 0; i < n; i++) this.queue.push({ type: 'rail' });
    }
  }

  build(row, spec) {
    if (spec.type === 'grass') return this.grass(row);
    if (spec.type === 'road') return this.road(row);
    if (spec.type === 'river') return spec.lily ? this.lily(row) : this.river(row);
    return this.rail(row);
  }

  grass(row) {
    const r = this.rng;
    const d = difficulty(row);
    const density = r.range(0.12, lerp(0.3, 0.38, d));
    const blocked = new Set();
    for (const c of ALL_COLS) if (r.chance(density)) blocked.add(c);
    const entry = this.reach ? [...this.reach] : ALL_COLS;
    // never a near-solid wall, and keep a way through the middle when one can connect
    while (blocked.size > 5) blocked.delete(r.pick([...blocked]));
    const mid = entry.filter(c => Math.abs(c) <= 2);
    if (mid.length && mid.every(c => blocked.has(c))) blocked.delete(r.pick(mid));
    // every pocket you could be standing in below keeps at least one way forward: no dead ends
    for (const run of runs(entry)) {
      if (run.every(c => blocked.has(c))) blocked.delete(r.pick(run));
    }
    const open = entry.filter(c => !blocked.has(c));
    this.reach = this.flood(blocked, open);
    // keep at least two reachable columns so it never feels like a needle
    if (this.reach.size < 2) {
      const c = [...this.reach][0];
      const n = clamp(c + (r.chance(0.5) ? 1 : -1), -COLS, COLS);
      blocked.delete(n === c ? c - 1 : n);
      this.reach = this.flood(blocked, open);
    }
    let coin = null;
    if (r.chance(0.42)) coin = r.pick([...this.reach]);
    return { row, type: 'grass', blocked, deco: this.decoFor(row, blocked), coin, speed: 0, dir: 1, items: [] };
  }

  // Scenery for each blocked cell plus the forest outside the playable strip.
  decoFor(row, blocked, wall = 0) {
    const r = this.rng;
    const deco = [];
    for (let c = -HALF + 2; c <= HALF - 2; c++) {
      const inside = Math.abs(c) <= COLS;
      let put = inside ? blocked.has(c) : r.chance(wall ? 0.9 : Math.abs(c) === COLS + 1 ? 0.75 : 0.55);
      if (!put) continue;
      const rock = inside && !wall && r.chance(0.2);
      deco.push({ c, kind: rock ? 'rock' : 'tree', h: rock ? 1 : r.weighted([[1, 3], [2, 4], [3, 2], [4, 1]]), v: r.int(0, 3) });
    }
    return deco;
  }

  road(row) {
    const r = this.rng;
    const d = difficulty(row);
    const dir = r.chance(0.5) ? 1 : -1;
    const speed = lerp(1.8, 4.2, d) * r.range(0.8, 1.25);
    const style = r.weighted([['cars', 5], ['mixed', 3], ['trucks', lerp(1, 3, d)]]);
    const minGap = 3.2 + speed * 0.45;
    const maxGap = minGap + lerp(8, 3.5, d);
    const items = [];
    let total = 0;
    for (let guard = 0; guard < 20; guard++) {
      const kind = style === 'cars' ? r.pick(['car', 'car', 'taxi', 'van'])
        : style === 'trucks' ? r.pick(['truck', 'bus', 'truck'])
        : r.pick(['car', 'van', 'truck', 'bus', 'taxi']);
      const len = VEHICLES[kind].len;
      const gap = r.range(minGap, maxGap);
      if (total + gap + len + minGap > WRAP) break;
      items.push({ x0: total + gap + len / 2, len, kind, color: r.int(0, 7) });
      total += gap + len;
    }
    const shift = -HALF + r.range(0, WRAP);
    for (const v of items) v.x0 = wrapX(v.x0 + shift);
    let coin = null;
    if (r.chance(0.22)) coin = r.int(-COLS, COLS);
    this.reach = null;
    return { row, type: 'road', dir, speed, items, coin, blocked: null };
  }

  river(row) {
    const r = this.rng;
    const d = difficulty(row);
    const dir = -this.lastRiverDir;
    this.lastRiverDir = dir;
    const speed = lerp(0.9, 1.7, d) * r.range(0.85, 1.15);
    const lens = d < 0.35 ? [[3, 4], [4, 3], [2, 1]] : d < 0.7 ? [[2, 3], [3, 4], [4, 1]] : [[2, 4], [3, 3]];
    const minGap = 1.2;
    const maxGap = lerp(2.6, 3.4, d);
    const items = [];
    let total = 0;
    for (let guard = 0; guard < 30; guard++) {
      const len = r.weighted(lens);
      const gap = r.range(minGap, maxGap);
      if (total + gap + len + minGap > WRAP) break;
      items.push({ x0: total + gap + len / 2, len, kind: 'log' });
      total += gap + len;
    }
    const shift = -HALF + r.range(0, WRAP);
    for (const v of items) v.x0 = wrapX(v.x0 + shift);
    this.reach = null;
    return { row, type: 'river', dir, speed, items, coin: null, blocked: null };
  }

  // Stationary lily pads: treated like a grass row where water is "blocked" for reach purposes.
  lily(row) {
    const r = this.rng;
    const entry = this.reach ? [...this.reach] : ALL_COLS;
    const pads = new Set();
    for (const run of runs(entry)) pads.add(r.pick(run));
    const extra = r.int(1, 3);
    for (let i = 0; i < extra; i++) pads.add(r.int(-COLS + 1, COLS - 1));
    // a neighbour pad now and then so there is some sideways play
    if (r.chance(0.5)) { const p = [...pads][0]; pads.add(clamp(p + (r.chance(0.5) ? 1 : -1), -COLS, COLS)); }
    const water = new Set(ALL_COLS.filter(c => !pads.has(c)));
    const open = entry.filter(c => pads.has(c));
    this.reach = this.flood(water, open.length ? open : [...pads]);
    const items = [...pads].sort((a, b) => a - b).map(c => ({ x0: c, len: 1, kind: 'pad' }));
    return { row, type: 'river', dir: 1, speed: 0, items, coin: null, blocked: null, lily: true };
  }

  rail(row) {
    const r = this.rng;
    const d = difficulty(row);
    const dir = r.chance(0.5) ? 1 : -1;
    const cars = r.int(2, 5 + Math.round(d * 2));
    const trainLen = cars * TRAIN_CAR;
    const idle = r.range(lerp(5, 2.8, d), lerp(9, 5.5, d));
    const passTime = (WRAP + 4 + trainLen) / TRAIN_SPEED;
    const period = idle + TRAIN_WARN + passTime;
    const offset = r.range(0, period);
    let coin = null;
    if (r.chance(0.08)) coin = r.int(-COLS, COLS);
    this.reach = null;
    return { row, type: 'rail', dir, speed: 0, items: [], cars, trainLen, idle, period, offset, coin, blocked: null };
  }
}

// ---------------------------------------------------------------- the game
const DIRS = {
  up: { dr: 1, dc: 0, face: 0 },
  down: { dr: -1, dc: 0, face: Math.PI },
  left: { dr: 0, dc: -1, face: Math.PI / 2 },
  right: { dr: 0, dc: 1, face: -Math.PI / 2 },
};

export const DEATHS = ['car', 'drown', 'train', 'eagle', 'drift'];

export class Game {
  constructor(opts = {}) {
    this.seed = (opts.seed ?? Math.floor(Math.random() * 2 ** 31)) >>> 0;
    this.lanes = opts.lanes || new Map();
    this.gen = opts.gen || new LaneGen(this.seed);
    this.readonly = !!opts.readonly;
    this.tick = 0;
    this.started = false;
    this.scroll = 0;                  // the camera push line (rows)
    this.events = [];
    this.taken = new Set();           // collected coins "row:col"
    this.coins = 0;
    this.player = {
      row: 0, x: 0, face: 0, hop: null, onLog: null, dead: null,
      queue: [], landTick: -100, bumpTick: -100, maxRow: 0, idle: 0,
    };
    if (!opts.player) this.ensure(AHEAD);
  }

  get t() { return this.tick * TICK; }
  get score() { return this.player.maxRow; }

  ensure(row) {
    if (this.readonly) return;
    while (this.gen.row <= row) {
      const lane = this.gen.next();
      this.lanes.set(lane.row, lane);
    }
  }

  lane(row) {
    let l = this.lanes.get(row);
    if (!l && !this.readonly) { this.ensure(row); l = this.lanes.get(row); }
    return l || { row, type: 'grass', blocked: new Set(ALL_COLS), deco: [], items: [], speed: 0, dir: 1 };
  }

  prune() {
    const min = this.player.row - KEEP_BEHIND;
    for (const k of this.lanes.keys()) if (k < min) this.lanes.delete(k);
  }

  // A cheap copy for planners: lanes are shared (they never change once generated).
  clone() {
    const g = new Game({ seed: this.seed, lanes: this.lanes, gen: this.gen, readonly: true, player: true });
    g.tick = this.tick;
    g.started = this.started;
    g.scroll = this.scroll;
    g.taken = this.taken;           // planners never collect for real
    g.coins = this.coins;
    const p = this.player;
    g.player = { ...p, hop: p.hop && { ...p.hop }, onLog: p.onLog && { ...p.onLog }, queue: [...p.queue], dead: p.dead && { ...p.dead } };
    g.events = [];
    g.noEvents = true;
    return g;
  }

  emit(type, data) { if (!this.noEvents) this.events.push({ type, ...data }); }

  scrollSpeed() { return lerp(0.3, 0.68, clamp(this.player.maxRow / 250, 0, 1)); }

  input(dir) {
    const p = this.player;
    if (p.dead || !DIRS[dir]) return false;
    if (p.queue.length >= MAX_QUEUE) return false;
    p.queue.push(dir);
    return true;
  }

  // Find a log/pad in `lane` under x at time t; returns {idx, slotX} or null.
  findFloat(lane, x, t) {
    let best = null, bestD = Infinity;
    for (let i = 0; i < lane.items.length; i++) {
      const e = lane.items[i];
      const ex = entityX(lane, e, t);
      const half = e.len / 2;
      if (x < ex - half - 0.2 || x > ex + half + 0.2) continue;
      // snap to the nearest slot centre on the log
      const k = clamp(Math.round(x - (ex - half + 0.5)), 0, Math.max(0, Math.round(e.len) - 1));
      const sx = ex - half + 0.5 + k;
      const dd = Math.abs(sx - x);
      if (dd < bestD && dd <= 0.75) { bestD = dd; best = { idx: i, slotX: sx, offset: sx - ex }; }
    }
    return best;
  }

  // Can a hop in `dir` start right now? Returns the hop plan or null (blocked).
  planHop(dir) {
    const p = this.player;
    const m = DIRS[dir];
    const toRow = p.row + m.dr;
    const lane = this.lane(toRow);
    const landT = (this.tick + HOP_TICKS) * TICK;
    if (lane.type === 'river') {
      let baseX;
      if (m.dr === 0) {
        baseX = (p.onLog ? this.playerXAt(landT) : p.x) + m.dc;
        if (Math.abs(baseX) > COLS + 0.5) return null;
      } else {
        // forward/back from a log keeps your x (moving with it); from land, the grid column
        baseX = p.onLog ? this.playerXAt(landT) : Math.round(p.x);
      }
      const f = this.findFloat(lane, baseX, landT);
      if (f) return { toRow, toX: f.slotX, float: f, water: false, face: m.face };
      return { toRow, toX: baseX, float: null, water: true, face: m.face };
    }
    let col = Math.round(p.x) + m.dc;
    if (m.dr === 0) {
      if (Math.abs(col) > COLS) return null;
    } else col = clamp(col, -COLS, COLS);
    if (lane.type === 'grass' && lane.blocked && lane.blocked.has(col)) return null;
    return { toRow, toX: col, float: null, water: false, face: m.face };
  }

  // Player x at a future time if they just keep standing/riding.
  playerXAt(t) {
    const p = this.player;
    if (p.onLog) {
      const lane = this.lane(p.onLog.row);
      return entityX(lane, lane.items[p.onLog.idx], t) + p.onLog.offset;
    }
    return p.x;
  }

  startHop(dir) {
    const p = this.player;
    const m = DIRS[dir];
    p.face = m.face;
    const plan = this.planHop(dir);
    if (!plan) { p.bumpTick = this.tick; this.emit('bump', {}); return false; }
    p.hop = { fromRow: p.row, fromX: p.x, toRow: plan.toRow, toX: plan.toX, k: 0, float: plan.float, water: plan.water, dir };
    p.onLog = null;
    p.idle = 0;
    if (!this.started) { this.started = true; this.scroll = 0; }
    this.emit('hop', { dir });
    return true;
  }

  die(type, extra = {}) {
    const p = this.player;
    if (p.dead) return;
    p.dead = { type, tick: this.tick, x: p.x, row: p.row, ...extra };
    p.queue.length = 0;
    this.emit('death', { kind: type, ...extra });
  }

  // Which row the player counts as being in for collisions (they switch lanes mid-hop).
  curRow() {
    const h = this.player.hop;
    if (!h) return this.player.row;
    return h.k < HOP_TICKS / 2 ? h.fromRow : h.toRow;
  }

  step() {
    const p = this.player;
    this.tick++;
    const t = this.t;
    if (p.dead) return;

    // 1. advance the current hop / land
    if (p.hop) {
      const h = p.hop;
      h.k++;
      p.x = lerp(h.fromX, h.toX, h.k / HOP_TICKS);
      if (h.k >= HOP_TICKS) this.land();
      if (p.dead) return;
    }
    // 2. start a buffered hop the moment we're on the ground
    while (!p.hop && p.queue.length && !p.dead) this.startHop(p.queue.shift());
    // 3. ride logs
    if (!p.hop && p.onLog) {
      p.x = this.playerXAt(t);
      if (Math.abs(p.x) > EDGE_DEATH) { this.die('drift', { side: Math.sign(p.x) }); return; }
    }
    // 4. traffic and trains
    this.collide(t);
    if (p.dead) return;
    // 5. the camera keeps creeping forward; fall too far behind and the eagle comes
    if (this.started) {
      this.scroll = Math.max(this.scroll + this.scrollSpeed() * TICK, p.row - 1);
      if (this.scroll - p.row > BEHIND_LIMIT) { this.die('eagle', { why: 'behind' }); return; }
      if (!p.hop && ++p.idle > IDLE_LIMIT) { this.die('eagle', { why: 'idle' }); return; }
    }
    if (!this.readonly && (this.tick & 15) === 0) { this.ensure(p.row + AHEAD); this.prune(); }
  }

  land() {
    const p = this.player;
    const h = p.hop;
    p.hop = null;
    p.row = h.toRow;
    p.x = h.toX;
    p.landTick = this.tick;
    const lane = this.lane(p.row);
    if (h.water) { this.die('drown'); return; }
    if (h.float) p.onLog = { row: p.row, idx: h.float.idx, offset: h.float.offset };
    if (p.row > p.maxRow) { p.maxRow = p.row; this.emit('score', { score: p.maxRow }); }
    if (!this.readonly && lane.coin !== null && lane.coin !== undefined && lane.type !== 'river') {
      const key = p.row + ':' + lane.coin;
      if (Math.round(p.x) === lane.coin && !this.taken.has(key)) {
        this.taken.add(key);
        this.coins++;
        this.emit('coin', { row: p.row, col: lane.coin });
      }
    }
    this.emit('land', { lane: lane.type, log: !!h.float });
    if (!this.readonly) this.ensure(p.row + AHEAD);
  }

  collide(t) {
    const p = this.player;
    const row = this.curRow();
    const lane = this.lane(row);
    const a = p.x - PLAYER_HALF, b = p.x + PLAYER_HALF;
    if (lane.type === 'road') {
      for (let i = 0; i < lane.items.length; i++) {
        const v = lane.items[i];
        const vx = entityX(lane, v, t);
        const half = v.len / 2 - 0.08;
        if (b > vx - half && a < vx + half) { this.die('car', { row, vehicle: i, dir: lane.dir }); return; }
      }
    } else if (lane.type === 'rail') {
      const s = trainState(lane, t);
      if (s.phase === 'pass') {
        const lo = Math.min(s.head, s.tail), hi = Math.max(s.head, s.tail);
        if (b > lo && a < hi) this.die('train', { row, dir: lane.dir });
      }
    }
  }

  // Interpolated pose for rendering, alpha in [0,1) of the next tick.
  pose(alpha = 0) {
    const p = this.player;
    const t = (this.tick + alpha) * TICK;
    if (p.hop && !p.dead) {
      const h = p.hop;
      const k = Math.min(HOP_TICKS, h.k + alpha);
      const u = k / HOP_TICKS;
      return { x: lerp(h.fromX, h.toX, u), z: lerp(h.fromRow, h.toRow, u), y: Math.sin(Math.PI * u) * 0.42, u, hopping: true };
    }
    let x = p.x;
    if (p.onLog && !p.dead) x = this.playerXAt(t);
    return { x, z: p.row, y: 0, u: 1, hopping: false };
  }

  takeEvents() { const e = this.events; this.events = []; return e; }
}

// ---------------------------------------------------------------- characters & profile
export const CHARACTERS = [
  { id: 'chicken', name: 'Chicken', price: 0, theme: 'classic' },
  { id: 'duck', name: 'Duck', price: 30, theme: 'classic' },
  { id: 'frog', name: 'Frog', price: 50, theme: 'classic' },
  { id: 'pig', name: 'Pig', price: 60, theme: 'classic' },
  { id: 'cat', name: 'Cat', price: 80, theme: 'classic' },
  { id: 'penguin', name: 'Penguin', price: 100, theme: 'snow' },
  { id: 'fox', name: 'Fox', price: 120, theme: 'autumn' },
  { id: 'panda', name: 'Panda', price: 150, theme: 'classic' },
  { id: 'robot', name: 'Robot', price: 180, theme: 'night' },
  { id: 'unicorn', name: 'Unicorn', price: 250, theme: 'candy' },
];
export const charById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

// Saved progress. `storage` is anything with get(key, default) / set(key, value) that never
// throws (see store.js); tests pass an in-memory one.
export class Profile {
  constructor(storage) {
    this.s = storage;
    this.best = num(storage.get('best', 0));
    this.coins = num(storage.get('coins', 0));
    const owned = storage.get('owned', ['chicken']);
    this.owned = new Set(Array.isArray(owned) ? owned.filter(id => CHARACTERS.some(c => c.id === id)) : []);
    this.owned.add('chicken');
    const sel = storage.get('selected', 'chicken');
    this.selected = this.owned.has(sel) ? sel : 'chicken';
    this.muted = !!storage.get('muted', false);
  }
  save() {
    this.s.set('best', this.best);
    this.s.set('coins', this.coins);
    this.s.set('owned', [...this.owned]);
    this.s.set('selected', this.selected);
    this.s.set('muted', this.muted);
  }
  addCoins(n) { this.coins += n; this.save(); }
  submit(score) {
    const isBest = score > this.best;
    if (isBest) this.best = score;
    this.save();
    return isBest;
  }
  canBuy(id) { const c = charById(id); return c.id === id && !this.owned.has(id) && this.coins >= c.price; }
  buy(id) {
    if (!this.canBuy(id)) return false;
    this.coins -= charById(id).price;
    this.owned.add(id);
    this.selected = id;
    this.save();
    return true;
  }
  select(id) {
    if (!this.owned.has(id)) return false;
    this.selected = id;
    this.save();
    return true;
  }
  setMuted(m) { this.muted = !!m; this.save(); }
}
function num(v) { v = Number(v); return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0; }

export function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { get: (k, d) => (m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : d), set: (k, v) => m.set(k, v), map: m };
}
