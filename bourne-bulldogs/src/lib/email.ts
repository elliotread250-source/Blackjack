import "server-only";
import { Resend } from "resend";
import { club } from "@/content/site";

export type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult = { ok: true; dev?: boolean } | { ok: false; reason: "no-key" | "send-failed"; detail?: string };

const FROM = process.env.CONTACT_FROM_EMAIL || "Bourne Bulldogs <onboarding@resend.dev>";
export const CLUB_INBOX = process.env.CONTACT_TO_EMAIL || club.email;

/**
 * Sends through Resend. With no API key: in development it logs the email and
 * reports success so forms can be built and tested; in production it fails
 * so the form can show the email and phone number instead.
 */
export async function sendMail(mail: Mail): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev] RESEND_API_KEY not set, would have sent:\n", JSON.stringify({ from: FROM, ...mail, html: undefined }, null, 2));
      return { ok: true, dev: true };
    }
    console.error("[email] RESEND_API_KEY is not set; email not sent:", mail.subject);
    return { ok: false, reason: "no-key" };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: FROM,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, reason: "send-failed", detail: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { ok: false, reason: "send-failed", detail: String(err) };
  }
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A plain, dependable email layout: a table of fields plus an optional note. */
export function renderEmail(title: string, rows: Array<[string, string]>, intro?: string) {
  const body = rows
    .filter(([, v]) => v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#5c574f;font:600 13px/1.4 Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#0e0d0f;font:15px/1.5 Arial,sans-serif;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  const html = `<!doctype html><html><body style="margin:0;background:#f2ece1;padding:24px">
<table role="presentation" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
<tr><td style="background:#0e0d0f;padding:20px 24px;color:#f2ece1;font:700 20px/1.2 Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(title)}<div style="height:4px;width:56px;background:#e8673c;margin-top:12px"></div></td></tr>
${intro ? `<tr><td style="padding:20px 24px 4px;color:#0e0d0f;font:15px/1.6 Arial,sans-serif">${escapeHtml(intro)}</td></tr>` : ""}
<tr><td style="padding:12px 12px 20px"><table role="presentation" width="100%" style="border-collapse:collapse">${body}</table></td></tr>
<tr><td style="padding:16px 24px;background:#f7f4ee;color:#5c574f;font:13px/1.5 Arial,sans-serif">${escapeHtml(club.name)} · ${escapeHtml(club.venue.full)} · ${escapeHtml(club.phoneDisplay)}</td></tr>
</table></body></html>`;
  const text = [title, intro, "", ...rows.filter(([, v]) => v !== "").map(([k, v]) => `${k}: ${v}`), "", `${club.name}, ${club.venue.full}, ${club.phoneDisplay}`]
    .filter((l) => l !== undefined)
    .join("\n");
  return { html, text };
}

export const fallbackMessage = `Sorry, our form isn't working right now. Please email ${club.email} or call ${club.phoneDisplay} and we'll sort it.`;
