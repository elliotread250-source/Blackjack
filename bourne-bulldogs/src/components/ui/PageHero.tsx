import Image from "next/image";
import type { SiteImage } from "@/content/images";
import { CourtLines } from "@/components/fx/CourtLines";
import { cn } from "@/lib/cn";

/** Inner-page hero: big display headline over a graded photo. */
export function PageHero({ title, intro, image, eyebrow, position = "center", children }: { title: string; intro?: string; image: SiteImage; eyebrow?: string; position?: string; children?: React.ReactNode }) {
  const letters = title.toUpperCase().split("");
  return (
    <section className="relative isolate flex min-h-[78svh] items-end overflow-hidden pb-14 pt-32 md:min-h-[86svh] md:pb-20">
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
        <h1 className="display text-[19vw] leading-[0.82] sm:text-[15vw] lg:text-[11.5vw]" aria-label={title}>
          {letters.map((ch, i) => (
            <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
              <span className="hero-letter" style={{ ["--i" as string]: i }}>
                {ch === " " ? " " : ch}
              </span>
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
