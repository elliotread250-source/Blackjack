import type Lenis from "lenis";

/**
 * One Lenis instance for the whole site. Components that need it (GSAP
 * ScrollTrigger sync, modals that freeze scrolling, anchor buttons) read it
 * from here instead of prop drilling. It's null when reduced motion is on.
 */
let instance: Lenis | null = null;
const listeners = new Set<(l: Lenis | null) => void>();

export function setLenis(l: Lenis | null) {
  instance = l;
  listeners.forEach((fn) => fn(l));
}

export function getLenis() {
  return instance;
}

/** Calls back now if Lenis exists, and again whenever it's (re)created. */
export function onLenis(fn: (l: Lenis | null) => void) {
  listeners.add(fn);
  if (instance) fn(instance);
  return () => listeners.delete(fn);
}

export function lockScroll(locked: boolean) {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}

export function scrollToId(id: string, offset = -24) {
  const el = document.getElementById(id);
  if (!el) return;
  if (instance) instance.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}
