/* Synthesised pool sounds (WebAudio, no files): cue strike, ball clacks,
 * cushion thuds, pocket drops, foul buzz, win and lose jingles, turn chime.
 * The context starts on the first user gesture; mute is remembered. */
(function (root) {
  'use strict';
  var ctx = null, master = null, noise = null;
  var muted = false;
  var lastClack = 0, clackBurst = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(function () {}); return ctx; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.8;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp); comp.connect(ctx.destination);
    var len = ctx.sampleRate * 0.5;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noise.getChannelData(0);
    var s = 12345;
    for (var i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
    return ctx;
  }

  function ok() { return ctx && !muted && ctx.state === 'running'; }

  function env(g, t, a, peak, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
  }
  function tone(type, f0, f1, t, a, peak, decay, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + decay);
    env(g, t, a, peak, decay);
    o.connect(g); g.connect(dest || master);
    o.start(t); o.stop(t + a + decay + 0.05);
  }
  function burst(t, dur, filterType, freq, q, peak, dest) {
    var src = ctx.createBufferSource(); src.buffer = noise;
    var f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain(); env(g, t, 0.002, peak, dur);
    src.connect(f); f.connect(g); g.connect(dest || master);
    src.start(t, Math.random() * 0.3); src.stop(t + dur + 0.05);
  }

  var api = {
    unlock: function () { ensure(); },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.02);
    },
    isMuted: function () { return muted; },
    cue: function (power) {
      if (!ok()) return;
      var t = ctx.currentTime, v = 0.25 + 0.75 * Math.min(1, power);
      burst(t, 0.035, 'bandpass', 2400, 1.2, 0.5 * v);
      tone('sine', 220, 120, t, 0.002, 0.45 * v, 0.07);
      tone('triangle', 1200, 900, t, 0.001, 0.08 * v, 0.03);
    },
    clack: function (speed) {
      if (!ok()) return;
      var now = ctx.currentTime;
      if (now - lastClack < 0.012) { if (++clackBurst > 4) return; } else clackBurst = 0;
      lastClack = now;
      var v = Math.min(1, Math.pow(speed / 3.5, 0.8));
      if (v < 0.02) return;
      var f = 2600 + Math.random() * 900;
      tone('sine', f, f * 0.96, now, 0.001, 0.5 * v, 0.028);
      tone('sine', f * 1.52, f * 1.45, now, 0.001, 0.22 * v, 0.018);
      burst(now, 0.012, 'highpass', 3500, 0.7, 0.35 * v);
    },
    cushion: function (speed) {
      if (!ok()) return;
      var v = Math.min(1, speed / 3.2);
      if (v < 0.03) return;
      var t = ctx.currentTime;
      tone('sine', 140, 90, t, 0.003, 0.4 * v, 0.09);
      burst(t, 0.06, 'lowpass', 700, 0.8, 0.25 * v);
    },
    pocket: function (speed) {
      if (!ok()) return;
      var t = ctx.currentTime, v = 0.45 + 0.55 * Math.min(1, speed / 2.5);
      tone('sine', 170, 75, t, 0.004, 0.5 * v, 0.16);
      for (var i = 0; i < 3; i++) {
        var dt = 0.05 + i * 0.05 + Math.random() * 0.02;
        tone('triangle', 900 - i * 140, 700 - i * 120, t + dt, 0.001, 0.12 * v / (i + 1), 0.03);
      }
      burst(t + 0.04, 0.32, 'lowpass', 450, 0.7, 0.18 * v);
    },
    foul: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(master);
      tone('sawtooth', 150, 95, t, 0.01, 0.16, 0.38, f);
      tone('sawtooth', 152, 97, t + 0.01, 0.01, 0.12, 0.38, f);
    },
    win: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone('triangle', f, f, t + i * 0.11, 0.01, 0.28, 0.35);
        tone('sine', f * 2, f * 2, t + i * 0.11, 0.01, 0.06, 0.25);
      });
      tone('triangle', 1318.5, 1318.5, t + 0.48, 0.01, 0.22, 0.7);
    },
    lose: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      [392, 349.23, 311.13, 261.63].forEach(function (f, i) { tone('triangle', f, f * 0.98, t + i * 0.16, 0.01, 0.22, 0.4); });
    },
    turn: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      tone('sine', 880, 880, t, 0.005, 0.12, 0.2);
      tone('sine', 1174.7, 1174.7, t + 0.09, 0.005, 0.1, 0.3);
    },
    tick: function () {
      if (!ok()) return;
      tone('square', 1800, 1700, ctx.currentTime, 0.001, 0.03, 0.02);
    }
  };
  root.PoolAudio = api;
})(typeof window !== 'undefined' ? window : globalThis);
