// The franchise: schedule, standings, playoffs, roster, coaching credits, facilities, draft and contracts.
// Pure logic on a plain JSON object (the save), so it runs in node for the tests and saves to the server as is.
import { TEAMS, teamById, rng, makePlayer, rating, salaryFor, SLOTS, slotPos, POS, setNextId } from './data.js';

export const SEASON_WEEKS = 16;
export const SALARY_CAP = 90;          // $ millions for the ten star players
export const ROUNDS = ['Wildcard', 'Divisional', 'Conference', 'Retro Bowl'];
export const ROUND_KIND = ['wildcard', 'divisional', 'conference', 'final'];
export const FACILITIES = {
  stadium: { name: 'Stadium', what: 'More fans. Fans pay coaching credits every home win.' },
  training: { name: 'Training', what: 'Players earn XP faster and keep their edge as they age.' },
  rehab: { name: 'Rehab', what: 'Injuries heal faster and happen less.' },
  offense: { name: 'Offense coach', what: 'Better pass protection and more yards after the catch.' },
  defense: { name: 'Defense coach', what: 'Opponents score less on their drives.' },
};
export const facilityCost = lvl => 4 + lvl * 4;

const R = c => {                       // the career's own random stream, persisted in the save
  const f = rng(c.rs);
  const wrap = () => { const v = f(); c.rs = f.state(); return v; };
  wrap.int = (lo, hi) => lo + Math.floor(wrap() * (hi - lo + 1));
  wrap.pick = arr => arr[Math.floor(wrap() * arr.length)];
  return wrap;
};

// ---------------------------------------------------------------- setup
function roundRobin(ids, R) {
  const t = ids.slice();
  for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  const n = t.length, weeks = [];
  for (let r = 0; r < n - 1; r++) {
    const games = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      games.push((r + i) % 2 ? [a, b] : [b, a]);       // [home, away]
    }
    weeks.push(games);
    t.splice(1, 0, t.pop());
  }
  return weeks;
}

export function newCareer(teamId, coach, seed = (Math.random() * 2 ** 31) | 0) {
  const c = { v: 1, rs: seed >>> 0, teamId, coach, season: 1, year: new Date().getFullYear(), week: 0, phase: 'regular',
    cc: 12, fans: 35, chem: 60, facilities: { stadium: 1, training: 1, rehab: 1, offense: 1, defense: 1 },
    teams: {}, schedule: [], results: [], playoffs: null, roster: {}, draft: null, news: [], history: [], titles: 0,
    nextPid: 1, settings: { quarter: 4, sound: true, aimAssist: true } };
  const r = R(c);
  for (const t of TEAMS) {
    const base = t.id === teamId ? 4 : 3.5 + r() * 4.5;
    c.teams[t.id] = { off: +base.toFixed(1), def: +(3.5 + r() * 4.5).toFixed(1), w: 0, l: 0, t: 0, pf: 0, pa: 0 };
  }
  c.schedule = roundRobin(TEAMS.map(t => t.id), r).slice(0, SEASON_WEEKS);
  // a fresh franchise: a solid but unspectacular group, one or two bright spots
  const pr = rng(seed ^ 0x5bd1e995);
  setNextId(1);
  const star = pr.pick(['QB', 'WR1', 'RB']);
  for (const s of SLOTS) {
    const p = makePlayer(pr, slotPos(s), s === star ? 7 : 4 + pr.int(0, 1));
    if (s === 'QB') p.age = 24;
    c.roster[s] = p;
  }
  fitCap(c);
  c.nextPid = Math.max(...Object.values(c.roster).map(p => p.id)) + 1;
  news(c, `Welcome to ${teamById(teamId).city}, Coach ${coach}! The fans want a winner.`);
  return c;
}

function fitCap(c) {
  // starting rosters always fit under the cap
  let over = payroll(c) - SALARY_CAP * 0.9;
  for (const s of SLOTS) {
    if (over <= 0) break;
    const p = c.roster[s];
    const cut = Math.min(over, p.sal - 0.8);
    if (cut > 0) { p.sal = Math.round((p.sal - cut) * 10) / 10; over -= cut; }
  }
}

export function news(c, text) {
  c.news.unshift({ s: c.season, w: c.week, text });
  c.news.length = Math.min(c.news.length, 30);
}

