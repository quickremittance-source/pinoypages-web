import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { InquiryForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { ads, brand } from "@/lib/guide";
import { adSizes, ARTWORK_SPECS, BOOKING_NOTE, RATES_NOTE, type AdSize } from "@/lib/adSizes";

export const metadata: Metadata = { title: "Advertise", alternates: { canonical: "/advertise" } };

const SIZE_IDS = adSizes.map((s) => s.id) as string[];

/** Scale drawing of the ad on an 8.5 × 11 page (live area dashed). */
function SizeDiagram({ s }: { s: AdSize }) {
  const k = 12;
  const full = s.id === "full";
  const x = full ? 0 : s.box.x * k;
  const y = full ? 0 : s.box.y * k;
  return (
    <svg
      viewBox={`0 0 ${8.5 * k} ${11 * k}`}
      className="h-40 w-auto"
      role="img"
      aria-label={`${s.name} on an 8.5 by 11 inch page`}
      data-testid={`diagram-${s.id}`}
    >
      <rect x="0.5" y="0.5" width={8.5 * k - 1} height={11 * k - 1} fill="#fff" stroke="#1b2328" strokeWidth="1" />
      <rect
        x={0.5 * k}
        y={0.5 * k}
        width={7.5 * k}
        height={10 * k}
        fill="none"
        stroke="#94a3b8"
        strokeDasharray="3 3"
      />
      <rect
        x={x}
        y={y}
        width={(full ? 8.5 : s.box.w) * k}
        height={(full ? 11 : s.box.h) * k}
        fill="#c8102e"
        fillOpacity="0.85"
      />
    </svg>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ slot?: string; size?: string }> }) {
  const { slot, size } = await searchParams;
  const valid = ads.find((a) => a.id === slot)?.id;
  const chosen = size && SIZE_IDS.includes(size) ? size : undefined;
  const mail = `mailto:${brand.email}?subject=${encodeURIComponent("Print ad enquiry · Pinoy Pages 2026–2027")}`;
  return (
    <>
      <PageHead
        kicker="Advertise"
        title={`Advertise in ${brand.editionName}`}
        intro={`The Filipino Business Directory for the GTA, in print and online. ${BOOKING_NOTE} Four ad sizes: full page, half page, quarter page and business card.`}
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section aria-labelledby="sizes">
          <h2 id="sizes" className="text-2xl font-bold text-ink">
            Ad sizes
          </h2>
          <p className="mt-1 text-muted">Page trim 8.5″ × 11″. {RATES_NOTE}: ask us for the current rate card.</p>
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="ad-sizes">
            {adSizes.map((s) => (
              <li key={s.id} className="card flex flex-col p-5" data-size={s.id}>
                <div className="flex justify-center rounded-lg bg-sand/60 p-3">
                  <SizeDiagram s={s} />
                </div>
                <h3 className="mt-4 text-xl font-extrabold text-ink">{s.name}</h3>
                <p className="mt-1 text-sm font-semibold text-turqdk">{s.size}</p>
                <p className="mt-1 text-sm text-muted">{s.note}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
                  {s.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <p className="mt-auto pt-4 font-bold text-phred" data-testid="rate">
                  {RATES_NOTE}
                </p>
                <a className="btn mt-3 text-center" href={`/advertise?size=${s.id}#enquire`}>
                  Ask about a {s.name.toLowerCase()}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid gap-6 md:grid-cols-2" aria-label="Artwork and deadlines">
          <div className="rounded-2xl bg-aqua/60 p-6">
            <h2 className="text-xl font-bold text-ink">Artwork specifications</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5" data-testid="artwork-specs">
              {ARTWORK_SPECS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-sand p-6">
            <h2 className="text-xl font-bold text-ink">Deadlines</h2>
            <p className="mt-3" data-testid="deadlines">
              Booking and artwork deadlines for the 2026–2027 edition are to be announced. Enquire now to hold your
              size; we confirm every booking in writing before you are invoiced.
            </p>
            <p className="mt-3 text-sm text-muted">
              Every ad comes with a QR code to your page on the Pinoy Pages website, so readers can save your contact.
              We report scan counts; we do not guarantee results.
            </p>
          </div>
        </section>

        <section aria-labelledby="enquire-h" id="enquire" className="scroll-mt-24">
          <h2 id="enquire-h" className="mb-3 text-2xl font-bold text-ink">
            Book or ask about an ad{valid ? ` (space ${valid})` : ""}
          </h2>
          <p className="mb-4 text-muted">
            This form only sends us your details. We never take payment or ask for card details on this site; we send an
            invoice after confirming your booking. Prefer email?{" "}
            <a className="font-semibold text-turqdk underline" href={mail}>
              {brand.email}
            </a>
          </p>
          <InquiryForm slot={valid} size={chosen} />
        </section>

        <section aria-labelledby="verified-h" className="space-y-4">
          <h2 id="verified-h" className="text-2xl font-bold text-ink">
            Also available: Verified listing, $99 per year + HST
          </h2>
          <p className="rounded-xl bg-sand p-4">
            {brand.badgeRule} A listing gets you found. Verification gets you customers.
          </p>
          <PlanTable />
        </section>
      </div>
      <section aria-labelledby="spaces" className="mx-auto mt-10 max-w-5xl px-4">
        <h2 id="spaces" className="text-2xl font-bold text-ink">
          Online ad spaces (preview)
        </h2>
        <p className="mt-1 text-muted">Where ads can also appear on the website. Sold spaces below are SAMPLE ads.</p>
      </section>
      <AdGrid ads={ads} />
    </>
  );
}
