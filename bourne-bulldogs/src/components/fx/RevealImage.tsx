"use client";

import Image, { type ImageProps } from "next/image";
import { m } from "framer-motion";
import { cn } from "@/lib/cn";
import type { SiteImage } from "@/content/images";

type Props = {
  image: SiteImage;
  className?: string;
  imgClassName?: string;
  sizes: string;
  priority?: boolean;
  /** Direction the cover panel wipes away to. */
  from?: "left" | "right" | "bottom";
  grade?: boolean;
} & Pick<ImageProps, "quality">;

/**
 * An image that wipes into view. The "clip" is an ink panel scaling away
 * (transform only, so it stays on the compositor) while the photo settles
 * from a slight zoom.
 */
export function RevealImage({ image, className, imgClassName, sizes, priority, from = "left", grade = true, quality }: Props) {
  const origin = from === "left" ? "origin-right" : from === "right" ? "origin-left" : "origin-top";
  const axis = from === "bottom" ? { scaleY: 0 } : { scaleX: 0 };
  return (
    <m.div
      className={cn("relative overflow-hidden rounded-[var(--radius-card)] bg-graphite", grade && "grade", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <m.div
        className="absolute inset-0"
        variants={{ hidden: { scale: 1.18 }, show: { scale: 1, transition: { duration: 1.3, ease: [0.16, 1, 0.3, 1] } } }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          placeholder={image.blurDataURL ? "blur" : "empty"}
          blurDataURL={image.blurDataURL}
          className={cn("object-cover", imgClassName)}
        />
      </m.div>
      <m.div
        aria-hidden
        className={cn("absolute inset-0 bg-ink", origin)}
        variants={{ hidden: { scaleX: 1, scaleY: 1 }, show: { ...axis, transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } } }}
      />
    </m.div>
  );
}
