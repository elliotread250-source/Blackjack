'use strict';
// Tiny WebAudio sound kit: everything is synthesised, nothing to download.
(function () {
  let ctx = null, master = null;
  const last = {};
  const A = {
    volume: 0.5,
    muted: false,
    unlock() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = A.volume;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    },
    setVolume(v) { A.volume = v; if (master) master.gain.value = v; },
    play(name) {
      if (!ctx || A.muted || A.volume <= 0) return;
      const now = ctx.currentTime;
      const gap = { pop: 0.03, shoot: 0.06, tick: 0.05, boom: 0.07, snipe: 0.08, zap: 0.1, freeze: 0.15 }[name] || 0.02;
      if (last[name] && now - last[name] < gap) return;
      last[name] = now;
      switch (name) {
        case 'pop': noise(0.05, 1800 + Math.random() * 1500, 0.22, 'bandpass'); break;
        case 'moabpop': noise(0.35, 400, 0.6, 'lowpass'); tone(90, 0.3, 'sine', 0.4, 40); break;
        case 'boom': noise(0.18, 600, 0.25, 'lowpass'); break;
        case 'shoot': noise(0.03, 3500, 0.05, 'highpass'); break;
        case 'tick': noise(0.02, 2500, 0.04, 'bandpass'); break;
        case 'snipe': noise(0.08, 1200, 0.18, 'bandpass'); tone(220, 0.06, 'square', 0.05, 110); break;
        case 'zap': tone(900, 0.12, 'sawtooth', 0.08, 300); break;
        case 'freeze': tone(1400, 0.2, 'sine', 0.06, 2200); break;
        case 'place': tone(300, 0.08, 'triangle', 0.25, 180); noise(0.05, 900, 0.15, 'lowpass'); break;
        case 'upgrade': [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'triangle', 0.18, f, i * 0.07)); break;
        case 'sell': tone(660, 0.08, 'square', 0.12, 990); tone(990, 0.1, 'square', 0.1, 990, 0.08); break;
        case 'cash': tone(1320, 0.06, 'square', 0.08, 1760); break;
        case 'leak': tone(180, 0.25, 'sawtooth', 0.2, 90); break;
        case 'round': [392, 523].forEach((f, i) => tone(f, 0.15, 'triangle', 0.2, f, i * 0.1)); break;
        case 'ability': tone(200, 0.4, 'sawtooth', 0.15, 800); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.25, f, i * 0.15)); break;
        case 'lose': [392, 330, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.25, f * 0.95, i * 0.25)); break;
      }
    },
  };
  function tone(f, dur, type, vol, f2, delay) {
    const t0 = ctx.currentTime + (delay || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2 && f2 !== f) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
  }
  let nbuf = null;
  function noise(dur, freq, vol, ftype) {
    if (!nbuf) {
      nbuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = nbuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = nbuf;
    const f = ctx.createBiquadFilter(); f.type = ftype; f.frequency.value = freq; f.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.02);
  }
  BTD.audio = A;
})();
