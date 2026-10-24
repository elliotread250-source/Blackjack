"use client";

import { useEffect, useRef, useState } from "react";
import { isFinePointer, prefersReducedMotion } from "@/lib/motion-pref";

type Mode = "dot" | "link" | "image";

/**
 * Desktop-only cursor: an orange dot that grows into a ring over links and
 * buttons and turns into a little basketball over photos. Never renders on
 * touch devices.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const outer = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("dot");
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!isFinePointer()) return;
    setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");
    const reduced = prefersReducedMotion();
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0, visible = false;

    const tick = () => {
      cx += (x - cx) * (reduced ? 1 : 0.28);
      cy += (y - cy) * (reduced ? 1 : 0.28);
      if (outer.current) outer.current.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!visible && outer.current) {
        visible = true;
        cx = x;
        cy = y;
        outer.current.style.opacity = "1";
      }
      const t = e.target as Element | null;
      const next: Mode = t?.closest("a, button, [role='button'], summary, label, select")
        ? "link"
        : t?.closest("img, [data-cursor='image']")
          ? "image"
          : "dot";
      setMode((m) => (m === next ? m : next));
    };
    const leave = () => {
      visible = false;
      if (outer.current) outer.current.style.opacity = "0";
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const scale = mode === "link" ? 3.4 : mode === "image" ? 3.6 : 1;
  return (
    <div
      ref={outer}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90] opacity-0 transition-opacity duration-200"
    >
      <div
        className="-ml-[6px] -mt-[6px] h-3 w-3 rounded-full transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{
          transform: `scale(${pressed ? scale * 0.8 : scale})`,
          background: mode === "dot" ? "var(--color-orange)" : "transparent",
          border: mode === "link" ? "1px solid var(--color-orange)" : "0 solid transparent",
        }}
      >
        {mode === "image" && (
          <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="#e8673c" />
            <path d="M1 12h22M12 1v22M4.2 4.2c3.6 3.4 3.6 12.2 0 15.6M19.8 4.2c-3.6 3.4-3.6 12.2 0 15.6" stroke="#0e0d0f" strokeWidth="1.1" fill="none" />
          </svg>
        )}
      </div>
    </div>
  );
}
