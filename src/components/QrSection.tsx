import Link from "next/link";
import type { Listing } from "@/lib/guide";
import { adMenu, brand, isFeatured, isPaid, money } from "@/lib/guide";
import { goUrl } from "@/lib/qr";

export const QR_USES = "one QR for your business cards, brochures, flyers, storefront signs and vehicle decals";
const verified = adMenu.find((o) => o.id === "verified")!;

/** Paid tiers: dynamic QR + files + scan count (+ counter card for Verified Plus and up). Free: upsell, no QR. */
export function QrSection({ l }: { l: Listing }) {
  if (!isPaid(l)) {
    return (
      <section className="mt-6 rounded-2xl bg-white p-6" aria-labelledby="qr">
        <h2 id="qr" className="text-xl font-semibold text-sea">
          Get Verified
        </h2>
        <p className="mt-2">
          Verified ({money(verified.price)} per issue) gives you a dynamic QR to your web page, a ZCard bridge page, a
          Save contact button and a monthly scan count, and makes you eligible for the Verified Kabayan badge.
        </p>
        <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
          Upgrade to Verified
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
        Use {QR_USES}. Every scan opens your ZCard bridge through <strong>{short}</strong> and is counted in your
        monthly scan report. {brand.qrLine}
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
          {isFeatured(l) && (
            <li>
              <a className="text-sea underline" href={`/qr/${l.id}/counter.pdf`} download>
                Counter card (PDF)
              </a>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
