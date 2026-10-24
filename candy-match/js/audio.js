// audio.js: all sounds are synthesised with WebAudio (no files). The context is created on
// the first user gesture; a toggle mutes everything.
let ctx = null, master = null, noiseBuf = null, muted = false;
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const hz = semi => 392 * Math.pow(2, semi / 12);

function init() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain(); master.gain.value = 0.55;
    master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ctx = null; }
  return ctx;
}

function tone(type, f0, f1, dur, vol = 0.3, when = 0, attack = 0.005) {
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, f0, f1, when = 0, type = 'lowpass') {
  const t = ctx.currentTime + when;
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
}

const SOUNDS = {
  click: () => tone('triangle', 520, 700, 0.07, 0.18),
  select: () => tone('triangle', 640, 860, 0.09, 0.2),
  swap: () => { tone('sine', 300, 520, 0.1, 0.2); noise(0.08, 0.05, 2400, 800); },
  bad: () => { tone('square', 190, 120, 0.16, 0.14); tone('square', 150, 95, 0.18, 0.1, 0.07); },
  pop: n => {
    const d = SCALE[Math.min(SCALE.length - 1, Math.max(0, n))];
    tone('triangle', hz(d), hz(d), 0.2, 0.3);
    tone('sine', hz(d + 12), hz(d + 12), 0.12, 0.1);
    noise(0.05, 0.1, 5000, 1500);
  },
  special: () => [0, 4, 7, 12, 16].forEach((s, i) => tone('triangle', hz(s + 12), hz(s + 12), 0.2, 0.2, i * 0.045)),
  stripe: () => { tone('sawtooth', 180, 1800, 0.35, 0.16); noise(0.35, 0.12, 600, 6000, 0, 'bandpass'); },
  blast: () => { tone('sine', 150, 38, 0.45, 0.5); noise(0.4, 0.4, 3000, 120); },
  zap: () => { tone('sawtooth', 300, 2200, 0.3, 0.14); for (let i = 0; i < 6; i++) tone('square', 900 + Math.random() * 1600, 400, 0.05, 0.07, i * 0.04); },
  mega: () => { tone('sine', 110, 28, 0.9, 0.55); noise(0.9, 0.5, 4000, 60); [0, 7, 12, 19].forEach((s, i) => tone('triangle', hz(s + 12), hz(s + 12), 0.4, 0.2, 0.1 + i * 0.07)); },
  land: () => tone('sine', 150, 90, 0.07, 0.16),
  hammer: () => { tone('sine', 220, 55, 0.22, 0.5); noise(0.12, 0.3, 1800, 200); },
  shuffle: () => { for (let i = 0; i < 9; i++) tone('triangle', 300 + (i % 3) * 120 + i * 20, 400, 0.06, 0.12, i * 0.045); },
  jelly: () => { tone('sine', 900, 500, 0.08, 0.14); noise(0.06, 0.1, 6000, 3000); },
  cage: () => { tone('square', 240, 160, 0.09, 0.14); noise(0.1, 0.18, 3500, 600, 0, 'highpass'); },
  star: i => tone('triangle', hz(12 + i * 4), hz(12 + i * 4), 0.5, 0.3),
  win: () => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => { tone('triangle', hz(s + 12), hz(s + 12), 0.45, 0.24, i * 0.09); tone('sine', hz(s), hz(s), 0.45, 0.12, i * 0.09); }),
  lose: () => [7, 5, 2, -3].forEach((s, i) => tone('triangle', hz(s), hz(s - 1), 0.35, 0.22, i * 0.2)),
  deliver: () => [0, 7, 12].forEach((s, i) => tone('sine', hz(s + 12), hz(s + 12), 0.25, 0.25, i * 0.07)),
  spread: () => { tone('sawtooth', 120, 70, 0.3, 0.16); noise(0.3, 0.1, 500, 120); },
};

export const Sfx = {
  get muted() { return muted; },
  setMuted(m) { muted = !!m; if (master) master.gain.value = muted ? 0 : 0.55; },
  /** Call from a user gesture so browsers allow audio. */
  unlock() { const c = init(); if (c && c.state === 'suspended') c.resume().catch(() => {}); },
  suspend() { if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {}); },
  resume() { if (ctx && ctx.state === 'suspended' && !muted) ctx.resume().catch(() => {}); },
  play(name, arg) {
    if (muted || !ctx || ctx.state !== 'running') return;
    try { SOUNDS[name](arg); } catch (e) { /* audio must never break the game */ }
  },
};
