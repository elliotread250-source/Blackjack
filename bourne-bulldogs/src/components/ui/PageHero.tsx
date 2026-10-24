import Image from "next/image";
import type { SiteImage } from "@/content/images";
import { CourtLines } from "@/components/fx/CourtLines";
import { cn } from "@/lib/cn";

/** Inner-page hero: big display headline over a graded photo. */
export function PageHero({ title, intro, image, eyebrow, position = "center", compact = false, children }: { title: string; intro?: string; image: SiteImage; eyebrow?: string; position?: string; compact?: boolean; children?: React.ReactNode }) {
  // Letters animate individually, but each word stays on one line.
  let n = 0;
  const words = title.toUpperCase().split(" ").map((w) => w.split("").map((ch) => ({ ch, i: n++ })));
  return (
    <section className={cn("relative isolate flex items-end overflow-hidden pb-14 pt-32 md:pb-20", compact ? "min-h-[60svh] md:min-h-[64svh]" : "min-h-[78svh] md:min-h-[86svh]")}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority
        sizes="100vw"
        placeholder={image.blurDataURL ? "blur" : "empty"}
        blurDataURL={image.blurDataURL}
        className="-z-20 object-cover saturate-[.85]"
        style={{ objectPosition: position }}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <CourtLines variant="arc" className="absolute -right-24 top-24 -z-10 hidden w-[46rem] text-orange/50 md:block" strokeWidth={1.5} />
      <div className="container-x">
        {eyebrow && (
          <p className="eyebrow hero-fade mb-5 text-orange" style={{ ["--d" as string]: "0.1s" }}>
            {eyebrow}
          </p>
        )}
        <h1 className={cn("display leading-[0.82]", compact ? "text-[17vw] sm:text-[13vw] lg:text-[9.5vw]" : "text-[19vw] sm:text-[15vw] lg:text-[11.5vw]")} aria-label={title}>
          {words.map((word, wi) => (
            <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
              {word.map(({ ch, i }) => (
                <span key={i} className="inline-block overflow-hidden align-bottom">
                  <span className="hero-letter" style={{ ["--i" as string]: i }}>
                    {ch}
                  </span>
                </span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </h1>
        {intro && (
          <p className={cn("hero-fade mt-6 max-w-2xl text-lg text-bone/90 md:text-xl")} style={{ ["--d" as string]: "0.55s" }}>
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
