import Image from "next/image";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { home } from "@/content/site";
import { img } from "@/content/images";
import { TLink } from "@/components/fx/Transition";

function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <g fill="currentColor">
        <ellipse cx="16" cy="21" rx="7" ry="6" />
        <ellipse cx="7" cy="13" rx="3" ry="4" />
        <ellipse cx="13" cy="8" rx="3" ry="4" />
        <ellipse cx="19" cy="8" rx="3" ry="4" />
        <ellipse cx="25" cy="13" rx="3" ry="4" />
      </g>
    </svg>
  );
}

export function MeetWillow() {
  const w = img("teamWillow");
  return (
    <section aria-labelledby="willow-heading" className="relative overflow-hidden border-y border-bone/10 bg-coal py-20 md:py-28">
      <div className="container-x grid items-center gap-12 md:grid-cols-2">
        <div className="wobble-on-hover relative mx-auto w-[72vw] max-w-[26rem]">
          <TLink href="/about#team" className="block rounded-full" aria-label="Meet Willow and the rest of the team">
            <div className="wobble-target relative aspect-square overflow-hidden rounded-full border-[6px] border-orange shadow-[0_0_0_10px_var(--c-coal),0_0_0_12px_rgb(232_103_60/.35)]">
              <Image src={w.src} alt={w.alt} fill sizes="(min-width: 768px) 26rem, 72vw" placeholder={w.blurDataURL ? "blur" : "empty"} blurDataURL={w.blurDataURL} className="object-cover" />
            </div>
          </TLink>
          <span aria-hidden className="display absolute -right-2 top-4 rotate-12 rounded-[6px] bg-red px-3 py-1 text-2xl text-white shadow-lg md:-right-6">
            Mascot
          </span>
          <Paw className="absolute -bottom-4 left-2 h-10 w-10 -rotate-12 text-orange/60" />
          <Paw className="absolute -bottom-12 left-14 h-8 w-8 rotate-6 text-orange/40" />
          <Paw className="absolute -bottom-20 left-24 h-6 w-6 -rotate-6 text-orange/25" />
        </div>
        <div>
          <SectionMarker n="08" label="Official mascot" />
          <SplitHeading id="willow-heading" text={home.willow.heading} letters className="mt-6 text-[19vw] leading-[0.85] sm:text-8xl lg:text-[9rem]" />
          <p className="mt-6 max-w-md text-xl leading-relaxed text-bone/90 md:text-2xl">{home.willow.line}</p>
        </div>
      </div>
    </section>
  );
}
