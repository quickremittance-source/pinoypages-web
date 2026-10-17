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
        intro={`${open} of ${ads.length} ad spaces open. Every ad lives on its matching web page, and is shown in the printed proof copy for advertisers.`}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <p className="rounded-xl bg-sand p-4">
          <strong>{brand.pitch}</strong> {brand.productNote} You are buying web presence: your ad appears on its
          matching page with a tap-to-open button to your listing page, and its QR (built into a fixed corner) brings
          people from your own cards, flyers and signs to the same page. Every ad includes Featured (branded QR, Save
          contact, monthly counts). The printed guide is a proof copy: you get your own copy showing your placement,
          plus a year-end summary of your scan and click counts. We report counts; we do not guarantee results.
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