// ---------------------------------------------------------------- ratings used by the match
export const payroll = c => Math.round(SLOTS.reduce((s, k) => s + (c.roster[k] ? c.roster[k].sal : 0), 0) * 10) / 10;
export const capRoom = c => Math.round((SALARY_CAP - payroll(c)) * 10) / 10;

export function active(c, slot) {
  // an injured star sits; a generic backup plays in his place
  const p = c.roster[slot];
  if (p && !p.inj) return p;
  const pos = slotPos(slot);
  const a = {};
  for (const k of POS[pos].attrs) a[k] = 3;
  return { id: -1, name: 'Backup', pos, a, num: 0, backup: true, stats: {} };
}
export function teamRatings(c) {
  const d = ['DL', 'LB', 'DB'].map(s => rating(active(c, s)));
  const o = ['QB', 'RB', 'WR1', 'WR2', 'TE', 'OL'].map(s => rating(active(c, s)));
  return {
    def: d.reduce((a, b) => a + b) / 3 + (c.facilities.defense - 1) * 0.35,
    off: o.reduce((a, b) => a + b) / 6 + (c.facilities.offense - 1) * 0.25,
  };
}
export function syncUserTeam(c) {
  const r = teamRatings(c);
  const t = c.teams[c.teamId];
  t.off = +r.off.toFixed(1); t.def = +r.def.toFixed(1);
}

// ---------------------------------------------------------------- simulation
// One drive by `off` against `def`, starting `start` yards from the goal it attacks.
export function driveOutcome(rand, off, def, start = 75) {
  const edge = (off - def) * 0.055;
  const field = (75 - start) * 0.006;
  const roll = rand();
  const time = 70 + Math.floor(rand() * 240);
  const pTD = Math.max(0.06, Math.min(0.62, 0.21 + edge + field));
  const pFG = Math.max(0.05, Math.min(0.3, 0.15 + edge * 0.4 + field * 0.4));
  const pTO = Math.max(0.03, 0.12 - edge * 0.6);
  if (roll < pTD) return { kind: 'td', pts: rand() < 0.94 ? 7 : 6, time, yards: start };
  if (roll < pTD + pFG) return { kind: 'fg', pts: 3, time, yards: Math.max(5, start - 25 - Math.floor(rand() * 20)) };
  if (roll < pTD + pFG + pTO) {
    const gained = Math.floor(rand() * Math.max(5, start - 20));
    return { kind: rand() < 0.6 ? 'int' : 'fumble', pts: 0, time: Math.floor(time * 0.6), yards: gained, spot: start - gained };
  }
  const gained = Math.floor(rand() * Math.max(5, Math.min(45, start - 30)));
  return { kind: start - gained < 45 && rand() < 0.3 ? 'downs' : 'punt', pts: 0, time, yards: gained, spot: start - gained };
}

export function simGame(rand, a, b) {
  let sa = 0, sb = 0;
  const drives = 10 + Math.floor(rand() * 3);
  for (let i = 0; i < drives; i++) {
    sa += driveOutcome(rand, a.off, b.def, 70 + rand() * 15).pts;
    sb += driveOutcome(rand, b.off, a.def, 70 + rand() * 15).pts;
  }
  return [sa, sb];
}

export function userGame(c) {
  if (c.phase === 'regular') {
    const g = c.schedule[c.week].find(g => g.includes(c.teamId));
    return { home: g[0] === c.teamId, opp: g[0] === c.teamId ? g[1] : g[0], kind: 'season', label: `Week ${c.week + 1}` };
  }
  if (c.phase === 'playoffs' && c.playoffs && c.playoffs.alive) {
    const g = c.playoffs.next;
    if (!g) return null;
    return { home: g.home === c.teamId, opp: g.home === c.teamId ? g.away : g.home, kind: ROUND_KIND[c.playoffs.round], label: ROUNDS[c.playoffs.round] };
  }
  return null;
}

function applyResult(c, home, away, hs, as) {
  const H = c.teams[home], A = c.teams[away];
  H.pf += hs; H.pa += as; A.pf += as; A.pa += hs;
  if (hs > as) { H.w++; A.l++; } else if (as > hs) { A.w++; H.l++; } else { H.t++; A.t++; }
}

