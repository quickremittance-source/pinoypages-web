import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { categories, listings } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  return { title: listings.find((l) => l.id === id)?.name, alternates: { canonical: `/listing/${id}` } };
}

export default async function Page({ params }: P) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l) notFound();
  const c = categories.find((x) => x.slug === l.category)!;
  return (
    <>
      <PageHead kicker={c.name} page={c.page} title={l.name} />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <dl className="grid gap-2 rounded-2xl bg-white p-6">
          <div>
            <dt className="font-bold">Area</dt>
            <dd>{l.area}</dd>
          </div>
          <div>
            <dt className="font-bold">Phone</dt>
            <dd>{l.phone}</dd>
          </div>
          <div>
            <dt className="font-bold">Languages</dt>
            <dd>{l.languages}</dd>
          </div>
        </dl>
        <section className="mt-6 rounded-2xl border-2 border-dashed border-turqdk bg-aqua p-6" aria-labelledby="claim">
          <h2 id="claim" className="text-xl font-semibold text-sea">
            Is this your business?
          </h2>
          <p className="mt-2">Claim this free listing to correct details, or upgrade to Featured or a printed ad.</p>
          <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
            Claim / upgrade this listing
          </Link>
        </section>
      </div>
    </>
  );
}
