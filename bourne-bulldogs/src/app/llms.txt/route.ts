import { availability, club, home, merch, safety, seo, sessions, training } from "@/content/site";
import { SITE_URL } from "@/lib/site-url";

// /llms.txt: a plain map of the site for AI assistants, in the llmstxt.org layout. Every fact
// comes from src/content/site.ts, so it changes when the site's words change.
export const dynamic = "force-static";

const page = (path: string, title: string, description: string) => `- [${title}](${SITE_URL}${path}): ${description}`;

export function GET() {
  const times = sessions.map((s) => `${s.label} ${s.startDisplay}pm to ${s.endDisplay}`).join(", ");
  const kit = merch.products.map((p) => `${p.short} £${p.price}`).join(", ");
  const body = `# ${club.name}

> ${seo.home.description}

- Who it's for: young players, ${club.ages}. Complete beginners to experienced players are welcome.
- When: Saturdays in term time. ${times}. Each session is 1.5 hours.
- Where: ${club.venue.full}
- Before coming: ${availability.short}
- What a session is: ${training.summary}
- Head coach: ${home.coach.name}. ${home.coach.credentials.join(", ")}.
- Safety: ${safety.points.slice(0, 5).join(". ")}.
- The club started in ${club.foundedYear} and is registered with Basketball England.
- Contact: ${club.email}, ${club.phoneDisplay}, or the form at ${SITE_URL}/contact

## Pages

${page("", "Home", seo.home.description)}
${page("/join", seo.join.title, seo.join.description)}
${page("/club-overview", seo.overview.title, seo.overview.description)}
${page("/about", seo.about.title, seo.about.description)}
${page("/contact", seo.contact.title, seo.contact.description)}

## Optional

${page("/merch", seo.merch.title, `${seo.merch.description} ${kit}. ${merch.howToOrder.noPayment}`)}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
