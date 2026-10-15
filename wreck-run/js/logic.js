// Wreck Run rules: the town, the car, smashing things, combos, drifts, ramps, pickups, people and
// animals (who can never be hurt: bumping one stops you dead and costs points) and the clock.
// No three.js here, so the Node tests can drive whole runs.
//
// Coordinates: x across, z along, y up. Roads run along x and z on a grid every PITCH metres.

export const N = 6, PITCH = 46, ROAD = 12, WALK = 3.5, SIZE = N * PITCH;
export const RUN_TIME = 120, COMBO_TIME = 3, MAX_COMBO = 10;
export const CAR_R = 1.5, MAX_SPEED = 34, BOOST_SPEED = 48;
export const RAMP_LEN = 7, RAMP_H = 2.2, GRAVITY = 30;

export class Rng {
  constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
  next() { let t = (this.s = (this.s + 0x6d2b79f5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  chance(p) { return this.next() < p; }
  pick(a) { return a[Math.floor(this.next() * a.length)]; }
}

// Everything you can smash: points, collision radius, and how much it slows you down.
export const SMASH = {
  cone:      { pts: 10, r: 0.4, mass: 0.2 },
  barrel:    { pts: 15, r: 0.5, mass: 0.6 },
  trashcan:  { pts: 15, r: 0.5, mass: 0.5 },
  mailbox:   { pts: 20, r: 0.45, mass: 0.6 },
  hydrant:   { pts: 25, r: 0.4, mass: 0.8 },
  newsbox:   { pts: 15, r: 0.45, mass: 0.5 },
  meter:     { pts: 15, r: 0.3, mass: 0.4 },
  bench:     { pts: 20, r: 0.9, mass: 0.8 },
  sign:      { pts: 20, r: 0.35, mass: 0.4 },
  planter:   { pts: 20, r: 0.6, mass: 0.7 },
  crate:     { pts: 15, r: 0.55, mass: 0.5 },
  vending:   { pts: 50, r: 0.7, mass: 1.6 },
  phonebooth:{ pts: 60, r: 0.7, mass: 1.8 },
  fruitstand:{ pts: 50, r: 1.2, mass: 1.2 },
  gnome:     { pts: 30, r: 0.35, mass: 0.2 },
  snowman:   { pts: 40, r: 0.7, mass: 0.5 },
  beachball: { pts: 10, r: 0.5, mass: 0.05 },
  haybale:   { pts: 20, r: 0.8, mass: 0.8 },
  pumpkin:   { pts: 15, r: 0.5, mass: 0.3 },
  pinata:    { pts: 80, r: 0.6, mass: 0.2 },
  flamingo:  { pts: 25, r: 0.3, mass: 0.1 },
  dino:      { pts: 75, r: 1.4, mass: 0.3 },
  statue:    { pts: 100, r: 0.9, mass: 2.0 },
  donut:     { pts: 150, r: 1.3, mass: 1.2 },
  tv:        { pts: 40, r: 0.5, mass: 0.4 },
  piano:     { pts: 120, r: 1.1, mass: 2.2 },
};
const SIDEWALK_KINDS = ['mailbox', 'trashcan', 'hydrant', 'newsbox', 'meter', 'bench', 'sign', 'planter', 'vending', 'phonebooth', 'trashcan', 'meter', 'tv'];
const PARK_KINDS = ['gnome', 'snowman', 'beachball', 'haybale', 'pumpkin', 'pinata', 'flamingo', 'dino', 'fruitstand', 'bench', 'crate'];
export const PEOPLE = ['walker', 'cyclist', 'skater'];
export const ANIMALS = ['dog', 'cat', 'duck', 'rabbit'];
export const PENALTY = 250;

const roadLines = () => Array.from({ length: N + 1 }, (_, k) => k * PITCH);
// The rectangle inside the sidewalks for block (i, j).
export function lotRect(i, j) {
  const m = ROAD / 2 + WALK;
  return { x0: i * PITCH + m, z0: j * PITCH + m, x1: (i + 1) * PITCH - m, z1: (j + 1) * PITCH - m };
}

// ---------------------------------------------------------------- the town
export function makeCity(seed = 1) {
  const r = new Rng(seed);
  const C = { seed, blocks: [], buildings: [], posts: [], smash: [], ramps: [], pickups: [], agents: [], seq: 0 };
  const add = (kind, x, z, extra = {}) => C.smash.push({ id: ++C.seq, kind, x, z, rot: r.range(0, 6.28), broken: false, at: 0, ...extra });
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const L = lotRect(i, j);
    const centre = (i === 2 || i === 3) && (j === 2 || j === 3);
    const type = centre && i === 2 && j === 2 ? 'plaza' : r.chance(0.2) ? 'park' : r.chance(0.12) ? 'plaza' : 'buildings';
    C.blocks.push({ i, j, type, ...L });
    if (type === 'buildings') {
      // split the lot into 1-4 buildings with alleys between
      const splitX = r.chance(0.6), splitZ = r.chance(0.6);
      const xs = splitX ? [L.x0, (L.x0 + L.x1) / 2 + r.range(-4, 4), L.x1] : [L.x0, L.x1];
      const zs = splitZ ? [L.z0, (L.z0 + L.z1) / 2 + r.range(-4, 4), L.z1] : [L.z0, L.z1];
      for (let a = 0; a < xs.length - 1; a++) for (let b = 0; b < zs.length - 1; b++) {
        const g = 1.2;
        C.buildings.push({ x0: xs[a] + (a ? g : 0), z0: zs[b] + (b ? g : 0), x1: xs[a + 1] - (a < xs.length - 2 ? g : 0), z1: zs[b + 1] - (b < zs.length - 2 ? g : 0),
          h: r.range(8, 30) * (centre ? 1.4 : 1), style: r.int(0, 5), shop: r.chance(0.5) });
      }
    } else if (type === 'park') {
      for (let k = 0; k < 7; k++) C.posts.push({ x: r.range(L.x0 + 3, L.x1 - 3), z: r.range(L.z0 + 3, L.z1 - 3), r: 0.6, kind: 'tree', s: r.range(0.8, 1.3) });
      for (let k = 0; k < 9; k++) {
        const x = r.range(L.x0 + 2, L.x1 - 2), z = r.range(L.z0 + 2, L.z1 - 2);
        if (C.posts.some(p => Math.hypot(p.x - x, p.z - z) < 3)) continue;
        add(r.pick(PARK_KINDS), x, z);
      }
      for (let k = 0; k < 3; k++) C.agents.push(animal(r, r.pick(ANIMALS), L));
    } else {
      // plaza: a statue, a donut-shop sign, a ramp across the middle and some crates
      add('statue', (L.x0 + L.x1) / 2, (L.z0 + L.z1) / 2 - 7);
      add('donut', L.x0 + 4, L.z1 - 4);
      for (let k = 0; k < 6; k++) add(r.pick(['crate', 'barrel', 'cone', 'piano', 'tv']), r.range(L.x0 + 2, L.x1 - 2), r.range(L.z0 + 2, L.z0 + 8));
      C.ramps.push({ x: (L.x0 + L.x1) / 2, z: (L.z0 + L.z1) / 2 + 3, dir: r.chance(0.5) ? 0 : Math.PI / 2 });
    }
    // sidewalk furniture all round the block, people walking the sidewalk loop
    const s0 = { x0: L.x0 - WALK, z0: L.z0 - WALK, x1: L.x1 + WALK, z1: L.z1 + WALK };
    const per = 2 * (s0.x1 - s0.x0 + s0.z1 - s0.z0);
    for (let d = r.range(2, 8); d < per; d += r.range(7, 13)) {
      const p = loopPoint(s0, d, WALK * 0.5);
      add(r.pick(SIDEWALK_KINDS), p.x, p.z, { rot: p.ang });
    }
    for (let k = 0; k < 2; k++) C.agents.push({ kind: r.chance(0.2) ? 'skater' : 'walker', block: s0, d: r.range(0, per), per, speed: r.range(1.2, 1.8) * (r.chance(0.5) ? 1 : -1), x: 0, z: 0, ang: 0, dodge: 0, startle: 0, look: r.int(0, 5) });
  }
  // lamp posts at the corners, cones and barrels at some crossroads
  for (const x of roadLines()) for (const z of roadLines()) {
    for (const [dx, dz] of [[1, 1], [-1, -1]]) {
      const px = x + dx * (ROAD / 2 + 0.6), pz = z + dz * (ROAD / 2 + 0.6);
      if (px > 0 && px < SIZE && pz > 0 && pz < SIZE) C.posts.push({ x: px, z: pz, r: 0.25, kind: 'lamp' });
    }
    if (x > 0 && x < SIZE && z > 0 && z < SIZE && r.chance(0.45)) for (let k = 0; k < 5; k++) add(r.chance(0.7) ? 'cone' : 'barrel', x + r.range(-4, 4), z + r.range(-4, 4));
  }
  // cyclists ride up and down the roads
  for (let k = 0; k < 10; k++) {
    const along = r.chance(0.5), line = r.int(0, N) * PITCH, lane = (r.chance(0.5) ? 1 : -1) * 3.6;
    C.agents.push({ kind: 'cyclist', along, line: Math.max(4, Math.min(SIZE - 4, line + lane)), d: r.range(5, SIZE - 5), speed: r.range(4, 6) * (r.chance(0.5) ? 1 : -1), x: 0, z: 0, ang: 0, dodge: 0, startle: 0, look: r.int(0, 5) });
  }
  // stars, clocks and nitro along the roads
  for (let k = 0; k < 40; k++) {
    const along = r.chance(0.5), line = r.int(0, N) * PITCH, d = r.range(8, SIZE - 8);
    const kind = k < 22 ? 'star' : k < 32 ? 'clock' : 'nitro';
    C.pickups.push({ id: ++C.seq, kind, x: along ? d : line, z: along ? line : d, taken: 0 });
  }
  for (const a of C.agents) moveAgent(a, 0);
  return C;
}
function animal(r, kind, L) {
  return { kind, area: L, x: r.range(L.x0 + 2, L.x1 - 2), z: r.range(L.z0 + 2, L.z1 - 2), tx: 0, tz: 0, wait: 0, speed: kind === 'duck' ? 0.9 : kind === 'rabbit' ? 2.2 : 1.6, ang: 0, dodge: 0, startle: 0, look: r.int(0, 5) };
}
// A point `d` metres round the inside of rectangle R, `inset` in from its edge.
export function loopPoint(R, d, inset) {
  const w = R.x1 - R.x0, h = R.z1 - R.z0, per = 2 * (w + h);
  d = ((d % per) + per) % per;
  if (d < w) return { x: R.x0 + d, z: R.z0 + inset, ang: Math.PI / 2 };
  if ((d -= w) < h) return { x: R.x1 - inset, z: R.z0 + d, ang: 0 };
  if ((d -= h) < w) return { x: R.x1 - d, z: R.z1 - inset, ang: -Math.PI / 2 };
  d -= w; return { x: R.x0 + inset, z: R.z1 - d, ang: Math.PI };
}

function moveAgent(a, dt, rnd = Math.random) {
  if (a.startle > 0) a.startle -= dt;
  let x, z, ang;
  if (a.block) { a.d += a.speed * dt; const p = loopPoint(a.block, a.d, WALK * 0.5 + (a.speed > 0 ? 0.6 : -0.6)); x = p.x; z = p.z; ang = p.ang + (a.speed < 0 ? Math.PI : 0); }
  else if (a.line !== undefined) {
    a.d += a.speed * dt;
    if (a.d < 4 || a.d > SIZE - 4) { a.speed = -a.speed; a.d = Math.max(4, Math.min(SIZE - 4, a.d)); }
    x = a.along ? a.d : a.line; z = a.along ? a.line : a.d;
    ang = a.along ? (a.speed > 0 ? Math.PI / 2 : -Math.PI / 2) : (a.speed > 0 ? 0 : Math.PI);
  } else {
    // animals potter about their park
    if (a.wait > 0) a.wait -= dt;
    else {
      const dx = a.tx - a.x, dz = a.tz - a.z, dist = Math.hypot(dx, dz);
      if (dist < 0.3 || !a.tx) { a.tx = a.area.x0 + 2 + rnd() * (a.area.x1 - a.area.x0 - 4); a.tz = a.area.z0 + 2 + rnd() * (a.area.z1 - a.area.z0 - 4); a.wait = rnd() * 2; }
      else { a.x += dx / dist * a.speed * dt; a.z += dz / dist * a.speed * dt; a.ang = Math.atan2(dx, dz); }
    }
    x = a.x; z = a.z; ang = a.ang;
  }
  // sidestep: people and animals shuffle out of your way, then drift back
  a.dodge *= Math.exp(-dt * 1.5);
  a.x = x + Math.cos(ang) * a.dodge; a.z = z - Math.sin(ang) * a.dodge; a.ang = ang;
}

// ---------------------------------------------------------------- a run
export class Run {
  constructor(seed = (Math.random() * 2 ** 31) | 0, rnd = Math.random) {
    this.city = makeCity(seed); this.rnd = rnd;
    this.car = { x: 2 * PITCH, z: 2 * PITCH - 14, h: 0, vx: 0, vz: 0, y: 0, vy: 0, air: false, airT: 0, nitro: 1, drift: 0, driftPts: 0, steerVis: 0, onRamp: null };
    this.t = 0; this.timeLeft = RUN_TIME; this.score = 0; this.combo = 0; this.comboT = 0; this.smashed = 0; this.penalties = 0;
    this.over = false; this.events = [];
  }
  emit(type, d = {}) { this.events.push({ type, ...d }); }
  takeEvents() { const e = this.events; this.events = []; return e; }
  get speed() { return Math.hypot(this.car.vx, this.car.vz); }
  add(pts, label, x, z) { const p = Math.round(pts); this.score += p; this.emit('points', { pts: p, label, x, z }); }

  step(dt, inp = {}) {
    if (this.over) return;
    this.t += dt; this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.timeLeft = 0; this.endDrift(); this.over = true; this.emit('over'); return; }
    const c = this.car, throttle = inp.throttle || 0, steer = inp.steer || 0, hand = !!inp.handbrake;
    const fx = Math.sin(c.h), fz = Math.cos(c.h);
    let vf = c.vx * fx + c.vz * fz, vr = 0;
    const boosting = inp.boost && c.nitro > 0.01 && !c.air;
    if (!c.air) {
      // engine and brakes push along the way the car points
      let acc = throttle > 0 ? 24 * throttle : throttle < 0 ? (vf > 0.5 ? 42 * throttle : 14 * throttle) : -Math.sign(vf) * Math.min(Math.abs(vf) / dt, 5);
      if (boosting) { acc += 32; c.nitro = Math.max(0, c.nitro - dt * 0.33); this.emit('boost'); }
      if (hand) acc -= Math.sign(vf) * 6;
      const cap = boosting ? BOOST_SPEED : Math.max(MAX_SPEED, vf - 20 * dt);
      const nvf = Math.max(-12, Math.min(cap, vf + acc * dt));
      c.vx += fx * (nvf - vf); c.vz += fz * (nvf - vf);
      // steering turns the car; the velocity lags behind, which is what makes it slide
      const turn = steer * 2.5 * Math.min(1, Math.abs(nvf) / 7) * Math.sign(nvf || 1) * (hand ? 1.1 : 1) / (1 + Math.abs(nvf) / 60);
      c.h += turn * dt;
      const nfx = Math.sin(c.h), nfz = Math.cos(c.h), nrx = Math.cos(c.h), nrz = -Math.sin(c.h);
      vf = c.vx * nfx + c.vz * nfz; vr = c.vx * nrx + c.vz * nrz;
      vr *= Math.exp(-dt * (hand ? 1.8 : 7));            // tyre grip: strong normally, weak on the handbrake
      if (!hand && Math.abs(vr) > 1) vf -= Math.sign(vf) * Math.abs(vr) * dt * 0.5;   // scrubbing speed in a slide
      c.vx = nfx * vf + nrx * vr; c.vz = nfz * vf + nrz * vr;
    }
    c.nitro = Math.min(1, c.nitro + dt * 0.03);
    c.x += c.vx * dt; c.z += c.vz * dt;
    c.steerVis = steer;
    // drifting earns points while you hold the slide
    const sliding = !c.air && Math.abs(vr) > 3.5 && Math.hypot(vf, vr) > 10;
    if (sliding) { c.drift += dt; c.driftPts += Math.abs(vr) * dt * 14; }
    else if (c.drift > 0) this.endDrift();
    this.ramps(dt, vf);
    this.collide();
    this.smashing();
    this.people(dt);
    this.pickups();
    if (this.combo && (this.comboT -= dt) <= 0) { this.combo = 0; this.emit('comboEnd'); }
    for (const s of this.city.smash) if (s.broken && this.t - s.at > 45 && Math.hypot(s.x - c.x, s.z - c.z) > 40) { s.broken = false; this.emit('respawn', { id: s.id }); }
  }

  endDrift() {
    const c = this.car;
    if (c.drift > 0.45 && c.driftPts > 5) this.add(c.driftPts, c.drift > 2.5 ? 'Mega drift!' : 'Drift', c.x, c.z);
    c.drift = 0; c.driftPts = 0;
  }

  ramps(dt, vf) {
    const c = this.car;
    if (c.air) {
      c.vy -= GRAVITY * dt; c.y += c.vy * dt; c.airT += dt;
      if (c.y <= 0) {
        c.y = 0; c.air = false;
        if (c.airT > 0.35) this.add(c.airT * 350, c.airT > 1.2 ? 'Huge air!' : 'Air time', c.x, c.z);
        this.emit('land', { hard: c.airT > 0.8 }); c.airT = 0;
      }
      return;
    }
    let on = null;
    for (const rp of this.city.ramps) {
      const ax = Math.sin(rp.dir), az = Math.cos(rp.dir);
      const dx = c.x - rp.x, dz = c.z - rp.z;
      const along = dx * ax + dz * az, side = dx * az - dz * ax;
      if (Math.abs(side) < 2.4 && along > -RAMP_LEN / 2 && along < RAMP_LEN / 2) on = { rp, along, ax, az };
    }
    if (on) {
      const up = (c.vx * on.ax + c.vz * on.az) > 0;      // driving up the slope (either end works: it's a double ramp)
      const t = up ? (on.along + RAMP_LEN / 2) / RAMP_LEN : (RAMP_LEN / 2 - on.along) / RAMP_LEN;
      c.y = RAMP_H * Math.min(1, t * 2) * (t < 0.5 ? 1 : 1);
      c.onRamp = on;
    } else if (c.onRamp) {
      const sp = this.speed;
      if (sp > 10) { c.air = true; c.vy = sp * 0.42; c.airT = 0; this.emit('jump'); }
      else c.y = 0;
      c.onRamp = null;
    } else c.y = 0;
  }

  collide() {
    const c = this.car;
    if (c.air && c.y > 3) return;
    const hit = (nx, nz, pen) => {
      c.x += nx * pen; c.z += nz * pen;
      const vn = c.vx * nx + c.vz * nz;
      if (vn < 0) {
        c.vx -= 1.35 * vn * nx; c.vz -= 1.35 * vn * nz; c.vx *= 0.8; c.vz *= 0.8;
        if (vn < -6) { this.emit('crash', { x: c.x, z: c.z, hard: vn < -18 }); this.endDrift(); }
      }
    };
    for (const b of this.city.buildings) {
      const qx = Math.max(b.x0, Math.min(b.x1, c.x)), qz = Math.max(b.z0, Math.min(b.z1, c.z));
      const dx = c.x - qx, dz = c.z - qz, d = Math.hypot(dx, dz);
      if (d >= CAR_R) continue;
      if (d > 1e-6) hit(dx / d, dz / d, CAR_R - d);
      else { // inside: push out the shortest way
        const opts = [[c.x - b.x0, -1, 0], [b.x1 - c.x, 1, 0], [c.z - b.z0, 0, -1], [b.z1 - c.z, 0, 1]].sort((a, b2) => a[0] - b2[0]);
        hit(opts[0][1], opts[0][2], opts[0][0] + CAR_R);
      }
    }
    for (const p of this.city.posts) {
      const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz);
      if (d < CAR_R + p.r && d > 1e-6) hit(dx / d, dz / d, CAR_R + p.r - d);
    }
    // the edge of town
    if (c.x < CAR_R) hit(1, 0, CAR_R - c.x); if (c.x > SIZE - CAR_R) hit(-1, 0, c.x - SIZE + CAR_R);
    if (c.z < CAR_R) hit(0, 1, CAR_R - c.z); if (c.z > SIZE - CAR_R) hit(0, -1, c.z - SIZE + CAR_R);
  }

