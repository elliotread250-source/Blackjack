// Procedural sound effects: every block sound is synthesised with WebAudio (filtered noise
// grains, short tonal partials and envelopes), no samples. Each material has its own
// recipe (stone click, wood knock, grass and gravel crunch, glass chime, wool thud, metal
// clink, snow crunch, slime squish, liquid splash) and every play is randomised a little so
// repeated steps and breaks never sound identical.
//
// The AudioContext is created lazily and resumed on the first user gesture (autoplay
// policy); until then play() is a silent no-op, as it is in browsers without WebAudio.
import type { SoundName } from '../blocks/registry';

export type SoundKind = 'break' | 'place' | 'step' | 'use' | 'splash' | 'click';

type Ctx = BaseAudioContext;
const MAX_VOICES = 24;

/** How loud and how long each kind of event is, relative to a block break. */
const KIND: Record<SoundKind, { gain: number; len: number }> = {
  break: { gain: 1.0, len: 1.0 },
  place: { gain: 0.8, len: 0.75 },
  step: { gain: 0.32, len: 0.55 },
  use: { gain: 0.75, len: 1.0 },
  splash: { gain: 0.8, len: 1.0 },
  click: { gain: 0.5, len: 1.0 },
};

/** Small helper that schedules nodes for one sound event. */
class Voice {
  constructor(private ctx: Ctx, private out: AudioNode, private noise: AudioBuffer, readonly t0: number, private rnd: () => number) {}
  end = 0;

  /** Filtered white-noise burst with attack and exponential decay. */
  noiseBurst(at: number, type: BiquadFilterType, freq: number, q: number, gain: number, attack: number, decay: number, sweepTo = 0) {
    const c = this.ctx;
    const t = this.t0 + at;
    const dur = attack + decay * 6;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo > 0) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.max(0.001, attack));
    g.gain.setTargetAtTime(0, t + Math.max(0.001, attack), decay);
    src.connect(f); f.connect(g); g.connect(this.out);
    const off = this.rnd() * Math.max(0, this.noise.duration - dur - 0.01);
    src.start(t, off);
    src.stop(t + dur);
    this.end = Math.max(this.end, t + dur);
  }

  /** Oscillator partial with an exponential pitch glide and decay. */
  tone(at: number, type: OscillatorType, f0: number, f1: number, gain: number, attack: number, decay: number, glide = 0.05) {
    const c = this.ctx;
    const t = this.t0 + at;
    const dur = attack + decay * 6;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + Math.max(0.005, glide));
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.max(0.001, attack));
    g.gain.setTargetAtTime(0, t + Math.max(0.001, attack), decay);
    o.connect(g); g.connect(this.out);
    o.start(t);
    o.stop(t + dur);
    this.end = Math.max(this.end, t + dur);
  }

  /** A run of short noise grains: crunchy materials. */
  grains(n: number, spread: number, type: BiquadFilterType, freq: number, q: number, gain: number, decay: number) {
    for (let i = 0; i < n; i++) {
      const at = (i / n) * spread + this.rnd() * (spread / n);
      const fr = freq * (0.7 + this.rnd() * 0.6);
      this.noiseBurst(at, type, fr, q, gain * (0.5 + this.rnd() * 0.5), 0.001, decay * (0.6 + this.rnd() * 0.8));
    }
  }
}

export class Sounds {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private volume = 0.6;
  private ends: number[] = [];
  private offline = false;
  private seed = 0x9e3779b9;
  private listening = false;

  constructor() {
    if (typeof window === 'undefined') return;
    // Resume on the first real gesture anywhere on the page (Chrome's autoplay policy).
    this.listening = true;
    for (const ev of ['pointerdown', 'mousedown', 'keydown', 'touchend']) window.addEventListener(ev, this.onGesture, true);
  }

