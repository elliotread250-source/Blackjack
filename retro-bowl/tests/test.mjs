// node tests/test.mjs [matches]
// Plays whole careers (simulated results) and whole matches (a simple bot at the controls) to check the
// rules hold together: no crashes, every match ends, scores and seasons look like football.
import { newCareer, finishUserGame, userGame, startNextSeason, active, teamRatings, standings, draftPick, resign, SEASON_WEEKS } from '../js/career.js';
import { Match, handoff, setAim, throwBall, flightTime, dive } from '../js/match.js';
import { SLOTS, teamById, slotPos } from '../js/data.js';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.error('FAIL', msg); } };

// ------------------------------------------------ careers
for (let seed = 1; seed <= 6; seed++) {
  const c = newCareer('CHI', 'tester', seed);
  ok(Object.keys(c.roster).length === SLOTS.length, 'full roster');
  for (let season = 0; season < 3; season++) {
    let guard = 0;
    while (c.phase !== 'offseason' && guard++ < 40) {
      const g = userGame(c);
      if (!g) { ok(false, `no game in phase ${c.phase} week ${c.week}`); break; }
      const us = 14 + (seed * 7 + guard * 3) % 21, them = 10 + (seed * 5 + guard) % 20;
      finishUserGame(c, us, them, {});
    }
    ok(c.phase === 'offseason', `season ends (seed ${seed})`);
    const games = Object.values(c.teams).reduce((s, t) => s + t.w + t.l + t.t, 0);
    ok(games === 32 * SEASON_WEEKS, `every team played ${SEASON_WEEKS} (got ${games / 32})`);
    ok(c.playoffs && c.playoffs.champion, 'a champion');
    ok(standings(c)[0].length === 4, 'four divisions');
    // offseason moves
    const d = c.draft;
    ok(d && d.pool.length > 5, 'draft pool');
    const p = d.pool.find(x => x.pos === 'K');
    if (p) draftPick(c, p.id, 'K');
    for (const e of [...(c.expiring || [])]) resign(c, e.slot);
    startNextSeason(c);
    ok(c.phase === 'regular' && c.week === 0, 'next season starts');
    ok(SLOTS.every(s => c.roster[s] && c.roster[s].a), 'roster intact after offseason');
    const ids = SLOTS.map(s => c.roster[s].id);
    ok(new Set(ids).size === ids.length, `unique player ids ${ids}`);
  }
  JSON.parse(JSON.stringify(c));
}

// ------------------------------------------------ matches with a bot quarterback
function playMatch(seed, quarter = 4) {
  const c = newCareer('KC', 'bot', seed);
  const roster = {};
  for (const s of SLOTS) roster[s] = active(c, s);
  const opp = c.teams.SEA;
  const m = new Match({ us: teamById('KC'), them: teamById('SEA'), roster, oppRating: opp, ourDef: teamRatings(c).def, quarter, seed, facilities: c.facilities });
  m.coinToss();
  let t = 0, plays = 0, passes = 0, comps = 0, runs = 0;
  const dt = 1 / 60;
  let plan = null;
  while (m.stage !== 'final' && t < 3600) {
    t += dt;
    const P = m.play;
    if (m.stage === 'presnap') { m.snap(); plays++; plan = { run: m.rand() < 0.35, throwAt: 1.0 + m.rand() * 1.4 }; }
    else if (m.stage === 'live' && P) {
      if (!P.carrier && !P.thrown) {
        if (plan.run && P.handoffOpen && P.t > 0.5) { if (handoff(m)) runs++; }
        else if (P.t > plan.throwAt) {
          // throw to the most open receiver
          const recs = P.o.filter(o => ['WR', 'TE', 'RB'].includes(o.role));
          let best = null, bs = -1;
          for (const r of recs) {
            const sep = Math.min(...P.d.map(d => Math.hypot(d.x - r.x, d.y - r.y)));
            const sc = sep + (r.x - m.los) * 0.05;
            if (sc > bs) { bs = sc; best = r; }
          }
          const T = flightTime(P.qb.p, Math.hypot(best.x - P.qb.x, best.y - P.qb.y));
          setAim(m, best.x + best.vx * T, best.y + best.vy * T);
          if (throwBall(m)) passes++;
        }
      } else if (P.carrier) {
        // steer away from the nearest defender
        const c0 = P.carrier;
        const near = P.d.reduce((a, b) => (Math.hypot(b.x - c0.x, b.y - c0.y) < Math.hypot(a.x - c0.x, a.y - c0.y) ? b : a));
        P.intent.vy = near.y > c0.y ? -0.6 : 0.6;
        if (m.toGo < 2 && c0.x > m.fd - 1.5 && c0.x < m.fd) dive(m);
      }
    } else if (m.stage === 'fourth') m.fourthChoice(m.canKickFG() && m.fgDistance() < 48 ? 'fg' : m.toGo <= 2 ? 'go' : 'punt');
    else if (m.stage === 'pat') m.patChoice('kick');
    else if (m.stage === 'kick' && m.kick.phase === 'aim') m.kickRelease(0, Math.min(1, m.kick.distance / m.kick.maxRange + 0.15));
    else if (m.stage === 'opp-wait') m.oppContinue();
    const before = P && P.carrier;
    m.update(dt);
    if (P && !before && P.carrier && P.catchX !== undefined) comps++;
  }
  let ry = 0, py = 0, ints = 0;
  for (const st of Object.values(m.stats)) { ry += st.ry || 0; py += st.py || 0; ints += st.int || 0; }
  return { m, t, plays, passes, comps, runs, ry, py, ints };
}

const N = +(process.argv[2] || 24);
let tot = { us: 0, them: 0, plays: 0, passes: 0, comps: 0, t: 0, runs: 0, ry: 0, py: 0, ints: 0 }, finals = 0;
for (let i = 1; i <= N; i++) {
  const r = playMatch(i * 7919);
  ok(r.m.stage === 'final', `match ${i} ends (stage ${r.m.stage}, q${r.m.q} ${r.m.clock})`);
  if (r.m.stage === 'final') finals++;
  ok(r.m.score.us >= 0 && r.m.score.us < 100 && r.m.score.them < 100, `sane score ${r.m.score.us}-${r.m.score.them}`);
  tot.us += r.m.score.us; tot.them += r.m.score.them; tot.plays += r.plays; tot.passes += r.passes; tot.comps += r.comps; tot.t += r.t; tot.runs += r.runs; tot.ry += r.ry; tot.py += r.py; tot.ints += r.ints;
}
console.log(`matches: ${finals}/${N} finished · avg score ${(tot.us / N).toFixed(1)}-${(tot.them / N).toFixed(1)} · ${(tot.plays / N).toFixed(0)} plays · ` +
  `${(tot.comps / Math.max(1, tot.passes) * 100).toFixed(0)}% completions · ${(tot.t / N / 60).toFixed(1)} min of play time each\n` +
  `  runs ${(tot.ry / Math.max(1, tot.runs)).toFixed(1)} yds/carry · passes ${(tot.py / Math.max(1, tot.passes)).toFixed(1)} yds/att · ${(tot.ints / N).toFixed(1)} INT/game`);
if (fails) { console.error(`${fails} failure(s)`); process.exit(1); }
console.log('all good');
void slotPos;
