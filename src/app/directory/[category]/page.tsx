import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { ListingCard } from "@/components/ListingCard";
import { categories, listingsIn } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}
type P = { params: Promise<{ category: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category } = await params;
  const c = categories.find((x) => x.slug === category);
  return { title: c?.name, alternates: { canonical: `/directory/${category}` } };
}

export default async function Page({ params }: P) {
  const { category } = await params;
  const c = categories.find((x) => x.slug === category);
  if (!c) notFound();
  const items = listingsIn(c.slug);
  return (
    <>
      <PageHead
        kicker="Directory"
        page={c.page}
        title={c.name}
        intro="Sample listings shown until real listings are verified."
      />
      <ul className="mx-auto grid max-w-5xl gap-3 px-4 py-8 sm:grid-cols-2">
        {items.map((l) => (
          <ListingCard key={l.id} l={l} />
        ))}
      </ul>
    </>
  );
}
