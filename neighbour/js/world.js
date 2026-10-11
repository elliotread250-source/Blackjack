// The game simulation: player movement and climbing, props (pick up, drop, throw, stack), doors,
// windows, the fuse box, hiding, bear traps, cameras, the neighbour, getting caught, learning,
// the win and saving. Pure JS: no three.js and no DOM, so the tests run it in Node.
//
// main.js calls step(dt, input) at 60 Hz and reads `events` (sounds, effects, messages) and the
// state (render.js draws it).

import { SpatialHash, makeBox, boxesOverlap, rayBox, clamp, rng as mkRng, angleWrap, pointInBox } from './geom.js';
import { buildLevel, doorBoxes, windowBox, windowCenter, doorCenter, ITEM_TYPES, F1 } from './level.js';
import { buildGrid, makePather, findNode, smoothPath, nodePos } from './nav.js';
import { sightRate, hearNoise, lightAt, lineOfSight, NOISE } from './perception.js';
import { Neighbour, DIFFICULTY, EYE } from './ai.js';
import * as Learn from './learning.js';

export const PLAYER = {
  r: 0.3, h: 1.75, hc: 1.0, eye: 1.62, eyeC: 0.88,
  walk: 3.3, sprint: 5.7, crouch: 1.7, jumpV: 6.3, g: 18, step: 0.45, mantle: 0.42, reach: 2.4,
};
const GRAV = 18;
const SAVE_VERSION = 1;

export class World {
  constructor(opts = {}) {
    this.level = opts.level || buildLevel(opts.mission);
    this.diffKey = opts.difficulty || 'normal';
    this.diff = DIFFICULTY[this.diffKey];
    this.rng = mkRng(opts.seed || 12345);
    const L = this.level;
    this.hash = new SpatialHash(2);
    for (const b of L.boxes) if (b.col || b.op) this.hash.insert(b);
    // doors, windows
    this.doors = L.doors.map(d => Object.assign({}, d, doorBoxes(d), { angle: d.open ? 1 : 0, target: d.open ? 1 : 0, locked: !!d.lock, autoClose: 0 }));
    this.doorById = Object.fromEntries(this.doors.map(d => [d.id, d]));
    this.windows = L.windows.map(w => Object.assign({}, w, { box: windowBox(w) }));
    this.winById = Object.fromEntries(this.windows.map(w => [w.id, w]));
    // navigation for the neighbour (the basement door is never his way)
    const base = this.doorById.basement;
    this.nav = opts.nav || buildGrid(L.boxes, { bounds: L.navBounds, radius: 0.3, clear: 1.9, extra: [base.closed] });
    this.astar = makePather(this.nav);
    this.hides = L.hides.map(h => Object.assign({}, h, {
      yaw: Math.atan2(-(h.face[0] - h.x), -(h.face[1] - h.z)),
      box: makeBox(h.x - 0.55, h.y, h.z - 0.55, h.x + 0.55, h.y + 2.1, h.z + 0.55),
    }));
    const fb = L.fusebox;
    this.fusebox = Object.assign({}, fb, { box: makeBox(fb.x - 0.2, fb.y - 0.35, fb.z - 0.3, fb.x + 0.05, fb.y + 0.35, fb.z + 0.3) });
    this.pois = L.pois;
    this.props = L.items.map(it => this.makeProp(it));
    this.propById = Object.fromEntries(this.props.map(p => [p.id, p]));
    this.player = this.makePlayer();
    const stove = L.pois[0];
    this.ai = new Neighbour(this.diff, stove);
    this.learn = Learn.createLearning();
    this.traps = [];
    this.cams = [];
    this.flags = { power: false, won: false };
    this.steps = {};
    this.clues = {};
    this.stats = { time: 0, caught: 0 };
    this.events = [];
    this.noises = [];
    this.dyn = []; this.dynOpaque = [];
    this.wasInside = false;
    this.t = 0;
    this.look = null;
    this.trapSeq = 0;
    this.dirty = false;
  }

  makeProp(it) {
    const def = ITEM_TYPES[it.type];
    const [w, h, d] = def.size;
    return {
      id: it.id, type: it.type, missionName: it.missionName, def, x: it.x, y: it.y, z: it.z, vx: 0, vy: 0, vz: 0,
      hx: Math.max(0.07, w / 2), hy: Math.max(0.06, h), hz: Math.max(0.07, d / 2),
      ry: ((it.x * 13.7 + it.z * 7.3) % 6.28), spin: 0, rest: false, held: false, thrown: false, gone: false,
    };
  }

  makePlayer() {
    const s = this.level.spawn;
    return {
      x: s.x, y: s.y, z: s.z, vx: 0, vy: 0, vz: 0, yaw: s.yaw, pitch: 0, onGround: true, crouch: false,
      inv: [null, null, null, null], sel: 0, charge: 0, charging: false, hiding: null, stuck: 0,
      caught: null, vault: null, stepDist: 0, groundMat: 'grass', groundProp: null, fallFrom: 0, speed: 0,
      height: PLAYER.h, eyeH: PLAYER.eye, sprinting: false,
    };
  }

  emit(type, data = {}) { data.type = type; this.events.push(data); return data; }
  noise(x, y, z, radius, kind, player = false) { this.noises.push({ x, y, z, radius, kind, player }); }
  say(text, kind = 'info') { this.emit('msg', { text, kind }); }
  markStep(id) { if (!this.steps[id]) { this.steps[id] = this.stats.time; this.emit('progress', { id }); this.dirty = true; } }
  clue(id) { if (!this.clues[id]) { this.clues[id] = true; this.emit('clue', { id }); this.dirty = true; } }

  // ------------------------------------------------------------------ helpers
  doorBox(d) { return d.angle < 0.5 ? d.closed : d.openBox; }
  rebuildDyn() {
    const dyn = this.dyn, op = this.dynOpaque;
    dyn.length = 0; op.length = 0;
    for (const d of this.doors) { const b = this.doorBox(d); dyn.push(b); op.push(b); }
    for (const w of this.windows) {
      if (w.boards) { dyn.push(w.box); op.push(w.box); } else if (w.glass) dyn.push(w.box);
    }
    for (const p of this.props) {
      if (p.held || p.gone) continue;
      p.box = p.box || {};
      p.box.x0 = p.x - p.hx; p.box.x1 = p.x + p.hx; p.box.y0 = p.y; p.box.y1 = p.y + p.hy; p.box.z0 = p.z - p.hz; p.box.z1 = p.z + p.hz;
      p.box.prop = p;
      if (p.type === 'crate') op.push(p.box);
    }
  }
  solidsNear(x0, z0, x1, z1, out, withProps = true, skipProp = null) {
    this.hash.query(x0, z0, x1, z1, out);
    for (let i = out.length - 1; i >= 0; i--) if (!out[i].col) { out[i] = out[out.length - 1]; out.pop(); }
    for (const b of this.dyn) if (b.x1 >= x0 && b.x0 <= x1 && b.z1 >= z0 && b.z0 <= z1) out.push(b);
    if (withProps) for (const p of this.props) if (!p.held && !p.gone && p !== skipProp && !p.thrown && p.box && p.box.x1 >= x0 && p.box.x0 <= x1 && p.box.z1 >= z0 && p.box.z0 <= z1) out.push(p.box);
    return out;
  }
  playerBox(y = this.player.y, h = this.player.height) {
    const p = this.player, r = PLAYER.r;
    return { x0: p.x - r, x1: p.x + r, y0: y, y1: y + h, z0: p.z - r, z1: p.z + r };
  }
  hasItem(type) { return this.player.inv.some(id => id && this.propById[id].type === type); }
  invIndex(type) { return this.player.inv.findIndex(id => id && this.propById[id].type === type); }
  selected() { const id = this.player.inv[this.player.sel]; return id ? this.propById[id] : null; }
  inside(x, y, z) { return this.level.regions.some(r => pointInBox(r, x, y, z)); }
  atHome(x, z) { if (this.level.exit) { const e = this.level.exit; return x > e.x0 && x < e.x1 && z > e.z0 && z < e.z1; } return x > -5.2 && x < 5.2 && z > 10 && z < 18.2; }

