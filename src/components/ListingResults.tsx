import Link from "next/link";
import { DirectorySearch } from "@/components/DirectorySearch";
import { ListingCard } from "@/components/ListingCard";
import { badgeState, categories, langsOf, sortListings, type Listing } from "@/lib/guide";

/** Search bar + Verified cards + Free text lines for a set of listings (directory, category, sub-category). */
export function ListingResults({
  items,
  showSubFilter = true,
  subLabel = "",
}: {
  items: Listing[];
  showSubFilter?: boolean;
  /** Sub-category name for the "Be the first Verified … in your area" prompt (sub-category pages). */
  subLabel?: string;
}) {
  const anyActive = items.some((l) => badgeState(l) === "active");
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
        <aside
          data-first-cta
          data-sub={subLabel}
          hidden={anyActive}
          aria-label="Be the first Verified business"
          className="card flex flex-wrap items-center justify-between gap-3 border-2 border-dashed border-phred/50 p-5"
        >
          <p className="font-semibold text-ink">
            Be the first Verified <span data-first-sub>{subLabel ? `${subLabel} business` : "business"}</span>{" "}
            <span data-first-city>in your area</span>.
            <span className="block text-sm font-normal text-muted">
              Listing is free. Verified is $199 per issue and the badge is earned at a short visit.
            </span>
          </p>
          <span className="flex flex-wrap gap-2">
            <Link href="/get-verified" className="btn px-4 py-2 text-sm">
              Get Verified
            </Link>
            <Link href="/list-free" className="btn btn-ghost px-4 py-2 text-sm">
              List free
            </Link>
          </span>
        </aside>
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
