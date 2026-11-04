import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { RangePicker, Stat } from "@/components/admin/Charts";
import { isAdmin } from "@/lib/adminSession";
import { rangeDays } from "@/lib/dashRange";
import { getOverview } from "@/lib/dashboards";
import { getHub } from "@/lib/adminEditDb";
import { SORT_COLS, sortRows } from "@/lib/adminEdit";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type SP = Promise<{ days?: string; sort?: string; dir?: string; kind?: string; msg?: string }>;
/** Admin hub: overall site analytics + one sortable table of every listing, ad and ZCard. Cached 5 min. */
export default async function Page({ searchParams }: { searchParams: SP }) {
  const { days: d, sort, dir, kind, msg } = await searchParams;
  if (!(await isAdmin())) notFound();
  const days = rangeDays(d);
  const [o, hub] = await Promise.all([
    getOverview(days).catch((e: Error) => (console.error("[hub]", e.message), null)),
    getHub(days).catch((e: Error) => (console.error("[hub]", e.message), null)),
  ]);
  const all = hub
    ? sortRows(
        hub.rows.filter((r) => !kind || r.kind === kind),
        sort,
        dir,
      )
    : [];
  const col = (SORT_COLS as readonly string[]).includes(sort ?? "") ? sort : "views";
  const href = (c: string) =>
    `/admin?days=${days}${kind ? `&kind=${kind}` : ""}&sort=${c}&dir=${col === c && dir !== "asc" ? "asc" : "desc"}`;
  return (
    <AdminFrame title="Admin hub" msg={msg}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-[#5b6475]">
          {hub
            ? `${hub.from} to ${hub.to} (Toronto days) · refreshed at most every 5 minutes`
            : "No database connected in this environment."}
        </p>
        <RangePicker days={days} base="/admin" />
      </div>
      {o && (
        <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7" data-testid="hub-totals">
          <Stat id="pageviews" label="Page views" value={o.totals.pageviews} />
          <Stat id="searches" label="Searches" value={o.totals.searches} />
          <Stat id="listing-views" label="Listing views" value={o.totals.listingViews} />
          <Stat id="contacts" label="Contact clicks" value={o.totals.contactClicks} />
          <Stat id="qr" label="QR scans" value={o.totals.qrScans} />
          <Stat id="zcard" label="ZCard views" value={o.totals.zcardViews} />
          <Stat id="inquiries" label="Inquiries" value={o.totals.inquiries} />
        </dl>
      )}
      {hub && (
        <section aria-labelledby="per-h" className="space-y-2">
          <h2 id="per-h" className="text-xl font-bold text-[#002050]">
            Advertisers, ZCards and listings
          </h2>
          <p className="flex gap-3 text-sm">
            {[
              ["", "All"],
              ["listing", "Listings"],
              ["ad", "Ads & ZCards"],
            ].map(([v, l]) => (
              <a
                key={v}
                aria-current={(kind ?? "") === v ? "page" : undefined}
                className="text-[#0E7C86] underline aria-[current=page]:font-bold"
                href={`/admin?days=${days}${v ? `&kind=${v}` : ""}`}
              >
                {l}
              </a>
            ))}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="hub-table">
              <thead className="bg-[#002050] text-white">
                <tr>
                  <th scope="col" className="p-2">
                    Type
                  </th>
                  {(
                    [
                      ["name", "Name"],
                      ["views", "Views"],
                      ["clicks", "Clicks"],
                      ["contacts", "Contact clicks"],
                      ["scans", "QR scans"],
                    ] as const
                  ).map(([c, l]) => (
                    <th
                      key={c}
                      scope="col"
                      className="p-2"
                      aria-sort={col === c ? (dir === "asc" ? "ascending" : "descending") : undefined}
                    >
                      <a className="underline" href={href(c)}>
                        {l}
                      </a>
                    </th>
                  ))}
                  <th scope="col" className="p-2">
                    By code
                  </th>
                  <th scope="col" className="p-2">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {all.map((r) => {
                  const zc = r.ref.startsWith("zcard:");
                  const edit =
                    r.kind === "listing"
                      ? `/admin/listings/${encodeURIComponent(r.ref)}`
                      : zc
                        ? null
                        : `/admin/ads/${encodeURIComponent(r.ref)}`;
                  const stats = r.kind === "listing" ? `/admin/qr?days=${days}` : `/admin/ads`;
                  return (
                    <tr key={`${r.kind}:${r.ref}`} className="border-b border-[#d0d4dc]" data-row={r.kind}>
                      <td className="p-2">
                        {r.kind === "listing" ? "Listing" : zc ? "ZCard" : "Ad"}
                        {r.status !== "published" && r.status !== "live" && r.status !== "active"
                          ? ` · ${r.status}`
                          : ""}
                      </td>
                      <td className="p-2 font-semibold">{r.name}</td>
                      <td className="p-2 tabular-nums">{r.views}</td>
                      <td className="p-2 tabular-nums">{r.clicks}</td>
                      <td className="p-2 tabular-nums">{r.contacts}</td>
                      <td className="p-2 tabular-nums">{r.scans}</td>
                      <td className="p-2 text-xs">{r.codes.map((c) => `${c.code} ${c.n}`).join(" · ")}</td>
                      <td className="p-2 whitespace-nowrap">
                        <a className="text-[#0E7C86] underline" href={stats}>
                          Stats
                        </a>
                        {edit && (
                          <>
                            {" "}
                            ·{" "}
                            <a className="text-[#0E7C86] underline" href={edit}>
                              Edit / hide / delete
                            </a>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[#5b6475]">
            Listings: clicks = taps + shares; contact clicks = call + map + website; QR scans summed over the
            listing&apos;s codes. Ads/ZCards: views = impressions. Counts only, no visitor personal data.
          </p>
        </section>
      )}
    </AdminFrame>
  );
}
