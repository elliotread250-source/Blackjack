// Level 5 (the Act 3 style nightmare house): the tram that loops round the house, the three Fear
// rooms that hand out powers, the mannequins that only move when you are not looking at them, the
// all-seeing Eye guarding the fuse, and the giant wardrobe in front of the basement door.
// Pure JS like world.js; World calls these hooks when its level has an `act3` block.
import { makeBox, boxesOverlap, pointInBox, angleWrap, clamp } from './geom.js';
import { lineOfSight } from './perception.js';

export const POWERS = {
  invis: { name: 'Invisibility', how: 'Crouch to turn invisible: nobody can see you.' },
  push: { name: 'Push', how: 'Press R (or the Push button) to shove him away.' },
  double: { name: 'Double jump', how: 'Press jump again in mid-air to jump higher.' },
};
export const TRAM_MAX = 8;          // m/s when you drive
const TRAM_AUTO = 7;                // m/s when it comes to you
const MANNEQUIN_SPEED = { market: 2.7, school: 3.1 };

// ------------------------------------------------------------------ the track
// A closed loop of [x, z] points; returns arc-length helpers.
export function makeLoop(pts) {
  const seg = [];
  let len = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    seg.push({ a, b, s0: len, l });
    len += l;
  }
  const wrap = s => ((s % len) + len) % len;
  const at = s => {
    s = wrap(s);
    let lo = 0, hi = seg.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (seg[m].s0 <= s) lo = m; else hi = m - 1; }
    const g = seg[lo], t = g.l ? (s - g.s0) / g.l : 0;
    const x = g.a[0] + (g.b[0] - g.a[0]) * t, z = g.a[1] + (g.b[1] - g.a[1]) * t;
    // heading: yaw 0 looks toward -z (same as the player)
    const yaw = Math.atan2(-(g.b[0] - g.a[0]), -(g.b[1] - g.a[1]));
    return { x, z, yaw };
  };
  const project = (x, z) => {
    let best = 0, bd = Infinity;
    for (const g of seg) {
      const dx = g.b[0] - g.a[0], dz = g.b[1] - g.a[1];
      const t = g.l ? clamp(((x - g.a[0]) * dx + (z - g.a[1]) * dz) / (g.l * g.l), 0, 1) : 0;
      const d = Math.hypot(g.a[0] + dx * t - x, g.a[1] + dz * t - z);
      if (d < bd) { bd = d; best = g.s0 + t * g.l; }
    }
    return best;
  };
  // signed shortest way round from a to b
  const delta = (a, b) => { let d = wrap(b - a); if (d > len / 2) d -= len; return d; };
  return { pts, len, at, wrap, project, delta };
}

