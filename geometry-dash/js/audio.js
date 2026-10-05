/* Procedural soundtrack and sound effects. Every level gets its own tempo,
 * key and riff from a seed, all synthesised live with WebAudio, so there are
 * no audio files to download or license.
 */
(function (root) {
  'use strict';

  // Minor-key progression in semitones from the root: i - VI - III - VII
  const PROG = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]];

  function rng(seed) {
    let a = seed * 2654435761 >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Audio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.playing = false;
      this.timer = null;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }

    setEnabled(on) {
      this.enabled = on;
      if (this.music) this.music.gain.value = on ? 1 : 0;
    }

    // Starts the level's track from the top, like GD does on every attempt.
    start(level) {
      if (!this.ensure()) return;
      this.stop();
      const r = rng(level.seed || 1);
      this.bpm = level.bpm || 130;
      this.root = 110 * Math.pow(2, (level.key || 0) / 12);
      this.lead = Array.from({ length: 16 }, () => Math.floor(r() * 3) + (r() < 0.3 ? 3 : 0));
      this.leadOn = Array.from({ length: 16 }, (_, i) => i % 2 === 0 || r() < 0.45);
      this.bassOct = Array.from({ length: 8 }, () => (r() < 0.3 ? 2 : 1));
      this.step16 = 60 / this.bpm / 4;
      this.t0 = this.ctx.currentTime + 0.05;
      this.next = this.t0;
      this.n = 0;
      this.playing = true;
      this.music.gain.cancelScheduledValues(this.ctx.currentTime);
      this.music.gain.setValueAtTime(this.enabled ? 1 : 0, this.ctx.currentTime);
      this.timer = setInterval(() => this.schedule(), 25);
      this.schedule();
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.playing && this.ctx) {
        const t = this.ctx.currentTime;
        this.music.gain.cancelScheduledValues(t);
        this.music.gain.setValueAtTime(this.music.gain.value, t);
        this.music.gain.linearRampToValueAtTime(0, t + 0.05);
      }
      this.playing = false;
    }

    // 0..1 envelope that spikes on every beat; drives the visual pulse.
    pulse() {
      if (!this.playing || !this.ctx) return 0;
      const beat = this.step16 * 4;
      const since = (this.ctx.currentTime - this.t0) % beat;
      return since < 0 ? 0 : Math.exp(-since * 9);
    }

    schedule() {
      const ctx = this.ctx;
      while (this.next < ctx.currentTime + 0.12) {
        this.note(this.n, this.next);
        this.n++;
        this.next += this.step16;
      }
    }

    note(n, t) {
      const s = n % 16;
      const bar = Math.floor(n / 16);
      const chord = PROG[bar % 4];
      const intro = bar < 1;
      if (s % 4 === 0) this.kick(t);
      if (!intro && (s === 4 || s === 12)) this.snare(t);
      if (s % 2 === 1) this.hat(t, s % 4 === 3 ? 0.07 : 0.04);
      if (s % 2 === 0) {
        const semis = chord[0] + (s % 4 === 2 ? 12 : 0);
        this.bass(t, this.root / 2 * Math.pow(2, semis / 12) * this.bassOct[(s / 2) | 0]);
      }
      if (!intro && this.leadOn[s]) {
        const idx = this.lead[s];
        const semi = chord[idx % 3] + (idx >= 3 ? 12 : 0) + 12;
        this.pluck(t, this.root * Math.pow(2, semi / 12));
      }
      if (s === 0 && bar % 2 === 0 && !intro) this.pad(t, chord);
    }

    env(g, t, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }

    kick(t) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      this.env(g, t, 0.002, 0.9, 0.22);
      o.connect(g).connect(this.music);
      o.start(t); o.stop(t + 0.3);
    }

    noiseHit(t, freq, type, peak, dur) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = type; f.frequency.value = freq;
      const g = this.ctx.createGain();
      this.env(g, t, 0.001, peak, dur);
      src.connect(f).connect(g).connect(this.music);
      src.start(t, Math.random() * 0.5, dur + 0.05);
    }

    snare(t) { this.noiseHit(t, 1800, 'bandpass', 0.45, 0.16); }
    hat(t, v) { this.noiseHit(t, 8000, 'highpass', v, 0.04); }

    bass(t, f) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 6;
      lp.frequency.setValueAtTime(1400, t);
      lp.frequency.exponentialRampToValueAtTime(220, t + 0.14);
      const g = this.ctx.createGain();
      this.env(g, t, 0.004, 0.3, 0.16);
      o.connect(lp).connect(g).connect(this.music);
      o.start(t); o.stop(t + 0.22);
    }

    pluck(t, f) {
      const o = this.ctx.createOscillator();
      o.type = 'square'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(4000, t);
      lp.frequency.exponentialRampToValueAtTime(600, t + 0.12);
      const g = this.ctx.createGain();
      this.env(g, t, 0.003, 0.09, 0.14);
      o.connect(lp).connect(g).connect(this.music);
      o.start(t); o.stop(t + 0.2);
    }

    pad(t, chord) {
      const dur = this.step16 * 32;
      for (const semi of chord) {
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = this.root * Math.pow(2, (semi + 12) / 12);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.035, t + 0.3);
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(this.music);
        o.start(t); o.stop(t + dur + 0.05);
      }
    }

    // Death crunch. Plays on the master bus so it's audible with music off.
    crash() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(3000, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.4);
      const g = this.ctx.createGain();
      this.env(g, t, 0.002, 0.7, 0.45);
      src.connect(f).connect(g).connect(this.master);
      src.start(t, 0, 0.5);
    }

    win() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      [0, 4, 7, 12].forEach((semi, i) => {
        const o = this.ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = 440 * Math.pow(2, semi / 12);
        const g = this.ctx.createGain();
        this.env(g, t + i * 0.09, 0.005, 0.12, 0.35);
        o.connect(g).connect(this.master);
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.45);
      });
    }
  }

  root.GDAudio = new Audio();
})(typeof self !== 'undefined' ? self : this);
