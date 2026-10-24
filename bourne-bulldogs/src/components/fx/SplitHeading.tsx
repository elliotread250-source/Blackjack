"use client";

import { m, type Variants } from "framer-motion";
import { createElement } from "react";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  /** Split into letters instead of words (for short, punchy headings). */
  letters?: boolean;
  delay?: number;
  once?: boolean;
  id?: string;
};

const container: Variants = { hidden: {}, show: (delay: number) => ({ transition: { staggerChildren: 0.06, delayChildren: delay } }) };
const piece: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Words (or letters) slide up from behind a mask as the heading scrolls in.
 * Screen readers get the plain text from a visually hidden copy; the pieces are hidden.
 */
export function SplitHeading({ text, as = "h2", className, letters = false, delay = 0, once = true, id }: Props) {
  const words = text.split(" ");
  const MotionTag = m[as];
  return createElement(
    MotionTag,
    {
      id,
      className: cn("display", className),
      initial: "hidden",
      whileInView: "show",
      viewport: { once, margin: "0px 0px -12% 0px" },
      variants: container,
      custom: delay,
    },
    [<span key="sr" className="sr-only">{text}</span>, ...words.map((word, wi) => (
      <span key={wi} aria-hidden className="inline-block overflow-hidden pb-[0.06em] align-bottom">
        {letters ? (
          word.split("").map((ch, ci) => (
            <m.span key={ci} variants={piece} className="inline-block will-change-transform">
              {ch}
            </m.span>
          ))
        ) : (
          <m.span variants={piece} className="inline-block will-change-transform">
            {word}
          </m.span>
        )}
        {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
      </span>
    ))]
  );
}
