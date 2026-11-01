"use client";

import { gsap } from "@/lib/gsap";
import { NET_RING_COUNT, netPaths, type NetRow } from "@/components/fx/Hoop";

const running = new WeakMap<Element, gsap.core.Timeline>();

/**
 * A swish through the net: a wave runs down it row by row. Each row pinches
 * in and stretches down just after the one above, the lower rows whip
 * further and sway with the ball's spin, then all of it springs back.
 * Takes the [data-net] group; the net's back half lives in the HoopBack svg
 * beside it, so both halves are found through their shared container.
 */
export function swishNet(net: Element) {
  const box = net.closest("svg")?.parentElement;
  const front = box?.querySelector("[data-net-front]");
  const back = box?.querySelector("[data-net-back]");
  if (!front || !back) return;

  running.get(net)?.kill();
  const state: NetRow[] = Array.from({ length: NET_RING_COUNT }, () => ({ p: 0, d: 0, s: 0 }));
  const draw = () => {
    const d = netPaths(state);
    front.setAttribute("d", d.front);
    back.setAttribute("d", d.back);
  };

  const tl = gsap.timeline({ onUpdate: draw, onComplete: draw });
  state.forEach((row, i) => {
    const at = i * 0.05;
    tl.to(row, { p: 1, d: 1, duration: 0.13, ease: "power2.out" }, at)
      .to(row, { p: 0, d: 0, duration: 1.1, ease: "elastic.out(1, 0.32)" }, at + 0.13);
    let t = at + 0.05;
    [1, -0.7, 0.4, -0.15, 0].forEach((s, k) => {
      const duration = k ? 0.24 : 0.16;
      tl.to(row, { s, duration, ease: "sine.inOut" }, t);
      t += duration;
    });
  });
  running.set(net, tl);
}
