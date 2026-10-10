// Static game data shared by the browser and the node tests (no DOM, no three.js).

// Model metadata baked by the asset pipeline (see models/CREDITS.md). Units are metres,
// +Z is forward, +X is the kart's left, y=0 is the ground under the wheels.
export const BODY_META = {
  standard: { wheels: { fl: [0.65, 0.357, 0.582], fr: [-0.65, 0.357, 0.582], bl: [0.65, 0.357, -0.582], br: [-0.65, 0.357, -0.582] }, wheelR: 0.357, wheelW: 0.357, min: [-0.792, 0.138, -0.992], max: [0.792, 1.144, 1.435], seat: [0, 0.471, -0.084], driverScale: 1, spoiler: [0, 0.78, -0.95], plate: [0, 0.62, 1.3, -0.55], flag: [-0.55, 0.72, -0.75], exhaust: [[0.28, 0.75, -0.9], [-0.28, 0.75, -0.9]] },
  speedster: { wheels: { fl: [0.549, 0.366, 0.927], fr: [-0.549, 0.366, 0.927], bl: [0.549, 0.366, -0.927], br: [-0.549, 0.366, -0.927] }, wheelR: 0.366, wheelW: 0.366, min: [-0.732, 0.244, -1.415], max: [0.732, 1.016, 1.83], seat: [0, 0.38, -0.12], driverScale: 0.78, spoiler: [0, 0.95, -1.3], plate: [0, 0.6, 1.62, -0.35], flag: [-0.5, 0.8, -1.1], exhaust: [[0.22, 0.55, -1.42], [-0.22, 0.55, -1.42]] },
  drifter: { wheels: { fl: [0.61, 0.366, 0.927], fr: [-0.61, 0.366, 0.927], bl: [0.61, 0.366, -0.927], br: [-0.61, 0.366, -0.927] }, wheelR: 0.366, wheelW: 0.366, min: [-0.732, 0.122, -1.415], max: [0.732, 0.894, 1.708], seat: [0, 0.3, -0.18], driverScale: 0.78, spoiler: [0, 1.0, -1.3], plate: [0, 0.5, 1.5, -0.3], flag: [-0.5, 0.75, -1.1], exhaust: [[0.18, 0.45, -1.4], [-0.18, 0.45, -1.4]] },
  heavy: { wheels: { fl: [0.616, 0.336, 0.848], fr: [-0.616, 0.336, 0.848], bl: [0.616, 0.336, -0.848], br: [-0.616, 0.336, -0.848] }, wheelR: 0.336, wheelW: 0.336, min: [-0.84, 0.336, -1.68], max: [0.84, 1.736, 1.456], seat: [0.32, 0.5, 0.05], driverScale: 0.52, spoiler: [0, 1.45, -1.55], plate: [0, 1.0, 1.47, -0.1], flag: [-0.7, 1.45, -1.4], exhaust: [[0.5, 0.6, -1.6], [-0.5, 0.6, -1.6]] },
  rally: { wheels: { fl: [0.493, 0.348, 0.94], fr: [-0.493, 0.348, 0.94], bl: [0.493, 0.348, -0.94], br: [-0.493, 0.348, -0.94] }, wheelR: 0.348, wheelW: 0.406, min: [-0.754, 0.174, -1.682], max: [0.754, 1.276, 1.624], seat: [0.28, 0.3, -0.1], driverScale: 0.48, spoiler: [0, 1.25, -1.5], plate: [0, 0.75, 1.63, -0.1], flag: [-0.6, 1.25, -1.2], exhaust: [[0.4, 0.38, -1.66], [-0.4, 0.38, -1.66]] },
};
export const WHEEL_META = { sport: { halfW: 0.667 }, classic: { halfW: 0.667 }, stealth: { halfW: 0.667 }, offroad: { halfW: 0.5 } };

// Stats are 1..5 for the bars. Physics derives from them in physics.js.
export const KART_TYPES = [
  { id: 'standard', name: 'Standard', blurb: 'A classic go-kart. Good at everything.', stats: { speed: 3, accel: 3, handling: 3, weight: 3 }, offroad: 1, drift: 1, radius: 1.05, mass: 1.0,
    defaults: { body: '#e8473c', accent: '#f5f2ea', wheel: 'sport' } },
  { id: 'speedster', name: 'Speedster', blurb: 'Futuristic racer. Huge top speed, slow off the line.', stats: { speed: 4.55, accel: 2, handling: 2.5, weight: 3 }, offroad: 0.95, drift: 0.95, radius: 1.1, mass: 1.05,
    defaults: { body: '#3f7cf0', accent: '#d8dde8', wheel: 'sport' } },
  { id: 'drifter', name: 'Drifter', blurb: 'Open-wheel racer that loves to slide. Charges mini-turbos fast.', stats: { speed: 3.3, accel: 3.5, handling: 5, weight: 2 }, offroad: 0.9, drift: 1.3, radius: 1.05, mass: 0.85,
    defaults: { body: '#f2a01c', accent: '#2b2d3a', wheel: 'sport' } },
  { id: 'heavy', name: 'Heavy', blurb: 'Monster truck. Shoves everyone around and shrugs off hits.', stats: { speed: 3.95, accel: 1.6, handling: 2, weight: 5 }, offroad: 1.15, drift: 0.85, radius: 1.25, mass: 1.6,
    defaults: { body: '#ffc93c', accent: '#7d82a0', wheel: 'offroad' } },
  { id: 'rally', name: 'Rally', blurb: 'Hot hatch with rally tyres. Quick to accelerate and barely slowed by dirt.', stats: { speed: 2.8, accel: 5, handling: 4, weight: 2.5 }, offroad: 1.45, drift: 1.05, radius: 1.1, mass: 0.95,
    defaults: { body: '#2a9d74', accent: '#e9ecf2', wheel: 'classic' } },
];
export const KART_BY_ID = Object.fromEntries(KART_TYPES.map(k => [k.id, k]));