  // ------------------------------------------------------------------ main step
  step(dt, inp = {}) {
    this.t += dt;
    this.noises.length = 0;
    this.rebuildDyn();
    this.updateDoors(dt);
    const p = this.player;
    if (this.flags.won) { this.ai.update(dt, this); return; }
    if (p.caught) { this.updateCaught(dt); this.ai.update(dt, this); this.flushAI(); return; }
    this.stats.time += dt;
    this.updatePlayer(dt, inp);
    this.rebuildDyn();
    this.updateProps(dt);
    this.updateTraps(dt);
    this.updateCams(dt);
    this.ai.update(dt, this);
    this.flushAI();
    this.aiDoors(dt);
    this.aiProps();
    this.trackEntry();
    this.checkSteps();
    const tb = this.level.basementTrigger;
    const mission = this.level.mission || 0;
    const home = Math.hypot(this.player.x - this.level.spawn.x, this.player.z - this.level.spawn.z) < 3 && this.player.y < 1;
    const complete = this.level.exit ? this.level.targets.every(id => this.steps[id] !== undefined) && (!this.level.requirePower || this.flags.power) && boxesOverlap(this.playerBox(), this.level.exit)
      : mission === 1 ? this.level.targets.every(id => this.steps[id] !== undefined) && home
      : mission === 2 ? this.flags.power && this.player.inv.includes('missionRadio') && home
      : !this.doorById.basement.locked && boxesOverlap(this.playerBox(), tb);
    if (complete && !this.player.caught) {
      this.flags.won = true; this.markStep('basement'); this.emit('win'); this.dirty = true;
    }
  }

  flushAI() {
    for (const e of this.ai.events) {
      if (e.type === 'spotted') { const p = this.player; Learn.recordSpot(this.learn, p.x, p.y, p.z, this.t); }
      this.emit('ai-' + e.type, e);
    }
    this.ai.events.length = 0;
  }

  // ------------------------------------------------------------------ player
  updatePlayer(dt, inp) {
    const p = this.player;
    // look
    p.yaw = angleWrap(p.yaw - (inp.lookX || 0));
    p.pitch = clamp(p.pitch - (inp.lookY || 0), -1.45, 1.45);
    if (inp.slot !== undefined && inp.slot !== null && inp.slot >= 0 && inp.slot < 4) { p.sel = inp.slot; p.charging = false; p.charge = 0; }
    if (inp.wheel) { p.sel = (p.sel + (inp.wheel > 0 ? 1 : 3)) % 4; p.charging = false; p.charge = 0; }
    if (p.hiding) {
      if (inp.hide || inp.interact) this.exitHide();
      p.speed = 0;
      return;
    }
    if (p.vault) { this.updateVault(dt); return; }
    if (p.stuck > 0) p.stuck = Math.max(0, p.stuck - dt);

    // crouch: can't stand up under something
    const want = !!inp.crouch;
    if (!want && p.crouch && !this.fits(p.y, PLAYER.h)) p.crouch = true; else p.crouch = want;
    if (!p.crouch && !this.fits(p.y, PLAYER.h)) p.crouch = true;
    p.height = p.crouch ? PLAYER.hc : PLAYER.h;

    // move
    let mx = inp.mx || 0, mz = inp.mz || 0;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    p.sprinting = !!inp.sprint && !p.crouch && mz > 0.2;
    let speed = p.crouch ? PLAYER.crouch : p.sprinting ? PLAYER.sprint : PLAYER.walk;
    if (p.stuck > 0) speed = 0;
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const rx = Math.cos(p.yaw), rz = -Math.sin(p.yaw);
    const wx = (fx * mz + rx * mx) * speed, wz = (fz * mz + rz * mx) * speed;
    const acc = p.onGround ? 14 : 2.5;
    const k = Math.min(1, acc * dt);
    p.vx += (wx - p.vx) * k; p.vz += (wz - p.vz) * k;
    if (inp.jump && p.onGround && p.stuck <= 0) {
      p.vy = PLAYER.jumpV; p.onGround = false;
      this.noise(p.x, p.y, p.z, NOISE.jump, 'jump', true);
      this.emit('jump');
    }
    p.vy -= GRAV * dt;
    const wasGround = p.onGround;
    const near = this._near || (this._near = []);
    this.solidsNear(p.x - 1.2, p.z - 1.2, p.x + 1.2, p.z + 1.2, near);
    this.moveAxis('x', p.vx * dt, near);
    this.moveAxis('z', p.vz * dt, near);
    this.moveY(p.vy * dt, near, wasGround);
    p.speed = Math.hypot(p.vx, p.vz);

    // footsteps
    if (p.onGround && p.speed > 0.4) {
      p.stepDist += p.speed * dt;
      const stride = p.crouch ? 0.55 : p.sprinting ? 0.8 : 0.62;
      if (p.stepDist > stride) {
        p.stepDist = 0;
        const mode = p.crouch ? 'crouch' : p.sprinting ? 'sprint' : 'walk';
        this.emit('step', { mode, mat: p.groundMat });
        this.noise(p.x, p.y, p.z, NOISE[mode], 'step', true);
      }
    }

    // interactions
    this.look = this.lookTarget();
    if (this.look) this.noticeClue(this.look);
    if (inp.interact && this.look) this.interact(this.look);
    else if (inp.interact && !this.look) { /* nothing */ }
    if (inp.hide && this.look && this.look.kind === 'hide') this.enterHide(this.look.ref);
    if (inp.primaryPress) {
      if (this.look && this.look.kind === 'prop') this.pickUp(this.look.ref);
      else if (this.selected()) { p.charging = true; p.charge = 0; }
    }
    if (p.charging) {
      p.charge = Math.min(1, p.charge + dt / 0.9);
      if (!inp.primary) { this.throwSelected(Math.max(0.15, p.charge)); p.charging = false; p.charge = 0; }
      if (!this.selected()) { p.charging = false; p.charge = 0; }
    }
    if (inp.drop) this.dropSelected();
  }

  fits(y, h) {
    const near = this._fit || (this._fit = []);
    const b = this.playerBox(y, h);
    this.solidsNear(b.x0, b.z0, b.x1, b.z1, near);
    for (const o of near) if (boxesOverlap(b, o, 0.002)) return false;
    return true;
  }

