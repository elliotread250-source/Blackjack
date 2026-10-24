import type { Metadata } from "next";
import { BallJourney } from "@/components/home/BallJourney";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { IntroScrub } from "@/components/home/IntroScrub";
import { Scoreboard } from "@/components/home/Scoreboard";
import { Sessions } from "@/components/home/Sessions";
import { CoachSpotlight } from "@/components/home/CoachSpotlight";
import { HorizontalGallery } from "@/components/home/HorizontalGallery";
import { SafetyBlock } from "@/components/home/SafetyBlock";
import { MerchTeaser } from "@/components/home/MerchTeaser";
import { MeetWillow } from "@/components/home/MeetWillow";
import { FinalCta } from "@/components/home/FinalCta";
import { home, seo } from "@/content/site";
import { galleryKeys, img } from "@/content/images";

export const metadata: Metadata = {
  title: { absolute: seo.home.title },
  description: seo.home.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <BallJourney>
        <Hero desktop={img("trainingGymWide")} mobile={img("jumpBall")} />
        <Marquee items={home.marquee} />
        <IntroScrub lead={home.introLead} body={home.welcome.slice(1, 3)} photos={[img("dribbling2"), img("huddle"), img("playerShooting")]} />
        <Scoreboard stats={home.stats} />
        <Sessions />
      </BallJourney>
      <CoachSpotlight />
      <HorizontalGallery images={galleryKeys.map(img)} heading={home.galleryHeading} n="05" />
      <SafetyBlock heading={home.safetyHeading} sub={home.safetySub} n="06" />
      <MerchTeaser />
      <MeetWillow />
      <FinalCta {...home.finalCta} />
    </>
  );
}
