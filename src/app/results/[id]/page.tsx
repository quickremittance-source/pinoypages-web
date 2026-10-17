import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { StatsChart } from "@/components/StatsChart";
import { last12 } from "@/lib/analytics/events";
import { store } from "@/lib/analytics/store";
import { validResultsToken } from "@/lib/analytics/token";
import { isPaid, listingById } from "@/lib/guide";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your results", robots: { index: false, follow: false } };

type P = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> };

/** Private per-listing results page, reached only by its signed link. */
export default async function Page({ params, searchParams }: P) {
  const { id } = await params;
  const { t } = await searchParams;
  const l = listingById(id);
  if (!l || !validResultsToken(id, t)) notFound();
  const months = last12();
  return (
    <>
      <PageHead kicker="Private results" title={l.name} intro="Counts from your page and tracked links, by month." />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        {isPaid(l) ? (
          <>
            <StatsChart stats={await store().get(id)} months={months} />
            <p className="text-sm">
              Views are counted once per page load; scans and clicks once per tap. Bots are ignored. No personal data is
              collected. We report counts as they are; they are not a promise of future results.
            </p>
          </>
        ) : (
          <section className="rounded-2xl border-2 border-dashed border-turqdk bg-aqua p-6" aria-labelledby="up">
            <h2 id="up" className="text-xl font-semibold text-sea">
              Your listing is being counted
            </h2>
            <p className="mt-2">
              Results are shown to Verified, Verified Plus and Verified Ad members. Upgrade to see your monthly views
              and clicks.
            </p>
            <Link className="btn mt-4" href={`/upgrade?listing=${l.id}`}>
              Upgrade to see your results
            </Link>
          </section>
        )}
      </div>
    </>
  );
}
