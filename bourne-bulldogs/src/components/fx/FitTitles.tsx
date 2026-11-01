"use client";

import { useEffect } from "react";

/**
 * Graduate is a wide face, so a long single word (COMMUNITY in a half-width
 * column) can be wider than its box, and a word can't wrap. Any title that
 * overflows is scaled down just enough to fit, and checked again when the
 * window resizes or a new page's titles arrive.
 */
export function FitTitles() {
  useEffect(() => {
    let raf = 0;
    const fit = () => {
      document.querySelectorAll<HTMLElement>(":is(h1, h2, h3).display").forEach((el) => {
        el.style.fontSize = "";
        const size = parseFloat(getComputedStyle(el).fontSize);
        // Reveal masks overhang their words slightly on purpose; that isn't overflow.
        if (el.clientWidth && el.scrollWidth - el.clientWidth > size * 0.12) {
          el.style.fontSize = `${Math.floor(size * (el.clientWidth / el.scrollWidth))}px`;
        }
      });
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    };
    schedule();
    document.fonts?.ready.then(schedule);
    window.addEventListener("resize", schedule);
    const pages = new MutationObserver(schedule);
    pages.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      pages.disconnect();
    };
  }, []);
  return null;
}
