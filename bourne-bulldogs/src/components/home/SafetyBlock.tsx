import Image from "next/image";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { CourtLines } from "@/components/fx/CourtLines";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { safety, club } from "@/content/site";
import { img } from "@/content/images";

/** Trust block. Light grey on Home; a dark band (with the full list) on About. */
export function SafetyBlock({ heading, sub, n, full = false, id, dark = false }: { heading: string; sub: string; n: string; full?: boolean; id?: string; dark?: boolean }) {
  const be = img("basketballEngland");
  const headingId = `${id ?? "safety"}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={`${dark ? "theme-dark bg-ink" : "bg-coal"} relative overflow-hidden py-24 text-bone md:py-32`}>
      <CourtLines variant="key" className="absolute -right-16 -top-10 h-[120%] text-orange/20" strokeWidth={1.5} />
      <div className="container-x relative">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionMarker n={n} label="Safety & standards" />
            <SplitHeading id={headingId} text={heading} className="mt-6 text-[17vw] leading-[0.85] sm:text-8xl lg:text-[8.5rem]" />
            <p className="mt-6 max-w-xl text-lg text-muted">{sub}</p>
          </div>
          <div className="flex items-end lg:col-span-5 lg:justify-end">
            <a
              href={club.basketballEngland}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-[12px] border-2 border-bone/15 bg-coal p-4 transition-colors hover:border-orange"
            >
              <Image src={be.src} alt={be.alt} width={72} height={72} className="h-[72px] w-[72px] rounded-full" />
              <span>
                <span className="display block text-2xl leading-none">Basketball England</span>
                <span className="text-sm text-muted">Registered club. Visit Basketball England</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </div>
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-[12px] border-2 border-bone/15 bg-bone/15 sm:grid-cols-2 lg:grid-cols-5">
          {safety.badges.map((b, i) => (
            <li key={b.title} className="flex flex-col gap-4 bg-ink p-6 md:p-7">
              <DrawIcon name={b.icon} className="h-12 w-12 text-orange" delay={i * 0.12} />
              <h3 className="display text-[1.7rem] leading-[0.95]">{b.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-muted">{b.body}</p>
            </li>
          ))}
        </ul>

        {full && (
          <ul className="mt-12 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {safety.points.map((p) => (
              <li key={p} className="flex gap-4 border-b border-bone/15 pb-4">
                <svg viewBox="0 0 24 24" className="mt-1 h-5 w-5 shrink-0 text-orange" aria-hidden>
                  <path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
