import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { fetchCadPhp } from "@/lib/fx";
import { REMITTANCE_COPY, bi } from "@/lib/remittance";
import { RemittanceTool } from "./RemittanceTool";

export const metadata: Metadata = {
  title: "Compare remittance providers · Ihambing ang mga padala",
  description: REMITTANCE_COPY.intro.en,
  alternates: { canonical: "/tools/remittance-compare" },
};

export const revalidate = 3600;

export default async function Page() {
  const quote = await fetchCadPhp();
  return (
    <>
      <PageHead kicker={bi(REMITTANCE_COPY.kicker)} title={REMITTANCE_COPY.title.en} intro={REMITTANCE_COPY.intro.en}>
        <p className="mt-2 text-muted">{REMITTANCE_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{REMITTANCE_COPY.intro.tl}</p>
      </PageHead>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <RemittanceTool
          quote={
            quote
              ? {
                  rate: quote.rate,
                  asOf: quote.asOf,
                  sourceName: quote.sourceName,
                  sourceUrl: quote.sourceUrl,
                  fetchedAt: quote.fetchedAt,
                }
              : null
          }
        />
      </div>
    </>
  );
}
