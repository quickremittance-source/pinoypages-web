import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdBeacon, AdLink } from "@/components/AdBeacon";
import {
  adBySlug,
  adLandings,
  adStatId,
  mapsUrl,
  TIER_LABEL,
  TIER_PHOTOS,
  VERIFIED_LABEL,
  type AdLanding,
} from "@/lib/adLanding";

function VerifiedBadge({ v }: { v: NonNullable<AdLanding["verified"]> }) {
  return (
    <span
      data-testid="verified-badge"
      className="inline-flex items-center gap-1 rounded-full bg-green-700 px-2.5 py-0.5 text-xs font-bold text-white"
    >
      <span aria-hidden="true">✅</span> {VERIFIED_LABEL[v]}
    </span>
  );
}

export const dynamicParams = false;
export function generateStaticParams() {
  return adLandings.map((a) => ({ slug: a.slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const a = adBySlug(slug);
  // Always noindex: QR landing pages are for people holding the printed ad, not for search.
  return {
    title: a ? (a.tier === "zcard" ? `Pinoy Pages zcard · ${a.name}` : a.name) : "Ad",
    robots: { index: false, follow: false },
    alternates: { canonical: `/ad/${slug}` },
  };
}

function Photo({ i, big }: { i: number; big?: boolean }) {
  return (
    <div
      role="img"
      aria-label={`Placeholder photo ${i + 1}`}
      className={`pinstripe-bg flex items-center justify-center rounded-xl bg-aqua text-sm font-semibold text-turqdk ${big ? "aspect-[16/9]" : "aspect-square"}`}
    >
      Photo {i + 1} (placeholder)
    </div>
  );
}

function Buttons({ a, id }: { a: AdLanding; id: string }) {
  const b = "btn w-full";
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="ad-buttons">
      {a.features.callButton && (
        <AdLink id={id} event="call" href={`tel:${a.phone}`} className={b}>
          Call
        </AdLink>
      )}
      {a.whatsapp && (
        <AdLink id={id} event="tap" href={`https://wa.me/${a.whatsapp}`} className={`${b} btn-teal`}>
          WhatsApp
        </AdLink>
      )}
      <AdLink id={id} event="map" href={mapsUrl(a.mapQuery)} className={`${b} btn-ghost`}>
        Directions
      </AdLink>
      {a.website && (
        <AdLink id={id} event="website" href={a.website} className={`${b} btn-ghost`}>
          Website
        </AdLink>
      )}
    </div>
  );
}

function MapEmbed({ q }: { q: string }) {
  return (
    <iframe
      title="Map"
      data-testid="ad-map"
      className="aspect-[4/3] w-full rounded-xl border border-sand"
      loading="lazy"
      src={`https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=12&output=embed`}
    />
  );
}

/** QR ad landing page: full, half, quarter or business-card tier. Not linked from nav, magazine or sitemap. */
export default async function Page({ params }: P) {
  const { slug } = await params;
  const a = adBySlug(slug);
  if (!a) notFound();
  const id = adStatId(a.slug);
  const photos = Math.min(a.photos, TIER_PHOTOS[a.tier]);
  const rich = a.tier === "full" || a.tier === "half";
  return (
    <div className="min-h-[70vh] bg-aqua/40 px-3 py-5 sm:py-10" data-tier={a.tier}>
      <AdBeacon id={id} />
      <article className="card mx-auto max-w-md space-y-5 p-5">
        <header>
          <p className="kicker">
            {a.tier === "zcard" ? TIER_LABEL.zcard : `${TIER_LABEL[a.tier]} ad`}{" "}
            {a.demo && (
              <span className="sample-chip ml-1" data-testid="demo-chip">
                DEMO
              </span>
            )}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{a.name}</h1>
          {a.verified && (
            <p className="mt-2">
              <VerifiedBadge v={a.verified} />
            </p>
          )}
          {a.tagline && <p className="mt-1 text-muted">{a.tagline}</p>}
        </header>

        {photos > 0 && (
          <section aria-label="Photos" data-testid="ad-photos">
            {a.tier === "full" ? (
              <div className="space-y-2">
                <Photo i={0} big />
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: photos - 1 }, (_, i) => (
                    <Photo key={i} i={i + 1} />
                  ))}
                </div>
              </div>
            ) : a.tier === "half" ? (
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: photos }, (_, i) => (
                  <Photo key={i} i={i} />
                ))}
              </div>
            ) : (
              <Photo i={0} big />
            )}
          </section>
        )}

        {a.offer && a.tier !== "zcard" && (
          <section className="rounded-xl border-l-4 border-phred bg-sand/60 p-4" data-testid="ad-offer">
            <h2 className="text-sm font-bold uppercase tracking-wider text-phred">Offer</h2>
            <p className="mt-1">{a.offer}</p>
          </section>
        )}

        {rich && a.services.length > 0 && (
          <section data-testid="ad-services">
            <h2 className="text-lg font-bold">{a.tier === "full" ? "Services and menu" : "Services"}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {a.services.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        )}

        {a.tier === "zcard" ? (
          <div className="grid grid-cols-1 gap-2" data-testid="ad-buttons">
            {a.features.callButton && (
              <AdLink id={id} event="call" href={`tel:${a.phone}`} className="btn w-full">
                Call
              </AdLink>
            )}
            {a.features.saveContact && (
              <AdLink id={id} event="tap" href={`/ad/vcard/${a.slug}.vcf`} className="btn btn-teal w-full" download>
                Save contact
              </AdLink>
            )}
            <AdLink id={id} event="map" href={mapsUrl(a.mapQuery)} className="btn btn-ghost w-full">
              Map
            </AdLink>
          </div>
        ) : (
          <Buttons a={a} id={id} />
        )}

        {rich && <MapEmbed q={a.mapQuery} />}

        <footer className="space-y-1 border-t border-sand pt-3 text-center text-sm text-muted">
          {a.listingId ? (
            <p>
              <Link href={`/listing/${a.listingId}`} className="font-semibold text-turqdk underline">
                See the full listing on Pinoy Pages
              </Link>
            </p>
          ) : (
            a.tier === "full" && (
              <p data-testid="ad-listing-link">
                <Link href="/directory" className="font-semibold text-turqdk underline">
                  Browse the Pinoy Pages directory
                </Link>
              </p>
            )
          )}
          <p>
            Advertise on Pinoy Pages:{" "}
            <Link href="/advertise" className="underline">
              Rates on request
            </Link>
          </p>
        </footer>
      </article>
    </div>
  );
}
