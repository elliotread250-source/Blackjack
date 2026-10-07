import { rect, v } from '../geom';
import type { LevelDef } from '../types';

/** Single wall of a given height at x=10, for measuring climb limits. */
export function wallLevel(h: number): LevelDef {
  return {
    name: `wall-${h}`,
    spawn: v(8.6, 0.43),
    solids: [
      { pts: rect(-10, -6, 40, 0), mat: 'rock', style: 'ground' },
      { pts: rect(-13, -6, -10, 30), mat: 'rock', style: 'cliff' },
      { pts: rect(10, -1, 18, h), mat: 'rock', style: 'cliff' },
    ],
    decor: [],
    sections: [{ name: 'Wall', y0: 0 }],
    summit: { x0: 1e9, x1: 1e9 + 1, y0: 0, y1: 1 },
    groundY: 0,
    topY: 10,
  };
}