// Rounded rectangle loop through the corners [x0,z0]-[x1,z1].
export function roundedLoop(x0, z0, x1, z1, r, n = 6) {
  const pts = [];
  const corner = (cx, cz, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  // counter-clockwise seen from above (x right, z down the screen)
  corner(x1 - r, z1 - r, 0);
  corner(x0 + r, z1 - r, Math.PI / 2);
  corner(x0 + r, z0 + r, Math.PI);
  corner(x1 - r, z0 + r, Math.PI * 1.5);
  return pts;
}

// ------------------------------------------------------------------ setup
export function initAct3(W) {
  const A = W.level.act3;
  const loop = makeLoop(A.tram.pts);
  const stations = A.tram.stations.map(s => Object.assign({}, s, { s: loop.project(s.at[0], s.at[1]) }));
  const home = stations.find(s => s.id === A.tram.start);
  W.a3 = {
    loop, stations,
    powers: { invis: false, push: false, double: false },
    tram: { s: home.s, v: 0, on: false, lever: false, auto: null, riding: false },
    groceries: 0, bell: false, giantDown: false, giantT: -1, closetLight: false, blocker: false, blockerT: -1,
    eyeT: 0, eyeCool: 0, pushCd: 0, usedDouble: false, zone: null, rewardT: -1, reward: null,
    gadgets: A.gadgets.map(g => Object.assign({}, g, { box: makeBox(g.x - g.hx, g.y - g.hy, g.z - g.hz, g.x + g.hx, g.y + g.hy, g.z + g.hz) })),
    mannequins: A.mannequins.map(m => Object.assign({}, m, { hx: m.x, hz: m.z, yaw0: m.yaw || 0, yaw: m.yaw || 0, moving: false, walkT: 0 })),
  };
  W.a3.gadgetById = Object.fromEntries(W.a3.gadgets.map(g => [g.id, g]));
  const b = A.blocker;
  W.a3.blockerBox = makeBox(b.x0, b.y0, b.z0, b.x1, b.y1, b.z1);
  W.a3.blockerBox.op = true; W.a3.blockerBox.col = true;
}

export const zoneAt = (W, x, y, z) => {
  for (const id in W.level.act3.zones) if (pointInBox(W.level.act3.zones[id].box, x, y, z)) return id;
  return null;
};

// solid things that come and go: the wardrobe in front of the basement door
export function act3Dyn(W, dyn, op) {
  if (!W.a3.blocker) { dyn.push(W.a3.blockerBox); op.push(W.a3.blockerBox); }
}

export function tramPose(W, s = W.a3.tram.s) {
  const p = W.a3.loop.at(s);
  return { x: p.x, y: W.level.act3.tram.y, z: p.z, yaw: p.yaw };
}
export function dockedAt(W) {
  const t = W.a3.tram;
  if (Math.abs(t.v) > 0.3 || t.auto) return null;
  return W.a3.stations.find(st => Math.abs(W.a3.loop.delta(t.s, st.s)) < 0.6) || null;
}

// ------------------------------------------------------------------ look + use
export function act3Look(W, test) {
  for (const g of W.a3.gadgets) test(g.box, 'gadget', g, 0.3);
  if (!W.a3.blocker) test(W.a3.blockerBox, 'gadget', { id: 'blocker', kind: 'blocker' }, 0.3);
}

export function act3Hint(W, g) {
  const A = W.a3, P = A.powers, t = A.tram;
  switch (g.kind) {
    case 'fear': return P[g.power] ? { act: 'none', text: g.name + ': you already have ' + POWERS[g.power].name.toLowerCase() } : { act: 'use', text: 'Open the ' + g.name };
    case 'leave': return { act: 'use', text: 'Give up and go back to the house' };
    case 'checkout': return A.groceries >= 5 ? { act: 'use', text: 'Pay at the checkout' } : { act: 'none', text: `Checkout: ${A.groceries}/5 groceries in your trolley` };
    case 'bell': return A.bell ? { act: 'none', text: 'The bell has rung. Class is in.' } : { act: 'use', text: 'Ring the school bell' };
    case 'giant': return A.giantDown ? { act: 'none', text: 'Knocked over.' } : A.bell ? { act: 'use', text: 'Push the giant mannequin over' } : { act: 'none', text: 'The giant mannequin. Ring the school bell first.' };
    case 'switch': return A.closetLight ? { act: 'none', text: 'The light is on.' } : { act: 'use', text: 'Pull the light switch' };
    case 'lever': return t.lever ? { act: 'none', text: 'Lever pulled. Now the red button.' } : W.flags.power ? { act: 'use', text: 'Pull the tram lever' } : { act: 'none', text: 'Tram lever: no power. The fuse box is empty.' };
    case 'button': return t.on ? { act: 'none', text: 'The tram is running.' } : t.lever ? { act: 'use', text: 'Press the big red button' } : { act: 'none', text: 'Red button: pull the lever first.' };
    case 'tramcall': {
      if (!t.on) return { act: 'none', text: g.name + ': the tram is switched off (control room).' };
      const d = dockedAt(W);
      if (d && d.id === g.station) return { act: 'use', text: 'Board the tram' };
      return t.auto ? { act: 'none', text: 'The tram is on its way…' } : { act: 'use', text: 'Call the tram to ' + g.name };
    }
    case 'blocker': return P.push ? { act: 'use', text: 'Shove the giant wardrobe over (R)' } : { act: 'none', text: 'A giant wardrobe blocks the basement door. You need more strength.' };
  }
  return null;
}

export function act3Use(W, g) {
  const A = W.a3, L = W.level.act3, t = A.tram;
  switch (g.kind) {
    case 'fear': {
      if (A.powers[g.power]) { W.say('You already beat this fear.'); return; }
      const z = L.zones[g.zone];
      resetZone(W, g.zone);
      teleport(W, z.start);
      W.emit('portal', { zone: g.zone });
      W.say(z.intro, 'step');
      return;
    }
    case 'leave': {
      const z = L.zones[g.zone];
      teleport(W, z.back);
      W.emit('portal', { zone: null });
      return;
    }
    case 'checkout':
      if (A.groceries >= 5) grant(W, 'invis', 'market');
      else W.say(`Your trolley has ${A.groceries} of the 5 groceries on the list.`);
      return;
    case 'bell':
      if (A.bell) return;
      A.bell = true; W.emit('bell'); W.markStep('bell');
      W.say('RIIING! The mannequins freeze at their desks. Now push the giant one over.', 'good');
      return;
    case 'giant':
      if (A.giantDown) return;
      if (!A.bell) { W.say('It looms over you. Ring the bell first.'); return; }
      A.giantDown = true; A.giantT = 0; W.emit('topple', { what: 'giant' });
      grant(W, 'push', 'school');
      return;
    case 'switch':
      if (A.closetLight) return;
      A.closetLight = true; W.emit('click');
      grant(W, 'double', 'closet');
      return;
    case 'lever':
      if (t.lever) return;
      if (!W.flags.power) { W.say('Nothing happens. The control room has no power: find the fuse.'); W.emit('locked-gadget'); return; }
      t.lever = true; W.emit('lever'); W.markStep('lever'); W.say('Clunk. The lever is down. Now press the red button.', 'good');
      return;
    case 'button':
      if (t.on) return;
      if (!t.lever) { W.say('Nothing. Pull the lever first.'); W.emit('locked-gadget'); return; }
      t.on = true; W.emit('tram-on'); W.markStep('tram');
      W.say('The tram hums into life! It is waiting at the Depot (out the upside-down door on this floor).', 'good');
      return;
    case 'tramcall': {
      if (!t.on) { W.say('The tram is switched off. Its controls are in the control room.'); return; }
      const st = A.stations.find(s => s.id === g.station);
      const d = dockedAt(W);
      if (d && d.id === st.id) { board(W); return; }
      if (!t.auto) { t.auto = st.id; W.emit('tram-call'); W.say('Ding! The tram is coming to ' + st.name + '.'); }
      return;
    }
    case 'blocker':
      if (A.powers.push) push(W, true); else W.say('It will not budge. You need a stronger push.');
      return;
  }
}

function teleport(W, s) {
  const p = W.player;
  Object.assign(p, { x: s.x, y: s.y, z: s.z, yaw: s.yaw ?? p.yaw, pitch: 0, vx: 0, vy: 0, vz: 0, onGround: true, fallFrom: s.y, hiding: null, vault: null, charging: false, charge: 0 });
  W.a3.tram.riding = false;
  W.dirty = true;
}

function resetZone(W, zone) {
  for (const m of W.a3.mannequins) if (m.zone === zone) { m.x = m.hx; m.z = m.hz; m.yaw = m.yaw0; m.moving = false; }
}

function grant(W, power, zone) {
  const A = W.a3;
  if (A.powers[power]) return;
  A.powers[power] = true;
  W.markStep('power_' + power);
  W.emit('power-up', { power });
  W.say(`New power: ${POWERS[power].name}! ${POWERS[power].how}`, 'good');
  A.rewardT = 2.2; A.reward = zone;
  W.dirty = true;
}

function board(W) {
  const t = W.a3.tram, p = W.player;
  t.riding = true; t.v = 0; t.auto = null;
  p.vx = p.vz = p.vy = 0; p.crouch = false; p.hiding = null; p.charging = false;
  W.emit('tram-board');
  W.say('All aboard! W / S (or the stick) to drive, E at a station to get off.', 'step');
  placeRider(W);
}
function placeRider(W) {
  const pose = tramPose(W), p = W.player;
  // the driver's seat is near the front of the car
  const f = 1.6;
  p.x = pose.x - Math.sin(pose.yaw) * f; p.z = pose.z - Math.cos(pose.yaw) * f; p.y = pose.y + 0.05;
  p.onGround = true; p.fallFrom = p.y;
}

// ------------------------------------------------------------------ push
export function push(W, fromUse = false) {
  const A = W.a3, p = W.player;
  if (!A.powers.push || A.pushCd > 0 || p.hiding || A.tram.riding) return false;
  A.pushCd = 1.2;
  W.emit('push');
  const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
  let hit = false;
  // the wardrobe
  if (!A.blocker) {
    const b = A.blockerBox, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz);
    if (d < 2.6 && Math.abs(b.y0 - p.y) < 1 && (dx * fx + dz * fz) / (d || 1) > 0.3) {
      A.blocker = true; A.blockerT = 0; hit = true;
      W.emit('topple', { what: 'blocker', x: cx, y: b.y0 + 1, z: cz });
      W.noise(cx, b.y0, cz, 16, 'crash', true);
      W.markStep('blocker');
      W.say('CRASH! The wardrobe topples over. The basement door is clear.', 'good');
      W.dirty = true;
    }
  }
  // him
  const a = W.ai, dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz);
  if (d < 3.4 && Math.abs(a.y - p.y) < 1.5 && (dx * fx + dz * fz) / (d || 1) > 0.4 && a.state !== 'grab') {
    const k = 2.8 / (d || 1);
    const nx = a.x + dx / (d || 1) * 2.8, nz = a.z + dz / (d || 1) * 2.8;
    // slide him back as far as the walls allow
    let tx = a.x, tz = a.z;
    for (let i = 1; i <= 8; i++) {
      const u = i / 8, x = a.x + (nx - a.x) * u, z = a.z + (nz - a.z) * u;
      const box = { x0: x - 0.3, x1: x + 0.3, y0: a.y + 0.3, y1: a.y + 1.8, z0: z - 0.3, z1: z + 0.3 };
      const near = []; W.solidsNear(box.x0, box.z0, box.x1, box.z1, near, false);
      if (near.some(o => boxesOverlap(box, o, 0.001))) break;
      tx = x; tz = z;
    }
    void k;
    a.x = tx; a.z = tz; a.path = []; a.pathI = 0;
    a.hit([p.x, p.y, p.z]); a.stunT = 2.6;
    W.emit('bonk', { x: a.x, y: a.y + 1.5, z: a.z });
    W.say('SHOVE! He staggers back.', 'good');
    hit = true;
  }
  if (!hit && fromUse) W.say('Push!');
  return hit;
}

