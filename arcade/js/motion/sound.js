// UI sounds, all synthesised with Web Audio (nothing downloaded). Off by default; never starts before a user
// gesture; master volume from Settings. Hover blips are throttled.
const root = document.documentElement;
let ac = null, master = null, vol = .6, lastBlip = 0, unlocked = false;
export const soundOn = () => root.dataset.sound === 'on';
export function setVolume(v) { vol = Math.max(0, Math.min(1, v)); if (master) master.gain.value = vol * .5; }
function ctx() {
  if (!unlocked || !soundOn()) return null;
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ac = new AC(); master = ac.createGain(); master.gain.value = vol * .5; master.connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, () => { unlocked = true; }, { once: true, capture: true });

function tone({ f = 440, f2, type = 'square', t = .08, a = .002, gain = .25, delay = 0 }) {
  const c = ctx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), now = c.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(f, now); if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + t);
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(gain, now + a); g.gain.exponentialRampToValueAtTime(.0001, now + t);
  o.connect(g); g.connect(master); o.start(now); o.stop(now + t + .02);
}
function noise({ t = .12, gain = .2, delay = 0, hp = 1200 }) {
  const c = ctx(); if (!c) return;
  const b = c.createBuffer(1, c.sampleRate * t, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  f.type = 'highpass'; f.frequency.value = hp; g.gain.value = gain; s.buffer = b;
  s.connect(f); f.connect(g); g.connect(master); s.start(c.currentTime + delay);
}
export const sfx = {
  blip() { const n = performance.now(); if (n - lastBlip < 90) return; lastBlip = n; tone({ f: 1320, f2: 1760, type: 'square', t: .035, gain: .05 }); },
  click() { tone({ f: 660, f2: 990, t: .05, gain: .1 }); },
  coin() { tone({ f: 988, t: .08, gain: .16 }); tone({ f: 1319, t: .26, gain: .16, delay: .07 }); noise({ t: .05, gain: .08, hp: 3000 }); },
  tick() { tone({ f: 1800, type: 'triangle', t: .025, gain: .08 }); },
  clunk() { tone({ f: 140, f2: 60, type: 'sine', t: .14, gain: .32 }); noise({ t: .06, gain: .12, hp: 400 }); },
  jackpot() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'square', t: .22, gain: .12, delay: i * .08 })); tone({ f: 1568, type: 'triangle', t: .6, gain: .1, delay: .34 }); },
  sparkle() { [1568, 2093, 2637, 3136].forEach((f, i) => tone({ f, type: 'triangle', t: .18, gain: .07, delay: i * .05 })); },
  error() { tone({ f: 180, f2: 120, type: 'sawtooth', t: .28, gain: .14 }); tone({ f: 120, f2: 90, type: 'sawtooth', t: .3, gain: .1, delay: .12 }); },
  hum() { tone({ f: 55, f2: 110, type: 'sine', t: .9, a: .2, gain: .18 }); tone({ f: 110, f2: 220, type: 'triangle', t: .7, a: .3, gain: .05, delay: .15 }); },
  whoosh() { noise({ t: .4, gain: .1, hp: 700 }); },
  pop() { tone({ f: 520, f2: 1040, type: 'sine', t: .09, gain: .16 }); },
  pfff() { noise({ t: .2, gain: .07, hp: 2000 }); tone({ f: 400, f2: 160, type: 'sine', t: .18, gain: .06 }); },
  send() { [880, 1175, 1568].forEach((f, i) => tone({ f, t: .1, gain: .09, delay: i * .06 })); },
};
export function play(name) { try { sfx[name] && sfx[name](); } catch { /* audio is optional */ } }
