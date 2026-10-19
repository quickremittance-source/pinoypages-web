import { abs, type CalEvent } from "@/lib/guide";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Fold long lines at 74 octets-ish (RFC 5545 §3.1). */
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");
const ymd = (d: string) => d.replace(/-/g, "");
const hm = (t: string) => t.replace(":", "") + "00";
const nextDay = (d: string) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
};

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Toronto",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:-0500",
  "TZOFFSETTO:-0400",
  "TZNAME:EDT",
  "DTSTART:19700308T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:-0400",
  "TZOFFSETTO:-0500",
  "TZNAME:EST",
  "DTSTART:19701101T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

/** One-event iCalendar file (Toronto time; all-day for deadlines). No personal data. */
export function eventIcs(e: CalEvent, stamp = "20261019T120000Z") {
  const when =
    e.start && e.end
      ? [
          `DTSTART;TZID=America/Toronto:${ymd(e.date)}T${hm(e.start)}`,
          `DTEND;TZID=America/Toronto:${ymd(e.date)}T${hm(e.end)}`,
        ]
      : [`DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(nextDay(e.date))}`];
  const desc = [
    e.sample ? "SAMPLE event (fictional)." : "",
    e.description ?? "",
    `Host: ${e.organizer} (${e.contact})`,
    abs(`/calendar/${e.id}`),
  ]
    .filter(Boolean)
    .join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pinoy Pages//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...(e.start ? VTIMEZONE : []),
    "BEGIN:VEVENT",
    `UID:${e.id}@pinoypages.ca`,
    `DTSTAMP:${stamp}`,
    ...when,
    `SUMMARY:${esc((e.sample ? "SAMPLE: " : "") + e.name.replace(/^SAMPLE:\s*/, ""))}`,
    `LOCATION:${esc([e.venue ?? e.place, e.address, e.city ? `${e.city}, ON` : ""].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc(desc)}`,
    `URL:${abs(`/calendar/${e.id}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
