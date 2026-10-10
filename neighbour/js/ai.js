// The neighbour: a daily routine between points of interest, a vision cone and ears, and the
// patrol -> suspicious -> chase -> search -> patrol loop. Pure JS. Everything it needs from the
// game comes through the world object W (see world.js), so the tests can drive it with a stub.
//
// W must provide: player {x,y,z,hiding,caught}, sightRate(ai) -> number, hear(ai, noise) -> 0..1,
// path(ax,ay,az, bx,by,bz) -> {pts:[[x,y,z]...], complete}, hides[], openHide(spot) -> bool (player inside),
// catchPlayer(), kickProps(x,z) -> bool, propsUnderPlayer() -> bool, rng() -> [0,1), pois[] (routine).

import { angleWrap } from './geom.js';

export const DIFFICULTY = {
  easy:   { name: 'Easy',   walk: 1.7, run: 4.1, hear: 0.7,  detect: 0.65, range: 17, search: 8,  checkHide: 0.3,  learnEvery: 2, traps: 3, cams: 1, blocks: 1, trapHold: 2.5, perLearn: 1 },
  normal: { name: 'Normal', walk: 1.95, run: 4.7, hear: 1.0, detect: 1.0,  range: 22, search: 11, checkHide: 0.5,  learnEvery: 1, traps: 5, cams: 2, blocks: 2, trapHold: 3.5, perLearn: 1 },
  hard:   { name: 'Hard',   walk: 2.2, run: 5.25, hear: 1.35, detect: 1.4, range: 26, search: 14, checkHide: 0.75, learnEvery: 1, traps: 8, cams: 4, blocks: 3, trapHold: 4.5, perLearn: 2 },
};

export const CATCH_R = 1.05;
export const EYE = 1.85;

export class Neighbour {
  constructor(diff, start) {
    this.diff = diff;
    this.x = start.x; this.y = start.y; this.z = start.z;
    this.yaw = start.look || 0;
    this.head = 0;            // head turn relative to the body (search sweeps)
    this.state = 'patrol';
    this.aware = 0;           // 0..1+, >= 1 starts a chase
    this.anim = 'idle'; this.animT = 0;
    this.speed = 0;
    this.path = []; this.pathI = 0; this.pathOk = true; this.repathT = 0; this.goal = null;
    this.poi = null; this.poiT = 0; this.history = [];
    this.lastKnown = null; this.lostT = 0; this.seen = false; this.seenT = 99;
    this.stateT = 0; this.searchT = 0; this.searchPts = []; this.lookT = 0;
    this.stunT = 0; this.waitT = 0; this.kickT = 0;
    this.hideTarget = null; this.sawHide = null; this.openT = 0;
    this.run = false;
    this.extraPois = [];      // learned watch points
    this.events = [];
  }

  setState(s, info = {}) {
    const prev = this.state;
    this.state = s; this.stateT = 0;
    if (s === 'chase') { this.lostT = 0; this.waitT = 0; this.run = true; }
    if (s === 'suspicious') { this.goal = info.pos ? info.pos.slice() : this.goal; this.lookT = 0; this.run = !!info.run; this.newGoal = true; }
    if (s === 'search') { this.searchT = this.diff.search; this.searchPts = []; this.hideTarget = null; this.run = false; this.checkedHide = false; }
    if (s === 'patrol') { this.aware = Math.min(this.aware, 0.2); this.run = false; this.poi = null; this.path = []; this.sawHide = null; this.hideTarget = null; }
    if (prev !== s) this.events.push({ type: 'ai', from: prev, to: s });
  }

  // something hit him (thrown object)
  hit(from) {
    this.stunT = 0.8;
    this.aware = Math.min(1.2, this.aware + 0.6);
    if (from) { this.lastKnown = from.slice(); if (this.state !== 'chase') this.setState('suspicious', { pos: from, run: true }); }
    this.events.push({ type: 'hurt' });
  }

