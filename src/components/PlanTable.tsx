import { adMenu, dates, longDate, money } from "@/lib/guide";

export function PlanTable() {
  return (
    <div className="overflow-x-auto" role="region" aria-label="Listing and ad options" tabIndex={0}>
      <table className="w-full rounded-2xl bg-white text-left">
        <caption className="p-3 text-left text-sm">
          Prices in CAD, plus HST. Founding price for orders by {longDate(dates.earlyBirdEnds)}. Ads close{" "}
          {longDate(dates.adClose)}; the guide prints only once ads are paid.
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
              In print
            </th>
            <th scope="col" className="p-3">
              On the website
            </th>
          </tr>
        </thead>
        <tbody>
          {adMenu.map((o) => (
            <tr key={o.id} className="border-t border-sand">
              <th scope="row" className="p-3 text-sea">
                {o.name}
              </th>
              <td className="p-3">{money(o.price)}</td>
              <td className="p-3 font-bold text-coral-dk">{money(o.founding)}</td>
              <td className="p-3">{o.print}</td>
              <td className="p-3">{o.web}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
