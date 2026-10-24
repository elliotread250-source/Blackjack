import { contactSchema, fieldErrors } from "@/lib/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { CLUB_INBOX, fallbackMessage, renderEmail, sendMail } from "@/lib/email";
import { contact } from "@/content/site";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limit = rateLimit(`contact:${clientIp(req)}`);
  if (!limit.ok) {
    return Response.json({ error: "Too many messages in a short time. Please try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  // Honeypot filled: pretend it worked so the bot moves on.
  if (body && typeof body === "object" && "company" in body && (body as { company?: string }).company) {
    return Response.json({ ok: true });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Please check the form", fields: fieldErrors(parsed.error) }, { status: 422 });
  const v = parsed.data;
  const enquiry = contact.enquiryTypes.find((e) => e.value === v.enquiry)?.label ?? v.enquiry;

  const { html, text } = renderEmail(`New enquiry: ${enquiry}`, [
    ["Name", v.name],
    ["Email", v.email],
    ["Phone", v.phone ?? ""],
    ["Enquiry", enquiry],
    ["Child's age", v.enquiry === "join" ? (v.childAge ?? "") : ""],
    ["Message", v.message],
  ]);

  const sent = await sendMail({
    to: CLUB_INBOX,
    replyTo: v.email,
    subject: `Website enquiry: ${enquiry} from ${v.name}`,
    html,
    text,
  });
  if (!sent.ok) return Response.json({ error: fallbackMessage }, { status: 503 });
  return Response.json({ ok: true });
}
