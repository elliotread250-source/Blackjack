import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { RevealImage } from "@/components/fx/RevealImage";
import { DrawIcon } from "@/components/fx/DrawIcon";
import { AvailabilityNotice } from "@/components/ui/AvailabilityNotice";
import { club, join, seo, sessions } from "@/content/site";
import { img } from "@/content/images";

export const metadata: Metadata = {
  title: seo.join.title,
  description: seo.join.description,
  alternates: { canonical: "/join" },
  openGraph: { title: seo.join.title, description: seo.join.description, url: "/join" },
};

export default function JoinPage() {
  return (
    <>
      <PageHero title={join.heading} intro={join.intro} image={img("jumpBall")} compact eyebrow="Ages 8 to 16" position="50% 30%" />
      <section className="py-20 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display mb-3 text-5xl md:text-6xl">Tell us about your child</h2>
            <p className="mb-6 text-muted">We&apos;ll reply with everything you need to get started.</p>
            <AvailabilityNotice variant="compact" className="mb-8" />
            {join.tasterNote && <p className="mb-8 rounded-[8px] bg-orange px-4 py-3 font-bold text-ink">{join.tasterNote}</p>}
            <ContactForm defaultEnquiry="join" lockEnquiry submitLabel={join.button} />
          </div>
          <aside className="space-y-6 lg:col-span-5" aria-label="Why Bourne Bulldogs">
            <RevealImage image={img("tournamentTeam")} sizes="(min-width: 1024px) 38vw, 92vw" className="aspect-[4/3]" from="right" />
            <ul className="space-y-3">
              {join.reassurance.map((r, i) => (
                <li key={r} className="flex items-center gap-4 rounded-[10px] border border-bone/10 bg-coal p-4">
                  <DrawIcon name={["shield", "heart", "ball"][i]} className="h-9 w-9 shrink-0 text-orange" delay={i * 0.15} />
                  <span className="font-bold">{r}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-[10px] border border-bone/10 p-5">
              <p className="eyebrow text-[0.72rem] text-orange">Every Saturday at {club.venue.name}</p>
              <ul className="mt-3 space-y-1">
                {sessions.map((s) => (
                  <li key={s.id} className="flex justify-between gap-4">
                    <span className="text-muted">{s.label}</span>
                    <span className="display text-2xl">
                      {s.startDisplay} to {s.endDisplay}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted">
                Prefer to talk? Call{" "}
                <a href={club.phoneHref} className="text-bone underline decoration-orange underline-offset-4">
                  {club.phoneDisplay}
                </a>
                .
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
