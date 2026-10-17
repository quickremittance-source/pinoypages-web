import { EVENT_LABEL, sum, type EventName, type ListingStats } from "@/lib/analytics/events";

const SHOW: EventName[] = ["view", "scan", "call", "map", "website", "tap"];

/** 12-month bar chart (server-rendered SVG, no JS) of total clicks + views per month, plus a table. */
export function StatsChart({ stats, months }: { stats: ListingStats; months: string[] }) {
  const totals = months.map((m) => SHOW.reduce((a, e) => a + (stats[m]?.[e] ?? 0), 0));
  const max = Math.max(1, ...totals);
  return (
    <div className="space-y-4">
      <svg viewBox="0 0 480 160" role="img" aria-label="Views and clicks per month, last 12 months" className="w-full">
        {totals.map((t, i) => {
          const h = (t / max) * 120;
          return (
            <g key={months[i]}>
              <rect x={i * 40 + 6} y={130 - h} width={28} height={h} rx={3} fill="#0B5E7A" />
              <text x={i * 40 + 20} y={126 - h} fontSize="10" textAnchor="middle">
                {t}
              </text>
              <text x={i * 40 + 20} y={148} fontSize="9" textAnchor="middle">
                {months[i]?.slice(2)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="overflow-x-auto" role="region" aria-label="Counts by type" tabIndex={0}>
        <table className="w-full bg-white text-left text-sm">
          <thead className="bg-sea text-white">
            <tr>
              <th scope="col" className="p-2">
                Count
              </th>
              <th scope="col" className="p-2">
                This month
              </th>
              <th scope="col" className="p-2">
                Last 12 months
              </th>
            </tr>
          </thead>
          <tbody>
            {SHOW.map((e) => (
              <tr key={e} className="border-t border-sand" data-event={e}>
                <th scope="row" className="p-2">
                  {EVENT_LABEL[e]}
                </th>
                <td className="p-2">{stats[months[11] ?? ""]?.[e] ?? 0}</td>
                <td className="p-2">{sum(stats, months, e)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
