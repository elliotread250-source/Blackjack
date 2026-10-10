/*
 * Synthesised sound effects: a few oscillators and a burst of filtered
 * noise, nothing loaded. Kept quiet on purpose, it's a word game. The
 * AudioContext is only created after a user gesture, since browsers refuse
 * to start one before that.
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
      comp.threshold.value = -20;
      comp.knee.value = 10;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.5;
      out.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
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

  function env(c, t0, peak, attack, decay) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(out);
    return g;
  }

  function tone(freq, when, dur, o) {
    var c = ready();
    if (!c) return;
    o = o || {};
    var t0 = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    osc.type = o.type || 'triangle';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + dur);
    var attack = o.attack || 0.004;
    var g = env(c, t0, o.gain || 0.08, attack, dur);
    if (o.lowpass) {
      var f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = o.lowpass;
      osc.connect(f);
      f.connect(g);
    } else {
      osc.connect(g);
    }
    osc.start(t0);
    osc.stop(t0 + attack + dur + 0.05);
  }

  function noise(when, dur, o) {
    var c = ready();
    if (!c || !noiseBuf) return;
    o = o || {};
    var t0 = c.currentTime + (when || 0);
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.value = o.freq || 2000;
    f.Q.value = o.q || 1.2;
    var g = env(c, t0, o.gain || 0.05, 0.002, dur);
    src.connect(f);
    f.connect(g);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  function note(semisFromA4) {
    return 440 * Math.pow(2, semisFromA4 / 12);
  }

  var Sound = {
    unlock: function () { if (!muted) ensure(); },
    setMuted: function (m) { muted = !!m; if (!muted) ensure(); },
    isMuted: function () { return muted; },

    // Soft key tap: a tiny tick of filtered noise with a hint of pitch.
    key: function () {
      noise(0, 0.03, { freq: 3200, q: 0.9, gain: 0.05 });
      tone(1250 + Math.random() * 120, 0, 0.03, { type: 'sine', gain: 0.022 });
    },
    back: function () {
      noise(0, 0.03, { freq: 1800, q: 0.9, gain: 0.045 });
      tone(700, 0, 0.035, { type: 'sine', gain: 0.02, to: 560 });
    },
    // One tile turning over; the pitch says what it turned into.
    flip: function (state, i) {
      var base = state === 'correct' ? note(7) : state === 'present' ? note(2) : note(-5);
      noise(0, 0.045, { freq: 1100 + i * 90, q: 1.4, gain: 0.04 });
      tone(base, 0.01, 0.09, { type: 'triangle', gain: state === 'absent' ? 0.035 : 0.055 });
    },
    // "Not in word list": a short low double buzz.
    invalid: function () {
      tone(165, 0, 0.07, { type: 'square', gain: 0.03, lowpass: 900 });
      tone(147, 0.09, 0.09, { type: 'square', gain: 0.03, lowpass: 900 });
    },
    win: function (guesses) {
      var steps = [0, 4, 7, 12, 16];
      var root0 = guesses <= 2 ? 5 : guesses <= 4 ? 3 : 0;
      for (var i = 0; i < steps.length; i++) {
        tone(note(root0 + steps[i]), i * 0.09, 0.22, { type: 'triangle', gain: 0.06 });
      }
      tone(note(root0 + 24), 0.48, 0.5, { type: 'sine', gain: 0.035 });
      tone(note(root0 + 19), 0.52, 0.45, { type: 'sine', gain: 0.025 });
    },
    lose: function () {
      tone(note(-2), 0, 0.22, { type: 'triangle', gain: 0.055 });
      tone(note(-5), 0.2, 0.22, { type: 'triangle', gain: 0.05 });
      tone(note(-9), 0.4, 0.45, { type: 'triangle', gain: 0.05 });
    },
    // UI click for toggles and buttons.
    ui: function () {
      tone(880, 0, 0.04, { type: 'sine', gain: 0.03 });
    }
  };

  root.WordleSound = Sound;
})(window);
