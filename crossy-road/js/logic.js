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
export const HOP_TICKS = 4;            // default hop length in ticks (Fast); Classic is 8
export const HOP_CHOICES = [4, 8];     // the movement-speed setting: ticks per hop
export const HALF = 18;                // lanes wrap at x = +-18 (well outside the view)
export const WRAP = HALF * 2;
export const EDGE_DEATH = 5.4;         // carried this far out on a log = gone
export const BEHIND_LIMIT = 4;         // rows behind the camera push before the eagle comes
export const AHEAD = 32;               // rows generated ahead of the player
export const KEEP_BEHIND = 14;         // rows kept behind the player
export const WALL_ROW = -4;            // rows at or below this are solid forest
export const IDLE_LIMIT = 9 * 60;       // ticks without a hop before the eagle comes
export const MAX_QUEUE = 3;            // buffered hops, so quick taps are never dropped
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
  police: { len: 1.6 },
  icecream: { len: 2.0 },
  fire: { len: 3.0 },
  moto: { len: 1.0 },
  tractor: { len: 1.5 },
};
// The world changes biome every BIOME_ROWS rows (see render.js for what each one looks like).
export const BIOME_ROWS = 60;
export const zoneOf = row => Math.floor(Math.max(0, row) / BIOME_ROWS);
export const GEM_VALUE = 3;            // the blue jewel: one constant shared by the game and the server replay
export const TRAIN_CAR = 3.2;          // length of one train carriage
export const TRAIN_SPEED = 30;         // tiles per second
export const TRAIN_WARN = 2.2;         // seconds of warning lights before the train

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
    lane.zone = zoneOf(row);
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
    let coin = null, gem = false;
    if (r.chance(0.42)) { coin = r.pick([...this.reach]); gem = row > 20 && r.chance(0.08); }
    // flowers, tufts and mushrooms on open cells: scenery only, never in the way
    const flowers = [];
    for (const c of ALL_COLS) if (!blocked.has(c) && c !== coin && r.chance(0.18)) flowers.push({ c, v: r.int(0, 5), dx: r.range(-0.3, 0.3), dz: r.range(-0.3, 0.3) });
    return { row, type: 'grass', blocked, deco: this.decoFor(row, blocked), coin, gem, flowers, speed: 0, dir: 1, items: [] };
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
    const style = r.weighted([['cars', 5], ['mixed', 3], ['trucks', lerp(1, 3, d)], ['emergency', 0.7], ['motos', row > 30 ? 0.8 : 0], ['farm', 0.6]]);
    // motorbikes are quick, tractors crawl; the gap rules below scale with speed either way
    const speed = lerp(1.8, 4.2, d) * r.range(0.8, 1.25) * (style === 'motos' ? 1.35 : style === 'farm' ? 0.7 : 1);
    const minGap = 3.2 + speed * 0.45;
    const maxGap = minGap + lerp(8, 3.5, d);
    const items = [];
    let total = 0;
    for (let guard = 0; guard < 20; guard++) {
      const kind = style === 'cars' ? r.pick(['car', 'car', 'taxi', 'van', 'car', 'icecream', 'police'])
        : style === 'trucks' ? r.pick(['truck', 'bus', 'truck'])
        : style === 'emergency' ? r.pick(['police', 'police', 'fire'])
        : style === 'motos' ? r.pick(['moto', 'moto', 'moto', 'car'])
        : style === 'farm' ? r.pick(['tractor', 'tractor', 'van'])
        : r.pick(['car', 'van', 'truck', 'bus', 'taxi', 'police', 'icecream']);
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
      items.push({ x0: total + gap + len / 2, len, kind: len <= 3 && r.chance(0.18) ? 'turtles' : len >= 2 && r.chance(0.12) ? 'raft' : 'log' });
      total += gap + len;
    }
    const shift = -HALF + r.range(0, WRAP);
    for (const v of items) v.x0 = wrapX(v.x0 + shift);
    // Logs only carry you downstream, so where you can hop off depends on where you got on:
    // anywhere downstream of the entry columns (or one hop upstream).
    const entry = this.reach ? [...this.reach] : ALL_COLS;
    const lim = dir > 0 ? Math.min(...entry) - 1 : Math.max(...entry) + 1;
    this.reach = new Set(ALL_COLS.filter(c => (dir > 0 ? c >= lim : c <= lim)));
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
// rows where we note how many sideways hops it took to get there (for "few sideways hops" challenges)
export const SIDE_CHECKS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
export const MAX_RUN_TICKS = 60 * 60 * 45;   // a 45-minute run is the longest the server will replay

