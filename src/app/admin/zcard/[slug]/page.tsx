import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminFrame, NoDb } from "@/components/admin/AdminFrame";
import { RangePicker } from "@/components/admin/Charts";
import { isAdmin } from "@/lib/adminSession";
import { db } from "@/lib/db";
import { rangeDays } from "@/lib/dashRange";
import { parseTab, ZCARD_TABS } from "@/lib/adminZcard";
import { getAdminZcard, getZcardAnalytics, listZcardCodes, type AdminZcard } from "@/lib/adminZcardDb";
import { getListing, searchListings } from "@/lib/adminEditDb";
import { createQrAction, listingAction, saveLandingAction } from "@/app/admin/zcard/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin · ZCard",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

const TAB_LABEL: Record<(typeof ZCARD_TABS)[number], string> = {
  analytics: "Analytics",
  qr: "QR",
  landing: "Landing",
  listing: "Listing",
};

type P = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; days?: string; q?: string; msg?: string }>;
};

export default async function Page({ params, searchParams }: P) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  if (!(await isAdmin())) notFound();
  const ad = await getAdminZcard(slug);
  if (!ad) notFound();
  const tab = parseTab(sp.tab);
  const days = rangeDays(sp.days);
  const href = (t: string) =>
    `/admin/zcard/${encodeURIComponent(slug)}?tab=${t}${t === "analytics" ? `&days=${days}` : ""}`;
  return (
    <AdminFrame title={`ZCard: ${ad.name}`} msg={sp.msg}>
      <p className="text-sm text-[#5b6475]">
        slug <code>{ad.slug}</code> · status <strong>{ad.status}</strong>
        {ad.demo ? " · demo" : ""} · public landing{" "}
        <a className="text-[#0E7C86] underline" href={`/zcard/${encodeURIComponent(ad.slug)}`}>
          /zcard/{ad.slug}
        </a>
      </p>
      <nav aria-label="ZCard sections" className="flex flex-wrap gap-3 text-sm font-bold" data-testid="zcard-tabs">
        {ZCARD_TABS.map((t) => (
          <a
            key={t}
            href={href(t)}
            aria-current={tab === t ? "page" : undefined}
            className="text-[#0E7C86] underline aria-[current=page]:font-bold"
          >
            {TAB_LABEL[t]}
          </a>
        ))}
      </nav>
      {tab === "analytics" && <AnalyticsPanel slug={slug} days={days} />}
      {tab === "qr" && <QrPanel slug={slug} />}
      {tab === "landing" && <LandingPanel ad={ad} />}
      {tab === "listing" && <ListingPanel slug={slug} listingId={ad.listingId} q={sp.q ?? ""} />}
    </AdminFrame>
  );
}

