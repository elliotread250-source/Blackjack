// Kart physics. Pure JS (no three.js) so bots can be simulated headless in tests.
// Handling follows the Apex GP model scaled down to karts: a single-track (bicycle) model with
// slip angles, a Pacejka-style lateral curve, tyre relaxation, a friction ellipse for combined
// braking/throttle + cornering, longitudinal load transfer, yaw inertia, a speed-sensitive
// steering limit and a kinematic blend at low speed. On top of that sit the arcade parts: hop +
// drift with mini-turbos (the drift drops rear grip and adds a controlled yaw bias so it is easy
// to hold), boosts, items, off-road and ice via surface grip.
// Fixed step (DT). Heading yaw: forward = (sin yaw, cos yaw); right = (-cos yaw, sin yaw);
// body frame: u = forward speed, w = leftward speed, r = yaw rate (+ = turning left).
import { SURF, SURF_PROPS } from './trackgen.js';
import { KART_BY_ID, BODY_META } from './data.js';

export const DT = 1 / 120;
export const G = 30;
export const DRIFT_STAGES = [1.0, 1.9, 3.0]; // charge needed for blue / orange / purple
export const MINI_TURBO = [0, 0.55, 1.0, 1.5]; // boost seconds per stage
const HOP_V = 5.4;
const PB = 18.5, PC = 1.45;
const pac = a => Math.sin(PC * Math.atan(PB * a));
export const PEAK_SLIP = Math.tan(Math.PI / (2 * PC)) / PB;
const HCG = 0.34;

export function kartParams(type) {
  const k = KART_BY_ID[type] || KART_BY_ID.standard;
  const st = k.stats;
  const wm = (BODY_META[k.id] || BODY_META.standard).wheels;
  const L = Math.max(1, wm.fl[2] - wm.bl[2]);
  const a = L * 0.53, b = L - a; // CG a little behind the middle
  return {
    vmax: 27.5 + st.speed * 1.8,
    accel: 8 + st.accel * 3.4,
    turn: 1.5 + st.handling * 0.16,          // drift yaw rate
    A: 46 + st.handling * 3.5,               // tyre grip as lateral acceleration (m/s^2) at nominal load
    lock: 0.4 + st.handling * 0.02,          // max wheel angle (rad) at low speed
    rearF: 1.26 - st.handling * 0.035,       // rear/front grip balance: lower = livelier tail
    Iz: a * b * (0.85 + st.weight * 0.1),    // yaw inertia per kg (radius of gyration^2)
    relax: 0.3 + st.weight * 0.03,           // tyre relaxation length (m)
    L, a, b,
    mass: k.mass,
    radius: k.radius,
    offroad: k.offroad,
    drift: k.drift,
  };
}

// Max wheel angle so full lock sits near the tyres' peak slip (keeps it calm at speed)
export function steerLimit(P, v) {
  const vv = Math.max(v, 1), k = (P.A * 0.93) / (vv * vv);
  return Math.min(P.lock, P.L * k + PEAK_SLIP * 1.1);
}

export function makeKart(type, spawn, opts = {}) {
  const k = {
    type, P: kartParams(type), id: opts.id ?? 0,
    x: spawn.x, y: spawn.y + 0.05, z: spawn.z, vx: 0, vy: 0, vz: 0, yaw: spawn.yaw, yawVel: 0,
    grounded: true, airT: 0, hint: -1, surf: SURF.ROAD, nx: 0, ny: 1, nz: 0,
    steer: 0, steerRaw: 0, aF: 0, aR: 0, axS: 0, slide: 0, drift: 0, driftT: 0, driftStage: 0, hopping: false, landT: 9, hopCD: 0, driftHeld: false,
    boostT: 0, boostKind: 0, spinT: 0, spinAng: 0, invulnT: 0, shieldT: 0,
    pitch: 0, roll: 0, speed: 0, vf: 0,
    s: 0, d: 0, sPrev: null, progress: spawn.s ?? 0, safeS: spawn.s ?? 0, safeD: spawn.d ?? 0,
    respawnT: 0, respawnPhase: 0, fallT: 0, stuckT: 0, wrongT: 0, wrongWay: false,
    speedScale: 1, onPad: false,
    in: { throttle: 0, steer: 0, analog: false, drift: false, hop: false, item: false, back: false },
    ev: [],
  };
  return k;
}

