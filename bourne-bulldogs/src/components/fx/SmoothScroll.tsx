"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getLenis, setLenis } from "@/lib/lenis-store";
import { prefersReducedMotion } from "@/lib/motion-pref";

/** Lenis smooth scrolling, off entirely for reduced motion. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 1.1, smoothWheel: true, autoRaf: true, anchors: { offset: -24 } });
      setLenis(lenis);
      destroy = () => {
        lenis.destroy();
        setLenis(null);
      };
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
