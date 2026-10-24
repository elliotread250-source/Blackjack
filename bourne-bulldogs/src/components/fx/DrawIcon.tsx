"use client";

import { m } from "framer-motion";

/** Line icons for the trust badges. Each one draws itself in on scroll. */
const icons: Record<string, string[]> = {
  shield: ["M24 4l16 6v12c0 10-7 18-16 22C15 40 8 32 8 22V10z", "M16 24l6 6 11-12"],
  id: ["M6 12h36v26H6z", "M12 20h10v12H12z", "M27 21h10M27 27h10M27 33h6"],
  heart: ["M24 40S6 29 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 12-18 23-18 23z", "M14 22h6l3-6 4 12 3-6h4"],
  umbrella: ["M4 24a20 20 0 0 1 40 0z", "M24 24v14a4 4 0 0 1-8 0", "M24 4v2"],
  whistle: ["M6 22a10 10 0 1 0 20 0h16v-8H16a10 10 0 0 0-10 8z", "M16 22h.01", "M34 14V8"],
  ball: ["M24 4a20 20 0 1 1 0 40a20 20 0 1 1 0-40", "M4 24h40M24 4v40", "M10 10c8 8 8 20 0 28M38 10c-8 8-8 20 0 28"],
  team: ["M16 20a6 6 0 1 0 0-12a6 6 0 0 0 0 12zM32 20a6 6 0 1 0 0-12a6 6 0 0 0 0 12z", "M4 40c0-8 5-14 12-14s12 6 12 14M24 40c0-8 4-14 10-14s10 6 10 14"],
  chat: ["M6 8h36v24H22l-10 8v-8H6z", "M14 18h20M14 24h12"],
  crown: ["M6 36h36", "M8 32l-2-20 10 8 8-12 8 12 10-8-2 20z"],
  bolt: ["M28 4L10 28h14l-4 16 18-24H24z"],
  smile: ["M24 4a20 20 0 1 1 0 40a20 20 0 1 1 0-40", "M16 28c4 5 12 5 16 0", "M17 18h.01M31 18h.01"],
  game: ["M6 10h36v28H6z", "M24 10v28", "M24 18a6 6 0 1 1 0 12a6 6 0 1 1 0-12"],
};

export function DrawIcon({ name, className, delay = 0 }: { name: keyof typeof icons | string; className?: string; delay?: number }) {
  const ds = icons[name] ?? icons.ball;
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden focusable="false">
      {ds.map((d, i) => (
        <m.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 1.1, delay: delay + i * 0.2, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </svg>
  );
}