const fwdX = k => Math.sin(k.yaw), fwdZ = k => Math.cos(k.yaw);

export function startRespawn(k, reason = 'fall') {
  if (k.respawnT > 0) return;
  k.respawnT = 1.7;
  k.respawnPhase = 0;
  k.drift = 0; k.driftT = 0; k.driftStage = 0; k.boostT = 0; k.spinT = 0;
  k.ev.push({ type: 'respawn', reason });
}

function placeRespawn(k, tr) {
  let s = k.safeS - 6;
  // never put a kart down on a jump run-up: back off so there is room to get up to speed
  for (const r of tr.ramps) {
    let x = s - (r.lip - r.len - 8); if (x < -tr.L / 2) x += tr.L; if (x > tr.L / 2) x -= tr.L;
    if (x >= 0 && x <= r.len + 8 + r.gap + 4) s = r.lip - r.len - 30;
  }
  s = tr.wrapS(s);
  const f = tr.frame(s);
  const d = Math.max(-f.hw * 0.45, Math.min(f.hw * 0.45, k.safeD));
  const p = tr.pointAt(s, d);
  // move progress by the same amount (unwrapped)
  let dsd = s - k.s; if (dsd > tr.L / 2) dsd -= tr.L; if (dsd < -tr.L / 2) dsd += tr.L;
  k.progress += dsd;
  k.s = s; k.sPrev = s; k.d = d;
  k.x = p.x; k.z = p.z; k.y = p.y + 3.2;
  k.vx = k.vz = k.vy = 0; k.yawVel = 0; k.aF = 0; k.aR = 0; k.steerRaw = 0; k.steer = 0; k.axS = 0;
  k.yaw = Math.atan2(p.fx, p.fz);
  k.hint = tr.idx(s);
  k.grounded = false;
  k.groundY = p.y;
}

