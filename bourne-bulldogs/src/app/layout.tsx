import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Anton, Inter } from "next/font/google";
import "./globals.css";
import { club, seo, sessions } from "@/content/site";
import { img } from "@/content/images";
import { SITE_URL } from "@/lib/site-url";
import { MotionProvider } from "@/components/fx/MotionProvider";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { Cursor } from "@/components/fx/Cursor";
import { TransitionProvider } from "@/components/fx/Transition";
import { IntroLoader, introScript } from "@/components/fx/IntroLoader";
import { Basketball } from "@/components/fx/Basketball";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { LightboxProvider } from "@/components/fx/Lightbox";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: seo.home.title, template: `%s | ${club.name}` },
  description: seo.home.description,
  applicationName: club.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: club.name,
    url: "/",
    title: seo.home.title,
    description: seo.home.description,
  },
  twitter: { card: "summary_large_image", title: seo.home.title, description: seo.home.description },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0e0d0f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["SportsClub", "SportsOrganization"],
    "@id": `${SITE_URL}/#club`,
    name: club.name,
    alternateName: club.shortName,
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo-main.png`,
    image: `${SITE_URL}/images/tournament-team.jpg`,
    email: club.email,
    telephone: club.phoneE164,
    sport: "Basketball",
    description: seo.home.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${club.venue.name}, ${club.venue.street}`,
      addressLocality: club.venue.town,
      addressRegion: club.venue.county,
      postalCode: club.venue.postcode,
      addressCountry: "GB",
    },
    location: {
      "@type": "SportsActivityLocation",
      name: club.venue.name,
      address: { "@type": "PostalAddress", streetAddress: club.venue.street, addressLocality: club.venue.town, postalCode: club.venue.postcode, addressCountry: "GB" },
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "https://schema.org/Saturday",
      opens: sessions[0].start,
      closes: sessions[sessions.length - 1].end,
    },
    memberOf: { "@type": "SportsOrganization", name: "Basketball England", url: club.basketballEngland },
    areaServed: { "@type": "City", name: "Bourne, Lincolnshire" },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logo = img("logo");
  return (
    <html lang="en-GB" className={`${anton.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <JsonLd />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-4 top-4 z-[200] -translate-y-24 rounded-[8px] bg-orange px-5 py-3 font-bold text-ink transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>

        <div id="intro" className="intro" aria-hidden>
          <div className="intro-stage">
            <div className="intro-floor" />
            <div className="intro-ball">
              <Basketball className="h-full w-full" id="intro" />
            </div>
            <div className="intro-logo">
              <Image src={logo.src} alt="" fill sizes="160px" className="object-contain" />
            </div>
          </div>
          <p className="intro-skip-hint eyebrow">Tap to skip</p>
        </div>

        <MotionProvider>
          <TransitionProvider logoSrc={logo.src}>
            <Nav logo={logo} />
            <LightboxProvider>
              <main id="main" tabIndex={-1} className="outline-none">
                {children}
              </main>
            </LightboxProvider>
            <Footer />
          </TransitionProvider>
          <ScrollProgress />
          <Cursor />
        </MotionProvider>
        <SmoothScroll />
        <IntroLoader />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