  // a camera spotted you: run to where you were
  alert(pos) {
    this.lastKnown = pos.slice();
    this.aware = Math.max(this.aware, 0.8);
    if (this.state !== 'chase') this.setState('suspicious', { pos, run: true });
  }

  teleport(p) {
    this.x = p.x; this.y = p.y; this.z = p.z; this.yaw = p.look || 0;
    this.path = []; this.pathI = 0; this.goal = null; this.head = 0;
  }

  pickPoi(W) {
    const list = W.pois.concat(this.extraPois);
    let tot = 0;
    const ok = list.filter(p => !this.history.includes(p.id));
    for (const p of ok) tot += p.w;
    let r = W.rng() * tot;
    let pick = ok[0];
    for (const p of ok) { r -= p.w; if (r <= 0) { pick = p; break; } }
    this.history.push(pick.id); if (this.history.length > 3) this.history.shift();
    return pick;
  }

  goTo(W, x, y, z, force) {
    const g = this.goal;
    if (!force && g && Math.abs(g[0] - x) < 0.3 && Math.abs(g[2] - z) < 0.3 && Math.abs(g[1] - y) < 0.5 && this.path.length) return;
    const r = W.path(this.x, this.y, this.z, x, y, z);
    this.goal = [x, y, z];
    this.path = r ? r.pts : []; this.pathI = this.path.length > 1 ? 1 : 0; this.pathOk = r ? r.complete : false;
  }

  arrived() { return this.pathI >= this.path.length; }

  // step along the path; returns true when at the end
  follow(dt, speed) {
    if (this.arrived()) { this.speed = 0; return true; }
    let left = speed * dt;
    while (left > 0 && this.pathI < this.path.length) {
      const p = this.path[this.pathI];
      const dx = p[0] - this.x, dz = p[2] - this.z;
      const d = Math.hypot(dx, dz);
      const want = Math.atan2(-dx, -dz);
      if (d > 0.05) this.turnTo(want, dt * (this.run ? 9 : 5));
      if (d <= left) {
        this.x = p[0]; this.z = p[2]; this.y = p[1]; left -= d; this.pathI++;
      } else {
        const prev = this.path[this.pathI - 1] || p;
        this.x += dx / d * left; this.z += dz / d * left;
        // height follows the segment (stairs)
        const seg = Math.hypot(p[0] - prev[0], p[2] - prev[2]);
        if (seg > 1e-3) {
          const t = 1 - Math.hypot(p[0] - this.x, p[2] - this.z) / seg;
          this.y = prev[1] + (p[1] - prev[1]) * Math.max(0, Math.min(1, t));
        }
        left = 0;
      }
    }
    this.speed = speed;
    return this.arrived();
  }

  turnTo(yaw, maxStep) {
    const d = angleWrap(yaw - this.yaw);
    this.yaw = angleWrap(this.yaw + Math.max(-maxStep, Math.min(maxStep, d)));
  }
  faceTo(x, z, dt, rate = 6) { this.turnTo(Math.atan2(-(x - this.x), -(z - this.z)), dt * rate); }

  distToPlayer(W) { const p = W.player; return Math.hypot(p.x - this.x, p.z - this.z); }

  tryCatch(W) {
    const p = W.player;
    if (p.hiding || p.caught) return false;
    if (Math.hypot(p.x - this.x, p.z - this.z) < CATCH_R && p.y - this.y < 1.55 && this.y - p.y < 1.2) {
      W.catchPlayer();
      return true;
    }
    return false;
  }