export const DRIVERS = [
  { id: 'oobi', name: 'Oobi', color: '#8f7ae0' },
  { id: 'oodi', name: 'Oodi', color: '#e0738f' },
  { id: 'ooli', name: 'Ooli', color: '#e3a83e' },
  { id: 'oopi', name: 'Oopi', color: '#3f9a8a' },
  { id: 'oozi', name: 'Oozi', color: '#c79d8b' },
];
export const WHEELS = [
  { id: 'sport', name: 'Sport' },
  { id: 'classic', name: 'Classic' },
  { id: 'stealth', name: 'Stealth' },
  { id: 'offroad', name: 'Off-road' },
];
export const PALETTE = ['#e8473c', '#ff7a2f', '#ffc93c', '#9bd13b', '#2a9d74', '#2bc4d8', '#3f7cf0', '#7b5cf0', '#d14fd6', '#ff6fa8', '#f5f2ea', '#9aa0b4', '#4a4e60', '#20222c', '#8a5a3c', '#e2c49a'];

export const HEX_RE = /^#[0-9a-f]{6}$/i;
export function defaultConfig(type = 'standard') {
  const k = KART_BY_ID[type] || KART_TYPES[0];
  return { type: k.id, body: k.defaults.body, accent: k.defaults.accent, wheel: k.defaults.wheel, driver: 'oobi', suit: '#8f7ae0', helmet: '#f4f4fa', num: 7, spoiler: false, flag: false };
}
// Validate a kart config from storage or the network; anything wrong falls back to a default.
export function cleanConfig(c) {
  const d = defaultConfig(c && KART_BY_ID[c.type] ? c.type : 'standard');
  if (!c || typeof c !== 'object') return d;
  const col = (v, f) => (typeof v === 'string' && HEX_RE.test(v) ? v.toLowerCase() : f);
  return {
    type: d.type,
    body: col(c.body, d.body), accent: col(c.accent, d.accent),
    wheel: WHEELS.some(w => w.id === c.wheel) ? c.wheel : d.wheel,
    driver: DRIVERS.some(w => w.id === c.driver) ? c.driver : d.driver,
    suit: col(c.suit, d.suit), helmet: col(c.helmet, d.helmet),
    num: Number.isInteger(c.num) && c.num >= 0 && c.num <= 99 ? c.num : d.num,
    spoiler: !!c.spoiler, flag: !!c.flag,
  };
}

export const ITEMS = ['boost', 'banana', 'shell', 'shield'];
export const ITEM_NAMES = { boost: 'Turbo', banana: 'Banana', shell: 'Bouncer', shield: 'Shield' };
// Rubber-banded odds by race position fraction (0 = leader, 1 = last).
export function itemOdds(frac) {
  const lead = { boost: 0.06, banana: 0.46, shell: 0.22, shield: 0.26 };
  const mid = { boost: 0.27, banana: 0.25, shell: 0.33, shield: 0.15 };
  const last = { boost: 0.52, banana: 0.04, shell: 0.36, shield: 0.08 };
  const out = {};
  for (const k of ITEMS) out[k] = frac < 0.5 ? lead[k] + (mid[k] - lead[k]) * (frac / 0.5) : mid[k] + (last[k] - mid[k]) * ((frac - 0.5) / 0.5);
  return out;
}
export function rollItem(frac, rnd = Math.random) {
  const o = itemOdds(frac);
  let r = rnd(), acc = 0;
  for (const k of ITEMS) { acc += o[k]; if (r < acc) return k; }
  return 'boost';
}

export const GP_POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
export const DIFFICULTY = {
  easy: { name: 'Easy', speed: 0.86, skill: 0.55, items: 0.5, rubber: 0.10 },
  normal: { name: 'Normal', speed: 0.95, skill: 0.8, items: 0.8, rubber: 0.08 },
  hard: { name: 'Hard', speed: 1.02, skill: 1.0, items: 1.0, rubber: 0.05 },
};
export const BOT_NAMES = ['Zip', 'Nova', 'Bolt', 'Pepper', 'Rocket', 'Moxie', 'Turbo', 'Pixel', 'Comet', 'Sprocket', 'Blitz', 'Juno'];

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
export function fmtTime(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '--:--.---';
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), x = Math.floor(ms % 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(x).padStart(3, '0')}`;
}
// Small deterministic PRNG (mulberry32) so tracks, scenery and bot traits come out the same everywhere.
export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
