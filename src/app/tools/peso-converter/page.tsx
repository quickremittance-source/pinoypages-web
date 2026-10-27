import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { fetchCadPhp } from "@/lib/fx";
import { PESO_COPY, bi } from "@/lib/peso";
import { PesoTool } from "./PesoTool";

export const metadata: Metadata = {
  title: "Peso converter · Tagapagpalit ng piso",
  description: PESO_COPY.intro.en,
  alternates: { canonical: "/tools/peso-converter" },
};

export const revalidate = 3600;

export default async function Page() {
  const quote = await fetchCadPhp();
  return (
    <>
      <PageHead kicker={bi(PESO_COPY.kicker)} title={PESO_COPY.title.en} intro={PESO_COPY.intro.en}>
        <p className="mt-2 text-muted">{PESO_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{PESO_COPY.intro.tl}</p>
      </PageHead>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PesoTool
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