export function stepKart(k, tr, dt = DT) {
  const P = k.P, inp = k.in;
  k.hopCD -= dt; k.invulnT -= dt; k.landT += dt;
  if (k.shieldT > 0) k.shieldT -= dt;
  if (k.respawnT > 0) {
    k.respawnT -= dt;
    if (k.respawnPhase === 0 && k.respawnT <= 1.05) { placeRespawn(k, tr); k.respawnPhase = 1; }
    if (k.respawnPhase === 1) {
      // hang under the rescue drone, lowering to the road
      const target = k.groundY + 0.6 + Math.max(0, k.respawnT) * 2.4;
      k.y += (target - k.y) * Math.min(1, dt * 8);
      if (k.respawnT <= 0) { k.respawnT = 0; k.invulnT = 1.2; k.vy = 0; k.ev.push({ type: 'respawned' }); }
    }
    k.speed = 0; k.vf = 0;
    return;
  }
  const spun = k.spinT > 0;
  if (spun) { k.spinT -= dt; k.spinAng += dt * 13; } else k.spinAng = 0;
  const thr = spun ? 0 : inp.throttle;
  let fx = fwdX(k), fz = fwdZ(k), rx = -fz, rz = fx;
  // body-frame state from the world velocity (so wall bounces, bumps and hits count)
  let u = k.vx * fx + k.vz * fz, w = -(k.vx * rx + k.vz * rz), yr = k.yawVel;
  const v = Math.abs(u);

  // ---- steering input (Apex GP): keyboard ramps in at a rate that slows with speed, returns
  // to centre faster and counter-steers fastest, then a curved response; analog skips the ramp.
  const target = spun ? 0 : Math.max(-1, Math.min(1, inp.steer || 0));
  if (inp.analog) k.steerRaw += (target - k.steerRaw) * Math.min(1, dt * 12);
  else {
    const sr = k.steerRaw, speedK = 1 / (1 + v / 25);
    const rate = target === 0 ? 2.6 + 3 * speedK : (Math.sign(target) !== Math.sign(sr) && Math.abs(sr) > 0.05 ? 5 : 0.55 + 2.8 * speedK);
    k.steerRaw = sr + Math.max(-rate * dt, Math.min(rate * dt, target - sr));
  }
  const sa = Math.abs(k.steerRaw);
  k.steer = Math.sign(k.steerRaw) * (inp.analog ? sa : 0.35 * sa + 0.65 * sa * sa);

  const sp = SURF_PROPS[k.surf] || SURF_PROPS[0];
  // off-road slows you, less so for karts built for it and while boosting
  let pen = sp.off ? (1 - sp.speed) / P.offroad : 0;
  if (k.boostT > 0) pen *= 0.3;
  const vmax = P.vmax * (1 - pen) * k.speedScale;

  // ---- hop / drift
  if (inp.hop && k.grounded && !spun && k.hopCD <= 0) {
    k.vy = HOP_V; k.grounded = false; k.hopping = true; k.hopCD = 0.3;
    k.ev.push({ type: 'hop' });
  }
  const canDrift = !spun && u > 9;
  if (!k.drift && k.grounded && inp.drift && canDrift && Math.abs(k.steerRaw) > 0.3 && (k.landT < 0.22)) {
    k.drift = Math.sign(k.steerRaw); k.driftT = 0; k.driftStage = 0;
    k.ev.push({ type: 'driftStart', dir: k.drift });
  }
  if (k.drift) {
    if (!inp.drift || u < 6.5 || spun) {
      if (k.driftStage > 0 && !spun) {
        k.boostT = Math.max(k.boostT, MINI_TURBO[k.driftStage]);
        k.boostKind = k.driftStage;
        k.ev.push({ type: 'miniTurbo', stage: k.driftStage });
      }
      // settle the slide a little so the exit isn't a tank-slapper
      w *= 0.6; k.aR *= 0.5;
      k.drift = 0; k.driftT = 0; k.driftStage = 0;
    } else if (k.grounded) {
      const into = k.steer * k.drift;
      k.driftT += dt * (0.7 + 0.6 * Math.max(0, into)) * P.drift;
      const st = k.driftT >= DRIFT_STAGES[2] ? 3 : k.driftT >= DRIFT_STAGES[1] ? 2 : k.driftT >= DRIFT_STAGES[0] ? 1 : 0;
      if (st > k.driftStage) { k.driftStage = st; k.ev.push({ type: 'driftStage', stage: st }); }
    }
  }

  // ---- longitudinal requests: tyre force (drive/brake) and direct terms (drag, limiter, boost)
  let axT = 0, axD = 0;
  if (k.boostT > 0 && thr < 0) axT = -20 * -thr;
  else if (k.boostT > 0) {
    const bmax = P.vmax * 1.3 * (1 - pen) * Math.max(1, k.speedScale);
    axD = u < bmax ? Math.min(40, (bmax - u) / dt) : (bmax - u) * 1.4;
  } else if (thr > 0) {
    if (u < vmax) axT = P.accel * thr * (1 - 0.62 * Math.max(0, u) / vmax);
    else axD = (vmax - u) * 1.4;
  } else if (thr < 0) {
    if (u > 0.5) axT = -28 * -thr;
    else if (u > -P.vmax * 0.3) axT = -13 * -thr;
  } else {
    axD = -Math.sign(u) * Math.min(Math.abs(u) / dt, 5.5);
    if (u > vmax) axD = (vmax - u) * 1.4;
  }
  if (k.boostT > 0) { k.boostT -= dt; if (k.boostT <= 0) { k.boostT = 0; k.boostKind = 0; } }

  let nu = u, nw = w, nr = yr;
  if (k.grounded) {
    // ---- per-axle surface grip (front and rear axle may be on different surfaces)
    const iH = k.hint >= 0 ? k.hint : 0;
    const side = fx * tr.RX[iH] + fz * tr.RZ[iH];
    const sF = tr.surfaceAt(iH, 0, k.s, k.d + P.a * side), sR = tr.surfaceAt(iH, 0, k.s, k.d - P.b * side);
    let muF = (SURF_PROPS[sF] || SURF_PROPS[0]).grip, muR = (SURF_PROPS[sR] || SURF_PROPS[0]).grip;
    if (spun) { muF *= 0.3; muR *= 0.3; }
    // ---- loads with longitudinal transfer (braking loads the front: sharper turn-in)
    // (from the driver's requested accel, smoothed: a slide's own scrub must not feed back into it)
    k.axS += (axT + axD - k.axS) * Math.min(1, dt * 10);
    const tr_ = Math.max(-0.09, Math.min(0.09, (k.axS * HCG) / (P.L * G)));
    const nf = Math.max(0.15, P.b / P.L - tr_), nrr = Math.max(0.15, P.a / P.L + tr_);
    const capF = P.A * nf * muF;
    let capR = P.A * nrr * muR * P.rearF;
    if (k.drift) capR *= 0.5; // the drift: the rear lets go
    // ---- steering angle and slip angles (with tyre relaxation)
    const delta = -k.steer * steerLimit(P, v) * (inp.analog ? 1.1 : 1); // + = left
    const sgn = u >= 0 ? 1 : -1, ua = Math.max(v, 1.5);
    const aF0 = Math.atan2(w + P.a * yr, ua) - delta * sgn, aR0 = Math.atan2(w - P.b * yr, ua);
    const relax = Math.min(1, (Math.max(v, 3) * dt) / P.relax);
    k.aF += (aF0 - k.aF) * relax; k.aR += (aR0 - k.aR) * relax;
    const fy0F = capF * pac(k.aF), fy0R = capR * pac(k.aR);
    const cd = Math.cos(delta), sd = Math.sin(delta);
    const vLatF = (w + P.a * yr) * cd - u * sd, vLatR = w - P.b * yr;
    let FxF = 0, FxR = 0;
    if (axT >= 0) FxR = axT; else { FxF = axT * 0.6; FxR = axT * 0.4; }
    // friction ellipse: if the axle is asked for more than it has, it slides
    const axle = (Fxd, cap, fy0, vLat, mA) => {
      let Fx = Fxd, Fy = -fy0;
      if (Math.abs(Fxd) > cap) { Fx = Math.sign(Fxd) * cap * 0.85; Fy = -fy0 * 0.35; }
      else { const hh = Math.hypot(Fx, Fy); if (hh > cap) { const q = cap / hh; Fx *= q; Fy *= q; } }
      const lim = (mA * Math.abs(vLat)) / dt; if (Math.abs(Fy) > lim) Fy = Math.sign(Fy) * lim;
      return [Fx, Fy];
    };
    const [fxF, fyF] = axle(FxF, capF, fy0F, vLatF, (P.b / P.L) * 0.9);
    const [fxR, fyR] = axle(FxR, capR, fy0R, vLatR, (P.a / P.L) * 0.9);
    k.slide = Math.max(0, Math.abs(k.aR) - PEAK_SLIP * 1.3) + Math.max(0, Math.abs(k.aF) - PEAK_SLIP * 1.3);
    const FX = fxF * cd - fyF * sd + fxR + axD;
    const FY = fxF * sd + fyF * cd + fyR;
    const MZ = P.a * (fxF * sd + fyF * cd) - P.b * fyR;
    nu = u + (FX + w * yr) * dt;
    nw = w + (FY - u * yr) * dt;
    nr = Math.max(-6, Math.min(6, yr + (MZ / P.Iz) * dt));
    { const spd = Math.max(Math.hypot(u, w), 3); if (Math.abs(nw) > spd) nw = Math.sign(nw) * spd; }
    // stop cleanly instead of oscillating around zero
    if (axT < 0 && u > 0 && nu < 0 && thr < 0) nu = 0;
    if (thr === 0 && u > 0 && nu < 0) nu = 0;
    // low speed: blend to the kinematic model (the tyre model is singular at standstill)
    const kb = Math.max(0, Math.min(1, (Math.abs(nu) - 1.5) / 3));
    if (kb < 1) { const rk = (nu * Math.tan(delta)) / P.L; nr = rk + (nr - rk) * kb; nw = rk * P.b + (nw - rk * P.b) * kb; }
    // ---- stability: never yaw faster than the tyres can carry, so steering alone can't spin you
    if (!k.drift && !spun && v > 8) {
      const rmax = (P.A * Math.min(muF, muR) * 0.86) / v;
      if (Math.abs(nr) > rmax) nr = Math.sign(nr) * rmax;
    }
    // ---- drift: controlled yaw bias + body slip so the slide is easy to hold and steer within
    if (k.drift && !spun) {
      // the drift is driven by the arcade controller (it replaces the tyre yaw/lateral response):
      // steer into the drift for a tighter arc, away from it to open it up
      const into = k.steer * k.drift;
      const rT = -k.drift * P.turn * (0.6 + 0.5 * into) * Math.min(1, v / 10);
      nr = yr + (rT - yr) * (1 - Math.exp(-dt * 8));
      const spd0 = Math.hypot(u, w);
      const spd = Math.max(0, spd0 + (Math.max(0, axT) + axD) * dt - 0.8 * dt);
      const beta = 0.3 + 0.12 * into;
      const wT = k.drift * spd * Math.sin(beta);
      nw = w + (wT - w) * (1 - Math.exp(-dt * 4));
      if (Math.abs(nw) > spd * 0.95) nw = Math.sign(nw) * spd * 0.95;
      nu = Math.sqrt(Math.max(0, spd * spd - nw * nw)) * (u < 0 ? -1 : 1);
    }
    if (spun) nu *= Math.exp(-2.2 * dt);
    // gravity along slopes
    nu += G * (k.nx * fx + k.nz * fz) * 0.55 * dt;
    nw -= G * (k.nx * rx + k.nz * rz) * 0.35 * dt;
    // sliding never beats driving straight
    const cap = (k.boostT > 0 ? P.vmax * 1.32 : Math.max(vmax, P.vmax * 0.5)) * 1.02;
    const hs = Math.hypot(nu, nw);
    if (hs > cap) { const f = cap / hs + (1 - cap / hs) * Math.exp(-3 * dt); nu *= f; nw *= f; }
  } else {
    // airborne: a little air control, momentum carries
    nu = u + axD * dt * 0.5;
    nw = w * Math.exp(-0.6 * dt);
    nr += (-k.steer * P.turn * 0.55 - nr) * Math.min(1, dt * 4);
    k.slide = 0;
  }
  if (spun) nr = 0;
  k.yawVel = nr;
  k.yaw += nr * dt;
  if (k.yaw > Math.PI) k.yaw -= Math.PI * 2; else if (k.yaw < -Math.PI) k.yaw += Math.PI * 2;
  fx = fwdX(k); fz = fwdZ(k); rx = -fz; rz = fx;
  k.vx = nu * fx - nw * rx;
  k.vz = nu * fz - nw * rz;
  let vf = nu;

  // ---- move
  const prevY = k.y;
  k.x += k.vx * dt;
  k.z += k.vz * dt;
  let g = tr.ground(k.x, k.z, k.hint);
  k.hint = g.i;

  // ---- walls (lateral corridor bounds, dividers)
  const b = tr.bounds(g.i, g.t, g.s, g.d);
  const r = P.radius * 0.72;
  let push = 0;
  if (g.d < b.lo + r && b.wallLo) push = b.lo + r - g.d;
  else if (g.d > b.hi - r && b.wallHi) push = b.hi - r - g.d;
  if (push && k.y < g.base + 6) {
    k.x += g.rx * push; k.z += g.rz * push;
    const nx = g.rx * Math.sign(push), nz = g.rz * Math.sign(push);
    const vn = k.vx * nx + k.vz * nz;
    if (vn < 0) {
      const imp = -vn;
      k.vx -= 1.3 * vn * nx; k.vz -= 1.3 * vn * nz;
      const fr = 1 - Math.min(0.45, imp * 0.025);
      k.vx *= fr; k.vz *= fr;
      if (imp > 2.5) k.ev.push({ type: 'wall', impact: imp, x: k.x - nx * r, y: k.y + 0.4, z: k.z - nz * r });
      if (imp > 9 && k.drift) { k.drift = 0; k.driftT = 0; k.driftStage = 0; }
      if (imp > 5) k.yawVel *= 0.6;
    }
    g = tr.ground(k.x, k.z, k.hint);
    k.hint = g.i;
  }
  // round obstacles
  for (const o of tr.obstacles) {
    const dx = k.x - o.x, dz = k.z - o.z, rr = o.r + P.radius * 0.8;
    const d2 = dx * dx + dz * dz;
    if (d2 < rr * rr && Math.abs(k.y - o.y) < 4) {
      const dd = Math.sqrt(d2) || 1, nx = dx / dd, nz = dz / dd;
      k.x = o.x + nx * rr; k.z = o.z + nz * rr;
      const vn = k.vx * nx + k.vz * nz;
      if (vn < 0) { k.vx -= 1.4 * vn * nx; k.vz -= 1.4 * vn * nz; k.vx *= 0.8; k.vz *= 0.8; if (-vn > 2.5) k.ev.push({ type: 'wall', impact: -vn, x: k.x - nx * 1, y: k.y + 0.4, z: k.z - nz * 1 }); }
    }
  }

  // ---- vertical
  if (k.grounded) {
    const yPred = k.y + k.vy * dt;
    if (g.h < yPred - 0.3) {
      k.grounded = false; k.airT = 0;
    } else {
      k.y = g.h;
      k.vy = Math.max(-20, Math.min(20, (k.y - prevY) / dt));
    }
  }
  if (!k.grounded) {
    k.airT += dt;
    k.vy -= G * dt;
    k.y += k.vy * dt;
    if (k.y <= g.h && g.surf !== SURF.VOID) {
      const impact = -k.vy;
      k.y = g.h; k.vy = 0; k.grounded = true;
      if (k.hopping) { k.hopping = false; k.landT = 0; }
      if (k.airT > 0.45) k.ev.push({ type: 'land', impact });
      k.airT = 0;
    }
  }
  k.surf = g.surf;
  k.nx += (g.nx - k.nx) * Math.min(1, dt * 14); k.ny += (g.ny - k.ny) * Math.min(1, dt * 14); k.nz += (g.nz - k.nz) * Math.min(1, dt * 14);

  // ---- track position / progress
  if (k.sPrev === null) k.sPrev = g.s;
  let dsd = g.s - k.sPrev; if (dsd > tr.L / 2) dsd -= tr.L; if (dsd < -tr.L / 2) dsd += tr.L;
  k.progress += dsd; k.sPrev = g.s; k.s = g.s; k.d = g.d;
  if (k.grounded && Math.abs(g.d) < g.hw && !tr.inPit(g.s) && g.surf !== SURF.LAVA) { k.safeS = g.s; k.safeD = g.d; }

  // boost pads
  k.onPad = false;
  if (k.grounded) {
    for (const p of tr.pads) {
      let ds = g.s - p.s; if (ds > tr.L / 2) ds -= tr.L; if (ds < -tr.L / 2) ds += tr.L;
      if (Math.abs(ds) < p.len / 2 && Math.abs(g.d - p.d) < p.w / 2 + 0.4) {
        k.onPad = true;
        if (k.boostT < 0.9) k.ev.push({ type: 'pad' });
        k.boostT = Math.max(k.boostT, 1.15); k.boostKind = Math.max(k.boostKind, 2);
      }
    }
  }

  // deaths
  if (k.grounded && g.surf === SURF.LAVA) startRespawn(k, 'lava');
  else if (k.y < g.base - 10) startRespawn(k, 'fall');

  // wrong way + stuck
  const ff = fwdX(k) * g.fx + fwdZ(k) * g.fz;
  const spd = Math.hypot(k.vx, k.vz);
  if (ff < -0.35 && spd > 2) k.wrongT += dt; else k.wrongT = Math.max(0, k.wrongT - dt * 2);
  k.wrongWay = k.wrongT > 1.1;
  if (thr > 0.5 && spd < 1.5 && k.grounded && !spun) k.stuckT += dt; else k.stuckT = Math.max(0, k.stuckT - dt * 2);

  k.speed = spd * (vf < 0 ? -1 : 1);
  k.vf = vf;
  // visual attitude
  const pitch = Math.asin(Math.max(-0.6, Math.min(0.6, k.nx * fx + k.nz * fz)));
  const roll = Math.asin(Math.max(-0.6, Math.min(0.6, k.nx * rx + k.nz * rz))) + k.yawVel * Math.min(1, spd / 25) * 0.05;
  k.pitch += ((k.grounded ? pitch : Math.max(-0.35, Math.min(0.35, -k.vy * 0.02))) - k.pitch) * Math.min(1, dt * 10);
  k.roll += (roll - k.roll) * Math.min(1, dt * 10);
}

