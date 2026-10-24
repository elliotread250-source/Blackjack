import { Button } from "@/components/ui/Button";
import { availability, club } from "@/content/site";
import { cn } from "@/lib/cn";

function Icon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * "Contact us before coming along" notice. `full` is a prominent card with
 * buttons; `compact` is a one-line reminder for forms, contact details and
 * the footer.
 */
export function AvailabilityNotice({ variant = "full", className }: { variant?: "full" | "compact"; className?: string }) {
  if (variant === "compact") {
    return (
      <p className={cn("flex items-start gap-3 rounded-[10px] border-2 border-orange/50 px-4 py-3 text-[0.95rem] font-semibold leading-snug", className)}>
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-orange" />
        <span>{availability.short}</span>
      </p>
    );
  }
  return (
    <aside
      aria-labelledby="availability-heading"
      className={cn("theme-dark relative overflow-hidden rounded-[12px] border-l-[6px] border-orange-deep bg-ink p-6 text-bone sm:p-8", className)}
    >
      <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <Icon className="h-12 w-12 text-orange" />
        <div>
          <h3 id="availability-heading" className="display text-4xl leading-none md:text-5xl">
            {availability.heading}
          </h3>
          <p className="mt-3 max-w-2xl text-bone/90">{availability.body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/join" magnetic={false}>
            {availability.cta}
          </Button>
          <Button href={club.phoneHref} variant="secondary" magnetic={false} aria-label={`Call ${club.phoneDisplay}`}>
            {club.phoneDisplay}
          </Button>
        </div>
      </div>
    </aside>
  );
}
