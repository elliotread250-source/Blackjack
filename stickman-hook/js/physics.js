/* Stickman Hook - deterministic gameplay physics.
 *
 * The gameplay body is a single point mass (the stickman's centre). The
 * ragdoll you see is cosmetic and is driven from this point (ragdoll.js), so
 * the rules here are small, deterministic and fast enough to brute-force
 * search in node (tools/solver). Works in the browser (window.SHPhys) and in
 * node (module.exports).
 *
 * Units: world pixels, seconds, y points down. One call to step() advances
 * exactly STEP seconds (1/120 s) as SUB smaller substeps, so the result never
 * depends on the screen's refresh rate.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SHPhys = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var C = {
    STEP: 1 / 120,      // one fixed step
    SUB: 2,             // substeps per step (240 Hz integration)
    G: 2000,            // gravity, px/s^2
    GRAB_R: 380,        // hook reach
    PLAYER_R: 18,       // collision radius of the body
    ROPE_MIN: 70,       // shortest rope
    ASSIST: 520,        // tangential swing assist while on the rope, px/s^2
    SWING_CAP: 1550,    // assist only pushes below this speed
    MAX_SPEED: 2700,    // hard speed cap
    START_VX: 380,      // hop off the start block
    START_VY: -720,
    IDLE_LIMIT: 1.6,    // seconds nearly still and off the rope -> restart
    FINISH_W: 320,
    PAD_W: 150,
    PAD_POWER: 1500,
    SPIN_THICK: 14
  };

  function num(v, d) { return typeof v === 'number' && isFinite(v) ? v : d; }

  /* Turn compact level data into the object form the sim uses. */
  function compile(L) {
    var lv = {
      name: L.name || '',
      hint: L.hint || '',
      par: num(L.par, 0),
      start: L.start ? [L.start[0], L.start[1]] : [0, 200],
      hooks: [], pads: [], blocks: [], spinners: [],
      finish: null, deathY: 0, minX: 0, maxX: 0, minY: 0
    };
    (L.hooks || []).forEach(function (h) {
      var m = h[2] || {};
      lv.hooks.push({
        x: h[0], y: h[1],
        ax: num(m.ax, 0), ay: num(m.ay, 0),
        per: num(m.per, 3), ph: num(m.ph, 0)
      });
    });
    (L.pads || []).forEach(function (p) {
      var a = num(p[3], 0) * Math.PI / 180;
      lv.pads.push({
        x: p[0], y: p[1], w: num(p[2], C.PAD_W), ang: a,
        power: num(p[4], C.PAD_POWER),
        tx: Math.cos(a), ty: Math.sin(a),       // along the surface
        nx: Math.sin(a), ny: -Math.cos(a)       // out of the surface
      });
    });
    (L.blocks || []).forEach(function (b) {
      lv.blocks.push({ x: b[0], y: b[1], w: b[2], h: b[3], bouncy: b[4] === 'bouncy' });
    });
    (L.spinners || []).forEach(function (s) {
      lv.spinners.push({
        x: s[0], y: s[1], len: s[2], speed: num(s[3], 1.5), ph: num(s[4], 0),
        bouncy: s[5] !== false
      });
    });
    var st = lv.start;
    // The start block the stickman stands on.
    lv.blocks.unshift({ x: st[0] - 70, y: st[1], w: 140, h: 260, bouncy: false, start: true });
    var f = L.finish || [st[0] + 1500, st[1]];
    lv.finish = { x: f[0], y: f[1], w: num(f[2], C.FINISH_W) };
    lv.blocks.push({ x: f[0], y: f[1], w: lv.finish.w, h: 320, bouncy: false, podium: true });

    var maxY = -1e9, minX = 1e9, maxX = -1e9, minY = 1e9;
    function ext(x, y) {
      if (y > maxY) maxY = y; if (y < minY) minY = y;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
    }
    lv.hooks.forEach(function (h) { ext(h.x - h.ax, h.y + Math.abs(h.ay) + 120); ext(h.x + h.ax, h.y - Math.abs(h.ay)); });
    lv.pads.forEach(function (p) { ext(p.x - p.w / 2, p.y); ext(p.x + p.w / 2, p.y); });
    lv.blocks.forEach(function (b) {
      if (b.start || b.podium) ext(b.x, b.y); else ext(b.x, b.y + b.h);
      ext(b.x + b.w, b.y);
    });
    lv.spinners.forEach(function (s) { ext(s.x - s.len / 2, s.y + s.len / 2); ext(s.x + s.len / 2, s.y - s.len / 2); });
    lv.deathY = maxY + 520;
    lv.minX = minX; lv.maxX = maxX; lv.minY = minY;
    return lv;
  }

  function createSim(level, opts) {
    var lv = level.hooks && level.finish && level.finish.w ? level : compile(level);
    opts = opts || {};
    return {
      lv: lv,
      assist: opts.assist === undefined ? C.ASSIST : opts.assist,
      state: 'ready',          // ready | play | won | dead
      t: 0, steps: 0,
      x: lv.start[0], y: lv.start[1] - C.PLAYER_R,
      vx: 0, vy: 0,
      hook: -1, rope: 0,
      holding: false,
      idle: 0,
      deadReason: '',
      padSquash: new Array(lv.pads.length).fill(0),
      events: []
    };
  }

  function cloneSim(s) {
    return {
      lv: s.lv, assist: s.assist, state: s.state, t: s.t, steps: s.steps,
      x: s.x, y: s.y, vx: s.vx, vy: s.vy, hook: s.hook, rope: s.rope,
      holding: s.holding, idle: s.idle, deadReason: s.deadReason,
      padSquash: s.padSquash.slice(), events: []
    };
  }

  function hookPos(sim, i, t) {
    var h = sim.lv.hooks[i];
    if (t === undefined) t = sim.t;
    if (!h.ax && !h.ay) return [h.x, h.y];
    var a = 2 * Math.PI * t / h.per + h.ph;
    return [h.x + h.ax * Math.sin(a), h.y + h.ay * Math.sin(a)];
  }
  function hookVel(sim, i) {
    var h = sim.lv.hooks[i];
    if (!h.ax && !h.ay) return [0, 0];
    var w = 2 * Math.PI / h.per, a = w * sim.t + h.ph, c = Math.cos(a) * w;
    return [h.ax * c, h.ay * c];
  }
  function spinnerAngle(sim, i, t) {
    var s = sim.lv.spinners[i];
    return s.ph + s.speed * (t === undefined ? sim.t : t);
  }

  /* The hook a press would grab right now, or -1. Hooks in front (in the
   * direction of travel) win; otherwise the nearest one in reach. */
  function candidateHook(sim) {
    var hooks = sim.lv.hooks, best = -1, bestD = 1e18, bestBack = -1, bestBackD = 1e18;
    var dir = sim.vx < -60 ? -1 : 1;
    var r2 = C.GRAB_R * C.GRAB_R;
    for (var i = 0; i < hooks.length; i++) {
      var p = hookPos(sim, i);
      var dx = p[0] - sim.x, dy = p[1] - sim.y, d = dx * dx + dy * dy;
      if (d > r2) continue;
      if (dx * dir >= -30) { if (d < bestD) { bestD = d; best = i; } }
      else if (d < bestBackD) { bestBackD = d; bestBack = i; }
    }
    return best >= 0 ? best : bestBack;
  }

  function start(sim) {
    if (sim.state !== 'ready') return;
    sim.state = 'play';
    sim.vx = C.START_VX; sim.vy = C.START_VY;
    sim.events.push({ type: 'jump' });
  }

  function attach(sim, i) {
    var p = hookPos(sim, i);
    sim.hook = i;
    sim.rope = Math.max(C.ROPE_MIN, Math.hypot(p[0] - sim.x, p[1] - sim.y));
    sim.events.push({ type: 'grab', hook: i });
  }
  function detach(sim) {
    sim.events.push({ type: 'release', hook: sim.hook, vx: sim.vx, vy: sim.vy });
    sim.hook = -1;
  }

  function collideBlock(sim, b, R) {
    var cx = sim.x < b.x ? b.x : sim.x > b.x + b.w ? b.x + b.w : sim.x;
    var cy = sim.y < b.y ? b.y : sim.y > b.y + b.h ? b.y + b.h : sim.y;
    var dx = sim.x - cx, dy = sim.y - cy, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return false;
    var nx, ny, pen;
    if (d2 > 1e-9) {
      var d = Math.sqrt(d2); nx = dx / d; ny = dy / d; pen = R - d;
    } else {
      // Centre inside the block: push out along the shallowest side.
      var l = sim.x - b.x, r = b.x + b.w - sim.x, t = sim.y - b.y, bo = b.y + b.h - sim.y;
      var m = Math.min(l, r, t, bo);
      if (m === t) { nx = 0; ny = -1; pen = t + R; }
      else if (m === bo) { nx = 0; ny = 1; pen = bo + R; }
      else if (m === l) { nx = -1; ny = 0; pen = l + R; }
      else { nx = 1; ny = 0; pen = r + R; }
    }
    sim.x += nx * pen; sim.y += ny * pen;
    var vn = sim.vx * nx + sim.vy * ny;
    if (vn < 0) {
      if (b.bouncy) {
        var out = Math.max(-vn * 1.0, 700);
        sim.vx += (out - vn) * nx; sim.vy += (out - vn) * ny;
        if (-vn > 120) sim.events.push({ type: 'boing', x: cx, y: cy, kind: 'wall' });
      } else {
        var e = 0.35;
        sim.vx -= (1 + e) * vn * nx; sim.vy -= (1 + e) * vn * ny;
        // a bit of friction along the surface
        var tx = -ny, ty = nx, vt = sim.vx * tx + sim.vy * ty;
        sim.vx -= vt * 0.02 * tx; sim.vy -= vt * 0.02 * ty;
        if (-vn > 250) sim.events.push({ type: 'thud', x: cx, y: cy, speed: -vn });
      }
    }
    return true;
  }

  function collidePad(sim, i, R) {
    var p = sim.lv.pads[i];
    var rx = sim.x - p.x, ry = sim.y - p.y;
    var along = rx * p.tx + ry * p.ty;
    if (along < -p.w / 2 - 4 || along > p.w / 2 + 4) return false;
    var d = rx * p.nx + ry * p.ny;
    if (d > R || d < -R - 16) return false;
    var vn = sim.vx * p.nx + sim.vy * p.ny;
    if (vn >= 0) return false;
    var out = Math.max(-vn * 0.85, p.power);
    sim.vx += (out - vn) * p.nx; sim.vy += (out - vn) * p.ny;
    sim.x += (R - d) * p.nx; sim.y += (R - d) * p.ny;
    sim.padSquash[i] = 1;
    sim.events.push({ type: 'boing', pad: i, x: p.x, y: p.y, kind: 'pad' });
    return true;
  }

  function collideSpinner(sim, i, R) {
    var s = sim.lv.spinners[i];
    var a = spinnerAngle(sim, i);
    var ux = Math.cos(a), uy = Math.sin(a), h = s.len / 2;
    var rx = sim.x - s.x, ry = sim.y - s.y;
    var along = rx * ux + ry * uy;
    if (along > h) along = h; else if (along < -h) along = -h;
    var px = s.x + ux * along, py = s.y + uy * along;
    var dx = sim.x - px, dy = sim.y - py, d2 = dx * dx + dy * dy;
    var rr = R + C.SPIN_THICK;
    if (d2 >= rr * rr) return false;
    var d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d;
    if (d2 < 1e-9) { nx = -uy; ny = ux; }
    sim.x += nx * (rr - d); sim.y += ny * (rr - d);
    // surface velocity of the bar at the contact point
    var svx = -s.speed * (py - s.y), svy = s.speed * (px - s.x);
    var rvx = sim.vx - svx, rvy = sim.vy - svy, vn = rvx * nx + rvy * ny;
    if (vn < 0) {
      var out = s.bouncy ? Math.max(-vn * 0.9, 650) : -vn * 0.4;
      sim.vx += (out - vn) * nx; sim.vy += (out - vn) * ny;
      sim.events.push({ type: 'boing', spinner: i, x: px, y: py, kind: 'spinner' });
    }
    return true;
  }

  function substep(sim, dt) {
    var lv = sim.lv, R = C.PLAYER_R;
    sim.t += dt;
    // energy at the start of the substep (see the rope projection below)
    var eStart = 0.5 * (sim.vx * sim.vx + sim.vy * sim.vy) - C.G * sim.y;
    sim.vy += C.G * dt;
    var ke0 = 0.5 * (sim.vx * sim.vx + sim.vy * sim.vy);
    if (sim.hook >= 0) {
      var hp = hookPos(sim, sim.hook);
      var rx = sim.x - hp[0], ry = sim.y - hp[1], rl = Math.hypot(rx, ry) || 1;
      if (sim.assist > 0 && rl >= sim.rope - 2) {
        // push along the swing, the way the stickman pumps on the rope
        var tx = -ry / rl, ty = rx / rl, vt = sim.vx * tx + sim.vy * ty;
        var sp = Math.hypot(sim.vx, sim.vy);
        if (sp < C.SWING_CAP && Math.abs(vt) > 20) {
          // (no push when nearly still, so it never balances against gravity)
          var dir = vt > 0 ? 1 : -1;
          sim.vx += tx * dir * sim.assist * dt; sim.vy += ty * dir * sim.assist * dt;
        }
      }
    }
    var sp2 = sim.vx * sim.vx + sim.vy * sim.vy;
    if (sp2 > C.MAX_SPEED * C.MAX_SPEED) {
      var k = C.MAX_SPEED / Math.sqrt(sp2); sim.vx *= k; sim.vy *= k;
    }
    eStart += 0.5 * (sim.vx * sim.vx + sim.vy * sim.vy) - ke0; // work done by the assist
    sim.x += sim.vx * dt; sim.y += sim.vy * dt;

    if (sim.hook >= 0) {
      var hp2 = hookPos(sim, sim.hook);
      var dx = sim.x - hp2[0], dy = sim.y - hp2[1], dl = Math.hypot(dx, dy);
      // The rope behaves like a light rod, as in the original: it never
      // stretches or goes slack, so you can loop right round the hook.
      if (dl > 1e-6) {
        var h = lv.hooks[sim.hook], still = !h.ax && !h.ay;
        var nx = dx / dl, ny = dy / dl;
        var hv = hookVel(sim, sim.hook);
        var vr = (sim.vx - hv[0]) * nx + (sim.vy - hv[1]) * ny;
        sim.x = hp2[0] + nx * sim.rope; sim.y = hp2[1] + ny * sim.rope;
        sim.vx -= vr * nx; sim.vy -= vr * ny;
        if (still) {
          // Tension does no work, so on a fixed hook the body keeps the
          // energy it had at the start of the substep (plus assist work);
          // without this the projection bleeds about 1% per swing.
          var ke = eStart + C.G * sim.y, sp = Math.hypot(sim.vx, sim.vy);
          if (ke > 0 && sp > 1e-6) {
            var k = Math.sqrt(2 * ke) / sp;
            if (k > 0.9 && k < 1.1) { sim.vx *= k; sim.vy *= k; }
          }
        }
      }
    }

    for (var b = 0; b < lv.blocks.length; b++) collideBlock(sim, lv.blocks[b], R);
    for (var p = 0; p < lv.pads.length; p++) collidePad(sim, p, R);
    for (var s = 0; s < lv.spinners.length; s++) collideSpinner(sim, s, R);
  }

  /* Advance one fixed step with the button held or not. */
  function step(sim, holding) {
    sim.holding = !!holding;
    if (sim.state === 'ready') {
      if (!holding) return sim;
      start(sim);
    }
    if (sim.state !== 'play') return sim;
    var lv = sim.lv;
    if (holding && sim.hook < 0) {
      var c = candidateHook(sim);
      if (c >= 0) attach(sim, c);
    } else if (!holding && sim.hook >= 0) {
      detach(sim);
    }
    var dt = C.STEP / C.SUB;
    for (var i = 0; i < C.SUB; i++) substep(sim, dt);
    sim.steps++;
    for (var q = 0; q < sim.padSquash.length; q++) if (sim.padSquash[q] > 0) sim.padSquash[q] = Math.max(0, sim.padSquash[q] - C.STEP * 4);

    // finish: touch the podium top / fly over it
    var f = lv.finish;
    if (sim.x >= f.x - 4 && sim.x <= f.x + f.w + 4 && sim.y <= f.y + 2) {
      sim.state = 'won';
      sim.events.push({ type: 'finish', t: sim.t });
      return sim;
    }
    if (sim.y > lv.deathY) {
      sim.state = 'dead'; sim.deadReason = 'fall';
      sim.events.push({ type: 'fall' });
      return sim;
    }
    if (sim.hook < 0 && sim.vx * sim.vx + sim.vy * sim.vy < 60 * 60) {
      sim.idle += C.STEP;
      if (sim.idle > C.IDLE_LIMIT) {
        sim.state = 'dead'; sim.deadReason = 'stuck';
        sim.events.push({ type: 'fall', stuck: true });
      }
    } else sim.idle = 0;
    return sim;
  }

  function energy(sim) {
    return 0.5 * (sim.vx * sim.vx + sim.vy * sim.vy) - C.G * sim.y;
  }

  /* Run a list of [pressStep, releaseStep] pairs (step indices from the start
   * press) and report how it went. Used by tests and the solver. */
  function replay(level, plan, maxSteps) {
    var sim = createSim(level);
    maxSteps = maxSteps || 120 * 120;
    var k = 0, held;
    step(sim, true); // the start press
    for (var n = 1; n < maxSteps && sim.state === 'play'; n++) {
      while (k < plan.length && n >= plan[k][1]) k++;
      held = k < plan.length && n >= plan[k][0] && n < plan[k][1];
      step(sim, held);
    }
    return sim;
  }

  return {
    C: C, compile: compile, createSim: createSim, cloneSim: cloneSim, step: step,
    start: start, hookPos: hookPos, hookVel: hookVel, spinnerAngle: spinnerAngle,
    candidateHook: candidateHook, energy: energy, replay: replay
  };
});