  moveAxis(ax, d, near) {
    if (d === 0) return;
    const p = this.player, r = PLAYER.r;
    p[ax] += d;
    for (let pass = 0; pass < 3; pass++) {
      let hitAny = false;
      const pb = this.playerBox();
      for (const b of near) {
        if (!boxesOverlap(pb, b, 0.001)) continue;
        const rise = b.y1 - p.y;
        // step up stairs / small ledges, or mantle onto ledges while jumping
        const lim = p.onGround ? PLAYER.step : PLAYER.mantle;
        if (rise > 0 && rise <= lim + 1e-4) {
          if (this.fits(b.y1 + 0.001, p.height)) { p.y = b.y1 + 0.001; if (!p.onGround) { p.vy = Math.max(0, p.vy * 0.2); this.emit('mantle'); } p.onGround = true; hitAny = true; break; }
          if (!p.onGround && this.fits(b.y1 + 0.001, PLAYER.hc)) { p.y = b.y1 + 0.001; p.crouch = true; p.height = PLAYER.hc; p.vy = 0; p.onGround = true; this.emit('mantle'); hitAny = true; break; }
        }
        // push out
        if (ax === 'x') { p.x = d > 0 ? b.x0 - r - 0.0005 : b.x1 + r + 0.0005; p.vx = 0; }
        else { p.z = d > 0 ? b.z0 - r - 0.0005 : b.z1 + r + 0.0005; p.vz = 0; }
        hitAny = true;
        break;
      }
      if (!hitAny) break;
    }
  }

  moveY(d, near, wasGround) {
    const p = this.player;
    const startY = p.y;
    p.y += d;
    p.onGround = false;
    let support = null;
    const pb = this.playerBox();
    for (const b of near) {
      if (!boxesOverlap(pb, b, 0.0005)) continue;
      if (d <= 0) {
        if (b.y1 > p.y && b.y1 <= startY + 0.01) { p.y = b.y1; p.vy = 0; p.onGround = true; support = b; pb.y0 = p.y; pb.y1 = p.y + p.height; }
      } else if (b.y0 >= startY + p.height - 0.05) {
        p.y = b.y0 - p.height - 0.001; p.vy = 0; pb.y0 = p.y; pb.y1 = p.y + p.height;
      }
    }
    if (p.y <= 0) { p.y = 0; p.vy = Math.max(0, p.vy); p.onGround = true; support = null; }
    // walking down stairs: stick to the ground instead of hopping down each tread
    if (!p.onGround && wasGround && p.vy <= 0) {
      let best = -Infinity, bb = null;
      const probe = { x0: pb.x0, x1: pb.x1, z0: pb.z0, z1: pb.z1, y0: p.y - PLAYER.step, y1: p.y };
      for (const b of near) if (boxesOverlap(probe, b, 0.0005) && b.y1 <= p.y + 0.001 && b.y1 > best) { best = b.y1; bb = b; }
      if (p.y - PLAYER.step <= 0 && best < 0) { best = 0; bb = null; }
      if (best > -Infinity) { p.y = best; p.vy = 0; p.onGround = true; support = bb; }
    }
    if (p.onGround) {
      const fell = p.fallFrom - p.y;
      if (!wasGround && fell > 0.9) {
        this.noise(p.x, p.y, p.z, NOISE.land * Math.min(1.5, fell / 2), 'land', true);
        this.emit('land', { h: fell });
      }
      p.fallFrom = p.y;
      p.groundProp = support && support.prop ? support.prop : null;
      p.groundMat = support ? (support.prop ? 'wood' : matOf(support)) : (p.x > -60 && Math.abs(p.z) < 4 ? 'road' : 'grass');
    } else if (wasGround) p.fallFrom = p.y;
    else p.fallFrom = Math.max(p.fallFrom, p.y);
  }

  // ------------------------------------------------------------------ look + interact
  eye() {
    const p = this.player;
    const eh = p.crouch ? PLAYER.eyeC : PLAYER.eye;
    return [p.x, p.y + eh, p.z];
  }
  viewDir() {
    const p = this.player, cp = Math.cos(p.pitch);
    return [-Math.sin(p.yaw) * cp, Math.sin(p.pitch), -Math.cos(p.yaw) * cp];
  }

  lookTarget() {
    const [ex, ey, ez] = this.eye(), [dx, dy, dz] = this.viewDir();
    const R = PLAYER.reach;
    const wall = this.hash.raycast(ex, ey, ez, dx * R, dy * R, dz * R, b => b.col);
    const tmax = wall ? wall.t * R : R;
    let best = null, bt = Infinity;
    const test = (box, kind, ref, slack = 0.05) => {
      const t = rayBox(ex, ey, ez, dx, dy, dz, box, R);
      if (t >= 0 && t <= tmax + slack && t < bt) { bt = t; best = { kind, ref, t }; }
    };
    for (const pr of this.props) {
      if (pr.held || pr.gone || !pr.box) continue;
      const pad = pr.def.big ? 0.02 : 0.1;
      test({ x0: pr.box.x0 - pad, x1: pr.box.x1 + pad, y0: pr.box.y0 - pad * 0.5, y1: pr.box.y1 + pad, z0: pr.box.z0 - pad, z1: pr.box.z1 + pad }, 'prop', pr, 0.12);
    }
    for (const d of this.doors) test(this.doorBox(d), 'door', d);
    for (const w of this.windows) test(w.box, 'window', w, 0.25);
    for (const h of this.hides) test(h.box, 'hide', h, 0.45);
    test(this.fusebox.box, 'fusebox', this.fusebox, 0.3);
    return best;
  }

  noticeClue(look) {
    if (look.kind === 'door') {
      if (look.ref.id === 'basement') this.clue('basement');
      if (look.ref.id === 'study' && look.ref.locked) this.clue('studyLock');
    }
    if (look.kind === 'fusebox') this.clue('fusebox');
    if (look.kind === 'window' && look.ref.id === 'garageW' && look.ref.boards) this.clue('garageBoards');
    if (look.kind === 'prop' && look.ref.type === 'redkey') this.clue('redkey');
  }

  // Text for the "what you're looking at" prompt.
  hint(look = this.look) {
    if (!look) return null;
    const r = look.ref;
    switch (look.kind) {
      case 'prop': return { act: 'take', text: 'Take ' + (r.missionName || r.def.name) };
      case 'hide': return { act: 'hide', text: 'Hide in ' + r.name.toLowerCase() };
      case 'fusebox':
        if (this.flags.power) return { act: 'none', text: 'Fuse box (power on)' };
        return this.hasItem('fuse') ? { act: 'use', text: 'Put the fuse in' } : { act: 'none', text: 'Fuse box: a fuse is missing' };
      case 'door': {
        if (r.chained) return this.hasItem('crowbar') ? { act: 'use', text: 'Break the chain' } : { act: 'none', text: 'Chained shut. Something could break it.' };
        if (r.locked) {
          if (r.lock === 'red') return this.hasItem('redkey') ? { act: 'use', text: 'Unlock with the red key' } : { act: 'none', text: 'Red padlock: needs a red key' };
          if (r.lock === 'bolt') return this.onSide(r) === r.inside ? { act: 'use', text: 'Slide the bolt' } : { act: 'none', text: 'Bolted from the other side' };
          if (r.lock === 'power') return this.onSide(r) === r.inside ? { act: 'use', text: 'Open from inside' } : { act: 'none', text: 'Electric lock: no power' };
        }
        return { act: 'use', text: (r.target > 0.5 ? 'Close ' : 'Open ') + r.name.toLowerCase() };
      }
      case 'window':
        if (r.boards) return this.hasItem('crowbar') ? { act: 'use', text: 'Pry the boards off' } : { act: 'none', text: 'Boarded up: needs a crowbar' };
        if (r.glass) return { act: 'none', text: 'Glass: throw something to break it' };
        return this.canVault(r) ? { act: 'use', text: 'Climb through' } : { act: 'none', text: 'Too high to climb from here' };
    }
    return null;
  }

