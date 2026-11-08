import { requireAdmin } from "@/lib/adminGuard";
import type { Metadata } from "next";
import { qrTarget, rangeDays } from "@/lib/dashRange";
import { getQrDashboard } from "@/lib/dashboards";
import { Bars, BRAND, DashShell, RangePicker } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · QR trackers", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days: d } = await searchParams;
  await requireAdmin("/admin/qr");
  const days = rangeDays(d);
  const raw = await getQrDashboard(days).catch((e: Error) => (console.error("[dashboard]", e.message), "error" as const));
  const failed = raw === "error";
  const q = failed ? null : raw;
  return (
    <DashShell>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b-4 border-[#E01820] pb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Admin</p>
          <h1 className="text-3xl font-bold text-[#002050]">QR code trackers</h1>
          <p className="text-sm text-[#5b6475]">Printed codes point at pinoypages.ca/qr/&lt;code&gt;; each scan adds one to a daily counter (code, day, device type only).</p>
        </div>
        <RangePicker days={days} base="/admin/qr" />
      </header>
      <p><a className="text-sm font-bold text-[#0E7C86] underline" href={`/admin/dashboard?days=${days}`}>← Overall dashboard</a></p>
      {!q ? (
        <p className="rounded border border-[#d0d4dc] p-4" data-testid="no-db">{failed ? "Could not load data from the database (see server logs)." : "No database connected in this environment, so there is nothing to chart."}</p>
      ) : (
        <>
          <section className="rounded-lg border border-[#d0d4dc] p-4">
            <h2 className="mb-2 text-sm font-bold text-[#002050]">All scans per day</h2>
            <Bars data={q.total} label="All QR scans per day" color={BRAND.red} />
          </section>
          {q.byListing.length > 0 && (
            <section className="rounded-lg border border-[#d0d4dc] p-4" data-testid="qr-by-listing">
              <h2 className="mb-2 text-sm font-bold text-[#002050]">Scans by listing (all of its codes)</h2>
              <table className="w-full text-left text-sm">
                <thead><tr>{["Listing", "Codes", `Scans (${days}d)`, "Lifetime"].map((h) => <th key={h} scope="col" className="p-1">{h}</th>)}</tr></thead>
                <tbody>{q.byListing.map((l) => <tr key={l.listing} className="border-t border-[#d0d4dc]"><th scope="row" className="p-1">{l.listing}</th><td className="p-1">{l.codes}</td><td className="p-1 font-bold">{l.n}</td><td className="p-1">{l.lifetime}</td></tr>)}</tbody>
              </table>
            </section>
          )}
          <p className="text-xs text-[#5b6475]">Add another code for a listing (e.g. storefront, flyer, magazine p.12): <code>node scripts/qr-create.mjs --listing &lt;id&gt; --label &quot;flyer&quot; --target https://pinoypages.ca/go/&lt;id&gt;</code></p>
          {q.codes.length === 0 ? (
            <p className="text-sm text-[#5b6475]">No QR codes have been created yet.</p>
          ) : (
            <div className="overflow-x-auto" role="region" aria-label="QR codes" tabIndex={0}>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#002050] text-white">
                  <tr>{["Listing", "Code", "Label", "Target", "Status", `Scans (${days}d)`, "Lifetime", "Trend"].map((h) => <th key={h} scope="col" className="p-2">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {q.codes.map((c) => {
                    const ok = qrTarget(c.target);
                    return (
                      <tr key={c.code} className="border-t border-[#d0d4dc]">
                        <td className="p-2">{c.listing}</td>
                        <th scope="row" className="p-2 font-mono">{c.code}</th>
                        <td className="p-2">{c.placement}</td>
                        <td className="p-2 break-all">{c.target}{!ok && <span className="ml-1 font-bold text-[#E01820]">(not allowed: must be pinoypages.ca /go, /card or /qr)</span>}</td>
                        <td className="p-2">{c.active ? "active" : "off"}</td>
                        <td className="p-2 font-bold">{c.n}</td>
                        <td className="p-2">{c.lifetime}</td>
                        <td className="w-48 p-2"><Bars data={c.series} label={`${c.code} scans`} color={BRAND.teal} height={30} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashShell>
  );
}
