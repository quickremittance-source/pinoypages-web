import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute, categories, listingsIn, sections } from "@/lib/guide";

export const metadata: Metadata = { title: "Directory", alternates: { canonical: "/directory" } };

/** One top-level category per section; sub-categories underneath. New categories are added in guide.json. */
export default function Page() {
  return (
    <>
      <PageHead kicker="Directory" title="Directory listings" intro="One category per section, in print page order." />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {sections.map((s) => (
          <section key={s.slug} aria-labelledby={`sec-${s.slug}`} data-section={s.slug} data-status={s.status}>
            <h2 id={`sec-${s.slug}`} className="text-2xl font-semibold text-sea">
              Category: {s.name}
              {s.status === "coming" && (
                <span className="ml-2 rounded bg-phred px-2 py-0.5 align-middle text-xs font-bold text-white">
                  {s.note ?? "Coming next edition"} · {s.edition}
                </span>
              )}
            </h2>
            {s.status === "live" ? (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {categories
                  .filter((c) => s.subcategories.includes(c.slug))
                  .map((c) => (
                    <li key={c.slug}>
                      <Link href={`/directory/${c.slug}`} className="block rounded-xl bg-white p-4 hover:bg-sand">
                        <span className="font-display text-coral-dk">p.{c.page}</span>{" "}
                        <strong className="text-sea">{c.name}</strong>
                        <span className="block text-sm">{listingsIn(c.slug).length} listings</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-xl border-2 border-dashed border-turqdk bg-white p-4">
                Its own section in the {s.edition} edition. Not open for listings yet.
              </p>
            )}
          </section>
        ))}
      </div>
      <AdGrid ads={adsForRoute("/directory")} />
    </>
  );
}
