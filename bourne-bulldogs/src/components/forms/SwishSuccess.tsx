"use client";

import { useEffect, useRef } from "react";
import { m } from "framer-motion";
import { Basketball } from "@/components/fx/Basketball";
import { HoopBack, HoopFront } from "@/components/fx/Hoop";
import { swishNet } from "@/components/fx/net-swish";
import { prefersReducedMotion } from "@/lib/motion-pref";

/** Success state: a ball drops through a hoop, then the message lands. */
export function SwishSuccess({ title, body, onReset, resetLabel = "Send another" }: { title: string; body?: string; onReset?: () => void; resetLabel?: string }) {
  const hoop = useRef<HTMLDivElement>(null);

  // Swish the net as the ball drops through the rim.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setTimeout(() => {
      const net = hoop.current?.querySelector("[data-net]");
      if (net) swishNet(net);
    }, 950);
    return () => clearTimeout(t);
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center py-6 text-center">
      <div ref={hoop} className="relative h-56 w-48" aria-hidden>
        <HoopBack className="absolute inset-0 z-10 h-full w-full" />
        <m.div
          className="absolute left-1/2 top-0 z-20 -ml-[30px] h-[60px] w-[60px]"
          initial={{ y: -120, rotate: -90, opacity: 0 }}
          animate={{ y: [-120, 20, 140], rotate: [-90, 0, 120], opacity: [0, 1, 0] }}
          transition={{ duration: 1.2, times: [0, 0.5, 1], ease: "easeIn" }}
        >
          <Basketball className="h-full w-full" id="swish" />
        </m.div>
        <HoopFront className="absolute inset-0 z-30 h-full w-full" />
      </div>
      <m.h3 className="display mt-4 text-5xl text-orange md:text-6xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }}>
        Swish!
      </m.h3>
      <m.p className="mt-3 max-w-md text-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.6 }}>
        {title}
      </m.p>
      {body && <p className="mt-2 max-w-md text-muted">{body}</p>}
      {onReset && (
        <button type="button" onClick={onReset} className="mt-6 text-sm font-bold uppercase tracking-[0.14em] underline decoration-orange decoration-2 underline-offset-8 hover:text-orange">
          {resetLabel}
        </button>
      )}
    </div>
  );
}
