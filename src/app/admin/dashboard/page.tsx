import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminSession";
import { rangeDays } from "@/lib/dashRange";
import { getOverview } from "@/lib/dashboards";
import { BarList, Bars, BRAND, DashShell, RangePicker, Stat } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · dashboard", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

/** Overall analytics from Neon daily counters. Needs an admin session; 404 otherwise. */
export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  if (!(await isAdmin())) notFound();
  const days = rangeDays(d);
  const raw = await getOverview(days).catch((e: Error) => (console.error("[dashboard]", e.message), "error" as const));
  const failed = raw === "error";
  const o = failed ? null : raw;
  return (
    <DashShell>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-[#E01820] pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Admin</p>
          <h1 className="text-3xl font-bold text-[#002050]">PinoyPages dashboard</h1>
          {o && <p className="text-sm text-[#5b6475]">{o.from} to {o.to} (Toronto days) · refreshed at most every 5 minutes</p>}
        </div>
        <RangePicker days={days} base="/admin/dashboard" />
      </header>
      <nav className="flex gap-4 text-sm font-bold text-[#0E7C86] underline">
        <a href={`/admin/qr?days=${days}`}>QR trackers</a>
        <a href={`/admin/advertisers`}>Advertiser dashboards</a>
        <a href={`/admin/analytics`}>Classic analytics</a>
      </nav>
      {!o ? (
        <p className="rounded border border-[#d0d4dc] p-4" data-testid="no-db">{failed ? "Could not load data from the database (see server logs)." : "No database connected in this environment, so there is nothing to chart."}</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            <Stat id="pageviews" label="Page views" value={o.totals.pageviews} />
            <Stat id="searches" label="Searches" value={o.totals.searches} />
            <Stat id="listing-views" label="Listing views" value={o.totals.listingViews} />
            <Stat id="contacts" label="Contact clicks" value={o.totals.contactClicks} />
            <Stat id="qr" label="QR scans" value={o.totals.qrScans} />
            <Stat id="zcard" label="ZCard views" value={o.totals.zcardViews} />
            <Stat id="inquiries" label="Inquiries" value={o.totals.inquiries} />
          </dl>
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["Page views per day", o.pageviews, BRAND.navy],
              ["Searches per day", o.searches, BRAND.teal],
              ["Listing views per day", o.listingViews, BRAND.teal],
              ["QR scans per day", o.qrScans, BRAND.red],
              ["ZCard page views per day", o.zcardViews, BRAND.navy],
            ] as const).map(([t, s, c]) => (
              <section key={t} className="rounded-lg border border-[#d0d4dc] p-4">
                <h2 className="mb-2 text-sm font-bold text-[#002050]">{t}</h2>
                <Bars data={[...s]} label={t} color={c} />
              </section>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <BarList title="Top pages" rows={o.topPages} />
            <BarList title="Top business pages" rows={o.topBusinessPages} />
            <BarList title="Top listings (views)" rows={o.topListings} />
            <BarList title="Top categories" rows={o.topCategories} />
            <BarList title="Top cities" rows={o.topCities} />
            <BarList title="Top searches" rows={o.topSearches} />
            <BarList title="Inquiries by kind · status" rows={o.inquiries} />
            <BarList title="Ad / ZCard events" rows={Object.entries(o.adEvents).map(([label, n]) => ({ label, n }))} />
          </div>
          <p className="text-xs text-[#5b6475]">Counts only, no visitor personal data. Nov 3, 2026 includes about 467 test page views, kept as-is.</p>
        </>
      )}
    </DashShell>
  );
}
