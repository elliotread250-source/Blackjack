/* Procedural soundtrack and sound effects. Every level gets its own tempo,
 * key and riff from a seed, all synthesised live with WebAudio, so there are
 * no audio files to download or license.
 */
(function (root) {
  'use strict';

  // Each level's song is built from a style: chord progression (semitones
  // from the root), drum pattern (16 steps: k kick, s snare, h hat, o open
  // hat), bass rhythm, lead voice and how the lead plays (riff or arpeggio).
  // Songs run in 16-bar loops: a 1-bar intro, an 8-bar verse with a thinner
  // lead, a 1-bar snare build, then a full drop.
  const STYLES = [
    { name: 'Electro', prog: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]],
      drums: 'k.h.k.h.k.h.k.hh', snare: [4, 12], bass: 'eighths', lead: 'square', play: 'riff' },
    { name: 'Dubstep', prog: [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-2, 2, 5]], half: true,
      drums: 'k.h.h.h.h.h.k.h.', snare: [8], bass: 'wobble', lead: 'saw', play: 'riff' },
    { name: 'Drum & Bass', prog: [[0, 3, 7], [-5, -2, 2], [-4, 0, 3], [-2, 2, 5]],
      drums: 'k.h.h.h.h.k.h.hh', snare: [4, 12], bass: 'reese', lead: 'triangle', play: 'arp' },
    { name: 'Chiptune', prog: [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]],
      drums: 'k.h.h.h.k.h.h.h.', snare: [4, 12], bass: 'octave', lead: 'square', play: 'arp' },
    { name: 'Trance', prog: [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]],
      drums: 'k.o.k.o.k.o.k.o.', snare: [4, 12], bass: 'offbeat', lead: 'saw', play: 'arp' },
    { name: 'Synthwave', prog: [[-3, 0, 4], [-7, -3, 0], [0, 4, 7], [-5, -1, 2]],
      drums: 'k...h...k.k.h...', snare: [4, 12], bass: 'eighths', lead: 'saw', play: 'riff' },
    { name: 'Hardstyle', prog: [[0, 3, 7], [-2, 2, 5], [-4, 0, 3], [-5, -2, 2]],
      drums: 'k...k...k...k...', snare: [4, 12], bass: 'offbeat', lead: 'square', play: 'riff' },
    { name: 'House', prog: [[0, 3, 7], [5, 8, 12], [3, 7, 10], [-2, 2, 5]],
      drums: 'k.o.k.o.k.o.k.o.', snare: [4, 12], bass: 'offbeat', lead: 'triangle', play: 'riff' },
  ];

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
      this.musicVol = 1;
      this.sfxVol = 1;
    }

    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
      }
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return false;
      // iOS mutes WebAudio when the ring/silent switch is off unless the
      // session is marked as playback (Safari 16.4+).
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* older iOS */ }
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.music.connect(this.master);
      this.fx = this.ctx.createGain();
      this.fx.gain.value = this.sfxVol;
      this.fx.connect(this.master);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    }

    setEnabled(on) {
      this.enabled = on;
      if (this.music) this.music.gain.value = on ? this.musicVol : 0;
    }

    // 0..1 volumes from the settings screen.
    setVolumes(music, sfx) {
      this.musicVol = music;
      this.sfxVol = sfx;
      this.enabled = music > 0;
      if (this.music) this.music.gain.value = music;
      if (this.fx) this.fx.gain.value = sfx;
    }

    // Starts the level's track from the top, like GD does on every attempt.
    start(level) {
      if (!this.ensure()) return;
      this.stop();
      const r = rng(level.seed || 1);
      this.style = STYLES[level.style != null ? level.style % STYLES.length : (level.seed || 1) % STYLES.length];
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
      this.music.gain.setValueAtTime(this.enabled ? this.musicVol : 0, this.ctx.currentTime);
      this.timer = setInterval(() => this.schedule(), 25);
      this.schedule();
    }

    stop() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      if (this.src) { try { this.src.stop(this.ctx.currentTime + 0.06); } catch (e) { /* already stopped */ } this.src = null; }
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
      const st = this.style || STYLES[0];
      const s = n % 16;
      const bar = Math.floor(n / 16);
      const chord = st.prog[bar % 4];
      const part = bar % 16; // 0 intro, 1-8 verse, 9 build, 10-15 drop
      const intro = bar < 1, build = part === 9, drop = part >= 10 || part === 0 && bar > 0;
      const d = st.drums[s];
      if (d === 'k') this.kick(t);
      if (d === 'h' || d === 'o') this.hat(t, d === 'o' ? 0.08 : s % 4 === 3 ? 0.07 : 0.04, d === 'o');
      if (build) {
        // Snare roll that speeds up into the drop
        if (s % (s < 8 ? 4 : s < 12 ? 2 : 1) === 0) this.snare(t, 0.15 + s * 0.02);
      } else if (!intro && st.snare.indexOf(s) !== -1) this.snare(t);
      const f0 = this.root / 2 * Math.pow(2, chord[0] / 12);
      if (!build) this.bassLine(st.bass, s, t, f0);
      if (!intro && !build && this.leadOn[s] && (drop || s % 4 === 0 || st.play === 'arp')) {
        let semi;
        if (st.play === 'arp') semi = chord[s % 3] + (s % 6 >= 3 ? 24 : 12);
        else { const idx = this.lead[s]; semi = chord[idx % 3] + (idx >= 3 ? 12 : 0) + 12; }
        this.pluck(t, this.root * Math.pow(2, semi / 12), st.lead, drop ? 0.1 : 0.06);
      }
      if (s === 0 && bar % 2 === 0 && !intro) this.pad(t, chord);
    }

    bassLine(kind, s, t, f) {
      const oct = this.bassOct[(s / 2) | 0];
      if (kind === 'eighths') { if (s % 2 === 0) this.bass(t, f * (s % 4 === 2 ? 2 : 1) * oct); }
      else if (kind === 'offbeat') { if (s % 4 === 2) this.bass(t, f * 2); }
      else if (kind === 'octave') { if (s % 2 === 0) this.bass(t, f * (s % 4 === 0 ? 1 : 2), 'square'); }
      else if (kind === 'wobble') { if (s % 8 === 0) this.wobble(t, f, this.step16 * 8, s === 8 ? 3 : 2); }
      else if (kind === 'reese') { if (s % 8 === 0) this.wobble(t, f, this.step16 * 7, 0.5); }
    }

    // Sustained bass with a filter swept by an LFO (rate in sweeps per beat).
    wobble(t, f, len, rate) {
      const ctx = this.ctx;
      const g = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 9; lp.frequency.value = 500;
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = rate / (this.step16 * 4);
      depth.gain.value = 420;
      lfo.connect(depth).connect(lp.frequency);
      for (const det of [-9, 9]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        o.connect(lp);
        o.start(t); o.stop(t + len + 0.05);
      }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.01);
      g.gain.setValueAtTime(0.22, t + len - 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      lp.connect(g).connect(this.music);
      lfo.start(t); lfo.stop(t + len + 0.05);
    }

    // Your own music file for a level: loops from the top on every attempt.
    startBuffer(buf, bpm) {
      if (!this.ensure()) return;
      this.stop();
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      src.connect(this.music);
      this.bpm = bpm || 120;
      this.step16 = 60 / this.bpm / 4;
      this.t0 = this.ctx.currentTime + 0.02;
      this.music.gain.cancelScheduledValues(this.ctx.currentTime);
      this.music.gain.setValueAtTime(this.enabled ? this.musicVol : 0, this.ctx.currentTime);
      src.start(this.t0);
      this.src = src;
      this.playing = true;
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

    snare(t, v = 0.45) { this.noiseHit(t, 1800, 'bandpass', v, 0.16); }
    hat(t, v, open) { this.noiseHit(t, 8000, 'highpass', v, open ? 0.14 : 0.04); }

    bass(t, f, type = 'sawtooth') {
      const o = this.ctx.createOscillator();
      o.type = type; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.Q.value = 6;
      lp.frequency.setValueAtTime(1400, t);
      lp.frequency.exponentialRampToValueAtTime(220, t + 0.14);
      const g = this.ctx.createGain();
      this.env(g, t, 0.004, 0.3, 0.16);
      o.connect(lp).connect(g).connect(this.music);
      o.start(t); o.stop(t + 0.22);
    }

    pluck(t, f, type = 'square', vol = 0.09) {
      const o = this.ctx.createOscillator();
      o.type = type; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(4000, t);
      lp.frequency.exponentialRampToValueAtTime(600, t + 0.12);
      const g = this.ctx.createGain();
      this.env(g, t, 0.003, vol, 0.14);
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

    // Death crunch. Plays on the effects bus so it's audible with music off.
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
      src.connect(f).connect(g).connect(this.fx);
      src.start(t, 0, 0.5);
    }

    // Short jingles on the effects bus: semitones above 660Hz.
    tones(notes, type, gap, len, vol) {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      notes.forEach((semi, i) => {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.value = 660 * Math.pow(2, semi / 12);
        const g = this.ctx.createGain();
        this.env(g, t + i * gap, 0.005, vol, len);
        o.connect(g).connect(this.fx);
        o.start(t + i * gap); o.stop(t + i * gap + len + 0.1);
      });
    }
    orb() { this.tones([0, 7], 'sine', 0.05, 0.14, 0.2); }
    buy() { this.tones([0, 4, 7, 12], 'triangle', 0.06, 0.2, 0.25); }
    unlock() { this.tones([0, 4, 7, 12, 16, 19, 24], 'square', 0.06, 0.18, 0.1); }
    nope() { this.tones([-14, -15], 'sawtooth', 0.13, 0.2, 0.12); }
    tick() { this.tones([10], 'square', 0, 0.05, 0.12); }

    // Finish impact: a low thump under a burst of filtered noise.
    boom() {
      if (!this.ensure()) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
      const g = this.ctx.createGain();
      this.env(g, t, 0.004, 0.7, 0.55);
      o.connect(g).connect(this.fx);
      o.start(t); o.stop(t + 0.6);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(500, t + 0.6);
      const g2 = this.ctx.createGain();
      this.env(g2, t, 0.003, 0.35, 0.6);
      src.connect(f).connect(g2).connect(this.fx);
      src.start(t, 0, 0.7);
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
        o.connect(g).connect(this.fx);
        o.start(t + i * 0.09); o.stop(t + i * 0.09 + 0.45);
      });
    }
  }

  root.GDAudio = new Audio();
  root.GDAudio.STYLES = STYLES.map((x) => x.name);
})(typeof self !== 'undefined' ? self : this);
