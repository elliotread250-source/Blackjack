/* Pool physics.
 *
 * Deterministic fixed-step simulation (240 Hz) with continuous collision
 * detection inside every step, so a ball can never tunnel through another
 * ball or a cushion however fast it goes. Each ball has a position, a
 * velocity and a full angular velocity (wx, wy roll axes, wz english), which
 * gives sliding friction, the sliding-to-rolling transition, follow and draw,
 * and side spin that changes cushion rebounds.
 *
 * Units are metres, seconds and radians. Table coordinates: x along the
 * length (0..L, head string at L/4), y across (0..W); the numbers are the
 * cushion noses. Only + - * / and sqrt are used inside the step, which are
 * exactly rounded in IEEE-754, so two browsers given the same inputs produce
 * bit-identical results.
 *
 * Runs in the browser (window.PoolPhysics) and in node (module.exports).
 */
(function (root) {
  'use strict';

  var L = 2.0, W = 1.0;            // playing area between cushion noses
  var R = 0.028575, D = 2 * R;     // standard 2 1/4" ball
  var D2 = D * D;
  var G = 9.81;
  var MU_SLIDE = 0.2;              // ball-cloth sliding friction
  var ROLL_DECEL = 0.24;           // rolling resistance (m/s^2)
  var SLOW_DECEL = 0.55;           // extra drag near rest so balls settle cleanly
  var SLOW_SPEED = 0.22;
  var SPIN_DECEL = 14;             // vertical-axis spin decay (rad/s^2)
  var E_BALL = 0.94;               // ball-ball restitution
  var MU_CUSHION = 0.18;           // cushion friction (english grip)
  var E_JAW = 0.55;                // pocket facings are softer
  var CUSH_ROLL = 0.3;             // share of natural roll a cushion leaves
  var DT = 1 / 240;
  var MAX_SPEED = 6.6;             // cue ball speed at full power
  var MIN_SPEED = 0.12;
  var MAX_TIME = 40;               // hard cap on one shot (seconds)
  var SPIN_OFFSET = 0.5;           // tip offset at full spin, in ball radii
  var SLIP_EPS2 = 1e-12;
  var N = 16;

  // ---------------------------------------------------------------- table
  var CORNER_HALF = 1.07 * D;      // half mouth width (mouth ~2.14 balls)
  var SIDE_HALF = 1.16 * D;        // side mouth ~2.32 balls
  var CORNER_JAW_ANGLE = 7 * Math.PI / 180;   // 142 deg facing
  var SIDE_JAW_ANGLE = 14 * Math.PI / 180;    // 104 deg facing

  function buildTable() {
    var segs = [], pts = [], pockets = [];
    var a = CORNER_HALF * Math.SQRT2;          // cushion end distance from corner
    var hs = SIDE_HALF;
    var s2 = Math.SQRT1_2;

    function seg(ax, ay, bx, by, nx, ny, jaw) {
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ ax: ax, ay: ay, bx: bx, by: by, nx: nx, ny: ny, tx: dx / len, ty: dy / len, len: len, jaw: !!jaw });
    }

    // straight cushions
    seg(a, 0, L / 2 - hs, 0, 0, 1);
    seg(L / 2 + hs, 0, L - a, 0, 0, 1);
    seg(a, W, L / 2 - hs, W, 0, -1);
    seg(L / 2 + hs, W, L - a, W, 0, -1);
    seg(0, a, 0, W - a, 1, 0);
    seg(L, a, L, W - a, -1, 0);

    // pockets: mouth centre m, outward axis u, half width h, jaw narrowing
    function pocket(mx, my, ux, uy, h, ang, jawLen, dropDepth, dropR, side) {
      var sx = -uy, sy = ux;                    // across the mouth
      var tan = Math.tan(ang);
      var p = {
        x: mx + ux * dropDepth, y: my + uy * dropDepth, r: dropR,
        mx: mx, my: my, ux: ux, uy: uy, h: h, side: side, tips: []
      };
      for (var k = -1; k <= 1; k += 2) {
        var tx = mx + sx * h * k, ty = my + sy * h * k;
        // jaw runs outwards and slightly towards the axis
        var dx = ux - sx * tan * k, dy = uy - sy * tan * k;
        var dl = Math.sqrt(dx * dx + dy * dy);
        dx /= dl; dy /= dl;
        var ex = tx + dx * jawLen, ey = ty + dy * jawLen;
        // normal facing the channel (towards the axis)
        var nx = -dy, ny = dx;
        if (nx * sx * k + ny * sy * k > 0) { nx = -nx; ny = -ny; }
        seg(tx, ty, ex, ey, nx, ny, true);
        pts.push({ x: tx, y: ty });
        pts.push({ x: ex, y: ey });
        p.tips.push({ x: tx, y: ty });
        p.jawEnds = p.jawEnds || [];
        p.jawEnds.push({ x: ex, y: ey });
      }
      // a point just past the mouth that a ball is aimed at
      p.ax = mx + ux * (side ? 0.2 * R : 0.6 * R);
      p.ay = my + uy * (side ? 0.2 * R : 0.6 * R);
      pockets.push(p);
    }
    var cd = R + 0.058, cr = 0.06;               // corner drop circle
    var sd = 0.3 * R + 0.066, sr = 0.066;        // side drop circle
    // order: 0 top-left, 1 top-side, 2 top-right, 3 bottom-right, 4 bottom-side, 5 bottom-left
    pocket(a / 2, a / 2, -s2, -s2, CORNER_HALF, CORNER_JAW_ANGLE, 0.11, cd, cr, false);
    pocket(L / 2, 0, 0, -1, SIDE_HALF, SIDE_JAW_ANGLE, 0.075, sd, sr, true);
    pocket(L - a / 2, a / 2, s2, -s2, CORNER_HALF, CORNER_JAW_ANGLE, 0.11, cd, cr, false);
    pocket(L - a / 2, W - a / 2, s2, s2, CORNER_HALF, CORNER_JAW_ANGLE, 0.11, cd, cr, false);
    pocket(L / 2, W, 0, 1, SIDE_HALF, SIDE_JAW_ANGLE, 0.075, sd, sr, true);
    pocket(a / 2, W - a / 2, -s2, s2, CORNER_HALF, CORNER_JAW_ANGLE, 0.11, cd, cr, false);
    return { segs: segs, pts: pts, pockets: pockets, cornerCut: a, sideHalf: hs };
  }

  var TABLE = buildTable();
  var SEGS = TABLE.segs, PTS = TABLE.pts, POCKETS = TABLE.pockets;
  var NSEG = SEGS.length, NPT = PTS.length, NPOCK = POCKETS.length;
  // flat copies for the hot loop
  var SAX = new Float64Array(NSEG), SAY = new Float64Array(NSEG), SNX = new Float64Array(NSEG),
    SNY = new Float64Array(NSEG), STX = new Float64Array(NSEG), STY = new Float64Array(NSEG),
    SLEN = new Float64Array(NSEG), SJAW = new Uint8Array(NSEG);
  for (var si = 0; si < NSEG; si++) {
    var sg = SEGS[si];
    SAX[si] = sg.ax; SAY[si] = sg.ay; SNX[si] = sg.nx; SNY[si] = sg.ny;
    STX[si] = sg.tx; STY[si] = sg.ty; SLEN[si] = sg.len; SJAW[si] = sg.jaw ? 1 : 0;
  }
  var PX = new Float64Array(NPT), PY = new Float64Array(NPT);
  for (var pi = 0; pi < NPT; pi++) { PX[pi] = PTS[pi].x; PY[pi] = PTS[pi].y; }
  var QX = new Float64Array(NPOCK), QY = new Float64Array(NPOCK), QR2 = new Float64Array(NPOCK);
  for (var qi = 0; qi < NPOCK; qi++) { QX[qi] = POCKETS[qi].x; QY[qi] = POCKETS[qi].y; QR2[qi] = POCKETS[qi].r * POCKETS[qi].r; }

  // Near-rail band: a ball farther than this from every edge cannot touch
  // any cushion, jaw or pocket during one step.
  var EDGE_BAND = R + MAX_SPEED * DT * 1.5 + 0.002;

  // ------------------------------------------------------------ helpers
  function mulberry32(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function powerToSpeed(p) {
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.pow(p, 1.6);
  }
  function speedToPower(v) {
    if (v <= MIN_SPEED) return 0;
    var p = Math.pow((v - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 1 / 1.6);
    return p > 1 ? 1 : p;
  }

  // ---------------------------------------------------------------- sim
  function Sim() {
    this.x = new Float64Array(N); this.y = new Float64Array(N);
    this.vx = new Float64Array(N); this.vy = new Float64Array(N);
    this.wx = new Float64Array(N); this.wy = new Float64Array(N); this.wz = new Float64Array(N);
    this.on = new Uint8Array(N);
    this.pocketOf = new Int8Array(N);
    this.mov = new Int32Array(N);
    this.moved = new Uint8Array(N);
    this.events = null;         // array to record events into, or null
    this.resetShot();
  }

  Sim.prototype.resetShot = function () {
    this.time = 0;
    this.firstHit = -1;
    this.rail = false;
    this.pocketed = [];
    this.railBalls = 0;         // bitmask of balls that touched a cushion
    this.cueOff = false;
    this.collisions = 0;
  };

  Sim.prototype.copyFrom = function (o) {
    this.x.set(o.x); this.y.set(o.y); this.vx.set(o.vx); this.vy.set(o.vy);
    this.wx.set(o.wx); this.wy.set(o.wy); this.wz.set(o.wz);
    this.on.set(o.on); this.pocketOf.set(o.pocketOf);
    this.time = o.time; this.firstHit = o.firstHit; this.rail = o.rail;
    this.pocketed = o.pocketed.slice(); this.railBalls = o.railBalls; this.cueOff = o.cueOff;
    return this;
  };
  Sim.prototype.clone = function () { return new Sim().copyFrom(this); };

  Sim.prototype.clear = function () {
    this.x.fill(0); this.y.fill(0); this.stopAll();
    this.on.fill(0); this.pocketOf.fill(-1);
    this.resetShot();
  };

  Sim.prototype.place = function (i, x, y) {
    this.x[i] = x; this.y[i] = y;
    this.vx[i] = this.vy[i] = this.wx[i] = this.wy[i] = this.wz[i] = 0;
    this.on[i] = 1; this.pocketOf[i] = -1;
  };
  Sim.prototype.remove = function (i, pocket) {
    this.on[i] = 0; this.pocketOf[i] = pocket === undefined ? -1 : pocket;
    this.vx[i] = this.vy[i] = this.wx[i] = this.wy[i] = this.wz[i] = 0;
  };

  Sim.prototype.stopAll = function () {
    this.vx.fill(0); this.vy.fill(0); this.wx.fill(0); this.wy.fill(0); this.wz.fill(0);
  };

  /** Strike the cue ball. dir (dx,dy) unit vector, speed m/s, spin in the unit
   *  disc: sx = side (+ right english), sy = vertical (+ follow, - draw). */
  Sim.prototype.strike = function (dx, dy, speed, sx, sy) {
    this.resetShot();
    var l = Math.sqrt(dx * dx + dy * dy);
    if (!(l > 0)) { dx = 1; dy = 0; l = 1; }
    dx /= l; dy /= l;
    if (!(speed >= 0)) speed = 0;
    if (speed > MAX_SPEED) speed = MAX_SPEED;
    sx = +sx || 0; sy = +sy || 0;
    var m = Math.sqrt(sx * sx + sy * sy);
    if (m > 1) { sx /= m; sy /= m; }
    var a = sx * SPIN_OFFSET, b = sy * SPIN_OFFSET;
    var k = 2.5 * speed / R;
    this.vx[0] = dx * speed; this.vy[0] = dy * speed;
    this.wx[0] = -k * b * dy;
    this.wy[0] = k * b * dx;
    this.wz[0] = -k * a;
  };

  Sim.prototype.moving = function () {
    var on = this.on, vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy;
    for (var i = 0; i < N; i++) {
      if (!on[i]) continue;
      if (vx[i] !== 0 || vy[i] !== 0) return true;
      var ux = -R * wy[i], uy = R * wx[i];
      if (ux * ux + uy * uy > SLIP_EPS2) return true;
    }
    return false;
  };

  Sim.prototype._event = function (e) { if (this.events) this.events.push(e); };

  /** Advance one fixed step. */
  Sim.prototype.step = function () {
    var x = this.x, y = this.y, vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy, wz = this.wz;
    var on = this.on, mov = this.mov, moved = this.moved;
    var dt = DT, i, j;

    // ---- friction
    var duSlide = 3.5 * MU_SLIDE * G * dt;
    for (i = 0; i < N; i++) {
      if (!on[i]) continue;
      var vxi = vx[i], vyi = vy[i];
      var ux = vxi - R * wy[i], uy = vyi + R * wx[i];
      var us = ux * ux + uy * uy;
      if (us > SLIP_EPS2) {
        var u = Math.sqrt(us);
        if (u <= duSlide) {
          vxi -= (2 / 7) * ux; vyi -= (2 / 7) * uy;
          vx[i] = vxi; vy[i] = vyi; wx[i] = -vyi / R; wy[i] = vxi / R;
        } else {
          var fa = MU_SLIDE * G * dt / u;
          vx[i] = vxi - fa * ux; vy[i] = vyi - fa * uy;
          var fb = 2.5 * fa / R;
          wx[i] -= fb * uy; wy[i] += fb * ux;
        }
      } else if (vxi !== 0 || vyi !== 0) {
        var sp = Math.sqrt(vxi * vxi + vyi * vyi);
        var dec = ROLL_DECEL;
        if (sp < SLOW_SPEED) dec += SLOW_DECEL * (1 - sp / SLOW_SPEED);
        dec *= dt;
        if (sp <= dec) { vx[i] = vy[i] = wx[i] = wy[i] = 0; }
        else {
          var kk = (sp - dec) / sp;
          vxi *= kk; vyi *= kk; vx[i] = vxi; vy[i] = vyi; wx[i] = -vyi / R; wy[i] = vxi / R;
        }
      } else { wx[i] = 0; wy[i] = 0; }
      var z = wz[i];
      if (z !== 0) { var dz = SPIN_DECEL * dt; wz[i] = z > dz ? z - dz : (z < -dz ? z + dz : 0); }
    }

    // ---- motion with continuous collision detection
    moved.fill(0);
    var tLeft = dt, iter = 0;
    while (tLeft > 0) {
      var nm = 0;
      for (i = 0; i < N; i++) if (on[i] && (vx[i] !== 0 || vy[i] !== 0)) { mov[nm++] = i; moved[i] = 1; }
      if (nm === 0) break;
      var best = tLeft, kind = 0, ea = -1, eb = -1;
      for (var mi = 0; mi < nm; mi++) {
        i = mov[mi];
        var xi = x[i], yi = y[i], vxa = vx[i], vya = vy[i];
        // ball-ball
        for (j = 0; j < N; j++) {
          if (j === i || !on[j]) continue;
          var vjx = vx[j], vjy = vy[j];
          if (j < i && (vjx !== 0 || vjy !== 0)) continue;   // pair already checked
          var dx = x[j] - xi, dy = y[j] - yi;
          var dvx = vjx - vxa, dvy = vjy - vya;
          var b = dx * dvx + dy * dvy;
          if (b >= 0) continue;
          var c = dx * dx + dy * dy - D2;
          var t;
          if (c <= 0) t = 0;
          else {
            var aa = dvx * dvx + dvy * dvy;
            // cannot close the gap this step
            if (b * b < aa * c) continue;
            t = (-b - Math.sqrt(b * b - aa * c)) / aa;
            if (t < 0) t = 0;
          }
          if (t < best) { best = t; kind = 1; ea = i; eb = j; }
        }
        // rails, jaws and pockets only near the edge
        if (xi > EDGE_BAND && xi < L - EDGE_BAND && yi > EDGE_BAND && yi < W - EDGE_BAND) continue;
        for (var s = 0; s < NSEG; s++) {
          var vn = vxa * SNX[s] + vya * SNY[s];
          if (vn >= 0) continue;
          var d0 = (xi - SAX[s]) * SNX[s] + (yi - SAY[s]) * SNY[s];
          if (d0 < 0) continue;
          var ts = d0 <= R ? 0 : (d0 - R) / -vn;
          if (ts >= best) continue;
          var proj = (xi + vxa * ts - SAX[s]) * STX[s] + (yi + vya * ts - SAY[s]) * STY[s];
          if (proj < 0 || proj > SLEN[s]) continue;
          best = ts; kind = 2; ea = i; eb = s;
        }
        for (var p = 0; p < NPT; p++) {
          var pdx = PX[p] - xi, pdy = PY[p] - yi;
          var pb = -(pdx * vxa + pdy * vya);
          if (pb >= 0) continue;
          var pc = pdx * pdx + pdy * pdy - R * R;
          var tp;
          if (pc <= 0) tp = 0;
          else {
            var pa = vxa * vxa + vya * vya;
            if (pb * pb < pa * pc) continue;
            tp = (-pb - Math.sqrt(pb * pb - pa * pc)) / pa;
            if (tp < 0) tp = 0;
          }
          if (tp < best) { best = tp; kind = 3; ea = i; eb = p; }
        }
        for (var q = 0; q < NPOCK; q++) {
          var qdx = xi - QX[q], qdy = yi - QY[q];
          var qc = qdx * qdx + qdy * qdy - QR2[q];
          var tq;
          if (qc <= 0) tq = 0;
          else {
            var qb = qdx * vxa + qdy * vya;
            if (qb >= 0) continue;
            var qa = vxa * vxa + vya * vya;
            if (qb * qb < qa * qc) continue;
            tq = (-qb - Math.sqrt(qb * qb - qa * qc)) / qa;
            if (tq < 0) tq = 0;
          }
          if (tq < best) { best = tq; kind = 4; ea = i; eb = q; }
        }
      }
      // advance everything to the event (or the end of the step)
      if (best > 0) {
        for (var k2 = 0; k2 < nm; k2++) { var m2 = mov[k2]; x[m2] += vx[m2] * best; y[m2] += vy[m2] * best; }
      }
      tLeft -= best;
      if (kind === 0) break;
      if (kind === 1) this._ballBall(ea, eb);
      else if (kind === 2) this._cushion(ea, SNX[eb], SNY[eb], SJAW[eb] ? E_JAW : -1);
      else if (kind === 3) {
        var ndx = x[ea] - PX[eb], ndy = y[ea] - PY[eb], nl = Math.sqrt(ndx * ndx + ndy * ndy);
        if (nl > 0) this._cushion(ea, ndx / nl, ndy / nl, 0.7);
      } else if (kind === 4) this._pocket(ea, eb);
      if (++iter > 400) {
        // pathological pile-up: finish the step without further events
        for (var k3 = 0; k3 < N; k3++) if (on[k3]) { x[k3] += vx[k3] * tLeft; y[k3] += vy[k3] * tLeft; }
        break;
      }
    }
    this._separate();
    this._containment();
    this.time += dt;
  };

  Sim.prototype._ballBall = function (i, j) {
    var x = this.x, y = this.y, vx = this.vx, vy = this.vy;
    var dx = x[j] - x[i], dy = y[j] - y[i];
    var d = Math.sqrt(dx * dx + dy * dy);
    if (!(d > 0)) { dx = 1; dy = 0; d = 1; }
    var nx = dx / d, ny = dy / d;
    var rel = (vx[i] - vx[j]) * nx + (vy[i] - vy[j]) * ny;
    if (rel <= 0) return;
    var J = 0.5 * (1 + E_BALL) * rel;
    vx[i] -= J * nx; vy[i] -= J * ny;
    vx[j] += J * nx; vy[j] += J * ny;
    this.collisions++;
    if (this.firstHit < 0) {
      if (i === 0) this.firstHit = j; else if (j === 0) this.firstHit = i;
    }
    if (this.events) this.events.push({ k: 'b', a: i, b: j, s: rel, t: this.time });
  };

  /** Rebound from a cushion/jaw with inward normal (nx, ny). e < 0 means the
   *  speed-dependent cushion restitution. */
  Sim.prototype._cushion = function (i, nx, ny, e) {
    var vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy, wz = this.wz;
    var tx = -ny, ty = nx;
    var vn = vx[i] * nx + vy[i] * ny;
    if (vn >= 0) return;
    var vt = vx[i] * tx + vy[i] * ty;
    var spd = -vn;
    if (e < 0) { e = 0.92 - 0.04 * spd; if (e < 0.7) e = 0.7; if (e > 0.9) e = 0.9; }
    var vn2 = -e * vn;
    // tangential grip from english and running along the rail
    var slip = vt - R * wz[i];
    var lim = MU_CUSHION * (1 + e) * spd;
    var dvt = -slip / 3.5;
    if (dvt > lim) dvt = lim; else if (dvt < -lim) dvt = -lim;
    vt += dvt;
    wz[i] -= 2.5 * dvt / R;
    // roll about the rail axis is mostly killed by the nose height
    var wt = wx[i] * tx + wy[i] * ty;
    var wn = wx[i] * nx + wy[i] * ny;
    wt = CUSH_ROLL * vn2 / R + 0.1 * wt;
    wx[i] = wt * tx + wn * nx; wy[i] = wt * ty + wn * ny;
    vx[i] = vn2 * nx + vt * tx; vy[i] = vn2 * ny + vt * ty;
    if (this.firstHit >= 0) this.rail = true;
    this.railBalls |= (1 << i);
    if (this.events) this.events.push({ k: 'c', a: i, s: spd, t: this.time });
  };

  Sim.prototype._pocket = function (i, q) {
    var sp = Math.sqrt(this.vx[i] * this.vx[i] + this.vy[i] * this.vy[i]);
    this.pocketed.push({ b: i, p: q, t: this.time, x: this.x[i], y: this.y[i], vx: this.vx[i], vy: this.vy[i] });
    this.remove(i, q);
    if (this.events) this.events.push({ k: 'p', a: i, p: q, s: sp, t: this.time });
  };

  // push apart any (numerically) overlapping balls; normally a no-op
  Sim.prototype._separate = function () {
    var x = this.x, y = this.y, on = this.on, moved = this.moved;
    var lim = (D - 1e-7) * (D - 1e-7);
    for (var i = 0; i < N; i++) {
      if (!on[i]) continue;
      for (var j = i + 1; j < N; j++) {
        if (!on[j] || !(moved[i] || moved[j])) continue;
        var dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy;
        if (d2 < lim) {
          var d = Math.sqrt(d2);
          if (!(d > 0)) { dx = 1e-9; dy = 0; d = 1e-9; }
          var push = (D - d) * 0.5 + 1e-9;
          var nx = dx / d, ny = dy / d;
          x[i] -= nx * push; y[i] -= ny * push; x[j] += nx * push; y[j] += ny * push;
          this.overlapFixes = (this.overlapFixes || 0) + 1;
        }
      }
    }
  };

  // a ball that somehow ends up outside the table is treated as off the table
  Sim.prototype._containment = function () {
    var x = this.x, y = this.y, on = this.on;
    for (var i = 0; i < N; i++) {
      if (!on[i]) continue;
      if (x[i] < -0.25 || x[i] > L + 0.25 || y[i] < -0.25 || y[i] > W + 0.25) {
        if (i === 0) this.cueOff = true;
        this.offTable = (this.offTable || []);
        this.offTable.push(i);
        this.remove(i, -1);
        this.pocketed.push({ b: i, p: -1, t: this.time, x: x[i], y: y[i], vx: 0, vy: 0, off: true });
        if (this.events) this.events.push({ k: 'o', a: i, t: this.time });
      }
    }
  };

  /** Run until every ball is at rest (or the time cap); returns steps run. */
  Sim.prototype.runToRest = function (maxTime) {
    var cap = maxTime || MAX_TIME, n = 0;
    while (this.moving()) {
      this.step(); n++;
      if (this.time >= cap) { this.stopAll(); this.timedOut = true; break; }
    }
    this.wz.fill(0);
    return n;
  };

  Sim.prototype.snapshot = function () {
    var out = [];
    for (var i = 0; i < N; i++) out.push(this.on[i] ? [this.x[i], this.y[i]] : null);
    return out;
  };
  Sim.prototype.restore = function (snap) {
    for (var i = 0; i < N; i++) {
      var b = snap[i];
      if (b) this.place(i, b[0], b[1]); else this.remove(i, -1);
    }
  };

  // ------------------------------------------------------------- set-up
  var HEAD_X = L / 4, FOOT_X = 3 * L / 4;

  /** Rack the 15 balls (8 in the middle, a solid and a stripe in the back
   *  corners, the rest shuffled by seed) and put the cue ball on the head spot. */
  function rack(sim, seed) {
    var rnd = mulberry32(seed || 1);
    sim.clear();
    var solids = [1, 2, 3, 4, 5, 6, 7], stripes = [9, 10, 11, 12, 13, 14, 15];
    function take(arr) { return arr.splice(Math.floor(rnd() * arr.length), 1)[0]; }
    // positions in row-major order: row r has r+1 balls
    var slots = new Array(15);
    var apex = rnd() < 0.5 ? take(solids) : take(stripes);
    slots[0] = apex;
    slots[4] = 8;                         // middle of row 3
    var cornerSolidLeft = rnd() < 0.5;
    slots[10] = cornerSolidLeft ? take(solids) : take(stripes);
    slots[14] = cornerSolidLeft ? take(stripes) : take(solids);
    var rest = solids.concat(stripes);
    for (var k = 0; k < 15; k++) {
      if (slots[k] !== undefined) continue;
      slots[k] = rest.splice(Math.floor(rnd() * rest.length), 1)[0];
    }
    var gap = 0.00015;
    var dxr = Math.sqrt(3) * (R + gap / 2), dyr = 2 * R + gap;
    var idx = 0;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c <= r; c++) {
        var jx = (rnd() - 0.5) * 0.0001, jy = (rnd() - 0.5) * 0.0001;
        sim.place(slots[idx], FOOT_X + r * dxr + jx, W / 2 + (c - r / 2) * dyr + jy);
        idx++;
      }
    }
    sim.place(0, HEAD_X, W / 2);
    sim.resetShot();
    return slots;
  }

  /** Is (x, y) a legal spot for the cue ball? */
  function validCueSpot(sim, x, y, kitchen) {
    if (!(x >= R && x <= L - R && y >= R && y <= W - R)) return false;
    if (kitchen && x > HEAD_X) return false;
    for (var i = 1; i < N; i++) {
      if (!sim.on[i]) continue;
      var dx = sim.x[i] - x, dy = sim.y[i] - y;
      if (dx * dx + dy * dy < D2 * 1.0001) return false;
    }
    return true;
  }

  /** Nearest legal cue spot to (x, y), searching outwards. */
  function nearestCueSpot(sim, x, y, kitchen) {
    var maxX = kitchen ? HEAD_X : L - R;
    x = Math.min(Math.max(x, R), maxX); y = Math.min(Math.max(y, R), W - R);
    if (validCueSpot(sim, x, y, kitchen)) return [x, y];
    for (var rad = 0.005; rad < 1.2; rad += 0.005) {
      var steps = Math.max(8, Math.round(rad * 300));
      for (var k = 0; k < steps; k++) {
        var a = (k / steps) * Math.PI * 2;
        var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (validCueSpot(sim, px, py, kitchen)) return [px, py];
      }
    }
    return [HEAD_X, W / 2];
  }

  /** Put ball i back on the foot spot (or the nearest free spot behind it). */
  function spotBall(sim, i) {
    for (var dx = 0; dx < L / 4 - R; dx += 0.002) {
      var x = FOOT_X + dx, y = W / 2, ok = true;
      for (var j = 0; j < N; j++) {
        if (j === i || !sim.on[j]) continue;
        var ex = sim.x[j] - x, ey = sim.y[j] - y;
        if (ex * ex + ey * ey < D2 * 1.0001) { ok = false; break; }
      }
      if (ok) { sim.place(i, x, y); return; }
    }
    // foot side full: search towards the head
    for (var dx2 = 0; dx2 < L / 2; dx2 += 0.002) {
      var x2 = FOOT_X - dx2, ok2 = true;
      for (var j2 = 0; j2 < N; j2++) {
        if (j2 === i || !sim.on[j2]) continue;
        var fx = sim.x[j2] - x2, fy = sim.y[j2] - W / 2;
        if (fx * fx + fy * fy < D2 * 1.0001) { ok2 = false; break; }
      }
      if (ok2) { sim.place(i, x2, W / 2); return; }
    }
  }

  // ------------------------------------------------------ aim prediction
  /** Distance along a ray (from ox,oy dir dx,dy) of a ball of radius R to the
   *  first cushion/jaw/tip, with the hit normal. */
  function rayCushion(ox, oy, dx, dy) {
    var best = Infinity, nx = 0, ny = 0;
    for (var s = 0; s < NSEG; s++) {
      var vn = dx * SNX[s] + dy * SNY[s];
      if (vn >= 0) continue;
      var d0 = (ox - SAX[s]) * SNX[s] + (oy - SAY[s]) * SNY[s];
      if (d0 < R - 1e-9) continue;
      var t = (d0 - R) / -vn;
      if (t >= best) continue;
      var proj = (ox + dx * t - SAX[s]) * STX[s] + (oy + dy * t - SAY[s]) * STY[s];
      if (proj < 0 || proj > SLEN[s]) continue;
      best = t; nx = SNX[s]; ny = SNY[s];
    }
    for (var p = 0; p < NPT; p++) {
      var pdx = PX[p] - ox, pdy = PY[p] - oy;
      var b = pdx * dx + pdy * dy;
      if (b <= 0) continue;
      var c = pdx * pdx + pdy * pdy - R * R;
      var disc = b * b - c;
      if (disc < 0) continue;
      var t2 = b - Math.sqrt(disc);
      if (t2 < 0 || t2 >= best) continue;
      best = t2;
      var hx = ox + dx * t2 - PX[p], hy = oy + dy * t2 - PY[p], hl = Math.sqrt(hx * hx + hy * hy) || 1;
      nx = hx / hl; ny = hy / hl;
    }
    var pocket = -1;
    for (var q = 0; q < NPOCK; q++) {
      var qdx = ox - QX[q], qdy = oy - QY[q];
      var qb = qdx * dx + qdy * dy;
      var qc = qdx * qdx + qdy * qdy - QR2[q];
      var qd = qb * qb - qc;
      if (qd < 0) continue;
      var tq = -qb - Math.sqrt(qd);
      if (tq >= 0 && tq < best) { best = tq; pocket = q; }
    }
    return { t: best, nx: nx, ny: ny, pocket: pocket };
  }

  /** First ball (other than skip) a moving ball would touch along a ray. */
  function rayBall(sim, ox, oy, dx, dy, skipA, skipB) {
    var best = Infinity, hit = -1;
    for (var j = 0; j < N; j++) {
      if (!sim.on[j] || j === skipA || j === skipB) continue;
      var px = sim.x[j] - ox, py = sim.y[j] - oy;
      var b = px * dx + py * dy;
      if (b <= 0) continue;
      var c = px * px + py * py - D2;
      var disc = b * b - c;
      if (disc < 0) continue;
      var t = b - Math.sqrt(disc);
      if (t < 0) t = 0;
      if (t < best) { best = t; hit = j; }
    }
    return { t: best, ball: hit };
  }

  /** What the aim line shows: the ghost ball, the object ball's direction and
   *  the cue ball's tangent line, or the cushion point if no ball is hit. */
  function predictAim(sim, dx, dy) {
    var ox = sim.x[0], oy = sim.y[0];
    var rb = rayBall(sim, ox, oy, dx, dy, 0, -1);
    var rc = rayCushion(ox, oy, dx, dy);
    if (rb.ball >= 0 && rb.t <= rc.t) {
      var gx = ox + dx * rb.t, gy = oy + dy * rb.t;
      var nx = sim.x[rb.ball] - gx, ny = sim.y[rb.ball] - gy, nl = Math.sqrt(nx * nx + ny * ny) || 1;
      nx /= nl; ny /= nl;
      var dot = dx * nx + dy * ny;
      var tx = dx - dot * nx, ty = dy - dot * ny, tl = Math.sqrt(tx * tx + ty * ty);
      if (tl > 1e-9) { tx /= tl; ty /= tl; } else { tx = 0; ty = 0; }
      // how far each ball runs before something stops it
      var ob = rayBall(sim, sim.x[rb.ball], sim.y[rb.ball], nx, ny, rb.ball, 0);
      var oc = rayCushion(sim.x[rb.ball], sim.y[rb.ball], nx, ny);
      var cb = tl > 1e-9 ? rayBall(sim, gx, gy, tx, ty, 0, rb.ball) : { t: 0, ball: -1 };
      var cc = tl > 1e-9 ? rayCushion(gx, gy, tx, ty) : { t: 0 };
      return {
        type: 'ball', ball: rb.ball, t: rb.t, gx: gx, gy: gy, nx: nx, ny: ny, tx: tx, ty: ty, cut: dot,
        objLen: Math.min(ob.t, oc.t), objPocket: oc.t <= ob.t ? oc.pocket : -1,
        cueLen: Math.min(cb.t, cc.t)
      };
    }
    var hx = ox + dx * rc.t, hy = oy + dy * rc.t;
    var dn = dx * rc.nx + dy * rc.ny;
    var rx = dx - 2 * dn * rc.nx, ry = dy - 2 * dn * rc.ny;
    var after = rayCushion(hx, hy, rx, ry), afterB = rayBall(sim, hx, hy, rx, ry, 0, -1);
    return { type: 'cushion', t: rc.t, hx: hx, hy: hy, rx: rx, ry: ry, pocket: rc.pocket, afterLen: Math.min(after.t, afterB.t) };
  }

  var api = {
    L: L, W: W, R: R, D: D, DT: DT, G: G, N: N,
    MAX_SPEED: MAX_SPEED, MIN_SPEED: MIN_SPEED, MAX_TIME: MAX_TIME, SPIN_OFFSET: SPIN_OFFSET,
    ROLL_DECEL: ROLL_DECEL, MU_SLIDE: MU_SLIDE, E_BALL: E_BALL,
    HEAD_X: HEAD_X, FOOT_X: FOOT_X,
    TABLE: TABLE, POCKETS: POCKETS,
    Sim: Sim, rack: rack, validCueSpot: validCueSpot, nearestCueSpot: nearestCueSpot, spotBall: spotBall,
    powerToSpeed: powerToSpeed, speedToPower: speedToPower, mulberry32: mulberry32,
    predictAim: predictAim, rayBall: rayBall, rayCushion: rayCushion
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PoolPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
