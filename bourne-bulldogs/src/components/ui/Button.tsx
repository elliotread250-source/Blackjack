import { TLink } from "@/components/fx/Transition";
import { Magnetic } from "@/components/fx/Magnetic";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "dark" | "ghost";

const styles: Record<Variant, string> = {
  primary: "bg-orange text-ink hover:bg-bone",
  secondary: "border border-bone/40 text-bone hover:border-orange hover:text-orange",
  dark: "bg-ink text-bone hover:bg-orange hover:text-ink",
  ghost: "text-bone underline decoration-orange decoration-2 underline-offset-8 hover:text-orange px-0",
};

type Common = { variant?: Variant; className?: string; children: React.ReactNode; magnetic?: boolean; icon?: React.ReactNode };

type AsLink = Common & { href: string; external?: boolean; download?: boolean | string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;
type AsButton = Common & { href?: undefined } & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

/** Chunky athletic buttons. Internal links get the page wipe; primary CTAs are magnetic. */
export function Button(props: AsLink | AsButton) {
  const { variant = "primary", className, children, magnetic = variant === "primary", icon } = props;
  const cls = cn(
    "group relative inline-flex min-h-12 items-center justify-center gap-3 rounded-[8px] px-6 py-3 font-sans text-[0.95rem] font-bold uppercase tracking-[0.12em] transition-colors duration-300 ease-[cubic-bezier(.16,1,.3,1)] disabled:cursor-not-allowed disabled:opacity-60",
    styles[variant],
    className
  );
  const inner = (
    <>
      <span>{children}</span>
      {icon ?? (variant !== "ghost" && <Arrow />)}
    </>
  );

  // Everything not consumed above goes straight onto the element.
  const strip = <T extends Common>(p: T) => {
    const rest: Record<string, unknown> = { ...p };
    for (const k of ["variant", "className", "children", "magnetic", "icon"]) delete rest[k];
    return rest;
  };

  let el: React.ReactNode;
  if (props.href !== undefined) {
    const { href, external, ...rest } = strip(props as AsLink) as Omit<AsLink, keyof Common>;
    const isInternal = href.startsWith("/") && !external && !rest.download;
    el = isInternal ? (
      <TLink href={href} className={cls} {...rest}>
        {inner}
      </TLink>
    ) : (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {inner}
      </a>
    );
  } else {
    const { type = "button", ...rest } = strip(props as AsButton) as Omit<AsButton, keyof Common>;
    el = (
      <button type={type} className={cls} {...rest}>
        {inner}
      </button>
    );
  }
  return magnetic ? <Magnetic>{el}</Magnetic> : el;
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 transition-transform duration-300 group-hover:translate-x-1", className)} aria-hidden>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}
