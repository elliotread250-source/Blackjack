/*
 * Vector shapes. World units: the arcade's 1024 x 768 screen space.
 * The ship points along +x at angle 0; y grows downwards.
 */
(function () {
  'use strict';

  // The ship: two long sides from the nose to the wing tips and a short cross
  // bar set in from the back, which leaves the little notch the arcade ship has.
  const SHIP = {
    nose: [10, 0],
    left: [-9, -7],
    right: [-9, 7],
    barL: [-5.6, -5.3],
    barR: [-5.6, 5.3],
    flame: [[-5.6, -2.8], [-13.5, 0], [-5.6, 2.8]],
  };

  // The four rock outlines, on an 8 x 8 grid around the centre (y down).
  // Large rocks scale each grid unit to 9 world units, mediums 4.5, smalls 2.25.
  const ROCKS = [
    [[-2, -4], [0, -2], [2, -4], [4, -2], [3, 0], [4, 2], [1, 4], [-2, 4], [-4, 2], [-4, -2]],
    [[-4, -2], [-1, -2.5], [-2, -4], [2, -4], [4, -1], [4, 1], [2, 4], [-1, 4], [-1.5, 3], [-4, 2]],
    [[-2, -4], [1, -4], [4, -2], [4, 1], [2, 4], [-1, 4], [-1, 2], [-4, 2], [-2, 0], [-4, -2]],
    [[-1, -4], [2, -4], [4, -2], [2, -1], [4, 1], [3, 4], [0, 3], [-3, 4], [-4, 1], [-4, -2], [-2, -2]],
  ];
  const ROCK_UNIT = [0, 2.25, 4.5, 9];

  // Saucer at large size (half-width 20); the small one is half of this.
  const SAUCER = {
    hull: [[-20, 0], [-8, -6], [8, -6], [20, 0], [8, 6.5], [-8, 6.5], [-20, 0]],
    belt: [[-20, 0], [20, 0]],
    dome: [[-8, -6], [-4.5, -12], [4.5, -12], [8, -6]],
  };

  window.Shapes = { SHIP, ROCKS, ROCK_UNIT, SAUCER };
})();
