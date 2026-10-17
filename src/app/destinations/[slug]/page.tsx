import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { destinations, pages } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  return { title: destinations.find((d) => d.slug === slug)?.name, alternates: { canonical: `/destinations/${slug}` } };
}

export default async function Page({ params }: P) {
  const { slug } = await params;
  const d = destinations.find((x) => x.slug === slug);
  if (!d) notFound();
  const page = pages.find((p) => p.route === `/destinations/${slug}`)?.page;
  return (
    <>
      <PageHead kicker={d.region} page={page} title={d.name} intro={d.blurb} />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="rounded-xl bg-white p-4">
          <strong className="text-coral-dk">Money tip:</strong> {d.tip}
        </p>
      </div>
    </>
  );
}
