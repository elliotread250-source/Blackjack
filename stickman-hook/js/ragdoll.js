/* Stickman Hook - cosmetic verlet ragdoll.
 *
 * Eleven points joined by sticks. It never feeds back into the gameplay
 * physics: each step it is anchored to the sim's body point, either by the
 * rope hand (swinging) or by the chest (flying, where only its rotation and
 * limb motion are its own, so it somersaults and flails naturally).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SHRagdoll = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // index: 0 head, 1 neck, 2 pelvis, 3 elbowL, 4 handL, 5 elbowR, 6 handR,
  //        7 kneeL, 8 footL, 9 kneeR, 10 footR
  var HEAD = 0, NECK = 1, PELVIS = 2, HAND_R = 6;
  var K = 1.25; // overall size
  var STAND = [
    [0, -37], [0, -27], [0, 0], [-7, -15], [-10, -3], [7, -15], [10, -3],
    [-5, 13], [-7, 27], [5, 13], [7, 27]
  ].map(function (p) { return [p[0] * K, p[1] * K]; });
  var STICKS = [
    [0, 1, 1], [1, 2, 1], [0, 2, 1],
    [1, 3, 1], [3, 4, 1], [1, 5, 1], [5, 6, 1],
    [2, 7, 1], [7, 8, 1], [2, 9, 1], [9, 10, 1]
  ];
  // keep limbs from folding flat: [a, b, minimum length]
  var MINS = [[1, 4, 11], [1, 6, 11], [2, 8, 17], [2, 10, 17], [7, 9, 4], [4, 2, 6], [6, 2, 6], [0, 8, 30], [0, 10, 30]]
    .map(function (m) { return [m[0], m[1], m[2] * K]; });

  function create(x, y) {
    var r = { px: new Float64Array(11), py: new Float64Array(11), ox: new Float64Array(11), oy: new Float64Array(11), len: [] };
    for (var i = 0; i < STICKS.length; i++) {
      var a = STAND[STICKS[i][0]], b = STAND[STICKS[i][1]];
      r.len.push(Math.hypot(a[0] - b[0], a[1] - b[1]));
    }
    setPose(r, x, y, 'stand', 0);
    return r;
  }

  /* Snap to a fixed pose with the pelvis at (x, y): 'stand', 'cheer'. */
  function setPose(r, x, y, kind, t) {
    for (var i = 0; i < 11; i++) {
      var p = STAND[i], dx = p[0], dy = p[1];
      if (kind === 'stand') {
        var b = Math.sin(t * 2.2) * 0.8;
        if (i === HEAD || i === NECK) dy += b;
        if (i === 3 || i === 5) { dy += b; dx *= 1 + 0.05 * Math.sin(t * 2.2); }
        if (i === 4 || i === 6) dy += b * 0.5;
      } else if (kind === 'cheer') {
        var w = Math.sin(t * 9);
        if (i === 3) { dx = -10 * K; dy = -36 * K; }
        if (i === 4) { dx = (-16 + w * 3) * K; dy = -48 * K; }
        if (i === 5) { dx = 10 * K; dy = -36 * K; }
        if (i === 6) { dx = (16 - w * 3) * K; dy = -48 * K; }
      }
      r.px[i] = r.ox[i] = x + dx;
      r.py[i] = r.oy[i] = y + dy;
    }
  }

  function satisfy(r, pinIdx, pinX, pinY) {
    for (var it = 0; it < 6; it++) {
      for (var s = 0; s < STICKS.length; s++) {
        var a = STICKS[s][0], b = STICKS[s][1], L = r.len[s];
        var dx = r.px[b] - r.px[a], dy = r.py[b] - r.py[a];
        var d = Math.sqrt(dx * dx + dy * dy) || 1e-6, k = (d - L) / d * 0.5;
        var wa = a === pinIdx ? 0 : 1, wb = b === pinIdx ? 0 : 1;
        if (wa + wb === 0) continue;
        var fa = 2 * wa / (wa + wb), fb = 2 * wb / (wa + wb);
        r.px[a] += dx * k * fa; r.py[a] += dy * k * fa;
        r.px[b] -= dx * k * fb; r.py[b] -= dy * k * fb;
      }
      for (var m = 0; m < MINS.length; m++) {
        var i = MINS[m][0], j = MINS[m][1], mn = MINS[m][2];
        var ex = r.px[j] - r.px[i], ey = r.py[j] - r.py[i], e = Math.sqrt(ex * ex + ey * ey) || 1e-6;
        if (e >= mn) continue;
        var q = (e - mn) / e * 0.25;
        if (i !== pinIdx) { r.px[i] += ex * q; r.py[i] += ey * q; }
        if (j !== pinIdx) { r.px[j] -= ex * q; r.py[j] -= ey * q; }
      }
      if (pinIdx >= 0) { r.px[pinIdx] = pinX; r.py[pinIdx] = pinY; }
    }
  }

  /* Swinging: the right hand holds the rope end. */
  function stepHang(r, hx, hy, hvx, hvy, dt, g) {
    for (var i = 0; i < 11; i++) {
      var vx = (r.px[i] - r.ox[i]) * 0.995, vy = (r.py[i] - r.oy[i]) * 0.995;
      r.ox[i] = r.px[i]; r.oy[i] = r.py[i];
      r.px[i] += vx; r.py[i] += vy + g * dt * dt;
    }
    r.px[HAND_R] = hx; r.py[HAND_R] = hy;
    r.ox[HAND_R] = hx - hvx * dt; r.oy[HAND_R] = hy - hvy * dt;
    satisfy(r, HAND_R, hx, hy);
  }

  /* Flying: chest follows the body point, rotation and limbs are free. */
  function stepFly(r, cx, cy, dt, spinDamp) {
    var i;
    for (i = 0; i < 11; i++) {
      var vx = (r.px[i] - r.ox[i]) * spinDamp, vy = (r.py[i] - r.oy[i]) * spinDamp;
      r.ox[i] = r.px[i]; r.oy[i] = r.py[i];
      r.px[i] += vx; r.py[i] += vy;
    }
    satisfy(r, -1, 0, 0);
    recentre(r, cx, cy);
  }

  /* Move so the chest sits on (cx, cy) and drop the shared drift velocity,
   * keeping only the spin and the limbs' own motion. */
  function recentre(r, cx, cy) {
    var mx = 0, my = 0, i;
    for (i = 0; i < 11; i++) { mx += r.px[i] - r.ox[i]; my += r.py[i] - r.oy[i]; }
    mx /= 11; my /= 11;
    var chx = (r.px[NECK] + r.px[PELVIS]) / 2, chy = (r.py[NECK] + r.py[PELVIS]) / 2;
    var dx = cx - chx, dy = cy - chy;
    for (i = 0; i < 11; i++) {
      var vx = r.px[i] - r.ox[i] - mx, vy = r.py[i] - r.oy[i] - my;
      r.px[i] += dx; r.py[i] += dy;
      r.ox[i] = r.px[i] - vx; r.oy[i] = r.py[i] - vy;
    }
  }

  /* Add spin (rad/s) around the chest, e.g. on letting go of the rope. */
  function spin(r, omega, dt) {
    var chx = (r.px[NECK] + r.px[PELVIS]) / 2, chy = (r.py[NECK] + r.py[PELVIS]) / 2;
    for (var i = 0; i < 11; i++) {
      var rx = r.px[i] - chx, ry = r.py[i] - chy;
      r.ox[i] += ry * omega * dt;
      r.oy[i] -= rx * omega * dt;
    }
  }

  /* Current spin rate around the chest (rad/s, positive = clockwise on screen). */
  function spinRate(r, dt) {
    var chx = (r.px[NECK] + r.px[PELVIS]) / 2, chy = (r.py[NECK] + r.py[PELVIS]) / 2;
    var num = 0, den = 0;
    for (var i = 0; i < 11; i++) {
      var rx = r.px[i] - chx, ry = r.py[i] - chy;
      var vx = (r.px[i] - r.ox[i]) / dt, vy = (r.py[i] - r.oy[i]) / dt;
      num += rx * vy - ry * vx; den += rx * rx + ry * ry;
    }
    return den > 0 ? num / den : 0;
  }

  /* Free fall with gravity, no anchor (after falling out of the level). */
  function stepFree(r, dt, g) {
    for (var i = 0; i < 11; i++) {
      var vx = r.px[i] - r.ox[i], vy = r.py[i] - r.oy[i];
      r.ox[i] = r.px[i]; r.oy[i] = r.py[i];
      r.px[i] += vx; r.py[i] += vy + g * dt * dt;
    }
    satisfy(r, -1, 0, 0);
  }

  function translate(r, dx, dy) {
    for (var i = 0; i < 11; i++) { r.px[i] += dx; r.py[i] += dy; r.ox[i] += dx; r.oy[i] += dy; }
  }

  return {
    create: create, setPose: setPose, stepHang: stepHang, stepFly: stepFly, stepFree: stepFree,
    spin: spin, spinRate: spinRate, recentre: recentre, translate: translate,
    FOOT: 27 * K, HEAD: HEAD, NECK: NECK, PELVIS: PELVIS, HAND_R: HAND_R
  };
});
