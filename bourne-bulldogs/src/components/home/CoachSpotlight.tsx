import { RevealImage } from "@/components/fx/RevealImage";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { CourtLines } from "@/components/fx/CourtLines";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Button } from "@/components/ui/Button";
import { home } from "@/content/site";
import { img } from "@/content/images";

export function CoachSpotlight() {
  const c = home.coach;
  return (
    <section aria-labelledby="coach-heading" className="relative overflow-hidden py-24 md:py-36">
      <CourtLines variant="circle" className="absolute -right-40 top-10 w-[40rem] text-orange/20" strokeWidth={1.5} />
      <div className="container-x grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="relative lg:col-span-5">
          <RevealImage image={img("teamMartin")} sizes="(min-width: 1024px) 38vw, 92vw" className="aspect-[4/5] w-full" from="left" />
          <div aria-hidden className="display absolute -bottom-8 -right-3 text-[7rem] leading-none text-orange md:-right-8 md:text-[10rem]">
            35
          </div>
        </div>
        <div className="lg:col-span-7">
          <SectionMarker n="04" label={c.eyebrow} />
          <SplitHeading id="coach-heading" text={c.name} className="mt-6 text-[18vw] leading-[0.85] sm:text-8xl lg:text-[8.5rem]" />
          <ul className="mt-10 divide-y divide-bone/10 border-y border-bone/10">
            {c.credentials.map((cred, i) => (
              <li key={cred} className="flex items-baseline gap-5 py-4 md:py-5">
                <span className="display text-xl text-orange md:text-2xl" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <SplitHeading as="p" text={cred} delay={0.1 + i * 0.08} className="text-3xl leading-none md:text-5xl" />
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button href="/about#team" variant="ghost">
              {c.link}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
