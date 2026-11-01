"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "arc" | "key" | "circle" | "half" | "court" | "courtTall";

/**
 * A full FIBA court, 28m x 15m drawn in centimetres: boundary, halfway line,
 * centre circle, and at each end the key, free-throw circle, three-point
 * line (6.75m arc with corner straights), no-charge arc, backboard and rim.
 */
const COURT = [
  "M0 0h2800v1500H0z",
  "M1400 0v1500",
  "M1220 750a180 180 0 1 0 360 0a180 180 0 1 0-360 0",
  "M0 505h580v490H0",
  "M400 750a180 180 0 1 0 360 0a180 180 0 1 0-360 0",
  "M0 90h299A675 675 0 0 1 299 1410H0",
  "M120 625h37.5a125 125 0 0 1 0 250H120",
  "M120 660v180",
  "M135 750a22.5 22.5 0 1 0 45 0a22.5 22.5 0 1 0-45 0",
  "M2800 505h-580v490h580",
  "M2040 750a180 180 0 1 0 360 0a180 180 0 1 0-360 0",
  "M2800 90h-299A675 675 0 0 0 2501 1410h299",
  "M2680 625h-37.5a125 125 0 0 0 0 250h37.5",
  "M2680 660v180",
  "M2620 750a22.5 22.5 0 1 0 45 0a22.5 22.5 0 1 0-45 0",
];

const paths: Record<Variant, { viewBox: string; d: string[]; transform?: string }> = {
  // Three-point arc with the corner straights.
  arc: { viewBox: "0 0 600 320", d: ["M20 0v90c0 128 125 226 280 226S580 218 580 90V0"] },
  // The key with free-throw circle.
  key: { viewBox: "0 0 320 420", d: ["M80 0v260h160V0", "M80 260a80 80 0 0 0 160 0", "M80 260a80 80 0 0 1 160 0", "M130 0v24h60V0"] },
  // Centre circle and half-court line.
  circle: { viewBox: "0 0 400 400", d: ["M200 60a140 140 0 1 1 0 280a140 140 0 1 1 0-280", "M200 160a40 40 0 1 1 0 80a40 40 0 1 1 0-80", "M0 200h400"] },
  half: { viewBox: "0 0 800 400", d: ["M0 400V0h800v400", "M400 400a120 120 0 0 1 0-240a120 120 0 0 1 0 240", "M60 0v120c0 150 150 240 340 240s340-90 340-240V0"] },
  // Full court, lying across the page or (for narrow screens) standing up.
  court: { viewBox: "0 0 2800 1500", d: COURT },
  courtTall: { viewBox: "0 0 1500 2800", d: COURT, transform: "translate(1500 0) rotate(90)" },
};

/** Orange court markings that draw themselves as they scroll into view. */
export function CourtLines({ variant = "arc", className, strokeWidth = 2, delay = 0 }: { variant?: Variant; className?: string; strokeWidth?: number; delay?: number }) {
  const p = paths[variant];
  const step = p.d.length > 6 ? 0.08 : 0.25;
  return (
    <svg viewBox={p.viewBox} className={cn("pointer-events-none", className)} fill="none" aria-hidden focusable="false">
      <g transform={p.transform}>
        {p.d.map((d, i) => (
          <m.path
            key={i}
            d={d}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.8, delay: delay + i * step, ease: [0.65, 0, 0.35, 1] }}
          />
        ))}
      </g>
    </svg>
  );
}
