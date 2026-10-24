"use client";

import { m, useAnimationFrame, useInView, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion-pref";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/**
 * Orange ticker. Drifts on its own, speeds up with scroll velocity and runs
 * backwards when you scroll up.
 */
export function Marquee({ items }: { items: readonly string[] }) {
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-2000, 0, 2000], [-5, 0, 5], { clamp: false });
  const dir = useRef(1);
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box);
  const x = useTransform(base, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (!visible || prefersReducedMotion()) return;
    let move = dir.current * -2.2 * (delta / 1000);
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    move += move * Math.abs(f);
    base.set(base.get() + move);
  });

  const row = (
    <span className="flex shrink-0 items-center">
      {items.map((t) => (
        <span key={t} className="flex items-center">
          <span className="px-5 md:px-8">{t}</span>
          <Dot />
        </span>
      ))}
    </span>
  );

  return (
    <div ref={box} className="relative z-10 -rotate-[1.5deg] overflow-hidden border-y-2 border-ink bg-orange-deep py-4 text-ink md:py-5">
      <p className="sr-only">{items.join(". ")}</p>
      <m.div aria-hidden className="display flex w-max whitespace-nowrap text-3xl leading-none md:text-5xl" style={{ x }}>
        {row}
        {row}
        {row}
        {row}
      </m.div>
    </div>
  );
}

function Dot() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 md:h-7 md:w-7" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M1 10h18M10 1v18M3.6 3.6c3 2.9 3 9.9 0 12.8M16.4 3.6c-3 2.9-3 9.9 0 12.8" stroke="#d35933" strokeWidth="1.2" fill="none" />
    </svg>
  );
}
