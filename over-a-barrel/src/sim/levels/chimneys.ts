import { rect, v } from '../geom';
import type { LevelDef } from '../types';

/** A smooth chimney of a given width, for measuring bracing. Left wall face at x=0. */
export function chimneyLevel(w: number): LevelDef {
  return {
    name: `chimney-${w}`,
    spawn: v(0.47, 0.43),
    solids: [
      { pts: rect(-6, -6, 10, 0), mat: 'rock', style: 'ground' },
      { pts: rect(-6, 0, 0, 20), mat: 'rock', style: 'cliff' },
      { pts: rect(w, 0, w + 6, 20), mat: 'rock', style: 'cliff' },
    ],
    decor: [],
    sections: [{ name: 'Chimney', y0: 0 }],
    summit: { x0: 1e9, x1: 1e9 + 1, y0: 0, y1: 1 },
    groundY: 0,
    topY: 20,
  };
}
