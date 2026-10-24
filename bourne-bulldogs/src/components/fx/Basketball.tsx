/**
 * A flat basketball whose seams rotate while the shading stays put, which
 * reads as a sphere spinning rather than a disc. Rotate the `.ball-seams`
 * group (or the whole thing) with transforms.
 */
export function Basketball({ className, seamsClassName, id = "bb" }: { className?: string; seamsClassName?: string; id?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}-shade`} cx="34%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="38%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="78%" stopColor="#000000" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </radialGradient>
        <pattern id={`${id}-pebble`} width="3" height="3" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.55" fill="#000" opacity="0.14" />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#d9612f" />
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-pebble)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <g className={seamsClassName} style={{ transformOrigin: "50px 50px" }}>
          <g fill="none" stroke="#1a0f0a" strokeWidth="2.6" strokeLinecap="round">
            <path d="M2 50h96" />
            <path d="M50 2v96" />
            <path d="M16 14c13 10 20 22 20 36s-7 26-20 36" />
            <path d="M84 14c-13 10-20 22-20 36s7 26 20 36" />
          </g>
        </g>
      </g>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}-shade)`} />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#1a0f0a" strokeOpacity="0.55" strokeWidth="1.2" />
    </svg>
  );
}