// Spin out (banana / shell). Returns false if a shield absorbed it.
export function hitKart(k, kind = 'shell') {
  if (k.respawnT > 0 || k.invulnT > 0) return false;
  if (k.shieldT > 0) { k.shieldT = 0; k.ev.push({ type: 'shieldPop' }); k.invulnT = 0.4; return false; }
  const heavy = k.P.mass > 1.3;
  k.spinT = kind === 'banana' ? (heavy ? 0.8 : 1.0) : (heavy ? 1.0 : 1.25);
  k.drift = 0; k.driftT = 0; k.driftStage = 0; k.boostT = 0;
  const keep = kind === 'shell' ? 0.25 : 0.4;
  k.vx *= keep; k.vz *= keep;
  if (kind === 'shell') { k.vy = 5; k.grounded = false; }
  k.invulnT = k.spinT + 0.6;
  k.ev.push({ type: 'spun', kind });
  return true;
}

// Kart vs kart bumps. `local(k)` says whether we own that kart's physics (online, remote karts
// are moved by their own client; we only push our own).
export function collideKarts(karts, local = () => true) {
  for (let a = 0; a < karts.length; a++) {
    const A = karts[a];
    if (A.respawnT > 0 || A.gone) continue;
    for (let b = a + 1; b < karts.length; b++) {
      const B = karts[b];
      if (B.respawnT > 0 || B.gone) continue;
      const dx = B.x - A.x, dz = B.z - A.z, dy = B.y - A.y;
      const rr = (A.P.radius + B.P.radius) * 0.82;
      const d2 = dx * dx + dz * dz;
      if (d2 > rr * rr || Math.abs(dy) > 1.8) continue;
      const d = Math.sqrt(d2) || 0.01, nx = dx / d, nz = dz / d, over = rr - d;
      const la = local(A), lb = local(B);
      const ma = A.P.mass * (A.boostT > 0 ? 1.25 : 1), mb = B.P.mass * (B.boostT > 0 ? 1.25 : 1);
      const wa = lb ? mb / (ma + mb) : 1, wb = la ? ma / (ma + mb) : 1;
      if (la) { A.x -= nx * over * wa; A.z -= nz * over * wa; }
      if (lb) { B.x += nx * over * wb; B.z += nz * over * wb; }
      const vrel = (B.vx - A.vx) * nx + (B.vz - A.vz) * nz;
      if (vrel < 0) {
        const j = (-(1 + 0.55) * vrel) / (1 / ma + 1 / mb);
        if (la) { A.vx -= (j / ma) * nx; A.vz -= (j / ma) * nz; }
        if (lb) { B.vx += (j / mb) * nx; B.vz += (j / mb) * nz; }
        if (-vrel > 3) {
          const ev = { type: 'bump', impact: -vrel, x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 + 0.5, z: (A.z + B.z) / 2 };
          if (la) A.ev.push(ev); else if (lb) B.ev.push(ev);
        }
      }
    }
  }
}
