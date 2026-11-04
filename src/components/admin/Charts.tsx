/** Lightweight server-rendered charts: inline SVG + CSS only, no chart library. Brand: navy, red, teal. */
export const BRAND = { navy: "#002050", red: "#E01820", teal: "#0E7C86" };
type Pt = { day: string; n: number };

export function Bars({ data, label, color = BRAND.teal, height = 80 }: { data: Pt[]; label: string; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.n));
  const w = Math.max(data.length, 1);
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${w * 10} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className="h-20 w-full" data-testid="chart">
        {data.map((d, i) => {
          const h = (d.n / max) * (height - 2);
          return (
            <rect key={d.day} x={i * 10 + 1} y={height - h} width={8} height={Math.max(h, d.n ? 1 : 0)} fill={color}>
              <title>{`${d.day}: ${d.n}`}</title>
            </rect>
          );
        })}
        <line x1="0" y1={height - 0.5} x2={w * 10} y2={height - 0.5} stroke="#d0d4dc" strokeWidth="1" />
      </svg>
      <figcaption className="flex justify-between text-[11px] text-[#5b6475]">
        <span>{data[0]?.day}</span>
        <span>{data.at(-1)?.day}</span>
      </figcaption>
    </figure>
  );
}

export function Stat({ label, value, id }: { label: string; value: number; id: string }) {
  return (
    <div className="rounded-lg border border-[#d0d4dc] bg-white p-4" data-testid={`stat-${id}`}>
      <dt className="text-xs font-bold uppercase tracking-wide text-[#0E7C86]">{label}</dt>
      <dd className="mt-1 text-3xl font-bold text-[#002050]">{value.toLocaleString("en-CA")}</dd>
    </div>
  );
}

export function BarList({ title, rows, empty = "No data in this range yet." }: { title: string; rows: { label: string; n: number }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <section className="rounded-lg border border-[#d0d4dc] bg-white p-4">
      <h3 className="mb-2 text-sm font-bold text-[#002050]">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-[#5b6475]">{empty}</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.label} className="relative">
              <span className="absolute inset-y-0 left-0 rounded bg-[#0E7C86]/15" style={{ width: `${(r.n / max) * 100}%` }} aria-hidden="true" />
              <span className="relative flex justify-between gap-2 px-1">
                <span className="truncate">{r.label}</span>
                <span className="font-bold text-[#002050]">{r.n.toLocaleString("en-CA")}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RangePicker({ days, base, extra = {} }: { days: number; base: string; extra?: Record<string, string> }) {
  return (
    <nav aria-label="Date range" className="flex gap-2 text-sm">
      {[7, 30, 90].map((d) => {
        const q = new URLSearchParams({ ...extra, days: String(d) }).toString();
        return (
          <a
            key={d}
            href={`${base}?${q}`}
            aria-current={d === days ? "page" : undefined}
            className={`rounded px-3 py-1 font-bold ${d === days ? "bg-[#002050] text-white" : "border border-[#002050] text-[#002050]"}`}
          >
            {d} days
          </a>
        );
      })}
    </nav>
  );
}

/** Wrapper with Hana brand-sheet basics: white background, Arial/Helvetica. */
export function DashShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 bg-white px-4 py-8" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      {children}
    </div>
  );
}
