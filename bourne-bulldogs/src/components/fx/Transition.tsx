"use client";

import Link, { type LinkProps } from "next/link";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { createContext, forwardRef, useCallback, useContext, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion-pref";

type Phase = "idle" | "cover" | "reveal";
const Ctx = createContext<{ navigate: (href: string) => boolean }>({ navigate: () => false });

const EASE = [0.76, 0, 0.24, 1] as const;
const COVER_S = 0.3;
const REVEAL_S = 0.34;

/**
 * Route changes play an orange panel wipe with the badge in the middle:
 * cover (300ms) -> swap page -> reveal (340ms). Under 700ms end to end.
 * Back/forward and reduced motion skip it.
 */
export function TransitionProvider({ children, logoSrc }: { children: React.ReactNode; logoSrc: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const target = useRef<string | null>(null);
  const fromPath = useRef(pathname);
  const safety = useRef<ReturnType<typeof setTimeout>>(undefined);

  const navigate = useCallback(
    (href: string) => {
      if (prefersReducedMotion() || phase !== "idle") return false;
      const url = new URL(href, window.location.href);
      if (url.pathname === window.location.pathname) return false;
      target.current = url.pathname + url.search + url.hash;
      fromPath.current = window.location.pathname;
      setPhase("cover");
      return true;
    },
    [phase]
  );

  // Once the new route has rendered, lift the panel.
  useEffect(() => {
    if (phase === "cover" && target.current === null && pathname !== fromPath.current) {
      clearTimeout(safety.current);
      requestAnimationFrame(() => setPhase("reveal"));
    }
  }, [pathname, phase]);

  const onCovered = () => {
    if (phase !== "cover" || !target.current) return;
    const href = target.current;
    target.current = null;
    router.push(href);
    // If the route never changes (error, same page), don't strand the panel.
    safety.current = setTimeout(() => setPhase("reveal"), 1500);
  };

  return (
    <Ctx.Provider value={{ navigate }}>
      {children}
      <AnimatePresence>
        {phase !== "idle" && (
          <m.div
            key="wipe"
            aria-hidden
            className="pointer-events-auto fixed inset-0 z-[95] grid place-items-center bg-orange"
            initial={{ x: "100%" }}
            animate={phase === "cover" ? { x: "0%" } : { x: "-100%" }}
            transition={{ duration: phase === "cover" ? COVER_S : REVEAL_S, ease: EASE }}
            onAnimationComplete={() => {
              if (phase === "cover") onCovered();
              else setPhase("idle");
            }}
          >
            <m.div
              initial={{ scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              className="relative h-28 w-28 md:h-36 md:w-36"
            >
              <Image src={logoSrc} alt="" fill sizes="144px" className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,.35)]" />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
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
