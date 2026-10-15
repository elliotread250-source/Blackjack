// Bot drivers: pure pursuit along the track's racing line with per-bot offsets, braking from
// curvature ahead, drifting through long bends, shortcut lanes, item use and recovery.
import { DIFFICULTY } from './data.js';
import { startRespawn, steerLimit } from './physics.js';

let botSeed = 1;
function rnd(b) { b._r = (b._r * 16807) % 2147483647; return (b._r - 1) / 2147483646; }

export class Bot {
  constructor(k, race, traits = {}) {
    this.k = k;
    this.race = race;
    const diff = DIFFICULTY[race.difficulty] || DIFFICULTY.normal;
    this.diff = diff;
    this._r = (traits.seed || botSeed++ * 7919 + 13) % 2147483646 + 1;
    this.skill = traits.skill ?? Math.max(0.3, Math.min(1, diff.skill + (rnd(this) - 0.5) * 0.2));
    this.offset = (rnd(this) - 0.5) * 3.2;
    this.lanes = rnd(this) < this.skill * 0.75;
    this.itemTimer = 1 + rnd(this) * 2;
    this.reverseT = 0;
    this.stuckT = 0;
    this.drifting = false;
    this.dodge = 0;
    this.speedBase = traits.speed ?? diff.speed * (0.97 + rnd(this) * 0.05);
    k.speedScale = this.speedBase;
  }
  preStart() {
    // good bots nail the rocket start sometimes
    const k = this.k;
    k.in.throttle = this.race.time > -0.75 && rnd(this) < this.skill ? 1 : 0;
  }
}

function angleTo(k, x, z) {
  const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
  const dx = x - k.x, dz = z - k.z;
  const r = dx * -fz + dz * fx, f = dx * fx + dz * fz;
  return Math.atan2(r, f); // + = target is to the right
}

