// Economy: buildings, upgrades, achievements, prices, cookies per second. Pure functions over a
// plain state object, so the tests can run it in Node and saving is just JSON.

const NAMES = ['', ' thousand', ' million', ' billion', ' trillion', ' quadrillion', ' quintillion', ' sextillion', ' septillion', ' octillion', ' nonillion', ' decillion'];

export const BUILDINGS = [
  { id: 'cursor', name: 'Cursor', icon: '👆', cost: 15, cps: 0.1, desc: 'Autoclicks once every 10 seconds.' },
  { id: 'grandma', name: 'Grandma', icon: '👵', cost: 100, cps: 1, desc: 'A nice grandma to bake more cookies.' },
  { id: 'farm', name: 'Farm', icon: '🌾', cost: 1100, cps: 8, desc: 'Grows cookie plants from cookie seeds.' },
  { id: 'mine', name: 'Mine', icon: '⛏️', cost: 12000, cps: 47, desc: 'Mines out cookie dough and chocolate chips.' },
  { id: 'factory', name: 'Factory', icon: '🏭', cost: 130000, cps: 260, desc: 'Produces large quantities of cookies.' },
  { id: 'bank', name: 'Bank', icon: '🏦', cost: 1.4e6, cps: 1400, desc: 'Generates cookies from interest.' },
  { id: 'temple', name: 'Temple', icon: '🛕', cost: 2e7, cps: 7800, desc: 'Full of precious, ancient chocolate.' },
  { id: 'wizard', name: 'Wizard Tower', icon: '🧙', cost: 3.3e8, cps: 44000, desc: 'Summons cookies with magic spells.' },
  { id: 'shipment', name: 'Shipment', icon: '🚀', cost: 5.1e9, cps: 260000, desc: 'Brings in fresh cookies from the cookie planet.' },
  { id: 'alchemy', name: 'Alchemy Lab', icon: '⚗️', cost: 7.5e10, cps: 1.6e6, desc: 'Turns gold into cookies!' },
  { id: 'portal', name: 'Portal', icon: '🌀', cost: 1e12, cps: 1e7, desc: 'Opens a door to the Cookieverse.' },
  { id: 'time', name: 'Time Machine', icon: '⏳', cost: 1.4e13, cps: 6.5e7, desc: 'Brings cookies from the past, before they were even eaten.' },
];
export const BUILDING = Object.fromEntries(BUILDINGS.map(b => [b.id, b]));
export const PRICE_GROWTH = 1.15;

// Each building gets four doubling upgrades, unlocked by owning 1 / 5 / 25 / 50 of it.
const TIER_NAMES = {
  cursor: ['Reinforced index finger', 'Carpal tunnel prevention cream', 'Ambidextrous', 'Thousand fingers'],
  grandma: ['Forwards from grandma', 'Steel-plated rolling pins', 'Lubricated dentures', 'Prune juice'],
  farm: ['Cheap hoes', 'Fertilizer', 'Cookie trees', 'Genetically-modified cookies'],
  mine: ['Sugar gas', 'Megadrill', 'Ultradrill', 'Ultimadrill'],
  factory: ['Sturdier conveyor belts', 'Child labor', 'Sweatshop', 'Radium reactors'],
  bank: ['Taller tellers', 'Scissor-resistant credit cards', 'Acid-proof vaults', 'Chocolate coins'],
  temple: ['Golden idols', 'Sacrifices', 'Delicious blessing', 'Sun festival'],
  wizard: ['Pointier hats', 'Beardlier beards', 'Ancient grimoires', 'Kitchen curses'],
  shipment: ['Vanilla nebulae', 'Wormholes', 'Frequent flyer', 'Warp drive'],
  alchemy: ['Antimony', 'Essence of dough', 'True chocolate', 'Ambrosia'],
  portal: ['Ancient tablet', 'Insane oatling workers', 'Soul bond', 'Sanity dance'],
  time: ['Flux capacitors', 'Time paradox resolver', 'Quantum conundrum', 'Causality enforcer'],
};
const TIERS = [[1, 10], [5, 50], [25, 500], [50, 5e4]];
export const UPGRADES = [];
for (const b of BUILDINGS) TIERS.forEach(([need, mult], t) => UPGRADES.push({
  id: `${b.id}${t}`, name: TIER_NAMES[b.id][t], icon: b.icon, building: b.id, need, cost: b.cost * mult,
  desc: b.id === 'cursor' ? 'The mouse and cursors are twice as efficient.' : `${b.name}s are twice as efficient.`,
}));
// Clicking upgrades: each click also earns 1% of your cookies per second.
for (const [i, [name, need]] of [['Plastic mouse', 1000], ['Iron mouse', 1e5], ['Titanium mouse', 1e7], ['Adamantium mouse', 1e9], ['Unobtainium mouse', 1e11]].entries())
  UPGRADES.push({ id: `mouse${i}`, name, icon: '🖱️', handmade: need, cost: need * 5 * Math.pow(10, i), desc: 'Clicking gains +1% of your CpS.' });
