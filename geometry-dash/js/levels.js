/* Every level, main and practice, is a list of sections, and every section
 * is generated from its own seeded RNG. Nothing is copy-pasted: cube runs
 * draw from eight obstacle families with randomised sizes, flying sections
 * random-walk their gates with jittered spacing and widths, and so on.
 *
 * tools/verify.js proves each level beatable with inputs held at least 50ms
 * (Impossible tiers: beatable at 1/60s, unbeatable at 50ms) and checks that
 * no 30-block stretch with 4+ real obstacles appears anywhere else. When a section
 * fails either check, `node tools/verify.js --fix` bumps that section's
 * seed in BUMPS and tries again, then prints the table to paste back here.
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
      // Filler: corridor floor/ceiling spike rows. Same everywhere by design,
      // so the no-repeats check doesn't count them as obstacles.
      sf: (x, y, d) => o.push({ t: 's', x, y, d, f: 1 }),
      spikes: (x, y, n, d = 1) => { for (let i = 0; i < n; i++) B.s(x + i, y, d); },
      pad: (x, y, c, d = 1) => o.push({ t: 'pad', x, y, c, d }),
      orb: (x, y, c) => o.push({ t: 'orb', x, y, c }),
      p: (x, y, k, h = 3, b) => o.push({ t: 'p', x, y, k, h, b }),
      color: (x, bg, gr) => colors.push({ x, bg, gr }),
    };
    return B;
  }

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    return h >>> 0;
  }
  const half = (v) => Math.round(v * 2) / 2;
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1)); // inclusive
  // Linear interpolation through a 5-entry table indexed by difficulty 0..4.
  function tbl(arr, d) {
    const i = Math.max(0, Math.min(arr.length - 1, d));
    const a = Math.floor(i), b = Math.min(arr.length - 1, a + 1);
    return arr[a] + (arr[b] - arr[a]) * (i - a);
  }

  // Horizontal distance scales with speed so timings stay comparable.
  const SPEED_RATIO = [0.806, 1, 1.243, 1.502, 1.849];

  // ------------------------------------------------------------ cube run
  // Obstacle families. Each places one obstacle at x and returns its end.

  const FAM = {
    spikes(B, x, r, q) {
      const n = int(r, 1, q.maxSp);
      if (n >= 2 && r() < 0.25) { B.ss(x); B.spikes(x + 1, 0, n - 1); } else B.spikes(x, 0, n);
      return x + n;
    },
    step(B, x, r, q) {
      const w = int(r, 1, 5), h = q.d >= 1.5 && r() < 0.4 ? 2 : 1;
      B.b(x, 0, w, h);
      const k = int(r, 0, Math.min(2, q.maxSp));
      B.spikes(x + w, 0, k);
      return x + w + k;
    },
    blockSpike(B, x, r, q) {
      B.b(x, 0, 1, 1);
      const k = int(r, 1, q.sp >= 2 ? 2 : 1);
      B.spikes(x + 1, 0, k);
      return x + 1 + k;
    },
    stairs(B, x, r, q) {
      const k = 2 + Math.floor(r() * Math.min(2, Math.floor(q.d)));
      for (let j = 0; j < k; j++) {
        const w = int(r, 2, 4);
        B.b(x, 0, w, j + 1);
        x += w;
        if (j < k - 1) { const g = int(r, 1, 2); B.spikes(x, 0, g); x += g; }
      }
      const t = int(r, 1, 2);
      B.spikes(x, 0, t);
      return x + t;
    },
    pad(B, x, r) {
      B.pad(x, 0, 'yellow');
      const px = x + int(r, 4, 5), w = int(r, 4, 8), h = int(r, 2, 3);
      B.b(px, 0, w, h);
      const t = int(r, 0, 2);
      B.spikes(px + w, 0, t);
      return px + w + t;
    },
    pinkHop(B, x, r) {
      B.pad(x, 0, 'pink');
      const k = int(r, 1, 2);
      B.spikes(x + 1, 0, k);
      return x + 1 + k;
    },
    orbPit(B, x, r, q) {
      const L = int(r, 4, q.sp >= 2 ? 6 : 5);
      B.spikes(x, 0, L);
      B.orb(x + Math.floor((L - 1) / 2), r() < 0.5 ? 1.6 : 2, 'yellow');
      return x + L;
    },
    pillars(B, x, r, q) {
      const m = int(r, 2, 3);
      for (let j = 0; j < m; j++) {
        const w = int(r, 1, 2), h = 1 + Math.min(j, q.d >= 2.5 ? 2 : 1);
        B.b(x, 0, w, h); x += w;
        const g = int(r, 2, 3);
        B.spikes(x, 0, g); x += g;
      }
      return x;
    },
  };

  function cubeSec(B, c, r, p) {
    const d = p.d, sf = SPEED_RATIO[p.sp];
    const fast = p.sp >= 2;
    const q = { d, sp: p.sp, maxSp: fast ? (d >= 2 ? 3 : 2) : (d >= 1 ? 2 : 1) };
    const fams = ['spikes', 'step', 'blockSpike'];
    if (d >= 0.5) fams.push('pad', 'stairs');
    if (d >= 0.8 && p.sp <= 2) fams.push('pinkHop');
    if (d >= 1) fams.push('orbPit');
    if (d >= 1.5) fams.push('pillars');
    const gapBase = p.impossible ? 2 : tbl([6, 5.5, 5, 4.5, 3.5], d);
    if (p.mini) { B.p(c + 1, 10, 'mini', 20); c += 2; }
    const n = p.n || Math.round(8 + 2 * d);
    let x = c + 3, last = '';
    for (let i = 0; i < n; i++) {
      let f = pick(r, fams);
      if (f === last) f = pick(r, fams); // fewer back-to-back repeats
      last = f;
      x += Math.max(Math.ceil(3 * sf), Math.round((gapBase + r() * 3) * sf));
      x = FAM[f](B, x, r, q);
    }
    if (p.mini) { B.p(x + 4, 10, 'big', 20); x += 4; }
    return x + 6;
  }

  // -------------------------------------------------------- flying modes

  function gate(B, x, lo, hi, top, w = 1, tips = false) {
    if (lo > 0) B.b(x, 0, w, lo);
    if (hi < top) B.b(x, hi, w, top - hi);
    // Spikes on the column ends shrink the opening and punish clipping it.
    if (tips) {
      for (let k = 0; k < w; k++) {
        if (lo > 0) B.s(x + k, lo);
        if (hi < top) B.s(x + k, hi - 1, -1);
      }
    }
  }

  // Gap height, gate spacing (blocks at 1x), how far the gap centre may move
  // between gates, and gate count, each by difficulty 0..4.
  const FLY = {
    ship:  { h: [6, 5, 4, 3, 2.5],     space: [11, 10, 9, 8, 5], delta: [1, 2, 2.5, 3, 4.5],   n: [8, 10, 12, 14, 20] },
    ufo:   { h: [6, 5, 4.5, 3.5, 3],   space: [10, 9, 8, 8, 5],  delta: [1, 1.5, 2, 2.5, 3.5], n: [8, 10, 12, 14, 20] },
    wave:  { h: [5, 4, 3.2, 2.4, 2.2], space: [8, 7, 6, 5, 3],   delta: [1, 1.5, 2, 2.5, 3],   n: [8, 10, 12, 14, 24] },
    swing: { h: [6, 5, 4, 3.2, 2.6],   space: [11, 10, 9, 8, 5], delta: [1, 1.5, 2, 3, 4.5],   n: [8, 10, 12, 14, 20] },
  };

  // Enter, a run of gates between spike-lined floor and ceiling, then a
  // full-height exit portal back to cube.
  function flySec(B, c, r, p, mode) {
    const k = FLY[mode], top = 10, sf = SPEED_RATIO[p.sp];
    const d = p.impossible ? 4 : p.d;
    const h = tbl(k.h, d), delta = tbl(k.delta, d), space = tbl(k.space, d) * sf;
    const n = p.n || Math.round(tbl(k.n, d));
    const tips = !!p.impossible;
    B.p(c, 2, mode, 4);
    if (p.mini) B.p(c + 1, 2, 'mini', 4);
    let x = c + Math.max(9, Math.round(space)), mid = top / 2;
    const gates = [];
    for (let i = 0; i < n; i++) {
      mid += (r() * 2 - 1) * delta;
      mid = Math.min(top - h / 2 - 0.6, Math.max(h / 2 + 0.6, mid));
      const lo = half(mid - h / 2);
      const w = mode === 'wave' ? (p.impossible ? 1 : 2) : (r() < 0.3 ? 2 : 1);
      gates.push({ x, lo, hi: lo + h, w });
      x += Math.max(w + 2, Math.round(space + r() * 3 - 1));
    }
    const cols = new Set();
    for (const g of gates) for (let j = 0; j < g.w; j++) cols.add(g.x + j);
    for (let xx = c + 6; xx < x - 1; xx++) {
      if (cols.has(xx)) continue;
      B.sf(xx, 0, 1); B.sf(xx, top - 1, -1);
    }
    for (const g of gates) gate(B, g.x, g.lo, g.hi, top, g.w, tips);
    B.p(x, top / 2, 'cube', top);
    if (p.mini) B.p(x + 1, 10, 'big', 20);
    return x + 8;
  }

  // ------------------------------------------------- ball and spider

  function clusterSec(B, c, r, p, mode) {
    if (p.impossible) return clusterImpossible(B, c, r, mode);
    const top = 8, d = p.d, sf = SPEED_RATIO[p.sp];
    const maxLen = Math.max(1, Math.round(tbl([1, 2, 2, 3, 3], d)));
    const gmin = tbl([9, 7, 6, 5, 4], d);
    const n = p.n || Math.round(8 + 2 * d);
    B.p(c, 2, mode, 4);
    let x = c + 8, side = 0;
    for (let i = 0; i < n; i++) {
      if (mode === 'spider' && d >= 2 && r() < 0.25) {
        // A floor pillar under a ceiling pillar: hop onto the low one.
        const w1 = int(r, 2, 4), w2 = int(r, 2, 4), h1 = int(r, 2, 3);
        B.b(x, 0, w1, h1); B.b(x + w1, h1 + 2, w2, top - h1 - 2);
        x += w1 + w2 + Math.round(gmin * sf);
        continue;
      }
      const len = int(r, 1, maxLen);
      if (side === 0) B.spikes(x, 0, len);
      else B.spikes(x, top - 1, len, -1);
      x += len + Math.round((gmin + r() * 3) * sf);
      if (!(d >= 3 && r() < 0.3)) side = 1 - side;
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  // Impossible ball/spider: windows narrower than a 50ms tap at 4x.
  // Ball: spikes on floor AND ceiling at the same x, so you must be mid-flip
  // exactly as you pass. Spider: floor and ceiling runs one block apart.
  function clusterImpossible(B, c, r, mode) {
    const top = 8;
    B.p(c, 2, mode, 4);
    let x = c + 10, side = 0;
    for (let i = 0; i < 22; i++) {
      if (mode === 'ball') {
        const len = 4 + (r() < 0.5 ? 1 : 0);
        B.spikes(x, 0, len); B.spikes(x, top - 1, len, -1);
        x += len + 4 + Math.floor(r() * 5);
      } else {
        const len = 2 + Math.floor(r() * 3);
        if (side === 0) B.spikes(x, 0, len);
        else B.spikes(x, top - 1, len, -1);
        x += len + 1;
        side = 1 - side;
      }
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  // ---------------------------------------------------------------- robot

  function robotSec(B, c, r, p) {
    const d = p.d, sf = SPEED_RATIO[p.sp];
    const n = p.n || Math.round(tbl([8, 10, 12, 14, 22], d));
    const pitMax = Math.round(tbl([2, 3, 4, 5, 7], d)), wallMax = d >= 1 ? 2 : 1;
    const gap = Math.round(tbl([8, 7, 6, 5, 2], d) * sf);
    B.p(c, 2, 'robot', 4);
    c += 6;
    for (let i = 0; i < n; i++) {
      const kind = r();
      if (kind < 0.4) {
        const w = int(r, 1, pitMax);
        B.spikes(c, 0, w); c += w;
      } else if (kind < 0.7) {
        const h = int(r, 1, wallMax);
        B.b(c, 0, 1, h); c += 1;
      } else {
        const w = int(r, 3, 5), h = int(r, 1, wallMax);
        B.b(c, 0, w, h); B.spikes(c + w, 0, Math.min(pitMax, 2)); c += w + 2;
      }
      c += gap + int(r, 0, 2);
    }
    B.p(c + 2, 10, 'cube', 20);
    return c + 6;
  }

  // ------------------------------------------------- upside-down cube

  function flipSec(B, c, r, p) {
    const ceil = 6, L = 56 + Math.floor(r() * 20), sf = SPEED_RATIO[p.sp];
    B.b(c + 2, ceil, L, 1);
    B.p(c + 6, 2, 'grav+', 4);
    let x = c + 16;
    while (x < c + L - 14) {
      const f = r();
      if (f < 0.45) {
        const k = int(r, 1, p.d >= 1.5 ? 2 : 1);
        B.spikes(x, ceil - 1, k, -1); x += k;
      } else if (f < 0.75) {
        const w = int(r, 2, 3);
        B.b(x, ceil - 1, w, 1); B.s(x + w, ceil - 1, -1); x += w + 1;
      } else {
        const w = int(r, 1, 3);
        B.b(x, ceil - 1, w, 1); x += w;
      }
      x += Math.round((7 + r() * 5) * sf);
    }
    B.p(c + L - 6, 3, 'grav-', 6);
    return c + L + 4;
  }

  const GEN = {
    cube: cubeSec, robot: robotSec, flip: flipSec,
    ship: (B, c, r, p) => flySec(B, c, r, p, 'ship'),
    ufo: (B, c, r, p) => flySec(B, c, r, p, 'ufo'),
    wave: (B, c, r, p) => flySec(B, c, r, p, 'wave'),
    swing: (B, c, r, p) => flySec(B, c, r, p, 'swing'),
    ball: (B, c, r, p) => clusterSec(B, c, r, p, 'ball'),
    spider: (B, c, r, p) => clusterSec(B, c, r, p, 'spider'),
  };

  const MODE_COLORS = {
    cube: ['#2b5bff', '#1a3acc'], ship: ['#c22bff', '#7a17b0'], ball: ['#ff3b5c', '#b01734'],
    ufo: ['#ff8a1f', '#b0560f'], wave: ['#1fb4ff', '#0f6fa0'], robot: ['#7a7ab8', '#4a4a80'],
    spider: ['#9b30ff', '#5a1a99'], swing: ['#e0b000', '#8a6c00'], flip: ['#7a2bff', '#45179a'],
  };

  // Builds a level from its section list. bumps[i] reseeds section i only.
  function buildLevel(def, bumps) {
    const B = builder();
    let c = 6, cur = def.sp0 == null ? 1 : def.sp0;
    const sections = [];
    def.secs.forEach(([kind, p], i) => {
      const r = rng(hash(def.name) + i * 7919 + ((bumps && bumps[i]) || 0) * 104729);
      const pal = (def.pal && def.pal[i % def.pal.length]) || MODE_COLORS[kind];
      B.color(c, pal[0], pal[1]);
      const x0 = c;
      if (p.sp != null && p.sp !== cur) { B.p(c + 1, 10, 's' + p.sp, 20); c += 3; cur = p.sp; }
      c = GEN[kind](B, c, r, Object.assign({}, p, { sp: cur }));
      sections.push([x0, c]);
    });
    return Object.assign({
      name: def.name, objects: B.o, colors: B.colors, length: c + 14, sections,
      startSpeed: def.sp0 == null ? 1 : def.sp0,
    }, def.meta);
  }

  // ---------------------------------------------------------------- levels
  // Array order is the save-slot order, so new levels go on the end.

  const MAIN = [
    { name: 'Neon Steps', meta: { difficulty: 'Easy', stars: 2, bpm: 128, key: 0, seed: 1 },
      pal: [['#2b5bff', '#1a3acc'], ['#c22bff', '#7a17b0'], ['#2b5bff', '#1a3acc'], ['#ff3b5c', '#b01734'], ['#ff8a1f', '#b0560f']],
      secs: [['cube', { d: 0.5, n: 10 }], ['ship', { d: 0.5, n: 9 }], ['cube', { d: 0.8, n: 5 }],
        ['ball', { d: 0.5, n: 8 }], ['ufo', { d: 0.6, n: 8 }], ['cube', { d: 0.8, n: 4 }]] },
    { name: 'Pulse Circuit', meta: { difficulty: 'Harder', stars: 6, bpm: 140, key: 3, seed: 2 },
      pal: [['#16c79a', '#0d7d61'], ['#1fb4ff', '#0f6fa0'], ['#e0e0ff', '#7a7aa8'], ['#9b30ff', '#5a1a99'], ['#ff2bd0', '#a0178a'], ['#16c79a', '#0d7d61']],
      secs: [['cube', { d: 2, n: 5 }], ['wave', { d: 2, n: 11 }], ['robot', { d: 2, n: 8 }],
        ['spider', { d: 2, n: 9 }], ['ship', { d: 2, n: 8, sp: 2 }], ['cube', { d: 2.2, n: 6 }]] },
    { name: 'Gravity Overdrive', meta: { difficulty: 'Insane', stars: 9, bpm: 150, key: 5, seed: 3 },
      pal: [['#ff3b3b', '#a01818'], ['#ffd21f', '#a08410'], ['#7a2bff', '#45179a'], ['#ff3b3b', '#a01818'], ['#ff8a1f', '#b0560f'],
        ['#1fb4ff', '#0f6fa0'], ['#9b30ff', '#5a1a99'], ['#e0e0ff', '#7a7aa8'], ['#ff2bd0', '#a0178a'], ['#ff3b3b', '#a01818']],
      secs: [['cube', { d: 2.5, n: 5, mini: true }], ['swing', { d: 2.8, n: 7 }], ['flip', { d: 2.8 }],
        ['cube', { d: 2, n: 1 }], ['ufo', { d: 2.8, n: 7, sp: 2 }], ['wave', { d: 2.6, n: 8, mini: true, sp: 1 }],
        ['spider', { d: 2.8, n: 7 }], ['robot', { d: 2.8, n: 8 }], ['ship', { d: 3, n: 7, sp: 3 }],
        ['cube', { d: 3, n: 6, sp: 2 }]] },
    { name: 'Cyber Hop', meta: { difficulty: 'Easy', stars: 3, bpm: 124, key: 7, seed: 4 },
      pal: [['#00b4a0', '#00786a'], ['#ff8a1f', '#b0560f'], ['#00b4a0', '#00786a'], ['#7a7ab8', '#4a4a80'], ['#00b4a0', '#00786a']],
      secs: [['cube', { d: 0.8, n: 7 }], ['ufo', { d: 0.8, n: 7 }], ['cube', { d: 1, n: 4 }],
        ['robot', { d: 0.8, n: 7 }], ['cube', { d: 1, n: 5 }]] },
    { name: 'Midnight Drift', meta: { difficulty: 'Normal', stars: 4, bpm: 132, key: 2, seed: 5 },
      pal: [['#1c2a6b', '#0f1840'], ['#1c2a6b', '#0f1840'], ['#3b1c6b', '#22104a'], ['#6b1c3b', '#4a1026'], ['#1c4a6b', '#103048'], ['#1c2a6b', '#0f1840']],
      secs: [['cube', { d: 1, n: 5, mini: true }], ['cube', { d: 1.2, n: 3 }], ['ship', { d: 1.2, n: 8 }],
        ['ball', { d: 1.2, n: 10 }], ['wave', { d: 1, n: 9 }], ['cube', { d: 1.3, n: 4 }]] },
    { name: 'Bass Reactor', meta: { difficulty: 'Hard', stars: 5, bpm: 145, key: 4, seed: 6 },
      pal: [['#c21b4b', '#801030'], ['#9b30ff', '#5a1a99'], ['#7a2bff', '#45179a'], ['#c21b4b', '#801030'], ['#ffd21f', '#a08410'], ['#7a7ab8', '#4a4a80'], ['#c21b4b', '#801030']],
      secs: [['cube', { d: 1.8, n: 5 }], ['spider', { d: 1.8, n: 10 }], ['flip', { d: 1.5 }],
        ['cube', { d: 1.5, n: 1 }], ['swing', { d: 1.8, n: 7, sp: 2 }], ['robot', { d: 1.8, n: 8, sp: 1 }],
        ['cube', { d: 2, n: 5 }]] },
    { name: 'Hyperwave', meta: { difficulty: 'Harder', stars: 7, bpm: 160, key: 9, seed: 7 }, sp0: 2,
      pal: [['#00a8ff', '#0068a0'], ['#00a8ff', '#0068a0'], ['#00e0ff', '#008aa0'], ['#ff2bd0', '#a0178a'], ['#ff8a1f', '#b0560f'], ['#00a8ff', '#0068a0']],
      secs: [['cube', { d: 2, n: 4 }], ['wave', { d: 2.3, n: 11 }], ['wave', { d: 2, n: 9, mini: true }],
        ['ship', { d: 2.5, n: 7, sp: 3 }], ['ufo', { d: 2.5, n: 6, sp: 2 }], ['cube', { d: 2.5, n: 4 }]] },
    { name: 'Final Ascent', meta: { difficulty: 'Demon', stars: 10, bpm: 170, key: 6, seed: 8 }, sp0: 3,
      pal: [['#300010', '#180008'], ['#600020', '#300010'], ['#40104a', '#200828'], ['#300010', '#180008'], ['#600020', '#300010'],
        ['#40104a', '#200828'], ['#600020', '#300010'], ['#300010', '#180008'], ['#ff1f3b', '#900018']],
      secs: [['cube', { d: 3.3, n: 5 }], ['ship', { d: 3.3, n: 8 }], ['wave', { d: 3, n: 9, mini: true, sp: 2 }],
        ['spider', { d: 3.3, n: 10 }], ['swing', { d: 3.3, n: 6 }], ['robot', { d: 3.3, n: 8, sp: 1 }],
        ['ball', { d: 3.3, n: 10 }], ['ufo', { d: 3.3, n: 6, sp: 2 }], ['cube', { d: 3.5, n: 5, sp: 3 }]] },
  ];

  // ------------------------------------------------------ mode practice
  // Five tiers per mode, each one generated section that starts already in
  // the mode. Impossible must pass with 1/60s inputs yet fail with 50ms ones.

  const TIERS = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Impossible'];
  const MODE_NAMES = {
    cube: 'Cube', ship: 'Ship', ball: 'Ball', ufo: 'UFO', wave: 'Wave', robot: 'Robot', spider: 'Spider', swing: 'Swing',
  };
  // Speed index per tier (0 = 0.5x ... 4 = 4x)
  const TIER_SPEED = {
    cube: [0, 1, 1, 2, 4], ship: [0, 1, 2, 3, 4], ball: [0, 1, 1, 2, 4], ufo: [0, 1, 1, 2, 4],
    wave: [0, 1, 1, 2, 4], robot: [0, 1, 1, 2, 4], spider: [0, 1, 2, 2, 4], swing: [0, 1, 1, 2, 4],
  };

  const PRACTICE = [];
  for (const mode of Object.keys(MODE_NAMES)) {
    TIERS.forEach((tier, t) => {
      const imp = t === 4;
      PRACTICE.push({
        name: `${MODE_NAMES[mode]} ${tier}`, sp0: TIER_SPEED[mode][t],
        secs: [[mode, { d: t, impossible: imp, mini: imp && mode === 'wave', n: mode === 'cube' && imp ? 20 : undefined }]],
        meta: {
          training: true, mode, tier: t, tierName: tier, startMode: mode,
          slot: `t:${mode}:${t}`, verifyStep: imp ? 4 : 12,
          difficulty: tier, stars: t + 1, bpm: 116 + t * 12, key: t * 2, seed: 20 + t,
        },
      });
    });
  }

  const DEFS = MAIN.concat(PRACTICE);

  // Seed bumps per level, per section (missing = 0). Written by
  // `node tools/verify.js --fix`.
  const BUMPS = {
    'Gravity Overdrive': [0, 0, 0, 0, 0, 0, 0, 1],
    'Final Ascent': [0, 0, 0, 0, 0, 3],
    'Cube Impossible': [19],
    'Ship Impossible': [3],
    'Robot Impossible': [4],
    'Swing Impossible': [2],
    'Cube Medium': [1],
    'Ball Easy': [2],
    'Ball Impossible': [2],
    'Robot Easy': [1],
    'Spider Easy': [10],
  };

  function buildAll(bumps) {
    return DEFS.map((def) => buildLevel(def, bumps[def.name]));
  }

  const LEVELS = buildAll(BUMPS);
  LEVELS.TIERS = TIERS;
  LEVELS.BUMPS = BUMPS;
  LEVELS.buildAll = buildAll; // used by tools/verify.js --fix
  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.GDLevels = LEVELS;
})(typeof self !== 'undefined' ? self : this);
