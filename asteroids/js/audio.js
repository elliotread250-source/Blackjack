/*
 * Synthesised sound, standing in for the arcade's discrete analogue sound
 * board: the two-note thump, the falling "pew", filtered-noise thrust and
 * explosions, the saucer sirens and the extra-life chime. Nothing is sampled
 * and nothing is fetched. The AudioContext is only made on a user gesture.
 */
(function () {
  'use strict';

  let ctx = null, master = null, noiseBuf = null;
  let muted = false;
  const VOL = 0.5;
  let thrust = null;          // { src, gain }
  let saucer = null;          // { kind, osc, lfo, gain }
  const last = {};

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOL;
      master.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 2);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return ctx;
  }

  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended' && ctx.resume) {
      try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
    }
  }

  function ready() {
    return ctx && !muted && ctx.state === 'running';
  }

  function throttle(key, ms) {
    const t = performance.now();
    if (last[key] && t - last[key] < ms) return false;
    last[key] = t;
    return true;
  }

  function envGain(t, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(master);
    return g;
  }

  function sweep(type, f0, f1, dur, peak, cutoff) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = envGain(t, peak, 0.004, dur);
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = cutoff;
      o.connect(f); f.connect(g);
    } else {
      o.connect(g);
    }
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur, peak, f0, f1, type) {
    if (!ready()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type || 'lowpass';
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = envGain(t, peak, 0.005, dur);
    src.connect(f); f.connect(g);
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.05);
  }

  const S = {
    unlock,
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m;
      if (master) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setTargetAtTime(muted ? 0 : VOL, t, 0.02);
      }
    },
    get state() { return ctx ? ctx.state : 'none'; },

    fire() { sweep('square', 1500, 230, 0.16, 0.09, 3200); },
    saucerFire() { sweep('square', 1050, 170, 0.2, 0.06, 2200); },

    explode(size) {
      if (!throttle('x' + size, 45)) return;
      if (size >= 3) { noise(1.15, 0.7, 900, 90); sweep('sine', 90, 35, 0.5, 0.35); }
      else if (size === 2) noise(0.7, 0.5, 1500, 160);
      else noise(0.4, 0.38, 2600, 300);
    },

    shipExplode() {
      noise(1.6, 0.75, 1300, 60);
      sweep('sine', 120, 30, 0.9, 0.4);
    },

    beat(n) {
      if (!ready()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(n ? 55 : 62, t);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 240; f.Q.value = 4;
      const g = envGain(t, 0.55, 0.004, 0.12);
      o.connect(f); f.connect(g);
      o.start(t); o.stop(t + 0.16);
    },

    hyper() { noise(0.35, 0.18, 400, 3200, 'bandpass'); },
    hyperIn() { noise(0.3, 0.14, 3000, 500, 'bandpass'); },

    extraLife() {
      if (!ready()) return;
      const t0 = ctx.currentTime;
      for (let i = 0; i < 12; i++) {
        const t = t0 + i * 0.075;
        const o = ctx.createOscillator();
        o.type = 'square';
        o.frequency.value = 1320;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.004);
        g.gain.setValueAtTime(0.07, t + 0.035);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
        o.connect(g); g.connect(master);
        o.start(t); o.stop(t + 0.06);
      }
    },

    thrust(on) {
      if (!ctx || !master) return;
      if (on && !thrust && ctx.state === 'running') {
        const src = ctx.createBufferSource();
        src.buffer = noiseBuf; src.loop = true;
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 1.5;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(f); f.connect(g); g.connect(master);
        src.start();
        thrust = { src, gain: g, on: false };
      }
      if (!thrust || thrust.on === on) return;
      thrust.on = on;
      const t = ctx.currentTime;
      thrust.gain.gain.cancelScheduledValues(t);
      thrust.gain.gain.setTargetAtTime(on ? 0.55 : 0, t, on ? 0.02 : 0.05);
    },

    /** kind: null | 'large' | 'small' */
    saucer(kind) {
      if (!ctx || !master) return;
      if (saucer && saucer.kind === kind) return;
      if (saucer) {
        const old = saucer, t = ctx.currentTime;
        old.gain.gain.cancelScheduledValues(t);
        old.gain.gain.setTargetAtTime(0, t, 0.03);
        old.osc.stop(t + 0.2); old.lfo.stop(t + 0.2);
        saucer = null;
      }
      if (!kind || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const small = kind === 'small';
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = small ? 960 : 430;
      const lfo = ctx.createOscillator();
      lfo.type = 'triangle';
      lfo.frequency.value = small ? 7.5 : 3.8;
      const depth = ctx.createGain();
      depth.gain.value = small ? 220 : 95;
      lfo.connect(depth); depth.connect(osc.frequency);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = small ? 2600 : 1500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.setTargetAtTime(small ? 0.045 : 0.055, t, 0.05);
      osc.connect(f); f.connect(g); g.connect(master);
      osc.start(t); lfo.start(t);
      saucer = { kind, osc, lfo, gain: g };
    },

    stopLoops() { S.thrust(false); S.saucer(null); },
  };

  window.Sound = S;
})();
