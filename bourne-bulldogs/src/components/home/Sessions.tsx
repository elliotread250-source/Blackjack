"use client";

import { useRef } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { HoopBack, HoopFront } from "@/components/fx/Hoop";
import { CourtLines } from "@/components/fx/CourtLines";
import { AvailabilityNotice } from "@/components/ui/AvailabilityNotice";
import { club, home, sessions, training } from "@/content/site";
import { gsap, useIdleGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion-pref";

/**
 * Training times. The hoop up top is where the hero ball lands. On desktop
 * the cards pin while they slide together; on phones they simply reveal.
 */
export function Sessions() {
  const root = useRef<HTMLElement>(null);

  useIdleGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: "[data-pin]", start: "top 12%", end: "+=70%", pin: true, scrub: 0.6, anticipatePin: 1 },
        });
        tl.from("[data-card='0']", { xPercent: -40, rotation: -6, opacity: 0, ease: "power2.out" }, 0)
          .from("[data-card='1']", { xPercent: 40, rotation: 6, opacity: 0, ease: "power2.out" }, 0.1)
          .from("[data-sessions-meta]", { y: 30, opacity: 0 }, 0.4);
      });
      mm.add("(max-width: 1023px)", () => {
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((card) => {
          gsap.from(card, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 88%" } });
        });
      });
      return () => mm.revert();
    },
    root
  );

  return (
    <section ref={root} id="training" aria-labelledby="training-heading" className="relative scroll-mt-24 overflow-x-clip pb-24 pt-20 md:pb-32 md:pt-28">
      <div className="container-x">
        <div className="relative flex flex-col-reverse gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionMarker n="03" label={home.sessionsSub} />
            <SplitHeading id="training-heading" text={home.sessionsHeading} letters className="mt-6 text-[22vw] leading-[0.82] md:text-[11rem] lg:text-[13rem]" />
          </div>
          {/* The ball lands here. Back layer under the ball, front layer over it. */}
          <div data-ball-hoop className="relative mx-auto text-bone aspect-[200/220] w-[52vw] max-w-[260px] md:mx-0 md:mr-[4vw] md:w-[22vw]">
            <HoopBack className="absolute inset-0 z-10 h-full w-full" />
            <HoopFront className="absolute inset-0 z-30 h-full w-full" netClassName="net-group" />
          </div>
        </div>

        <div data-pin className="relative mt-12 md:mt-16">
          <CourtLines variant="key" className="absolute -left-10 top-1/2 hidden h-[130%] -translate-y-1/2 text-orange/25 lg:block" strokeWidth={1.5} />
          <div className="relative grid gap-5 md:grid-cols-2 md:gap-6">
            {sessions.map((s, i) => (
              <article
                key={s.id}
                data-card={i}
                className="group relative overflow-hidden rounded-[12px] border border-bone/10 bg-coal p-6 sm:p-8 md:p-10"
              >
                <div aria-hidden className="absolute -right-6 -top-10 select-none font-[family-name:var(--font-display)] text-[12rem] leading-none text-bone/[0.04]">
                  0{i + 1}
                </div>
                <p className="eyebrow text-orange">{s.label}</p>
                <p className="display mt-4 text-6xl leading-[0.9] sm:text-7xl md:text-[5.5vw] xl:text-8xl">
                  <span className="sr-only">
                    {s.startDisplay}pm to {s.endDisplay}
                  </span>
                  <span aria-hidden>
                    {s.startDisplay}
                    <span className="mx-2 text-[0.38em] align-middle text-muted">to</span>
                    {s.endDisplay.replace("pm", "")}
                    <span className="ml-1 text-[0.38em] text-orange">pm</span>
                  </span>
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-bone/10 pt-6 text-sm">
                  <div>
                    <dt className="eyebrow text-[0.7rem] text-muted">When</dt>
                    <dd className="mt-1 font-bold">{training.day}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-[0.7rem] text-muted">Where</dt>
                    <dd className="mt-1 font-bold">{club.venue.name}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
          <div data-sessions-meta className="mt-8 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <p className="max-w-2xl text-muted">{training.summary}</p>
            <a
              href={club.venue.directions}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold uppercase tracking-[0.14em] text-bone underline decoration-orange decoration-2 underline-offset-8 hover:text-orange"
            >
              {club.venue.street}, {club.venue.town} {club.venue.postcode}
              <span className="sr-only"> (directions, opens in a new tab)</span>
            </a>
          </div>
        </div>
        {/* Outside the pinned animation on purpose: this must always be seen. */}
        <AvailabilityNotice className="mt-10 md:mt-12" />
      </div>
    </section>
  );
}
