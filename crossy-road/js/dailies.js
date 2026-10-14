// Daily challenges: the catalogue of 100 missions, the global UTC rotation (one Easy, one Medium and
// one Hard a day) and the progress rules. Pure data and functions, shared by the game in the browser
// (live progress while you play) and the server's replay worker (the progress that actually counts),
// so there is exactly one definition of every mission.
//
// Progress is measured from validated runs of the current UTC day. A "run stats" object is what
// logic.js replayRun() produces: { score, ordCoins, gems, fwd, side, back, roads, rails, rivers, logs,
// noBackRow, sideAt: { 10: n, 20: n, ... } }.

export const BASE_REWARD = { easy: 10, medium: 25, hard: 50 };
export const RARITY_BONUS = { standard: 0, rare: 5, epic: 15, legendary: 30 };
export const MIN_VALID_SCORE = 3;   // a run must get at least this far to count at all (no farming instant restarts)
export const DAY_MS = 86400000;

// kinds:
//   row      { n }               reach row n in one run
//   sum      { stat, n }         total of a stat over the day's runs
//   best     { stat, n }         a stat in a single run
//   runs     { stat, min, n }    n separate runs where the stat was at least min
//   noBack   { n }               reach row n without ever hopping backward
//   fewSide  { row, max }        reach row `row` with at most `max` sideways hops
const E = 'easy', M = 'medium', H = 'hard';
const S = 'standard', R = 'rare', P = 'epic', L = 'legendary';
const def = (id, tier, rarity, name, desc, kind, params) => ({ id, tier, rarity, name, desc, kind, ...params });

