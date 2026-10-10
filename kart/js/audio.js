// Synthesised sound: engines, tyre screech, effects and a little chiptune per track.
// Nothing is loaded from files. Everything goes through one AudioContext created on the
// first user gesture (browsers require it).
import { rng } from './data.js';

const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);

const THEMES = {
  menu: { bpm: 112, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 5, 3, 4], lead: 'square', bass: 'triangle', seed: 3, swing: 0 },
  meadow: { bpm: 132, root: 62, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 0], lead: 'square', bass: 'triangle', seed: 11, swing: 0 },
  canyon: { bpm: 118, root: 57, scale: [0, 2, 3, 5, 7, 10], prog: [0, 6, 3, 4], lead: 'sawtooth', bass: 'triangle', seed: 23, swing: 0.12 },
  snow: { bpm: 108, root: 64, scale: [0, 2, 4, 6, 7, 11], prog: [0, 3, 5, 4], lead: 'sine', bass: 'triangle', seed: 37, swing: 0 },
  city: { bpm: 140, root: 57, scale: [0, 3, 5, 7, 10], prog: [0, 5, 3, 6], lead: 'sawtooth', bass: 'square', seed: 41, swing: 0 },
  volcano: { bpm: 150, root: 52, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 0, 6], lead: 'square', bass: 'sawtooth', seed: 53, swing: 0 },
  // indoor: garage rock for the kart hall, four-on-the-floor synthwave for the arena, a swung toy-piano tune for the playroom
  hall: { bpm: 146, root: 52, scale: [0, 3, 5, 7, 10], prog: [0, 0, 5, 6], lead: 'sawtooth', bass: 'square', seed: 61, swing: 0, kit: 'rock', extra: 'power' },
  arena: { bpm: 128, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 6], lead: 'sawtooth', bass: 'sawtooth', seed: 67, swing: 0, kit: 'four', extra: 'arp' },
  toy: { bpm: 120, root: 72, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0], lead: 'triangle', bass: 'sine', seed: 71, swing: 0.16, kit: 'toy', extra: 'bells' },
};
const CHORD_STEPS = { 0: 0, 1: 1, 3: 5, 4: 7, 5: 9, 6: 10 };

