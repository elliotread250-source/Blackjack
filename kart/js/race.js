// Race state: karts, laps/checkpoints, positions, item boxes and thrown items.
// Pure logic; the renderer, audio and network read `events` and `netOut` after each step.
import { DT, makeKart, stepKart, hitKart, collideKarts, startRespawn } from './physics.js';
import { SURF } from './trackgen.js';
import { rollItem, rng } from './data.js';
import { Bot, botThink } from './bot.js';

const SHELL_SPEED = 50;
const MAX_BANANAS = 24;

export class Race {
  // opts: { laps, mode: 'race'|'gp'|'tt'|'online', countdown (s), difficulty, seed }
  constructor(track, opts = {}) {
    this.track = track;
    this.laps = opts.laps || 3;
    this.mode = opts.mode || 'race';
    this.difficulty = opts.difficulty || 'normal';
    this.time = -(opts.countdown ?? 3);
    this.phase = 'countdown';
    this.karts = [];
    this.bots = [];
    this.events = [];
    this.netOut = [];
    this.bananas = [];
    this.shells = [];
    this.itemSeq = 0;
    this.finishOrder = [];
    this.boxes = [];
    this.seed = opts.seed || 1;
    this.rnd = rng(this.seed * 9973 + 17);
    this.ownerId = opts.ownerId ?? 'p';
    this.noItems = !!opts.noItems;
    for (const row of track.boxRows) for (const d of row.ds) {
      const p = track.pointAt(row.s, d);
      this.boxes.push({ i: this.boxes.length, s: row.s, d, x: p.x, y: p.y + 1.2, z: p.z, respawn: 0 });
    }
  }

  // Add a kart on grid slot `slot`. who: { id, name, cfg, player?, bot?, remote?, botTraits? }
  addKart(who, slot) {
    const sp = this.track.gridSlot(slot);
    const k = makeKart(who.cfg.type, sp, { id: who.id });
    k.meta = who;
    k.name = who.name;
    k.cfg = who.cfg;
    k.slot = slot;
    k.local = !who.remote;
    k.isPlayer = !!who.player;
    k.lapsDone = 0; k.cpi = 0; k.lapStart = 0; k.bestLap = Infinity; k.lapTimes = [];
    k.finished = false; k.finishTime = null; k.place = slot + 1;
    k.item = null; k.itemCount = 0; k.rollT = 0; k.rollItem = null;
    k.ground0 = sp.y;
    k.hint = this.track.idx(this.track.wrapS(sp.s));
    k.sPrev = this.track.wrapS(sp.s); k.s = k.sPrev;
    k.progress = sp.s;
    k.rocketT = 0; k.rocketOk = false;
    this.karts.push(k);
    if (who.bot) { const b = new Bot(k, this, who.botTraits || {}); this.bots.push(b); k.bot = b; }
    return k;
  }

  kartById(id) { return this.karts.find(k => k.meta.id === id); }

  place(k) { return k.place; }

  // fraction 0 (leading) .. 1 (last) for item odds
  posFrac(k) { const n = this.karts.filter(x => !x.gone).length; return n > 1 ? (k.place - 1) / (n - 1) : 0; }