  smashing() {
    const c = this.car;
    for (const s of this.city.smash) {
      if (s.broken) continue;
      const def = SMASH[s.kind], dx = s.x - c.x, dz = s.z - c.z;
      if (dx * dx + dz * dz > (CAR_R + def.r) ** 2 || c.y > 2.5) continue;
      s.broken = true; s.at = this.t;
      this.combo = Math.min(MAX_COMBO, this.combo + 1); this.comboT = COMBO_TIME; this.smashed++;
      const speedBonus = 1 + Math.min(1, this.speed / MAX_SPEED);
      this.add(def.pts * this.combo * speedBonus, null, s.x, s.z);
      const keep = Math.max(0.55, 1 - def.mass * 0.06);
      c.vx *= keep; c.vz *= keep;
      this.emit('smash', { id: s.id, kind: s.kind, x: s.x, z: s.z, vx: c.vx, vz: c.vz, combo: this.combo });
    }
  }

  people(dt) {
    const c = this.car, sp = this.speed;
    for (const a of this.city.agents) {
      moveAgent(a, dt, this.rnd);
      const dx = a.x - c.x, dz = a.z - c.z, d = Math.hypot(dx, dz);
      // they see you coming and hop aside
      if (d < 7 && sp > 4 && (c.vx * dx + c.vz * dz) > 0 && Math.abs(a.dodge) < 1.6) a.dodge += Math.sign((-c.vz * dx + c.vx * dz) || 1) * dt * 6;
      if (d < CAR_R + 0.5 && !c.air) {
        // never hurt: the car stops dead, you lose points, they get a fright
        if (a.startle <= 0) {
          this.add(-PENALTY, ANIMALS.includes(a.kind) ? 'Watch the animals!' : 'Careful! −' + PENALTY, a.x, a.z);
          this.penalties++; this.combo = 0; a.startle = 2;
          this.emit('oops', { kind: a.kind, x: a.x, z: a.z });
        }
        const nx = -dx / (d || 1), nz = -dz / (d || 1);
        c.x += nx * (CAR_R + 0.5 - d); c.z += nz * (CAR_R + 0.5 - d);
        c.vx *= 0.05; c.vz *= 0.05;
        this.endDrift();
      }
    }
  }

