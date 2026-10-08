'use strict';
// Beat engine. A small step sequencer plays each stage's track (kick, hats,
// claps, a bass line built on the original four-note march, and an arp that
// joins in for bosses and Fever). Sound effects are pitched to the current
// key so they land in the music, the way Extreme folds them into the score.
window.SIE = window.SIE || {};
SIE.audio = (function () {
  let ac = null, master = null, music = null, sfx = null, nbuf = null;
  let enabled = true, timer = null;
  let song = null, step = 0, nextTime = 0, songStart = 0, intensity = 0;
  const fallbackStart = performance.now();
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  // root note, tempo, and how busy each layer is
  const SONGS = {
    title: { bpm: 118, root: 45, minor: true },
    s1: { bpm: 126, root: 45, minor: true },
    s2: { bpm: 130, root: 47, minor: true },
    s3: { bpm: 134, root: 43, minor: true },
    s4: { bpm: 138, root: 48, minor: true },
    s5: { bpm: 142, root: 41, minor: true },
    boss: { bpm: 148, root: 44, minor: true },
    fever: { bpm: 150, root: 48, minor: false },
  };
  const MARCH = [0, -2, -3, -5];               // the four descending notes
  const SCALE_MIN = [0, 3, 5, 7, 10, 12, 15];  // minor pentatonic
  const SCALE_MAJ = [0, 2, 4, 7, 9, 12, 14];

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
    music = ac.createGain(); music.gain.value = 0.55; music.connect(master);
    sfx = ac.createGain(); sfx.gain.value = 0.7; sfx.connect(master);
    nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = nbuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (song && !timer) start(song.name);
  }

  // ---- instruments ----
  function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function kick(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    env(g, t, 0.002, 0.9, 0.22); o.connect(g); g.connect(music); o.start(t); o.stop(t + 0.25);
  }
  function noise(t, dur, type, f, vol, out) {
    const s = ac.createBufferSource(); s.buffer = nbuf;
    const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f;
    const g = ac.createGain(); env(g, t, 0.001, vol, dur);
    s.connect(fl); fl.connect(g); g.connect(out || music); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function synth(t, freq, dur, type, vol, cutoff, out) {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    f.type = 'lowpass'; f.frequency.setValueAtTime(cutoff, t); f.Q.value = 6;
    env(g, t, 0.005, vol, dur);
    o.connect(f); f.connect(g); g.connect(out || music); o.start(t); o.stop(t + dur + 0.05);
  }

  function playStep(s, t) {
    const S = song, r = S.root;
    const beat16 = s % 16, bar = Math.floor(s / 16);
    if (beat16 % 4 === 0) kick(t);
    if (beat16 % 4 === 2) noise(t, 0.05, 'highpass', 7000, 0.18);
    if (intensity >= 1 && beat16 % 2 === 1) noise(t, 0.03, 'highpass', 9000, 0.08);
    if (beat16 === 4 || beat16 === 12) noise(t, 0.16, 'bandpass', 1600, 0.35);
    // bass: march notes on the beat, an octave jump on the off-beats
    const note = r + MARCH[Math.floor(beat16 / 4)] + (bar % 4 === 3 ? 2 : 0);
    if (beat16 % 2 === 0) synth(t, midi(note - 12 + (beat16 % 4 === 2 ? 12 : 0)), 0.16, 'sawtooth', 0.28, 600 + intensity * 400);
    // arp: only when it's tense
    if (intensity >= 1) {
      const sc = S.minor ? SCALE_MIN : SCALE_MAJ;
      const n = r + 12 + sc[(s * 3 + bar) % sc.length];
      synth(t, midi(n), 0.09, 'square', 0.07 + intensity * 0.02, 2600);
    }
    if (intensity >= 2 && beat16 % 4 === 0) synth(t, midi(r + 24 + (S.minor ? 7 : 4)), 0.3, 'triangle', 0.08, 4000);
  }
  function tick() {
    if (!ac || !song) return;
    const spb = 60 / song.bpm / 4;
    while (nextTime < ac.currentTime + 0.12) { playStep(step, nextTime); nextTime += spb; step++; }
  }
  function start(name) {
    const def = SONGS[name] || SONGS.s1;
    song = Object.assign({ name }, def);
    if (!ac) return;
    step = 0; nextTime = ac.currentTime + 0.05; songStart = nextTime;
    if (!timer) timer = setInterval(tick, 25);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  // beats since the song started; drives the march and the background pulse
  function beat() {
    const bpm = song ? song.bpm : 120;
    if (ac && song && timer && ac.state === 'running') return Math.max(0, (ac.currentTime - songStart) * bpm / 60);
    return (performance.now() - fallbackStart) / 1000 * bpm / 60;
  }
  // a note from the current scale, so effects sit in key
  let sfxIdx = 0;
  function scaleNote(oct) {
    const S = song || SONGS.s1, sc = S.minor ? SCALE_MIN : SCALE_MAJ;
    return midi(S.root + 12 * (oct || 2) + sc[(sfxIdx++) % sc.length]);
  }
  const fx = {
    shot() { if (!ok()) return; const t = ac.currentTime; synth(t, scaleNote(3), 0.06, 'square', 0.06, 5000, sfx); },
    laser() { if (!ok()) return; const t = ac.currentTime; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(scaleNote(3), t); o.frequency.exponentialRampToValueAtTime(scaleNote(2), t + 0.12); env(g, t, 0.003, 0.07, 0.13); o.connect(g); g.connect(sfx); o.start(t); o.stop(t + 0.15); },
    pop(big) { if (!ok()) return; const t = ac.currentTime; noise(t, big ? 0.35 : 0.14, 'lowpass', big ? 900 : 2400, big ? 0.5 : 0.25, sfx); synth(t, scaleNote(big ? 1 : 2), big ? 0.3 : 0.12, 'triangle', 0.18, 3000, sfx); },
    clink() { if (!ok()) return; synth(ac.currentTime, 2400, 0.05, 'square', 0.04, 6000, sfx); },
    hit() { if (!ok()) return; const t = ac.currentTime; noise(t, 0.6, 'lowpass', 700, 0.6, sfx); synth(t, 110, 0.5, 'sawtooth', 0.25, 800, sfx); },
    power() { if (!ok()) return; const t = ac.currentTime; for (let i = 0; i < 5; i++) synth(t + i * 0.05, scaleNote(3 + (i > 2 ? 1 : 0)), 0.08, 'square', 0.08, 5000, sfx); },
    chain(n) { if (!ok()) return; synth(ac.currentTime, midi((song || SONGS.s1).root + 24 + [0, 3, 7, 12][Math.min(3, n - 1)]), 0.1, 'square', 0.07, 5000, sfx); },
    ufo() { if (!ok()) return; const t = ac.currentTime; for (let i = 0; i < 6; i++) synth(t + i * 0.07, i % 2 ? 900 : 1200, 0.07, 'square', 0.05, 5000, sfx); },
    fanfare() { if (!ok()) return; const t = ac.currentTime, r = (song || SONGS.s1).root + 24; [0, 4, 7, 12, 16].forEach((n, i) => synth(t + i * 0.09, midi(r + n), 0.25, 'square', 0.09, 5000, sfx)); },
    warning() { if (!ok()) return; const t = ac.currentTime; for (let i = 0; i < 4; i++) synth(t + i * 0.45, 440, 0.3, 'sawtooth', 0.12, 1500, sfx); },
    tick() { if (!ok()) return; synth(ac.currentTime, 1800, 0.03, 'square', 0.04, 8000, sfx); },
  };
  function ok() { return enabled && ac; }
  return {
    init, start, stop, beat, fx,
    get bpm() { return song ? song.bpm : 120; },
    setIntensity(n) { intensity = n; },
    setEnabled(v) { enabled = v; if (master) master.gain.value = v ? 0.6 : 0; },
    get enabled() { return enabled; },
  };
})();
