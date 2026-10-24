"use client";

import { m } from "framer-motion";
import { useRef } from "react";
import { gsap, useIdleGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion-pref";

type Step = { marker: string; title: string; body: string };

/** The club's story as a timeline; an orange line draws itself down as you scroll. */
export function StoryTimeline({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLOListElement>(null);

  useIdleGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-line]", { scaleY: 1 });
        return;
      }
      gsap.fromTo("[data-line]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.5 } });
    },
    root
  );

  return (
    <ol ref={root} className="relative ml-3 md:ml-0">
      <span aria-hidden className="absolute bottom-0 left-0 top-0 w-[2px] bg-bone/10 md:left-1/2 md:-ml-px" />
      <span aria-hidden data-line className="absolute bottom-0 left-0 top-0 w-[2px] origin-top scale-y-0 bg-orange md:left-1/2 md:-ml-px" />
      {steps.map((s, i) => {
        const right = i % 2 === 1;
        return (
          <li key={s.title} className="relative pb-14 pl-10 last:pb-0 md:grid md:grid-cols-2 md:gap-16 md:pl-0">
            <span aria-hidden className="absolute left-0 top-2 -ml-[7px] h-4 w-4 rounded-full border-[3px] border-orange bg-ink md:left-1/2 md:-ml-2" />
            <m.div
              className={right ? "md:col-start-2" : "md:text-right"}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -20% 0px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={`display block text-6xl leading-none md:text-7xl ${s.marker === "2022" ? "text-orange" : "jersey-outline text-orange"}`}>{s.marker}</span>
              <h3 className="display mt-3 text-3xl md:text-4xl">{s.title}</h3>
              <p className={`mt-2 text-muted md:max-w-md ${right ? "" : "md:ml-auto"}`}>{s.body}</p>
            </m.div>
          </li>
        );
      })}
    </ol>
  );
}