// Cookie flavours: +5% / +10% production each.
for (const [i, [name, need, pct]] of [['Chocolate chip cookies', 1e4, 5], ['Oatmeal raisin cookies', 1e6, 5], ['Peanut butter cookies', 1e8, 10], ['Macadamia nut cookies', 1e10, 10], ['Double-chip cookies', 1e12, 10]].entries())
  UPGRADES.push({ id: `flavour${i}`, name, icon: '🍪', baked: need, cost: need * 10, pct, desc: `Cookie production multiplier +${pct}%.` });
export const UPGRADE = Object.fromEntries(UPGRADES.map(u => [u.id, u]));

export const ACHIEVEMENTS = [
  ...[[1, 'Wake and bake'], [1000, 'Making some dough'], [1e5, 'So baked right now'], [1e6, 'Fledgling bakery'], [1e8, 'Affluent bakery'], [1e10, 'World-famous bakery'], [1e12, 'Cosmic bakery'], [1e14, 'Galactic bakery']]
    .map(([n, name]) => ({ id: 'baked' + n, name, desc: `Bake ${format(n)} cookie${n === 1 ? '' : 's'} in total.`, test: s => s.baked >= n })),
  ...[[1, 'Casual cookie clicker'], [100, 'Clicktastic'], [1000, 'Clickathlon'], [10000, 'Clickolympics']]
    .map(([n, name]) => ({ id: 'clicks' + n, name, desc: `Click the cookie ${format(n)} time${n === 1 ? '' : 's'}.`, test: s => s.clicks >= n })),
  ...[[1, 'Production'], [10, 'Manufacturing'], [50, 'Industrial'], [100, 'Conglomerate']]
    .map(([n, name]) => ({ id: 'cps' + n, name, desc: `Bake ${format(n)} cookies per second.`, test: s => cps(s) >= n })),
  ...BUILDINGS.map(b => ({ id: 'own' + b.id, name: `${b.name} owner`, desc: `Own 10 ${b.name.toLowerCase()}s.`, test: s => (s.owned[b.id] || 0) >= 10 })),
  { id: 'golden1', name: 'Golden cookie', desc: 'Click a golden cookie.', test: s => s.goldens >= 1 },
  { id: 'golden7', name: 'Lucky streak', desc: 'Click 7 golden cookies.', test: s => s.goldens >= 7 },
];

export function newState(now = Date.now()) {
  return { cookies: 0, baked: 0, handmade: 0, clicks: 0, goldens: 0, owned: {}, upgrades: [], achievements: [], frenzyUntil: 0, clickFrenzyUntil: 0, started: now, saved: now };
}

// Cost of the next `amount` buildings with `owned` already bought.
export function price(id, owned, amount = 1) {
  const base = BUILDING[id].cost;
  return Math.ceil(base * Math.pow(PRICE_GROWTH, owned) * (Math.pow(PRICE_GROWTH, amount) - 1) / (PRICE_GROWTH - 1));
}

