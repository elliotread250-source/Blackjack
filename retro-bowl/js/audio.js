// Tiny synthesised sound effects (no files): whistle, thud, catch, kick, crowd roar.
let ctx = null, on = true;
export function setSound(v) { on = !!v; }
function ac() {
  if (!on) return null;
  try { ctx ||= new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, a.currentTime + dur);
  g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
function noise(dur, vol = 0.2, freq = 800) {
  const a = ac(); if (!a) return;
  const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
}
export const sfx = {
  whistle() { tone(2200, 0.25, 'sine', 0.05); setTimeout(() => tone(2400, 0.18, 'sine', 0.05), 60); },
  snap() { tone(140, 0.08, 'square', 0.06); },
  throw() { tone(500, 0.12, 'triangle', 0.06, 300); },
  catch() { tone(660, 0.06, 'square', 0.05); setTimeout(() => tone(880, 0.08, 'square', 0.05), 60); },
  tackle() { noise(0.18, 0.35, 200); tone(80, 0.15, 'square', 0.08); },
  kick() { noise(0.08, 0.4, 300); tone(120, 0.1, 'square', 0.08, -40); },
  bad() { tone(300, 0.2, 'square', 0.06, -150); },
  cheer() { noise(1.4, 0.18, 1200); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'square', 0.05), i * 110)); },
  click() { tone(900, 0.03, 'square', 0.03); },
};
