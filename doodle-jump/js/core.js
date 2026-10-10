/* Doodle Jump - game logic.
 *
 * Pure simulation: no DOM, no canvas, no audio. Works in the browser (as
 * window.DJCore) and in node (module.exports) so the physics and the level
 * generator can be unit tested and run headless with an autopilot.
 *
 * Coordinates are canvas style: x to the right (0..W), y downward. Climbing
 * makes y more negative. The game runs at a fixed 60 steps a second; every
 * number below is "per step". The state is plain data (JSON-cloneable) and all
 * randomness comes from a seeded generator stored in the state, so a game is
 * fully deterministic given its seed and inputs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DJCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var W = 400;

  var P = {
    G: 0.4,            // gravity
    JUMP_V: -13,       // normal bounce
    SPRING_V: -21,     // spring
    TRAMP_V: -27,      // trampoline
    MAX_FALL: 16,
    ACC: 0.55,         // keyboard acceleration
    TURN_ACC: 1.05,    // acceleration when reversing
    MAXV: 6.2,         // max horizontal speed
    FRICTION: 0.86,    // horizontal damping with no input
    TILT_LERP: 0.2,    // analog steering responsiveness
    PROP_T: 170, PROP_V: -9,
    JET_T: 200, JET_V: -15,
    FOOT_HW: 12,       // half width of the feet for landing
    BODY_HW: 15,       // half width of the body for hits
    PH: 42,            // body height
    PLAT_W: 58, PLAT_H: 14,
    BULLET_V: -15, SHOOT_CD: 9, SHOOT_POSE: 16,
    CAM_FRAC: 0.42,    // camera keeps the player at or below this fraction of the view
    START_CAM: 0.8     // start platform sits this far down the view
  };

  var ITEM = {
    spring: { w: 18, h: 12 },
    trampoline: { w: 38, h: 11 },
    propeller: { w: 28, h: 20 },
    jetpack: { w: 26, h: 34 }
  };

  var MONSTER = {
    blob: { w: 46, h: 40, hp: 1 },
    bat: { w: 52, h: 32, hp: 1 },
    cyclops: { w: 42, h: 46, hp: 2 },
    big: { w: 78, h: 50, hp: 3 }
  };
  var HOLE_R = 30;
  var UFO = { w: 72, h: 30, hp: 3, beam: 150, beamTop: 14, beamBot: 42 };

  // ---- derived physics: jump height and horizontal reach ----------------
  function computeJumpHeight(v0) {
    var y = 0, vy = v0, top = 0;
    while (vy < 0) { vy += P.G; y += vy; if (y < top) top = y; }
    return -top;
  }
  var JUMP_HEIGHT = computeJumpHeight(P.JUMP_V);           // ~205 px
  var MAXGAP = Math.floor(JUMP_HEIGHT * 0.86);             // generator never exceeds this

  // REACH[dy] = horizontal distance coverable (from a standstill, under full
  // acceleration) between bouncing and falling back down through height dy.
  var REACH = (function () {
    var out = [];
    for (var dy = 0; dy <= Math.ceil(JUMP_HEIGHT); dy++) {
      var y = 0, vy = P.JUMP_V, t = 0, ok = false;
      while (t < 400) {
        vy += P.G; y += vy; t++;
        if (vy > 0 && y >= -dy) { ok = true; break; }
      }
      if (!ok) { out.push(-1); continue; }
      var x = 0, v = 0;
      for (var i = 0; i < t; i++) { v = Math.min(v + P.ACC, P.MAXV); x += v; }
      out.push(x);
    }
    return out;
  })();
  function allowedDx(dy) {
    dy = Math.max(0, Math.round(dy));
    if (dy >= REACH.length || REACH[dy] < 0) return 0;
    return Math.min(W / 2, REACH[dy] * 0.65 + 20);
  }
  // largest gap from which any x on the screen is reachable (wrap = max 200 away)
  var SAFE_ANY = (function () {
    var best = 0;
    for (var dy = 0; dy < REACH.length; dy++) if (allowedDx(dy) >= W / 2) best = dy;
    return best;
  })();

  // ---- helpers ------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function wrapX(x) { x %= W; return x < 0 ? x + W : x; }
  function wrapDx(a, b) { var d = (a - b) % W; if (d > W / 2) d -= W; if (d < -W / 2) d += W; return d; }
  function rnd(g) {
    var t = (g.rs = (g.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function difficulty(climb) { return clamp((climb - 600) / 28000, 0, 1); }

  // ---- entity factories -----------------------------------------------------
  function addPlatform(g, o) {
    var p = {
      id: g.nextId++, kind: o.kind || 'normal',
      x: o.x, y: o.y, ox: o.x, oy: o.y,
      vx: o.vx || 0, baseY: o.y, amp: o.amp || 0, phase: o.phase || 0, w8: o.w8 || 0,
      item: null, broken: false, breakT: 0, fading: false, fadeT: 0,
      bounced: 0, chain: !!o.chain, dead: false
    };
    if (o.item) addItem(g, p, o.item, o.itemOx);
    g.platforms.push(p);
    return p;
  }
  function addItem(g, plat, kind, ox) {
    var spec = ITEM[kind];
    var lim = (P.PLAT_W - spec.w) / 2 - 2;
    if (ox == null) ox = (rnd(g) * 2 - 1) * lim;
    plat.item = { kind: kind, ox: clamp(ox, -lim, lim), used: false, t: 0 };
    return plat.item;
  }
  function addMonster(g, o) {
    var spec = MONSTER[o.kind];
    var m = {
      id: g.nextId++, kind: o.kind, x: o.x, y: o.y, cx: o.x, cy: o.y, ox: o.x, oy: o.y,
      w: spec.w, h: spec.h, hp: spec.hp, range: o.range || 0, vx: o.vx || 0,
      phase: o.phase || 0, dead: false, vy: 0, seen: false, hitT: 0, stomped: false
    };
    g.monsters.push(m);
    return m;
  }
  function addHole(g, o) {
    var h = { id: g.nextId++, x: o.x, y: o.y, r: HOLE_R, seen: false };
    g.holes.push(h);
    return h;
  }
  function addUfo(g, o) {
    var u = {
      id: g.nextId++, x: o.x, y: o.y, cx: o.x, cy: o.y, ox: o.x, oy: o.y,
      w: UFO.w, h: UFO.h, hp: UFO.hp, phase: o.phase || 0, dead: false, vy: 0,
      seen: false, hitT: 0, stomped: false
    };
    g.ufos.push(u);
    return u;
  }

  // ---- game creation ---------------------------------------------------------
  function createGame(opts) {
    opts = opts || {};
    var viewH = opts.viewH || 700;
    var g = {
      W: W, viewH: viewH, rs: (opts.seed >>> 0) || 1, tick: 0, nextId: 1,
      startY: 0, camY: -viewH * P.START_CAM, ocamY: -viewH * P.START_CAM,
      score: 0, best: opts.best || 0, bestPassed: false, diffOffset: opts.diffOffset || 0,
      over: false, falling: false, fallT: 0, noGen: !!opts.empty,
      platforms: [], monsters: [], holes: [], ufos: [], bullets: [], debris: [],
      events: [],
      stats: { jumps: 0, kills: 0, shots: 0, powerups: 0 },
      player: {
        x: W / 2, y: 0, ox: W / 2, oy: 0, vx: 0, vy: P.JUMP_V, face: 1,
        squash: 0, shootT: 0, cd: 0, fly: null, flip: 0,
        dead: null, deadT: 0, ax: 0, ay: 0, spin: 0
      },
      gen: null
    };
    if (!g.noGen) {
      addPlatform(g, { x: W / 2, y: 0, kind: 'normal', chain: true });
      g.gen = { refY: 0, lastX: W / 2, lastKind: 'normal', prevKind: 'normal', topY: 0,
        lastHazard: -1e9, hazard: null, count: 0 };
      generate(g);
    }
    return g;
  }

  // ---- level generator ---------------------------------------------------------
  function pickKind(g, climb, d) {
    var r = rnd(g);
    var pMove = climb > 1500 ? lerp(0.08, 0.32, d) : 0;
    var pVanish = climb > 4000 ? lerp(0.05, 0.16, d) : 0;
    var pV = climb > 10000 ? lerp(0.04, 0.16, d) : 0;
    if (r < pMove) return 'moving';
    r -= pMove;
    if (r < pVanish) return 'vanish';
    r -= pVanish;
    if (r < pV) return 'vmoving';
    return 'normal';
  }

  function bandClear(g, x, y) {
    // true if a bounceable platform at (x, y) is far enough from the active hazard
    var hz = g.gen.hazard;
    if (!hz) return true;
    if (y < hz.y - 250 || y > hz.y + 260) return true;
    return Math.abs(wrapDx(x, hz.x)) >= hz.clear;
  }

  function genStep(g) {
    var gen = g.gen;
    var climb = g.startY - gen.refY + g.diffOffset;
    var d = difficulty(climb);
    var kind = pickKind(g, climb, d);
    var hz = gen.hazard;
    var inBand = hz && gen.refY - 30 > hz.y - 250;
    if (kind === 'moving' && inBand) kind = 'normal';

    var gmin = lerp(30, 100, d), gmax = lerp(78, MAXGAP, d);
    if (kind === 'moving' || gen.lastKind === 'moving') gmax = Math.min(gmax, SAFE_ANY);
    gmin = Math.min(gmin, gmax - 4);
    var gap = gmin + rnd(g) * (gmax - gmin);
    var amp = 0;
    if (kind === 'vmoving') {
      amp = Math.min(55, (gap - 26) / 2);
      if (amp < 16) { kind = 'normal'; amp = 0; }
    }
    // the gap is measured from the lowest point of the last chain platform to
    // the highest point of this one.
    var baseY = gen.refY - gap + amp;
    var topY = baseY - amp;

    var reach = allowedDx(gap);
    var x = gen.lastX;
    for (var i = 0; i < 30; i++) {
      var cx = P.PLAT_W / 2 + rnd(g) * (W - P.PLAT_W);
      if (Math.abs(wrapDx(cx, gen.lastX)) > reach) continue;
      if (!bandClear(g, cx, baseY)) continue;
      x = cx; break;
    }

    var o = { x: x, y: baseY, kind: kind, chain: true };
    if (kind === 'moving') {
      var sp = lerp(0.9, 2.3, d) * (0.8 + rnd(g) * 0.4);
      o.vx = rnd(g) < 0.5 ? -sp : sp;
    } else if (kind === 'vmoving') {
      o.amp = amp; o.phase = rnd(g) * Math.PI * 2; o.w8 = Math.min(0.035, 1.3 / amp);
    }
    if (kind === 'normal' || kind === 'moving') {
      var r = rnd(g);
      if (climb > 250 && r < 0.055) o.item = 'spring';
      else if (climb > 2500 && r < 0.068) o.item = 'trampoline';
      else if (climb > 1200 && r < 0.085) o.item = 'propeller';
      else if (climb > 5000 && r < 0.093) o.item = 'jetpack';
    }
    var lo = gen.refY;
    var plat = addPlatform(g, o);

    // extras in the gap below the new chain platform (decoys and freebies)
    var span = lo - topY;
    if (span > 60) {
      if (climb > 700 && rnd(g) < lerp(0.2, 0.55, d)) addExtra(g, lo, topY, 'breaking');
      if (span > 85 && rnd(g) < (1 - d) * (1 - d) * 0.6) addExtra(g, lo, topY, 'normal');
      if (d > 0.35 && span > 85 && rnd(g) < 0.12) addExtra(g, lo, topY, 'vanish');
    }

    gen.prevKind = gen.lastKind;
    gen.prevX = gen.lastX;
    gen.refY = baseY + amp;
    gen.lastX = x;
    gen.lastKind = kind;
    gen.topY = Math.min(gen.topY, topY);
    gen.count++;
    if (hz && topY < hz.y - 300) gen.hazard = null;

    maybeHazard(g, plat, climb, d);
  }

  function addExtra(g, lo, hi, kind) {
    var y = lo - (lo - hi) * (0.3 + 0.4 * rnd(g));
    var x = P.PLAT_W / 2 + rnd(g) * (W - P.PLAT_W);
    if (kind !== 'breaking' && !bandClear(g, x, y)) return;
    addPlatform(g, { x: x, y: y, kind: kind });
  }

  function maybeHazard(g, plat, climb, d) {
    var gen = g.gen;
    if (gen.hazard || climb < 1800) return;
    if (climb - gen.lastHazard < lerp(1100, 480, d)) return;
    if (plat.kind === 'moving' || gen.prevKind === 'moving') return;
    if (rnd(g) > lerp(0.4, 0.75, d)) return;

    var types = [['blob', 3]];
    if (climb > 3500) types.push(['bat', 3]);
    if (climb > 5000) types.push(['cyclops', 2]);
    if (climb > 8000) types.push(['big', 2]);
    if (climb > 6500) types.push(['hole', 2]);
    if (climb > 10000) types.push(['ufo', 1.5]);
    var tot = 0, i;
    for (i = 0; i < types.length; i++) tot += types[i][1];
    var r = rnd(g) * tot, type = types[0][0];
    for (i = 0; i < types.length; i++) { r -= types[i][1]; if (r <= 0) { type = types[i][0]; break; } }

    var hy = (plat.baseY - plat.amp) - (62 + rnd(g) * 50);
    var margin = type === 'big' ? 42 : type === 'ufo' ? 40 : 34;
    var hx = clamp(wrapX(plat.x + W / 2 + (rnd(g) - 0.5) * 40), margin, W - margin);
    var clear = type === 'bat' ? 150 : type === 'big' ? 140 : type === 'hole' ? 140 : type === 'ufo' ? 150 : 115;

    // everything bounceable near (and below) the hazard must be far from it
    // (optional extra platforms that are still off screen are simply dropped)
    var drop = [];
    for (i = 0; i < g.platforms.length; i++) {
      var p = g.platforms[i];
      if (p.kind === 'breaking' || p.dead) continue;
      var dx = Math.abs(wrapDx(p.x, hx));
      var near = p.y > hy - 260 && p.y < hy + 300;
      var spring = p.item && (p.item.kind === 'spring' || p.item.kind === 'trampoline') &&
          p.y > hy && p.y < hy + 960 && Math.abs(wrapDx(p.x + p.item.ox, hx)) < clear;
      if ((near && (p.kind === 'moving' || dx < clear)) || spring) {
        if (p.chain || p.y > g.camY - 30) return;
        drop.push(p);
      }
    }
    for (i = 0; i < drop.length; i++) drop[i].gone = true;
    if (drop.length) g.platforms = g.platforms.filter(function (q) { return !q.gone; });

    if (type === 'hole') addHole(g, { x: hx, y: hy });
    else if (type === 'ufo') addUfo(g, { x: hx, y: hy - 10, phase: rnd(g) * 6.28 });
    else {
      var mo = { kind: type, x: hx, y: hy, phase: rnd(g) * 6.28 };
      if (type === 'bat') { mo.range = 40; mo.vx = (rnd(g) < 0.5 ? -1 : 1) * lerp(0.8, 1.6, d); }
      addMonster(g, mo);
    }
    gen.hazard = { x: hx, y: hy, clear: clear, type: type };
    gen.lastHazard = climb;
  }

  function generate(g) {
    if (g.noGen) return;
    var guard = 0;
    while (g.gen.topY > g.camY - 260 && guard++ < 200) genStep(g);
  }

  function cull(g) {
    var lim = g.camY + g.viewH + 900;
    var keep = function (e) { return e.y < lim && !e.gone; };
    g.platforms = g.platforms.filter(keep);
    g.monsters = g.monsters.filter(keep);
    g.holes = g.holes.filter(keep);
    g.ufos = g.ufos.filter(keep);
    g.debris = g.debris.filter(keep);
  }

  // ---- simulation step ------------------------------------------------------------
  function ev(g, type, extra) {
    var e = extra || {};
    e.type = type;
    g.events.push(e);
  }

  function boxHit(ax, ay1, ay2, ahw, m) {
    // player box (centre x, top ay1, bottom ay2, half width) vs entity centred box
    if (Math.abs(wrapDx(ax, m.x)) > ahw + m.w / 2) return false;
    return ay2 > m.y - m.h / 2 && ay1 < m.y + m.h / 2;
  }

  function step(g, input) {
    input = input || {};
    g.events.length = 0;
    g.tick++;
    var t = g.tick, p = g.player, i;

    // previous positions for render interpolation
    p.ox = p.x; p.oy = p.y; g.ocamY = g.camY;

    // platforms
    for (i = 0; i < g.platforms.length; i++) {
      var pl = g.platforms[i];
      pl.ox = pl.x; pl.oy = pl.y;
      if (pl.kind === 'moving' && !pl.broken) {
        pl.x += pl.vx;
        var hw = P.PLAT_W / 2;
        if (pl.x < hw) { pl.x = 2 * hw - pl.x; pl.vx = Math.abs(pl.vx); }
        if (pl.x > W - hw) { pl.x = 2 * (W - hw) - pl.x; pl.vx = -Math.abs(pl.vx); }
      } else if (pl.kind === 'vmoving') {
        pl.y = pl.baseY + Math.sin(pl.phase + t * pl.w8) * pl.amp;
      }
      if (pl.broken) { pl.breakT++; pl.y += Math.min(14, pl.breakT * 0.5); if (pl.breakT > 70) pl.gone = true; }
      if (pl.fading) { pl.fadeT++; if (pl.fadeT > 24) pl.gone = true; }
      if (pl.item && pl.item.t > 0) pl.item.t--;
    }
    // monsters
    for (i = 0; i < g.monsters.length; i++) {
      var m = g.monsters[i];
      m.ox = m.x; m.oy = m.y;
      if (m.hitT > 0) m.hitT--;
      if (m.dead) { m.vy = Math.min(m.vy + P.G, 14); m.y += m.vy; if (m.y > g.camY + g.viewH + 120) m.gone = true; continue; }
      if (m.kind === 'bat') {
        m.x += m.vx;
        if (m.x < m.cx - m.range) { m.x = m.cx - m.range; m.vx = Math.abs(m.vx); }
        if (m.x > m.cx + m.range) { m.x = m.cx + m.range; m.vx = -Math.abs(m.vx); }
        m.y = m.cy + Math.sin(t * 0.08 + m.phase) * 6;
      } else if (m.kind === 'cyclops') {
        m.y = m.cy + Math.sin(t * 0.05 + m.phase) * 18;
      }
    }
    for (i = 0; i < g.ufos.length; i++) {
      var u = g.ufos[i];
      u.ox = u.x; u.oy = u.y;
      if (u.hitT > 0) u.hitT--;
      if (u.dead) { u.vy = Math.min(u.vy + P.G, 14); u.y += u.vy; if (u.y > g.camY + g.viewH + 120) u.gone = true; continue; }
      u.x = u.cx + Math.sin(t * 0.02 + u.phase) * 16;
      u.y = u.cy + Math.sin(t * 0.06 + u.phase) * 4;
    }
    for (i = 0; i < g.debris.length; i++) {
      var db = g.debris[i];
      db.vy = Math.min(db.vy + P.G, 14); db.x += db.vx; db.y += db.vy; db.rot += db.vr;
      if (db.y > g.camY + g.viewH + 80) db.gone = true;
    }

    updatePlayer(g, input);
    updateBullets(g);

    // camera, score
    if (!p.dead && !g.falling) {
      var target = p.y - g.viewH * P.CAM_FRAC;
      if (target < g.camY) g.camY = target;
      var sc = Math.floor(g.startY - p.y);
      if (sc > g.score) {
        g.score = sc;
        if (g.best > 0 && !g.bestPassed && g.score > g.best) { g.bestPassed = true; ev(g, 'best'); }
      }
    }

    // first sightings
    var top = g.camY, bot = g.camY + g.viewH;
    var sight = function (list, type) {
      for (var k = 0; k < list.length; k++) {
        var e = list[k];
        if (!e.seen && !e.dead && e.y + 20 > top && e.y - 20 < bot) { e.seen = true; ev(g, type, { x: e.x }); }
      }
    };
    sight(g.monsters, 'monster');
    sight(g.ufos, 'ufo');
    sight(g.holes, 'hole');

    // falling off the bottom
    if (!g.falling && !g.over && !p.fly && (p.dead === null || p.dead === 'hit') && p.y - P.PH > g.camY + g.viewH + 10) {
      g.falling = true; g.fallT = 0; ev(g, 'fall');
    }
    if (g.falling && !g.over) {
      g.fallT++;
      if (g.fallT < 50) {
        var ct = p.y - g.viewH * 0.45;
        if (ct > g.camY) g.camY += Math.min(ct - g.camY, 26);
      }
      if (g.fallT >= 80) { g.over = true; ev(g, 'over'); }
    }

    if (!g.falling) { generate(g); if (t % 30 === 0) cull(g); }
  }

  function startFly(g, kind) {
    var p = g.player;
    p.fly = { kind: kind, t: kind === 'jetpack' ? P.JET_T : P.PROP_T, dur: kind === 'jetpack' ? P.JET_T : P.PROP_T };
    p.shootT = 0;
    g.stats.powerups++;
    ev(g, kind);
  }

  function die(g, how, ref) {
    var p = g.player;
    p.dead = how; p.deadT = 0; p.fly = null; p.shootT = 0;
    if (ref) { p.ax = ref.x; p.ay = ref.y; }
    if (how === 'hit') { p.vy = Math.max(p.vy, 1); p.vx *= 0.3; }
    ev(g, how === 'hit' ? 'hurt' : how === 'hole' ? 'suck' : 'abduct');
  }

  function updatePlayer(g, input) {
    var p = g.player, i;
    if (p.squash > 0) p.squash--;
    if (p.shootT > 0) p.shootT--;
    if (p.cd > 0) p.cd--;
    if (p.flip > 0) p.flip--;

    if (p.dead === 'hole' || p.dead === 'ufo') {
      p.deadT++;
      var k = p.dead === 'hole' ? 0.12 : 0.08;
      p.x += wrapDx(p.ax, p.x) * k;
      p.y += (p.ay + (p.dead === 'ufo' ? 6 : 0) - p.y) * k;
      p.spin += p.dead === 'hole' ? 0.35 : 0.05;
      if (p.deadT >= (p.dead === 'hole' ? 56 : 70) && !g.over) { g.over = true; ev(g, 'over'); }
      return;
    }

    var alive = !p.dead && !g.falling;
    // ---- horizontal control
    if (alive) {
      var dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (input.axis != null && !dir) {
        var a = clamp(input.axis, -1, 1);
        p.vx += (a * P.MAXV - p.vx) * P.TILT_LERP;
        if (Math.abs(a) > 0.12) p.face = a > 0 ? 1 : -1;
      } else if (dir) {
        var acc = (p.vx * dir < 0) ? P.TURN_ACC : P.ACC;
        p.vx = clamp(p.vx + dir * acc, -P.MAXV, P.MAXV);
        p.face = dir;
      } else {
        p.vx *= P.FRICTION;
        if (Math.abs(p.vx) < 0.05) p.vx = 0;
      }
    } else {
      p.vx *= 0.97;
    }
    p.x = wrapX(p.x + p.vx);

    // ---- vertical
    if (p.fly) {
      var fv = p.fly.kind === 'jetpack' ? P.JET_V : P.PROP_V;
      var ramp = 0.2;
      p.vy += (fv - p.vy) * ramp;
      p.fly.t--;
      if (p.fly.t <= 0) {
        g.debris.push({ kind: p.fly.kind, x: p.x - p.face * (p.fly.kind === 'jetpack' ? 16 : 0), y: p.y - (p.fly.kind === 'jetpack' ? 20 : 44),
          vx: -p.face * 1.6, vy: -3, rot: 0, vr: -p.face * 0.12 });
        p.fly = null;
        ev(g, 'flyEnd');
      }
    } else {
      p.vy = Math.min(p.vy + P.G, P.MAX_FALL);
    }
    var prevY = p.y;
    p.y += p.vy;

    if (!alive) { if (p.dead === 'hit') p.spin += 0.2; return; }

    // ---- shooting
    if (input.shoot && p.cd === 0 && !p.fly) {
      g.bullets.push({ x: p.x, y: p.y - P.PH - 14, vy: P.BULLET_V });
      p.cd = P.SHOOT_CD; p.shootT = P.SHOOT_POSE;
      g.stats.shots++;
      ev(g, 'shoot');
    }

    // ---- platforms
    if (!p.fly && p.vy > 0) {
      var land = null;
      for (i = 0; i < g.platforms.length; i++) {
        var pl = g.platforms[i];
        if (pl.broken || pl.fading || pl.gone) continue;
        if (Math.abs(wrapDx(p.x, pl.x)) > P.PLAT_W / 2 + P.FOOT_HW) continue;
        var relPrev = prevY - pl.oy, rel = p.y - pl.y;
        if (relPrev <= 0.01 && rel >= 0) {
          if (!land || pl.y < land.y) land = pl;
        }
      }
      if (land) {
        if (land.kind === 'breaking') {
          land.broken = true; land.breakT = 0;
          ev(g, 'break', { x: land.x, y: land.y });
          if (land.item) land.item = null;
        } else {
          var it = land.item, kindB = 'jump';
          p.y = land.y;
          if (it && !it.used && (it.kind === 'spring' || it.kind === 'trampoline') &&
              Math.abs(wrapDx(p.x, land.x + it.ox)) <= ITEM[it.kind].w / 2 + 10) {
            if (it.kind === 'spring') { p.vy = P.SPRING_V; kindB = 'spring'; }
            else { p.vy = P.TRAMP_V; kindB = 'trampoline'; p.flip = 60; }
            it.t = 14;
          } else {
            p.vy = P.JUMP_V;
          }
          p.squash = 7;
          land.bounced++;
          g.stats.jumps++;
          if (land.kind === 'vanish') { land.fading = true; land.fadeT = 0; ev(g, 'vanish', { x: land.x, y: land.y }); }
          ev(g, kindB, { x: p.x, y: p.y, plat: land.id });
        }
      }
    }

    // ---- power-up pickup (touching it from any side)
    if (!p.fly) {
      for (i = 0; i < g.platforms.length; i++) {
        var q = g.platforms[i];
        if (!q.item || q.item.used || q.broken || q.fading) continue;
        var ik = q.item.kind;
        if (ik !== 'propeller' && ik !== 'jetpack') continue;
        var spec = ITEM[ik];
        var ix = q.x + q.item.ox, iy = q.y - spec.h / 2;
        if (boxHit(p.x, p.y - P.PH, p.y, P.BODY_HW, { x: ix, y: iy, w: spec.w, h: spec.h })) {
          q.item.used = true;
          startFly(g, ik);
          break;
        }
      }
    }

    // ---- monsters and UFOs
    var foes = [g.monsters, g.ufos];
    for (var f = 0; f < 2; f++) {
      var list = foes[f];
      for (i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.dead) continue;
        if (!boxHit(p.x, p.y - P.PH, p.y, P.BODY_HW, m)) continue;
        if (p.fly) { killFoe(g, m, 'stomp'); continue; }
        var mtopPrev = m.oy - m.h / 2;
        if (p.vy > 0 && prevY <= mtopPrev + 14) {
          killFoe(g, m, 'stomp');
          p.vy = P.JUMP_V; p.squash = 7;
          p.y = Math.min(p.y, m.y - m.h / 2);
          g.stats.jumps++;
        } else {
          die(g, 'hit');
          return;
        }
      }
    }
    // UFO beam
    if (!p.fly) {
      for (i = 0; i < g.ufos.length; i++) {
        var u = g.ufos[i];
        if (u.dead) continue;
        var cy = p.y - P.PH / 2, dyb = cy - (u.y + u.h / 2);
        if (dyb > 0 && dyb < UFO.beam) {
          var half = lerp(UFO.beamTop, UFO.beamBot, dyb / UFO.beam);
          if (Math.abs(wrapDx(p.x, u.x)) < half + 4) { die(g, 'ufo', { x: u.x, y: u.y + 4 }); return; }
        }
      }
    }
    // black holes
    if (!p.fly) {
      for (i = 0; i < g.holes.length; i++) {
        var h = g.holes[i];
        var dx = wrapDx(p.x, h.x), dy = (p.y - P.PH / 2) - h.y;
        if (dx * dx + dy * dy < (h.r + 10) * (h.r + 10)) { die(g, 'hole', { x: h.x, y: h.y + P.PH / 2 }); return; }
      }
    }
  }

  function killFoe(g, m, how) {
    m.dead = true; m.vy = how === 'stomp' ? 2 : -3; m.stomped = how === 'stomp';
    g.stats.kills++;
    ev(g, how === 'stomp' ? 'stomp' : 'kill', { x: m.x, y: m.y });
  }

  function updateBullets(g) {
    var out = [];
    for (var i = 0; i < g.bullets.length; i++) {
      var b = g.bullets[i];
      b.y += b.vy;
      var hit = false;
      var foes = [g.monsters, g.ufos];
      for (var f = 0; f < 2 && !hit; f++) {
        for (var j = 0; j < foes[f].length; j++) {
          var m = foes[f][j];
          if (m.dead) continue;
          if (Math.abs(wrapDx(b.x, m.x)) < m.w / 2 + 4 && b.y < m.y + m.h / 2 && b.y > m.y - m.h / 2 - 16) {
            hit = true;
            m.hp--; m.hitT = 8;
            if (m.hp <= 0) killFoe(g, m, 'shot');
            else ev(g, 'hit', { x: m.x, y: m.y });
            break;
          }
        }
      }
      if (!hit && b.y > g.camY - 30) out.push(b);
    }
    g.bullets = out;
  }

  function setViewH(g, h) {
    // keep the bottom of the view anchored relative to the player when resizing
    var frac = (g.player.y - g.camY) / g.viewH;
    g.viewH = h;
    if (!g.falling && !g.over) {
      g.camY = g.player.y - frac * h;
      var lim = g.player.y - h * P.CAM_FRAC;
      if (g.camY > lim && g.player.vy < 0) g.camY = lim;
      g.ocamY = g.camY;
      generate(g);
    }
  }

  return {
    W: W, P: P, ITEM: ITEM, MONSTER: MONSTER, UFO: UFO, HOLE_R: HOLE_R,
    JUMP_HEIGHT: JUMP_HEIGHT, MAXGAP: MAXGAP, SAFE_ANY: SAFE_ANY, REACH: REACH,
    allowedDx: allowedDx, difficulty: difficulty, wrapX: wrapX, wrapDx: wrapDx,
    computeJumpHeight: computeJumpHeight,
    createGame: createGame, step: step, setViewH: setViewH,
    addPlatform: addPlatform, addItem: addItem, addMonster: addMonster, addHole: addHole, addUfo: addUfo,
    generate: generate
  };
});
