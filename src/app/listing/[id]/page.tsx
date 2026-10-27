import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeStateChip, LogoTile, PartnerStars, SampleChip, VerifiedKabayan } from "@/components/Badge";
import { QrSection } from "@/components/QrSection";
import { ViewBeacon } from "@/components/ViewBeacon";
import { ZCardBridge } from "@/components/ZCardBridge";
import { badgeState, brand, categories, events, isPaid, listings, mutualPartners, sections } from "@/lib/guide";
import { dayLabel } from "@/lib/cal";

export const dynamicParams = false;
export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  return { title: listings.find((l) => l.id === id)?.name, alternates: { canonical: `/listing/${id}` } };
}

function Crumbs({ sub, slug }: { sub: string; slug: string }) {
  const parent = sections.find((s) => s.subcategories.includes(slug));
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
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
      <Link href={`/directory/${slug}`} className="text-turqdk underline">
        {sub}
      </Link>
    </nav>
  );
}

/**
 * Online entry mirrors the print entry. Free = unverified: name + contact only (no badge, QR, Save contact, ZCard).
 * Verified gets the ZCard bridge (where QR scans land) and is ELIGIBLE for the badge; the visit earns it.
 */
export default async function Page({ params }: P) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l) notFound();
  const c = categories.find((x) => x.slug === l.category)!;
  const paid = isPaid(l);

  if (!paid) {
    return (
      <>
        <ViewBeacon id={l.id} />
        <div className="border-b border-sand bg-white">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Crumbs sub={c.name} slug={c.slug} />
            <p className="kicker mt-4">
              {c.name} · Print page {c.page}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-ink">{l.name}</h1>
            <div className="card mt-4 p-5" data-tier={l.tier}>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-semibold text-muted">Phone</dt>
                  <dd className="text-lg font-semibold">{l.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-muted">Area</dt>
                  <dd className="text-lg font-semibold">{l.area}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted">Free listing · unverified. {l.sample && <SampleChip />}</p>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
          <QrSection l={l} />
          <section
            className="rounded-2xl border-2 border-dashed border-turqdk/50 bg-aqua/50 p-6"
            aria-labelledby="claim"
          >
            <h2 id="claim" className="text-xl font-bold text-ink">
              Is this your business?
            </h2>
            <p className="mt-2">
              Claim this listing to correct details, or get Verified ($99 one-time + HST, everything included).{" "}
              {brand.badgeRule}
            </p>
            <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
              Claim / upgrade this listing
            </Link>
          </section>
        </div>
      </>
    );
  }

  const state = badgeState(l);
  const partners = mutualPartners(l).length;
  return (
    <>
      <ViewBeacon id={l.id} />
      <div className="pinstripe-bg border-b border-sand bg-aqua/50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Crumbs sub={c.name} slug={c.slug} />
          <div className="mt-5 flex flex-wrap items-start gap-4">
            <LogoTile l={l} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="kicker">
                {c.name} · Print page {c.page}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{l.name}</h1>
              {l.tagline && <p className="mt-1 text-lg text-muted">{l.tagline}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <VerifiedKabayan l={l} withDate />
                <BadgeStateChip l={l} />
                {state === "active" && <PartnerStars n={partners} />}
                {l.sample && <SampleChip />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card p-6" data-tier={l.tier} aria-labelledby="about">
            <h2 id="about" className="text-xl font-bold text-ink">
              About
            </h2>
            {l.story && (
              <p className="mt-3 text-lg leading-relaxed" data-testid="owner-story">
                {l.story}
              </p>
            )}
            {l.quote && (
              <figure className="mt-4 border-l-4 border-phred pl-4" data-testid="owner-quote">
                <blockquote className="text-lg font-semibold text-ink">“{l.quote}”</blockquote>
                <figcaption className="mt-1 text-sm text-muted">
                  {l.zcard?.person}, {l.zcard?.role} · SAMPLE quote
                </figcaption>
              </figure>
            )}
            {l.why && (
              <p className="mt-4 rounded-xl bg-aqua/70 p-3 text-sm" data-testid="why-choose">
                <strong className="text-sea">Why clients choose us:</strong> {l.why}
              </p>
            )}
            {l.services && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Services">
                {l.services.map((s) => (
                  <li key={s} className="rounded-full bg-aqua px-3 py-1 text-sm font-semibold text-sea">
                    {s}
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-semibold text-muted">Phone</dt>
                <dd className="font-semibold">{l.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Area</dt>
                <dd className="font-semibold">{l.area}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Spoken here</dt>
                <dd className="font-semibold">{l.languages}</dd>
              </div>
              {l.hours && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-semibold text-muted">Hours</dt>
                  <dd className="font-semibold">{l.hours}</dd>
                </div>
              )}
              {l.serviceArea && (
                <div>
                  <dt className="text-sm font-semibold text-muted">Service area</dt>
                  <dd className="font-semibold">{l.serviceArea}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 grid grid-cols-3 gap-2" aria-label="Photos">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="pinstripe-bg grid aspect-video place-items-center rounded-lg bg-aqua text-xs font-semibold text-sea"
                >
                  Photo {n}
                </div>
              ))}
            </div>
          </section>
          {events.some((e) => e.listing === l.id) && (
            <section className="card p-6" aria-labelledby="hosted">
              <h2 id="hosted" className="text-xl font-bold text-ink">
                Events hosted
              </h2>
              <ul className="mt-3 space-y-2">
                {events
                  .filter((e) => e.listing === l.id)
                  .map((e) => (
                    <li key={e.id}>
                      <Link href={`/calendar/${e.id}`} className="font-semibold text-turqdk underline">
                        {e.name}
                      </Link>{" "}
                      <span className="text-sm text-muted">
                        · {dayLabel(e.date)} · {e.city}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
          <QrSection l={l} />
        </div>
        <aside aria-label="ZCard" className="lg:sticky lg:top-24 lg:self-start">
          <ZCardBridge l={l} />
        </aside>
      </div>
    </>
  );
}
