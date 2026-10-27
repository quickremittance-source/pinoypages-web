import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORY_TOOLS } from "@/components/CategoryTools";
import { PageHead } from "@/components/Chrome";
import { PublicListings } from "@/components/alt/PublicListings";
import { CategoryTiles } from "@/components/CategoryTiles";
import { DirectoryFilterForm } from "@/components/DirectoryFilterForm";
import { DirectoryPagination } from "@/components/DirectoryPagination";
import { directoryFilterOptions, filterPublicListings, paginateListings, parseDirectoryFilters } from "@/lib/directory";
import { brand, sections } from "@/lib/guide";

export const metadata: Metadata = { title: "Directory", alternates: { canonical: "/directory" } };

/** Directory index: server-filtered, paginated public listings. Category pages stay separate. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDirectoryFilters(await searchParams);
  const filtered = filterPublicListings(filters);
  const page = paginateListings(filtered, filters.page);
  const { categories, areas } = directoryFilterOptions();
  const formFilters = { ...filters, page: page.page };

  return (
    <>
      <PageHead
        kicker={`Directory · ${brand.region}`}
        title="Find a kabayan business you can trust"
        intro="Search by name, category or area. Verified businesses passed a visit and carry a mutual vouch; free listings are unverified."
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
                {CATEGORY_TOOLS[s.slug] && (
                  <>
                    {" "}
                    <Link href={`/directory/${s.slug}`} className="font-semibold text-turqdk underline">
                      Use the free tools now
                    </Link>
                  </>
                )}
              </p>
            )}
          </section>
        ))}
        <section aria-labelledby="all" className="space-y-6">
          <h2 id="all" className="sr-only">
            All listings
          </h2>
          <DirectoryFilterForm filters={formFilters} categories={categories} areas={areas} resultCount={page.total} />
          <PublicListings items={page.items} from={page.from} to={page.to} total={page.total} />
          <DirectoryPagination filters={formFilters} page={page.page} totalPages={page.totalPages} />
        </section>
      </div>
    </>
  );
}
