import Link from "next/link";
import { adMenu, brand, dates, eventMenu, longDate, money, renewal, sponsors } from "@/lib/guide";

const main = adMenu.filter((o) => o.menu === "main");
const addons = adMenu.filter((o) => o.menu === "addon");

export function MirrorNote() {
  return (
    <div className="space-y-2 rounded-xl bg-aqua p-4 text-sea">
      <p className="font-bold">
        {brand.editionName} · {brand.seasons} · Annual edition. {brand.productNote} ✓ Website mirror included free with
        every choice.
      </p>
      <p>
        {brand.annualNote} {brand.mirrorNote} {brand.reportNote} {brand.printNote}
      </p>
    </div>
  );
}

export function PlanTable() {
  return (
    <div className="space-y-3">
      <MirrorNote />
      <div className="overflow-x-auto" role="region" aria-label="Listing and ad options" tabIndex={0}>
        <table className="w-full rounded-2xl bg-white text-left">
          <caption className="p-3 text-left text-sm">
            Prices in CAD, plus HST. Founding price for orders by {longDate(dates.earlyBirdEnds)}. Ads close{" "}
            {longDate(dates.adClose)}; the guide prints only once ads are paid. Three choices: Free, Featured, or an Ad
            (an Ad includes Featured). Paid tiers are 12-month terms that renew with each annual edition.
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
                Founding
              </th>
              <th scope="col" className="p-3">
                Online: your page (included free)
              </th>
              <th scope="col" className="p-3">
                QR code: the bridge
              </th>
              <th scope="col" className="p-3">
                Printed proof copy
              </th>
            </tr>
          </thead>
          <tbody>
            {main.map((o) => (
              <tr key={o.id} className="border-t border-sand">
                <th scope="row" className="p-3 text-sea">
                  {o.name}
                  {o.recommended && (
                    <span className="mt-1 block w-fit rounded bg-coral-dk px-2 py-0.5 text-xs text-white">
                      Most popular: Starter included
                    </span>
                  )}
                </th>
                <td className="p-3">
                  {money(o.price)}
                  {o.unit && <span className="block text-xs">{o.unit}</span>}
                </td>
                <td className="p-3 font-bold text-coral-dk">{money(o.founding)}</td>
                <td className="p-3">{o.web}</td>
                <td className="p-3">{o.qr}</td>
                <td className="p-3">{o.print}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        <strong>Founding price locked:</strong> {renewal.foundingLockNote.replace(/^Founding price locked: /, "")}{" "}
        {renewal.onTimeRule}{" "}
        <Link href="/terms" className="underline">
          Terms (draft)
        </Link>
      </p>
      <p className="text-sm" data-testid="addons">
        <strong>Add-ons</strong> (offered by our reps):{" "}
        {addons.map((o) => (
          <span key={o.id}>
            {o.name} {money(o.price)} ({money(o.founding)} founding) — branded QR, Save contact, monthly counts ·{" "}
          </span>
        ))}
        {eventMenu
          .filter((o) => o.price > 0)
          .map((o, i) => (
            <span key={o.id}>
              {i > 0 && " · "}
              {o.name} {money(o.price)}
              {o.founding !== o.price && ` (${money(o.founding)} founding)`}
              {o.memberFree && ", free for paying members"}
            </span>
          ))}
        . Free event listings on the{" "}
        <Link href="/calendar" className="underline">
          calendar
        </Link>
        .
      </p>
      <p className="text-sm">
        Invitation-only extras:{" "}
        {sponsors.map((s, i) => (
          <span key={s.id}>
            {i > 0 && " · "}
            {s.name} {money(s.price)}
          </span>
        ))}
        .
      </p>
    </div>
  );
}
