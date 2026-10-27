import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { CategoryTiles } from "@/components/CategoryTiles";
import { ListingResults } from "@/components/ListingResults";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { CATEGORY_TOOLS, CategoryTools } from "@/components/CategoryTools";
import { categories, listings, listingsIn, sections } from "@/lib/guide";

export const dynamicParams = false;
export const revalidate = 3600;
/** One route for both levels: a live section (/directory/money-business) or a sub-category (/directory/tax-accounting). */
export function generateStaticParams() {
  const toolOnly = sections.filter((s) => s.status === "coming" && CATEGORY_TOOLS[s.slug]).map((s) => s.slug);
  return [
    ...sections.filter((s) => s.status === "live").map((s) => s.slug),
    ...toolOnly,
    ...categories.map((c) => c.slug),
  ].map((category) => ({ category }));
}
type P = { params: Promise<{ category: string }> };
const find = (slug: string) => {
  const section = sections.find((s) => s.slug === slug && s.status === "live");
  const sub = categories.find((x) => x.slug === slug);
  const coming = sections.find((s) => s.slug === slug && s.status === "coming" && CATEGORY_TOOLS[s.slug]);
  return { section, sub, coming };
};
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category } = await params;
  const { section, sub, coming } = find(category);
  return { title: section?.name ?? sub?.name ?? coming?.name, alternates: { canonical: `/directory/${category}` } };
}

export default async function Page({ params }: P) {
  const { category } = await params;
  const { section, sub, coming } = find(category);
  if (coming) {
    return (
      <>
        <PageHead
          kicker={`Directory · Category · ${coming.note ?? "Coming next edition"}`}
          title={coming.name}
          intro={`Listings for this category open in the ${coming.edition} edition. The free tools below work now.`}
        />
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
          <CategoryTools slug={coming.slug} />
        </div>
      </>
    );
  }
  if (section) {
    const items = listings.filter((l) => section.subcategories.includes(l.category));
    return (
      <>
        <PageHead kicker="Directory · Category" title={section.name} intro={`Every sub-category in ${section.name}.`} />
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
          <CategoryTiles section={section} />
          <ListingResults items={items} />
          <CategoryTools slug={section.slug} />
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
        <ListingResults items={listingsIn(sub.slug)} showSubFilter={false} subLabel={sub.name} />
        <div className="mt-12">
          <CategoryTools slug={sub.slug} />
        </div>
        <div className="mt-12">
          <UpcomingEvents title={`Upcoming events · ${sub.name}`} sub={sub.slug} />
        </div>
      </div>
    </>
  );
}
