import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { bizPath, catName, landings } from "@/lib/seo";

/** Category + area landing pages, generated only where listings exist (e.g. /filipino-restaurants-scarborough). */
export const dynamicParams = false;
export function generateStaticParams() {
  return landings.map((l) => ({ landing: l.slug }));
}
type P = { params: Promise<{ landing: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { landing } = await params;
  const p = landings.find((l) => l.slug === landing);
  if (!p) return {};
  return {
    title: { absolute: `${p.heading} – Pinoy Pages directory` },
    description: `${p.listings.length} ${catName(p.category).toLowerCase()} listing${p.listings.length > 1 ? "s" : ""} in ${p.area}, from the Pinoy Pages GTA Filipino business directory.`,
    alternates: { canonical: `/${p.slug}` },
  };
}
export default async function Page({ params }: P) {
  const { landing } = await params;
  const p = landings.find((l) => l.slug === landing);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/directory" className="text-turqdk underline">
          Directory
        </Link>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold text-ink">{p.heading}</h1>
      <p className="mt-2 text-muted">
        {p.listings.length} free, unverified listing{p.listings.length > 1 ? "s" : ""} compiled from public information.
      </p>
      <AdSlot placement="category-spotlight" category={p.category} />
      <ul className="mt-4 divide-y divide-sand rounded-xl border border-sand bg-white">
        {p.listings.map((l) => (
          <li key={l.id} className="px-4 py-3">
            <Link href={bizPath(l)} className="font-bold text-ink underline">
              {l.name}
            </Link>
            <span className="text-sm text-muted">{l.address ? ` · ${l.address}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
