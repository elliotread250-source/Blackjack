import { cn } from "@/lib/cn";

/** Jersey-number section marker: "07 / ON COURT". */
export function SectionMarker({ n, label, className, tone = "dark" }: { n: string; label: string; className?: string; tone?: "dark" | "light" }) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className={cn("jersey-outline text-5xl leading-none md:text-6xl", tone === "dark" ? "text-orange" : "text-orange-ink")} aria-hidden>
        {n}
      </span>
      <span className={cn("h-px w-10", tone === "dark" ? "bg-bone/30" : "bg-ink/30")} aria-hidden />
      <span className={cn("eyebrow", tone === "dark" ? "text-muted" : "text-muted-ink")}>{label}</span>
    </div>
  );
}
