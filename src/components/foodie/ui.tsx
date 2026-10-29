import Link from "next/link";
import type { ReactNode } from "react";
import { MAX_SLOTS_PER_PAGE, pickPlacement, SLOT_HEIGHT, type SlotSize } from "@/lib/foodie/zcard";
import type { Restaurant, Score } from "@/lib/foodie/data";
import { areaName } from "@/lib/foodie/areas";

export const FF = "/filipinofoodie";

export function AiBadge() {
  return (
    <span className="inline-block rounded bg-sea px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
      AI
    </span>
  );
}

/** "Sponsored · zcard" slot. Reserved height prevents layout shift. Index beyond the configured count renders nothing. */
export function ZcardSlot({
  slot,
  area = null,
  size = "banner",
  index = 0,
}: {
  slot: string;
  area?: string | null;
  size?: SlotSize;
  index?: number;
}) {
  if (index >= MAX_SLOTS_PER_PAGE) return null;
  const p = pickPlacement(area);
  return (
    <aside
      data-slot={slot}
      data-area={area ?? "gta"}
      aria-label="Sponsored"
      className={`card my-4 flex flex-col justify-center gap-1 border border-dashed border-turq p-4 ${SLOT_HEIGHT[size]}`}
    >
      <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Sponsored · zcard</p>
      {p ? (
        <>
          <p className="font-bold">{p.name}</p>
          <p className="text-sm">{p.tagline}</p>
          <Link className="btn mt-1 self-start px-3 py-1.5 text-sm" href={`${FF}/b/${p.zcardId}`}>
            View menu &amp; pre-order
          </Link>
        </>
      ) : (
        <>
          <p className="font-bold">Your business here</p>
          <p className="text-sm">
            Feature your Filipino restaurant, bakery or catering here
            {area ? ` in ${areaName(area)}` : " across the GTA"} with a zcard digital ad. Rates on request.
          </p>
          <Link className="mt-1 self-start text-sm font-semibold text-turqdk underline" href={`${FF}/claim`}>
            Learn about zcard placements
          </Link>
        </>
      )}
      <p className="text-[10px] text-muted">Digital card by ZCard</p>
    </aside>
  );
}

export function ScoreBars({ scores }: { scores: Record<string, Score | number> }) {
  const order = ["overall", "food", "value", "authenticity", "buzz"];
  const keys = Object.keys(scores).sort((a, b) => ((order.indexOf(a) + 99) % 99) - ((order.indexOf(b) + 99) % 99));
  return (
    <dl className="space-y-3">
      {keys.map((k) => {
        const v = scores[k];
        const [n, why] = Array.isArray(v) ? v : [Number(v), ""];
        return (
          <div key={k}>
            <dt className="flex justify-between text-sm font-semibold capitalize">
              <span>{k}</span>
              <span>{n}/10</span>
            </dt>
            <dd>
              <div className="h-2 rounded bg-sand" aria-hidden="true">
                <div className="h-2 rounded bg-turq" style={{ width: `${Math.max(0, Math.min(10, n)) * 10}%` }} />
              </div>
              {why ? <p className="mt-1 text-xs text-muted">{why}</p> : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <li className="card p-4">
      <Link href={`${FF}/restaurants/${r.slug}`} className="text-lg font-bold text-sea hover:underline">
        {r.name}
      </Link>
      <p className="text-sm text-muted">
        {[r.neighbourhood, r.city].filter(Boolean).join(" · ")}
        {r.area ? "" : " (outside listed GTA areas)"}
      </p>
      {r.overall != null ? (
        <p className="mt-1 text-sm">
          <AiBadge /> Overall {r.overall}/10
        </p>
      ) : null}
      {r.status.startsWith("open") ? null : (
        <p className="mt-1 text-xs text-muted">Not yet verified. Please call ahead.</p>
      )}
    </li>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="card p-6 text-muted">{children}</p>;
}

export function AreaChips({
  counts,
  active,
}: {
  counts: { slug: string; name: string; count: number }[];
  active?: string;
}) {
  const shown = counts.filter((c) => c.count > 0);
  if (!shown.length) return null;
  return (
    <ul className="flex gap-2 overflow-x-auto py-2 whitespace-nowrap" aria-label="GTA areas">
      {shown.map((c) => (
        <li key={c.slug}>
          <Link
            href={`${FF}/gta/${c.slug}`}
            className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${
              active === c.slug ? "border-sea bg-sea text-white" : "border-sand bg-white text-ink hover:bg-aqua"
            }`}
          >
            {c.name} <span className="opacity-70">{c.count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PageTitle({ title, intro }: { title: string; intro?: ReactNode }) {
  return (
    <header className="py-6">
      <h1 className="font-display text-3xl font-bold text-sea sm:text-4xl">{title}</h1>
      {intro ? <p className="mt-2 max-w-2xl text-muted">{intro}</p> : null}
    </header>
  );
}