export class Sound {
  constructor(settings) {
    this.ctx = null;
    this.muted = !!settings.muted;
    this.musicOn = settings.music !== false;
    this.engines = [];
    this.musicTheme = null;
    this.step = 0;
    this.nextTime = 0;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
    this.comp = c.createDynamicsCompressor();
    this.master.connect(this.comp); this.comp.connect(c.destination);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = 0.8; this.sfxBus.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicOn ? 0.32 : 0; this.musicBus.connect(this.master);
    this.engBus = c.createGain(); this.engBus.gain.value = 0.55; this.engBus.connect(this.master);
    // white noise buffer shared by everything
    const len = c.sampleRate * 1.5;
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // tyre screech: looping noise through a band-pass
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 5;
    this.screechGain = c.createGain(); this.screechGain.gain.value = 0;
    src.connect(bp); bp.connect(this.screechGain); this.screechGain.connect(this.sfxBus);
    src.start();
    this.screechFilter = bp;
    if (this.pendingMusic) { const t = this.pendingMusic; this.pendingMusic = null; this.playMusic(t); }
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02);
  }
  setMusic(on) {
    this.musicOn = on;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.05);
  }

  // ---------- engines: voice 0 = the player, 1..3 = nearest other karts
  engineVoice(i) {
    if (!this.ctx) return null;
    if (this.engines[i]) return this.engines[i];
    const c = this.ctx;
    const o1 = c.createOscillator(); o1.type = 'sawtooth';
    const o2 = c.createOscillator(); o2.type = 'square';
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 2;
    const g = c.createGain(); g.gain.value = 0;
    const g2 = c.createGain(); g2.gain.value = 0.4;
    o1.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.engBus);
    o1.start(); o2.start();
    return (this.engines[i] = { o1, o2, f, g });
  }
  engine(i, speed, throttle, boost, vol) {
    const v = this.engineVoice(i);
    if (!v) return;
    const t = this.ctx.currentTime;
    const sp = Math.abs(speed);
    // fake gears: pitch climbs then drops a little every ~9 m/s
    const gear = Math.min(4, Math.floor(sp / 9));
    const inGear = (sp - gear * 9) / 9;
    const f = 48 + gear * 14 + inGear * 46 + (boost ? 28 : 0) + throttle * 6;
    v.o1.frequency.setTargetAtTime(f, t, 0.05);
    v.o2.frequency.setTargetAtTime(f * 0.5 + 1.5, t, 0.05);
    v.f.frequency.setTargetAtTime(350 + sp * 45 + throttle * 300 + (boost ? 900 : 0), t, 0.06);
    v.g.gain.setTargetAtTime(vol * (0.11 + throttle * 0.05 + Math.min(1, sp / 30) * 0.05), t, 0.05);
  }
  enginesOff() {
    if (!this.ctx) return;
    for (const v of this.engines) if (v) v.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    if (this.screechGain) this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }
  screech(level, pitch = 1) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.screechGain.gain.setTargetAtTime(Math.min(0.22, level * 0.22), t, 0.04);
    this.screechFilter.frequency.setTargetAtTime(1400 + pitch * 600, t, 0.05);
  }

  // ---------- one-shots
  tone(type, f0, f1, dur, vol = 0.25, when = 0, bus = this.sfxBus) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  noiseBurst(dur, vol, f0, f1, type = 'lowpass', when = 0, q = 1) {
    const c = this.ctx; if (!c) return;
    const t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  play(name, opt = {}) {
    if (!this.ctx || this.muted) return;
    const v = opt.vol ?? 1;
    switch (name) {
      case 'count': this.tone('square', 523, 523, 0.22, 0.18 * v); break;
      case 'go': this.tone('square', 1046, 1046, 0.5, 0.2 * v); this.tone('square', 784, 784, 0.5, 0.12 * v); break;
      case 'click': this.tone('triangle', 900, 1200, 0.06, 0.12 * v); break;
      case 'back': this.tone('triangle', 700, 500, 0.07, 0.12 * v); break;
      case 'lap': [72, 76, 79, 84].forEach((n, i) => this.tone('square', NOTE(n), 0, 0.14, 0.12 * v, i * 0.09)); break;
      case 'final': [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => this.tone('square', NOTE(n), 0, 0.16, 0.13 * v, i * 0.1)); break;
      case 'finish': [67, 72, 76, 79, 84, 79, 84, 88, 91].forEach((n, i) => this.tone(i % 2 ? 'square' : 'triangle', NOTE(n), 0, 0.22, 0.15 * v, i * 0.11)); break;
      case 'lose': [67, 64, 60, 55].forEach((n, i) => this.tone('triangle', NOTE(n), 0, 0.25, 0.15 * v, i * 0.16)); break;
      case 'roll': this.tone('square', 1200 + Math.random() * 600, 0, 0.04, 0.06 * v); break;
      case 'itemGot': this.tone('square', 880, 1320, 0.12, 0.12 * v); this.tone('triangle', 1320, 1760, 0.14, 0.1 * v, 0.06); break;
      case 'box': for (let i = 0; i < 4; i++) this.tone('sine', 1400 + i * 300 + Math.random() * 200, 0, 0.09, 0.08 * v, i * 0.03); break;
      case 'shell': this.tone('square', 900, 220, 0.25, 0.14 * v); this.noiseBurst(0.2, 0.12 * v, 3000, 600); break;
      case 'banana': this.tone('sine', 300, 120, 0.18, 0.2 * v); break;
      case 'shield': this.tone('sine', 400, 1200, 0.4, 0.14 * v); this.tone('triangle', 600, 1600, 0.4, 0.08 * v, 0.05); break;
      case 'shieldPop': this.noiseBurst(0.25, 0.2 * v, 6000, 1500, 'highpass'); this.tone('sine', 1200, 300, 0.25, 0.12 * v); break;
      case 'boost': this.noiseBurst(0.7, 0.25 * v, 400, 4000, 'bandpass', 0, 1.5); this.tone('sawtooth', 220, 660, 0.5, 0.08 * v); break;
      case 'pad': this.noiseBurst(0.45, 0.18 * v, 600, 3000, 'bandpass', 0, 2); this.tone('triangle', 440, 990, 0.3, 0.08 * v); break;
      case 'mt1': this.tone('square', 600, 1400, 0.22, 0.1 * v); this.noiseBurst(0.3, 0.12 * v, 800, 3000, 'bandpass'); break;
      case 'mt2': this.tone('square', 700, 1800, 0.28, 0.12 * v); this.noiseBurst(0.4, 0.16 * v, 800, 4000, 'bandpass'); break;
      case 'mt3': this.tone('square', 800, 2200, 0.34, 0.13 * v); this.tone('sawtooth', 400, 1100, 0.34, 0.06 * v); this.noiseBurst(0.5, 0.2 * v, 800, 5000, 'bandpass'); break;
      case 'stage': this.tone('triangle', 1000 + (opt.stage || 1) * 300, 0, 0.07, 0.07 * v); break;
      case 'hop': this.tone('sine', 300, 520, 0.08, 0.08 * v); break;
      case 'hit': this.noiseBurst(0.5, 0.35 * v, 2000, 200); this.tone('square', 500, 90, 0.5, 0.12 * v); break;
      case 'bump': this.tone('sine', 140, 60, 0.15, 0.3 * v); this.noiseBurst(0.12, 0.15 * v, 900, 200); break;
      case 'wall': this.tone('sine', 110, 50, 0.16, 0.28 * v); this.noiseBurst(0.15, 0.2 * v, 1200, 200); break;
      case 'land': this.tone('sine', 90, 45, 0.14, 0.28 * v); break;
      case 'respawn': this.tone('sine', 1400, 500, 0.5, 0.12 * v); break;
      case 'rescued': this.tone('triangle', 500, 1000, 0.25, 0.1 * v); break;
      case 'wrong': this.tone('square', 200, 180, 0.3, 0.09 * v); break;
      case 'rocket': this.tone('sawtooth', 300, 1200, 0.4, 0.12 * v); this.noiseBurst(0.6, 0.2 * v, 500, 4000, 'bandpass'); break;
      case 'splash': this.noiseBurst(0.6, 0.25 * v, 3000, 300); break;
    }
  }

  // ---------- music
  playMusic(theme) {
    if (!this.ctx) { this.pendingMusic = theme; return; }
    if (this.musicTheme === theme) return;
    this.musicTheme = theme;
    const T = THEMES[theme] || THEMES.menu;
    const r = rng(T.seed);
    // 4 bars of 16 steps: melody from the scale with mostly stepwise motion
    const mel = [];
    let deg = 2;
    for (let i = 0; i < 64; i++) {
      if (i % 2 === 1 && r() < 0.55) { mel.push(null); continue; }
      if (r() < 0.18) { mel.push(null); continue; }
      deg += Math.round((r() - 0.5) * 3.2);
      deg = Math.max(0, Math.min(T.scale.length * 2 - 1, deg));
      mel.push(deg);
    }
    this.song = { T, mel, len: 64, stepDur: 60 / T.bpm / 4 };
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
  }
  stopMusic() { this.musicTheme = null; this.song = null; }
  update() {
    if (!this.ctx || !this.song) return;
    const c = this.ctx;
    if (this.nextTime < c.currentTime - 0.5) this.nextTime = c.currentTime + 0.05;
    while (this.nextTime < c.currentTime + 0.18) {
      this.scheduleStep(this.step, this.nextTime);
      const swing = this.song.T.swing && this.step % 2 === 0 ? this.song.T.swing : this.song.T.swing ? -this.song.T.swing : 0;
      this.nextTime += this.song.stepDur * (1 + swing);
      this.step = (this.step + 1) % this.song.len;
    }
  }
  scheduleStep(i, t) {
    if (!this.musicOn || this.muted) return;
    const { T, mel } = this.song;
    const bar = Math.floor(i / 16), st = i % 16;
    const chordRoot = T.root + (CHORD_STEPS[T.prog[bar]] ?? 0);
    const when = t - this.ctx.currentTime;
    const sd = this.song.stepDur;
    const kit = T.kit || 'std';
    // bass: 8ths, or off-beat pumping for the four-on-the-floor kit
    if (kit === 'four' ? st % 4 === 2 : st % 2 === 0) {
      const n = chordRoot - 24 + (kit === 'four' ? 12 : st % 8 === 4 ? 7 : st % 8 === 6 ? 12 : 0);
      this.tone(T.bass, NOTE(n), 0, sd * (kit === 'four' ? 1.4 : 1.8), kit === 'toy' ? 0.2 : 0.16, when, this.musicBus);
    }
    // lead
    const m = mel[i];
    if (m !== null && m !== undefined) {
      const oct = Math.floor(m / T.scale.length), dg = m % T.scale.length;
      const n = T.root + 12 + oct * 12 + T.scale[dg] - (kit === 'toy' ? 12 : 0);
      this.tone(T.lead, NOTE(n), 0, sd * (kit === 'toy' ? 2.4 : 1.6), T.lead === 'sine' ? 0.13 : T.lead === 'triangle' ? 0.11 : 0.075, when, this.musicBus);
    }
    // arpeggio sparkle (city, snow, arena)
    if ((this.musicTheme === 'city' || this.musicTheme === 'snow' || T.extra === 'arp') && st % 2 === 1) {
      const arp = [0, 3, 7, 12][(st >> 1) % 4];
      this.tone(T.extra === 'arp' ? 'square' : 'triangle', NOTE(chordRoot + 12 + arp), 0, sd * 0.9, T.extra === 'arp' ? 0.03 : 0.04, when, this.musicBus);
    }
    // palm-muted power chords (hall)
    if (T.extra === 'power' && st % 2 === 0) {
      const v = st % 4 === 0 ? 0.05 : 0.03;
      this.tone('sawtooth', NOTE(chordRoot - 12), 0, sd * 0.8, v, when, this.musicBus);
      this.tone('sawtooth', NOTE(chordRoot - 5), 0, sd * 0.8, v * 0.8, when, this.musicBus);
    }
    // music-box bells (toy)
    if (T.extra === 'bells' && st % 4 === 2) {
      const b2 = [0, 4, 7, 12, 7, 4][(i >> 2) % 6];
      this.tone('sine', NOTE(chordRoot + 12 + b2), 0, sd * 3, 0.05, when, this.musicBus);
    }
    // drums
    if (kit === 'rock') {
      if (st === 0 || st === 6 || st === 8 || st === 11) this.kick(when);
      if (st % 8 === 4) this.snare(when);
      if (st % 2 === 0) this.hat(when);
    } else if (kit === 'four') {
      if (st % 4 === 0) this.kick(when);
      if (st % 8 === 4) this.snare(when);
      if (st % 4 === 2) { this.hat(when); this.hat(when + sd * 0.5); }
    } else if (kit === 'toy') {
      if (st % 8 === 0) this.kick(when, 0.2);
      if (st % 8 === 4 || st === 14) this.tone('sine', 1250, 900, 0.05, 0.08, when, this.musicBus); // woodblock
    } else {
      if (st % 8 === 0) this.kick(when);
      if (st % 8 === 4) this.snare(when);
      if (st % 2 === 0) this.hat(when);
    }
  }
  kick(when, vol = 0.35) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + 0.2);
  }
  snare(when) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
    const g = c.createGain(); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
    s.connect(f); f.connect(g); g.connect(this.musicBus); s.start(t, Math.random()); s.stop(t + 0.15);
  }
  hat(when) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = c.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    s.connect(f); f.connect(g); g.connect(this.musicBus); s.start(t, Math.random()); s.stop(t + 0.05);
  }
}
