export function SimpleTable({ label, head, rows }: { label: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
      <table className="w-full bg-white text-left text-sm">
        <caption className="p-2 text-left font-semibold">{label}</caption>
        <thead className="bg-sea text-white">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="p-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="p-2 text-muted">
                No data yet.
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-sand">
              {r.map((c, j) => (
                <td key={j} className="p-2">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
