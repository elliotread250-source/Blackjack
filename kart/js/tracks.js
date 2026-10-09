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
  // ---------------- indoor tracks
  {
    id: 'hall', name: 'Kart Hall', theme: 'hall', indoor: true, blurb: 'A real indoor karting centre: tyre walls, hairpins and a bridge over itself.',
    width: 14, off: 3.5, offSurf: 'grass', bank: 0.3,
    pts: [[-40, -70, 0], [30, -72, 0], [72, -58, 0], [88, -25, 0.5], [66, 0, 3], [32, 15, 6.5], [0, 30, 7.5], [-30, 46, 7], [-58, 62, 5], [-74, 92, 3.5], [-62, 122, 2], [-30, 134, 1], [0, 116, 0.5], [25, 138, 0], [62, 128, 0], [78, 98, 0], [62, 68, 0], [30, 48, 0], [0, 30, 0], [-30, 12, 0], [-62, -2, 0], [-78, -30, 0], [-70, -60, 0]],
    sections: [
      { a: 4.6, b: 8.2, bridge: true, off: 1.5 },
      { a: 18.6, b: 21.2, lane: { side: 'in', div: 2, w: 6 } },
    ],
    pads: [{ at: 0.8, d: 0 }, { at: 14.3, d: 0 }, { at: 19.9, lane: true }],
    boxes: [0.45, 4.2, 10.4, 16.4],
  },
  {
    id: 'arena', name: 'Neon Arena', theme: 'arena', indoor: true, blurb: 'Banked turns under the lights, then up the ramp to the mezzanine and back down.',
    width: 16, off: 3, offSurf: 'grass', bank: 2.4, maxBank: 0.3,
    pts: [[-50, -62, 0], [30, -62, 0], [82, -52, 0], [104, -18, 0], [96, 22, 0], [64, 34, 0], [30, 20, 0], [8, 0, 0], [-16, 10, 0.5], [-20, 40, 3], [8, 62, 6.5], [50, 72, 8], [80, 88, 8], [70, 112, 7.5], [20, 118, 7], [-40, 110, 5], [-84, 86, 2], [-100, 40, 0], [-98, -20, 0], [-84, -52, 0]],
    sections: [
      { a: 10.4, b: 14.6, bridge: true, off: 1.5 },
      { a: 16.6, b: 19.4, lane: { side: 'in', div: 2, w: 6.5 } },
    ],
    pads: [{ at: 0.9, d: 0 }, { at: 9.6, d: 0 }, { at: 18.0, lane: true }],
    boxes: [0.5, 5.5, 12.3, 17.3],
  },
  {
    id: 'toy', name: 'Toy Room', theme: 'toy', indoor: true, blurb: 'Race a giant playroom: around the blocks, up the books and off the table.',
    width: 15, off: 5, offSurf: 'grass', bank: 0.5,
    pts: [[-57.5, -82.8, 0], [23.0, -85.1, 0], [73.6, -75.9, 0], [101.2, -48.3, 0], [78.2, -16.1, 0], [98.9, 13.8, 0], [78.2, 39.1, 0.5], [46.0, 48.3, 3], [11.5, 52.9, 6.5], [-23.0, 55.2, 8], [-55.2, 55.2, 8], [-69.0, 54.0, 7.8], [-89.7, 50.6, 0], [-115.0, 25.3, 0], [-121.9, -16.1, 0], [-105.8, -57.5, 0]],
    sections: [
      { a: 7.0, b: 11.0, bridge: true, off: 2 },
      { a: 13.2, b: 15.4, lane: { side: 'in', div: 2, w: 6 } },
    ],
    ramps: [{ at: 11.0, len: 10, h: 1.2, gap: 17, land: 0 }],
    pads: [{ at: 0.6, d: 0 }, { at: 10.3, d: 0 }, { at: 14.4, lane: true }],
    boxes: [1.4, 4.5, 9.4, 14.0],
  },
];

// Grand Prix cups (indices into TRACK_DEFS)
export const CUPS = [
  { id: 'outdoor', name: 'Outdoor Cup', blurb: 'Five races in the open air.', tracks: [0, 1, 2, 3, 4] },
  { id: 'indoor', name: 'Indoor Cup', blurb: 'Three races under a roof.', tracks: [5, 6, 7] },
  { id: 'grand', name: 'Grand Tour', blurb: 'All eight tracks, back to back.', tracks: [0, 1, 2, 3, 4, 5, 6, 7] },
];
