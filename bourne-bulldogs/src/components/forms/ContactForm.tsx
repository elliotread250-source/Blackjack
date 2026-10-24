"use client";

import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { Honeypot, SelectField, TextArea, TextField } from "./Field";
import { SwishSuccess } from "./SwishSuccess";
import { Button } from "@/components/ui/Button";
import { contact, club } from "@/content/site";
import { contactSchema, fieldErrors, enquiryValues } from "@/lib/schemas";

type Enquiry = (typeof enquiryValues)[number];
type State = "idle" | "sending" | "done";

const empty = { name: "", email: "", phone: "", childAge: "", message: "", company: "" };

export function ContactForm({ defaultEnquiry = "general", submitLabel = "Send message", lockEnquiry = false }: { defaultEnquiry?: Enquiry; submitLabel?: string; lockEnquiry?: boolean }) {
  const [v, setV] = useState({ ...empty, enquiry: defaultEnquiry as Enquiry });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>("idle");
  const [formError, setFormError] = useState("");

  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }));
    if (errors[k]) setErrors((e) => Object.fromEntries(Object.entries(e).filter(([key]) => key !== k)));
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const parsed = contactSchema.safeParse(v);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error || `Something went wrong. Please email ${club.email} or call ${club.phoneDisplay}.`);
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setFormError(`We couldn't reach the server. Please email ${club.email} or call ${club.phoneDisplay}.`);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <SwishSuccess
        title={contact.success}
        body={v.enquiry === "join" ? "We'll reply with everything you need to get your child on court." : undefined}
        onReset={() => {
          setV({ ...empty, enquiry: defaultEnquiry });
          setState("idle");
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative grid gap-6 sm:grid-cols-2" aria-describedby={formError ? "form-error" : undefined}>
      <Honeypot value={v.company} onChange={(c) => setV((s) => ({ ...s, company: c }))} />
      <TextField label={v.enquiry === "join" ? "Parent or guardian name" : "Your name"} name="name" autoComplete="name" required value={v.name} onChange={set("name")} error={errors.name} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required value={v.email} onChange={set("email")} error={errors.email} />
      <TextField label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={v.phone} onChange={set("phone")} error={errors.phone} />
      {lockEnquiry ? (
        <input type="hidden" name="enquiry" value={v.enquiry} />
      ) : (
        <SelectField label="What's it about?" name="enquiry" required value={v.enquiry} onChange={set("enquiry")} error={errors.enquiry}>
          {contact.enquiryTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </SelectField>
      )}
      <AnimatePresence initial={false}>
        {v.enquiry === "join" && (
          <m.div key="age" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={lockEnquiry ? "" : "sm:col-span-2"}>
            <SelectField label="Child's age" name="childAge" required value={v.childAge} onChange={set("childAge")} error={errors.childAge} hint="Sessions are for ages 8 to 16.">
              <option value="">Choose age</option>
              {Array.from({ length: 9 }, (_, i) => i + 8).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </SelectField>
          </m.div>
        )}
      </AnimatePresence>
      <TextArea
        label="Message"
        name="message"
        required
        className="sm:col-span-2"
        value={v.message}
        onChange={set("message")}
        error={errors.message}
        placeholder={v.enquiry === "join" ? "Tell us a little about your child: have they played before? Anything we should know?" : "How can we help?"}
      />
      {formError && (
        <p id="form-error" role="alert" className="rounded-[8px] border-2 border-red-bright/60 bg-red/10 p-4 text-bone sm:col-span-2">
          {formError}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending..." : submitLabel}
        </Button>
        <p className="text-sm text-muted">We only use your details to reply to you.</p>
      </div>
    </form>
  );
}
