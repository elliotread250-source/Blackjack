"use client";

import { m, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import { isFinePointer } from "@/lib/motion-pref";

/** Pulls its child gently toward the cursor on desktop. */
export function Magnetic({ children, strength = 0.35, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !ref.current || !isFinePointer()) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div ref={ref} onPointerMove={onMove} onPointerLeave={reset} style={{ x, y }} className={className ?? "inline-block"}>
      {children}
    </m.div>
  );
}
