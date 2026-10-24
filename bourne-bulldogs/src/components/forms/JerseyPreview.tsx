import type { Product } from "@/content/site";

/**
 * Back-of-shirt mock-up with the surname and number in a jersey style:
 * black fill, grey outline, like the real prints. Hoodies get a hood.
 */
export function JerseyPreview({ product, surname, number, supporter }: { product: Product; surname: string; number: string; supporter: boolean }) {
  const hoody = product.id.includes("hoody");
  const light = hoody;
  const fill = product.colour;
  const shade = light ? "#bdbcbb" : "#2f2d31";
  const name = supporter ? "" : surname.toUpperCase();
  const num = supporter ? "" : number;
  const ghost = !supporter && !name && !num;
  const nameSize = name.length > 9 ? 34 : name.length > 6 ? 42 : 50;

  return (
    <svg viewBox="0 0 400 440" className="h-auto w-full" role="img" aria-label={supporter ? `${product.short}, plain back (supporter)` : `${product.short} back with ${name || "no surname"} and ${num ? `number ${num}` : "no number"}`}>
      <defs>
        <linearGradient id="cloth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={fill} />
          <stop offset="1" stopColor={shade} />
        </linearGradient>
      </defs>
      {hoody ? (
        <g>
          <path d="M120 70c10-40 150-40 160 0l18 22-196 0z" fill={shade} />
          <path d="M130 60c20 40 120 40 140 0" fill="none" stroke="#00000022" strokeWidth="6" />
          <path d="M100 86l200 0 70 60 24 160-50 12-20-110 0 230H76V208l-20 110-50-12 24-160z" fill="url(#cloth)" />
          <path d="M76 400h248v26H76z" fill={shade} />
        </g>
      ) : (
        <path d="M150 40c10 20 90 20 100 0l70 24 64 70-44 46-34-28V420H94V152l-34 28-44-46 64-70z" fill="url(#cloth)" />
      )}
      <path d={hoody ? "M200 86v320" : "M200 52v368"} stroke="#00000014" strokeWidth="2" />
      <g fontFamily="var(--font-anton), Impact, sans-serif" textAnchor="middle" fill="#111" stroke="#9a9a9a" strokeWidth="3" paintOrder="stroke" opacity={ghost ? 0.22 : 1}>
        <text x="200" y={hoody ? 170 : 150} fontSize={ghost ? 50 : nameSize} letterSpacing="2">
          {ghost ? "SURNAME" : name}
        </text>
        <text x="200" y={hoody ? 330 : 330} fontSize="170" letterSpacing="-4">
          {ghost ? "00" : num}
        </text>
      </g>
      {supporter && (
        <text x="200" y="250" textAnchor="middle" fontFamily="var(--font-inter), sans-serif" fontWeight="700" fontSize="16" letterSpacing="3" fill={light ? "#5c574f" : "#a39e97"}>
          SUPPORTER: PLAIN BACK
        </text>
      )}
    </svg>
  );
}
