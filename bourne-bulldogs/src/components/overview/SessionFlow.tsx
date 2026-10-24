"use client";

import { m } from "framer-motion";
import { DrawIcon } from "@/components/fx/DrawIcon";

const icons = ["ball", "game", "team"];

/** Skill development -> in-game scenarios -> friendly game. */
export function SessionFlow({ steps }: { steps: Array<{ title: string; body: string }> }) {
  return (
    <ol className="relative grid gap-5 md:grid-cols-3 md:gap-0">
      {steps.map((s, i) => (
        <m.li
          key={s.title}
          className="relative flex flex-col rounded-[12px] border border-bone/10 bg-coal p-7 md:mx-3 md:p-8"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "0px 0px -15% 0px" }}
          transition={{ duration: 0.8, delay: i * 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between">
            <DrawIcon name={icons[i]} className="h-14 w-14 text-orange" delay={0.3 + i * 0.25} />
            <span className="display text-5xl text-bone/15" aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
          </div>
          <h3 className="display mt-6 text-4xl">{s.title}</h3>
          <p className="mt-3 text-muted">{s.body}</p>
          {i < steps.length - 1 && (
            <m.span
              aria-hidden
              className="absolute -right-6 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-orange text-ink md:grid"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.25, type: "spring", stiffness: 300, damping: 15 }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M5 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </m.span>
          )}
        </m.li>
      ))}
    </ol>
  );
}
