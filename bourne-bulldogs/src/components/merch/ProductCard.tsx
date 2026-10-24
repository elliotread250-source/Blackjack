"use client";

import Image from "next/image";
import { m } from "framer-motion";
import { useRef } from "react";
import { FlipCard } from "@/components/fx/FlipCard";
import type { Product } from "@/content/site";
import type { SiteImage } from "@/content/images";
import { lockScroll } from "@/lib/lenis-store";

export function ProductCard({ product, front, back, chart, index }: { product: Product; front: SiteImage; back: SiteImage; chart: SiteImage; index: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const openChart = () => {
    dialog.current?.showModal();
    lockScroll(true);
  };

  return (
    <m.article
      className="flex flex-col"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, delay: (index % 2) * 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <FlipCard front={front} back={back} label={product.name} sizes="(min-width: 1024px) 40vw, (min-width: 640px) 46vw, 92vw" badge={<span className="theme-dark eyebrow absolute left-3 top-3 z-10 rounded-full bg-ink px-3 py-1.5 text-[0.68rem] text-bone">{product.audience === "kids" ? "Kids" : "Adults"}</span>} />
      <div className="mt-5 flex items-start justify-between gap-4">
        <h3 className="display text-3xl leading-[0.95] md:text-4xl xl:text-[1.9rem]">{product.name}</h3>
        <p className="display led shrink-0 text-5xl leading-none">£{product.price}</p>
      </div>
      <p className="mt-2 text-sm text-muted">{product.sizeNote}</p>
      <details className="group mt-4 border-y border-bone/10 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-bold uppercase tracking-[0.14em]">
          Material & details
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full border border-bone/20 transition-transform duration-300 group-open:rotate-45">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" />
            </svg>
          </span>
        </summary>
        <ul className="space-y-2 pb-5 text-muted">
          {product.details.map((d) => (
            <li key={d} className="flex gap-3">
              <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
              {d}
            </li>
          ))}
        </ul>
      </details>
      <button ref={trigger} type="button" onClick={openChart} className="mt-4 self-start text-sm font-bold uppercase tracking-[0.14em] underline decoration-orange decoration-2 underline-offset-8 hover:text-orange">
        View size guide
      </button>

      <dialog
        ref={dialog}
        aria-label={`${product.name} size guide`}
        className="m-auto w-[min(92vw,900px)] rounded-[12px] bg-ink p-0 text-bone"
        onClose={() => {
          lockScroll(false);
          trigger.current?.focus();
        }}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      >
        <div className="flex items-center justify-between border-b border-bone/10 px-5 py-4">
          <h4 className="display text-2xl">{product.short} size guide</h4>
          <button type="button" onClick={() => dialog.current?.close()} className="grid h-11 w-11 place-items-center rounded-[8px] border border-bone/20 hover:border-orange" aria-label="Close size guide" autoFocus>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.4" />
            </svg>
          </button>
        </div>
        <div className="bg-white p-4">
          <Image src={chart.src} alt={chart.alt} width={chart.width} height={chart.height} sizes="(min-width: 960px) 900px, 92vw" className="h-auto w-full" />
        </div>
        {product.id === "adult-hoody" && <p className="px-5 py-4 text-sm text-muted">{product.sizeNote}</p>}
      </dialog>
    </m.article>
  );
}
