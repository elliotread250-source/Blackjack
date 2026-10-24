import type { Metadata } from "next";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/forms/ContactForm";
import { club, contact, seo, sessions } from "@/content/site";
import { img } from "@/content/images";

export const metadata: Metadata = {
  title: seo.contact.title,
  description: seo.contact.description,
  alternates: { canonical: "/contact" },
  openGraph: { title: seo.contact.title, description: seo.contact.description, url: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero title={contact.heading} intro={contact.intro} image={img("drill")} compact position="50% 40%" />
      <section className="py-20 md:py-28">
        <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="display mb-8 text-5xl md:text-6xl">Send a message</h2>
            <ContactForm />
          </div>
          <aside className="space-y-8 lg:col-span-5" aria-labelledby="details-heading">
            <h2 id="details-heading" className="display text-5xl md:text-6xl">
              Find us
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Button href={club.phoneHref} variant="secondary" magnetic={false} icon={<Icon d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />}>
                {club.phoneDisplay}
              </Button>
              <Button href={`mailto:${club.email}`} variant="secondary" magnetic={false} icon={<Icon d="M3 6h18v12H3zM3 7l9 7 9-7" />} className="normal-case tracking-normal">
                Email us
              </Button>
            </div>
            <dl className="grid gap-6 rounded-[12px] border border-bone/10 bg-coal p-6 sm:grid-cols-2">
              <div>
                <dt className="eyebrow text-[0.72rem] text-orange">Training</dt>
                <dd className="mt-2">
                  Every Saturday
                  {sessions.map((s) => (
                    <span key={s.id} className="block text-muted">
                      {s.label}: {s.startDisplay} to {s.endDisplay}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-[0.72rem] text-orange">Venue</dt>
                <dd className="mt-2">
                  <address className="not-italic">
                    {club.venue.name}
                    <span className="block text-muted">
                      {club.venue.street}, {club.venue.town}
                    </span>
                    <span className="block text-muted">{club.venue.postcode}</span>
                  </address>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="eyebrow text-[0.72rem] text-orange">Email</dt>
                <dd className="mt-2 break-all">
                  <a href={`mailto:${club.email}`} className="underline decoration-orange underline-offset-4">
                    {club.email}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="overflow-hidden rounded-[12px] border-2 border-graphite bg-coal">
              <iframe
                title={`Map showing ${club.venue.full}`}
                src={club.venue.mapEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="map-dark block h-80 w-full border-0"
              />
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">{club.venue.full}</p>
                <Button href={club.venue.directions} external variant="primary" magnetic={false} className="shrink-0 px-4">
                  Get directions
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
