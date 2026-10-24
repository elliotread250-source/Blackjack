/*
 * Synthesised sound effects: a few oscillators and a little filtered noise
 * per sound, nothing downloaded. The AudioContext is only created inside a
 * user gesture (otherwise browsers refuse and log a warning), and the mix
 * is kept soft; a puzzle game should sound like pencil on paper, not a
 * slot machine.
 */
(function (root) {
  'use strict';

  var ctx = null, out = null, noiseBuf = null, muted = false;

  function ensure() {
    if (!ctx) {
      var ua = root.navigator && root.navigator.userActivation;
      if (ua && !ua.hasBeenActive) return null;
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;
      out = ctx.createGain();
      out.gain.value = 0.5;
      out.connect(comp);
      comp.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      var data = noiseBuf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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

  function tone(c, t0, freq, type, peak, attack, decay, freqEnd) {
    var o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + attack + decay);
    o.connect(env(c, t0, peak, attack, decay));
    o.start(t0);
    o.stop(t0 + attack + decay + 0.05);
  }

  function noise(c, t0, peak, dur, freq, q, type) {
    var src = c.createBufferSource();
    src.buffer = noiseBuf;
    var f = c.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q || 1;
    src.connect(f);
    f.connect(env(c, t0, peak, 0.004, dur));
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  var NOTE = function (semi) { return 440 * Math.pow(2, (semi - 9) / 12) * 2; }; // semitones above C5

  var sounds = {
    // A soft wooden tap with a pitched body.
    place: function (c, t) {
      noise(c, t, 0.12, 0.03, 2400, 1.2);
      tone(c, t, 880, 'triangle', 0.13, 0.004, 0.09, 700);
    },
    note: function (c, t) {
      noise(c, t, 0.06, 0.02, 4200, 1.5);
      tone(c, t, 1320, 'sine', 0.05, 0.003, 0.05);
    },
    erase: function (c, t) {
      noise(c, t, 0.1, 0.08, 1400, 0.8, 'lowpass');
      tone(c, t, 520, 'sine', 0.07, 0.004, 0.09, 300);
    },
    mistake: function (c, t) {
      tone(c, t, 196, 'square', 0.05, 0.006, 0.2, 165);
      tone(c, t, 207, 'sawtooth', 0.035, 0.006, 0.22, 174);
    },
    unit: function (c, t) {
      [0, 4, 7, 12].forEach(function (s, k) { tone(c, t + k * 0.06, NOTE(s), 'triangle', 0.08, 0.005, 0.45); });
    },
    hint: function (c, t) {
      [7, 12, 16].forEach(function (s, k) { tone(c, t + k * 0.05, NOTE(s), 'sine', 0.06, 0.005, 0.3); });
    },
    undo: function (c, t) {
      tone(c, t, 660, 'sine', 0.06, 0.004, 0.06, 520);
    },
    click: function (c, t) {
      noise(c, t, 0.05, 0.015, 3000, 1.5);
    },
    win: function (c, t) {
      var mel = [0, 4, 7, 12, 16, 19, 24];
      mel.forEach(function (s, k) { tone(c, t + k * 0.08, NOTE(s - 12), 'triangle', 0.09, 0.006, 0.5); });
      [0, 4, 7, 12].forEach(function (s) { tone(c, t + 0.62, NOTE(s - 12), 'sine', 0.06, 0.02, 1.4); });
    },
    lose: function (c, t) {
      [7, 3, 0, -5].forEach(function (s, k) { tone(c, t + k * 0.14, NOTE(s - 12), 'triangle', 0.08, 0.01, 0.35); });
    }
  };

  function play(name) {
    var c = ready();
    if (!c || !sounds[name]) return;
    try { sounds[name](c, c.currentTime + 0.005); } catch (e) { /* ignore */ }
  }

  root.SudokuSound = {
    play: play,
    unlock: function () { if (!muted) ensure(); },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; }
  };
})(window);
