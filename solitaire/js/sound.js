/*
 * Synthesised sound effects. Everything is built from a noise buffer and a
 * few oscillators; nothing is downloaded. The AudioContext is created (or
 * resumed) on the first user gesture, since browsers refuse audio before one.
 */
(function () {
  'use strict';

  class Sound {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    /** Call from a user gesture handler. Safe to call repeatedly. */
    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          const c = new AC();
          this.ctx = c;
          this.master = c.createGain();
          this.master.gain.value = this.muted ? 0 : 0.9;
          const comp = c.createDynamicsCompressor();
          comp.threshold.value = -14;
          comp.ratio.value = 5;
          this.master.connect(comp);
          comp.connect(c.destination);
          const len = Math.floor(c.sampleRate * 1.0);
          this.noise = c.createBuffer(1, len, c.sampleRate);
          const d = this.noise.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      } catch (e) { /* audio is optional */ }
    }

    setMuted(m) {
      this.muted = !!m;
      if (this.master && this.ctx) {
        try { this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.015); } catch (e) { /* ignore */ }
      }
    }

    _ok() {
      return this.ctx && !this.muted && this.ctx.state === 'running';
    }

    _t(delay) { return this.ctx.currentTime + (delay || 0); }

    // A filtered burst of noise: the basis of every card sound.
    _noise(t, dur, type, freq, q, gain, attack, endFreq) {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noise;
      const filt = c.createBiquadFilter();
      filt.type = type;
      filt.frequency.setValueAtTime(freq, t);
      if (endFreq) filt.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
      filt.Q.value = q;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.003));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filt); filt.connect(g); g.connect(this.master);
      src.start(t, Math.random() * 0.5, dur + 0.05);
    }

    _tone(t, freq, dur, type, gain, endFreq, attack) {
      const c = this.ctx;
      const o = c.createOscillator();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + (attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.05);
    }

    /** Card laid down on the table: papery slap with a soft thump. */
    place(delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      this._noise(t, 0.07, 'bandpass', 1800 + Math.random() * 500, 0.9, 0.5, 0.002);
      this._noise(t, 0.035, 'highpass', 4500, 0.7, 0.12, 0.001);
      this._tone(t, 150, 0.08, 'sine', 0.22, 70);
    }

    /** Card turned over: a quick flick. */
    flip(delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      this._noise(t, 0.06, 'bandpass', 5200, 1.4, 0.3, 0.004, 2200);
      this._noise(t + 0.03, 0.04, 'bandpass', 2600, 1.1, 0.18, 0.002);
    }

    /** Card turned from the stock. */
    draw(delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      this._noise(t, 0.08, 'bandpass', 3800, 1.2, 0.28, 0.006, 1600);
      this._noise(t + 0.045, 0.05, 'bandpass', 2000, 1, 0.22, 0.002);
    }

    /** Dealing one card: a short tick. */
    deal(delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      this._noise(t, 0.045, 'bandpass', 2600 + Math.random() * 900, 1.1, 0.26, 0.002);
    }

    /** Riffle shuffle: a rapid run of tiny clicks that swells and fades. */
    shuffle(delay) {
      if (!this._ok()) return;
      const t0 = this._t(delay);
      let t = t0;
      const n = 26;
      for (let i = 0; i < n; i++) {
        const env = Math.sin(Math.PI * (i + 1) / (n + 1));
        this._noise(t, 0.03, 'bandpass', 3000 + Math.random() * 2500, 1.3, 0.08 + 0.2 * env, 0.001);
        t += 0.017 + Math.random() * 0.013;
      }
      this._noise(t + 0.02, 0.12, 'bandpass', 1400, 0.8, 0.3, 0.004);
      this._tone(t + 0.02, 120, 0.1, 'sine', 0.15, 60);
    }

    /** Card sent to a foundation: a bright pluck that climbs with the rank. */
    foundation(rank, delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
      const f = 523.25 * Math.pow(2, scale[Math.max(0, Math.min(12, (rank || 1) - 1))] / 12);
      this._noise(t, 0.05, 'bandpass', 2200, 1, 0.28, 0.002);
      this._tone(t, f, 0.32, 'triangle', 0.16);
      this._tone(t, f * 2, 0.18, 'sine', 0.05);
    }

    /** Illegal drop: a soft dull bump. */
    bump(delay) {
      if (!this._ok()) return;
      const t = this._t(delay);
      this._tone(t, 110, 0.12, 'sine', 0.22, 70);
      this._noise(t, 0.05, 'lowpass', 600, 0.7, 0.18, 0.002);
    }

    /** Hint chime. */
    hint() {
      if (!this._ok()) return;
      const t = this._t(0);
      this._tone(t, 880, 0.18, 'sine', 0.1);
      this._tone(t + 0.09, 1318.5, 0.26, 'sine', 0.09);
    }

    /** Undo: a short reversed swish. */
    undo() {
      if (!this._ok()) return;
      const t = this._t(0);
      this._noise(t, 0.09, 'bandpass', 1500, 1.2, 0.22, 0.05, 3800);
    }

    /** Waste turned back into the stock. */
    recycle() {
      if (!this._ok()) return;
      const t = this._t(0);
      this._noise(t, 0.22, 'bandpass', 1200, 0.9, 0.26, 0.04, 3600);
      this._noise(t + 0.2, 0.08, 'bandpass', 1700, 1, 0.3, 0.002);
      this._tone(t + 0.2, 140, 0.08, 'sine', 0.15, 70);
    }

    /** Win fanfare: a rising arpeggio and a held chord. */
    win() {
      if (!this._ok()) return;
      const t = this._t(0.05);
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568, 2093];
      notes.forEach((f, i) => {
        this._tone(t + i * 0.085, f, 0.35, 'triangle', 0.13);
        this._tone(t + i * 0.085, f / 2, 0.3, 'sine', 0.05);
      });
      const tc = t + notes.length * 0.085 + 0.05;
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
        this._tone(tc, f, 1.3, 'triangle', 0.08, null, 0.02);
        this._tone(tc, f * 1.003, 1.3, 'sine', 0.05, null, 0.02);
      });
    }
  }

  window.SolitaireSound = Sound;
})();
