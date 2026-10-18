import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LogoTile } from "@/components/Badge";
import { last12, monthKey } from "@/lib/analytics/events";
import { store } from "@/lib/analytics/store";
import { isPaid, listingById } from "@/lib/guide";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Scan report (demo)", robots: { index: false, follow: false } };

/** Deterministic SAMPLE numbers per listing (demo only, never real data). */
function sample(id: string, months: string[]) {
  let seed = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) % 1000) / 1000;
  return months.map((m, i) => {
    const ramp = 0.35 + (i / (months.length - 1)) * 0.65;
    const scans = Math.round((18 + rnd() * 22) * ramp);
    return {
      m,
      scans,
      saves: Math.round(scans * (0.25 + rnd() * 0.15)),
      calls: Math.round(scans * (0.15 + rnd() * 0.1)),
    };
  });
}
const label = (m: string) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-CA", { month: "short", year: "2-digit", timeZone: "UTC" });

/**
 * Unlisted demo of the monthly scan report (/report/<id>): never linked, not in the sitemap, noindex.
 * The chart and table are SAMPLE numbers; the "live demo counter" reads the real /go/<id> scan count.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = listingById(id);
  if (!l || !isPaid(l)) notFound();
  const months = last12();
  const rows = sample(id, months);
  const max = Math.max(...rows.map((r) => r.scans));
  const total = rows.reduce((a, r) => a + r.scans, 0);
  const stats = await store().get(id);
  const live = stats[monthKey()]?.scan ?? 0;
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p
        className="rounded-lg border-2 border-dashed border-phred bg-white p-3 text-center text-sm font-extrabold tracking-wider text-red-dk uppercase"
        data-testid="sample-banner"
      >
        SAMPLE report · demo numbers, not real results
      </p>
      <header className="flex items-center gap-4">
        <LogoTile l={l} />
        <div>
          <p className="kicker">Monthly scan report · SAMPLE</p>
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{l.name}</h1>
          <p className="text-sm text-muted">Your QR and ZCard, last 12 months</p>
        </div>
      </header>

      <section className="card p-5" aria-labelledby="live-h">
        <h2 id="live-h" className="text-lg font-bold text-ink">
          Live demo counter
        </h2>
        <p className="mt-1 text-sm text-muted">
          Real count of scans through <code className="rounded bg-sand px-1">/go/{l.id}</code> on this server this
          month. Scan the QR, then refresh this page.
        </p>
        <p className="mt-2 text-4xl font-extrabold text-turqdk" data-testid="live-scans">
          {live}
        </p>
      </section>

      <section className="card p-5" aria-labelledby="chart-h">
        <h2 id="chart-h" className="text-lg font-bold text-ink">
          QR scans per month <span className="sample-chip align-middle">Sample</span>
        </h2>
        <p className="mt-1 text-sm text-muted">{total} sample scans in 12 months.</p>
        <svg
          viewBox="0 0 480 170"
          role="img"
          aria-label="SAMPLE QR scans per month, last 12 months"
          className="mt-3 w-full"
        >
          {rows.map((r, i) => {
            const h = (r.scans / max) * 120;
            return (
              <g key={r.m}>
                <rect
                  x={i * 40 + 6}
                  y={135 - h}
                  width={28}
                  height={h}
                  rx={4}
                  fill={i === rows.length - 1 ? "#C8102E" : "#0E7C86"}
                />
                <text x={i * 40 + 20} y={130 - h} fontSize="10" textAnchor="middle" fill="#1B2328">
                  {r.scans}
                </text>
                <text x={i * 40 + 20} y={154} fontSize="9" textAnchor="middle" fill="#55636B">
                  {label(r.m)}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="mt-3 overflow-x-auto" role="region" aria-label="SAMPLE counts by month" tabIndex={0}>
          <table className="w-full text-left text-sm">
            <caption className="sr-only">SAMPLE monthly counts</caption>
            <thead className="border-b border-sand text-muted">
              <tr>
                <th scope="col" className="py-2">
                  Month
                </th>
                <th scope="col">QR scans</th>
                <th scope="col">Saved contact</th>
                <th scope="col">Call / Book taps</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .slice()
                .reverse()
                .slice(0, 6)
                .map((r) => (
                  <tr key={r.m} className="border-b border-sand">
                    <th scope="row" className="py-1.5 font-semibold">
                      {label(r.m)}
                    </th>
                    <td>{r.scans}</td>
                    <td>{r.saves}</td>
                    <td>{r.calls}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-sm text-muted">
        SAMPLE: illustrative numbers for the demo. Real reports count scans and taps only (no personal data, bots
        ignored) and are not a promise of future results.{" "}
        <Link href={`/card/${l.id}`} className="font-semibold text-turqdk underline">
          Open this ZCard
        </Link>
      </p>
    </div>
  );
}
