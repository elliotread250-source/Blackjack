/* Synthesised sound. Nothing is sampled: every effect is an oscillator or
   two with pitch and gain envelopes, in the spirit of Namco's 3-voice
   wavetable chip. The AudioContext is only created on a user gesture. */
'use strict';
(function (PM) {
  var ctx = null, master = null, wave = null;
  var muted = false;
  var loop = null;       // persistent background voice (siren / fright / eyes)
  var loopKey = '';
  var lastChomp = 0, chompAlt = false;
  var music = [];        // scheduled jingle voices, so they can be cut short

  function noteHz(n) {
    var m = /^([A-G])(#?)(\d)$/.exec(n);
    var semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] ? 1 : 0);
    return 440 * Math.pow(2, (semis + (parseInt(m[3], 10) - 4) * 12) / 12);
  }

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { ctx = null; return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(ctx.destination);
      // A soft, slightly hollow wavetable-ish tone.
      var real = new Float32Array([0, 1, 0.45, 0.25, 0.12, 0.06, 0.03]);
      var imag = new Float32Array(real.length);
      try { wave = ctx.createPeriodicWave(real, imag); } catch (e2) { wave = null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume().catch(function () {}); } catch (e3) { /* ignore */ } }
    return ctx;
  }

  function setType(osc, type) {
    if (type === 'wsg' && wave) osc.setPeriodicWave(wave);
    else osc.type = type === 'wsg' ? 'triangle' : type;
  }

  function voice(type, t0, dur, gain) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    setType(o, type);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
    g.gain.setValueAtTime(gain, t0 + Math.max(0.006, dur - 0.02));
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
    return o;
  }

  function sweep(type, t0, dur, f0, f1, gain, expo) {
    var o = voice(type, t0, dur, gain);
    o.frequency.setValueAtTime(f0, t0);
    if (expo) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    else o.frequency.linearRampToValueAtTime(f1, t0 + dur);
    return o;
  }

  var A = {};

  A.unlock = function () { ensure(); };
  A.isMuted = function () { return muted; };
  A.setMuted = function (m) {
    muted = !!m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.02);
  };
  A.suspend = function () { if (ctx && ctx.state === 'running') ctx.suspend().catch(function () {}); };
  A.resume = function () { if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {}); };

  function playTune(mel, bass, u, reps, melGain, bassGain) {
    A.stopMusic();
    var t = ctx.currentTime + 0.05;
    var len = 0;
    mel.forEach(function (n) { len += n[1]; });
    for (var r = 0; r < reps; r++) {
      var x = t + r * len * u;
      mel.forEach(function (n) {
        if (n[0] !== '-') {
          var o = voice('wsg', x, n[1] * u * 0.85, melGain);
          o.frequency.setValueAtTime(noteHz(n[0]), x);
          music.push(o);
        }
        x += n[1] * u;
      });
      x = t + r * len * u;
      bass.forEach(function (n) {
        var o = voice('triangle', x, n[1] * u * 0.7, bassGain);
        o.frequency.setValueAtTime(noteHz(n[0]), x);
        music.push(o);
        x += n[1] * u;
      });
    }
  }

  A.stopMusic = function () {
    if (!ctx) return;
    var now = ctx.currentTime;
    music.forEach(function (o) { try { o.stop(now); } catch (e) { /* not started or already stopped */ } });
    music = [];
  };

  A.intermission = function () {
    if (!ensure()) return;
    playTune([
      ['C5', 1], ['E5', 1], ['G5', 1], ['E5', 1], ['A5', 2], ['G5', 2],
      ['F5', 1], ['A5', 1], ['G5', 1], ['E5', 1], ['D5', 2], ['C5', 2],
      ['C5', 1], ['E5', 1], ['G5', 1], ['C6', 1], ['B5', 2], ['G5', 2],
      ['A5', 1], ['F5', 1], ['D5', 1], ['B4', 1], ['C5', 3], ['-', 1]
    ], [
      ['C3', 2], ['G2', 2], ['C3', 2], ['G2', 2],
      ['F2', 2], ['C3', 2], ['G2', 2], ['B2', 2],
      ['C3', 2], ['E3', 2], ['G3', 2], ['E3', 2],
      ['F3', 2], ['G3', 2], ['C3', 4]
    ], 0.15, 2, 0.14, 0.28);
  };

  A.intro = function () {
    if (!ensure()) return;
    playTune([
      ['B4', 1], ['B5', 1], ['F#5', 1], ['D#5', 1], ['B5', 0.5], ['F#5', 1.5], ['D#5', 2],
      ['C5', 1], ['C6', 1], ['G5', 1], ['E5', 1], ['C6', 0.5], ['G5', 1.5], ['E5', 2],
      ['B4', 1], ['B5', 1], ['F#5', 1], ['D#5', 1], ['B5', 0.5], ['F#5', 1.5], ['D#5', 2],
      ['D#5', 0.5], ['E5', 0.5], ['F5', 1], ['F5', 0.5], ['F#5', 0.5], ['G5', 1], ['G5', 0.5], ['G#5', 0.5], ['A5', 1], ['B5', 2]
    ], [
      ['B2', 3], ['B3', 1], ['B2', 3], ['B3', 1],
      ['C3', 3], ['C4', 1], ['C3', 3], ['C4', 1],
      ['B2', 3], ['B3', 1], ['B2', 3], ['B3', 1],
      ['F#3', 2], ['G#3', 2], ['A#3', 2], ['B3', 2]
    ], 0.135, 1, 0.16, 0.3);
  };

  // "Wa" and "ka": alternating falling and rising sweeps, one per dot.
  A.chomp = function () {
    if (!ensure()) return;
    var t = ctx.currentTime;
    if (t - lastChomp > 0.5) chompAlt = false;
    lastChomp = t;
    if (chompAlt) sweep('triangle', t, 0.075, 160, 480, 0.22, true);
    else sweep('triangle', t, 0.075, 480, 160, 0.22, true);
    chompAlt = !chompAlt;
  };

  A.ghostEaten = function () {
    if (!ensure()) return;
    var t = ctx.currentTime;
    sweep('wsg', t, 0.5, 140, 1500, 0.2, true);
  };

  A.fruit = function () {
    if (!ensure()) return;
    var t = ctx.currentTime;
    sweep('wsg', t, 0.12, 300, 900, 0.2, true);
    sweep('wsg', t + 0.12, 0.12, 450, 1350, 0.2, true);
    sweep('wsg', t + 0.24, 0.16, 600, 1800, 0.18, true);
  };

  A.death = function () {
    if (!ensure()) return;
    var t = ctx.currentTime;
    for (var k = 0; k < 10; k++) {
      var top = 820 - k * 62, d = 0.13;
      sweep('wsg', t + k * d, d * 0.55, top - 180, top, 0.2, false);
      sweep('wsg', t + k * d + d * 0.55, d * 0.45, top, top - 260, 0.2, false);
    }
    var tp = t + 10 * 0.13 + 0.08;
    sweep('triangle', tp, 0.12, 700, 90, 0.28, true);
    sweep('triangle', tp + 0.17, 0.12, 700, 90, 0.28, true);
  };

  A.extraLife = function () {
    if (!ensure()) return;
    var t = ctx.currentTime;
    for (var i = 0; i < 8; i++) {
      var o = voice('square', t + i * 0.13, 0.08, 0.07);
      o.frequency.setValueAtTime(1046.5, t + i * 0.13);
    }
  };

  A.click = function () {
    if (!ensure()) return;
    sweep('triangle', ctx.currentTime, 0.05, 600, 900, 0.1, true);
  };

  // Background loop: kind = 'siren0'..'siren4', 'fright', 'eyes' or ''.
  var LOOPS = {
    fright: { type: 'triangle', base: 260, depth: 160, rate: 7.5, lfo: 'sawtooth', gain: 0.1 },
    eyes: { type: 'wsg', base: 1050, depth: -520, rate: 13, lfo: 'sawtooth', gain: 0.07 }
  };
  for (var i = 0; i < 5; i++) {
    LOOPS['siren' + i] = { type: 'wsg', base: 480 + i * 70, depth: 170 + i * 25, rate: 2.4 + i * 0.45, lfo: 'triangle', gain: 0.075 };
  }

  A.setLoop = function (kind) {
    if (!ctx || kind === loopKey) return;
    loopKey = kind;
    var now = ctx.currentTime;
    if (!kind) {
      if (loop) {
        var old = loop;
        old.g.gain.setTargetAtTime(0, now, 0.015);
        setTimeout(function () { try { old.o.stop(); old.l.stop(); } catch (e) { /* already stopped */ } }, 120);
        loop = null;
      }
      return;
    }
    var p = LOOPS[kind];
    if (!p) return;
    if (!loop) {
      var o = ctx.createOscillator(), l = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
      l.connect(lg); lg.connect(o.frequency);
      o.connect(g); g.connect(master);
      g.gain.value = 0;
      o.start(); l.start();
      loop = { o: o, l: l, lg: lg, g: g };
    }
    setType(loop.o, p.type);
    loop.l.type = p.lfo;
    loop.o.frequency.setTargetAtTime(p.base, now, 0.01);
    loop.l.frequency.setTargetAtTime(p.rate, now, 0.01);
    loop.lg.gain.setTargetAtTime(p.depth, now, 0.01);
    loop.g.gain.setTargetAtTime(p.gain, now, 0.02);
  };

  PM.Audio = A;
})(window.PM);
