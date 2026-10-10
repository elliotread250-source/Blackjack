/* Pool bot.
 *
 * 1. Enumerate pots: every ball the bot may pot into every pocket, aimed with
 *    the ghost-ball method at the centre of the gap the knuckles leave for
 *    that approach angle. Blocked paths, impossible cuts and closed pocket
 *    angles are rejected; the rest get a make probability from the bot's own
 *    aim error, the cut angle, the distances and the pocket's tolerance.
 * 2. Refine: the best candidates are played out with the real physics engine
 *    at several paces and spins and judged by the real rules: potted and
 *    still at the table? where did the cue ball finish (next pot quality)?
 *    foul or in-off risk? what is left for the opponent if it misses?
 * 3. If nothing is worth taking on, play safe: soft contacts on legal balls
 *    that leave the opponent nothing (a snooker earns a bonus, since in pub
 *    rules it often wins two shots). When no legal ball can be seen at all,
 *    search kicks off the cushions.
 * Ball in hand is placed by scoring straight-ish positions behind each pot.
 * Difficulty = aim and pace error, candidates and variations considered,
 * position play, safety play and robustness checks.
 *
 * think() is a generator so the browser can spread the work over frames
 * (the cue visibly moves between candidates); node tests just drain it.
 */
(function (root) {
  'use strict';
  var P = root.PoolPhysics || (typeof require === 'function' ? require('./physics.js') : null);
  var Rl = root.PoolRules || (typeof require === 'function' ? require('./rules.js') : null);
  var R = P.R, D = P.D, L = P.L, W = P.W;
  var DEG = Math.PI / 180;

  var LEVELS = [
    { name: 'Easy', aim: 1.6 * DEG, pow: 0.15, cands: 3, spins: [[0, 0]], paces: [1.35], position: 0, safety: 0, mc: 0, top: 0, places: 2, pickNoise: 0.35 },
    { name: 'Medium', aim: 0.75 * DEG, pow: 0.08, cands: 5, spins: [[0, 0], [0, 0.45], [0, -0.45]], paces: [1.15, 1.7], position: 0.6, safety: 0.12, mc: 3, top: 2, places: 4, pickNoise: 0.08 },
    { name: 'Hard', aim: 0.32 * DEG, pow: 0.045, cands: 9, spins: [[0, 0], [0, 0.6], [0, -0.6], [0, 0.25], [0, -0.3]], paces: [1.05, 1.45, 2.1], position: 1, safety: 0.3, mc: 6, top: 4, places: 6, pickNoise: 0 },
    { name: 'Pro', aim: 0.17 * DEG, pow: 0.03, cands: 12, spins: [[0, 0], [0, 0.7], [0, -0.7], [0, 0.3], [0, -0.35], [0.5, 0.2], [-0.5, 0.2], [0.5, -0.4], [-0.5, -0.4]], paces: [1.0, 1.3, 1.75, 2.4], position: 1, safety: 0.38, mc: 10, top: 6, places: 8, pickNoise: 0 }
  ];
  var REF_AIM = 0.5 * DEG;     // how well the bot assumes its opponent aims

  function gauss(rng) {
    var u = 1 - rng(), v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function erf(x) {   // Abramowitz-Stegun 7.1.26
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }

  /** Is the segment A->B clear of every ball except skipA/skipB (with clearance)? */
  function pathClear(sim, ax, ay, bx, by, skipA, skipB, clear) {
    var dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    var c2 = clear * clear;
    for (var i = 0; i < 16; i++) {
      if (!sim.on[i] || i === skipA || i === skipB) continue;
      var px = sim.x[i] - ax, py = sim.y[i] - ay;
      var t = len2 > 0 ? (px * dx + py * dy) / len2 : 0;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      var qx = px - dx * t, qy = py - dy * t;
      if (qx * qx + qy * qy < c2) return false;
    }
    return true;
  }

  /** Best line for ball (bx,by) into pocket q: aim point, direction, half
   *  tolerance (m) and distance, or null if the knuckles close it. */
  function pocketLine(bx, by, q) {
    var p = P.POCKETS[q];
    var ax = p.ax, ay = p.ay;
    var ux, uy, d, tol = 0;
    for (var it = 0; it < 3; it++) {
      ux = ax - bx; uy = ay - by; d = Math.sqrt(ux * ux + uy * uy);
      if (d < 1e-6) return null;
      ux /= d; uy /= d;
      // approach angle against the pocket's axis
      if (ux * p.ux + uy * p.uy < (p.side ? 0.5 : 0.62)) return null;
      var nx = -uy, ny = ux;
      var lo = -1, hi = 1;
      for (var k = 0; k < 2; k++) {
        var kn = p.knuckles[k];
        var s = (kn.x - bx) * nx + (kn.y - by) * ny;
        var c = R + kn.r;
        if (s < 0) lo = Math.max(lo, s + c); else hi = Math.min(hi, s - c);
      }
      if (lo > 1 || hi < -1) return null;
      var width = hi - lo;
      if (width < -0.006) return null;
      var mid = (lo + hi) / 2;
      tol = Math.max(0.002, width / 2 + 0.004);
      ax += nx * mid; ay += ny * mid;
    }
    return { ax: ax, ay: ay, ux: ux, uy: uy, d: d, tol: tol };
  }

  /** All pots from cue position (cx,cy) on the given target balls. */
  function potOptions(sim, cx, cy, targets, sigma) {
    var out = [];
    for (var ti = 0; ti < targets.length; ti++) {
      var b = targets[ti];
      if (!sim.on[b]) continue;
      var bx = sim.x[b], by = sim.y[b];
      for (var q = 0; q < 6; q++) {
        var pl = pocketLine(bx, by, q);
        if (!pl) continue;
        var gx = bx - pl.ux * D, gy = by - pl.uy * D;
        if (gx < R * 0.98 || gx > L - R * 0.98 || gy < R * 0.98 || gy > W - R * 0.98) continue;
        var dx = gx - cx, dy = gy - cy, d1 = Math.sqrt(dx * dx + dy * dy);
        if (d1 < 1e-4) continue;
        dx /= d1; dy /= d1;
        var cut = dx * pl.ux + dy * pl.uy;        // cos of cut angle
        if (cut < 0.17) continue;                 // > ~80 degrees
        if (!pathClear(sim, cx, cy, gx, gy, 0, b, D * 0.995)) continue;
        if (!pathClear(sim, bx, by, pl.ax, pl.ay, b, 0, D * 0.995)) continue;
        // make probability for an aim error sigma
        var tolOb = pl.tol / pl.d;
        var dmax = tolOb * D * cut / Math.max(d1, 0.05);
        var prob = erf(dmax / (sigma * Math.SQRT2));
        prob *= 1 - 0.08 * Math.min(1, (d1 + pl.d) / 2.5);   // long shots need pace control too
        // pace: the object ball must reach the pocket
        var v0 = Math.sqrt((pl.d + 0.25) / 1.35) + 0.15;
        var vc = v0 / (Math.max(cut, 0.2) * (1 + P.E_BALL) / 2);
        var speed = Math.sqrt(vc * vc + 2 * 0.65 * d1);
        out.push({ ball: b, pocket: q, dx: dx, dy: dy, d1: d1, d2: pl.d, cut: cut, prob: prob, speed: speed, gx: gx, gy: gy });
      }
    }
    out.sort(function (a, b) { return b.prob - a.prob; });
    return out;
  }

  function targetsFor(st) { return Rl.potTargets(st); }

  /** How good is this layout for whoever is to play in state st (0..1)? */
  function layoutValue(sim, st, sigma) {
    if (st.winner >= 0) return 0;
    if (st.bih) return 0.85;
    if (!sim.on[0]) return 0.85;
    var opts = potOptions(sim, sim.x[0], sim.y[0], targetsFor(st), sigma);
    if (!opts.length) return 0;
    var v = opts[0].prob;
    if (opts.length > 1) v += 0.15 * opts[1].prob * (1 - v);
    return Math.min(1, v);
  }

  /** Can the player in st see any legal ball directly (not snookered)? */
  function canSeeLegal(sim, st) {
    if (!sim.on[0]) return true;
    for (var b = 1; b < 16; b++) {
      if (!sim.on[b] || !Rl.legalFirst(st, b)) continue;
      var dx = sim.x[b] - sim.x[0], dy = sim.y[b] - sim.y[0], d = Math.sqrt(dx * dx + dy * dy);
      var nx = -dy / d, ny = dx / d;
      for (var k = -1; k <= 1; k++) {
        var tx = sim.x[b] + nx * k * R * 0.9, ty = sim.y[b] + ny * k * R * 0.9;
        if (pathClear(sim, sim.x[0], sim.y[0], tx, ty, 0, b, D * 0.99)) return true;
      }
    }
    return false;
  }

  /** Score a simulated outcome from the shooter's point of view. */
  function scoreOutcome(st, res, after, lv) {
    var me = st.turn;
    if (res.rerack) return 0;
    if (res.winner === me) return 1000;
    if (res.winner >= 0) return -1000;
    var ns = res.state;
    if (res.foul) {
      var oppV = ns.bih ? 0.85 : layoutValue(after, ns, REF_AIM);
      return -170 - 70 * oppV * (ns.visits === 2 ? 1.6 : 1);
    }
    if (ns.turn === me) {
      var mine = layoutValue(after, ns, lv.aim);
      var base = res.visitUsed ? 25 : 100;
      if (Rl.onBlack(ns, me) && !Rl.onBlack(st, me)) base += 15;
      return base + 70 * lv.position * mine + 20 * (1 - lv.position) * mine + 6 * res.ownPotted;
    }
    var oppSt = ns;
    var opp = layoutValue(after, oppSt, REF_AIM);
    var s = -25 - 95 * opp;
    if (st.mode === 'pub' && !canSeeLegal(after, oppSt)) s += 45;   // snookered: likely foul -> 2 shots
    // fewer of the opponent's balls left is worse for us
    var og = ns.groups[1 - me];
    if (og) s -= 4 * (7 - Rl.remaining(ns, og));
    return s;
  }

  function simulate(base, place, dx, dy, power, sx, sy) {
    var s = base.clone();
    s.events = null;
    if (place) s.place(0, place[0], place[1]);
    s.strike(dx, dy, P.powerToSpeed(power), sx, sy);
    s.runToRest(20);
    return s;
  }

  function rotate(dx, dy, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [dx * c - dy * s, dx * s + dy * c];
  }

  /** Candidate spots for the cue ball when in hand. */
  function placements(sim, st, lv, rng) {
    var spots = [], baulk = st.baulk;
    var targets = targetsFor(st);
    var legalTargets = targets.filter(function (b) {
      return !(st.outOfBaulk && !st.free && sim.x[b] < P.BAULK_X);
    });
    function tryAdd(x, y) {
      if (P.validCueSpot(sim, x, y, baulk)) spots.push([x, y]);
    }
    for (var ti = 0; ti < legalTargets.length; ti++) {
      var b = legalTargets[ti];
      for (var q = 0; q < 6; q++) {
        var pl = pocketLine(sim.x[b], sim.y[b], q);
        if (!pl) continue;
        var gx = sim.x[b] - pl.ux * D, gy = sim.y[b] - pl.uy * D;
        var dists = [0.12, 0.25, 0.42];
        var angs = [0, 14 * DEG, -14 * DEG, 28 * DEG, -28 * DEG];
        for (var di = 0; di < dists.length; di++) for (var ai = 0; ai < angs.length; ai++) {
          var r = rotate(-pl.ux, -pl.uy, angs[ai]);
          tryAdd(gx + r[0] * dists[di], gy + r[1] * dists[di]);
        }
      }
    }
    // a coarse grid as a fallback (and the only option when baulk-bound far away)
    var maxX = baulk ? P.BAULK_X - R : L - R;
    for (var gxI = 0; gxI < 6; gxI++) for (var gyI = 0; gyI < 5; gyI++) {
      tryAdd(R + (maxX - R) * (gxI + 0.5) / 6, R + (W - 2 * R) * (gyI + 0.5) / 5);
    }
    return spots;
  }

  function breakShot(sim, st, lv, rng) {
    // cue in baulk, a little off centre, full ball on the apex
    var apex = -1, ax = 1e9;
    for (var b = 1; b < 16; b++) if (sim.on[b] && sim.x[b] < ax) { ax = sim.x[b]; apex = b; }
    var side = rng() < 0.5 ? -1 : 1;
    var place = P.nearestCueSpot(sim, P.BAULK_X * 0.6, W / 2 + side * (0.02 + rng() * 0.12), true);
    var dx = sim.x[apex] - place[0], dy = sim.y[apex] - place[1], d = Math.sqrt(dx * dx + dy * dy);
    return { place: place, dx: dx / d, dy: dy / d, power: lv.name === 'Easy' ? 0.85 : 0.97, sx: 0, sy: -0.15, kind: 'break', call: -1 };
  }

  /**
   * Plan a shot. opts: { level 0..3, rng, budget }.
   * Yields {dx, dy} hints while thinking; returns the shot:
   * { place|null, dx, dy, power, sx, sy, call, kind }.
   */
  function* think(sim0, st, opts) {
    var lv = LEVELS[Math.max(0, Math.min(3, opts.level | 0))];
    var rng = opts.rng || Math.random;
    var me = st.turn;
    var sim = sim0.clone();
    var plan;

    if (st.brk) {
      plan = breakShot(sim, st, lv, rng);
      yield { dx: plan.dx, dy: plan.dy, place: plan.place };
      return finalize(plan, lv, rng, st);
    }

    // --- where can the cue ball be?
    var spots = null;
    if (st.bih || !sim.on[0]) {
      var all = placements(sim, st, lv, rng);
      var ranked = [];
      for (var i = 0; i < all.length; i++) {
        var o = potOptions(sim, all[i][0], all[i][1], targetsFor(st), lv.aim);
        if (st.outOfBaulk && !st.free) o = o.filter(function (c) { return sim.x[c.ball] >= P.BAULK_X; });
        ranked.push({ spot: all[i], v: o.length ? o[0].prob + (o.length > 1 ? 0.1 * o[1].prob : 0) : 0 });
      }
      ranked.sort(function (a, b) { return b.v - a.v; });
      spots = ranked.slice(0, lv.places).map(function (r) { return r.spot; });
      if (!spots.length) spots = [P.nearestCueSpot(sim, P.BAULK_X / 2, W / 2, st.baulk)];
    }
    var origins = spots || [null];

    // --- pot candidates
    var cands = [];
    for (var oi = 0; oi < origins.length; oi++) {
      var sp = origins[oi];
      var cx = sp ? sp[0] : sim.x[0], cy = sp ? sp[1] : sim.y[0];
      var tmp = sim;
      if (sp) { tmp = sim.clone(); tmp.place(0, sp[0], sp[1]); }
      var os = potOptions(tmp, cx, cy, targetsFor(st), lv.aim);
      for (var k = 0; k < os.length; k++) {
        var c = os[k];
        if (st.outOfBaulk && !st.free && sim.x[c.ball] < P.BAULK_X) continue;
        c.place = sp;
        cands.push(c);
      }
    }
    cands.sort(function (a, b) { return b.prob - a.prob; });
    if (lv.pickNoise > 0) {
      // weaker bots misjudge which pot is easiest
      cands.forEach(function (c) { c.prob2 = c.prob * (1 + (rng() - 0.5) * 2 * lv.pickNoise); });
      cands.sort(function (a, b) { return b.prob2 - a.prob2; });
    }
    cands = cands.slice(0, lv.cands);

    // what a miss is worth (the second of two visits makes misses cheap)
    var missValue = st.visits >= 2 ? 15 : -60;

    var shots = [];
    var sims = 0;
    for (var ci = 0; ci < cands.length; ci++) {
      var cand = cands[ci];
      yield { dx: cand.dx, dy: cand.dy, place: cand.place };
      for (var si = 0; si < lv.spins.length; si++) {
        for (var pi = 0; pi < lv.paces.length; pi++) {
          var spd = Math.min(P.MAX_SPEED, cand.speed * lv.paces[pi]);
          var power = P.speedToPower(spd);
          var sx = lv.spins[si][0], sy = lv.spins[si][1];
          var call = cand.ball === 8 ? cand.pocket : -1;
          var after = simulate(sim, cand.place, cand.dx, cand.dy, power, sx, sy);
          sims++;
          var res = Rl.evaluate(st, after.summary(call));
          var sc = scoreOutcome(st, res, after, lv);
          var success = res.winner === me || (!res.foul && res.state.turn === me && !res.visitUsed);
          var p = cand.prob;
          var ev = success ? p * sc + (1 - p) * (missValue - (cand.ball === 8 ? 40 : 0)) : sc;
          ev -= 10 * power * power;     // hard hits are harder to control
          shots.push({ place: cand.place, dx: cand.dx, dy: cand.dy, power: power, sx: sx, sy: sy, call: call, kind: 'pot', ball: cand.ball, pocket: cand.pocket, ev: ev, raw: sc, success: success });
        }
      }
      if (sims > 6) yield { dx: cand.dx, dy: cand.dy, place: cand.place };
    }
    shots.sort(function (a, b) { return b.ev - a.ev; });

    // --- Monte Carlo: replay the best few with the bot's own execution error,
    // so shots that only work when perfect (or that risk the black) lose value
    if (lv.mc && shots.length) {
      var mrng = P.mulberry32(((sim.x[0] * 1e6) ^ (st.shots * 7919)) >>> 0);
      var top = shots.slice(0, lv.top);
      for (var ti = 0; ti < top.length; ti++) {
        var sh = top[ti], total = sh.ev;
        yield { dx: sh.dx, dy: sh.dy, place: sh.place };
        for (var m = 0; m < lv.mc; m++) {
          var dir = rotate(sh.dx, sh.dy, gauss(mrng) * lv.aim);
          var pw = Math.max(0.03, Math.min(1, sh.power * (1 + gauss(mrng) * lv.pow)));
          var a2 = simulate(sim, sh.place, dir[0], dir[1], pw, sh.sx, sh.sy);
          total += scoreOutcome(st, Rl.evaluate(st, a2.summary(sh.call)), a2, lv);
        }
        sh.ev = total / (lv.mc + 1) - 10 * sh.power * sh.power;
      }
      top.sort(function (a, b) { return b.ev - a.ev; });
      shots = top.concat(shots.slice(lv.top));
    }
    var best = shots.length ? shots[0] : null;
    var bestEV = best ? best.ev : -Infinity;

    // --- safety play / escapes
    var needEscape = !best;
    var wantSafety = lv.safety > 0 && (!best || bestEV < 100 * lv.safety * 0.6 + (st.visits >= 2 ? -200 : 0));
    if (needEscape || wantSafety) {
      var safe = yield* safeties(sim, st, lv, rng, origins);
      if (safe && (needEscape || safe.ev > bestEV)) { best = safe; bestEV = safe.ev; }
    }
    if (!best) {
      // nothing legal found: just hit the nearest legal ball
      best = fallback(sim, st, origins[0]);
    }
    return finalize(best, lv, rng, st);
  }

  function* safeties(sim, st, lv, rng, origins) {
    var best = null, bestEV = -Infinity;
    var powers = [0.22, 0.3, 0.4, 0.55];
    var nOrig = Math.min(origins.length, lv.name === 'Pro' ? 3 : 2);
    for (var oi = 0; oi < nOrig; oi++) {
      var sp = origins[oi];
      var cx = sp ? sp[0] : sim.x[0], cy = sp ? sp[1] : sim.y[0];
      var dirs = [];
      for (var b = 1; b < 16; b++) {
        if (!sim.on[b] || !Rl.legalFirst(st, b)) continue;
        if (st.outOfBaulk && !st.free && sim.x[b] < P.BAULK_X) continue;
        var dx = sim.x[b] - cx, dy = sim.y[b] - cy, d = Math.sqrt(dx * dx + dy * dy);
        var offs = lv.name === 'Medium' ? [0, 0.6] : [0, 0.5, -0.5, 0.85, -0.85];
        for (var k = 0; k < offs.length; k++) {
          var a = Math.asin(Math.max(-1, Math.min(1, offs[k] * D / d)));
          var r = rotate(dx / d, dy / d, a);
          dirs.push(r);
        }
      }
      // kicks: if no legal ball can be seen, try lots of directions off cushions
      var tmp = sim; if (sp) { tmp = sim.clone(); tmp.place(0, sp[0], sp[1]); }
      var tmpSt = Rl.clone(st); tmpSt.bih = false;
      if (!canSeeLegal(tmp, tmpSt) || !dirs.length) {
        var nk = lv.name === 'Easy' ? 24 : 72;
        for (var kk = 0; kk < nk; kk++) { var ang = (kk + 0.5) / nk * Math.PI * 2; dirs.push([Math.cos(ang), Math.sin(ang)]); }
        powers = [0.35, 0.5];
      }
      var count = 0;
      for (var di = 0; di < dirs.length; di++) {
        for (var pi = 0; pi < powers.length; pi++) {
          var after = simulate(sim, sp, dirs[di][0], dirs[di][1], powers[pi], 0, -0.1);
          var res = Rl.evaluate(st, after.summary(-1));
          var sc = scoreOutcome(st, res, after, lv);
          if (sc > bestEV) { bestEV = sc; best = { place: sp, dx: dirs[di][0], dy: dirs[di][1], power: powers[pi], sx: 0, sy: -0.1, call: -1, kind: 'safety', ev: sc }; }
          if (++count % 12 === 0) yield { dx: (best || { dx: dirs[di][0] }).dx, dy: (best || { dy: dirs[di][1] }).dy, place: sp };
        }
      }
    }
    if (best) best.ev = bestEV - 5;   // a pot of equal value is preferred
    return best;
  }

  function fallback(sim, st, sp) {
    var cx = sp ? sp[0] : sim.x[0], cy = sp ? sp[1] : sim.y[0];
    var bestD = Infinity, tx = cx + 0.3, ty = cy;
    for (var b = 1; b < 16; b++) {
      if (!sim.on[b] || !Rl.legalFirst(st, b)) continue;
      var d = Math.hypot(sim.x[b] - cx, sim.y[b] - cy);
      if (d < bestD) { bestD = d; tx = sim.x[b]; ty = sim.y[b]; }
    }
    var dx = tx - cx, dy = ty - cy, l = Math.hypot(dx, dy) || 1;
    return { place: sp, dx: dx / l, dy: dy / l, power: 0.45, sx: 0, sy: 0, call: -1, kind: 'fallback', ev: -500 };
  }

  /** Add the bot's human-like execution error. */
  function finalize(plan, lv, rng, st) {
    var err = gauss(rng) * lv.aim;
    var dir = rotate(plan.dx, plan.dy, err);
    var power = plan.power * (1 + gauss(rng) * lv.pow);
    power = Math.max(0.03, Math.min(1, power));
    var sx = Math.max(-1, Math.min(1, plan.sx + gauss(rng) * lv.pow * 0.5));
    var sy = Math.max(-1, Math.min(1, plan.sy + gauss(rng) * lv.pow * 0.5));
    return {
      place: plan.place || null, dx: dir[0], dy: dir[1], power: power, sx: sx, sy: sy,
      call: plan.call === undefined ? -1 : plan.call, kind: plan.kind, ball: plan.ball, pocket: plan.pocket,
      ev: plan.ev, aimDx: plan.dx, aimDy: plan.dy
    };
  }

  /** Run think() to completion (node / tests). */
  function plan(sim, st, opts) {
    var it = think(sim, st, opts), r;
    do { r = it.next(); } while (!r.done);
    return r.value;
  }

  var api = { LEVELS: LEVELS, think: think, plan: plan, potOptions: potOptions, pocketLine: pocketLine, layoutValue: layoutValue, pathClear: pathClear, canSeeLegal: canSeeLegal };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PoolBot = api;
})(typeof window !== 'undefined' ? window : globalThis);
