import { useId } from "react";
import Image from "next/image";
import { Graduate } from "next/font/google";
import type { Product } from "@/content/site";
import type { SiteImage } from "@/content/images";

// Collegiate slab-serif, the closest free match to the club's real print.
// Only this component uses it, so it only loads on the merch page.
const graduate = Graduate({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

/** Graduate's capital height as a fraction of its font size. */
const CAP = 0.7;
/** Average uppercase advance as a fraction of font size, for fitting long names. */
const ADVANCE = 0.7;
/** Average digit advance as a fraction of font size, for fitting the number. */
const DIGIT = 0.58;
/** Print sizes relative to the measured print areas: a full-size back print. */
const NAME_SCALE = 1.25;
const NAME_WIDTH = 1.15;
const NUMBER_SCALE = 1.12;
/** How far the middle of the name rises above its ends, per unit of its width. */
const ARCH = 0.07;

/** The two heat-press passes: a wide grey keyline, then the black letters on top. */
const LAYERS = [
  { fill: "#a8a8a8", extra: 2.1 },
  { fill: "#121212", extra: 0 },
];

/**
 * The real back-of-garment photo (with the club's sample print lifted off)
 * and the customer's surname and number printed where the print sits:
 * black fill, grey keyline, like the shirts the club sells. The name arches
 * across the shoulders, and the print takes on the fabric: its edges are
 * roughened like ink on a knit, and the photo's own folds and highlights are
 * laid back over the letters so the print follows the creases.
 */
export function ShirtPreview({ product, image, surname, number, supporter }: { product: Product; image: SiteImage; surname: string; number: string; supporter: boolean }) {
  const id = useId().replace(/:/g, "");
  const p = product.print;
  const name = supporter ? "" : surname.toUpperCase();
  const num = supporter ? "" : number;
  const ghost = !supporter && !name && !num;
  const showName = ghost ? "SURNAME" : name;
  const showNum = ghost ? "00" : num;

  // viewBox is 0-100 on both axes, matching the square photo.
  const x = p.x * 100;
  const nameH = (p.name[1] - p.name[0]) * 100;
  let nameSize = (nameH / CAP) * NAME_SCALE;
  const maxW = p.nameMaxWidth * 100 * NAME_WIDTH;
  const estimated = showName.length * nameSize * ADVANCE;
  if (estimated > maxW) nameSize *= maxW / estimated;
  const nameW = Math.min(estimated, maxW);
  const rise = nameW * ARCH;
  const nameBaseline = ((p.name[0] + p.name[1]) / 2) * 100 + (nameSize * CAP) / 2 + rise / 2;
  // The arch runs a little past the name so the text never falls off its ends;
  // the curve is steeper there, so the name's own ends drop by exactly `rise`.
  const half = nameW / 2 + nameSize;
  const peak = rise * (half / (nameW / 2 || 1)) ** 2;
  const arch = `M${x - half} ${nameBaseline}Q${x} ${nameBaseline - 2 * peak} ${x + half} ${nameBaseline}`;

  let numSize = ((p.number[1] - p.number[0]) * 100 * NUMBER_SCALE) / CAP;
  const numMaxW = maxW * 1.2;
  const numW = showNum.length * numSize * DIGIT;
  if (numW > numMaxW) numSize *= numMaxW / numW;

  const label = supporter
    ? `${product.short}, plain back (supporter)`
    : `${product.short} back printed with ${name || "no surname"} and ${num ? `number ${num}` : "no number"}`;

  const print = (fill: string, extra: number) => (
    <g textAnchor="middle" fill={fill} stroke={fill} strokeLinejoin="round">
      {showName && (
        <text fontSize={nameSize} strokeWidth={nameSize * (0.07 + extra * 0.05)}>
          <textPath href={`#${id}-arch`} startOffset="50%">
            {showName}
          </textPath>
        </text>
      )}
      {showNum && (
        <text x={x} y={p.number[1] * 100} fontSize={numSize} letterSpacing={-numSize * 0.02} strokeWidth={numSize * (0.055 + extra * 0.03)}>
          {showNum}
        </text>
      )}
    </g>
  );

  return (
    <figure role="img" aria-label={label} className="relative aspect-square overflow-hidden rounded-[10px] bg-white">
      <Image src={image.src} alt="" fill sizes="(min-width: 1024px) 36vw, 90vw" placeholder={image.blurDataURL ? "blur" : "empty"} blurDataURL={image.blurDataURL} className="object-cover" />
      <svg viewBox="0 0 100 100" className={`absolute inset-0 h-full w-full ${graduate.className}`} aria-hidden focusable="false">
        <defs>
          <path id={`${id}-arch`} d={arch} />
          {/* Fine noise nudges the edges, like ink pressed into a knit. */}
          <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7" result="weave" />
            <feDisplacementMap in="SourceGraphic" in2="weave" scale="0.45" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.06" />
          </filter>
          <mask id={`${id}-print`}>{print("#fff", LAYERS[0].extra)}</mask>
        </defs>
        <g filter={`url(#${id}-ink)`} opacity={ghost ? 0.28 : 0.96} style={{ transition: "opacity .3s" }}>
          {LAYERS.map((l) => (
            <g key={l.fill}>{print(l.fill, l.extra)}</g>
          ))}
          {/* The garment's shading over the print: folds darken it, highlights catch it. */}
          <image href={image.src} width="100" height="100" preserveAspectRatio="xMidYMid slice" mask={`url(#${id}-print)`} opacity="0.5" style={{ mixBlendMode: "soft-light" }} />
          <image href={image.src} width="100" height="100" preserveAspectRatio="xMidYMid slice" mask={`url(#${id}-print)`} opacity="0.08" style={{ mixBlendMode: "screen" }} />
        </g>
      </svg>
    </figure>
  );
}
