"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { SiteImage } from "@/content/images";
import { lockScroll } from "@/lib/lenis-store";

const Ctx = createContext<(images: SiteImage[], index: number, trigger?: HTMLElement | null) => void>(() => {});
export const useLightbox = () => useContext(Ctx);

/**
 * Native <dialog> lightbox: focus is trapped by the browser, Esc closes,
 * arrow keys and swipes move between photos, focus returns to the thumbnail.
 */
export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [images, setImages] = useState<SiteImage[]>([]);
  const [index, setIndex] = useState(0);
  const trigger = useRef<HTMLElement | null>(null);
  const touch = useRef<number | null>(null);

  const open = useCallback((imgs: SiteImage[], i: number, t?: HTMLElement | null) => {
    setImages(imgs);
    setIndex(i);
    trigger.current = t ?? (document.activeElement as HTMLElement);
    dialog.current?.showModal();
    lockScroll(true);
  }, []);

  const close = useCallback(() => dialog.current?.close(), []);
  const step = useCallback((d: number) => setIndex((i) => (images.length ? (i + d + images.length) % images.length : 0)), [images.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onClose = () => {
      lockScroll(false);
      trigger.current?.focus();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    el.addEventListener("close", onClose);
    el.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("close", onClose);
      el.removeEventListener("keydown", onKey);
    };
  }, [step]);

  const current = images[index];

  return (
    <Ctx.Provider value={open}>
      {children}
      <dialog
        ref={dialog}
        aria-label="Photo viewer"
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none bg-transparent p-0"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onPointerDown={(e) => (touch.current = e.clientX)}
        onPointerUp={(e) => {
          if (touch.current === null) return;
          const dx = e.clientX - touch.current;
          touch.current = null;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
        }}
      >
        {current && (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-bone md:px-8">
              <p className="display text-2xl" aria-live="polite">
                {String(index + 1).padStart(2, "0")}
                <span className="text-muted"> / {String(images.length).padStart(2, "0")}</span>
              </p>
              <button type="button" onClick={close} className="grid h-12 w-12 place-items-center rounded-[8px] border border-bone/25 hover:border-orange" aria-label="Close photo viewer" autoFocus>
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.4" />
                </svg>
              </button>
            </div>
            <div className="relative mx-auto w-full flex-1 px-4 md:px-24" onClick={(e) => e.target === e.currentTarget && close()}>
              <div className="relative h-full w-full">
                <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" quality={82} className="object-contain" />
              </div>
              {images.length > 1 && (
                <>
                  <NavButton dir={-1} onClick={() => step(-1)} />
                  <NavButton dir={1} onClick={() => step(1)} />
                </>
              )}
            </div>
            <p className="mx-auto max-w-3xl px-4 py-4 text-center text-sm text-muted md:py-6">{current.alt}</p>
          </div>
        )}
      </dialog>
    </Ctx.Provider>
  );
}

function NavButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/70 text-bone ring-1 ring-bone/25 backdrop-blur hover:bg-orange hover:text-ink ${dir < 0 ? "left-2 md:left-6" : "right-2 md:right-6"}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden style={{ transform: dir < 0 ? "scaleX(-1)" : undefined }}>
        <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" />
      </svg>
    </button>
  );
}
