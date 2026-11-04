import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { EVENT_LABEL, last12, sum, type EventName } from "@/lib/analytics/events";
import { store } from "@/lib/analytics/store";
import { resultsToken } from "@/lib/analytics/token";
import { isAdmin } from "@/lib/adminSession";
import { listings } from "@/lib/guide";
import { SiteAnalytics } from "@/components/admin/SiteAnalytics";
import { parseRange } from "@/lib/siteAnalytics";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · analytics", robots: { index: false, follow: false } };
const COLS: EventName[] = ["view", "scan", "call", "map", "website", "tap"];

/** Admin table of all listings (last 12 months). Needs an admin session; 404 otherwise or if ADMIN_KEY unset. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  if (!(await isAdmin())) notFound();
  const all = await store().all();
  const months = last12();
  return (
    <>
      <PageHead
        kicker="Admin"
        title="Analytics"
        intro={`Site traffic for the chosen range; listing table covers the last 12 months (${months[0]} to ${months[11]}).`}
      />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        <SiteAnalytics range={parseRange(from, to)} />
        <p>
          <a className="underline" href={`/admin/advertisers`}>
            Advertisers and their private stats links
          </a>
        </p>
        <h2 className="text-xl font-bold">Listings</h2>
        <div className="overflow-x-auto" role="region" aria-label="All listings" tabIndex={0}>
          <table className="w-full bg-white text-left text-sm">
            <thead className="bg-sea text-white">
              <tr>
                <th scope="col" className="p-2">
                  Listing
                </th>
                <th scope="col" className="p-2">
                  Tier
                </th>
                {COLS.map((c) => (
                  <th key={c} scope="col" className="p-2">
                    {EVENT_LABEL[c]}
                  </th>
                ))}
                <th scope="col" className="p-2">
                  Results link
                </th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t border-sand" data-listing={l.id}>
                  <th scope="row" className="p-2">
                    {l.name}
                  </th>
                  <td className="p-2">{l.tier}</td>
                  {COLS.map((c) => (
                    <td key={c} className="p-2" data-event={c}>
                      {sum(all[l.id] ?? {}, months, c)}
                    </td>
                  ))}
                  <td className="p-2">
                    <a className="underline" href={`/results/${l.id}?t=${resultsToken(l.id)}`}>
                      open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <a className="underline" href={`/admin/analytics/summary`}>
            Monthly summary emails for paid listings (drafts only; nothing is sent)
          </a>
        </p>
      </div>
    </>
  );
}
