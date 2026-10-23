import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListingTracker } from "@/components/ListingTracker";
import { AdSlot } from "@/components/AdSlot";
import { abs } from "@/lib/guide";
import { publicListings } from "@/lib/public";
import { bizDescription, bizPath, bizTitle, byBizSlug, catName, landings, localBusinessLd, slugOf } from "@/lib/seo";

export const dynamicParams = false;
export function generateStaticParams() {
  return publicListings.map((l) => ({ slug: slugOf(l) }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const l = byBizSlug((await params).slug);
  if (!l) return {};
  return {
    title: { absolute: bizTitle(l) },
    description: bizDescription(l),
    alternates: { canonical: bizPath(l) },
  };
}

/** Free (unverified) public listing: name, category, area and the public contact details only. */
export default async function Page({ params }: P) {
  const l = byBizSlug((await params).slug);
  if (!l) notFound();
  const cat = catName(l.category);
  const landing = landings.find((x) => x.category === l.category && x.area === l.area);
  const dirQ = l.address ? encodeURIComponent(`${l.name}, ${l.address}, ${l.area}, ON`) : "";
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ListingTracker id={l.id} name={l.name} category={cat} />
      <JsonLd data={localBusinessLd(l, abs(bizPath(l)))} />
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/directory" className="text-turqdk underline">
          Directory
        </Link>
        {landing && (
          <>
            {" / "}
            <Link href={`/${landing.slug}`} className="text-turqdk underline">
              {landing.heading}
            </Link>
          </>
        )}
      </nav>
      <p className="kicker mt-4">
        {cat} · {l.area}
      </p>
      <h1 className="mt-1 text-3xl font-extrabold text-ink">{l.name}</h1>
      <AdSlot placement="premium-top-spot" category={l.category} />
      <div className="card mt-4 p-5" data-tier="free">
        <dl className="grid gap-3 sm:grid-cols-2">
          {l.address && (
            <div>
              <dt className="text-sm font-semibold text-muted">Address</dt>
              <dd className="text-lg font-semibold">
                {l.address}, {l.area}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-muted">Area</dt>
            <dd className="text-lg font-semibold">{l.area}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          {l.phone && (
            <a className="btn" data-track="click_call" href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`}>
              Call {l.phone}
            </a>
          )}
          {dirQ && (
            <a
              className="btn"
              data-track="click_directions"
              rel="noopener"
              href={`https://www.google.com/maps/search/?api=1&query=${dirQ}`}
            >
              Directions
            </a>
          )}
          {l.website && (
            <a className="btn" data-track="click_website" rel="nofollow noopener" href={l.website}>
              Website
            </a>
          )}
          {l.messenger && (
            <a className="btn" data-track="click_messenger" rel="nofollow noopener" href={l.messenger}>
              Messenger
            </a>
          )}
        </div>
        <p className="mt-4 text-sm text-muted">Free listing · unverified.</p>
      </div>
      <section
        className="mt-6 rounded-2xl border-2 border-dashed border-turqdk/50 bg-aqua/50 p-6"
        aria-labelledby="claim"
      >
        <h2 id="claim" className="text-xl font-bold text-ink">
          Is this your business?
        </h2>
        <p className="mt-2">Claim this listing to correct details, advertise in print, or get Verified.</p>
        <Link className="btn mt-4" href={`/advertise?listing=${l.id}`}>
          Advertise or claim this listing
        </Link>
      </section>
    </div>
  );
}