// ------------------------------------------------------------------ per step
export function act3Step(W, dt, inp) {
  const A = W.a3, L = W.level.act3, p = W.player;
  if (A.pushCd > 0) A.pushCd -= dt;
  if (inp.push) push(W);
  if (A.giantT >= 0) A.giantT += dt;
  if (A.blockerT >= 0) A.blockerT += dt;
  A.zone = zoneAt(W, p.x, p.y + 0.5, p.z);
  // after winning a Fear room, wake back up in front of its door
  if (A.rewardT > 0) {
    A.rewardT -= dt;
    if (A.rewardT <= 0) {
      const z = L.zones[A.reward];
      if (A.zone === A.reward) { teleport(W, z.back); W.emit('portal', { zone: null }); }
      A.reward = null;
    }
  }
  stepTram(W, dt, inp);
  if (!p.caught) { stepMannequins(W, dt); stepEye(W, dt); }
}

// Driving: called from World.updatePlayer instead of walking while you ride.
export function rideStep(W, dt, inp) {
  const A = W.a3, t = A.tram, p = W.player;
  p.yaw = angleWrap(p.yaw - (inp.lookX || 0));
  p.pitch = clamp(p.pitch - (inp.lookY || 0), -1.45, 1.45);
  const pose = tramPose(W);
  // W drives the way the tram's nose points
  const want = clamp(inp.mz || 0, -1, 1) * TRAM_MAX;
  const acc = Math.abs(want) < Math.abs(t.v) ? 6 : 3.5;
  t.v += clamp(want - t.v, -acc * dt, acc * dt);
  if (Math.abs(t.v) < 0.02 && !want) t.v = 0;
  void pose;
  t.s = A.loop.wrap(t.s + t.v * dt);
  placeRider(W);
  p.speed = 0; p.crouch = false; p.height = 1.75;
  const near = A.stations.find(st => Math.abs(A.loop.delta(t.s, st.s)) < 3);
  t.near = near ? near.id : null;
  if (inp.interact) {
    if (near && Math.abs(t.v) < 1.6) {
      t.v = 0; t.s = near.s; t.riding = false;
      teleport(W, near.exit);
      W.emit('tram-off');
      W.say(near.name + '.', 'step');
    } else W.say(near ? 'Slow down to get off.' : 'Stop at a station to get off.');
  }
}

