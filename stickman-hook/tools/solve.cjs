#!/usr/bin/env node
/* Autoplayer / solver for Stickman Hook levels.
 *
 * Beam search over press/release timings, using the real game physics
 * (js/physics.js). A node is the moment the stickman lets go of a rope; from
 * there it tries "wait w steps, press, hold h steps after grabbing, release"
 * for a grid of w and h, scores each result by how far right it can still
 * grab a hook (or finishes), and keeps the best few hundred distinct states.
 *
 *   node tools/solve.cjs            # solve every level, print times
 *   node tools/solve.cjs 7 12       # just levels 7 and 12 (1-based)
 *   node tools/solve.cjs --json     # also write tools/solutions.json
 *
 * Every plan found is re-checked with physics.replay() from a fresh sim, so a
 * "solved" level is solved by exactly the code the browser runs.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const P = require(path.join(__dirname, '..', 'js', 'physics.js'));
const LEVELS = require(path.join(__dirname, '..', 'js', 'levels.js')).LEVELS;

const WAITS = [0, 6, 12, 20, 30, 42, 56, 75, 100];
const HOLDS = [5, 9, 14, 19, 25, 31, 38, 45, 53, 61, 70, 80, 90, 101, 113, 126, 140,
  156, 173, 192, 214, 238, 265, 295, 330, 370, 420, 480, 560, 660];
const FLY = 220;          // steps of flight looked at to score a release
const MAX_STEPS = 120 * 90;

function flyEval(sim) {
  const c = P.cloneSim(sim);
  let best = -Infinity;
  for (let i = 0; i < FLY; i++) {
    P.step(c, false);
    if (c.state === 'won') return { won: true, extra: i + 1, score: Infinity };
    if (c.state !== 'play') break;
    if (P.candidateHook(c) >= 0 && c.x > best) best = c.x;
  }
  if (best === -Infinity) {
    if (c.state === 'play') best = c.x - 400; else return null;
  }
  return { won: false, score: best };
}

function key(s) {
  return [Math.round(s.x / 14), Math.round(s.y / 14), Math.round(s.vx / 50),
    Math.round(s.vy / 50), Math.round(s.t * 4), s.hook].join(',');
}

function solveLevel(level, beam) {
  const lv = P.compile(level);
  const wins = [];
  const win = (plan, steps) => wins.push({ plan: plan.map(p => p.slice()), steps });

  // Root: the start press (step 0) is held until the first grab.
  let root = P.createSim(lv);
  let frontier = [];
  {
    const s = root; let n = 0;
    P.step(s, true); n++;
    while (s.hook < 0 && s.state === 'play' && n < 150) { P.step(s, true); n++; }
    if (s.hook >= 0) {
      let hi = 0, held = n;
      while (hi < HOLDS.length && s.state === 'play') {
        P.step(s, true); n++;
        if (s.state === 'won') { win([[0, n]], n); break; }
        if (n - held === HOLDS[hi]) {
          hi++;
          const child = P.cloneSim(s);
          const ev = flyEval(child);
          if (ev) {
            const plan = [[0, n]];
            if (ev.won) win(plan, n + ev.extra);
            else frontier.push({ sim: child, n, plan, score: ev.score });
          }
        }
      }
    }
  }

  let depth = 0, extraDepth = -1;
  while (frontier.length && depth < 40) {
    depth++;
    const seen = new Map();
    for (const node of frontier) {
      for (const w of WAITS) {
        const s = P.cloneSim(node.sim); let n = node.n;
        for (let i = 0; i < w && s.state === 'play'; i++) { P.step(s, false); n++; }
        if (s.state === 'won') { win(node.plan, n); continue; }
        if (s.state !== 'play') continue;
        const press = n;
        let k = 0;
        while (s.hook < 0 && s.state === 'play' && k < 160) { P.step(s, true); n++; k++; }
        if (s.state === 'won') { win(node.plan.concat([[press, n]]), n); continue; }
        if (s.hook < 0) continue;
        const grabbed = n;
        let hi = 0;
        while (hi < HOLDS.length && s.state === 'play' && n < MAX_STEPS) {
          P.step(s, true); n++;
          if (s.state === 'won') { win(node.plan.concat([[press, n]]), n); break; }
          if (n - grabbed === HOLDS[hi]) {
            hi++;
            const child = P.cloneSim(s);
            const ev = flyEval(child);
            if (!ev) continue;
            const plan = node.plan.concat([[press, n]]);
            if (ev.won) { win(plan, n + ev.extra); continue; }
            const kk = key(child);
            const score = ev.score - n * 0.05;
            const prev = seen.get(kk);
            if (!prev || prev.score < score) seen.set(kk, { sim: child, n, plan, score });
          }
        }
      }
    }
    if (wins.length && extraDepth < 0) extraDepth = depth + 1;
    if (extraDepth >= 0 && depth >= extraDepth) break;
    frontier = Array.from(seen.values()).sort((a, b) => b.score - a.score).slice(0, beam);
  }
  if (!wins.length) {
    const best = frontier.length ? frontier.reduce((a, b) => (a.score > b.score ? a : b)) : null;
    return { ok: false, reach: best ? Math.round(best.sim.x) : null, finishX: lv.finish.x };
  }
  wins.sort((a, b) => a.steps - b.steps);
  // Verify with an independent replay from a fresh sim.
  for (const w of wins) {
    const r = P.replay(level, w.plan, w.steps + 240);
    if (r.state === 'won') {
      return { ok: true, plan: w.plan, steps: r.steps, time: r.t, grabs: w.plan.length };
    }
  }
  return { ok: false, reach: null, note: 'replay mismatch' };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const pick = args.filter(a => /^\d+$/.test(a)).map(a => +a - 1);
  const idx = pick.length ? pick : LEVELS.map((_, i) => i);
  const out = {};
  let fails = 0;
  const t0 = Date.now();
  for (const i of idx) {
    const t1 = Date.now();
    let r = solveLevel(LEVELS[i], 60);
    if (!r.ok) r = solveLevel(LEVELS[i], 260);
    const ms = Date.now() - t1;
    if (r.ok) {
      out[i + 1] = { time: +r.time.toFixed(3), grabs: r.grabs, plan: r.plan };
      console.log(`level ${String(i + 1).padStart(2)} ${LEVELS[i].name.padEnd(18)} solved  ${r.time.toFixed(2)}s  ${r.grabs} grabs  (search ${ms} ms)`);
    } else {
      fails++;
      console.log(`level ${String(i + 1).padStart(2)} ${LEVELS[i].name.padEnd(18)} FAILED  reached x=${r.reach} of ${r.finishX} ${r.note || ''} (search ${ms} ms)`);
    }
  }
  console.log(`${idx.length - fails}/${idx.length} solved in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (json) fs.writeFileSync(path.join(__dirname, 'solutions.json'), JSON.stringify(out, null, 1));
  process.exitCode = fails ? 1 : 0;
}

if (require.main === module) main();
module.exports = { solveLevel };