export const DAILIES = [
  // ---------------------------------------------------------------- EASY (35)
  def('E01', E, S, 'First Steps', 'Reach row 10 in one run', 'row', { n: 10 }),
  def('E02', E, S, 'Little Explorer', 'Reach row 15 in one run', 'row', { n: 15 }),
  def('E03', E, S, 'Getting Somewhere', 'Reach row 20 in one run', 'row', { n: 20 }),
  def('E04', E, S, 'Confident Chicken', 'Reach row 25 in one run', 'row', { n: 25 }),
  def('E05', E, S, 'First Coin', 'Collect 1 coin', 'sum', { stat: 'ordCoins', n: 1 }),
  def('E06', E, S, 'Pocket Change', 'Collect 2 coins', 'sum', { stat: 'ordCoins', n: 2 }),
  def('E07', E, S, 'Coin Collector', 'Collect 3 coins', 'sum', { stat: 'ordCoins', n: 3 }),
  def('E08', E, S, 'Hop Along', 'Hop forward 15 times', 'sum', { stat: 'fwd', n: 15 }),
  def('E09', E, S, 'Keep Hopping', 'Hop forward 30 times', 'sum', { stat: 'fwd', n: 30 }),
  def('E10', E, S, 'Side Stepper', 'Hop left or right 10 times', 'sum', { stat: 'side', n: 10 }),
  def('E11', E, S, 'Sideways Shuffle', 'Hop left or right 20 times', 'sum', { stat: 'side', n: 20 }),
  def('E12', E, S, 'Reverse Gear', 'Hop backward 3 times', 'sum', { stat: 'back', n: 3 }),
  def('E13', E, S, 'Backtrack', 'Hop backward 5 times', 'sum', { stat: 'back', n: 5 }),
  def('E14', E, S, 'Road Rookie', 'Cross 2 road lanes', 'sum', { stat: 'roads', n: 2 }),
  def('E15', E, S, 'Traffic Trainee', 'Cross 4 road lanes', 'sum', { stat: 'roads', n: 4 }),
  def('E16', E, S, 'Double Start', 'Reach row 10 in two separate runs', 'runs', { stat: 'score', min: 10, n: 2 }),
  def('E17', E, S, 'Two Good Attempts', 'Finish two runs scoring at least 10', 'runs', { stat: 'score', min: 10, n: 2 }),
  def('E18', E, S, 'Three Adventures', 'Finish three runs reaching row 8', 'runs', { stat: 'score', min: 8, n: 3 }),
  def('E19', E, R, 'Extra Change', 'Collect 4 coins', 'sum', { stat: 'ordCoins', n: 4 }),
  def('E20', E, R, 'Small Fortune', 'Collect 5 coins', 'sum', { stat: 'ordCoins', n: 5 }),
  def('E21', E, R, 'Forward Momentum', 'Hop forward 60 times', 'sum', { stat: 'fwd', n: 60 }),
  def('E22', E, R, 'Lateral Legend', 'Hop left or right 35 times', 'sum', { stat: 'side', n: 35 }),
  def('E23', E, R, 'Road Wanderer', 'Cross 8 road lanes', 'sum', { stat: 'roads', n: 8 }),
  def('E24', E, R, 'First River', 'Cross a river', 'sum', { stat: 'rivers', n: 1 }),
  def('E25', E, R, 'River Rambler', 'Cross 2 rivers', 'sum', { stat: 'rivers', n: 2 }),
  def('E26', E, R, 'Railway Rookie', 'Cross a train track', 'sum', { stat: 'rails', n: 1 }),
  def('E27', E, R, 'Track Trekker', 'Cross 2 train tracks', 'sum', { stat: 'rails', n: 2 }),
  def('E28', E, R, 'Log Hopper', 'Land on 2 moving logs', 'sum', { stat: 'logs', n: 2 }),
  def('E29', E, P, 'Thirty Strong', 'Reach row 30 in one run', 'row', { n: 30 }),
  def('E30', E, P, 'Thirty-Five Club', 'Reach row 35 in one run', 'row', { n: 35 }),
  def('E31', E, P, 'Consistent Collector', 'Collect a coin in three separate runs', 'runs', { stat: 'ordCoins', min: 1, n: 3 }),
  def('E32', E, P, 'Forty Forward', 'Reach row 40 in one run', 'row', { n: 40 }),
  def('E33', E, P, 'Distance Addict', 'Score 100 rows in total today', 'sum', { stat: 'score', n: 100 }),
  def('E34', E, L, 'Twin Travellers', 'Finish two runs scoring at least 25', 'runs', { stat: 'score', min: 25, n: 2 }),
  def('E35', E, L, 'Triple Threat', 'Finish three runs scoring at least 20', 'runs', { stat: 'score', min: 20, n: 3 }),
  // ---------------------------------------------------------------- MEDIUM (35)
  def('M01', M, S, 'Half Century', 'Reach row 50 in one run', 'row', { n: 50 }),
  def('M02', M, S, 'Fifty-Five', 'Reach row 55 in one run', 'row', { n: 55 }),
  def('M03', M, S, 'Sixty Club', 'Reach row 60 in one run', 'row', { n: 60 }),
  def('M04', M, S, 'Sixty-Five', 'Reach row 65 in one run', 'row', { n: 65 }),
  def('M05', M, S, 'Seventy Steps', 'Reach row 70 in one run', 'row', { n: 70 }),
  def('M06', M, S, 'Seventy-Five', 'Reach row 75 in one run', 'row', { n: 75 }),
  def('M07', M, S, 'Money Bags', 'Collect 10 coins', 'sum', { stat: 'ordCoins', n: 10 }),
  def('M08', M, S, 'Treasure Hunter', 'Collect 15 coins', 'sum', { stat: 'ordCoins', n: 15 }),
  def('M09', M, S, 'Busy Highway', 'Cross 20 road lanes', 'sum', { stat: 'roads', n: 20 }),
  def('M10', M, S, 'Road Expert', 'Cross 25 road lanes', 'sum', { stat: 'roads', n: 25 }),
  def('M11', M, S, 'River Explorer', 'Cross 5 rivers', 'sum', { stat: 'rivers', n: 5 }),
  def('M12', M, S, 'Rail Wanderer', 'Cross 4 train tracks', 'sum', { stat: 'rails', n: 4 }),
  def('M13', M, S, 'Floating Around', 'Land on 10 moving logs', 'sum', { stat: 'logs', n: 10 }),
  def('M14', M, S, 'Hopping Machine', 'Hop forward 150 times', 'sum', { stat: 'fwd', n: 150 }),
  def('M15', M, S, 'Side Street', 'Hop left or right 75 times', 'sum', { stat: 'side', n: 75 }),
  def('M16', M, S, 'Distance Veteran', 'Score 300 rows in total today', 'sum', { stat: 'score', n: 300 }),
  def('M17', M, S, 'Triple Forty', 'Reach row 40 in three runs', 'runs', { stat: 'score', min: 40, n: 3 }),
  def('M18', M, R, 'One-Run Treasure', 'Collect 5 coins in one run', 'best', { stat: 'ordCoins', n: 5 }),
  def('M19', M, R, 'No Turning Back', 'Reach row 60 without hopping backward', 'noBack', { n: 60 }),
  def('M20', M, R, 'Straight and Narrow', 'Reach row 50 with fewer than 8 sideways hops', 'fewSide', { row: 50, max: 7 }),
  def('M21', M, R, 'Train Watcher', 'Cross 3 train tracks', 'sum', { stat: 'rails', n: 3 }),
  def('M22', M, R, 'Big Pocket', 'Collect 8 coins in one run', 'best', { stat: 'ordCoins', n: 8 }),
  def('M23', M, R, 'Water Traveller', 'Cross 3 rivers in one run', 'best', { stat: 'rivers', n: 3 }),
  def('M24', M, R, 'Traffic Survivor', 'Cross 10 road lanes in one run', 'best', { stat: 'roads', n: 10 }),
  def('M25', M, R, 'Blue Treasure', 'Collect a blue jewel', 'sum', { stat: 'gems', n: 1 }),
  def('M26', M, R, 'Gem Gatherer', 'Collect 2 blue jewels', 'sum', { stat: 'gems', n: 2 }),
  def('M27', M, P, 'Four Strong Runs', 'Reach row 30 in four runs', 'runs', { stat: 'score', min: 30, n: 4 }),
  def('M28', M, P, 'Double Sixty', 'Reach row 60 in two runs', 'runs', { stat: 'score', min: 60, n: 2 }),
  def('M29', M, P, 'Eighty-Five', 'Reach row 85 in one run', 'row', { n: 85 }),
  def('M30', M, P, 'Rail Regular', 'Cross 10 train tracks', 'sum', { stat: 'rails', n: 10 }),
  def('M31', M, P, 'Log Rider', 'Land on 12 moving logs', 'sum', { stat: 'logs', n: 12 }),
  def('M32', M, P, 'Track Master', 'Cross 12 train tracks', 'sum', { stat: 'rails', n: 12 }),
  def('M33', M, L, 'Century Club', 'Reach row 100 in one run', 'row', { n: 100 }),
  def('M34', M, L, 'Distance Champion', 'Score 500 rows in total today', 'sum', { stat: 'score', n: 500 }),
  def('M35', M, L, 'Coin Magnate', 'Collect 25 coins', 'sum', { stat: 'ordCoins', n: 25 }),
  // ---------------------------------------------------------------- HARD (30)
  def('H01', H, S, '110 Club', 'Reach row 110 in one run', 'row', { n: 110 }),
  def('H02', H, S, '125 Club', 'Reach row 125 in one run', 'row', { n: 125 }),
  def('H03', H, S, '140 Club', 'Reach row 140 in one run', 'row', { n: 140 }),
  def('H04', H, S, '160 Club', 'Reach row 160 in one run', 'row', { n: 160 }),
  def('H05', H, S, '180 Club', 'Reach row 180 in one run', 'row', { n: 180 }),
  def('H06', H, S, '200 Club', 'Reach row 200 in one run', 'row', { n: 200 }),
  def('H07', H, S, 'Full Pockets', 'Collect 30 coins', 'sum', { stat: 'ordCoins', n: 30 }),
  def('H08', H, S, 'Coin Hoarder', 'Collect 50 coins', 'sum', { stat: 'ordCoins', n: 50 }),
  def('H09', H, S, 'Road Warrior', 'Cross 50 road lanes', 'sum', { stat: 'roads', n: 50 }),
  def('H10', H, S, 'Traffic Champion', 'Cross 70 road lanes', 'sum', { stat: 'roads', n: 70 }),
  def('H11', H, S, 'Rail Veteran', 'Cross 15 train tracks', 'sum', { stat: 'rails', n: 15 }),
  def('H12', H, S, 'Rail Conqueror', 'Cross 25 train tracks', 'sum', { stat: 'rails', n: 25 }),
  def('H13', H, S, 'River Legend', 'Cross 15 rivers', 'sum', { stat: 'rivers', n: 15 }),
  def('H14', H, S, 'Log Acrobat', 'Land on 25 moving logs', 'sum', { stat: 'logs', n: 25 }),
  def('H15', H, S, 'Double Century', 'Reach row 100 in two runs', 'runs', { stat: 'score', min: 100, n: 2 }),
  def('H16', H, R, '150 Legend', 'Reach row 150 in one run', 'row', { n: 150 }),
  def('H17', H, R, 'No Reverse', 'Reach row 80 without hopping backward', 'noBack', { n: 80 }),
  def('H18', H, R, 'Efficient Traveller', 'Reach row 100 with at most 10 sideways hops', 'fewSide', { row: 100, max: 10 }),
  def('H19', H, R, 'Treasure Sprint', 'Collect 8 coins in one run', 'best', { stat: 'ordCoins', n: 8 }),
  def('H20', H, R, 'Coin Marathon', 'Collect 12 coins in one run', 'best', { stat: 'ordCoins', n: 12 }),
  def('H21', H, R, 'Highway Sprint', 'Cross 15 road lanes in one run', 'best', { stat: 'roads', n: 15 }),
  def('H22', H, P, '220 Club', 'Reach row 220 in one run', 'row', { n: 220 }),
  def('H23', H, P, 'Thirty Tracks', 'Cross 30 train tracks', 'sum', { stat: 'rails', n: 30 }),
  def('H24', H, P, 'River Royalty', 'Cross 20 rivers', 'sum', { stat: 'rivers', n: 20 }),
  def('H25', H, P, 'Distance Master', 'Score 900 rows in total today', 'sum', { stat: 'score', n: 900 }),
  def('H26', H, L, '250 Club', 'Reach row 250 in one run', 'row', { n: 250 }),
  def('H27', H, L, '300 Club', 'Reach row 300 in one run', 'row', { n: 300 }),
  def('H28', H, L, 'Highway Hundred', 'Cross 100 road lanes', 'sum', { stat: 'roads', n: 100 }),
  def('H29', H, L, 'Triple Century', 'Reach row 100 in three runs', 'runs', { stat: 'score', min: 100, n: 3 }),
  def('H30', H, L, 'Crossy Legend', 'Reach row 350 in one run', 'row', { n: 350 }),
];
for (const d of DAILIES) {
  d.base = BASE_REWARD[d.tier];
  d.bonus = RARITY_BONUS[d.rarity];
  d.reward = d.base + d.bonus;
  d.goal = d.kind === 'fewSide' ? d.row : d.kind === 'runs' ? d.n : d.n;
}
export const dailyById = Object.fromEntries(DAILIES.map(d => [d.id, d]));
export const TIERS = ['easy', 'medium', 'hard'];

