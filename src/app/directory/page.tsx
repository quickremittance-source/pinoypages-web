import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { PublicListings } from "@/components/alt/PublicListings";
import { ListingResults } from "@/components/ListingResults";
import { CategoryTiles } from "@/components/CategoryTiles";
import { brand, listings, sections } from "@/lib/guide";
import { publicCategories, publicListings } from "@/lib/public";

export const metadata: Metadata = { title: "Directory", alternates: { canonical: "/directory" } };

/** One top-level category per section; sub-categories underneath. New categories are added in guide.json. */
export default function Page() {
  return (
    <>
      <PageHead
        kicker={`Directory · ${brand.region}`}
        title="Find a kabayan business you can trust"
        intro="Search by name, sub-category, city or language. Verified businesses passed a visit and carry a mutual vouch; free listings are unverified."
      />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        {sections.map((s) => (
          <section key={s.slug} aria-labelledby={`sec-${s.slug}`} data-section={s.slug} data-status={s.status}>
            <h2 id={`sec-${s.slug}`} className="flex flex-wrap items-center gap-2 text-2xl font-bold text-ink">
              Category: {s.name}
              {s.status === "coming" && (
                <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-bold text-ink">
                  {s.note ?? "Coming next edition"} · {s.edition}
                </span>
              )}
              {s.status === "live" && (
                <Link href={`/directory/${s.slug}`} className="text-sm font-semibold text-turqdk underline">
                  See all {s.name}
                </Link>
              )}
            </h2>
            {s.status === "live" ? (
              <div className="mt-4">
                <CategoryTiles section={s} />
              </div>
            ) : (
              <p className="mt-3 rounded-xl border-2 border-dashed border-ink/20 bg-white p-4 text-muted">
                Its own section in the {s.edition} edition. Not open for listings yet.
              </p>
            )}
          </section>
        ))}
        <section aria-labelledby="all">
          <h2 id="all" className="sr-only">
            All listings
          </h2>
          <ListingResults
            items={listings}
            extra={{
              target: "public-results",
              subs: publicCategories
                .filter((c) => publicListings.some((l) => l.category === c.slug))
                .map((c) => ({ value: c.slug, label: c.name })),
              cities: [...new Set(publicListings.map((l) => l.area))],
            }}
          />
        </section>
        <PublicListings />
      </div>
    </>
  );
}
