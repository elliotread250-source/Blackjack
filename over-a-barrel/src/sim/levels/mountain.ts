import { boulder, limb, rect, rng, v } from '../geom';
import type { Decor, LevelDef, Solid, Vec } from '../types';

/*
  The whole climb, in metres, y up. Rough map:

    y 212  Summit cap ................................. x ~165
    y 170  The Spine: rock teeth along the ridge  ...... x 140 -> 165
    y 118  The Eaves: zig-zag alcove of lipped ledges .. x 131 -> 140
    y  92  Glass Slope: ice with studs, rising right ... x  78 -> 131
    y  47  The Flue: chimney through the cliff band .... x  69 -> 71
    y   8  Old Crooked: a zig-zag leaning trunk ........ x  48 -> 62
    y   0  The Rubble: boulders and steps .............. x -16 -> 48

  Anything that falls off the Spine or the Eaves lands in the alcove or on the
  ice, and the ice runs straight back down to the chimney mouth and the cliff
  edge above the tree. That's the long fall.
*/

const P = (...xy: number[]): Vec[] => {
  const out: Vec[] = [];
  for (let i = 0; i < xy.length; i += 2) out.push(v(xy[i], xy[i + 1]));
  return out;
};

/** Close a left-to-right surface polyline down to a flat bottom. */
function strip(top: Vec[], bottom: number): Vec[] {
  return [...top, v(top[top.length - 1].x, bottom), v(top[0].x, bottom)];
}

/** Add small deterministic wobble to long edges so rock never looks ruled. */
function roughen(pts: Vec[], seed: number, amp = 0.07, maxSeg = 1.4): Vec[] {
  const r = rng(seed);
  const out: Vec[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    out.push(a);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.floor(len / maxSeg);
    if (n < 1) continue;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      const j = (r() - 0.5) * 2 * amp;
      out.push(v(a.x + (b.x - a.x) * t + nx * j, a.y + (b.y - a.y) * t + ny * j));
    }
  }
  return out;
}

/**
 * The Flue: a 1.9 m chimney. Ledge tops alternate walls every 3.8 m, starting
 * with the lip at the left wall's foot (side 1 = sticks out of the left wall).
 */
export const FLUE = {
  CL: 69.0, // left wall face
  CR: 70.9, // right wall face
  LEDGE: 0.42, // how far a ledge sticks out
  LIP: 51.1,
  /** Top of the step at the chimney's foot, and where it starts. */
  stepY: 48.6,
  stepX: 69.62,
  ledges: [54.9, 58.7, 62.5, 66.3, 70.1, 73.9, 77.7, 81.5, 85.3, 89.1].map((y, i) => ({ y, side: (i % 2 === 1 ? 1 : -1) as 1 | -1 })),
};

/**
 * The Eaves: lipped ledges alternate walls of an 8 m alcove, each one
 * overhanging the one below. Stand at a ledge's open end, hook the next
 * ledge's lip, haul up, then slide out from under the one above.
 */
export const EAVES = {
  AL: 131.5, // alcove left wall face
  AR: 139.5, // alcove right wall face
  length: 5.3, // how far a ledge reaches out from its wall
  thick: 0.6, // leaves 1.7 m of headroom under the next ledge
  ledges: Array.from({ length: 21 }, (_, i) => ({ fromLeft: i % 2 === 1, top: 120.3 + i * 2.3 })),
};

/**
 * The Spine: a sawtooth ridge from the Eaves rim to the summit. Each tooth is
 * a 2.2–2.4 m riser leaning a little out over the notch below it (hook its
 * peak, haul over) and a short tread that slopes back down into the next
 * notch, where you can rest. Every peak is just in reach from the notch
 * below; missing one tumbles you back down the teeth. 21 teeth, then a last
 * riser under the summit's lip.
 */
