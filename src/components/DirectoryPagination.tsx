import Link from "next/link";
import type { DirectoryFilters } from "@/lib/directory";
import { directoryHref } from "@/lib/directory";

/** Accessible prev/next and page-number links for /directory. */
export function DirectoryPagination({
  filters,
  page,
  totalPages,
}: {
  filters: Pick<DirectoryFilters, "q" | "category" | "area">;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages);
  const base = { q: filters.q, category: filters.category, area: filters.area };
  return (
    <nav
      aria-label="Directory pages"
      className="flex flex-wrap items-center justify-center gap-2 pt-2"
      data-testid="directory-pagination"
    >
      {page > 1 ? (
        <Link
          href={directoryHref({ ...base, page: page - 1 })}
          className="btn btn-ghost px-3 py-1.5 text-sm"
          rel="prev"
          aria-label={`Previous page, page ${page - 1}`}
        >
          Previous
        </Link>
      ) : (
        <span className="btn btn-ghost pointer-events-none px-3 py-1.5 text-sm opacity-50" aria-disabled="true">
          Previous
        </span>
      )}
      <ul className="flex flex-wrap items-center gap-1">
        {pages.map((p, i) =>
          p === "…" ? (
            <li key={`e-${i}`} className="px-1 text-muted" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={p}>
              {p === page ? (
                <span className="btn px-3 py-1.5 text-sm" aria-current="page">
                  {p}
                </span>
              ) : (
                <Link
                  href={directoryHref({ ...base, page: p })}
                  className="btn btn-ghost px-3 py-1.5 text-sm"
                  aria-label={`Go to page ${p}`}
                >
                  {p}
                </Link>
              )}
            </li>
          ),
        )}
      </ul>
      {page < totalPages ? (
        <Link
          href={directoryHref({ ...base, page: page + 1 })}
          className="btn btn-ghost px-3 py-1.5 text-sm"
          rel="next"
          aria-label={`Next page, page ${page + 1}`}
        >
          Next
        </Link>
      ) : (
        <span className="btn btn-ghost pointer-events-none px-3 py-1.5 text-sm opacity-50" aria-disabled="true">
          Next
        </span>
      )}
    </nav>
  );
}

function pageWindow(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, page, page - 1, page + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
