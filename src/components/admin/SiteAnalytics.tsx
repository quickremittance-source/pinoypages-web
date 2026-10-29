import { siteSummary, type Range } from "@/lib/siteAnalytics";
import { SimpleTable } from "./Tables";

/** Site-wide first-party analytics (Neon). Renders a note when DATABASE_URL is not set. */
export async function SiteAnalytics({ range, adminKey }: { range: Range; adminKey: string }) {
  const s = await siteSummary(range).catch((e) => {
    console.warn("[admin] site summary failed", (e as Error).message);
    return null;
  });
  return (
    <section aria-labelledby="site-h" className="space-y-4" data-testid="site-analytics">
      <h2 id="site-h" className="text-xl font-bold">
        Site traffic
      </h2>
      <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
        <input type="hidden" name="key" value={adminKey} />
        <label className="flex flex-col">
          From
          <input type="date" name="from" defaultValue={range.from} className="border p-1" />
        </label>
        <label className="flex flex-col">
          To
          <input type="date" name="to" defaultValue={range.to} className="border p-1" />
        </label>
        <button className="rounded bg-sea px-3 py-1 text-white">Apply</button>
      </form>
      {!s ? (
        <p className="text-muted">Site analytics need the Neon database (DATABASE_URL); none configured here.</p>
      ) : (
        <>
          <p className="text-lg">
            <strong data-testid="pv-total">{s.total}</strong> page views, {range.from} to {range.to} (Toronto days).
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <SimpleTable label="Top pages" head={["Page", "Views"]} rows={s.topPages.map((x) => [x.path, x.n])} />
            <SimpleTable
              label="Sources (referrer host)"
              head={["Source", "Views"]}
              rows={s.sources.map((x) => [x.host, x.n])}
            />
            <SimpleTable label="Devices" head={["Device", "Views"]} rows={s.devices.map((x) => [x.device, x.n])} />
            <SimpleTable label="By day" head={["Day", "Views"]} rows={s.byDay.map((x) => [x.day, x.n])} />
          </div>
          <SimpleTable
            label="Top listings (months in range)"
            head={["Listing", "Views", "QR scans", "Clicks"]}
            rows={s.topListings.map((x) => [x.name ?? x.listing_id, x.views, x.scans, x.clicks])}
          />
        </>
      )}
      <p className="text-xs text-muted">
        Cookie-free and first-party: only day, page path, referrer host and device class are stored. No IP address, user
        agent or visitor id. Browsers sending Do Not Track / Global Privacy Control are not counted.
      </p>
    </section>
  );
}