  step(dt = DT) {
    const tr = this.track;
    this.time += dt;
    if (this.phase === 'countdown') {
      // rocket start: hold accelerate in the last second of the countdown, not before
      for (const k of this.karts) if (k.local) {
        if (k.in.throttle > 0.5) { k.rocketT += dt; } else k.rocketT = 0;
      }
      if (this.time >= 0) {
        this.phase = 'race';
        this.events.push({ type: 'go' });
        for (const k of this.karts) if (k.local) {
          if (k.rocketT > 0.15 && k.rocketT < 1.1) { k.boostT = 1.0; k.boostKind = 2; k.ev.push({ type: 'rocket' }); }
          k.lapStart = 0;
        }
      } else {
        for (const k of this.karts) { if (k.bot) k.bot.preStart(dt); }
        return;
      }
    }
    // bots / autopilot
    for (const b of this.bots) if (b.k.local && !b.k.gone) botThink(b, this, dt);
    for (const k of this.karts) if (k.isPlayer && k.finished && k.local) { if (!k.auto) k.auto = new Bot(k, this, { skill: 0.7 }); botThink(k.auto, this, dt); }
    // physics
    for (const k of this.karts) {
      if (!k.local || k.gone) continue;
      stepKart(k, tr, dt);
      // item use
      if (k.in.item && !k._itemHeld) this.useItem(k);
      k._itemHeld = k.in.item;
      if (k.rollT > 0) { k.rollT -= dt; if (k.rollT <= 0) { k.item = k.rollItem; k.itemCount = 1; k.ev.push({ type: 'itemGot', item: k.item }); } }
      // stuck: player gets a hint, bots respawn eventually
      this.laps_(k);
    }
    collideKarts(this.karts.filter(k => !k.gone), k => k.local);
    this.stepBoxes(dt);
    this.stepItems(dt);
    this.rank();
    // collect kart events
    for (const k of this.karts) {
      if (k.ev.length) { for (const e of k.ev) { e.kart = k; this.events.push(e); } k.ev.length = 0; }
    }
  }

  laps_(k) {
    if (k.finished) return;
    const tr = this.track, L = tr.L, cps = tr.checkpoints;
    let guard = 0;
    while (k.progress >= k.lapsDone * L + cps[k.cpi] && guard++ < 4) {
      k.cpi++;
      if (k.cpi === cps.length) {
        k.cpi = 0;
        k.lapsDone++;
        const lt = this.time - k.lapStart;
        k.lapTimes.push(lt);
        k.bestLap = Math.min(k.bestLap, lt);
        k.lapStart = this.time;
        if (k.lapsDone >= this.laps) {
          k.finished = true; k.finishTime = this.time;
          this.finishOrder.push(k);
          k.ev.push({ type: 'finish', time: this.time, place: this.finishOrder.length });
          this.netOut.push({ e: 'fin', id: k.meta.id, time: Math.round(this.time * 1000), best: Math.round(k.bestLap * 1000) });
        } else {
          k.ev.push({ type: 'lap', lap: k.lapsDone + 1, time: lt, final: k.lapsDone + 1 === this.laps });
        }
      }
    }
  }

