/* Synthesised sound effects (WebAudio, no samples).
 * The AudioContext is created on the first user gesture (browsers block audio
 * before that); until then every call is a silent no-op. */
(function () {
  'use strict';

  let ctx = null, master = null, noiseBuf = null;
  let muted = false;
  const last = Object.create(null);

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 5;
      comp.attack.value = 0.003; comp.release.value = 0.15;
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(comp);
      comp.connect(ctx.destination);
      const n = Math.floor(ctx.sampleRate * 0.6);
      noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') { try { ctx.resume().catch(function () {}); } catch (e) { /* ignore */ } }
    return ctx;
  }

  function ready() { return ctx && !muted && ctx.state !== 'closed'; }

  // allow a sound at most once per `ms` so a fireball sweep does not clip
  function gate(key, ms) {
    const now = performance.now();
    if (last[key] && now - last[key] < ms) return false;
    last[key] = now;
    return true;
  }

  function tone(o) {
    if (!ready()) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const dur = o.d || 0.1;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    const g = ctx.createGain();
    const v = o.v || 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + (o.a || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    let out = g;
    if (o.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = o.lp;
      g.connect(f); out = f;
    }
    out.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise(o) {
    if (!ready()) return;
    const t0 = ctx.currentTime + (o.delay || 0);
    const dur = o.d || 0.1;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.ft || 'lowpass';
    f.frequency.setValueAtTime(o.f || 2000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + dur);
    f.Q.value = o.q || 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.v || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.03);
  }

  // major pentatonic, rising with each row up the wall
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28, 31];
  function note(base, semis) { return base * Math.pow(2, semis / 12); }

  const Sound = {
    unlock: ensure,
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      if (master && ctx) {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.02);
        } catch (e) { master.gain.value = muted ? 0 : 0.6; }
      }
    },

    paddle: function (off) {
      if (!gate('paddle', 30)) return;
      const f = 300 + (off || 0) * 30;
      tone({ type: 'triangle', f: f, f2: f * 0.92, d: 0.11, v: 0.32 });
      tone({ type: 'square', f: f / 2, d: 0.06, v: 0.06, lp: 1200 });
    },
    brick: function (row) {
      if (!gate('brick', 22)) return;
      const f = note(330, PENTA[Math.max(0, Math.min(PENTA.length - 1, row | 0))]);
      tone({ type: 'square', f: f, d: 0.09, v: 0.11, lp: 4200 });
      tone({ type: 'sine', f: f * 2, d: 0.12, v: 0.06 });
    },
    damage: function () {
      if (!gate('damage', 30)) return;
      tone({ type: 'triangle', f: 210, f2: 150, d: 0.09, v: 0.22 });
      noise({ f: 3000, d: 0.05, v: 0.08, ft: 'bandpass', q: 2 });
    },
    steel: function () {
      if (!gate('steel', 40)) return;
      tone({ type: 'square', f: 1180, d: 0.16, v: 0.045, lp: 6000 });
      tone({ type: 'square', f: 1620, d: 0.13, v: 0.035, detune: 8, lp: 6000 });
      tone({ type: 'triangle', f: 560, d: 0.2, v: 0.12 });
    },
    wall: function () {
      if (!gate('wall', 35)) return;
      tone({ type: 'triangle', f: 180, f2: 140, d: 0.05, v: 0.14 });
    },
    launch: function () {
      tone({ type: 'sine', f: 380, f2: 900, d: 0.14, v: 0.16 });
    },
    laser: function () {
      if (!gate('laser', 60)) return;
      tone({ type: 'sawtooth', f: 1500, f2: 260, d: 0.12, v: 0.06, lp: 5000 });
    },
    smash: function () {
      if (!gate('smash', 50)) return;
      noise({ f: 1800, f2: 300, d: 0.22, v: 0.25 });
    },
    powerup: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { tone({ type: 'square', f: f, d: 0.09, v: 0.08, delay: i * 0.055, lp: 5000 }); });
      tone({ type: 'sine', f: 1568, d: 0.3, v: 0.06, delay: 0.22 });
    },
    bad: function () {
      tone({ type: 'sawtooth', f: 420, f2: 120, d: 0.34, v: 0.1, lp: 2200 });
      tone({ type: 'square', f: 300, f2: 90, d: 0.3, v: 0.05, delay: 0.05, lp: 1500 });
    },
    life: function () {
      [784, 988, 1175, 1568, 1976].forEach(function (f, i) { tone({ type: 'triangle', f: f, d: 0.12, v: 0.16, delay: i * 0.07 }); });
    },
    catchBall: function () {
      if (!gate('catch', 60)) return;
      tone({ type: 'sine', f: 660, f2: 520, d: 0.08, v: 0.14 });
    },
    lifeLost: function () {
      tone({ type: 'square', f: 520, f2: 70, d: 0.7, v: 0.12, lp: 2500 });
      tone({ type: 'triangle', f: 260, f2: 50, d: 0.8, v: 0.18 });
      noise({ f: 1200, f2: 120, d: 0.5, v: 0.18 });
    },
    levelClear: function () {
      const seq = [523, 659, 784, 1047, 784, 1047, 1319];
      seq.forEach(function (f, i) {
        tone({ type: 'square', f: f, d: 0.13, v: 0.07, delay: i * 0.09, lp: 4000 });
        tone({ type: 'triangle', f: f / 2, d: 0.14, v: 0.12, delay: i * 0.09 });
      });
    },
    speedUp: function () {
      tone({ type: 'square', f: 880, d: 0.05, v: 0.05 });
      tone({ type: 'square', f: 1320, d: 0.06, v: 0.05, delay: 0.05 });
    },
    shrink: function () {
      tone({ type: 'square', f: 600, f2: 300, d: 0.2, v: 0.08, lp: 2000 });
    },
    gameOver: function () {
      [392, 330, 262, 196].forEach(function (f, i) {
        tone({ type: 'triangle', f: f, d: 0.32, v: 0.2, delay: i * 0.22 });
        tone({ type: 'square', f: f / 2, d: 0.3, v: 0.04, delay: i * 0.22, lp: 900 });
      });
    },
    win: function () {
      const seq = [523, 659, 784, 1047, 880, 1047, 1319, 1568];
      seq.forEach(function (f, i) {
        tone({ type: 'square', f: f, d: 0.16, v: 0.07, delay: i * 0.12, lp: 4500 });
        tone({ type: 'triangle', f: f / 2, d: 0.2, v: 0.14, delay: i * 0.12 });
      });
    },
    click: function () {
      tone({ type: 'triangle', f: 660, d: 0.05, v: 0.1 });
    },
  };

  window.BreakoutSound = Sound;
})();
