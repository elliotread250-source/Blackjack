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

  var LEVELS = [
    // ---------------- 1-5: Meadow - the basics ----------------
    {
      name: 'First Swing', hint: 'Hold anywhere to grab the hook • let go to fly',
      hooks: [[70, -180], [560, -160], [1050, -170]],
      finish: [1380, 300]
    },
    {
      name: 'Keep Going', hint: 'Let go on the upswing to fly further',
      hooks: [[70, -180], [540, -130], [1010, -190], [1480, -140], [1950, -180]],
      finish: [2280, 300]
    },
    {
      name: 'Up and Down',
      hooks: [[70, -180], [520, -320], [980, -90], [1440, -300], [1900, -120]],
      finish: [2230, 260]
    },
    {
      name: 'Long Reach',
      hooks: [[70, -180], [640, -200], [1230, -170], [1820, -220]],
      finish: [2180, 300]
    },
    {
      name: 'Over the Wall', hint: 'Swing high to clear walls',
      hooks: [[70, -180], [540, -170], [1060, -280], [1540, -180]],
      blocks: [[760, 40, 90, 560, 'solid']],
      finish: [1880, 300]
    },

    // ---------------- 6-10: Bubblegum - bounce pads ----------------
    {
      name: 'Boing!', hint: 'Bounce pads throw you back up',
      hooks: [[70, -180], [540, -160], [1330, -190], [1800, -160]],
      pads: [[930, 400, 170, 0]],
      finish: [2140, 300]
    },
    {
      name: 'Pad Hop',
      hooks: [[70, -180], [520, -170], [1700, -170]],
      pads: [[880, 420, 160, 12], [1280, 420, 160, 12]],
      finish: [2050, 300]
    },
    {
      name: 'Angles',
      hooks: [[70, -180], [520, -190], [1560, -230], [2020, -180]],
      pads: [[900, 420, 160, 28, 1750]],
      finish: [2360, 300]
    },
    {
      name: 'Rubber Floor', hint: 'Pink walls are bouncy',
      hooks: [[70, -180], [540, -160], [1240, -220], [1720, -160]],
      blocks: [[760, 440, 680, 70, 'bouncy']],
      finish: [2060, 300]
    },
    {
      name: 'Bouncy Castle',
      hooks: [[70, -180], [540, -160], [1460, -200], [1920, -190]],
      blocks: [[860, -560, 70, 470, 'bouncy']],
      pads: [[1110, 430, 170, 10]],
      finish: [2260, 300]
    },

    // ---------------- 11-15: Mint - moving hooks ----------------
    {
      name: 'On the Move', hint: 'Some hooks move • time your grab',
      hooks: [[70, -180], [560, -160, { ay: 110, per: 2.6 }], [1050, -170], [1540, -160, { ay: 140, per: 3 }]],
      finish: [1880, 300]
    },
    {
      name: 'Slide',
      hooks: [[70, -180], [600, -180, { ax: 150, per: 3 }], [1130, -200, { ax: 180, per: 3.4, ph: 1 }], [1640, -180]],
      finish: [1990, 300]
    },
    {
      name: 'Rush Hour',
      hooks: [[70, -180], [560, -200, { ay: 150, per: 2.4 }], [1060, -160, { ax: 160, per: 2.8, ph: 2 }],
        [1560, -220, { ay: 150, per: 2.2, ph: 1 }], [2060, -170, { ax: 140, per: 3 }]],
      finish: [2400, 300]
    },
    {
      name: 'Bounce & Catch',
      hooks: [[70, -180], [540, -170], [1360, -260, { ax: 170, per: 3.2 }], [1860, -200, { ay: 130, per: 2.5 }]],
      pads: [[930, 420, 170, 8]],
      finish: [2200, 300]
    },
    {
      name: 'Big Gap', hint: 'Hold longer to build up speed',
      hooks: [[70, -180], [520, -200], [1720, -260], [2190, -200]],
      finish: [2530, 300]
    },

    // ---------------- 16-20: Lavender - spinners and gaps ----------------
    {
      name: 'Spinner', hint: 'Spinning bars knock you around',
      hooks: [[70, -180], [540, -170], [1240, -190], [1720, -170]],
      spinners: [[890, 120, 300, 1.4]],
      finish: [2060, 300]
    },
    {
      name: 'Windmills',
      hooks: [[70, -180], [540, -170], [1060, -200], [1580, -170], [2060, -190]],
      spinners: [[800, 140, 280, 1.6], [1320, 120, 280, -1.6, 1]],
      finish: [2400, 300]
    },
    {
      name: 'Needle', hint: 'Thread the gap',
      hooks: [[70, -180], [540, -170], [1220, -180], [1700, -170]],
      blocks: [[860, -900, 110, 830, 'solid'], [860, 150, 110, 600, 'solid']],
      finish: [2040, 300]
    },
    {
      name: 'Gatekeeper',
      hooks: [[70, -180], [540, -170], [1250, -200], [1760, -180]],
      blocks: [[880, -900, 100, 800, 'solid'], [880, 190, 100, 600, 'solid']],
      spinners: [[930, 45, 230, 1.2]],
      finish: [2100, 300]
    },
    {
      name: 'Wind Up',
      hooks: [[70, -180], [500, -220], [1860, -300], [2320, -220]],
      finish: [2660, 300]
    },

    // ---------------- 21-25: Sunset - long jumps and combos ----------------
    {
      name: 'Skyline',
      hooks: [[70, -180], [520, -300], [1000, -520], [1480, -300], [1960, -520], [2440, -260]],
      blocks: [[700, 120, 120, 600, 'solid'], [1680, 60, 120, 660, 'solid']],
      finish: [2780, 280]
    },
    {
      name: 'Trampoline Park',
      hooks: [[70, -180], [520, -170], [2280, -200]],
      pads: [[880, 430, 160, 15], [1260, 430, 160, 15], [1640, 430, 160, 15], [1990, 430, 140, -10]],
      blocks: [[1450, -700, 60, 560, 'bouncy']],
      finish: [2620, 300]
    },
    {
      name: 'Pendulum Alley',
      hooks: [[70, -180], [540, -180, { ax: 200, per: 2.6 }], [1100, -200, { ax: 200, per: 2.6, ph: 3.14 }],
        [1660, -180, { ax: 200, per: 2.6 }], [2220, -200]],
      spinners: [[1380, 220, 260, 1.8]],
      finish: [2560, 300]
    },
    {
      name: 'Leap of Faith',
      hooks: [[70, -180], [500, -230], [1900, -330, { ay: 120, per: 3 }], [2380, -220]],
      pads: [[1200, 520, 170, 20, 1600]],
      finish: [2720, 300]
    },
    {
      name: 'The Tube',
      hooks: [[70, -180], [520, -170], [980, -60], [1420, -60], [1860, -60], [2320, -180]],
      blocks: [[720, -520, 1380, 90, 'bouncy'], [720, 260, 1380, 80, 'bouncy']],
      finish: [2660, 300]
    },

    // ---------------- 26-30: Starlight - the hard stuff ----------------
    {
      name: 'Zig Zag',
      hooks: [[70, -180], [500, -120], [930, -480], [1360, -80], [1790, -480], [2220, -120]],
      blocks: [[700, -260, 70, 330, 'bouncy'], [1560, -260, 70, 330, 'bouncy']],
      spinners: [[1150, -280, 240, 2]],
      finish: [2560, 300]
    },
    {
      name: 'Double Trouble',
      hooks: [[70, -180], [540, -170], [1300, -220, { ay: 160, per: 2.2 }], [2100, -200, { ax: 180, per: 2.8 }]],
      spinners: [[900, 100, 300, -1.8], [1700, 80, 300, 1.8, 0.8]],
      pads: [[1700, 520, 170, 10]],
      finish: [2460, 300]
    },
    {
      name: 'Slalom',
      hooks: [[70, -180], [520, -160], [1000, -160], [1480, -160], [1960, -160], [2440, -160]],
      blocks: [[740, -760, 90, 640, 'solid'], [1220, 10, 90, 700, 'solid'],
        [1700, -760, 90, 640, 'solid'], [2180, 10, 90, 700, 'solid']],
      finish: [2780, 300]
    },
    {
      name: 'Rocket Ride',
      hooks: [[70, -180], [520, -200], [3000, -280], [3460, -220]],
      pads: [[1000, 450, 170, 35, 2000], [1950, 400, 170, 30, 1900]],
      blocks: [[1420, -900, 80, 660, 'bouncy']],
      finish: [3800, 300]
    },
    {
      name: 'Grand Finale',
      hooks: [[70, -180], [520, -200], [1000, -260, { ay: 140, per: 2.4 }], [1980, -300],
        [2480, -200, { ax: 170, per: 2.6, ph: 1.5 }], [3000, -220]],
      blocks: [[1240, -900, 90, 780, 'solid'], [1240, 260, 90, 500, 'solid'], [2700, -120, 70, 500, 'bouncy']],
      spinners: [[1285, 70, 200, 1.6], [1700, 160, 280, -1.4]],
      pads: [[2250, 520, 170, 14]],
      finish: [3340, 300]
    }
  ];

  // Three-star target times in seconds, from tools/solve.cjs (solver time
  // x 1.35, rounded up to a quarter second). Filled in below.
  var PARS = [];
  LEVELS.forEach(function (l, i) { if (PARS[i]) l.par = PARS[i]; });

  return { LEVELS: LEVELS };
});
