import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { listingById } from "@/lib/guide";
import { storyIdeas } from "@/lib/ideas";

export const metadata: Metadata = { title: "Story ideas (editorial)", robots: { index: false, follow: false } };
const SEASON = { spring: "Spring", summer: "Summer", fall: "Fall" } as const;

/** Unlisted editorial pipeline: not linked from the site, not in the sitemap, noindex. */
export default function Page() {
  // Route audit 28 Oct: internal editorial notes are not public on production.
  if (process.env.VERCEL_ENV === "production") notFound();
  const written = storyIdeas.filter((i) => i.status === "written").length;
  return (
    <>
      <PageHead
        kicker="Editorial · Unlisted · SAMPLE"
        title="Story ideas"
        intro={`${storyIdeas.length} ideas for the pilot magazine, ${written} written as sample articles. Every linked business is a SAMPLE.`}
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="overflow-x-auto" role="region" aria-label="Story ideas pipeline" tabIndex={0}>
          <table className="card w-full min-w-[760px] text-left text-sm">
            <thead className="bg-sea text-white">
              <tr>
                <th scope="col" className="p-3">
                  #
                </th>
                <th scope="col" className="p-3">
                  Title and angle
                </th>
                <th scope="col" className="p-3">
                  Category
                </th>
                <th scope="col" className="p-3">
                  Sample business
                </th>
                <th scope="col" className="p-3">
                  Season
                </th>
                <th scope="col" className="p-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {storyIdeas.map((i, n) => {
                const l = i.listing ? listingById(i.listing) : undefined;
                return (
                  <tr key={i.id} className="border-t border-sand align-top" data-idea={i.id} data-status={i.status}>
                    <td className="p-3 text-muted">{n + 1}</td>
                    <th scope="row" className="p-3 font-normal">
                      <strong className="block text-ink">{i.title}</strong>
                      <span className="text-muted">{i.angle}</span>
                    </th>
                    <td className="p-3">{i.category}</td>
                    <td className="p-3">
                      {l ? (
                        <Link href={`/listing/${l.id}`} className="font-semibold text-turqdk underline">
                          {l.name}
                        </Link>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td className="p-3">{SEASON[i.season]}</td>
                    <td className="p-3">
                      {i.status === "written" ? (
                        <Link href={`/magazine/${i.article}`} className="font-semibold text-phred underline">
                          Written · read
                        </Link>
                      ) : (
                        <span className="rounded bg-sand px-2 py-0.5 text-xs font-bold">Idea</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