  onSide(d) {
    const p = this.player, m = (d.t0 + d.t1) / 2;
    return (d.axis === 'z' ? p.x - m : p.z - m) > 0 ? 1 : -1;
  }

  interact(look) {
    const r = look.ref, p = this.player;
    switch (look.kind) {
      case 'prop': this.pickUp(r); break;
      case 'hide': this.enterHide(r); break;
      case 'fusebox':
        if (this.flags.power) { this.say('The power is on.'); break; }
        if (this.hasItem('fuse')) {
          const i = this.invIndex('fuse'), pr = this.propById[p.inv[i]];
          p.inv[i] = null; pr.gone = true; pr.held = false;
          this.setPower(true);
          this.say(this.level.exit ? 'Power restored. The electric door is unlocked.' : 'The lights buzz. Somewhere upstairs a lock clicks.', 'good');
        } else this.say('One fuse slot is empty.');
        break;
      case 'door': this.useDoor(r); break;
      case 'window': this.useWindow(r); break;
    }
  }

  setPower(on) {
    this.flags.power = on;
    for (const d of this.doors) if (d.lock === 'power') d.locked = !on;
    if (on) { this.markStep('power'); this.emit('power'); }
    this.dirty = true;
  }

  useDoor(d) {
    const p = this.player;
    if (d.target > 0.5 && !d.chained) {
      d.target = 0; this.emit('door', { door: d.id, open: false });
      this.noise(p.x, p.y, p.z, NOISE.door, 'door', true);
      return;
    }
    if (d.chained) {
      if (this.hasItem('crowbar')) {
        d.chained = false; this.noise(p.x, p.y, p.z, NOISE.chain, 'chain', true);
        this.emit('chain', { door: d.id }); this.say('The chain snaps.', 'good'); this.dirty = true;
      } else this.say('He chained it shut. Something could break the chain.');
      return;
    }
    if (d.locked) {
      if (d.lock === 'red') {
        if (this.hasItem('redkey')) {
          d.locked = false; d.target = 1; this.emit('unlock', { door: d.id }); this.emit('door', { door: d.id, open: true });
          this.say('The padlock falls away. The chains rattle to the floor.', 'good'); this.dirty = true;
        } else { this.say('A heavy red padlock and chains. You need a red key.'); this.emit('locked', { door: d.id }); }
        return;
      }
      if (d.lock === 'bolt') {
        if (this.onSide(d) === d.inside) { d.locked = false; d.target = 1; this.emit('unlock', { door: d.id }); this.say('You slide the bolt back.', 'good'); this.dirty = true; }
        else { this.say('It is bolted from the other side.'); this.emit('locked', { door: d.id }); }
        return;
      }
      if (d.lock === 'power') {
        if (this.onSide(d) === d.inside) { d.target = 1; this.emit('door', { door: d.id, open: true }); }
        else { this.say('An electric lock. The light is red: no power.'); this.emit('locked', { door: d.id }); }
        return;
      }
    }
    const open = d.target < 0.5;
    d.target = open ? 1 : 0;
    this.emit('door', { door: d.id, open });
    this.noise(p.x, p.y, p.z, NOISE.door, 'door', true);
  }

  useWindow(w) {
    const p = this.player;
    if (w.boards) {
      if (this.hasItem('crowbar')) {
        w.boards = false;
        this.noise(p.x, p.y, p.z, NOISE.boards, 'boards', true);
        this.emit('boards', { win: w.id });
        this.say('The boards come away with a screech.', 'good');
        if (w.id === 'garageW') this.markStep('garageWindow');
        this.dirty = true;
      } else this.say('Boarded up tight. You need something to pry the boards off.');
      return;
    }
    if (w.glass) { this.say('Break the glass by throwing something at it.'); return; }
    if (this.canVault(w)) this.startVault(w);
    else this.say('Too high. Stand on something.');
  }

  breakWindow(w, by) {
    if (!w.glass || w.boards) return false;
    w.glass = false;
    const c = windowCenter(w);
    this.noise(c[0], c[1], c[2], NOISE.glass, 'glass', true);
    this.emit('glass', { win: w.id, x: c[0], y: c[1], z: c[2] });
    if (w.id === 'studyEW' || w.id === 'studyFW') this.markStep('studyWindow');
    this.dirty = true;
    return true;
  }

  canVault(w) { return this.player.y >= w.sill - 1.0 && this.player.y <= w.sill + 0.6; }
  startVault(w) {
    const p = this.player, m = (w.t0 + w.t1) / 2;
    const side = (w.axis === 'x' ? p.z - m : p.x - m) > 0 ? 1 : -1;
    const along = clamp(w.axis === 'x' ? p.x : p.z, w.c - 0.25, w.c + 0.25);
    const mid = w.axis === 'x' ? [along, w.sill + 0.01, m] : [m, w.sill + 0.01, along];
    const end = w.axis === 'x' ? [along, w.sill + 0.01, m - side * 0.75] : [m - side * 0.75, w.sill + 0.01, along];
    p.vault = { t: 0, from: [p.x, p.y, p.z], mid, end, win: w.id };
    p.crouch = true; p.height = PLAYER.hc; p.vx = p.vz = p.vy = 0;
    this.emit('vault');
    this.noise(p.x, p.y, p.z, 2.5, 'vault', true);
  }
  updateVault(dt) {
    const p = this.player, v = p.vault;
    v.t += dt / 0.75;
    const t = Math.min(1, v.t);
    const a = t < 0.5 ? v.from : v.mid, b = t < 0.5 ? v.mid : v.end, u = t < 0.5 ? t * 2 : t * 2 - 1;
    const e = u * u * (3 - 2 * u);
    p.x = a[0] + (b[0] - a[0]) * e; p.z = a[2] + (b[2] - a[2]) * e;
    p.y = a[1] + (b[1] - a[1]) * e + (t < 0.5 ? Math.sin(u * Math.PI) * 0.15 : 0);
    if (t >= 1) {
      p.vault = null; p.onGround = false; p.vy = 0; p.fallFrom = p.y;
      // nudge out of anything we ended up inside (a counter under the window)
      for (let i = 0; i < 6 && !this.fits(p.y, PLAYER.hc); i++) p.y += 0.12;
    }
  }

  // ------------------------------------------------------------------ inventory
  pickUp(pr) {
    const p = this.player;
    if (pr.held || pr.gone) return false;
    if (p.groundProp === pr) { this.say("You're standing on it."); return false; }
    if ((this.level.mission === 1 || this.level.collectTargets) && this.level.targets.includes(pr.id)) {
      pr.gone = true; this.markStep(pr.id); this.emit('pickup', { item: pr.type });
      this.say(pr.missionName + ' recovered.'); this.dirty = true; return true;
    }
    let slot = p.inv[p.sel] ? p.inv.findIndex(s => !s) : p.sel;
    if (slot < 0) { this.say('Your hands are full (4 items). Drop something first.'); return false; }
    p.inv[slot] = pr.id;
    p.sel = slot;
    pr.held = true; pr.thrown = false; pr.rest = false;
    pr.vx = pr.vy = pr.vz = 0;
    for (const o of this.props) o.rest = false; // whatever was on top falls
    this.emit('pickup', { item: pr.type });
    if (pr.type === 'crowbar') this.markStep('crowbar');
    if (pr.type === 'fuse') this.markStep('fuse');
    if (pr.type === 'redkey') this.markStep('redkey');
    this.dirty = true;
    return true;
  }

