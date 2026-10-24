import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { Button } from "@/components/ui/Button";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { RevealImage } from "@/components/fx/RevealImage";
import { CourtLines } from "@/components/fx/CourtLines";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { SessionFlow } from "@/components/overview/SessionFlow";
import { SkillCards } from "@/components/overview/SkillCards";
import { MasonryGallery } from "@/components/overview/MasonryGallery";
import { FinalCta } from "@/components/home/FinalCta";
import { home, overview, safety, seo, sessions, training } from "@/content/site";
import { galleryKeys, img } from "@/content/images";

export const metadata: Metadata = {
  title: seo.overview.title,
  description: seo.overview.description,
  alternates: { canonical: "/club-overview" },
  openGraph: { title: seo.overview.title, description: seo.overview.description, url: "/club-overview" },
};

export default function ClubOverviewPage() {
  return (
    <>
      <PageHero title={overview.heading} intro={overview.intro} image={img("playerShooting")} eyebrow="Every Saturday" position="50% 20%" />

      <section aria-labelledby="session-heading" className="relative py-24 md:py-32">
        <div className="container-x">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionMarker n="01" label={training.length} />
              <SplitHeading id="session-heading" text={overview.sessionsHeading} className="mt-6 text-[14vw] leading-[0.85] sm:text-7xl lg:text-[6.5rem]" />
            </div>
            <div className="lg:col-span-5">
              <p className="text-lg text-muted">{overview.sessionsBody}</p>
              <ul className="mt-5 flex flex-wrap gap-3">
                {sessions.map((s) => (
                  <li key={s.id} className="rounded-[8px] border border-bone/15 px-4 py-2">
                    <span className="eyebrow mr-2 text-[0.7rem] text-orange">{s.label}</span>
                    <span className="display text-xl">
                      {s.startDisplay} to {s.endDisplay}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-14">
            <SessionFlow steps={training.steps} />
          </div>
        </div>
      </section>

      <section aria-labelledby="skills-heading" className="relative overflow-hidden border-y border-bone/10 bg-coal py-24 md:py-32">
        <CourtLines variant="arc" className="absolute -right-32 bottom-0 w-[44rem] text-orange/15" strokeWidth={1.5} />
        <div className="container-x relative">
          <SectionMarker n="02" label="On and off the court" />
          <SplitHeading id="skills-heading" text={overview.skillsHeading} className="mt-6 text-[13vw] leading-[0.85] sm:text-7xl lg:text-[7rem]" />
          <p className="mt-6 max-w-2xl text-lg text-muted">{overview.skillsIntro}</p>
          <p className="eyebrow mt-3 text-[0.7rem] text-muted">Hover or tap a card</p>
          <div className="mt-12">
            <SkillCards skills={overview.skills} />
          </div>
        </div>
      </section>

      <section aria-labelledby="coaching-heading" className="theme-dark relative bg-ink py-24 text-bone md:py-32">
        <div className="container-x grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionMarker n="03" label="Safety first" />
            <SplitHeading id="coaching-heading" text={overview.coachingHeading} className="mt-6 text-[12vw] leading-[0.88] sm:text-7xl lg:text-[5.5rem]" />
            <div className="mt-8 space-y-5 text-lg text-muted">
              {overview.coachingBody.map((p) => (
                <p key={p.slice(0, 16)}>{p}</p>
              ))}
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {safety.badges.slice(0, 4).map((b, i) => (
                <li key={b.title} className="flex items-center gap-3 rounded-[10px] border-2 border-bone/15 p-3">
                  <DrawIcon name={b.icon} className="h-9 w-9 shrink-0 text-orange" delay={i * 0.1} />
                  <span className="font-bold leading-tight">{b.title}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button href="/about#safety" magnetic={false}>
                Safety & standards
              </Button>
            </div>
          </div>
          <div className="lg:col-span-6">
            <RevealImage image={img("coachDemo")} sizes="(min-width: 1024px) 46vw, 92vw" className="aspect-square" from="right" />
          </div>
        </div>
      </section>

      <section aria-labelledby="tournaments-heading" className="relative py-24 md:py-36">
        <div className="container-x">
          <SectionMarker n="04" label="Competitive play" />
          <SplitHeading id="tournaments-heading" text={overview.tournamentsHeading} className="mt-6 text-[12vw] leading-[0.88] sm:text-7xl lg:text-[7rem]" />
          <div className="relative mt-12">
            <RevealImage image={img("tournamentTeam")} sizes="(min-width: 1440px) 1360px, 96vw" className="aspect-[4/3] md:aspect-[16/8]" />
            <div className="relative -mt-16 ml-4 mr-4 rounded-[12px] bg-orange p-6 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,.8)] md:absolute md:-bottom-10 md:right-10 md:mt-0 md:ml-0 md:mr-0 md:w-[26rem] md:p-8">
              <p className="eyebrow">{overview.leagueCallout.eyebrow}</p>
              <p className="display mt-2 text-5xl leading-[0.9] md:text-6xl">{overview.leagueCallout.title}</p>
              <p className="mt-3 font-semibold">{overview.leagueCallout.body}</p>
            </div>
          </div>
          <div className="mt-16 grid gap-10 md:mt-24 md:grid-cols-2">
            <p className="text-lg text-muted">{overview.tournamentsBody}</p>
            <div>
              <h3 className="display text-5xl">{overview.whyHeading}</h3>
              <p className="mt-4 text-lg text-muted">{overview.whyBody}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="gallery-heading" className="border-t border-bone/10 py-24 md:py-32">
        <div className="container-x">
          <SectionMarker n="05" label="Saturdays at Bourne Leisure Centre" />
          <SplitHeading id="gallery-heading" text={overview.galleryHeading} letters className="mb-12 mt-6 text-[19vw] leading-[0.85] sm:text-8xl lg:text-[9rem]" />
          <MasonryGallery images={galleryKeys.map(img)} />
        </div>
      </section>

      <FinalCta {...home.finalCta} />
    </>
  );
}