// The player's match is over: record it, simulate the rest of the week, pay out, move on.
export function finishUserGame(c, us, them, gameStats) {
  const g = userGame(c);
  if (!g) return null;
  const r = R(c);
  const won = us > them, tie = us === them;
  const report = { us, them, opp: g.opp, won, tie, label: g.label, cc: 0, levelUps: [], injuries: [], kind: g.kind };
  syncUserTeam(c);

  // coaching credits: earned by winning, more in January, plus home-crowd bonus from the stadium
  let cc = won ? 2 : tie ? 1 : 0;
  if (g.kind !== 'season' && won) cc += 2;
  if (g.kind === 'final' && won) cc += 4;
  if (won && g.home) cc += Math.floor(c.facilities.stadium / 2);
  c.cc += cc; report.cc = cc;
  c.fans = Math.max(5, Math.min(100, c.fans + (won ? 3 + (g.kind !== 'season' ? 4 : 0) : tie ? 0 : -2)));
  c.chem = Math.max(10, Math.min(100, c.chem + (won ? 4 : -3)));

  // XP from the box score
  for (const s of SLOTS) {
    const p = c.roster[s];
    if (!p) continue;
    if (p.inj) { p.inj = Math.max(0, p.inj - 1 - (c.facilities.rehab >= 4 ? 1 : 0)); continue; }
    const st = (gameStats && gameStats[p.id]) || {};
    for (const k of Object.keys(st)) p.stats[k] = (p.stats[k] || 0) + st[k];
    p.stats.g = (p.stats.g || 0) + 1;
    let xp = 8 + (won ? 6 : 0);
    xp += (st.py || 0) / 12 + (st.ry || 0) / 6 + (st.cy || 0) / 6 + ((st.ptd || 0) + (st.rtd || 0) + (st.ctd || 0)) * 8 + (st.fg || 0) * 4 - (st.int || 0) * 4;
    if (['DL', 'LB', 'DB', 'OL'].includes(slotPos(s))) xp += 6 + (report.them <= 14 ? 8 : 0);
    xp *= 1 + (c.facilities.training - 1) * 0.15;
    p.xp += Math.max(0, Math.round(xp));
    while (p.xp >= 100) { p.xp -= 100; p.pts++; report.levelUps.push(p.name); }
    p.morale = Math.max(10, Math.min(100, p.morale + (won ? 3 : -2)));
    // injuries: rare, rarer with better rehab
    if (r() < 0.025 * (1.2 - c.facilities.rehab * 0.15)) {
      p.inj = 1 + r.int(0, 3);
      report.injuries.push(`${p.name} (${p.inj} wk)`);
      news(c, `${p.pos} ${p.name} is injured and will miss ${p.inj} week${p.inj > 1 ? 's' : ''}.`);
    }
  }

  if (c.phase === 'regular') {
    const games = c.schedule[c.week];
    const res = [];
    for (const [h, a] of games) {
      let hs, as;
      if (h === c.teamId) { hs = us; as = them; } else if (a === c.teamId) { hs = them; as = us; }
      else [hs, as] = simGame(r, c.teams[h], c.teams[a]);
      applyResult(c, h, a, hs, as);
      res.push([h, a, hs, as]);
    }
    c.results[c.week] = res;
    news(c, `${g.label}: ${won ? 'Beat' : tie ? 'Tied' : 'Lost to'} ${teamById(g.opp).city} ${us}-${them}.`);
    c.week++;
    if (c.week >= SEASON_WEEKS) startPlayoffs(c, r);
  } else {
    advancePlayoffs(c, r, us, them);
  }
  report.phase = c.phase;
  return report;
}

// ---------------------------------------------------------------- standings + playoffs
const pct = t => (t.w + t.t * 0.5) / Math.max(1, t.w + t.l + t.t);
export function sortTeams(c, ids) {
  return ids.slice().sort((a, b) => pct(c.teams[b]) - pct(c.teams[a]) || (c.teams[b].pf - c.teams[b].pa) - (c.teams[a].pf - c.teams[a].pa) || c.teams[b].pf - c.teams[a].pf);
}
export function standings(c) {
  return [0, 1].map(conf => [0, 1, 2, 3].map(div => sortTeams(c, TEAMS.filter(t => t.conf === conf && t.div === div).map(t => t.id))));
}
function seeds(c, conf) {
  const divs = standings(c)[conf];
  const winners = sortTeams(c, divs.map(d => d[0]));
  const rest = sortTeams(c, divs.flatMap(d => d.slice(1))).slice(0, 2);
  return [...winners, ...rest];          // 6 seeds; 1 and 2 have a bye
}

