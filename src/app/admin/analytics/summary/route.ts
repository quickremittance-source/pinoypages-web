import { monthKey } from "@/lib/analytics/events";
import { store } from "@/lib/analytics/store";
import { summaryEmail } from "@/lib/analytics/summary";
import { resultsToken, validAdminKey } from "@/lib/analytics/token";
import { abs, isPaid, listings } from "@/lib/guide";

export const dynamic = "force-dynamic";

/** Generates the monthly summary email drafts (text) for every paid listing. Generate only — never sends. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!validAdminKey(u.searchParams.get("key"))) return new Response("Not found", { status: 404 });
  const month = /^\d{4}-\d{2}$/.test(u.searchParams.get("month") ?? "") ? u.searchParams.get("month")! : monthKey();
  const all = await store().all();
  const drafts = listings
    .filter(isPaid)
    .map((l) => summaryEmail(l, all[l.id] ?? {}, month, abs(`/results/${l.id}?t=${resultsToken(l.id)}`)));
  const body = drafts.map((d) => `To: ${d.to}\nSubject: ${d.subject}\n\n${d.text}`).join("\n\n-----\n\n");
  return new Response(`DRAFTS ONLY — NOT SENT (${month})\n\n${body}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