  releaseSelected() {
    const p = this.player, id = p.inv[p.sel];
    if (!id) return null;
    p.inv[p.sel] = null;
    const pr = this.propById[id];
    pr.held = false; pr.rest = false;
    this.dirty = true;
    return pr;
  }

  // Put the selected item down in front of you (on top of a crate you're looking at, if any).
  dropSelected() {
    const p = this.player, pr = this.selected();
    if (!pr) return false;
    const [ex, ey, ez] = this.eye();
    const fx = -Math.sin(p.yaw), fz = -Math.cos(p.yaw);
    const tries = [];
    const look = this.look;
    if (look && look.kind === 'prop' && look.ref.type === 'crate' && pr.type === 'crate') {
      const c = look.ref;
      tries.push([c.x, c.y + c.hy + 0.01, c.z]);
    }
    for (const d of [0.95, 0.75, 0.55]) tries.push([ex + fx * d, Math.max(p.y + 0.05, ey - 0.9 - pr.hy * 0.5), ez + fz * d]);
    tries.push([ex + fx * 0.5, p.y + p.height + 0.05, ez + fz * 0.5]);
    const near = [];
    for (const [x, y, z] of tries) {
      const b = { x0: x - pr.hx, x1: x + pr.hx, y0: y, y1: y + pr.hy, z0: z - pr.hz, z1: z + pr.hz };
      this.solidsNear(b.x0, b.z0, b.x1, b.z1, near, true, pr);
      if (near.some(o => boxesOverlap(b, o, 0.001))) continue;
      if (boxesOverlap(b, this.playerBox(), 0.01)) continue;
      // don't drop through a wall: the eye must see the spot
      const hit = this.hash.raycast(ex, ey, ez, x - ex, (y + pr.hy * 0.5) - ey, z - ez, o => o.col, this.dyn);
      if (hit && hit.t < 0.97) continue;
      this.releaseSelected();
      pr.x = x; pr.y = y; pr.z = z; pr.vx = p.vx * 0.3; pr.vz = p.vz * 0.3; pr.vy = 0; pr.ry = p.yaw;
      this.emit('drop', { item: pr.type });
      return true;
    }
    this.say('No room to put that down here.');
    return false;
  }

  throwSelected(charge) {
    const p = this.player, pr = this.selected();
    if (!pr) return false;
    const [ex, ey, ez] = this.eye(), [dx, dy, dz] = this.viewDir();
    let sx = ex + dx * 0.45, sy = ey + dy * 0.45 - 0.08, sz = ez + dz * 0.45;
    const hit = this.hash.raycast(ex, ey, ez, sx - ex, sy - ey, sz - ez, o => o.col, this.dyn);
    if (hit) { sx = ex; sy = ey - 0.1; sz = ez; }
    this.releaseSelected();
    const v = (4 + 12 * charge) * pr.def.throwMul;
    pr.x = sx; pr.y = sy - pr.hy * 0.5; pr.z = sz;
    pr.vx = dx * v + p.vx * 0.4; pr.vy = dy * v + 1.4; pr.vz = dz * v + p.vz * 0.4;
    pr.thrown = true; pr.spin = (6 + 10 * charge) * (this.rng() < 0.5 ? -1 : 1);
    this.emit('throw', { item: pr.type, charge });
    this.noise(p.x, p.y, p.z, 1.5, 'throw', true);
    return true;
  }

  // ------------------------------------------------------------------ props
  updateProps(dt) {
    const near = this._pn || (this._pn = []);
    for (const pr of this.props) {
      if (pr.held || pr.gone || pr.rest) continue;
      pr.vy -= GRAV * dt;
      const sp = Math.hypot(pr.vx, pr.vy, pr.vz);
      const n = Math.max(1, Math.min(8, Math.ceil(sp * dt / 0.07)));
      const h = dt / n;
      let grounded = false;
      for (let s = 0; s < n && !pr.gone; s++) {
        this.solidsNear(pr.x - pr.hx - 0.6, pr.z - pr.hz - 0.6, pr.x + pr.hx + 0.6, pr.z + pr.hz + 0.6, near, true, pr);
        for (const ax of ['x', 'z', 'y']) {
          const v = ax === 'x' ? pr.vx : ax === 'y' ? pr.vy : pr.vz;
          if (v === 0) continue;
          pr[ax] += v * h;
          const b = { x0: pr.x - pr.hx, x1: pr.x + pr.hx, y0: pr.y, y1: pr.y + pr.hy, z0: pr.z - pr.hz, z1: pr.z + pr.hz };
          if (ax === 'y' && pr.y < 0) { this.propHit(pr, 'y', null); pr.y = 0; grounded = true; continue; }
          for (const o of near) {
            if (!boxesOverlap(b, o, 0.0005)) continue;
            // thrown things go through glass
            const w = this.windows.find(ww => ww.box === o);
            if (w && w.glass && !w.boards && pr.thrown && sp > 3) { this.breakWindow(w); pr.vx *= 0.6; pr.vy *= 0.6; pr.vz *= 0.6; continue; }
            if (ax === 'x') pr.x = v > 0 ? o.x0 - pr.hx - 0.001 : o.x1 + pr.hx + 0.001;
            else if (ax === 'z') pr.z = v > 0 ? o.z0 - pr.hz - 0.001 : o.z1 + pr.hz + 0.001;
            else { pr.y = v > 0 ? o.y0 - pr.hy - 0.001 : o.y1 + 0.001; if (v < 0) grounded = true; }
            this.propHit(pr, ax, o);
            break;
          }
        }
      }
      if (pr.gone) continue;
      if (pr.thrown) this.propVsNeighbour(pr);
      if (grounded) {
        pr.vx *= Math.pow(0.02, dt); pr.vz *= Math.pow(0.02, dt);
        pr.spin *= Math.pow(0.05, dt);
        if (Math.hypot(pr.vx, pr.vz) < 0.15 && Math.abs(pr.vy) < 0.3) { pr.rest = true; pr.vx = pr.vz = pr.vy = 0; pr.thrown = false; pr.spin = 0; }
      }
      pr.ry += pr.spin * dt;
    }
  }

  propHit(pr, ax, o) {
    const v = ax === 'x' ? pr.vx : ax === 'y' ? pr.vy : pr.vz;
    const imp = Math.abs(v);
    if (imp > 2.2) {
      const fragile = pr.type === 'bottle' || pr.type === 'vase' || pr.type === 'plate';
      if (fragile && imp > 5.5) {
        pr.gone = true;
        this.noise(pr.x, pr.y, pr.z, 16, 'shatter', true);
        this.emit('shatter', { x: pr.x, y: pr.y, z: pr.z, item: pr.type });
        this.dirty = true;
        return;
      }
      const loud = pr.def.noise * clamp(imp / 8, 0.35, 1.3);
      this.noise(pr.x, pr.y, pr.z, loud, 'impact', true);
      this.emit('impact', { x: pr.x, y: pr.y, z: pr.z, item: pr.type, v: imp });
    }
    if (ax === 'x') { pr.vx = -pr.vx * 0.3; pr.vz *= 0.8; }
    else if (ax === 'z') { pr.vz = -pr.vz * 0.3; pr.vx *= 0.8; }
    else { pr.vy = imp > 2 ? -pr.vy * 0.28 : 0; pr.vx *= 0.75; pr.vz *= 0.75; }
    if (o && o.prop) o.prop.rest = false;
  }

