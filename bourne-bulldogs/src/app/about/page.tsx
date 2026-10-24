import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { RevealImage } from "@/components/fx/RevealImage";
import { CourtLines } from "@/components/fx/CourtLines";
import { StoryTimeline } from "@/components/about/StoryTimeline";
import { MissionCards } from "@/components/about/MissionCards";
import { TeamGrid } from "@/components/about/TeamGrid";
import { SafetyBlock } from "@/components/home/SafetyBlock";
import { FinalCta } from "@/components/home/FinalCta";
import { about, home, safety, seo, team } from "@/content/site";
import { img } from "@/content/images";

export const metadata: Metadata = {
  title: seo.about.title,
  description: seo.about.description,
  alternates: { canonical: "/about" },
  openGraph: { title: seo.about.title, description: seo.about.description, url: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero title={about.heading} intro={about.intro} image={img("huddle")} eyebrow="Bourne Bulldogs Basketball Club" position="50% 35%" />

      <section aria-labelledby="story-heading" className="relative py-24 md:py-36">
        <div className="container-x">
          <SectionMarker n="01" label="Since 2022" />
          <SplitHeading id="story-heading" text={about.story.heading} className="mt-6 text-[19vw] leading-[0.85] sm:text-8xl lg:text-[9rem]" />
          <div className="mt-16 md:mt-24">
            <StoryTimeline steps={about.story.timeline} />
          </div>
          <figure className="relative mx-auto mt-24 max-w-4xl md:mt-32">
            <span aria-hidden className="display absolute -left-2 -top-16 text-[10rem] leading-none text-orange md:-left-12">
              &ldquo;
            </span>
            <blockquote className="relative text-xl leading-relaxed text-bone/90 md:text-2xl md:leading-relaxed">
              <p>{about.story.quote}</p>
            </blockquote>
            <figcaption className="eyebrow mt-6 text-orange">{about.story.attribution}</figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="mission-heading" className="relative overflow-hidden border-y border-bone/10 bg-[#121114] py-24 md:py-32">
        <CourtLines variant="circle" className="absolute -left-40 -top-20 w-[36rem] text-orange/15" strokeWidth={1.5} />
        <div className="container-x relative">
          <SectionMarker n="02" label="What we're here to do" />
          <SplitHeading id="mission-heading" text={about.mission.heading} className="mt-6 text-[17vw] leading-[0.85] sm:text-8xl lg:text-[8.5rem]" />
          <p className="mt-6 max-w-2xl text-lg text-muted">{about.mission.lead}</p>
          <div className="mt-12">
            <MissionCards points={about.mission.points} />
          </div>
        </div>
      </section>

      <section aria-labelledby="community-heading" className="relative py-24 md:py-36">
        <div className="container-x grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionMarker n="03" label="Bourne & around" />
            <SplitHeading id="community-heading" text={about.community.heading} className="mt-6 text-[16vw] leading-[0.85] sm:text-8xl lg:text-[7.5rem]" />
            <div className="mt-8 space-y-5 text-lg text-muted">
              {about.community.body.map((p) => (
                <p key={p.slice(0, 16)}>{p}</p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-6">
            <RevealImage image={img("tournamentTeam")} sizes="(min-width: 1024px) 46vw, 92vw" className="col-span-2 aspect-[16/10]" />
            <RevealImage image={img("dribbling1")} sizes="(min-width: 1024px) 23vw, 46vw" className="aspect-square" from="right" />
            <RevealImage image={img("coachDemo")} sizes="(min-width: 1024px) 23vw, 46vw" className="aspect-square" from="bottom" />
          </div>
        </div>
      </section>

      <section id="team" aria-labelledby="team-heading" className="relative scroll-mt-24 border-t border-bone/10 py-24 md:py-32">
        <div className="container-x">
          <SectionMarker n="04" label="The people (and the dog)" />
          <SplitHeading id="team-heading" text={team.heading} className="mt-6 text-[19vw] leading-[0.85] sm:text-8xl lg:text-[9rem]" />
          <p className="mt-6 max-w-2xl text-lg text-muted">{team.intro}</p>
          <div className="mt-14">
            <TeamGrid members={team.members.map((m) => ({ member: m, image: m.image ? img(m.image) : undefined }))} />
          </div>
        </div>
      </section>

      <SafetyBlock id="safety" heading={safety.heading} sub={safety.intro} n="05" full />

      <section className="py-20 md:py-28">
        <p className="container-x mx-auto max-w-4xl text-center text-2xl leading-snug md:text-3xl">{about.closing}</p>
      </section>

      <FinalCta {...home.finalCta} />
    </>
  );
}