function stepTram(W, dt) {
  const A = W.a3, t = A.tram;
  if (!t.on || t.riding || !t.auto) return;
  const st = A.stations.find(s => s.id === t.auto);
  const d = A.loop.delta(t.s, st.s);
  const sp = Math.min(TRAM_AUTO, Math.sqrt(Math.abs(d) * 4) + 0.2);
  t.v = Math.sign(d) * sp;
  if (Math.abs(d) <= sp * dt + 0.01) { t.s = st.s; t.v = 0; t.auto = null; W.emit('tram-arrive'); W.say('The tram has arrived at ' + st.name + '.'); }
  else t.s = A.loop.wrap(t.s + t.v * dt);
}

// Mannequins move only while you are not looking at them, and only toward someone they can see.
function stepMannequins(W, dt) {
  const A = W.a3, p = W.player, L = W.level.act3;
  const [ex, ey, ez] = W.eye(), [vx, vy, vz] = W.viewDir();
  for (const m of A.mannequins) {
    m.moving = false;
    if (m.zone !== A.zone) continue;
    if (m.zone === 'school' && A.bell) continue;
    const hy = m.y + 1.6;
    const dx = m.x - ex, dz = m.z - ez, dy = hy - 0.4 - ey, d = Math.hypot(dx, dy, dz);
    const losYou = lineOfSight(W.hash, W.dynOpaque, m.x, hy, m.z, p.x, p.y + p.height * 0.6, p.z);
    const watched = !p.hiding && d > 0.01 && (dx * vx + dy * vy + dz * vz) / d > Math.cos(0.62) && losYou;
    if (watched) continue;
    const hidden = p.hiding || (m.zone === 'market' && p.crouch) || (A.powers.invis && p.crouch);
    const dist = Math.hypot(p.x - m.x, p.z - m.z);
    let tx, tz, sp;
    if (!hidden && losYou && dist < 18 && Math.abs(p.y - m.y) < 2) { tx = p.x; tz = p.z; sp = MANNEQUIN_SPEED[m.zone] || 2.6; }
    else if (Math.hypot(m.hx - m.x, m.hz - m.z) > 0.3) { tx = m.hx; tz = m.hz; sp = 1.3; }
    else continue;
    const ddx = tx - m.x, ddz = tz - m.z, dl = Math.hypot(ddx, ddz) || 1;
    const step = Math.min(dl, sp * dt);
    slide(W, m, ddx / dl * step, ddz / dl * step);
    m.yaw = Math.atan2(-ddx, -ddz);
    m.moving = true; m.walkT += dt * sp;
    if (!hidden && Math.hypot(p.x - m.x, p.z - m.z) < 0.75 && Math.abs(p.y - m.y) < 1.5) {
      const z = L.zones[m.zone];
      W.emit('mannequin-grab', { zone: m.zone });
      W.say('A mannequin grabbed you! Back to the start.', 'bad');
      resetZone(W, m.zone);
      teleport(W, z.start);
      return;
    }
  }
}
function slide(W, m, dx, dz) {
  const near = W._mq || (W._mq = []);
  for (const [ax, d] of [['x', dx], ['z', dz]]) {
    if (!d) continue;
    m[ax] += d;
    const b = { x0: m.x - 0.28, x1: m.x + 0.28, y0: m.y + 0.3, y1: m.y + 1.8, z0: m.z - 0.28, z1: m.z + 0.28 };
    W.solidsNear(b.x0, b.z0, b.x1, b.z1, near, false);
    if (near.some(o => boxesOverlap(b, o, 0.001))) m[ax] -= d;
  }
}

