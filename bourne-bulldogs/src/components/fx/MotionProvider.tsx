"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";

/** Lean Framer Motion: `m.` components plus the DOM animation features only. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
