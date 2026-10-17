// Teams, names and player generation. Pure data + seeded randomness; runs in node for the tests too.

export const TEAMS = [
  // Atlantic Conference
  { id: 'BOS', city: 'Boston', c1: '#0b2a5b', c2: '#c8102e', conf: 0, div: 0 },
  { id: 'NYK', city: 'New York', c1: '#1c3f94', c2: '#e0e0e0', conf: 0, div: 0 },
  { id: 'BUF', city: 'Buffalo', c1: '#00338d', c2: '#d50a0a', conf: 0, div: 0 },
  { id: 'MIA', city: 'Miami', c1: '#008e97', c2: '#fc4c02', conf: 0, div: 0 },
  { id: 'BAL', city: 'Baltimore', c1: '#3d1f7a', c2: '#d4af37', conf: 0, div: 1 },
  { id: 'PIT', city: 'Pittsburgh', c1: '#1b1b1b', c2: '#ffb612', conf: 0, div: 1 },
  { id: 'CLE', city: 'Cleveland', c1: '#4a2511', c2: '#ff5a00', conf: 0, div: 1 },
  { id: 'CIN', city: 'Cincinnati', c1: '#fb4f14', c2: '#111111', conf: 0, div: 1 },
  { id: 'HOU', city: 'Houston', c1: '#0b1f44', c2: '#a71930', conf: 0, div: 2 },
  { id: 'IND', city: 'Indianapolis', c1: '#003b80', c2: '#ffffff', conf: 0, div: 2 },
  { id: 'JAX', city: 'Jacksonville', c1: '#006778', c2: '#d7a22a', conf: 0, div: 2 },
  { id: 'NSH', city: 'Nashville', c1: '#4b92db', c2: '#0c2340', conf: 0, div: 2 },
  { id: 'DEN', city: 'Denver', c1: '#fb4f14', c2: '#002244', conf: 0, div: 3 },
  { id: 'KC', city: 'Kansas City', c1: '#e31837', c2: '#ffb81c', conf: 0, div: 3 },
  { id: 'LV', city: 'Las Vegas', c1: '#2a2a2a', c2: '#a5acaf', conf: 0, div: 3 },
  { id: 'SD', city: 'San Diego', c1: '#0080c6', c2: '#ffc20e', conf: 0, div: 3 },
  // Pacific Conference
  { id: 'DAL', city: 'Dallas', c1: '#041e42', c2: '#869397', conf: 1, div: 0 },
  { id: 'PHI', city: 'Philadelphia', c1: '#004c54', c2: '#a5acaf', conf: 1, div: 0 },
  { id: 'WAS', city: 'Washington', c1: '#5a1414', c2: '#ffb612', conf: 1, div: 0 },
  { id: 'NJ', city: 'New Jersey', c1: '#0b6e4f', c2: '#f2f2f2', conf: 1, div: 0 },
  { id: 'CHI', city: 'Chicago', c1: '#0b162a', c2: '#c83803', conf: 1, div: 1 },
  { id: 'DET', city: 'Detroit', c1: '#0076b6', c2: '#b0b7bc', conf: 1, div: 1 },
  { id: 'GB', city: 'Green Bay', c1: '#203731', c2: '#ffb612', conf: 1, div: 1 },
  { id: 'MIN', city: 'Minnesota', c1: '#4f2683', c2: '#ffc62f', conf: 1, div: 1 },
  { id: 'ATL', city: 'Atlanta', c1: '#a71930', c2: '#1b1b1b', conf: 1, div: 2 },
  { id: 'CAR', city: 'Carolina', c1: '#0085ca', c2: '#101820', conf: 1, div: 2 },
  { id: 'NO', city: 'New Orleans', c1: '#101820', c2: '#d3bc8d', conf: 1, div: 2 },
  { id: 'TB', city: 'Tampa Bay', c1: '#d50a0a', c2: '#34302b', conf: 1, div: 2 },
  { id: 'ARI', city: 'Arizona', c1: '#97233f', c2: '#ffb612', conf: 1, div: 3 },
  { id: 'LA', city: 'Los Angeles', c1: '#003594', c2: '#ffd100', conf: 1, div: 3 },
  { id: 'SF', city: 'San Francisco', c1: '#aa0000', c2: '#b3995d', conf: 1, div: 3 },
  { id: 'SEA', city: 'Seattle', c1: '#002244', c2: '#69be28', conf: 1, div: 3 },
];
export const CONFS = ['Atlantic', 'Pacific'];
export const DIVS = ['North', 'East', 'South', 'West'];
export const teamById = id => TEAMS.find(t => t.id === id);

const FIRST = ['Aaron', 'Andre', 'Ben', 'Billy', 'Brady', 'Brandon', 'Calvin', 'Cam', 'Carson', 'Chase', 'Chris', 'Cody', 'Cole', 'Dak',
  'Dallas', 'Damien', 'Dante', 'Darius', 'Darnell', 'Dave', 'Derek', 'Devin', 'Dion', 'Drew', 'Dwayne', 'Eli', 'Emmett', 'Eric', 'Evan',
  'Frank', 'Gabe', 'Grant', 'Hank', 'Isaiah', 'Jack', 'Jalen', 'Jamal', 'Jared', 'Jason', 'Jay', 'Jerome', 'Joe', 'Jordan', 'Josh', 'Justin',
  'Kareem', 'Keenan', 'Kenny', 'Kevin', 'Kirk', 'Kyle', 'Lamar', 'Lance', 'Leon', 'Logan', 'Luke', 'Malik', 'Marcus', 'Mark', 'Marvin',
  'Matt', 'Max', 'Mike', 'Miles', 'Nate', 'Nick', 'Noah', 'Omar', 'Owen', 'Pat', 'Quinn', 'Ray', 'Reggie', 'Ricky', 'Rob', 'Russ', 'Ryan',
  'Sam', 'Sean', 'Shane', 'Steve', 'Terrell', 'Tom', 'Tony', 'Travis', 'Trent', 'Troy', 'Ty', 'Tyler', 'Vince', 'Wade', 'Walt', 'Zach'];
