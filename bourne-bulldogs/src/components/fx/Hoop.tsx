/**
 * Hoop in two layers so a ball can pass *through* it: render <HoopBack/>
 * below the ball and <HoopFront/> above it, both inside the same box.
 */
export function HoopBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      {/* Backboard */}
      <rect x="20" y="4" width="160" height="104" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.85" strokeWidth="3" />
      <rect x="68" y="44" width="64" height="48" rx="2" fill="none" stroke="#d35933" strokeWidth="3" />
      {/* Bracket */}
      <path d="M92 108v10M108 108v10" stroke="currentColor" strokeOpacity="0.6" strokeWidth="4" />
      {/* Back half of the rim */}
      <path d="M52 124c0-8 21-12 48-12s48 4 48 12" fill="none" stroke="#b44a24" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The net as a mesh: seven strands hanging from the rim, tied by four rings.
 * Row 0 is fixed to the rim; each lower row can pinch in towards the middle
 * (p), stretch down (d) and sway sideways (s), which is how swishNet animates
 * it one ring after another.
 */
export type NetRow = { p: number; d: number; s: number };

const NET_TOP: Array<[number, number]> = [[54, 126], [70, 128], [86, 130], [100, 130], [114, 130], [130, 128], [146, 126]];
const NET_BOTTOM: Array<[number, number]> = [[66, 196], [78, 198], [92, 200], [100, 200], [108, 200], [122, 198], [134, 196]];
const NET_ROWS = [0, 0.17, 0.43, 0.69, 1];
export const NET_RING_COUNT = NET_ROWS.length - 1;

const at = (t: number, row: NetRow) =>
  NET_TOP.map(([x0, y0], i) => {
    const [x1, y1] = NET_BOTTOM[i];
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    return [100 + (x - 100) * (1 - row.p * (0.16 + 0.24 * t)) + row.s * 9 * t, y + row.d * 15 * t] as [number, number];
  });

const n = (v: number) => Math.round(v * 10) / 10;

/** A smooth curve through the points (Catmull-Rom as cubic Béziers). */
function smooth(pts: Array<[number, number]>) {
  let d = `M${n(pts[0][0])} ${n(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

const REST: NetRow = { p: 0, d: 0, s: 0 };

/** Path data for the strands and rings, given each ring's current state. */
export function netPaths(state: NetRow[] = []) {
  const rows = NET_ROWS.map((t, r) => at(t, r === 0 ? REST : (state[r - 1] ?? REST)));
  const strands = NET_TOP.map((_, i) => rows.map((row, r) => `${r ? "L" : "M"}${n(row[i][0])} ${n(row[i][1])}`).join("")).join("");
  const rings = rows.slice(1).map(smooth).join("");
  return { strands, rings };
}

export function HoopFront({ className, netClassName }: { className?: string; netClassName?: string }) {
  const { strands, rings } = netPaths();
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      <g data-net className={netClassName}>
        <g fill="none" stroke="currentColor" strokeOpacity="0.75" strokeWidth="1.6" strokeLinejoin="round">
          <path data-net-strands d={strands} />
          <path data-net-rings d={rings} />
        </g>
      </g>
      {/* Front half of the rim */}
      <path d="M52 124c0 8 21 12 48 12s48-4 48-12" fill="none" stroke="#d35933" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
