import Link from "next/link";
import type { DirectoryFilters } from "@/lib/directory";
import { directoryHref } from "@/lib/directory";

/** Server-rendered GET form for /directory. Filters and page are shareable via the URL. */
export function DirectoryFilterForm({
  filters,
  categories,
  areas,
  resultCount,
}: {
  filters: DirectoryFilters;
  categories: { value: string; label: string }[];
  areas: string[];
  resultCount: number;
}) {
  const sel = "field mt-1 py-2";
  const active = !!(filters.q || filters.category || filters.area);
  return (
    <form
      key={`${filters.q}|${filters.category}|${filters.area}`}
      role="search"
      aria-label="Search the directory"
      action="/directory"
      method="get"
      className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <label className="col-span-2 block text-sm font-semibold lg:col-span-1">
        Business name
        <input
          className={sel}
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="e.g. bakery"
          autoComplete="off"
        />
      </label>
      {categories.length > 1 && (
        <label className="col-span-2 block text-sm font-semibold lg:col-span-1">
          Category
          <select className={sel} name="category" defaultValue={filters.category}>
            <option value="">All</option>
            {categories.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block text-sm font-semibold">
        Area
        <select className={sel} name="area" defaultValue={filters.area}>
          <option value="">All areas</option>
          {areas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <div className="col-span-2 flex items-center gap-3 lg:col-span-1">
        <button type="submit" className="btn px-4 py-2 text-sm">
          Search
        </button>
        {active ? (
          <Link href={directoryHref({})} className="btn btn-ghost px-3 py-2 text-sm">
            Clear
          </Link>
        ) : (
          <span className="btn btn-ghost pointer-events-none px-3 py-2 text-sm opacity-50" aria-disabled="true">
            Clear
          </span>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="col-span-2 text-sm text-muted lg:col-span-4"
        data-testid="search-count"
      >
        {resultCount === 0
          ? "No businesses match. Try another area or category."
          : `${resultCount} business${resultCount === 1 ? "" : "es"} found`}
      </p>
    </form>
  );
}