const LAST = ['Adams', 'Allen', 'Anderson', 'Bailey', 'Baker', 'Barnes', 'Bell', 'Bennett', 'Brooks', 'Brown', 'Bryant', 'Butler', 'Carter',
  'Clark', 'Coleman', 'Collins', 'Cook', 'Cooper', 'Cox', 'Davis', 'Dixon', 'Edwards', 'Ellis', 'Evans', 'Fisher', 'Ford', 'Foster', 'Gibson',
  'Graham', 'Grant', 'Gray', 'Green', 'Griffin', 'Hall', 'Harris', 'Hayes', 'Henderson', 'Hill', 'Holmes', 'Howard', 'Hughes', 'Jackson',
  'James', 'Jenkins', 'Johnson', 'Jones', 'Jordan', 'Kelly', 'King', 'Lewis', 'Long', 'Marshall', 'Martin', 'Mason', 'Miller', 'Mitchell',
  'Moore', 'Morgan', 'Morris', 'Murphy', 'Murray', 'Nelson', 'Owens', 'Parker', 'Patterson', 'Payne', 'Perry', 'Peterson', 'Phillips',
  'Porter', 'Powell', 'Price', 'Reed', 'Reynolds', 'Rice', 'Richardson', 'Rivers', 'Roberts', 'Robinson', 'Rogers', 'Ross', 'Russell',
  'Sanders', 'Scott', 'Simmons', 'Smith', 'Stewart', 'Sullivan', 'Taylor', 'Thomas', 'Thompson', 'Tucker', 'Turner', 'Walker', 'Wallace',
  'Ward', 'Washington', 'Watson', 'Webb', 'West', 'White', 'Williams', 'Wilson', 'Wood', 'Wright', 'Young'];

// positions on the star roster. Attributes are 1..10; the star rating is their (weighted) average / 2.
export const POS = {
  QB: { name: 'Quarterback', attrs: ['arm', 'acc', 'spd'], w: [1.1, 1.3, 0.6] },
  RB: { name: 'Running Back', attrs: ['spd', 'str', 'hnd'], w: [1.2, 1.1, 0.7] },
  WR: { name: 'Wide Receiver', attrs: ['spd', 'hnd', 'str'], w: [1.2, 1.2, 0.6] },
  TE: { name: 'Tight End', attrs: ['hnd', 'str', 'spd'], w: [1.1, 1.1, 0.8] },
  OL: { name: 'Offensive Line', attrs: ['blk', 'str', 'tec'], w: [1.3, 1, 0.7] },
  K: { name: 'Kicker', attrs: ['pow', 'acc', 'cmp'], w: [1.2, 1.2, 0.6] },
  DL: { name: 'Defensive Line', attrs: ['rsh', 'str', 'spd'], w: [1.3, 1, 0.7] },
  LB: { name: 'Linebacker', attrs: ['tck', 'spd', 'cov'], w: [1.2, 1, 0.8] },
  DB: { name: 'Defensive Back', attrs: ['cov', 'spd', 'hnd'], w: [1.3, 1.1, 0.6] },
};
export const ATTR_NAMES = { arm: 'Arm', acc: 'Accuracy', spd: 'Speed', str: 'Strength', hnd: 'Hands', blk: 'Blocking', tec: 'Technique',
  pow: 'Power', cmp: 'Composure', rsh: 'Pass rush', tck: 'Tackling', cov: 'Coverage' };
export const SLOTS = ['QB', 'RB', 'WR1', 'WR2', 'TE', 'OL', 'K', 'DL', 'LB', 'DB'];
export const slotPos = s => s.replace(/\d$/, '');

// small seeded PRNG (mulberry32) so a career can be regenerated or tested
export function rng(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.state = () => a;
  return f;
}

export function rating(p) {
  const d = POS[p.pos];
  let s = 0, w = 0;
  d.attrs.forEach((k, i) => { s += p.a[k] * d.w[i]; w += d.w[i]; });
  return Math.max(1, Math.min(10, Math.round(s / w)));
}
export const stars = p => rating(p) / 2;

export function salaryFor(r, age) {
  // $ millions a year: stars are expensive, veterans a little cheaper
  const base = 0.6 + Math.pow(r, 1.75) * 0.32;
  return Math.round(base * (age >= 31 ? 0.85 : 1) * 10) / 10;
}

let nextId = 1;
export function setNextId(n) { nextId = n; }
export function makePlayer(R, pos, level, age) {
  const d = POS[pos];
  const a = {};
  for (const k of d.attrs) a[k] = Math.max(1, Math.min(10, Math.round(level + (R() - 0.5) * 3)));
  const p = {
    id: nextId++, name: `${R.pick(FIRST)} ${R.pick(LAST)}`, pos, age: age || R.int(22, 31), a,
    years: R.int(1, 4), xp: 0, pts: 0, morale: 70 + R.int(0, 20), inj: 0, num: 0,
    stats: { g: 0, py: 0, ptd: 0, int: 0, ry: 0, rtd: 0, cy: 0, ctd: 0, rec: 0, fg: 0, sk: 0 },
  };
  p.num = { QB: R.int(1, 19), K: R.int(1, 19), RB: R.int(20, 39), WR: R.int(80, 89), TE: R.int(80, 89), OL: R.int(60, 79), DL: R.int(90, 99), LB: R.int(50, 59), DB: R.int(20, 39) }[pos];
  p.sal = salaryFor(rating(p), p.age);
  return p;
}