function startPlayoffs(c, r) {
  c.phase = 'playoffs';
  const s = [seeds(c, 0), seeds(c, 1)];
  c.playoffs = { round: 0, seeds: s, alive: s.some(x => x.includes(c.teamId)), games: [[], [], [], []], champion: null, next: null,
    remaining: s.map(x => x.slice()) };
  if (c.playoffs.alive) {
    const seed = s.flat().indexOf(c.teamId) % 6 + 1;
    news(c, `Playoffs! ${teamById(c.teamId).city} are the #${seed} seed.`);
  } else news(c, 'The season is over and we missed the playoffs.');
  pairRound(c);
  if (!c.playoffs.alive) simRestOfPlayoffs(c, r);
}

function pairRound(c) {
  const P = c.playoffs;
  const pairs = [];
  if (P.round === 0) for (const s of P.seeds) { pairs.push({ home: s[2], away: s[5] }, { home: s[3], away: s[4] }); }
  else if (P.round === 1) {
    for (let conf = 0; conf < 2; conf++) {
      const alive = P.seeds[conf].filter(t => P.remaining[conf].includes(t));     // seed order
      pairs.push({ home: alive[0], away: alive[3] }, { home: alive[1], away: alive[2] });
    }
  } else if (P.round === 2) {
    for (let conf = 0; conf < 2; conf++) {
      const alive = P.seeds[conf].filter(t => P.remaining[conf].includes(t));
      pairs.push({ home: alive[0], away: alive[1] });
    }
  } else {
    const a = P.remaining[0][0], b = P.remaining[1][0];
    pairs.push(pct(c.teams[a]) >= pct(c.teams[b]) ? { home: a, away: b } : { home: b, away: a });
  }
  P.pairs = pairs;
  P.next = P.alive ? pairs.find(g => g.home === c.teamId || g.away === c.teamId) || null : null;
  if (P.alive && !P.next) {                 // a bye this round: sim it straight away
    playRound(c, R(c), null);
  }
}

function playRound(c, r, user) {
  const P = c.playoffs;
  for (const g of P.pairs) {
    let hs, as;
    if (user && (g.home === c.teamId || g.away === c.teamId)) {
      [hs, as] = g.home === c.teamId ? [user[0], user[1]] : [user[1], user[0]];
    } else {
      [hs, as] = simGame(r, c.teams[g.home], c.teams[g.away]);
      while (hs === as) hs += r() < 0.5 ? 3 : 0, as += hs === as ? 3 : 0;   // no ties in January
    }
    const winner = hs > as ? g.home : g.away, loser = winner === g.home ? g.away : g.home;
    P.games[P.round].push({ ...g, hs, as, winner });
    for (const rem of P.remaining) { const i = rem.indexOf(loser); if (i >= 0) rem.splice(i, 1); }
    if (loser === c.teamId) P.alive = false;
  }
  if (P.round === 3) {
    P.champion = P.games[3][0].winner;
    endSeason(c);
    return;
  }
  if (P.round === 0) {
    // byes go through
  }
  P.round++;
  pairRound(c);
}

function advancePlayoffs(c, r, us, them) {
  const P = c.playoffs;
  const round = P.round;
  if (us === them) us += 1;                 // overtime always settles playoff games in the match itself
  playRound(c, r, [us, them]);
  const won = us > them;
  news(c, `${ROUNDS[round]}: ${won ? 'won' : 'lost'} ${us}-${them}${won && round === 3 ? '. RETRO BOWL CHAMPIONS!' : ''}`);
  if (!P.alive && P.champion === null) simRestOfPlayoffs(c, r);
}

function simRestOfPlayoffs(c, r) {
  let guard = 0;
  while (c.phase === 'playoffs' && c.playoffs.champion === null && guard++ < 8) playRound(c, r, null);
}

function endSeason(c) {
  const P = c.playoffs;
  const me = c.teams[c.teamId];
  let finish = 'Missed playoffs';
  const flat = P.games.flat();
  const lastGame = [...flat].reverse().find(g => g.home === c.teamId || g.away === c.teamId);
  if (P.champion === c.teamId) { finish = 'Retro Bowl champions'; c.titles++; c.cc += 5; }
  else if (lastGame) finish = `Lost in ${ROUNDS[P.games.findIndex(r => r.includes(lastGame))]}`;
  c.history.unshift({ season: c.season, year: c.year, w: me.w, l: me.l, t: me.t, pf: me.pf, pa: me.pa, finish });
  news(c, `${teamById(P.champion).city} win the Retro Bowl.`);
  c.phase = 'offseason';
  prepareOffseason(c);
}

