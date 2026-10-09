// One race on screen: builds the scene, runs the fixed-step simulation, drives the camera,
// effects, sound and HUD, and (online) exchanges kart states with the other players.
import * as THREE from 'three';
import { Track, SURF } from './trackgen.js';
import { TRACK_DEFS } from './tracks.js';
import { Race } from './race.js';
import { DT, startRespawn } from './physics.js';
import { KartView } from './kartmodel.js';
import { buildTrackScene } from './trackmesh.js';
import { Effects, SPARK } from './fx.js';
import { packState, RemoteBuffer } from './net.js';
import { store } from './store.js';
import { Bot, botThink } from './bot.js';

const trackCache = new Map();
export function getTrack(i) {
  if (!trackCache.has(i)) trackCache.set(i, new Track(TRACK_DEFS[i]));
  return trackCache.get(i);
}

const OFF_COLORS = { [SURF.GRASS]: '#8fc85a', [SURF.SAND]: '#d6b07a', [SURF.SNOW]: '#ffffff', [SURF.DIRT]: '#9a7050', [SURF.LAVA]: '#ff7a2a' };
const tmpV = new THREE.Vector3();
const lerpAngle = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * t; };

export class GameSession {
  // opts: { mode, trackIndex, laps, difficulty, entrants:[{id,name,cfg,player,bot,remote}], seed, online:{net, go, me, host}, quality, ttBoosts, ghost }
  constructor(app, opts) {
    this.app = app;
    this.opts = opts;
    this.mode = opts.mode;
    this.quality = opts.quality;
    this.track = getTrack(opts.trackIndex);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, 1, 0.3, 2200);
    this.acc = 0;
    this.timeScale = 1;
    this.paused = false;
    this.finishedT = null;
    this.ended = false;
    this.sendT = 0;
    this.camYaw = 0;
    this.fov = 72;
    this.shake = 0;
    this.lastCount = 4;
    this.remote = new Map(); // id -> RemoteBuffer
    this.online = opts.online || null;
    this.t = 0;
  }

  build() {
    const tr = this.track, sc = this.scene, q = this.quality;
    this.world = buildTrackScene(tr, q);
    sc.add(this.world.group);
    const th = this.world.theme;
    sc.fog = new THREE.Fog(th.fog, th.fogNear, th.fogFar);
    sc.background = new THREE.Color(th.skyHorizon);
    this.hemi = new THREE.HemisphereLight(th.hemiSky, th.hemiGround, th.hemiI);
    sc.add(this.hemi);
    this.sun = new THREE.DirectionalLight(th.sun, th.sunI);
    this.sunDir = new THREE.Vector3(...th.sunDir).normalize();
    if (q === 'high') {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(1024, 1024);
      const c = this.sun.shadow.camera;
      c.left = -38; c.right = 38; c.top = 38; c.bottom = -38; c.near = 1; c.far = 160;
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.04;
    }
    sc.add(this.sun, this.sun.target);
    // race + karts
    const race = new Race(tr, { laps: this.opts.laps, mode: this.mode, difficulty: this.opts.difficulty, seed: this.opts.seed, ownerId: this.opts.me, noItems: this.mode === 'tt', countdown: 3 });
    this.race = race;
    this.views = new Map();
    this.opts.entrants.forEach((e, slot) => {
      const k = race.addKart({ ...e }, e.slot ?? slot);
      if (e.player) this.player = k;
      const v = new KartView(e.cfg, q, { castShadow: q === 'high' });
      sc.add(v.root);
      this.views.set(k, v);
      if (e.remote) this.remote.set(e.id, new RemoteBuffer());
    });
    if (this.mode !== 'online') race.refKart = this.player;
    if (this.mode === 'tt') { this.player.item = 'boost'; this.player.itemCount = 3; }
    this.fx = new Effects(sc, q);
    // ghost (time trial)
    if (this.opts.ghost && this.opts.ghost.samples && this.opts.ghost.samples.length > 8) {
      const gv = new KartView(this.opts.ghost.cfg, 'low');
      gv.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.32, depthWrite: false }); o.castShadow = false; } });
      sc.add(gv.root);
      this.ghostView = gv;
      this.ghost = this.opts.ghost;
    }
    this.rec = [];
    // first camera placement
    const p = this.player;
    this.camYaw = p.yaw;
    this.camera.position.set(p.x - Math.sin(p.yaw) * 8, p.y + 3, p.z - Math.cos(p.yaw) * 8);
    this.app.hud.setupRace(tr, this.opts.laps, this.opts.entrants.length);
    // name labels: online players (and bots, dimmer)
    this.labelKarts = race.karts.filter(k => k !== p);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.baseFov = w < h ? 82 : w / h < 1.5 ? 74 : 70;
    this.camera.updateProjectionMatrix();
    if (this.fx) this.fx.setScale(h, this.fov);
  }

  // ---------- network glue
  onState(id, ts, s) { const b = this.remote.get(id); if (b) b.push(ts, s); }
  onBots(ts, list) { for (const [id, s] of list) { const k = this.race.kartById(id); if (k && !k.local) this.onState(id, ts, s); } }
  onEvent(fromId, e) {
    const r = this.race;
    if (e.e === 'box' && Number.isInteger(e.i)) r.remoteBox(e.i);
    else if (e.e === 'ban' && typeof e.id === 'string') r.addBanana({ id: e.id, owner: String(e.o || fromId), x: +e.x || 0, y: +e.y || 0, z: +e.z || 0, hint: -1, t: 0 });
    else if (e.e === 'sh' && typeof e.id === 'string') r.addShell({ id: e.id, owner: String(e.o || fromId), x: +e.x || 0, y: +e.y || 0, z: +e.z || 0, vx: +e.vx || 0, vz: +e.vz || 0, hint: -1, t: 0, bounces: 0 });
    else if (e.e === 'hit' && typeof e.id === 'string') r.removeItem(e.id, e.v ? 'hit' : 'expire');
    else if (e.e === 'fx') {
      const k = r.kartById(e.id);
      if (k) this.playAt(e.k === 'boost' ? 'boost' : 'shield', k, 0.8);
    }
  }
  onFin(id, timeMs) {
    const k = this.race.kartById(id);
    if (k && !k.local && !k.finished) { k.finished = true; k.finishTime = timeMs / 1000; }
  }
  kartLeft(id) {
    const k = this.race.kartById(id);
    if (!k) return;
    k.gone = true;
    const v = this.views.get(k);
    if (v) { this.fx.dropKart(v); v.dispose(); this.views.delete(k); }
  }
  // the host left: we drive the bots from where they are now
  adoptBots() {
    const r = this.race;
    for (const k of r.karts) {
      if (!k.meta.bot || k.local || k.gone) continue;
      k.local = true;
      k.hint = -1; k.sPrev = null; k.respawnT = 0; k.spinT = 0;
      const L = this.track.L, cps = this.track.checkpoints;
      k.cpi = 0;
      while (k.cpi < cps.length - 1 && k.progress >= k.lapsDone * L + cps[k.cpi]) k.cpi++;
      const g = this.track.ground(k.x, k.z, -1);
      k.s = g.s; k.sPrev = g.s; k.hint = g.i; k.safeS = g.s; k.safeD = 0;
      k.grounded = true; k.y = g.h;
      if (!k.bot) { k.bot = new Bot(k, r, {}); r.bots.push(k.bot); }
    }
  }

  applyRemote(now) {
    const tr = this.track;
    for (const k of this.race.karts) {
      if (k.local || k.gone) continue;
      const buf = this.remote.get(k.meta.id);
      if (!buf) continue;
      const s = buf.sample(now - 110);
      if (!s) continue;
      k.x = s.x; k.y = s.y; k.z = s.z; k.yaw = s.yaw; k.vx = s.vx; k.vy = s.vy; k.vz = s.vz;
      k.speed = s.speed; k.vf = s.speed; k.steer = s.steer; k.drift = s.drift; k.driftStage = s.driftStage;
      k.progress = s.progress; k.lapsDone = s.lapsDone;
      if (s.finished && !k.finished) { k.finished = true; k.finishTime = k.finishTime ?? this.race.time; }
      k.boostT = s.boost ? 0.5 : 0; k.boostKind = s.boostKind; k.spinT = s.spin ? 0.5 : 0; k.spinAng = s.spinAng; k.shieldT = s.shield ? 1 : 0;
      k.grounded = !s.air; k.respawnT = s.rescue ? 0.5 : 0; k.hiddenRemote = s.hidden; k.pitch = s.pitch; k.roll = s.roll;
      k.item = s.item; k.rollT = s.rolling ? 0.5 : 0;
      const g = tr.locate(k.x, k.z, k.hint);
      k.hint = g.i; k.s = g.s; k.d = g.d;
      k.surf = tr.surfaceAt(g.i, g.t, g.s, g.d);
    }
  }

  // ---------- main update
  update(dt, inp) {
    const r = this.race, p = this.player, app = this.app;
    this.t += dt;
    // input -> player kart
    if (this.autopilot && !p.finished && r.phase === 'race') {
      if (!this.autoBot) this.autoBot = new Bot(p, r, { skill: 0.9 });
      botThink(this.autoBot, r, dt);
      if (p.in.hop) { this.hopQueued = true; p.in.hop = false; }
    } else if (!p.finished) {
      p.in.throttle = inp.throttle; p.in.steer = inp.steer; p.in.drift = inp.drift; p.in.hop = false; p.in.item = inp.item;
      p.in.back = inp.back || inp.throttle < -0.5;
      if (inp.hop) this.hopQueued = true;
      if (inp.resetPress && r.phase === 'race' && p.respawnT <= 0) startRespawn(p, 'manual');
    }
    // simulation
    let steps = 0;
    if (this.online) {
      const T = (this.online.net.serverNow() - this.online.go) / 1000;
      if (r.phase === 'countdown' && T < -0.05 && r.time < T - 0.5) r.time = T;
      while (r.time + DT <= T && steps < 30) { this.stepOnce(); steps++; }
      if (T - r.time > 0.6) r.time = T - DT;
      this.applyRemote(this.online.net.serverNow());
    } else if (!this.paused) {
      this.acc += dt * this.timeScale;
      const maxSteps = this.timeScale > 1 ? 400 : 12;
      while (this.acc >= DT && steps < maxSteps) { this.stepOnce(); this.acc -= DT; steps++; }
      if (this.acc > DT * 4) this.acc = 0;
    }
    if (steps) this.hopQueued = false;
    // countdown display
    if (r.phase === 'countdown') {
      const n = Math.ceil(-r.time);
      if (n !== this.lastCount && n <= 3 && n >= 1) { this.lastCount = n; app.hud.banner(String(n), '', 900); app.sound.play('count'); }
    }
    // online: share our kart (and bots if we are host) ~15x a second
    if (this.online) {
      this.sendT -= dt;
      if (this.sendT <= 0 && r.phase !== 'countdown') {
        this.sendT = 1 / 15;
        const net = this.online.net;
        const ts = Math.round(net.serverNow());
        net.send({ t: 'st', ts, s: packState(p) });
        const bots = r.karts.filter(k => k.meta.bot && k.local && !k.gone);
        if (bots.length) net.send({ t: 'bots', ts, b: bots.map(k => [k.meta.id, packState(k)]) });
      }
      for (const e of r.netOut) {
        if (e.e === 'fin') {
          const k = r.kartById(e.id);
          if (k && k.meta.bot) this.online.net.send({ t: 'fin', bot: e.id, time: e.time, best: e.best });
          else if (k === p) this.online.net.send({ t: 'fin', time: e.time, best: e.best });
        } else this.online.net.send({ t: 'ev', e });
      }
    }
    r.netOut.length = 0;
    this.handleEvents();
    this.visuals(dt);
    this.updateCamera(dt, inp);
    this.updateAudio(dt);
    this.updateHud(dt);
    // end of race (offline): a few seconds after the player finishes
    if (p.finished && this.finishedT === null) this.finishedT = this.t;
    if (!this.online && this.finishedT !== null && !this.ended && this.t - this.finishedT > 3.2) {
      this.ended = true;
      app.raceOver(this);
    }
  }

  stepOnce() {
    const r = this.race, p = this.player;
    if (this.hopQueued) { p.in.hop = true; }
    const prev = this.prevPos || (this.prevPos = new Map());
    for (const k of r.karts) if (k.local) prev.set(k, [k.x, k.y, k.z, k.yaw]);
    r.step(DT);
    p.in.hop = false;
    this.hopQueued = false;
    // ghost recording (time trial)
    if (this.mode === 'tt' && r.phase === 'race' && !p.finished) {
      const lt = r.time - p.lapStart;
      if (this.recLap !== p.lapsDone) { this.recLap = p.lapsDone; this.rec = []; }
      if (this.rec.length === 0 || lt - this.rec[this.rec.length - 1][0] >= 0.1) this.rec.push([Math.round(lt * 100) / 100, Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10, Math.round(p.yaw * 100) / 100]);
    }
  }

  playAt(name, k, vol = 1) {
    const p = this.player;
    const d = Math.hypot(k.x - p.x, k.z - p.z);
    const v = k === p ? 1 : Math.max(0, 1 - d / 70) * 0.8;
    if (v > 0.03) this.app.sound.play(name, { vol: v * vol });
  }

  handleEvents() {
    const r = this.race, p = this.player, app = this.app, fx = this.fx;
    for (const e of r.events) {
      const k = e.kart;
      switch (e.type) {
        case 'go': app.hud.banner('GO!', '', 900); app.sound.play('go'); break;
        case 'lap':
          if (k === p) {
            if (e.final) { app.hud.banner('FINAL LAP', '', 1800); app.sound.play('final'); }
            else { app.hud.banner(`LAP ${e.lap}`, '', 1200); app.sound.play('lap'); }
            this.onLapDone(e.time);
          }
          break;
        case 'finish':
          if (k === p) {
            this.onLapDone(k.lapTimes[k.lapTimes.length - 1]);
            const place = p.place;
            app.hud.banner(place <= 3 && this.mode !== 'tt' ? `${place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'} PLACE!` : 'FINISH!', this.mode === 'tt' ? fmt(e.time) : '', 3000);
            app.sound.play(place <= 3 || this.mode === 'tt' ? 'finish' : 'lose');
            if (place <= 3 && this.mode !== 'tt') { fx.confetti(p.x, p.y + 2, p.z); app.confetti(); }
          }
          break;
        case 'box': {
          const b = e.box;
          fx.sparks(b.x, b.y, b.z, 14, SPARK[(Math.random() * 4) | 0]);
          if (k) this.playAt('box', k, 0.7);
          break;
        }
        case 'itemRoll': if (k === p) this.rollSound = 0; break;
        case 'itemGot': if (k === p) app.sound.play('itemGot'); break;
        case 'useBoost': this.playAt('boost', k); if (k === p) this.shake = 0.15; break;
        case 'useShield': this.playAt('shield', k); break;
        case 'dropBanana': this.playAt('banana', k); break;
        case 'fireShell': this.playAt('shell', k); break;
        case 'pad': this.playAt('pad', k, 0.8); break;
        case 'rocket': this.playAt('rocket', k); break;
        case 'miniTurbo': this.playAt('mt' + e.stage, k, 0.9); break;
        case 'driftStage': if (k === p) app.sound.play('stage', { stage: e.stage }); break;
        case 'hop': if (k === p) app.sound.play('hop'); break;
        case 'wall': fx.sparks(e.x, e.y, e.z, Math.min(16, 3 + e.impact | 0)); this.playAt('wall', k, Math.min(1, e.impact / 14)); if (k === p) this.shake = Math.min(0.4, e.impact * 0.02); break;
        case 'bump': fx.sparks(e.x, e.y, e.z, 8, SPARK[0]); this.playAt('bump', k, Math.min(1, e.impact / 10)); if (k === p) this.shake = 0.25; break;
        case 'spun': this.playAt('hit', k); if (k === p) this.shake = 0.5; break;
        case 'shieldPop': this.playAt('shieldPop', k); break;
        case 'land': if (k === p) { app.sound.play('land', { vol: Math.min(1, e.impact / 12) }); this.shake = Math.min(0.3, e.impact * 0.015); } break;
        case 'respawn': if (k === p) { app.sound.play(e.reason === 'lava' ? 'splash' : 'respawn'); } if (e.reason === 'lava') fx.explode(k.x, k.y, k.z, 0.5); break;
        case 'respawned': if (k === p) app.sound.play('rescued'); break;
        case 'bananaAdd': fx.addBanana(e.ent); break;
        case 'shellAdd': fx.addShell(e.ent); break;
        case 'itemGone': fx.removeItem(e.id, e.x, e.y, e.z, e.why); break;
        case 'shellBounce': fx.sparks(e.x, e.y + 0.3, e.z, 5, SPARK[2]); break;
      }
    }
    r.events.length = 0;
  }

  onLapDone(lt) {
    if (this.mode !== 'tt' || !Number.isFinite(lt)) return;
    const key = 'ghost.' + this.track.id;
    const old = store.get(key, null);
    if (!old || lt < old.time) {
      const samples = this.rec.slice();
      store.set(key, { time: lt, cfg: this.player.cfg, samples });
      this.ghost = { time: lt, cfg: this.player.cfg, samples };
      this.app.hud.banner('NEW BEST LAP', fmt(lt), 1800);
      if (!this.ghostView) {
        const gv = new KartView(this.player.cfg, 'low');
        gv.root.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.32, depthWrite: false }); o.castShadow = false; } });
        this.scene.add(gv.root);
        this.ghostView = gv;
      }
    }
    this.rec = [];
  }

  visuals(dt) {
    const r = this.race, p = this.player;
    const alpha = this.online ? 1 : Math.min(1, this.acc / DT);
    for (const [k, v] of this.views) {
      if (k.gone) { v.root.visible = false; continue; }
      let x = k.x, y = k.y, z = k.z, yaw = k.yaw;
      const pv = this.prevPos && this.prevPos.get(k);
      if (pv && k.local && Math.hypot(pv[0] - x, pv[2] - z) < 5) {
        x = pv[0] + (x - pv[0]) * alpha; y = pv[1] + (y - pv[1]) * alpha; z = pv[2] + (z - pv[2]) * alpha; yaw = lerpAngle(pv[3], yaw, alpha);
      }
      const hidden = k.respawnT > 1.05 && k.local;
      v.root.visible = !hidden && !(k.respawnT > 0 && k.respawnPhase === 0 && k.local) && !(!k.local && k.hiddenRemote);
      v.root.position.set(x, y, z);
      v.root.rotation.y = yaw;
      const air = !k.grounded;
      let airH = 0;
      if (air || k.respawnT > 0) { const g = this.track.ground(x, z, k.hint); airH = Math.max(0, y - g.h); }
      v.update(dt, { speed: k.speed, steer: k.steer, driftYaw: k.drift ? -k.drift * 0.38 : 0, spin: k.spinAng || 0, pitch: k.pitch, roll: k.roll, air, airH, hop: 0 });
      // effects
      const sf = k.surf;
      const fxState = {
        x, y, z, yaw, speed: k.speed, drift: k.drift, driftStage: k.driftStage, boost: k.boostT > 0, air,
        offCol: OFF_COLORS[sf] ? this.offColor(sf) : null, spin: k.spinT > 0, shield: k.shieldT > 0, rescue: k.local ? k.respawnT > 0 && k.respawnT <= 1.05 : k.respawnT > 0,
      };
      if (!v.root.visible) { fxState.shield = false; fxState.rescue = !k.local ? false : fxState.rescue; fxState.drift = 0; fxState.boost = false; fxState.offCol = null; fxState.spin = false; }
      this.fx.kartFx(v, fxState, dt, this.t);
    }
    // ghost playback
    if (this.ghostView && this.ghost) {
      const lt = r.time - p.lapStart;
      const S = this.ghost.samples;
      let i = 0;
      while (i < S.length - 1 && S[i + 1][0] < lt) i++;
      const a = S[i], b = S[Math.min(S.length - 1, i + 1)];
      const f = b[0] > a[0] ? Math.max(0, Math.min(1, (lt - a[0]) / (b[0] - a[0]))) : 0;
      const gv = this.ghostView;
      gv.root.visible = r.phase === 'race' && lt <= S[S.length - 1][0] + 0.5 && !p.finished;
      gv.root.position.set(a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f, a[3] + (b[3] - a[3]) * f);
      gv.root.rotation.y = lerpAngle(a[4], b[4], f);
      gv.update(dt, { speed: 25, steer: 0 });
    }
    // item boxes
    const bm = this.world.boxMesh;
    const o = this.tmpObj || (this.tmpObj = new THREE.Object3D());
    r.boxes.forEach((b, i) => {
      const sc = r.noItems ? 0 : b.respawn > 0 ? (b.respawn < 0.5 ? 1 - b.respawn / 0.5 : 0) : 1;
      o.position.set(b.x, b.y + Math.sin(this.t * 2 + i) * 0.15, b.z);
      o.rotation.set(this.t * 0.7 + i, this.t * 1.1 + i, 0);
      o.scale.setScalar(Math.max(0.001, sc));
      o.updateMatrix();
      bm.setMatrixAt(i, o.matrix);
    });
    bm.instanceMatrix.needsUpdate = true;
    this.fx.syncItems(r, dt, this.t);
    this.fx.update(dt);
    this.world.update(dt, this.t, this.camera);
  }
  offColor(sf) {
    if (!this._offc) this._offc = {};
    if (!this._offc[sf]) this._offc[sf] = new THREE.Color(OFF_COLORS[sf]);
    return this._offc[sf];
  }

  updateCamera(dt, inp) {
    const p = this.player, r = this.race, cam = this.camera;
    const v = this.views.get(p);
    const px = v ? v.root.position.x : p.x, py = v ? v.root.position.y : p.y, pz = v ? v.root.position.z : p.z;
    let yawT = p.yaw;
    const back = inp.back && r.phase === 'race' && !p.finished;
    if (back) yawT += Math.PI;
    let dist = 7.2 + Math.min(1.5, Math.abs(p.speed) * 0.035), h = 2.9, look = 4.5;
    if (r.phase === 'countdown') {
      // swing round from the front of the kart to behind it
      const f = Math.max(0, Math.min(1, (r.time + 3) / 2.6));
      const e = f * f * (3 - 2 * f);
      yawT = p.yaw + Math.PI * (1 - e);
      dist = 7.2 + (1 - e) * 3; h = 2.9 + (1 - e) * 0.8;
      this.camYaw = yawT;
    } else if (p.finished) {
      yawT = p.yaw + Math.PI * 0.8 + this.t * 0.25;
      dist = 9; h = 3.4;
    }
    this.camYaw = lerpAngle(this.camYaw, yawT, back ? 1 : 1 - Math.exp(-dt * (p.drift ? 3.2 : 5.5)));
    const tx = px - Math.sin(this.camYaw) * dist, tz = pz - Math.cos(this.camYaw) * dist;
    let ty = py + h;
    const g = this.track.ground(tx, tz, p.hint);
    if (g.surf !== SURF.VOID) ty = Math.max(ty, g.h + 1.4);
    if (r.phase === 'countdown' || back || !this.camInit) { cam.position.set(tx, ty, tz); this.camInit = true; }
    else {
      const k = 1 - Math.exp(-dt * 9), ky = 1 - Math.exp(-dt * (p.grounded ? 7 : 3));
      cam.position.x += (tx - cam.position.x) * k;
      cam.position.z += (tz - cam.position.z) * k;
      cam.position.y += (ty - cam.position.y) * ky;
    }
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const s = this.shake * 0.6;
      cam.position.x += (Math.random() - 0.5) * s; cam.position.y += (Math.random() - 0.5) * s;
    }
    tmpV.set(px + Math.sin(this.camYaw) * look, py + 1.3, pz + Math.cos(this.camYaw) * look);
    cam.lookAt(tmpV);
    const boost = p.boostT > 0 ? 11 : 0;
    const fovT = this.baseFov + boost + Math.min(4, Math.abs(p.speed) * 0.08);
    this.fov += (fovT - this.fov) * Math.min(1, dt * 5);
    cam.fov = this.fov;
    cam.updateProjectionMatrix();
    if (this.fx) this.fx.setScale(window.innerHeight, this.fov);
    // keep the sun's small shadow box over the player
    if (this.sun.castShadow) {
      this.sun.position.set(px + this.sunDir.x * 70, py + this.sunDir.y * 70, pz + this.sunDir.z * 70);
      this.sun.target.position.set(px, py, pz);
    } else {
      this.sun.position.set(px + this.sunDir.x * 70, py + this.sunDir.y * 70, pz + this.sunDir.z * 70);
      this.sun.target.position.set(px, py, pz);
    }
    const sky = this.world.group.getObjectByName('skygroup');
    if (sky) sky.position.set(cam.position.x, 0, cam.position.z);
  }

  updateAudio() {
    const s = this.app.sound, p = this.player, r = this.race;
    if (!s.ctx) return;
    s.update();
    if (r.phase === 'countdown') { s.engine(0, 0, Math.max(0, p.in.throttle), false, 1); return; }
    s.engine(0, p.speed, Math.max(0, p.in.throttle), p.boostT > 0, p.respawnT > 0 ? 0.2 : 1);
    // nearest three other karts
    const others = r.karts.filter(k => k !== p && !k.gone).map(k => ({ k, d: Math.hypot(k.x - p.x, k.z - p.z) })).sort((a, b) => a.d - b.d).slice(0, 3);
    for (let i = 0; i < 3; i++) {
      const o = others[i];
      if (o && o.d < 60) s.engine(i + 1, o.k.speed, 0.6, o.k.boostT > 0, 0.4 * (1 - o.d / 60));
      else s.engine(i + 1, 0, 0, false, 0);
    }
    const slide = p.grounded ? Math.abs(-Math.cos(p.yaw) * p.vx + Math.sin(p.yaw) * p.vz) : 0;
    const lvl = p.drift ? 0.75 : p.surf === SURF.ROAD || p.surf === SURF.ICE ? Math.max(0, (slide - 5) / 8) : 0;
    s.screech(Math.min(1, lvl), p.driftStage);
    if (p.rollT > 0) { this.rollSound = (this.rollSound || 0) - 1; if (this.rollSound <= 0) { s.play('roll'); this.rollSound = 5; } }
  }

  updateHud(dt) {
    const r = this.race, p = this.player, app = this.app;
    const karts = [];
    for (const k of r.karts) if (!k.gone) karts.push({ x: k.x, z: k.z, color: k.cfg.body, me: k === p });
    karts.sort((a, b) => a.me - b.me);
    let hint = '';
    if (p.stuckT > 2.5 && r.phase === 'race' && !p.finished) hint = app.touch ? 'Stuck? Pause, then Reset kart' : 'Stuck? Press R to reset';
    if (r.phase === 'countdown' && r.time > -2.6 && r.time < -0.4 && !this.online && this.firstRace) hint = 'Tip: hold accelerate as "1" appears for a rocket start';
    // labels over other karts (online names)
    const labels = [];
    if (this.online) {
      const w = window.innerWidth, h = window.innerHeight;
      for (const k of this.labelKarts) {
        if (k.gone || k.meta.bot) continue;
        const v = this.views.get(k); if (!v || !v.root.visible) continue;
        tmpV.set(k.x, k.y + 2.6, k.z);
        const d = tmpV.distanceTo(this.camera.position);
        if (d > 90) continue;
        tmpV.project(this.camera);
        if (tmpV.z > 1 || tmpV.z < -1) continue;
        labels.push({ x: (tmpV.x * 0.5 + 0.5) * w, y: (-tmpV.y * 0.5 + 0.5) * h, text: k.name, color: k.cfg.body });
      }
    }
    app.hud.update(dt, {
      place: p.place, n: r.karts.filter(k => !k.gone).length, lap: Math.min(r.laps, p.lapsDone + 1), laps: r.laps, finished: p.finished,
      time: p.finished ? p.finishTime : r.time, lapTime: p.finished ? 0 : r.time - p.lapStart, best: Number.isFinite(p.bestLap) ? p.bestLap : 0,
      item: p.item, itemCount: p.itemCount, rolling: p.rollT > 0, speed: p.speed, vmax: p.P.vmax,
      wrong: p.wrongWay && r.phase === 'race' && !p.finished, hint, karts, labels,
      fps: app.settings.fps ? app.fpsVal : undefined,
    });
  }

  dispose() {
    this.app.sound.enginesOff();
    this.fx.dispose();
    for (const v of this.views.values()) v.dispose();
    if (this.ghostView) this.ghostView.dispose();
    this.world.dispose();
    this.scene.clear();
  }
}
function fmt(t) { const ms = t * 1000; const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), x = Math.floor(ms % 1000); return `${m}:${String(s).padStart(2, '0')}.${String(x).padStart(3, '0')}`; }