  update(dt, W) {
    this.animT += dt;
    this.stateT += dt;
    if (this.state === 'grab') { this.anim = 'grab'; this.speed = 0; return; }
    if (this.stunT > 0) { this.stunT -= dt; this.anim = 'stunned'; this.speed = 0; return; }

    // ---------------- senses
    const rate = W.sightRate(this);
    this.seen = rate > 0;
    const p = W.player;
    if (this.seen) {
      this.aware = Math.min(1.6, this.aware + rate * dt * this.diff.detect);
      this.lastKnown = [p.x, p.y, p.z];
      this.seenT = 0;
    } else {
      this.seenT += dt;
      const decay = this.state === 'patrol' ? 0.22 : this.state === 'chase' ? 0 : 0.08;
      this.aware = Math.max(0, this.aware - decay * dt);
    }
    if (this.state !== 'chase' && this.seen && this.aware >= 1) { this.setState('chase'); this.events.push({ type: 'spotted' }); }
    else if ((this.state === 'patrol' || this.state === 'search') && this.seen && this.aware >= 0.3) {
      this.setState('suspicious', { pos: this.lastKnown });
      this.events.push({ type: 'glimpse' });
    }
    for (const n of W.noises) {
      const heard = W.hear(this, n);
      if (heard <= 0) continue;
      if (this.state === 'chase') {
        if (!this.seen && n.player) { this.lastKnown = [n.x, n.y, n.z]; this.lostT = Math.max(0, this.lostT - 1.5); }
        continue;
      }
      const loud = n.radius >= 14;
      if (heard >= 0.5 || loud) {
        this.aware = Math.max(this.aware, loud ? 0.6 : 0.35);
        if (n.player) this.lastKnown = [n.x, n.y, n.z];
        this.setState('suspicious', { pos: [n.x, n.y, n.z], run: loud });
        this.events.push({ type: 'heard', kind: n.kind });
      }
    }
    // watching you dive into a wardrobe gives the game away
    if (p.hiding && this.seenT < 0.7 && (this.state === 'chase' || this.state === 'suspicious') && !this.sawHide) {
      this.sawHide = p.hiding;
    }

    // ---------------- behaviour
    switch (this.state) {
      case 'patrol': this.doPatrol(dt, W); break;
      case 'suspicious': this.doSuspicious(dt, W); break;
      case 'chase': this.doChase(dt, W); break;
      case 'search': this.doSearch(dt, W); break;
    }
    // bumping into you is enough, whatever he was doing
    if (this.state !== 'patrol' || this.distToPlayer(W) < 0.7) this.tryCatch(W);
  }

  doPatrol(dt, W) {
    if (!this.poi) {
      this.poi = this.pickPoi(W);
      this.poiT = this.poi.dur * (0.75 + W.rng() * 0.5);
      this.goTo(W, this.poi.x, this.poi.y, this.poi.z, true);
    }
    if (this.follow(dt, this.diff.walk)) {
      this.turnTo(this.poi.look, dt * 3);
      this.anim = this.poi.anim;
      this.head = Math.sin(this.stateT * 0.7) * 0.5;
      this.poiT -= dt;
      if (this.poiT <= 0) this.poi = null;
    } else { this.anim = 'walk'; this.head *= 0.9; }
  }

  doSuspicious(dt, W) {
    const g = this.goal;
    if (!g) { this.setState('patrol'); return; }
    if (this.newGoal) { this.newGoal = false; this.goTo(W, g[0], g[1], g[2], true); this.lookT = 0; }
    // pause a beat to stare toward what caught his attention
    if (this.stateT < 0.6 && !this.run) { this.faceTo(g[0], g[2], dt); this.anim = 'search'; this.speed = 0; return; }
    if (this.follow(dt, this.run ? this.diff.run * 0.85 : this.diff.walk * 1.2)) {
      this.anim = 'search';
      this.lookT += dt;
      this.head = Math.sin(this.lookT * 2.2) * 0.9;
      if (this.lookT > 3.5) this.setState('search');
    } else { this.anim = this.run ? 'run' : 'walk'; this.head *= 0.85; }
  }

