/* Synthesised Connect 4 sounds (WebAudio, no files): disc drops that thud
 * deeper the further they fall, the little bounce, column hover ticks, a
 * refusal buzz, win / lose / draw jingles and an emoji pop. The context
 * starts on the first user gesture; mute is remembered by the page. */
(function (root) {
  'use strict';
  var ctx = null, master = null, noise = null;
  var muted = false;

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
    var len = Math.floor(ctx.sampleRate * 0.5);
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
  function tone(type, f0, f1, t, a, peak, decay) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + decay);
    env(g, t, a, peak, decay);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + a + decay + 0.05);
  }
  function burst(t, dur, filterType, freq, q, peak) {
    var src = ctx.createBufferSource(); src.buffer = noise;
    var f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    var g = ctx.createGain(); env(g, t, 0.002, peak, dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 0.3); src.stop(t + dur + 0.05);
  }

  var api = {
    unlock: function () { ensure(); },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.02);
    },
    isMuted: function () { return muted; },
    /** A disc landing. depth 0..1 (how far it fell), player 1/2 for a slightly different knock. */
    drop: function (depth, player) {
      if (!ok()) return;
      var t = ctx.currentTime, v = 0.45 + 0.55 * Math.min(1, depth);
      var base = player === 2 ? 1.06 : 1;
      tone('sine', 210 * base, 95, t, 0.002, 0.55 * v, 0.12);
      tone('triangle', 620 * base, 380, t, 0.001, 0.14 * v, 0.05);
      burst(t, 0.05, 'bandpass', 1500, 1.4, 0.32 * v);
      burst(t, 0.09, 'lowpass', 500, 0.7, 0.2 * v);
    },
    bounce: function (v) {
      if (!ok()) return;
      var t = ctx.currentTime, k = Math.min(1, v);
      tone('sine', 300, 180, t, 0.001, 0.18 * k, 0.05);
      burst(t, 0.025, 'bandpass', 2200, 1.2, 0.1 * k);
    },
    hover: function () {
      if (!ok()) return;
      tone('sine', 1500, 1400, ctx.currentTime, 0.001, 0.025, 0.025);
    },
    click: function () {
      if (!ok()) return;
      tone('triangle', 900, 700, ctx.currentTime, 0.001, 0.08, 0.04);
    },
    nope: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      tone('square', 180, 150, t, 0.005, 0.07, 0.12);
      tone('square', 150, 120, t + 0.1, 0.005, 0.06, 0.12);
    },
    lift: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      tone('sine', 300, 700, t, 0.005, 0.12, 0.12);
    },
    win: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone('triangle', f, f, t + i * 0.1, 0.01, 0.26, 0.32);
        tone('sine', f * 2, f * 2, t + i * 0.1, 0.01, 0.05, 0.22);
      });
      tone('triangle', 1318.5, 1318.5, t + 0.44, 0.01, 0.2, 0.7);
      tone('triangle', 1567.98, 1567.98, t + 0.44, 0.01, 0.12, 0.7);
    },
    lose: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      [392, 349.23, 311.13, 261.63].forEach(function (f, i) { tone('triangle', f, f * 0.98, t + i * 0.16, 0.01, 0.2, 0.4); });
    },
    draw: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      [523.25, 493.88, 523.25].forEach(function (f, i) { tone('triangle', f, f, t + i * 0.14, 0.01, 0.18, 0.3); });
    },
    turn: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      tone('sine', 880, 880, t, 0.005, 0.09, 0.18);
      tone('sine', 1174.7, 1174.7, t + 0.08, 0.005, 0.08, 0.26);
    },
    pop: function () {
      if (!ok()) return;
      var t = ctx.currentTime;
      tone('sine', 500, 1200, t, 0.002, 0.15, 0.12);
    }
  };
  root.C4Audio = api;
})(typeof window !== 'undefined' ? window : globalThis);