  propVsNeighbour(pr) {
    const a = this.ai;
    if (a.state === 'grab') return;
    const sp = Math.hypot(pr.vx, pr.vy, pr.vz);
    if (sp < 3.5) return;
    if (Math.hypot(pr.x - a.x, pr.z - a.z) < 0.45 && pr.y > a.y && pr.y < a.y + 2.05) {
      const p = this.player;
      a.hit([p.x, p.y, p.z]);
      pr.vx *= -0.2; pr.vz *= -0.2; pr.thrown = false;
      this.emit('bonk', { x: pr.x, y: pr.y, z: pr.z });
      this.noise(pr.x, pr.y, pr.z, 8, 'impact', true);
    }
  }

  // neighbour shoves props out of his way, and can knock your crate tower over
  aiProps() {
    const a = this.ai;
    if (a.speed <= 0) return;
    for (const pr of this.props) {
      if (pr.held || pr.gone) continue;
      const dx = pr.x - a.x, dz = pr.z - a.z, d = Math.hypot(dx, dz);
      if (d < 0.55 + pr.hx && pr.y < a.y + 0.8 && pr.y + pr.hy > a.y) {
        const k = (0.55 + pr.hx - d) * 6 / Math.max(0.1, d);
        pr.vx += dx * k; pr.vz += dz * k; pr.vy = Math.max(pr.vy, 0.8); pr.rest = false;
      }
    }
  }
  kickProps(x, z) {
    let any = false;
    for (const pr of this.props) {
      if (pr.held || pr.gone) continue;
      const dx = pr.x - x, dz = pr.z - z, d = Math.hypot(dx, dz);
      if (d < 2.4 && pr.type === 'crate') {
        const k = 3.5 / Math.max(0.3, d);
        pr.vx += dx * k; pr.vz += dz * k; pr.vy = 3.5; pr.rest = false; any = true;
      }
    }
    if (any) { this.noise(x, 0, z, NOISE.crate, 'kick', false); this.emit('kick', { x, z }); for (const pr of this.props) pr.rest = false; }
    return any;
  }
  propsUnderPlayer() { return !!this.player.groundProp; }

  // ------------------------------------------------------------------ hiding
  enterHide(h) {
    const p = this.player;
    if (p.hiding) return;
    p.hiding = h.id; p.vx = p.vz = p.vy = 0; p.charging = false;
    p.hideFrom = [p.x, p.y, p.z];
    p.x = h.x; p.y = h.y; p.z = h.z; p.yaw = h.yaw; p.pitch = -0.05;
    this.emit('hide', { id: h.id });
  }
  exitHide() {
    const p = this.player, h = this.hides.find(s => s.id === p.hiding);
    p.hiding = null;
    if (h) { p.x = h.face[0]; p.z = h.face[1]; p.y = h.y; p.yaw = h.yaw; }
    p.crouch = false; p.onGround = true; p.fallFrom = p.y;
    this.emit('unhide');
  }
  openHide(h) {
    this.emit('hide-open', { id: h.id });
    return this.player.hiding === h.id;
  }

  // ------------------------------------------------------------------ doors
  updateDoors(dt) {
    const a = this.ai;
    for (const d of this.doors) {
      const sp = d.by === 'ai' ? 3.2 : 2.6;
      if (d.angle !== d.target) {
        const prev = d.angle;
        d.angle = d.target > d.angle ? Math.min(d.target, d.angle + sp * dt) : Math.max(d.target, d.angle - sp * dt);
        if (prev >= 0.5 !== d.angle >= 0.5) this.rebuildDyn();
      }
      if (d.autoClose > 0) {
        d.autoClose -= dt;
        const c = doorCenter(d);
        if (d.autoClose <= 0) {
          const pin = boxesOverlap(this.playerBox(), d.opening, -0.05) || boxesOverlap(this.playerBox(), d.openBox, 0);
          if (Math.hypot(a.x - c[0], a.z - c[2]) > 1.6 && !pin) { d.target = 0; d.by = 'ai'; this.emit('door', { door: d.id, open: false, ai: true }); }
          else d.autoClose = 0.6;
        }
      }
    }
  }
  aiDoors() {
    const a = this.ai;
    if (a.state === 'grab') return;
    for (const d of this.doors) {
      if (d.id === 'basement' || d.target > 0.5) continue;
      if (Math.abs(a.y - d.y) > 1.2) continue;
      const c = doorCenter(d);
      if (Math.hypot(a.x - c[0], a.z - c[2]) < 1.25) {
        d.target = 1; d.by = 'ai';
        if (d.locked || d.chained) d.autoClose = 2.2;
        this.emit('door', { door: d.id, open: true, ai: true });
      }
    }
  }

  // ------------------------------------------------------------------ traps + cameras
  updateTraps() {
    const p = this.player;
    if (p.hiding || p.vault) return;
    for (const t of this.traps) {
      if (!t.armed) continue;
      if (Math.hypot(p.x - t.x, p.z - t.z) < 0.42 && Math.abs(p.y - t.y) < 0.35) {
        t.armed = false;
        p.stuck = this.diff.trapHold; p.vx = p.vz = 0;
        this.noise(t.x, t.y, t.z, NOISE.trap, 'trap', true);
        this.emit('trap', { x: t.x, y: t.y, z: t.z });
        this.say('SNAP! A bear trap. You are stuck!', 'bad');
        this.dirty = true;
      }
    }
  }
  updateCams(dt) {
    const p = this.player;
    for (const c of this.cams) {
      const m = this.level.camMounts.find(mm => mm.id === c.mount);
      c.mountRef = m;
      if (c.cool > 0) { c.cool -= dt; c.seeing = false; continue; }
      let rate = 0;
      if (!p.hiding && !this.atHome(p.x, p.z)) {
        rate = sightRate(this.hash, this.dynOpaque, { x: m.x, y: m.y - 0.1, z: m.z, yaw: m.yaw, fov: 75 * Math.PI / 180, range: 13, feel: 0 },
          { x: p.x, y: p.y, z: p.z, height: p.height, crouch: p.crouch, speed: p.speed, light: lightAt(this.level, p.x, p.y + 1, p.z) });
      }
      c.seeing = rate > 0;
      if (rate > 0) c.seeT += dt * rate * 0.8; else c.seeT = Math.max(0, c.seeT - dt);
      if (c.seeT >= 1) {
        c.seeT = 0; c.cool = 9;
        this.ai.alert([p.x, p.y, p.z]);
        Learn.recordSpot(this.learn, p.x, p.y, p.z, this.t);
        this.emit('alarm', { x: m.x, y: m.y, z: m.z, name: m.name });
        this.say('A camera saw you! He knows where you are.', 'bad');
      }
    }
  }

