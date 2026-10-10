/* Doodle Jump - synthesised sound effects (WebAudio, no samples). */
(function () {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, noiseBuf = null, muted = false;
  var loops = {};

  function init() {
    if (ctx || !AC) return ctx;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.7;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp);
      comp.connect(ctx.destination);
      var len = ctx.sampleRate * 1.5;
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }

  function unlock() {
    if (!init()) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      // a silent blip finishes unlocking on iOS
      var o = ctx.createOscillator(), g = ctx.createGain();
      g.gain.value = 0; o.connect(g); g.connect(master);
      o.start(); o.stop(ctx.currentTime + 0.01);
    } catch (e) { /* ignore */ }
  }

  function ready() { return ctx && !muted && ctx.state === 'running'; }

  function env(g, t, a, peak, d, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(end || 0.0001, t + a + d);
  }

  function osc(type, f0, f1, dur, peak, opts) {
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) {
      if (opts.linear) o.frequency.linearRampToValueAtTime(f1, t + dur);
      else o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    }
    var lfo = null;
    if (opts.vib) {
      lfo = ctx.createOscillator();
      var lg = ctx.createGain();
      lfo.frequency.value = opts.vib[0]; lg.gain.value = opts.vib[1];
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start(t); lfo.stop(t + dur + 0.05);
    }
    var node = o;
    if (opts.lp) {
      var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.lp;
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(master);
    env(g, t, opts.attack || 0.005, peak, dur);
    o.start(t); o.stop(t + dur + 0.05);
    return { o: o, g: g, lfo: lfo };
  }

  function noise(dur, peak, type, freq, opts) {
    opts = opts || {};
    var t = ctx.currentTime + (opts.delay || 0);
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.loop = dur > 1.4;
    var f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1200;
    if (opts.q) f.Q.value = opts.q;
    if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + dur);
    var g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(master);
    env(g, t, opts.attack || 0.004, peak, dur);
    s.start(t, Math.random() * 0.3); s.stop(t + dur + 0.05);
    return { s: s, g: g };
  }

  var SFX = {
    jump: function () {
      osc('triangle', 190, 620, 0.11, 0.32, { attack: 0.004 });
      osc('sine', 380, 1150, 0.1, 0.08);
    },
    spring: function () {
      osc('triangle', 260, 980, 0.42, 0.3, { vib: [17, 70], linear: true });
      osc('square', 520, 1400, 0.18, 0.04, { lp: 2500 });
    },
    trampoline: function () {
      osc('triangle', 150, 520, 0.22, 0.3, { vib: [11, 40] });
      osc('triangle', 520, 1250, 0.45, 0.24, { delay: 0.18, vib: [13, 60], linear: true });
    },
    propeller: function (dur) { startLoop('prop', dur || 2.9); },
    jetpack: function (dur) { startLoop('jet', dur || 3.4); },
    flyEnd: function () { stopLoops(); },
    monster: function () {
      osc('sawtooth', 85, 60, 0.6, 0.16, { vib: [9, 18], lp: 600, attack: 0.05 });
      osc('square', 120, 90, 0.45, 0.05, { vib: [7, 12], lp: 400, attack: 0.04 });
    },
    ufo: function () { osc('sine', 520, 520, 0.9, 0.12, { vib: [7, 180], attack: 0.1 }); },
    hole: function () { osc('sine', 140, 70, 0.7, 0.14, { vib: [4, 15], attack: 0.15 }); },
    stomp: function () {
      osc('sine', 220, 45, 0.18, 0.4);
      noise(0.08, 0.2, 'lowpass', 900);
      osc('triangle', 300, 900, 0.12, 0.15, { delay: 0.05 });
    },
    shoot: function () { osc('square', 1500, 320, 0.09, 0.1, { lp: 3500 }); },
    hit: function () { osc('square', 700, 500, 0.06, 0.1); noise(0.04, 0.12, 'highpass', 2000); },
    kill: function () {
      osc('square', 650, 90, 0.32, 0.12, { lp: 2200 });
      noise(0.15, 0.15, 'bandpass', 1200, { q: 1 });
    },
    break: function () {
      noise(0.13, 0.4, 'highpass', 1500);
      noise(0.06, 0.25, 'bandpass', 3000, { delay: 0.05, q: 2 });
      osc('square', 240, 80, 0.08, 0.06);
    },
    vanish: function () { noise(0.2, 0.12, 'lowpass', 3000, { sweep: 400 }); },
    fall: function () { osc('sine', 1700, 170, 1.3, 0.18, { attack: 0.02, vib: [5, 8] }); },
    hurt: function () {
      osc('square', 300, 200, 0.07, 0.15, { lp: 1500 });
      osc('triangle', 900, 1000, 0.5, 0.1, { delay: 0.05, vib: [10, 120] });
    },
    suck: function () { osc('sine', 700, 50, 1.0, 0.25, { vib: [14, 60] }); noise(0.9, 0.1, 'bandpass', 800, { sweep: 120, q: 3 }); },
    abduct: function () { osc('sine', 200, 1400, 1.1, 0.2, { vib: [9, 90] }); },
    best: function () {
      [523, 659, 784, 1047].forEach(function (f, i) { osc('triangle', f, f, 0.14, 0.15, { delay: i * 0.08 }); });
    },
    over: function () {},
    click: function () { osc('triangle', 900, 600, 0.05, 0.12); }
  };

  function startLoop(kind, dur) {
    stopLoops();
    var t = ctx.currentTime;
    var out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(kind === 'jet' ? 0.3 : 0.16, t + 0.15);
    out.gain.setValueAtTime(kind === 'jet' ? 0.3 : 0.16, t + Math.max(0.2, dur - 0.35));
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(master);
    var nodes = [];
    if (kind === 'prop') {
      var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 95;
      var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 1.4;
      var am = ctx.createGain(); am.gain.value = 0.5;
      var lfo = ctx.createOscillator(); lfo.frequency.value = 24;
      var lg = ctx.createGain(); lg.gain.value = 0.5;
      lfo.connect(lg); lg.connect(am.gain);
      o.connect(bp); bp.connect(am); am.connect(out);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
      nodes.push(o, lfo);
    } else {
      var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      var bp2 = ctx.createBiquadFilter(); bp2.type = 'peaking'; bp2.frequency.value = 180; bp2.gain.value = 12;
      var am2 = ctx.createGain(); am2.gain.value = 0.8;
      var lfo2 = ctx.createOscillator(); lfo2.frequency.value = 13;
      var lg2 = ctx.createGain(); lg2.gain.value = 0.2;
      lfo2.connect(lg2); lg2.connect(am2.gain);
      s.connect(lp); lp.connect(bp2); bp2.connect(am2); am2.connect(out);
      s.start(t); lfo2.start(t); s.stop(t + dur + 0.1); lfo2.stop(t + dur + 0.1);
      nodes.push(s, lfo2);
    }
    loops.cur = { out: out, nodes: nodes };
  }
  function stopLoops() {
    var l = loops.cur;
    if (!l || !ctx) return;
    loops.cur = null;
    try {
      var t = ctx.currentTime;
      l.out.gain.cancelScheduledValues(t);
      l.out.gain.setValueAtTime(Math.max(0.0001, l.out.gain.value), t);
      l.out.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      l.nodes.forEach(function (n) { try { n.stop(t + 0.15); } catch (e) { /* already stopped */ } });
    } catch (e) { /* ignore */ }
  }

  window.DJAudio = {
    unlock: unlock,
    play: function (name, arg) {
      if (!ready() || !SFX[name]) return;
      try { SFX[name](arg); } catch (e) { /* never let audio break the game */ }
    },
    stopLoops: stopLoops,
    setMuted: function (m) {
      muted = !!m;
      if (master) {
        try { master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.02); } catch (e) { master.gain.value = muted ? 0 : 0.7; }
      }
      if (muted) stopLoops();
    },
    isMuted: function () { return muted; },
    suspend: function () { stopLoops(); if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) { /* ignore */ } } },
    resume: function () { if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } } },
    state: function () { return ctx ? ctx.state : 'none'; }
  };
})();
