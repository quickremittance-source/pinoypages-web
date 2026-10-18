import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ListingResults } from "@/components/ListingResults";
import { categories, listings, listingsIn, sections } from "@/lib/guide";

export const dynamicParams = false;
/** One route for both levels: a live section (/directory/money-business) or a sub-category (/directory/tax-accounting). */
export function generateStaticParams() {
  return [...sections.filter((s) => s.status === "live").map((s) => s.slug), ...categories.map((c) => c.slug)].map(
    (category) => ({ category }),
  );
}
type P = { params: Promise<{ category: string }> };
const find = (slug: string) => {
  const section = sections.find((s) => s.slug === slug && s.status === "live");
  const sub = categories.find((x) => x.slug === slug);
  return { section, sub };
};
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category } = await params;
  const { section, sub } = find(category);
  return { title: section?.name ?? sub?.name, alternates: { canonical: `/directory/${category}` } };
}

export default async function Page({ params }: P) {
  const { category } = await params;
  const { section, sub } = find(category);
  if (section) {
    const items = listings.filter((l) => section.subcategories.includes(l.category));
    return (
      <>
        <PageHead kicker="Directory · Category" title={section.name} intro={`Every sub-category in ${section.name}.`} />
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
          <CategoryTiles section={section} />
          <ListingResults items={items} />
        </div>
      </>
    );
  }
  if (!sub) notFound();
  const parent = sections.find((s) => s.subcategories.includes(sub.slug));
  return (
    <>
      <PageHead
        kicker={`Directory · ${parent ? parent.name : "Category"} · Sub-category`}
        page={sub.page}
        title={sub.name}
      >
        <nav aria-label="Breadcrumb" className="mt-3 text-sm">
          <Link href="/directory" className="text-turqdk underline">
            Directory
          </Link>
          {parent && (
            <>
              {" / "}
              <Link href={`/directory/${parent.slug}`} className="text-turqdk underline">
                {parent.name}
              </Link>
            </>
          )}
          {" / "}
          <span aria-current="page">{sub.name}</span>
        </nav>
      </PageHead>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="mb-4 text-sm text-muted">
          Businesses marked SAMPLE are fictional, shown until real listings are verified.
        </p>
        <ListingResults items={listingsIn(sub.slug)} showSubFilter={false} />
      </div>
    </>
  );
}
