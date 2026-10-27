import { publicCategories, type PublicListing } from "@/lib/public";
import Link from "next/link";
import { PublicNote } from "./PublicNote";
import { bizPath } from "@/lib/seo";

const catName = (slug: string) => publicCategories.find((c) => c.slug === slug)?.name ?? slug;
const catIcon = (slug: string) => publicCategories.find((c) => c.slug === slug)?.icon ?? "";

/** Free (unverified) listings from public information: name, category label, area and public contact only. */
export function PublicListings({
  items,
  from,
  to,
  total,
}: {
  items: PublicListing[];
  from: number;
  to: number;
  total: number;
}) {
  return (
    <section aria-labelledby="pub-h" data-testid="public-listings" id="public-results">
      <h2 id="pub-h" className="text-2xl font-bold text-ink">
        More GTA Filipino businesses (free listings)
      </h2>
      <div className="mt-3">
        <PublicNote />
      </div>
      {total === 0 ? (
        <p
          role="status"
          data-testid="directory-empty"
          className="mt-6 rounded-xl border-2 border-dashed border-ink/20 bg-white p-6 text-muted"
        >
          No businesses match these filters. Clear the search or try another area or category.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted" data-testid="directory-range">
            Showing {from}–{to} of {total}
          </p>
          <ul className="mt-2 divide-y divide-sand rounded-xl border border-sand bg-white" data-testid="public-list">
            {items.map((l) => (
              <li
                key={l.id}
                data-public={l.id}
                data-listing={l.id}
                data-listing-id={l.listing_id}
                data-tier="free"
                data-name={`${l.name} ${l.address ?? ""}`.toLowerCase()}
                data-sub={l.category}
                data-category={l.category}
                data-city={l.area}
                data-area={l.area}
                data-langs=""
                className="px-4 py-2.5 text-sm"
              >
                <Link href={bizPath(l)} className="font-bold text-ink underline">
                  {l.name}
                </Link>
                <span className="text-muted">
                  {" "}
                  · <span aria-hidden="true">{catIcon(l.category)} </span>
                  {catName(l.category)} · {l.area}
                  {l.address ? ` · ${l.address}` : ""}
                </span>
                {l.phone && (
                  <>
                    {" · "}
                    <a href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`} className="text-turqdk underline">
                      {l.phone}
                    </a>
                  </>
                )}
                {l.email && (
                  <>
                    {" · "}
                    <a href={`mailto:${l.email}`} className="text-turqdk underline">
                      Email<span className="sr-only"> {l.name}</span>
                    </a>
                  </>
                )}
                {l.website && (
                  <>
                    {" · "}
                    <a href={l.website} rel="nofollow noopener" className="text-turqdk underline">
                      Website<span className="sr-only"> for {l.name}</span>
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
