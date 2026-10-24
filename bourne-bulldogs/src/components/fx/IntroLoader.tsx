"use client";

import { useEffect } from "react";

/**
 * Wires up the CSS intro: click/key to skip, and clears the flag once it's
 * done. The markup and the "is this a first visit?" check live in the
 * layout so it never flashes or waits on React.
 */
export function IntroLoader() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.dataset.intro) return;
    const el = document.getElementById("intro");
    const finish = () => {
      html.classList.remove("intro-skip");
      delete html.dataset.intro;
    };
    const skip = () => {
      html.classList.add("intro-skip");
      window.setTimeout(finish, 320);
    };
    const timer = window.setTimeout(finish, 1850);
    el?.addEventListener("click", skip);
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      el?.removeEventListener("click", skip);
      window.removeEventListener("keydown", skip);
    };
  }, []);
  return null;
}

/** Runs in <head> before paint: first visit this session, motion allowed, show the intro. */
export const introScript = `try{if(!sessionStorage.getItem("bb-intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.intro="1";sessionStorage.setItem("bb-intro","1")}}catch(e){}`;
