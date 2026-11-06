import Link from "next/link";
import { categories, type Section } from "@/lib/guide";
import { getPublicListings } from "@/lib/listingsRepo";
import type { PublicListing } from "@/lib/public";

const topAreas = (ls: PublicListing[], n = 3) => {
  const m = new Map<string, number>();
  for (const l of ls) if (l.area) m.set(l.area, (m.get(l.area) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
};

const ICONS: Record<string, string> = {
  "tax-accounting": "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h5",
  "insurance-financial": "M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z M9 12l2 2 4-4",
  "business-services": "M4 8h16v11H4z M9 8V5h6v3 M4 13h16",
  independents: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c1-4 4.5-6 8-6s7 2 8 6",
};

/**
 * Sub-category tiles for a live section, with counts from getPublicListings() (Neon, JSON fallback, cached
 * under tag "listings"). Public listings are filed at section level (e.g. "money-business"), so a summary
 * line shows the section total and top areas; tiles count listings filed under the sub-category slug.
 */
export async function CategoryTiles({ section }: { section: Section }) {
  const { listings } = await getPublicListings();
  const inSection = listings.filter((l) => l.category === section.slug || section.subcategories.includes(l.category));
  const top = topAreas(inSection, 5);
  // Sub-categories with no public listings are hidden (not deleted); they come back once a listing is filed there.
  const subs = categories.filter(
    (c) => section.subcategories.includes(c.slug) && listings.some((l) => l.category === c.slug),
  );
  return (
    <>
      <p className="mb-3 text-sm text-muted" data-testid="section-count">
        <Link
          href={`/?category=${encodeURIComponent(section.slug)}#results`}
          className="font-semibold text-turqdk underline"
        >
          {inSection.length} listings
        </Link>
        {" · "}
        {inSection.filter((l) => l.verified).length} verified
        {top.length > 0 && ` · ${top.map(([a, n]) => `${a} ${n}`).join(" · ")}`}
      </p>
      {subs.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="sub-tiles">
          {subs.map((c) => {
            const ls = listings.filter((l) => l.category === c.slug);
            const v = ls.filter((l) => l.verified).length;
            const top = topAreas(ls);
            return (
              <li key={c.slug}>
                <Link
                  href={`/directory/${c.slug}`}
                  className="card group flex h-full items-start gap-3 p-4 transition hover:border-turqdk hover:shadow-md"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-aqua text-turqdk"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    >
                      <path d={ICONS[c.slug] ?? ICONS.independents} />
                    </svg>
                  </span>
                  <span>
                    <strong className="block text-ink group-hover:text-sea">{c.name}</strong>
                    <span className="text-sm text-muted">
                      {ls.length} listings · {v} verified
                    </span>
                    {top.length > 0 && (
                      <span className="block text-xs text-muted" data-testid="tile-areas">
                        {top.map(([a, n]) => `${a} ${n}`).join(" · ")}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
