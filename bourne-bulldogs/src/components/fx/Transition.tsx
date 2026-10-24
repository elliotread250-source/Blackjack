"use client";

import Link, { type LinkProps } from "next/link";
import Image from "next/image";
import { useAnimate } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, forwardRef, useCallback, useContext, useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion-pref";

const Ctx = createContext<{ navigate: (href: string) => boolean }>({ navigate: () => false });

const EASE = [0.76, 0, 0.24, 1] as const;
const COVER_S = 0.22;
const REVEAL_S = 0.26;
/** Start fetching/rendering the next route this far into the cover. */
const PUSH_AT = 0.65;

/**
 * Route changes play an orange panel wipe with the badge in the middle.
 * The panel is always mounted and driven imperatively, so it moves on the
 * click itself rather than after a React render. The next route loads while
 * it slides in; it lifts once it has fully covered AND the new page is in.
 * About 220ms in, 260ms out. Back/forward and reduced motion skip it.
 */
export function TransitionProvider({ children, logoSrc }: { children: React.ReactNode; logoSrc: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const busy = useRef(false);
  const fromPath = useRef(pathname);
  const covered = useRef(false);
  const routeReady = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const maybeReveal = useCallback(() => {
    if (!busy.current || !covered.current || !routeReady.current) return;
    covered.current = false;
    clearTimers();
    const el = scope.current;
    animate(el, { x: "-100%" }, { duration: REVEAL_S, ease: EASE }).then(() => {
      el.style.visibility = "hidden";
      el.style.pointerEvents = "none";
      busy.current = false;
    });
  }, [animate, scope]);

  const navigate = useCallback(
    (href: string) => {
      if (prefersReducedMotion() || busy.current || !scope.current) return false;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) return false;
      busy.current = true;
      fromPath.current = window.location.pathname;
      covered.current = false;
      routeReady.current = false;
      const el = scope.current;
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";
      animate(el, { x: ["100%", "0%"] }, { duration: COVER_S, ease: EASE }).then(() => {
        covered.current = true;
        maybeReveal();
      });
      animate("[data-wipe-logo]", { scale: [0.6, 1], rotate: [-20, 0] }, { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] });
      timers.current.push(setTimeout(() => router.push(url.pathname + url.search + url.hash), COVER_S * PUSH_AT * 1000));
      // If the route never changes (error, slow network), don't strand the panel.
      timers.current.push(
        setTimeout(() => {
          routeReady.current = true;
          maybeReveal();
        }, 2000)
      );
      return true;
    },
    [animate, scope, router, maybeReveal]
  );

  useEffect(() => {
    if (busy.current && pathname !== fromPath.current) {
      routeReady.current = true;
      maybeReveal();
    }
  }, [pathname, maybeReveal]);

  useEffect(() => clearTimers, []);

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}
      <div
        ref={scope}
        aria-hidden
        className="pointer-events-none invisible fixed inset-0 z-[95] grid translate-x-full place-items-center bg-orange will-change-transform"
      >
        <div data-wipe-logo className="relative h-28 w-28 md:h-36 md:w-36">
          <Image src={logoSrc} alt="" fill sizes="144px" className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,.35)]" />
        </div>
      </div>
    </Ctx.Provider>
  );
}

type TLinkProps = LinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>;

/** Drop-in for next/link that plays the page wipe for internal routes. */
export const TLink = forwardRef<HTMLAnchorElement, TLinkProps>(function TLink({ onClick, href, ...rest }, ref) {
  const { navigate } = useContext(Ctx);
  return (
    <Link
      ref={ref}
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (rest.target && rest.target !== "_self") return;
        const h = typeof href === "string" ? href : href.pathname ?? "";
        if (!h.startsWith("/")) return;
        if (navigate(h)) e.preventDefault();
      }}
    />
  );
});
