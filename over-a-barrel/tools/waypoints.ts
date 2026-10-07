// The route up the mountain: resting spots the bot must reach in order.
// Shared by tools/route.ts (search) and tools/replay.ts (check).
import { Sim } from '../src/sim/sim';
import { EAVES, FLUE, SPINE, mountainLevel, treeStubs } from '../src/sim/levels/mountain';
import type { PlayerState } from '../src/sim/player';
import type { Goal } from './bot/core';

export interface Waypoint {
  name: string;
  goal: Goal;
  kind?: 'chimney' | 'mantle' | 'ledge';
  /** For mantles: the lip to hook (top of the edge you're climbing onto). */
  lip?: { x: number; y: number; side: 1 | -1 };
}

export const W: Waypoint[] = [];
const box = (name: string, x0: number, x1: number, y0: number, y1: number, kind?: 'chimney') =>
  W.push({ name, goal: { x0, x1, y0, y1 }, kind });
/** A climb onto an edge: `side` is the direction the edge's body lies from its lip. */
const mantle = (name: string, x0: number, x1: number, y0: number, y1: number, lip: { x: number; y: number; side: 1 | -1 }) =>
  W.push({ name, goal: { x0, x1, y0, y1 }, kind: 'mantle', lip });

// 1. The Rubble
box('rubble: past first rock', 13.8, 16.2, 0.45, 1.4);
box('rubble: on 1.2 m step', 23.0, 27.0, 2.3, 3.3);
box('rubble: past the pile', 35.0, 36.1, 3.2, 4.4);
box('rubble: on 1.9 m face', 37.2, 39.1, 5.35, 6.7);
box('rubble: on the shelf', 39.9, 41.9, 8.0, 8.9);
// 2. Old Crooked: up the leaning trunk's back, stub to stub.
for (const st of treeStubs()) {
  box(`tree: stub at ${st.rest.y.toFixed(1)}`, st.rest.x - 1.2, st.rest.x + 0.9, st.rest.y - 0.55, st.rest.y + 0.8);
}
box('tree: crown', 61.0, 63.4, 46.6, 47.8);
box('flue: tunnel', 64.0, 68.0, 47.3, 48.4);
// 3. The Flue: onto the step, then ledge to ledge up the chimney.
box('flue: bottom', 67.4, 69.2, 47.3, 47.9);
box('flue: on the step', FLUE.stepX, FLUE.CR, FLUE.stepY + 0.35, FLUE.stepY + 1.0);
for (const { y, side } of [{ y: FLUE.LIP, side: 1 as const }, ...FLUE.ledges]) {
  const wall = side === 1 ? FLUE.CL : FLUE.CR;
  const edge = wall + side * FLUE.LEDGE;
  const [x0, x1] = side === 1 ? [wall + 0.3, edge + 0.45] : [edge - 0.45, wall - 0.3];
  W.push({ name: `flue: ledge ${y}`, goal: { x0, x1, y0: y + 0.35, y1: y + 1.0 }, kind: 'ledge', lip: { x: edge, y, side: -side as 1 | -1 } });
}
box('flue: out the top', 71.6, 77.6, 92.5, 93.6);
// 4. Glass Slope
const slopePts = [78, 92.5, 95, 101.4, 99, 102.2, 113, 110.3, 116.5, 110.9, 127, 117.6];
const slopeY = (x: number) => {
  for (let i = 0; i < slopePts.length - 2; i += 2) {
    const [ax, ay, bx, by] = slopePts.slice(i, i + 4);
    if (x >= ax && x <= bx) return ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return 0;
};
const studs1 = [80.6, 82.9, 85.2, 87.5, 89.8, 92.2];
const studs2 = [101.2, 103.4, 105.6, 107.8, 110.0];
const studs3 = [118.6, 120.6, 122.6, 124.6];
const stud = (x: number) => box(`ice: stud ${x}`, x - 1.4, x + 0.35, slopeY(x) - 0.1, slopeY(x) + 1.7);
studs1.forEach(stud);
box('ice: outcrop 1', 95.3, 98.7, 101.6, 103.1);
studs2.forEach(stud);
box('ice: outcrop 2', 113.3, 116.3, 110.6, 112.0);
studs3.forEach(stud);
box('ice: top landing', 127.6, 131.2, 117.9, 119.0);
// 5. The Eaves
box('eaves: alcove floor', 132.0, 139.0, 118.2, 119.1);
EAVES.ledges.forEach(({ fromLeft, top }, i) => {
  const { AL, AR, length } = EAVES;
  const outer = fromLeft ? AL + length : AR - length;
  // Haul onto the lip end (anywhere on the ledge)...
  const [x0, x1] = fromLeft ? [AL + 0.4, outer - 0.1] : [outer + 0.1, AR - 0.4];
  W.push({
    name: `eaves: ledge ${i + 1}`,
    goal: { x0, x1, y0: top + 0.36, y1: top + 1.05, headMinY: top + 0.05 },
    kind: 'mantle',
    lip: { x: outer, y: top, side: fromLeft ? -1 : 1 },
  });
  // ...then slide to the open end, the whole barrel clear of the next ledge's
  // lip (its face sits 0.12 m proud of `outer`), so you can rise past it.
  const nextOuter = fromLeft ? AR - length : AL + length;
  const clear = 0.12 + 0.5;
  const [f0, f1] = fromLeft ? [AL + 0.4, nextOuter - clear] : [nextOuter + clear, AR - 0.4];
  // Both rests leave the pick above the ledge: hooked underneath it, the head
  // can only get free round the far end, out of reach.
  W.push({ name: `eaves: ledge ${i + 1} open end`, goal: { x0: f0, x1: f1, y0: top + 0.36, y1: top + 1.05, headMinY: top + 0.05 } });
});
// 6. The Spine: hook each tooth's peak from the notch below, haul over, slide into the next notch.
const notchBox = (n: { x: number; y: number }) => ({ x0: n.x - 1.1, x1: n.x - 0.2, y0: n.y + 0.1, y1: n.y + 1.0 });
W.push({ name: 'spine: alcove rim', goal: notchBox(SPINE.first), kind: 'mantle', lip: { ...SPINE.rim, side: 1 } });
SPINE.teeth.forEach(({ peak, notch }, k) => {
  W.push({ name: `spine: tooth ${k + 1}`, goal: notchBox(notch), kind: 'mantle', lip: { ...peak, side: 1 } });
});
W.push({ name: 'SUMMIT', goal: { x0: 162.4, x1: 171.2, y0: 212.4, y1: 216 }, kind: 'ledge', lip: { ...SPINE.lip, side: 1 } });

/** The barrel at the start, settled, pick out front. */
export function spawnState(): PlayerState {
  const level = mountainLevel();
  const sim = new Sim(level);
  sim.recordEvents = false;
  sim.player.setCursor(1.0, 0.2);
  sim.player.teleport(level.spawn.x, level.spawn.y);
  for (let i = 0; i < 120; i++) sim.step();
  return sim.player.getState();
}
