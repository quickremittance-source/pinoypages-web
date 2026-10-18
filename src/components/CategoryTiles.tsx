import Link from "next/link";
import { categories, isVerified, listingsIn, type Section } from "@/lib/guide";

const ICONS: Record<string, string> = {
  "tax-accounting": "M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h5",
  "insurance-financial": "M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z M9 12l2 2 4-4",
  "business-services": "M4 8h16v11H4z M9 8V5h6v3 M4 13h16",
  independents: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c1-4 4.5-6 8-6s7 2 8 6",
};

/** Sub-category tiles for a live section, with counts. */
export function CategoryTiles({ section }: { section: Section }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {categories
        .filter((c) => section.subcategories.includes(c.slug))
        .map((c) => {
          const ls = listingsIn(c.slug);
          const v = ls.filter((l) => isVerified(l)).length;
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
                </span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
