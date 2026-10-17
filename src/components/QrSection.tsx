import Link from "next/link";
import type { Listing } from "@/lib/guide";
import { isPaid } from "@/lib/guide";
import { goUrl } from "@/lib/qr";

export const QR_USES = "one QR for your business cards, brochures, flyers, storefront signs and vehicle decals";

/** Paid tiers: branded QR + files + scan count. Free: upsell to Featured (no QR shown). */
export function QrSection({ l }: { l: Listing }) {
  if (!isPaid(l)) {
    return (
      <section className="mt-6 rounded-2xl bg-white p-6" aria-labelledby="qr">
        <h2 id="qr" className="text-xl font-semibold text-sea">
          Get your own QR code
        </h2>
        <p className="mt-2">
          Featured ($390/yr, $299 founding) gives you {QR_USES}, monthly scan and click counts, a Save contact button
          and a Verified badge.
        </p>
        <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
          Upgrade to Featured
        </Link>
      </section>
    );
  }
  const short = goUrl(l.id).replace(/^https?:\/\//, "");
  return (
    <section className="mt-6 rounded-2xl bg-white p-6" aria-labelledby="qr">
      <h2 id="qr" className="text-xl font-semibold text-sea">
        Your QR code
      </h2>
      <p className="mt-2">
        Use {QR_USES}. Every scan opens this listing through <strong>{short}</strong> and is counted in your monthly
        scan report.
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from our own route */}
        <img src={`/qr/${l.id}/qr.svg`} alt={`QR code for ${l.name}`} width={180} height={224} />
        <ul className="space-y-2 font-bold">
          <li>
            <a className="text-sea underline" href={`/qr/${l.id}/qr.png`} download>
              QR code (PNG)
            </a>
          </li>
          <li>
            <a className="text-sea underline" href={`/qr/${l.id}/qr.svg`} download>
              QR code (SVG)
            </a>
          </li>
          <li>
            <a className="text-sea underline" href={`/qr/${l.id}/qr.pdf`} download>
              Print-ready label (PDF)
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}
