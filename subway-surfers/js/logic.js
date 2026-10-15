// Rules for the subway runner: track generation, running, jumping, rolling, lane changes, trains,
// ramps, hurdles, barriers, coins, power-ups and stumbles. No three.js here, so the
// Node tests can run whole games with a bot.
//
// Coordinates: z is distance along the track (grows forward), x is sideways (lanes at -LANE_W, 0,
// +LANE_W), y is up. Trains are TRAIN_H tall; you can stand on top of them.

export const LANE_W = 2.3, LANES = [-1, 0, 1];
export const GRAVITY = 34, JUMP_V = 12, SUPER_JUMP_V = 18.5, ROLL_TIME = 0.62;
export const TRAIN_H = 3.1, RAMP_LEN = 5, HURDLE_H = 1.0, BAR_LOW = 1.25, BAR_HIGH = 2.9;
export const STUMBLE_SLOW = 0.9, START_GAP = 46;
export const POWER_TIME = { magnet: 10, sneakers: 10, double: 15 };

export class Rng {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() { let t = (this.s = (this.s + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(a) { return a[Math.floor(this.next() * a.length)]; }
}

export const speedAt = z => Math.min(30, 15 + z / 380);
export const difficulty = z => Math.min(1, z / 2500);
export const laneX = lane => lane * LANE_W;

// ---------------------------------------------------------------- track generation
// The track is cut into segments. Each segment has a "safe" lane that never holds a train, only
// jumpable hurdles and rollable barriers spaced well apart, and consecutive safe lanes are at
// most one apart. Every segment starts with a stretch where all three lanes are clear, so you can
// always get across to the new safe lane in time. The other lanes get trains (some with ramps up
// onto their roofs, some driving towards you), hurdles, barriers or nothing.
export class Track {
  constructor(seed) {
    this.rng = new Rng(seed);
    this.things = [];       // obstacles: { kind: 'train'|'hurdle'|'bar', lane, z0, z1, ramp?, speed?, wake? }
    this.coins = [];        // { lane, z, y, taken }
    this.powers = [];       // { kind, lane, z, y, taken }
    this.genZ = START_GAP;
    this.safe = 0;
    this.segments = [];
    this.lastHop = {};      // lane -> z of the last hurdle or barrier
  }

  ensure(z) { while (this.genZ < z) this.segment(); }

  prune(z) {
    const keep = t => (t.z1 ?? t.z) > z - 20;
    this.things = this.things.filter(t => (t.speed ? t.z1 - (t.travel || 0) : t.z1) > z - 30);
    this.coins = this.coins.filter(keep);
    this.powers = this.powers.filter(keep);
    this.segments = this.segments.filter(s => s.z1 > z - 50);
  }

  segment() {
    const r = this.rng, z0 = this.genZ, d = difficulty(z0);
    const L = r.range(48, 78);
    const gap = 13 + speedAt(z0) * 0.25;           // all-clear lead-in
    const safe = Math.max(-1, Math.min(1, this.safe + r.pick([-1, 0, 0, 1])));
    this.safe = safe;
    const a = z0 + gap, b = z0 + L;
    this.segments.push({ z0, z1: b, safe });
    for (const lane of LANES) {
      if (lane === safe) { this.hops(lane, a, b, 0.55 + d * 0.3); this.coinLine(lane, a + 2, Math.min(b - 2, a + r.range(14, 30)), 0); continue; }
      const kind = pickWeighted(r, [['train', 4], ['twoTrains', 1.5 + d * 2], ['moving', 1.8 + d * 2], ['hops', 2], ['empty', 1.2 - d * 0.8]]);
      if (kind === 'train') this.train(lane, a + r.range(0, 6), Math.min(b - 1, a + r.range(14, 34)), r.chance(0.45));
      else if (kind === 'twoTrains') {
        // leave room to drop off the first roof and still get out of the way of the second train
        const mid = a + (b - a) * r.range(0.4, 0.6), half = 3 + speedAt(mid) * 0.32;
        this.train(lane, a + r.range(0, 4), mid - half, r.chance(0.35));
        this.train(lane, mid + half, b - 1, r.chance(0.35));
      } else if (kind === 'moving') {
        // A train driving towards you. It starts rolling once you are `wake` away, so it always
        // passes you inside this lane of this segment, never in an earlier one.
        const len = r.range(10, 16), speed = r.range(5, 7 + d * 4);
        const start = b - len - 1, wake = 70;
        const vp = speedAt(start);
        const meet = start - wake * speed / (vp + speed);
        if (meet > a + 2) this.things.push({ kind: 'train', lane, z0: start, z1: start + len, speed, wake, ramp: false });
      } else if (kind === 'hops') this.hops(lane, a, b, 0.4 + d * 0.3);
    }
    // a power-up now and then, in the safe lane where nothing is in the way
    if (r.chance(0.22)) {
      const z = a + 1.2;
      if (!this.things.some(t => t.lane === safe && Math.abs((t.z0 + t.z1) / 2 - z) < 3)) this.powers.push({ kind: r.pick(['magnet', 'sneakers', 'double']), lane: safe, z, y: 1, taken: false });
    }
    this.genZ = b;
  }

  train(lane, z0, z1, ramp) {
    if (z1 - z0 < 8) return;
    this.things.push({ kind: 'train', lane, z0, z1, ramp, speed: 0 });
    // coins along the roof of the trains you can climb
    if (ramp) this.coinLine(lane, z0 + RAMP_LEN + 1, z1 - 1, TRAIN_H);
  }

  // Hurdles to jump and barriers to roll under, far enough apart that even a super-sneaker jump
  // (about 1.1 s in the air) lands before the next one.
  hops(lane, a, b, density) {
    const r = this.rng;
    const gapAt = z => speedAt(z) * 1.15 + 4;
    for (let z = Math.max(a + r.range(2, 8), (this.lastHop[lane] ?? -1e9) + gapAt(a)); z < b - 2; z += gapAt(z) + r.range(0, 9)) {
      if (!r.chance(density)) continue;
      this.lastHop[lane] = z;
      const kind = r.chance(0.55) ? 'hurdle' : 'bar';
      this.things.push({ kind, lane, z0: z - 0.25, z1: z + 0.25 });
      if (kind === 'hurdle' && r.chance(0.6)) for (let i = -2; i <= 2; i++) this.coins.push({ lane, z: z + i * 1.4, y: 1 + (2.2 - Math.abs(i) * 0.6), taken: false });
    }
  }

  coinLine(lane, z0, z1, y) {
    for (let z = z0; z <= z1; z += 2.2) {
      if (y === 0 && this.things.some(t => t.lane === lane && z > t.z0 - 1.5 && z < t.z1 + 1.5)) continue;
      this.coins.push({ lane, z, y: y + 1, taken: false });
    }
  }
}
function pickWeighted(r, pairs) {
  let total = 0; for (const p of pairs) total += Math.max(0, p[1]);
  let x = r.next() * total;
  for (const p of pairs) if ((x -= Math.max(0, p[1])) < 0) return p[0];
  return pairs[0][0];
}

// Where a train is now (moving trains roll towards you once you get within `wake`).
export function trainSpan(t, pz) {
  if (!t.speed) return [t.z0, t.z1];
  if (t.travel === undefined) t.travel = 0;
  return [t.z0 - t.travel, t.z1 - t.travel];
}

// ---------------------------------------------------------------- the run
export class Run {
  constructor(seed = (Math.random() * 2 ** 31) | 0) {
    this.track = new Track(seed);
    this.p = { lane: 0, from: 0, x: 0, y: 0, vy: 0, z: 0, ground: true, roll: 0, dead: null };
    this.t = 0; this.dist = 0; this.score = 0; this.coins = 0;
    this.power = { magnet: 0, sneakers: 0, double: 0 };
    this.stumbleAt = -99; this.slow = 0; this.events = [];
    this.track.ensure(220);
  }
  get speed() { return speedAt(this.p.z) * (this.slow > 0 ? 0.72 : 1); }
  get mult() { return 1 + Math.floor(this.p.z / 1000) + (this.power.double > 0 ? 1 : 0); }
  emit(type, data = {}) { this.events.push({ type, ...data }); }

  // Height of whatever you would be standing on in `lane` at z (ground, a ramp or a train roof).
  surface(lane, z) {
    let h = 0;
    for (const t of this.track.things) {
      if (t.kind !== 'train' || t.lane !== lane) continue;
      const [a, b] = trainSpan(t, this.p.z);
      if (z < a || z > b) continue;
      if (t.ramp && z < a + RAMP_LEN) h = Math.max(h, TRAIN_H * (z - a) / RAMP_LEN);
      else h = Math.max(h, TRAIN_H);
    }
    return h;
  }
  trainAt(lane, z) {
    for (const t of this.track.things) {
      if (t.kind !== 'train' || t.lane !== lane) continue;
      const [a, b] = trainSpan(t, this.p.z);
      if (z >= a - 0.4 && z <= b + 0.4) return t;
    }
    return null;
  }

  input(action) {
    const p = this.p; if (p.dead) return;
    if (action === 'left' || action === 'right') {
      const to = p.lane + (action === 'left' ? -1 : 1);
      if (to < -1 || to > 1) { this.stumble('wall'); return; }
      // a train beside you that you are not above: bump off its side
      const tr = this.trainAt(to, p.z);
      if (tr && p.y < this.surface(to, p.z) - 0.4) { this.stumble('side'); return; }
      p.from = p.lane; p.lane = to; this.emit('swipe');
    } else if (action === 'jump') {
      if (p.ground) { p.vy = this.power.sneakers > 0 ? SUPER_JUMP_V : JUMP_V; p.ground = false; p.roll = 0; this.emit('jump'); }
    } else if (action === 'roll') {
      p.roll = ROLL_TIME; if (!p.ground) p.vy = Math.min(p.vy, -26); this.emit('roll');
    }
  }

  // bumping a train's side or the wall knocks you back and slows you for a moment
  stumble(why) {
    this.stumbleAt = this.t; this.slow = STUMBLE_SLOW; this.emit('stumble', { why });
  }
  die(why) { if (!this.p.dead) { this.p.dead = { why, t: this.t }; this.emit('crash', { why }); } }

  step(dt) {
    const p = this.p; if (p.dead) return;
    this.t += dt;
    const v = this.speed;
    const prevZ = p.z;
    p.z += v * dt;
    this.dist += v * dt;
    this.score += v * dt * this.mult;
    for (const k in this.power) if (this.power[k] > 0) this.power[k] = Math.max(0, this.power[k] - dt);
    if (this.slow > 0) this.slow -= dt;
    for (const t of this.track.things) if (t.speed && t.z0 - (t.travel || 0) - p.z < t.wake) {
      if (!t.travel) this.emit('horn', { lane: t.lane });
      t.travel = (t.travel || 0) + t.speed * dt;
    }
    // sideways glide
    const tx = laneX(p.lane), lat = LANE_W / 0.15 * dt;
    p.x += Math.max(-lat, Math.min(lat, tx - p.x));
    // vertical
    if (p.roll > 0) p.roll -= dt;
    const lane = p.lane;
    const surf = Math.max(this.surface(lane, p.z), Math.abs(p.x - tx) > 0.2 ? this.surface(p.from, p.z) : 0);
    if (!p.ground || p.y > surf + 0.05) { p.vy -= GRAVITY * dt; p.y += p.vy * dt; p.ground = false; }
    if (p.y <= surf) {
      // running into the front of a train (not a ramp) is a crash; stepping up a ramp is fine
      if (surf - p.y > 0.7) { this.die('train'); return; }
      if (!p.ground && p.vy < -1) this.emit('land');
      p.y = surf; p.vy = 0; p.ground = true;
    }
    // hurdles and barriers
    for (const t of this.track.things) {
      if (t.kind === 'train' || t.lane !== lane || Math.abs(p.x - tx) > 0.9) continue;
      if (p.z + 0.3 < t.z0 || p.z - 0.3 > t.z1) continue;
      if (t.kind === 'hurdle' && p.y < HURDLE_H && this.surface(lane, p.z) < 0.1) { this.die('hurdle'); return; }
      if (t.kind === 'bar' && p.roll <= 0 && p.y < BAR_HIGH && p.y + 1.7 > BAR_LOW) { this.die('bar'); return; }
    }
    // a train coming at you or a train end you didn't climb
    const tr = this.trainAt(lane, p.z + 0.5);
    if (tr && Math.abs(p.x - tx) < 0.9) {
      const [a] = trainSpan(tr, p.z);
      const top = this.surface(lane, p.z + 0.5);
      if (p.y < top - 0.7 && !(tr.ramp && p.z + 0.5 < a + RAMP_LEN)) { this.die(tr.speed ? 'oncoming' : 'train'); return; }
    }
    // coins and power-ups
    const magnet = this.power.magnet > 0;
    for (const c of this.track.coins) {
      if (c.taken) continue;
      const dz = c.z - p.z;
      if (dz < -1 || dz > (magnet ? 10 : 1)) continue;
      const near = magnet ? Math.abs(laneX(c.lane) - p.x) < LANE_W * 1.6 : Math.abs(laneX(c.lane) - p.x) < 0.9 && Math.abs(c.y - (p.y + 1)) < 1.3;
      if (near && (magnet || Math.abs(dz) < 0.9)) { c.taken = true; this.coins++; this.emit('coin', { magnet }); }
    }
    for (const w of this.track.powers) {
      if (w.taken || Math.abs(w.z - p.z) > 1 || Math.abs(laneX(w.lane) - p.x) > 0.9 || Math.abs(w.y - (p.y + 1)) > 1.4) continue;
      w.taken = true; this.power[w.kind] = POWER_TIME[w.kind]; this.emit('power', { kind: w.kind });
    }
    if (Math.floor(p.z / 20) !== Math.floor(prevZ / 20)) { this.track.ensure(p.z + 220); this.track.prune(p.z); }
  }

  takeEvents() { const e = this.events; this.events = []; return e; }
}

// ---------------------------------------------------------------- a bot that plays by the rules (tests + demo)
export function botStep(run) {
  const p = run.p; if (p.dead) return;
  const look = 6 + run.speed * 2.6;
  const blockedAhead = lane => {
    let d = Infinity;
    for (const t of run.track.things) {
      if (t.kind !== 'train' || t.lane !== lane) continue;
      const [a, b] = trainSpan(t, p.z);
      if (b < p.z - 0.5) continue;
      if (t.ramp && !t.speed && a > p.z + 1 && run.botRamps) continue;   // optionally run up it
      if (a <= p.z + 0.5 && b >= p.z - 0.5 && p.y >= TRAIN_H - 0.2 && lane === p.lane) continue; // already on top
      // an oncoming train closes the gap faster: measure it in "distance at our own speed"
      d = Math.min(d, Math.max(0, a - p.z) * (t.speed ? run.speed / (run.speed + t.speed) : 1));
    }
    return d;
  };
  const clear = LANES.map(l => blockedAhead(l));
  const here = clear[p.lane + 1];
  if (here < look && Math.abs(p.x - laneX(p.lane)) < 0.3) {
    // head for the clearest lane, crossing the middle one if it is free beside us
    let best = p.lane;
    for (const l of LANES) if (clear[l + 1] > clear[best + 1] || (clear[l + 1] === clear[best + 1] && Math.abs(l - p.lane) < Math.abs(best - p.lane))) best = l;
    const next = p.lane + Math.sign(best - p.lane);
    const hopSoon = run.track.things.some(t => t.kind !== 'train' && t.lane === next && t.z0 > p.z - 0.5 && t.z0 < p.z + run.speed * 0.25);
    const roomy = !hopSoon && (next === best || clear[next + 1] > run.speed * 0.5);
    if (best !== p.lane && roomy && !(run.trainAt(next, p.z) && p.y < run.surface(next, p.z) - 0.4)) { run.input(next < p.lane ? 'left' : 'right'); return; }
  }
  for (const t of run.track.things) {
    if (t.lane !== p.lane || t.kind === 'train') continue;
    const dz = t.z0 - p.z;
    if (dz < 0 || dz > 2.2 + run.speed * 0.06) continue;
    if (t.kind === 'hurdle' && run.surface(p.lane, t.z0) < 0.1) run.input('jump');
    if (t.kind === 'bar' && p.roll <= 0.05) run.input('roll');
  }
}
