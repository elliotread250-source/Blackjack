"use client";

import { getImageProps } from "next/image";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { CourtLines } from "@/components/fx/CourtLines";
import { Basketball } from "@/components/fx/Basketball";
import { club, home } from "@/content/site";
import type { SiteImage } from "@/content/images";
import { gsap, useGSAP } from "@/lib/gsap";
import { scrollToId } from "@/lib/lenis-store";
import { prefersReducedMotion } from "@/lib/motion-pref";

export function Hero({ desktop, mobile }: { desktop: SiteImage; mobile: SiteImage }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to("[data-hero-bg]", { yPercent: 16, ease: "none", scrollTrigger: st });
      gsap.to("[data-hero-title]", { scale: 0.86, opacity: 0.25, yPercent: -12, ease: "none", transformOrigin: "0% 100%", scrollTrigger: st });
      gsap.to("[data-hero-copy]", { opacity: 0, y: -40, ease: "none", scrollTrigger: { ...st, end: "60% top" } });
    },
    { scope: root }
  );

  // Art direction: the wide gym shot on desktop, the tip-off on phones.
  const common = { alt: desktop.alt, sizes: "100vw", quality: 75 };
  const { props: d } = getImageProps({ ...common, src: desktop.src, width: desktop.width, height: desktop.height, priority: true });
  const { props: mo } = getImageProps({ ...common, alt: mobile.alt, src: mobile.src, width: mobile.width, height: mobile.height, priority: true });

  const lines = ["Bourne", "Bulldogs"];
  let i = 0;

  return (
    <section ref={root} aria-labelledby="hero-title" className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pb-24 pt-28 md:pb-20">
      <div data-hero-bg className="absolute inset-x-0 -top-[8%] -z-20 h-[116%] will-change-transform">
        <picture>
          <source media="(min-width: 768px)" srcSet={d.srcSet} sizes="100vw" />
          <source media="(max-width: 767px)" srcSet={mo.srcSet} sizes="100vw" />
          <img {...mo} alt={mobile.alt} className="h-full w-full object-cover object-[50%_30%] saturate-[.82] md:object-center" />
        </picture>
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,var(--color-ink)_4%,rgb(14_13_15/.72)_45%,rgb(14_13_15/.35)_100%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_20%,rgb(232_103_60/.22),transparent_55%)]" />
      <CourtLines variant="half" className="absolute -bottom-10 left-1/2 -z-10 w-[140vw] max-w-none -translate-x-1/2 text-orange/40 md:w-[110vw]" strokeWidth={1.5} delay={0.6} />

      <div className="container-x relative">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-10">
            <p className="hero-fade mb-4 flex items-center gap-3" style={{ ["--d" as string]: "0.05s" }}>
              <span className="display inline-block -rotate-2 rounded-[6px] bg-orange px-3 py-1.5 text-2xl leading-none text-ink md:text-3xl">{club.tagline}</span>
            </p>
            <h1 id="hero-title" data-hero-title aria-label={club.shortName} className="display text-[22.5vw] leading-[0.8] sm:text-[19vw] lg:text-[15.2vw] 2xl:text-[14.5rem]">
              {lines.map((line) => (
                <span key={line} aria-hidden className="block whitespace-nowrap">
                  {line.split("").map((ch) => (
                    <span key={i} className="inline-block overflow-hidden pb-[0.04em] align-bottom">
                      <span className="hero-letter" style={{ ["--i" as string]: i++ }}>
                        {ch.toUpperCase()}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </h1>
          </div>
          {/* Where the basketball rests before it travels (see BallJourney). */}
          <div className="pointer-events-none absolute right-4 top-[-18vh] h-[22vw] w-[22vw] max-h-40 max-w-40 sm:right-8 lg:static lg:col-span-2 lg:mb-[10vw] lg:h-auto lg:max-h-none lg:w-full lg:max-w-none lg:justify-self-end">
            <div data-ball-start className="aspect-square w-full lg:w-[11vw]" />
          </div>
        </div>

        <div data-hero-copy className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <p className="hero-fade max-w-md text-lg text-bone/90 md:text-xl" style={{ ["--d" as string]: "0.75s" }}>
            {club.heroLine}
          </p>
          <div className="hero-fade flex flex-wrap gap-3" style={{ ["--d" as string]: "0.9s" }}>
            <Button href="/join">{home.ctaPrimary}</Button>
            <Button variant="secondary" onClick={() => scrollToId("training")} icon={<Down />}>
              {home.ctaSecondary}
            </Button>
          </div>
        </div>
      </div>

      <div aria-hidden className="hero-fade absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-muted" style={{ ["--d" as string]: "1.2s" }}>
        <div className="cue h-5 w-5">
          <Basketball className="h-full w-full" id="cue" />
        </div>
        <span className="eyebrow text-[0.65rem]">Scroll</span>
      </div>
    </section>
  );
}

function Down() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden>
      <path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}
