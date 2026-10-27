import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { MASS_COPY, bi, filterMassEvents, massEvents, parseMassFilters } from "@/lib/mass";
import { MassFilterForm } from "./MassFilterForm";
import { MassList } from "./MassList";

export const metadata: Metadata = {
  title: "Filipino Mass & Simbang Gabi · Misang Pilipino",
  description: MASS_COPY.intro.en,
  alternates: { canonical: "/tools/mass-finder" },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseMassFilters(await searchParams);
  const filtered = filterMassEvents(massEvents(), filters);

  return (
    <>
      <PageHead kicker={bi(MASS_COPY.kicker)} title={MASS_COPY.title.en} intro={MASS_COPY.intro.en}>
        <p className="mt-2 text-muted">{MASS_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{MASS_COPY.intro.tl}</p>
      </PageHead>
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <MassFilterForm filters={filters} resultCount={filtered.length} />
        <MassList events={filtered} />
      </div>
    </>
  );
}
