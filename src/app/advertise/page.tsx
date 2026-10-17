import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { InquiryForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { adsForRoute, ads, brand } from "@/lib/guide";

export const metadata: Metadata = { title: "Advertise", alternates: { canonical: "/advertise" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const { slot } = await searchParams;
  const valid = ads.find((a) => a.id === slot)?.id;
  const open = ads.filter((a) => a.status !== "sold").length;
  return (
    <>
      <PageHead
        kicker="Advertise"
        title={`Advertise in ${brand.editionName}`}
        intro={`April 2027 edition (preview): ${open} of ${ads.length} ad spaces open. ${brand.adsNote} No ads are sold in the Pilot Edition.`}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <p className="rounded-xl bg-sand p-4">
          <strong>{brand.pitch}</strong> {brand.productNote} The Pilot Edition has two tiers: Free, or Verified ($199,
          everything included). {brand.adsNote} The ad spaces below show the April 2027 edition (preview): register
          interest now and we will contact you when ad rates are announced. {brand.badgeRule} We report counts; we do
          not guarantee results.
        </p>
        <PlanTable />
        <section aria-labelledby="inq">
          <h2 id="inq" className="mb-3 text-2xl font-semibold text-sea">
            Ask about an ad{valid ? ` (space ${valid})` : ""}
          </h2>
          <InquiryForm slot={valid} />
        </section>
      </div>
      <AdGrid ads={adsForRoute("/advertise")} />
    </>
  );
}
