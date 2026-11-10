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

/**
 * Runs in <head> before paint. The intro plays when the homepage is the first page of the
 * session and motion is allowed. Anyone who lands somewhere else (a shared /join link, say)
 * goes straight to the content, and isn't shown the intro later in that session either.
 */
export const introScript = `try{if(!sessionStorage.getItem("bb-intro")){sessionStorage.setItem("bb-intro","1");if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.intro="1"}}}catch(e){}`;
