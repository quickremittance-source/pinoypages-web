import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { adMenu, brand, money, terms } from "@/lib/guide";

export const metadata: Metadata = { title: "Advertiser terms (draft)", alternates: { canonical: "/terms" } };

export default function Page() {
  const paid = adMenu.filter((o) => o.price > 0);
  return (
    <>
      <PageHead kicker={brand.editionLabel} title="Advertiser terms (draft)" intro={brand.annualNote} />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <ol className="list-decimal space-y-2 pl-6">
          {terms.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <table className="w-full rounded-2xl bg-white text-left">
          <caption className="p-3 text-left text-sm">Verified is billed yearly, in CAD, plus applicable HST.</caption>
          <thead className="bg-sea text-white">
            <tr>
              <th scope="col" className="p-3">
                Tier
              </th>
              <th scope="col" className="p-3">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {paid.map((o) => (
              <tr key={o.id} className="border-t border-sand">
                <th scope="row" className="p-3">
                  {o.name}
                </th>
                <td className="p-3">{money(o.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