// ---------------------------------------------------------------- the offseason: contracts, draft, aging
function prepareOffseason(c) {
  const r = R(c);
  setNextId(c.nextPid);
  const gen = () => r();
  gen.int = r.int; gen.pick = r.pick;
  c.draft = { picks: 2 + (c.facilities.training >= 3 ? 1 : 0), pool: [], taken: [] };
  const positions = ['QB', 'RB', 'WR', 'WR', 'TE', 'OL', 'K', 'DL', 'LB', 'DB', 'WR', 'RB', 'DL', 'DB'];
  for (const pos of positions) {
    const lvl = 3 + r() * 4.5;
    const p = makePlayer(gen, pos, lvl, r.int(21, 23));
    p.years = 4; p.sal = Math.max(0.8, Math.round(salaryFor(rating(p), 22) * 0.6 * 10) / 10);
    c.draft.pool.push(p);
  }
  c.nextPid += 40;
  setNextId(c.nextPid);
  // expiring contracts: they'll ask for a new deal
  c.expiring = SLOTS.filter(s => c.roster[s] && c.roster[s].years <= 1).map(s => {
    const p = c.roster[s];
    return { slot: s, id: p.id, ask: Math.round(salaryFor(rating(p), p.age + 1) * (p.morale >= 70 ? 1 : 1.15) * 10) / 10 };
  });
}

export function draftPick(c, playerId, slot) {
  const d = c.draft;
  if (!d || d.taken.length >= d.picks) return { ok: false, error: 'No picks left.' };
  const p = d.pool.find(x => x.id === playerId);
  if (!p || slotPos(slot) !== p.pos) return { ok: false, error: 'That player plays a different position.' };
  const old = c.roster[slot];
  const room = SALARY_CAP - payroll(c) + (old ? old.sal : 0);
  if (p.sal > room) return { ok: false, error: `Not enough cap room ($${room.toFixed(1)}M).` };
  c.roster[slot] = p;
  d.pool = d.pool.filter(x => x !== p);
  d.taken.push(p.id);
  news(c, `Drafted ${p.pos} ${p.name}${old ? `, releasing ${old.name}` : ''}.`);
  c.expiring = (c.expiring || []).filter(e => e.slot !== slot);
  return { ok: true };
}

export function resign(c, slot) {
  const e = (c.expiring || []).find(x => x.slot === slot);
  const p = c.roster[slot];
  if (!e || !p) return { ok: false, error: 'Nothing to sign.' };
  const room = SALARY_CAP - payroll(c) + p.sal;
  if (e.ask > room) return { ok: false, error: `Not enough cap room for $${e.ask}M.` };
  p.sal = e.ask; p.years = 3 + (p.age < 28 ? 1 : 0);
  c.expiring = c.expiring.filter(x => x !== e);
  news(c, `Re-signed ${p.name} at $${p.sal}M.`);
  return { ok: true };
}

export function startNextSeason(c) {
  if (c.phase !== 'offseason') return;
  const r = R(c);
  // anyone still unsigned walks; a backup fills the spot until a free agent or draftee is found
  for (const e of c.expiring || []) {
    const p = c.roster[e.slot];
    news(c, `${p.name} left in free agency.`);
    c.roster[e.slot] = makeReplacement(c, slotPos(e.slot), r);
  }
  c.expiring = [];
  for (const s of SLOTS) {
    const p = c.roster[s];
    p.age++; p.years = Math.max(0, p.years - 1); p.inj = 0;
    for (const k of Object.keys(p.a)) {
      const drift = p.age <= 26 ? (r() < 0.45 ? 1 : 0) : p.age >= 31 ? (r() < 0.5 - c.facilities.training * 0.06 ? -1 : 0) : 0;
      p.a[k] = Math.max(1, Math.min(10, p.a[k] + drift));
    }
    if (p.age >= 35 && r() < 0.6) {
      news(c, `${p.name} retired after a fine career.`);
      c.roster[s] = makeReplacement(c, slotPos(s), r);
    }
    p.stats = { g: 0 };
  }
  for (const id of Object.keys(c.teams)) {
    const t = c.teams[id];
    if (id !== c.teamId) {
      t.off = +Math.max(2.5, Math.min(9.5, t.off + (r() - 0.5) * 2 + (5.5 - t.off) * 0.15)).toFixed(1);
      t.def = +Math.max(2.5, Math.min(9.5, t.def + (r() - 0.5) * 2 + (5.5 - t.def) * 0.15)).toFixed(1);
    }
    t.w = t.l = t.t = t.pf = t.pa = 0;
  }
  c.season++; c.year++; c.week = 0; c.phase = 'regular'; c.playoffs = null; c.draft = null; c.results = [];
  c.schedule = roundRobin(Object.keys(c.teams), r).slice(0, SEASON_WEEKS);
  c.cc += 3;
  syncUserTeam(c);
  news(c, `Season ${c.season} kicks off. Let's go!`);
}

