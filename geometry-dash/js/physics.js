/* Deterministic simulation core. Shared by the browser game and the Node
 * level verifier, so it must stay free of DOM and rendering code.
 *
 * Units: 1 block = 1 unit, time in seconds, y points up.
 * GD runs its player update on a 60Hz tick with values in "units per tick"
 * where a block is 30 units. Those constants are converted below so the
 * numbers stay recognisable: gravity 0.958199 u/tick², jump 11.180032 u/tick.
 */
(function (root) {
  'use strict';

  const TPS = 240;
  const DT = 1 / TPS;
  const TICK = 60;     // GD's logical tick rate
  const UNIT = 30;     // GD units per block

  const G = 0.958199 * TICK * TICK / UNIT;   // ~114.98 blocks/s²
  const JUMP = 11.180032 * TICK / UNIT;      // ~22.36 blocks/s
  // 0.5x, 1x, 2x, 3x, 4x in blocks per second
  const SPEEDS = [251.16, 311.58, 387.42, 468.0, 576.0].map((u) => u / UNIT);

  const MODES = ['cube', 'ship', 'ball', 'ufo', 'wave', 'robot', 'spider', 'swing'];

  // grav: gravity multiplier, term: max fall speed, bound: corridor height
  // (0 = free camera), slide: may rest against the ceiling without dying,
  // orb: how hard orbs/pads push this mode.
  const MODE_CFG = {
    cube:   { grav: 1.0,  term: 30,   bound: 0,  slide: false, orb: 1.0 },
    ship:   { grav: 0.4,  term: 12.8, bound: 10, slide: true,  orb: 0.6 }, // grav unused: see shipAccel
    ball:   { grav: 0.6,  term: 30,   bound: 8,  slide: true,  orb: 0.7 },
    ufo:    { grav: 0.5,  term: 16,   bound: 10, slide: true,  orb: 0.7 },
    wave:   { grav: 0,    term: 0,    bound: 10, slide: true,  orb: 0 },
    robot:  { grav: 1.0,  term: 30,   bound: 0,  slide: false, orb: 1.0 },
    spider: { grav: 1.0,  term: 30,   bound: 8,  slide: true,  orb: 1.0 },
    swing:  { grav: 0.4,  term: 12.8, bound: 10, slide: true,  orb: 0.7 }, // grav unused: see shipAccel
  };

  // Ship and swing follow GD's ship model: a base multiplier of 0.4 on
  // gravity, times 0.8 while falling, 1.2 while still rising with the button
  // released (so climbs bleed off fast), and -1 while holding, boosted to
  // 0.5 when holding against a fall (quick recovery). Speed caps are GD's
  // 8 u/tick up and 6.4 u/tick down.
  // GD's ship caps are 8 up / 6.4 down u/tick; the climb cap is trimmed to
  // 7.2 here for a flatter steepest climb.
  const SHIP_MAX_UP = 7.2 * TICK / UNIT;   // 14.4 blocks/s
  const SHIP_MAX_DOWN = 6.4 * TICK / UNIT; // 12.8 blocks/s
  const SWING_MAX = 7.2 * TICK / UNIT;     // 14.4 blocks/s: a steeper swing than the ship's fall
  const MINI_FLY = 1.2;                    // mini ship/swing: snappier caps

  // Acceleration in the gravity frame (+ = away from the floor).
  function shipAccel(vf, holding) {
    const falling = vf < 0;
    if (holding) return G * (falling ? 0.5 : 0.4);
    return -G * 0.4 * (falling ? 0.8 : 1.2);
  }
  const MINI_WAVE = 1.0; // GD's mini wave climbs at 2x; here it keeps the normal 45 degrees
  const UFO_JUMP = 14;
  const BALL_KICK = 0.3 * JUMP;
  const ROBOT_V = 12;
  const ROBOT_BOOST = 0.18;
  const MINI_JUMP = 0.8;

  const ORB = {
    // Dash orbs (Fingerdash): fly dead straight while the button stays held.
    dash:   { dash: true },
    dashp:  { dash: true, flip: true },
    yellow: { v: 1.0 },
    pink:   { v: 0.72 },
    red:    { v: 1.38 },
    blue:   { flip: true, v: -0.36 },
    green:  { flip: true, v: -1.0 }, // GD: flip and launch hard toward the new floor
    black:  { v: -1.34 },
  };
  const PAD = {
    yellow: { v: 1.43 },
    pink:   { v: 0.89 },
    red:    { v: 1.75 },
    blue:   { flip: true, v: -0.9 },
  };

  // ---------------------------------------------------------------- levels

  /* Turns a raw object list into a level with a spatial index. Objects:
   *   {t:'b', x,y,w,h}            solid block
   *   {t:'s', x,y,d}              spike, d = 1 floor / -1 hanging
   *   {t:'ss', x,y,d}             small spike
   *   {t:'pad', x,y,c,d}          jump pad
   *   {t:'orb', x,y,c}            jump orb (x,y = cell origin)
   *   {t:'p', x,y,h,k,b}          portal centred on y, h tall; k = mode | grav+ | grav- |
   *                               mini | big | s0..s4; b = [floor, ceil] override
   */
  function compile(def) {
    const objects = def.objects.map((o, i) => Object.assign({ id: i, w: 1, h: 1 }, o));
    let maxX = 0;
    for (const o of objects) maxX = Math.max(maxX, o.x + o.w);
    const length = def.length || Math.ceil(maxX + 10);
    const buckets = [];
    for (let i = 0; i <= length + 4; i++) buckets.push([]);
    for (const o of objects) {
      const a = Math.max(0, Math.floor(o.x));
      const b = Math.min(buckets.length - 1, Math.floor(o.x + o.w));
      for (let i = a; i <= b; i++) buckets[i].push(o);
    }
    return Object.assign({}, def, { objects, buckets, length, _stamp: 0 });
  }

  // Calls fn for every object whose bucket range touches [x0, x1].
  function near(L, x0, x1, fn) {
    const stamp = ++L._stamp;
    const a = Math.max(0, Math.floor(x0));
    const b = Math.min(L.buckets.length - 1, Math.floor(x1));
    for (let i = a; i <= b; i++) {
      const list = L.buckets[i];
      for (let j = 0; j < list.length; j++) {
        const o = list[j];
        if (o._q === stamp) continue;
        o._q = stamp;
        if (fn(o) === false) return;
      }
    }
  }

  // ----------------------------------------------------------------- state

  function create(L) {
    const mode = L.startMode || 'cube';
    return {
      x: 0, y: 0.5, vy: 0,
      mode,
      grav: 1, mini: !!L.startMini, speed: L.startSpeed == null ? 1 : L.startSpeed,
      grounded: true, held: false, buffer: false,
      boost: 0, bounds: boundsFor(mode, null), used: [], coins: [], dash: false,
      dead: false, won: false, t: 0,
      lit: [], tp: {}, tpDist: 0, auto: null,
    };
  }

  function clone(s) {
    const c = Object.assign({}, s);
    c.used = s.used.slice();
    c.coins = s.coins.slice();
    c.lit = s.lit.slice();
    c.tp = Object.assign({}, s.tp);
    c.bounds = s.bounds && { floor: s.bounds.floor, ceil: s.bounds.ceil };
    return c;
  }

  function size(s) {
    if (s.mode === 'wave') return s.mini ? 0.3 : 0.45;
    return s.mini ? 0.6 : 1;
  }

  function overlap(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
    return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
  }

  function hazardBox(o) {
    if (o.t === 's') {
      return o.d === -1
        ? [o.x + 0.38, o.y + 0.45, o.x + 0.62, o.y + 0.9]
        : [o.x + 0.38, o.y + 0.1, o.x + 0.62, o.y + 0.55];
    }
    return o.d === -1
      ? [o.x + 0.38, o.y + 0.7, o.x + 0.62, o.y + 0.95]
      : [o.x + 0.38, o.y + 0.05, o.x + 0.62, o.y + 0.3];
  }

  function boundsFor(mode, portal) {
    const cfg = MODE_CFG[mode];
    if (!cfg.bound) return null;
    if (portal && portal.b) return { floor: portal.b[0], ceil: portal.b[1] };
    return { floor: 0, ceil: cfg.bound };
  }

  function applyPortal(s, p) {
    const k = p.k;
    if (MODE_CFG[k]) {
      // A portal that changes your mode puts gravity back to normal, so a
      // flip from the section before can't carry over. A portal for the
      // mode you're already in leaves gravity alone (it used to reset it
      // every frame you were inside, eating swing clicks).
      if (s.mode !== k) {
        if (s.grav !== 1) { s.grav = 1; s.vy *= 0.5; }
        s.mode = k;
        s.vy *= 0.5;
        s.boost = 0;
        s.grounded = false;
      }
      s.bounds = boundsFor(k, p);
    } else if (k === 'auto') {
      // Scripted flight (Dash's "1" turning into a flying orb): the icon
      // follows a set path to x1, ignoring input, then becomes p.next.
      if (!s.auto) s.auto = { x0: p.x, x1: p.x1, y0: s.y, y1: p.y1, amp: p.amp || 0, waves: p.waves || 1, next: p.next || 'cube' };
    } else if (k === 'grav+') {
      if (s.grav !== -1) { s.grav = -1; s.vy *= 0.5; s.grounded = false; }
    } else if (k === 'grav-') {
      if (s.grav !== 1) { s.grav = 1; s.vy *= 0.5; s.grounded = false; }
    } else if (k === 'mini') {
      s.mini = true;
    } else if (k === 'big') {
      s.mini = false;
    } else if (k[0] === 's') {
      s.speed = +k.slice(1);
    }
  }

  // Applies an orb or pad push in the player's gravity frame.
  function push(s, fx) {
    const cfg = MODE_CFG[s.mode];
    if (fx.dash) {
      if (fx.flip) s.grav = -s.grav;
      s.dash = true; s.vy = 0; s.grounded = false; s.boost = 0;
      return;
    }
    if (s.mode === 'wave') {
      if (fx.flip) s.grav = -s.grav;
      return;
    }
    if (fx.flip) s.grav = -s.grav;
    const m = cfg.orb * (s.mini ? MINI_JUMP : 1);
    s.vy = fx.v * JUMP * m * s.grav;
    s.grounded = false;
    s.boost = 0;
  }

  // Spider teleport: snap to the nearest surface in the flipped direction.
  function spiderFlip(s, L) {
    const half = size(s) / 2;
    const ng = -s.grav;
    let best = ng === -1 ? Infinity : -Infinity;
    if (s.bounds) best = ng === -1 ? s.bounds.ceil : s.bounds.floor;
    else if (ng === 1) best = 0;
    const x0 = s.x - half + 0.02, x1 = s.x + half - 0.02;
    near(L, x0, x1, (o) => {
      if (o.t !== 'b' || o.x >= x1 || o.x + o.w <= x0) return;
      if (ng === -1 && o.y >= s.y + half - 0.01 && o.y < best) best = o.y;
      if (ng === 1 && o.y + o.h <= s.y - half + 0.01 && o.y + o.h > best) best = o.y + o.h;
    });
    s.grav = ng;
    s.vy = 0;
    if (isFinite(best)) {
      s.y = ng === -1 ? best - half : best + half;
      s.grounded = true;
      s.teleported = true;
    } else {
      s.grounded = false;
    }
  }

  function kill(s) { s.dead = true; }

  // ------------------------------------------------------------------ step

  function step(s, L, held) {
    if (s.dead || s.won) return;
    s.t += DT;
    s.teleported = false;
    if (s.auto) {
      const a = s.auto;
      s.x += SPEEDS[s.speed] * DT;
      const k = Math.min(1, (s.x - a.x0) / (a.x1 - a.x0));
      s.y = a.y0 + (a.y1 - a.y0) * (k * k * (3 - 2 * k)) + a.amp * Math.sin(k * Math.PI * 2 * a.waves);
      s.vy = 0; s.held = held;
      if (s.x >= a.x1) {
        s.auto = null; s.mode = a.next; s.bounds = boundsFor(a.next, null); s.grounded = false; s.grav = 1;
      }
      triggers(s, L);
      if (s.x >= L.length) s.won = true;
      return;
    }
    const press = held && !s.held;
    s.held = held;
    if (press) s.buffer = true;
    if (!held) s.buffer = false;

    let half = size(s) / 2;

    // Orbs take the click before the mode does.
    if (s.buffer) {
      near(L, s.x - half - 0.2, s.x + half + 0.2, (o) => {
        if (o.t !== 'orb' || s.used.indexOf(o.id) !== -1) return;
        if (!overlap(s.x - half, s.y - half, s.x + half, s.y + half,
          o.x - 0.1, o.y - 0.1, o.x + 1.1, o.y + 1.1)) return;
        s.used.push(o.id);
        s.buffer = false;
        push(s, ORB[o.c]);
        return false;
      });
    }

    const cfg = MODE_CFG[s.mode];
    const jm = s.mini ? MINI_JUMP : 1;
    let vf = s.vy * s.grav; // velocity in gravity frame (+ = away from floor)

    if (s.dash && !held) s.dash = false;
    if (s.dash) { vf = 0; s.vy = 0; } else switch (s.mode) {
      case 'cube':
        if (s.grounded && held) { vf = JUMP * jm; s.grounded = false; s.buffer = false; }
        vf -= G * cfg.grav * DT;
        break;
      case 'ship': {
        const k = s.mini ? MINI_FLY : 1;
        vf += shipAccel(vf, held) * k * DT;
        vf = Math.min(Math.max(vf, -SHIP_MAX_DOWN * k), SHIP_MAX_UP * k);
        break;
      }
      case 'ball':
        if (s.grounded && held) {
          s.grav = -s.grav;
          vf = -BALL_KICK * jm;
          s.grounded = false;
          s.buffer = false;
        }
        vf -= G * cfg.grav * DT;
        break;
      case 'ufo':
        if (s.buffer) { vf = UFO_JUMP * jm; s.buffer = false; s.grounded = false; }
        vf -= G * cfg.grav * DT;
        break;
      case 'wave': {
        const k = s.mini ? MINI_WAVE : 1;
        vf = (held ? 1 : -1) * SPEEDS[s.speed] * k;
        break;
      }
      case 'robot':
        if (s.grounded && held) {
          vf = ROBOT_V * jm; s.boost = ROBOT_BOOST; s.grounded = false; s.buffer = false;
        }
        if (s.boost > 0 && held) { vf = Math.max(vf, ROBOT_V * jm); s.boost -= DT; }
        else { s.boost = 0; vf -= G * cfg.grav * DT; }
        break;
      case 'spider':
        if (s.grounded && s.buffer) {
          s.buffer = false;
          spiderFlip(s, L);
          vf = 0;
        }
        vf -= G * cfg.grav * DT;
        break;
      case 'swing': {
        // Each click flips gravity; momentum carries over, then the ship
        // model's "released" curve pulls it round: hard while still moving
        // away from the new floor, softer once falling toward it.
        if (s.buffer) { s.grav = -s.grav; vf = -vf; s.buffer = false; s.grounded = false; }
        const k = s.mini ? MINI_FLY : 1;
        vf += shipAccel(vf, false) * k * DT;
        vf = Math.min(Math.max(vf, -SWING_MAX * k), SWING_MAX * k);
        break;
      }
    }
    if (cfg.term && s.mode !== 'ship' && s.mode !== 'swing') vf = Math.max(vf, -cfg.term);
    s.vy = vf * s.grav;

    s.x += SPEEDS[s.speed] * DT;
    s.y += s.vy * DT;

    collide(s, L);
    if (s.dead) return;
    triggers(s, L);
    half = size(s) / 2;
    hazards(s, L, half);
    if (s.y < -6 || s.y > 120) kill(s);
    if (s.x >= L.length) s.won = true;
  }

  function collide(s, L) {
    const half = size(s) / 2;
    const inner = s.mode === 'wave' ? half * 0.6 : half * 0.3;
    const g = s.grav;
    const slide = MODE_CFG[s.mode].slide;
    s.grounded = false;

    // Hard floor at y=0, plus corridor bounds. These never kill.
    const floor = s.bounds ? s.bounds.floor : 0;
    const ceil = s.bounds ? s.bounds.ceil : Infinity;
    if (s.y - half <= floor) {
      s.y = floor + half;
      if (s.vy < 0) s.vy = 0;
      if (g === 1) s.grounded = true;
    }
    if (s.y + half >= ceil) {
      s.y = ceil - half;
      if (s.vy > 0) s.vy = 0;
      if (g === -1) s.grounded = true;
    }

    near(L, s.x - half - 0.1, s.x + half + 0.1, (o) => {
      if (o.t !== 'b') return;
      const bx0 = o.x, bx1 = o.x + o.w, by0 = o.y, by1 = o.y + o.h;
      if (!overlap(s.x - half, s.y - half, s.x + half, s.y + half, bx0, by0, bx1, by1)) return;
      if (overlap(s.x - inner, s.y - inner, s.x + inner, s.y + inner, bx0, by0, bx1, by1)) {
        kill(s);
        return false;
      }
      // Work in the gravity frame so flipped gravity needs no special case.
      const cy = s.y * g;
      const vf = s.vy * g;
      const top = g === 1 ? by1 : -by0;
      const bot = g === 1 ? by0 : -by1;
      if (cy >= top && vf <= 0) {
        s.y = (top + half) * g;
        s.vy = 0;
        s.grounded = true;
      } else if (cy <= bot && vf >= 0) {
        if (!slide) { kill(s); return false; }
        s.y = (bot - half) * g;
        s.vy = 0;
      }
    });
  }

  function triggers(s, L) {
    const half = size(s) / 2;
    near(L, s.x - half - 0.1, s.x + half + 0.1, (o) => {
      if (o.t === 'p') {
        if (overlap(s.x - half, s.y - half, s.x + half, s.y + half,
          o.x, o.y - o.h / 2, o.x + 1, o.y + o.h / 2)) applyPortal(s, o);
      } else if (o.t === 'sw') {
        // Switch block: touch it to light it (Dash's coin 1 puzzle).
        if (s.lit.indexOf(o.id) === -1 && overlap(s.x - half, s.y - half, s.x + half, s.y + half, o.x, o.y, o.x + o.w, o.y + o.h)) s.lit.push(o.id);
      } else if (o.t === 'tp') {
        // Loop teleport: sends the icon back to tx, n times, then lets it on.
        const used = s.tp[o.id] || 0;
        if (used < o.n && overlap(s.x - half, s.y - half, s.x + half, s.y + half, o.x, o.y - o.h / 2, o.x + 1, o.y + o.h / 2)) {
          s.tp[o.id] = used + 1;
          s.tpDist += s.x - o.tx;
          s.x = o.tx;
          s.teleported = true;
          return false;
        }
      } else if (o.t === 'coin') {
        if (o.lock && lit(s, L, o.lock) < o.lockN) return; // still sunk: switches not all lit
        if (s.coins.indexOf(o.id) === -1 &&
          overlap(s.x - half, s.y - half, s.x + half, s.y + half, o.x - 0.15, o.y - 0.15, o.x + 1.15, o.y + 1.15)) s.coins.push(o.id);
      } else if (o.t === 'pad') {
        if (s.used.indexOf(o.id) !== -1) return;
        const y0 = o.d === -1 ? o.y + 0.6 : o.y, y1 = o.d === -1 ? o.y + 1 : o.y + 0.4;
        if (overlap(s.x - half, s.y - half, s.x + half, s.y + half, o.x + 0.1, y0, o.x + 0.9, y1)) {
          s.used.push(o.id);
          push(s, PAD[o.c]);
        }
      }
    });
  }

  // How many switches of a group are lit.
  function lit(s, L, group) {
    let n = 0;
    for (const id of s.lit) if (L.objects[id].g === group) n++;
    return n;
  }

  function hazards(s, L, half) {
    near(L, s.x - half - 0.1, s.x + half + 0.1, (o) => {
      if (o.t === 'saw') {
        // Circle hitbox at 75% of the drawn radius, against the player box.
        const cx = o.x + o.r, cy = o.y + o.r, hr = o.r * 0.75;
        const dx = cx - Math.max(s.x - half, Math.min(cx, s.x + half));
        const dy = cy - Math.max(s.y - half, Math.min(cy, s.y + half));
        if (dx * dx + dy * dy < hr * hr) { kill(s); return false; }
        return;
      }
      if (o.t !== 's' && o.t !== 'ss') return;
      const h = hazardBox(o);
      if (overlap(s.x - half, s.y - half, s.x + half, s.y + half, h[0], h[1], h[2], h[3])) {
        kill(s);
        return false;
      }
    });
  }

  const api = {
    TPS, DT, G, JUMP, SPEEDS, MODES, MODE_CFG, ORB, PAD,
    compile, create, clone, step, size, near, hazardBox, lit,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GDPhysics = api;
})(typeof self !== 'undefined' ? self : this);
