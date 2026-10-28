import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { hasLandingPage, hasQr, listingTarget, TIER_LABEL, VERIFIED_LABEL } from "@/lib/adLanding";
import { adStats, listAds, type AdStatRow } from "@/lib/adsRepo";
import { validAdminKey } from "@/lib/analytics/token";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · ads", robots: { index: false, follow: false } };

type Key = string;
const COLS = [
  ["view", "Views"],
  ["scan", "QR scans"],
  ["call", "Call"],
  ["map", "Map"],
  ["website", "Website"],
  ["tap", "Other taps"],
] as const;

function group(rows: AdStatRow[], by: (r: AdStatRow) => Key) {
  const m = new Map<Key, Record<string, number>>();
  for (const r of rows) {
    const k = by(r);
    const o = m.get(k) ?? {};
    o[r.event] = (o[r.event] ?? 0) + Number(r.count);
    m.set(k, o);
  }
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

function Table({ label, rows, head }: { label: string; rows: [Key, Record<string, number>][]; head: string }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full bg-white text-left text-sm">
        <thead className="bg-sea text-white">
          <tr>
            <th scope="col" className="p-2">
              {head}
            </th>
            {COLS.map(([, l]) => (
              <th key={l} scope="col" className="p-2">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLS.length + 1} className="p-2 text-muted">
                No events yet.
              </td>
            </tr>
          )}
          {rows.map(([k, o]) => (
            <tr key={k} className="border-b border-sand">
              <td className="p-2 font-mono">{k}</td>
              {COLS.map(([e]) => (
                <td key={e} className="p-2">
                  {o[e] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Private ad + QR analytics. Needs ?key=ADMIN_KEY (404 otherwise). Data from Neon when DATABASE_URL is set. */
export default async function Page({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!validAdminKey(key)) notFound();
  const [ads, stats] = await Promise.all([listAds(), adStats()]);
  return (
    <>
      <PageHead
        kicker="Admin"
        title="Ad and QR analytics"
        intro="Aggregated monthly counts. No personal data is stored."
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {stats === null && (
          <p className="rounded-lg bg-sand p-3" data-testid="no-db">
            DATABASE_URL is not set here, so ads come from content/ads.json and counts are not stored in Neon.
          </p>
        )}
        <section>
          <h2 className="text-lg font-bold">Ads</h2>
          <ul className="mt-2 space-y-2" data-testid="admin-ads">
            {ads.map((a) => (
              <li key={a.slug} className="card p-3 text-sm">
                <span className="font-semibold">{a.name}</span> · {TIER_LABEL[a.tier]}
                {a.verified && ` · ${VERIFIED_LABEL[a.verified]}`} · <span className="font-mono">{a.slug}</span> ·
                tracking <span className="font-mono">{a.trackingId}</span> ·{" "}
                {hasLandingPage(a.tier) ? (
                  <a className="underline" href={`/ad/${a.slug}`}>
                    landing page
                  </a>
                ) : (
                  <span>redirects to {listingTarget(a)}</span>
                )}{" "}
                ·{" "}
                {hasQr(a) ? (
                  <>
                    QR{" "}
                    <a className="underline" href={`/ad/qr/${a.slug}.svg`}>
                      SVG
                    </a>{" "}
                    /{" "}
                    <a className="underline" href={`/ad/qr/${a.slug}.png`}>
                      PNG
                    </a>
                  </>
                ) : (
                  <span>no QR (zcard QR is a Kabayan Verified++ add-on)</span>
                )}
              </li>
            ))}
          </ul>
        </section>
        {stats && (
          <>
            <section className="space-y-2">
              <h2 className="text-lg font-bold">Per ad, by month</h2>
              <Table label="Per ad" head="Month · ad" rows={group(stats, (r) => `${r.month} · ${r.slug}`)} />
            </section>
            <section className="space-y-2">
              <h2 className="text-lg font-bold">Per tracking ID (printed QR), by month</h2>
              <Table
                label="Per tracking ID"
                head="Month · ad · tracking ID"
                rows={group(
                  stats.filter((r) => r.tracking_id),
                  (r) => `${r.month} · ${r.slug} · ${r.tracking_id}`,
                )}
              />
            </section>
          </>
        )}
      </div>
    </>
  );
}