async function AnalyticsPanel({ slug, days }: { slug: string; days: ReturnType<typeof rangeDays> }) {
  const data = await getZcardAnalytics(slug, days);
  if (!data) return <p className="text-sm">No analytics for this ZCard.</p>;
  const base = `/admin/zcard/${encodeURIComponent(slug)}`;
  return (
    <section className="space-y-4" data-testid="zcard-analytics" aria-labelledby="zcard-an-h">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="zcard-an-h" className="text-xl font-bold text-[#002050]">
            Analytics
          </h2>
          <p className="text-sm text-[#5b6475]">
            {data.from} to {data.to} (America/Toronto days)
          </p>
        </div>
        <RangePicker days={days} base={base} extra={{ tab: "analytics" }} />
      </div>
      <p className="text-sm text-[#5b6475]">{data.note}</p>
      {data.noDb && <NoDb />}
      {!data.noDb && data.byDay.every((s) => s.series.every((d) => d.n === 0)) && data.byCodeMonth.length === 0 && (
        <p className="rounded border border-[#d0d4dc] p-4" data-testid="zcard-analytics-empty">
          No events in this range.
        </p>
      )}
      {data.byDay.some((s) => s.series.some((d) => d.n !== 0)) && (
        <div className="overflow-x-auto" role="region" aria-label="Daily ZCard events" tabIndex={0}>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#002050] text-white">
              <tr>
                <th scope="col" className="p-2">
                  Day
                </th>
                {data.byDay.map((s) => (
                  <th key={s.event} scope="col" className="p-2">
                    {s.event}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.byDay[0]?.series.map((d, i) => (
                <tr key={d.day} className="border-b border-[#d0d4dc]">
                  <th scope="row" className="p-2 font-mono">
                    {d.day}
                  </th>
                  {data.byDay.map((s) => (
                    <td key={s.event} className="p-2 tabular-nums">
                      {s.series[i]?.n ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="overflow-x-auto" role="region" aria-label="Scans by tracking ID and month" tabIndex={0}>
        <h3 className="mb-2 text-sm font-bold text-[#002050]">Scans by tracking ID and month</h3>
        <table className="w-full text-left text-sm">
          <thead className="bg-[#002050] text-white">
            <tr>
              {["Tracking ID", "Month", "Scans"].map((h) => (
                <th key={h} scope="col" className="p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.byCodeMonth.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-2 text-[#5b6475]">
                  No per-code totals yet.
                </td>
              </tr>
            ) : (
              data.byCodeMonth.map((r) => (
                <tr key={`${r.code}-${r.month}`} className="border-b border-[#d0d4dc]">
                  <th scope="row" className="p-2 font-mono">
                    {r.code}
                  </th>
                  <td className="p-2">{r.month}</td>
                  <td className="p-2 tabular-nums">{r.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {data.listingByCode.length > 0 && (
        <div
          className="overflow-x-auto"
          role="region"
          aria-label="Linked listing QR scans by code and day"
          tabIndex={0}
        >
          <h3 className="mb-2 text-sm font-bold text-[#002050]">Linked listing QR scans (by code and Toronto day)</h3>
          <table className="w-full text-left text-sm">
            <thead className="bg-[#002050] text-white">
              <tr>
                {["Code", "Label", "Scans in range"].map((h) => (
                  <th key={h} scope="col" className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.listingByCode.map((c) => (
                <tr key={c.code} className="border-b border-[#d0d4dc]">
                  <th scope="row" className="p-2 font-mono">
                    {c.code}
                  </th>
                  <td className="p-2">{c.label}</td>
                  <td className="p-2 tabular-nums">{c.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function QrPanel({ slug }: { slug: string }) {
  const codes = await listZcardCodes(slug);
  return (
    <section className="space-y-4" data-testid="zcard-qr" aria-labelledby="zcard-qr-h">
      <h2 id="zcard-qr-h" className="text-xl font-bold text-[#002050]">
        QR codes
      </h2>
      <p className="text-sm text-[#5b6475]">
        Each labelled code prints as https://pinoypages.ca/zcard/{slug}?src=qr&t=&lt;code&gt;. Downloads do not create a
        new code. Creating a code needs the database.
      </p>
      {!db() && <NoDb />}
      {codes.length === 0 ? (
        <p className="text-sm text-[#5b6475]">No QR codes yet.</p>
      ) : (
        <div className="overflow-x-auto" role="region" aria-label="ZCard QR codes" tabIndex={0}>
          <table className="w-full text-left text-sm" data-testid="zcard-qr-table">
            <thead className="bg-[#002050] text-white">
              <tr>
                {["Code", "Label", "Destination", "Download"].map((h) => (
                  <th key={h} scope="col" className="p-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.code} className="border-b border-[#d0d4dc]">
                  <th scope="row" className="p-2 font-mono">
                    {c.code}
                  </th>
                  <td className="p-2">{c.label}</td>
                  <td className="p-2 break-all font-mono text-xs">{c.url}</td>
                  <td className="p-2 whitespace-nowrap">
                    <a
                      className="text-[#0E7C86] underline"
                      href={`/admin/zcard/${encodeURIComponent(slug)}/qr/${encodeURIComponent(c.code)}/qr.png`}
                    >
                      Download PNG for {c.code}
                    </a>
                    {" · "}
                    <a
                      className="text-[#0E7C86] underline"
                      href={`/admin/zcard/${encodeURIComponent(slug)}/qr/${encodeURIComponent(c.code)}/qr.pdf`}
                    >
                      Download PDF for {c.code}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form
        action={createQrAction}
        className="grid max-w-lg gap-3 rounded-lg border border-[#d0d4dc] p-4"
        data-testid="zcard-qr-create"
      >
        <input type="hidden" name="slug" value={slug} />
        <label className="text-sm font-semibold">
          Label
          <input name="label" required maxLength={80} className="field mt-1 w-full" placeholder="magazine p.12" />
        </label>
        <button className="btn px-4 py-2">Create labelled code</button>
      </form>
    </section>
  );
}

function LandingPanel({ ad }: { ad: AdminZcard }) {
  if (!ad) return null;
  return (
    <section className="space-y-4" data-testid="zcard-landing" aria-labelledby="zcard-land-h">
      <h2 id="zcard-land-h" className="text-xl font-bold text-[#002050]">
        Landing copy
      </h2>
      <p className="text-sm text-[#5b6475]">
        Edits the public ZCard page only (name, tagline, offer, services, contact and map). It does not change the
        linked listing, pricing or article text.
      </p>
      {!db() && <NoDb />}
      <form
        action={saveLandingAction}
        className="grid gap-3 rounded-lg border border-[#d0d4dc] p-4 sm:grid-cols-2"
        data-testid="zcard-landing-form"
      >
        <input type="hidden" name="slug" value={ad.slug} />
        <label className="text-sm font-semibold sm:col-span-2">
          Name
          <input name="name" defaultValue={ad.name} required className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Tagline
          <input name="tagline" defaultValue={ad.tagline} className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Offer
          <textarea name="offer" defaultValue={ad.offer} rows={3} className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">
          Services (one per line)
          <textarea name="services" defaultValue={ad.services.join("\n")} rows={4} className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold">
          Phone
          <input name="phone" defaultValue={ad.phone} required className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold">
          WhatsApp
          <input name="whatsapp" defaultValue={ad.whatsapp ?? ""} className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold">
          Website
          <input name="website" defaultValue={ad.website ?? ""} className="field mt-1 w-full" />
        </label>
        <label className="text-sm font-semibold">
          Map query
          <input name="mapQuery" defaultValue={ad.mapQuery} required className="field mt-1 w-full" />
        </label>
        <div className="sm:col-span-2">
          <button className="btn px-4 py-2">Save landing copy</button>
        </div>
      </form>
    </section>
  );
}

async function ListingPanel({ slug, listingId, q }: { slug: string; listingId: string | null; q: string }) {
  const current = listingId && db() ? await getListing(listingId).catch(() => null) : null;
  const results = q && db() ? await searchListings(q.trim().slice(0, 80), "") : null;
  return (
    <section className="space-y-4" data-testid="zcard-listing" aria-labelledby="zcard-list-h">
      <h2 id="zcard-list-h" className="text-xl font-bold text-[#002050]">
        Linked listing
      </h2>
      <p className="text-sm text-[#5b6475]">
        Optional. Unlinking clears only this association — it never deletes or archives the listing, the ZCard, QR codes
        or analytics. This does not create listings or sync Brevo.
      </p>
      {!db() && <NoDb />}
      <p className="rounded border border-[#d0d4dc] p-3 text-sm" data-testid="zcard-listing-current">
        {listingId ? (
          <>
            Currently linked to <strong>{current ? String(current.name) : listingId}</strong>{" "}
            <span className="font-mono">({listingId})</span>
            {current ? (
              <>
                {" "}
                ·{" "}
                <a className="text-[#0E7C86] underline" href={`/admin/listings/${encodeURIComponent(listingId)}`}>
                  Open listing
                </a>
              </>
            ) : null}
          </>
        ) : (
          "No directory listing is linked."
        )}
      </p>
      <form className="flex flex-wrap items-end gap-2" data-testid="zcard-listing-search">
        <input type="hidden" name="tab" value="listing" />
        <label className="text-sm">
          Search listings <input name="q" defaultValue={q} className="field ml-1" placeholder="name or id" />
        </label>
        <button className="btn px-3 py-2 text-sm">Search</button>
      </form>
      {results && results.length > 0 && (
        <ul className="space-y-2" data-testid="zcard-listing-results">
          {results.slice(0, 20).map((r) => (
            <li
              key={r.listing_id}
              className="flex flex-wrap items-center gap-3 rounded border border-[#d0d4dc] p-3 text-sm"
            >
              <span>
                <strong>{r.name}</strong> <span className="font-mono">({r.listing_id})</span>
              </span>
              <form action={listingAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="op" value="link" />
                <input type="hidden" name="listing_id" value={r.listing_id} />
                <button className="text-[#0E7C86] underline">Link this listing</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <form
        action={listingAction}
        className="grid max-w-lg gap-3 rounded-lg border border-[#d0d4dc] p-4"
        data-testid="zcard-listing-link"
      >
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="op" value="link" />
        <label className="text-sm font-semibold">
          Listing id
          <input name="listing_id" defaultValue={listingId ?? ""} className="field mt-1 w-full" />
        </label>
        <button className="btn px-4 py-2">Link listing</button>
      </form>
      {listingId && (
        <form
          action={listingAction}
          className="grid max-w-lg gap-3 rounded-lg border border-[#E01820]/40 p-4"
          data-testid="zcard-listing-unlink"
        >
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="op" value="unlink" />
          <p className="text-sm">
            Unlink <strong>{listingId}</strong>? The listing itself stays published. Tick to confirm.
          </p>
          <label className="text-sm">
            <input type="checkbox" name="confirm" className="mr-2" /> I understand this only removes the link
          </label>
          <button className="btn px-4 py-2">Unlink listing</button>
        </form>
      )}
    </section>
  );
}
