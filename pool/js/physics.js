/* Pool physics (English 7ft pub table).
 *
 * Deterministic fixed-step simulation (240 Hz) with continuous collision
 * detection inside every step: each step finds the earliest ball-ball,
 * ball-cushion, ball-knuckle or ball-pocket event, advances to it, resolves
 * it and repeats, so a ball can never tunnel through anything however fast it
 * goes. Every ball has a velocity and a full angular velocity (wx, wy are the
 * roll axes, wz is side spin), which gives sliding friction, the
 * sliding-to-rolling transition, follow and draw, and english that changes
 * cushion rebounds.
 *
 * Units: metres, seconds, radians. Table coordinates: x along the length
 * (0 = baulk cushion, baulk line at L/5, black spot at 3L/4), y across; the
 * numbers are the cushion noses. Only + - * / and sqrt run inside a step
 * (all exactly rounded in IEEE-754), so the same inputs give bit-identical
 * results in every browser.
 *
 * Ball numbers: 0 cue, 1-7 red, 8 black, 9-15 yellow.
 * Runs in the browser (window.PoolPhysics) and in node (module.exports).
 */
(function (root) {
  'use strict';

  var L = 1.83, W = 0.915;          // 6ft x 3ft playing area (7ft pub table)
  var R = 0.0254, D = 2 * R;        // 2" balls
  var D2 = D * D;
  var G = 9.81;
  var MU_SLIDE = 0.18;              // ball-cloth sliding friction
  var ROLL_DECEL = 0.16;            // rolling resistance (m/s^2)
  var SLOW_DECEL = 0.6;             // extra cloth drag near rest so balls settle cleanly
  var SLOW_SPEED = 0.25;
  var SPIN_DECEL = 15;              // vertical-axis spin decay (rad/s^2)
  var E_BALL = 0.94;                // ball-ball restitution
  var MU_CUSHION = 0.18;            // cushion grip (english)
  var E_KNUCKLE = -2;               // knuckles: speed-dependent (slow balls die in, fast ones rattle out)
  var CUSH_ROLL = 0.3;              // share of natural roll left after a cushion
  var DT = 1 / 240;
  var MAX_SPEED = 6.2;              // cue ball speed at full power
  var MIN_SPEED = 0.22;
  var MAX_TIME = 40;                // hard cap on one shot (s)
  var SPIN_OFFSET = 0.6;            // tip offset at full spin, in ball radii
  var SLIP_EPS2 = 1e-12;
  var N = 16;

  var BAULK_X = L / 5;
  var BLACK_SPOT_X = 0.75 * L;
  var CENTER_X = L / 2;

  // ---------------------------------------------------------------- table
  // English pockets: the cushion noses curve round into the pocket (a
  // "knuckle" modelled as a circle) and the mouth is tight.
  var CORNER_GAP = 1.76 * D, CORNER_KNUCKLE = 0.03;
  var MIDDLE_GAP = 1.88 * D, MIDDLE_KNUCKLE = 0.022;
  var DROP_R = 0.046;

  function buildTable() {
    var segs = [], knuckles = [], pockets = [];
    var s2 = Math.SQRT1_2;
    var rc = CORNER_KNUCKLE, rm = MIDDLE_KNUCKLE;
    var a = (CORNER_GAP + 2 * rc) * s2 - rc;    // straight cushion stops this far from a corner
    var hm = MIDDLE_GAP / 2 + rm;               // ... and this far either side of a middle pocket

    function seg(ax, ay, bx, by, nx, ny) {
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ ax: ax, ay: ay, bx: bx, by: by, nx: nx, ny: ny, tx: dx / len, ty: dy / len, len: len });
    }
    seg(a, 0, CENTER_X - hm, 0, 0, 1);
    seg(CENTER_X + hm, 0, L - a, 0, 0, 1);
    seg(a, W, CENTER_X - hm, W, 0, -1);
    seg(CENTER_X + hm, W, L - a, W, 0, -1);
    seg(0, a, 0, W - a, 1, 0);
    seg(L, a, L, W - a, -1, 0);

    function addPocket(mx, my, ux, uy, ks, gap, side) {
      var depth = 0.1 * R + DROP_R;
      var p = {
        x: mx + ux * depth, y: my + uy * depth, r: DROP_R,
        mx: mx, my: my, ux: ux, uy: uy, gap: gap, side: side, knuckles: ks,
        // where to send an object ball: just past the narrowest point
        ax: mx + ux * 0.3 * R, ay: my + uy * 0.3 * R
      };
      for (var i = 0; i < ks.length; i++) knuckles.push(ks[i]);
      pockets.push(p);
    }
    function corner(cx, cy, sx, sy) {
      // sx, sy: +1/-1 direction from the corner into the table
      var ks = [{ x: cx + sx * a, y: cy - sy * rc, r: rc }, { x: cx - sx * rc, y: cy + sy * a, r: rc }];
      var m = (a - rc) / 2;
      addPocket(cx + sx * m, cy + sy * m, -sx * s2, -sy * s2, ks, CORNER_GAP, false);
    }
    function middle(cy, sy) {
      var ks = [{ x: CENTER_X - hm, y: cy - sy * rm, r: rm }, { x: CENTER_X + hm, y: cy - sy * rm, r: rm }];
      addPocket(CENTER_X, cy - sy * rm, 0, -sy, ks, MIDDLE_GAP, true);
    }
    // order: 0 top-left, 1 top-middle, 2 top-right, 3 bottom-right, 4 bottom-middle, 5 bottom-left
    corner(0, 0, 1, 1);
    middle(0, 1);
    corner(L, 0, -1, 1);
    corner(L, W, -1, -1);
    middle(W, -1);
    corner(0, W, 1, -1);
    return { segs: segs, knuckles: knuckles, pockets: pockets, cornerCut: a, middleHalf: hm };
  }

  var TABLE = buildTable();
  var SEGS = TABLE.segs, KN = TABLE.knuckles, POCKETS = TABLE.pockets;
  var NSEG = SEGS.length, NKN = KN.length, NPOCK = POCKETS.length;
  var SAX = new Float64Array(NSEG), SAY = new Float64Array(NSEG), SNX = new Float64Array(NSEG),
    SNY = new Float64Array(NSEG), STX = new Float64Array(NSEG), STY = new Float64Array(NSEG),
    SLEN = new Float64Array(NSEG);
  for (var si = 0; si < NSEG; si++) {
    var sg = SEGS[si];
    SAX[si] = sg.ax; SAY[si] = sg.ay; SNX[si] = sg.nx; SNY[si] = sg.ny;
    STX[si] = sg.tx; STY[si] = sg.ty; SLEN[si] = sg.len;
  }
  var KX = new Float64Array(NKN), KY = new Float64Array(NKN), KR2 = new Float64Array(NKN);
  for (var ki = 0; ki < NKN; ki++) { KX[ki] = KN[ki].x; KY[ki] = KN[ki].y; KR2[ki] = (R + KN[ki].r) * (R + KN[ki].r); }
  var QX = new Float64Array(NPOCK), QY = new Float64Array(NPOCK), QR2 = new Float64Array(NPOCK);
  for (var qi = 0; qi < NPOCK; qi++) { QX[qi] = POCKETS[qi].x; QY[qi] = POCKETS[qi].y; QR2[qi] = POCKETS[qi].r * POCKETS[qi].r; }

  // A ball farther than this from every edge cannot reach a cushion, knuckle
  // or pocket within one step.
  var EDGE_BAND = R + MAX_SPEED * DT * 1.5 + 0.004;

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

  var POW_EXP = 1.45;
  function powerToSpeed(p) {
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    return MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.pow(p, POW_EXP);
  }
  function speedToPower(v) {
    if (v <= MIN_SPEED) return 0;
    var p = Math.pow((v - MIN_SPEED) / (MAX_SPEED - MIN_SPEED), 1 / POW_EXP);
    return p > 1 ? 1 : p;
  }

  // ---------------------------------------------------------------- sim
  function Sim() {
    this.x = new Float64Array(N); this.y = new Float64Array(N);
    this.vx = new Float64Array(N); this.vy = new Float64Array(N);
    this.wx = new Float64Array(N); this.wy = new Float64Array(N); this.wz = new Float64Array(N);
    this.on = new Uint8Array(N);
    this.pocketOf = new Int8Array(N).fill(-1);
    this.mov = new Int32Array(N);
    this.moved = new Uint8Array(N);
    this.events = null;           // array to record events into, or null
    this.resetShot();
  }

  Sim.prototype.resetShot = function () {
    this.time = 0;
    this.firstHit = -1;           // first ball the cue ball touched
    this.rail = false;            // any ball touched a cushion after that
    this.pocketed = [];           // [{b, p, t}] in order
    this.railBalls = 0;           // bitmask of balls that touched a cushion
    this.cueOff = false;
    this.cueMaxX = this.x ? this.x[0] : 0;   // furthest the cue ball got up the table before first contact
    this.collisions = 0;
    this.timedOut = false;
  };

  Sim.prototype.copyFrom = function (o) {
    this.x.set(o.x); this.y.set(o.y); this.vx.set(o.vx); this.vy.set(o.vy);
    this.wx.set(o.wx); this.wy.set(o.wy); this.wz.set(o.wz);
    this.on.set(o.on); this.pocketOf.set(o.pocketOf);
    this.time = o.time; this.firstHit = o.firstHit; this.rail = o.rail;
    this.pocketed = o.pocketed.slice(); this.railBalls = o.railBalls; this.cueOff = o.cueOff;
    this.cueMaxX = o.cueMaxX; this.collisions = o.collisions;
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

  /** Strike the cue ball: (dx, dy) direction, speed in m/s, spin inside the
   *  unit disc: sx side (+ = right english), sy height (+ = follow, - = draw). */
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
    this.cueMaxX = this.x[0];
    this.startX = new Float64Array(this.x);
  };

  /** The shot record the rules engine needs, once the balls have stopped. */
  Sim.prototype.summary = function (call) {
    var potted = [], blackPocket = -1, railBalls = 0;
    for (var i = 0; i < this.pocketed.length; i++) {
      var e = this.pocketed[i];
      if (potted.indexOf(e.b) < 0) potted.push(e.b);
      if (e.b === 8) blackPocket = e.p;
    }
    for (var b = 1; b < N; b++) if (this.railBalls & (1 << b)) railBalls++;
    var f = this.firstHit;
    return {
      first: f, potted: potted, rail: this.rail, cueOff: this.cueOff, railBalls: railBalls,
      firstInBaulk: f > 0 && !!this.startX && this.startX[f] < BAULK_X,
      cueLeftBaulk: this.cueMaxX > BAULK_X,
      blackPocket: blackPocket, call: call === undefined ? -1 : call
    };
  };

  Sim.prototype.moving = function () {
    var on = this.on, vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy;
    for (var i = 0; i < N; i++) {
      if (!on[i]) continue;
      if (vx[i] !== 0 || vy[i] !== 0) return true;
      var ux = R * wy[i], uy = R * wx[i];
      if (ux * ux + uy * uy > SLIP_EPS2) return true;
    }
    return false;
  };

  /** Advance one fixed step. */
  Sim.prototype.step = function () {
    var x = this.x, y = this.y, vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy, wz = this.wz;
    var on = this.on, mov = this.mov, moved = this.moved;
    var dt = DT, i, j;

    // ---- cloth friction
    var duSlide = 3.5 * MU_SLIDE * G * dt;
    for (i = 0; i < N; i++) {
      if (!on[i]) continue;
      var vxi = vx[i], vyi = vy[i];
      var ux = vxi - R * wy[i], uy = vyi + R * wx[i];
      var us = ux * ux + uy * uy;
      if (us > SLIP_EPS2) {
        var u = Math.sqrt(us);
        if (u <= duSlide) {            // slip ends this step: natural roll
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
        for (j = 0; j < N; j++) {
          if (j === i || !on[j]) continue;
          var vjx = vx[j], vjy = vy[j];
          if (j < i && (vjx !== 0 || vjy !== 0)) continue;   // pair already checked
          var dx = x[j] - xi, dy = y[j] - yi;
          var dvx = vjx - vxa, dvy = vjy - vya;
          var b = dx * dvx + dy * dvy;
          if (b >= 0) continue;                              // separating
          var c = dx * dx + dy * dy - D2;
          var t;
          if (c <= 0) t = 0;
          else {
            var aa = dvx * dvx + dvy * dvy;
            if (b * b < aa * c) continue;
            t = (-b - Math.sqrt(b * b - aa * c)) / aa;
            if (t < 0) t = 0;
          }
          if (t < best) { best = t; kind = 1; ea = i; eb = j; }
        }
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
        for (var p = 0; p < NKN; p++) {
          var pdx = KX[p] - xi, pdy = KY[p] - yi;
          var pb = -(pdx * vxa + pdy * vya);
          if (pb >= 0) continue;
          var pc = pdx * pdx + pdy * pdy - KR2[p];
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
      if (best > 0) {
        for (var k2 = 0; k2 < nm; k2++) { var m2 = mov[k2]; x[m2] += vx[m2] * best; y[m2] += vy[m2] * best; }
        if (this.firstHit < 0 && on[0] && x[0] > this.cueMaxX) this.cueMaxX = x[0];
      }
      tLeft -= best;
      if (kind === 0) break;
      if (kind === 1) this._ballBall(ea, eb);
      else if (kind === 2) this._cushion(ea, SNX[eb], SNY[eb], -1);
      else if (kind === 3) {
        var ndx = x[ea] - KX[eb], ndy = y[ea] - KY[eb], nl = Math.sqrt(ndx * ndx + ndy * ndy);
        if (nl > 0) this._cushion(ea, ndx / nl, ndy / nl, E_KNUCKLE);
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

  // Contacts closer than this are resolved as one simultaneous impact: a real
  // collision lasts ~0.2 ms, so in a frozen cluster (the rack) a ball pushes
  // all its touching neighbours at once rather than one after the other.
  var TOUCH = 0.0005;
  var CA = new Int32Array(64), CB = new Int32Array(64), CNX = new Float64Array(64), CNY = new Float64Array(64),
    CT = new Float64Array(64), CL = new Float64Array(64), CS = new Float64Array(64);

  Sim.prototype._ballBall = function (i, j) {
    var x = this.x, y = this.y, vx = this.vx, vy = this.vy, on = this.on;
    var nc = 0, lim2 = (D + TOUCH) * (D + TOUCH);
    function add(a, b) {
      for (var q = 0; q < nc; q++) if ((CA[q] === a && CB[q] === b) || (CA[q] === b && CB[q] === a)) return;
      var dx = x[b] - x[a], dy = y[b] - y[a];
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!(d > 0)) { dx = 1; dy = 0; d = 1; }
      var nx = dx / d, ny = dy / d;
      var rel = (vx[a] - vx[b]) * nx + (vy[a] - vy[b]) * ny;
      if (rel <= 1e-9 || nc >= 64) return;
      CA[nc] = a; CB[nc] = b; CNX[nc] = nx; CNY[nc] = ny; CT[nc] = -E_BALL * rel; CL[nc] = 0; CS[nc] = rel; nc++;
    }
    add(i, j);
    if (nc === 0) return;
    for (var k = 0; k < N; k++) {
      if (!on[k] || k === i || k === j) continue;
      var ex = x[k] - x[i], ey = y[k] - y[i];
      if (ex * ex + ey * ey < lim2) add(i, k);
      ex = x[k] - x[j]; ey = y[k] - y[j];
      if (ex * ex + ey * ey < lim2) add(j, k);
    }
    if (nc === 1) {
      var J = 0.5 * (1 + E_BALL) * CS[0];
      vx[i] -= J * CNX[0]; vy[i] -= J * CNY[0];
      vx[j] += J * CNX[0]; vy[j] += J * CNY[0];
    } else {
      // projected Gauss-Seidel: every contact leaves at -e times its approach speed
      for (var it = 0; it < 40; it++) {
        var change = 0;
        for (var c = 0; c < nc; c++) {
          var a = CA[c], b = CB[c], nx = CNX[c], ny = CNY[c];
          var rel = (vx[a] - vx[b]) * nx + (vy[a] - vy[b]) * ny;
          var dl = (rel - CT[c]) * 0.5;
          var nl = CL[c] + dl;
          if (nl < 0) nl = 0;
          dl = nl - CL[c];
          if (dl === 0) continue;
          CL[c] = nl;
          vx[a] -= dl * nx; vy[a] -= dl * ny; vx[b] += dl * nx; vy[b] += dl * ny;
          change += dl > 0 ? dl : -dl;
        }
        if (change < 1e-10) break;
      }
    }
    for (var e = 0; e < nc; e++) {
      this.collisions++;
      var p = CA[e], o = CB[e];
      if (this.firstHit < 0) { if (p === 0) this.firstHit = o; else if (o === 0) this.firstHit = p; }
      if (this.events) this.events.push({ k: 'b', a: p, b: o, s: CS[e], t: this.time });
    }
  };

  /** Rebound from a cushion or knuckle with inward normal (nx, ny). e < 0
   *  selects the speed-dependent cushion restitution. */
  Sim.prototype._cushion = function (i, nx, ny, e) {
    var vx = this.vx, vy = this.vy, wx = this.wx, wy = this.wy, wz = this.wz;
    var tx = -ny, ty = nx;
    var vn = vx[i] * nx + vy[i] * ny;
    if (vn >= 0) return;
    var vt = vx[i] * tx + vy[i] * ty;
    var spd = -vn;
    if (e === -2) { e = 0.25 + 0.3 * spd; if (e > 0.85) e = 0.85; }   // knuckle: soft when slow, lively when hit hard
    else if (e < 0) { e = 0.92 - 0.04 * spd; if (e < 0.7) e = 0.7; if (e > 0.9) e = 0.9; }
    var vn2 = -e * vn;
    // tangential grip: running/check side and sliding along the rail
    var slip = vt - R * wz[i];
    var lim = MU_CUSHION * (1 + e) * spd;
    var dvt = -slip / 3.5;
    if (dvt > lim) dvt = lim; else if (dvt < -lim) dvt = -lim;
    vt += dvt;
    wz[i] -= 2.5 * dvt / R;
    // the nose sits above the ball's centre, which kills most of the roll
    // about the rail's axis and leaves a little natural roll outwards
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
    this.pocketed.push({ b: i, p: q, t: this.time });
    if (this.events) this.events.push({ k: 'p', a: i, p: q, s: sp, t: this.time, x: this.x[i], y: this.y[i], vx: this.vx[i], vy: this.vy[i] });
    this.remove(i, q);
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

  // Only a pocket lets a ball past a cushion nose; anything that gets there
  // another way (it never should) drops into the nearest pocket or, if far
  // from every pocket, counts as off the table.
  Sim.prototype._containment = function () {
    var x = this.x, y = this.y, on = this.on, m = 1.25 * R;
    for (var i = 0; i < N; i++) {
      if (!on[i]) continue;
      if (x[i] > -m && x[i] < L + m && y[i] > -m && y[i] < W + m) continue;
      var bestQ = -1, bestD = 0.15 * 0.15;
      for (var q = 0; q < NPOCK; q++) {
        var dx = x[i] - QX[q], dy = y[i] - QY[q], d2 = dx * dx + dy * dy;
        if (d2 < bestD) { bestD = d2; bestQ = q; }
      }
      if (bestQ >= 0) { this._pocket(i, bestQ); continue; }
      if (i === 0) this.cueOff = true;
      this.pocketed.push({ b: i, p: -1, t: this.time, off: true });
      if (this.events) this.events.push({ k: 'o', a: i, t: this.time });
      this.remove(i, -1);
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
  // Blackball rack, apex towards baulk. 1 = red, 2 = yellow, 8 = black;
  // a red and a yellow in the back corners and each colour spread out.
  var RACK_PATTERN = [
    [1],
    [2, 1],
    [1, 8, 2],
    [2, 1, 2, 1],
    [1, 2, 2, 1, 2]
  ];

  /** Rack the balls (black on the black spot in the middle of the third row)
   *  and put the cue ball in baulk. The seed picks which colour takes which
   *  slot (mirror and colour swap) and adds sub-millimetre jitter. */
  function rack(sim, seed) {
    var rnd = mulberry32(seed || 1);
    sim.clear();
    var swap = rnd() < 0.5, mirror = rnd() < 0.5;
    var reds = [1, 2, 3, 4, 5, 6, 7], yellows = [9, 10, 11, 12, 13, 14, 15];
    var gap = 0.0001;
    var dxr = Math.sqrt(3) * (R + gap / 2), dyr = 2 * R + gap;
    var apexX = BLACK_SPOT_X - 2 * dxr;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c <= r; c++) {
        var col = RACK_PATTERN[r][mirror ? r - c : c];
        var ball;
        if (col === 8) ball = 8;
        else {
          var red = (col === 1) !== swap;
          ball = red ? reds.shift() : yellows.shift();
        }
        var jx = (rnd() - 0.5) * 0.00004, jy = (rnd() - 0.5) * 0.00004;
        if (ball === 8) { jx = 0; jy = 0; }
        sim.place(ball, apexX + r * dxr + jx, W / 2 + (c - r / 2) * dyr + jy);
      }
    }
    sim.place(0, BAULK_X * 0.55, W / 2 + (rnd() - 0.5) * 0.12);
    sim.resetShot();
  }

  /** Is (x, y) a legal spot for the cue ball? baulk = must be behind the baulk line. */
  function validCueSpot(sim, x, y, baulk) {
    if (!(x >= R && x <= L - R && y >= R && y <= W - R)) return false;
    if (baulk && x > BAULK_X) return false;
    for (var i = 1; i < N; i++) {
      if (!sim.on[i]) continue;
      var dx = sim.x[i] - x, dy = sim.y[i] - y;
      if (dx * dx + dy * dy < D2 * 1.0001) return false;
    }
    return true;
  }

  /** Nearest legal cue spot to (x, y), searching outwards. */
  function nearestCueSpot(sim, x, y, baulk) {
    var maxX = baulk ? BAULK_X : L - R;
    x = Math.min(Math.max(x, R), maxX); y = Math.min(Math.max(y, R), W - R);
    if (validCueSpot(sim, x, y, baulk)) return [x, y];
    for (var rad = 0.004; rad < 1.2; rad += 0.004) {
      var steps = Math.max(8, Math.round(rad * 300));
      for (var k = 0; k < steps; k++) {
        var a = (k / steps) * Math.PI * 2;
        var px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (validCueSpot(sim, px, py, baulk)) return [px, py];
      }
    }
    return [BAULK_X / 2, W / 2];
  }

  function inBaulk(x) { return x < BAULK_X; }

  // ------------------------------------------------------ aim prediction
  /** First cushion/knuckle/pocket a ball rolling along a ray reaches. */
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
    for (var p = 0; p < NKN; p++) {
      var pdx = KX[p] - ox, pdy = KY[p] - oy;
      var b = pdx * dx + pdy * dy;
      if (b <= 0) continue;
      var c = pdx * pdx + pdy * pdy - KR2[p];
      var disc = b * b - c;
      if (disc < 0) continue;
      var t2 = b - Math.sqrt(disc);
      if (t2 < 0 || t2 >= best) continue;
      best = t2;
      var hx = ox + dx * t2 - KX[p], hy = oy + dy * t2 - KY[p], hl = Math.sqrt(hx * hx + hy * hy) || 1;
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
      if (tq >= 0 && tq < best) { best = tq; pocket = q; nx = 0; ny = 0; }
    }
    return { t: best, nx: nx, ny: ny, pocket: pocket };
  }

  /** First ball (other than skipA/skipB) a ball moving along a ray touches. */
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

  /** What the aim guide shows: ghost ball, object-ball line and cue-ball
   *  tangent line, or the cushion point when no ball is in the way. */
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
    var after = rc.pocket >= 0 ? { t: 0 } : rayCushion(hx, hy, rx, ry);
    var afterB = rc.pocket >= 0 ? { t: 0 } : rayBall(sim, hx, hy, rx, ry, 0, -1);
    return { type: 'cushion', t: rc.t, hx: hx, hy: hy, rx: rx, ry: ry, pocket: rc.pocket, afterLen: Math.min(after.t, afterB.t) };
  }

  var api = {
    L: L, W: W, R: R, D: D, DT: DT, G: G, N: N,
    MAX_SPEED: MAX_SPEED, MIN_SPEED: MIN_SPEED, MAX_TIME: MAX_TIME, SPIN_OFFSET: SPIN_OFFSET,
    ROLL_DECEL: ROLL_DECEL, MU_SLIDE: MU_SLIDE, E_BALL: E_BALL,
    BAULK_X: BAULK_X, BLACK_SPOT_X: BLACK_SPOT_X, CENTER_X: CENTER_X,
    TABLE: TABLE, POCKETS: POCKETS,
    Sim: Sim, rack: rack, validCueSpot: validCueSpot, nearestCueSpot: nearestCueSpot, inBaulk: inBaulk,
    powerToSpeed: powerToSpeed, speedToPower: speedToPower, mulberry32: mulberry32,
    predictAim: predictAim, rayBall: rayBall, rayCushion: rayCushion
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PoolPhysics = api;
})(typeof window !== 'undefined' ? window : globalThis);
