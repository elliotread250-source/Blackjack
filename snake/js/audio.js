/* Synthesised sound effects. The AudioContext is created on the first user
   gesture (browsers refuse to start one before that) and resumed after. */
(function () {
  'use strict';
  var Store = window.SnakeStore;
  var VOLUME = 0.7;
  var ctx = null, master = null, noiseBuf = null;
  var muted = !!Store.get('muted', false);
  var listeners = [];

  function create() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (e) { ctx = null; return null; }
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.2;
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(comp);
    comp.connect(ctx.destination);
    var len = Math.floor(ctx.sampleRate * 0.6);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function unlock() {
    var c = create();
    if (c && c.state === 'suspended') {
      try {
        var p = c.resume();
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* ignore */ }
    }
  }
  ['pointerdown', 'keydown', 'touchend', 'click'].forEach(function (type) {
    window.addEventListener(type, unlock, { capture: true, passive: true });
  });

  function envelope(g, t0, vol, attack, decay) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  function tone(o) {
    var t0 = ctx.currentTime + (o.delay || 0);
    var attack = o.attack || 0.004;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + attack + o.dur);
    envelope(g, t0, o.vol || 0.2, attack, o.dur);
    var node = osc;
    if (o.lp) {
      var f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lp;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + attack + o.dur + 0.05);
  }

  function noise(o) {
    var t0 = ctx.currentTime + (o.delay || 0);
    var attack = o.attack || 0.002;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 2000, t0);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + attack + o.dur);
    f.Q.value = o.q || 1;
    var g = ctx.createGain();
    envelope(g, t0, o.vol || 0.2, attack, o.dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0, Math.random() * 0.4);
    src.stop(t0 + attack + o.dur + 0.05);
  }

  function arp(notes, gap, o) {
    notes.forEach(function (f, i) {
      tone({ type: o.type || 'triangle', f0: f, dur: o.dur || 0.12, vol: o.vol || 0.14, delay: (o.delay || 0) + i * gap });
    });
  }

  var sfx = {
    eat: function () {
      var p = 0.92 + Math.random() * 0.16;
      noise({ freq: 1600 * p, q: 0.9, vol: 0.55, dur: 0.045 });
      noise({ freq: 2500 * p, q: 1.1, vol: 0.42, dur: 0.05, delay: 0.04 });
      noise({ freq: 3600 * p, q: 1.4, vol: 0.22, dur: 0.035, delay: 0.085 });
      tone({ type: 'sine', f0: 560 * p, f1: 190 * p, dur: 0.08, vol: 0.3 });
      tone({ type: 'triangle', f0: 990 * p, f1: 1480 * p, dur: 0.06, vol: 0.05, delay: 0.03 });
    },
    start: function () {
      arp([523.25, 659.25, 783.99], 0.065, { vol: 0.12, dur: 0.1 });
    },
    die: function () {
      tone({ type: 'square', f0: 330, f1: 55, dur: 0.5, vol: 0.18, lp: 1400 });
      tone({ type: 'sine', f0: 160, f1: 40, dur: 0.3, vol: 0.35 });
      noise({ filter: 'lowpass', freq: 900, f1: 120, q: 0.7, vol: 0.5, dur: 0.28 });
    },
    win: function () {
      arp([523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], 0.085, { vol: 0.13, dur: 0.18 });
      arp([1046.5, 1567.98, 2093], 0.0, { vol: 0.06, dur: 0.6, delay: 0.55, type: 'sine' });
    },
    best: function () {
      arp([987.77, 1318.51, 1975.53], 0.09, { vol: 0.1, dur: 0.22, type: 'sine' });
    },
    click: function () {
      tone({ type: 'sine', f0: 720, f1: 520, dur: 0.035, vol: 0.08 });
    },
    pause: function () {
      arp([659.25, 440], 0.07, { vol: 0.1, dur: 0.08, type: 'sine' });
    },
    resume: function () {
      arp([440, 659.25], 0.07, { vol: 0.1, dur: 0.08, type: 'sine' });
    }
  };

  function play(name) {
    if (muted || !ctx || !master || !sfx[name]) return;
    if (ctx.state !== 'running') return;
    try { sfx[name](); } catch (e) { /* never let audio break the game */ }
  }

  function setMuted(m) {
    muted = !!m;
    Store.set('muted', muted);
    if (ctx && master) {
      try { master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.01); } catch (e) { /* ignore */ }
    }
    listeners.forEach(function (fn) { fn(muted); });
  }

  window.SnakeAudio = {
    play: play,
    unlock: unlock,
    isMuted: function () { return muted; },
    setMuted: setMuted,
    toggle: function () { setMuted(!muted); return muted; },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
