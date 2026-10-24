import { sessions } from "@/content/site";
import { buildIcs } from "@/lib/ics";

export const dynamic = "force-static";
export const revalidate = 86400;

export function generateStaticParams() {
  return sessions.map((s) => ({ session: `${s.id}.ics` }));
}

/** Weekly recurring Saturday event for one training session. */
export async function GET(_req: Request, { params }: { params: Promise<{ session: string }> }) {
  const { session } = await params;
  const s = sessions.find((x) => `${x.id}.ics` === session);
  if (!s) return new Response("Not found", { status: 404 });
  return new Response(buildIcs(s), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bourne-bulldogs-${s.id}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
