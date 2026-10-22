// Synthesised sounds; the AudioContext starts on the first click.
let ctx = null, out = null;
export const sound = { muted: false };

function ensure() {
  if (sound.muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch { return null; }
    out = ctx.createGain(); out.gain.value = 0.3; out.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(f, at, dur, type = 'sine', vol = 0.5, slide = 1) {
  const c = ensure(); if (!c) return;
  const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide !== 1) o.frequency.exponentialRampToValueAtTime(f * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02);
}
sound.click = () => tone(260 + Math.random() * 80, 0, 0.09, 'triangle', 0.35, 0.55);
sound.buy = () => { tone(880, 0, 0.08, 'square', 0.12); tone(1320, 0.06, 0.12, 'square', 0.1); };
sound.upgrade = () => [660, 880, 1100].forEach((f, i) => tone(f, i * 0.06, 0.14, 'triangle', 0.3));
sound.golden = () => [988, 1319, 1568, 1976].forEach((f, i) => tone(f, i * 0.05, 0.25, 'sine', 0.3));
sound.achievement = () => [523, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.3, 'triangle', 0.3));
