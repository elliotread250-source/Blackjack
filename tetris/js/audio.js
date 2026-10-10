/*
 * Synthesised sound: every effect is built from oscillators and a noise
 * buffer, nothing is downloaded. The AudioContext is only created on the
 * first user gesture (browsers refuse to start audio before one).
 */
(function () {
  'use strict';

  const A4 = 440;
  const SEMI = { C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4, 'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2 };
  function freq(name) {
    const m = /^([A-G]#?)(\d)$/.exec(name);
    return A4 * Math.pow(2, (SEMI[m[1]] + (parseInt(m[2], 10) - 4) * 12) / 12);
  }

  // Korobeiniki (Russian folk song, public domain melody), arranged here.
  // [note, beats]; '-' is a rest.
  const PART_A = [
    ['E5', 1], ['B4', .5], ['C5', .5], ['D5', 1], ['C5', .5], ['B4', .5],
    ['A4', 1], ['A4', .5], ['C5', .5], ['E5', 1], ['D5', .5], ['C5', .5],
    ['B4', 1.5], ['C5', .5], ['D5', 1], ['E5', 1],
    ['C5', 1], ['A4', 1], ['A4', 1], ['-', 1],
    ['-', .5], ['D5', 1], ['F5', .5], ['A5', 1], ['G5', .5], ['F5', .5],
    ['E5', 1.5], ['C5', .5], ['E5', 1], ['D5', .5], ['C5', .5],
    ['B4', 1], ['B4', .5], ['C5', .5], ['D5', 1], ['E5', 1],
    ['C5', 1], ['A4', 1], ['A4', 1], ['-', 1],
  ];
  const PART_B = [
    ['E5', 2], ['C5', 2], ['D5', 2], ['B4', 2], ['C5', 2], ['A4', 2], ['G#4', 2], ['B4', 2],
    ['E5', 2], ['C5', 2], ['D5', 2], ['B4', 2], ['C5', 1], ['E5', 1], ['A5', 2], ['G#5', 3], ['-', 1],
  ];
  const BASS_A = ['E2', 'A2', 'E2', 'A2', 'D2', 'C2', 'E2', 'A2'];
  const BASS_B = ['A2', 'E2', 'A2', 'E2', 'A2', 'E2', 'A2', 'E2'];

  function buildSong() {
    const ev = [];
    let beat = 0;
    const lead = (part) => { for (const [n, d] of part) { if (n !== '-') ev.push({ b: beat, d, f: freq(n), v: 0 }); beat += d; } };
    const bassStart = [];
    // Structure: A A B (24 bars, 96 beats).
    bassStart.push([0, BASS_A]); lead(PART_A);
    bassStart.push([beat, BASS_A]); lead(PART_A);
    bassStart.push([beat, BASS_B]); lead(PART_B);
    for (const [start, roots] of bassStart) {
      roots.forEach((root, bar) => {
        const lo = freq(root), hi = lo * 2;
        for (let i = 0; i < 8; i++) ev.push({ b: start + bar * 4 + i * 0.5, d: 0.5, f: i % 2 ? hi : lo, v: 1 });
      });
    }
    ev.sort((a, b) => a.b - b.b);
    return { events: ev, length: beat };
  }

  class Sound {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.musicOn = true;
      this.song = buildSong();
      this.music = { playing: false, idx: 0, loop: 0, anchorTime: 0, anchorBeat: 0, spb: 60 / 144, pausedBeat: 0 };
    }

    unlock() {
      try {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          this.ctx = new AC();
          const c = this.ctx;
          this.master = c.createGain();
          this.master.gain.value = this.muted ? 0 : 1;
          const comp = c.createDynamicsCompressor();
          comp.threshold.value = -12; comp.ratio.value = 6;
          this.master.connect(comp).connect(c.destination);
          this.sfx = c.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
          this.mus = c.createGain(); this.mus.gain.value = 0; this.mus.connect(this.master);
          const len = Math.floor(c.sampleRate * 0.5);
          this.noise = c.createBuffer(1, len, c.sampleRate);
          const d = this.noise.getChannelData(0);
          for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
          // 25% pulse wave for the lead, square-ish but softer.
          const N = 24, re = new Float32Array(N), im = new Float32Array(N);
          for (let n = 1; n < N; n++) { re[n] = (2 / (n * Math.PI)) * Math.sin(2 * Math.PI * n * 0.25); im[n] = (2 / (n * Math.PI)) * (1 - Math.cos(2 * Math.PI * n * 0.25)); }
          this.pulse = c.createPeriodicWave(re, im);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      } catch (e) { /* audio unavailable: play silently */ }
    }

    get ready() { return !!this.ctx && this.ctx.state === 'running'; }

    setMuted(m) {
      this.muted = m;
      if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 1, this.ctx.currentTime, 0.015);
    }

    // ---- primitives ------------------------------------------------------
    tone(f, dur, opt) {
      if (!this.ready || this.muted) return;
      opt = opt || {};
      const c = this.ctx, t = c.currentTime + (opt.delay || 0);
      const o = c.createOscillator(), g = c.createGain();
      if (opt.type === 'pulse') o.setPeriodicWave(this.pulse); else o.type = opt.type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (opt.to) o.frequency.exponentialRampToValueAtTime(opt.to, t + dur);
      const v = opt.vol == null ? 0.2 : opt.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + (opt.attack || 0.004));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(opt.out || this.sfx);
      o.start(t); o.stop(t + dur + 0.02);
    }

    hiss(dur, opt) {
      if (!this.ready || this.muted) return;
      opt = opt || {};
      const c = this.ctx, t = c.currentTime + (opt.delay || 0);
      const s = c.createBufferSource(); s.buffer = this.noise;
      const f = c.createBiquadFilter(); f.type = opt.filter || 'lowpass';
      f.frequency.setValueAtTime(opt.f || 1200, t);
      if (opt.fto) f.frequency.exponentialRampToValueAtTime(opt.fto, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(opt.vol || 0.3, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f).connect(g).connect(this.sfx);
      s.start(t); s.stop(t + dur + 0.02);
    }

    arp(notes, step, opt) { notes.forEach((n, i) => this.tone(n, (opt && opt.len) || step * 1.6, Object.assign({}, opt, { delay: i * step + ((opt && opt.delay) || 0) }))); }

    // ---- effects -----------------------------------------------------------
    play(name, arg) {
      if (!this.ready || this.muted) return;
      switch (name) {
        case 'move': this.tone(520, 0.03, { type: 'triangle', vol: 0.12 }); break;
        case 'rotate': this.tone(780, 0.045, { type: 'square', vol: 0.06, to: 980 }); break;
        case 'rotatefail': this.tone(300, 0.04, { type: 'square', vol: 0.04 }); break;
        case 'soft': this.tone(240, 0.02, { type: 'triangle', vol: 0.05 }); break;
        case 'lock':
          this.tone(150, 0.07, { type: 'triangle', vol: 0.22, to: 90 });
          this.hiss(0.04, { f: 2500, vol: 0.06 });
          break;
        case 'harddrop':
          this.tone(170, 0.12, { type: 'sine', vol: 0.4, to: 50 });
          this.hiss(0.1, { f: 1800, fto: 300, vol: 0.22 });
          break;
        case 'hold': this.tone(420, 0.09, { type: 'sine', vol: 0.18, to: 840 }); this.tone(630, 0.07, { type: 'triangle', vol: 0.06, delay: 0.04 }); break;
        case 'holdfail': this.tone(110, 0.08, { type: 'square', vol: 0.05 }); break;
        case 'clear': {
          const n = arg || 1;
          const sets = [null, [523, 659, 784], [523, 659, 784, 988], [587, 740, 880, 1175], null];
          this.arp(sets[n], 0.045, { type: 'square', vol: 0.1 });
          this.hiss(0.25, { filter: 'highpass', f: 3000, vol: 0.08 });
          break;
        }
        case 'tetris':
          this.arp([523, 659, 784, 1047, 1319, 1568], 0.04, { type: 'square', vol: 0.11 });
          this.arp([262, 330, 392, 523], 0.07, { type: 'triangle', vol: 0.18 });
          this.hiss(0.45, { filter: 'highpass', f: 2500, vol: 0.12 });
          break;
        case 'tspin':
          this.tone(300, 0.18, { type: 'sawtooth', vol: 0.08, to: 1200 });
          this.arp([659, 831, 988, 1319], 0.05, { type: 'pulse', vol: 0.12, delay: 0.08 });
          break;
        case 'b2b': this.arp([1568, 2093], 0.06, { type: 'triangle', vol: 0.1, delay: 0.22 }); break;
        case 'combo': {
          const k = Math.min(arg || 1, 12);
          this.tone(440 * Math.pow(2, k / 12), 0.09, { type: 'pulse', vol: 0.1, delay: 0.12 });
          break;
        }
        case 'perfect': this.arp([523, 659, 784, 1047, 784, 1047, 1319, 1568, 2093], 0.06, { type: 'pulse', vol: 0.12, delay: 0.2 }); break;
        case 'levelup': this.arp([392, 523, 659, 784, 1047], 0.06, { type: 'pulse', vol: 0.13, delay: 0.25 }); break;
        case 'ready': this.tone(440, 0.12, { type: 'pulse', vol: 0.14 }); break;
        case 'go': this.tone(880, 0.25, { type: 'pulse', vol: 0.16 }); this.tone(440, 0.25, { type: 'triangle', vol: 0.14 }); break;
        case 'menu': this.tone(660, 0.04, { type: 'triangle', vol: 0.14 }); break;
        case 'select': this.arp([660, 990], 0.05, { type: 'pulse', vol: 0.1 }); break;
        case 'pause': this.arp([784, 523], 0.07, { type: 'triangle', vol: 0.14 }); break;
        case 'resume': this.arp([523, 784], 0.07, { type: 'triangle', vol: 0.14 }); break;
        case 'gameover':
          this.arp([392, 370, 349, 330, 311, 294, 277, 262], 0.11, { type: 'sawtooth', vol: 0.07, len: 0.2 });
          this.tone(98, 1.2, { type: 'triangle', vol: 0.2, delay: 0.85, to: 49 });
          break;
        case 'complete':
          this.arp([523, 659, 784, 1047, 784, 1047, 1319, 1568], 0.08, { type: 'pulse', vol: 0.13 });
          this.arp([262, 392, 523], 0.16, { type: 'triangle', vol: 0.18 });
          break;
        case 'newbest': this.arp([1047, 1319, 1568, 2093], 0.07, { type: 'triangle', vol: 0.12, delay: 0.4 }); break;
      }
    }

    // ---- music -------------------------------------------------------------
    musicStart() {
      const m = this.music;
      m.idx = 0; m.loop = 0; m.playing = true;
      if (!this.ctx) return;
      m.anchorBeat = 0; m.anchorTime = this.ctx.currentTime + 0.1;
      this.mus.gain.cancelScheduledValues(this.ctx.currentTime);
      this.mus.gain.setTargetAtTime(this.musicOn ? 1 : 0, this.ctx.currentTime, 0.05);
    }

    musicStop() {
      this.music.playing = false;
      if (this.ctx) this.mus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }

    musicPause() {
      const m = this.music;
      if (!m.playing) return;
      m.playing = false; m.paused = true;
      m.pausedBeat = this.song.events[m.idx].b + m.loop * this.song.length;
      if (this.ctx) this.mus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
    }

    musicResume() {
      const m = this.music;
      if (!m.paused) return;
      m.paused = false; m.playing = true;
      if (!this.ctx) return;
      m.anchorBeat = m.pausedBeat; m.anchorTime = this.ctx.currentTime + 0.12;
      this.mus.gain.setTargetAtTime(this.musicOn ? 1 : 0, this.ctx.currentTime + 0.1, 0.05);
    }

    setMusicOn(on) {
      this.musicOn = on;
      if (this.ctx && this.music.playing) this.mus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.05);
    }

    setTempo(bpm) {
      const m = this.music, spb = 60 / bpm;
      if (Math.abs(spb - m.spb) < 1e-6) return;
      if (this.ctx && m.playing) {
        const now = this.ctx.currentTime;
        m.anchorBeat = m.anchorBeat + (now - m.anchorTime) / m.spb;
        m.anchorTime = now;
      }
      m.spb = spb;
    }

    // Called every frame; schedules notes ~0.25 s ahead on the audio clock.
    musicTick() {
      const m = this.music;
      if (!m.playing || !this.ready) return;
      const c = this.ctx, now = c.currentTime, ev = this.song.events, L = this.song.length;
      // Fell far behind (tab throttled): re-anchor instead of spamming notes.
      const nextBeat = ev[m.idx].b + m.loop * L;
      if (m.anchorTime + (nextBeat - m.anchorBeat) * m.spb < now - 0.3) { m.anchorBeat = nextBeat; m.anchorTime = now + 0.05; }
      for (let guard = 0; guard < 64; guard++) {
        const e = ev[m.idx];
        const t = m.anchorTime + (e.b + m.loop * L - m.anchorBeat) * m.spb;
        if (t > now + 0.25) break;
        if (t >= now - 0.02) this.note(e, t, e.d * m.spb);
        if (++m.idx >= ev.length) { m.idx = 0; m.loop++; }
      }
    }

    note(e, t, dur) {
      const c = this.ctx;
      const o = c.createOscillator(), g = c.createGain();
      const len = Math.max(0.05, dur * (e.v ? 0.6 : 0.88));
      if (e.v) { o.type = 'triangle'; } else { o.setPeriodicWave(this.pulse); }
      o.frequency.setValueAtTime(e.f, t);
      const v = e.v ? 0.22 : 0.075;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.006);
      g.gain.setTargetAtTime(v * 0.6, t + 0.03, 0.08);
      g.gain.setTargetAtTime(0.0001, t + len, 0.02);
      o.connect(g).connect(this.mus);
      o.start(t); o.stop(t + len + 0.12);
    }
  }

  window.TetrisSound = Sound;
}());
