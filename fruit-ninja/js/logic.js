// Rules for Fruit Ninja: what gets thrown, how it flies, what a swipe cuts, scoring, combos,
// lives and the clock. Pure functions over plain objects, so the tests run it in Node.
// World units are CSS pixels; y grows downward.

export const GRAVITY = 1250;               // px / s^2
export const FRUITS = {
  apple:      { r: 34, skin: '#d62d2d', skin2: '#8f1414', flesh: '#fff3c8', juice: '#ffe7a0', leaf: true },
  orange:     { r: 36, skin: '#ff9a1f', skin2: '#c25e00', flesh: '#ffb84d', juice: '#ffae3a' },
  lemon:      { r: 30, skin: '#ffe23a', skin2: '#c9a800', flesh: '#fff6a8', juice: '#fff07a', oval: 1.25 },
  watermelon: { r: 52, skin: '#2e9b3a', skin2: '#13521b', flesh: '#ff3b4f', juice: '#ff4f63', stripes: true, seeds: true },
  kiwi:       { r: 28, skin: '#8a6332', skin2: '#5a3d1a', flesh: '#7ed23a', juice: '#a6e65a', seeds: true },
  plum:       { r: 29, skin: '#7a2a8f', skin2: '#3f0f4f', flesh: '#ffd25a', juice: '#c94fe0' },
  peach:      { r: 34, skin: '#ffa07a', skin2: '#e0603a', flesh: '#ffd28a', juice: '#ffc070', leaf: true },
  pineapple:  { r: 40, skin: '#e6a92a', skin2: '#9a6a10', flesh: '#ffe36a', juice: '#ffe14a', oval: 0.78, crown: true },
  coconut:    { r: 36, skin: '#6b4a2a', skin2: '#3a2614', flesh: '#fbfaf2', juice: '#ffffff' },
  strawberry: { r: 27, skin: '#e8233a', skin2: '#99101f', flesh: '#ff7a8a', juice: '#ff3550', leaf: true, seeds: true },
};
export const FRUIT_KINDS = Object.keys(FRUITS);
export const MODES = {
  classic: { name: 'Classic', lives: 3, bombs: true, time: 0 },
  arcade: { name: 'Arcade', lives: 0, bombs: true, time: 60, bananas: true },
  zen: { name: 'Zen', lives: 0, bombs: false, time: 90 },
};

