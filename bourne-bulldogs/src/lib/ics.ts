import { club, type Session } from "@/content/site";

/** Next Saturday (or today if it's Saturday) as YYYYMMDD, in UK local date. */
function nextSaturday(from = new Date()) {
  const d = new Date(from);
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + ((6 - day + 7) % 7));
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
}

const hm = (t: string) => t.replace(":", "") + "00";

/** Fold long lines at 75 octets as RFC 5545 asks. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** A weekly recurring Saturday event, pinned to UK time so BST is handled. */
export function buildIcs(session: Session, now = new Date()) {
  const date = nextSaturday(now);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bourne Bulldogs Basketball Club//Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/London",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0000",
    "TZOFFSETTO:+0100",
    "TZNAME:BST",
    "DTSTART:19700329T010000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0000",
    "TZNAME:GMT",
    "DTSTART:19701025T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${session.id}-weekly@bournebulldogs.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/London:${date}T${hm(session.start)}`,
    `DTEND;TZID=Europe/London:${date}T${hm(session.end)}`,
    "RRULE:FREQ=WEEKLY;BYDAY=SA",
    `SUMMARY:${esc(`Bourne Bulldogs basketball: ${session.label}`)}`,
    `LOCATION:${esc(club.venue.full)}`,
    `DESCRIPTION:${esc(`${session.label}, ${session.startDisplay} to ${session.endDisplay}. Questions? ${club.email} or ${club.phoneDisplay}.`)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Basketball training",
    "TRIGGER:-PT60M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
