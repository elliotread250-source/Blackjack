"use client";

import { m } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "arc" | "key" | "circle" | "half";

const paths: Record<Variant, { viewBox: string; d: string[] }> = {
  // Three-point arc with the corner straights.
  arc: { viewBox: "0 0 600 320", d: ["M20 0v90c0 128 125 226 280 226S580 218 580 90V0"] },
  // The key with free-throw circle.
  key: { viewBox: "0 0 320 420", d: ["M80 0v260h160V0", "M80 260a80 80 0 0 0 160 0", "M80 260a80 80 0 0 1 160 0", "M130 0v24h60V0"] },
  // Centre circle and half-court line.
  circle: { viewBox: "0 0 400 400", d: ["M200 60a140 140 0 1 1 0 280a140 140 0 1 1 0-280", "M200 160a40 40 0 1 1 0 80a40 40 0 1 1 0-80", "M0 200h400"] },
  half: { viewBox: "0 0 800 400", d: ["M0 400V0h800v400", "M400 400a120 120 0 0 1 0-240a120 120 0 0 1 0 240", "M60 0v120c0 150 150 240 340 240s340-90 340-240V0"] },
};

/** Thin orange court markings that draw themselves as they scroll into view. */
export function CourtLines({ variant = "arc", className, strokeWidth = 2, delay = 0 }: { variant?: Variant; className?: string; strokeWidth?: number; delay?: number }) {
  const p = paths[variant];
  return (
    <svg viewBox={p.viewBox} className={cn("pointer-events-none", className)} fill="none" aria-hidden focusable="false">
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
          transition={{ duration: 1.8, delay: delay + i * 0.25, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </svg>
  );
}
