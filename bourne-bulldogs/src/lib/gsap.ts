"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { onLenis } from "./lenis-store";

// Only client components that animate on scroll import this module, so GSAP
// never lands in the shared bundle.
gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);

let synced = false;
if (typeof window !== "undefined" && !synced) {
  synced = true;
  onLenis((lenis) => {
    lenis?.on("scroll", ScrollTrigger.update);
  });
}

/**
 * Like useGSAP, but builds the animations once the browser is idle, so
 * creating ScrollTriggers (which measure layout) doesn't stretch the
 * hydration task. Everything is reverted on unmount.
 */
export function useIdleGSAP(fn: () => void | (() => void), scope: React.RefObject<Element | null>) {
  useGSAP(() => {
    let ctx: gsap.Context | undefined;
    let cleanup: void | (() => void);
    const run = () => {
      ctx = gsap.context(() => {
        cleanup = fn();
      }, scope.current ?? undefined);
      ScrollTrigger.refresh();
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(run, { timeout: 1200 }) : window.setTimeout(run, 200);
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(id);
      else clearTimeout(id);
      if (typeof cleanup === "function") cleanup();
      ctx?.revert();
    };
  }, []);
}

export { gsap, ScrollTrigger, useGSAP };
