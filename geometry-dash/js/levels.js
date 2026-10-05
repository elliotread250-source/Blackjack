/* Every level, main and practice, is a list of sections, and every section
 * is generated from its own seeded RNG. Nothing is copy-pasted: cube runs
 * draw from eight obstacle families with randomised sizes, flying sections
 * random-walk their gates with jittered spacing and widths, and so on.
 *
 * tools/verify.js proves each level beatable with inputs held at least 50ms
 * (Extreme Demon: beatable at 1/60s, unbeatable at 50ms) and checks that
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
      // Saw blade centred on (cx, cy); the box is its bounding square.
      saw: (cx, cy, r, chain = false) => o.push({ t: 'saw', x: cx - r, y: cy - r, w: 2 * r, h: 2 * r, r, chain }),
      coin: (x, y) => o.push({ t: 'coin', x, y }),
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
  const lerp = (a, b, t) => a + (b - a) * t;
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
      const w = int(r, 1, 5), h = q.d >= 1.5 && !q.mini && r() < 0.4 ? 2 : 1;
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
    pad(B, x, r, q) {
      B.pad(x, 0, 'yellow');
      const px = x + int(r, 4, 5), w = int(r, 4, 8), h = q.mini ? 2 : int(r, 2, 3);
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
    // Fingerdash-era families, used by sections flagged ext.
    saw(B, x, r) {
      const rad = 1 + r() * 0.4;
      B.saw(x + rad, -0.3, rad);
      return x + rad * 2;
    },
    dashPit(B, x, r, q) {
      B.orb(x, 1.5, 'dash');
      const L = int(r, 6, q.sp >= 2 ? 11 : 9);
      B.spikes(x + 1, 0, L);
      return x + 1 + L;
    },
    redPad(B, x, r) {
      B.pad(x, 0, 'red');
      const px = x + int(r, 5, 6), w = int(r, 4, 6), h = int(r, 4, 5);
      B.b(px, 0, w, h);
      const t = int(r, 1, 2);
      B.spikes(px + w, 0, t);
      return px + w + t;
    },
    pillars(B, x, r, q) {
      const m = int(r, 2, 3);
      for (let j = 0; j < m; j++) {
        const w = int(r, 1, 2), h = 1 + Math.min(j, q.d >= 2.5 && !q.mini ? 2 : 1);
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
    // Mini jumps are lower and shorter: no 3-spike runs, no tall steps.
    const mini = !!(p.mini || p.startMini);
    const q = { d, sp: p.sp, mini, maxSp: mini ? (fast ? 2 : 1) + (d >= 2.5 ? 1 : 0) : fast ? (d >= 2 ? 3 : 2) : (d >= 1 ? 2 : 1) };
    let fams = ['spikes', 'step', 'blockSpike'];
    if (d >= 0.5) fams.push('pad', 'stairs');
    if (d >= 0.8 && p.sp <= 2) fams.push('pinkHop');
    if (d >= 1) fams.push('orbPit');
    if (d >= 1.5) fams.push('pillars');
    if (p.ext && !mini) fams.push('saw', 'dashPit', 'redPad');
    if (p.impossible) { fams = ['spikes', 'pillars', 'orbPit', 'stairs', 'blockSpike']; q.maxSp = 3; }
    // Extreme Demon: p.tight (0..1, tuned per level by verify.js --fix)
    // squeezes the gaps until 50ms inputs can't make it but 1/60s ones can.
    const gapBase = p.impossible ? lerp(3, 0, p.tight) : tbl([6, 5.5, 5, 4.5, 4], d);
    const minGap = p.impossible ? lerp(3, 1, p.tight) : 3;
    if (p.mini) { B.p(c + 1, 10, 'mini', 20); c += 2; }
    const n = p.n || Math.round(8 + 2 * d);
    let x = c + 3, last = '';
    for (let i = 0; i < n; i++) {
      let f = pick(r, fams);
      if (f === last) f = pick(r, fams); // fewer back-to-back repeats
      last = f;
      x += Math.max(Math.ceil(minGap * sf), Math.round((gapBase + r() * 3) * sf));
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
  // between gates, and gate count, each by difficulty 0..4 (4 = hardest that
  // is still fair). Extreme Demon goes past the table: see flySec.
  const FLY = {
    ship:  { h: [6, 5, 4, 3.2, 2.8],   space: [11, 10, 9, 8, 7], delta: [1, 2, 2.5, 3, 3.5],   n: [8, 10, 12, 14, 16] },
    ufo:   { h: [6, 5, 4.5, 3.8, 3.3], space: [10, 9, 8, 8, 7],  delta: [1, 1.5, 2, 2.5, 3],   n: [8, 10, 12, 14, 16] },
    wave:  { h: [5, 4, 3.2, 2.6, 2.3], space: [8, 7, 6, 5, 4.5], delta: [1, 1.5, 2, 2.5, 2.8], n: [8, 10, 12, 14, 16] },
    swing: { h: [6, 5, 4, 3.4, 3],     space: [11, 10, 9, 8, 7], delta: [1, 1.5, 2, 3, 3.5],   n: [8, 10, 12, 14, 16] },
  };

  // Enter, a run of gates between spike-lined floor and ceiling, then a
  // full-height exit portal back to cube.
  function flySec(B, c, r, p, mode) {
    const k = FLY[mode], top = 10, sf = SPEED_RATIO[p.sp];
    const d = p.impossible ? 4 : p.d;
    let h = tbl(k.h, d), delta = tbl(k.delta, d), space = tbl(k.space, d) * sf;
    let n = p.n || Math.round(tbl(k.n, d));
    if (p.impossible) {
      // Extreme Demon: spike-tipped gates shrinking with p.tight; mini
      // hitboxes get roomier gaps, so they shrink further.
      // Spike tips eat a fixed slice of every gap, so mini shrinks by the
      // hitbox difference rather than a percentage.
      h = lerp(h * 0.95, h * 0.5, p.tight) - (p.startMini ? (mode === 'wave' ? 0.15 : 0.4) : 0);
      space = lerp(6, 4, p.tight) * sf;
      delta += 1;
      n = 20;
    }
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
    if (p.saws) {
      // Saws on chains under ceiling columns, or perched on floor columns.
      const rr = rng(gates.length * 977 + Math.round(c));
      for (const g of gates) {
        if (rr() > 0.45) continue;
        if (g.hi < top && rr() < 0.6) B.saw(g.x + g.w / 2, g.hi - 0.15, 0.7, true);
        else if (g.lo > 0) B.saw(g.x + g.w / 2, g.lo + 0.15, 0.7);
      }
    }
    B.p(x, top / 2, 'cube', top);
    if (p.mini) B.p(x + 1, 10, 'big', 20);
    return x + 8;
  }

  // ------------------------------------------------- ball and spider

  function clusterSec(B, c, r, p, mode) {
    if (p.impossible) return clusterImpossible(B, c, r, mode, !!p.startMini, p.tight);
    const top = 8, d = p.d, sf = SPEED_RATIO[p.sp];
    const maxLen = Math.max(1, Math.round(tbl([1, 2, 2, 3, 3], d)));
    const gmin = tbl([9, 7, 6, 5, 4.5], d);
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
      // Mix of spike runs, small-spike runs and 1-high bumps, on half-block
      // spacing, so no stretch of one run turns up in another.
      const len = int(r, 1, maxLen), kind = r();
      const y = side === 0 ? 0 : top - 1, dir = side === 0 ? 1 : -1;
      if (kind < 0.18 && d >= 0.5) {
        for (let j = 0; j < len + 1; j++) B.ss(x + j, y, dir);
        x += 1;
      } else if (kind < 0.32 && d >= 1) {
        B.b(x, y, len + 1, 1);
        x += 1;
      } else {
        B.spikes(x, y, len, dir);
      }
      x += len + half((gmin + r() * 4) * sf);
      if (!(d >= 3 && r() < 0.3)) side = 1 - side;
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  // Extreme Demon ball/spider: windows narrower than a 50ms tap at 4x.
  // Ball: spikes on floor AND ceiling at the same x, so you must be mid-flip
  // exactly as you pass; tight lengthens the columns. Spider: floor and
  // ceiling runs alternating, tight closes the gap between them.
  function clusterImpossible(B, c, r, mode, mini, tight) {
    const top = 8;
    B.p(c, 2, mode, 4);
    let x = c + 10, side = 0;
    for (let i = 0; i < 22; i++) {
      if (mode === 'ball') {
        const base = lerp(3, mini ? 6.5 : 6, tight);
        const len = Math.floor(base) + (r() < base % 1 ? 1 : 0);
        const shift = r() < 0.5 ? 0 : 0.5; // ceiling run offset, for variety
        B.spikes(x, 0, len); B.spikes(x + shift, top - 1, len, -1);
        x += len + shift + (mini ? 3 : 4) + half(r() * (mini ? 3 : 5));
      } else {
        const len = 2 + Math.floor(r() * 3);
        if (side === 0) B.spikes(x, 0, len);
        else B.spikes(x, top - 1, len, -1);
        x += len + half(lerp(1.5, 0, tight));
        side = 1 - side;
      }
    }
    B.p(x + 2, top / 2, 'cube', top);
    return x + 10;
  }

  // ---------------------------------------------------------------- robot

  function robotSec(B, c, r, p) {
    const d = p.d, sf = SPEED_RATIO[p.sp];
    const n = p.n || (p.impossible ? 22 : Math.round(tbl([8, 10, 12, 14, 16], d)));
    const pitMax = p.impossible ? 7 : Math.round(tbl([2, 3, 4, 5, 5], d) * (p.startMini ? 0.75 : 1));
    const wallMax = d >= 1 && !p.startMini ? 2 : 1;
    const gap = Math.round((p.impossible ? lerp(3, 0, p.tight) : tbl([8, 7, 6, 5, 3.5], d)) * sf);
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
  // Fastest speed portal a level of difficulty D may use: early levels stay
  // at 1x, mid levels reach 2x, only the hardest get 3x.
  const maxSpeed = (D) => (D < 1 ? 1 : D < 2 ? 2 : 3);

  function buildLevel(def, bumps, tight, coins) {
    const B = builder();
    const cap = def.D == null ? 4 : maxSpeed(def.D);
    let c = 6, cur = Math.min(cap, def.sp0 == null ? 1 : def.sp0);
    const sections = [];
    const n = def.secs.length;
    def.secs.forEach(([kind, p0], i) => {
      // Main levels: every section takes its difficulty from the level's D,
      // warming up from 85% at the start to 100% at the end.
      const p = Object.assign({}, p0);
      if (def.D != null) {
        p.d = def.D * (0.85 + 0.15 * (n > 1 ? i / (n - 1) : 1));
        if (p.sp != null) p.sp = Math.min(cap, p.sp);
      }
      const r = rng(hash(def.name) + i * 7919 + ((bumps && bumps[i]) || 0) * 104729);
      const pal = (def.pal && def.pal[i % def.pal.length]) || MODE_COLORS[kind];
      B.color(c, pal[0], pal[1]);
      const x0 = c;
      if (p.sp != null && p.sp !== cur) { B.p(c + 1, 10, 's' + p.sp, 20); c += 3; cur = p.sp; }
      c = GEN[kind](B, c, r, Object.assign({}, p, { sp: cur, tight: tight == null ? 0.5 : tight }));
      sections.push([x0, c]);
    });
    // Coins sit on a winning path the verifier recorded (COINS table).
    for (const [x, y] of coins || []) B.coin(x, y);
    return Object.assign({
      name: def.name, objects: B.o, colors: B.colors, length: c + 14, sections,
      startSpeed: Math.min(cap, def.sp0 == null ? 1 : def.sp0), coinCount: (coins || []).length,
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
    { name: 'Final Ascent', meta: { difficulty: 'Medium Demon', stars: 10, bpm: 170, key: 6, seed: 8 }, sp0: 3,
      pal: [['#300010', '#180008'], ['#600020', '#300010'], ['#40104a', '#200828'], ['#300010', '#180008'], ['#600020', '#300010'],
        ['#40104a', '#200828'], ['#600020', '#300010'], ['#300010', '#180008'], ['#ff1f3b', '#900018']],
      secs: [['cube', { d: 3.3, n: 5 }], ['ship', { d: 3.3, n: 8 }], ['wave', { d: 3, n: 9, mini: true, sp: 2 }],
        ['spider', { d: 3.3, n: 10 }], ['swing', { d: 3.3, n: 6 }], ['robot', { d: 3.3, n: 8, sp: 1 }],
        ['ball', { d: 3.3, n: 10 }], ['ufo', { d: 3.3, n: 6, sp: 2 }], ['cube', { d: 3.5, n: 5, sp: 3 }]] },
    { name: 'Prism Drop', meta: { difficulty: 'Normal', stars: 3, bpm: 126, key: 8, seed: 9 },
      pal: [['#ff5fa2', '#b0306a'], ['#ffb03b', '#a8701e'], ['#5fd0ff', '#2a86b0'], ['#b06bff', '#6e38b0'], ['#ff5fa2', '#b0306a'], ['#5fffb0', '#2aa870']],
      secs: [['cube', { d: 0.9, n: 6 }], ['swing', { d: 0.8, n: 7 }], ['cube', { d: 1, n: 4 }],
        ['spider', { d: 0.9, n: 8 }], ['ship', { d: 1, n: 8 }], ['cube', { d: 1.1, n: 4 }]] },
    { name: 'Solar Flux', meta: { difficulty: 'Hard', stars: 5, bpm: 138, key: 1, seed: 10 },
      pal: [['#ff7a00', '#a04800'], ['#ff3b1f', '#a01e0a'], ['#ffb800', '#a07000'], ['#ff7a00', '#a04800'], ['#ff5a3b', '#a0301e'],
        ['#ffd23b', '#a0841e'], ['#c8642b', '#7a3a14'], ['#ff7a00', '#a04800']],
      secs: [['cube', { d: 1.6, n: 5 }], ['ball', { d: 1.6, n: 9 }], ['flip', { d: 1.6 }], ['cube', { d: 1.5, n: 1 }],
        ['wave', { d: 1.6, n: 10 }], ['ufo', { d: 1.7, n: 8, sp: 2 }], ['robot', { d: 1.8, n: 7, sp: 1 }], ['cube', { d: 1.8, n: 4 }]] },
    { name: 'Static Storm', meta: { difficulty: 'Harder', stars: 7, bpm: 152, key: 10, seed: 11 },
      pal: [['#3b4a6b', '#1e2840'], ['#5a6b8a', '#30405a'], ['#2b8aff', '#1a50a0'], ['#3b4a6b', '#1e2840'], ['#8a5aff', '#5030a0'],
        ['#2bd0ff', '#1a80a0'], ['#3b4a6b', '#1e2840']],
      secs: [['cube', { d: 2.3, n: 5, sp: 2 }], ['spider', { d: 2.3, n: 9 }], ['swing', { d: 2.4, n: 8 }],
        ['cube', { d: 2.2, n: 4, mini: true }], ['ship', { d: 2.5, n: 8, sp: 3 }], ['ball', { d: 2.5, n: 8, sp: 2 }],
        ['cube', { d: 2.5, n: 4 }]] },
    { name: 'Neon Abyss', meta: { difficulty: 'Insane', stars: 8, bpm: 158, key: 11, seed: 12 },
      pal: [['#00ffa0', '#008a56'], ['#00c8ff', '#00708a'], ['#a000ff', '#5a008a'], ['#3b0070', '#1e0038'], ['#00ffa0', '#008a56'],
        ['#ff00a0', '#8a0056'], ['#ffe000', '#8a7a00'], ['#a000ff', '#5a008a'], ['#00ffa0', '#008a56']],
      secs: [['cube', { d: 2.8, n: 6 }], ['wave', { d: 2.8, n: 12, sp: 2 }], ['robot', { d: 2.8, n: 8 }], ['flip', { d: 2.8 }],
        ['cube', { d: 2, n: 1 }], ['ufo', { d: 2.9, n: 7, sp: 3 }], ['swing', { d: 2.9, n: 7 }], ['spider', { d: 3, n: 8 }],
        ['cube', { d: 3, n: 5 }]] },
    { name: 'Chaos Theory', meta: { difficulty: 'Hard Demon', stars: 10, bpm: 175, key: 3, seed: 13 }, sp0: 2,
      pal: [['#1a0000', '#0a0000'], ['#4a0000', '#200000'], ['#2a002a', '#140014'], ['#000a3a', '#00051e'], ['#4a1a00', '#200a00'],
        ['#3a003a', '#1e001e'], ['#4a0000', '#200000'], ['#00203a', '#00101e'], ['#ff2020', '#800000']],
      secs: [['cube', { d: 3.4, n: 6 }], ['ship', { d: 3.4, n: 9, sp: 3 }], ['ball', { d: 3.4, n: 10 }],
        ['wave', { d: 3.3, n: 10, mini: true, sp: 2 }], ['robot', { d: 3.4, n: 8 }], ['swing', { d: 3.4, n: 7, sp: 3 }],
        ['spider', { d: 3.5, n: 9 }], ['ufo', { d: 3.4, n: 7 }], ['cube', { d: 3.6, n: 6, sp: 3 }]] },
    { name: 'Fingerflash', meta: { bpm: 156, key: 2, seed: 14 },
      pal: [['#18c24a', '#0c7a2c'], ['#9b30ff', '#5a1a99'], ['#20d860', '#108838'], ['#18c24a', '#0c7a2c'], ['#ff3b5c', '#b01734'],
        ['#00c8ff', '#00708a'], ['#7a7ab8', '#4a4a80'], ['#2bff7a', '#14a048']],
      secs: [['cube', { n: 7, ext: true }], ['spider', { n: 9 }], ['ship', { n: 9, saws: true }], ['cube', { n: 6, ext: true }],
        ['ball', { n: 9 }], ['wave', { n: 10, sp: 2 }], ['robot', { n: 8 }], ['cube', { n: 6, ext: true, sp: 2 }]] },
    { name: 'Last Dash', meta: { bpm: 162, key: 7, seed: 15 },
      pal: [['#ff8a00', '#a05000'], ['#ffd21f', '#a08410'], ['#1fb4ff', '#0f6fa0'], ['#ff5a00', '#a03800'], ['#ff2bd0', '#a0178a'],
        ['#ffb000', '#a07000'], ['#ffe23b', '#a0901e'], ['#ff7a00', '#a04800']],
      secs: [['cube', { n: 6, ext: true }], ['swing', { n: 9, saws: true }], ['wave', { n: 9, mini: true }],
        ['swing', { n: 9, sp: 2, saws: true }], ['ufo', { n: 8 }], ['ship', { n: 9, sp: 3, saws: true }], ['swing', { n: 9 }],
        ['cube', { n: 6, ext: true }]] },
    { name: 'Lockdown', meta: { bpm: 178, key: 9, seed: 16 }, sp0: 2,
      pal: [['#120018', '#06000c'], ['#3a0010', '#1a0008'], ['#001a3a', '#000c1e'], ['#2a0030', '#140018'], ['#3a1a00', '#1e0c00'],
        ['#002a2a', '#001414'], ['#30001a', '#18000c'], ['#1a1a1a', '#0a0a0a'], ['#3a0000', '#1a0000'], ['#ff0040', '#80001e']],
      secs: [['cube', { n: 7, ext: true }], ['ship', { n: 10, saws: true, sp: 3 }], ['ball', { n: 11 }], ['swing', { n: 9, saws: true }],
        ['robot', { n: 9 }], ['wave', { n: 12, sp: 2 }], ['spider', { n: 10 }], ['ufo', { n: 8, saws: true }],
        ['cube', { n: 7, ext: true, sp: 3 }], ['ship', { n: 10, saws: true }]] },
  ];

  // One difficulty ramp for all main levels, easiest first: each level's D
  // is evenly spaced from 0.2 to 3.55, every section is generated from it,
  // and the selector lists levels in this order.
  const RAMP = [
    ['Neon Steps', 'Easy', 1], ['Cyber Hop', 'Easy', 2], ['Prism Drop', 'Normal', 3], ['Midnight Drift', 'Normal', 3],
    ['Solar Flux', 'Hard', 4], ['Bass Reactor', 'Hard', 5], ['Pulse Circuit', 'Harder', 6], ['Static Storm', 'Harder', 6],
    ['Hyperwave', 'Harder', 7], ['Neon Abyss', 'Insane', 8], ['Gravity Overdrive', 'Insane', 9], ['Fingerflash', 'Insane', 12],
    ['Last Dash', 'Insane', 12], ['Final Ascent', 'Medium Demon', 10], ['Chaos Theory', 'Hard Demon', 10],
    ['Lockdown', 'Insane Demon', 15],
  ];
  RAMP.forEach(([name, difficulty, stars], k) => {
    const def = MAIN.find((d) => d.name === name);
    def.D = 0.2 + (k * (3.55 - 0.2)) / (RAMP.length - 1);
    Object.assign(def.meta, { difficulty, stars, order: k, levelNo: k + 1 });
  });

  // ------------------------------------------------------ mode practice
  // Every mode, normal and mini size, at GD's ten difficulties. Each is one
  // generated section that starts already in the mode (and size). Easy to
  // Insane Demon must pass with 50ms inputs; Extreme Demon must pass with
  // 1/60s inputs yet be proven unbeatable with 50ms ones.

  const TIERS = ['Easy', 'Normal', 'Hard', 'Harder', 'Insane',
    'Easy Demon', 'Medium Demon', 'Hard Demon', 'Insane Demon', 'Extreme Demon'];
  const TIER_D = [0.3, 0.75, 1.2, 1.65, 2.1, 2.55, 3.0, 3.35, 3.7];
  const TIER_SP = [1, 1, 1, 1, 2, 2, 2, 3, 3, 4]; // 0 = 0.5x ... 4 = 4x
  const MODE_NAMES = {
    cube: 'Cube', ship: 'Ship', ball: 'Ball', ufo: 'UFO', wave: 'Wave', robot: 'Robot', spider: 'Spider', swing: 'Swing',
  };

  const PRACTICE = [];
  for (const mini of [false, true]) {
    for (const mode of Object.keys(MODE_NAMES)) {
      TIERS.forEach((tier, t) => {
        const ext = t === TIERS.length - 1;
        PRACTICE.push({
          name: `${mini ? 'Mini ' : ''}${MODE_NAMES[mode]} ${tier}`, sp0: TIER_SP[t],
          secs: [[mode, {
            d: ext ? 4 : TIER_D[t], impossible: ext, startMini: mini,
            n: mode === 'cube' && ext ? 20 : undefined,
          }]],
          meta: {
            training: true, mini, mode, tier: t, tierName: tier, startMode: mode, startMini: mini,
            slot: `q:${mini ? 'm' : 'n'}:${mode}:${t}`, verifyStep: ext ? 4 : 12,
            difficulty: tier, stars: t + 1, bpm: 112 + t * 7, key: (t * 5) % 12, seed: 30 + t,
          },
        });
      });
    }
  }

  const DEFS = MAIN.concat(PRACTICE);

  // Seed bumps per level, per section (missing = 0). Written by
  // `node tools/verify.js --fix`.
  const BUMPS = {
    'Gravity Overdrive': [0, 0, 0, 0, 0, 0, 0, 1],
    'Final Ascent': [0, 0, 0, 0, 1, 3],
    'Midnight Drift': [1],
    'Cube Extreme Demon': [8],
    'Swing Extreme Demon': [2],
    'Mini Ship Extreme Demon': [2],
    'Mini Robot Extreme Demon': [4],
    'Ship Easy': [2],
    'Ball Extreme Demon': [6],
    'UFO Insane Demon': [1],
    'Wave Extreme Demon': [1],
    'Swing Hard Demon': [1],
    'Mini Cube Normal': [1],
    'Mini Cube Insane': [3],
    'Mini Cube Easy Demon': [1],
    'Mini Cube Insane Demon': [1],
    'Mini Ship Easy Demon': [2],
    'Mini Ship Medium Demon': [2],
    'Mini Ball Extreme Demon': [25],
    'Mini UFO Normal': [1],
    'Mini UFO Insane Demon': [1],
    'Mini Wave Extreme Demon': [5],
    'Mini Robot Hard': [3],
    'Mini Robot Insane': [7],
    'Mini Robot Medium Demon': [1],
    'Mini Robot Hard Demon': [1],
    'Mini Spider Insane': [1],
    'Mini Swing Easy': [1],
    'Mini Swing Normal': [2],
    'Mini Swing Easy Demon': [1],
    'Pulse Circuit': [0, 1],
    'Solar Flux': [0, 1],
    'Neon Abyss': [0, 0, 1],
    'Fingerflash': [0, 0, 0, 0, 0, 0, 1],
    'Last Dash': [0, 0, 0, 0, 1],
    'Cube Hard Demon': [1],
    'Robot Easy': [1],
    'Robot Insane': [1],
    'Robot Medium Demon': [2],
    'Spider Harder': [1],
    'Mini Robot Normal': [3],
    'Mini Robot Easy Demon': [1],
  };

  // Extreme Demon tightness per level (missing = 0.5), also from --fix.
  const TIGHT = {
    'Cube Extreme Demon': 0.75,
    'Ship Extreme Demon': 0.219,
    'Ball Extreme Demon': 0.276,
    'UFO Extreme Demon': 0.032,
    'Wave Extreme Demon': 0.016,
    'Robot Extreme Demon': 0.625,
    'Swing Extreme Demon': 0.25,
    'Mini Cube Extreme Demon': 0.625,
    'Mini Ship Extreme Demon': 0.321,
    'Mini Ball Extreme Demon': 0.563,
    'Mini UFO Extreme Demon': 0.375,
    'Mini Wave Extreme Demon': 0.004,
    'Mini Robot Extreme Demon': 0.625,
    'Mini Spider Extreme Demon': 0.75,
    'Mini Swing Extreme Demon': 0.438,
  };

  // Coin positions per level, written by `node tools/verify.js --coins`.
  const COINS = {
    'Neon Steps': [[171.75, 4], [315.5, 4.5], [459, 2.25]],
    'Pulse Circuit': [[181.25, 0.5], [332.75, 0], [484.25, 8]],
    'Gravity Overdrive': [[244.5, 2], [448.75, 7], [653, 6]],
    'Cyber Hop': [[114.75, 3.75], [210.75, 2.75], [306.75, 0.5]],
    'Midnight Drift': [[153.75, 2], [282.5, 3.25], [411, 6.25]],
    'Bass Reactor': [[173.5, 0], [318.5, 1.75], [463.5, 2]],
    'Hyperwave': [[164.5, 2], [302, 5.75], [439.5, 2.25]],
    'Final Ascent': [[270.75, 5.75], [497, 4.75], [728.5, 0]],
    'Prism Drop': [[160.25, 5], [294.75, 7], [429, 7.25]],
    'Solar Flux': [[192.75, 2.5], [354, 2], [515, 2.25]],
    'Static Storm': [[207.75, 1.75], [379.75, -0.25], [554.75, 5.75]],
    'Neon Abyss': [[261.75, 2.5], [480.25, 5.75], [703.5, 2]],
    'Chaos Theory': [[310.5, 3], [569.75, 0.25], [829, 2]],
    'Fingerflash': [[232.75, 8], [431, 7], [621.75, 1.25]],
    'Last Dash': [[257.5, 0], [474, 1.5], [689.5, 1]],
    'Lockdown': [[376, 6.5], [689.5, 5.5], [1003.25, 1.75]],
    'Cube Easy': [[71, 1.75]],
    'Cube Normal': [[106.25, 4]],
    'Cube Hard': [[75.75, 1]],
    'Cube Harder': [[99.75, 1]],
    'Cube Insane': [[119, 3.25]],
    'Cube Easy Demon': [[124.75, 1.75]],
    'Cube Medium Demon': [[129, 4.5]],
    'Cube Hard Demon': [[165, 1.25]],
    'Cube Insane Demon': [[161.5, 2.5]],
    'Cube Extreme Demon': [[148.25, 1]],
    'Ship Easy': [[84, 2.5]],
    'Ship Normal': [[87.75, 3.25]],
    'Ship Hard': [[82.25, 7.25]],
    'Ship Harder': [[86.5, 6.25]],
    'Ship Insane': [[108.75, 2.5]],
    'Ship Easy Demon': [[108, 2.25]],
    'Ship Medium Demon': [[112.25, 6]],
    'Ship Hard Demon': [[132, 6]],
    'Ship Insane Demon': [[126, 6.25]],
    'Ship Extreme Demon': [[148.75, 7.5]],
    'Ball Easy': [[83.75, 5.75]],
    'Ball Normal': [[83, 0]],
    'Ball Hard': [[88.25, 2]],
    'Ball Harder': [[92.75, 7]],
    'Ball Insane': [[105.25, 6]],
    'Ball Easy Demon': [[113.5, 7]],
    'Ball Medium Demon': [[112, 6.5]],
    'Ball Hard Demon': [[140, 0]],
    'Ball Insane Demon': [[135, 0.25]],
    'Ball Extreme Demon': [[168.75, 2.75]],
    'UFO Easy': [[77.5, 4]],
    'UFO Normal': [[80, 2.5]],
    'UFO Hard': [[74.25, 1.5]],
    'UFO Harder': [[82.25, 2.5]],
    'UFO Insane': [[100.25, 2]],
    'UFO Easy Demon': [[104.5, 4]],
    'UFO Medium Demon': [[116.5, 2.75]],
    'UFO Hard Demon': [[128.5, 3]],
    'UFO Insane Demon': [[123.75, 4.75]],
    'UFO Extreme Demon': [[160.25, 4]],
    'Wave Easy': [[65.5, 4]],
    'Wave Normal': [[65, 4.5]],
    'Wave Hard': [[62, 3.75]],
    'Wave Harder': [[68, 8.5]],
    'Wave Insane': [[78, 7]],
    'Wave Easy Demon': [[77, 6.75]],
    'Wave Medium Demon': [[81, 3]],
    'Wave Hard Demon': [[92.5, 5]],
    'Wave Insane Demon': [[87.75, 8]],
    'Wave Extreme Demon': [[164.5, 8.25]],
    'Robot Easy': [[77, 2]],
    'Robot Normal': [[83, 0.75]],
    'Robot Hard': [[80.5, 2.75]],
    'Robot Harder': [[86.5, 2.25]],
    'Robot Insane': [[98, 2.75]],
    'Robot Easy Demon': [[107.5, 4.75]],
    'Robot Medium Demon': [[102.75, 2.75]],
    'Robot Hard Demon': [[121.25, 1]],
    'Robot Insane Demon': [[105, 2.25]],
    'Robot Extreme Demon': [[93, 2.5]],
    'Spider Easy': [[83.25, 7]],
    'Spider Normal': [[88.5, 7]],
    'Spider Hard': [[86, 7]],
    'Spider Harder': [[92.75, 0]],
    'Spider Insane': [[104.5, 0]],
    'Spider Easy Demon': [[110.25, 0]],
    'Spider Medium Demon': [[115, 0]],
    'Spider Hard Demon': [[135.5, 1.75]],
    'Spider Insane Demon': [[132.75, 0]],
    'Spider Extreme Demon': [[78.25, 7]],
    'Swing Easy': [[88, 3]],
    'Swing Normal': [[86, 3.5]],
    'Swing Hard': [[83, 2]],
    'Swing Harder': [[87, 8.25]],
    'Swing Insane': [[103.25, 2.75]],
    'Swing Easy Demon': [[108, 8.5]],
    'Swing Medium Demon': [[111, 4.5]],
    'Swing Hard Demon': [[129.75, 8]],
    'Swing Insane Demon': [[127.25, 1.5]],
    'Swing Extreme Demon': [[151.25, 6]],
    'Mini Cube Easy': [[70.25, 1]],
    'Mini Cube Normal': [[87.75, 1.75]],
    'Mini Cube Hard': [[93.75, 3.25]],
    'Mini Cube Harder': [[87.75, 1.75]],
    'Mini Cube Insane': [[104, 1]],
    'Mini Cube Easy Demon': [[129.75, 1]],
    'Mini Cube Medium Demon': [[129.25, -0.25]],
    'Mini Cube Hard Demon': [[167.25, -0.25]],
    'Mini Cube Insane Demon': [[167.5, 1]],
    'Mini Cube Extreme Demon': [[146, 1.25]],
    'Mini Ship Easy': [[86.75, 3.25]],
    'Mini Ship Normal': [[89, 1.75]],
    'Mini Ship Hard': [[84, 1.5]],
    'Mini Ship Harder': [[86.5, 5.75]],
    'Mini Ship Insane': [[104.5, 5.5]],
    'Mini Ship Easy Demon': [[106.25, 1]],
    'Mini Ship Medium Demon': [[111, 2]],
    'Mini Ship Hard Demon': [[131.5, 4]],
    'Mini Ship Insane Demon': [[125, 3.75]],
    'Mini Ship Extreme Demon': [[146, 4.75]],
    'Mini Ball Easy': [[83.25, 5.5]],
    'Mini Ball Normal': [[88.5, 5]],
    'Mini Ball Hard': [[83.25, 0]],
    'Mini Ball Harder': [[93.75, 4.75]],
    'Mini Ball Insane': [[101.75, 1.75]],
    'Mini Ball Easy Demon': [[112.25, 2]],
    'Mini Ball Medium Demon': [[111.5, 0]],
    'Mini Ball Hard Demon': [[130.25, 7]],
    'Mini Ball Insane Demon': [[133.25, 5]],
    'Mini Ball Extreme Demon': [[149.75, 0.75]],
    'Mini UFO Easy': [[74.5, 1]],
    'Mini UFO Normal': [[80, 4]],
    'Mini UFO Hard': [[77, 1.5]],
    'Mini UFO Harder': [[79.25, 1.25]],
    'Mini UFO Insane': [[98, 3.5]],
    'Mini UFO Easy Demon': [[105.25, 1]],
    'Mini UFO Medium Demon': [[108, 3.75]],
    'Mini UFO Hard Demon': [[133.25, 3.25]],
    'Mini UFO Insane Demon': [[124.25, 3]],
    'Mini UFO Extreme Demon': [[146, 3]],
    'Mini Wave Easy': [[65.5, 6.75]],
    'Mini Wave Normal': [[71, 4.75]],
    'Mini Wave Hard': [[66, 5.75]],
    'Mini Wave Harder': [[68.5, 1]],
    'Mini Wave Insane': [[81, 6.25]],
    'Mini Wave Easy Demon': [[80, 3]],
    'Mini Wave Medium Demon': [[78, 7.25]],
    'Mini Wave Hard Demon': [[91.25, 1]],
    'Mini Wave Insane Demon': [[89.5, 4.75]],
    'Mini Wave Extreme Demon': [[164.5, 2.25]],
    'Mini Robot Easy': [[78.75, 0]],
    'Mini Robot Normal': [[84.75, 1.75]],
    'Mini Robot Hard': [[83.5, 1.25]],
    'Mini Robot Harder': [[83, 0.75]],
    'Mini Robot Insane': [[104, 1.75]],
    'Mini Robot Easy Demon': [[98.5, 0.5]],
    'Mini Robot Medium Demon': [[99.75, 1.25]],
    'Mini Robot Hard Demon': [[116, -0.25]],
    'Mini Robot Insane Demon': [[100.25, 0.75]],
    'Mini Robot Extreme Demon': [[116, 0.5]],
    'Mini Spider Easy': [[81.75, 7.25]],
    'Mini Spider Normal': [[84.75, 7.25]],
    'Mini Spider Hard': [[85.5, 7.25]],
    'Mini Spider Harder': [[86, -0.25]],
    'Mini Spider Insane': [[105.75, 7.25]],
    'Mini Spider Easy Demon': [[114.75, 0.75]],
    'Mini Spider Medium Demon': [[110, -0.25]],
    'Mini Spider Hard Demon': [[135.75, -0.25]],
    'Mini Spider Insane Demon': [[141.5, 1.25]],
    'Mini Spider Extreme Demon': [[69.75, 7.25]],
    'Mini Swing Easy': [[81, 2.5]],
    'Mini Swing Normal': [[88.25, 1.25]],
    'Mini Swing Hard': [[83, 8]],
    'Mini Swing Harder': [[88.25, 1.75]],
    'Mini Swing Insane': [[104.5, 4]],
    'Mini Swing Easy Demon': [[107.5, 5.75]],
    'Mini Swing Medium Demon': [[112.25, 1.25]],
    'Mini Swing Hard Demon': [[129.75, 0.5]],
    'Mini Swing Insane Demon': [[124.25, 1.75]],
    'Mini Swing Extreme Demon': [[140, 7.75]],
  };

  function buildAll(bumps, tight, coins) {
    return DEFS.map((def) => buildLevel(def, bumps[def.name], tight[def.name], (coins || COINS)[def.name]));
  }

  const LEVELS = buildAll(BUMPS, TIGHT, COINS);
  LEVELS.COINS = COINS;
  LEVELS.TIERS = TIERS;
  LEVELS.BUMPS = BUMPS;
  LEVELS.TIGHT = TIGHT;
  LEVELS.buildAll = buildAll; // used by tools/verify.js --fix
  if (typeof module !== 'undefined' && module.exports) module.exports = LEVELS;
  else root.GDLevels = LEVELS;
})(typeof self !== 'undefined' ? self : this);
