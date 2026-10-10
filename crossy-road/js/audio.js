// Synthesised sound effects. Nothing is loaded from files; one AudioContext is created on the
// first user gesture (browsers require it) and every effect is a few oscillators or a burst of
// filtered noise.
export class Sound {
  constructor(muted) {
    this.ctx = null;
    this.muted = !!muted;
    this.last = {};
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp);
    comp.connect(c.destination);
    const len = Math.floor(c.sampleRate * 1.2);
    this.noise = c.createBuffer(1, len, c.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // continuous train rumble: looping low noise, gain driven each frame
    const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    this.rumbleGain = c.createGain(); this.rumbleGain.gain.value = 0;
    src.connect(lp); lp.connect(this.rumbleGain); this.rumbleGain.connect(this.master);
    src.start();
  }

  setMuted(m) {
    this.muted = !!m;
    if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.02);
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }

  ok(name, gap = 0) {
    if (!this.ctx || this.muted) return false;
    const now = this.ctx.currentTime;
    if (gap && this.last[name] && now - this.last[name] < gap) return false;
    this.last[name] = now;
    return true;
  }

  tone(type, f0, f1, dur, vol, when = 0, attack = 0.005) {
    const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
    return o;
  }

  burst(dur, vol, type, f0, f1 = f0, q = 1, when = 0) {
    const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noise;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  hop() {
    if (!this.ok('hop', 0.03)) return;
    const p = 1 + (Math.random() - 0.5) * 0.12;
    this.tone('square', 420 * p, 760 * p, 0.07, 0.06);
    this.tone('triangle', 210 * p, 380 * p, 0.08, 0.08);
  }
  bump() { if (this.ok('bump', 0.1)) this.tone('triangle', 160, 90, 0.08, 0.12); }
  plop() { if (this.ok('plop', 0.05)) { this.tone('sine', 320, 140, 0.1, 0.12); this.burst(0.08, 0.05, 'bandpass', 900, 500, 2); } }
  coin() {
    if (!this.ok('coin', 0.04)) return;
    this.tone('square', 988, 988, 0.08, 0.06);
    this.tone('square', 1319, 1319, 0.22, 0.06, 0.07);
  }
  splash() {
    if (!this.ok('splash', 0.2)) return;
    this.burst(0.6, 0.35, 'lowpass', 2600, 300, 0.8);
    this.burst(0.25, 0.2, 'bandpass', 1400, 600, 3, 0.05);
    for (let i = 0; i < 4; i++) this.tone('sine', 500 + Math.random() * 500, 900 + Math.random() * 600, 0.07, 0.05, 0.15 + i * 0.07);
  }
  squish() {
    if (!this.ok('squish', 0.2)) return;
    this.tone('sawtooth', 180, 50, 0.22, 0.16);
    this.burst(0.18, 0.3, 'lowpass', 1200, 200, 1);
    this.tone('square', 600, 200, 0.12, 0.05, 0.02);
  }
  smash() {
    if (!this.ok('smash', 0.2)) return;
    this.burst(0.45, 0.4, 'lowpass', 3000, 200, 0.7);
    this.tone('sawtooth', 140, 40, 0.35, 0.18);
  }
  horn(pan = 0) {
    if (!this.ok('horn', 1.2)) return;
    const f = 330 + Math.random() * 120;
    this.tone('square', f, f, 0.22, 0.05, 0, 0.01);
    this.tone('square', f * 1.26, f * 1.26, 0.22, 0.04, 0, 0.01);
  }
  whoosh(vol = 1) {
    if (!this.ok('whoosh', 0.18)) return;
    this.burst(0.35, 0.12 * vol, 'bandpass', 500, 1400, 1.2);
  }
  bell() {
    if (!this.ok('bell', 0.3)) return;
    this.tone('triangle', 1760, 1760, 0.25, 0.07);
    this.tone('sine', 2637, 2637, 0.18, 0.04);
  }
  trainHorn() {
    if (!this.ok('trainHorn', 2)) return;
    for (const f of [277, 349, 415]) this.tone('sawtooth', f, f * 0.98, 0.7, 0.035, 0, 0.03);
  }
  rumble(v) {
    if (!this.rumbleGain) return;
    this.rumbleGain.gain.setTargetAtTime(this.muted ? 0 : v * 0.5, this.ctx.currentTime, 0.08);
  }
  screech() {
    if (!this.ok('screech', 1)) return;
    const o = this.tone('sawtooth', 2200, 900, 0.7, 0.07, 0, 0.02);
    const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
    lfo.frequency.value = 28; lg.gain.value = 140;
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(); lfo.stop(this.ctx.currentTime + 0.75);
    this.burst(0.6, 0.08, 'bandpass', 3000, 1500, 4);
  }
  flap() { if (this.ok('flap', 0.15)) this.burst(0.12, 0.12, 'lowpass', 600, 200, 1); }
  click() { if (this.ok('click', 0.03)) this.tone('square', 700, 900, 0.05, 0.04); }
  buy() {
    if (!this.ok('buy')) return;
    [523, 659, 784, 1047].forEach((f, i) => this.tone('square', f, f, 0.16, 0.05, i * 0.08));
  }
  best() {
    if (!this.ok('best')) return;
    [784, 988, 1175, 1568].forEach((f, i) => this.tone('triangle', f, f, 0.2, 0.08, i * 0.09));
  }
  over() {
    if (!this.ok('over')) return;
    [392, 330, 262].forEach((f, i) => this.tone('triangle', f, f * 0.98, 0.22, 0.07, 0.1 + i * 0.14));
  }
}
