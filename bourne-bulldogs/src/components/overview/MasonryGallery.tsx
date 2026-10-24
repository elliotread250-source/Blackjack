"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { useLightbox } from "@/components/fx/Lightbox";
import type { SiteImage } from "@/content/images";

export function MasonryGallery({ images }: { images: SiteImage[] }) {
  const open = useLightbox();
  return (
    <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
      {images.map((im, i) => (
        <m.li
          key={im.src}
          className="break-inside-avoid"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <button type="button" onClick={(e) => open(images, i, e.currentTarget)} className="grade group block w-full overflow-hidden rounded-[var(--radius-card)] bg-graphite" aria-label={`Open photo ${i + 1} of ${images.length}: ${im.alt}`}>
            <Image
              src={im.src}
              alt={im.alt}
              width={im.width}
              height={im.height}
              sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
              placeholder={im.blurDataURL ? "blur" : "empty"}
              blurDataURL={im.blurDataURL}
              className="h-auto w-full group-hover:scale-[1.04]"
            />
          </button>
        </m.li>
      ))}
    </ul>
  );
}
