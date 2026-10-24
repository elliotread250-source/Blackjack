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

export { gsap, ScrollTrigger, useGSAP };
