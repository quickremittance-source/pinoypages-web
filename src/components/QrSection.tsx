import Link from "next/link";
import type { Listing } from "@/lib/guide";
import { goUrl } from "@/lib/qr";

export const QR_USES = "one QR for your business cards, brochures, flyers, storefront signs and vehicle decals";

export function QrSection({ l }: { l: Listing }) {
  const paid = l.tier !== "free";
  const short = goUrl(l.id).replace(/^https?:\/\//, "");
  return (
    <section className="mt-6 rounded-2xl bg-white p-6" aria-labelledby="qr">
      <h2 id="qr" className="text-xl font-semibold text-sea">
        Your QR code
      </h2>
      <p className="mt-2">
        Use {QR_USES}. Every scan opens this listing through <strong>{short}</strong>, so scans are counted.
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from our own route */}
        <img
          src={`/qr/${l.id}/${paid ? "branded" : "basic"}.svg`}
          alt={`QR code for ${l.name}`}
          width={180}
          height={paid ? 224 : 180}
        />
        <ul className="space-y-2 font-bold">
          <li>
            <a className="text-sea underline" href={`/qr/${l.id}/basic.png`} download>
              Basic QR (PNG)
            </a>
          </li>
          <li>
            <a className="text-sea underline" href={`/qr/${l.id}/basic.svg`} download>
              Basic QR (SVG)
            </a>
          </li>
          {paid ? (
            <>
              <li>
                <a className="text-sea underline" href={`/qr/${l.id}/branded.png`} download>
                  Branded QR (PNG)
                </a>
              </li>
              <li>
                <a className="text-sea underline" href={`/qr/${l.id}/branded.svg`} download>
                  Branded QR (SVG)
                </a>
              </li>
              <li>
                <a className="text-sea underline" href={`/qr/${l.id}/branded.pdf`} download>
                  Print-ready label (PDF)
                </a>
              </li>
              <li className="font-normal">{l.tier === "qrkit" ? "QR Kit" : "QR Kit included"}: monthly scan count.</li>
            </>
          ) : (
            <li className="font-normal">
              Want a branded QR, print-ready files and a monthly scan count? Get the{" "}
              <Link className="font-bold text-coral-dk underline" href={`/upgrade?listing=${l.id}`}>
                QR Kit ($99/yr, $79 founding)
              </Link>{" "}
              — included with Featured and every ad.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
