/*
 * Synthesised sound effects. Nothing is loaded: every sound is a few
 * oscillators or a burst of filtered noise built on the fly. The
 * AudioContext is only created inside a user gesture (browsers refuse to
 * start one otherwise), and kept quiet: these are meant to sit under play,
 * not announce it.
 */
(function (root) {
  'use strict';

  var ctx = null;
  var out = null;
  var noiseBuf = null;
  var muted = false;

  // Pentatonic steps so that a run of merges climbs like a little tune
  // instead of a siren. 4 -> C4, 8 -> D4 ... 2048 -> A5.
  var PENTA = [0, 2, 4, 7, 9];

  function ensure() {
    if (!ctx) {
      // Creating a context before the page has had a gesture only earns a
      // console warning and a suspended context, so wait for one.
      var ua = root.navigator && root.navigator.userActivation;
      if (ua && !ua.hasBeenActive) return null;
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 12;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.55;
      out.connect(comp);
      comp.connect(ctx.destination);
      // One second of white noise, reused for every whoosh.
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
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

  function envGain(c, t0, peak, attack, decay) {
    var g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    g.connect(out);
    return g;
  }

  function tone(freq, when, dur, opts) {
    var c = ready();
    if (!c) return;
    opts = opts || {};
    var t0 = c.currentTime + (when || 0);
    var osc = c.createOscillator();
    osc.type = opts.type || 'triangle';
    osc.frequency.setValueAtTime(freq * (opts.bend || 1), t0);
    if (opts.bend) osc.frequency.exponentialRampToValueAtTime(freq, t0 + Math.min(0.05, dur * 0.5));
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
    var g = envGain(c, t0, opts.gain || 0.12, opts.attack || 0.006, dur);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + (opts.attack || 0.006) + dur + 0.05);
  }

  function noteFreq(semisFromC4) {
    return 261.63 * Math.pow(2, semisFromC4 / 12);
  }

  var api = {
    // Call from any user gesture; creates/resumes the context.
    unlock: function () { if (!muted) ensure(); },

    // Just a flag: unmuting from a click is itself a gesture, and the next
    // sound (or unlock) creates the context then. Calling ensure() here at
    // page load would make Chrome warn about a context started too early.
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },

    // A soft, short whoosh for every successful move.
    slide: function () {
      var c = ready();
      if (!c) return;
      var t0 = c.currentTime;
      var src = c.createBufferSource();
      src.buffer = noiseBuf;
      var bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.1;
      bp.frequency.setValueAtTime(1500, t0);
      bp.frequency.exponentialRampToValueAtTime(420, t0 + 0.09);
      var g = envGain(c, t0, 0.07, 0.012, 0.085);
      src.connect(bp);
      bp.connect(g);
      src.start(t0, Math.random() * 0.8);
      src.stop(t0 + 0.12);
    },

    // A rounded pop whose pitch climbs with the merged value.
    merge: function (value, count) {
      var c = ready();
      if (!c) return;
      var k = Math.max(2, Math.round(Math.log(value) / Math.LN2)); // 4 -> 2
      var step = k - 2;
      var semis = 12 * Math.floor(step / 5) + PENTA[step % 5];
      var f = noteFreq(Math.min(semis, 36));
      tone(f, 0, 0.13, { type: 'sine', gain: 0.16, bend: 1.5 });
      tone(f * 2, 0, 0.07, { type: 'triangle', gain: 0.035 });
      if (count > 1) tone(f * 1.5, 0.035, 0.1, { type: 'sine', gain: 0.07, bend: 1.3 });
    },

    newBest: function () {
      tone(noteFreq(19), 0, 0.12, { gain: 0.08 });  // G5
      tone(noteFreq(24), 0.09, 0.22, { gain: 0.09 }); // C6
    },

    win: function () {
      [12, 16, 19, 24].forEach(function (s, i) {
        tone(noteFreq(s), i * 0.11, i === 3 ? 0.55 : 0.18, { gain: 0.11 });
        tone(noteFreq(s) * 2, i * 0.11, 0.1, { type: 'sine', gain: 0.025 });
      });
    },

    lose: function () {
      [7, 3, 0, -5].forEach(function (s, i) {
        tone(noteFreq(s), i * 0.16, i === 3 ? 0.5 : 0.2, { gain: 0.09 });
      });
    },

    undo: function () {
      tone(520, 0, 0.09, { type: 'sine', gain: 0.06, to: 300 });
    }
  };

  root.Sound2048 = api;
})(window);
