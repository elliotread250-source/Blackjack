/**
 * Hoop in two layers so a ball can pass *through* it: render <HoopBack/>
 * below the ball and <HoopFront/> above it, both inside the same box. The
 * net goes all the way round the rim, so its back half sits in HoopBack and
 * its front half in HoopFront.
 */
export function HoopBack({ className }: { className?: string }) {
  const { back } = netPaths();
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      {/* Backboard */}
      <rect x="20" y="4" width="160" height="104" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.85" strokeWidth="3" />
      <rect x="68" y="44" width="64" height="48" rx="2" fill="none" stroke="#d35933" strokeWidth="3" />
      {/* Bracket */}
      <path d="M92 108v10M108 108v10" stroke="currentColor" strokeOpacity="0.6" strokeWidth="4" />
      {/* Back half of the net, seen through the hoop */}
      <path data-net-back d={back} fill="none" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.4" strokeLinecap="round" />
      {/* Back half of the rim */}
      <path d="M52 124c0-8 21-12 48-12s48 4 48 12" fill="none" stroke="#b44a24" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The net is a diamond mesh hung from the rim: 14 knots spaced round the rim
 * ellipse, and each row of knots below is offset by half a gap, so every
 * strand ties to its two neighbours in the next row. Row 0 is the rim itself;
 * each lower row can pinch in (p), stretch down (d) and sway sideways (s),
 * which is how swishNet animates it one row after another.
 */
export type NetRow = { p: number; d: number; s: number };

const RIM = { cx: 100, cy: 124, rx: 48, ry: 12 };
const KNOTS = 14;
const NET_ROWS = [0, 0.24, 0.48, 0.74, 1];
export const NET_RING_COUNT = NET_ROWS.length - 1;
const REST: NetRow = { p: 0, d: 0, s: 0 };

const n = (v: number) => Math.round(v * 10) / 10;

/** The ellipse a row of knots sits on: narrower and flatter towards the bottom. */
function ring(t: number, row: NetRow) {
  const squeeze = 1 - row.p * (0.14 + 0.26 * t);
  return {
    cx: RIM.cx + row.s * 9 * t,
    cy: RIM.cy + 74 * t + row.d * 15 * t,
    rx: (RIM.rx - 17 * t) * squeeze,
    ry: (RIM.ry - 5 * t) * squeeze,
  };
}

/** Path data for the front and back halves of the net, given each row's state. */
export function netPaths(state: NetRow[] = []) {
  const step = (2 * Math.PI) / KNOTS;
  const rings = NET_ROWS.map((t, r) => ring(t, r === 0 ? REST : (state[r - 1] ?? REST)));
  const at = (r: number, a: number) => `${n(rings[r].cx + rings[r].rx * Math.cos(a))} ${n(rings[r].cy + rings[r].ry * Math.sin(a))}`;
  let front = "";
  let back = "";
  for (let r = 0; r < rings.length - 1; r++) {
    for (let k = 0; k < KNOTS; k++) {
      const a = (k + (r % 2) / 2) * step;
      for (const b of [a - step / 2, a + step / 2]) {
        const seg = `M${at(r, a)}L${at(r + 1, b)}`;
        // Positive sine is the near side of the ellipse (lower on screen).
        if (Math.sin((a + b) / 2) >= 0) front += seg;
        else back += seg;
      }
    }
  }
  return { front, back };
}

export function HoopFront({ className, netClassName }: { className?: string; netClassName?: string }) {
  const { front } = netPaths();
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      <g data-net className={netClassName}>
        <path data-net-front d={front} fill="none" stroke="currentColor" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      {/* Front half of the rim */}
      <path d="M52 124c0 8 21 12 48 12s48-4 48-12" fill="none" stroke="#d35933" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