export const SPINE = (() => {
  const r = rng(919);
  const rim = v(139.5, 168.7); // top of the Eaves' right wall
  const first = v(140.7, 168.4); // notch at the back of the landing
  const last = v(161.55, 209.9); // last notch, under the summit lip
  const raw = Array.from({ length: 21 }, () => ({
    H: 2.2 + r() * 0.2, // riser height
    o: 0.05 + r() * 0.22, // how far the peak leans out over the notch
    T: 1.05 + r() * 0.35, // tread length
    d: 0.25 + r() * 0.15, // tread drop into the next notch
  }));
  // Scale treads and risers so the last notch lands exactly where it should.
  const sum = (f: (t: (typeof raw)[number]) => number) => raw.reduce((a, t) => a + f(t), 0);
  const sx = (last.x - first.x + sum((t) => t.o)) / sum((t) => t.T);
  const sy = (last.y - first.y + sum((t) => t.d)) / sum((t) => t.H);
  const teeth: { peak: Vec; notch: Vec }[] = [];
  let n = first;
  for (const t of raw) {
    const peak = v(n.x - t.o, n.y + t.H * sy);
    n = v(peak.x + t.T * sx, peak.y - t.d);
    teeth.push({ peak, notch: n });
  }
  return { rim, first, teeth, plateau: 211.95, lip: v(161.35, 212.3) };
})();

/** Old Crooked's centreline and widths, base on the shelf to crown at the tunnel. */
export const TREE_LINE: Vec[] = P(
  43.4, 7.0, 46.0, 12.2, 48.4, 17.0, // steep
  52.2, 19.3, // gentle elbow
  54.2, 24.3, 56.1, 29.2, // steep
  59.8, 31.4, // gentle elbow
  61.0, 36.2, 62.0, 41.0, 62.6, 44.2, 62.9, 46.4, // steep to the crown
);
export const TREE_W = [2.5, 2.2, 2.0, 1.9, 1.7, 1.6, 1.6, 1.4, 1.2, 1.0, 0.75];

export interface Stub {
  base: Vec;
  mid: Vec;
  tip: Vec;
  /** Where the barrel's centre sits when resting on this stub. */
  rest: Vec;
}

