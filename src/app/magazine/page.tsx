import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { adsForRoute, brand, pages } from "@/lib/guide";
import { editionArticles, KIND_LABEL, sampleStories } from "@/lib/magazine";
import { SignupForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Magazine", alternates: { canonical: "/magazine" } };
const SEASON = { spring: "Spring", summer: "Summer", fall: "Fall" } as const;

export default function Page() {
  const [lead, ...rest] = sampleStories;
  return (
    <>
      <PageHead
        kicker={`${brand.editionLabel} · Magazine`}
        title="Magazine"
        intro="Business profiles, practical money guides and community reporting from the Filipino business community in the GTA."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section aria-labelledby="stories">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="stories" className="text-2xl font-bold text-ink">
              Stories <span className="sample-chip align-middle">Sample</span>
            </h2>
            <p className="text-sm text-muted">Sample stories about fictional businesses, for the pilot.</p>
          </div>
          {lead && (
            <Link
              href={`/magazine/${lead.slug}`}
              className="card group mt-4 grid overflow-hidden md:grid-cols-[1.1fr_1fr]"
              data-story={lead.slug}
            >
              <div className="pinstripe-bg grid min-h-48 place-items-center bg-aqua p-8">
                <p className="text-center text-sm font-bold tracking-[0.2em] text-sea uppercase">
                  {lead.kind ? KIND_LABEL[lead.kind] : "Feature"}
                </p>
              </div>
              <div className="p-6">
                <p className="kicker">
                  {lead.kind ? KIND_LABEL[lead.kind] : "Feature"} · {lead.season ? SEASON[lead.season] : ""}
                </p>
                <h3 className="mt-2 text-2xl leading-tight font-extrabold text-ink group-hover:text-sea">
                  {lead.title}
                </h3>
                <p className="mt-2 text-muted">{lead.dek}</p>
                <p className="mt-3 text-sm text-muted">By {lead.author}</p>
              </div>
            </Link>
          )}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <li key={a.slug} data-story={a.slug}>
                <Link
                  href={`/magazine/${a.slug}`}
                  className="card group flex h-full flex-col border-t-4 border-t-turq p-5"
                >
                  <p className="kicker">
                    {a.kind ? KIND_LABEL[a.kind] : "Feature"} · {a.season ? SEASON[a.season] : ""}
                  </p>
                  <h3 className="mt-2 text-lg leading-snug font-bold text-ink group-hover:text-sea">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted">{a.dek}</p>
                  <p className="mt-auto pt-3 text-xs text-muted">By {a.author}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="edition">
          <h2 id="edition" className="text-2xl font-bold text-ink">
            In the printed edition
          </h2>
          <p className="mt-1 text-muted">From the front of the edition, in English and Tagalog.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {editionArticles.map((a) => {
              const p = pages.find((x) => x.route === `/magazine/${a.slug}`)?.page;
              return (
                <li key={a.slug}>
                  <Link href={`/magazine/${a.slug}`} className="card block p-4 hover:shadow-md">
                    {p && <span className="font-bold text-phred">p.{p} </span>}
                    <strong className="text-ink">{a.title}</strong>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <UpcomingEvents title="From the calendar" limit={3} />

        <section className="mx-auto max-w-3xl" aria-labelledby="signup">
          <h2 id="signup" className="mb-3 text-2xl font-bold text-ink">
            Get the monthly member email
          </h2>
          <SignupForm />
        </section>
      </div>
      <AdGrid ads={adsForRoute("/magazine")} />
    </>
  );
}
