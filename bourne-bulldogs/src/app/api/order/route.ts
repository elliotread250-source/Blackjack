import { orderSchema, fieldErrors } from "@/lib/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CLUB_INBOX, fallbackMessage, renderEmail, sendMail } from "@/lib/email";
import { merch } from "@/content/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = rateLimit(`order:${clientIp(req)}`);
  if (!limit.ok) {
    return Response.json({ error: "Too many orders in a short time. Please try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body && typeof body === "object" && "company" in body && (body as { company?: string }).company) {
    return Response.json({ ok: true });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Please check the form", fields: fieldErrors(parsed.error) }, { status: 422 });
  const o = parsed.data;
  const product = merch.products.find((p) => p.id === o.product)!;
  const total = product.price * o.quantity;
  const personalisation = o.supporter ? "Supporter (no name or number)" : [o.surname || "No surname", o.number ? `#${o.number}` : "no number"].join(", ");

  const rows: Array<[string, string]> = [
    ["Product", product.name],
    ["Size", o.size],
    ["Quantity", String(o.quantity)],
    ["Price", `£${product.price} each, £${total} total`],
    ["Back print", personalisation],
    ["Name", o.parentName],
    ["Email", o.email],
    ["Phone", o.phone],
    ["Notes", o.notes ?? ""],
  ];

  const toClub = renderEmail(`New merch order: ${product.short}`, rows, "Get in touch to confirm availability of the number and arrange payment. No payment has been taken.");
  const sent = await sendMail({
    to: CLUB_INBOX,
    replyTo: o.email,
    subject: `Merch order: ${o.quantity} x ${product.short} (${o.size}) from ${o.parentName}`,
    ...toClub,
  });
  if (!sent.ok) return Response.json({ error: fallbackMessage }, { status: 503 });

  // Confirmation to the customer. If it fails (e.g. sender domain not yet
  // verified in Resend) the club still has the order, so don't fail the request.
  const toCustomer = renderEmail(
    "We've got your order",
    rows.filter(([k]) => !["Name", "Email", "Phone"].includes(k)),
    `Thanks ${o.parentName.split(" ")[0]}! We'll be in touch shortly to confirm your order and arrange payment. Nothing has been charged.`
  );
  const confirm = await sendMail({ to: o.email, subject: "Your Bourne Bulldogs merch order", ...toCustomer });
  if (!confirm.ok) console.warn("[order] customer confirmation not sent:", confirm.reason);

  return Response.json({ ok: true });
}
