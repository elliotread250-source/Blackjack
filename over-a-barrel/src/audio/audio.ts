import { FX, type MaterialId } from '../config';
import type { ImpactEvent, ScrapeInfo } from '../sim/sim';

/**
 * Every sound is synthesised on the fly with Web Audio. No samples, nothing
 * borrowed: oscillators, filtered noise and envelopes.
 */
interface Loop {
  src: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  gain: GainNode;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfx!: GainNode;
  private noise!: AudioBuffer;
  private wind!: Loop;
  private windLfo = 0;
  private scrapeHead!: Loop;
  private scrapeBarrel!: Loop;
  private lastHit: Record<string, number> = {};
  private volume = 0.8;
  private birdTimer = 3;

  get ready(): boolean {
    return this.ctx !== null;
  }

  /** Must run inside a user gesture (browsers block audio until then). */
  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(comp).connect(ctx.destination);
    this.sfx = ctx.createGain();
    this.sfx.connect(this.master);

    // Two seconds of white noise feeds wind, scrapes, dust and thunder.
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    this.wind = this.loop('lowpass', 500, 0.7);
    this.scrapeHead = this.loop('bandpass', 1400, 2.2);
    this.scrapeBarrel = this.loop('bandpass', 520, 1.6);
  }

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  private loop(type: BiquadFilterType, freq: number, q: number): Loop {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.playbackRate.value = 0.6 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.sfx);
    src.start();
    return { src, filter, gain };
  }

  private burst(t: number, dur: number, type: BiquadFilterType, freq: number, q: number, vol: number): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.5;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.05);
  }

  private tone(t: number, freq: number, dur: number, vol: number, type: OscillatorType = 'sine', endFreq?: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Pick on stone: a bright metallic ping with inharmonic partials. */
  private clank(strength: number, mat: MaterialId): void {
    const t = this.ctx!.currentTime;
    const v = Math.min(1, strength);
    if (mat === 'wood') {
      const f = 180 + Math.random() * 90;
      this.tone(t, f, 0.12, 0.35 * v, 'triangle', f * 0.7);
      this.tone(t, f * 2.3, 0.07, 0.12 * v, 'sine');
      this.burst(t, 0.06, 'bandpass', 900, 1.5, 0.35 * v);
      return;
    }
    if (mat === 'ice') {
      const f = 1900 + Math.random() * 700;
      for (const [r, a] of [[1, 0.18], [2.41, 0.09], [3.9, 0.05]] as const) this.tone(t, f * r, 0.22, a * v, 'sine');
      this.burst(t, 0.04, 'highpass', 4000, 0.7, 0.2 * v);
      return;
    }
    const f = 620 + Math.random() * 380;
    for (const [r, a, d] of [
      [1, 0.22, 0.32],
      [2.76, 0.12, 0.2],
      [5.4, 0.07, 0.12],
      [8.93, 0.04, 0.07],
    ] as const) {
      this.tone(t, f * r, d * (0.6 + v * 0.6), a * v, r < 2 ? 'triangle' : 'sine');
    }
    this.burst(t, 0.05, 'bandpass', 3200, 1.2, 0.4 * v);
  }

  /** Barrel landing: a low wooden boom; hard hits rattle the hoops. */
  private thud(strength: number, mat: MaterialId): void {
    const t = this.ctx!.currentTime;
    const v = Math.min(1, strength);
    this.tone(t, 130 + Math.random() * 20, 0.28, 0.55 * v, 'sine', 48);
    this.burst(t, 0.18, 'lowpass', mat === 'ice' ? 900 : 420, 0.8, 0.45 * v);
    this.burst(t, 0.12, 'bandpass', 260, 3, 0.3 * v);
    if (v > 0.55) {
      for (let i = 0; i < 3; i++) this.tone(t + 0.015 * i, 900 + Math.random() * 500, 0.09, 0.05 * v, 'square');
    }
  }

  impact(e: ImpactEvent): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const key = e.part === 'head' ? 'pick' : 'barrel';
    if (now - (this.lastHit[key] ?? 0) < 0.045) return;
    if (key === 'pick') {
      if (e.speed < FX.clankThreshold) return;
      this.lastHit[key] = now;
      this.clank((e.speed - FX.clankThreshold) / 8.75 + 0.15, e.mat);
    } else {
      if (e.speed < FX.thudThreshold) return;
      this.lastHit[key] = now;
      this.thud((e.speed - FX.thudThreshold) / 12.5 + 0.2, e.mat);
    }
  }

  thunder(intensity: number): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.25 + Math.random() * 0.8;
    this.burst(t, 0.25, 'bandpass', 1800, 0.6, 0.35 * intensity);
    this.burst(t + 0.05, 3.2, 'lowpass', 160, 0.9, 0.9 * intensity);
    this.burst(t + 0.4, 2.4, 'lowpass', 90, 0.7, 0.6 * intensity);
  }

  /** A short bright arpeggio for the summit. */
  fanfare(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.1;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.tone(t + i * 0.16, f, 1.6, 0.16, 'triangle');
      this.tone(t + i * 0.16, f * 2, 0.9, 0.04, 'sine');
    });
  }

  private chirp(): void {
    const t = this.ctx!.currentTime;
    const base = 2600 + Math.random() * 1600;
    const n = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) this.tone(t + i * 0.09, base, 0.07, 0.03, 'sine', base * (1.25 + Math.random() * 0.3));
  }

  /** Per-frame: wind, scrapes, ambient. */
  update(dt: number, scrape: ScrapeInfo, height: number, storm: number, speed: number, active: boolean): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.windLfo += dt;
    const gust = 0.75 + 0.25 * Math.sin(this.windLfo * 0.6) * Math.sin(this.windLfo * 0.23 + 1);
    const windVol = (0.04 + Math.min(1, height / 180) * 0.22 + storm * 0.2 + Math.min(1, speed / 27.5) * 0.25) * gust;
    this.wind.gain.gain.setTargetAtTime(active ? windVol : windVol * 0.5, t, 0.3);
    this.wind.filter.frequency.setTargetAtTime(350 + height * 2 + speed * 40 + gust * 300, t, 0.3);

    const sh = active ? Math.min(1, Math.max(0, scrape.head - 0.5) / 5) : 0;
    const sb = active ? Math.min(1, Math.max(0, scrape.barrel - 0.375) / 5) : 0;
    const matFreq = (m: MaterialId) => (m === 'ice' ? 3600 : m === 'wood' ? 700 : 1500);
    this.scrapeHead.gain.gain.setTargetAtTime(sh * 0.22, t, 0.04);
    this.scrapeHead.filter.frequency.setTargetAtTime(matFreq(scrape.headMat) * (0.8 + sh * 0.5), t, 0.05);
    this.scrapeBarrel.gain.gain.setTargetAtTime(sb * 0.3, t, 0.05);
    this.scrapeBarrel.filter.frequency.setTargetAtTime(matFreq(scrape.barrelMat) * 0.4 * (0.8 + sb * 0.4), t, 0.05);

    if (active && height < 45) {
      this.birdTimer -= dt;
      if (this.birdTimer <= 0) {
        this.chirp();
        this.birdTimer = 2.5 + Math.random() * 6;
      }
    }
  }
}