  // ------------------------------------------------------------------ the AI's view of the world
  sightRate(ai) {
    const p = this.player;
    if (p.hiding || p.caught || this.atHome(p.x, p.z)) return 0;
    return sightRate(this.hash, this.dynOpaque,
      { x: ai.x, y: ai.y + EYE, z: ai.z, yaw: ai.yaw + ai.head, range: this.diff.range },
      { x: p.x, y: p.y, z: p.z, height: p.height, crouch: p.crouch, speed: p.speed, light: lightAt(this.level, p.x, p.y + 1, p.z) });
  }
  hear(ai, n) { return hearNoise(this.hash, this.dynOpaque, { x: ai.x, y: ai.y + 1.6, z: ai.z }, n, this.diff.hear); }
  path(ax, ay, az, bx, by, bz) {
    const s = findNode(this.nav, ax, ay, az, 3), g = findNode(this.nav, bx, by, bz, 6);
    if (s < 0 || g < 0) return null;
    const r = this.astar(s, g);
    if (!r) return null;
    const pts = smoothPath(this.nav, r.path);
    if (r.complete && pts.length) {
      // finish on the exact target when it is right there
      const last = pts[pts.length - 1];
      if (Math.hypot(last[0] - bx, last[2] - bz) < 0.5 && Math.abs(last[1] - by) < 0.5) pts[pts.length - 1] = [bx, last[1], bz];
    }
    return { pts, complete: r.complete };
  }

  // ------------------------------------------------------------------ caught
  catchPlayer() {
    const p = this.player;
    if (p.caught || this.flags.won) return;
    if (p.hiding) { this.emit('dragged'); p.hiding = null; }
    p.vault = null;
    p.caught = { t: 0, x: p.x, y: p.y, z: p.z };
    p.charging = false;
    this.stats.caught++;
    this.ai.setState('grab');
    this.emit('caught', { n: this.stats.caught });
    this.dirty = true;
  }

  updateCaught(dt) {
    const c = this.player.caught;
    c.t += dt;
    if (c.t >= 2.6) this.respawn();
  }

  respawn() {
    const p = this.player, c = p.caught, L = this.level;
    // whatever you carried drops where he got you
    let k = 0;
    for (let i = 0; i < 4; i++) {
      const id = p.inv[i];
      if (!id) continue;
      const pr = this.propById[id];
      p.inv[i] = null;
      const a = k * 2.1 + 0.4, r = 0.35 + 0.15 * k;
      pr.held = false; pr.rest = false; pr.thrown = false;
      pr.x = c.x + Math.cos(a) * r; pr.z = c.z + Math.sin(a) * r; pr.y = c.y + 0.3 + 0.25 * k;
      pr.vx = pr.vy = pr.vz = 0;
      // keep it out of walls
      const near = [];
      for (let tries = 0; tries < 6; tries++) {
        const b = { x0: pr.x - pr.hx, x1: pr.x + pr.hx, y0: pr.y, y1: pr.y + pr.hy, z0: pr.z - pr.hz, z1: pr.z + pr.hz };
        this.solidsNear(b.x0, b.z0, b.x1, b.z1, near, false);
        if (!near.some(o => boxesOverlap(b, o, 0.001))) break;
        pr.x = c.x + (pr.x - c.x) * 0.5; pr.z = c.z + (pr.z - c.z) * 0.5; pr.y += 0.2;
      }
      k++;
    }
    // he learns
    Learn.recordCatch(this.learn, c.x, c.y, c.z);
    const msgs = this.applyLearning();
    // wake up at home
    const s = L.spawn;
    Object.assign(p, { x: s.x, y: s.y, z: s.z, vx: 0, vy: 0, vz: 0, yaw: s.yaw, pitch: 0.1, crouch: false, height: PLAYER.h, hiding: null, stuck: 0, caught: null, vault: null, onGround: true, fallFrom: 0, charging: false, charge: 0 });
    const home = this.pois.find(q => q.id === 'stove');
    this.ai.teleport(home);
    this.ai.setState('patrol');
    this.ai.aware = 0; this.ai.lastKnown = null;
    this.wasInside = false;
    this.emit('wake', { msgs, n: this.stats.caught });
    this.dirty = true;
  }

  applyLearning() {
    const L = this.level, nav = this.nav, msgs = [];
    const where = (x, y, z) => {
      let best = 'his yard', bd = Infinity;
      const named = [['the front door', 0, 0, -12], ['the back door', 0.5, 0, -28], ['the kitchen', 6, 0, -16.5], ['the living room', -6, 0, -16.5],
        ['the hallway', 0, 0, -20], ['the pantry', 6, 0, -24.5], ['the dining room', -5, 0, -23], ['the garage', 14, 0, -16], ['the landing', 0, F1, -20],
        ['the bedroom', -6, F1, -16.5], ['the study', 6, F1, -16.5], ['the nursery', -6, F1, -24.5], ['the attic', 0, 6.4, -22], ['the back yard', 0, 0, -40],
        ['the front yard', 0, 0, -9], ['the shed', 17, 0, -43.5], ['the garden', -8, 0, -39], ['the side passage', -15, 0, -20], ['the street', 0, 0, 0]];
      for (const [n, nx, ny, nz] of named) { const d = Math.hypot(nx - x, nz - z) + Math.abs(ny - y) * 4; if (d < bd) { bd = d; best = n; } }
      return best;
    };
    const ctx = {
      diff: this.diff, entries: L.entries, camMounts: L.camMounts,
      snap: (x, y, z, existing) => {
        for (let ring = 0; ring < 6; ring++) {
          const id = findNode(nav, x + (ring ? (this.rng() - 0.5) * ring : 0), y, z + (ring ? (this.rng() - 0.5) * ring : 0), 6);
          if (id < 0) continue;
          const q = nodePos(nav, id);
          if (Math.abs(q[1] - y) > 1.2) continue;
          if (existing.some(e => Math.hypot(e[0] - q[0], e[2] - q[2]) < 2.2)) continue;
          if (this.doors.some(d => boxesOverlap({ x0: q[0] - 0.3, x1: q[0] + 0.3, y0: q[1], y1: q[1] + 1, z0: q[2] - 0.3, z1: q[2] + 0.3 }, d.opening, 0))) continue;
          if (this.atHome(q[0], q[2]) || q[2] > -6.9 || Math.abs(q[0]) > 25.5) continue;  // only on his property
          return q;
        }
        return null;
      },
      see: (m, hs) => lineOfSight(this.hash, [], m.x, m.y - 0.2, m.z, hs[0], hs[1] + 1, hs[2]),
      blockable: id => {
        const e = L.entries[id];
        if (e.kind === 'window') { const w = this.winById[e.ref]; return w && !w.boards; }
        const d = this.doorById[e.ref]; return d && !d.chained;
      },
    };
    const acts = Learn.learn(this.learn, ctx);
    for (const a of acts) {
      if (a.type === 'trap') {
        this.traps.push({ id: 'trap' + (++this.trapSeq), x: a.pos[0], y: a.pos[1], z: a.pos[2], armed: true });
        msgs.push('He set a bear trap near ' + where(...a.pos) + '.');
      } else if (a.type === 'camera') {
        const m = L.camMounts.find(mm => mm.id === a.mount);
        this.cams.push({ mount: a.mount, seeT: 0, cool: 0 });
        msgs.push('He put up a security camera watching ' + m.name + '.');
      } else if (a.type === 'block') {
        const e = L.entries[a.entry];
        if (e.kind === 'window') { const w = this.winById[e.ref]; w.boards = true; w.learned = true; msgs.push('He boarded up the ' + e.name + '.'); }
        else { const d = this.doorById[e.ref]; d.chained = true; d.target = 0; msgs.push('He chained the ' + e.name + ' shut.'); }
      }
    }
    // he also starts keeping an eye on where he caught you
    const hs = Learn.hotspot(this.learn, 4);
    if (hs) {
      const id = findNode(nav, hs[0], hs[1], hs[2], 6);
      if (id >= 0) {
        const q = nodePos(nav, id);
        this.ai.extraPois = [{ id: 'watch', x: q[0], y: q[1], z: q[2], look: this.player.yaw, dur: 7, anim: 'stare', w: 2 }];
      }
    }
    // re-arm sprung traps
    for (const t of this.traps) t.armed = true;
    if (!acts.length && this.stats.caught > 0) msgs.push("He's watching more closely now.");
    return msgs;
  }

