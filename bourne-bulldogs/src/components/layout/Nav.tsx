"use client";

import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TLink } from "@/components/fx/Transition";
import { Magnetic } from "@/components/fx/Magnetic";
import { club, nav } from "@/content/site";
import type { SiteImage } from "@/content/images";
import { lockScroll } from "@/lib/lenis-store";
import { cn } from "@/lib/cn";

/**
 * Transparent over the hero, solid ink with blur once you scroll. Hides on
 * the way down, comes back on the way up. Full-screen menu on mobile.
 */
export function Nav({ logo, logoLight }: { logo: SiteImage; logoLight: SiteImage }) {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      if (Math.abs(y - last.current) > 6) {
        setHidden(y > last.current && y > 240);
        last.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] text-bone transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)]",
          // Over the dark hero it's a dark band; once solid it sits on the white pages.
          !solid && !open && "theme-dark",
          solid && !open ? "border-b border-bone/10 bg-ink/85 backdrop-blur-md" : "border-b border-transparent",
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <nav aria-label="Main" className="container-x flex h-[72px] items-center justify-between gap-6 md:h-20">
          <TLink href="/" className="relative z-[2] flex items-center gap-3" aria-label={`${club.shortName} home`}>
            <Image src={logo.src} alt="" width={56} height={56} loading="eager" className="logo-for-dark h-12 w-12 md:h-14 md:w-14" />
            <Image src={logoLight.src} alt="" width={56} height={56} loading="eager" className="logo-for-light h-12 w-12 md:h-14 md:w-14" />
            <span className="display hidden text-xl leading-none tracking-wide sm:block">
              Bourne <span className="text-orange">Bulldogs</span>
            </span>
          </TLink>

          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <TLink
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative px-3 py-2 text-[0.82rem] font-bold uppercase tracking-[0.14em] transition-colors",
                      active ? "text-orange" : "text-bone/85 hover:text-bone"
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-[2px] origin-left bg-orange transition-transform duration-300",
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </TLink>
                </li>
              );
            })}
          </ul>

          <div className="relative z-[2] flex items-center gap-3">
            <Magnetic className="hidden sm:inline-block">
              <TLink
                href="/join"
                className="inline-flex min-h-11 items-center rounded-[8px] bg-bone px-5 text-[0.82rem] font-bold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-orange-deep hover:text-black"
              >
                Join
              </TLink>
            </Magnetic>
            <button
              type="button"
              className="relative grid h-12 w-12 place-items-center rounded-[8px] border border-bone/20 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              <span aria-hidden className="relative block h-4 w-6">
                <span className={cn("absolute left-0 top-0 h-[2px] w-6 bg-bone transition-transform duration-300", open && "translate-y-[7px] rotate-45")} />
                <span className={cn("absolute left-0 top-[7px] h-[2px] w-6 bg-bone transition-opacity duration-200", open && "opacity-0")} />
                <span className={cn("absolute left-0 top-[14px] h-[2px] w-6 bg-bone transition-transform duration-300", open && "-translate-y-[7px] -rotate-45")} />
              </span>
            </button>
          </div>
        </nav>
      </header>
      <AnimatePresence>{open && <MobileMenu pathname={pathname} onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}

function MobileMenu({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lockScroll(true);
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !ref.current) return;
      // Trap focus in the menu plus the close toggle, in tab order (toggle
      // sits in the header, before the menu in the DOM).
      const toggle = document.querySelector<HTMLElement>("[aria-controls='mobile-menu']");
      const items = [...(toggle ? [toggle] : []), ...ref.current.querySelectorAll<HTMLElement>("a, button")];
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      lockScroll(false);
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  const links = [...nav, { href: "/join", label: "Join the pack" }];
  return (
    <m.div
      id="mobile-menu"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-ink px-4 pb-10 pt-28 lg:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      <m.div aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left bg-orange" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
      <ul className="flex flex-col gap-1">
        {links.map((item, i) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="overflow-hidden">
              <m.div initial={{ y: "110%" }} animate={{ y: 0 }} transition={{ duration: 0.6, delay: 0.08 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                <TLink
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn("display flex items-baseline gap-4 py-1 text-[15vw] leading-[0.95] sm:text-7xl", active ? "text-orange" : "text-bone", item.href === "/join" && "text-orange")}
                >
                  <span className="font-sans text-sm font-bold tracking-[0.2em] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  {item.label}
                </TLink>
              </m.div>
            </li>
          );
        })}
      </ul>
      <m.div className="mt-auto pt-10 text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p className="eyebrow mb-2 text-orange">Every Saturday</p>
        <p>{club.venue.full}</p>
        <p className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <a href={club.phoneHref} className="text-bone underline decoration-orange underline-offset-4">{club.phoneDisplay}</a>
          <a href={`mailto:${club.email}`} className="text-bone underline decoration-orange underline-offset-4">{club.email}</a>
        </p>
      </m.div>
    </m.div>
  );
}
