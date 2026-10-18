import { DirectorySearch } from "@/components/DirectorySearch";
import { ListingCard } from "@/components/ListingCard";
import { categories, langsOf, sortListings, type Listing } from "@/lib/guide";

/** Search bar + Verified cards + Free text lines for a set of listings (directory, category, sub-category). */
export function ListingResults({ items, showSubFilter = true }: { items: Listing[]; showSubFilter?: boolean }) {
  const sorted = sortListings(items);
  const verified = sorted.filter((l) => l.tier === "verified");
  const free = sorted.filter((l) => l.tier === "free");
  const subs = categories
    .filter((c) => items.some((l) => l.category === c.slug))
    .map((c) => ({ value: c.slug, label: c.name }));
  const cities = [...new Set(items.map((l) => l.area))].sort();
  const langs = [...new Set(items.flatMap(langsOf))].sort((a, b) =>
    a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b),
  );
  return (
    <div className="space-y-6">
      <DirectorySearch target="results" subs={showSubFilter ? subs : undefined} cities={cities} languages={langs} />
      <div id="results" className="space-y-8">
        {verified.length > 0 && (
          <section data-group="verified" aria-labelledby="g-verified">
            <h2 id="g-verified" className="mb-3 text-xl font-bold text-ink">
              Verified businesses
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {verified.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </ul>
          </section>
        )}
        {free.length > 0 && (
          <section data-group="free" aria-labelledby="g-free">
            <h2 id="g-free" className="mb-1 text-xl font-bold text-ink">
              Free listings <span className="text-sm font-medium text-muted">· unverified, name and contact only</span>
            </h2>
            <ul className="card px-4">
              {free.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