const has = (s, id) => s.upgrades.includes(id);
export function buildingMult(s, id) { let m = 1; for (let t = 0; t < 4; t++) if (has(s, id + t)) m *= 2; return m; }
export function buildingCps(s, id) { return BUILDING[id].cps * buildingMult(s, id) * globalMult(s); }
export function globalMult(s) {
  let pct = 0; for (const u of UPGRADES) if (u.pct && has(s, u.id)) pct += u.pct;
  return (1 + pct / 100) * (1 + s.achievements.length * 0.01); // each achievement: +1%
}
export function baseCps(s) { let c = 0; for (const b of BUILDINGS) c += (s.owned[b.id] || 0) * buildingCps(s, b.id); return c; }
export function cps(s, now = 0) { return baseCps(s) * (now && s.frenzyUntil > now ? 7 : 1); }
export function clickValue(s, now = 0) {
  let v = buildingMult(s, 'cursor');
  for (let i = 0; i < 5; i++) if (has(s, 'mouse' + i)) v += baseCps(s) * 0.01;
  if (now && s.clickFrenzyUntil > now) v *= 777;
  if (now && s.frenzyUntil > now) v *= 7;
  return v;
}

export function earn(s, n) { s.cookies += n; s.baked += n; }
export function click(s, now = 0) { const v = clickValue(s, now); earn(s, v); s.handmade += v; s.clicks++; return v; }
export function tick(s, dt, now = 0) { const v = cps(s, now) * dt; earn(s, v); return v; }

export function buy(s, id, amount = 1) {
  const owned = s.owned[id] || 0, cost = price(id, owned, amount);
  if (s.cookies < cost) return false;
  s.cookies -= cost; s.owned[id] = owned + amount; return true;
}
// Largest affordable amount up to `max` (for "buy max" and the store's greyed-out state).
export function affordable(s, id, max = 100) {
  let n = 0; while (n < max && price(id, s.owned[id] || 0, n + 1) <= s.cookies) n++; return n;
}

export function upgradeUnlocked(s, u) {
  if (has(s, u.id)) return false;
  if (u.building) return (s.owned[u.building] || 0) >= u.need;
  if (u.handmade) return s.handmade >= u.handmade;
  if (u.baked) return s.baked >= u.baked;
  return false;
}
export function availableUpgrades(s) { return UPGRADES.filter(u => upgradeUnlocked(s, u)).sort((a, b) => a.cost - b.cost); }
export function buyUpgrade(s, id) {
  const u = UPGRADE[id];
  if (!u || !upgradeUnlocked(s, u) || s.cookies < u.cost) return false;
  s.cookies -= u.cost; s.upgrades.push(id); return true;
}

// Newly earned achievements (and records them).
export function checkAchievements(s) {
  const got = [];
  for (const a of ACHIEVEMENTS) if (!s.achievements.includes(a.id) && a.test(s)) { s.achievements.push(a.id); got.push(a); }
  return got;
}

// Golden cookie effects. rnd picks which one.
export function golden(s, now, rnd = Math.random) {
  s.goldens++;
  const r = rnd();
  if (r < 0.45) {
    const gain = Math.min(s.cookies * 0.15, cps(s) * 900) + 13;
    earn(s, gain); return { kind: 'lucky', gain };
  }
  if (r < 0.85) { s.frenzyUntil = now + 77000; return { kind: 'frenzy', seconds: 77 }; }
  s.clickFrenzyUntil = now + 13000; return { kind: 'clickfrenzy', seconds: 13 };
}

// Cookies baked while the page was closed: full production for up to 24 hours (no frenzies).
export function offline(s, now) {
  const secs = Math.max(0, Math.min((now - (Number.isFinite(s.saved) ? s.saved : now)) / 1000, 86400));
  const gain = baseCps(s) * secs; earn(s, gain); s.saved = now;
  return { secs, gain };
}

export function format(n, decimals = 0) {
  if (!isFinite(n)) return '∞';
  if (n < 1e6) {
    if (decimals && n < 100 && n % 1) return n.toFixed(1);
    return Math.floor(n).toLocaleString('en-US');
  }
  const k = Math.min(NAMES.length - 1, Math.floor(Math.log10(n) / 3));
  return (n / Math.pow(1000, k)).toFixed(3).replace(/\.?0+$/, '') + NAMES[k];
}

export function load(json) {
  const s = Object.assign(newState(), json || {});
  s.owned = Object.assign({}, s.owned); s.upgrades = (s.upgrades || []).filter(id => UPGRADE[id]); s.achievements = (s.achievements || []).filter(id => ACHIEVEMENTS.some(a => a.id === id));
  for (const k of ['cookies', 'baked', 'handmade', 'clicks', 'goldens']) if (!isFinite(s[k]) || s[k] < 0) s[k] = 0;
  return s;
}