export function botThink(b, race, dt) {
  const k = b.k, tr = race.track, inp = k.in;
  inp.hop = false;
  if (k.respawnT > 0) { inp.throttle = 0; inp.steer = 0; inp.drift = false; inp.item = false; return; }
  const v = Math.max(6, k.vf);
  // ---- where to aim
  const look = 6 + v * 0.42;
  const sT = k.s + look;
  const iT = tr.idx(sT);
  const hwT = tr.HW[iT];
  let dT = tr.RL[iT] * (0.55 + 0.45 * b.skill) + b.offset * (1 - Math.abs(tr.RL[iT]) / hwT);
  // shortcut lanes: hug that side of the road, slip in where the lane opens, follow it through
  if (b.lanes) {
    for (const dv of tr.dividers) {
      const open = dv.s0 - 18;
      let rel = k.s - open; if (rel > tr.L / 2) rel -= tr.L; if (rel < -tr.L / 2) rel += tr.L;
      const span = dv.s1 - open;
      if (rel < -70 || rel > span + 4) continue;
      if (b.skipLane === dv && rel < span) continue;
      b.skipLane = null;
      const edge = dv.side * (tr.HW[iT] - 1.4);
      if (rel < -8) {
        if (Math.abs(k.d - edge) > -rel * 0.45 + 3) { b.skipLane = dv; continue; }
        dT = edge;
      } else {
        // divider already alongside and we're on the road side of it: missed the entry
        let past = k.s - (dv.s0 - 2); if (past > tr.L / 2) past -= tr.L; if (past < -tr.L / 2) past += tr.L;
        if (past > 0 && past < dv.s1 - dv.s0 && k.d * dv.side < tr.HW[k.hint] + dv.div * 0.5) { b.skipLane = dv; continue; }
        const want = dv.side * (tr.HW[iT] + dv.div + dv.w / 2);
        const bb = tr.bounds(iT, 0, tr.S[iT], want);
        dT = dv.side > 0 ? Math.min(want, bb.hi - 2) : Math.max(want, bb.lo + 2);
      }
      b.inLane = true;
    }
  }
  // dodge karts and bananas ahead
  let dodge = 0;
  for (const o of race.karts) {
    if (o === k || o.gone || o.respawnT > 0) continue;
    let ds = o.s - k.s; if (ds < -tr.L / 2) ds += tr.L; if (ds > tr.L / 2) ds -= tr.L;
    if (ds > 0 && ds < 11 && Math.abs(o.d - k.d) < 2.6) dodge += (k.d >= o.d ? 1 : -1) * (1 - ds / 11) * 2.6;
  }
  for (const n of race.bananas) {
    const g = n.hint >= 0 ? n : null;
    if (!g) continue;
    const dx = n.x - k.x, dz = n.z - k.z;
    const fwd = dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw);
    if (fwd > 0 && fwd < 26) {
      const lat = dx * -Math.cos(k.yaw) + dz * Math.sin(k.yaw);
      if (Math.abs(lat) < 2.4 && rnd(b) < 0.5 + b.skill * 0.5) dodge += (lat > 0 ? -1 : 1) * 2.8;
    }
  }
  b.dodge += (dodge - b.dodge) * Math.min(1, dt * 4);
  dT += b.dodge;
  // stay well away from lava and open cliff edges
  const deadly = side => { const sf = side > 0 ? tr.SOR[iT] : tr.SOL[iT]; return sf === 5 || !(side > 0 ? tr.WR[iT] : tr.WL[iT]); };
  const bndL = Math.max(1.5, hwT - (deadly(-1) ? 3.2 : 1.8)), bndR = Math.max(1.5, hwT - (deadly(1) ? 3.2 : 1.8));
  if (!b.inLane) dT = Math.max(-bndL, Math.min(bndR, dT));
  b.inLane = false;
  const p = tr.pointAt(sT, dT);
  // pure pursuit relative to where the kart is actually going (it may be sliding)
  const spd = Math.hypot(k.vx, k.vz);
  let hx = Math.sin(k.yaw), hz = Math.cos(k.yaw);
  if (spd > 5 && k.vf > 0) { hx = k.vx / spd; hz = k.vz / spd; }
  const dx = p.x - k.x, dz = p.z - k.z, dist = Math.hypot(dx, dz) || 1;
  const ang = Math.atan2(dx * -hz + dz * hx, dx * hx + dz * hz); // + = target to the right
  const kap = (2 * Math.sin(ang)) / dist; // path curvature to reach the target
  const vv = Math.max(4, Math.abs(k.vf));
  const turn0 = k.P.turn;
  let steer;
  if (k.drift) {
    const into = (vv * kap / (k.drift * turn0 * Math.min(1, vv / 10)) - 0.6) / 0.5;
    steer = Math.max(-1, Math.min(1, into * k.drift));
    if (into < -1.6) b.wantRelease = true;
  } else {
    // wheel angle for that curvature (bicycle model) plus yaw-rate damping, as a fraction of lock
    const lim = steerLimit(k.P, vv) * 1.1;
    const deltaR = Math.atan(k.P.L * kap) * 1.08;
    const rDes = -vv * kap;
    steer = Math.max(-1, Math.min(1, (deltaR + 0.05 * (k.yawVel - rDes)) / lim + ang * 0.35));
    if (k.vf < 2 && Math.abs(ang) > 1.2) steer = Math.sign(ang);
  }
  // emergency: about to slide into lava or off an edge
  const iK = k.hint >= 0 ? k.hint : iT;
  const sideK = k.d > 0 ? 1 : -1;
  const probe = tr.surfaceAt(iK, 0, k.s, k.d + sideK * (1.6 + Math.abs(k.vx * tr.RX[iK] + k.vz * tr.RZ[iK]) * 0.25));
  if ((probe === 5 || probe === 7) && !tr.inPit(k.s) && k.grounded) {
    steer = -sideK; if (k.drift) b.wantRelease = true;
  }

  // ---- speed control from curvature ahead
  let throttle = 1;
  let maxK = 0, sumK = 0;
  for (let a = 4; a <= 70; a += 6) {
    const ia = tr.idx(k.s + a);
    // racing-line curvature, but never much less than the centre line's: in hairpins the kart rarely holds the ideal line
    const kk = Math.max(Math.abs(tr.RLK[ia]), Math.abs(tr.K[ia]) * 0.75) * (tr.RLK[ia] < 0 ? -1 : 1);
    if (Math.abs(kk) > Math.abs(maxK)) maxK = kk;
    if (a < 40) sumK += kk;
    // corner speed from the tyres' lateral grip
    const vc = Math.sqrt((k.P.A * 0.8 * (0.75 + 0.25 * b.skill)) / Math.max(1e-3, Math.abs(kk)));
    const allow = Math.sqrt(vc * vc + 2 * 18 * a);
    if (k.vf > allow + 1.5) throttle = k.vf > allow + 5 ? -1 : 0;
  }
  // ---- drift through long bends
  const bend = Math.abs(sumK) * 6; // radians of turning over the next ~40 m
  if (!b.drifting && b.skill > 0.45 && k.grounded && k.vf > 16 && bend > 0.55 && Math.abs(maxK) > 1 / 70 && !k.drift && k.spinT <= 0) {
    b.drifting = true; b.driftDir = Math.sign(sumK); b.driftWant = b.skill > 0.9 ? 3 : b.skill > 0.65 ? 2 : 1;
    inp.hop = true;
  }
  if (b.drifting) {
    inp.drift = true;
    // hold the steer into the corner until airborne hop lands
    if (!k.drift) steer = b.driftDir;
    const done = b.wantRelease || (k.drift && k.driftStage >= b.driftWant) || (k.drift && bend < 0.2) || k.spinT > 0 || k.vf < 8 || (k.drift && k.drift !== b.driftDir);
    b.wantRelease = false;
    if (done || (!k.drift && k.landT > 0.4 && k.grounded)) { b.drifting = false; inp.drift = false; }
  } else inp.drift = false;

  // ---- items
  b.itemTimer -= dt;
  inp.item = false;
  inp.back = false;
  if (k.item && k.rollT <= 0 && b.itemTimer <= 0) {
    b.itemTimer = 0.3;
    const u = rnd(b);
    const items = b.diff.items;
    if (k.item === 'boost') {
      if (Math.abs(sumK) < 0.15 || (k.surf !== 0 && k.surf !== 4)) { if (u < 0.5 * items + 0.1) inp.item = true; }
    } else if (k.item === 'shield') {
      const threat = race.shells.some(s => s.owner !== k.meta.id && Math.hypot(s.x - k.x, s.z - k.z) < 30);
      if (threat || u < 0.03) inp.item = true;
    } else if (k.item === 'banana') {
      const behind = race.karts.some(o => o !== k && !o.gone && ((k.s - o.s + tr.L) % tr.L) < 18 && ((k.s - o.s + tr.L) % tr.L) > 2);
      if ((behind && u < 0.6 * items + 0.2) || u < 0.02) inp.item = true;
    } else if (k.item === 'shell') {
      let target = false;
      for (const o of race.karts) {
        if (o === k || o.gone || o.respawnT > 0) continue;
        const dx = o.x - k.x, dz = o.z - k.z, dist = Math.hypot(dx, dz);
        if (dist < 45 && dist > 3 && Math.abs(angleTo(k, o.x, o.z)) < 0.13) target = true;
      }
      if ((target && u < 0.7 * items + 0.2) || u < 0.015) inp.item = true;
    }
  }

  // ---- recovery
  if (k.stuckT > 0.9 && b.reverseT <= 0) { b.reverseT = 0.9; b.revSteer = -Math.sign(steer || 1); }
  if (b.reverseT > 0) {
    b.reverseT -= dt;
    throttle = -1; steer = b.revSteer; inp.drift = false; b.drifting = false;
  }
  // no forward progress for a while (wedged, lost, going round in circles): rescue
  b.progT = (b.progT || 0) + dt;
  if (b.progT > 3) { if (k.progress - (b.progAt ?? -1e9) < 12) b.noProg = (b.noProg || 0) + 1; else b.noProg = 0; b.progAt = k.progress; b.progT = 0; }
  if (k.stuckT > 4 || (k.wrongWay && k.wrongT > 5) || b.noProg >= 2) { startRespawn(k, 'stuck'); k.stuckT = 0; k.wrongT = 0; b.noProg = 0; b.skipLane = null; }

  // ---- rubber banding against the human leader (single player only)
  const ref = race.refKart;
  if (ref && !ref.gone && b.diff.rubber) {
    const gap = (ref.progress - k.progress) / 120;
    k.speedScale = b.speedBase * (1 + b.diff.rubber * Math.max(-1, Math.min(1, gap)));
  }
  inp.throttle = throttle;
  inp.steer = steer;
  inp.analog = true;
}
