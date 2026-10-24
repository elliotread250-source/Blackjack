import Image from "next/image";
import { TLink } from "@/components/fx/Transition";
import { club, nav, sessions } from "@/content/site";
import { img } from "@/content/images";

export function Footer() {
  const logo = img("logo");
  const be = img("basketballEngland");
  return (
    <footer className="theme-dark relative overflow-hidden border-t border-bone/10 bg-coal pt-16 md:pt-24">
      <div className="container-x grid gap-12 pb-16 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <Image src={logo.src} alt={logo.alt} width={120} height={120} className="h-24 w-24 md:h-28 md:w-28" />
          <p className="mt-5 max-w-xs text-muted">{club.footerTagline}</p>
          <a
            href={club.basketballEngland}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-3 rounded-[10px] border border-bone/15 py-2 pl-2 pr-4 transition-colors hover:border-orange"
          >
            <Image src={be.src} alt="" width={44} height={44} className="h-11 w-11 rounded-full" />
            <span className="text-sm leading-tight">
              <span className="block font-bold">Basketball England</span>
              <span className="text-muted">Registered club</span>
            </span>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>

        <div className="md:col-span-3">
          <h2 className="eyebrow mb-4 text-orange">Training</h2>
          <p className="font-bold">Every Saturday</p>
          <ul className="mt-2 space-y-1 text-muted">
            {sessions.map((s) => (
              <li key={s.id}>
                {s.label}: <span className="display text-xl text-bone">{s.startDisplay} to {s.endDisplay}</span>
              </li>
            ))}
          </ul>
          <address className="mt-5 not-italic text-muted">
            {club.venue.name}
            <br />
            {club.venue.street}, {club.venue.town}
            <br />
            {club.venue.postcode}
          </address>
        </div>

        <div className="md:col-span-3">
          <h2 className="eyebrow mb-4 text-orange">Get in touch</h2>
          <ul className="space-y-2">
            <li>
              <a href={`mailto:${club.email}`} className="break-all underline decoration-bone/30 underline-offset-4 hover:decoration-orange">
                {club.email}
              </a>
            </li>
            <li>
              <a href={club.phoneHref} className="underline decoration-bone/30 underline-offset-4 hover:decoration-orange">
                {club.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>

        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="eyebrow mb-4 text-orange">Explore</h2>
          <ul className="space-y-2">
            {[...nav, { href: "/join", label: "Join" }].map((item) => (
              <li key={item.href}>
                <TLink href={item.href} className="text-muted transition-colors hover:text-bone">
                  {item.label}
                </TLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="container-x flex flex-col gap-2 border-t border-bone/10 py-6 text-sm text-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {club.name}</p>
        <p>Bourne, Lincolnshire</p>
      </div>

      {/* Decorative wordmark. SVG text so contrast checkers don't treat it as body copy. */}
      <svg aria-hidden focusable="false" viewBox="0 0 1000 190" className="pointer-events-none block w-full select-none px-2" preserveAspectRatio="xMidYMax meet">
        <text x="500" y="182" textAnchor="middle" fontFamily="var(--font-anton), Impact, sans-serif" fontSize="232" letterSpacing="4" fill="rgb(242 236 225 / 0.045)">
          BULLDOGS
        </text>
      </svg>
    </footer>
  );
}
