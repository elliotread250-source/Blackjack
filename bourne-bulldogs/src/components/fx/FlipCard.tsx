"use client";

import Image from "next/image";
import { useState } from "react";
import type { SiteImage } from "@/content/images";
import { cn } from "@/lib/cn";

/**
 * Front/back photo card. Hover flips on desktop; the button flips on tap
 * and for keyboard users, so nobody needs a mouse to see the back.
 */
export function FlipCard({ front, back, label, sizes, className, badge }: { front: SiteImage; back: SiteImage; label: string; sizes: string; className?: string; badge?: React.ReactNode }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={cn("flip relative", className)} data-hover-flip data-flipped={flipped} data-cursor="image">
      <div className="flip-inner aspect-square w-full">
        <div className="flip-face absolute inset-0 overflow-hidden rounded-[var(--radius-card)] bg-white">
          <Image src={front.src} alt={front.alt} fill sizes={sizes} placeholder={front.blurDataURL ? "blur" : "empty"} blurDataURL={front.blurDataURL} className="object-cover" />
        </div>
        <div className="flip-face flip-back overflow-hidden rounded-[var(--radius-card)] bg-white">
          <Image src={back.src} alt={back.alt} fill sizes={sizes} placeholder={back.blurDataURL ? "blur" : "empty"} blurDataURL={back.blurDataURL} className="object-cover" />
        </div>
      </div>
      {badge}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        className="theme-dark absolute bottom-3 right-3 z-10 inline-flex min-h-10 items-center gap-2 rounded-full bg-ink/85 px-4 text-xs font-bold uppercase tracking-[0.14em] text-bone backdrop-blur hover:bg-orange hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {flipped ? "Show front" : "Show back"}
        <span className="sr-only"> of the {label}</span>
      </button>
    </div>
  );
}