// ---------------------------------------------------------------- rotation (server clock, UTC)
export const dayOf = ms => Math.floor(ms / DAY_MS);                     // UTC day number
export const nextResetMs = ms => (dayOf(ms) + 1) * DAY_MS;              // next 00:00 UTC

function mulberry(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), s | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// Each tier works through a shuffled order of its whole pool before any mission repeats; the shuffle
// for each pass is fixed by the pass number, so every device and the server agree on the day's three.
export function dailiesForDay(day) {
  return TIERS.map((tier, ti) => {
    const pool = DAILIES.filter(d => d.tier === tier).map(d => d.id);
    const pass = Math.floor(day / pool.length), pos = ((day % pool.length) + pool.length) % pool.length;
    const r = mulberry(0x5eed + pass * 7919 + ti * 104729);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool[pos];
  });
}

// ---------------------------------------------------------------- progress
export const validRun = s => !!s && !s.practice && (s.score | 0) >= MIN_VALID_SCORE;

// value toward the goal from a day's runs (stats objects); returns { value, goal, done }
export function progressOf(d, runs) {
  const rs = runs.filter(validRun);
  const st = (s, k) => Number(s[k]) || 0;
  let value = 0;
  switch (d.kind) {
    case 'row': value = Math.max(0, ...rs.map(s => st(s, 'score'))); break;
    case 'sum': value = rs.reduce((a, s) => a + st(s, d.stat), 0); break;
    case 'best': value = Math.max(0, ...rs.map(s => st(s, d.stat))); break;
    case 'runs': value = rs.filter(s => st(s, d.stat) >= d.min).length; break;
    case 'noBack': value = Math.max(0, ...rs.map(s => Math.min(st(s, 'noBackRow'), st(s, 'score')))); break;
    case 'fewSide': {
      // the furthest checkpoint (every 10 rows) reached with no more than `max` sideways hops
      for (const s of rs) for (const [row, side] of Object.entries(s.sideAt || {})) if (side <= d.max && +row <= d.row) value = Math.max(value, +row);
      break;
    }
  }
  value = Math.min(value, d.goal);
  return { value, goal: d.goal, done: value >= d.goal };
}
