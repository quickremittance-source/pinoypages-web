import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { JsonLd } from "@/components/JsonLd";
import { Postcard } from "@/components/travel/Postcard";
import { PhotoCredit } from "@/components/travel/PhotoCredit";
import { TravelAdSlot } from "@/components/travel/TravelAdSlot";
import { abs } from "@/lib/guide";
import { bizPath } from "@/lib/seo";
import {
  creditFor,
  destination,
  destinations,
  HUBS,
  inHub,
  relatedModules,
  seoTitle,
  toCard,
  travelPath,
  travelSlotId,
} from "@/lib/travel";

type P = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const d = destination((await params).slug);
  if (!d) return {};
  const c = creditFor(d.slug);
  return {
    title: seoTitle(d),
    description: d.summary,
    alternates: { canonical: travelPath(d) },
    openGraph: c ? { images: [{ url: c.file, width: c.width, height: c.height }] } : undefined,
  };
}

export default async function DestinationPage({ params }: P) {
  const d = destination((await params).slug);
  if (!d) notFound();
  const c = creditFor(d.slug);
  const hub = HUBS.find((h) => h.id === d.hub)!;
  const modules = relatedModules(d);
  const more = inHub(d.hub)
    .filter((x) => x.slug !== d.slug)
    .slice(0, 3);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": d.kind,
          name: d.name,
          description: d.summary,
          url: abs(travelPath(d)),
          ...(c ? { image: abs(c.file) } : {}),
          geo: { "@type": "GeoCoordinates", latitude: d.geo[0], longitude: d.geo[1] },
          containedInPlace: { "@type": "Place", name: d.region },
        }}
      />
      <PageHead kicker={`Travel · ${hub.title}`} title={seoTitle(d)} intro={d.summary}>
        <nav aria-label="Breadcrumb" className="mt-3 text-sm">
          <Link href="/travel" className="text-turqdk underline">
            Travel
          </Link>
          {" / "}
          <span aria-current="page">{d.name}</span>
        </nav>
      </PageHead>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article data-testid="travel-guide">
          <div className="mx-auto max-w-xl" data-testid="travel-hero">
            <Postcard card={toCard(d)} placement="travel-hero" eager />
            {c && <PhotoCredit c={c} className="mt-3 text-center" />}
          </div>
          <div className="prose-pp mt-10 space-y-4 text-lg leading-relaxed text-ink">
            {d.guide.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Best season", "Pinakamainam na panahon", d.bestSeason, "best-season"],
              ["Getting there from Toronto", "Paano pumunta", d.gettingThere, "getting-there"],
              ["Filipino-friendly tip", "Payo para sa Kabayan", d.tip, "pinoy-tip"],
            ].map(([t, tl, body, id]) => (
              <div key={id} className="card p-4" data-testid={id}>
                <dt>
                  <span className="block font-bold text-ink">{t}</span>
                  <span className="block text-xs text-muted italic" lang="tl">
                    {tl}
                  </span>
                </dt>
                <dd className="mt-2 text-sm text-ink">{body}</dd>
              </div>
            ))}
          </dl>
          {modules.length > 0 && (
            <section className="mt-10" aria-labelledby="related-h" data-testid="travel-related">
              <h2 id="related-h" className="text-xl font-extrabold text-ink">
                From the directory
              </h2>
              <p className="text-sm text-muted">Free, unverified listings compiled from public information.</p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {modules.map((m) => (
                  <div key={m.category + m.label} className="card p-4" data-related={m.category}>
                    <h3 className="font-bold text-ink">{m.label}</h3>
                    <ul className="mt-2 space-y-1 text-sm">
                      {m.items.map((l) => (
                        <li key={l.id}>
                          <Link href={bizPath(l)} className="text-turqdk underline">
                            {l.name}
                          </Link>{" "}
                          <span className="text-muted">· {l.area}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/directory?category=${m.category}`}
                      className="mt-3 inline-block text-sm font-semibold text-sea"
                    >
                      All {m.name} listings →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
        <aside className="space-y-8">
          <TravelAdSlot slotId={travelSlotId(d.slug)} destination={d.slug} />
          <div>
            <p className="kicker">More postcards</p>
            <ul className="mt-4 space-y-8">
              {more.map((x, i) => (
                <li key={x.slug}>
                  <Postcard card={toCard(x)} index={i + 1} placement="travel-more" size="sm" />
                </li>
              ))}
            </ul>
            <Link href="/travel" className="mt-6 inline-block text-sm font-semibold text-sea">
              All travel guides →
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
