import { publicCategories, publicIn } from "@/lib/public";
import { PublicNote } from "./PublicNote";

/** Free (unverified) listings from public information: name, category label, area and public contact only. */
export function PublicListings() {
  return (
    <section aria-labelledby="pub-h" data-testid="public-listings" id="public-results">
      <h2 id="pub-h" className="text-2xl font-bold text-ink">
        More GTA Filipino businesses (free listings)
      </h2>
      <div className="mt-3">
        <PublicNote />
      </div>
      {publicCategories.map((c) => {
        const ls = publicIn(c.slug);
        if (!ls.length) return null;
        return (
          <div key={c.slug} id={`pub-${c.slug}`} data-group={`pub-${c.slug}`} className="mt-6 scroll-mt-24">
            <h3 className="text-lg font-bold text-ink">
              <span aria-hidden="true">{c.icon}</span> {c.name}{" "}
              <span className="text-sm font-normal text-muted">({ls.length})</span>
            </h3>
            <ul className="mt-2 divide-y divide-sand rounded-xl border border-sand bg-white">
              {ls.map((l) => (
                <li
                  key={l.id}
                  data-public={l.id}
                  data-listing={l.id}
                  data-tier="free"
                  data-name={`${l.name} ${l.address ?? ""}`.toLowerCase()}
                  data-sub={l.category}
                  data-city={l.area}
                  data-langs=""
                  className="px-4 py-2.5 text-sm"
                >
                  <strong className="text-ink">{l.name}</strong>
                  <span className="text-muted">
                    {" "}
                    · {c.name} · {l.area}
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
          </div>
        );
      })}
    </section>
  );
}