  // positions: finished karts by finish time, the rest by progress along the course
  rank() {
    const list = this.karts.filter(k => !k.gone);
    list.sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return this.totalProgress(b) - this.totalProgress(a);
    });
    list.forEach((k, i) => { k.place = i + 1; });
    this.order = list;
  }
  totalProgress(k) {
    // never rank someone ahead of a checkpoint they have not reached
    return k.progress;
  }

  // ---------- item boxes
  stepBoxes(dt) {
    for (const b of this.boxes) {
      if (b.respawn > 0) { b.respawn -= dt; continue; }
      if (this.noItems) continue;
      for (const k of this.karts) {
        if (!k.local || k.gone || k.respawnT > 0) continue;
        const dx = k.x - b.x, dz = k.z - b.z, dy = k.y + 0.8 - b.y;
        if (dx * dx + dz * dz < 2.3 * 2.3 && Math.abs(dy) < 2.6) {
          b.respawn = 2.6;
          this.events.push({ type: 'box', box: b, kart: k });
          this.netOut.push({ e: 'box', i: b.i });
          if (!k.item && k.rollT <= 0) {
            k.rollT = k.isPlayer ? 1.1 : 0.6;
            k.rollItem = rollItem(this.posFrac(k), this.rnd);
            k.ev.push({ type: 'itemRoll' });
          }
          break;
        }
      }
    }
  }
  remoteBox(i) { const b = this.boxes[i]; if (b && b.respawn <= 0) { b.respawn = 2.6; this.events.push({ type: 'box', box: b, kart: null }); } }

  // ---------- items
  useItem(k) {
    if (!k.item || k.rollT > 0 || k.respawnT > 0 || k.spinT > 0) return false;
    const it = k.item;
    k.itemCount--;
    if (k.itemCount <= 0) { k.item = null; k.itemCount = 0; }
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    if (it === 'boost') {
      k.boostT = Math.max(k.boostT, 1.5); k.boostKind = 3;
      k.ev.push({ type: 'useBoost' });
      this.netOut.push({ e: 'fx', id: k.meta.id, k: 'boost' });
    } else if (it === 'shield') {
      k.shieldT = 9;
      k.ev.push({ type: 'useShield' });
      this.netOut.push({ e: 'fx', id: k.meta.id, k: 'shield' });
    } else if (it === 'banana') {
      const back = (k.P.radius + 1.2);
      const g = this.track.ground(k.x - fx * back, k.z - fz * back, k.hint);
      const ent = { id: `${k.meta.id}.${++this.itemSeq}`, owner: k.meta.id, x: k.x - fx * back, z: k.z - fz * back, y: g.surf === SURF.VOID ? k.y : g.h, hint: g.i, t: 0 };
      this.addBanana(ent);
      this.netOut.push({ e: 'ban', id: ent.id, o: ent.owner, x: r2(ent.x), y: r2(ent.y), z: r2(ent.z) });
      k.ev.push({ type: 'dropBanana' });
    } else if (it === 'shell') {
      const backward = k.in.back;
      const dir = backward ? -1 : 1;
      const spd = Math.max(SHELL_SPEED, (k.vf || 0) * dir + 22);
      const off = (k.P.radius + 1.0) * dir;
      const ent = { id: `${k.meta.id}.${++this.itemSeq}`, owner: k.meta.id, x: k.x + fx * off, z: k.z + fz * off, y: k.y + 0.5, vx: fx * spd * dir, vz: fz * spd * dir, hint: k.hint, t: 0, bounces: 0 };
      this.addShell(ent);
      this.netOut.push({ e: 'sh', id: ent.id, o: ent.owner, x: r2(ent.x), y: r2(ent.y), z: r2(ent.z), vx: r2(ent.vx), vz: r2(ent.vz) });
      k.ev.push({ type: 'fireShell' });
    }
    return true;
  }
  addBanana(ent) {
    if (this.bananas.some(b => b.id === ent.id)) return;
    this.bananas.push(ent);
    if (this.bananas.length > MAX_BANANAS) { const old = this.bananas.shift(); this.events.push({ type: 'itemGone', id: old.id }); }
    this.events.push({ type: 'bananaAdd', ent });
  }
  addShell(ent) {
    if (this.shells.some(b => b.id === ent.id)) return;
    ent.hint = ent.hint ?? -1;
    this.shells.push(ent);
    this.events.push({ type: 'shellAdd', ent });
  }
  removeItem(id, why = 'hit') {
    let i = this.bananas.findIndex(b => b.id === id);
    if (i >= 0) { const e = this.bananas[i]; this.bananas.splice(i, 1); this.events.push({ type: 'itemGone', id, why, x: e.x, y: e.y, z: e.z }); return true; }
    i = this.shells.findIndex(b => b.id === id);
    if (i >= 0) { const e = this.shells[i]; this.shells.splice(i, 1); this.events.push({ type: 'itemGone', id, why, x: e.x, y: e.y, z: e.z }); return true; }
    return false;
  }

  stepItems(dt) {
    const tr = this.track;
    for (let n = this.shells.length - 1; n >= 0; n--) {
      const s = this.shells[n];
      s.t += dt;
      // a couple of substeps so fast shells can't skip walls
      for (let sub = 0; sub < 2; sub++) {
        const h = dt / 2;
        s.x += s.vx * h; s.z += s.vz * h;
        const g = tr.ground(s.x, s.z, s.hint);
        s.hint = g.i;
        const b = tr.bounds(g.i, g.t, g.s, g.d);
        let push = 0;
        if (g.d < b.lo + 0.5 && b.wallLo) push = b.lo + 0.5 - g.d;
        else if (g.d > b.hi - 0.5 && b.wallHi) push = b.hi - 0.5 - g.d;
        if (push) {
          s.x += g.rx * push; s.z += g.rz * push;
          const nx = g.rx * Math.sign(push), nz = g.rz * Math.sign(push);
          const vn = s.vx * nx + s.vz * nz;
          if (vn < 0) { s.vx -= 2 * vn * nx; s.vz -= 2 * vn * nz; s.bounces++; this.events.push({ type: 'shellBounce', x: s.x, y: s.y, z: s.z }); }
        }
        for (const o of tr.obstacles) {
          const dx = s.x - o.x, dz = s.z - o.z, rr = o.r + 0.5;
          if (dx * dx + dz * dz < rr * rr) { const d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d; s.x = o.x + nx * rr; s.z = o.z + nz * rr; const vn = s.vx * nx + s.vz * nz; if (vn < 0) { s.vx -= 2 * vn * nx; s.vz -= 2 * vn * nz; s.bounces++; } }
        }
        if (g.surf === SURF.VOID) { s.vy = (s.vy || 0) - 30 * h; s.y += s.vy * h; } else { s.y += (g.h + 0.5 - s.y) * Math.min(1, h * 30); s.vy = 0; }
        s.base = g.base;
      }
      if (s.t > 6 || s.bounces > 6 || s.y < (s.base ?? s.y) - 12) { this.removeItem(s.id, 'expire'); continue; }
      // hits on karts we own
      for (const k of this.karts) {
        if (!k.local || k.gone || k.respawnT > 0) continue;
        if (k.meta.id === s.owner && s.t < 0.5) continue;
        const dx = k.x - s.x, dz = k.z - s.z, dy = k.y + 0.5 - s.y;
        const rr = k.P.radius + 0.6;
        if (dx * dx + dz * dz < rr * rr && Math.abs(dy) < 2) {
          const hit = hitKart(k, 'shell');
          this.removeItem(s.id, hit ? 'hit' : 'blocked');
          this.netOut.push({ e: 'hit', id: s.id, v: k.meta.id });
          break;
        }
      }
    }
    // shells vs bananas
    for (let n = this.shells.length - 1; n >= 0; n--) {
      const s = this.shells[n];
      for (const b of this.bananas) {
        const dx = b.x - s.x, dz = b.z - s.z;
        if (dx * dx + dz * dz < 1.6 && Math.abs(b.y - s.y) < 2) { if (this.isMine(s.owner)) { this.netOut.push({ e: 'hit', id: s.id, v: '' }, { e: 'hit', id: b.id, v: '' }); } this.removeItem(s.id); this.removeItem(b.id); break; }
      }
    }
    for (let n = this.bananas.length - 1; n >= 0; n--) {
      const b = this.bananas[n];
      b.t += dt;
      for (const k of this.karts) {
        if (!k.local || k.gone || k.respawnT > 0) continue;
        if (k.meta.id === b.owner && b.t < 0.8) continue;
        const dx = k.x - b.x, dz = k.z - b.z;
        const rr = k.P.radius * 0.8 + 0.5;
        if (dx * dx + dz * dz < rr * rr && Math.abs(k.y - b.y) < 1.8) {
          const hit = hitKart(k, 'banana');
          this.removeItem(b.id, hit ? 'hit' : 'blocked');
          this.netOut.push({ e: 'hit', id: b.id, v: k.meta.id });
          break;
        }
      }
    }
  }
  isMine(ownerId) { const k = this.kartById(ownerId); return !!(k && k.local); }

  // standings for the results table
  results() {
    const out = this.order.map(k => ({ id: k.meta.id, name: k.name, cfg: k.cfg, finished: k.finished, time: k.finished ? k.finishTime : null, best: Number.isFinite(k.bestLap) ? k.bestLap : null, isPlayer: k.isPlayer, bot: !!k.meta.bot, progress: k.progress }));
    // estimate times for karts still racing from their average pace
    const L = this.track.L;
    for (const r of out) if (!r.finished) {
      const k = this.kartById(r.id);
      const done = Math.max(1, k.progress);
      const pace = this.time / done;
      r.est = this.time + Math.max(0, this.laps * L - k.progress) * Math.min(pace, 0.08);
    }
    return out;
  }
}
const r2 = v => Math.round(v * 100) / 100;
export { startRespawn };
