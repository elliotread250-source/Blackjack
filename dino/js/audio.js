/* Dino Run: the three sounds of the original, synthesised with WebAudio.
 * A jump blip, the two-note chime every 100 points and the crash buzz.
 * Nothing is loaded; the context is created on the first key or tap.
 */
(function (root) {
  'use strict';

  var ctx = null;
  var master = null;
  var muted = false;

  function ensure() {
    if (!ctx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (e) {
        return null;
      }
      master = ctx.createGain();
      master.gain.value = 0.22;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && ctx.resume) {
      try { ctx.resume(); } catch (e) { /* ignore */ }
    }
    return ctx;
  }

  // One enveloped oscillator note, optionally sliding in pitch.
  function note(type, f0, f1, t0, dur, vol) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.004);
    g.gain.setValueAtTime(vol, t0 + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  function noise(t0, dur, vol, freq) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  var SOUNDS = {
    // the short square blip of the jump button
    jump: function (t) {
      note('square', 740, 800, t, 0.07, 0.35);
    },
    // two quick high notes every 100 points
    score: function (t) {
      note('square', 1046.5, 0, t, 0.075, 0.28);
      note('square', 1568, 0, t + 0.08, 0.2, 0.28);
    },
    // a low, buzzy double thud
    hit: function (t) {
      note('sawtooth', 190, 120, t, 0.09, 0.45);
      note('square', 130, 62, t + 0.085, 0.2, 0.4);
      noise(t, 0.12, 0.25, 900);
    }
  };

  root.DinoAudio = {
    unlock: function () { ensure(); },
    play: function (name) {
      if (muted || !SOUNDS[name]) return;
      if (!ensure() || ctx.state !== 'running' && ctx.state !== 'suspended') return;
      try {
        SOUNDS[name](ctx.currentTime + 0.005);
      } catch (e) { /* audio is optional */ }
    },
    setMuted: function (m) { muted = !!m; },
    isMuted: function () { return muted; },
    state: function () { return ctx ? ctx.state : 'none'; }
  };
}(typeof self !== 'undefined' ? self : this));
