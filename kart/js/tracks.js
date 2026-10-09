// The five tracks. Control points are [x, z, y]; sections/ramps/pads/boxes refer to positions
// along the spline in control-point units (2.5 = halfway between point 2 and point 3).
// Lateral offsets d are metres from the centre line, + = right-hand side when driving.
export const TRACK_DEFS = [
  {
    id: 'meadow', name: 'Sunny Meadow', theme: 'meadow', blurb: 'Rolling green hills, a windmill and a gentle first circuit.',
    width: 18, off: 9, offSurf: 'grass', bank: 0.8,
    pts: [[-40, -95, 0], [40, -95, 0], [105, -86, 1], [142, -48, 3], [148, 14, 6], [120, 62, 8], [64, 70, 7], [24, 42, 4], [-16, 46, 3], [-50, 92, 4], [-108, 104, 5], [-152, 66, 4], [-160, -6, 2], [-130, -70, 0.5], [-86, -95, 0]],
    sections: [
      { a: 10.2, b: 12.5, lane: { side: 'in', div: 2.5, w: 7 } },
    ],
    pads: [{ at: 1.7, d: 0 }, { at: 11.4, lane: true }, { at: 6.2, d: 3 }],
    boxes: [1.2, 5.2, 8.9, 13.2],
  },
  {
    id: 'canyon', name: 'Desert Canyon', theme: 'canyon', blurb: 'Red rock walls, cactus flats and a big jump over the gorge.',
    width: 16, off: 6, offSurf: 'sand', bank: 0.7,
    pts: [[0, -130, 2], [0, -50, 2], [8, 10, 3], [40, 56, 5], [96, 74, 7], [142, 44, 8], [152, -16, 6], [124, -62, 4], [82, -56, 4], [60, -100, 3], [92, -150, 2], [64, -204, 1], [4, -214, 1], [-30, -178, 2]],
    ramps: [{ at: 1.55, len: 14, h: 3, gap: 13 }],
    sections: [
      { a: 3.0, b: 6.4, lane: { side: 'in', div: 2.5, w: 6.5 } },
    ],
    pads: [{ at: 1.1, d: 0 }, { at: 4.8, lane: true }, { at: 11.5, d: -3 }],
    boxes: [0.6, 3.6, 8.2, 12.6],
    obstacles: [{ at: 12.2, d: 10.5, r: 2.2 }, { at: 10.4, d: 10, r: 2.2 }],
  },
  {
    id: 'snow', name: 'Snow Peak', theme: 'snow', blurb: 'Climb the mountain pass, then slide across the frozen lake.',
    width: 16, off: 7, offSurf: 'snow', bank: 1.1,
    pts: [[0, -120, 0], [70, -128, 0], [130, -100, 3], [150, -40, 8], [128, 20, 13], [80, 40, 17], [30, 80, 21], [-30, 100, 22], [-90, 80, 18], [-112, 30, 12], [-92, -20, 6], [-70, -62, 2], [-80, -96, 0.5], [-48, -121, 0]],
    sections: [
      { a: 10.1, b: 12.0, road: 'ice', off: 4 },
      { a: 6.2, b: 8.4, lane: { side: 'in', div: 2.5, w: 6.5 } },
      { a: 3.6, b: 5.6, offR: 3 },
    ],
    pads: [{ at: 0.8, d: 0 }, { at: 7.3, lane: true }, { at: 9.4, d: 2 }],
    boxes: [0.4, 4.6, 8.9, 11.6],
  },
  {
    id: 'city', name: 'Neon City', theme: 'city', blurb: 'Night streets, tight corners and a flyover across downtown.',
    width: 15, off: 3.5, offSurf: 'grass', bank: 0.35,
    pts: [[-40, -110, 0], [40, -110, 0], [90, -100, 0], [104, -60, 0], [70, -30, 4.5], [20, -10, 9.5], [-20, 30, 11], [-30, 80, 11], [10, 108, 9], [60, 90, 5], [70, 40, 1.5], [40, 5, 0], [-40, -2, 0], [-90, -10, 0], [-110, -60, 0], [-90, -104, 0]],
    sections: [
      { a: 7.6, b: 9.6, lane: { side: 'in', div: 2, w: 6 } },
      { a: 4.6, b: 6.4, bridge: true, off: 1.5 },
    ],
    pads: [{ at: 0.9, d: 0 }, { at: 8.6, lane: true }, { at: 12.5, d: -3 }, { at: 12.5, d: 3 }],
    boxes: [0.5, 3.6, 10.6, 14.2],
  },
  {
    id: 'volcano', name: 'Lava Island', theme: 'volcano', blurb: 'Climb the volcano past rivers of lava, then leap down its flank.',
    width: 16, off: 6, offSurf: 'lava', bank: 0.9,
    pts: [[0, -150, 0], [70, -145, 0], [130, -110, 2], [150, -50, 5], [128, -2, 8], [142, 48, 11], [115, 100, 15], [55, 125, 19], [-5, 115, 23], [-60, 125, 25], [-115, 95, 24], [-145, 40, 20], [-137, -20, 14], [-142, -80, 8], [-108, -130, 3], [-55, -150, 0.5]],
    sections: [
      { a: 14.6, b: 1.6, offSurf: 'sand' },
      { a: 7.6, b: 9.8, walls: false, off: 2.5, offSurf: 'sand' },
      { a: 5.3, b: 7.4, lane: { side: 'in', div: 2, w: 7.5 } },
      { a: 3.5, b: 5.1, width: 20 },
      { a: 12.6, b: 14.4, width: 20 },
    ],
    ramps: [{ at: 11.7, len: 14, h: 2.6, gap: 12 }],
    pads: [{ at: 0.9, d: 0 }, { at: 6.4, lane: true }, { at: 11.25, d: 0 }, { at: 15.0, d: 0 }],
    boxes: [0.4, 3.4, 7.3, 10.6, 13.9],
  },
];