/** Stubs on the climbing face (the trunk's upper side) of the steep stretches. */
export function treeStubs(): Stub[] {
  const out: Stub[] = [];
  for (let i = 0; i < TREE_LINE.length - 1; i++) {
    const a = TREE_LINE[i];
    const b = TREE_LINE[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (Math.atan2(dy, dx) < (45 * Math.PI) / 180) continue; // gentle: rest on the bark
    const ux = dx / len;
    const uy = dy / len;
    // Upper face normal, tilted upward so stubs catch the barrel.
    let nx = -uy;
    let ny = ux + 0.75;
    const nl = Math.hypot(nx, ny);
    nx /= nl;
    ny /= nl;
    const n = Math.max(1, Math.round(len / 1.8));
    for (let k = 1; k <= n; k++) {
      const t = (k - 0.35) / n;
      const cx = a.x + dx * t;
      const cy = a.y + dy * t;
      const w = (TREE_W[i] + (TREE_W[i + 1] - TREE_W[i]) * t) / 2;
      const fx = cx - uy * w;
      const fy = cy + ux * w;
      out.push({
        base: v(fx - nx * 0.25, fy - ny * 0.25),
        mid: v(fx + nx * 0.3, fy + ny * 0.3),
        tip: v(fx + nx * 0.7, fy + ny * 0.7),
        rest: v(fx + nx * 0.05 - uy * 0.5, fy + ny * 0.05 + 0.62),
      });
    }
  }
  return out;
}

export function mountainLevel(): LevelDef {
  const solids: Solid[] = [];
  const decor: Decor[] = [];
  const add = (pts: Vec[], mat: Solid['mat'], style: Solid['style']) => solids.push({ pts, mat, style });

  // ---------------------------------------------------------------- bounds
  add(rect(-26, -12, -16, 150), 'rock', 'cliff');
  add(rect(176, -12, 190, 260), 'rock', 'cliff');

  // ------------------------------------------------------- 1. THE RUBBLE
  add(
    roughen(
      strip(
        P(
          -16, 0, 6, 0, 9, 0.05, 14.5, 0.2, 18, 0.45, 21.6, 0.7,
          21.75, 1.95, 22.3, 2.05, // 1.2 m step
          27.5, 2.3, 30.5, 2.8, 36.3, 3.0,
          36.45, 4.95, 36.95, 5.05, // 1.9 m face
          39.3, 5.2, 39.5, 7.15, 39.15, 7.4, 39.3, 7.65, // 2 m face with a lip
          46.5, 7.9, 63.5, 8.1,
        ),
        -12,
      ),
      101,
      0.05,
    ),
    'rock',
    'ground',
  );
  add(boulder(12.6, 0.3, 0.85, 0.6, 11), 'rock', 'boulder');
  add(boulder(16.6, 0.42, 0.55, 0.38, 12), 'rock', 'boulder');
  add(boulder(31.6, 3.25, 1.45, 1.0, 13), 'rock', 'boulder');
  add(boulder(33.7, 4.35, 0.95, 0.8, 14), 'rock', 'boulder');
  add(boulder(38.1, 5.42, 0.55, 0.38, 15), 'rock', 'boulder');

  decor.push(
    { kind: 'grass', x: 2, y: 0, w: 5 },
    { kind: 'grass', x: 25, y: 2.2, w: 3 },
    { kind: 'grass', x: 47, y: 7.9, w: 2.5 },
    { kind: 'tree', x: -6, y: 0, h: 7, seed: 3, back: true },
    { kind: 'tree', x: 19, y: 0.5, h: 5, seed: 8, back: true },
    { kind: 'bones', x: 8, y: 0.05 },
  );

  // ---------------------------------------------------- 2. OLD CROOKED
  // A huge old tree leaning against the cliff. You climb its back: steep
  // stretches studded with stubs to rest on and hook, two gentle elbows to
  // catch your breath, and its crown delivers you to the cliff tunnel.
  add(limb(TREE_LINE, TREE_W), 'wood', 'trunk');
  for (const st of treeStubs()) {
    add(limb([st.base, st.mid, st.tip], [0.36, 0.28, 0.2]), 'wood', 'branch');
  }
  decor.push({ kind: 'backdrop', mat: 'wood', z: -1.2, pts: P(41.4, 7.6, 45.8, 7.6, 45.0, 9.6, 43.4, 9.8) });

  decor.push(
    { kind: 'tree', x: 34, y: 3, h: 9, seed: 12, back: true },
    { kind: 'grass', x: 50, y: 8.0, w: 8 },
  );

  // ------------------------------------------------------ 3. THE FLUE
  // Cliff band from x=63. Tunnel at y=47 leads to a step at the foot of a
  // 1.9 m chimney. Small ledges every 3.8 m, alternating sides, give you
  // somewhere to rest between braces (and sometimes catch a fall).
  const { CL, CR, LEDGE, LIP } = FLUE;
  const ledgesOn = (side: 1 | -1, x: number): number[] =>
    FLUE.ledges.filter((l) => l.side === side).flatMap(({ y }) => [x, y - 0.4, x + side * LEDGE, y - 0.1, x + side * LEDGE, y, x, y]);
  const { AL, AR } = EAVES;
  // One big mass: lower cliff band, chimney right wall, Glass Slope bed,
  // alcove floor and right wall, then the Spine's teeth up to the summit.
  add(
    roughen(
      P(
        63.5, 4, 63.5, 30, 63.1, 38, 63.0, 47, // cliff face beside the tree
        FLUE.stepX - 0.07, 47, FLUE.stepX, FLUE.stepY, CR, FLUE.stepY, // a 1.6 m step at the foot of the chimney
        ...ledgesOn(-1, CR), CR, 92, // chimney right wall
        73, 92.2, 78, 92.5, // chimney top
        95, 101.4, 99, 102.2, 113, 110.3, 116.5, 110.9, 127, 117.6, // slope bed
        AL, 118.0, AR, 118.0, // alcove floor
        AR, SPINE.rim.y, // alcove right wall, 2.4 m above the last ledge
        SPINE.first.x, SPINE.first.y, // landing, sloping back into the first notch
        ...SPINE.teeth.flatMap(({ peak, notch }) => [peak.x, peak.y, notch.x, notch.y]),
        SPINE.lip.x + 0.15, SPINE.plateau, // last riser, up under the summit's lip
        171.0, SPINE.plateau, 171.4, 211.7, 176, 205, 176, 4,
      ),
      301,
      0.06,
      2.2,
    ),
    'rock',
    'cliff',
  );
  // Upper-left pillar: tunnel ceiling at 50.5, a lip at its corner you can
  // hook from the step, then the chimney's left wall at CL.
  add(
    roughen(
      P(63.0, 50.5, CL, 50.5, CL + LEDGE, 50.8, CL + LEDGE, LIP, CL, LIP, ...ledgesOn(1, CL), CL, 92, 66.5, 92.4, 63.2, 91.6, 62.6, 75, 63.0, 60),
      302,
      0.06,
      2.2,
    ),
    'rock',
    'cliff',
  );

  // ------------------------------------------------ 4. GLASS SLOPE
  const iceTop = (a: Vec, b: Vec): Vec[] => {
    // A sheet lying on the rock between a and b, mostly buried.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;
    const t = 0.12;
    return [v(a.x - nx * 0.3, a.y - ny * 0.3), v(b.x - nx * 0.3, b.y - ny * 0.3), v(b.x + nx * t, b.y + ny * t), v(a.x + nx * t, a.y + ny * t)];
  };
  add(iceTop(v(78.3, 92.55), v(95, 101.45)), 'ice', 'ice');
  add(iceTop(v(99, 102.25), v(113, 110.35)), 'ice', 'ice');
  add(iceTop(v(116.5, 110.95), v(127, 117.65)), 'ice', 'ice');
  // Studs: the only grip on the ice.
  const slopeY = (x: number): number => {
    const pts = P(78, 92.5, 95, 101.4, 99, 102.2, 113, 110.3, 116.5, 110.9, 127, 117.6);
    for (let i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i].x && x <= pts[i + 1].x) {
        const t = (x - pts[i].x) / (pts[i + 1].x - pts[i].x);
        return pts[i].y + (pts[i + 1].y - pts[i].y) * t;
      }
    }
    return 0;
  };
  let seed = 400;
  for (const x of [80.6, 82.9, 85.2, 87.5, 89.8, 92.2, 101.2, 103.4, 105.6, 107.8, 110.0, 118.6, 120.6, 122.6, 124.6]) {
    add(boulder(x, slopeY(x) + 0.1, 0.42, 0.36, seed++, 10, 0.1), 'rock', 'boulder');
  }

  // --------------------------------------------------- 5. THE EAVES
  // A deep cleft. Its left wall starts 4.6 m up, so you walk in underneath
  // it from the top of the ice. Lipped ledges alternate sides; each one
  // overhangs the one below: reach out, hook the lip, haul yourself round.
  add(roughen(P(124.6, 123.3, AL, 122.6, AL, 171.0, 126.0, 172.2, 124.0, 160, 124.9, 140), 501, 0.06, 2.0), 'rock', 'cliff');
  const ledge = (fromLeft: boolean, top: number) => {
    const outer = fromLeft ? AL + EAVES.length : AR - EAVES.length;
    const wall = fromLeft ? AL - 0.5 : AR + 0.5;
    const s = fromLeft ? 1 : -1;
    const t = EAVES.thick;
    add(
      P(
        wall, top - t,
        outer - s * 0.25, top - t,
        outer - s * 0.1, top - t - 0.35, // the lip's tooth
        outer + s * 0.12, top - t + 0.05,
        outer + s * 0.1, top - 0.1,
        outer - s * 0.15, top,
        wall, top,
      ),
      'rock',
      'cliff',
    );
  };
  for (const { fromLeft, top } of EAVES.ledges) ledge(fromLeft, top);

  // ---------------------------------------------------- 6. THE SPINE
  // (The teeth are part of the big mass above.)
  // Summit cap: a slab whose lip overhangs the last riser. One last precise hook.
  const L = SPINE.lip;
  add(P(L.x - 0.1, SPINE.plateau - 0.05, 171.2, SPINE.plateau - 0.05, 171.5, L.y - 0.05, L.x, L.y), 'rock', 'summit');

  // Back walls behind the tunnel, the chimney and the cleft, so you look
  // into the mountain rather than through it.
  decor.push(
    { kind: 'backdrop', pts: P(62.0, 46.0, 72.5, 46.0, 72.5, 93.5, 62.0, 93.5) },
    { kind: 'backdrop', pts: P(122.5, 117.0, 141.0, 117.0, 141.0, 173.0, 122.5, 173.0) },
  );

  decor.push({ kind: 'cairn', x: 167.6, y: 212.3 }, { kind: 'lantern', x: 165.6, y: 212.3 }, { kind: 'flag', x: 169.8, y: 212.2 });

  return {
    name: 'Over a Barrel',
    spawn: v(3, 0.43),
    solids,
    decor,
    sections: [
      { name: 'The Rubble', y0: 0 },
      { name: 'Old Crooked', y0: 8 },
      { name: 'The Flue', y0: 46 },
      { name: 'Glass Slope', y0: 92 },
      { name: 'The Eaves', y0: 118 },
      { name: 'The Spine', y0: 168 },
      { name: 'Summit', y0: 211 },
    ],
    summit: { x0: 162.4, x1: 171.2, y0: 212.4, y1: 216 },
    groundY: 0,
    topY: 212,
  };
}
