"use client";

import { animate, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { prefersReducedMotion } from "@/lib/motion-pref";

type Stat = { value: number; to?: number; from?: number; decimals?: number; label: string };

function Count({ to, from = 0, decimals = 0, run }: { to: number; from?: number; decimals?: number; run: boolean }) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (!run) return;
    if (prefersReducedMotion()) {
      setV(to);
      return;
    }
    const c = animate(from, to, { duration: 1.6, ease: [0.16, 1, 0.3, 1], onUpdate: setV });
    return () => c.stop();
  }, [run, to, from]);
  return <>{v.toFixed(decimals)}</>;
}

/** Arena-style scoreboard of the club's real numbers. */
export function Scoreboard({ stats }: { stats: Stat[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });

  return (
    <section aria-labelledby="stats-heading" className="relative py-12 md:py-20">
      <div className="container-x">
        <SectionMarker n="02" label="By the numbers" />
        <h2 id="stats-heading" className="sr-only">
          Bourne Bulldogs by the numbers
        </h2>
        <div ref={ref} className="theme-dark mt-10 overflow-hidden rounded-[12px] border-2 border-graphite bg-coal shadow-[inset_0_0_80px_rgba(0,0,0,.6)]">
          <div className="flex items-center justify-between border-b-2 border-graphite px-5 py-3 md:px-8">
            <span className="eyebrow text-muted">Home</span>
            <span className="display text-lg tracking-[0.2em] text-bone md:text-2xl">Bulldogs</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-bright" aria-hidden />
              <span className="eyebrow text-muted">Live</span>
            </span>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-5">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={[
                  "flex flex-col-reverse justify-end gap-3 border-graphite p-5 md:p-7",
                  i % 2 === 0 ? "border-r-2" : "",
                  i < stats.length - 1 ? "border-b-2 md:border-b-0" : "",
                  "md:border-r-2 md:last:border-r-0",
                  i === stats.length - 1 ? "col-span-2 md:col-span-1" : "",
                ].join(" ")}
              >
                <dt className="eyebrow text-[0.72rem] leading-snug text-muted">{s.label}</dt>
                <dd className="display led w-fit text-[15vw] leading-none sm:text-7xl md:text-[5.2vw] xl:text-7xl">
                  {s.to !== undefined ? (
                    <>
                      <Count to={s.value} run={inView} />
                      <span className="mx-1 text-[0.4em] align-middle text-bone/70">to</span>
                      <Count to={s.to} run={inView} />
                    </>
                  ) : (
                    <Count to={s.value} from={s.from} decimals={s.decimals} run={inView} />
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
