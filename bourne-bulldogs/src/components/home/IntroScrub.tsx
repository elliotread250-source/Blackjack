"use client";

import Image from "next/image";
import { useRef } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import type { SiteImage } from "@/content/images";
import { gsap, useIdleGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion-pref";

/**
 * Big welcome line whose words light up from grey to white as you scroll
 * through it, next to three photos that fan out.
 */
export function IntroScrub({ lead, body, photos }: { lead: string; body: string[]; photos: SiteImage[] }) {
  const root = useRef<HTMLElement>(null);
  const words = lead.split(" ");

  useIdleGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-word]", { opacity: 1 });
        return;
      }
      gsap.to("[data-word]", {
        opacity: 1,
        stagger: 0.08,
        ease: "none",
        scrollTrigger: { trigger: "[data-lead]", start: "top 78%", end: "bottom 42%", scrub: true },
      });
      const fan = [
        { rotation: -9, xPercent: -22, yPercent: 6 },
        { rotation: 3, xPercent: 4, yPercent: -6 },
        { rotation: 12, xPercent: 26, yPercent: 10 },
      ];
      gsap.utils.toArray<HTMLElement>("[data-fan]").forEach((card, idx) => {
        gsap.fromTo(
          card,
          { rotation: 0, xPercent: 0, yPercent: 0 },
          { ...fan[idx], ease: "none", scrollTrigger: { trigger: "[data-collage]", start: "top 85%", end: "center 45%", scrub: 0.6 } }
        );
      });
    },
    root
  );

  return (
    <section ref={root} aria-labelledby="intro-heading" className="relative py-24 md:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <SectionMarker n="01" label="Welcome to the club" />
          <h2 id="intro-heading" className="sr-only">
            Welcome to Bourne Bulldogs
          </h2>
          <p data-lead className="display mt-10 text-[9.5vw] leading-[0.98] sm:text-6xl lg:text-[4.6rem]">
            {words.map((w, i) => (
              <span key={i} data-word className="opacity-40">
                {w}{" "}
              </span>
            ))}
          </p>
          <div className="mt-10 max-w-xl space-y-5 text-muted">
            {body.map((p) => (
              <p key={p.slice(0, 20)}>{p}</p>
            ))}
          </div>
        </div>
        <div data-collage className="relative mx-auto aspect-[4/5] w-[68%] max-w-sm self-center sm:w-1/2 lg:col-span-5 lg:w-[72%]">
          {photos.map((p, i) => (
            <div
              key={p.src}
              data-fan
              className="grade absolute inset-0 overflow-hidden rounded-[var(--radius-card)] border-4 border-bone bg-graphite shadow-[0_30px_60px_-20px_rgba(0,0,0,.7)] will-change-transform"
              style={{ zIndex: i === 1 ? 3 : i + 1 }}
            >
              <Image src={p.src} alt={p.alt} fill sizes="(min-width: 1024px) 26vw, 60vw" placeholder={p.blurDataURL ? "blur" : "empty"} blurDataURL={p.blurDataURL} className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
