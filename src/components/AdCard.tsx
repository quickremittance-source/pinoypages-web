import Link from "next/link";
import type { Ad } from "@/lib/guide";

/** Renders a print ad slot as a web card. Full pages span the row; half pages sit two-up. */
export function AdCard({ ad }: { ad: Ad }) {
  const full = ad.size === "full";
  const cls = `rounded-2xl border-2 p-6 ${full ? "md:col-span-2 min-h-48" : "min-h-32"}`;
  if (ad.status !== "sold") {
    return (
      <aside aria-label={`Ad space ${ad.id}`} className={`${cls} border-dashed border-turqdk bg-white text-center`}>
        <p className="kicker">{full ? "Full-page" : "Half-page"} ad space available</p>
        <p className="mt-2 font-display text-xl text-sea">
          Your business here — on this page, with a QR to your listing
        </p>
        <Link className="btn mt-4" href={`/advertise?slot=${ad.id}`}>
          Reserve this spot
        </Link>
      </aside>
    );
  }
  return (
    <aside aria-label={`Advertisement: ${ad.advertiser}`} className={`${cls} relative border-sunset bg-sand pr-32`}>
      {ad.listing && (
        // QR built into a fixed corner, same as the printed ad.
        // eslint-disable-next-line @next/next/no-img-element -- static SVG from our own route
        <img
          src={`/qr/${ad.listing}/qr.svg`}
          alt={`QR code for ${ad.advertiser}`}
          width={96}
          height={119}
          className="absolute right-4 top-4"
        />
      )}
      <p className="kicker">{ad.sample ? "Sample advertisement" : "Advertisement"}</p>
      <p className="mt-1 font-display text-2xl text-sea">{ad.headline}</p>
      <p className="mt-2">{ad.body}</p>
      {ad.listing ? (
        <a className="btn mt-4" href={`/go/${ad.listing}?via=tap`} rel="sponsored">
          Tap to open {ad.advertiser}
        </a>
      ) : (
        ad.url && (
          <a className="btn mt-4" href={ad.url} rel="sponsored noopener">
            Visit {ad.advertiser}
          </a>
        )
      )}
    </aside>
  );
}

export function AdGrid({ ads }: { ads: Ad[] }) {
  if (!ads.length) return null;
  return (
    <div className="mx-auto mt-10 grid max-w-5xl gap-4 px-4 md:grid-cols-2">
      {ads.map((a) => (
        <AdCard key={a.id} ad={a} />
      ))}
    </div>
  );
}
