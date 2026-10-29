import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { SimpleTable } from "@/components/admin/Tables";
import { ADV_TIER_LABEL, advertiserByToken, advertiserStats, type MonthRow } from "@/lib/advertisers";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your results",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const COLS = [
  ["view", "Views"],
  ["scan", "QR scans"],
  ["call", "Call"],
  ["map", "Map"],
  ["website", "Website"],
  ["tap", "Other taps"],
] as const;
function byMonth(rows: MonthRow[]) {
  const m = new Map<string, Record<string, number>>();
  for (const r of rows)
    m.set(r.month, { ...(m.get(r.month) ?? {}), [r.event]: (m.get(r.month)?.[r.event] ?? 0) + r.n });
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, o]) => [k, ...COLS.map(([e]) => o[e] ?? 0)]);
}
const total = (rows: MonthRow[], ev: string[]) => rows.filter((r) => ev.includes(r.event)).reduce((a, r) => a + r.n, 0);

/** Private per-advertiser stats via unguessable token (/stats/<36 hex>). 404 for unknown tokens. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const a = await advertiserByToken(token).catch(() => null);
  if (!a) notFound();
  const s = await advertiserStats(a);
  const all = [...s.ads, ...s.listings];
  return (
    <>
      <PageHead kicker="Private results" title={a.business_name} intro={ADV_TIER_LABEL[a.tier] ?? a.tier} />
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {a.is_demo && (
          <p className="rounded border border-sunset bg-sand p-3 font-semibold" data-testid="demo-banner">
            Demo advertiser: sample account for testing. Not a real business.
          </p>
        )}
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[
            ["Views", total(all, ["view"])],
            ["QR scans", total(all, ["scan"])],
            ["Clicks", total(all, ["call", "map", "website", "tap"])],
          ].map(([l, n]) => (
            <div key={l} className="rounded bg-white p-4">
              <dt className="text-sm text-muted">{l}</dt>
              <dd className="text-3xl font-bold" data-testid={`total-${l}`}>
                {n}
              </dd>
            </div>
          ))}
        </dl>
        <SimpleTable label="Your ads by month" head={["Month", ...COLS.map((c) => c[1])]} rows={byMonth(s.ads)} />
        {a.listing_ids.length > 0 && (
          <SimpleTable
            label="Your listing by month"
            head={["Month", ...COLS.map((c) => c[1])]}
            rows={byMonth(s.listings)}
          />
        )}
        <p className="text-xs text-muted">
          Counts only; no visitor personal data is collected. This link is private to you — please don’t share it.
        </p>
      </div>
    </>
  );
}
