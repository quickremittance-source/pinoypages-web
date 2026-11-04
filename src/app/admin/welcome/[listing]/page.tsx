import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/adminSession";
import { PRICE_NOTE, welcomeDraft } from "@/lib/onboarding";
import { welcome } from "@/lib/onboardingDb";
import { DashShell } from "@/components/admin/Charts";
import { addQrAction, verifyAction } from "../../inquiries/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · welcome pack", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

export default async function Page({ params, searchParams }: { params: Promise<{ listing: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { listing } = await params;
  const { msg } = await searchParams;
  if (!(await isAdmin())) notFound();
  const w = await welcome(listing).catch(() => null);
  if (!w) return <DashShell><p data-testid="no-db">No listing {listing} (or no database in this environment).</p></DashShell>;
  const name = String(w.listing.name);
  const verified = w.listing.verified === true;
  const cardUrl = `https://pinoypages.ca/card/${listing}`;
  const statsUrl = w.statsToken ? `https://pinoypages.ca/stats/${w.statsToken}` : null;
  return (
    <DashShell>
      <header className="border-b-4 border-[#E01820] pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Welcome pack</p>
        <h1 className="text-3xl font-bold text-[#002050]">{name}</h1>
        <p className="text-sm">Tier {String(w.listing.tier)} · {verified ? `Verified until ${w.listing.verified_until}` : "not Verified"} · {PRICE_NOTE}</p>
      </header>
      {msg && <p role="status" className="rounded border border-[#0E7C86] p-2 text-sm">{msg}</p>}
      <section>
        <h2 className="text-lg font-bold text-[#002050]">QR codes</h2>
        <ul className="space-y-1 text-sm">
          {w.codes.map((c) => (
            <li key={c.code}>
              <span className="font-mono">{c.code}</span> ({c.placement}) · <a className="underline" href={`/admin/qr-file/${c.code}/qr.png`}>PNG</a> · <a className="underline" href={`/admin/qr-file/${c.code}/qr.svg`}>SVG</a>
            </li>
          ))}
        </ul>
        <form action={addQrAction} className="mt-2 flex gap-2 text-sm">
          <input type="hidden" name="listing" value={listing} />
          <label>Label <input name="label" required maxLength={60} placeholder="storefront, flyer, magazine p.12" className="border px-2" /></label>
          <button className="rounded bg-[#002050] px-3 py-1 font-bold text-white">Add QR code</button>
        </form>
      </section>
      <section className="text-sm">
        <h2 className="text-lg font-bold text-[#002050]">Links</h2>
        <p>Card: <a className="underline" href={cardUrl}>{cardUrl}</a></p>
        <p>Private stats: {statsUrl ? <a className="underline" href={statsUrl}>open</a> : "no advertiser linked yet"}</p>
      </section>
      <section className="text-sm">
        <h2 className="text-lg font-bold text-[#002050]">Verified step</h2>
        <form action={verifyAction} className="flex items-center gap-2">
          <input type="hidden" name="listing" value={listing} />
          <label><input type="checkbox" name="confirm" /> Live video check passed</label>
          <button className="rounded bg-[#0E7C86] px-3 py-1 font-bold text-white">Mark Verified (one quarterly issue)</button>
        </form>
      </section>
      <section>
        <h2 className="text-lg font-bold text-[#002050]">Welcome email (draft only; copy and send it yourself)</h2>
        <textarea readOnly rows={16} className="w-full border p-2 font-mono text-xs" data-testid="draft" defaultValue={welcomeDraft({ business: name, cardUrl, qrUrls: w.codes.map((c) => `https://pinoypages.ca/qr/${c.code}`), statsUrl, verified })} />
      </section>
    </DashShell>
  );
}