  // ------------------------------------------------------------------ bookkeeping
  trackEntry() {
    const p = this.player;
    const inside = this.inside(p.x, p.y + 0.5, p.z);
    if (inside && !this.wasInside) {
      let best = null, bd = 2.6;
      for (const id in this.level.entries) {
        const e = this.level.entries[id];
        const ref = e.kind === 'door' ? this.doorById[e.ref] : this.winById[e.ref];
        const c = e.kind === 'door' ? doorCenter(ref) : windowCenter(ref);
        const d = Math.hypot(c[0] - p.x, c[2] - p.z) + Math.abs(c[1] - (p.y + 1)) * 0.5;
        if (d < bd) { bd = d; best = id; }
      }
      if (best) { Learn.recordEntry(this.learn, best); this.emit('entered', { entry: best }); this.dirty = true; }
    }
    this.wasInside = inside;
  }

  checkSteps() {
    if (this.level.exit) return; // Original house coordinate landmarks do not apply to other maps.
    const p = this.player;
    if (p.y > 3.05 && p.x > 10 && p.x < 18.3 && p.z > -20.7 && p.z < -11.8 && p.onGround && !p.groundProp) this.markStep('garageRoof');
    if (p.y > F1 - 0.2 && p.y < 6 && p.x > 2.1 && p.x < 9.9 && p.z > -20.9 && p.z < -12.1) this.markStep('study');
  }

  objective() {
    const s = this.steps;
    if (this.level.exit) {
      if (this.level.targets.every(id => s[id] !== undefined)) return this.level.mission === 3 ? 'Records secured. Escape UP the entrance stairs to the green light.' : 'Ledger secured. Go upstairs, out the front door and back to the garden gate.';
      if (!this.flags.power) return this.level.mission === 3 ? 'Find the fuse in the east storage room. Restore power at the corridor fuse box.' : 'Find the fuse in the kitchen and the red key in the bedroom. The fuse box is downstairs on the east cellar wall.';
      if (!this.hasItem('redkey') && this.doorById.basement.locked) return this.level.mission === 3 ? 'The workshop is powered. Find the red key on its workbench.' : 'Find the red key on the bedroom desk upstairs.';
      if (this.doorById.basement.locked) return 'Unlock the red padlock on the archive door.';
      return this.level.mission === 3 ? 'Recover the records from the desk in the north archive room.' : 'Enter the powered records room in the west cellar and take the ledger.';
    }
    if (this.level.mission === 1) {
      const remaining = this.level.targets.filter(id => s[id] === undefined);
      return remaining.length ? `Evidence ${3 - remaining.length}/3 — find: ${remaining.map(id => this.propById[id].missionName.replace(' evidence', '')).join(', ')}.` : 'All evidence recovered. Return to your front door across the road.';
    }
    if (this.level.mission === 2) {
      if (!this.flags.power) return 'Dead Air: find the fuse in the garage and restore power in the pantry.';
      if (!this.player.inv.includes('missionRadio')) return 'Power restored. Take the radio from the attic (top floor).';
      return 'Carry the attic radio home across the road. Keep it in your inventory!';
    }
    if (s.basement) return 'You got in.';
    if (s.redkey || this.hasItem('redkey')) return 'Use the red key on the basement door.';
    if (s.study) return 'Search the study.';
    if (this.clues.redkey) return 'Get the red key from the study.';
    if (s.power) return 'The study lock has power. Get upstairs.';
    if (s.fuse) return 'Find where the fuse goes.';
    return 'Get into his basement.';
  }

  // ------------------------------------------------------------------ save / load
  serialize() {
    const p = this.player;
    return {
      v: SAVE_VERSION, mission: this.level.mission || 0, diff: this.diffKey,
      stats: Object.assign({}, this.stats), flags: Object.assign({}, this.flags), steps: Object.assign({}, this.steps), clues: Object.assign({}, this.clues),
      doors: this.doors.map(d => [d.id, d.target > 0.5 ? 1 : 0, d.locked ? 1 : 0, d.chained ? 1 : 0]),
      windows: this.windows.map(w => [w.id, w.glass ? 1 : 0, w.boards ? 1 : 0, w.learned ? 1 : 0]),
      props: this.props.map(pr => [pr.id, +pr.x.toFixed(2), +pr.y.toFixed(2), +pr.z.toFixed(2), pr.gone ? 1 : 0]),
      inv: p.inv.slice(), sel: p.sel,
      learn: { catches: this.learn.catches, spots: this.learn.spots, entries: this.learn.entries, traps: this.learn.traps, cams: this.learn.cams, blocked: this.learn.blocked, learns: this.learn.learns },
      traps: this.traps.map(t => [t.id, t.x, t.y, t.z, t.armed ? 1 : 0]), trapSeq: this.trapSeq,
      cams: this.cams.map(c => c.mount),
      extraPois: this.ai.extraPois,
    };
  }

  load(s) {
    if (!s || s.v !== SAVE_VERSION) return false;
    try {
      Object.assign(this.stats, s.stats); Object.assign(this.flags, s.flags); this.flags.won = false;
      Object.assign(this.steps, s.steps || {}); Object.assign(this.clues, s.clues || {});
      for (const [id, open, locked, chained] of s.doors) { const d = this.doorById[id]; if (!d) continue; d.target = d.angle = open; d.locked = !!locked; d.chained = !!chained; }
      for (const [id, glass, boards, learned] of s.windows) { const w = this.winById[id]; if (!w) continue; w.glass = !!glass; w.boards = !!boards; w.learned = !!learned; }
      for (const [id, x, y, z, gone] of s.props) { const pr = this.propById[id]; if (!pr) continue; pr.x = x; pr.y = y; pr.z = z; pr.gone = !!gone; pr.rest = false; pr.held = false; }
      const p = this.player;
      p.inv = (s.inv || [null, null, null, null]).map(id => (id && this.propById[id] && !this.propById[id].gone ? id : null));
      for (const id of p.inv) if (id) this.propById[id].held = true;
      p.sel = s.sel || 0;
      if (s.learn) Object.assign(this.learn, s.learn);
      this.traps = (s.traps || []).map(([id, x, y, z, armed]) => ({ id, x, y, z, armed: !!armed }));
      this.trapSeq = s.trapSeq || this.traps.length;
      this.cams = (s.cams || []).map(mount => ({ mount, seeT: 0, cool: 0 }));
      this.ai.extraPois = s.extraPois || [];
      if (this.flags.power) this.setPower(true);
      return true;
    } catch (e) { return false; }
  }
}

function matOf(b) {
  const m = b.m;
  const top = typeof m === 'string' ? m : m && (m.py || m.all);
  if (!top) return 'wood';
  if (top === 'checker' || top === 'tile' || top === 'counter') return 'tile';
  if (top === 'concrete' || top === 'paving' || top === 'roofflat' || top === 'brick' || top === 'shingle') return 'concrete';
  if (top === 'carpet' || top === 'fabric') return 'carpet';
  if (top === 'metal' || top === 'paint') return 'metal';
  if (top === 'hedge' || top === 'dirt') return 'grass';
  return 'wood';
}