  pickups() {
    const c = this.car;
    for (const p of this.city.pickups) {
      if (p.taken && this.t - p.taken > 30) p.taken = 0;
      if (p.taken || Math.hypot(p.x - c.x, p.z - c.z) > 2.2 || c.y > 3) continue;
      p.taken = this.t || 0.001;
      if (p.kind === 'star') this.add(500, 'Star!', p.x, p.z);
      if (p.kind === 'clock') { this.timeLeft += 8; this.emit('clock'); }
      if (p.kind === 'nitro') { c.nitro = Math.min(1, c.nitro + 0.6); this.emit('nitro'); }
      this.emit('pickup', { kind: p.kind, id: p.id });
    }
  }
}

// A simple driver for the tests and the attract mode: cruise the roads, turn at crossroads.
export function botInput(run, rnd = Math.random) {
  const c = run.car;
  const nearest = v => Math.round(v / PITCH) * PITCH;
  const onX = Math.abs(c.z - nearest(c.z)) < ROAD / 2, onZ = Math.abs(c.x - nearest(c.x)) < ROAD / 2;
  if (!run.botTarget || Math.hypot(run.botTarget.x - c.x, run.botTarget.z - c.z) < 5) {
    const gx = nearest(c.x), gz = nearest(c.z), opts = [];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = gx + dx * PITCH, z = gz + dz * PITCH; if (x >= 0 && x <= SIZE && z >= 0 && z <= SIZE) opts.push({ x, z }); }
    run.botTarget = opts[Math.floor(rnd() * opts.length)];
    void onX; void onZ;
  }
  const want = Math.atan2(run.botTarget.x - c.x, run.botTarget.z - c.z);
  let diff = want - c.h; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const close = run.city.agents.some(a => Math.hypot(a.x - c.x, a.z - c.z) < 6);
  return { throttle: close ? -0.4 : Math.abs(diff) > 0.8 ? 0.3 : 0.8, steer: Math.max(-1, Math.min(1, diff * 2)), handbrake: false, boost: false };
}
