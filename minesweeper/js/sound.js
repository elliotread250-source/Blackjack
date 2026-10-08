/* Synthesised sound effects. Nothing is downloaded: every effect is built
   from oscillators and a shared noise buffer. The AudioContext is created
   (or resumed) on the first user gesture, as browsers require. */
(function () {
  'use strict';

  var ctx = null, master = null, noise = null, muted = false;

  function unlock() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(ctx.destination);
      var len = Math.floor(ctx.sampleRate * 1.5);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* ignore */ } }
    return ctx;
  }

  function ready() { return ctx && !muted && ctx.state !== 'closed'; }

  function env(g, t, peak, attack, decay) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  function tone(type, f0, f1, t, dur, peak) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak, 0.004, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noiseBurst(t, dur, peak, filterType, f0, f1, q) {
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise;
    f.type = filterType; f.Q.value = q || 1;
    f.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, peak, Math.min(0.02, dur / 4), dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }

  var S = {
    unlock: unlock,
    setMuted: function (m) {
      muted = !!m;
      if (master && ctx) master.gain.setValueAtTime(muted ? 0 : 0.55, ctx.currentTime);
    },
    isMuted: function () { return muted; },

    // Single cell: a short dry tick.
    reveal: function () {
      if (!ready()) return;
      var t = ctx.currentTime;
      noiseBurst(t, 0.03, 0.35, 'highpass', 2500, 2500, 0.7);
      tone('triangle', 1400, 700, t, 0.04, 0.25);
    },

    // Flood open: a swish whose length follows the size of the area.
    flood: function (n) {
      if (!ready()) return;
      var t = ctx.currentTime, dur = 0.14 + Math.min(0.4, n * 0.006);
      tone('triangle', 1400, 700, t, 0.04, 0.2);
      noiseBurst(t, dur, 0.4, 'bandpass', 500, 4200, 1.4);
    },

    flag: function (on) {
      if (!ready()) return;
      var t = ctx.currentTime;
      if (on) { tone('square', 520, 520, t, 0.035, 0.08); tone('square', 780, 780, t + 0.04, 0.05, 0.08); }
      else { tone('square', 700, 700, t, 0.035, 0.07); tone('square', 440, 440, t + 0.04, 0.05, 0.07); }
    },

    mark: function () {
      if (!ready()) return;
      tone('triangle', 900, 1100, ctx.currentTime, 0.06, 0.12);
    },

    explode: function () {
      if (!ready()) return;
      var t = ctx.currentTime;
      noiseBurst(t, 1.3, 0.9, 'lowpass', 3200, 70, 0.8);
      noiseBurst(t, 0.12, 0.6, 'highpass', 1800, 900, 0.7);
      tone('sine', 140, 32, t, 0.7, 0.9);
    },

    win: function () {
      if (!ready()) return;
      var t = ctx.currentTime, notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      var steps = [0, 0.09, 0.18, 0.27, 0.39, 0.48];
      for (var i = 0; i < notes.length; i++) {
        tone('square', notes[i], notes[i], t + steps[i], i === notes.length - 1 ? 0.5 : 0.08, 0.09);
        tone('triangle', notes[i] / 2, notes[i] / 2, t + steps[i], 0.09, 0.12);
      }
      [523.25, 659.25, 783.99].forEach(function (f) { tone('triangle', f, f, t + 0.48, 0.6, 0.08); });
    },

    click: function () {
      if (!ready()) return;
      tone('triangle', 320, 520, ctx.currentTime, 0.05, 0.15);
    }
  };

  window.MSSound = S;
})();
