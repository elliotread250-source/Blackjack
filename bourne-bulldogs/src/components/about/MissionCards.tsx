"use client";

import { m } from "framer-motion";

export function MissionCards({ points }: { points: Array<{ title: string; body: string }> }) {
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {points.map((p, i) => (
        <m.li
          key={p.title}
          className="group relative overflow-hidden rounded-[12px] border border-bone/10 bg-coal p-7 md:p-8"
          initial={{ opacity: 0, y: 60, rotate: i % 2 ? 2 : -2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <span aria-hidden className="jersey-outline block text-[7rem] leading-[0.8] text-orange transition-transform duration-500 group-hover:-translate-y-1">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="display mt-6 text-4xl">{p.title}</h3>
          <p className="mt-3 text-muted">{p.body}</p>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-orange transition-transform duration-500 group-hover:scale-x-100" />
        </m.li>
      ))}
    </ol>
  );
}
