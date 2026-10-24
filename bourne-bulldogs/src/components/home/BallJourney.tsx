"use client";

import { useRef } from "react";
import { Basketball } from "@/components/fx/Basketball";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion-pref";

/**
 * The signature moment: the hero basketball drops down the page on a curved
 * path as you scroll and swishes through the hoop in the training section.
 *
 * Children mark the route with data attributes:
 *   [data-ball-start]  box in the hero where the ball sits at rest
 *   [data-ball-hoop]   the hoop graphic (rim sits 124/220 down its height)
 *   [data-net]         the net group, which kicks when the ball goes through
 * The ball lives in this wrapper's stacking context, between the hoop's back
 * and front layers, so it really passes through the rim.
 */
export function BallJourney({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const b = ball.current!;
      const start = el.querySelector<HTMLElement>("[data-ball-start]");
      const hoop = el.querySelector<HTMLElement>("[data-ball-hoop]");
      const net = el.querySelector<SVGElement>("[data-net]");
      if (!start || !hoop) return;

      const rel = (node: Element) => {
        const r = node.getBoundingClientRect();
        const o = el.getBoundingClientRect();
        return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
      };

      const place = () => {
        const s = rel(start);
        gsap.set(b, { width: s.w, height: s.w, x: s.x, y: s.y + (s.h - s.w) / 2, scale: 1, rotation: 0, opacity: 1 });
        return s;
      };

      if (prefersReducedMotion()) {
        place();
        return;
      }

      let tl: gsap.core.Timeline | undefined;
      let swished = false;

      const build = () => {
        tl?.scrollTrigger?.kill();
        tl?.kill();
        const s = place();
        const h = rel(hoop);
        const W = el.clientWidth;
        const size = s.w;
        // Rim centre, and a ball that fits inside it with a little room.
        const rimX = h.x + h.w / 2;
        const rimY = h.y + (h.h * 124) / 220;
        const endSize = h.w * 0.4;
        const scale = endSize / size;
        const sx = s.x + size / 2, sy = s.y + s.h / 2;
        const dy = rimY - sy;
        const mobile = W < 768;
        // Ball-centre waypoints; GSAP wants the unscaled box's top-left.
        const centres = mobile
          ? [
              [sx, sy],
              [W * 0.24, sy + dy * 0.4],
              [W * 0.7, sy + dy * 0.76],
              [rimX, rimY - endSize * 2],
              [rimX, rimY - endSize * 0.35],
            ]
          : [
              [sx, sy],
              [W * 0.2, sy + dy * 0.32],
              [W * 0.78, sy + dy * 0.64],
              [rimX - h.w * 0.6, rimY - endSize * 2.6],
              [rimX, rimY - endSize * 1.2],
              [rimX, rimY - endSize * 0.35],
            ];
        const path = centres.map(([x, y]) => ({ x: x - size / 2, y: y - size / 2 }));

        tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            endTrigger: hoop,
            end: mobile ? "center 42%" : "center 46%",
            scrub: 0.7,
            onUpdate(self) {
              if (!net) return;
              if (self.progress > 0.93 && self.direction > 0 && !swished) {
                swished = true;
                gsap.fromTo(net, { scaleY: 1, skewX: 0 }, { scaleY: 1.22, skewX: 4, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out" });
              }
              if (self.progress < 0.85) swished = false;
            },
          },
        });
        tl.to(b, { motionPath: { path, curviness: 1.25 }, scale, rotation: 960, duration: 0.88 })
          .to(b, { y: rimY + h.h * 0.32 - size / 2, rotation: "+=50", duration: 0.09, ease: "power1.in" })
          .to(b, { opacity: 0, duration: 0.03 });
      };

      build();
      let t: ReturnType<typeof setTimeout>;
      const rebuild = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          build();
          ScrollTrigger.refresh();
        }, 150);
      };
      const ro = new ResizeObserver(rebuild);
      ro.observe(el);
      document.fonts?.ready.then(rebuild);
      return () => {
        clearTimeout(t);
        ro.disconnect();
        tl?.scrollTrigger?.kill();
        tl?.kill();
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative">
      {children}
      <div ref={ball} aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 h-20 w-20 will-change-transform" style={{ transformOrigin: "50% 50%" }}>
        <div className="float h-full w-full">
          <Basketball className="h-full w-full drop-shadow-[0_18px_30px_rgba(0,0,0,.45)]" id="hero-ball" />
        </div>
      </div>
    </div>
  );
}
