/* Stickman Hook - level data.
 *
 * Coordinates are world pixels, y points down. The stickman starts standing on
 * a start block at `start` (default [0, 200]) and the first press hops him up
 * to the first hook. `finish` is [left x, top y] of the goal podium.
 *
 *   hooks:    [x, y]  or  [x, y, {ax, ay, per, ph}]  (moves sinusoidally:
 *             x + ax*sin(2*pi*t/per + ph), y + ay*sin(...))
 *   pads:     [x, y, width, angleDeg, power]   trampoline, (x, y) = middle of
 *             the top surface; positive angles tilt the bounce forward
 *   blocks:   [x, y, w, h, 'solid' | 'bouncy']
 *   spinners: [cx, cy, length, radPerSec, phase]   rotating bouncy bar
 *   par:      seconds for three stars (set from the solver's times)
 *
 * Every level is proven finishable by tools/solve.cjs.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SHLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Small helpers so the data stays readable. They only expand to plain
  // coordinates; every level below is laid out by hand.
  function row(x0, dx, ys, moves) {
    return ys.map(function (y, i) {
      return moves && moves[i] ? [x0 + i * dx, y, moves[i]] : [x0 + i * dx, y];
    });
  }
  /* A wall with a gap from `top` to `bot` (y), `w` wide. */
  function gate(x, top, bot, w, type) {
    return [[x, top - 1100, w || 100, 1100, type || 'solid'], [x, bot, w || 100, 480, type || 'solid']];
  }
  function cat() { return Array.prototype.concat.apply([], arguments); }

  var LEVELS = [
    // ---------------- 1-5: Meadow - the basics ----------------
    {
      name: 'First Swing', hint: 'Hold anywhere to grab the hook • let go to fly',
      hooks: [[70, -180], [560, -160], [1050, -170]],
      finish: [1380, 300]
    },
    {
      name: 'Keep Going', hint: 'Let go on the upswing to fly further',
      hooks: row(70, 470, [-180, -140, -200, -130, -190, -150, -200]),
      finish: [3200, 300]
    },
    {
      name: 'Up and Down',
      hooks: row(70, 450, [-180, -330, -90, -340, -80, -330, -100, -300]),
      finish: [3540, 260]
    },
    {
      name: 'Long Reach',
      hooks: row(70, 600, [-180, -200, -170, -230, -190, -220]),
      finish: [3420, 300]
    },
    {
      name: 'Over the Wall', hint: 'Swing high to clear walls',
      hooks: row(70, 480, [-180, -170, -280, -180, -300, -190, -200]),
      blocks: [[760, 40, 90, 560], [1720, -20, 90, 620], [2680, 60, 90, 540]],
      finish: [3280, 300]
    },

    // ---------------- 6-10: Bubblegum - bounce pads ----------------
    {
      name: 'Boing!', hint: 'Bounce pads throw you back up',
      hooks: [[70, -180], [540, -160], [1330, -190], [1800, -160], [2270, -200], [3050, -200], [3520, -170]],
      pads: [[930, 400, 170, 0], [2650, 420, 170, 0]],
      finish: [3860, 300]
    },
    {
      name: 'Pad Hop',
      hooks: [[70, -180], [520, -170], [1700, -170], [2160, -190], [3700, -180]],
      pads: [[880, 420, 160, 12], [1280, 420, 160, 12], [2520, 430, 160, 10], [2900, 430, 160, 10], [3280, 430, 160, 10]],
      finish: [4050, 300]
    },
    {
      name: 'Angles',
      hooks: [[70, -180], [520, -190], [1560, -230], [2020, -180], [3150, -250], [3620, -200]],
      pads: [[900, 420, 160, 28, 1750], [2420, 440, 160, 30, 1800]],
      blocks: [[2700, -720, 300, 200]],
      finish: [3980, 300]
    },
    {
      name: 'Rubber Floor', hint: 'Pink walls are bouncy',
      hooks: [[70, -180], [540, -160], [1240, -220], [1720, -160], [2400, -220], [3100, -180], [3560, -200]],
      blocks: [[760, 440, 680, 70, 'bouncy'], [1950, 460, 900, 70, 'bouncy'], [1950, -640, 900, 80, 'bouncy']],
      finish: [3900, 300]
    },
    {
      name: 'Bouncy Castle',
      hooks: [[70, -180], [540, -160], [1460, -200], [1920, -190], [2500, -150], [2960, -200], [3700, -220]],
      blocks: [[860, -560, 70, 470, 'bouncy'], [2200, -600, 70, 520, 'bouncy'], [2200, 330, 70, 300, 'bouncy']],
      pads: [[1110, 430, 170, 10], [3300, 440, 170, 12]],
      finish: [4050, 300]
    },

    // ---------------- 11-15: Mint - moving hooks ----------------
    {
      name: 'On the Move', hint: 'Some hooks move • time your grab',
      hooks: row(70, 490, [-180, -160, -170, -160, -190, -170, -180],
        [0, { ay: 110, per: 2.6 }, 0, { ay: 140, per: 3 }, 0, { ay: 130, per: 2.4, ph: 1 }]),
      finish: [3350, 300]
    },
    {
      name: 'Slide',
      hooks: row(70, 530, [-180, -180, -200, -180, -190, -200],
        [0, { ax: 150, per: 3 }, { ax: 180, per: 3.4, ph: 1 }, 0, { ax: 170, per: 2.8, ph: 2 }]),
      blocks: [[1900, 30, 90, 560]],
      finish: [3070, 300]
    },
    {
      name: 'Rush Hour',
      hooks: row(70, 500, [-180, -200, -160, -220, -170, -200, -180, -190],
        [0, { ay: 150, per: 2.4 }, { ax: 160, per: 2.8, ph: 2 }, { ay: 150, per: 2.2, ph: 1 },
          { ax: 140, per: 3 }, { ay: 140, per: 2.6, ph: 2 }, { ax: 150, per: 2.4, ph: 0.5 }]),
      finish: [3910, 300]
    },
    {
      name: 'Bounce & Catch',
      hooks: [[70, -180], [540, -170], [1360, -260, { ax: 170, per: 3.2 }], [1860, -200, { ay: 130, per: 2.5 }],
        [2680, -280, { ay: 150, per: 2.2 }], [3180, -200, { ax: 160, per: 2.6, ph: 1 }]],
      pads: [[930, 420, 170, 8], [2250, 430, 170, 8]],
      finish: [3520, 300]
    },
    {
      name: 'Big Gap', hint: 'Hold longer to build up speed',
      hooks: [[70, -180], [520, -200], [1720, -260], [2190, -200], [3500, -280], [3960, -220]],
      finish: [4300, 300]
    },

    // ---------------- 16-20: Lavender - spinners and gaps ----------------
    {
      name: 'Spinner', hint: 'Spinning bars knock you around',
      hooks: [[70, -180], [540, -170], [1240, -190], [1720, -170], [2420, -190], [2900, -180]],
      spinners: [[890, 120, 300, 1.4], [2070, 100, 320, -1.5]],
      finish: [3240, 300]
    },
    {
      name: 'Windmills',
      hooks: row(70, 520, [-180, -170, -200, -170, -190, -180, -200]),
      spinners: [[800, 140, 280, 1.6], [1320, 120, 280, -1.6, 1], [2360, 130, 300, 1.8], [2880, 110, 280, -1.7, 2]],
      finish: [3530, 300]
    },
    {
      name: 'Needle', hint: 'Thread the gap',
      hooks: [[70, -180], [540, -170], [1220, -180], [1700, -170], [2380, -200], [2860, -170], [3540, -190]],
      blocks: cat(gate(860, -70, 150, 110), gate(2040, -40, 160, 110), gate(3200, -20, 170, 110)),
      finish: [3880, 300]
    },
    {
      name: 'Gatekeeper',
      hooks: [[70, -180], [540, -170], [1250, -200], [1760, -180], [2470, -200], [2980, -180]],
      blocks: cat(gate(880, -100, 190), gate(2110, -120, 200)),
      spinners: [[930, 45, 230, 1.2], [2160, 40, 250, -1.4]],
      finish: [3320, 300]
    },
    {
      name: 'Wind Up',
      hooks: [[70, -180], [500, -220], [1860, -300], [2320, -220], [3600, -300], [4060, -240]],
      finish: [4400, 300]
    },

    // ---------------- 21-25: Sunset - long jumps and combos ----------------
    {
      name: 'Skyline',
      hooks: [[70, -180], [520, -300], [1000, -520], [1480, -300], [1960, -520], [2440, -260], [2920, -480], [3400, -260]],
      blocks: [[700, 120, 120, 600], [1680, 60, 120, 660], [2650, 80, 120, 640]],
      finish: [3740, 280]
    },
    {
      name: 'Trampoline Park',
      hooks: [[70, -180], [520, -170], [2280, -200], [2740, -180], [3880, -200]],
      pads: [[880, 430, 160, 15], [1260, 430, 160, 15], [1640, 430, 160, 15], [1990, 430, 140, -10],
        [3100, 440, 160, 15], [3480, 440, 160, 15]],
      blocks: [[1450, -700, 60, 560, 'bouncy']],
      finish: [4220, 300]
    },
    {
      name: 'Pendulum Alley',
      hooks: [[70, -180], [540, -180, { ax: 200, per: 2.6 }], [1100, -200, { ax: 200, per: 2.6, ph: 3.14 }],
        [1660, -180, { ax: 200, per: 2.6 }], [2220, -200], [2780, -190, { ax: 200, per: 2.4, ph: 1 }],
        [3340, -200, { ax: 200, per: 2.4, ph: 4 }]],
      spinners: [[1380, 220, 260, 1.8], [3060, 230, 260, -1.8]],
      finish: [3680, 300]
    },
    {
      name: 'Leap of Faith',
      hooks: [[70, -180], [500, -230], [1900, -330, { ay: 120, per: 3 }], [2380, -220],
        [3750, -320, { ay: 120, per: 2.6 }], [4230, -220]],
      pads: [[1200, 520, 170, 20, 1600], [3050, 540, 170, 22, 1650]],
      finish: [4570, 300]
    },
    {
      name: 'The Tube',
      hooks: [[70, -180], [520, -170], [980, -60], [1420, -60], [1860, -60], [2320, -180], [2780, -60], [3220, -60], [3680, -180]],
      blocks: [[720, -520, 1380, 90, 'bouncy'], [720, 260, 1380, 80, 'bouncy'],
        [2560, -500, 900, 90, 'bouncy'], [2560, 240, 900, 80, 'bouncy']],
      finish: [4020, 300]
    },

    // ---------------- 26-30: Starlight - the hard stuff ----------------
    {
      name: 'Zig Zag',
      hooks: [[70, -180], [500, -120], [930, -480], [1360, -80], [1790, -480], [2220, -120], [2650, -480], [3080, -100]],
      blocks: [[700, -260, 70, 330, 'bouncy'], [1560, -260, 70, 330, 'bouncy'], [2420, -260, 70, 330, 'bouncy']],
      spinners: [[1150, -280, 240, 2], [2010, -280, 240, -2]],
      finish: [3420, 300]
    },
    {
      name: 'Double Trouble',
      hooks: [[70, -180], [540, -170], [1300, -220, { ay: 160, per: 2.2 }], [2100, -200, { ax: 180, per: 2.8 }],
        [2900, -220, { ay: 150, per: 2.4, ph: 1 }], [3600, -200]],
      spinners: [[900, 100, 300, -1.8], [1700, 80, 300, 1.8, 0.8], [2500, 90, 300, -1.6, 2]],
      pads: [[1700, 520, 170, 10]],
      finish: [3950, 300]
    },
    {
      name: 'Slalom',
      hooks: row(70, 480, [-180, -160, -160, -160, -160, -160, -160, -160]),
      blocks: [[740, -760, 90, 640], [1220, 10, 90, 700], [1700, -760, 90, 640],
        [2180, 10, 90, 700], [2660, -760, 90, 640], [3140, 10, 90, 700]],
      finish: [3760, 300]
    },
    {
      name: 'Rocket Ride',
      hooks: [[70, -180], [520, -200], [3000, -280], [3460, -220], [3920, -200], [5300, -260], [5760, -200]],
      pads: [[1000, 450, 170, 35, 2000], [1950, 400, 170, 30, 1900], [4300, 460, 170, 32, 1950]],
      blocks: [[1420, -900, 80, 660, 'bouncy']],
      finish: [6100, 300]
    },
    {
      name: 'Grand Finale',
      hooks: [[70, -180], [520, -200], [1000, -260, { ay: 140, per: 2.4 }], [1980, -300],
        [2480, -200, { ax: 170, per: 2.6, ph: 1.5 }], [3000, -220], [3480, -180, { ay: 150, per: 2.2 }],
        [4000, -200], [4480, -220]],
      blocks: cat(gate(1240, -120, 260, 90), [[2700, -120, 70, 500, 'bouncy']], gate(3700, -120, 180, 90)),
      spinners: [[1285, 70, 200, 1.6], [1700, 160, 280, -1.4], [3745, 30, 220, 1.8]],
      pads: [[2250, 520, 170, 14]],
      finish: [4820, 300]
    }
  ];

  // Three-star target times in seconds: the solver's time (tools/solve.cjs)
  // x 1.6 + 1 s, rounded up to a quarter second.
  var PARS = [4.0, 11.75, 11.75, 13.0, 11.75, 12.75, 7.5, 8.25, 11.25, 7.25, 8.75, 12.5, 8.25, 6.5, 14.0, 11.75, 10.0, 11.0, 10.0, 14.75, 13.75, 7.25, 11.5, 14.5, 11.0, 8.25, 9.75, 11.5, 18.75, 16.5];
  LEVELS.forEach(function (l, i) { if (PARS[i]) l.par = PARS[i]; });

  return { LEVELS: LEVELS };
});
