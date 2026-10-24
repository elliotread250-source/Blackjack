import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SplitHeading } from "@/components/fx/SplitHeading";
import { club } from "@/content/site";
import { img } from "@/content/images";

export function FinalCta({ heading, body, button }: { heading: string; body: string; button: string }) {
  const bg = img("courtTexture");
  return (
    <section aria-labelledby="cta-heading" className="theme-dark relative isolate overflow-hidden bg-ink py-28 md:py-44">
      <Image src={bg.src} alt="" fill sizes="100vw" placeholder={bg.blurDataURL ? "blur" : "empty"} blurDataURL={bg.blurDataURL} className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/80" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--c-ink)_85%)]" />
      <div className="container-x text-center">
        <SplitHeading id="cta-heading" text={heading} className="mx-auto max-w-6xl text-[15vw] leading-[0.85] md:text-[9rem] lg:text-[11rem]" />
        <p className="mx-auto mt-8 max-w-xl text-lg text-bone/90">{body}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button href="/join">{button}</Button>
          <Button href={club.phoneHref} variant="secondary" icon={<Phone />} aria-label={`Call ${club.phoneDisplay}`}>
            {club.phoneDisplay}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Phone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
