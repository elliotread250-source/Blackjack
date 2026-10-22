/* Drift Boss - synthesised WebAudio sound (no sample files). */
(function () {
  'use strict';

  const Sound = {
    ctx: null, master: null, muted: false, ready: false,
    eng: null, scr: null, noise: null,

    init() {
      if (this.ctx) { this.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
      } catch (e) { this.ctx = null; return; }
      const ctx = this.ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      this.master.connect(comp); comp.connect(ctx.destination);

      // white noise buffer shared by screech / whoosh / crash
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;

      // engine: saw + square sub through a lowpass, with a little rumble
      const eg = ctx.createGain(); eg.gain.value = 0;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; lp.Q.value = 3;
      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 50;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 25;
      const g2 = ctx.createGain(); g2.gain.value = 0.5;
      const rum = ctx.createOscillator(); rum.frequency.value = 24;
      const rumG = ctx.createGain(); rumG.gain.value = 0.25;
      const am = ctx.createGain(); am.gain.value = 0.75;
      rum.connect(rumG); rumG.connect(am.gain);
      o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(am); am.connect(eg); eg.connect(this.master);
      o1.start(); o2.start(); rum.start();
      this.eng = { g: eg, lp: lp, o1: o1, o2: o2, rum: rum };

      // tyre screech: band-passed noise with a wobble plus a faint squeal tone
      const ns = ctx.createBufferSource(); ns.buffer = buf; ns.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2300; bp.Q.value = 7;
      const sg = ctx.createGain(); sg.gain.value = 0;
      const sq = ctx.createOscillator(); sq.type = 'triangle'; sq.frequency.value = 1150;
      const vib = ctx.createOscillator(); vib.frequency.value = 13;
      const vibG = ctx.createGain(); vibG.gain.value = 40;
      vib.connect(vibG); vibG.connect(sq.frequency);
      const sqG = ctx.createGain(); sqG.gain.value = 0.18;
      ns.connect(bp); bp.connect(sg); sq.connect(sqG); sqG.connect(sg); sg.connect(this.master);
      ns.start(); sq.start(); vib.start();
      this.scr = { g: sg, bp: bp, sq: sq };
      this.ready = true;
    },

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
    suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); },

    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.02);
    },

    // continuous sounds, called every frame
    update(engineOn, speed01, boosting, screech) {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      const e = this.eng;
      const f = 42 + speed01 * 70 + (boosting ? 28 : 0);
      e.o1.frequency.setTargetAtTime(f, t, 0.08);
      e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.08);
      e.lp.frequency.setTargetAtTime(280 + f * 5 + (boosting ? 600 : 0), t, 0.1);
      e.rum.frequency.setTargetAtTime(14 + speed01 * 20, t, 0.1);
      e.g.gain.setTargetAtTime(engineOn ? (0.05 + speed01 * 0.035) : 0, t, 0.12);
      const s = Math.max(0, Math.min(1, screech));
      this.scr.g.gain.setTargetAtTime(s * 0.1, t, 0.04);
      this.scr.bp.frequency.setTargetAtTime(1900 + s * 900 + Math.random() * 200, t, 0.05);
      this.scr.sq.frequency.setTargetAtTime(1000 + s * 300, t, 0.05);
    },

    tone(freq, start, dur, type, vol, slideTo) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, start);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol, start + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      o.connect(g); g.connect(this.master);
      o.start(start); o.stop(start + dur + 0.02);
    },

    noiseBurst(start, dur, type, f0, f1, vol, q) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource(); src.buffer = this.noise;
      const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q || 1;
      fl.frequency.setValueAtTime(f0, start);
      fl.frequency.exponentialRampToValueAtTime(f1, start + dur);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol, start + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      src.connect(fl); fl.connect(g); g.connect(this.master);
      src.start(start, Math.random()); src.stop(start + dur + 0.05);
    },

    coin() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.tone(1318.5, t, 0.09, 'triangle', 0.16);
      this.tone(1975.5, t + 0.06, 0.22, 'triangle', 0.14);
    },
    power(kind) {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      const notes = kind === 'boost' ? [523, 659, 784, 1047, 1319] : kind === 'double' ? [660, 880, 660, 1320] : [392, 523, 659, 784];
      notes.forEach((n, i) => this.tone(n, t + i * 0.06, 0.16, 'square', 0.07));
      if (kind === 'boost') this.noiseBurst(t, 0.6, 'bandpass', 400, 3000, 0.12, 0.8);
    },
    fall() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.noiseBurst(t, 1.2, 'bandpass', 1400, 180, 0.32, 1.2);
      this.tone(620, t, 1.1, 'sine', 0.12, 70);
    },
    crash() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.tone(110, t, 0.5, 'sine', 0.35, 38);
      this.noiseBurst(t, 0.45, 'lowpass', 1800, 120, 0.3, 0.7);
    },
    shieldBreak() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.noiseBurst(t, 0.35, 'highpass', 3000, 6000, 0.16, 0.5);
      [1568, 1175, 880].forEach((n, i) => this.tone(n, t + i * 0.05, 0.25, 'triangle', 0.1));
    },
    milestone() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.tone(784, t, 0.12, 'square', 0.06);
      this.tone(1175, t + 0.1, 0.2, 'square', 0.06);
    },
    newBest() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      [523, 659, 784, 1047].forEach((n, i) => this.tone(n, t + i * 0.09, 0.22, 'triangle', 0.12));
      this.tone(1319, t + 0.4, 0.5, 'triangle', 0.12);
    },
    click() {
      if (!this.ready) return;
      this.tone(900, this.ctx.currentTime, 0.05, 'square', 0.05, 600);
    },
    buy() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      [880, 1109, 1319, 1760].forEach((n, i) => this.tone(n, t + i * 0.05, 0.18, 'triangle', 0.1));
    },
    deny() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.tone(220, t, 0.12, 'square', 0.07); this.tone(180, t + 0.1, 0.16, 'square', 0.07);
    },
    go() {
      if (!this.ready) return;
      const t = this.ctx.currentTime;
      this.tone(330, t, 0.25, 'sawtooth', 0.05, 660);
    },
  };

  window.DriftSound = Sound;
})();
