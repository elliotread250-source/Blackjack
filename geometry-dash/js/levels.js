/* The three built-in levels, assembled from reusable sections. Every level
 * here is checked by tools/verify.js, which brute-forces a run with inputs
 * held for at least 50ms at a time, so nothing ships that needs frame-perfect
 * clicks or is outright impossible.
 */
(function (root) {
  'use strict';

  function builder() {
    const o = [];
    const colors = [];
    const B = {
      o, colors,
      b: (x, y, w = 1, h = 1) => o.push({ t: 'b', x, y, w, h }),
      s: (x, y = 0, d = 1) => o.push({ t: 's', x, y, d }),
      ss: (x, y = 0, d = 1) => o.push({ t: 'ss', x, y, d }),
      spikes: (x, y, n, d = 1) => { for (let i = 0; i < n; i++) B.s(x + i, y, d); },
      pad: (x, y, c, d = 1) => o.push({ t: 'pad', x, y, c, d }),
      orb: (x, y, c) => o.push({ t: 'orb', x, y, c }),
      p: (x, y, k, h = 3, b) => o.push({ t: 'p', x, y, k, h, b }),
      color: (x, bg, gr) => colors.push({ x, bg, gr }),
    };
    return B;
  }

  // ------------------------------------------------------------ cube parts
  // Each takes the cursor and returns the cursor after the obstacle.

  const C = {
    single: (B, c) => { B.s(c + 5); return c + 10; },
    double: (B, c) => { B.spikes(c + 5, 0, 2); return c + 11; },
    triple: (B, c) => { B.spikes(c + 5, 0, 3); return c + 13; },
    block: (B, c) => { B.b(c + 5, 0); return c + 10; },
    blockSpike: (B, c) => { B.b(c + 5, 0); B.s(c + 6); return c + 12; },
    platform: (B, c) => { B.b(c + 5, 0, 5, 1); B.spikes(c + 10, 0, 2); return c + 17; },
    stairs: (B, c) => {
      B.b(c + 5, 0, 3, 1); B.spikes(c + 8, 0, 2);
      B.b(c + 10, 0, 3, 2); B.spikes(c + 13, 0, 2);
      B.b(c + 15, 0, 3, 3); B.spikes(c + 18, 0, 2);
      return c + 25;
    },
    pillars: (B, c) => {
      B.b(c + 5, 0, 2, 1); B.spikes(c + 7, 0, 3);
      B.b(c + 10, 0, 2, 2); B.spikes(c + 12, 0, 3);
      return c + 20;
    },
    padUp: (B, c) => {
      B.pad(c + 5, 0, 'yellow');
      B.b(c + 9, 0, 6, 3); B.spikes(c + 15, 0, 2);
      return c + 22;
    },
    orbGap: (B, c) => { B.spikes(c + 5, 0, 5); B.orb(c + 7, 1.6, 'yellow'); return c + 15; },
    pinkHop: (B, c) => {
      B.pad(c + 5, 0, 'pink'); B.spikes(c + 6, 0, 2);
      return c + 15;
    },
  };

  function cubeRun(B, c, parts) {
    for (const name of parts) c = C[name](B, c);
    return c;
  }

  // -------------------------------------------------------- flying parts

  function gate(B, x, lo, hi, top, w = 1) {
    if (lo > 0) B.b(x, 0, w, lo);
    if (hi < top) B.b(x, hi, w, top - hi);
  }

  // skip: x positions already filled by a gate column
  function spikeRows(B, x0, x1, top, skip) {
    for (let x = x0; x < x1; x++) {
      if (skip && skip.has(x)) continue;
      B.s(x, 0); B.s(x, top - 1, -1);
    }
  }

  // Shared shape for ship / ufo / swing / wave: enter, a run of gates with
  // spike-lined floor and ceiling, then a full-height exit portal.
  function corridor(B, c, mode, gaps, opts = {}) {
    const top = opts.top || 10;
    const sp = opts.spacing || 9;
    const w = opts.width || 1;
    B.p(c, 2, mode, 4);
    const first = c + (opts.lead || 9);
    const last = first + (gaps.length - 1) * sp;
    const cols = new Set();
    gaps.forEach((_, i) => { for (let k = 0; k < w; k++) cols.add(first + i * sp + k); });
    spikeRows(B, c + 6, last + sp - 1, top, cols);
    gaps.forEach(([lo, hi], i) => gate(B, first + i * sp, lo, hi, top, w));
    const exit = last + sp;
    B.p(exit, top / 2, opts.exit || 'cube', top);
    return exit + 8;
  }

  function ball(B, c, n, opts = {}) {
    const top = 8;
    const sp = opts.spacing || 7;
    B.p(c, 2, 'ball', 4);
    let x = c + 8;
    for (let i = 0; i < n; i++, x += sp) {
      if (i % 2 === 0) B.spikes(x, 0, 2);
      else B.spikes(x, top - 1, 2, -1);
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  function spider(B, c, n) {
    const top = 8;
    B.p(c, 2, 'spider', 4);
    let x = c + 8;
    for (let i = 0; i < n; i++, x += 7) {
      if (i % 3 === 2) {
        // A floor pillar under a ceiling pillar: hop onto the low one.
        B.b(x, 0, 3, 3);
        B.b(x + 3, 5, 3, 3);
        x += 3;
      } else if (i % 2 === 0) {
        B.spikes(x, 0, 3);
      } else {
        B.spikes(x, top - 1, 3, -1);
      }
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  function robot(B, c) {
    B.p(c, 2, 'robot', 4);
    B.b(c + 6, 0, 4, 2); B.spikes(c + 10, 0, 3);
    B.b(c + 13, 0, 4, 2); B.spikes(c + 17, 0, 2);
    B.b(c + 19, 0, 4, 3); B.spikes(c + 23, 0, 4);
    B.b(c + 32, 0, 1, 2);
    B.spikes(c + 38, 0, 2);
    B.b(c + 44, 0, 3, 2); B.s(c + 47); B.s(c + 48);
    B.p(c + 54, 2, 'cube', 4);
    return c + 58;
  }

  // Upside-down cube run under a long ceiling, flipped in and out by
  // gravity portals. Returns the cursor after the ceiling ends.
  function upsideDown(B, c) {
    const ceil = 6;
    B.b(c + 2, ceil, 70, 1);
    B.p(c + 6, 2, 'grav+', 4);
    B.s(c + 18, ceil - 1, -1);
    B.spikes(c + 28, ceil - 1, 2, -1);
    B.b(c + 38, ceil - 1, 3, 1); B.s(c + 41, ceil - 1, -1);
    B.spikes(c + 50, ceil - 1, 2, -1);
    B.p(c + 62, 3, 'grav-', 6);
    return c + 72;
  }

  // Full-height speed portal, safe to place right after a flying section
  // when the player could be anywhere vertically.
  function speed(B, x, n) { B.p(x, 10, 's' + n, 20); }

  function finish(B, c, name, meta) {
    return Object.assign({ name, objects: B.o, colors: B.colors, length: c + 14 }, meta);
  }

  // ---------------------------------------------------------------- levels

  function neonSteps() {
    const B = builder();
    let c = 6;
    B.color(0, '#2b5bff', '#1a3acc');
    c = cubeRun(B, c, ['single', 'double', 'block', 'platform', 'single', 'stairs',
      'padUp', 'double', 'orbGap', 'pillars']);
    B.color(c, '#c22bff', '#7a17b0');
    c = corridor(B, c, 'ship', [[2, 6], [3, 7], [4, 8], [3, 7], [2, 6], [1, 5], [3, 7], [5, 9], [3, 7]]);
    B.color(c, '#2b5bff', '#1a3acc');
    c = cubeRun(B, c, ['single', 'blockSpike', 'double', 'platform']);
    B.color(c, '#ff3b5c', '#b01734');
    c = ball(B, c, 8);
    B.color(c, '#ff8a1f', '#b0560f');
    c = corridor(B, c, 'ufo', [[1, 5], [2, 6], [3, 7], [2, 6], [4, 8], [3, 7], [1, 5], [2, 6]], { spacing: 8 });
    B.color(c, '#2b5bff', '#1a3acc');
    c = cubeRun(B, c, ['stairs', 'double', 'pinkHop', 'single']);
    return finish(B, c, 'Neon Steps', {
      difficulty: 'Easy', stars: 2, bpm: 128, key: 0, seed: 1,
    });
  }

  function pulseCircuit() {
    const B = builder();
    let c = 6;
    B.color(0, '#16c79a', '#0d7d61');
    c = cubeRun(B, c, ['double', 'blockSpike', 'orbGap', 'pillars', 'padUp']);
    B.color(c, '#1fb4ff', '#0f6fa0');
    c = corridor(B, c, 'wave',
      [[3, 6], [4, 7], [2, 5], [4, 7], [6, 9], [4, 7], [2, 5], [1, 4], [3, 6], [5, 8], [3, 6]],
      { spacing: 5, width: 2, lead: 10 });
    B.color(c, '#e0e0ff', '#7a7aa8');
    c = robot(B, c);
    B.color(c, '#9b30ff', '#5a1a99');
    c = spider(B, c, 9);
    B.color(c, '#ff2bd0', '#a0178a');
    B.p(c + 2, 2, 's2', 4);
    c = corridor(B, c + 4, 'ship', [[3, 7], [5, 9], [2, 6], [4, 8], [1, 5], [3, 7], [5, 9], [3, 7]], { spacing: 11, lead: 12 });
    B.color(c, '#16c79a', '#0d7d61');
    c = cubeRun(B, c, ['double', 'single', 'platform', 'triple', 'stairs', 'double']);
    return finish(B, c, 'Pulse Circuit', {
      difficulty: 'Harder', stars: 6, bpm: 140, key: 3, seed: 2,
    });
  }

  function gravityOverdrive() {
    const B = builder();
    let c = 6;
    B.color(0, '#ff3b3b', '#a01818');
    B.p(c + 2, 2, 'mini', 4);
    c = cubeRun(B, c + 2, ['double', 'single', 'platform', 'double', 'blockSpike']);
    B.p(c + 2, 2, 'big', 4);
    c += 4;
    B.color(c, '#ffd21f', '#a08410');
    c = corridor(B, c, 'swing', [[3, 7], [5, 9], [2, 6], [4, 8], [1, 5], [3, 7], [5, 9]], { spacing: 9 });

    B.color(c, '#7a2bff', '#45179a');
    c = upsideDown(B, c);
    c = cubeRun(B, c, ['single']);

    B.color(c, '#ff8a1f', '#b0560f');
    B.p(c + 2, 2, 's2', 4);
    c = corridor(B, c + 4, 'ufo', [[2, 6], [3, 7], [4, 8], [2, 6], [3, 7], [5, 9], [3, 7]], { spacing: 10, lead: 11 });
    B.p(c - 6, 10, 's1', 20);

    B.color(c, '#1fb4ff', '#0f6fa0');
    B.p(c + 2, 2, 'mini', 4);
    c = corridor(B, c + 3, 'wave',
      [[4, 6.5], [2.5, 5], [4.5, 7], [6, 8.5], [3.5, 6], [1.5, 4], [3.5, 6], [5.5, 8]],
      { spacing: 5, width: 2, lead: 10 });
    B.p(c - 6, 10, 'big', 20);

    B.color(c, '#9b30ff', '#5a1a99');
    c = spider(B, c, 7);
    B.color(c, '#e0e0ff', '#7a7aa8');
    c = robot(B, c);

    B.color(c, '#ff2bd0', '#a0178a');
    B.p(c + 2, 2, 's3', 4);
    c = corridor(B, c + 4, 'ship', [[3, 7], [5, 9], [2, 6], [4, 8], [3, 7], [1, 5], [4, 8]], { spacing: 13, lead: 14 });
    B.p(c - 6, 10, 's2', 20);

    B.color(c, '#ff3b3b', '#a01818');
    c = cubeRun(B, c, ['triple', 'double', 'stairs', 'orbGap', 'triple', 'single']);
    return finish(B, c, 'Gravity Overdrive', {
      difficulty: 'Insane', stars: 9, bpm: 150, key: 5, seed: 3,
    });
  }

  function cyberHop() {
    const B = builder();
    let c = 6;
    B.color(0, '#00b4a0', '#00786a');
    c = cubeRun(B, c, ['single', 'block', 'double', 'padUp', 'single', 'platform']);
    B.color(c, '#ff8a1f', '#b0560f');
    c = corridor(B, c, 'ufo', [[1, 6], [2, 7], [3, 8], [2, 7], [1, 6], [3, 8], [2, 7]], { spacing: 9 });
    B.color(c, '#00b4a0', '#00786a');
    c = cubeRun(B, c, ['stairs', 'pinkHop', 'double']);
    B.color(c, '#7a7ab8', '#4a4a80');
    c = robot(B, c);
    B.color(c, '#00b4a0', '#00786a');
    c = cubeRun(B, c, ['orbGap', 'single', 'blockSpike', 'double']);
    return finish(B, c, 'Cyber Hop', { difficulty: 'Easy', stars: 3, bpm: 124, key: 7, seed: 4 });
  }

  function midnightDrift() {
    const B = builder();
    let c = 6;
    B.color(0, '#1c2a6b', '#0f1840');
    B.p(c + 2, 2, 'mini', 4);
    c = cubeRun(B, c + 2, ['single', 'double', 'block', 'platform']);
    B.p(c + 2, 2, 'big', 4);
    c += 4;
    c = cubeRun(B, c, ['stairs', 'double']);
    B.color(c, '#3b1c6b', '#22104a');
    c = corridor(B, c, 'ship', [[2, 6], [4, 8], [3, 7], [1, 5], [3, 7], [5, 9], [4, 8], [2, 6]], { spacing: 9 });
    B.color(c, '#6b1c3b', '#4a1026');
    c = ball(B, c, 10);
    B.color(c, '#1c4a6b', '#103048');
    c = corridor(B, c, 'wave',
      [[3, 6.5], [4.5, 8], [3, 6.5], [1.5, 5], [3, 6.5], [5, 8.5], [3.5, 7], [2, 5.5], [3.5, 7]],
      { spacing: 6, width: 2, lead: 10 });
    B.color(c, '#1c2a6b', '#0f1840');
    c = cubeRun(B, c, ['pillars', 'orbGap', 'double', 'single']);
    return finish(B, c, 'Midnight Drift', { difficulty: 'Normal', stars: 4, bpm: 132, key: 2, seed: 5 });
  }

  function bassReactor() {
    const B = builder();
    let c = 6;
    B.color(0, '#c21b4b', '#801030');
    c = cubeRun(B, c, ['double', 'blockSpike', 'stairs', 'orbGap']);
    B.color(c, '#9b30ff', '#5a1a99');
    c = spider(B, c, 10);
    B.color(c, '#7a2bff', '#45179a');
    c = upsideDown(B, c);
    c = cubeRun(B, c, ['single']);
    B.color(c, '#ffd21f', '#a08410');
    B.p(c + 2, 2, 's2', 4);
    c = corridor(B, c + 4, 'swing', [[3, 7], [5, 9], [3, 7], [1, 5], [3, 7], [5, 9], [2, 6]], { spacing: 11, lead: 12 });
    speed(B, c - 6, 1);
    B.color(c, '#7a7ab8', '#4a4a80');
    c = robot(B, c);
    B.color(c, '#c21b4b', '#801030');
    c = cubeRun(B, c, ['padUp', 'pillars', 'double', 'orbGap', 'single']);
    return finish(B, c, 'Bass Reactor', { difficulty: 'Hard', stars: 5, bpm: 145, key: 4, seed: 6 });
  }

  function hyperwave() {
    const B = builder();
    let c = 6;
    B.color(0, '#00a8ff', '#0068a0');
    B.p(c + 2, 2, 's2', 4);
    c = cubeRun(B, c + 4, ['double', 'single', 'platform', 'double']);
    c = corridor(B, c, 'wave',
      [[3, 6], [5, 8], [3, 6], [1, 4], [3, 6], [6, 9], [4, 7], [2, 5], [4, 7], [6, 9], [3, 6]],
      { spacing: 6, width: 2, lead: 12 });
    B.color(c, '#00e0ff', '#008aa0');
    B.p(c + 2, 2, 'mini', 4);
    c = corridor(B, c + 3, 'wave',
      [[4, 6.5], [6, 8.5], [4, 6.5], [2, 4.5], [3.5, 6], [5.5, 8], [3, 5.5], [1.5, 4], [3.5, 6]],
      { spacing: 6, width: 2, lead: 12 });
    B.p(c - 6, 10, 'big', 20);
    B.color(c, '#ff2bd0', '#a0178a');
    speed(B, c - 4, 3);
    c = corridor(B, c, 'ship', [[3, 7], [5, 9], [2, 6], [4, 8], [2, 6], [5, 9], [3, 7]], { spacing: 13, lead: 14 });
    speed(B, c - 6, 2);
    B.color(c, '#ff8a1f', '#b0560f');
    c = corridor(B, c, 'ufo', [[2, 6], [4, 8], [3, 7], [1, 5], [3, 7], [5, 9]], { spacing: 10, lead: 11 });
    B.color(c, '#00a8ff', '#0068a0');
    c = cubeRun(B, c, ['triple', 'stairs', 'double', 'single']);
    return finish(B, c, 'Hyperwave', { difficulty: 'Harder', stars: 7, bpm: 160, key: 9, seed: 7 });
  }

  function finalAscent() {
    const B = builder();
    let c = 6;
    B.color(0, '#300010', '#180008');
    B.p(c + 2, 2, 's3', 4);
    c = cubeRun(B, c + 4, ['triple', 'double', 'triple', 'pillars', 'triple']);
    B.color(c, '#600020', '#300010');
    c = corridor(B, c, 'ship', [[3, 7], [5, 9], [2, 6], [4, 8], [1, 5], [4, 8], [2, 6], [5, 9]], { spacing: 13, lead: 15 });
    speed(B, c - 6, 2);
    B.color(c, '#40104a', '#200828');
    B.p(c + 2, 2, 'mini', 4);
    c = corridor(B, c + 3, 'wave',
      [[4, 6.5], [6, 8.5], [3.5, 6], [1.5, 4], [4, 6.5], [6, 8.5], [3.5, 6], [1.5, 4], [3.5, 6]],
      { spacing: 6, width: 2, lead: 12 });
    B.p(c - 6, 10, 'big', 20);
    B.color(c, '#300010', '#180008');
    c = spider(B, c, 10);
    c = corridor(B, c, 'swing', [[3, 7], [5, 9], [2, 6], [4, 8], [2, 6], [5, 9]], { spacing: 11, lead: 12 });
    speed(B, c - 6, 1);
    B.color(c, '#600020', '#300010');
    c = robot(B, c);
    c = ball(B, c, 10);
    B.p(c + 2, 2, 's2', 4);
    c = corridor(B, c + 4, 'ufo', [[2, 6], [4, 8], [2, 6], [5, 9], [3, 7], [1, 5]], { spacing: 10, lead: 11 });
    B.color(c, '#ff1f3b', '#900018');
    speed(B, c - 6, 3);
    c = cubeRun(B, c, ['triple', 'double', 'stairs', 'triple', 'single']);
    return finish(B, c, 'Final Ascent', { difficulty: 'Demon', stars: 10, bpm: 170, key: 6, seed: 8 });
  }

  // ------------------------------------------------------ mode practice
  // One short, gentle level per game mode. They start already in the mode
  // so there's nothing to get through before the part you want to drill.

  const TRAINING = [
    ['cube', 'Cube Practice', '#2b5bff', '#1a3acc', (B, c) => cubeRun(B, c,
      ['single', 'single', 'double', 'block', 'blockSpike', 'platform', 'stairs',
        'padUp', 'pinkHop', 'orbGap', 'pillars', 'double', 'triple'])],
    ['ship', 'Ship Practice', '#c22bff', '#7a17b0', (B, c) => corridor(B, c, 'ship',
      [[1, 6], [2, 7], [3, 8], [2, 7], [1, 6], [3, 8], [4, 9], [2, 7], [1, 6], [3, 8], [2, 7], [4, 9]],
      { spacing: 10 })],
    ['ball', 'Ball Practice', '#ff3b5c', '#b01734', (B, c) => ball(B, c, 16, { spacing: 8 })],
    ['ufo', 'UFO Practice', '#ff8a1f', '#b0560f', (B, c) => corridor(B, c, 'ufo',
      [[1, 6], [2, 7], [1, 6], [3, 8], [2, 7], [4, 9], [3, 8], [2, 7], [1, 6], [2, 7]],
      { spacing: 9 })],
    ['wave', 'Wave Practice', '#1fb4ff', '#0f6fa0', (B, c) => corridor(B, c, 'wave',
      [[3, 7], [4, 8], [2, 6], [3, 7], [5, 9], [4, 8], [2, 6], [1, 5], [3, 7], [5, 9], [3, 7], [2, 6]],
      { spacing: 6, width: 2, lead: 10 })],
    ['robot', 'Robot Practice', '#7a7ab8', '#4a4a80', (B, c) => robot(B, robot(B, c))],
    ['spider', 'Spider Practice', '#9b30ff', '#5a1a99', (B, c) => spider(B, c, 13)],
    ['swing', 'Swing Practice', '#ffd21f', '#a08410', (B, c) => corridor(B, c, 'swing',
      [[1, 6], [2, 7], [3, 8], [2, 7], [1, 6], [3, 8], [4, 9], [2, 7], [1, 6], [3, 8]],
      { spacing: 10 })],
  ].map(([mode, name, bg, gr, run], i) => {
    const B = builder();
    B.color(0, bg, gr);
    const c = run(B, 4);
    return finish(B, c, name, {
      training: true, mode, startMode: mode,
      difficulty: 'Normal', stars: 1, bpm: 120 + i * 4, key: i, seed: 10 + i,
    });
  });

  const LEVELS = [neonSteps(), pulseCircuit(), gravityOverdrive(),
    cyberHop(), midnightDrift(), bassReactor(), hyperwave(), finalAscent()].concat(TRAINING);

  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.GDLevels = LEVELS;
})(typeof self !== 'undefined' ? self : this);
