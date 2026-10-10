/* Stickman Hook - synthesised sound (WebAudio, no files). */
(function () {
  'use strict';
  var ctx = null, master = null, noiseBuf = null, muted = false;
  var wind = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(function () {}); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ctx = new AC(); } catch (e) { ctx = null; return; }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    var comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    var len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0), seed = 12345;
    for (var i = 0; i < len; i++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; d[i] = seed / 0x3fffffff - 1; }
    // continuous wind bed, gain follows speed
    var src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
    var g = ctx.createGain(); g.gain.value = 0;
    src.connect(bp); bp.connect(g); g.connect(master); src.start();
    wind = { f: bp, g: g };
  }

  function env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone(type, f0, f1, dur, vol, when) {
    if (!ctx) return;
    var t = ctx.currentTime + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, 0.006, vol, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  function noise(type, f0, f1, q, dur, vol, when) {
    if (!ctx) return;
    var t = ctx.currentTime + (when || 0);
    var s = ctx.createBufferSource(); s.buffer = noiseBuf;
    var f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var g = ctx.createGain(); env(g, t, Math.min(0.03, dur / 3), vol, dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  var sounds = {
    grab: function () {           // rope snapping taut
      noise('highpass', 2500, 0, 0.8, 0.05, 0.5);
      tone('triangle', 520, 180, 0.09, 0.35);
      tone('square', 1400, 900, 0.03, 0.08);
    },
    release: function (o) {       // swoosh
      var k = Math.min(1, ((o && o.speed) || 800) / 1600);
      noise('bandpass', 500 + 400 * k, 2400 + 1600 * k, 1.4, 0.22 + 0.1 * k, 0.35 + 0.3 * k);
    },
    jump: function () { tone('triangle', 300, 600, 0.12, 0.25); },
    boing: function (o) {         // trampoline / bouncy wall
      if (!ctx) return;
      var t = ctx.currentTime, oo = ctx.createOscillator(), g = ctx.createGain();
      var base = o && o.kind === 'wall' ? 180 : o && o.kind === 'spinner' ? 240 : 140;
      oo.type = 'sine';
      oo.frequency.setValueAtTime(base, t);
      oo.frequency.exponentialRampToValueAtTime(base * 3.2, t + 0.08);
      oo.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.35);
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 22; lg.gain.value = base * 0.25;
      lfo.connect(lg); lg.connect(oo.frequency);
      env(g, t, 0.01, 0.5, 0.38);
      oo.connect(g); g.connect(master);
      oo.start(t); lfo.start(t); oo.stop(t + 0.45); lfo.stop(t + 0.45);
    },
    thud: function () { tone('sine', 140, 60, 0.12, 0.4); noise('lowpass', 600, 0, 0.7, 0.08, 0.3); },
    fall: function () {           // slide whistle down
      tone('sine', 900, 160, 0.7, 0.3);
      tone('triangle', 905, 162, 0.7, 0.12);
    },
    finish: function () {         // fanfare
      var notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach(function (f, i) {
        tone('square', f, f, 0.16, 0.12, i * 0.11);
        tone('triangle', f, f, 0.2, 0.22, i * 0.11);
      });
      [1046.5, 1318.5, 1568].forEach(function (f) { tone('triangle', f, f, 0.9, 0.16, 0.48); });
      tone('square', 523.25, 523.25, 0.9, 0.06, 0.48);
      noise('highpass', 6000, 0, 0.5, 0.6, 0.12, 0.48);
    },
    star: function (o) { var f = 880 * Math.pow(1.26, (o && o.i) || 0); tone('triangle', f, f * 1.5, 0.18, 0.25); },
    click: function () { tone('triangle', 660, 880, 0.05, 0.2); },
    unlock: function () {
      [784, 988, 1175, 1568].forEach(function (f, i) { tone('triangle', f, f, 0.25, 0.18, i * 0.07); });
    }
  };

  window.SHAudio = {
    init: init,
    play: function (name, o) {
      if (!ctx || muted || ctx.state !== 'running') return;
      try { sounds[name] && sounds[name](o); } catch (e) { /* ignore */ }
    },
    /* speed in px/s; 0 to silence */
    wind: function (speed) {
      if (!ctx || !wind) return;
      var k = Math.max(0, Math.min(1, (speed - 700) / 1300));
      var t = ctx.currentTime;
      wind.g.gain.setTargetAtTime(muted ? 0 : k * k * 0.32, t, 0.08);
      wind.f.frequency.setTargetAtTime(350 + k * 900, t, 0.1);
    },
    setMuted: function (m) {
      muted = !!m;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.02);
    },
    isMuted: function () { return muted; },
    suspend: function () { if (ctx && ctx.state === 'running') ctx.suspend().catch(function () {}); },
    resume: function () { if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {}); }
  };
})();
