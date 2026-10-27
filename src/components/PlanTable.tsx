import Link from "next/link";
import { adMenu, brand, dates, longDate, money } from "@/lib/guide";

export function MirrorNote() {
  return (
    <div className="space-y-2 rounded-xl bg-aqua p-4 text-sea">
      <p className="font-bold">
        {brand.editionName} · {brand.seasons} · {brand.pilotLabel}. {brand.productNote} ✓ Website mirror included free
        with every choice.
      </p>
      <p>
        {brand.annualNote} {brand.mirrorNote} {brand.reportNote} {brand.printNote}
      </p>
    </div>
  );
}

/** The pilot menu: two tiers, Free and Verified ($99 one-time, everything included). No add-ons or bundles. */
export function PlanTable() {
  return (
    <div className="space-y-3">
      <MirrorNote />
      <p className="rounded-xl border-l-4 border-phred bg-white p-4 font-bold" data-testid="badge-rule">
        {brand.badgeRule}
      </p>
      <section
        className="rounded-xl border-l-4 border-turqdk bg-white p-4"
        data-testid="keep-rules"
        aria-labelledby="keeph"
      >
        <h3 id="keeph" className="font-bold text-sea">
          Keeping your badge
        </h3>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {brand.keepRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
      <div className="overflow-x-auto" role="region" aria-label="Listing options" tabIndex={0}>
        <table className="w-full rounded-2xl bg-white text-left">
          <caption className="p-3 text-left text-sm">
            Verified is a one-time fee, in CAD, plus applicable HST. Listings close {longDate(dates.adClose)}. Two
            choices: Free, or Verified with everything included. {brand.adsNote}
          </caption>
          <thead className="bg-sea text-white">
            <tr>
              <th scope="col" className="p-3">
                Option
              </th>
              <th scope="col" className="p-3">
                Price
              </th>
              <th scope="col" className="p-3">
                Online: your page (included free)
              </th>
              <th scope="col" className="p-3">
                QR code + ZCard
              </th>
              <th scope="col" className="p-3">
                Verified Kabayan badge
              </th>
              <th scope="col" className="p-3">
                Printed proof copy
              </th>
            </tr>
          </thead>
          <tbody>
            {adMenu.map((o) => (
              <tr key={o.id} className="border-t border-sand" data-plan={o.id}>
                <th scope="row" className="p-3 text-sea">
                  {o.name}
                  {o.recommended && (
                    <span className="mt-1 block w-fit rounded bg-coral-dk px-2 py-0.5 text-xs text-white">
                      Everything included
                    </span>
                  )}
                </th>
                <td className="p-3">
                  {money(o.price)}
                  {o.unit && <span className="block text-xs">{o.unit}</span>}
                </td>
                <td className="p-3">{o.web}</td>
                <td className="p-3">{o.qr}</td>
                <td className="p-3">{o.badge}</td>
                <td className="p-3">{o.print}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        {brand.qrLine}{" "}
        <Link href="/terms" className="underline">
          Terms (draft)
        </Link>
      </p>
    </div>
  );
}