  /** Create/resume the AudioContext. Safe to call any time; only works fully inside a gesture. */
  unlock(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.attach(new AC({ latencyHint: 'interactive' }));
      }
      const c = this.ctx as AudioContext;
      if (c.state === 'suspended' && typeof c.resume === 'function') c.resume().catch(() => undefined);
    } catch { /* no audio on this device */ }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.masterGain(), this.ctx.currentTime, 0.02);
  }

  play(kind: SoundKind, material: SoundName, pitch?: number): void {
    const c = this.ctx;
    if (!c || !this.master || !this.noise || this.volume <= 0) return;
    if (!this.offline && c.state !== 'running') return;
    const now = c.currentTime;
    this.ends = this.ends.filter((e) => e > now);
    if (this.ends.length >= MAX_VOICES) return;
    const p = (pitch ?? 1) * (0.92 + this.rand() * 0.16);
    const out = c.createGain();
    const k = KIND[kind] ?? KIND.place;
    out.gain.value = k.gain;
    out.connect(this.master);
    const v = new Voice(c, out, this.noise, now + 0.005, () => this.rand());
    try {
      this.synth(v, kind, material, p, k.len);
    } catch { /* a node failed to schedule: drop this sound */ }
    this.ends.push(v.end || now + 0.2);
  }

  /** Use a given context (OfflineAudioContext in tests). */
  attach(ctx: Ctx, destination?: AudioNode): void {
    this.ctx = ctx;
    this.offline = typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.15;
    comp.connect(destination ?? ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = this.masterGain();
    this.master.connect(comp);
    const len = Math.floor(ctx.sampleRate * 1.5);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = this.rand() * 2 - 1;
  }

  // ------------------------------------------------------------------ internals
  private onGesture = () => {
    this.unlock();
    const c = this.ctx as AudioContext | null;
    if (c && c.state === 'running' && this.listening) {
      this.listening = false;
      for (const ev of ['pointerdown', 'mousedown', 'keydown', 'touchend']) window.removeEventListener(ev, this.onGesture, true);
    }
  };

  private masterGain() { return this.volume * this.volume * 0.9 + this.volume * 0.1; }

  private rand(): number {
    // xorshift32: cheap and deterministic enough for sound variation
    let s = this.seed;
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    this.seed = s;
    return s / 4294967296;
  }

  private synth(v: Voice, kind: SoundKind, m: SoundName, p: number, len: number) {
    const r = () => this.rand();
    if (kind === 'click') {
      v.tone(0, 'square', 1100 * p, 900 * p, 0.18, 0.001, 0.012, 0.02);
      v.tone(0, 'sine', 2200 * p, 2000 * p, 0.12, 0.001, 0.008);
      return;
    }
    if (kind === 'splash' || m === 'liquid') { this.splash(v, kind, p); return; }
    if (kind === 'use') { this.useSound(v, m, p); return; }
    const big = kind === 'break';
    const step = kind === 'step';
    switch (m) {
      case 'stone': {
        const n = big ? 3 : step ? 1 : 2;
        for (let i = 0; i < n; i++) v.noiseBurst(i * 0.018 + r() * 0.01, 'bandpass', (1700 + r() * 1300) * p, 1.1, 0.9, 0.001, 0.025 * len);
        v.tone(0, 'triangle', 170 * p, 70 * p, big ? 0.5 : 0.35, 0.001, 0.03 * len);
        v.noiseBurst(0, 'highpass', 5000 * p, 0.7, 0.25, 0.001, 0.008);
        break;
      }
      case 'wood': {
        const f = (210 + r() * 60) * p;
        v.tone(0, 'triangle', f * 1.7, f, 0.6, 0.001, 0.045 * len, 0.03);
        v.tone(0, 'sine', f * 2.9, f * 2.5, 0.25, 0.001, 0.025 * len);
        v.noiseBurst(0, 'bandpass', 950 * p, 2.2, 0.55, 0.001, 0.03 * len);
        if (big) {
          v.tone(0.045, 'triangle', f * 1.4, f * 0.9, 0.35, 0.001, 0.04);
          v.grains(4, 0.08, 'highpass', 2600 * p, 0.8, 0.25, 0.012);
        }
        break;
      }
      case 'grass':
        v.grains(big ? 9 : step ? 4 : 6, (big ? 0.17 : 0.1) * len, 'bandpass', 4200 * p, 0.7, 0.75, 0.014);
        v.noiseBurst(0, 'highpass', 2500 * p, 0.6, 0.25, 0.006, 0.04 * len);
        break;
      case 'gravel':
        v.grains(big ? 12 : step ? 5 : 8, (big ? 0.18 : 0.11) * len, 'bandpass', 1300 * p, 1.0, 0.85, 0.016);
        v.noiseBurst(0, 'lowpass', 700 * p, 0.7, 0.35, 0.004, 0.05 * len);
        break;
      case 'sand':
        v.noiseBurst(0, 'lowpass', 2600 * p, 0.6, 0.55, 0.02, 0.07 * len);
        v.grains(big ? 5 : 3, 0.12 * len, 'bandpass', 2200 * p, 0.7, 0.3, 0.02);
        break;
      case 'glass':
        if (big) {
          v.noiseBurst(0, 'highpass', 3800 * p, 0.7, 0.7, 0.001, 0.07);
          for (let i = 0; i < 6; i++) v.tone(r() * 0.07, 'sine', (2400 + r() * 3600) * p, (2300 + r() * 3400) * p, 0.16, 0.001, 0.06 + r() * 0.1);
        } else {
          v.noiseBurst(0, 'bandpass', 3400 * p, 1.4, 0.7, 0.001, 0.018 * len);
          v.tone(0, 'sine', (2600 + r() * 900) * p, 2500 * p, step ? 0.08 : 0.14, 0.001, 0.05 * len);
          v.tone(0, 'triangle', 220 * p, 110 * p, 0.2, 0.001, 0.02);
        }
        break;
      case 'wool':
        v.noiseBurst(0, 'lowpass', 520 * p, 0.8, 0.9, 0.008, 0.05 * len);
        v.tone(0, 'sine', 110 * p, 70 * p, 0.35, 0.004, 0.04 * len);
        break;
      case 'metal': {
        const f = (big ? 700 : 1150) * p * (0.95 + r() * 0.1);
        v.tone(0, 'sine', f, f, 0.32, 0.001, 0.16 * len);
        v.tone(0, 'sine', f * 2.76, f * 2.76, 0.18, 0.001, 0.08 * len);
        v.tone(0, 'sine', f * 5.4, f * 5.4, 0.08, 0.001, 0.04 * len);
        v.noiseBurst(0, 'highpass', 5000 * p, 0.7, 0.35, 0.001, 0.01);
        if (big) v.tone(0.03, 'triangle', f * 0.5, f * 0.45, 0.25, 0.001, 0.08);
        break;
      }
      case 'snow':
        v.grains(big ? 7 : step ? 3 : 5, 0.12 * len, 'lowpass', 1500 * p, 0.7, 0.6, 0.02);
        v.noiseBurst(0, 'lowpass', 900 * p, 0.6, 0.3, 0.01, 0.05 * len);
        break;
      case 'slime': {
        const f = (180 + r() * 40) * p;
        v.tone(0, 'sine', f * 0.7, f * 1.6, 0.5, 0.005, 0.06 * len, 0.06);
        v.tone(0.04, 'sine', f * 1.5, f * 0.8, 0.3, 0.005, 0.05 * len, 0.05);
        v.noiseBurst(0, 'bandpass', 500 * p, 1.5, 0.45, 0.01, 0.06 * len, 1600 * p);
        break;
      }
      default:
        v.noiseBurst(0, 'bandpass', 2000 * p, 1, 0.8, 0.001, 0.03 * len);
    }
  }

  private splash(v: Voice, kind: SoundKind, p: number) {
    const r = () => this.rand();
    const small = kind === 'step' || kind === 'place';
    v.noiseBurst(0, 'bandpass', 2600 * p, 0.8, small ? 0.5 : 0.85, 0.01, small ? 0.06 : 0.14, 420 * p);
    v.noiseBurst(0, 'lowpass', 900 * p, 0.6, small ? 0.25 : 0.45, 0.02, small ? 0.05 : 0.12);
    const bubbles = small ? 2 : 5;
    for (let i = 0; i < bubbles; i++) {
      const f = (350 + r() * 500) * p;
      v.tone(0.05 + r() * 0.25, 'sine', f, f * 2.2, 0.12, 0.002, 0.02, 0.04);
    }
  }

  private useSound(v: Voice, m: SoundName, p: number) {
    if (m === 'wood') {
      // Door creak + latch knock.
      const c = (130 + this.rand() * 30) * p;
      v.tone(0, 'sawtooth', c, c * 0.8, 0.09, 0.03, 0.06, 0.2);
      v.noiseBurst(0, 'bandpass', 700 * p, 4, 0.25, 0.03, 0.06);
      v.tone(0.12, 'triangle', 380 * p, 200 * p, 0.55, 0.001, 0.04, 0.03);
      v.noiseBurst(0.12, 'bandpass', 1000 * p, 2, 0.45, 0.001, 0.025);
    } else if (m === 'metal') {
      v.tone(0, 'square', 220 * p, 180 * p, 0.12, 0.002, 0.05);
      v.tone(0.06, 'sine', 900 * p, 900 * p, 0.3, 0.001, 0.12);
      v.noiseBurst(0.06, 'highpass', 4000 * p, 0.7, 0.3, 0.001, 0.015);
    } else {
      this.synth(v, 'place', m, p, 0.8);
    }
  }
}