function makeReplacement(c, pos, r) {
  setNextId(c.nextPid);
  const g = () => r(); g.int = r.int; g.pick = r.pick;
  const p = makePlayer(g, pos, 3 + r() * 1.5, r.int(22, 29));
  p.sal = Math.max(0.8, Math.round(salaryFor(rating(p), p.age) * 0.7 * 10) / 10);
  c.nextPid = p.id + 1;
  return p;
}

// ---------------------------------------------------------------- spending coaching credits
export function upgradeFacility(c, key) {
  const lvl = c.facilities[key];
  if (!lvl || lvl >= 5) return { ok: false, error: 'Already maxed.' };
  const cost = facilityCost(lvl);
  if (c.cc < cost) return { ok: false, error: `You need ${cost} CC.` };
  c.cc -= cost; c.facilities[key]++;
  news(c, `${FACILITIES[key].name} upgraded to level ${c.facilities[key]}.`);
  syncUserTeam(c);
  return { ok: true };
}

export const trainCost = p => (p.pts > 0 ? 0 : 2 + Math.floor(rating(p) / 2));
export function trainPlayer(c, slot, attr) {
  const p = c.roster[slot];
  if (!p || !(attr in p.a)) return { ok: false, error: 'Pick an attribute.' };
  if (p.a[attr] >= 10) return { ok: false, error: 'Already maxed.' };
  const cost = trainCost(p);
  if (p.pts > 0) p.pts--;
  else if (c.cc < cost) return { ok: false, error: `You need ${cost} CC.` };
  else c.cc -= cost;
  p.a[attr]++;
  syncUserTeam(c);
  return { ok: true };
}

export function freeAgents(c) {
  // a few players are always looking for a team; the list changes every week
  const seed = (c.season * 97 + c.week * 13 + c.teamId.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  setNextId(900000 + seed % 1000 * 10);
  const list = [];
  const pos = ['QB', 'RB', 'WR', 'TE', 'OL', 'K', 'DL', 'LB', 'DB'];
  for (let i = 0; i < 4; i++) {
    const p = makePlayer(r, r.pick(pos), 3.5 + r() * 4.5, r.int(24, 33));
    p.id = 900000 + seed % 1000 * 10 + i;
    p.years = r.int(1, 3);
    p.cost = Math.max(2, Math.round(rating(p) * 1.4 - 3));
    list.push(p);
  }
  return list.filter(p => !(c.signed || []).includes(p.id));
}
export function signFreeAgent(c, fa, slot) {
  if (slotPos(slot) !== fa.pos) return { ok: false, error: 'Wrong position.' };
  if (c.cc < fa.cost) return { ok: false, error: `You need ${fa.cost} CC.` };
  const old = c.roster[slot];
  const room = SALARY_CAP - payroll(c) + (old ? old.sal : 0);
  if (fa.sal > room) return { ok: false, error: `Not enough cap room ($${room.toFixed(1)}M).` };
  c.cc -= fa.cost;
  const p = JSON.parse(JSON.stringify(fa));
  delete p.cost;
  p.id = c.nextPid++;
  c.roster[slot] = p;
  c.signed = [...(c.signed || []), fa.id].slice(-20);
  news(c, `Signed ${p.pos} ${p.name}${old ? `, releasing ${old.name}` : ''}.`);
  syncUserTeam(c);
  return { ok: true };
}
