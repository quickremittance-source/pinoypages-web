import { abs, brand, type Listing } from "@/lib/guide";
import { EVENT_LABEL, type EventName, type ListingStats } from "./events";

const SHOWN: EventName[] = ["view", "scan", "call", "map", "website", "tap"];

/** Monthly summary email for a paid listing — generated only, never sent by this app. */
export function summaryEmail(l: Listing, stats: ListingStats, month: string, resultsUrl: string) {
  const m = stats[month] ?? {};
  const lines = SHOWN.filter((e) => e !== "tap" || (m.tap ?? 0) > 0).map((e) => `- ${EVENT_LABEL[e]}: ${m[e] ?? 0}`);
  const label = new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
  return {
    to: l.email,
    subject: `${l.name}: your ${brand.name} counts for ${label}`,
    text: [
      `Hi ${l.name},`,
      "",
      `Here are the counts for your ${brand.name} listing for ${label}:`,
      ...lines,
      "",
      "These are counts from your page and your tracked links (QR, Call / Book, map, website). We report",
      "them as they are; they are not a promise of future results.",
      "",
      `Your private 12-month results page: ${resultsUrl}`,
      `Your page: ${abs(`/listing/${l.id}`)}`,
      "",
      "Salamat po,",
      `Jose Guevara · ${brand.name} · ${brand.email} · {mailing_address}`,
      "Unsubscribe from monthly counts: {unsubscribe_url}",
    ].join("\n"),
  };
}
