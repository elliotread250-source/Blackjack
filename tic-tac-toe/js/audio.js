// Synthesised blips. Nothing is loaded; the AudioContext is only created after a gesture.
let ctx = null, out = null, muted = false;

function ensure() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    out = ctx.createGain(); out.gain.value = 0.35; out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'sine', vol = 0.6, slide = 0) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + start, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}

export const sound = {
  get muted() { return muted; },
  set muted(v) { muted = v; },
  place(p) { p === 'X' ? tone(520, 0, 0.12, 'triangle', 0.5, 0.7) : tone(330, 0, 0.16, 'sine', 0.6, 1.3); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.45)); },
  lose() { [392, 330, 262].forEach((f, i) => tone(f, i * 0.12, 0.25, 'sawtooth', 0.18)); },
  draw() { tone(440, 0, 0.18, 'sine', 0.4); tone(440, 0.2, 0.18, 'sine', 0.4); },
  tap() { tone(800, 0, 0.05, 'square', 0.12); },
};
