import { boulder, rect, v } from '../geom';
import type { LevelDef, Solid } from '../types';

/** Flat proving ground: one of each obstacle type, used to tune the hammer. */
export function testLevel(): LevelDef {
  const solids: Solid[] = [
    { pts: rect(-30, -6, 100, 0), mat: 'rock', style: 'ground' },
    { pts: rect(-33, -6, -30, 40), mat: 'rock', style: 'cliff' },
    { pts: rect(100, -6, 103, 40), mat: 'rock', style: 'cliff' },
    // Knee-high rock to hop.
    { pts: boulder(7, 0.05, 0.9, 0.65, 3), mat: 'rock', style: 'boulder' },
    // 1.2 m step.
    { pts: rect(13, -1, 17, 1.2), mat: 'rock', style: 'cliff' },
    // 2.6 m ledge with an overhanging lip to hook.
    {
      pts: [v(23, -1), v(30, -1), v(30, 2.6), v(22.5, 2.6), v(22.5, 2.25), v(23, 2.1)],
      mat: 'rock',
      style: 'cliff',
    },
    // Chimney: two walls 1.9 m apart, 14 m tall.
    { pts: rect(36, -1, 38, 14), mat: 'rock', style: 'cliff' },
    { pts: rect(39.9, -1, 42, 14), mat: 'rock', style: 'cliff' },
    // 28° ice ramp.
    { pts: [v(50, -1), v(64, -1), v(64, 14 * Math.tan((28 * Math.PI) / 180)), v(50, 0)], mat: 'ice', style: 'ice' },
    // 4 m wall to find the hook-climb limit.
    { pts: rect(74, -1, 80, 4), mat: 'rock', style: 'cliff' },
    // A thin branch at 3 m.
    { pts: rect(86, 2.9, 89, 3.15), mat: 'wood', style: 'branch' },
  ];
  return {
    name: 'test',
    spawn: v(2, 0.43),
    solids,
    decor: [],
    sections: [{ name: 'Proving Ground', y0: 0 }],
    summit: { x0: 1e9, x1: 1e9 + 1, y0: 0, y1: 1 },
    groundY: 0,
    topY: 20,
  };
}
