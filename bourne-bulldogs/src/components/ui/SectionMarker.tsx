import { cn } from "@/lib/cn";

/** Jersey-number section marker: "07 / ON COURT". */
export function SectionMarker({ n, label, className }: { n: string; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="jersey-outline text-5xl leading-none text-orange md:text-6xl" aria-hidden>
        {n}
      </span>
      <span className="h-px w-10 bg-bone/30" aria-hidden />
      <span className="eyebrow text-muted">{label}</span>
    </div>
  );
}
