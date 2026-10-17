/** Per-listing analytics: aggregated counts per listing per month. No personal data (no IP, user agent, cookies). */
/** V1 events. Impressions in lists and Save-contact downloads are planned for v1.1 (see PinoyPages_Roadmap.pdf). */
export const EVENTS = ["view", "scan", "call", "map", "website", "tap"] as const;
export type EventName = (typeof EVENTS)[number];
export const EVENT_LABEL: Record<EventName, string> = {
  view: "Listing page views",
  scan: "QR scans",
  call: "Call taps",
  map: "Map / directions taps",
  website: "Website clicks",
  tap: "Ad tap-to-open",
};
/** Counts for one month: { view: 12, scan: 3, ... } */
export type MonthCounts = Partial<Record<EventName, number>>;
/** { "2026-11": MonthCounts, ... } */
export type ListingStats = Record<string, MonthCounts>;
export const isEvent = (e: unknown): e is EventName =>
  typeof e === "string" && (EVENTS as readonly string[]).includes(e);

/** Month key in Toronto time, e.g. "2026-11". */
export function monthKey(d = new Date()): string {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit" })
    .formatToParts(d)
    .reduce<Record<string, string>>((a, x) => ({ ...a, [x.type]: x.value }), {});
  return `${p.year}-${p.month}`;
}
/** The 12 month keys ending with `end` (oldest first). */
export function last12(end = monthKey()): string[] {
  const [y = 2026, m = 1] = end.split("-").map(Number);
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (11 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}
export const sum = (s: ListingStats, months: string[], e: EventName) =>
  months.reduce((a, k) => a + (s[k]?.[e] ?? 0), 0);
/** Ignore obvious bots/crawlers/link previewers. The user agent is checked, never stored. */
export const isBot = (ua: string | null) =>
  !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget/i.test(ua);