// The Eye at the end of its hall sees anyone who isn't an invisible croucher.
function stepEye(W, dt) {
  const A = W.a3, p = W.player, E = W.level.act3.eye;
  if (A.eyeCool > 0) A.eyeCool -= dt;
  A.eyeSees = false;
  if (!pointInBox(E.box, p.x, p.y + 0.5, p.z) || p.hiding) { A.eyeT = Math.max(0, A.eyeT - dt); return; }
  if (A.powers.invis && p.crouch) { A.eyeT = Math.max(0, A.eyeT - dt); return; }
  if (!lineOfSight(W.hash, W.dynOpaque, E.x, E.y, E.z, p.x, p.y + p.height * 0.6, p.z)) { A.eyeT = Math.max(0, A.eyeT - dt); return; }
  A.eyeSees = true;
  A.eyeT += dt * 1.6;
  if (A.eyeT >= 1) {
    A.eyeT = 0;
    W.emit('alarm', { x: E.x, y: E.y, z: E.z, name: 'the Eye' });
    W.say('THE EYE SEES YOU! It throws you out of its hall. (Only the invisible get past it.)', 'bad');
    W.ai.alert([p.x, p.y, p.z]);
    teleport(W, E.back);
  }
}

// ------------------------------------------------------------------ pickups + rules
export function act3Pickup(W, pr) {
  const L = W.level.act3;
  if (!L.groceries.includes(pr.id)) return false;
  pr.gone = true; W.a3.groceries++;
  W.emit('pickup', { item: pr.type });
  W.say(`${pr.missionName} into the trolley (${W.a3.groceries}/5).${W.a3.groceries >= 5 ? ' Now pay at the checkout!' : ''}`, W.a3.groceries >= 5 ? 'good' : 'info');
  W.dirty = true;
  return true;
}