  doChase(dt, W) {
    const p = W.player;
    this.head *= 0.8;
    if (p.hiding) {
      // he saw where you went: straight to that wardrobe
      if (this.sawHide) { this.setState('search'); this.hideTarget = this.sawHide; return; }
      if (this.seenT > 0.2) { this.setState('search'); return; }
    }
    this.repathT -= dt;
    if (this.seen) {
      this.lostT = 0;
      if (this.repathT <= 0) { this.goTo(W, p.x, p.y, p.z, true); this.repathT = 0.35; }
    } else {
      this.lostT += dt;
      const lk = this.lastKnown;
      if (lk && this.repathT <= 0) { this.goTo(W, lk[0], lk[1], lk[2]); this.repathT = 0.5; }
    }
    const done = this.follow(dt, this.diff.run);
    this.anim = done ? 'search' : 'run';
    if (done) {
      if (this.seen) {
        // you're somewhere he can't walk to (a crate stack, a roof): glare, then knock the crates over
        this.faceTo(p.x, p.z, dt, 8);
        this.waitT += dt;
        if (this.waitT > 2.2 && W.propsUnderPlayer() && this.distToPlayer(W) < 2.6) {
          if (W.kickProps(this.x, this.z)) { this.anim = 'kick'; this.waitT = 0.8; this.events.push({ type: 'kick' }); }
        }
        if (this.waitT > 8) this.setState('search');
      } else if (this.lostT > 1.2) {
        this.setState('search');
      }
    } else this.waitT = Math.max(0, this.waitT - dt);
    if (this.lostT > 7) this.setState('search');
  }

  doSearch(dt, W) {
    this.searchT -= dt;
    const lk = this.lastKnown || [this.x, this.y, this.z];
    // check a hiding spot: the one he saw you use, or sometimes the nearest one
    if (!this.hideTarget && !this.checkedHide && this.stateT > 1.0) {
      this.checkedHide = true;
      if (W.rng() < this.diff.checkHide) {
        let best = null, bd = 9;
        for (const h of W.hides) {
          if (Math.abs(h.y - lk[1]) > 1.5) continue;
          const d = Math.hypot(h.x - lk[0], h.z - lk[2]);
          if (d < bd) { bd = d; best = h; }
        }
        if (best) this.hideTarget = best.id;
      }
    }
    if (this.hideTarget) {
      const h = W.hides.find(s => s.id === this.hideTarget);
      if (!h) { this.hideTarget = null; return; }
      if (this.openT > 0) {
        this.openT += dt; this.anim = 'open'; this.speed = 0;
        this.faceTo(h.x, h.z, dt, 8);
        if (this.openT > 0.9 && !this.opened) {
          this.opened = true;
          if (W.openHide(h)) { W.catchPlayer(); return; }
        }
        if (this.openT > 1.8) { this.openT = 0; this.opened = false; this.hideTarget = null; this.sawHide = null; }
        return;
      }
      if (!this.goal || Math.abs(this.goal[0] - h.face[0]) > 0.3 || Math.abs(this.goal[2] - h.face[1]) > 0.3) this.goTo(W, h.face[0], h.y, h.face[1], true);
      if (this.follow(dt, this.sawHide ? this.diff.run * 0.8 : this.diff.walk * 1.2)) { this.openT = 0.001; this.opened = false; }
      else this.anim = this.sawHide ? 'run' : 'walk';
      return;
    }
    if (this.arrived()) {
      this.lookT += dt;
      this.anim = 'search';
      this.head = Math.sin(this.lookT * 2) * 1.0;
      if (this.lookT > 1.6) {
        this.lookT = 0;
        // wander to a point near where he lost you
        const a = W.rng() * Math.PI * 2, r = 1.5 + W.rng() * 3.5;
        this.goTo(W, lk[0] + Math.cos(a) * r, lk[1], lk[2] + Math.sin(a) * r, true);
      }
    } else { this.follow(dt, this.diff.walk * 1.15); this.anim = 'walk'; this.head *= 0.9; }
    if (this.searchT <= 0) this.setState('patrol');
  }
}
