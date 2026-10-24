/**
 * Hoop in two layers so a ball can pass *through* it: render <HoopBack/>
 * below the ball and <HoopFront/> above it, both inside the same box.
 */
export function HoopBack({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      {/* Backboard */}
      <rect x="20" y="4" width="160" height="104" rx="6" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.85" strokeWidth="3" />
      <rect x="68" y="44" width="64" height="48" rx="2" fill="none" stroke="#d35933" strokeWidth="3" />
      {/* Bracket */}
      <path d="M92 108v10M108 108v10" stroke="currentColor" strokeOpacity="0.6" strokeWidth="4" />
      {/* Back half of the rim */}
      <path d="M52 124c0-8 21-12 48-12s48 4 48 12" fill="none" stroke="#b44a24" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function HoopFront({ className, netClassName }: { className?: string; netClassName?: string }) {
  return (
    <svg viewBox="0 0 200 220" className={className} aria-hidden focusable="false">
      <g data-net className={netClassName} style={{ transformOrigin: "100px 124px" }}>
        <g fill="none" stroke="currentColor" strokeOpacity="0.75" strokeWidth="1.6" strokeLinejoin="round">
          <path d="M54 126l12 70M70 128l8 70M86 130l6 70M100 130v70M114 130l-6 70M130 128l-8 70M146 126l-12 70" />
          <path d="M56 140c20 6 68 6 88 0M60 158c18 5 62 5 80 0M64 176c16 4 56 4 72 0M68 196c14 3 50 3 64 0" />
        </g>
      </g>
      {/* Front half of the rim */}
      <path d="M52 124c0 8 21 12 48 12s48-4 48-12" fill="none" stroke="#d35933" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