export function sightBlocked(W) {
  const p = W.player;
  return !!(W.a3 && W.a3.powers.invis && p.crouch) || !!(W.a3 && W.a3.zone);
}

export function act3Objective(W) {
  const A = W.a3, s = W.steps, P = A.powers, t = A.tram;
  if (s.musicbox !== undefined) return 'You have his music box! Get out and run home across the road.';
  if (A.zone === 'market') return A.groceries >= 5 ? 'Pay at the checkout by the doors.' : `Fear of being seen: put 5 groceries in the trolley (${A.groceries}/5). Mannequins move when you look away — crouch and they lose you.`;
  if (A.zone === 'school') return A.bell ? 'Push the giant mannequin over in the gym.' : 'Fear of school: reach the bell at the end of the corridor. Hide in lockers. Mannequins move when you look away.';
  if (A.zone === 'closet') return 'Fear of the dark: climb the giant closet to the light switch at the top.';
  const have = Object.values(P).filter(Boolean).length;
  if (have < 3 && !s.fuse && !W.hasItem('fuse')) {
    const left = ['invis', 'push', 'double'].filter(k => !P[k]).map(k => ({ invis: 'Supermarket (ground floor)', push: 'School (1st floor)', double: 'Closet (3rd floor)' }[k]));
    return `Beat your fears for powers (${have}/3). Fear doors: ${left.join(', ')}.`;
  }
  if (!W.flags.power) {
    if (W.hasItem('fuse')) return 'Take the fuse up to the control room (3rd floor, up on the high ledge — double jump).';
    return P.invis ? 'The fuse is at the end of the Eye hall (2nd floor). Crouch so the Eye cannot see you.' : 'The fuse is guarded by the Eye (2nd floor). You need invisibility first (Supermarket).';
  }
  if (!t.on) return t.lever ? 'Press the big red button in the control room.' : 'Power is on. Pull the tram lever in the control room.';
  if (!W.hasItem('redkey') && W.doorById.basement.locked) return 'Ride the tram (Depot: through the upside-down door, 3rd floor) to the Water Room and take the red key.';
  if (!A.blocker) return 'A giant wardrobe blocks the basement door (ground floor hall). Push it over with R.';
  if (W.doorById.basement.locked) return 'Unlock the basement door at the back of the hall with the red key.';
  return 'Go down into his basement and take the music box.';
}

// ------------------------------------------------------------------ save
export function act3Save(W) {
  const A = W.a3, t = A.tram;
  return { powers: A.powers, tram: { s: t.s, on: t.on, lever: t.lever }, groceries: A.groceries, bell: A.bell, giantDown: A.giantDown, closetLight: A.closetLight, blocker: A.blocker };
}
export function act3Load(W, s) {
  if (!s) return;
  const A = W.a3;
  Object.assign(A.powers, s.powers || {});
  Object.assign(A.tram, s.tram || {});
  A.groceries = s.groceries || 0; A.bell = !!s.bell; A.giantDown = !!s.giantDown; A.closetLight = !!s.closetLight; A.blocker = !!s.blocker;
  if (A.giantDown) A.giantT = 99;
  if (A.blocker) A.blockerT = 99;
}
