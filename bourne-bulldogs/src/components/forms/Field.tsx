import { cn } from "@/lib/cn";

const base =
  "mt-2 block w-full rounded-[8px] border-2 bg-ink/60 px-4 py-3 text-base text-bone placeholder:text-muted/70 transition-colors focus:border-orange focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

type Shared = { label: string; name: string; error?: string; hint?: string; required?: boolean; className?: string };

function Wrap({ label, name, error, hint, required, className, children }: Shared & { children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="eyebrow block text-[0.72rem] text-bone/85">
        {label}
        {required ? <span className="text-orange"> *</span> : <span className="ml-2 normal-case tracking-normal text-muted">(optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${name}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm font-semibold text-red-bright" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describedBy = (name: string, error?: string, hint?: string) => (error ? `${name}-error` : hint ? `${name}-hint` : undefined);

export function TextField({ label, name, error, hint, required, className, ...rest }: Shared & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap {...{ label, name, error, hint, required, className }}>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className={cn(base, error ? "border-red-bright" : "border-bone/15")}
        {...rest}
      />
    </Wrap>
  );
}

export function SelectField({ label, name, error, hint, required, className, children, ...rest }: Shared & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrap {...{ label, name, error, hint, required, className }}>
      <div className="relative">
        <select
          id={name}
          name={name}
          required={required}
          aria-invalid={!!error}
          aria-describedby={describedBy(name, error, hint)}
          className={cn(base, "appearance-none pr-10", error ? "border-red-bright" : "border-bone/15")}
          {...rest}
        >
          {children}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-orange" aria-hidden>
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" />
        </svg>
      </div>
    </Wrap>
  );
}

export function TextArea({ label, name, error, hint, required, className, ...rest }: Shared & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap {...{ label, name, error, hint, required, className }}>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error}
        aria-describedby={describedBy(name, error, hint)}
        className={cn(base, "min-h-36 resize-y", error ? "border-red-bright" : "border-bone/15")}
        {...rest}
      />
    </Wrap>
  );
}

/** Off-screen honeypot. Bots fill every field; people never see this one. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="company">Company</label>
      <input id="company" name="company" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
