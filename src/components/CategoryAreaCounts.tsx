import Link from "next/link";
import { publicCategories, type PublicListing } from "@/lib/public";

/** Pure: counts per category with a per-area breakdown, plus area totals. */
export function categoryAreaCounts(listings: PublicListing[]) {
  const by = new Map<string, Map<string, number>>();
  const areas = new Map<string, number>();
  for (const l of listings) {
    const a = l.area || "Other";
    const m = by.get(l.category) ?? new Map<string, number>();
    m.set(a, (m.get(a) ?? 0) + 1);
    by.set(l.category, m);
    areas.set(a, (areas.get(a) ?? 0) + 1);
  }
  const sortDesc = (m: Map<string, number>) => [...m].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0]));
  return {
    categories: publicCategories
      .filter((c) => by.has(c.slug))
      .map((c) => {
        const m = by.get(c.slug)!;
        return { slug: c.slug, name: c.name, total: [...m.values()].reduce((s, n) => s + n, 0), areas: sortDesc(m) };
      }),
    areas: sortDesc(areas),
  };
}

const q = (o: Record<string, string>) => `/?${new URLSearchParams(o).toString()}#results`;

/**
 * Category counters with area counts. Computed from the same cached listing set the directory already loaded
 * (Neon public_listings_v via listingsRepo, 1h cache, JSON fallback): no extra query.
 */
export function CategoryAreaCounts({ listings }: { listings: PublicListing[] }) {
  const { categories, areas } = categoryAreaCounts(listings);
  if (!categories.length) return null;
  return (
    <section aria-labelledby="by-cat-area" data-testid="cat-area-counts">
      <h2 id="by-cat-area" className="text-2xl font-bold text-ink">
        Listings by category and area
      </h2>
      <p className="mt-2 text-sm">
        <span className="font-semibold">All areas:</span>{" "}
        {areas.map(([a, n], i) => (
          <span key={a}>
            {i > 0 && " · "}
            <Link href={q({ area: a })} className="text-turqdk underline" data-area={a}>
              {a} ({n})
            </Link>
          </span>
        ))}
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <li key={c.slug} className="card p-4" data-cat={c.slug}>
            <Link href={q({ category: c.slug })} className="font-bold text-ink hover:underline">
              {c.name} <span className="font-normal text-muted">({c.total})</span>
            </Link>
            <p className="mt-1 text-sm text-muted">
              {c.areas.map(([a, n], i) => (
                <span key={a}>
                  {i > 0 && " · "}
                  <Link
                    href={q({ category: c.slug, area: a })}
                    className="hover:underline"
                    data-cat-area={`${c.slug}|${a}`}
                  >
                    {a} {n}
                  </Link>
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