// Replays a run from its seed and the hop inputs; the server uses this to work out the real
// score, coins and challenge stats instead of trusting the browser.
export function replayRun({ seed, hopTicks = HOP_TICKS, inputs = [], fast = [], endTick }) {
  const g = new Game({ seed, hopTicks });
  const evs = inputs.map(([t, d]) => ({ t: t | 0, d })).concat(fast.map(t => ({ t: t | 0, fast: true })))
    .filter(e => e.t >= 0).sort((a, b) => a.t - b.t);
  const stop = Math.min(MAX_RUN_TICKS, Number.isFinite(endTick) ? endTick : MAX_RUN_TICKS);
  let i = 0;
  while (g.tick < stop && !g.player.dead) {
    while (i < evs.length && evs[i].t <= g.tick) { const e = evs[i++]; if (e.fast) g.makeInvincible(); else g.input(e.d); }
    g.step();
    g.events.length = 0;
  }
  return { score: g.score, coins: g.coins, ticks: g.tick, dead: g.player.dead ? g.player.dead.type : null, practice: g.fastTicks.length > 0, stats: g.runStats() };
}

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
    this.invUntil = 0;                // tick when the "fast" invincibility wears off
    this.hopTicks = HOP_CHOICES.includes(opts.hopTicks) ? opts.hopTicks : HOP_TICKS;
    // everything the challenges measure, from real gameplay events
    this.stats = { roads: 0, rails: 0, rivers: 0, logs: 0, fwd: 0, side: 0, back: 0, ordCoins: 0, gems: 0, firstBackRow: null, sideAt: {} };
    this.logSet = new Set();          // distinct moving logs landed on ("row:idx")
    this.inputs = [];                 // [tick, dir] for every accepted hop: the server replays these
    this.fastTicks = [];              // ticks where "fast" was typed (a practice run)
    this.player = {
      row: 0, x: 0, face: 0, hop: null, onLog: null, dead: null,
      queue: [], landTick: -100, bumpTick: -100, maxRow: 0, idle: 0,
    };
    if (!opts.player) this.ensure(AHEAD);
  }

  get t() { return this.tick * TICK; }
  get score() { return this.player.maxRow; }
  get invincible() { return this.tick < this.invUntil; }
  invLeft() { return Math.max(0, (this.invUntil - this.tick) * TICK); }
  // The "fast" cheat: nothing can hurt you for a while. Typing it again restarts the clock.
  makeInvincible(seconds = INVINCIBLE_SECONDS) {
    if (this.player.dead) return false;
    if (!this.noEvents) this.fastTicks.push(this.tick);
    this.invUntil = this.tick + Math.round(seconds * TPS);
    this.usedFast = true;            // challenges don't count on a cheat run
    this.emit('invincible', { seconds });
    return true;
  }
  runStats() {
    const s = this.stats;
    return { score: this.score, coins: this.coins, roads: s.roads, rails: s.rails, rivers: s.rivers, logs: s.logs,
      fwd: s.fwd, side: s.side, back: s.back, ordCoins: s.ordCoins, gems: s.gems,
      noBackRow: s.firstBackRow === null ? this.score : s.firstBackRow, sideAt: { ...s.sideAt } };
  }

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
    g.invUntil = this.invUntil;
    g.stats = { ...this.stats, sideAt: { ...this.stats.sideAt } };
    g.hopTicks = this.hopTicks;
    g.logSet = new Set(this.logSet);
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
    if (!this.noEvents) this.inputs.push([this.tick, dir]);
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
    const landT = (this.tick + this.hopTicks) * TICK;
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
    const st = this.stats;
    if (dir === 'up') st.fwd++; else if (dir === 'down') { st.back++; if (st.firstBackRow === null) st.firstBackRow = p.maxRow; } else st.side++;
    if (!this.started) { this.started = true; this.scroll = 0; }
    this.emit('hop', { dir });
    return true;
  }

  die(type, extra = {}) {
    const p = this.player;
    if (p.dead) return;
    if (this.invincible) {
      // shrug it off: cars and trains pass through, water holds you up, the eagle gives up
      if (type === 'drift') { p.onLog = null; p.x = clamp(Math.round(p.x), -COLS, COLS); }
      if (type === 'eagle') { this.scroll = Math.min(this.scroll, p.row); p.idle = 0; }
      if (this.tick - (this.lastShrug || -99) > 20) { this.lastShrug = this.tick; this.emit('shrug', { kind: type }); }
      return;
    }
    p.dead = { type, tick: this.tick, x: p.x, row: p.row, ...extra };
    p.queue.length = 0;
    this.emit('death', { kind: type, ...extra });
  }

  // Which row the player counts as being in for collisions (they switch lanes mid-hop).
  curRow() {
    const h = this.player.hop;
    if (!h) return this.player.row;
    return h.k < this.hopTicks / 2 ? h.fromRow : h.toRow;
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
      p.x = lerp(h.fromX, h.toX, h.k / this.hopTicks);
      if (h.k >= this.hopTicks) this.land();
      if (p.dead) return;
    }
    // 2. start a buffered hop the moment we're on the ground
    while (!p.hop && p.queue.length && !p.dead) this.startHop(p.queue.shift());
    // 3. ride logs
    if (!p.hop && p.onLog) {
      p.x = this.playerXAt(t);
      if (Math.abs(p.x) > EDGE_DEATH) { this.die('drift', { side: Math.sign(p.x) }); return; }
    }
    // invincibility ran out while standing on the water
    if (!p.hop && !p.onLog && !this.invincible && this.lane(p.row).type === 'river') { this.die('drown'); return; }
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
    if (p.row > p.maxRow) {
      p.maxRow = p.row;
      // the lane you just got past counts as crossed; a river section counts once you're out of it
      const st = this.stats, left = this.lane(p.row - 1);
      if (left.type === 'road') st.roads++;
      else if (left.type === 'rail') st.rails++;
      else if (left.type === 'river' && lane.type !== 'river') st.rivers++;
      if (SIDE_CHECKS.includes(p.maxRow)) st.sideAt[p.maxRow] = st.side;
      this.emit('score', { score: p.maxRow });
    }
    if (h.float && lane.speed) {
      const key = p.row + ':' + h.float.idx;
      if (!this.logSet.has(key)) { this.logSet.add(key); this.stats.logs++; }
    }
    if (h.water) { this.die('drown'); return; }
    if (h.float) p.onLog = { row: p.row, idx: h.float.idx, offset: h.float.offset };
    if (!this.readonly && lane.coin !== null && lane.coin !== undefined && lane.type !== 'river') {
      const key = p.row + ':' + lane.coin;
      if (Math.round(p.x) === lane.coin && !this.taken.has(key)) {
        this.taken.add(key);
        const value = lane.gem ? GEM_VALUE : 1;
        this.coins += value;
        if (lane.gem) this.stats.gems++; else this.stats.ordCoins++;
        this.emit('coin', { row: p.row, col: lane.coin, value, gem: !!lane.gem });
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
        if (b > vx - half && a < vx + half) {
          // hopping into a car's side bounces you off it; standing in its path gets you run over
          const how = p.hop ? 'side' : v.len >= 2.4 ? 'flat' : 'launch';
          this.die('car', { row, vehicle: i, dir: lane.dir, how, hopDir: p.hop ? p.hop.dir : null, y: p.hop ? Math.sin(Math.PI * p.hop.k / this.hopTicks) * 0.42 : 0 });
          return;
        }
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
      const k = Math.min(this.hopTicks, h.k + alpha);
      const u = k / this.hopTicks;
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
  { id: 'dog', name: 'Dog', price: 40, theme: 'classic' },
  { id: 'bunny', name: 'Bunny', price: 50, theme: 'classic' },
  { id: 'mouse', name: 'Mouse', price: 60, theme: 'classic' },
  { id: 'sheep', name: 'Sheep', price: 70, theme: 'classic' },
  { id: 'cow', name: 'Cow', price: 90, theme: 'classic' },
  { id: 'turtle', name: 'Turtle', price: 90, theme: 'classic' },
  { id: 'bee', name: 'Bee', price: 110, theme: 'classic' },
  { id: 'owl', name: 'Owl', price: 130, theme: 'night' },
  { id: 'camel', name: 'Camel', price: 140, theme: 'desert' },
  { id: 'lizard', name: 'Lizard', price: 150, theme: 'desert' },
  { id: 'monkey', name: 'Monkey', price: 160, theme: 'jungle' },
  { id: 'parrot', name: 'Parrot', price: 170, theme: 'jungle' },
  { id: 'tiger', name: 'Tiger', price: 200, theme: 'jungle' },
  { id: 'polarbear', name: 'Polar Bear', price: 200, theme: 'snow' },
  { id: 'snowman', name: 'Snowman', price: 220, theme: 'snow' },
  { id: 'pumpkin', name: 'Pumpkin', price: 220, theme: 'spooky' },
  { id: 'bat', name: 'Bat', price: 230, theme: 'spooky' },
  { id: 'ghost', name: 'Ghost', price: 260, theme: 'spooky' },
  { id: 'skeleton', name: 'Skeleton', price: 280, theme: 'spooky' },
  { id: 'zombie', name: 'Zombie', price: 300, theme: 'spooky' },
  { id: 'gingerbread', name: 'Gingerbread', price: 300, theme: 'candy' },
  { id: 'ninja', name: 'Ninja', price: 320, theme: 'night' },
  { id: 'dino', name: 'Dino', price: 350, theme: 'jungle' },
  { id: 'alien', name: 'Alien', price: 400, theme: 'space' },
  { id: 'astronaut', name: 'Astronaut', price: 450, theme: 'space' },
  { id: 'dragon', name: 'Dragon', price: 500, theme: 'desert' },
];
// The 30-strong 2026 collection: bought with coins like the originals (never from the prize machine
// above PRIZE_MAX_PRICE, so the premium ones can't be won cheaply).
CHARACTERS.push(
  { id: 'foresthog', name: 'Forest Hedgehog', price: 25, theme: 'autumn' },
  { id: 'squirrel', name: 'Squirrel', price: 35, theme: 'autumn' },
  { id: 'goldfish', name: 'Goldfish', price: 50, theme: 'classic' },
  { id: 'hamster', name: 'Hamster', price: 60, theme: 'classic' },
  { id: 'chick', name: 'Baby Chick', price: 75, theme: 'classic' },
  { id: 'raccoon', name: 'Raccoon', price: 85, theme: 'night' },
  { id: 'goat', name: 'Mountain Goat', price: 95, theme: 'snow' },
  { id: 'toucan', name: 'Toucan', price: 110, theme: 'jungle' },
  { id: 'sloth', name: 'Sloth', price: 125, theme: 'jungle' },
  { id: 'koala', name: 'Koala', price: 140, theme: 'jungle' },
  { id: 'beaver', name: 'Beaver', price: 150, theme: 'autumn' },
  { id: 'otter', name: 'Otter', price: 170, theme: 'classic' },
  { id: 'axolotl', name: 'Axolotl', price: 190, theme: 'candy' },
  { id: 'redpanda', name: 'Red Panda', price: 200, theme: 'autumn' },
  { id: 'peacock', name: 'Peacock', price: 225, theme: 'jungle' },
  { id: 'wolf', name: 'Timber Wolf', price: 250, theme: 'snow' },
  { id: 'boar', name: 'Wild Boar', price: 275, theme: 'autumn' },
  { id: 'flamingo', name: 'Flamingo', price: 300, theme: 'candy' },
  { id: 'arcticfox', name: 'Arctic Fox', price: 325, theme: 'snow' },
  { id: 'meerkat', name: 'Meerkat', price: 350, theme: 'desert' },
  { id: 'wyvern', name: 'Jade Wyvern', price: 375, theme: 'jungle' },
  { id: 'goldknight', name: 'Golden Knight', price: 400, theme: 'retro' },
  { id: 'sorcerer', name: 'Forest Sorcerer', price: 450, theme: 'spooky' },
  { id: 'pirateparrot', name: 'Pirate Parrot', price: 500, theme: 'classic' },
  { id: 'samurai', name: 'Samurai Warrior', price: 550, theme: 'night' },
  { id: 'cyberfox', name: 'Cyber Fox', price: 600, theme: 'metro' },
  { id: 'deer', name: 'Celestial Deer', price: 700, theme: 'space' },
  { id: 'crystalgolem', name: 'Crystal Golem', price: 800, theme: 'space' },
  { id: 'whale', name: 'Galaxy Whale', price: 900, theme: 'space' },
  { id: 'royalphoenix', name: 'Royal Phoenix', price: 1000, theme: 'volcano', premium: true },
);
export const NEW_2026 = new Set(['foresthog', 'squirrel', 'goldfish', 'hamster', 'chick', 'raccoon', 'goat', 'toucan', 'sloth', 'koala', 'beaver', 'otter', 'axolotl', 'redpanda', 'peacock', 'wolf', 'boar', 'flamingo', 'arcticfox', 'meerkat', 'wyvern', 'goldknight', 'sorcerer', 'pirateparrot', 'samurai', 'cyberfox', 'deer', 'crystalgolem', 'whale', 'royalphoenix']);
// Shop quality bands by price (purely presentation)
export const qualityOf = c => (c.code ? 'Secret' : c.challenge ? 'Challenge' : c.price >= 800 ? 'Legendary' : c.price >= 450 ? 'Epic' : c.price >= 200 ? 'Rare' : c.price >= 100 ? 'Uncommon' : 'Common');
// The prize machine only hands out ordinary characters up to this price, each equally likely.
export const PRIZE_MAX_PRICE = 300;

// Secret and challenge skins: you can't buy these. `code` = redeem code, `challenge` = run goal.
CHARACTERS.push(
  { id: 'golden', name: 'Golden Chicken', price: null, theme: 'desert', code: 'golden' },
  { id: 'ironsuit', name: 'Iron Suit', price: null, theme: 'metro', challenge: { stat: 'score', goal: 75, text: 'Reach 75 rows in one run' } },
  { id: 'starshield', name: 'Star Shield', price: null, theme: 'classic', challenge: { stat: 'roads', goal: 40, text: 'Cross 40 roads in one run' } },
  { id: 'thunder', name: 'Thunder God', price: null, theme: 'snow', challenge: { stat: 'rails', goal: 15, text: 'Cross 15 train tracks in one run' } },
  { id: 'brute', name: 'Smash Brute', price: null, theme: 'jungle', challenge: { stat: 'score', goal: 150, text: 'Reach 150 rows in one run' } },
  { id: 'crawler', name: 'Wall Crawler', price: null, theme: 'metro', challenge: { stat: 'logs', goal: 30, text: 'Ride 30 logs in one run' } },
  { id: 'panther', name: 'Panther King', price: null, theme: 'night', challenge: { stat: 'coins', goal: 25, text: 'Grab 25 coins in one run' } },
  { id: 'miner', name: 'Block Miner', price: null, theme: 'retro', challenge: { stat: 'score', goal: 50, text: 'Reach 50 rows in one run' } },
  { id: 'hedgehog', name: 'Turbo Hedgehog', price: null, theme: 'desert', challenge: { stat: 'roads', goal: 80, text: 'Cross 80 roads in one run' } },
  { id: 'knight', name: 'Pixel Knight', price: null, theme: 'retro', challenge: { stat: 'rails', goal: 30, text: 'Cross 30 train tracks in one run' } },
  { id: 'marine', name: 'Space Marine', price: null, theme: 'space', challenge: { stat: 'score', goal: 250, text: 'Reach 250 rows in one run' } },
  { id: 'golem', name: 'Lava Golem', price: null, theme: 'volcano', challenge: { stat: 'logs', goal: 60, text: 'Ride 60 logs in one run' } },
  { id: 'phoenix', name: 'Phoenix', price: null, theme: 'volcano', challenge: { stat: 'score', goal: 500, text: 'Reach 500 rows in one run' } },
  { id: 'titan', name: 'Robo Titan', price: null, theme: 'metro', challenge: { stat: 'roads', goal: 150, text: 'Cross 150 roads in one run' } },
  { id: 'frost', name: 'Frost Wizard', price: null, theme: 'snow', challenge: { stat: 'rails', goal: 60, text: 'Cross 60 train tracks in one run' } },
  { id: 'pirate', name: 'Pirate Captain', price: null, theme: 'classic', challenge: { stat: 'logs', goal: 120, text: 'Ride 120 logs in one run' } },
  { id: 'cosmic', name: 'Cosmic Guardian', price: null, theme: 'space', challenge: { stat: 'coins', goal: 60, text: 'Grab 60 coins in one run' } },
);
// how hard each challenge is, for the challenges board
const TIERS = { miner: 'Easy', ironsuit: 'Easy', panther: 'Medium', starshield: 'Medium', thunder: 'Medium', crawler: 'Medium',
  brute: 'Hard', hedgehog: 'Hard', knight: 'Hard', golem: 'Hard', marine: 'Hard', phoenix: 'Extreme', titan: 'Extreme', frost: 'Extreme', pirate: 'Extreme', cosmic: 'Extreme' };
for (const c of CHARACTERS) if (c.challenge) c.challenge.tier = TIERS[c.id] || 'Medium';
export const CHALLENGES = CHARACTERS.filter(c => c.challenge);
export const INVINCIBLE_SECONDS = 20;
export const SECRET_WORDS = ['fast', 'golden'];
export const PRIZE_PRICE = 100;
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
    const rec = storage.get('records', {});
    this.records = {};
    for (const k of ['score', 'roads', 'rails', 'logs', 'coins']) this.records[k] = num(rec && rec[k]);
  }
  // Best-ever run stats; returns the challenge skins this run has just unlocked.
  recordRun(stats) {
    for (const k in this.records) if (num(stats[k]) > this.records[k]) this.records[k] = num(stats[k]);
    const won = [];
    for (const c of CHALLENGES) if (!this.owned.has(c.id) && num(stats[c.challenge.stat]) >= c.challenge.goal) { this.owned.add(c.id); won.push(c); }
    this.save();
    return won;
  }
  // Redeem codes. Returns the character unlocked, or null.
  redeem(code) {
    const c = CHARACTERS.find(x => x.code && x.code === String(code || '').trim().toLowerCase());
    if (!c) return null;
    this.owned.add(c.id); this.selected = c.id; this.save();
    return c;
  }
  save() {
    this.s.set('best', this.best);
    this.s.set('coins', this.coins);
    this.s.set('owned', [...this.owned]);
    this.s.set('selected', this.selected);
    this.s.set('muted', this.muted);
    this.s.set('records', this.records);
  }
  addCoins(n) { this.coins += n; this.save(); }
  submit(score) {
    const isBest = score > this.best;
    if (isBest) this.best = score;
    this.save();
    return isBest;
  }
  canBuy(id) { const c = charById(id); return c.id === id && c.price !== null && !this.owned.has(id) && this.coins >= c.price; }
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
  // Prize machine: a random character you don't own yet, for PRIZE_PRICE coins.
  prize(rnd = Math.random) {
    const left = CHARACTERS.filter(c => !this.owned.has(c.id) && c.price !== null && c.price <= PRIZE_MAX_PRICE);
    if (!left.length || this.coins < PRIZE_PRICE) return null;
    const c = left[Math.floor(rnd() * left.length)];
    this.coins -= PRIZE_PRICE;
    this.owned.add(c.id);
    this.selected = c.id;
    this.save();
    return c;
  }
}
function num(v) { v = Number(v); return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0; }

export function memoryStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { get: (k, d) => (m.has(k) ? JSON.parse(JSON.stringify(m.get(k))) : d), set: (k, v) => m.set(k, v), map: m };
}
