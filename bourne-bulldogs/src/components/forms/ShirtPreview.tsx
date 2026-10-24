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

/**
 * The real back-of-garment photo (with the club's sample print lifted off)
 * and the customer's surname and number printed where the print sits:
 * black fill, grey keyline, like the shirts the club sells.
 */
export function ShirtPreview({ product, image, surname, number, supporter }: { product: Product; image: SiteImage; surname: string; number: string; supporter: boolean }) {
  const p = product.print;
  const name = supporter ? "" : surname.toUpperCase();
  const num = supporter ? "" : number;
  const ghost = !supporter && !name && !num;
  const showName = ghost ? "SURNAME" : name;
  const showNum = ghost ? "00" : num;

  // viewBox is 0-100 on both axes, matching the square photo.
  const nameH = (p.name[1] - p.name[0]) * 100;
  let nameSize = nameH / CAP;
  const maxW = p.nameMaxWidth * 100;
  const estimated = showName.length * nameSize * ADVANCE;
  if (estimated > maxW) nameSize *= maxW / estimated;
  const nameBaseline = ((p.name[0] + p.name[1]) / 2) * 100 + (nameSize * CAP) / 2;
  const numSize = ((p.number[1] - p.number[0]) * 100) / CAP;

  const label = supporter
    ? `${product.short}, plain back (supporter)`
    : `${product.short} back printed with ${name || "no surname"} and ${num ? `number ${num}` : "no number"}`;

  return (
    <figure role="img" aria-label={label} className="relative aspect-square overflow-hidden rounded-[10px] bg-white">
      <Image src={image.src} alt="" fill sizes="(min-width: 1024px) 36vw, 90vw" placeholder={image.blurDataURL ? "blur" : "empty"} blurDataURL={image.blurDataURL} className="object-cover" />
      <svg viewBox="0 0 100 100" className={`absolute inset-0 h-full w-full ${graduate.className}`} aria-hidden focusable="false">
        {/* Two passes, like a heat-press print: a wide grey keyline underneath,
            then black letters thickened with a black stroke to match the
            heavy athletic block the club uses. */}
        {[
          { fill: "#a8a8a8", stroke: "#a8a8a8", extra: 2.1 },
          { fill: "#121212", stroke: "#121212", extra: 0 },
        ].map((layer, i) => (
          <g key={i} textAnchor="middle" fill={layer.fill} stroke={layer.stroke} strokeLinejoin="round" opacity={ghost ? 0.28 : 0.97} style={{ transition: "opacity .3s" }}>
            {showName && (
              <text x={p.x * 100} y={nameBaseline} fontSize={nameSize} strokeWidth={nameSize * (0.07 + layer.extra * 0.05)}>
                {showName}
              </text>
            )}
            {showNum && (
              <text x={p.x * 100} y={p.number[1] * 100} fontSize={numSize} letterSpacing={-numSize * 0.02} strokeWidth={numSize * (0.055 + layer.extra * 0.03)}>
                {showNum}
              </text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  );
}
