"use client";

import Image from "next/image";
import { useRef } from "react";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { useLightbox } from "@/components/fx/Lightbox";
import type { SiteImage } from "@/content/images";
import { gsap, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion-pref";

/**
 * Desktop: the section pins and the photo strip slides sideways as you
 * scroll. Phones: a swipeable strip with snap points. Tap a photo for the
 * lightbox either way.
 */
export function HorizontalGallery({ images, heading, n }: { images: SiteImage[]; heading: string; n: string }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const open = useLightbox();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const t = track.current!;
        const distance = () => t.scrollWidth - window.innerWidth + 48;
        gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} aria-labelledby="gallery-heading" className="relative overflow-hidden bg-coal py-20 md:flex md:h-[100svh] md:flex-col md:justify-center md:py-0">
      <div className="container-x mb-8 flex items-end justify-between gap-6 md:mb-10">
        <div>
          <SectionMarker n={n} label="Saturdays at Bourne Leisure Centre" />
          <SplitHeading id="gallery-heading" text={heading} letters className="mt-5 text-[18vw] leading-[0.85] md:text-[8rem]" />
        </div>
        <p className="hidden max-w-xs pb-4 text-muted md:block">Keep scrolling. Click any photo to see it full size.</p>
      </div>
      <ul
        ref={track}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:w-max md:snap-none md:gap-6 md:overflow-visible md:px-10 md:pb-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Photo gallery"
      >
        {images.map((im, i) => {
          const portrait = im.height > im.width;
          return (
            <li key={im.src} className="shrink-0 snap-center">
              <button
                type="button"
                onClick={(e) => open(images, i, e.currentTarget)}
                className="grade group relative block h-[58svh] overflow-hidden rounded-[var(--radius-card)] bg-graphite md:h-[60vh]"
                style={{ aspectRatio: portrait ? "3 / 4" : "4 / 3", maxWidth: "86vw" }}
                aria-label={`Open photo ${i + 1} of ${images.length}: ${im.alt}`}
              >
                <Image src={im.src} alt={im.alt} fill sizes="(min-width: 768px) 60vh, 86vw" placeholder={im.blurDataURL ? "blur" : "empty"} blurDataURL={im.blurDataURL} className="object-cover group-hover:scale-[1.04]" />
                <span aria-hidden className="display absolute bottom-3 left-4 text-3xl text-bone drop-shadow-[0_2px_8px_rgba(0,0,0,.7)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
