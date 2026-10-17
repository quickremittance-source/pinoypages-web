import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { VerifiedKabayan } from "@/components/Badge";
import { QrSection } from "@/components/QrSection";
import { ViewBeacon } from "@/components/ViewBeacon";
import { ZCardBridge } from "@/components/ZCardBridge";
import { brand, categories, isFeatured, isPaid, listings, tierName } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  return { title: listings.find((l) => l.id === id)?.name, alternates: { canonical: `/listing/${id}` } };
}

/**
 * Online entry mirrors the print entry. Free = unverified: name + contact only (no badge, QR, Save contact, ZCard).
 * Paid tiers get the ZCard bridge (where QR scans land) and are ELIGIBLE for the badge; the visit earns it.
 */
export default async function Page({ params }: P) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l) notFound();
  const c = categories.find((x) => x.slug === l.category)!;
  const paid = isPaid(l);
  const featured = isFeatured(l);
  return (
    <>
      <ViewBeacon id={l.id} />
      <PageHead kicker={c.name} page={c.page} title={l.name} intro={featured ? l.tagline : undefined} />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {paid && <ZCardBridge l={l} />}
        <div className="mt-6 rounded-2xl bg-white p-6" data-tier={l.tier}>
          {paid && (
            <p className="mb-3 text-sm">
              <strong>{tierName(l.tier)}</strong> <VerifiedKabayan l={l} />
            </p>
          )}
          <dl className="grid gap-2">
            <div>
              <dt className="font-bold">Phone</dt>
              <dd>{l.phone}</dd>
            </div>
            <div>
              <dt className="font-bold">Area</dt>
              <dd>{l.area}</dd>
            </div>
          </dl>
          {paid && (
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="btn bg-sea" href={`/go/${l.id}?via=map`}>
                Directions
              </a>
              {l.website && (
                <a className="btn bg-sea" href={`/go/${l.id}?via=web`} rel="nofollow">
                  Website
                </a>
              )}
            </div>
          )}
          {featured && (
            <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Photos">
              {[1, 2, 3].map((n) => (
                <div key={n} className="grid aspect-video place-items-center rounded-lg bg-aqua text-sm text-sea">
                  Photo {n}
                </div>
              ))}
            </div>
          )}
          {!paid && <p className="mt-4 text-sm">Free listing · unverified.</p>}
        </div>
        <QrSection l={l} />
        {!featured && (
          <section
            className="mt-6 rounded-2xl border-2 border-dashed border-turqdk bg-aqua p-6"
            aria-labelledby="claim"
          >
            <h2 id="claim" className="text-xl font-semibold text-sea">
              Is this your business?
            </h2>
            <p className="mt-2">
              Claim this listing to correct details, or upgrade to Verified, Verified Plus or a Verified Ad.{" "}
              {brand.badgeRule}
            </p>
            <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
              Claim / upgrade this listing
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
