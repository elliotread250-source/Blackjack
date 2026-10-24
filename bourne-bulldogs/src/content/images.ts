/**
 * Every photo on the site, with alt text written from what's actually in it.
 *
 * To swap a photo: drop the new file into public/images with the SAME filename
 * and push. To add one: put the file in public/images and add an entry below.
 * Sizes and blur placeholders come from image-manifest.json, which
 * scripts/build-manifest.mjs regenerates before every build.
 */
import manifest from "./image-manifest.json";

type Entry = { file: string; alt: string; width?: number; height?: number };

const entries = {
  logo: { file: "logo-on-dark.png", alt: "Bourne Bulldogs Basketball Club badge: a snarling bulldog over a basketball" },
  logoBall: { file: "logo-ball.png", alt: "Bourne Bulldogs bulldog badge" },
  logoOriginal: { file: "logo-main.png", alt: "Bourne Bulldogs Basketball Club badge" },
  basketballEngland: { file: "basketball-england-badge.jpg", alt: "Basketball England logo" },

  trainingGymWide: {
    file: "training-gym-wide.jpg",
    alt: "Bourne Bulldogs players in a full-court game in the sports hall, one in a blue number 30 jersey driving forward, with the hoop and brick walls behind",
  },
  jumpBall: {
    file: "jump-ball.jpg",
    alt: "Two players leap for the tip-off as teammates in orange and blue bibs and a coach look on",
  },
  gameAction: {
    file: "game-action-1.jpg",
    alt: "A player in an orange bib rises for a shot near the hoop as others close in",
  },
  drill: {
    file: "drill.jpg",
    alt: "Young players work through a dribbling drill across the court while a coach supervises",
  },
  coachDemo: {
    file: "coach-shooting-demo.jpg",
    alt: "A coach holds the ball up to demonstrate shooting form to players in orange and blue bibs",
  },
  huddle: {
    file: "timeout-huddle.jpg",
    alt: "A coach crouches with a clipboard during a timeout while Bourne Bulldogs players in club T-shirts listen from the bench",
  },
  playerShooting: {
    file: "player-shooting.jpg",
    alt: "A Bourne Bulldogs player goes up for a shot under the hoop as defenders in red contest",
  },
  dribbling1: {
    file: "player-dribbling-1.jpg",
    alt: "Three players race after a loose ball across the court while parents watch from the side",
  },
  dribbling2: {
    file: "player-dribbling-2.jpg",
    alt: "A Bourne Bulldogs player in the club T-shirt drives with the ball past a defender in red",
  },
  tournamentTeam: {
    file: "tournament-team.jpg",
    alt: "The Bourne Bulldogs tournament squad and their coach pose together in matching club T-shirts",
  },
  courtTexture: { file: "bg-court-texture.jpg", alt: "" },

  teamMartin: {
    file: "team-martin.jpg",
    alt: "Head coach Martin Read on court holding a basketball, with Great Britain jerseys on chairs and a Union Jack behind him",
  },
  teamElliot: {
    file: "team-elliot.jpg",
    alt: "Elliot Read in a Bourne Bulldogs T-shirt holding two basketballs in the sports hall",
  },
  teamWillow: {
    file: "team-willow.jpg",
    alt: "Willow the English Bulldog, the club mascot, sitting on the grass and looking up at the camera",
  },

  merchKidsTeeFront: { file: "merch-kids-tee-front.jpg", alt: "Front of the kids' personalised T-shirt in charcoal with the Bourne Bulldogs badge and the number 14" },
  merchKidsTeeBack: { file: "merch-kids-tee-back.jpg", alt: "Back of the kids' personalised T-shirt printed with READ and the number 14" },
  sizeKidsTee: { file: "size-kids-tee.png", alt: "Size guide for the kids' T-shirt: length and width in centimetres for sizes 3-4 to 12-13" },
  merchAdultTeeFront: { file: "merch-adult-tee-front.jpg", alt: "Front of the adult personalised T-shirt in dark charcoal with the Bourne Bulldogs badge and the number 14" },
  merchAdultTeeBack: { file: "merch-adult-tee-back.jpg", alt: "Back of the adult personalised T-shirt printed with READ and the number 14" },
  sizeAdultTee: { file: "size-adult-tee.png", alt: "Size guide for the adult T-shirt: chest measurements in centimetres for sizes S to 2XL" },
  merchKidsHoodyFront: { file: "merch-kids-hoody-front.jpg", alt: "Front of the kids' personalised hoody in ash grey with the Bourne Bulldogs badge" },
  merchKidsHoodyBack: { file: "merch-kids-hoody-back.jpg", alt: "Back of the kids' personalised hoody printed with READ and the number 14" },
  sizeKidsHoody: { file: "size-kids-hoody.png", alt: "Size guide for the kids' hoody: length and width in centimetres for sizes 3-4 to 12-13" },
  merchAdultHoodyFront: { file: "merch-adult-hoody-front.jpg", alt: "Front of the adult personalised hoody in ash grey with the Bourne Bulldogs badge" },
  merchAdultHoodyBack: { file: "merch-adult-hoody-back.jpg", alt: "Back of the adult personalised hoody printed with READ and the number 14" },
  sizeAdultHoody: { file: "size-adult-hoody.png", alt: "Size guide for the adult hoody with chest measurements for each size" },
} satisfies Record<string, Entry>;

export type ImageKey = keyof typeof entries;

export type SiteImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
};

const sizes = manifest as Record<string, { width: number; height: number; blurDataURL?: string }>;

export function img(key: ImageKey): SiteImage {
  const e: Entry = entries[key];
  const m = sizes[e.file];
  return {
    src: `/images/${e.file}`,
    alt: e.alt,
    width: m?.width ?? e.width ?? 1600,
    height: m?.height ?? e.height ?? 1200,
    blurDataURL: m?.blurDataURL,
  };
}

/** Action shots for galleries, in display order. */
export const galleryKeys: ImageKey[] = [
  "jumpBall",
  "dribbling2",
  "trainingGymWide",
  "playerShooting",
  "huddle",
  "gameAction",
  "coachDemo",
  "dribbling1",
  "drill",
  "tournamentTeam",
];
