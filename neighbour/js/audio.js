// All sound is synthesised with WebAudio: no files. One AudioContext, created on the first user
// gesture. Positional sounds (his footsteps, doors, glass) go through panners placed in the world;
// the listener follows the camera. Music is a tense drone that turns into a pounding chase loop.
export class Sound {
  constructor(volume = 0.8) {
    this.ctx = null;
    this.volume = volume;
    this.last = {};
    this.chase = 0; this.tension = 0; this.heart = 0;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.volume;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(c.destination);
    this.sfx = c.createGain(); this.sfx.connect(this.master);
    this.music = c.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    const len = Math.floor(c.sampleRate * 2);
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // brown-ish noise for wind
    this.brown = c.createBuffer(1, len, c.sampleRate);
    const b = this.brown.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; b[i] = last * 3.5; }
    this.startAmbience();
    this.startMusic();
  }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
  ok(name, gap = 0) {
    if (!this.ctx) return false;
    const now = this.ctx.currentTime;
    if (gap && this.last[name] && now - this.last[name] < gap) return false;
    this.last[name] = now;
    return true;
  }

  // ------------------------------------------------------------------ building blocks
  out(pos) {
    if (!pos) return this.sfx;
    const p = this.ctx.createPanner();
    p.panningModel = 'equalpower'; p.distanceModel = 'inverse'; p.refDistance = 2.5; p.maxDistance = 60; p.rolloffFactor = 1.3;
    if (p.positionX) { p.positionX.value = pos[0]; p.positionY.value = pos[1]; p.positionZ.value = pos[2]; } else p.setPosition(pos[0], pos[1], pos[2]);
    p.connect(this.sfx);
    return p;
  }
  tone(type, f0, f1, dur, vol, when = 0, attack = 0.005, dest) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  burst(type, freq, q, dur, vol, when = 0, dest, f1) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }

  // ------------------------------------------------------------------ ambience + music
  startAmbience() {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.brown; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.08;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; const lg = c.createGain(); lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
    this.windGain = g;
    this.cricketT = 0;
  }
  startMusic() {
    const c = this.ctx;
    // drone: low detuned saws through a slow filter
    this.drone = c.createGain(); this.drone.gain.value = 0.0; this.drone.connect(this.music);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 3; lp.connect(this.drone);
    for (const f of [55, 55.4, 82.4, 77.8]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = c.createGain(); g.gain.value = 0.18; o.connect(g); g.connect(lp); o.start(); }
    const l2 = c.createOscillator(); l2.frequency.value = 0.05; const l2g = c.createGain(); l2g.gain.value = 140; l2.connect(l2g); l2g.connect(lp.frequency); l2.start();
    this.droneLp = lp;
    // chase bus: scheduled hits
    this.chaseBus = c.createGain(); this.chaseBus.gain.value = 0; this.chaseBus.connect(this.music);
    this.beat = 0; this.nextBeat = 0;
    // high dissonant strings for the chase
    const str = c.createGain(); str.gain.value = 0.05; str.connect(this.chaseBus);
    const shp = c.createBiquadFilter(); shp.type = 'bandpass'; shp.frequency.value = 1400; shp.Q.value = 1; shp.connect(str);
    for (const f of [622, 659, 932]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const tr = c.createOscillator(); tr.frequency.value = 7 + Math.random(); const tg = c.createGain(); tg.gain.value = 8; tr.connect(tg); tg.connect(o.frequency); tr.start(); o.connect(shp); o.start(); }
  }

  // called every frame: tension 0..1 (awareness), chase bool, heart 0..1 (hiding with him close)
  update(dt, st) {
    if (!this.ctx) return;
    const c = this.ctx, now = c.currentTime;
    this.chase += ((st.chase ? 1 : 0) - this.chase) * Math.min(1, dt * (st.chase ? 3 : 0.5));
    this.tension += (st.tension - this.tension) * Math.min(1, dt * 2);
    this.drone.gain.setTargetAtTime(0.05 + this.tension * 0.12 + (st.inside ? 0.05 : 0), now, 0.3);
    this.chaseBus.gain.setTargetAtTime(this.chase * 0.9, now, 0.15);
    this.windGain.gain.setTargetAtTime(st.inside ? 0.025 : 0.08, now, 0.5);
    // chase rhythm: thumping bass + noise snare + a stab every bar
    if (this.chase > 0.05) {
      if (this.nextBeat < now) this.nextBeat = now + 0.02;
      while (this.nextBeat < now + 0.12) {
        const b = this.beat++ % 16, t0 = this.nextBeat - now;
        if (b % 4 === 0 || b === 10) this.tone('sine', 90, 38, 0.32, 0.6, t0, 0.003, this.chaseBus);
        if (b % 4 === 2) this.burst('highpass', 1800, 0.7, 0.12, 0.25, t0, this.chaseBus);
        if (b % 2 === 1) this.burst('highpass', 7000, 1, 0.04, 0.08, t0, this.chaseBus);
        if (b === 0) { for (const f of [110, 116.5, 164.8]) this.tone('sawtooth', f, f * 0.98, 0.5, 0.09, t0, 0.01, this.chaseBus); }
        this.nextBeat += 0.115;
      }
    }
    // heartbeat
    if (st.heart > 0.05) {
      this.heartT = (this.heartT || 0) - dt;
      if (this.heartT <= 0) {
        const v = 0.25 + st.heart * 0.55;
        this.tone('sine', 62, 40, 0.16, v, 0, 0.004); this.tone('sine', 58, 38, 0.18, v * 0.75, 0.17, 0.004);
        this.heartT = 1.05 - st.heart * 0.55;
      }
    }
    // crickets outside
    if (!st.inside) {
      this.cricketT -= dt;
      if (this.cricketT <= 0) {
        this.cricketT = 0.6 + Math.random() * 2.5;
        const f = 4200 + Math.random() * 600;
        for (let i = 0; i < 3; i++) this.tone('sine', f, f, 0.04, 0.012, i * 0.07);
      }
    }
  }

  listener(x, y, z, yaw) {
    if (!this.ctx) return;
    const L = this.ctx.listener, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    if (L.positionX) {
      L.positionX.value = x; L.positionY.value = y; L.positionZ.value = z;
      L.forwardX.value = fx; L.forwardY.value = 0; L.forwardZ.value = fz; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(x, y, z); L.setOrientation(fx, 0, fz, 0, 1, 0); }
  }

  // ------------------------------------------------------------------ effects
  play(name, o = {}) {
    if (!this.ctx) return;
    const at = o.pos ? this.out(o.pos) : this.sfx;
    switch (name) {
      case 'step': {
        if (!this.ok('step', 0.12)) return;
        const v = o.mode === 'sprint' ? 0.32 : o.mode === 'crouch' ? 0.06 : 0.16;
        const m = o.mat || 'grass';
        const f = { grass: 700, wood: 380, tile: 1300, concrete: 900, carpet: 320, metal: 1600, road: 900 }[m] || 600;
        this.burst(m === 'grass' ? 'lowpass' : 'bandpass', f, m === 'grass' ? 0.6 : 1.5, m === 'grass' ? 0.1 : 0.07, v, 0, at);
        if (m === 'wood' && Math.random() < 0.25) this.tone('triangle', 180 + Math.random() * 60, 140, 0.18, v * 0.25, 0.02, 0.02, at); // creak
        break;
      }
      case 'nstep': this.burst('lowpass', 260, 0.8, 0.16, o.run ? 0.9 : 0.55, 0, at); this.tone('sine', 70, 45, 0.12, o.run ? 0.35 : 0.2, 0, 0.003, at); break;
      case 'jump': this.burst('lowpass', 500, 0.7, 0.08, 0.1); break;
      case 'land': this.burst('lowpass', 300, 0.7, 0.18, Math.min(0.6, 0.15 + (o.h || 1) * 0.1)); this.tone('sine', 80, 40, 0.15, 0.25); break;
      case 'mantle': this.burst('bandpass', 600, 1, 0.12, 0.12); break;
      case 'door': {
        if (o.open) { const f = 190 + Math.random() * 90; this.tone('sawtooth', f, f * 1.9, 0.55, 0.045, 0, 0.08, at); this.tone('square', f * 2.02, f * 3.6, 0.5, 0.02, 0.05, 0.1, at); }
        else { this.burst('lowpass', 220, 1, 0.22, 0.6, 0, at); this.tone('sine', 95, 50, 0.18, 0.35, 0, 0.003, at); }
        break;
      }
      case 'locked': this.burst('bandpass', 900, 3, 0.08, 0.3, 0, at); this.burst('bandpass', 1300, 4, 0.06, 0.25, 0.09, at); break;
      case 'unlock': for (let i = 0; i < 9; i++) this.burst('bandpass', 2400 + Math.random() * 2000, 6, 0.07, 0.18, i * 0.06, at); this.tone('square', 150, 90, 0.2, 0.2, 0.55, 0.005, at); break;
      case 'glass': {
        this.burst('highpass', 2500, 0.8, 0.5, 0.9, 0, at);
        for (let i = 0; i < 12; i++) { const f = 2500 + Math.random() * 5000; this.tone('sine', f, f * 0.98, 0.1 + Math.random() * 0.3, 0.06, Math.random() * 0.35, 0.002, at); }
        break;
      }
      case 'impact': this.burst('lowpass', 500 + Math.min(800, (o.v || 3) * 80), 1, 0.14, Math.min(0.7, 0.1 + (o.v || 3) * 0.05), 0, at); if (o.item === 'can' || o.item === 'paint' || o.item === 'crowbar') this.tone('triangle', 900 + Math.random() * 600, 700, 0.2, 0.1, 0, 0.002, at); break;
      case 'shatter': this.burst('highpass', 3000, 1, 0.3, 0.6, 0, at); for (let i = 0; i < 6; i++) this.tone('sine', 3000 + Math.random() * 4000, 2800, 0.15, 0.05, Math.random() * 0.2, 0.002, at); break;
      case 'pickup': this.tone('triangle', 520, 780, 0.08, 0.12); this.burst('bandpass', 1800, 2, 0.05, 0.08); break;
      case 'drop': this.burst('lowpass', 600, 1, 0.1, 0.15); break;
      case 'throw': this.burst('bandpass', 600, 1.5, 0.25, 0.25 + (o.charge || 0) * 0.25, 0, null, 2400); break;
      case 'boards': this.tone('sawtooth', 700, 260, 0.6, 0.12, 0, 0.02, at); this.burst('bandpass', 1500, 1, 0.5, 0.35, 0, at, 400); this.burst('lowpass', 300, 1, 0.3, 0.6, 0.55, at); break;
      case 'chain': this.unlockish(at); break;
      case 'trap': {
        for (const f of [310, 467, 893, 1231, 1810]) this.tone('triangle', f, f * 0.97, 0.7, 0.18, 0, 0.001, at);
        this.burst('highpass', 3000, 1, 0.2, 0.8, 0, at); this.tone('square', 60, 40, 0.3, 0.35);
        break;
      }
      case 'alarm': for (let i = 0; i < 8; i++) this.tone('square', i % 2 ? 660 : 880, i % 2 ? 660 : 880, 0.22, 0.12, i * 0.25, 0.01, at); break;
      case 'spotted': {
        if (!this.ok('spotted', 2)) return;
        for (const f of [98, 103.8, 146.8]) this.tone('sawtooth', f, f * 0.94, 1.1, 0.16, 0, 0.01);
        this.burst('lowpass', 200, 1, 0.8, 0.6);
        this.growl(o.pos, 0.9);
        break;
      }
      case 'glimpse': if (this.ok('glimpse', 3)) { this.tone('sine', 880, 830, 0.6, 0.05); this.tone('sine', 932, 900, 0.6, 0.04, 0.02); this.growl(o.pos, 0.4, true); } break;
      case 'heard': if (this.ok('heard', 4)) this.growl(o.pos, 0.35, true); break;
      case 'caught': {
        for (const f of [55, 58.3, 82.4, 110, 116.5]) this.tone('sawtooth', f, f * 0.7, 2.2, 0.2, 0, 0.005);
        this.burst('lowpass', 900, 0.7, 1.4, 1.0); this.tone('sine', 50, 30, 1.2, 0.8);
        break;
      }
      case 'wake': this.tone('sine', 220, 220, 2.5, 0.05, 0, 0.8); this.tone('sine', 261.6, 261.6, 2.5, 0.04, 0.2, 0.8); break;
      case 'power': this.tone('sawtooth', 60, 60, 1.2, 0.08, 0, 0.3); this.tone('sine', 120, 120, 1.2, 0.1, 0, 0.3); this.burst('bandpass', 2000, 4, 0.06, 0.3); break;
      case 'hide': this.tone('sawtooth', 240, 380, 0.3, 0.035); this.burst('lowpass', 300, 1, 0.12, 0.2, 0.25); break;
      case 'hideopen': this.tone('sawtooth', 200, 420, 0.5, 0.06, 0, 0.05, at); break;
      case 'kick': this.burst('lowpass', 400, 1, 0.3, 0.8, 0, at); for (let i = 0; i < 3; i++) this.burst('lowpass', 300, 1, 0.2, 0.4, 0.15 + i * 0.12, at); break;
      case 'bonk': this.tone('square', 300, 120, 0.2, 0.2, 0, 0.002, at); this.growl(o.pos, 0.6); break;
      case 'vault': this.burst('bandpass', 700, 1, 0.3, 0.12); break;
      case 'win': for (const [f, d] of [[110, 0], [164.8, 0.3], [207.7, 0.6], [246.9, 0.9], [311.1, 1.3]]) this.tone('sine', f, f, 4, 0.08, d, 1); this.burst('lowpass', 150, 1, 3, 0.3, 0, null, 60); break;
      case 'ui': this.tone('triangle', 660, 880, 0.06, 0.08); break;
      case 'portal': this.tone('sine', 180, 900, 0.9, 0.12); this.tone('sine', 270, 1350, 0.9, 0.08, 0.05); this.burst('bandpass', 1200, 2, 0.8, 0.15, 0, null, 300); break;
      case 'powerup': for (const [f, d] of [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]]) this.tone('triangle', f, f, 0.35, 0.12, d); break;
      case 'bell': for (let i = 0; i < 14; i++) this.tone('square', 1400, 1380, 0.07, 0.07, i * 0.08, 0.002); break;
      case 'topple': this.burst('lowpass', 260, 1, 0.8, 0.9, 0.35); this.tone('sine', 70, 35, 0.8, 0.4, 0.35); this.burst('bandpass', 900, 1, 0.5, 0.4, 0.4); break;
      case 'push': this.burst('lowpass', 500, 1, 0.25, 0.5); this.tone('sine', 140, 60, 0.25, 0.25); break;
      case 'click': this.tone('square', 220, 160, 0.08, 0.15); this.burst('bandpass', 2000, 3, 0.05, 0.2); break;
      case 'ding': this.tone('sine', 988, 988, 0.6, 0.12); this.tone('sine', 784, 784, 0.8, 0.1, 0.25); break;
      case 'grab': this.tone('sawtooth', 300, 80, 0.6, 0.2); this.burst('highpass', 2000, 1, 0.3, 0.3); break;
      case 'whoosh': this.burst('bandpass', 900, 1, 0.3, 0.15, 0, null, 2400); break;
    }
  }
  unlockish(at) { for (let i = 0; i < 6; i++) this.burst('bandpass', 3000 + Math.random() * 1500, 5, 0.08, 0.2, i * 0.05, at); this.tone('square', 200, 80, 0.15, 0.2, 0.3, 0.003, at); }
  // a wordless grunt from him (no voice lines): formant-filtered saw with a pitch drop
  growl(pos, vol, question) {
    const c = this.ctx, t = c.currentTime, at = pos ? this.out(pos) : this.sfx;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(question ? 95 : 120, t);
    o.frequency.exponentialRampToValueAtTime(question ? 150 : 70, t + (question ? 0.45 : 0.6));
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    for (const [f, q] of [[600, 6], [1100, 8]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; o.connect(bp); bp.connect(g); }
    g.connect(at); o.start(t); o.stop(t + 0.8);
  }
}
