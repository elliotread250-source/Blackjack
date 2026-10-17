/*
 * Synthesised sounds: a few oscillators and filtered noise, nothing loaded.
 * The AudioContext is only created after a user gesture, since browsers
 * refuse to start one before that. Kept quiet: it's a word game.
 */
(function (root) {
  'use strict';

  var ctx = null;
  var out = null;
  var noiseBuf = null;
  var muted = false;

  function ensure() {
    if (!ctx) {
      var ua = root.navigator && root.navigator.userActivation;
      if (ua && !ua.hasBeenActive) return null;
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.45;
      out.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') {
      try { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* ignore */ }
    }
    return ctx;
  }

  function ready() {
    if (muted) return null;
    var c = ensure();
    return c && c.state !== 'closed' ? c : null;
  }

  function tone(freq, when, dur, o) {
    var c = ready();
    if (!c) return;
    o = o || {};
    var t0 = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    var g = c.createGain();
    var peak = o.vol || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(when, dur, o) {
    var c = ready();
    if (!c) return;
    o = o || {};
    var t0 = c.currentTime + (when || 0);
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.value = o.freq || 1800;
    f.Q.value = o.q || 1.2;
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(out);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  // C major pentatonic, climbing as the path grows.
  var STEPS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];

  var Sound = {
    unlock: function () { if (!muted) ensure(); },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },
    select: function (n) {
      var f = STEPS[Math.min(STEPS.length - 1, Math.max(0, n - 1))];
      tone(f, 0, 0.09, { type: 'triangle', vol: 0.12 });
    },
    good: function (points) {
      var notes = points >= 11 ? [659.25, 783.99, 1046.5, 1318.5, 1568]
        : points >= 3 ? [659.25, 783.99, 1046.5, 1318.5]
        : points >= 2 ? [659.25, 880, 1174.66] : [783.99, 1046.5];
      for (var i = 0; i < notes.length; i++) tone(notes[i], i * 0.06, 0.18, { type: 'triangle', vol: 0.16 });
    },
    dupe: function () {
      tone(523.25, 0, 0.08, { type: 'sine', vol: 0.12 });
      tone(523.25, 0.1, 0.08, { type: 'sine', vol: 0.1 });
    },
    bad: function () {
      tone(180, 0, 0.18, { type: 'square', vol: 0.06, to: 120 });
      noise(0, 0.06, { freq: 400, vol: 0.06 });
    },
    tick: function (urgent) {
      tone(urgent ? 1320 : 990, 0, 0.04, { type: 'square', vol: 0.04 });
    },
    // Dice rattling in the tray.
    shake: function () {
      for (var i = 0; i < 14; i++) {
        noise(i * 0.045 + Math.random() * 0.02, 0.05, { freq: 1200 + Math.random() * 2400, q: 3, vol: 0.12 });
      }
    },
    cpu: function () {
      tone(330, 0, 0.06, { type: 'sine', vol: 0.05 });
    },
    end: function () {
      tone(523.25, 0, 0.5, { type: 'sine', vol: 0.18 });
      tone(392, 0.18, 0.6, { type: 'sine', vol: 0.18 });
      tone(261.63, 0.36, 0.9, { type: 'sine', vol: 0.18 });
    },
    win: function () {
      var n = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < n.length; i++) tone(n[i], i * 0.1, 0.3, { type: 'triangle', vol: 0.16 });
    }
  };

  root.BoggleSound = Sound;
})(window);