// Does the segment (x1,y1)-(x2,y2) pass within r of (cx,cy)?
export function segmentHits(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  let t = len2 ? ((cx - x1) * dx + (cy - y1) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx - cx, py = y1 + t * dy - cy;
  return px * px + py * py <= r * r;
}

export function newGame(mode = 'classic', w = 800, h = 600, rnd = Math.random) {
  return { mode, w, h, rnd, t: 0, score: 0, lives: MODES[mode].lives, missed: 0, timeLeft: MODES[mode].time, over: false, why: '',
    things: [], halves: [], nextWave: 0.8, wave: 0, seq: 0, combo: null, frenzy: 0, freeze: 0, events: [], best: 0 };
}

// Launch velocity so a thing thrown from x at the bottom peaks around peakY and drifts towards the middle.
function launch(g, x, peakFrac) {
  const peakY = g.h * peakFrac;
  const vy = -Math.sqrt(2 * GRAVITY * (g.h + 40 - peakY));
  const flight = -2 * vy / GRAVITY;
  const vx = ((g.w * (0.3 + g.rnd() * 0.4)) - x) / flight;
  return { vx, vy };
}

export function spawnWave(g) {
  const m = MODES[g.mode], d = Math.min(1, g.t / 90);
  g.wave++;
  const n = g.frenzy > 0 ? 6 + Math.floor(g.rnd() * 4) : 1 + Math.floor(g.rnd() * (2 + d * 4));
  const salvo = g.rnd() < 0.25 + d * 0.2;   // all at once, or one after another
  for (let i = 0; i < n; i++) {
    const x = g.w * (0.12 + g.rnd() * 0.76);
    const { vx, vy } = launch(g, x, 0.12 + g.rnd() * 0.3);
    let kind = FRUIT_KINDS[Math.floor(g.rnd() * FRUIT_KINDS.length)];
    if (m.bombs && g.frenzy <= 0 && g.t > 4 && g.rnd() < 0.08 + d * 0.1) kind = 'bomb';
    if (m.bananas && g.rnd() < 0.05) kind = g.rnd() < 0.5 ? 'frenzy' : 'freeze';
    const r = kind === 'bomb' ? 32 : kind === 'frenzy' || kind === 'freeze' ? 34 : FRUITS[kind].r;
    g.things.push({ id: ++g.seq, kind, x, y: g.h + r + 10, vx, vy, r, rot: g.rnd() * 6, spin: (g.rnd() - 0.5) * 6, delay: salvo ? 0 : i * (0.12 + g.rnd() * 0.25), cut: false });
  }
  g.nextWave = (salvo ? 1.6 : 1.2 + n * 0.22) * (1.15 - d * 0.45) * (g.frenzy > 0 ? 0.5 : 1);
}

// Advance by dt seconds. Returns nothing; anything interesting is pushed onto g.events.
export function step(g, dt) {
  if (g.over) return;
  const slow = g.freeze > 0 ? 0.35 : 1, sdt = dt * slow;
  g.t += dt;
  if (g.frenzy > 0) g.frenzy -= dt;
  if (g.freeze > 0) g.freeze -= dt;
  if (MODES[g.mode].time) {
    g.timeLeft = Math.max(0, g.timeLeft - dt);
    if (g.timeLeft <= 0 && !g.things.some(t => !t.cut && t.y < g.h + t.r)) return end(g, 'time');
  }
  g.nextWave -= sdt;
  if (g.nextWave <= 0 && !(MODES[g.mode].time && g.timeLeft <= 0)) spawnWave(g);
  for (const t of g.things) {
    if (t.delay > 0) { t.delay -= sdt; continue; }
    t.vy += GRAVITY * sdt; t.x += t.vx * sdt; t.y += t.vy * sdt; t.rot += t.spin * sdt;
  }
  for (const h of g.halves) { h.vy += GRAVITY * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.spin * dt; }
  g.halves = g.halves.filter(h => h.y < g.h + 120);
  // fruit that falls back off the bottom uncut is a miss in Classic
  const gone = g.things.filter(t => t.delay <= 0 && t.vy > 0 && t.y > g.h + t.r + 20);
  for (const t of gone) {
    if (!t.cut && FRUITS[t.kind] && g.mode === 'classic') {
      g.missed++; g.lives--; g.events.push({ type: 'miss', x: t.x });
      if (g.lives <= 0) end(g, 'missed');
    }
  }
  g.things = g.things.filter(t => !gone.includes(t));
  // a combo closes once the swipe has gone 0.3 s without a new fruit
  if (g.combo && g.t - g.combo.last > 0.3) {
    if (g.combo.n >= 3) { g.score += g.combo.n; g.events.push({ type: 'combo', n: g.combo.n, x: g.combo.x, y: g.combo.y }); }
    g.combo = null;
  }
}

function end(g, why) { if (!g.over) { g.over = true; g.why = why; g.events.push({ type: 'over', why }); } }

// Apply a blade movement from (x1,y1) to (x2,y2). Returns how many things were cut.
export function slice(g, x1, y1, x2, y2) {
  if (g.over) return 0;
  let n = 0;
  for (const t of g.things) {
    if (t.cut || t.delay > 0 || !segmentHits(x1, y1, x2, y2, t.x, t.y, t.r)) continue;
    t.cut = true; n++;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    if (t.kind === 'bomb') {
      g.events.push({ type: 'bomb', x: t.x, y: t.y });
      if (g.mode === 'classic') end(g, 'bomb');
      else { g.score = Math.max(0, g.score - 10); }
      continue;
    }
    if (t.kind === 'frenzy') { g.frenzy = 6; g.events.push({ type: 'power', kind: 'frenzy', x: t.x, y: t.y }); }
    if (t.kind === 'freeze') { g.freeze = 5; g.events.push({ type: 'power', kind: 'freeze', x: t.x, y: t.y }); }
    const pts = g.frenzy > 0 && t.kind !== 'frenzy' ? 2 : 1;
    g.score += pts;
    g.events.push({ type: 'cut', kind: t.kind, x: t.x, y: t.y, ang, r: t.r, pts });
    // two halves fly apart across the cut
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    for (const s of [-1, 1]) g.halves.push({ kind: t.kind, x: t.x, y: t.y, vx: t.vx * 0.5 + nx * s * 140, vy: Math.min(t.vy, 0) * 0.3 + ny * s * 140 - 60, rot: ang, spin: s * 3, side: s, r: t.r });
    if (!g.combo) g.combo = { n: 0, last: 0, x: t.x, y: t.y };
    g.combo.n++; g.combo.last = g.t; g.combo.x = t.x; g.combo.y = t.y;
  }
  g.things = g.things.filter(t => !t.cut);
  return n;
}

export function takeEvents(g) { const e = g.events; g.events = []; return e; }
