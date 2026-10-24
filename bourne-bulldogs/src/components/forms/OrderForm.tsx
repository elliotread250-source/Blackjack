"use client";

import { useMemo, useState } from "react";
import { Honeypot, SelectField, TextArea, TextField } from "./Field";
import { JerseyPreview } from "./JerseyPreview";
import { SwishSuccess } from "./SwishSuccess";
import { Button } from "@/components/ui/Button";
import { club, merch, type ProductId } from "@/content/site";
import { fieldErrors, orderSchema } from "@/lib/schemas";

const blank = { parentName: "", email: "", phone: "", size: "", quantity: "1", surname: "", number: "", notes: "", company: "" };

export function OrderForm() {
  const [v, setV] = useState({ ...blank, product: "kids-tee" as ProductId, supporter: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");
  const product = useMemo(() => merch.products.find((p) => p.id === v.product)!, [v.product]);

  const update = (patch: Partial<typeof v>) => {
    setV((s) => ({ ...s, ...patch }));
    const keys = Object.keys(patch);
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsed = orderSchema.safeParse(v);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setFormError(data.error || `Something went wrong. Please email ${club.email} or call ${club.phoneDisplay}.`);
        return;
      }
      setDone(true);
    } catch {
      setFormError(`We couldn't reach the server. Please email ${club.email} or call ${club.phoneDisplay}.`);
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <SwishSuccess
        title={merch.form.success}
        body="No payment has been taken. Check your inbox for a copy of your order."
        resetLabel="Order something else"
        onReset={() => {
          setV({ ...blank, product: v.product, supporter: false });
          setDone(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={submit} noValidate className="relative grid gap-10 lg:grid-cols-12" aria-describedby={formError ? "order-error" : undefined}>
      <Honeypot value={v.company} onChange={(c) => update({ company: c })} />

      <div className="order-2 grid gap-6 sm:grid-cols-2 lg:order-1 lg:col-span-7">
        <fieldset className="contents">
          <legend className="sr-only">Your details</legend>
          <TextField label="Parent or guardian name" name="parentName" autoComplete="name" required value={v.parentName} onChange={(e) => update({ parentName: e.target.value })} error={errors.parentName} className="sm:col-span-2" />
          <TextField label="Email" name="email" type="email" autoComplete="email" required value={v.email} onChange={(e) => update({ email: e.target.value })} error={errors.email} />
          <TextField label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required value={v.phone} onChange={(e) => update({ phone: e.target.value })} error={errors.phone} />
        </fieldset>

        <fieldset className="contents">
          <legend className="sr-only">What you&apos;re ordering</legend>
          <SelectField
            label="Product"
            name="product"
            required
            value={v.product}
            onChange={(e) => update({ product: e.target.value as ProductId, size: "" })}
            error={errors.product}
            className="sm:col-span-2"
          >
            {merch.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - £{p.price}
              </option>
            ))}
          </SelectField>
          <SelectField label="Size" name="size" required value={v.size} onChange={(e) => update({ size: e.target.value })} error={errors.size} hint={product.sizeNote}>
            <option value="">Choose a {product.audience === "kids" ? "kids" : "adult"} size</option>
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
          <TextField label="Quantity" name="quantity" type="number" min={1} max={10} inputMode="numeric" required value={v.quantity} onChange={(e) => update({ quantity: e.target.value })} error={errors.quantity} />
        </fieldset>

        <fieldset className="grid gap-6 rounded-[10px] border-2 border-bone/10 p-5 sm:col-span-2 sm:grid-cols-2">
          <legend className="eyebrow px-2 text-orange">Personalisation</legend>
          <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              name="supporter"
              checked={v.supporter}
              onChange={(e) => update({ supporter: e.target.checked, ...(e.target.checked ? { surname: "", number: "" } : {}) })}
              className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-orange)]"
            />
            <span>
              <span className="font-bold">I&apos;m a supporter (no name or number)</span>
              <span className="block text-sm text-muted">Supporters are welcome to buy player tops but can&apos;t have a name and number.</span>
            </span>
          </label>
          <TextField
            label="Player surname"
            name="surname"
            maxLength={12}
            autoComplete="family-name"
            disabled={v.supporter}
            value={v.surname}
            onChange={(e) => update({ surname: e.target.value.toUpperCase().replace(/[^A-Z' -]/g, "") })}
            error={errors.surname}
            hint={`${12 - v.surname.length} characters left`}
            className="[&_input]:uppercase"
          />
          <TextField
            label="Shirt number"
            name="number"
            inputMode="numeric"
            maxLength={2}
            placeholder="00 to 99"
            disabled={v.supporter}
            value={v.number}
            onChange={(e) => update({ number: e.target.value.replace(/\D/g, "").slice(0, 2) })}
            error={errors.number}
            hint="Subject to availability"
          />
        </fieldset>

        <TextArea label="Notes" name="notes" value={v.notes} onChange={(e) => update({ notes: e.target.value })} error={errors.notes} className="sm:col-span-2" placeholder="Anything else? e.g. a second item in a different size" />

        {formError && (
          <p id="order-error" role="alert" className="rounded-[8px] border-2 border-red-bright/60 bg-red/10 p-4 sm:col-span-2">
            {formError}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:gap-5">
          <Button type="submit" disabled={sending}>
            {sending ? "Sending order..." : "Send order"}
          </Button>
          <p className="text-sm text-muted">{merch.howToOrder.noPayment} We&apos;ll contact you to confirm and arrange payment.</p>
        </div>
      </div>

      <aside aria-label={merch.form.previewHeading} className="order-1 lg:order-2 lg:col-span-5">
        <div className="rounded-[12px] border-2 border-bone/10 bg-[radial-gradient(circle_at_50%_30%,#2a282d,#121114)] p-6 lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow text-orange">{merch.form.previewHeading}</p>
            <p className="display text-3xl text-orange" aria-live="polite">
              £{product.price * Math.max(1, Number(v.quantity) || 1)}
            </p>
          </div>
          <div className="mx-auto mt-4 max-w-sm" aria-live="polite">
            <JerseyPreview product={product} surname={v.surname} number={v.number} supporter={v.supporter} />
          </div>
          <p className="mt-4 text-center text-sm text-muted">{v.supporter ? "Supporter tops have a plain back." : merch.form.previewHint}</p>
        </div>
      </aside>
    </form>
  );
}
